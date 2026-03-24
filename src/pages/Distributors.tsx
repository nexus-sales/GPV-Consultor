import React, { useEffect, useMemo, useState } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  MapPinIcon,
  ChartBarIcon,
  EyeIcon,
  PencilSquareIcon,
  CalendarIcon,
  PhoneIcon,
  QueueListIcon,
  Squares2X2Icon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { createLogger } from '../lib/logger'

const log = createLogger('Distributors')
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import DistributorForm from '../components/DistributorForm'
import { VisitForm } from '../components/VisitForm'
import { SaleForm } from '../components/SaleForm'
import Modal from '../components/ui/Modal'
import ImportExportMenu from '../components/ImportExportMenu'
import {
  downloadDistributorTemplate,
  exportDistributors,
  importDistributorsWithUpdate
} from '../lib/utils/excel'
import type {
  Distributor,
  NewDistributor,
  NewVisit,
  NewSale,
  PriorityLevel,
  SectorId
} from '../lib/types'
import { TrashIcon } from '@heroicons/react/24/solid'

const statusStyles = {
  active: 'bg-pastel-green/20 text-pastel-green',
  pending: 'bg-pastel-yellow/20 text-pastel-yellow',
  blocked: 'bg-pastel-red/20 text-pastel-red'
}

const statusRowTones: Record<string, { row: string; card: string }> = {
  active: {
    row: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-900/40',
    card: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-700/50'
  },
  pending: {
    row: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40',
    card: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50'
  },
  blocked: {
    row: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40',
    card: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-700/50'
  }
}

const getStatusTone = (status: string): { row: string; card: string } =>
  statusRowTones[status] ?? {
    row: 'bg-white hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-800/70',
    card: 'bg-white/85 dark:bg-gray-800/85 border-white/40 dark:border-gray-700/40'
  }

const priorityStyles: Record<PriorityLevel, string> = {
  high: 'bg-pastel-red/15 text-pastel-red border border-pastel-red/30',
  medium:
    'bg-pastel-yellow/20 text-pastel-yellow border border-pastel-yellow/30',
  low: 'bg-pastel-cyan/15 text-pastel-cyan border border-pastel-cyan/30'
}

const priorityLabels: Record<PriorityLevel, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
}

interface ModalState {
  type: 'create' | 'edit' | 'visit' | 'sale'
  distributor?: Distributor | null
}

interface ModalMeta {
  title: string
  maxWidth: string
}

interface ActionButtonProps {
  icon?: React.ElementType
  label: string
  theme?: 'indigo' | 'cyan' | 'green' | 'danger'
  onClick: () => void
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  theme = 'indigo',
  onClick
}) => {
  const themeMap: Record<string, string> = {
    indigo: 'bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20',
    cyan: 'bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20',
    green: 'bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20',
    danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
        themeMap[theme] ?? themeMap.indigo
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </button>
  )
}

const Distributors: React.FC = () => {
  const navigate = useNavigate()
  const {
    distributors,
    addDistributor,
    updateDistributor,
    deleteDistributor,
    addVisit,
    addSale,
    lookups,
    channelOptions,
    statusOptions,
    provinceOptions,
    stats,
    sectors,
    commissionAgreements
  } = useAppData()

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [provinceFilter, setProvinceFilter] = useState<string>('all')
  const [sectorFilter, setSectorFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | PriorityLevel>(
    'all'
  )
  const [showFilters, setShowFilters] = useState<boolean>(false)
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [distributorToDelete, setDistributorToDelete] =
    useState<Distributor | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list')

  const modalMeta = useMemo((): ModalMeta => {
    if (!activeModal) return { title: '', maxWidth: 'max-w-2xl' }

    const base = { title: '', maxWidth: 'max-w-2xl' }
    switch (activeModal.type) {
      case 'create':
        return { ...base, title: 'Nuevo distribuidor' }
      case 'edit':
        return {
          ...base,
          title: `Editar distribuidor • ${activeModal.distributor?.name ?? ''}`
        }
      case 'visit':
        return {
          title: `Registrar visita • ${activeModal.distributor?.name ?? ''}`,
          maxWidth: 'max-w-xl'
        }
      case 'sale':
        return {
          title: `Registrar venta • ${activeModal.distributor?.name ?? ''}`,
          maxWidth: 'max-w-xl'
        }
      default:
        return base
    }
  }, [activeModal])

  const summaryCards = useMemo(
    (): {
      title: string
      value: string
      delta: string
      bg: string
      border: string
      iconBg: string
      iconColor: string
      valueColor: string
      icon: React.ElementType
    }[] => [
      {
        title: 'Distribuidores activos',
        value: stats.activeDistributors.toString(),
        delta: `${stats.pendingDistributors} pendientes de activación`,
        bg: 'bg-gradient-to-br from-indigo-50 via-indigo-50/60 to-white',
        border: 'border-indigo-100 dark:border-indigo-800/40',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        iconColor: 'text-indigo-600 dark:text-indigo-300',
        valueColor: 'text-indigo-700 dark:text-indigo-300',
        icon: ChartBarIcon
      },
      {
        title: 'Visitas últimos 7 días',
        value: stats.visitsLast7Days.toString(),
        delta: 'Seguimiento comercial reciente',
        bg: 'bg-gradient-to-br from-cyan-50 via-cyan-50/60 to-white',
        border: 'border-cyan-100 dark:border-cyan-800/40',
        iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
        iconColor: 'text-cyan-600 dark:text-cyan-300',
        valueColor: 'text-cyan-700 dark:text-cyan-300',
        icon: CalendarIcon
      },
      {
        title: 'Operaciones registradas',
        value: stats.totalOperations.toString(),
        delta: stats.operationsByBrand?.[0]
          ? `${stats.operationsByBrand[0].value} ${stats.operationsByBrand[0].label} | ${stats.operationsByBrand[1]?.value ?? 0} ${stats.operationsByBrand[1]?.label ?? 'Otros'}`
          : 'Sin operaciones registradas',
        bg: 'bg-gradient-to-br from-amber-50 via-amber-50/60 to-white',
        border: 'border-amber-100 dark:border-amber-800/40',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        iconColor: 'text-amber-600 dark:text-amber-300',
        valueColor: 'text-amber-700 dark:text-amber-300',
        icon: PhoneIcon
      }
    ],
    [stats]
  )

  const filteredDistributors = useMemo((): Distributor[] => {
    const filtered = distributors.filter((item: Distributor) => {
      const searchTermLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm
        ? true
        : [item.name, item.code, item.city, item.province]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(searchTermLower)

      const matchesChannel =
        channelFilter === 'all' || item.channelType === channelFilter
      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter
      const matchesProvince =
        provinceFilter === 'all' || item.province === provinceFilter
      const matchesSector =
        sectorFilter === 'all' ||
        (item.sectors && item.sectors.includes(sectorFilter as SectorId))
      const matchesPriority =
        priorityFilter === 'all' || item.priorityLevel === priorityFilter

      return (
        matchesSearch &&
        matchesChannel &&
        matchesStatus &&
        matchesProvince &&
        matchesSector &&
        matchesPriority
      )
    })
    // Mostrar primero los distribuidores con mayor prioridad.
    return filtered.sort(
      (a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0)
    )
  }, [
    channelFilter,
    distributors,
    priorityFilter,
    provinceFilter,
    sectorFilter,
    searchTerm,
    statusFilter
  ])

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredDistributors.length / pageSize))
  }, [filteredDistributors.length, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchTerm,
    channelFilter,
    statusFilter,
    provinceFilter,
    sectorFilter,
    priorityFilter,
    pageSize
  ])

  useEffect(() => {
    setCurrentPage((prev) => (prev > totalPages ? totalPages : prev))
  }, [totalPages])

  const paginatedDistributors = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDistributors.slice(start, start + pageSize)
  }, [currentPage, filteredDistributors, pageSize])

  // Detectar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      channelFilter !== 'all' ||
      statusFilter !== 'all' ||
      provinceFilter !== 'all' ||
      priorityFilter !== 'all'
    )
  }, [searchTerm, channelFilter, statusFilter, provinceFilter, priorityFilter])

  const openModal = (
    type: ModalState['type'],
    distributor: Distributor | null = null
  ): void => {
    setActiveModal({ type, distributor })
  }

  const closeModal = (): void => setActiveModal(null)

  const handleCreateDistributor = async (
    payload: NewDistributor
  ): Promise<void> => {
    try {
      await addDistributor(payload)
      setActiveModal(null)
    } catch (error) {
      log.error('Error creating:', error)
    }
  }

  const handleEditDistributor =
    (id: string) =>
    async (payload: NewDistributor): Promise<void> => {
      try {
        await updateDistributor(id, payload)
        setActiveModal(null)
      } catch (error) {
        log.error('Error editing:', error)
      }
    }

  const handleVisit = (payload: NewVisit): void => {
    addVisit(payload)
    setActiveModal(null)
  }

  const handleSale = (payload: NewSale): void => {
    addSale(payload)
    setActiveModal(null)
  }

  const handleDeleteDistributor = (): void => {
    if (!distributorToDelete) return
    deleteDistributor(distributorToDelete.id)
    setDistributorToDelete(null)
  }

  const handleSearchChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSearchTerm(event.target.value)
  }

  const handleChannelFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setChannelFilter(event.target.value)
  }

  const handleStatusFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusFilter(event.target.value)
  }

  const handleProvinceFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setProvinceFilter(event.target.value)
  }

  const handlePriorityFilterChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setPriorityFilter(event.target.value as 'all' | PriorityLevel)
  }

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextSize = Number(event.target.value) || 10
    setPageSize(nextSize)
  }

  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const resetFilters = (): void => {
    setSearchTerm('')
    setChannelFilter('all')
    setStatusFilter('all')
    setProvinceFilter('all')
    setPriorityFilter('all')
  }

  const tableHeaders = [
    'Distribuidor',
    'Código',
    'Tipo',
    'Sectores',
    'Marcas',
    'Estado',
    'Prioridad',
    'Completitud',
    'Operaciones',
    'Acciones'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PageContainer size="ultra" className="py-10">
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan p-5 sm:p-6 shadow-lg shadow-pastel-indigo/15">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-black/5 blur-2xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span>Red de distribución</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5">
                    Distribuidores
                  </h1>
                  <p className="text-sm text-white/80 max-w-xl">
                    Monitorea el estado de cada partner, organiza visitas y
                    asegura la cobertura completa sobre las islas.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3">
                <span className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-semibold text-white shadow-sm whitespace-nowrap">
                  {stats.activeDistributors} activos ·{' '}
                  {stats.pendingDistributors} pendientes
                </span>

                <div className="relative z-10">
                  <ImportExportMenu
                    type="distributors"
                    onDownloadTemplate={downloadDistributorTemplate}
                    onExport={() => exportDistributors(distributors)}
                    onExportFiltered={() =>
                      exportDistributors(filteredDistributors)
                    }
                    hasFilters={hasActiveFilters}
                    filteredCount={filteredDistributors.length}
                    totalCount={distributors.length}
                    onImport={(file) =>
                      importDistributorsWithUpdate(file, distributors)
                    }
                    onImportComplete={async (data) => {
                      const existingCodes = new Set(
                        distributors.map((d) => d.code?.toUpperCase?.() || '')
                      )
                      const ops: Promise<unknown>[] = []
                      for (const dist of data) {
                        if (dist.isUpdate && dist.existingId) {
                          const {
                            isUpdate: _isUpdate,
                            existingId: _existingId,
                            ...updateData
                          } = dist
                          ops.push(
                            updateDistributor(dist.existingId, updateData)
                          )
                        } else {
                          const {
                            isUpdate: _isUpdate,
                            existingId: _existingId,
                            ...newData
                          } = dist
                          const code = (newData.code ?? '').toUpperCase()
                          if (!existingCodes.has(code) && code) {
                            existingCodes.add(code)
                            ops.push(addDistributor(newData as NewDistributor))
                          }
                        }
                      }
                      try {
                        await Promise.all(ops)
                      } catch {
                        alert(
                          'Error al importar algunos distribuidores. Revisa la conexión o los datos.'
                        )
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => openModal('create')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-indigo-900 px-5 py-2.5 text-sm font-bold shadow-md transition hover:scale-[1.02] hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/50 whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4" />
                  Nuevo distribuidor
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/25"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Guardar filtro'}
              </button>
              <div className="flex overflow-hidden rounded-2xl border border-white/20">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Vista lista"
                  className={`inline-flex items-center px-3 py-2 text-sm transition ${viewMode === 'list' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  <QueueListIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Vista tarjetas"
                  className={`inline-flex items-center px-3 py-2 text-sm transition ${viewMode === 'cards' ? 'bg-white/30 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                >
                  <Squares2X2Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-2xl ${card.bg} dark:bg-slate-800/50 p-5 border ${card.border} dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none hover:translate-y-[-2px] transition-transform duration-300`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <span
                  className={`rounded-xl ${card.iconBg} p-2.5 ${card.iconColor}`}
                >
                  <card.icon className="h-5 w-5" />
                </span>
              </div>
              <p className={`text-3xl font-bold ${card.valueColor}`}>
                {card.value}
              </p>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {card.delta}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-6 shadow-lg shadow-slate-200/40 dark:shadow-none">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Filtrar red
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Buscar
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Nombre, código, localidad..."
                  className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-11 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Tipo de canal
              </label>
              <select
                value={channelFilter}
                onChange={handleChannelFilterChange}
                aria-label="Filtrar por tipo de canal"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todos</option>
                {channelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                aria-label="Filtrar por estado"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todos</option>
                {statusOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Prioridad
              </label>
              <select
                value={priorityFilter}
                onChange={handlePriorityFilterChange}
                aria-label="Filtrar por prioridad"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todas</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Sector
              </label>
              <select
                value={sectorFilter}
                onChange={(e) => setSectorFilter(e.target.value)}
                aria-label="Filtrar por sector"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todos</option>
                {sectors.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Provincia
              </label>
              <select
                value={provinceFilter}
                onChange={handleProvinceFilterChange}
                aria-label="Filtrar por provincia"
                className="w-full rounded-2xl border-0 bg-gray-100 dark:bg-gray-700/80 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 shadow-inner focus:outline-none focus:ring-2 focus:ring-pastel-indigo"
              >
                <option value="all">Todas</option>
                {provinceOptions.map((option) => (
                  <option
                    key={option.id || option.label}
                    value={option.id || option.label}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-white/70 dark:bg-gray-700/70 px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-white dark:hover:bg-gray-700"
              >
                Restablecer filtros
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 rounded-2xl border border-dashed border-pastel-indigo/40 bg-white/60 dark:bg-gray-700/60 p-4 text-xs text-gray-500 dark:text-gray-400">
              Próximamente podrás guardar filtros favoritos y compartirlos con
              tu equipo.
            </div>
          )}
        </section>

        {viewMode === 'list' ? (
          <section className="mt-8 overflow-x-auto rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-pastel-indigo/10 via-white dark:from-pastel-indigo/20 dark:via-slate-800 to-pastel-cyan/10 dark:to-pastel-cyan/20">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 ${header === 'Acciones' ? 'sticky right-0 text-right bg-gradient-to-l from-white via-white/95 to-white/90 dark:from-slate-800 dark:via-slate-800/95 dark:to-slate-800/90 z-20 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]' : 'text-left'}`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredDistributors.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No hay distribuidores que coincidan con los filtros
                        seleccionados.
                      </td>
                    </tr>
                  )}

                  {paginatedDistributors.map((distributor) => {
                    const channelLabel =
                      lookups.channels[distributor.channelType]?.label ??
                      distributor.channelType
                    const statusLabel =
                      lookups.statuses[distributor.status]?.label ??
                      distributor.status
                    const brands =
                      distributor.brands?.map(
                        (brandId: string) =>
                          lookups.brands[brandId]?.label ?? brandId
                      ) ?? []

                    return (
                      <tr
                        key={distributor.id}
                        className={`transition-colors ${getStatusTone(distributor.status).row}`}
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-indigo/30 to-pastel-cyan/20 text-sm font-semibold text-pastel-indigo">
                              {distributor.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/distributors/${distributor.id}`)
                                  }
                                  className="text-sm font-semibold text-gray-900 dark:text-white transition hover:text-pastel-indigo"
                                >
                                  {distributor.name}
                                </button>
                                {commissionAgreements.some(
                                  (a) =>
                                    String(a.distributorId) ===
                                    String(distributor.id)
                                ) && (
                                  <CurrencyEuroIcon
                                    className="h-4 w-4 text-pastel-green"
                                    title="Acuerdos de comisiones activos"
                                  />
                                )}
                              </div>
                              {distributor.contactPerson && (
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  Responsable:{' '}
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {distributor.contactPerson}
                                  </span>
                                </p>
                              )}
                              <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPinIcon className="h-4 w-4" />
                                {[distributor.city, distributor.province]
                                  .filter(Boolean)
                                  .join(', ') || 'Sin localización'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold tracking-widest text-gray-600 dark:text-gray-300">
                            {distributor.code || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 rounded-full bg-pastel-indigo/10 px-3 py-1 text-xs font-medium text-pastel-indigo">
                            <QueueListIcon className="h-4 w-4" />
                            {channelLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex gap-1.5">
                            {(distributor.sectors || ['telco']).map((sId) => {
                              const s = sectors.find((sec) => sec.id === sId)
                              return (
                                <span
                                  key={sId}
                                  title={s?.label}
                                  className="text-lg grayscale hover:grayscale-0 transition-all cursor-default"
                                >
                                  {s?.icon || '❓'}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {brands.map((brand: string) => (
                              <span
                                key={brand}
                                className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-inner"
                              >
                                {brand}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[distributor.status] ??
                              'bg-gray-200 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-current" />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {distributor.priorityLevel ? (
                            <div className="flex flex-col gap-2 text-sm">
                              <span
                                className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                                  priorityStyles[distributor.priorityLevel] ??
                                  'bg-gray-200 text-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {priorityLabels[distributor.priorityLevel] ??
                                  'Sin dato'}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-semibold text-gray-700 dark:text-gray-200">
                                  {Math.round(distributor.priorityScore ?? 0)}
                                </span>
                                <span>/100</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan distributor-priority-progress"
                                  data-progress={Math.max(
                                    5,
                                    Math.min(
                                      100,
                                      Math.round(distributor.priorityScore ?? 0)
                                    )
                                  )}
                                  role="progressbar"
                                  aria-label={`Prioridad ${Math.round(distributor.priorityScore ?? 0)} sobre 100`}
                                />
                              </div>
                              {distributor.priorityDrivers && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                  {`${distributor.priorityDrivers.salesLast90Days} ops · ${
                                    distributor.priorityDrivers.lastVisitDays !=
                                    null
                                      ? `${distributor.priorityDrivers.lastVisitDays} días sin visita`
                                      : 'Visita pendiente'
                                  }`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Sin datos
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-2 text-sm">
                            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan distributor-completion-progress"
                                data-progress={Math.round(
                                  (distributor.completion ?? 0) * 100
                                )}
                                role="progressbar"
                                aria-label={`Completitud: ${Math.round((distributor.completion ?? 0) * 100)}%`}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {Math.round((distributor.completion ?? 0) * 100)}%
                              completado
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-semibold text-gray-900 dark:text-white">
                          {distributor.salesYtd?.toLocaleString('es-ES') ?? '—'}
                        </td>
                        <td className="px-6 py-5 sticky right-0 bg-inherit z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-end gap-1.5 min-w-[190px]">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/distributors/${distributor.id}`)
                              }
                              title="Ver ficha"
                              className="p-2 rounded-xl bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20 transition"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('edit', distributor)}
                              title="Editar"
                              className="p-2 rounded-xl bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20 transition"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('visit', distributor)}
                              title="Registrar visita"
                              className="p-2 rounded-xl bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20 transition"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('sale', distributor)}
                              title="Registrar venta"
                              className="p-2 rounded-xl bg-pastel-indigo/10 text-pastel-indigo hover:bg-pastel-indigo/20 transition"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDistributorToDelete(distributor)
                              }
                              title="Eliminar"
                              className="p-2 rounded-xl bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20 transition"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="mt-8">
            {filteredDistributors.length === 0 ? (
              <div className="rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-16 text-center text-sm text-gray-500 dark:text-gray-400 shadow-lg">
                No hay distribuidores que coincidan con los filtros
                seleccionados.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedDistributors.map((distributor) => {
                  const channelLabel =
                    lookups.channels[distributor.channelType]?.label ??
                    distributor.channelType
                  const statusLabel =
                    lookups.statuses[distributor.status]?.label ??
                    distributor.status
                  const brands =
                    distributor.brands?.map(
                      (brandId: string) =>
                        lookups.brands[brandId]?.label ?? brandId
                    ) ?? []

                  return (
                    <article
                      key={distributor.id}
                      className={`flex flex-col gap-4 rounded-3xl border p-5 shadow-lg backdrop-blur transition-colors ${getStatusTone(distributor.status).card}`}
                    >
                      {/* Header: avatar + name + code + status + location */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pastel-indigo/30 to-pastel-cyan/20 text-sm font-semibold text-pastel-indigo">
                          {distributor.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/distributors/${distributor.id}`)
                              }
                              className="w-full truncate text-left text-sm font-semibold text-gray-900 dark:text-white transition hover:text-pastel-indigo"
                            >
                              {distributor.name}
                            </button>
                            {commissionAgreements.some(
                              (a) =>
                                String(a.distributorId) ===
                                String(distributor.id)
                            ) && (
                              <CurrencyEuroIcon
                                className="h-4 w-4 shrink-0 text-pastel-green"
                                title="Acuerdos de comisiones activos"
                              />
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold tracking-widest text-gray-600 dark:text-gray-300">
                              {distributor.code || '—'}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[distributor.status] ?? 'bg-gray-200 text-gray-600 dark:text-gray-400'}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {statusLabel}
                            </span>
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                            {[distributor.city, distributor.province]
                              .filter(Boolean)
                              .join(', ') || 'Sin localización'}
                          </p>
                        </div>
                      </div>

                      {/* Canal + Sectores */}
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-indigo/10 px-3 py-1 text-xs font-medium text-pastel-indigo">
                          <QueueListIcon className="h-3.5 w-3.5" />
                          {channelLabel}
                        </span>
                        <div className="flex gap-1">
                          {(distributor.sectors || ['telco']).map((sId) => {
                            const s = sectors.find((sec) => sec.id === sId)
                            return (
                              <span
                                key={sId}
                                title={s?.label}
                                className="cursor-default text-base grayscale transition-all hover:grayscale-0"
                              >
                                {s?.icon || '❓'}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      {/* Marcas */}
                      {brands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {brands.map((brand: string) => (
                            <span
                              key={brand}
                              className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-inner"
                            >
                              {brand}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Prioridad */}
                      {distributor.priorityLevel && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[distributor.priorityLevel] ?? 'bg-gray-200 text-gray-600 dark:text-gray-400'}`}
                          >
                            {priorityLabels[distributor.priorityLevel]}
                          </span>
                          <div className="flex flex-1 items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan distributor-priority-progress"
                                data-progress={Math.max(
                                  5,
                                  Math.min(
                                    100,
                                    Math.round(distributor.priorityScore ?? 0)
                                  )
                                )}
                                role="progressbar"
                                aria-label={`Prioridad ${Math.round(distributor.priorityScore ?? 0)} sobre 100`}
                              />
                            </div>
                            <span className="w-8 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">
                              {Math.round(distributor.priorityScore ?? 0)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Completitud */}
                      <div className="flex items-center gap-2">
                        <span className="w-20 shrink-0 text-xs text-gray-500 dark:text-gray-400">
                          Completitud
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan distributor-completion-progress"
                            data-progress={Math.round(
                              (distributor.completion ?? 0) * 100
                            )}
                            role="progressbar"
                            aria-label={`Completitud: ${Math.round((distributor.completion ?? 0) * 100)}%`}
                          />
                        </div>
                        <span className="w-9 text-right text-xs font-semibold text-gray-700 dark:text-gray-200">
                          {Math.round((distributor.completion ?? 0) * 100)}%
                        </span>
                      </div>

                      {/* Acciones */}
                      <div className="flex flex-wrap gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <ActionButton
                          icon={EyeIcon}
                          label="Ficha"
                          onClick={() =>
                            navigate(`/distributors/${distributor.id}`)
                          }
                        />
                        <ActionButton
                          icon={PencilSquareIcon}
                          label="Editar"
                          theme="cyan"
                          onClick={() => openModal('edit', distributor)}
                        />
                        <ActionButton
                          icon={CalendarIcon}
                          label="Visita"
                          theme="green"
                          onClick={() => openModal('visit', distributor)}
                        />
                        <ActionButton
                          icon={ChartBarIcon}
                          label="Venta"
                          theme="indigo"
                          onClick={() => openModal('sale', distributor)}
                        />
                        <ActionButton
                          icon={TrashIcon}
                          label=""
                          theme="danger"
                          onClick={() => setDistributorToDelete(distributor)}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {filteredDistributors.length > 0 && (
          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 px-5 py-4 shadow-lg shadow-slate-200/40 dark:shadow-none md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Mostrando</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                aria-label="Seleccionar cantidad por página"
                className="rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} por página
                  </option>
                ))}
              </select>
              <span>de {filteredDistributors.length} distribuidores</span>
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

        {activeModal && (
          <Modal
            title={modalMeta.title}
            maxWidth={modalMeta.maxWidth}
            onClose={closeModal}
          >
            {activeModal.type === 'create' && (
              <DistributorForm
                onSubmit={handleCreateDistributor}
                onCancel={closeModal}
              />
            )}

            {activeModal.type === 'edit' && (
              <DistributorForm
                initial={activeModal.distributor}
                onSubmit={handleEditDistributor(
                  String(activeModal.distributor?.id || '')
                )}
                onCancel={closeModal}
              />
            )}

            {activeModal.type === 'visit' && (
              <VisitForm
                distributor={activeModal.distributor ?? undefined}
                onSubmit={handleVisit}
                onCancel={closeModal}
              />
            )}

            {activeModal.type === 'sale' && activeModal.distributor && (
              <SaleForm
                distributor={{
                  ...activeModal.distributor,
                  brandPolicy: {
                    ...activeModal.distributor.brandPolicy,
                    allowed:
                      activeModal.distributor.brandPolicy.allowed ?? undefined
                  }
                }}
                onSubmit={handleSale}
                onCancel={closeModal}
              />
            )}
          </Modal>
        )}

        {distributorToDelete && (
          <Modal
            title="Eliminar distribuidor"
            maxWidth="max-w-md"
            onClose={() => setDistributorToDelete(null)}
          >
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
                ¿Seguro que quieres eliminar{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {distributorToDelete.name}
                </span>
                ? Se quitarán también sus visitas y ventas asociadas.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDistributorToDelete(null)}
                  className="rounded-2xl border border-gray-200 dark:border-gray-600 bg-white px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm hover:border-pastel-indigo/40 hover:text-pastel-indigo"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDistributor}
                  className="inline-flex items-center gap-2 rounded-2xl bg-pastel-red px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-pastel-red/90"
                >
                  <TrashIcon className="h-4 w-4" /> Eliminar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </PageContainer>
    </div>
  )
}

export default Distributors
