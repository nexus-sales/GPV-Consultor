import React, { useEffect, useMemo, useState } from 'react'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  XMarkIcon,
  TrashIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  QueueListIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { useNavigate, Link } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import { useCandidatesQuery } from '../lib/hooks/queries/useCandidatesQuery'
import router from '../router'
import { createLogger } from '../lib/logger'

const log = createLogger('Candidates')
import type {
  Candidate,
  NewCandidate,
  PipelineStage,
  PipelineStageId,
  Category as TaxonomyCategory
} from '../lib/types'
import CandidateForm from '../components/CandidateForm'
import Modal from '../components/ui/Modal'
import ImportExportMenu from '../components/ImportExportMenu'
import {
  downloadCandidateTemplate,
  exportCandidates,
  importCandidatesWithUpdate
} from '../lib/utils/excel'

interface StageLookup {
  [key: string]: PipelineStage
}

interface Totals {
  total: number
  active: number
  rejected: number
}

interface ActionChipProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'neutral' | 'ghost'
  onClick: () => void
}

const candidateStageToneClasses: Record<string, { row: string; card: string }> =
  {
    new: {
      row: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50',
      card: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-700/50'
    },
    contacted: {
      row: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50',
      card: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700/50'
    },
    evaluation: {
      row: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50',
      card: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-700/50'
    },
    approved: {
      row: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/40 dark:hover:bg-green-900/50',
      card: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-700/50'
    },
    rejected: {
      row: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50',
      card: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-700/50'
    }
  }

const getCandidateTone = (stageId: string): { row: string; card: string } => {
  return (
    candidateStageToneClasses[stageId] ?? {
      row: 'bg-white hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/70',
      card: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
    }
  )
}

const ActionChip: React.FC<ActionChipProps> = ({
  children,
  variant = 'primary',
  onClick
}) => {
  const variants: Record<string, string> = {
    primary:
      'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20',
    secondary:
      'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20',
    danger:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
    neutral:
      'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700',
    ghost:
      'border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-red-500/40 dark:hover:text-red-300'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
        variants[variant] ?? variants.primary
      }`}
    >
      {children}
    </button>
  )
}

const candidateHealthColorMap: Record<string, { dot: string; text: string }> = {
  slate: { dot: 'bg-slate-500', text: 'text-slate-600 dark:text-slate-400' },
  emerald: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  red: { dot: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  orange: {
    dot: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400'
  },
  indigo: { dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400' }
}

const Candidates: React.FC = () => {
  const { data: candidates = [], isLoading, isError } = useCandidatesQuery()

  const {
    pipelineStages,
    moveCandidate,
    removeCandidate,
    addCandidate,
    updateCandidate,
    formatters,
    taxonomy
  } = useAppData()

  const [search, setSearch] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')

  // --- LÓGICA SMART RECRUITMENT ---
  const getCandidateHealth = useMemo(
    () => (candidate: Candidate) => {
      const lastUpdate = candidate.updatedAt
        ? new Date(candidate.updatedAt)
        : new Date(candidate.createdAt)
      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
      )

      if (candidate.stage === 'rejected')
        return { label: 'Descartado', color: 'slate', isStuck: false }
      if (candidate.stage === 'approved')
        return { label: 'Aprobado', color: 'emerald', isStuck: false }

      if (daysSinceUpdate > 7)
        return {
          label: 'Estancado',
          color: 'red',
          isStuck: true,
          days: daysSinceUpdate
        }
      if (daysSinceUpdate > 4)
        return {
          label: 'Enfriándose',
          color: 'orange',
          isStuck: true,
          days: daysSinceUpdate
        }
      return {
        label: 'Activo',
        color: 'indigo',
        isStuck: false,
        days: daysSinceUpdate
      }
    },
    []
  )

  const recruitmentFocus = useMemo(() => {
    const stuck = candidates
      .filter((c: Candidate) => getCandidateHealth(c).isStuck)
      .slice(0, 2)
    const newOnes = candidates.filter((c: Candidate) => c.stage === 'new').slice(0, 2)
    return { stuck, newOnes }
  }, [candidates, getCandidateHealth])
  // --------------------------------

  const stageLookup = useMemo(
    (): StageLookup =>
      (pipelineStages || []).reduce(
        (acc: StageLookup, stage: PipelineStage) => {
          acc[stage.id] = stage
          return acc
        },
        {}
      ),
    [pipelineStages]
  )

  const activeStages = useMemo(
    (): PipelineStage[] =>
      (pipelineStages || []).filter(
        (stage: PipelineStage) => stage.id !== 'rejected'
      ),
    [pipelineStages]
  )

  const filteredCandidates = useMemo((): Candidate[] => {
    return (candidates || []).filter((candidate: Candidate) => {
      const matchesSearch = !search
        ? true
        : [
            candidate.name,
            candidate.city,
            candidate.channelCode,
            candidate.contact?.name
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase())

      const matchesStage =
        stageFilter === 'all' || candidate.stage === stageFilter
      const matchesCategory =
        categoryFilter === 'all' || candidate.categoryId === categoryFilter

      return matchesSearch && matchesStage && matchesCategory
    })
  }, [candidates, search, stageFilter, categoryFilter])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCandidates.length / pageSize))
  }, [filteredCandidates.length, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, stageFilter, categoryFilter, pageSize])

  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev))
  }, [totalPages])

  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredCandidates.slice(start, start + pageSize)
  }, [currentPage, filteredCandidates, pageSize])

  // Detectar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return search !== '' || stageFilter !== 'all' || categoryFilter !== 'all'
  }, [search, stageFilter, categoryFilter])

  const totals = useMemo((): Totals => {
    const active = (candidates || []).filter(
      (candidate: Candidate) => candidate.stage !== 'rejected'
    ).length
    const rejected = (candidates || []).length - active
    return { total: (candidates || []).length, active, rejected }
  }, [candidates])

  const handleAdvance = (candidate: Candidate): void => {
    const currentIndex = activeStages.findIndex(
      (stage) => stage.id === candidate.stage
    )
    const nextStage = activeStages[currentIndex + 1]
    if (nextStage) {
      moveCandidate(candidate.id, nextStage.id)
    } else {
      moveCandidate(candidate.id, 'approved' as PipelineStageId)
    }
  }

  const handleReset = (candidate: Candidate): void => {
    moveCandidate(
      candidate.id,
      (activeStages[0]?.id ?? 'new') as PipelineStageId
    )
  }

  const handleReject = (candidate: Candidate): void => {
    moveCandidate(candidate.id, 'rejected')
  }

  const handleCreateCandidate = async (
    payload: NewCandidate
  ): Promise<void> => {
    try {
      await addCandidate(payload)
      setShowModal(false)
    } catch (error) {
      log.error('Error adding candidate:', error)
      // El error ya suele ser gestionado por addCandidate con notificaciones,
      // pero aquí nos aseguramos de no cerrar el modal si algo falla catastróficamente.
    }
  }

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearch(event.target.value)
  }

  const handleStageFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStageFilter(event.target.value)
  }

  const handleCategoryFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setCategoryFilter(event.target.value)
  }

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextSize = Number(event.target.value) || 10
    setPageSize(nextSize)
  }

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const tableHeaders = [
    'Candidato',
    'Etapa',
    'Actividad',
    'Contacto',
    'Actualización',
    'Acciones'
  ]

  if (isLoading) {
    const PageFallback = (router.routes[0] as any).children[0].children[0].children[0].element.props.fallback.type
    return <PageFallback />
  }

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-medium">Error al cargar candidatos</p>
        <button 
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageContainer className="py-10">
        {/* Panel de Foco de Reclutamiento */}
        {(recruitmentFocus.stuck.length > 0 ||
          recruitmentFocus.newOnes.length > 0) && (
          <section className="mb-8 grid gap-4 lg:grid-cols-2">
            {recruitmentFocus.stuck.length > 0 && (
              <div className="rounded-3xl bg-orange-50 p-5 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30">
                <div className="flex items-center gap-2 mb-3 text-orange-800 dark:text-orange-200 font-bold text-xs uppercase tracking-wider">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  Candidatos Estancados (&gt;7 días)
                </div>
                <div className="flex flex-wrap gap-3">
                  {recruitmentFocus.stuck.map((c) => (
                    <Link
                      key={c.id}
                      to={`/candidates/${c.id}`}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800 hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-md">
                        {getCandidateHealth(c).days}d
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {recruitmentFocus.newOnes.length > 0 && (
              <div className="rounded-3xl bg-indigo-50 p-5 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                <div className="flex items-center gap-2 mb-3 text-indigo-800 dark:text-indigo-200 font-bold text-xs uppercase tracking-wider">
                  <ArrowPathIcon className="h-4 w-4 animate-spin-slow" />
                  Nuevas Incorporaciones
                </div>
                <div className="flex flex-wrap gap-3">
                  {recruitmentFocus.newOnes.map((c) => (
                    <Link
                      key={c.id}
                      to={`/candidates/${c.id}`}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800 hover:scale-105 transition-transform"
                    >
                      <span className="text-xs font-bold">{c.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-md">
                        NUEVO
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Pipeline comercial
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              Candidatos registrados
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Visualiza candidatos por etapa y ejecuta acciones rápidas desde la
              tabla.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {totals.active} activos · {totals.rejected} descartados
            </span>

            <ImportExportMenu<
              Partial<Candidate> & {
                isUpdate?: boolean
                existingId?: string | number
              }
            >
              type="candidates"
              onDownloadTemplate={downloadCandidateTemplate}
              onExport={() => exportCandidates(candidates)}
              onExportFiltered={() => exportCandidates(filteredCandidates)}
              hasFilters={hasActiveFilters}
              filteredCount={filteredCandidates.length}
              totalCount={candidates.length}
              onImport={(file) => importCandidatesWithUpdate(file, candidates)}
              onImportComplete={(data) => {
                data.forEach((cand) => {
                  if (cand.isUpdate && cand.existingId) {
                    // Actualizar candidato existente
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { isUpdate, existingId, ...updateData } = cand
                    updateCandidate(existingId, updateData)
                  } else {
                    // Crear nuevo candidato
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { isUpdate, existingId, ...newData } = cand
                    addCandidate(newData as NewCandidate)
                  }
                })
              }}
            />

            <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Vista lista"
                className={`inline-flex items-center px-3 py-2 text-sm transition ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
              >
                <QueueListIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Vista tarjetas"
                className={`inline-flex items-center px-3 py-2 text-sm transition ${viewMode === 'cards' ? 'bg-indigo-600 text-white' : 'bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'}`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Añadir candidato
            </button>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Búsqueda global
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Nombre, localidad, código, contacto..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-11 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Etapa
              </label>
              <div className="relative">
                <FunnelIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={stageFilter}
                  onChange={handleStageFilterChange}
                  aria-label="Filtrar por etapa del pipeline"
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="all">Todas</option>
                  {(pipelineStages || []).map((stage: PipelineStage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Taxonomía USUARIOS
              </label>
              <div className="relative">
                <InformationCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={handleCategoryFilterChange}
                  aria-label="Filtrar por categoría de taxonomía"
                  className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="all">Todas</option>
                  {(taxonomy?.rules as TaxonomyCategory[] | undefined)?.map(
                    (rule: TaxonomyCategory) => (
                      <option key={rule.id} value={rule.id}>
                        {rule.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/80">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay candidatos que coincidan con los filtros
                        actuales.
                      </td>
                    </tr>
                  )}

                  {paginatedCandidates.map((candidate) => {
                    const stage = stageLookup[candidate.stage] ?? {
                      label: 'Sin etapa',
                      badge:
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                    const updatedLabel = candidate.updatedAt
                      ? formatters.relative(candidate.updatedAt)
                      : 'Sin registro'
                    const isRejected = candidate.stage === 'rejected'

                    return (
                      <tr
                        key={candidate.id}
                        className={`transition-colors duration-500 ${getCandidateTone(candidate.stage).row}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                              {candidate.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <Link
                                to={`/candidates/${candidate.id}`}
                                className="text-sm font-semibold text-gray-900 dark:text-white transition hover:text-indigo-600"
                              >
                                {candidate.name}
                              </Link>
                              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPinIcon className="h-4 w-4" />
                                {[candidate.city, candidate.island]
                                  .filter(Boolean)
                                  .join(', ') || 'Ubicación pendiente'}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs uppercase tracking-widest text-gray-400">
                                  {candidate.channelCode ||
                                    'Sin código asignado'}
                                </span>
                                {candidate.category && (
                                  <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold border ${candidate.category.badgeClass}`}
                                    title={candidate.category.tooltip}
                                  >
                                    <span className="h-2 w-2 rounded-full bg-current" />
                                    {candidate.category.label}
                                  </span>
                                )}
                                {candidate.pendingData && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-500/30"
                                    title="Checklist de datos pendiente"
                                  >
                                    <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                                    PVPTE datos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${stage.badge}`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {stage.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {(() => {
                            const health = getCandidateHealth(candidate)
                            return (
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-1.5 w-1.5 rounded-full ${candidateHealthColorMap[health.color]?.dot ?? 'bg-gray-500'} ${health.isStuck ? 'animate-pulse' : ''}`}
                                />
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-tight ${candidateHealthColorMap[health.color]?.text ?? 'text-gray-600 dark:text-gray-400'}`}
                                >
                                  {health.label}{' '}
                                  {health.days !== undefined
                                    ? `(${health.days}d)`
                                    : ''}
                                </span>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex flex-col gap-1 text-xs">
                            {candidate.contact?.name && (
                              <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                <UserIcon className="h-4 w-4" />
                                {candidate.contact.name}
                              </span>
                            )}
                            {candidate.contact?.phone && (
                              <span className="flex items-center gap-2">
                                <PhoneIcon className="h-4 w-4" />
                                {candidate.contact.phone}
                              </span>
                            )}
                            {candidate.contact?.email && (
                              <span className="flex items-center gap-2">
                                <EnvelopeIcon className="h-4 w-4" />
                                {candidate.contact.email}
                              </span>
                            )}
                            {!candidate.contact && (
                              <span className="text-gray-400">
                                Contacto pendiente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {updatedLabel}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {candidate.stage !== 'rejected' &&
                              candidate.stage !== 'approved' && (
                                <ActionChip
                                  onClick={() => handleAdvance(candidate)}
                                >
                                  <ArrowRightIcon className="h-4 w-4" /> Avanzar
                                </ActionChip>
                              )}
                            {candidate.stage !== activeStages[0]?.id && (
                              <ActionChip
                                variant="secondary"
                                onClick={() => handleReset(candidate)}
                              >
                                <ArrowPathIcon className="h-4 w-4" /> Reiniciar
                              </ActionChip>
                            )}
                            {!isRejected ? (
                              <ActionChip
                                variant="danger"
                                onClick={() => handleReject(candidate)}
                              >
                                <XMarkIcon className="h-4 w-4" /> Descartar
                              </ActionChip>
                            ) : (
                              <ActionChip
                                variant="neutral"
                                onClick={() => handleReset(candidate)}
                              >
                                <ArrowRightIcon className="h-4 w-4" /> Reabrir
                              </ActionChip>
                            )}
                            <Link
                              to={`/candidates/${candidate.id}`}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:text-indigo-300 dark:hover:border-indigo-500/40"
                            >
                              <InformationCircleIcon className="h-4 w-4" />{' '}
                              Ficha
                            </Link>
                            <ActionChip
                              variant="ghost"
                              onClick={() => removeCandidate(candidate.id)}
                            >
                              <TrashIcon className="h-4 w-4" /> Eliminar
                            </ActionChip>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-8">
              {filteredCandidates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  No hay candidatos que coincidan con los filtros actuales.
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedCandidates.map((candidate) => {
                    const stage = stageLookup[candidate.stage] ?? {
                      label: 'Sin etapa',
                      badge:
                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                    const updatedLabel = candidate.updatedAt
                      ? formatters.relative(candidate.updatedAt)
                      : 'Sin registro'
                    const isRejected = candidate.stage === 'rejected'

                    return (
                      <article
                        key={candidate.id}
                        className={`flex flex-col gap-4 rounded-xl border p-5 transition-colors duration-300 ${getCandidateTone(candidate.stage).card}`}
                      >
                        {/* Header: avatar + nombre + localización */}
                        <div className="flex items-start gap-3">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            {candidate.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/candidates/${candidate.id}`}
                              className="block truncate text-sm font-semibold text-gray-900 dark:text-white transition hover:text-indigo-600"
                            >
                              {candidate.name}
                            </Link>
                            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                              {[candidate.city, candidate.island]
                                .filter(Boolean)
                                .join(', ') || 'Ubicación pendiente'}
                            </p>
                          </div>
                        </div>

                        {/* Etapa + código canal */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${stage.badge}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {stage.label}
                          </span>
                          <span className="text-xs uppercase tracking-widest text-gray-400">
                            {candidate.channelCode || 'Sin código'}
                          </span>
                          {candidate.category && (
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${candidate.category.badgeClass}`}
                              title={candidate.category.tooltip}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {candidate.category.label}
                            </span>
                          )}
                          {candidate.pendingData && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-400"
                              title="Checklist de datos pendiente"
                            >
                              <ExclamationTriangleIcon className="h-3 w-3" />
                              PVPTE datos
                            </span>
                          )}
                        </div>

                        {/* Contacto */}
                        <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400">
                          {candidate.contact?.name && (
                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <UserIcon className="h-3.5 w-3.5 shrink-0" />
                              {candidate.contact.name}
                            </span>
                          )}
                          {candidate.contact?.phone && (
                            <span className="flex items-center gap-2">
                              <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                              {candidate.contact.phone}
                            </span>
                          )}
                          {candidate.contact?.email && (
                            <span className="flex items-center gap-2 truncate">
                              <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">
                                {candidate.contact.email}
                              </span>
                            </span>
                          )}
                          {!candidate.contact && (
                            <span className="text-gray-400">
                              Contacto pendiente
                            </span>
                          )}
                        </div>

                        {/* Última actualización */}
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Actualizado: {updatedLabel}
                        </p>

                        {/* Acciones */}
                        <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                          {candidate.stage !== 'rejected' &&
                            candidate.stage !== 'approved' && (
                              <ActionChip
                                onClick={() => handleAdvance(candidate)}
                              >
                                <ArrowRightIcon className="h-3.5 w-3.5" />{' '}
                                Avanzar
                              </ActionChip>
                            )}
                          {candidate.stage !== activeStages[0]?.id && (
                            <ActionChip
                              variant="secondary"
                              onClick={() => handleReset(candidate)}
                            >
                              <ArrowPathIcon className="h-3.5 w-3.5" />{' '}
                              Reiniciar
                            </ActionChip>
                          )}
                          {!isRejected ? (
                            <ActionChip
                              variant="danger"
                              onClick={() => handleReject(candidate)}
                            >
                              <XMarkIcon className="h-3.5 w-3.5" /> Descartar
                            </ActionChip>
                          ) : (
                            <ActionChip
                              variant="neutral"
                              onClick={() => handleReset(candidate)}
                            >
                              <ArrowRightIcon className="h-3.5 w-3.5" /> Reabrir
                            </ActionChip>
                          )}
                          <Link
                            to={`/candidates/${candidate.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-gray-700 dark:text-indigo-300 dark:hover:border-indigo-500/40"
                          >
                            <InformationCircleIcon className="h-3.5 w-3.5" />{' '}
                            Ficha
                          </Link>
                          <ActionChip
                            variant="ghost"
                            onClick={() => removeCandidate(candidate.id)}
                          >
                            <TrashIcon className="h-3.5 w-3.5" /> Eliminar
                          </ActionChip>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {filteredCandidates.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Mostrando</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                aria-label="Seleccionar cantidad de candidatos por página"
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
              <span>de {filteredCandidates.length} candidatos</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  canGoPrevious &&
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                disabled={!canGoPrevious}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
              >
                Anterior
              </button>
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Página {currentPage} de {totalPages}
              </div>
              <button
                type="button"
                onClick={() =>
                  canGoNext &&
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={!canGoNext}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </PageContainer>

      {showModal && (
        <Modal title="Nuevo candidato" onClose={() => setShowModal(false)}>
          <CandidateForm
            onSubmit={handleCreateCandidate}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}
    </div>
  )
}

export default Candidates
