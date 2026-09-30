# n8n Build Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking **The build plan** on /projects opens a standalone, generated n8n build plan for Trusted Mover (a fictional mover). It shows inside the existing window and can also be opened in a new tab. Every GoHighLevel mention leaves the site.

**Architecture:**
- The plan content is one typed data file, `data/buildPlan.ts`.
- Pure functions turn it into a single self-contained `public/build-plan.html`:
  - `lib/buildPlan/layout.ts` places the n8n-style node canvas;
  - `lib/buildPlan/render.ts` builds the HTML, with CSS from `styles.ts` and vanilla JS from `client.js` inlined.
- `scripts/make-plan.ts` writes the file, and a unit test fails whenever the file is out of date.
- The site shows the file in its `Window` chrome through a same-origin iframe. Inside the dialog, the page copies the parent's theme and access attributes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Vitest + jsdom, Playwright, Node 26 (runs `.ts` directly), `@phosphor-icons/react/ssr` + `react-dom/server` (build time only).

**Spec:** `docs/superpowers/specs/2026-09-30-n8n-build-plan-design.md`

## Global Constraints

**The client and the platform**
- Client: **Trusted Mover**, a fictional moving company in Austin, TX (Central time, USD).
- Platform: **n8n**, with Claude, Google Sheets, Supabase (as the CRM), Stripe, **Gmail** for client emails, and **Telegram** for ops alerts.
- Scope: 6 workflows (TM-01 to TM-06) and 3 helpers (TM-H01 to TM-H03).
- The page's sections, in order: Before anything is built · Naming · Data model · Trigger map · Workflows · Helpers · Test matrix · Build order · Handover.
- Disclosure footer, verbatim: "A worked example. Trusted Mover is a fictional client."
- No GoHighLevel, "HighLevel" or "GHL" anywhere in `app/`, `components/`, `data/`, `hooks/`, `lib/` or `public/build-plan.html`.

**The generated page**
- URL: `/build-plan.html`.
- One self-contained file under **300 KB**. The only external resource allowed is Geist and Geist Mono from Google Fonts.
- Colours come only from `app/globals.css`, through `readTokens()`. No raw hex or rgb in `lib/**` (`tests/no-raw-colors.test.ts`).
- Everything from the data is HTML-escaped, and JSON inside `<script>` can't close the tag.
- Inside the dialog it follows the site's `data-theme` (a missing value means dark) and its `data-a11y-*` attributes. Opened on its own, it follows `prefers-color-scheme` and `prefers-reduced-motion`.
- Diagrams scroll sideways inside their own frame, and the page body never scrolls sideways (390 px phone).

**Behaviour and process**
- `/projects#build-plan`, the board card and ⌘K still open a dialog named **"The build plan"**, with Close focused.
- Tests first (superpowers:test-driven-development). Run with `npx vitest run <file>`, `npm run lint`, `npm run typecheck`, and `npx playwright test <file> --workers=1`.
- Work on branch `feat/n8n-build-plan`. **Commit steps run only if Justine approved per-task commits at kickoff.** Otherwise leave the changes uncommitted and carry on. Every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **The site default theme inside the dialog.** The parent `<html>` has no `data-theme` (the site's default dark). The iframe must be dark, even on a light-mode device. Pinned by the Task 6 e2e test "…follows the site theme".
2. **Storage blocked.** When localStorage throws (a private window), ticking a test row must still work for the visit, with no page errors. Pinned by the Task 4 e2e test "…storage is blocked".
3. **A node near the screen edge.** The settings panel must stay fully on screen at 390 px. Pinned by the Task 4 e2e test "…stays on screen".
4. **Switching nodes while a panel is open.** Clicking a second node moves the panel to it, and focus ends on the panel's Close. Pinned by the Task 4 e2e test "…second step".
5. **/projects must not fetch the plan up front.** The iframe renders only while the window is open. Pinned by the Task 6 unit test "…no iframe while closed" and the e2e test "…never fetches the plan".

---

## File Structure

| File | Responsibility |
|---|---|
| `data/buildPlan.ts` (new) | Types and all plan content. No imports, so Node can run it. |
| `lib/buildPlan/layout.ts` (new) | Pure canvas layout: columns, rows, connector curves, main path, run line |
| `lib/buildPlan/icons.ts` (new) | A Phosphor icon name → inline SVG string (build time) |
| `lib/buildPlan/styles.ts` (new) | The page CSS, with Kraft tokens injected |
| `lib/buildPlan/client.js` (new) | The page's vanilla JS: theme copying, scroll-spy, node panel, run dot, overflow hint, test ticks |
| `lib/buildPlan/render.ts` (new) | `renderPlan()` → the full HTML string |
| `scripts/make-plan.ts` (new) | Writes `public/build-plan.html` |
| `scripts/shoot-plan.mjs` (new) | Writes `public/shots/build-plan.jpeg` (640×400) |
| `public/build-plan.html`, `public/shots/build-plan.jpeg` (generated, committed) | |
| `components/projects/Window.tsx` | Adds `href` (address + Open in new tab) and `flush` (unpadded body) |
| `components/projects/PlanView.tsx` (new) | The build plan window with its iframe |
| `components/projects/ProjectViews.tsx` | Mounts PlanView |
| `components/ui/ViewDialog.tsx` | Focuses `[data-autofocus]` on open |
| `data/projects.ts`, `data/projectDocs.ts` | Build plan card to n8n, docs removed, GoHighLevel removed |
| `lib/seo.ts`, `app/sitemap.ts` | `STATIC_PAGES` in the sitemap |
| `tsconfig.json` | `allowImportingTsExtensions: true`, so Node-runnable `.ts` files can import each other |
| `package.json` | `plan` script |
| Tests (new) | `tests/buildPlan-data.test.ts`, `tests/buildPlan-layout.test.ts`, `tests/buildPlan-render.test.ts`, `tests/no-ghl.test.ts`, `e2e/build-plan.spec.ts` |
| Tests (updated) | `tests/projects.test.tsx`, `tests/commands.test.ts`, `tests/ViewDialog.test.tsx`, `tests/seo.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts` |

---

### Task 1: Plan content (data/buildPlan.ts)

**Files:**
- Create: `data/buildPlan.ts`
- Test: `tests/buildPlan-data.test.ts`

**Interfaces:**
- Produces:
  - the types `IconName`, `NodeKind`, `PlanNode`, `PlanEdge`, `Workflow`, `Rail`, `TestRow`, `Phase`, `Plan`;
  - `KIND_LABELS: Record<NodeKind, string>`;
  - `plan: Plan`.

- [ ] **Step 0: Branch**

```bash
git checkout -b feat/n8n-build-plan
```

- [ ] **Step 1: Write the failing test**

`tests/buildPlan-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { KIND_LABELS, plan, type Workflow } from '@/data/buildPlan'

const all: Workflow[] = [...plan.workflows, ...plan.helpers.list]
const outs = (w: Workflow, id: string) => w.edges.filter((e) => e.from === id)

describe('the build plan content', () => {
  it('has six workflows and three helpers, in build order', () => {
    expect(plan.workflows.map((w) => w.code)).toEqual(['TM-01', 'TM-02', 'TM-03', 'TM-04', 'TM-05', 'TM-06'])
    expect(plan.helpers.list.map((w) => w.code)).toEqual(['TM-H01', 'TM-H02', 'TM-H03'])
  })

  it('connects only nodes that exist, each id once per workflow', () => {
    for (const w of all) {
      const ids = w.nodes.map((n) => n.id)
      expect(new Set(ids).size, w.code).toBe(ids.length)
      for (const e of w.edges) {
        expect(ids, `${w.code} ${e.from}`).toContain(e.from)
        expect(ids, `${w.code} ${e.to}`).toContain(e.to)
      }
    }
  })

  it('gives every decision two or more labelled ways out, and every other step at most one', () => {
    for (const w of all) {
      for (const n of w.nodes) {
        const out = outs(w, n.id)
        if (n.kind === 'branch') {
          expect(out.length, `${w.code} ${n.id}`).toBeGreaterThanOrEqual(2)
          expect(out.every((e) => e.label), `${w.code} ${n.id}`).toBe(true)
        } else {
          expect(out.length, `${w.code} ${n.id}`).toBeLessThanOrEqual(1)
          expect(out.some((e) => e.label), `${w.code} ${n.id}`).toBe(false)
        }
      }
    }
  })

  it('starts every flow at a trigger, and every trigger starts a flow', () => {
    for (const w of all) {
      const entered = new Set(w.edges.map((e) => e.to))
      for (const n of w.nodes) expect(n.kind === 'trigger', `${w.code} ${n.id}`).toBe(!entered.has(n.id))
    }
  })

  it('names a node type and at least one setting for every step, for its settings panel', () => {
    for (const w of all) for (const n of w.nodes) {
      expect(n.type, `${w.code} ${n.id}`).not.toBe('')
      expect(n.settings.length, `${w.code} ${n.id}`).toBeGreaterThan(0)
    }
  })

  it('tests every workflow at least twice, twenty rows in all, each id once', () => {
    const ids = plan.tests.rows.map((r) => r.id)
    expect(ids).toHaveLength(20)
    expect(new Set(ids).size).toBe(20)
    for (const w of plan.workflows) {
      expect(plan.tests.rows.filter((r) => r.workflow === w.code).length, w.code).toBeGreaterThanOrEqual(2)
    }
    for (const r of plan.tests.rows) expect(plan.workflows.map((w) => w.code)).toContain(r.workflow)
  })

  it('adds up to about eleven hours over five phases', () => {
    expect(plan.build.phases).toHaveLength(5)
    expect(plan.build.phases.reduce((a, p) => a + p.hours, 0)).toBe(11)
  })

  it('labels every node kind for the legend', () => {
    expect(Object.keys(KIND_LABELS).sort()).toEqual(['action', 'ai', 'approve', 'branch', 'end', 'helper', 'trigger', 'wait'])
  })

  it('discloses the client is fictional and never mentions GoHighLevel', () => {
    expect(plan.footer.note).toBe('A worked example. Trusted Mover is a fictional client.')
    expect(JSON.stringify(plan)).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/buildPlan-data.test.ts`
Expected: FAIL, "Failed to resolve import "@/data/buildPlan"".

- [ ] **Step 3: Write the data file**

`data/buildPlan.ts`:

```ts
/**
 * The n8n build plan behind The build plan card (spec
 * docs/superpowers/specs/2026-09-30-n8n-build-plan-design.md). A worked
 * example for Trusted Mover, a fictional moving company in Austin, TX.
 * scripts/make-plan.ts renders it into public/build-plan.html. No imports,
 * so Node can run it directly.
 */

export type IconName =
  | 'ArrowsClockwise' | 'ArrowsSplit' | 'Calculator' | 'CalendarCheck' | 'ChatCircleText' | 'Clock' | 'Copy'
  | 'CreditCard' | 'Database' | 'EnvelopeSimple' | 'FlagCheckered' | 'GitBranch' | 'HourglassMedium'
  | 'MagnifyingGlass' | 'Package' | 'PaperPlaneTilt' | 'PencilSimple' | 'Receipt' | 'ShieldCheck' | 'Sparkle'
  | 'Stack' | 'Star' | 'Table' | 'Timer' | 'Truck' | 'UserCheck' | 'Warning' | 'WebhooksLogo' | 'XCircle'

export type NodeKind = 'trigger' | 'action' | 'ai' | 'branch' | 'wait' | 'approve' | 'helper' | 'end'
export type PlanNode = { id: string; kind: NodeKind; label: string; sub: string; icon: IconName; type: string; settings: [string, string][] }
export type PlanEdge = { from: string; to: string; label?: string }
export type Workflow = {
  code: string
  title: string
  outcome: string
  trigger: string
  exits: string[]
  watch: string[]
  nodes: PlanNode[]
  edges: PlanEdge[]
}
export type Rail = { heading: string; body?: string; list?: string[] }
export type TestRow = { id: string; workflow: string; branch: string; input: string; expected: string }
export type Phase = { name: string; hours: number; tasks: string[] }
type Head = { title: string; blurb: string; rail: Rail[] }
export type Plan = {
  title: string
  description: string
  kicker: string
  heading: string
  lede: string
  meta: [string, string][]
  start: Head & { outcome: string; trigger: string; exits: string[]; outOfScope: string[] }
  naming: Head & { rules: { name: string; pattern: string; examples: string[]; rule: string }[] }
  data: Head & { tables: { name: string; fields: string[]; note: string }[]; stages: string[]; exitStages: string[]; sheets: [string, string][] }
  triggers: Head & { rows: [string, string, string][] }
  workflows: Workflow[]
  helpers: Head & { list: Workflow[] }
  tests: Head & { rows: TestRow[] }
  build: Head & { phases: Phase[] }
  handover: Head & { does: string[]; breaks: string[]; call: string; logs: string }
  footer: { note: string; by: string }
}

/** What each node kind means, for the legend and the screen-reader step lists. */
export const KIND_LABELS: Record<NodeKind, string> = {
  trigger: 'Starts it',
  action: 'Step',
  ai: 'Claude',
  branch: 'Decides',
  wait: 'Waits',
  approve: 'Person approves',
  helper: 'Helper',
  end: 'Ends',
}

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, type: string, settings: [string, string][]): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

const TM01: Workflow = {
  code: 'TM-01',
  title: 'Quote request → Qualified lead',
  outcome: 'Every quote becomes a job, or one clear question, within 5 minutes.',
  trigger: 'The quote form on the site posts to /tm/quote.',
  exits: ['Merged into an open job', 'Waiting on one answer', 'Survey link sent'],
  watch: [
    'Claude returns JSON only. The parser rejects anything else, and TM-H01 catches it.',
    'Duplicates are matched on email or phone, never on name.',
    'The question never links to a form.',
  ],
  nodes: [
    node('n1', 'trigger', 'Quote form', 'POST /tm/quote', 'WebhooksLogo', 'Webhook', [['Method', 'POST'], ['Path', '/tm/quote'], ['Respond', 'At once, 202']]),
    node('n2', 'action', 'Normalize fields', 'Edit Fields', 'PencilSimple', 'Edit Fields (Set)', [['Keeps', 'name, email, phone, dates, addresses, notes'], ['Phone', 'to E.164']]),
    node('n3', 'action', 'Find contact', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Operation', 'Get many rows'], ['Table', 'contacts'], ['Match', 'email or phone']]),
    node('n4', 'branch', 'Duplicate in 24 h?', 'If', 'GitBranch', 'If', [['Condition', 'an open job was created under 24 h ago']]),
    node('n5', 'end', 'Merge into open job', 'Supabase', 'Copy', 'Supabase', [['Operation', 'Update row'], ['Table', 'jobs'], ['Adds', 'the new notes to the open job']]),
    node('n6', 'ai', 'Extract move details', 'Claude', 'Sparkle', 'Anthropic Chat Model + Structured Output Parser', [['Model', 'Claude Haiku 4.5'], ['Returns', 'size, move_date, from_zip, to_zip, stairs, specialty[], missing[]'], ['Temperature', '0']]),
    node('n7', 'branch', 'Anything missing?', 'If', 'GitBranch', 'If', [['Condition', 'missing[] is not empty']]),
    node('n8', 'ai', 'Draft one question', 'Claude', 'Sparkle', 'Anthropic Chat Model', [['Model', 'Claude Haiku 4.5'], ['Rule', 'One question, under 40 words, no form links']]),
    node('n9', 'action', 'Ask the client', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Operation', 'Reply'], ['Thread', 'Stays on the quote thread']]),
    node('n10', 'end', 'Stage 0 · needs info', 'Supabase', 'FlagCheckered', 'Supabase', [['Sets', 'stage = 0, needs_info = true']]),
    node('n11', 'action', 'Create job', 'Supabase', 'Database', 'Supabase', [['Operation', 'Upsert contact, insert job'], ['Stage', '0 New lead']]),
    node('n12', 'action', 'Log the quote', 'Google Sheets', 'Table', 'Google Sheets', [['Operation', 'Append row'], ['Tab', 'Quote log']]),
    node('n13', 'helper', 'Notify ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops'], ['Wait for it', 'No']]),
    node('n14', 'end', 'Send survey link', 'Gmail', 'CalendarCheck', 'Gmail', [['Link', 'Cal.com video or in-home survey'], ['Sends', 'Inside business hours']]),
  ],
  edges: [
    edge('n1', 'n2'), edge('n2', 'n3'), edge('n3', 'n4'),
    edge('n4', 'n6', 'no'), edge('n4', 'n5', 'yes'),
    edge('n6', 'n7'),
    edge('n7', 'n11', 'no'), edge('n7', 'n8', 'yes'),
    edge('n8', 'n9'), edge('n9', 'n10'),
    edge('n11', 'n12'), edge('n12', 'n13'), edge('n13', 'n14'),
  ],
}

const TM02: Workflow = {
  code: 'TM-02',
  title: 'Survey → Estimate sent',
  outcome: 'Every survey ends with an approved estimate and a deposit link, the same day.',
  trigger: 'Cal.com posts BOOKING_CREATED to /tm/survey.',
  exits: ['Estimate sent', 'Sent back to the owner', 'No-show, rebook link sent'],
  watch: [
    'Nothing reaches the client until the owner approves.',
    'Rate card changes apply to new estimates only.',
    'Reminders respect business hours in Central time.',
  ],
  nodes: [
    node('a1', 'trigger', 'Survey booked', 'Cal.com', 'CalendarCheck', 'Webhook (Cal.com)', [['Event', 'BOOKING_CREATED'], ['Path', '/tm/survey']]),
    node('a2', 'action', 'Stage 1', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 1, survey_at']]),
    node('a3', 'helper', 'Business hours', 'TM-H03', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H03 · Business-hours gate'], ['Window', '08:00–19:00 CT, Mon–Sat']]),
    node('a4', 'wait', 'Until 24 h before', 'Wait', 'Timer', 'Wait', [['Resume', 'At a set time'], ['Time', 'survey_at minus 24 h']]),
    node('a5', 'action', 'Reminder', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the time, what to have ready, a reschedule link']]),
    node('a6', 'wait', 'Until the survey ends', 'Wait', 'HourglassMedium', 'Wait', [['Resume', 'On webhook call'], ['Timeout', 'survey_at plus 3 h']]),
    node('a7', 'branch', 'Survey done?', 'If', 'GitBranch', 'If', [['Condition', 'the inventory form arrived before the timeout']]),
    node('a8', 'end', 'Rebook link', 'Gmail', 'CalendarCheck', 'Gmail', [['Sends', 'One rebook link, once']]),
    node('a9', 'action', 'Price from rate card', 'Google Sheets', 'Calculator', 'Google Sheets + Code', [['Tab', 'Rate card'], ['Formula', 'crew × hours × rate + truck + materials'], ['Rounds', 'to the nearest $25']]),
    node('a10', 'ai', 'Draft estimate', 'Claude', 'Sparkle', 'Anthropic Chat Model', [['Model', 'Claude Sonnet 4.6'], ['Input', 'inventory, price lines, move date'], ['Tone', 'Plain, no upsell']]),
    node('a11', 'approve', 'Owner approves', 'Wait on form', 'UserCheck', 'Wait (on form submit)', [['Sends', 'the draft with Approve and Edit to the owner'], ['Timeout', '24 h, then a reminder']]),
    node('a12', 'branch', 'Approved?', 'If', 'GitBranch', 'If', [['Condition', 'decision = approve']]),
    node('a13', 'end', 'Back to owner', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Sends', 'the edit note'], ['Job', 'stays at stage 1']]),
    node('a14', 'action', 'Deposit link', 'Stripe', 'CreditCard', 'Stripe (HTTP Request)', [['Creates', 'a Checkout Session'], ['Amount', '20% of the estimate'], ['Metadata', 'job_id']]),
    node('a15', 'end', 'Send estimate', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Then', 'stage = 2 Estimate sent']]),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'), edge('a5', 'a6'), edge('a6', 'a7'),
    edge('a7', 'a9', 'yes'), edge('a7', 'a8', 'no'),
    edge('a9', 'a10'), edge('a10', 'a11'), edge('a11', 'a12'),
    edge('a12', 'a14', 'yes'), edge('a12', 'a13', 'no'),
    edge('a14', 'a15'),
  ],
}

const TM03: Workflow = {
  code: 'TM-03',
  title: 'Deposit paid → Move booked',
  outcome: 'A paid deposit books the move, and an unpaid estimate never sits forgotten.',
  trigger: 'Stripe checkout.session.completed, plus an hourly sweep.',
  exits: ['Booked', 'Nudged', 'Lost after two nudges'],
  watch: [
    'Unsigned Stripe calls are rejected.',
    'Stripe can send an event twice. The job is booked once.',
    'Nudges stop the moment a deposit lands.',
  ],
  nodes: [
    node('b1', 'trigger', 'Deposit paid', 'Stripe', 'CreditCard', 'Webhook (Stripe)', [['Event', 'checkout.session.completed'], ['Path', '/tm/stripe']]),
    node('b2', 'action', 'Verify signature', 'Code', 'ShieldCheck', 'Code', [['Checks', 'Stripe-Signature against the signing secret'], ['Rejects', 'anything unsigned, with 400']]),
    node('b3', 'action', 'Find job', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Match', 'metadata.job_id'], ['Skips', 'jobs already at stage 3']]),
    node('b4', 'action', 'Stage 3 · Booked', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 3, deposit_paid_at']]),
    node('b5', 'action', 'Add to crew schedule', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Crew schedule'], ['Row', 'date, size, from, to, crew (blank)']]),
    node('b6', 'action', 'Confirmation', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the date, arrival window, prep checklist']]),
    node('b7', 'helper', 'Notify ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops']]),
    node('s1', 'trigger', 'Every hour', 'Schedule', 'Clock', 'Schedule Trigger', [['Interval', 'Every hour']]),
    node('s2', 'action', 'Unpaid estimates', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Filter', 'stage = 2, sent over 72 h ago']]),
    node('s3', 'branch', 'Nudges sent?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', '0, 1, 2']]),
    node('s4', 'end', 'Nudge 1', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Sets', 'nudges_sent = 1']]),
    node('s5', 'end', 'Nudge 2', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Sets', 'nudges_sent = 2']]),
    node('s6', 'end', 'Stage · Lost', 'Supabase', 'XCircle', 'Supabase', [['Sets', 'stage = Lost']]),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'), edge('b5', 'b6'), edge('b6', 'b7'),
    edge('s1', 's2'), edge('s2', 's3'),
    edge('s3', 's4', '0'), edge('s3', 's5', '1'), edge('s3', 's6', '2'),
  ],
}

const TM04: Workflow = {
  code: 'TM-04',
  title: 'Move week → Crew dispatched',
  outcome: 'Every move has a crew, and a client who knows when they arrive.',
  trigger: 'Schedule, every day at 07:00 Central.',
  exits: ['Packing guide sent', 'Crew confirmed', 'Ops alerted', 'Arrival window sent'],
  watch: [
    'A missing crew two days out is the one alert that must not be missed.',
    'Dates are compared in Central time, not UTC.',
  ],
  nodes: [
    node('c1', 'trigger', 'Every day, 07:00', 'Schedule', 'Clock', 'Schedule Trigger', [['Cron', '0 7 * * *'], ['Timezone', 'America/Chicago']]),
    node('c2', 'action', 'Upcoming moves', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Filter', 'stage 3–4, move_date in 1, 2 or 7 days']]),
    node('c3', 'branch', 'Days out?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', '7, 2, 1']]),
    node('c4', 'action', 'Stage 4 · Move week', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 4']]),
    node('c5', 'end', 'Packing guide', 'Gmail', 'Package', 'Gmail', [['Sends', 'packing tips and what the crew brings']]),
    node('c6', 'branch', 'Crew assigned?', 'If', 'GitBranch', 'If', [['Reads', 'the crew column of the Crew schedule']]),
    node('c7', 'end', 'Crew confirmation', 'Gmail', 'Truck', 'Gmail', [['To', 'the crew lead and the client']]),
    node('c8', 'helper', 'Alert ops', 'TM-H02', 'Warning', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops'], ['Priority', 'urgent']]),
    node('c9', 'end', 'Arrival window', 'Gmail', 'Clock', 'Gmail', [['Window', 'from the crew schedule, e.g. 8–10 am']]),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'),
    edge('c3', 'c4', '7'), edge('c4', 'c5'),
    edge('c3', 'c6', '2'), edge('c6', 'c7', 'yes'), edge('c6', 'c8', 'no'),
    edge('c3', 'c9', '1'),
  ],
}

const TM05: Workflow = {
  code: 'TM-05',
  title: 'Move done → Paid + reviewed',
  outcome: 'Every finished move is paid, and every reply lands with the right person.',
  trigger: 'The crew sets status to Done on the Crew schedule sheet.',
  exits: ['Closed with a review link', 'Claim open', 'Owner follow-up'],
  watch: [
    'A damage mention always goes to a person, never to an auto-reply.',
    'The review link is only sent after the invoice is paid.',
  ],
  nodes: [
    node('d1', 'trigger', 'Crew marks done', 'Google Sheets', 'Table', 'Google Sheets Trigger', [['Event', 'Row updated'], ['Column', 'status = Done']]),
    node('d2', 'action', 'Stage 5 · Moved', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 5']]),
    node('d3', 'action', 'Final invoice', 'Stripe', 'Receipt', 'Stripe', [['Amount', 'estimate minus deposit, plus any extra hours'], ['Due', 'on receipt']]),
    node('d4', 'wait', 'Until paid', 'Wait', 'HourglassMedium', 'Wait (on webhook)', [['Resumes on', 'invoice.paid'], ['Timeout', '7 days, then TM-H02']]),
    node('d5', 'wait', '1 day', 'Wait', 'Timer', 'Wait', [['Amount', '1 day']]),
    node('d6', 'action', 'Feedback question', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Asks', '“How did the move go?”, one line']]),
    node('d7', 'wait', 'Until reply', 'Wait', 'ChatCircleText', 'Wait (on webhook)', [['Resumes on', 'a Gmail reply'], ['Timeout', '5 days, then close']]),
    node('d8', 'ai', 'Sort the reply', 'Claude', 'Sparkle', 'Text Classifier', [['Model', 'Claude Haiku 4.5'], ['Classes', 'damage, complaint, praise']]),
    node('d9', 'branch', 'Kind?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', 'praise, damage, complaint']]),
    node('d10', 'action', 'Review link', 'Gmail', 'Star', 'Gmail', [['Link', 'the Google review page']]),
    node('d11', 'end', 'Stage 6 · Closed', 'Supabase', 'FlagCheckered', 'Supabase', [['Sets', 'stage = 6']]),
    node('d12', 'action', 'Open a claim', 'Supabase', 'Warning', 'Supabase', [['Writes', 'events: type = claim'], ['Holds', 'the job at stage 5 until resolved']]),
    node('d13', 'helper', 'Alert ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Priority', 'urgent']]),
    node('d14', 'end', 'Task for the owner', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Sends', 'the reply and a link to the job']]),
  ],
  edges: [
    edge('d1', 'd2'), edge('d2', 'd3'), edge('d3', 'd4'), edge('d4', 'd5'), edge('d5', 'd6'), edge('d6', 'd7'), edge('d7', 'd8'), edge('d8', 'd9'),
    edge('d9', 'd10', 'praise'), edge('d10', 'd11'),
    edge('d9', 'd12', 'damage'), edge('d12', 'd13'),
    edge('d9', 'd14', 'complaint'),
  ],
}

const TM06: Workflow = {
  code: 'TM-06',
  title: 'Cancel or reschedule',
  outcome: 'Changes are handled the same day, with refunds that follow the policy exactly.',
  trigger: 'The reschedule form posts to /tm/change.',
  exits: ['New date confirmed', 'Three dates offered', 'Cancelled and refunded'],
  watch: [
    'The refund amount comes from the Code node, never from Claude.',
    'A $0 refund skips Stripe but still confirms.',
  ],
  nodes: [
    node('e1', 'trigger', 'Change request', 'POST /tm/change', 'WebhooksLogo', 'Webhook', [['From', 'the reschedule form on the site'], ['Carries', 'job_id, type, new date']]),
    node('e2', 'action', 'Find job', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Match', 'job_id']]),
    node('e3', 'branch', 'Type?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', 'reschedule, cancel']]),
    node('e4', 'action', 'Check crew calendar', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Crew schedule']]),
    node('e5', 'branch', 'Slot free?', 'If', 'GitBranch', 'If', [['Condition', 'a crew is free on the new date']]),
    node('e6', 'end', 'Move the date', 'Supabase + Sheets', 'ArrowsClockwise', 'Supabase + Google Sheets', [['Updates', 'move_date and the schedule row'], ['Sends', 'a confirmation']]),
    node('e7', 'end', 'Offer 3 dates', 'Gmail', 'CalendarCheck', 'Gmail', [['Offers', 'the next three free dates']]),
    node('e8', 'action', 'Refund by policy', 'Code', 'Calculator', 'Code', [['14 days or more', '100% of the deposit'], ['7–13 days', '50%'], ['Under 7 days', 'deposit kept']]),
    node('e9', 'action', 'Stripe refund', 'Stripe', 'CreditCard', 'Stripe', [['Operation', 'Create refund'], ['Skips', 'when the amount is $0']]),
    node('e10', 'action', 'Stage · Cancelled', 'Supabase', 'XCircle', 'Supabase', [['Sets', 'stage = Cancelled'], ['Also', 'clears the crew schedule row']]),
    node('e11', 'end', 'Confirm', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the refund amount, if any']]),
  ],
  edges: [
    edge('e1', 'e2'), edge('e2', 'e3'),
    edge('e3', 'e4', 'reschedule'), edge('e4', 'e5'), edge('e5', 'e6', 'yes'), edge('e5', 'e7', 'no'),
    edge('e3', 'e8', 'cancel'), edge('e8', 'e9'), edge('e9', 'e10'), edge('e10', 'e11'),
  ],
}

const H01: Workflow = {
  code: 'TM-H01',
  title: 'Error handler',
  outcome: 'Every failure is logged and reaches ops with a link to the run.',
  trigger: 'n8n’s Error Trigger, set as the error workflow on every TM workflow.',
  exits: ['Logged and sent'],
  watch: ['It never retries on its own. A person decides.'],
  nodes: [
    node('h1', 'trigger', 'Any failure', 'Error Trigger', 'Warning', 'Error Trigger', [['Covers', 'every TM workflow (Settings → Error workflow)']]),
    node('h2', 'action', 'Log it', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Errors'], ['Row', 'workflow, node, message, execution URL']]),
    node('h3', 'end', 'Tell ops', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Includes', 'the execution link']]),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'TM-H02',
  title: 'Notify ops',
  outcome: 'One place formats every ops message.',
  trigger: 'Called by another workflow.',
  exits: ['Message sent'],
  watch: ['Urgent messages are pinned in the group.'],
  nodes: [
    node('g1', 'trigger', 'Called by a workflow', 'Execute Workflow Trigger', 'Stack', 'Execute Workflow Trigger', [['Inputs', 'text, priority, job_id']]),
    node('g2', 'action', 'Format', 'Edit Fields', 'PencilSimple', 'Edit Fields (Set)', [['Adds', 'the job link and the stage']]),
    node('g3', 'end', 'Send', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Chat', 'the ops group'], ['Urgent', 'pinned, with sound']]),
  ],
  edges: [edge('g1', 'g2'), edge('g2', 'g3')],
}

const H03: Workflow = {
  code: 'TM-H03',
  title: 'Business-hours gate',
  outcome: 'Nobody gets a message at 2 am.',
  trigger: 'Called by another workflow before any client message.',
  exits: ['Resumes inside business hours'],
  watch: ['Business hours are 08:00–19:00 Central, Monday to Saturday.'],
  nodes: [
    node('k1', 'trigger', 'Called by a workflow', 'Execute Workflow Trigger', 'Stack', 'Execute Workflow Trigger', [['Inputs', 'the time a message wants to go out']]),
    node('k2', 'action', 'Next allowed time', 'Code', 'Clock', 'Code', [['Window', '08:00–19:00 CT, Mon–Sat']]),
    node('k3', 'wait', 'Wait until then', 'Wait', 'Timer', 'Wait', [['Resume', 'At a set time']]),
  ],
  edges: [edge('k1', 'k2'), edge('k2', 'k3')],
}

export const plan: Plan = {
  title: 'Trusted Mover build plan',
  description: 'An n8n build plan for a moving company: six workflows, three helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'N8N BUILD PLAN · TRUSTED MOVER',
  heading: 'Every quote, booking and move, planned before a single node is placed.',
  lede:
    'Six n8n workflows and three helpers for Trusted Mover, a moving company in Austin, TX. Claude reads and drafts, Supabase holds the jobs, Google Sheets holds the schedule, Stripe takes the money, and a person approves anything a client sees.',
  meta: [
    ['Client', 'Trusted Mover · Austin, TX'],
    ['Platform', 'n8n'],
    ['Workflows', '6 + 3 helpers'],
    ['Build time', 'About 11 hours'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a job ends.',
    rail: [{ heading: 'Why plan first', body: 'A workflow built without a named outcome grows until nobody can say what it is for. This page is written before n8n is opened.' }],
    outcome: 'Every quote is answered within 5 minutes, and nothing a client sees goes out without a person saying yes.',
    trigger: 'Eight entry points: a web form, Cal.com, Stripe, two schedules, a sheet edit, a change form and n8n’s own error trigger.',
    exits: ['Closed', 'Lost', 'Cancelled', 'Claim open'],
    outOfScope: ['Payroll', 'Truck GPS', 'Accounting exports'],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary for workflows, nodes, links, keys and fields.',
    rail: [
      { heading: 'Why it matters', body: 'Six workflows today, thirty next year. Names are how the owner finds the one that broke.' },
      { heading: 'Rule of thumb', body: 'If an execution log does not read like a sentence, rename the nodes.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'TM-[number] · [Trigger] → [Outcome]', examples: ['TM-01 · Quote request → Qualified lead', 'TM-H02 · Notify ops'], rule: 'The number is the build order. Helpers get an H.' },
      { name: 'Nodes', pattern: '[Verb] [object]', examples: ['Find contact', 'Draft estimate', 'Log the quote'], rule: 'Default names like “HTTP Request1” never survive a build.' },
      { name: 'Webhook paths', pattern: '/tm/[source]', examples: ['/tm/quote', '/tm/change', '/tm/stripe'], rule: 'One path per source, all lowercase.' },
      { name: 'Credentials', pattern: 'TM · [Service] ([mode])', examples: ['TM · Stripe (live)', 'TM · Stripe (test)'], rule: 'Test and live keys never share a name.' },
      { name: 'Supabase fields', pattern: 'snake_case, _at for times, _usd for money', examples: ['deposit_paid_at', 'estimate_usd'], rule: 'The suffix tells you the unit.' },
      { name: 'Sheets tabs', pattern: 'Title Case, one job per tab', examples: ['Crew schedule', 'Rate card'], rule: 'Workflows read columns by header name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Three tables, seven stages and five sheet tabs.',
    rail: [{ heading: 'Source of truth', body: 'Supabase holds jobs and contacts. Sheets hold what people edit by hand: the rates and the crew schedule.' }],
    tables: [
      { name: 'contacts', fields: ['id', 'name', 'email', 'phone', 'created_at'], note: 'One row per person, matched on email or phone.' },
      { name: 'jobs', fields: ['id', 'contact_id', 'stage', 'move_date', 'size', 'from_zip', 'to_zip', 'estimate_usd', 'deposit_paid_at', 'crew', 'nudges_sent', 'source'], note: 'One row per move.' },
      { name: 'events', fields: ['job_id', 'type', 'payload', 'at'], note: 'Every workflow writes one, so the next run knows what already happened.' },
    ],
    stages: ['0 New lead', '1 Survey booked', '2 Estimate sent', '3 Booked', '4 Move week', '5 Moved', '6 Closed'],
    exitStages: ['Lost', 'Cancelled'],
    sheets: [
      ['Quote log', 'Every request, as it arrived'],
      ['Rate card', 'Hourly rates, truck fees and materials'],
      ['Crew schedule', 'One row per booked move. The crew edits it.'],
      ['Test matrix', 'The test rows below, with results'],
      ['Errors', 'One row per failed run'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Every entry point is a webhook, a schedule or a sheet edit. Nothing polls an inbox.' }],
    rows: [
      ['Quote form on the site', 'Webhook /tm/quote', 'TM-01'],
      ['Cal.com', 'BOOKING_CREATED', 'TM-02'],
      ['Stripe', 'checkout.session.completed', 'TM-03'],
      ['Schedule', 'Every hour', 'TM-03'],
      ['Schedule', 'Every day, 07:00 CT', 'TM-04'],
      ['Crew schedule sheet', 'Row status → Done', 'TM-05'],
      ['Reschedule form', 'Webhook /tm/change', 'TM-06'],
      ['Any failure', 'Error Trigger', 'TM-H01'],
    ],
  },
  workflows: [TM01, TM02, TM03, TM04, TM05, TM06],
  helpers: {
    title: 'Helpers',
    blurb: 'Three small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts, errors and quiet hours are written once and called from every workflow.' }],
    list: [H01, H02, H03],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [{ heading: 'How to test', body: 'Each row is one branch, walked with a test contact and Stripe test cards before handover.' }],
    rows: [
      { id: 't01', workflow: 'TM-01', branch: 'New quote', input: 'A fresh email with every field filled', expected: 'Job at stage 0, a Quote log row, survey link sent' },
      { id: 't02', workflow: 'TM-01', branch: 'Duplicate', input: 'The same email again within 24 h', expected: 'Notes merged into the open job, no second job' },
      { id: 't03', workflow: 'TM-01', branch: 'Missing detail', input: 'No move date', expected: 'One question sent, stage 0 needs info' },
      { id: 't04', workflow: 'TM-01', branch: 'Bad JSON from Claude', input: 'Force a parser error', expected: 'TM-H01 logs it and pings Telegram' },
      { id: 't05', workflow: 'TM-02', branch: 'Reminder', input: 'Survey booked for Tuesday 10:00', expected: 'Reminder arrives Monday 10:00 CT' },
      { id: 't06', workflow: 'TM-02', branch: 'No-show', input: 'No inventory form within 3 h', expected: 'One rebook link sent' },
      { id: 't07', workflow: 'TM-02', branch: 'Owner approves', input: 'Approve the draft', expected: 'Estimate and 20% deposit link sent, stage 2' },
      { id: 't08', workflow: 'TM-02', branch: 'Owner edits', input: 'Send it back with a note', expected: 'Note on Telegram, nothing sent to the client' },
      { id: 't09', workflow: 'TM-03', branch: 'Deposit paid', input: 'Stripe test card 4242 4242 4242 4242', expected: 'Stage 3, a crew schedule row, confirmation sent' },
      { id: 't10', workflow: 'TM-03', branch: 'Replayed event', input: 'Resend the same Stripe event', expected: 'Still one booking and one email' },
      { id: 't11', workflow: 'TM-03', branch: 'Unsigned call', input: 'POST without Stripe-Signature', expected: 'Rejected with 400, nothing changes' },
      { id: 't12', workflow: 'TM-03', branch: 'Unpaid for 72 h', input: 'An estimate sent 73 h ago', expected: 'Nudge 1, then nudge 2, then Lost' },
      { id: 't13', workflow: 'TM-04', branch: 'Seven days out', input: 'Move date is today + 7', expected: 'Stage 4, packing guide sent' },
      { id: 't14', workflow: 'TM-04', branch: 'No crew', input: 'Move in 2 days, crew blank', expected: 'Urgent Telegram alert' },
      { id: 't15', workflow: 'TM-04', branch: 'Day before', input: 'Move date is tomorrow', expected: 'Arrival window email' },
      { id: 't16', workflow: 'TM-05', branch: 'Paid and happy', input: 'Pay the invoice, reply “Great crew”', expected: 'Review link sent, stage 6' },
      { id: 't17', workflow: 'TM-05', branch: 'Damage', input: 'Reply “They scratched the table”', expected: 'Claim event and urgent alert, no review link' },
      { id: 't18', workflow: 'TM-06', branch: 'Reschedule, slot free', input: 'A new date with a free crew', expected: 'Date moved, schedule updated, confirmation sent' },
      { id: 't19', workflow: 'TM-06', branch: 'Cancel 10 days out', input: 'Cancel a move 10 days away', expected: 'Half the deposit refunded, stage Cancelled' },
      { id: 't20', workflow: 'TM-06', branch: 'Cancel 3 days out', input: 'Cancel a move 3 days away', expected: 'No refund, still confirmed' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, about 11 hours.',
    rail: [{ heading: 'Order', body: 'Foundation first, then the workflows that take money, then the ones that run on their own.' }],
    phases: [
      { name: '1 · Foundation', hours: 2, tasks: ['Create the Supabase tables: contacts, jobs, events', 'Add the credentials: TM · Supabase, TM · Stripe (test), TM · Gmail, TM · Telegram, TM · Anthropic', 'Create the Sheets tabs: Quote log, Rate card, Crew schedule, Test matrix, Errors', 'Build TM-H01, TM-H02 and TM-H03, and set TM-H01 as the error workflow'] },
      { name: '2 · Intake', hours: 3, tasks: ['Build TM-01 and point the site’s quote form at /tm/quote', 'Build TM-02 with the Cal.com webhook and the approval form', 'Run tests t01–t08'] },
      { name: '3 · Money', hours: 2.5, tasks: ['Build TM-03 with the Stripe webhook and the hourly sweep', 'Build TM-05 with the invoice and the feedback steps', 'Run tests t09–t12, t16 and t17'] },
      { name: '4 · Operations', hours: 2, tasks: ['Build TM-04', 'Build TM-06 with the refund policy', 'Run tests t13–t15 and t18–t20'] },
      { name: '5 · Test and hand over', hours: 1.5, tasks: ['Switch Stripe to live keys', 'Run the whole matrix again with a real card and a real refund', 'Walk the owner through the handover page', 'Turn every workflow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What the owner keeps.',
    rail: [{ heading: 'Written for the owner', body: 'One page, no jargon. It lives next to the workflows.' }],
    does: [
      'Answers every quote within 5 minutes, or asks one question.',
      'Books surveys and drafts estimates for you to approve.',
      'Takes deposits, fills the crew calendar and chases unpaid estimates.',
      'Reminds clients and crews before every move.',
      'Invoices, asks for feedback and sends damage reports to you.',
    ],
    breaks: [
      'Renaming or moving a column in the Crew schedule sheet.',
      'An expired or rotated Stripe key.',
      'Changing the Cal.com event type or its questions.',
      'Turning a workflow off without turning off its schedule.',
    ],
    call: 'Justine Acosta, who built it. Errors already reach the ops Telegram group with a link to the run.',
    logs: 'Every failure is a row in the Errors tab and a Telegram message. Every job change is a row in the Supabase events table.',
  },
  footer: { note: 'A worked example. Trusted Mover is a fictional client.', by: 'Built by Justine Acosta' },
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/buildPlan-data.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add data/buildPlan.ts tests/buildPlan-data.test.ts docs/superpowers/specs/2026-09-30-n8n-build-plan-design.md docs/superpowers/plans/2026-09-30-n8n-build-plan.md
git commit -m "feat: n8n build plan content for Trusted Mover"
```

---

### Task 2: Canvas layout (lib/buildPlan/layout.ts)

**Files:**
- Create: `lib/buildPlan/layout.ts`
- Modify: `tsconfig.json` (add `"allowImportingTsExtensions": true` to `compilerOptions`)
- Test: `tests/buildPlan-layout.test.ts`

**Interfaces:**
- Consumes: `PlanNode` and `PlanEdge` from `data/buildPlan.ts`.
- Produces:
  - `GEOM = { col: 156, row: 116, node: 56, padX: 48, padY: 28, label: 44 }`
  - `type Placed = { col: number; row: number; x: number; y: number }`
  - `type LaidEdge = PlanEdge & { d: string; mid: [number, number] }`
  - `type Layout = { nodes: Record<string, Placed>; edges: LaidEdge[]; width: number; height: number; main: string[]; run: string }`
  - `layout(flow: { nodes: PlanNode[]; edges: PlanEdge[] }): Layout`

- [ ] **Step 1: Write the failing test**

`tests/buildPlan-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { plan, type PlanEdge, type PlanNode } from '@/data/buildPlan'
import { GEOM, layout } from '@/lib/buildPlan/layout'

const n = (id: string): PlanNode => ({ id, kind: 'action', label: id, sub: '', icon: 'Stack', type: 'x', settings: [['a', 'b']] })
const e = (from: string, to: string, label?: string): PlanEdge => ({ from, to, label })
const flow = (ids: string[], edges: PlanEdge[]) => ({ nodes: ids.map(n), edges })

describe('layout', () => {
  it('puts each node in the column of its longest path from the start', () => {
    const l = layout(flow(['a', 'b', 'c', 'd'], [e('a', 'b'), e('b', 'c'), e('a', 'c'), e('c', 'd')]))
    expect(['a', 'b', 'c', 'd'].map((id) => l.nodes[id].col)).toEqual([0, 1, 2, 3])
  })

  it('keeps the first way out on its row and drops every other branch to a new row', () => {
    const l = layout(flow(['a', 'b', 'c', 'd', 'x'], [e('a', 'b', 'yes'), e('a', 'c', 'no'), e('b', 'd'), e('c', 'x')]))
    expect(['a', 'b', 'd'].map((id) => l.nodes[id].row)).toEqual([0, 0, 0])
    expect(['c', 'x'].map((id) => l.nodes[id].row)).toEqual([1, 1])
  })

  it('gives a second start its own row', () => {
    const l = layout(flow(['a', 'b', 's', 't'], [e('a', 'b'), e('s', 't')]))
    expect(l.nodes.s.row).toBe(1)
    expect(l.nodes.t.row).toBe(1)
  })

  it('places nodes on the grid and draws each connector from an out port to an in port', () => {
    const l = layout(flow(['a', 'b'], [e('a', 'b')]))
    expect(l.nodes.b).toEqual({ col: 1, row: 0, x: GEOM.padX + GEOM.col, y: GEOM.padY })
    const y = GEOM.padY + GEOM.node / 2
    expect(l.edges[0].d).toBe(`M${GEOM.padX + GEOM.node} ${y}C${GEOM.padX + GEOM.node + 50} ${y} ${GEOM.padX + GEOM.col - 50} ${y} ${GEOM.padX + GEOM.col} ${y}`)
    expect(l.edges[0].mid).toEqual([(GEOM.padX + GEOM.node + GEOM.padX + GEOM.col) / 2, y])
  })

  it('follows the first way out for the main path, and the run line crosses each node', () => {
    const l = layout(flow(['a', 'b', 'c', 'd'], [e('a', 'b', 'yes'), e('a', 'c', 'no'), e('b', 'd')]))
    expect(l.main).toEqual(['a', 'b', 'd'])
    expect(l.run.startsWith(`M${GEOM.padX + GEOM.node / 2} ${GEOM.padY + GEOM.node / 2}`)).toBe(true)
    expect(l.run.match(/C/g)).toHaveLength(2)
  })

  it('refuses a loop and a connector to a missing node', () => {
    expect(() => layout(flow(['a', 'b'], [e('a', 'b'), e('b', 'a')]))).toThrow(/loop/)
    expect(() => layout(flow(['a'], [e('a', 'z')]))).toThrow(/missing/)
  })

  it('lays out every workflow in the plan with no two nodes on one spot, all inside the stage', () => {
    for (const w of [...plan.workflows, ...plan.helpers.list]) {
      const l = layout(w)
      const spots = Object.values(l.nodes).map((p) => `${p.col}:${p.row}`)
      expect(new Set(spots).size, w.code).toBe(w.nodes.length)
      for (const p of Object.values(l.nodes)) {
        expect(p.x + GEOM.node + GEOM.padX, w.code).toBeLessThanOrEqual(l.width)
        expect(p.y + GEOM.node + GEOM.label + GEOM.padY, w.code).toBeLessThanOrEqual(l.height)
      }
    }
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/buildPlan-layout.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/buildPlan/layout"".

- [ ] **Step 3: Allow `.ts` import paths**

In `tsconfig.json`, add this line under `"compilerOptions"`, right after `"allowJs": true`. It's allowed because `noEmit` is already true.

```json
    "allowImportingTsExtensions": true
```

(Add a comma after `"allowJs": true`.)

- [ ] **Step 4: Write the layout**

`lib/buildPlan/layout.ts`:

```ts
import type { PlanEdge, PlanNode } from '../../data/buildPlan.ts'

/** The canvas grid, in px: column and row pitch, node size, stage padding, and room for a label under the last row. */
export const GEOM = { col: 156, row: 116, node: 56, padX: 48, padY: 28, label: 44 } as const

export type Placed = { col: number; row: number; x: number; y: number }
export type LaidEdge = PlanEdge & { d: string; mid: [number, number] }
export type Layout = { nodes: Record<string, Placed>; edges: LaidEdge[]; width: number; height: number; main: string[]; run: string }

/**
 * Places an n8n-style canvas, left to right (spec §4.2). A node's column is
 * its longest path from a start. Its first way out stays on its row, and
 * every other branch opens a new row below everything placed so far, so two
 * nodes can never share a spot. `main` follows the first way out from the
 * first start; `run` is that path as one SVG line for the live-run dot.
 */
export function layout({ nodes, edges }: { nodes: PlanNode[]; edges: PlanEdge[] }): Layout {
  const ids = nodes.map((n) => n.id)
  const known = new Set(ids)
  if (known.size !== ids.length) throw new Error('Two nodes share an id')
  for (const e of edges) if (!known.has(e.from) || !known.has(e.to)) throw new Error(`Connector ${e.from} → ${e.to} names a missing node`)
  const outs = (id: string) => edges.filter((e) => e.from === id)

  const indeg = new Map(ids.map((id) => [id, 0]))
  for (const e of edges) indeg.set(e.to, indeg.get(e.to)! + 1)
  const roots = ids.filter((id) => indeg.get(id) === 0)

  const col = new Map(ids.map((id) => [id, 0]))
  const left = new Map(indeg)
  const queue = [...roots]
  let done = 0
  while (queue.length) {
    const id = queue.shift()!
    done++
    for (const e of outs(id)) {
      col.set(e.to, Math.max(col.get(e.to)!, col.get(id)! + 1))
      left.set(e.to, left.get(e.to)! - 1)
      if (left.get(e.to) === 0) queue.push(e.to)
    }
  }
  if (done !== ids.length || roots.length === 0) throw new Error('The flow has a loop')

  const row = new Map<string, number>()
  let last = -1
  const visit = (id: string, r: number) => {
    row.set(id, r)
    outs(id).forEach((e, i) => {
      if (!row.has(e.to)) visit(e.to, i === 0 ? r : ++last)
    })
  }
  for (const r of roots) visit(r, ++last)

  const { col: C, row: R, node: N, padX, padY, label } = GEOM
  const placed: Record<string, Placed> = {}
  for (const id of ids) {
    const c = col.get(id)!
    const r = row.get(id)!
    placed[id] = { col: c, row: r, x: padX + c * C, y: padY + r * R }
  }
  const cy = (id: string) => placed[id].y + N / 2

  const laid: LaidEdge[] = edges.map((e) => {
    const x1 = placed[e.from].x + N
    const y1 = cy(e.from)
    const x2 = placed[e.to].x
    const y2 = cy(e.to)
    const dx = Math.max(28, (x2 - x1) / 2)
    return { ...e, d: `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2] }
  })

  const main = [roots[0]]
  for (let next = outs(roots[0])[0]; next; next = outs(next.to)[0]) main.push(next.to)
  let run = `M${placed[main[0]].x + N / 2} ${cy(main[0])}`
  for (let i = 1; i < main.length; i++) {
    const e = laid.find((x) => x.from === main[i - 1] && x.to === main[i])!
    run += `L${placed[main[i - 1]].x + N} ${cy(main[i - 1])}${e.d.replace(/^M[^C]*/, '')}`
  }
  const end = main[main.length - 1]
  run += `L${placed[end].x + N / 2} ${cy(end)}`

  const maxCol = Math.max(...ids.map((id) => col.get(id)!))
  return {
    nodes: placed,
    edges: laid,
    width: padX * 2 + maxCol * C + N,
    height: padY * 2 + last * R + N + label,
    main,
    run,
  }
}
```

- [ ] **Step 5: Run it and watch it pass, then type-check**

Run: `npx vitest run tests/buildPlan-layout.test.ts && npm run typecheck`
Expected: PASS (7 tests), and tsc reports no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/buildPlan/layout.ts tests/buildPlan-layout.test.ts tsconfig.json
git commit -m "feat: n8n-style canvas layout for the build plan"
```

---

### Task 3: The page (icons, styles, render)

**Files:**
- Create: `lib/buildPlan/icons.ts`, `lib/buildPlan/styles.ts`, `lib/buildPlan/render.ts`, `lib/buildPlan/client.js` (a stub in this task; Task 4 fills it in)
- Test: `tests/buildPlan-render.test.ts`

**Interfaces:**
- Consumes: `plan`, `KIND_LABELS` and the types from Task 1; `layout` and `GEOM` from Task 2; `readTokens(theme)` from `lib/tokens.ts`.
- Produces:
  - `iconSvg(name: IconName): string`
  - `type Themes = { dark: Record<string, string>; light: Record<string, string> }`
  - `pageCss(themes: Themes): string`
  - `PAGE_PATH = '/build-plan.html'`
  - `esc(s: string): string`
  - `renderPlan(p?: Plan, themes?: Themes): string`
- Section ids, in order: `start, naming, data, triggers, tm-01 … tm-06, helpers, tests, build, handover`.
- Node buttons carry `data-node="<section id>:<node id>"` (e.g. `tm-01:n6`). The JSON `<script id="plan-nodes">` maps each such key to `{ label, type, settings }`.
- Panel element: `#node-panel` with `[data-p=type]`, `[data-p=label]` (`id="panel-label"`), `dl`, and `[data-p=close]`.
- Test rows: `.tests input[type=checkbox][value=<row id>]`, `#tests-count`, `#tests-reset`.

- [ ] **Step 1: Write the failing test**

`tests/buildPlan-render.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { plan, type Plan } from '@/data/buildPlan'
import { iconSvg } from '@/lib/buildPlan/icons'
import { renderPlan } from '@/lib/buildPlan/render'
import { readTokens } from '@/lib/tokens'

const html = renderPlan()
const doc = new DOMParser().parseFromString(html, 'text/html')
const flows = [...plan.workflows, ...plan.helpers.list]
const SECTIONS = ['start', 'naming', 'data', 'triggers', 'tm-01', 'tm-02', 'tm-03', 'tm-04', 'tm-05', 'tm-06', 'helpers', 'tests', 'build', 'handover']

describe('renderPlan', () => {
  it('opens with the title, the promise, the facts and the diagram key', () => {
    expect(doc.title).toBe('Trusted Mover build plan')
    expect(doc.querySelector('h1')!.textContent).toBe(plan.heading)
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/build-plan.html')
    expect(doc.querySelectorAll('.meta dt')).toHaveLength(plan.meta.length)
    expect(doc.querySelectorAll('.legend li')).toHaveLength(8)
  })

  it('has every section in order, each linked from the section bar', () => {
    expect([...doc.querySelectorAll('main > section')].map((s) => s.id)).toEqual(SECTIONS)
    expect([...doc.querySelectorAll('nav.toc a')].map((a) => a.getAttribute('href'))).toEqual(SECTIONS.map((s) => `#${s}`))
  })

  it('ends with the fictional-client note', () => {
    expect(doc.querySelector('footer')!.textContent).toContain('A worked example. Trusted Mover is a fictional client.')
  })

  it("wears Kraft's tokens for both themes, straight from the token file", () => {
    for (const theme of ['dark', 'light'] as const) {
      const t = readTokens(theme)
      expect(html).toContain(`--accent:${t.accent}`)
      expect(html).toContain(`--bg:${t.bg}`)
    }
  })

  it('draws every node as a button that has settings to show', () => {
    const buttons = [...doc.querySelectorAll<HTMLButtonElement>('button.node')]
    expect(buttons).toHaveLength(flows.reduce((a, w) => a + w.nodes.length, 0))
    const data = JSON.parse(doc.getElementById('plan-nodes')!.textContent!)
    for (const b of buttons) expect(data[b.dataset.node!], b.dataset.node).toMatchObject({ label: expect.any(String), type: expect.any(String) })
    expect(data['tm-01:n6'].settings).toContainEqual(['Model', 'Claude Haiku 4.5'])
  })

  it('gives every diagram a caption, a scrolling frame and a step list for screen readers', () => {
    const figures = [...doc.querySelectorAll('figure.canvas')]
    expect(figures).toHaveLength(9)
    figures.forEach((f, i) => {
      expect(f.querySelector('figcaption')!.textContent).toContain(flows[i].code)
      expect(f.querySelector('.canvas-scroll')!.getAttribute('tabindex')).toBe('0')
      expect(f.querySelectorAll('ol.steps li')).toHaveLength(flows[i].nodes.length)
    })
  })

  it('lists the twenty test rows with a labelled tick box each', () => {
    const boxes = [...doc.querySelectorAll<HTMLInputElement>('.tests input[type=checkbox]')]
    expect(boxes.map((b) => b.value)).toEqual(plan.tests.rows.map((r) => r.id))
    expect(boxes[0].getAttribute('aria-label')).toBe('Passed: t01 New quote')
    expect(doc.getElementById('tests-count')!.textContent).toBe('0 of 20 passed')
  })

  it('escapes everything from the data, and its JSON cannot close its script tag', () => {
    const evil: Plan = {
      ...plan,
      heading: '<img src=x onerror=alert(1)>',
      workflows: [{ ...plan.workflows[0], nodes: plan.workflows[0].nodes.map((n) => (n.id === 'n1' ? { ...n, label: '</script><script>alert(1)</script>' } : n)) }, ...plan.workflows.slice(1)],
    }
    const out = renderPlan(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect(JSON.parse(d.getElementById('plan-nodes')!.textContent!)['tm-01:n1'].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the plan names', () => {
    for (const w of flows) for (const n of w.nodes) expect(iconSvg(n.icon), n.icon).toMatch(/^<svg /)
  })

  it('stays one small, self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/buildPlan-render.test.ts`
Expected: FAIL, "Failed to resolve import "@/lib/buildPlan/icons"".

- [ ] **Step 3: Write the icons**

`lib/buildPlan/icons.ts`:

```ts
import { createElement, type ComponentType } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as Phosphor from '@phosphor-icons/react/ssr'
import type { IconName } from '../../data/buildPlan.ts'

const ICONS = Phosphor as unknown as Record<string, ComponentType<{ size?: number }>>

/** A Phosphor icon as inline SVG, rendered when the page is built, so the page itself needs no icon library. */
export function iconSvg(name: IconName): string {
  const Icon = ICONS[`${name}Icon`]
  if (!Icon) throw new Error(`No Phosphor icon named ${name}Icon`)
  return renderToStaticMarkup(createElement(Icon, { size: 22 }))
}
```

- [ ] **Step 4: Write the styles**

`lib/buildPlan/styles.ts`:

```ts
/** Kraft's tokens for one theme, as read by lib/tokens.ts. */
export type Themes = { dark: Record<string, string>; light: Record<string, string> }

const KEYS = ['bg', 'frame', 's0', 's1', 's2', 's3', 'chip', 'hover', 'b1', 'b2', 'ink', 'ink2', 'ink3', 'ink4', 'accent', 'onAccent', 'wash', 'washB', 'glow'] as const
const vars = (t: Record<string, string>) => KEYS.map((k) => `--${k}:${t[k]}`).join(';')

/**
 * The build plan's CSS (spec §4). Dark first, like the site. Inside the
 * portfolio's dialog, client.js copies the site's data-theme, so the
 * [data-theme] blocks win. Opened on its own, the device theme decides.
 */
export function pageCss({ dark, light }: Themes): string {
  return `
:root{${vars(dark)};color-scheme:dark;--sans:"Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme: light){:root:not([data-theme=dark]){${vars(light)};color-scheme:light}}
:root[data-theme=light]{${vars(light)};color-scheme:light}
:root[data-theme=dark]{${vars(dark)};color-scheme:dark}
*{box-sizing:border-box}
html{font-size:100%;scroll-behavior:smooth;scroll-padding-top:64px}
:root[data-a11y-text=lg]{font-size:112.5%}
:root[data-a11y-text=xl]{font-size:125%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:.9375rem;line-height:1.6;-webkit-font-smoothing:antialiased;text-wrap:pretty}
a{color:var(--accent)}
:root[data-a11y-links=true] a{text-decoration:underline}
h1,h2,h3{margin:0;text-wrap:balance}
p{margin:0}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.toc{position:sticky;top:0;z-index:20;display:flex;gap:4px;overflow-x:auto;padding:10px 16px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--b1);scrollbar-width:none}
.toc a{flex:none;padding:6px 11px;border-radius:999px;font-size:.8125rem;color:var(--ink3);text-decoration:none;white-space:nowrap}
.toc a:hover{color:var(--ink)}
.toc a[aria-current=true]{background:var(--wash);color:var(--accent)}
.page{max-width:1100px;margin:0 auto;padding:32px 16px 80px;display:flex;flex-direction:column;gap:72px}
.kicker{font-family:var(--mono);font-size:.6875rem;letter-spacing:.16em;color:var(--accent);text-transform:uppercase}
.hero{display:flex;flex-direction:column;gap:18px;padding-top:24px}
.hero h1{font-size:clamp(1.9rem,4.6vw,3rem);line-height:1.08;letter-spacing:-.035em;max-width:22ch}
.lede{font-size:1.0625rem;color:var(--ink2);max-width:62ch}
.meta{display:flex;flex-wrap:wrap;gap:10px 28px;margin:0;padding:16px 0;border-block:1px solid var(--b1)}
.meta div{display:flex;flex-direction:column;gap:2px}
.meta dt,.card h3,.rail h3,.sub{font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.card h3,.rail h3,.sub{color:var(--accent)}
.meta dd{margin:0;font-size:.875rem}
.legend{display:flex;flex-wrap:wrap;gap:8px 18px;margin:0;padding:0;list-style:none;font-size:.8125rem;color:var(--ink3)}
.legend li{display:flex;align-items:center;gap:8px}
section{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:20px 40px;scroll-margin-top:64px}
@media (max-width:820px){section{grid-template-columns:minmax(0,1fr)}}
.shead{grid-column:1/-1;display:flex;flex-direction:column;gap:6px}
.shead h2{font-size:clamp(1.35rem,2.6vw,1.75rem);letter-spacing:-.02em}
.shead p{color:var(--ink3)}
.rail{display:flex;flex-direction:column;gap:16px;font-size:.875rem;color:var(--ink2)}
.rail div{display:flex;flex-direction:column;gap:6px}
.main{min-width:0;display:flex;flex-direction:column;gap:18px}
section>.canvas{grid-column:1/-1}
ul{margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px}
.card{background:var(--s1);border:1px solid var(--b1);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px;min-width:0}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:12px}
.ote{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@media (max-width:700px){.ote{grid-template-columns:minmax(0,1fr)}}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:22px}
.rule{display:flex;flex-direction:column;gap:8px;min-width:0}
.rule h3{font-size:.9375rem}
.rule p{font-size:.875rem;color:var(--ink2)}
.code{margin:0;padding:14px 16px;border-radius:12px;background:var(--s0);border:1px solid var(--b1);font-family:var(--mono);font-size:.8125rem;line-height:1.7;color:var(--ink2);white-space:pre;overflow-x:auto}
.code b{color:var(--accent);font-weight:500}
code{font-family:var(--mono);font-size:.85em;background:var(--chip);padding:1px 6px;border-radius:6px}
.fields{display:flex;flex-wrap:wrap;gap:6px}
.note{font-size:.8125rem;color:var(--ink3)}
.stages{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.stages li{padding:6px 10px;border-radius:9px;border:1px solid var(--b2);background:var(--s2);font-size:.8125rem}
.stages li.exit{border-style:dashed;color:var(--ink3)}
.table-wrap{overflow-x:auto;border:1px solid var(--b1);border-radius:14px;background:var(--s1)}
table{width:100%;border-collapse:collapse;font-size:.875rem}
th{padding:10px 14px;border-bottom:1px solid var(--b1);font-family:var(--mono);font-size:.625rem;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3);text-align:left}
td{padding:10px 14px;border-bottom:1px solid var(--b1);vertical-align:top}
tr:last-child td{border-bottom:0}
.tests{min-width:760px}
.tests tr.done td{color:var(--ink3)}
.tests input{width:18px;height:18px;accent-color:var(--accent);cursor:pointer}
.tests-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:.75rem;color:var(--ink3)}
.btn{font:inherit;font-size:.8125rem;font-weight:600;padding:8px 12px;border-radius:10px;border:1px solid var(--b2);background:var(--s1);color:var(--ink);cursor:pointer}
.phases{display:grid;gap:12px;margin:0;padding:0;list-style:none}
.phase-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.phase-head h3{font-family:var(--sans);font-size:1rem;letter-spacing:-.01em;text-transform:none;color:var(--ink)}
.hours{font-family:var(--mono);font-size:.75rem;color:var(--accent)}
.total{font-family:var(--mono);font-size:.8125rem;color:var(--ink2)}
.helper{display:flex;flex-direction:column;gap:10px}
.helper h3{font-size:1rem}
.helper p{color:var(--ink2);font-size:.875rem}
.canvas{margin:0;display:flex;flex-direction:column;gap:10px;min-width:0}
.canvas figcaption{display:flex;justify-content:space-between;gap:12px;font-family:var(--mono);font-size:.6875rem;letter-spacing:.12em;text-transform:uppercase;color:var(--ink3)}
.swipe{display:none}
.canvas[data-overflow] .swipe{display:inline}
.canvas-scroll{overflow-x:auto;border:1px solid var(--b1);border-radius:16px;background-color:var(--s0);background-image:radial-gradient(var(--b2) 1px,transparent 1px);background-size:20px 20px;overscroll-behavior-x:contain}
.stage{position:relative}
.edges{position:absolute;inset:0}
.edge{fill:none;stroke:var(--b2);stroke-width:1.6}
.edge-label{position:absolute;transform:translate(-50%,-50%);padding:1px 6px;border-radius:6px;border:1px solid var(--b1);background:var(--s0);font-family:var(--mono);font-size:.625rem;color:var(--ink2);white-space:nowrap}
.run-dot{position:absolute;left:0;top:0;width:10px;height:10px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px var(--wash),0 0 14px 2px var(--glow);offset-anchor:50% 50%;offset-rotate:0deg;opacity:0;pointer-events:none}
.canvas.playing .run-dot{opacity:1;animation:run var(--run-s,8s) linear infinite}
@keyframes run{from{offset-distance:0%}to{offset-distance:100%}}
.node{position:absolute;width:56px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:0;border:0;background:none;color:var(--ink);font:inherit;text-align:center;cursor:pointer}
.node-card{position:relative;display:grid;place-items:center;width:56px;height:56px;border-radius:14px;border:1.5px solid var(--b2);background:var(--s2);color:var(--ink2);transition:border-color .2s,transform .2s}
.node-card::before,.node-card::after{content:"";position:absolute;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;border:1.5px solid var(--b2);background:var(--s0)}
.node-card::before{left:-5px}
.node-card::after{right:-5px}
.node[data-in="0"] .node-card::before,.node[data-out="0"] .node-card::after{display:none}
.node:hover .node-card{border-color:var(--accent);transform:translateY(-1px)}
.node-label{width:136px;font-size:.75rem;font-weight:600;line-height:1.25}
.node-sub{width:136px;margin-top:-3px;font-family:var(--mono);font-size:.625rem;color:var(--ink3)}
.k-trigger .node-card{border-radius:28px 14px 14px 28px}
.k-ai .node-card{border-color:var(--accent);background:var(--wash);color:var(--accent)}
.k-branch .node-card{color:var(--ink)}
.k-wait .node-card{border-style:dashed}
.k-approve .node-card{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.k-helper .node-card{box-shadow:4px 4px 0 -1.5px var(--s0),4px 4px 0 0 var(--b2)}
.k-end .node-card{background:transparent;color:var(--ink3)}
.legend .node-card{width:18px;height:18px;border-radius:6px}
.legend .node-card::before,.legend .node-card::after{display:none}
.legend .k-trigger .node-card{border-radius:9px 6px 6px 9px}
.legend .k-helper .node-card{box-shadow:2px 2px 0 -1px var(--bg),2px 2px 0 0 var(--b2)}
.steps{margin:0}
.panel{position:fixed;inset:auto;margin:0;width:min(320px,calc(100vw - 24px));padding:16px;border-radius:14px;border:1px solid var(--b2);background:var(--s1);color:var(--ink);box-shadow:0 24px 60px -30px var(--glow)}
.panel h3{font-size:1rem;padding-right:36px}
.ptype{display:block;margin-bottom:4px;font-family:var(--mono);font-size:.6875rem;letter-spacing:.08em;color:var(--accent)}
.panel dl{display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:12px 0 0;font-size:.8125rem}
.panel dt{color:var(--ink3)}
.panel dd{margin:0}
.panel-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:9px;border:1px solid var(--b1);background:var(--s2);color:var(--ink);font-size:1.1rem;line-height:1;cursor:pointer}
.foot{max-width:1100px;margin:0 auto;padding:24px 16px 48px;border-top:1px solid var(--b1);display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:.8125rem;color:var(--ink3)}
@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto}.run-dot{display:none}.node-card{transition:none}}
:root[data-a11y-motion=true]{scroll-behavior:auto}
:root[data-a11y-motion=true] .run-dot{display:none}
@media print{
:root,:root[data-theme]{${vars(light)};color-scheme:light}
body{background:var(--frame)}
.toc,.run-dot,.panel,.btn,.swipe{display:none!important}
.page{gap:40px;padding-top:0}
section,.canvas,.card,tr{break-inside:avoid}
.canvas-scroll{overflow:visible;border:0;background:none}
.stage{zoom:.62}
.steps.sr-only{position:static;width:auto;height:auto;margin:6px 0 0;overflow:visible;clip:auto;white-space:normal;font-size:.75rem;color:var(--ink2)}
a[href^="http"]::after{content:" (" attr(href) ")";font-size:.75em;color:var(--ink3)}
}
`
}
```

- [ ] **Step 5: Add a stub client script**

`lib/buildPlan/client.js` (Task 4 replaces it):

```js
// The build plan's behaviour (public/build-plan.html), inlined by lib/buildPlan/render.ts.
```

- [ ] **Step 6: Write the renderer**

`lib/buildPlan/render.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { KIND_LABELS, plan as PLAN, type NodeKind, type Plan, type Rail, type Workflow } from '../../data/buildPlan.ts'
import { readTokens } from '../tokens.ts'
import { iconSvg } from './icons.ts'
import { layout } from './layout.ts'
import { pageCss, type Themes } from './styles.ts'

/** Where the page is served (public/build-plan.html). */
export const PAGE_PATH = '/build-plan.html'

type NodeIndex = Record<string, { label: string; type: string; settings: [string, string][] }>

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
const slug = (code: string) => code.toLowerCase()
const list = (items: string[]) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
const card = (title: string, body: string) => `<div class="card"><h3>${esc(title)}</h3>${body}</div>`
const rail = (items: Rail[]) =>
  items.map((r) => `<div><h3>${esc(r.heading)}</h3>${r.body ? `<p>${esc(r.body)}</p>` : ''}${r.list ? list(r.list) : ''}</div>`).join('')

function section(id: string, kicker: string, title: string, blurb: string, side: Rail[], main: string, wide = '') {
  return `<section id="${id}" aria-labelledby="${id}-h"><header class="shead"><span class="kicker">${esc(kicker)}</span><h2 id="${id}-h">${esc(title)}</h2><p>${esc(blurb)}</p></header><aside class="rail">${rail(side)}</aside><div class="main">${main}</div>${wide}</section>`
}

function hero(p: Plan) {
  const legend = (Object.keys(KIND_LABELS) as NodeKind[])
    .map((k) => `<li><span class="k-${k}"><span class="node-card"></span></span>${esc(KIND_LABELS[k])}</li>`)
    .join('')
  return `<header class="hero"><span class="kicker">${esc(p.kicker)}</span><h1>${esc(p.heading)}</h1><p class="lede">${esc(p.lede)}</p><dl class="meta">${p.meta
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join('')}</dl><ul class="legend" aria-label="Diagram key">${legend}</ul></header>`
}

/** One workflow as an n8n-style canvas: connectors in SVG, nodes as buttons, a run dot, and the steps as a list. */
function canvas(w: Workflow, index: NodeIndex) {
  const l = layout(w)
  const key = (id: string) => `${slug(w.code)}:${id}`
  const byId = new Map(w.nodes.map((n) => [n.id, n]))
  for (const n of w.nodes) index[key(n.id)] = { label: n.label, type: n.type, settings: n.settings }
  const entered = new Set(w.edges.map((e) => e.to))
  const left = new Set(w.edges.map((e) => e.from))
  const paths = l.edges.map((e) => `<path class="edge" d="${e.d}"/>`).join('')
  const labels = l.edges
    .filter((e) => e.label)
    .map((e) => `<span class="edge-label" style="left:${e.mid[0]}px;top:${e.mid[1]}px">${esc(e.label!)}</span>`)
    .join('')
  const buttons = w.nodes
    .map((n) => {
      const at = l.nodes[n.id]
      return `<button type="button" class="node k-${n.kind}" style="left:${at.x}px;top:${at.y}px" data-node="${key(n.id)}" data-in="${entered.has(n.id) ? 1 : 0}" data-out="${left.has(n.id) ? 1 : 0}" aria-haspopup="dialog"><span class="node-card" aria-hidden="true">${iconSvg(n.icon)}</span><span class="node-label">${esc(n.label)}</span><span class="node-sub">${esc(n.sub)}</span></button>`
    })
    .join('')
  const steps = w.nodes
    .map((n) => {
      const next = w.edges
        .filter((e) => e.from === n.id)
        .map((e) => `${byId.get(e.to)!.label}${e.label ? ` if ${e.label}` : ''}`)
      return `<li>${esc(n.label)} (${esc(KIND_LABELS[n.kind])}, ${esc(n.sub)})${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<figure class="canvas" data-run style="--run-s:${(l.main.length * 1.1).toFixed(1)}s"><figcaption><span>${esc(w.code)} · ${esc(w.title)}</span><span class="swipe" aria-hidden="true">Scroll sideways →</span></figcaption><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(w.code)} diagram, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}<span class="run-dot" aria-hidden="true" style="offset-path:path('${l.run}')"></span>${buttons}</div></div><ol class="steps sr-only">${steps}</ol></figure>`
}

function workflowSection(w: Workflow, index: NodeIndex) {
  const decisions = w.nodes.filter((n) => n.kind === 'branch').length
  const main = `<div class="ote">${card('Outcome', `<p>${esc(w.outcome)}</p>`)}${card('Trigger', `<p>${esc(w.trigger)}</p>`)}${card('Exits', list(w.exits))}</div>`
  return section(slug(w.code), w.code, w.title, `${w.nodes.length} nodes, ${decisions} ${decisions === 1 ? 'decision' : 'decisions'}.`, [{ heading: 'Watch for', list: w.watch }], main, canvas(w, index))
}

const wfLink = (code: string) => `<a href="#${code.startsWith('TM-H') ? 'helpers' : slug(code)}">${esc(code)}</a>`

function sections(p: Plan, index: NodeIndex) {
  const s = p.start
  const d = p.data
  const hours = p.build.phases.reduce((a, ph) => a + ph.hours, 0)
  return [
    { id: 'start', nav: 'Start', html: section('start', '01', s.title, s.blurb, s.rail, `<div class="ote">${card('Outcome', `<p>${esc(s.outcome)}</p>`)}${card('Entry points', `<p>${esc(s.trigger)}</p>`)}${card('Every way a job ends', list(s.exits))}</div>${card('Out of scope', list(s.outOfScope))}`) },
    { id: 'naming', nav: 'Naming', html: section('naming', '02', p.naming.title, p.naming.blurb, p.naming.rail, `<div class="rules">${p.naming.rules.map((r) => `<div class="rule"><h3>${esc(r.name)}</h3><pre class="code"><b>${esc(r.pattern)}</b>\n${r.examples.map(esc).join('\n')}</pre><p>${esc(r.rule)}</p></div>`).join('')}</div>`) },
    { id: 'data', nav: 'Data', html: section('data', '03', d.title, d.blurb, d.rail, `<div class="cards">${d.tables.map((t) => card(t.name, `<p class="fields">${t.fields.map((f) => `<code>${esc(f)}</code>`).join(' ')}</p><p class="note">${esc(t.note)}</p>`)).join('')}</div><h3 class="sub">Job stages</h3><ol class="stages">${d.stages.map((st) => `<li>${esc(st)}</li>`).join('')}${d.exitStages.map((st) => `<li class="exit">${esc(st)}</li>`).join('')}</ol><div class="table-wrap"><table><thead><tr><th scope="col">Sheets tab</th><th scope="col">What it holds</th></tr></thead><tbody>${d.sheets.map(([t, what]) => `<tr><td>${esc(t)}</td><td>${esc(what)}</td></tr>`).join('')}</tbody></table></div>`) },
    { id: 'triggers', nav: 'Triggers', html: section('triggers', '04', p.triggers.title, p.triggers.blurb, p.triggers.rail, `<div class="table-wrap"><table><thead><tr><th scope="col">Source</th><th scope="col">Event</th><th scope="col">Workflow</th></tr></thead><tbody>${p.triggers.rows.map(([src, ev, wf]) => `<tr><td>${esc(src)}</td><td><code>${esc(ev)}</code></td><td>${wfLink(wf)}</td></tr>`).join('')}</tbody></table></div>`) },
    ...p.workflows.map((w) => ({ id: slug(w.code), nav: w.code, html: workflowSection(w, index) })),
    { id: 'helpers', nav: 'Helpers', html: section('helpers', '05', p.helpers.title, p.helpers.blurb, p.helpers.rail, p.helpers.list.map((h) => `<div class="helper"><h3>${esc(h.code)} · ${esc(h.title)}</h3><p>${esc(h.outcome)}</p>${canvas(h, index)}</div>`).join('')) },
    { id: 'tests', nav: 'Tests', html: section('tests', '06', p.tests.title, p.tests.blurb, p.tests.rail, `<div class="tests-bar"><span id="tests-count" aria-live="polite">0 of ${p.tests.rows.length} passed</span><button type="button" class="btn" id="tests-reset">Reset</button></div><div class="table-wrap"><table class="tests"><thead><tr><th scope="col">Passed</th><th scope="col">ID</th><th scope="col">Workflow</th><th scope="col">Branch</th><th scope="col">Test</th><th scope="col">Expected</th></tr></thead><tbody>${p.tests.rows.map((r) => `<tr><td><input type="checkbox" id="t-${esc(r.id)}" value="${esc(r.id)}" aria-label="Passed: ${esc(r.id)} ${esc(r.branch)}"></td><td><code>${esc(r.id)}</code></td><td>${wfLink(r.workflow)}</td><td>${esc(r.branch)}</td><td>${esc(r.input)}</td><td>${esc(r.expected)}</td></tr>`).join('')}</tbody></table></div>`) },
    { id: 'build', nav: 'Build order', html: section('build', '07', p.build.title, p.build.blurb, p.build.rail, `<ol class="phases">${p.build.phases.map((ph) => `<li class="card"><div class="phase-head"><h3>${esc(ph.name)}</h3><span class="hours">${ph.hours} h</span></div>${list(ph.tasks)}</li>`).join('')}</ol><p class="total">Total: about ${hours} hours</p>`) },
    { id: 'handover', nav: 'Handover', html: section('handover', '08', p.handover.title, p.handover.blurb, p.handover.rail, `<div class="cards">${card('What it does', list(p.handover.does))}${card('What breaks it', list(p.handover.breaks))}${card('Who to call', `<p>${esc(p.handover.call)}</p>`)}${card('Where the logs are', `<p>${esc(p.handover.logs)}</p>`)}</div>`) },
  ]
}

/** The whole build plan page (spec §3–4): one self-contained HTML file. */
export function renderPlan(p: Plan = PLAN, themes: Themes = { dark: readTokens('dark'), light: readTokens('light') }): string {
  const index: NodeIndex = {}
  const parts = sections(p, index)
  const client = readFileSync(join(process.cwd(), 'lib/buildPlan/client.js'), 'utf8')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${PAGE_PATH}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&amp;family=Geist+Mono:wght@400;500&amp;display=swap">
<style>${pageCss(themes)}</style>
</head>
<body>
<nav class="toc" aria-label="Sections">${parts.map((s) => `<a href="#${s.id}">${esc(s.nav)}</a>`).join('')}</nav>
<main class="page">
${hero(p)}
${parts.map((s) => s.html).join('\n')}
</main>
<footer class="foot"><span>${esc(p.footer.note)}</span><span>${esc(p.footer.by)}</span></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close settings">×</button></div>
<script type="application/json" id="plan-nodes">${safeJson(index)}</script>
<script>${client}</script>
</body>
</html>
`
}
```

- [ ] **Step 7: Run it and watch it pass, then lint and type-check**

Run: `npx vitest run tests/buildPlan-render.test.ts tests/no-raw-colors.test.ts && npm run lint && npm run typecheck`
Expected: PASS (10 + 1 tests), and lint and tsc are clean.

- [ ] **Step 8: Commit**

```bash
git add lib/buildPlan tests/buildPlan-render.test.ts
git commit -m "feat: render the build plan as one self-contained page"
```

---

### Task 4: Interactions (client.js) and the page's generator

The page's JS needs a real browser, so this task also adds the generator and its freshness test. Playwright can then load `/build-plan.html`.

**Files:**
- Modify: `lib/buildPlan/client.js` (replace the stub)
- Create: `scripts/make-plan.ts`, `public/build-plan.html` (generated), `e2e/build-plan.spec.ts`
- Modify: `package.json` (add `"plan": "node scripts/make-plan.ts"`), `tests/buildPlan-render.test.ts` (add the freshness test)

**Interfaces:**
- Consumes: the DOM contract from Task 3 (`.toc a`, `main > section[id]`, `.node[data-node]`, `#plan-nodes`, `#node-panel` and its `[data-p]` parts, `.canvas[data-run]`, `.canvas-scroll`, `.tests input`, `#tests-count`, `#tests-reset`).
- Produces:
  - `npm run plan`, which writes `public/build-plan.html`;
  - the localStorage key `trusted-mover-plan-tests`;
  - `<html data-embedded>` whenever the page is inside a same-origin parent.

- [ ] **Step 1: Write the failing tests**

Append to `tests/buildPlan-render.test.ts`:

```ts
import { readFileSync } from 'node:fs'

describe('public/build-plan.html', () => {
  it('is up to date with its data (run npm run plan after any change)', () => {
    expect(readFileSync('public/build-plan.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderPlan())
  })
})
```

(Move the new `import` line up with the others at the top of the file.)

`e2e/build-plan.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const PAGE = '/build-plan.html'

test('reads top to bottom: the promise, the section bar, every section and diagram', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('Trusted Mover build plan')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every quote, booking and move, planned before a single node is placed.')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(14)
  await expect(page.locator('main > section')).toHaveCount(14)
  await expect(page.locator('figure.canvas')).toHaveCount(9)
})

test('the section bar marks the section being read', async ({ page }) => {
  await page.goto(`${PAGE}#tests`)
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Tests' })).toHaveAttribute('aria-current', 'true')
})

test('a step shows its settings; Escape closes them and focus goes back to the step', async ({ page }) => {
  await page.goto(PAGE)
  const node = page.locator('[data-node="tm-01:n6"]')
  await node.scrollIntoViewIfNeeded()
  await node.click()
  const panel = page.getByRole('dialog', { name: 'Extract move details' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('Anthropic Chat Model + Structured Output Parser')
  await expect(panel).toContainText('Claude Haiku 4.5')
  await expect(panel.getByRole('button', { name: 'Close settings' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(node).toBeFocused()
})

test('a second step moves the panel to it, and focus lands on its Close', async ({ page }) => {
  await page.goto(PAGE)
  await page.locator('[data-node="tm-01:n6"]').click()
  const second = page.locator('[data-node="tm-01:n11"]')
  await second.click()
  const panel = page.getByRole('dialog', { name: 'Create job' })
  await expect(panel).toBeVisible()
  await expect(panel.getByRole('button', { name: 'Close settings' })).toBeFocused()
})

test('the settings panel stays on screen at phone width, even for the last step', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  const last = page.locator('[data-node="tm-01:n14"]')
  await last.scrollIntoViewIfNeeded()
  await last.click()
  const box = (await page.locator('#node-panel').boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  expect(box.y + box.height).toBeLessThanOrEqual(844)
})

test('a ticked test row survives a reload, and Reset clears it', async ({ page }) => {
  await page.goto(`${PAGE}#tests`)
  const box = page.getByRole('checkbox', { name: 'Passed: t01 New quote' })
  await box.check()
  await expect(page.locator('#tests-count')).toHaveText('1 of 20 passed')
  await page.reload()
  await expect(box).toBeChecked()
  await page.getByRole('button', { name: 'Reset' }).click()
  await expect(box).not.toBeChecked()
  await expect(page.locator('#tests-count')).toHaveText('0 of 20 passed')
})

test('ticking still works when storage is blocked, with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked') } })
  })
  await page.goto(`${PAGE}#tests`)
  await page.getByRole('checkbox', { name: 'Passed: t02 Duplicate' }).check()
  await expect(page.locator('#tests-count')).toHaveText('1 of 20 passed')
  expect(errors).toEqual([])
})

test('on its own it follows the device theme', async ({ browser }) => {
  for (const [scheme, bg] of [['light', 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)']] as const) {
    const ctx = await browser.newContext({ colorScheme: scheme })
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body')).toHaveCSS('background-color', bg)
    await ctx.close()
  }
})

test('the run dot plays only while motion is allowed', async ({ browser }) => {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#tm-01`)
  await expect(page.locator('#tm-01 .canvas')).toHaveClass(/playing/)
  await ctx.close()
  const calm = await browser.newContext({ reducedMotion: 'reduce' })
  const still = await calm.newPage()
  await still.goto(`${PAGE}#tm-01`)
  await expect(still.locator('#tm-01 .run-dot')).toBeHidden()
  await calm.close()
})

test('at phone width the page never scrolls sideways; wide diagrams scroll in their own frame', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  const frame = page.locator('#tm-01 .canvas-scroll')
  expect(await frame.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
  await expect(page.locator('#tm-01 .canvas')).toHaveAttribute('data-overflow', '')
})
```

- [ ] **Step 2: Run the freshness test and watch it fail**

Run: `npx vitest run tests/buildPlan-render.test.ts`
Expected: FAIL, "ENOENT: no such file or directory, open 'public/build-plan.html'".

- [ ] **Step 3: Write the client script**

`lib/buildPlan/client.js`:

```js
// The build plan's behaviour (public/build-plan.html), inlined by
// lib/buildPlan/render.ts. Plain browser JS, no libraries (spec §4.3).
;(() => {
  const root = document.documentElement

  // Inside the portfolio's dialog, wear the site's theme and access settings.
  // The site treats a missing data-theme as dark.
  const MIRROR = ['data-a11y-motion', 'data-a11y-contrast', 'data-a11y-text', 'data-a11y-links']
  let host = null
  try {
    if (window.parent !== window) host = window.parent.document.documentElement
  } catch {
    host = null
  }
  if (host) {
    const mirror = () => {
      root.dataset.theme = host.dataset.theme === 'light' ? 'light' : 'dark'
      for (const name of MIRROR) {
        const v = host.getAttribute(name)
        if (v === null) root.removeAttribute(name)
        else root.setAttribute(name, v)
      }
    }
    mirror()
    new MutationObserver(mirror).observe(host, { attributes: true, attributeFilter: ['data-theme', ...MIRROR] })
    root.dataset.embedded = ''
  }
  const reduced = () => root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches

  // The section bar marks the section being read.
  const links = [...document.querySelectorAll('.toc a')]
  const linkFor = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]))
  const spy = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const a = linkFor.get(e.target.id)
        if (!a) continue
        for (const l of links) l.removeAttribute('aria-current')
        a.setAttribute('aria-current', 'true')
        const bar = a.parentElement
        bar.scrollLeft = a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2
      }
    },
    { rootMargin: '-15% 0px -70% 0px' },
  )
  for (const id of linkFor.keys()) {
    const s = document.getElementById(id)
    if (s) spy.observe(s)
  }

  // A step shows its settings in a small panel, like n8n's side panel.
  const nodes = JSON.parse(document.getElementById('plan-nodes').textContent)
  const panel = document.getElementById('node-panel')
  const closeBtn = panel.querySelector('[data-p=close]')
  let opener = null
  panel.addEventListener('toggle', (e) => {
    if (e.newState !== 'closed' || !opener) return
    const back = opener
    opener = null
    back.focus({ preventScroll: true })
  })
  closeBtn.addEventListener('click', () => panel.hidePopover())
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.node[data-node]')
    if (!btn) return
    const n = nodes[btn.dataset.node]
    if (!n) return
    if (panel.matches(':popover-open')) {
      opener = null
      panel.hidePopover()
    }
    panel.querySelector('[data-p=type]').textContent = n.type
    panel.querySelector('[data-p=label]').textContent = n.label
    panel.querySelector('dl').replaceChildren(
      ...n.settings.flatMap(([k, v]) => {
        const dt = document.createElement('dt')
        dt.textContent = k
        const dd = document.createElement('dd')
        dd.textContent = v
        return [dt, dd]
      }),
    )
    panel.showPopover()
    const r = btn.getBoundingClientRect()
    const w = panel.offsetWidth
    const h = panel.offsetHeight
    const x = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), innerWidth - w - 12)
    const below = r.top + 70
    const y = below + h > innerHeight - 12 ? Math.max(12, r.top - h - 10) : below
    panel.style.left = `${Math.max(12, x)}px`
    panel.style.top = `${y}px`
    opener = btn
    closeBtn.focus()
  })

  // A dot runs each workflow's main path while it is on screen.
  const run = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('playing', e.isIntersecting && !reduced())
  })
  for (const c of document.querySelectorAll('.canvas[data-run]')) run.observe(c)

  // A diagram wider than its frame says so.
  const fit = () => {
    for (const s of document.querySelectorAll('.canvas-scroll')) s.closest('.canvas').toggleAttribute('data-overflow', s.scrollWidth > s.clientWidth + 1)
  }
  fit()
  addEventListener('resize', fit)

  // Test rows stay ticked in this browser; blocked storage keeps them for this visit.
  const KEY = 'trusted-mover-plan-tests'
  let ticked = {}
  try {
    ticked = JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    ticked = {}
  }
  const boxes = [...document.querySelectorAll('.tests input[type=checkbox]')]
  const count = document.getElementById('tests-count')
  const show = () => {
    let n = 0
    for (const b of boxes) {
      b.checked = !!ticked[b.value]
      b.closest('tr').classList.toggle('done', b.checked)
      if (b.checked) n++
    }
    count.textContent = `${n} of ${boxes.length} passed`
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(ticked))
    } catch {
      /* storage blocked: the ticks last for this visit */
    }
  }
  for (const b of boxes)
    b.addEventListener('change', () => {
      if (b.checked) ticked[b.value] = true
      else delete ticked[b.value]
      save()
      show()
    })
  document.getElementById('tests-reset').addEventListener('click', () => {
    ticked = {}
    save()
    show()
  })
  show()
})()
```

- [ ] **Step 4: Write the generator and run it**

`scripts/make-plan.ts`:

```ts
// Builds public/build-plan.html from data/buildPlan.ts (spec 2026-09-30).
// Run after changing the plan's data, layout, styles or script: npm run plan
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderPlan } from '../lib/buildPlan/render.ts'

const html = renderPlan()
writeFileSync(join(process.cwd(), 'public', 'build-plan.html'), html)
console.log(`public/build-plan.html: ${(html.length / 1024).toFixed(1)} KB`)
```

In `package.json` `"scripts"`, add after `"placeholders"` (with a comma after the previous line):

```json
    "plan": "node scripts/make-plan.ts"
```

Run: `npm run plan`
Expected: prints `public/build-plan.html: <size> KB`, with a size under 293 KB.

- [ ] **Step 5: Run the unit and e2e tests and watch them pass**

Run: `npx vitest run tests/buildPlan-render.test.ts && npx playwright test e2e/build-plan.spec.ts --workers=1`
Expected: vitest PASS (11 tests), Playwright 10 passed. The Playwright webServer builds the site first, which takes a few minutes.

- [ ] **Step 6: Look at it once**

Serve and screenshot the page at desktop (1440) and phone (390) width, in light and dark, using a throwaway `.cjs` Playwright script in the repo root, and delete the script afterwards. Check three things: labels don't collide, the connectors meet the ports, and the settings panel reads well. Fix anything off in `styles.ts` or `layout.ts` (keeping the tests green), then run `npm run plan` again.

- [ ] **Step 7: Commit**

```bash
git add lib/buildPlan/client.js scripts/make-plan.ts public/build-plan.html package.json tests/buildPlan-render.test.ts e2e/build-plan.spec.ts
git commit -m "feat: build plan interactions, generator and generated page"
```

---

### Task 5: Window and ViewDialog support a page window

**Files:**
- Modify: `components/ui/ViewDialog.tsx` (right after `d.showModal()`)
- Modify: `components/projects/Window.tsx`
- Test: `tests/ViewDialog.test.tsx`

**Interfaces:**
- Produces:
  - `Window` props `{ open; onClose; title; children; href?: string; flush?: boolean }`. When `href` is set, the address field shows `href` and an **Open in new tab** link appears before Close. `flush` gives an unpadded, non-scrolling body for an iframe.
  - `ViewDialog` focuses `[data-autofocus]` on open, if there is one.
  - `Window`'s Close carries `data-autofocus`.
  - `projects.openNewTab = 'Open in new tab'`.

- [ ] **Step 1: Write the failing test**

Append inside `describe('ViewDialog', ...)` in `tests/ViewDialog.test.tsx`:

```tsx
  it('on open, focuses the element marked data-autofocus instead of the first one', () => {
    const view = (open: boolean) => (
      <ViewDialog open={open} onClose={onClose} label="Page">
        <a href="/x">First</a>
        <button type="button" data-autofocus>
          Close
        </button>
      </ViewDialog>
    )
    const { rerender } = render(view(false))
    rerender(view(true))
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/ViewDialog.test.tsx`
Expected: FAIL on the new test (focus stays on `document.body`).

- [ ] **Step 3: Implement**

In `components/ui/ViewDialog.tsx`, inside the effect, right after `d.showModal()`:

```tsx
      // The browser focuses the first focusable element; a view can name a better one.
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
```

In `data/projects.ts`, add under `close: 'Close',`:

```ts
  openNewTab: 'Open in new tab',
```

Replace `components/projects/Window.tsx`'s imports, `Props` and default export with:

```tsx
import type { ReactNode } from 'react'
import { ArrowSquareOutIcon, XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Chip } from '@/data/projects'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode; href?: string; flush?: boolean }

const CHROME_BUTTON =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover'

/**
 * Kraft's document window (Kraft Projects Board.dc.html:190-238): traffic
 * lights, the title (or the page's address) in an address field, Close, and
 * a scrolling body. A window that shows a page (`href`) also links it into a
 * new tab, and `flush` hands its whole body to that page. Close takes focus
 * when it opens.
 */
export default function Window({ open, onClose, title, children, href, flush = false }: Props) {
  return (
    <ViewDialog open={open} onClose={onClose} label={title} className="view--window">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
        <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
          <span className={`mx-2 min-w-0 flex-1 truncate rounded-[7px] border border-b1 bg-s1 px-3 py-1.5 text-ink2 ${href ? 'font-mono text-[11.5px]' : 'text-[12.5px]'}`}>
            {href ?? title}
          </span>
          {href && (
            <a href={href} target="_blank" rel="noopener" aria-label={projects.openNewTab} className={CHROME_BUTTON}>
              <ArrowSquareOutIcon size={17} aria-hidden />
            </a>
          )}
          <button type="button" onClick={onClose} aria-label={projects.close} data-autofocus className={CHROME_BUTTON}>
            <XIcon size={17} aria-hidden />
          </button>
        </div>
        {flush ? (
          <div className="relative min-h-0 flex-1 bg-bg">{children}</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-[30px] overflow-y-auto overscroll-contain p-[clamp(16px,2.2vw,30px)]">
            {children}
          </div>
        )}
      </div>
    </ViewDialog>
  )
}
```

(`WindowHero` and `WindowSection` below it stay unchanged.)

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run tests/ViewDialog.test.tsx tests/projects.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/ViewDialog.tsx components/projects/Window.tsx data/projects.ts tests/ViewDialog.test.tsx
git commit -m "feat: a window can show a page, with Open in new tab and Close focused"
```

---

### Task 6: The build plan card opens the page

**Files:**
- Create: `components/projects/PlanView.tsx`
- Modify: `components/projects/ProjectViews.tsx`, `data/projects.ts:16-17,77-82`, `data/projectDocs.ts` (delete `DOCS['build-plan']`, and drop 5 icon imports)
- Test: `tests/projects.test.tsx`, `e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `Window` with `href` and `flush` (Task 5); `public/build-plan.html` (Task 4).
- Produces:
  - `projects.cards.plan.page = '/build-plan.html'` and `projects.cards.plan.frameTitle = 'Trusted Mover build plan'`;
  - `DOC_VIEWS = ['support-desk', 'agentic-framework', 'end-to-end']`.

- [ ] **Step 1: Write the failing tests**

In `tests/projects.test.tsx`:

(a) In "keeps Kraft's roster…", delete the `DOCS['build-plan'].sections` expectation (3 lines).

(b) In "pre-renders every view, closed", change `'Name the outcome'` to `'Write the spec first'`.

(c) Add to `describe('Board', ...)`:

```tsx
  it('shows the build plan card as an n8n plan', () => {
    render(<Board />)
    const card = screen.getByRole('link', { name: /^The build plan/ })
    expect(within(card).getByText('N8N BUILD PLAN')).toBeInTheDocument()
    expect(['Webhook', 'Claude', 'Approve?', 'Stripe'].every((s) => within(card).queryByText(s))).toBe(true)
  })
```

(d) Add to `describe('ProjectViews', ...)`:

```tsx
  it('has no iframe while the build plan is closed, so /projects never fetches it up front', () => {
    render(<ProjectViews />)
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('shows the build plan page in its window, with a way out to a new tab and Close focused', () => {
    window.history.replaceState(null, '', '/projects#build-plan')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'The build plan' })
    expect(view).toHaveAttribute('open')
    const frame = within(view).getByTitle('Trusted Mover build plan')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/build-plan.html')
    const out = within(view).getByRole('link', { name: 'Open in new tab' })
    expect(out).toHaveAttribute('href', '/build-plan.html')
    expect(out).toHaveAttribute('target', '_blank')
    expect(within(view).getByRole('button', { name: 'Close' })).toHaveFocus()
  })
```

In `e2e/projects.spec.ts`:

(e) In "other pages never load the Projects write-ups up front", change `'Name the outcome'` to `'Write the spec first'`.

(f) Add:

```ts
test('the build plan window shows the plan and follows the site theme, dark by default', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/build-plan.html')
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  const theme = () => frame.locator('html').getAttribute('data-theme')
  await page.evaluate(() => delete document.documentElement.dataset.theme)
  await expect.poll(theme).toBe('dark')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'))
  await expect.poll(theme).toBe('light')
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'))
  await expect.poll(theme).toBe('dark')
})

test('/projects never fetches the plan page until its window opens', async ({ page }) => {
  const asked: string[] = []
  page.on('request', (r) => asked.push(new URL(r.url()).pathname))
  await page.goto('/projects')
  await hydrated(page)
  await page.waitForLoadState('networkidle')
  expect(asked).not.toContain('/build-plan.html')
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/projects.test.tsx`
Expected: FAIL on the three new tests: there's no "N8N BUILD PLAN" on the card and no iframe titled "Trusted Mover build plan". The edited "pre-renders every view" test already passes, because "Write the spec first" is in the Agentic Framework write-up.

- [ ] **Step 3: Implement**

`components/projects/PlanView.tsx`:

```tsx
import { projects } from '@/data/projects'
import Window from './Window'

/**
 * The build plan (spec 2026-09-30): the generated page public/build-plan.html
 * in the document window. The iframe is only there while the window is open,
 * so /projects never downloads the plan up front. It is same-origin and
 * unsandboxed because we write the page ourselves, which lets it copy the
 * site's theme.
 */
export default function PlanView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.plan
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
```

`components/projects/ProjectViews.tsx`: import `PlanView from './PlanView'`, and render `<PlanView open={view === 'build-plan'} onClose={close} />` right after the `DOC_VIEWS.map(...)` block.

`data/projects.ts`:
- `export const DOC_VIEWS = ['support-desk', 'agentic-framework', 'end-to-end'] as const`
- `cards.plan` becomes:

```ts
    plan: {
      title: 'The build plan', icon: BlueprintIcon, cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'N8N BUILD PLAN', heading: 'The full automation blueprint.',
      steps: ['Webhook', 'Claude', 'Approve?', 'Stripe'],
      page: '/build-plan.html', frameTitle: 'Trusted Mover build plan',
    },
```

`data/projectDocs.ts`:
- Delete the whole `'build-plan': { … },` entry from `DOCS`.
- Remove `GitBranchIcon`, `HandshakeIcon`, `NoteIcon`, `SignOutIcon` and `TextboxIcon` from the import list. Nothing else uses them.

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run tests/projects.test.tsx tests/commands.test.ts && npm run lint && npm run typecheck && npx playwright test e2e/projects.spec.ts e2e/palette.spec.ts --workers=1 --project=desktop && npx playwright test e2e/phone.spec.ts --workers=1`
Expected: every test passes. The existing "a board card opens its write-up…" e2e test still passes, with Close focused thanks to `data-autofocus`.

- [ ] **Step 5: Commit**

```bash
git add components/projects/PlanView.tsx components/projects/ProjectViews.tsx data/projects.ts data/projectDocs.ts tests/projects.test.tsx e2e/projects.spec.ts
git commit -m "feat: The build plan opens the n8n plan page in its window"
```

---

### Task 7: Remove GoHighLevel from the site

**Files:**
- Create: `tests/no-ghl.test.ts`
- Modify: `data/projects.ts` (PROJECT_VIEWS, DOC_VIEWS, REEL, WRITEUPS, reel body, and the icon import)
- Modify: `data/projectDocs.ts` (delete support-desk, delete Workflow Creator, reword End-to-End and the roster line, and the icon import)
- Test: `tests/projects.test.tsx`, `tests/commands.test.ts`, `e2e/projects.spec.ts`

**Interfaces:**
- Produces:
  - `PROJECT_VIEWS = ['reel', 'build-plan', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents']`
  - `DOC_VIEWS = ['agentic-framework', 'end-to-end']`

- [ ] **Step 1: Write the failing tests**

`tests/no-ghl.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { expect, it } from 'vitest'

const ROOTS = ['app', 'components', 'data', 'hooks', 'lib']
const FILES = ['public/build-plan.html']
const GHL = /gohighlevel|highlevel|\bghl\b/i

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?|css|html)$/.test(name) ? [p.split(sep).join('/')] : []
  })
}

it('never mentions GoHighLevel: Justine builds on n8n', () => {
  const files = [...ROOTS.flatMap(walk), ...FILES]
  const offenders = files.flatMap((f) =>
    readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .flatMap((line, i) => (GHL.test(line) ? [`${f}:${i + 1}`] : [])),
  )
  expect(offenders).toEqual([])
})
```

`tests/projects.test.tsx`:
- In "keeps Kraft's roster…", the reel labels become:

```ts
    expect(projects.reel.shots.map((s) => s.label)).toEqual([
      'TM-01 · Quote request', 'Workflows list', 'TM-02 · Survey → Estimate', 'Workflow settings', 'Executions',
    ])
    expect(projects.reel.shots.every((s) => s.src.includes('n8n workflow screenshot'))).toBe(true)
```

- In "links every card to its sub-view…", drop `'#support-desk'` from the list.
- In "opens the write-up a shared link names…", use `'/projects#agentic-framework'` and the dialog name `'The Agentic Framework'`.
- In "marks which systems are live…", `LIVE` becomes `toHaveLength(7)` (Workflow Creator was live).
- Add:

```tsx
  it('has no Support Ticketing write-up and no Workflow Creator any more', () => {
    render(<ProjectViews />)
    expect(document.body).not.toHaveTextContent('Support Ticketing System')
    expect(document.body).not.toHaveTextContent('Workflow Creator')
  })
```

`tests/commands.test.ts`: in "follow the pages…", drop `'/projects#support-desk', ` from the expected hrefs.

`e2e/projects.spec.ts`: "a shared link opens the view; Close stays on the page" uses `page.goto('/projects#agentic-framework')` and the dialog name `'The Agentic Framework'`. Add:

```ts
test('an old #support-desk link just shows Projects', async ({ page }) => {
  await page.goto('/projects#support-desk')
  await hydrated(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
  await expect(page.locator('dialog.view[open]')).toHaveCount(0)
})
```

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/no-ghl.test.ts tests/projects.test.tsx tests/commands.test.ts`
Expected: FAIL. `no-ghl` lists `data/projects.ts` and `data/projectDocs.ts` lines, and the projects and commands tests fail on the old values.

- [ ] **Step 3: Implement**

`data/projects.ts`:
- Import line: remove `LifebuoyIcon`.
- `export const PROJECT_VIEWS = ['reel', 'build-plan', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const`
- `export const DOC_VIEWS = ['agentic-framework', 'end-to-end'] as const`
- REEL:

```ts
const REEL: Screenshot[] = [
  'TM-01 · Quote request',
  'Workflows list',
  'TM-02 · Survey → Estimate',
  'Workflow settings',
  'Executions',
].map((label) => ({ label, src: `PLACEHOLDER - n8n workflow screenshot: ${label} (16:10)` }))
```

- `WRITEUPS`: delete the `support-desk` line.
- `cards.reel.body`: `'Real screens from the n8n workflows I build.'`

`data/projectDocs.ts`:
- Delete the whole `'support-desk': { … },` entry.
- In `GROUPS` → Chatbots, delete the `Workflow Creator` card line.
- BrewedOps OS roster `desc`: `'Ten specialists, one job each, from n8n audits to client deliverables. Every write is approval-gated.'`
- End-to-End `stack`: `[{ name: 'n8n', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Node.js', icon: FileJsIcon }, { name: 'Telegram', icon: PaperPlaneTiltIcon }]`
- End-to-End's first trigger card: `desc: 'Form fills, stage changes, inbound messages and booked calls, caught by n8n webhooks.', meta: 'n8n webhooks'`
- The import list becomes exactly:

```ts
import {
  ArrowsClockwiseIcon, ArticleIcon, BooksIcon, BrowsersIcon, ChartBarIcon, ChatCircleIcon, CodeIcon, CoffeeIcon, CursorIcon, DatabaseIcon, FileJsIcon, FileTextIcon, FilmStripIcon, FlowArrowIcon, HashIcon, LightningIcon, ListChecksIcon, MagnifyingGlassIcon, MicrophoneIcon, PackageIcon, PaperPlaneTiltIcon, PhoneCallIcon, PuzzlePieceIcon, ScissorsIcon, ShieldCheckIcon, ShippingContainerIcon, SparkleIcon, TargetIcon, TerminalWindowIcon, TimerIcon, UsersThreeIcon, WaveformIcon,
} from '@phosphor-icons/react/ssr'
```

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run && npm run lint && npm run typecheck && npx playwright test e2e/projects.spec.ts e2e/palette.spec.ts --workers=1 --project=desktop`
Expected: the whole unit suite passes, lint and tsc are clean, and the e2e tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/no-ghl.test.ts data/projects.ts data/projectDocs.ts tests/projects.test.tsx tests/commands.test.ts e2e/projects.spec.ts
git commit -m "chore: remove every GoHighLevel mention; the plan and write-ups say n8n"
```

---

### Task 8: Sitemap and the Home screenshot

**Files:**
- Modify: `lib/seo.ts`, `app/sitemap.ts`, `data/projects.ts` (the build plan's BUILDS entry), `package.json` (`plan` script)
- Create: `scripts/shoot-plan.mjs`, `public/shots/build-plan.jpeg` (generated)
- Test: `tests/seo.test.ts`, `tests/projects.test.tsx`, `e2e/seo.spec.ts`

**Interfaces:**
- Produces: `STATIC_PAGES: string[]` from `lib/seo.ts`. `BUILDS[1].shot = '/shots/build-plan.jpeg'`.

- [ ] **Step 1: Write the failing tests**

`tests/seo.test.ts`: import `STATIC_PAGES` alongside `indexedPaths`, and change the first sitemap test to:

```ts
  it('lists every public page once, the build plan too, and leaves the thank-you page out', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toEqual([...indexedPaths(), ...STATIC_PAGES].map((p) => `${SITE_URL}${p === '/' ? '' : p}`))
    expect(urls).toContain(`${SITE_URL}/build-plan.html`)
    expect(urls.some((u) => u.includes('thank-you'))).toBe(false)
  })
```

`tests/projects.test.tsx`: add `BUILDS` to the `@/data/projects` import, then add to `describe('Projects data', ...)`:

```ts
  it('shows a real 16:10 screenshot of the build plan on Home', () => {
    const plan = BUILDS.find((b) => b.view === 'build-plan')!
    expect(plan.shot).toBe('/shots/build-plan.jpeg')
    expect(jpegSize(readFileSync(`public${plan.shot}`))).toEqual({ width: 640, height: 400 })
  })
```

`e2e/seo.spec.ts`: change line 25 to `for (const p of ['/projects', '/showcase', '/privacy', '/build-plan.html']) expect(sitemap).toContain(p)`.

- [ ] **Step 2: Run them and watch them fail**

Run: `npx vitest run tests/seo.test.ts tests/projects.test.tsx`
Expected: FAIL, with "STATIC_PAGES is not exported" and "/shots/build-plan.jpeg" missing.

- [ ] **Step 3: Implement**

`lib/seo.ts`, below `indexedPaths`:

```ts
/** Stand-alone pages in public/ that search engines should find too (spec 2026-09-30: the build plan). */
export const STATIC_PAGES = ['/build-plan.html']
```

`app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { indexedPaths, STATIC_PAGES } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [...indexedPaths(), ...STATIC_PAGES].map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
```

`scripts/shoot-plan.mjs`:

```js
// Photographs public/build-plan.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run plan
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400, plenty for the fan's 210px cards.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'dark' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'build-plan.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'build-plan.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
```

`package.json`: `"plan": "node scripts/make-plan.ts && node scripts/shoot-plan.mjs"`

`data/projects.ts` BUILDS: `{ name: projects.cards.plan.title, view: 'build-plan', shot: '/shots/build-plan.jpeg' },`

Run: `npm run plan`
Expected: prints the page size, and writes `public/shots/build-plan.jpeg`.

- [ ] **Step 4: Run them and watch them pass**

Run: `npx vitest run tests/seo.test.ts tests/projects.test.tsx tests/ProjectsCard.test.tsx tests/placeholders.test.ts tests/buildPlan-render.test.ts`
Expected: PASS. The placeholders test may list one fewer PLACEHOLDER. If it pins a count, lower that count by one and note it as a ruling.

- [ ] **Step 5: Commit**

```bash
git add lib/seo.ts app/sitemap.ts scripts/shoot-plan.mjs public/shots/build-plan.jpeg package.json data/projects.ts tests/seo.test.ts tests/projects.test.tsx e2e/seo.spec.ts
git commit -m "feat: the build plan is in the sitemap and on Home's Projects fan"
```

---

### Task 9: Full verification

**Files:** none new.

- [ ] **Step 1: Everything, fresh**

Run:

```bash
npm run plan && git status --short public/
npx vitest run
npm run lint
npm run typecheck
npx playwright test --workers=1
```

Expected:
- `npm run plan` leaves `public/` unchanged (git status shows nothing new under public/).
- vitest passes every test.
- lint and tsc are clean.
- Playwright passes every desktop and phone test.

Record any failure with its output, and fix it under superpowers:systematic-debugging before going on.

- [ ] **Step 2: Look at the result once**

- Run `npx next build` and `npx next start -p 3200`, then shoot three screens with a throwaway `.cjs` Playwright script in the repo root:
  - `/projects#build-plan` at 1440 and at 390, in dark and in light;
  - `/build-plan.html` on its own;
  - Home's Projects fan.
- Delete the script and stop the server: `netstat -ano | grep ':3200 '` → `taskkill //F //PID <pid>`.
- Send the shots to Justine with SendUserFile.

- [ ] **Step 3: Hand over**

Use superpowers:finishing-a-development-branch. Justine chooses what happens next (push, PR, merge) through AskUserQuestion.
