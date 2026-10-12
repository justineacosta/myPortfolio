// Builds public/ai-agents.html from data/agents.ts (spec 2026-10-01-agents-page).
// Run after changing the page's data, layout, styles or focus script, or End-to-End's client: npm run agents-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withLumen } from '../lib/chat/embed.ts'
import { renderAgents } from '../lib/agents/render.ts'

// The page carries Lumen's launcher (public/lumen-embed.js).
const html = withLumen(renderAgents())
writeFileSync(join(process.cwd(), 'public', 'ai-agents.html'), html)
console.log(`public/ai-agents.html: ${(html.length / 1024).toFixed(1)} KB`)
