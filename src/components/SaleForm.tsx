import { useMemo, useState, useEffect } from 'react'
import { useAppData } from '../lib/useAppData'
import type { 
  SectorId, 
  Sector, 
  SaleStatus, 
  SaleDocumentType, 
  SaleSector, 
  SaleMode,
  Sale
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

// Estas familias se filtrarán por sector en el componente
const familyOptionsBySector: Record<SectorId, { id: string, label: string }[]> = {
  telco: [
    { id: 'convergente', label: 'Convergente' },
    { id: 'movil', label: 'Línea móvil' },
    { id: 'solo_fibra', label: 'Solo fibra' },
    { id: 'empresa_autonomo', label: 'Empresa / Autónomo' },
    { id: 'microempresa', label: 'Microempresa' }
  ],
  alarms: [
    { id: 'alarma_hogar', label: 'Alarma Hogar' },
    { id: 'alarma_negocio', label: 'Alarma Negocio' }
  ],
  energy: [
    { id: 'luz', label: 'Suministro Luz' },
    { id: 'gas', label: 'Suministro Gas' },
    { id: 'dual', label: 'Luz + Gas' }
  ]
}

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
    let brands = brandOptions.filter((b: BrandOption) => b.sectorId === form.sectorId)

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
    return familyOptionsBySector[form.sectorId] || []
  }, [form.sectorId])

  // Resetear marca y familia al cambiar de sector
  useEffect(() => {
    if (eligibleBrandOptions.length > 0) {
      const firstBrand = eligibleBrandOptions[0].id
      setForm(prev => ({ ...prev, brand: firstBrand, family: currentFamilyOptions[0]?.id || '' }))
    } else {
      setForm(prev => ({ ...prev, brand: '', family: '' }))
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <header className="space-y-1">
        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
          Registrar Operación
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Registrar actividad para{' '}
          <span className="font-semibold text-pastel-indigo">
            {distributorLabel}
          </span>
        </p>
      </header>

      {/* Sector Picker */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Sector de Actividad
        </label>
        <div className="grid grid-cols-3 gap-3">
          {sectors.map((sector: Sector) => (
            <button
              key={sector.id}
              type="button"
              onClick={() => updateField('sectorId', sector.id)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all duration-300 ${form.sectorId === sector.id
                  ? 'border-pastel-indigo bg-pastel-indigo/5 shadow-md scale-105'
                  : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
            >
              <span className="text-2xl">{sector.icon}</span>
              <span className={`text-xs font-bold ${form.sectorId === sector.id ? 'text-pastel-indigo' : 'text-gray-500'}`}>
                {sector.label}
              </span>
            </button>
          ))}
        </div>
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
            className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/20 shadow-sm transition-all"
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
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-pastel-indigo ring-0"
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
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-pastel-indigo ring-0"
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
              updateField('fechaCierre', e.target.value);
              updateField('date', e.target.value);
            }}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-pastel-indigo/20 ${errors.date
                ? 'border-red-400 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo'
              }`}
          />
          {errors.date && <span className="text-xs text-red-500 font-medium">{errors.date}</span>}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            Marca / Proveedor *
          </span>
          <select
            value={form.brand}
            onChange={(e) => updateField('brand', e.target.value)}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-pastel-indigo/20 ${errors.brand
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo'
              }`}
          >
            <option value="">Selecciona...</option>
            {eligibleBrandOptions.map((brand: BrandOption) => (
              <option key={brand.id} value={brand.id}>
                {brand.label}
              </option>
            ))}
          </select>
          {errors.brand && <span className="text-xs text-red-500 font-medium">{errors.brand}</span>}
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-bold text-gray-700 dark:text-gray-300">
            Producto / Familia *
          </span>
          <select
            value={form.family}
            onChange={(e) => updateField('family', e.target.value)}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-pastel-indigo/20 ${errors.family
                ? 'border-red-400 bg-red-50'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo'
              }`}
          >
            <option value="">Selecciona...</option>
            {currentFamilyOptions.map((family) => (
              <option key={family.id} value={family.id}>
                {family.label}
              </option>
            ))}
          </select>
          {errors.family && <span className="text-xs text-red-500 font-medium">{errors.family}</span>}
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              Modo
            </span>
            <select
              value={form.modo}
              onChange={(e) => updateField('modo', e.target.value as any)}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-pastel-indigo ring-0"
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
              onChange={(e) => updateField('status', e.target.value as any)}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-3 text-sm font-semibold text-pastel-indigo shadow-sm focus:border-pastel-indigo"
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

      {/* Comisión Activa Info */}
      {(() => {
        const agreement = commissionAgreements.find(
          (a: any) => String(a.distributorId) === String(distributor?.id) && 
          a.sector === form.sectorId && 
          a.operator === form.brand
        )
        if (!agreement) return null

        const isResi = form.modo === 'RESI'
        const type = isResi ? agreement.resiType : agreement.pymeType
        const tiers = isResi ? agreement.resiTiers : agreement.pymeTiers
        const hasTiers = tiers && tiers.length > 0
        const amount = isResi ? (agreement.resiAmount || agreement.resiRappel) : (agreement.pymeAmount || agreement.pymeRappel)
        const levels = isResi ? agreement.resiLevels : agreement.pymeLevels

        return (
          <div className="rounded-2xl bg-pastel-indigo/5 border border-pastel-indigo/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pastel-indigo animate-pulse" />
                <span className="text-xs font-bold text-pastel-indigo uppercase tracking-widest">Acuerdo Comercial Activo</span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-pastel-indigo/10 px-2 py-0.5 text-[10px] font-bold text-pastel-indigo">
                {isResi ? 'Residencial' : 'PYME'}
              </span>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Sistema Liquidación</span>
                  <span className="font-semibold text-gray-900 dark:text-white capitalize">{type}</span>
                </div>
                {!hasTiers && (
                  <div className="flex flex-col text-right">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">
                      {type === 'adoc' ? 'Importe Pactado' : (type === 'fijo' ? 'Importe Fijo' : 'Porcentaje')}
                    </span>
                    <span className="font-bold text-pastel-green">{amount || '-'}</span>
                  </div>
                )}
              </div>

              {type === 'adoc' && hasTiers && (
                <div className="space-y-2 pt-2 border-t border-pastel-indigo/10">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Escalados Pactados</span>
                  <div className="grid gap-1.5">
                    {tiers.map((tier: any) => (
                      <div key={tier.id} className="flex items-center justify-between bg-white/50 dark:bg-gray-800/50 rounded-lg px-2.5 py-1.5 border border-pastel-indigo/5">
                        <span className="text-[11px] font-medium text-gray-600 dark:text-gray-400">{tier.levels}</span>
                        <span className="text-[11px] font-bold text-pastel-green">{tier.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === 'adoc' && !hasTiers && levels && (
                <div className="pt-1 border-t border-pastel-indigo/10 flex flex-col">
                  <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Niveles de Producción</span>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 italic">{levels}</span>
                </div>
              )}
            </div>
           

            {agreement.notes && (
              <div className="pt-2 border-t border-pastel-indigo/10 flex flex-col gap-1">
                 <span className="text-gray-500 text-[10px] uppercase font-bold tracking-tighter">Notas del Acuerdo</span>
                 <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">{agreement.notes}</p>
              </div>
            )}
          </div>
        )
      })()}

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-bold text-gray-700 dark:text-gray-300">
          Observaciones / Notas
        </span>
        <textarea
          value={form.notes}
          onChange={(e) => {
            updateField('notes', e.target.value);
            updateField('observaciones', e.target.value);
          }}
          rows={3}
          className="rounded-3xl border border-gray-200 dark:border-gray-700 px-5 py-4 text-sm shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/20 transition-all"
          placeholder="Anota detalles relevantes de la operación..."
          maxLength={500}
        />
        <div className="flex justify-between px-2">
          {errors.base ? (
            <span className="text-xs font-bold text-red-500 uppercase tracking-wide">{errors.base}</span>
          ) : <span></span>}
          <span className="text-xs text-gray-400">
            {form.notes.length}/500
          </span>
        </div>
      </label>

      {!hasMinimumCompletion && (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700/50 p-5 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
              Perfil incompleto ({Math.round(completion * 100)}%)
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300/80">
              Es necesario completar al menos el 70% de la ficha del distribuidor para poder registrar ventas oficiales.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-2xl border border-gray-200 dark:border-gray-700 px-8 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={!hasMinimumCompletion || !form.brand}
          className="rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan px-10 py-3 text-sm font-bold text-white shadow-xl shadow-pastel-indigo/20 transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
        >
          Confirmar y Guardar
        </button>
      </div>
    </form>
  )
}
