// Photographs every page in public/samples/ twice: a 3:4 thumbnail (the
// drum's textures and the spin ring's pages) and a tall one, the page up to
// four screens down, that the Funnels and sites card scrolls through on hover.
// Run after changing a sample page: npm run thumbs
import { mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const dir = join(process.cwd(), 'public', 'samples')
mkdirSync(join(dir, 'thumbs', 'tall'), { recursive: true })
const browser = await chromium.launch()
// Laid out at 1080×1440, saved at 0.6×: sharp on the drum, light to download.
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.6, reducedMotion: 'reduce' })
// The tall shots are shown ~130px wide, so 0.4x (432px) is plenty.
const tall = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.4, reducedMotion: 'reduce' })
const TALL_MAX = 1440 * 4
const files = readdirSync(dir).filter((f) => f.endsWith('.html'))

/**
 * Opens a page and waits until it is finished: a bundled export unpacks
 * itself with script, then its images and fonts load, and its scroll-in
 * reveals only show once scrolled past, so it is scrolled through once.
 */
async function open(p, f) {
  await p.goto(pathToFileURL(join(dir, f)).href, { waitUntil: 'load' })
  await p.waitForFunction(() => !document.getElementById('__bundler_thumbnail') && !document.getElementById('__bundler_loading'), null, { timeout: 60_000 })
  await p.waitForLoadState('networkidle')
  await p.evaluate(async () => {
    await document.fonts.ready
    for (let y = 0; y < Math.min(document.documentElement.scrollHeight, 1440 * 4); y += 480) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await p.waitForLoadState('networkidle')
  await p.waitForTimeout(1200)
}

for (const f of files) {
  await open(page, f)
  await page.screenshot({ path: join(dir, 'thumbs', f.replace(/\.html$/, '.jpeg')), type: 'jpeg', quality: 82 })
  await open(tall, f)
  const height = Math.min(await tall.evaluate(() => document.documentElement.scrollHeight), TALL_MAX)
  await tall.screenshot({
    path: join(dir, 'thumbs', 'tall', f.replace(/\.html$/, '.jpeg')),
    type: 'jpeg',
    quality: 78,
    fullPage: true,
    clip: { x: 0, y: 0, width: 1080, height },
  })
}
await browser.close()
console.log(`wrote ${files.length} thumbnails to public/samples/thumbs/ and thumbs/tall/`)
