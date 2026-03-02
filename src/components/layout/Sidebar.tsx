import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
    HomeIcon,
    ChartBarIcon,
    UsersIcon,
    UserGroupIcon,
    DocumentTextIcon,
    CogIcon,
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
        name: 'Pedidos',
        href: '/sales',
        icon: ShoppingBagIcon,
        color: 'emerald',
        description: 'Control de ventas y activaciones'
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
        try {
            await signOut()
        } catch (error) {
            console.error('Logout failed:', error)
        } finally {
            navigate('/login')
        }
    }

    return (
        <aside
            className={`fixed lg:relative z-50 h-full transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
        ${collapsed ? 'lg:w-24' : 'lg:w-80'}
        ${mobileMenuOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0'}
        bg-white dark:bg-black/90 backdrop-blur-3xl border-r border-gray-100 dark:border-white/5 flex flex-col shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]
      `}
        >
            {/* Logo Section */}
            <div className={`p-6 border-b border-gray-100 dark:border-gray-800/50 ${collapsed ? 'px-3' : ''}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                    <div className="relative group">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pastel-indigo via-pastel-cyan to-pastel-indigo rounded-2xl flex items-center justify-center shadow-xl shadow-pastel-indigo/20 group-hover:scale-110 transition-transform duration-300">
                            <SparklesIcon className="h-5 w-5 lg:h-6 lg:w-6 text-white animate-pulse" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 lg:w-4 lg:h-4 bg-pastel-green rounded-full border-2 border-white dark:border-gray-900 animate-bounce"></div>
                    </div>
                    {!collapsed && (
                        <div className="animate-fade-in">
                            <h2 className="text-xl lg:text-2xl font-black bg-gradient-to-r from-pastel-indigo via-pastel-cyan to-pastel-indigo bg-clip-text text-transparent tracking-tighter">
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
                        <div className="bg-gradient-to-br from-pastel-green/10 to-pastel-cyan/10 dark:from-pastel-green/20 dark:to-pastel-cyan/20 rounded-2xl p-3 border border-pastel-green/20 dark:border-pastel-green/30 group hover:shadow-lg hover:shadow-pastel-green/10 transition-all duration-300">
                            <div className="flex items-center space-x-2">
                                <FireIcon className="h-4 w-4 text-pastel-green group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Ventas hoy</p>
                                    <p className="text-sm font-bold text-pastel-green dark:text-pastel-green">
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
                        <div className="bg-gradient-to-br from-pastel-indigo/10 to-pastel-cyan/10 dark:from-pastel-indigo/20 dark:to-pastel-cyan/20 rounded-2xl p-3 border border-pastel-indigo/20 dark:border-pastel-indigo/30 group hover:shadow-lg hover:shadow-pastel-indigo/10 transition-all duration-300">
                            <div className="flex items-center space-x-2">
                                <UsersIcon className="h-4 w-4 text-pastel-indigo group-hover:scale-110 transition-transform" />
                                <div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">Activos</p>
                                    <p className="text-sm font-bold text-pastel-indigo dark:text-pastel-indigo">
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
                            className={`group flex items-center rounded-2xl transition-all duration-500 relative
                ${collapsed ? 'justify-center p-3' : 'space-x-4 px-5 py-4'}
                ${isActive
                                    ? 'bg-gradient-to-r from-pastel-indigo/10 to-pastel-cyan/10 dark:from-pastel-indigo/20 dark:to-pastel-cyan/20 text-pastel-indigo dark:text-white ring-1 ring-pastel-indigo/10 dark:ring-white/10 shadow-[0_0_20px_rgba(92,124,250,0.1)] dark:shadow-[0_0_20px_rgba(92,124,250,0.15)]'
                                    : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-all duration-300 
                ${isActive
                                    ? 'bg-white dark:bg-pastel-indigo/50 shadow-md scale-110'
                                    : 'bg-gray-100/50 dark:bg-gray-800/30 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-gray-700/50'
                                }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? 'text-pastel-indigo dark:text-white' : 'group-hover:text-pastel-indigo'}`} />
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
                                <div className="absolute right-4 w-1.5 h-1.5 bg-pastel-indigo rounded-full animate-pulse shadow-lg shadow-pastel-indigo/50"></div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions Section */}
            <div className={`p-4 lg:p-6 border-t border-gray-100 dark:border-gray-800/50 ${collapsed ? 'items-center' : ''}`}>
                {!collapsed && (
                    <div className="bg-gradient-to-br from-pastel-yellow/10 to-pastel-red/10 dark:from-pastel-yellow/20 dark:to-pastel-red/20 rounded-2xl p-4 border border-pastel-yellow/20 dark:border-pastel-yellow/30 mb-4 group hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white dark:bg-pastel-yellow/30 rounded-lg flex items-center justify-center shadow-sm">
                                <SparklesIcon className="h-4 w-4 text-pastel-yellow" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-pastel-yellow dark:text-pastel-yellow">¿Necesitas ayuda?</p>
                                <p className="text-[10px] text-gray-500/80 dark:text-gray-500 leading-tight">Soporte 24/7 disponible para el equipo</p>
                            </div>
                        </div>
                    </div>
                )}

                <button
                    type="button"
                    className={`w-full flex items-center rounded-2xl transition-all duration-300 group
            ${collapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'}
            text-gray-500 hover:text-pastel-red hover:bg-pastel-red/10 dark:hover:bg-pastel-red/20
          `}
                    onClick={handleLogout}
                >
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-transparent group-hover:bg-pastel-red/10 dark:group-hover:bg-pastel-red/30 transition-all duration-300 shadow-sm border border-gray-100 dark:border-transparent">
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    </div>
                    {!collapsed && <span className="font-semibold text-sm">Cerrar sesión</span>}
                </button>
            </div>

            {/* Desktop Toggle Button */}
            <button
                className="hidden lg:flex absolute top-1/2 -right-4 -translate-y-1/2 z-20 bg-white dark:bg-gray-900 text-gray-400 hover:text-pastel-indigo dark:hover:text-pastel-indigo w-8 h-8 items-center justify-center rounded-full shadow-xl border border-gray-100 dark:border-gray-800 transition-all hover:scale-110 active:scale-95"
                title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                onClick={onToggle}
            >
                <ChevronDownIcon className={`h-4 w-4 transition-transform duration-500 ${collapsed ? '-rotate-90' : 'rotate-90'}`} />
            </button>
        </aside>
    )
}
