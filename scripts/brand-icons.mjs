// Writes public/icons/brands/<slug>.svg from the simple-icons package, filled
// with the brand colour Kraft used (KraftScreens.dc.html:559-596, where the
// logos came from cdn.simpleicons.org). Self-hosted, so the site makes no
// third-party requests. Re-run after adding a brand: node scripts/brand-icons.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BRANDS = {
  react: '61DAFB', typescript: '3178C6', nodedotjs: '5FA04E', python: '3776AB', postgresql: '4169E1',
  supabase: '3FCF8E', docker: '2496ED', n8n: 'EA4B71', figma: 'F24E1E', claude: 'D97757',
  nextdotjs: 'A3AAB2', tailwindcss: '06B6D4', fastapi: '009688', redis: 'FF4438', mongodb: '47A248',
  prisma: '2D3748', vercel: 'A3AAB2', resend: 'A3AAB2', cloudflare: 'F38020', githubactions: '2088FF', git: 'F05032',
  langchain: '5FB39B', huggingface: 'FFD21E', googlegemini: '8E75B2', zapier: 'FF4F00', make: '6D00CC',
  stripe: '635BFF', expo: 'A3AAB2', graphql: 'E10098', anthropic: 'D97757', hubspot: 'FF7A59',
  airtable: '18BFFF', notion: 'A3AAB2', postman: 'FF6C37', googlechrome: '4285F4', express: 'A3AAB2',
  github: 'A3AAB2', googlesheets: '34A853', hackerrank: '00EA64',
  gmail: 'EA4335', telegram: '26A5E4', caldotcom: 'A3AAB2',
  googlesearchconsole: '458CF5', lighthouse: 'F44B21', googleanalytics: 'E37400',
  // Only on the Projects board's cream logo chips, so the brand's own black.
  cursor: '111111',
}
// Not in simple-icons: copied from the standalone pages' logos (lib/brand/logos/CREDITS.md).
const COPIED = { codex: 'codex.svg' }

const src = path.join('node_modules', 'simple-icons', 'icons')
const out = path.join('public', 'icons', 'brands')
mkdirSync(out, { recursive: true })
for (const [slug, hex] of Object.entries(BRANDS)) {
  const svg = readFileSync(path.join(src, `${slug}.svg`), 'utf8')
  writeFileSync(path.join(out, `${slug}.svg`), svg.replace('<svg ', `<svg fill="#${hex}" `))
}
for (const [slug, file] of Object.entries(COPIED)) writeFileSync(path.join(out, `${slug}.svg`), readFileSync(path.join('lib', 'brand', 'logos', file), 'utf8'))
console.log(`wrote ${Object.keys(BRANDS).length + Object.keys(COPIED).length} brand icons to ${out}`)

// Every logo again as a <symbol> in one file, which components/ui/BrandIcon.tsx draws with <use>,
// so a page with twenty logos makes one request instead of twenty.
const symbols = [...Object.keys(BRANDS), ...Object.keys(COPIED)].sort().map((slug) => {
  const svg = readFileSync(path.join(out, `${slug}.svg`), 'utf8')
  const [, attrs, body] = svg.match(/^<svg([^>]*)>([\s\S]*)<\/svg>\s*$/)
  const viewBox = attrs.match(/viewBox="([^"]+)"/)[1]
  const fill = attrs.match(/fill="([^"]+)"/)?.[1]
  const inner = body.replace(/<title>[\s\S]*?<\/title>/, '')
  return `<symbol id="${slug}" viewBox="${viewBox}">${fill ? `<g fill="${fill}">${inner}</g>` : inner}</symbol>`
})
const sprite = path.join('public', 'icons', 'brands.svg')
writeFileSync(sprite, `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`)
console.log(`wrote ${symbols.length} symbols to ${sprite}`)
