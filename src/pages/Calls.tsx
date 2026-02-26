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
  high: 'bg-pastel-red/15 text-pastel-red border border-pastel-red/30',
  medium:
    'bg-pastel-yellow/20 text-pastel-yellow border border-pastel-yellow/30',
  low: 'bg-pastel-green/15 text-pastel-green border border-pastel-green/30'
}

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  incidencias: 'Incidencias',
  apertura: 'Apertura',
  otros: 'Visita programada'
}

const actionBaseClasses =
  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition'
const actionPrimaryClasses = `${actionBaseClasses} border border-pastel-indigo/40 text-pastel-indigo hover:bg-pastel-indigo/10`
const actionCyanClasses = `${actionBaseClasses} border border-pastel-cyan/40 text-pastel-cyan hover:bg-pastel-cyan/10`
const actionGreenClasses = `${actionBaseClasses} border border-pastel-green/40 text-pastel-green hover:bg-pastel-green/20 bg-pastel-green/10`
const actionYellowClasses = `${actionBaseClasses} border border-pastel-yellow/40 text-pastel-yellow hover:bg-pastel-yellow/20 bg-pastel-yellow/10`
const metaChipClasses =
  'inline-flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-700/70 px-3 py-1 text-xs font-semibold text-pastel-cyan'

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
        color: 'text-pastel-indigo',
        tasks: followUpTasks?.firstContact ?? []
      },
      {
        id: 'follow-up',
        title: 'Documentación pendiente',
        description:
          'Solicita contratos, CIF y datos fiscales para completar el alta.',
        icon: ClipboardDocumentListIcon,
        color: 'text-pastel-cyan',
        tasks: followUpTasks?.followUp ?? []
      },
      {
        id: 'activation',
        title: 'Activación puntos de venta',
        description:
          'Confirma hitos comerciales antes de habilitar la venta en tienda.',
        icon: BuildingOfficeIcon,
        color: 'text-pastel-green',
        tasks: followUpTasks?.activation ?? []
      },
      {
        id: 'post-visit',
        title: 'Post visita',
        description:
          'Cierra acciones acordadas tras visitas a los puntos de venta.',
        icon: CalendarIcon,
        color: 'text-pastel-yellow',
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-cyan/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-pastel-cyan">
              Seguimiento comercial POS
            </p>
            <h1 className="text-4xl font-bold text-gray-900">
              Acciones con puntos de venta
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
              Coordina contactos, visitas y documentación de cada punto de
              venta. Revisa prioridades y mantén vivo el pipeline comercial sin
              necesidad de un call center dedicado.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              icon={PhoneIcon}
              onClick={handleOpenSelector}
              disabled={!hasManualContacts}
            >
              Contactar ahora
            </Button>
            <Button
              variant="outline"
              icon={CalendarIcon}
              onClick={() => navigate('/visits')}
            >
              Revisar agenda de visitas
            </Button>
          </div>
        </header>

        {!hasManualContacts && (
          <Card variant="glass">
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
          <Card variant="glass">
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
                    className="inline-flex items-center gap-2 rounded-full bg-pastel-cyan px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pastel-cyan/90"
                  >
                    <PhoneIcon className="h-4 w-4" />
                    Contactar por teléfono
                  </a>
                ) : (
                  <span className="rounded-full bg-pastel-yellow/10 px-4 py-2 text-xs font-semibold text-pastel-yellow">
                    Sin teléfono registrado
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleClearManualContact}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-600 px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 transition hover:border-pastel-red/40 hover:text-pastel-red"
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
                  <PhoneIcon className="h-4 w-4 text-pastel-cyan" />
                  {manualContact.phone || 'Sin teléfono'}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4 text-pastel-cyan" />
                  {manualContact.email || 'Sin email'}
                </div>
                {manualContact.channel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-pastel-indigo" />
                    {manualContact.channel}
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card variant="glass">
            <Card.Header>
              <Card.Title>Tareas totales</Card.Title>
              <Card.Description>
                Contactos en seguimiento comercial
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
            </Card.Content>
          </Card>

          <Card variant="glass">
            <Card.Header>
              <Card.Title>Urgentes</Card.Title>
              <Card.Description>
                Acciones de alta prioridad o vencidas
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-4xl font-bold text-pastel-red">
                {stats.urgent}
              </p>
            </Card.Content>
          </Card>

          <Card variant="glass">
            <Card.Header>
              <Card.Title>Contactos completos</Card.Title>
              <Card.Description>
                Listos para contacto telefónico
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-4xl font-bold text-pastel-green">
                {stats.contactable}
              </p>
            </Card.Content>
          </Card>

          <Card variant="glass">
            <Card.Header>
              <Card.Title>Faltan datos</Card.Title>
              <Card.Description>
                Registra teléfono o correo pendiente
              </Card.Description>
            </Card.Header>
            <Card.Content>
              <p className="text-4xl font-bold text-pastel-yellow">
                {stats.missingData}
              </p>
            </Card.Content>
          </Card>
        </section>

        <section>
          <Card variant="colored" color="cyan">
            <Card.Header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Card.Title>Próxima acción recomendada</Card.Title>
                <Card.Description>
                  {nextTask
                    ? 'Revisa los datos clave antes de coordinar el siguiente paso con el punto de venta.'
                    : 'No hay tareas pendientes con información de contacto disponible.'}
                </Card.Description>
              </div>
              {nextTask && nextTask.phone && (
                <a
                  href={`tel:${nextTask.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-gray-800/80 px-4 py-2 text-sm font-semibold text-pastel-cyan shadow-sm transition hover:bg-white dark:bg-gray-800"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Contactar por teléfono
                </a>
              )}
            </Card.Header>
            {nextTask ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Nombre
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {nextTask.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {nextTask.context}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                        priorityStyles[nextTask.priority] ||
                        priorityStyles.medium
                      }`}
                    >
                      Prioridad{' '}
                      {nextTask.priority === 'high'
                        ? 'alta'
                        : nextTask.priority === 'medium'
                          ? 'media'
                          : 'baja'}
                    </span>
                    {resolveMeta(nextTask) && (
                      <span className={metaChipClasses}>
                        {resolveMeta(nextTask)}
                      </span>
                    )}
                  </div>
                  {nextTask.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPinIcon className="h-4 w-4" />
                      {nextTask.location}
                    </div>
                  )}
                </div>
                <div className="space-y-3 rounded-3xl bg-white/70 dark:bg-gray-700/70 p-6 shadow-inner text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    {nextTask.contact || 'Contacto no asignado'}
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4" />
                    {nextTask.phone || 'Sin teléfono registrado'}
                  </div>
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4" />
                    {nextTask.email || 'Sin email'}
                  </div>
                  {nextTask.dueDate && (
                    <div
                      className={`flex items-center gap-2 ${nextTask.isOverdue ? 'text-pastel-red' : ''}`}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {formatShortDate(nextTask.dueDate)}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {nextTask.note}
                  </p>
                  <TaskActions task={nextTask} />
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 p-10 text-center text-gray-500 dark:text-gray-400">
                <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 text-sm">
                  Registra un teléfono o correo de los puntos de venta para
                  activar acciones de contacto directo.
                </p>
              </div>
            )}
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          {followUpQueues.map((queue) => (
            <Card
              key={queue.id}
              variant="glass"
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
                        className="space-y-3 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 p-4 shadow-sm"
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
                                className="text-pastel-cyan hover:underline"
                              >
                                {task.phone}
                              </a>
                            ) : (
                              <span className="text-pastel-yellow">
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
                              className={`flex items-center gap-2 ${task.isOverdue ? 'text-pastel-red' : ''}`}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              {formatShortDate(task.dueDate)}
                            </div>
                          )}
                        </div>

                        {task.note && (
                          <p className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-3 text-xs text-gray-600 dark:text-gray-400">
                            {task.note}
                          </p>
                        )}

                        <TaskActions task={task} />
                      </div>
                    )
                  })
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/60 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircleIcon className="h-6 w-6 text-pastel-green" />
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
      </div>
    </div>
  )
}

export default Calls
