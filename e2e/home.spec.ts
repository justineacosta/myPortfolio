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
    if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`)
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

/** On-screen angle, in degrees, of a badge part (CSS transforms included). */
const angles = (page: import('@playwright/test').Page, part: string) =>
  page.locator(`[data-cert-badge] ${part}`).evaluateAll((els) =>
    els.map((el) => {
      const m = (el as SVGGraphicsElement).getScreenCTM()!
      return Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI) + 0 // no -0
    }),
  )

test('the credential medals tilt, but their ribbons always hang straight down', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await hydrated(page)
  expect(await angles(page, '[data-cert-ring]')).toEqual([-11, 11])
  expect(await angles(page, '[data-cert-ribbon]')).toEqual([0, 0])
  await page.getByRole('img', { name: 'HackerRank Software Engineer' }).hover()
  await page.waitForTimeout(700)
  expect(await angles(page, '[data-cert-ribbon]')).toEqual([0, 0])

  await page.goto('/about')
  await hydrated(page)
  await page.getByRole('img', { name: 'AWS Cloud Practitioner Essentials' }).hover()
  await page.waitForTimeout(700)
  expect(await angles(page, '[data-cert-ring]')).toEqual([-5, 0])
  expect(await angles(page, '[data-cert-ribbon]')).toEqual([0, 0])
})

/** The Projects fan's box and its middle card's size. */
const arcSize = (page: import('@playwright/test').Page) =>
  page.locator('.arc').evaluate((el) => {
    const card = el.querySelectorAll<HTMLElement>('.arc-card')[2]
    return { w: Math.round(el.clientWidth), h: Math.round(el.clientHeight), card: Math.round(card.offsetWidth) }
  })

test('desktop: the Projects fan fills its card up to 1.4x Kraft size, keeping its shape', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [width, expected] of [
    [1440, { w: 452, h: 263, card: 181 }],
    [1920, { w: 520, h: 303, card: 208 }],
  ] as const) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/')
    await hydrated(page)
    const size = await arcSize(page)
    expect(size, `${width}px`).toEqual(expected)
  }
})
