import { expect, test } from '@playwright/test'

const PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html']
// The same list lib/brand/reveal.js marks.
const TARGETS = '.tools-strip,.tiles,.jobs,.timeline,.gl,.gloss dl,.ote,.cards,.rules,.phases,.stages,.closing'
const allShown = (page: import('@playwright/test').Page) =>
  page.evaluate((sel) => [...document.querySelectorAll(sel)].every((el) => getComputedStyle(el).opacity === '1'), TARGETS)
const glowOf = (page: import('@playwright/test').Page) =>
  page.locator('.hero').evaluate((el) => {
    const s = getComputedStyle(el, '::before')
    return { display: s.display, animation: s.animationName }
  })

for (const PAGE of PAGES) {
  test(`${PAGE}: every logo it points at is in its sheet, and the strip shows`, async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByRole('list', { name: 'Tools on this page' }).getByRole('listitem').first()).toBeVisible()
    const missing = await page.evaluate(() => [...document.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((h) => !document.getElementById(h.slice(1))))
    expect(missing).toEqual([])
  })

  test(`${PAGE}: reveals what scrolls into view; the glow drifts`, async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.locator('html')).toHaveClass(/reveal-on/)
    await expect(page.locator('.tools-strip')).toHaveClass(/\bin\b/)
    const last = page.locator('[data-reveal]').last()
    await expect(last).not.toHaveClass(/\bin\b/)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toHaveClass(/\bin\b/)
    await expect.poll(() => last.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    expect(await glowOf(page)).toEqual({ display: 'block', animation: 'halo' })
  })

  test(`${PAGE}: hides nothing under reduced motion or with JavaScript off, and the glow holds still`, async ({ browser }) => {
    for (const opts of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      const ctx = await browser.newContext(opts)
      const page = await ctx.newPage()
      await page.goto(PAGE)
      await expect(page.locator('html')).not.toHaveClass(/reveal-on/)
      expect(await allShown(page), JSON.stringify(opts)).toBe(true)
      if (opts.reducedMotion) expect((await glowOf(page)).animation).toBe('none')
      await ctx.close()
    }
  })

  test(`${PAGE}: prints everything, without the glow, in the light logos`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await page.emulateMedia({ media: 'print' })
    expect(await allShown(page)).toBe(true)
    expect((await glowOf(page)).display).toBe('none')
    for (const dark of await page.locator('.logo-dark').all()) await expect(dark).toBeHidden()
    await ctx.close()
  })

  test(`${PAGE}: the site’s High contrast and Reduce motion still apply when switched on after load`, async ({ page }) => {
    await page.goto(PAGE)
    const tinted = page.locator('.k-trigger .node-card').first()
    const plain = page.locator('.k-action .node-card').first()
    const bg = (l: typeof tinted) => l.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await bg(tinted)).not.toBe(await bg(plain))
    await page.evaluate(() => {
      document.documentElement.dataset.a11yContrast = 'true'
      document.documentElement.dataset.a11yMotion = 'true'
    })
    expect(await bg(tinted)).toBe(await bg(plain))
    expect((await glowOf(page)).display).toBe('none')
    await expect(page.locator('.logo-badge').first()).toBeAttached()
    expect(await allShown(page)).toBe(true)
  })

  test(`${PAGE}: at phone width nothing scrolls sideways and the strip wraps inside the page`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(PAGE)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const strip = (await page.locator('.tools-strip').boundingBox())!
    expect(strip.x + strip.width).toBeLessThanOrEqual(390)
  })
}

test('opened at a hash, the target section is revealed once the jump lands', async ({ page }) => {
  await page.goto('/end-to-end.html#glossary')
  await expect(page.locator('#glossary dl')).toHaveClass(/\bin\b/)
  await expect.poll(() => page.locator('#glossary dl').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('mono logos and Codex follow the theme', async ({ browser }) => {
  for (const scheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto('/end-to-end.html')
    const body = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)
    for (const mono of await page.locator('.tool-chip .logo.mono').all()) expect(await mono.evaluate((el) => getComputedStyle(el).color), scheme).not.toBe(body)
    const codex = page.locator('.tool-chip').filter({ hasText: 'Codex' })
    await expect(codex.locator(scheme === 'dark' ? '.logo-dark' : '.logo-light')).toBeVisible()
    await expect(codex.locator(scheme === 'dark' ? '.logo-light' : '.logo-dark')).toBeHidden()
    await ctx.close()
  }
})

test('a badge glows in its brand colour while a ball lights its step', async ({ page }) => {
  await page.goto('/agentic-framework.html#loop')
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll('.node.lit .logo-badge')].some((b) => getComputedStyle(b).boxShadow !== 'none')), { timeout: 15_000 })
    .toBe(true)
})

test('hovering a lit step or a helper lifts it but keeps its own glow or stacked-card look', async ({ page }) => {
  // A frozen clock holds the balls still, so a step lit by hand stays lit.
  await page.clock.install()
  await page.goto('/build-plan.html')
  const helper = page.locator('.node.k-helper').first()
  const lit = page.locator('[data-node="tm-01:n3"]')
  await lit.evaluate((el) => el.classList.add('lit'))
  for (const node of [helper, lit]) {
    await node.scrollIntoViewIfNeeded()
    const card = node.locator('.node-card')
    const shadow = () => card.evaluate((el) => getComputedStyle(el).boxShadow)
    await page.mouse.move(0, 0)
    await expect.poll(shadow).not.toBe('')
    const resting = await shadow()
    await node.hover()
    await expect.poll(() => card.evaluate((el) => getComputedStyle(el).transform)).not.toBe('none')
    await expect.poll(shadow).toBe(resting)
  }
})

test('the Cal.com logo fills its chip like the others, not as a thin wordmark', async ({ page }) => {
  await page.goto('/build-plan.html')
  const drawn = (name: string) =>
    page.locator('.tool-chip').filter({ hasText: name }).locator('use').first().evaluate((u) => (u as SVGGraphicsElement).getBBox().height)
  expect(await drawn('Cal.com')).toBeGreaterThanOrEqual(0.6 * 16)
})
