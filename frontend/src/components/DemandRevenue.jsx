import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react'

export default function DemandRevenue({ bookings, stats }) {
  // Calculate bookings per day of week for next 7 days
  const getNext7Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        bookings: 0,
        revenue: 0
      })
    }
    return days
  }

  const upcomingDays = getNext7Days()

  // Count bookings and revenue for each day
  bookings?.forEach(booking => {
    const bookingDate = new Date(booking.start_time)
    bookingDate.setHours(0, 0, 0, 0)
    
    upcomingDays.forEach(day => {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      
      if (dayDate.getTime() === bookingDate.getTime() && booking.status !== 'cancelled') {
        day.bookings++
        if (booking.status === 'completed' || booking.status === 'booked') {
          day.revenue += booking.services?.price || 0
        }
      }
    })
  })

  // Calculate average for low demand detection
  const avgBookings = upcomingDays.reduce((sum, day) => sum + day.bookings, 0) / 7
  const lowDemandThreshold = avgBookings * 0.5 // 50% below average = low demand

  const lowDemandDays = upcomingDays.filter(day => day.bookings < lowDemandThreshold && day.date >= new Date())

  // Revenue estimate for next week
  const weeklyRevenueEstimate = upcomingDays.reduce((sum, day) => sum + day.revenue, 0)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Demand & Revenue</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Next 7 Days Revenue</p>
          <p className="text-lg font-bold text-green-600">${weeklyRevenueEstimate.toFixed(2)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={upcomingDays}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="dayName" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [
              name === 'bookings' ? `${value} bookings` : `$${parseFloat(value).toFixed(2)}`,
              name === 'bookings' ? 'Bookings' : 'Revenue'
            ]}
          />
          <Bar dataKey="bookings" name="bookings" radius={[4, 4, 0, 0]}>
            {upcomingDays.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.bookings < lowDemandThreshold ? '#fbbf24' : '#0ea5e9'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {lowDemandDays.length > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <TrendingDown className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Low Demand Detected</p>
              <p className="text-xs text-yellow-700 mt-1">
                Consider offering discounts on:{' '}
                {lowDemandDays.map(day => day.dayName).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-500">Avg/Day</p>
          <p className="text-sm font-semibold text-gray-900">{avgBookings.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Bookings</p>
          <p className="text-sm font-semibold text-gray-900">
            {upcomingDays.reduce((sum, day) => sum + day.bookings, 0)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Low Days</p>
          <p className="text-sm font-semibold text-yellow-600">{lowDemandDays.length}</p>
        </div>
      </div>
    </div>
  )
}
