// Builds public/cases/<site>/<page>.html from data/cases (spec 2026-10-05 per-site pages).
// Run after changing a case's data, or the layout, styles or script of the pages: npm run cases
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { renderCases } from '../lib/cases/render.ts'
import { withLumen } from '../lib/chat/embed.ts'

for (const { path, html } of renderCases()) {
  const file = join(process.cwd(), 'public', path)
  mkdirSync(dirname(file), { recursive: true })
  // Each page carries Lumen's launcher (public/lumen-embed.js).
  writeFileSync(file, withLumen(html))
  console.log(`public${path}: ${(html.length / 1024).toFixed(1)} KB`)
}
