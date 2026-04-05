import React, { useCallback, useMemo, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MinusIcon,
  UserGroupIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts'
import { WeeklyReportData } from '../components/reports/WeeklyPDFReport'
import { useWeeklyReport } from '../lib/hooks/useWeeklyReport'
import { useAuth } from '../lib/AuthContext'
import { PageContainer } from '../components/layout/PageContainer'
import { KpiCard } from '../components/KpiCard'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../lib/useAppData'
import { getWeeklyBounds, inWeek } from '../lib/utils/kpis'
import type {
  Distributor,
  Candidate,
  Visit,
  Sale,
  LookupOption,
  AppContextType
} from '../lib/types'

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface TrendResult {
  dir: 'up' | 'down' | 'neutral'
  pct: number
}

interface DistributorIndex {
  [key: string]: Distributor
}
interface CandidateIndex {
  [key: string]: Candidate
}

interface SummaryMetric {
  id: string
  label: string
  value: string
  detail: string
  hint: string
  tone: string
}

interface BrandSales {
  brandId: string
  label: string
  operations: number
}

interface TopContact {
  id: string
  name: string
  city: string
  type: 'distributor' | 'candidate'
  visits: number
  operations: number
}

interface TimelineItem {
  id: string
  type: 'visit' | 'sale'
  date: string
  title: string
  subtitle: string
  status?: string
  meta?: string
  duration?: string | null
}

interface TrendWeek {
  week: string
  visitas: number
  operaciones: number
}

interface CsvExportData {
  weekLabel: string
  summaryMetrics: SummaryMetric[]
  visits: Visit[]
  sales: Sale[]
  distributorsIndex: DistributorIndex
  candidatesIndex: CandidateIndex
  brandLookup: Record<string, LookupOption>
}

interface KpiCardProps {
  title: string
  value: string
  trend?: TrendResult
  icon: React.ComponentType<{ className?: string }>
  detail?: string
  highlight?: boolean
}

interface SectionCardProps {
  title: string
  children: React.ReactNode
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899'
]

const DATE_FORMAT = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})
const DAY_MONTH_FORMAT = new Intl.DateTimeFormat('es-ES', {
  weekday: 'short',
  day: '2-digit',
  month: 'short'
})

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  auditoria: 'Auditoría'
}

const visitResultLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  realizado: 'Realizado',
  completada: 'Completada',
  cancelado: 'Cancelado',
  cancelada: 'Cancelada'
}

const visitResultStyles: Record<string, string> = {
  pendiente:
    'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  realizado:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  completada:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  cancelado: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
  cancelada: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300'
}

const familyLabels: Record<string, string> = {
  convergente: 'Convergente',
  movil: 'Línea móvil',
  solo_fibra: 'Solo fibra',
  empresa_autonomo: 'Empresa / Autónomo',
  microempresa: 'Microempresa'
}

const stageColors: Record<string, string> = {
  new: '#6366f1',
  contacted: '#f59e0b',
  evaluation: '#06b6d4',
  approved: '#10b981',
  rejected: '#ef4444'
}

const stageLabels: Record<string, string> = {
  new: 'Nuevos',
  contacted: 'Contactados',
  evaluation: 'En evaluación',
  approved: 'Aprobados',
  rejected: 'Rechazados'
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const sanitizeFilename = (v: string) =>
  v
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const formatDate = (
  value?: string | Date,
  formatter: Intl.DateTimeFormat = DATE_FORMAT
): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return formatter.format(date)
}

const computeTrend = (current: number, previous: number): TrendResult => {
  if (previous === 0 && current === 0) return { dir: 'neutral', pct: 0 }
  if (previous === 0) return { dir: 'up', pct: 100 }
  const pct = ((current - previous) / previous) * 100
  return {
    dir: pct > 1 ? 'up' : pct < -1 ? 'down' : 'neutral',
    pct: Math.abs(Math.round(pct))
  }
}

const downloadBlob = (
  content: string,
  filename: string,
  type: string
): void => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const escapeCsvValue = (value: unknown): string => {
  if (value == null) return ''
  const s = String(value)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const buildCsv = ({
  weekLabel,
  summaryMetrics,
  visits,
  sales,
  distributorsIndex,
  candidatesIndex,
  brandLookup
}: CsvExportData): string => {
  const resolveContact = (visit: Visit) => {
    if (visit.distributorId)
      return (
        distributorsIndex[String(visit.distributorId)]?.name ?? 'No asignado'
      )
    if (visit.candidateId)
      return candidatesIndex[String(visit.candidateId)]?.name ?? 'No asignado'
    return 'No asignado'
  }

  const lines: string[] = []
  lines.push(`Semana;${weekLabel}`)
  lines.push('')
  lines.push('Resumen;Valor;Detalle')
  summaryMetrics.forEach((m) =>
    lines.push(
      `${escapeCsvValue(m.label)};${escapeCsvValue(m.value)};${escapeCsvValue(m.detail)}`
    )
  )

  lines.push('')
  lines.push(
    'Visitas;Fecha;Contacto;Tipo;Resultado;Duración (min);Objetivo;Próximos pasos'
  )
  if (visits.length === 0) {
    lines.push('Visitas;Sin datos;;;;;;')
  } else {
    visits.forEach((visit) =>
      lines.push(
        [
          'Visita',
          formatDate(visit.date),
          resolveContact(visit),
          visitTypeLabels[visit.type] ?? visit.type,
          visit.result ?? '—',
          visit.durationMinutes ?? '',
          visit.objective ?? '',
          visit.nextSteps ?? ''
        ]
          .map(escapeCsvValue)
          .join(';')
      )
    )
  }

  lines.push('')
  lines.push('Ventas;Fecha;Distribuidor;Marca;Familia;Operaciones;Notas')
  if (sales.length === 0) {
    lines.push('Ventas;Sin datos;;;;;')
  } else {
    sales.forEach((sale) => {
      const dist =
        distributorsIndex[
          sale.distributorId != null ? String(sale.distributorId) : ''
        ]
      const brandId = String(sale.brand ?? '')
      const familyId = String(sale.family ?? '')
      lines.push(
        [
          'Venta',
          formatDate(sale.date),
          dist?.name ?? 'No asignado',
          brandLookup[brandId]?.label ?? brandId,
          (familyId ? familyLabels[familyId] : undefined) ?? familyId,
          sale.operations ?? '',
          sale.notes ?? ''
        ]
          .map(escapeCsvValue)
          .join(';')
      )
    })
  }
  return lines.join('\n')
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  trend,
  icon: Icon,
  detail,
  highlight = false
}) => (
  <article
    className={`relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800 p-5 shadow-sm ${
      highlight
        ? 'border-amber-200 dark:border-amber-500/30'
        : 'border-gray-200 dark:border-gray-700'
    }`}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 truncate">
          {title}
        </p>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {value}
        </p>
        {detail && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate">
            {detail}
          </p>
        )}
      </div>
      <span className="shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 p-2.5 text-indigo-600 dark:text-indigo-300">
        <Icon className="h-5 w-5" />
      </span>
    </div>
    {trend && (
      <div className="mt-3 flex items-center gap-1.5">
        {trend.dir === 'up' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <ArrowTrendingUpIcon className="h-3 w-3" />+{trend.pct}%
          </span>
        ) : trend.dir === 'down' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <ArrowTrendingDownIcon className="h-3 w-3" />-{trend.pct}%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <MinusIcon className="h-3 w-3" />
            Sin cambio
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          vs sem. anterior
        </span>
      </div>
    )}
  </article>
)

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  description,
  icon: Icon
}) => (
  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
    <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
      {Icon && (
        <span className="rounded-lg bg-indigo-50 dark:bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-300">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
    <div className="p-6">{children}</div>
  </section>
)

// ─── Main component ───────────────────────────────────────────────────────────

const ReportsWeekly: React.FC = () => {
  const {
    visits = [],
    sales = [],
    distributors = [],
    candidates = [],
    pipelineStages = [],
    lookups = { brands: {} }
  } = useAppData() as AppContextType

  const { currentUser: _currentUser } = useAuth()
  const { generateWeeklyPDF } = useWeeklyReport()

  const [weekOffset, setWeekOffset] = useState<number>(0)

  const referenceDate = useMemo(
    () => addDays(new Date(), weekOffset * 7),
    [weekOffset]
  )
  const weekBounds = useMemo(
    () => getWeeklyBounds(referenceDate),
    [referenceDate]
  )
  const prevWeekBounds = useMemo(
    () => getWeeklyBounds(addDays(referenceDate, -7)),
    [referenceDate]
  )

  // Indexes
  const distributorsIndex = useMemo<DistributorIndex>(
    () =>
      distributors.reduce<DistributorIndex>((acc, d) => {
        acc[d.id] = d
        return acc
      }, {}),
    [distributors]
  )
  const candidatesIndex = useMemo<CandidateIndex>(
    () =>
      candidates.reduce<CandidateIndex>((acc, c) => {
        acc[c.id] = c
        return acc
      }, {}),
    [candidates]
  )

  const resolveVisitContact = useCallback(
    (visit: Visit): { name: string; city: string } => {
      if (visit.distributorId) {
        const d = distributorsIndex[String(visit.distributorId)]
        return { name: d?.name ?? 'No asignado', city: d?.city ?? '' }
      }
      if (visit.candidateId) {
        const c = candidatesIndex[String(visit.candidateId)]
        return { name: c?.name ?? 'No asignado', city: '' }
      }
      return { name: 'No asignado', city: '' }
    },
    [distributorsIndex, candidatesIndex]
  )

  const weekLabel = useMemo(() => {
    const end = addDays(new Date(weekBounds.end), -1)
    return `${formatDate(weekBounds.start, DAY_MONTH_FORMAT)} – ${formatDate(end, DAY_MONTH_FORMAT)}`
  }, [weekBounds])

  const weekIdForFile = useMemo(() => sanitizeFilename(weekLabel), [weekLabel])

  // Filtered data
  const weeklyVisits = useMemo(
    () => visits.filter((v) => inWeek(v.date, weekBounds)),
    [visits, weekBounds]
  )
  const weeklySales = useMemo(
    () => sales.filter((s) => inWeek(s.date, weekBounds)),
    [sales, weekBounds]
  )
  const prevWeekVisits = useMemo(
    () => visits.filter((v) => inWeek(v.date, prevWeekBounds)),
    [visits, prevWeekBounds]
  )
  const prevWeekSales = useMemo(
    () => sales.filter((s) => inWeek(s.date, prevWeekBounds)),
    [sales, prevWeekBounds]
  )

  const weeklyNewDistributors = useMemo(
    () =>
      distributors.filter(
        (d) => d.createdAt && inWeek(d.createdAt, weekBounds)
      ),
    [distributors, weekBounds]
  )
  const weeklyNewCandidates = useMemo(
    () =>
      candidates.filter((c) => c.createdAt && inWeek(c.createdAt, weekBounds)),
    [candidates, weekBounds]
  )

  const pendingFollowUps = useMemo(
    () => weeklyVisits.filter((v) => v.result === 'pendiente'),
    [weeklyVisits]
  )

  // KPIs with trends
  const kpis = useMemo(() => {
    const curV = weeklyVisits.length
    const prevV = prevWeekVisits.length
    const curOps = weeklySales.reduce((a, s) => a + (s.operations || 0), 0)
    const prevOps = prevWeekSales.reduce((a, s) => a + (s.operations || 0), 0)
    const curSuccess = weeklyVisits.filter((v) =>
      ['realizado', 'completada'].includes(String(v.result))
    ).length
    const prevSuccess = prevWeekVisits.filter((v) =>
      ['realizado', 'completada'].includes(String(v.result))
    ).length
    const curConv = curV > 0 ? Math.round((curSuccess / curV) * 100) : 0
    const prevConv = prevV > 0 ? Math.round((prevSuccess / prevV) * 100) : 0
    const curDur =
      curV > 0
        ? Math.round(
            weeklyVisits.reduce(
              (a, v) => a + (Number(v.durationMinutes) || 0),
              0
            ) / curV
          )
        : 0
    const prevDur =
      prevV > 0
        ? Math.round(
            prevWeekVisits.reduce(
              (a, v) => a + (Number(v.durationMinutes) || 0),
              0
            ) / prevV
          )
        : 0
    const curActive = new Set(
      [
        ...weeklyVisits.map((v) =>
          v.distributorId
            ? `d:${v.distributorId}`
            : v.candidateId
              ? `c:${v.candidateId}`
              : null
        ),
        ...weeklySales.map((s) =>
          s.distributorId ? `d:${s.distributorId}` : null
        )
      ].filter(Boolean)
    ).size
    const prevActive = new Set(
      [
        ...prevWeekVisits.map((v) =>
          v.distributorId
            ? `d:${v.distributorId}`
            : v.candidateId
              ? `c:${v.candidateId}`
              : null
        ),
        ...prevWeekSales.map((s) =>
          s.distributorId ? `d:${s.distributorId}` : null
        )
      ].filter(Boolean)
    ).size

    return {
      visits: {
        value: curV,
        formatted: String(curV),
        trend: computeTrend(curV, prevV),
        detail: `${pendingFollowUps.length} pendiente${pendingFollowUps.length !== 1 ? 's' : ''} de seguimiento`
      },
      operations: {
        value: curOps,
        formatted: String(curOps),
        trend: computeTrend(curOps, prevOps),
        detail: `${new Set(weeklySales.map((s) => s.distributorId).filter(Boolean)).size} distr. con ventas`
      },
      conversionRate: {
        value: curConv,
        formatted: `${curConv}%`,
        trend: computeTrend(curConv, prevConv),
        detail: `${curSuccess} visita${curSuccess !== 1 ? 's' : ''} exitosa${curSuccess !== 1 ? 's' : ''}`
      },
      avgDuration: {
        value: curDur,
        formatted: curV > 0 ? `${curDur} min` : '—',
        trend: computeTrend(curDur, prevDur),
        detail: 'Promedio por visita'
      },
      altas: {
        value: weeklyNewDistributors.length + weeklyNewCandidates.length,
        formatted: String(
          weeklyNewDistributors.length + weeklyNewCandidates.length
        ),
        detail: `${weeklyNewDistributors.length} distr. · ${weeklyNewCandidates.length} cand.`
      },
      activeContacts: {
        value: curActive,
        formatted: String(curActive),
        trend: computeTrend(curActive, prevActive),
        detail: 'Con actividad esta semana'
      },
      pending: {
        value: pendingFollowUps.length,
        formatted: String(pendingFollowUps.length),
        detail: 'Visitas sin cerrar'
      },
      pipeline: {
        value: candidates.length,
        formatted: String(candidates.length),
        detail: `${candidates.filter((c) => c.stage === 'evaluation').length} en evaluación`
      }
    }
  }, [
    weeklyVisits,
    weeklySales,
    prevWeekVisits,
    prevWeekSales,
    pendingFollowUps,
    weeklyNewDistributors,
    weeklyNewCandidates,
    candidates
  ])

  // Sales by brand
  const salesByBrand = useMemo((): BrandSales[] => {
    const tally = weeklySales.reduce<Record<string, number>>((acc, s) => {
      const id = String(s.brand ?? 'sin_marca')
      acc[id] = (acc[id] ?? 0) + (s.operations || 0)
      return acc
    }, {})
    return Object.entries(tally)
      .map(([brandId, operations]) => ({
        brandId,
        label:
          (lookups.brands as Record<string, LookupOption>)[brandId]?.label ??
          brandId,
        operations
      }))
      .sort((a, b) => b.operations - a.operations)
  }, [lookups.brands, weeklySales])

  // Visit type distribution
  const visitsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    weeklyVisits.forEach((v) => {
      const t = v.type || 'otro'
      counts[t] = (counts[t] ?? 0) + 1
    })
    return Object.entries(counts).map(([type, value]) => ({
      name: visitTypeLabels[type] ?? type,
      value
    }))
  }, [weeklyVisits])

  // Visit result distribution
  const visitsByResult = useMemo(() => {
    const counts: Record<string, number> = {}
    weeklyVisits.forEach((v) => {
      const r = String(v.result || 'sin_estado')
      counts[r] = (counts[r] ?? 0) + 1
    })
    return Object.entries(counts).map(([result, value]) => ({
      name: visitResultLabels[result] ?? result,
      result,
      value
    }))
  }, [weeklyVisits])

  // 6-week trend
  const weeklyTrend = useMemo((): TrendWeek[] => {
    return Array.from({ length: 6 }, (_, i) => {
      const refDate = addDays(referenceDate, (i - 5) * 7)
      const bounds = getWeeklyBounds(refDate)
      const wV = visits.filter((v) => inWeek(v.date, bounds))
      const wS = sales.filter((s) => inWeek(s.date, bounds))
      return {
        week: formatDate(bounds.start, DAY_MONTH_FORMAT),
        visitas: wV.length,
        operaciones: wS.reduce((a, s) => a + (s.operations || 0), 0)
      }
    })
  }, [visits, sales, referenceDate])

  // Candidate pipeline
  const candidatePipeline = useMemo(() => {
    const counts: Record<string, number> = {}
    candidates.forEach((c) => {
      counts[c.stage] = (counts[c.stage] ?? 0) + 1
    })
    const stages =
      pipelineStages.length > 0
        ? pipelineStages
        : Object.entries(stageLabels).map(([id, label]) => ({ id, label }))
    return stages
      .filter((s) => s.id !== 'rejected')
      .map((s) => ({
        stage: s.id,
        label: s.label,
        count: counts[s.id] ?? 0,
        color: stageColors[s.id] ?? '#6366f1'
      }))
  }, [candidates, pipelineStages])

  // Top contacts ranking
  const topContacts = useMemo((): TopContact[] => {
    const map = new Map<
      string,
      { visits: number; operations: number; type: 'distributor' | 'candidate' }
    >()
    weeklyVisits.forEach((visit) => {
      const key = visit.distributorId
        ? `d:${visit.distributorId}`
        : visit.candidateId
          ? `c:${visit.candidateId}`
          : null
      if (!key) return
      const entry = map.get(key) ?? {
        visits: 0,
        operations: 0,
        type: (key.startsWith('c:') ? 'candidate' : 'distributor') as
          | 'distributor'
          | 'candidate'
      }
      entry.visits += 1
      map.set(key, entry)
    })
    weeklySales.forEach((sale) => {
      if (!sale.distributorId) return
      const key = `d:${sale.distributorId}`
      const entry = map.get(key) ?? {
        visits: 0,
        operations: 0,
        type: 'distributor' as const
      }
      entry.operations += sale.operations || 0
      map.set(key, entry)
    })
    return Array.from(map.entries())
      .map(([key, data]) => {
        const isC = key.startsWith('c:')
        const id = key.slice(2)
        return {
          id,
          name: isC
            ? (candidatesIndex[id]?.name ?? 'Candidato')
            : (distributorsIndex[id]?.name ?? 'Distribuidor'),
          city: isC ? '' : (distributorsIndex[id]?.city ?? ''),
          type: data.type,
          visits: data.visits,
          operations: data.operations
        }
      })
      .sort((a, b) => b.operations - a.operations || b.visits - a.visits)
      .slice(0, 6)
  }, [candidatesIndex, distributorsIndex, weeklySales, weeklyVisits])

  // Timeline
  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = []
    weeklyVisits.forEach((visit) => {
      const contact = visit.distributorId
        ? distributorsIndex[String(visit.distributorId)]
        : visit.candidateId
          ? candidatesIndex[String(visit.candidateId)]
          : undefined
      const distributor = visit.distributorId
        ? (contact as Distributor | undefined)
        : undefined
      items.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        date: visit.date,
        title: `${visitTypeLabels[visit.type] ?? 'Visita'} · ${contact?.name ?? 'Sin asignar'}`,
        subtitle: visit.objective || 'Sin objetivo',
        status: String(visit.result),
        meta: distributor?.city ?? '',
        duration: visit.durationMinutes ? `${visit.durationMinutes} min` : null
      })
    })
    weeklySales.forEach((sale) => {
      const dist =
        distributorsIndex[
          sale.distributorId != null ? String(sale.distributorId) : ''
        ]
      const brandId = String(sale.brand ?? '')
      const familyId = String(sale.family ?? '')
      items.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        date: sale.date,
        title: `${sale.operations} op. ${(lookups.brands as Record<string, LookupOption>)[brandId]?.label ?? brandId}`,
        subtitle: dist?.name ?? 'Sin distribuidor',
        status: (familyId ? familyLabels[familyId] : undefined) ?? familyId,
        meta: dist?.city ?? '',
        duration: null
      })
    })
    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [
    candidatesIndex,
    distributorsIndex,
    lookups.brands,
    weeklySales,
    weeklyVisits
  ])

  // Summary metrics for exports
  const summaryMetrics = useMemo(
    (): SummaryMetric[] => [
      {
        id: 'visits',
        label: 'Visitas realizadas',
        value: kpis.visits.formatted,
        detail: kpis.visits.detail,
        hint: '',
        tone: ''
      },
      {
        id: 'ops',
        label: 'Operaciones',
        value: kpis.operations.formatted,
        detail: kpis.operations.detail,
        hint: '',
        tone: ''
      },
      {
        id: 'conv',
        label: 'Tasa de éxito',
        value: kpis.conversionRate.formatted,
        detail: kpis.conversionRate.detail,
        hint: '',
        tone: ''
      },
      {
        id: 'dur',
        label: 'Duración media',
        value: kpis.avgDuration.formatted,
        detail: kpis.avgDuration.detail,
        hint: '',
        tone: ''
      },
      {
        id: 'altas',
        label: 'Altas semana',
        value: kpis.altas.formatted,
        detail: kpis.altas.detail,
        hint: '',
        tone: ''
      },
      {
        id: 'pending',
        label: 'Pendientes',
        value: kpis.pending.formatted,
        detail: kpis.pending.detail,
        hint: '',
        tone: ''
      }
    ],
    [kpis]
  )

  const hasData = weeklyVisits.length > 0 || weeklySales.length > 0
  const totalWeeklyOps = weeklySales.reduce(
    (a, s) => a + (s.operations || 0),
    0
  )
  const totalVisitMinutes = weeklyVisits.reduce(
    (a, v) => a + (Number(v.durationMinutes) || 0),
    0
  )

  // ─ PDF Export ─────────────────────────────────────────────────────────────

  const handleExportPdf = useCallback(async (): Promise<void> => {
    try {
      const reportData: WeeklyReportData = {
        week: weekLabel,
        dateRange: `${formatDate(weekBounds.start, { month: 'long', day: 'numeric' })} - ${formatDate(weekBounds.end, { month: 'long', day: 'numeric' })}`,
        generatedAt: new Date().toLocaleString('es-ES'),
        kpis: {
          totalSales: kpis.operations.value,
          totalVisits: kpis.visits.value,
          activeDistributors: kpis.activeContacts.value,
          newCandidates: kpis.altas.value,
          conversionRate: kpis.conversionRate.value,
          avgResponseTime: kpis.avgDuration.formatted,
          networkHealth: 85, // TODO: Calcular dinámicamente si es posible
          criticalDistributors: 2, // TODO: Implementar lógica de criticidad
          stuckCandidates: kpis.pending.value
        },
        salesByBrand: salesByBrand.map((s) => ({
          brand: s.label,
          operations: s.operations,
          percentage: (s.operations / (totalWeeklyOps || 1)) * 100
        })),
        topPerformers: topContacts
          .slice(0, 5)
          .map((c, i) => ({
            name: c.name,
            operations: c.operations,
            rank: i + 1
          })),
        highlights: [
          `Se han realizado ${kpis.visits.formatted} visitas esta semana.`,
          `La tasa de éxito comercial es del ${kpis.conversionRate.formatted}.`,
          kpis.operations.value > 0
            ? `Se han cerrado ${kpis.operations.formatted} operaciones con éxito.`
            : 'Sin operaciones cerradas esta semana.'
        ],
        visitsDetail: weeklyVisits.map((v) => {
          const c = resolveVisitContact(v)
          return {
            distributor: c.name,
            date: formatDate(v.date),
            opportunity: v.objective,
            status: visitResultLabels[String(v.result)] || String(v.result)
          }
        }),
        opportunities: pendingFollowUps.map((v) => {
          const c = resolveVisitContact(v)
          return {
            distributor: c.name,
            description: v.objective || 'Seguimiento pendiente',
            status: 'En curso'
          }
        })
      }

      await generateWeeklyPDF(reportData, {
        salesByBrand: 'sales-by-brand-chart',
        trends: 'weekly-trend-chart'
      })
    } catch (err) {
      console.error('PDF error:', err)
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.')
    }
  }, [
    weekLabel,
    weekBounds,
    kpis,
    salesByBrand,
    totalWeeklyOps,
    topContacts,
    weeklyVisits,
    resolveVisitContact,
    generateWeeklyPDF
  ])

  const handleExportCsv = useCallback((): void => {
    const csv = buildCsv({
      weekLabel,
      summaryMetrics,
      visits: weeklyVisits,
      sales: weeklySales,
      distributorsIndex,
      candidatesIndex,
      brandLookup: lookups.brands as Record<string, LookupOption>
    })
    downloadBlob(
      csv,
      `reporte-semanal-${weekIdForFile || 'actual'}.csv`,
      'text/csv;charset=utf-8'
    )
  }, [
    weekLabel,
    summaryMetrics,
    weeklyVisits,
    weeklySales,
    distributorsIndex,
    candidatesIndex,
    lookups.brands,
    weekIdForFile
  ])

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageContainer className="py-8 space-y-6">
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Informes semanales
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                Resumen comercial
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Análisis de actividad, ventas y pipeline de la semana
                seleccionada.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!hasData}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!hasData}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Exportar CSV
              </button>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
              <CalendarDaysIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              {weekLabel}
            </div>
            <button
              type="button"
              onClick={() => setWeekOffset((v) => v - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((v) => v + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Siguiente
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="rounded-lg border border-indigo-200 dark:border-indigo-500/30 px-3 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              >
                Semana actual
              </button>
            )}
          </div>
        </div>

        {/* ── KPI GRID ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            title="Visitas realizadas"
            value={kpis.visits.formatted}
            trend={kpis.visits.trend}
            icon={ClockIcon}
            detail={kpis.visits.detail}
          />
          <KpiCard
            title="Operaciones"
            value={kpis.operations.formatted}
            trend={kpis.operations.trend}
            icon={ChartBarIcon}
            detail={kpis.operations.detail}
          />
          <KpiCard
            title="Tasa de éxito"
            value={kpis.conversionRate.formatted}
            trend={kpis.conversionRate.trend}
            icon={CheckCircleIcon}
            detail={kpis.conversionRate.detail}
          />
          <KpiCard
            title="Duración media"
            value={kpis.avgDuration.formatted}
            trend={kpis.avgDuration.trend}
            icon={ClockIcon}
            detail={kpis.avgDuration.detail}
          />
          <KpiCard
            title="Altas de la semana"
            value={kpis.altas.formatted}
            icon={UserPlusIcon}
            detail={kpis.altas.detail}
          />
          <KpiCard
            title="Contactos activos"
            value={kpis.activeContacts.formatted}
            trend={kpis.activeContacts.trend}
            icon={UserGroupIcon}
            detail={kpis.activeContacts.detail}
          />
          <KpiCard
            title="Seguimientos pendientes"
            value={kpis.pending.formatted}
            icon={ExclamationTriangleIcon}
            detail={kpis.pending.detail}
            highlight={kpis.pending.value > 0}
          />
          <KpiCard
            title="Pipeline total"
            value={kpis.pipeline.formatted}
            icon={FunnelIcon}
            detail={kpis.pipeline.detail}
          />
        </div>

        {/* ── TENDENCIA + MARCAS ─────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Tendencia semanal"
            description="Visitas y operaciones de las últimas 6 semanas."
            icon={ChartBarIcon}
          >
            {weeklyTrend.some((w) => w.visitas > 0 || w.operaciones > 0) ? (
              <div id="weekly-trend-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={weeklyTrend}
                    barGap={4}
                    margin={{ top: 4, right: 8, left: -20, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: 12
                      }}
                      cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Bar
                      dataKey="visitas"
                      name="Visitas"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      dataKey="operaciones"
                      name="Operaciones"
                      fill="#06b6d4"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Sin datos suficientes para el gráfico de tendencia.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Operaciones por marca"
            description="Distribución de ventas registradas esta semana."
            icon={ChartBarIcon}
          >
            {salesByBrand.length > 0 ? (
              <div id="sales-by-brand-chart">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    layout="vertical"
                    data={salesByBrand}
                    margin={{ top: 4, right: 20, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      dataKey="label"
                      type="category"
                      tick={{ fontSize: 11, fill: '#6b7280' }}
                      axisLine={false}
                      tickLine={false}
                      width={90}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        fontSize: 12
                      }}
                      cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                      formatter={(value: number) => [
                        `${value} op.`,
                        'Operaciones'
                      ]}
                    />
                    <Bar
                      dataKey="operations"
                      name="Operaciones"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={28}
                    >
                      {salesByBrand.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Sin ventas registradas esta semana.
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── DISTRIBUCIÓN VISITAS + PIPELINE ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Distribución de visitas"
            description="Tipos y resultados de las visitas de la semana."
            icon={ClockIcon}
          >
            {visitsByType.length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Por tipo
                  </p>
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={visitsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {visitsByType.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          fontSize: 11
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-1 space-y-1.5">
                    {visitsByType.map((item, i) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{
                              background: CHART_COLORS[i % CHART_COLORS.length]
                            }}
                          />
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.name}
                          </span>
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Por resultado
                  </p>
                  <ul className="space-y-2">
                    {visitsByResult.map((item) => (
                      <li
                        key={item.result}
                        className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2"
                      >
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${visitResultStyles[item.result] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
                        >
                          {item.name}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                    Total: {weeklyVisits.length} vis. · {totalVisitMinutes} min
                    invertidos
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Sin visitas esta semana.
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Pipeline de candidatos"
            description={`${candidates.length} candidatos activos en el embudo comercial.`}
            icon={FunnelIcon}
          >
            {candidates.length > 0 ? (
              <div className="space-y-3">
                {candidatePipeline.map((stage) => {
                  const pct =
                    candidates.length > 0
                      ? Math.round((stage.count / candidates.length) * 100)
                      : 0
                  return (
                    <div key={stage.stage}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {stage.label}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {stage.count}{' '}
                          <span className="text-xs font-normal text-gray-400">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: stage.color
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
                <div className="mt-4 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-sm">
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                    {candidates.filter((c) => c.stage === 'approved').length}
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {' '}
                    candidatos aprobados listos para activación
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Sin candidatos en el pipeline.
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── RANKING ────────────────────────────────────────────────────── */}
        <SectionCard
          title="Ranking de actividad"
          description="Contactos con mayor actividad comercial esta semana."
          icon={UserGroupIcon}
        >
          {topContacts.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    {[
                      '#',
                      'Contacto',
                      'Tipo',
                      'Visitas',
                      'Operaciones',
                      'Rendimiento'
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {topContacts.map((c, idx) => {
                    const perf =
                      c.operations > 0 && c.visits > 0
                        ? `${(c.operations / c.visits).toFixed(1)} op/vis`
                        : c.visits > 0
                          ? '0 op/vis'
                          : '—'
                    const medal =
                      idx === 0
                        ? '🥇'
                        : idx === 1
                          ? '🥈'
                          : idx === 2
                            ? '🥉'
                            : `${idx + 1}`
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3 text-sm">{medal}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {c.name}
                          </p>
                          {c.city && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {c.city}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              c.type === 'distributor'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                            }`}
                          >
                            {c.type === 'distributor'
                              ? 'Distribuidor'
                              : 'Candidato'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                          {c.visits}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                          {c.operations}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {perf}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Sin actividad registrada esta semana.
            </p>
          )}
        </SectionCard>

        {/* ── VISITS TABLE ───────────────────────────────────────────────── */}
        <SectionCard
          title="Visitas de la semana"
          description={`${weeklyVisits.length} visita${weeklyVisits.length !== 1 ? 's' : ''} · ${totalVisitMinutes} min totales invertidos`}
          icon={ClockIcon}
        >
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    'Fecha',
                    'Contacto',
                    'Tipo',
                    'Resultado',
                    'Duración',
                    'Objetivo',
                    'Próximos pasos'
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {weeklyVisits.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      No se registraron visitas en la semana seleccionada.
                    </td>
                  </tr>
                ) : (
                  weeklyVisits.map((visit) => {
                    const contact = resolveVisitContact(visit)
                    return (
                      <tr
                        key={visit.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {formatDate(visit.date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {contact.name}
                          </p>
                          {contact.city && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {contact.city}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {visitTypeLabels[String(visit.type)] ?? visit.type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${visitResultStyles[String(visit.result)] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {visitResultLabels[String(visit.result)] ??
                              String(visit.result)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {visit.durationMinutes
                            ? `${visit.durationMinutes} min`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                          {visit.objective || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                          {visit.nextSteps || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── SALES TABLE ────────────────────────────────────────────────── */}
        <SectionCard
          title="Ventas registradas"
          description={`${weeklySales.length} venta${weeklySales.length !== 1 ? 's' : ''} · ${totalWeeklyOps} operación${totalWeeklyOps !== 1 ? 'es' : ''} totales`}
          icon={ChartBarIcon}
        >
          <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  {[
                    'Fecha',
                    'Distribuidor',
                    'Marca',
                    'Familia',
                    'Operaciones',
                    'Notas'
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {weeklySales.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500"
                    >
                      No se registraron ventas en la semana seleccionada.
                    </td>
                  </tr>
                ) : (
                  <>
                    {weeklySales.map((sale) => {
                      const dist =
                        distributorsIndex[String(sale.distributorId ?? '')]
                      const brandId = String(sale.brand ?? '')
                      const familyId = String(sale.family ?? '')
                      return (
                        <tr
                          key={sale.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {formatDate(sale.date)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {dist?.name ?? 'No asignado'}
                            </p>
                            {dist?.city && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {dist.city}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {((lookups.brands as Record<string, LookupOption>)[
                              brandId
                            ]?.label ??
                              brandId) ||
                              '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {((familyId ? familyLabels[familyId] : undefined) ??
                              familyId) ||
                              '—'}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                            {sale.operations}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                            {sale.notes || '—'}
                          </td>
                        </tr>
                      )
                    })}
                    {weeklySales.length > 1 && (
                      <tr className="bg-indigo-50 dark:bg-indigo-500/10">
                        <td
                          colSpan={4}
                          className="px-4 py-3 text-right text-sm font-semibold text-indigo-700 dark:text-indigo-300"
                        >
                          Total operaciones
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-700 dark:text-indigo-300">
                          {totalWeeklyOps}
                        </td>
                        <td />
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* ── SEGUIMIENTO ────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="Timeline de actividad"
            description="Cronología de visitas y ventas de la semana."
            icon={ClockIcon}
          >
            {timeline.length > 0 ? (
              <ul className="space-y-3">
                {timeline.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        item.type === 'visit'
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300'
                      }`}
                    >
                      {item.type === 'visit' ? (
                        <ClockIcon className="h-4 w-4" />
                      ) : (
                        <ChartBarIcon className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {item.subtitle}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <span>{formatDate(item.date)}</span>
                        {item.status && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 ${visitResultStyles[item.status] ?? 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}
                          >
                            {visitResultLabels[item.status] ?? item.status}
                          </span>
                        )}
                        {item.meta && <span>{item.meta}</span>}
                        {item.duration && <span>{item.duration}</span>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Sin actividad registrada esta semana.
              </p>
            )}
          </SectionCard>

          <SectionCard
            title="Alertas y seguimientos"
            description="Visitas pendientes de cierre o acción."
            icon={ExclamationTriangleIcon}
          >
            {pendingFollowUps.length > 0 ? (
              <ul className="space-y-3">
                {pendingFollowUps.map((visit) => {
                  const contact = resolveVisitContact(visit)
                  return (
                    <li
                      key={visit.id}
                      className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(visit.date)} ·{' '}
                            {visitTypeLabels[visit.type] ?? visit.type}
                          </p>
                          {visit.objective && (
                            <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
                              {visit.objective}
                            </p>
                          )}
                          {visit.nextSteps && (
                            <p className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                              → {visit.nextSteps}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Sin seguimientos pendientes. ¡Excelente trabajo!</span>
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      </PageContainer>
    </div>
  )
}

export default ReportsWeekly
