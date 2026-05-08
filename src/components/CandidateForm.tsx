import React, { useState, useMemo } from 'react'
import { useAppData } from '../lib/useAppData'
import { validateTaxId } from '../lib/data/validators'
import { taxonomyRules, defaultCategory } from '../lib/data/taxonomy'
import {
  islandOptions,
  municipalityOptions,
  provinceOptions
} from '../lib/data/options'
import {
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type {
  Candidate,
  PipelineStage,
  PipelineStageId,
  NoteEntry,
  NoteCategory,
  CandidatePriority
} from '../lib/types'
import { createLogger } from '../lib/logger'

const log = createLogger('CandidateForm')

type Source = { id: string; label: string }
type ContactInfo = { name: string; phone: string; email: string }

type CandidateFormState = {
  name: string
  address: string
  postalCode: string
  city: string
  island: string
  province: string
  channelCode: string
  taxId: string
  stage: PipelineStageId
  source: string
  notes: string
  categoryId: string
  priority: CandidatePriority
  contact: ContactInfo
}

type CandidateFormField = keyof Omit<CandidateFormState, 'contact'>

type CandidateFormErrors = Partial<{
  name: string
  city: string
  channelCode: string
  taxId: string
  contactName: string
  contactPhone: string
}>

type CandidateFormProps = {
  onSubmit?: (data: CandidateFormState) => void | Promise<void>
  onCancel?: () => void
  initial?: Partial<Candidate> | null
  onAddNote?: (note: NoteEntry) => void | Promise<void>
}

const sources: Source[] = [
  { id: 'referido', label: 'Referido' },
  { id: 'autoregistro', label: 'Autoregistro web' },
  { id: 'evento', label: 'Evento o feria' },
  { id: 'campana', label: 'Campaña outbound' },
  { id: 'captacion', label: 'Captación puerta a puerta' },
  { id: 'tienda-icod', label: 'Tienda Icod' },
  { id: 'tienda-orotava', label: 'Tienda Orotava' },
  { id: 'tienda-la-salle', label: 'Tienda la Salle' }
]

const NOTE_CAT_CFG: Record<
  NoteCategory,
  { label: string; badge: string; border: string; btnActive: string }
> = {
  visita: {
    label: 'Visita',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    border: 'border-l-teal-400',
    btnActive:
      'bg-teal-100 text-teal-700 ring-2 ring-teal-400 border-transparent dark:bg-teal-900/30 dark:text-teal-300'
  },
  llamada: {
    label: 'Llamada',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    border: 'border-l-green-400',
    btnActive:
      'bg-green-100 text-green-700 ring-2 ring-green-400 border-transparent dark:bg-green-900/30 dark:text-green-300'
  },
  email: {
    label: 'Email',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    border: 'border-l-violet-400',
    btnActive:
      'bg-violet-100 text-violet-700 ring-2 ring-violet-400 border-transparent dark:bg-violet-900/30 dark:text-violet-300'
  },
  reunion: {
    label: 'Reunión',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    border: 'border-l-blue-400',
    btnActive:
      'bg-blue-100 text-blue-700 ring-2 ring-blue-400 border-transparent dark:bg-blue-900/30 dark:text-blue-300'
  },
  general: {
    label: 'General',
    badge:
      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    border: 'border-l-slate-300',
    btnActive:
      'bg-slate-200 text-slate-700 ring-2 ring-slate-400 border-transparent dark:bg-slate-700 dark:text-slate-200'
  }
}

const PRIORITY_CFG: Record<
  CandidatePriority,
  { label: string; active: string; dot: string }
> = {
  high: {
    label: 'Alta',
    active: 'bg-red-500 text-white ring-2 ring-offset-1 ring-red-400 border-transparent',
    dot: 'bg-red-500'
  },
  medium: {
    label: 'Media',
    active:
      'bg-amber-500 text-white ring-2 ring-offset-1 ring-amber-400 border-transparent',
    dot: 'bg-amber-500'
  },
  low: {
    label: 'Baja',
    active:
      'bg-slate-400 text-white ring-2 ring-offset-1 ring-slate-400 border-transparent',
    dot: 'bg-slate-400'
  }
}

const BASE_INPUT =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white'

function fmtTime(iso: string): string {
  try {
    return format(new Date(iso), "d MMM 'a las' HH:mm", { locale: es })
  } catch {
    return iso
  }
}

const CandidateForm: React.FC<CandidateFormProps> = ({
  onSubmit,
  onCancel,
  initial = null,
  onAddNote
}) => {
  const {
    pipelineStages = [],
    provinceOptions: ctxProvinces = [],
    islandOptions: ctxIslands = [],
    municipalityOptions: ctxMunicipalities = []
  } = useAppData()

  const finalProvinceOptions =
    ctxProvinces.length > 0 ? ctxProvinces : provinceOptions
  const finalIslandOptions =
    ctxIslands.length > 0 ? ctxIslands : islandOptions
  const finalMunicipalityOptions =
    ctxMunicipalities.length > 0 ? ctxMunicipalities : municipalityOptions

  const [errors, setErrors] = useState<CandidateFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [quickCategory, setQuickCategory] = useState<NoteCategory>('llamada')
  const [isAddingNote, setIsAddingNote] = useState(false)

  const getInitialState = (): CandidateFormState => {
    const fallbackStage = pipelineStages?.[0]?.id ?? 'new'
    const initProv = initial?.province ?? 'Las Palmas'
    const initIsland =
      initial?.island ??
      (initProv === 'Las Palmas' ? 'Gran Canaria' : 'Tenerife')
    return {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      postalCode: initial?.postalCode ?? '',
      city: initial?.city ?? '',
      island: initIsland,
      province: initProv,
      channelCode: initial?.channelCode ?? '',
      taxId: initial?.taxId ?? '',
      stage: (initial?.stage ?? fallbackStage) as PipelineStageId,
      source: initial?.source ?? 'referido',
      notes: initial?.notes ?? '',
      categoryId: initial?.categoryId ?? 'general',
      priority: initial?.priority ?? 'medium',
      contact: {
        name: initial?.contact?.name ?? '',
        phone: initial?.contact?.phone ?? '',
        email: initial?.contact?.email ?? ''
      }
    }
  }

  const [form, setForm] = useState<CandidateFormState>(getInitialState)

  const updateField = <K extends CandidateFormField>(
    field: K,
    value: CandidateFormState[K]
  ): void => {
    setForm((cur) => {
      const next = { ...cur, [field]: value }
      if (field === 'province') {
        const fi = finalIslandOptions.find((i) => i.provinceId === value)
        if (fi) {
          next.island = fi.id
          const fm = finalMunicipalityOptions.find((m) => m.islandId === fi.id)
          if (fm) next.city = fm.id
        } else {
          next.island = ''
          next.city = ''
        }
      }
      if (field === 'island') {
        const fm = finalMunicipalityOptions.find((m) => m.islandId === value)
        if (fm) next.city = fm.id
      }
      return next
    })
  }

  const filteredIslands = useMemo(
    () => finalIslandOptions.filter((i) => i.provinceId === form.province),
    [form.province, finalIslandOptions]
  )

  const filteredMunicipalities = useMemo(
    () =>
      finalMunicipalityOptions.filter((m) => {
        const isl = finalIslandOptions.find((i) => i.id === form.island)
        return (
          m.islandId === form.island &&
          (!isl || isl.provinceId === form.province)
        )
      }),
    [form.island, form.province, finalIslandOptions, finalMunicipalityOptions]
  )

  const updateContact = (field: keyof ContactInfo, value: string): void => {
    setForm((cur) => ({
      ...cur,
      contact: { ...cur.contact, [field]: value }
    }))
  }

  const validate = (): boolean => {
    const e: CandidateFormErrors = {}
    if (!form.name.trim()) e.name = 'El candidato necesita un nombre comercial.'
    if (!form.city.trim()) e.city = 'Indica la localidad objetivo.'
    if (form.taxId.trim()) {
      const r = validateTaxId(form.taxId.trim())
      if (!r.valid) e.taxId = r.message || 'El CIF/NIF/NIE no es válido.'
    }
    if (!form.contact.name.trim()) e.contactName = 'Añade el nombre del contacto.'
    if (!form.contact.phone.trim()) e.contactPhone = 'Añade un teléfono de contacto.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (
    ev: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    ev.preventDefault()
    if (isSubmitting || !validate()) return
    setIsSubmitting(true)
    try {
      await onSubmit?.({
        name: form.name.trim(),
        address: form.address.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        island: form.island,
        province: form.province,
        channelCode: form.channelCode.trim(),
        taxId: form.taxId.trim(),
        stage: form.stage,
        source: form.source,
        notes: form.notes.trim(),
        categoryId: form.categoryId,
        priority: form.priority,
        contact: {
          name: form.contact.name.trim(),
          phone: form.contact.phone.trim(),
          email: form.contact.email.trim()
        }
      })
    } catch (err) {
      log.error('Error during submission:', err)
      setErrors((p) => ({ ...p, name: 'Error al procesar el envío. Revisa los datos.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNote = async (): Promise<void> => {
    if (!quickNote.trim() || !onAddNote) return
    setIsAddingNote(true)
    const entry: NoteEntry = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `note-${Date.now().toString(36)}`,
      title: NOTE_CAT_CFG[quickCategory].label,
      timestamp: new Date().toISOString(),
      content: quickNote.trim(),
      category: quickCategory,
      author: 'GPV',
      status: 'completed'
    }
    try {
      await onAddNote(entry)
      setQuickNote('')
    } finally {
      setIsAddingNote(false)
    }
  }

  const sortedNotes = useMemo(
    () =>
      [...(initial?.notesHistory ?? [])].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [initial?.notesHistory]
  )

  const fc = (err?: string) =>
    `${BASE_INPUT} ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`

  const lbl = 'flex flex-col gap-1 text-sm'
  const lbTxt = 'font-medium text-gray-700 dark:text-gray-300 text-sm'
  const secCls =
    'space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40'
  const secTitle =
    'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col gap-0">
      {/* ── Two-column body ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] overflow-hidden gap-0">

        {/* ── LEFT: campos ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto pr-0 lg:pr-5 space-y-4 pb-2">

          {/* Cabecera */}
          <header className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Pipeline comercial
            </p>
            <h3 className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
              {initial ? 'Editar candidato' : 'Nuevo candidato'}
            </h3>
          </header>

          {/* Datos del negocio */}
          <section className={secCls}>
            <h4 className={secTitle}>Datos del negocio</h4>
            <div className="grid gap-3 grid-cols-2">
              <label className={lbl}>
                <span className={lbTxt}>CIF / NIF / NIE</span>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) =>
                    updateField('taxId', e.target.value.toUpperCase())
                  }
                  className={fc(errors.taxId)}
                  placeholder="B12345678"
                />
                {errors.taxId && (
                  <span className="text-xs text-red-500">{errors.taxId}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Nombre comercial *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={fc(errors.name)}
                  placeholder="Tienda Express Canarias"
                />
                {errors.name && (
                  <span className="text-xs text-red-500">{errors.name}</span>
                )}
              </label>

              <label className={`${lbl} col-span-2`}>
                <span className={lbTxt}>Dirección</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={fc()}
                  placeholder="Calle Mayor 12, Local 3"
                />
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Provincia</span>
                <select
                  value={form.province}
                  onChange={(e) => updateField('province', e.target.value)}
                  className={fc()}
                >
                  {finalProvinceOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Isla</span>
                <select
                  value={form.island}
                  onChange={(e) => updateField('island', e.target.value)}
                  className={fc()}
                >
                  {filteredIslands.length === 0 && (
                    <option value="">Selecciona isla…</option>
                  )}
                  {filteredIslands.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Población objetivo *</span>
                <select
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={fc(errors.city)}
                >
                  {!form.city && (
                    <option value="">Selecciona población…</option>
                  )}
                  {filteredMunicipalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                {errors.city && (
                  <span className="text-xs text-red-500">{errors.city}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Código propuesto</span>
                <input
                  type="text"
                  value={form.channelCode}
                  onChange={(e) =>
                    updateField(
                      'channelCode',
                      e.target.value.toUpperCase()
                    )
                  }
                  className={`${fc(errors.channelCode)} uppercase`}
                  placeholder="LWMY-NEW-08"
                />
                {errors.channelCode && (
                  <span className="text-xs text-red-500">
                    {errors.channelCode}
                  </span>
                )}
              </label>
            </div>
          </section>

          {/* Pipeline y Prioridad */}
          <section className={secCls}>
            <h4 className={secTitle}>Pipeline y Prioridad</h4>

            {/* Stage pills */}
            <div>
              <p className={`${lbTxt} mb-2`}>Etapa del pipeline</p>
              <div className="flex flex-wrap gap-1.5">
                {(pipelineStages || []).map((stage: PipelineStage) => (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() =>
                      updateField('stage', stage.id as PipelineStageId)
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      form.stage === stage.id
                        ? 'bg-indigo-600 text-white border-transparent ring-2 ring-offset-1 ring-indigo-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:border-indigo-300'
                    }`}
                  >
                    {stage.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority pills */}
            <div>
              <p className={`${lbTxt} mb-2`}>Prioridad</p>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as CandidatePriority[]).map(
                  (p) => {
                    const cfg = PRIORITY_CFG[p]
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateField('priority', p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          form.priority === p
                            ? cfg.active
                            : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:border-indigo-300'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            form.priority === p ? 'bg-white' : cfg.dot
                          }`}
                        />
                        {cfg.label}
                      </button>
                    )
                  }
                )}
              </div>
            </div>

            {/* Categoría + Origen */}
            <div className="grid gap-3 grid-cols-2">
              <label className={lbl}>
                <span className={lbTxt}>
                  Categoría / Taxonomía
                  <span className="ml-1 text-[10px] font-normal text-indigo-400">
                    (Controla marcas)
                  </span>
                </span>
                <select
                  value={form.categoryId}
                  onChange={(e) => updateField('categoryId', e.target.value)}
                  className={fc()}
                >
                  <option value={defaultCategory.id}>
                    {defaultCategory.label} (Automática)
                  </option>
                  {taxonomyRules.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Origen</span>
                <select
                  value={form.source}
                  onChange={(e) => updateField('source', e.target.value)}
                  className={fc()}
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* Contacto principal */}
          <section className={secCls}>
            <h4 className={secTitle}>Contacto principal</h4>
            <div className="grid gap-3 grid-cols-2">
              <label className={lbl}>
                <span className={lbTxt}>Nombre y apellidos *</span>
                <div className="relative">
                  <input
                    type="text"
                    value={form.contact.name}
                    onChange={(e) => updateContact('name', e.target.value)}
                    className={`${fc(errors.contactName)} pl-8`}
                    placeholder="Laura Hernández"
                  />
                  <UserIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
                {errors.contactName && (
                  <span className="text-xs text-red-500">
                    {errors.contactName}
                  </span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Teléfono *</span>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.contact.phone}
                    onChange={(e) => updateContact('phone', e.target.value)}
                    className={`${fc(errors.contactPhone)} pl-8`}
                    placeholder="600 123 456"
                  />
                  <PhoneIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
                {errors.contactPhone && (
                  <span className="text-xs text-red-500">
                    {errors.contactPhone}
                  </span>
                )}
              </label>

              <label className={`${lbl} col-span-2`}>
                <span className={lbTxt}>Correo electrónico</span>
                <div className="relative">
                  <input
                    type="email"
                    value={form.contact.email}
                    onChange={(e) => updateContact('email', e.target.value)}
                    className={`${fc()} pl-8`}
                    placeholder="laura@tiendaexpress.es"
                  />
                  <EnvelopeIcon className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                </div>
              </label>
            </div>
          </section>

          {/* Contexto comercial */}
          <section className={secCls}>
            <h4 className={secTitle}>Contexto comercial</h4>
            <label className={lbl}>
              <span className={lbTxt}>Notas estratégicas</span>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className={`${fc()} min-h-[72px] resize-y`}
                placeholder="Potencial de la zona, experiencias previas, necesidades detectadas…"
              />
            </label>
          </section>
        </div>

        {/* ── RIGHT: historial de notas ────────────────────────────────── */}
        <div className="hidden lg:flex flex-col min-h-0 border-l border-gray-200 dark:border-gray-700 pl-5 overflow-hidden">
          {/* Cabecera panel */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Historial de notas
            </span>
            <span className="ml-auto rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-300">
              {sortedNotes.length}
            </span>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-3">
            {sortedNotes.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center">
                <ClockIcon className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {initial
                    ? 'Sin notas registradas todavía'
                    : 'Guarda el candidato para añadir notas'}
                </p>
              </div>
            ) : (
              sortedNotes.map((note) => {
                const cat = note.category ?? 'general'
                const cfg = NOTE_CAT_CFG[cat] ?? NOTE_CAT_CFG.general
                return (
                  <div
                    key={note.id}
                    className={`border-l-2 pl-3 py-2 rounded-r-lg bg-white dark:bg-gray-800/60 ${cfg.border}`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400 dark:text-gray-500">
                        {fmtTime(note.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300">
                      {note.content}
                    </p>
                    {note.author && (
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                        — {note.author}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Añadir nota rápida (solo en modo edición con onAddNote) */}
          {initial && onAddNote && (
            <div className="flex-shrink-0 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Añadir nota
              </p>
              {/* Category selector */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(NOTE_CAT_CFG) as NoteCategory[]).map((cat) => {
                  const cfg = NOTE_CAT_CFG[cat]
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuickCategory(cat)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                        quickCategory === cat
                          ? cfg.btnActive
                          : 'border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                rows={3}
                className={`${BASE_INPUT} resize-none text-xs`}
                placeholder={`Nueva nota de ${NOTE_CAT_CFG[quickCategory].label.toLowerCase()}…`}
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!quickNote.trim() || isAddingNote}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                {isAddingNote ? 'Guardando…' : 'Añadir nota'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-shrink-0 flex-col-reverse gap-3 border-t border-gray-200 dark:border-gray-700 pt-4 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>{initial ? 'Actualizando…' : 'Guardando…'}</span>
            </>
          ) : (
            <span>
              {initial ? 'Actualizar candidato' : 'Guardar candidato'}
            </span>
          )}
        </button>
      </div>
    </form>
  )
}

export default CandidateForm
