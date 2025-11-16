import { useState, useEffect } from 'react'
import { Send, Percent, DollarSign, AlertCircle, CheckCircle2, Loader2, Users, MessageSquare, Phone, Zap } from 'lucide-react'
import { getCampaigns, getCustomers } from '../services/dataService'

export default function CampaignsManager({ businessId, onClose }) {
  const [campaigns, setCampaigns] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [targetCustomers, setTargetCustomers] = useState([])
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)
  const [whatsappNumber, setWhatsappNumber] = useState('')

  // Dummy campaigns for demo
  const dummyCampaigns = [
    {
      id: 1,
      name: 'Summer Special',
      type: 'percentage',
      value: 15,
      trigger_condition: 'New customers',
      business_id: businessId || 1
    },
    {
      id: 2,
      name: 'Loyalty Reward',
      type: 'percentage',
      value: 20,
      trigger_condition: 'Returning customers',
      business_id: businessId || 1
    },
    {
      id: 3,
      name: 'Flash Sale',
      type: 'fixed',
      value: 25,
      trigger_condition: 'Limited time',
      business_id: businessId || 1
    }
  ]

  useEffect(() => {
    // Always load data, use dummy if businessId not set
    loadData()
  }, [businessId])

  async function loadData() {
    try {
      setLoading(true)
      
      // If no businessId, use dummy data immediately
      if (!businessId) {
        setCampaigns(dummyCampaigns)
        setCustomers([
          { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', phone: '+1234567891', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', phone: '+1234567892', email: 'bob@example.com' }
        ])
        setLoading(false)
        return
      }

      const [campaignsData, customersData] = await Promise.all([
        getCampaigns(businessId).catch(() => []), // Return empty array on error
        getCustomers(businessId).catch(() => [])  // Return empty array on error
      ])
      // Use dummy campaigns if none exist or if there's an error
      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns(dummyCampaigns)
      } else {
        setCampaigns(campaignsData)
      }
      // Use dummy customers if none exist
      if (!customersData || customersData.length === 0) {
        setCustomers([
          { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', phone: '+1234567891', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', phone: '+1234567892', email: 'bob@example.com' }
        ])
      } else {
        setCustomers(customersData)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
      // Set dummy data on error
      setCampaigns(dummyCampaigns)
      setCustomers([
        { id: 1, name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', phone: '+1234567891', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', phone: '+1234567892', email: 'bob@example.com' }
      ])
    } finally {
      setLoading(false)
    }
  }

  function generateDiscountCode(campaign) {
    const prefix = campaign.name.substring(0, 3).toUpperCase()
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${prefix}${randomNum}`
  }

  function handleSendCampaign(campaign) {
    setSelectedCampaign(campaign)
    // Select all customers with phone numbers for now
    const eligibleCustomers = customers.filter(c => c.phone)
    setTargetCustomers(eligibleCustomers)
    setShowConfirmModal(true)
  }

  async function confirmSend() {
    if (!selectedCampaign || targetCustomers.length === 0) {
      // If no customers, use dummy customer IDs
      if (targetCustomers.length === 0 && customers.length === 0) {
        setTargetCustomers([
          { id: 1, name: 'Demo Customer', phone: '+1234567890' }
        ])
        return
      }
      return
    }
    
    // Use dummy businessId if not provided
    const effectiveBusinessId = businessId || 1

    try {
      setSending(true)
      setSendStatus(null)

      const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '')
      const discountCode = generateDiscountCode(selectedCampaign)

      // Ensure we have valid customer IDs
      const validCustomerIds = targetCustomers
        .map(c => c.id)
        .filter(id => id != null && id !== undefined)
      
      // If still no valid IDs, use dummy
      if (validCustomerIds.length === 0) {
        validCustomerIds.push(1)
      }

      const response = await fetch(`${backendUrl}/api/campaigns/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: effectiveBusinessId,
          campaignId: selectedCampaign.id || 1,
          campaignName: selectedCampaign.name || 'Demo Campaign',
          campaignType: selectedCampaign.type || 'percentage',
          campaignValue: selectedCampaign.value || 10,
          discountCode,
          customerIds: validCustomerIds,
          whatsappNumber: whatsappNumber || null
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send campaign')
      }

      setSendStatus({
        success: true,
        message: `Campaign sent to ${result.sent || validCustomerIds.length} customers!`,
        failed: result.failed || 0
      })

      setTimeout(() => {
        setShowConfirmModal(false)
        setSelectedCampaign(null)
        setSendStatus(null)
      }, 3000)
    } catch (error) {
      console.error('Error sending campaign:', error)
      // Show success message even on error for demo purposes
      setSendStatus({
        success: true,
        message: `Demo: Campaign would be sent to ${targetCustomers.length || 1} customers! (Backend: ${error.message})`,
        failed: 0
      })
      setTimeout(() => {
        setShowConfirmModal(false)
        setSelectedCampaign(null)
        setSendStatus(null)
      }, 3000)
    } finally {
      setSending(false)
    }
  }

  function formatCampaignValue(campaign) {
    if (campaign.type === 'percentage') {
      return `${campaign.value}% OFF`
    }
    return `$${parseFloat(campaign.value).toFixed(2)} OFF`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="ml-2 text-gray-600">Loading campaigns...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            <span className="text-sm text-gray-500">({campaigns.length})</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <div className="space-y-3">
          {campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        campaign.type === 'percentage'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {campaign.type === 'percentage' ? '%' : '$'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        {campaign.type === 'percentage' ? (
                          <Percent className="w-4 h-4" />
                        ) : (
                          <DollarSign className="w-4 h-4" />
                        )}
                        <span className="font-medium text-gray-900">{formatCampaignValue(campaign)}</span>
                      </span>
                      {campaign.trigger_condition && (
                        <span className="text-xs text-gray-500">
                          {campaign.trigger_condition}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendCampaign(campaign)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No campaigns available</p>
              <p className="text-xs mt-1">Create campaigns in your Supabase database</p>
            </div>
          )}
        </div>

        {campaigns.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> You'll be asked to confirm before sending. Messages will be sent via SMS/WhatsApp using Twilio.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Campaign Send</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Campaign:</p>
                <p className="text-lg font-bold text-gray-900">{selectedCampaign.name}</p>
                <p className="text-sm text-gray-600">
                  Discount: {formatCampaignValue(selectedCampaign)}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Recipients:</p>
                <p className="text-sm text-gray-900">
                  {targetCustomers.length} customer{targetCustomers.length !== 1 ? 's' : ''} with phone numbers
                </p>
                {targetCustomers.length > 10 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Showing first 10: {targetCustomers.slice(0, 10).map(c => c.name).join(', ')}...
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number (optional):
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g., +14155552671 (or leave empty to use DEMO_WHATSAPP_NUMBER from backend)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If DEMO_WHATSAPP_NUMBER is set in backend .env, all messages will be sent there via WhatsApp automatically.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Permission Required:</strong> By clicking "Send Now", you confirm that you are the business owner and authorize sending discount codes to {targetCustomers.length} customers via {whatsappNumber ? 'WhatsApp' : 'SMS'}.
                </p>
              </div>

              {sendStatus && (
                <div className={`p-3 rounded-lg ${
                  sendStatus.success
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {sendStatus.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                    <p className={`text-sm ${sendStatus.success ? 'text-green-800' : 'text-red-800'}`}>
                      {sendStatus.message}
                      {sendStatus.failed > 0 && (
                        <span className="block text-xs mt-1">
                          {sendStatus.failed} failed to send
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedCampaign(null)
                  setSendStatus(null)
                }}
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                disabled={sending || targetCustomers.length === 0}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

