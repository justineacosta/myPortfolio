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
