import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Ignorar parserOptions.project para este archivo de configuración
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-nocheck
  test: {
    environment: 'node',
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html']
    }
  }
})
