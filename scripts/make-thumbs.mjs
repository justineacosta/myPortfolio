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
// The tall shots are shown up to ~620px wide in the Showcase window, so 0.6x (648px).
const tall = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.6, reducedMotion: 'reduce' })
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

/**
 * A pinned story (a viewport-tall sticky panel in a much taller parent) draws
 * its panel once at the top of the parent in a full-page shot and leaves the
 * rest blank. For the tall shot, unpin each one and let its parent shrink.
 */
async function unpin(p) {
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      const parent = el.parentElement
      if (!parent || getComputedStyle(el).position !== 'sticky' || el.offsetHeight < innerHeight * 0.8) continue
      if (parent.offsetHeight < el.offsetHeight * 1.5) continue
      el.style.position = 'relative'
      parent.style.height = 'auto'
      parent.style.minHeight = '0'
    }
  })
  await p.waitForTimeout(300)
}

for (const f of files) {
  await open(page, f)
  await page.screenshot({ path: join(dir, 'thumbs', f.replace(/\.html$/, '.jpeg')), type: 'jpeg', quality: 82 })
  await open(tall, f)
  await unpin(tall)
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
