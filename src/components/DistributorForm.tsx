import React, { useMemo, useState, useEffect } from 'react'
import { useAppData } from '../lib/useAppData'
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
  normalizePostalCode,
  validatePostalCode,
  normalizeEmail,
  validateEmail,
  getProvinceFromPostalCode
} from '../lib/data/validators'
import {
  InformationCircleIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  createUpgradeRequest,
  hasPendingRequest
} from '../lib/data/upgradeRequests'
import type {
  Category,
  ChannelType,
  Checklist,
  Distributor,
  DistributorStatus,
  NewDistributor,
  LookupOption
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
  onSubmit?: (data: NewDistributor) => void
  onCancel?: () => void
}

const DistributorForm: React.FC<DistributorFormProps> = ({
  initial = null,
  onSubmit,
  onCancel
}) => {
  const {
    taxonomy,
    brandOptions,
    sectors: sectorOptions,
    channelOptions,
    statusOptions,
    provinceOptions,
    addDistributor,
    updateDistributor
  } = useAppData()

  const getInitialState = (): DistributorFormState => {
    const defaults: DistributorFormState = {
      name: '',
      code: '',
      channelType: 'non_exclusive',
      status: 'pending',
      brands: [],
      sectors: ['telco'],
      province: 'Las Palmas',
      city: '',
      postalCode: '',
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
    (initial as { externalCode?: string })?.externalCode || form.code

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

    // Obtener sugerencias para el nuevo canal
    const suggestions = getSuggestedBrands(newChannel, externalCode)

    // Usar sugerencias si el usuario no ha seleccionado marcas aún
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
    if (!form.city?.trim()) newErrors.city = 'El municipio es obligatorio.'
    if (!form.contactPerson?.trim())
      newErrors.contactPerson = 'El responsable es obligatorio.'

    // Validación de email con nuevo validador
    if (form.email && !validateEmail(form.email)) {
      newErrors.email = 'El formato del correo no es válido.'
    }

    // Validación de teléfono con nuevo validador
    if (form.phone && !validatePhone(form.phone)) {
      newErrors.phone =
        'El teléfono debe ser un número español válido (+34 seguido de 9 dígitos).'
    }

    // Validación de código postal con nuevo validador
    if (form.postalCode && !validatePostalCode(form.postalCode)) {
      newErrors.postalCode =
        'El código postal debe ser válido (entre 01000 y 52999).'
    }

    // Validación de CIF/NIF/NIE siempre obligatoria
    if (!form.taxId?.trim()) {
      newErrors.taxId = 'El CIF/NIF/NIE es obligatorio.'
    } else {
      const taxIdValidation = validateTaxId(form.taxId)
      if (!taxIdValidation.valid) {
        newErrors.taxId =
          taxIdValidation.message || 'El CIF/NIF/NIE no es válido.'
      }
    }

    // Checklist fiscal solo si aplica
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload: NewDistributor = {
      ...form,
      brands: availableBrands,
      phone: sanitisePhone(form.phone)
    }

    if (initial?.id) {
      updateDistributor(initial.id, payload)
    } else {
      addDistributor(payload)
    }
    onSubmit?.(payload)
  }

  const submitDisabled = requiresChecklist && !isChecklistComplete

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold">
          {initial ? 'Editar Distribuidor' : 'Nuevo Distribuidor'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Completa los datos para registrar un nuevo punto de venta.
        </p>
      </header>

      {/* Campos Principales */}
      <section className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Nombre comercial"
          value={form.name}
          onChange={(val) => updateField('name', val)}
          error={errors.name}
          required
        />
        <InputField
          label="Código"
          value={form.code}
          onChange={(val) => updateField('code', val.toUpperCase())}
          placeholder="Ej: ESPSB-123, LWMY-456"
        />
        <SelectField
          label="Canal"
          value={form.channelType}
          onChange={handleChannelChange}
          options={channelOptions}
          required
        />
        <SelectField
          label="Estado"
          value={form.status}
          onChange={(e) =>
            updateField('status', e.target.value as DistributorStatus)
          }
          options={statusOptions}
          required
        />
        <SelectField
          label="Provincia"
          value={form.province}
          onChange={(e) => updateField('province', e.target.value)}
          options={provinceOptions}
          error={errors.province}
          required
        />
        <InputField
          label="Municipio"
          value={form.city}
          onChange={(val) => updateField('city', val)}
          error={errors.city}
          required
        />
        <InputField
          label="Código Postal"
          value={form.postalCode}
          onChange={(val) => {
            const normalized = normalizePostalCode(val)
            updateField('postalCode', normalized)

            // Auto-detectar provincia si es válido
            if (validatePostalCode(normalized)) {
              const detectedProvince = getProvinceFromPostalCode(normalized)
              if (detectedProvince && !form.province) {
                updateField('province', detectedProvince)
              }
            }
          }}
          error={errors.postalCode}
          maxLength={5}
          placeholder="35001"
        />
        <InputField
          label="Fecha de Alta"
          type="date"
          value={form.createdAt}
          onChange={(val) => updateField('createdAt', val)}
        />
      </section>

      {/* Sectores */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Sectores de Actividad *
        </h4>
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
                    ? current.filter(id => id !== sector.id)
                    : [...current, sector.id]
                  updateField('sectors', next)
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${isSelected
                    ? `border-${sector.color}-400 bg-${sector.color}-50/50 dark:bg-${sector.color}-900/20`
                    : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 grayscale hover:grayscale-0'
                  }`}
              >
                <span className="text-2xl">{sector.icon}</span>
                <span className={`font-bold text-sm ${isSelected ? `text-${sector.color}-600 dark:text-${sector.color}-400` : 'text-gray-500'}`}>
                  {sector.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Marcas */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Marcas habilitadas *
        </h4>

        {/* Info: Política detectada */}
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

        {/* Sugerencia inteligente */}
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

        {/* Advertencias de coherencia */}
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
          {brandOptions.filter(b => !b.sectorId || form.sectors?.includes(b.sectorId as any)).map((brand) => {
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
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition ${isSelected
                    ? 'border-pastel-indigo bg-pastel-indigo/10 text-pastel-indigo'
                    : isDisabled
                      ? 'cursor-not-allowed border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-pastel-indigo/50'
                  }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-pastel-indigo' : 'bg-gray-300'}`}
                />
                {brand.label}
              </button>
            )
          })}
        </div>
        {errors.brands && (
          <p className="text-xs text-pastel-red">{errors.brands}</p>
        )}
      </section>

      {/* Datos Fiscales */}
      <section className="rounded-2xl border border-pastel-yellow/40 bg-pastel-yellow/10 p-4 space-y-3">
        <h4 className="text-sm font-semibold text-pastel-yellow">
          Datos fiscales
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="CIF/NIF"
            value={form.taxId}
            onChange={(val) => updateField('taxId', normalizeTaxId(val))}
            error={errors.taxId}
            required
            placeholder="B12345678"
          />
          <InputField
            label="Razón Social"
            value={form.fiscalName}
            onChange={(val) => updateField('fiscalName', val)}
            error={errors.fiscalName}
            required={requiresChecklist}
          />
          <InputField
            label="Dirección Fiscal"
            value={form.fiscalAddress}
            onChange={(val) => updateField('fiscalAddress', val)}
            error={errors.fiscalAddress}
            required={requiresChecklist}
            className="md:col-span-2"
          />
        </div>
        {errors.checklist && (
          <p className="text-xs font-medium text-pastel-red">
            {errors.checklist}
          </p>
        )}
      </section>

      {/* Contacto */}
      <section className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Responsable Principal"
          value={form.contactPerson}
          onChange={(val) => updateField('contactPerson', val)}
          error={errors.contactPerson}
          required
        />
        <InputField
          label="Contacto de Apoyo"
          value={form.contactPersonBackup}
          onChange={(val) => updateField('contactPersonBackup', val)}
        />
        <InputField
          label="Teléfono de Contacto"
          type="tel"
          value={form.phone}
          onChange={(val) => updateField('phone', normalizePhone(val))}
          error={errors.phone}
          placeholder="+34 666 12 34 56"
        />
        <InputField
          label="Email de Contacto"
          type="email"
          value={form.email}
          onChange={(val) => updateField('email', normalizeEmail(val))}
          error={errors.phone}
          placeholder="contacto@ejemplo.com"
        />
      </section>

      {/* Notas y Opciones específicas por canal */}
      <section className="space-y-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Notas internas
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner"
          />
        </label>

        {/* Checkbox upgrade para Non-exclusive */}
        {form.channelType === 'non_exclusive' && (
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.upgradeRequested}
              onChange={(e) =>
                updateField('upgradeRequested', e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-pastel-indigo focus:ring-pastel-indigo"
            />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Solicitar upgrade a tienda exclusiva
            </span>
          </label>
        )}

        {/* Selector de equipo para D2D */}
        {form.channelType === 'd2d' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Equipo D2D (opcional)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              💡 Asigna este distribuidor a un equipo para consolidar ventas.
              Puedes gestionar equipos desde la página de Equipos D2D.
            </p>
            <input
              type="text"
              value={form.teamId ?? ''}
              onChange={(e) => updateField('teamId', e.target.value)}
              placeholder="ID del equipo (ej: TEAM-1234567-ABC)"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        )}
      </section>

      {/* Acciones */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border px-5 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitDisabled}
          className="rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
        >
          {initial ? 'Actualizar' : 'Guardar'}
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
      {label} {required && <span className="text-pastel-red">*</span>}
    </span>
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner ${error ? 'border-pastel-red/60' : 'border-gray-200 dark:border-gray-600'}`}
      {...props}
    />
    {error && <p className="text-xs text-pastel-red">{error}</p>}
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
      {label} {required && <span className="text-pastel-red">*</span>}
    </span>
    <select
      value={value ?? ''}
      onChange={onChange}
      className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner ${error ? 'border-pastel-red/60' : 'border-gray-200 dark:border-gray-600'}`}
    >
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-pastel-red">{error}</p>}
  </label>
)

export default DistributorForm
