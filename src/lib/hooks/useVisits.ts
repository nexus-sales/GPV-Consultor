import { useCallback } from 'react'
import { normaliseVisits } from '../data/normalisers'
import { generateId, normaliseDate } from '../data/helpers'
import { mapToSupabase } from '../mappers/supabaseMappers'
import { createEntityStore } from '../data/createEntityStore'
import type { Visit, NewVisit, VisitUpdates, EntityId } from '../types'
import {
  evaluateVisitSchedule,
  inferVisitSource,
  resolveLocationQuality
} from '../visits/visitScheduler'

const useVisitsStore = createEntityStore<Visit>({
  table: 'visitsGPV',
  storageKey: 'visits',
  syncTable: 'visits',
  normalise: (rows) => normaliseVisits(rows as Parameters<typeof normaliseVisits>[0]),
  toSupabase: (item) => mapToSupabase(item as unknown as Visit, 'visitsGPV'),
  label: 'Visita',
})

export function useVisits() {
  const { items: visits, refresh, addItem, updateItem, removeItem } = useVisitsStore()

  const addVisit = useCallback(
    async (payload: NewVisit): Promise<Visit> => {
      const sourceModule = inferVisitSource(payload)
      const locationQuality = resolveLocationQuality(payload)
      const schedulePlan = evaluateVisitSchedule(payload, visits)

      if (!schedulePlan.canSave) {
        const message = schedulePlan.issues
          .filter((issue) => issue.severity === 'critical')
          .map((issue) => issue.message)
          .join(' ')
        throw new Error(message || 'La visita tiene conflictos de agenda.')
      }

      const newVisit: Visit = {
        id: generateId('visit'),
        distributorId: payload.distributorId || null,
        candidateId: payload.candidateId || null,
        backofficeContactId: payload.backofficeContactId || null,
        sourceModule,
        assignedUserId: payload.assignedUserId || null,
        date: normaliseDate(payload.date),
        scheduledTime: payload.scheduledTime,
        type: payload.type || 'presentacion',
        objective: payload.objective || '',
        summary: payload.summary || '',
        nextSteps: payload.nextSteps || '',
        result: payload.result || 'pendiente',
        statusOperative:
          payload.statusOperative ||
          (payload.scheduledTime ? 'planificada' : 'propuesta'),
        outcome: payload.outcome || 'neutral',
        location: payload.location || '',
        locationQuality,
        scheduleWarnings: schedulePlan.issues
          .filter((issue) => issue.severity !== 'critical')
          .map((issue) => issue.message),
        checklist: payload.checklist || {},
        linkedSaleId: payload.linkedSaleId || null,
        lat: payload.lat,
        lng: payload.lng,
        durationMinutes: payload.durationMinutes || 30,
        createdAt: normaliseDate(payload.createdAt || new Date()),
        reminder: payload.reminder || {
          enabled: false,
          minutesBefore: 60,
          channel: 'email',
          scheduledAt: null,
          lastTriggeredAt: null,
          createdAt: normaliseDate(new Date()),
          updatedAt: normaliseDate(new Date()),
        },
        notes: payload.notes || '',
      }
      return addItem(newVisit)
    },
    [addItem, visits]
  )

  const updateVisit = useCallback(
    async (id: EntityId, updates: VisitUpdates): Promise<Visit> => {
      const current = visits.find((v) => v.id === id)
      const normalised: VisitUpdates = { ...updates }
      if (normalised.date) normalised.date = normaliseDate(normalised.date)
      const nextVisit = current ? { ...current, ...normalised, id } : normalised
      if (
        nextVisit.date ||
        nextVisit.scheduledTime ||
        nextVisit.durationMinutes
      ) {
        const schedulePlan = evaluateVisitSchedule(nextVisit, visits)
        if (!schedulePlan.canSave) {
          const message = schedulePlan.issues
            .filter((issue) => issue.severity === 'critical')
            .map((issue) => issue.message)
            .join(' ')
          throw new Error(message || 'La visita tiene conflictos de agenda.')
        }
        normalised.locationQuality =
          normalised.locationQuality || schedulePlan.locationQuality
        normalised.scheduleWarnings = schedulePlan.issues
          .filter((issue) => issue.severity !== 'critical')
          .map((issue) => issue.message)
      }
      await updateItem(id, normalised)
      return nextVisit as Visit
    },
    [updateItem, visits]
  )

  const deleteVisit = useCallback(
    (id: EntityId): Promise<void> => removeItem(id),
    [removeItem]
  )

  return { visits, addVisit, updateVisit, deleteVisit, refresh }
}
