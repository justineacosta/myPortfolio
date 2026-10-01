# Automations Flows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Automations card's empty screenshot frames and its screenshot reel with four drawn workflows, one behind each of four sample sites' forms: a cycling mini canvas on the card, and a generated Flows page (`public/automations.html`) it opens.

**Architecture:** The same pipeline as the Build plan and Agents pages. Content lives in `data/automations.ts` (type imports only, so Node runs it). `lib/automations/` renders it into one self-contained HTML file that reuses the Build plan's layout and base CSS, the End-to-End client (balls, node panel, drag-to-pan), and the shared lively layer. A small tabs script switches flows. On the board, `components/projects/FlowPeek.tsx` draws each flow's main route from the same data. The `reel` view becomes `automations`.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before touching Next code, per AGENTS.md), React 19, Tailwind v4, Vitest + jsdom, Playwright, Node's built-in TypeScript runner for `scripts/*.ts`.

**Spec:** Approved in chat on 2026-10-01; copied verbatim in §0 below, so it travels with this plan.

## Global Constraints

- House style: no semicolons, single quotes, long lines. Never run prettier (the repo has no config; it reformats).
- No raw hex colours outside the allowed files (`tests/no-raw-colors.test.ts`). Brand colours live only in `lib/brand/tools.ts` and logo SVGs.
- Data files that a script imports use only `import type` and relative `.ts` paths.
- A node's `tools` are exactly the TOOLS names its `label` or `sub` contains (`tests/brand-data.test.ts` rule), at most two.
- Platforms in tab order: n8n, n8n, Make, Zapier.
- Card cycle: 4.5 s per flow; hover, off screen or a hidden tab holds it; reduced motion or the site's motion switch holds Harbor & Pine with no pulse.
- Copy, verbatim: card body `The flows behind my sample sites’ forms, on n8n, Make and Zapier.`; link `OPEN THE FLOWS`; cue `VIEW THE FLOWS`; page kicker `AUTOMATIONS · FOUR LIVE FLOWS`.
- `#reel` becomes `#automations` everywhere; nothing keeps the old name.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Commit only on the feature branch; push, PR and merge only when the user says so.

## Review Focus

1. **A hidden tab panel still shows.** `section{display:grid}` from the base CSS beats the `hidden` attribute. Expect exactly one flow visible at a time. Pinned by Task 4's e2e "one flow at a time" check and the `.flow[hidden]` CSS test in Task 3.
2. **The node panel stays open on a flow you switched away from.** Expect a tab switch to close it. Pinned in Task 4 (e2e: open a step, switch tab, the dialog is hidden).
3. **A wide flow on a 390px phone pushes the whole page sideways.** Expect only the canvas to pan. Pinned in Task 4 (e2e phone test over all four tabs).
4. **The card's cycle keeps running behind reduced motion or while hovered.** Expect it to hold. Pinned in Task 7 (FlowPeek unit tests).
5. **A diagram that was hidden at load has no pan buttons or edge fades once shown.** The client only measures on load and resize. Expect the pan buttons once the Westmere tab opens on a phone. Pinned in Task 4 (e2e: after switching, `figure.canvas` has `data-overflow` on a 390px screen).

---

## §0 The approved spec (verbatim from chat)

### 1. Goal
The Automations card currently shows two empty screenshot frames. Instead, it will show the real workflows behind four of the sample sites' forms, built across n8n, Make and Zapier. The card gets a small canvas that fades between the four flows. Clicking the card opens a full Flows page where you can explore each flow node by node. No screenshots are needed now or later.

### 2. Content: `data/automations.ts`
This file uses only type imports, the same as `data/buildPlan.ts`, so Node can run it directly.

**Node fields:** `id`, `kind` (trigger, ai, branch, approve, wait or action) and `label`; `sub`: one short line under the label; `tools: ToolId[]`; `what`: what the node does, in plain words; `reads`: the form fields or earlier results it uses; `why`: why the node is there.

**Edges:** `{ from, to, label? }`.

**Flow fields:** `code`, `site`, `href` (the sample page), `platform: 'n8n' | 'make' | 'zapier'`, `outcome` (one line), `nodes` and `edges`.

| Code · site · platform | Nodes (→ = connector, `label` = branch) |
|---|---|
| **HP-01 · Harbor & Pine · n8n**, Moving estimate | Webhook *Estimate form* → Claude *Price the move* → Telegram *Approve?*. `Approve` → Gmail *Send the estimate* → HubSpot *Record the deal*. `Edit` → Telegram *Coordinator adjusts* → Gmail. |
| **WM-01 · Westmere · n8n**, Residence enquiry | Webhook *Enquiry form* → Claude *Qualify the buyer* → IF *Ready to view?*. `Yes` → HubSpot *Add the contact* → Telegram *Alert the agent* → Gmail *Send the brochure*. `Not yet` → HubSpot *Nurture list* → Gmail. |
| **ME-01 · Meridian Energy · Make**, Site survey | Webhook *Survey wizard* → Claude *Score the site* → Google Sheets *Log the site* → Router. `Strong fit` → Gmail + Cal.com *Book the survey*. `Not yet` → Gmail *Send the savings guide*. |
| **MW-01 · Meridian Werks · Zapier**, Service booking | Webhooks by Zapier *Booking form* → Cal.com *Hold the slot* → Airtable *Open a job card* → Telegram *Tell the workshop* → Gmail *Confirm with the owner*. |

None of the flows loop back on themselves, so the existing layout code can place them. HubSpot, Airtable, Make and Zapier will be added to `lib/brand/tools.ts` and the page's logo set.

### 3. The page: `public/automations.html`
- **How it's built:** `lib/automations/render.ts` and `lib/automations/styles.ts` turn the data into the page; `scripts/make-automations.ts` writes it; `scripts/shoot-automations.mjs` takes the screenshot; both run with `npm run automations-page`.
- **What it reuses:** the page theme, the lively layer (logos, glow and moving balls), the contour backdrop, the theme script, and Build plan's `layout()`. Also Build plan's ball runner, drag-to-pan with ← → buttons, and edge fades.
- **Layout from top to bottom:** (1) hero: kicker *AUTOMATIONS · FOUR LIVE FLOWS*, a heading, a short intro and a strip of the tools used; (2) a tab list with four tabs, each with the site name and platform badge; Arrow, Home and End keys move between tabs, and each tab has a `#hp-01`-style link; (3) one panel per tab: the outcome line and a *See the site ↗* link (new tab), the canvas, a step list for screen readers; (4) a footer link back to the portfolio.
- **Platform styles:** n8n: rounded-square nodes and curved wires. Make: round modules with dotted links, the Router drawn as a hub. Zapier: the same layout turned 90° by a pure `transpose(layout)` function, reading top to bottom as numbered step cards.
- **Node panel:** clicking a node opens a side panel with *What it does*, *What it reads* and *Why it's here*. Escape or a close button shuts it, and focus returns to the node.
- **Motion:** balls run along each route; nodes light up as a ball passes. With reduced motion, or the site's motion setting off, nothing moves.
- **Themes and phones:** light and dark follow the site. At 390px wide, n8n and Make flows pan sideways inside their canvas and the page never scrolls sideways. Zapier needs no panning.

### 4. The card: `components/projects/FlowPeek.tsx`
- Replaces the two `Shot` frames; `aria-hidden`, because the card link already carries the title and text.
- A header line such as *HARBOR & PINE · n8n*, then that flow's main route (first branch every time) in a row. Each node is a small chip with its brand logo, shaped per platform: square for n8n, round for Make, a numbered pill for Zapier. The Webhook node uses the webhook icon.
- Moves to the next flow every 4.5 s with a cross-fade, while a green pulse runs along the wires. Hovering the card holds it, as do the card being off screen or the tab hidden. Reduced motion or the site's motion setting: stays on Harbor & Pine with no pulse.
- Copy: body *"The flows behind my sample sites' forms, on n8n, Make and Zapier."*; link *OPEN THE FLOWS*; hover label *VIEW THE FLOWS*.

### 5. Site wiring
- `reel` view becomes `automations`: `PROJECT_VIEWS`, the Board link (`#automations`), the ⌘K entry and `ProjectViews`. A new `AutomationsView` (window plus iframe, like `PlanView`) opens the page.
- Removed: `ReelView.tsx`, `projects.reel`, `REEL`, `peek` and `peekHint`, the `.reel*` CSS in `globals.css`, and the reel tests. `kMarquee` stays if anything else uses it (it does: `--animate-marquee`).
- `/automations.html` is added to `STATIC_PAGES` in `lib/seo.ts`. The Automations entry in `BUILDS` gets `shot: '/shots/automations.jpeg'`.

### 6. Testing (each test written first)
Data, layout (`transpose`), render (tabs, panels, step lists, site links, no outside links), FlowPeek (decorative, starts on Harbor & Pine, cycles with fake timers, holds on hover and under reduced motion, logo files exist), wiring (`#automations`, ⌘K, Home shot), and a new `e2e/automations.spec.ts` (tabs by click and keys, node panel, both themes, 390px with no sideways page scroll, the card opening the window). The reel cases in `projects.spec.ts` are replaced.

### 7. Out of scope
Ironline's flow (a fifth data entry later). Working n8n or Make exports and real form endpoints; the sample forms stay mocked.

**Additions made while planning (same precedent as the Agents page):** a one-line sample note under the lede, *"Sample flows for the fictional businesses used across this portfolio, not client projects."*, because the Agents page carries the same note and the sites are fictional.

---

## File map

| File | Responsibility |
|---|---|
| `lib/brand/logos/{hubspot,airtable,make,zapier}.svg` (new) | Full-colour logos for the page's logo sheet |
| `lib/brand/logos/CREDITS.md` | Credits the four new files |
| `lib/brand/tools.ts` | Adds four `ToolId`s and their `TOOLS` rows |
| `data/automations.ts` (new) | The page copy, the four flows, `PLATFORMS`, `KIND_LABELS`, `mainRoute()` |
| `lib/buildPlan/layout.ts` | `layout()` accepts any `{ id }[]` nodes (type widening only) |
| `lib/automations/layout.ts` (new) | `transpose()`, `layoutFlow()` |
| `lib/automations/styles.ts` (new) | Page CSS: base + tabs + Make and Zapier looks |
| `lib/automations/render.ts` (new) | `renderAutomations()` → the whole HTML page |
| `lib/automations/tabs.js` (new) | Tab switching, keys, `#code` addresses, closes the panel |
| `scripts/make-automations.ts`, `scripts/shoot-automations.mjs` (new) | Write the page; photograph it for Home |
| `public/automations.html`, `public/shots/automations.jpeg` (generated) | The page and its Home shot |
| `data/projects.ts` | `automations` view and card copy; reel data removed; `BUILDS` shot |
| `components/projects/AutomationsView.tsx` (new) | Window + iframe |
| `components/projects/ProjectViews.tsx`, `Board.tsx`, `lib/commands.ts`, `lib/seo.ts`, `app/globals.css` | Wiring, reel removal, FlowPeek CSS |
| `components/projects/FlowPeek.tsx` (new) | The card's cycling mini canvas |
| `components/projects/ReelView.tsx`, `tests/project-stage.test.tsx` (deleted) | The reel and its tests |
| Tests: `tests/automations-data.test.ts`, `tests/automations-layout.test.ts`, `tests/automations-render.test.ts`, `tests/FlowPeek.test.tsx`, `e2e/automations.spec.ts` (new); `tests/brand.test.ts`, `tests/projects.test.tsx`, `tests/commands.test.ts`, `tests/CommandPalette.focus.test.tsx`, `tests/seo.test.ts`, `tests/no-ghl.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts` (edited) | |

Setup before Task 1: `git checkout -b feat/automations-flows` from an up-to-date `main`.

---

### Task 1: Four new tool logos

**Files:**
- Create: `lib/brand/logos/hubspot.svg`, `airtable.svg`, `make.svg`, `zapier.svg`
- Modify: `lib/brand/tools.ts`, `lib/brand/logos/CREDITS.md`
- Test: `tests/brand.test.ts`

**Interfaces:**
- Produces: `ToolId` gains `'hubspot' | 'airtable' | 'make' | 'zapier'`; `TOOLS.hubspot = { name: 'HubSpot', brand: '#FF7A59' }`, `TOOLS.airtable = { name: 'Airtable', brand: '#18BFFF' }`, `TOOLS.make = { name: 'Make', brand: '#6D00CC' }`, `TOOLS.zapier = { name: 'Zapier', brand: '#FF4F00' }`.

- [ ] **Step 1: Write the failing test.** Add to the first `describe` in `tests/brand.test.ts`:

```ts
  it('knows the tools the Automations flows run on', () => {
    expect(IDS).toEqual(expect.arrayContaining(['hubspot', 'airtable', 'make', 'zapier']))
    expect(['hubspot', 'airtable', 'make', 'zapier'].map((id) => TOOLS[id as ToolId].name)).toEqual(['HubSpot', 'Airtable', 'Make', 'Zapier'])
  })
```

- [ ] **Step 2: Run it.** `npx vitest run tests/brand.test.ts` → Expected: FAIL (`expected [...] to contain hubspot`).

- [ ] **Step 3: Make the logo files** from the Simple Icons copies already in `public/icons/brands/` (they carry the brand fill). Run once:

```bash
node -e "const fs=require('fs');for(const [id,si] of [['hubspot','hubspot'],['airtable','airtable'],['make','make'],['zapier','zapier']]){const s=fs.readFileSync('public/icons/brands/'+si+'.svg','utf8');const fill=/fill=\"(#[0-9A-Fa-f]{6})\"/.exec(s)[1];const d=/<path d=\"([^\"]+)\"/.exec(s)[1];fs.writeFileSync('lib/brand/logos/'+id+'.svg','<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"'+fill+'\" d=\"'+d+'\"/></svg>\n')}"
```

Open each file: one `<svg>` with `viewBox="0 0 24 24"` and one filled `<path>`, the same shape as `lib/brand/logos/stripe.svg`.

- [ ] **Step 4: Register them.** In `lib/brand/tools.ts` extend the union and the record:

```ts
export type ToolId =
  | 'n8n' | 'supabase' | 'gmail' | 'google-sheets' | 'telegram' | 'stripe' | 'claude' | 'cal-com'
  | 'claude-code' | 'vs-code' | 'codex' | 'github' | 'vercel'
  | 'hubspot' | 'airtable' | 'make' | 'zapier'
```

```ts
  vercel: { name: 'Vercel', brand: '#8B949E', mono: true },
  hubspot: { name: 'HubSpot', brand: '#FF7A59' },
  airtable: { name: 'Airtable', brand: '#18BFFF' },
  make: { name: 'Make', brand: '#6D00CC' },
  zapier: { name: 'Zapier', brand: '#FF4F00' },
}
```

Update the doc comment's "three standalone pages" to "standalone pages". Append to the `CREDITS.md` table:

```md
| `hubspot.svg` | Simple Icons 16.33.0 `hubspot`, filled #FF7A59 | CC0 1.0 |
| `airtable.svg` | Simple Icons 16.33.0 `airtable`, filled #18BFFF | CC0 1.0 |
| `make.svg` | Simple Icons 16.33.0 `make`, filled #6D00CC | CC0 1.0 |
| `zapier.svg` | Simple Icons 16.33.0 `zapier`, filled #FF4F00 | CC0 1.0 |
```

- [ ] **Step 5: Run the brand tests.** `npx vitest run tests/brand.test.ts tests/brand-data.test.ts tests/brand-lively.test.ts tests/no-raw-colors.test.ts` → Expected: PASS (the sheet stays under 30 KB; if not, see the test's message and report it as a ruling).

- [ ] **Step 6: Commit.**

```bash
git add lib/brand tests/brand.test.ts
git commit -m "feat: HubSpot, Airtable, Make and Zapier logos for the standalone pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The four flows (`data/automations.ts`)

**Files:**
- Create: `data/automations.ts`
- Test: `tests/automations-data.test.ts`

**Interfaces:**
- Consumes: `ToolId` (Task 1).
- Produces:
  - `type Platform = 'n8n' | 'make' | 'zapier'`
  - `type FlowKind = 'trigger' | 'ai' | 'branch' | 'approve' | 'wait' | 'action'`
  - `type FlowNode = { id: string; kind: FlowKind; label: string; sub: string; icon: string; tools: ToolId[]; what: string; reads: string[]; why: string }`
  - `type FlowEdge = { from: string; to: string; label?: string }`
  - `type Flow = { code: string; title: string; site: string; href: string; platform: Platform; outcome: string; nodes: FlowNode[]; edges: FlowEdge[] }`
  - `type Automations` (copy fields below plus `flows: Flow[]`)
  - `const automations: Automations`, `const PLATFORMS: Record<Platform, { name: string; tool: ToolId }>`, `const KIND_LABELS: Record<FlowKind, string>`, `function mainRoute(f: Flow): string[]`

- [ ] **Step 1: Write the failing test** `tests/automations-data.test.ts`:

```ts
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { automations as a, mainRoute, PLATFORMS } from '@/data/automations'
import { projects } from '@/data/projects'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

/** The tools a line names. A longer name wins, so “Claude Code” is not also “Claude”. */
function named(text: string): ToolId[] {
  let rest = text
  const found: ToolId[] = []
  for (const id of (Object.keys(TOOLS) as ToolId[]).sort((x, y) => TOOLS[y].name.length - TOOLS[x].name.length)) {
    if (!rest.includes(TOOLS[id].name)) continue
    found.push(id)
    rest = rest.split(TOOLS[id].name).join(' ')
  }
  return found.sort()
}

describe('the Automations flows', () => {
  it('has four flows, in tab order, on n8n, n8n, Make and Zapier', () => {
    expect(a.flows.map((f) => f.code)).toEqual(['HP-01', 'WM-01', 'ME-01', 'MW-01'])
    expect(a.flows.map((f) => f.platform)).toEqual(['n8n', 'n8n', 'make', 'zapier'])
    expect(a.flows.map((f) => f.site)).toEqual(['Harbor & Pine', 'Westmere', 'Meridian Energy', 'Meridian Werks'])
    expect(Object.values(PLATFORMS).map((p) => p.name)).toEqual(['n8n', 'Make', 'Zapier'])
  })

  it('links each flow to its sample site, which is on disk and in the carousel', () => {
    const sites = projects.sitesView.sites.map((s) => s.src)
    for (const f of a.flows) {
      expect(existsSync(`public${f.href}`), f.href).toBe(true)
      expect(sites, f.href).toContain(f.href)
    }
  })

  it('names every node once and every connector between real nodes, with no loops', () => {
    const ids = a.flows.flatMap((f) => f.nodes.map((n) => n.id))
    expect(new Set(ids).size).toBe(ids.length)
    for (const f of a.flows) {
      const own = new Set(f.nodes.map((n) => n.id))
      for (const e of f.edges) {
        expect(own.has(e.from), `${f.code} ${e.from}`).toBe(true)
        expect(own.has(e.to), `${f.code} ${e.to}`).toBe(true)
      }
    }
  })

  it('explains every step: what it does, what it reads and why it is there', () => {
    for (const n of a.flows.flatMap((f) => f.nodes)) {
      expect(n.what.length, n.id).toBeGreaterThan(20)
      expect(n.why.length, n.id).toBeGreaterThan(20)
      expect(n.reads.length, n.id).toBeGreaterThan(0)
    }
  })

  it('shows exactly the tools a step names, at most two', () => {
    for (const n of a.flows.flatMap((f) => f.nodes)) {
      expect([...n.tools].sort(), n.id).toEqual(named(`${n.label} ${n.sub}`))
      expect(n.tools.length, n.id).toBeLessThanOrEqual(2)
    }
  })

  it('follows the first way out of every step for the card’s main route', () => {
    expect(a.flows.map((f) => mainRoute(f))).toEqual([
      ['hp-form', 'hp-price', 'hp-approve', 'hp-send', 'hp-deal'],
      ['wm-form', 'wm-qualify', 'wm-ready', 'wm-contact', 'wm-alert', 'wm-brochure'],
      ['me-form', 'me-score', 'me-log', 'me-router', 'me-book'],
      ['mw-form', 'mw-slot', 'mw-card', 'mw-workshop', 'mw-confirm'],
    ])
  })

  it('labels every branch it takes', () => {
    for (const f of a.flows)
      for (const n of f.nodes.filter((x) => f.edges.filter((e) => e.from === x.id).length > 1))
        for (const e of f.edges.filter((x) => x.from === n.id)) expect(e.label, `${f.code} ${e.from} → ${e.to}`).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run it.** `npx vitest run tests/automations-data.test.ts` → Expected: FAIL (`Cannot find module '@/data/automations'`).

- [ ] **Step 3: Write `data/automations.ts`:**

```ts
/**
 * The flows behind the Automations card (docs/superpowers/plans/2026-10-01-automations-flows.md §0):
 * what runs after someone sends the form on four of the sample sites in
 * public/samples/. scripts/make-automations.ts renders it into
 * public/automations.html, and components/projects/FlowPeek.tsx draws each
 * flow's main route on the card. Only type imports, so Node can run it directly.
 */
import type { ToolId } from '../lib/brand/tools.ts'

export type Platform = 'n8n' | 'make' | 'zapier'
export type FlowKind = 'trigger' | 'ai' | 'branch' | 'approve' | 'wait' | 'action'
/** A step: `what` it does, what it `reads` from the form or earlier steps, and `why` it is there. `icon` is a Phosphor name without "Icon". */
export type FlowNode = { id: string; kind: FlowKind; label: string; sub: string; icon: string; tools: ToolId[]; what: string; reads: string[]; why: string }
export type FlowEdge = { from: string; to: string; label?: string }
export type Flow = { code: string; title: string; site: string; href: string; platform: Platform; outcome: string; nodes: FlowNode[]; edges: FlowEdge[] }
export type Automations = {
  title: string
  description: string
  /** The link back to the portfolio, shown when the page is opened on its own. */
  home: string
  kicker: string
  heading: string
  lede: string
  sample: string
  tabsLabel: string
  seeSite: string
  panel: { reads: string; why: string; close: string }
  flows: Flow[]
  footer: { note: string; by: string }
}

/** Each platform's name and logo, for the tabs, the card and the hero strip. */
export const PLATFORMS: Record<Platform, { name: string; tool: ToolId }> = {
  n8n: { name: 'n8n', tool: 'n8n' },
  make: { name: 'Make', tool: 'make' },
  zapier: { name: 'Zapier', tool: 'zapier' },
}

/** What each kind of step means, for the panel's kind line and the screen-reader step lists. */
export const KIND_LABELS: Record<FlowKind, string> = {
  trigger: 'Starts it',
  ai: 'Claude',
  branch: 'Decides',
  approve: 'A person approves',
  wait: 'Waits for a reply',
  action: 'Step',
}

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

/** A flow's main route: from its start, always the first way out, to an end. The card draws this one. */
export function mainRoute(f: Flow): string[] {
  const entered = new Set(f.edges.map((e) => e.to))
  const route = [f.nodes.find((n) => !entered.has(n.id))!.id]
  for (let next = f.edges.find((e) => e.from === route[0]); next; next = f.edges.find((e) => e.from === route[route.length - 1])) route.push(next.to)
  return route
}

export const automations: Automations = {
  title: 'Automations · Justine Acosta',
  description: 'The flows behind four sample sites’ forms, on n8n, Make and Zapier: what runs, in what order, and where a person steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATIONS · FOUR LIVE FLOWS',
  heading: 'What happens after someone hits send',
  lede: 'Each sample site ends on a form. These are the flows behind four of them. Pick a site, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for the fictional businesses used across this portfolio, not client projects.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'HP-01',
      title: 'Moving estimate',
      site: 'Harbor & Pine',
      href: '/samples/harbor-and-pine-moving.html',
      platform: 'n8n',
      outcome: 'Every estimate request gets a priced reply the same day, and nothing goes out until a coordinator says yes.',
      nodes: [
        node('hp-form', 'trigger', 'Estimate form', 'Webhook', 'WebhooksLogo', [], 'Catches the estimate form the moment someone sends it.', ['Moving from', 'Moving to', 'Target moving date', 'Home or office size', 'Service', 'Name, email and phone'], 'One webhook per form means one place to look when a request goes missing.'),
        node('hp-price', 'ai', 'Price the move', 'Claude', 'Sparkle', ['claude'], 'Claude drafts a price from the size of the home, the distance and the service, using the company’s rate card.', ['Home or office size', 'Moving from and to', 'Service', 'The rate card'], 'A first draft in seconds, so the coordinator checks a number instead of building one.'),
        node('hp-approve', 'approve', 'Approve?', 'Telegram', 'UserCheck', ['telegram'], 'Sends the coordinator the request and Claude’s price, with Approve and Edit buttons.', ['Claude’s price', 'The request'], 'No price reaches a customer without a person agreeing to it.'),
        node('hp-adjust', 'wait', 'Coordinator adjusts', 'Telegram reply', 'PencilSimple', ['telegram'], 'Waits for the coordinator to reply with the corrected price.', ['The coordinator’s reply'], 'Edits happen in the same chat, so nobody opens another tool.'),
        node('hp-send', 'action', 'Send the estimate', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the customer their estimate, with what it covers and how to book.', ['The approved price', 'Name and email', 'Target moving date'], 'The customer hears back while they are still comparing movers.'),
        node('hp-deal', 'action', 'Record the deal', 'HubSpot', 'Handshake', ['hubspot'], 'Creates the deal in HubSpot with the price, the date and the contact.', ['The approved price', 'Name, email and phone', 'Target moving date'], 'Every estimate is on the sales board, so none is forgotten.'),
      ],
      edges: [edge('hp-form', 'hp-price'), edge('hp-price', 'hp-approve'), edge('hp-approve', 'hp-send', 'Approve'), edge('hp-approve', 'hp-adjust', 'Edit'), edge('hp-adjust', 'hp-send'), edge('hp-send', 'hp-deal')],
    },
    {
      code: 'WM-01',
      title: 'Residence enquiry',
      site: 'Westmere',
      href: '/samples/westmere-los-angeles.html',
      platform: 'n8n',
      outcome: 'Serious buyers reach an agent within minutes; everyone else still gets the brochure and stays on the list.',
      nodes: [
        node('wm-form', 'trigger', 'Enquiry form', 'Webhook', 'WebhooksLogo', [], 'Catches an enquiry sent from a residence’s page.', ['The residence', 'Name and email', 'Their message'], 'Each enquiry carries the residence it came from, so the agent knows which home it is about.'),
        node('wm-qualify', 'ai', 'Qualify the buyer', 'Claude', 'Sparkle', ['claude'], 'Claude reads the message and judges whether they are ready to view: a budget, a timeline or a request to visit.', ['Their message', 'The residence'], 'Agents spend their time on the people ready to see a home.'),
        node('wm-ready', 'branch', 'Ready to view?', 'IF', 'ArrowsSplit', [], 'Sends ready buyers one way and everyone else the other.', ['Claude’s judgement'], 'Two clear paths, so no enquiry falls between them.'),
        node('wm-contact', 'action', 'Add the contact', 'HubSpot', 'UserPlus', ['hubspot'], 'Adds the buyer to HubSpot, linked to the residence.', ['Name and email', 'The residence'], 'The agent opens one record with everything in it.'),
        node('wm-alert', 'action', 'Alert the agent', 'Telegram', 'Bell', ['telegram'], 'Messages the listing agent with the buyer and what they asked.', ['Name', 'Their message', 'The residence'], 'A ready buyer hears from a person within minutes, not days.'),
        node('wm-nurture', 'action', 'Nurture list', 'HubSpot', 'ListChecks', ['hubspot'], 'Adds the enquiry to a slower list that hears about new residences as they launch.', ['Name and email', 'The residence'], 'Not ready today often means ready in six months.'),
        node('wm-brochure', 'action', 'Send the brochure', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the residence’s brochure and floor plans.', ['Name and email', 'The residence'], 'Everyone who asks gets something useful straight away.'),
      ],
      edges: [edge('wm-form', 'wm-qualify'), edge('wm-qualify', 'wm-ready'), edge('wm-ready', 'wm-contact', 'Yes'), edge('wm-contact', 'wm-alert'), edge('wm-alert', 'wm-brochure'), edge('wm-ready', 'wm-nurture', 'Not yet'), edge('wm-nurture', 'wm-brochure')],
    },
    {
      code: 'ME-01',
      title: 'Site survey',
      site: 'Meridian Energy',
      href: '/samples/meridian-energy-infrastructure.html',
      platform: 'make',
      outcome: 'Strong sites get a survey on the calendar; the rest get a useful guide instead of silence.',
      nodes: [
        node('me-form', 'trigger', 'Survey wizard', 'Webhook', 'WebhooksLogo', [], 'Catches the four answers from the site survey wizard, and who sent them.', ['Kind of facility', 'Area and energy spend', 'Where the site is', 'How they want to own it', 'Name and email'], 'The wizard asks only what the score needs.'),
        node('me-score', 'ai', 'Score the site', 'Claude', 'Sparkle', ['claude'], 'Claude scores the site from 1 to 10 on its area, energy spend and location, and writes one line on why.', ['Kind of facility', 'Area and energy spend', 'Where the site is'], 'The same yardstick for every site, with a reason a person can check.'),
        node('me-log', 'action', 'Log the site', 'Google Sheets', 'Table', ['google-sheets'], 'Adds a row to the pipeline sheet: the answers, the score and the reason.', ['The four answers', 'The score and reason'], 'Every site is logged before the flow decides anything.'),
        node('me-router', 'branch', 'Router', 'Strong fit?', 'ArrowsSplit', [], 'Sends sites scoring 7 or more to booking, and the rest to the guide.', ['The score'], 'Make’s router keeps both paths visible on one canvas.'),
        node('me-book', 'action', 'Book the survey', 'Gmail + Cal.com', 'CalendarCheck', ['gmail', 'cal-com'], 'Emails a Cal.com link to book a site survey with an engineer.', ['Name and email', 'The score and reason'], 'A strong site should be one click from a survey.'),
        node('me-guide', 'action', 'Send the savings guide', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a short guide to what the site could save, and when it is worth another look.', ['Name and email', 'Kind of facility'], 'A weak fit today still leaves with something useful.'),
      ],
      edges: [edge('me-form', 'me-score'), edge('me-score', 'me-log'), edge('me-log', 'me-router'), edge('me-router', 'me-book', 'Strong fit'), edge('me-router', 'me-guide', 'Not yet')],
    },
    {
      code: 'MW-01',
      title: 'Service booking',
      site: 'Meridian Werks',
      href: '/samples/meridian-werks.html',
      platform: 'zapier',
      outcome: 'The slot is held, the job card is open and the workshop knows before the owner closes the page.',
      nodes: [
        node('mw-form', 'trigger', 'Booking form', 'Webhooks by Zapier', 'WebhooksLogo', ['zapier'], 'Catches the booking: the vehicle, what it needs, the slot and the owner’s details.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'Zapier’s webhook trigger starts the Zap the moment the form is sent.'),
        node('mw-slot', 'action', 'Hold the slot', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Books the chosen slot on the workshop calendar.', ['Chosen slot', 'The vehicle'], 'Two owners can never get the same slot.'),
        node('mw-card', 'action', 'Open a job card', 'Airtable', 'Table', ['airtable'], 'Creates the job card: the vehicle, the work asked for, the slot and the owner.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'The technicians work from the card, not from an email.'),
        node('mw-workshop', 'action', 'Tell the workshop', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Posts the new booking to the workshop’s group chat.', ['The job card'], 'The team sees tomorrow’s work as it is booked.'),
        node('mw-confirm', 'action', 'Confirm with the owner', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner the slot, the address and what to bring.', ['Chosen slot', 'Owner’s details'], 'A clear confirmation stops the “is this booked?” call.'),
      ],
      edges: [edge('mw-form', 'mw-slot'), edge('mw-slot', 'mw-card'), edge('mw-card', 'mw-workshop'), edge('mw-workshop', 'mw-confirm')],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them.', by: 'Built by Justine Acosta' },
}
```

- [ ] **Step 4: Run it.** `npx vitest run tests/automations-data.test.ts tests/no-kape.test.ts` → Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add data/automations.ts tests/automations-data.test.ts
git commit -m "feat: the four flows behind the sample sites' forms

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Layout and the page render

**Files:**
- Modify: `lib/buildPlan/layout.ts:43` (type only)
- Create: `lib/automations/layout.ts`, `lib/automations/styles.ts`, `lib/automations/render.ts`, `lib/automations/tabs.js` (empty-shell IIFE for now, filled in Task 4)
- Test: `tests/automations-layout.test.ts`, `tests/automations-render.test.ts`

**Interfaces:**
- Consumes: `automations`, `Flow`, `PLATFORMS`, `KIND_LABELS` (Task 2); `layout`, `GEOM`, `Layout` from `lib/buildPlan/layout.ts`; `esc` from `lib/buildPlan/render.ts`; `pageCss`, `Themes` from `lib/buildPlan/styles.ts`; `iconSvg(name, size?)` from `lib/endToEnd/icons.ts`; brand helpers from `lib/brand/render.ts`; `livelyCss` from `lib/brand/lively.ts`.
- Produces: `transpose(l: Layout, side?: number): Layout`, `layoutFlow(f: Flow): Layout`, `SIDE = 240`; `automationsCss(themes: Themes): string`; `renderAutomations(g?: Automations, themes?: Themes): string`; `PAGE_PATH = '/automations.html'`. Page contract other tasks rely on: tabs are `button[role=tab]#tab-<code lower>` with `aria-controls="<code lower>"`; panels are `section.flow[role=tabpanel]#<code lower>`; canvases are `figure.canvas.p-<platform>[data-run]`; nodes are `button.node[data-node="<code lower>:<node id>"]`; the panel data is `script#graph-nodes`; the panel is `#node-panel`.

- [ ] **Step 1: Widen `layout()`'s node type.** In `lib/buildPlan/layout.ts` change the signature (behaviour unchanged; it only reads `id`):

```ts
export function layout({ nodes, edges }: { nodes: { id: string }[]; edges: PlanEdge[] }): Layout {
```

and drop `PlanNode` from its import if now unused. Run `npx vitest run tests/buildPlan-layout.test.ts` → Expected: PASS.

- [ ] **Step 2: Write the failing layout test** `tests/automations-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { automations } from '@/data/automations'
import { layout } from '@/lib/buildPlan/layout'
import { layoutFlow, SIDE, transpose } from '@/lib/automations/layout'

const pair = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ from: 'a', to: 'b' }] }

describe('transpose', () => {
  it('turns a left-to-right canvas top to bottom: x and y swap, in nodes, wires, labels and ball lines', () => {
    const l = layout(pair)
    const t = transpose(l)
    expect(l.edges[0].d).toBe('M104 56C154 56 154 56 204 56')
    expect(t.edges[0].d).toBe('M56 104C56 154 56 154 56 204')
    expect(t.nodes.a).toMatchObject({ x: 28, y: 48 })
    expect(t.nodes.b).toMatchObject({ x: 28, y: 204 })
    expect(t.edges[0].mid).toEqual([l.edges[0].mid[1], l.edges[0].mid[0]])
    expect(t.routes[0].run).toBe(l.routes[0].run.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, '$2 $1'))
    expect(t.routes[0].length).toBe(l.routes[0].length)
  })

  it('makes room beside the steps for their labels instead of under them', () => {
    const l = layout(pair)
    const t = transpose(l)
    expect(t.height).toBe(l.width)
    expect(t.width).toBe(l.height - 44 + SIDE)
  })
})

describe('layoutFlow', () => {
  it('stacks the Zap top to bottom and keeps n8n and Make left to right', () => {
    const [hp, , me, mw] = automations.flows.map(layoutFlow)
    const xs = Object.values(mw.nodes).map((p) => p.x)
    const ys = automations.flows[3].nodes.map((n) => mw.nodes[n.id].y)
    expect(new Set(xs).size).toBe(1)
    expect(ys).toEqual([...ys].sort((p, q) => p - q))
    expect(hp.width).toBeGreaterThan(hp.height)
    expect(me.width).toBeGreaterThan(me.height)
  })
})
```

- [ ] **Step 3: Run it.** `npx vitest run tests/automations-layout.test.ts` → Expected: FAIL (module not found).

- [ ] **Step 4: Write `lib/automations/layout.ts`:**

```ts
import type { Flow } from '../../data/automations.ts'
import { GEOM, layout, type Layout } from '../buildPlan/layout.ts'

/** Room beside a Zap's steps for their labels, in px. */
export const SIDE = 240

/** Every "x y" pair in a path, swapped. The Build plan's paths are M, L and C commands of space-separated pairs. */
const swap = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, '$2 $1')

/**
 * The Build plan's left-to-right canvas, turned to read top to bottom (spec
 * §3, Zapier). Wires leave a step at its foot and enter the next at its head;
 * lengths are unchanged, so the balls keep their timing. The labels sit beside
 * the steps, so the room left under the last row moves to the right.
 */
export function transpose(l: Layout, side = SIDE): Layout {
  return {
    ...l,
    nodes: Object.fromEntries(Object.entries(l.nodes).map(([id, p]) => [id, { ...p, x: p.y, y: p.x }])),
    edges: l.edges.map((e) => ({ ...e, d: swap(e.d), mid: [e.mid[1], e.mid[0]] })),
    width: l.height - GEOM.label + side,
    height: l.width,
    run: swap(l.run),
    routes: l.routes.map((r) => ({ ...r, run: swap(r.run) })),
  }
}

/** A flow's canvas: Zapier top to bottom, n8n and Make left to right. */
export const layoutFlow = (f: Flow): Layout => (f.platform === 'zapier' ? transpose(layout(f)) : layout(f))
```

Run `npx vitest run tests/automations-layout.test.ts` → Expected: PASS.

- [ ] **Step 5: Write the failing render test** `tests/automations-render.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { automations as g, PLATFORMS } from '@/data/automations'
import { renderAutomations } from '@/lib/automations/render'
import { automationsCss } from '@/lib/automations/styles'
import { themeHeadJs } from '@/lib/brand/render'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAutomations()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)
const lower = (code: string) => code.toLowerCase()

describe('renderAutomations', () => {
  it('picks its theme in <head>, before the styles', () => {
    const first = doc.head.querySelector('script, style')!
    expect(first.tagName).toBe('SCRIPT')
    expect(first.textContent).toBe(themeHeadJs())
  })

  it('opens with the title, the lede, the sample note and every tool, the three platforms first', () => {
    expect(doc.title).toBe('Automations · Justine Acosta')
    expect(doc.querySelector('h1')!.textContent).toBe(g.heading)
    expect(doc.querySelector('.kicker')!.textContent).toBe('AUTOMATIONS · FOUR LIVE FLOWS')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.sample-note')!.textContent).toBe(g.sample)
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['n8n', 'Make', 'Zapier', 'Claude', 'Telegram', 'Gmail', 'HubSpot', 'Google Sheets', 'Cal.com', 'Airtable'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/automations.html')
  })

  it('has one tab per flow, naming its site and platform, each controlling its panel', () => {
    const list = doc.querySelector('[role=tablist]')!
    expect(list.getAttribute('aria-label')).toBe('Flows')
    const tabs = [...list.querySelectorAll('[role=tab]')]
    expect(tabs.map((t) => t.textContent)).toEqual(g.flows.map((f) => `${f.site}${PLATFORMS[f.platform].name}`))
    tabs.forEach((t, i) => {
      const f = g.flows[i]
      expect(t.id).toBe(`tab-${lower(f.code)}`)
      expect(t.getAttribute('aria-controls')).toBe(lower(f.code))
      expect(t.getAttribute('aria-selected')).toBe(String(i === 0))
      expect(t.getAttribute('tabindex')).toBe(i === 0 ? '0' : '-1')
      const panel = doc.getElementById(lower(f.code))!
      expect(panel.getAttribute('role')).toBe('tabpanel')
      expect(panel.getAttribute('aria-labelledby')).toBe(t.id)
      expect(panel.hasAttribute('hidden')).toBe(i !== 0)
    })
  })

  it('draws each flow in its platform’s look, with a step button and a read-aloud step per node, and a link to its site', () => {
    for (const f of g.flows) {
      const panel = doc.getElementById(lower(f.code))!
      const fig = panel.querySelector('figure.canvas')!
      expect(fig.classList.contains(`p-${f.platform}`), f.code).toBe(true)
      expect(fig.querySelectorAll('button.node')).toHaveLength(f.nodes.length)
      expect(fig.querySelectorAll('.steps li')).toHaveLength(f.nodes.length)
      expect(fig.querySelectorAll('.run-dot').length).toBeGreaterThan(0)
      expect(panel.querySelector('.outcome')!.textContent).toBe(f.outcome)
      const site = panel.querySelector<HTMLAnchorElement>('a.site-link')!
      expect(site.getAttribute('href')).toBe(f.href)
      expect(site.getAttribute('target')).toBe('_blank')
    }
  })

  it('numbers the Zap’s steps, and only the Zap’s', () => {
    expect([...doc.querySelectorAll('#mw-01 .node-n')].map((n) => n.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(doc.querySelectorAll('.node-n')).toHaveLength(5)
  })

  it('gives every step a panel: its platform and kind, what it does, what it reads and why', () => {
    const d = data()
    expect(Object.keys(d)).toHaveLength(g.flows.reduce((n, f) => n + f.nodes.length, 0))
    expect(d['hp-01:hp-price']).toEqual({
      label: 'Price the move',
      type: 'n8n · Claude',
      what: g.flows[0].nodes[1].what,
      settings: [['What it reads', g.flows[0].nodes[1].reads.join(', ')], ['Why it’s here', g.flows[0].nodes[1].why]],
      tools: ['claude'],
    })
    expect(d['hp-01:hp-form'].tools).toBeUndefined()
    expect(doc.querySelector('[data-p=close]')!.getAttribute('aria-label')).toBe('Close details')
  })

  it('points every logo at the sheet, and links nowhere outside the site', () => {
    const ids = new Set([...doc.querySelectorAll('symbol')].map((s) => s.id))
    for (const u of doc.querySelectorAll('use')) expect(ids.has(u.getAttribute('href')!.slice(1)), u.getAttribute('href')!).toBe(true)
    for (const a of doc.querySelectorAll('a[href]')) expect(a.getAttribute('href')!, a.outerHTML).toMatch(/^[/#]/)
  })

  it('inlines the End-to-End client', () => {
    const scripts = [...doc.querySelectorAll('body script:not([type])')].map((s) => s.textContent!)
    expect(scripts.some((s) => s.includes('graph-nodes'))).toBe(true)
  })

  it('hides a flow the hidden attribute hides, though sections are grids', () => {
    expect(automationsCss({ dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() })).toContain('.flow[hidden]{display:none}')
  })
})
```

- [ ] **Step 6: Run it.** `npx vitest run tests/automations-render.test.ts` → Expected: FAIL (module not found).

- [ ] **Step 7: Write `lib/automations/styles.ts`:**

```ts
import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The Automations page's CSS (plan 2026-10-01-automations-flows §0.3): the
 * Build plan's base, plus the sample note, the flow tabs, and the Make and
 * Zapier looks. n8n is the base look as it is.
 */
export function automationsCss(themes: Themes): string {
  return `${pageCss(themes)}
.sample-note{display:flex;align-items:center;gap:8px;max-width:62ch;font-size:.875rem;color:var(--ink3)}
.sample-note svg{flex:none;color:var(--accent)}
.flows{display:flex;flex-direction:column;gap:18px}
.tabs{display:flex;gap:8px;overflow-x:auto;padding:2px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{flex:none;display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 14px;border-radius:14px;border:1px solid var(--b1);background:var(--s1);color:var(--ink2);font:inherit;text-align:left;cursor:pointer;transition:border-color .2s,background-color .2s}
.tab:hover{border-color:var(--b2);color:var(--ink)}
.tab[aria-selected=true]{border-color:var(--accent);background:var(--wash);color:var(--ink)}
.tab-site{font-size:.875rem;font-weight:600}
.platform{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:.625rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.flow{display:flex;flex-direction:column;gap:14px;scroll-margin-top:16px}
.flow[hidden]{display:none}
.flow:focus-visible{outline-offset:6px;border-radius:12px}
.flow-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 20px}
.outcome{flex:1 1 320px;min-width:0;max-width:62ch;color:var(--ink2)}
.site-link{flex:none;font-size:.875rem;font-weight:500;text-decoration:none}
.site-link:hover{text-decoration:underline}
.p-make .node-card,.p-make .k-trigger .node-card{border-radius:50%}
.p-make .edge{stroke-dasharray:1 7;stroke-linecap:round;stroke-width:2.4}
.p-make .k-branch .node-card{box-shadow:0 0 0 5px var(--s0),0 0 0 6.5px var(--b2)}
.p-zapier .node{width:auto;display:grid;grid-template-columns:56px 200px;grid-template-rows:auto auto;column-gap:14px;row-gap:2px;align-items:center;text-align:left}
.p-zapier .node-card{grid-row:1/3}
.p-zapier .node-label,.p-zapier .node-sub{width:auto}
.p-zapier .node-label{align-self:end}
.p-zapier .node-sub{align-self:start;margin-top:0}
.p-zapier .k-trigger .node-card{border-radius:14px}
.p-zapier .node-card::before,.p-zapier .node-card::after{left:50%;right:auto;margin:0 0 0 -4px}
.p-zapier .node-card::before{top:-5px}
.p-zapier .node-card::after{top:auto;bottom:-5px}
.node-n{display:inline-grid;place-items:center;min-width:18px;height:18px;margin-right:6px;padding:0 4px;border-radius:999px;background:var(--accent);color:var(--onAccent);font-family:var(--mono);font-size:.625rem;font-weight:500;vertical-align:1px}
@media (prefers-reduced-motion:reduce){.tab{transition:none}}
:root[data-a11y-motion=true] .tab{transition:none}
@media print{.tabs{display:none}.flow[hidden]{display:flex}}
`
}
```

- [ ] **Step 8: Write `lib/automations/tabs.js`** as a shell (Task 4 fills it; the render test only needs `role=tab` in it):

```js
// The Automations page's tabs (public/automations.html), inlined by
// lib/automations/render.ts. Filled in by the next task: [role=tab] switching.
;(() => {})()
```

- [ ] **Step 9: Write `lib/automations/render.ts`:**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { automations as A, KIND_LABELS, PLATFORMS, type Automations, type Flow } from '../../data/automations.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { livelyCss } from '../brand/lively.ts'
import { backdropHtml, contourJs, logo, logoBadges, logoSheet, revealJs, themeHeadJs, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import type { ToolId } from '../brand/tools.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutFlow } from './layout.ts'
import { automationsCss } from './styles.ts'

/** Where the page is served (public/automations.html). */
export const PAGE_PATH = '/automations.html'

/** What each step's panel shows: its name, a kind line, what it does, then what it reads and why. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const slug = (code: string) => code.toLowerCase()
/** A script file, ready to inline. Git may check it out with CRLF on Windows. */
const script = (path: string) => readFileSync(join(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n')

function hero(g: Automations, used: ToolId[]) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="sample-note"><span aria-hidden="true">${iconSvg('Info', 16)}</span><span>${esc(g.sample)}</span></p>${toolStrip(used)}</header>`
}

function tab(f: Flow, i: number) {
  const id = slug(f.code)
  const p = PLATFORMS[f.platform]
  return `<button type="button" role="tab" class="tab" id="tab-${id}" aria-controls="${id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}"><span class="tab-site">${esc(f.site)}</span><span class="platform">${logo(p.tool, 14)}${esc(p.name)}</span></button>`
}

/** One flow as a canvas: connectors in SVG, steps as buttons, a ball template per route, and the steps as a list. */
function canvas(g: Automations, f: Flow, index: NodeIndex) {
  const l = layoutFlow(f)
  const key = (id: string) => `${slug(f.code)}:${id}`
  const byId = new Map(f.nodes.map((n) => [n.id, n]))
  for (const n of f.nodes)
    index[key(n.id)] = { label: n.label, type: `${PLATFORMS[f.platform].name} · ${KIND_LABELS[n.kind]}`, what: n.what, settings: [[g.panel.reads, n.reads.join(', ')], [g.panel.why, n.why]], ...(n.tools.length ? { tools: n.tools } : {}) }
  const entered = new Set(f.edges.map((e) => e.to))
  const left = new Set(f.edges.map((e) => e.from))
  const paths = l.edges.map((e, i) => `<path class="edge" data-edge="${i}" d="${e.d}"/>`).join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops.map(([id, at]) => [key(id), at]), spans: r.spans }))
  const labels = l.edges
    .filter((e) => e.label)
    .map((e) => `<span class="edge-label" style="left:${e.mid[0]}px;top:${e.mid[1]}px">${esc(e.label!)}</span>`)
    .join('')
  const buttons = f.nodes
    .map((n, i) => {
      const at = l.nodes[n.id]
      const step = f.platform === 'zapier' ? `<span class="node-n" aria-hidden="true">${i + 1}</span>` : ''
      return `<button type="button" class="node k-${n.kind}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key(n.id))}" data-in="${entered.has(n.id) ? 1 : 0}" data-out="${left.has(n.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(n.icon)}${logoBadges(n.tools)}</span><span class="node-label">${step}${esc(n.label)}</span><span class="node-sub">${esc(n.sub)}</span></button>`
    })
    .join('')
  const steps = f.nodes
    .map((n) => {
      const next = f.edges.filter((e) => e.from === n.id).map((e) => `${byId.get(e.to)!.label}${e.label ? ` if ${e.label}` : ''}`)
      return `<li>${esc(n.label)} (${esc(KIND_LABELS[n.kind])}, ${esc(n.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  const pans = f.platform === 'zapier' ? '' : ', scrolls sideways'
  return `<figure class="canvas p-${f.platform}" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(f.code)} · ${esc(f.title)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll diagram left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll diagram right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(f.code)} diagram${pans}"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${steps}</ol></figure>`
}

function flowPanel(g: Automations, f: Flow, i: number, index: NodeIndex) {
  const id = slug(f.code)
  return `<section id="${id}" class="flow" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0"${i ? ' hidden' : ''}><div class="flow-head"><p class="outcome">${esc(f.outcome)}</p><a class="site-link" href="${esc(f.href)}" target="_blank" rel="noopener">${esc(g.seeSite)} ↗<span class="sr-only"> (${esc(f.site)}, opens in a new tab)</span></a></div>${canvas(g, f, index)}</section>`
}

/** The whole Automations page (plan §0.3): one self-contained HTML file. */
export function renderAutomations(g: Automations = A, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const used = toolsUsed([g.flows.map((f) => PLATFORMS[f.platform].tool), ...g.flows.flatMap((f) => f.nodes.map((n) => n.tools))])
  const panels = g.flows.map((f, i) => flowPanel(g, f, i, index)).join('')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<script>${themeHeadJs()}</script>
<title>${esc(g.title)}</title>
<meta name="description" content="${esc(g.description)}">
<meta property="og:title" content="${esc(g.title)}">
<meta property="og:description" content="${esc(g.description)}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${PAGE_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>${automationsCss(themes)}${livelyCss()}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<main class="page">
${hero(g, used)}
<div class="flows"><div class="tabs" role="tablist" aria-label="${esc(g.tabsLabel)}">${g.flows.map(tab).join('')}</div>${panels}</div>
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="${esc(g.panel.close)}">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script>${script('lib/endToEnd/client.js')}</script>
<script>${script('lib/automations/tabs.js')}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
```

- [ ] **Step 10: Run the render tests.** `npx vitest run tests/automations-render.test.ts tests/automations-layout.test.ts` → Expected: PASS. (Every Phosphor name the data uses was checked to exist while planning.)

- [ ] **Step 11: Commit.**

```bash
git add lib/buildPlan/layout.ts lib/automations tests/automations-layout.test.ts tests/automations-render.test.ts
git commit -m "feat: the Automations page render: tabs, platform looks, Zapier top to bottom

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Tabs behaviour, generator, page, screenshot, browser tests

**Files:**
- Modify: `lib/automations/tabs.js`, `package.json` (scripts)
- Create: `scripts/make-automations.ts`, `scripts/shoot-automations.mjs`, `e2e/automations.spec.ts`
- Generated: `public/automations.html`, `public/shots/automations.jpeg`

**Interfaces:**
- Consumes: the page contract from Task 3.
- Produces: `npm run automations-page`; `/automations.html`; `/shots/automations.jpeg` (640×400).

- [ ] **Step 1a: Add the failing unit test** to `tests/automations-render.test.ts`:

```ts
  it('inlines the tabs script after the client', () => {
    const scripts = [...doc.querySelectorAll('body script:not([type])')].map((s) => s.textContent!)
    const client = scripts.findIndex((s) => s.includes('graph-nodes'))
    const tabs = scripts.findIndex((s) => s.includes('[role=tab]'))
    expect(tabs).toBeGreaterThan(client)
  })
```

Run `npx vitest run tests/automations-render.test.ts` → Expected: FAIL (the shell has no `[role=tab]`).

- [ ] **Step 1b: Write the failing browser tests** `e2e/automations.spec.ts`:

```ts
import { expect, test, type Page } from '@playwright/test'

const PAGE = '/automations.html'
const CODES = ['hp-01', 'wm-01', 'me-01', 'mw-01']
const tab = (page: Page, name: RegExp) => page.getByRole('tablist', { name: 'Flows' }).getByRole('tab', { name })
const visible = (page: Page) => page.evaluate((codes) => codes.filter((c) => getComputedStyle(document.getElementById(c)!).display !== 'none'), CODES)

test('opens on Harbor & Pine, one flow at a time; a click or the arrow keys switch flows', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page.getByRole('tab')).toHaveCount(4)
  await expect(tab(page, /^Harbor & Pine/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['hp-01'])
  await tab(page, /^Westmere/).click()
  expect(await visible(page)).toEqual(['wm-01'])
  await expect(page).toHaveURL(/#wm-01$/)
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, /^Meridian Energy/)).toBeFocused()
  await expect(tab(page, /^Meridian Energy/)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('End')
  await expect(tab(page, /^Meridian Werks/)).toHaveAttribute('aria-selected', 'true')
  await page.keyboard.press('ArrowRight')
  await expect(tab(page, /^Harbor & Pine/)).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Home')
  await expect(tab(page, /^Harbor & Pine/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['hp-01'])
})

test('a #code address opens that flow', async ({ page }) => {
  await page.goto(`${PAGE}#mw-01`)
  await expect(tab(page, /^Meridian Werks/)).toHaveAttribute('aria-selected', 'true')
  expect(await visible(page)).toEqual(['mw-01'])
})

test('a step explains itself; Escape closes it and focus goes back; switching flows closes it too', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="hp-01:hp-price"]')
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Price the move' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('n8n · Claude')
  await expect(panel).toContainText('What it reads')
  await expect(panel).toContainText('Why it’s here')
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
  await step.click()
  await expect(panel).toBeVisible()
  await tab(page, /^Westmere/).click()
  await expect(panel).toBeHidden()
})

test('the Zap reads top to bottom, its steps in one column', async ({ page }) => {
  await page.goto(`${PAGE}#mw-01`)
  const boxes = await page.locator('#mw-01 button.node').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: Math.round(r.x), y: Math.round(r.y) })))
  expect(new Set(boxes.map((b) => b.x)).size).toBe(1)
  expect(boxes.map((b) => b.y)).toEqual([...boxes.map((b) => b.y)].sort((p, q) => p - q))
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the page never scrolls sideways; a wide flow pans in its own box, with its arrows once shown', async ({ page }) => {
    await page.goto(PAGE)
    for (const [i, code] of CODES.entries()) {
      await page.getByRole('tab').nth(i).click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth), code).toBeLessThanOrEqual(390)
    }
    await tab(page, /^Westmere/).click()
    await expect(page.locator('#wm-01 figure.canvas')).toHaveAttribute('data-overflow', '')
    await expect(page.locator('#wm-01').getByRole('button', { name: 'Scroll diagram right' })).toBeVisible()
  })
})

test('loads and runs with no page errors, and every logo it points at is in its sheet', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  for (const i of [1, 2, 3, 0]) await page.getByRole('tab').nth(i).click()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
  const missing = await page.evaluate(() => [...document.querySelectorAll('use')].map((u) => u.getAttribute('href')!).filter((h) => !document.getElementById(h.slice(1))))
  expect(missing).toEqual([])
})

test('on its own it opens light unless dark was chosen on the portfolio', async ({ browser }) => {
  for (const [saved, bg] of [[null, 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    if (saved) await ctx.addInitScript((t) => localStorage.setItem('kraft-theme', t), saved)
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body'), String(saved)).toHaveCSS('background-color', bg)
    await ctx.close()
  }
})
```

- [ ] **Step 2: Fill in `lib/automations/tabs.js`:**

```js
// The Automations page's tabs (public/automations.html), inlined by
// lib/automations/render.ts after the End-to-End client. One flow shows at a
// time. Arrow keys, Home and End move between tabs (WAI-ARIA tabs, automatic
// activation). A #hp-01 address opens that flow; a switch updates the address
// without adding history, so Back still closes the portfolio's window.
;(() => {
  const tabs = [...document.querySelectorAll('[role=tab]')]
  const panel = document.getElementById('node-panel')
  const code = (t) => t.getAttribute('aria-controls')
  const select = (tab, focus) => {
    // A step's panel belongs to the flow on show.
    if (panel.matches(':popover-open')) panel.hidePopover()
    for (const t of tabs) {
      const on = t === tab
      t.setAttribute('aria-selected', String(on))
      t.tabIndex = on ? 0 : -1
      document.getElementById(code(t)).hidden = !on
    }
    if (focus) tab.focus()
    // The client measures each diagram's pan arrows and fades on resize; a flow that was hidden had no size.
    dispatchEvent(new Event('resize'))
  }
  const go = (tab, focus) => {
    select(tab, focus)
    history.replaceState(null, '', `#${code(tab)}`)
  }
  for (const t of tabs) t.addEventListener('click', () => go(t, false))
  document.querySelector('[role=tablist]').addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement)
    if (i < 0) return
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (to === undefined) return
    e.preventDefault()
    go(tabs[(to + tabs.length) % tabs.length], true)
  })
  const fromHash = () => {
    const t = tabs.find((x) => `#${code(x)}` === location.hash)
    if (t) select(t, false)
  }
  fromHash()
  addEventListener('hashchange', fromHash)
})()
```

- [ ] **Step 3: Write the generator and the photographer.** `scripts/make-automations.ts`:

```ts
// Builds public/automations.html from data/automations.ts (plan 2026-10-01-automations-flows).
// Run after changing the page's data, layout, styles or tabs script, or End-to-End's client: npm run automations-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAutomations } from '../lib/automations/render.ts'

const html = renderAutomations()
writeFileSync(join(process.cwd(), 'public', 'automations.html'), html)
console.log(`public/automations.html: ${(html.length / 1024).toFixed(1)} KB`)
```

`scripts/shoot-automations.mjs`:

```js
// Photographs public/automations.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run automations-page
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400. Light, the page's default; reduced motion keeps the contour and balls out.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'light', reducedMotion: 'reduce' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'automations.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'automations.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
```

In `package.json` `scripts`, after `"agents-page"`, add:

```json
    "automations-page": "node scripts/make-automations.ts && node scripts/shoot-automations.mjs"
```

- [ ] **Step 4: Generate.** `npm run automations-page` → Expected: prints `public/automations.html: <n> KB`; `public/shots/automations.jpeg` exists. Open the shot with the Read tool and look at it: hero, tabs and the Harbor & Pine canvas, light theme.

- [ ] **Step 5: Run the unit tests.** `npx vitest run tests/automations-render.test.ts` → Expected: PASS (all, including the tabs-script test).

- [ ] **Step 6: Run the new browser tests.** `npm run build` then `npx playwright test e2e/automations.spec.ts --workers=3` (the config serves the production build on port 3100) → Expected: PASS. If the phone test finds `data-overflow` missing, the `resize` dispatch did not reach the client's `fit`; fix in `tabs.js`, never by loosening the test.

- [ ] **Step 7: Look at it.** Screenshot `#hp-01`, `#me-01` and `#mw-01` at 1440×900 in light and dark, and `#wm-01` at 390×844, into the scratchpad; check the Make modules are round with dotted links, the Router has its ring, the Zap's labels sit beside its steps with numbers, and nothing overlaps.

- [ ] **Step 8: Commit.**

```bash
git add lib/automations/tabs.js scripts/make-automations.ts scripts/shoot-automations.mjs package.json public/automations.html public/shots/automations.jpeg e2e/automations.spec.ts
git commit -m "feat: the Automations page: tabs, generated page, Home shot, browser tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The card opens the page; the reel goes

**Files:**
- Modify: `data/projects.ts`, `components/projects/ProjectViews.tsx`, `components/projects/Board.tsx`, `lib/commands.ts`, `lib/seo.ts`, `app/globals.css:269,293-301`
- Create: `components/projects/AutomationsView.tsx`
- Delete: `components/projects/ReelView.tsx`, `tests/project-stage.test.tsx`
- Test: `tests/projects.test.tsx`, `tests/commands.test.ts`, `tests/CommandPalette.focus.test.tsx`, `tests/seo.test.ts`, `tests/no-ghl.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `/automations.html`, `/shots/automations.jpeg` (Task 4).
- Produces: `ProjectView` includes `'automations'` (not `'reel'`); `projects.cards.automations = { title: 'Automations', logos, cue: 'VIEW THE FLOWS', cta: 'OPEN THE FLOWS', body, page: '/automations.html', frameTitle: 'Automations flows page' }`. `projects.reel`, `Screenshot`, `REEL`, `peek`, `peekHint` no longer exist.

- [ ] **Step 1: Update the tests first.**

`tests/projects.test.tsx`:
- Replace the `keeps the reel and the sites` test with:

```ts
  it('keeps the sites, and the Automations card opens its flows page, with a real 16:10 screenshot on Home', () => {
    expect(projects.sitesView.sites.map((s) => s.name)).toEqual([
      'Harbor & Pine Moving Co.', 'Westmere', 'Ironline Utility Infrastructure', 'Meridian Werks', 'Meridian Energy Infrastructure',
    ])
    expect('reel' in projects).toBe(false)
    expect(projects.cards.automations).toMatchObject({ page: '/automations.html', frameTitle: 'Automations flows page', cue: 'VIEW THE FLOWS', cta: 'OPEN THE FLOWS' })
    const shot = BUILDS.find((b) => b.view === 'automations')!.shot
    expect(shot).toBe('/shots/automations.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })
```

- In `gives every board card at least three brand logos`, change `c.reel` to `c.automations`.
- In `links every card to its sub-view by hash`, change `'#reel'` to `'#automations'`.
- In the `ProjectViews` describe, add:

```ts
  it('opens the Automations page in its window, with a new-tab link', () => {
    window.history.replaceState(null, '', '/projects#automations')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Automations' })
    const frame = within(view).getByTitle('Automations flows page')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/automations.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/automations.html')
  })
```

- Add a Board test:

```ts
  it('says what the Automations card holds', () => {
    render(<Board />)
    const card = screen.getByRole('link', { name: /^Automations/ })
    expect(card).toHaveAttribute('href', '#automations')
    expect(within(card).getByText('The flows behind my sample sites’ forms, on n8n, Make and Zapier.')).toBeInTheDocument()
    expect(within(card).getByText(/OPEN THE FLOWS/)).toBeInTheDocument()
    expect(within(card).queryByText('Workflow screen')).toBeNull()
  })
```

`tests/commands.test.ts`: `'/projects#reel'` → `'/projects#automations'`; `c.reel` → `c.automations`.
`tests/CommandPalette.focus.test.tsx:36`: `'#reel'` → `'#automations'`.
`tests/seo.test.ts`: add `expect(urls).toContain(\`${SITE_URL}/automations.html\`)` beside the other three.
`tests/no-ghl.test.ts`: add `'public/automations.html'` to `FILES`.
Delete `tests/project-stage.test.tsx` (every case in it is the reel's).

`e2e/projects.spec.ts`:
- Delete `test('the reel marches, and pauses under the pointer', …)` and, in the reduced-motion describe, `test('the reel stands still and scrolls by hand', …)`.
- Add:

```ts
test('the Automations card opens its flows page in the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^Automations/ }).click()
  await expect(page).toHaveURL(/\/projects#automations$/)
  const view = page.getByRole('dialog', { name: 'Automations' })
  await expect(view).toBeVisible()
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/automations.html')
  await expect(page.frameLocator('iframe[title="Automations flows page"]').getByRole('heading', { level: 1 })).toHaveText('What happens after someone hits send')
})
```

- In `other pages never load the Projects write-ups up front`, add `expect(asked).not.toContain('/automations.html')`.

`e2e/seo.spec.ts:25`: add `'/automations.html'` to the list.

- [ ] **Step 2: Run them.** `npx vitest run tests/projects.test.tsx tests/commands.test.ts tests/CommandPalette.focus.test.tsx tests/seo.test.ts` → Expected: FAIL (`cards.automations` undefined, `#reel` still linked).

- [ ] **Step 3: `data/projects.ts`.**
  - `PROJECT_VIEWS = ['automations', 'build-plan', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const`
  - Delete `export type Screenshot` and the `REEL` constant.
  - Replace `cards.reel` with:

```ts
    automations: {
      title: 'Automations', logos: logos(['n8n', 'n8n'], ['Make', 'make'], ['Zapier', 'zapier']), cue: 'VIEW THE FLOWS', cta: 'OPEN THE FLOWS',
      body: 'The flows behind my sample sites’ forms, on n8n, Make and Zapier.',
      page: '/automations.html', frameTitle: 'Automations flows page',
    },
```

  - Delete the whole `reel: { … }` block under `writeups`.
  - First `BUILDS` row: `{ name: projects.cards.automations.title, view: 'automations', shot: '/shots/automations.jpeg' },`
  - Header comment: add "The Automations card opens public/automations.html (data/automations.ts)."; the `BUILDS` comment no longer says the rest are PLACEHOLDERs (none are left): "Every build on the Projects page, in its order, for the fan on Home's Projects card. Funnels and sites shows a sample site; the rest show their page (16:10)."

- [ ] **Step 4: `components/projects/AutomationsView.tsx`:**

```tsx
import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The Automations page (plan 2026-10-01-automations-flows): the generated
 * page public/automations.html in the document window. The iframe is only
 * there while the window is open, so /projects never downloads it up front.
 * It is same-origin and unsandboxed because we write the page ourselves, which
 * lets it copy the site's theme.
 */
export default function AutomationsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.automations
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
```

`ProjectViews.tsx`: import `AutomationsView` instead of `ReelView`; render `<AutomationsView open={view === 'automations'} onClose={close} />` in the reel's place. Delete `components/projects/ReelView.tsx`.

- [ ] **Step 5: `Board.tsx`.** The Automations card becomes (the peek frames go; Task 6 adds the canvas):

```tsx
          <a href="#automations" onClick={openView} data-case={c.automations.cue} className={`${CARD} min-w-[min(270px,100%)] flex-[3_1_420px]`}>
            <LogoStack logos={c.automations.logos} />
            <h2 className={TITLE}>{c.automations.title}</h2>
            <p className={`${BODY} max-w-[340px]`}>{c.automations.body}</p>
            <span className={CTA}>
              {c.automations.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
          </a>
```

Remove the now-unused `Shot` import.

- [ ] **Step 6: `lib/commands.ts`:** `view('automations', c.automations.title, c.automations.logos),`. **`lib/seo.ts`:** append `'/automations.html'` to `STATIC_PAGES`. **`app/globals.css`:** delete the reel block (the `/* Kraft's workflow reel … */` comment and the `.reel-row`, `.reel`, `.reel-pause` rules, lines 293–301) and change the comment at line 269 from "the reel and site views" to "the site views". Keep `@keyframes kMarquee` (`--animate-marquee` uses it).

- [ ] **Step 7: Check nothing else names the reel.** `grep -rn "reel\b\|ReelView\|peekHint\|projects\.reel\|#reel" app components lib data hooks tests e2e --include=*.ts --include=*.tsx --include=*.css` → Expected: only `tests/hash.test.ts`, `tests/useHashView.test.tsx` and `tests/scrollMemory.test.ts`, which use `reel` as an arbitrary hash and never read `PROJECT_VIEWS`; plus `data/showcase.ts`/`Feedback.tsx` (testimonials reel) and End-to-End's "Reel maker", which are other things. Leave those.

- [ ] **Step 8: Run.** `npx tsc --noEmit` → Expected: no errors. `npx vitest run` → Expected: all PASS.

- [ ] **Step 9: Commit.**

```bash
git add -A data/projects.ts components/projects lib/commands.ts lib/seo.ts app/globals.css tests e2e
git commit -m "feat: the Automations card opens the flows page; the screenshot reel is gone

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The card's mini canvas (`FlowPeek`)

**Files:**
- Create: `components/projects/FlowPeek.tsx`, `tests/FlowPeek.test.tsx`
- Modify: `components/projects/Board.tsx` (Automations card), `app/globals.css` (after the Agents card preview block)
- Test: `tests/FlowPeek.test.tsx`, `tests/projects.test.tsx`

**Interfaces:**
- Consumes: `automations`, `mainRoute`, `PLATFORMS`, `Flow`, `FlowNode` (Task 2); `brandIcon(slug)` from `data/stack.ts`; `useReducedMotion()`.
- Produces: `default FlowPeek()`; `PEEK_MS = 4500`; `PEEK_SLUG: Partial<Record<ToolId, string>>`. Markup: root `div[data-flow-peek][aria-hidden=true]`; one `div[data-flow=<code>][data-on=true|false]` per flow; chips `[data-chip]`.

- [ ] **Step 1: Write the failing test** `tests/FlowPeek.test.tsx`:

```tsx
import { existsSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import FlowPeek, { PEEK_MS, PEEK_SLUG } from '@/components/projects/FlowPeek'
import { automations, mainRoute } from '@/data/automations'
import { installMatchMedia } from '@/test/matchMedia'

const on = () => document.querySelector('[data-on="true"]')!
const inCard = () =>
  render(
    <a href="#automations">
      <FlowPeek />
    </a>,
  )

describe('FlowPeek', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('is decoration only: hidden from screen readers, every logo without alt text', () => {
    inCard()
    const root = document.querySelector('[data-flow-peek]')!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    for (const img of root.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
  })

  it('draws each flow’s main route as chips, under its site and platform', () => {
    inCard()
    for (const f of automations.flows) {
      const el = document.querySelector(`[data-flow="${f.code}"]`)!
      expect(el.querySelectorAll('[data-chip]')).toHaveLength(mainRoute(f).length)
    }
    expect(on().textContent).toContain('Harbor & Pine · n8n')
  })

  it('numbers the Zap’s chips, and only the Zap’s', () => {
    inCard()
    expect([...document.querySelectorAll('[data-flow="MW-01"] [data-step]')].map((s) => s.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(document.querySelectorAll('[data-step]')).toHaveLength(5)
  })

  it('moves to the next flow every 4.5 seconds, and back round to the first', () => {
    inCard()
    const seen = [on().getAttribute('data-flow')]
    for (let i = 0; i < 4; i++) {
      act(() => vi.advanceTimersByTime(PEEK_MS))
      seen.push(on().getAttribute('data-flow'))
    }
    expect(seen).toEqual(['HP-01', 'WM-01', 'ME-01', 'MW-01', 'HP-01'])
  })

  it('holds the flow on show while the pointer is on the card', () => {
    inCard()
    const card = document.querySelector('a')!
    fireEvent.pointerEnter(card)
    act(() => vi.advanceTimersByTime(PEEK_MS * 3))
    expect(on().getAttribute('data-flow')).toBe('HP-01')
    fireEvent.pointerLeave(card)
    act(() => vi.advanceTimersByTime(PEEK_MS))
    expect(on().getAttribute('data-flow')).toBe('WM-01')
  })

  it('holds still on Harbor & Pine with reduced motion, with no pulse running', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    inCard()
    act(() => vi.advanceTimersByTime(PEEK_MS * 3))
    expect(on().getAttribute('data-flow')).toBe('HP-01')
    expect(document.querySelector('[data-flow-peek]')).not.toHaveAttribute('data-seen')
  })

  it('has a logo file for every tool a chip shows', () => {
    const tools = automations.flows.flatMap((f) => f.nodes.map((n) => n.tools[0]).filter(Boolean))
    for (const t of tools) expect(existsSync(`public/icons/brands/${PEEK_SLUG[t!]}.svg`), t).toBe(true)
  })
})
```

Also add to the Board test `says what the Automations card holds` in `tests/projects.test.tsx`:

```ts
    expect(card.querySelector('[data-flow-peek]')).toHaveAttribute('aria-hidden', 'true')
```

- [ ] **Step 2: Run them.** `npx vitest run tests/FlowPeek.test.tsx tests/projects.test.tsx` → Expected: FAIL (module not found; no `[data-flow-peek]`).

- [ ] **Step 3: Write `components/projects/FlowPeek.tsx`:**

```tsx
'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowsSplitIcon, WebhooksLogoIcon } from '@phosphor-icons/react/ssr'
import { automations, mainRoute, PLATFORMS, type Flow, type FlowNode } from '@/data/automations'
import { brandIcon } from '@/data/stack'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { ToolId } from '@/lib/brand/tools'

/** How long each flow shows before the next fades in. */
export const PEEK_MS = 4500

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
    <span data-chip className={`relative grid size-8 shrink-0 place-items-center bg-logo-chip shadow-(--logo-shadow) sm:size-9 ${SHAPE[flow.platform]}`}>
      {tool ? (
        <Image src={brandIcon(PEEK_SLUG[tool]!)} alt="" width={18} height={18} className="block" />
      ) : node.kind === 'branch' ? (
        <ArrowsSplitIcon size={18} className="text-ink2" />
      ) : (
        <WebhooksLogoIcon size={18} className="text-ink2" />
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
 * The Automations card's canvas (plan 2026-10-01-automations-flows §0.4):
 * each flow's main route as a row of logo chips, fading to the next flow
 * every 4.5 s while a pulse runs along the wires (app/globals.css, "Automations
 * card canvas"). It holds while the pointer is on the card, while it is off
 * screen and while the tab is hidden; under reduced motion it stays on the
 * first flow. Decorative: the card's link already says what is inside.
 */
export default function FlowPeek() {
  const flows = automations.flows
  const still = useReducedMotion()
  const [at, setAt] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || still) return
    let seen = true
    let held = false
    const card = el.closest('a') ?? el
    const hold = () => (held = true)
    const free = () => (held = false)
    card.addEventListener('pointerenter', hold)
    card.addEventListener('pointerleave', free)
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver === 'undefined') el.setAttribute('data-seen', '')
    else {
      io = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting
        el.toggleAttribute('data-seen', seen)
      })
      io.observe(el)
    }
    const timer = window.setInterval(() => {
      if (seen && !held && !document.hidden) setAt((i) => (i + 1) % flows.length)
    }, PEEK_MS)
    return () => {
      window.clearInterval(timer)
      io?.disconnect()
      el.removeAttribute('data-seen')
      card.removeEventListener('pointerenter', hold)
      card.removeEventListener('pointerleave', free)
    }
  }, [still, flows.length])
  const shown = still ? 0 : at
  return (
    <div ref={box} aria-hidden data-flow-peek className="flow-peek relative mt-1.5 h-[clamp(130px,15cqw,180px)] overflow-hidden rounded-[14px] border border-b1 bg-s0">
      {flows.map((f, i) => {
        const route = mainRoute(f).map((id) => f.nodes.find((n) => n.id === id)!)
        return (
          <div key={f.code} data-flow={f.code} data-on={i === shown} className="absolute inset-0 flex flex-col justify-center gap-4 px-4 opacity-0 transition-opacity duration-700 data-[on=true]:opacity-100 motion-reduce:transition-none">
            <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
              <span className="uppercase">{f.site}</span> · {PLATFORMS[f.platform].name}
            </span>
            <div className="flex items-center">
              {route.map((n, k) => (
                <Fragment key={n.id}>
                  {k > 0 && (
                    <span className={`fp-wire relative min-w-2 flex-1 ${f.platform === 'make' ? 'border-t-2 border-dotted border-b2' : 'h-px bg-b2'}`}>
                      <span className="fp-pulse" style={{ animationDelay: `${k * 0.35}s` }} />
                    </span>
                  )}
                  <Chip node={n} flow={f} n={k + 1} />
                </Fragment>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: The pulse CSS.** In `app/globals.css`, after the Agents card preview block (after `:root[data-perf=low] .agents-preview *{animation:none !important}`), add:

```css
/* Automations card canvas (components/projects/FlowPeek.tsx): a pulse runs
   along each wire of the flow on show, while the card is on screen. */
.fp-pulse{position:absolute;top:50%;left:0;width:6px;height:6px;margin-top:-3px;border-radius:50%;background:var(--accent);box-shadow:0 0 8px 1px var(--glow);opacity:0}
.flow-peek[data-seen] [data-on=true] .fp-pulse{animation:fpPulse 1.4s ease-in-out infinite}
@keyframes fpPulse{0%{left:0;opacity:0}15%,85%{opacity:1}100%{left:calc(100% - 6px);opacity:0}}
@media (prefers-reduced-motion:reduce){.flow-peek *{animation:none !important}}
html[data-a11y-motion=true] .flow-peek *{animation:none !important}
:root[data-perf=low] .flow-peek *{animation:none !important}
```

- [ ] **Step 5: Put it on the card.** In `Board.tsx`, import `FlowPeek from './FlowPeek'` and render `<FlowPeek />` as the last child of the Automations `<a>`, after the CTA span.

- [ ] **Step 6: Run.** `npx vitest run tests/FlowPeek.test.tsx tests/projects.test.tsx tests/no-raw-colors.test.ts` → Expected: PASS.

- [ ] **Step 7: Look at it.** With `npm run dev`, screenshot `/projects` at 1440×900 in light and dark, and at 390×844, once on each flow (wait 4.5 s between). Check the chips fit the card on the phone (Westmere's six chips are the widest), the Make wires are dotted, the Zap's numbers sit on the chips, and the pulse runs. Remove the dev-only `nextjs-portal` element before phone screenshots.

- [ ] **Step 8: Commit.**

```bash
git add components/projects/FlowPeek.tsx components/projects/Board.tsx app/globals.css tests/FlowPeek.test.tsx tests/projects.test.tsx
git commit -m "feat: the Automations card cycles through the four flows

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Full verification and final review

**Files:** none new.

- [ ] **Step 1:** `npx tsc --noEmit` → no errors. `npm run lint` → no errors.
- [ ] **Step 2:** `npx vitest run` → all PASS; read the count.
- [ ] **Step 3:** `npm run build`, then `npx playwright test --grep-invert @shots --workers=3` → all PASS; read the count. A failure in a file this branch did not touch still goes in the report by name.
- [ ] **Step 4:** `git status` clean apart from `.claude/` and `.playwright-mcp/`; `public/automations.html` is current (`npm run automations-page` produces no diff).
- [ ] **Step 5:** Whole-branch review on the most capable model, with this plan, the Review Focus list, and the ledger's rulings.

---

## Self-review notes

- Spec coverage: §2 → Tasks 1–2; §3 → Tasks 3–4; §4 → Task 6; §5 → Task 5; §6 → every task's tests; §7 → nothing built.
- Types: `Flow`, `FlowNode`, `PLATFORMS`, `KIND_LABELS`, `mainRoute` (Task 2) are used with the same names in Tasks 3, 6; `layoutFlow`, `transpose`, `SIDE` (Task 3) only in Task 3 tests and render; `cards.automations` (Task 5) in Task 6's Board edit.
- The build plan's `layout()` change is a type widening only; `tests/buildPlan-layout.test.ts` guards it.
