import { expect, test, type Page } from '@playwright/test'
import { chat } from '../data/chat'
import { hydrated, settleIntro } from './helpers'

const REPLY = 'He builds apps and automations. See [the services](/services).\n[[lead-form]]'

/** Opens a page past the intro, with the chat route stood in for so no test reaches Anthropic. */
async function open(page: Page, path = '/about') {
  await page.route('**/api/chat', (route) =>
    route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', headers: { 'x-assistant-mode': 'live' }, body: REPLY }),
  )
  await page.goto(path)
  await settleIntro(page)
  await hydrated(page)
}

/** The first suggestion chip, which asks the question it shows. */
const firstChip = (panel: ReturnType<Page['getByRole']>) => panel.locator('[data-chips] button').first()

/** Opens Lumen from the launcher. */
async function openLumen(page: Page) {
  await page.getByRole('button', { name: chat.launcher }).click()
  const panel = page.getByRole('dialog', { name: chat.name })
  await expect(panel).toBeVisible()
  return panel
}

test('the launcher sits directly above the accessibility button', async ({ page }) => {
  await open(page)
  const launcher = (await page.getByRole('button', { name: chat.launcher }).boundingBox())!
  const access = (await page.locator('[data-floating-access]').boundingBox())!
  expect(launcher.y + launcher.height).toBeLessThan(access.y)
  expect(launcher.x + launcher.width).toBeCloseTo(access.x + access.width, 0)
})

test('a chip asks the question; the reply shows its link and the contact form, never the marker', async ({ page }) => {
  await open(page)
  const panel = await openLumen(page)
  await firstChip(panel).click()
  await expect(panel.getByRole('link', { name: 'the services' })).toBeVisible()
  await expect(panel.getByText(chat.lead.title)).toBeVisible()
  await expect(panel.getByText('[[lead-form]]')).toHaveCount(0)
  await expect(panel.getByText(chat.mode.live.label)).toBeVisible()
})

test('a link in the reply opens that page and closes the panel', async ({ page }) => {
  await open(page)
  const panel = await openLumen(page)
  await firstChip(panel).click()
  await panel.getByRole('link', { name: 'the services' }).click()
  await expect(page).toHaveURL(/\/services$/)
  await expect(panel).toHaveCount(0)
})

test('/ opens Lumen, and Esc closes it and puts focus back on the launcher', async ({ page }) => {
  await open(page)
  await page.keyboard.press('/')
  const panel = page.getByRole('dialog', { name: chat.name })
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(page.getByRole('button', { name: chat.launcher })).toBeFocused()
})

test('the chat survives a reload, and reset clears it', async ({ page }) => {
  await open(page)
  let panel = await openLumen(page)
  await firstChip(panel).click()
  await expect(panel.getByRole('link', { name: 'the services' })).toBeVisible()
  await page.reload()
  await settleIntro(page)
  await hydrated(page)
  panel = await openLumen(page)
  await expect(panel.getByRole('link', { name: 'the services' })).toBeVisible()
  await panel.getByRole('button', { name: chat.reset }).click()
  await expect(panel.getByRole('link', { name: 'the services' })).toHaveCount(0)
})
