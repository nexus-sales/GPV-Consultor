// Restrict to known app domains; APP_ORIGIN can be a comma-separated list.
const DEFAULT_ALLOWED_ORIGINS = [
  'https://gpv.nexus-sales.eu',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]

const normalizeOrigin = (origin: string): string =>
  origin.trim().replace(/\/$/, '')

const getAllowedOrigins = (): string[] => {
  const configuredOrigins = Deno.env.get('APP_ORIGIN')
    ?.split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

  return [...new Set([...(configuredOrigins ?? []), ...DEFAULT_ALLOWED_ORIGINS])]
}

export const getCorsHeaders = (request?: Request) => {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = request?.headers.get('Origin')
    ? normalizeOrigin(request.headers.get('Origin') as string)
    : null
  const allowedOrigin =
    requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    Vary: 'Origin',
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
