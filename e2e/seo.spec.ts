import { expect, test } from '@playwright/test'

const PAGES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms']

test('every page has its own title, description, canonical link and share image', async ({ page }) => {
  test.setTimeout(60_000) // one test, many pages: the default 30s is per test
  const titles = new Set<string>()
  for (const p of PAGES) {
    await page.goto(p)
    titles.add(await page.title())
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(new URL(canonical!).pathname, p).toBe(p)
    await expect(page.locator('meta[name="description"]'), p).toHaveAttribute('content', /\S/)
    await expect(page.locator('meta[property="og:image"]'), p).toHaveCount(1)
    await expect(page.locator('meta[name="twitter:image"]'), p).toHaveCount(1)
  }
  expect(titles.size).toBe(PAGES.length)
})

test('the share image, sitemap, robots file and favicon are served', async ({ request, page }) => {
  const og = await request.get('/opengraph-image')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const p of ['/projects', '/showcase', '/privacy', '/build-plan.html', '/end-to-end.html', '/agentic-framework.html']) expect(sitemap).toContain(p)
  expect(sitemap).not.toContain('thank-you')
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:')
  await page.goto('/')
  const icon = await page.locator('link[rel="icon"]').first().getAttribute('href')
  expect((await request.get(icon!)).status()).toBe(200)
})

test('Home describes Justine as a Person', async ({ page }) => {
  await page.goto('/')
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
  expect(data).toMatchObject({ '@type': 'Person', name: 'Justine Acosta' })
})
