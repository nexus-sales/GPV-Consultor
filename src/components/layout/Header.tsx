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
  activePageIcon: Icon,
  activePageColor,
  activePageDescription
}) => {
  const { isDark, toggle } = useTheme()
  const { authUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const userMenuRef = useRef<HTMLDivElement>(null)

  // User info
  const user = {
    name: authUser?.fullName || authUser?.email || 'Usuario',
    role: authUser?.role || 'Consultor',
    initials: authUser?.fullName
      ? authUser.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : authUser?.email?.slice(0, 2).toUpperCase() || 'US'
  }

  // Handle outside clicks for user menu
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
    <header className="h-16 lg:h-24 flex items-center px-4 lg:px-10 border-b border-gray-100 dark:border-gray-800/50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl z-40 sticky top-0 justify-between transition-all duration-300">

      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          onClick={onMenuClick}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-5 min-w-0">
          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center bg-${activePageColor}-50 dark:bg-${activePageColor}-900/20 border border-${activePageColor}-100 dark:border-${activePageColor}-900/30 transition-all duration-500`}>
            <Icon className={`h-6 w-6 lg:h-8 lg:w-8 text-${activePageColor}-600 dark:text-${activePageColor}-400`} />
          </div>
          <div className="min-w-0 animate-fade-in">
            <h2 className="text-xl lg:text-3xl font-black text-gray-900 dark:text-white truncate tracking-tight">
              {activePageName}
            </h2>
            <p className="hidden md:block text-sm lg:text-base text-gray-500 dark:text-gray-400 truncate opacity-80">
              {activePageDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Actions: Search, Notifications, Profile */}
      <div className="flex items-center gap-3 lg:gap-6">
        {/* Modern Search */}
        <div className="hidden xl:flex items-center group bg-gray-50 dark:bg-gray-800/50 border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-gray-800 rounded-2xl px-5 py-2.5 w-80 transition-all duration-300 shadow-sm focus-within:shadow-indigo-500/10">
          <MagnifyingGlassIcon className="h-5 w-5 mr-3 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            className="bg-transparent outline-none border-none flex-1 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400"
            placeholder="Buscar en GPV..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[10px] font-medium text-gray-400 select-none pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button className="relative group p-3 rounded-2xl border border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-sm">
            <BellIcon className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 ring-2 ring-red-500/20 animate-pulse"></span>
          </button>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <div
            className="flex items-center gap-3 pl-1 pr-1 lg:pr-4 py-1 rounded-2xl border border-transparent hover:border-gray-100 dark:hover:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 cursor-pointer transition-all duration-300 select-none group"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-base lg:text-lg shadow-lg group-hover:scale-105 transition-transform duration-300 ring-4 ring-indigo-500/10">
              {user.initials}
            </div>
            <div className="hidden lg:flex flex-col min-w-0">
              <span className="font-bold text-gray-900 dark:text-white text-sm truncate leading-tight">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-tight">
                {user.role}
              </span>
            </div>
            <ChevronDownIcon className={`hidden lg:block h-4 w-4 text-gray-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
          </div>

          {userMenuOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/50 rounded-2xl shadow-2xl z-50 py-2 animate-slide-up ring-1 ring-black/5">
              <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-800/50">
                <p className="font-bold text-gray-900 dark:text-white text-sm">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{authUser?.email}</p>
              </div>

              <div className="p-1">
                <button
                  onClick={() => { navigate('/profile'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                  <span>Mi Perfil</span>
                </button>
                <button
                  onClick={() => { navigate('/settings'); setUserMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  <CogIcon className="h-5 w-5 text-gray-400" />
                  <span>Configuración</span>
                </button>
                <div className="lg:hidden">
                  <button
                    onClick={() => { toggle(); setUserMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all"
                  >
                    {isDark ? <SunIcon className="h-5 w-5 text-gray-400" /> : <MoonIcon className="h-5 w-5 text-gray-400" />}
                    <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
                  </button>
                </div>
              </div>

              <div className="p-1 border-t border-gray-50 dark:border-gray-800/50 mt-1">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                  onClick={handleLogout}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
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
