import { test } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { settleIntro } from './helpers'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms', '/thank-you', '/not-a-page']
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
          await settleIntro(page)
          await page.waitForTimeout(1500) // the assembly and the contour fade-in
          const slug = r === '/' ? 'home' : r.slice(1)
          await page.screenshot({ path: `test-results/shots/app-${slug}-${theme}-${size.name}.png` })
        }
        await page.goto('/projects#sites')
        await page.waitForTimeout(2500) // the drum loads its thumbnails
        await page.screenshot({ path: `test-results/shots/app-sites-${theme}-${size.name}.png` })
        await page.getByRole('button', { name: 'Open Apex Build Co.' }).dispatchEvent('click')
        await page.waitForTimeout(1200)
        await page.screenshot({ path: `test-results/shots/app-preview-${theme}-${size.name}.png` })
      }
    }
  })

  test('capture the Kraft standalone reference', async ({ page }) => {
    // Kraft's sidebar labels (Kraft Portfolio.dc.html:366-373). The phone
    // reference is the Home screen only: Kraft's phone nav names pages differently.
    const SCREENS: [string, string | null][] = [
      ['home', null], ['projects', 'Projects'], ['services', 'Services'],
      ['testimonials', 'Testimonials'], ['about', 'About'], ['contact', 'FAQs / Contact'],
    ]
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.addInitScript((t) => localStorage.setItem('kraft-theme', t), theme)
        await page.goto(STANDALONE)
        await page.waitForTimeout(7000) // Kraft's loader and headline flight
        for (const [slug, label] of SCREENS) {
          if (label) {
            if (size.name === 'phone') continue
            await page.getByText(label, { exact: true }).first().click()
            await page.waitForTimeout(900)
          }
          await page.screenshot({ path: `test-results/shots/kraft-${slug}-${theme}-${size.name}.png` })
        }
      }
    }
  })
})
