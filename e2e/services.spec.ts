import { expect, test, type Page } from '@playwright/test'
import { hydrated } from './helpers'

const looks = (page: Page) => page.locator('[data-gate]').evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.state))
const LOCKED = ['locked', 'locked', 'locked', 'locked', 'locked']

/**
 * The Method's wire in its stage's coordinates: each card's box, where its two
 * halves start and end, and where each line starts and ends.
 */
const wire = (page: Page) =>
  page.evaluate(() => {
    const stageEl = document.querySelector('.method-wire')!.parentElement!
    const stage = stageEl.getBoundingClientRect()
    // Out of any scale the page's entrance animation still has on it, as the wire is laid.
    const k = stage.width / stageEl.offsetWidth
    const cards = [...document.querySelectorAll('.method-step')].map((el) => {
      const r = el.getBoundingClientRect()
      return { x: (r.left - stage.left) / k, y: (r.top - stage.top) / k, w: r.width / k, h: r.height / k }
    })
    const ends = (p: SVGPathElement) => {
      const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(p.getAttribute('transform') ?? '')
      const [dx, dy] = m ? [Number(m[1]), Number(m[2])] : [0, 0]
      // From the path data: Chrome's getPointAtLength(total) can land a pixel short on arcs.
      const n = p.getAttribute('d')!.match(/-?[\d.]+/g)!.map(Number)
      return [n.slice(0, 2), n.slice(-2)].map(([x, y]) => ({ x: x + dx, y: y + dy }))
    }
    const rings = [...document.querySelectorAll<SVGPathElement>('.method-ring')].map(ends)
    const lines = [...document.querySelectorAll<SVGPathElement>('.method-line')].map(ends)
    return { cards, rings, lines }
  })

const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(Math.abs(a.x - b.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1)
}

/** How lit each border and line on the wire is. */
const glow = (page: Page) => page.locator('.method-ring, .method-line').evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity))

test('the Kraft Method goes round its five gates once, in order, locking each as the halves meet; the light passes and fades', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.locator('#method').scrollIntoViewIfNeeded()
  const lit = page.locator('[data-gate][data-state=lit] h3')
  await expect(lit).toHaveText('Kickoff')
  await expect(page.locator('[data-gate]').first()).toHaveAttribute('data-state', 'locked', { timeout: 5000 })
  await expect(lit).toHaveText('Research', { timeout: 3000 })
  await expect.poll(() => looks(page), { timeout: 16000 }).toEqual(LOCKED)
  // Once the run is over nothing stays lit on the wire, and there is no check anywhere.
  await expect.poll(() => glow(page)).toEqual(Array(14).fill('0'))
  await expect(page.locator('.method-check')).toHaveCount(0)
  await page.waitForTimeout(2000)
  expect(await looks(page)).toEqual(LOCKED)
})

test('desktop: the light splits over and under a card, mirrored, and the pointer holds it there', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.locator('#method').scrollIntoViewIfNeeded()
  const gates = page.locator('[data-gate]')
  await expect(gates.nth(1)).toHaveAttribute('data-state', 'lit', { timeout: 5000 })
  await page.waitForTimeout(700)
  await gates.nth(4).hover()
  await expect(gates.nth(4)).toHaveAttribute('data-hover', 'true')
  const at = await page.evaluate(() => {
    const card = document.querySelectorAll('.method-step')[1].getBoundingClientRect()
    const sparks = [...document.querySelectorAll<HTMLElement>('.method-spark')].map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, on: getComputedStyle(el).opacity === '1' }
    })
    const rings = [...document.querySelectorAll<SVGPathElement>('.method-ring')].slice(2, 4).map((p) => p.style.strokeDashoffset)
    return { mid: card.top + card.height / 2, sparks, rings }
  })
  expect(at.sparks.map((s) => s.on)).toEqual([true, true])
  expect(Math.abs(at.sparks[0].x - at.sparks[1].x)).toBeLessThanOrEqual(1)
  expect(at.sparks[0].y).toBeLessThan(at.mid)
  expect(at.sparks[1].y).toBeGreaterThan(at.mid)
  expect(Math.abs(at.sparks[0].y - at.mid - (at.mid - at.sparks[1].y))).toBeLessThanOrEqual(1)
  expect(at.rings[0]).toBe(at.rings[1])
  // Held: nothing moves while the pointer is on a card.
  await page.waitForTimeout(1500)
  expect(await looks(page)).toEqual(['locked', 'lit', 'waiting', 'waiting', 'waiting'])
  await page.mouse.move(0, 0)
  await expect(gates.nth(1)).toHaveAttribute('data-state', 'locked', { timeout: 3000 })
})

test('desktop: the halves meet at each card\'s right middle, and each line crosses the gap to the next card\'s left middle', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const { cards, rings, lines } = await wire(page)
  expect(rings).toHaveLength(10)
  cards.forEach((c, i) => {
    for (const [from, to] of rings.slice(i * 2, i * 2 + 2)) {
      near(from, { x: c.x + 0.5, y: c.y + c.h / 2 })
      near(to, { x: c.x + c.w - 0.5, y: c.y + c.h / 2 })
    }
  })
  lines.forEach(([from, to], i) => {
    near(from, { x: cards[i].x + cards[i].w, y: cards[i].y + cards[i].h / 2 })
    near(to, { x: cards[i + 1].x, y: cards[i + 1].y + cards[i + 1].h / 2 })
    expect(to.x - from.x).toBeGreaterThanOrEqual(20)
  })
})

test('desktop: the five Method steps share one row, under the header', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const tops = await page.locator('.method-step').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
  expect(tops).toHaveLength(5)
  expect(new Set(tops).size).toBe(1)
  const headerBottom = await page.locator('#method header').evaluate((el) => el.getBoundingClientRect().bottom)
  expect(tops[0]).toBeGreaterThan(headerBottom)
})

test('below the sidebar breakpoint the cards stack, and the light runs down: top middle to bottom middle, then the line to the next', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 })
  await page.goto('/services')
  await hydrated(page)
  const { cards, rings, lines } = await wire(page)
  expect(new Set(cards.map((c) => Math.round(c.x))).size).toBe(1)
  cards.slice(1).forEach((c, i) => expect(c.y).toBeGreaterThan(cards[i].y + cards[i].h))
  cards.forEach((c, i) => {
    for (const [from, to] of rings.slice(i * 2, i * 2 + 2)) {
      near(from, { x: c.x + c.w / 2, y: c.y + 0.5 })
      near(to, { x: c.x + c.w / 2, y: c.y + c.h - 0.5 })
    }
  })
  lines.forEach(([from, to], i) => {
    near(from, { x: cards[i].x + cards[i].w / 2, y: cards[i].y + cards[i].h })
    near(to, { x: cards[i + 1].x + cards[i + 1].w / 2, y: cards[i + 1].y })
  })
})

test('live automation: the arrows change the flow, and its dots travel', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.getByRole('button', { name: 'Next automation' }).click()
  await expect(page.locator('#automation-title')).toHaveText('Every ticket answered in seconds.')
  expect(await page.locator('.flow-ball').first().evaluate((el) => el.getAnimations().length)).toBe(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the Method shows all five gates done, icons filled, with no light on the wire and none moving', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await expect.poll(() => looks(page)).toEqual(LOCKED)
    expect(await glow(page)).toEqual(Array(14).fill('0'))
    for (const el of await page.locator('.method-spark, .method-dot').all()) await expect(el).toHaveCSS('opacity', '0')
    // Every icon filled alike, in the solid accent.
    const fills = await page.locator('.method-icon').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor))
    expect(new Set(fills).size).toBe(1)
    expect(fills[0]).not.toMatch(/rgba\(.*, 0\.\d+\)/)
  })

  test('no travelling dots', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await expect(page.locator('.flow-ball').first()).toBeHidden()
  })
})

test('desktop: the five offers sit three over two, each row filling the width', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const boxes = await page.locator('#offers article').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect()
      return { top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right) }
    }),
  )
  expect(boxes).toHaveLength(5)
  const [a, b] = [boxes.slice(0, 3), boxes.slice(3)]
  expect(new Set(a.map((x) => x.top)).size).toBe(1)
  expect(new Set(b.map((x) => x.top)).size).toBe(1)
  expect(b[0].top).toBeGreaterThan(a[0].top)
  expect(b[0].left).toBe(a[0].left)
  expect(b[1].right).toBe(a[2].right)
})

test('desktop: every live automation sits centred in its panel', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const region = page.getByRole('region', { name: 'Flow canvas. Scroll sideways to see all of it.' })
  await region.scrollIntoViewIfNeeded()
  const offCentre = () =>
    region.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const nodes = [...el.querySelectorAll('li')].map((n) => n.getBoundingClientRect())
      const left = Math.min(...nodes.map((n) => n.left))
      const right = Math.max(...nodes.map((n) => n.right))
      return Math.round((left + right) / 2 - (r.left + r.right) / 2)
    })
  for (const width of [1440, 1680]) {
    await page.setViewportSize({ width, height: 900 })
    for (let i = 0; i < 10; i++) {
      expect(Math.abs(await offCentre()), `${width}px, flow ${i + 1}`).toBeLessThanOrEqual(12)
      await page.getByRole('button', { name: 'Next automation' }).click()
    }
  }
})
