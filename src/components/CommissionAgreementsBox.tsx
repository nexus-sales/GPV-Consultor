import React, { useState, useMemo } from 'react'
import { useAppData } from '../lib/useAppData'
import {
  CurrencyEuroIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ClockIcon
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
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null)

  // Form state
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

  // Tier helpers
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
    const filtered = currentTiers.filter((t) => t.id !== id)
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
    const updated = currentTiers.map((t) =>
      t.id === id ? { ...t, levels, amount } : t
    )
    setFormData({
      ...formData,
      ...(isResi ? { resiTiers: updated } : { pymeTiers: updated })
    })
  }

  const distributorAgreements = useMemo(() => {
    return commissionAgreements.filter(
      (a) => String(a.distributorId) === String(distributorId)
    )
  }, [commissionAgreements, distributorId])

  const availableOperators = useMemo(() => {
    if (!formData.sector) return []
    return brandOptions.filter((b) => b.sectorId === formData.sector)
  }, [brandOptions, formData.sector])

  const handleSave = async () => {
    if (!formData.sector || !formData.operator) {
      alert('Por favor, selecciona sector y operador')
      return
    }

    if (editingId) {
      await updateCommissionAgreement(editingId, formData)
      setEditingId(null)
    } else {
      // Evitar duplicados de sector+operador
      const exists = distributorAgreements.some(
        (a) => a.sector === formData.sector && a.operator === formData.operator
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

  const handleEdit = (agreement: CommissionAgreement) => {
    setFormData(agreement)
    setEditingId(agreement.id)
    setIsAdding(false)
  }

  const handleDelete = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Acuerdo',
      description: '¿Estás seguro de eliminar este acuerdo?',
      confirmText: 'Sí, eliminar',
      type: 'danger'
    })
    if (isConfirmed) {
      await deleteCommissionAgreement(id)
    }
  }

  return (
    <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Acuerdos de Comisiones
          </h2>
          <CurrencyEuroIcon className="h-5 w-5 text-pastel-indigo" />
        </div>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => {
              resetForm()
              setIsAdding(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-indigo/10 px-3 py-1.5 text-xs font-semibold text-pastel-indigo transition hover:bg-pastel-indigo/20"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Nuevo acuerdo
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl bg-gray-100 dark:bg-gray-700/50 p-1">
        <button
          onClick={() => setActiveTab('RESI')}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
            activeTab === 'RESI'
              ? 'bg-white dark:bg-gray-800 text-pastel-indigo shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Residencial
        </button>
        <button
          onClick={() => setActiveTab('PYME')}
          className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-all ${
            activeTab === 'PYME'
              ? 'bg-white dark:bg-gray-800 text-pastel-indigo shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          PYME
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="mb-6 rounded-2xl bg-gray-50 dark:bg-gray-700/30 p-4 border border-pastel-indigo/10">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Sector
              </label>
              <select
                value={formData.sector}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sector: e.target.value,
                    operator: ''
                  })
                }
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                disabled={!!editingId}
              >
                <option value="">Seleccionar sector...</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Operador
              </label>
              <select
                value={formData.operator}
                onChange={(e) =>
                  setFormData({ ...formData, operator: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                disabled={!formData.sector || !!editingId}
              >
                <option value="">Seleccionar operador...</option>
                {availableOperators.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'RESI' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Tipo Residencial
                  </label>
                  <select
                    value={formData.resiType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resiType: e.target
                          .value as CommissionAgreement['resiType']
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                  >
                    <option value="adoc">A doc</option>
                    <option value="fijo">Fijo</option>
                    <option value="porcentaje">Porcentaje</option>
                  </select>
                </div>
                {formData.resiType === 'adoc' ? (
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-400 uppercase">
                        Escalados de Rappel (RESI)
                      </label>
                      <button
                        type="button"
                        onClick={() => addTier('RESI')}
                        className="text-[10px] font-bold text-pastel-indigo hover:underline flex items-center gap-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Añadir nivel
                      </button>
                    </div>

                    {(formData.resiTiers || []).length === 0 && (
                      <p className="text-[10px] text-gray-400 italic">
                        No hay niveles definidos. Pulsa "Añadir nivel".
                      </p>
                    )}

                    <div className="space-y-2">
                      {(formData.resiTiers || []).map((tier) => (
                        <div key={tier.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={tier.levels}
                            onChange={(e) =>
                              updateTier(
                                'RESI',
                                tier.id,
                                e.target.value,
                                tier.amount
                              )
                            }
                            placeholder="Nivel (ej: de 0 a 5)"
                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                          />
                          <input
                            type="text"
                            value={tier.amount}
                            onChange={(e) =>
                              updateTier(
                                'RESI',
                                tier.id,
                                tier.levels,
                                e.target.value
                              )
                            }
                            placeholder="Importe (ej: 50€)"
                            className="w-24 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier('RESI', tier.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      {formData.resiType === 'fijo'
                        ? 'Importe Fijo (RESI)'
                        : 'Porcentaje (RESI)'}
                    </label>
                    <input
                      type="text"
                      value={formData.resiAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, resiAmount: e.target.value })
                      }
                      placeholder={
                        formData.resiType === 'fijo' ? 'Ej: 150€' : 'Ej: 10%'
                      }
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                    Tipo PYME
                  </label>
                  <select
                    value={formData.pymeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pymeType: e.target
                          .value as CommissionAgreement['pymeType']
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                  >
                    <option value="adoc">A doc</option>
                    <option value="fijo">Fijo</option>
                    <option value="porcentaje">Porcentaje</option>
                  </select>
                </div>
                {formData.pymeType === 'adoc' ? (
                  <div className="sm:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-400 uppercase">
                        Escalados de Rappel (PYME)
                      </label>
                      <button
                        type="button"
                        onClick={() => addTier('PYME')}
                        className="text-[10px] font-bold text-pastel-indigo hover:underline flex items-center gap-1"
                      >
                        <PlusIcon className="h-3 w-3" />
                        Añadir nivel
                      </button>
                    </div>

                    {(formData.pymeTiers || []).length === 0 && (
                      <p className="text-[10px] text-gray-400 italic">
                        No hay niveles definidos. Pulsa "Añadir nivel".
                      </p>
                    )}

                    <div className="space-y-2">
                      {(formData.pymeTiers || []).map((tier) => (
                        <div key={tier.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={tier.levels}
                            onChange={(e) =>
                              updateTier(
                                'PYME',
                                tier.id,
                                e.target.value,
                                tier.amount
                              )
                            }
                            placeholder="Nivel (ej: de 0 a 5)"
                            className="flex-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                          />
                          <input
                            type="text"
                            value={tier.amount}
                            onChange={(e) =>
                              updateTier(
                                'PYME',
                                tier.id,
                                tier.levels,
                                e.target.value
                              )
                            }
                            placeholder="Importe (ej: 100€)"
                            className="w-24 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier('PYME', tier.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      {formData.pymeType === 'fijo'
                        ? 'Importe Fijo (PYME)'
                        : 'Porcentaje (PYME)'}
                    </label>
                    <input
                      type="text"
                      value={formData.pymeAmount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, pymeAmount: e.target.value })
                      }
                      placeholder={
                        formData.pymeType === 'fijo' ? 'Ej: 300€' : 'Ej: 15%'
                      }
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
                    />
                  </div>
                )}
              </>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                Observaciones
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Anota cualquier detalle relevante del acuerdo..."
                rows={2}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pastel-indigo/20"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAdding(false)
                setEditingId(null)
              }}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-indigo px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-pastel-indigo/90 transition"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Guardar acuerdo
            </button>
          </div>
        </div>
      )}

      {distributorAgreements.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/70 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <InformationCircleIcon className="h-6 w-6 text-gray-400" />
          <p>No hay acuerdos registrados para este distribuidor.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-4 pb-2">Operador</th>
                <th className="px-4 pb-2">Sistema</th>
                <th className="px-4 pb-2">Detalles</th>
                <th className="px-4 pb-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {distributorAgreements.map((agreement) => (
                <React.Fragment key={agreement.id}>
                  <tr className="group rounded-2xl bg-gray-50 dark:bg-gray-800/50 transition hover:bg-white dark:hover:bg-gray-700">
                    <td className="px-4 py-3 first:rounded-l-2xl">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {lookups.brands[agreement.operator]?.label ||
                              agreement.operator}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-gray-500 font-medium">
                              {sectors.find((s) => s.id === agreement.sector)
                                ?.label || agreement.sector}
                            </span>
                            {agreement.notes && (
                              <InformationCircleIcon
                                className="h-3.5 w-3.5 text-pastel-indigo"
                                title={agreement.notes}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activeTab === 'RESI'
                          ? agreement.resiType
                          : agreement.pymeType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        {(() => {
                          const isResi = activeTab === 'RESI'
                          const tiers = isResi
                            ? agreement.resiTiers
                            : agreement.pymeTiers
                          const amount = isResi
                            ? agreement.resiAmount || agreement.resiRappel
                            : agreement.pymeAmount || agreement.pymeRappel
                          const levels = isResi
                            ? agreement.resiLevels
                            : agreement.pymeLevels
                          const type = isResi
                            ? agreement.resiType
                            : agreement.pymeType

                          if (type === 'adoc' && tiers && tiers.length > 0) {
                            return (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-pastel-indigo uppercase tracking-tighter">
                                  {tiers.length} Escalado
                                  {tiers.length > 1 ? 's' : ''}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {tiers.slice(0, 2).map((t, idx) => (
                                    <span
                                      key={idx}
                                      className="bg-pastel-indigo/5 text-[9px] px-1.5 py-0.5 rounded border border-pastel-indigo/10 text-pastel-indigo whitespace-nowrap"
                                    >
                                      {t.levels}: <strong>{t.amount}</strong>
                                    </span>
                                  ))}
                                  {tiers.length > 2 && (
                                    <span className="text-[9px] text-gray-400">
                                      ...
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          }

                          return (
                            <>
                              <span className="inline-flex items-center gap-1 rounded-full bg-pastel-green/10 px-2 py-0.5 text-xs font-bold text-pastel-green w-fit">
                                {amount || '-'}
                              </span>
                              {levels && (
                                <span className="text-[10px] text-gray-400 font-medium italic pl-1">
                                  Niveles: {levels}
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 last:rounded-r-2xl text-right">
                      <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        {agreement.history && agreement.history.length > 0 && (
                          <button
                            onClick={() =>
                              setShowHistoryId(
                                showHistoryId === agreement.id
                                  ? null
                                  : agreement.id
                              )
                            }
                            className={`p-1.5 transition ${showHistoryId === agreement.id ? 'text-pastel-indigo' : 'text-gray-400 hover:text-pastel-indigo'}`}
                            title="Ver histórico"
                          >
                            <ClockIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(agreement)}
                          className="p-1.5 text-gray-400 hover:text-pastel-indigo transition"
                          title="Editar"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(agreement.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {showHistoryId === agreement.id && agreement.history && (
                    <tr>
                      <td colSpan={4} className="px-4 pb-4">
                        <div className="rounded-2xl bg-gray-100/50 dark:bg-gray-700/30 p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Historial de Rappels ({activeTab})
                          </h4>
                          <div className="space-y-2">
                            {agreement.history
                              .slice()
                              .reverse()
                              .map((h, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between text-xs py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-600 dark:text-gray-400">
                                      {new Date(h.date).toLocaleDateString()}
                                    </span>
                                    {h.note && (
                                      <span className="text-[10px] text-gray-400 italic">
                                        {h.note}
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-bold text-pastel-green">
                                    {activeTab === 'RESI'
                                      ? h.resiRappel
                                      : h.pymeRappel || '-'}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}
