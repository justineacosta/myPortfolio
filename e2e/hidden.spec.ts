import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'
import { SWITCHES } from './pages'

const off = SWITCHES.filter((s) => s.hidden)

test('reads every page switch in data/nav.ts', () => {
  expect(SWITCHES.map((s) => s.href)).toEqual(['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact'])
})

test('every page switched off in data/nav.ts answers with the 404 and has no link in the sidebar', async ({ page }) => {
  test.skip(off.length === 0, 'no page is switched off')
  for (const s of off) expect((await page.goto(s.href))!.status(), s.href).toBe(404)
  await page.goto('/')
  await hydrated(page)
  const nav = page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })
  for (const s of off) await expect(nav.getByRole('link', { name: new RegExp(`^${s.label}`) })).toHaveCount(0)
})
