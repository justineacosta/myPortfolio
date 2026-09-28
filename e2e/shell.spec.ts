import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact']
const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('every shell route renders without console or page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  for (const r of ROUTES) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('sidebar navigation swaps the panel and updates crumb and active item', async ({ page }) => {
  await page.goto('/')
  await sidebarNav(page).getByRole('link', { name: /^Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
  await expect(page.getByText('KRAFT / BUILDS')).toBeVisible()
  await expect(sidebarNav(page).getByRole('link', { name: /^Projects/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('navigation resets the panel scroll to the top', async ({ page }) => {
  await page.goto('/')
  const panel = page.locator('#main-content')
  await panel.evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.firstElementChild!.appendChild(spacer)
    el.scrollTop = 1200
  })
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBe(0)
})

test('two rapid clicks: the last one wins and the content is visible', async ({ page }) => {
  await page.goto('/')
  await sidebarNav(page).getByRole('link', { name: /^Projects/ }).click()
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('clicking the current page stays put', async ({ page }) => {
  await page.goto('/services')
  await sidebarNav(page).getByRole('link', { name: /^Services/ }).click()
  await expect(page).toHaveURL(/\/services$/)
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('navigates without the fade', async ({ page }) => {
    await page.goto('/')
    await sidebarNav(page).getByRole('link', { name: /^Contact|^FAQs/ }).click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})

test('Get in touch goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Get in touch' }).click()
  await expect(page).toHaveURL(/\/contact$/)
})
