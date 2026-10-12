// Builds public/end-to-end.html from data/endToEnd.ts (spec 2026-09-30-end-to-end-workflow).
// Run after changing the graph's data, layout, styles or script: npm run e2e-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withLumen } from '../lib/chat/embed.ts'
import { renderEndToEnd } from '../lib/endToEnd/render.ts'

// The page carries Lumen's launcher (public/lumen-embed.js).
const html = withLumen(renderEndToEnd())
writeFileSync(join(process.cwd(), 'public', 'end-to-end.html'), html)
console.log(`public/end-to-end.html: ${(html.length / 1024).toFixed(1)} KB`)
