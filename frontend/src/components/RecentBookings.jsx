import { format } from 'date-fns'

export default function RecentBookings({ bookings }) {
  const recent = (bookings || []).slice(0, 5)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'booked': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'no_show': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Bookings</h3>
      <div className="space-y-3">
        {recent.length > 0 ? (
          recent.map((booking) => (
            <div key={booking.id} className="flex items-center justify-between border-b pb-3 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {booking.customers?.name || 'Unknown Customer'}
                </p>
                <p className="text-sm text-gray-600">{booking.services?.name || 'Unknown Service'}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(booking.start_time), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  ${(booking.services?.price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No recent bookings</p>
        )}
      </div>
    </div>
  )
}
