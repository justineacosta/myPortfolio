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
  await page.goto('/projects#agentic-framework')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The Agentic Framework' })
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

test.describe('on the narrowest phone', () => {
  test.use({ viewport: { width: 320, height: 640 } })

  test('the Automations card fits every flow’s chips inside its canvas', async ({ page }) => {
    await page.goto('/projects')
    await hydrated(page)
    const peek = page.locator('[data-flow-peek]')
    const box = (await peek.boundingBox())!
    const rights = await peek.locator('[data-chip]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))
    expect(rights.length).toBe(21)
    for (const r of rights) expect(r).toBeLessThanOrEqual(box.x + box.width)
  })
})

test('the Automations card opens its flows page in the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^Automations/ }).click()
  await expect(page).toHaveURL(/\/projects#automations$/)
  const view = page.getByRole('dialog', { name: 'Automations' })
  await expect(view).toBeVisible()
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/automations.html')
  await expect(page.frameLocator('iframe[title="Automations flows page"]').getByRole('heading', { level: 1 })).toHaveText('What happens after someone hits send')
})

test('the sites view lists every sample site', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^Funnels and sites/ }).click()
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' }).getByRole('listitem')).toHaveCount(11)
})

test('the sites view spins the 3D drum; its keyboard list opens a page, and Escape closes only the preview', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  await expect(view.locator('canvas')).toBeVisible()
  const list = view.getByRole('list', { name: 'Sample sites' })
  await expect(list.getByRole('button')).toHaveCount(11)
  await expect(list).toHaveCSS('opacity', '0')
  await page.keyboard.press('Tab')
  const first = list.getByRole('button', { name: 'Open Oriel' })
  await expect(first).toBeFocused()
  await expect(list).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')
  const preview = page.getByRole('dialog', { name: 'Oriel preview' })
  await expect(preview).toBeVisible()
  // The page is a bundled export: it unpacks itself inside the sandboxed frame.
  await expect(preview.frameLocator('iframe').getByRole('heading', { name: /Arrive before the building does/ })).toBeVisible({ timeout: 30_000 })
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
  await expect(first).toBeFocused()
})

test('Oriel’s preview steps through its five case pages', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  // The drum comes up first; its keyboard list is the way in.
  await expect(view.locator('canvas')).toBeVisible()
  await page.keyboard.press('Tab')
  const first = view.getByRole('list', { name: 'Sample sites' }).getByRole('button', { name: 'Open Oriel' })
  await expect(first).toBeFocused()
  await page.keyboard.press('Enter')
  const preview = page.getByRole('dialog', { name: 'Oriel preview' })
  await expect(preview).toBeVisible()
  const tabs = preview.getByRole('tablist', { name: 'Pages for this site' })
  const pages: [string, string, RegExp][] = [
    ['Automation', 'Oriel · Automation', /What happens after someone asks Oriel for a viewing/],
    ['Build plan', 'Oriel · Build plan', /Every viewing, email and model change/],
    ['Framework', 'Oriel · Framework', /How I would build Oriel with AI/],
    ['End-to-end', 'Oriel · End-to-end', /From a first question to the owners’ model/],
    ['AI agents', 'Oriel · AI agents', /A bot that answers from the sheets/],
  ]
  for (const [tab, title, heading] of pages) {
    await tabs.getByRole('tab', { name: tab }).click()
    await expect(tabs.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true')
    await expect(preview.frameLocator(`iframe[title="${title}"]`).getByRole('heading', { level: 1 })).toContainText(heading)
  }
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
  expect(errors).toEqual([])
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
  const page3 = view.getByRole('button', { name: 'Open Meridian Werks' })
  await page3.focus()
  await page3.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Meridian Werks preview' })).toBeVisible()
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
})

test('other pages never load the Projects write-ups up front', async ({ request }) => {
  // The page's own scripts, as its HTML lists them. (Next may still prefetch
  // /projects later, at idle, when a link to it is on screen: that is fine.)
  const html = await (await request.get('/about')).text()
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])
  expect(srcs.length).toBeGreaterThan(0)
  const bodies = await Promise.all(srcs.map(async (src) => (await request.get(src)).text()))
  expect(bodies.filter((b) => b.includes('Refuses to guess.')).length).toBe(0)
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

test('the End-to-End window shows the graph and follows the site theme', async ({ page }) => {
  await page.goto('/projects#end-to-end')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/end-to-end.html')
  const frame = page.frameLocator('iframe[title="End-to-End Workflow graph"]')
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('The End-to-End Workflow')
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('inside the End-to-End window, Escape closes it after a click in the graph', async ({ page }) => {
  await page.goto('/projects#end-to-end')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  await page.frameLocator('iframe[title="End-to-End Workflow graph"]').getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('lane chips in the graph add no history, so one Back closes the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /The End-to-End Workflow/ }).first().click()
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  const chips = page.frameLocator('iframe[title="End-to-End Workflow graph"]').getByRole('navigation', { name: 'Lanes' })
  await chips.getByRole('link', { name: 'H n8n automation' }).click()
  await chips.getByRole('link', { name: 'C Frame the task' }).click()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('/projects never fetches the plan page until its window opens', async ({ page }) => {
  const asked: string[] = []
  page.on('request', (r) => asked.push(new URL(r.url()).pathname))
  await page.goto('/projects')
  await hydrated(page)
  await page.waitForLoadState('networkidle')
  expect(asked).not.toContain('/build-plan.html')
  expect(asked).not.toContain('/end-to-end.html')
  expect(asked).not.toContain('/agentic-framework.html')
  expect(asked).not.toContain('/automations.html')
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

test('an old #support-desk link just shows Projects', async ({ page }) => {
  await page.goto('/projects#support-desk')
  await hydrated(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
  await expect(page.locator('dialog.view[open]')).toHaveCount(0)
})

test('inside the build plan window, Escape still closes it after a click in the plan', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await frame.getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('section links in the plan add no history, so one Back closes the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).click()
  const view = page.getByRole('dialog', { name: 'The build plan' })
  const nav = page.frameLocator('iframe[title="Trusted Mover build plan"]').getByRole('navigation', { name: 'Sections' })
  await nav.getByRole('link', { name: 'Tests' }).click()
  await nav.getByRole('link', { name: 'Data' }).click()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test("the site's larger text is not applied twice inside the plan", async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => (document.documentElement.dataset.a11yText = 'xl'))
  await page.evaluate(() => (document.documentElement.dataset.a11yMotion = 'true'))
  await expect.poll(() => frame.locator('html').getAttribute('data-a11y-motion')).toBe('true')
  expect(await frame.locator('html').getAttribute('data-a11y-text')).toBeNull()
})


test('inside the site window the plan hides its link back to the portfolio', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(frame.locator('a.home')).toBeHidden()
})

test('the Agentic Framework window shows its page and follows the site theme', async ({ page }) => {
  await page.goto('/projects#agentic-framework')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The Agentic Framework' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/agentic-framework.html')
  const frame = page.frameLocator('iframe[title="Agentic Framework page"]')
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('The Agentic Framework')
  await expect(frame.locator('a.home')).toBeHidden()
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('section chips in the Agentic Framework add no history, so one Back closes the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /The Agentic Framework/ }).first().click()
  const view = page.getByRole('dialog', { name: 'The Agentic Framework' })
  const chips = page.frameLocator('iframe[title="Agentic Framework page"]').getByRole('navigation', { name: 'Sections' })
  await chips.getByRole('link', { name: 'The loop' }).click()
  await chips.getByRole('link', { name: 'Rules' }).click()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('a standalone page in its dialog copies the site’s performance setting', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => (document.documentElement.dataset.perf = 'low'))
  await expect.poll(() => frame.locator('html').getAttribute('data-perf')).toBe('low')
})

test('a page opened in a new tab from its dialog keeps the site’s performance setting, so a slow device gets no contour', async ({ page }) => {
  await page.goto('/projects#end-to-end')
  await hydrated(page)
  await page.evaluate(() => sessionStorage.setItem('kraft-perf', 'low'))
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  const [tab] = await Promise.all([page.waitForEvent('popup'), view.getByRole('link', { name: 'Open in new tab' }).click()])
  await tab.waitForLoadState('load')
  await expect(tab.locator('html')).toHaveAttribute('data-perf', 'low')
  await tab.waitForTimeout(4000)
  await expect(tab.locator('canvas[data-contour]')).toHaveCount(0)
})

test('the AI agents card opens its page in the window; Escape clears a shown route first, then closes', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^AI agents and RAG chatbots/ }).click()
  const view = page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/ai-agents.html')
  const frame = page.frameLocator('iframe[title="AI agents and RAG chatbots page"]')
  const btn = frame.getByRole('button', { name: 'Show its route: Billing follow-up agent' })
  await btn.click()
  await expect(frame.locator('figure[data-diagram="agent"]')).toHaveAttribute('data-focus', 'billing')
  await page.keyboard.press('Escape')
  await expect(frame.locator('figure[data-diagram="agent"]')).not.toHaveAttribute('data-focus')
  await expect(view).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
})

test('the AI agents card’s preview plays only on screen, and holds still under reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const ctx = await browser.newContext({ reducedMotion, viewport: { width: 1280, height: 400 } })
    const page = await ctx.newPage()
    await page.goto('/projects')
    await hydrated(page)
    const q = page.locator('.agents-preview .ap-q')
    const state = () => q.evaluate((el) => ({ name: getComputedStyle(el).animationName, play: getComputedStyle(el).animationPlayState }))
    if (reducedMotion === 'reduce') {
      expect((await state()).name).toBe('none')
      await expect(q).toBeVisible()
    } else {
      // Off screen it rests on the finished chat, not an empty frame.
      expect((await state()).name).toBe('none')
      expect(await page.locator('.agents-preview .ap-a').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
      await page.locator('.agents-preview').scrollIntoViewIfNeeded()
      await expect.poll(async () => (await state()).name).toBe('apQ')
      expect((await state()).play).toBe('running')
    }
    await ctx.close()
  }
})

test('the San Fernando banner opens its case study; Escape closes it and focus returns', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^REAL CLIENT/ })
  const box = (await card.boundingBox())!
  expect(box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await card.click()
  await expect(page).toHaveURL(/\/projects#san-fernando$/)
  const view = page.getByRole('dialog', { name: 'Barangay San Fernando - Government Citizen Portal' })
  await expect(view.getByRole('heading', { name: 'The problem' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(card).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('a shared San Fernando link opens the case study; Close stays on Projects', async ({ page }) => {
  await page.goto('/projects#san-fernando')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Barangay San Fernando - Government Citizen Portal' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})
