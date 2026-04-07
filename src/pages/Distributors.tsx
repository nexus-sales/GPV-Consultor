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
import { useDistributorsQuery } from '../lib/hooks/queries/useDistributorsQuery'
import { PageFallback } from '../router'
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
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  blocked: 'bg-red-50 text-red-600'
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
    card: 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
  }

const priorityStyles: Record<PriorityLevel, string> = {
  high: 'bg-red-50 text-red-600 border border-red-200',
  medium: 'bg-amber-50 text-amber-700 border border-amber-200',
  low: 'bg-cyan-50 text-cyan-700 border border-cyan-200'
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
    indigo:
      'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20',
    cyan: 'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20',
    green:
      'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20',
    danger:
      'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20'
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

const distHealthColorMap: Record<string, { dot: string; text: string }> = {
  red: {
    dot: 'bg-red-500 shadow-red-500/50',
    text: 'text-red-600 dark:text-red-400'
  },
  orange: {
    dot: 'bg-orange-500 shadow-orange-500/50',
    text: 'text-orange-600 dark:text-orange-400'
  },
  emerald: {
    dot: 'bg-emerald-500 shadow-emerald-500/50',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  blue: {
    dot: 'bg-blue-500 shadow-blue-500/50',
    text: 'text-blue-600 dark:text-blue-400'
  }
}

const Distributors: React.FC = () => {
  const navigate = useNavigate()
  const { data: distributors = [], isLoading, isError } = useDistributorsQuery()

  const {
    visits,
    sales,
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

  // --- LÓGICA SMART HEALTH SCORE ---
  const getHealthStatus = useMemo(
    () => (distId: string | number) => {
      const distVisits = visits
        .filter((v) => String(v.distributorId) === String(distId))
        .sort((a, b) => b.date.localeCompare(a.date))

      const lastVisit = distVisits[0]
      const daysSinceLastVisit = lastVisit
        ? Math.floor(
            (new Date().getTime() - new Date(lastVisit.date).getTime()) /
              (1000 * 3600 * 24)
          )
        : 999

      const distSales = sales.filter(
        (s) => String(s.distributorId) === String(distId)
      )
      const hasRecentSales = distSales.length > 0

      if (daysSinceLastVisit > 21)
        return { label: 'Crítico', color: 'red', score: 10 }
      if (daysSinceLastVisit > 14)
        return { label: 'Riesgo', color: 'orange', score: 30 }
      if (daysSinceLastVisit <= 7 && hasRecentSales)
        return { label: 'Excelente', color: 'emerald', score: 90 }
      return { label: 'Estable', color: 'blue', score: 60 }
    },
    [visits, sales]
  )

  const criticalPoints = useMemo(() => {
    return distributors
      .map((d) => ({ ...d, health: getHealthStatus(d.id) }))
      .filter((d) => d.health.color === 'red')
      .slice(0, 3)
  }, [distributors, getHealthStatus])
  // ---------------------------------
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
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-gray-200 dark:border-gray-800',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        iconColor: 'text-indigo-600 dark:text-indigo-300',
        valueColor: 'text-indigo-700 dark:text-indigo-300',
        icon: ChartBarIcon
      },
      {
        title: 'Visitas últimos 7 días',
        value: stats.visitsLast7Days.toString(),
        delta: 'Seguimiento comercial reciente',
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-gray-200 dark:border-gray-800',
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
        bg: 'bg-white dark:bg-gray-900',
        border: 'border-gray-200 dark:border-gray-800',
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

  const handleVisit = async (payload: NewVisit): Promise<void> => {
    await addVisit({
      ...payload,
      scheduledTime: payload.scheduledTime
    })
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
    'Salud',
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

  if (isLoading) {
    return <PageFallback />
  }

  if (isError) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <p className="text-red-500 font-medium">Error al cargar distribuidores</p>
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
    <div>
      <PageContainer size="ultra" className="py-10">
        {/* Radar de Salud / Foco Comercial */}
        {criticalPoints.length > 0 && (
          <section className="mt-8 rounded-3xl bg-red-50 p-6 border-2 border-red-100 dark:bg-red-950/20 dark:border-red-900/30 animate-pulse-slow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500 rounded-xl text-white shadow-lg shadow-red-500/30">
                <ChartBarIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 dark:text-red-100 uppercase tracking-tight">
                  Detectados puntos críticos de abandono
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Estos distribuidores llevan más de 21 días sin ser visitados.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {criticalPoints.map((point) => (
                <div
                  key={point.id}
                  className="bg-white/80 dark:bg-slate-900/50 p-4 rounded-2xl flex items-center justify-between border border-red-200 dark:border-red-800"
                >
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {point.name}
                    </div>
                    <div className="text-[10px] text-red-600 font-medium">
                      Urgente agendar visita
                    </div>
                  </div>
                  <button
                    onClick={() => openModal('visit', point)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                  >
                    <CalendarIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Red de distribución
            </p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              Distribuidores
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              Monitorea el estado de cada partner, organiza visitas y asegura la
              cobertura completa sobre las islas.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <span className="rounded-xl bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {stats.activeDistributors} activos · {stats.pendingDistributors}{' '}
                pendientes
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
                        ops.push(updateDistributor(dist.existingId, updateData))
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
                className="inline-flex items-center gap-2 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 whitespace-nowrap"
              >
                <PlusIcon className="h-4 w-4" />
                Nuevo distribuidor
              </button>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowFilters((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                {showFilters ? 'Ocultar filtros' : 'Filtros'}
              </button>
              <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Vista lista"
                  className={`inline-flex items-center px-3 py-2 text-sm transition-colors ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <QueueListIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  title="Vista tarjetas"
                  className={`inline-flex items-center px-3 py-2 text-sm transition-colors border-l border-gray-200 dark:border-gray-700 ${viewMode === 'cards' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
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
              className="rounded-2xl bg-white dark:bg-gray-800 p-5 border border-gray-200 dark:border-gray-700 shadow-sm"
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

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-11 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600"
              >
                Restablecer filtros
              </button>
            </div>
          </div>
          {showFilters && (
            <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              Próximamente podrás guardar filtros favoritos y compartirlos con
              tu equipo.
            </div>
          )}
        </section>

        {viewMode === 'list' ? (
          <section className="mt-8 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="min-w-[1200px]">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/80">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        className={`px-6 py-4 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 ${header === 'Acciones' ? 'sticky right-0 z-20 bg-gray-50 text-right dark:bg-gray-900/80' : 'text-left'}`}
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
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                              {distributor.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/distributors/${distributor.id}`)
                                  }
                                  className="text-sm font-semibold text-gray-900 dark:text-white transition hover:text-indigo-600 dark:hover:text-indigo-300"
                                >
                                  {distributor.name}
                                </button>
                                {commissionAgreements.some(
                                  (a) =>
                                    String(a.distributorId) ===
                                    String(distributor.id)
                                ) && (
                                  <CurrencyEuroIcon
                                    className="h-4 w-4 text-emerald-600"
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
                          {(() => {
                            const health = getHealthStatus(distributor.id)
                            return (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2 w-2 rounded-full animate-pulse shadow-[0_0_8px] ${distHealthColorMap[health.color]?.dot ?? 'bg-gray-500 shadow-gray-500/50'}`}
                                ></span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-tight ${distHealthColorMap[health.color]?.text ?? 'text-gray-600 dark:text-gray-400'}`}
                                >
                                  {health.label}
                                </span>
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold tracking-widest text-gray-600 dark:text-gray-300">
                            {distributor.code || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
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
                                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
                                  className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 distributor-priority-progress"
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
                                className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 distributor-completion-progress"
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
                              className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('edit', distributor)}
                              title="Editar"
                              className="rounded-xl bg-cyan-50 p-2 text-cyan-600 transition hover:bg-cyan-100 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('visit', distributor)}
                              title="Registrar visita"
                              className="rounded-xl bg-emerald-50 p-2 text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openModal('sale', distributor)}
                              title="Registrar venta"
                              className="rounded-xl bg-indigo-50 p-2 text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                            >
                              <ChartBarIcon className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDistributorToDelete(distributor)
                              }
                              title="Eliminar"
                              className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
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
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-16 text-center text-sm text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
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
                      className={`flex flex-col gap-4 rounded-xl border p-5 transition-colors ${getStatusTone(distributor.status).card}`}
                    >
                      {/* Header: avatar + name + code + status + location */}
                      <div className="flex items-start gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                          {distributor.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/distributors/${distributor.id}`)
                              }
                              className="w-full truncate text-left text-sm font-semibold text-gray-900 transition hover:text-indigo-600 dark:text-white dark:hover:text-indigo-300"
                            >
                              {distributor.name}
                            </button>
                            {commissionAgreements.some(
                              (a) =>
                                String(a.distributorId) ===
                                String(distributor.id)
                            ) && (
                              <CurrencyEuroIcon
                                className="h-4 w-4 shrink-0 text-emerald-600"
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
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
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
                              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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
                                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 distributor-priority-progress"
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
                            className="h-2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 distributor-completion-progress"
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
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
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
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteDistributor}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
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
