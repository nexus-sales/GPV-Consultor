import React, { useMemo, useState } from 'react'
import {
  PlusIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../lib/useAppData'
import CandidateForm from '../components/CandidateForm'
import Modal from '../components/ui/Modal'
import type {
  Candidate,
  PipelineStage,
  CallCenterTask,
  NewCandidate,
  AppContextType,
  PipelineStageId,
  EntityId
} from '../lib/types'

interface Column extends PipelineStage {
  items: Candidate[]
}

interface ActionPillProps {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'ghost'
  onClick?: () => void
}

interface CandidateCardProps {
  candidate: Candidate
  pipelineStages: PipelineStage[]
  onMove: (id: EntityId, stageId: PipelineStageId) => void
  onReject: (id: EntityId) => void
  onReactivate: (id: EntityId) => void
  onRemove: (id: EntityId) => void
  formatters: AppContextType['formatters']
  callTasksByCandidate: Record<EntityId, CallCenterTask[]>
  onOpenCalls: () => void
}

interface SortableCandidateCardProps extends CandidateCardProps {
  isGhost: boolean
}

interface CandidateColumnProps {
  column: Column
  pipelineStages: PipelineStage[]
  onMove: (id: EntityId, stageId: PipelineStageId) => void
  onReject: (id: EntityId) => void
  onReactivate: (id: EntityId) => void
  onRemove: (id: EntityId) => void
  formatters: AppContextType['formatters']
  activeId: UniqueIdentifier | null
  callTasksByCandidate: Record<EntityId, CallCenterTask[]>
  onOpenCalls: () => void
}

const Kanban: React.FC = () => {
  const {
    pipelineStages,
    candidates,
    addCandidate,
    moveCandidate,
    removeCandidate,
    reorderCandidate,
    formatters,
    callCenter
  } = useAppData()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState<boolean>(false)
  const [activeCandidateId, setActiveCandidateId] =
    useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 10
      }
    })
  )

  const columns: Column[] = useMemo(
    () =>
      (pipelineStages || []).map((stage) => ({
        ...stage,
        items: (candidates || [])
          .filter((candidate) => candidate.stage === stage.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      })),
    [candidates, pipelineStages]
  )

  const callTasksByCandidate = useMemo(
    () => callCenter?.lookup?.byCandidate ?? {},
    [callCenter]
  )

  const handleOpenCalls = () => navigate('/calls')

  const totalActive = useMemo(
    () =>
      (candidates || []).filter((candidate) => candidate.stage !== 'rejected')
        .length,
    [candidates]
  )

  const handleCreateCandidate = (payload: NewCandidate) => {
    addCandidate(payload)
    setShowModal(false)
  }

  const handleMove = (id: EntityId, stageId: PipelineStageId) => {
    moveCandidate(id, stageId)
  }

  const handleReject = (id: EntityId) => {
    moveCandidate(id, 'rejected')
  }

  const handleReactivate = (id: EntityId) => {
    moveCandidate(id, 'new')
  }

  const handleRemove = (id: EntityId) => {
    removeCandidate(id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCandidateId(event.active.id)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveCandidateId(null)
    if (!over) return

    const activeId = active.id
    const activeContainer = active.data?.current?.sortable?.containerId
    const activeIndex = active.data?.current?.sortable?.index ?? 0

    const isOverColumn = over.data?.current?.type === 'column'
    const destinationStage = isOverColumn
      ? over.id
      : over.data?.current?.sortable?.containerId

    if (!destinationStage) return

    let destinationIndex: number

    if (isOverColumn) {
      const column = columns.find((item) => item.id === destinationStage)
      destinationIndex = column ? column.items.length : 0
    } else {
      destinationIndex = over.data?.current?.sortable?.index ?? 0
      if (
        destinationStage === activeContainer &&
        destinationIndex > activeIndex
      ) {
        destinationIndex -= 1
      }
    }

    if (
      destinationStage === activeContainer &&
      destinationIndex === activeIndex
    ) {
      return
    }

    if (reorderCandidate) {
      reorderCandidate(
        activeId,
        destinationStage as PipelineStageId,
        destinationIndex
      )
    }
  }

  const handleDragCancel = () => {
    setActiveCandidateId(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
              Pipeline comercial
            </p>
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white lg:text-6xl">
              Pipeline <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Comercial</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Gestiona el flujo completo de alta de nuevos distribuidores y
              acompaña cada etapa del onboarding con precisión quirúrgica.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 text-sm font-semibold text-pastel-indigo shadow-sm">
              {totalActive} activos en pipeline
            </span>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-indigo"
            >
              <PlusIcon className="h-4 w-4" />
              Nuevo candidato
            </button>
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <section className="grid grid-cols-1 gap-6 overflow-x-auto lg:grid-cols-5">
            {columns.map((column) => (
              <CandidateColumn
                key={column.id}
                column={column}
                pipelineStages={pipelineStages}
                onMove={handleMove}
                onReject={handleReject}
                onReactivate={handleReactivate}
                onRemove={handleRemove}
                formatters={formatters}
                activeId={activeCandidateId}
                callTasksByCandidate={callTasksByCandidate}
                onOpenCalls={handleOpenCalls}
              />
            ))}
          </section>
        </DndContext>
      </div>

      {showModal && (
        <Modal title="Registrar candidato" onClose={() => setShowModal(false)}>
          <CandidateForm
            onSubmit={handleCreateCandidate}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}

const CandidateColumn: React.FC<CandidateColumnProps> = ({
  column,
  pipelineStages,
  onMove,
  onReject,
  onReactivate,
  onRemove,
  formatters,
  activeId,
  callTasksByCandidate,
  onOpenCalls
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column'
    }
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[500px] flex-col gap-5 rounded-[2.5rem] border border-white/40 dark:border-gray-700/40 bg-white/60 dark:bg-gray-800/40 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 ${column.tone ?? ''
        } ${isOver ? 'ring-4 ring-indigo-500/20 scale-[1.01]' : ''}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {column.label}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {column.description}
          </p>
        </div>
        <span
          className={`flex h-8 min-w-[48px] items-center justify-center rounded-2xl px-2 text-sm font-semibold ${column.badge ??
            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
        >
          {column.items.length}
        </span>
      </header>

      <SortableContext
        id={column.id as string}
        items={column.items.map((candidate) => candidate.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-4">
          {column.items.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {column.empty}
            </div>
          ) : (
            column.items.map((candidate) => (
              <SortableCandidateCard
                key={candidate.id}
                candidate={candidate}
                pipelineStages={pipelineStages}
                onMove={onMove}
                onReject={onReject}
                onReactivate={onReactivate}
                onRemove={onRemove}
                formatters={formatters}
                isGhost={activeId === candidate.id}
                callTasksByCandidate={callTasksByCandidate}
                onOpenCalls={onOpenCalls}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

const SortableCandidateCard: React.FC<SortableCandidateCardProps> = ({
  candidate,
  pipelineStages,
  onMove,
  onReject,
  onReactivate,
  onRemove,
  formatters,
  // ...existing code...
  callTasksByCandidate,
  onOpenCalls
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: candidate.id,
    data: {
      type: 'card',
      stage: candidate.stage
    }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  // El estilo inline se aplica directamente en el div, no es necesario declarar la variable si no se usa.

  return (
    // Estilo inline requerido por @dnd-kit/core para drag & drop. No mover a CSS externo.
    // Documentado en docs/CSS_INLINE_STYLES.md
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-draggable ${isDragging ? 'grabbing' : 'grab'}`}
      {...attributes}
      {...listeners}
    >
      <CandidateCard
        candidate={candidate}
        pipelineStages={pipelineStages}
        onMove={onMove}
        onReject={onReject}
        onReactivate={onReactivate}
        onRemove={onRemove}
        formatters={formatters}
        callTasksByCandidate={callTasksByCandidate}
        onOpenCalls={onOpenCalls}
      />
    </div>
  )
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  pipelineStages,
  onMove,
  onReject,
  onReactivate,
  onRemove,
  formatters,
  callTasksByCandidate,
  onOpenCalls
}) => {
  const progressionStages = (pipelineStages || []).filter(
    (stage) => stage.id !== 'rejected'
  )
  const stageIndex = progressionStages.findIndex(
    (stage) => stage.id === candidate.stage
  )
  const previousStage =
    stageIndex > 0 ? progressionStages[stageIndex - 1] : null
  const nextStage =
    stageIndex >= 0 && stageIndex < progressionStages.length - 1
      ? progressionStages[stageIndex + 1]
      : null
  const isRejected = candidate.stage === 'rejected'
  const isApproved = candidate.stage === 'approved'
  const updatedLabel = candidate.updatedAt
    ? formatters?.relative?.(candidate.updatedAt)
    : 'Sin actualizaciones'

  const categoryMeta = candidate.category
  const categoryLabel =
    typeof categoryMeta === 'string' ? categoryMeta : categoryMeta?.label
  const categoryBadgeClass =
    typeof categoryMeta === 'object' && categoryMeta?.badgeClass
      ? categoryMeta.badgeClass
      : 'border border-pastel-indigo/40 bg-pastel-indigo/10 text-pastel-indigo'
  const categoryTooltip =
    typeof categoryMeta === 'object' ? categoryMeta?.tooltip : undefined

  const missingFields: string[] = []
  if (!candidate.contact?.phone) missingFields.push('Teléfono')
  if (!candidate.contact?.email) missingFields.push('Email')
  if (!candidate.city) missingFields.push('Localidad')
  if (candidate.pendingData) missingFields.push('Checklist de datos')

  const callTasks = callTasksByCandidate?.[candidate.id] ?? []
  const urgentCallTasks = callTasks.filter(
    (task) => task.priority === 'high' || task.isOverdue
  )
  const hasCallTasks = callTasks.length > 0

  return (
    <article className="group relative space-y-4 rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {candidate.name}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <MapPinIcon className="h-4 w-4" />
            {[candidate.city, candidate.island].filter(Boolean).join(', ') ||
              'Ubicación pendiente'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-300">
            {candidate.channelCode || 'SIN COD.'}
          </span>
          {categoryLabel && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryBadgeClass}`}
              title={categoryTooltip}
            >
              <InformationCircleIcon className="h-3.5 w-3.5" />
              {categoryLabel}
            </span>
          )}
          {hasCallTasks && (
            <button
              type="button"
              onClick={onOpenCalls}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${urgentCallTasks.length
                ? 'border-pastel-red/40 bg-pastel-red/15 text-pastel-red hover:bg-pastel-red/25'
                : 'border-pastel-cyan/40 bg-pastel-cyan/15 text-pastel-cyan hover:bg-pastel-cyan/25'
                }`}
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {urgentCallTasks.length
                ? `${urgentCallTasks.length} urgentes`
                : `${callTasks.length} llamadas`}
            </button>
          )}
        </div>
      </header>

      <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4" />
          Actualizado:{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {updatedLabel}
          </span>
        </div>
        {candidate.contact?.name && (
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            {candidate.contact.name}
          </div>
        )}
        <div className="flex items-center gap-2">
          <PhoneIcon className="h-4 w-4" />
          {candidate.contact?.phone || (
            <span className="italic text-gray-400">Teléfono pendiente</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="h-4 w-4" />
          {candidate.contact?.email || (
            <span className="italic text-gray-400">Email pendiente</span>
          )}
        </div>
        {candidate.notes && (
          <p className="rounded-2xl bg-gray-50 dark:bg-gray-700 p-3 text-gray-600 dark:text-gray-400">
            {candidate.notes}
          </p>
        )}
      </div>

      {missingFields.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-50/70 p-3 text-[11px] text-amber-700">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <p className="font-semibold">Datos pendientes</p>
            <p className="text-amber-700/90">{missingFields.join(' · ')}</p>
          </div>
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2">
        {previousStage && !isRejected && (
          <ActionPill onClick={() => onMove(candidate.id, previousStage.id)}>
            <ArrowLeftIcon className="h-4 w-4" />
            {previousStage.label}
          </ActionPill>
        )}

        {nextStage && !isRejected && (
          <ActionPill
            variant="primary"
            onClick={() => onMove(candidate.id, nextStage.id)}
          >
            <ArrowRightIcon className="h-4 w-4" />
            {nextStage.label}
          </ActionPill>
        )}

        {!nextStage && !isRejected && !isApproved && (
          <ActionPill
            variant="success"
            onClick={() => onMove(candidate.id, 'approved')}
          >
            <CheckCircleIcon className="h-4 w-4" />
            Activar
          </ActionPill>
        )}

        {!isRejected ? (
          <ActionPill variant="danger" onClick={() => onReject(candidate.id)}>
            <XMarkIcon className="h-4 w-4" />
            Descartar
          </ActionPill>
        ) : (
          <>
            <ActionPill
              variant="primary"
              onClick={() => onReactivate(candidate.id)}
            >
              <ArrowRightIcon className="h-4 w-4" />
              Reabrir
            </ActionPill>
            <ActionPill variant="ghost" onClick={() => onRemove(candidate.id)}>
              Eliminar
            </ActionPill>
          </>
        )}
      </footer>
    </article>
  )
}

const ActionPill: React.FC<ActionPillProps> = ({
  children,
  variant = 'default',
  onClick
}) => {
  const variants = {
    default:
      'border border-gray-200 dark:border-gray-600 bg-white text-gray-600 dark:text-gray-400 hover:border-pastel-indigo/30 hover:text-pastel-indigo',
    primary: 'bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20',
    success: 'bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20',
    danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20',
    ghost:
      'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-pastel-red/40 hover:text-pastel-red'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${variants[variant] ?? variants.default
        }`}
    >
      {children}
    </button>
  )
}

export default Kanban
