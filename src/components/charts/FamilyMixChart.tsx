/**
 * Componente para visualizar el Mix de Familias (§5 KPIs)
 * Muestra la distribución de ventas por familia de productos
 */

import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import Card from '../ui/Card'
import { useAppData } from '../../lib/useAppData'
import { calculateSalesByFamily } from '../../lib/data/kpiCalculations'

// Colores variados para productos
const PRODUCT_COLORS = [
  '#818cf8', // indigo
  '#22d3ee', // cyan
  '#34d399', // green
  '#fbbf24', // yellow
  '#f87171', // red
  '#a78bfa', // violet
  '#f472b6', // pink
  '#94a3b8'  // slate
]

export const FamilyMixChart: React.FC = () => {
  const { sales } = useAppData()
  const salesByFamily = calculateSalesByFamily(sales)

  // Preparar datos para Recharts
  const chartData = salesByFamily.map((item) => ({
    name: item.label,
    value: item.operations,
    percentage: item.percentage
  }))

  const totalOperations = salesByFamily.reduce(
    (sum, item) => sum + item.operations,
    0
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Mix de Productos
          </h3>
          <p className="text-sm text-gray-500">Distribución por tipos de servicios</p>
        </div>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500">
          {totalOperations} TOTAL
        </div>
      </div>

      {salesByFamily.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Sin actividad productiva</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  )
}
