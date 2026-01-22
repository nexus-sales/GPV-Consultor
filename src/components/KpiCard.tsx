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
    bgLight:
      'bg-gradient-to-br from-pastel-indigo/5 via-white/80 to-pastel-indigo/10',
    bgDark:
      'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-pastel-indigo/10',
    border: 'border-pastel-indigo/20',
    icon: 'bg-pastel-indigo/15 text-pastel-indigo',
    accent: 'text-pastel-indigo',
    hover: 'hover:shadow-pastel-indigo/10'
  },
  cyan: {
    bgLight:
      'bg-gradient-to-br from-pastel-cyan/5 via-white/80 to-pastel-cyan/10',
    bgDark:
      'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-pastel-cyan/10',
    border: 'border-pastel-cyan/20',
    icon: 'bg-pastel-cyan/15 text-pastel-cyan',
    accent: 'text-pastel-cyan',
    hover: 'hover:shadow-pastel-cyan/10'
  },
  yellow: {
    bgLight:
      'bg-gradient-to-br from-pastel-yellow/5 via-white/80 to-pastel-yellow/10',
    bgDark:
      'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-pastel-yellow/10',
    border: 'border-pastel-yellow/20',
    icon: 'bg-pastel-yellow/15 text-pastel-yellow',
    accent: 'text-pastel-yellow',
    hover: 'hover:shadow-pastel-yellow/10'
  },
  green: {
    bgLight:
      'bg-gradient-to-br from-pastel-green/5 via-white/80 to-pastel-green/10',
    bgDark:
      'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-pastel-green/10',
    border: 'border-pastel-green/20',
    icon: 'bg-pastel-green/15 text-pastel-green',
    accent: 'text-pastel-green',
    hover: 'hover:shadow-pastel-green/10'
  },
  red: {
    bgLight:
      'bg-gradient-to-br from-pastel-red/5 via-white/80 to-pastel-red/10',
    bgDark:
      'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-pastel-red/10',
    border: 'border-pastel-red/20',
    icon: 'bg-pastel-red/15 text-pastel-red',
    accent: 'text-pastel-red',
    hover: 'hover:shadow-pastel-red/10'
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

  const cardClasses = `
    ${isDark ? variant.bgDark : variant.bgLight} ${variant.border} ${variant.hover}
    backdrop-blur-sm border rounded-2xl p-6 
    transition-all duration-300 ease-out
    hover:scale-[1.02] hover:shadow-xl
    ${onClick ? 'cursor-pointer' : ''}
    ${isHovered ? 'shadow-2xl' : 'shadow-sm'}
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
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            {Icon && (
              <div
                className={`${variant.icon} p-2.5 rounded-xl transition-all duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            )}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed">
              {title}
            </p>
          </div>

          <div className="mb-2">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              </div>
            ) : (
              <p
                className={`text-3xl font-bold ${variant.accent} transition-colors duration-300`}
              >
                {value}
              </p>
            )}
          </div>

          {subtitle && (
            <div className="flex items-center gap-2">
              {trend !== null && trend !== undefined && (
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend > 0
                      ? 'bg-pastel-green/15 text-pastel-green'
                      : 'bg-pastel-red/15 text-pastel-red'
                  }`}
                >
                  {trend > 0 ? (
                    <ArrowTrendingUpIcon className="h-3 w-3" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-3 w-3" />
                  )}
                  {Math.abs(trend)}%
                </div>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default KpiCard
