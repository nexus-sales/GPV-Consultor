import { expect, test } from '@playwright/test'

test('la home carga y muestra el layout principal', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/GPV Canarias/i)
  await expect(page.locator('h1')).toBeVisible()
})
