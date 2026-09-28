import { expect, test } from '@playwright/test'

test("Home shows Kraft's headline, lede and actions", async ({ page }) => {
  await page.goto('/')
  const main = page.locator('#main-content')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText('Software that keeps its promises.')
  await expect(main.getByText(/^Full-stack development, AI automation and workflow systems/)).toBeVisible()
  await main.getByRole('link', { name: 'See the work' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('Home cards open their pages', async ({ page }) => {
  await page.goto('/')
  await page.locator('#main-content').getByRole('link', { name: /^Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

test('every Home logo and image loads from this site', async ({ page }) => {
  const bad: string[] = []
  page.on('response', (r) => {
    // The favicon arrives with the SEO work in Phase 4.
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) bad.push(`${r.status()} ${r.url()}`)
  })
  const offsite: string[] = []
  page.on('request', (r) => {
    const url = r.url()
    if (/^https?:/.test(url) && !url.startsWith('http://localhost:3100')) offsite.push(url)
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(bad).toEqual([])
  expect(offsite).toEqual([])
})
