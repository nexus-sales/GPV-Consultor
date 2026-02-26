interface Notification {
  id: string
  type: string
  title: string
  description: string
  timestamp?: string
  read?: boolean
  color?: string
}
import React, { useState } from 'react'
import { useAppData } from '../lib/useAppData'
import {
  BellIcon,
  CalendarIcon,
  UserGroupIcon,
  ChartBarIcon,
  PhoneIcon,
  CheckCircleIcon,
  TrashIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

// Componente Notifications limpio y funcional
const Notifications: React.FC = () => {
  const { notifications, setNotifications } = useAppData()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const unreadCount = notifications.filter((n) => n.read === false).length
  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => n.read === false)
      : notifications

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Header */}
        <header className="rounded-4xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-r from-white/95 via-white/80 to-pastel-indigo/20 dark:from-gray-800/95 dark:via-gray-800/80 dark:to-pastel-indigo/10 p-8 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-pastel-indigo/15 p-3 text-pastel-indigo">
                  <BellIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-pastel-indigo">
                    Centro de notificaciones
                  </p>
                  <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                    Todas las notificaciones
                  </h1>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Mantente al día con todas las actualizaciones y recordatorios
                importantes.
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-pastel-red/15 px-4 py-2 text-sm font-semibold text-pastel-red">
                  {unreadCount} sin leer
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 rounded-2xl bg-pastel-indigo px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-cyan"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                  Marcar todas como leídas
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === 'all'
                ? 'bg-pastel-indigo text-white'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === 'unread'
                ? 'bg-pastel-indigo text-white'
                : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
            }`}
          >
            Sin leer ({unreadCount})
          </button>
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-12 text-center">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                No hay notificaciones
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {filter === 'unread'
                  ? 'Todas las notificaciones están marcadas como leídas'
                  : 'No tienes notificaciones en este momento'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              // Aquí deberías mapear el tipo y color a los iconos y estilos reales
              return (
                <div
                  key={notification.id}
                  className={`flex gap-4 p-4 rounded-2xl border transition ${
                    notification.read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
                    {/* Icono dinámico según tipo */}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                          {!notification.read && (
                            <span className="ml-2 inline-block w-2 h-2 bg-pastel-red rounded-full"></span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition"
                        title="Marcar como leída"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-pastel-green" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5 text-pastel-red" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Notifications
