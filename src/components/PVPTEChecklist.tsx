import React from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import type { Distributor } from '../lib/types'

interface PVPTEChecklistProps {
  distributor: Distributor
  showOnlyIncomplete?: boolean
}

interface CheckItem {
  id: string
  label: string
  description: string
  isComplete: boolean
  severity: 'critical' | 'important' | 'optional'
}

/**
 * Checklist de validación para distribuidores PVPTE
 *
 * Los distribuidores con external_code 'PVPTE' requieren datos completos antes de:
 * - Registrar ventas
 * - Activar servicios
 * - Generar reportes oficiales
 */
export const PVPTEChecklist: React.FC<PVPTEChecklistProps> = ({
  distributor,
  showOnlyIncomplete = false
}) => {
  // Verificar si es PVPTE
  const isPVPTE = distributor.externalCode === 'PVPTE'

  if (!isPVPTE) return null

  // Definir items del checklist
  const checkItems: CheckItem[] = [
    {
      id: 'cif',
      label: 'CIF / NIF',
      description: 'Número de identificación fiscal válido',
      isComplete: Boolean(distributor.taxId && distributor.taxId.length >= 9),
      severity: 'critical'
    },
    {
      id: 'direccion_completa',
      label: 'Dirección completa',
      description: 'Dirección, ciudad y código postal',
      isComplete: Boolean(
        distributor.address &&
          distributor.city &&
          distributor.postalCode &&
          distributor.postalCode.length === 5
      ),
      severity: 'critical'
    },
    {
      id: 'provincia',
      label: 'Provincia',
      description: 'Provincia del distribuidor',
      isComplete: Boolean(distributor.province),
      severity: 'critical'
    },
    {
      id: 'telefono',
      label: 'Teléfono de contacto',
      description: 'Número de teléfono principal',
      isComplete: Boolean(distributor.phone && distributor.phone.length >= 9),
      severity: 'important'
    },
    {
      id: 'email',
      label: 'Email',
      description: 'Correo electrónico de contacto',
      isComplete: Boolean(distributor.email && distributor.email.includes('@')),
      severity: 'important'
    },
    {
      id: 'canal',
      label: 'Canal de venta',
      description: 'Tipo de canal asignado',
      isComplete: Boolean(distributor.channelType),
      severity: 'critical'
    },
    {
      id: 'marcas',
      label: 'Marcas habilitadas',
      description: 'Al menos una marca activa',
      isComplete: Boolean(distributor.brands && distributor.brands.length > 0),
      severity: 'critical'
    }
  ]

  // Filtrar si solo queremos incompletos
  const displayItems = showOnlyIncomplete
    ? checkItems.filter((item) => !item.isComplete)
    : checkItems

  if (displayItems.length === 0 && showOnlyIncomplete) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-700/50 bg-green-50 dark:bg-green-900/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            ✅ Checklist PVPTE completo
          </p>
        </div>
      </div>
    )
  }

  const criticalIncomplete = checkItems.filter(
    (item) => !item.isComplete && item.severity === 'critical'
  )
  const importantIncomplete = checkItems.filter(
    (item) => !item.isComplete && item.severity === 'important'
  )
  const totalComplete = checkItems.filter((item) => item.isComplete).length
  const completionPercent = Math.round(
    (totalComplete / checkItems.length) * 100
  )

  return (
    <div className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheckIcon className="h-5 w-5 text-pastel-indigo" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Checklist PVPTE
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Requisitos obligatorios para distribuidores PVPTE
          </p>
        </div>

        {/* Progreso */}
        <div className="text-right">
          <div
            className={`text-2xl font-bold ${
              completionPercent === 100
                ? 'text-green-500'
                : completionPercent >= 70
                  ? 'text-yellow-500'
                  : 'text-red-500'
            }`}
          >
            {completionPercent}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {totalComplete}/{checkItems.length} completados
          </div>
        </div>
      </div>

      {/* Alertas */}
      {criticalIncomplete.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-700/50 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {criticalIncomplete.length} requisito
                {criticalIncomplete.length > 1 ? 's' : ''} crítico
                {criticalIncomplete.length > 1 ? 's' : ''} pendiente
                {criticalIncomplete.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                No se pueden registrar ventas ni activar servicios hasta
                completarlos
              </p>
            </div>
          </div>
        </div>
      )}

      {importantIncomplete.length > 0 && criticalIncomplete.length === 0 && (
        <div className="mb-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                {importantIncomplete.length} dato
                {importantIncomplete.length > 1 ? 's' : ''} importante
                {importantIncomplete.length > 1 ? 's' : ''} pendiente
                {importantIncomplete.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Recomendado completar para facilitar la gestión
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de items */}
      <div className="space-y-2">
        {displayItems.map((item) => {
          const Icon = item.isComplete ? CheckCircleIcon : XCircleIcon
          const iconColor = item.isComplete
            ? 'text-green-500'
            : item.severity === 'critical'
              ? 'text-red-500'
              : 'text-yellow-500'

          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition ${
                item.isComplete
                  ? 'border-green-200 dark:border-green-700/30 bg-green-50/50 dark:bg-green-900/10'
                  : item.severity === 'critical'
                    ? 'border-red-200 dark:border-red-700/30 bg-red-50/50 dark:bg-red-900/10'
                    : 'border-yellow-200 dark:border-yellow-700/30 bg-yellow-50/50 dark:bg-yellow-900/10'
              }`}
            >
              <Icon className={`h-5 w-5 ${iconColor} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </p>
                  {!item.isComplete && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        item.severity === 'critical'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      }`}
                    >
                      {item.severity === 'critical' ? 'Crítico' : 'Importante'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {completionPercent === 100 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
            <CheckCircleIcon className="h-4 w-4" />
            <span>Distribuidor listo para operar en plataforma PVPTE</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PVPTEChecklist
