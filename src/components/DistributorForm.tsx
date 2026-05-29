import React, { useMemo, useState, useEffect } from 'react'
import { useAppData } from '../lib/useAppData'
import { createLogger } from '../lib/logger'

const log = createLogger('DistributorForm')
import {
  emailPattern,
  postalCodePattern,
  spanishMobilePattern,
  taxIdPattern
} from '../lib/data/patterns'
import { sanitisePhone } from '../lib/utils/helpers'
import {
  getSuggestedBrands,
  CHANNEL_BRAND_DEFAULTS
} from '../lib/helpers/brandDefaults'
import {
  normalizePhone,
  validatePhone,
  normalizeTaxId,
  validateTaxId,
  validatePostalCode,
  validateEmail
} from '../lib/data/validators'
import {
  InformationCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import {
  createUpgradeRequest,
  hasPendingRequest
} from '../lib/data/upgradeRequests'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrashIcon } from '@heroicons/react/24/outline'
import { AddressAutocomplete } from './AddressAutocomplete'
import type {
  Category,
  ChannelType,
  Checklist,
  Distributor,
  DistributorStatus,
  NewDistributor,
  LookupOption,
  NoteEntry,
  NoteCategory
} from '../lib/types'

// Tipos locales del formulario
type DistributorFormState = Omit<
  NewDistributor,
  | 'id'
  | 'category'
  | 'brandPolicy'
  | 'checklistComplete'
  | 'completion'
  | 'salesYtd'
>

type FormErrors = Partial<Record<keyof DistributorFormState, string>> & {
  checklist?: string
  brands?: string
}

interface DistributorFormProps {
  initial?: Partial<Distributor> | null
  onSubmit?: (data: NewDistributor) => Promise<void> | void
  onCancel?: () => void
  onAddNote?: (note: NoteEntry) => void | Promise<void>
}

// ── Note category config ─────────────────────────────────────────────────────
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

// ── Status pill config ───────────────────────────────────────────────────────
const STATUS_CFG: Record<
  DistributorStatus,
  { label: string; active: string; dot: string }
> = {
  active: {
    label: 'Activo',
    active:
      'bg-green-500 text-white ring-2 ring-offset-1 ring-green-400 border-transparent',
    dot: 'bg-green-500'
  },
  pending: {
    label: 'Pendiente',
    active:
      'bg-amber-500 text-white ring-2 ring-offset-1 ring-amber-400 border-transparent',
    dot: 'bg-amber-500'
  },
  blocked: {
    label: 'Bloqueado',
    active:
      'bg-red-500 text-white ring-2 ring-offset-1 ring-red-400 border-transparent',
    dot: 'bg-red-500'
  }
}

const BASE_INPUT =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white'

const fieldBaseClassName =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'


function fmtTime(iso: string): string {
  try {
    return format(new Date(iso), "d MMM 'a las' HH:mm", { locale: es })
  } catch {
    return iso
  }
}

const DistributorForm: React.FC<DistributorFormProps> = ({
  initial = null,
  onSubmit,
  onCancel,
  onAddNote
}) => {
  const {
    taxonomy,
    brandOptions,
    sectors: sectorOptions,
    channelOptions,
    provinceOptions,
    islandOptions,
    municipalityOptions
  } = useAppData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedGDPR, setAgreedGDPR] = useState(false)
  const [gdprError, setGdprError] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [quickCategory, setQuickCategory] = useState<NoteCategory>('gpv')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [activeTab, setActiveTab] = useState<'negocio' | 'ubicacion' | 'fiscal' | 'comercial'>('negocio')
  const [localNotes, setLocalNotes] = useState<NoteEntry[]>(
    () => initial?.notesHistory ?? []
  )

  const getInitialState = (): DistributorFormState => {
    const defaults: DistributorFormState = {
      name: '',
      code: '',
      externalCode: '',
      channelType: 'non_exclusive',
      status: 'pending',
      brands: [],
      sectors: [],
      province: 'Las Palmas',
      island: 'Gran Canaria',
      city: '',
      postalCode: '',
      address: '',
      contactPerson: '',
      contactPersonBackup: '',
      phone: '',
      email: '',
      taxId: '',
      fiscalName: '',
      fiscalAddress: '',
      upgradeRequested: false,
      notes: '',
      createdAt: new Date().toISOString().slice(0, 10),
      checklist: {
        taxId: false,
        fiscalName: false,
        fiscalAddress: false,
        email: false,
        phone: false,
        postalCode: false
      }
    }

    if (!initial) return defaults

    return {
      ...defaults,
      ...initial,
      phone: initial.phone ? sanitisePhone(initial.phone) : '',
      checklist: initial.checklist ?? defaults.checklist
    }
  }

  const [form, setForm] = useState<DistributorFormState>(getInitialState)
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    setLocalNotes(initial?.notesHistory ?? [])
  }, [initial?.id, initial?.notesHistory])

  // Sync address from initial when Supabase data arrives after mount
  useEffect(() => {
    if (initial?.address && !form.address) {
      setForm((prev) => ({ ...prev, address: initial.address! }))
    }
  // One-way sync from prop: deliberately omitting form.address to avoid circular update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.address])

  const category = useMemo(
    (): Category => taxonomy.resolveCategory(form.code),
    [form.code, taxonomy]
  )

  const requiresChecklist = useMemo(
    (): boolean => !!category.pendingData,
    [category]
  )

  const isChecklistComplete = useMemo((): boolean => {
    if (!requiresChecklist) return true

    return (
      taxIdPattern.test(form.taxId ?? '') &&
      Boolean(form.fiscalName) &&
      Boolean(form.fiscalAddress) &&
      emailPattern.test(form.email ?? '') &&
      spanishMobilePattern.test(sanitisePhone(form.phone ?? '')) &&
      postalCodePattern.test(form.postalCode ?? '')
    )
  }, [requiresChecklist, form])

  const availableBrands = useMemo(
    () =>
      taxonomy.deriveBrandsForChannel(
        form.brands ?? [],
        form.channelType as ChannelType,
        category
      ),
    [form.brands, form.channelType, category, taxonomy]
  )

  // Extraer externalCode para evitar complex expressions en dependencias
  const externalCode =
    form.externalCode ||
    (initial as { externalCode?: string })?.externalCode ||
    form.code

  // Auto-detectar brandPolicy según external_code

  // Sugerencias de marcas según canal y código
  const brandSuggestions = useMemo(() => {
    return getSuggestedBrands(form.channelType, externalCode)
  }, [form.channelType, externalCode])

  // Validar coherencia entre marcas y canal

  // Efecto: Aplicar sugerencias automáticamente al cambiar canal (solo si no es edición)
  useEffect(() => {
    const currentBrands = form.brands || []
    if (
      !initial &&
      brandSuggestions.brands.length > 0 &&
      currentBrands.length === 0
    ) {
      setForm((current) => ({
        ...current,
        brands: brandSuggestions.brands
      }))
    }
  }, [brandSuggestions.brands, initial, form.brands])

  // Efecto: Crear solicitud de upgrade cuando se marca el checkbox
  useEffect(() => {
    if (form.upgradeRequested && form.name && initial?.id && form.channelType) {
      const distributorId = String(initial.id)
      // Solo crear si no existe solicitud pendiente
      if (!hasPendingRequest(distributorId)) {
        createUpgradeRequest(distributorId, form.name, form.channelType)
      }
    }
  }, [form.upgradeRequested, form.name, form.channelType, initial?.id])

  const sortedNotes = useMemo(
    () =>
      [...localNotes].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [localNotes]
  )

  const updateField = <K extends keyof DistributorFormState>(
    field: K,
    value: DistributorFormState[K]
  ) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const newErrors = { ...current }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newChannel = e.target.value as ChannelType

    const suggestions = getSuggestedBrands(newChannel, externalCode)
    const currentBrands = form.brands || []
    const shouldUseSuggestions = currentBrands.length === 0
    const newBrands = shouldUseSuggestions
      ? suggestions.brands
      : taxonomy.deriveBrandsForChannel(currentBrands, newChannel, category)

    setForm((current) => ({
      ...current,
      channelType: newChannel,
      brands: newBrands
    }))
  }

  const toggleBrand = (brandId: string) => {
    const currentBrands = form.brands ?? []
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter((b) => b !== brandId)
      : [...currentBrands, brandId]
    updateField('brands', newBrands)
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!form.name?.trim())
      newErrors.name = 'El nombre comercial es obligatorio.'
    if (!form.province?.trim())
      newErrors.province = 'La provincia es obligatoria.'
    if (!form.city?.trim()) newErrors.city = 'La población es obligatoria.'
    if (!form.contactPerson?.trim())
      newErrors.contactPerson = 'El responsable es obligatorio.'
    if (!form.sectors || form.sectors.length === 0)
      newErrors.sectors = 'Seleccione al menos un sector de actividad.'

    if (form.email && !validateEmail(form.email)) {
      newErrors.email = 'El formato del correo no es válido.'
    }

    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone =
        'El teléfono debe ser un número español válido (+34 seguido de 9 dígitos).'
    }

    if (form.postalCode && !validatePostalCode(form.postalCode)) {
      newErrors.postalCode =
        'El código postal debe ser válido (entre 01000 y 52999).'
    }

    if (!form.taxId?.trim()) {
      newErrors.taxId = 'El CIF/NIF/NIE es obligatorio.'
    } else {
      const taxIdValidation = validateTaxId(form.taxId)
      if (!taxIdValidation.valid) {
        newErrors.taxId =
          taxIdValidation.message || 'El CIF/NIF/NIE no es válido.'
      }
    }

    if (requiresChecklist && !isChecklistComplete) {
      newErrors.checklist =
        'Debes completar todos los puntos del checklist fiscal.'
    }

    if (availableBrands.length === 0) {
      newErrors.brands = 'Debe seleccionar al menos una marca compatible.'
    }

    if (!agreedGDPR) {
      setGdprError(true)
      return false
    }
    setGdprError(false)

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload: NewDistributor = {
        ...form,
        brands: availableBrands,
        phone: sanitisePhone(form.phone)
      }

      await onSubmit?.(payload)
    } catch (error) {
      log.error('Error during submission:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
      className={`relative px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap ${
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
                Red de Distribución
              </p>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {initial ? form.name || 'Editar Distribuidor' : 'Nuevo Distribuidor'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              form.status === 'active' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
              form.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
              'bg-red-100 text-red-600 dark:bg-red-900/30'
            }`}>
              {STATUS_CFG[form.status || 'pending'].label}
            </span>
          </div>
        </div>
        
        <nav className="flex gap-1 -mb-2 overflow-x-auto no-scrollbar">
          {tabBtn('negocio', 'Información')}
          {tabBtn('ubicacion', 'Ubicación')}
          {tabBtn('fiscal', 'Fiscal & Alta')}
          {tabBtn('comercial', 'Configuración')}
        </nav>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1fr] overflow-hidden gap-6">
        
        {/* ── Form Tabs ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto custom-scrollbar pr-2 space-y-6 pb-4">
          
          {activeTab === 'negocio' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    <InformationCircleIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Datos Principales</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <label className={lbl}>
                    <span className={lbTxt}>Nombre comercial *</span>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="premium-input"
                      placeholder="Nombre del distribuidor"
                    />
                    {errors.name && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.name}</span>}
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className={lbl}>
                      <span className={lbTxt}>Código</span>
                      <input
                        type="text"
                        value={form.code}
                        onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                        className="premium-input"
                      />
                    </label>
                    <label className={lbl}>
                      <span className={lbTxt}>Cód. Externo</span>
                      <input
                        type="text"
                        value={form.externalCode}
                        onChange={(e) => updateField('externalCode', e.target.value.toUpperCase())}
                        className="premium-input"
                      />
                    </label>
                  </div>

                  <label className={lbl}>
                    <span className={lbTxt}>Canal de ventas *</span>
                    <select value={form.channelType} onChange={handleChannelChange} className="premium-input">
                      {channelOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                  </label>

                  <div className="space-y-2">
                    <span className={lbTxt}>Estado Operativo</span>
                    <div className="flex gap-2">
                      {(['active', 'pending', 'blocked'] as DistributorStatus[]).map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('status', s)}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                            form.status === s
                              ? STATUS_CFG[s].active
                              : 'border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          {STATUS_CFG[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <SparklesIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Personas de Contacto</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <label className={lbl}>
                    <span className={lbTxt}>Responsable *</span>
                    <input
                      type="text"
                      value={form.contactPerson}
                      onChange={(e) => updateField('contactPerson', e.target.value)}
                      className="premium-input"
                    />
                    {errors.contactPerson && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.contactPerson}</span>}
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Teléfono principal *</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField('phone', normalizePhone(e.target.value))}
                      className="premium-input"
                    />
                    {errors.phone && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.phone}</span>}
                  </label>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'ubicacion' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                    <InformationCircleIcon className="h-4 w-4 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Localización</h4>
                </div>

                <div className="md:col-span-2 space-y-2 mb-2">
                  <span className={lbTxt}>Buscador Inteligente (Google)</span>
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
                    placeholder="Busca el local o dirección..."
                  />
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <label className={lbl}>
                    <span className={lbTxt}>Provincia</span>
                    <select
                      value={form.province}
                      onChange={(e) => updateField('province', e.target.value)}
                      className="premium-input"
                    >
                      {provinceOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Isla</span>
                    <select
                      value={form.island}
                      onChange={(e) => updateField('island', e.target.value)}
                      className="premium-input"
                    >
                      {islandOptions.filter(i => i.provinceId === form.province).map(i => <option key={i.id} value={i.id}>{i.label}</option>)}
                    </select>
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Población *</span>
                    <select value={form.city} onChange={(e) => updateField('city', e.target.value)} className="premium-input">
                      {municipalityOptions.filter(m => m.islandId === form.island).map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>C.P.</span>
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => updateField('postalCode', e.target.value.slice(0, 5))}
                      className="premium-input"
                      placeholder="35000"
                    />
                  </label>

                  <label className={`${lbl} md:col-span-2`}>
                    <span className={lbTxt}>Dirección Completa</span>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="premium-input"
                    />
                  </label>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'fiscal' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-5 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Datos Fiscales y de Alta</h4>
                </div>

                <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
                  <label className={lbl}>
                    <span className={lbTxt}>CIF / NIF *</span>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) => updateField('taxId', normalizeTaxId(e.target.value))}
                      className="premium-input"
                      placeholder="B12345678"
                    />
                    {errors.taxId && <span className="text-[10px] font-bold text-red-500 uppercase">{errors.taxId}</span>}
                  </label>

                  <label className={lbl}>
                    <span className={lbTxt}>Razón Social *</span>
                    <input
                      type="text"
                      value={form.fiscalName}
                      onChange={(e) => updateField('fiscalName', e.target.value)}
                      className="premium-input"
                    />
                  </label>

                  <label className={`${lbl} md:col-span-2`}>
                    <span className={lbTxt}>Dirección Fiscal</span>
                    <input
                      type="text"
                      value={form.fiscalAddress}
                      onChange={(e) => updateField('fiscalAddress', e.target.value)}
                      className="premium-input"
                    />
                  </label>
                </div>

                {requiresChecklist && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                    <p className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">Checklist de Alta Operativa</p>
                    <div className="space-y-2">
                       {Object.entries(form.checklist || {}).map(([key, val]) => (
                         <div key={key} className="flex items-center gap-2 text-xs">
                           <div className={`h-2 w-2 rounded-full ${val ? 'bg-green-500' : 'bg-slate-300 animate-pulse'}`} />
                           <span className={val ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 font-bold'}>
                             {key === 'taxId' ? 'CIF Válido' : 
                              key === 'fiscalName' ? 'Razón Social' :
                              key === 'fiscalAddress' ? 'Dirección Fiscal' :
                              key === 'email' ? 'Email Corporativo' :
                              key === 'phone' ? 'Teléfono Móvil' :
                              key === 'postalCode' ? 'Código Postal' : key}
                           </span>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'comercial' && (
            <div className="space-y-6 animate-slide-up">
              <section className="premium-card p-5 space-y-6">
                <div>
                  <h4 className="premium-label mb-4">Sectores de Actividad</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {sectorOptions.map(sector => {
                      const isSelected = form.sectors?.includes(sector.id)
                      return (
                        <button
                          key={sector.id}
                          type="button"
                          onClick={() => {
                            const next = isSelected ? form.sectors?.filter(s => s !== sector.id) : [...(form.sectors || []), sector.id]
                            updateField('sectors', next)
                          }}
                          className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                            isSelected 
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 grayscale opacity-60'
                          }`}
                        >
                          <span className="text-3xl">{sector.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter">{sector.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="premium-label mb-4">Marcas Habilitadas</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandOptions.filter(b => !b.sectorId || form.sectors?.includes(b.sectorId)).map(brand => {
                      const isSelected = availableBrands.includes(brand.id)
                      const isBlocked = category.brandPolicy.blocked?.includes(brand.id)
                      const isDisabled = isBlocked
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => !isDisabled && toggleBrand(brand.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                            isSelected 
                              ? 'bg-indigo-600 border-transparent text-white shadow-lg shadow-indigo-500/20' 
                              : isDisabled 
                                ? 'opacity-20 cursor-not-allowed border-slate-200' 
                                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-300'
                          }`}
                        >
                          {brand.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                   <label className={lbl}>
                    <span className={lbTxt}>Notas estratégicas del GPV</span>
                    <textarea
                      value={form.notes}
                      onChange={(e) => updateField('notes', e.target.value)}
                      rows={4}
                      className="premium-input"
                      placeholder="Describe el acuerdo, potencial comercial, etc..."
                    />
                  </label>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* ── Sidebar: Activity ────────────────────────────────────────────── */}
        <div className="flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Historial</h4>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1 mb-4">
             {sortedNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-40">
                  <ClockIcon className="h-10 w-10 mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Sin registros</p>
                </div>
              ) : (
                sortedNotes.map(note => {
                  const cfg = NOTE_CAT_CFG[note.category || 'general']
                  return (
                    <div key={note.id} className="premium-card p-3 group-hover:border-indigo-300 transition-all border-l-4" style={{ borderLeftColor: cfg.border.replace('border-l-', 'var(--color-') }}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[8px] text-slate-400 font-bold">{fmtTime(note.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{note.content}</p>
                    </div>
                  )
                })
              )}
          </div>

          {initial && onAddNote && (
            <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {PICKER_CATS.map(cat => (
                  <button key={cat} type="button" onClick={() => setQuickCategory(cat)} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${quickCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {NOTE_CAT_CFG[cat].label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <textarea value={quickNote} onChange={(e) => setQuickNote(e.target.value)} className="premium-input pr-10 h-16 text-xs resize-none" placeholder="Nueva nota..." />
                <button type="button" onClick={handleAddQuickNote} disabled={!quickNote.trim() || isAddingNote} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
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
            He informado al titular sobre la política de privacidad de <span className="text-indigo-500 font-bold">GPV Canarias</span> y 
            cuento con su consentimiento para el alta en el sistema y el tratamiento de sus 
            datos comerciales y fiscales según el <span className="text-indigo-500 font-bold">RGPD</span>.
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
          <span>{initial ? 'GUARDAR CAMBIOS' : 'CREAR DISTRIBUIDOR'}</span>
        </button>
      </div>
    </form>
  )
}

// --- Componentes de campo genéricos ---

interface InputFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
  type?: string
  placeholder?: string
  maxLength?: number
  className?: string
  title?: string
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  ...props
}) => (
  <label className={`flex flex-col gap-1 text-sm ${props.className ?? ''}`}>
    <span className="font-medium text-gray-700 dark:text-gray-300">
      {label} {required && <span className="text-red-600">*</span>}
    </span>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`${fieldBaseClassName} placeholder:text-gray-400 dark:placeholder:text-gray-500 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
      {...props}
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
  </label>
)

interface SelectFieldProps {
  label: string
  value?: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: LookupOption[]
  error?: string
  required?: boolean
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
  options,
  error,
  required
}) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-medium text-gray-700 dark:text-gray-300">
      {label} {required && <span className="text-red-600">*</span>}
    </span>
    <select
      value={value ?? ''}
      onChange={onChange}
      className={`${fieldBaseClassName} ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600">{error}</p>}
  </label>
)

export default DistributorForm
