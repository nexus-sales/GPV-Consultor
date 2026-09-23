import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { persistChange, createNotifier } from '../data/persistChange'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import { createLogger } from '../logger'
import { toUserRole } from '../roles'
import type { User, NewUser, UserUpdates, EntityId, UserRole } from '../types'

const log = createLogger('Users')

const STORAGE_KEY = 'gpv_users'
const CURRENT_USER_KEY = 'gpv_current_user_id'

// Tabla en Supabase que almacena los perfiles de usuario de la app
// (distinta de la tabla de auth user_profilesGPV que usa el AuthContext)
const SUPABASE_TABLE = 'user_profilesGPV'

// ─── Helpers de almacenamiento local ─────────────────────────────────────────

function loadUsersFromStorage(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistUsersToStorage(users: User[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  } catch {
    // quota exceeded o similar — ignorar
  }
}

function loadCurrentUserIdFromStorage(): string {
  try {
    return localStorage.getItem(CURRENT_USER_KEY) || ''
  } catch {
    return ''
  }
}

function persistCurrentUserIdToStorage(id: string) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, id)
  } catch {
    // ignorar
  }
}

function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/** Mapea un objeto de Supabase (snake_case) al tipo User de la app */
function mapFromSupabase(row: Record<string, unknown>): User {
  const role = String(row.role ?? '').toLowerCase()
  const validRole: UserRole = toUserRole(role)

  return {
    id: String(row.id ?? ''),
    fullName: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
    role: validRole,
    region: String(row.zone ?? row.region ?? ''),
    permissions: String(row.permissions ?? ''),
    phone: String(row.phone ?? ''),
    avatarInitials: String(row.avatar_initials ?? ''),
    lastLogin: String(row.last_login ?? row.updated_at ?? ''),
    createdAt: String(row.created_at ?? ''),
    activity: Array.isArray(row.activity)
      ? (row.activity as User['activity'])
      : []
  }
}

/** Mapea el tipo User de la app a columnas de Supabase (snake_case) */
function mapToSupabase(user: Partial<User>) {
  const row: Record<string, unknown> = {}
  if (user.fullName !== undefined) row.full_name = user.fullName
  if (user.email !== undefined) row.email = user.email
  if (user.role !== undefined) row.role = user.role
  if (user.region !== undefined) row.zone = user.region
  if (user.permissions !== undefined) row.permissions = user.permissions
  if (user.phone !== undefined) row.phone = user.phone
  if (user.avatarInitials !== undefined)
    row.avatar_initials = user.avatarInitials
  if (user.activity !== undefined) row.activity = user.activity
  return row
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useUsers() {
  const [users, setUsers] = useState<User[]>(() => loadUsersFromStorage())
  const [currentUserId, setCurrentUserIdState] = useState<string>(() =>
    loadCurrentUserIdFromStorage()
  )
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()
  const notify = useMemo(
    () => createNotifier(setNotifications),
    [setNotifications]
  )

  // Ref siempre al día: permite leer el estado real dentro de los callbacks
  // sin añadir `users` a sus dependencias (evita closures obsoletos).
  const usersRef = useRef(users)
  useEffect(() => {
    usersRef.current = users
  }, [users])

  // Persistir usuarios en localStorage cada vez que cambian
  useEffect(() => {
    persistUsersToStorage(users)
  }, [users])

  // Si no hay currentUserId pero sí hay usuarios, seleccionar el primero
  useEffect(() => {
    if (!currentUserId && users.length > 0) {
      const firstId = String(users[0].id)
      setCurrentUserIdState(firstId)
      persistCurrentUserIdToStorage(firstId)
    }
  }, [users, currentUserId])

  // ── Carga inicial desde Supabase ─────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from(SUPABASE_TABLE).select('*')
      if (error) {
        log.error('Error fetching users from Supabase:', error.message)
        return
      }
      if (data && data.length > 0) {
        const fetched: User[] = data.map((row: Record<string, unknown>) =>
          mapFromSupabase(row)
        )
        setUsers((prev) => {
          // Los IDs de Supabase son fuente de verdad; conservar locales pendientes
          const supabaseIds = new Set(fetched.map((u) => String(u.id)))
          const localOnly = prev.filter((u) => !supabaseIds.has(String(u.id)))
          return [...fetched, ...localOnly]
        })
      }
    } catch (err) {
      log.error('Network error fetching users:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // ── currentUser derivado ──────────────────────────────────────────────────
  const currentUser: User | null =
    users.find((u) => String(u.id) === currentUserId) ?? users[0] ?? null

  // ── setCurrentUser ────────────────────────────────────────────────────────
  const setCurrentUser = useCallback((id: EntityId) => {
    const sid = String(id)
    setCurrentUserIdState(sid)
    persistCurrentUserIdToStorage(sid)
  }, [])

  // ── addUser (OBSOLETO) ────────────────────────────────────────────────────
  // No crea credenciales en Supabase Auth — el usuario creado aquí no puede
  // iniciar sesión. El alta real de usuarios GPV se realiza a través de la
  // Edge Function create-gpv-user (Settings → Usuarios).
  const addUser = useCallback(
    async (payload: NewUser): Promise<User> => {
      const now = new Date().toISOString()
      const roleCandidate = payload.role?.toLowerCase() ?? ''
      const validRole: UserRole = toUserRole(roleCandidate)

      const newUser: User = {
        id: String(payload.id ?? generateUserId()),
        fullName: payload.fullName?.trim() ?? '',
        email: payload.email?.trim() ?? '',
        role: validRole,
        region: payload.region?.trim() ?? '',
        permissions: payload.permissions?.trim() ?? '',
        phone: payload.phone?.trim() ?? '',
        avatarInitials:
          payload.avatarInitials ??
          (payload.fullName ?? '').slice(0, 2).toUpperCase(),
        lastLogin: payload.lastLogin ?? now,
        createdAt: payload.createdAt ?? now,
        activity: payload.activity ?? []
      }

      setUsers((prev) => [...prev, newUser])

      // Seleccionar automáticamente si es el primero
      setCurrentUserIdState((prev) => {
        if (!prev) {
          persistCurrentUserIdToStorage(String(newUser.id))
          return String(newUser.id)
        }
        return prev
      })

      // La escritura se esperaba con .then() y sin capturar el rechazo, así
      // que un fallo al crear un usuario no llegaba a quien llamaba.
      await persistChange({
        label: 'Usuario',
        operation: 'create',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const { error, status } = await supabase.from(SUPABASE_TABLE).insert({
            id: newUser.id,
            ...mapToSupabase(newUser),
            created_at: now
          })
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({
            type: 'create',
            table: 'users',
            data: newUser
          }),
        rollback: () =>
          setUsers((prev) => prev.filter((u) => u.id !== newUser.id))
      })

      return newUser
    },
    [isOnline, addToSyncQueue, notify]
  )

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback(
    async (id: EntityId, updates: UserUpdates): Promise<void> => {
      const sid = String(id)
      const previous = usersRef.current.find((u) => String(u.id) === sid)

      setUsers((prev) =>
        prev.map((u) => (String(u.id) === sid ? { ...u, ...updates } : u))
      )

      await persistChange({
        label: 'Usuario',
        operation: 'update',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const mappedUpdates = mapToSupabase(updates)
          const { error, status } = await supabase
            .from(SUPABASE_TABLE)
            .update(mappedUpdates)
            .eq('id', sid)
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({
            type: 'update',
            table: 'users',
            data: { ...updates, id: sid }
          }),
        rollback: previous
          ? () =>
              setUsers((prev) =>
                prev.map((u) => (String(u.id) === sid ? previous : u))
              )
          : undefined
      })
    },
    [isOnline, addToSyncQueue, notify]
  )

  // ── removeUser ────────────────────────────────────────────────────────────
  const removeUser = useCallback(
    async (id: EntityId): Promise<void> => {
      const sid = String(id)
      const previous = usersRef.current.find((u) => String(u.id) === sid)

      setUsers((prev) => {
        const next = prev.filter((u) => String(u.id) !== sid)
        // Si se elimina el usuario activo, seleccionar el primero restante
        setCurrentUserIdState((cur) => {
          if (cur === sid) {
            const nextId = next.length > 0 ? String(next[0].id) : ''
            persistCurrentUserIdToStorage(nextId)
            return nextId
          }
          return cur
        })
        return next
      })

      await persistChange({
        label: 'Usuario',
        operation: 'delete',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const { error, status } = await supabase
            .from(SUPABASE_TABLE)
            .delete()
            .eq('id', sid)
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({ type: 'delete', table: 'users', data: { id: sid } }),
        rollback: previous
          ? () => setUsers((prev) => [previous, ...prev])
          : undefined
      })
    },
    [isOnline, addToSyncQueue, notify]
  )

  return {
    users,
    currentUser,
    currentUserId,
    setCurrentUser,
    addUser,
    updateUser,
    removeUser,
    refresh
  }
}
