import { expect, test } from '@playwright/test'
import { settleIntro } from './helpers'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms', '/thank-you', '/no-such-page']

// The boot script applies the saved choice before first paint, as for a returning visitor.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('kraft-a11y', JSON.stringify({ text: 'xl' }))
    } catch {
      // Storage blocked: the test below then fails on data-a11y-text, loudly.
    }
  })
})

for (const width of [1440, 320]) {
  test(`largest text at ${width}px: every page fits and shows its heading`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const r of ROUTES) {
      await page.goto(r)
      await settleIntro(page)
      await expect(page.locator('html'), r).toHaveAttribute('data-a11y-text', 'xl')
      await expect(page.getByRole('heading', { level: 1 }), r).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, r).toBeLessThanOrEqual(0)
    }
  })
}
