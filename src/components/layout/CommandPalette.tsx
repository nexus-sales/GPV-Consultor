import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  IdentificationIcon,
  Cog6ToothIcon as CogIcon,
  MoonIcon,
  SunIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../../lib/useAppData'
import { useTheme } from '../../lib/useTheme'

interface Command {
  id: string
  title: string
  description?: string
  icon: React.ElementType
  category: 'Navegación' | 'Acciones' | 'Resultados'
  onSelect: () => void
  priority?: number
}

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()
  const { distributors, candidates, leads } = useAppData()
  const { isDark, toggle } = useTheme()
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Registrar el atajo global Ctrl+K o Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen((open) => !open)
      }
      if (e.key === 'Escape' && isOpen) {
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

  // Enfocar el input cuando se abre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Lista de comandos estáticos y dinámicos
  const commands = useMemo((): Command[] => {
    const staticCommands: Command[] = [
      {
        id: 'nav-dash',
        title: 'Ir a Dashboard',
        description: 'Vista general ejecutiva',
        icon: HomeIcon,
        category: 'Navegación',
        onSelect: () => navigate('/')
      },
      {
        id: 'nav-kanban',
        title: 'Ir a Pipeline',
        description: 'Flujo de ventas Kanban',
        icon: ChartBarIcon,
        category: 'Navegación',
        onSelect: () => navigate('/kanban')
      },
      {
        id: 'nav-dist',
        title: 'Ir a Distribuidores',
        description: 'Red de distribución comercial',
        icon: UsersIcon,
        category: 'Navegación',
        onSelect: () => navigate('/distributors')
      },
      {
        id: 'nav-leads',
        title: 'Ir a Leads',
        description: 'Prospectos Google Maps',
        icon: IdentificationIcon,
        category: 'Navegación',
        onSelect: () => navigate('/leads')
      },
      {
        id: 'nav-visits',
        title: 'Ir a Visitas',
        description: 'Calendario de visitas',
        icon: CalendarIcon,
        category: 'Navegación',
        onSelect: () => navigate('/visits')
      },
      {
        id: 'nav-sales',
        title: 'Ir a Pedidos',
        description: 'Control de activaciones',
        icon: ShoppingBagIcon,
        category: 'Navegación',
        onSelect: () => navigate('/sales')
      },
      {
        id: 'nav-cand',
        title: 'Ir a Candidatos',
        description: 'Reclutamiento activo',
        icon: UserGroupIcon,
        category: 'Navegación',
        onSelect: () => navigate('/candidates')
      },
      {
        id: 'nav-import',
        title: 'Ir a Importar Datos',
        description: 'Carga masiva Excel/CSV',
        icon: ArrowUpTrayIcon,
        category: 'Navegación',
        onSelect: () => navigate('/import')
      },
      {
        id: 'nav-report',
        title: 'Ir a Reportes',
        description: 'Métricas semanales',
        icon: DocumentTextIcon,
        category: 'Navegación',
        onSelect: () => navigate('/reports')
      },
      {
        id: 'nav-settings',
        title: 'Ir a Configuración',
        description: 'Preferencias del sistema',
        icon: CogIcon,
        category: 'Navegación',
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

    // Comandos dinámicos (búsqueda de entidades)
    const entityResults: Command[] = []

    if (query.length > 1) {
      const lowerQuery = query.toLowerCase()

      // Distribuidores
      distributors
        .filter(
          (d) =>
            d.name.toLowerCase().includes(lowerQuery) ||
            d.code.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
        .forEach((d) =>
          entityResults.push({
            id: `dist-${d.id}`,
            title: d.name,
            description: `Distribuidor · ${d.city}`,
            icon: UsersIcon,
            category: 'Resultados',
            onSelect: () => navigate(`/distributors/${d.id}`)
          })
        )

      // Leads
      leads
        .filter(
          (l) =>
            l.nombre.toLowerCase().includes(lowerQuery) ||
            l.ciudad?.toLowerCase().includes(lowerQuery)
        )
        .slice(0, 5)
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

      // Candidatos
      candidates
        .filter((c) => c.name.toLowerCase().includes(lowerQuery))
        .slice(0, 5)
        .forEach((c) =>
          entityResults.push({
            id: `cand-${c.id}`,
            title: c.name,
            description: `Candidato · ${c.city || 'Sin ciudad'}`,
            icon: UserGroupIcon,
            category: 'Resultados',
            onSelect: () => navigate(`/candidates/${c.id}`)
          })
        )
    }

    const filteredStatic = query
      ? staticCommands.filter(
          (c) =>
            c.title.toLowerCase().includes(query.toLowerCase()) ||
            c.description?.toLowerCase().includes(query.toLowerCase())
        )
      : staticCommands

    return [...filteredStatic, ...entityResults]
  }, [query, navigate, distributors, candidates, leads, isDark, toggle])

  // Navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % commands.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (commands[selectedIndex]) {
        commands[selectedIndex].onSelect()
        setIsOpen(false)
      }
    }
  }

  // Scroll automático para el elemento seleccionado
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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-md pointer-events-auto animate-fade-in"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto overflow-hidden animate-slide-up flex flex-col max-h-[70vh]">
        {/* Search Input */}
        <div className="relative flex items-center px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <MagnifyingGlassIcon className="h-6 w-6 text-slate-400 mr-4" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-lg font-medium"
            placeholder="Escribe para buscar... (ej: 'Ir a Visitas', 'Salva', 'Modo')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-1.5 ml-4">
            <kbd className="hidden sm:inline-flex items-center justify-center h-6 w-6 rounded bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-black text-[10px] font-bold text-slate-500">
              ESC
            </kbd>
          </div>
        </div>

        {/* Results List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto custom-scrollbar py-3"
        >
          {commands.length === 0 ? (
            <div className="py-12 text-center">
              <SparklesIcon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 font-medium tracking-tight">
                No se encontraron comandos o resultados
              </p>
            </div>
          ) : (
            <div className="px-3 space-y-1">
              {/* Categoras */}
              {['Navegación', 'Acciones', 'Resultados'].map((category) => {
                const categoryCommands = commands.filter(
                  (c) => c.category === category
                )

                if (categoryCommands.length === 0) return null

                return (
                  <div key={category} className="mb-4">
                    <div className="px-4 py-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
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
                          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 text-left ${
                            isSelected
                              ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <div
                            className={`p-2.5 rounded-xl ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <command.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}
                            >
                              {command.title}
                            </p>
                            {command.description && (
                              <p
                                className={`text-xs truncate ${isSelected ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}
                              >
                                {command.description}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                                ENTER
                              </span>
                              <ChevronRightIcon className="h-4 w-4 text-white/80" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ↑↓
              </kbd>{' '}
              Navegar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                ↵
              </kbd>{' '}
              Seleccionar
            </span>
          </div>
          <div>GPV Master Search</div>
        </div>
      </div>
    </div>
  )
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  )
}
