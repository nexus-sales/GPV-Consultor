import React, { useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XCircleIcon
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const typeName = type === 'distributors' ? 'Distribuidores' : 'Candidatos'

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-600 hover:text-white dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300"
      >
        <ArrowDownTrayIcon className="h-4 w-4" />
        Excel
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onDownloadTemplate()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <DocumentArrowDownIcon className="h-5 w-5 text-cyan-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Descargar plantilla
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Excel vacio para rellenar
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click()
                setIsOpen(false)
              }}
              disabled={isImporting}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-gray-50 disabled:opacity-50 dark:hover:bg-gray-700/50"
            >
              <ArrowUpTrayIcon className="h-5 w-5 text-emerald-600" />
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
              onClick={() => {
                onExport()
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <ArrowDownTrayIcon className="h-5 w-5 text-indigo-600" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Exportar todos
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Descargar todos los {typeName.toLowerCase()} ({totalCount})
                </div>
              </div>
            </button>

            {hasFilters && onExportFiltered && (
              <button
                type="button"
                onClick={() => {
                  onExportFiltered()
                  setIsOpen(false)
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-left text-sm transition hover:bg-cyan-100 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20"
              >
                <FunnelIcon className="h-5 w-5 text-cyan-600" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Exportar filtrados
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Seleccionar archivo Excel para importar"
      />

      {importResult && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12">
          <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="absolute right-4 top-4 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 shadow transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-400"
            >
              Cerrar
            </button>

            <div className="pr-20">
              <div className="mb-4 flex items-center gap-3">
                {importResult.success ? (
                  <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                ) : (
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {importResult.success
                      ? 'Importacion exitosa'
                      : 'Error en importacion'}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {importResult.success ? (
                      <>
                        {importResult.created !== undefined &&
                        importResult.updated !== undefined ? (
                          <>
                            Se procesaron {importResult.data.length}{' '}
                            {typeName.toLowerCase()}:
                            <span className="ml-2 font-semibold text-emerald-600">
                              {importResult.created} creados
                            </span>
                            {importResult.updated > 0 && (
                              <span className="ml-2 font-semibold text-cyan-600">
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

              {importResult.errors.length > 0 && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
                  <div className="mb-2 flex items-center gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-600 dark:text-red-300">
                      Errores ({importResult.errors.length})
                    </h3>
                  </div>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-red-700 dark:text-red-300">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="pl-4">
                        - {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <div className="mb-2 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-700 dark:text-amber-300">
                      Advertencias ({importResult.warnings.length})
                    </h3>
                  </div>
                  <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-amber-700 dark:text-amber-300">
                    {importResult.warnings.map((warning, index) => (
                      <li key={index} className="pl-4">
                        - {warning}
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
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
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
