import React, { useMemo, useState } from 'react'
import {
  UsersIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  SparklesIcon,
  FireIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import type {
  BrandPerformance,
  PipelineStageCount,
  ActivitySummary
} from '../lib/types'

// Importar componentes modulares
import KpiCard, { type ColorVariant } from '../components/KpiCard'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ActivityFeed from '../components/ui/ActivityFeed'
import type { Activity } from '../lib/types'
import StatsChart from '../components/charts/StatsChart'
import QualityMetrics from '../components/charts/QualityMetrics'
import SalesByBrandChart from '../components/charts/SalesByBrandChart'
import SalesTrendsChart from '../components/charts/SalesTrendsChart'
import TopPerformersChart from '../components/charts/TopPerformersChart'
import { FamilyMixChart } from '../components/charts/FamilyMixChart'
import { SectorDistributionChart } from '../components/charts/SectorDistributionChart'
import { DataQualityPanel } from '../components/DataQualityPanel'
import { useAppData } from '../lib/useAppData'
import { useWeeklyReport } from '../lib/hooks/useWeeklyReport'
import { useKPIs } from '../lib/hooks/useKPIs'
import type { WeeklyReportData } from '../components/reports/WeeklyPDFReport'

// Interfaces locales para el Dashboard
interface SalesByBrandItem {
  name: string
  value: number
}

interface KpiItem {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  color: ColorVariant
  trend: number | null
  onClick?: () => void
}

const Dashboard: React.FC = () => {
  // Calcular la semana ISO actual (YYYY-Www)
  function getCurrentISOWeek() {
    const now = new Date()
    // year calculado pero no usado
    // Calcular el número de semana ISO
    const tmp = new Date(now.getTime())
    tmp.setHours(0, 0, 0, 0)
    // Jueves en la semana actual decide el año
    tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
    const week1 = new Date(tmp.getFullYear(), 0, 4)
    // Número de semana ISO
    const week =
      1 +
      Math.round(
        ((tmp.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
        7
      )
    return `${tmp.getFullYear()}-W${week.toString().padStart(2, '0')}`
  }

  const [selectedWeek, setSelectedWeek] = useState<string>(getCurrentISOWeek())
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false)
  const navigate = useNavigate()

  // Saneamiento y validación de datos críticos
  const { stats: rawStats } = useAppData()
  const { generateWeeklyPDF } = useWeeklyReport()
  const { kpis: rawKpis } = useKPIs(selectedWeek)

  // Función de saneamiento para stats
  function sanitizeStats(stats: unknown) {
    const s: Record<string, unknown> =
      typeof stats === 'object' && stats !== null
        ? (stats as Record<string, unknown>)
        : {}
    return {
      activeDistributors: Number.isFinite(s.activeDistributors)
        ? Number(s.activeDistributors)
        : 0,
      pendingDistributors: Number.isFinite(s.pendingDistributors)
        ? Number(s.pendingDistributors)
        : 0,
      totalOperations: Number.isFinite(s.totalOperations)
        ? Number(s.totalOperations)
        : 0,
      visitsLast7Days: Number.isFinite(s.visitsLast7Days)
        ? Number(s.visitsLast7Days)
        : 0,
      candidatesInPipeline: Number.isFinite(s.candidatesInPipeline)
        ? Number(s.candidatesInPipeline)
        : 0,
      operationsByBrand: Array.isArray(s.operationsByBrand)
        ? (s.operationsByBrand as BrandPerformance[])
        : [],
      latestActivities: Array.isArray(s.latestActivities)
        ? (s.latestActivities as Activity[])
        : [],
      pipelineCounts: Array.isArray(s.pipelineCounts)
        ? (s.pipelineCounts as PipelineStageCount[])
        : [],
      operationsBySector: Array.isArray(s.operationsBySector)
        ? (s.operationsBySector as Record<string, unknown>[])
        : []
    }
  }

  function sanitizeKpis(kpis: unknown) {
    const k: Record<string, unknown> =
      typeof kpis === 'object' && kpis !== null
        ? (kpis as Record<string, unknown>)
        : {}
    // Type guards para objetos anidados
    const vtw =
      typeof k.visitorsThisWeek === 'object' && k.visitorsThisWeek !== null
        ? (k.visitorsThisWeek as Record<string, unknown>)
        : {}
    const nad =
      typeof k.newActiveDistributors === 'object' &&
        k.newActiveDistributors !== null
        ? (k.newActiveDistributors as Record<string, unknown>)
        : {}
    const cr =
      typeof k.conversionRate === 'object' && k.conversionRate !== null
        ? (k.conversionRate as Record<string, unknown>)
        : {}
    const dq =
      typeof k.dataQuality === 'object' && k.dataQuality !== null
        ? (k.dataQuality as Record<string, unknown>)
        : {}
    return {
      visitorsThisWeek: {
        total: Number.isFinite(vtw.total) ? (vtw.total as number) : 0,
        distributors: Number.isFinite(vtw.distributors)
          ? (vtw.distributors as number)
          : 0,
        candidates: Number.isFinite(vtw.candidates)
          ? (vtw.candidates as number)
          : 0
      },
      newActiveDistributors: {
        count: Number.isFinite(nad.count) ? (nad.count as number) : 0,
        list: Array.isArray(nad.list) ? (nad.list as unknown[]) : []
      },
      conversionRate: {
        rate: Number.isFinite(cr.rate) ? (cr.rate as number) : 0,
        convertedToActive: Number.isFinite(cr.convertedToActive)
          ? (cr.convertedToActive as number)
          : 0,
        visitedCandidates: Number.isFinite(cr.visitedCandidates)
          ? (cr.visitedCandidates as number)
          : 0
      },
      dataQuality: {
        qualityPercentage: Number.isFinite(dq.qualityPercentage)
          ? (dq.qualityPercentage as number)
          : 0,
        completeRecords: Number.isFinite(dq.completeRecords)
          ? (dq.completeRecords as number)
          : 0,
        totalRecords: Number.isFinite(dq.totalRecords)
          ? (dq.totalRecords as number)
          : 0,
        incompleteRecords: Number.isFinite(dq.incompleteRecords)
          ? (dq.incompleteRecords as number)
          : 0,
        missingFieldsByRecord: Array.isArray(dq.missingFieldsByRecord)
          ? (dq.missingFieldsByRecord as unknown[])
          : []
      }
    }
  }

  // No warnings de dependencias: las funciones no cambian
  const stats = useMemo(() => sanitizeStats(rawStats), [rawStats])
  const kpis = useMemo(() => sanitizeKpis(rawKpis), [rawKpis])

  // KPIs con datos reales de la semana seleccionada
  const kpiData = useMemo(
    (): KpiItem[] => [
      {
        title: 'Visitados Semana',
        value: kpis.visitorsThisWeek.total.toString(),
        subtitle: `${kpis.visitorsThisWeek.distributors} distribuidores, ${kpis.visitorsThisWeek.candidates} candidatos`,
        icon: CalendarIcon,
        color: 'green',
        trend: null
      },
      {
        title: 'Nuevos Activos',
        value: kpis.newActiveDistributors.count.toString(),
        subtitle: 'esta semana',
        icon: SparklesIcon,
        color: 'cyan',
        trend: null,
        onClick: () => navigate('/distributors')
      },
      {
        title: 'Distribuidores Activos',
        value: stats.activeDistributors.toString(),
        subtitle: `${stats.pendingDistributors} pendientes`,
        icon: UsersIcon,
        color: 'indigo',
        trend: null,
        onClick: () => navigate('/distributors')
      },
      {
        title: 'Ventas Totales',
        value: stats.totalOperations.toLocaleString('es-ES'),
        subtitle: 'operaciones registradas',
        icon: FireIcon,
        color: 'yellow',
        trend: null
      },
      {
        title: 'Conversión a Activo',
        value: `${kpis.conversionRate.rate}%`,
        subtitle: `${kpis.conversionRate.convertedToActive} de ${kpis.conversionRate.visitedCandidates} visitados`,
        icon: CheckCircleIcon,
        color: 'green',
        trend: null
      },
      {
        title: 'Calidad de Datos',
        value: `${kpis.dataQuality.qualityPercentage}%`,
        subtitle: `${kpis.dataQuality.completeRecords} de ${kpis.dataQuality.totalRecords} completas`,
        icon: ChartBarIcon,
        color:
          kpis.dataQuality.qualityPercentage >= 80
            ? 'green'
            : kpis.dataQuality.qualityPercentage >= 60
              ? 'yellow'
              : 'indigo',
        trend: null
      }
    ],
    [navigate, stats, kpis]
  )

  // Datos para gráficos
  const salesByBrand = useMemo<SalesByBrandItem[]>(
    () =>
      stats.operationsByBrand.map((brand: BrandPerformance) => ({
        name: brand.label,
        value: Number.isFinite(brand.value) ? Number(brand.value) : 0
      })),
    [stats.operationsByBrand]
  )

  // Datos de tendencias: usar datos reales si existen, si no, array vacío
  const trendData = useMemo(() => {
    if (stats && stats.totalOperations > 0) {
      return [
        {
          period: 'Actual',
          ventas: stats.totalOperations,
          visitas: stats.visitsLast7Days,
          candidatos: stats.candidatesInPipeline
        }
      ]
    }
    return []
  }, [stats])

  // Top municipios: usar datos reales si existen, si no, array vacío
  const topMunicipalities = useMemo(() => {
    // Si hay ventas reales, podrías mapear por municipio si tienes esa lógica
    // Por ahora, array vacío
    return []
  }, [])

  // Adaptar las actividades recientes con validación robusta
  const recentActivities: Activity[] = stats.latestActivities?.length
    ? stats.latestActivities
      .filter((a) => a && typeof a === 'object') // Filtrar objetos válidos
      .map((a) => ({
        id: a.id || `activity-${Math.random()}`,
        type: (['sale', 'visit', 'call', 'task', 'information'].includes(
          a.type
        )
          ? a.type
          : 'information') as Activity['type'],
        title: a.title || 'Actividad sin título',
        description: a.description || '',
        timestamp: a.timestamp || 'Fecha desconocida',
        priority: (typeof a.priority === 'string' &&
          ['high', 'medium', 'low'].includes(a.priority)
          ? a.priority
          : 'low') as Activity['priority'],
        metadata:
          typeof a.metadata === 'object' && a.metadata !== null
            ? (a.metadata as Record<string, string | number>)
            : {}
      }))
    : [
      {
        id: 'empty-activity',
        type: 'information' as const,
        title: 'Sin actividad registrada',
        description:
          'Comienza registrando visitas o ventas para verlas aquí.',
        timestamp: 'Ahora',
        priority: 'low' as const,
        metadata: {}
      }
    ]

  const handleGenerateReport = async (): Promise<void> => {
    setIsGeneratingReport(true)
    try {
      // Preparar datos del reporte con valores neutros
      const reportData: WeeklyReportData = {
        week: 'actual',
        dateRange: '-',
        generatedAt: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        kpis: {
          totalSales: stats.totalOperations,
          totalVisits: stats.visitsLast7Days,
          activeDistributors: stats.activeDistributors,
          newCandidates: stats.candidatesInPipeline,
          conversionRate:
            stats.candidatesInPipeline > 0
              ? (stats.activeDistributors / stats.candidatesInPipeline) * 100
              : 0,
          avgResponseTime: '2.4 días'
        },
        salesByBrand: stats.operationsByBrand.map((brand: BrandPerformance) => {
          const total = stats.totalOperations || 1
          return {
            brand: brand.label,
            operations: Number.isFinite(brand.value) ? Number(brand.value) : 0,
            percentage:
              Number.isFinite(brand.value) && total
                ? (Number(brand.value) / total) * 100
                : 0
          }
        }),
        topPerformers:
          Array.isArray(topMunicipalities) && topMunicipalities.length > 0
            ? topMunicipalities.map(
              (mun: { name: string; value: number }, index: number) => ({
                name: mun.name,
                operations: mun.value,
                rank: index + 1
              })
            )
            : [],
        highlights: [
          `${stats.totalOperations} operaciones registradas esta semana`,
          `${stats.activeDistributors} distribuidores activos en la red`,
          `${stats.candidatesInPipeline} candidatos en proceso de captación`,
          `Tasa de conversión del ${((stats.activeDistributors / (stats.candidatesInPipeline || 1)) * 100).toFixed(1)}%`
        ]
      }

      await generateWeeklyPDF(reportData)
      // PDF generado exitosamente
    } catch {
      // Error generando reporte
      alert('Error al generar el informe PDF. Intenta nuevamente.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main>
        <div className="px-6 py-6 max-w-[1800px] mx-auto">
          {/* Título y acciones */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Resumen de actividad comercial en Canarias
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3 items-center">
              <label
                htmlFor="week-select"
                className="text-sm text-gray-700 dark:text-gray-300 mr-2"
              >
                Semana:
              </label>
              <select
                id="week-select"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white text-gray-900"
                aria-label="Seleccionar semana"
              >
                {/* Mostrar las últimas 4 semanas incluyendo la actual */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() - 7 * i)
                  const year = d.getFullYear()
                  const tmp = new Date(d.getTime())
                  tmp.setHours(0, 0, 0, 0)
                  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
                  const week1 = new Date(tmp.getFullYear(), 0, 4)
                  const week =
                    1 +
                    Math.round(
                      ((tmp.getTime() - week1.getTime()) / 86400000 -
                        3 +
                        ((week1.getDay() + 6) % 7)) /
                      7
                    )
                  const iso = `${tmp.getFullYear()}-W${week.toString().padStart(2, '0')}`
                  return (
                    <option key={iso} value={iso}>
                      Semana {week} ({year})
                    </option>
                  )
                })}
              </select>
              <Button
                onClick={handleGenerateReport}
                loading={isGeneratingReport}
                className="inline-flex items-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Generar Reporte
              </Button>
            </div>
          </div>

          {/* KPIs Grid - Optimizado para usar más espacio horizontal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-8">
            {kpiData.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Gráficos de Distribución */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-1">
              <SectorDistributionChart />
            </div>
            <div className="lg:col-span-1">
              <FamilyMixChart />
            </div>
            <div className="lg:col-span-1">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <ChartBarIcon className="w-5 h-5 text-pastel-indigo" />
                </div>
                <SalesByBrandChart
                  data={salesByBrand}
                  title="Ventas por Marca"
                  height={320}
                />
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de líneas: Tendencias */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <FunnelIcon className="w-5 h-5 text-pastel-cyan" />
              </div>
              <SalesTrendsChart
                data={trendData}
                title="Tendencias Semanales"
                height={320}
                showVisits={true}
              />
              {trendData.length === 0 && (
                <div className="text-gray-500 text-sm mt-4">
                  No hay datos de tendencias disponibles.
                </div>
              )}
            </Card>

            {/* Gráfico circular: Top municipios */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <UserGroupIcon className="w-5 h-5 text-pastel-yellow" />
              </div>
              <TopPerformersChart
                data={topMunicipalities}
                title="Top Municipios"
                height={320}
                label="municipios"
              />
              {topMunicipalities.length === 0 && (
                <div className="text-gray-500 text-sm mt-4">
                  No hay datos de municipios disponibles.
                </div>
              )}
            </Card>
          </div>

          {/* Tercera fila: Calidad de Datos y Métricas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Nuevo: Panel de Calidad de Datos (§5 KPIs) */}
            <DataQualityPanel />

            {/* Métricas de calidad (mantener original) */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Métricas de Calidad
                </h3>
                <UserGroupIcon className="w-5 h-5 text-gray-400" />
              </div>
              <QualityMetrics />
            </Card>
          </div>

          {/* Actividad Reciente */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Actividad Reciente
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/calls')}
                  >
                    Ver Todo
                  </Button>
                </div>
                <ActivityFeed
                  activities={recentActivities}
                  enableFilters={true}
                />
              </Card>
            </div>

            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Acciones Rápidas
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-pastel-indigo dark:text-white border-pastel-indigo dark:border-white hover:bg-pastel-indigo/90 hover:text-white dark:hover:bg-white/10 dark:hover:text-white focus:bg-pastel-indigo/90 focus:text-white dark:focus:bg-white/10 dark:focus:text-white"
                    onClick={() => navigate('/distributors')}
                  >
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Ir a Distribuidores
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-pastel-indigo dark:text-white border-pastel-indigo dark:border-white hover:bg-pastel-indigo/90 hover:text-white dark:hover:bg-white/10 dark:hover:text-white focus:bg-pastel-indigo/90 focus:text-white dark:focus:bg-white/10 dark:focus:text-white"
                    onClick={() => navigate('/visits')}
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Ir a Visitas
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-pastel-indigo dark:text-white border-pastel-indigo dark:border-white hover:bg-pastel-indigo/90 hover:text-white dark:hover:bg-white/10 dark:hover:text-white focus:bg-pastel-indigo/90 focus:text-white dark:focus:bg-white/10 dark:focus:text-white"
                    onClick={() => navigate('/candidates')}
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Ir a Candidatos
                  </Button>
                </div>
              </Card>

              {/* Pipeline Summary */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Resumen de Pipeline
                </h3>
                <div className="space-y-3">
                  {stats.pipelineCounts?.map((stage: PipelineStageCount) => (
                    <div
                      key={stage.stageId}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 capitalize">
                        {stage.stageId}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {stage.count}
                      </span>
                    </div>
                  )) || (
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
                        No hay datos de pipeline disponibles
                      </p>
                    )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
