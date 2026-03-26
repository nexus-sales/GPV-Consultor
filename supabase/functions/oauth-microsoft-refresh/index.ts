import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  ensureFields,
  readJsonBody,
  readRequiredEnv,
  requestOAuthToken
} from '../_shared/oauth.ts'

interface MicrosoftRefreshRequest {
  refreshToken?: string
  redirectUri?: string
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<MicrosoftRefreshRequest>(request)
    ensureFields(payload, ['refreshToken', 'redirectUri'])

    const clientId = readRequiredEnv('MICROSOFT_CLIENT_ID')
    const clientSecret = readRequiredEnv('MICROSOFT_CLIENT_SECRET')

    return await requestOAuthToken(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: payload.refreshToken!,
        grant_type: 'refresh_token',
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