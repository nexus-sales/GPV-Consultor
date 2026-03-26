import React from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

export type ColorVariant = 'indigo' | 'cyan' | 'yellow' | 'green' | 'red'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ElementType
  color?: ColorVariant
  trend?: number | null
  onClick?: (() => void) | null
  loading?: boolean
}

const iconColors: Record<ColorVariant, string> = {
  indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  cyan: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  yellow: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  green: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend = null,
  onClick = null,
  loading = false
}) => {
  const trendPositive = trend !== null && trend >= 0
  const trendValue = trend !== null ? Math.abs(trend) : null

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-4 relative overflow-hidden transition-shadow duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick ?? undefined}
      {...(onClick && { role: 'button', tabIndex: 0 })}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2">
            {Icon && (
              <div className={`${iconColors[color]} p-2 rounded-lg`}>
                <Icon className="h-4 w-4" />
              </div>
            )}
            {trend !== null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  trendPositive
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                }`}
              >
                {trendPositive ? (
                  <ArrowTrendingUpIcon className="h-3 w-3" />
                ) : (
                  <ArrowTrendingDownIcon className="h-3 w-3" />
                )}
                {trendValue}%
              </span>
            )}
          </div>

          <div className="mb-1">
            {loading ? (
              <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-7 w-14 rounded" />
            ) : (
              <p className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                {value}
              </p>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-tight">
              {title}
            </p>
            {subtitle && (
              <p
                className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight truncate"
                title={subtitle}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default KpiCard
