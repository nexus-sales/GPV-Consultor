import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import router from './router'
import { ThemeProvider } from './lib/ThemeProvider'
import { AuthProvider } from './lib/AuthContext'

import { SyncQueueProvider } from './lib/hooks/useSyncQueue'
import { ConfirmProvider } from './lib/ConfirmProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient'
import './lib/config'
import './styles.css'

// Solo registrar SW en producción; en dev, limpiar registros/cachés obsoletos
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('[PWA] Nueva versión disponible, actualizando...')
          window.location.reload()
        },
        onOfflineReady() {
          console.log('[PWA] App lista para uso offline')
        }
      })
    })
  } else {
    // Evita que un SW viejo (Workbox) intercepte recursos de Vite (/@vite/client, /src/*, etc.).
    const DEV_SW_CLEANUP_FLAG = '__gpv_dev_sw_cleanup_done__'

    const runCleanup = async () => {
      if (sessionStorage.getItem(DEV_SW_CLEANUP_FLAG)) return
      
      try {
        const registrations = await navigator.serviceWorker.getRegistrations()
        const hadRegistrations = registrations.length > 0

        if (hadRegistrations) {
          await Promise.all(registrations.map((r) => r.unregister()))
          console.log('[PWA] Service Workers previos eliminados en DEV')
        }

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

        sessionStorage.setItem(DEV_SW_CLEANUP_FLAG, '1')

        // Si la página estaba controlada por un SW, hace falta recargar una vez para
        // que el cliente vuelva a pedir módulos a Vite sin el SW en medio.
        if (hadRegistrations || navigator.serviceWorker.controller) {
          window.location.reload()
        }
      } catch (err) {
        console.warn('[PWA] Error durante la limpieza de SW en DEV', err)
      }
    }

    runCleanup()
  }
}

import { Toaster } from 'sonner'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <SyncQueueProvider>
              <ConfirmProvider>
                <Toaster richColors position="top-right" closeButton />
                <RouterProvider router={router} />
              </ConfirmProvider>
            </SyncQueueProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
      {import.meta.env.DEV ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  </React.StrictMode>
)
