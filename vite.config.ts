import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

import { resolve } from 'path'

export default defineConfig({
  // Ignorar parserOptions.project para este archivo de configuración
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-nocheck
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      devOptions: {
        enabled: false,
        type: 'module'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,avif,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true
      },
      manifest: {
        name: 'GPV Canarias',
        short_name: 'GPV',
        description: 'Herramienta comercial para equipos de GPV Canarias.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es-ES',
        icons: [
          {
            src: 'icons/pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer]
    }
  },
  build: {
    // Sin manualChunks: Vite gestiona los bundles automáticamente
  }
})
