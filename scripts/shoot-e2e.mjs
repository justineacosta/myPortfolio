// Photographs public/end-to-end.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run e2e-page
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400. Reduced motion keeps balls out of the picture.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'dark', reducedMotion: 'reduce' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'end-to-end.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'end-to-end.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
