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
  const reply = (body: unknown, status = 200) => jsonResponse(body, status, request)

  if (request.method !== 'POST') {
    return reply({ error: 'method_not_allowed' }, 405)
  }

  try {
    const payload = await readJsonBody<OAuthDisconnectRequest>(request)
    ensureFields(payload, ['provider'])
    const user = await getAuthenticatedUserFromToken(payload.userAccessToken)

    await deleteOAuthConnection(user.id, payload.provider!)

    return reply({ success: true })
  } catch (error) {
    return reply(
      { error: error instanceof Error ? error.message : 'unknown_error' },
      400
    )
  }
})
