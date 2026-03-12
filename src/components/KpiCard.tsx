import React, { useState } from 'react'
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  PhoneIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/useTheme'

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
    bgLight: 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
    bgDark: 'bg-gradient-to-br from-pastel-indigo/10 via-slate-900/60 to-pastel-indigo/5 backdrop-blur-md',
    border: 'border border-pastel-indigo/20 dark:border-pastel-indigo/20',
    icon: 'bg-pastel-indigo/10 dark:bg-pastel-indigo/20 text-pastel-indigo dark:text-pastel-indigo',
    accent: 'text-pastel-indigo dark:text-pastel-indigo',
    hover: 'hover:shadow-lg hover:shadow-pastel-indigo/20 hover:border-pastel-indigo/50 dark:hover:border-pastel-indigo/50'
  },
  cyan: {
    bgLight: 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
    bgDark: 'bg-gradient-to-br from-pastel-cyan/10 via-slate-900/60 to-pastel-cyan/5 backdrop-blur-md',
    border: 'border border-pastel-cyan/20 dark:border-pastel-cyan/20',
    icon: 'bg-pastel-cyan/10 dark:bg-pastel-cyan/20 text-pastel-cyan dark:text-pastel-cyan',
    accent: 'text-pastel-cyan dark:text-pastel-cyan',
    hover: 'hover:shadow-lg hover:shadow-pastel-cyan/20 hover:border-pastel-cyan/50 dark:hover:border-pastel-cyan/50'
  },
  yellow: {
    bgLight: 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
    bgDark: 'bg-gradient-to-br from-pastel-yellow/10 via-slate-900/60 to-pastel-yellow/5 backdrop-blur-md',
    border: 'border border-pastel-yellow/20 dark:border-pastel-yellow/20',
    icon: 'bg-pastel-yellow/10 dark:bg-pastel-yellow/20 text-pastel-yellow dark:text-pastel-yellow',
    accent: 'text-pastel-yellow dark:text-pastel-yellow',
    hover: 'hover:shadow-lg hover:shadow-pastel-yellow/20 hover:border-pastel-yellow/50 dark:hover:border-pastel-yellow/50'
  },
  green: {
    bgLight: 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
    bgDark: 'bg-gradient-to-br from-pastel-green/10 via-slate-900/60 to-pastel-green/5 backdrop-blur-md',
    border: 'border border-pastel-green/20 dark:border-pastel-green/20',
    icon: 'bg-pastel-green/10 dark:bg-pastel-green/20 text-pastel-green dark:text-pastel-green',
    accent: 'text-pastel-green dark:text-pastel-green',
    hover: 'hover:shadow-lg hover:shadow-pastel-green/20 hover:border-pastel-green/50 dark:hover:border-pastel-green/50'
  },
  red: {
    bgLight: 'bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)]',
    bgDark: 'bg-gradient-to-br from-pastel-red/10 via-slate-900/60 to-pastel-red/5 backdrop-blur-md',
    border: 'border border-pastel-red/20 dark:border-pastel-red/20',
    icon: 'bg-pastel-red/10 dark:bg-pastel-red/20 text-pastel-red dark:text-pastel-red',
    accent: 'text-pastel-red dark:text-pastel-red',
    hover: 'hover:shadow-lg hover:shadow-pastel-red/20 hover:border-pastel-red/50 dark:hover:border-pastel-red/50'
  }
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'indigo',
  trend: _trend = null,
  onClick = null,
  loading = false
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const { isDark } = useTheme()
  const variant = colorVariants[color]

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
              <p className="text-[11px] text-gray-500 dark:text-gray-500 leading-tight truncate" title={subtitle}>
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
