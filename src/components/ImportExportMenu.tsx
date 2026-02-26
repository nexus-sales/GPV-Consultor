import React, { useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import type { ImportResult } from '../lib/utils/excel'

interface ImportExportMenuProps<T = unknown> {
  type: 'distributors' | 'candidates'
  onDownloadTemplate: () => void
  onExport: () => void
  onExportFiltered?: () => void
  hasFilters?: boolean
  filteredCount?: number
  totalCount?: number
  onImport: (file: File) => Promise<ImportResult<T>>
  onImportComplete: (data: T[]) => void
}

const ImportExportMenu = <T,>({
  type,
  onDownloadTemplate,
  onExport,
  onExportFiltered,
  hasFilters = false,
  filteredCount = 0,
  totalCount = 0,
  onImport,
  onImportComplete
}: ImportExportMenuProps<T>): React.ReactElement => {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult<T> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const result = await onImport(file)
      setImportResult(result)

      if (result.success && result.data.length > 0) {
        onImportComplete(result.data)
      }
    } catch (error) {
      setImportResult({
        success: false,
        data: [],
        errors: [
          `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`
        ],
        warnings: []
      })
    } finally {
      setIsImporting(false)
      // Reset input para permitir seleccionar el mismo archivo de nuevo
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownloadTemplate = () => {
    onDownloadTemplate()
    setIsOpen(false)
  }

  const handleExport = () => {
    onExport()
    setIsOpen(false)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
    setIsOpen(false)
  }

  const typeName = type === 'distributors' ? 'Distribuidores' : 'Candidatos'

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-2xl border border-pastel-indigo/30 bg-pastel-indigo/10 dark:bg-pastel-indigo/20 px-4 py-2 text-sm font-semibold text-pastel-indigo shadow-sm transition hover:bg-pastel-indigo hover:text-white"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Excel
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl z-50">
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <DocumentArrowDownIcon className="h-5 w-5 text-pastel-cyan" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Descargar Plantilla
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Excel vacío para rellenar
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              disabled={isImporting}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5 text-pastel-green" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {isImporting ? 'Importando...' : 'Importar Excel'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Cargar datos desde archivo
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
            >
              <ArrowDownTrayIcon className="h-5 w-5 text-pastel-indigo" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Exportar Todos
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Descargar todos los {typeName.toLowerCase()} ({totalCount})
                </div>
              </div>
            </button>

            {/* Exportar Filtrados - Solo se muestra si hay filtros activos */}
            {hasFilters && onExportFiltered && (
              <button
                type="button"
                onClick={() => {
                  onExportFiltered()
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left rounded-xl bg-pastel-cyan/10 dark:bg-pastel-cyan/20 hover:bg-pastel-cyan/20 dark:hover:bg-pastel-cyan/30 border border-pastel-cyan/30 transition"
              >
                <FunnelIcon className="h-5 w-5 text-pastel-cyan" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Exportar Filtrados
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Solo datos visibles ({filteredCount} de {totalCount})
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input oculto para seleccionar archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Seleccionar archivo Excel para importar"
      />

      {/* Resultado de importación */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-800/95 p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-pastel-indigo focus:ring-offset-2"
            >
              Cerrar
            </button>

            <div className="pr-20">
              <div className="flex items-center gap-3 mb-4">
                {importResult.success ? (
                  <CheckCircleIcon className="h-8 w-8 text-pastel-green" />
                ) : (
                  <XCircleIcon className="h-8 w-8 text-pastel-red" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {importResult.success
                      ? 'Importación Exitosa'
                      : 'Error en Importación'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {importResult.success ? (
                      <>
                        {importResult.created !== undefined &&
                        importResult.updated !== undefined ? (
                          <>
                            Se procesaron {importResult.data.length}{' '}
                            {typeName.toLowerCase()}:
                            <span className="ml-2 font-semibold text-pastel-green">
                              {importResult.created} creados
                            </span>
                            {importResult.updated > 0 && (
                              <span className="ml-2 font-semibold text-pastel-cyan">
                                {importResult.updated} actualizados
                              </span>
                            )}
                          </>
                        ) : (
                          `Se importaron ${importResult.data.length} ${typeName.toLowerCase()} correctamente`
                        )}
                      </>
                    ) : (
                      'Se encontraron errores en el archivo'
                    )}
                  </p>
                </div>
              </div>

              {/* Errores */}
              {importResult.errors.length > 0 && (
                <div className="mb-4 rounded-2xl border border-pastel-red/30 bg-pastel-red/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircleIcon className="h-5 w-5 text-pastel-red" />
                    <h3 className="font-semibold text-pastel-red">
                      Errores ({importResult.errors.length})
                    </h3>
                  </div>
                  <ul className="space-y-1 text-sm text-pastel-red/90 max-h-40 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="pl-4">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Advertencias */}
              {importResult.warnings.length > 0 && (
                <div className="rounded-2xl border border-pastel-yellow/30 bg-pastel-yellow/10 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-pastel-yellow" />
                    <h3 className="font-semibold text-pastel-yellow">
                      Advertencias ({importResult.warnings.length})
                    </h3>
                  </div>
                  <ul className="space-y-1 text-sm text-pastel-yellow/90 max-h-32 overflow-y-auto">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index} className="pl-4">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.success && (
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setImportResult(null)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-pastel-indigo px-6 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-indigo/90"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Continuar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExportMenu
