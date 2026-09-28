import { expect, test } from '@playwright/test'

test('desktop: the contour canvas mounts after load', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
})

test('desktop: switching theme keeps the canvas running', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1)
})

test('desktop: turning on reduced motion mid-visit stops the contour', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-contour] canvas')).toHaveCount(0)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('no contour at all', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(4000)
    await expect(page.locator('[data-contour]')).toHaveCount(0)
  })
})

test('a restored low tier keeps the contour off', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('kraft-perf', 'low'))
  await page.goto('/')
  await page.waitForTimeout(4000)
  await expect(page.locator('[data-contour]')).toHaveCount(0)
})
