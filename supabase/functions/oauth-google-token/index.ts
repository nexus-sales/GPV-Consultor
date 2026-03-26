import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  ensureFields,
  readJsonBody,
  readRequiredEnv,
  requestOAuthToken
} from '../_shared/oauth.ts'

interface GoogleTokenRequest {
  code?: string
  codeVerifier?: string
  redirectUri?: string
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<GoogleTokenRequest>(request)
    ensureFields(payload, ['code', 'codeVerifier', 'redirectUri'])

    const clientId = readRequiredEnv('GOOGLE_CLIENT_ID')
    const clientSecret = readRequiredEnv('GOOGLE_CLIENT_SECRET')

    return await requestOAuthToken(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: payload.code!,
        code_verifier: payload.codeVerifier!,
        grant_type: 'authorization_code',
        redirect_uri: payload.redirectUri!
      })
    )
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})