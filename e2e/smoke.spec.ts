import { expect, test } from '@playwright/test'

test('la home carga y muestra el layout principal', async ({ page }) => {
  // Ir a la página de login
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 15000 })
  // Usar credenciales de demo (habilitadas solo en DEV) para evitar credenciales reales en el repo.
  await page.fill('input[type="email"]', 'admin@gpv.local')
  await page.fill('input[type="password"]', 'admin')
  await page.click('button[type="submit"]')

  // Esperar navegación a la home
  await page.waitForURL(
    (url) => url.pathname === '/' || url.pathname === '/dashboard'
  )

  // Comprobar título y visibilidad del h1
  await expect(page).toHaveTitle(/GPV Canarias/i)
  await expect(page.locator('h1')).toBeVisible()
})
