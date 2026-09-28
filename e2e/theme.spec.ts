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

test.describe('theme button', () => {
  test('toggles, persists and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await page.evaluate(() => localStorage.getItem('kraft-theme'))).toBe('light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('works when storage is blocked', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])
  })
})
