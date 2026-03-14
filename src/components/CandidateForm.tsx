import React, { useState } from 'react'
import { useAppData } from '../lib/useAppData'
import { validateTaxId } from '../lib/data/validators'
import type { Candidate, PipelineStage, PipelineStageId } from '../lib/types'

type Island = {
  id: string
  label: string
}

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
  city: string
  island: string
  channelCode: string
  taxId: string // CIF/NIF/NIE
  stage: PipelineStageId
  source: string
  notes: string
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
  onSubmit?: (data: CandidateFormState) => void
  onCancel?: () => void
  initial?: Partial<Candidate> | null
}

// Constantes del formulario
const islands: Island[] = [
  { id: 'Gran Canaria', label: 'Gran Canaria' },
  { id: 'Tenerife', label: 'Tenerife' },
  { id: 'Lanzarote', label: 'Lanzarote' },
  { id: 'Fuerteventura', label: 'Fuerteventura' },
  { id: 'La Palma', label: 'La Palma' },
  { id: 'La Gomera', label: 'La Gomera' },
  { id: 'El Hierro', label: 'El Hierro' }
]

const sources: Source[] = [
  { id: 'referido', label: 'Referido' },
  { id: 'autoregistro', label: 'Autoregistro web' },
  { id: 'evento', label: 'Evento o feria' },
  { id: 'campaña', label: 'Campaña outbound' },
  { id: 'captacion', label: 'Captación puerta a puerta' }
]

const CandidateForm: React.FC<CandidateFormProps> = ({
  onSubmit,
  onCancel,
  initial = null
}) => {
  const { pipelineStages } = useAppData()
  const [errors, setErrors] = useState<CandidateFormErrors>({})

  const getInitialFormState = (): CandidateFormState => {
    const fallbackStage = pipelineStages?.[0]?.id ?? 'new'
    return {
      name: initial?.name ?? '',
      address: initial?.address ?? '',
      city: initial?.city ?? '',
      island: initial?.island ?? 'Gran Canaria',
      channelCode: initial?.channelCode ?? '',
      taxId: initial?.taxId ?? '',
      stage: (initial?.stage ?? fallbackStage) as PipelineStageId,
      source: initial?.source ?? 'referido',
      notes: initial?.notes ?? '',
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
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

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

    // Solo validar formato si se ha introducido un valor (campo opcional)
    if (form.taxId.trim()) {
      const result = validateTaxId(form.taxId.trim())
      if (!result.valid) {
        newErrors.taxId = result.message || 'El CIF/NIF/NIE no es válido.'
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!validate()) return

    const submissionData: CandidateFormState = {
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      island: form.island,
      channelCode: form.channelCode.trim(),
      taxId: form.taxId.trim(),
      stage: form.stage,
      source: form.source,
      notes: form.notes.trim(),
      contact: {
        name: form.contact.name.trim(),
        phone: form.contact.phone.trim(),
        email: form.contact.email.trim()
      }
    }

    onSubmit?.(submissionData)
  }

  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateField('name', event.target.value)
  }

  const handleCityChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateField('city', event.target.value)
  }

  const handleIslandChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateField('island', event.target.value)
  }

  const handleChannelCodeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateField('channelCode', event.target.value.toUpperCase())
  }

  const handleStageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateField('stage', event.target.value as PipelineStageId)
  }

  const handleSourceChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    updateField('source', event.target.value)
  }

  const handleNotesChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    updateField('notes', event.target.value)
  }

  const handleContactNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateContact('name', event.target.value)
  }

  const handleContactPhoneChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateContact('phone', event.target.value)
  }

  const handleContactEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    updateContact('email', event.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {initial ? 'Editar candidato' : 'Nuevo candidato'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Define los datos básicos de la potencial tienda o equipo.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            CIF/NIF/NIE
          </span>
          <input
            type="text"
            value={form.taxId}
            onChange={(e) => updateField('taxId', e.target.value.toUpperCase())}
            className={`w-full rounded-2xl bg-white dark:bg-slate-800 border px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:shadow-lg focus:scale-[1.01] ${errors.taxId ? 'border-red-400 focus:border-red-500 focus:shadow-red-500/10' : 'border-slate-200 dark:border-slate-700/50 focus:border-indigo-400 focus:shadow-indigo-500/10'}`}
            placeholder="Ej. B12345678 o 12345678Z"
            aria-invalid={!!errors.taxId || undefined}
            aria-describedby={errors.taxId ? 'taxid-error' : undefined}
          />
          {errors.taxId && (
            <span
              id="taxid-error"
              className="text-xs text-pastel-red"
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
            onChange={handleNameChange}
            className={`w-full rounded-2xl bg-white dark:bg-slate-800 border px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:shadow-lg focus:scale-[1.01] ${errors.name
                ? 'border-red-400 focus:border-red-500 focus:shadow-red-500/10'
                : 'border-slate-200 dark:border-slate-700/50 focus:border-indigo-400 focus:shadow-indigo-500/10'
              }`}
            placeholder="Ej. Tienda Express Canarias"
            aria-invalid={!!errors.name || undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <span
              id="name-error"
              className="text-xs text-pastel-red"
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
            onChange={(e) => updateField('address', e.target.value)}
            className="w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/10 focus:scale-[1.01]"
            placeholder="Ej. Calle Mayor 12, Local 3"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Localidad objetivo *
          </span>
          <input
            type="text"
            value={form.city}
            onChange={handleCityChange}
            className={`w-full rounded-2xl bg-white dark:bg-slate-800 border px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:shadow-lg focus:scale-[1.01] ${errors.city
                ? 'border-red-400 focus:border-red-500 focus:shadow-red-500/10'
                : 'border-slate-200 dark:border-slate-700/50 focus:border-indigo-400 focus:shadow-indigo-500/10'
              }`}
            placeholder="Ej. San Cristóbal de La Laguna"
            aria-invalid={!!errors.city || undefined}
            aria-describedby={errors.city ? 'city-error' : undefined}
          />
          {errors.city && (
            <span
              id="city-error"
              className="text-xs text-pastel-red"
              role="alert"
            >
              {errors.city}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Isla
          </span>
          <select
            value={form.island}
            onChange={handleIslandChange}
            className="w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all duration-300 focus:border-indigo-400 focus:shadow-lg focus:shadow-indigo-500/10 focus:scale-[1.01]"
            aria-label="Seleccionar isla"
          >
            {islands.map((island) => (
              <option key={island.id} value={island.id}>
                {island.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Código propuesto
          </span>
          <input
            type="text"
            value={form.channelCode}
            onChange={handleChannelCodeChange}
            className={`w-full rounded-2xl bg-white dark:bg-slate-800 border px-4 py-3 text-sm uppercase text-gray-900 dark:text-white outline-none transition-all duration-300 focus:shadow-lg focus:scale-[1.01] ${errors.channelCode
                ? 'border-red-400 focus:border-red-500 focus:shadow-red-500/10'
                : 'border-slate-200 dark:border-slate-700/50 focus:border-indigo-400 focus:shadow-indigo-500/10'
              }`}
            placeholder="Ej. LWMY-NEW-08"
            aria-invalid={!!errors.channelCode || undefined}
            aria-describedby={
              errors.channelCode ? 'channel-code-error' : undefined
            }
          />
          {errors.channelCode && (
            <span
              id="channel-code-error"
              className="text-xs text-pastel-red"
              role="alert"
            >
              {errors.channelCode}
            </span>
          )}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Etapa del pipeline
          </span>
          <select
            value={form.stage}
            onChange={handleStageChange}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
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
            onChange={handleSourceChange}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
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

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Contacto principal
        </h4>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Nombre y apellidos *
            </span>
            <input
              type="text"
              value={form.contact.name}
              onChange={handleContactNameChange}
              className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${errors.contactName
                  ? 'border-pastel-red/60'
                  : 'border-gray-200 dark:border-gray-600'
                }`}
              placeholder="Ej. Laura Hernández"
              aria-invalid={!!errors.contactName || undefined}
              aria-describedby={
                errors.contactName ? 'contact-name-error' : undefined
              }
            />
            {errors.contactName && (
              <span
                id="contact-name-error"
                className="text-xs text-pastel-red"
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
              onChange={handleContactPhoneChange}
              className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${errors.contactPhone
                  ? 'border-pastel-red/60'
                  : 'border-gray-200 dark:border-gray-600'
                }`}
              placeholder="Ej. 600 123 456"
              aria-invalid={!!errors.contactPhone || undefined}
              aria-describedby={
                errors.contactPhone ? 'contact-phone-error' : undefined
              }
            />
            {errors.contactPhone && (
              <span
                id="contact-phone-error"
                className="text-xs text-pastel-red"
                role="alert"
              >
                {errors.contactPhone}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Correo electrónico
            </span>
            <input
              type="email"
              value={form.contact.email}
              onChange={handleContactEmailChange}
              className="rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
              placeholder="Ej. laura@tiendaexpress.es"
            />
          </label>
        </div>
      </section>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Notas estratégicas
        </span>
        <textarea
          value={form.notes}
          onChange={handleNotesChange}
          rows={4}
          className="rounded-2xl border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-900 dark:text-white shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
          placeholder="Potencial de la zona, experiencias previas, necesidades detectadas..."
        />
      </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 transition hover:border-gray-300 dark:border-gray-600 hover:bg-white dark:bg-gray-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {initial ? 'Actualizar candidato' : 'Guardar candidato'}
        </button>
      </div>
    </form>
  )
}

export default CandidateForm
