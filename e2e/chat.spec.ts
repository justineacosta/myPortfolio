import { expect, test, type Page } from '@playwright/test'
import { chat } from '../data/chat'
import { hydrated, settleIntro } from './helpers'

const REPLY = 'I build apps and automations. See [Services](/services).\n[[contact]]'

/** Opens a page past the intro, with the chat route stood in for so no test reaches Anthropic. */
async function open(page: Page, path = '/about') {
  await page.route('**/api/chat', (route) => route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body: REPLY }))
  await page.goto(path)
  await settleIntro(page)
  await hydrated(page)
}

test('the launcher sits directly above the accessibility button', async ({ page }) => {
  await open(page)
  const launcher = (await page.getByRole('button', { name: chat.launcher }).boundingBox())!
  const access = (await page.locator('[data-floating-access]').boundingBox())!
  expect(launcher.y + launcher.height).toBeLessThan(access.y)
  expect(launcher.x + launcher.width).toBeCloseTo(access.x + access.width, 0)
})

test('a suggestion asks the question and the reply shows without the hand-off marker', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: chat.launcher }).click()
  const panel = page.getByRole('dialog', { name: chat.title })
  await expect(panel).toBeVisible()
  await panel.getByRole('button', { name: chat.suggestions[0] }).click()
  // The screen-reader copy of the reply is a second match, so look at the visible bubble only.
  await expect(panel.locator('p:not(.sr-only)', { hasText: 'I build apps and automations.' })).toBeVisible()
  await expect(panel.getByText('[[contact]]')).toHaveCount(0)
  await expect(panel.getByRole('button', { name: chat.handoff })).toBeVisible()
})

test('the hand-off opens the contact form with the visitor’s question in it', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: chat.launcher }).click()
  const panel = page.getByRole('dialog', { name: chat.title })
  await panel.getByRole('button', { name: chat.suggestions[0] }).click()
  await panel.getByRole('button', { name: chat.handoff }).click()
  await expect(page).toHaveURL(/\/contact$/)
  await expect(page.locator('#contact-message')).toHaveValue(chat.suggestions[0])
  await expect(panel).toHaveCount(0)
})

test('a link in the reply opens that page and closes the panel', async ({ page }) => {
  await open(page)
  await page.getByRole('button', { name: chat.launcher }).click()
  const panel = page.getByRole('dialog', { name: chat.title })
  await panel.getByRole('button', { name: chat.suggestions[0] }).click()
  await panel.getByRole('link', { name: 'Services' }).click()
  await expect(page).toHaveURL(/\/services$/)
  await expect(panel).toHaveCount(0)
})

test('Esc closes the panel and puts focus back on the launcher', async ({ page }) => {
  await open(page)
  const launcher = page.getByRole('button', { name: chat.launcher })
  await launcher.click()
  const panel = page.getByRole('dialog', { name: chat.title })
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toHaveCount(0)
  await expect(launcher).toBeFocused()
})
