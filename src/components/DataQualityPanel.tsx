/**
 * Componente para visualizar la Calidad de Datos (§5 KPIs)
 * Muestra el porcentaje de fichas completas y detalles de campos faltantes
 */

import React, { useState } from 'react'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import Card from './ui/Card'
import { useDataQuality } from '../lib/hooks/useKPIs'

export const DataQualityPanel: React.FC = () => {
  const dataQuality = useDataQuality()
  const [showDetails, setShowDetails] = useState(false)
  const [maxVisible, setMaxVisible] = useState(10)

  // Determinar color según porcentaje de calidad
  const getQualityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-500 dark:text-yellow-400'
    return 'text-red-500 dark:text-red-400'
  }

  const getQualityBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 dark:bg-green-900/30'
    if (percentage >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  // Traducir nombres de campos
  const fieldLabels: Record<string, string> = {
    name: 'Nombre',
    phone: 'Teléfono',
    email: 'Email',
    province: 'Provincia',
    city: 'Ciudad',
    postalCode: 'Código Postal',
    contactPerson: 'Persona de Contacto'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
          📊 Calidad de Datos
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {dataQuality.totalRecords} fichas totales
        </div>
      </div>

      {/* Métrica principal */}
      <div
        className={`mb-6 p-6 rounded-xl ${getQualityBgColor(dataQuality.qualityPercentage)}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
              Fichas Completas
            </div>
            <div
              className={`text-4xl font-bold ${getQualityColor(dataQuality.qualityPercentage)}`}
            >
              {dataQuality.qualityPercentage}%
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="font-semibold">
                {dataQuality.completeRecords}
              </span>
            </div>
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="font-semibold">
                {dataQuality.incompleteRecords}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-6">
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              dataQuality.qualityPercentage >= 80
                ? 'bg-green-500'
                : dataQuality.qualityPercentage >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${dataQuality.qualityPercentage}%` }}
          />
        </div>
      </div>

      {/* Botón para mostrar/ocultar detalles */}
      {dataQuality.incompleteRecords > 0 && (
        <>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Ver fichas incompletas ({dataQuality.incompleteRecords})
            </span>
            {showDetails ? (
              <ChevronUpIcon className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* Lista de fichas incompletas */}
          {showDetails && (
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
              {dataQuality.missingFieldsByRecord
                .slice(0, maxVisible)
                .map(
                  (record: {
                    id: string | number
                    name: string
                    missingFields: string[]
                    completeness: number
                  }) => (
                    <div
                      key={record.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-800 dark:text-white">
                          {record.name}
                        </span>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {record.completeness}% completo
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {record.missingFields.map((field: string) => (
                          <span
                            key={field}
                            className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded"
                          >
                            {fieldLabels[field] || field}
                          </span>
                        ))}
                      </div>

                      {/* Mini barra de progreso */}
                      <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${
                            record.completeness >= 80
                              ? 'bg-green-500'
                              : record.completeness >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${record.completeness}%` }}
                        />
                      </div>
                    </div>
                  )
                )}

              {/* Botón "Ver más" */}
              {dataQuality.incompleteRecords > maxVisible && (
                <button
                  onClick={() => setMaxVisible((prev) => prev + 10)}
                  className="w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                >
                  Ver más ({dataQuality.incompleteRecords - maxVisible}{' '}
                  restantes)
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Mensaje cuando todo está completo */}
      {dataQuality.incompleteRecords === 0 && dataQuality.totalRecords > 0 && (
        <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircleIcon className="w-6 h-6 text-green-500" />
          <span className="text-green-700 dark:text-green-400 font-medium">
            ¡Todas las fichas están completas!
          </span>
        </div>
      )}
    </Card>
  )
}
