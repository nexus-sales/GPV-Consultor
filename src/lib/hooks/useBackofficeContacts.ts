import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { createLogger } from '../logger'
import type {
  BackofficeContact,
  NewBackofficeContact,
  BackofficeContactUpdates
} from '../types'

const log = createLogger('BackofficeContacts')
const STORAGE_KEY = 'backofficeContacts'
const TABLE = 'backofficeContactsGPV'

function generateId(): string {
  return `bo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function normalise(raw: Record<string, unknown>): BackofficeContact {
  return {
    id: String(raw.id ?? generateId()),
    operador: String(raw.operador ?? ''),
    nombreColaborador: String(raw.nombreColaborador ?? ''),
    direccion: raw.direccion ? String(raw.direccion) : undefined,
    poblacion: raw.poblacion ? String(raw.poblacion) : undefined,
    codigoPostal: raw.codigoPostal ? String(raw.codigoPostal) : undefined,
    telefonoContacto: raw.telefonoContacto
      ? String(raw.telefonoContacto)
      : undefined,
    estado:
      (raw.estado as BackofficeContact['estado']) ?? 'PENDIENTE DE RESPUESTA',
    observaciones: raw.observaciones ? String(raw.observaciones) : undefined,
    ultimosComentarios: raw.ultimosComentarios
      ? String(raw.ultimosComentarios)
      : undefined,
    estadoGestion:
      (raw.estadoGestion as BackofficeContact['estadoGestion']) ?? 'Pendiente',
    proponeVisitaGPV: Boolean(raw.proponeVisitaGPV ?? false),
    fechaVisita: raw.fechaVisita ? String(raw.fechaVisita) : undefined,
    visitas: raw.visitas ? String(raw.visitas) : undefined,
    seguimiento: raw.seguimiento ? String(raw.seguimiento) : undefined,
    createdAt: String(
      raw.createdAt ?? raw.created_at ?? new Date().toISOString()
    ),
    updatedAt: String(
      raw.updatedAt ?? raw.updated_at ?? new Date().toISOString()
    )
  }
}

function loadFromStorage(): BackofficeContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as Record<string, unknown>[]
    return arr.map(normalise)
  } catch {
    return []
  }
}

function persist(contacts: BackofficeContact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
}

export function useBackofficeContacts() {
  const [backofficeContacts, setBackofficeContacts] = useState<
    BackofficeContact[]
  >(() => loadFromStorage())

  const { isOnline, addToSyncQueue } = useSyncQueue()

  useEffect(() => {
    persist(backofficeContacts)
  }, [backofficeContacts])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from(TABLE).select('*')
      if (error) {
        log.error('Error fetching backoffice contacts:', error.message)
        return
      }
      if (data) {
        const normalised = (data as Record<string, unknown>[]).map(normalise)
        setBackofficeContacts((prev) => {
          const supabaseIds = new Set(normalised.map((c) => c.id))
          const localOnly = prev.filter((c) => !supabaseIds.has(c.id))
          const merged = [...normalised, ...localOnly]
          persist(merged)
          return merged
        })
      }
    } catch (err) {
      log.error('Network error fetching backoffice contacts:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addBackofficeContact = useCallback(
    async (payload: NewBackofficeContact): Promise<BackofficeContact> => {
      const now = new Date().toISOString()
      const newContact: BackofficeContact = {
        id: generateId(),
        operador: payload.operador ?? '',
        nombreColaborador: payload.nombreColaborador ?? '',
        direccion: payload.direccion,
        poblacion: payload.poblacion,
        codigoPostal: payload.codigoPostal,
        telefonoContacto: payload.telefonoContacto,
        estado: payload.estado ?? 'PENDIENTE DE RESPUESTA',
        estadoGestion: payload.estadoGestion ?? 'Pendiente',
        observaciones: payload.observaciones,
        ultimosComentarios: payload.ultimosComentarios,
        proponeVisitaGPV: payload.proponeVisitaGPV ?? false,
        fechaVisita: payload.fechaVisita,
        visitas: payload.visitas,
        seguimiento: payload.seguimiento,
        createdAt: now,
        updatedAt: now
      }

      setBackofficeContacts((prev) => [...prev, newContact])

      if (isOnline && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from(TABLE)
            .insert(mapToSupabase(newContact, TABLE))
            .select()
            .single()
          if (error) {
            log.error('Insert error:', error.message)
            addToSyncQueue({
              type: 'create',
              table: 'backofficeContacts',
              data: newContact
            })
          } else if (data) {
            const saved = normalise(data as Record<string, unknown>)
            setBackofficeContacts((prev) =>
              prev.map((c) => (c.id === newContact.id ? saved : c))
            )
            return saved
          }
        } catch (err) {
          log.error('Network error on insert:', err)
          addToSyncQueue({
            type: 'create',
            table: 'backofficeContacts',
            data: newContact
          })
        }
      } else {
        addToSyncQueue({
          type: 'create',
          table: 'backofficeContacts',
          data: newContact
        })
      }

      return newContact
    },
    [isOnline, addToSyncQueue]
  )

  const updateBackofficeContact = useCallback(
    async (id: string, updates: BackofficeContactUpdates): Promise<void> => {
      const now = new Date().toISOString()
      setBackofficeContacts((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: now } : c
        )
      )

      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from(TABLE)
            .update(mapToSupabase({ ...updates, updatedAt: now }, TABLE))
            .eq('id', id)
          if (error) {
            log.error('Update error:', error.message)
            addToSyncQueue({
              type: 'update',
              table: 'backofficeContacts',
              data: { id, ...updates }
            })
          }
        } catch (err) {
          log.error('Network error on update:', err)
          addToSyncQueue({
            type: 'update',
            table: 'backofficeContacts',
            data: { id, ...updates }
          })
        }
      } else {
        addToSyncQueue({
          type: 'update',
          table: 'backofficeContacts',
          data: { id, ...updates }
        })
      }
    },
    [isOnline, addToSyncQueue]
  )

  const deleteBackofficeContact = useCallback(
    async (id: string): Promise<void> => {
      setBackofficeContacts((prev) => prev.filter((c) => c.id !== id))

      if (isOnline && isSupabaseConfigured) {
        try {
          const { error } = await supabase.from(TABLE).delete().eq('id', id)
          if (error) {
            log.error('Delete error:', error.message)
            addToSyncQueue({
              type: 'delete',
              table: 'backofficeContacts',
              data: { id }
            })
          }
        } catch (err) {
          log.error('Network error on delete:', err)
          addToSyncQueue({
            type: 'delete',
            table: 'backofficeContacts',
            data: { id }
          })
        }
      } else {
        addToSyncQueue({
          type: 'delete',
          table: 'backofficeContacts',
          data: { id }
        })
      }
    },
    [isOnline, addToSyncQueue]
  )

  return {
    backofficeContacts,
    addBackofficeContact,
    updateBackofficeContact,
    deleteBackofficeContact,
    refresh
  }
}
