// Builds public/automations.html from data/automations.ts (plan 2026-10-01-automations-flows).
// Run after changing the page's data, layout, styles or tabs script, or End-to-End's client: npm run automations-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAutomations } from '../lib/automations/render.ts'

const html = renderAutomations()
writeFileSync(join(process.cwd(), 'public', 'automations.html'), html)
console.log(`public/automations.html: ${(html.length / 1024).toFixed(1)} KB`)
