import { expect, test } from '@playwright/test'

test('phone: tab bar replaces the sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toBeHidden()
  const tabs = page.getByRole('navigation', { name: 'Sections' })
  await expect(tabs).toBeVisible()
  await expect(tabs.getByRole('link')).toHaveCount(5)
})

test('phone: Start goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Start a project' }).tap()
  await expect(page).toHaveURL(/\/contact$/)
})

test('phone: floating theme and search controls work', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/about')
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).tap()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Open command palette' }).tap()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
})

test('phone: the document scrolls (no inner panel)', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-panel-content]').evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.appendChild(spacer)
  })
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const panelScrolls = await page
    .locator('#main-content')
    .evaluate((el) => getComputedStyle(el).overflowY === 'auto')
  expect(panelScrolls).toBe(false)
})

test('phone: no contour on touch devices', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(4000)
  await expect(page.locator('[data-contour]')).toHaveCount(0)
})
