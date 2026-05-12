import React, { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  ArrowUpTrayIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon as CogIcon,
  DocumentTextIcon,
  HomeIcon,
  IdentificationIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  UsersIcon,
  SignalIcon
} from '@heroicons/react/24/outline'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/layout/CommandPalette'
import { CookieBanner } from './components/legal/CookieBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppData } from './lib/useAppData'
import { usePushNotifications } from './lib/hooks/usePushNotifications'
import { useInternalAlerts } from './lib/hooks/useInternalAlerts'

const sidebarItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: HomeIcon,
    color: 'indigo' as const,
    description: 'Vista general ejecutiva'
  },
  {
    name: 'Radar',
    href: '/radar',
    icon: SignalIcon,
    color: 'blue' as const,
    description: 'Clientes y leads cercanos'
  },
  {
    name: 'Pipeline',
    href: '/kanban',
    icon: ChartBarIcon,
    color: 'cyan' as const,
    description: 'Flujo de ventas'
  },
  {
    name: 'Candidatos',
    href: '/candidates',
    icon: UserGroupIcon,
    color: 'yellow' as const,
    description: 'Prospects activos'
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
    color: 'purple' as const,
    description: 'Acompañamientos y revisiones'
  },
  {
    name: 'Backoffice',
    href: '/backoffice',
    icon: BuildingOffice2Icon,
    color: 'indigo' as const,
    description: 'Gestión y reportes backoffice'
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
  const { distributors } = useAppData()
  usePushNotifications(distributors)
  useInternalAlerts()

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
    <div className="flex h-screen bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onItemClick={() => setMobileMenuOpen(false)}
        mobileMenuOpen={mobileMenuOpen}
      />

      <div className="relative flex h-screen w-full flex-1 flex-col overflow-hidden lg:w-auto">
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onMenuClick={() => setMobileMenuOpen(true)}
          activePageName={currentItem.name}
          activePageIcon={currentItem.icon}
          activePageColor={currentItem.color}
          activePageDescription={currentItem.description}
        />

        <main className="custom-scrollbar relative flex-1 overflow-y-auto scroll-smooth p-4 sm:p-6 lg:p-8">
          <div className="min-h-[calc(100vh-200px)] animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>

          <footer className="mt-12 border-t border-gray-100 py-6 dark:border-gray-800">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              GPV Canarias © {new Date().getFullYear()} · Grupo LMB
            </p>
          </footer>
        </main>
      </div>

      <CookieBanner />
      <CommandPalette />
    </div>
  )
}

export default Layout
