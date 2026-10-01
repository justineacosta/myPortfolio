import { expect, test, type Locator, type Page } from '@playwright/test'

const PAGE = '/ai-agents.html'
const fig = (page: Page, id: 'rag' | 'agent') => page.locator(`figure[data-diagram="${id}"]`)
const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity))
const route = (page: Page, name: string) => page.getByRole('button', { name: `Show its route: ${name}` })

test('reads top to bottom: the header, six chips, six sections, eight builds and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('AI agents and RAG chatbots · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How I build AI agents and RAG chatbots')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(6)
  await expect(page.locator('main > section')).toHaveCount(6)
  await expect(page.getByRole('button', { name: /^Show its route: / })).toHaveCount(8)
  await expect(page.locator('#glossary dt')).toHaveCount(15)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="search"]').click()
  await page.keyboard.press('Escape')
  await route(page, 'Inbox triage agent').click()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('on its own it opens light unless dark was chosen on the portfolio', async ({ browser }) => {
  for (const [saved, bg] of [[null, 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    if (saved) await ctx.addInitScript((t) => localStorage.setItem('kraft-theme', t), saved)
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body'), String(saved)).toHaveCSS('background-color', bg)
    await ctx.close()
  }
})

test('a step, a pin and a legend key each explain themselves; Escape closes and focus goes back', async ({ page }) => {
  await page.goto(`${PAGE}#rag`)
  for (const [sel, name, type] of [
    ['[data-node="search"]', 'Search', 'STEP'],
    ['[data-node="pin:docs:pdf"]', 'PDFs', 'SOURCE'],
    ['[data-node="key:rag:index"]', 'Index', 'LEGEND'],
  ] as const) {
    const btn = page.locator(sel)
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
    const panel = page.getByRole('dialog', { name })
    await expect(panel.locator('[data-p=type]')).toHaveText(type)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(btn).toBeFocused()
  }
})

test('Show its route lights one build’s path, dims the rest, and Show all clears it', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Billing follow-up agent')
  await btn.click()
  const agent = fig(page, 'agent')
  await expect(agent).toHaveAttribute('data-focus', 'billing')
  await expect(fig(page, 'rag')).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  await expect(agent.locator('.focus-text')).toHaveText(/^Billing follow-up agent: Stripe: Blade Studio invoice 14 days overdue/)
  const showAll = agent.getByRole('button', { name: 'Show all' })
  await expect(showAll).toBeFocused()
  await expect(agent).toBeInViewport()
  await expect(agent.locator('[data-node="gate"]')).toHaveClass(/\bon-route\b/)
  await expect(agent.locator('[data-node="pin:trigger:stripe"]')).toHaveClass(/\bon-route\b/)
  const off = agent.locator('[data-node="pin:trigger:gmail"]')
  await expect(off).not.toHaveClass(/\bon-route\b/)
  await expect.poll(() => opacity(off)).toBeLessThan(0.5)
  await showAll.click()
  await expect(agent).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
  await expect(btn).toBeFocused()
  await expect.poll(() => opacity(off)).toBe(1)
})

test('pressing the same build again clears its route', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Inbox triage agent')
  await btn.click()
  await expect(fig(page, 'agent')).toHaveAttribute('data-focus', 'inbox')
  await btn.click()
  await expect(fig(page, 'agent')).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
})

test('works from the keyboard: Enter shows a route, Enter on Show all goes back to the build', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Lead research agent')
  await btn.focus()
  await page.keyboard.press('Enter')
  const showAll = fig(page, 'agent').getByRole('button', { name: 'Show all' })
  await expect(showAll).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(btn).toBeFocused()
  await expect(fig(page, 'agent')).not.toHaveAttribute('data-focus')
})

test('the weekly report skips the gate: internal work needs no yes', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Weekly report agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('[data-node="gate"]')).not.toHaveClass(/\bon-route\b/)
  await expect(agent.locator('[data-node="act"]')).toHaveClass(/\bon-route\b/)
  await expect(agent.locator('.edge-label', { hasText: 'internal only' })).toHaveClass(/\bon-route\b/)
})

test('a RAG build lights the index its search reads; another build replaces it, in either diagram', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Help-desk RAG bot').click()
  const rag = fig(page, 'rag')
  await expect(rag.locator('.edge.index')).toHaveClass(/\bon-route\b/)
  await route(page, 'Document Q&A bot').click()
  await expect(rag).toHaveAttribute('data-focus', 'docqa')
  await expect(rag.locator('[data-node="pin:docs:pdf"]')).toHaveClass(/\bon-route\b/)
  await expect(rag.locator('[data-node="pin:docs:docs"]')).not.toHaveClass(/\bon-route\b/)
  await expect(route(page, 'Help-desk RAG bot')).toHaveAttribute('aria-pressed', 'false')
  await route(page, 'Inbox triage agent').click()
  await expect(rag).not.toHaveAttribute('data-focus')
  await expect(fig(page, 'agent')).toHaveAttribute('data-focus', 'inbox')
  await expect(route(page, 'Document Q&A bot')).toHaveAttribute('aria-pressed', 'false')
})

test('Escape closes the details panel first, then the route', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Help-desk RAG bot').click()
  const rag = fig(page, 'rag')
  await rag.locator('[data-node="answer"]').click()
  const panel = page.getByRole('dialog', { name: 'Claude answers' })
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(rag).toHaveAttribute('data-focus', 'helpdesk')
  await page.keyboard.press('Escape')
  await expect(rag).not.toHaveAttribute('data-focus')
  await expect(route(page, 'Help-desk RAG bot')).toBeFocused()
})

test('while a build is shown, balls run only its routes', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Weekly report agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('.run-ball').first()).toBeAttached({ timeout: 10_000 })
  for (let i = 0; i < 8; i++) {
    const routes = await agent.locator('.run-ball').evaluateAll((els) => els.map((e) => e.getAttribute('data-route')))
    expect(routes.every((r) => r === '3'), routes.join(',')).toBe(true)
    await page.waitForTimeout(250)
  }
})

test('under reduced motion there are no balls, and a route still lights and jumps into view', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Lead research agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('[data-node="pin:tool:web"]')).toHaveClass(/\bon-route\b/)
  await expect(agent).toBeInViewport()
  await page.waitForTimeout(2000)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await ctx.close()
})

test('print leaves out the route buttons and the caption bar', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Inbox triage agent').click()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.route-btn').first()).toBeHidden()
  await expect(fig(page, 'agent').locator('.focus-bar')).toBeHidden()
})

test('every step’s name and sub-line sit on one line', async ({ page }) => {
  await page.goto(PAGE)
  for (const el of await page.locator('.node-label, .node-sub').all()) {
    const lines = await el.evaluate((e) => {
      const r = document.createRange()
      r.selectNodeContents(e)
      return new Set([...r.getClientRects()].map((b) => Math.round(b.top))).size
    })
    expect(lines, (await el.textContent())!).toBe(1)
  }
})

test('pins are big enough to tap (24 px) and never overlap', async ({ page }) => {
  await page.goto(`${PAGE}#agent`)
  // Measure every pin in one go, so a scroll still settling cannot shift some boxes and not others.
  const boxes = await page.locator('.pin').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height } }))
  expect(boxes).toHaveLength(18)
  for (const b of boxes) {
    expect(b.width).toBeGreaterThanOrEqual(24)
    expect(b.height).toBeGreaterThanOrEqual(24)
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, b] = [boxes[i], boxes[j]]
      expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, `${i} × ${j}`).toBe(false)
    }
})

test('at phone width the page never scrolls sideways; both diagrams pan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  for (const id of ['rag', 'agent'] as const)
    expect(await fig(page, id).locator('.canvas-scroll').evaluate((el) => el.scrollWidth > el.clientWidth), id).toBe(true)
  for (const id of ['glance', 'builds', 'guardrails']) {
    const box = (await page.locator(`#${id}`).boundingBox())!
    expect(box.x + box.width, id).toBeLessThanOrEqual(390)
  }
})
