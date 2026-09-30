# End-to-End Workflow Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/end-to-end.html`, one tall live graph of Justine's real workflow (11 lanes, cables, loop-backs, balls, click panel, legend, glossary), and show it in the End-to-End Workflow card's dialog. The build plan stays untouched.

**Architecture:**
- Typed data (`data/endToEnd.ts`) feeds a pure layout (`lib/endToEnd/layout.ts`) that places steps on a lane grid and routes cables in three ways: within a lane, through the gaps between lanes, or down the side channels. It also picks up to 24 ball routes.
- A renderer (`lib/endToEnd/render.ts`) writes one self-contained HTML file. It inlines its own client script and borrows the build plan's `esc` and `pageCss` read-only.
- The site shows the file in an iframe inside the existing card's `Window`.

**Tech Stack:** TypeScript run directly by Node 26, Phosphor icons rendered to SVG at build time, Vitest with jsdom, Playwright, and Next.js 16 for the site.

**Spec:** `docs/superpowers/specs/2026-09-30-end-to-end-workflow-design.md` (approved 2026-10-01, every item ticked, no notes)

## Global Constraints

- **Build plan untouched:** no edits to `lib/buildPlan/**`, `data/buildPlan.ts`, `scripts/make-plan.ts`, `scripts/shoot-plan.mjs`, `components/projects/PlanView.tsx`, `public/build-plan.html` or `public/shots/build-plan.jpeg`.
- **Allowed imports from the build plan (read-only):** `esc` from `lib/buildPlan/render.ts`, plus `pageCss` and `Themes` from `lib/buildPlan/styles.ts`.
- **No raw colours in `lib/**`** (`tests/no-raw-colors.test.ts`). Every colour is a `var(--token)` or a `color-mix` of tokens.
- **Page and screenshot:** the page is `/end-to-end.html` with `<link rel="canonical" href="/end-to-end.html">`. The screenshot is `public/shots/end-to-end.jpeg` at 640×400.
- **Script:** `"e2e-page": "node scripts/make-e2e.ts && node scripts/shoot-e2e.mjs"`. `npm run plan` is unchanged.
- **Copy:** curly quotes only (’ “ ”), never a straight `'` inside copy. No GoHighLevel or GHL anywhere.
- **Imports inside `lib/endToEnd` and `data/endToEnd.ts`:** relative paths with `.ts` extensions, as in `lib/buildPlan`.
- **Lane width:** lane G is at most 7 columns wide (`at[0]` ≤ 6). Every other lane is at most 6 (`at[0]` ≤ 5).
- **Balls:** at most 5 on the graph at once, launched at random 0.7–2 s apart, at most one loop-back per route, and off under reduced motion (the OS setting or the site's `data-a11y-motion`).
- **Dialog:** the dialog is named "The End-to-End Workflow", and the iframe title is "End-to-End Workflow graph".
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A ball that takes a loop-back still finishes.** Every route ends at Fresh session, and none loops forever. *Pinned in Task 2:* "sends balls from a trigger to the end, with at most one loop-back".
2. **Lane chips inside the dialog add no history,** so one Back closes the window. *Pinned in Task 5:* "lane chips in the graph add no history".
3. **Long loop-back labels are never clipped** by the stage's left or right edge. *Pinned in Task 4:* "every cable label sits inside the graph".
4. **The copied client script throws nothing** on this page (no test matrix here). *Pinned in Task 4:* "loads and runs with no page errors".
5. **The lane label stays readable while a phone pans the graph.** *Pinned in Task 4:* "at phone width … the lane label stays pinned".

---

## File Structure

| File | Responsibility |
|---|---|
| `data/endToEnd.ts` (new) | Types and content: lanes, steps, cables, legend, glossary, hero, footer |
| `lib/endToEnd/layout.ts` (new) | Positions, cable geometry, ball routes (pure) |
| `lib/endToEnd/icons.ts` (new) | Phosphor name → inline SVG at a given size |
| `lib/endToEnd/styles.ts` (new) | `pageCss` plus lane, badge, legend and glossary CSS |
| `lib/endToEnd/render.ts` (new) | `renderEndToEnd()` → full HTML string; `PAGE_PATH` |
| `lib/endToEnd/client.js` (new) | Browser behaviour, adapted from the build plan's client without the test matrix |
| `scripts/make-e2e.ts`, `scripts/shoot-e2e.mjs` (new) | Write the page; photograph it |
| `public/end-to-end.html`, `public/shots/end-to-end.jpeg` (generated) | The page and its Home screenshot |
| `components/projects/EndToEndView.tsx` (new) | Window with the iframe |
| `components/projects/ProjectViews.tsx` | Mount EndToEndView |
| `data/projects.ts` | Writeup gains `page`, `frameTitle` and `shot`; `DOC_VIEWS` shrinks; BUILDS shot |
| `data/projectDocs.ts` | Drop the `'end-to-end'` doc and its now-unused icon imports |
| `lib/seo.ts` | `STATIC_PAGES` adds `/end-to-end.html` |
| Tests | `tests/endToEnd-{data,layout,render}.test.ts`, `e2e/end-to-end.spec.ts`; updates to `tests/projects.test.tsx`, `tests/no-ghl.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts` |

---

### Task 1: The graph's content

**Files:**
- Create: `data/endToEnd.ts`
- Test: `tests/endToEnd-data.test.ts`

**Interfaces:**
- Produces:
  - `LaneId = 'A'|…|'K'` and `StepKind = 'trigger'|'step'|'ai'|'decision'|'gate'|'agent'|'end'`.
  - `Lane {id,name,note}`.
  - `Step {id,lane,at:[col,row],kind,label,sub,icon,what,n?,enforced?}`.
  - `Cable {from,to,kind:'flow'|'loop',label?}`.
  - `LegendKey {id:'cable'|'signal'|'loop'|'gate'|'auto',label,what}`.
  - `EndToEnd {title,description,home,kicker,heading,lede,stance,caption,lanes,steps,cables,legend,glossary:{title,blurb,terms:[string,string][]},footer:{note,by}}`.
  - `KIND_TYPES: Record<StepKind,string>`.
  - `endToEnd: EndToEnd`.

- [ ] **Step 1: Write the failing test** at `tests/endToEnd-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { endToEnd as g, KIND_TYPES } from '@/data/endToEnd'

const allText = () => JSON.stringify(g)

describe('the End-to-End Workflow data', () => {
  it('has the eleven lanes, A to K, in order', () => {
    expect(g.lanes.map((l) => l.id)).toEqual('ABCDEFGHIJK'.split(''))
    expect(g.lanes.map((l) => l.name)).toEqual([
      'Triggers', 'Knowledge and memory', 'Frame the task', 'Build loop', 'Check and repeat', 'Debug and fix',
      'Agents and skills', 'n8n automation', 'Approval and delivery', 'Git and deploy', 'Write-back and reset',
    ])
  })

  it('gives every step a unique id, a real lane, a kind the panel can name, and a plain description', () => {
    const ids = g.steps.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of g.steps) {
      expect(g.lanes.some((l) => l.id === s.lane), s.id).toBe(true)
      expect(KIND_TYPES[s.kind], s.id).toBeTruthy()
      expect(s.what.length, s.id).toBeGreaterThanOrEqual(20)
      expect(s.what.length, s.id).toBeLessThanOrEqual(220)
      expect(s.what, s.id).toMatch(/\.$/)
    }
  })

  it('joins every cable to real steps', () => {
    const ids = new Set(g.steps.map((s) => s.id))
    for (const c of g.cables) expect(ids.has(c.from) && ids.has(c.to), `${c.from} → ${c.to}`).toBe(true)
  })

  it('never puts two steps in one spot, and keeps lanes narrow (G up to 7 wide, the rest up to 6)', () => {
    for (const lane of g.lanes) {
      const steps = g.steps.filter((s) => s.lane === lane.id)
      const spots = steps.map((s) => s.at.join(','))
      expect(new Set(spots).size, lane.id).toBe(spots.length)
      expect(Math.max(...steps.map((s) => s.at[0])), lane.id).toBeLessThanOrEqual(lane.id === 'G' ? 6 : 5)
    }
  })

  it('flows one way: without the loop-backs, the cables never go round in a circle', () => {
    const flow = g.cables.filter((c) => c.kind === 'flow')
    const left = new Map(g.steps.map((s) => [s.id, flow.filter((c) => c.to === s.id).length]))
    const queue = g.steps.filter((s) => left.get(s.id) === 0).map((s) => s.id)
    let seen = 0
    while (queue.length) {
      const id = queue.shift()!
      seen++
      for (const c of flow.filter((c) => c.from === id)) {
        left.set(c.to, left.get(c.to)! - 1)
        if (left.get(c.to) === 0) queue.push(c.to)
      }
    }
    expect(seen).toBe(g.steps.length)
  })

  it('starts only at the three triggers and ends only at Fresh session', () => {
    const starts = g.steps.filter((s) => !g.cables.some((c) => c.to === s.id)).map((s) => s.id)
    const ends = g.steps.filter((s) => !g.cables.some((c) => c.from === s.id)).map((s) => s.id)
    expect(starts.sort()).toEqual(['a1', 'a2', 'a3'])
    expect(ends).toEqual(['k4'])
    expect(g.steps.filter((s) => s.kind === 'trigger' && s.lane === 'A')).toHaveLength(3)
  })

  it('numbers the steps of every lane but A and G, left to right from 1', () => {
    for (const lane of g.lanes) {
      const steps = g.steps.filter((s) => s.lane === lane.id).sort((a, b) => a.at[0] - b.at[0])
      if (lane.id === 'A' || lane.id === 'G') expect(steps.every((s) => s.n === undefined), lane.id).toBe(true)
      else expect(steps.map((s) => s.n), lane.id).toEqual(steps.map((_, i) => i + 1))
    }
  })

  it('has one approval gate, ten agent jobs, and five steps that run on their own', () => {
    expect(g.steps.filter((s) => s.kind === 'gate').map((s) => s.id)).toEqual(['i1'])
    expect(g.steps.filter((s) => s.kind === 'agent').map((s) => s.label)).toEqual([
      'Researcher', 'Auditor', 'Builder', 'Writer', 'Reel maker', 'Reviewer', 'Deliverables', 'Monitor', 'Data tidy', 'Memory keeper',
    ])
    expect(g.steps.filter((s) => s.enforced).map((s) => s.id).sort()).toEqual(['a2', 'e1', 'h5', 'j4', 'k2'])
  })

  it('draws the spec’s loop-backs with their labels', () => {
    const loops = g.cables.filter((c) => c.kind === 'loop').map((c) => `${c.from}→${c.to}:${c.label}`)
    expect(loops.sort()).toEqual([
      'e4→d2:fails', 'f4→e1:re-check', 'i1→d2:send back with a note', 'j4→j3:fails: roll back and redeploy', 'k3→c1:becomes a rule',
    ].sort())
  })

  it('has a five-item legend and explains every glossary term, each of which is on the graph', () => {
    expect(g.legend.map((k) => k.id)).toEqual(['cable', 'signal', 'loop', 'gate', 'auto'])
    const onGraph = [...g.lanes.flatMap((l) => [l.name, l.note]), ...g.steps.flatMap((s) => [s.label, s.sub, s.what]), ...g.cables.map((c) => c.label ?? '')]
      .join(' ')
      .toLowerCase()
    expect(g.glossary.terms.length).toBeGreaterThanOrEqual(20)
    for (const [term, meaning] of g.glossary.terms) {
      expect(onGraph, term).toContain(term.toLowerCase())
      expect(meaning, term).toMatch(/\.$/)
    }
  })

  it('uses curly quotes only and never mentions GoHighLevel', () => {
    expect(allText()).not.toContain("'")
    expect(allText()).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/endToEnd-data.test.ts`
Expected: FAIL, because `@/data/endToEnd` does not exist.

- [ ] **Step 3: Write `data/endToEnd.ts`**

```ts
/**
 * The End-to-End Workflow page's content (spec 2026-09-30-end-to-end-workflow):
 * how Justine ships, drawn as one graph of eleven lanes. Written from what the
 * site already says (the End-to-End and Agentic Framework cards, the AI agents
 * list and Hermes). public/end-to-end.html is generated from it: npm run e2e-page
 */
export type LaneId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K'
export type StepKind = 'trigger' | 'step' | 'ai' | 'decision' | 'gate' | 'agent' | 'end'
export type Lane = { id: LaneId; name: string; note: string }
/** A step on the graph. `at` is its [column, row] inside its lane (a half row sits between two rows). `n` numbers it inside its lane. */
export type Step = { id: string; lane: LaneId; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; n?: number; enforced?: true }
export type Cable = { from: string; to: string; kind: 'flow' | 'loop'; label?: string }
export type LegendKey = { id: 'cable' | 'signal' | 'loop' | 'gate' | 'auto'; label: string; what: string }
export type EndToEnd = {
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  stance: string
  caption: string
  lanes: Lane[]
  steps: Step[]
  cables: Cable[]
  legend: LegendKey[]
  glossary: { title: string; blurb: string; terms: [string, string][] }
  footer: { note: string; by: string }
}

/** What the click panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = {
  trigger: 'TRIGGER',
  step: 'STEP',
  ai: 'AI STEP',
  decision: 'DECISION',
  gate: 'APPROVAL GATE',
  agent: 'AGENT JOB',
  end: 'END',
}

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

const LANES: Lane[] = [
  { id: 'A', name: 'Triggers', note: 'Where work enters.' },
  { id: 'B', name: 'Knowledge and memory', note: 'Checked before anything is built.' },
  { id: 'C', name: 'Frame the task', note: 'Spec before prompt.' },
  { id: 'D', name: 'Build loop', note: 'One small piece at a time.' },
  { id: 'E', name: 'Check and repeat', note: 'Nothing ships until it passes.' },
  { id: 'F', name: 'Debug and fix', note: 'Find the cause. Never patch blind.' },
  { id: 'G', name: 'Agents and skills', note: 'One job each.' },
  { id: 'H', name: 'n8n automation', note: 'Predictable, logged, reversible.' },
  { id: 'I', name: 'Approval and delivery', note: 'A person says yes.' },
  { id: 'J', name: 'Git and deploy', note: 'Ship, then prove it’s live.' },
  { id: 'K', name: 'Write-back and reset', note: 'The next run starts smarter.' },
]

const JOBS: [string, string, string, string][] = [
  ['Researcher', 'finds sources', 'MagnifyingGlass', 'Gathers sources and facts for a task and reports what it found, with where each fact came from.'],
  ['Auditor', 'n8n audits', 'ClipboardText', 'Reviews an n8n setup and lists what is broken, risky or missing, ranked by impact.'],
  ['Builder', 'workflows', 'FlowArrow', 'Builds n8n workflows from an approved plan, one node at a time.'],
  ['Writer', 'articles', 'Article', 'Writes long articles, like KapeSEO’s 3,000-word posts, and grades itself before handing over.'],
  ['Reel maker', 'scripts to renders', 'FilmStrip', 'The reel worker: scripts, voices, captions and renders a short video from one message.'],
  ['Reviewer', 'second pair of eyes', 'Eye', 'Checks another agent’s work against its brief before it moves on.'],
  ['Deliverables', 'client-ready files', 'Package', 'Turns finished work into client-ready files and the handover doc.'],
  ['Monitor', 'watches live systems', 'Pulse', 'Watches live automations and flags anything that stops or slows down.'],
  ['Data tidy', 'clean records', 'Broom', 'Finds duplicate, stale or badly formatted records and proposes fixes.'],
  ['Memory keeper', 'saves what was learned', 'Brain', 'Saves decisions and lessons into notes, so the next session starts with them.'],
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Message to Hermes', 'Telegram', 'PaperPlaneTilt', 'I send Hermes one line on Telegram, and that is enough to start a build, a reel or an audit.'),
  step('a2', 'A', [0, 1], 'trigger', 'Schedule', 'sweeps on a timer', 'Timer', 'A timed sweep checks for work on its own, and skips the model entirely when nothing has changed.', true),
  step('a3', 'A', [0, 2], 'trigger', 'Client event', 'n8n webhook', 'Lightning', 'A form fill, a stage change, an inbound message or a booked call in a client account, caught by an n8n webhook.'),
  step('a4', 'A', [1, 0.5], 'decision', 'Read the intent', 'routes the work', 'Signpost', 'Works out what kind of work this is. Build work goes to knowledge and framing first; a skill job goes straight to the right agent.'),

  step('b1', 'B', [0, 0], 'step', 'Project rules', 'CLAUDE.md', 'FileText', 'The project’s own rules file: its conventions, its commands and what never to do. It loads at the start of every session.'),
  step('b2', 'B', [1, 0], 'step', 'My notes', 'Hermes reads them', 'Notebook', 'My notes on clients, decisions and how things were done, which Hermes can read and search.'),
  step('b3', 'B', [2, 0], 'step', 'Knowledge base', '1,277 chunks', 'Books', 'My knowledge base, searched by keyword ranking. The five best passages come back before any answer is written.'),
  step('b4', 'B', [3, 0], 'step', 'Past work', 'what shipped before', 'ClockCounterClockwise', 'Earlier builds for the same kind of job, so a solved problem is reused instead of solved again.'),

  step('c1', 'C', [0, 0], 'step', 'Outcome', 'what done looks like', 'Target', 'One paragraph describing what done looks like. If it cannot be written, the task is not ready to build.'),
  step('c2', 'C', [1, 0], 'step', 'Constraints', 'limits and no-gos', 'Prohibit', 'The limits: budget, tools, deadlines and anything that must not change.'),
  step('c3', 'C', [2, 0], 'step', 'Files that matter', 'context is a budget', 'Files', 'Only the files the task needs go into context. Everything else stays out, so the model stays sharp.'),
  step('c4', 'C', [3, 0], 'step', 'Acceptance criteria', 'how it gets graded', 'ListChecks', 'The checks the result must pass, written before any work starts, so the output can be graded against them.'),
  step('c5', 'C', [4, 0], 'step', 'Spec', 'one brief per run', 'Scroll', 'Everything above in one written brief. The agent works from it and is not interrupted with new requirements mid-task.'),

  step('d1', 'D', [0, 0], 'step', 'Pick one small piece', 'one task, one context', 'PuzzlePiece', 'Takes the next small piece from the spec. After a piece passes its checks, the next one starts here.'),
  step('d2', 'D', [1, 0], 'ai', 'Claude Code builds', 'the builder', 'TerminalWindow', 'Claude Code writes the real files for this piece: planning on Opus, volume on Sonnet.'),
  step('d3', 'D', [2, 0], 'ai', 'Subagents in parallel', 'anything that can run at once', 'UsersThree', 'Parts that don’t depend on each other are handed to subagents, which work on them at the same time.'),
  step('d4', 'D', [3, 0], 'step', 'Cursor takes over', 'when precision beats speed', 'Cursor', 'I read what was written in Cursor and take over by hand wherever precision matters more than speed.'),

  step('e1', 'E', [0, 0], 'step', 'Run it', 'tests and a real run', 'Play', 'The tests and the app itself actually run. A result that has not run does not count.', true),
  step('e2', 'E', [1, 0], 'ai', 'Grade against the criteria', 'the model grades itself', 'ListChecks', 'The output is checked against the acceptance criteria from the spec before I look at it.'),
  step('e3', 'E', [2, 0], 'ai', 'Codex second opinion', 'a fresh model reviews', 'Code', 'A different model reads the diff. A fresh reviewer catches what the author missed.'),
  step('e4', 'E', [3, 0], 'decision', 'Pass?', 'fails · breaks · passes', 'CheckCircle', 'Three ways out: a miss goes back to be rebuilt, a real failure goes to debugging, and a pass goes to the approval gate.'),

  step('f1', 'F', [0, 0], 'step', 'Bug or failure', 'reproduce it first', 'Bug', 'Something broke. First it is made to happen again on purpose, so the fix can be proven.'),
  step('f2', 'F', [1, 0], 'step', 'Rank the causes', 'likeliest first', 'ListNumbers', 'The possible causes are listed and ranked by how likely they are, before anything is changed.'),
  step('f3', 'F', [2, 0], 'step', 'Test to confirm', 'prove the cause', 'Flask', 'A small test confirms which cause is real. Guesses don’t get fixed.'),
  step('f4', 'F', [3, 0], 'step', 'Fix and re-check', 'back through Check', 'Wrench', 'The fix goes in with a test that failed before it and passes after, then the work runs through Check again.'),

  step('g0', 'G', [0, 0.5], 'decision', 'Router', 'picks the specialist', 'ArrowsSplit', 'Reads the job and hands it to the one specialist whose job it is.'),
  ...JOBS.map(([label, sub, icon, what], i) => step(`g${i + 1}`, 'G', [(i % 5) + 1, i < 5 ? 0 : 1], 'agent', label, sub, icon, what)),
  step('g11', 'G', [6, 0.5], 'step', 'Self-check', 'graded before the gate', 'SealCheck', 'Every agent’s output is checked against its own brief before it reaches the approval gate.'),

  step('h1', 'H', [0, 0], 'trigger', 'Webhook in', 'n8n', 'WebhooksLogo', 'The client event arrives in n8n through a webhook, with the details it needs.'),
  step('h2', 'H', [1, 0], 'step', 'Wait', 'until the right time', 'Hourglass', 'Holds the run until the right moment, like business hours or a reply.'),
  step('h3', 'H', [2, 0], 'decision', 'Branch', 'needs a yes?', 'GitFork', 'Decides whether a person must approve this. Routine work carries on; anything a client would see goes to the gate.'),
  step('h4', 'H', [3, 0], 'step', 'Action', 'does the work', 'Gear', 'Does the routine work: updates a record, sends an internal note or moves a stage. No model in the hot path.'),
  step('h5', 'H', [4, 0], 'step', 'Log', 'every run recorded', 'Notepad', 'Every run is recorded, so anything can be traced and reversed.', true),

  step('i1', 'I', [0, 0], 'gate', 'Approval gate', 'approve or send back', 'ShieldCheck', 'The work stops here until I say yes. I approve it, or send it back with a note.'),
  step('i2', 'I', [1, 0], 'step', 'Deliver', 'with the handover doc', 'Handshake', 'The article, reel, workflow or report is handed over with the same handover doc every time.'),

  step('j1', 'J', [0, 0], 'step', 'Commit', 'small, clear commits', 'GitCommit', 'The change is saved in small commits that each say what they do.'),
  step('j2', 'J', [1, 0], 'step', 'Push', 'to GitHub', 'CloudArrowUp', 'The commits go up to GitHub.'),
  step('j3', 'J', [2, 0], 'step', 'Deploy', 'Vercel · Docker on my VPS', 'Rocket', 'Sites deploy on Vercel. Hermes and the workers run in Docker on my VPS.'),
  step('j4', 'J', [3, 0], 'decision', 'Verify live', 'checked on the real URL', 'Globe', 'The live site or service is checked for real. If it fails, the last good version goes back up and it deploys again.', true),

  step('k1', 'K', [0, 0], 'step', 'Write back', 'to the contact record', 'AddressBook', 'The result lands on the contact record, so the next run knows what already happened.'),
  step('k2', 'K', [1, 0], 'step', 'Save progress', 'watcher every 15 min', 'FloppyDisk', 'Progress is saved. A watcher pings me every fifteen minutes, but only when there is real work to save.', true),
  step('k3', 'K', [2, 0], 'step', 'Fold back', 'a mistake becomes a rule', 'ArrowBendUpLeft', 'Whatever went wrong becomes a written rule, so the next run does not repeat it.'),
  step('k4', 'K', [3, 0], 'end', 'Fresh session', 'reset early, reset often', 'Sparkle', 'The next task starts in a clean session. A fresh session beats a long one every time.'),
]

/** Lanes whose steps read in order carry numbers (spec §3.2). */
const NUMBERED = new Set<LaneId>(['B', 'C', 'D', 'E', 'F', 'H', 'I', 'J', 'K'])

const CABLES: Cable[] = [
  flow('a1', 'a4'),
  flow('a2', 'a4'),
  flow('a3', 'h1'),
  flow('a4', 'b1', 'build work'),
  flow('a4', 'g0', 'a skill job'),
  ...chain('b1', 'b2', 'b3', 'b4'),
  flow('b4', 'c1'),
  ...chain('c1', 'c2', 'c3', 'c4', 'c5'),
  flow('c5', 'd1'),
  ...chain('d1', 'd2', 'd3', 'd4'),
  flow('d4', 'e1'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  loop('e4', 'd2', 'fails'),
  flow('e4', 'f1', 'breaks'),
  flow('e4', 'i1', 'passes'),
  ...chain('f1', 'f2', 'f3', 'f4'),
  loop('f4', 'e1', 're-check'),
  ...JOBS.map((_, i) => flow('g0', `g${i + 1}`)),
  ...JOBS.map((_, i) => flow(`g${i + 1}`, 'g11')),
  flow('g11', 'i1'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'i1', 'needs a yes'),
  flow('h3', 'h4', 'routine'),
  flow('h4', 'h5'),
  flow('h5', 'k1'),
  flow('i1', 'i2', 'approved'),
  loop('i1', 'd2', 'send back with a note'),
  flow('i2', 'j1', 'code'),
  flow('i2', 'k1'),
  ...chain('j1', 'j2', 'j3', 'j4'),
  flow('j4', 'k2'),
  loop('j4', 'j3', 'fails: roll back and redeploy'),
  ...chain('k1', 'k2', 'k3', 'k4'),
  loop('k3', 'c1', 'becomes a rule'),
]

export const endToEnd: EndToEnd = {
  title: 'End-to-End Workflow · Justine Acosta',
  description: 'How Justine Acosta ships work: every trigger, lane, agent and loop drawn as one live graph, from a form fill to a delivered asset.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'HOW I SHIP, END TO END',
  heading: 'The End-to-End Workflow',
  lede: 'Every trigger, node, skill and agent wired as one live graph, from a form fill to a delivered asset.',
  stance: 'Nothing leaves the graph without a human yes.',
  caption: 'The end-to-end flow · 11 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => (NUMBERED.has(s.lane) ? { ...s, n: s.at[0] + 1 } : s)),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'Work flowing from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is a piece of work moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until a person says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine enforces this step, like a schedule, a test run or a log. It never depends on remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the client workflows run in: triggers, waits, branches and actions, wired as nodes.'],
      ['Webhook', 'A web address another system calls the moment something happens, which starts a workflow.'],
      ['Hermes', 'My own AI agent on a server, reachable from Telegram. It remembers, reads my notes and runs jobs unasked.'],
      ['Telegram', 'The chat app I use to message Hermes and to get alerts.'],
      ['Knowledge base', 'My searchable library of notes and documents, split into 1,277 short passages.'],
      ['Spec', 'A short written brief: the outcome, the limits, the files and the checks, agreed before building.'],
      ['Acceptance criteria', 'The checks a result must pass to count as done, written before the work starts.'],
      ['Claude Code', 'The AI coding tool that builds: it reads and writes real files and runs commands.'],
      ['Subagent', 'A helper Claude Code starts for one part of a task, so several parts are worked on at once.'],
      ['Cursor', 'The code editor I use to read what was written and take over by hand.'],
      ['Codex', 'A second AI model that reviews the work. A fresh reviewer catches what the author missed.'],
      ['Skill', 'A reusable procedure an agent loads for one kind of job, like drafting an article or cutting a reel.'],
      ['Agent', 'An AI assistant with one job. It picks its own tools and finishes the task.'],
      ['Router', 'The step that reads a job and hands it to the right specialist.'],
      ['Approval gate', 'A hard stop. Nothing reaches a client, a repo or a send button until I approve it.'],
      ['Handover doc', 'The same short document with every delivery: what it does, what breaks it and who to call.'],
      ['Write back', 'Putting the result onto the client’s contact record, so the next run knows what already happened.'],
      ['Commit', 'A saved, labelled snapshot of code changes.'],
      ['Deploy', 'Putting the new version live: Vercel for sites, Docker on my VPS for Hermes and the workers.'],
      ['Roll back', 'Putting the last good version back up when a live check fails.'],
      ['VPS', 'A private server I rent, where Hermes and my workers run.'],
      ['Fold back', 'Turning a mistake into a written rule, so it does not happen twice.'],
      ['Fresh session', 'Starting the next task in a clean AI session instead of a long, cluttered one.'],
    ],
  },
  footer: { note: 'Drawn from how I work today.', by: 'Built by Justine Acosta' },
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/endToEnd-data.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit** (the approved spec goes in with this first commit)

```bash
git add data/endToEnd.ts tests/endToEnd-data.test.ts docs/superpowers/specs/2026-09-30-end-to-end-workflow-design.md docs/superpowers/plans/2026-10-01-end-to-end-workflow.md
git commit -m "feat: End-to-End Workflow content: eleven lanes, their steps and cables

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lane layout, cable routing and ball routes

**Files:**
- Create: `lib/endToEnd/layout.ts`
- Test: `tests/endToEnd-layout.test.ts`

**Interfaces:**
- Consumes: `EndToEnd`, `Cable`, `LaneId` from Task 1.
- Produces:
  - `GEOM`, `MAX_ROUTES = 24`.
  - `Box {x,y,w,h}`, `Placed {x,y,lane}`.
  - `LaidCable = Cable & {d,len,mid:[x,y],align:'center'|'start'|'end',start:[x,y],end:[x,y],pts:[x,y][]}`.
  - `Route {nodes,run,length,stops:[id,px][],spans:[cableIndex,from,to][],loops}`.
  - `layoutGraph(g: EndToEnd): {lanes: Record<LaneId,Box>, nodes: Record<string,Placed>, cables: LaidCable[], width, height, routes: Route[]}`.

- [ ] **Step 1: Write the failing test** at `tests/endToEnd-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { endToEnd as g } from '@/data/endToEnd'
import { GEOM, layoutGraph, MAX_ROUTES } from '@/lib/endToEnd/layout'

const l = layoutGraph(g)
const N = GEOM.node
type B = { x: number; y: number; w: number; h: number }
const card = (id: string): B => ({ x: l.nodes[id].x, y: l.nodes[id].y, w: N, h: N })
const name = (id: string): B => ({ x: l.nodes[id].x + N / 2 - 68, y: l.nodes[id].y + N + 4, w: 136, h: GEOM.label - 8 })
const inside = (p: [number, number], b: B) => p[0] > b.x && p[0] < b.x + b.w && p[1] > b.y && p[1] < b.y + b.h
const hit = (a: B, b: B) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const laneOf = (id: string) => g.steps.find((s) => s.id === id)!.lane

describe('layoutGraph', () => {
  it('stacks the lanes top to bottom, in order, with a gap between each', () => {
    const boxes = g.lanes.map((lane) => l.lanes[lane.id])
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y - (boxes[i - 1].y + boxes[i - 1].h)).toBe(GEOM.gap)
    expect(l.height).toBeGreaterThan(boxes.at(-1)!.y + boxes.at(-1)!.h)
  })

  it('is about 1,150 px wide, with room for a side channel on each edge', () => {
    expect(l.width).toBeLessThanOrEqual(1240)
    for (const lane of g.lanes) {
      expect(l.lanes[lane.id].x).toBe(GEOM.channel)
      expect(l.lanes[lane.id].x + l.lanes[lane.id].w).toBe(l.width - GEOM.channel)
    }
  })

  it('keeps every step and its name inside its own lane', () => {
    for (const s of g.steps) {
      const lane = l.lanes[s.lane]
      const b = { x: l.nodes[s.id].x + N / 2 - 68, y: l.nodes[s.id].y, w: 136, h: N + GEOM.label }
      expect(b.x >= lane.x && b.x + b.w <= lane.x + lane.w && b.y >= lane.y && b.y + b.h <= lane.y + lane.h, s.id).toBe(true)
    }
  })

  it('never lets two steps, or their names, overlap', () => {
    const boxes = g.steps.map((s) => ({ id: s.id, b: { x: l.nodes[s.id].x + N / 2 - 68, y: l.nodes[s.id].y, w: 136, h: N + GEOM.label } }))
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) expect(hit(boxes[i].b, boxes[j].b), `${boxes[i].id} × ${boxes[j].id}`).toBe(false)
  })

  it('keeps every cable clear of the steps it does not connect', () => {
    for (const c of l.cables)
      for (const s of g.steps) {
        if (s.id === c.from || s.id === c.to) continue
        const bad = c.pts.find((p) => inside(p, card(s.id)) || inside(p, name(s.id)))
        expect(bad, `${c.from} → ${c.to} crosses ${s.id}`).toBeUndefined()
      }
  })

  it('crosses other lanes only in the side channels', () => {
    for (const c of l.cables) {
      const own = new Set([laneOf(c.from), laneOf(c.to)])
      for (const lane of g.lanes) {
        if (own.has(lane.id)) continue
        const bad = c.pts.find((p) => inside(p, l.lanes[lane.id]))
        expect(bad, `${c.from} → ${c.to} crosses lane ${lane.id}`).toBeUndefined()
      }
    }
  })

  it('gives every cable a path, a length and a label spot inside the graph', () => {
    expect(l.cables).toHaveLength(g.cables.length)
    for (const c of l.cables) {
      expect(c.d).toMatch(/^M[\d.-]+ [\d.-]+[LC]/)
      expect(c.len).toBeGreaterThan(0)
      expect(c.mid[0]).toBeGreaterThan(0)
      expect(c.mid[0]).toBeLessThan(l.width)
    }
    const loops = l.cables.filter((c) => c.kind === 'loop' && laneOf(c.from) !== laneOf(c.to))
    for (const c of loops) expect(c.align, `${c.from} → ${c.to}`).toBe('start')
  })

  it('sends balls from a trigger to the end, with at most one loop-back each', () => {
    const triggers = new Set(g.steps.filter((s) => s.lane === 'A' && s.kind === 'trigger').map((s) => s.id))
    expect(l.routes.length).toBeGreaterThan(0)
    expect(l.routes.length).toBeLessThanOrEqual(MAX_ROUTES)
    for (const r of l.routes) {
      expect(triggers.has(r.nodes[0]), r.nodes.join(' ')).toBe(true)
      expect(r.nodes.at(-1)).toBe('k4')
      expect(r.loops).toBeLessThanOrEqual(1)
      expect(r.spans.filter(([k]) => l.cables[k].kind === 'loop')).toHaveLength(r.loops)
    }
  })

  it('covers every step and every cable with at least one route', () => {
    const steps = new Set(l.routes.flatMap((r) => r.nodes))
    const cables = new Set(l.routes.flatMap((r) => r.spans.map(([k]) => k)))
    expect(g.steps.filter((s) => !steps.has(s.id)).map((s) => s.id)).toEqual([])
    expect(l.cables.map((_, k) => k).filter((k) => !cables.has(k))).toEqual([])
  })

  it('times each route: stops and spans run forward along its length', () => {
    for (const r of l.routes) {
      expect(r.stops.map(([id]) => id)).toEqual(r.nodes)
      for (let i = 1; i < r.stops.length; i++) expect(r.stops[i][1]).toBeGreaterThan(r.stops[i - 1][1])
      for (const [k, from, to] of r.spans) {
        expect(to - from).toBeCloseTo(l.cables[k].len, 0)
        expect(to).toBeLessThanOrEqual(r.length)
      }
      expect(r.run.startsWith('M')).toBe(true)
    }
  })

  it('throws when a cable names a missing step', () => {
    expect(() => layoutGraph({ ...g, cables: [...g.cables, { from: 'a1', to: 'zz', kind: 'flow' }] })).toThrow(/missing step/)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/endToEnd-layout.test.ts`
Expected: FAIL, because `@/lib/endToEnd/layout` does not exist.

- [ ] **Step 3: Write `lib/endToEnd/layout.ts`**

```ts
import type { Cable, EndToEnd, LaneId } from '../../data/endToEnd.ts'

/**
 * The graph's grid, in px (spec §4.2): column and row pitch, step size, lane
 * padding, the side channels (and the track spacing inside them), a lane's
 * label strip, the room under a step for its name, the gap between lanes (and
 * the slot spacing inside it), and the margin above the first lane.
 */
export const GEOM = { col: 148, row: 116, node: 56, padX: 48, channel: 56, track: 8, head: 56, label: 44, padB: 16, gap: 56, slot: 6, top: 24 } as const
/** Balls pick from at most this many routes, so the page stays small. */
export const MAX_ROUTES = 24

type Pt = [number, number]
export type Box = { x: number; y: number; w: number; h: number }
export type Placed = { x: number; y: number; lane: LaneId }
/** A cable as drawn: its SVG path, length, where its label sits (and which way it reads from there), its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; align: 'center' | 'start' | 'end'; start: Pt; end: Pt; pts: Pt[] }
/** One way through the graph for a ball, timed like the build plan's routes. */
export type Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][]; loops: number }
export type GraphLayout = { lanes: Record<LaneId, Box>; nodes: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

const round = (n: number) => Math.round(n * 10) / 10
const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01

function bezier(p: Pt[], t: number): Pt {
  const u = 1 - t
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]) as Pt
}

/** Draws a cable as an SVG path, measuring it and keeping points along it as it goes. */
class Pen {
  d: string
  len = 0
  pts: Pt[]
  at: Pt
  constructor(p: Pt) {
    this.d = `M${round(p[0])} ${round(p[1])}`
    this.pts = [p]
    this.at = p
  }
  line(p: Pt) {
    const l = Math.hypot(p[0] - this.at[0], p[1] - this.at[1])
    const n = Math.max(1, Math.ceil(l / 4))
    for (let i = 1; i <= n; i++) this.pts.push([this.at[0] + ((p[0] - this.at[0]) * i) / n, this.at[1] + ((p[1] - this.at[1]) * i) / n])
    this.d += `L${round(p[0])} ${round(p[1])}`
    this.len += l
    this.at = p
    return this
  }
  curve(c1: Pt, c2: Pt, p: Pt) {
    const q = [this.at, c1, c2, p]
    let prev = this.at
    for (let i = 1; i <= 32; i++) {
      const next = bezier(q, i / 32)
      this.len += Math.hypot(next[0] - prev[0], next[1] - prev[1])
      this.pts.push(next)
      prev = next
    }
    this.d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p[0])} ${round(p[1])}`
    this.at = p
    return this
  }
  /** Straight runs through an axis-aligned list of corners, each corner rounded. */
  through(points: Pt[], r = 10) {
    const pts = points.filter((p, i) => !same(p, i === 0 ? this.at : points[i - 1]))
    pts.forEach((p, i) => {
      const next = pts[i + 1]
      const a = this.at
      const inLen = Math.hypot(p[0] - a[0], p[1] - a[1])
      const outLen = next ? Math.hypot(next[0] - p[0], next[1] - p[1]) : 0
      const k = Math.min(r, inLen / 2, outLen / 2)
      if (!next || k < 0.5) {
        this.line(p)
        return
      }
      const before: Pt = [p[0] - ((p[0] - a[0]) / inLen) * k, p[1] - ((p[1] - a[1]) / inLen) * k]
      const after: Pt = [p[0] + ((next[0] - p[0]) / outLen) * k, p[1] + ((next[1] - p[1]) / outLen) * k]
      this.line(before).curve(p, p, after)
    })
    return this
  }
}

/**
 * Places the graph (spec §4.2). Lanes stack top to bottom, and each step sits
 * on its lane's grid at `at`. Cables are drawn one of five ways:
 * - next column (or same row): port to port;
 * - further along a lane across rows: along a bus above the first row or below the last;
 * - back along the same lane: an arc over the steps;
 * - down to the next lane: under the step, along the gap, down into the step;
 * - anywhere else: along the gaps and a side channel (left going up, right going down).
 * Routes: every way from a trigger to the end that takes at most one
 * loop-back, trimmed to MAX_ROUTES that between them pass every step and cable.
 */
export function layoutGraph(g: EndToEnd): GraphLayout {
  const { col: C, row: R, node: N, padX, channel: CH, track, head, label, padB, gap, slot, top } = GEOM
  const ids = g.steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(g.steps.map((s) => [s.id, s]))
  for (const c of g.cables) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)
  const laneIndex = new Map(g.lanes.map((l, i) => [l.id, i]))

  const width = CH * 2 + padX * 2 + Math.max(...g.steps.map((s) => s.at[0])) * C + N
  const lanes = {} as Record<LaneId, Box>
  const rows = new Map<LaneId, number>()
  let y = top
  for (const lane of g.lanes) {
    const last = Math.max(0, ...g.steps.filter((s) => s.lane === lane.id).map((s) => s.at[1]))
    rows.set(lane.id, last)
    const h = head + last * R + N + label + padB
    lanes[lane.id] = { x: CH, y, w: width - CH * 2, h }
    y += h + gap
  }
  const height = y

  const nodes: Record<string, Placed> = {}
  for (const s of g.steps) nodes[s.id] = { x: CH + padX + s.at[0] * C, y: lanes[s.lane].y + head + s.at[1] * R, lane: s.lane }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  const under = (id: string) => nodes[id].y + N + label - 4

  // Each cable crossing a gap gets its own height in it; each side-channel cable its own track.
  const used = new Map<LaneId, number>()
  const OFFSETS = [0, -1, 1, -2, 2, -3, 3]
  const gapBelow = (lane: LaneId) => {
    const k = used.get(lane) ?? 0
    used.set(lane, k + 1)
    return lanes[lane].y + lanes[lane].h + gap / 2 + OFFSETS[k % OFFSETS.length] * slot
  }
  const tracks = { left: 0, right: 0 }

  const cables: LaidCable[] = g.cables.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    const si = laneIndex.get(s.lane)!
    const ti = laneIndex.get(t.lane)!
    let pen: Pen
    let a: Pt
    let b: Pt
    let mid: Pt
    let align: LaidCable['align'] = 'center'
    if (si === ti && t.at[0] > s.at[0] && (t.at[0] - s.at[0] === 1 || t.at[1] === s.at[1])) {
      a = [nodes[s.id].x + N, cy(s.id)]
      b = [nodes[t.id].x, cy(t.id)]
      const dx = Math.max(28, (b[0] - a[0]) / 2)
      pen = new Pen(a).curve([a[0] + dx, a[1]], [b[0] - dx, b[1]], b)
      mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    } else if (si === ti && t.at[0] > s.at[0]) {
      const middle = rows.get(s.lane)! / 2
      const far = Math.abs(s.at[1] - middle) >= Math.abs(t.at[1] - middle) ? s : t
      const topBus = far.at[1] < middle
      const busY = topBus ? lanes[s.lane].y + head - 18 : lanes[s.lane].y + head + rows.get(s.lane)! * R + N + label + 8
      const end = (id: string) => [cx(id), topBus ? nodes[id].y : under(id)] as Pt
      a = s === far ? end(s.id) : [nodes[s.id].x + N, cy(s.id)]
      b = t === far ? end(t.id) : [nodes[t.id].x, cy(t.id)]
      const via: Pt[] = []
      if (s !== far) via.push([a[0] + 20, a[1]])
      via.push([s === far ? a[0] : a[0] + 20, busY], [t === far ? b[0] : b[0] - 20, busY])
      if (t !== far) via.push([b[0] - 20, b[1]])
      pen = new Pen(a).through([...via, b])
      mid = [(a[0] + b[0]) / 2, busY]
    } else if (si === ti) {
      a = [cx(s.id), nodes[s.id].y]
      b = [cx(t.id), nodes[t.id].y]
      pen = new Pen(a).curve([a[0], a[1] - 40], [b[0], b[1] - 40], b)
      mid = [(a[0] + b[0]) / 2, a[1] - 30]
    } else if (ti === si + 1) {
      a = [cx(s.id), under(s.id)]
      b = [cx(t.id), nodes[t.id].y]
      const gy = gapBelow(s.lane)
      pen = new Pen(a).through([[a[0], gy], [b[0], gy], b])
      mid = [(a[0] + b[0]) / 2, gy]
    } else {
      const side = ti < si ? 'left' : 'right'
      const k = tracks[side]++
      const x = side === 'left' ? 8 + k * track : width - 8 - k * track
      a = [cx(s.id), under(s.id)]
      b = [cx(t.id), nodes[t.id].y]
      const g1 = gapBelow(s.lane)
      const g2 = gapBelow(g.lanes[ti - 1].id)
      pen = new Pen(a).through([[a[0], g1], [x, g1], [x, g2], [b[0], g2], b])
      mid = side === 'left' ? [x + 12, g1] : [x - 12, g1]
      align = side === 'left' ? 'start' : 'end'
    }
    return { ...c, d: pen.d, len: round(pen.len), mid, align, start: a, end: b, pts: pen.pts }
  })

  const outs = new Map<string, number[]>()
  cables.forEach((c, k) => outs.set(c.from, [...(outs.get(c.from) ?? []), k]))
  type Found = { nodes: string[]; hops: number[]; loops: number }
  const found: Found[] = []
  const walk = (path: string[], hops: number[], loops: number) => {
    if (found.length >= 5000) return
    const out = outs.get(path[path.length - 1]) ?? []
    if (!out.length) {
      found.push({ nodes: path, hops, loops })
      return
    }
    for (const k of out) {
      const isLoop = cables[k].kind === 'loop'
      if (isLoop && loops >= 1) continue
      walk([...path, cables[k].to], [...hops, k], loops + (isLoop ? 1 : 0))
    }
  }
  for (const s of g.steps) if (!g.cables.some((c) => c.to === s.id)) walk([s.id], [], 0)

  // Fewest routes that pass every step and cable, then an even spread of the rest.
  const need = new Set([...ids, ...cables.map((_, k) => `#${k}`)])
  const keys = (r: Found) => [...r.nodes, ...r.hops.map((k) => `#${k}`)]
  const chosen: Found[] = []
  while (need.size && chosen.length < MAX_ROUTES) {
    let best: Found | null = null
    let gain = 0
    for (const r of found) {
      if (chosen.includes(r)) continue
      const n = new Set(keys(r).filter((k) => need.has(k))).size
      if (n > gain) {
        best = r
        gain = n
      }
    }
    if (!best) break
    chosen.push(best)
    for (const k of keys(best)) need.delete(k)
  }
  const stride = Math.max(1, Math.floor(found.length / MAX_ROUTES))
  for (let i = 0; i < found.length && chosen.length < MAX_ROUTES; i += stride) if (!chosen.includes(found[i])) chosen.push(found[i])

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
      run += `L${round(c.start[0])} ${round(c.start[1])}${c.d.replace(/^M[^LC]*/, '')}`
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

  return { lanes, nodes, cables, width, height, routes: chosen.map(measure) }
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/endToEnd-layout.test.ts`
Expected: PASS, 11 tests. If "keeps every cable clear" or "crosses other lanes only in the side channels" fails, the message names the cable and the step or lane. Fix the routing branch for that cable in `layoutGraph` with superpowers:systematic-debugging, and never loosen the test's boxes.

- [ ] **Step 5: Commit**

```bash
git add lib/endToEnd/layout.ts tests/endToEnd-layout.test.ts
git commit -m "feat: End-to-End graph layout: lanes, gap and side-channel cables, ball routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The page render (icons, styles, render)

**Files:**
- Create: `lib/endToEnd/icons.ts`, `lib/endToEnd/styles.ts`, `lib/endToEnd/render.ts`
- Create (placeholder until Task 4): `lib/endToEnd/client.js`, holding only a comment line, so the renderer can read it
- Test: `tests/endToEnd-render.test.ts`

**Interfaces:**
- Consumes: `endToEnd`, `KIND_TYPES`, `EndToEnd` (Task 1); `layoutGraph`, `GEOM` (Task 2); `esc` from `lib/buildPlan/render.ts`; `pageCss` and `Themes` from `lib/buildPlan/styles.ts`; `readTokens` and `readContrast` from `lib/tokens.ts`.
- Produces:
  - `iconSvg(name: string, size?: number): string`.
  - `e2eCss(t: Themes): string`.
  - `PAGE_PATH = '/end-to-end.html'`.
  - `renderEndToEnd(g?: EndToEnd, themes?: Themes): string`.
  - Markup contract for the client script:
    - `nav.toc a[href="#lane-x"]` chips.
    - Lane bands `div.lane#lane-x`.
    - `figure.canvas[data-run][data-routes]` containing `.canvas-scroll > .stage`, `svg .edge[data-edge]`, `.run-dot[data-route]` and `button.node[data-node]`.
    - Legend buttons `.key[data-node="key:<id>"]`.
    - The panel `#node-panel` with `[data-p=type|label|what|close]` and a `dl`.
    - JSON in `#graph-nodes`.

- [ ] **Step 1: Write the failing test** at `tests/endToEnd-render.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { endToEnd as g, type EndToEnd } from '@/data/endToEnd'
import { iconSvg } from '@/lib/endToEnd/icons'
import { layoutGraph } from '@/lib/endToEnd/layout'
import { renderEndToEnd } from '@/lib/endToEnd/render'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderEndToEnd()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)

describe('renderEndToEnd', () => {
  it('opens with the title, the card’s line, the stance and the legend', () => {
    expect(doc.title).toBe(g.title)
    expect(doc.querySelector('h1')!.textContent).toBe('The End-to-End Workflow')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.stance')!.textContent).toBe('Nothing leaves the graph without a human yes.')
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/end-to-end.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the eleven lanes, each pointing at its lane', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.lanes.map((l) => `#lane-${l.id.toLowerCase()}`))
    expect(doc.querySelector('nav.toc')!.getAttribute('aria-label')).toBe('Lanes')
    for (const lane of g.lanes) expect(doc.getElementById(`lane-${lane.id.toLowerCase()}`)!.querySelector('.lane-head')!.textContent).toContain(lane.name)
  })

  it('makes the five legend keys clickable, each with its meaning', () => {
    const keys = [...doc.querySelectorAll<HTMLElement>('.legend button[data-node]')]
    expect(keys.map((k) => k.dataset.node)).toEqual(g.legend.map((k) => `key:${k.id}`))
    for (const k of keys) {
      expect(data()[k.dataset.node!].what).toMatch(/\.$/)
      expect(k.getAttribute('aria-haspopup')).toBe('dialog')
    }
  })

  it('draws every step as a button with a plain description, its number, and its gate or machine badge', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('button.node')]
    expect(buttons.map((b) => b.dataset.node)).toEqual(g.steps.map((s) => s.id))
    for (const s of g.steps) {
      const b = doc.querySelector(`button.node[data-node="${s.id}"]`)!
      expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
      expect(b.querySelector('.badge-n')?.textContent ?? null, s.id).toBe(s.n === undefined ? null : String(s.n))
      expect(!!b.querySelector('.badge-auto'), s.id).toBe(!!s.enforced)
      expect(!!b.querySelector('.badge-lock'), s.id).toBe(s.kind === 'gate')
    }
    expect(data().i1.type).toBe('APPROVAL GATE')
    expect(data().e1.type).toBe('STEP · RUNS ON ITS OWN')
  })

  it('draws every cable, loop-backs dashed, with its label', () => {
    expect(doc.querySelectorAll('.edge[data-edge]')).toHaveLength(g.cables.length)
    expect(doc.querySelectorAll('.edge.loop')).toHaveLength(g.cables.filter((c) => c.kind === 'loop').length)
    expect(doc.querySelectorAll('.edge-label')).toHaveLength(g.cables.filter((c) => c.label).length)
    expect(doc.querySelectorAll('.edge-label.start').length).toBeGreaterThan(0)
  })

  it('sends balls down the layout’s routes, with the timing the page needs to light steps up', () => {
    const f = doc.querySelector<HTMLElement>('figure.canvas')!
    const routes = JSON.parse(f.dataset.routes!) as { len: number; stops: [string, number][]; spans: [number, number, number][] }[]
    expect(routes).toHaveLength(layoutGraph(g).routes.length)
    expect(f.querySelectorAll('.run-dot')).toHaveLength(routes.length)
    for (const r of routes) {
      for (const [key] of r.stops) expect(f.querySelector(`[data-node="${key}"]`), key).not.toBeNull()
      for (const [edge] of r.spans) expect(edge).toBeLessThan(g.cables.length)
    }
  })

  it('lists each lane’s steps for screen readers, and scrolls in its own frame', () => {
    for (const lane of g.lanes) {
      const list = doc.querySelectorAll(`#lane-${lane.id.toLowerCase()} ol.steps li`)
      expect(list, lane.id).toHaveLength(g.steps.filter((s) => s.lane === lane.id).length)
    }
    expect(doc.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(g.glossary.terms.length)
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
    expect(html).toContain(':root[data-embedded] .home{display:none}')
  })

  it('wears Kraft’s tokens and the site’s contrast settings', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=light]){--ink2:${readContrast().dark.ink2}`)
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'a1"><i>y</i>'
    const evil: EndToEnd = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      steps: g.steps.map((s) => (s.id === 'a1' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
      cables: g.cables.map((c) => (c.from === 'a1' ? { ...c, from: bad } : c)),
    }
    const out = renderEndToEnd(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the graph names', () => {
    for (const s of g.steps) expect(iconSvg(s.icon), s.icon).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(400_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/endToEnd-render.test.ts`
Expected: FAIL, because `@/lib/endToEnd/icons` and `@/lib/endToEnd/render` do not exist.

- [ ] **Step 3: Write `lib/endToEnd/icons.ts`**

```ts
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Phosphor from '@phosphor-icons/react/ssr'

const ICONS = Phosphor as unknown as Record<string, ComponentType<{ size?: number }>>

/** A Phosphor icon (by name, without "Icon") as inline SVG, rendered when the page is built. */
export function iconSvg(name: string, size = 22): string {
  const Icon = ICONS[`${name}Icon`]
  if (!Icon) throw new Error(`No Phosphor icon named ${name}Icon`)
  return renderToStaticMarkup(createElement(Icon, { size }))
}
```

- [ ] **Step 4: Write `lib/endToEnd/styles.ts`**

```ts
import { pageCss, type Themes } from '../buildPlan/styles.ts'

/**
 * The End-to-End page's CSS: the build plan's look (imported as it is, never
 * edited), plus lanes, badges, the line legend and the glossary (spec §4).
 */
export function e2eCss(themes: Themes): string {
  return `${pageCss(themes)}
.page{max-width:1240px}
.stance{font-weight:600;color:var(--ink)}
.legend .line{display:inline-block;width:26px;border-top:2px solid var(--b2)}
.legend .line-signal{width:10px;height:10px;border:0;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash)}
.legend .line-loop{border-top:2px dashed var(--accent)}
.legend .line-gate,.legend .line-auto{position:static;width:auto;border:0}
.lane{position:absolute;border-radius:18px;background:color-mix(in srgb,var(--s1) 72%,transparent)}
.lane.alt{background:color-mix(in srgb,var(--accent) 6%,var(--s0))}
.lane-head{position:sticky;left:12px;z-index:2;display:inline-flex;align-items:baseline;gap:10px;margin:12px 0 0 12px;padding:5px 12px;border-radius:999px;border:1px solid var(--b1);background:var(--s0);white-space:nowrap}
.lane-head b{font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.lane-head span{font-size:.75rem;color:var(--ink3)}
.edge.loop{stroke:color-mix(in srgb,var(--accent) 55%,var(--b2));stroke-dasharray:5 5}
.edge.loop.lit{stroke:var(--accent)}
.edge-label.start{transform:translate(0,-50%)}
.edge-label.end{transform:translate(-100%,-50%)}
.badge-n{position:absolute;top:-8px;left:-8px;display:grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--ink);color:var(--bg);font-family:var(--mono);font-size:.625rem;font-weight:500}
.badge-auto,.badge-lock{position:absolute;right:-8px;bottom:-8px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;border:1px solid var(--b2);background:var(--s0);color:var(--accent)}
.legend .badge-auto,.legend .badge-lock{position:static}
.k-approve .node-card{outline:2px solid var(--accent);outline-offset:3px}
.toc b{color:var(--accent);font-weight:600}
.gloss{display:flex;flex-direction:column;gap:18px}
.gloss dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;margin:0}
@media (max-width:760px){.gloss dl{grid-template-columns:minmax(0,1fr)}}
.gloss dl div{display:grid;grid-template-columns:minmax(0,150px) minmax(0,1fr);gap:12px;padding:12px 0;border-bottom:1px solid var(--b1)}
.gloss dt{font-family:var(--mono);font-size:.75rem;color:var(--accent)}
.gloss dd{margin:0;font-size:.875rem;color:var(--ink2)}
@media print{.lane-head{position:static}}
`
}
```

- [ ] **Step 5: Create the placeholder `lib/endToEnd/client.js`** (Task 4 replaces it):

```js
// The End-to-End page's behaviour. Filled in by Task 4 of the plan.
```

- [ ] **Step 6: Write `lib/endToEnd/render.ts`**

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { endToEnd as E2E, KIND_TYPES, type EndToEnd, type StepKind } from '../../data/endToEnd.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { iconSvg } from './icons.ts'
import { layoutGraph } from './layout.ts'
import { e2eCss } from './styles.ts'

/** Where the page is served (public/end-to-end.html). */
export const PAGE_PATH = '/end-to-end.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][] }>

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const anchor = (lane: string) => `lane-${lane.toLowerCase()}`
/** Each kind wears one of the build plan's step looks. */
const LOOK: Record<StepKind, string> = { trigger: 'trigger', step: 'action', ai: 'ai', decision: 'branch', gate: 'approve', agent: 'ai', end: 'end' }
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const AUTO = () => `<span class="badge-auto">${iconSvg('GearSix', 12)}</span>`

function hero(g: EndToEnd, index: NodeIndex) {
  const sample: Record<string, string> = {
    cable: '<span class="line"></span>',
    signal: '<span class="line line-signal"></span>',
    loop: '<span class="line line-loop"></span>',
    gate: LOCK(),
    auto: AUTO(),
  }
  const legend = g.legend
    .map((k) => {
      index[`key:${k.id}`] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="key:${esc(k.id)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${sample[k.id]}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="stance">${esc(g.stance)}</p><ul class="legend" aria-label="How to read the graph">${legend}</ul></header>`
}

/** The whole graph in one frame: lane bands, cables in SVG, their labels, ball templates, and the steps as buttons. */
function graph(g: EndToEnd, index: NodeIndex) {
  const l = layoutGraph(g)
  const byId = new Map(g.steps.map((s) => [s.id, s]))
  for (const s of g.steps) index[s.id] = { label: s.label, type: `${KIND_TYPES[s.kind]}${s.enforced ? ' · RUNS ON ITS OWN' : ''}`, what: s.what, settings: [] }
  const entered = new Set(g.cables.map((c) => c.to))
  const left = new Set(g.cables.map((c) => c.from))
  const bands = g.lanes
    .map((lane, i) => {
      const b = l.lanes[lane.id]
      const items = g.steps
        .filter((s) => s.lane === lane.id)
        .map((s) => {
          const next = g.cables.filter((c) => c.from === s.id).map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
          return `<li>${esc(s.label)} (${esc(s.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
        })
        .join('')
      return `<div class="lane${i % 2 ? ' alt' : ''}" id="${esc(anchor(lane.id))}" style="left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px"><p class="lane-head"><b>${esc(lane.id)} · ${esc(lane.name)}</b><span>${esc(lane.note)}</span></p><ol class="steps sr-only">${items}</ol></div>`
    })
    .join('')
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'loop' ? ' loop' : ''}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .filter((c) => c.label)
    .map((c) => `<span class="edge-label${c.align === 'center' ? '' : ` ${c.align}`}" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label!)}</span>`)
    .join('')
  // One hidden template ball per route; client.js sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  const buttons = g.steps
    .map((s) => {
      const at = l.nodes[s.id]
      const badges = `${s.n === undefined ? '' : `<span class="badge-n">${s.n}</span>`}${s.enforced ? AUTO() : ''}${s.kind === 'gate' ? LOCK() : ''}`
      return `<button type="button" class="node k-${LOOK[s.kind]}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${badges}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>`
    })
    .join('')
  return `<figure class="canvas graph" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(g.caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll graph left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll graph right">›</button></span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="The end-to-end graph, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px">${bands}<svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div></figure>`
}

function glossary(g: EndToEnd) {
  const terms = g.glossary.terms.map(([t, m]) => `<div><dt>${esc(t)}</dt><dd>${esc(m)}</dd></div>`).join('')
  return `<section class="gloss" id="glossary" aria-labelledby="glossary-h"><header class="shead"><span class="kicker">PLAIN ENGLISH</span><h2 id="glossary-h">${esc(g.glossary.title)}</h2><p>${esc(g.glossary.blurb)}</p></header><dl>${terms}</dl></section>`
}

/** The whole End-to-End Workflow page (spec §3–4): one self-contained HTML file. */
export function renderEndToEnd(g: EndToEnd = E2E, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const top = hero(g, index)
  const body = graph(g, index)
  // Git may check the script out with CRLF on Windows; the page is the same everywhere.
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
<style>${e2eCss(themes)}</style>
</head>
<body>
<nav class="toc" aria-label="Lanes">${g.lanes.map((lane) => `<a href="#${esc(anchor(lane.id))}"><b>${esc(lane.id)}</b> ${esc(lane.name)}</a>`).join('')}</nav>
<main class="page">
${top}
${body}
${glossary(g)}
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

- [ ] **Step 7: Run it and watch it pass**

Run: `npx vitest run tests/endToEnd-render.test.ts tests/no-raw-colors.test.ts`
Expected: PASS, 12 + 1 tests.

- [ ] **Step 8: Commit**

```bash
git add lib/endToEnd/icons.ts lib/endToEnd/styles.ts lib/endToEnd/render.ts lib/endToEnd/client.js tests/endToEnd-render.test.ts
git commit -m "feat: render the End-to-End graph page: lanes, steps, cables, legend, glossary

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Behaviour, generator, generated page and browser tests

**Files:**
- Replace: `lib/endToEnd/client.js`
- Create: `scripts/make-e2e.ts`, `scripts/shoot-e2e.mjs`, `e2e/end-to-end.spec.ts`
- Generate: `public/end-to-end.html`, `public/shots/end-to-end.jpeg`
- Modify: `package.json` (scripts), `tests/endToEnd-render.test.ts` (freshness), `tests/no-ghl.test.ts` (FILES)

**Interfaces:**
- Consumes: the markup contract from Task 3.
- Produces: `npm run e2e-page`, and the files `public/end-to-end.html` and `public/shots/end-to-end.jpeg`.

- [ ] **Step 1: Write the failing browser tests** at `e2e/end-to-end.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const PAGE = '/end-to-end.html'

test('reads top to bottom: the header, eleven lane chips, eleven lanes and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('End-to-End Workflow · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The End-to-End Workflow')
  await expect(page.getByRole('navigation', { name: 'Lanes' }).getByRole('link')).toHaveCount(11)
  await expect(page.locator('.lane')).toHaveCount(11)
  await expect(page.locator('#glossary dt')).toHaveCount(23)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="d2"]').click()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
})

test('the lane chips mark the lane on screen', async ({ page }) => {
  await page.goto(`${PAGE}#lane-h`)
  await expect(page.getByRole('navigation', { name: 'Lanes' }).getByRole('link', { name: 'H n8n automation' })).toHaveAttribute('aria-current', 'true')
})

test('a step explains itself; Escape closes it and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const step = page.locator('[data-node="i1"]')
  await step.scrollIntoViewIfNeeded()
  await step.click()
  const panel = page.getByRole('dialog', { name: 'Approval gate' })
  await expect(panel).toBeVisible()
  await expect(panel.locator('[data-p=type]')).toHaveText('APPROVAL GATE')
  await expect(panel.locator('[data-p=what]')).toHaveText(/^The work stops here until I say yes/)
  await expect(panel.locator('dl')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(step).toBeFocused()
})

test('the legend keys explain themselves', async ({ page }) => {
  await page.goto(PAGE)
  await page.getByRole('button', { name: 'Loop-back', exact: true }).click()
  await expect(page.locator('#node-panel')).toContainText('The work goes back to an earlier step')
})

test('balls leave one at a time, at most five, lighting what they pass', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __balls: number[] }
    w.__balls = []
    new MutationObserver((list) => {
      for (const m of list) for (const n of m.addedNodes) if (n instanceof HTMLElement && n.classList.contains('run-ball')) w.__balls.push(performance.now())
    }).observe(document, { childList: true, subtree: true })
  })
  await page.goto(`${PAGE}#lane-a`)
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
  await page.goto(`${PAGE}#lane-a`)
  await page.waitForTimeout(1500)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await expect(page.locator('.lit')).toHaveCount(0)
  await ctx.close()
})

test('at phone width the page never scrolls sideways; the graph pans, and the lane label stays pinned', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${PAGE}#lane-d`)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('.canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await frame.evaluate((el) => (el.scrollLeft = 500))
  const head = (await page.locator('#lane-d .lane-head').boundingBox())!
  const box = (await frame.boundingBox())!
  expect(head.x).toBeGreaterThanOrEqual(box.x)
  expect(head.x).toBeLessThan(box.x + 30)
})

test('every cable label sits inside the graph', async ({ page }) => {
  await page.goto(PAGE)
  const stage = (await page.locator('.stage').boundingBox())!
  for (const label of await page.locator('.edge-label').all()) {
    const b = (await label.boundingBox())!
    expect(b.x).toBeGreaterThanOrEqual(stage.x)
    expect(b.x + b.width).toBeLessThanOrEqual(stage.x + stage.width)
  }
})

test('a drag pans the graph and never opens a step', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 })
  await page.goto(`${PAGE}#lane-g`)
  const frame = page.locator('.canvas-scroll')
  const step = page.locator('[data-node="g3"]')
  const n = (await step.boundingBox())!
  await page.mouse.move(n.x + 28, n.y + 28)
  await page.mouse.down()
  await page.mouse.move(n.x - 160, n.y + 28, { steps: 8 })
  await page.mouse.up()
  expect(await frame.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100)
  await expect(page.locator('#node-panel')).toBeHidden()
})

test('prints without balls, buttons or lane chips', async ({ page }) => {
  await page.goto(PAGE)
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('nav.toc')).toBeHidden()
  await expect(page.locator('.pan')).toBeHidden()
  for (const ball of await page.locator('.run-ball').all()) await expect(ball).toBeHidden()
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
```

- [ ] **Step 2: Add the freshness test** to the end of `tests/endToEnd-render.test.ts`:

```ts
import { readFileSync } from 'node:fs'

describe('public/end-to-end.html', () => {
  it('is up to date with its data (run npm run e2e-page after any change)', () => {
    expect(readFileSync('public/end-to-end.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderEndToEnd())
  })
})
```

The `import` goes at the top of the file with the others. Also change `tests/no-ghl.test.ts` line 6 to:

```ts
const FILES = ['public/build-plan.html', 'public/end-to-end.html']
```

- [ ] **Step 3: Run the unit tests and watch the freshness test fail**

Run: `npx vitest run tests/endToEnd-render.test.ts tests/no-ghl.test.ts`
Expected: FAIL with ENOENT for `public/end-to-end.html` (in both files).

- [ ] **Step 4: Write `lib/endToEnd/client.js`** from the build plan's client, using a one-off script in the scratchpad. The script leaves `lib/buildPlan/client.js` itself untouched:

```js
// scratchpad/make-e2e-client.cjs, run with: node <path> from the repo root
const fs = require('fs')
let s = fs.readFileSync('lib/buildPlan/client.js', 'utf8').replace(/\r\n/g, '\n')
const swap = (a, b) => {
  if (!s.includes(a)) throw new Error('missing: ' + a)
  s = s.replace(a, b)
}
swap("// The build plan's behaviour (public/build-plan.html), inlined by\n// lib/buildPlan/render.ts. Plain browser JS, no libraries (spec §4.3).",
  "// The End-to-End Workflow page's behaviour (public/end-to-end.html), inlined\n// by lib/endToEnd/render.ts. Adapted from lib/buildPlan/client.js, without its\n// test matrix. Plain browser JS, no libraries (spec §4.3).")
swap('  // The section bar marks the section being read.', '  // The lane chips mark the lane on screen.')
swap("document.getElementById('plan-nodes')", "document.getElementById('graph-nodes')")
swap('  const SPEED = 170 // px a second\n  const MAX = 3', '  const SPEED = 220 // px a second\n  const MAX = 5')
swap('diagram), and each takes one random route', 'graph), and each takes one random route')
const cut = s.indexOf('\n  // Test rows stay ticked in this browser')
if (cut < 0) throw new Error('missing test-matrix block')
s = s.slice(0, cut) + '\n})()\n'
fs.writeFileSync('lib/endToEnd/client.js', s)
console.log('lib/endToEnd/client.js:', s.split('\n').length, 'lines')
```

Run: `node "<scratchpad>/make-e2e-client.cjs"`
Expected: it prints about 330 lines. Then `git diff --stat -- lib/buildPlan` prints nothing.

- [ ] **Step 5: Write the generator scripts and the npm script**

`scripts/make-e2e.ts`:

```ts
// Builds public/end-to-end.html from data/endToEnd.ts (spec 2026-09-30-end-to-end-workflow).
// Run after changing the graph's data, layout, styles or script: npm run e2e-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderEndToEnd } from '../lib/endToEnd/render.ts'

const html = renderEndToEnd()
writeFileSync(join(process.cwd(), 'public', 'end-to-end.html'), html)
console.log(`public/end-to-end.html: ${(html.length / 1024).toFixed(1)} KB`)
```

`scripts/shoot-e2e.mjs`:

```js
// Photographs public/end-to-end.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run e2e-page
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400. Reduced motion keeps balls out of the picture.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'dark', reducedMotion: 'reduce' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'end-to-end.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'end-to-end.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
```

In `package.json` `scripts`, add a line after `"plan"`: `"e2e-page": "node scripts/make-e2e.ts && node scripts/shoot-e2e.mjs"`. Put a comma after the `"plan"` line.

- [ ] **Step 6: Generate the page and run the unit tests**

Run: `npm run e2e-page`, then `npx vitest run tests/endToEnd-render.test.ts tests/no-ghl.test.ts tests/endToEnd-layout.test.ts tests/endToEnd-data.test.ts`
Expected: the first prints `public/end-to-end.html: <size> KB` (under 400 KB), and all tests PASS.

- [ ] **Step 7: Run the browser tests**

Run: `npx playwright test e2e/end-to-end.spec.ts --project=desktop --workers=1 > "<scratchpad>/e2e-e2e.txt" 2>&1`, then read the file's tail.
Expected: 12 passed. For a failure, use superpowers:systematic-debugging. A fix to layout or CSS means running `npm run e2e-page` again before re-running.

- [ ] **Step 8: Look at the page once** (desktop 1440, dark and light, and phone 390) with a throwaway Playwright screenshot script in the scratchpad. Check that:
- No label is clipped.
- Cables join the right steps.
- Lane tints alternate.
- The gate outline and the ⚙ badges show.

Fix what the pictures show, then regenerate and re-run Steps 6–7.

- [ ] **Step 9: Commit**

```bash
git add lib/endToEnd/client.js scripts/make-e2e.ts scripts/shoot-e2e.mjs package.json public/end-to-end.html public/shots/end-to-end.jpeg tests/endToEnd-render.test.ts tests/no-ghl.test.ts e2e/end-to-end.spec.ts
git commit -m "feat: End-to-End graph comes alive: balls, panel, lane chips, panning; page generated

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The End-to-End card opens the page

**Files:**
- Create: `components/projects/EndToEndView.tsx`
- Modify: `components/projects/ProjectViews.tsx`, `data/projects.ts:16,27,56-59,138-144`, `data/projectDocs.ts:2,84-115`, `lib/seo.ts:15`
- Test: `tests/projects.test.tsx`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `/end-to-end.html` and `/shots/end-to-end.jpeg` (Task 4); `Window` (with `href` and `flush`).
- Produces: the `Writeup` type `{ view: ProjectView; kicker; title; desc; icon; cue; page?: string; frameTitle?: string; shot?: string }`, and `DOC_VIEWS = ['agentic-framework']`.

- [ ] **Step 1: Write the failing tests**

In `tests/projects.test.tsx`, replace line 14 with:

```ts
    expect(projects.writeups.every((w) => w.page || (DOC_VIEWS as readonly string[]).includes(w.view))).toBe(true)
```

After the build plan screenshot test, add:

```ts
  it('opens the End-to-End Workflow as its own page, with a real 16:10 screenshot on Home', () => {
    const w = projects.writeups.find((x) => x.view === 'end-to-end')!
    expect(w).toMatchObject({ page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', cue: 'READ THE WORKFLOW' })
    expect(DOC_VIEWS).toEqual(['agentic-framework'])
    const shot = BUILDS.find((b) => b.view === 'end-to-end')!.shot
    expect(shot).toBe('/shots/end-to-end.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })
```

In `e2e/projects.spec.ts`, add after the build plan window test:

```ts
test('the End-to-End window shows the graph and follows the site theme', async ({ page }) => {
  await page.goto('/projects#end-to-end')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/end-to-end.html')
  const frame = page.frameLocator('iframe[title="End-to-End Workflow graph"]')
  await expect(frame.getByRole('heading', { level: 1 })).toHaveText('The End-to-End Workflow')
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('inside the End-to-End window, Escape closes it after a click in the graph', async ({ page }) => {
  await page.goto('/projects#end-to-end')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  await page.frameLocator('iframe[title="End-to-End Workflow graph"]').getByRole('heading', { level: 1 }).click()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('lane chips in the graph add no history, so one Back closes the window', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /The End-to-End Workflow/ }).first().click()
  const view = page.getByRole('dialog', { name: 'The End-to-End Workflow' })
  const chips = page.frameLocator('iframe[title="End-to-End Workflow graph"]').getByRole('navigation', { name: 'Lanes' })
  await chips.getByRole('link', { name: 'H n8n automation' }).click()
  await chips.getByRole('link', { name: 'C Frame the task' }).click()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})
```

In the existing `'/projects never fetches the plan page until its window opens'` test, add `expect(asked).not.toContain('/end-to-end.html')`. In `e2e/seo.spec.ts` line 25, add `'/end-to-end.html'` to the list.

- [ ] **Step 2: Run the unit test and watch it fail**

Run: `npx vitest run tests/projects.test.tsx`
Expected: FAIL. The writeup has no `page`, and `DOC_VIEWS` still has two entries.

- [ ] **Step 3: Change the data**

In `data/projects.ts`:
- Line 16: `export const DOC_VIEWS = ['agentic-framework'] as const`
- Line 27: `type Writeup = { view: ProjectView; kicker: string; title: string; desc: string; icon: Icon; cue: string; page?: string; frameTitle?: string; shot?: string }`
- The End-to-End writeup (line 58) gains: `page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', shot: '/shots/end-to-end.jpeg'`
- In `BUILDS`, the writeups line becomes: `...WRITEUPS.map((w) => ({ name: w.title, view: w.view, shot: w.shot ?? \`PLACEHOLDER - ${w.title} screenshot (16:10)\` })),`

In `data/projectDocs.ts`:
- Delete the `'end-to-end': { … },` entry (lines 84–115).
- Then drop every icon import that is no longer used anywhere in the file. Check each one with `grep -c "<Name>Icon" data/projectDocs.ts` (a count of 1 means only the import is left). The expected candidates are `FlowArrowIcon`, `PackageIcon` and `PuzzlePieceIcon`.

In `lib/seo.ts` line 15: `export const STATIC_PAGES = ['/build-plan.html', '/end-to-end.html']`

- [ ] **Step 4: Add the view**

`components/projects/EndToEndView.tsx`:

```tsx
import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The End-to-End Workflow (spec 2026-09-30-end-to-end-workflow): the generated
 * page public/end-to-end.html in the document window. The iframe is only there
 * while the window is open, so /projects never downloads the graph up front.
 * It is same-origin and unsandboxed because we write the page ourselves, which
 * lets it copy the site's theme.
 */
export default function EndToEndView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const w = projects.writeups.find((x) => x.view === 'end-to-end')!
  return (
    <Window open={open} onClose={onClose} title={w.title} href={w.page} flush>
      {open && <iframe src={w.page} title={w.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
```

In `components/projects/ProjectViews.tsx`:
- Add `import EndToEndView from './EndToEndView'` after the `DocView` import.
- Add `<EndToEndView open={view === 'end-to-end'} onClose={close} />` after the `DocView` map.

- [ ] **Step 5: Run the unit suite, lint and types**

Run: `npx vitest run > "<scratchpad>/unit.txt" 2>&1; npm run lint; npx tsc --noEmit`, then read the tail of `unit.txt`.
Expected: every test passes, and lint and tsc are clean. If other tests referenced the old End-to-End doc, update them to the page and record a ruling.

- [ ] **Step 6: Run the browser tests that touch projects and SEO**

Run: `npx playwright test e2e/projects.spec.ts e2e/seo.spec.ts e2e/end-to-end.spec.ts --project=desktop --workers=1 > "<scratchpad>/e2e-site.txt" 2>&1`, then read the tail.
Expected: all passed.

- [ ] **Step 7: Commit**

```bash
git add components/projects/EndToEndView.tsx components/projects/ProjectViews.tsx data/projects.ts data/projectDocs.ts lib/seo.ts tests/projects.test.tsx e2e/projects.spec.ts e2e/seo.spec.ts
git commit -m "feat: End-to-End card opens the live graph; screenshot on Home, page in the sitemap

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Full verification, build plan safety, final review

**Files:** none new.

- [ ] **Step 1: Prove the build plan is untouched**

Run: `git diff --stat main -- lib/buildPlan data/buildPlan.ts scripts/make-plan.ts scripts/shoot-plan.mjs components/projects/PlanView.tsx public/build-plan.html public/shots/build-plan.jpeg`
Expected: no output.

- [ ] **Step 2: Run the whole suite**

Run:
- `npx vitest run`
- `npm run lint`
- `npx tsc --noEmit`
- `npx playwright test --project=desktop --workers=1 > "<scratchpad>/e2e-all.txt" 2>&1`
- `npx playwright test --project=phone --workers=1 > "<scratchpad>/e2e-phone.txt" 2>&1`

Expected: all green. Read both output tails.

- [ ] **Step 3: Final whole-branch review.** Follow the executing-plans skill: a review package, then a fresh reviewer on the most capable model, with the Review Focus list above. Fix Critical and Important findings test-first, and record Minor ones as deferred.

- [ ] **Step 4: Finish the branch** with superpowers:finishing-a-development-branch. Pushing and merging happen only when Justine chooses.
