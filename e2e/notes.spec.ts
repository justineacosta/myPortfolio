import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'
import { isHidden } from './pages'

/**
 * The guides, read from data/notes.ts's text (Playwright cannot load data/nav's
 * icons, which data/notes imports): each post's slug, title and draft flag.
 * The tests follow the data, so publishing a post never breaks them.
 */
const NOTES = [...readFileSync('data/notes.ts', 'utf8').matchAll(/slug: '([^']+)',\s*title: '([^']+)',[\s\S]*?draft: (true|false),/g)].map(
  ([, slug, title, draft]) => ({ slug, title, draft: draft === 'true' }),
)
const live = isHidden('/notes') ? [] : NOTES.filter((n) => !n.draft)

test('reads the three guides from data/notes.ts', () => {
  expect(NOTES.map((n) => n.slug)).toEqual(['taking-the-counter-online', 'what-an-intake-automation-does', 'a-chatbot-that-reads-your-documents'])
})

test('while no guide is live, /notes and every post answer with the 404', async ({ page }) => {
  test.skip(live.length > 0, 'a guide is published')
  if (isHidden('/notes')) expect((await page.goto('/notes'))!.status()).toBe(404)
  for (const n of NOTES) expect((await page.goto(`/notes/${n.slug}`))!.status(), n.slug).toBe(404)
})

test('a published guide opens from the index, ends on a way to start, and fits the screen', async ({ page }) => {
  test.skip(live.length === 0, 'no guide is published yet')
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/notes')
  await hydrated(page)
  await page.getByRole('link', { name: new RegExp(live[0].title.slice(0, 20)) }).click()
  await expect(page).toHaveURL(new RegExp(`/notes/${live[0].slug}$`))
  await expect(page.getByRole('heading', { level: 1, name: live[0].title })).toBeVisible()
  await expect(page.getByRole('link', { name: /Start a project/ }).last()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
  expect((await page.goto('/notes/not-a-guide'))!.status()).toBe(404)
})
