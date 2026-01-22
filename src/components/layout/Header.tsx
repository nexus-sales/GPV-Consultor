import React, { useState } from 'react'
import { useAppData } from '../../lib/useAppData'
import {
  BellIcon,
  CogIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { useTheme } from '../../lib/useTheme'
import Button from '../ui/Button'

// Interfaces para tipos de datos
import type { Notification } from '../../lib/types'

const Header: React.FC = () => {
  const { isDark, toggle } = useTheme()
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false)
  const [showNotifications, setShowNotifications] = useState<boolean>(false)

  const { notifications } = useAppData()
  const unreadCount = notifications.filter((n) => n.read === false).length

  return (
    <header
      className={`border-b backdrop-blur-sm sticky top-0 z-50 transition-all duration-700 animate-fade-in ${isDark
          ? 'bg-gradient-to-r from-slate-900/95 via-slate-800/90 to-slate-900/95 border-slate-700/50'
          : 'bg-gradient-to-r from-white via-pastel-indigo/5 to-pastel-cyan/10 border-gray-200/50'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo y título */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-pastel-indigo via-pastel-cyan to-pastel-indigo p-3 rounded-2xl shadow-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-white/90 to-white/70 rounded-xl flex items-center justify-center">
                <span className="text-pastel-indigo font-bold text-lg">G</span>
              </div>
            </div>
            <div>
              <h1
                className={`text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent transition-all duration-500 ${isDark
                    ? 'from-blue-400 via-slate-100 to-cyan-400'
                    : 'from-pastel-indigo via-gray-900 to-pastel-cyan'
                  }`}
              >
                GPV Canarias
              </h1>
              <p
                className={`text-sm transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-gray-600'
                  }`}
              >
                Gestión Integral Comercial
              </p>
            </div>
          </div>

          {/* Acciones del header */}
          <div className="flex items-center space-x-4">
            {/* Información de actualización */}
            <div className="text-right hidden md:block">
              <div
                className={`text-xs transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}
              >
                Última actualización
              </div>
              <div
                className={`text-sm font-medium transition-colors duration-500 ${isDark ? 'text-slate-200' : 'text-gray-700'
                  }`}
              >
                {new Date().toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Toggle tema */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggle}
              className={`relative p-2 rounded-xl transition-all duration-300 ${isDark
                  ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                }`}
              aria-label={
                isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
              }
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>

            {/* Notificaciones */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-xl transition-all duration-300 ${isDark
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                aria-label="Notificaciones"
              >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pastel-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Dropdown de notificaciones */}
              {showNotifications && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl z-50 backdrop-blur-sm border transition-all duration-300 ${isDark
                      ? 'bg-slate-800/95 border-slate-700/50'
                      : 'bg-white/95 border-gray-200/50'
                    }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold transition-colors duration-500 ${isDark ? 'text-slate-100' : 'text-gray-900'
                          }`}
                      >
                        Notificaciones
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-pastel-indigo text-white text-xs px-2 py-1 rounded-full">
                          {unreadCount} nuevas
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer ${notification.read === false
                              ? isDark
                                ? 'bg-slate-700/50 border border-slate-600/30'
                                : 'bg-pastel-indigo/5 border border-pastel-indigo/20'
                              : isDark
                                ? 'bg-slate-800/30 hover:bg-slate-700/30'
                                : 'bg-gray-50/50 hover:bg-gray-100/50'
                            }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div
                              className={`p-1.5 rounded-lg ${notification.read === false
                                  ? 'bg-pastel-indigo/20'
                                  : isDark
                                    ? 'bg-slate-600/30'
                                    : 'bg-gray-200/50'
                                }`}
                            >
                              <SparklesIcon
                                className={`h-4 w-4 ${notification.read === false
                                    ? 'text-pastel-indigo'
                                    : isDark
                                      ? 'text-slate-400'
                                      : 'text-gray-500'
                                  }`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`text-sm font-medium truncate transition-colors duration-500 ${isDark ? 'text-slate-100' : 'text-gray-900'
                                    }`}
                                >
                                  {notification.title}
                                </p>
                                <span
                                  className={`text-xs transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-gray-500'
                                    }`}
                                >
                                  {notification.timestamp}
                                </span>
                              </div>
                              <p
                                className={`text-sm truncate transition-colors duration-500 ${isDark ? 'text-slate-300' : 'text-gray-600'
                                  }`}
                              >
                                {notification.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Perfil de usuario */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-300 ${isDark
                    ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                aria-label="Menú de usuario"
              >
                <UserCircleIcon className="h-6 w-6" />
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''
                    }`}
                />
              </Button>

              {/* Dropdown de perfil */}
              {showProfileMenu && (
                <div
                  className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl z-50 backdrop-blur-sm border transition-all duration-300 ${isDark
                      ? 'bg-slate-800/95 border-slate-700/50'
                      : 'bg-white/95 border-gray-200/50'
                    }`}
                >
                  <div className="p-4">
                    <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-gray-200/20">
                      <div className="w-10 h-10 bg-gradient-to-br from-pastel-indigo to-pastel-cyan rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold">JD</span>
                      </div>
                      <div>
                        <p
                          className={`font-medium transition-colors duration-500 ${isDark ? 'text-slate-100' : 'text-gray-900'
                            }`}
                        >
                          Juan Delgado
                        </p>
                        <p
                          className={`text-sm transition-colors duration-500 ${isDark ? 'text-slate-400' : 'text-gray-600'
                            }`}
                        >
                          Supervisor Comercial
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setShowProfileMenu(false)
                          // Navegar a perfil
                        }}
                      >
                        <UserCircleIcon className="h-4 w-4 mr-2" />
                        Mi Perfil
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setShowProfileMenu(false)
                          // Navegar a configuración
                        }}
                      >
                        <CogIcon className="h-4 w-4 mr-2" />
                        Configuración
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para cerrar dropdowns */}
      {(showNotifications || showProfileMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false)
            setShowProfileMenu(false)
          }}
        />
      )}
    </header>
  )
}

export default Header
