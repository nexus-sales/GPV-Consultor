import React, { useState } from 'react'
import { useTheme } from '../lib/useTheme'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'

// Tipos para el componente
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

interface ColorVariantConfig {
  bgLight: string
  bgDark: string
  border: string
  icon: string
  accent: string
  hover: string
}

const colorVariants: Record<ColorVariant, ColorVariantConfig> = {
  indigo: {
    bgLight:
      'bg-gradient-to-br from-indigo-50 via-indigo-50/60 to-white shadow-[0_8px_30px_rgba(99,102,241,0.08)]',
    bgDark:
      'bg-gradient-to-br from-pastel-indigo/10 via-slate-900/60 to-pastel-indigo/5 backdrop-blur-md',
    border: 'border border-indigo-100 dark:border-pastel-indigo/20',
    icon: 'bg-indigo-100 dark:bg-pastel-indigo/20 text-indigo-600 dark:text-pastel-indigo',
    accent: 'text-indigo-700 dark:text-pastel-indigo',
    hover:
      'hover:shadow-lg hover:shadow-indigo-200/60 hover:border-indigo-200 dark:hover:border-pastel-indigo/50'
  },
  cyan: {
    bgLight:
      'bg-gradient-to-br from-cyan-50 via-cyan-50/60 to-white shadow-[0_8px_30px_rgba(6,182,212,0.08)]',
    bgDark:
      'bg-gradient-to-br from-pastel-cyan/10 via-slate-900/60 to-pastel-cyan/5 backdrop-blur-md',
    border: 'border border-cyan-100 dark:border-pastel-cyan/20',
    icon: 'bg-cyan-100 dark:bg-pastel-cyan/20 text-cyan-600 dark:text-pastel-cyan',
    accent: 'text-cyan-700 dark:text-pastel-cyan',
    hover:
      'hover:shadow-lg hover:shadow-cyan-200/60 hover:border-cyan-200 dark:hover:border-pastel-cyan/50'
  },
  yellow: {
    bgLight:
      'bg-gradient-to-br from-amber-50 via-amber-50/60 to-white shadow-[0_8px_30px_rgba(245,158,11,0.08)]',
    bgDark:
      'bg-gradient-to-br from-pastel-yellow/10 via-slate-900/60 to-pastel-yellow/5 backdrop-blur-md',
    border: 'border border-amber-100 dark:border-pastel-yellow/20',
    icon: 'bg-amber-100 dark:bg-pastel-yellow/20 text-amber-600 dark:text-pastel-yellow',
    accent: 'text-amber-700 dark:text-pastel-yellow',
    hover:
      'hover:shadow-lg hover:shadow-amber-200/60 hover:border-amber-200 dark:hover:border-pastel-yellow/50'
  },
  green: {
    bgLight:
      'bg-gradient-to-br from-green-50 via-green-50/60 to-white shadow-[0_8px_30px_rgba(34,197,94,0.08)]',
    bgDark:
      'bg-gradient-to-br from-pastel-green/10 via-slate-900/60 to-pastel-green/5 backdrop-blur-md',
    border: 'border border-green-100 dark:border-pastel-green/20',
    icon: 'bg-green-100 dark:bg-pastel-green/20 text-green-600 dark:text-pastel-green',
    accent: 'text-green-700 dark:text-pastel-green',
    hover:
      'hover:shadow-lg hover:shadow-green-200/60 hover:border-green-200 dark:hover:border-pastel-green/50'
  },
  red: {
    bgLight:
      'bg-gradient-to-br from-red-50 via-red-50/60 to-white shadow-[0_8px_30px_rgba(239,68,68,0.08)]',
    bgDark:
      'bg-gradient-to-br from-pastel-red/10 via-slate-900/60 to-pastel-red/5 backdrop-blur-md',
    border: 'border border-red-100 dark:border-pastel-red/20',
    icon: 'bg-red-100 dark:bg-pastel-red/20 text-red-600 dark:text-pastel-red',
    accent: 'text-red-700 dark:text-pastel-red',
    hover:
      'hover:shadow-lg hover:shadow-red-200/60 hover:border-red-200 dark:hover:border-pastel-red/50'
  }
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
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const { isDark } = useTheme()
  const variant = colorVariants[color]

  const trendColor =
    trend !== null && trend >= 0 ? 'pastel-green' : 'pastel-red'
  const trendValue = trend !== null ? Math.abs(trend) : null

  const cardClasses = `
    ${isDark ? variant.bgDark : variant.bgLight} ${variant.border} ${variant.hover}
    rounded-2xl p-4 relative overflow-hidden
    transition-all duration-300 ease-out
    hover:scale-[1.02]
    ${onClick ? 'cursor-pointer' : ''}
    ${isHovered ? 'shadow-2xl' : ''}
  `

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  return (
    <div
      className={cardClasses}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...(onClick && {
        role: 'button',
        tabIndex: 0
      })}
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
              <div
                className={`${variant.icon} p-2 rounded-lg transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}
              >
                <Icon className="h-4 w-4" />
              </div>
            )}
            {trend !== null && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-${trendColor}/15 text-${trendColor} text-xs font-semibold`}
              >
                {trend > 0 ? (
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
              <div className="animate-pulse bg-gray-200 h-7 w-14 rounded"></div>
            ) : (
              <p
                className={`text-2xl font-bold ${variant.accent} transition-colors duration-300 truncate`}
              >
                {value}
              </p>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 leading-tight">
              {title}
            </p>
            {subtitle && (
              <p
                className="text-[11px] text-gray-500 dark:text-gray-500 leading-tight truncate"
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
