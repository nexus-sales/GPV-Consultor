import { useCallback } from 'react'
import { normaliseSales } from '../data/normalisers'
import { generateId } from '../data/helpers'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { supabase } from '../supabaseClient'
import { createEntityStore } from '../data/createEntityStore'
import type { Sale, NewSale, SaleUpdates, EntityId } from '../types'

const useSalesStore = createEntityStore<Sale>({
  table: 'salesGPV',
  storageKey: 'sales',
  syncTable: 'sales',
  normalise: (rows) => normaliseSales(rows as Parameters<typeof normaliseSales>[0]),
  toSupabase: (item) => mapToSupabase(item as unknown as Sale, 'salesGPV'),
  label: 'Venta',
  // Fetch ordered by fechaCierre desc
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildQuery: (base: any) => base.select('*').order('fechaCierre', { ascending: false }),
})

export function useSales() {
  const { items: sales, refresh, addItem, updateItem, removeItem } = useSalesStore()

  const addSale = useCallback(
    async (payload: Partial<Sale>): Promise<Sale> => {
      const now = new Date().toISOString()
      const newSale: Sale = {
        id: generateId('sale'),
        distributorId: payload.distributorId || '',
        distributorCode: payload.distributorCode || '',
        distributorName: payload.distributorName || '',
        sector: payload.sector || 'Otros',
        modo: payload.modo,
        tipoDocumento: payload.tipoDocumento,
        nombreCliente: payload.nombreCliente,
        documento: payload.documento,
        fechaOferta: payload.fechaOferta,
        fechaCierre: payload.fechaCierre,
        fechaActivacion: payload.fechaActivacion,
        fechaBaja: payload.fechaBaja,
        status: payload.status || 'Pendiente',
        observaciones: payload.observaciones,
        date: payload.fechaCierre || payload.date || now,
        brand: payload.brand || '',
        family: payload.family || '',
        operations: payload.operations || 1,
        notes: payload.notes || payload.observaciones || '',
        createdAt: payload.createdAt || now,
        updatedAt: now,
      }
      return addItem(newSale)
    },
    [addItem]
  )

  const updateSale = useCallback(
    (id: EntityId, updates: SaleUpdates): Promise<void> => updateItem(id, updates),
    [updateItem]
  )

  const deleteSale = useCallback(
    (id: EntityId): Promise<void> => removeItem(id),
    [removeItem]
  )

  return { sales, addSale, updateSale, deleteSale, refresh }
}
