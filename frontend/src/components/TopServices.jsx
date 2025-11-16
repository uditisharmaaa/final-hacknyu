export default function TopServices({ data }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Services</h3>
      <div className="space-y-4">
        {data && data.length > 0 ? (
          data.map(([service, count], index) => (
            <div key={service} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium text-gray-900">{service}</span>
              </div>
              <span className="text-gray-600 font-semibold">{count} bookings</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No service data available</p>
        )}
      </div>
    </div>
  )
}
