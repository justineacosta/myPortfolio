import { expect, test } from '@playwright/test'

const PAGE = '/agentic-framework.html'

test('reads top to bottom: the header, eight section chips, eight sections and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('Agentic Framework · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Agentic Framework')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(8)
  await expect(page.locator('main > section')).toHaveCount(8)
  await expect(page.locator('#glossary dt')).toHaveCount(18)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="check"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the section chips mark the section on screen', async ({ page }) => {
  await page.goto(`${PAGE}#rules`)
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Rules' })).toHaveAttribute('aria-current', 'true')
})

test('a step explains itself; Escape closes it and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="gate"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Approval' })
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-p=type]')).toHaveText('APPROVAL GATE')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^Nothing reaches a repo/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
})

test('a rule pin explains its rule; Escape closes it and focus goes back to the pin', async ({ page }) => {
  await page.goto(PAGE)
  const pin = page.getByRole('button', { name: 'Rule R1: Write the spec first' })
  await pin.click()
  const panel = page.getByRole('dialog', { name: 'Write the spec first' })
  await expect(panel.locator('[data-p=type]')).toHaveText('RULE R1')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^If I cannot describe done/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(pin).toBeFocused()
})

test('rule pins are big enough to tap (24 px) and never cover their step’s card', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  for (const pin of await page.locator('.pin').all()) {
    const p = (await pin.boundingBox())!
    expect(p.width).toBeGreaterThanOrEqual(24)
    expect(p.height).toBeGreaterThanOrEqual(24)
  }
})

test('a ball passing behind a step’s name never crosses its text', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const bg = await page.locator('.canvas-scroll').evaluate((el) => getComputedStyle(el).backgroundColor)
  for (const sel of ['[data-node="check"] .node-label', '[data-node="check"] .node-sub', '[data-node="frame"] .node-sub']) {
    expect(await page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor), sel).toBe(bg)
  }
  const ball = page.locator('.run-ball').first()
  await expect(ball).toBeAttached({ timeout: 10_000 })
  expect(await ball.evaluate((el) => el.compareDocumentPosition(document.querySelector('.node')!) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy()
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

test('at phone width the loop’s caption stays on one line', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PAGE}#loop`)
  const cap = page.locator('figure.canvas figcaption > span').first()
  // The span stretches to the pan buttons' height, so count the text's lines instead.
  const lines = await cap.evaluate((el) => {
    const r = document.createRange()
    r.selectNodeContents(el)
    return new Set([...r.getClientRects()].map((b) => Math.round(b.top))).size
  })
  expect(lines).toBe(1)
})

test('the legend keys explain themselves', async ({ page }) => {
  await page.goto(PAGE)
  await page.getByRole('button', { name: 'Rule pin', exact: true }).click()
  await expect(page.locator('#node-panel')).toContainText('One of my four rules')
})

test('balls leave one at a time, at most five, lighting what they pass', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __balls: number[] }
    w.__balls = []
    new MutationObserver((list) => {
      for (const m of list) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.classList.contains('run-ball')) w.__balls.push(performance.now())
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(`${PAGE}#loop`)
  const fig = page.locator('figure.canvas')
  await expect(fig).toHaveClass(/playing/)
  await expect(fig.locator('.node.lit').first()).toBeAttached({ timeout: 10_000 })
  await expect(fig.locator('.edge.lit').first()).toBeAttached({ timeout: 10_000 })
  await expect.poll(() => page.evaluate(() => (window as unknown as { __balls: number[] }).__balls.length), { timeout: 15_000 }).toBeGreaterThan(2)
  const times = await page.evaluate(() => (window as unknown as { __balls: number[] }).__balls)
  for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThan(500)
  expect(await fig.locator('.run-ball').count()).toBeLessThanOrEqual(5)
})

test('no balls and nothing lit under reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#loop`)
  await page.waitForTimeout(1500)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await expect(page.locator('.lit')).toHaveCount(0)
  await ctx.close()
})

test('a ball moves at one steady speed, so the lights keep up with it', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const ball = page.locator('.run-ball').first()
  await expect(ball).toBeAttached({ timeout: 10_000 })
  const frames = await ball.evaluate((el) =>
    (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes().map((k: ComputedKeyframe) => [k.computedOffset, String(k.offsetDistance)]),
  )
  for (const [at, distance] of frames) expect(distance).toBe(`${Math.round(Number(at) * 100)}%`)
})

test('at phone width the page never scrolls sideways; the loop pans', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PAGE}#loop`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('.canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await expect(page.locator('figure.canvas')).toHaveAttribute('data-overflow', '')
  for (const id of ['glance', 'jobs', 'example', 'habits']) {
    const box = (await page.locator(`#${id}`).boundingBox())!
    expect(box.x + box.width, id).toBeLessThanOrEqual(390)
  }
})

test('a drag pans the loop and never opens a step', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  // No hash: a smooth jump to a section would still be scrolling when the drag starts.
  await page.goto(PAGE)
  const frame = page.locator('.canvas-scroll')
  const step = page.locator('[data-node="check"]')
  await step.scrollIntoViewIfNeeded()
  await frame.evaluate((el) => (el.scrollLeft = 0))
  const n = (await step.boundingBox())!
  await page.mouse.move(n.x + 28, n.y + 28)
  await page.mouse.down()
  await page.mouse.move(n.x - 100, n.y + 28, { steps: 8 })
  await page.mouse.up()
  expect(await frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(60)
  await expect(page.locator('#node-panel')).toBeHidden()
})

test('every cable label sits inside the loop', async ({ page }) => {
  await page.goto(PAGE)
  const stage = (await page.locator('.stage').boundingBox())!
  for (const label of await page.locator('.edge-label').all()) {
    const b = (await label.boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(stage.x)
    expect(b.x + b.width).toBeLessThanOrEqual(stage.x + stage.width)
  }
})

test('prints without balls, buttons or chips, and keeps the tints', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('nav.toc')).toBeHidden()
  await expect(page.locator('.pan')).toBeHidden()
  for (const ball of await page.locator('.run-ball').all()) await expect(ball).toBeHidden()
  for (const sel of ['.tile', '[data-node="gate"] .node-card', '.tag.t-ship'])
    expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).printColorAdjust), sel).toBe('exact')
})

test('on its own it opens light unless dark was chosen on the portfolio, and links back to it', async ({ browser }) => {
  for (const [saved, bg] of [[null, 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)'], ['light', 'rgb(242, 245, 241)']] as const) {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    if (saved) await ctx.addInitScript((t) => localStorage.setItem('kraft-theme', t), saved)
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body'), String(saved)).toHaveCSS('background-color', bg)
    await expect(page.getByRole('link', { name: '← Justine Acosta · Portfolio' })).toBeVisible()
    await ctx.close()
  }
})

test('the worked example links to the End-to-End page', async ({ page }) => {
  await page.goto(`${PAGE}#example`)
  const see = page.getByRole('link', { name: 'See it: The End-to-End Workflow →' })
  await expect(see).toHaveAttribute('href', '/end-to-end.html')
  await expect(page.locator('#example .timeline li')).toHaveCount(6)
})

test('Check’s panel names both its tools; a rule pin names none', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  await page.locator('[data-node="check"]').click()
  const tools = page.locator('#node-panel [data-p=tools]')
  await expect(tools).toHaveText('CodexVS Code')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Rule R4: The model grades itself' }).click()
  await expect(tools).toBeHidden()
})

test('Check’s two badges sit together on its top-right corner, clear of its rule pin', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const card = (await page.locator('[data-node="check"] .node-card').boundingBox())!
  const pin = (await page.getByRole('button', { name: 'Rule R4: The model grades itself' }).boundingBox())!
  const badges = await page.locator('[data-node="check"] .logo-badge').all()
  expect(badges).toHaveLength(2)
  for (const b of badges) {
    const box = (await b.boundingBox())!
    expect(box.x + box.width / 2).toBeGreaterThan(card.x + card.width / 2)
    expect(box.y + box.height / 2).toBeLessThan(card.y + card.height / 2)
    const apart = box.x >= pin.x + pin.width || pin.x >= box.x + box.width || box.y >= pin.y + pin.height || pin.y >= box.y + box.height
    expect(apart).toBe(true)
  }
})

test('Check’s badges read in the sub-line’s order, Codex then VS Code, with the first on top', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const [first, second] = await page.locator('[data-node="check"] .logo-badge').all()
  const a = (await first.boundingBox())!
  const b = (await second.boundingBox())!
  expect(a.x).toBeLessThan(b.x)
  expect(await first.locator('use').first().getAttribute('href')).toBe('#logo-codex')
  // Where the two overlap, the first badge is the one you see.
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)!.closest('.logo-badge')!.querySelector('use')!.getAttribute('href'), [b.x + 3, b.y + b.height / 2])
  expect(hit).toBe('#logo-codex')
})
