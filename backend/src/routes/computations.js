import express from 'express'
import { supabase, hasSupabaseConfig } from '../services/supabase.js'

const router = express.Router()

// Example computation: Get statistics for a table
router.get('/stats/:tableName', async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured' 
    })
  }

  const { tableName } = req.params

  try {
    // Get all data
    const { data, error } = await supabase
      .from(tableName)
      .select('*')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.json({
        table: tableName,
        totalRows: 0,
        columns: [],
        statistics: {}
      })
    }

    // Compute statistics
    const columns = Object.keys(data[0])
    const statistics = {}

    columns.forEach(column => {
      const values = data.map(row => row[column]).filter(val => val != null)
      
      if (values.length === 0) {
        statistics[column] = { type: 'empty', count: 0 }
        return
      }

      const firstValue = values[0]
      const isNumeric = typeof firstValue === 'number' || !isNaN(parseFloat(firstValue))

      if (isNumeric) {
        const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
        if (nums.length > 0) {
          const sum = nums.reduce((a, b) => a + b, 0)
          const avg = sum / nums.length
          const sorted = [...nums].sort((a, b) => a - b)
          const min = sorted[0]
          const max = sorted[sorted.length - 1]
          const median = sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]

          statistics[column] = {
            type: 'numeric',
            count: nums.length,
            sum: sum,
            average: avg,
            min: min,
            max: max,
            median: median
          }
        }
      } else {
        // String/categorical statistics
        const uniqueValues = new Set(values.map(v => String(v)))
        const valueCounts = {}
        values.forEach(v => {
          const str = String(v)
          valueCounts[str] = (valueCounts[str] || 0) + 1
        })

        statistics[column] = {
          type: 'categorical',
          count: values.length,
          uniqueCount: uniqueValues.size,
          mostCommon: Object.entries(valueCounts)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || null
        }
      }
    })

    res.json({
      table: tableName,
      totalRows: data.length,
      columns: columns,
      statistics: statistics
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Example computation: Aggregate data (sum, count, average by a group column)
router.post('/aggregate/:tableName', async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured' 
    })
  }

  const { tableName } = req.params
  const { groupBy, aggregateColumn, operation = 'sum' } = req.body

  if (!groupBy || !aggregateColumn) {
    return res.status(400).json({ 
      error: 'groupBy and aggregateColumn are required' 
    })
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(`${groupBy}, ${aggregateColumn}`)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.json({ results: [] })
    }

    // Group and aggregate
    const grouped = {}
    data.forEach(row => {
      const key = String(row[groupBy])
      const value = parseFloat(row[aggregateColumn])

      if (!grouped[key]) {
        grouped[key] = {
          group: key,
          values: [],
          count: 0
        }
      }

      if (!isNaN(value)) {
        grouped[key].values.push(value)
        grouped[key].count++
      }
    })

    // Apply operation
    const results = Object.values(grouped).map(group => {
      let result = 0
      switch (operation.toLowerCase()) {
        case 'sum':
          result = group.values.reduce((a, b) => a + b, 0)
          break
        case 'avg':
        case 'average':
          result = group.values.reduce((a, b) => a + b, 0) / group.values.length
          break
        case 'min':
          result = Math.min(...group.values)
          break
        case 'max':
          result = Math.max(...group.values)
          break
        case 'count':
          result = group.count
          break
        default:
          result = group.values.reduce((a, b) => a + b, 0)
      }

      return {
        [groupBy]: group.group,
        [operation]: result,
        count: group.count
      }
    })

    res.json({
      table: tableName,
      groupBy: groupBy,
      aggregateColumn: aggregateColumn,
      operation: operation,
      results: results
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Custom computation endpoint - you can add your own computations here
router.post('/custom/:tableName', async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured' 
    })
  }

  const { tableName } = req.params
  const { computation } = req.body

  try {
    // Get data
    const { data, error } = await supabase
      .from(tableName)
      .select('*')

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    // Perform custom computation
    // This is a placeholder - add your custom logic here
    let result = null

    switch (computation) {
      case 'total_rows':
        result = { totalRows: data?.length || 0 }
        break
      case 'column_names':
        result = { 
          columns: data && data.length > 0 ? Object.keys(data[0]) : [] 
        }
        break
      default:
        return res.status(400).json({ 
          error: `Unknown computation: ${computation}` 
        })
    }

    res.json({
      table: tableName,
      computation: computation,
      result: result
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

