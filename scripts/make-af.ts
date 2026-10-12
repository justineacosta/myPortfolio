// Builds public/agentic-framework.html from data/agenticFramework.ts (spec 2026-10-01-agentic-framework).
// Run after changing the page's data, layout or styles, or End-to-End's client: npm run af-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withLumen } from '../lib/chat/embed.ts'
import { renderAgenticFramework } from '../lib/agenticFramework/render.ts'

// The page carries Lumen's launcher (public/lumen-embed.js).
const html = withLumen(renderAgenticFramework())
writeFileSync(join(process.cwd(), 'public', 'agentic-framework.html'), html)
console.log(`public/agentic-framework.html: ${(html.length / 1024).toFixed(1)} KB`)
