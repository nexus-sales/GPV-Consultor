import { handleCors, jsonResponse } from '../_shared/cors.ts'
import {
  deleteOAuthConnection,
  ensureFields,
  getAuthenticatedUser,
  readJsonBody
} from '../_shared/oauth.ts'

interface OAuthDisconnectRequest {
  provider?: 'google' | 'microsoft'
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405)
  }

  try {
    const user = await getAuthenticatedUser(request)
    const payload = await readJsonBody<OAuthDisconnectRequest>(request)
    ensureFields(payload, ['provider'])

    await deleteOAuthConnection(user.id, payload.provider!)

    return jsonResponse({ success: true })
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})