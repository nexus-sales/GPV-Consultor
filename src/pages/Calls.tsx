import React, { useCallback, useMemo, useState } from 'react'
import {
  PhoneIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ContactSelectorModal, {
  type SelectionEvent
} from '../components/ContactSelectorModal'
import { useAppData } from '../lib/useAppData'
import type {
  Distributor,
  Candidate,
  CallCenterTask,
  CallCenterSummary,
  PipelineStageId
} from '../lib/types'

// Interfaces TypeScript
interface ManualContact {
  type: 'distributor' | 'candidate'
  name: string
  location: string
  contactName: string
  phone: string
  email: string
  channel: string
  entity: Distributor | Candidate
}

interface TaskActionsProps {
  task: CallCenterTask
}

// Estilos constantes
const priorityStyles: Record<string, string> = {
  high: 'bg-red-50 text-red-600 border border-red-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
}

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  incidencias: 'Incidencias',
  apertura: 'Apertura',
  otros: 'Visita programada'
}

const getHealthStatus = (entity: unknown) => {
  if (!entity)
    return { label: 'Desconocido', color: 'text-slate-400', bg: 'bg-slate-50' }
  const score =
    typeof entity === 'object' &&
    entity !== null &&
    'priorityScore' in entity &&
    typeof entity.priorityScore === 'number'
      ? entity.priorityScore
      : 50
  if (score > 80)
    return {
      label: 'VIP / Crítico',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      icon: '🔥'
    }
  if (score > 60)
    return {
      label: 'Atención',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: '⚠️'
    }
  return {
    label: 'Estable',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: '✅'
  }
}

const actionBaseClasses =
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition'
const actionPrimaryClasses = `${actionBaseClasses} border border-indigo-200 text-indigo-600 hover:bg-indigo-50`
const actionCyanClasses = `${actionBaseClasses} border border-cyan-200 text-cyan-600 hover:bg-cyan-50`
const actionGreenClasses = `${actionBaseClasses} border border-emerald-200 text-emerald-700 hover:bg-emerald-100 bg-emerald-50`
const actionYellowClasses = `${actionBaseClasses} border border-amber-200 text-amber-700 hover:bg-amber-100 bg-amber-50`
const metaChipClasses =
  'inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-700/70 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300'

const parseIsoDate = (isoDate?: string): Date | null => {
  if (!isoDate) return null
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

const formatShortDate = (isoDate?: string): string => {
  const date = parseIsoDate(isoDate)
  if (!date) return 'Fecha no definida'
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

const Calls: React.FC = () => {
  const navigate = useNavigate()
  const {
    callCenter,
    candidates = [],
    distributors = [],
    moveCandidate,
    updateVisit
  } = useAppData()

  const followUpTasks = callCenter?.tasks
  const stats = callCenter?.stats ?? {
    total: 0,
    urgent: 0,
    contactable: 0,
    missingData: 0,
    nextTask: null
  }

  const orderedDistributors = useMemo(
    (): Distributor[] =>
      [...(distributors || [])].sort((a: Distributor, b: Distributor) =>
        a.name.localeCompare(b.name, 'es')
      ),
    [distributors]
  )

  const orderedCandidates = useMemo(
    (): Candidate[] =>
      [...(candidates || [])].sort((a: Candidate, b: Candidate) =>
        a.name.localeCompare(b.name, 'es')
      ),
    [candidates]
  )

  const selectorInitialTab = orderedCandidates.length
    ? 'candidates'
    : 'distributors'
  const hasManualContacts =
    orderedDistributors.length > 0 || orderedCandidates.length > 0

  const [selectorOpen, setSelectorOpen] = useState<boolean>(false)
  const [manualContact, setManualContact] = useState<ManualContact | null>(null)

  const handleOpenSelector = useCallback(() => {
    if (!hasManualContacts) return
    setSelectorOpen(true)
  }, [hasManualContacts])

  const handleCloseSelector = useCallback(() => {
    setSelectorOpen(false)
  }, [])

  const handleSelectContact = useCallback(
    (selection: SelectionEvent | null) => {
      if (!selection) return

      const { type, entity } = selection
      if (!entity) return

      const base: ManualContact =
        type === 'distributor'
          ? {
              type,
              name: (entity as Distributor).name || 'Distributor sin nombre',
              location:
                [(entity as Distributor).city, (entity as Distributor).province]
                  .filter(Boolean)
                  .join(', ') || 'Ubicación pendiente',
              contactName: (entity as Distributor).contactPerson || '',
              phone: (entity as Distributor).phone || '',
              email: (entity as Distributor).email || '',
              channel: (entity as Distributor).channelType || '',
              entity
            }
          : {
              type: 'candidate',
              name: (entity as Candidate).name || 'Candidato sin nombre',
              location:
                [(entity as Candidate).city, (entity as Candidate).island]
                  .filter(Boolean)
                  .join(', ') || 'Ubicación pendiente',
              contactName: (entity as Candidate).contact?.name || '',
              phone: (entity as Candidate).contact?.phone || '',
              email: (entity as Candidate).contact?.email || '',
              channel: (entity as Candidate).channelCode || '',
              entity
            }

      setManualContact(base)
      setSelectorOpen(false)
    },
    []
  )

  const handleClearManualContact = useCallback(() => {
    setManualContact(null)
  }, [])

  const followUpQueues = useMemo(
    () => [
      {
        id: 'first-contact',
        title: 'Primer contacto',
        description:
          'Presenta la propuesta comercial a nuevos puntos de venta potenciales.',
        icon: SparklesIcon,
        color: 'text-indigo-600',
        tasks: followUpTasks?.firstContact ?? []
      },
      {
        id: 'follow-up',
        title: 'Documentación pendiente',
        description:
          'Solicita contratos, CIF y datos fiscales para completar el alta.',
        icon: ClipboardDocumentListIcon,
        color: 'text-cyan-600',
        tasks: followUpTasks?.followUp ?? []
      },
      {
        id: 'activation',
        title: 'Activación puntos de venta',
        description:
          'Confirma hitos comerciales antes de habilitar la venta en tienda.',
        icon: BuildingOfficeIcon,
        color: 'text-emerald-600',
        tasks: followUpTasks?.activation ?? []
      },
      {
        id: 'post-visit',
        title: 'Post visita',
        description:
          'Cierra acciones acordadas tras visitas a los puntos de venta.',
        icon: CalendarIcon,
        color: 'text-amber-600',
        tasks: followUpTasks?.postVisit ?? []
      }
    ],
    [followUpTasks]
  )

  const candidatesById = useMemo(() => {
    const map = new Map<string, Candidate>()
    ;(candidates || []).forEach((candidate: Candidate) =>
      map.set(String(candidate.id), candidate)
    )
    return map
  }, [candidates])

  const helpers = useMemo(() => callCenter?.helpers, [callCenter])

  const handleAdvanceCandidate = useCallback(
    (candidateId: string) => {
      const candidate = candidatesById.get(candidateId)
      if (!candidate) return
      const nextStage = helpers?.nextCandidateStage?.(candidate.stage)
      if (nextStage && nextStage !== candidate.stage) {
        moveCandidate(candidate.id, nextStage)
      }
    },
    [candidatesById, helpers, moveCandidate]
  )

  const handleOpenPipeline = useCallback(() => {
    navigate('/pipeline')
  }, [navigate])

  const handleOpenDistributor = useCallback(
    (distributorId: string | null) => {
      if (!distributorId) return
      navigate(`/distributors/${distributorId}`)
    },
    [navigate]
  )

  const handleCompleteVisit = useCallback(
    (visitId: string) => {
      if (!visitId) return
      updateVisit?.(visitId, { result: 'completada' })
    },
    [updateVisit]
  )

  const handleReprogramVisit = useCallback(
    (visitId: string) => {
      if (!visitId) return
      updateVisit?.(visitId, { result: 'reprogramar' })
    },
    [updateVisit]
  )

  const resolveMeta = (task: CallCenterTask): string => {
    if (!task?.meta) return ''
    if (task.taskType === 'post-visit') {
      return visitTypeLabels[task.meta] ?? visitTypeLabels.otros
    }
    return task.meta
  }

  const nextTask = stats.nextTask ?? null

  const TaskActions: React.FC<TaskActionsProps> = ({ task }) => {
    if (!task) return null

    const hasCandidateActions = task.refType === 'candidate'
    const hasDistributorActions =
      task.refType === 'distributor' && task.distributorId
    const hasVisitActions = task.refType === 'visit'

    if (!hasCandidateActions && !hasDistributorActions && !hasVisitActions) {
      return null
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
        {hasCandidateActions && (
          <>
            <button
              type="button"
              className={actionPrimaryClasses}
              onClick={() => handleAdvanceCandidate(String(task.refId))}
            >
              <ArrowRightIcon className="h-4 w-4" />
              Avanzar etapa
            </button>
            <button
              type="button"
              className={actionCyanClasses}
              onClick={handleOpenPipeline}
            >
              <ChartBarIcon className="h-4 w-4" />
              Ver pipeline
            </button>
          </>
        )}

        {hasDistributorActions && (
          <button
            type="button"
            className={actionCyanClasses}
            onClick={() => handleOpenDistributor(String(task.distributorId))}
          >
            <BuildingOfficeIcon className="h-4 w-4" />
            Abrir ficha
          </button>
        )}

        {hasVisitActions && (
          <>
            <button
              type="button"
              className={actionGreenClasses}
              onClick={() => handleCompleteVisit(String(task.refId))}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Completar
            </button>
            <button
              type="button"
              className={actionYellowClasses}
              onClick={() => handleReprogramVisit(String(task.refId))}
            >
              <ExclamationTriangleIcon className="h-4 w-4" />
              Reprogramar
            </button>
            <button
              type="button"
              className={actionPrimaryClasses}
              onClick={() => navigate('/visits')}
            >
              <CalendarIcon className="h-4 w-4" />
              Agenda
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageContainer className="py-10 space-y-8">
        <header className="relative overflow-hidden rounded-[32px] bg-white dark:bg-gray-800 p-8 shadow-sm border border-slate-100 dark:border-slate-700/50">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-50/50 dark:bg-cyan-500/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-indigo-50/50 dark:bg-indigo-500/5 blur-3xl"></div>

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20">
                <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Seguimiento comercial Inteligente
              </div>
              <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                Acciones con{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">
                  Puntos de Venta
                </span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Coordina contactos, visitas y documentación de cada punto de
                venta. Revisa prioridades y mantén vivo el pipeline comercial
                con asistencia proactiva.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleOpenSelector}
                disabled={!hasManualContacts}
                className="group inline-flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-white px-8 py-4 text-sm font-bold text-white dark:text-slate-900 shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <PhoneIcon className="h-5 w-5 transition-transform group-hover:rotate-12" />
                Contactar ahora
              </button>
              <button
                onClick={() => navigate('/visits')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <CalendarIcon className="h-5 w-5" />
                Revisar agenda
              </button>
            </div>
          </div>
        </header>

        {!hasManualContacts && (
          <Card variant="default">
            <Card.Content className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
              <span>
                No hay candidatos ni distribuidores con datos de contacto
                disponibles. Registra nuevos perfiles desde sus módulos
                correspondientes para habilitar las acciones manuales.
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={SparklesIcon}
                  onClick={() => navigate('/candidates')}
                >
                  Ir a candidatos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={BuildingOfficeIcon}
                  onClick={() => navigate('/distributors')}
                >
                  Ir a distribuidores
                </Button>
              </div>
            </Card.Content>
          </Card>
        )}

        {manualContact && (
          <Card variant="default">
            <Card.Header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Card.Title>Contacto directo</Card.Title>
                <Card.Description>
                  {manualContact.type === 'candidate'
                    ? 'Contacto seleccionado desde el listado de candidatos.'
                    : 'Contacto seleccionado desde la red de distribuidores.'}
                </Card.Description>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {manualContact.phone ? (
                  <a
                    href={`tel:${manualContact.phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Contactar por teléfono
                  </a>
                ) : (
                  <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    Sin teléfono registrado
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearManualContact}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 transition hover:border-red-200 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:text-red-300"
                >
                  Limpiar selección
                </button>
              </div>
            </Card.Header>
            <Card.Content>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Nombre
                  </p>
                  <p className="font-semibold text-gray-900">
                    {manualContact.name}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Contacto
                  </p>
                  <p className="font-semibold text-gray-900">
                    {manualContact.contactName || 'No registrado'}
                  </p>
                </div>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Ubicación
                  </p>
                  <p className="font-semibold text-gray-900">
                    {manualContact.location}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <PhoneIcon className="h-4 w-4 text-cyan-600" />
                  {manualContact.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 text-cyan-600" />
                  {manualContact.email || 'Sin email'}
                </div>
                {manualContact.channel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-indigo-600" />
                    {manualContact.channel}
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Tareas totales',
              value: stats.total,
              desc: 'En seguimiento',
              icon: ClipboardDocumentListIcon,
              color: 'indigo'
            },
            {
              label: 'Urgentes',
              value: stats.urgent,
              desc: 'Vencidas / Alta prioridad',
              icon: ExclamationTriangleIcon,
              color: 'rose'
            },
            {
              label: 'Contactables',
              value: stats.contactable,
              desc: 'Listos para llamar',
              icon: CheckCircleIcon,
              color: 'emerald'
            },
            {
              label: 'Faltan datos',
              value: stats.missingData,
              desc: 'Pendientes de registro',
              icon: UserIcon,
              color: 'amber'
            }
          ].map((kpi, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-[24px] bg-white dark:bg-gray-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-md hover:-translate-y-1"
            >
              <div className="relative flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="relative">
                <p className="text-3xl font-black text-slate-800 dark:text-white leading-tight">
                  {kpi.value}
                </p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {kpi.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{kpi.desc}</p>
              </div>
            </div>
          ))}
        </section>

        <section>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 dark:bg-gray-800 p-8 shadow-2xl">
            <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px]"></div>

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-cyan-300 border border-white/10 mb-4">
                    Próxima acción IA Sugerida
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Recomendación prioritaria
                  </h2>
                  <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
                    Basado en la fecha del último contacto y el estado de la
                    documentación, este punto requiere intervención inmediata.
                  </p>
                </div>

                {nextTask ? (
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white text-2xl font-black shadow-inner">
                      {nextTask.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {nextTask.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <MapPinIcon className="h-4 w-4 text-cyan-500" />
                          {nextTask.location || 'Ubicación no registrada'}
                        </span>
                        <div
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${priorityStyles[nextTask.priority]}`}
                        >
                          Prioridad {nextTask.priority}
                        </div>
                        {getHealthStatus(nextTask).label && (
                          <div
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getHealthStatus(nextTask).bg} ${getHealthStatus(nextTask).color}`}
                          >
                            {getHealthStatus(nextTask).icon}{' '}
                            {getHealthStatus(nextTask).label}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-slate-400">
                    <CheckCircleIcon className="h-10 w-10 text-emerald-500 opacity-50" />
                    <p className="text-sm">
                      ¡Buen trabajo! No hay tareas pendientes en este momento.
                    </p>
                  </div>
                )}
              </div>

              {nextTask && (
                <div className="flex flex-col gap-4 min-w-[280px]">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span>Contacto directo</span>
                      {nextTask.isOverdue && (
                        <span className="text-rose-400">Vencido</span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-200">
                        <UserIcon className="h-4 w-4 text-cyan-500" />
                        <span className="text-sm font-semibold">
                          {nextTask.contact || 'Titular'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-200">
                        <PhoneIcon className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-bold tracking-wide">
                          {nextTask.phone || 'Sin teléfono'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {nextTask.phone ? (
                        <a
                          href={`tel:${nextTask.phone}`}
                          className="flex items-center justify-center gap-2 w-full rounded-xl bg-cyan-500 py-3 text-sm font-black text-white shadow-lg transition hover:bg-cyan-600 active:scale-95"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          HABLAR AHORA
                        </a>
                      ) : (
                        <button className="w-full rounded-xl bg-slate-700 py-3 text-xs font-bold text-slate-400 cursor-not-allowed">
                          TELÉFONO PENDIENTE
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleAdvanceCandidate(String(nextTask.refId))
                      }
                      className="flex-1 rounded-xl bg-indigo-500/20 border border-indigo-500/30 py-3 text-[10px] font-black text-indigo-300 uppercase tracking-widest hover:bg-indigo-500/30 transition-colors"
                    >
                      Avanzar etapa
                    </button>
                    <button
                      onClick={handleOpenPipeline}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      Ver Ficha
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {followUpQueues.map((queue) => (
            <Card
              key={queue.id}
              variant="default"
              className="flex h-full flex-col"
            >
              <Card.Header className="space-y-1">
                <div className="flex items-center gap-2">
                  <queue.icon className={`h-5 w-5 ${queue.color}`} />
                  <Card.Title>{queue.title}</Card.Title>
                </div>
                <Card.Description>{queue.description}</Card.Description>
              </Card.Header>
              <Card.Content className="flex-1 space-y-4">
                {queue.tasks.length ? (
                  queue.tasks.map((task: CallCenterTask) => {
                    const meta = resolveMeta(task)
                    return (
                      <div
                        key={task.id}
                        className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {task.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {task.context}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                priorityStyles[task.priority] ||
                                priorityStyles.medium
                              }`}
                            >
                              {task.priority === 'high'
                                ? 'Alta'
                                : task.priority === 'medium'
                                  ? 'Media'
                                  : 'Baja'}
                            </span>
                            {meta && (
                              <span className={metaChipClasses}>{meta}</span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4" />
                            {task.contact || 'Sin contacto asignado'}
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4" />
                            {task.phone ? (
                              <a
                                href={`tel:${task.phone}`}
                                className="text-cyan-600 hover:underline dark:text-cyan-300"
                              >
                                {task.phone}
                              </a>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-300">
                                Añadir teléfono
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4" />
                            {task.email || 'Sin email registrado'}
                          </div>
                          {task.location && (
                            <div className="flex items-center gap-2">
                              <MapPinIcon className="h-4 w-4" />
                              {task.location}
                            </div>
                          )}
                          {task.dueDate && (
                            <div
                              className={`flex items-center gap-2 ${task.isOverdue ? 'text-red-600 dark:text-red-300' : ''}`}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {formatShortDate(task.dueDate)}
                            </div>
                          )}
                        </div>

                        {task.note && (
                          <p className="rounded-lg bg-gray-50 dark:bg-gray-800/70 p-3 text-xs text-gray-600 dark:text-gray-400">
                            {task.note}
                          </p>
                        )}

                        <TaskActions task={task} />
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                    Sin tareas en esta bandeja.
                  </div>
                )}
              </Card.Content>
            </Card>
          ))}
        </section>

        {selectorOpen && (
          <ContactSelectorModal
            key={`manual-selector-${selectorInitialTab}`}
            onClose={handleCloseSelector}
            onSelect={handleSelectContact}
            distributors={orderedDistributors}
            candidates={orderedCandidates}
            title="Seleccionar contacto para seguimiento"
            initialTab={selectorInitialTab}
          />
        )}
      </PageContainer>
    </div>
  )
}

export default Calls
