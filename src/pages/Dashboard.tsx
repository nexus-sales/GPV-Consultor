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
import type { BrandPerformance, PipelineStageCount } from '../lib/types'

// Importar componentes modulares
import KpiCard, { type ColorVariant } from '../components/KpiCard'
import Button from '../components/ui/Button'
import ActivityFeed from '../components/ui/ActivityFeed'
import type { Activity } from '../lib/types'
import SalesByBrandChart from '../components/charts/SalesByBrandChart'
import SalesTrendsChart from '../components/charts/SalesTrendsChart'
import TopPerformersChart from '../components/charts/TopPerformersChart'
import { FamilyMixChart } from '../components/charts/FamilyMixChart'
import { SectorDistributionChart } from '../components/charts/SectorDistributionChart'
import { DataQualityPanel } from '../components/DataQualityPanel'
import { useAppData } from '../lib/useAppData'
import { useWeeklyReport } from '../lib/hooks/useWeeklyReport'
import { useKPIs } from '../lib/hooks/useKPIs'
import {
  calculateDistributorsByProvince,
  calculateDistributorsByBrand
} from '../lib/data/kpiCalculations'
import type { WeeklyReportData } from '../components/reports/WeeklyPDFReport'
import CoverageMap from '../components/charts/CoverageMap'

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
  const { stats: rawStats, distributors, sales: rawSales, candidates } = useAppData()
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

  // Datos para gráficos — ventas si existen, si no distribuidores por marca
  const salesByBrand = useMemo<SalesByBrandItem[]>(() => {
    if (rawSales.length > 0) {
      return stats.operationsByBrand.map((brand: BrandPerformance) => ({
        name: brand.label,
        value: Number.isFinite(brand.value) ? Number(brand.value) : 0
      }))
    }
    return calculateDistributorsByBrand(distributors).map((item) => ({
      name: item.label,
      value: item.count
    }))
  }, [rawSales, stats.operationsByBrand, distributors])

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

  // Top provincias/municipios: distribuidores por provincia
  const topMunicipalities = useMemo(
    () => calculateDistributorsByProvince(distributors),
    [distributors]
  )

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
        <PageContainer
          size="full"
          className="py-8 px-4 sm:px-6 lg:px-8 space-y-8"
        >
          {/* Header Section - Simplified */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pastel-indigo to-pastel-cyan p-5 sm:p-6 shadow-lg shadow-pastel-indigo/15 transition-all duration-500">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-black/5 blur-2xl" />

            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                  <SparklesIcon className="w-3.5 h-3.5" />
                  <span>Panel de Control</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-0.5">
                    Hola, bienvenido
                  </h1>
                  <p className="text-sm text-white/80 max-w-xl">
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
                        <option
                          key={iso}
                          value={iso}
                          className="text-gray-900 bg-white font-medium"
                        >
                          Semana {week} ({year})
                        </option>
                      )
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {kpiData.map((kpi) => (
              <KpiCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Main Content Grid - More breathing room */}
          <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
            {/* Left/Center Column - Important Charts */}
            <div className="2xl:col-span-3 space-y-8">
              {/* Trend Chart - Hero Position */}
              <div className="rounded-3xl bg-white dark:bg-slate-800/80 p-8 border border-gray-200 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 min-h-[450px]">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      Tendencias de Venta y Actividad
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                      Rendimiento acumulado vs objetivos semanales
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      En tiempo real
                    </span>
                  </div>
                </div>
                <div className="w-full h-[350px]">
                  <SalesTrendsChart
                    data={trendData}
                    title=""
                    height={350}
                    showVisits={true}
                  />
                </div>
              </div>

              {/* Distributive Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="premium-card !p-0 overflow-hidden min-h-[350px]">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Sectores
                    </h3>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <FunnelIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <SectorDistributionChart />
                  </div>
                </div>

                <div className="premium-card !p-0 overflow-hidden min-h-[350px]">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Mix Marcas
                    </h3>
                    <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <SparklesIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-4">
                    <FamilyMixChart />
                  </div>
                </div>

                <div className="premium-card !p-0 overflow-hidden min-h-[350px]">
                  <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Ventas/Marca
                    </h3>
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <ChartBarIcon className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="p-6 h-[280px]">
                    <SalesByBrandChart
                      data={salesByBrand}
                      title=""
                      height={240}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - sidebar-like context actions */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <div className="rounded-2xl p-6 shadow-xl transition-all duration-300 hover:shadow-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-2">
                  Acciones Rápidas
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate('/distributors')}
                    className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-all border border-gray-200 dark:border-slate-600 group text-left"
                  >
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 mr-4 group-hover:bg-white/20 transition-colors">
                      <UsersIcon className="w-6 h-6 text-indigo-600 group-hover:text-white dark:text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-gray-900 group-hover:text-white dark:text-white">
                        Nuevo Distribuidor
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-white/90 dark:text-gray-400">
                        Registrar alta
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/visits')}
                    className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-all border border-gray-200 dark:border-slate-600 group text-left"
                  >
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 mr-4 group-hover:bg-white/20 transition-colors">
                      <CalendarIcon className="w-6 h-6 text-indigo-600 group-hover:text-white dark:text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-gray-900 group-hover:text-white dark:text-white">
                        Registrar Visita
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-white/90 dark:text-gray-400">
                        Planificar ruta
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/candidates')}
                    className="w-full flex items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-indigo-600 dark:hover:bg-indigo-600 transition-all border border-gray-200 dark:border-slate-600 group text-left"
                  >
                    <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 mr-4 group-hover:bg-white/20 transition-colors">
                      <SparklesIcon className="w-6 h-6 text-indigo-600 group-hover:text-white dark:text-indigo-400" />
                    </div>
                    <div>
                      <span className="font-bold text-sm block text-gray-900 group-hover:text-white dark:text-white">
                        Ver Pipeline
                      </span>
                      <span className="text-xs text-gray-500 group-hover:text-white/90 dark:text-gray-400">
                        Gestionar candidatos
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Activity Feed */}
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-gray-200 dark:border-slate-700 shadow-lg hover:translate-y-[-2px] transition-transform duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Actividad Reciente
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/calls')}
                  >
                    Ver todo
                  </Button>
                </div>
                <ActivityFeed
                  activities={recentActivities.slice(0, 5)}
                  title=""
                />
              </div>
            </div>
          </div>

          {/* Bottom Row - Statistics & Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Top Municipios Chart */}
            <div className="lg:col-span-4 premium-card !p-8 animate-float-subtle">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Top Provincias/Municipios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Distribución por volumen de operaciones
                  </p>
                </div>
                <UserGroupIcon className="w-6 h-6 text-slate-300" />
              </div>
              <div className="h-[320px]">
                <TopPerformersChart
                  data={topMunicipalities}
                  title=""
                  height={320}
                  label="municipios"
                />
              </div>
            </div>

            {/* Data Quality Panel */}
            <div className="lg:col-span-8 h-full">
              <DataQualityPanel />
            </div>
          </div>

          {/* New Section: Geographic Coverage Map */}
          <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="rounded-3xl bg-white dark:bg-slate-800/80 p-8 border border-gray-200 dark:border-slate-700/50 shadow-xl overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    Mapa de Cobertura Geográfica
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Visualización de PDVs activos, pendientes y candidatos en el Archipiélago Canario
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Activos
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pendientes
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      Candidatos
                    </span>
                  </div>
                </div>
              </div>
              <CoverageMap 
                distributors={distributors} 
                candidates={candidates} 
                height={500} 
              />
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  )
}

export default Dashboard
