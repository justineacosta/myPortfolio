import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

const sidebarMenu = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('button', { name: 'Accessibility options' })

test('motion off from the sidebar menu sticks across pages and skips the intro', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: /^Motion off/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-a11y-motion', 'true')
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-a11y-motion', 'true')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
})

test('stronger contrast brightens the muted text; underlined links underline', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const ink3 = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink3').trim())
  const before = await ink3()
  await sidebarMenu(page).click()
  const panel = page.getByRole('dialog', { name: 'Accessibility' })
  await panel.getByRole('button', { name: /^Stronger contrast/ }).click()
  expect(await ink3()).not.toBe(before)
  await panel.getByRole('button', { name: /^Underlined links/ }).click()
  await expect(page.locator('#main-content a').first()).toHaveCSS('text-decoration-line', 'underline')
})

test('larger text grows the page and the sidebar', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'A++, Largest text' }).click()
  await expect(page.locator('#main-content > div')).toHaveCSS('zoom', '1.25')
  await expect(page.locator('aside[data-a11y-scale] > *').first()).toHaveCSS('zoom', '1.25')
})

test('at the largest text on a short window, the panel never covers its button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 560 })
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'A++, Largest text' }).click()
  await page.keyboard.press('Escape')
  await sidebarMenu(page).click()
  const panel = page.getByRole('dialog', { name: 'Accessibility' })
  await expect(panel).toBeVisible()
  const b = (await sidebarMenu(page).boundingBox())!
  const p = (await panel.boundingBox())!
  const overlaps = p.x < b.x + b.width && b.x < p.x + p.width && p.y < b.y + b.height && b.y < p.y + p.height
  expect(overlaps).toBe(false)
})
