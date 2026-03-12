import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

// Usar las variables de entorno que existen en Netlify
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Validación estricta en producción, warning en desarrollo
if (!supabaseUrl) {
  const msg = 'VITE_SUPABASE_URL no está definida'
  if (import.meta.env.PROD) {
    throw new Error(msg)
  }
  logger.warn(msg)
}

if (!supabaseAnonKey) {
  const msg = 'VITE_SUPABASE_ANON_KEY no está definida'
  if (import.meta.env.PROD) {
    throw new Error(msg)
  }
  logger.warn(msg)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
