/**
 * Wizard de Importación CSV/Excel
 * §6.3: 5 pasos - Upload → Mapeo → Validación → Preview → Confirmación
 * FIXED: Muestra todas las filas con errores + algunas válidas
 */

import React, { useState } from 'react'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import Card from './ui/Card'
import Button from './ui/Button'
import {
  parseCSVFile,
  parseExcelFile,
  autoDetectMapping,
  generateImportPreview,
  getPreviewStats,
  DISTRIBUTOR_FIELDS,
  CANDIDATE_FIELDS,
  type ImportEntityType,
  type ParsedFileData,
  type ColumnMapping,
  type ImportPreviewRow
} from '../lib/data/importService'
// Si el archivo realmente está en otro lugar, actualiza la ruta relativa correctamente.
// Ejemplo: './lib/data/importService' o la ruta correcta según tu estructura de carpetas.

interface ImportWizardProps {
  entityType: ImportEntityType
  onComplete: (data: Record<string, string>[]) => void
  onCancel: () => void
}

type WizardStep = 'upload' | 'mapping' | 'preview' | 'confirm'

export const ImportWizard: React.FC<ImportWizardProps> = ({
  entityType,
  onComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload')
  const [_file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedFileData | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping[]>([])
  const [preview, setPreview] = useState<ImportPreviewRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fields =
    entityType === 'distributor' ? DISTRIBUTOR_FIELDS : CANDIDATE_FIELDS

  // Paso 1: Upload archivo
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setIsProcessing(true)

    try {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
      let data: ParsedFileData

      if (fileExtension === 'csv') {
        data = await parseCSVFile(selectedFile)
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await parseExcelFile(selectedFile)
      } else {
        throw new Error(
          'Formato de archivo no soportado. Use CSV o Excel (.xlsx, .xls)'
        )
      }

      setFile(selectedFile)
      setParsedData(data)

      // Auto-detectar mapeo
      const autoMapping = autoDetectMapping(data.headers, entityType)
      setColumnMapping(autoMapping)

      setCurrentStep('mapping')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Paso 2: Confirmar mapeo y avanzar a preview
  const handleMappingConfirm = () => {
    if (!parsedData) return

    setIsProcessing(true)
    try {
      const previewData = generateImportPreview(
        parsedData.rows,
        columnMapping,
        entityType
      )
      setPreview(previewData)
      setCurrentStep('preview')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Actualizar mapeo de columna
  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setColumnMapping((prev) => {
      // Remover mapeo anterior de esta columna
      const filtered = prev.filter((m) => m.sourceColumn !== sourceColumn)

      // Agregar nuevo mapeo si no es vacío
      if (targetField !== '') {
        return [...filtered, { sourceColumn, targetField }]
      }

      return filtered
    })
  }

  // Paso 3: Confirmar importación
  const handleConfirmImport = () => {
    const validRows = preview
      .filter((row) => row.errors.length === 0)
      .map((row) => row.data)

    onComplete(validRows)
  }

  const stats = preview.length > 0 ? getPreviewStats(preview) : null

  return (
    <div className="space-y-6">
      {/* Header con pasos */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Importar{' '}
          {entityType === 'distributor' ? 'Distribuidores' : 'Candidatos'}
        </h2>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2">
          {(['upload', 'mapping', 'preview', 'confirm'] as WizardStep[]).map(
            (step) => {
              const stepLabels = {
                upload: '1. Subir',
                mapping: '2. Mapear',
                preview: '3. Validar',
                confirm: '4. Confirmar'
              }

              const isActive = currentStep === step
              const isPast =
                ['upload', 'mapping', 'preview', 'confirm'].indexOf(
                  currentStep
                ) > ['upload', 'mapping', 'preview', 'confirm'].indexOf(step)

              return (
                <div
                  key={step}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    isActive
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : isPast
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {stepLabels[step]}
                </div>
              )
            }
          )}
        </div>
      </div>

      {/* Error global */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-300">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* PASO 1: Upload */}
      {currentStep === 'upload' && (
        <Card className="p-8">
          <div className="text-center">
            <ArrowUpTrayIcon className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
              Seleccione un archivo
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Formatos aceptados: CSV, Excel (.xlsx, .xls)
            </p>

            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
              id="file-upload"
            />

            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <DocumentTextIcon className="w-5 h-5 mr-2" />
              {isProcessing ? 'Procesando...' : 'Seleccionar Archivo'}
            </label>
          </div>
        </Card>
      )}

      {/* PASO 2: Mapeo */}
      {currentStep === 'mapping' && parsedData && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Mapeo de Columnas
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Asocie las columnas de su archivo con los campos del sistema.
            Detectamos automáticamente {columnMapping.length} coincidencias.
          </p>

          <div className="space-y-3">
            {parsedData.headers.map((header) => {
              const currentMapping = columnMapping.find(
                (m) => m.sourceColumn === header
              )

              return (
                <div
                  key={header}
                  className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 dark:text-white">
                      {header}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">
                      Ejemplo: {parsedData.rows[0]?.[header] || '(vacío)'}
                    </div>
                  </div>

                  <ArrowRightIcon className="w-4 h-4 text-slate-400" />

                  <select
                    value={currentMapping?.targetField || ''}
                    onChange={(e) =>
                      handleMappingChange(header, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                    aria-label={`Mapear columna ${header}`}
                  >
                    <option value="">-- No mapear --</option>
                    {fields.map((field: (typeof fields)[0]) => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required && '*'}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('upload')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Button
              onClick={handleMappingConfirm}
              loading={isProcessing}
              disabled={columnMapping.length === 0}
            >
              Continuar
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* PASO 3: Preview y validación */}
      {currentStep === 'preview' && stats && (
        <div className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Total Filas
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">
                {stats.totalRows}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Válidas
              </div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.validRows}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Con Errores
              </div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.rowsWithErrors}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                % Válidas
              </div>
              <div
                className={`text-2xl font-bold ${
                  stats.validPercentage >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : stats.validPercentage >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                {stats.validPercentage}%
              </div>
            </Card>
          </div>

          {/* Lista de filas con errores/warnings */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Vista Previa de Datos
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* FIXED: Mostrar TODAS las filas con errores primero, luego algunas válidas */}
              {[
                ...preview.filter((row) => row.errors.length > 0), // Todas las filas con errores
                ...preview.filter((row) => row.errors.length === 0).slice(0, 15) // Primeras 15 válidas
              ].map((row) => (
                <div
                  key={row.rowIndex}
                  className={`p-3 rounded-lg border-2 ${
                    row.errors.length > 0
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      : row.warnings.length > 0
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Fila {row.rowIndex}
                    </span>
                    {row.errors.length === 0 && (
                      <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    )}
                  </div>

                  <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {row.data.name || row.data.contactPerson || '(Sin nombre)'}
                  </div>

                  {row.errors.map(
                    (
                      error: { field: string; value: string; error: string },
                      index: number
                    ) => (
                      <div
                        key={index}
                        className="text-xs text-red-600 dark:text-red-400"
                      >
                        ❌ {error.error}
                      </div>
                    )
                  )}

                  {row.warnings.map((warning: string, index: number) => (
                    <div
                      key={index}
                      className="text-xs text-yellow-600 dark:text-yellow-400"
                    >
                      ⚠️ {warning}
                    </div>
                  ))}
                </div>
              ))}

              {/* FIXED: Mensaje actualizado */}
              {preview.filter((row) => row.errors.length === 0).length > 15 && (
                <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-2">
                  Se muestran todas las {stats.rowsWithErrors} filas con errores
                  + 15 filas válidas de ejemplo
                  <br />
                  ... y{' '}
                  {preview.filter((row) => row.errors.length === 0).length -
                    15}{' '}
                  filas válidas más
                </div>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Ajustar Mapeo
            </Button>

            <Button
              onClick={() => setCurrentStep('confirm')}
              disabled={stats.validRows === 0}
            >
              Continuar
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 4: Confirmación */}
      {currentStep === 'confirm' && stats && (
        <Card className="p-8">
          <div className="text-center">
            <TableCellsIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">
              ¿Confirmar Importación?
            </h3>

            <div className="max-w-md mx-auto space-y-4 text-left">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Se importarán:
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.validRows}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  registros válidos
                </div>
              </div>

              {stats.rowsWithErrors > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Se omitirán:
                    </span>
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.rowsWithErrors}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    registros con errores
                  </div>
                </div>
              )}

              <p className="text-sm text-slate-600 dark:text-slate-400 text-center pt-4">
                Esta acción agregará los registros válidos a la base de datos.
              </p>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>

              <Button onClick={handleConfirmImport} className="px-8">
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                Confirmar e Importar
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
