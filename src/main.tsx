import React from 'react'
import { createRoot } from 'react-dom/client'

import { RouterProvider } from 'react-router-dom'
import router from './router'
import { ThemeProvider } from './lib/ThemeProvider'
import { AuthProvider } from './lib/AuthContext'
import { SyncQueueProvider } from './lib/hooks/useSyncQueue'
import { ErrorBoundary } from './components/ErrorBoundary'
import './lib/config'
import './styles.css'

// Solo registrar SW en producción; en dev, limpiar registros/cachés obsoletos
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({ immediate: true })
    })
  } else {
    // Evita que un SW viejo (Workbox) intercepte recursos de Vite (/@vite/client, /src/*, etc.).
    const DEV_SW_CLEANUP_FLAG = '__gpv_dev_sw_cleanup_done__'

    const runCleanup = async () => {
      if (sessionStorage.getItem(DEV_SW_CLEANUP_FLAG)) return
      sessionStorage.setItem(DEV_SW_CLEANUP_FLAG, '1')

      const registrations = await navigator.serviceWorker.getRegistrations()
      const hadRegistrations = registrations.length > 0

      await Promise.all(registrations.map((r) => r.unregister()))

      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames
            .filter(
              (name) =>
                name.startsWith('workbox-') ||
                name.includes('workbox-precache') ||
                name.includes('vite-pwa')
            )
            .map((name) => caches.delete(name))
        )
      }

      // Si la página estaba controlada por un SW, hace falta recargar una vez para
      // que el cliente vuelva a pedir módulos a Vite sin el SW en medio.
      if (hadRegistrations || navigator.serviceWorker.controller) {
        window.location.reload()
      }
    }

    runCleanup().catch(() => {
      // best effort
    })
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <SyncQueueProvider>
            <RouterProvider router={router} />
          </SyncQueueProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
