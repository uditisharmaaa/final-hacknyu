import { useState, useEffect, useRef } from 'react'
import { Users, Calendar, DollarSign, Activity, Phone, Building2, ChevronDown } from 'lucide-react'
import StatCard from './components/StatCard'
import TodayView from './components/TodayView'
import CustomersTable from './components/CustomersTable'
import DemandRevenue from './components/DemandRevenue'
import AutomationSettings from './components/AutomationSettings'
import { useBusiness } from './lib/businessContext.jsx'
import { getDashboardStats, getBookings, getCustomers, getServices, getAllBusinesses } from './services/dataService'

function App() {
  const { currentBusiness, loading: businessLoading, switchBusiness, businesses } = useBusiness()
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [allBusinesses, setAllBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showBusinessSelector, setShowBusinessSelector] = useState(false)
  const businessSelectorRef = useRef(null)

  // Close business selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (businessSelectorRef.current && !businessSelectorRef.current.contains(event.target)) {
        setShowBusinessSelector(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load all businesses for demo selector
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const data = await getAllBusinesses()
        setAllBusinesses(data)
      } catch (err) {
        console.error('Error loading businesses:', err)
      }
    }
    loadBusinesses()
  }, [])

  useEffect(() => {
    if (!currentBusiness) return

    async function fetchData() {
      try {
        setLoading(true)
        const businessId = currentBusiness.id
        const [dashboardStats, bookingsData, customersData, servicesData] = await Promise.all([
          getDashboardStats(businessId),
          getBookings(businessId),
          getCustomers(businessId),
          getServices(businessId)
        ])
        setStats(dashboardStats)
        setBookings(bookingsData)
        setCustomers(customersData)
        setServices(servicesData)
        setError(null)
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [currentBusiness])

  if (businessLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-600">{error}</p>
          <p className="text-sm text-red-500 mt-4">
            Please check your Supabase configuration and ensure the database tables are set up correctly.
          </p>
        </div>
      </div>
    )
  }

  if (!currentBusiness) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">No Business Found</h2>
          <p className="text-yellow-600">Please set up a business in your Supabase database.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">AI Business Assistant</h1>
              <p className="text-sm text-gray-600 mt-0.5">Voice receptionist & CRM dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Business Selector */}
              {allBusinesses.length > 1 && (
                <div className="relative" ref={businessSelectorRef}>
                  <button
                    onClick={() => setShowBusinessSelector(!showBusinessSelector)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>{currentBusiness.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showBusinessSelector && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                      {allBusinesses.map((business) => (
                        <button
                          key={business.id}
                          onClick={() => {
                            switchBusiness(business.id)
                            setShowBusinessSelector(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            currentBusiness.id === business.id ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                          }`}
                        >
                          <div className="font-medium">{business.name}</div>
                          <div className="text-xs text-gray-500">{business.industry}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-primary-600" />
                <span>Receptionist Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Compact Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Today's Bookings"
            value={stats?.todayBookings || 0}
            icon={Calendar}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={`$${parseFloat(stats?.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Customers"
            value={stats?.customers || 0}
            icon={Users}
            color="purple"
          />
          <StatCard
            title="Recent (7 days)"
            value={stats?.recentBookings || 0}
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Main Dashboard Grid - Compact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's Appointments - Takes 2 columns */}
          <div className="lg:col-span-2">
            <TodayView bookings={bookings} />
          </div>

          {/* Automation Settings - Takes 1 column */}
          <div>
            <AutomationSettings services={services} />
          </div>
        </div>

        {/* Secondary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customers Table */}
          <div>
            <CustomersTable customers={customers} bookings={bookings} />
          </div>

          {/* Demand & Revenue */}
          <div>
            <DemandRevenue bookings={bookings} stats={stats} />
          </div>
        </div>
      </main>

      {/* Compact Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-xs text-gray-500">
            AI Business Assistant • Built with React, Supabase & OpenRouter
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App