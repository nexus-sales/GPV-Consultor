import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

import { logger } from './logger'
import { env, isSupabaseConfigured } from './config'

const createDisabledClient = (): SupabaseClient => {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(
        'Supabase no está configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
      )
    }
  })
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(env.supabaseUrl!, env.supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createDisabledClient()

if (!isSupabaseConfigured && import.meta.env.DEV) {
  logger.warn(
    'Supabase no configurado: la app funcionará en modo local (sin nube).'
  )
}
