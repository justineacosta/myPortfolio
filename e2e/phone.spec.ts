import { expect, test } from '@playwright/test'
import { headlineLanding, settleIntro } from './helpers'

test('phone: tab bar replaces the sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toBeHidden()
  const tabs = page.getByRole('navigation', { name: 'Sections' })
  await expect(tabs).toBeVisible()
  await expect(tabs.getByRole('link')).toHaveCount(5)
})

test('phone: Start goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Start a project' }).tap()
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
  await settleIntro(page)
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

test('phone: Home opens with the profile header instead of floating controls', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('[data-home-profile]')
  await expect(header).toBeVisible()
  await expect(header.getByText('Justine Acosta')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Toggle dark and light mode' })).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Open command palette' })).toHaveCount(1)
})

test('phone: the intro lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.sameSize).toBe(true)
  await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCSS('opacity', '1')
})

test('phone: reloading a scrolled Home still lands the intro at the top', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
  // Hold images back so the load event (when the browser restores scroll) lands mid-intro.
  await page.route(/\.(png|jpe?g|gif|svg)(\?|$)|\/_next\/image/, async (route) => {
    await new Promise((r) => setTimeout(r, 2500))
    await route.continue()
  })
  await page.reload()
  await settleIntro(page)
  await page.waitForLoadState('load')
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  const top = await page.locator('[data-intro-target]').evaluate((el) => el.getBoundingClientRect().top)
  expect(top).toBeGreaterThan(0)
  expect(top).toBeLessThan(844)
})
