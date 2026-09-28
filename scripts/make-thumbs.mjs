// Photographs every page in public/samples/ as a 3:4 thumbnail: the drum's
// textures and the grid's images on Projects → Funnels and sites.
// Run after changing a sample page: npm run thumbs
import { mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const dir = join(process.cwd(), 'public', 'samples')
mkdirSync(join(dir, 'thumbs'), { recursive: true })
const browser = await chromium.launch()
// Laid out at 1080×1440, saved at 0.6×: sharp on the drum, light to download.
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.6 })
const files = readdirSync(dir).filter((f) => f.endsWith('.html'))
for (const f of files) {
  await page.goto(pathToFileURL(join(dir, f)).href)
  await page.screenshot({ path: join(dir, 'thumbs', f.replace(/\.html$/, '.jpeg')), type: 'jpeg', quality: 82 })
}
await browser.close()
console.log(`wrote ${files.length} thumbnails to public/samples/thumbs/`)
