// Builds public/automations.html from data/automations.ts (plan 2026-10-01-automations-flows).
// Run after changing the page's data, layout, styles or tabs script, or End-to-End's client: npm run automations-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withLumen } from '../lib/chat/embed.ts'
import { renderAutomations } from '../lib/automations/render.ts'

// The page carries Lumen's launcher (public/lumen-embed.js).
const html = withLumen(renderAutomations())
writeFileSync(join(process.cwd(), 'public', 'automations.html'), html)
console.log(`public/automations.html: ${(html.length / 1024).toFixed(1)} KB`)
