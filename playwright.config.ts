import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
<<<<<<< HEAD
    baseURL: 'http://127.0.0.1:5173',
=======
    baseURL: 'http://127.0.0.1:5173',
>>>>>>> master
    headless: true,
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
<<<<<<< HEAD
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
=======
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
>>>>>>> master
    timeout: 120_000,
    reuseExistingServer: !process.env.CI
  }
})
