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
  detectBrandPolicyByCode,
  validateBrandChannelCoherence,
  CHANNEL_BRAND_DEFAULTS
} from '../lib/helpers/brandDefaults'
import {
  normalizePhone,
  validatePhone,
  normalizeTaxId,
  validateTaxId,
  validatePostalCode,
  normalizeEmail,
  validateEmail,
  getProvinceFromPostalCode
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

// ── Note category config (shared style with CandidateForm) ──────────────────
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
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    border: 'border-l-slate-300',
    btnActive:
      'bg-slate-200 text-slate-700 ring-2 ring-slate-400 border-transparent dark:bg-slate-700 dark:text-slate-200'
  }
}

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

const lbl = 'flex flex-col gap-1 text-sm'
const lbTxt = 'font-medium text-gray-700 dark:text-gray-300 text-sm'
const secCls =
  'space-y-3 rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/40'
const secTitle =
  'text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500'

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
    statusOptions,
    provinceOptions,
    islandOptions,
    municipalityOptions
  } = useAppData()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [quickNote, setQuickNote] = useState('')
  const [quickCategory, setQuickCategory] = useState<NoteCategory>('llamada')
  const [isAddingNote, setIsAddingNote] = useState(false)

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

  // Sync address from initial when Supabase data arrives after mount
  useEffect(() => {
    if (initial?.address && !form.address) {
      setForm((prev) => ({ ...prev, address: initial.address! }))
    }
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
  const detectedPolicy = useMemo(() => {
    return detectBrandPolicyByCode(externalCode)
  }, [externalCode])

  // Sugerencias de marcas según canal y código
  const brandSuggestions = useMemo(() => {
    return getSuggestedBrands(form.channelType, externalCode)
  }, [form.channelType, externalCode])

  // Validar coherencia entre marcas y canal
  const coherenceValidation = useMemo(() => {
    return validateBrandChannelCoherence(
      form.brands || [],
      form.channelType || ''
    )
  }, [form.brands, form.channelType])

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
      [...(initial?.notesHistory ?? [])].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [initial?.notesHistory]
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

  const fc = (err?: string) =>
    `${BASE_INPUT} ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 min-h-0 flex-col gap-0">
      {/* ── Two-column body ──────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[3fr_2fr] overflow-hidden gap-0">

        {/* ── LEFT: campos ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto pr-0 lg:pr-5 space-y-4 pb-2">

          {/* Cabecera */}
          <header className="border-b border-gray-200 dark:border-gray-700 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Red comercial
            </p>
            <h3 className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
              {initial ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
            </h3>
          </header>

          {/* Datos del negocio */}
          <section className={secCls}>
            <h4 className={secTitle}>Datos del negocio</h4>
            <div className="grid gap-3 md:grid-cols-2">
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

              <div className="grid grid-cols-2 gap-3">
                <label className={lbl}>
                  <span className={lbTxt}>Código</span>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) =>
                      updateField('code', e.target.value.toUpperCase())
                    }
                    className={fc()}
                    placeholder="ESPSB-123"
                  />
                </label>
                <label className={lbl}>
                  <span className={lbTxt}>Cód. Externo</span>
                  <input
                    type="text"
                    value={form.externalCode}
                    onChange={(e) =>
                      updateField('externalCode', e.target.value.toUpperCase())
                    }
                    className={fc()}
                    placeholder="PVPTE, LWMY…"
                    title="Código de integración o sistema externo"
                  />
                </label>
              </div>

              {/* Canal */}
              <label className={lbl}>
                <span className={lbTxt}>Canal *</span>
                <select
                  value={form.channelType}
                  onChange={handleChannelChange}
                  className={fc()}
                >
                  {channelOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Estado pills */}
              <div>
                <p className={`${lbTxt} mb-2`}>Estado</p>
                <div className="flex gap-2 flex-wrap">
                  {(['active', 'pending', 'blocked'] as DistributorStatus[]).map(
                    (s) => {
                      const cfg = STATUS_CFG[s]
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('status', s)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            form.status === s
                              ? cfg.active
                              : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:border-indigo-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              form.status === s ? 'bg-white' : cfg.dot
                            }`}
                          />
                          {cfg.label}
                        </button>
                      )
                    }
                  )}
                </div>
              </div>

              {/* Ubicación */}
              <label className={lbl}>
                <span className={lbTxt}>Provincia *</span>
                <select
                  value={form.province}
                  onChange={(e) => {
                    const val = e.target.value
                    updateField('province', val)
                    const firstIsland = islandOptions.find(
                      (i) => i.provinceId === val
                    )
                    if (firstIsland) {
                      updateField('island', firstIsland.id)
                      const firstMun = municipalityOptions.find(
                        (m) => m.islandId === firstIsland.id
                      )
                      if (firstMun) updateField('city', firstMun.id)
                    }
                  }}
                  className={fc(errors.province)}
                >
                  {provinceOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.province && (
                  <span className="text-xs text-red-500">{errors.province}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Isla *</span>
                <select
                  value={form.island || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    updateField('island', val)
                    const firstMun = municipalityOptions.find(
                      (m) => m.islandId === val
                    )
                    if (firstMun) updateField('city', firstMun.id)
                  }}
                  className={fc()}
                >
                  {islandOptions
                    .filter((i) => i.provinceId === form.province)
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Población *</span>
                <select
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className={fc(errors.city)}
                >
                  {municipalityOptions
                    .filter((m) => {
                      const islandId = form.island
                      const island = islandOptions.find((i) => i.id === islandId)
                      return (
                        m.islandId === islandId &&
                        (!island || island.provinceId === form.province)
                      )
                    })
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                </select>
                {errors.city && (
                  <span className="text-xs text-red-500">{errors.city}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Código Postal</span>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 5)
                    updateField('postalCode', digits)
                    if (validatePostalCode(digits)) {
                      const detectedProvince = getProvinceFromPostalCode(digits)
                      if (detectedProvince && !form.province) {
                        updateField('province', detectedProvince)
                      }
                    }
                  }}
                  className={fc(errors.postalCode)}
                  maxLength={5}
                  placeholder="35001"
                />
                {errors.postalCode && (
                  <span className="text-xs text-red-500">{errors.postalCode}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Fecha de Alta</span>
                <input
                  type="date"
                  value={form.createdAt}
                  onChange={(e) => updateField('createdAt', e.target.value)}
                  className={fc()}
                />
              </label>

              <label className={`${lbl} md:col-span-2`}>
                <span className={lbTxt}>Dirección</span>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  className={fc()}
                  placeholder="Ej. Calle Mayor 12, Local 3"
                />
              </label>
            </div>
          </section>

          {/* Sectores de actividad */}
          <section className={secCls}>
            <h4 className={secTitle}>Sectores de actividad</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Define donde opera el distribuidor para filtrar marcas y vistas.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {sectorOptions.map((sector) => {
                const isSelected = form.sectors?.includes(sector.id)
                return (
                  <button
                    key={sector.id}
                    type="button"
                    onClick={() => {
                      const current = form.sectors || []
                      const next = isSelected
                        ? current.filter((id) => id !== sector.id)
                        : [...current, sector.id]
                      updateField('sectors', next)
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `border-${sector.color}-400 bg-${sector.color}-50/50 dark:bg-${sector.color}-900/20`
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 grayscale hover:grayscale-0'
                    }`}
                  >
                    <span className="text-2xl">{sector.icon}</span>
                    <span
                      className={`font-bold text-sm ${isSelected ? `text-${sector.color}-600 dark:text-${sector.color}-400` : 'text-gray-500'}`}
                    >
                      {sector.label}
                    </span>
                  </button>
                )
              })}
            </div>
            {errors.sectors && (
              <p className="text-xs text-red-600" role="alert">
                {errors.sectors}
              </p>
            )}
          </section>

          {/* Marcas habilitadas */}
          <section className={secCls}>
            <h4 className={secTitle}>Marcas habilitadas</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selecciona marcas compatibles con el canal, el sector y la taxonomía
              detectada.
            </p>

            {detectedPolicy && (
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm">
                <InformationCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                <div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    Política detectada:{' '}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {detectedPolicy.note}
                  </span>
                </div>
              </div>
            )}

            {brandSuggestions.source !== 'combined' &&
              brandSuggestions.brands.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3 text-sm">
                  <SparklesIcon className="h-5 w-5 flex-shrink-0 text-purple-500" />
                  <div className="flex-1">
                    <span className="font-medium text-purple-700 dark:text-purple-300">
                      Sugerencia:{' '}
                    </span>
                    <span className="text-purple-600 dark:text-purple-400">
                      {brandSuggestions.reason}
                    </span>
                    {form.brands &&
                      form.brands.length > 0 &&
                      JSON.stringify(form.brands.sort()) !==
                        JSON.stringify(brandSuggestions.brands.sort()) && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              brands: brandSuggestions.brands
                            }))
                          }
                          className="ml-2 rounded px-2 py-1 text-xs font-medium bg-purple-500 text-white hover:bg-purple-600 transition"
                        >
                          Aplicar
                        </button>
                      )}
                  </div>
                </div>
              )}

            {coherenceValidation.warnings.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm">
                <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0 text-amber-500" />
                <div className="flex-1">
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    Advertencias:
                  </span>
                  <ul className="mt-1 list-disc list-inside space-y-1 text-amber-600 dark:text-amber-400">
                    {coherenceValidation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {brandOptions
                .filter((b) => !b.sectorId || form.sectors?.includes(b.sectorId))
                .map((brand) => {
                  const isSelected = availableBrands.includes(brand.id)
                  const isBlocked = category.brandPolicy.blocked?.includes(brand.id)
                  const isAllowed =
                    !category.brandPolicy.allowed ||
                    category.brandPolicy.allowed.includes(brand.id)
                  const isDisabled = isBlocked || !isAllowed

                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => !isDisabled && toggleBrand(brand.id)}
                      disabled={isDisabled}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : isDisabled
                            ? 'cursor-not-allowed border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-indigo-300'
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      />
                      {brand.label}
                    </button>
                  )
                })}
            </div>
            {errors.brands && (
              <p className="text-xs text-red-600">{errors.brands}</p>
            )}
          </section>

          {/* Datos fiscales */}
          <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-700/40 dark:bg-amber-950/30">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Datos fiscales
            </h4>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
              Información legal y checklist mínimo para alta operativa.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={lbl}>
                <span className={lbTxt}>CIF/NIF *</span>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={(e) =>
                    updateField('taxId', normalizeTaxId(e.target.value))
                  }
                  className={fc(errors.taxId)}
                  placeholder="B12345678"
                />
                {errors.taxId && (
                  <span className="text-xs text-red-500">{errors.taxId}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>
                  Razón Social{requiresChecklist && ' *'}
                </span>
                <input
                  type="text"
                  value={form.fiscalName}
                  onChange={(e) => updateField('fiscalName', e.target.value)}
                  className={fc(errors.fiscalName)}
                />
                {errors.fiscalName && (
                  <span className="text-xs text-red-500">
                    {errors.fiscalName}
                  </span>
                )}
              </label>

              <label className={`${lbl} md:col-span-2`}>
                <span className={lbTxt}>
                  Dirección Fiscal{requiresChecklist && ' *'}
                </span>
                <input
                  type="text"
                  value={form.fiscalAddress}
                  onChange={(e) => updateField('fiscalAddress', e.target.value)}
                  className={fc(errors.fiscalAddress)}
                />
                {errors.fiscalAddress && (
                  <span className="text-xs text-red-500">
                    {errors.fiscalAddress}
                  </span>
                )}
              </label>
            </div>
            {errors.checklist && (
              <p className="text-xs font-medium text-red-600">
                {errors.checklist}
              </p>
            )}
          </section>

          {/* Contacto principal */}
          <section className={secCls}>
            <h4 className={secTitle}>Contacto principal</h4>
            <div className="grid gap-3 md:grid-cols-2">
              <label className={lbl}>
                <span className={lbTxt}>Responsable Principal *</span>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) => updateField('contactPerson', e.target.value)}
                  className={fc(errors.contactPerson)}
                />
                {errors.contactPerson && (
                  <span className="text-xs text-red-500">
                    {errors.contactPerson}
                  </span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Contacto de Apoyo</span>
                <input
                  type="text"
                  value={form.contactPersonBackup}
                  onChange={(e) =>
                    updateField('contactPersonBackup', e.target.value)
                  }
                  className={fc()}
                />
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Teléfono de Contacto</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    updateField('phone', normalizePhone(e.target.value))
                  }
                  className={fc(errors.phone)}
                  placeholder="+34 666 12 34 56"
                />
                {errors.phone && (
                  <span className="text-xs text-red-500">{errors.phone}</span>
                )}
              </label>

              <label className={lbl}>
                <span className={lbTxt}>Email de Contacto</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateField('email', normalizeEmail(e.target.value))
                  }
                  className={fc(errors.email)}
                  placeholder="contacto@ejemplo.com"
                />
                {errors.email && (
                  <span className="text-xs text-red-500">{errors.email}</span>
                )}
              </label>
            </div>
          </section>

          {/* Contexto comercial */}
          <section className={secCls}>
            <h4 className={secTitle}>Contexto comercial</h4>
            <label className={lbl}>
              <span className={lbTxt}>Notas internas</span>
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
                className={`${fc()} min-h-[72px] resize-y`}
              />
            </label>

            {form.channelType === 'non_exclusive' && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.upgradeRequested}
                  onChange={(e) =>
                    updateField('upgradeRequested', e.target.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Solicitar upgrade a tienda exclusiva
                </span>
              </label>
            )}

            {form.channelType === 'd2d' && (
              <div>
                <label className={lbl}>
                  <span className={lbTxt}>Equipo D2D (opcional)</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    💡 Asigna este distribuidor a un equipo para consolidar ventas.
                  </p>
                  <input
                    type="text"
                    value={form.teamId ?? ''}
                    onChange={(e) => updateField('teamId', e.target.value)}
                    placeholder="ID del equipo (ej: TEAM-1234567-ABC)"
                    className={fc()}
                  />
                </label>
              </div>
            )}
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
                    : 'Guarda el distribuidor para añadir notas'}
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
            <span>{initial ? 'Actualizar distribuidor' : 'Guardar distribuidor'}</span>
          )}
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
