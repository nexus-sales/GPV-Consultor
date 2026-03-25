import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  ChevronDownIcon,
  CogIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon
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
          .map((name: string) => name[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : authUser?.email?.slice(0, 2).toUpperCase() || 'US'
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 lg:h-16 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          className="rounded-lg p-2 -ml-1 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden"
          onClick={onMenuClick}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <h2 className="truncate text-lg font-semibold text-gray-900 dark:text-white">
          {activePageName}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <div
          onClick={() =>
            window.dispatchEvent(new CustomEvent('open-command-palette'))
          }
          className="hidden w-64 cursor-pointer items-center rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 transition-colors hover:border-gray-200 dark:border-gray-700/50 dark:bg-gray-800/50 dark:hover:border-gray-600 xl:flex"
        >
          <MagnifyingGlassIcon className="mr-2.5 h-4 w-4 text-gray-400" />
          <span className="flex-1 text-sm text-gray-400">Buscar...</span>
          <kbd className="hidden select-none items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-400 dark:border-gray-700 dark:bg-gray-900 lg:inline-flex">
            {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl K'}
          </kbd>
        </div>

        <button className="relative rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200">
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
              {user.initials}
            </div>
            <div className="hidden min-w-0 flex-col items-start lg:flex">
              <span className="max-w-[120px] truncate text-sm font-medium leading-tight text-gray-900 dark:text-white">
                {user.name}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-gray-400">
                {user.role}
              </span>
            </div>
            <ChevronDownIcon
              className={`hidden h-4 w-4 text-gray-400 transition-transform duration-200 lg:block ${userMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-1.5 shadow-lg animate-slide-up dark:border-gray-800 dark:bg-gray-900">
              <div className="border-b border-gray-50 px-3 py-2 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {authUser?.email}
                </p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => {
                    navigate('/profile')
                    setUserMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <UserCircleIcon className="h-4 w-4 text-gray-400" />
                  <span>Mi perfil</span>
                </button>
                <button
                  onClick={() => {
                    navigate('/settings')
                    setUserMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <CogIcon className="h-4 w-4 text-gray-400" />
                  <span>Configuracion</span>
                </button>
                <div className="lg:hidden">
                  <button
                    onClick={() => {
                      toggle()
                      setUserMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {isDark ? (
                      <SunIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <MoonIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-50 p-1 dark:border-gray-800">
                <button
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={handleLogout}
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span>Cerrar sesion</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
