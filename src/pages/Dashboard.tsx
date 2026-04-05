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
  CheckCircleIcon,
  ExclamationTriangleIcon
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
  const {
    stats: rawStats,
    distributors,
    visits,
    sales: rawSales,
    candidates
  } = useAppData()
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

  // --- LÓGICA CORE SMART HEALTH RADAR ---
  const criticalInsights = useMemo(() => {
    // Calculamos salud de distribuidores
    const distAlerts = distributors.filter((d) => {
      const distVisits = visits
        .filter((v) => String(v.distributorId) === String(d.id))
        .sort((a, b) => b.date.localeCompare(a.date))
      const lastVisit = distVisits[0]
      const days = lastVisit
        ? Math.floor(
            (new Date().getTime() - new Date(lastVisit.date).getTime()) /
              (1000 * 3600 * 24)
          )
        : 999
      return days > 21
    }).length

    // Calculamos candidatos estancados
    const candAlerts = candidates.filter((c) => {
      if (c.stage === 'rejected' || c.stage === 'approved') return false
      const lastUpdate = c.updatedAt
        ? new Date(c.updatedAt)
        : new Date(c.createdAt)
      const days = Math.floor(
        (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
      )
      return days > 7
    }).length

    return { distAlerts, candAlerts, total: distAlerts + candAlerts }
  }, [distributors, visits, candidates])
  // --------------------------------------

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
          conversionRate: kpis.conversionRate.rate,
          avgResponseTime: '2.4 días',
          networkHealth: Number(
            (
              ((distributors.length - criticalInsights.distAlerts) /
                (distributors.length || 1)) *
              100
            ).toFixed(0)
          ),
          criticalDistributors: criticalInsights.distAlerts,
          stuckCandidates: criticalInsights.candAlerts
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

      await generateWeeklyPDF(reportData, {
        salesByBrand: 'sales-by-brand-chart',
        trends: 'weekly-trend-chart'
      })
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
          {/* Radar de Intervención Ejecutiva */}
          {criticalInsights.total > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {criticalInsights.distAlerts > 0 && (
                <div
                  onClick={() => navigate('/distributors')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-red-50 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30 cursor-pointer hover:shadow-md transition-all animate-pulse-slow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white shadow-lg shadow-red-500/30">
                    <FireIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                      Riesgo de Abandono
                    </p>
                    <p className="text-sm font-bold text-red-900 dark:text-red-100">
                      {criticalInsights.distAlerts} Distribuidores en zona
                      crítica
                    </p>
                  </div>
                </div>
              )}
              {criticalInsights.candAlerts > 0 && (
                <div
                  onClick={() => navigate('/candidates')}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 dark:text-orange-400">
                      Talento Estancado
                    </p>
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                      {criticalInsights.candAlerts} Candidatos sin actividad
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Estado de la Red
                  </p>
                  <p className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                    {(
                      ((distributors.length - criticalInsights.distAlerts) /
                        distributors.length) *
                      100
                    ).toFixed(0)}
                    % Salud Operativa
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Header Section - Simplified */}
          <div className="rounded-xl bg-indigo-600 p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold">
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
                    className="appearance-none pl-4 pr-10 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/40 transition-all cursor-pointer min-w-[180px]"
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
                  variant="ghost"
                  onClick={handleGenerateReport}
                  loading={isGeneratingReport}
                  className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold shadow-md"
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
              <div className="rounded-xl bg-white dark:bg-slate-800 p-8 border border-gray-200 dark:border-slate-700/50 shadow-sm min-h-[450px]">
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
                <div id="weekly-trend-chart" className="w-full h-[350px]">
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
                  <div id="sales-by-brand-chart" className="p-6 h-[280px]">
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
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
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
            <div className="rounded-xl bg-white dark:bg-slate-800 p-8 border border-gray-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    Mapa de Cobertura Geográfica
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
                    Visualización de PDVs activos, pendientes y candidatos en el
                    Archipiélago Canario
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
