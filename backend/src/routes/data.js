import express from 'express'
import { supabase, hasSupabaseConfig } from '../services/supabase.js'

const router = express.Router()

// Get all data from a table
router.get('/:tableName', async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env' 
    })
  }

  const { tableName } = req.params
  const { limit = 100, offset = 0 } = req.query

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      data: data || [],
      count: data?.length || 0,
      table: tableName
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Get specific columns from a table
router.get('/:tableName/columns', async (req, res) => {
  if (!hasSupabaseConfig || !supabase) {
    return res.status(500).json({ 
      error: 'Supabase not configured' 
    })
  }

  const { tableName } = req.params
  const { columns } = req.query // comma-separated list of columns

  try {
    const columnList = columns ? columns.split(',') : ['*']
    
    const { data, error } = await supabase
      .from(tableName)
      .select(columnList.join(','))

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      data: data || [],
      columns: columnList,
      table: tableName
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

