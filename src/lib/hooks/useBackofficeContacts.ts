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
const TOMBSTONE_KEY = `${STORAGE_KEY}__deleted`

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: RFC-4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
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
    razonSocial: raw.razonSocial ? String(raw.razonSocial) : undefined,
    cifNif: raw.cifNif ? String(raw.cifNif) : undefined,
    personaContacto: raw.personaContacto
      ? String(raw.personaContacto)
      : undefined,
    cargoContacto: raw.cargoContacto ? String(raw.cargoContacto) : undefined,
    emailContacto: raw.emailContacto ? String(raw.emailContacto) : undefined,
    telefonoAlternativo: raw.telefonoAlternativo
      ? String(raw.telefonoAlternativo)
      : undefined,
    web: raw.web ? String(raw.web) : undefined,
    provincia: raw.provincia ? String(raw.provincia) : undefined,
    isla: raw.isla ? String(raw.isla) : undefined,
    zona: raw.zona ? String(raw.zona) : undefined,
    sector: raw.sector ? String(raw.sector) : undefined,
    tipoNegocio: raw.tipoNegocio ? String(raw.tipoNegocio) : undefined,
    origenContacto: raw.origenContacto
      ? String(raw.origenContacto)
      : undefined,
    gestorProponente: raw.gestorProponente
      ? String(raw.gestorProponente)
      : undefined,
    prioridadBackoffice: raw.prioridadBackoffice
      ? String(raw.prioridadBackoffice)
      : undefined,
    potencialComercial: raw.potencialComercial
      ? String(raw.potencialComercial)
      : undefined,
    competenciaActual: raw.competenciaActual
      ? String(raw.competenciaActual)
      : undefined,
    canalPreferente: raw.canalPreferente
      ? String(raw.canalPreferente)
      : undefined,
    resultadoUltimoContacto: raw.resultadoUltimoContacto
      ? String(raw.resultadoUltimoContacto)
      : undefined,
    motivoRechazo: raw.motivoRechazo ? String(raw.motivoRechazo) : undefined,
    assignedTo: raw.assignedTo ? String(raw.assignedTo) : undefined,
    createdBy: raw.createdBy ? String(raw.createdBy) : undefined,
    visibility: raw.visibility ? String(raw.visibility) : undefined,
    sharedWithGpv: Boolean(raw.sharedWithGpv ?? false),
    handoffStatus: raw.handoffStatus ? String(raw.handoffStatus) : undefined,
    lockedReason: raw.lockedReason ? String(raw.lockedReason) : undefined,
    estado:
      (raw.estado as BackofficeContact['estado']) ?? 'PENDIENTE DE RESPUESTA',
    observaciones: raw.observaciones ? String(raw.observaciones) : undefined,
    ultimosComentarios: raw.ultimosComentarios
      ? String(raw.ultimosComentarios)
      : undefined,
    estadoGestion:
      (raw.estadoGestion as BackofficeContact['estadoGestion']) ?? 'Pendiente',
    historialComentarios: Array.isArray(raw.historialComentarios)
      ? (raw.historialComentarios as BackofficeContact['historialComentarios'])
      : [],
    proponeVisitaGPV: Boolean(raw.proponeVisitaGPV ?? false),
    fechaVisita: (() => {
      if (!raw.fechaVisita) return undefined
      const s = String(raw.fechaVisita)
      // Supabase 'date' requiere YYYY-MM-DD; descarta seriales Excel (ej. "46209") u otros formatos inválidos
      return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : undefined
    })(),
    proximoContacto: raw.proximoContacto
      ? String(raw.proximoContacto)
      : undefined,
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

function loadTombstone(): Set<string> {
  try {
    const raw = localStorage.getItem(TOMBSTONE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveTombstone(set: Set<string>) {
  localStorage.setItem(TOMBSTONE_KEY, JSON.stringify([...set]))
}

function addToTombstone(id: string) {
  const set = loadTombstone()
  set.add(id)
  saveTombstone(set)
}

function removeFromTombstone(id: string) {
  const set = loadTombstone()
  set.delete(id)
  saveTombstone(set)
}

export function useBackofficeContacts() {
  const [backofficeContacts, setBackofficeContacts] = useState<
    BackofficeContact[]
  >(() => loadFromStorage())

  const { isOnline, addToSyncQueue } = useSyncQueue()

  useEffect(() => {
    persist(backofficeContacts)
  }, [backofficeContacts])

  // Silently push local-only contacts to Supabase (fire-and-forget).
  // Called automatically after every refresh so local data is never stranded.
  const pushLocalOnly = useCallback(
    async (
      localOnly: BackofficeContact[],
      onIdRemap: (oldId: string, newId: string) => void
    ) => {
      if (!localOnly.length) return
      for (const contact of localOnly) {
        const payload = mapToSupabase(contact, TABLE) as Record<string, unknown>
        if (!UUID_RE.test(contact.id)) {
          payload.id = generateId()
          const { data: inserted, error } = await supabase
            .from(TABLE)
            .insert(payload)
            .select()
            .single()
          if (!error && inserted) {
            onIdRemap(contact.id, String((inserted as Record<string, unknown>).id))
          } else if (error) {
            log.error('Auto-sync insert error:', error.message)
          }
        } else {
          const { error } = await supabase.from(TABLE).upsert(payload)
          if (error) log.error('Auto-sync upsert error:', error.message)
        }
      }
    },
    []
  )

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from(TABLE).select('*')
      if (error) {
        log.error('Error fetching backoffice contacts:', error.message)
        return
      }
      if (data) {
        const tombstone = loadTombstone()
        const normalised = (data as Record<string, unknown>[])
          .map(normalise)
          .filter((contact) => !tombstone.has(contact.id))
        let localOnlySnapshot: BackofficeContact[] = []
        setBackofficeContacts((prev) => {
          const localMap = new Map(prev.map((c) => [c.id, c]))
          const supabaseIds = new Set(normalised.map((c) => c.id))
          const localOnly = prev.filter((c) => !supabaseIds.has(c.id))
          localOnlySnapshot = localOnly
          const merged = normalised.map((remote) => {
            const local = localMap.get(remote.id)
            if (!local) return remote
            
            const remoteCommentsCount = remote.historialComentarios?.length || 0
            const localCommentsCount = local.historialComentarios?.length || 0

            return {
              ...remote,
              historialComentarios:
                localCommentsCount > remoteCommentsCount
                  ? local.historialComentarios
                  : remote.historialComentarios,
              proximoContacto: remote.proximoContacto ?? local.proximoContacto,
              updatedAt: local.updatedAt && new Date(local.updatedAt) > new Date(remote.updatedAt || 0)
                ? local.updatedAt
                : remote.updatedAt
            }
          })
          const all = [...merged, ...localOnly]
          persist(all)
          return all
        })
        // Auto-push any local contacts not yet in Supabase, updating ids in state
        pushLocalOnly(localOnlySnapshot, (oldId, newId) => {
          setBackofficeContacts((prev) =>
            prev.map((c) => (c.id === oldId ? { ...c, id: newId } : c))
          )
        })
      }
    } catch (err) {
      log.error('Network error fetching backoffice contacts:', err)
    }
  }, [pushLocalOnly])

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
        historialComentarios: payload.historialComentarios ?? [],
        observaciones: payload.observaciones,
        ultimosComentarios: payload.ultimosComentarios,
        proponeVisitaGPV: payload.proponeVisitaGPV ?? false,
        fechaVisita: payload.fechaVisita,
        proximoContacto: payload.proximoContacto,
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
      addToTombstone(id)
      setBackofficeContacts((prev) => prev.filter((c) => c.id !== id))

      if (isOnline && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from(TABLE)
            .delete()
            .eq('id', id)
            .select('id')
          if (!error && Array.isArray(data) && data.length > 0) {
            removeFromTombstone(id)
          } else if (!error) {
            log.warn(`Delete returned no rows for ${id}; keeping tombstone`)
            addToSyncQueue({
              type: 'delete',
              table: 'backofficeContacts',
              data: { id }
            })
          } else {
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

  // Push every local contact that Supabase doesn't know about yet.
  // Handles legacy bo-xxx ids (not valid UUIDs) by inserting without id so
  // Supabase auto-generates one, then updates local state with the new UUID.
  const forceSyncToSupabase = useCallback(async (): Promise<{
    pushed: number
    errors: number
    authError: boolean
  }> => {
    if (!isSupabaseConfigured) return { pushed: 0, errors: 0, authError: false }

    // Guard: require a valid session before attempting any write
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session) {
      log.error('Force-sync: no active Supabase session')
      return { pushed: 0, errors: 0, authError: true }
    }

    const local = loadFromStorage()
    if (!local.length) return { pushed: 0, errors: 0, authError: false }

    const { data: remote, error: fetchError } = await supabase
      .from(TABLE)
      .select('id')
    if (fetchError) {
      log.error('Force-sync fetch error:', fetchError.message)
      return { pushed: 0, errors: 0, authError: true }
    }
    const remoteIds = new Set((remote ?? []).map((r: { id: string }) => r.id))
    const missing = local.filter((c) => !remoteIds.has(c.id))

    let pushed = 0
    let errors = 0
    for (const contact of missing) {
      const payload = mapToSupabase(contact, TABLE) as Record<string, unknown>

      if (!UUID_RE.test(contact.id)) {
        // Legacy non-UUID id: let Supabase generate a proper UUID
        payload.id = generateId()
        const { data: inserted, error } = await supabase
          .from(TABLE)
          .insert(payload)
          .select()
          .single()
        if (error) {
          log.error('Force-sync insert error:', error.message)
          errors++
        } else if (inserted) {
          const newId = String((inserted as Record<string, unknown>).id)
          setBackofficeContacts((prev) =>
            prev.map((c) => (c.id === contact.id ? { ...c, id: newId } : c))
          )
          pushed++
        }
      } else {
        const { error } = await supabase.from(TABLE).upsert(payload)
        if (error) {
          log.error('Force-sync upsert error:', error.message)
          errors++
        } else {
          pushed++
        }
      }
    }
    return { pushed, errors, authError: false }
  }, [])

  return {
    backofficeContacts,
    addBackofficeContact,
    updateBackofficeContact,
    deleteBackofficeContact,
    refresh,
    forceSyncToSupabase
  }
}
