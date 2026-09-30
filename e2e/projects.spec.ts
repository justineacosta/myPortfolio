import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('a board card opens its write-up, and Back closes it', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^The build plan/ })
  await card.click()
  await expect(page).toHaveURL(/\/projects#build-plan$/)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await expect(view.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(card).toBeFocused()
})

test('a shared link opens the view; Close stays on the page', async ({ page }) => {
  await page.goto('/projects#support-desk')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Support Ticketing System' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
})

test('Escape closes a view and focus returns to its card', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^AI agents and RAG chatbots/ })
  await card.focus()
  await page.keyboard.press('Enter')
  const view = page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
  await expect(view).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(card).toBeFocused()
})

test('the page behind an open view does not scroll', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const panel = page.locator('#main-content')
  await page.getByRole('link', { name: /^AI agents and RAG chatbots/ }).click()
  await expect(page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })).toBeVisible()
  // Playwright scrolled the card into view to click it; let that smooth scroll finish first.
  const y = () => panel.evaluate((el) => el.scrollTop)
  await expect
    .poll(async () => {
      const a = await y()
      await page.waitForTimeout(150)
      return (await y()) - a
    })
    .toBe(0)
  const before = await y()
  await page.mouse.move(720, 450)
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600)
  await page.waitForTimeout(400)
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(before)
})

test('the cursor cue names the card under the pointer', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).hover()
  await expect(page.getByText('VIEW THE PLAN', { exact: true })).toBeVisible()
})

test('the reel marches, and pauses under the pointer', async ({ page }) => {
  await page.goto('/projects#reel')
  await hydrated(page)
  await expect(page.getByRole('dialog', { name: 'Workflow screens' })).toBeVisible()
  const row = page.locator('.reel-row')
  expect(await row.evaluate((el) => el.getAnimations()[0]?.playState)).toBe('running')
  // The row never holds still, so hover() would wait forever for it: point at
  // the stage's centre instead (the row fills the stage's height).
  const stage = (await page.locator('.reel').boundingBox())!
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2)
  await expect.poll(() => row.evaluate((el) => el.getAnimations()[0]?.playState)).toBe('paused')
})

test('the sites view lists every sample site', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^Funnels and sites/ }).click()
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' }).getByRole('listitem')).toHaveCount(8)
})

test('the sites view spins the 3D drum; its keyboard list opens a page, and Escape closes only the preview', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  await expect(view.locator('canvas')).toBeVisible()
  const list = view.getByRole('list', { name: 'Sample sites' })
  await expect(list.getByRole('button')).toHaveCount(8)
  await expect(list).toHaveCSS('opacity', '0')
  await page.keyboard.press('Tab')
  const first = list.getByRole('button', { name: 'Open Apex Build Co.' })
  await expect(first).toBeFocused()
  await expect(list).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')
  const preview = page.getByRole('dialog', { name: 'Apex Build Co. preview' })
  await expect(preview).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
  await expect(first).toBeFocused()
})

test('without WebGL, the Kraft carousel spins, and a focused page turns to the front and opens', async ({ page }) => {
  // A device where WebGL can't start at all.
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return /webgl/i.test(type) ? null : (orig as (...a: unknown[]) => unknown).call(this, type, ...rest)
    } as typeof orig
  })
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  const ring = view.locator('[data-carousel-ring]')
  await expect(ring).toBeVisible()
  await expect(view.locator('canvas')).toHaveCount(0)
  const turn = () => ring.evaluate((el) => el.style.transform)
  const before = await turn()
  await expect.poll(turn).not.toBe(before)
  const page3 = view.getByRole('button', { name: 'Open Payline' })
  await page3.focus()
  await page3.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Payline preview' })).toBeVisible()
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the sites view still spins the 3D drum', async ({ page }) => {
    await page.goto('/projects#sites')
    await hydrated(page)
    const view = page.getByRole('dialog', { name: 'Funnels and sites' })
    await expect(view.locator('canvas')).toBeVisible()
    await expect(view.locator('[data-carousel]')).toHaveCount(0)
  })


  test('the reel stands still and scrolls by hand', async ({ page }) => {
    await page.goto('/projects#reel')
    await hydrated(page)
    await expect(page.getByRole('dialog', { name: 'Workflow screens' })).toBeVisible()
    await expect(page.locator('.reel')).toHaveCSS('overflow-x', 'auto')
    expect(await page.locator('.reel-row').evaluate((el) => el.getAnimations().length)).toBe(0)
  })
})

test('other pages never load the Projects write-ups up front', async ({ request }) => {
  // The page's own scripts, as its HTML lists them. (Next may still prefetch
  // /projects later, at idle, when a link to it is on screen: that is fine.)
  const html = await (await request.get('/about')).text()
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  expect(srcs.length).toBeGreaterThan(0)
  const bodies = await Promise.all(srcs.map(async (src) => (await request.get(src)).text()))
  expect(bodies.filter((b) => b.includes('Write the spec first')).length).toBe(0)
})

test('the build plan window shows the plan and follows the site theme, dark by default', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/build-plan.html')
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => delete document.documentElement.dataset.theme)
  await expect.poll(theme).toBe('dark')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('/projects never fetches the plan page until its window opens', async ({ page }) => {
  const asked: string[] = []
  page.on('request', (r) => asked.push(new URL(r.url()).pathname))
  await page.goto('/projects')
  await hydrated(page)
  await page.waitForLoadState('networkidle')
  expect(asked).not.toContain('/build-plan.html')
})

test('a write-up window keeps its margin', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  const pad = await view.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))
  expect(pad).toBeGreaterThan(0)
})

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('Back from another page into Projects shows Projects, not the other page', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).click()
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
})

test('after closing a view, a router refresh never brings its hash back', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await view.getByRole('button', { name: 'Close' }).click()
  await page.evaluate(() => (window as unknown as { next: { router: { refresh(): void } } }).next.router.refresh())
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(view).toBeHidden()
})

test('the Funnels card turns on its own, and a pointer scrubs, names and peeks into a site', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const fan = page.locator('[data-fan]')
  await fan.scrollIntoViewIfNeeded()
  const front = () => page.locator('[data-fan-tile][data-front]').getAttribute('data-site')
  const first = await front()
  await expect.poll(front, { timeout: 5000 }).not.toBe(first)

  const box = (await fan.boundingBox())!
  await page.mouse.move(box.x + box.width / 2 - 140, box.y + box.height * 0.7, { steps: 4 })
  const picked = await front()
  const tag = page.locator('[data-fan-tag]')
  await expect(tag).toHaveAttribute('data-on', '')
  await expect(tag).toHaveText(picked!)
  // Held still under the pointer, it does not turn away.
  await page.waitForTimeout(3500)
  expect(await front()).toBe(picked)
  const tile = page.locator('[data-fan-tile][data-front]')
  await expect(tile).toHaveAttribute('data-peek')
  const y = () => tile.locator('img').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42)
  await expect.poll(y).toBeLessThan(-20)

  await page.mouse.move(box.x + box.width / 2 + 140, box.y + box.height * 0.7, { steps: 4 })
  await expect(tag).not.toHaveText(picked!)
})

test('the Funnels card still opens the sites view on a click', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.locator('[data-fan]').click()
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' })).toBeVisible()
})
