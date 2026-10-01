import { expect, test, type Page } from '@playwright/test'

const PAGE = '/automations.html'
const CODES = ['hp-01', 'wm-01', 'me-01', 'mw-01']
const tab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Flows' }).getByRole('tab', { name })
const visible = (page: Page) => page.evaluate((codes) => codes.filter((c) => getComputedStyle(document.getElementById(c)!).display !== 'none'), CODES)

test('opens on Harbor & Pine, one flow at a time; a click or the arrow keys switch flows', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.getByRole('tab')).toHaveCount(4)
  await expect(tab(page, /^Harbor & Pine/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['hp-01'])
  await tab(page, /^Westmere/).click()
  expect(await visible(page)).toEqual(['wm-01'])
  await expect(page).toHaveURL(/#wm-01$/)
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, /^Meridian Energy/)).toBeFocused()
  await expect(tab(page, /^Meridian Energy/)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(tab(page, /^Meridian Werks/)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, /^Harbor & Pine/)).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Home')
  await expect(tab(page, /^Harbor & Pine/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['hp-01'])
})

test('a #code address opens that flow', async ({ page }) => {
  await page.goto(`${PAGE}#mw-01`)
  await expect(tab(page, /^Meridian Werks/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['mw-01'])
})

test('a step explains itself; Escape closes it and focus goes back; switching flows closes it too', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="hp-01:hp-price"]')
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Price the move' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('n8n · Claude')
  await expect(panel).toContainText('What it reads')
  await expect(panel).toContainText('Why it’s here')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
  await step.click()
  await expect(panel).toBeVisible()
  // By keyboard: a click outside would close the panel by itself, and the panel may sit over the tabs.
  await tab(page, /^Harbor & Pine/).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, /^Westmere/)).toHaveAttribute('aria-selected', 'true')
  await expect(panel).toBeHidden()
})

test('the Zap reads top to bottom, its steps in one column', async ({ page }) => {
  await page.goto(`${PAGE}#mw-01`)
  const boxes = await page.locator('#mw-01 button.node').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y) })))
  expect(new Set(boxes.map((b) => b.x)).size).toBe(1)
  expect(boxes.map((b) => b.y)).toEqual([...boxes.map((b) => b.y)].sort((p, q) => p - q))
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the page never scrolls sideways; a wide flow pans in its own box, with its arrows once shown', async ({ page }) => {
    await page.goto(PAGE)
    for (const [i, code] of CODES.entries()) {
      await page.getByRole('tab').nth(i).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth), code).toBeLessThanOrEqual(390)
    }
    // Every flow's tab is on screen: none hides past the edge.
    const boxes = await page.getByRole('tab').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right })))
    for (const b of boxes) {
      expect(b.left).toBeGreaterThanOrEqual(0)
      expect(b.right).toBeLessThanOrEqual(390)
    }
    await tab(page, /^Westmere/).click()
    await expect(page.locator('#wm-01 figure.canvas')).toHaveAttribute('data-overflow', '')
    await expect(page.locator('#wm-01').getByRole('button', { name: 'Scroll diagram right' })).toBeVisible()
  })
})

test('loads and runs with no page errors, and every logo it points at is in its sheet', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  for (const i of [1, 2, 3, 0]) await page.getByRole('tab').nth(i).click()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
  const missing = await page.evaluate(() => [...document.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((h) => !document.getElementById(h.slice(1))))
  expect(missing).toEqual([])
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
