import React from 'react'
import { MoonIcon, SunIcon, SwatchIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../lib/useTheme'
import { ColorScheme, ColorSchemeConfig } from '../../lib/ThemeContext'

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
      <button
        type="button"
        onClick={toggle}
        className={`${buttonSizes[size]} rounded-xl text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100`}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? (
          <SunIcon className={sizes[size]} />
        ) : (
          <MoonIcon className={sizes[size]} />
        )}
      </button>

      {showColorPicker && (
        <div className="group relative">
          <button
            type="button"
            className={`${buttonSizes[size]} rounded-xl text-gray-600 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100`}
            title="Cambiar esquema de colores"
            aria-label="Cambiar esquema de colores"
          >
            <SwatchIcon className={sizes[size]} />
          </button>

          <div className="invisible absolute right-0 z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800">
            <div className="p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                Esquemas de color
              </p>
              <div className="space-y-2">
                {Object.entries(availableSchemes).map(
                  ([key, scheme]: [string, ColorSchemeConfig]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColorScheme(key as ColorScheme)}
                      className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors duration-150 ${
                        colorScheme === key
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full bg-gradient-to-r ${
                          key === 'blue'
                            ? 'from-blue-400 to-cyan-400'
                            : key === 'green'
                              ? 'from-emerald-400 to-teal-400'
                              : key === 'purple'
                                ? 'from-purple-400 to-violet-400'
                                : 'from-orange-400 to-amber-400'
                        }`}
                      />
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
