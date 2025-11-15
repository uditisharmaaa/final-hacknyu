import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts'
import { DollarSign, TrendingDown, TrendingUp, Calendar } from 'lucide-react'
import { format, subDays, startOfDay, isAfter, isBefore } from 'date-fns'

export default function DemandRevenue({ bookings = [], stats }) {
  // Get last 30 days of historical data
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Ensure bookings is an array
  if (!Array.isArray(bookings)) {
    bookings = []
  }
  
  // Create array of last 30 days
  const historicalDays = []
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    historicalDays.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: format(date, 'MMM d'),
      bookings: 0,
      revenue: 0,
      isPast: i > 0,
      isToday: i === 0
    })
  }

  // Add upcoming 7 days for forecast
  const upcomingDays = []
  for (let i = 1; i <= 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    upcomingDays.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: format(date, 'MMM d'),
      bookings: 0,
      revenue: 0,
      isPast: false,
      isToday: false,
      isFuture: true
    })
  }

  const allDays = [...historicalDays, ...upcomingDays]

  // Count bookings and revenue for all days (historical + upcoming)
  bookings?.forEach(booking => {
    if (!booking.start_time) return
    
    const bookingDate = new Date(booking.start_time)
    if (isNaN(bookingDate.getTime())) return // Invalid date
    
    bookingDate.setHours(0, 0, 0, 0)
    const bookingDateStr = bookingDate.toISOString().split('T')[0]
    
    allDays.forEach(day => {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      const dayDateStr = dayDate.toISOString().split('T')[0]
      
      // Compare dates as strings to avoid timezone issues
      if (dayDateStr === bookingDateStr && booking.status !== 'cancelled') {
        day.bookings++
        // Only count completed bookings as revenue (they've been paid)
        if (booking.status === 'completed') {
          const price = booking.services?.price || booking.service_price || 0
          day.revenue += parseFloat(price) || 0
        }
      }
    })
  })

  // Calculate statistics from all 30 historical days (including today)
  const historicalBookings = historicalDays.map(d => d.bookings)
  const historicalRevenue = historicalDays.map(d => d.revenue)
  
  const totalBookings = historicalBookings.reduce((sum, b) => sum + b, 0)
  const totalRevenue = historicalRevenue.reduce((sum, r) => sum + r, 0)
  
  const avgBookings = historicalDays.length > 0 ? totalBookings / historicalDays.length : 0
  const avgRevenue = historicalDays.length > 0 ? totalRevenue / historicalDays.length : 0
  
  // Low demand detection for upcoming days
  const lowDemandThreshold = avgBookings * 0.5
  const lowDemandDays = upcomingDays.filter(day => day.bookings < lowDemandThreshold)

  // Revenue forecast for next 7 days (based on historical average)
  const weeklyRevenueForecast = avgRevenue * 7

  // Prepare chart data - show last 14 days + next 7 days for better visibility
  const chartData = [...historicalDays.slice(-14), ...upcomingDays]
  
  // Ensure chartData is valid
  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Demand & Revenue</h2>
          </div>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Demand & Revenue</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Last 30 Days Revenue</p>
          <p className="text-lg font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart showing historical + forecast */}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="dateLabel" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 10 }} 
            label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 10 }}
            label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
          />
          <Tooltip
            formatter={(value, name) => [
              name === 'bookings' ? `${value} bookings` : `$${parseFloat(value).toFixed(2)}`,
              name === 'bookings' ? 'Bookings' : 'Revenue'
            ]}
            labelFormatter={(label) => {
              const day = chartData.find(d => d.dateLabel === label)
              return day ? `${day.dayName}, ${label}` : label
            }}
          />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="bookings" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            name="bookings"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={2}
            name="revenue"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500">Avg Bookings/Day</p>
          <p className="text-sm font-semibold text-gray-900">{avgBookings.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Avg Revenue/Day</p>
          <p className="text-sm font-semibold text-green-600">${avgRevenue.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">7-Day Forecast</p>
          <p className="text-sm font-semibold text-blue-600">${weeklyRevenueForecast.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Low Days</p>
          <p className="text-sm font-semibold text-yellow-600">{lowDemandDays.length}</p>
        </div>
      </div>

      {/* Low Demand Alert */}
      {lowDemandDays.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Low Demand Forecast</p>
              <p className="text-xs text-yellow-700 mt-1">
                Consider offering discounts on:{' '}
                {lowDemandDays.map(day => day.dayName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trend Indicator */}
      {historicalDays.length >= 7 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Last 7 days avg:</span>
            <span className="font-medium text-gray-700">
              {(() => {
                const last7Days = historicalDays.slice(-7)
                const last7Revenue = last7Days.reduce((sum, d) => sum + d.revenue, 0)
                const last7Avg = last7Days.length > 0 ? last7Revenue / last7Days.length : 0
                return last7Avg > avgRevenue ? (
                  <span className="text-green-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Trending up
                  </span>
                ) : (
                  <span className="text-gray-600">Steady</span>
                )
              })()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
