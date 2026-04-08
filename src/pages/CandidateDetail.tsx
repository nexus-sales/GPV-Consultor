import React, { useEffect, useMemo, useState } from 'react'
import { createLogger } from '../lib/logger'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  PencilSquareIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../lib/useAppData'
import { useCalendarSync } from '../lib/integrations/useCalendarSync'
import { visitToCalendarEvent } from '../lib/integrations/visitMapper'
import type {
  Candidate,
  PipelineStage,
  PipelineStageId,
  BrandPolicy,
  NoteEntry,
  Visit,
  NewVisit,
  Task,
  NewTask,
  NewDistributor,
  Notification,
  EntityId
} from '../lib/types'
import Modal from '../components/ui/Modal'
import CandidateForm from '../components/CandidateForm'
import DistributorForm from '../components/DistributorForm'
import { VisitForm } from '../components/VisitForm'
import { TaskForm } from '../components/TaskForm'
import NotesHistory from '../components/NotesHistory'
import EntityTimeline from '../components/EntityTimeline'

// Interfaces locales específicas de este componente
interface BrandItem {
  id: string
  label: string
}

interface BrandLookup {
  [key: string]: {
    label: string
  }
}

interface ChecklistItem {
  key: string
  label: string
  done: boolean
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
  items: BrandItem[]
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

const candidateHealthColorMap: Record<
  string,
  { wrapper: string; dot: string; text: string }
> = {
  slate: {
    wrapper:
      'bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/30',
    dot: 'bg-slate-500',
    text: 'text-slate-700 dark:text-slate-300'
  },
  emerald: {
    wrapper:
      'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  red: {
    wrapper:
      'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300'
  },
  orange: {
    wrapper:
      'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/30',
    dot: 'bg-orange-500',
    text: 'text-orange-700 dark:text-orange-300'
  },
  indigo: {
    wrapper:
      'bg-indigo-50 border-indigo-200 dark:bg-indigo-500/10 dark:border-indigo-500/30',
    dot: 'bg-indigo-500',
    text: 'text-indigo-700 dark:text-indigo-300'
  }
}

const log = createLogger('CandidateDetail')

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    candidates,
    visits,
    pipelineStages,
    reorderCandidate,
    moveCandidate,
    updateCandidate,
    deleteCandidate,
    addDistributor,
    addVisit,
    addTask,
    updateTask,
    deleteTask,
    tasks,
    preferences,
    setNotifications,
    formatters,
    lookups
  } = useAppData()

  const { syncEvent } = useCalendarSync()
  const calendarConfig = preferences as any

  const candidate = useMemo(
    () => candidates.find((item: Candidate) => String(item.id) === String(id)),
    [candidates, id]
  )

  // --- LÓGICA SMART RECRUITMENT DETAIL ---
  const { health, daysInPipeline } = useMemo(() => {
    if (!candidate)
      return {
        health: { label: '', color: 'gray', isStuck: false },
        daysInPipeline: 0
      }

    const lastUpdate = candidate.updatedAt
      ? new Date(candidate.updatedAt)
      : new Date(candidate.createdAt)
    const start = new Date(candidate.createdAt)
    const now = new Date()

    const daysSinceUpdate = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
    )
    const totalDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 3600 * 24)
    )

    let h = { label: 'Activo', color: 'indigo', isStuck: false }
    if (candidate.stage === 'rejected')
      h = { label: 'Descartado', color: 'slate', isStuck: false }
    else if (candidate.stage === 'approved')
      h = { label: 'Aprobado', color: 'emerald', isStuck: false }
    else if (daysSinceUpdate > 7)
      h = { label: 'Estancado', color: 'red', isStuck: true }
    else if (daysSinceUpdate > 4)
      h = { label: 'Enfriándose', color: 'orange', isStuck: true }

    return { health: h, daysInPipeline: totalDays }
  }, [candidate])
  // ---------------------------------------

  const candidateVisits = useMemo(
    () => visits.filter((v: Visit) => v.candidateId === id),
    [visits, id]
  )

  const stageLookup = useMemo(() => {
    return pipelineStages.reduce(
      (acc: Record<string, PipelineStage>, stage: PipelineStage) => {
        acc[stage.id] = stage
        return acc
      },
      {}
    )
  }, [pipelineStages])

  const [stageDraft, setStageDraft] = useState<PipelineStageId>(
    candidate?.stage ?? 'new'
  )
  const [savingNotes] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState<boolean>(false)
  const [isVisitModalOpen, setIsVisitModalOpen] = useState<boolean>(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (candidate) {
      setStageDraft(candidate.stage)
    }
  }, [candidate])

  const stageMeta = candidate ? stageLookup[candidate.stage] : null
  const isApproved = candidate?.stage === 'approved'
  const stageIndex = candidate
    ? pipelineStages.findIndex(
        (stage: PipelineStage) => stage.id === candidate.stage
      )
    : -1
  const previousStage = stageIndex > 0 ? pipelineStages[stageIndex - 1] : null
  const nextStage =
    stageIndex >= 0 && stageIndex < pipelineStages.length - 1
      ? pipelineStages[stageIndex + 1]
      : null

  const missingFields = useMemo(() => {
    if (!candidate) return []
    const checks: string[] = []
    if (!candidate.contact?.phone) checks.push('Teléfono de contacto')
    if (!candidate.contact?.email) checks.push('Email de contacto')
    if (!candidate.city) checks.push('Localidad confirmada')
    if (candidate.pendingData) checks.push('Checklist documental PVPTE')
    if (!candidate.notes) checks.push('Notas comerciales')
    return checks
  }, [candidate])

  const checklistItems = useMemo((): ChecklistItem[] => {
    if (!candidate) return []
    return [
      {
        key: 'contact-name',
        label: 'Persona de contacto identificada',
        done: Boolean(candidate.contact?.name)
      },
      {
        key: 'contact-phone',
        label: 'Teléfono registrado',
        done: Boolean(candidate.contact?.phone)
      },
      {
        key: 'contact-email',
        label: 'Email operativo',
        done: Boolean(candidate.contact?.email)
      },
      {
        key: 'location',
        label: 'Localidad confirmada',
        done: Boolean(candidate.city)
      },
      {
        key: 'taxonomy',
        label: 'Taxonomía aplicada correctamente',
        done: Boolean(
          candidate.categoryId && candidate.categoryId !== 'general'
        )
      },
      {
        key: 'documentation',
        label: 'Checklist documental completado',
        done: !candidate.pendingData
      }
    ]
  }, [candidate])

  const completedChecklist = checklistItems.filter((item) => item.done).length
  const checklistProgress = checklistItems.length
    ? Math.round((completedChecklist / checklistItems.length) * 100)
    : 0

  // Handlers
  const handleAdvance = (): void => {
    if (!candidate || !nextStage || !reorderCandidate) return
    reorderCandidate(candidate.id, nextStage.id, 0)
  }

  const handleBack = (): void => {
    if (!candidate || !previousStage || !reorderCandidate) return
    reorderCandidate(candidate.id, previousStage.id, 0)
  }

  const handleStageSubmit = (): void => {
    if (!candidate || !reorderCandidate) return
    if (stageDraft === candidate.stage) return
    reorderCandidate(candidate.id, stageDraft, 0)
  }

  const handleMarkChecklistDone = (): void => {
    if (!candidate || !candidate.pendingData) return
    updateCandidate(candidate.id, { pendingData: false })
  }

  const handleAddNote = async (
    entry: Omit<NoteEntry, 'id' | 'timestamp' | 'author'>
  ): Promise<void> => {
    if (!candidate) return

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}`,
      timestamp: new Date().toISOString(),
      author: 'Usuario',
      ...entry
    }

    const updatedHistory = [...(candidate.notesHistory || []), newEntry]

    updateCandidate(candidate.id, {
      notesHistory: updatedHistory,
      notes: entry.content
    })
  }

  const handleUpdateNote = (id: string, updates: Partial<NoteEntry>): void => {
    if (!candidate) return
    const updatedHistory = (candidate.notesHistory || []).map((n) =>
      n.id === id ? { ...n, ...updates } : n
    )
    updateCandidate(candidate.id, { notesHistory: updatedHistory })
  }

  const handleNavigateBack = (): void => {
    navigate(-1)
  }

  const handleEditCandidate = (): void => {
    setIsEditModalOpen(true)
  }

  const handleCancelEdit = (): void => {
    setIsEditModalOpen(false)
  }

  const handleConvertToDistributor = (): void => {
    if (!isApproved) return
    setIsConvertModalOpen(true)
  }

  const handleCancelConvert = (): void => {
    setIsConvertModalOpen(false)
  }

  const handleSubmitConvert = async (
    payload: NewDistributor
  ): Promise<void> => {
    if (!candidate) return
    try {
      await addDistributor(payload)
      await deleteCandidate(candidate.id)
      setIsConvertModalOpen(false)
      navigate('/distributors')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setNotifications((prev: Notification[]) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'error',
          title: 'Error al convertir candidato',
          description: `No se pudo crear el distribuidor: ${msg}`,
          timestamp: new Date().toISOString(),
          read: false
        }
      ])
    }
  }

  const handleSubmitEdit = async (formData: {
    name: string
    address: string
    postalCode: string
    city: string
    island: string
    channelCode: string
    stage: PipelineStageId
    source: string
    notes: string
    categoryId: string
    taxId: string
    contact: {
      name: string
      phone: string
      email: string
    }
  }): Promise<void> => {
    if (!candidate) return

    await updateCandidate(candidate.id, {
      name: formData.name,
      address: formData.address,
      postalCode: formData.postalCode,
      city: formData.city,
      island: formData.island,
      channelCode: formData.channelCode,
      stage: formData.stage,
      source: formData.source,
      notes: formData.notes,
      categoryId: formData.categoryId,
      taxId: formData.taxId,
      contact: {
        ...candidate.contact,
        name: formData.contact.name,
        phone: formData.contact.phone,
        email: formData.contact.email
      }
    })

    setIsEditModalOpen(false)
  }

  const handleStageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setStageDraft(event.target.value as PipelineStageId)
  }

  const handleVisitSubmit = async (payload: NewVisit): Promise<void> => {
    const newVisit = await addVisit(payload)

    // Sincronizar con calendario si está habilitado
    if (
      newVisit &&
      calendarConfig.calendar?.enabled &&
      calendarConfig.calendar?.syncVisits
    ) {
      try {
        const title = `Visita: ${candidate?.name || 'Candidato'}`
        const location = `${candidate?.address || ''} ${candidate?.city || ''}`.trim()
        await syncEvent(visitToCalendarEvent(newVisit, title, location))
      } catch (err) {
        log.error('Error syncing visit to calendar', err)
      }
    }

    // Agregar automáticamente una nota sobre la visita
    if (candidate && payload.type && payload.date) {
      const visitTypeLabels: Record<string, string> = {
        presentacion: 'Presentación',
        seguimiento: 'Seguimiento',
        formacion: 'Formación',
        incidencias: 'Incidencias',
        apertura: 'Apertura'
      }

      const noteContent = `Visita agendada: ${visitTypeLabels[payload.type] || payload.type}
Fecha: ${new Date(payload.date).toLocaleDateString('es-ES')}
Objetivo: ${payload.objective || 'No especificado'}`

      handleAddNote({
        title: 'Visita Programada',
        content: noteContent,
        category: 'visita'
      })
    }

    setIsVisitModalOpen(false)
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

  const candidateTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        String(t.entityId) === String(id) && t.entityType === 'candidate'
    )
  }, [tasks, id])

  // Utilidades de mapeo
  const brandPolicy: BrandPolicy = candidate?.brandPolicy ?? {
    allowed: null,
    blocked: [],
    conditional: [],
    note: ''
  }
  const brandsLookup: BrandLookup = lookups?.brands ?? {}

  const mapBrandIds = (ids?: string[] | null): BrandItem[] => {
    if (!ids || !ids.length) return []
    return ids.map((brandId) => ({
      id: brandId,
      label: brandsLookup[brandId]?.label ?? brandId
    }))
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <PageContainer size="narrow" className="py-16 text-center">
          <div className="mx-auto max-w-md space-y-4 rounded-xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900/60 dark:bg-gray-900">
            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Candidato no encontrado
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No hemos podido localizar la ficha solicitada. Es posible que el
              candidato haya sido eliminado del pipeline.
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

  const lastUpdatedLabel = candidate.updatedAt
    ? formatters.relative(candidate.updatedAt)
    : 'Sin actividad reciente'
  const createdAtLabel = candidate.createdAt
    ? formatters.relative(candidate.createdAt)
    : 'Fecha no disponible'

  const allowedBrands = mapBrandIds(brandPolicy.allowed)
  const blockedBrands = mapBrandIds(brandPolicy.blocked)
  const conditionalBrands = mapBrandIds(brandPolicy.conditional)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <PageContainer className="py-10">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleNavigateBack}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Volver al pipeline
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEditCandidate}
              className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              <PencilSquareIcon className="h-4 w-4" /> Editar Candidato
            </button>
            {isApproved && (
              <button
                type="button"
                onClick={handleConvertToDistributor}
                className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300 dark:hover:bg-green-500/20"
              >
                <CheckCircleIcon className="h-4 w-4" /> Promover a Distribuidor
              </button>
            )}
            {!isApproved && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Conversion disponible al aprobar
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6">
            <article className={panelClass}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Ficha de candidato
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {candidate.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 text-indigo-500" />
                    {[candidate.city, candidate.island]
                      .filter(Boolean)
                      .join(', ') || 'Ubicación pendiente'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 border ${candidateHealthColorMap[health.color]?.wrapper ?? 'bg-gray-50 border-gray-200'}`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${candidateHealthColorMap[health.color]?.dot ?? 'bg-gray-500'} ${health.isStuck ? 'animate-pulse' : ''}`}
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-tight ${candidateHealthColorMap[health.color]?.text ?? 'text-gray-700 dark:text-gray-300'}`}
                    >
                      {health.label}
                    </span>
                  </div>
                  <span
                    className={`${chipBase} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}
                  >
                    Etapa: {stageMeta?.label ?? 'Sin etapa'}
                  </span>
                  <span
                    className={`${chipBase} bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300`}
                  >
                    ID: {candidate.channelCode || 'SIN CÓDIGO'}
                  </span>
                </div>
              </div>

              {/* BARRA DE ACCIONES RÁPIDAS RAINBOW */}
              <div className="mt-8 flex flex-wrap gap-3 p-1">
                <a
                  href={`tel:${candidate.contact?.phone}`}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm group"
                >
                  <PhoneIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Llamar ahora</span>
                </a>
                <a
                  href={`mailto:${candidate.contact?.email}`}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm group"
                >
                  <EnvelopeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Enviar Email</span>
                </a>
                <button
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.address || candidate.city || '')}`,
                      '_blank'
                    )
                  }
                  className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-700 rounded-2xl border border-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm group"
                >
                  <MapPinIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Ver Mapa</span>
                </button>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <SummaryStat
                  label="Tiempo en Pipeline"
                  value={`${daysInPipeline} días`}
                  icon={ClockIcon}
                />
                <SummaryStat
                  label="Última actividad"
                  value={lastUpdatedLabel}
                  icon={ArrowPathIcon}
                />
                <SummaryStat
                  label="Creado"
                  value={createdAtLabel}
                  icon={CalendarIcon}
                />
                <SummaryStat
                  label="Fuente"
                  value={candidate.source ?? 'Autoregistro'}
                  icon={InformationCircleIcon}
                />
              </div>

              {candidate.pendingData && (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      Checklist documental pendiente
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Completa los requisitos PVPTE antes de proponer marcas
                      adicionales. Marca como resuelto una vez recibida la
                      documentación.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Datos de contacto
                </h2>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Relación comercial
                </span>
              </header>
              <div className="grid gap-4 md:grid-cols-2">
                <ContactItem
                  label="Persona de contacto"
                  icon={UserIcon}
                  value={candidate.contact?.name || 'No indicado'}
                />
                <ContactItem
                  label="Teléfono"
                  icon={PhoneIcon}
                  value={candidate.contact?.phone || 'No registrado'}
                  href={
                    candidate.contact?.phone
                      ? `tel:${candidate.contact.phone}`
                      : undefined
                  }
                />
                <ContactItem
                  label="Email"
                  icon={EnvelopeIcon}
                  value={candidate.contact?.email || 'No registrado'}
                  href={
                    candidate.contact?.email
                      ? `mailto:${candidate.contact.email}`
                      : undefined
                  }
                />
                <ContactItem
                  label="Ubicación"
                  icon={MapPinIcon}
                  value={
                    [candidate.city, candidate.island]
                      .filter(Boolean)
                      .join(', ') || 'Pendiente'
                  }
                />
              </div>
            </article>

            <NotesHistory
              history={candidate.notesHistory || []}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              loading={savingNotes}
              placeholder="Anota puntos clave de visitas, llamadas, negociaciones..."
              title="Actividad comercial"
            />

            <article className={panelClass}>
              <header className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historial de actividad
                </h2>
                <span className="text-xs uppercase tracking-widest text-gray-400">
                  Visitas · Notas
                </span>
              </header>
              <EntityTimeline
                visits={candidateVisits}
                notes={candidate.notesHistory ?? []}
                formatRelative={formatters.relative}
                emptyLabel="Sin actividad registrada. Agenda una visita o añade una nota para iniciar el historial."
              />
            </article>

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Política de marcas
                </h2>
                <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
              </header>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {brandPolicy.note ||
                  'Aplica la política estándar de taxonomía para decidir qué marcas ofrecer a este candidato.'}
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
                  empty="Requiere validación"
                />
                <BrandList
                  title="Bloqueadas"
                  tone="danger"
                  items={blockedBrands}
                  empty="Ninguna"
                />
              </div>
            </article>
          </section>

          <aside className="space-y-6">
            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Checklist de onboarding
                </h2>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {checklistProgress}% completado
                </span>
              </header>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-2 rounded-full bg-indigo-500 transition-all duration-300 candidate-checklist-progress"
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
              <ul className="space-y-3">
                {checklistItems.map((item) => (
                  <li
                    key={item.key}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      item.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400'
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
              {candidate.pendingData && (
                <button
                  type="button"
                  onClick={handleMarkChecklistDone}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  <CheckCircleIcon className="h-4 w-4" /> Marcar checklist
                  completado
                </button>
              )}
            </article>

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gestión de etapa
                </h2>
                <span className="text-xs uppercase tracking-widest text-gray-400">
                  Pipeline
                </span>
              </header>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Seleccionar etapa
              </label>
              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  value={stageDraft}
                  onChange={handleStageChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  aria-label="Seleccionar etapa del pipeline"
                >
                  {pipelineStages.map((stage: PipelineStage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleStageSubmit}
                  disabled={stageDraft === candidate.stage}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    stageDraft === candidate.stage
                      ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <CheckCircleIcon className="h-4 w-4" /> Actualizar etapa
                </button>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {previousStage && (
                  <ActionButton onClick={handleBack} variant="ghost">
                    <ArrowLeftIcon className="h-4 w-4" /> {previousStage.label}
                  </ActionButton>
                )}
                {nextStage && (
                  <ActionButton onClick={handleAdvance}>
                    {nextStage.label} <ArrowRightIcon className="h-4 w-4" />
                  </ActionButton>
                )}
                {!nextStage && (
                  <ActionButton
                    onClick={() => moveCandidate(candidate.id, 'approved')}
                    variant="success"
                  >
                    <CheckCircleIcon className="h-4 w-4" /> Activar candidato
                  </ActionButton>
                )}
                {candidate.stage !== 'rejected' ? (
                  <ActionButton
                    onClick={() => moveCandidate(candidate.id, 'rejected')}
                    variant="danger"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" /> Marcar como
                    rechazado
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={() =>
                      reorderCandidate &&
                      reorderCandidate(
                        candidate.id,
                        pipelineStages[0]?.id ?? 'new',
                        0
                      )
                    }
                    variant="secondary"
                  >
                    <ArrowPathIcon className="h-4 w-4" /> Reabrir candidato
                  </ActionButton>
                )}
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
                {candidateTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay tareas pendientes.</p>
                ) : (
                  candidateTasks.map((t) => (
                    <div key={t.id} className="flex items-start justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.priority === 'high' ? 'bg-red-500' : t.priority === 'medium' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                          <h4 className={`text-sm font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {t.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Vence: {t.dueDate}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {t.status !== 'completed' && (
                          <button
                            onClick={() => updateTask(t.id, { status: 'completed' })}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setEditingTask(t)
                            setIsTaskModalOpen(true)
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
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

            <article className={panelClass}>
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Acciones rápidas
                </h2>
                <ClockIcon className="h-5 w-5 text-indigo-500" />
              </header>
              <div className="flex flex-col gap-3">
                <ActionButton onClick={() => setIsEditModalOpen(true)} variant="secondary">
                  <PencilSquareIcon className="h-4 w-4" /> Editar candidato
                </ActionButton>
                <ActionButton onClick={() => setIsVisitModalOpen(true)} variant="primary">
                  <CalendarIcon className="h-4 w-4" /> Agendar visita
                </ActionButton>
                <ActionButton onClick={() => setIsTaskModalOpen(true)} variant="ghost">
                  <TagIcon className="h-4 w-4" /> Nueva tarea
                </ActionButton>
                {candidate.stage !== 'approved' && (
                  <ActionButton onClick={() => setIsConvertModalOpen(true)} variant="success">
                    <CheckCircleIcon className="h-4 w-4" /> Convertir a Distribuidor
                  </ActionButton>
                )}
              </div>
            </article>
          </aside>
        </div>
      </PageContainer>

      {/* Modal de Edición */}
      {isEditModalOpen && (
        <Modal onClose={handleCancelEdit} title="Editar Candidato">
          <CandidateForm
            initial={candidate}
            onSubmit={handleSubmitEdit}
            onCancel={handleCancelEdit}
          />
        </Modal>
      )}

      {/* Modal de Promoción a Distribuidor */}
      {isConvertModalOpen && (
        <Modal
          onClose={handleCancelConvert}
          title="Promover Candidato a Distribuidor"
        >
          <div className="mb-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 text-xs text-blue-700 dark:text-blue-300">
            <p className="font-semibold">Información de conversión:</p>
            <p className="mt-1">
              Al completar este formulario, se creará una nueva ficha de
              distribuidor y se archivará/eliminará permanentemente este
              candidato del pipeline.
            </p>
          </div>
          <DistributorForm
            initial={{
              name: candidate.name,
              taxId: candidate.taxId,
              code: candidate.channelCode,
              province: candidate.province || candidate.island || '',
              city: candidate.city,
              contactPerson: candidate.contact?.name,
              phone: candidate.contact?.phone,
              email: candidate.contact?.email,
              categoryId: candidate.categoryId,
              brandPolicy: candidate.brandPolicy,
              notes: candidate.notes
            }}
            onSubmit={handleSubmitConvert}
            onCancel={handleCancelConvert}
          />
        </Modal>
      )}

      {/* Modal de Visita */}
      {isVisitModalOpen && (
        <Modal onClose={() => setIsVisitModalOpen(false)} title="Agendar Visita">
          <VisitForm
            candidate={candidate as any}
            onSubmit={handleVisitSubmit}
            onCancel={() => setIsVisitModalOpen(false)}
          />
        </Modal>
      )}

      {/* Modal de Tarea */}
      {isTaskModalOpen && (
        <Modal onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }} title={editingTask ? 'Editar Tarea' : 'Nueva Tarea'}>
          <TaskForm
            initial={editingTask || {}}
            entityId={id!}
            entityType="candidate"
            onSubmit={(payload) => handleTaskSubmit({ ...payload, entityId: id!, entityType: 'candidate' })}
            onCancel={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
          />
        </Modal>
      )}
    </div>
  )
}

const SummaryStat: React.FC<SummaryStatProps> = ({ label, value, icon }) => {
  const IconComponent = icon
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
      <IconComponent className="h-5 w-5 text-indigo-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="mt-1 font-semibold text-gray-800 dark:text-gray-200">
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
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
      <IconComponent className="h-5 w-5 text-indigo-500" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            className="mt-1 block font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 font-semibold text-gray-800 dark:text-gray-200">
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
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400',
    warning:
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400',
    danger:
      'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400'
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
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary:
      'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:text-white',
    success: 'bg-green-600 text-white hover:bg-green-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost:
      'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

export default CandidateDetail
