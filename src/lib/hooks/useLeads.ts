import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { normaliseLeads } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { isSupabaseConfigured } from '../config'
import type { Lead, NewLead, LeadUpdates } from '../types'
import { createLogger } from '../logger'

const log = createLogger('Leads')

const STORAGE_KEY = 'leads'

function loadLeadsFromStorage(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return normaliseLeads(arr)
  } catch {
    return []
  }
}

function persistLeadsToStorage(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads))
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>(() => loadLeadsFromStorage())
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistLeadsToStorage(leads)
  }, [leads])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase.from('leads').select('*')
      if (error) {
        log.error('Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        const normalised = normaliseLeads(data)
        setLeads((prevLocal) => {
          const supabaseIds = new Set(normalised.map((l) => l.id))
          const localOnly = prevLocal.filter((l) => !supabaseIds.has(l.id))
          const merged = [...normalised, ...localOnly]
          persistLeadsToStorage(merged)
          return merged
        })
      }
    } catch (err) {
      log.error('Network error fetching from Supabase:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addLead = useCallback(
    async (payload: NewLead): Promise<Lead> => {
      const newLead: Lead = {
        id: payload.id || generateId('lead'),
        fuente: payload.fuente || 'manual',
        nombre: payload.nombre?.trim() || 'Lead sin nombre',
        telefono: payload.telefono?.trim(),
        email: payload.email?.trim(),
        web: payload.web?.trim(),
        direccion: payload.direccion?.trim(),
        ciudad: payload.ciudad?.trim(),
        provincia: payload.provincia?.trim(),
        sector: payload.sector?.trim(),
        rating: payload.rating,
        reviews_count: payload.reviews_count || 0,
        place_id: payload.place_id,
        estado: payload.estado || 'nuevo',
        notas: payload.notas || '',
        asignado_a: payload.asignado_a,
        createdAt: normaliseDate(payload.createdAt || new Date()),
        updatedAt: normaliseDate(payload.updatedAt || new Date())
      }
      setLeads((prev) => [newLead, ...prev])

      if (isOnline && isSupabaseConfigured) {
        // Enviar a Supabase
        const { error } = await supabase.from('leads').insert({
          id: newLead.id,
          fuente: newLead.fuente,
          nombre: newLead.nombre,
          telefono: newLead.telefono,
          email: newLead.email,
          web: newLead.web,
          direccion: newLead.direccion,
          ciudad: newLead.ciudad,
          provincia: newLead.provincia,
          sector: newLead.sector,
          rating: newLead.rating,
          reviews_count: newLead.reviews_count,
          place_id: newLead.place_id,
          estado: newLead.estado,
          notas: newLead.notas,
          asignado_a: newLead.asignado_a,
          created_at: newLead.createdAt,
          updated_at: newLead.updatedAt
        })

        if (!error) {
          setNotifications((prev) => [
            ...prev,
            {
              id: generateId('notif'),
              type: 'success',
              title: 'Lead creado',
              description: `El lead "${newLead.nombre}" se ha creado correctamente.`,
              timestamp: new Date().toISOString(),
              read: false
            }
          ])
        } else {
          log.error('Insert error:', error.message)
          addToSyncQueue({
            type: 'create',
            table: 'leads',
            data: newLead
          })
        }
      } else {
        addToSyncQueue({
          type: 'create',
          table: 'leads',
          data: newLead
        })
      }
      return newLead
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateLead = useCallback(
    async (id: string, updates: LeadUpdates): Promise<void> => {
      setLeads((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )

      if (isOnline && isSupabaseConfigured) {
        const { error } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', id)

        if (error) {
          log.error('Update error:', error.message)
          addToSyncQueue({
            type: 'update',
            table: 'leads',
            data: { ...updates, id }
          })
        }
      } else {
        addToSyncQueue({
          type: 'update',
          table: 'leads',
          data: { ...updates, id }
        })
      }
    },
    [isOnline, addToSyncQueue]
  )

  const deleteLead = useCallback(
    async (id: string): Promise<void> => {
      setLeads((prev) => prev.filter((item) => item.id !== id))

      if (isOnline && isSupabaseConfigured) {
        const { error } = await supabase.from('leads').delete().eq('id', id)
        if (error) {
          log.error('Delete error:', error.message)
          addToSyncQueue({ type: 'delete', table: 'leads', data: { id } })
        }
      } else {
        addToSyncQueue({ type: 'delete', table: 'leads', data: { id } })
      }
    },
    [isOnline, addToSyncQueue]
  )

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    refresh
  }
}
