import { expect, test } from '@playwright/test'

const PAGE = '/build-plan.html'

test('reads top to bottom: the promise, the section bar, every section and diagram', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('Trusted Mover build plan')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every quote, booking and move, planned before a single node is placed.')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(14)
  await expect(page.locator('main > section')).toHaveCount(14)
  await expect(page.locator('figure.canvas')).toHaveCount(9)
})

test('the section bar marks the section being read', async ({ page }) => {
  await page.goto(`${PAGE}#tests`)
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Tests' })).toHaveAttribute('aria-current', 'true')
})

test('a step shows its settings; Escape closes them and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const node = page.locator('[data-node="tm-01:n6"]')
  await node.scrollIntoViewIfNeeded()
  await node.click()
  const panel = page.getByRole('dialog', { name: 'Extract move details' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Anthropic Chat Model + Structured Output Parser')
  await expect(panel).toContainText('Claude Haiku 4.5')
  await expect(panel.getByRole('button', { name: 'Close settings' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(node).toBeFocused()
})

test('a second step moves the panel to it, and focus lands on its Close', async ({ page }) => {
  await page.goto(PAGE)
  await page.locator('[data-node="tm-01:n6"]').click()
  const second = page.locator('[data-node="tm-01:n11"]')
  await second.click()
  const panel = page.getByRole('dialog', { name: 'Create job' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Close settings' })).toBeFocused()
})

test('the settings panel stays on screen at phone width, even for the last step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  const last = page.locator('[data-node="tm-01:n14"]')
  await last.scrollIntoViewIfNeeded()
  await last.click()
  const box = (await page.locator('#node-panel').boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(box.y + box.height).toBeLessThanOrEqual(844)
})

test('a ticked test row survives a reload, and Reset clears it', async ({ page }) => {
  await page.goto(`${PAGE}#tests`)
  const box = page.getByRole('checkbox', { name: 'Passed: t01 New quote' })
  await box.check()
  await expect(page.locator('#tests-count')).toHaveText('1 of 20 passed')
  await page.reload()
  await expect(box).toBeChecked()
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(box).not.toBeChecked()
  await expect(page.locator('#tests-count')).toHaveText('0 of 20 passed')
})

test('ticking still works when storage is blocked, with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })
  })
  await page.goto(`${PAGE}#tests`)
  await page.getByRole('checkbox', { name: 'Passed: t02 Duplicate' }).check()
  await expect(page.locator('#tests-count')).toHaveText('1 of 20 passed')
  expect(errors).toEqual([])
})

test('on its own it follows the device theme', async ({ browser }) => {
  for (const [scheme, bg] of [['light', 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body')).toHaveCSS('background-color', bg)
    await ctx.close()
  }
})

test('the run dot plays only while motion is allowed', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#tm-01`)
  await expect(page.locator('#tm-01 .canvas')).toHaveClass(/playing/)
  await ctx.close()
  const calm = await browser.newContext({ reducedMotion: 'reduce' })
  const still = await calm.newPage()
  await still.goto(`${PAGE}#tm-01`)
  for (const dot of await still.locator('#tm-01 .run-dot').all()) await expect(dot).toBeHidden()
  await still.waitForTimeout(1500)
  await expect(still.locator('#tm-01 .lit')).toHaveCount(0)
  await expect(still.locator('#tm-01 .run-ball')).toHaveCount(0)
  await calm.close()
})

test('at phone width the page never scrolls sideways; wide diagrams scroll in their own frame', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('#tm-01 .canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await expect(page.locator('#tm-01 .canvas')).toHaveAttribute('data-overflow', '')
})

test("the site's reduced-motion setting also stills the steps' hover", async ({ page }) => {
  await page.goto(PAGE)
  const card = page.locator('[data-node="tm-01:n1"] .node-card')
  expect(await card.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s')
  await page.evaluate(() => document.documentElement.setAttribute('data-a11y-motion', 'true'))
  expect(await card.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s')
})

test('the settings panel follows its step as the page scrolls, and closes once the step leaves the screen', async ({ page }) => {
  await page.goto(PAGE)
  const node = page.locator('[data-node="tm-01:n6"]')
  await node.scrollIntoViewIfNeeded()
  await node.click()
  const panel = page.locator('#node-panel')
  await expect(panel).toBeVisible()
  const before = (await panel.boundingBox())!.y
  await page.evaluate(() => window.scrollBy({ top: 120, behavior: 'instant' }))
  await expect.poll(async () => Math.round(before - (await panel.boundingBox())!.y)).toBe(120)
  await page.evaluate(() => window.scrollBy({ top: 3000, behavior: 'instant' }))
  await expect(panel).toBeHidden()
})

test('clicking the open step closes its panel, and each step says whether its panel is open', async ({ page }) => {
  await page.goto(PAGE)
  const node = page.locator('[data-node="tm-01:n6"]')
  await expect(node).toHaveAttribute('aria-expanded', 'false')
  await node.click()
  const panel = page.locator('#node-panel')
  await expect(panel).toBeVisible()
  await expect(node).toHaveAttribute('aria-expanded', 'true')
  await node.click()
  await expect(panel).toBeHidden()
  await expect(node).toHaveAttribute('aria-expanded', 'false')
})

test('Tab from the settings panel moves on to the next step', async ({ page }) => {
  await page.goto(PAGE)
  await page.locator('[data-node="tm-01:n6"]').click()
  await expect(page.getByRole('button', { name: 'Close settings' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('[data-node="tm-01:n7"]')).toBeFocused()
})

test('the settings panel clears a classic scrollbar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  // Headless Chromium draws overlay scrollbars; stand in for a 20px classic one.
  await page.evaluate(() => Object.defineProperty(document.documentElement, 'clientWidth', { get: () => 370 }))
  const last = page.locator('[data-node="tm-01:n14"]')
  await last.scrollIntoViewIfNeeded()
  await last.click()
  const box = (await page.locator('#node-panel').boundingBox())!
  expect(box.x + box.width).toBeLessThanOrEqual(370)
})

test('on its own, the plan links back to the portfolio', async ({ page }) => {
  await page.goto(PAGE)
  const home = page.getByRole('link', { name: '← Justine Acosta · Portfolio' })
  await expect(home).toBeVisible()
  await home.click()
  await expect(page).toHaveURL(/\/$/)
})

test('a step panel says in plain words what happens there, before its settings', async ({ page }) => {
  await page.goto(PAGE)
  await page.locator('[data-node="tm-01:n6"]').click()
  const panel = page.getByRole('dialog', { name: 'Extract move details' })
  await expect(panel.locator('[data-p=what]')).toHaveText(/^Claude reads the request/)
  await expect(panel.locator('dl')).toBeVisible()
})

test('the diagram key and the job stages explain themselves when clicked', async ({ page }) => {
  await page.goto(PAGE)
  const panel = page.locator('#node-panel')
  await page.getByRole('button', { name: 'Person approves', exact: true }).click()
  await expect(panel).toContainText('A person has to say yes')
  await expect(panel.locator('dl')).toBeHidden()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: '3 Booked', exact: true }).click()
  await expect(panel).toContainText('The deposit is paid')
})


test("a step's panel opens clear of the step's own name", async ({ page }) => {
  await page.goto(PAGE)
  const node = page.locator('[data-node="tm-02:a11"]')
  await node.scrollIntoViewIfNeeded()
  await node.click()
  const step = (await node.boundingBox())!
  const panel = (await page.locator('#node-panel').boundingBox())!
  const below = panel.y >= step.y + step.height
  const above = panel.y + panel.height <= step.y
  expect(below || above).toBe(true)
})

test('balls leave one at a time, each on one random route, lighting what they pass', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __balls: { route: string; at: number }[] }
    w.__balls = []
    new MutationObserver((list) => {
      for (const m of list)
        for (const n of m.addedNodes)
          if (n instanceof HTMLElement && n.classList.contains('run-ball') && n.closest('#tm-01'))
            w.__balls.push({ route: n.dataset.route!, at: performance.now() })
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(`${PAGE}#tm-01`)
  const fig = page.locator('#tm-01 .canvas')
  await expect(fig.locator('.node.lit').first()).toBeAttached({ timeout: 10_000 })
  await expect(fig.locator('.edge.lit').first()).toBeAttached({ timeout: 10_000 })
  const seen = () => page.evaluate(() => (window as unknown as { __balls: { route: string; at: number }[] }).__balls)
  await expect.poll(async () => new Set((await seen()).map((b) => b.route)).size, { timeout: 20_000 }).toBeGreaterThan(1)
  const balls = await seen()
  for (let i = 1; i < balls.length; i++) expect(balls[i].at - balls[i - 1].at).toBeGreaterThan(500)
  expect(await fig.locator('.run-ball').count()).toBeLessThanOrEqual(3)
})


test('no scrollbars show on the page, the diagrams, the tables or the code blocks', async ({ page }) => {
  await page.goto(PAGE)
  const hidden = (sel: string) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).scrollbarWidth)
  for (const sel of ['html', '.canvas-scroll', '.table-wrap', 'pre.code']) expect(await hidden(sel), sel).toBe('none')
})

test('diagram frames have no outline, and no inner box inside them', async ({ page }) => {
  await page.goto(PAGE)
  for (const frame of await page.locator('.canvas-scroll').all()) {
    expect(await frame.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe('0px')
    const inner = await frame.locator('> .stage').evaluate((el) => [getComputedStyle(el).borderTopWidth, getComputedStyle(el).backgroundColor])
    expect(inner).toEqual(['0px', 'rgba(0, 0, 0, 0)'])
  }
})

test('a diagram narrower than its frame sits in the middle', async ({ page }) => {
  await page.goto(PAGE)
  const frame = page.locator('#tm-04 .canvas-scroll')
  await frame.scrollIntoViewIfNeeded()
  const outer = (await frame.boundingBox())!
  const inner = (await frame.locator('> .stage').boundingBox())!
  expect(inner.width).toBeLessThan(outer.width)
  const left = inner.x - outer.x
  const right = outer.x + outer.width - (inner.x + inner.width)
  expect(Math.abs(left - right)).toBeLessThanOrEqual(2)
})

test('a diagram pans by dragging, and a drag never opens a step', async ({ page }) => {
  await page.goto(PAGE)
  const frame = page.locator('#tm-01 .canvas-scroll')
  await frame.scrollIntoViewIfNeeded()
  const box = (await frame.boundingBox())!
  const y = box.y + box.height - 30
  await page.mouse.move(box.x + box.width - 60, y)
  await page.mouse.down()
  await page.mouse.move(box.x + 100, y, { steps: 8 })
  await page.mouse.up()
  expect(await frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(200)
  const node = page.locator('[data-node="tm-01:n6"]')
  const n = (await node.boundingBox())!
  await page.mouse.move(n.x + 28, n.y + 28)
  await page.mouse.down()
  await page.mouse.move(n.x + 140, n.y + 28, { steps: 8 })
  await page.mouse.up()
  await expect(page.locator('#node-panel')).toBeHidden()
})

test('arrow buttons scroll a diagram, and fade edges show there is more to see', async ({ page }) => {
  await page.goto(`${PAGE}#tm-01`)
  const fig = page.locator('#tm-01 .canvas')
  const frame = fig.locator('.canvas-scroll')
  const left = fig.getByRole('button', { name: 'Scroll diagram left' })
  const right = fig.getByRole('button', { name: 'Scroll diagram right' })
  await expect(left).toBeDisabled()
  await expect(frame).toHaveAttribute('data-more-right', '')
  await expect(frame).not.toHaveAttribute('data-more-left')
  await right.click()
  await expect.poll(() => frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  await expect(frame).toHaveAttribute('data-more-left', '')
  await expect(left).toBeEnabled()
})

test('a node’s panel shows the tool it uses; a key item shows none', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="tm-01:n3"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const tools = page.locator('#node-panel [data-p=tools]')
  await expect(tools).toBeVisible()
  await expect(tools).toHaveText('Supabase')
  await expect(tools.locator('use')).toHaveAttribute('href', '#logo-supabase')
  await page.keyboard.press('Escape')
  await page.locator('[data-node="key:trigger"]').click()
  await expect(tools).toBeHidden()
})
