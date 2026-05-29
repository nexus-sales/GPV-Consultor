// Restrict to the app's domain; set APP_ORIGIN in Supabase Edge Function env vars
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'https://gpvcanarias.netlify.app'

export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

export const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json'
    }
  })

export const handleCors = (request: Request): Response | null => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  return null
}
