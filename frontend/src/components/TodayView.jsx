import { format, isSameDay } from 'date-fns'
import { Clock, User, Phone, Calendar as CalendarIcon, Plus } from 'lucide-react'

export default function TodayView({ bookings }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayBookings = (bookings || [])
    .filter(booking => {
      const bookingDate = new Date(booking.start_time)
      bookingDate.setHours(0, 0, 0, 0)
      return isSameDay(bookingDate, today) && booking.status !== 'cancelled'
    })
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'booked': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'no_show': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✓'
      case 'booked': return '●'
      case 'no_show': return '!'
      default: return '○'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
          <span className="text-sm text-gray-500">({todayBookings.length})</span>
        </div>
        <button className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700 font-medium">
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {todayBookings.length > 0 ? (
          todayBookings.map((booking) => {
            const startTime = new Date(booking.start_time)
            const endTime = new Date(booking.end_time)
            const now = new Date()
            const isPast = endTime < now

            return (
              <div
                key={booking.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  isPast ? 'bg-gray-50 opacity-75' : 'bg-white'
                } ${getStatusColor(booking.status)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    booking.status === 'completed' ? 'bg-green-200' :
                    booking.status === 'booked' ? 'bg-blue-200' :
                    'bg-yellow-200'
                  }`}>
                    <Clock className="w-5 h-5 text-gray-700" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {booking.customers?.name || 'Unknown Customer'}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)} {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {booking.services?.name || 'Unknown Service'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}</span>
                    </span>
                    {booking.customers?.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{booking.customers.phone}</span>
                      </span>
                    )}
                    <span className="text-gray-400">
                      ${(booking.services?.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No appointments scheduled for today</p>
          </div>
        )}
      </div>
    </div>
  )
}
