import React from 'react'
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './lib/hooks/useAuth'
import ThemeToggle from './components/ui/ThemeToggle'
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  SparklesIcon,
  FireIcon,
  CalendarIcon,
  PhoneIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { useAppData } from './lib/useAppData'
import type { User } from './lib/types'

// Interfaces TypeScript
interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}

interface ProfileSummary {
  initials: string
  name: string
  role: string
  email: string
}

interface SidebarContentProps {
  onItemClick?: () => void
  collapsed?: boolean
}

// Configuración de navegación
const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    color: 'indigo',
    description: 'Vista general ejecutiva'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: ChartBarIcon,
    color: 'cyan',
    description: 'Flujo de ventas'
  },
  {
    name: 'Distribuidores',
    href: '/distributors',
    icon: UsersIcon,
    color: 'green',
    description: 'Red de distribución'
  },
  {
    name: 'Visitas',
    href: '/visits',
    icon: CalendarIcon,
    color: 'red',
    description: 'Acompañamientos y revisiones'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: UserGroupIcon,
    color: 'yellow',
    description: 'Prospects activos'
  },
  {
    name: 'Importar Datos',
    href: '/import',
    icon: ArrowUpTrayIcon,
    color: 'green',
    description: 'Carga masiva CSV/Excel'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: DocumentTextIcon,
    color: 'cyan',
    description: 'Análisis y métricas'
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: CogIcon,
    color: 'indigo',
    description: 'Preferencias y seguridad'
  }
]

const Layout: React.FC = () => {
  // Menú de usuario
  const [userMenuOpen, setUserMenuOpen] = React.useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Cerrar menú al hacer click fuera
  React.useEffect(() => {
    if (!userMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  // Acción cerrar sesión
  const { signOut } = useAuth()
  const handleLogout = async () => {
    await signOut()
    setUserMenuOpen(false)
    navigate('/login')
  }
  const handleProfile = () => {
    setUserMenuOpen(false)
    navigate('/profile')
  }
  // Estado y handler para el buscador
  const [search, setSearch] = React.useState('')
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (search.trim()) {
      alert(`Buscar: ${search}`)
    }
  }
  // Handlers para acciones de header: navegación real
  const handleNotificationsClick = () => {
    navigate('/notifications')
  }
  const handleSettingsClick = () => {
    navigate('/settings')
  }
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  // Usuario real del contexto de autenticación
  const { authUser } = useAuth()
  const user = authUser
    ? {
      name: authUser.fullName || authUser.email || 'Usuario',
      role: authUser.role || 'Sin rol',
      initials: authUser.fullName
        ? authUser.fullName.slice(0, 2).toUpperCase()
        : authUser.email.slice(0, 2).toUpperCase()
    }
    : {
      name: 'Sin usuario',
      role: '',
      initials: 'US'
    }

  // Determinar el item activo según la ruta
  const currentItem = React.useMemo(() => {
    // Buscar coincidencia exacta primero
    let found = sidebarItems.find((item) => item.href === location.pathname)
    // Si no, buscar por prefijo (para rutas con params)
    if (!found) {
      found = sidebarItems.find(
        (item) => location.pathname.startsWith(item.href) && item.href !== '/'
      )
    }
    // Fallback al dashboard
    return found || sidebarItems[0]
  }, [location.pathname])

  const Icon = currentItem.icon

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-pastel-indigo/5 to-pastel-cyan/10">
      {/* Sidebar */}
      <aside
        className={`relative transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700/50 flex flex-col`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        <button
          className="absolute top-4 -right-4 z-20 bg-pastel-indigo text-white rounded-full shadow-lg p-1 border border-white dark:border-gray-700 hover:bg-pastel-cyan transition-all sidebar-toggle-btn"
          title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          onClick={() => setSidebarCollapsed((v) => !v)}
        >
          {sidebarCollapsed ? (
            <Bars3Icon className="h-5 w-5 mx-auto" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 mx-auto rotate-90" />
          )}
        </button>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header profesional dinámico */}
        <header className="h-20 flex items-center px-8 border-b border-gray-100 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-10 sticky top-0">
          {/* Título y subtítulo dinámicos */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-pastel-${currentItem.color}/20`}
              >
                <Icon className={`h-7 w-7 text-pastel-${currentItem.color}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {currentItem.name}
                </h2>
                <p className="text-base text-gray-500 dark:text-gray-400 truncate">
                  {currentItem.description}
                </p>
              </div>
            </div>
          </div>
          {/* Buscador y acciones */}
          <div className="flex items-center gap-4">
            <form
              className="hidden md:flex items-center rounded-2xl px-4 py-2 w-80 bg-gray-100 dark:bg-gray-800"
              onSubmit={handleSearch}
              role="search"
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-gray-400 dark:text-gray-300" />
              <input
                className="bg-transparent outline-none border-none flex-1 text-base text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Buscar distribuidores, candidatos..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar distribuidores, candidatos"
              />
            </form>
            {/* Notificaciones */}
            <button
              className="relative rounded-xl p-3 shadow border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              title="Notificaciones"
              onClick={handleNotificationsClick}
              type="button"
            >
              <BellIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
              <span className="absolute top-2 right-2 w-3 h-3 bg-red-300 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
            {/* Configuración */}
            <button
              className="rounded-xl p-3 shadow border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              title="Configuración"
              onClick={handleSettingsClick}
              type="button"
            >
              <CogIcon className="h-5 w-5 text-gray-400 dark:text-gray-300" />
            </button>
            {/* Dark mode */}
            <ThemeToggle />
            {/* Perfil usuario con menú */}
            <div className="relative">
              <div
                className="flex items-center rounded-2xl px-4 py-2 shadow border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 cursor-pointer select-none gap-3"
                onClick={() => setUserMenuOpen((v) => !v)}
                tabIndex={0}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-pastel-indigo to-pastel-cyan text-white font-bold text-lg">
                  {user.initials}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-gray-900 dark:text-white text-base truncate">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role}
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-400 dark:text-gray-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </div>
              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-xl shadow-lg z-50 py-2 animate-fade-in"
                  tabIndex={-1}
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    onClick={handleProfile}
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span>Ver perfil</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    onClick={handleLogout}
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Contenido de la página */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  onItemClick,
  collapsed = false
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { stats, sales } = useAppData()
  const { signOut } = useAuth()

  // Para logout seguro
  const handleLogout = async (): Promise<void> => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Logo */}
      <div
        className={`p-6 border-b border-gray-100 dark:border-gray-700/50 ${collapsed ? 'px-3' : ''}`}
      >
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-pastel-indigo to-pastel-cyan rounded-2xl flex items-center justify-center shadow-xl shadow-pastel-indigo/30">
              <SparklesIcon className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-pastel-green rounded-full border-2 border-white animate-bounce"></div>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-pastel-indigo via-gray-900 to-pastel-cyan bg-clip-text text-transparent">
                GPV Canarias
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">
                Gestión Integral
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick stats */}
      {!collapsed && (
        <div className="p-6 border-b border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-pastel-green/10 to-pastel-green/5 rounded-xl p-3 border border-pastel-green/20">
              <div className="flex items-center space-x-2">
                <FireIcon className="h-4 w-4 text-pastel-green" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ventas hoy
                  </p>
                  <p className="text-sm font-bold text-pastel-green">
                    {Array.isArray(sales)
                      ? sales.filter((s: { date?: string }) => {
                        const today = new Date().toISOString().slice(0, 10)
                        return s.date && s.date.slice(0, 10) === today
                      }).length
                      : 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pastel-indigo/10 to-pastel-indigo/5 rounded-xl p-3 border border-pastel-indigo/20">
              <div className="flex items-center space-x-2">
                <UsersIcon className="h-4 w-4 text-pastel-indigo" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Activos
                  </p>
                  <p className="text-sm font-bold text-pastel-indigo">
                    {stats && stats.activeDistributors
                      ? stats.activeDistributors
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 space-y-2 ${collapsed ? 'p-2' : 'p-6'}`}>
        {!collapsed && (
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Módulos
          </p>
        )}
        {sidebarItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              title={collapsed ? item.name : ''}
              className={`group flex items-center rounded-xl transition-all duration-300 ${collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'
                } ${isActive
                  ? `bg-gradient-to-r from-pastel-${item.color}/15 to-pastel-${item.color}/10 border border-pastel-${item.color}/20 shadow-lg shadow-pastel-${item.color}/10`
                  : 'hover:bg-gray-50 dark:bg-gray-700/80 hover:scale-105'
                }`}
            >
              <div
                className={`p-2 rounded-lg transition-all duration-300 ${isActive
                  ? `bg-pastel-${item.color}/20 text-pastel-${item.color} scale-110`
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 group-hover:bg-gray-200/80 dark:group-hover:bg-gray-600/80'
                  }`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              {!collapsed && (
                <>
                  <div className="flex-1">
                    <p
                      className={`font-semibold transition-colors ${isActive
                        ? `text-pastel-${item.color}`
                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}
                    >
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  {isActive && (
                    <div
                      className={`w-2 h-2 bg-pastel-${item.color} rounded-full animate-pulse`}
                    ></div>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      {!collapsed && (
        <div className="p-6 border-t border-gray-100 dark:border-gray-700/50">
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-pastel-yellow/10 to-pastel-yellow/5 rounded-xl p-4 border border-pastel-yellow/20">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-pastel-yellow/20 rounded-lg flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-pastel-yellow" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    ¿Necesitas ayuda?
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Soporte 24/7 disponible
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 group"
              onClick={handleLogout}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Layout
