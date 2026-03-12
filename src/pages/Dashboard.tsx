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
import { PageContainer } from '../components/layout/PageContainer'
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
        <PageContainer size="ultra" className="py-8 space-y-10">
          {/* Header Section - Simplified */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan p-8 sm:p-10 shadow-lg shadow-pastel-indigo/15 transition-all duration-500">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-black/5 blur-2xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Panel de Control</span>
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">
                    Hola, bienvenido
                  </h1>
                  <p className="text-base text-white/80 max-w-xl">
                    Resumen de tu actividad comercial en Canarias
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <select
                    id="week-select"
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white/15 hover:bg-white/25 border border-white/25 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/30 transition-all cursor-pointer min-w-[180px] backdrop-blur-sm"
                  >
                    {Array.from({ length: 4 }).map((_, i) => {
                      const d = new Date()
                      d.setDate(d.getDate() - 7 * i)
                      const year = d.getFullYear()
                      const tmp = new Date(d.getTime())
                      tmp.setHours(0, 0, 0, 0)
                      tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7))
                      const week1 = new Date(tmp.getFullYear(), 0, 4)
                      const week = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
                      const iso = `${tmp.getFullYear()}-W${week.toString().padStart(2, '0')}`
                      return <option key={iso} value={iso} className="text-gray-900 bg-white font-medium">Semana {week} ({year})</option>
                    })}
                  </select>
                  <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
                </div>

                <Button
                  onClick={handleGenerateReport}
                  loading={isGeneratingReport}
                  className="bg-white text-indigo-900 border-white/50 hover:bg-indigo-50 font-semibold shadow-md"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Informe
                </Button>
              </div>
            </div>
          </div>

          {/* KPIs Grid - Optimized spacing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
            {kpiData.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Main Content Grid - More breathing room */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
            {/* Left Column - Charts */}
            <div className="xl:col-span-2 space-y-10">
              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-stretch">
                <div className="hover:translate-y-[-2px] transition-transform duration-300">
                  <SectorDistributionChart />
                </div>
                <div className="hover:translate-y-[-2px] transition-transform duration-300">
                  <FamilyMixChart />
                </div>
                <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none hover:translate-y-[-2px] transition-transform duration-300 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Por Marca</h3>
                    <ChartBarIcon className="w-5 h-5 text-pastel-indigo" />
                  </div>
                  <SalesByBrandChart data={salesByBrand} title="" height={200} />
                </div>
              </div>

              {/* Trend Chart */}
              <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-6 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none hover:translate-y-[-2px] transition-transform duration-300">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Tendencias de Venta</h3>
                    <p className="text-sm text-gray-500">Comparativa de rendimiento semanal</p>
                  </div>
                  <FunnelIcon className="w-5 h-5 text-pastel-indigo" />
                </div>
                <SalesTrendsChart
                  data={trendData}
                  title=""
                  height={320}
                  showVisits={true}
                />
              </div>
            </div>

            {/* Right Column - Activity & Quick Actions */}
            <div className="space-y-6">
              {/* Quick Actions - Cleaner design */}
              <div className="rounded-2xl p-5 shadow-lg shadow-pastel-indigo/10 transition-all duration-300 hover:shadow-xl hover:shadow-pastel-indigo/15 hover:-translate-y-0.5 bg-gradient-to-br from-pastel-indigo/90 to-pastel-cyan/90 text-white">
                <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => navigate('/distributors')}
                    className="w-full flex items-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-white/20 mr-3.5 group-hover:scale-110 transition-transform">
                      <UsersIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium text-sm block">Nuevo Distribuidor</span>
                      <span className="text-xs text-white/70">Registrar alta</span>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/visits')}
                    className="w-full flex items-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-white/20 mr-3.5 group-hover:scale-110 transition-transform">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium text-sm block">Registrar Visita</span>
                      <span className="text-xs text-white/70">Planificar ruta</span>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/candidates')}
                    className="w-full flex items-center p-3.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all border border-white/10 group text-left"
                  >
                    <div className="p-2 rounded-lg bg-white/20 mr-3.5 group-hover:scale-110 transition-transform">
                      <SparklesIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-medium text-sm block">Ver Pipeline</span>
                      <span className="text-xs text-white/70">Gestionar candidatos</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="rounded-2xl bg-white dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none hover:translate-y-[-2px] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/calls')}>Ver todo</Button>
                </div>
                <ActivityFeed activities={recentActivities.slice(0, 5)} />
              </div>
            </div>
          </div>

          {/* Bottom Row - More spacing */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-800/50 p-5 border border-slate-100 dark:border-slate-700/50 shadow-lg shadow-slate-200/40 dark:shadow-none hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Top Municipios</h3>
                <UserGroupIcon className="w-5 h-5 text-gray-400" />
              </div>
              <TopPerformersChart
                data={topMunicipalities}
                title=""
                height={280}
                label="municipios"
              />
            </div>

            <div className="lg:col-span-2">
              <DataQualityPanel />
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  )
}

export default Dashboard
