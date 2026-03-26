import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'

interface Contact {
  name?: string
  phone?: string
  email?: string
}

interface Candidate {
  id: string | number
  name: string
  contact?: Contact
}

interface Distributor {
  id: string | number
  name: string
}

type VisitType =
  | 'presentacion'
  | 'seguimiento'
  | 'formacion'
  | 'incidencias'
  | 'apertura'

type VisitResult = 'pendiente' | 'completada' | 'reprogramar' | 'cancelada'

interface VisitFormData {
  date: string
  scheduledTime: string
  type: VisitType
  objective: string
  summary: string
  nextSteps: string
  result: VisitResult
  durationMinutes: number
  candidateId: string | number | null
}

interface VisitData extends VisitFormData {
  distributorId: string | number | null
}

interface VisitFormProps {
  distributor?: Distributor
  candidate?: Candidate
  initialValues?: Partial<VisitFormData>
  submitLabel?: string
  onSubmit?: (data: VisitData) => void
  onCancel?: () => void
}

type FormErrors = Record<string, string>

const defaultVisit: VisitFormData = {
  date: new Date().toISOString().slice(0, 10),
  scheduledTime: '09:00',
  type: 'presentacion',
  objective: '',
  summary: '',
  nextSteps: '',
  result: 'pendiente',
  durationMinutes: 30,
  candidateId: null
}

const fieldBaseClassName =
  'rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'

const errorFieldClassName =
  'border-red-400 focus:border-red-400 focus:ring-red-500/20'

export function VisitForm({
  distributor,
  candidate,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel
}: VisitFormProps) {
  const [form, setForm] = useState<VisitFormData>(() => ({ ...defaultVisit }))
  const [errors, setErrors] = useState<FormErrors>({})

  const visitSchema = useMemo(
    () =>
      z.object({
        distributorId: z.union([z.string(), z.number()]).nullable(),
        candidateId: z.union([z.string(), z.number()]).nullable(),
        date: z
          .string()
          .trim()
          .min(1, 'Selecciona una fecha.')
          .refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha no valida.'),
        scheduledTime: z
          .string()
          .trim()
          .regex(/^\d{2}:\d{2}$/, 'Formato de hora no valido (HH:MM).')
          .optional()
          .default('09:00'),
        type: z.enum(
          [
            'presentacion',
            'seguimiento',
            'formacion',
            'incidencias',
            'apertura'
          ],
          {
            invalid_type_error: 'Selecciona un tipo de visita.',
            required_error: 'Selecciona un tipo de visita.'
          }
        ),
        objective: z
          .string()
          .trim()
          .min(5, 'Indica un objetivo mas detallado (minimo 5 caracteres).'),
        summary: z
          .string()
          .optional()
          .transform((value) => value?.trim() ?? '')
          .refine((value) => value.length <= 1000, 'Maximo 1000 caracteres.'),
        nextSteps: z
          .string()
          .optional()
          .transform((value) => value?.trim() ?? '')
          .refine((value) => value.length <= 500, 'Maximo 500 caracteres.'),
        result: z.enum(['pendiente', 'completada', 'reprogramar', 'cancelada']),
        durationMinutes: z.coerce
          .number({ invalid_type_error: 'Introduce una duracion valida.' })
          .int('La duracion debe ser un numero entero.')
          .min(10, 'Debe ser al menos de 10 minutos.')
          .max(480, 'No puede superar las 8 horas.')
          .refine((value) => value % 5 === 0, 'Usa intervalos de 5 minutos.')
      }),
    []
  )

  const distributorLabel = useMemo(
    () => distributor?.name ?? 'Distribuidor sin nombre',
    [distributor]
  )

  const candidateLabel = useMemo(() => candidate?.name ?? null, [candidate])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      candidateId: candidate?.id ?? null
    }))
  }, [candidate?.id])

  useEffect(() => {
    if (!initialValues) return
    setForm(() => ({
      ...defaultVisit,
      ...initialValues,
      durationMinutes:
        typeof initialValues.durationMinutes === 'number'
          ? initialValues.durationMinutes
          : defaultVisit.durationMinutes
    }))
  }, [initialValues])

  const updateField = (field: keyof VisitFormData, value: string | number) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const buildPayload = (): VisitData => ({
    distributorId: distributor?.id ?? null,
    candidateId: candidate?.id ?? form.candidateId ?? null,
    date: form.date,
    scheduledTime: form.scheduledTime,
    type: form.type,
    objective: form.objective,
    summary: form.summary,
    nextSteps: form.nextSteps,
    result: form.result,
    durationMinutes: form.durationMinutes
  })

  const validate = (): VisitData | null => {
    const payload = buildPayload()
    const result = visitSchema.safeParse(payload)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      const formatted = Object.fromEntries(
        Object.entries(fieldErrors).map(([key, value]) => [
          key,
          value?.[0] ?? ''
        ])
      )
      setErrors(formatted)
      return null
    }
    setErrors({})
    return result.data
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = validate()
    if (!data) return

    onSubmit?.({
      ...data,
      summary: data.summary ?? '',
      nextSteps: data.nextSteps ?? ''
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Nueva visita
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registrar visita para{' '}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {candidateLabel
              ? `${candidateLabel} (candidato)`
              : distributorLabel}
          </span>
        </p>
      </header>

      {candidateLabel && !distributor && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <p className="font-semibold text-indigo-600 dark:text-indigo-400">
            Información de contacto
          </p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-gray-500 dark:text-gray-400">
                Contacto principal
              </p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {candidate?.contact?.name || 'No registrado'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Teléfono</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">
                {candidate?.contact?.phone || 'Sin teléfono'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Fecha *
          </span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField('date', event.target.value)}
            className={`${fieldBaseClassName} ${errors.date ? errorFieldClassName : ''}`}
          />
          {errors.date && (
            <span className="text-xs text-red-500">{errors.date}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Hora programada
          </span>
          <input
            type="time"
            value={form.scheduledTime}
            onChange={(event) =>
              updateField('scheduledTime', event.target.value)
            }
            className={`${fieldBaseClassName} ${errors.scheduledTime ? errorFieldClassName : ''}`}
          />
          {errors.scheduledTime && (
            <span className="text-xs text-red-500">
              {errors.scheduledTime}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Tipo *
          </span>
          <select
            value={form.type}
            onChange={(event) =>
              updateField('type', event.target.value as VisitType)
            }
            className={`${fieldBaseClassName} ${errors.type ? errorFieldClassName : ''}`}
          >
            <option value="">Selecciona...</option>
            <option value="presentacion">Presentacion</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="formacion">Formacion</option>
            <option value="incidencias">Incidencias</option>
            <option value="apertura">Apertura</option>
          </select>
          {errors.type && (
            <span className="text-xs text-red-500">{errors.type}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Duracion (minutos)
          </span>
          <input
            type="number"
            min={10}
            step={5}
            value={form.durationMinutes}
            onChange={(event) =>
              updateField('durationMinutes', parseInt(event.target.value, 10))
            }
            className={`${fieldBaseClassName} ${errors.durationMinutes ? errorFieldClassName : ''}`}
          />
          {errors.durationMinutes && (
            <span className="text-xs text-red-500">
              {errors.durationMinutes}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Resultado
          </span>
          <select
            value={form.result}
            onChange={(event) =>
              updateField('result', event.target.value as VisitResult)
            }
            className={fieldBaseClassName}
          >
            <option value="pendiente">Pendiente</option>
            <option value="completada">Completada</option>
            <option value="reprogramar">Reprogramar</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Objetivo *
        </span>
        <input
          type="text"
          value={form.objective}
          onChange={(event) => updateField('objective', event.target.value)}
          className={`${fieldBaseClassName} ${errors.objective ? errorFieldClassName : ''}`}
          placeholder="Ej. Revisar volumen de ventas Lowi"
        />
        {errors.objective && (
          <span className="text-xs text-red-500">{errors.objective}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Resumen
        </span>
        <textarea
          value={form.summary}
          onChange={(event) => updateField('summary', event.target.value)}
          rows={3}
          className={`${fieldBaseClassName} ${errors.summary ? errorFieldClassName : ''}`}
          placeholder="Puntos clave tratados durante la visita"
        />
        {errors.summary && (
          <span className="text-xs text-red-500">{errors.summary}</span>
        )}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Próximos pasos
        </span>
        <textarea
          value={form.nextSteps}
          onChange={(event) => updateField('nextSteps', event.target.value)}
          rows={2}
          className={`${fieldBaseClassName} ${errors.nextSteps ? errorFieldClassName : ''}`}
          placeholder="Acciones de seguimiento comprometidas"
        />
        {errors.nextSteps && (
          <span className="text-xs text-red-500">{errors.nextSteps}</span>
        )}
      </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          {submitLabel || 'Guardar visita'}
        </button>
      </div>
    </form>
  )
}
