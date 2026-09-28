import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('an empty send names the fields; a full one queues the message', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/contact')
  await hydrated(page)
  await page.getByRole('button', { name: /Send it/ }).click()
  await expect(page.getByLabel('FIRST NAME')).toBeFocused()
  await expect(page.getByText('Add your first name.')).toBeVisible()
  await page.getByLabel('FIRST NAME').fill('Ana')
  await page.getByLabel('LAST NAME').fill('Reyes')
  await page.getByLabel('EMAIL').fill('ana@example.com')
  await page.getByLabel('WHAT ARE YOU RUNNING INTO?').fill('Our intake is manual.')
  await page.getByRole('button', { name: /Send it/ }).click()
  await expect(page.getByRole('heading', { name: 'Message queued.' })).toBeVisible()
  await page.getByRole('button', { name: 'Send another' }).click()
  await expect(page.getByLabel('FIRST NAME')).toHaveValue('')
  expect(errors).toEqual([])
})

test('the FAQs open one at a time from the keyboard', async ({ page }) => {
  await page.goto('/contact')
  await hydrated(page)
  const second = page.getByRole('button', { name: /How fast can you start\?/ })
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: /What do you actually build\?/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText(/^Same week for small fixes\./)).toBeVisible()
})
