/// <reference lib="webworker" />
import {
  cleanupOutdatedCaches,
  createHandlerBoundToURL,
  precacheAndRoute
} from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'
import { NavigationRoute, registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

// Tomar control inmediatamente al activar
self.skipWaiting()
clientsClaim()

// Precachear todos los assets generados por Vite
precacheAndRoute(self.__WB_MANIFEST)

// Limpiar caches obsoletas en cada activación
cleanupOutdatedCaches()

// SPA fallback: cualquier navegación sirve index.html del cache
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api/]
  })
)

// ── PUSH NOTIFICATIONS ──────────────────────────────────────────────────────

interface PushPayload {
  title: string
  body: string
  tag?: string
  url?: string
  icon?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {
    title: 'GPV Consultor',
    body: 'Tienes alertas de visita pendientes.',
    tag: 'gpv-alert',
    url: '/',
    icon: '/icons/pwa-icon.svg'
  }

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon ?? '/icons/pwa-icon.svg',
      badge: '/icons/pwa-icon.svg',
      tag: payload.tag ?? 'gpv-alert',
      renotify: true,
      data: { url: payload.url ?? '/' }
    } as any)
  )
})

// Al pulsar la notificación: abrir/enfocar la app en la URL correspondiente
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl: string = event.notification.data?.url ?? '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const existing = clientList.find(
          (c) => c.url.includes(targetUrl) && 'focus' in c
        )
        if (existing) return existing.focus()
        return self.clients.openWindow(targetUrl)
      })
  )
})
