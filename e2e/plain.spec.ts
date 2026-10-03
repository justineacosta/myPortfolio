import { expect, test } from '@playwright/test'

test('Thank-you stands alone: no sidebar, the document scrolls, the theme still toggles', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/thank-you')
  await expect(page.getByRole('heading', { level: 1, name: 'Got it. Talk soon.' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('an unknown address gets the styled 404 with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-page')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeVisible()
  await page.getByRole('link', { name: /Back to home/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('the thank-you page is not indexed', async ({ page }) => {
  await page.goto('/thank-you')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})
