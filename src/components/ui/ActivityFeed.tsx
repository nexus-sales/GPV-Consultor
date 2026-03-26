import React, { useState } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  ChartBarIcon,
  FireIcon
} from '@heroicons/react/24/outline'

// Tipos para las actividades
import type { Activity } from '../../lib/types'
export type ActivityType = 'sale' | 'visit' | 'call' | 'task' | 'information'
export type Priority = 'high' | 'medium' | 'low'

interface ActivityFeedProps {
  activities?: Activity[]
  title?: string
  showAll?: boolean
  enableFilters?: boolean
}

type FilterState = {
  type: ActivityType | 'all'
  priority: Priority | 'all'
  date: string // formato YYYY-MM-DD o ''
}

interface ActivityItemProps {
  activity: Activity
}

interface ActivityTypeConfig {
  icon: React.ElementType
  color: string
  bgColor: string
}

const activityTypes: Record<ActivityType, ActivityTypeConfig> = {
  sale: {
    icon: ChartBarIcon,
    color: 'bg-emerald-50 text-emerald-600',
    bgColor: 'bg-emerald-50/50'
  },
  visit: {
    icon: UserIcon,
    color: 'bg-cyan-50 text-cyan-600',
    bgColor: 'bg-cyan-50/50'
  },
  call: {
    icon: PhoneIcon,
    color: 'bg-amber-50 text-amber-600',
    bgColor: 'bg-amber-50/50'
  },
  task: {
    icon: CheckCircleIcon,
    color: 'bg-indigo-50 text-indigo-600',
    bgColor: 'bg-indigo-50/50'
  },
  information: {
    icon: ClockIcon,
    color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-700'
  }
}

const defaultActivityType: ActivityTypeConfig = {
  icon: ClockIcon,
  color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  bgColor: 'bg-gray-50 dark:bg-gray-700'
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const type = activityTypes[activity.type] || defaultActivityType
  const Icon = type.icon

  return (
    <div
      className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:shadow-md ${type.bgColor}`}
    >
      <div className={`${type.color} p-2.5 rounded-xl flex-shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
              {activity.title}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {activity.description}
            </p>
            {activity.metadata && (
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(activity.metadata).map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end ml-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {activity.timestamp}
            </span>
            {activity.priority && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  activity.priority === 'high'
                    ? 'bg-red-50 text-red-600'
                    : activity.priority === 'medium'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {activity.priority}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  title = 'Actividad Reciente',
  showAll = false,
  enableFilters = false
}) => {
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    priority: 'all',
    date: ''
  })
  const [localShowAll, setLocalShowAll] = useState(false)

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFilters((prev) => ({ ...prev, [name]: value }))
  }

  const filteredActivities = activities.filter((a) => {
    const matchType = filters.type === 'all' || a.type === filters.type
    const matchPriority =
      filters.priority === 'all' || a.priority === filters.priority
    const matchDate =
      !filters.date || (a.timestamp && a.timestamp.startsWith(filters.date))
    return matchType && matchPriority && matchDate
  })

  const displayActivities =
    showAll || localShowAll
      ? filteredActivities
      : filteredActivities.slice(0, 5)

  if (!activities.length) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          No hay actividad reciente
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          La actividad aparecerá aquí cuando comience a usar el sistema.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        {title && (
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        )}
        {enableFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="rounded border-gray-300 text-sm"
              title="Filtrar por tipo de actividad"
            >
              <option value="all">Tipo: Todos</option>
              <option value="sale">Venta</option>
              <option value="visit">Visita</option>
              <option value="call">Llamada</option>
              <option value="task">Tarea</option>
              <option value="information">Info</option>
            </select>
            <select
              name="priority"
              value={filters.priority}
              onChange={handleFilterChange}
              className="rounded border-gray-300 text-sm"
              title="Filtrar por prioridad"
            >
              <option value="all">Prioridad: Todas</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="rounded border-gray-300 text-sm"
              max={new Date().toISOString().slice(0, 10)}
              title="Filtrar por fecha"
              placeholder="Filtrar por fecha"
            />
          </div>
        )}
        {filteredActivities.length > 5 && !showAll && !localShowAll && (
          <button
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            onClick={() => setLocalShowAll(true)}
          >
            Ver todas ({filteredActivities.length})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayActivities.map((activity, index) => (
          <ActivityItem
            key={activity.id || `activity-${index}`}
            activity={activity}
          />
        ))}
        {displayActivities.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No hay actividades que coincidan con el filtro.
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityFeed
