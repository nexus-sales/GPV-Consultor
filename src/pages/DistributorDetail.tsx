import React, { useEffect, useMemo, useState } from 'react'
import { createLogger } from '../lib/logger'
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
  UserCircleIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import Modal from '../components/ui/Modal'
import EntityTimeline from '../components/EntityTimeline'
import DistributorForm from '../components/DistributorForm'
import { VisitForm } from '../components/VisitForm'
import { SaleForm } from '../components/SaleForm'
import { TaskForm } from '../components/TaskForm'
import { useAppData } from '../lib/useAppData'
import { useCalendarSync } from '../lib/integrations/useCalendarSync'
import { visitToCalendarEvent } from '../lib/integrations/visitMapper'
import NotesHistory from '../components/NotesHistory'
import PVPTEChecklist from '../components/PVPTEChecklist'
import { CommissionAgreementsBox } from '../components/CommissionAgreementsBox'
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
  Task,
  NewTask
} from '../lib/types'

// Interfaces del componente
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
const panelClass =
  'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900'

const statusStyles: Record<string, string> = {
  active:
    'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300',
  pending:
    'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  blocked:
    'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
}

const actionButtonStyles: Record<string, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary:
    'border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300 dark:hover:bg-cyan-500/20',
  success:
    'border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20',
  ghost:
    'border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white'
}

const log = createLogger('DistributorDetail')

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
    sectors,
    addTask,
    updateTask,
    tasks
  } = useAppData()

  const { syncEvent, config: calendarConfig } = useCalendarSync()

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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

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
    entry: Omit<NoteEntry, 'id' | 'timestamp' | 'author'>
  ): Promise<void> => {
    if (!distributor) return

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'Usuario',
      ...entry
    }

    const updatedHistory = [...(distributor.notesHistory || []), newEntry]

    updateDistributor(distributor.id, {
      notesHistory: updatedHistory,
      notes: entry.content
    })

    // Crear evento en calendario si hay próxima acción con fecha
    if (entry.nextActionDate && calendarConfig.calendar?.enabled) {
      try {
        const dateStr = entry.nextActionDate
        const timeStr = entry.nextActionTime || '09:00'
        const startTime = `${dateStr}T${timeStr}:00`
        const endTime = new Date(
          new Date(startTime).getTime() + 60 * 60_000
        ).toISOString()

        await syncEvent({
          id: `activity-${Date.now()}`,
          title: entry.nextAction
            ? `${distributor.name}: ${entry.nextAction}`
            : `Próxima acción: ${distributor.name}`,
          description: entry.content || undefined,
          startTime,
          endTime,
          reminders: [15],
          metadata: {
            type: 'deadline',
            entityType: 'distributor',
            entityId: String(distributor.id)
          }
        })
      } catch (err) {
        log.error('Error creating calendar event for next action', err)
      }
    }
  }

  const handleUpdateNote = (id: string, updates: Partial<NoteEntry>): void => {
    if (!distributor) return
    const updatedHistory = (distributor.notesHistory || []).map((n) =>
      n.id === id ? { ...n, ...updates } : n
    )
    updateDistributor(distributor.id, { notesHistory: updatedHistory })
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

  const handleVisitSubmit = async (payload: NewVisit): Promise<void> => {
    const newVisit = await addVisit(payload)

    // Sincronizar con calendario si está habilitado
    if (
      newVisit &&
      calendarConfig.calendar?.enabled &&
      calendarConfig.calendar?.syncVisits
    ) {
      try {
        const title = `Visita: ${distributor?.name || 'Distribuidor'}`
        const location =
          `${distributor?.address || ''} ${distributor?.city || ''}`.trim()
        await syncEvent(visitToCalendarEvent(newVisit, title, location))
      } catch (err) {
        log.error('Error syncing visit to calendar', err)
      }
    }

    // Agregar automáticamente una nota sobre la visita

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

      handleAddNote({
        title: 'Visita Registrada',
        content: noteContent,
        category: 'visita'
      })
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

  const handleTaskSubmit = async (payload: NewTask): Promise<void> => {
    if (editingTask) {
      await updateTask(editingTask.id, payload)
    } else {
      await addTask(payload)
    }
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const distributorTasks = useMemo(() => {
    return tasks.filter(
      (t) => String(t.entityId) === String(id) && t.entityType === 'distributor'
    )
  }, [tasks, id])

  const handleStatusChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStatusDraft(event.target.value)
  }

  if (!distributor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageContainer size="narrow" className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4 rounded-xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-gray-900">
            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-600" />
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
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageContainer className="py-10">
        <button
          type="button"
          onClick={handleNavigateBack}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Volver a distribuidores
        </button>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6">
            <article className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                    Ficha del distribuidor
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {distributor.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 text-indigo-500" />
                    {[distributor.city, distributor.province]
                      .filter(Boolean)
                      .join(', ') || 'Localización no registrada'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({ type: 'edit', distributor })
                    }
                    className="mr-2 inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
                  >
                    <PencilSquareIcon className="h-3.5 w-3.5" />
                    Editar ficha
                  </button>
                  <span
                    className={`${chipBase} bg-indigo-50 text-indigo-700`}
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
                        className={`${chipBase} bg-cyan-50 text-cyan-700`}
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
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      Checklist documental pendiente
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">
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

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Datos de contacto
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({ type: 'edit', distributor })
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
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
              onUpdateNote={handleUpdateNote}
              loading={savingNotes}
              placeholder="Registra hallazgos comerciales, acuerdos, visitas o incidencias..."
              title="Actividad comercial"
            />

            {/* Checklist PVPTE - Solo para distribuidores con external_code PVPTE */}
            {distributor.externalCode === 'PVPTE' && (
              <PVPTEChecklist distributor={distributor} />
            )}

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Política de marcas
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({ type: 'edit', distributor })
                    }
                    className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-white"
                    title="Editar política de marcas"
                  >
                    <PencilSquareIcon className="h-3 w-3" />
                    Editar
                  </button>
                </div>
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
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
                    <CheckCircleIcon className="h-3.5 w-3.5 text-indigo-500" />
                    {lookups.brands[brandId]?.label ?? brandId}
                  </span>
                ))}
              </div>
            </article>

            {/* Acuerdos de Comisiones */}
            <CommissionAgreementsBox distributorId={distributor.id} />

            <article className={panelClass}>
              <header className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historial de actividad
                </h2>
                <span className="text-xs uppercase tracking-widest text-gray-400">
                  Visitas · Ventas · Notas
                </span>
              </header>
              <EntityTimeline
                visits={distributorVisits}
                sales={distributorSales}
                notes={distributor.notesHistory ?? []}
                formatRelative={formatters.relative}
                emptyLabel="Sin actividad registrada. Agenda una visita o registra una venta para iniciar el historial."
              />
            </article>
          </section>

          <aside className="space-y-6">
            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones rápidas
                </h2>
                <PencilSquareIcon className="h-5 w-5 text-indigo-500" />
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
                  onClick={() => setIsTaskModalOpen(true)}
                  variant="ghost"
                >
                  <TagIcon className="h-4 w-4" /> Nueva tarea
                </ActionButton>
                <ActionButton
                  onClick={() => setActiveModal({ type: 'sale', distributor })}
                  variant="success"
                >
                  <CurrencyEuroIcon className="h-4 w-4" /> Registrar venta
                </ActionButton>
              </div>
            </article>

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tareas pendientes
                </h2>
                <TagIcon className="h-5 w-5 text-indigo-500" />
              </header>
              <div className="space-y-3">
                {distributorTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No hay tareas pendientes.
                  </p>
                ) : (
                  distributorTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`}
                          />
                          <h4
                            className={`text-sm font-bold truncate ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            {t.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Vence: {t.dueDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        {t.status !== 'completed' && (
                          <button
                            onClick={() =>
                              updateTask(t.id, { status: 'completed' })
                            }
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTask(t)
                            setIsTaskModalOpen(true)
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  onClick={() => {
                    setEditingTask(null)
                    setIsTaskModalOpen(true)
                  }}
                  className="w-full py-2 flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                >
                  <TagIcon className="h-4 w-4" />
                  Nueva Tarea
                </button>
              </div>
            </article>

            <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
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
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    statusDraft === distributor.status
                      ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" /> Actualizar estado
                </button>
              </div>
            </article>

            <article className={panelClass}>
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
                  className="h-2 rounded-full bg-indigo-600 transition-all duration-300 dark:bg-indigo-400"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li
                    key={item.key}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      item.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
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
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  <p className="font-semibold">Pendientes prioritarios</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {missingFields.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumen numérico
                </h2>
                <ChartBarIcon className="h-5 w-5 text-indigo-500" />
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

      {/* Modal de Tarea */}
      {isTaskModalOpen && (
        <Modal
          onClose={() => {
            setIsTaskModalOpen(false)
            setEditingTask(null)
          }}
          title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
        >
          <TaskForm
            initial={editingTask || {}}
            entityId={id!}
            entityType="distributor"
            onSubmit={(payload) =>
              handleTaskSubmit({
                ...payload,
                entityId: id!,
                entityType: 'distributor'
              })
            }
            onCancel={() => {
              setIsTaskModalOpen(false)
              setEditingTask(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, icon }) => {
  const IconComponent = icon
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
      <IconComponent className="h-5 w-5 text-indigo-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-1 font-semibold text-gray-800 dark:text-white">
          {value}
        </p>
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
      <IconComponent className="h-5 w-5 text-indigo-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 block font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-gray-800 dark:text-white">
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

const BrandList: React.FC<BrandListProps> = ({ title, items, tone, empty }) => {
  const tones = {
    success:
      'border border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300',
    warning:
      'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
    danger:
      'border border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
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
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
        actionButtonStyles[variant] ?? actionButtonStyles.primary
      }`}
    >
      {children}
    </button>
  )
}

export default DistributorDetail
