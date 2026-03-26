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
import { PageContainer } from '../components/layout/PageContainer'
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageContainer size="narrow" className="py-10 space-y-8">
        {/* Header */}
        <header className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-indigo-50 dark:bg-indigo-900/30 p-3 text-indigo-600 dark:text-indigo-400">
                  <BellIcon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
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
                <span className="rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">
                  {unreadCount} sin leer
                </span>
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
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
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              filter === 'unread'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            Sin leer ({unreadCount})
          </button>
        </div>

        {/* Lista de notificaciones */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
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
                  className={`flex gap-4 p-4 rounded-xl border transition ${
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
                            <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
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
                        <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 rounded-lg bg-white/50 dark:bg-gray-700/50 hover:bg-white dark:hover:bg-gray-700 transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PageContainer>
    </div>
  )
}

export default Notifications
