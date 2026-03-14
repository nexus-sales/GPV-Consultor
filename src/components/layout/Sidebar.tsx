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
    FireIcon,
    CalendarIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    ArrowUpTrayIcon,
    ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { useAppData } from '../../lib/useAppData'
import { useAuth } from '../../lib/hooks/useAuth'
import { logger } from '../../lib/logger'

interface SidebarItem {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    description: string
    activeClasses: string
    iconActiveClasses: string
    iconInactiveClasses: string
    dotClasses: string
}

const sidebarItems: SidebarItem[] = [
    {
        name: 'Dashboard',
        href: '/',
        icon: HomeIcon,
        description: 'Vista general ejecutiva',
        activeClasses: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-200 dark:ring-indigo-800/50',
        iconActiveClasses: 'bg-indigo-100 dark:bg-indigo-900/70 text-indigo-600 dark:text-indigo-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-300',
        dotClasses: 'bg-indigo-500'
    },
    {
        name: 'Candidatos',
        href: '/candidates',
        icon: UserGroupIcon,
        description: 'Prospects activos',
        activeClasses: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200 dark:ring-amber-800/50',
        iconActiveClasses: 'bg-amber-100 dark:bg-amber-900/70 text-amber-600 dark:text-amber-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 group-hover:text-amber-600 dark:group-hover:text-amber-300',
        dotClasses: 'bg-amber-500'
    },
    {
        name: 'Pipeline',
        href: '/kanban',
        icon: ChartBarIcon,
        description: 'Flujo de ventas',
        activeClasses: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-200 dark:ring-cyan-800/50',
        iconActiveClasses: 'bg-cyan-100 dark:bg-cyan-900/70 text-cyan-600 dark:text-cyan-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50 group-hover:text-cyan-600 dark:group-hover:text-cyan-300',
        dotClasses: 'bg-cyan-500'
    },
    {
        name: 'Visitas',
        href: '/visits',
        icon: CalendarIcon,
        description: 'Acompañamientos y revisiones',
        activeClasses: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800/50',
        iconActiveClasses: 'bg-rose-100 dark:bg-rose-900/70 text-rose-600 dark:text-rose-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 group-hover:text-rose-600 dark:group-hover:text-rose-300',
        dotClasses: 'bg-rose-500'
    },
    {
        name: 'Distribuidores',
        href: '/distributors',
        icon: UsersIcon,
        description: 'Red de distribución',
        activeClasses: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800/50',
        iconActiveClasses: 'bg-emerald-100 dark:bg-emerald-900/70 text-emerald-600 dark:text-emerald-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
        dotClasses: 'bg-emerald-500'
    },
    {
        name: 'Pedidos',
        href: '/sales',
        icon: ShoppingBagIcon,
        description: 'Control de ventas y activaciones',
        activeClasses: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 ring-1 ring-violet-200 dark:ring-violet-800/50',
        iconActiveClasses: 'bg-violet-100 dark:bg-violet-900/70 text-violet-600 dark:text-violet-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50 group-hover:text-violet-600 dark:group-hover:text-violet-300',
        dotClasses: 'bg-violet-500'
    },
    {
        name: 'Reportes',
        href: '/reports',
        icon: DocumentTextIcon,
        description: 'Análisis y métricas',
        activeClasses: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-800/50',
        iconActiveClasses: 'bg-sky-100 dark:bg-sky-900/70 text-sky-600 dark:text-sky-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 group-hover:text-sky-600 dark:group-hover:text-sky-300',
        dotClasses: 'bg-sky-500'
    },
    {
        name: 'Importar Datos',
        href: '/import',
        icon: ArrowUpTrayIcon,
        description: 'Carga masiva CSV/Excel',
        activeClasses: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 ring-1 ring-teal-200 dark:ring-teal-800/50',
        iconActiveClasses: 'bg-teal-100 dark:bg-teal-900/70 text-teal-600 dark:text-teal-300',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 group-hover:text-teal-600 dark:group-hover:text-teal-300',
        dotClasses: 'bg-teal-500'
    },
    {
        name: 'Configuración',
        href: '/settings',
        icon: CogIcon,
        description: 'Preferencias y seguridad',
        activeClasses: 'bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 ring-1 ring-slate-200 dark:ring-slate-700/50',
        iconActiveClasses: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200',
        iconInactiveClasses: 'bg-gray-100 dark:bg-gray-800/60 text-gray-500 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 group-hover:text-slate-600 dark:group-hover:text-slate-200',
        dotClasses: 'bg-slate-500'
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
            className={`fixed lg:relative z-50 h-full transition-all duration-700
        ${collapsed ? 'lg:w-24' : 'lg:w-80'}
        ${mobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col shadow-xl
      `}
        >
            {/* Logo Section */}
            <div className={`p-6 border-b border-gray-100 dark:border-gray-800 ${collapsed ? 'px-3' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                    <div className="relative group shrink-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform duration-300">
                            <SparklesIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900 animate-bounce"></div>
                    </div>
                    {!collapsed && (
                        <div>
                            <h2 className="text-xl lg:text-2xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent tracking-tighter">
                                GPV Canarias
                            </h2>
                            <p className="text-[10px] lg:text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest leading-none mt-0.5">
                                Gestión Integral
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Stats Section */}
            {!collapsed && (
                <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl p-3 border border-emerald-200 dark:border-emerald-800/50 group hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg">
                                    <FireIcon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none">Ventas hoy</p>
                                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
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
                        <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-3 border border-indigo-200 dark:border-indigo-800/50 group hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/60 rounded-lg">
                                    <UsersIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none">Activos</p>
                                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                        {stats?.activeDistributors ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Section */}
            <nav className={`flex-1 overflow-y-auto custom-scrollbar ${collapsed ? 'p-2' : 'p-3 lg:p-4'} space-y-1`}>
                {!collapsed && (
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-3 ml-2">
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
                ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3'}
                ${isActive
                                    ? item.activeClasses
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 shrink-0
                ${isActive ? item.iconActiveClasses : item.iconInactiveClasses}
              `}>
                                <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                            </div>

                            {!collapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate leading-tight">{item.name}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                            )}

                            {isActive && !collapsed && (
                                <div className={`w-2 h-2 rounded-full shrink-0 ${item.dotClasses}`}></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions Section */}
            <div className={`p-4 border-t border-gray-100 dark:border-gray-800 ${collapsed ? 'items-center' : ''}`}>
                {!collapsed && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3 border border-amber-200 dark:border-amber-800/40 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/60 rounded-xl flex items-center justify-center shrink-0">
                                <SparklesIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">¿Necesitas ayuda?</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight">Soporte 24/7 disponible para el equipo</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    className={`w-full flex items-center rounded-2xl transition-all duration-300 group
            ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-3'}
            text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40
          `}
                    onClick={handleLogout}
                >
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/50 transition-all duration-300">
                        <ArrowRightOnRectangleIcon className="h-[18px] w-[18px]" />
                    </div>
                    {!collapsed && <span className="font-semibold text-sm">Cerrar sesión</span>}
                </button>
            </div>

            {/* Desktop Toggle Button */}
            <button
                className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 w-8 h-8 items-center justify-center rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-110 active:scale-95"
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                onClick={onToggle}
            >
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-500 ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
        </aside>
    )
}
