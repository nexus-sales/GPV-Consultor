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
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
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
    // Code splitting optimizado para reducir bundle size
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React y ReactDOM separados (cambio poco frecuente)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase como vendor separado
          'supabase-vendor': ['@supabase/supabase-js'],
          // Librerías de gráficos
          'charts-vendor': ['recharts', 'd3-array', 'd3-scale'],
          // Librerías de PDF
          'pdf-vendor': [
            'jspdf',
            'jspdf-autotable',
            'html2canvas',
            '@react-pdf/renderer'
          ],
          // Utilidades de drag & drop
          'dnd-vendor': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities'
          ],
          // Utilidades varias
          'utils-vendor': ['date-fns', 'zod', 'papaparse', 'xlsx']
        },
        // Naming pattern para mejor cacheo
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Límite de advertencia aumentado temporalmente
    chunkSizeWarningLimit: 300,
    // Reporte detallado del build
    reportCompressedSize: true
  },
  // Optimizaciones para desarrollo
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'recharts',
      'html2canvas',
      '@react-pdf/renderer',
      '@dnd-kit/core',
      'jspdf',
      'jspdf-autotable',
      'date-fns',
      'zod',
      'papaparse',
      'leaflet',
      'react-leaflet'
    ],
    force: true
  }
})
