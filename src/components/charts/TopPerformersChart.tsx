import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  type PieLabelRenderProps
} from 'recharts'
import type { ChartTooltipProps } from './chartTooltipTypes'

interface RankingDataPoint {
  name: string // Nombre del municipio/distribuidor
  value: number // Número de operaciones
  percentage?: number
}

interface TopPerformersChartProps {
  data: RankingDataPoint[]
  title?: string
  height?: number
  label?: string // "municipios", "distribuidores", etc.
}

// Paleta de colores vibrantes para el PieChart
const COLORS = [
  '#818CF8', // pastel-indigo
  '#22D3EE', // pastel-cyan
  '#FBBF24', // pastel-yellow
  '#34D399', // pastel-green
  '#F472B6', // pastel-pink
  '#A78BFA', // pastel-purple
  '#FB923C', // pastel-orange
  '#EF4444' // pastel-red
]

type RankingTooltipProps = ChartTooltipProps<
  RankingDataPoint & { fill?: string }
>

const CustomTooltip: React.FC<RankingTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]
    if (!dataPoint) {
      return null
    }
    const { name, value, payload: pointPayload } = dataPoint
    const resolvedName = typeof name === 'string' ? name : String(name ?? '')
    const resolvedValue = typeof value === 'number' ? value : Number(value ?? 0)
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-lg">
        <p className="font-semibold text-gray-900 dark:text-white">
          {resolvedName}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Operaciones:{' '}
          <span className="font-bold" style={{ color: pointPayload?.fill }}>
            {resolvedValue}
          </span>
        </p>
        {pointPayload?.percentage != null && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {pointPayload.percentage.toFixed(1)}% del total
          </p>
        )}
      </div>
    )
  }
  return null
}

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }
  return undefined
}

const CustomLabel = (props: PieLabelRenderProps): React.ReactNode => {
  const cx = toNumber(props.cx)
  const cy = toNumber(props.cy)
  const innerRadius = toNumber(props.innerRadius)
  const outerRadius = toNumber(props.outerRadius)
  const midAngle = toNumber(props.midAngle)
  const percent = toNumber(props.percent)

  if (
    cx === undefined ||
    cy === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    midAngle === undefined ||
    percent === undefined ||
    percent < 0.05
  ) {
    return null
  }

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const TopPerformersChart: React.FC<TopPerformersChartProps> = ({
  data,
  title = 'Top Performers',
  height = 300,
  label = 'elementos'
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <p className="text-sm font-medium">
            No hay datos de ranking disponibles
          </p>
          <p className="text-xs mt-1">
            Los {label} se mostrarán conforme haya actividad
          </p>
        </div>
      </div>
    )
  }

  // Calcular porcentajes
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const dataWithPercentage = data.map((item) => ({
    ...item,
    percentage: (item.value / total) * 100
  }))

  // Tomar solo top 8 para evitar saturación
  const topData = dataWithPercentage.slice(0, 8)

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={topData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {topData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '0.75rem' }}
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Tabla de ranking debajo del gráfico */}
      <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
        <div className="space-y-2">
          {topData.slice(0, 5).map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {index + 1}. {item.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.value} ops
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500 w-12 text-right">
                  {item.percentage?.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopPerformersChart
