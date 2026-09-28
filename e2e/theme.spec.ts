import { expect, test } from '@playwright/test'

test.describe('theme on first paint', () => {
  test('a saved theme wins over the OS setting before any React code runs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(() => {
      localStorage.setItem('kraft-theme', 'light')
      document.addEventListener('DOMContentLoaded', () => {
        ;(window as unknown as { __themeAtDCL?: string }).__themeAtDCL = document.documentElement.dataset.theme
      })
    })
    await page.goto('/')
    const atDcl = await page.evaluate(() => (window as unknown as { __themeAtDCL?: string }).__themeAtDCL)
    expect(atDcl).toBe('light')
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`first visit follows the device (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
    })
  }

  test('body paints the Kraft background token', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(242, 245, 241)') // --bg light #F2F5F1
  })
})
