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
import { ChartBarIcon } from '@heroicons/react/24/outline'
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
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-4">
          <ChartBarIcon className="h-6 w-6" />
        </div>
        <div className="text-center px-6">
          <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Sin Datos de Rendimiento
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[240px]">
            La gráfica de tendencias se activará automáticamente al registrar
            las primeras operaciones de venta.
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
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ fill: '#6366F1', r: 5 }}
            activeDot={{ r: 7 }}
          />

          {/* Línea opcional: Visitas */}
          {showVisits && (
            <Line
              type="monotone"
              dataKey="visitas"
              name="Visitas"
              stroke="#06B6D4"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#06B6D4', r: 4 }}
            />
          )}

          {/* Línea opcional: Candidatos */}
          {showCandidates && (
            <Line
              type="monotone"
              dataKey="candidatos"
              name="Candidatos"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#F59E0B', r: 4 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default SalesTrendsChart
