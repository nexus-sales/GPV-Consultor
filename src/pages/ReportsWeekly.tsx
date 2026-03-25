import React, { useMemo, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PageContainer } from '../components/layout/PageContainer'
import { useAppData } from '../lib/useAppData'
import { getWeeklyBounds, inWeek } from '../lib/utils/kpis'
import {
  Distributor,
  Candidate,
  Visit,
  Sale,
  LookupOption,
  AppContextType
} from '../lib/types'

// Interfaces TypeScript
interface WeekBounds {
  start: Date | string
  end: Date | string
}

interface Brand extends LookupOption {
  label: string
}

interface Lookups {
  brands: Record<string, Brand>
}

interface Formatters {
  relative: (date: string) => string
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

interface TopDistributor {
  id: string
  name: string
  city: string
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

interface DistributorIndex {
  [key: string]: Distributor
}

interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string
  hint?: string
  tone: string
}

interface ActionButtonProps {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
}

interface SectionCardProps {
  title: string
  children: React.ReactNode
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface CsvExportData {
  weekLabel: string
  summaryMetrics: SummaryMetric[]
  visits: Visit[]
  sales: Sale[]
  distributorsIndex: DistributorIndex
  brandLookup: Record<string, Brand>
}

// Formateadores de fecha
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

// Estilos constantes
const actionButtonStyles: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-pastel-indigo to-pastel-cyan text-white shadow-lg shadow-pastel-indigo/30',
  secondary:
    'bg-white/80 dark:bg-gray-800/80 text-pastel-indigo border border-pastel-indigo/40 shadow-sm',
  ghost:
    'bg-transparent text-gray-500 dark:text-gray-400 border border-white/40'
}

const visitResultStyles: Record<string, string> = {
  pendiente: 'bg-pastel-yellow/10 text-pastel-yellow',
  realizado: 'bg-pastel-green/10 text-pastel-green',
  cancelado: 'bg-pastel-red/10 text-pastel-red'
}

const visitTypeLabels: Record<string, string> = {
  presentacion: 'Presentación',
  seguimiento: 'Seguimiento',
  formacion: 'Formación',
  auditoria: 'Auditoría'
}

const familyLabels: Record<string, string> = {
  convergente: 'Convergente',
  movil: 'Línea móvil',
  solo_fibra: 'Solo fibra',
  empresa_autonomo: 'Empresa / Autónomo',
  microempresa: 'Microempresa'
}

// Funciones utilitarias
const sanitizeFilename = (value: string): string =>
  value
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
  const stringValue = String(value)
  if (/[";\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const buildCsv = ({
  weekLabel,
  summaryMetrics,
  visits,
  sales,
  distributorsIndex,
  brandLookup
}: CsvExportData): string => {
  const lines: string[] = []
  lines.push(`Semana;${weekLabel}`)
  lines.push('')
  lines.push('Resumen;Valor;Detalle')
  summaryMetrics.forEach((metric) => {
    lines.push(
      `${escapeCsvValue(metric.label)};${escapeCsvValue(metric.value)};${escapeCsvValue(metric.detail)}`
    )
  })

  lines.push('')
  lines.push(
    'Visitas;Fecha;Distribuidor;Tipo;Resultado;Duración (min);Objetivo;Próximos pasos'
  )
  if (visits.length === 0) {
    lines.push('Visitas;Sin datos;;;;;;')
  } else {
    visits.forEach((visit) => {
      const distributor = distributorsIndex[visit.distributorId || '']
      lines.push(
        [
          'Visita',
          formatDate(visit.date),
          distributor?.name ?? 'No asignado',
          visitTypeLabels[visit.type] ?? visit.type,
          visit.result ?? '—',
          visit.durationMinutes ?? '',
          visit.objective ?? '',
          visit.nextSteps ?? ''
        ]
          .map(escapeCsvValue)
          .join(';')
      )
    })
  }

  lines.push('')
  lines.push('Ventas;Fecha;Distribuidor;Marca;Familia;Operaciones;Notas')
  if (sales.length === 0) {
    lines.push('Ventas;Sin datos;;;;;')
  } else {
    sales.forEach((sale) => {
      const distributorId =
        sale.distributorId != null ? String(sale.distributorId) : ''
      const distributor = distributorsIndex[distributorId]
      const brandId = String(sale.brand ?? '')
      const familyId = String(sale.family ?? '')
      lines.push(
        [
          'Venta',
          formatDate(sale.date),
          distributor?.name ?? 'No asignado',
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

// Componentes
const SummaryCard: React.FC<SummaryCardProps> = ({
  icon,
  title,
  value,
  hint,
  tone
}) => {
  const Icon = icon
  return (
    <article
      className={`rounded-3xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-br ${tone} p-6 shadow-lg backdrop-blur`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="rounded-2xl bg-white/70 dark:bg-gray-700/70 p-3 text-pastel-indigo shadow-inner">
            <Icon className="h-6 w-6" />
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{hint}</p>
      ) : null}
    </article>
  )
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  variant = 'primary',
  onClick,
  disabled = false
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-indigo disabled:cursor-not-allowed disabled:opacity-60 ${
      actionButtonStyles[variant] ?? actionButtonStyles.primary
    }`}
  >
    {Icon ? <Icon className="h-5 w-5" /> : null}
    {label}
  </button>
)

const SectionCard: React.FC<SectionCardProps> = ({
  title,
  children,
  description,
  icon: Icon
}) => (
  <section className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/80 dark:bg-gray-800/80 p-6 shadow-xl backdrop-blur">
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          {Icon ? (
            <span className="rounded-xl bg-pastel-indigo/15 p-2 text-pastel-indigo">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {description ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </section>
)

const ReportsWeekly: React.FC = () => {
  const {
    visits = [],
    sales = [],
    distributors = [],
    candidates = [],
    lookups = { brands: {} },
    formatters = { relative: () => '' },
    currentUser
  } = useAppData() as AppContextType

  const [weekOffset, setWeekOffset] = useState<number>(0)

  const referenceDate = useMemo(
    () => addDays(new Date(), weekOffset * 7),
    [weekOffset]
  )
  const weekBounds = useMemo(
    () => getWeeklyBounds(referenceDate),
    [referenceDate]
  )

  const distributorsIndex = useMemo((): DistributorIndex => {
    return distributors.reduce<DistributorIndex>((acc, item) => {
      acc[item.id] = item
      return acc
    }, {})
  }, [distributors])

  const weekLabel = useMemo(() => {
    const end = addDays(new Date(weekBounds.end), -1)
    const startText = formatDate(weekBounds.start, DAY_MONTH_FORMAT)
    const endText = formatDate(end, DAY_MONTH_FORMAT)
    return `${startText} – ${endText}`
  }, [weekBounds])

  const weekIdForFile = useMemo(() => sanitizeFilename(weekLabel), [weekLabel])

  const weeklyVisits = useMemo(
    () => visits.filter((visit: Visit) => inWeek(visit.date, weekBounds)),
    [visits, weekBounds]
  )

  const weeklySales = useMemo(
    () => sales.filter((sale: Sale) => inWeek(sale.date, weekBounds)),
    [sales, weekBounds]
  )

  const weeklyNewDistributors = useMemo(
    () =>
      distributors.filter(
        (item: Distributor) =>
          item.createdAt && inWeek(item.createdAt, weekBounds)
      ),
    [distributors, weekBounds]
  )

  const weeklyNewCandidates = useMemo(
    () =>
      candidates.filter(
        (item: Candidate) =>
          item.createdAt && inWeek(item.createdAt, weekBounds)
      ),
    [candidates, weekBounds]
  )

  const summaryMetrics = useMemo((): SummaryMetric[] => {
    const totalVisits = weeklyVisits.length
    const pendingFollowUps = weeklyVisits.filter(
      (visit) => visit.result === 'pendiente'
    ).length
    const totalOperations = weeklySales.reduce(
      (acc, sale) => acc + (sale.operations || 0),
      0
    )
    const impactedDistributors = new Set(
      weeklySales.map((sale) => sale.distributorId).filter(Boolean)
    ).size
    const averageDuration = totalVisits
      ? Math.round(
          weeklyVisits.reduce(
            (acc, visit) => acc + (Number(visit.durationMinutes) || 0),
            0
          ) / totalVisits
        )
      : 0

    return [
      {
        id: 'visits',
        label: 'Visitas realizadas',
        value: totalVisits.toString(),
        detail: `${pendingFollowUps} pendientes de seguimiento`,
        hint: `${pendingFollowUps} seguimiento${pendingFollowUps === 1 ? '' : 's'} por cerrar`,
        tone: 'from-white via-white to-pastel-indigo/15 dark:from-gray-800 dark:via-gray-800 dark:to-pastel-indigo/10'
      },
      {
        id: 'sales',
        label: 'Operaciones registradas',
        value: totalOperations.toString(),
        detail: `${impactedDistributors} distribuidores impactados`,
        hint: `${impactedDistributors} distribuidor${impactedDistributors === 1 ? '' : 'es'} con ventas`,
        tone: 'from-white via-white to-pastel-cyan/15 dark:from-gray-800 dark:via-gray-800 dark:to-pastel-cyan/10'
      },
      {
        id: 'duration',
        label: 'Duración media de visita',
        value: totalVisits ? `${averageDuration} min` : '—',
        detail: 'Promedio en minutos',
        hint: totalVisits
          ? 'Tiempo invertido por visita'
          : 'Sin visitas registradas',
        tone: 'from-white via-white to-pastel-yellow/15 dark:from-gray-800 dark:via-gray-800 dark:to-pastel-yellow/10'
      },
      {
        id: 'new',
        label: 'Altas de la semana',
        value: (
          weeklyNewDistributors.length + weeklyNewCandidates.length
        ).toString(),
        detail: `${weeklyNewDistributors.length} distribuidores • ${weeklyNewCandidates.length} candidatos`,
        hint: `${weeklyNewDistributors.length} dist. / ${weeklyNewCandidates.length} cand.`,
        tone: 'from-white via-white to-pastel-green/15 dark:from-gray-800 dark:via-gray-800 dark:to-pastel-green/10'
      }
    ]
  }, [
    weeklyVisits,
    weeklySales,
    weeklyNewDistributors.length,
    weeklyNewCandidates.length
  ])

  const salesByBrand = useMemo((): BrandSales[] => {
    const result: BrandSales[] = []
    const tally = weeklySales.reduce<Record<string, number>>((acc, sale) => {
      const brandId = String(sale.brand ?? 'sin_marca')
      const current = acc[brandId] ?? 0
      acc[brandId] = current + (sale.operations || 0)
      return acc
    }, {})

    Object.keys(tally).forEach((brandId) => {
      result.push({
        brandId,
        label:
          (lookups.brands as Record<string, LookupOption>)[brandId]?.label ??
          brandId,
        operations: tally[brandId]
      })
    })

    return result.sort((a, b) => b.operations - a.operations)
  }, [lookups.brands, weeklySales])

  const topDistributors = useMemo((): TopDistributor[] => {
    const map = new Map<string, { visits: number; operations: number }>()

    weeklyVisits.forEach((visit) => {
      if (!visit.distributorId) return
      const entry = map.get(String(visit.distributorId)) ?? {
        visits: 0,
        operations: 0
      }
      entry.visits += 1
      map.set(String(visit.distributorId), entry)
    })

    weeklySales.forEach((sale) => {
      if (!sale.distributorId) return
      const entry = map.get(String(sale.distributorId)) ?? {
        visits: 0,
        operations: 0
      }
      entry.operations += sale.operations || 0
      map.set(String(sale.distributorId), entry)
    })

    return Array.from(map.entries())
      .map(([id, data]) => ({
        id,
        name: distributorsIndex[id]?.name ?? 'Distribuidor sin nombre',
        city: distributorsIndex[id]?.city ?? '',
        visits: data.visits,
        operations: data.operations
      }))
      .sort((a, b) => b.operations - a.operations || b.visits - a.visits)
      .slice(0, 4)
  }, [distributorsIndex, weeklySales, weeklyVisits])

  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = []

    weeklyVisits.forEach((visit) => {
      const distributor = distributorsIndex[String(visit.distributorId) || '']
      items.push({
        id: `visit-${visit.id}`,
        type: 'visit',
        date: visit.date,
        title: `${visitTypeLabels[visit.type] ?? 'Visita'} • ${distributor?.name ?? 'Sin distribuidor'}`,
        subtitle: visit.objective || 'Sin objetivo',
        status: String(visit.result),
        meta: distributor?.city ?? '',
        duration: visit.durationMinutes ? `${visit.durationMinutes} min` : null
      })
    })

    weeklySales.forEach((sale) => {
      const distributorId =
        sale.distributorId != null ? String(sale.distributorId) : ''
      const distributor = distributorsIndex[distributorId]
      const brandId = String(sale.brand ?? '')
      const familyId = String(sale.family ?? '')
      items.push({
        id: `sale-${sale.id}`,
        type: 'sale',
        date: sale.date,
        title: `${sale.operations} operación${sale.operations === 1 ? '' : 'es'} ${(lookups.brands as Record<string, LookupOption>)[brandId]?.label ?? brandId}`,
        subtitle: distributor?.name ?? 'Sin distribuidor',
        status: (familyId ? familyLabels[familyId] : undefined) ?? familyId,
        meta: distributor?.city ?? '',
        duration: null
      })
    })

    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [distributorsIndex, lookups.brands, weeklySales, weeklyVisits])

  const pendingFollowUps = useMemo(
    () => weeklyVisits.filter((visit) => visit.result === 'pendiente'),
    [weeklyVisits]
  )

  const hasData = weeklyVisits.length > 0 || weeklySales.length > 0

  const handleExportPdf = (): void => {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginX = 40
      const marginY = 40
      let cursorY = marginY

      // === PORTADA PROFESIONAL ===
      doc.setFillColor(99, 102, 241) // Indigo corporativo
      doc.rect(0, 0, pageWidth, 120, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORME SEMANAL', marginX, 50)

      doc.setFontSize(16)
      doc.setFont('helvetica', 'normal')
      doc.text('GPV Canarias', marginX, 75)

      doc.setFontSize(12)
      doc.text(`Semana: ${weekLabel}`, marginX, 95)

      doc.setFontSize(9)
      doc.text(
        `Generado: ${formatDate(new Date())} por ${currentUser?.fullName ?? 'Sistema'}`,
        marginX,
        110
      )

      cursorY = 150
      doc.setTextColor(0, 0, 0)
      doc.setTextColor(0, 0, 0)

      // === RESUMEN EJECUTIVO ===
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(99, 102, 241)
      doc.text('📊 RESUMEN EJECUTIVO', marginX, cursorY)
      cursorY += 20

      doc.setTextColor(0, 0, 0)
      autoTable(doc, {
        startY: cursorY,
        margin: { left: marginX, right: marginX },
        head: [['Métrica', 'Resultado', 'Observaciones']],
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        body: summaryMetrics.map((metric) => [
          metric.label,
          metric.value,
          metric.detail
        ]),
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { fontSize: 10, cellPadding: 8 }
      })

      cursorY = doc.lastAutoTable.finalY + 30

      // === ANÁLISIS DE VENTAS ===
      if (weeklySales.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(34, 211, 238)
        doc.text('💰 OPERACIONES COMERCIALES', marginX, cursorY)
        cursorY += 5

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(
          `Total operaciones: ${weeklySales.reduce((sum, s) => sum + (s.operations || 0), 0)} | Distribuidores impactados: ${new Set(weeklySales.map((s) => s.distributorId)).size}`,
          marginX,
          cursorY
        )
        cursorY += 20

        doc.setTextColor(0, 0, 0)
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [
            [
              'Fecha',
              'Distribuidor',
              'Localidad',
              'Marca',
              'Familia',
              'Ops',
              'Observaciones'
            ]
          ],
          headStyles: {
            fillColor: [34, 211, 238],
            textColor: 255,
            fontStyle: 'bold'
          },
          body: weeklySales.map((sale) => {
            const distributor =
              distributorsIndex[
                sale.distributorId != null ? String(sale.distributorId) : ''
              ]
            const brandId = String(sale.brand ?? '')
            const familyId = String(sale.family ?? '')
            return [
              formatDate(sale.date),
              distributor?.name ?? 'No asignado',
              distributor?.city ?? '—',
              (lookups.brands as Record<string, LookupOption>)[brandId]
                ?.label ?? brandId,
              (familyId ? familyLabels[familyId] : undefined) ?? familyId,
              String(sale.operations ?? 0),
              (sale.notes || '—').slice(0, 50) +
                (sale.notes && sale.notes.length > 50 ? '...' : '')
            ]
          }),
          alternateRowStyles: { fillColor: [240, 253, 255] },
          styles: { fontSize: 9, cellPadding: 6 },
          columnStyles: {
            6: { cellWidth: 120 }
          }
        })

        cursorY = doc.lastAutoTable.finalY + 25

        // Ranking de marcas
        if (salesByBrand.length > 0) {
          doc.addPage()
          cursorY = marginY

          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(99, 102, 241)
          doc.text('🏆 RANKING POR MARCA', marginX, cursorY)
          cursorY += 20

          doc.setTextColor(0, 0, 0)
          autoTable(doc, {
            startY: cursorY,
            margin: { left: marginX, right: marginX },
            head: [['Posición', 'Marca', 'Operaciones', '% del Total']],
            headStyles: {
              fillColor: [99, 102, 241],
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center'
            },
            body: salesByBrand.map((item, idx) => {
              const total = weeklySales.reduce(
                (sum, s) => sum + (s.operations || 0),
                0
              )
              const percentage =
                total > 0 ? ((item.operations / total) * 100).toFixed(1) : '0'
              return [
                `${idx + 1}º`,
                item.label,
                String(item.operations),
                `${percentage}%`
              ]
            }),
            alternateRowStyles: { fillColor: [245, 247, 250] },
            styles: { fontSize: 10, cellPadding: 8, halign: 'center' },
            columnStyles: {
              1: { halign: 'left' }
            }
          })

          cursorY = doc.lastAutoTable.finalY + 25
        }
      } else {
        doc.setFontSize(11)
        doc.setTextColor(150, 150, 150)
        doc.text(
          'ℹ️ No se registraron operaciones comerciales durante esta semana.',
          marginX,
          cursorY
        )
        cursorY += 30
      }

      // === ACTIVIDAD DE CAMPO (VISITAS) ===
      if (cursorY > pageHeight - 150) {
        doc.addPage()
        cursorY = marginY
      }

      if (weeklyVisits.length > 0) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(52, 211, 153)
        doc.text('🚗 ACTIVIDAD DE CAMPO', marginX, cursorY)
        cursorY += 5

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        const visitStats = weeklyVisits.reduce(
          (acc, v) => {
            acc.total += 1
            if (v.result === 'completada') acc.completed += 1
            if (v.result === 'pendiente') acc.pending += 1
            return acc
          },
          { total: 0, completed: 0, pending: 0 }
        )

        doc.text(
          `Total visitas: ${visitStats.total} | Completadas: ${visitStats.completed} | Pendientes seguimiento: ${visitStats.pending}`,
          marginX,
          cursorY
        )
        cursorY += 20

        doc.setTextColor(0, 0, 0)
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [
            [
              'Fecha',
              'Distribuidor',
              'Tipo',
              'Estado',
              'Duración',
              'Objetivo / Acuerdos'
            ]
          ],
          headStyles: {
            fillColor: [52, 211, 153],
            textColor: 255,
            fontStyle: 'bold'
          },
          body: weeklyVisits.map((visit) => {
            const distributor =
              distributorsIndex[String(visit.distributorId) || '']
            const statusEmoji =
              visit.result === 'completada'
                ? '✅'
                : visit.result === 'pendiente'
                  ? '⏳'
                  : visit.result === 'cancelada'
                    ? '❌'
                    : '—'

            return [
              formatDate(visit.date),
              `${distributor?.name ?? 'No asignado'}\n${distributor?.city ?? ''}`,
              visitTypeLabels[String(visit.type)] ?? visit.type,
              `${statusEmoji} ${String(visit.result)}`,
              visit.durationMinutes ? `${visit.durationMinutes} min` : '—',
              (visit.objective || 'Sin objetivo').slice(0, 80) +
                (visit.objective && visit.objective.length > 80 ? '...' : '')
            ]
          }),
          alternateRowStyles: { fillColor: [236, 253, 245] },
          styles: { fontSize: 9, cellPadding: 6 },
          columnStyles: {
            5: { cellWidth: 180 }
          }
        })

        cursorY = doc.lastAutoTable.finalY + 25

        // Detalle de próximos pasos
        const visitsWithNextSteps = weeklyVisits.filter(
          (v) => v.nextSteps && v.nextSteps.trim()
        )
        if (visitsWithNextSteps.length > 0) {
          if (cursorY > pageHeight - 200) {
            doc.addPage()
            cursorY = marginY
          }

          doc.setFontSize(12)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(99, 102, 241)
          doc.text('📋 ACUERDOS Y PRÓXIMOS PASOS', marginX, cursorY)
          cursorY += 20

          doc.setTextColor(0, 0, 0)
          autoTable(doc, {
            startY: cursorY,
            margin: { left: marginX, right: marginX },
            head: [
              ['Distribuidor', 'Fecha Visita', 'Acuerdos / Próximos Pasos']
            ],
            headStyles: {
              fillColor: [99, 102, 241],
              textColor: 255,
              fontStyle: 'bold'
            },
            body: visitsWithNextSteps.map((visit) => {
              const distributor =
                distributorsIndex[String(visit.distributorId) || '']
              return [
                distributor?.name ?? 'No asignado',
                formatDate(visit.date),
                visit.nextSteps || '—'
              ]
            }),
            alternateRowStyles: { fillColor: [245, 247, 250] },
            styles: { fontSize: 9, cellPadding: 8 },
            columnStyles: {
              2: { cellWidth: 300 }
            }
          })

          cursorY = doc.lastAutoTable.finalY + 25
        }
      } else {
        doc.setFontSize(11)
        doc.setTextColor(150, 150, 150)
        doc.text(
          'ℹ️ No se registraron visitas de campo durante esta semana.',
          marginX,
          cursorY
        )
        cursorY += 30
      }

      // === DISTRIBUIDORES DESTACADOS ===
      if (topDistributors.length > 0) {
        if (cursorY > pageHeight - 150) {
          doc.addPage()
          cursorY = marginY
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(251, 146, 60)
        doc.text('⭐ DISTRIBUIDORES DESTACADOS', marginX, cursorY)
        cursorY += 20

        doc.setTextColor(0, 0, 0)
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [
            [
              'Ranking',
              'Distribuidor',
              'Localidad',
              'Visitas',
              'Operaciones',
              'Rendimiento'
            ]
          ],
          headStyles: {
            fillColor: [251, 146, 60],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          body: topDistributors.map((item, idx) => {
            const performance =
              item.operations > 0 && item.visits > 0
                ? `${(item.operations / item.visits).toFixed(1)} ops/visita`
                : '—'
            const medal =
              idx === 0
                ? '🥇'
                : idx === 1
                  ? '🥈'
                  : idx === 2
                    ? '🥉'
                    : `${idx + 1}º`

            return [
              medal,
              item.name,
              item.city || '—',
              String(item.visits),
              String(item.operations),
              performance
            ]
          }),
          alternateRowStyles: { fillColor: [255, 247, 237] },
          styles: { fontSize: 10, cellPadding: 8, halign: 'center' },
          columnStyles: {
            1: { halign: 'left' },
            2: { halign: 'left' }
          }
        })

        cursorY = doc.lastAutoTable.finalY + 25
      }

      // === ALERTAS Y SEGUIMIENTOS ===
      if (pendingFollowUps.length > 0) {
        if (cursorY > pageHeight - 150) {
          doc.addPage()
          cursorY = marginY
        }

        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(239, 68, 68)
        doc.text('⚠️ ALERTAS Y SEGUIMIENTOS PENDIENTES', marginX, cursorY)
        cursorY += 20

        doc.setTextColor(0, 0, 0)
        autoTable(doc, {
          startY: cursorY,
          margin: { left: marginX, right: marginX },
          head: [
            [
              'Prioridad',
              'Distribuidor',
              'Fecha Visita',
              'Objetivo',
              'Acción Requerida'
            ]
          ],
          headStyles: {
            fillColor: [239, 68, 68],
            textColor: 255,
            fontStyle: 'bold'
          },
          body: pendingFollowUps.map((visit, idx) => {
            const distributor =
              distributorsIndex[String(visit.distributorId) || '']
            const priority = idx < 3 ? '🔴 Alta' : '🟡 Media'

            return [
              priority,
              distributor?.name ?? 'No asignado',
              formatDate(visit.date),
              (visit.objective || 'Sin objetivo').slice(0, 50),
              (visit.nextSteps || 'Realizar seguimiento').slice(0, 60)
            ]
          }),
          alternateRowStyles: { fillColor: [254, 242, 242] },
          styles: { fontSize: 9, cellPadding: 6 },
          columnStyles: {
            3: { cellWidth: 100 },
            4: { cellWidth: 120 }
          }
        })

        cursorY = doc.lastAutoTable.finalY + 25
      }

      // === PIE DE PÁGINA PROFESIONAL ===
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `GPV Canarias - Informe Semanal | Página ${i} de ${totalPages}`,
          marginX,
          pageHeight - 20
        )
        doc.text(
          `Confidencial - Solo para uso interno`,
          pageWidth - marginX - 120,
          pageHeight - 20
        )
      }

      doc.save(`informe-semanal-${weekIdForFile || 'actual'}.pdf`)
    } catch (error) {
      alert(
        `Error al generar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`
      )
    }
  }

  const handleExportCsv = (): void => {
    const csv = buildCsv({
      weekLabel,
      summaryMetrics,
      visits: weeklyVisits,
      sales: weeklySales,
      distributorsIndex,
      brandLookup: lookups.brands
    })
    downloadBlob(
      csv,
      `reporte-semanal-${weekIdForFile || 'actual'}.csv`,
      'text/csv;charset=utf-8'
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pastel-indigo/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PageContainer className="py-10 space-y-8">
        <section className="relative rounded-4xl border border-white/40 dark:border-gray-700/40 bg-gradient-to-r from-white/95 via-white/80 to-pastel-indigo/20 dark:from-gray-800/95 dark:via-gray-800/80 dark:to-pastel-indigo/10 p-8 shadow-2xl backdrop-blur">
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-pastel-indigo/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Informes semanales
              </p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                Resumen comercial
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                Analiza visitas, ventas y nuevas altas de la semana
                seleccionada. Exporta en PDF o CSV para compartir con el equipo
                directivo.
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <ActionButton
                icon={ArrowDownTrayIcon}
                label="Exportar PDF"
                onClick={handleExportPdf}
                disabled={!hasData}
              />
              <ActionButton
                icon={DocumentArrowDownIcon}
                label="Exportar CSV"
                variant="secondary"
                onClick={handleExportCsv}
                disabled={!hasData}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/70 dark:bg-gray-700/70 px-4 py-2 font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <CalendarDaysIcon className="h-5 w-5 text-pastel-indigo" />
              {weekLabel}
            </div>
            <div className="flex items-center gap-2">
              <ActionButton
                icon={ArrowLeftIcon}
                label="Semana anterior"
                variant="ghost"
                onClick={() => setWeekOffset((value) => value - 1)}
              />
              <ActionButton
                icon={ArrowRightIcon}
                label="Semana siguiente"
                variant="ghost"
                onClick={() => setWeekOffset((value) => value + 1)}
              />
              {weekOffset !== 0 ? (
                <ActionButton
                  label="Semana actual"
                  variant="ghost"
                  onClick={() => setWeekOffset(0)}
                />
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryMetrics.map((metric) => (
            <SummaryCard
              key={metric.id}
              icon={
                metric.id === 'visits'
                  ? ClockIcon
                  : metric.id === 'sales'
                    ? ChartBarIcon
                    : metric.id === 'new'
                      ? UserGroupIcon
                      : CalendarDaysIcon
              }
              title={metric.label}
              value={metric.value}
              hint={metric.hint}
              tone={metric.tone}
            />
          ))}
        </section>

        <SectionCard
          title="Análisis de desempeño"
          description="Distribución de ventas por marca y distribuidores con más actividad."
          icon={ChartBarIcon}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700/60 bg-white/70 dark:bg-gray-700/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Operaciones por marca
              </h3>
              {salesByBrand.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {salesByBrand.map((item) => (
                    <li
                      key={item.brandId}
                      className="flex items-center justify-between rounded-2xl bg-pastel-indigo/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.operations} operación
                          {item.operations === 1 ? '' : 'es'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-pastel-indigo">
                        {item.operations}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Sin ventas registradas esta semana.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 dark:border-gray-700/60 bg-white/70 dark:bg-gray-700/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Distribuidores destacados
              </h3>
              {topDistributors.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {topDistributors.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl bg-pastel-cyan/5 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.city || 'Sin localización'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                        <p>
                          <span className="font-semibold text-pastel-indigo">
                            {item.operations}
                          </span>{' '}
                          op.
                        </p>
                        <p>
                          <span className="font-semibold text-pastel-green">
                            {item.visits}
                          </span>{' '}
                          visitas
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Sin actividad registrada.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Visitas de la semana"
          description="Detalle de reuniones y seguimiento realizado."
          icon={ClockIcon}
        >
          <div className="overflow-hidden rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/75 dark:bg-gray-800/75 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-pastel-indigo/10 via-white to-pastel-cyan/10">
                  <tr>
                    {[
                      'Fecha',
                      'Distribuidor',
                      'Tipo',
                      'Resultado',
                      'Duración',
                      'Objetivo',
                      'Próximos pasos'
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklyVisits.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No se registraron visitas en la semana seleccionada.
                      </td>
                    </tr>
                  ) : (
                    weeklyVisits.map((visit) => {
                      const distributor =
                        distributorsIndex[String(visit.distributorId) || '']
                      return (
                        <tr
                          key={visit.id}
                          className="hover:bg-gray-50 dark:bg-gray-700/80"
                        >
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(visit.date)}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900">
                            {distributor?.name ?? 'No asignado'}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {distributor?.city ?? 'Sin localidad'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {visitTypeLabels[String(visit.type)] ?? visit.type}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-xs font-semibold ${
                                visitResultStyles[String(visit.result) || ''] ??
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              <span className="h-2 w-2 rounded-full bg-current" />
                              {String(visit.result) ?? '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {visit.durationMinutes
                              ? `${visit.durationMinutes} min`
                              : '—'}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {visit.objective || '—'}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {visit.nextSteps || '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Ventas registradas"
          description="Operaciones comerciales capturadas durante la semana."
          icon={ChartBarIcon}
        >
          <div className="overflow-hidden rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/75 dark:bg-gray-800/75 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-pastel-cyan/10 via-white to-pastel-indigo/10">
                  <tr>
                    {[
                      'Fecha',
                      'Distribuidor',
                      'Marca',
                      'Familia',
                      'Operaciones',
                      'Notas'
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {weeklySales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No se registraron ventas en la semana seleccionada.
                      </td>
                    </tr>
                  ) : (
                    weeklySales.map((sale) => {
                      const distributor =
                        distributorsIndex[String(sale.distributorId) || '']
                      return (
                        <tr
                          key={sale.id}
                          className="hover:bg-gray-50 dark:bg-gray-700/80"
                        >
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(sale.date)}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900">
                            {distributor?.name ?? 'No asignado'}
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {distributor?.city ?? 'Sin localidad'}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {(lookups.brands as Record<string, LookupOption>)[
                              String(sale.brand ?? '')
                            ]?.label ?? String(sale.brand ?? '')}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                            {(sale.family
                              ? familyLabels[String(sale.family)]
                              : undefined) ?? String(sale.family ?? '')}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                            {sale.operations}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                            {sale.notes || '—'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Seguimiento y observaciones"
          description="Actividades destacadas y próximos pasos sugeridos."
          icon={UserGroupIcon}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 dark:border-gray-700/60 bg-white/70 dark:bg-gray-700/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Timeline de actividad
              </h3>
              {timeline.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {timeline.map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <span
                        className={`mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                          item.type === 'visit'
                            ? 'bg-pastel-indigo/15 text-pastel-indigo'
                            : 'bg-pastel-cyan/15 text-pastel-cyan'
                        }`}
                      >
                        {item.type === 'visit' ? (
                          <ClockIcon className="h-5 w-5" />
                        ) : (
                          <ChartBarIcon className="h-5 w-5" />
                        )}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {item.subtitle}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {formatDate(item.date)} •{' '}
                            {formatters.relative(item.date)}
                          </span>
                          {item.status ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1">
                              <UserGroupIcon className="h-4 w-4" />
                              {item.status}
                            </span>
                          ) : null}
                          {item.meta ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1">
                              {item.meta}
                            </span>
                          ) : null}
                          {item.duration ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1">
                              {item.duration}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  Sin actividad registrada.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-gray-100 dark:border-gray-700/60 bg-white/70 dark:bg-gray-700/70 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Alertas y pendientes
              </h3>
              {pendingFollowUps.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {pendingFollowUps.map((visit) => {
                    const distributor =
                      distributorsIndex[String(visit.distributorId) || '']
                    return (
                      <li
                        key={visit.id}
                        className="rounded-2xl border border-pastel-yellow/40 bg-pastel-yellow/10 p-4 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-pastel-yellow" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {distributor?.name ?? 'No asignado'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(visit.date)} •{' '}
                              {visit.objective || 'Sin objetivo'}
                            </p>
                            {visit.nextSteps ? (
                              <p className="mt-2 text-sm">
                                Próximo paso: {visit.nextSteps}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="mt-4 rounded-2xl border border-pastel-green/40 bg-pastel-green/10 p-4 text-sm text-pastel-green">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-5 w-5" />
                    <span>No hay seguimientos pendientes. ¡Buen trabajo!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      </PageContainer>
    </div>
  )
}

export default ReportsWeekly
