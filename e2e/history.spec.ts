import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('Back and Forward return each page to where it was scrolled', async ({ page }) => {
  // /services is the long page (about 1380px of scroll at 1440×900); /about fits the window.
  await page.goto('/services')
  await hydrated(page)
  const panel = page.locator('#main-content')
  const y = () => panel.evaluate((el) => el.scrollTop)
  const settled = async () => {
    await expect
      .poll(async () => {
        const a = await y()
        await page.waitForTimeout(150)
        return (await y()) - a
      })
      .toBe(0)
    return y()
  }
  await page.mouse.move(900, 450)
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 400)
      return y()
    })
    .toBeGreaterThan(500)
  const servicesY = await settled()

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
