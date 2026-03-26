/**
 * Panel de configuración de sincronización con Tareas
 */

import React from 'react'
import { toast } from 'sonner'
import {
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useCalendarSync } from './useCalendarSync'
import { TaskList } from './types'

interface TaskSyncPanelProps {
  title?: string
  description?: string
}

export const TaskSyncPanel: React.FC<TaskSyncPanelProps> = ({
  title = 'Sincronización con Tareas',
  description = 'Sincroniza seguimientos y tareas pendientes con Google Tasks o Microsoft To Do'
}) => {
  const {
    config,
    updateConfig,
    googleConnected,
    microsoftConnected,
    taskLists,
    refreshTaskLists,
    isSyncing
  } = useCalendarSync()

  const handleTaskListChange = (taskListId: string) => {
    updateConfig({
      tasks: { ...config.tasks, taskListId }
    })
    toast.success('Lista de tareas actualizada')
  }

  const handleToggleSync = (enabled: boolean) => {
    updateConfig({
      tasks: { ...config.tasks, enabled }
    })
    toast.success(
      enabled
        ? 'Sincronización de tareas activada'
        : 'Sincronización de tareas desactivada'
    )
  }

  const activeProvider = config.tasks.enabled ? config.tasks.provider : null

  return (
    <Card className="p-6 border-none shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-900/30 flex items-center justify-center">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {config.tasks.enabled && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-bold text-green-700 dark:text-green-300">
              Activo
            </span>
          </div>
        )}
      </div>

      {/* Provider Status */}
      {(googleConnected || microsoftConnected) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-2">
              {activeProvider === 'google' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              ) : activeProvider === 'microsoft' ? (
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-gray-400" />
              )}
              <span className="text-sm font-medium">
                {activeProvider === 'google'
                  ? 'Google Tasks conectado'
                  : activeProvider === 'microsoft'
                    ? 'Microsoft To Do conectado'
                    : 'Selecciona un proveedor arriba'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshTaskLists}
              disabled={isSyncing}
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
          </div>

          {/* Task List Selector */}
          {taskLists.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Lista de tareas a utilizar
              </label>
              <select
                value={config.tasks.taskListId || ''}
                onChange={(e) => handleTaskListChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="">Seleccionar lista...</option>
                {taskLists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sync Options */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Qué sincronizar
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.tasks.syncFollowUps}
                  onChange={(e) =>
                    updateConfig({
                      tasks: {
                        ...config.tasks,
                        syncFollowUps: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Seguimientos de leads y candidatos
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.tasks.syncPendingData}
                  onChange={(e) =>
                    updateConfig({
                      tasks: {
                        ...config.tasks,
                        syncPendingData: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Datos pendientes de completar
                </span>
              </label>
            </div>
          </div>

          {/* Toggle Master Switch */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Sincronización de tareas activada
              </span>
              <button
                onClick={() => handleToggleSync(!config.tasks.enabled)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  config.tasks.enabled
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    config.tasks.enabled ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      )}

      {/* Not connected state */}
      {!googleConnected && !microsoftConnected && (
        <div className="text-center py-8 text-gray-500">
          <ClipboardDocumentCheckIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            Conecta Google o Microsoft para sincronizar tareas
          </p>
          <p className="text-xs mt-2">
            Debes conectar al menos un proveedor en la sección de Calendario
          </p>
        </div>
      )}
    </Card>
  )
}
