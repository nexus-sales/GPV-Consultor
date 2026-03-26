import React, { useMemo, useState } from 'react'
import {
  CalendarIcon,
  CurrencyEuroIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline'
import type { Visit, Sale, NoteEntry } from '../lib/types'

// ─── Tipos internos ────────────────────────────────────────────────────────────

type EventType = 'visit' | 'sale' | 'note'
type FilterType = 'all' | EventType

interface TimelineItem {
  id: string
  type: EventType
  date: string
  title: string
  subtitle?: string
  body?: string
  extra?: string
  badges: Array<{ label: string; value: string }>
}

interface EntityTimelineProps {
  visits?: Visit[]
  sales?: Sale[]
  notes?: NoteEntry[]
  formatRelative: (date: string) => string
  emptyLabel?: string
}

// ─── Helpers visuales ──────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  EventType,
  { label: string; dotClass: string; iconClass: string; badgeClass: string }
> = {
  visit: {
    label: 'Visita',
    dotClass: 'bg-indigo-600 ring-indigo-200',
    iconClass: 'text-indigo-600 bg-indigo-50',
    badgeClass: 'bg-indigo-50 text-indigo-600'
  },
  sale: {
    label: 'Venta',
    dotClass: 'bg-emerald-500 ring-emerald-200',
    iconClass: 'text-emerald-600 bg-emerald-50',
    badgeClass: 'bg-emerald-50 text-emerald-600'
  },
  note: {
    label: 'Nota',
    dotClass: 'bg-amber-500 ring-amber-200',
    iconClass: 'text-amber-600 bg-amber-50',
    badgeClass: 'bg-amber-50 text-amber-600'
  }
}

const NOTE_ICONS: Record<string, React.ElementType> = {
  visita: CalendarIcon,
  llamada: PhoneIcon,
  email: EnvelopeIcon,
  reunion: UserGroupIcon,
  general: DocumentTextIcon
}

function getDateGroup(dateStr: string): string {
  if (!dateStr) return 'Sin fecha'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'Sin fecha'
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (diffDays < 7) return 'Esta semana'
  if (diffDays < 30) return 'Este mes'
  if (diffDays < 90) return 'Últimos 3 meses'
  return 'Más de 3 meses'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// ─── Conversores ───────────────────────────────────────────────────────────────

function visitToItem(v: Visit): TimelineItem {
  const visitTypeLabel: Record<string, string> = {
    presentacion: 'Presentación',
    seguimiento: 'Seguimiento',
    formacion: 'Formación',
    incidencias: 'Incidencias',
    apertura: 'Apertura'
  }
  const resultLabel: Record<string, string> = {
    completada: 'Completada',
    pendiente: 'Pendiente',
    reprogramar: 'Reprogramar',
    cancelada: 'Cancelada'
  }
  return {
    id: `visit-${v.id}`,
    type: 'visit',
    date: v.date,
    title: `Visita de ${visitTypeLabel[v.type] ?? v.type}`,
    subtitle: v.objective || undefined,
    body: v.summary || undefined,
    extra: v.nextSteps || undefined,
    badges: [
      { label: 'Resultado', value: resultLabel[v.result] ?? v.result },
      ...(v.durationMinutes
        ? [{ label: 'Duración', value: `${v.durationMinutes} min` }]
        : [])
    ]
  }
}

function saleToItem(s: Sale): TimelineItem {
  const statusColors: Record<string, string> = {
    Activado: '🟢',
    Aceptado: '🔵',
    Enviado: '🟡',
    Pendiente: '🟠',
    Scoring: '🔷',
    Baja: '🔴'
  }
  return {
    id: `sale-${s.id}`,
    type: 'sale',
    date: s.fechaCierre || s.date,
    title: s.nombreCliente ? `Cliente: ${s.nombreCliente}` : 'Venta registrada',
    subtitle: `${s.sector}${s.modo ? ` · ${s.modo}` : ''}`,
    body: s.observaciones || s.notes || undefined,
    badges: [
      {
        label: 'Estado',
        value: `${statusColors[s.status] ?? ''} ${s.status}`.trim()
      },
      ...(s.documento ? [{ label: 'Doc', value: s.documento }] : []),
      ...(s.operations ? [{ label: 'Ops', value: String(s.operations) }] : [])
    ]
  }
}

function noteToItem(n: NoteEntry): TimelineItem {
  const catLabel: Record<string, string> = {
    visita: 'Visita',
    llamada: 'Llamada',
    email: 'Email',
    reunion: 'Reunión',
    general: 'Nota'
  }
  return {
    id: `note-${n.id}`,
    type: 'note',
    date: n.timestamp,
    title: n.title || (n.category ? catLabel[n.category] : 'Nota'),
    body: n.content,
    badges: [
      ...(n.category
        ? [{ label: 'Tipo', value: catLabel[n.category] ?? n.category }]
        : []),
      ...(n.author ? [{ label: 'Autor', value: n.author }] : [])
    ]
  }
}

// ─── Subcomponente: ítem expandible ───────────────────────────────────────────

const TimelineItemCard: React.FC<{
  item: TimelineItem
  relative: string
  isLast: boolean
}> = ({ item, relative, isLast }) => {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[item.type]
  const NoteIcon =
    item.type === 'note'
      ? (NOTE_ICONS[
          (
            item.badges.find((b) => b.label === 'Tipo')?.value ?? ''
          ).toLowerCase()
        ] ?? DocumentTextIcon)
      : item.type === 'visit'
        ? CalendarIcon
        : CurrencyEuroIcon

  const hasExpandable = Boolean(item.body || item.extra)

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Línea vertical */}
      {!isLast && (
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Dot */}
      <div className="relative z-10 flex-shrink-0 mt-1">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-800 ${config.dotClass}`}
        >
          <NoteIcon className="h-4 w-4 text-white" />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div
          className={`rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm ${hasExpandable ? 'cursor-pointer hover:border-gray-200 dark:hover:border-gray-600 transition-colors' : ''}`}
          onClick={hasExpandable ? () => setExpanded((e) => !e) : undefined}
        >
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${config.badgeClass}`}
                >
                  {config.label}
                </span>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {item.title}
                </p>
              </div>
              {item.subtitle && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {item.subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <p className="text-[11px] font-medium text-gray-400">
                  {relative}
                </p>
                <p className="text-[10px] text-gray-300 dark:text-gray-600">
                  {formatDate(item.date)}
                </p>
              </div>
              {hasExpandable &&
                (expanded ? (
                  <ChevronUpIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ))}
            </div>
          </div>

          {/* Body expandible */}
          {expanded && (
            <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-gray-700 pt-3">
              {item.body && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Resumen
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.body}
                  </p>
                </div>
              )}
              {item.extra && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                    Próximos pasos
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.extra}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Badges de metadata */}
          {item.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] text-gray-600 dark:text-gray-400"
                >
                  <span className="font-semibold">{b.label}:</span>
                  <span>{b.value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────

const FILTER_OPTIONS: Array<{ value: FilterType; label: string }> = [
  { value: 'all', label: 'Todo' },
  { value: 'visit', label: 'Visitas' },
  { value: 'sale', label: 'Ventas' },
  { value: 'note', label: 'Notas' }
]

const PAGE_SIZE = 10

const EntityTimeline: React.FC<EntityTimelineProps> = ({
  visits = [],
  sales = [],
  notes = [],
  formatRelative,
  emptyLabel = 'Sin actividad registrada todavía.'
}) => {
  const [filter, setFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)

  const allItems = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [
      ...visits.map(visitToItem),
      ...sales.map(saleToItem),
      ...notes.map(noteToItem)
    ]
    return items.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  }, [visits, sales, notes])

  const filtered = useMemo(
    () =>
      filter === 'all' ? allItems : allItems.filter((i) => i.type === filter),
    [allItems, filter]
  )

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  // Conteos por tipo para las tabs
  const counts = useMemo(
    () => ({
      all: allItems.length,
      visit: allItems.filter((i) => i.type === 'visit').length,
      sale: allItems.filter((i) => i.type === 'sale').length,
      note: allItems.filter((i) => i.type === 'note').length
    }),
    [allItems]
  )

  // Grupos por período
  const grouped = useMemo(() => {
    const groups: Array<{ label: string; items: TimelineItem[] }> = []
    const groupMap = new Map<string, TimelineItem[]>()
    const ORDER = [
      'Esta semana',
      'Este mes',
      'Últimos 3 meses',
      'Más de 3 meses',
      'Sin fecha'
    ]

    for (const item of visible) {
      const group = getDateGroup(item.date)
      if (!groupMap.has(group)) groupMap.set(group, [])
      groupMap.get(group)!.push(item)
    }

    for (const label of ORDER) {
      if (groupMap.has(label)) {
        groups.push({ label, items: groupMap.get(label)! })
      }
    }
    return groups
  }, [visible])

  const handleFilterChange = (value: FilterType) => {
    setFilter(value)
    setPage(1)
  }

  return (
    <div>
      {/* Tabs de filtro */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const count = counts[opt.value]
          if (opt.value !== 'all' && count === 0) return null
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleFilterChange(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === opt.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {opt.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  filter === opt.value
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista o empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 p-10 text-center">
          <CalendarIcon className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {emptyLabel}
          </p>
        </div>
      ) : (
        <div>
          {grouped.map((group) => (
            <div key={group.label} className="mb-2">
              {/* Separador de grupo */}
              <div className="mb-3 flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  {group.label}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
              </div>

              {/* Ítems del grupo */}
              <div className="ml-1">
                {group.items.map((item, idx) => (
                  <TimelineItemCard
                    key={item.id}
                    item={item}
                    relative={formatRelative(item.date)}
                    isLast={
                      idx === group.items.length - 1 &&
                      group === grouped[grouped.length - 1]
                    }
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Paginación */}
          {hasMore && (
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              className="mt-2 w-full rounded-xl border border-dashed border-gray-200 dark:border-gray-600 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-indigo-400/40 hover:text-indigo-600 transition-colors"
            >
              Ver más ({filtered.length - visible.length} restantes)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default EntityTimeline
