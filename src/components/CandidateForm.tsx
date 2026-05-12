import React, { useEffect, useMemo, useState } from 'react'
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
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AddressAutocomplete } from './AddressAutocomplete'
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
  // Legacy categories — kept for display of old notes
  visita: {
    label: 'Visita',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    border: 'border-l-teal-400',
    btnActive: 'bg-teal-100 text-teal-700 ring-2 ring-teal-400 border-transparent dark:bg-teal-900/30 dark:text-teal-300'
  },
  llamada: {
    label: 'Llamada',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    border: 'border-l-green-400',
    btnActive: 'bg-green-100 text-green-700 ring-2 ring-green-400 border-transparent dark:bg-green-900/30 dark:text-green-300'
  },
  email: {
    label: 'Email',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    border: 'border-l-violet-400',
    btnActive: 'bg-violet-100 text-violet-700 ring-2 ring-violet-400 border-transparent dark:bg-violet-900/30 dark:text-violet-300'
  },
  reunion: {
    label: 'Reunión',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    border: 'border-l-blue-400',
    btnActive: 'bg-blue-100 text-blue-700 ring-2 ring-blue-400 border-transparent dark:bg-blue-900/30 dark:text-blue-300'
  },
  general: {
    label: 'General',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    border: 'border-l-slate-300',
    btnActive: 'bg-slate-200 text-slate-700 ring-2 ring-slate-400 border-transparent dark:bg-slate-700 dark:text-slate-200'
  },
  // Active categories for new notes
  gpv: {
    label: 'GPV',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    border: 'border-l-green-500',
    btnActive: 'bg-green-600 text-white ring-2 ring-green-500 border-transparent'
  },
  observacion: {
    label: 'Observación',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    border: 'border-l-amber-400',
    btnActive: 'bg-amber-100 text-amber-700 ring-2 ring-amber-400 border-transparent dark:bg-amber-900/30 dark:text-amber-300'
  },
  seguimiento: {
    label: 'Seguimiento',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    border: 'border-l-indigo-400',
    btnActive: 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400 border-transparent dark:bg-indigo-900/30 dark:text-indigo-300'
  },
  incidencia: {
    label: 'Incidencia',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    border: 'border-l-red-500',
    btnActive: 'bg-red-100 text-red-700 ring-2 ring-red-500 border-transparent dark:bg-red-900/30 dark:text-red-300'
  }
}

// Categories shown in the quick-add picker
const PICKER_CATS: NoteCategory[] = ['gpv', 'observacion', 'seguimiento', 'incidencia']

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
  const [agreedGDPR, setAgreedGDPR] = useState(false)
  const [gdprError, setGdprError] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [quickCategory, setQuickCategory] = useState<NoteCategory>('gpv')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [activeTab, setActiveTab] = useState<'negocio' | 'contacto' | 'comercial'>('negocio')
  const [localNotes, setLocalNotes] = useState<NoteEntry[]>(
    () => initial?.notesHistory ?? []
  )

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

  useEffect(() => {
    setLocalNotes(initial?.notesHistory ?? [])
  }, [initial?.id, initial?.notesHistory])

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
    
    if (!agreedGDPR) {
      setGdprError(true)
      return false
    }
    setGdprError(false)
    
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

  const sortedNotes = useMemo(
    () =>
      [...localNotes].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [localNotes]
  )

  const handleAddQuickNote = async (): Promise<void> => {
    if (!quickNote.trim() || !onAddNote || !initial?.id) return
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
      setLocalNotes((current) => [
        entry,
        ...current.filter((note) => note.id !== entry.id)
      ])
      await onAddNote(entry)
      setQuickNote('')
    } catch (err) {
      setLocalNotes((current) => current.filter((note) => note.id !== entry.id))
      log.error('Error adding note:', err)
    } finally {
      setIsAddingNote(false)
    }
  }

  const lbl = 'flex flex-col gap-1.5'
  const lbTxt = 'premium-label'
  const tabBtn = (id: typeof activeTab, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`relative px-4 py-2 text-sm font-semibold transition-all ${
        activeTab === id
          ? 'text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {label}
      {activeTab === id && (
        <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 rounded-full animate-fade-in" />
      )}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col gap-0 animate-fade-in">
      {/* ── Header with Tabs ────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="premium-gradient h-2 w-2 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                Gestión de Lead
              </p>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {initial ? form.name || 'Editar candidato' : 'Nuevo candidato'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              form.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' :
              form.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
              'bg-slate-100 text-slate-600 dark:bg-slate-800'
            }`}>
              Prioridad {PRIORITY_CFG[form.priority].label}
            </span>
          </div>
        </div>
        
        <nav className="flex gap-1 -mb-2 overflow-x-auto no-scrollbar">
          {tabBtn('negocio', 'Datos Negocio')}
          {tabBtn('contacto', 'Contacto')}
          {tabBtn('comercial', 'Estrategia')}
        </nav>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[1.8fr_1.2fr] overflow-hidden gap-6">
        
        {/* ── Form Tabs ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
          
          {activeTab === 'negocio' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    <UserIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Identificación y Ubicación</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={lbl}>
                      <span className={lbTxt}>Buscador de Google</span>
                      <AddressAutocomplete
                        onAddressSelect={(details) => {
                          setForm((prev) => ({
                            ...prev,
                            address: details.address,
                            city: details.city,
                            postalCode: details.postalCode,
                            province: details.province
                          }))
                        }}
                        placeholder="Escribe el nombre del local o dirección..."
                      />
                    </label>
                  </div>

                  <label className={lbl}>
                    <span className={lbTxt}>Nombre comercial *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="premium-input"
                      placeholder="Tienda Express"
                    />
                    {errors.name && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.name}</span>}
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>CIF / NIF / NIE</span>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) => updateField('taxId', e.target.value.toUpperCase())}
                      className="premium-input"
                      placeholder="B12345678"
                    />
                    {errors.taxId && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.taxId}</span>}
                  </label>

                  <label className={`${lbl} md:col-span-2`}>
                    <span className={lbTxt}>Dirección exacta</span>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="premium-input"
                    />
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Provincia</span>
                    <select value={form.province} onChange={(e) => updateField('province', e.target.value)} className="premium-input">
                      {finalProvinceOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Isla</span>
                    <select value={form.island} onChange={(e) => updateField('island', e.target.value)} className="premium-input">
                      {filteredIslands.map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              <section className="premium-card p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                    <ClockIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Estado del Pipeline</h4>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {pipelineStages.map(stage => (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => updateField('stage', stage.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        form.stage === stage.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'contacto' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <PhoneIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Información de Contacto</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <label className={lbl}>
                    <span className={lbTxt}>Nombre del Responsable *</span>
                    <input
                      type="text"
                      value={form.contact.name}
                      onChange={(e) => updateContact('name', e.target.value)}
                      className="premium-input"
                      placeholder="Nombre y apellidos"
                    />
                    {errors.contactName && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.contactName}</span>}
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Teléfono de contacto *</span>
                    <input
                      type="tel"
                      value={form.contact.phone}
                      onChange={(e) => updateContact('phone', e.target.value)}
                      className="premium-input"
                      placeholder="+34 600 000 000"
                    />
                    {errors.contactPhone && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.contactPhone}</span>}
                  </label>

                  <label className={`${lbl} md:col-span-2`}>
                    <span className={lbTxt}>Email</span>
                    <input
                      type="email"
                      value={form.contact.email}
                      onChange={(e) => updateContact('email', e.target.value)}
                      className="premium-input"
                      placeholder="email@ejemplo.com"
                    />
                  </label>
                </div>
              </section>

              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-900/30">
                    <PlusIcon className="h-4 w-4 text-violet-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Origen del Lead</h4>
                </div>
                <select value={form.source} onChange={(e) => updateField('source', e.target.value)} className="premium-input">
                  {sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </section>
            </div>
          )}

          {activeTab === 'comercial' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/30">
                    <SparklesIcon className="h-4 w-4 text-rose-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Análisis Comercial</h4>
                </div>

                <div className="space-y-4">
                  <label className={lbl}>
                    <span className={lbTxt}>Categoría Taxonómica</span>
                    <select value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)} className="premium-input">
                      <option value={defaultCategory.id}>{defaultCategory.label} (Automática)</option>
                      {taxonomyRules.map(rule => <option key={rule.id} value={rule.id}>{rule.label}</option>)}
                    </select>
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Notas estratégicas del GPV</span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={6}
                      className="premium-input min-h-[150px]"
                      placeholder="Describe el potencial, competencia en la zona, etc..."
                    />
                  </label>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ── Sidebar: Activity Feed ───────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Actividad</h4>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
              {sortedNotes.length} EVENTOS
            </span>
          </div>

          {/* Activity Feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-1">
            {sortedNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 opacity-40">
                <ClockIcon className="h-10 w-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Sin registros</p>
              </div>
            ) : (
              sortedNotes.map((note) => {
                const cfg = NOTE_CAT_CFG[note.category || 'general']
                return (
                  <div key={note.id} className="relative pl-6 pb-2 group">
                    <div className="absolute left-0 top-1.5 h-2 w-2 rounded-full border-2 border-white dark:border-slate-900 z-10" style={{ backgroundColor: cfg.border.replace('border-l-', 'var(--color-') }} />
                    <div className="absolute left-[3px] top-4 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 group-last:bg-transparent" />
                    
                    <div className="premium-card p-3 group-hover:border-indigo-300 dark:group-hover:border-indigo-900/50 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold">{fmtTime(note.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{note.content}</p>
                      {note.author && (
                        <div className="mt-2 flex items-center gap-1">
                          <div className="h-4 w-4 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[8px] font-black text-indigo-600">
                            {note.author[0]}
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{note.author}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Quick Note Input */}
          {initial && onAddNote && (
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                {PICKER_CATS.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setQuickCategory(cat)}
                    className={`whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                      quickCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {NOTE_CAT_CFG[cat].label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea
                  value={quickNote}
                  onChange={(e) => setQuickNote(e.target.value)}
                  className="premium-input pr-10 resize-none h-20 text-xs"
                  placeholder="Añadir comentario..."
                />
                <button
                  type="button"
                  onClick={handleAddQuickNote}
                  disabled={!quickNote.trim() || isAddingNote}
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GDPR Consent */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-4 px-1">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center h-5">
            <input
              type="checkbox"
              checked={agreedGDPR}
              onChange={(e) => setAgreedGDPR(e.target.checked)}
              className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
            />
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            He informado al contacto sobre la presente política de privacidad y 
            cuento con su consentimiento para el tratamiento de sus datos personales 
            con fines comerciales, de acuerdo con el <span className="text-indigo-500 font-bold">RGPD</span>.
          </div>
        </label>
        {gdprError && (
          <p className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">
            Acción requerida: Confirmar cumplimiento RGPD
          </p>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            Descartar
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="premium-gradient px-10 py-3 rounded-2xl text-sm font-black text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          ) : null}
          <span>{initial ? 'GUARDAR CAMBIOS' : 'CREAR CANDIDATO'}</span>
        </button>
      </div>
    </form>
  )
}

export default CandidateForm
