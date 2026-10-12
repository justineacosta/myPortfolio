// Builds public/build-plan.html from data/buildPlan.ts (spec 2026-09-30).
// Run after changing the plan's data, layout, styles or script: npm run plan
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { withLumen } from '../lib/chat/embed.ts'
import { renderPlan } from '../lib/buildPlan/render.ts'

// The page carries Lumen's launcher (public/lumen-embed.js).
const html = withLumen(renderPlan())
writeFileSync(join(process.cwd(), 'public', 'build-plan.html'), html)
console.log(`public/build-plan.html: ${(html.length / 1024).toFixed(1)} KB`)
