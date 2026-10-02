import { expect, test, type Page } from '@playwright/test'
import { hydrated } from './helpers'

/** How far the site shot has scrolled up inside its window, in px. */
const scrolled = (page: Page) =>
  page.locator('.flag-shot').evaluate((el) => el.getBoundingClientRect().top - el.querySelector('img')!.getBoundingClientRect().top)

test('the flagship moves to the next business on its own, and holds under the pointer with the shot paused', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const tabs = page.getByRole('tablist', { name: 'Sample builds' })
  await expect(tabs.getByRole('tab', { name: 'Harbor & Pine' })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.getByRole('tab', { name: 'Westmere' })).toHaveAttribute('aria-selected', 'true', { timeout: 9000 })
  await tabs.hover()
  await page.waitForTimeout(7000)
  await expect(tabs.getByRole('tab', { name: 'Westmere' })).toHaveAttribute('aria-selected', 'true')
  expect(await page.locator('.flag-shot img').evaluate((el) => el.getAnimations().map((a) => a.playState))).toEqual(['paused'])
})

test('the site shot scrolls down while the clock runs', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  await page.mouse.move(0, 0)
  // Within the 6s cycle, under any load: polled rather than read once.
  await expect.poll(() => scrolled(page), { timeout: 5500 }).toBeGreaterThan(100)
})

test('every “What I built” link opens in a new tab and lands', async ({ page, request }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const hrefs = await page.locator('#flag-panel a').evaluateAll((as) => as.map((a) => [a.getAttribute('href')!, a.getAttribute('target')]))
  expect(hrefs.length).toBe(5)
  for (const [href, target] of hrefs) {
    expect(target).toBe('_blank')
    expect((await request.get(href!.split('#')[0])).ok(), href!).toBe(true)
  }
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the flagship holds Harbor & Pine with the shot at the top', async ({ page }) => {
    await page.goto('/showcase')
    await hydrated(page)
    await page.waitForTimeout(7000)
    await expect(page.getByRole('tab', { name: 'Harbor & Pine' })).toHaveAttribute('aria-selected', 'true')
    expect(await page.locator('.flag-shot img').evaluate((el) => el.getAnimations().length)).toBe(0)
    expect(await scrolled(page)).toBe(0)
  })
})

for (const width of [320, 390]) {
  test.describe(`a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } })
    test('the page never scrolls sideways; only the tab bar may', async ({ page }) => {
      await page.goto('/showcase')
      await hydrated(page)
      const wide = await page.evaluate(() => {
        const main = document.getElementById('main-content')!
        return [document.documentElement.scrollWidth - innerWidth, main.scrollWidth - main.clientWidth]
      })
      expect(wide).toEqual([0, 0])
      const box = (await page.locator('[data-flagship]').boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    })
  })
}

test.describe('a phone, as the clock moves on', () => {
  test.use({ viewport: { width: 390, height: 800 } })
  test('the tab bar keeps the open tab in view', async ({ page }) => {
    await page.goto('/showcase')
    await hydrated(page)
    await page.locator('[role=tablist]').scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    const tab = page.getByRole('tab', { name: 'Meridian Energy' })
    await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 16_000 })
    await page.waitForTimeout(800)
    const bar = (await page.getByRole('tablist').boundingBox())!
    const t = (await tab.boundingBox())!
    expect(t.x).toBeGreaterThanOrEqual(bar.x - 1)
    expect(t.x + t.width).toBeLessThanOrEqual(bar.x + bar.width + 1)
  })
})
