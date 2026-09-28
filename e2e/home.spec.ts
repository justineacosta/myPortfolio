import { expect, test } from '@playwright/test'
import { hydrated, settleIntro } from './helpers'

test("Home shows Kraft's headline, lede and actions", async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  const main = page.locator('#main-content')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Software that keeps its promises.')
  await expect(main.getByText(/^Full-stack development, AI automation and workflow systems/)).toBeVisible()
  await main.getByRole('link', { name: 'See the work' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('Home cards open their pages', async ({ page }) => {
  await page.goto('/')
  await page.locator('#main-content').getByRole('link', { name: /^Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('every Home logo and image loads from this site', async ({ page }) => {
  const bad: string[] = []
  page.on('response', (r) => {
    // The favicon arrives with the SEO work in Phase 4.
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) bad.push(`${r.status()} ${r.url()}`)
  })
  const offsite: string[] = []
  page.on('request', (r) => {
    const url = r.url()
    if (/^https?:/.test(url) && !url.startsWith('http://localhost:3100')) offsite.push(url)
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(bad).toEqual([])
  expect(offsite).toEqual([])
})

test('the wheel over the services row scrolls it sideways, then hands back to the page', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  const panel = page.locator('#main-content')
  const row = page.locator('[data-wheel-x]')
  await row.scrollIntoViewIfNeeded()
  const box = (await row.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)

  const before = await panel.evaluate((el) => el.scrollTop)
  expect(before).toBeGreaterThan(0) // the row sits below the fold, so the page has room to scroll back up
  await page.mouse.wheel(0, 200)
  await expect.poll(() => row.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(before)

  // At its start, an upward wheel belongs to the page again.
  await row.evaluate((el) => {
    el.style.scrollBehavior = 'auto'
    el.scrollLeft = 0
  })
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, -200)
      return panel.evaluate((el) => el.scrollTop)
    })
    .toBeLessThan(before)
})
