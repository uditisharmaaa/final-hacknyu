// API client for backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Data endpoints
  async getTableData(tableName, limit = 100, offset = 0) {
    return this.request(`/api/data/${tableName}?limit=${limit}&offset=${offset}`)
  }

  async getTableColumns(tableName, columns) {
    const columnsParam = columns ? columns.join(',') : '*'
    return this.request(`/api/data/${tableName}/columns?columns=${columnsParam}`)
  }

  // Computation endpoints
  async getTableStats(tableName) {
    return this.request(`/api/compute/stats/${tableName}`)
  }

  async aggregateData(tableName, groupBy, aggregateColumn, operation = 'sum') {
    return this.request(`/api/compute/aggregate/${tableName}`, {
      method: 'POST',
      body: JSON.stringify({ groupBy, aggregateColumn, operation }),
    })
  }

  async customComputation(tableName, computation) {
    return this.request(`/api/compute/custom/${tableName}`, {
      method: 'POST',
      body: JSON.stringify({ computation }),
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiClient = new ApiClient()

