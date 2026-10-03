import { test } from '@playwright/test'
import { settleIntro } from './helpers'
import { shown } from './pages'

const ROUTES = shown(['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/thank-you', '/not-a-page'])
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const THEMES = ['dark', 'light'] as const

test.describe('@shots', () => {
  test.setTimeout(240_000)

  test('capture every route in both themes at both sizes', async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.emulateMedia({ colorScheme: theme })
        for (const r of ROUTES) {
          await page.goto(r)
          await settleIntro(page)
          await page.waitForTimeout(1500) // the assembly and the contour fade-in
          const slug = r === '/' ? 'home' : r.slice(1)
          await page.screenshot({ path: `test-results/shots/app-${slug}-${theme}-${size.name}.png` })
        }
        await page.goto('/projects#sites')
        await page.waitForTimeout(2500) // the drum loads its thumbnails
        await page.screenshot({ path: `test-results/shots/app-sites-${theme}-${size.name}.png` })
        await page.getByRole('button', { name: 'Open Harbor & Pine Moving Co.' }).dispatchEvent('click')
        await page.waitForTimeout(1200)
        await page.screenshot({ path: `test-results/shots/app-preview-${theme}-${size.name}.png` })
      }
    }
  })
})
