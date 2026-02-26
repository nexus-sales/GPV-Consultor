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
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import ContactSelectorModal from '../components/ContactSelectorModal'
import { VisitForm } from '../components/VisitForm'
import { useAppData } from '../lib/useAppData'
import type {
  Visit,
  Distributor,
  Candidate,
  EntityId,
  NewVisit,
  VisitReminder
} from '../lib/types'
import { resolveReminderWithDefaults } from '../lib/data/reminders'
import '../styles/Visits.css'

// Tipos locales del componente
interface CallTask {
  id: string
  note?: string
  context?: string
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

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación comercial',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  incidencias: 'Incidencias',
  apertura: 'Apertura',
  otros: 'Otros'
}

const resultStyles: Record<string, string> = {
  pendiente:
    'bg-pastel-yellow/20 text-pastel-yellow border border-pastel-yellow/30',
  completada:
    'bg-pastel-green/20 text-pastel-green border border-pastel-green/30',
  reprogramar:
    'bg-pastel-cyan/20 text-pastel-cyan border border-pastel-cyan/30',
  cancelada:
    'bg-gray-200 text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
}

const resultLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  completada: 'Completada',
  reprogramar: 'Reprogramar',
  cancelada: 'Cancelada'
}

const actionPillBase =
  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition'
const actionPillPrimary = `${actionPillBase} border border-pastel-indigo/40 text-pastel-indigo hover:bg-pastel-indigo/10`
const actionPillGreen = `${actionPillBase} bg-pastel-green/15 text-pastel-green border border-pastel-green/40 hover:bg-pastel-green/25`
const actionPillYellow = `${actionPillBase} bg-pastel-yellow/15 text-pastel-yellow border border-pastel-yellow/40 hover:bg-pastel-yellow/25`
const actionPillCyan = `${actionPillBase} border border-pastel-cyan/40 text-pastel-cyan hover:bg-pastel-cyan/10`

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
    addVisit
  } = useAppData()

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
  const [calendarRange, setCalendarRange] = useState<number>(14)

  const reminderLeadOptions = useMemo(
    () => [
      { label: '24h antes', value: 1440 },
      { label: '3h antes', value: 180 },
      { label: '1h antes', value: 60 },
      { label: '30 min antes', value: 30 }
    ],
    []
  )

  const handleOpenSelector = useCallback(() => {
    setSelectorOpen(true)
  }, [])

  const handleCloseSelector = useCallback(() => {
    setSelectorOpen(false)
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
      addVisit?.(payload)
      setActiveVisitTarget(null)
    },
    [addVisit]
  )

  const handleCancelVisit = useCallback(() => {
    setActiveVisitTarget(null)
  }, [])

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

  const handleReminderToggle = useCallback(
    (visit: Visit) => {
      const currentReminder = resolveReminderWithDefaults(
        visit.date,
        visit.reminder
      )
      applyReminderUpdate(visit, { enabled: !currentReminder.enabled })
    },
    [applyReminderUpdate]
  )

  const handleReminderLeadChange = useCallback(
    (visit: Visit, minutes: number) => {
      applyReminderUpdate(visit, { minutesBefore: minutes })
    },
    [applyReminderUpdate]
  )

  const handleUpdateVisitResult = useCallback(
    (visitId: EntityId, result: Visit['result']) => {
      if (!visitId || !result) return
      updateVisit?.(visitId, { result })
    },
    [updateVisit]
  )

  const { upcoming, past, overdue, completed, averageDuration, typeStats } =
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

      const upcomingVisits = sorted.filter(
        (visit: Visit) => parseIsoDate(visit.date) >= today
      )
      const pastVisits = sorted
        .filter((visit: Visit) => parseIsoDate(visit.date) < today)
        .reverse()
      const overdueVisits = pastVisits.filter(
        (visit: Visit) => visit.result === 'pendiente'
      )
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
  const history = past.slice(0, 6)
  const nextVisitCallTasks = nextVisit ? getCallTasksForVisit(nextVisit) : []

  const visitsByDate = useMemo(() => {
    return visits.reduce<Record<string, Visit[]>>((acc, visitItem) => {
      const key = visitItem.date
      if (!acc[key]) acc[key] = []
      acc[key].push(visitItem)
      return acc
    }, {})
  }, [visits])

  const todayIso = new Date().toISOString().slice(0, 10)

  const calendarDays = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const start = new Date(today)
    const weekday = start.getDay()
    const mondayOffset = (weekday + 6) % 7
    start.setDate(start.getDate() - mondayOffset)

    return Array.from({ length: calendarRange }, (_, index) => {
      const current = new Date(start)
      current.setDate(start.getDate() + index)
      current.setHours(0, 0, 0, 0)
      const iso = current.toISOString().slice(0, 10)
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
        isPast: current.getTime() < today.getTime(),
        visits: dayVisits
      }
    })
  }, [calendarRange, todayIso, visitsByDate])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
              Gestión operativa
            </p>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Agenda de visitas
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 max-w-2xl">
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

        <section className="mt-8 rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/80 dark:bg-gray-800/80 p-6 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Calendario operativo
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Visualiza las próximas visitas y configura recordatorios
                automáticos para anticiparte a cada interacción.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-pastel-indigo/30 px-3 py-1 text-xs font-semibold text-pastel-indigo">
                <BellAlertIcon className="h-4 w-4" />
                {activeReminderCount} recordatorios activos
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Horizonte
                <select
                  value={calendarRange}
                  onChange={handleCalendarRangeChange}
                  className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={21}>21 días</option>
                </select>
              </label>
            </div>
          </div>
          <p className="mt-3 text-xs font-medium uppercase tracking-widest text-pastel-indigo">
            {calendarRangeLabel}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
            {calendarDays.map((day) => (
              <article
                key={day.iso}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  day.isToday
                    ? 'border-pastel-indigo/60 bg-pastel-indigo/5'
                    : 'border-white/40 dark:border-gray-700/40 bg-white/70 dark:bg-gray-700/60'
                } ${day.isPast && !day.isToday ? 'opacity-75' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {day.label}
                  </span>
                  <span
                    className={`text-lg font-semibold ${
                      day.isToday
                        ? 'text-pastel-indigo'
                        : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {day.dayNumber.toString().padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {day.visits.length === 0 ? (
                    <p className="text-[11px] text-gray-400">
                      Sin visitas planificadas.
                    </p>
                  ) : (
                    day.visits.map((visit) => {
                      const participant = resolveVisitParticipant(visit)
                      const reminder = resolveReminderWithDefaults(
                        visit.date,
                        visit.reminder
                      )
                      const reminderDate = reminder.scheduledAt
                        ? new Date(reminder.scheduledAt)
                        : null
                      const reminderLabel = reminderDate
                        ? reminderDate.toLocaleString('es-ES', {
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Sin programar'

                      return (
                        <div
                          key={visit.id}
                          className="visit-card rounded-xl border border-pastel-indigo/10 bg-white/80 dark:bg-gray-800/80 p-3 shadow-inner"
                          data-overdue={
                            visit.result === 'pendiente' &&
                            parseIsoDate(visit.date) < new Date()
                              ? 'true'
                              : undefined
                          }
                        >
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {participant.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {visitTypeLabels[visit.type] ||
                              visitTypeLabels.otros}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {participant.location || 'Ubicación pendiente'}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReminderToggle(visit)}
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                reminder.enabled
                                  ? 'border-pastel-indigo bg-pastel-indigo/10 text-pastel-indigo'
                                  : 'border-gray-300 text-gray-500 hover:border-pastel-indigo/50 hover:text-pastel-indigo'
                              }`}
                            >
                              <BellAlertIcon className="h-4 w-4" />
                              {reminder.enabled ? 'Recordando' : 'Recordar'}
                            </button>
                            <select
                              value={reminder.minutesBefore}
                              onChange={(event) =>
                                handleReminderLeadChange(
                                  visit,
                                  Number(event.target.value)
                                )
                              }
                              aria-label="Configurar recordatorio"
                              className="rounded-full border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
                            >
                              {reminderLeadOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                            {reminder.enabled
                              ? `Recordatorio programado ${reminderLabel}`
                              : `Preparado para ${reminderLabel}`}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card variant="glass" className="xl:col-span-2">
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
                <span className="inline-flex items-center gap-2 rounded-full bg-pastel-indigo/10 px-4 py-1 text-sm font-semibold text-pastel-indigo">
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
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 flex items-center gap-2">
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
                  <div className="space-y-4 rounded-3xl bg-white/70 dark:bg-gray-700/70 p-6 shadow-inner">
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
                    <div className="flex items-center gap-3 rounded-2xl bg-pastel-indigo/10 px-4 py-3 text-sm text-pastel-indigo">
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
                  <div className="mt-6 rounded-3xl border border-pastel-cyan/40 bg-pastel-cyan/10 p-4">
                    <p className="text-sm font-semibold text-pastel-cyan">
                      Seguimiento telefónico pendiente
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-pastel-cyan">
                      {nextVisitCallTasks.slice(0, 3).map((task: CallTask) => (
                        <li key={task.id} className="flex items-center gap-2">
                          <PhoneIcon className="h-3.5 w-3.5" />
                          <span>{task.note || task.context}</span>
                        </li>
                      ))}
                    </ul>
                    {nextVisitCallTasks.length > 3 && (
                      <p className="mt-2 text-xs text-pastel-cyan/80">
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
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 p-10 text-center text-gray-500 dark:text-gray-400">
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm">
                  No hay visitas programadas. Usa el botón "Nueva visita" para
                  agendar el próximo encuentro con tu red.
                </p>
              </div>
            )}
          </Card>

          <Card
            variant="colored"
            color="indigo"
            className="text-gray-900 dark:text-white"
          >
            <Card.Header>
              <Card.Title>Indicadores de la semana</Card.Title>
              <Card.Description>
                Visitas registradas en el sistema
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visitas planificadas
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {upcoming.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visitas pendientes de resultado
                </p>
                <p className="text-3xl font-bold text-pastel-yellow">
                  {overdue.length +
                    upcoming.filter(
                      (visit: Visit) => visit.result === 'pendiente'
                    ).length}
                </p>
              </div>
              <div className="rounded-3xl bg-white/80 dark:bg-gray-800/80 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Tasa de cierre
                </p>
                <p className="mt-2 text-4xl font-bold text-pastel-green">
                  {completionRate}%
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {completed.length} de {totalVisits || 0} visitas marcadas como
                  completadas.
                </p>
              </div>
            </Card.Content>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entry.label}
                        </span>
                        <span>
                          {entry.count} · {percentage}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className={`visit-bar h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan ${barClass}`}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Todavía no hay visitas registradas.
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
                      className="rounded-2xl border border-pastel-yellow/40 bg-pastel-yellow/10 p-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {participant.name}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-700/70 px-3 py-1 text-xs font-semibold text-pastel-yellow">
                          <ExclamationTriangleIcon className="h-4 w-4" />
                          {formatShortDate(visit.date)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        {visit.objective || 'Sin objetivo registrado'}
                      </p>
                      {visit.nextSteps && (
                        <p className="mt-2 rounded-2xl bg-white/70 dark:bg-gray-700/70 p-3 text-xs text-gray-600 dark:text-gray-400">
                          Próximo paso: {visit.nextSteps}
                        </p>
                      )}
                      {pendingCalls.length > 0 && (
                        <p className="mt-3 text-xs text-pastel-cyan">
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
                <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:bg-gray-700 dark:bg-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircleIcon className="mx-auto h-8 w-8 text-pastel-green" />
                  No hay visitas vencidas. ¡Buen trabajo!
                </div>
              )}
            </Card.Content>
          </Card>

          <Card>
            <Card.Header>
              <Card.Title>Métricas operativas</Card.Title>
              <Card.Description>
                Tiempo y cadencia de las reuniones
              </Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Duración media
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {averageDuration || 0} min
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-pastel-indigo" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Visitas completadas
                  </p>
                  <p className="text-lg font-semibold text-pastel-green">
                    {completed.length}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-pastel-green" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Compromisos pendientes
                  </p>
                  <p className="text-lg font-semibold text-pastel-yellow">
                    {overdue.length}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-pastel-yellow" />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Seguimiento telefónico
                  </p>
                  <p className="text-lg font-semibold text-pastel-cyan">
                    {callCenter?.stats?.urgent ?? 0}
                  </p>
                </div>
                <PhoneIcon className="h-8 w-8 text-pastel-cyan" />
              </div>
            </Card.Content>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card variant="gradient">
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
                      className="space-y-3 rounded-2xl border border-white/40 bg-white/80 dark:bg-gray-800/80 p-4 shadow-sm"
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
                            <p className="text-xs text-pastel-cyan">
                              {pendingCalls.length} tarea
                              {pendingCalls.length > 1 ? 's' : ''} en llamadas
                              pendientes
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-pastel-indigo/10 px-3 py-1 text-xs font-semibold text-pastel-indigo">
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

          <Card variant="gradient">
            <Card.Header>
              <Card.Title>Historial reciente</Card.Title>
              <Card.Description>Últimas reuniones registradas</Card.Description>
            </Card.Header>
            <Card.Content className="space-y-4">
              {history.length ? (
                history.map((visit: Visit) => {
                  const participant = resolveVisitParticipant(visit)
                  return (
                    <div
                      key={visit.id}
                      className="rounded-2xl border border-white/40 bg-white/90 dark:bg-gray-800/90 p-4"
                    >
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
      </div>

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
            onSubmit={handleVisitSubmit}
            onCancel={handleCancelVisit}
          />
        </Modal>
      )}
    </div>
  )
}

export default Visits
