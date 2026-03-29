import React, { useMemo, useState } from 'react'
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  UsersIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { NoteCategory, NoteEntry } from '../lib/types'

interface NotesHistoryProps {
  history: NoteEntry[]
  onAddNote: (content: string, category?: NoteCategory) => void
  loading?: boolean
  placeholder?: string
  title?: string
}

type DateFilter = 'hoy' | 'semana' | 'mes' | 'todo'

const categoryConfig: Record<
  NoteCategory,
  { icon: typeof PhoneIcon; color: string; label: string }
> = {
  visita: { icon: CalendarIcon, color: 'text-yellow-500', label: 'Visita' },
  llamada: { icon: PhoneIcon, color: 'text-green-500', label: 'Llamada' },
  email: { icon: EnvelopeIcon, color: 'text-cyan-500', label: 'Email' },
  reunion: { icon: UsersIcon, color: 'text-indigo-500', label: 'Reunion' },
  general: { icon: DocumentTextIcon, color: 'text-gray-500', label: 'General' }
}

const NotesHistory: React.FC<NotesHistoryProps> = ({
  history = [],
  onAddNote,
  loading = false,
  placeholder = 'Anade notas sobre visitas, llamadas o seguimiento...',
  title = 'Notas comerciales'
}) => {
  const [newNote, setNewNote] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<NoteCategory>('general')
  const [dateFilter, setDateFilter] = useState<DateFilter>('todo')
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | 'todas'>(
    'todas'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSubmit = async (): Promise<void> => {
    if (!newNote.trim()) return

    setIsSaving(true)
    await onAddNote(newNote.trim(), selectedCategory)
    setNewNote('')
    setSelectedCategory('general')
    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return `Hoy ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffInDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    }
    if (diffInDays < 7) {
      return `Hace ${diffInDays} dias`
    }

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isInDateRange = (timestamp: string, filter: DateFilter): boolean => {
    if (filter === 'todo') return true

    const noteDate = new Date(timestamp)
    const now = new Date()
    const diffDays =
      (now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24)

    switch (filter) {
      case 'hoy':
        return diffDays < 1
      case 'semana':
        return diffDays < 7
      case 'mes':
        return diffDays < 30
      default:
        return true
    }
  }

  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text

    const regex = new RegExp(
      `(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    )
    const parts = text.split(regex)

    return (
      <>
        {parts.map((part, i) =>
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

  const filteredHistory = useMemo(
    () =>
      history.filter((note) => {
        if (!isInDateRange(note.timestamp, dateFilter)) return false
        if (categoryFilter !== 'todas' && note.category !== categoryFilter) {
          return false
        }
        if (
          searchTerm.trim() &&
          !note.content.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false
        }
        return true
      }),
    [history, dateFilter, categoryFilter, searchTerm]
  )

  const CategoryIcon = categoryConfig[selectedCategory].icon

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Registra el seguimiento de visitas, llamadas y gestiones
        </p>
      </header>

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
            const config = categoryConfig[cat]
            const Icon = config.icon
            const isSelected = selectedCategory === cat

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700/50 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
              </button>
            )
          })}
        </div>

        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading || isSaving}
          rows={3}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-gray-700"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Presiona{' '}
            <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="rounded border border-gray-300 bg-gray-100 px-2 py-0.5 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
              Enter
            </kbd>{' '}
            para guardar
          </p>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newNote.trim() || loading || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CategoryIcon className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Añadir nota'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <ClockIcon className="h-4 w-4 text-indigo-500" />
            Historial ({filteredHistory.length}
            {filteredHistory.length !== history.length
              ? ` de ${history.length}`
              : ''}
            )
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
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/30">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Buscar en notas
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por contenido..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Limpiar busqueda"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Periodo
              </label>
              <div className="flex flex-wrap gap-2">
                {(['hoy', 'semana', 'mes', 'todo'] as DateFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDateFilter(filter)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        dateFilter === filter
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter === 'hoy' && 'Hoy'}
                      {filter === 'semana' && 'Esta semana'}
                      {filter === 'mes' && 'Este mes'}
                      {filter === 'todo' && 'Todo'}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Tipo de nota
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('todas')}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                    categoryFilter === 'todas'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`}
                >
                  Todas
                </button>

                {(Object.keys(categoryConfig) as NoteCategory[]).map((cat) => {
                  const config = categoryConfig[cat]
                  const Icon = config.icon

                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </button>
                  )
                })}
              </div>
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
                className="w-full rounded-xl bg-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}

        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            {history.length === 0
              ? 'No hay notas registradas aun. Anade la primera nota arriba.'
              : 'No se encontraron notas con los filtros aplicados.'}
          </div>
        ) : (
          <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
            {[...filteredHistory].reverse().map((entry) => {
              const category = entry.category || 'general'
              const config = categoryConfig[category]
              const Icon = config.icon

              return (
                <div
                  key={entry.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-indigo-200 dark:border-gray-700 dark:bg-gray-700/30 dark:hover:border-indigo-500/30"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className={`text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-semibold text-indigo-600">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.author && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.author}
                      </span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {highlightText(entry.content, searchTerm)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </article>
  )
}

export default NotesHistory
