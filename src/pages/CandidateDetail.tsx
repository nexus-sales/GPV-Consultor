import React, { useEffect, useMemo, useState } from 'react'
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
  PencilSquareIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../lib/useAppData'
import type {
  Candidate,
  PipelineStage,
  PipelineStageId,
  BrandPolicy,
  NoteEntry,
  NoteCategory,
  Visit,
  NewDistributor,
  Notification
} from '../lib/types'
import Modal from '../components/ui/Modal'
import CandidateForm from '../components/CandidateForm'
import DistributorForm from '../components/DistributorForm'
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
    setNotifications,
    formatters,
    lookups
  } = useAppData()

  const candidate = useMemo(
    () => candidates.find((item: Candidate) => item.id === id),
    [candidates, id]
  )

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
    content: string,
    category?: NoteCategory
  ): Promise<void> => {
    if (!candidate) return

    const newEntry: NoteEntry = {
      id: `note-${Date.now()}`,
      title: 'Nota',
      content,
      timestamp: new Date().toISOString(),
      author: 'Usuario',
      category: category || 'general'
    }

    const updatedHistory = [...(candidate.notesHistory || []), newEntry]

    updateCandidate(candidate.id, {
      notesHistory: updatedHistory,
      notes: content
    })
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
                  <span
                    className={`${chipBase} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300`}
                  >
                    {stageMeta?.label ?? 'Sin etapa'}
                  </span>
                  {candidate.category && (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${candidate.category.badgeClass}`}
                      title={candidate.category.tooltip}
                    >
                      <InformationCircleIcon className="h-3.5 w-3.5" />
                      {candidate.category.label}
                    </span>
                  )}
                  <span
                    className={`${chipBase} bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}
                  >
                    {candidate.channelCode || 'SIN CÓDIGO'}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <SummaryStat
                  label="Última actualización"
                  value={lastUpdatedLabel}
                  icon={ClockIcon}
                />
                <SummaryStat
                  label="Creado"
                  value={createdAtLabel}
                  icon={ArrowPathIcon}
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
              loading={savingNotes}
              placeholder="Anota puntos clave de visitas, llamadas, negociaciones..."
              title="Notas comerciales"
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
                  Resumen de actividad
                </h2>
                <ClockIcon className="h-5 w-5 text-indigo-500" />
              </header>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-4 w-4 text-indigo-500" />
                  <span>
                    Creado el{' '}
                    <strong>{candidate.createdAt || 'sin fecha'}</strong> (
                    {createdAtLabel})
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowPathIcon className="h-4 w-4 text-indigo-500" />
                  <span>
                    Última actualización el{' '}
                    <strong>{candidate.updatedAt || 'sin registro'}</strong> (
                    {lastUpdatedLabel})
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <InformationCircleIcon className="h-4 w-4 text-indigo-500" />
                  <span>
                    Campos pendientes: <strong>{missingFields.length}</strong>
                  </span>
                </li>
              </ul>

              {missingFields.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  <p className="font-semibold">Aspectos a completar:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {missingFields.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
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
