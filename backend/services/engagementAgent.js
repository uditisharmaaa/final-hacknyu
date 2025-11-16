import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
const openRouterApiKey = process.env.OPENROUTER_API_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured')
}

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * Engagement Agent - Analyzes customer data and generates follow-up recommendations
 */
export class EngagementAgent {
  constructor(businessId) {
    this.businessId = businessId
  }

  /**
   * Analyze customers and generate follow-up recommendations
   */
  async analyzeAndRecommend() {
    if (!supabase) {
      return {
        error: 'Supabase not configured',
        recommendations: [],
        summary: 'Agent offline - database not configured'
      }
    }

    try {
      // Fetch business data
      const [customers, bookings, services, campaigns, stats] = await Promise.all([
        this.getCustomers(),
        this.getBookings(),
        this.getServices(),
        this.getCampaigns(),
        this.getBusinessStats()
      ])

      // Analyze each customer for follow-up opportunities
      const recommendations = []
      const customerAnalysis = this.analyzeCustomers(customers, bookings, services)
      
      // Generate recommendations for ALL customers with any booking history
      for (const analysis of customerAnalysis) {
        // Always generate a recommendation - be very generous!
        const recommendation = await this.generateRecommendation(analysis, services, stats)
        if (recommendation) {
          recommendations.push(recommendation)
        }
      }

      // Check for low demand periods
      const lowDemandRecommendations = this.detectLowDemand(bookings, campaigns)
      recommendations.push(...lowDemandRecommendations)

      // Generate summary using LLM
      const summary = await this.generateSummary(recommendations, stats)

      return {
        recommendations: recommendations.sort((a, b) => b.priority - a.priority),
        summary,
        stats: {
          customersAnalyzed: customers.length,
          followUpsRecommended: recommendations.filter(r => r.type === 'follow_up').length,
          discountsRecommended: recommendations.filter(r => r.type === 'discount').length
        }
      }
    } catch (error) {
      console.error('Engagement Agent error:', error)
      return {
        error: error.message,
        recommendations: [],
        summary: 'Error analyzing data'
      }
    }
  }

  /**
   * Analyze customers to determine who needs follow-up
   */
  analyzeCustomers(customers, bookings, services) {
    const now = new Date()
    const analyses = []

    for (const customer of customers) {
      // Get customer's booking history
      const customerBookings = bookings.filter(b => b.customer_id === customer.id)
      
      if (customerBookings.length === 0) continue

      // Get all bookings (be very inclusive - include all statuses)
      const allRecentBookings = customerBookings
        .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))

      if (allRecentBookings.length === 0) continue
      
      // Prefer completed bookings, but also consider booked ones, or any booking
      const completedBookings = customerBookings.filter(b => b.status === 'completed')
      const bookedBookings = customerBookings.filter(b => b.status === 'booked')
      const bookingsToUse = completedBookings.length > 0 
        ? completedBookings 
        : bookedBookings.length > 0 
          ? bookedBookings 
          : allRecentBookings

      const lastBooking = bookingsToUse[0]
      const lastService = services.find(s => s.id === lastBooking.service_id)
      
      // If no service found, create a default service object
      const defaultService = {
        id: lastBooking.service_id || 0,
        name: 'Previous Service',
        suggested_repeat_days: 30,
        price: 0
      }
      const serviceToUse = lastService || defaultService

      // Calculate days since last visit
      const lastVisitDate = new Date(lastBooking.start_time)
      const daysSinceLastVisit = Math.floor((now - lastVisitDate) / (1000 * 60 * 60 * 24))
      const suggestedRepeatDays = serviceToUse.suggested_repeat_days || 30 // Default to 30 days if not set

      // Calculate days overdue/approaching
      const daysOverdue = daysSinceLastVisit - suggestedRepeatDays
      
      // ALWAYS recommend - be super generous!
      // Recommend for everyone with any booking history
      const needsFollowUp = true // Always true now

      // Calculate urgency (0-100) - varied priorities
      let priority = 50 // Base priority
      
      // Higher priority based on recency and visits
      if (daysSinceLastVisit > 30) priority += 30 // Haven't visited in a while
      if (daysSinceLastVisit > 60) priority += 20 // Very long time
      if (daysOverdue > 0) {
        priority += Math.min(daysOverdue * 1.5, 35) // Overdue bonus
      }
      if (daysOverdue >= -7 && daysOverdue <= 0) {
        priority += 15 // Approaching repeat date
      }
      if (customerBookings.length >= 3) priority += 25 // Loyalty bonus
      if (customerBookings.length === 2) priority += 15 // Returning customer
      if (customerBookings.length === 1) priority += 10 // First-time follow-up
      if (daysSinceLastVisit < 7) priority -= 10 // Very recent visit - lower priority but still recommend

      analyses.push({
        customer,
        lastBooking,
        lastService: serviceToUse,
        daysSinceLastVisit,
        suggestedRepeatDays,
        daysOverdue,
        needsFollowUp,
        priority,
        visitCount: customerBookings.length,
        totalSpent: (completedBookings || []).reduce((sum, b) => sum + (b.services?.price || 0), 0)
      })
    }

    return analyses
  }

  /**
   * Generate personalized follow-up recommendation using LLM
   */
  async generateRecommendation(analysis, services, stats) {
    const { customer, lastService, daysSinceLastVisit, daysOverdue, visitCount } = analysis
    
    // Build context for LLM
    const context = {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      lastService: lastService.name,
      daysSinceLastVisit,
      daysOverdue,
      visitCount,
      preferredLanguage: customer.preferred_language || 'en',
      servicePrice: lastService.price,
      suggestedRepeatDays: lastService.suggested_repeat_days,
      businessStats: {
        averageCustomers: stats.totalCustomers,
        recentBookings: stats.recentBookings
      }
    }

    // Generate recommendations for multiple scenarios - be more generous!
    
    // Scenario 1: Very overdue (> 14 days) - high priority discount
    if (daysOverdue > 14) {
      return {
        type: 'discount',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateDiscountMessage(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        discountPercentage: 15,
        priority: analysis.priority + 30,
        reason: `Customer is ${daysOverdue} days overdue for ${lastService.name}. High priority re-engagement needed.`,
        suggestedAction: 'Send SMS with 15% discount offer'
      }
    }
    
    // Scenario 2: Overdue (7-14 days) - standard discount
    if (daysOverdue > 7 && daysOverdue <= 14) {
      return {
        type: 'discount',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateDiscountMessage(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        discountPercentage: 10,
        priority: analysis.priority + 20,
        reason: `Customer is ${daysOverdue} days overdue for ${lastService.name}. Consider offering a discount.`,
        suggestedAction: 'Send SMS with 10% discount offer'
      }
    }
    
    // Scenario 3: Recently overdue (0-7 days) - standard follow-up
    if (daysOverdue >= 0 && daysOverdue <= 7) {
      return {
        type: 'follow_up',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateFollowUpMessage(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        priority: analysis.priority,
        reason: `Last visit was ${daysSinceLastVisit} days ago. Suggested repeat: every ${lastService.suggested_repeat_days || 30} days.`,
        suggestedAction: 'Send SMS reminder'
      }
    }
    
    // Scenario 4: Approaching repeat date (within 7 days) - early reminder
    if (daysOverdue < 0 && daysOverdue >= -7) {
      return {
        type: 'follow_up',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateEarlyReminder(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        priority: analysis.priority + 5,
        reason: `Early booking opportunity: ${Math.abs(daysOverdue)} days until suggested repeat period.`,
        suggestedAction: 'Send SMS reminder for early booking'
      }
    }
    
    // Scenario 5: No suggested repeat days but visited 14+ days ago
    if (!lastService.suggested_repeat_days && daysSinceLastVisit >= 14) {
      return {
        type: 'follow_up',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateFollowUpMessage(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        priority: analysis.priority,
        reason: `Last visit was ${daysSinceLastVisit} days ago. General follow-up recommended.`,
        suggestedAction: 'Send SMS check-in'
      }
    }
    
    // Scenario 6: Loyalty customers (multiple visits) - always recommend
    if (visitCount >= 2) {
      return {
        type: 'follow_up',
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        message: await this.generateFollowUpMessage(context),
        serviceId: lastService.id,
        serviceName: lastService.name,
        priority: analysis.priority + 15,
        reason: `Loyal customer (${visitCount} visits). Last visit was ${daysSinceLastVisit} days ago.`,
        suggestedAction: 'Send SMS to loyal customer'
      }
    }
    
    // Default: Return something for any customer with a completed booking
    return {
      type: 'follow_up',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      message: await this.generateFollowUpMessage(context),
      serviceId: lastService.id,
      serviceName: lastService.name,
      priority: analysis.priority,
      reason: `Last visit was ${daysSinceLastVisit} days ago. General follow-up recommended.`,
      suggestedAction: 'Send SMS check-in'
    }
  }

  /**
   * Generate personalized follow-up message using OpenRouter LLM
   */
  async generateFollowUpMessage(context) {
    if (!openRouterApiKey) {
      // Fallback to rule-based message
      return `Hi ${context.customerName}, it's been ${context.daysSinceLastVisit} days since your last ${context.lastService}. Would you like to book another appointment? We'd love to see you again!`
    }

    try {
      const prompt = `You are a friendly receptionist for a small business. Generate a personalized SMS follow-up message for a customer.

Customer: ${context.customerName}
Last service: ${context.lastService}
Days since last visit: ${context.daysSinceLastVisit}
Days overdue: ${context.daysOverdue}
Visit count: ${context.visitCount}

Requirements:
- Keep it under 160 characters
- Friendly and personal tone
- Mention the service they had last
- Encourage booking
- No emojis needed

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
          max_tokens: 100,
          temperature: 0.7
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content?.trim() || this.getDefaultFollowUpMessage(context)
    } catch (error) {
      console.error('Error generating LLM message:', error)
      return this.getDefaultFollowUpMessage(context)
    }
  }

  /**
   * Generate discount message
   */
  async generateDiscountMessage(context) {
    if (!openRouterApiKey) {
      return `Hi ${context.customerName}, we miss you! Get 10% off your next ${context.lastService} when you book this week. Limited time offer - reply to book!`
    }

    try {
      const prompt = `Generate a short SMS discount offer message for a customer who hasn't visited in a while.

Customer: ${context.customerName}
Last service: ${context.lastService}
Days overdue: ${context.daysOverdue}
Discount: 10%

Keep it under 160 characters, friendly tone, include urgency:`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 100
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content?.trim() || this.getDefaultDiscountMessage(context)
    } catch (error) {
      return this.getDefaultDiscountMessage(context)
    }
  }

  /**
   * Generate early reminder message
   */
  async generateEarlyReminder(context) {
    return `Hi ${context.customerName}, hope you're doing well! We wanted to remind you that it's almost time for your next ${context.lastService}. Want to book now?`
  }

  /**
   * Default fallback messages
   */
  getDefaultFollowUpMessage(context) {
    return `Hi ${context.customerName}, it's been ${context.daysSinceLastVisit} days since your last ${context.lastService}. Would you like to book another appointment?`
  }

  getDefaultDiscountMessage(context) {
    return `Hi ${context.customerName}, we miss you! Get 10% off your next ${context.lastService} when you book this week.`
  }

  /**
   * Detect low demand periods and suggest discounts
   */
  detectLowDemand(bookings, campaigns) {
    const recommendations = []
    const now = new Date()
    const next7Days = []

    // Get bookings for next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(now.getDate() + i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayBookings = bookings.filter(b => {
        const bookingDate = new Date(b.start_time)
        return bookingDate >= dayStart && bookingDate <= dayEnd && b.status !== 'cancelled'
      })

      next7Days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        bookings: dayBookings.length
      })
    }

    // Calculate average
    const avgBookings = next7Days.reduce((sum, day) => sum + day.bookings, 0) / 7
    const lowDemandThreshold = avgBookings * 0.5

    // Find low demand days
    const lowDemandDays = next7Days.filter(day => day.bookings < lowDemandThreshold)
    
    if (lowDemandDays.length > 0) {
      recommendations.push({
        type: 'discount',
        priority: 40,
        reason: `Low demand detected for ${lowDemandDays.map(d => d.dayName).join(', ')}. Consider sending promotional messages.`,
        suggestedAction: `Create campaign for ${lowDemandDays[0].dayName} with 10% discount`,
        discountPercentage: 10,
        targetDays: lowDemandDays.map(d => d.dayName)
      })
    }

    return recommendations
  }

  /**
   * Generate agent summary using LLM
   */
  async generateSummary(recommendations, stats) {
    if (!openRouterApiKey || recommendations.length === 0) {
      return `Engagement Agent analyzed ${stats.totalCustomers} customers and identified ${recommendations.length} follow-up opportunities.`
    }

    try {
      const prompt = `As an AI Engagement Agent, provide a brief summary (2-3 sentences) of customer engagement insights.

Total customers: ${stats.totalCustomers}
Follow-up recommendations: ${recommendations.filter(r => r.type === 'follow_up').length}
Discount recommendations: ${recommendations.filter(r => r.type === 'discount').length}

Be concise and actionable:`

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150
        })
      })

      const data = await response.json()
      return data.choices?.[0]?.message?.content?.trim() || this.getDefaultSummary(recommendations, stats)
    } catch (error) {
      return this.getDefaultSummary(recommendations, stats)
    }
  }

  getDefaultSummary(recommendations, stats) {
    const followUps = recommendations.filter(r => r.type === 'follow_up').length
    const discounts = recommendations.filter(r => r.type === 'discount').length
    return `Analyzed ${stats.totalCustomers} customers. Found ${followUps} follow-up opportunities and ${discounts} discount recommendations.`
  }

  // Supabase queries
  async getCustomers() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', this.businessId)
    
    if (error) throw error
    return data || []
  }

  async getBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('business_id', this.businessId)
      .order('start_time', { ascending: false })
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      return []
    }
    
    // Fetch related service data - ensure we only get services for this business
    const serviceIds = [...new Set(data.map(b => b.service_id).filter(id => id))]
    if (serviceIds.length === 0) {
      return data.map(booking => ({ ...booking, services: null }))
    }
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', this.businessId)
      .in('id', serviceIds)
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      return data.map(booking => ({ ...booking, services: null }))
    }
    
    const servicesMap = new Map(services?.map(s => [s.id, s]) || [])
    
    return data.map(booking => ({
      ...booking,
      services: servicesMap.get(booking.service_id)
    }))
  }

  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', this.businessId)
    
    if (error) throw error
    return data || []
  }

  async getCampaigns() {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', this.businessId)
    
    if (error) throw error
    return data || []
  }

  async getBusinessStats() {
    const [customers, bookings] = await Promise.all([
      this.getCustomers(),
      this.getBookings()
    ])

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentBookings = bookings.filter(
      b => new Date(b.start_time) >= sevenDaysAgo
    )

    return {
      totalCustomers: customers.length,
      totalBookings: bookings.length,
      recentBookings: recentBookings.length
    }
  }
}

