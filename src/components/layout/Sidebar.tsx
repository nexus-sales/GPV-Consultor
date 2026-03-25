import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon as CogIcon,
  SparklesIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  ArrowUpTrayIcon,
  ShoppingBagIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/hooks/useAuth'
import { logger } from '../../lib/logger'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard',      href: '/',            icon: HomeIcon,            description: 'Vista general ejecutiva' },
  { name: 'Candidatos',     href: '/candidates',  icon: UserGroupIcon,       description: 'Prospects activos' },
  { name: 'Leads',          href: '/leads',       icon: IdentificationIcon,  description: 'Prospectos Google Maps' },
  { name: 'Pipeline',       href: '/kanban',      icon: ChartBarIcon,        description: 'Flujo de ventas' },
  { name: 'Visitas',        href: '/visits',      icon: CalendarIcon,        description: 'Acompañamientos y revisiones' },
  { name: 'Distribuidores', href: '/distributors',icon: UsersIcon,           description: 'Red de distribución' },
  { name: 'Pedidos',        href: '/sales',       icon: ShoppingBagIcon,     description: 'Control de ventas y activaciones' },
  { name: 'Reportes',       href: '/reports',     icon: DocumentTextIcon,    description: 'Análisis y métricas' },
  { name: 'Importar Datos', href: '/import',      icon: ArrowUpTrayIcon,     description: 'Carga masiva CSV/Excel' },
  { name: 'Configuración',  href: '/settings',    icon: CogIcon,             description: 'Preferencias y seguridad' }
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  onItemClick?: () => void
  mobileMenuOpen: boolean
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  onItemClick,
  mobileMenuOpen
}) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()

  const handleLogout = async (): Promise<void> => {
    try {
      await signOut()
    } catch (error) {
      logger.error('Logout failed', error)
    } finally {
      navigate('/login')
    }
  }

  return (
    <aside
      className={`fixed lg:relative z-50 h-full transition-all duration-300
        ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col
      `}
    >
      {/* Logo */}
      <div className={`p-5 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'px-0 flex justify-center' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                GPV Canarias
              </h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest leading-none mt-0.5">
                Gestión Integral
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'p-2' : 'p-3'} space-y-0.5`}>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 mt-1 ml-2">
            Módulos
          </p>
        )}
        {sidebarItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            (item.href !== '/' && location.pathname.startsWith(item.href))

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              title={collapsed ? item.name : ''}
              className={`group flex items-center rounded-xl transition-colors duration-150
                ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                ${isActive
                  ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 transition-colors duration-150
                ${isActive
                  ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'bg-transparent text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate leading-tight">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className={`p-3 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          className={`w-full flex items-center rounded-xl transition-colors duration-150 group
            ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
            text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30
          `}
          onClick={handleLogout}
        >
          <div className="p-1.5 rounded-lg bg-transparent group-hover:text-red-600 dark:group-hover:text-red-400">
            <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          </div>
          {!collapsed && (
            <span className="font-medium text-sm">Cerrar sesión</span>
          )}
        </button>
      </div>

      {/* Desktop Toggle */}
      <button
        className="hidden lg:flex absolute top-1/2 -right-3.5 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 w-7 h-7 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 transition-colors shadow-sm"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        onClick={onToggle}
      >
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>
    </aside>
  )
}
