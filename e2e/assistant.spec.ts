import { expect, test, type Page } from '@playwright/test'
import { hydrated, settleIntro } from './helpers'

test.describe.configure({ timeout: 60_000 }) // a chat round trip, or two, on top of a page load, with the whole suite running alongside

// The webServer runs with ASSISTANT_FAKE=1 (playwright.config.ts): scripted replies, no emails, no logging.

const launcher = (page: Page) => page.getByRole('button', { name: 'Ask Kraft’s assistant' })
const panel = (page: Page) => page.getByRole('dialog', { name: 'Kraft’s assistant' })
// A message as drawn in the chat. A finished reply is also copied into a screen-reader-only live region, which getByText would match too.
const said = (page: Page, text: string | RegExp) => panel(page).locator('p:not(.sr-only)').filter({ hasText: text })

/** Opens a page and waits for it to hydrate. The tests that don't need Home use /about, which has no intro to wait out. */
async function openPage(page: Page, path = '/about') {
  await page.goto(path)
  await hydrated(page)
  await settleIntro(page)
}

async function openPanel(page: Page) {
  await launcher(page).click()
  await expect(panel(page)).toBeVisible()
}

async function send(page: Page, text: string) {
  await panel(page).getByLabel('Your message').fill(text)
  await panel(page).getByRole('button', { name: 'Send' }).click()
}

test('the launcher sits directly above the accessibility button, clear of it', async ({ page }) => {
  await openPage(page, '/')
  await expect(launcher(page)).toBeVisible()
  const a = (await launcher(page).boundingBox())!
  const b = (await page.locator('[data-floating-access]').boundingBox())!
  expect(a.y + a.height).toBeLessThanOrEqual(b.y)
})

test('opening shows the greeting, and a chip streams in an answer', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await expect(panel(page).getByText('Hi, I’m Kraft’s assistant, an AI.')).toBeVisible()
  await panel(page).getByRole('button', { name: 'What do you build?' }).click()
  await expect(said(page, /full-stack apps/)).toBeVisible()
})

test('a request to see projects takes the page there and leaves the chat open with its history', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await send(page, 'Show me your projects')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(panel(page)).toBeVisible()
  await expect(said(page, 'Show me your projects')).toBeVisible()
  await expect(said(page, 'Here are Justine’s projects.')).toBeVisible()
})

test('a lead is passed on once the visitor gives their details', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await send(page, 'I have a project in mind')
  await expect(said(page, 'What’s your first and last name, your email, and what you need?')).toBeVisible()
  await send(page, 'Ana Reyes ana@example.com Our intake is manual')
  await expect(said(page, 'Sent. Justine will reply by email within one business day.')).toBeVisible()
})

test('when Claude fails, the site’s own answer is given and labelled', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await send(page, 'fail what do you charge')
  await expect(said(page, /Depends on the build/)).toBeVisible()
  await expect(panel(page).getByText('Answers come straight from this site.')).toBeVisible()
})

test('a lead intent after a failure offers the form card, which sends', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await send(page, 'fail I want to hire Justine')
  const card = panel(page).getByRole('group', { name: 'Leave Justine a message' })
  await expect(card).toBeVisible()
  await card.getByLabel('First name').fill('Ana')
  await card.getByLabel('Last name').fill('Reyes')
  await card.getByLabel('Email').fill('ana@example.com')
  await card.getByLabel('What do you need?').fill('Our intake is manual')
  await card.getByRole('button', { name: 'Send' }).click()
  await expect(said(page, 'Sent. Justine will reply by email within one business day.')).toBeVisible()
})

test('a reload keeps the conversation for the tab, and New chat clears it', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await send(page, 'What do you build?')
  await expect(said(page, /full-stack apps/)).toBeVisible()
  await page.reload()
  await hydrated(page)
  await openPanel(page)
  await expect(said(page, /^What do you build\?$/)).toBeVisible()
  await expect(said(page, /full-stack apps/)).toBeVisible()
  await panel(page).getByRole('button', { name: 'New chat' }).click()
  await expect(said(page, /full-stack apps/)).toHaveCount(0)
  await expect(panel(page).getByRole('button', { name: 'What do you build?' })).toBeVisible()
})

test('Esc closes the panel and puts focus back on the launcher', async ({ page }) => {
  await openPage(page)
  await openPanel(page)
  await expect(panel(page).getByLabel('Your message')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel(page)).toHaveCount(0)
  await expect(launcher(page)).toBeFocused()
})

test('at the largest text size the input form is still fully inside the panel', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('kraft-a11y', JSON.stringify({ text: 'xl' }))
    } catch {
      // Storage blocked: the data-a11y-text check below then fails loudly.
    }
  })
  for (const height of [900, 700]) {
    await page.setViewportSize({ width: 1440, height })
    await openPage(page)
    await expect(page.locator('html')).toHaveAttribute('data-a11y-text', 'xl')
    if ((await panel(page).count()) === 0) await openPanel(page)
    const box = (await panel(page).boundingBox())!
    for (const target of [
      panel(page).getByLabel('Your message'),
      panel(page).getByRole('button', { name: 'Send' }),
      panel(page).getByRole('link', { name: 'Privacy' }),
    ]) {
      await expect(target).toBeVisible()
      const r = (await target.boundingBox())!
      expect(r.y, `top at ${height}`).toBeGreaterThanOrEqual(box.y)
      expect(r.y + r.height, `bottom at ${height}`).toBeLessThanOrEqual(box.y + box.height)
      expect(r.x + r.width, `right at ${height}`).toBeLessThanOrEqual(box.x + box.width)
    }
  }
})

test('the Privacy page describes the assistant', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'The site assistant' })).toBeVisible()
  await expect(page.getByText('otherwise replies come straight from this site’s pages')).toBeVisible()
})
