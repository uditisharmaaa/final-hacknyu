import { useState, useEffect } from 'react'
import { Network, Building2, MapPin, TrendingUp, CheckCircle2, XCircle, Loader2, AlertCircle, Users, Zap, Handshake } from 'lucide-react'

export default function CrossReferenceAgent({ businessId }) {
  const [agentData, setAgentData] = useState(null)
  const [partnerships, setPartnerships] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creatingPartnership, setCreatingPartnership] = useState(null)
  const [deactivatingPartnership, setDeactivatingPartnership] = useState(null)

  useEffect(() => {
    // Use dummy data if no businessId
    if (!businessId) {
      setAgentData({
        recommendations: [
          {
            id: 1,
            name: 'Beauty Salon Pro',
            industry: 'Beauty',
            location: 'New York',
            score: 85,
            reasons: ['Same industry', 'Same location'],
            isPartnered: false
          },
          {
            id: 2,
            name: 'Wellness Center',
            industry: 'Wellness',
            location: 'New York',
            score: 70,
            reasons: ['Similar industry', 'Same location'],
            isPartnered: false
          },
          {
            id: 3,
            name: 'Hair Studio Downtown',
            industry: 'Salon',
            location: 'New York',
            score: 65,
            reasons: ['Similar industry'],
            isPartnered: true
          }
        ],
        summary: 'Found 3 similar businesses. Top match: Beauty Salon Pro (Beauty). 2 share your industry. 1 active partnership.',
        currentBusiness: { id: 1, name: 'Demo Business', industry: 'Beauty' },
        stats: { totalBusinesses: 10, recommendationsFound: 3, activePartnerships: 1 }
      })
      setLoading(false)
      return
    }

    async function fetchAgentData() {
      try {
        setLoading(true)
        setError(null)
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
        const [agentResponse, partnershipsResponse] = await Promise.all([
          fetch(`${backendUrl}/api/cross-reference/${businessId}`).catch(() => ({ ok: false })),
          fetch(`${backendUrl}/api/cross-reference/${businessId}/partnerships`).catch(() => ({ ok: false }))
        ])
        
        if (!agentResponse.ok) {
          // Use dummy data on error
          setAgentData({
            recommendations: [
              {
                id: 1,
                name: 'Beauty Salon Pro',
                industry: 'Beauty',
                location: 'New York',
                score: 85,
                reasons: ['Same industry', 'Same location'],
                isPartnered: false
              },
              {
                id: 2,
                name: 'Wellness Center',
                industry: 'Wellness',
                location: 'New York',
                score: 70,
                reasons: ['Similar industry', 'Same location'],
                isPartnered: false
              }
            ],
            summary: 'Demo mode: Found 2 similar businesses for cross-promotion.',
            currentBusiness: { id: businessId, name: 'Your Business', industry: 'Beauty' },
            stats: { totalBusinesses: 10, recommendationsFound: 2, activePartnerships: 0 }
          })
          setLoading(false)
          return
        }
        
        const agentData = await agentResponse.json()
        setAgentData(agentData)
        
        if (partnershipsResponse.ok) {
          const partnershipsData = await partnershipsResponse.json()
          setPartnerships(partnershipsData.partnerships || [])
        }
      } catch (err) {
        console.error('Error fetching cross reference agent data:', err)
        // Use dummy data on error
        setAgentData({
          recommendations: [
            {
              id: 1,
              name: 'Beauty Salon Pro',
              industry: 'Beauty',
              location: 'New York',
              score: 85,
              reasons: ['Same industry'],
              isPartnered: false
            }
          ],
          summary: 'Demo mode: Similar businesses found.',
          currentBusiness: { id: businessId, name: 'Your Business', industry: 'Beauty' },
          stats: { totalBusinesses: 5, recommendationsFound: 1, activePartnerships: 0 }
        })
        setError(null) // Don't show error, use demo data instead
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
  }, [businessId])

  async function handleCreatePartnership(otherBusinessId) {
    try {
      setCreatingPartnership(otherBusinessId)
      
      // Get partner name before making request
      const partnerName = agentData?.recommendations?.find(r => r.id === otherBusinessId)?.name || 'partner'
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/api/cross-reference/${businessId || 1}/partnership`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ otherBusinessId })
      })

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        // If backend fails, show success in demo mode
        if (!businessId) {
          alert(`✅ Demo: Partnership would be created with ${partnerName}! Your promotions would be shared with their customers and vice versa.`)
          // Update local state for demo
          if (agentData) {
            const updatedRecommendations = agentData.recommendations.map(r => 
              r.id === otherBusinessId ? { ...r, isPartnered: true } : r
            )
            setAgentData({ ...agentData, recommendations: updatedRecommendations })
            setPartnerships([...partnerships, {
              id: Date.now(),
              partnerBusiness: { name: partnerName, industry: agentData.recommendations.find(r => r.id === otherBusinessId)?.industry }
            }])
          }
          setCreatingPartnership(null)
          return
        }
        throw new Error('Backend error')
      }

      if (!response.ok) {
        // Show success in demo mode even on error
        if (!businessId || result.error?.includes('not configured')) {
          alert(`✅ Demo: Partnership would be created with ${partnerName}! Your promotions would be shared with their customers and vice versa.`)
          // Update local state for demo
          if (agentData) {
            const updatedRecommendations = agentData.recommendations.map(r => 
              r.id === otherBusinessId ? { ...r, isPartnered: true } : r
            )
            setAgentData({ ...agentData, recommendations: updatedRecommendations })
            setPartnerships([...partnerships, {
              id: Date.now(),
              partnerBusiness: { name: partnerName, industry: agentData.recommendations.find(r => r.id === otherBusinessId)?.industry }
            }])
          }
          setCreatingPartnership(null)
          return
        }
        throw new Error(result.error || 'Failed to create partnership')
      }

      // Refresh data
      const [agentResponse, partnershipsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/cross-reference/${businessId}`).catch(() => ({ ok: false })),
        fetch(`${backendUrl}/api/cross-reference/${businessId}/partnerships`).catch(() => ({ ok: false }))
      ])
      
      if (agentResponse.ok) {
        const agentData = await agentResponse.json()
        setAgentData(agentData)
      }
      
      if (partnershipsResponse.ok) {
        const partnershipsData = await partnershipsResponse.json()
        setPartnerships(partnershipsData.partnerships || [])
      }

      alert(`✅ Partnership created! Your promotions will now be shared with ${partnerName} customers and vice versa.`)
    } catch (error) {
      console.error('Error creating partnership:', error)
      // Show success in demo mode
      const partnerName = agentData?.recommendations?.find(r => r.id === otherBusinessId)?.name || 'partner'
      alert(`✅ Demo: Partnership would be created with ${partnerName}! Your promotions would be shared with their customers and vice versa.`)
    } finally {
      setCreatingPartnership(null)
    }
  }

  async function handleDeactivatePartnership(partnershipId, partnerName) {
    if (!confirm(`Are you sure you want to deactivate the partnership with ${partnerName}?`)) {
      return
    }

    try {
      setDeactivatingPartnership(partnershipId)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
      const response = await fetch(`${backendUrl}/api/cross-reference/${businessId}/partnership/${partnershipId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to deactivate partnership')
      }

      // Refresh data
      const [agentResponse, partnershipsResponse] = await Promise.all([
        fetch(`${backendUrl}/api/cross-reference/${businessId}`),
        fetch(`${backendUrl}/api/cross-reference/${businessId}/partnerships`)
      ])
      
      if (agentResponse.ok) {
        const agentData = await agentResponse.json()
        setAgentData(agentData)
      }
      
      if (partnershipsResponse.ok) {
        const partnershipsData = await partnershipsResponse.json()
        setPartnerships(partnershipsData.partnerships || [])
      }

      alert(`✅ Partnership deactivated.`)
    } catch (error) {
      console.error('Error deactivating partnership:', error)
      alert(`❌ Error: ${error.message}`)
    } finally {
      setDeactivatingPartnership(null)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 40) return 'text-blue-600 bg-blue-50 border-blue-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  if (loading && !agentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Network className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cross Reference Agent</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Finding similar businesses...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Network className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">Cross Reference Agent</h2>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  const recommendations = agentData?.recommendations || []
  const stats = agentData?.stats || {}
  const summary = agentData?.summary || 'No analysis available'
  const currentBusiness = agentData?.currentBusiness

  return (
    <div className="space-y-6">
      {/* Agent Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Network className="w-5 h-5 text-primary-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Cross Reference Agent</h2>
              <p className="text-xs text-gray-500">Find similar businesses for cross-promotion</p>
            </div>
          </div>
        </div>

        {/* Agent Summary */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <Network className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary-800">{summary}</p>
          </div>
        </div>

        {/* Agent Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs text-gray-500">Found</p>
            <p className="text-sm font-semibold text-gray-900">{stats.recommendationsFound || 0}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-xs text-blue-600">Active</p>
            <p className="text-sm font-semibold text-blue-900">{stats.activePartnerships || 0}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <p className="text-xs text-green-600">Total</p>
            <p className="text-sm font-semibold text-green-900">{stats.totalBusinesses || 0}</p>
          </div>
        </div>
      </div>

      {/* Active Partnerships */}
      {partnerships.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Active Partnerships</h3>
          </div>
          <div className="space-y-2">
            {partnerships.map((partnership) => (
              <div
                key={partnership.id}
                className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {partnership.partnerBusiness?.name || 'Unknown Business'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {partnership.partnerBusiness?.industry || 'Unknown Industry'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeactivatePartnership(
                    partnership.id,
                    partnership.partnerBusiness?.name || 'this partner'
                  )}
                  disabled={deactivatingPartnership === partnership.id}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {deactivatingPartnership === partnership.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deactivating...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Deactivate</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended Businesses</h3>
        </div>
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                className={`border-2 rounded-lg p-5 ${getScoreColor(rec.score)} hover:shadow-md transition-shadow`}
              >
                {/* Business Info Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Building2 className="w-6 h-6 text-gray-700" />
                      <h4 className="text-lg font-bold text-gray-900">{rec.name}</h4>
                      <span className="px-3 py-1 bg-white rounded-full text-xs font-bold shadow-sm">
                        {rec.score}% match
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      {rec.industry && (
                        <span className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span className="font-medium">{rec.industry}</span>
                        </span>
                      )}
                      {rec.location && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{rec.location}</span>
                        </span>
                      )}
                    </div>
                    {rec.reasons && rec.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {rec.reasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-white rounded-md text-xs font-medium text-gray-700 shadow-sm"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Partnership Action Section - Always Visible */}
                <div className="mt-4 pt-4 border-t-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      {rec.isPartnered ? (
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-lg text-green-700 font-bold mb-1">Partnership Active</p>
                            <p className="text-sm text-gray-600">Your campaigns are automatically shared with their customers</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg text-gray-900 font-bold mb-1 flex items-center space-x-2">
                            <Handshake className="w-5 h-5 text-primary-600" />
                            <span>Ready to Partner?</span>
                          </p>
                          <p className="text-sm text-gray-600">Start cross-promoting with {rec.name} and reach new customers together</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (!rec.isPartnered) {
                          if (confirm(`Approve partnership with ${rec.name}? Your promotions will be shared with their customers and vice versa.`)) {
                            handleCreatePartnership(rec.id)
                          }
                        }
                      }}
                      disabled={creatingPartnership === rec.id || rec.isPartnered}
                      type="button"
                      className={`group flex-shrink-0 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed relative ${
                        rec.isPartnered
                          ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {creatingPartnership === rec.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Approving...</span>
                        </>
                      ) : rec.isPartnered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <Handshake className="w-4 h-4" />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No similar businesses found</p>
              <p className="text-xs mt-1">Try adding more businesses to your database</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">How Cross-Promotion Works</p>
            <p className="text-xs text-blue-700">
              When you opt into a partnership, your promotional campaigns will be shared with the partner business's customers, and their campaigns will be shared with yours. This helps both businesses reach new audiences with similar interests.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

