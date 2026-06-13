import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getAuthenticatedUser, readRequiredEnv } from '../_shared/oauth.ts'

interface ManageUserBody {
  userId: string
  blocked: boolean
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req)
  if (corsResp) return corsResp
  const reply = (body: unknown, status = 200) => jsonResponse(body, status, req)

  if (req.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405)

  // 1. Verificar que el llamador es admin
  let callerUser
  try {
    callerUser = await getAuthenticatedUser(req)
  } catch {
    return reply({ error: 'unauthorized' }, 401)
  }

  const admin = createClient(
    readRequiredEnv('SUPABASE_URL'),
    readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: callerProfile } = await admin
    .from('user_profilesGPV')
    .select('role')
    .eq('id', callerUser.id)
    .maybeSingle()

  if (callerProfile?.role !== 'admin') return reply({ error: 'forbidden' }, 403)

  // 2. Validar body
  let body: Partial<ManageUserBody>
  try {
    body = await req.json()
  } catch {
    return reply({ error: 'invalid_json' }, 400)
  }

  if (!body.userId || typeof body.userId !== 'string') {
    return reply({ error: 'validation_error', details: ['userId es obligatorio'] }, 400)
  }
  if (typeof body.blocked !== 'boolean') {
    return reply({ error: 'validation_error', details: ['blocked debe ser boolean'] }, 400)
  }

  // 3. No puede bloquearse a sí mismo
  if (body.userId === callerUser.id) {
    return reply({ error: 'self_block_forbidden' }, 400)
  }

  // 4. Bloquear/desbloquear en Supabase Auth
  // ban_duration '876600h' ≈ 100 años (bloqueo permanente); 'none' desbloquea.
  const { error: banError } = await admin.auth.admin.updateUserById(body.userId, {
    ban_duration: body.blocked ? '876600h' : 'none'
  })

  if (banError) {
    return reply({ error: 'auth_update_failed', detail: banError.message }, 500)
  }

  // 5. Reflejar estado en el perfil para que el frontend pueda leerlo sin admin API
  const { error: profileError } = await admin
    .from('user_profilesGPV')
    .update({ blocked: body.blocked })
    .eq('id', body.userId)

  if (profileError) {
    return reply({ error: 'profile_update_failed', detail: profileError.message }, 500)
  }

  return reply({ blocked: body.blocked })
})
