import React, { useMemo, useState } from 'react'
import { useAppData } from '../lib/useAppData'
import {
  CheckIcon,
  ClockIcon,
  CurrencyEuroIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import type {
  CommissionAgreement,
  CommissionTier,
  EntityId,
  NewCommissionAgreement
} from '../lib/types'
import { useConfirm } from '../lib/ConfirmProvider'

interface CommissionAgreementsBoxProps {
  distributorId: EntityId
}

const inputClassName =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800'

export const CommissionAgreementsBox: React.FC<
  CommissionAgreementsBoxProps
> = ({ distributorId }) => {
  const {
    commissionAgreements,
    addCommissionAgreement,
    updateCommissionAgreement,
    deleteCommissionAgreement,
    sectors,
    brandOptions,
    lookups
  } = useAppData()
  const { confirm } = useConfirm()

  const [activeTab, setActiveTab] = useState<'RESI' | 'PYME'>('RESI')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<NewCommissionAgreement>({
    distributorId,
    sector: '',
    operator: '',
    resiType: 'adoc',
    resiAmount: '',
    resiLevels: '',
    resiRappel: '',
    pymeType: 'adoc',
    pymeAmount: '',
    pymeLevels: '',
    pymeRappel: '',
    resiTiers: [],
    pymeTiers: [],
    notes: ''
  })

  const addTier = (tab: 'RESI' | 'PYME') => {
    const isResi = tab === 'RESI'
    const currentTiers: CommissionTier[] =
      (isResi ? formData.resiTiers : formData.pymeTiers) || []
    const newTier: CommissionTier = {
      id: Math.random().toString(36).slice(2, 9),
      levels: '',
      amount: ''
    }

    setFormData({
      ...formData,
      ...(isResi
        ? { resiTiers: [...currentTiers, newTier] }
        : { pymeTiers: [...currentTiers, newTier] })
    })
  }

  const removeTier = (tab: 'RESI' | 'PYME', id: string) => {
    const isResi = tab === 'RESI'
    const currentTiers: CommissionTier[] =
      (isResi ? formData.resiTiers : formData.pymeTiers) || []
    const filtered = currentTiers.filter((tier) => tier.id !== id)

    setFormData({
      ...formData,
      ...(isResi ? { resiTiers: filtered } : { pymeTiers: filtered })
    })
  }

  const updateTier = (
    tab: 'RESI' | 'PYME',
    id: string,
    levels: string,
    amount: string
  ) => {
    const isResi = tab === 'RESI'
    const currentTiers: CommissionTier[] =
      (isResi ? formData.resiTiers : formData.pymeTiers) || []
    const updated = currentTiers.map((tier) =>
      tier.id === id ? { ...tier, levels, amount } : tier
    )

    setFormData({
      ...formData,
      ...(isResi ? { resiTiers: updated } : { pymeTiers: updated })
    })
  }

  const distributorAgreements = useMemo(() => {
    return commissionAgreements.filter(
      (agreement) => String(agreement.distributorId) === String(distributorId)
    )
  }, [commissionAgreements, distributorId])

  const availableOperators = useMemo(() => {
    if (!formData.sector) return []
    return brandOptions.filter((brand) => brand.sectorId === formData.sector)
  }, [brandOptions, formData.sector])

  const resetForm = () => {
    setFormData({
      distributorId,
      sector: '',
      operator: '',
      resiType: 'adoc',
      resiAmount: '',
      resiLevels: '',
      resiRappel: '',
      pymeType: 'adoc',
      pymeAmount: '',
      pymeLevels: '',
      pymeRappel: '',
      resiTiers: [],
      pymeTiers: [],
      notes: ''
    })
  }

  const handleSave = async () => {
    if (!formData.sector || !formData.operator) {
      alert('Por favor, selecciona sector y operador')
      return
    }

    if (editingId) {
      await updateCommissionAgreement(editingId, formData)
      setEditingId(null)
    } else {
      const exists = distributorAgreements.some(
        (agreement) =>
          agreement.sector === formData.sector &&
          agreement.operator === formData.operator
      )

      if (exists) {
        alert('Ya existe un acuerdo para este sector y operador')
        return
      }

      await addCommissionAgreement(formData)
      setIsAdding(false)
    }

    resetForm()
  }

  const handleEdit = (agreement: CommissionAgreement) => {
    setFormData(agreement)
    setEditingId(agreement.id)
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Acuerdo',
      description: '¿Estás seguro de eliminar este acuerdo?',
      confirmText: 'Si, eliminar',
      type: 'danger'
    })

    if (isConfirmed) {
      await deleteCommissionAgreement(id)
    }
  }

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Acuerdos de comisiones
          </h2>
          <CurrencyEuroIcon className="h-5 w-5 text-indigo-500" />
        </div>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => {
              resetForm()
              setIsAdding(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nuevo acuerdo
          </button>
        )}
      </header>

      <div className="mb-6 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-700/50">
        <button
          type="button"
          onClick={() => setActiveTab('RESI')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'RESI'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Residencial
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('PYME')}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
            activeTab === 'PYME'
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          PYME
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/30">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                Sector
              </label>
              <select
                value={formData.sector}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    sector: event.target.value,
                    operator: ''
                  })
                }
                className={inputClassName}
                disabled={!!editingId}
              >
                <option value="">Seleccionar sector...</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                Operador
              </label>
              <select
                value={formData.operator}
                onChange={(event) =>
                  setFormData({ ...formData, operator: event.target.value })
                }
                className={inputClassName}
                disabled={!formData.sector || !!editingId}
              >
                <option value="">Seleccionar operador...</option>
                {availableOperators.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.label}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'RESI' ? (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                    Tipo residencial
                  </label>
                  <select
                    value={formData.resiType}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        resiType: event.target
                          .value as CommissionAgreement['resiType']
                      })
                    }
                    className={inputClassName}
                  >
                    <option value="adoc">A doc</option>
                    <option value="fijo">Fijo</option>
                    <option value="porcentaje">Porcentaje</option>
                  </select>
                </div>
                {formData.resiType === 'adoc' ? (
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-gray-400">
                        Escalados de rappel (RESI)
                      </label>
                      <button
                        type="button"
                        onClick={() => addTier('RESI')}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Añadir nivel
                      </button>
                    </div>

                    {(formData.resiTiers || []).length === 0 && (
                      <p className="text-[10px] italic text-gray-400">
                        No hay niveles definidos. Pulsa "Añadir nivel".
                      </p>
                    )}

                    <div className="space-y-2">
                      {(formData.resiTiers || []).map((tier) => (
                        <div key={tier.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tier.levels}
                            onChange={(event) =>
                              updateTier(
                                'RESI',
                                tier.id,
                                event.target.value,
                                tier.amount
                              )
                            }
                            placeholder="Nivel (ej: de 0 a 5)"
                            className={`${inputClassName} py-1.5 text-xs`}
                          />
                          <input
                            type="text"
                            value={tier.amount}
                            onChange={(event) =>
                              updateTier(
                                'RESI',
                                tier.id,
                                tier.levels,
                                event.target.value
                              )
                            }
                            placeholder="Importe (ej: 50 EUR)"
                            className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier('RESI', tier.id)}
                            className="p-1 text-gray-400 transition-colors hover:text-red-500"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                      {formData.resiType === 'fijo'
                        ? 'Importe fijo (RESI)'
                        : 'Porcentaje (RESI)'}
                    </label>
                    <input
                      type="text"
                      value={formData.resiAmount || ''}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          resiAmount: event.target.value
                        })
                      }
                      placeholder={
                        formData.resiType === 'fijo' ? 'Ej: 150 EUR' : 'Ej: 10%'
                      }
                      className={inputClassName}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                    Tipo PYME
                  </label>
                  <select
                    value={formData.pymeType}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        pymeType: event.target
                          .value as CommissionAgreement['pymeType']
                      })
                    }
                    className={inputClassName}
                  >
                    <option value="adoc">A doc</option>
                    <option value="fijo">Fijo</option>
                    <option value="porcentaje">Porcentaje</option>
                  </select>
                </div>
                {formData.pymeType === 'adoc' ? (
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase text-gray-400">
                        Escalados de rappel (PYME)
                      </label>
                      <button
                        type="button"
                        onClick={() => addTier('PYME')}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Añadir nivel
                      </button>
                    </div>

                    {(formData.pymeTiers || []).length === 0 && (
                      <p className="text-[10px] italic text-gray-400">
                        No hay niveles definidos. Pulsa "Añadir nivel".
                      </p>
                    )}

                    <div className="space-y-2">
                      {(formData.pymeTiers || []).map((tier) => (
                        <div key={tier.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={tier.levels}
                            onChange={(event) =>
                              updateTier(
                                'PYME',
                                tier.id,
                                event.target.value,
                                tier.amount
                              )
                            }
                            placeholder="Nivel (ej: de 0 a 5)"
                            className={`${inputClassName} py-1.5 text-xs`}
                          />
                          <input
                            type="text"
                            value={tier.amount}
                            onChange={(event) =>
                              updateTier(
                                'PYME',
                                tier.id,
                                tier.levels,
                                event.target.value
                              )
                            }
                            placeholder="Importe (ej: 100 EUR)"
                            className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier('PYME', tier.id)}
                            className="p-1 text-gray-400 transition-colors hover:text-red-500"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                      {formData.pymeType === 'fijo'
                        ? 'Importe fijo (PYME)'
                        : 'Porcentaje (PYME)'}
                    </label>
                    <input
                      type="text"
                      value={formData.pymeAmount || ''}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          pymeAmount: event.target.value
                        })
                      }
                      placeholder={
                        formData.pymeType === 'fijo' ? 'Ej: 300 EUR' : 'Ej: 15%'
                      }
                      className={inputClassName}
                    />
                  </div>
                )}
              </>
            )}

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
                Observaciones
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(event) =>
                  setFormData({ ...formData, notes: event.target.value })
                }
                placeholder="Anota cualquier detalle relevante del acuerdo..."
                rows={2}
                className={inputClassName}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
              }}
              className="rounded-xl px-4 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition-colors duration-150 hover:bg-indigo-700"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Guardar acuerdo
            </button>
          </div>
        </div>
      )}

      {activeTab === 'RESI' ? (
        <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Operador
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Sistema
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Detalles
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {distributorAgreements.map((agreement) => (
                <React.Fragment key={agreement.id}>
                  <tr className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lookups.brands[agreement.operator]?.label ||
                            agreement.operator}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {sectors.find(
                              (sector) => sector.id === agreement.sector
                            )?.label || agreement.sector}
                          </span>
                          {agreement.notes && (
                            <InformationCircleIcon
                              className="h-3.5 w-3.5 text-indigo-500"
                              title={agreement.notes}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-gray-200">
                      <span className="text-sm">{agreement.resiType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const tiers = agreement.resiTiers
                          const amount =
                            agreement.resiAmount || agreement.resiRappel
                          const type = agreement.resiType

                          if (type === 'adoc' && tiers && tiers.length > 0) {
                            return (
                              <>
                                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {tiers.length} escalado
                                  {tiers.length > 1 ? 's' : ''}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {tiers.slice(0, 2).map((tier, index) => (
                                    <span
                                      key={index}
                                      className="whitespace-nowrap rounded-md border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 dark:border-gray-600 dark:text-gray-300"
                                    >
                                      {tier.levels}:{' '}
                                      <strong>{tier.amount}</strong>
                                    </span>
                                  ))}
                                  {tiers.length > 2 && (
                                    <span className="text-[9px] text-gray-400">
                                      ...
                                    </span>
                                  )}
                                </div>
                              </>
                            )
                          }

                          return (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {amount || 'No definido'}
                            </span>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleEdit(agreement)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(agreement.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Operador
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Sistema
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Detalles
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {distributorAgreements.map((agreement) => (
                <React.Fragment key={agreement.id}>
                  <tr className="group border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/60">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lookups.brands[agreement.operator]?.label ||
                            agreement.operator}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            {sectors.find(
                              (sector) => sector.id === agreement.sector
                            )?.label || agreement.sector}
                          </span>
                          {agreement.notes && (
                            <InformationCircleIcon
                              className="h-3.5 w-3.5 text-indigo-500"
                              title={agreement.notes}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700 dark:text-gray-200">
                      <span className="text-sm">{agreement.pymeType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const tiers = agreement.pymeTiers
                          const amount =
                            agreement.pymeAmount || agreement.pymeRappel
                          const type = agreement.pymeType

                          if (type === 'adoc' && tiers && tiers.length > 0) {
                            return (
                              <>
                                <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {tiers.length} escalado
                                  {tiers.length > 1 ? 's' : ''}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {tiers.slice(0, 2).map((tier, index) => (
                                    <span
                                      key={index}
                                      className="whitespace-nowrap rounded-md border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600 dark:border-gray-600 dark:text-gray-300"
                                    >
                                      {tier.levels}:{' '}
                                      <strong>{tier.amount}</strong>
                                    </span>
                                  ))}
                                  {tiers.length > 2 && (
                                    <span className="text-[9px] text-gray-400">
                                      ...
                                    </span>
                                  )}
                                </div>
                              </>
                            )
                          }

                          return (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {amount || 'No definido'}
                            </span>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleEdit(agreement)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(agreement.id)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {distributorAgreements.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
          <p>No hay acuerdos registrados para este distribuidor.</p>
        </div>
      )}
    </article>
  )
}
