import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncQueue } from './useSyncQueue'
import { persistChange, createNotifier } from '../data/persistChange'
import { generateId, normaliseDate } from '../data/helpers'
import { normaliseCommissionAgreements } from '../data/normalisers'
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
  const notify = useMemo(
    () => createNotifier(setNotifications),
    [setNotifications]
  )

  // Ref siempre al día: permite leer el estado real dentro de los callbacks
  // sin añadir `agreements` a sus dependencias (evita closures obsoletos).
  const agreementsRef = useRef(agreements)
  useEffect(() => {
    agreementsRef.current = agreements
  }, [agreements])

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
        const normalised = normaliseCommissionAgreements(data)
        setAgreements((prev) => {
          const supabaseIds = new Set(normalised.map((d) => d.id))
          const localOnly = prev.filter((d) => !supabaseIds.has(d.id))
          const merged = [...normalised, ...localOnly]
          persistAgreementsToStorage(merged)
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

      await persistChange({
        label: 'Acuerdo',
        operation: 'create',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const mappedData = mapToSupabase(
            newAgreement,
            'commissionAgreementsGPV'
          )
          const { error, status } = await supabase
            .from('commissionAgreementsGPV')
            .insert(mappedData)
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({
            type: 'create',
            table: 'commissionAgreements',
            data: newAgreement
          }),
        rollback: () =>
          setAgreements((prev) => prev.filter((a) => a.id !== newAgreement.id))
      })

      return newAgreement
    },
    [isOnline, addToSyncQueue, notify]
  )

  const updateCommissionAgreement = useCallback(
    async (id: string, updates: CommissionAgreementUpdates): Promise<void> => {
      const updatedAt = normaliseDate(new Date())

      let finalUpdatesWithHistory:
        | (CommissionAgreementUpdates & {
            updatedAt: string
            history?: CommissionAgreement['history']
          })
        | null = null

      // Copia previa, para deshacer si el servidor rechaza el cambio
      const previous = agreementsRef.current.find((item) => item.id === id)

      setAgreements((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const hasChanges =
              item.resiRappel !== updates.resiRappel ||
              item.pymeRappel !== updates.pymeRappel ||
              item.resiAmount !== updates.resiAmount ||
              item.pymeAmount !== updates.pymeAmount ||
              JSON.stringify(item.resiTiers) !==
                JSON.stringify(updates.resiTiers) ||
              JSON.stringify(item.pymeTiers) !==
                JSON.stringify(updates.pymeTiers)

            const newHistory = hasChanges
              ? [
                  ...(item.history || []),
                  {
                    date: item.updatedAt || item.createdAt,
                    resiRappel: item.resiRappel,
                    pymeRappel: item.pymeRappel,
                    resiAmount: item.resiAmount,
                    pymeAmount: item.pymeAmount,
                    note: 'Cambio de condiciones'
                  }
                ]
              : item.history

            finalUpdatesWithHistory = {
              ...updates,
              updatedAt,
              history: newHistory
            }
            return { ...item, ...finalUpdatesWithHistory }
          }
          return item
        })
      )

      const finalUpdates = finalUpdatesWithHistory || { ...updates, updatedAt }

      await persistChange({
        label: 'Acuerdo',
        operation: 'update',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const mappedUpdates = mapToSupabase(
            { ...finalUpdates, id },
            'commissionAgreementsGPV'
          )
          const { error, status } = await supabase
            .from('commissionAgreementsGPV')
            .update(mappedUpdates)
            .eq('id', id)
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({
            type: 'update',
            table: 'commissionAgreements',
            data: { ...finalUpdates, id }
          }),
        rollback: previous
          ? () =>
              setAgreements((prev) =>
                prev.map((a) => (a.id === id ? previous : a))
              )
          : undefined
      })
    },
    [isOnline, addToSyncQueue, notify]
  )

  const deleteCommissionAgreement = useCallback(
    async (id: string): Promise<void> => {
      // Copia previa, para restaurar la fila si el servidor rechaza el borrado
      const previous = agreementsRef.current.find((item) => item.id === id)

      setAgreements((prev) => prev.filter((item) => item.id !== id))

      await persistChange({
        label: 'Acuerdo',
        operation: 'delete',
        isOnline,
        isConfigured: isSupabaseConfigured,
        log,
        notify,
        write: async () => {
          const { error, status } = await supabase
            .from('commissionAgreementsGPV')
            .delete()
            .eq('id', id)
          return { error, status }
        },
        enqueue: () =>
          addToSyncQueue({
            type: 'delete',
            table: 'commissionAgreements',
            data: { id }
          }),
        rollback: () => {
          if (previous) setAgreements((prev) => [previous!, ...prev])
        }
      })
    },
    [isOnline, addToSyncQueue, notify]
  )

  return {
    agreements,
    addCommissionAgreement,
    updateCommissionAgreement,
    deleteCommissionAgreement,
    refresh
  }
}
