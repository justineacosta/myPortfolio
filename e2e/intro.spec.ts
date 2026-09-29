import { expect, test } from '@playwright/test'
import { catchRun, headlineLanding, headlineLines, INTRO_LOAD, loaderGeometry, settleIntro } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('plays on a full load of Home, then hands the page back', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await expect(page.locator('.intro-title')).toHaveCSS('opacity', '1')
  await settleIntro(page)
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
  await expect(page.locator('.bento')).toHaveCSS('opacity', '1')
})

test('the flying headline lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.scale).toBeCloseTo(1, 5)
  expect(r.sameSize).toBe(true)
  const lines = await headlineLines(page)
  expect(lines.real.length).toBeGreaterThanOrEqual(2)
  expect(lines.flying).toEqual(lines.real)
})

test("Kraft's loader: the KRAFT logo over a left-aligned headline at Kraft's size, the steps spread across", async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const g = await loaderGeometry(page)
  const gutter = 72 // 5vw at 1440
  expect(g.brand.text).toContain('KRAFT')
  expect(Math.abs(g.brand.left - gutter)).toBeLessThan(1)
  expect(Math.abs(g.title.left - gutter)).toBeLessThan(1)
  expect(g.brand.bottom).toBeLessThan(g.title.top)
  expect(g.font).toBeCloseTo(96, 0)
  expect(g.firstNode.top).toBeGreaterThan(g.title.bottom)
  expect(Math.abs(g.firstNode.left - gutter)).toBeLessThan(1)
  expect(Math.abs(g.lastNode.left + g.nodeSize - (g.vw - gutter))).toBeLessThan(1)
  expect(g.nodeSize).toBeCloseTo(56, 0)
})

test("the status dot is Kraft's 8px on screen", async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const g = await loaderGeometry(page)
  expect(g.dotSize).toBeCloseTo(8, 1)
})

test('the sidebar panel stays hidden while it plays, then fades in', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  await expect(page.locator('[data-intro-rail]')).toHaveCSS('opacity', '0')
  await settleIntro(page)
  await expect(page.locator('[data-intro-rail]')).toHaveCSS('opacity', '1')
})

test('the light bursts from the first icon before anything moves along a line', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const f = await catchRun(page, `(f) => f.at === 'burst0' && f.burst > 0.3`)
  expect(f.dot).toBe(0)
  expect(f.done).toEqual([false, false, false, false])
})

test('mid-box, the light is split in two, mirrored over and under the box, and the dot waits', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const f = await catchRun(page, `(f) => f.at === 'around1' && f.ring[1].top > 0.3 && f.ring[1].top < 0.7`)
  const [a, b] = f.sparks
  expect(a.opacity).toBe(1)
  expect(b.opacity).toBe(1)
  expect(Math.abs(a.x - b.x)).toBeLessThan(0.5)
  expect(Math.abs(a.y + b.y - 2 * f.centreY[1])).toBeLessThan(0.5)
  expect(Math.abs(a.y - b.y)).toBeGreaterThan(20)
  expect(f.ring[1].bottom).toBeCloseTo(f.ring[1].top, 5)
  expect(f.dot).toBe(0)
  expect(f.done).toEqual([true, false, false, false])
})

test('once the halves meet, the box is checked, its border stays lit and one dot runs on', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const f = await catchRun(page, `(f) => f.at === 'line1'`)
  expect(f.done).toEqual([true, true, false, false])
  const drawn = [0, 1, 2].flatMap((i) => [f.ring[i].top, f.ring[i].bottom])
  ;[1, 1, 1, 1, 0, 0].forEach((want, k) => expect(drawn[k]).toBeCloseTo(want, 5))
  expect(f.dot).toBe(1)
  expect(f.sparks.every((s) => s.opacity === 0)).toBe(true)
})

test('the lit border runs under each check badge, never over its tick', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await catchRun(page, `(f) => f.done[1]`)
  // Paint order: each box's border paths sit inside that box, before its badge, so the badge paints over them.
  const badgeOnTop = await page.evaluate(() =>
    [...document.querySelectorAll('.intro-node')].map((node, i) => {
      const check = node.querySelector('.intro-check')!
      const rings = [...document.querySelectorAll(`.intro-ring[data-node="${i}"]`)]
      return rings.length === 2 && rings.every((r) => node.contains(r) && !!(r.compareDocumentPosition(check) & Node.DOCUMENT_POSITION_FOLLOWING))
    }),
  )
  expect(badgeOnTop).toEqual([true, true, true, true])
})

test('the run takes about 3.5s, and Shipped is checked last', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const start = await catchRun(page, `(f) => f.at === 'burst0'`)
  const end = await catchRun(page, `(f) => f.done[3]`)
  expect(end.done).toEqual([true, true, true, true])
  expect(end.t - start.t).toBeGreaterThan(3200)
  expect(end.t - start.t).toBeLessThan(3900)
})

test('Skip ends it at once and moves focus to the page', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  await skip.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
  await expect(page.locator('#main-content')).toBeFocused()
})

test('Escape skips it', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
})

test('does not play on other routes', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('does not play when navigating back to Home inside the site', async ({ page }) => {
  await page.goto('/about')
  await sidebarNav(page).getByRole('link', { name: /^Home/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('[data-intro-overlay]')).toBeHidden()
})

test('navigating away during the intro hands the page back', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  // The sidebar is hidden while the intro plays, so leave the way Back would: through the router.
  await page.evaluate(() => (window as unknown as { next: { router: { push(h: string): void } } }).next.router.push('/about'))
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
})

test('while it plays, the hidden page can be neither clicked nor tabbed to', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  const hitsLink = await page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('[data-intro-rail] a[href]')!
    const b = link.getBoundingClientRect()
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    return !!hit && link.contains(hit)
  })
  expect(hitsLink).toBe(false)
  await skip.focus()
  await page.keyboard.press('Tab')
  const inHeld = await page.evaluate(() => !!document.activeElement?.closest('[data-intro-hold], [data-intro-rail] > *'))
  expect(inHeld).toBe(false)
})

test('Ctrl+K ends it and opens the palette', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  await page.keyboard.press('Control+k')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.getByRole('combobox', { name: 'Jump to a section' })).toBeFocused()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('never holds the page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('html')).not.toHaveAttribute('data-intro')
    await expect(page.locator('[data-intro-target]')).toHaveCSS('opacity', '1')
  })
})
