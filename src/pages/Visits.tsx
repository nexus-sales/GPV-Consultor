import React, { useCallback, useMemo, useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  BellAlertIcon,
  ArrowRightIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ContactSelectorModal from '../components/ContactSelectorModal'
import { VisitForm } from '../components/VisitForm'
import { WeeklyTimeGrid } from '../components/WeeklyTimeGrid'
import { VisitDetailsSlideOver } from '../components/VisitDetailsSlideOver'
import { DailyRouteMap } from '../components/DailyRouteMap'
import { useAppData } from '../lib/useAppData'
import type {
  Visit,
  Distributor,
  Candidate,
  EntityId,
  NewVisit,
  VisitReminder,
  NoteCategory,
  Task
} from '../lib/types'
import { resolveReminderWithDefaults } from '../lib/data/reminders'
import { useCalendarSync } from '../lib/integrations/useCalendarSync'
import { visitToCalendarEvent } from '../lib/integrations/visitMapper'
import '../styles/Visits.css'

// Tipos locales del componente
interface CallTask {
  id: string
  note?: string
  context?: string
}

interface PendingAction {
  id: string
  entityId: EntityId
  entityType: 'distributor' | 'candidate'
  entityName: string
  nextAction: string
  nextActionDate: string
  scheduledTime?: string
  category?: NoteCategory
}

interface VisitParticipant {
  type: 'distributor' | 'candidate' | 'unknown'
  name: string
  location: string
  contact: string
  phone: string
  entity: Distributor | Candidate | null
}

interface ContactSelection {
  type: 'distributor' | 'candidate'
  entity: Distributor | Candidate
}

type VisitFormSubmitData = {
  distributorId: EntityId | null
  candidateId: EntityId | null
  date: string
  scheduledTime: string
  type: Visit['type']
  objective: string
  summary: string
  nextSteps: string
  result: Visit['result']
  durationMinutes: number
}

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación comercial',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  incidencias: 'Incidencias',
  apertura: 'Apertura',
  otros: 'Otros'
}

const resultStyles: Record<string, string> = {
  pendiente: 'bg-amber-50 text-amber-700 border border-amber-200',
  completada: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  reprogramar: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  cancelada:
    'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
}

const resultLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  completada: 'Completada',
  reprogramar: 'Reprogramar',
  cancelada: 'Cancelada'
}

const actionPillGreen = 'visit-action-pill visit-action-pill--green'
const actionPillYellow = 'visit-action-pill visit-action-pill--yellow'
const actionPillPrimary = 'visit-action-pill visit-action-pill--indigo'
const actionPillCyan = 'visit-action-pill visit-action-pill--cyan'
const actionPillSlate = 'visit-action-pill visit-action-pill--slate'

const parseIsoDate = (isoDate?: string): Date => {
  if (!isoDate) return new Date()
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

const formatShortDate = (isoDate?: string): string => {
  const date = parseIsoDate(isoDate)
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const formatLongDate = (isoDate?: string): string => {
  const date = parseIsoDate(isoDate)
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

const resolveVisitBarClass = (value: number): string => {
  if (!Number.isFinite(value)) {
    return 'visit-bar-width-5'
  }

  const step = 5
  const bucket = Math.min(100, Math.max(step, Math.round(value / step) * step))
  return `visit-bar-width-${bucket}`
}

const Visits: React.FC = () => {
  const navigate = useNavigate()
  const {
    visits = [],
    distributors = [],
    candidates = [],
    callCenter,
    updateVisit,
    addVisit,
    tasks = [],
    moveCandidate,
    setNotifications
  } = useAppData()

  const { config: calendarConfig, syncEvent } = useCalendarSync()

  const notifyVisitPlanningError = useCallback(
    (error: unknown, fallback: string) => {
      const message = error instanceof Error ? error.message : fallback
      setNotifications?.((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'error',
          title: 'Agenda no disponible',
          description: message || fallback,
          timestamp: new Date().toISOString()
        }
      ])
    },
    [setNotifications]
  )

  const distributorLookup = useMemo(() => {
    const map = new Map<EntityId, Distributor>()
    ;(distributors || []).forEach((distributor) => {
      map.set(distributor.id, distributor)
    })
    return map
  }, [distributors])

  const candidateLookup = useMemo(() => {
    const map = new Map<EntityId, Candidate>()
    ;(candidates || []).forEach((candidate) => {
      map.set(candidate.id, candidate)
    })
    return map
  }, [candidates])

  const callTasksByDistributor = useMemo(
    () => callCenter?.lookup?.byDistributor ?? {},
    [callCenter]
  )

  const callTasksByCandidate = useMemo(
    () => callCenter?.lookup?.byCandidate ?? {},
    [callCenter]
  )

  const resolveVisitParticipant = useCallback(
    (visit: Visit): VisitParticipant => {
      if (!visit) {
        return {
          type: 'unknown',
          name: 'Contacto no asignado',
          location: 'Ubicación pendiente',
          contact: '',
          phone: '',
          entity: null
        }
      }

      const distributor = visit.distributorId
        ? distributorLookup.get(visit.distributorId)
        : null
      const candidate = visit.candidateId
        ? candidateLookup.get(visit.candidateId)
        : null

      if (distributor) {
        return {
          type: 'distributor',
          name: distributor.name || 'Distribuidor sin nombre',
          location:
            [distributor.city, distributor.province]
              .filter(Boolean)
              .join(', ') || 'Ubicación pendiente',
          contact: distributor.contactPerson || '',
          phone: distributor.phone || '',
          entity: distributor
        }
      }

      if (candidate) {
        return {
          type: 'candidate',
          name: candidate.name || 'Candidato sin nombre',
          location:
            [candidate.city, candidate.island].filter(Boolean).join(', ') ||
            'Ubicación pendiente',
          contact: candidate.contact?.name || '',
          phone: candidate.contact?.phone || '',
          entity: candidate
        }
      }

      return {
        type: 'unknown',
        name: 'Contacto no asignado',
        location: 'Ubicación pendiente',
        contact: '',
        phone: '',
        entity: null
      }
    },
    [candidateLookup, distributorLookup]
  )

  const getCallTasksForVisit = useCallback(
    (visit: Visit): CallTask[] => {
      if (!visit) return []
      if (visit.distributorId) {
        return callTasksByDistributor[visit.distributorId] ?? []
      }
      if (visit.candidateId) {
        return callTasksByCandidate[visit.candidateId] ?? []
      }
      return []
    },
    [callTasksByCandidate, callTasksByDistributor]
  )

  const [selectorOpen, setSelectorOpen] = useState<boolean>(false)
  const [activeVisitTarget, setActiveVisitTarget] =
    useState<ContactSelection | null>(null)
  const [visitToEdit, setVisitToEdit] = useState<Visit | null>(null)
  const [selectedVisitIdForSlideOver, setSelectedVisitIdForSlideOver] =
    useState<string | number | null>(null)
  // Siempre derivar desde el array actualizado para que refleje cambios de estado
  const selectedVisitForSlideOver = selectedVisitIdForSlideOver
    ? (visits.find(
        (v) => String(v.id) === String(selectedVisitIdForSlideOver)
      ) ?? null)
    : null
  const setSelectedVisitForSlideOver = (v: Visit | null) =>
    setSelectedVisitIdForSlideOver(v ? v.id : null)
  const [slotPrefill, setSlotPrefill] = useState<{
    date: string
    time: string
  } | null>(null)
  const [showRouteMap, setShowRouteMap] = useState(false)

  const [calendarRange, setCalendarRange] = useState<number>(7)
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunes de esta semana
    return new Date(d.setDate(diff))
  })

  const _reminderLeadOptions = useMemo(
    () => [
      { label: '24h antes', value: 1440 },
      { label: '3h antes', value: 180 },
      { label: '1h antes', value: 60 },
      { label: '30 min antes', value: 30 }
    ],
    []
  )

  const handleOpenSelector = useCallback(() => {
    setSlotPrefill(null)
    setSelectorOpen(true)
  }, [])

  const handleSlotClick = useCallback((dateIso: string, time: string) => {
    setSlotPrefill({ date: dateIso, time })
    setSelectorOpen(true)
  }, [])

  const handleCloseSelector = useCallback(() => {
    setSelectorOpen(false)
    setSlotPrefill(null)
  }, [])

  const handleSelectParticipant = useCallback(
    (selection: ContactSelection | null) => {
      if (!selection) return
      setSelectorOpen(false)
      setActiveVisitTarget(selection)
    },
    []
  )

  const handleVisitSubmit = useCallback(
    (payload: NewVisit) => {
      if (!payload) return
      const target = activeVisitTarget
      setActiveVisitTarget(null)
      void (async () => {
        try {
          const newVisit = await addVisit?.(payload)
          if (
            newVisit &&
            calendarConfig.calendar.enabled &&
            calendarConfig.calendar.syncVisits
          ) {
            let title = 'Visita comercial'
            let location: string | undefined
            if (target?.type === 'distributor' && target.entity) {
              const d = target.entity as Distributor
              title = d.name || title
              location =
                [d.city, d.province].filter(Boolean).join(', ') || undefined
            } else if (target?.type === 'candidate' && target.entity) {
              const c = target.entity as Candidate
              title = c.name || title
              location =
                [c.city, c.island].filter(Boolean).join(', ') || undefined
            }
            void syncEvent(visitToCalendarEvent(newVisit, title, location))
          }
        } catch (error) {
          notifyVisitPlanningError(
            error,
            'No se pudo crear la visita por conflictos de agenda.'
          )
        }
      })()
    },
    [
      addVisit,
      activeVisitTarget,
      calendarConfig.calendar,
      notifyVisitPlanningError,
      syncEvent
    ]
  )

  const handleCancelVisit = useCallback(() => {
    setActiveVisitTarget(null)
  }, [])

  const handleOpenEditVisit = useCallback((visit: Visit) => {
    if (!visit) return
    setVisitToEdit(visit)
  }, [])

  const handleCloseEditVisit = useCallback(() => {
    setVisitToEdit(null)
  }, [])

  const editInitialValues = useMemo(() => {
    if (!visitToEdit) return null
    return {
      date: visitToEdit.date,
      scheduledTime: visitToEdit.scheduledTime || '',
      type: visitToEdit.type,
      objective: visitToEdit.objective,
      summary: visitToEdit.summary,
      nextSteps: visitToEdit.nextSteps,
      result: visitToEdit.result,
      durationMinutes: visitToEdit.durationMinutes || 30,
      candidateId: visitToEdit.candidateId ?? null
    }
  }, [visitToEdit])

  const handleEditVisitSubmit = useCallback(
    (payload: VisitFormSubmitData) => {
      if (!visitToEdit) return
      void (async () => {
        try {
          const updatedVisit = await updateVisit?.(visitToEdit.id, {
            date: payload.date,
            scheduledTime: payload.scheduledTime,
            type: payload.type,
            objective: payload.objective,
            summary: payload.summary,
            nextSteps: payload.nextSteps,
            result: payload.result,
            durationMinutes: payload.durationMinutes
          })

          if (
            updatedVisit &&
            calendarConfig.calendar.enabled &&
            calendarConfig.calendar.syncVisits &&
            updatedVisit.result === 'pendiente'
          ) {
            const participant = resolveVisitParticipant(updatedVisit)
            void syncEvent(
              visitToCalendarEvent(
                updatedVisit,
                participant.name,
                participant.location
              )
            )
          }
          setVisitToEdit(null)
        } catch (error) {
          notifyVisitPlanningError(
            error,
            'No se pudo actualizar la visita por conflictos de agenda.'
          )
        }
      })()
    },
    [
      updateVisit,
      visitToEdit,
      calendarConfig.calendar,
      notifyVisitPlanningError,
      syncEvent,
      resolveVisitParticipant
    ]
  )

  const handleCalendarRangeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setCalendarRange(Number(event.target.value))
    },
    []
  )

  const applyReminderUpdate = useCallback(
    (visit: Visit, patch: Partial<VisitReminder>) => {
      if (!updateVisit) return
      const baseReminder = resolveReminderWithDefaults(
        visit.date,
        visit.reminder
      )
      const minutesBefore =
        patch.minutesBefore != null
          ? Number(patch.minutesBefore)
          : baseReminder.minutesBefore
      const nextReminder: VisitReminder = {
        ...baseReminder,
        ...patch,
        minutesBefore,
        updatedAt: new Date().toISOString()
      }
      updateVisit(visit.id, { reminder: nextReminder })
    },
    [updateVisit]
  )

  const _handleReminderToggle = useCallback(
    (visit: Visit) => {
      const currentReminder = resolveReminderWithDefaults(
        visit.date,
        visit.reminder
      )
      applyReminderUpdate(visit, { enabled: !currentReminder.enabled })
    },
    [applyReminderUpdate]
  )

  const _handleReminderLeadChange = useCallback(
    (visit: Visit, minutes: number) => {
      applyReminderUpdate(visit, { minutesBefore: minutes })
    },
    [applyReminderUpdate]
  )

  const handleUpdateVisitResult = useCallback(
    async (
      visitId: EntityId,
      result: Visit['result'],
      outcome?: Visit['outcome']
    ) => {
      if (!visitId || !result) return

      const visit = visits.find((v) => v.id === visitId)
      if (!visit) return

      // 1. Actualizar la visita con resultado y estado finalizado
      await updateVisit?.(visitId, {
        result,
        statusOperative:
          result === 'completada' ? 'finalizada' : visit.statusOperative,
        outcome: outcome || visit.outcome
      })

      // 2. Automatización: Si es un candidato y el resultado es positivo -> Avanzar etapa
      if (
        visit.candidateId &&
        (outcome === 'positive' || result === 'completada')
      ) {
        const candidate = candidates.find((c) => c.id === visit.candidateId)
        if (candidate) {
          const nextStage = callCenter.helpers?.nextCandidateStage(
            candidate.stage
          )
          if (nextStage) {
            await moveCandidate?.(candidate.id, nextStage)

            // Notificación de éxito
            setNotifications?.((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                type: 'success',
                title: 'Cierre de ciclo / Automatización',
                description: `Candidato ${candidate.name} avanzado a etapa operativa tras visita exitosa.`,
                timestamp: new Date().toISOString()
              }
            ])
          }
        }
      }
    },
    [
      updateVisit,
      visits,
      candidates,
      moveCandidate,
      callCenter.helpers,
      setNotifications
    ]
  )

  const handleVisitMove = useCallback(
    (visitId: EntityId, newDate: string, newTime: string) => {
      void updateVisit?.(visitId, { date: newDate, scheduledTime: newTime }).catch(
        (error) =>
          notifyVisitPlanningError(
            error,
            'No se pudo mover la visita por conflictos de agenda.'
          )
      )
    },
    [notifyVisitPlanningError, updateVisit]
  )

  const handlePrevWeek = useCallback(() => {
    setViewDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() - 7)
      return next
    })
  }, [])

  const handleNextWeek = useCallback(() => {
    setViewDate((prev) => {
      const next = new Date(prev)
      next.setDate(prev.getDate() + 7)
      return next
    })
  }, [])

  const handleToday = useCallback(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    setViewDate(new Date(d.setDate(diff)))
  }, [])

  const { upcoming, overdue, completed, averageDuration, typeStats } =
    useMemo(() => {
      if (!visits?.length) {
        return {
          upcoming: [],
          past: [],
          overdue: [],
          completed: [],
          averageDuration: 0,
          typeStats: []
        }
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const sorted = [...visits].sort(
        (a: Visit, b: Visit) =>
          parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime()
      )

      // Próximas visitas: fecha >= hoy Y NO completadas/canceladas
      const upcomingVisits = sorted.filter(
        (visit: Visit) =>
          parseIsoDate(visit.date) >= today &&
          visit.result !== 'completada' &&
          visit.result !== 'cancelada'
      )
      // Visitas pasadas: fecha < hoy Y NO completadas/canceladas (pendientes o reprogramadas)
      const pastVisits = sorted
        .filter(
          (visit: Visit) =>
            parseIsoDate(visit.date) < today &&
            visit.result !== 'completada' &&
            visit.result !== 'cancelada'
        )
        .reverse()
      const overdueVisits = pastVisits.filter(
        (visit: Visit) => visit.result === 'pendiente'
      )
      // Visitas completadas: solo las que tienen result === 'completada'
      const completedVisits = sorted.filter(
        (visit: Visit) => visit.result === 'completada'
      )

      const totalDuration = sorted.reduce(
        (acc: number, visit: Visit) => acc + (visit.durationMinutes || 0),
        0
      )
      const average = Math.round(totalDuration / sorted.length)

      const byType = sorted.reduce(
        (acc: Record<string, number>, visit: Visit) => {
          const key = visit.type || 'otros'
          acc[key] = (acc[key] || 0) + 1
          return acc
        },
        {}
      )

      const typeStatsArray = Object.entries(byType)
        .map(([type, count]) => ({
          type,
          label: visitTypeLabels[type] || visitTypeLabels.otros,
          count: Number(count)
        }))
        .sort((a, b) => b.count - a.count)

      return {
        upcoming: upcomingVisits,
        past: pastVisits,
        overdue: overdueVisits,
        completed: completedVisits,
        averageDuration: average,
        typeStats: typeStatsArray
      }
    }, [visits])

  const totalVisits = visits?.length || 0
  const completionRate = totalVisits
    ? Math.round((completed.length / totalVisits) * 100)
    : 0
  const nextVisit = upcoming[0] || null
  const nextVisitParticipant = nextVisit
    ? resolveVisitParticipant(nextVisit)
    : null
  const agenda = upcoming.slice(0, 4)
  // Historial: últimas 6 visitas completadas
  const history = completed.slice(0, 6).reverse()
  const nextVisitCallTasks = nextVisit ? getCallTasksForVisit(nextVisit) : []

  const visitsByDate = useMemo(() => {
    return visits.reduce<Record<string, Visit[]>>((acc, visitItem) => {
      const key = visitItem.date
      if (!acc[key]) acc[key] = []
      acc[key].push(visitItem)
      return acc
    }, {})
  }, [visits])

  const actionsByDate = useMemo(() => {
    const map: Record<string, PendingAction[]> = {}
    for (const dist of distributors) {
      for (const note of dist.notesHistory ?? []) {
        if (!note.nextAction || !note.nextActionDate) continue
        const key = note.nextActionDate
        if (!map[key]) map[key] = []
        map[key].push({
          id: note.id,
          entityId: dist.id,
          entityType: 'distributor',
          entityName: dist.name || 'Sin nombre',
          nextAction: note.nextAction,
          nextActionDate: note.nextActionDate,
          scheduledTime:
            note.nextActionTime ||
            (note.scheduledDate === note.nextActionDate
              ? note.scheduledTime
              : undefined),
          category: note.category
        })
      }
    }
    for (const cand of candidates) {
      for (const note of cand.notesHistory ?? []) {
        if (!note.nextAction || !note.nextActionDate) continue
        const key = note.nextActionDate
        if (!map[key]) map[key] = []
        map[key].push({
          id: note.id,
          entityId: cand.id,
          entityType: 'candidate',
          entityName: cand.name || 'Sin nombre',
          nextAction: note.nextAction,
          nextActionDate: note.nextActionDate,
          scheduledTime:
            note.nextActionTime ||
            (note.scheduledDate === note.nextActionDate
              ? note.scheduledTime
              : undefined),
          category: note.category
        })
      }
    }
    return map
  }, [distributors, candidates])

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const task of tasks || []) {
      if (!task.dueDate) continue
      const key = task.dueDate
      if (!map[key]) map[key] = []
      map[key].push(task)
    }
    return map
  }, [tasks])

  const todayIso = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  const calendarDays = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const start = new Date(viewDate)

    return Array.from({ length: calendarRange }, (_, index) => {
      const current = new Date(start)
      current.setDate(start.getDate() + index)
      current.setHours(0, 0, 0, 0)

      const iso = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
      const dayVisits = visitsByDate[iso] ?? []
      const weekdayLabel = current.toLocaleDateString('es-ES', {
        weekday: 'short'
      })

      return {
        iso,
        label: weekdayLabel,
        dayNumber: current.getDate(),
        date: current,
        isToday: iso === todayIso,
        isPast: current.getTime() < now.getTime(),
        visits: dayVisits,
        actions: actionsByDate[iso] ?? [],
        tasks: tasksByDate[iso] ?? []
      }
    })
  }, [
    calendarRange,
    viewDate,
    todayIso,
    visitsByDate,
    actionsByDate,
    tasksByDate
  ])

  const calendarRangeLabel = useMemo(() => {
    if (calendarRange === 7) return 'Próximos 7 días'
    if (calendarRange === 14) return 'Próximas 2 semanas'
    if (calendarRange === 21) return 'Próximas 3 semanas'
    return `Próximos ${calendarRange} días`
  }, [calendarRange])

  const activeReminderCount = useMemo(
    () =>
      visits.reduce((accumulator, visitItem) => {
        const reminder = resolveReminderWithDefaults(
          visitItem.date,
          visitItem.reminder
        )
        return reminder.enabled ? accumulator + 1 : accumulator
      }, 0),
    [visits]
  )

  const viewRangeTitle = useMemo(() => {
    if (calendarDays.length === 0) return ''
    const start = calendarDays[0].date
    const end = calendarDays[calendarDays.length - 1].date

    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('es-ES', { month: 'long' })}`
    }
    return `${start.getDate()} ${start.toLocaleDateString('es-ES', { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString('es-ES', { month: 'short' })}`
  }, [calendarDays])

  const _pendingActionsCount = useMemo(() => {
    const todayStr = todayIso
    return Object.entries(actionsByDate).reduce((acc, [date, actions]) => {
      return date >= todayStr ? acc + actions.length : acc
    }, 0)
  }, [actionsByDate, todayIso])

  return (
    <div className="visits-page-bg">
      <PageContainer className="py-10 space-y-8">
        <header className="visits-header flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                Gestión operativa
              </p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agenda de visitas
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Coordina las visitas comerciales, visualiza los compromisos
              pendientes y haz seguimiento de los resultados para cada
              distribuidor.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button icon={CalendarIcon} onClick={handleOpenSelector}>
              Nueva visita
            </Button>
            <Button
              variant="outline"
              icon={ClipboardDocumentListIcon}
              onClick={() => navigate('/reports')}
            >
              Reporte semanal
            </Button>
          </div>
        </header>

        <section className="visits-calendar-section mt-8 p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
                Calendario operativo
              </h2>
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {calendarRangeLabel}
                </p>
                {activeReminderCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                    <BellAlertIcon className="h-3 w-3" />
                    {activeReminderCount} avisos
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1 shadow-sm">
                <button
                  onClick={handlePrevWeek}
                  title="Semana anterior"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  <ArrowRightIcon className="h-4 w-4 rotate-180" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Hoy
                </button>
                <button
                  onClick={handleNextWeek}
                  title="Semana siguiente"
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 px-4 py-2 rounded-2xl shadow-md shadow-indigo-500/20">
                  <span className="text-sm font-bold text-white whitespace-nowrap">
                    {viewRangeTitle}
                  </span>
                </div>

                <select
                  value={calendarRange}
                  onChange={handleCalendarRangeChange}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                >
                  <option value={7}>Semana</option>
                  <option value={14}>Quincena</option>
                  <option value={21}>3 Semanas</option>
                </select>

                <button
                  onClick={() => setShowRouteMap(!showRouteMap)}
                  className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm ${
                    showRouteMap
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                  }`}
                >
                  <MapPinIcon className="h-4 w-4" />
                  {showRouteMap ? 'Ocultar Ruta' : 'Ver Ruta Hoy'}
                </button>
              </div>
            </div>
          </div>

          {showRouteMap && (
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <DailyRouteMap
                visits={visitsByDate[todayIso] || []}
                onVisitClick={(v) => setSelectedVisitForSlideOver(v)}
              />
            </div>
          )}

          <div className="mt-8 weekly-grid-scroll-wrapper">
            <WeeklyTimeGrid
              visitsByDate={visitsByDate}
              actionsByDate={actionsByDate}
              tasksByDate={tasksByDate}
              days={calendarDays}
              distributorLookup={distributorLookup}
              candidateLookup={candidateLookup}
              onSlotClick={handleSlotClick}
              onVisitMove={handleVisitMove}
              onVisitClick={(v) => setSelectedVisitForSlideOver(v)}
              onActionClick={(action) => {
                navigate(
                  action.entityType === 'distributor'
                    ? `/distributors/${action.entityId}`
                    : `/candidates/${action.entityId}`
                )
              }}
              onTaskClick={(_task) => {
                navigate('/tasks') // O ir a la entidad? Navegar a tareas por ahora
              }}
            />
          </div>
        </section>

        <section className="mt-8 visits-kpi-section grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card variant="default" className="xl:col-span-2">
            <Card.Header className="flex items-center justify-between">
              <div>
                <Card.Title>Próxima visita</Card.Title>
                <Card.Description>
                  {nextVisit
                    ? 'Revisa los detalles y confirma los próximos pasos.'
                    : 'No hay visitas planificadas. Usa "Nueva visita" para agendar el próximo encuentro.'}
                </Card.Description>
              </div>
              {nextVisit && (
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <CalendarIcon className="h-4 w-4" />
                  {formatLongDate(nextVisit.date)}
                </span>
              )}
            </Card.Header>
            {nextVisit ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {nextVisitParticipant?.type === 'candidate'
                          ? 'Candidato'
                          : 'Distribuidor'}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {nextVisitParticipant?.name || 'Sin asignar'}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <MapPinIcon className="h-4 w-4" />
                        {nextVisitParticipant?.location ||
                          'Ubicación pendiente'}
                      </p>
                      {nextVisitParticipant?.contact && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Contacto: {nextVisitParticipant.contact}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Objetivo
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {nextVisit.objective || 'Sin objetivo definido'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Próximos pasos comprometidos
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {nextVisit.nextSteps ||
                          'Definir acciones al finalizar la visita'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Tipo de visita
                        </p>
                        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                          {visitTypeLabels[nextVisit.type] ||
                            visitTypeLabels.otros}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${resultStyles[nextVisit.result] || resultStyles.pendiente}`}
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        {resultLabels[nextVisit.result] ||
                          resultLabels.pendiente}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                      <ClockIcon className="h-5 w-5" />
                      {nextVisit.durationMinutes || 30} minutos estimados
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Resumen:
                        </span>{' '}
                        {nextVisit.summary || 'Pendiente de registrar.'}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4" />
                        Actualiza el resultado tras finalizar la visita para
                        alimentar los reportes automáticos.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        className={actionPillGreen}
                        onClick={() =>
                          handleUpdateVisitResult(nextVisit.id, 'completada')
                        }
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Completar
                      </button>
                      <button
                        type="button"
                        className={actionPillYellow}
                        onClick={() =>
                          handleUpdateVisitResult(nextVisit.id, 'reprogramar')
                        }
                      >
                        <ExclamationTriangleIcon className="h-4 w-4" />
                        Reprogramar
                      </button>
                      <button
                        type="button"
                        className={actionPillSlate}
                        onClick={() => handleOpenEditVisit(nextVisit)}
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        className={actionPillPrimary}
                        onClick={() => navigate('/calls')}
                      >
                        <PhoneIcon className="h-4 w-4" />
                        Ir a llamadas
                      </button>
                    </div>
                  </div>
                </div>
                {nextVisitCallTasks.length > 0 && (
                  <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-500/30 dark:bg-cyan-500/10">
                    <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                      Seguimiento telefónico pendiente
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-cyan-700 dark:text-cyan-300">
                      {nextVisitCallTasks.slice(0, 3).map((task: CallTask) => (
                        <li key={task.id} className="flex items-center gap-2">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{task.note || task.context}</span>
                        </li>
                      ))}
                    </ul>
                    {nextVisitCallTasks.length > 3 && (
                      <p className="mt-2 text-xs text-cyan-600/80 dark:text-cyan-300/80">
                        +{nextVisitCallTasks.length - 3} tareas adicionales
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className={actionPillCyan}
                        onClick={() => navigate('/calls')}
                      >
                        <SparklesIcon className="h-4 w-4" />
                        Abrir módulo de llamadas
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-900">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10">
                  <CalendarIcon className="h-8 w-8 text-indigo-400 dark:text-indigo-300" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  No hay visitas programadas. Usa el botón “Nueva visita” para
                  agendar el próximo encuentro con tu red.
                </p>
              </div>
            )}
          </Card>

          {/* KPI Panel — tarjetas de color pastel individuales */}
          <div className="flex flex-col gap-4">
            {/* Visitas planificadas — indigo */}
            <div className="visits-kpi-card visits-kpi-card--indigo">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-300">
                Visitas planificadas
              </p>
              <p className="mt-2 text-4xl font-bold text-indigo-700 dark:text-indigo-300">
                {upcoming.length}
              </p>
              <p className="mt-1 text-xs text-indigo-400 dark:text-indigo-400">
                próximas en agenda
              </p>
            </div>
            {/* Pendientes — amarillo */}
            <div className="visits-kpi-card visits-kpi-card--yellow">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 dark:text-amber-300">
                Pendientes de resultado
              </p>
              <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-300">
                {overdue.length +
                  upcoming.filter(
                    (visit: Visit) => visit.result === 'pendiente'
                  ).length}
              </p>
              <p className="mt-1 text-xs text-amber-400">
                requieren actualización
              </p>
            </div>
            {/* Tasa cierre — verde */}
            <div className="visits-kpi-card visits-kpi-card--green">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 dark:text-emerald-300">
                Tasa de cierre
              </p>
              <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-300">
                {completionRate}%
              </p>
              <p className="mt-1 text-xs text-emerald-400">
                {completed.length} de {totalVisits || 0} completadas
              </p>
            </div>
          </div>
        </section>

        <section className="visits-cards-section grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <Card.Header>
              <Card.Title>Distribución por tipo</Card.Title>
              <Card.Description>
                Entiende el foco de las interacciones
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {typeStats.length ? (
                typeStats.map((entry) => {
                  const percentage = totalVisits
                    ? Math.round((entry.count / totalVisits) * 100)
                    : 0
                  const barClass = resolveVisitBarClass(percentage)
                  return (
                    <div key={entry.type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {entry.label}
                        </span>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {entry.count} - {percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`visit-bar h-2.5 rounded-full bg-indigo-500 ${barClass}`}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Todavia no hay visitas registradas.
                </p>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Visitas atrasadas</Card.Title>
              <Card.Description>
                Seguimiento inmediato recomendado
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {overdue.length ? (
                overdue.slice(0, 4).map((visit: Visit) => {
                  const participant = resolveVisitParticipant(visit)
                  const pendingCalls = getCallTasksForVisit(visit)
                  return (
                    <div
                      key={visit.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-gray-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-gray-300"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {participant.name}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-gray-900 dark:text-amber-300">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          {formatShortDate(visit.date)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {visit.objective || 'Sin objetivo registrado'}
                      </p>
                      {visit.nextSteps && (
                        <p className="mt-2 rounded-xl bg-white p-3 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                          Próximo paso: {visit.nextSteps}
                        </p>
                      )}
                      {pendingCalls.length > 0 && (
                        <p className="mt-3 text-xs text-cyan-700 dark:text-cyan-300">
                          {pendingCalls.length} tarea
                          {pendingCalls.length > 1 ? 's' : ''} telefónica
                          pendiente
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={actionPillGreen}
                          onClick={() =>
                            handleUpdateVisitResult(visit.id, 'completada')
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Completar
                        </button>
                        <button
                          type="button"
                          className={actionPillYellow}
                          onClick={() =>
                            handleUpdateVisitResult(visit.id, 'reprogramar')
                          }
                        >
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Reprogramar
                        </button>
                        <button
                          type="button"
                          className={actionPillSlate}
                          onClick={() => handleOpenEditVisit(visit)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={actionPillPrimary}
                          onClick={() => navigate('/calls')}
                        >
                          <PhoneIcon className="h-4 w-4" />
                          Llamadas
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-700/50 dark:bg-emerald-950/20">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Sin visitas vencidas. Buen trabajo.
                  </p>
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Metricas operativas</Card.Title>
              <Card.Description>
                Tiempo y cadencia de las reuniones
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-3">
              <div className="visits-kpi-card visits-kpi-card--indigo flex items-center justify-between !py-3 !px-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-indigo-400 dark:text-indigo-300">
                    Duracion media
                  </p>
                  <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
                    {averageDuration || 0} min
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-indigo-400 dark:text-indigo-300" />
              </div>
              <div className="visits-kpi-card visits-kpi-card--green flex items-center justify-between !py-3 !px-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-400 dark:text-emerald-300">
                    Completadas
                  </p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-300">
                    {completed.length}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-emerald-400 dark:text-emerald-300" />
              </div>
              <div className="visits-kpi-card visits-kpi-card--yellow flex items-center justify-between !py-3 !px-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-400 dark:text-amber-300">
                    Compromisos
                  </p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-300">
                    {overdue.length}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-amber-400 dark:text-amber-300" />
              </div>
              <div className="visits-kpi-card visits-kpi-card--cyan flex items-center justify-between !py-3 !px-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-cyan-400 dark:text-cyan-300">
                    Seguimiento tel.
                  </p>
                  <p className="text-xl font-bold text-cyan-600 dark:text-cyan-300">
                    {callCenter?.stats?.urgent ?? 0}
                  </p>
                </div>
                <PhoneIcon className="h-8 w-8 text-cyan-400 dark:text-cyan-300" />
              </div>
            </Card.Content>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card variant="elevated">
            <Card.Header>
              <Card.Title>Agenda próxima</Card.Title>
              <Card.Description>
                Máximo foco en los próximos compromisos
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {agenda.length ? (
                agenda.map((visit: Visit) => {
                  const participant = resolveVisitParticipant(visit)
                  const pendingCalls = getCallTasksForVisit(visit)
                  return (
                    <div
                      key={visit.id}
                      className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {participant.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 flex items-center gap-2">
                            <MapPinIcon className="h-4 w-4" />
                            {participant.location}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Objetivo:{' '}
                            {visit.objective || 'Sin objetivo definido'}
                          </p>
                          {pendingCalls.length > 0 && (
                            <p className="text-xs text-cyan-700 dark:text-cyan-300">
                              {pendingCalls.length} tarea
                              {pendingCalls.length > 1 ? 's' : ''} en llamadas
                              pendientes
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <CalendarIcon className="h-4 w-4" />
                            {formatShortDate(visit.date)}
                          </span>
                          <ArrowRightIcon className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={actionPillGreen}
                          onClick={() =>
                            handleUpdateVisitResult(visit.id, 'completada')
                          }
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Completar
                        </button>
                        <button
                          type="button"
                          className={actionPillYellow}
                          onClick={() =>
                            handleUpdateVisitResult(visit.id, 'reprogramar')
                          }
                        >
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          Reprogramar
                        </button>
                        <button
                          type="button"
                          className={actionPillSlate}
                          onClick={() => handleOpenEditVisit(visit)}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          className={actionPillPrimary}
                          onClick={() => navigate('/calls')}
                        >
                          <PhoneIcon className="h-4 w-4" />
                          Llamadas
                        </button>
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay visitas futuras registradas.
                </p>
              )}
            </Card.Content>
          </Card>

          <Card variant="elevated">
            <Card.Header>
              <Card.Title>Historial reciente</Card.Title>
              <Card.Description>Últimas reuniones registradas</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {history.length ? (
                history.map((visit: Visit) => {
                  const participant = resolveVisitParticipant(visit)
                  return (
                    <div key={visit.id} className="visits-history-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {participant.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatShortDate(visit.date)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${resultStyles[visit.result] || resultStyles.pendiente}`}
                        >
                          {resultLabels[visit.result] || resultLabels.pendiente}
                        </span>
                      </div>
                      {visit.summary && (
                        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          {visit.summary}
                        </p>
                      )}
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aún no hay visitas registradas en el historial.
                </p>
              )}
            </Card.Content>
          </Card>
        </section>
      </PageContainer>

      {selectorOpen && (
        <ContactSelectorModal
          onClose={handleCloseSelector}
          onSelect={handleSelectParticipant}
          distributors={distributors}
          candidates={candidates}
          title="Seleccionar contacto"
        />
      )}

      {activeVisitTarget && (
        <Modal
          title={`Nueva visita • ${activeVisitTarget.entity.name}`}
          maxWidth="max-w-xl"
          onClose={handleCancelVisit}
        >
          <VisitForm
            distributor={
              activeVisitTarget.type === 'distributor'
                ? (activeVisitTarget.entity as Distributor)
                : undefined
            }
            candidate={
              activeVisitTarget.type === 'candidate'
                ? (activeVisitTarget.entity as Candidate)
                : undefined
            }
            initialValues={
              slotPrefill
                ? {
                    date: slotPrefill.date,
                    scheduledTime: slotPrefill.time
                  }
                : undefined
            }
            onSubmit={handleVisitSubmit}
            onCancel={handleCancelVisit}
          />
        </Modal>
      )}

      {visitToEdit && (
        <Modal
          title={`Editar visita • ${resolveVisitParticipant(visitToEdit).name}`}
          maxWidth="max-w-xl"
          onClose={handleCloseEditVisit}
        >
          <VisitForm
            distributor={
              visitToEdit.distributorId
                ? (distributorLookup.get(visitToEdit.distributorId) as
                    | Distributor
                    | undefined)
                : undefined
            }
            candidate={
              visitToEdit.candidateId
                ? (candidateLookup.get(visitToEdit.candidateId) as
                    | Candidate
                    | undefined)
                : undefined
            }
            initialValues={editInitialValues || undefined}
            submitLabel="Guardar cambios"
            onSubmit={handleEditVisitSubmit}
            onCancel={handleCloseEditVisit}
          />
        </Modal>
      )}

      {selectedVisitForSlideOver && (
        <VisitDetailsSlideOver
          visit={selectedVisitForSlideOver}
          onClose={() => setSelectedVisitForSlideOver(null)}
          distributor={
            selectedVisitForSlideOver.distributorId
              ? (distributorLookup.get(
                  selectedVisitForSlideOver.distributorId
                ) ?? null)
              : null
          }
          candidate={
            selectedVisitForSlideOver.candidateId
              ? (candidateLookup.get(selectedVisitForSlideOver.candidateId) ??
                null)
              : null
          }
          onEdit={(v) => {
            setSelectedVisitForSlideOver(null)
            handleOpenEditVisit(v)
          }}
          onComplete={async (id, result, outcome) => {
            await handleUpdateVisitResult(id, result, outcome)
            setSelectedVisitForSlideOver(null)
          }}
        />
      )}
    </div>
  )
}

export default Visits
