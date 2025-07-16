import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pklqumlzpklzroafmtrs.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHF1bWx6cGtsenJvYWZtdHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMTcxNTIsImV4cCI6MjA2NzY5MzE1Mn0.eyzqg0hBZ5ZoPJKwGXPSKL96TJaPOX_p08dxt4FOn8g'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Test function to check Supabase connectivity
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.rpc('now')
    if (error) return { ok: false, error }
    return { ok: true, data }
  } catch (e) {
    return { ok: false, error: e }
  }
} 