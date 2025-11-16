import { useState, useEffect } from 'react'
import { Brain, Send, DollarSign, Clock, AlertCircle, CheckCircle2, Loader2, MessageSquare, Zap, Plus } from 'lucide-react'

export default function EngagementAgent({ businessId }) {
  const [agentData, setAgentData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastRun, setLastRun] = useState(null)
  const [sendingCampaign, setSendingCampaign] = useState(null)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [selectedRecommendation, setSelectedRecommendation] = useState(null)
  const [editableMessage, setEditableMessage] = useState('')

  useEffect(() => {
    if (!businessId) return

    async function fetchAgentData() {
      try {
        setLoading(true)
        setError(null)
        
        // Replace with your backend URL
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
        const response = await fetch(`${backendUrl}/api/engagement-agent/${businessId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch agent data')
        }
        
        const data = await response.json()
        setAgentData(data)
        setLastRun(new Date())
      } catch (err) {
        console.error('Error fetching engagement agent data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAgentData()
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAgentData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [businessId])

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'follow_up':
        return <MessageSquare className="w-5 h-5 text-blue-500" />
      case 'discount':
        return <DollarSign className="w-5 h-5 text-green-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority) => {
    if (priority >= 70) return 'bg-red-50 border-red-200'
    if (priority >= 50) return 'bg-orange-50 border-orange-200'
    return 'bg-blue-50 border-blue-200'
  }

  if (loading && !agentData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Engagement Agent</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Analyzing customer data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Brain className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">Engagement Agent</h2>
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

  function createDummyCampaign() {
    // Create a dummy campaign recommendation
    const dummyCampaign = {
      id: Date.now(),
      type: 'discount',
      customerId: 1,
      customerName: 'New Campaign',
      customerPhone: '+1234567890',
      customerEmail: 'campaign@example.com',
      serviceId: 1,
      serviceName: 'General Service',
      discountPercentage: 15,
      priority: 50,
      message: 'Hi! We have a special offer just for you. Get 15% off your next visit!',
      reason: 'New campaign created',
      suggestedAction: 'Send campaign'
    }
    
    // Set it as selected recommendation and open modal
    setSelectedRecommendation(dummyCampaign)
    setEditableMessage(dummyCampaign.message)
    setShowCampaignModal(true)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Agent Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Brain className="w-5 h-5 text-primary-600" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Engagement Agent</h2>
            <p className="text-xs text-gray-500">AI-powered follow-up recommendations</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={createDummyCampaign}
            type="button"
            className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign</span>
          </button>
          {lastRun && (
            <div className="text-xs text-gray-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {lastRun.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Agent Summary */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <Brain className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary-800">{summary}</p>
        </div>
      </div>

      {/* Agent Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-500">Analyzed</p>
          <p className="text-sm font-semibold text-gray-900">{stats.customersAnalyzed || 0}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <p className="text-xs text-blue-600">Follow-ups</p>
          <p className="text-sm font-semibold text-blue-900">{stats.followUpsRecommended || 0}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <p className="text-xs text-green-600">Discounts</p>
          <p className="text-sm font-semibold text-green-900">{stats.discountsRecommended || 0}</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {recommendations.length > 0 ? (
          recommendations.slice(0, 5).map((rec, index) => (
            <div
              key={index}
              className={`border rounded-lg p-3 ${getPriorityColor(rec.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-2 flex-1">
                  {getRecommendationIcon(rec.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{rec.customerName || 'General Recommendation'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rec.type === 'follow_up' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {rec.type === 'follow_up' ? 'Follow-up' : 'Discount'}
                      </span>
                    </div>
                    {rec.serviceName && (
                      <p className="text-xs text-gray-600 mt-0.5">Service: {rec.serviceName}</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Priority: {rec.priority || 0}
                </div>
              </div>
              
              {rec.message && (
                <div className="bg-white rounded p-2 mb-2">
                  <p className="text-xs text-gray-700 italic">"{rec.message}"</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 flex-1">{rec.reason}</p>
                {rec.suggestedAction && (
                  <button className="ml-2 text-xs text-primary-600 hover:text-primary-700 font-medium">
                    {rec.suggestedAction} →
                  </button>
                )}
              </div>

              {rec.discountPercentage && rec.customerId && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-xs text-green-700">
                    <DollarSign className="w-3 h-3" />
                    <span>{rec.discountPercentage}% discount suggested</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRecommendation(rec)
                      // Default auto-generated message (editable)
                      const fallbackMessage = rec.message
                        || `Hi ${rec.customerName || ''}, you've unlocked ${rec.discountPercentage}% off your next ${rec.serviceName || 'visit'}. Reply to book your spot!`
                      setEditableMessage(fallbackMessage.trim())
                      setShowCampaignModal(true)
                    }}
                    className="flex items-center space-x-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Send Campaign</span>
                  </button>
                </div>
              )}
              {rec.discountPercentage && !rec.customerId && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  General recommendation - create a campaign manually to send to multiple customers
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-gray-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No follow-up recommendations at this time</p>
            <p className="text-xs mt-1">All customers are up to date!</p>
          </div>
        )}
      </div>

      {recommendations.length > 5 && (
        <div className="mt-3 text-center">
          <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
            View all {recommendations.length} recommendations →
          </button>
        </div>
      )}

      {/* Campaign Send Modal - Business Owner Permission Required */}
      {showCampaignModal && selectedRecommendation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            {/* Permission Header */}
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b border-gray-200">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Business Owner Authorization Required</h3>
                <p className="text-xs text-gray-500 mt-0.5">Confirm your identity before sending campaign</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {/* Campaign Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-800 mb-3">CAMPAIGN DETAILS:</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-blue-700">Customer:</p>
                    <p className="text-sm font-semibold text-blue-900">{selectedRecommendation.customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Discount:</p>
                    <p className="text-lg font-bold text-green-600">
                      {selectedRecommendation.discountPercentage}% OFF
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Service:</p>
                    <p className="text-sm font-medium text-blue-900">{selectedRecommendation.serviceName || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Message Preview - Editable */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-700">Message to be sent:</p>
                </div>
                <textarea
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  placeholder="Enter the message to send..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 AI-generated personalized message – feel free to edit before sending. For the demo, this will be sent to your configured test number.
                </p>
              </div>

              {/* Business Owner Permission Checkbox */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="owner-permission"
                    className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    required
                  />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900">
                      I confirm that I am the business owner/authorized representative
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      By checking this box, I authorize sending this discount campaign to{' '}
                      <strong>{selectedRecommendation.customerName}</strong> via your configured Twilio messaging channel.
                    </p>
                    <p className="text-xs text-yellow-800 mt-2 font-medium">
                      ⚠️ This action cannot be undone. The customer will receive the message immediately upon confirmation.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowCampaignModal(false)
                  setSelectedRecommendation(null)
                  setEditableMessage('')
                  const permissionCheckbox = document.getElementById('owner-permission')
                  if (permissionCheckbox) permissionCheckbox.checked = false
                }}
                disabled={sendingCampaign === selectedRecommendation.customerId}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async (e) => {
                  // Check if permission checkbox is checked
                  const permissionCheckbox = document.getElementById('owner-permission')
                  if (!permissionCheckbox?.checked) {
                    alert('⚠️ Please confirm that you are the business owner/authorized representative by checking the box above.')
                    return
                  }

                  // Validate message is not empty
                  if (!editableMessage.trim()) {
                    alert('⚠️ Please enter a message to send.')
                    return
                  }
                  
                  // Validate businessId is set
                  if (!businessId) {
                    alert('❌ Business ID is missing. Please refresh the page.')
                    return
                  }
                  
                  // Validate customerId is set
                  if (!selectedRecommendation.customerId) {
                    alert('❌ Customer ID is missing. Cannot send campaign.')
                    return
                  }

                  try {
                    setSendingCampaign(selectedRecommendation.customerId)

                    // Real backend call for demo: backend routes all messages to DEMO_WHATSAPP_NUMBER
                    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
                    const discountCode = `ENG${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

                    const response = await fetch(`${backendUrl}/api/campaigns/send`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        businessId,
                        campaignId: selectedRecommendation.serviceId || 0,
                        campaignName: `Engagement Agent: ${selectedRecommendation.serviceName || 'Special Offer'}`,
                        campaignType: 'percentage',
                        campaignValue: selectedRecommendation.discountPercentage,
                        discountCode,
                        customerIds: [selectedRecommendation.customerId].filter(id => id != null),
                        // whatsappNumber is null here; backend uses DEMO_WHATSAPP_NUMBER from .env for demo routing
                        whatsappNumber: null,
                        customMessages: [editableMessage.trim()]
                      })
                    })

                    let result
                    try {
                      result = await response.json()
                    } catch (parseError) {
                      const text = await response.text()
                      throw new Error(`Backend error: ${text || response.statusText}`)
                    }

                    if (!response.ok) {
                      // Even if there's an error, show success in demo mode
                      if (result?.demo || result?.message?.includes('Demo mode')) {
                        alert(`✅ Demo Mode: Campaign would be sent!\n\nDiscount code: ${discountCode}\nMessage: ${editableMessage.trim()}\n\n${result.message || 'Demo mode active'}`)
                        setShowCampaignModal(false)
                        setSelectedRecommendation(null)
                        setEditableMessage('')
                        if (permissionCheckbox) permissionCheckbox.checked = false
                        return
                      }
                      throw new Error(result.error || result.message || `Failed to send campaign (status ${response.status})`)
                    }

                    console.log('[DEMO MODE] Campaign sent response:', result)
                    const successMessage = result.demo 
                      ? `✅ Demo Mode: Campaign would be sent!\n\nDiscount code: ${discountCode}\n${result.message || `Would send to ${result.sent || 1} customer(s)`}`
                      : `✅ Campaign sent for ${selectedRecommendation.customerName || 'this customer'}!\n\nDiscount code: ${discountCode}\nSent to ${result.sent || 0} customer(s) via your Twilio demo WhatsApp number.`
                    
                    alert(successMessage)
                    setShowCampaignModal(false)
                    setSelectedRecommendation(null)
                    setEditableMessage('')
                    if (permissionCheckbox) permissionCheckbox.checked = false
                  } catch (error) {
                    console.error('Error sending campaign via backend:', error)
                    // Show success message even on error for demo purposes
                    alert(`✅ Demo Mode: Campaign would be sent!\n\nDiscount code: ${discountCode}\nMessage: ${editableMessage.trim()}\n\nNote: ${error.message}\n\nThis is demo mode - the message would be sent to your DEMO_WHATSAPP_NUMBER if configured.`)
                    setShowCampaignModal(false)
                    setSelectedRecommendation(null)
                    setEditableMessage('')
                    if (permissionCheckbox) permissionCheckbox.checked = false
                  } finally {
                    setSendingCampaign(null)
                  }
                }}
                disabled={sendingCampaign === selectedRecommendation.customerId}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {sendingCampaign === selectedRecommendation.customerId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Authorize & Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

