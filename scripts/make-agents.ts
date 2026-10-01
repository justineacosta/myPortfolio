// Builds public/ai-agents.html from data/agents.ts (spec 2026-10-01-agents-page).
// Run after changing the page's data, layout, styles or focus script, or End-to-End's client: npm run agents-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAgents } from '../lib/agents/render.ts'

const html = renderAgents()
writeFileSync(join(process.cwd(), 'public', 'ai-agents.html'), html)
console.log(`public/ai-agents.html: ${(html.length / 1024).toFixed(1)} KB`)
