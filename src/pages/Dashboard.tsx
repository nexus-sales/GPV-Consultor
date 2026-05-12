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
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  GlobeEuropeAfricaIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  BellAlertIcon
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
import { PageFallback } from '../router'
import {
  calculateDistributorsByProvince,
  calculateDistributorsByBrand
} from '../lib/data/kpiCalculations'
import type { WeeklyReportData } from '../components/reports/WeeklyPDFReport'
import type { Candidate, Distributor } from '../lib/types'
import { calculateHealthStatus } from '../lib/utils/healthUtils'
import { motion, AnimatePresence } from 'framer-motion'
import CoverageMap from '../components/charts/CoverageMap'
import { PipelineFunnelChart } from '../components/charts/PipelineFunnelChart'
import { formatRelativeTime } from '../lib/data/helpers'

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
  const [activeTrendsTab, setActiveTrendsTab] = useState<
    'actividad' | 'ventas'
  >('actividad')
  const navigate = useNavigate()

  const {
    stats: rawStats,
    distributors,
    candidates,
    visits,
    sales: rawSales,
    tasks,
    updateTask
  } = useAppData()

  const isError = false
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

  // --- LÓGICA CORE SMART HEALTH RADAR (Optimizado) ---
  const criticalInsightsBuffer = useRef<{
    distAlerts: number;
    candAlerts: number;
    total: number;
  } | null>(null);

  const criticalInsights = useMemo(() => {
    // Si tenemos datos masivos (>1000), podríamos querer diferir esto o usar un worker
    // Por ahora, aplicamos lógica simple de "stale-while-revalidate" manual si fuera necesario
    // Pero useMemo ya hace el trabajo si las dependencias no cambian.
    
    const distAlerts = distributors.filter((d: Distributor) => {
      if (d.status !== 'active') return false
      const health = calculateHealthStatus(d.id, visits, rawSales, tasks || [])
      return health.color === 'red'
    }).length

    const candAlerts = candidates.filter((c: Candidate) => {
      if (c.stage === 'rejected' || c.stage === 'approved') return false

      const lastUpdate = c.updatedAt
        ? new Date(c.updatedAt)
        : new Date(c.createdAt)

      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
      )

      const hasScheduledVisit = visits.some(
        (v) =>
          String(v.candidateId) === String(c.id) &&
          v.result === 'pendiente' &&
          new Date(v.date).getTime() >= new Date().setHours(0, 0, 0, 0)
      )

      const hasActiveTask = (tasks || []).some(
        (t) =>
          String(t.entityId) === String(c.id) &&
          t.entityType === 'candidate' &&
          t.status === 'pending'
      )

      return daysSinceUpdate > 7 && !hasScheduledVisit && !hasActiveTask
    }).length

    return { distAlerts, candAlerts, total: distAlerts + candAlerts }
  }, [distributors, visits, candidates, tasks, rawSales])

  // --- LÓGICA DE TAREAS PENDIENTES ---
  const pendingTasks = useMemo(() => {
    return (tasks || [])
      .filter((t) => t.status === 'pending')
      .sort((a, b) => {
        const priorityScore = { high: 3, medium: 2, low: 1 }
        const scoreA =
          priorityScore[a.priority as keyof typeof priorityScore] || 0
        const scoreB =
          priorityScore[b.priority as keyof typeof priorityScore] || 0
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  }, [tasks])

  const handleToggleTask = async (id: string | number) => {
    await updateTask(id, { status: 'completed' })
  }

  // --- SECCIÓN HOY ---
  const todayVisits = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    return visits
      .filter((v) => v.date?.slice(0, 10) === todayStr)
      .sort((a, b) =>
        (a.scheduledTime || '').localeCompare(b.scheduledTime || '')
      )
  }, [visits])

  const urgentTasks = useMemo(() => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return (tasks || [])
      .filter((t) => t.status !== 'completed' && new Date(t.dueDate) <= today)
      .sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      )
      .slice(0, 5)
  }, [tasks])

  const staleCandidateList = useMemo(() => {
    return candidates
      .filter((c) => {
        if (c.stage === 'rejected' || c.stage === 'approved') return false
        const lastUpdate = c.updatedAt
          ? new Date(c.updatedAt)
          : new Date(c.createdAt)
        const days = Math.floor(
          (Date.now() - lastUpdate.getTime()) / 86_400_000
        )
        const hasVisit = visits.some(
          (v) =>
            String(v.candidateId) === String(c.id) &&
            v.result === 'pendiente' &&
            new Date(v.date) >= new Date()
        )
        const hasTask = (tasks || []).some(
          (t) =>
            String(t.entityId) === String(c.id) &&
            t.entityType === 'candidate' &&
            t.status === 'pending'
        )
        return days > 7 && !hasVisit && !hasTask
      })
      .sort((a, b) => {
        const dA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt)
        const dB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt)
        return dA.getTime() - dB.getTime()
      })
      .slice(0, 4)
  }, [candidates, visits, tasks])
  // ------------------

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

  // Actividades de la pestaña "Actividad": notesHistory de candidatos + distribuidores + tareas + visitas + ventas
  const activityTabActivities: Activity[] = useMemo(() => {
    const items: Array<{ dateKey: string; activity: Activity }> = []

    const categoryToType = (cat?: string): Activity['type'] => {
      if (cat === 'llamada') return 'call'
      if (cat === 'visita') return 'visit'
      if (cat === 'email') return 'information'
      return 'task'
    }

    const outcomeToSeverity = (outcome?: string): Activity['priority'] => {
      if (outcome === 'negative') return 'high'
      if (outcome === 'positive') return 'low'
      return 'medium'
    }

    // 1. Candidatos (Notas)
    candidates.forEach((candidate) => {
      if (!candidate.notesHistory?.length) return
      candidate.notesHistory.forEach((note) => {
        items.push({
          dateKey: note.timestamp,
          activity: {
            id: `note-c-${note.id}`,
            type: categoryToType(note.category),
            title: `${candidate.name}: ${note.title || (note.category === 'llamada' ? 'Llamada' : 'Nota')}`,
            description: note.content || '',
            timestamp: formatRelativeTime(note.timestamp),
            priority: outcomeToSeverity(note.outcome),
            metadata: {
              Entidad: 'Candidato',
              ...(note.status ? { Estado: note.status } : {})
            }
          }
        })
      })
    })

    // 2. Distribuidores (Notas)
    distributors.forEach((distributor) => {
      if (!distributor.notesHistory?.length) return
      distributor.notesHistory.forEach((note) => {
        items.push({
          dateKey: note.timestamp,
          activity: {
            id: `note-d-${note.id}`,
            type: categoryToType(note.category),
            title: `${distributor.name}: ${note.title || (note.category === 'llamada' ? 'Llamada' : 'Nota')}`,
            description: note.content || '',
            timestamp: formatRelativeTime(note.timestamp),
            priority: outcomeToSeverity(note.outcome),
            metadata: {
              Entidad: 'Distribuidor',
              ...(note.status ? { Estado: note.status } : {})
            }
          }
        })
      })
    })

    // 3. Tareas
    tasks.forEach((task) => {
      items.push({
        dateKey: task.updatedAt || task.createdAt,
        activity: {
          id: `task-${task.id}`,
          type: 'task',
          title: `Tarea: ${task.title}`,
          description: task.description || '',
          timestamp: formatRelativeTime(task.updatedAt || task.createdAt),
          priority: task.priority as 'low' | 'medium' | 'high',
          metadata: { Estado: task.status }
        }
      })
    })

    // 4. Visitas (Directas del módulo visitas)
    visits.forEach((visit) => {
      const dist = distributors.find((d) => d.id === visit.distributorId)
      const cand = candidates.find((c) => c.id === visit.candidateId)
      const name = dist?.name || cand?.name || 'Contacto'
      items.push({
        dateKey: visit.date,
        activity: {
          id: `visit-${visit.id}`,
          type: 'visit',
          title: `Visita ${visit.type}: ${name}`,
          description: visit.summary || visit.objective || '',
          timestamp: formatRelativeTime(visit.date),
          priority: visit.result === 'cancelada' ? 'high' : 'medium',
          metadata: { Resultado: visit.result || 'Pendiente' }
        }
      })
    })

    // 5. Ventas
    rawSales.forEach((sale) => {
      items.push({
        dateKey: sale.date,
        activity: {
          id: `sale-${sale.id}`,
          type: 'sale',
          title: `Venta: ${sale.nombreCliente || 'Cliente'}`,
          description: `${sale.brand || 'Marca'} • ${sale.operations || 1} op.`,
          timestamp: formatRelativeTime(sale.date),
          priority: 'low',
          metadata: { Estado: sale.status }
        }
      })
    })

    return items
      .sort(
        (a, b) => new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime()
      )
      .map((i) => i.activity)
      .slice(0, 50)
  }, [candidates, distributors, tasks, visits, rawSales])

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

  const isLoading = false

  if (isLoading) {
    return <PageFallback />
  }

  if (isError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-[#0B0F1A]">
        <div className="h-16 w-16 text-rose-500">
          <ExclamationTriangleIcon />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Error de Sincronización
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm">
            No pudimos conectar con los servicios de Nexus Hub. Por favor,
            verifica tu conexión o el estado de la base de datos.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-indigo-600 px-8 py-3 text-white font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
        >
          Reintentar Conexión
        </button>
      </div>
    )
  }

  const performancePulse = {
    score: Math.round(
      ((distributors.length - criticalInsights.distAlerts) /
        (distributors.length || 1)) *
        100
    ),
    status: 'Óptimo',
    message: 'La red mantiene una salud operativa estable.'
  }

  if (performancePulse.score < 80) {
    performancePulse.status = 'Atención'
    performancePulse.message =
      'Se detectan áreas de mejora en la frecuencia de visitas.'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F1A] selection:bg-indigo-500/30">
      <main className="relative overflow-hidden">
        {/* Decorative background glass elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <PageContainer
          size="full"
          className="py-8 px-4 sm:px-6 lg:px-8 space-y-10 relative z-10"
        >
          {/* Executive Pulse Radar */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate('/distributors')}
                className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[28px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-all"
              >
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FireIcon className="h-24 w-24 -mr-8 -mt-8" />
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/30">
                  <FireIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-500 mb-1">
                    Alertas Críticas
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {criticalInsights.distAlerts}{' '}
                    <span className="text-slate-400 font-medium">
                      Distribuidores
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
                    Acción urgente requerida
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                onClick={() => navigate('/candidates')}
                className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[28px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none cursor-pointer hover:scale-[1.02] transition-all"
              >
                <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ExclamationTriangleIcon className="h-24 w-24 -mr-8 -mt-8" />
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30">
                  <ExclamationTriangleIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-600 mb-1">
                    Pipeline Estancado
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {criticalInsights.candAlerts}{' '}
                    <span className="text-slate-400 font-medium">
                      Candidatos
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
                    Revisar etapas de captación
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden flex items-center gap-4 p-5 rounded-[28px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all"
              >
                <div className="absolute top-0 right-0 p-1 opacity-10">
                  <ArrowTrendingUpIcon className="h-24 w-24 -mr-8 -mt-8" />
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/30">
                  <ArrowTrendingUpIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 mb-1">
                    Salud Operativa
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {performancePulse.score}%{' '}
                    <span className="text-slate-400 font-medium text-sm">
                      Nivel de Red
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium italic">
                    Cobertura comercial real
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative p-5 rounded-[28px] bg-gradient-to-br from-indigo-600 to-indigo-900 text-white shadow-2xl shadow-indigo-500/20 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full -mr-16 -mt-16" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <SparklesIcon className="w-5 h-5 text-indigo-200" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-100">
                    Smart Insights
                  </h4>
                </div>
                <p className="text-sm font-bold leading-relaxed">
                  {performancePulse.message}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-md">
                    AI POWERED
                  </span>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-indigo-600 bg-indigo-400 flex items-center justify-center text-[8px] font-bold"
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── SECCIÓN HOY ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                  Tu día de hoy
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Visitas de hoy */}
              <div
                className="rounded-[20px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none p-5 cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => navigate('/visits')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-cyan-500" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-cyan-600 dark:text-cyan-400">
                      Visitas Hoy
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {todayVisits.length}
                  </span>
                </div>
                {todayVisits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Sin visitas programadas para hoy
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {todayVisits.map((v) => (
                      <li
                        key={String(v.id)}
                        className="flex items-center gap-2"
                      >
                        <span className="text-[10px] font-bold text-slate-400 w-10 shrink-0">
                          {v.scheduledTime || '—'}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {v.objective || v.type}
                        </span>
                        <span
                          className={`ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            v.statusOperative === 'finalizada'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          }`}
                        >
                          {v.statusOperative === 'finalizada'
                            ? 'Hecha'
                            : 'Pendiente'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tareas urgentes / vencidas */}
              <div
                className="rounded-[20px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none p-5 cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => navigate('/tasks')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentListIcon className="h-4 w-4 text-rose-500" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-rose-600 dark:text-rose-400">
                      Tareas Urgentes
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {urgentTasks.length}
                  </span>
                </div>
                {urgentTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Sin tareas pendientes para hoy
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {urgentTasks.map((t) => {
                      const isOverdue =
                        new Date(t.dueDate) <
                        new Date(new Date().setHours(0, 0, 0, 0))
                      return (
                        <li
                          key={String(t.id)}
                          className="flex items-center gap-2"
                        >
                          <span
                            className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                              t.priority === 'high'
                                ? 'bg-rose-500'
                                : t.priority === 'medium'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                            }`}
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">
                            {t.title}
                          </span>
                          {isOverdue && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                              Vencida
                            </span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Candidatos sin contacto */}
              <div
                className="rounded-[20px] bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white dark:border-slate-800 shadow-lg shadow-slate-200/40 dark:shadow-none p-5 cursor-pointer hover:scale-[1.01] transition-all"
                onClick={() => navigate('/candidates')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BellAlertIcon className="h-4 w-4 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-[0.15em] text-amber-600 dark:text-amber-400">
                      Sin Contacto
                    </span>
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {staleCandidateList.length}
                  </span>
                </div>
                {staleCandidateList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Todos los candidatos están al día
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {staleCandidateList.map((c) => {
                      const lastUpdate = c.updatedAt
                        ? new Date(c.updatedAt)
                        : new Date(c.createdAt)
                      const days = Math.floor(
                        (Date.now() - lastUpdate.getTime()) / 86_400_000
                      )
                      return (
                        <li
                          key={String(c.id)}
                          className="flex items-center gap-2"
                        >
                          <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">
                            {c.name}
                          </span>
                          <span className="shrink-0 text-[10px] font-bold text-slate-400">
                            {days}d
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              {/* Funnel de conversión */}
              <PipelineFunnelChart candidates={candidates} />
            </div>
          </section>
          {/* ────────────────────────────────────────────────────── */}

          {/* Header Section - Premium Glassmorphism */}
          <div className="relative overflow-hidden rounded-[32px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white dark:border-slate-800 p-8 shadow-2xl shadow-slate-200/30">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="hidden sm:flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700">
                  <GlobeEuropeAfricaIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Nexus Commercial{' '}
                    <span className="text-indigo-600">Hub</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                    Sincronización total de tu red de distribución en Canarias.
                    Gestión de activos, leads y pipeline en tiempo real.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                  <div className="relative flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" />
                    <select
                      id="week-select"
                      value={selectedWeek}
                      onChange={(e) => setSelectedWeek(e.target.value)}
                      className="bg-transparent text-sm font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer min-w-[140px]"
                    >
                      {Array.from({ length: 4 }).map((_, i) => {
                        const d = new Date()
                        d.setDate(d.getDate() - 7 * i)
                        const year = d.getFullYear()
                        const tmp = new Date(d.getTime())
                        tmp.setHours(0, 0, 0, 0)
                        tmp.setDate(
                          tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7)
                        )
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
                            className="text-slate-900 bg-white"
                          >
                            Semana {week} — {year}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  loading={isGeneratingReport}
                  className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-transform"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-3" />
                  Generar Informe
                </Button>
              </div>
            </div>
          </div>

          {/* KPIs Grid - Dynamic Visuals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <AnimatePresence mode="popLayout">
              {kpiData.map((kpi, idx) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <KpiCard {...kpi} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Main Content Grid - More breathing room */}
          <div className="grid grid-cols-1 2xl:grid-cols-4 gap-4 sm:gap-8">
            {/* Left/Center Column - Important Charts */}
            <div className="2xl:col-span-3 space-y-8">
              {/* Trend Chart - Hero Position */}
              <div className="rounded-xl bg-white dark:bg-slate-800 p-4 sm:p-8 border border-gray-200 dark:border-slate-700/50 shadow-sm min-h-[280px] sm:min-h-[450px]">
                <div className="flex items-center justify-between mb-6">
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

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg mb-6 w-fit">
                  <button
                    onClick={() => setActiveTrendsTab('actividad')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                      activeTrendsTab === 'actividad'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Actividad Reciente
                  </button>
                  <button
                    onClick={() => setActiveTrendsTab('ventas')}
                    className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                      activeTrendsTab === 'ventas'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Tendencias de Ventas
                  </button>
                </div>

                {activeTrendsTab === 'ventas' ? (
                  <div id="weekly-trend-chart" className="w-full h-[350px]">
                    <SalesTrendsChart
                      data={trendData}
                      title=""
                      height={350}
                      showVisits={true}
                    />
                  </div>
                ) : (
                  <div className="h-[350px] overflow-y-auto pr-1">
                    {activityTabActivities.length > 0 ? (
                      <ActivityFeed
                        activities={activityTabActivities}
                        title=""
                        showAll={true}
                        enableFilters={true}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <ClockIcon className="h-10 w-10 mb-3" />
                        <p className="text-sm font-medium">
                          Sin actividad registrada
                        </p>
                        <p className="text-xs mt-1">
                          Las llamadas, visitas y tareas aparecerán aquí
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Distributive Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="premium-card !p-0 overflow-hidden min-h-[220px] sm:min-h-[350px]">
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

                <div className="premium-card !p-0 overflow-hidden min-h-[220px] sm:min-h-[350px]">
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

                <div className="premium-card !p-0 overflow-hidden min-h-[220px] sm:min-h-[350px]">
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

              {/* Tareas Pendientes Card */}
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
                      <CheckCircleIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white font-premium">
                      Tareas Pendientes
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full uppercase tracking-wider">
                    {pendingTasks.length} activas
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.slice(0, 4).map((task) => {
                      const entityIdStr = String(task.entityId)
                      const entity =
                        task.entityType === 'distributor'
                          ? (distributors || []).find(
                              (d) => String(d.id) === entityIdStr
                            )
                          : (candidates || []).find(
                              (c) => String(c.id) === entityIdStr
                            )

                      return (
                        <div
                          key={task.id}
                          className="group relative flex items-start gap-3 p-3 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-all"
                        >
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            className="mt-0.5 flex-shrink-0 h-5 w-5 rounded-md border-2 border-gray-200 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center text-transparent hover:text-indigo-500"
                            title="Marcar como completada"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {task.title}
                              </p>
                              <span
                                className={`flex-shrink-0 w-2 h-2 rounded-full ${
                                  task.priority === 'high'
                                    ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                    : task.priority === 'medium'
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                              />
                            </div>

                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                              {task.description ||
                                (entity?.name
                                  ? `Vinc. a: ${entity.name}`
                                  : 'Sin descripción')}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString(
                                  'es-ES',
                                  { day: '2-digit', month: 'short' }
                                )}
                              </span>
                              {entity && (
                                <button
                                  onClick={() =>
                                    navigate(
                                      task.entityType === 'distributor'
                                        ? `/distributors/${entity.id}`
                                        : `/candidates/${entity.id}`
                                    )
                                  }
                                  className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 transition-colors"
                                >
                                  {entity.name.split(' ').slice(0, 2).join(' ')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 mb-3">
                        <CheckCircleIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ¡Todo al día!
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Excelente trabajo hoy.
                      </p>
                    </div>
                  )}

                  {pendingTasks.length > 4 && (
                    <button
                      onClick={() => navigate('/tasks')}
                      className="w-full mt-2 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border-t border-gray-50 dark:border-slate-700/50"
                    >
                      Ver todas las tareas ({pendingTasks.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Activity Feed Section */}
              <div className="rounded-2xl bg-white dark:bg-slate-800 p-5 border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-amber-500" />
                    Actividad Reciente
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs font-bold text-gray-400 hover:text-indigo-600"
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
            {/* Top Poblaciones Chart */}
            <div className="lg:col-span-4 premium-card !p-8 animate-float-subtle">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Top Provincias/Poblaciones
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
                  label="poblaciones"
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
