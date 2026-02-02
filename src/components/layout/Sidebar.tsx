import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    HomeIcon,
    ChartBarIcon,
    UsersIcon,
    UserGroupIcon,
    DocumentTextIcon,
    CogIcon,
    Bars3Icon,
    SparklesIcon,
    FireIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../../lib/useAppData'
import { useAuth } from '../../lib/hooks/useAuth'

interface SidebarItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    description: string
}

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
    const { stats, sales } = useAppData()
    const { signOut } = useAuth()

    const handleLogout = async (): Promise<void> => {
        await signOut()
        navigate('/login')
    }

    return (
        <aside
            className={`fixed lg:relative z-50 h-full transition-all duration-500 ease-in-out
        ${collapsed ? 'lg:w-20' : 'lg:w-72'}
        ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800/50 flex flex-col shadow-2xl lg:shadow-none
      `}
        >
            {/* Logo Section */}
            <div className={`p-6 border-b border-gray-100 dark:border-gray-800/50 ${collapsed ? 'px-3' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                    <div className="relative group">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <SparklesIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-bounce"></div>
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h2 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                                GPV Canarias
                            </h2>
                            <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest leading-none mt-1">
                                Gestión Integral
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Section */}
            {!collapsed && (
                <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800/50 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-2xl p-3 border border-green-100 dark:border-green-900/30 group hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
                            <div className="flex items-center space-x-2">
                                <FireIcon className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Ventas hoy</p>
                                    <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                        {Array.isArray(sales)
                                            ? sales.filter((s: any) => {
                                                const today = new Date().toISOString().slice(0, 10)
                                                return s.date && s.date.slice(0, 10) === today
                                            }).length
                                            : 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-2xl p-3 border border-indigo-100 dark:border-indigo-900/30 group hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                            <div className="flex items-center space-x-2">
                                <UsersIcon className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Activos</p>
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                        {stats?.activeDistributors ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Section */}
            <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'p-2' : 'p-4 lg:p-6'} space-y-1.5`}>
                {!collapsed && (
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 ml-2">
                        Módulos Principales
                    </p>
                )}
                {sidebarItems.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href))
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={onItemClick}
                            title={collapsed ? item.name : ''}
                            className={`group flex items-center rounded-2xl transition-all duration-300 relative
                ${collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'}
                ${isActive
                                    ? 'bg-indigo-50/80 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 
                ${isActive
                                    ? 'bg-white dark:bg-indigo-900/50 shadow-md scale-110'
                                    : 'bg-gray-100/50 dark:bg-gray-800/30 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-gray-700/50'
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                            </div>

                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{item.name}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate group-hover:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                                        {item.description}
                                    </p>
                                </div>
                            )}

                            {isActive && !collapsed && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-lg shadow-indigo-500/50"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions Section */}
            <div className={`p-4 lg:p-6 border-t border-gray-100 dark:border-gray-800/50 ${collapsed ? 'items-center' : ''}`}>
                {!collapsed && (
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30 mb-4 group hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white dark:bg-amber-900/50 rounded-lg flex items-center justify-center shadow-sm">
                                <SparklesIcon className="h-4 w-4 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-500">¿Necesitas ayuda?</p>
                                <p className="text-[10px] text-amber-600/80 dark:text-amber-600/60 leading-tight">Soporte 24/7 disponible para el equipo</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    className={`w-full flex items-center rounded-2xl transition-all duration-300 group
            ${collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'}
            text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20
          `}
                    onClick={handleLogout}
                >
                    <div className="p-2 rounded-xl group-hover:bg-white dark:group-hover:bg-red-900/30 transition-all duration-300 shadow-sm">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </div>
                    {!collapsed && <span className="font-semibold text-sm">Cerrar sesión</span>}
                </button>
            </div>

            {/* Desktop Toggle Button */}
            <button
                className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 bg-white dark:bg-gray-900 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 w-8 h-8 items-center justify-center rounded-full shadow-xl border border-gray-100 dark:border-gray-800 transition-all hover:scale-110 active:scale-95"
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                onClick={onToggle}
            >
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-500 ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
        </aside>
    )
}
