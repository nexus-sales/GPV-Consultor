import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getAuthenticatedUser, readRequiredEnv } from '../_shared/oauth.ts'

interface DeleteUserBody {
  userId: string
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
  let body: Partial<DeleteUserBody>
  try {
    body = await req.json()
  } catch {
    return reply({ error: 'invalid_json' }, 400)
  }

  if (!body.userId || typeof body.userId !== 'string') {
    return reply({ error: 'validation_error', details: ['userId es obligatorio'] }, 400)
  }

  // 3. Impedir que el admin se elimine a sí mismo
  if (body.userId === callerUser.id) {
    return reply({ error: 'self_delete_forbidden' }, 400)
  }

  // 4. Eliminar de Supabase Auth (la FK en cascada borra el perfil si está configurada,
  //    pero lo borramos explícitamente para garantizarlo)
  const { error: authDeleteError } = await admin.auth.admin.deleteUser(body.userId)

  if (authDeleteError) {
    return reply({ error: 'auth_delete_failed', detail: authDeleteError.message }, 500)
  }

  // 5. Borrar perfil (por si no hay cascade)
  await admin.from('user_profilesGPV').delete().eq('id', body.userId)

  return reply({ deleted: true })
})
