import React, { useMemo, useState } from 'react'
import {
  PlusIcon,
  EllipsisHorizontalIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
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
  UniqueIdentifier,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation
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

// --- Types ---

interface Column extends PipelineStage {
  items: Candidate[]
}

interface CandidateCardProps {
  candidate: Candidate
  pipelineStages: PipelineStage[]
  onMove: (id: EntityId, stageId: PipelineStageId) => void
  onRemove: (id: EntityId) => void
  formatters: AppContextType['formatters']
  callTasksByCandidate: Record<EntityId, CallCenterTask[]>
  onOpenCalls: () => void
  isOverlay?: boolean
}

interface SortableCandidateCardProps extends CandidateCardProps {
  isGhost: boolean
}

interface CandidateColumnProps {
  column: Column
  pipelineStages: PipelineStage[]
  onMove: (id: EntityId, stageId: PipelineStageId) => void
  onRemove: (id: EntityId) => void
  formatters: AppContextType['formatters']
  activeId: UniqueIdentifier | null
  callTasksByCandidate: Record<EntityId, CallCenterTask[]>
  onOpenCalls: () => void
}

// --- Main Component ---

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
  const [activeCandidateId, setActiveCandidateId] = useState<UniqueIdentifier | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // Start dragging after 5px movement
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
    () => (candidates || []).filter((candidate) => candidate.stage !== 'rejected').length,
    [candidates]
  )

  const handleCreateCandidate = (payload: NewCandidate) => {
    addCandidate(payload)
    setShowModal(false)
  }

  const handleMove = (id: EntityId, stageId: PipelineStageId) => {
    moveCandidate(id, stageId)
  }

  const handleRemove = (id: EntityId) => {
    if (confirm('¿Estás seguro de eliminar este candidato?')) {
      removeCandidate(id)
    }
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

    if (destinationStage === activeContainer && destinationIndex === activeIndex) {
      return
    }

    if (reorderCandidate) {
      reorderCandidate(
        activeId,
        destinationStage as PipelineStageId,
        destinationIndex
      )
    } else {
      // Fallback if reorder not implemented
      moveCandidate(activeId, destinationStage as PipelineStageId)
    }
  }

  const handleDragCancel = () => {
    setActiveCandidateId(null)
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  }

  // Find active candidate object for drag overlay
  const activeCandidate = useMemo(() => {
    if (!activeCandidateId) return null
    return candidates.find(c => c.id === activeCandidateId)
  }, [activeCandidateId, candidates])

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 text-slate-800 dark:text-slate-100 font-sans">
      <div className="mx-auto max-w-[1800px] px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pastel-indigo mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pastel-indigo opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pastel-indigo"></span>
              </span>
              Pipeline Comercial
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-pastel-indigo to-pastel-cyan">Oportunidades</span>
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium max-w-2xl text-sm leading-relaxed">
              Arrastra y suelta las tarjetas para avanzar en el proceso de venta.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-gray-200 dark:border-gray-700 pr-6">
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none">{totalActive}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Activos</span>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="group relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-white px-6 py-3 font-bold text-white dark:text-slate-900 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pastel-indigo to-pastel-cyan opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative flex items-center gap-2 text-sm uppercase tracking-wide">
                <PlusIcon className="h-5 w-5" />
                Nuevo Prospecto
              </span>
            </button>
          </div>
        </header>

        {/* Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="flex overflow-x-auto pb-8 gap-5 min-h-[calc(100vh-220px)] items-start snap-x">
            {columns.map((column) => (
              <CandidateColumn
                key={column.id}
                column={column}
                pipelineStages={pipelineStages}
                onMove={handleMove}
                onRemove={handleRemove}
                formatters={formatters}
                activeId={activeCandidateId}
                callTasksByCandidate={callTasksByCandidate}
                onOpenCalls={handleOpenCalls}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={dropAnimation}>
            {activeCandidate ? (
              <CandidateCard
                candidate={activeCandidate}
                pipelineStages={pipelineStages}
                onMove={() => { }}
                onRemove={() => { }}
                formatters={formatters}
                callTasksByCandidate={callTasksByCandidate}
                onOpenCalls={() => { }}
                isOverlay
              />
            ) : null}
          </DragOverlay>
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

// --- Column Component ---

const CandidateColumn: React.FC<CandidateColumnProps> = ({
  column,
  pipelineStages,
  onMove,
  onRemove, // eslint-disable-line @typescript-eslint/no-unused-vars
  formatters,
  activeId,
  callTasksByCandidate,
  onOpenCalls
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column' }
  })

  // Dynamic header colors based on stage ID
  // new, contacted, evaluation, proposal, negotiation, closed, rejected
  const getStageColor = (column: Column) => {
    // Si la etapa tiene un 'tone' definido (como bg-blue-500 o bg-pastel-indigo), lo usamos.
    // De lo contrario, usamos un mapeo por ID con colores del tema.
    if (column.tone && column.tone.startsWith('bg-')) {
      return column.tone;
    }

    const id = column.id;
    if (id === 'new') return 'bg-pastel-indigo';
    if (id === 'contacted') return 'bg-pastel-cyan';
    if (id === 'evaluation') return 'bg-purple-500';
    if (id === 'proposal') return 'bg-pink-500';
    if (id === 'negotiation') return 'bg-pastel-yellow';
    if (id === 'closed' || id === 'won') return 'bg-pastel-green';
    if (id === 'rejected' || id === 'lost') return 'bg-slate-500';
    return 'bg-slate-400';
  }

  const accentColor = getStageColor(column);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-80 min-w-[320px] flex flex-col rounded-[24px] 
        bg-gray-100/80 dark:bg-gray-800/20 backdrop-blur-sm
        border border-gray-200/50 dark:border-gray-700/30
        transition-all duration-300 snap-center
        ${isOver ? 'ring-2 ring-pastel-indigo/50 bg-pastel-indigo/5 dark:bg-gray-700/50 shadow-inner' : ''}
      `}
    >
      {/* Column Header */}
      <div className="p-4 mb-2 flex items-center justify-between border-b border-gray-200/50 dark:border-gray-700/30">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${accentColor} shadow-[0_0_8px_rgba(0,0,0,0.3)] ring-2 ring-white dark:ring-gray-800`} />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wide">
            {column.label}
          </h3>
        </div>
        <span className="flex items-center justify-center h-6 min-w-[24px] px-2 rounded-lg bg-white dark:bg-gray-700 text-xs font-bold text-slate-500 dark:text-slate-300 shadow-sm border border-gray-100 dark:border-gray-600">
          {column.items.length}
        </span>
      </div>

      {/* Cards Container */}
      <div className="flex-1 px-3 pb-3 overflow-y-auto custom-scrollbar">
        <SortableContext
          id={column.id as string}
          items={column.items.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3 min-h-[100px]">
            {column.items.length === 0 ? (
              <div className="h-32 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-2xl flex flex-col items-center justify-center text-center opacity-40 group hover:opacity-100 hover:border-pastel-indigo/30 transition-all cursor-default">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 mb-2 flex items-center justify-center text-gray-400 group-hover:text-pastel-indigo transition-colors">
                  <PlusIcon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-pastel-indigo">Vacío</span>
              </div>
            ) : (
              column.items.map(candidate => (
                <SortableCandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  pipelineStages={pipelineStages}
                  onMove={onMove}
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
    </div>
  )
}

// --- Card Component ---

const SortableCandidateCard: React.FC<SortableCandidateCardProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: props.candidate.id,
    data: {
      type: 'card',
      stage: props.candidate.stage
    }
  })

  // Style for the draggable item
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} outline-none`}
    >
      <CandidateCard {...props} />
    </div>
  )
}


const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  formatters,
  callTasksByCandidate,
  isOverlay,
  onRemove
}) => {

  // Helpers
  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const updatedLabel = candidate.updatedAt
    ? formatters?.relative?.(candidate.updatedAt)
    : 'Reciente'

  // Calculations
  const callTasks = callTasksByCandidate?.[candidate.id] ?? []
  const urgentCalls = callTasks.filter(t => t.priority === 'high' || t.isOverdue).length

  const pendingDataCount = [
    !candidate.city,
    !candidate.contact?.phone,
    !candidate.contact?.email,
    candidate.pendingData
  ].filter(Boolean).length

  return (
    <article
      className={`
        group relative overflow-hidden bg-white dark:bg-gray-800 rounded-[20px] p-4 
        transition-all duration-200 border border-gray-100 dark:border-gray-700/50
        ${isOverlay
          ? 'shadow-2xl shadow-pastel-indigo/20 rotate-3 scale-105 ring-2 ring-pastel-indigo cursor-grabbing z-50'
          : 'shadow-sm hover:shadow-xl hover:translate-y-[-2px] hover:border-pastel-indigo/20 dark:hover:border-pastel-indigo/10'
        }
      `}
    >
      {/* Top Bar (Date & Context Menu) */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-md">
          <ClockIcon className="w-3 h-3" />
          {updatedLabel}
        </span>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(candidate.id);
            }}
            className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
            title="Eliminar"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="flex items-start gap-3 mb-4 relative z-10">
        <div className={`
             w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-lg ring-2 ring-white dark:ring-gray-800
             ${candidate.pendingData ? 'bg-slate-300' : 'bg-gradient-to-br from-pastel-indigo to-pastel-cyan'}
          `}>
          {initials}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm leading-tight mb-1 group-hover:text-pastel-indigo transition-colors">
            {candidate.name}
          </h4>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPinIcon className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{candidate.city || 'Ubicación...'}</span>
          </div>
        </div>
      </div>

      {/* Metadata Tags */}
      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
        {pendingDataCount > 0 && (
          <div className="flex items-center gap-1 text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-md font-bold border border-red-100 dark:border-red-900/30">
            <ExclamationTriangleIcon className="w-3 h-3" />
            {pendingDataCount}
          </div>
        )}
        {urgentCalls > 0 && (
          <div className="flex items-center gap-1 text-[10px] bg-pastel-yellow/10 dark:bg-pastel-yellow/20 text-pastel-yellow dark:text-pastel-yellow px-2 py-0.5 rounded-md font-bold border border-pastel-yellow/20 dark:border-pastel-yellow/30 animate-pulse">
            <PhoneIcon className="w-3 h-3" />
            {urgentCalls}
          </div>
        )}
        {candidate.channelCode && (
          <div className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-md font-bold uppercase">
            {candidate.channelCode}
          </div>
        )}
      </div>

      {/* Footer Contact Icons */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-700/50 relative z-10">
        <div className="flex gap-2">
          <div className={`p-1.5 rounded-xl transition-colors ${candidate.contact?.phone ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
            <PhoneIcon className="w-3.5 h-3.5" />
          </div>
          <div className={`p-1.5 rounded-xl transition-colors ${candidate.contact?.email ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'}`}>
            <EnvelopeIcon className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Subtle decoration */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-pastel-indigo flex items-center gap-1">
          MOVER
          <div className={`w-1.5 h-1.5 rounded-full ${candidate.stage === 'new' ? 'bg-pastel-cyan' : 'bg-pastel-indigo animate-pulse'}`} />
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-tl from-pastel-indigo/10 to-pastel-cyan/10 dark:from-pastel-indigo/20 dark:to-pastel-cyan/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 blur-xl pointer-events-none" />
    </article>
  )
}

export default Kanban
