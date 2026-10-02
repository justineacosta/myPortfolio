import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('Ctrl+K, type, Enter navigates', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  await page.keyboard.type('abou')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/about$/)
  await expect(dialog).toBeHidden()
})

test('Ctrl+K from a focused link; Escape closes and returns focus to it', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const link = page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('link', { name: /^Home/ })
  await link.focus()
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
  await expect(link).toBeFocused()
})

test('clicking the scrim closes it', async ({ page }) => {
  await page.goto('/')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.mouse.click(10, 450) // left gutter, clear of the card and of the 14px rise-in offset
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
})

test('⌘K opens a Projects sub-view from another page, and Close stays on Projects', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('build plan')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects#build-plan$/)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('⌘K on the same page opens the view and the page stays visible', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('agents')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })).toBeVisible()
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('⌘K lands on a section, on this page and on another', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('live automation')
  await page.keyboard.press('Enter')
  await expect(page.locator('#automation')).toBeInViewport()
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')

  await page.keyboard.press('Control+k')
  await page.keyboard.type('quick answers')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/contact#faqs$/)
  await expect(page.locator('#faqs')).toBeInViewport()
})
