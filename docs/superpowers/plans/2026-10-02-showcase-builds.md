# Showcase Builds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder flagship on `/showcase` with the four sample businesses (each one's site, flow, and agents and bots), and replace the placeholder quotes with build facts counted from the data, so the page carries no placeholder text.

**Architecture:** `data/showcase.ts` is rewritten to join what already exists (`data/automations.ts` flows, `data/projects.ts` sites, `data/agents.ts` builds) into four `BUSINESSES` and five `FACTS`; the only new copy is a line per business. `components/showcase/Flagship.tsx` keeps its tab clock and holds but shows a business: a copy column (the tab panel) with links, a window whose full-length site shot scrolls with the clock, and the business's flow as a strip of logo chips, pulled out of the Automations card into a shared `components/projects/FlowStrip.tsx`. `Facts.tsx` replaces `Feedback.tsx`; `Mock.tsx` goes. The thumbnail script learns to flatten pinned (sticky) sections, so Westmere's tall shot has no blank half, and shoots the tall shots at 0.6× so the Showcase window is sharp.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before touching Next code, per AGENTS.md — the `next/image` page in particular), React 19, Tailwind v4, Vitest + jsdom, Playwright.

**Spec:** Approved in chat on 2026-10-02; copied verbatim in §0 below, so it travels with this plan.

## Global Constraints

- Work on branch `feat/showcase-builds`, cut from `main`. Commit only there; push, PR and merge only when the user says so.
- House style: no semicolons, single quotes, long lines. Never run prettier.
- No raw hex colours outside the allowed files (`tests/no-raw-colors.test.ts`). New CSS uses tokens (`var(--accent)` etc.) only.
- Nothing the site shows may mention kape (`tests/no-kape.test.ts` reads every string `data/*.ts` exports).
- Copy, verbatim: title `['Four businesses,', 'built end to end.']`; lede `A site, the flow behind its form, and the agents that answer for it, for each of four sample businesses.`; sample note `Sample builds for fictional businesses, not client projects.`; tablist `Sample builds`; list heading `What I built`; site line `The site`; button `Open the site`; facts heading `What’s in the four builds`.
- The four lines, verbatim: HP-01 `Professional movers on the Tidewater Coast, quoting homes and offices.`; WM-01 `A residential developer selling a small set of Los Angeles homes.`; ME-01 `A commercial solar company that surveys sites before it installs.`; MW-01 `An automotive workshop that takes its service bookings online.`
- Tab order is the Automations order: Harbor & Pine, Westmere, Meridian Energy, Meridian Werks. Ironline is out (no flow).
- Clock: 6000 ms per business. Hover, focus anywhere in the flagship, off screen, reduced motion and the site's motion switch hold it, and the site shot's scroll and the strip's pulse hold with it.
- Facts: 4 sample sites · 4 live flows · 24 flow steps · 7 agents and bots · 12 tools, each computed, never typed.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A keyboard user tabbing into the "What I built" links has the business swap under them.** The old flagship only held on focus inside the window column. Expect focus anywhere in the flagship to hold the clock. Pinned in Task 4 (unit: `focusIn` on a panel link drops `data-run`).
2. **The site shot keeps scrolling after the clock holds, or jumps to the bottom under the site's motion switch.** `html[data-a11y-motion=true] *` shortens every animation to .001ms, which with `fill: both` would park the shot at its end. Expect it to pause with the clock and to sit at the top when motion is off. Pinned in Task 4 (unit: `data-run`/`data-still` on `.flag-shot`) and Task 6 (e2e: `playState` paused under the pointer; no animation and top-aligned under reduced motion).
3. **A link points at a file or anchor that doesn't exist** (e.g. `#build-helpdesk` renamed on the agents page). Expect every link to land. Pinned in Task 1 (unit: each href's file exists in `public/`, and each `#hash` is an `id` in that file).
4. **The window or the tab bar pushes a 320px phone sideways.** Expect only the tab bar to scroll inside its own box. Pinned in Task 6 (e2e at 320 and 390).
5. **The tall shot's real size disagrees with the `width`/`height` the window gives `next/image`,** so the scroll stops short or overshoots. Expect the shot to reach exactly its bottom edge. Pinned in Task 2 (unit: each tall jpeg's size read from its header equals `TALL`).

---

## §0 The approved spec (verbatim from chat)

**Goal:** replace the placeholder flagship on `/showcase` with your four sample businesses: each one's site, its flow, and its agents and bots. Replace the placeholder quotes with build facts counted from the data. No placeholder text stays on the page.

### 1. Data: data/showcase.ts, rewritten
- **Page copy:** title `['Four businesses,', 'built end to end.']`; lede "A site, the flow behind its form, and the agents that answer for it, for each of four sample businesses."; sample "Sample builds for fictional businesses, not client projects."
- **The flagship's copy:** `tabsLabel` "Sample builds"; `built` "What I built"; `open` "Open the site"; `siteLine` "The site"; `ms` 6000.
- **`BUSINESSES`:** the four businesses in Automations tab order, each joined from data that already exists: the flow (from `automations.flows`, by code); the site, from the Projects site list (by `src`, which equals `flow.href`), giving its name, `src` and tall shot; the agents and bots, from `agents.builds` whose `business.name` equals the site's name, giving each one's id, name and trade.
- **The only new copy is one line per business** (the four lines in Global Constraints).
- **`FACTS`:** 4 sample sites, 4 live flows, 24 flow steps, 7 agents and bots, 12 tools (the set of platforms, flow-step tools and agents' tools). Label "WHAT'S IN THE FOUR BUILDS".
- **Removed:** `MOCK`, `TABS`, `FEEDBACK` and their types.

### 2. Flagship
- **Kept:** the tab bar; the progress-bar clock; the holds (hover, focus, off screen, reduced motion); the arrow, Home and End keys.
- **The tabs:** four, each with the business's short name and its platform's logo. Ids `flag-tab-<code>`.
- **The copy column, keyed to the tab:** eyebrow `SAMPLE BUILD · <TRADE>`; h2 site name, then the line; "What I built" list (the site, the flow `<title> · <Platform>` → `/automations.html#<code>`, each agent or bot → `/ai-agents.html#build-<id>`), all new tab; then **Open the site ↗**.
- **The window:** address bar shows the `src` path; the full-length shot scrolls top to bottom on the clock's `--flag-ms`, pausing and resuming with it; reduced motion holds at the top; decorative (`aria-hidden`).
- **Under the window:** the flow strip for the active business; the caption, which is `flow.outcome`.

### 3. Flow strip, shared
The chip-and-wire row moves out of FlowPeek.tsx into `components/projects/FlowStrip.tsx` as `FlowStrip({ flow })`. FlowPeek renders it; its behaviour and tests don't change. Showcase renders it for the active flow.

### 4. Facts (replaces Feedback)
A labelled `<section>` with an h2 kicker, tiles in a list, `tabular-nums` big numbers, wraps on phones, doesn't move.

### 5. Removed
Mock.tsx and Feedback.tsx; Cta's placeholder branch (nothing else uses Cta); the `.mock-rise` and `.feedback*` CSS (`kMarquee` stays).

### 6. Westmere's full-length screenshot
Blank below "WE CREATE places to belong". Find the cause in scripts/make-thumbs.mjs, fix it, re-run `npm run thumbs`. Also fixes the Funnels and sites card's hover.

### 7. Tests
Unit: page header and sample note; four tabs in order; each tab's copy, links and caption; every link's file and anchor exist; clock advances and wraps; clicks and keys; reduced motion holds; facts equal independent counts; no `PLACEHOLDER` in data/showcase.ts; FlowPeek's tests still pass. E2E: advance and hover-hold; shot scroll pauses with the clock; reduced motion holds the first business with the shot at the top; no overflow at 320/390; existing screenshot, phone and largest-text sweeps pass.

**Out of scope:** Testimonials placeholders; Ironline.

---

## §1 Findings this plan rests on (checked on 2026-10-02)

- **Westmere's blank half is pinned sections, not reveals.** All 57 `[data-reveal]` elements are visible after the script's scroll-through. The page has two `position: sticky` panels 1440px tall (one viewport) inside parents 4320px and 6912px tall: scroll-driven "pinned" stories. A full-page shot at scroll 0 draws each panel at the top of its parent and leaves the rest of the parent empty. Fix: on the tall page only, before the shot, give each sticky element at least 80% of the viewport tall `position: relative` and its parent `height: auto; min-height: 0`.
- **The tall shots are 432×2304** (0.4× of 1080×5760). Shown in a ~620px window they are upscaled. Shooting them at 0.6× gives 648×3456. The Funnels card and Home fan pass `width={432} height={1540}` to `next/image` and size the image with CSS, so a larger source is safe there.
- **Anchors exist today:** `public/automations.html` has `id="hp-01"`, `"wm-01"`, `"me-01"`, `"mw-01"`; `public/ai-agents.html` has `id="build-<id>"` for every build.
- **Counts today:** flows 6+7+6+5 = 24 steps; builds for the four businesses: helpdesk, billing, sales, leads, docqa, inbox, report = 7; tools = n8n, claude, telegram, gmail, hubspot, make, google-sheets, cal-com, zapier, airtable, supabase, stripe = 12.
- **Cta has one user** (`components/showcase/Flagship.tsx`); `isPlaceholder` has others and stays.
- `.fp-pulse` only animates under `.flow-peek[data-seen] [data-on=true]` (app/globals.css ~357), so the strip needs its own trigger in the Showcase.

## File map

| File | Change | Responsibility |
|---|---|---|
| `data/showcase.ts` | rewrite | copy, `BUSINESSES`, `FACTS`, `TALL` |
| `tests/showcase-data.test.ts` | create | the join, links, anchors, facts, no placeholders |
| `scripts/make-thumbs.mjs` | modify | flatten pinned sections; tall shots at 0.6× |
| `public/samples/thumbs/**` | regenerate | `npm run thumbs` |
| `tests/thumbs.test.ts` | create | tall shots are `TALL` sized |
| `components/projects/FlowStrip.tsx` | create | one flow's main route as chips and wires |
| `components/projects/FlowPeek.tsx` | modify | renders `FlowStrip`; re-exports `PEEK_SLUG` |
| `tests/FlowStrip.test.tsx` | create | strip on its own |
| `components/showcase/Flagship.tsx` | rewrite | tabs, clock, copy panel, window, strip, caption |
| `components/showcase/Cta.tsx` | simplify | always a real link |
| `app/globals.css` | modify | `.flag-shot`, `.flag-strip`; drop `.mock-rise`, `.feedback*` |
| `components/showcase/Facts.tsx` | create | the facts row |
| `app/(site)/showcase/page.tsx` | modify | sample note, Facts in place of Feedback |
| `components/showcase/Mock.tsx`, `Feedback.tsx` | delete | |
| `tests/showcase.test.tsx` | rewrite | page, flagship, facts, Cta |
| `e2e/showcase.spec.ts` | rewrite | clock, shot scroll, reduced motion, phone widths |

---

### Task 1: The businesses and facts data

**Files:**
- Rewrite: `data/showcase.ts`
- Create: `tests/showcase-data.test.ts`
- Temporarily break: `components/showcase/*.tsx`, `tests/showcase.test.tsx` (they import `TABS`, `MOCK`, `FEEDBACK`; Tasks 4–5 replace them). Run only the new test file in this task; `tsc` is checked at the end of Task 5.

**Interfaces:**
- Consumes: `automations`, `PLATFORMS`, `type Flow`, `type Platform` from `data/automations.ts`; `projects.sitesView.sites` (`Site[]`) from `data/projects.ts`; `agents.builds` (`Build[]`) from `data/agents.ts`; `type ToolId` from `lib/brand/tools.ts`.
- Produces:
  - `type Link = { label: string; href: string }`
  - `type Business = { code: string; short: string; name: string; trade: string; line: string; src: string; tall: string; platform: Platform; flow: Flow; builds: Build[]; built: Link[] }`
  - `type Fact = { n: number; label: string }`
  - `showcase = { title, lede, sample, flagship: { tabsLabel, eyebrow, built, open, ms }, facts: { title } }`
  - `BUSINESSES: Business[]`, `FACTS: Fact[]`, `TALL = { width: 648, height: 3456 }`

- [ ] **Step 1: Write the failing test** — `tests/showcase-data.test.ts`

```ts
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agents } from '@/data/agents'
import { automations } from '@/data/automations'
import { BUSINESSES, FACTS, showcase } from '@/data/showcase'

const file = (href: string) => `public${href.split('#')[0]}`

describe('the Showcase businesses', () => {
  it('are the four Automations businesses, in its tab order', () => {
    expect(BUSINESSES.map((b) => b.code)).toEqual(['HP-01', 'WM-01', 'ME-01', 'MW-01'])
    expect(BUSINESSES.map((b) => b.short)).toEqual(['Harbor & Pine', 'Westmere', 'Meridian Energy', 'Meridian Werks'])
    expect(BUSINESSES.map((b) => b.name)).toEqual(['Harbor & Pine Moving Co.', 'Westmere', 'Meridian Energy Infrastructure', 'Meridian Werks'])
    expect(BUSINESSES.map((b) => b.trade)).toEqual(['moving company', 'residential developer', 'commercial solar', 'automotive workshop'])
    expect(BUSINESSES.map((b) => b.platform)).toEqual(['n8n', 'n8n', 'make', 'zapier'])
  })

  it('joins each one’s site, flow and agents from the data that already exists', () => {
    for (const b of BUSINESSES) {
      expect(b.flow).toBe(automations.flows.find((f) => f.code === b.code))
      expect(b.src).toBe(b.flow.href)
      expect(b.builds).toEqual(agents.builds.filter((x) => x.business.name === b.name))
      expect(b.builds.length, b.code).toBeGreaterThan(0)
      expect(b.line.length, b.code).toBeGreaterThan(30)
    }
  })

  it('lists what was built: the site, the flow on its platform, then each agent or bot', () => {
    expect(BUSINESSES[0].built).toEqual([
      { label: 'The site', href: '/samples/harbor-and-pine-moving.html' },
      { label: 'Moving estimate · n8n', href: '/automations.html#hp-01' },
      { label: 'Help-desk RAG bot', href: '/ai-agents.html#build-helpdesk' },
      { label: 'Billing follow-up agent', href: '/ai-agents.html#build-billing' },
    ])
    expect(BUSINESSES[3].built[1]).toEqual({ label: 'Service booking · Zapier', href: '/automations.html#mw-01' })
  })

  it('links only to files that exist, and anchors that exist in them', () => {
    for (const b of BUSINESSES) {
      expect(existsSync(`public${b.tall}`), b.tall).toBe(true)
      for (const { href } of b.built) {
        expect(existsSync(file(href)), href).toBe(true)
        const hash = href.split('#')[1]
        if (hash) expect(readFileSync(file(href), 'utf8'), href).toContain(`id="${hash}"`)
      }
    }
  })
})

describe('the Showcase facts', () => {
  it('count the four builds', () => {
    expect(FACTS).toEqual([
      { n: 4, label: 'sample sites' },
      { n: 4, label: 'live flows' },
      { n: 24, label: 'flow steps' },
      { n: 7, label: 'agents and bots' },
      { n: 12, label: 'tools' },
    ])
  })

  it('agree with the source data counted another way', () => {
    expect(FACTS[2].n).toBe(automations.flows.reduce((n, f) => n + f.nodes.length, 0))
    expect(FACTS[3].n).toBe(agents.builds.filter((b) => b.business.name !== 'Ironline Utility Infrastructure').length)
  })
})

describe('the Showcase copy', () => {
  it('has no placeholder left', () => {
    expect(readFileSync('data/showcase.ts', 'utf8')).not.toMatch(/PLACEHOLDER/)
    expect(showcase.title).toEqual(['Four businesses,', 'built end to end.'])
    expect(showcase.sample).toBe('Sample builds for fictional businesses, not client projects.')
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/showcase-data.test.ts`
Expected: FAIL — `BUSINESSES`/`FACTS` are not exported (undefined `.map`).

- [ ] **Step 3: Rewrite `data/showcase.ts`**

```ts
import { agents, type Build } from './agents'
import { automations, PLATFORMS, type Flow, type Platform } from './automations'
import { projects } from './projects'
import type { ToolId } from '../lib/brand/tools'

/**
 * /showcase: the four sample businesses, each built end to end: its site, the
 * flow behind its form (data/automations.ts) and its agents and bots
 * (data/agents.ts). All but the one line per business is joined from those
 * files and the site list (data/projects.ts), so nothing is typed twice.
 */
export type Link = { label: string; href: string }
export type Business = { code: string; short: string; name: string; trade: string; line: string; src: string; tall: string; platform: Platform; flow: Flow; builds: Build[]; built: Link[] }
export type Fact = { n: number; label: string }

export const showcase = {
  title: ['Four businesses,', 'built end to end.'] as const,
  lede: 'A site, the flow behind its form, and the agents that answer for it, for each of four sample businesses.',
  sample: 'Sample builds for fictional businesses, not client projects.',
  flagship: {
    tabsLabel: 'Sample builds',
    eyebrow: 'SAMPLE BUILD',
    built: 'What I built',
    siteLine: 'The site',
    open: 'Open the site',
    /** How long each business shows; the site shot scrolls top to bottom in the same time. */
    ms: 6000,
  },
  facts: { title: 'What’s in the four builds' },
}

/** The size of every tall site shot (scripts/make-thumbs.mjs, 1080×5760 at 0.6×). */
export const TALL = { width: 648, height: 3456 }

/** The one new line per business, by flow code. */
const LINES: Record<string, string> = {
  'HP-01': 'Professional movers on the Tidewater Coast, quoting homes and offices.',
  'WM-01': 'A residential developer selling a small set of Los Angeles homes.',
  'ME-01': 'A commercial solar company that surveys sites before it installs.',
  'MW-01': 'An automotive workshop that takes its service bookings online.',
}

export const BUSINESSES: Business[] = automations.flows.map((flow) => {
  const site = projects.sitesView.sites.find((s) => s.src === flow.href)!
  const builds = agents.builds.filter((b) => b.business.name === site.name)
  return {
    code: flow.code,
    short: flow.site,
    name: site.name,
    trade: builds[0].business.trade,
    line: LINES[flow.code],
    src: site.src,
    tall: site.tall,
    platform: flow.platform,
    flow,
    builds,
    built: [
      { label: showcase.flagship.siteLine, href: site.src },
      { label: `${flow.title} · ${PLATFORMS[flow.platform].name}`, href: `/automations.html#${flow.code.toLowerCase()}` },
      ...builds.map((b) => ({ label: b.name, href: `/ai-agents.html#build-${b.id}` })),
    ],
  }
})

const tools = new Set<ToolId>(BUSINESSES.flatMap((b) => [PLATFORMS[b.platform].tool, ...b.flow.nodes.flatMap((n) => n.tools), ...b.builds.flatMap((x) => x.tools)]))

export const FACTS: Fact[] = [
  { n: new Set(BUSINESSES.map((b) => b.src)).size, label: 'sample sites' },
  { n: BUSINESSES.length, label: 'live flows' },
  { n: BUSINESSES.reduce((n, b) => n + b.flow.nodes.length, 0), label: 'flow steps' },
  { n: BUSINESSES.reduce((n, b) => n + b.builds.length, 0), label: 'agents and bots' },
  { n: tools.size, label: 'tools' },
]
```

If `projects.sitesView.sites` is not typed `Site[]`, import `type Site` and annotate; do not change `data/projects.ts`.

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run tests/showcase-data.test.ts tests/no-kape.test.ts tests/placeholders.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add data/showcase.ts tests/showcase-data.test.ts
git commit -m "feat: the Showcase data joins the four sample businesses and counts their builds"
```

---

### Task 2: Tall shots without blank halves, at 0.6×

**Files:**
- Modify: `scripts/make-thumbs.mjs`
- Regenerate: `public/samples/thumbs/*.jpeg`, `public/samples/thumbs/tall/*.jpeg`
- Create: `tests/thumbs.test.ts`

**Interfaces:**
- Consumes: `TALL` from `data/showcase.ts`.
- Produces: tall shots 648×3456 with no pinned-section gaps.

- [ ] **Step 1: Write the failing test** — `tests/thumbs.test.ts`

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TALL } from '@/data/showcase'

/** A JPEG's width and height, from its start-of-frame header. */
function size(path: string) {
  const b = readFileSync(path)
  let i = 2
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue }
    const m = b[i + 1]
    if (m >= 0xc0 && m <= 0xc2) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) }
    i += 2 + b.readUInt16BE(i + 2)
  }
  throw new Error(`no frame header in ${path}`)
}

describe('the tall site shots', () => {
  it('are all the size the Showcase window gives next/image', () => {
    for (const f of readdirSync('public/samples/thumbs/tall')) expect(size(`public/samples/thumbs/tall/${f}`), f).toEqual(TALL)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/thumbs.test.ts`
Expected: FAIL — `{ width: 432, height: 2304 }` is not `{ width: 648, height: 3456 }`.

- [ ] **Step 3: Change `scripts/make-thumbs.mjs`**

Change the tall page's scale and its comment:

```js
// The tall shots are shown up to ~620px wide in the Showcase window, so 0.6x (648px).
const tall = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.6, reducedMotion: 'reduce' })
```

Add, after `open()`:

```js
/**
 * A pinned story (a viewport-tall sticky panel in a much taller parent) draws
 * its panel once at the top of the parent in a full-page shot and leaves the
 * rest blank. For the tall shot, unpin each one and let its parent shrink.
 */
async function unpin(p) {
  await p.evaluate(() => {
    for (const el of document.querySelectorAll('*')) {
      const parent = el.parentElement
      if (!parent || getComputedStyle(el).position !== 'sticky' || el.offsetHeight < innerHeight * 0.8) continue
      if (parent.offsetHeight < el.offsetHeight * 1.5) continue
      el.style.position = 'relative'
      parent.style.height = 'auto'
      parent.style.minHeight = '0'
    }
  })
  await p.waitForTimeout(300)
}
```

And in the loop, call it between `open(tall, f)` and the height read:

```js
  await open(tall, f)
  await unpin(tall)
  const height = Math.min(await tall.evaluate(() => document.documentElement.scrollHeight), TALL_MAX)
```

- [ ] **Step 4: Re-shoot and look**

Run: `npm run thumbs`
Expected: `wrote 5 thumbnails to public/samples/thumbs/ and thumbs/tall/`.
Then Read `public/samples/thumbs/tall/westmere-los-angeles.jpeg` and the four others. Expected: content all the way down, no screen-high blank band under "WE CREATE places to belong". If a band remains, use superpowers:systematic-debugging on that page (open it in Playwright at 1080×1440, list sticky/fixed elements and their parents' heights) before changing the rule; ledger what you find.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/thumbs.test.ts tests/Bento.test.tsx tests/SitesCard.test.tsx tests/sites.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/make-thumbs.mjs tests/thumbs.test.ts public/samples/thumbs
git commit -m "fix: tall site shots unpin sticky stories, so Westmere has no blank half, and are sharper"
```

---

### Task 3: A shared flow strip

**Files:**
- Create: `components/projects/FlowStrip.tsx`, `tests/FlowStrip.test.tsx`
- Modify: `components/projects/FlowPeek.tsx`

**Interfaces:**
- Consumes: `mainRoute`, `type Flow`, `type FlowNode` from `data/automations.ts`; `brandIcon` from `data/stack.ts`.
- Produces: `export default function FlowStrip({ flow }: { flow: Flow })` rendering `<div data-flow-strip className="flex items-center">` of `[data-chip]` chips, `.fp-wire` wires with a `.fp-pulse` each, and `[data-step]` numbers for Zapier; `export const PEEK_SLUG` (moved here; `FlowPeek.tsx` re-exports it). Chip size uses `cqw`, so its parent must be an `@container`.

- [ ] **Step 1: Write the failing test** — `tests/FlowStrip.test.tsx`

```tsx
import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import FlowStrip from '@/components/projects/FlowStrip'
import { automations, mainRoute } from '@/data/automations'

const strip = (code: string) => render(<FlowStrip flow={automations.flows.find((f) => f.code === code)!} />).container

describe('FlowStrip', () => {
  it('draws one flow’s main route: a chip per step, a wire between each, a pulse on each wire', () => {
    const f = automations.flows[0]
    const el = strip(f.code)
    expect(el.querySelectorAll('[data-flow-strip] [data-chip]')).toHaveLength(mainRoute(f).length)
    expect(el.querySelectorAll('.fp-wire')).toHaveLength(mainRoute(f).length - 1)
    expect(el.querySelectorAll('.fp-wire .fp-pulse')).toHaveLength(mainRoute(f).length - 1)
  })

  it('numbers a Zap’s steps and draws Make’s wires dotted', () => {
    expect([...strip('MW-01').querySelectorAll('[data-step]')].map((s) => s.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(strip('ME-01').querySelector('.fp-wire')!.className).toContain('border-dotted')
    expect(strip('HP-01').querySelectorAll('[data-step]')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/FlowStrip.test.tsx`
Expected: FAIL — cannot resolve `@/components/projects/FlowStrip`.

- [ ] **Step 3: Create `components/projects/FlowStrip.tsx`, moving `PEEK_SLUG`, `SHAPE` and `Chip` out of FlowPeek unchanged**

```tsx
import { Fragment } from 'react'
import Image from 'next/image'
import { ArrowsSplitIcon, WebhooksLogoIcon } from '@phosphor-icons/react/ssr'
import { mainRoute, type Flow, type FlowNode } from '@/data/automations'
import { brandIcon } from '@/data/stack'
import type { ToolId } from '@/lib/brand/tools'

/** Each tool's logo in public/icons/brands/, for the chips. */
export const PEEK_SLUG: Partial<Record<ToolId, string>> = {
  n8n: 'n8n', claude: 'claude', telegram: 'telegram', gmail: 'gmail', hubspot: 'hubspot',
  'google-sheets': 'googlesheets', 'cal-com': 'caldotcom', airtable: 'airtable', make: 'make', zapier: 'zapier',
}

/** n8n's square nodes, Make's round modules, Zapier's numbered steps. */
const SHAPE = { n8n: 'rounded-[10px]', make: 'rounded-full', zapier: 'rounded-[10px]' } as const

function Chip({ node, flow, n }: { node: FlowNode; flow: Flow; n: number }) {
  const tool = node.tools[0]
  return (
    <span data-chip className={`relative grid size-[clamp(20px,12cqw,36px)] shrink-0 place-items-center bg-logo-chip shadow-(--logo-shadow) ${SHAPE[flow.platform]}`}>
      {tool ? (
        <Image src={brandIcon(PEEK_SLUG[tool]!)} alt="" width={18} height={18} className="block size-1/2" />
      ) : node.kind === 'branch' ? (
        <ArrowsSplitIcon className="size-1/2 text-logo-ink" />
      ) : (
        <WebhooksLogoIcon className="size-1/2 text-logo-ink" />
      )}
      {flow.platform === 'zapier' && (
        <span data-step className="absolute -top-1.5 -left-1.5 grid size-4 place-items-center rounded-full bg-accent font-mono text-[9px] text-on-accent">
          {n}
        </span>
      )}
    </span>
  )
}

/**
 * One flow's main route (the first way out of every step) as logo chips
 * joined by wires, each wire carrying a pulse that its parent switches on
 * (app/globals.css: .flow-peek on the Automations card, .flag-strip on the
 * Showcase). Chips size in cqw, so the parent is an @container. Decorative.
 */
export default function FlowStrip({ flow }: { flow: Flow }) {
  const route = mainRoute(flow).map((id) => flow.nodes.find((n) => n.id === id)!)
  return (
    <div data-flow-strip className="flex items-center">
      {route.map((n, k) => (
        <Fragment key={n.id}>
          {k > 0 && (
            <span className={`fp-wire relative min-w-0.5 flex-1 ${flow.platform === 'make' ? 'border-t-2 border-dotted border-b2' : 'h-px bg-b2'}`}>
              <span className="fp-pulse" style={{ animationDelay: `${k * 0.35}s` }} />
            </span>
          )}
          <Chip node={n} flow={flow} n={k + 1} />
        </Fragment>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Make FlowPeek render it**

In `components/projects/FlowPeek.tsx`: delete `PEEK_SLUG`, `SHAPE` and `Chip`; replace the imports so they read

```tsx
import { useEffect, useRef, useState } from 'react'
import FlowStrip from '@/components/projects/FlowStrip'
import { automations, PLATFORMS } from '@/data/automations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export { PEEK_SLUG } from '@/components/projects/FlowStrip'
```

and replace the `route` line and the `<div className="flex items-center">…</div>` block inside the map with `<FlowStrip flow={f} />`, so each flow renders:

```tsx
          <div key={f.code} data-flow={f.code} data-on={i === shown} className="absolute inset-0 flex flex-col justify-center gap-4 px-4 opacity-0 transition-opacity duration-700 data-[on=true]:opacity-100 motion-reduce:transition-none">
            <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
              <span className="uppercase">{f.site}</span> · {PLATFORMS[f.platform].name}
            </span>
            <FlowStrip flow={f} />
          </div>
```

Leave `PEEK_MS`, the effect and the root `<div>` unchanged.

- [ ] **Step 5: Run the strip and card tests**

Run: `npx vitest run tests/FlowStrip.test.tsx tests/FlowPeek.test.tsx tests/projects.test.tsx`
Expected: PASS, with `tests/FlowPeek.test.tsx` unedited.

- [ ] **Step 6: Commit**

```bash
git add components/projects/FlowStrip.tsx components/projects/FlowPeek.tsx tests/FlowStrip.test.tsx
git commit -m "refactor: the Automations card's chip row becomes a shared FlowStrip"
```

---

### Task 4: The flagship shows a business

**Files:**
- Rewrite: `components/showcase/Flagship.tsx`
- Simplify: `components/showcase/Cta.tsx`
- Modify: `app/globals.css` (Showcase block, ~lines 382–400)
- Rewrite: `tests/showcase.test.tsx` (the `Showcase page` describe is finished in Task 5; write the `Flagship` and `Flagship CTA` describes here)

**Interfaces:**
- Consumes: `BUSINESSES`, `showcase`, `TALL` (Task 1); `FlowStrip`, `PEEK_SLUG` (Task 3); `PLATFORMS`, `mainRoute`; `brandIcon`; `useReducedMotion`.
- Produces: `<Flagship />` with root `[data-flagship]`; tabs `#flag-tab-<code lower>` in a tablist named `Sample builds`; tab panel `#flag-panel` (the copy column); window shot wrapper `.flag-shot[data-run][data-still]` holding one `<img>`; strip wrapper `.flag-strip[data-run]`; caption `#flag-caption`. `Cta({ label, href })`.

- [ ] **Step 1: Write the failing tests** — replace `tests/showcase.test.tsx` with

```tsx
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import Cta from '@/components/showcase/Cta'
import Flagship from '@/components/showcase/Flagship'
import { mainRoute } from '@/data/automations'
import { BUSINESSES } from '@/data/showcase'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const selected = () => screen.getByRole('tab', { selected: true }).textContent
const clock = () => document.querySelector<HTMLElement>('.flag-bar[data-on]')
const shot = () => document.querySelector<HTMLElement>('.flag-shot')!
const strip = () => document.querySelector<HTMLElement>('.flag-strip')!
/**
 * The clock's fill runs out. jsdom has no AnimationEvent, so React listens
 * for the prefixed name there; a browser uses the plain one. React hears
 * exactly one of the two.
 */
const runOut = (el: HTMLElement) =>
  act(() => {
    el.dispatchEvent(new Event('animationend', { bubbles: true }))
    el.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }))
  })

describe('Flagship', () => {
  it('has a tab per business, Harbor & Pine first', () => {
    render(<Flagship />)
    expect(screen.getByRole('tablist', { name: 'Sample builds' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(BUSINESSES.map((b) => b.short))
    expect(selected()).toBe('Harbor & Pine')
  })

  it('shows the business in its panel: trade, name, line, what was built and the site button, all in new tabs', () => {
    render(<Flagship />)
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'flag-tab-hp-01')
    expect(within(panel).getByText('SAMPLE BUILD · MOVING COMPANY')).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { level: 2, name: 'Harbor & Pine Moving Co.' })).toBeInTheDocument()
    expect(within(panel).getByText(BUSINESSES[0].line)).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { level: 3, name: 'What I built' })).toBeInTheDocument()
    const links = within(panel).getAllByRole('link')
    expect(links.map((a) => [a.textContent!.trim(), a.getAttribute('href')])).toEqual([
      ...BUSINESSES[0].built.map((l) => [l.label, l.href]),
      ['Open the site', '/samples/harbor-and-pine-moving.html'],
    ])
    for (const a of links) expect(a).toHaveAttribute('target', '_blank')
  })

  it('shows the business’s site shot under its address, its flow strip and its outcome', () => {
    render(<Flagship />)
    const b = BUSINESSES[0]
    expect(screen.getByText(b.src)).toBeInTheDocument()
    expect(decodeURIComponent(shot().querySelector('img')!.getAttribute('src')!)).toContain(b.tall)
    expect(strip().querySelectorAll('[data-chip]')).toHaveLength(mainRoute(b.flow).length)
    expect(document.getElementById('flag-caption')).toHaveTextContent(b.flow.outcome)
  })

  it('moves to the next business when its clock runs out, and wraps', () => {
    render(<Flagship />)
    runOut(clock()!)
    expect(selected()).toBe('Westmere')
    expect(screen.getByRole('heading', { level: 2, name: 'Westmere' })).toBeInTheDocument()
    for (let i = 0; i < 3; i++) runOut(clock()!)
    expect(selected()).toBe('Harbor & Pine')
  })

  it('switches businesses by click and by the arrow, Home and End keys', () => {
    render(<Flagship />)
    fireEvent.click(screen.getByRole('tab', { name: 'Meridian Energy' }))
    expect(selected()).toBe('Meridian Energy')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Energy' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Meridian Werks')
    expect(screen.getByRole('tab', { name: 'Meridian Werks' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Werks' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Harbor & Pine')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Harbor & Pine' }), { key: 'End' })
    expect(selected()).toBe('Meridian Werks')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Werks' }), { key: 'Home' })
    expect(selected()).toBe('Harbor & Pine')
  })

  it('runs the clock, the shot’s scroll and the strip’s pulse together, and holds all three under the pointer', () => {
    render(<Flagship />)
    const root = document.querySelector('[data-flagship]')!
    for (const el of [clock()!, shot(), strip()]) expect(el).toHaveAttribute('data-run')
    fireEvent.mouseEnter(root)
    for (const el of [clock()!, shot(), strip()]) expect(el).not.toHaveAttribute('data-run')
    fireEvent.mouseLeave(root)
    expect(clock()).toHaveAttribute('data-run')
  })

  it('holds while a “What I built” link has focus, so the panel does not swap under the keyboard', () => {
    render(<Flagship />)
    const link = within(screen.getByRole('tabpanel')).getAllByRole('link')[1]
    fireEvent.focusIn(link)
    expect(clock()).not.toHaveAttribute('data-run')
    fireEvent.focusOut(link, { relatedTarget: document.body })
    expect(clock()).toHaveAttribute('data-run')
  })

  it('never advances with reduced motion: the bar is full and the shot holds at the top', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Flagship />)
    expect(clock()).toBeNull()
    expect(document.querySelectorAll('.flag-bar[data-full]')).toHaveLength(1)
    expect(shot()).toHaveAttribute('data-still')
    expect(shot()).not.toHaveAttribute('data-run')
  })

  it('stops the moment motion is switched off', () => {
    render(<Flagship />)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(clock()).toBeNull()
    expect(shot()).toHaveAttribute('data-still')
  })
})

describe('Flagship CTA', () => {
  it('opens the site in a new tab', () => {
    render(<Cta label="Open the site" href="/samples/meridian-werks.html" />)
    const link = screen.getByRole('link', { name: 'Open the site' })
    expect(link).toHaveAttribute('href', '/samples/meridian-werks.html')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/showcase.test.tsx`
Expected: FAIL — Flagship still imports `TABS` from `data/showcase` (undefined), so render throws.

- [ ] **Step 3: Simplify `components/showcase/Cta.tsx`**

```tsx
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr'

/** The Showcase's main button: opens the business's sample site in a new tab. */
export default function Cta({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]"
    >
      {label} <ArrowSquareOutIcon size={16} aria-hidden />
    </a>
  )
}
```

- [ ] **Step 4: Rewrite `components/showcase/Flagship.tsx`**

Read `node_modules/next/dist/docs/` on `next/image` first (AGENTS.md); keep `width`/`height` from `TALL` and `sizes` as below unless the docs say otherwise.

```tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import FlowStrip, { PEEK_SLUG } from '@/components/projects/FlowStrip'
import { PLATFORMS } from '@/data/automations'
import { BUSINESSES, showcase, TALL } from '@/data/showcase'
import { brandIcon } from '@/data/stack'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import Cta from './Cta'

/**
 * The four sample businesses (data/showcase.ts). The copy column is the tab
 * panel; beside it a browser window scrolls down the business's site while
 * its flow runs underneath.
 *
 * The auto-advance clock is the active progress bar's CSS animation
 * (globals.css .flag-bar). When it ends, the next tab opens. Holding it is
 * just pausing that animation, and the shot's scroll and the strip's pulse
 * pause with it: under the pointer, while anything here has focus, while the
 * block is off screen. With reduced motion there is no clock at all and the
 * shot holds at the top. Switching tabs remounts the bars, so the clock restarts.
 */
export default function Flagship() {
  const f = showcase.flagship
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [inView, setInView] = useState(true)
  const still = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = !still && !hover && !focus && inView
  const b = BUSINESSES[active]
  const n = BUSINESSES.length
  const tabId = (code: string) => `flag-tab-${code.toLowerCase()}`

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div
      ref={root}
      data-flagship
      className="grid gap-x-[clamp(24px,4cqw,64px)] gap-y-7 shell:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] shell:items-center"
      style={{ '--flag-ms': `${f.ms}ms` } as CSSProperties}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <div key={b.code} id="flag-panel" role="tabpanel" aria-labelledby={tabId(b.code)} className="flex animate-rise flex-col items-start gap-4">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">
          {f.eyebrow} · {b.trade.toUpperCase()}
        </span>
        <h2 className="text-[clamp(26px,3.4cqw,44px)] leading-[1.05] font-bold tracking-[-.03em] text-balance">{b.name}</h2>
        <p className="max-w-[46ch] text-[14px] leading-[1.6] text-ink2">{b.line}</p>
        <div className="flex flex-col gap-2.5">
          <h3 className="font-mono text-[10px] tracking-[.16em] text-ink3 uppercase">{f.built}</h3>
          <ul className="flex flex-col gap-1.5">
            {b.built.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink underline decoration-b2 underline-offset-4 transition-colors hover:decoration-accent">
                  {l.label} <ArrowUpRightIcon size={13} aria-hidden className="text-ink3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Cta label={f.open} href={b.src} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div aria-hidden className="overflow-hidden rounded-[14px] border border-b2 bg-s0 shadow-(--shot-shadow)">
          <div className="flex items-center gap-2 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="ml-3 truncate rounded-full border border-b1 bg-s1 px-3.5 py-[5px] font-mono text-[11.5px] text-accent">{b.src}</span>
          </div>
          <div className="@container relative aspect-[16/10] overflow-hidden bg-bg">
            {/* Re-keyed per tab, so the scroll starts again at the top. */}
            <div key={b.code} className="flag-shot" data-run={running || undefined} data-still={still || undefined}>
              <Image src={b.tall} alt="" width={TALL.width} height={TALL.height} sizes="(min-width: 1100px) 640px, 100vw" priority={active === 0} className="block h-auto w-full" />
            </div>
          </div>
        </div>

        <div key={`strip-${b.code}`} aria-hidden className="flag-strip @container flex flex-col gap-3 rounded-[14px] border border-b1 bg-s0 px-4 py-3.5" data-run={running || undefined}>
          <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
            <span className="uppercase">{b.flow.title}</span> · {PLATFORMS[b.platform].name}
          </span>
          <FlowStrip flow={b.flow} />
        </div>

        <div role="tablist" aria-label={f.tabsLabel} className="flex max-w-full gap-1.5 self-start overflow-x-auto rounded-[14px] border border-b1 bg-s1 p-[5px]">
          {BUSINESSES.map((x, i) => {
            const on = i === active
            return (
              <button
                key={x.code}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={tabId(x.code)}
                aria-selected={on}
                aria-controls="flag-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${on ? 'bg-accent text-on-accent' : 'text-ink3 hover:bg-hover hover:text-ink'}`}
              >
                <Image src={brandIcon(PEEK_SLUG[PLATFORMS[x.platform].tool]!)} alt="" width={15} height={15} className="size-[15px] rounded-[3px] bg-logo-chip p-px" />
                {x.short}
              </button>
            )
          })}
        </div>
        <p key={`cap-${b.code}`} id="flag-caption" className="min-h-[3.1em] max-w-[60ch] animate-rise text-[14px] leading-[1.55] text-ink2">
          {b.flow.outcome}
        </p>
        <div key={active} aria-hidden className="flex gap-1.5">
          {BUSINESSES.map((x, i) =>
            i === active && !still ? (
              <span key={x.code} className="flag-bar" data-on data-run={running || undefined} onAnimationEnd={() => setActive((a) => (a + 1) % n)} />
            ) : (
              <span key={x.code} className="flag-bar" data-full={(still && i === active) || undefined} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
```

Note the `onAnimationEnd` sits on the bar only: the shot's and the pulse's animations end on other elements and do not bubble to it (`animationend` bubbles, but the bar's handler is on the bar, not an ancestor of them).

- [ ] **Step 5: CSS — in `app/globals.css`, the Showcase block**

Replace the block's comment and delete the `.mock-rise` line and the five `.feedback`/`.feedback-toggle` lines (the "quotes" comment and the four rules under it). Keep the four `.flag-bar` lines and `@keyframes flagFill`. Add after `@keyframes flagFill`:

```css
/* The window's site shot scrolls top to bottom on the clock (--flag-ms),
   resting a moment at the top, and pauses with it. 62.5cqw is the window's
   height (16:10). With reduced motion, the motion switch or a slow device
   it stays at the top: the motion switch's global .001ms would park it at
   the bottom, so it is named here. The strip's pulses run with the clock. */
.flag-shot img{animation:flagScroll var(--flag-ms,6s) ease-in-out both;animation-play-state:paused}
.flag-shot[data-run] img{animation-play-state:running}
.flag-shot[data-still] img{animation:none}
@keyframes flagScroll{0%,12%{translate:0 0}100%{translate:0 calc(-100% + 62.5cqw)}}
.flag-strip[data-run] .fp-pulse{animation:fpPulse 1.4s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.flag-shot img,.flag-strip *{animation:none !important}}
html[data-a11y-motion=true] .flag-shot img,html[data-a11y-motion=true] .flag-strip *{animation:none !important}
:root[data-perf=low] .flag-shot img,:root[data-perf=low] .flag-strip *{animation:none !important}
```

New block comment (replacing the kape one above `.mock-rise`):

```css
/* ---- Showcase: the four sample businesses ----
   The active progress bar is the auto-advance clock: its fill runs for
   --flag-ms while [data-run] is set, and its end opens the next tab
   (components/showcase/Flagship.tsx). With reduced motion there is no
   clock; the held tab's bar is simply full. */
```

- [ ] **Step 6: Run the tests**

Run: `npx vitest run tests/showcase.test.tsx tests/no-raw-colors.test.ts tests/FlowPeek.test.tsx`
Expected: PASS. If `fireEvent.focusIn` does not reach React's `onFocus`, use `act(() => link.focus())` and `act(() => link.blur())` instead and ledger the swap.

- [ ] **Step 7: Commit**

```bash
git add components/showcase/Flagship.tsx components/showcase/Cta.tsx app/globals.css tests/showcase.test.tsx
git commit -m "feat: the Showcase flagship shows the four sample businesses, their sites scrolling and flows running"
```

---

### Task 5: Facts, the page, and the old pieces gone

**Files:**
- Create: `components/showcase/Facts.tsx`
- Modify: `app/(site)/showcase/page.tsx`
- Delete: `components/showcase/Mock.tsx`, `components/showcase/Feedback.tsx`
- Modify: `tests/showcase.test.tsx` (add the page and facts describes)

**Interfaces:**
- Consumes: `FACTS`, `showcase` (Task 1); `Flagship` (Task 4).
- Produces: `<Facts />`: `<section aria-labelledby="facts-title">` with `h2#facts-title` and a `<ul>` of `FACTS.length` items.

- [ ] **Step 1: Write the failing tests** — add to `tests/showcase.test.tsx` (add the imports `ShowcasePage from '@/app/(site)/showcase/page'` and `Facts from '@/components/showcase/Facts'`, and widen the data import to `import { BUSINESSES, FACTS, showcase } from '@/data/showcase'`)

```tsx
describe('Showcase page', () => {
  it('opens with the crumb, its heading, the sample note, the first business and the facts, and no placeholder', () => {
    render(<ShowcasePage />)
    expect(screen.getByText('SHOWCASE / FLAGSHIP')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: showcase.title.join(' ') })).toBeInTheDocument()
    expect(screen.getByText(showcase.sample)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Harbor & Pine Moving Co.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.facts.title })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/PLACEHOLDER|Client Name/)
  })
})

describe('Facts', () => {
  it('lists each fact as its number and label, under its heading', () => {
    render(<Facts />)
    const section = screen.getByRole('region', { name: showcase.facts.title })
    expect(within(section).getAllByRole('listitem').map((li) => li.textContent)).toEqual(FACTS.map((f) => `${f.n}${f.label}`))
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/showcase.test.tsx`
Expected: FAIL — cannot resolve `@/components/showcase/Facts` (and the page still imports Feedback, which imports `FEEDBACK`).

- [ ] **Step 3: Create `components/showcase/Facts.tsx`**

```tsx
import { FACTS, showcase } from '@/data/showcase'

/** What's in the four builds, counted from the data (data/showcase.ts FACTS). It does not move. */
export default function Facts() {
  return (
    <section aria-labelledby="facts-title" className="flex flex-col gap-4">
      <h2 id="facts-title" className="font-mono text-[10px] tracking-[.16em] text-accent uppercase">
        {showcase.facts.title}
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,128px),1fr))] gap-3">
        {FACTS.map((f) => (
          <li key={f.label} className="flex flex-col gap-1.5 rounded-[16px] border border-b1 bg-linear-to-b from-s2 to-s1 px-5 py-4">
            <span className="text-[clamp(28px,3.4cqw,44px)] leading-none font-bold tracking-[-.03em] tabular-nums">{f.n}</span>
            <span className="text-[13px] text-ink2">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: The page** — `app/(site)/showcase/page.tsx`

```tsx
import Facts from '@/components/showcase/Facts'
import Flagship from '@/components/showcase/Flagship'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { showcase } from '@/data/showcase'
import { notFoundIfHidden } from '@/lib/hidden'
import { ledeOr, pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/showcase', ledeOr(showcase.lede, showcase.title.join(' ')))

export default function Page() {
  notFoundIfHidden('/showcase')
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <div className="flex flex-col gap-3">
        <PageHeader href="/showcase" title={showcase.title} lede={showcase.lede} />
        <p className="max-w-[580px] font-mono text-[11px] tracking-[.06em] text-ink3">{showcase.sample}</p>
      </div>
      <div data-reveal>
        <Frame lit={{ x: '30%', alpha: 0.6, stop: '58%' }} className="flex flex-col gap-[clamp(28px,4cqw,56px)] p-[clamp(14px,2cqw,28px)]">
          <Flagship />
          <Facts />
        </Frame>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Delete the old pieces and check nothing still names them**

```bash
git rm components/showcase/Mock.tsx components/showcase/Feedback.tsx
```

Run: `git grep -n "MOCK\|FEEDBACK\|TABS\|mockStates\|Feedback\|mock-rise\|feedback-toggle" -- app components lib data tests e2e`
Expected: no hits except unrelated words (inspect each; `feedback` in other features is fine).

- [ ] **Step 6: Run the tests and the type check**

Run: `npx vitest run tests/showcase.test.tsx tests/showcase-data.test.ts tests/hide-pages.test.tsx tests/seo.test.ts tests/nav.test.ts && npx tsc --noEmit && npx eslint app components data tests`
Expected: PASS; tsc and eslint clean.

- [ ] **Step 7: Commit**

```bash
git add -A components/showcase app/(site)/showcase/page.tsx tests/showcase.test.tsx
git commit -m "feat: build facts replace the placeholder quotes; the product mock is gone"
```

---

### Task 6: Browser tests

**Files:**
- Rewrite: `e2e/showcase.spec.ts`

**Interfaces:**
- Consumes: the DOM from Tasks 4–5 (`[data-flagship]`, `.flag-shot img`, tablist `Sample builds`).

- [ ] **Step 1: Write the tests** — replace `e2e/showcase.spec.ts`

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

/** How far the site shot has scrolled up inside its window, in px. */
const scrolled = (page: import('@playwright/test').Page) =>
  page.locator('.flag-shot').evaluate((el) => el.getBoundingClientRect().top - el.querySelector('img')!.getBoundingClientRect().top)

test('the flagship moves to the next business on its own, and holds under the pointer with the shot paused', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const tabs = page.getByRole('tablist', { name: 'Sample builds' })
  await expect(tabs.getByRole('tab', { name: 'Harbor & Pine' })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.getByRole('tab', { name: 'Westmere' })).toHaveAttribute('aria-selected', 'true', { timeout: 9000 })
  await tabs.hover()
  await page.waitForTimeout(7000)
  await expect(tabs.getByRole('tab', { name: 'Westmere' })).toHaveAttribute('aria-selected', 'true')
  expect(await page.locator('.flag-shot img').evaluate((el) => el.getAnimations().map((a) => a.playState))).toEqual(['paused'])
})

test('the site shot scrolls down while the clock runs', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  await page.mouse.move(0, 0)
  await page.waitForTimeout(3500)
  expect(await scrolled(page)).toBeGreaterThan(100)
})

test('every “What I built” link opens in a new tab and lands', async ({ page, request }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const hrefs = await page.locator('#flag-panel a').evaluateAll((as) => as.map((a) => [a.getAttribute('href')!, a.getAttribute('target')]))
  expect(hrefs.length).toBe(5)
  for (const [href, target] of hrefs) {
    expect(target).toBe('_blank')
    expect((await request.get(href.split('#')[0])).ok(), href).toBe(true)
  }
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the flagship holds Harbor & Pine with the shot at the top', async ({ page }) => {
    await page.goto('/showcase')
    await hydrated(page)
    await page.waitForTimeout(7000)
    await expect(page.getByRole('tab', { name: 'Harbor & Pine' })).toHaveAttribute('aria-selected', 'true')
    expect(await page.locator('.flag-shot img').evaluate((el) => el.getAnimations().length)).toBe(0)
    expect(await scrolled(page)).toBe(0)
  })
})

for (const width of [320, 390]) {
  test.describe(`a ${width}px phone`, () => {
    test.use({ viewport: { width, height: 800 } })
    test('the page never scrolls sideways; only the tab bar may', async ({ page }) => {
      await page.goto('/showcase')
      await hydrated(page)
      const wide = await page.evaluate(() => {
        const main = document.getElementById('main-content')!
        return [document.documentElement.scrollWidth - innerWidth, main.scrollWidth - main.clientWidth]
      })
      expect(wide).toEqual([0, 0])
      const box = (await page.locator('[data-flagship]').boundingBox())!
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    })
  })
}
```

- [ ] **Step 2: Build and run them**

Run: `npx playwright test e2e/showcase.spec.ts --workers=3`
Expected: 6 passed. (The e2e config builds and serves the production app on port 3100.) If the phone check fails, find the widest descendant (`[...document.querySelectorAll('#main-content *')].filter(e => e.getBoundingClientRect().right > innerWidth)`) and fix that element with `min-w-0` or wrapping; ledger it.

- [ ] **Step 3: Commit**

```bash
git add e2e/showcase.spec.ts
git commit -m "test: Showcase browser tests for the clock, the shot's scroll, links and phone widths"
```

---

### Task 7: Full verification and final review

**Files:** none new. Possibly `public/shots/*` if a Home shot shows Showcase (none does today; confirm with `git grep -n showcase scripts/shoot-*.mjs`).

- [ ] **Step 1: Whole suites**

Run: `npx tsc --noEmit && npx eslint . && npx vitest run`
Expected: clean, all pass.

Run: `npx playwright test --workers=3`
Expected: all pass. A failure in a spec this branch did not touch (e.g. the known-flaky Services centring test) is re-run alone and reported by name with both results.

- [ ] **Step 2: Look at it**

With the dev server on port 3000, screenshot `/showcase` at 1440×900 and 390×844 in both themes (Playwright MCP into `.playwright-mcp/`). Read each. Expected: four tabs with platform logos; the copy column filled; the shot visibly mid-scroll; the strip under it; five fact tiles; nothing clipped; dark and light both legible.

- [ ] **Step 3: Final review**

Run the executing-plans final review (review package, most capable model), with this plan's Review Focus section verbatim and a pointer to the ledger's `Ruling:` lines. Fix Critical/Important in one pass, each RED→GREEN, suite green after.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: final review findings on the Showcase"
```
