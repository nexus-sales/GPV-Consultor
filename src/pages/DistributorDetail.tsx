import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  MapPinIcon,
  QueueListIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  CurrencyEuroIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import Modal from '../components/ui/Modal'
import DistributorForm from '../components/DistributorForm'
import { VisitForm } from '../components/VisitForm'
import { SaleForm } from '../components/SaleForm'
import { useAppData } from '../lib/useAppData'
import NotesHistory from '../components/NotesHistory'
import PVPTEChecklist from '../components/PVPTEChecklist'
import type {
  Distributor,
  Visit,
  Sale,
  NewVisit,
  NewSale,
  DistributorUpdates,
  DistributorStatus,
  LookupOption,
  NoteEntry,
  NoteCategory
} from '../lib/types'

// Interfaces del componente
interface TimelineEvent {
  id: string
  type: 'visit' | 'sale'
  date: string
  label: string
  description: string
  relative: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
  meta?: Array<{ label: string; value: string }>
}

interface ChecklistItem {
  key: string
  label: string
  done: boolean
}

interface ModalState {
  type: 'edit' | 'visit' | 'sale'
  distributor: Distributor
}

interface SummaryStatProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
}

interface ContactItemProps {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
}

interface BrandListProps {
  title: string
  items: LookupOption[]
  tone: 'success' | 'warning' | 'danger'
  empty: string
}

interface ActionButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
}

// Constantes de estilo
const chipBase =
  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest'

const statusStyles: Record<string, string> = {
  active: 'bg-pastel-green/10 text-pastel-green border border-pastel-green/30',
  pending:
    'bg-pastel-yellow/10 text-pastel-yellow border border-pastel-yellow/30',
  blocked: 'bg-pastel-red/10 text-pastel-red border border-pastel-red/30'
}

const actionButtonStyles: Record<string, string> = {
  primary: 'bg-pastel-indigo text-white hover:bg-pastel-indigo/90',
  secondary: 'bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20',
  success: 'bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20',
  danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20',
  ghost:
    'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-pastel-indigo/40 hover:text-pastel-indigo'
}

const DistributorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    distributors,
    visits,
    sales,
    updateDistributor,
    addVisit,
    addSale,
    formatters,
    lookups,
    statusOptions,
    sectors
  } = useAppData()

  const distributor = useMemo(
    () => distributors.find((item: Distributor) => String(item.id) === id),
    [distributors, id]
  )

  const [statusDraft, setStatusDraft] = useState<string>(
    distributor?.status ?? 'pending'
  )
  const [savingNotes] = useState<boolean>(false)
  const [savingStatus, setSavingStatus] = useState<boolean>(false)
  const [activeModal, setActiveModal] = useState<ModalState | null>(null)

  useEffect(() => {
    if (distributor) {
      setStatusDraft(distributor.status ?? 'pending')
    }
  }, [distributor])

  const distributorVisits = useMemo(() => {
    return visits
      .filter(
        (visit: Visit) =>
          String(visit.distributorId) === String(distributor?.id)
      )
      .sort(
        (a: Visit, b: Visit) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
  }, [visits, distributor?.id])

  const distributorSales = useMemo(() => {
    return sales
      .filter(
        (sale: Sale) => String(sale.distributorId) === String(distributor?.id)
      )
      .sort(
        (a: Sale, b: Sale) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      )
  }, [sales, distributor?.id])

  const lastVisit = distributorVisits[0]
  const totalOperations = useMemo(
    () =>
      distributorSales.reduce(
        (acc: number, sale: Sale) => acc + (sale.operations || 0),
        0
      ),
    [distributorSales]
  )

  const timelineEvents = useMemo((): TimelineEvent[] => {
    if (!distributor) return []

    const visitEvents: TimelineEvent[] = distributorVisits.map(
      (visit: Visit) => ({
        id: `visit-${visit.id}`,
        type: 'visit' as const,
        date: visit.date,
        label: `Visita ${visit.type}`,
        description: visit.summary || visit.objective || 'Visita registrada',
        relative: formatters.relative(visit.date),
        icon: CalendarIcon,
        tone: 'text-pastel-indigo',
        meta: [
          { label: 'Resultado', value: visit.result },
          { label: 'Duración', value: `${visit.durationMinutes} min` }
        ]
      })
    )

    const saleEvents: TimelineEvent[] = distributorSales.map((sale: Sale) => ({
      id: `sale-${sale.id}`,
      type: 'sale' as const,
      date: sale.fechaCierre || sale.date,
      label: `Pedido: ${sale.nombreCliente || 'Sin nombre'}`,
      description: sale.observaciones || sale.notes || 'Pedido registrado',
      relative: formatters.relative(sale.fechaCierre || sale.date),
      icon: ChartBarIcon,
      tone: sale.status === 'Activado' ? 'text-pastel-green' : 'text-pastel-cyan',
      meta: [
        { label: 'Estado', value: sale.status },
        { label: 'Sector', value: sale.sector },
        { label: 'Documento', value: sale.documento || '-' }
      ]
    }))

    return [...visitEvents, ...saleEvents].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [
    distributor,
    distributorVisits,
    distributorSales,
    formatters,
    lookups.brands
  ])

  const checklistItems = useMemo((): ChecklistItem[] => {
    if (!distributor) return []
    return [
      {
        key: 'contact',
        label: 'Datos de contacto registrados',
        done: Boolean(distributor.phone || distributor.email)
      },
      {
        key: 'responsible',
        label: 'Responsables definidos',
        done: Boolean(distributor.contactPerson)
      },
      {
        key: 'location',
        label: 'Ciudad y provincia definidas',
        done: Boolean(distributor.city && distributor.province)
      },
      {
        key: 'brands',
        label: 'Portafolio de marcas configurado',
        done: Boolean(distributor.brands?.length)
      },
      {
        key: 'notes',
        label: 'Notas comerciales actualizadas',
        done: Boolean(distributor.notes)
      },
      {
        key: 'documentation',
        label: 'Checklist documental completado',
        done: !distributor.pendingData
      }
    ]
  }, [distributor])

  const completedChecklist = checklistItems.filter((item) => item.done).length
  const checklistProgress = checklistItems.length
    ? Math.round((completedChecklist / checklistItems.length) * 100)
    : 0

  const missingFields = useMemo(() => {
    if (!distributor) return []
    const pendings: string[] = []
    if (!distributor.contactPerson) pendings.push('Responsable principal')
    if (!distributor.phone) pendings.push('Teléfono de contacto')
    if (!distributor.email) pendings.push('Email de contacto')
    if (!distributor.city || !distributor.province)
      pendings.push('Información de localización')
    if (!distributor.brands?.length) pendings.push('Asignación de marcas')
    if (distributor.pendingData) pendings.push('Checklist documental PVPTE')
    return pendings
  }, [distributor])

  const channelLabel = distributor
    ? (lookups.channels[distributor.channelType]?.label ??
      distributor.channelType)
    : ''
  const statusLabel = distributor
    ? (lookups.statuses[distributor.status]?.label ?? distributor.status)
    : ''
  const brandPolicy = distributor?.brandPolicy

  const mapBrandIds = (ids?: string[]): LookupOption[] => {
    if (!ids || !ids.length) return []
    return ids.map((brandId) => ({
      id: brandId,
      label: lookups.brands[brandId]?.label ?? brandId
    }))
  }

  const allowedBrands = mapBrandIds(brandPolicy?.allowed ?? undefined)
  const blockedBrands = mapBrandIds(brandPolicy?.blocked ?? [])
  const conditionalBrands = mapBrandIds(brandPolicy?.conditional ?? [])

  // Handlers
  const handleAddNote = async (
    content: string,
    category?: NoteCategory
  ): Promise<void> => {
    if (!distributor) return

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}`,
      title: 'Nota',
      content,
      timestamp: new Date().toISOString(),
      author: 'Usuario',
      category: category || 'general'
    }

    const updatedHistory = [...(distributor.notesHistory || []), newEntry]

    updateDistributor(distributor.id, {
      notesHistory: updatedHistory,
      notes: content
    })
  }

  const handleStatusUpdate = (): void => {
    if (!distributor) return
    if (statusDraft === distributor.status) return
    setSavingStatus(true)
    updateDistributor(distributor.id, {
      status: statusDraft as DistributorStatus
    })
    setSavingStatus(false)
  }

  const handleModalClose = (): void => setActiveModal(null)

  const handleVisitSubmit = (payload: NewVisit): void => {
    addVisit(payload)

    // Agregar automáticamente una nota sobre la visita
    if (distributor && payload.type && payload.date) {
      const visitTypeLabels: Record<string, string> = {
        presentacion: 'Presentación',
        seguimiento: 'Seguimiento',
        formacion: 'Formación',
        incidencias: 'Incidencias',
        apertura: 'Apertura'
      }

      const noteContent = `Visita: ${visitTypeLabels[payload.type] || payload.type}
Fecha: ${new Date(payload.date).toLocaleDateString('es-ES')}
Objetivo: ${payload.objective || 'No especificado'}
${payload.summary ? `\nResumen: ${payload.summary}` : ''}
${payload.nextSteps ? `\nPróximos pasos: ${payload.nextSteps}` : ''}`

      handleAddNote(noteContent, 'visita')
    }

    setActiveModal(null)
  }

  const handleSaleSubmit = (payload: NewSale): void => {
    addSale(payload)
    setActiveModal(null)
  }

  const handleNavigateBack = (): void => {
    navigate(-1)
  }

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusDraft(event.target.value)
  }

  if (!distributor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <PageContainer size="narrow" className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-red-100 dark:border-red-900/30 bg-white/90 dark:bg-gray-800/90 p-8 shadow-lg">
            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-pastel-red" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Distribuidor no encontrado
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No localizamos la ficha solicitada. Confirma que el enlace sigue
              disponible o regresa al listado para seleccionarla de nuevo.
            </p>
            <button
              type="button"
              onClick={handleNavigateBack}
              className="inline-flex items-center gap-2 rounded-2xl bg-pastel-indigo px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-indigo/90"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Volver
            </button>
          </div>
        </PageContainer>
      </div>
    )
  }

  const category = distributor.category
  const lastVisitLabel = lastVisit
    ? formatters.relative(lastVisit.date)
    : 'Sin visitas registradas'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PageContainer className="py-10">
        <button
          type="button"
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 shadow-sm transition hover:border-pastel-indigo/40 hover:text-pastel-indigo"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Volver a distribuidores
        </button>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6">
            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-pastel-indigo">
                    Ficha del distribuidor
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {distributor.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 text-pastel-indigo" />
                    {[distributor.city, distributor.province]
                      .filter(Boolean)
                      .join(', ') || 'Localización no registrada'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal({ type: 'edit', distributor })}
                    className="mr-2 inline-flex items-center gap-1.5 rounded-xl border border-pastel-indigo/20 bg-pastel-indigo/5 px-3 py-1.5 text-xs font-semibold text-pastel-indigo transition hover:bg-pastel-indigo/10"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Editar ficha
                  </button>
                  <span
                    className={`${chipBase} bg-pastel-indigo/10 text-pastel-indigo`}
                    title="Tipo de canal"
                  >
                    <QueueListIcon className="h-3.5 w-3.5" />
                    {channelLabel}
                  </span>
                  <span
                    className={`${chipBase} ${statusStyles[distributor.status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'}`}
                    title="Estado operativo"
                  >
                    {statusLabel}
                  </span>
                  {category && (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${category.badgeClass}`}
                      title={category.tooltip}
                    >
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                      {category.label}
                    </span>
                  )}
                  <span
                    className={`${chipBase} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`}
                  >
                    {distributor.code || 'SIN CÓDIGO'}
                  </span>
                  {(distributor.sectors || []).map((sId) => {
                    const sector = sectors.find((s) => s.id === sId)
                    return (
                      <span
                        key={sId}
                        className={`${chipBase} bg-pastel-cyan/10 text-pastel-cyan`}
                        title="Sector"
                      >
                        {sector?.icon && <span>{sector.icon}</span>}
                        {sector?.label || sId}
                      </span>
                    )
                  })}
                </div>
              </div>

              {distributor.pendingData && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-pastel-yellow/30 bg-pastel-yellow/10 px-5 py-4 text-sm text-pastel-yellow">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      Checklist documental pendiente
                    </p>
                    <p className="text-xs text-pastel-yellow/80">
                      Completa los requisitos PVPTE para habilitar la oferta
                      completa de marcas. Registra el avance en la sección de
                      notas cuando lo tengas.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SummaryStat
                  label="Última visita"
                  value={
                    lastVisit
                      ? `${lastVisit.date} • ${lastVisitLabel}`
                      : 'Sin visitas'
                  }
                  icon={CalendarIcon}
                />
                <SummaryStat
                  label="Operaciones YTD"
                  value={`${distributor.salesYtd?.toLocaleString('es-ES') ?? 0} unidades`}
                  icon={ChartBarIcon}
                />
                <SummaryStat
                  label="Completitud"
                  value={`${Math.round((distributor.completion ?? 0) * 100)}%`}
                  icon={CheckCircleIcon}
                />
              </div>
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Datos de contacto
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModal({ type: 'edit', distributor })}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:border-pastel-indigo/40 hover:text-pastel-indigo transition-colors"
                    title="Editar datos de contacto"
                  >
                    <PencilSquareIcon className="h-3 w-3" />
                    Editar
                  </button>
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Canal
                </span>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                <ContactItem
                  label="Responsable principal"
                  value={distributor.contactPerson || 'No asignado'}
                  icon={UserCircleIcon}
                />
                <ContactItem
                  label="Contacto de apoyo"
                  value={distributor.contactPersonBackup || 'No registrado'}
                  icon={UserCircleIcon}
                />
                <ContactItem
                  label="Teléfono"
                  value={distributor.phone || 'No registrado'}
                  icon={PhoneIcon}
                  href={
                    distributor.phone ? `tel:${distributor.phone}` : undefined
                  }
                />
                <ContactItem
                  label="Email"
                  value={distributor.email || 'No registrado'}
                  icon={EnvelopeIcon}
                  href={
                    distributor.email
                      ? `mailto:${distributor.email}`
                      : undefined
                  }
                />
                <ContactItem
                  label="Ciudad"
                  value={distributor.city || 'No indicada'}
                  icon={MapPinIcon}
                />
                <ContactItem
                  label="Provincia"
                  value={distributor.province || 'No indicada'}
                  icon={MapPinIcon}
                />
              </div>
            </article>

            <NotesHistory
              history={distributor.notesHistory || []}
              onAddNote={handleAddNote}
              loading={savingNotes}
              placeholder="Registra hallazgos comerciales, acuerdos, visitas o incidencias..."
              title="Notas comerciales"
            />

            {/* Checklist PVPTE - Solo para distribuidores con external_code PVPTE */}
            {distributor.externalCode === 'PVPTE' && (
              <PVPTEChecklist distributor={distributor} />
            )}

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Política de marcas
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModal({ type: 'edit', distributor })}
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-500 hover:border-pastel-indigo/40 hover:text-pastel-indigo transition-colors"
                    title="Editar política de marcas"
                  >
                    <PencilSquareIcon className="h-3 w-3" />
                    Editar
                  </button>
                </div>
                <ShieldCheckIcon className="h-5 w-5 text-pastel-indigo" />
              </header>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {(brandPolicy && 'note' in brandPolicy
                  ? brandPolicy.note
                  : undefined) ||
                  'Aplica la política estándar adecuada a la taxonomía detectada. Confirma con el partner cualquier excepción.'}
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <BrandList
                  title="Permitidas"
                  tone="success"
                  items={allowedBrands}
                  empty="Todas"
                />
                <BrandList
                  title="Condicionales"
                  tone="warning"
                  items={conditionalBrands}
                  empty="Validación interna"
                />
                <BrandList
                  title="Bloqueadas"
                  tone="danger"
                  items={blockedBrands}
                  empty="Ninguna"
                />
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {(distributor.brands ?? []).map((brandId: string) => (
                  <span
                    key={brandId}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-[11px] font-semibold text-gray-700 dark:text-gray-300"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5 text-pastel-indigo" />
                    {lookups.brands[brandId]?.label ?? brandId}
                  </span>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad reciente
                </h2>
                <span className="text-xs uppercase tracking-widest text-gray-400">
                  Visitas & ventas
                </span>
              </header>

              {timelineEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/70 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-6 w-6 text-gray-400" />
                  <p>
                    Sin actividad registrada todavía. Agenda una visita o
                    registra ventas para iniciar el historial.
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {timelineEvents.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-4 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-semibold shadow-inner ${event.tone}`}
                        >
                          <event.icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event.label}
                            </p>
                            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                              {event.relative}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {event.description}
                          </p>
                          {event.meta && (
                            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                              {event.meta.map((metaItem) => (
                                <div
                                  key={metaItem.label}
                                  className="flex items-center gap-1 rounded-full bg-white/70 dark:bg-gray-700/70 dark:bg-gray-700/70 dark:bg-gray-700/70 px-3 py-1"
                                >
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                                    {metaItem.label}:
                                  </span>
                                  <span>{metaItem.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>

          <aside className="space-y-6">
            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones rápidas
                </h2>
                <PencilSquareIcon className="h-5 w-5 text-pastel-indigo" />
              </header>
              <div className="flex flex-col gap-3">
                <ActionButton
                  onClick={() => setActiveModal({ type: 'edit', distributor })}
                  variant="primary"
                >
                  <PencilSquareIcon className="h-4 w-4" /> Editar distribuidor
                </ActionButton>
                <ActionButton
                  onClick={() => setActiveModal({ type: 'visit', distributor })}
                  variant="secondary"
                >
                  <CalendarIcon className="h-4 w-4" /> Registrar visita
                </ActionButton>
                <ActionButton
                  onClick={() => setActiveModal({ type: 'sale', distributor })}
                  variant="success"
                >
                  <CurrencyEuroIcon className="h-4 w-4" /> Registrar venta
                </ActionButton>
              </div>
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Estado operativo
                </h2>
                <span className="text-xs uppercase tracking-widest text-gray-400">
                  Workflow
                </span>
              </header>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Estado actual
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  value={statusDraft}
                  onChange={handleStatusChange}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-pastel-indigo/50 focus:outline-none focus:ring-2 focus:ring-pastel-indigo/30"
                  aria-label="Seleccionar estado operativo"
                >
                  {statusOptions.map((option: LookupOption) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={savingStatus || statusDraft === distributor.status}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    statusDraft === distributor.status
                      ? 'cursor-not-allowed border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400'
                      : 'bg-pastel-indigo text-white shadow-md hover:bg-pastel-indigo/90'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" /> Actualizar estado
                </button>
              </div>
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Checklist de cobertura
                </h2>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {checklistProgress}%
                </span>
              </header>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                {/* Inline style required for dynamic checklist progress - see docs/CSS_INLINE_STYLES.md */}
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan transition-all duration-300"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li
                    key={item.key}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      item.done
                        ? 'border-pastel-green/30 bg-pastel-green/10 text-pastel-green'
                        : 'border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.done ? (
                      <CheckCircleIcon className="mt-0.5 h-4 w-4" />
                    ) : (
                      <ClipboardDocumentCheckIcon className="mt-0.5 h-4 w-4" />
                    )}
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
              {missingFields.length > 0 && (
                <div className="mt-4 rounded-2xl border border-pastel-red/30 bg-pastel-red/10 p-4 text-xs text-pastel-red">
                  <p className="font-semibold">Pendientes prioritarios</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {missingFields.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumen numérico
                </h2>
                <ChartBarIcon className="h-5 w-5 text-pastel-indigo" />
              </header>
              <dl className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">
                    Operaciones registradas
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {totalOperations.toLocaleString('es-ES')}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">
                    Completitud
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {Math.round((distributor.completion ?? 0) * 100)}%
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">
                    Ventas YTD
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {distributor.salesYtd?.toLocaleString('es-ES', {
                      style: 'currency',
                      currency: 'EUR',
                      minimumFractionDigits: 0
                    }) ?? '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-gray-500 dark:text-gray-400">
                    Visitas registradas
                  </dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">
                    {distributorVisits.length}
                  </dd>
                </div>
              </dl>
            </article>
          </aside>
        </div>
      </PageContainer>

      {activeModal && (
        <Modal
          title={
            activeModal.type === 'edit'
              ? `Editar distribuidor • ${distributor.name}`
              : activeModal.type === 'visit'
                ? `Registrar visita • ${distributor.name}`
                : `Registrar venta • ${distributor.name}`
          }
          maxWidth={activeModal.type === 'edit' ? 'max-w-3xl' : 'max-w-xl'}
          onClose={handleModalClose}
        >
          {activeModal.type === 'edit' && (
            <DistributorForm
              initial={distributor}
              onSubmit={(payload: DistributorUpdates) => {
                if (distributor?.id) {
                  updateDistributor(distributor.id, payload)
                }
                setActiveModal(null)
              }}
              onCancel={handleModalClose}
            />
          )}
          {activeModal.type === 'visit' && distributor && (
            <VisitForm
              distributor={distributor}
              onSubmit={handleVisitSubmit}
              onCancel={handleModalClose}
            />
          )}
          {activeModal.type === 'sale' && distributor && (
            <SaleForm
              distributor={{
                ...distributor,
                brandPolicy: {
                  ...distributor.brandPolicy,
                  allowed: distributor.brandPolicy.allowed ?? undefined
                }
              }}
              onSubmit={handleSaleSubmit}
              onCancel={handleModalClose}
            />
          )}
        </Modal>
      )}
    </div>
  )
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, icon }) => {
  const IconComponent = icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
      <IconComponent className="h-5 w-5 text-pastel-indigo" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-1 font-semibold text-gray-800 dark:text-white">{value}</p>
      </div>
    </div>
  )
}

const ContactItem: React.FC<ContactItemProps> = ({
  label,
  value,
  icon,
  href
}) => {
  const IconComponent = icon
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
      <IconComponent className="h-5 w-5 text-pastel-indigo" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 block font-semibold text-pastel-indigo hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-gray-800 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  )
}

const BrandList: React.FC<BrandListProps> = ({ title, items, tone, empty }) => {
  const tones = {
    success:
      'bg-pastel-green/10 text-pastel-green border border-pastel-green/30',
    warning:
      'bg-pastel-yellow/10 text-pastel-yellow border border-pastel-yellow/30',
    danger: 'bg-pastel-red/10 text-pastel-red border border-pastel-red/30'
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        {title}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items && items.length ? (
          items.map((item) => (
            <span
              key={item.id}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${tones[tone]}`}
            >
              <span className="h-2 w-2 rounded-full bg-current" />
              {item.label}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            {empty}
          </span>
        )}
      </div>
    </div>
  )
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
        actionButtonStyles[variant] ?? actionButtonStyles.primary
      }`}
    >
      {children}
    </button>
  )
}

export default DistributorDetail
