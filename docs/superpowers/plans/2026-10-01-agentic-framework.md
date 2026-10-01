# Agentic Framework Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/agentic-framework.html`, a read page about how Justine builds with AI: the tools, the rules, one live loop diagram, and the End-to-End page as a worked example. It is shown in the Agentic Framework card's dialog, and the build plan and End-to-End pages stay untouched.

**Architecture:**
- Typed data (`data/agenticFramework.ts`) feeds a small pure layout (`lib/agenticFramework/layout.ts`). The layout hand-places 7 loop steps, draws 8 cables in four shapes, and finds the 3 ball routes.
- A renderer (`lib/agenticFramework/render.ts`) writes one self-contained HTML file.
- It borrows read-only:
  - `esc` and `pageCss` from the build plan.
  - `iconSvg` and the whole client script from End-to-End. That script is already generic: chips, panel, balls, panning.
- The site shows the file in an iframe inside the card's `Window`. The old doc dialog code goes, because nothing else uses it.

**Tech Stack:** TypeScript run directly by Node 26, Phosphor icons rendered to SVG at build time, Vitest with jsdom, Playwright, and Next.js 16 for the site.

**Spec:** `docs/superpowers/specs/2026-10-01-agentic-framework-design.md` (approved 2026-10-01 in chat)

## Global Constraints

- **Untouched:** no edits to:
  - `lib/buildPlan/**`, `lib/endToEnd/**`
  - `data/buildPlan.ts`, `data/endToEnd.ts`
  - `scripts/make-plan.ts`, `scripts/shoot-plan.mjs`, `scripts/make-e2e.ts`, `scripts/shoot-e2e.mjs`
  - `components/projects/PlanView.tsx`, `components/projects/EndToEndView.tsx`
  - `public/build-plan.html`, `public/end-to-end.html`, `public/shots/build-plan.jpeg`, `public/shots/end-to-end.jpeg`
- **Allowed read-only imports:**
  - `esc` from `lib/buildPlan/render.ts`
  - `pageCss` and `Themes` from `lib/buildPlan/styles.ts`
  - `iconSvg` from `lib/endToEnd/icons.ts`
  - the text of `lib/endToEnd/client.js` (read with `readFileSync`)
- **No raw colours in `lib/**`** (`tests/no-raw-colors.test.ts`). Every colour is a `var(--token)` or a `color-mix` of tokens.
- **Page and screenshot:** the page is `/agentic-framework.html` with `<link rel="canonical" href="/agentic-framework.html">`. The screenshot is `public/shots/agentic-framework.jpeg` at 640×400.
- **Script:** `"af-page": "node scripts/make-af.ts && node scripts/shoot-af.mjs"`. `plan` and `e2e-page` are unchanged.
- **Copy:**
  - Curly quotes only (’ “ ”), never a straight `'` or `"` inside copy.
  - No GoHighLevel or GHL anywhere.
  - Step labels and sub-lines are 22 characters or fewer.
- **Imports inside `lib/agenticFramework` and `data/agenticFramework.ts`:** relative paths with `.ts` extensions.
- **Balls:** at most 5 on the loop at once, launched at random 0.7–2 s apart, at most one loop-back per route (a run of dashed cables counts as one), and off under reduced motion.
- **Dialog:** the dialog is named "The Agentic Framework", and the iframe title is "Agentic Framework page".
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Decisions this plan makes inside the spec

1. **The End-to-End client is reused as it is, not copied.** The spec said "adapted from". It already does everything this page needs, and keyed on generic hooks: `.toc a` chips, `[data-node]` buttons, `#graph-nodes`, `.canvas[data-run]`. A copy would be 330 duplicated lines. The cost: if that client changes, this page's freshness test fails until `npm run af-page` is run, which is the warning we would want anyway.
2. **`iconSvg` comes from `lib/endToEnd/icons.ts`** rather than a new `icons.ts`. It is already generic: any Phosphor name.
3. **Three section titles are reworded** so they don't echo the reference page's headings. Chips and kickers are as the spec says.
   - "Two jobs, never mixed" → "Who does what"
   - "One feature, start to finish" → "One real feature, from reference to live"
   - "Four habits" → "What I do every time"
4. **Rule pins sit at a card's top left.** The send-back arc lands on Build's top centre from the right, so a top-right pin would sit on the arc.

## Review Focus

1. **A ball that takes the "fails" loop-back runs two dashed cables in a row** (check → fold → frame). Counted per cable, that would be two loop-backs and the route would vanish. It must count as one, so exactly 3 routes exist. *Pinned in Task 2:* "finds exactly three routes, each with at most one loop-back".
2. **Rule pins are buttons outside the step buttons,** never nested (a button inside a button is invalid and breaks clicks). *Pinned in Task 3:* "pins are their own buttons, never inside a step".
3. **The reused client throws nothing on this page,** whose figure has `class="canvas loop"` and no lanes. *Pinned in Task 4:* "loads and runs with no page errors".
4. **At phone width the page never scrolls sideways.** Tiles, the two-jobs grid and the timeline stack, and only the loop pans. *Pinned in Task 4:* "at phone width the page never scrolls sideways; the loop pans".
5. **Removing the doc dialog leaves no dead code or imports** (lint) and keeps `/projects#agentic-framework` working from ⌘K. *Pinned in Task 5:* `npm run lint`, `tests/commands.test.ts` unchanged, and "opens the Agentic Framework as its own page".

---

## File Structure

| File | Job |
|---|---|
| `data/agenticFramework.ts` (new) | Types and every word on the page |
| `lib/agenticFramework/layout.ts` (new) | `layoutLoop()`: step and pin positions, cable paths, ball routes |
| `lib/agenticFramework/styles.ts` (new) | `afCss()`: `pageCss` plus tiles, jobs, pins, timeline, closing line, glossary |
| `lib/agenticFramework/render.ts` (new) | `renderAgenticFramework()` → full HTML; `PAGE_PATH` |
| `scripts/make-af.ts`, `scripts/shoot-af.mjs` (new) | Write the page; photograph it for Home |
| `public/agentic-framework.html` (generated) | The page |
| `public/shots/agentic-framework.jpeg` (generated) | Home screenshot |
| `components/projects/AgenticFrameworkView.tsx` (new) | The card's window with the iframe |
| `components/projects/DocView.tsx` (deleted) | Nothing uses it any more |
| `data/projects.ts`, `data/projectDocs.ts`, `components/projects/ProjectViews.tsx`, `lib/seo.ts`, `package.json` | Wiring |
| `tests/agenticFramework-{data,layout,render}.test.ts`, `e2e/agentic-framework.spec.ts` (new) | Tests |
| `tests/projects.test.tsx`, `tests/no-ghl.test.ts`, `tests/seo.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts` | Updated tests |

---

### Task 1: Page content (`data/agenticFramework.ts`)

**Files:**
- Create: `data/agenticFramework.ts`
- Test: `tests/agenticFramework-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the types `SectionId`, `Section`, `RuleId`, `StepKind`, `LoopStep`, `Cable`, `LegendKey`, `Card`, `Rule`, `Stage` and `AgenticFramework`, plus `KIND_TYPES: Record<StepKind, string>` and `agenticFramework: AgenticFramework`.

- [ ] **Step 0: Branch.** `git checkout -b feat/agentic-framework`, then commit the spec and this plan: `git add docs/superpowers/specs/2026-10-01-agentic-framework-design.md docs/superpowers/plans/2026-10-01-agentic-framework.md && git commit -m "docs: Agentic Framework page spec and plan"` (with the Co-Authored-By line).

- [ ] **Step 1: Write the failing test** `tests/agenticFramework-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { agenticFramework as g, KIND_TYPES } from '@/data/agenticFramework'

const allText = () => JSON.stringify(g)

describe('the Agentic Framework data', () => {
  it('has the eight sections, in order, each with a chip, a kicker, a title and a line', () => {
    expect(g.sections.map((s) => s.id)).toEqual(['glance', 'jobs', 'tools', 'rules', 'loop', 'example', 'habits', 'glossary'])
    expect(g.sections.map((s) => s.chip)).toEqual(['At a glance', 'Two jobs', 'Tools', 'Rules', 'The loop', 'Example', 'Habits', 'Glossary'])
    for (const s of g.sections) for (const v of [s.kicker, s.title, s.blurb]) expect(v.length, s.id).toBeGreaterThan(3)
  })

  it('keeps the card’s three tools and four rules, word for word', () => {
    expect(g.tools.map((t) => t.title)).toEqual(['Claude Code', 'Cursor', 'Codex'])
    expect(g.tools[0].note).toBe('Opus for planning, Sonnet for volume')
    expect(g.rules.map((r) => `${r.mark} ${r.title}`)).toEqual([
      'R1 Write the spec first', 'R2 Every write is approval-gated', 'R3 Small units of work', 'R4 The model grades itself',
    ])
    expect(g.rules[0].text).toBe('If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.')
  })

  it('has three stages, two jobs of four lines each, and four habits', () => {
    expect(g.stages.map((s) => s.title)).toEqual(['Set up once', 'Build in small loops', 'Ship on a yes'])
    expect(g.jobs.columns.map((c) => [c.title, c.items.length])).toEqual([['Me', 4], ['The AI', 4]])
    expect(g.habits.map((h) => h.title)).toEqual(['Fresh session per task', 'Read every diff', 'No new asks mid-run', 'Check it on the real URL'])
    expect(g.closing).toBe('Done is a URL, not a diff.')
  })

  it('gives every loop step a unique id, a kind the panel can name, a short label and a plain description', () => {
    const ids = g.loop.steps.map((s) => s.id)
    expect(ids).toEqual(['task', 'frame', 'build', 'check', 'gate', 'live', 'fold'])
    for (const s of g.loop.steps) {
      expect(KIND_TYPES[s.kind], s.id).toBeTruthy()
      expect(s.label.length, s.label).toBeLessThanOrEqual(22)
      expect(s.sub.length, `${s.label}: ${s.sub}`).toBeLessThanOrEqual(22)
      expect(s.what.length, s.id).toBeGreaterThanOrEqual(20)
      expect(s.what.length, s.id).toBeLessThanOrEqual(220)
      expect(s.what, s.id).toMatch(/\.$/)
    }
  })

  it('never puts two steps in one spot', () => {
    const spots = g.loop.steps.map((s) => s.at.join(','))
    expect(new Set(spots).size).toBe(spots.length)
  })

  it('joins every cable to real steps, starts only at the task and ends only at Shipped', () => {
    const ids = new Set(g.loop.steps.map((s) => s.id))
    for (const c of g.loop.cables) expect(ids.has(c.from) && ids.has(c.to), `${c.from} → ${c.to}`).toBe(true)
    const starts = g.loop.steps.filter((s) => !g.loop.cables.some((c) => c.to === s.id)).map((s) => s.id)
    const ends = g.loop.steps.filter((s) => !g.loop.cables.some((c) => c.from === s.id)).map((s) => s.id)
    expect(starts).toEqual(['task'])
    expect(ends).toEqual(['live'])
  })

  it('flows one way: without the loop-backs, the cables never go round in a circle', () => {
    const flow = g.loop.cables.filter((c) => c.kind === 'flow')
    const left = new Map(g.loop.steps.map((s) => [s.id, flow.filter((c) => c.to === s.id).length]))
    const queue = g.loop.steps.filter((s) => left.get(s.id) === 0).map((s) => s.id)
    let seen = 0
    while (queue.length) {
      const id = queue.shift()!
      seen++
      for (const c of flow.filter((c) => c.from === id)) {
        left.set(c.to, left.get(c.to)! - 1)
        if (left.get(c.to) === 0) queue.push(c.to)
      }
    }
    expect(seen).toBe(g.loop.steps.length)
  })

  it('draws the spec’s loop-backs with their labels, and one approval gate', () => {
    const loops = g.loop.cables.filter((c) => c.kind === 'loop').map((c) => `${c.from}→${c.to}:${c.label}`)
    expect(loops.sort()).toEqual(['check→fold:fails', 'fold→frame:becomes a rule', 'gate→build:send back'])
    expect(g.loop.steps.filter((s) => s.kind === 'gate').map((s) => s.id)).toEqual(['gate'])
  })

  it('pins each rule once, where it applies', () => {
    expect(Object.fromEntries(g.loop.steps.filter((s) => s.rule).map((s) => [s.id, s.rule]))).toEqual({ frame: 'R1', build: 'R3', check: 'R4', gate: 'R2' })
  })

  it('has a five-item legend, each with a meaning', () => {
    expect(g.loop.legend.map((k) => k.id)).toEqual(['cable', 'signal', 'loop', 'gate', 'pin'])
    for (const k of g.loop.legend) expect(k.what, k.id).toMatch(/\.$/)
  })

  it('follows the End-to-End page through the loop in six steps, linking to it', () => {
    expect(g.example.items.map((i) => i.stage)).toEqual(['Frame', 'Frame', 'Build', 'Check', 'Fold back', 'Ship'])
    expect(g.example.items[3].text).toContain('a fresh reviewer model')
    expect(g.example.items[3].text).not.toContain('Codex')
    expect(g.example.link.href).toBe('/end-to-end.html')
  })

  it('explains every glossary term, and each one is used elsewhere on the page', () => {
    const elsewhere = JSON.stringify({ ...g, glossary: [] }).toLowerCase()
    expect(g.glossary.length).toBeGreaterThanOrEqual(18)
    for (const [term, meaning] of g.glossary) {
      expect(elsewhere, term).toContain(term.toLowerCase())
      expect(meaning, term).toMatch(/\.$/)
    }
  })

  it('uses curly quotes only and never mentions GoHighLevel', () => {
    expect(allText()).not.toContain("'")
    expect(allText()).not.toContain('\\"')
    expect(allText()).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
```

- [ ] **Step 2: Run it to see it fail.**

Run: `npx vitest run tests/agenticFramework-data.test.ts`
Expected: FAIL, because `@/data/agenticFramework` cannot be found.

- [ ] **Step 3: Write `data/agenticFramework.ts`:**

```ts
/**
 * The Agentic Framework page's content (spec 2026-10-01-agentic-framework):
 * how Justine builds with AI, drafted from the card. The tools and rules are
 * the card's own words. public/agentic-framework.html is generated from it:
 * npm run af-page
 */
export type SectionId = 'glance' | 'jobs' | 'tools' | 'rules' | 'loop' | 'example' | 'habits' | 'glossary'
export type Section = { id: SectionId; chip: string; kicker: string; title: string; blurb: string }
export type RuleId = 'R1' | 'R2' | 'R3' | 'R4'
export type StepKind = 'start' | 'step' | 'gate' | 'end'
/** A step on the loop. `at` is its [column, row]. `rule` pins one of the four rules to it. */
export type LoopStep = { id: string; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; rule?: RuleId }
export type Cable = { from: string; to: string; kind: 'flow' | 'loop'; label?: string }
export type LegendKey = { id: 'cable' | 'signal' | 'loop' | 'gate' | 'pin'; label: string; what: string }
/** A tile in a row: its mark (a number or a rule id), a Phosphor icon name, a title, a line, and an optional note. */
export type Card = { mark: string; icon: string; title: string; text: string; note?: string }
export type Rule = Card & { mark: RuleId }
export type Stage = 'Frame' | 'Build' | 'Check' | 'Fold back' | 'Ship'
export type AgenticFramework = {
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  stance: string
  stack: { name: string; icon: string }[]
  sections: Section[]
  stages: Card[]
  jobs: { columns: { title: string; items: string[] }[]; line: string }
  tools: Card[]
  rules: Rule[]
  loop: { caption: string; steps: LoopStep[]; cables: Cable[]; legend: LegendKey[] }
  example: { items: { stage: Stage; text: string }[]; link: { label: string; href: string } }
  habits: Card[]
  closing: string
  glossary: [string, string][]
  footer: { note: string; by: string }
}

/** What the click panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = { start: 'START', step: 'STEP', gate: 'APPROVAL GATE', end: 'END' }

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

export const agenticFramework: AgenticFramework = {
  title: 'Agentic Framework · Justine Acosta',
  description: 'How Justine Acosta builds with AI: the tools, the rules and the loop, with one real feature taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'HOW I BUILD WITH AI',
  heading: 'The Agentic Framework',
  lede: 'The tools, the rules, and the loop I use to ship apps with AI instead of chatting with it.',
  stance: 'I make the calls. The AI does the typing.',
  stack: [
    { name: 'Claude Code', icon: 'TerminalWindow' },
    { name: 'Cursor', icon: 'Cursor' },
    { name: 'Codex', icon: 'Code' },
  ],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps the loop honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Three tools, one job each', blurb: 'Each one has a job. I do not use three where one will do.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'Non-negotiable, and they are what keep the output usable.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated until the criteria pass. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A REAL EXAMPLE', title: 'One real feature, from reference to live', blurb: 'The End-to-End Workflow page, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the loop works.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file (CLAUDE.md), my notes and the three tools, wired before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One small piece per run, repeated until the criteria pass.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing reaches a repo, a client or a send button until I approve it.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what done means', 'Approve every write', 'Take over when precision beats speed', 'Turn mistakes into rules'] },
      { title: 'The AI', items: ['Read the files that matter', 'Write the code and the tests', 'Run it and grade itself against the criteria', 'Report back with the diff'] },
    ],
    line: 'When the AI starts deciding scope, or I start typing boilerplate, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', title: 'Claude Code', text: 'The builder. Long tasks, real files, subagents for anything that can run in parallel.', note: 'Opus for planning, Sonnet for volume' },
    { mark: '02', icon: 'Cursor', title: 'Cursor', text: 'The editor. Where I read what was written and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', title: 'Codex', text: 'The second opinion. A fresh model reviewing a diff catches what the author missed.', note: 'Review pass, not a build pass' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches a client account, a repo, or a send button unreviewed.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'Small units of work', text: 'One task, one context. A fresh session beats a long one every time.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The model grades itself', text: 'Acceptance criteria go in with the task, and the output is checked against them before I look.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 7 steps, 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A task', sub: 'One small piece', icon: 'ClipboardText', what: 'One small piece of work, small enough that I can describe done in a paragraph. Anything bigger gets split first.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', rule: 'R1', what: 'I set the outcome, the constraints and the files that matter, then write the spec with its acceptance criteria. Opus helps plan, and nothing else goes into the context.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', rule: 'R3', what: 'Claude Code builds from the spec, test-first, with subagents for parts that can run at once. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · Cursor', icon: 'MagnifyingGlass', rule: 'R4', what: 'It runs, it grades itself against the criteria, and Codex reads the diff as a second opinion. I read it in Cursor before I trust it.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing reaches a repo, a client or a send button until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Live on the URL', icon: 'RocketLaunch', what: 'Shipped means live: I open the real URL and use it. Then the next small piece starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in CLAUDE.md or a new test, so the next run does not repeat it.' },
    ],
    cables: [
      flow('task', 'frame'),
      flow('frame', 'build'),
      flow('build', 'check'),
      flow('check', 'gate', 'passes'),
      flow('gate', 'live', 'approved'),
      loop('check', 'fold', 'fails'),
      loop('fold', 'frame', 'becomes a rule'),
      loop('gate', 'build', 'send back'),
    ],
    legend: [
      { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' },
      { id: 'signal', label: 'Live signal', what: 'A ball is one task going round the loop right now.' },
      { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step.' },
      { id: 'gate', label: 'Approval gate', what: 'The loop stops here until I say yes.' },
      { id: 'pin', label: 'Rule pin', what: 'One of my four rules, applied at this step. Click a pin to read it.' },
    ],
  },
  example: {
    items: [
      { stage: 'Frame', text: 'Studied a reference page for its shape only, then answered the design questions one at a time.' },
      { stage: 'Frame', text: 'Wrote the spec and ticked every line of it before any code. Then a six-task plan, with the code for each task.' },
      { stage: 'Build', text: 'Built each task test-first: write the test, watch it fail, make it pass.' },
      { stage: 'Check', text: '511 unit tests and 194 browser tests green. Then a fresh reviewer model read the whole branch and found four bugs.' },
      { stage: 'Fold back', text: 'Each bug got a test that failed first, then the fix. Two lessons became permanent tests: labels fit on one line, and the drag test waits for the page to settle.' },
      { stage: 'Ship', text: 'I checked it, said “push, PR, merge”, the checks passed, and it went live.' },
    ],
    link: { label: 'See it: The End-to-End Workflow →', href: '/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per task', text: 'A long chat drifts. I close it and start clean with the spec.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff', text: 'I read what was written before it goes anywhere. No exceptions for small changes.' },
    { mark: '3', icon: 'HandPalm', title: 'No new asks mid-run', text: 'A new idea waits for the next loop, so the current one can finish.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the real URL', text: 'Tests passing is not the end. I open the live page and use it.' },
  ],
  closing: 'Done is a URL, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['Cursor', 'A code editor with AI built in, where I read and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Acceptance criteria', 'The checks the work must pass to count as done.'],
    ['Subagent', 'A helper AI the main one hands a side task to, so parts run at once.'],
    ['Diff', 'The exact lines a change adds and removes.'],
    ['Second opinion', 'A different model reading the work, to catch what the author missed.'],
    ['Approval gate', 'A point where the work stops until a person says yes.'],
    ['CLAUDE.md', 'The rules file Claude Code reads at the start of every session.'],
    ['Loop-back', 'A cable that sends the work back to an earlier step.'],
    ['Fold back', 'Turning a mistake into a rule or a test, so it does not happen again.'],
    ['Fresh session', 'A new, empty AI chat, started clean for the next task.'],
    ['Test-first', 'Writing the test before the code, and watching it fail first.'],
    ['Reviewer model', 'A fresh AI model asked only to review finished work.'],
  ],
  footer: { note: 'The loop as I run it today.', by: 'Built by Justine Acosta' },
}
```

- [ ] **Step 4: Run it to see it pass.**

Run: `npx vitest run tests/agenticFramework-data.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Commit.** `git add data/agenticFramework.ts tests/agenticFramework-data.test.ts && git commit -m "feat: Agentic Framework page content: tools, rules, the loop, the End-to-End example"` (with the Co-Authored-By line).

---

### Task 2: The loop's layout (`lib/agenticFramework/layout.ts`)

**Files:**
- Create: `lib/agenticFramework/layout.ts`
- Test: `tests/agenticFramework-layout.test.ts`

**Interfaces:**
- Consumes: `AgenticFramework['loop']` and `Cable` from Task 1.
- Produces:
  - `GEOM = { col: 168, row: 150, node: 56, padX: 64, top: 96, label: 44, padB: 24 }`
  - `layoutLoop(loop) => LoopLayout`, where `LoopLayout` is `{ nodes: Record<string, {x, y}>; pins: Record<string, {x, y}>; cables: LaidCable[]; width: number; height: number; routes: Route[] }`
  - `LaidCable = Cable & { d: string; len: number; mid: [number, number]; start; end; pts: [number, number][] }`
  - `Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][]; loops: number }`. This is the same route shape as End-to-End, which the reused client reads as `{len, stops, spans}`.

- [ ] **Step 1: Write the failing test** `tests/agenticFramework-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { agenticFramework as g } from '@/data/agenticFramework'
import { GEOM, layoutLoop } from '@/lib/agenticFramework/layout'

const l = layoutLoop(g.loop)
const N = GEOM.node
type B = { x: number; y: number; w: number; h: number }
const card = (id: string): B => ({ x: l.nodes[id].x, y: l.nodes[id].y, w: N, h: N })
const name = (id: string): B => ({ x: l.nodes[id].x + N / 2 - 68, y: l.nodes[id].y + N + 4, w: 136, h: GEOM.label - 8 })
const inside = (p: [number, number], b: B) => p[0] > b.x && p[0] < b.x + b.w && p[1] > b.y && p[1] < b.y + b.h
const hit = (a: B, b: B) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h

describe('layoutLoop', () => {
  it('lays row 0 left to right on one line, with Fold back a row below Build', () => {
    const row0 = ['task', 'frame', 'build', 'check', 'gate', 'live']
    for (let i = 1; i < row0.length; i++) {
      expect(l.nodes[row0[i]].y).toBe(l.nodes[row0[0]].y)
      expect(l.nodes[row0[i]].x - l.nodes[row0[i - 1]].x).toBe(GEOM.col)
    }
    expect(l.nodes.fold).toEqual({ x: l.nodes.build.x, y: l.nodes.build.y + GEOM.row })
    expect(l.width).toBe(GEOM.padX * 2 + 5 * GEOM.col + N)
    expect(l.height).toBe(GEOM.top + GEOM.row + N + GEOM.label + GEOM.padB)
  })

  it('never lets two steps, or their names, overlap, and keeps them inside the frame', () => {
    const boxes = g.loop.steps.map((s) => ({ id: s.id, b: { x: l.nodes[s.id].x + N / 2 - 68, y: l.nodes[s.id].y, w: 136, h: N + GEOM.label } }))
    for (const { id, b } of boxes) expect(b.x >= 0 && b.x + b.w <= l.width && b.y >= 0 && b.y + b.h <= l.height, id).toBe(true)
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) expect(hit(boxes[i].b, boxes[j].b), `${boxes[i].id} × ${boxes[j].id}`).toBe(false)
  })

  it('keeps every cable clear of the steps it does not connect, and inside the frame', () => {
    for (const c of l.cables) {
      for (const p of c.pts) expect(p[0] >= 0 && p[0] <= l.width && p[1] >= 0 && p[1] <= l.height, `${c.from} → ${c.to}`).toBe(true)
      for (const s of g.loop.steps) {
        if (s.id === c.from || s.id === c.to) continue
        const bad = c.pts.find((p) => inside(p, card(s.id)) || inside(p, name(s.id)))
        expect(bad, `${c.from} → ${c.to} crosses ${s.id}`).toBeUndefined()
      }
    }
  })

  it('arcs the send-back over the top of row 0, and drops the fail to Fold back under it', () => {
    const back = l.cables.find((c) => c.from === 'gate' && c.to === 'build')!
    expect(Math.max(...back.pts.map((p) => p[1]))).toBeLessThanOrEqual(l.nodes.build.y)
    const fails = l.cables.find((c) => c.from === 'check' && c.to === 'fold')!
    expect(Math.min(...fails.pts.map((p) => p[1]))).toBeGreaterThanOrEqual(l.nodes.check.y + N)
  })

  it('puts every cable label well inside the frame', () => {
    for (const c of l.cables.filter((c) => c.label)) {
      expect(c.mid[0], c.label).toBeGreaterThanOrEqual(60)
      expect(c.mid[0], c.label).toBeLessThanOrEqual(l.width - 60)
      expect(c.mid[1], c.label).toBeGreaterThanOrEqual(16)
      expect(c.mid[1], c.label).toBeLessThanOrEqual(l.height - 16)
    }
  })

  it('pins the four rules at their cards’ top left', () => {
    expect(Object.keys(l.pins).sort()).toEqual(['build', 'check', 'frame', 'gate'])
    for (const [id, p] of Object.entries(l.pins)) expect(p).toEqual({ x: l.nodes[id].x - 10, y: l.nodes[id].y - 10 })
  })

  it('finds exactly three routes, each with at most one loop-back, from the task to Shipped', () => {
    expect(l.routes).toHaveLength(3)
    for (const r of l.routes) {
      expect(r.nodes[0]).toBe('task')
      expect(r.nodes.at(-1)).toBe('live')
      expect(r.loops).toBeLessThanOrEqual(1)
    }
    expect(l.routes.map((r) => r.nodes.join(' ')).sort()).toEqual([
      'task frame build check fold frame build check gate live',
      'task frame build check gate build check gate live',
      'task frame build check gate live',
    ])
  })

  it('between them, the routes pass every step and every cable', () => {
    expect(new Set(l.routes.flatMap((r) => r.nodes))).toEqual(new Set(g.loop.steps.map((s) => s.id)))
    expect(new Set(l.routes.flatMap((r) => r.spans.map(([k]) => k)))).toEqual(new Set(g.loop.cables.map((_, k) => k)))
  })

  it('times each route: stops in order along it, spans inside it, and a run path from the first step', () => {
    for (const r of l.routes) {
      expect(r.stops.map(([id]) => id)).toEqual(r.nodes)
      for (let i = 1; i < r.stops.length; i++) expect(r.stops[i][1]).toBeGreaterThan(r.stops[i - 1][1])
      expect(r.stops.at(-1)![1]).toBe(r.length)
      for (const [, from, to] of r.spans) expect(from >= 0 && to <= r.length && to > from).toBe(true)
      expect(r.run).toMatch(/^M[\d.]+ [\d.]+/)
    }
  })

  it('refuses a cable to a missing step', () => {
    expect(() => layoutLoop({ ...g.loop, cables: [...g.loop.cables, { from: 'task', to: 'nowhere', kind: 'flow' }] })).toThrow(/missing step/)
  })
})
```

- [ ] **Step 2: Run it to see it fail.**

Run: `npx vitest run tests/agenticFramework-layout.test.ts`
Expected: FAIL, because `@/lib/agenticFramework/layout` cannot be found.

- [ ] **Step 3: Write `lib/agenticFramework/layout.ts`:**

```ts
import type { AgenticFramework, Cable } from '../../data/agenticFramework.ts'

/**
 * The loop's grid, in px (spec §4.2): column and row pitch, step size, side
 * margin, the room above row 0 for the send-back arc, the room under a step
 * for its name, and the bottom margin.
 */
export const GEOM = { col: 168, row: 150, node: 56, padX: 64, top: 96, label: 44, padB: 24 } as const

type Pt = [number, number]
export type Placed = { x: number; y: number }
/** A cable as drawn: its SVG path, length, where its label sits, its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; start: Pt; end: Pt; pts: Pt[] }
/** One way round the loop for a ball, timed like End-to-End's routes (its client reads them). */
export type Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][]; loops: number }
export type LoopLayout = { nodes: Record<string, Placed>; pins: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

const round = (n: number) => Math.round(n * 10) / 10

/** One cubic Bézier from a to b: its path, its length, points along it, and its halfway point. */
function curve(a: Pt, c1: Pt, c2: Pt, b: Pt) {
  const at = (t: number): Pt => {
    const u = 1 - t
    return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]) as Pt
  }
  const pts: Pt[] = [a]
  let len = 0
  for (let i = 1; i <= 48; i++) {
    const p = at(i / 48)
    len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])
    pts.push(p)
  }
  const d = `M${round(a[0])} ${round(a[1])}C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(b[0])} ${round(b[1])}`
  return { d, len: round(len), pts, mid: at(0.5), start: a, end: b }
}

/**
 * Places the loop (spec §4.2). Each step sits on the grid at `at`; a pinned
 * rule sits at its card's top left. Cables are drawn one of four ways:
 * - along a row, left to right: port to port;
 * - back along a row: an arc over the top;
 * - down a row: out under the step's name, into the lower step's right side;
 * - up a row: out of the step's left side, up into the step from under its name.
 * Routes: every way from the start to the end that takes at most one
 * loop-back, where a run of dashed cables (fails, then becomes a rule) is one.
 */
export function layoutLoop(loop: AgenticFramework['loop']): LoopLayout {
  const { col: C, row: R, node: N, padX, top, label, padB } = GEOM
  const { steps, cables: list } = loop
  const ids = steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const c of list) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)

  const width = padX * 2 + Math.max(...steps.map((s) => s.at[0])) * C + N
  const height = top + Math.max(...steps.map((s) => s.at[1])) * R + N + label + padB
  const nodes: Record<string, Placed> = {}
  for (const s of steps) nodes[s.id] = { x: padX + s.at[0] * C, y: top + s.at[1] * R }
  const pins: Record<string, Placed> = {}
  for (const s of steps) if (s.rule) pins[s.id] = { x: nodes[s.id].x - 10, y: nodes[s.id].y - 10 }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  const under = (id: string) => nodes[id].y + N + label - 4

  const cables: LaidCable[] = list.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    if (s.at[1] === t.at[1] && t.at[0] > s.at[0]) {
      const a: Pt = [nodes[s.id].x + N, cy(s.id)]
      const b: Pt = [nodes[t.id].x, cy(t.id)]
      const dx = (b[0] - a[0]) / 2
      return { ...c, ...curve(a, [a[0] + dx, a[1]], [b[0] - dx, b[1]], b) }
    }
    if (s.at[1] === t.at[1]) {
      const a: Pt = [cx(s.id), nodes[s.id].y]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      return { ...c, ...curve(a, [a[0], a[1] - 70], [b[0], b[1] - 70], b) }
    }
    if (t.at[1] > s.at[1]) {
      const a: Pt = [cx(s.id), under(s.id)]
      const b: Pt = [nodes[t.id].x + N, cy(t.id)]
      return { ...c, ...curve(a, [a[0], b[1]], [a[0], b[1]], b) }
    }
    const a: Pt = [nodes[s.id].x, cy(s.id)]
    const b: Pt = [cx(t.id), under(t.id)]
    return { ...c, ...curve(a, [b[0], a[1]], [b[0], a[1]], b) }
  })

  const outs = new Map<string, number[]>()
  cables.forEach((c, k) => outs.set(c.from, [...(outs.get(c.from) ?? []), k]))
  type Found = { nodes: string[]; hops: number[]; loops: number }
  const found: Found[] = []
  const walk = (path: string[], hops: number[], loops: number) => {
    if (path.length > 64) return
    const out = outs.get(path[path.length - 1]) ?? []
    if (!out.length) {
      found.push({ nodes: path, hops, loops })
      return
    }
    for (const k of out) {
      const prev = hops.length ? cables[hops[hops.length - 1]] : null
      const starts = cables[k].kind === 'loop' && prev?.kind !== 'loop'
      if (starts && loops >= 1) continue
      walk([...path, cables[k].to], [...hops, k], loops + (starts ? 1 : 0))
    }
  }
  for (const s of steps) if (!list.some((c) => c.to === s.id)) walk([s.id], [], 0)

  // A ball starts at its first step's centre, runs along each cable and through each step's centre.
  const measure = (r: Found): Route => {
    let pos: Pt = [cx(r.nodes[0]), cy(r.nodes[0])]
    let at = 0
    let run = `M${round(pos[0])} ${round(pos[1])}`
    const stops: [string, number][] = [[r.nodes[0], 0]]
    const spans: [number, number, number][] = []
    r.hops.forEach((k, i) => {
      const c = cables[k]
      at += Math.hypot(c.start[0] - pos[0], c.start[1] - pos[1])
      run += `L${round(c.start[0])} ${round(c.start[1])}${c.d.replace(/^M[^C]*/, '')}`
      spans.push([k, round(at), round(at + c.len)])
      at += c.len
      const next: Pt = [cx(r.nodes[i + 1]), cy(r.nodes[i + 1])]
      at += Math.hypot(next[0] - c.end[0], next[1] - c.end[1])
      run += `L${round(next[0])} ${round(next[1])}`
      stops.push([r.nodes[i + 1], round(at)])
      pos = next
    })
    return { nodes: r.nodes, run, length: round(at), stops, spans, loops: r.loops }
  }

  return { nodes, pins, cables, width, height, routes: found.map(measure) }
}
```

- [ ] **Step 4: Run it to see it pass.**

Run: `npx vitest run tests/agenticFramework-layout.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit.** `git add lib/agenticFramework/layout.ts tests/agenticFramework-layout.test.ts && git commit -m "feat: lay out the Agentic Framework loop: steps, pins, cables, three ball routes"` (with the Co-Authored-By line).

---

### Task 3: The page render (`styles.ts`, `render.ts`)

**Files:**
- Create: `lib/agenticFramework/styles.ts`, `lib/agenticFramework/render.ts`
- Test: `tests/agenticFramework-render.test.ts` (the freshness `describe` is added in Task 4)

**Interfaces:**
- Consumes:
  - From Task 1: `agenticFramework`, `KIND_TYPES` and the types.
  - From Task 2: `layoutLoop`.
  - Read-only: `esc` (build plan render), `pageCss` and `Themes` (build plan styles), `iconSvg` (End-to-End icons), `readTokens` and `readContrast` (`lib/tokens.ts`), and the text of `lib/endToEnd/client.js`.
- Produces: `PAGE_PATH = '/agentic-framework.html'`, `renderAgenticFramework(g?: AgenticFramework, themes?: Themes): string` and `afCss(themes: Themes): string`.

- [ ] **Step 1: Write the failing test** `tests/agenticFramework-render.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agenticFramework as g, type AgenticFramework } from '@/data/agenticFramework'
import { layoutLoop } from '@/lib/agenticFramework/layout'
import { renderAgenticFramework } from '@/lib/agenticFramework/render'
import { iconSvg } from '@/lib/endToEnd/icons'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAgenticFramework()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)

describe('renderAgenticFramework', () => {
  it('opens with the title, the card’s line, the stance and the three tools', () => {
    expect(doc.title).toBe(g.title)
    expect(doc.querySelector('h1')!.textContent).toBe('The Agentic Framework')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.stance')!.textContent).toBe('I make the calls. The AI does the typing.')
    expect([...doc.querySelectorAll('.stack li')].map((li) => li.textContent)).toEqual(['Claude Code', 'Cursor', 'Codex'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/agentic-framework.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the eight sections, each pointing at its section', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(doc.querySelector('nav.toc')!.getAttribute('aria-label')).toBe('Sections')
    expect(chips.map((a) => a.textContent)).toEqual(g.sections.map((s) => s.chip))
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.sections.map((s) => `#${s.id}`))
    for (const s of g.sections) expect(doc.querySelector(`section#${s.id} h2`)!.textContent).toBe(s.title)
  })

  it('shows the stages, the two jobs, the tools, the rules and the habits as tiles', () => {
    expect(doc.querySelectorAll('#glance .tile')).toHaveLength(3)
    expect(doc.querySelectorAll('#tools .tile')).toHaveLength(3)
    expect([...doc.querySelectorAll('#rules .tile-mark')].map((m) => m.textContent)).toEqual(['R1', 'R2', 'R3', 'R4'])
    expect(doc.querySelectorAll('#habits .tile')).toHaveLength(4)
    expect(doc.querySelector('#habits .closing')!.textContent).toBe('Done is a URL, not a diff.')
    expect([...doc.querySelectorAll('#jobs .job h3')].map((h) => h.textContent)).toEqual(['Me', 'The AI'])
    expect(doc.querySelectorAll('#jobs .job li')).toHaveLength(8)
    expect(doc.querySelector('#jobs .jobs-line')!.textContent).toBe(g.jobs.line)
  })

  it('draws every loop step as a button with its description, and the gate with a lock', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('#loop button.node')]
    expect(buttons.map((b) => b.dataset.node)).toEqual(g.loop.steps.map((s) => s.id))
    for (const s of g.loop.steps) {
      expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
      expect(!!doc.querySelector(`button.node[data-node="${s.id}"] .badge-lock`), s.id).toBe(s.kind === 'gate')
    }
    expect(data().gate.type).toBe('APPROVAL GATE')
  })

  it('pins are their own buttons, never inside a step, and each explains its rule', () => {
    const pins = [...doc.querySelectorAll<HTMLButtonElement>('#loop button.pin')]
    expect(pins.map((p) => p.dataset.node)).toEqual(['rule:R1', 'rule:R3', 'rule:R4', 'rule:R2'])
    for (const p of pins) expect(p.closest('button.node')).toBeNull()
    expect(data()['rule:R1']).toMatchObject({ label: 'Write the spec first', type: 'RULE R1', what: g.rules[0].text })
    expect(pins[0].getAttribute('aria-label')).toBe('Rule R1: Write the spec first')
  })

  it('makes the five legend keys clickable, each with its meaning', () => {
    const keys = [...doc.querySelectorAll<HTMLElement>('#loop .legend button[data-node]')]
    expect(keys.map((k) => k.dataset.node)).toEqual(g.loop.legend.map((k) => `key:${k.id}`))
    for (const k of keys) expect(data()[k.dataset.node!].what).toMatch(/\.$/)
  })

  it('draws every cable, loop-backs dashed, with its label', () => {
    expect(doc.querySelectorAll('#loop .edge[data-edge]')).toHaveLength(g.loop.cables.length)
    expect(doc.querySelectorAll('#loop .edge.loop')).toHaveLength(3)
    expect([...doc.querySelectorAll('#loop .edge-label')].map((e) => e.textContent).sort()).toEqual(['approved', 'becomes a rule', 'fails', 'passes', 'send back'])
  })

  it('sends balls down the layout’s three routes, with the timing the page needs to light steps up', () => {
    const f = doc.querySelector<HTMLElement>('figure.canvas')!
    expect(f.hasAttribute('data-run')).toBe(true)
    const routes = JSON.parse(f.dataset.routes!) as { len: number; stops: [string, number][]; spans: [number, number, number][] }[]
    expect(routes).toHaveLength(layoutLoop(g.loop).routes.length)
    expect(f.querySelectorAll('.run-dot')).toHaveLength(3)
    for (const r of routes) for (const [key] of r.stops) expect(f.querySelector(`.node[data-node="${key}"]`), key).not.toBeNull()
  })

  it('lists the loop for screen readers, and scrolls in its own frame', () => {
    expect(doc.querySelectorAll('#loop ol.steps.sr-only li')).toHaveLength(g.loop.steps.length)
    expect(doc.querySelector('#loop ol.steps')!.textContent).toContain('Check (Codex · Cursor), rule R4, then Approval if passes; Fold back if fails')
    expect(doc.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
  })

  it('follows the End-to-End page in six tagged steps, linking to it in the top window', () => {
    const items = [...doc.querySelectorAll('#example ol.timeline li')]
    expect(items).toHaveLength(6)
    expect(items.map((li) => li.querySelector('.tag')!.textContent)).toEqual(['Frame', 'Frame', 'Build', 'Check', 'Fold back', 'Ship'])
    expect(items[4].querySelector('.tag')!.classList.contains('t-fold-back')).toBe(true)
    const see = doc.querySelector('#example a.see')!
    expect(see.getAttribute('href')).toBe('/end-to-end.html')
    expect(see.getAttribute('target')).toBe('_top')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(g.glossary.length)
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
    expect(html).toContain(':root[data-embedded] .home{display:none}')
  })

  it('runs End-to-End’s client as it is', () => {
    expect(html).toContain(readFileSync('lib/endToEnd/client.js', 'utf8').replace(/\r\n/g, '\n'))
  })

  it('wears Kraft’s tokens and the site’s contrast settings', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=light]){--ink2:${readContrast().dark.ink2}`)
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'task"><i>y</i>'
    const evil: AgenticFramework = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      loop: {
        ...g.loop,
        steps: g.loop.steps.map((s) => (s.id === 'task' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
        cables: g.loop.cables.map((c) => (c.from === 'task' ? { ...c, from: bad } : c)),
      },
    }
    const out = renderAgenticFramework(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the page names', () => {
    for (const name of [...g.stack, ...g.stages, ...g.tools, ...g.rules, ...g.habits, ...g.loop.steps].map((x) => x.icon)) expect(iconSvg(name), name).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})
```

- [ ] **Step 2: Run it to see it fail.**

Run: `npx vitest run tests/agenticFramework-render.test.ts`
Expected: FAIL, because `@/lib/agenticFramework/render` cannot be found.

- [ ] **Step 3: Write `lib/agenticFramework/styles.ts`:**

```ts
import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The Agentic Framework page's CSS: the build plan's look (imported as it is,
 * never edited), plus tiles, the two jobs, rule pins, the timeline, the
 * closing line and the glossary (spec §4).
 */
export function afCss(themes: Themes): string {
  return `${pageCss(themes)}
.page>section{display:flex;flex-direction:column;gap:20px}
.stance{font-weight:600;color:var(--ink)}
.stack{display:flex;flex-direction:row;flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none}
.stack li{display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;border:1px solid var(--b1);background:var(--s1);font-size:.8125rem;color:var(--ink2)}
.stack svg{color:var(--accent)}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px;margin:0;padding:0;list-style:none}
.tile{display:flex;flex-direction:column;gap:8px;min-width:0;padding:18px;border-radius:16px;border:1px solid var(--b1);background:var(--s1)}
.tile-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.tile-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;border:1px solid var(--b1);background:var(--chip);color:var(--accent)}
.tile-mark{font-family:var(--mono);font-size:.625rem;letter-spacing:.14em;color:var(--ink3)}
.tile h3{font-size:1rem;letter-spacing:-.01em}
.tile p{font-size:.875rem;color:var(--ink2)}
.tile-note{margin-top:auto;padding-top:4px;font-family:var(--mono);font-size:.6875rem;color:var(--ink3)}
.jobs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (max-width:640px){.jobs{grid-template-columns:minmax(0,1fr)}}
.job{display:flex;flex-direction:column;gap:10px;min-width:0;padding:18px;border-radius:16px;border:1px solid var(--b1);background:var(--s1)}
.job:first-child{border-color:var(--washB);background:var(--wash)}
.job h3{font-family:var(--mono);font-size:.6875rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.job ul{gap:6px}
.jobs-line{max-width:62ch;color:var(--ink3)}
.legend .line{display:inline-block;width:26px;border-top:2px solid var(--b2)}
.legend .line-signal{width:10px;height:10px;border:0;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash)}
.legend .line-loop{border-top:2px dashed var(--accent)}
.legend .badge-lock{position:static}
.edge.loop{stroke:color-mix(in srgb,var(--accent) 55%,var(--b2));stroke-dasharray:5 5}
.edge.loop.lit{stroke:var(--accent)}
.badge-lock{position:absolute;right:-8px;bottom:-8px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);color:var(--accent)}
.k-approve .node-card{outline:2px solid var(--accent);outline-offset:3px}
.pin{position:absolute;z-index:2;display:grid;place-items:center;width:22px;height:22px;padding:0;border-radius:50%;border:1px solid var(--accent);background:var(--s0);color:var(--accent);font-family:var(--mono);font-size:.5625rem;font-weight:500;cursor:pointer}
.pin:hover,.pin[aria-expanded=true]{background:var(--accent);color:var(--onAccent)}
.pin-sample{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--accent);font-family:var(--mono);font-size:.5rem;color:var(--accent)}
.timeline{display:flex;flex-direction:column;gap:0;margin:0;padding:0;list-style:none}
.timeline li{display:grid;grid-template-columns:28px 92px minmax(0,1fr);gap:12px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--b1)}
@media (max-width:560px){.timeline li{grid-template-columns:28px minmax(0,1fr)}.timeline li p{grid-column:2}}
.timeline p{color:var(--ink2)}
.tl-n{font-family:var(--mono);font-size:.75rem;color:var(--ink3)}
.tag{justify-self:start;padding:2px 8px;border-radius:999px;border:1px solid var(--b2);font-family:var(--mono);font-size:.625rem;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);white-space:nowrap}
.t-frame{border-color:var(--accent);color:var(--accent)}
.t-build{border-color:var(--washB);background:var(--wash);color:var(--accent)}
.t-check{border-color:var(--ink3);color:var(--ink)}
.t-fold-back{border-style:dashed;border-color:var(--accent);color:var(--accent)}
.t-ship{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.see{align-self:flex-start;font-weight:600;text-decoration:none}
.closing{font-size:clamp(1.6rem,4vw,2.5rem);font-weight:700;line-height:1.1;letter-spacing:-.03em;text-wrap:balance;color:var(--ink)}
.gl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;margin:0}
@media (max-width:760px){.gl{grid-template-columns:minmax(0,1fr)}}
.gl div{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--b1)}
.gl dt{font-family:var(--mono);font-size:.75rem;color:var(--accent)}
.gl dd{margin:0;font-size:.875rem;color:var(--ink2)}
@media print{
.tile,.job,.tag,.pin,.node-card,.badge-lock{print-color-adjust:exact;-webkit-print-color-adjust:exact}
}
`
}
```

- [ ] **Step 4: Write `lib/agenticFramework/render.ts`:**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { agenticFramework as AF, KIND_TYPES, type AgenticFramework, type Card, type SectionId, type Stage, type StepKind } from '../../data/agenticFramework.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutLoop } from './layout.ts'
import { afCss } from './styles.ts'

/** Where the page is served (public/agentic-framework.html). */
export const PAGE_PATH = '/agentic-framework.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
/** Each kind wears one of the build plan's step looks. */
const LOOK: Record<StepKind, string> = { start: 'trigger', step: 'action', gate: 'approve', end: 'end' }
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const tagClass = (s: Stage) => `t-${s.toLowerCase().replace(/ /g, '-')}`

function section(g: AgenticFramework, id: SectionId, body: string) {
  const s = g.sections.find((x) => x.id === id)!
  return `<section id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h"><header class="shead"><span class="kicker">${esc(s.kicker)}</span><h2 id="${esc(s.id)}-h">${esc(s.title)}</h2><p>${esc(s.blurb)}</p></header>${body}</section>`
}

const tiles = (list: Card[]) =>
  `<ul class="tiles">${list
    .map((c) => `<li class="tile"><span class="tile-top"><span class="tile-icon" aria-hidden="true">${iconSvg(c.icon, 18)}</span><span class="tile-mark">${esc(c.mark)}</span></span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p>${c.note ? `<span class="tile-note">${esc(c.note)}</span>` : ''}</li>`)
    .join('')}</ul>`

function hero(g: AgenticFramework) {
  const stack = g.stack.map((t) => `<li><span aria-hidden="true">${iconSvg(t.icon, 16)}</span>${esc(t.name)}</li>`).join('')
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p><ul class="stack" aria-label="Built with">${stack}</ul></header>`
}

function jobs(g: AgenticFramework) {
  const cols = g.jobs.columns.map((c) => `<div class="job"><h3>${esc(c.title)}</h3><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')
  return `<div class="jobs">${cols}</div><p class="jobs-line">${esc(g.jobs.line)}</p>`
}

/** The live loop: legend, then one frame with cables in SVG, their labels, ball templates, steps and rule pins as buttons. */
function loop(g: AgenticFramework, index: NodeIndex) {
  const { steps, cables, legend, caption } = g.loop
  const l = layoutLoop(g.loop)
  const byId = new Map(steps.map((s) => [s.id, s]))
  const rules = new Map(g.rules.map((r) => [r.mark, r]))
  for (const s of steps) index[s.id] = { label: s.label, type: KIND_TYPES[s.kind], what: s.what, settings: [] }
  const sample: Record<string, string> = {
    cable: '<span class="line"></span>',
    signal: '<span class="line line-signal"></span>',
    loop: '<span class="line line-loop"></span>',
    gate: LOCK(),
    pin: '<span class="pin-sample">R</span>',
  }
  const keys = legend
    .map((k) => {
      index[`key:${k.id}`] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="key:${esc(k.id)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${sample[k.id]}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  const entered = new Set(cables.map((c) => c.to))
  const left = new Set(cables.map((c) => c.from))
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'loop' ? ' loop' : ''}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .filter((c) => c.label)
    .map((c) => `<span class="edge-label" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label!)}</span>`)
    .join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  const buttons = steps
    .map((s) => {
      const at = l.nodes[s.id]
      return `<button type="button" class="node k-${LOOK[s.kind]}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${s.kind === 'gate' ? LOCK() : ''}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>`
    })
    .join('')
  // Pins sit beside their step, never inside it: a button may not hold a button.
  const pins = steps
    .filter((s) => s.rule)
    .map((s) => {
      const r = rules.get(s.rule!)!
      const key = `rule:${r.mark}`
      index[key] = { label: r.title, type: `RULE ${r.mark}`, what: r.text, settings: [] }
      const at = l.pins[s.id]
      return `<button type="button" class="pin" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key)}" aria-label="Rule ${esc(r.mark)}: ${esc(r.title)}" aria-haspopup="dialog" aria-expanded="false">${esc(r.mark)}</button>`
    })
    .join('')
  const read = steps
    .map((s) => {
      const next = cables.filter((c) => c.from === s.id).map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
      return `<li>${esc(s.label)} (${esc(s.sub)})${s.rule ? `, rule ${esc(s.rule)}` : ''}${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<ul class="legend" aria-label="How to read the loop">${keys}</ul><figure class="canvas loop" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll loop left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll loop right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="The loop, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}${pins}</div></div><ol class="steps sr-only">${read}</ol></figure>`
}

function example(g: AgenticFramework) {
  const items = g.example.items
    .map((it, i) => `<li><span class="tl-n">${i + 1}</span><span class="tag ${tagClass(it.stage)}">${esc(it.stage)}</span><p>${esc(it.text)}</p></li>`)
    .join('')
  return `<ol class="timeline">${items}</ol><a class="see" href="${esc(g.example.link.href)}" target="_top">${esc(g.example.link.label)}</a>`
}

const glossary = (g: AgenticFramework) => `<dl class="gl">${g.glossary.map(([t, m]) => `<div><dt>${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')}</dl>`

/** The whole Agentic Framework page (spec §3–4): one self-contained HTML file. */
export function renderAgenticFramework(g: AgenticFramework = AF, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const body = [
    section(g, 'glance', tiles(g.stages)),
    section(g, 'jobs', jobs(g)),
    section(g, 'tools', tiles(g.tools)),
    section(g, 'rules', tiles(g.rules)),
    section(g, 'loop', loop(g, index)),
    section(g, 'example', example(g)),
    section(g, 'habits', `${tiles(g.habits)}<p class="closing">${esc(g.closing)}</p>`),
    section(g, 'glossary', glossary(g)),
  ].join('\n')
  // End-to-End's client, as it is (read-only). Git may check it out with CRLF on Windows.
  const client = readFileSync(join(process.cwd(), 'lib/endToEnd/client.js'), 'utf8').replace(/\r\n/g, '\n')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
<style>${afCss(themes)}</style>
</head>
<body>
<nav class="toc" aria-label="Sections">${g.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.chip)}</a>`).join('')}</nav>
<main class="page">
${hero(g)}
${body}
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close details">×</button></div>
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script>${client}</script>
</body>
</html>
`
}
```

- [ ] **Step 5: Run it to see it pass.**

Run: `npx vitest run tests/agenticFramework-render.test.ts tests/no-raw-colors.test.ts`
Expected: PASS (16 render tests, plus the raw-colour test).

- [ ] **Step 6: Commit.** `git add lib/agenticFramework/styles.ts lib/agenticFramework/render.ts tests/agenticFramework-render.test.ts && git commit -m "feat: render the Agentic Framework page: sections, live loop with rule pins, timeline, glossary"` (with the Co-Authored-By line).

---

### Task 4: Generator, generated page, browser tests

**Files:**
- Create: `scripts/make-af.ts`, `scripts/shoot-af.mjs`, `e2e/agentic-framework.spec.ts`
- Generate: `public/agentic-framework.html`, `public/shots/agentic-framework.jpeg`
- Modify: `package.json` (scripts), `tests/agenticFramework-render.test.ts` (adds the freshness test)

**Interfaces:**
- Consumes: `renderAgenticFramework` from Task 3.
- Produces: the served page at `/agentic-framework.html` and the screenshot at `/shots/agentic-framework.jpeg` (640×400), which Task 5 uses.

- [ ] **Step 1: Write the failing freshness test.** Append to `tests/agenticFramework-render.test.ts`:

```ts
describe('public/agentic-framework.html', () => {
  it('is up to date with its data (run npm run af-page after any change)', () => {
    expect(readFileSync('public/agentic-framework.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderAgenticFramework())
  })
})
```

- [ ] **Step 2: Run it to see it fail.**

Run: `npx vitest run tests/agenticFramework-render.test.ts -t "up to date"`
Expected: FAIL with ENOENT for `public/agentic-framework.html`.

- [ ] **Step 3: Write the scripts.**

`scripts/make-af.ts`:

```ts
// Builds public/agentic-framework.html from data/agenticFramework.ts (spec 2026-10-01-agentic-framework).
// Run after changing the page's data, layout or styles, or End-to-End's client: npm run af-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAgenticFramework } from '../lib/agenticFramework/render.ts'

const html = renderAgenticFramework()
writeFileSync(join(process.cwd(), 'public', 'agentic-framework.html'), html)
console.log(`public/agentic-framework.html: ${(html.length / 1024).toFixed(1)} KB`)
```

`scripts/shoot-af.mjs`:

```js
// Photographs public/agentic-framework.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run af-page
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400. Reduced motion keeps balls out of the picture.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'dark', reducedMotion: 'reduce' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'agentic-framework.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'agentic-framework.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
```

In `package.json` `scripts`, after `"e2e-page"`, add:

```json
    "af-page": "node scripts/make-af.ts && node scripts/shoot-af.mjs"
```

(Add a comma after the `e2e-page` line.)

- [ ] **Step 4: Generate the page and check it is fresh.**

Run: `npm run af-page && npx vitest run tests/agenticFramework-render.test.ts`
Expected: prints `public/agentic-framework.html: <size> KB` (under 300). All 17 tests pass.

- [ ] **Step 5: Write the browser tests** `e2e/agentic-framework.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const PAGE = '/agentic-framework.html'

test('reads top to bottom: the header, eight section chips, eight sections and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('Agentic Framework · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Agentic Framework')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(8)
  await expect(page.locator('main > section')).toHaveCount(8)
  await expect(page.locator('#glossary dt')).toHaveCount(18)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="check"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the section chips mark the section on screen', async ({ page }) => {
  await page.goto(`${PAGE}#rules`)
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Rules' })).toHaveAttribute('aria-current', 'true')
})

test('a step explains itself; Escape closes it and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="gate"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Approval' })
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-p=type]')).toHaveText('APPROVAL GATE')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^Nothing reaches a repo/)
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
})

test('a rule pin explains its rule', async ({ page }) => {
  await page.goto(PAGE)
  await page.getByRole('button', { name: 'Rule R1: Write the spec first' }).click()
  const panel = page.getByRole('dialog', { name: 'Write the spec first' })
  await expect(panel.locator('[data-p=type]')).toHaveText('RULE R1')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^If I cannot describe done/)
})

test('the legend keys explain themselves', async ({ page }) => {
  await page.goto(PAGE)
  await page.getByRole('button', { name: 'Rule pin', exact: true }).click()
  await expect(page.locator('#node-panel')).toContainText('One of my four rules')
})

test('balls leave one at a time, at most five, lighting what they pass', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __balls: number[] }
    w.__balls = []
    new MutationObserver((list) => {
      for (const m of list) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.classList.contains('run-ball')) w.__balls.push(performance.now())
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(`${PAGE}#loop`)
  const fig = page.locator('figure.canvas')
  await expect(fig).toHaveClass(/playing/)
  await expect(fig.locator('.node.lit').first()).toBeAttached({ timeout: 10_000 })
  await expect(fig.locator('.edge.lit').first()).toBeAttached({ timeout: 10_000 })
  await expect.poll(() => page.evaluate(() => (window as unknown as { __balls: number[] }).__balls.length), { timeout: 15_000 }).toBeGreaterThan(2)
  const times = await page.evaluate(() => (window as unknown as { __balls: number[] }).__balls)
  for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThan(500)
  expect(await fig.locator('.run-ball').count()).toBeLessThanOrEqual(5)
})

test('no balls and nothing lit under reduced motion', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#loop`)
  await page.waitForTimeout(1500)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await expect(page.locator('.lit')).toHaveCount(0)
  await ctx.close()
})

test('a ball moves at one steady speed, so the lights keep up with it', async ({ page }) => {
  await page.goto(`${PAGE}#loop`)
  const ball = page.locator('.run-ball').first()
  await expect(ball).toBeAttached({ timeout: 10_000 })
  const frames = await ball.evaluate((el) =>
    (el.getAnimations()[0].effect as KeyframeEffect).getKeyframes().map((k: ComputedKeyframe) => [k.computedOffset, String(k.offsetDistance)]),
  )
  for (const [at, distance] of frames) expect(distance).toBe(`${Math.round(Number(at) * 100)}%`)
})

test('at phone width the page never scrolls sideways; the loop pans', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PAGE}#loop`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('.canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await expect(page.locator('figure.canvas')).toHaveAttribute('data-overflow', '')
  for (const id of ['glance', 'jobs', 'example', 'habits']) {
    const box = (await page.locator(`#${id}`).boundingBox())!
    expect(box.x + box.width, id).toBeLessThanOrEqual(390)
  }
})

test('a drag pans the loop and never opens a step', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  // No hash: a smooth jump to a section would still be scrolling when the drag starts.
  await page.goto(PAGE)
  const frame = page.locator('.canvas-scroll')
  const step = page.locator('[data-node="check"]')
  await step.scrollIntoViewIfNeeded()
  await frame.evaluate((el) => (el.scrollLeft = 0))
  const n = (await step.boundingBox())!
  await page.mouse.move(n.x + 28, n.y + 28)
  await page.mouse.down()
  await page.mouse.move(n.x - 100, n.y + 28, { steps: 8 })
  await page.mouse.up()
  expect(await frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(60)
  await expect(page.locator('#node-panel')).toBeHidden()
})

test('every cable label sits inside the loop', async ({ page }) => {
  await page.goto(PAGE)
  const stage = (await page.locator('.stage').boundingBox())!
  for (const label of await page.locator('.edge-label').all()) {
    const b = (await label.boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(stage.x)
    expect(b.x + b.width).toBeLessThanOrEqual(stage.x + stage.width)
  }
})

test('prints without balls, buttons or chips, and keeps the tints', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('nav.toc')).toBeHidden()
  await expect(page.locator('.pan')).toBeHidden()
  for (const ball of await page.locator('.run-ball').all()) await expect(ball).toBeHidden()
  for (const sel of ['.tile', '[data-node="gate"] .node-card', '.tag.t-ship'])
    expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).printColorAdjust), sel).toBe('exact')
})

test('on its own it follows the device theme and links back to the portfolio', async ({ browser }) => {
  for (const [scheme, bg] of [['light', 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body')).toHaveCSS('background-color', bg)
    await expect(page.getByRole('link', { name: '← Justine Acosta · Portfolio' })).toBeVisible()
    await ctx.close()
  }
})

test('the worked example links to the End-to-End page', async ({ page }) => {
  await page.goto(`${PAGE}#example`)
  const see = page.getByRole('link', { name: 'See it: The End-to-End Workflow →' })
  await expect(see).toHaveAttribute('href', '/end-to-end.html')
  await expect(page.locator('#example .timeline li')).toHaveCount(6)
})
```

- [ ] **Step 6: Run the browser tests.**

Run: `npx playwright test e2e/agentic-framework.spec.ts --project=desktop`
Expected: 15 passed.

- [ ] **Step 7: Look at it.** Open `public/agentic-framework.html` at 1280 and 390 wide, in dark and light (Playwright MCP or a screenshot). Check that no cable label or pin covers a step's name, the send-back arc clears every pin, and the tiles and timeline stack on a phone. Fix anything you see with a test that fails first, then regenerate.

- [ ] **Step 8: Commit.** `git add scripts/make-af.ts scripts/shoot-af.mjs package.json public/agentic-framework.html public/shots/agentic-framework.jpeg e2e/agentic-framework.spec.ts tests/agenticFramework-render.test.ts && git commit -m "feat: Agentic Framework page comes alive: balls, panel, pins, chips; page and screenshot generated"` (with the Co-Authored-By line).

---

### Task 5: The card opens the page

**Files:**
- Create: `components/projects/AgenticFrameworkView.tsx`
- Delete: `components/projects/DocView.tsx`
- Modify:
  - `data/projects.ts` (lines 16–21, then the writeup on line 58)
  - `data/projectDocs.ts` (the imports, the header comment, `DOCS`)
  - `components/projects/ProjectViews.tsx`
  - `lib/seo.ts:15`
  - `tests/no-ghl.test.ts:6`
  - `tests/projects.test.tsx`
  - `tests/seo.test.ts`
  - `e2e/projects.spec.ts`
  - `e2e/seo.spec.ts:25`

**Interfaces:**
- Consumes: `/agentic-framework.html` and `/shots/agentic-framework.jpeg` from Task 4, and `Window` (`components/projects/Window.tsx`, props `open, onClose, title, href, flush`).
- Produces: `/projects#agentic-framework` opens a window named "The Agentic Framework" holding `<iframe title="Agentic Framework page" src="/agentic-framework.html">`.

- [ ] **Step 1: Write the failing tests.**

In `tests/projects.test.tsx`:

1. Change the imports to:
```ts
import { agentsView } from '@/data/projectDocs'
import { BUILDS, PROJECT_VIEWS, projects } from '@/data/projects'
```
2. Replace the first test with:
```ts
  it('names every sub-view once, and every write-up opens its own page', () => {
    expect(new Set(PROJECT_VIEWS).size).toBe(PROJECT_VIEWS.length)
    expect(projects.writeups.every((w) => w.page && w.frameTitle && w.shot)).toBe(true)
  })
```
3. In the End-to-End test, delete the line `expect(DOC_VIEWS).toEqual(['agentic-framework'])`.
4. Add after the End-to-End test:
```ts
  it('opens the Agentic Framework as its own page, with a real 16:10 screenshot on Home', () => {
    const w = projects.writeups.find((x) => x.view === 'agentic-framework')!
    expect(w).toMatchObject({ page: '/agentic-framework.html', frameTitle: 'Agentic Framework page', cue: 'READ THE FRAMEWORK' })
    const shot = BUILDS.find((b) => b.view === 'agentic-framework')!.shot
    expect(shot).toBe('/shots/agentic-framework.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })
```
5. In `pre-renders every view, closed`, change `expect(document.body).toHaveTextContent('Write the spec first')` to `expect(document.body).toHaveTextContent('Refuses to guess.')`.
6. Replace `opens the write-up a shared link names, and Close drops the hash` with:
```ts
  it('opens the write-up a shared link names, as its page in the window, and Close drops the hash', () => {
    window.history.replaceState(null, '', '/projects#agentic-framework')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'The Agentic Framework' })
    expect(view).toHaveAttribute('open')
    expect(within(view).getByTitle('Agentic Framework page')).toHaveAttribute('src', '/agentic-framework.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/agentic-framework.html')
    fireEvent.click(within(view).getByRole('button', { name: 'Close' }))
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })
```

In `tests/no-ghl.test.ts`, change line 6 to:
```ts
const FILES = ['public/build-plan.html', 'public/end-to-end.html', 'public/agentic-framework.html']
```

In `tests/seo.test.ts`, after line 45 (`expect(urls).toContain(\`${SITE_URL}/build-plan.html\`)`), add:
```ts
    expect(urls).toContain(`${SITE_URL}/agentic-framework.html`)
```

In `e2e/projects.spec.ts`:
1. In `other pages never load the Projects write-ups up front`, change `'Write the spec first'` to `'Refuses to guess.'`.
2. In `/projects never fetches the plan page until its window opens`, add `expect(asked).not.toContain('/agentic-framework.html')`.
3. Add:
```ts
test('the Agentic Framework window shows its page and follows the site theme', async ({ page }) => {
  await page.goto('/projects#agentic-framework')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The Agentic Framework' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/agentic-framework.html')
  const frame = page.frameLocator('iframe[title="Agentic Framework page"]')
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('The Agentic Framework')
  await expect(frame.locator('a.home')).toBeHidden()
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('section chips in the Agentic Framework add no history, so one Back closes the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /The Agentic Framework/ }).first().click()
  const view = page.getByRole('dialog', { name: 'The Agentic Framework' })
  const chips = page.frameLocator('iframe[title="Agentic Framework page"]').getByRole('navigation', { name: 'Sections' })
  await chips.getByRole('link', { name: 'The loop' }).click()
  await chips.getByRole('link', { name: 'Rules' }).click()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})
```

In `e2e/seo.spec.ts` line 25, add `'/agentic-framework.html'` to the list.

- [ ] **Step 2: Run them to see them fail.**

Run: `npx vitest run tests/projects.test.tsx tests/seo.test.ts`
Expected: FAIL. The agentic writeup has no `page`, there is no iframe titled "Agentic Framework page", and the sitemap lacks `/agentic-framework.html`.

- [ ] **Step 3: Wire it.**

`components/projects/AgenticFrameworkView.tsx`:
```tsx
import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The Agentic Framework (spec 2026-10-01-agentic-framework): the generated
 * page public/agentic-framework.html in the document window. The iframe is
 * only there while the window is open, so /projects never downloads the page
 * up front. It is same-origin and unsandboxed because we write the page
 * ourselves, which lets it copy the site's theme.
 */
export default function AgenticFrameworkView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = projects.writeups.find((x) => x.view === 'agentic-framework')!
  return (
    <Window open={open} onClose={onClose} title={w.title} href={w.page} flush>
      {open && <iframe src={w.page} title={w.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
```

`components/projects/ProjectViews.tsx`:
- Remove the imports of `DOCS`, `DOC_VIEWS` and `DocView`, and import `AgenticFrameworkView from './AgenticFrameworkView'`.
- Import `{ PROJECT_VIEWS } from '@/data/projects'`.
- Replace the `DOC_VIEWS.map(...)` block with `<AgenticFrameworkView open={view === 'agentic-framework'} onClose={close} />`.

`data/projects.ts`:
- Delete the `DOC_VIEWS`, `DocView`, `DocCard` and `Doc` lines (16–17, 20–21). Keep `Chip`, because `agentsView` and `Window` use it.
- Change the agentic writeup to:
```ts
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', icon: BrainIcon, cue: 'READ THE FRAMEWORK', page: '/agentic-framework.html', frameTitle: 'Agentic Framework page', shot: '/shots/agentic-framework.jpeg' },
```
- Update the `Writeup` doc comment to: `/** A write-up card: it opens a generated page in the window, with its Home \`shot\`. */`. Make `page`, `frameTitle` and `shot` required (drop the `?`s), since every writeup now has them. In `BUILDS`, the writeups line becomes `...WRITEUPS.map((w) => ({ name: w.title, view: w.view, shot: w.shot })),`.

`data/projectDocs.ts`:
- Delete `DOCS` and its type import.
- The import becomes `import type { AgentGroup, Chip } from './projects'`.
- Remove the icons only `DOCS` used: `ArrowsClockwiseIcon`, `FileTextIcon`, `LightningIcon`, `ListChecksIcon`, `ScissorsIcon`, `TargetIcon`.
- Change the header comment to: `The Projects AI agents view's long copy, verbatim from Kraft Projects Board.dc.html. Kept apart from data/projects.ts so the shell (⌘K) never pulls it into other pages.`

Delete `components/projects/DocView.tsx`.

`lib/seo.ts:15`:
```ts
export const STATIC_PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html']
```

- [ ] **Step 4: Run them to see them pass.**

Run: `npx vitest run && npm run lint && npm run typecheck`
Expected: every unit test passes (including `tests/commands.test.ts`, unchanged), and lint and tsc are clean.

Run: `npx playwright test e2e/projects.spec.ts e2e/seo.spec.ts --project=desktop`
Expected: all pass.

- [ ] **Step 5: Commit.** `git add -A components/projects data/projects.ts data/projectDocs.ts lib/seo.ts tests e2e && git commit -m "feat: Agentic Framework card opens its page; doc dialog removed; page in the sitemap"` (with the Co-Authored-By line).

---

### Task 6: Full verification and final review

- [ ] **Step 1: Prove the other pages are untouched.**

Run: `git diff main --stat -- lib/buildPlan lib/endToEnd data/buildPlan.ts data/endToEnd.ts scripts/make-plan.ts scripts/shoot-plan.mjs scripts/make-e2e.ts scripts/shoot-e2e.mjs components/projects/PlanView.tsx components/projects/EndToEndView.tsx public/build-plan.html public/end-to-end.html public/shots/build-plan.jpeg public/shots/end-to-end.jpeg`
Expected: no output.

- [ ] **Step 2: Run everything.**

Run: `npx vitest run && npm run lint && npm run typecheck && npx playwright test --project=desktop && npx playwright test --project=phone`
Expected: all green. Record the counts.

- [ ] **Step 3: Final whole-branch review** by a fresh reviewer on the most capable model, with this plan's Review Focus. Fix Critical and Important findings test-first, in one pass. List minors as deferred.

- [ ] **Step 4: Hand back to Justine** to check before any push.
