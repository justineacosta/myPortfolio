# Livelier Standalone Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the three standalone pages (build plan, End-to-End, Agentic Framework):
- full-colour tool logos (step badges, a hero strip, the details panel, tiles and the glossary)
- soft kind tints
- gentle motion
- a two-colour hero glow

**Architecture:**
- **`lib/brand/` holds everything shared:**
  - the committed logo SVGs and their credits
  - a typed tools registry
  - render helpers that draw each logo once per page, as `<symbol>`s, and point at it with `<use>`
  - one CSS layer, `livelyCss`, added after each page's own CSS
  - one inlined reveal script
- **Each page's data** names its tools; each page's renderer calls the helpers.
- **The two page scripts** gain a few lines to show a step's tools in the panel. The Agentic page reuses End-to-End's script.

**Tech Stack:**
- Node 26 running `.ts` directly, with relative `.ts` imports
- Vitest with jsdom
- Playwright (desktop project)
- Plain CSS and JS inlined into generated HTML

**Spec:** `docs/superpowers/specs/2026-10-01-lively-pages-design.md`

## Global Constraints

- **No new dependencies.** Logo files are committed to `lib/brand/logos/`. They come from gilbarbara/logos (CC0, via `@iconify-json/logos` 1.2.15, unpacked to a scratch folder only) and from Simple Icons 16.33.0, which is already in `node_modules`.
- **Credits:** every logo file is listed with its source and licence in `lib/brand/logos/CREDITS.md`.
- **Self-contained pages:** the only external hosts stay `fonts.googleapis.com` and `fonts.gstatic.com`.
- **Themes:** dark first. Light comes from `prefers-color-scheme: light` (`:root:not([data-theme=dark])`) or from `:root[data-theme=light]`. `:root[data-theme=dark]` wins inside the site's dialog. Print uses light.
- **Site accessibility settings** are mirrored from the site into the iframe:
  - `data-a11y-motion=true` acts like reduced motion.
  - `data-a11y-contrast=true` switches the kind tints and the glow off; the logos stay.
- **Motion off:** under `prefers-reduced-motion: reduce` or `data-a11y-motion=true` there is no reveal hiding, no glow drift and no hover lift.
- **Badges:**
  - At most two per step, on the card's top-right corner.
  - On End-to-End and Agentic, a step's tools are exactly the tools its label or sub-line names.
  - On the build plan, a node's tools are the services its sub-line names, or `n8n` when it names none.
- **Kind colours:**
  - Dark: trigger `#F5B041`, ai `#B79CFF`, branch `#7EB6FF`, helper `#5EEAD4`.
  - Light: trigger `#B45309`, ai `#6D28D9`, branch `#1D4ED8`, helper `#0F766E`.
  - Fill is 12% of the kind colour over `--s2`; border is 45% of it over `--b2`.
- **Hero glow** uses two tool colours per page:
  - build plan: `n8n` + `supabase`
  - End-to-End: `claude` + `telegram`
  - Agentic: `claude` + `vs-code`
- **Page size:** each page grows by at most 40 KB. Today: build plan 172,274 B, End-to-End 190,923 B, Agentic 68,774 B.
- **Copy rules:** curly quotes in copy; no GoHighLevel anywhere; the editor is VS Code.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Gradient logos** (Gmail, Telegram, Supabase, VS Code) must still paint when drawn through `<use>`. The sheet must not be `display:none`, and every `url(#…)` or `href="#…"` inside it must resolve to an id inside it. Owner: Task 1's sheet tests.
2. **A page opened at a hash** (`/end-to-end.html#glossary`) must reveal the target once the jump lands, not leave it blank. Owner: Task 7, the "hash" test.
3. **The site's High contrast or Reduce motion switched on after the page loaded** (mirrored into the iframe) must still switch the tints off, and unhide anything still waiting to reveal. Owner: Task 7, the "late a11y" test.
4. **Phone width (390px):** the glow and the logo strip must never cause sideways scroll, and the strip must wrap. Owner: Task 7, the "phone" test.
5. **Agentic's Check step carries two badges.** They must not cover its rule pin (top-left) or its own card's other corner badges. Owner: Task 6, the "two badges" e2e test.

---

### Task 1: Logo files, tools registry, logo helpers

**Files:**
- Create: `lib/brand/logos/*.svg` (14 files) and `lib/brand/logos/CREDITS.md`
- Create: `lib/brand/tools.ts`
- Create: `lib/brand/render.ts`
- Test: `tests/brand.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ToolId = 'n8n' | 'supabase' | 'gmail' | 'google-sheets' | 'telegram' | 'stripe' | 'claude' | 'cal-com' | 'claude-code' | 'vs-code' | 'codex' | 'github' | 'vercel'`
  - `type Tool = { name: string; brand: string; mono?: true; dark?: true }`
  - `TOOLS: Record<ToolId, Tool>`
  - `logoSheet(ids: ToolId[]): string`
  - `logo(id: ToolId, size: number): string`
  - `logoBadges(ids: ToolId[] | undefined): string`
  - `toolStrip(ids: ToolId[]): string`
  - `toolTemplates(ids: ToolId[]): string`
  - `toolByName(name: string): ToolId | undefined`
  - `glossaryLogo(term: string): string`
  - `toolsUsed(lists: (ToolId[] | undefined)[]): ToolId[]`

- [ ] **Step 1: Branch**

```bash
git checkout -b feat/lively-pages
```

- [ ] **Step 2: Write the failing test** — `tests/brand.test.ts`

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { glossaryLogo, logo, logoBadges, logoSheet, toolStrip, toolTemplates, toolsUsed } from '@/lib/brand/render'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

const IDS = Object.keys(TOOLS) as ToolId[]
const files = readdirSync('lib/brand/logos').filter((f) => f.endsWith('.svg'))
const parse = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

describe('the tools registry and its logo files', () => {
  it('has a logo file for every tool, a dark one where it says so, and no file it does not use', () => {
    const want = IDS.flatMap((id) => [`${id}.svg`, ...(TOOLS[id].dark ? [`${id}-dark.svg`] : [])])
    expect([...files].sort()).toEqual(want.sort())
  })

  it('credits every logo file', () => {
    const credits = readFileSync('lib/brand/logos/CREDITS.md', 'utf8')
    for (const f of files) expect(credits, f).toContain(`\`${f}\``)
  })

  it('names each tool once, in plain text, with a brand colour', () => {
    const names = IDS.map((id) => TOOLS[id].name)
    expect(new Set(names).size).toBe(names.length)
    for (const id of IDS) {
      expect(TOOLS[id].name, id).toMatch(/^[A-Za-z0-9 .]+$/)
      expect(TOOLS[id].brand, id).toMatch(/^#[0-9A-F]{6}$/)
    }
  })

  it('draws mono logos in the text colour only', () => {
    for (const id of IDS.filter((i) => TOOLS[i].mono)) {
      const svg = readFileSync(`lib/brand/logos/${id}.svg`, 'utf8')
      expect(svg, id).not.toMatch(/#[0-9a-f]{3,6}\b/i)
      expect(svg, id).toContain('currentColor')
    }
  })
})

describe('the logo sheet', () => {
  const sheet = logoSheet(['gmail', 'codex', 'telegram'])
  const doc = parse(sheet)

  it('holds each logo it is asked for once, plus Codex’s dark version', () => {
    expect([...doc.querySelectorAll('symbol')].map((s) => s.id)).toEqual(['logo-gmail', 'logo-codex', 'logo-codex-dark', 'logo-telegram'])
  })

  it('prefixes every id inside a logo, and every reference points at an id in the sheet', () => {
    const ids = [...doc.querySelectorAll('[id]')].map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids.filter((i) => !i.startsWith('logo-'))) expect(id).toMatch(/^lg-/)
    const refs = [...sheet.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map((m) => m[1] ?? m[2])
    expect(refs.length).toBeGreaterThan(0)
    for (const r of refs) expect(ids, r).toContain(r)
  })

  it('is hidden from people and screen readers without display:none, so gradients still paint', () => {
    const svg = doc.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.getAttribute('style') ?? '').not.toMatch(/display:\s*none/)
  })

  it('stays small: every logo together is under 30 KB', () => {
    expect(logoSheet(IDS).length).toBeLessThan(30_000)
  })
})

describe('logos on the page', () => {
  it('points a logo at its symbol, at the size asked, hidden from screen readers', () => {
    const svg = parse(logo('n8n', 16)).querySelector('svg')!
    expect(svg.getAttribute('width')).toBe('16')
    expect(svg.getAttribute('class')).toBe('logo')
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.querySelector('use')!.getAttribute('href')).toBe('#logo-n8n')
  })

  it('gives Codex both versions, one per theme, and mono logos the mono class', () => {
    expect([...parse(logo('codex', 16)).querySelectorAll('svg')].map((s) => s.getAttribute('class'))).toEqual(['logo logo-light', 'logo logo-dark'])
    expect(parse(logo('github', 16)).querySelector('svg')!.getAttribute('class')).toBe('logo mono')
  })

  it('stacks a badge per tool, each carrying its brand colour, and draws nothing for no tools', () => {
    expect(logoBadges(undefined)).toBe('')
    expect(logoBadges([])).toBe('')
    const b = [...parse(logoBadges(['codex', 'vs-code'])).querySelectorAll('.logo-badges > .logo-badge')]
    expect(b.map((e) => e.getAttribute('style'))).toEqual([`--brand:${TOOLS.codex.brand}`, `--brand:${TOOLS['vs-code'].brand}`])
  })

  it('lists the page’s tools as chips under a label', () => {
    const d = parse(toolStrip(['telegram', 'n8n']))
    expect(d.querySelector('.tools-strip-label')!.textContent).toBe('Tools on this page')
    expect(d.querySelector('ul')!.getAttribute('aria-label')).toBe('Tools on this page')
    expect([...d.querySelectorAll('.tool-chip')].map((li) => li.textContent)).toEqual(['Telegram', 'n8n'])
  })

  it('makes one panel template per tool, holding its logo and name', () => {
    const t = parse(toolTemplates(['stripe'])).querySelector('template')!
    expect(t.id).toBe('tool-stripe')
    expect(t.content.querySelector('.ptool')!.textContent).toBe('Stripe')
    expect(t.content.querySelector('use')!.getAttribute('href')).toBe('#logo-stripe')
  })

  it('puts a logo before a glossary term only when the term is a tool', () => {
    expect(glossaryLogo('VS Code')).toContain('href="#logo-vs-code"')
    expect(glossaryLogo('Webhook')).toBe('')
  })

  it('lists the tools used, once each, in order of first appearance', () => {
    expect(toolsUsed([['n8n'], undefined, ['supabase', 'n8n'], ['gmail']])).toEqual(['n8n', 'supabase', 'gmail'])
  })
})
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL. The imports can't be resolved: `@/lib/brand/render`, `@/lib/brand/tools`.

- [ ] **Step 4: Write the logo files**

Unpack the CC0 logo set into the session scratchpad (nothing goes into the repo or `node_modules`):

```bash
SCRATCH="<session scratchpad>"   # e.g. C:/Users/Sam/AppData/Local/Temp/claude/.../scratchpad
mkdir -p "$SCRATCH/ij" && (cd "$SCRATCH/ij" && npm pack @iconify-json/logos@1.2.15 --silent && tar -xzf iconify-json-logos-1.2.15.tgz)
```

Write `$SCRATCH/logos.mjs`:

```js
// One-off: writes lib/brand/logos/*.svg. Run from the repo root:
// node <scratch>/logos.mjs <scratch>/ij/package
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const set = JSON.parse(readFileSync(`${process.argv[2]}/icons.json`, 'utf8'))
const out = 'lib/brand/logos'
mkdirSync(out, { recursive: true })
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${body}</svg>\n`
const mono = (body) => body.replace(/ fill="[^"]*"/g, '').replace(/<path /g, '<path fill="currentColor" ')
const FROM_SET = {
  n8n: 'n8n-icon', supabase: 'supabase-icon', gmail: 'google-gmail', telegram: 'telegram', claude: 'claude-icon',
  'claude-code': 'claude-code', 'vs-code': 'visual-studio-code', codex: 'codex', 'codex-dark': 'codex-dark',
  github: 'github-icon', vercel: 'vercel-icon',
}
const MONO = new Set(['github', 'vercel'])
for (const [id, name] of Object.entries(FROM_SET)) {
  const i = set.icons[name]
  writeFileSync(`${out}/${id}.svg`, svg(i.width ?? set.width, i.height ?? set.height, MONO.has(id) ? mono(i.body) : i.body))
}
const si = (slug, fill) => {
  const d = /<path d="([^"]+)"/.exec(readFileSync(`node_modules/simple-icons/icons/${slug}.svg`, 'utf8'))[1]
  return svg(24, 24, `<path fill="${fill}" d="${d}"/>`)
}
writeFileSync(`${out}/google-sheets.svg`, si('googlesheets', '#34A853'))
writeFileSync(`${out}/stripe.svg`, si('stripe', '#635BFF'))
writeFileSync(`${out}/cal-com.svg`, si('caldotcom', 'currentColor'))
console.log('wrote', Object.keys(FROM_SET).length + 3, 'logos')
```

Run: `node "$SCRATCH/logos.mjs" "$SCRATCH/ij/package"`
Expected: `wrote 14 logos`, and `ls lib/brand/logos` lists 14 `.svg` files.

Write `lib/brand/logos/CREDITS.md`:

```markdown
# Logo credits

Logos of the tools named on the standalone pages (`lib/brand/tools.ts`). Each
is used only to name the tool it belongs to. The trademarks belong to their
owners.

| File | Source | Licence |
|---|---|---|
| `n8n.svg` | gilbarbara/logos `n8n-icon` (via @iconify-json/logos 1.2.15) | CC0 1.0 |
| `supabase.svg` | gilbarbara/logos `supabase-icon` | CC0 1.0 |
| `gmail.svg` | gilbarbara/logos `google-gmail` | CC0 1.0 |
| `telegram.svg` | gilbarbara/logos `telegram` | CC0 1.0 |
| `claude.svg` | gilbarbara/logos `claude-icon` | CC0 1.0 |
| `claude-code.svg` | gilbarbara/logos `claude-code` | CC0 1.0 |
| `vs-code.svg` | gilbarbara/logos `visual-studio-code` | CC0 1.0 |
| `codex.svg` | gilbarbara/logos `codex` | CC0 1.0 |
| `codex-dark.svg` | gilbarbara/logos `codex-dark` | CC0 1.0 |
| `github.svg` | gilbarbara/logos `github-icon`, recoloured to `currentColor` | CC0 1.0 |
| `vercel.svg` | gilbarbara/logos `vercel-icon`, recoloured to `currentColor` | CC0 1.0 |
| `google-sheets.svg` | Simple Icons 16.33.0 `googlesheets`, filled #34A853 | CC0 1.0 |
| `stripe.svg` | Simple Icons 16.33.0 `stripe`, filled #635BFF | CC0 1.0 |
| `cal-com.svg` | Simple Icons 16.33.0 `caldotcom`, `currentColor` | CC0 1.0 |
```

- [ ] **Step 5: Write `lib/brand/tools.ts`**

```ts
/**
 * The tools the three standalone pages name, with their logos in
 * lib/brand/logos/ (spec 2026-10-01-lively-pages §3). `brand` colours the
 * badge pulse and the hero glow. A `mono` logo takes the text colour. `dark`
 * means a <id>-dark.svg exists for dark themes. No runtime imports, so the
 * data files can import its type and still run under Node directly.
 */
export type ToolId =
  | 'n8n' | 'supabase' | 'gmail' | 'google-sheets' | 'telegram' | 'stripe' | 'claude' | 'cal-com'
  | 'claude-code' | 'vs-code' | 'codex' | 'github' | 'vercel'

export type Tool = { name: string; brand: string; mono?: true; dark?: true }

export const TOOLS: Record<ToolId, Tool> = {
  n8n: { name: 'n8n', brand: '#EA4B71' },
  supabase: { name: 'Supabase', brand: '#3ECF8E' },
  gmail: { name: 'Gmail', brand: '#EA4335' },
  'google-sheets': { name: 'Google Sheets', brand: '#34A853' },
  telegram: { name: 'Telegram', brand: '#26A5E4' },
  stripe: { name: 'Stripe', brand: '#635BFF' },
  claude: { name: 'Claude', brand: '#D97757' },
  'cal-com': { name: 'Cal.com', brand: '#8B949E', mono: true },
  'claude-code': { name: 'Claude Code', brand: '#D97757' },
  'vs-code': { name: 'VS Code', brand: '#007ACC' },
  codex: { name: 'Codex', brand: '#8B949E', dark: true },
  github: { name: 'GitHub', brand: '#8B949E', mono: true },
  vercel: { name: 'Vercel', brand: '#8B949E', mono: true },
}
```

- [ ] **Step 6: Write `lib/brand/render.ts`**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { TOOLS, type ToolId } from './tools.ts'

/**
 * Tool logos for the three standalone pages (spec 2026-10-01-lively-pages
 * §3–4). Each page draws every logo it uses once, as a <symbol> in one hidden
 * sheet, and every badge, chip, tile, panel and glossary logo points at it
 * with <use>. Tool names are plain text (tests/brand.test.ts), so nothing
 * here needs escaping.
 */

const file = (name: string) => readFileSync(join(process.cwd(), 'lib/brand/logos', `${name}.svg`), 'utf8').replace(/\r\n/g, '\n').trim()

/** One logo file as a <symbol>, with every id inside it prefixed so two logos (or a logo and the page) never share one. */
function symbol(name: string): string {
  const m = /^<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>$/.exec(file(name))
  if (!m) throw new Error(`lib/brand/logos/${name}.svg is not one <svg> with a viewBox`)
  const p = `lg-${name}-`
  const body = m[2]
    .replace(/\bid="([^"]+)"/g, (_, id: string) => `id="${p}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${p}${id})`)
    .replace(/href="#([^"]+)"/g, (_, id: string) => `href="#${p}${id}"`)
  return `<symbol id="logo-${name}" viewBox="${m[1]}">${body}</symbol>`
}

/** The hidden sheet: each tool's logo once, plus its dark version if it has one. Never display:none, or the gradients stop painting. */
export function logoSheet(ids: ToolId[]): string {
  const symbols = ids.flatMap((id) => [symbol(id), ...(TOOLS[id].dark ? [symbol(`${id}-dark`)] : [])]).join('')
  return `<svg class="logo-sheet" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false">${symbols}</svg>`
}

const use = (name: string, size: number, cls: string) =>
  `<svg class="${cls}" width="${size}" height="${size}" aria-hidden="true" focusable="false"><use href="#logo-${name}"/></svg>`

/** A tool's logo at `size` px. A tool with a dark version brings both and the theme shows one; a mono logo takes the text colour. */
export function logo(id: ToolId, size: number): string {
  const t = TOOLS[id]
  if (t.dark) return use(id, size, 'logo logo-light') + use(`${id}-dark`, size, 'logo logo-dark')
  return use(id, size, t.mono ? 'logo mono' : 'logo')
}

/** The round badges on a step card's top-right corner, one per tool. */
export function logoBadges(ids: ToolId[] | undefined): string {
  if (!ids?.length) return ''
  return `<span class="logo-badges">${ids.map((id) => `<span class="logo-badge" style="--brand:${TOOLS[id].brand}">${logo(id, 12)}</span>`).join('')}</span>`
}

/** “Tools on this page”: one chip per tool, in the order given. */
export function toolStrip(ids: ToolId[]): string {
  return `<div class="tools-strip"><span class="tools-strip-label">Tools on this page</span><ul aria-label="Tools on this page">${ids.map((id) => `<li class="tool-chip">${logo(id, 16)}${TOOLS[id].name}</li>`).join('')}</ul></div>`
}

/** One <template> per tool. The page script copies it into the details panel. */
export const toolTemplates = (ids: ToolId[]) =>
  ids.map((id) => `<template id="tool-${id}"><span class="ptool">${logo(id, 14)}${TOOLS[id].name}</span></template>`).join('')

/** The tool whose name is exactly `name`, if any. */
export const toolByName = (name: string) => (Object.keys(TOOLS) as ToolId[]).find((id) => TOOLS[id].name === name)

/** A small logo before a glossary term that is a tool; nothing otherwise. */
export function glossaryLogo(term: string): string {
  const id = toolByName(term)
  return id ? `<span class="gl-logo" aria-hidden="true">${logo(id, 14)}</span>` : ''
}

/** Every tool in these lists, once each, in order of first appearance. */
export const toolsUsed = (lists: (ToolId[] | undefined)[]): ToolId[] => [...new Set(lists.flatMap((l) => l ?? []))]
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/brand.test.ts`
Expected: PASS, 15 tests.

If "draws mono logos in the text colour only" fails because a mono file still holds a hex colour, then `mono()` in `logos.mjs` missed an element that isn't a `<path>`:
- extend the regex in `mono()` to that element
- re-run the script
- ledger a Ruling

- [ ] **Step 8: Contact-sheet check (looks, not a test)**

Write `$SCRATCH/sheet.html`. It holds `logoSheet` of all tools, plus one `logo(id, 40)` per tool, on a `#fff` half and a `#050505` half. Mono logos use `color:#000` on the light half and `color:#fff` on the dark half. Each half sets `--logo-light` and `--logo-dark` the way the pages will.

Generate it with:

```bash
node -e "import('./lib/brand/render.ts').then(({logoSheet,logo})=>{const {TOOLS}=require('./lib/brand/tools.ts');const ids=Object.keys(TOOLS);const row=(bg,ink,l,d)=>'<div style=\"background:'+bg+';color:'+ink+';padding:16px;display:flex;gap:16px;flex-wrap:wrap\">'+ids.map(i=>'<span style=\"--logo-light:'+l+';--logo-dark:'+d+'\">'+logo(i,40)+'</span>').join('')+'</div>';require('fs').writeFileSync(process.argv[1],'<style>.logo-light{display:var(--logo-light)}.logo-dark{display:var(--logo-dark)}</style>'+logoSheet(ids)+row('#fff','#000','inline','none')+row('#050505','#fff','none','inline'))})" "$SCRATCH/sheet.html"
```

Screenshot it with a small Playwright script inside the repo, then delete the script. Look at the screenshot:
- Gmail, Telegram, Supabase and VS Code show their gradients.
- Every mono logo is visible on both halves.
- Codex is dark on white and white on black.

- [ ] **Step 9: Commit**

```bash
git add lib/brand tests/brand.test.ts docs/superpowers/specs/2026-10-01-lively-pages-design.md docs/superpowers/plans/2026-10-01-lively-pages.md
git commit -m "feat: tool logos, registry and logo helpers for the standalone pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The lively CSS layer and the reveal script

**Files:**
- Create: `lib/brand/lively.ts`
- Create: `lib/brand/reveal.js`
- Modify: `lib/brand/render.ts` (add `revealJs`)
- Test: `tests/brand-lively.test.ts`

**Interfaces:**
- Consumes: `TOOLS`, `ToolId` (Task 1).
- Produces:
  - `KINDS: { dark: Record<'trigger'|'ai'|'branch'|'helper', string>; light: … }`
  - `livelyCss(glow: [ToolId, ToolId]): string`
  - `revealJs(): string`, the reveal script text, ready to inline.
- Classes the pages rely on:
  - `.reveal-on` (on `<html>`) and `[data-reveal]`, `.in` (on targets)
  - `.logo`, `.logo.mono`, `.logo-light`, `.logo-dark`
  - `.logo-badges`, `.logo-badge`
  - `.tools-strip`, `.tools-strip-label`, `.tool-chip`
  - `.ptools`, `.ptool`, `.gl-logo`
- CSS variables: `--k`, `--brand`, `--halo-a`, `--halo-b`.

- [ ] **Step 1: Write the failing test** — `tests/brand-lively.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { KINDS, livelyCss } from '@/lib/brand/lively'
import { revealJs } from '@/lib/brand/render'
import { TOOLS } from '@/lib/brand/tools'
import { readTokens } from '@/lib/tokens'

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mix = (a: number[], b: number[], p: number) => a.map((v, i) => Math.round(v * p + b[i] * (1 - p)))

describe('livelyCss', () => {
  const css = livelyCss(['claude', 'telegram'])

  it('keeps every kind’s icon at 3:1 or more against its tinted card, in both themes', () => {
    for (const theme of ['dark', 'light'] as const) {
      const card = rgb(readTokens(theme).s2)
      for (const [kind, hex] of Object.entries(KINDS[theme])) expect(ratio(rgb(hex), mix(rgb(hex), card, 0.12)), `${theme} ${kind}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('defines the kind colours dark first, then for a light device, each theme attribute and print', () => {
    expect(css).toContain(`:root{--k-trigger:${KINDS.dark.trigger}`)
    expect(css).toContain(`@media (prefers-color-scheme: light){:root:not([data-theme=dark]){--k-trigger:${KINDS.light.trigger}`)
    expect(css).toContain(`:root[data-theme=light]{--k-trigger:${KINDS.light.trigger}`)
    expect(css).toContain(`:root[data-theme=dark]{--k-trigger:${KINDS.dark.trigger}`)
    expect(css).toMatch(new RegExp(`@media print\\{\\s*:root,:root\\[data-theme\\]\\{--k-trigger:${KINDS.light.trigger}`))
  })

  it('colours the hero glow from the two tools it is given', () => {
    expect(css).toContain(`--halo-a:${TOOLS.claude.brand}`)
    expect(css).toContain(`--halo-b:${TOOLS.telegram.brand}`)
  })

  it('turns the tints and the glow off in high contrast, and all motion off when motion is reduced', () => {
    expect(css).toContain(':root[data-a11y-contrast=true] .hero::before{display:none}')
    expect(css).toContain(':root[data-a11y-motion=true] [data-reveal]{opacity:1!important')
    expect(css).toContain(':root[data-a11y-motion=true] .hero::before{animation:none}')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\{[^}]*\.hero::before\{animation:none\}/)
    expect(css).toContain('@media (hover:hover) and (prefers-reduced-motion:no-preference)')
  })
})

describe('the reveal script', () => {
  const js = revealJs()
  it('stands down under reduced motion, the site’s motion setting, or without IntersectionObserver', () => {
    expect(js).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(js).toContain("root.dataset.a11yMotion === 'true'")
    expect(js).toContain("'IntersectionObserver' in window")
  })
  it('marks its targets and switches the page into reveal mode last', () => {
    expect(js).toContain("el.setAttribute('data-reveal', '')")
    expect(js.trim().split('\n').at(-2)).toContain("root.classList.add('reveal-on')")
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/brand-lively.test.ts`
Expected: FAIL. `@/lib/brand/lively` can't be resolved, and `revealJs` isn't exported.

- [ ] **Step 3: Write `lib/brand/lively.ts`**

```ts
import { TOOLS, type ToolId } from './tools.ts'

/** Each tinted step look's colour, per theme (spec 2026-10-01-lively-pages §5.1). Each reaches 3:1 on its tinted card (tests/brand-lively.test.ts). */
export const KINDS = {
  dark: { trigger: '#F5B041', ai: '#B79CFF', branch: '#7EB6FF', helper: '#5EEAD4' },
  light: { trigger: '#B45309', ai: '#6D28D9', branch: '#1D4ED8', helper: '#0F766E' },
} as const

const kinds = (t: Record<string, string>) => Object.entries(t).map(([k, v]) => `--k-${k}:${v}`).join(';')
const DARK = `${kinds(KINDS.dark)};--halo:22%;--logo-light:none;--logo-dark:inline`
const LIGHT = `${kinds(KINDS.light)};--halo:14%;--logo-light:inline;--logo-dark:none`
const TINTED = ':is(.k-trigger,.k-ai,.k-branch,.k-helper) .node-card'
const HC = ':root[data-a11y-contrast=true]'
const STILL = ':root[data-a11y-motion=true]'

/**
 * The shared lively layer (spec 2026-10-01-lively-pages §4–6), added after a
 * page's own CSS so it wins ties. Its theme blocks mirror pageCss: dark first,
 * the device theme when the page is opened alone, the site's data-theme inside
 * its dialog, and light in print. `glow` names the two tools whose colours
 * tint the hero.
 */
export function livelyCss(glow: [ToolId, ToolId]): string {
  return `
:root{${DARK};--halo-a:${TOOLS[glow[0]].brand};--halo-b:${TOOLS[glow[1]].brand}}
@media (prefers-color-scheme: light){:root:not([data-theme=dark]){${LIGHT}}}
:root[data-theme=light]{${LIGHT}}
:root[data-theme=dark]{${DARK}}
.k-trigger{--k:var(--k-trigger)}
.k-ai{--k:var(--k-ai)}
.k-branch{--k:var(--k-branch)}
.k-helper{--k:var(--k-helper)}
${TINTED}{border-color:color-mix(in srgb,var(--k) 45%,var(--b2));background:color-mix(in srgb,var(--k) 12%,var(--s2));color:var(--k)}
${HC} :is(.k-trigger,.k-helper) .node-card{border-color:var(--b2);background:var(--s2);color:var(--ink2)}
${HC} .k-branch .node-card{border-color:var(--b2);background:var(--s2);color:var(--ink)}
${HC} .k-ai .node-card{border-color:var(--accent);background:var(--wash);color:var(--accent)}
${HC} :is(.node.lit,.node:hover) .node-card{border-color:var(--accent)}
.logo{display:inline-block;flex:none;vertical-align:middle}
.logo.mono{color:var(--ink)}
.logo-light{display:var(--logo-light)}
.logo-dark{display:var(--logo-dark)}
.logo-badges{position:absolute;top:-8px;right:-8px;display:flex;flex-direction:row-reverse}
.logo-badge{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);transition:box-shadow .35s ease}
.logo-badge+.logo-badge{margin-right:-8px}
.node.lit .logo-badge{box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 30%,transparent),0 0 14px -2px var(--brand);transition-duration:.08s}
.tools-strip{display:flex;flex-direction:column;gap:8px}
.tools-strip-label{font-family:var(--mono);font-size:.625rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.tools-strip ul{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.tool-chip{display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 8px;border-radius:999px;border:1px solid var(--b1);background:var(--s1);font-size:.8125rem;color:var(--ink2)}
.ptools{display:flex;flex-wrap:wrap;gap:4px 12px;margin-bottom:6px}
.ptools[hidden]{display:none}
.ptool{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:500;color:var(--ink2)}
.gl-logo{display:inline-flex;margin-right:6px;vertical-align:-2px}
.tile,.card,.tool-chip{transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
:root:not([data-a11y-motion=true]) :is(.tile,.card,.tool-chip):hover{transform:translateY(-2px);border-color:var(--b2);box-shadow:0 10px 24px -14px color-mix(in srgb,var(--ink) 40%,transparent)}
:root:not([data-a11y-motion=true]) .node:hover .node-card{transform:translateY(-2px);box-shadow:0 10px 20px -12px color-mix(in srgb,var(--k,var(--accent)) 70%,transparent)}
}
.hero{position:relative;isolation:isolate}
.hero::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:-96px;height:440px;pointer-events:none;background:radial-gradient(45% 55% at 20% 45%,color-mix(in srgb,var(--halo-a) var(--halo),transparent),transparent 72%),radial-gradient(40% 50% at 75% 30%,color-mix(in srgb,var(--halo-b) var(--halo),transparent),transparent 72%);background-size:130% 130%;background-position:0% 0%;animation:halo 20s ease-in-out infinite alternate}
@keyframes halo{to{background-position:100% 60%}}
${HC} .hero::before{display:none}
.reveal-on [data-reveal]{transition:opacity .6s ease,transform .6s ease}
.reveal-on [data-reveal]:not(.in){opacity:0;transform:translateY(12px)}
${STILL} [data-reveal]{opacity:1!important;transform:none!important;transition:none!important}
${STILL} .hero::before{animation:none}
@media (prefers-reduced-motion: reduce){.hero::before{animation:none}[data-reveal]{opacity:1!important;transform:none!important}}
@media print{
:root,:root[data-theme]{${LIGHT}}
.hero::before{display:none}
[data-reveal]{opacity:1!important;transform:none!important;transition:none!important}
.logo,.logo-badge,.tool-chip,${TINTED}{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`
}
```

- [ ] **Step 4: Write `lib/brand/reveal.js`**

```js
// Scroll-in reveal for the standalone pages (spec 2026-10-01-lively-pages §6).
// Nothing is hidden unless this runs and motion is allowed, so the page is
// whole with JavaScript off, under reduced motion and in print. Whatever is
// on screen at load shows at once. It runs after the page's own script, which
// has already copied the site's motion setting onto <html>.
;(() => {
  const root = document.documentElement
  if (root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('in')
        seen.unobserve(e.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  for (const el of document.querySelectorAll('.tools-strip,.tiles,.jobs,.timeline,.gl,.gloss dl,.ote,.cards,.rules,.phases,.stages,.closing')) {
    el.setAttribute('data-reveal', '')
    if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in')
    else seen.observe(el)
  }
  root.classList.add('reveal-on')
})()
```

Add to the end of `lib/brand/render.ts`:

```ts
/** The scroll-in reveal script, ready to inline. Git may check it out with CRLF on Windows. */
export const revealJs = () => readFileSync(join(process.cwd(), 'lib/brand/reveal.js'), 'utf8').replace(/\r\n/g, '\n')
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/brand-lively.test.ts tests/brand.test.ts`
Expected: PASS, 6 + 15 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/brand tests/brand-lively.test.ts
git commit -m "feat: shared lively layer (kind tints, badges, strip, glow, hover, reveal) and the reveal script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Each page's data names its tools

**Files:**
- Modify: `data/buildPlan.ts`: header comment, `PlanNode` type, `node()` helper (around lines 1-80)
- Modify: `data/endToEnd.ts`: `Step` type (line 11), a `TOOLS_ON` map, `steps:` (line ~181)
- Modify: `data/agenticFramework.ts`: `LoopStep`, `Card` and `AgenticFramework` types; `stack` removed; `tools` on frame, build and check; `tool` on the three tool tiles
- Modify: `tests/agenticFramework-render.test.ts:19` and `:141`, which used `g.stack`
- Modify: `lib/agenticFramework/render.ts`, `hero()`, so it compiles without `stack` (the strip comes in Task 6)
- Test: `tests/brand-data.test.ts`

**Interfaces:**
- Consumes: `ToolId`, `TOOLS` (Task 1).
- Produces:
  - `PlanNode.tools: ToolId[]` (always one or two)
  - `Step.tools?: ToolId[]` (End-to-End)
  - `LoopStep.tools?: ToolId[]`
  - `Card.tool?: ToolId`
  - `AgenticFramework` has no `stack`

- [ ] **Step 1: Write the failing test** — `tests/brand-data.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { agenticFramework as af } from '@/data/agenticFramework'
import { plan } from '@/data/buildPlan'
import { endToEnd } from '@/data/endToEnd'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

/** The tools a line names. A longer name wins, so “Claude Code” is not also “Claude”. */
function named(text: string): ToolId[] {
  let rest = text
  const found: ToolId[] = []
  for (const id of (Object.keys(TOOLS) as ToolId[]).sort((a, b) => TOOLS[b].name.length - TOOLS[a].name.length)) {
    if (!rest.includes(TOOLS[id].name)) continue
    found.push(id)
    rest = rest.split(TOOLS[id].name).join(' ')
  }
  return found.sort()
}

describe('which tools each step shows', () => {
  it('End-to-End: a step shows exactly the tools its label or sub-line names', () => {
    for (const s of endToEnd.steps) expect([...(s.tools ?? [])].sort(), s.id).toEqual(named(`${s.label} ${s.sub}`))
    expect(endToEnd.steps.filter((s) => s.tools).map((s) => s.id)).toEqual(['a1', 'a3', 'd2', 'd4', 'e3', 'g2', 'h1', 'j2', 'j3'])
  })

  it('Agentic: a loop step shows exactly the tools its label or sub-line names', () => {
    for (const s of af.loop.steps) expect([...(s.tools ?? [])].sort(), s.id).toEqual(named(`${s.label} ${s.sub}`))
    expect(af.loop.steps.find((s) => s.id === 'check')!.tools).toEqual(['codex', 'vs-code'])
  })

  it('Agentic: each tool tile carries its tool, and the hero chips are gone', () => {
    expect(af.tools.map((t) => t.tool)).toEqual(['claude-code', 'vs-code', 'codex'])
    for (const t of af.tools) expect(TOOLS[t.tool!].name).toBe(t.title)
    expect('stack' in af).toBe(false)
  })

  it('build plan: every node shows the services its sub-line names, or n8n when it names none', () => {
    const SERVICES: [string, ToolId][] = [['Supabase', 'supabase'], ['Gmail', 'gmail'], ['Sheets', 'google-sheets'], ['Telegram', 'telegram'], ['Stripe', 'stripe'], ['Claude', 'claude'], ['Cal.com', 'cal-com']]
    for (const w of [...plan.workflows, ...plan.helpers.list])
      for (const n of w.nodes) {
        const want = SERVICES.filter(([word]) => n.sub.includes(word)).map(([, id]) => id)
        expect(n.tools, `${w.code} ${n.id} (${n.sub})`).toEqual(want.length ? want : ['n8n'])
      }
  })

  it('never puts more than two badges on one step', () => {
    const all = [...endToEnd.steps, ...af.loop.steps, ...[...plan.workflows, ...plan.helpers.list].flatMap((w) => w.nodes)]
    for (const s of all) expect((s.tools ?? []).length, s.id).toBeLessThanOrEqual(2)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/brand-data.test.ts`
Expected: FAIL in all five tests. The tools are `undefined` and `stack` is still in `af`.

- [ ] **Step 3: Build plan data**

In `data/buildPlan.ts`:
- In the header comment, replace "No imports, so Node can run it directly." with "Only a type import, so Node can run it directly."
- Add `import type { ToolId } from '../lib/brand/tools.ts'` after the header comment.
- Add `tools: ToolId[]` at the end of `PlanNode`.
- Replace the `node` helper:

```ts
/** The services a node's sub-line names; a node naming none is one of n8n's own (spec 2026-10-01-lively-pages §4.1). */
const SERVICES: [string, ToolId][] = [['Supabase', 'supabase'], ['Gmail', 'gmail'], ['Sheets', 'google-sheets'], ['Telegram', 'telegram'], ['Stripe', 'stripe'], ['Claude', 'claude'], ['Cal.com', 'cal-com']]
const toolsFor = (sub: string): ToolId[] => {
  const named = SERVICES.filter(([word]) => sub.includes(word)).map(([, id]) => id)
  return named.length ? named : ['n8n']
}
const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools: toolsFor(sub) })
```

- [ ] **Step 4: End-to-End data**

In `data/endToEnd.ts`:
- Add `import type { ToolId } from '../lib/brand/tools.ts'` after the header comment.
- Add `; tools?: ToolId[]` at the end of `Step`.
- Before `export const endToEnd`, add:

```ts
/** The tools each step names in its label or sub-line (spec 2026-10-01-lively-pages §4.1). */
const TOOLS_ON: Record<string, ToolId[]> = {
  a1: ['telegram'], a3: ['n8n'], d2: ['claude-code'], d4: ['vs-code'], e3: ['codex'], g2: ['n8n'], h1: ['n8n'], j2: ['github'], j3: ['vercel'],
}
```

Replace the `steps:` line with:

```ts
  steps: STEPS.map((s) => ({ ...s, ...(NUMBERED.has(s.lane) ? { n: s.at[0] + 1 } : {}), ...(TOOLS_ON[s.id] ? { tools: TOOLS_ON[s.id] } : {}) })),
```

Ledger this Ruling:
- **What:** `g2` (Auditor, "n8n audits") gets `n8n`, although the spec's table doesn't list it.
- **Why:** the spec's rule is that a step shows the tools its label or sub-line names, and the test holds both directions of that rule.
- **Cost if wrong:** one badge.

- [ ] **Step 5: Agentic data**

In `data/agenticFramework.ts`:
- Add `import type { ToolId } from '../lib/brand/tools.ts'`.
- Add `; tools?: ToolId[]` to `LoopStep`.
- Add `; tool?: ToolId` to `Card`.
- Delete `stack: { name: string; icon: string }[]` from `AgenticFramework`.
- Delete the `stack: [...]` block from `agenticFramework`.
- Tool tiles: add `tool: 'claude-code'` to card `01`, `tool: 'vs-code'` to `02` and `tool: 'codex'` to `03`.
- Loop steps: add `tools: ['claude-code']` to `frame` and `build`, and `tools: ['codex', 'vs-code']` to `check`.

In `lib/agenticFramework/render.ts`, `hero()` reads `g.stack`. For now, take the stack chips out:

```ts
function hero(g: AgenticFramework) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p></header>`
}
```

In `tests/agenticFramework-render.test.ts`:
- **Line 19:** it asserts the `.stack li` texts. Change it to assert there is no stack yet: `expect(doc.querySelector('.stack')).toBeNull()`. Task 6 turns it into the strip check.
- **Line 141:** remove `...g.stack, ` from the icon list.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/brand-data.test.ts tests/buildPlan-data.test.ts tests/endToEnd-data.test.ts tests/agenticFramework-data.test.ts tests/agenticFramework-render.test.ts`

Expected: all pass, except `public/agentic-framework.html is up to date`, which fails because the hero changed. Regenerate the page and re-run:

Run: `node scripts/make-af.ts && npx vitest run tests/agenticFramework-render.test.ts`
Expected: PASS.

Then run `npx tsc --noEmit`.
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add data tests lib/agenticFramework/render.ts public/agentic-framework.html
git commit -m "feat: each page's data names the tools on its steps; Agentic's stack chips make way for the strip

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Build plan page goes lively

**Files:**
- Modify: `lib/buildPlan/render.ts`
- Modify: `lib/buildPlan/client.js`, `open()` (around line 108)
- Regenerate: `public/build-plan.html` (`node scripts/make-plan.ts`)
- Test: `tests/buildPlan-render.test.ts` (new describe), `e2e/build-plan.spec.ts` (new test)

**Interfaces:**
- Consumes:
  - `logoSheet`, `logoBadges`, `toolStrip`, `toolTemplates`, `toolsUsed`, `revealJs` (Tasks 1–2)
  - `livelyCss` (Task 2)
  - `PlanNode.tools` (Task 3)
- Produces:
  - The panel slot `<span class="ptools" data-p="tools" hidden></span>`, the first child of `#node-panel`.
  - Node index entries carry `tools?: ToolId[]`.
  - In `client.js`, `open()` fills the slot from `<template id="tool-<id>">`. Task 5 makes the same change to `lib/endToEnd/client.js`.

- [ ] **Step 1: Write the failing tests**

Add `import { TOOLS } from '@/lib/brand/tools'` to the imports at the top of `tests/buildPlan-render.test.ts`, then append:

```ts

describe('the build plan’s logos and colour', () => {
  const used = [...new Set(flows.flatMap((w) => w.nodes.flatMap((n) => n.tools)))]

  it('badges every node with its tools, in order', () => {
    for (const w of flows)
      for (const n of w.nodes) {
        const btn = doc.querySelector(`[data-node="${w.code.toLowerCase()}:${n.id}"]`)!
        const hrefs = [...btn.querySelectorAll('.logo-badge')].map((b) => b.querySelector('use')!.getAttribute('href'))
        expect(hrefs, `${w.code} ${n.id}`).toEqual(n.tools.map((t) => `#logo-${t}`))
      }
  })

  it('lists the tools used in the hero, in order of first appearance', () => {
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((c) => c.textContent)).toEqual(used.map((t) => TOOLS[t].name))
  })

  it('draws each logo it uses once, and no other', () => {
    expect([...doc.querySelectorAll('.logo-sheet symbol')].map((s) => s.id)).toEqual(used.map((t) => `logo-${t}`))
  })

  it('gives the panel a tools slot and a template per tool, and says which tools each node uses', () => {
    expect(doc.querySelector('#node-panel > [data-p=tools]')!.hasAttribute('hidden')).toBe(true)
    expect([...doc.querySelectorAll('template')].map((t) => t.id)).toEqual(used.map((t) => `tool-${t}`))
    expect(JSON.parse(doc.getElementById('plan-nodes')!.textContent!)['tm-01:n3'].tools).toEqual(['supabase'])
  })

  it('adds the lively layer with the n8n and Supabase glow, and the reveal script last', () => {
    const css = doc.querySelector('style')!.textContent!
    expect(css).toContain(`--halo-a:${TOOLS.n8n.brand}`)
    expect(css).toContain(`--halo-b:${TOOLS.supabase.brand}`)
    expect([...doc.querySelectorAll('script')].at(-1)!.textContent).toContain("root.classList.add('reveal-on')")
  })

  it('grows by no more than 40 KB', () => {
    expect(html.length).toBeLessThan(172_274 + 40_000)
  })
})
```

Append to `e2e/build-plan.spec.ts`:

```ts
test('a node’s panel shows the tool it uses; a key item shows none', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="tm-01:n3"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const tools = page.locator('#node-panel [data-p=tools]')
  await expect(tools).toBeVisible()
  await expect(tools).toHaveText('Supabase')
  await expect(tools.locator('use')).toHaveAttribute('href', '#logo-supabase')
  await page.keyboard.press('Escape')
  await page.locator('[data-node="key:trigger"]').click()
  await expect(tools).toBeHidden()
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/buildPlan-render.test.ts`
Expected: FAIL in the new describe: no `.logo-badge`, no `.tool-chip`, no `.logo-sheet`, no `[data-p=tools]`.

- [ ] **Step 3: Implement in `lib/buildPlan/render.ts`**

Imports, added after the existing ones:

```ts
import { livelyCss } from '../brand/lively.ts'
import { logoBadges, logoSheet, revealJs, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
```

`NodeIndex`:

```ts
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>
```

`hero` gains `used` and the strip after the lede:

```ts
function hero(p: Plan, index: NodeIndex, used: ToolId[]) {
```

Its return starts with:

```ts
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(p.home)}</a><span class="kicker">${esc(p.kicker)}</span><h1>${esc(p.heading)}</h1><p class="lede">${esc(p.lede)}</p>${toolStrip(used)}<dl class="meta">${p.meta
```

The rest of `hero` is unchanged.

In `canvas`:

```ts
  for (const n of w.nodes) index[key(n.id)] = { label: n.label, type: n.type, what: n.what, settings: n.settings, tools: n.tools }
```

In the node button, change the card to:

```ts
<span class="node-card" aria-hidden="true">${iconSvg(n.icon)}${logoBadges(n.tools)}</span>
```

In `renderPlan`, after `const parts = sections(p, index)`:

```ts
  const used = toolsUsed([...p.workflows, ...p.helpers.list].flatMap((w) => w.nodes.map((n) => n.tools)))
```

In the template:
- `<style>${pageCss(themes)}${livelyCss(['n8n', 'supabase'])}</style>`
- `<body>` followed by a new line `${logoSheet(used)}`
- `${hero(p, index, used)}`
- The panel line becomes `<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span>…` (the rest as before).
- A new line `${toolTemplates(used)}` right after the panel `</div>`.
- A new `<script>${revealJs()}</script>` right after `<script>${client}</script>`.

- [ ] **Step 4: Implement in `lib/buildPlan/client.js`**

In `open()`, right after `panel.querySelector('[data-p=what]').textContent = n.what`, add:

```js
    // The step's tools, copied from the page's templates (none for key items and stages).
    const tools = panel.querySelector('[data-p=tools]')
    if (tools) {
      tools.replaceChildren(...(n.tools || []).map((t) => document.getElementById(`tool-${t}`).content.cloneNode(true)))
      tools.hidden = !n.tools?.length
    }
```

- [ ] **Step 5: Regenerate and run the tests**

Run: `node scripts/make-plan.ts && npx vitest run tests/buildPlan-render.test.ts tests/buildPlan-data.test.ts tests/brand-data.test.ts`
Expected: PASS, the freshness test included. The script prints the new size, which must be under 212 KB.

Run: `npx playwright test e2e/build-plan.spec.ts --project=desktop`
Expected: all pass, the new panel test included.

- [ ] **Step 6: Look at it**

Screenshot `/build-plan.html` at 1280×800 and 390×844, in dark and light, at the hero and at TM-01's diagram. Check:
- the badges sit on the top-right corner
- the tints read as soft
- the glow sits behind the title
- the strip wraps on a phone

Fix anything visibly wrong in `lively.ts`, and ledger a Ruling for it.

- [ ] **Step 7: Commit**

```bash
git add lib/buildPlan public/build-plan.html tests/buildPlan-render.test.ts e2e/build-plan.spec.ts lib/brand
git commit -m "feat: build plan goes lively: n8n and service badges, kind tints, tools strip, glow, reveal; panel names the tool

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: End-to-End page goes lively

**Files:**
- Modify: `lib/endToEnd/render.ts`
- Modify: `lib/endToEnd/client.js`, `open()` (around line 112)
- Regenerate: `public/end-to-end.html` (`node scripts/make-e2e.ts`) and `public/agentic-framework.html` (`node scripts/make-af.ts`), because the Agentic page inlines this client
- Test: `tests/endToEnd-render.test.ts` (new describe), `e2e/end-to-end.spec.ts` (new test)

**Interfaces:**
- Consumes: Tasks 1–3 as in Task 4; `Step.tools` (Task 3).
- Produces: the same panel slot and client behaviour as Task 4, for End-to-End and, through its client, for Agentic.

- [ ] **Step 1: Write the failing tests**

Add `import { TOOLS } from '@/lib/brand/tools'` to the imports at the top of `tests/endToEnd-render.test.ts`, then append:

```ts

describe('the End-to-End page’s logos and colour', () => {
  const used = ['telegram', 'n8n', 'claude-code', 'vs-code', 'codex', 'github', 'vercel'] as const

  it('badges exactly the steps that name a tool', () => {
    for (const s of g.steps) {
      const hrefs = [...doc.querySelectorAll(`[data-node="${s.id}"] .logo-badge`)].map((b) => b.querySelector('use')!.getAttribute('href'))
      expect(hrefs, s.id).toEqual((s.tools ?? []).map((t) => `#logo-${t}`))
    }
  })

  it('lists the tools in the hero, after the stance, in order of first appearance', () => {
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((c) => c.textContent)).toEqual(used.map((t) => TOOLS[t].name))
    expect(doc.querySelector('.stance + .tools-strip')).not.toBeNull()
  })

  it('draws each logo it uses once (Codex with its dark version), and no other', () => {
    expect([...doc.querySelectorAll('.logo-sheet symbol')].map((s) => s.id)).toEqual(used.flatMap((t) => [`logo-${t}`, ...(TOOLS[t].dark ? [`logo-${t}-dark`] : [])]))
  })

  it('puts a logo before each glossary term that is a tool', () => {
    const withLogo = [...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)
    expect(withLogo).toEqual(['n8n', 'Telegram', 'Claude Code', 'VS Code', 'Codex'])
  })

  it('gives the panel a tools slot and the index each step’s tools', () => {
    expect(doc.querySelector('#node-panel > [data-p=tools]')!.hasAttribute('hidden')).toBe(true)
    expect(data().d2.tools).toEqual(['claude-code'])
    expect(data().c1.tools).toBeUndefined()
  })

  it('adds the lively layer with the Claude and Telegram glow, the reveal script last, and grows by no more than 40 KB', () => {
    expect(doc.querySelector('style')!.textContent).toContain(`--halo-b:${TOOLS.telegram.brand}`)
    expect([...doc.querySelectorAll('script')].at(-1)!.textContent).toContain("root.classList.add('reveal-on')")
    expect(html.length).toBeLessThan(190_923 + 40_000)
  })
})
```

Append to `e2e/end-to-end.spec.ts`:

```ts
test('a step’s panel shows the tool it uses; a step with none shows none', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="d2"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const tools = page.locator('#node-panel [data-p=tools]')
  await expect(tools).toHaveText('Claude Code')
  await page.keyboard.press('Escape')
  const plain = page.locator('[data-node="c1"]')
  await plain.scrollIntoViewIfNeeded()
  await plain.click()
  await expect(tools).toBeHidden()
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/endToEnd-render.test.ts`
Expected: FAIL in the new describe.

- [ ] **Step 3: Implement in `lib/endToEnd/render.ts`**

Imports:

```ts
import { livelyCss } from '../brand/lively.ts'
import { glossaryLogo, logoBadges, logoSheet, revealJs, toolByName, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
```

`NodeIndex` gains `tools?: ToolId[]`, as in Task 4.

`hero(g, index)` becomes `hero(g, index, used: ToolId[])`. In its return, replace `<p class="stance">${esc(g.stance)}</p>` with:

```ts
<p class="stance">${esc(g.stance)}</p>${toolStrip(used)}
```

In `graph`, the index line becomes:

```ts
  for (const s of g.steps) index[s.id] = { label: s.label, type: `${KIND_TYPES[s.kind]}${s.enforced ? ' · RUNS ON ITS OWN' : ''}`, what: s.what, settings: [], ...(s.tools ? { tools: s.tools } : {}) }
```

In the button, the card becomes:

```ts
<span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${badges}${logoBadges(s.tools)}</span>
```

`glossary`:

```ts
  const terms = g.glossary.terms.map(([t, m]) => `<div><dt>${glossaryLogo(t)}${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')
```

In `renderEndToEnd`:

```ts
  const used = toolsUsed([...g.steps.map((s) => s.tools), ...g.glossary.terms.map(([t]) => { const id = toolByName(t); return id ? [id] : undefined })])
  const top = hero(g, index, used)
```

In the template:
- `<style>${e2eCss(themes)}${livelyCss(['claude', 'telegram'])}</style>`
- `${logoSheet(used)}` right after `<body>`
- `<span class="ptools" data-p="tools" hidden></span>` as the panel's first child
- `${toolTemplates(used)}` after the panel
- `<script>${revealJs()}</script>` after the client script

- [ ] **Step 4: Implement in `lib/endToEnd/client.js`**

Add the same lines as Task 4 Step 4, right after `panel.querySelector('[data-p=what]').textContent = n.what`:

```js
    // The step's tools, copied from the page's templates (none for key items and pins).
    const tools = panel.querySelector('[data-p=tools]')
    if (tools) {
      tools.replaceChildren(...(n.tools || []).map((t) => document.getElementById(`tool-${t}`).content.cloneNode(true)))
      tools.hidden = !n.tools?.length
    }
```

- [ ] **Step 5: Regenerate both pages that use this client, and run the tests**

Run: `node scripts/make-e2e.ts && node scripts/make-af.ts && npx vitest run tests/endToEnd-render.test.ts tests/agenticFramework-render.test.ts`
Expected: PASS, both freshness tests included.

Run: `npx playwright test e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts --project=desktop`
Expected: all pass. The Agentic panel has no slot yet; the client's `if (tools)` guard covers that.

- [ ] **Step 6: Look at it**

Screenshot `/end-to-end.html` in dark and light, at the hero, lane A, lanes D–E and lane J, and at 390px. Check:
- the GitHub and Vercel badges are visible on both themes
- the D2/D4/E3 badges don't collide with the number badge (top-left) or the gear and lock badges (bottom-right)

- [ ] **Step 7: Commit**

```bash
git add lib/endToEnd public/end-to-end.html public/agentic-framework.html tests/endToEnd-render.test.ts e2e/end-to-end.spec.ts
git commit -m "feat: End-to-End goes lively: tool badges, kind tints, tools strip, glossary logos, glow, reveal

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Agentic Framework page goes lively

**Files:**
- Modify: `lib/agenticFramework/render.ts`
- Modify: `lib/agenticFramework/styles.ts` (remove the `.stack` rules)
- Regenerate: `public/agentic-framework.html` (`node scripts/make-af.ts`)
- Test: `tests/agenticFramework-render.test.ts` (line 19 and a new describe), `e2e/agentic-framework.spec.ts` (new tests)

**Interfaces:**
- Consumes: Tasks 1–5 (the client already fills `[data-p=tools]`); `LoopStep.tools`, `Card.tool` (Task 3).
- Produces: the finished Agentic page.

- [ ] **Step 1: Write the failing tests**

In `tests/agenticFramework-render.test.ts`, replace Task 3's line-19 assertion with:

```ts
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['Claude Code', 'VS Code', 'Codex'])
```

Add `import { TOOLS } from '@/lib/brand/tools'` to the imports at the top, then append:

```ts

describe('the Agentic page’s logos and colour', () => {
  it('badges Frame and Build with Claude Code, and Check with Codex then VS Code', () => {
    const hrefs = (id: string) => [...doc.querySelectorAll(`[data-node="${id}"] .logo-badge`)].map((b) => b.querySelector('use')!.getAttribute('href'))
    expect(hrefs('frame')).toEqual(['#logo-claude-code'])
    expect(hrefs('build')).toEqual(['#logo-claude-code'])
    expect(hrefs('check')).toEqual(['#logo-codex', '#logo-vs-code'])
    expect(hrefs('gate')).toEqual([])
  })

  it('shows the real logo on each tool tile, and the Phosphor icon everywhere else', () => {
    const tiles = [...doc.querySelectorAll('#tools .tile-icon')]
    expect(tiles.map((t) => t.querySelector('use')!.getAttribute('href'))).toEqual(['#logo-claude-code', '#logo-vs-code', '#logo-codex'])
    expect(doc.querySelector('#rules .tile-icon use')).toBeNull()
  })

  it('draws each logo once, with Codex’s dark version, and puts logos before the tool terms in the glossary', () => {
    expect([...doc.querySelectorAll('.logo-sheet symbol')].map((s) => s.id)).toEqual(['logo-claude-code', 'logo-vs-code', 'logo-codex', 'logo-codex-dark'])
    expect([...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)).toEqual(['Claude Code', 'VS Code', 'Codex'])
  })

  it('gives the panel a tools slot and the index each step’s tools', () => {
    expect(doc.querySelector('#node-panel > [data-p=tools]')!.hasAttribute('hidden')).toBe(true)
    expect(data().check.tools).toEqual(['codex', 'vs-code'])
    expect(data()['rule:R1'].tools).toBeUndefined()
  })

  it('adds the lively layer with the Claude and VS Code glow, the reveal script last, and grows by no more than 40 KB', () => {
    expect(doc.querySelector('style')!.textContent).toContain(`--halo-b:${TOOLS['vs-code'].brand}`)
    expect([...doc.querySelectorAll('script')].at(-1)!.textContent).toContain("root.classList.add('reveal-on')")
    expect(html.length).toBeLessThan(68_774 + 40_000)
  })
})
```

Append to `e2e/agentic-framework.spec.ts`:

```ts
test('Check’s panel names both its tools; a rule pin names none', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  await page.locator('[data-node="check"]').click()
  const tools = page.locator('#node-panel [data-p=tools]')
  await expect(tools).toHaveText('CodexVS Code')
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Rule R4: The model grades itself' }).click()
  await expect(tools).toBeHidden()
})

test('Check’s two badges sit together on its top-right corner, clear of its rule pin', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const card = (await page.locator('[data-node="check"] .node-card').boundingBox())!
  const pin = (await page.getByRole('button', { name: 'Rule R4: The model grades itself' }).boundingBox())!
  const badges = await page.locator('[data-node="check"] .logo-badge').all()
  expect(badges).toHaveLength(2)
  for (const b of badges) {
    const box = (await b.boundingBox())!
    expect(box.x + box.width / 2).toBeGreaterThan(card.x + card.width / 2)
    expect(box.y + box.height / 2).toBeLessThan(card.y + card.height / 2)
    const apart = box.x >= pin.x + pin.width || pin.x >= box.x + box.width || box.y >= pin.y + pin.height || pin.y >= box.y + box.height
    expect(apart).toBe(true)
  }
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/agenticFramework-render.test.ts`
Expected: FAIL. There's no `.tool-chip`, `.logo-badge` or `.logo-sheet`.

- [ ] **Step 3: Implement in `lib/agenticFramework/render.ts`**

Imports:

```ts
import { livelyCss } from '../brand/lively.ts'
import { glossaryLogo, logo, logoBadges, logoSheet, revealJs, toolByName, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
```

`NodeIndex` gains `tools?: ToolId[]`.

`tiles`: the icon becomes the tool's logo when there is one:

```ts
const tiles = (list: Card[]) =>
  `<ul class="tiles">${list
    .map((c) => `<li class="tile"><span class="tile-top"><span class="tile-icon" aria-hidden="true">${c.tool ? logo(c.tool, 20) : iconSvg(c.icon, 18)}</span><span class="tile-mark">${esc(c.mark)}</span></span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.note ? `<span class="tile-note">${esc(c.note)}</span>` : ''}</li>`)
    .join('')}</ul>`
```

`hero`:

```ts
function hero(g: AgenticFramework, used: ToolId[]) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p>${toolStrip(used)}</header>`
}
```

In `loop`:

```ts
  for (const s of steps) index[s.id] = { label: s.label, type: KIND_TYPES[s.kind], what: s.what, settings: [], ...(s.tools ? { tools: s.tools } : {}) }
```

In the step button:

```ts
<span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${s.kind === 'gate' ? LOCK() : ''}${logoBadges(s.tools)}</span>
```

`glossary`:

```ts
const glossary = (g: AgenticFramework) => `<dl class="gl">${g.glossary.map(([t, m]) => `<div><dt>${glossaryLogo(t)}${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')}</dl>`
```

In `renderAgenticFramework`, first line after `const index: NodeIndex = {}`:

```ts
  const used = toolsUsed([...g.tools.map((c) => (c.tool ? [c.tool] : undefined)), ...g.loop.steps.map((s) => s.tools), ...g.glossary.map(([t]) => { const id = toolByName(t); return id ? [id] : undefined })])
```

In the template:
- `<style>${afCss(themes)}${livelyCss(['claude', 'vs-code'])}</style>`
- `${logoSheet(used)}` after `<body>`
- `${hero(g, used)}`
- the panel's first child `<span class="ptools" data-p="tools" hidden></span>`
- `${toolTemplates(used)}` after the panel
- `<script>${revealJs()}</script>` after the client script

In `lib/agenticFramework/styles.ts`, delete the three `.stack` rules (`.stack{…}`, `.stack li{…}`, `.stack svg{…}`).

- [ ] **Step 4: Regenerate and run the tests**

Run: `node scripts/make-af.ts && npx vitest run tests/agenticFramework-render.test.ts tests/agenticFramework-data.test.ts`
Expected: PASS.

Run: `npx playwright test e2e/agentic-framework.spec.ts --project=desktop`
Expected: all pass, the two new tests included.

- [ ] **Step 5: Look at it**

Screenshot `/agentic-framework.html` in dark and light, at the hero, the tools tiles, the loop and the glossary, and at 390px. Check:
- Codex flips with the theme
- Check's two badges overlap neatly

- [ ] **Step 6: Commit**

```bash
git add lib/agenticFramework public/agentic-framework.html tests/agenticFramework-render.test.ts e2e/agentic-framework.spec.ts
git commit -m "feat: Agentic Framework goes lively: logo tiles and strip, step badges, glossary logos, glow, reveal

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Cross-page browser checks, Home screenshots, full verification

**Files:**
- Create: `e2e/lively.spec.ts`
- Regenerate: `public/shots/build-plan.jpeg`, `public/shots/end-to-end.jpeg`, `public/shots/agentic-framework.jpeg`

**Interfaces:**
- Consumes: everything above.
- Produces: the verified branch.

- [ ] **Step 1: Write the browser tests** — `e2e/lively.spec.ts`

```ts
import { expect, test } from '@playwright/test'

const PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html']
// The same list lib/brand/reveal.js marks.
const TARGETS = '.tools-strip,.tiles,.jobs,.timeline,.gl,.gloss dl,.ote,.cards,.rules,.phases,.stages,.closing'
const allShown = (page: import('@playwright/test').Page) =>
  page.evaluate((sel) => [...document.querySelectorAll(sel)].every((el) => getComputedStyle(el).opacity === '1'), TARGETS)
const glowOf = (page: import('@playwright/test').Page) =>
  page.locator('.hero').evaluate((el) => {
    const s = getComputedStyle(el, '::before')
    return { display: s.display, animation: s.animationName }
  })

for (const PAGE of PAGES) {
  test(`${PAGE}: every logo it points at is in its sheet, and the strip shows`, async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.getByRole('list', { name: 'Tools on this page' }).getByRole('listitem').first()).toBeVisible()
    const missing = await page.evaluate(() => [...document.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((h) => !document.getElementById(h.slice(1))))
    expect(missing).toEqual([])
  })

  test(`${PAGE}: reveals what scrolls into view; the glow drifts`, async ({ page }) => {
    await page.goto(PAGE)
    await expect(page.locator('html')).toHaveClass(/reveal-on/)
    await expect(page.locator('.tools-strip')).toHaveClass(/\bin\b/)
    const last = page.locator('[data-reveal]').last()
    await expect(last).not.toHaveClass(/\bin\b/)
    await last.scrollIntoViewIfNeeded()
    await expect(last).toHaveClass(/\bin\b/)
    await expect.poll(() => last.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    expect(await glowOf(page)).toEqual({ display: 'block', animation: 'halo' })
  })

  test(`${PAGE}: hides nothing under reduced motion or with JavaScript off, and the glow holds still`, async ({ browser }) => {
    for (const opts of [{ reducedMotion: 'reduce' as const }, { javaScriptEnabled: false }]) {
      const ctx = await browser.newContext(opts)
      const page = await ctx.newPage()
      await page.goto(PAGE)
      await expect(page.locator('html')).not.toHaveClass(/reveal-on/)
      expect(await allShown(page), JSON.stringify(opts)).toBe(true)
      if (opts.reducedMotion) expect((await glowOf(page)).animation).toBe('none')
      await ctx.close()
    }
  })

  test(`${PAGE}: prints everything, without the glow, in the light logos`, async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await page.emulateMedia({ media: 'print' })
    expect(await allShown(page)).toBe(true)
    expect((await glowOf(page)).display).toBe('none')
    for (const dark of await page.locator('.logo-dark').all()) await expect(dark).toBeHidden()
    await ctx.close()
  })

  test(`${PAGE}: the site’s High contrast and Reduce motion still apply when switched on after load`, async ({ page }) => {
    await page.goto(PAGE)
    const tinted = page.locator('.k-trigger .node-card').first()
    const plain = page.locator('.k-action .node-card').first()
    const bg = (l: typeof tinted) => l.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(await bg(tinted)).not.toBe(await bg(plain))
    await page.evaluate(() => {
      document.documentElement.dataset.a11yContrast = 'true'
      document.documentElement.dataset.a11yMotion = 'true'
    })
    expect(await bg(tinted)).toBe(await bg(plain))
    expect((await glowOf(page)).display).toBe('none')
    await expect(page.locator('.logo-badge').first()).toBeAttached()
    expect(await allShown(page)).toBe(true)
  })

  test(`${PAGE}: at phone width nothing scrolls sideways and the strip wraps inside the page`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(PAGE)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    const strip = (await page.locator('.tools-strip').boundingBox())!
    expect(strip.x + strip.width).toBeLessThanOrEqual(390)
  })
}

test('opened at a hash, the target section is revealed once the jump lands', async ({ page }) => {
  await page.goto('/end-to-end.html#glossary')
  await expect(page.locator('#glossary dl')).toHaveClass(/\bin\b/)
  await expect.poll(() => page.locator('#glossary dl').evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
})

test('mono logos and Codex follow the theme', async ({ browser }) => {
  for (const scheme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto('/end-to-end.html')
    const body = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)
    for (const mono of await page.locator('.tool-chip .logo.mono').all()) expect(await mono.evaluate((el) => getComputedStyle(el).color), scheme).not.toBe(body)
    const codex = page.locator('.tool-chip').filter({ hasText: 'Codex' })
    await expect(codex.locator(scheme === 'dark' ? '.logo-dark' : '.logo-light')).toBeVisible()
    await expect(codex.locator(scheme === 'dark' ? '.logo-light' : '.logo-dark')).toBeHidden()
    await ctx.close()
  }
})

test('a badge glows in its brand colour while a ball lights its step', async ({ page }) => {
  await page.goto('/agentic-framework.html#loop')
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll('.node.lit .logo-badge')].some((b) => getComputedStyle(b).boxShadow !== 'none')), { timeout: 15_000 })
    .toBe(true)
})
```

- [ ] **Step 2: Run it**

Run: `npx playwright test e2e/lively.spec.ts --project=desktop`
Expected: all pass (6 × 3 + 3 = 21 tests).

Any failure is a defect in Tasks 1–6. Handle it with superpowers:systematic-debugging:
- fix it in the owning file
- regenerate the affected page
- re-run

- [ ] **Step 3: Re-shoot the Home screenshots**

Run: `node scripts/shoot-plan.mjs && node scripts/shoot-e2e.mjs && node scripts/shoot-af.mjs`
Expected: three `.jpeg` files rewritten in `public/shots/`. Open each and check that the logos, the strip and the glow show.

- [ ] **Step 4: Full verification**

Run each and read the output:
- `npm test`. Expected: all pass. The count is 554 plus the new tests.
- `npm run lint`. Expected: clean.
- `npm run typecheck`. Expected: clean.
- `npx playwright test --project=desktop e2e/build-plan.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts e2e/lively.spec.ts e2e/projects.spec.ts e2e/seo.spec.ts`. Expected: all pass.
- `npx playwright test --project=phone`. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add e2e/lively.spec.ts public/shots
git commit -m "test: lively pages in every theme, motion setting, print and phone; Home screenshots re-shot

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
