import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import Card from '../ui/Card'
import { useAppData } from '../../lib/useAppData'
import { calculateDistributorsBySector } from '../../lib/data/kpiCalculations'

const SECTOR_COLORS: Record<string, string> = {
  telco: '#6366F1', // indigo-500
  alarms: '#EF4444', // red-500
  energy: '#F59E0B' // amber-500
}

export const SectorDistributionChart: React.FC = () => {
  const { distributors, sectors } = useAppData()
  const bySector = calculateDistributorsBySector(distributors)

  const chartData = bySector.map((item) => {
    const sector = sectors.find((s) => s.id === item.sectorId)
    return {
      name: sector?.label || item.sectorId,
      value: item.count,
      percentage: item.percentage,
      id: item.sectorId
    }
  })

  const renderCustomLabel = (entry: PieLabelRenderProps) =>
    `${(entry as { percentage?: number }).percentage ?? 0}%`

  return (
    <Card
      variant="default"
      className="p-6 relative overflow-hidden h-full"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <span className="text-6xl font-bold">📊</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Distribución por Sector
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribuidores activos por sector
          </p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[350px] space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl">
            📁
          </div>
          <p className="text-gray-400 text-sm">
            Sin sectores asignados a distribuidores
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-2 items-center gap-4">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  label={renderCustomLabel}
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={SECTOR_COLORS[entry.id] || '#cbd5e1'}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {chartData.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: SECTOR_COLORS[item.id] || '#94a3b8'
                    }}
                  />
                  <span className="font-bold text-gray-700 dark:text-gray-200">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {item.value} dist.
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
