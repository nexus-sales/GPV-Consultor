import React, { useState, useMemo } from 'react'
import { useAppData } from '../lib/useAppData'
import { validateTaxId } from '../lib/data/validators'
import { taxonomyRules, defaultCategory } from '../lib/data/taxonomy'
import { 
  islandOptions, 
  municipalityOptions, 
  provinceOptions 
} from '../lib/data/options'
import type { Candidate, PipelineStage, PipelineStageId } from '../lib/types'
import { createLogger } from '../lib/logger'

const log = createLogger('CandidateForm')

type Source = {
  id: string
  label: string
}

type ContactInfo = {
  name: string
  phone: string
  email: string
}

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

const fieldBaseClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
const sectionClassName =
  'space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-900/60'

const CandidateForm: React.FC<CandidateFormProps> = ({
  onSubmit,
  onCancel,
  initial = null
}) => {
  const { 
    pipelineStages = [], 
    provinceOptions: contextProvinces = [],
    islandOptions: contextIslands = [], 
    municipalityOptions: contextMunicipalities = [] 
  } = useAppData()

  const finalProvinceOptions = contextProvinces.length > 0 ? contextProvinces : provinceOptions
  const finalIslandOptions = contextIslands.length > 0 ? contextIslands : islandOptions
  const finalMunicipalityOptions = contextMunicipalities.length > 0 ? contextMunicipalities : municipalityOptions

  const [errors, setErrors] = useState<CandidateFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getInitialFormState = (): CandidateFormState => {
    const fallbackStage = pipelineStages?.[0]?.id ?? 'new'

    // Asegurar valores iniciales coherentes con la jerarquía
    const initialProvince = initial?.province ?? 'Las Palmas'
    const initialIsland = initial?.island ?? (initialProvince === 'Las Palmas' ? 'Gran Canaria' : 'Tenerife')

    return {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      postalCode: initial?.postalCode ?? '',
      city: initial?.city ?? '',
      island: initialIsland,
      province: initialProvince,
      channelCode: initial?.channelCode ?? '',
      taxId: initial?.taxId ?? '',
      stage: (initial?.stage ?? fallbackStage) as PipelineStageId,
      source: initial?.source ?? 'referido',
      notes: initial?.notes ?? '',
      categoryId: initial?.categoryId ?? 'general',
      contact: {
        name: initial?.contact?.name ?? '',
        phone: initial?.contact?.phone ?? '',
        email: initial?.contact?.email ?? ''
      }
    }
  }

  const [form, setForm] = useState<CandidateFormState>(getInitialFormState)

  const updateField = <K extends CandidateFormField>(
    field: K,
    value: CandidateFormState[K]
  ): void => {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value
      }

      // Reset dependientes si cambia la provincia
      if (field === 'province') {
        const firstIsland = finalIslandOptions.find(
          (i) => i.provinceId === value
        )
        if (firstIsland) {
          next.island = firstIsland.id
          const firstMun = finalMunicipalityOptions.find(
            (m) => m.islandId === firstIsland.id
          )
          if (firstMun) {
            next.city = firstMun.id
          }
        } else {
          // Si por alguna razón no hay islas para esa provincia (no debería pasar)
          next.island = ''
          next.city = ''
        }
      }

      // Reset dependientes si cambia la isla
      if (field === 'island') {
        const firstMunicipality = finalMunicipalityOptions.find(
          (m) => m.islandId === value
        )
        if (firstMunicipality) {
          next.city = firstMunicipality.id
        }
      }

      return next
    })
  }

  const filteredIslands = useMemo(() => {
    return finalIslandOptions.filter((i) => i.provinceId === form.province)
  }, [form.province, finalIslandOptions])

  const filteredMunicipalities = useMemo(() => {
    return finalMunicipalityOptions.filter((m) => {
      const island = finalIslandOptions.find(i => i.id === form.island)
      return m.islandId === form.island && (!island || island.provinceId === form.province)
    })
  }, [form.island, form.province, finalIslandOptions, finalMunicipalityOptions])

  const updateContact = (field: keyof ContactInfo, value: string): void => {
    setForm((current) => ({
      ...current,
      contact: {
        ...current.contact,
        [field]: value
      }
    }))
  }

  const validate = (): boolean => {
    const newErrors: CandidateFormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'El candidato necesita un nombre comercial.'
    }

    if (!form.city.trim()) {
      newErrors.city = 'Indica la localidad objetivo.'
    }

    if (form.taxId.trim()) {
      const result = validateTaxId(form.taxId.trim())
      if (!result.valid) {
        newErrors.taxId = result.message || 'El CIF/NIF/NIE no es valido.'
      }
    }

    if (!form.contact.name.trim()) {
      newErrors.contactName = 'Añade el nombre del contacto.'
    }

    if (!form.contact.phone.trim()) {
      newErrors.contactPhone = 'Añade un teléfono de contacto.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()
    if (isSubmitting) return
    if (!validate()) return

    setIsSubmitting(true)
        try {
      const submissionData: CandidateFormState = {
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
        contact: {
          name: form.contact.name.trim(),
          phone: form.contact.phone.trim(),
          email: form.contact.email.trim()
        }
      }

      await onSubmit?.(submissionData)
    } catch (error) {
      log.error('Error during submission:', error)
      setErrors((prev) => ({
        ...prev,
        name: 'Error al procesar el envio. Revisa los datos.'
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header className="border-b border-gray-200 pb-4 dark:border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
          Pipeline comercial
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          {initial ? 'Editar candidato' : 'Nuevo candidato'}
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Define la ficha base, el contacto principal y el contexto comercial
          sin sobrecargar el alta.
        </p>
      </header>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Datos del negocio
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Identificación, ubicación y código operativo del candidato.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              CIF/NIF/NIE
            </span>
            <input
              type="text"
              value={form.taxId}
              onChange={(event) =>
                updateField('taxId', event.target.value.toUpperCase())
              }
              className={`${fieldBaseClassName} ${errors.taxId ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              placeholder="Ej. B12345678 o 12345678Z"
              aria-invalid={!!errors.taxId || undefined}
              aria-describedby={errors.taxId ? 'taxid-error' : undefined}
            />
            {errors.taxId && (
              <span
                id="taxid-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.taxId}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Nombre comercial *
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              className={`${fieldBaseClassName} ${errors.name ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              placeholder="Ej. Tienda Express Canarias"
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <span
                id="name-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.name}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Dirección
            </span>
            <input
              type="text"
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              className={fieldBaseClassName}
              placeholder="Ej. Calle Mayor 12, Local 3"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Provincia
            </span>
            <select
              value={form.province}
              onChange={(event) => updateField('province', event.target.value)}
              className={fieldBaseClassName}
              aria-label="Seleccionar provincia"
            >
              {finalProvinceOptions.map((prov) => (
                <option key={prov.id} value={prov.id}>
                  {prov.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Isla
            </span>
            <select
              value={form.island}
              onChange={(event) => updateField('island', event.target.value)}
              className={fieldBaseClassName}
              aria-label="Seleccionar isla"
            >
              {filteredIslands.length === 0 && (
                <option value="">Selecciona isla...</option>
              )}
              {filteredIslands.map((island) => (
                <option key={island.id} value={island.id}>
                  {island.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Población objetivo *
            </span>
            <select
              value={form.city}
              onChange={(event) => updateField('city', event.target.value)}
              className={`${fieldBaseClassName} ${errors.city ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              aria-invalid={!!errors.city || undefined}
              aria-describedby={errors.city ? 'city-error' : undefined}
            >
              {!form.city && <option value="">Selecciona población...</option>}
              {filteredMunicipalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {errors.city && (
              <span
                id="city-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.city}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Código propuesto
            </span>
            <input
              type="text"
              value={form.channelCode}
              onChange={(event) =>
                updateField('channelCode', event.target.value.toUpperCase())
              }
              className={`${fieldBaseClassName} uppercase ${errors.channelCode ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              placeholder="Ej. LWMY-NEW-08"
              aria-invalid={!!errors.channelCode || undefined}
              aria-describedby={
                errors.channelCode ? 'channel-code-error' : undefined
              }
            />
            {errors.channelCode && (
              <span
                id="channel-code-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.channelCode}
              </span>
            )}
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Clasificacion comercial
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Segmenta el candidato y define su punto de entrada en el pipeline.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Categoria / Taxonomia
            <span className="ml-1 text-[10px] font-normal text-indigo-400">
              (Controla acceso a marcas)
            </span>
          </span>
          <select
            value={form.categoryId}
            onChange={(event) => updateField('categoryId', event.target.value)}
            className={fieldBaseClassName}
            aria-label="Seleccionar categoria"
          >
            <option value={defaultCategory.id}>
              {defaultCategory.label} (Automática por código)
            </option>
            {taxonomyRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.label} - {rule.description}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Etapa del pipeline
            </span>
            <select
              value={form.stage}
              onChange={(event) =>
                updateField('stage', event.target.value as PipelineStageId)
              }
              className={fieldBaseClassName}
              aria-label="Seleccionar etapa del pipeline"
            >
              {(pipelineStages || []).map((stage: PipelineStage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Origen de la oportunidad
            </span>
            <select
              value={form.source}
              onChange={(event) => updateField('source', event.target.value)}
              className={fieldBaseClassName}
              aria-label="Seleccionar origen de la oportunidad"
            >
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Contacto principal
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Persona responsable y vias de contacto para el seguimiento
            comercial.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Nombre y apellidos *
            </span>
            <input
              type="text"
              value={form.contact.name}
              onChange={(event) => updateContact('name', event.target.value)}
              className={`${fieldBaseClassName} ${errors.contactName ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              placeholder="Ej. Laura Hernandez"
              aria-invalid={!!errors.contactName || undefined}
              aria-describedby={
                errors.contactName ? 'contact-name-error' : undefined
              }
            />
            {errors.contactName && (
              <span
                id="contact-name-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.contactName}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Teléfono *
            </span>
            <input
              type="tel"
              value={form.contact.phone}
              onChange={(event) => updateContact('phone', event.target.value)}
              className={`${fieldBaseClassName} ${errors.contactPhone ? 'border-red-400 focus:border-red-400 focus:ring-red-500/20' : ''}`}
              placeholder="Ej. 600 123 456"
              aria-invalid={!!errors.contactPhone || undefined}
              aria-describedby={
                errors.contactPhone ? 'contact-phone-error' : undefined
              }
            />
            {errors.contactPhone && (
              <span
                id="contact-phone-error"
                className="text-xs text-red-500"
                role="alert"
              >
                {errors.contactPhone}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Correo electronico
            </span>
            <input
              type="email"
              value={form.contact.email}
              onChange={(event) => updateContact('email', event.target.value)}
              className={fieldBaseClassName}
              placeholder="Ej. laura@tiendaexpress.es"
            />
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Contexto comercial
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Observaciones utiles para la prospeccion y el siguiente contacto.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Notas estratégicas
          </span>
          <textarea
            value={form.notes}
            onChange={(event) => updateField('notes', event.target.value)}
            rows={4}
            className={`${fieldBaseClassName} min-h-[112px] resize-y`}
            placeholder="Potencial de la zona, experiencias previas, necesidades detectadas..."
          />
        </label>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="h-4 w-4 animate-spin text-white"
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
              <span>{initial ? 'Actualizando...' : 'Guardando...'}</span>
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
