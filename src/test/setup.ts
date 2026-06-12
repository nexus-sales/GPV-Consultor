/**
 * Setup file para Vitest
 * Configura el entorno de testing con las utilidades necesarias
 */

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

// Ensure RTL cleanup runs after every test in every file.
// With pool: forks + singleFork: true, RTL's own afterEach(cleanup) only
// registers in the first file that imports RTL. This global registration
// covers all subsequent files.
afterEach(cleanup)

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
const IntersectionObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  takeRecords: vi.fn(() => []),
  unobserve: vi.fn()
}))
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock
})
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock
})

// Mock de ResizeObserver para tests con componentes responsive
const ResizeObserverMock = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn()
}))
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
})
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock
})

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
