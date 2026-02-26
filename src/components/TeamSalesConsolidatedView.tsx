import { useState, useMemo } from 'react'
import { useAppData } from '../lib/useAppData'
import {
  consolidateTeamSales,
  getTeamRanking
} from '../lib/data/teamSalesConsolidation'
import Card from './ui/Card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export const TeamSalesConsolidatedView = () => {
  const { sales } = useAppData()
  const [periodDays, setPeriodDays] = useState(30)

  const { startDate, endDate } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - periodDays)

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }
  }, [periodDays])

  const consolidations = useMemo(
    () => consolidateTeamSales(sales, startDate, endDate),
    [sales, startDate, endDate]
  )

  const ranking = useMemo(
    () => getTeamRanking(sales, startDate, endDate),
    [sales, startDate, endDate]
  )

  const chartData = useMemo(
    () =>
      consolidations.map((c) => ({
        name:
          c.teamName.length > 15
            ? c.teamName.substring(0, 15) + '...'
            : c.teamName,
        ventas: c.totalSales,
        miembros: c.memberCount,
        promedio:
          c.memberCount > 0
            ? Math.round((c.totalSales / c.memberCount) * 10) / 10
            : 0
      })),
    [consolidations]
  )

  const totalSales = consolidations.reduce((sum, c) => sum + c.totalSales, 0)
  const totalMembers = consolidations.reduce((sum, c) => sum + c.memberCount, 0)

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ventas Consolidadas por Equipo D2D
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualiza el rendimiento de cada equipo en los últimos {periodDays}{' '}
            días
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodDays === days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {days === 365 ? '1 año' : `${days}d`}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Equipos Activos
          </div>
          <div className="text-2xl font-bold">{consolidations.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Miembros
          </div>
          <div className="text-2xl font-bold">{totalMembers}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ventas Totales
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {totalSales}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Promedio por Miembro
          </div>
          <div className="text-2xl font-bold">
            {totalMembers > 0
              ? Math.round((totalSales / totalMembers) * 10) / 10
              : 0}
          </div>
        </Card>
      </div>

      {/* Gráfico de barras */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Ventas por Equipo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.1}
              />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f3f4f6'
                }}
              />
              <Legend />
              <Bar dataKey="ventas" fill="#818cf8" name="Ventas Totales" />
              <Bar
                dataKey="promedio"
                fill="#22d3ee"
                name="Promedio por Miembro"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Ranking de equipos */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Ranking de Equipos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Equipo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Miembros
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Ventas
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Prom/Miembro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ranking.map((team) => (
                <tr
                  key={team.teamId}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                        team.rank === 1
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : team.rank === 2
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            : team.rank === 3
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {team.rank === 1
                        ? '🥇'
                        : team.rank === 2
                          ? '🥈'
                          : team.rank === 3
                            ? '🥉'
                            : team.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {team.teamName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                    {team.memberCount}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold text-green-600 dark:text-green-400">
                    {team.totalSales}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                    {team.avgSalesPerMember}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detalle por equipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {consolidations.map((team) => (
          <Card key={team.teamId} className="p-6">
            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              {team.teamName}
            </h4>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Miembros:
                </span>
                <span className="font-medium">{team.memberCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Ventas totales:
                </span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {team.totalSales}
                </span>
              </div>

              {team.memberCount > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Top Performers:
                  </div>
                  {team.salesByMember.slice(0, 3).map((member) => (
                    <div
                      key={member.distributorId}
                      className="flex justify-between text-xs py-1"
                    >
                      <span className="text-gray-600 dark:text-gray-400 truncate mr-2">
                        {member.distributorName}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {member.salesCount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {Object.keys(team.salesByBrand).length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Por marca:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(team.salesByBrand).map(([brand, count]) => (
                      <span
                        key={brand}
                        className="px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        {brand}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
