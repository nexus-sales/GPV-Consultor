import { createContext } from 'react'

// Tipos TypeScript
export type Theme = 'light' | 'dark'
export type ColorScheme = 'blue' | 'green' | 'purple' | 'orange' | 'corporateLight' | 'corporateDark' | 'highContrast'

export interface ColorSchemeConfig {
  name: string
  primary: string
  secondary: string
  accent: string
}

export interface ThemeContextValue {
  theme: Theme
  colorScheme: ColorScheme
  currentScheme: ColorSchemeConfig
  isDark: boolean
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  toggle: () => void
  availableSchemes: Record<ColorScheme, ColorSchemeConfig>
}

export const THEME_STORAGE_KEY = 'gpv-theme'
export const COLOR_SCHEME_STORAGE_KEY = 'gpv-color-scheme'

export const colorSchemes: Record<ColorScheme, ColorSchemeConfig> = {
  blue: {
    name: 'Océano',
    primary: 'blue',
    secondary: 'cyan',
    accent: 'indigo'
  },
  green: {
    name: 'Naturaleza',
    primary: 'emerald',
    secondary: 'teal',
    accent: 'green'
  },
  purple: {
    name: 'Cosmos',
    primary: 'purple',
    secondary: 'violet',
    accent: 'fuchsia'
  },
  orange: {
    name: 'Energía',
    primary: 'orange',
    secondary: 'amber',
    accent: 'yellow'
  },
  corporateLight: {
    name: 'Corporativo Claro',
    primary: '#2563eb', // Azul corporativo
    secondary: '#38bdf8', // Azul claro
    accent: '#f59e42' // Naranja profesional
  },
  corporateDark: {
    name: 'Corporativo Oscuro',
    primary: '#2563eb',
    secondary: '#38bdf8',
    accent: '#f59e42'
  },
  highContrast: {
    name: 'Alto Contraste',
    primary: '#00e676', // Verde neón
    secondary: '#2979ff', // Azul neón
    accent: '#ff1744' // Rojo neón
  }
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  colorScheme: 'blue',
  currentScheme: colorSchemes.blue,
  isDark: false,
  setTheme: () => { },
  setColorScheme: () => { },
  toggle: () => { },
  availableSchemes: colorSchemes
})

export const prefersDarkMode = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}
