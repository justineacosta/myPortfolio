import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the Kraft Method walks its five gates', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const lit = page.locator('.method-step[data-on] h3')
  await expect(lit).toHaveText('Kickoff')
  await expect(lit).toHaveText('Research', { timeout: 3000 })
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

test('below the sidebar breakpoint the steps are a strip a mouse can drag sideways', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 900 })
  await page.goto('/services')
  await hydrated(page)
  const strip = page.getByRole('list', { name: 'The five steps' })
  await strip.scrollIntoViewIfNeeded()
  expect(await strip.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  const box = (await strip.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => strip.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
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

  test('the Method holds its first gate', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await page.waitForTimeout(2200)
    await expect(page.locator('.method-step[data-on] h3')).toHaveText('Kickoff')
  })

  test("the lit step's rail stands full, not filling", async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    const rail = page.locator('.method-step[data-on] .method-rail')
    const fill = page.locator('.method-step[data-on] .method-fill')
    const [r, f] = [(await rail.boundingBox())!, (await fill.boundingBox())!]
    expect(Math.round(f.width)).toBe(Math.round(r.width))
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
