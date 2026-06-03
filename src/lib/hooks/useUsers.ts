import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import { createLogger } from '../logger'
import { generateId } from '../data/helpers'
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
  const validRole: UserRole = (
    ['admin', 'manager', 'commercial', 'gestor'].includes(role) ? role : 'commercial'
  ) as UserRole

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

  // ── addUser ───────────────────────────────────────────────────────────────
  const addUser = useCallback(
    (payload: NewUser): User => {
      const now = new Date().toISOString()
      const roleCandidate = payload.role?.toLowerCase() ?? ''
      const validRole: UserRole = (
        ['admin', 'manager', 'commercial', 'gestor'].includes(roleCandidate)
          ? roleCandidate
          : 'commercial'
      ) as UserRole

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

      // Persistir en Supabase con soporte offline
      if (isOnline && isSupabaseConfigured) {
        supabase
          .from(SUPABASE_TABLE)
          .insert({
            id: newUser.id,
            ...mapToSupabase(newUser),
            created_at: now
          })
          .then(({ error }) => {
            if (!error) {
              setNotifications((prev) => [
                ...prev,
                {
                  id: generateId('notif'),
                  type: 'success',
                  title: 'Usuario creado',
                  description: `El usuario "${newUser.fullName}" se ha creado correctamente.`,
                  timestamp: new Date().toISOString(),
                  read: false
                }
              ])
            } else {
              log.error('Error inserting user in Supabase:', error.message)
              addToSyncQueue({
                type: 'create',
                table: 'users',
                data: newUser
              })
              setNotifications((prev) => [
                ...prev,
                {
                  id: generateId('notif'),
                  type: 'warning',
                  title: 'Guardado offline',
                  description: `El usuario "${newUser.fullName}" se guardó offline y se sincronizará más tarde.`,
                  timestamp: new Date().toISOString(),
                  read: false
                }
              ])
            }
          })
      } else {
        addToSyncQueue({
          type: 'create',
          table: 'users',
          data: newUser
        })
        setNotifications((prev) => [
          ...prev,
          {
            id: generateId('notif'),
            type: 'warning',
            title: 'Guardado offline',
            description: `El usuario "${newUser.fullName}" se guardó offline y se sincronizará más tarde.`,
            timestamp: new Date().toISOString(),
            read: false
          }
        ])
      }

      return newUser
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  // ── updateUser ────────────────────────────────────────────────────────────
  const updateUser = useCallback(
    async (id: EntityId, updates: UserUpdates): Promise<void> => {
      const sid = String(id)

      setUsers((prev) =>
        prev.map((u) => (String(u.id) === sid ? { ...u, ...updates } : u))
      )

      if (isOnline && isSupabaseConfigured) {
        try {
          const mappedUpdates = mapToSupabase(updates)
          const { error } = await supabase
            .from(SUPABASE_TABLE)
            .update(mappedUpdates)
            .eq('id', sid)

          if (!error) {
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Usuario actualizado',
                description: 'Los cambios se han guardado correctamente.',
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Error updating user in Supabase:', error.message)
            addToSyncQueue({
              type: 'update',
              table: 'users',
              data: { ...updates, id: sid }
            })
          }
        } catch (err) {
          log.error('Crash in updateUser:', err)
          addToSyncQueue({
            type: 'update',
            table: 'users',
            data: { ...updates, id: sid }
          })
        }
      } else {
        addToSyncQueue({
          type: 'update',
          table: 'users',
          data: { ...updates, id: sid }
        })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  // ── removeUser ────────────────────────────────────────────────────────────
  const removeUser = useCallback(
    async (id: EntityId): Promise<void> => {
      const sid = String(id)

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

      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from(SUPABASE_TABLE)
            .delete()
            .eq('id', sid)
          if (!error) {
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Usuario eliminado',
                description: 'El usuario se ha eliminado correctamente.',
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Error deleting user in Supabase:', error.message)
            addToSyncQueue({
              type: 'delete',
              table: 'users',
              data: { id: sid }
            })
          }
        } catch (err) {
          log.error('Crash in removeUser:', err)
          addToSyncQueue({ type: 'delete', table: 'users', data: { id: sid } })
        }
      } else {
        addToSyncQueue({ type: 'delete', table: 'users', data: { id: sid } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
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
