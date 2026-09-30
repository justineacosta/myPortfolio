import { expect, test } from '@playwright/test'

const PAGE = '/end-to-end.html'

test('reads top to bottom: the header, eleven lane chips, eleven lanes and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('End-to-End Workflow · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The End-to-End Workflow')
  await expect(page.getByRole('navigation', { name: 'Lanes' }).getByRole('link')).toHaveCount(11)
  await expect(page.locator('.lane')).toHaveCount(11)
  await expect(page.locator('#glossary dt')).toHaveCount(23)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="d2"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the lane chips mark the lane on screen', async ({ page }) => {
  await page.goto(`${PAGE}#lane-h`)
  await expect(page.getByRole('navigation', { name: 'Lanes' }).getByRole('link', { name: 'H n8n automation' })).toHaveAttribute('aria-current', 'true')
})

test('a step explains itself; Escape closes it and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="i1"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Approval gate' })
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-p=type]')).toHaveText('APPROVAL GATE')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^The work stops here until I say yes/)
  await expect(panel.locator('dl')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
})

test('the legend keys explain themselves', async ({ page }) => {
  await page.goto(PAGE)
  await page.getByRole('button', { name: 'Loop-back', exact: true }).click()
  await expect(page.locator('#node-panel')).toContainText('The work goes back to an earlier step')
})

test('balls leave one at a time, at most five, lighting what they pass', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __balls: number[] }
    w.__balls = []
    new MutationObserver((list) => {
      for (const m of list) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.classList.contains('run-ball')) w.__balls.push(performance.now())
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(`${PAGE}#lane-a`)
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
  await page.goto(`${PAGE}#lane-a`)
  await page.waitForTimeout(1500)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await expect(page.locator('.lit')).toHaveCount(0)
  await ctx.close()
})

test('at phone width the page never scrolls sideways; the graph pans, and the lane label stays pinned', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PAGE}#lane-d`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('.canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await frame.evaluate((el) => (el.scrollLeft = 500))
  const head = (await page.locator('#lane-d .lane-head').boundingBox())!
  const box = (await frame.boundingBox())!
  expect(head.x).toBeGreaterThanOrEqual(box.x)
  expect(head.x).toBeLessThan(box.x + 30)
})

test('every cable label sits inside the graph', async ({ page }) => {
  await page.goto(PAGE)
  const stage = (await page.locator('.stage').boundingBox())!
  for (const label of await page.locator('.edge-label').all()) {
    const b = (await label.boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(stage.x)
    expect(b.x + b.width).toBeLessThanOrEqual(stage.x + stage.width)
  }
})

test('a drag pans the graph and never opens a step', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  // No hash: a smooth jump to a lane would still be scrolling when the drag starts.
  await page.goto(PAGE)
  const frame = page.locator('.canvas-scroll')
  const step = page.locator('[data-node="g3"]')
  await step.scrollIntoViewIfNeeded()
  await frame.evaluate((el) => (el.scrollLeft = 0))
  const n = (await step.boundingBox())!
  await page.mouse.move(n.x + 28, n.y + 28)
  await page.mouse.down()
  await page.mouse.move(n.x - 160, n.y + 28, { steps: 8 })
  await page.mouse.up()
  expect(await frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  await expect(page.locator('#node-panel')).toBeHidden()
})

test('prints without balls, buttons or lane chips', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('nav.toc')).toBeHidden()
  await expect(page.locator('.pan')).toBeHidden()
  for (const ball of await page.locator('.run-ball').all()) await expect(ball).toBeHidden()
})

test('on its own it follows the device theme and links back to the portfolio', async ({ browser }) => {
  for (const [scheme, bg] of [['light', 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body')).toHaveCSS('background-color', bg)
    await expect(page.getByRole('link', { name: '← Justine Acosta · Portfolio' })).toBeVisible()
    await ctx.close()
  }
})

test('printing keeps the screen-reader step lists out of the graph', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  for (const list of await page.locator('.lane ol.steps').all()) expect(await list.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(1)
})

test('printing keeps the lane tints and the gate fill', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  for (const sel of ['.lane', '[data-node="i1"] .node-card']) expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).printColorAdjust), sel).toBe('exact')
})

test('a ball moves at one steady speed, so the lights keep up with it', async ({ page }) => {
  await page.goto(`${PAGE}#lane-a`)
  const ball = page.locator('.run-ball').first()
  await expect(ball).toBeAttached({ timeout: 10_000 })
  const frames = await ball.evaluate((el) =>
    (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes().map((k: ComputedKeyframe) => [k.computedOffset, String(k.offsetDistance)]),
  )
  for (const [at, distance] of frames) expect(distance).toBe(`${Math.round(Number(at) * 100)}%`)
})

test('at phone width every lane label fits the frame, before and while panning', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  const frame = page.locator('.canvas-scroll')
  const box = (await frame.boundingBox())!
  for (const left of [0, 300]) {
    await frame.evaluate((el, x) => (el.scrollLeft = x), left)
    for (const head of await page.locator('.lane-head').all()) {
      const b = await head.evaluate((el) => el.getBoundingClientRect().toJSON())
      expect(b.right, `${await head.textContent()} at ${left}`).toBeLessThanOrEqual(box.x + box.width)
    }
  }
})
