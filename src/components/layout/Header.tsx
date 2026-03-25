import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellIcon,
  CogIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../lib/hooks/useAuth'
import { useTheme } from '../../lib/useTheme'
import ThemeToggle from '../ui/ThemeToggle'

interface HeaderProps {
  sidebarCollapsed: boolean
  onMenuClick: () => void
  activePageName: string
  activePageIcon: React.ComponentType<{ className?: string }>
  activePageColor: string
  activePageDescription: string
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  activePageName,
  activePageIcon: _Icon,
  activePageColor: _activePageColor,
  activePageDescription: _activePageDescription
}) => {
  const { isDark, toggle } = useTheme()
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const user = {
    name: authUser?.fullName || authUser?.email || 'Usuario',
    role: authUser?.role || 'Consultor',
    initials: authUser?.fullName
      ? authUser.fullName
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : authUser?.email?.slice(0, 2).toUpperCase() || 'US'
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <header className="h-14 lg:h-16 flex items-center px-4 lg:px-8 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-40 sticky top-0 justify-between">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          className="lg:hidden p-2 -ml-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          onClick={onMenuClick}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {activePageName}
        </h2>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="hidden xl:flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 rounded-xl px-4 py-2 w-64 transition-colors cursor-pointer"
        >
          <MagnifyingGlassIcon className="h-4 w-4 mr-2.5 text-gray-400" />
          <span className="flex-1 text-sm text-gray-400">Buscar...</span>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] text-gray-400 select-none">
            {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl K'}
          </kbd>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        {/* Theme toggle */}
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
              {user.initials}
            </div>
            <div className="hidden lg:flex flex-col items-start min-w-0">
              <span className="font-medium text-gray-900 dark:text-white text-sm truncate leading-tight max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDownIcon
              className={`hidden lg:block h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 py-1.5 animate-slide-up">
              <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-800">
                <p className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{authUser?.email}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <UserCircleIcon className="h-4 w-4 text-gray-400" />
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <CogIcon className="h-4 w-4 text-gray-400" />
                  <span>Configuración</span>
                </button>
                <div className="lg:hidden">
                  <button
                    onClick={() => { toggle(); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {isDark ? <SunIcon className="h-4 w-4 text-gray-400" /> : <MoonIcon className="h-4 w-4 text-gray-400" />}
                    <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>
                </div>
              </div>

              <div className="p-1 border-t border-gray-50 dark:border-gray-800">
                <button
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  onClick={handleLogout}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
