import { expect, test } from '@playwright/test'
import { chat } from '../data/chat'
import { catchRun, headlineLanding, hydrated, INTRO_LOAD, loaderGeometry, settleIntro } from './helpers'
import { shown } from './pages'

test('phone: tab bar replaces the sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toBeHidden()
  const tabs = page.getByRole('navigation', { name: 'Sections' })
  await expect(tabs).toBeVisible()
  await expect(tabs.getByRole('link')).toHaveCount(5)
})

test('phone: Start goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Start a project' }).tap()
  await expect(page).toHaveURL(/\/contact$/)
})

test('phone: floating theme and search controls work', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/about')
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).tap()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Open command palette' }).tap()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
})

test('phone: a tap on the portrait fades in the drawn one, and another fades it out', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const swap = page.getByRole('button', { name: 'Show the drawn portrait' })
  const drawn = swap.locator('[data-portrait-drawn]')
  await expect(drawn).toHaveCSS('opacity', '0')
  await swap.tap()
  await expect(swap).toHaveAttribute('aria-pressed', 'true')
  await expect(drawn).toHaveCSS('opacity', '1')
  await swap.tap()
  await expect(drawn).toHaveCSS('opacity', '0')
})

test('phone: Thank-you and 404 stack the drawing above the message, and never scroll sideways', async ({ page }) => {
  for (const r of ['/thank-you', '/no-such-page']) {
    await page.goto(r)
    const art = page.getByRole('img', { name: 'Drawing of Justine raising a bottle in a café' })
    const h1 = page.getByRole('heading', { level: 1 })
    await expect(art).toBeVisible()
    expect((await art.boundingBox())!.y, r).toBeLessThan((await h1.boundingBox())!.y)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
})

test('phone: the document scrolls (no inner panel)', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  await page.locator('[data-panel-content]').evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.appendChild(spacer)
  })
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const panelScrolls = await page
    .locator('#main-content')
    .evaluate((el) => getComputedStyle(el).overflowY === 'auto')
  expect(panelScrolls).toBe(false)
})

test('phone: no contour on touch devices', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(4000)
  await expect(page.locator('[data-contour]')).toHaveCount(0)
})

for (const path of shown(['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact'])) {
  test(`phone: ${path} has the profile bar, with its buttons once`, async ({ page }) => {
    await page.goto(path)
    await settleIntro(page)
    const bar = page.locator('[data-phone-bar]')
    await expect(bar).toBeVisible()
    await expect(bar.getByText('Justine Acosta')).toBeVisible()
    await expect(bar).toHaveCSS('position', 'fixed')
    await expect(page.getByRole('button', { name: 'Toggle dark and light mode' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Open command palette' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Accessibility options' })).toHaveCount(1)
    await expect(page.locator('[data-floating-access]')).toBeHidden()
    // The page starts below the bar.
    const gap = await page.evaluate(() => {
      const b = document.querySelector('[data-phone-bar]')!.getBoundingClientRect()
      const first = document.querySelector('#main-content')!.firstElementChild!.getBoundingClientRect()
      return first.top - b.bottom
    })
    expect(gap).toBeGreaterThanOrEqual(8)
  })
}

test('phone: the profile bar slides away scrolling down and comes back scrolling up', async ({ page }) => {
  await page.goto('/about')
  const bar = page.locator('[data-phone-bar]')
  await expect(bar).not.toHaveAttribute('data-hidden')
  await page.mouse.wheel(0, 600)
  await expect(bar).toHaveAttribute('data-hidden')
  await expect.poll(() => bar.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0)
  await page.mouse.wheel(0, -60)
  await expect(bar).not.toHaveAttribute('data-hidden')
  await expect.poll(() => bar.evaluate((el) => el.getBoundingClientRect().top)).toBe(0)
})

test('phone: the intro lands exactly on the Home h1', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  await expect(page.getByRole('button', { name: 'Skip intro' })).toBeVisible()
  await settleIntro(page)
  const r = await headlineLanding(page)
  expect(r.dx).toBeLessThan(1)
  expect(r.dy).toBeLessThan(1)
  expect(r.sameSize).toBe(true)
  await expect(page.getByRole('navigation', { name: 'Sections' })).toHaveCSS('opacity', '1')
})

test("phone: Kraft's loader fits the screen, logo and headline on the 20px gutter", async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const g = await loaderGeometry(page)
  expect(g.brand.text).toContain('KRAFT')
  expect(Math.abs(g.brand.left - 20)).toBeLessThan(1)
  expect(Math.abs(g.title.left - 20)).toBeLessThan(1)
  expect(g.firstNode.top).toBeGreaterThan(g.title.bottom)
  expect(g.lastNode.left + g.nodeSize).toBeLessThanOrEqual(g.vw - 20 + 1)
  for (const l of g.labels) {
    expect(l.left).toBeGreaterThanOrEqual(0)
    expect(l.right).toBeLessThanOrEqual(g.vw)
  }
})

test('phone: the run plays at the quicker pace (62%, about 2.2s)', async ({ page }) => {
  await page.goto('/', INTRO_LOAD)
  const start = await catchRun(page, `(f) => f.at === 'burst0'`)
  const end = await catchRun(page, `(f) => f.done[3]`)
  expect(end.t - start.t).toBeGreaterThan(1900)
  expect(end.t - start.t).toBeLessThan(2600)
})

test('phone: reloading a scrolled Home still lands the intro at the top', async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
  // Hold images back so the load event (when the browser restores scroll) lands mid-intro.
  await page.route(/\.(png|jpe?g|gif|svg)(\?|$)|\/_next\/image/, async (route) => {
    await new Promise((r) => setTimeout(r, 2500))
    await route.continue()
  })
  await page.reload()
  await settleIntro(page)
  await page.waitForLoadState('load')
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  const top = await page.locator('[data-intro-target]').evaluate((el) => el.getBoundingClientRect().top)
  expect(top).toBeGreaterThan(0)
  expect(top).toBeLessThan(844)
})

test('phone: no page scrolls sideways', async ({ page }) => {
  for (const r of shown(['/projects', '/services', '/testimonials', '/about', '/contact'])) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
})

test('phone: at 320px every Projects card fits its frame and nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  for (const r of shown(['/projects', '/services', '/testimonials', '/about', '/contact'])) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
  await page.goto('/projects')
  const rights = await page.locator('main a[href^="#"]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().right)))
  expect(new Set(rights).size, `card right edges: ${rights.join(', ')}`).toBe(1)
})

test('phone: a tap on the 3D drum previews the page under it', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  const canvas = view.locator('canvas')
  await expect(canvas).toBeVisible()
  await page.waitForTimeout(800) // let the thumbnails land on the cards
  const box = (await canvas.boundingBox())!
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.45)
  const preview = page.getByRole('dialog', { name: / preview$/ })
  await expect(preview).toBeVisible()
  await preview.getByRole('button', { name: 'Close preview' }).tap()
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
})

test('phone: an open view fills the screen and holds the page still', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).tap()
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  expect((await view.boundingBox())!.width).toBe(390)
  // tap() brought the card into view with the page's smooth scrolling; let it finish first.
  const scrollY = () => page.evaluate(() => window.scrollY)
  await expect
    .poll(async () => {
      const a = await scrollY()
      await page.waitForTimeout(150)
      return a === (await scrollY())
    })
    .toBe(true)
  const y = await scrollY()
  await page.mouse.move(195, 500)
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 700)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.scrollY)).toBe(y)
})

test('phone: the largest text never scrolls sideways', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page.getByRole('button', { name: 'Accessibility options' }).tap()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'A++, Largest text' }).tap()
  for (const r of ['/', '/projects', '/services', '/about', '/contact']) {
    await page.goto(r)
    await settleIntro(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
})

test('phone: the sites view spins the 3D drum, not a grid', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  await expect(view.locator('canvas')).toBeVisible()
  await expect(view.locator('[data-carousel]')).toHaveCount(0)
})

test('phone: the Kraft Method steps stack down a line, full width; the page never scrolls sideways', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const width = await page.getByRole('list', { name: 'The five steps' }).evaluate((el) => el.clientWidth)
  const cards = await page
    .locator('.method-step')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => ({ top: r.top, bottom: r.bottom, width: r.width })))
  cards.slice(1).forEach((c, i) => expect(c.top).toBeGreaterThan(cards[i].bottom))
  // The card takes the row, less the line's gutter.
  for (const c of cards) expect(c.width).toBeGreaterThan(width - 40)
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
})

test('phone: a live automation still opens at its first node, scrolled to the start', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const region = page.getByRole('region', { name: 'Flow canvas. Scroll sideways to see all of it.' })
  await region.scrollIntoViewIfNeeded()
  expect(await region.evaluate((el) => el.scrollLeft)).toBe(0)
  await expect(region.getByRole('listitem').first()).toBeInViewport()
})

test("phone: the Home Projects fan keeps Kraft's size, within the card", async ({ page }) => {
  await page.goto('/')
  await settleIntro(page)
  const size = await page.locator('.arc').evaluate((el) => ({ w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) }))
  expect(size.h).toBe(215)
  expect(size.w).toBeLessThanOrEqual(369)
})

test('phone: a swipe across the Funnels fan scrubs it; a tap opens the sites view', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const fan = page.locator('[data-fan]')
  await fan.scrollIntoViewIfNeeded()
  const box = (await fan.boundingBox())!
  const cx = box.x + box.width / 2
  const y = box.y + box.height * 0.7
  const touch = (type: string, x: number) =>
    fan.dispatchEvent(type, { pointerType: 'touch', pointerId: 9, isPrimary: true, clientX: x, clientY: y, bubbles: true })
  await touch('pointerdown', cx)
  await touch('pointermove', cx - 60)
  await touch('pointermove', cx - 140)
  await touch('pointerup', cx - 140)
  const tag = page.locator('[data-fan-tag]')
  await expect(tag).toHaveAttribute('data-on', '')
  expect(await tag.textContent()).toBe(await page.locator('[data-fan-tile][data-front]').getAttribute('data-site'))
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' })).toHaveCount(0)
  await fan.tap()
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' })).toBeVisible()
})

test('phone: the Agentic Framework page fits the screen, its loop pans, and a tapped pin explains its rule', async ({ page }) => {
  await page.goto('/agentic-framework.html#loop')
  const width = page.viewportSize()!.width
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  await expect(page.locator('figure.canvas')).toHaveAttribute('data-overflow', '')
  await page.getByRole('button', { name: 'Rule R1: Write the spec first' }).tap()
  await expect(page.getByRole('dialog', { name: 'Write the spec first' })).toBeVisible()
})

test('phone: the chat launcher clears the tab bar, and the open panel fills the screen', async ({ page }) => {
  await page.route('**/api/chat', (route) => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: 'Hello.' }))
  await page.goto('/about')
  await settleIntro(page)
  await hydrated(page)
  const launcher = page.getByRole('button', { name: chat.launcher })
  const l = (await launcher.boundingBox())!
  const t = (await page.getByRole('navigation', { name: 'Sections' }).boundingBox())!
  expect(l.y + l.height).toBeLessThan(t.y)
  await launcher.tap()
  const panel = page.getByRole('dialog', { name: chat.title })
  await expect(panel).toBeVisible()
  // The panel rises into place; wait for it to settle before reading where it ends.
  await expect.poll(async () => (await panel.boundingBox())!.y).toBe(0)
  const p = (await panel.boundingBox())!
  expect(p.x).toBe(0)
  expect(p.width).toBe(390)
  expect(p.y + p.height).toBe(844)
})
