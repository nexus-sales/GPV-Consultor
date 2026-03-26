/**
 * Panel de configuración de sincronización con Calendario
 */

import React from 'react'
import { toast } from 'sonner'
import {
  CalendarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  GoogleIcon,
  MicrosoftIcon
} from '@heroicons/react/24/outline'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useCalendarSync } from './useCalendarSync'
import { Calendar } from './types'

interface CalendarSyncPanelProps {
  title?: string
  description?: string
}

export const CalendarSyncPanel: React.FC<CalendarSyncPanelProps> = ({
  title = 'Sincronización con Calendario',
  description = 'Sincroniza visitas y eventos con Google Calendar o Microsoft Outlook'
}) => {
  const {
    config,
    updateConfig,
    googleConnected,
    microsoftConnected,
    connectGoogle,
    disconnectGoogle,
    connectMicrosoft,
    disconnectMicrosoft,
    calendars,
    refreshCalendars,
    isSyncing
  } = useCalendarSync()

  const handleCalendarChange = (calendarId: string) => {
    updateConfig({
      calendar: { ...config.calendar, calendarId }
    })
    toast.success('Calendario actualizado')
  }

  const handleToggleSync = (enabled: boolean) => {
    updateConfig({
      calendar: { ...config.calendar, enabled }
    })
    toast.success(
      enabled ? 'Sincronización activada' : 'Sincronización desactivada'
    )
  }

  const activeProvider = config.calendar.enabled
    ? config.calendar.provider
    : null

  return (
    <Card className="p-6 border-none shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">{title}</h4>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        {config.calendar.enabled && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
            <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-xs font-bold text-green-700 dark:text-green-300">
              Activo
            </span>
          </div>
        )}
      </div>

      {/* Provider Selection */}
      <div className="grid grid-cols-2 gap-4">
        {/* Google */}
        <button
          onClick={googleConnected ? disconnectGoogle : connectGoogle}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            config.calendar.provider === 'google'
              ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="font-bold text-sm">Google</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {googleConnected ? 'Desconectar' : 'Conectar'}
          </p>
        </button>

        {/* Microsoft */}
        <button
          onClick={microsoftConnected ? disconnectMicrosoft : connectMicrosoft}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            config.calendar.provider === 'microsoft'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#00A4EF" d="M1.25 1.25h10.125v10.125H1.25z" />
              <path fill="#7FBA00" d="M12.625 1.25h10.125v10.125H12.625z" />
              <path fill="#F25022" d="M1.25 12.625h10.125v10.125H1.25z" />
              <path fill="#FFB900" d="M12.625 12.625h10.125v10.125H12.625z" />
            </svg>
            <span className="font-bold text-sm">Microsoft</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {microsoftConnected ? 'Desconectar' : 'Conectar'}
          </p>
        </button>
      </div>

      {/* Connection Status */}
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
                  ? 'Google Calendar conectado'
                  : activeProvider === 'microsoft'
                    ? 'Microsoft Outlook conectado'
                    : 'Sin proveedor activo'}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCalendars}
              disabled={isSyncing}
            >
              <ArrowPathIcon
                className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
          </div>

          {/* Calendar Selector */}
          {calendars.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Calendario a utilizar
              </label>
              <select
                value={config.calendar.calendarId || 'primary'}
                onChange={(e) => handleCalendarChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name} {calendar.primary ? '(Principal)' : ''}
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
                  checked={config.calendar.syncVisits}
                  onChange={(e) =>
                    updateConfig({
                      calendar: {
                        ...config.calendar,
                        syncVisits: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Visitas comerciales
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.calendar.syncCalls}
                  onChange={(e) =>
                    updateConfig({
                      calendar: {
                        ...config.calendar,
                        syncCalls: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Llamadas de seguimiento
                </span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.calendar.syncDeadlines}
                  onChange={(e) =>
                    updateConfig({
                      calendar: {
                        ...config.calendar,
                        syncDeadlines: e.target.checked
                      }
                    })
                  }
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Fechas límite de leads
                </span>
              </label>
            </div>
          </div>

          {/* Reminder Settings */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Recordatorio por defecto
            </label>
            <select
              value={config.calendar.defaultReminderMinutes}
              onChange={(e) =>
                updateConfig({
                  calendar: {
                    ...config.calendar,
                    defaultReminderMinutes: Number(e.target.value)
                  }
                })
              }
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            >
              <option value={0}>Sin recordatorio</option>
              <option value={5}>5 minutos antes</option>
              <option value={10}>10 minutos antes</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={1440}>1 día antes</option>
            </select>
          </div>

          {/* Toggle Master Switch */}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <label className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Sincronización activada
              </span>
              <button
                onClick={() => handleToggleSync(!config.calendar.enabled)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  config.calendar.enabled
                    ? 'bg-indigo-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                    config.calendar.enabled ? 'translate-x-7' : ''
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
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">
            Conecta tu cuenta de Google o Microsoft para sincronizar eventos
          </p>
        </div>
      )}
    </Card>
  )
}
