import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the Kraft Method walks its five gates', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const lit = page.locator('.method-step[data-on] h3')
  await expect(lit).toHaveText('Kickoff')
  await expect(lit).toHaveText('Research', { timeout: 3000 })
})

test('live automation: the arrows change the flow, and its dots travel', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.getByRole('button', { name: 'Next automation' }).click()
  await expect(page.locator('#automation-title')).toHaveText('Every ticket answered in seconds.')
  expect(await page.locator('.flow-ball').first().evaluate((el) => el.getAnimations().length)).toBe(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the Method holds its first gate', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await page.waitForTimeout(2200)
    await expect(page.locator('.method-step[data-on] h3')).toHaveText('Kickoff')
  })

  test('no travelling dots', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await expect(page.locator('.flow-ball').first()).toBeHidden()
  })
})
