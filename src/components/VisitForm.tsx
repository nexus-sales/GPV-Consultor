import { useEffect, useMemo, useState } from 'react'
import { z, ZodError } from 'zod'

// Tipos TypeScript para las entidades del dominio
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

// Tipos para el formulario
type VisitType =
  | 'presentacion'
  | 'seguimiento'
  | 'formacion'
  | 'incidencias'
  | 'apertura'
type VisitResult = 'pendiente' | 'completada' | 'reprogramar' | 'cancelada'

interface VisitFormData {
  date: string
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

// Props del componente
interface VisitFormProps {
  distributor?: Distributor
  candidate?: Candidate
  onSubmit?: (data: VisitData) => void
  onCancel?: () => void
}

// Estado de errores del formulario
type FormErrors = Record<string, string>

const defaultVisit: VisitFormData = {
  date: new Date().toISOString().slice(0, 10),
  type: 'presentacion',
  objective: '',
  summary: '',
  nextSteps: '',
  result: 'pendiente',
  durationMinutes: 30,
  candidateId: null
}

export function VisitForm({
  distributor,
  candidate,
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
          .refine(
            (value) => !Number.isNaN(Date.parse(value)),
            'Fecha no válida.'
          ),
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
          .min(5, 'Indica un objetivo más detallado (mínimo 5 caracteres).'),
        summary: z
          .string()
          .optional()
          .transform((value) => value?.trim() ?? '')
          .refine((value) => value.length <= 1000, 'Máximo 1000 caracteres.'),
        nextSteps: z
          .string()
          .optional()
          .transform((value) => value?.trim() ?? '')
          .refine((value) => value.length <= 500, 'Máximo 500 caracteres.'),
        result: z.enum(['pendiente', 'completada', 'reprogramar', 'cancelada']),
        durationMinutes: z.coerce
          .number({ invalid_type_error: 'Introduce una duración válida.' })
          .int('La duración debe ser un número entero.')
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
        <h3 className="text-lg font-semibold text-gray-900">Nueva visita</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registrar visita para{' '}
          <span className="font-medium text-pastel-indigo">
            {candidateLabel
              ? `${candidateLabel} (candidato)`
              : distributorLabel}
          </span>
        </p>
      </header>

      {candidateLabel && !distributor && (
        <div className="rounded-2xl border border-pastel-indigo/40 bg-pastel-indigo/10 p-4 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-pastel-indigo">
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
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.date
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          {errors.date && (
            <span className="text-xs text-pastel-red">{errors.date}</span>
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
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.type
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <option value="">Selecciona...</option>
            <option value="presentacion">Presentación</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="formacion">Formación</option>
            <option value="incidencias">Incidencias</option>
            <option value="apertura">Apertura</option>
          </select>
          {errors.type && (
            <span className="text-xs text-pastel-red">{errors.type}</span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Duración (minutos)
          </span>
          <input
            type="number"
            min={10}
            step={5}
            value={form.durationMinutes}
            onChange={(event) =>
              updateField('durationMinutes', parseInt(event.target.value, 10))
            }
            className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
              errors.durationMinutes
                ? 'border-pastel-red/60'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          />
          {errors.durationMinutes && (
            <span className="text-xs text-pastel-red">
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
            className="rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40"
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
          className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
            errors.objective
              ? 'border-pastel-red/60'
              : 'border-gray-200 dark:border-gray-600'
          }`}
          placeholder="Ej. Revisar volumen de ventas Lowi"
        />
        {errors.objective && (
          <span className="text-xs text-pastel-red">{errors.objective}</span>
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
          className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
            errors.summary
              ? 'border-pastel-red/60'
              : 'border-gray-200 dark:border-gray-600'
          }`}
          placeholder="Puntos clave tratados durante la visita"
        />
        {errors.summary && (
          <span className="text-xs text-pastel-red">{errors.summary}</span>
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
          className={`rounded-2xl border px-4 py-2.5 text-sm shadow-inner focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/40 ${
            errors.nextSteps
              ? 'border-pastel-red/60'
              : 'border-gray-200 dark:border-gray-600'
          }`}
          placeholder="Acciones de seguimiento comprometidas"
        />
        {errors.nextSteps && (
          <span className="text-xs text-pastel-red">{errors.nextSteps}</span>
        )}
      </label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-200 dark:border-gray-600 dark:border-gray-600 dark:border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 transition hover:border-gray-300 dark:border-gray-600 hover:bg-white"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          className="rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pastel-indigo/30 transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:ring-offset-1"
        >
          Guardar visita
        </button>
      </div>
    </form>
  )
}
