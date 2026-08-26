/**
 * Página de Importación de Datos
 * §6.3: Interfaz para importar distribuidores o candidatos desde CSV/Excel
 */

import React, { useState } from 'react'
import {
  UserGroupIcon,
  SparklesIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '../components/layout/PageContainer'
import { ImportWizard } from '../components/ImportWizard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import type { ImportEntityType } from '../lib/data/importService'
import type { NewDistributor, NewCandidate } from '../lib/types'
import {
  candidateIdentityKey,
  distributorIdentityKey
} from '../lib/data/normalisers'

/** Fila que no llegó a crearse, con el motivo para poder corregirla y reintentar. */
interface FailedRow {
  fila: number
  motivo: string
}

/** Fila descartada por repetirse dentro del propio archivo importado. */
interface DuplicateRow {
  fila: number
  nombre: string
}

export const Import: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEntityType, setSelectedEntityType] =
    useState<ImportEntityType | null>(null)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: FailedRow[]
    duplicates: DuplicateRow[]
    type: string
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const navigate = useNavigate()
  const { addDistributor, addCandidate } = useAppData()

  const handleStartImport = (entityType: ImportEntityType) => {
    setSelectedEntityType(entityType)
    setShowWizard(true)
    setImportResult(null)
  }

  const handleImportComplete = async (data: Record<string, string>[]) => {
    if (!selectedEntityType) return

    setIsImporting(true)

    let successCount = 0
    const failed: FailedRow[] = []
    const duplicates: DuplicateRow[] = []
    // Claves de identidad ya vistas EN ESTE archivo. addDistributor/addCandidate
    // deduplican contra distributorsRef/candidatesRef, que solo se refrescan en
    // un efecto tras el render: dentro del bucle no ven lo insertado en las
    // iteraciones anteriores, así que dos filas idénticas del mismo archivo
    // pasarían el filtro. Este Set cubre ese hueco.
    const seenKeys = new Set<string>()

    if (selectedEntityType === 'distributor') {
      for (const [index, row] of data.entries()) {
        const numeroFila = index + 1
        try {
          const distributor: NewDistributor = {
            name: row.name,
            taxId: row.nif,
            fiscalName: row.name,
            fiscalAddress: row.address || '',
            phone: row.phone,
            email: row.email || '',
            contactPerson: row.contactPerson,
            contactPersonBackup: '',
            province: row.province as 'Las Palmas' | 'Santa Cruz de Tenerife',
            city: row.city,
            address: row.address || '',
            postalCode: row.postalCode,
            channelType: row.channelType as
              | 'exclusive'
              | 'non_exclusive'
              | 'd2d',
            brands: [],
            status:
              (row.status as 'active' | 'pending' | 'blocked') || 'pending',
            notes: row.notes || '',
            upgradeRequested: false
          }

          const key = distributorIdentityKey(
            distributor as unknown as Record<string, unknown>
          )
          if (seenKeys.has(key)) {
            duplicates.push({
              fila: numeroFila,
              nombre: distributor.name || '(sin nombre)'
            })
            continue
          }
          seenKeys.add(key)

          await addDistributor(distributor)
          successCount++
        } catch (error) {
          failed.push({
            fila: numeroFila,
            motivo: error instanceof Error ? error.message : String(error)
          })
        }
      }
    } else {
      for (const [index, row] of data.entries()) {
        const numeroFila = index + 1
        try {
          const candidate: NewCandidate = {
            name: row.name,
            stage: row.stage || 'new',
            channelCode: row.channelCode || undefined,
            contact: {
              name: row.contactPerson || '',
              phone: row.phone,
              email: row.email || ''
            },
            province: row.province as 'Las Palmas' | 'Santa Cruz de Tenerife',
            city: row.city,
            island: row.island || undefined,
            priority: (row.priority as 'high' | 'medium' | 'low') || 'medium',
            source: row.source || 'import',
            notes: row.notes || '',
            lastContactAt: new Date().toISOString().split('T')[0]
          }

          const key = candidateIdentityKey(
            candidate as unknown as Record<string, unknown>
          )
          if (seenKeys.has(key)) {
            duplicates.push({
              fila: numeroFila,
              nombre: candidate.name || '(sin nombre)'
            })
            continue
          }
          seenKeys.add(key)

          await addCandidate(candidate)
          successCount++
        } catch (error) {
          failed.push({
            fila: numeroFila,
            motivo: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    setImportResult({
      success: successCount,
      failed,
      duplicates,
      type:
        selectedEntityType === 'distributor' ? 'distribuidores' : 'candidatos'
    })

    setIsImporting(false)
    setShowWizard(false)
  }

  const handleCancel = () => {
    setShowWizard(false)
    setSelectedEntityType(null)
  }

  if (showWizard && selectedEntityType) {
    return (
      <PageContainer className="py-6">
        {isImporting && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-indigo-600" />
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              Importando filas… no cierres esta página.
            </p>
          </div>
        )}
        <ImportWizard
          entityType={selectedEntityType}
          onComplete={handleImportComplete}
          onCancel={handleCancel}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Importar Datos
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Importe distribuidores o candidatos desde archivos CSV o Excel
        </p>
      </div>

      {importResult &&
        (() => {
          const conIncidencias =
            importResult.failed.length > 0 || importResult.duplicates.length > 0
          return (
            <div
              className={`mb-6 p-4 border rounded-lg ${
                conIncidencias
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    conIncidencias
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-green-100 dark:bg-green-900/40'
                  }`}
                >
                  <ArrowUpTrayIcon
                    className={`w-6 h-6 ${
                      conIncidencias
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  />
                </div>
                <div>
                  <p
                    className={`font-semibold ${
                      conIncidencias
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-green-800 dark:text-green-300'
                    }`}
                  >
                    {conIncidencias
                      ? 'Importación terminada con incidencias'
                      : '¡Importación completada!'}
                  </p>
                  <p
                    className={`text-sm ${
                      conIncidencias
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}
                  >
                    Se importaron {importResult.success} {importResult.type}
                    {importResult.failed.length > 0 &&
                      ` · ${importResult.failed.length} con error`}
                    {importResult.duplicates.length > 0 &&
                      ` · ${importResult.duplicates.length} duplicadas en el archivo`}
                  </p>
                </div>
              </div>

              {importResult.failed.length > 0 && (
                <div className="mt-4 rounded-md bg-white/60 p-3 dark:bg-slate-900/40">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    Filas no importadas
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
                    {importResult.failed.map((f) => (
                      <li key={`err-${f.fila}`}>
                        <span className="font-medium">Fila {f.fila}:</span>{' '}
                        {f.motivo}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.duplicates.length > 0 && (
                <div className="mt-3 rounded-md bg-white/60 p-3 dark:bg-slate-900/40">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    Duplicadas dentro del archivo (no se crearon dos veces)
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-slate-700 dark:text-slate-300">
                    {importResult.duplicates.map((d) => (
                      <li key={`dup-${d.fila}`}>
                        <span className="font-medium">Fila {d.fila}:</span>{' '}
                        {d.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <UserGroupIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              Importar Distribuidores
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Cargue múltiples distribuidores desde un archivo CSV o Excel con
              validación automática
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Campos Requeridos:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Nombre</li>
                <li>• NIF/CIF</li>
                <li>• Teléfono</li>
                <li>• Persona de Contacto</li>
                <li>• Provincia</li>
                <li>• Ciudad</li>
                <li>• Código Postal</li>
                <li>• Tipo de Canal</li>
              </ul>
            </div>

            <Button
              onClick={() => handleStartImport('distributor')}
              className="w-full"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Comenzar Importación
            </Button>

            <button
              onClick={() => navigate('/distributors')}
              className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Ver distribuidores actuales →
            </button>
          </div>
        </Card>

        <Card className="p-8 hover:shadow-lg transition-shadow">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mb-4">
              <SparklesIcon className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>

            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
              Importar Candidatos
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Cargue múltiples candidatos potenciales desde un archivo CSV o
              Excel
            </p>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Campos Requeridos:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Nombre</li>
                <li>• Ciudad</li>
                <li>• Provincia</li>
                <li>• Contacto Teléfono</li>
              </ul>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3 mb-2 uppercase">
                Campos Opcionales:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Isla</li>
                <li>• Código de Canal</li>
                <li>• Etapa</li>
                <li>• Fuente</li>
                <li>• Prioridad</li>
                <li>• Contacto Nombre</li>
                <li>• Contacto Email</li>
                <li>• Notas</li>
              </ul>
            </div>

            <Button
              onClick={() => handleStartImport('candidate')}
              className="w-full"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Comenzar Importación
            </Button>

            <button
              onClick={() => navigate('/candidates')}
              className="mt-3 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Ver candidatos actuales →
            </button>
          </div>
        </Card>
      </div>

      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Consejos para una importación exitosa
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600 dark:text-slate-400">
          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
              1. Prepare su archivo
            </h4>
            <p>
              Asegúrese de que la primera fila contenga los nombres de las
              columnas y que los datos estén limpios.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
              2. Formatos aceptados
            </h4>
            <p>
              Teléfonos: 9 dígitos (ej: 928123456). Códigos postales: 5 dígitos
              (ej: 35001).
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-2">
              3. Revisión automática
            </h4>
            <p>
              El sistema validará y normalizará automáticamente los datos antes
              de importar.
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  )
}

export default Import
