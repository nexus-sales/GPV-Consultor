import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon as CogIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  ShoppingBagIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
  PhoneIcon,
  RocketLaunchIcon,
  RectangleGroupIcon,
  BellIcon,
  TagIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/hooks/useAuth'
import { logger } from '../../lib/logger'
import { useAppData } from '../../lib/useAppData'
import type { UserRole } from '../../lib/types'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  minRole?: UserRole
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    description: 'Vista general ejecutiva'
  },
  {
    name: 'Backoffice',
    href: '/backoffice',
    icon: BuildingOffice2Icon,
    description: 'Gestión y reportes backoffice'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: UserGroupIcon,
    description: 'Prospects activos'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: IdentificationIcon,
    description: 'Prospectos Google Maps'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: ChartBarIcon,
    description: 'Flujo de ventas'
  },
  {
    name: 'Call Center',
    href: '/calls',
    icon: PhoneIcon,
    description: 'Seguimiento telefónico'
  },
  {
    name: 'Tareas',
    href: '/tasks',
    icon: TagIcon,
    description: 'Agenda de compromisos'
  },
  {
    name: 'Visitas',
    href: '/visits',
    icon: CalendarIcon,
    description: 'Acompañamientos y revisiones'
  },
  {
    name: 'Distribuidores',
    href: '/distributors',
    icon: UsersIcon,
    description: 'Red de distribución'
  },
  {
    name: 'Equipos D2D',
    href: '/d2d-teams',
    icon: RectangleGroupIcon,
    description: 'Gestión de equipos externos'
  },
  {
    name: 'Pedidos',
    href: '/sales',
    icon: ShoppingBagIcon,
    description: 'Control de ventas y activaciones'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: DocumentTextIcon,
    description: 'Análisis y métricas'
  },
  {
    name: 'Solicitudes',
    href: '/upgrade-requests',
    icon: RocketLaunchIcon,
    description: 'Saltos a Canal Exclusiva',
    minRole: 'manager'
  },
  {
    name: 'Notificaciones',
    href: '/notifications',
    icon: BellIcon,
    description: 'Centro de avisos'
  },
  {
    name: 'Importar Datos',
    href: '/import',
    icon: ArrowUpTrayIcon,
    description: 'Carga masiva CSV/Excel',
    minRole: 'admin'
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: CogIcon,
    description: 'Preferencias y seguridad',
    minRole: 'admin'
  }
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
  const { currentUser } = useAppData()

  const userRole = currentUser?.role || 'gpv'

  const filteredItems = sidebarItems.filter(item => {
    if (!item.minRole) return true
    if (userRole === 'admin') return true
    if (userRole === 'manager' && item.minRole !== 'admin') return true
    return item.minRole === 'gpv'
  })

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
      className={`fixed z-50 flex h-full flex-col border-r border-gray-100 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 lg:relative
        ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        ${mobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      <div
        className={`border-b border-gray-100 p-5 dark:border-gray-800 ${collapsed ? 'flex justify-center px-0' : ''}`}
      >
        <div
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600">
            <SparklesIcon className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-bold leading-tight text-gray-900 dark:text-white">
                GPV Canarias
              </h2>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Gestión integral
              </p>
            </div>
          )}
        </div>
      </div>

      <nav
        className={`custom-scrollbar flex-1 overflow-y-auto space-y-0.5 ${collapsed ? 'p-2' : 'p-3'}`}
      >
        {!collapsed && (
          <p className="mb-2 ml-2 mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Modulos
          </p>
        )}
        {filteredItems.map((item) => {
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
                ${
                  isActive
                    ? 'bg-gray-100 text-gray-900 dark:bg-white/5 dark:text-white'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-200'
                }`}
            >
              <div
                className={`shrink-0 rounded-lg p-1.5 transition-colors duration-150
                  ${
                    isActive
                      ? 'bg-white text-indigo-600 shadow-sm dark:bg-white/10 dark:text-indigo-400'
                      : 'bg-transparent text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] leading-tight text-gray-400 dark:text-gray-500">
                    {item.description}
                  </p>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      <div
        className={`border-t border-gray-100 p-3 dark:border-gray-800 ${collapsed ? 'flex justify-center' : ''}`}
      >
        <button
          type="button"
          className={`group flex w-full items-center rounded-xl text-gray-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400
            ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}`}
          onClick={handleLogout}
        >
          <div className="rounded-lg bg-transparent p-1.5">
            <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium">Cerrar sesión</span>
          )}
        </button>
      </div>

      <button
        className="absolute top-1/2 -right-3.5 z-20 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition-colors hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:hover:text-gray-200 lg:flex"
        title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
        onClick={onToggle}
      >
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>
    </aside>
  )
}
