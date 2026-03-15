import { z } from 'zod'
import { logger } from './logger'

const rawEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  VITE_GOOGLE_PLACES_KEY: import.meta.env.VITE_GOOGLE_PLACES_KEY ?? ''
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().trim(),
  VITE_SUPABASE_ANON_KEY: z.string().trim(),
  VITE_GOOGLE_PLACES_KEY: z.string().trim().optional()
})

const parsedEnv = envSchema.safeParse(rawEnv)

if (!parsedEnv.success) {
  const message = `Error validando variables de entorno: ${parsedEnv.error.message}`
  if (import.meta.env.PROD) {
    throw new Error(message)
  } else {
    logger.warn('Config', message)
  }
} else {
  const missingKeys = Object.entries(parsedEnv.data)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missingKeys.length > 0) {
    const message = `Variables de entorno faltantes: ${missingKeys.join(', ')}`
    if (import.meta.env.PROD) {
      throw new Error(message)
    } else {
      logger.warn('Config', message)
    }
  }
}

export type EnvConfig = {
  supabaseUrl: string | null
  supabaseAnonKey: string | null
  googlePlacesKey: string | null
}

export const env: EnvConfig = {
  supabaseUrl: parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_URL || null : null,
  supabaseAnonKey: parsedEnv.success ? parsedEnv.data.VITE_SUPABASE_ANON_KEY || null : null,
  googlePlacesKey: parsedEnv.success ? parsedEnv.data.VITE_GOOGLE_PLACES_KEY || null : null
}

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey
)
