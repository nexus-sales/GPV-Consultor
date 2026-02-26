import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
  EntityId,
  PipelineStageId,
  BrandPolicy,
  NoteEntry,
  NoteCategory
} from '../lib/types'
import Modal from '../components/ui/Modal'
import CandidateForm from '../components/CandidateForm'
import DistributorForm from '../components/DistributorForm'
import NotesHistory from '../components/NotesHistory'

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

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    candidates,
    pipelineStages,
    reorderCandidate,
    moveCandidate,
    updateCandidate,
    deleteCandidate,
    formatters,
    lookups
  } = useAppData()

  const candidate = useMemo(
    () => candidates.find((item: Candidate) => item.id === id),
    [candidates, id]
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
      author: 'Usuario', // Aquí puedes usar el nombre del usuario logueado si lo tienes
      category: category || 'general'
    }

    const updatedHistory = [...(candidate.notesHistory || []), newEntry]

    updateCandidate(candidate.id, {
      notesHistory: updatedHistory,
      notes: content // Mantener compatibilidad con el campo notes original
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
    setIsConvertModalOpen(true)
  }

  const handleCancelConvert = (): void => {
    setIsConvertModalOpen(false)
  }

  const handleSubmitConvert = async (): Promise<void> => {
    if (!candidate) return
    // El formulario de distribuidor ya llama a addDistributor internamente
    // Procedemos a eliminar el candidato ya que se ha convertido con éxito
    await deleteCandidate(candidate.id)
    setIsConvertModalOpen(false)
    navigate('/distributors')
  }

  const handleSubmitEdit = (formData: {
    name: string
    city: string
    island: string
    channelCode: string
    stage: PipelineStageId
    source: string
    notes: string
    contact: {
      name: string
      phone: string
      email: string
    }
  }): void => {
    if (!candidate) return

    // Actualizar el candidato con los nuevos datos
    updateCandidate(candidate.id, {
      ...candidate,
      name: formData.name,
      city: formData.city,
      island: formData.island,
      channelCode: formData.channelCode,
      stage: formData.stage,
      source: formData.source,
      notes: formData.notes,
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-red-100 dark:border-red-900 bg-white/90 dark:bg-gray-800/90 p-8 shadow-lg">
            <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-pastel-red" />
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
              className="inline-flex items-center gap-2 rounded-2xl bg-pastel-indigo px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-indigo/90"
            >
              <ArrowLeftIcon className="h-4 w-4" /> Volver
            </button>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={handleNavigateBack}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 shadow-sm transition hover:border-pastel-indigo/40 hover:text-pastel-indigo"
          >
            <ArrowLeftIcon className="h-4 w-4" /> Volver al pipeline
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleEditCandidate}
              className="inline-flex items-center gap-2 rounded-2xl border border-pastel-indigo/30 bg-pastel-indigo/10 dark:bg-pastel-indigo/20 px-4 py-2 text-sm font-semibold text-pastel-indigo dark:text-pastel-indigo shadow-sm transition hover:bg-pastel-indigo hover:text-white"
            >
              <PencilSquareIcon className="h-4 w-4" /> Editar Candidato
            </button>

            <button
              type="button"
              onClick={handleConvertToDistributor}
              className="inline-flex items-center gap-2 rounded-2xl border border-pastel-green/30 bg-pastel-green/10 dark:bg-pastel-green/20 px-4 py-2 text-sm font-semibold text-pastel-green dark:text-pastel-green shadow-sm transition hover:bg-pastel-green hover:text-white"
            >
              <CheckCircleIcon className="h-4 w-4" /> Promover a Distribuidor
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <section className="space-y-6">
            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-pastel-indigo">
                    Ficha de candidato
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                    {candidate.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 text-pastel-indigo" />
                    {[candidate.city, candidate.island]
                      .filter(Boolean)
                      .join(', ') || 'Ubicación pendiente'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`${chipBase} bg-pastel-indigo/10 text-pastel-indigo`}
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
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-pastel-yellow/30 bg-pastel-yellow/10 px-5 py-4 text-sm text-pastel-yellow">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <p className="font-semibold">
                      Checklist documental pendiente
                    </p>
                    <p className="text-xs text-pastel-yellow/80">
                      Completa los requisitos PVPTE antes de proponer marcas
                      adicionales. Marca como resuelto una vez recibida la
                      documentación.
                    </p>
                  </div>
                </div>
              )}
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
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

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Política de marcas
                </h2>
                <ShieldCheckIcon className="h-5 w-5 text-pastel-indigo" />
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
            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Checklist de onboarding
                </h2>
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  {checklistProgress}% completado
                </span>
              </header>
              <div className="mb-4 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                {/* Inline style required for dynamic checklist progress - see docs/CSS_INLINE_STYLES.md */}
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-pastel-indigo to-pastel-cyan transition-all duration-300 candidate-checklist-progress"
                  data-progress={checklistProgress}
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
              {candidate.pendingData && (
                <button
                  type="button"
                  onClick={handleMarkChecklistDone}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-pastel-yellow px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-yellow/90"
                >
                  <CheckCircleIcon className="h-4 w-4" /> Marcar checklist
                  completado
                </button>
              )}
            </article>

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
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
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-pastel-indigo/50 focus:outline-none focus:ring-2 focus:ring-pastel-indigo/30"
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
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    stageDraft === candidate.stage
                      ? 'cursor-not-allowed border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-400'
                      : 'bg-pastel-indigo text-white shadow-md hover:bg-pastel-indigo/90'
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

            <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumen de actividad
                </h2>
                <ClockIcon className="h-5 w-5 text-pastel-indigo" />
              </header>
              <ul className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="h-4 w-4 text-pastel-indigo" />
                  <span>
                    Creado el{' '}
                    <strong>{candidate.createdAt || 'sin fecha'}</strong> (
                    {createdAtLabel})
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <ArrowPathIcon className="h-4 w-4 text-pastel-indigo" />
                  <span>
                    Última actualización el{' '}
                    <strong>{candidate.updatedAt || 'sin registro'}</strong> (
                    {lastUpdatedLabel})
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <InformationCircleIcon className="h-4 w-4 text-pastel-indigo" />
                  <span>
                    Campos pendientes: <strong>{missingFields.length}</strong>
                  </span>
                </li>
              </ul>

              {missingFields.length > 0 && (
                <div className="mt-4 rounded-2xl border border-pastel-red/30 bg-pastel-red/10 p-4 text-xs text-pastel-red">
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
      </div>

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
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
      <IconComponent className="h-5 w-5 text-pastel-indigo" />
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
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/70 dark:bg-gray-700/70 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
      <IconComponent className="h-5 w-5 text-pastel-indigo" />
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
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
  const variants = {
    primary: 'bg-pastel-indigo text-white hover:bg-pastel-indigo/90',
    secondary: 'bg-pastel-cyan/10 text-pastel-cyan hover:bg-pastel-cyan/20',
    success: 'bg-pastel-green/10 text-pastel-green hover:bg-pastel-green/20',
    danger: 'bg-pastel-red/10 text-pastel-red hover:bg-pastel-red/20',
    ghost:
      'border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-pastel-indigo/40 hover:text-pastel-indigo'
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

export default CandidateDetail
