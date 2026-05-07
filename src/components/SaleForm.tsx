import { useMemo, useState, useEffect } from 'react'
import { useAppData } from '../lib/useAppData'
import { sectorFamilies } from '../lib/data/config'
import type {
  SectorId,
  Sector,
  SaleStatus,
  SaleDocumentType,
  SaleSector,
  SaleMode,
  Sale,
  CommissionAgreement,
  CommissionTier
} from '../lib/types'

interface BrandOption {
  id: string
  label: string
  sectorId?: string
}

interface Distributor {
  id: string | number
  name: string
  code?: string
  completion?: number
  brandPolicy?: {
    allowed?: string[] | null
    blocked?: string[]
  }
}

interface SaleFormData {
  date: string
  sectorId: SectorId
  brand: string
  family: string
  operations: number
  notes: string
  // Nuevos campos
  sector: SaleSector
  modo: SaleMode
  tipoDocumento: SaleDocumentType
  nombreCliente: string
  documento: string
  fechaOferta: string
  fechaCierre: string
  status: SaleStatus
  observaciones: string
}

interface SaleData extends Partial<Sale> {
  distributorId: string | number
}

interface SaleFormProps {
  distributor?: Distributor
  onSubmit?: (data: SaleData) => void
  onCancel?: () => void
}

type FormErrors = Record<string, string>

const fieldBaseClassName =
  'rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors duration-150 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
const sectionClassName =
  'space-y-4 rounded-xl border border-gray-200 bg-gray-50/80 p-5 dark:border-gray-800 dark:bg-gray-900/60'

const defaultSale: SaleFormData = {
  date: new Date().toISOString().slice(0, 10),
  sectorId: 'telco',
  brand: '',
  family: '',
  operations: 1,
  notes: '',
  sector: 'Telefonía',
  modo: 'RESI',
  tipoDocumento: 'DNI',
  nombreCliente: '',
  documento: '',
  fechaOferta: new Date().toISOString().slice(0, 10),
  fechaCierre: new Date().toISOString().slice(0, 10),
  status: 'Pendiente',
  observaciones: ''
}

export function SaleForm({ distributor, onSubmit, onCancel }: SaleFormProps) {
  const { brandOptions, sectors, commissionAgreements } = useAppData()
  const [form, setForm] = useState<SaleFormData>(defaultSale)
  const [errors, setErrors] = useState<FormErrors>({})

  const distributorLabel = useMemo(
    () => distributor?.name ?? 'Distribuidor sin nombre',
    [distributor]
  )
  const completion = distributor?.completion ?? 0
  const hasMinimumCompletion = completion >= 0.7

  // Filtrar marcas por política del distribuidor Y sector seleccionado
  const eligibleBrandOptions = useMemo(() => {
    const policy = distributor?.brandPolicy ?? {}

    // Primero filtramos por sector
    let brands = brandOptions.filter(
      (b: BrandOption) => b.sectorId === form.sectorId
    )

    // Luego aplicamos la política del distribuidor (si existe)
    if (policy.allowed?.length) {
      const allowed = new Set(policy.allowed)
      brands = brands.filter((brand: BrandOption) => allowed.has(brand.id))
    } else if (policy.blocked?.length) {
      const blocked = new Set(policy.blocked)
      brands = brands.filter((brand: BrandOption) => !blocked.has(brand.id))
    }

    return brands
  }, [brandOptions, distributor, form.sectorId])

  // Obtener familias según sector
  const currentFamilyOptions = useMemo(() => {
    return sectorFamilies[form.sectorId] || []
  }, [form.sectorId])

  // Resetear marca y familia al cambiar de sector
  useEffect(() => {
    if (eligibleBrandOptions.length > 0) {
      const firstBrand = eligibleBrandOptions[0].id
      setForm((prev) => ({
        ...prev,
        brand: firstBrand,
        family: currentFamilyOptions[0]?.id || ''
      }))
    } else {
      setForm((prev) => ({ ...prev, brand: '', family: '' }))
    }
  }, [form.sectorId, eligibleBrandOptions, currentFamilyOptions])

  const updateField = (
    field: keyof SaleFormData,
    value: string | number
  ): void => {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!hasMinimumCompletion) {
      newErrors.base =
        'No se pueden registrar ventas hasta completar el 70% de la ficha.'
    }

    if (!form.date) {
      newErrors.date = 'Selecciona una fecha.'
    }

    if (!form.brand) {
      newErrors.brand = 'Selecciona una marca.'
    }

    if (!form.family) {
      newErrors.family = 'Selecciona un producto/familia.'
    }

    if (!form.operations || Number(form.operations) < 1) {
      newErrors.operations = 'Indica al menos una operación.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault()
    if (!validate()) return

    if (!distributor?.id) return

    onSubmit?.({
      distributorId: distributor.id,
      distributorName: distributor.name,
      distributorCode: distributor.code,
      ...form,
      operations: Number(form.operations) || 1,
      notes: form.notes.trim()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <header className="border-b border-gray-200 pb-4 dark:border-gray-800">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
          Operaciones
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          Registrar Operación
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Registrar actividad para{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-300">
            {distributorLabel}
          </span>
        </p>
      </header>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Sector de actividad
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Elige el contexto comercial antes de cargar la operacion.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sectors.map((sector: Sector) => (
            <button
              key={sector.id}
              type="button"
              onClick={() => updateField('sectorId', sector.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition ${
                form.sectorId === sector.id
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 dark:hover:border-gray-700'
              }`}
            >
              <span className="text-2xl">{sector.icon}</span>
              <span className="text-xs font-semibold">{sector.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Datos de la operacion
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Cliente, producto, fechas y estado del pedido.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Nombre Cliente *
            </span>
            <input
              type="text"
              value={form.nombreCliente}
              onChange={(e) => updateField('nombreCliente', e.target.value)}
              placeholder="Nombre completo"
              className={fieldBaseClassName}
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Tipo Doc.
              </span>
              <select
                value={form.tipoDocumento}
                onChange={(e) => updateField('tipoDocumento', e.target.value)}
                className={fieldBaseClassName}
              >
                <option value="DNI">DNI</option>
                <option value="CIF">CIF</option>
                <option value="NIE">NIE</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Documento
              </span>
              <input
                type="text"
                value={form.documento}
                onChange={(e) => updateField('documento', e.target.value)}
                className={fieldBaseClassName}
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Fecha de Cierre *
            </span>
            <input
              type="date"
              value={form.fechaCierre}
              onChange={(e) => {
                updateField('fechaCierre', e.target.value)
                updateField('date', e.target.value)
              }}
              className={`${fieldBaseClassName} ${
                errors.date ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : ''
              }`}
            />
            {errors.date && (
              <span className="text-xs text-red-500 font-medium">
                {errors.date}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Marca / Proveedor *
            </span>
            <select
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              className={`${fieldBaseClassName} ${
                errors.brand ? 'border-red-400 bg-red-50' : ''
              }`}
            >
              <option value="">Selecciona...</option>
              {eligibleBrandOptions.map((brand: BrandOption) => (
                <option key={brand.id} value={brand.id}>
                  {brand.label}
                </option>
              ))}
            </select>
            {errors.brand && (
              <span className="text-xs text-red-500 font-medium">
                {errors.brand}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Producto / Familia *
            </span>
            <select
              value={form.family}
              onChange={(e) => updateField('family', e.target.value)}
              className={`${fieldBaseClassName} ${
                errors.family ? 'border-red-400 bg-red-50' : ''
              }`}
            >
              <option value="">Selecciona...</option>
              {currentFamilyOptions.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
            {errors.family && (
              <span className="text-xs text-red-500 font-medium">
                {errors.family}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Modo
              </span>
              <select
                value={form.modo}
                onChange={(e) =>
                  updateField('modo', e.target.value as SaleMode)
                }
                className={fieldBaseClassName}
              >
                <option value="RESI">RESI</option>
                <option value="PYME">PYME</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                Estado Pedido
              </span>
              <select
                value={form.status}
                onChange={(e) =>
                  updateField('status', e.target.value as SaleStatus)
                }
                className={`${fieldBaseClassName} font-medium text-indigo-600 dark:text-indigo-300`}
              >
                <option value="Enviado">Enviado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Scoring">Scoring</option>
                <option value="Aceptado">Aceptado</option>
                <option value="Activado">Activado</option>
                <option value="Baja">Baja</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {/* Comisión Activa Info */}
      {(() => {
        const agreement = commissionAgreements.find(
          (a: CommissionAgreement) =>
            String(a.distributorId) === String(distributor?.id) &&
            a.sector === form.sectorId &&
            a.operator === form.brand
        )
        if (!agreement) return null

        const isResi = form.modo === 'RESI'
        const type = isResi ? agreement.resiType : agreement.pymeType
        const tiers = isResi ? agreement.resiTiers : agreement.pymeTiers
        const hasTiers = tiers && tiers.length > 0
        const amount = isResi
          ? agreement.resiAmount || agreement.resiRappel
          : agreement.pymeAmount || agreement.pymeRappel
        const levels = isResi ? agreement.resiLevels : agreement.pymeLevels

        return (
          <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-300" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                  Acuerdo Comercial Activo
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                {isResi ? 'Residencial' : 'PYME'}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                    Sistema Liquidación
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">
                    {type}
                  </span>
                </div>
                {!hasTiers && (
                  <div className="flex flex-col text-right">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                      {type === 'adoc'
                        ? 'Importe Pactado'
                        : type === 'fijo'
                          ? 'Importe Fijo'
                          : 'Porcentaje'}
                    </span>
                    <span className="font-bold text-green-600 dark:text-green-300">
                      {amount || '-'}
                    </span>
                  </div>
                )}
              </div>

              {type === 'adoc' && hasTiers && (
                <div className="space-y-2 border-t border-indigo-200/70 pt-2 dark:border-indigo-500/20">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                    Escalados Pactados
                  </span>
                  <div className="grid gap-1.5">
                    {tiers.map((tier: CommissionTier) => (
                      <div
                        key={tier.id}
                        className="flex items-center justify-between rounded-lg border border-indigo-200/60 bg-white px-2.5 py-1.5 dark:border-indigo-500/10 dark:bg-gray-900/60"
                      >
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                          {tier.levels}
                        </span>
                        <span className="text-[11px] font-bold text-green-600 dark:text-green-300">
                          {tier.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === 'adoc' && !hasTiers && levels && (
                <div className="flex flex-col border-t border-indigo-200/70 pt-1 dark:border-indigo-500/20">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                    Niveles de Producción
                  </span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 italic">
                    {levels}
                  </span>
                </div>
              )}
            </div>

            {agreement.notes && (
              <div className="flex flex-col gap-1 border-t border-indigo-200/70 pt-2 dark:border-indigo-500/20">
                <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                  Notas del Acuerdo
                </span>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                  {agreement.notes}
                </p>
              </div>
            )}
          </div>
        )
      })()}

      <section className={sectionClassName}>
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            Observaciones
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Contexto adicional, incidencias o notas de cierre.
          </p>
        </div>
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            Observaciones / Notas
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => {
              updateField('notes', e.target.value)
              updateField('observaciones', e.target.value)
            }}
            rows={3}
            className={`${fieldBaseClassName} min-h-[112px] resize-y px-5 py-4`}
            placeholder="Anota detalles relevantes de la operación..."
            maxLength={500}
          />
          <div className="flex justify-between px-2">
            {errors.base ? (
              <span className="text-xs font-bold uppercase tracking-wide text-red-500">
                {errors.base}
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">
              {form.notes.length}/500
            </span>
          </div>
        </label>
      </section>

      {!hasMinimumCompletion && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-5 dark:border-yellow-700/50 dark:bg-yellow-900/20">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
              Perfil incompleto ({Math.round(completion * 100)}%)
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300/80">
              Es necesario completar al menos el 70% de la ficha del
              distribuidor para poder registrar ventas oficiales.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-8 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={!hasMinimumCompletion || !form.brand}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-10 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Confirmar y Guardar
        </button>
      </div>
    </form>
  )
}
