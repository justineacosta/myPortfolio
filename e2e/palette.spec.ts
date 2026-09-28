import { expect, test } from '@playwright/test'

test('Ctrl+K, type, Enter navigates', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  await page.keyboard.type('testi')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/testimonials$/)
  await expect(dialog).toBeHidden()
})

test('Jump to button opens it; Escape closes and returns focus', async ({ page }) => {
  await page.goto('/')
  const jump = page.getByRole('button', { name: /Jump to/ })
  await jump.click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
  await expect(jump).toBeFocused()
})

test('clicking the scrim closes it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await page.mouse.click(10, 450) // left gutter, clear of the card and of the 14px rise-in offset
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
})
