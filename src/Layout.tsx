import React, { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
import { CommandPalette } from './components/layout/CommandPalette'
import { CookieBanner } from './components/legal/CookieBanner'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useAppData } from './lib/useAppData'
import { usePushNotifications } from './lib/hooks/usePushNotifications'
import { useInternalAlerts } from './lib/hooks/useInternalAlerts'
import { getNavigationItemForPath } from './lib/navigation'

const Layout: React.FC = () => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { distributors } = useAppData()

  usePushNotifications(distributors)
  useInternalAlerts()

  const currentItem = useMemo(
    () => getNavigationItemForPath(location.pathname),
    [location.pathname]
  )

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
          <div
            key={location.pathname}
            className="min-h-[calc(100vh-200px)] animate-fade-in"
          >
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>

          <footer className="mt-12 border-t border-gray-100 py-6 dark:border-gray-800">
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              GPV Canarias &copy; {new Date().getFullYear()} - Grupo LMB
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
