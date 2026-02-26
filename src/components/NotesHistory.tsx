import React, { useState, useMemo } from 'react'
import {
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  CalendarIcon,
  EnvelopeIcon,
  UsersIcon,
  DocumentTextIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import type { NoteEntry, NoteCategory } from '../lib/types'

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
  reunion: { icon: UsersIcon, color: 'text-indigo-500', label: 'Reunión' },
  general: { icon: DocumentTextIcon, color: 'text-gray-500', label: 'General' }
}

const NotesHistory: React.FC<NotesHistoryProps> = ({
  history = [],
  onAddNote,
  loading = false,
  placeholder = 'Añade notas sobre visitas, llamadas o seguimiento...',
  title = 'Notas comerciales'
}) => {
  const [newNote, setNewNote] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
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
    } else if (diffInDays === 1) {
      return `Ayer ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} días`
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const isInDateRange = (timestamp: string, filter: DateFilter): boolean => {
    if (filter === 'todo') return true

    const noteDate = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - noteDate.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

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
              className="bg-yellow-200 dark:bg-yellow-600/40 px-0.5 rounded"
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

  const filteredHistory = useMemo(() => {
    return history.filter((note) => {
      if (!isInDateRange(note.timestamp, dateFilter)) return false
      if (categoryFilter !== 'todas' && note.category !== categoryFilter)
        return false
      if (
        searchTerm.trim() &&
        !note.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false
      return true
    })
  }, [history, dateFilter, categoryFilter, searchTerm])

  const CategoryIcon = categoryConfig[selectedCategory].icon

  return (
    <article className="rounded-3xl border border-white/40 dark:border-gray-700/40 bg-white/95 dark:bg-gray-800/95 p-6 shadow-xl backdrop-blur">
      <header className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-pastel-indigo text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
          className="w-full rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition focus:border-pastel-indigo focus:bg-white dark:focus:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-pastel-indigo/20 disabled:opacity-50"
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Presiona{' '}
            <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              Ctrl
            </kbd>{' '}
            +{' '}
            <kbd className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              Enter
            </kbd>{' '}
            para guardar
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newNote.trim() || loading || isSaving}
            className="inline-flex items-center gap-2 rounded-2xl bg-pastel-indigo px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-pastel-indigo/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CategoryIcon className="h-4 w-4" />
            {isSaving ? 'Guardando...' : 'Añadir nota'}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-pastel-indigo" />
            Historial ({filteredHistory.length}
            {filteredHistory.length !== history.length
              ? ` de ${history.length}`
              : ''}
            )
          </h3>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
              showFilters ||
              dateFilter !== 'todo' ||
              categoryFilter !== 'todas' ||
              searchTerm
                ? 'bg-pastel-indigo text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <FunnelIcon className="h-3.5 w-3.5" />
            Filtros
          </button>
        </div>
        {showFilters && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar en notas
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por contenido..."
                  className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-pastel-indigo focus:ring-2 focus:ring-pastel-indigo/20 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Limpiar búsqueda"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <div className="flex flex-wrap gap-2">
                {(['hoy', 'semana', 'mes', 'todo'] as DateFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setDateFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        dateFilter === filter
                          ? 'bg-pastel-indigo text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de nota
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('todas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    categoryFilter === 'todas'
                      ? 'bg-pastel-indigo text-white shadow-md'
                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        categoryFilter === cat
                          ? 'bg-pastel-indigo text-white shadow-md'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
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
                className="w-full px-3 py-2 rounded-xl text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition"
              >
                Limpiar todos los filtros
              </button>
            )}
          </div>
        )}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            {history.length === 0
              ? 'No hay notas registradas aún. Añade la primera nota arriba.'
              : 'No se encontraron notas con los filtros aplicados.'}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {[...filteredHistory].reverse().map((entry) => {
              const category = entry.category || 'general'
              const config = categoryConfig[category]
              const Icon = config.icon
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 p-4 transition hover:border-pastel-indigo/40 dark:hover:border-pastel-indigo/40"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span className={`text-xs font-medium ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-xs font-semibold text-pastel-indigo">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.author && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.author}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
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
