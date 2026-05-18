/**
 * Mix de Marcas por distribuidores (cuando no hay ventas) o por ventas (cuando existen)
 */

import React, { useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import Card from '../ui/Card'
import { useAppData } from '../../lib/useAppData'
import {
  calculateDistributorsByBrand,
  calculateSalesByBrand
} from '../../lib/data/kpiCalculations'

const PRODUCT_COLORS = [
  '#6366F1', // indigo-500
  '#06B6D4', // cyan-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#94A3B8' // slate-400
]

const FamilyMixChartInner: React.FC = () => {
  const { distributors, sales } = useAppData()

  const { chartData, total, subtitle, unit } = useMemo(() => {
    const hasSales = sales.length > 0
    if (hasSales) {
      const byBrand = calculateSalesByBrand(sales)
      return {
        chartData: byBrand.map((item) => ({ name: item.brand, value: item.operations, percentage: item.percentage })),
        total: byBrand.reduce((s, i) => s + i.operations, 0),
        subtitle: 'Operaciones por marca',
        unit: 'ops'
      }
    }
    const byBrand = calculateDistributorsByBrand(distributors)
    return {
      chartData: byBrand.map((item) => ({ name: item.label, value: item.count, percentage: item.percentage })),
      total: byBrand.reduce((s, i) => s + i.count, 0),
      subtitle: 'Distribuidores por marca',
      unit: 'dist.'
    }
  }, [distributors, sales])

  const renderCustomLabel = (entry: PieLabelRenderProps) =>
    `${(entry as { percentage?: number }).percentage ?? 0}%`

  return (

    <Card variant="default" className="p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Mix de Marcas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-bold text-gray-500 dark:text-gray-400">
          {total} {unit.toUpperCase()}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[300px] text-gray-400">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-sm">Sin marcas asignadas a distribuidores</p>
        </div>
      ) : (
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
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

export const FamilyMixChart = React.memo(FamilyMixChartInner)
