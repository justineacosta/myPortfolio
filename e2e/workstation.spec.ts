import { expect, test } from '@playwright/test'
import { about } from '../data/about'

test('the About workstation plays as a looping video', async ({ page }) => {
  await page.goto('/about')
  const video = page.getByRole('img', { name: about.image.alt })
  await expect(video).toHaveJSProperty('tagName', 'VIDEO')
  // It is moving: time advances, and it never stops at the end.
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 10_000 }).toBeGreaterThan(0.3)
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused || !v.loop || !v.muted)).toBe(false)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the About workstation is its still frame, with no video at all', async ({ page }) => {
    await page.goto('/about')
    const still = page.getByRole('img', { name: about.image.alt })
    await expect(still).toHaveJSProperty('tagName', 'IMG')
    await expect(still).toHaveAttribute('src', about.image.still)
    await expect(page.locator('video')).toHaveCount(0)
  })
})
