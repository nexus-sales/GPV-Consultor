/**
 * Setup file para Vitest
 * Configura el entorno de testing con las utilidades necesarias
 */

import '@testing-library/jest-dom'

// Mock de window.matchMedia para tests con componentes que usan media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
})

// Mock de IntersectionObserver para tests con lazy loading
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as unknown as IntersectionObserver

// Mock de ResizeObserver para tests con componentes responsive
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
} as unknown as ResizeObserver

// Mock de localStorage
const localStorageMock = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null
}

global.localStorage = localStorageMock as unknown as Storage

// Mock de import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    DEV: false,
    PROD: false,
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key'
  }
})
