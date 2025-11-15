import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

/**
 * Cross Reference Agent - Finds similar businesses and manages cross-promotion partnerships
 */
export class CrossReferenceAgent {
  constructor(businessId) {
    this.businessId = businessId
  }

  /**
   * Find similar businesses based on industry, location, and customer overlap
   */
  async findSimilarBusinesses() {
    if (!supabase) {
      return {
        error: 'Supabase not configured',
        recommendations: [],
        summary: 'Agent offline - database not configured'
      }
    }

    try {
      // Get current business details
      const { data: currentBusiness, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', this.businessId)
        .single()

      if (businessError || !currentBusiness) {
        throw new Error('Current business not found')
      }

      // Get all other businesses (excluding current)
      const { data: allBusinesses, error: businessesError } = await supabase
        .from('businesses')
        .select('*')
        .neq('id', this.businessId)

      if (businessesError) throw businessesError

      // Get current business customers
      const { data: currentCustomers } = await supabase
        .from('customers')
        .select('id, email, phone')
        .eq('business_id', this.businessId)

      const currentCustomerEmails = new Set((currentCustomers || []).map(c => c.email?.toLowerCase()).filter(Boolean))
      const currentCustomerPhones = new Set((currentCustomers || []).map(c => c.phone?.replace(/\D/g, '')).filter(Boolean))

      // Score each business for similarity
      const scoredBusinesses = await Promise.all(
        (allBusinesses || []).map(async (business) => {
          let score = 0
          const reasons = []

          // Industry match (highest weight)
          if (business.industry && currentBusiness.industry) {
            const industriesMatch = business.industry.toLowerCase() === currentBusiness.industry.toLowerCase()
            if (industriesMatch) {
              score += 50
              reasons.push('Same industry')
            } else {
              // Check for similar industries
              const similarIndustries = {
                'beauty': ['salon', 'spa', 'wellness', 'cosmetics'],
                'salon': ['beauty', 'spa', 'wellness', 'hair'],
                'spa': ['beauty', 'salon', 'wellness', 'massage'],
                'restaurant': ['food', 'cafe', 'dining'],
                'fitness': ['gym', 'wellness', 'health'],
                'retail': ['shop', 'store', 'boutique']
              }
              const currentIndustry = currentBusiness.industry.toLowerCase()
              const otherIndustry = business.industry.toLowerCase()
              if (similarIndustries[currentIndustry]?.includes(otherIndustry) || 
                  similarIndustries[otherIndustry]?.includes(currentIndustry)) {
                score += 30
                reasons.push('Similar industry')
              }
            }
          }

          // Location match (if available)
          if (business.location && currentBusiness.location) {
            if (business.location.toLowerCase() === currentBusiness.location.toLowerCase()) {
              score += 20
              reasons.push('Same location')
            }
          }

          // Customer overlap check
          const { data: otherCustomers } = await supabase
            .from('customers')
            .select('email, phone')
            .eq('business_id', business.id)

          if (otherCustomers && otherCustomers.length > 0) {
            const overlap = otherCustomers.filter(c => {
              const emailMatch = c.email && currentCustomerEmails.has(c.email.toLowerCase())
              const phoneMatch = c.phone && currentCustomerPhones.has(c.phone.replace(/\D/g, ''))
              return emailMatch || phoneMatch
            }).length

            if (overlap > 0) {
              const overlapPercentage = (overlap / Math.max(currentCustomers?.length || 1, otherCustomers.length)) * 100
              score += Math.min(overlapPercentage * 0.5, 20) // Max 20 points for overlap
              reasons.push(`${overlap} shared customers`)
            }
          }

          // Check if already partnered
          const { data: partnership } = await supabase
            .from('business_partnerships')
            .select('*')
            .or(`and(business_id_1.eq.${this.businessId},business_id_2.eq.${business.id}),and(business_id_1.eq.${business.id},business_id_2.eq.${this.businessId})`)
            .eq('status', 'active')
            .single()

          return {
            business,
            score,
            reasons,
            isPartnered: !!partnership,
            partnershipId: partnership?.id
          }
        })
      )

      // Sort by score and get top recommendations
      const recommendations = scoredBusinesses
        .filter(b => b.score > 0) // Only show businesses with some similarity
        .sort((a, b) => b.score - a.score)
        .slice(0, 10) // Top 10 recommendations
        .map((item, index) => ({
          id: item.business.id,
          name: item.business.name,
          industry: item.business.industry,
          location: item.business.location,
          score: item.score,
          reasons: item.reasons,
          isPartnered: item.isPartnered,
          partnershipId: item.partnershipId,
          priority: 100 - index * 5 // Higher priority for better matches
        }))

      // Generate summary
      const summary = this.generateSummary(recommendations, currentBusiness)

      return {
        recommendations,
        summary,
        currentBusiness: {
          id: currentBusiness.id,
          name: currentBusiness.name,
          industry: currentBusiness.industry
        },
        stats: {
          totalBusinesses: allBusinesses?.length || 0,
          recommendationsFound: recommendations.length,
          activePartnerships: recommendations.filter(r => r.isPartnered).length
        }
      }
    } catch (error) {
      console.error('Cross Reference Agent error:', error)
      return {
        error: error.message,
        recommendations: [],
        summary: 'Error finding similar businesses'
      }
    }
  }

  /**
   * Generate summary text
   */
  generateSummary(recommendations, currentBusiness) {
    if (recommendations.length === 0) {
      return `No similar businesses found for ${currentBusiness.name}.`
    }

    const topMatch = recommendations[0]
    const industryMatches = recommendations.filter(r => r.reasons.some(reason => reason.includes('industry'))).length
    const partnerships = recommendations.filter(r => r.isPartnered).length

    return `Found ${recommendations.length} similar businesses. Top match: ${topMatch.name} (${topMatch.industry}). ${industryMatches} share your industry. ${partnerships} active partnership${partnerships !== 1 ? 's' : ''}.`
  }

  /**
   * Create or activate a partnership between two businesses
   */
  async createPartnership(otherBusinessId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      // Check if partnership already exists
      const { data: existing } = await supabase
        .from('business_partnerships')
        .select('*')
        .or(`and(business_id_1.eq.${this.businessId},business_id_2.eq.${otherBusinessId}),and(business_id_1.eq.${otherBusinessId},business_id_2.eq.${this.businessId})`)
        .single()

      if (existing) {
        // Update existing partnership to active
        const { data, error } = await supabase
          .from('business_partnerships')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        return { success: true, partnership: data, message: 'Partnership reactivated' }
      }

      // Create new partnership
      const { data, error } = await supabase
        .from('business_partnerships')
        .insert({
          business_id_1: this.businessId,
          business_id_2: otherBusinessId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return { success: true, partnership: data, message: 'Partnership created successfully' }
    } catch (error) {
      console.error('Error creating partnership:', error)
      throw error
    }
  }

  /**
   * Deactivate a partnership
   */
  async deactivatePartnership(partnershipId) {
    if (!supabase) {
      throw new Error('Supabase not configured')
    }

    try {
      const { data, error } = await supabase
        .from('business_partnerships')
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', partnershipId)
        .select()
        .single()

      if (error) throw error
      return { success: true, message: 'Partnership deactivated' }
    } catch (error) {
      console.error('Error deactivating partnership:', error)
      throw error
    }
  }

  /**
   * Get active partnerships for current business
   */
  async getActivePartnerships() {
    if (!supabase) {
      return []
    }

    try {
      const { data: partnerships, error } = await supabase
        .from('business_partnerships')
        .select('*')
        .or(`business_id_1.eq.${this.businessId},business_id_2.eq.${this.businessId}`)
        .eq('status', 'active')

      if (error) throw error

      if (!partnerships || partnerships.length === 0) {
        return []
      }

      // Get partner business IDs
      const partnerIds = partnerships.map(p => 
        p.business_id_1 === this.businessId ? p.business_id_2 : p.business_id_1
      )

      // Fetch partner business details
      const { data: partnerBusinesses, error: businessesError } = await supabase
        .from('businesses')
        .select('id, name, industry')
        .in('id', partnerIds)

      if (businessesError) throw businessesError

      const businessesMap = new Map((partnerBusinesses || []).map(b => [b.id, b]))

      return partnerships.map(partnership => {
        const partnerId = partnership.business_id_1 === this.businessId 
          ? partnership.business_id_2 
          : partnership.business_id_1
        return {
          id: partnership.id,
          partnerBusiness: businessesMap.get(partnerId) || { id: partnerId, name: 'Unknown Business', industry: null },
          createdAt: partnership.created_at
        }
      })
    } catch (error) {
      console.error('Error getting partnerships:', error)
      return []
    }
  }
}

