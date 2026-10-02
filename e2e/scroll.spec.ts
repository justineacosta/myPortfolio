import { expect, test } from '@playwright/test'
import { hydrated, settleIntro } from './helpers'
import { isHidden } from './pages'

test('Lenis drives the panel on desktop and the wheel scrolls it', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  await expect(page.locator('.lenis')).toHaveCount(1)
  const panel = page.locator('#main-content')
  await panel.evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.firstElementChild!.appendChild(spacer)
  })
  await page.mouse.move(900, 450)
  // Lenis re-measures content ~250ms after it grows (debounced resize observer), so keep wheeling.
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 300)
      return panel.evaluate((el) => el.scrollTop)
    })
    .toBeGreaterThan(0)
})

test('Lenis is torn down below 1100px', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.lenis')).toHaveCount(1)
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(page.locator('.lenis')).toHaveCount(0)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('no Lenis and reveals are visible immediately', async ({ page }) => {
    test.skip(isHidden('/showcase'), 'the only reveal is on /showcase, switched off in data/nav.ts')
    // /showcase opens with a revealed frame (the Flagship).
    await page.goto('/showcase')
    await expect(page.locator('.lenis')).toHaveCount(0)
    await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1')
  })
})

test('a reveal becomes visible once in view', async ({ page }) => {
  test.skip(isHidden('/showcase'), 'the only reveal is on /showcase, switched off in data/nav.ts')
  await page.goto('/showcase')
  await expect(page.locator('[data-reveal]').first()).toHaveClass(/is-revealed/)
})

test('after moving from one page to a longer one, the wheel reaches the very bottom', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page
    .getByRole('complementary', { name: 'Profile and site navigation' })
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: /^Projects/ })
    .click()
  await expect(page).toHaveURL(/\/projects$/)
  const panel = page.locator('#main-content')
  await page.mouse.move(900, 450)
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 2000)
        return panel.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)
      },
      { timeout: 10_000 },
    )
    .toBeLessThan(2)
})
