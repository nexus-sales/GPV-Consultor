import { useCallback } from 'react'
import { normaliseLeads } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { createEntityStore } from '../data/createEntityStore'
import type { Lead, NewLead, LeadUpdates } from '../types'

function leadToRow(lead: Lead): Record<string, unknown> {
  return {
    id: lead.id,
    fuente: lead.fuente,
    nombre: lead.nombre,
    telefono: lead.telefono,
    email: lead.email,
    web: lead.web,
    direccion: lead.direccion,
    ciudad: lead.ciudad,
    provincia: lead.provincia,
    isla: lead.isla,
    codigo_postal: lead.codigo_postal,
    sector: lead.sector,
    rating: lead.rating,
    reviews_count: lead.reviews_count,
    place_id: lead.place_id,
    estado: lead.estado,
    notas: lead.notas,
    asignado_a: lead.asignado_a,
    converted_at: lead.convertedAt ?? null,
    created_at: lead.createdAt,
    updated_at: lead.updatedAt,
  }
}

const useLeadsStore = createEntityStore<Lead>({
  table: 'leadsGPV',
  storageKey: 'leads',
  syncTable: 'leads',
  normalise: (rows) => normaliseLeads(rows as Parameters<typeof normaliseLeads>[0]),
  toSupabase: (item) => leadToRow(item as unknown as Lead),
  label: 'Lead',
})

export function useLeads() {
  const { items: leads, refresh, addItem, updateItem, removeItem } = useLeadsStore()

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
        isla: payload.isla?.trim(),
        codigo_postal: payload.codigo_postal?.trim(),
        sector: payload.sector?.trim(),
        rating: payload.rating,
        reviews_count: payload.reviews_count || 0,
        place_id: payload.place_id,
        estado: payload.estado || 'nuevo',
        notas: payload.notas || '',
        asignado_a: payload.asignado_a,
        createdAt: normaliseDate(payload.createdAt || new Date()),
        updatedAt: normaliseDate(payload.updatedAt || new Date()),
      }
      return addItem(newLead)
    },
    [addItem]
  )

  const updateLead = useCallback(
    (id: string, updates: LeadUpdates): Promise<void> => updateItem(id, updates),
    [updateItem]
  )

  const deleteLead = useCallback(
    (id: string): Promise<void> => removeItem(id),
    [removeItem]
  )

  return { leads, addLead, updateLead, deleteLead, refresh }
}
