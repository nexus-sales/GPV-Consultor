import React from 'react'
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import Card from '../ui/Card'

// Tipos para el componente

type ColorVariant = 'indigo' | 'cyan' | 'green' | 'yellow' | 'red'

interface ChartDataItem {
  name: string
  value: number
}

interface ProgressBarProps {
  label: string
  value: number
  maxValue: number
  color?: ColorVariant
  showPercentage?: boolean
}

interface StatsChartProps {
  title: string
  data: ChartDataItem[]
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  label,
  value,
  maxValue,
  color = 'indigo',
  showPercentage = true
}) => {
  const percentage = Math.round((value / maxValue) * 100)

  const colorClasses: Record<ColorVariant, string> = {
    indigo: 'bg-pastel-indigo',
    cyan: 'bg-pastel-cyan',
    green: 'bg-pastel-green',
    yellow: 'bg-pastel-yellow',
    red: 'bg-pastel-red'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {value}
          </span>
          {showPercentage && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({percentage}%)
            </span>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        {/* Inline style required for dynamic width - see docs/CSS_INLINE_STYLES.md */}
        <div
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-label={`${label}: ${percentage}%`}
        />
      </div>
    </div>
  )
}

const StatsChart: React.FC<StatsChartProps> = ({ title, data }) => {
  const colors: ColorVariant[] = ['indigo', 'cyan', 'green', 'yellow', 'red']
  const maxValue = Math.max(...data.map((item) => item.value))
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card variant="gradient" hover className="h-full">
      <Card.Header>
        <div className="flex items-center justify-between">
          <Card.Title className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-pastel-indigo/20 to-pastel-indigo/10 p-2 rounded-xl shadow-lg shadow-pastel-indigo/20 hover:scale-110 transition-all duration-300">
              <ChartBarIcon className="h-5 w-5 text-pastel-indigo" />
            </div>
            {title}
          </Card.Title>
          <div className="flex items-center gap-1 text-xs text-pastel-green font-medium bg-gradient-to-r from-pastel-green/15 to-pastel-green/10 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all duration-300">
            <ArrowTrendingUpIcon className="h-3 w-3 animate-pulse" />
            <SparklesIcon className="h-2 w-2 opacity-60" />
            +12.5%
          </div>
        </div>
      </Card.Header>

      <Card.Content>
        <div className="space-y-4">
          {data.map((item, index) => (
            <ProgressBar
              key={item.name}
              label={item.name}
              value={item.value}
              maxValue={maxValue}
              color={colors[index % colors.length]}
            />
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalValue.toLocaleString()}
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  )
}

export default StatsChart
