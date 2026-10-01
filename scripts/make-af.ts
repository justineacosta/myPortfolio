// Builds public/agentic-framework.html from data/agenticFramework.ts (spec 2026-10-01-agentic-framework).
// Run after changing the page's data, layout or styles, or End-to-End's client: npm run af-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAgenticFramework } from '../lib/agenticFramework/render.ts'

const html = renderAgenticFramework()
writeFileSync(join(process.cwd(), 'public', 'agentic-framework.html'), html)
console.log(`public/agentic-framework.html: ${(html.length / 1024).toFixed(1)} KB`)
