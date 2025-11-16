import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Initialize Twilio client
let twilioClient = null
function getTwilioClient() {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }
    
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

/**
 * Campaign Service - Handles sending campaigns via SMS/WhatsApp
 */
export class CampaignService {
  constructor(businessId) {
    this.businessId = businessId
  }

  /**
   * Send campaign to customers
   * 
   * DEMO MODE: If DEMO_WHATSAPP_NUMBER is set in .env and whatsappNumber is provided,
   * all messages will be sent to the demo number but counted as if sent to all customers
   * 
   * @param {Object} campaignData - Campaign data
   * @param {string[]} [campaignData.customMessages] - Optional array of custom messages (one per customer in same order)
   */
  async sendCampaign(campaignData) {
    const {
      campaignName,
      campaignType,
      campaignValue,
      discountCode,
      customerIds,
      whatsappNumber,
      customMessages
    } = campaignData

    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', this.businessId)
        .in('id', customerIds)
        .not('phone', 'is', null)

      if (customersError) throw customersError
      if (!customers || customers.length === 0) {
        throw new Error('No customers found with phone numbers')
      }

      // Format discount value
      const discountText = campaignType === 'percentage'
        ? `${campaignValue}% OFF`
        : `$${parseFloat(campaignValue).toFixed(2)} OFF`

      // Use custom messages if provided, otherwise generate personalized messages
      let messages
      if (customMessages && Array.isArray(customMessages) && customMessages.length === customers.length) {
        // Use provided custom messages
        messages = customMessages
      } else {
        // Generate personalized messages using OpenRouter LLM for each customer
        messages = await this.generateCampaignMessages(
          campaignName,
          discountText,
          discountCode,
          customers,
          whatsappNumber
        )
      }

      // DEMO MODE: Hardcode your WhatsApp number here for testing
      // Set this in your backend/.env file: DEMO_WHATSAPP_NUMBER=+your_number_here
      const DEMO_WHATSAPP_NUMBER = process.env.DEMO_WHATSAPP_NUMBER || null
      // In demo mode we always route messages to DEMO_WHATSAPP_NUMBER, regardless of what the frontend sends
      const isDemoMode = !!DEMO_WHATSAPP_NUMBER

      // Send messages via Twilio
      const client = getTwilioClient()
      const fromNumber = process.env.TWILIO_PHONE_NUMBER
      
      if (!fromNumber) {
        throw new Error('Twilio phone number not configured')
      }

      const results = {
        sent: 0,
        failed: 0,
        errors: []
      }

      // Send to each customer
      for (let i = 0; i < customers.length; i++) {
        const customer = customers[i]
        try {
          if (!customer.phone) continue

          // Get personalized message for this customer
          const message = messages[i] || this.generateCampaignMessage(campaignName, discountText, discountCode, whatsappNumber)

          // DEMO MODE: Send to hardcoded number but count as if sent to customer
          let toNumber
          if (isDemoMode) {
            // In demo mode, send to your hardcoded number
            toNumber = DEMO_WHATSAPP_NUMBER
            console.log(`[DEMO MODE] Sending to demo number ${toNumber} (pretending to send to ${customer.name} at ${customer.phone})`)
          } else {
            // Normal mode: send to customer's actual number
            toNumber = customer.phone.trim()
            if (!toNumber.startsWith('+')) {
              // Assume US number if no country code
              if (toNumber.startsWith('1')) {
                toNumber = '+' + toNumber
              } else {
                toNumber = '+1' + toNumber.replace(/\D/g, '')
              }
            }
          }

          // Use WhatsApp in demo mode, or when an explicit WhatsApp number is provided
          if (isDemoMode || whatsappNumber) {
            // WhatsApp format: whatsapp:+[number]
            const whatsappTo = toNumber.startsWith('whatsapp:') ? toNumber : `whatsapp:${toNumber}`
            const whatsappFrom = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`
            
            await client.messages.create({
              body: message,
              from: whatsappFrom,
              to: whatsappTo
            })
          } else {
            // SMS
            await client.messages.create({
              body: message,
              from: fromNumber,
              to: toNumber
            })
          }

          results.sent++
        } catch (error) {
          console.error(`Failed to send to ${customer.name} (${customer.phone}):`, error)
          results.failed++
          results.errors.push({
            customer: customer.name,
            phone: customer.phone,
            error: error.message
          })
        }
      }

      // Log campaign send in database (optional - you could create a campaign_sends table)
      
      return results
    } catch (error) {
      console.error('Campaign send error:', error)
      throw error
    }
  }

  /**
   * Generate personalized campaign messages using OpenRouter LLM
   */
  async generateCampaignMessages(campaignName, discountText, discountCode, customers, whatsappNumber) {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY
    
    if (!openRouterApiKey) {
      // Fallback to rule-based message
      return customers.map(() => this.generateCampaignMessage(campaignName, discountText, discountCode, whatsappNumber))
    }

    const messages = []
    const isWhatsApp = !!whatsappNumber

    // Generate personalized message for each customer
    for (const customer of customers) {
      try {
        const prompt = `Generate a personalized SMS/WhatsApp message for a discount campaign.

Business Campaign: ${campaignName}
Discount: ${discountText}
Discount Code: ${discountCode}
Customer Name: ${customer.name}
Service Context: ${customer.preferred_language || 'English'} speaking customer

Requirements:
- Keep it personal and friendly
- Mention the customer's name naturally
- Include the discount amount and code
- Encourage booking
- Keep under 160 characters if SMS, longer OK for WhatsApp
- No emojis needed (will be added later)

Generate just the message text, nothing else:`

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://your-app.com',
            'X-Title': 'AI Business Assistant'
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3-haiku',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 150,
            temperature: 0.7
          })
        })

        const data = await response.json()
        const generatedMessage = data.choices?.[0]?.message?.content?.trim() || 
          this.generateCampaignMessage(campaignName, discountText, discountCode, whatsappNumber)
        
        messages.push(generatedMessage)
      } catch (error) {
        console.error(`Error generating LLM message for ${customer.name}:`, error)
        // Fallback to rule-based message
        messages.push(this.generateCampaignMessage(campaignName, discountText, discountCode, whatsappNumber))
      }
    }

    return messages
  }

  /**
   * Generate fallback campaign message (rule-based)
   */
  generateCampaignMessage(campaignName, discountText, discountCode, isWhatsApp) {
    // Keep message concise for SMS (160 chars limit)
    // WhatsApp allows longer messages, but keep it readable
    const message = `🎉 ${campaignName} 🎉

Get ${discountText} on your next visit!

Use code: ${discountCode}

Reply to book your appointment!

Valid until end of month.`

    return message
  }

  /**
   * Get eligible customers for a campaign
   */
  async getEligibleCustomers(campaignId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .eq('business_id', this.businessId)
        .single()

      if (campaignError) throw campaignError

      // Get customers with phone numbers
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', this.businessId)
        .not('phone', 'is', null)

      if (customersError) throw customersError

      return {
        campaign,
        customers: customers || []
      }
    } catch (error) {
      console.error('Error getting eligible customers:', error)
      throw error
    }
  }
}

