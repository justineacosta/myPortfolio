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

for (const path of ['/', '/about', '/thank-you']) {
  test(`Kraft's green glow drifts behind ${path}, under the page`, async ({ page }) => {
    await page.goto(path)
    const glow = page.locator('[data-glow]')
    await expect(glow).toHaveCount(1)
    await expect(glow).toHaveCSS('position', 'fixed')
    await expect(glow).toHaveCSS('pointer-events', 'none')
    await expect(glow.locator('> *')).toHaveCSS('animation-name', 'kDrift')
    // The page's content sits in a layer above it.
    const above = await page.evaluate(() => {
      const main = document.querySelector('main')!
      let el: HTMLElement | null = main
      while (el && getComputedStyle(el).zIndex === 'auto') el = el.parentElement
      return el ? Number(getComputedStyle(el).zIndex) : 0
    })
    expect(above).toBeGreaterThan(0)
  })
}

test("Kraft's glow shows during the intro", async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  await expect(page.locator('[data-glow]')).toBeVisible()
})

test("desktop: the glow paints over the contour canvas, not under it (the canvas is opaque)", async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
  const glowAfterCanvas = await page.evaluate(() => {
    const glow = document.querySelector('[data-glow]')!
    const contour = document.querySelector('[data-contour]')!
    const z = (el: Element) => getComputedStyle(el).zIndex
    return z(glow) === z(contour) && !!(contour.compareDocumentPosition(glow) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(glowAfterCanvas).toBe(true)
})
