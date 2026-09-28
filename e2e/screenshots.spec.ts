import { test } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact']
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const THEMES = ['dark', 'light'] as const
const STANDALONE = pathToFileURL(
  path.resolve('reference/Kraft_Portfolio_Design_System/Kraft Portfolio (standalone).html'),
).href

test.describe('@shots', () => {
  test.setTimeout(240_000)

  test('capture every route in both themes at both sizes', async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.emulateMedia({ colorScheme: theme })
        for (const r of ROUTES) {
          await page.goto(r)
          await page.waitForTimeout(2500)
          const slug = r === '/' ? 'home' : r.slice(1)
          await page.screenshot({ path: `test-results/shots/app-${slug}-${theme}-${size.name}.png` })
        }
      }
    }
  })

  test('capture the Kraft standalone reference', async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.addInitScript((t) => localStorage.setItem('kraft-theme', t), theme)
        await page.goto(STANDALONE)
        await page.waitForTimeout(7000) // Kraft's loader and headline flight
        await page.screenshot({ path: `test-results/shots/kraft-${theme}-${size.name}.png` })
      }
    }
  })
})
