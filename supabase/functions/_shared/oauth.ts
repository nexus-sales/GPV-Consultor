import { jsonResponse } from './cors.ts'

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