import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Warning: Supabase credentials not found. Some features may not work.')
  console.warn('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
}

// Use service role key for backend (has admin privileges)
// Fall back to anon key if service role key is not available
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

export const hasSupabaseConfig = !!(supabaseUrl && supabaseServiceKey)

