import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  deleteOAuthConnection,
  ensureFields,
  getAuthenticatedUserFromToken,
  readJsonBody
} from '../_shared/oauth.ts'

interface OAuthDisconnectRequest {
  provider?: 'google' | 'microsoft'
  userAccessToken?: string
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<OAuthDisconnectRequest>(request)
    ensureFields(payload, ['provider'])
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)

    await deleteOAuthConnection(user.id, payload.provider!)

    return jsonResponse({ success: true })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})