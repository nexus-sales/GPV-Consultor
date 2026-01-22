import { createClient } from '@supabase/supabase-js'

// Usar las variables de entorno que existen en Netlify
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL no está definida')
}

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY no está definida')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
