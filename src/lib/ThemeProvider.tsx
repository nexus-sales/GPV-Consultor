import React, { useEffect, useMemo, useState, ReactNode } from 'react'
import {
  ThemeContext,
  THEME_STORAGE_KEY,
  COLOR_SCHEME_STORAGE_KEY,
  prefersDarkMode,
  colorSchemes,
  Theme,
  ColorScheme
} from './ThemeContext'
import { createPrefixedLogger } from './utils/logger'

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const log = useMemo(() => createPrefixedLogger('[ThemeProvider]'), [])
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return prefersDarkMode() ? 'dark' : 'light'
  })

  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    if (typeof window === 'undefined') return 'blue'
    const stored = window.localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    return Object.keys(colorSchemes).includes(stored || '')
      ? (stored as ColorScheme)
      : 'blue'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    // Tailwind requiere la clase 'dark' para activar dark mode
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('theme-dark', theme === 'dark')
    root.classList.toggle('theme-light', theme !== 'dark')

    // Aplicar esquema de color
    Object.keys(colorSchemes).forEach((scheme) => {
      root.classList.toggle(`color-${scheme}`, scheme === colorScheme)
    })

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
      window.localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, colorScheme)
    } catch (error) {
      log.warn('No se pudo guardar las preferencias:', error)
    }
  }, [theme, colorScheme, log])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', listener)
    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  const value = useMemo(
    () => ({
      theme,
      colorScheme,
      currentScheme: colorSchemes[colorScheme],
      isDark: theme === 'dark',
      setTheme,
      setColorScheme,
      toggle: () =>
        setTheme((current: Theme) => (current === 'dark' ? 'light' : 'dark')),
      availableSchemes: colorSchemes
    }),
    [theme, colorScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
