import { useState, useEffect } from 'react'
import { Users, Calendar, DollarSign, TrendingUp, Activity, Briefcase } from 'lucide-react'
import StatCard from './components/StatCard'
import RevenueChart from './components/RevenueChart'
import BookingStatusChart from './components/BookingStatusChart'
import ChannelChart from './components/ChannelChart'
import TopServices from './components/TopServices'
import GenderChart from './components/GenderChart'
import RecentBookings from './components/RecentBookings'
import { getDashboardStats, getBookings } from './services/dataService'

function App() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [dashboardStats, bookingsData] = await Promise.all([
          getDashboardStats(),
          getBookings()
        ])
        setStats(dashboardStats)
        setBookings(bookingsData)
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
  }, [])

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights and analytics</p>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`$${parseFloat(stats?.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Customers"
            value={stats?.customers || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Bookings"
            value={stats?.bookings || 0}
            icon={Calendar}
            color="purple"
          />
          <StatCard
            title="Today's Bookings"
            value={stats?.todayBookings || 0}
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={stats?.monthlyRevenue} />
          <BookingStatusChart data={stats?.bookingsByStatus} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChannelChart data={stats?.bookingsByChannel} />
          <GenderChart data={stats?.genderDistribution} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopServices data={stats?.topServices} />
          <RecentBookings bookings={bookings} />
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-8 h-8 text-primary-500" />
              <div>
                <p className="text-gray-500 text-sm">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.services || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-gray-500 text-sm">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.campaigns || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center space-x-3">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-gray-500 text-sm">Recent (7 days)</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.recentBookings || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            Booking Management Dashboard • Built with React & Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App