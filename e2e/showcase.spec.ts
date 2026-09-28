import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the flagship moves to the next screen on its own, and holds under the pointer', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const tabs = page.getByRole('tablist', { name: 'Product screens' })
  await expect(tabs.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true', { timeout: 9000 })
  await tabs.hover()
  await page.waitForTimeout(7000)
  await expect(tabs.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the flagship holds its first screen and the quotes stand still', async ({ page }) => {
    await page.goto('/showcase')
    await hydrated(page)
    await page.waitForTimeout(7000)
    await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: 'Pause the scrolling quotes' })).toBeHidden()
    const track = page.locator('.feedback .animate-marquee')
    expect(await track.evaluate((el) => el.getAnimations().length)).toBe(0)
  })
})
