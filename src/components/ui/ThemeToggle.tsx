import React from 'react'
import { SunIcon, MoonIcon, SwatchIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../lib/useTheme'
import { ColorScheme, ColorSchemeConfig } from '../../lib/ThemeContext'

// Interfaces TypeScript
interface ThemeToggleProps {
  showColorPicker?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showColorPicker = false,
  size = 'md'
}) => {
  const { isDark, toggle, colorScheme, setColorScheme, availableSchemes } =
    useTheme()

  const sizes: Record<string, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const buttonSizes: Record<string, string> = {
    sm: 'p-2',
    md: 'p-2.5',
    lg: 'p-3'
  }

  return (
    <div className="flex items-center gap-2">
      {/* Toggle modo oscuro/claro */}
      <button
        type="button"
        onClick={toggle}
        className={`${buttonSizes[size]} rounded-xl transition-all duration-300 hover:scale-110 ${
          isDark
            ? 'text-yellow-400 hover:bg-yellow-500/10 hover:shadow-lg hover:shadow-yellow-500/20'
            : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 hover:bg-yellow-500/10 hover:shadow-lg hover:shadow-yellow-500/20'
        }`}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? (
          <SunIcon className={`${sizes[size]} hover:animate-spin`} />
        ) : (
          <MoonIcon className={`${sizes[size]} hover:rotate-12`} />
        )}
      </button>

      {/* Selector de esquema de colores */}
      {showColorPicker && (
        <div className="relative group">
          <button
            type="button"
            className={`${buttonSizes[size]} rounded-xl transition-all duration-300 hover:scale-110 ${
              isDark
                ? 'text-blue-400 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20'
            }`}
            title="Cambiar esquema de colores"
            aria-label="Cambiar esquema de colores"
          >
            <SwatchIcon className={sizes[size]} />
          </button>

          {/* Dropdown de colores */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                Esquemas de color
              </p>
              <div className="space-y-2">
                {Object.entries(availableSchemes).map(
                  ([key, scheme]: [string, ColorSchemeConfig]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColorScheme(key as ColorScheme)}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
                        colorScheme === key
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-r ${
                          key === 'blue'
                            ? 'from-blue-400 to-cyan-400'
                            : key === 'green'
                              ? 'from-emerald-400 to-teal-400'
                              : key === 'purple'
                                ? 'from-purple-400 to-violet-400'
                                : 'from-orange-400 to-amber-400'
                        }`}
                      ></div>
                      <span className="text-sm font-medium">{scheme.name}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeToggle
