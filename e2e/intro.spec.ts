import { expect, test } from '@playwright/test'
import { headlineLanding, headlineLines, INTRO_LOAD, settleIntro } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('plays on a full load of Home, then hands the page back', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await expect(page.locator('.intro-title')).toHaveCSS('opacity', '1')
  await settleIntro(page)
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('.bento')).toHaveCSS('opacity', '1')
})

test('the flying headline lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.scale).toBeCloseTo(1, 5)
  expect(r.sameSize).toBe(true)
  const lines = await headlineLines(page)
  expect(lines.real.length).toBeGreaterThanOrEqual(2)
  expect(lines.flying).toEqual(lines.real)
})

test('Skip ends it at once and moves focus to the page', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('#main-content')).toBeFocused()
})

test('Escape skips it', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
})

test('does not play on other routes', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('does not play when navigating back to Home inside the site', async ({ page }) => {
  await page.goto('/about')
  await sidebarNav(page).getByRole('link', { name: /^Home/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('navigating away during the intro hands the page back', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  // The sidebar is hidden while the intro plays, so leave the way Back would: through the router.
  await page.evaluate(() => (window as unknown as { next: { router: { push(h: string): void } } }).next.router.push('/about'))
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
})

test('while it plays, the hidden page can be neither clicked nor tabbed to', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  const hitsLink = await page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('[data-intro-rail] a[href]')!
    const b = link.getBoundingClientRect()
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    return !!hit && link.contains(hit)
  })
  expect(hitsLink).toBe(false)
  await skip.focus()
  await page.keyboard.press('Tab')
  const inHeld = await page.evaluate(() => !!document.activeElement?.closest('[data-intro-hold], [data-intro-rail] > *'))
  expect(inHeld).toBe(false)
})

test('Ctrl+K ends it and opens the palette', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  await page.keyboard.press('Control+k')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.getByRole('combobox', { name: 'Jump to a section' })).toBeFocused()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never holds the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  })
})
