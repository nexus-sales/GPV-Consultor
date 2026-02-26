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
import { ImportWizard } from '../components/ImportWizard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAppData } from '../lib/useAppData'
import type { ImportEntityType } from '../lib/data/importService'
import type {
  Distributor,
  Candidate,
  NewDistributor,
  NewCandidate
} from '../lib/types'

export const Import: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false)
  const [selectedEntityType, setSelectedEntityType] =
    useState<ImportEntityType | null>(null)
  const [importResult, setImportResult] = useState<{
    success: number
    type: string
  } | null>(null)

  const navigate = useNavigate()
  const { addDistributor, addCandidate } = useAppData()

  const handleStartImport = (entityType: ImportEntityType) => {
    setSelectedEntityType(entityType)
    setShowWizard(true)
    setImportResult(null)
  }

  const handleImportComplete = (data: Record<string, string>[]) => {
    if (!selectedEntityType) return

    let successCount = 0

    if (selectedEntityType === 'distributor') {
      data.forEach((row) => {
        try {
          const distributor: NewDistributor = {
            name: row.name,
            taxId: row.nif,
            fiscalName: row.name, // Usar el nombre como nombre fiscal por defecto
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
            brands: [], // Se asignarán después según canal
            status:
              (row.status as 'active' | 'pending' | 'blocked') || 'pending',
            notes: row.notes || '',
            upgradeRequested: false
          }

          addDistributor(distributor)
          successCount++
        } catch (error) {
          // Ignorar errores de importación individuales
          void error
        }
      })
    } else {
      data.forEach((row) => {
        try {
          const candidate: NewCandidate = {
            name: row.name,
            stage: 'new',
            contact: {
              name: row.contactPerson || '',
              phone: row.phone,
              email: row.email || ''
            },
            province: row.province as 'Las Palmas' | 'Santa Cruz de Tenerife',
            city: row.city,
            priority: (row.interest as 'high' | 'medium' | 'low') || 'medium',
            source: row.source || 'import',
            notes: row.notes || '',
            lastContactAt: new Date().toISOString().split('T')[0]
          }

          addCandidate(candidate)
          successCount++
        } catch (error) {
          // Ignorar errores de importación individuales
          void error
        }
      })
    }

    setImportResult({
      success: successCount,
      type:
        selectedEntityType === 'distributor' ? 'distribuidores' : 'candidatos'
    })

    setShowWizard(false)
  }

  const handleCancel = () => {
    setShowWizard(false)
    setSelectedEntityType(null)
  }

  if (showWizard && selectedEntityType) {
    return (
      <div className="container mx-auto px-6 py-6 max-w-6xl">
        <ImportWizard
          entityType={selectedEntityType}
          onComplete={handleImportComplete}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Importar Datos
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Importe distribuidores o candidatos desde archivos CSV o Excel
        </p>
      </div>

      {/* Resultado de importación */}
      {importResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
              <ArrowUpTrayIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                ¡Importación completada!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Se importaron {importResult.success} {importResult.type}{' '}
                correctamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Opciones de importación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Importar Distribuidores */}
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

        {/* Importar Candidatos */}
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
                <li>• Teléfono</li>
                <li>• Provincia</li>
                <li>• Ciudad</li>
              </ul>
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-3 mb-2 uppercase">
                Campos Opcionales:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <li>• Email</li>
                <li>• Persona de Contacto</li>
                <li>• Dirección</li>
                <li>• Código Postal</li>
                <li>• Nivel de Interés</li>
                <li>• Fuente</li>
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

      {/* Sección de ayuda */}
      <Card className="mt-8 p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          💡 Consejos para una importación exitosa
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
    </div>
  )
}
