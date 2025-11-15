import { useState, useEffect } from 'react'
import { supabase, hasSupabaseConfig } from '../lib/supabase'

function Dashboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tableName, setTableName] = useState('')

  useEffect(() => {
    fetchData()
  }, [tableName])

  const fetchData = async () => {
    if (!tableName) {
      setLoading(false)
      return
    }

    if (!hasSupabaseConfig || !supabase) {
      setError('Supabase configuration is missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data: fetchedData, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .limit(100)

      if (fetchError) throw fetchError

      setData(fetchedData || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTableChange = (e) => {
    setTableName(e.target.value)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Supabase Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">View and manage your Supabase data</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Supabase Config Warning */}
        {!hasSupabaseConfig && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">⚠️ Supabase Configuration Required</p>
            <p className="text-sm mt-1">
              Please create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in the <code className="bg-yellow-100 px-1 rounded">frontend</code> directory with:
            </p>
            <pre className="mt-2 text-xs bg-yellow-100 p-2 rounded overflow-x-auto">
{`VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}
            </pre>
          </div>
        )}
        
        {/* Table Selector */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label htmlFor="table-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Table
          </label>
          <div className="flex gap-4">
            <input
              id="table-select"
              type="text"
              value={tableName}
              onChange={handleTableChange}
              placeholder="Enter table name (e.g., 'users', 'products')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              onClick={fetchData}
              disabled={loading || !tableName}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && tableName && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
          </div>
        )}

        {/* Data Table */}
        {!loading && tableName && data.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Table: <span className="text-blue-600">{tableName}</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Showing {data.length} {data.length === 1 ? 'row' : 'rows'}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(data[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      {Object.keys(data[0]).map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {typeof row[key] === 'object' && row[key] !== null
                            ? JSON.stringify(row[key])
                            : String(row[key] ?? 'null')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tableName && data.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The table "{tableName}" exists but contains no rows.
            </p>
          </div>
        )}

        {/* Initial State */}
        {!tableName && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Get Started</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter a table name above to start viewing your Supabase data.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard

