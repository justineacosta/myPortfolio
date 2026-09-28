import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the Kraft Method walks its five gates', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const lit = page.locator('.method-step[data-on] h3')
  await expect(lit).toHaveText('Kickoff')
  await expect(lit).toHaveText('Research', { timeout: 3000 })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the Method holds its first gate', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await page.waitForTimeout(2200)
    await expect(page.locator('.method-step[data-on] h3')).toHaveText('Kickoff')
  })
})
