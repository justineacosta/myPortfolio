// Writes the first frame of the workstation GIF as a still image, for
// reduced motion (spec §11): CSS can't stop a GIF. Re-run if the GIF changes.
// Run: node scripts/gif-still.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const SRC = 'public/assets/about-workstation.gif'
const OUT = 'public/assets/about-workstation-still.webp'

const browser = await chromium.launch()
const page = await browser.newPage()
const dataUrl = await page.evaluate(async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  // An animated image not in the document draws its first frame.
  c.getContext('2d').drawImage(img, 0, 0)
  return c.toDataURL('image/webp', 0.86)
}, `data:image/gif;base64,${readFileSync(SRC).toString('base64')}`)
writeFileSync(OUT, Buffer.from(dataUrl.split(',')[1], 'base64'))
await browser.close()
console.log(`wrote ${OUT}`)
