import { z } from 'zod'
// Si no existe logger, usar un stub temporal para evitar error de import
const logger = {
  warn: (...args: unknown[]) => {
    console.warn(...args)
  }
}

const rawEnv = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ?? '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().trim(),
  VITE_SUPABASE_ANON_KEY: z.string().trim()
})

const parsedEnv = envSchema.parse(rawEnv)

const missingKeys = Object.entries(parsedEnv)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingKeys.length > 0) {
  const message = `Variables de entorno faltantes: ${missingKeys.join(', ')}`
  if (import.meta.env.PROD) {
    throw new Error(message)
  } else {
    logger.warn('[env]', message)
  }
}

export type EnvConfig = {
  supabaseUrl: string | null
  supabaseAnonKey: string | null
}

export const env: EnvConfig = {
  supabaseUrl: parsedEnv.VITE_SUPABASE_URL || null,
  supabaseAnonKey: parsedEnv.VITE_SUPABASE_ANON_KEY || null
}

export const isSupabaseConfigured = Boolean(
  env.supabaseUrl && env.supabaseAnonKey
)
