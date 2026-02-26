import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import type { ChartTooltipProps } from './chartTooltipTypes'

interface TrendDataPoint {
  period: string // "2025-W41", "Enero 2025", etc.
  ventas: number
  visitas?: number
  candidatos?: number
}

interface SalesTrendsChartProps {
  data: TrendDataPoint[]
  title?: string
  height?: number
  showVisits?: boolean
  showCandidates?: boolean
}

const CustomTooltip: React.FC<ChartTooltipProps<TrendDataPoint>> = ({
  active,
  payload,
  label
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry, index) => {
          if (!entry) return null
          const color =
            typeof entry.color === 'string' ? entry.color : '#111827'
          const value =
            typeof entry.value === 'number'
              ? entry.value
              : Number(entry.value ?? 0)
          const name =
            typeof entry.name === 'string'
              ? entry.name
              : String(entry.name ?? index)
          return (
            <p key={name} className="text-sm" style={{ color }}>
              {name}: <span className="font-bold">{value}</span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

const SalesTrendsChart: React.FC<SalesTrendsChartProps> = ({
  data,
  title = 'Tendencias de Ventas',
  height = 300,
  showVisits = false,
  showCandidates = false
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <p className="text-sm font-medium">
            No hay datos históricos disponibles
          </p>
          <p className="text-xs mt-1">
            Los datos se mostrarán conforme se registren ventas
          </p>
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
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="period"
            stroke="#6B7280"
            style={{ fontSize: '0.875rem' }}
          />
          <YAxis stroke="#6B7280" style={{ fontSize: '0.875rem' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '0.875rem' }} iconType="circle" />

          {/* Línea principal: Ventas */}
          <Line
            type="monotone"
            dataKey="ventas"
            name="Ventas"
            stroke="#818CF8"
            strokeWidth={3}
            dot={{ fill: '#818CF8', r: 5 }}
            activeDot={{ r: 7 }}
          />

          {/* Línea opcional: Visitas */}
          {showVisits && (
            <Line
              type="monotone"
              dataKey="visitas"
              name="Visitas"
              stroke="#22D3EE"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#22D3EE', r: 4 }}
            />
          )}

          {/* Línea opcional: Candidatos */}
          {showCandidates && (
            <Line
              type="monotone"
              dataKey="candidatos"
              name="Candidatos"
              stroke="#FBBF24"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#FBBF24', r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesTrendsChart
