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
  const before = await panel.evaluate((el) => el.scrollTop)
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

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

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
  expect(bodies.filter((b) => b.includes('Name the outcome')).length).toBe(0)
})
