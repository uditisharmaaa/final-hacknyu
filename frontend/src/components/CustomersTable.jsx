import { useState, useMemo } from 'react'
import { Search, User, Phone, Mail, Calendar, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function CustomersTable({ customers, bookings }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Calculate customer stats
  const customerStats = useMemo(() => {
    const stats = {}
    bookings.forEach(booking => {
      const customerId = booking.customer_id
      if (!stats[customerId]) {
        stats[customerId] = {
          visitCount: 0,
          lastVisit: null,
          totalSpent: 0,
          preferredService: null,
          services: {}
        }
      }
      stats[customerId].visitCount++
      const visitDate = new Date(booking.start_time)
      if (!stats[customerId].lastVisit || visitDate > stats[customerId].lastVisit) {
        stats[customerId].lastVisit = visitDate
      }
      if (booking.status === 'completed') {
        stats[customerId].totalSpent += booking.services?.price || 0
      }
      const serviceName = booking.services?.name || 'Unknown'
      stats[customerId].services[serviceName] = (stats[customerId].services[serviceName] || 0) + 1
    })

    // Find preferred service for each customer
    Object.keys(stats).forEach(customerId => {
      const services = stats[customerId].services
      const topService = Object.entries(services).sort((a, b) => b[1] - a[1])[0]
      stats[customerId].preferredService = topService ? topService[0] : null
    })

    return stats
  }, [bookings])

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers || []
    const term = searchTerm.toLowerCase()
    return (customers || []).filter(customer =>
      customer.name?.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.toLowerCase().includes(term) ||
      customer.company_name?.toLowerCase().includes(term)
    )
  }, [customers, searchTerm])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <User className="w-5 h-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Customers</h2>
          <span className="text-sm text-gray-500">({filteredCustomers.length})</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preferred Service</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length > 0 ? (
              filteredCustomers.slice(0, 10).map((customer) => {
                const stats = customerStats[customer.id] || {
                  visitCount: 0,
                  lastVisit: null,
                  totalSpent: 0,
                  preferredService: null
                }

                return (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{customer.name || 'Unknown'}</div>
                          {customer.company_name && (
                            <div className="text-xs text-gray-500">{customer.company_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {customer.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center space-x-1 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="text-xs">{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{stats.visitCount}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {stats.lastVisit ? format(stats.lastVisit, 'MMM d, yyyy') : 'Never'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{stats.preferredService || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">${stats.totalSpent.toFixed(2)}</span>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{selectedCustomer.name}</h3>
            <div className="space-y-2 text-sm">
              {selectedCustomer.phone && <p><strong>Phone:</strong> {selectedCustomer.phone}</p>}
              {selectedCustomer.email && <p><strong>Email:</strong> {selectedCustomer.email}</p>}
              {selectedCustomer.gender && <p><strong>Gender:</strong> {selectedCustomer.gender}</p>}
              {selectedCustomer.age && <p><strong>Age:</strong> {selectedCustomer.age}</p>}
              {selectedCustomer.preferred_language && <p><strong>Language:</strong> {selectedCustomer.preferred_language}</p>}
            </div>
            <button
              onClick={() => setSelectedCustomer(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
