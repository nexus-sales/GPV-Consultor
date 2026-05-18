import React, { useState, useMemo } from 'react'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../lib/useAppData'
import { PageContainer } from '../components/layout/PageContainer'
import Table from '../components/Table'
import Modal from '../components/ui/Modal'
import { SaleForm } from '../components/SaleForm'
import { SaleStatus, SaleSector, EntityId } from '../lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { exportSales } from '../lib/utils/excel'

const STATUS_COLORS: Record<SaleStatus, string> = {
  Enviado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Pendiente:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Scoring:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Aceptado: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Activado:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Baja: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
}

export default function Sales() {
  const { sales, distributors, addSale } = useAppData()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all')
  const [sectorFilter, setSectorFilter] = useState<SaleSector | 'all'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDistributorId, setSelectedDistributorId] =
    useState<EntityId>('')

  const selectedDistributor = useMemo(
    () =>
      distributors.find((d) => String(d.id) === String(selectedDistributorId)),
    [distributors, selectedDistributorId]
  )

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        (sale.nombreCliente?.toLowerCase() ?? '').includes(
          searchTerm.toLowerCase()
        ) ||
        (sale.distributorName?.toLowerCase() ?? '').includes(
          searchTerm.toLowerCase()
        ) ||
        (sale.documento?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' || sale.status === statusFilter
      const matchesSector =
        sectorFilter === 'all' || sale.sector === sectorFilter

      return matchesSearch && matchesStatus && matchesSector
    })
  }, [sales, searchTerm, statusFilter, sectorFilter])

  // Adaptar datos para el componente Table genérico que usa Record<string, unknown>
  const tableData = useMemo(() => {
    return filteredSales.map((sale) => {
      const fechaCierreRaw = sale.fechaCierre || sale.date
      const fecha = fechaCierreRaw
        ? format(new Date(fechaCierreRaw), 'dd MMM yyyy', { locale: es })
        : '-'

      return {
        id: String(sale.id),
        fecha,
        distributor: (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white">
              {sale.distributorName}
            </span>
            <span className="text-xs text-gray-500">
              {sale.distributorCode}
            </span>
          </div>
        ) as unknown as string,
        cliente: (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {sale.nombreCliente || 'N/A'}
            </span>
            <span className="text-xs text-gray-400">
              {sale.documento} ({sale.tipoDocumento})
            </span>
          </div>
        ) as unknown as string,
        sector: (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                {sale.sector}
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                {sale.modo}
              </span>
            </div>
          </div>
        ) as unknown as string,
        estado: (
          <div className="flex flex-col gap-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[sale.status] || ''}`}
            >
              {sale.status}
            </span>
          </div>
        ) as unknown as string
      }
    })
  }, [filteredSales])

  const columns = [
    { key: 'fecha', label: 'Fecha' },
    { key: 'distributor', label: 'Distribuidor' },
    { key: 'cliente', label: 'Cliente / Documento' },
    { key: 'sector', label: 'Sector / Modo' },
    { key: 'estado', label: 'Estado' }
  ]

  return (
    <PageContainer className="py-10 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Control de Pedidos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Seguimiento de ventas y estados de activación por distribuidor.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportSales(sales)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Exportar Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <PlusIcon className="h-5 w-5" />
            Nuevo Pedido
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Filtros rápidos o Resumen ligero */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Mes
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {sales.length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pendientes
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {sales.filter((s) => s.status === 'Pendiente').length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Activados
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {sales.filter((s) => s.status === 'Activado').length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Bajas
          </p>
          <p className="mt-1 text-2xl font-bold text-red-600">
            {sales.filter((s) => s.status === 'Baja').length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white/50 p-2 shadow-sm backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center gap-4 p-4">
          <div className="relative flex-1 min-w-[240px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o distribuidor..."
              className="w-full rounded-xl border-gray-200 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            title="Filtrar por estado"
            className="rounded-xl border-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as SaleStatus | 'all')
            }
          >
            <option value="all">Todos los estados</option>
            <option value="Enviado">Enviado</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Scoring">Scoring</option>
            <option value="Aceptado">Aceptado</option>
            <option value="Activado">Activado</option>
            <option value="Baja">Baja</option>
          </select>

          <select
            title="Filtrar por sector"
            className="rounded-xl border-gray-200 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
            value={sectorFilter}
            onChange={(e) =>
              setSectorFilter(e.target.value as SaleSector | 'all')
            }
          >
            <option value="all">Todos los sectores</option>
            <option value="Alarma">Alarma</option>
            <option value="Energía">Energía</option>
            <option value="Telefonía">Telefonía</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <Table data={tableData} columns={columns} />
      </div>

      {isModalOpen && (
        <Modal
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDistributorId('')
          }}
          title="Registrar Nuevo Pedido"
        >
          <div className="space-y-6">
            {!selectedDistributorId ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecciona el Distribuidor responsable *
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
                  {distributors.map((dist) => (
                    <button
                      key={dist.id}
                      onClick={() => setSelectedDistributorId(dist.id)}
                      className="flex items-center justify-between p-3 text-left rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all font-medium text-gray-900 dark:text-white"
                    >
                      <div className="flex flex-col">
                        <span>{dist.name}</span>
                        <span className="text-xs text-gray-500">
                          {dist.code} - {dist.city}
                        </span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 -rotate-90 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <SaleForm
                distributor={selectedDistributor}
                onSubmit={async (data) => {
                  await addSale(data)
                  setIsModalOpen(false)
                  setSelectedDistributorId('')
                }}
                onCancel={() => {
                  setSelectedDistributorId('')
                }}
              />
            )}
          </div>
        </Modal>
      )}
    </PageContainer>
  )
}
