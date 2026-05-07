import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  Cog6ToothIcon as CogIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SunIcon,
  UserGroupIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../../lib/useAppData'
import { useTheme } from '../../lib/useTheme'

interface Command {
  id: string
  title: string
  description?: string
  icon: React.ElementType
  category: 'Navegacion' | 'Acciones' | 'Resultados'
  onSelect: () => void
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { distributors, candidates, leads, sales, tasks } = useAppData()
  const { isDark, toggle } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen((open) => !open)
      }
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleOpenEvent = () => setIsOpen(true)

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('open-command-palette', handleOpenEvent)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('open-command-palette', handleOpenEvent)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const commands = useMemo((): Command[] => {
    const staticCommands: Command[] = [
      {
        id: 'nav-dash',
        title: 'Ir a Dashboard',
        description: 'Vista general ejecutiva',
        icon: HomeIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/')
      },
      {
        id: 'nav-kanban',
        title: 'Ir a Pipeline',
        description: 'Flujo de ventas Kanban',
        icon: ChartBarIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/kanban')
      },
      {
        id: 'nav-dist',
        title: 'Ir a Distribuidores',
        description: 'Red de distribución comercial',
        icon: UsersIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/distributors')
      },
      {
        id: 'nav-leads',
        title: 'Ir a Leads',
        description: 'Prospectos Google Maps',
        icon: IdentificationIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/leads')
      },
      {
        id: 'nav-visits',
        title: 'Ir a Visitas',
        description: 'Calendario de visitas',
        icon: CalendarIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/visits')
      },
      {
        id: 'nav-sales',
        title: 'Ir a Pedidos',
        description: 'Control de activaciones',
        icon: ShoppingBagIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/sales')
      },
      {
        id: 'nav-cand',
        title: 'Ir a Candidatos',
        description: 'Reclutamiento activo',
        icon: UserGroupIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/candidates')
      },
      {
        id: 'nav-import',
        title: 'Ir a Importar Datos',
        description: 'Carga masiva Excel/CSV',
        icon: ArrowUpTrayIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/import')
      },
      {
        id: 'nav-report',
        title: 'Ir a Reportes',
        description: 'Métricas semanales',
        icon: DocumentTextIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/reports')
      },
      {
        id: 'nav-settings',
        title: 'Ir a Configuración',
        description: 'Preferencias del sistema',
        icon: CogIcon,
        category: 'Navegacion',
        onSelect: () => navigate('/settings')
      },
      {
        id: 'action-theme',
        title: `Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`,
        description: 'Ajustar apariencia visual',
        icon: isDark ? SunIcon : MoonIcon,
        category: 'Acciones',
        onSelect: () => toggle()
      }
    ]

    const entityResults: Command[] = []

    if (query.length > 1) {
      const lowerQuery = query.toLowerCase()

      distributors
        .filter(
          (d) =>
            d.name.toLowerCase().includes(lowerQuery) ||
            d.code.toLowerCase().includes(lowerQuery) ||
            d.city?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 4)
        .forEach((d) =>
          entityResults.push({
            id: `dist-${d.id}`,
            title: d.name,
            description: `Distribuidor · ${d.city || '—'} · ${d.status === 'active' ? 'Activo' : 'Pendiente'}`,
            icon: UsersIcon,
            category: 'Resultados',
            onSelect: () => navigate(`/distributors/${d.id}`)
          })
        )

      candidates
        .filter(
          (c) =>
            c.name.toLowerCase().includes(lowerQuery) ||
            c.city?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 4)
        .forEach((c) =>
          entityResults.push({
            id: `cand-${c.id}`,
            title: c.name,
            description: `Candidato · ${c.city || '—'} · ${c.stage}`,
            icon: UserGroupIcon,
            category: 'Resultados',
            onSelect: () => navigate(`/candidates/${c.id}`)
          })
        )

      sales
        .filter(
          (s) =>
            s.nombreCliente?.toLowerCase().includes(lowerQuery) ||
            s.distributorName?.toLowerCase().includes(lowerQuery) ||
            s.documento?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 3)
        .forEach((s) =>
          entityResults.push({
            id: `sale-${s.id}`,
            title: s.nombreCliente || s.distributorName || 'Venta',
            description: `Venta · ${s.brand || '—'} · ${s.status}`,
            icon: ShoppingBagIcon,
            category: 'Resultados',
            onSelect: () => navigate('/sales')
          })
        )

      tasks
        .filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.description?.toLowerCase().includes(lowerQuery)
        )
        .filter((t) => t.status !== 'completed')
        .slice(0, 3)
        .forEach((t) =>
          entityResults.push({
            id: `task-${t.id}`,
            title: t.title,
            description: `Tarea · ${t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'} · ${t.status === 'pending' ? 'Pendiente' : 'En progreso'}`,
            icon: CheckCircleIcon,
            category: 'Resultados',
            onSelect: () => navigate('/tasks')
          })
        )

      leads
        .filter(
          (l) =>
            l.nombre.toLowerCase().includes(lowerQuery) ||
            l.ciudad?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 3)
        .forEach((l) =>
          entityResults.push({
            id: `lead-${l.id}`,
            title: l.nombre,
            description: `Lead · ${l.ciudad || 'Sin ciudad'}`,
            icon: IdentificationIcon,
            category: 'Resultados',
            onSelect: () => navigate('/leads')
          })
        )
    }

    const filteredStatic = query
      ? staticCommands.filter(
          (command) =>
            command.title.toLowerCase().includes(query.toLowerCase()) ||
            command.description?.toLowerCase().includes(query.toLowerCase())
        )
      : staticCommands

    return [...filteredStatic, ...entityResults]
  }, [
    query,
    navigate,
    distributors,
    candidates,
    leads,
    sales,
    tasks,
    isDark,
    toggle
  ])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % commands.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (commands[selectedIndex]) {
        commands[selectedIndex].onSelect()
        setIsOpen(false)
      }
    }
  }

  useEffect(() => {
    const activeElement = document.getElementById(`command-${selectedIndex}`)
    if (activeElement && scrollRef.current) {
      const parentRect = scrollRef.current.getBoundingClientRect()
      const itemRect = activeElement.getBoundingClientRect()

      if (itemRect.bottom > parentRect.bottom) {
        activeElement.scrollIntoView({ block: 'end', behavior: 'smooth' })
      } else if (itemRect.top < parentRect.top) {
        activeElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  }, [selectedIndex])

  if (!isOpen) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[15vh]">
      <div
        className="pointer-events-auto fixed inset-0 bg-slate-950/50 animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="pointer-events-auto relative flex max-h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-slide-up dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex items-center border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <MagnifyingGlassIcon className="mr-3 h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            className="w-full border-none bg-transparent text-base font-medium text-slate-900 outline-none placeholder-slate-400 dark:text-white"
            placeholder="Escribe para buscar..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="ml-4 hidden h-6 w-6 items-center justify-center rounded border border-slate-200 bg-slate-50 text-[10px] font-semibold text-slate-500 sm:inline-flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        <div
          ref={scrollRef}
          className="custom-scrollbar flex-1 overflow-y-auto py-3"
        >
          {commands.length === 0 ? (
            <div className="py-12 text-center">
              <SparklesIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="font-medium tracking-tight text-slate-400">
                No se encontraron comandos o resultados
              </p>
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {(['Navegacion', 'Acciones', 'Resultados'] as const).map(
                (category) => {
                  const categoryCommands = commands.filter(
                    (command) => command.category === category
                  )

                  if (categoryCommands.length === 0) return null

                  return (
                    <div key={category} className="mb-4">
                      <div className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        {category}
                      </div>
                      {categoryCommands.map((command) => {
                        const absoluteIndex = commands.indexOf(command)
                        const isSelected = selectedIndex === absoluteIndex

                        return (
                          <button
                            key={command.id}
                            id={`command-${absoluteIndex}`}
                            onClick={() => {
                              command.onSelect()
                              setIsOpen(false)
                            }}
                            onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                            className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors duration-150 ${
                              isSelected
                                ? 'bg-gray-100 dark:bg-slate-800'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div
                              className={`rounded-lg p-2.5 ${
                                isSelected
                                  ? 'bg-white text-indigo-600 dark:bg-slate-700 dark:text-indigo-400'
                                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              <command.icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  isSelected
                                    ? 'text-slate-900 dark:text-white'
                                    : 'text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {command.title}
                              </p>
                              {command.description && (
                                <p
                                  className={`truncate text-xs ${
                                    isSelected
                                      ? 'text-slate-500 dark:text-slate-400'
                                      : 'text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  {command.description}
                                </p>
                              )}
                            </div>
                            {isSelected && (
                              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Enter
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                }
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ↑↓
              </kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                ↵
              </kbd>
              Seleccionar
            </span>
          </div>
          <div>Busqueda</div>
        </div>
      </div>
    </div>
  )
}
