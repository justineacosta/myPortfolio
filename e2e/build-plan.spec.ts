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
  await expect(still.locator('#tm-01 .run-dot')).toBeHidden()
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
