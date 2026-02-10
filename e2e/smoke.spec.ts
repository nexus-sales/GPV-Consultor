import { expect, test } from '@playwright/test'

test('la home carga y muestra el layout principal', async ({ page }) => {
  // Ir a la página de login
  await page.goto('/login');

  // Completar el formulario de login
  await page.fill('input[type="email"]', 'administracion@ucoipcanarias.com');
  await page.fill('input[type="password"]', '@LMB1828');
  await page.click('button[type="submit"]');

  // Esperar navegación a la home
  await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/dashboard');

  // Comprobar título y visibilidad del h1
  await expect(page).toHaveTitle(/GPV Canarias/i);
  await expect(page.locator('h1')).toBeVisible();
})
