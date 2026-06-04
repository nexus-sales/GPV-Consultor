// Restrict to known app domains; APP_ORIGIN can be a comma-separated list.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://gpvcanarias.netlify.app',
  'http://localhost:3000'
]

const getAllowedOrigins = (): string[] => {
  const configuredOrigins = Deno.env.get('APP_ORIGIN')
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return [...new Set([...(configuredOrigins ?? []), ...DEFAULT_ALLOWED_ORIGINS])]
}

export const getCorsHeaders = (request?: Request) => {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = request?.headers.get('Origin')
  const allowedOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
}

export const corsHeaders = getCorsHeaders()

export const jsonResponse = (
  body: unknown,
  status = 200,
  request?: Request
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      'Content-Type': 'application/json'
    }
  })

export const handleCors = (request: Request): Response | null => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(request) })
  }

  return null
}
