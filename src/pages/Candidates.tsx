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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Link } from 'react-router-dom'
import { useAppData } from '../lib/useAppData'
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

const ActionChip: React.FC<ActionChipProps> = ({
  children,
  variant = 'primary',
  onClick
}) => {
  const variants: Record<string, string> = {
    primary: 'bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20',
    secondary: 'bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20',
    danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20',
    neutral:
      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80',
    ghost:
      'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-pastel-red/40 hover:text-pastel-red'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
        variants[variant] ?? variants.primary
      }`}
    >
      {children}
    </button>
  )
}

const Candidates: React.FC = () => {
  const {
    candidates,
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

  const handleCreateCandidate = (payload: NewCandidate): void => {
    addCandidate(payload)
    setShowModal(false)
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
    'Contacto',
    'Actualización',
    'Acciones'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
              Pipeline comercial
            </p>
            <h1 className="mt-2 text-4xl font-bold text-gray-900">
              Candidatos registrados
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Visualiza candidatos por etapa y ejecuta acciones rápidas desde la
              tabla.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 text-sm font-semibold text-pastel-indigo shadow-sm">
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

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-indigo"
            >
              Añadir candidato
            </button>
          </div>
        </header>

        <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/85 dark:bg-gray-800/85 p-6 shadow-xl backdrop-blur">
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
                  className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-11 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
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
                  className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-10 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
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
                  className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-10 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
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

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gradient-to-r from-pastel-indigo/20 via-white to-pastel-cyan/20">
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
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                    >
                      No hay candidatos que coincidan con los filtros actuales.
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
                      className="hover:bg-gray-50 dark:bg-gray-700/80"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-indigo/30 to-pastel-cyan/20 text-sm font-semibold text-pastel-indigo">
                            {candidate.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <Link
                              to={`/candidates/${candidate.id}`}
                              className="text-sm font-semibold text-gray-900 dark:text-white transition hover:text-pastel-indigo"
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
                                {candidate.channelCode || 'Sin código asignado'}
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
                                  className="inline-flex items-center gap-1 rounded-full bg-pastel-yellow/20 px-2.5 py-1 text-[11px] font-semibold text-pastel-yellow border border-pastel-yellow/30"
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
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-pastel-indigo transition hover:border-pastel-indigo/40 hover:text-pastel-indigo"
                          >
                            <InformationCircleIcon className="h-4 w-4" /> Ficha
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
        </section>

        {filteredCandidates.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/70 dark:bg-gray-800/70 px-5 py-4 shadow-lg backdrop-blur md:flex-row md:items-center md:justify-between">
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
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white dark:hover:bg-gray-700"
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
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-700/80 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

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
