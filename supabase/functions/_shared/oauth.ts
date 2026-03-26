import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

import { jsonResponse } from './cors.ts'

type OAuthProvider = 'google' | 'microsoft'

interface OAuthConnectionRecord {
  provider: OAuthProvider
  provider_user_email: string | null
  refresh_token: string
  scopes: string[]
  token_type: string | null
}

const OAUTH_CONNECTIONS_TABLE = 'integration_oauth_connectionsGPV'

export const readRequiredEnv = (name: string): string => {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Falta la variable de entorno ${name} en Supabase Edge Functions`)
  }

  return value
}

export const readJsonBody = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T
  } catch {
    throw new Error('El cuerpo JSON de la petición no es válido')
  }
}

export const ensureFields = (
  values: Record<string, string | undefined | null>,
  requiredFields: string[]
): void => {
  const missing = requiredFields.filter((field) => !values[field])

  if (missing.length > 0) {
    throw new Error(`Faltan campos obligatorios: ${missing.join(', ')}`)
  }
}

export const requestOAuthToken = async (
  url: string,
  body: URLSearchParams
): Promise<Response> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    return jsonResponse(
      {
        error: 'oauth_request_failed',
        status: response.status,
        providerResponse: payload
      },
      response.status
    )
  }

  return jsonResponse(payload)
}

export const requestOAuthTokenPayload = async (
  url: string,
  body: URLSearchParams
): Promise<Record<string, unknown>> => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        error: 'oauth_request_failed',
        status: response.status,
        providerResponse: payload
      })
    )
  }

  return (payload ?? {}) as Record<string, unknown>
}

const createServiceClient = () => {
  const supabaseUrl = readRequiredEnv('SUPABASE_URL')
  const serviceRoleKey = readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const getAuthenticatedUser = async (request: Request) => {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    throw new Error('No se encontró un token de usuario autenticado')
  }

  const supabase = createServiceClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('No se pudo validar al usuario autenticado')
  }

  return user
}

export const loadOAuthConnection = async (
  userId: string,
  provider: OAuthProvider
): Promise<OAuthConnectionRecord | null> => {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from(OAUTH_CONNECTIONS_TABLE)
    .select('provider, provider_user_email, refresh_token, scopes, token_type')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo cargar la conexión OAuth: ${error.message}`)
  }

  return data as OAuthConnectionRecord | null
}

export const saveOAuthConnection = async (params: {
  userId: string
  provider: OAuthProvider
  refreshToken: string
  scopes: string[]
  tokenType?: string | null
  providerUserEmail?: string | null
}) => {
  const supabase = createServiceClient()
  const { error } = await supabase.from(OAUTH_CONNECTIONS_TABLE).upsert(
    {
      user_id: params.userId,
      provider: params.provider,
      provider_user_email: params.providerUserEmail ?? null,
      refresh_token: params.refreshToken,
      scopes: params.scopes,
      token_type: params.tokenType ?? null,
      updated_at: new Date().toISOString(),
      last_refreshed_at: new Date().toISOString()
    },
    { onConflict: 'user_id,provider' }
  )

  if (error) {
    throw new Error(`No se pudo guardar la conexión OAuth: ${error.message}`)
  }
}

export const deleteOAuthConnection = async (
  userId: string,
  provider: OAuthProvider
) => {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from(OAUTH_CONNECTIONS_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)

  if (error) {
    throw new Error(`No se pudo eliminar la conexión OAuth: ${error.message}`)
  }
}