import React, { useMemo, useState } from 'react'
import {
  ArrowRightCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import type {
  NoteCategory,
  NoteEntry,
  NoteOutcome,
  NoteStatus
} from '../lib/types'

interface NotesHistoryProps {
  history: NoteEntry[]
  onAddNote: (entry: Omit<NoteEntry, 'id' | 'timestamp' | 'author'>) => void
  onUpdateNote?: (id: string, updates: Partial<NoteEntry>) => void
  loading?: boolean
  placeholder?: string
  title?: string
}

type DateFilter = 'hoy' | 'semana' | 'mes' | 'todo'

interface FormState {
  content: string
  category: NoteCategory
  status: NoteStatus
  outcome: NoteOutcome | ''
  scheduledDate: string
  scheduledTime: string
  nextAction: string
  nextActionDate: string
}

const categoryConfig: Record<
  NoteCategory,
  {
    icon: typeof PhoneIcon
    color: string
    bg: string
    border: string
    label: string
  }
> = {
  visita: {
    icon: CalendarIcon,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    label: 'Visita'
  },
  llamada: {
    icon: PhoneIcon,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    label: 'Llamada'
  },
  email: {
    icon: EnvelopeIcon,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    label: 'Email'
  },
  reunion: {
    icon: UsersIcon,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    label: 'Reunión'
  },
  general: {
    icon: DocumentTextIcon,
    color: 'text-gray-500 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    label: 'General'
  }
}

const statusConfig: Record<NoteStatus, { label: string; color: string }> = {
  pending: {
    label: 'Pendiente',
    color:
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  },
  completed: {
    label: 'Completado',
    color:
      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  },
  postponed: {
    label: 'Pospuesto',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
  }
}

const outcomeConfig: Record<NoteOutcome, { label: string; dot: string }> = {
  positive: { label: 'Positivo', dot: 'bg-green-500' },
  negative: { label: 'Negativo', dot: 'bg-red-500' },
  neutral: { label: 'Neutro', dot: 'bg-gray-400' },
  in_progress: { label: 'En curso', dot: 'bg-blue-500' }
}

const todayIso = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatTimestamp = (iso: string): string => {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)

  const time = d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  if (diffDays === 0) return `Hoy ${time}`
  if (diffDays === 1) return `Ayer ${time}`
  if (diffDays < 7) {
    return d.toLocaleDateString('es-ES', { weekday: 'short' }) + ` ${time}`
  }
  return (
    d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }) + ` ${time}`
  )
}

const groupLabel = (iso: string): string => {
  const d = new Date(iso)
  const dayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = todayIso()
  const yesterdayD = new Date()
  yesterdayD.setDate(yesterdayD.getDate() - 1)
  const yesterday = `${yesterdayD.getFullYear()}-${String(yesterdayD.getMonth() + 1).padStart(2, '0')}-${String(yesterdayD.getDate()).padStart(2, '0')}`

  if (dayStr === today) return 'Hoy'
  if (dayStr === yesterday) return 'Ayer'

  const label = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const isInDateRange = (timestamp: string, filter: DateFilter): boolean => {
  if (filter === 'todo') return true
  const diffDays = (Date.now() - new Date(timestamp).getTime()) / 86400000
  if (filter === 'hoy') return diffDays < 1
  if (filter === 'semana') return diffDays < 7
  if (filter === 'mes') return diffDays < 30
  return true
}

const highlightText = (text: string, search: string) => {
  if (!search.trim()) return <>{text}</>
  const regex = new RegExp(
    `(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )
  return (
    <>
      {text.split(regex).map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-600/40"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

const defaultForm = (): FormState => ({
  content: '',
  category: 'general',
  status: 'pending',
  outcome: '',
  scheduledDate: todayIso(),
  scheduledTime: '',
  nextAction: '',
  nextActionDate: ''
})

const NotesHistory: React.FC<NotesHistoryProps> = ({
  history = [],
  onAddNote,
  onUpdateNote,
  loading = false,
  placeholder = 'Describe la actividad, acuerdos alcanzados, próximos pasos...',
  title = 'Actividad comercial'
}) => {
  const [form, setForm] = useState<FormState>(defaultForm)
  const [isSaving, setIsSaving] = useState(false)
  const [dateFilter, setDateFilter] = useState<DateFilter>('todo')
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'todas'>(
    'todas'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = async (): Promise<void> => {
    if (!form.content.trim()) return
    setIsSaving(true)
    await onAddNote({
      title: categoryConfig[form.category].label,
      content: form.content.trim(),
      category: form.category,
      status: form.status,
      outcome: form.outcome || undefined,
      scheduledDate: form.scheduledDate || undefined,
      scheduledTime: form.scheduledTime || undefined,
      nextAction: form.nextAction.trim() || undefined,
      nextActionDate: form.nextActionDate || undefined
    })
    setForm(defaultForm())
    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleComplete = (id: string): void => {
    onUpdateNote?.(id, { status: 'completed' })
  }

  // ── KPIs ────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = history.length
    const pending = history.filter(
      (n) => !n.status || n.status === 'pending'
    ).length
    const weekAgo = Date.now() - 7 * 86400000
    const thisWeekNotes = history.filter(
      (n) => new Date(n.timestamp).getTime() > weekAgo
    )
    const completedWeek = thisWeekNotes.filter(
      (n) => n.status === 'completed'
    ).length
    const withOutcome = history.filter(
      (n) => n.outcome && n.outcome !== 'in_progress'
    ).length
    const positive = history.filter((n) => n.outcome === 'positive').length
    const successRate =
      withOutcome > 0 ? Math.round((positive / withOutcome) * 100) : null

    return { total, pending, completedWeek, successRate }
  }, [history])

  // ── Filtered + grouped ───────────────────────────────────────────────────
  const filteredHistory = useMemo(
    () =>
      history.filter((n) => {
        if (!isInDateRange(n.timestamp, dateFilter)) return false
        if (categoryFilter !== 'todas' && n.category !== categoryFilter)
          return false
        if (
          searchTerm.trim() &&
          !n.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
          return false
        return true
      }),
    [history, dateFilter, categoryFilter, searchTerm]
  )

  const groupedTimeline = useMemo(() => {
    const sorted = [...filteredHistory].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const groups: { label: string; entries: NoteEntry[] }[] = []
    const seen = new Map<string, NoteEntry[]>()
    for (const entry of sorted) {
      const label = groupLabel(entry.timestamp)
      if (!seen.has(label)) {
        seen.set(label, [])
        groups.push({ label, entries: seen.get(label)! })
      }
      seen.get(label)!.push(entry)
    }
    return groups
  }, [filteredHistory])

  const CategoryIcon = categoryConfig[form.category].icon

  const inputCls =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700'

  const selectCls =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white'

  return (
    <article className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-6 py-4 dark:border-gray-700">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      </header>

      {/* ── KPI strip ── */}
      {history.length > 0 && (
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 dark:divide-gray-700 dark:border-gray-700">
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {kpis.total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p
              className={`text-lg font-bold ${kpis.pending > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}
            >
              {kpis.pending}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pendientes
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {kpis.completedWeek}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Esta semana
            </p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {kpis.successRate !== null ? `${kpis.successRate}%` : '—'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Éxito</p>
          </div>
        </div>
      )}

      {/* ── Form ── */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        {/* Category selector */}
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
            const cfg = categoryConfig[cat]
            const Icon = cfg.icon
            const active = form.category === cat
            return (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', cat)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cfg.label}
              </button>
            )
          })}
        </div>

        {/* Textarea */}
        <textarea
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading || isSaving}
          rows={3}
          className={inputCls}
        />

        {/* Metadata fields */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Fecha programada
            </label>
            <input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => set('scheduledDate', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Hora
            </label>
            <input
              type="time"
              value={form.scheduledTime}
              onChange={(e) => set('scheduledTime', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as NoteStatus)}
              className={selectCls}
            >
              <option value="pending">Pendiente</option>
              <option value="completed">Completado</option>
              <option value="postponed">Pospuesto</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Resultado
            </label>
            <select
              value={form.outcome}
              onChange={(e) =>
                set('outcome', e.target.value as NoteOutcome | '')
              }
              className={selectCls}
            >
              <option value="">Sin resultado</option>
              <option value="positive">Positivo</option>
              <option value="negative">Negativo</option>
              <option value="neutral">Neutro</option>
              <option value="in_progress">En curso</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Próxima acción
            </label>
            <input
              type="text"
              value={form.nextAction}
              onChange={(e) => set('nextAction', e.target.value)}
              placeholder="Ej: Enviar propuesta, Llamar la semana..."
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Fecha próxima acción
            </label>
            <input
              type="date"
              value={form.nextActionDate}
              onChange={(e) => set('nextActionDate', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="rounded border border-gray-300 bg-gray-100 px-1.5 py-0.5 text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Enter
            </kbd>{' '}
            para guardar
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!form.content.trim() || loading || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CategoryIcon className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Registrar actividad'}
          </button>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="p-6">
        {/* Timeline header + filters */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ClockIcon className="h-4 w-4 text-indigo-500" />
            Historial
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {filteredHistory.length}
              {filteredHistory.length !== history.length
                ? ` / ${history.length}`
                : ''}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
              showFilters ||
              dateFilter !== 'todo' ||
              categoryFilter !== 'todas' ||
              searchTerm
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="h-3.5 w-3.5" />
            Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar en notas..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(['hoy', 'semana', 'mes', 'todo'] as DateFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDateFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    dateFilter === f
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  {f === 'hoy'
                    ? 'Hoy'
                    : f === 'semana'
                      ? 'Semana'
                      : f === 'mes'
                        ? 'Mes'
                        : 'Todo'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('todas')}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${categoryFilter === 'todas' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}`}
              >
                Todas
              </button>
              {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
                const cfg = categoryConfig[cat]
                const Icon = cfg.icon
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                )
              })}
            </div>

            {(dateFilter !== 'todo' ||
              categoryFilter !== 'todas' ||
              searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('todo')
                  setCategoryFilter('todas')
                  setSearchTerm('')
                }}
                className="w-full rounded-xl bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Timeline groups */}
        {groupedTimeline.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
            {history.length === 0
              ? 'Sin actividad registrada. Añade la primera arriba.'
              : 'No hay resultados con los filtros aplicados.'}
          </div>
        ) : (
          <div className="max-h-[520px] space-y-6 overflow-y-auto pr-1">
            {groupedTimeline.map(({ label, entries }) => (
              <div key={label}>
                {/* Date separator */}
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    {label}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                </div>

                <div className="space-y-3">
                  {entries.map((entry) => {
                    const cat = entry.category ?? 'general'
                    const cfg = categoryConfig[cat]
                    const Icon = cfg.icon
                    const status = entry.status
                    const outcome = entry.outcome
                    const isCompleted = status === 'completed'

                    return (
                      <div
                        key={entry.id}
                        className={`rounded-xl border p-4 transition ${cfg.border} ${cfg.bg} ${isCompleted ? 'opacity-75' : ''}`}
                      >
                        {/* Card header */}
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm dark:bg-gray-800`}
                            >
                              <Icon className={`h-4 w-4 ${cfg.color}`} />
                            </div>
                            <span
                              className={`text-sm font-semibold ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                            {status && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[status].color}`}
                              >
                                {statusConfig[status].label}
                              </span>
                            )}
                            {outcome && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${outcomeConfig[outcome].dot}`}
                                />
                                {outcomeConfig[outcome].label}
                              </span>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                            {!isCompleted && onUpdateNote && (
                              <button
                                type="button"
                                onClick={() => handleComplete(entry.id)}
                                title="Marcar como completado"
                                className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-green-600 shadow-sm transition hover:bg-green-50 hover:text-green-700 dark:bg-gray-700 dark:text-green-400 dark:hover:bg-green-900/20"
                              >
                                <CheckCircleIcon className="h-3.5 w-3.5" />
                                Completar
                              </button>
                            )}
                            {isCompleted && (
                              <CheckCircleSolid className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                          {highlightText(entry.content, searchTerm)}
                        </p>

                        {/* Footer: scheduled + next action */}
                        {(entry.scheduledDate ||
                          entry.scheduledTime ||
                          entry.nextAction ||
                          entry.nextActionDate) && (
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-black/5 pt-2 dark:border-white/5">
                            {(entry.scheduledDate || entry.scheduledTime) && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {entry.scheduledDate
                                  ? new Date(
                                      entry.scheduledDate + 'T12:00:00'
                                    ).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short'
                                    })
                                  : ''}
                                {entry.scheduledTime
                                  ? ` ${entry.scheduledTime}`
                                  : ''}
                              </span>
                            )}
                            {entry.nextAction && (
                              <span className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400">
                                <ArrowRightCircleIcon className="h-3.5 w-3.5 shrink-0" />
                                {entry.nextAction}
                                {entry.nextActionDate && (
                                  <span className="text-gray-500 dark:text-gray-400">
                                    ·{' '}
                                    {new Date(
                                      entry.nextActionDate + 'T12:00:00'
                                    ).toLocaleDateString('es-ES', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                  </span>
                                )}
                              </span>
                            )}
                            {entry.author && (
                              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                                {entry.author}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

export default NotesHistory
