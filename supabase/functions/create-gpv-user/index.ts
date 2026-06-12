import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { handleCors, jsonResponse } from '../_shared/cors.ts'
import { getAuthenticatedUser, readRequiredEnv } from '../_shared/oauth.ts'

const VALID_ROLES = ['admin', 'manager', 'commercial', 'gestor'] as const
const VALID_ZONES = ['las_palmas', 'tenerife', 'todas'] as const
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface CreateUserBody {
  email: string
  password: string
  full_name: string
  role: string
  zone: string
  phone?: string
}

Deno.serve(async (req) => {
  // ── CORS preflight ────────────────────────────────────────────────────────
  const corsResp = handleCors(req)
  if (corsResp) return corsResp
  const reply = (body: unknown, status = 200) => jsonResponse(body, status, req)

  if (req.method !== 'POST') {
    return reply({ error: 'method_not_allowed' }, 405)
  }

  // ── 1. Verificar que el llamador tiene rol admin ───────────────────────────
  // getAuthenticatedUser lee el JWT del header Authorization y lo valida
  // contra Supabase Auth con la service role key — completamente server-side.
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

  // El rol se lee de la BD real, nunca del JWT ni del body.
  const { data: callerProfile } = await admin
    .from('user_profilesGPV')
    .select('role')
    .eq('id', callerUser.id)
    .maybeSingle()

  if (callerProfile?.role !== 'admin') {
    return reply({ error: 'forbidden' }, 403)
  }

  // ── 2. Leer y validar el body ─────────────────────────────────────────────
  let body: Partial<CreateUserBody>
  try {
    body = await req.json()
  } catch {
    return reply({ error: 'invalid_json' }, 400)
  }

  const errors: string[] = []

  if (!body.email || !EMAIL_RE.test(body.email))
    errors.push('email inválido o ausente')
  if (!body.password || body.password.length < 8)
    errors.push('contraseña ausente o con menos de 8 caracteres')
  if (!body.full_name?.trim())
    errors.push('full_name es obligatorio')
  if (!body.role || !(VALID_ROLES as readonly string[]).includes(body.role))
    errors.push(`role debe ser uno de: ${VALID_ROLES.join(', ')}`)
  if (!body.zone || !(VALID_ZONES as readonly string[]).includes(body.zone))
    errors.push(`zone debe ser una de: ${VALID_ZONES.join(', ')}`)

  if (errors.length) {
    return reply({ error: 'validation_error', details: errors }, 400)
  }

  // ── 3. Crear cuenta en Supabase Auth ──────────────────────────────────────
  // email_confirm:true — el usuario puede entrar sin confirmar el email.
  // La contraseña temporal la comunica el admin por otro canal.
  const { data: authData, error: createError } =
    await admin.auth.admin.createUser({
      email: body.email!,
      password: body.password!,
      email_confirm: true,
      user_metadata: { full_name: body.full_name!.trim() }
    })

  if (createError || !authData.user) {
    const isConflict = createError?.message?.toLowerCase().includes('already')
    return reply(
      { error: 'auth_create_failed', detail: createError?.message ?? 'unknown' },
      isConflict ? 409 : 500
    )
  }

  const newUserId = authData.user.id

  // ── 4. Insertar perfil en user_profilesGPV ────────────────────────────────
  // El id debe ser el mismo UUID que auth.users para satisfacer la FK.
  const { error: profileError } = await admin
    .from('user_profilesGPV')
    .insert({
      id: newUserId,
      email: body.email!.trim().toLowerCase(),
      full_name: body.full_name!.trim(),
      role: body.role,
      zone: body.zone,
      phone: body.phone?.trim() ?? null
    })

  if (profileError) {
    // Rollback: eliminar la cuenta auth para no dejar un fantasma.
    // Si este deleteUser también falla, el usuario sin perfil quedará
    // bloqueado por loadUserProfile (sin acceso funcional), pero se
    // loguea para limpieza manual si fuera necesario.
    await admin.auth.admin.deleteUser(newUserId)
    return reply(
      { error: 'profile_insert_failed', detail: profileError.message },
      500
    )
  }

  // ── 5. Éxito ──────────────────────────────────────────────────────────────
  return reply(
    { id: newUserId, email: body.email, role: body.role, zone: body.zone },
    201
  )
})
