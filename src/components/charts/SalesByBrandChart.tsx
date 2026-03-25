import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'
import type { ChartTooltipProps } from './chartTooltipTypes'

interface SalesByBrandData {
  name: string
  value: number
  family?: string
}

interface SalesByBrandChartProps {
  data: SalesByBrandData[]
  title?: string
  height?: number
}

// Paleta de colores pastel del tema
const BRAND_COLORS: Record<string, string> = {
  Silbö: '#6366F1', // indigo-500
  Lowi: '#06B6D4', // cyan-500
  Vodafone: '#EF4444', // red-500
  default: '#8B5CF6' // violet-500
}

const CustomTooltip: React.FC<ChartTooltipProps<SalesByBrandData>> = ({
  active,
  payload
}) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload
    if (!data) {
      return null
    }
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Operaciones:{' '}
          <span className="font-bold text-pastel-indigo">{data.value}</span>
        </p>
        {data.family && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Familia: {data.family}
          </p>
        )}
      </div>
    )
  }
  return null
}

const SalesByBrandChart: React.FC<SalesByBrandChartProps> = ({
  data,
  title = 'Ventas por Marca',
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <p className="text-sm font-medium">
            No hay datos de ventas disponibles
          </p>
          <p className="text-xs mt-1">Registra ventas para ver estadísticas</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis stroke="#6B7280" style={{ fontSize: '0.875rem' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.875rem' }} iconType="circle" />
          <Bar dataKey="value" name="Operaciones" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BRAND_COLORS[entry.name] || BRAND_COLORS.default}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesByBrandChart
