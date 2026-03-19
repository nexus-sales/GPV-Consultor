import React, { useState, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  Cog6ToothIcon as CogIcon,
  CalendarIcon,
  ArrowUpTrayIcon,
  ShoppingBagIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/layout/CommandPalette'
import { CookieBanner } from './components/legal/CookieBanner'

// Navigation items definition matches Sidebar.tsx
const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    color: 'indigo' as const,
    description: 'Vista general ejecutiva'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: ChartBarIcon,
    color: 'cyan' as const,
    description: 'Flujo de ventas'
  },
  {
    name: 'Distribuidores',
    href: '/distributors',
    icon: UsersIcon,
    color: 'green' as const,
    description: 'Red de distribución'
  },
  {
    name: 'Visitas',
    href: '/visits',
    icon: CalendarIcon,
    color: 'red' as const,
    description: 'Acompañamientos y revisiones'
  },
  {
    name: 'Pedidos',
    href: '/sales',
    icon: ShoppingBagIcon,
    color: 'emerald' as const,
    description: 'Control de ventas y activaciones'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: UserGroupIcon,
    color: 'yellow' as const,
    description: 'Prospects activos'
  },
  {
    name: 'Leads',
    href: '/leads',
    icon: IdentificationIcon,
    color: 'cyan' as const,
    description: 'Prospectos Google Maps'
  },
  {
    name: 'Importar Datos',
    href: '/import',
    icon: ArrowUpTrayIcon,
    color: 'green' as const,
    description: 'Carga masiva CSV/Excel'
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: DocumentTextIcon,
    color: 'cyan' as const,
    description: 'Análisis y métricas'
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: CogIcon,
    color: 'indigo' as const,
    description: 'Preferencias y seguridad'
  }
]

const Layout: React.FC = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Map current route to active navigation item
  const currentItem = useMemo(() => {
    let found = sidebarItems.find((item) => item.href === location.pathname)
    if (!found) {
      found = sidebarItems.find(
        (item) => item.href !== '/' && location.pathname.startsWith(item.href)
      )
    }
    return found || sidebarItems[0]
  }, [location.pathname])

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onItemClick={() => setMobileMenuOpen(false)}
        mobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:w-auto relative overflow-hidden">
        {/* Dynamic Background Elements for "Spectacular" feel */}
        <div className="fixed top-0 right-0 -z-10 w-[500px] h-[500px] bg-pastel-indigo/5 dark:bg-pastel-indigo/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 transition-colors duration-700"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-[500px] h-[500px] bg-pastel-cyan/5 dark:bg-pastel-cyan/10 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2 transition-colors duration-700"></div>

        {/* Refactored Header */}
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileMenuOpen(true)}
          activePageName={currentItem.name}
          activePageIcon={currentItem.icon}
          activePageColor={currentItem.color}
          activePageDescription={currentItem.description}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="animate-fade-in min-h-[calc(100vh-200px)]">
            <Outlet />
          </div>

          <footer className="mt-12 py-8 border-t border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Cumplimos con todas las normativas europeas en{' '}
                  <span className="text-pastel-indigo dark:text-pastel-indigo/80 font-bold uppercase tracking-wider">
                    RGPD e IA
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] font-bold">
                  Seguridad y Privacidad garantizada por diseño
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-2xl shadow-inner border border-white dark:border-slate-800">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Creado por{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Grupo LMB
                  </span>
                </p>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1" />
                <p className="text-[10px] text-slate-400 font-black">
                  © {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <CookieBanner />
      <CommandPalette />
    </div>
  )
}

export default Layout
