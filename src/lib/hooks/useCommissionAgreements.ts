import { useCallback, useEffect, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { generateId, normaliseDate } from '../data/helpers'
import { supabase } from '../supabaseClient'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { isSupabaseConfigured } from '../config'
import type {
  CommissionAgreement,
  NewCommissionAgreement,
  CommissionAgreementUpdates
} from '../types'
import { createLogger } from '../logger'

const log = createLogger('Agreements')

const STORAGE_KEY = 'commission_agreements'

function loadAgreementsFromStorage(): CommissionAgreement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function persistAgreementsToStorage(agreements: CommissionAgreement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agreements))
}

export function useCommissionAgreements() {
  const [agreements, setAgreements] = useState<CommissionAgreement[]>(() =>
    loadAgreementsFromStorage()
  )
  const { isOnline, addToSyncQueue, setNotifications } = useSyncQueue()

  useEffect(() => {
    persistAgreementsToStorage(agreements)
  }, [agreements])

  const refresh = useCallback(async () => {
    if (!navigator.onLine || !isSupabaseConfigured) return
    try {
      const { data, error } = await supabase
        .from('commissionAgreementsGPV')
        .select('*')
      if (error) {
        log.error('Error fetching from Supabase:', error.message)
        return
      }
      if (data) {
        setAgreements((prev) => {
          const supabaseIds = new Set(data.map((d: { id: string }) => d.id))
          const localOnly = prev.filter(d => !supabaseIds.has(d.id))
          return [...data, ...localOnly]
        })
      }
    } catch (err) {
      log.error('Network error fetching from Supabase:', err)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addCommissionAgreement = useCallback(
    async (payload: NewCommissionAgreement): Promise<CommissionAgreement> => {
      const newAgreement: CommissionAgreement = {
        id: generateId('comm'),
        distributorId: payload.distributorId || '',
        sector: payload.sector || '',
        operator: payload.operator || '',
        resiType: payload.resiType || 'adoc',
        resiAmount: payload.resiAmount || '',
        resiLevels: payload.resiLevels || '',
        resiTiers: payload.resiTiers || [],
        resiRappel: payload.resiRappel || '',
        pymeType: payload.pymeType || 'adoc',
        pymeAmount: payload.pymeAmount || '',
        pymeLevels: payload.pymeLevels || '',
        pymeTiers: payload.pymeTiers || [],
        pymeRappel: payload.pymeRappel || '',
        notes: payload.notes || '',
        createdAt: normaliseDate(new Date()),
        updatedAt: normaliseDate(new Date())
      }

      setAgreements((prev) => [newAgreement, ...prev])

      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedData = mapToSupabase(newAgreement, 'commissionAgreementsGPV')
          const { error } = await supabase.from('commissionAgreementsGPV').insert(mappedData)
          if (!error) {
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Acuerdo creado',
                description: `Acuerdo de comisión creado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Insert error:', error.message)
            addToSyncQueue({ type: 'create', table: 'commissionAgreements', data: newAgreement })
          }
        } else {
          addToSyncQueue({ type: 'create', table: 'commissionAgreements', data: newAgreement })
        }
      } catch (err) {
        log.error('Crash in addCommissionAgreement:', err)
        addToSyncQueue({ type: 'create', table: 'commissionAgreements', data: newAgreement })
      }
      return newAgreement
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const updateCommissionAgreement = useCallback(
    async (id: string, updates: CommissionAgreementUpdates): Promise<void> => {
      const updatedAt = normaliseDate(new Date())
      
      let finalUpdatesWithHistory: (CommissionAgreementUpdates & { updatedAt: string; history?: CommissionAgreement['history'] }) | null = null

      setAgreements((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const hasChanges = item.resiRappel !== updates.resiRappel || 
                             item.pymeRappel !== updates.pymeRappel ||
                             item.resiAmount !== updates.resiAmount ||
                             item.pymeAmount !== updates.pymeAmount ||
                             JSON.stringify(item.resiTiers) !== JSON.stringify(updates.resiTiers) ||
                             JSON.stringify(item.pymeTiers) !== JSON.stringify(updates.pymeTiers)
            
            const newHistory = hasChanges ? [
              ...(item.history || []),
              {
                date: item.updatedAt || item.createdAt,
                resiRappel: item.resiRappel,
                pymeRappel: item.pymeRappel,
                resiAmount: item.resiAmount,
                pymeAmount: item.pymeAmount,
                note: 'Cambio de condiciones'
              }
            ] : item.history

            finalUpdatesWithHistory = { ...updates, updatedAt, history: newHistory }
            return { ...item, ...finalUpdatesWithHistory }
          }
          return item
        })
      )
      
      const finalUpdates = finalUpdatesWithHistory || { ...updates, updatedAt }
      
      try {
        if (isOnline && isSupabaseConfigured) {
          const mappedUpdates = mapToSupabase({ ...finalUpdates, id }, 'commissionAgreementsGPV')
          const { error } = await supabase.from('commissionAgreementsGPV').update(mappedUpdates).eq('id', id)
          if (!error) {
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Acuerdo actualizado',
                description: `Acuerdo de comisión actualizado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Update error:', error.message)
            addToSyncQueue({ type: 'update', table: 'commissionAgreements', data: { ...finalUpdates, id } })
          }
        } else {
          addToSyncQueue({ type: 'update', table: 'commissionAgreements', data: { ...finalUpdates, id } })
        }
      } catch (err) {
        log.error('Crash in updateCommissionAgreement:', err)
        addToSyncQueue({ type: 'update', table: 'commissionAgreements', data: { ...finalUpdates, id } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  const deleteCommissionAgreement = useCallback(
    async (id: string): Promise<void> => {
      setAgreements((prev) => prev.filter((item) => item.id !== id))
      try {
        if (isOnline && isSupabaseConfigured) {
          const { error } = await supabase.from('commissionAgreementsGPV').delete().eq('id', id)
          if (!error) {
            setNotifications((prev) => [
              ...prev,
              {
                id: generateId('notif'),
                type: 'success',
                title: 'Acuerdo eliminado',
                description: `Acuerdo de comisión eliminado correctamente.`,
                timestamp: new Date().toISOString(),
                read: false
              }
            ])
          } else {
            log.error('Delete error:', error.message)
            addToSyncQueue({ type: 'delete', table: 'commissionAgreements', data: { id } })
          }
        } else {
          addToSyncQueue({ type: 'delete', table: 'commissionAgreements', data: { id } })
        }
      } catch (err) {
        log.error('Crash in deleteCommissionAgreement:', err)
        addToSyncQueue({ type: 'delete', table: 'commissionAgreements', data: { id } })
      }
    },
    [isOnline, addToSyncQueue, setNotifications]
  )

  return {
    agreements,
    addCommissionAgreement,
    updateCommissionAgreement,
    deleteCommissionAgreement,
    refresh
  }
}
