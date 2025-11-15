import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create client with fallback empty strings if env vars are missing
// This allows the app to render and show an error message instead of crashing
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey)

