import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

/**
 * Setup only: puts the panel at `target` and waits until it stays there. It sets
 * the position directly (Lenis follows a native scroll while idle) and repeats
 * until it holds, since a wheel would need a spot clear of the page's nested
 * scrollers at every depth, and Lenis may still be settling from the load.
 */
async function scrollPanelTo(page: import('@playwright/test').Page, target: number) {
  const panel = page.locator('#main-content')
  await expect
    .poll(
      async () => {
        await panel.evaluate((el, t) => {
          el.scrollTop = t
        }, target)
        await page.waitForTimeout(250)
        return panel.evaluate((el) => el.scrollTop)
      },
      { timeout: 15_000 },
    )
    .toBe(target)
}

test('Back and Forward return each page to where it was scrolled', async ({ page }) => {
  // /services is the long page (about 1380px of scroll at 1440×900); /about fits the window.
  await page.goto('/services')
  await hydrated(page)
  const panel = page.locator('#main-content')
  const y = () => panel.evaluate((el) => el.scrollTop)
  await scrollPanelTo(page, 1200)
  const servicesY = await y()

  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(y).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/services$/)
  await expect.poll(async () => Math.abs((await y()) - servicesY)).toBeLessThan(3)

  await page.goForward()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(y).toBe(0)
})

// Shared by the two tests below: scroll /services well down and let it settle.
async function scrollServices(page: import('@playwright/test').Page) {
  await page.goto('/services')
  await hydrated(page)
  const panel = page.locator('#main-content')
  const y = () => panel.evaluate((el) => el.scrollTop)
  await scrollPanelTo(page, 1200)
  return { y, at: await y() }
}

test('after Back to a longer page, the next wheel scrolls on from the restored place', async ({ page }) => {
  const { y, at } = await scrollServices(page)
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/services$/)
  await expect.poll(async () => Math.abs((await y()) - at)).toBeLessThan(3)
  // Over the panel's own right-hand padding, clear of any nested scroller (the automation canvas).
  await page.mouse.move(1425, 450)
  await page.mouse.wheel(0, 60)
  await page.waitForTimeout(1200)
  const moved = (await y()) - at
  expect(moved).toBeGreaterThanOrEqual(0)
  expect(moved).toBeLessThan(150)
})

test('Back from Privacy returns the page to where it was scrolled', async ({ page }) => {
  const { y, at } = await scrollServices(page)
  await page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('link', { name: 'Privacy' }).click()
  await expect(page).toHaveURL(/\/privacy$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/services$/)
  await expect.poll(async () => Math.abs((await y()) - at)).toBeLessThan(3)
})
