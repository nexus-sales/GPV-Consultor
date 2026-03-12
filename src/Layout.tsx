import React, { useState, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  CalendarIcon,
  ArrowUpTrayIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'

// Navigation items definition matches Sidebar.tsx
const sidebarItems = [
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
        <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
          <div className="w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
