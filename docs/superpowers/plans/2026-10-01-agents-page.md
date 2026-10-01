# AI Agents and RAG Chatbots Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the kape content behind the **AI agents and RAG chatbots** card with eight labelled sample builds and a generated standalone page (`/ai-agents.html`): two live diagrams (a RAG pipeline and an agent loop) where each build's "Show its route" lights its own path. The board card gets a mini chat and agent-run preview, count chips and real logos.

**Architecture:** The same pipeline as the Agentic Framework page:
- typed data in `data/agents.ts`;
- a grid layout in `lib/agents/layout.ts`;
- a string renderer in `lib/agents/render.ts`, which reuses the AF styles, the brand layer and End-to-End's client read-only;
- a small `lib/agents/focus.js` for Show its route;
- a generator script that writes `public/ai-agents.html`, with a freshness test.

The shared client gains one opt-in hook (`data-only`). The card's window becomes an iframe of the page, and `data/projectDocs.ts` and the old React window are deleted.

**Tech Stack:** Next.js (App Router), React 19, Tailwind v4, TypeScript run directly by Node 26, Vitest (jsdom), Playwright, Phosphor icons, simple-icons.

**Spec:** `docs/superpowers/specs/2026-10-01-agents-page-design.md`

## Global Constraints

- Every build is labelled **SAMPLE BUILD**: an example of what Justine builds, not a client project.
- All copy uses curly quotes and apostrophes (’ “ ”). No straight `'` or `"` inside any data string.
- Step labels and sub-lines are 22 characters or fewer. Every `what` is 20–220 characters and ends with a full stop.
- No raw colours in `lib/**` (`tests/no-raw-colors.test.ts`): CSS uses tokens only.
- The build plan page is not changed: nothing under `lib/buildPlan/`, `data/buildPlan.ts`, `scripts/make-plan.ts`, `scripts/shoot-plan.mjs` or `public/build-plan.html` is edited.
- End-to-End and the Agentic Framework change only by the client's `data-only` hook and End-to-End's one Writer line. Both pages are regenerated with `node scripts/make-e2e.ts` and `node scripts/make-af.ts` (never their shoot scripts).
- Only logos the pages already have (`lib/brand/tools.ts`). Unbranded things use Phosphor icons.
- Generated pages load nothing but Google Fonts from outside.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- `next build` type-checks test files, so the e2e web server will not start while any test file fails to compile.

## Review Focus

1. **Esc inside the site's window while a route is shown:** the first Esc clears the route, the second closes the window. *(Task 5, `e2e/projects.spec.ts`)*
2. **Pressing the same Show its route button twice:** the second press clears it, like a toggle (`aria-pressed`). *(Task 4)*
3. **Keyboard only:** Tab to a build's button and press Enter, focus lands on Show all, Enter returns focus to the build. *(Task 4)*
4. **Print:** route buttons and the caption bar don't print. *(Task 4)*
5. **The board preview plays only on screen:** paused until the card scrolls into view, still under reduced motion. *(Task 5)*

---

### Task 1: The page's content (`data/agents.ts`)

**Files:**
- Create: `data/agents.ts`
- Test: `tests/agents-data.test.ts`

**Interfaces:**
- Produces: `export const agents: Agents`, `export const KIND_TYPES: Record<StepKind, string>`, and the types `Agents`, `SectionId`, `Section`, `DiagramId` (`'rag' | 'agent'`), `StepKind`, `Pin`, `Step`, `Cable`, `RouteDef`, `LegendId`, `LegendKey`, `Diagram`, `Build`, `Tile`, exactly as written in Step 3.

- [ ] **Step 1: Write the failing test** — `tests/agents-data.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { agents as g, KIND_TYPES, type DiagramId } from '@/data/agents'
import { TOOLS } from '@/lib/brand/tools'

const D: DiagramId[] = ['rag', 'agent']
/** Every string value in v, however deep. */
const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : []

describe('the agents page data', () => {
  it('has the six sections, in order, each with a chip, a kicker, a title and a line', () => {
    expect(g.sections.map((s) => s.id)).toEqual(['glance', 'rag', 'agent', 'builds', 'guardrails', 'glossary'])
    expect(g.sections.map((s) => s.chip)).toEqual(['At a glance', 'RAG chatbots', 'Agents', 'The builds', 'Guardrails', 'Glossary'])
    for (const s of g.sections) for (const v of [s.kicker, s.title, s.blurb]) expect(v.length, s.id).toBeGreaterThan(3)
  })

  it('opens with the hero the spec sets', () => {
    expect(g.kicker).toBe('AI AGENTS AND RAG CHATBOTS')
    expect(g.heading).toBe('How my AI agents and RAG chatbots work')
    expect(g.sample).toBe('These are sample builds: examples of what I build, not client projects.')
    expect(g.heroTools).toEqual(['claude', 'n8n', 'supabase'])
  })

  it('gives every step a unique id and spot, a kind, a short label and sub-line, and a plain description', () => {
    const all = D.flatMap((d) => g.diagrams[d].steps.map((s) => s.id))
    expect(new Set(all).size).toBe(all.length)
    for (const d of D) {
      const spots = g.diagrams[d].steps.map((s) => s.at.join(','))
      expect(new Set(spots).size, d).toBe(spots.length)
      for (const s of g.diagrams[d].steps) {
        expect(KIND_TYPES[s.kind], s.id).toBeTruthy()
        expect(s.label.length, s.label).toBeLessThanOrEqual(22)
        expect(s.sub.length, `${s.label}: ${s.sub}`).toBeLessThanOrEqual(22)
        expect(s.what.length, s.id).toBeGreaterThanOrEqual(20)
        expect(s.what.length, s.id).toBeLessThanOrEqual(220)
        expect(s.what, s.id).toMatch(/\.$/)
        for (const t of s.tools ?? []) expect(TOOLS[t], `${s.id} ${t}`).toBeTruthy()
      }
    }
  })

  it('lays the steps out as the spec’s tables say', () => {
    const at = (d: DiagramId) => Object.fromEntries(g.diagrams[d].steps.map((s) => [s.id, s.at.join(',')]))
    expect(at('rag')).toEqual({ docs: '0,0', chunk: '1,0', embed: '2,0', store: '3,0', ask: '0,1', qembed: '1,1', search: '3,1', answer: '4,1', sure: '5,1', reply: '6,1', book: '7,1', handoff: '5,2' })
    expect(at('agent')).toEqual({ trigger: '0,0', plan: '1,0', tool: '2,0', check: '3,0', needs: '4,0', gate: '5,0', act: '6,0' })
  })

  it('joins every cable to real steps', () => {
    for (const d of D) {
      const ids = new Set(g.diagrams[d].steps.map((s) => s.id))
      for (const c of g.diagrams[d].cables) expect(ids.has(c.from) && ids.has(c.to), `${d}: ${c.from} → ${c.to}`).toBe(true)
    }
  })

  it('runs every route from a start to an end along real cables', () => {
    for (const d of D) {
      const { steps, cables, routes } = g.diagrams[d]
      const kind = new Map(steps.map((s) => [s.id, s.kind]))
      for (const r of routes) {
        expect(kind.get(r.nodes[0]), r.id).toBe('start')
        expect(kind.get(r.nodes.at(-1)!), r.id).toBe('end')
        for (let i = 1; i < r.nodes.length; i++)
          expect(cables.some((c) => c.kind !== 'index' && c.from === r.nodes[i - 1] && c.to === r.nodes[i]), `${r.id}: ${r.nodes[i - 1]} → ${r.nodes[i]}`).toBe(true)
      }
    }
  })

  it('between its routes, each diagram passes every step and every cable but the index', () => {
    for (const d of D) {
      const { steps, cables, routes } = g.diagrams[d]
      expect(new Set(routes.flatMap((r) => r.nodes)), d).toEqual(new Set(steps.map((s) => s.id)))
      for (const c of cables.filter((c) => c.kind !== 'index'))
        expect(routes.some((r) => r.nodes.some((n, i) => n === c.from && r.nodes[i + 1] === c.to)), `${d}: ${c.from} → ${c.to}`).toBe(true)
    }
    expect(g.diagrams.rag.routes.map((r) => r.id)).toEqual(['prepare', 'answered', 'handoff', 'booked'])
    expect(g.diagrams.agent.routes.map((r) => r.id)).toEqual(['straight', 'notdone', 'changed', 'internal'])
  })

  it('gives each pin a unique id on its step, a logo or an icon, and a plain line', () => {
    for (const d of D)
      for (const s of g.diagrams[d].steps) {
        const pins = s.pins ?? []
        expect(new Set(pins.map((p) => p.id)).size, s.id).toBe(pins.length)
        if (pins.length) expect(s.pinType, s.id).toMatch(/^[A-Z]+$/)
        for (const p of pins) {
          expect(!!p.tool !== !!p.icon, `${s.id}:${p.id} has a logo or an icon, never both`).toBe(true)
          if (p.tool) expect(TOOLS[p.tool].name, `${s.id}:${p.id}`).toBe(p.name)
          expect(p.what, `${s.id}:${p.id}`).toMatch(/^.{10,120}\.$/)
        }
      }
  })

  it('has eight sample builds, four RAG chatbots then four agents', () => {
    expect(g.builds.map((b) => `${b.kind} ${b.name}`)).toEqual([
      'rag Help-desk RAG bot', 'rag Team knowledge bot', 'rag Website sales bot', 'rag Document Q&A bot',
      'agent Inbox triage agent', 'agent Billing follow-up agent', 'agent Lead research agent', 'agent Weekly report agent',
    ])
    expect(g.buildText.sample).toBe('SAMPLE BUILD')
  })

  it('lights only routes and pins that exist on the build’s own diagram', () => {
    for (const b of g.builds) {
      const d = g.diagrams[b.kind]
      for (const r of b.routes) expect(d.routes.some((x) => x.id === r), `${b.id}: ${r}`).toBe(true)
      for (const p of b.pins) {
        const [step, pin] = p.split(':')
        expect(d.steps.find((s) => s.id === step)?.pins?.some((x) => x.id === pin), `${b.id}: ${p}`).toBe(true)
      }
    }
    expect(g.builds.find((b) => b.id === 'report')!.routes).toEqual(['internal'])
    expect(g.builds.find((b) => b.id === 'sales')!.routes).toEqual(['prepare', 'answered', 'booked'])
  })

  it('names only known tools, with Claude and n8n in every build', () => {
    for (const b of g.builds) {
      for (const t of b.tools) expect(TOOLS[t], `${b.id} ${t}`).toBeTruthy()
      expect(b.tools, b.id).toContain('claude')
      expect(b.tools, b.id).toContain('n8n')
    }
  })

  it('keeps every build line and caption short enough to read at a glance', () => {
    for (const b of g.builds) {
      expect(b.line.length, b.id).toBeLessThanOrEqual(110)
      expect(b.caption.length, b.id).toBeLessThanOrEqual(130)
      expect(b.line, b.id).toMatch(/\.$/)
    }
  })

  it('has three tiles at a glance, four guardrails and fifteen glossary terms', () => {
    expect(g.glance.map((t) => t.title)).toEqual(['RAG chatbots', 'AI agents', 'Your yes'])
    expect(g.guardrails.map((t) => t.title)).toEqual(['Answers only from the sources', '“I don’t know” beats a guess', 'Customers and money wait for your yes', 'Every run is logged'])
    expect(g.glossary).toHaveLength(15)
  })

  it('uses every glossary term somewhere else on the page', () => {
    const rest = strings({ ...g, glossary: [] }).join(' ').toLowerCase()
    for (const [term] of g.glossary) expect(rest, term).toContain(term.toLowerCase())
  })

  it('uses curly quotes and apostrophes only', () => {
    for (const s of strings(g)) expect(s, s).not.toMatch(/['"]/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/agents-data.test.ts`
Expected: FAIL. The import of `@/data/agents` cannot be resolved.

- [ ] **Step 3: Write the data** — `data/agents.ts`:

```ts
/**
 * The AI agents and RAG chatbots page’s content (spec 2026-10-01-agents-page):
 * two diagrams and eight labelled sample builds on Justine’s stack. They are
 * examples of what Justine builds, not client projects.
 * public/ai-agents.html is generated from it: npm run agents-page
 */
import type { ToolId } from '../lib/brand/tools.ts'

export type SectionId = 'glance' | 'rag' | 'agent' | 'builds' | 'guardrails' | 'glossary'
export type Section = { id: SectionId; chip: string; kicker: string; title: string; blurb: string }
export type DiagramId = 'rag' | 'agent'
export type StepKind = 'start' | 'step' | 'branch' | 'gate' | 'end'
/** A source, channel or tool a step can use: a logo (`tool`) or a Phosphor icon name (`icon`). */
export type Pin = { id: string; name: string; what: string; tool?: ToolId; icon?: string }
/** A step on a diagram. `at` is its [column, row]. `pinType` names its pins in the details panel. */
export type Step = { id: string; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; tools?: ToolId[]; pins?: Pin[]; pinType?: string }
/** `index` is the dashed link from the store to the search. `under` sends a forward cable under the row. */
export type Cable = { from: string; to: string; kind: 'flow' | 'loop' | 'index'; label?: string; under?: true }
/** One way through a diagram for the balls, step by step. */
export type RouteDef = { id: string; nodes: string[] }
export type LegendId = 'cable' | 'signal' | 'loop' | 'index' | 'branch' | 'gate' | 'pin'
export type LegendKey = { id: LegendId; label: string; what: string }
export type Diagram = { id: DiagramId; caption: string; steps: Step[]; cables: Cable[]; routes: RouteDef[]; legend: LegendKey[] }
/** A sample build. `routes` are its diagram’s route ids; `pins` are "step:pin". */
export type Build = { id: string; kind: DiagramId; name: string; line: string; tools: ToolId[]; routes: string[]; pins: string[]; caption: string }
export type Tile = { mark: string; icon: string; title: string; text: string }
export type Agents = {
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  sample: string
  heroTools: ToolId[]
  sections: Section[]
  glance: Tile[]
  diagrams: Record<DiagramId, Diagram>
  builds: Build[]
  buildText: { sample: string; kinds: Record<DiagramId, string>; groups: Record<DiagramId, string>; show: string; showAll: string; tools: string }
  guardrails: Tile[]
  glossary: [string, string][]
  footer: { note: string; by: string }
}

/** What the details panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = { start: 'START', step: 'STEP', branch: 'DECISION', gate: 'APPROVAL GATE', end: 'END' }

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

export const agents: Agents = {
  title: 'AI agents and RAG chatbots · Justine Acosta',
  description: 'How Justine Acosta’s AI agents and RAG chatbots work: two live diagrams, eight sample builds and the guardrails they follow.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS',
  heading: 'How my AI agents and RAG chatbots work',
  lede: 'Eight sample builds on one stack, and the two patterns underneath every one of them.',
  sample: 'These are sample builds: examples of what I build, not client projects.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns, and both stop for your yes.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW A RAG CHATBOT WORKS', title: 'Search first, then answer', blurb: 'Documents are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A trigger starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'EIGHT SAMPLE BUILDS', title: 'Eight sample builds', blurb: 'Examples of what I build on this stack. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe to put in front of customers.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'They search your documents first, then answer from what they found, with the source.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'They take a goal, pick their own tools and finish the job, checking as they go.' },
    { mark: '3', icon: 'UserCheck', title: 'Your yes', text: 'Anything that reaches a customer or moves money waits for your approval.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'A RAG chatbot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Your documents', sub: 'Docs, PDFs, Sheets', icon: 'Files', pinType: 'SOURCE',
          what: 'The material the bot is allowed to answer from: help docs, PDFs and Google Sheets. Nothing outside it counts.',
          pins: [
            { id: 'docs', name: 'Docs', icon: 'FileText', what: 'Help articles, SOPs and service pages, as written.' },
            { id: 'pdf', name: 'PDFs', icon: 'FilePdf', what: 'Contracts, manuals and other uploaded files.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Price lists and tables, read row by row.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into chunks', sub: 'A few paragraphs each', icon: 'Scissors', what: 'Long documents are cut into passages of a few paragraphs, so a search can return just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a document changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A question', sub: 'Chat, Telegram, Gmail', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks a question in the website chat, in Telegram or by email. n8n picks it up and starts the run.',
          pins: [
            { id: 'chat', name: 'Website chat', icon: 'ChatCircleDots', what: 'A chat bubble on the website.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'A Telegram bot your team can message.' },
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Questions that arrive by email.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from what is in them.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure?', sub: 'A source was found', icon: 'Question', what: 'Did the passages actually hold the answer? If not, the bot does not guess.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Cites the passage', icon: 'ArrowBendUpLeft', what: 'The answer goes back where the question came from, with the passage it came from, so anyone can check it.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Offer a call', sub: 'Cal.com', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When the visitor is ready to buy, the bot offers open times from Cal.com instead of a form.' },
        { id: 'handoff', at: [5, 2], kind: 'end', label: 'Hand to a person', sub: 'With the chat so far', icon: 'UserSwitch', what: 'A hand-off: a person takes over with the whole chat so far, so the customer never has to repeat themselves.' },
      ],
      cables: [
        flow('docs', 'chunk'),
        flow('chunk', 'embed'),
        flow('embed', 'store'),
        { from: 'store', to: 'search', kind: 'index', label: 'the index it searches' },
        flow('ask', 'qembed'),
        flow('qembed', 'search'),
        flow('search', 'answer'),
        flow('answer', 'sure'),
        flow('sure', 'reply', 'yes'),
        flow('sure', 'handoff', 'no'),
        flow('reply', 'book', 'ready to buy'),
      ],
      routes: [
        { id: 'prepare', nodes: ['docs', 'chunk', 'embed', 'store'] },
        { id: 'answered', nodes: [...ASK, 'reply'] },
        { id: 'handoff', nodes: [...ASK, 'handoff'] },
        { id: 'booked', nodes: [...ASK, 'reply', 'book'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one question going through right now.' },
        { id: 'index', label: 'Index', what: 'A dashed cable to the store the search reads.' },
        BRANCH,
        PIN,
      ],
    },
    agent: {
      id: 'agent',
      caption: 'An agent · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Something happens', sub: 'Event or schedule', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Something starts the run: a new email, a Stripe payment event, a form, or a schedule like Monday at 8 am. n8n listens for it.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'A new email lands in the inbox.' },
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'A payment fails or an invoice goes overdue.' },
            { id: 'form', name: 'Form', icon: 'ClipboardText', what: 'A new lead fills in a form on the website.' },
            { id: 'clock', name: 'Schedule', icon: 'Clock', what: 'A set time, like every Monday at 8 am.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads what happened and the goal, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read or draft an email, look up Stripe, save to Supabase, update a sheet, check Cal.com or read a web page.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Reads the thread and drafts a reply.' },
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'Looks up the customer, invoice and payment history.' },
            { id: 'supabase', name: 'Supabase', tool: 'supabase', what: 'Reads and saves records, like a lead in the CRM.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Reads a sheet, like the sales pipeline.' },
            { id: 'cal', name: 'Cal.com', tool: 'cal-com', what: 'Finds open meeting times.' },
            { id: 'web', name: 'Web page', icon: 'Globe', what: 'Reads a public web page, like a lead’s website.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Needs your yes?', sub: 'Customers or money', icon: 'ShieldCheck', what: 'Does the result reach a customer or move money? If yes, it waits for you. Internal work, like a report to yourself, goes straight on.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Your yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'You get the draft in Telegram with Approve and Edit. Nothing is sent until you tap Approve; an edit goes back to Claude.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Act and log', sub: 'Send, then log it', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'The approved email goes out, and the run is written to Google Sheets: what came in, each tool call, and what was sent.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved email.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run, one row per job.' },
          ],
        },
      ],
      cables: [
        flow('trigger', 'plan'),
        flow('plan', 'tool'),
        flow('tool', 'check'),
        flow('check', 'needs', 'done'),
        flow('needs', 'gate', 'yes'),
        flow('gate', 'act', 'approved'),
        loop('check', 'plan', 'not done yet'),
        loop('gate', 'plan', 'change it'),
        { from: 'needs', to: 'act', kind: 'flow', label: 'internal only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one job going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until you say yes.' },
        PIN,
      ],
    },
  },
  builds: [
    { id: 'helpdesk', kind: 'rag', name: 'Help-desk RAG bot', line: 'Answers customers from your help docs and past tickets, and hands off when it isn’t sure.', tools: ['claude', 'supabase', 'n8n', 'gmail'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:docs', 'ask:chat', 'ask:gmail'], caption: 'Website chat or Gmail → search the help docs → Claude answers → reply with the source, or hand to a person' },
    { id: 'team', kind: 'rag', name: 'Team knowledge bot', line: 'Staff ask in Telegram how something is done; it answers from the SOPs and price sheets.', tools: ['claude', 'supabase', 'n8n', 'telegram', 'google-sheets'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:docs', 'docs:sheets', 'ask:telegram'], caption: 'Telegram → search the SOPs and price sheets → Claude answers → reply with the source, or hand to a person' },
    { id: 'sales', kind: 'rag', name: 'Website sales bot', line: 'Answers product and pricing questions from the real price list, then offers a call.', tools: ['claude', 'supabase', 'n8n', 'cal-com'], routes: ['prepare', 'answered', 'booked'], pins: ['docs:docs', 'docs:sheets', 'ask:chat'], caption: 'Website chat → search the price list and service pages → Claude answers → reply, then offer a Cal.com call' },
    { id: 'docqa', kind: 'rag', name: 'Document Q&A bot', line: 'Ask about your contracts or manuals; it answers with the page it used, or says it isn’t there.', tools: ['claude', 'supabase', 'n8n'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:pdf', 'ask:chat'], caption: 'Website chat → search the uploaded PDFs → Claude answers → reply with the page, or say it isn’t there' },
    { id: 'inbox', kind: 'agent', name: 'Inbox triage agent', line: 'Reads every new email, sorts it, drafts the reply and offers meeting times. Sends only on your yes.', tools: ['claude', 'n8n', 'gmail', 'cal-com', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:gmail', 'tool:gmail', 'tool:cal', 'act:gmail', 'act:sheets'], caption: 'New email → Claude sorts and drafts → Gmail and Cal.com → your yes in Telegram → send and log' },
    { id: 'billing', kind: 'agent', name: 'Billing follow-up agent', line: 'Watches Stripe for failed or overdue payments, picks the next step, writes the email and logs it.', tools: ['claude', 'n8n', 'stripe', 'gmail', 'google-sheets', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:stripe', 'tool:stripe', 'act:gmail', 'act:sheets'], caption: 'Stripe: payment failed → Claude picks the next step → reminder or retry link → your yes in Telegram → send and log' },
    { id: 'leads', kind: 'agent', name: 'Lead research agent', line: 'Reads a new lead’s website, scores the fit, saves it to the CRM and drafts a first email for your yes.', tools: ['claude', 'n8n', 'supabase', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:form', 'tool:web', 'tool:supabase', 'act:gmail', 'act:sheets'], caption: 'New form lead → Claude reads their site → score saved in Supabase → your yes on the first email → send and log' },
    { id: 'report', kind: 'agent', name: 'Weekly report agent', line: 'Every Monday it pulls Stripe revenue and the pipeline sheet, spots what changed and emails a summary.', tools: ['claude', 'n8n', 'stripe', 'google-sheets', 'gmail'], routes: ['internal'], pins: ['trigger:clock', 'tool:stripe', 'tool:sheets', 'act:gmail', 'act:sheets'], caption: 'Monday 8 am → Claude pulls Stripe and the pipeline sheet → writes the summary → internal, so no yes needed → send and log' },
  ],
  buildText: {
    sample: 'SAMPLE BUILD',
    kinds: { rag: 'RAG chatbot', agent: 'AI agent' },
    groups: { rag: 'RAG chatbots', agent: 'AI agents' },
    show: 'Show its route',
    showAll: 'Show all',
    tools: 'Tools',
  },
  guardrails: [
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from the sources', text: 'A RAG bot answers from the passages it found and shows which ones. No source, no answer.' },
    { mark: 'G2', icon: 'HandPalm', title: '“I don’t know” beats a guess', text: 'When the search comes back thin, it says so and hands the chat to a person.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'Customers and money wait for your yes', text: 'Anything that reaches a customer or moves money stops for your approval in Telegram.' },
    { mark: 'G4', icon: 'Notebook', title: 'Every run is logged', text: 'Each question, tool call and decision lands in a log you can read later.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search your own documents first, then answer from what was found.'],
    ['Chunk', 'A passage of a few paragraphs cut from a longer document, so a search can return just that part.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Passage', 'One chunk, as the search returns it and the answer cites it.'],
    ['Hand-off', 'Passing the chat to a person, with everything said so far.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: an email, a payment, a form or a set time.'],
    ['Tool call', 'One action an agent asks for, like drafting an email or reading a sheet.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft you sent back.'],
    ['Approval gate', 'A point where the run stops until a person says yes.'],
    ['Claude', 'Anthropic’s AI model. It plans, reads and writes in every build here.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here for the document store and the CRM.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them.', by: 'Built by Justine Acosta' },
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/agents-data.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add data/agents.ts tests/agents-data.test.ts
git commit -m "feat: the agents page's content: two diagrams, eight labelled sample builds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The diagrams' layout (`lib/agents/layout.ts`)

**Files:**
- Create: `lib/agents/layout.ts`
- Test: `tests/agents-layout.test.ts`

**Interfaces:**
- Consumes: `Diagram`, `Cable` from `data/agents.ts` (Task 1).
- Produces:
  - `GEOM = { col: 168, row: 150, node: 56, padX: 64, label: 44, pin: 24, pinGap: 4, padB: 24, top: 32, topArcs: 120 }`
  - `type Placed = { x: number; y: number }`
  - `type LaidCable = Cable & { d: string; len: number; mid: [number, number]; start: [number, number]; end: [number, number]; pts: [number, number][] }`
  - `type Route = { id: string; nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][] }`
  - `type DiagramLayout = { nodes: Record<string, Placed>; pins: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }`
  - `layoutDiagram(d: Diagram): DiagramLayout`. The pins are keyed `"step:pin"`. The routes come in the data's order.

- [ ] **Step 1: Write the failing test** — `tests/agents-layout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { agents as g, type DiagramId } from '@/data/agents'
import { GEOM, layoutDiagram } from '@/lib/agents/layout'

const N = GEOM.node
const P = GEOM.pin
type B = { x: number; y: number; w: number; h: number }
const hit = (a: B, b: B) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
const inside = (p: [number, number], b: B) => p[0] > b.x && p[0] < b.x + b.w && p[1] > b.y && p[1] < b.y + b.h
const D: DiagramId[] = ['rag', 'agent']

describe('layoutDiagram', () => {
  for (const id of D) {
    const d = g.diagrams[id]
    const l = layoutDiagram(d)
    const card = (s: string): B => ({ x: l.nodes[s].x, y: l.nodes[s].y, w: N, h: N })
    const name = (s: string): B => ({ x: l.nodes[s].x + N / 2 - 68, y: l.nodes[s].y + N + 4, w: 136, h: GEOM.label - 8 })
    const pinBoxes = Object.entries(l.pins).map(([k, p]) => ({ k, step: k.split(':')[0], b: { x: p.x, y: p.y, w: P, h: P } }))
    const label = (c: (typeof l.cables)[number]): B => ({ x: c.mid[0] - (c.label!.length * 6.5 + 12) / 2, y: c.mid[1] - 9, w: c.label!.length * 6.5 + 12, h: 18 })

    it(`${id}: puts each step on its grid spot`, () => {
      const top = l.nodes[d.steps[0].id].y
      for (const s of d.steps) expect(l.nodes[s.id], s.id).toEqual({ x: GEOM.padX + s.at[0] * GEOM.col, y: top + s.at[1] * GEOM.row })
      expect(top).toBe(id === 'agent' ? GEOM.topArcs : GEOM.top)
      expect(l.width).toBe(GEOM.padX * 2 + Math.max(...d.steps.map((s) => s.at[0])) * GEOM.col + N)
    })

    it(`${id}: never lets two steps, names or pins overlap, and keeps them all inside the frame`, () => {
      const boxes = [
        ...d.steps.map((s) => ({ k: s.id, b: { x: l.nodes[s.id].x + N / 2 - 68, y: l.nodes[s.id].y, w: 136, h: N + GEOM.label } })),
        ...pinBoxes,
      ]
      for (const { k, b } of boxes) expect(b.x >= 0 && b.x + b.w <= l.width && b.y >= 0 && b.y + b.h <= l.height, k).toBe(true)
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) expect(hit(boxes[i].b, boxes[j].b), `${boxes[i].k} × ${boxes[j].k}`).toBe(false)
    })

    it(`${id}: centres each step’s pins in one row under its name`, () => {
      for (const s of d.steps.filter((s) => s.pins?.length)) {
        const row = s.pins!.map((p) => l.pins[`${s.id}:${p.id}`])
        for (const p of row) expect(p.y).toBe(l.nodes[s.id].y + N + GEOM.label + 2)
        const mid = (row[0].x + row.at(-1)!.x + P) / 2
        expect(mid).toBeCloseTo(l.nodes[s.id].x + N / 2, 5)
      }
    })

    it(`${id}: keeps every cable clear of steps, names and pins it does not connect, and inside the frame`, () => {
      for (const c of l.cables) {
        for (const p of c.pts) expect(p[0] >= 0 && p[0] <= l.width && p[1] >= 0 && p[1] <= l.height, `${c.from} → ${c.to}`).toBe(true)
        for (const s of d.steps) {
          if (s.id === c.from || s.id === c.to) continue
          const bad = c.pts.find((p) => inside(p, card(s.id)) || inside(p, name(s.id)))
          expect(bad, `${c.from} → ${c.to} crosses ${s.id}`).toBeUndefined()
        }
        for (const pin of pinBoxes.filter((x) => x.step !== c.from && x.step !== c.to))
          expect(c.pts.find((p) => inside(p, pin.b)), `${c.from} → ${c.to} crosses pin ${pin.k}`).toBeUndefined()
      }
    })

    it(`${id}: puts every cable label inside the frame, clear of every card, name and pin`, () => {
      for (const c of l.cables.filter((c) => c.label)) {
        const b = label(c)
        expect(b.x >= 0 && b.x + b.w <= l.width && b.y >= 0 && b.y + b.h <= l.height, c.label).toBe(true)
        for (const s of d.steps) expect(hit(b, card(s.id)) || hit(b, name(s.id)), `${c.label} × ${s.id}`).toBe(false)
        for (const pin of pinBoxes) expect(hit(b, pin.b), `${c.label} × ${pin.k}`).toBe(false)
      }
    })

    it(`${id}: measures one route per data route, in order, each timed along its cables`, () => {
      expect(l.routes.map((r) => r.id)).toEqual(d.routes.map((r) => r.id))
      for (const r of l.routes) {
        expect(r.stops.map(([s]) => s)).toEqual(r.nodes)
        for (let i = 1; i < r.stops.length; i++) expect(r.stops[i][1]).toBeGreaterThan(r.stops[i - 1][1])
        expect(r.stops.at(-1)![1]).toBe(r.length)
        expect(r.spans).toHaveLength(r.nodes.length - 1)
        for (const [k, from, to] of r.spans) {
          expect(from >= 0 && to <= r.length && to > from).toBe(true)
          expect(l.cables[k].kind).not.toBe('index')
        }
        expect(r.run).toMatch(/^M[\d.]+ [\d.]+/)
      }
    })
  }

  const rag = layoutDiagram(g.diagrams.rag)
  const agent = layoutDiagram(g.diagrams.agent)
  const cable = (l: typeof rag, from: string, to: string) => l.cables.find((c) => c.from === from && c.to === to)!

  it('drops the index straight down from Store to Search', () => {
    const c = cable(rag, 'store', 'search')
    for (const p of c.pts) expect(p[0]).toBeCloseTo(rag.nodes.store.x + N / 2, 5)
    expect(c.end[1]).toBe(rag.nodes.search.y)
  })

  it('arcs both loop-backs over the row, the longer one higher', () => {
    const low = cable(agent, 'check', 'plan')
    const high = cable(agent, 'gate', 'plan')
    for (const c of [low, high]) expect(Math.max(...c.pts.map((p) => p[1]))).toBeLessThanOrEqual(agent.nodes.plan.y)
    expect(high.mid[1]).toBeLessThan(low.mid[1])
  })

  it('dips the internal-only cable under the row, below Act’s pins', () => {
    const c = cable(agent, 'needs', 'act')
    expect(Math.min(...c.pts.map((p) => p[1]))).toBeGreaterThanOrEqual(agent.nodes.needs.y + N)
    expect(c.end[1]).toBe(agent.nodes.act.y + N + GEOM.label - 4 + P + 6)
  })

  it('refuses a missing step, a cable it cannot draw, and a route with no cable', () => {
    const d = g.diagrams.agent
    expect(() => layoutDiagram({ ...d, cables: [...d.cables, { from: 'trigger', to: 'nowhere', kind: 'flow' }] })).toThrow(/missing step/)
    expect(() => layoutDiagram({ ...d, steps: [...d.steps, { ...d.steps[0], id: 'odd', at: [3, 1] }], cables: [...d.cables, { from: 'trigger', to: 'odd', kind: 'flow' }] })).toThrow(/no shape/)
    expect(() => layoutDiagram({ ...d, routes: [...d.routes, { id: 'bad', nodes: ['trigger', 'act'] }] })).toThrow(/Route bad has no cable trigger → act/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/agents-layout.test.ts`
Expected: FAIL. `@/lib/agents/layout` cannot be resolved.

- [ ] **Step 3: Write the layout** — `lib/agents/layout.ts`:

```ts
import type { Cable, Diagram } from '../../data/agents.ts'

/**
 * The diagrams’ grid, in px (spec 2026-10-01-agents-page §4.2): column and
 * row pitch, step size, side margin, the room under a step for its name, pin
 * size and gap, the bottom margin, and the room above row 0 (more when a
 * loop-back arcs over it).
 */
export const GEOM = { col: 168, row: 150, node: 56, padX: 64, label: 44, pin: 24, pinGap: 4, padB: 24, top: 32, topArcs: 120 } as const

type Pt = [number, number]
export type Placed = { x: number; y: number }
/** A cable as drawn: its SVG path, length, where its label sits, its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; start: Pt; end: Pt; pts: Pt[] }
/** One way through a diagram for a ball, timed like End-to-End’s routes (its client reads them). */
export type Route = { id: string; nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][] }
export type DiagramLayout = { nodes: Record<string, Placed>; pins: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

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
 * Places one diagram (spec §3.4–3.5, §4.2). Each step sits on the grid at
 * `at`. Its pins sit in one centred row under its name. Cables take one of four shapes:
 * - forward along a row: port to port;
 * - forward along a row with `under`: out under the step's name (or pins), dipping under the row;
 * - back along a row: an arc over the top, higher the further it reaches;
 * - straight down a column: from under the step's name into the top of the step below.
 * Anything else throws. Routes are the data's, measured along their cables.
 */
export function layoutDiagram(d: Diagram): DiagramLayout {
  const { col: C, row: R, node: N, padX, label, pin: P, pinGap, padB } = GEOM
  const { steps, cables: list, routes: defs } = d
  const ids = steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const c of list) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)

  const back = (c: Cable) => byId.get(c.from)!.at[1] === byId.get(c.to)!.at[1] && byId.get(c.to)!.at[0] < byId.get(c.from)!.at[0]
  const top = list.some(back) ? GEOM.topArcs : GEOM.top
  const nodes: Record<string, Placed> = {}
  for (const s of steps) nodes[s.id] = { x: padX + s.at[0] * C, y: top + s.at[1] * R }
  const pins: Record<string, Placed> = {}
  for (const s of steps) {
    const row = s.pins ?? []
    const w = row.length * P + (row.length - 1) * pinGap
    row.forEach((p, i) => {
      pins[`${s.id}:${p.id}`] = { x: nodes[s.id].x + N / 2 - w / 2 + i * (P + pinGap), y: nodes[s.id].y + N + label + 2 }
    })
  }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  /** Just under a step's name, or under its pins when it has some. */
  const bottom = (id: string) => nodes[id].y + N + label - 4 + (byId.get(id)!.pins?.length ? P + 6 : 0)

  const cables: LaidCable[] = list.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    const span = t.at[0] - s.at[0]
    if (s.at[1] === t.at[1] && span > 0 && c.under) {
      const a: Pt = [cx(s.id), bottom(s.id)]
      const b: Pt = [cx(t.id), bottom(t.id)]
      const low = Math.max(a[1], b[1]) + 60
      return { ...c, ...curve(a, [a[0], low], [b[0], low], b) }
    }
    if (s.at[1] === t.at[1] && span > 0) {
      const a: Pt = [nodes[s.id].x + N, cy(s.id)]
      const b: Pt = [nodes[t.id].x, cy(t.id)]
      const dx = (b[0] - a[0]) / 2
      return { ...c, ...curve(a, [a[0] + dx, a[1]], [b[0] - dx, b[1]], b) }
    }
    if (s.at[1] === t.at[1] && span < 0) {
      const rise = 40 + 18 * -span
      const a: Pt = [cx(s.id), nodes[s.id].y]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      return { ...c, ...curve(a, [a[0], a[1] - rise], [b[0], b[1] - rise], b) }
    }
    if (span === 0 && t.at[1] > s.at[1]) {
      const a: Pt = [cx(s.id), bottom(s.id)]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      const third = (b[1] - a[1]) / 3
      return { ...c, ...curve(a, [a[0], a[1] + third], [b[0], b[1] - third], b) }
    }
    throw new Error(`Cable ${c.from} → ${c.to} has no shape on this grid`)
  })

  const width = padX * 2 + Math.max(...steps.map((s) => s.at[0])) * C + N
  const height = Math.round(Math.max(...steps.map((s) => bottom(s.id)), ...cables.flatMap((c) => c.pts.map((p) => p[1] + 9))) + padB)

  // A ball starts at its first step's centre, runs along each cable and through each step's centre.
  const routes = defs.map((r): Route => {
    const hops = r.nodes.slice(1).map((to, i) => {
      const k = cables.findIndex((c) => c.kind !== 'index' && c.from === r.nodes[i] && c.to === to)
      if (k < 0) throw new Error(`Route ${r.id} has no cable ${r.nodes[i]} → ${to}`)
      return k
    })
    let pos: Pt = [cx(r.nodes[0]), cy(r.nodes[0])]
    let at = 0
    let run = `M${round(pos[0])} ${round(pos[1])}`
    const stops: [string, number][] = [[r.nodes[0], 0]]
    const spans: [number, number, number][] = []
    hops.forEach((k, i) => {
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
    return { id: r.id, nodes: r.nodes, run, length: round(at), stops, spans }
  })

  return { nodes, pins, cables, width, height, routes }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/agents-layout.test.ts`
Expected: PASS. If an overlap test fails, the data's grid spots (Task 1) are the thing to move, not the test. Record any such move as a ruling, and keep Task 1's "lays the steps out" test in step.

- [ ] **Step 5: Commit**

```bash
git add lib/agents/layout.ts tests/agents-layout.test.ts
git commit -m "feat: the agents page's diagrams are laid out on a grid, with pins, four cable shapes and timed routes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: The page render, styles and generator

**Files:**
- Create: `lib/agents/styles.ts`, `lib/agents/render.ts`, `scripts/make-agents.ts`, `public/ai-agents.html` (generated)
- Test: `tests/agents-render.test.ts`

**Interfaces:**
- Consumes: `agents`, `KIND_TYPES` and the types (Task 1); `layoutDiagram`, `DiagramLayout` (Task 2); and these, read-only:
  - `afCss(themes)` from `lib/agenticFramework/styles.ts`;
  - `esc` from `lib/buildPlan/render.ts` and `Themes` from `lib/buildPlan/styles.ts`;
  - `iconSvg` from `lib/endToEnd/icons.ts`;
  - from `lib/brand/render.ts`: `backdropHtml`, `contourJs`, `glossaryLogo`, `logo`, `logoBadges`, `logoSheet`, `revealJs`, `themeHeadJs`, `toolByName`, `toolStrip`, `toolTemplates`, `toolsUsed`;
  - `livelyCss` from `lib/brand/lively.ts`, `TOOLS` from `lib/brand/tools.ts`, and `readContrast`/`readTokens` from `lib/tokens.ts`.
- Produces:
  - `PAGE_PATH = '/ai-agents.html'`
  - `type BuildFocus = { diagram: DiagramId; name: string; caption: string; routes: number[]; nodes: string[]; edges: number[]; pins: string[] }`
  - `renderAgents(g?: Agents, themes?: Themes): string`
  - `agentsCss(themes: Themes): string`
- **Page contract Task 4 relies on:**
  - `figure.canvas[data-diagram="rag"|"agent"][data-run][data-routes]`;
  - inside each figure, `.focus-bar > p.focus-text[role=status]` and `button.focus-clear[hidden]`;
  - `.edge[data-edge=i]` and `.edge-label[data-edge=i]`;
  - `.pin[data-node="pin:step:pin"]`;
  - `button.route-btn[data-build=id][aria-pressed=false]`;
  - `<script type="application/json" id="agent-builds">` holding `Record<buildId, BuildFocus>`.

- [ ] **Step 1: Write the failing test** — `tests/agents-render.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agents as g, type Agents } from '@/data/agents'
import { layoutDiagram } from '@/lib/agents/layout'
import { renderAgents } from '@/lib/agents/render'
import { themeHeadJs } from '@/lib/brand/render'
import { iconSvg } from '@/lib/endToEnd/icons'
import { readContrast, readTokens } from '@/lib/tokens'

const html = renderAgents()
const doc = new DOMParser().parseFromString(html, 'text/html')
const data = () => JSON.parse(doc.getElementById('graph-nodes')!.textContent!)
const focus = () => JSON.parse(doc.getElementById('agent-builds')!.textContent!)
const fig = (id: string) => doc.querySelector<HTMLElement>(`figure[data-diagram="${id}"]`)!

describe('renderAgents', () => {
  it('picks its theme in <head>, before the styles', () => {
    const first = doc.head.querySelector('script, style')!
    expect(first.tagName).toBe('SCRIPT')
    expect(first.textContent).toBe(themeHeadJs())
  })

  it('opens with the title, the lede, the sample note and every tool, Claude, n8n and Supabase first', () => {
    expect(doc.title).toBe('AI agents and RAG chatbots · Justine Acosta')
    expect(doc.querySelector('h1')!.textContent).toBe('How my AI agents and RAG chatbots work')
    expect(doc.querySelector('.lede')!.textContent).toBe(g.lede)
    expect(doc.querySelector('.sample-note')!.textContent).toBe(g.sample)
    expect([...doc.querySelectorAll('.hero .tool-chip')].map((li) => li.textContent)).toEqual(['Claude', 'n8n', 'Supabase', 'Cal.com', 'Telegram', 'Google Sheets', 'Gmail', 'Stripe'])
    expect(doc.querySelector('link[rel=canonical]')!.getAttribute('href')).toBe('/ai-agents.html')
    expect(doc.querySelector('meta[property="og:title"]')!.getAttribute('content')).toBe(g.title)
  })

  it('has a chip for each of the six sections, each pointing at its section', () => {
    const chips = [...doc.querySelectorAll('nav.toc a')]
    expect(chips.map((a) => a.textContent)).toEqual(g.sections.map((s) => s.chip))
    expect(chips.map((a) => a.getAttribute('href'))).toEqual(g.sections.map((s) => `#${s.id}`))
    for (const s of g.sections) expect(doc.querySelector(`section#${s.id} h2`)!.textContent).toBe(s.title)
  })

  it('shows three tiles at a glance and the four guardrails', () => {
    expect([...doc.querySelectorAll('#glance .tile h3')].map((h) => h.textContent)).toEqual(['RAG chatbots', 'AI agents', 'Your yes'])
    expect([...doc.querySelectorAll('#guardrails .tile-mark')].map((m) => m.textContent)).toEqual(['G1', 'G2', 'G3', 'G4'])
  })

  for (const id of ['rag', 'agent'] as const) {
    const d = g.diagrams[id]
    it(`${id}: draws every step as a button with its description, the gate with a lock and each branch with a diamond`, () => {
      const buttons = [...fig(id).querySelectorAll<HTMLButtonElement>('button.node')]
      expect(buttons.map((b) => b.dataset.node)).toEqual(d.steps.map((s) => s.id))
      for (const s of d.steps) {
        expect(data()[s.id]).toMatchObject({ label: s.label, what: s.what, settings: [] })
        const b = fig(id).querySelector(`button.node[data-node="${s.id}"]`)!
        expect(!!b.querySelector('.badge-lock'), s.id).toBe(s.kind === 'gate')
        expect(!!b.querySelector('.badge-branch'), s.id).toBe(s.kind === 'branch')
      }
    })

    it(`${id}: draws every cable with its index on both path and label, and the legend’s keys`, () => {
      expect(fig(id).querySelectorAll('.edge[data-edge]')).toHaveLength(d.cables.length)
      for (const c of fig(id).querySelectorAll<HTMLElement>('.edge-label')) {
        expect(c.getAttribute('aria-hidden')).toBe('true')
        expect(d.cables[Number(c.dataset.edge)].label).toBe(c.textContent)
      }
      const keys = [...doc.querySelectorAll<HTMLElement>(`#${id} .legend button[data-node]`)]
      expect(keys.map((k) => k.dataset.node)).toEqual(d.legend.map((k) => `key:${id}:${k.id}`))
    })

    it(`${id}: sends balls down the data’s four routes`, () => {
      const routes = JSON.parse(fig(id).dataset.routes!) as { len: number }[]
      expect(routes).toHaveLength(4)
      expect(fig(id).querySelectorAll('.run-dot')).toHaveLength(4)
      expect(fig(id).hasAttribute('data-run')).toBe(true)
    })

    it(`${id}: has a caption bar for Show its route: a status line and a hidden Show all`, () => {
      const bar = fig(id).querySelector('.focus-bar')!
      expect(bar.querySelector('p.focus-text')!.getAttribute('role')).toBe('status')
      const all = bar.querySelector<HTMLButtonElement>('button.focus-clear')!
      expect(all.textContent).toBe('Show all')
      expect(all.hidden).toBe(true)
    })
  }

  it('styles each kind of step with its look', () => {
    const cls = (id: string) => doc.querySelector(`button.node[data-node="${id}"]`)!.className
    expect(cls('docs')).toContain('k-trigger')
    expect(cls('answer')).toContain('k-ai')
    expect(cls('chunk')).toContain('k-action')
    expect(cls('sure')).toContain('k-branch')
    expect(cls('gate')).toContain('k-approve')
    expect(cls('act')).toContain('k-end')
  })

  it('makes every pin its own button after its step, with a logo or an icon and its own panel', () => {
    const pins = [...doc.querySelectorAll<HTMLButtonElement>('button.pin')]
    expect(pins).toHaveLength(3 + 3 + 4 + 6 + 2)
    for (const p of pins) expect(p.closest('button.node')).toBeNull()
    const pdf = doc.querySelector('[data-node="pin:docs:pdf"]')!
    expect(pdf.getAttribute('aria-label')).toBe('Source: PDFs')
    expect(pdf.querySelector('use')).toBeNull()
    expect(doc.querySelector('[data-node="pin:tool:stripe"] use')!.getAttribute('href')).toBe('#logo-stripe')
    expect(data()['pin:docs:pdf']).toMatchObject({ label: 'PDFs', type: 'SOURCE', what: 'Contracts, manuals and other uploaded files.' })
    expect(data()['pin:tool:stripe'].tools).toEqual(['stripe'])
    // A step's pins follow it in the Tab order.
    expect(doc.querySelector('button.node[data-node="docs"]')!.nextElementSibling!.getAttribute('data-node')).toBe('pin:docs:docs')
  })

  it('reads each diagram as a list for screen readers', () => {
    expect(doc.querySelectorAll('#rag ol.steps.sr-only li')).toHaveLength(g.diagrams.rag.steps.length)
    expect(doc.querySelector('#rag ol.steps')!.textContent).toContain('Sure? (A source was found), then Reply with source if yes; Hand to a person if no')
    expect(doc.querySelector('#agent ol.steps')!.textContent).toContain('Use a tool (One call at a time), uses Gmail, Stripe, Supabase, Google Sheets, Cal.com, Web page, then Check the result')
  })

  it('shows the eight builds in two groups, each labelled a sample, with its logos and a route button', () => {
    expect([...doc.querySelectorAll('#builds .builds-kind')].map((h) => h.textContent)).toEqual(['RAG chatbots', 'AI agents'])
    const cards = [...doc.querySelectorAll('#builds .build')]
    expect(cards.map((c) => c.querySelector('h4')!.textContent)).toEqual(g.builds.map((b) => b.name))
    for (const [i, c] of cards.entries()) {
      const b = g.builds[i]
      expect(c.querySelector('.sample')!.textContent).toBe('SAMPLE BUILD')
      expect(c.querySelectorAll('.build-logos svg.logo:not(.logo-dark)')).toHaveLength(b.tools.length)
      const btn = c.querySelector<HTMLButtonElement>('button.route-btn')!
      expect(btn.dataset.build).toBe(b.id)
      expect(btn.getAttribute('aria-pressed')).toBe('false')
      expect(btn.getAttribute('aria-label')).toBe(`Show its route: ${b.name}`)
    }
  })

  it('tells Show its route what to light for each build', () => {
    const agent = layoutDiagram(g.diagrams.agent)
    const rag = layoutDiagram(g.diagrams.rag)
    const edge = (l: typeof agent, from: string, to: string) => l.cables.findIndex((c) => c.from === from && c.to === to)
    const f = focus()
    expect(Object.keys(f)).toEqual(g.builds.map((b) => b.id))
    expect(f.billing).toMatchObject({ diagram: 'agent', name: 'Billing follow-up agent', routes: [0, 1, 2], pins: ['pin:trigger:stripe', 'pin:tool:stripe', 'pin:act:gmail', 'pin:act:sheets'] })
    expect(f.billing.nodes).toContain('gate')
    expect(f.billing.edges).not.toContain(edge(agent, 'needs', 'act'))
    expect(f.report.routes).toEqual([3])
    expect(f.report.nodes).not.toContain('gate')
    expect(f.report.edges).toContain(edge(agent, 'needs', 'act'))
    expect(f.helpdesk.edges).toContain(edge(rag, 'store', 'search'))
    expect(f.helpdesk.nodes).not.toContain('book')
    expect(f.sales.nodes).toContain('book')
  })

  it('ends with the glossary and the footer, both links back going to the top window', () => {
    expect(doc.querySelectorAll('#glossary dt')).toHaveLength(15)
    expect([...doc.querySelectorAll('#glossary dt')].filter((dt) => dt.querySelector('.gl-logo')).map((dt) => dt.textContent)).toEqual(['Claude', 'n8n', 'Supabase'])
    expect(doc.querySelector('a.home')!.getAttribute('target')).toBe('_top')
    const by = doc.querySelector('footer a')!
    expect(by.textContent).toBe('Built by Justine Acosta')
    expect(by.getAttribute('target')).toBe('_top')
  })

  it('runs End-to-End’s client as it is', () => {
    expect(html).toContain(readFileSync('lib/endToEnd/client.js', 'utf8').replace(/\r\n/g, '\n'))
  })

  it('wears Kraft’s tokens, the site’s contrast settings and the shared backdrop', () => {
    for (const theme of ['dark', 'light'] as const) expect(html).toContain(`--accent:${readTokens(theme).accent}`)
    expect(html).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${readContrast().dark.ink2}`)
    expect(doc.body.firstElementChild!.outerHTML).toBe('<div class="page-glow" aria-hidden="true"><div></div></div>')
  })

  it('escapes everything from the data, ids included, and its JSON cannot close its script tag', () => {
    const bad = 'docs"><i>y</i>'
    const rag = g.diagrams.rag
    const evil: Agents = {
      ...g,
      heading: '<img src=x onerror=alert(1)>',
      diagrams: {
        ...g.diagrams,
        rag: {
          ...rag,
          steps: rag.steps.map((s) => (s.id === 'docs' ? { ...s, id: bad, label: '</script><script>alert(1)</script>' } : s)),
          cables: rag.cables.map((c) => (c.from === 'docs' ? { ...c, from: bad } : c)),
          routes: rag.routes.map((r) => ({ ...r, nodes: r.nodes.map((n) => (n === 'docs' ? bad : n)) })),
        },
      },
      builds: g.builds.map((b) => ({ ...b, pins: b.pins.map((p) => p.replace(/^docs:/, `${bad}:`)), name: b.id === 'team' ? '<b>x</b>' : b.name })),
    }
    const out = renderAgents(evil)
    const d = new DOMParser().parseFromString(out, 'text/html')
    expect(d.querySelector('.hero img')).toBeNull()
    expect(d.querySelector('#builds b')).toBeNull()
    expect(out).not.toContain('</script><script>alert(1)')
    expect([...d.querySelectorAll('i')].filter((el) => el.textContent === 'y')).toEqual([])
    expect(JSON.parse(d.getElementById('graph-nodes')!.textContent!)[bad].label).toBe('</script><script>alert(1)</script>')
  })

  it('renders every icon the page names', () => {
    const steps = [...g.diagrams.rag.steps, ...g.diagrams.agent.steps]
    for (const name of [...g.glance, ...g.guardrails, ...steps].map((x) => x.icon)) expect(iconSvg(name), name).toMatch(/^<svg /)
    for (const p of steps.flatMap((s) => s.pins ?? [])) if (p.icon) expect(iconSvg(p.icon), p.icon).toMatch(/^<svg /)
  })

  it('stays one self-contained file with no GoHighLevel in it', () => {
    expect(html.length).toBeLessThan(300_000)
    expect(html).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
    const external = [...html.matchAll(/(?:src|href)="(https?:[^"]+)"/g)].map((m) => new URL(m[1]).host)
    expect(new Set(external)).toEqual(new Set(['fonts.googleapis.com', 'fonts.gstatic.com']))
  })
})

describe('public/ai-agents.html', () => {
  it('is up to date with its data (run npm run agents-page after any change)', () => {
    expect(readFileSync('public/ai-agents.html', 'utf8').replace(/\r\n/g, '\n')).toBe(renderAgents())
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/agents-render.test.ts`
Expected: FAIL. `@/lib/agents/render` cannot be resolved.

- [ ] **Step 3: Write the styles** — `lib/agents/styles.ts`:

```ts
import { afCss } from '../agenticFramework/styles.ts'
import type { Themes } from '../buildPlan/styles.ts'

/**
 * The agents page’s CSS (spec 2026-10-01-agents-page §4): the Agentic
 * Framework’s look (imported as it is, never edited), plus the sample note,
 * logo pins, branch diamonds, the dashed index, Show its route’s lighting
 * and caption bar, and the build cards.
 */
export function agentsCss(themes: Themes): string {
  return `${afCss(themes)}
.sample-note{display:flex;align-items:center;gap:8px;max-width:62ch;font-size:.875rem;color:var(--ink3)}
.sample-note svg{flex:none;color:var(--accent)}
.legend .line-index{border-top:2px dashed var(--ink3)}
.legend .badge-branch{position:static;display:inline-block;margin:0 3px}
.edge.index{stroke:var(--ink3);stroke-dasharray:3 5}
.badge-branch{position:absolute;right:-6px;bottom:-6px;width:12px;height:12px;transform:rotate(45deg);border:1.5px solid var(--k,var(--accent));background:var(--s0)}
.pin{border-color:var(--b2);background:var(--s0);color:var(--ink2)}
.pin:hover,.pin[aria-expanded=true]{border-color:var(--accent);background:var(--s2);color:var(--accent)}
.pin-sample{border-color:var(--b2)}
.canvas :is(.node,.pin,.edge,.edge-label){transition:opacity .3s ease}
.canvas[data-focus] :is(.node,.pin,.edge-label):not(.on-route){opacity:.28}
.canvas[data-focus] .edge:not(.on-route){opacity:.2}
.canvas[data-focus] .edge.on-route{stroke:var(--accent)}
.canvas[data-focus] .node.on-route .node-card{border-color:var(--accent)}
.focus-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;margin:0 0 12px;padding:10px 14px;border-radius:12px;border:1px solid var(--washB);background:var(--wash)}
.focus-bar:not(.on){position:absolute;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip-path:inset(50%);border:0}
.focus-text{flex:1 1 260px;min-width:0;margin:0;font-size:.875rem;color:var(--ink)}
.focus-clear,.route-btn{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;border:1px solid var(--b2);background:var(--s0);font:inherit;font-size:.8125rem;font-weight:500;color:var(--ink);cursor:pointer}
.focus-clear:hover,.route-btn:hover{border-color:var(--accent);color:var(--accent)}
.route-btn{align-self:flex-start;margin-top:auto}
.route-btn[aria-pressed=true]{border-color:var(--accent);background:var(--accent);color:var(--onAccent)}
.builds-kind{font-family:var(--mono);font-size:.6875rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--ink3)}
.build h4{font-size:1rem;letter-spacing:-.01em}
.sample{font-family:var(--mono);font-size:.5625rem;letter-spacing:.14em;color:var(--accent)}
.build-logos{display:flex;flex-wrap:wrap;gap:6px}
@media (prefers-reduced-motion:reduce){.canvas :is(.node,.pin,.edge,.edge-label){transition:none}}
:root[data-a11y-motion=true] .canvas :is(.node,.pin,.edge,.edge-label){transition:none}
@media print{.route-btn,.focus-bar{display:none}}
`
}
```

- [ ] **Step 4: Write the render** — `lib/agents/render.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { agents as A, KIND_TYPES, type Agents, type Build, type Diagram, type DiagramId, type LegendId, type SectionId, type Step, type StepKind, type Tile } from '../../data/agents.ts'
import { esc } from '../buildPlan/render.ts'
import type { Themes } from '../buildPlan/styles.ts'
import { iconSvg } from '../endToEnd/icons.ts'
import { livelyCss } from '../brand/lively.ts'
import { backdropHtml, contourJs, glossaryLogo, logo, logoBadges, logoSheet, revealJs, themeHeadJs, toolByName, toolStrip, toolTemplates, toolsUsed } from '../brand/render.ts'
import { TOOLS, type ToolId } from '../brand/tools.ts'
import { readContrast, readTokens } from '../tokens.ts'
import { layoutDiagram, type DiagramLayout } from './layout.ts'
import { agentsCss } from './styles.ts'

/** Where the page is served (public/ai-agents.html). */
export const PAGE_PATH = '/ai-agents.html'

/** What each clickable item's panel shows. `settings` stays empty; the panel hides it. */
type NodeIndex = Record<string, { label: string; type: string; what: string; settings: [string, string][]; tools?: ToolId[] }>
/** What Show its route lights for one build. lib/agents/focus.js reads it. */
export type BuildFocus = { diagram: DiagramId; name: string; caption: string; routes: number[]; nodes: string[]; edges: number[]; pins: string[] }

/** JSON inside <script>: no "<" survives, so nothing in it can close the tag. */
const safeJson = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')
/** Each kind wears one of the build plan's step looks; a plain step Claude runs wears the AI look. */
const LOOK: Partial<Record<StepKind, string>> = { start: 'trigger', branch: 'branch', gate: 'approve', end: 'end' }
const look = (s: Step) => LOOK[s.kind] ?? (s.tools?.includes('claude') ? 'ai' : 'action')
const LOCK = () => `<span class="badge-lock">${iconSvg('LockSimple', 12)}</span>`
const DIAMOND = '<span class="badge-branch" aria-hidden="true"></span>'
const SAMPLE: Record<LegendId, () => string> = {
  cable: () => '<span class="line"></span>',
  signal: () => '<span class="line line-signal"></span>',
  loop: () => '<span class="line line-loop"></span>',
  index: () => '<span class="line line-index"></span>',
  branch: () => DIAMOND,
  gate: LOCK,
  pin: () => '<span class="pin-sample"></span>',
}
const NOUN: Record<DiagramId, string> = { rag: 'the RAG diagram', agent: 'the agent diagram' }
/** "SOURCE" → "Source". */
const title = (t: string) => t[0] + t.slice(1).toLowerCase()

function section(g: Agents, id: SectionId, body: string) {
  const s = g.sections.find((x) => x.id === id)!
  return `<section id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h"><header class="shead"><span class="kicker">${esc(s.kicker)}</span><h2 id="${esc(s.id)}-h">${esc(s.title)}</h2><p>${esc(s.blurb)}</p></header>${body}</section>`
}

const tiles = (list: Tile[]) =>
  `<ul class="tiles">${list
    .map((c) => `<li class="tile"><span class="tile-top"><span class="tile-icon" aria-hidden="true">${iconSvg(c.icon, 18)}</span><span class="tile-mark">${esc(c.mark)}</span></span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></li>`)
    .join('')}</ul>`

function hero(g: Agents, used: ToolId[]) {
  return `<header class="hero"><a class="home" href="/" target="_top">← ${esc(g.home)}</a><span class="kicker">${esc(g.kicker)}</span><h1>${esc(g.heading)}</h1><p class="lede">${esc(g.lede)}</p><p class="sample-note"><span aria-hidden="true">${iconSvg('Info', 16)}</span><span>${esc(g.sample)}</span></p>${toolStrip(used)}</header>`
}

/** One live diagram: legend, then a frame with its caption bar, cables, labels, ball templates, steps and their pins. */
function diagram(g: Agents, d: Diagram, l: DiagramLayout, index: NodeIndex) {
  const { steps, cables, legend, caption } = d
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const s of steps) index[s.id] = { label: s.label, type: KIND_TYPES[s.kind], what: s.what, settings: [], ...(s.tools ? { tools: s.tools } : {}) }
  const keys = legend
    .map((k) => {
      const key = `key:${d.id}:${k.id}`
      index[key] = { label: k.label, type: 'LEGEND', what: k.what, settings: [] }
      return `<li><button type="button" class="key" data-node="${esc(key)}" aria-haspopup="dialog" aria-expanded="false"><span aria-hidden="true">${SAMPLE[k.id]()}</span>${esc(k.label)}</button></li>`
    })
    .join('')
  const entered = new Set(cables.map((c) => c.to))
  const left = new Set(cables.map((c) => c.from))
  const paths = l.cables.map((c, i) => `<path class="edge${c.kind === 'flow' ? '' : ` ${c.kind}`}" data-edge="${i}" d="${c.d}"/>`).join('')
  const labels = l.cables
    .map((c, i) => (c.label ? `<span class="edge-label" data-edge="${i}" aria-hidden="true" style="left:${Math.round(c.mid[0])}px;top:${Math.round(c.mid[1])}px">${esc(c.label)}</span>` : ''))
    .join('')
  // One hidden template ball per route; the client sends copies down random routes.
  const balls = l.routes.map((r, i) => `<span class="run-dot" aria-hidden="true" data-route="${i}" style="offset-path:path('${r.run}')"></span>`).join('')
  const timing = l.routes.map((r) => ({ len: r.length, stops: r.stops, spans: r.spans }))
  // A pin sits beside its step, never inside it (a button may not hold a
  // button), and straight after it, so Tab reaches a step and then its pins.
  const pins = (s: Step) =>
    (s.pins ?? [])
      .map((p) => {
        const key = `pin:${s.id}:${p.id}`
        index[key] = { label: p.name, type: s.pinType ?? 'PIN', what: p.what, settings: [], ...(p.tool ? { tools: [p.tool] } : {}) }
        const at = l.pins[`${s.id}:${p.id}`]
        return `<button type="button" class="pin" style="left:${at.x}px;top:${at.y}px" data-node="${esc(key)}" aria-label="${esc(title(s.pinType ?? 'PIN'))}: ${esc(p.name)}" aria-haspopup="dialog" aria-expanded="false">${p.tool ? logo(p.tool, 14) : iconSvg(p.icon!, 13)}</button>`
      })
      .join('')
  const buttons = steps
    .map((s) => {
      const at = l.nodes[s.id]
      return `<button type="button" class="node k-${look(s)}" style="left:${at.x}px;top:${at.y}px" data-node="${esc(s.id)}" data-in="${entered.has(s.id) ? 1 : 0}" data-out="${left.has(s.id) ? 1 : 0}" aria-haspopup="dialog" aria-expanded="false"><span class="node-card" aria-hidden="true">${iconSvg(s.icon)}${s.kind === 'gate' ? LOCK() : ''}${s.kind === 'branch' ? DIAMOND : ''}${logoBadges(s.tools)}</span><span class="node-label">${esc(s.label)}</span><span class="node-sub">${esc(s.sub)}</span></button>${pins(s)}`
    })
    .join('')
  const read = steps
    .map((s) => {
      const uses = (s.pins ?? []).map((p) => p.name)
      const next = cables.filter((c) => c.from === s.id && c.kind !== 'index').map((c) => `${byId.get(c.to)!.label}${c.label ? ` if ${c.label}` : ''}`)
      return `<li>${esc(s.label)} (${esc(s.sub)})${uses.length ? `, uses ${esc(uses.join(', '))}` : ''}${next.length ? `, then ${esc(next.join('; '))}` : ''}</li>`
    })
    .join('')
  return `<ul class="legend" aria-label="How to read ${NOUN[d.id]}">${keys}</ul><figure class="canvas" data-diagram="${d.id}" data-run data-routes="${esc(JSON.stringify(timing))}"><figcaption><span>${esc(caption)}</span><span class="pan"><span class="pan-hint" aria-hidden="true">Drag to explore</span><button type="button" class="pan-btn" data-pan="-1" aria-label="Scroll ${NOUN[d.id]} left">‹</button><button type="button" class="pan-btn" data-pan="1" aria-label="Scroll ${NOUN[d.id]} right">›</button></span></figcaption><div class="focus-bar"><p class="focus-text" role="status"></p><button type="button" class="focus-clear" hidden>${esc(g.buildText.showAll)}</button></div><div class="canvas-scroll" tabindex="0" role="group" aria-label="${esc(caption)}, scrolls sideways"><div class="stage" style="width:${l.width}px;height:${l.height}px"><svg class="edges" width="${l.width}" height="${l.height}" viewBox="0 0 ${l.width} ${l.height}" aria-hidden="true">${paths}</svg>${labels}${balls}${buttons}</div></div><ol class="steps sr-only">${read}</ol></figure>`
}

/** The steps, cables and pins one build lights: those on its routes, plus the index when both its ends are lit. */
function focusFor(b: Build, d: Diagram, l: DiagramLayout): BuildFocus {
  const routes = b.routes.map((id) => l.routes.findIndex((r) => r.id === id))
  if (routes.includes(-1)) throw new Error(`Build ${b.id} names a route its diagram does not have`)
  const nodes = [...new Set(routes.flatMap((i) => l.routes[i].nodes))]
  const edges = new Set(routes.flatMap((i) => l.routes[i].spans.map(([k]) => k)))
  l.cables.forEach((c, k) => {
    if (c.kind === 'index' && nodes.includes(c.from) && nodes.includes(c.to)) edges.add(k)
  })
  return { diagram: d.id, name: b.name, caption: b.caption, routes, nodes, edges: [...edges].sort((x, y) => x - y), pins: b.pins.map((p) => `pin:${p}`) }
}

function builds(g: Agents) {
  const t = g.buildText
  return (['rag', 'agent'] as const)
    .map(
      (kind) =>
        `<h3 class="builds-kind">${esc(t.groups[kind])}</h3><ul class="tiles builds">${g.builds
          .filter((b) => b.kind === kind)
          .map(
            (b) =>
              `<li class="tile build" id="build-${esc(b.id)}"><span class="tile-top"><span class="sample">${esc(t.sample)}</span><span class="tile-mark">${esc(t.kinds[kind])}</span></span><h4>${esc(b.name)}</h4><p>${esc(b.line)}</p><span class="build-logos" aria-hidden="true">${b.tools.map((id) => logo(id, 18)).join('')}</span><span class="sr-only">${esc(t.tools)}: ${esc(b.tools.map((id) => TOOLS[id].name).join(', '))}</span><button type="button" class="route-btn" data-build="${esc(b.id)}" aria-pressed="false" aria-label="${esc(t.show)}: ${esc(b.name)}"><span aria-hidden="true">${iconSvg('Path', 14)}</span>${esc(t.show)}</button></li>`,
          )
          .join('')}</ul>`,
    )
    .join('')
}

const glossary = (g: Agents) => `<dl class="gl">${g.glossary.map(([term, m]) => `<div><dt>${glossaryLogo(term)}${esc(term)}</dt><dd>${esc(m)}</dd></div>`).join('')}</dl>`

/** The whole AI agents and RAG chatbots page (spec §3–4): one self-contained HTML file. */
export function renderAgents(g: Agents = A, themes: Themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }): string {
  const index: NodeIndex = {}
  const steps = [...g.diagrams.rag.steps, ...g.diagrams.agent.steps]
  const used = toolsUsed([
    g.heroTools,
    ...steps.map((s) => s.tools),
    ...steps.flatMap((s) => (s.pins ?? []).map((p) => (p.tool ? [p.tool] : undefined))),
    ...g.builds.map((b) => b.tools),
    ...g.glossary.map(([t]) => {
      const id = toolByName(t)
      return id ? [id] : undefined
    }),
  ])
  const laid = { rag: layoutDiagram(g.diagrams.rag), agent: layoutDiagram(g.diagrams.agent) }
  const focus = Object.fromEntries(g.builds.map((b) => [b.id, focusFor(b, g.diagrams[b.kind], laid[b.kind])]))
  const body = [
    section(g, 'glance', tiles(g.glance)),
    section(g, 'rag', diagram(g, g.diagrams.rag, laid.rag, index)),
    section(g, 'agent', diagram(g, g.diagrams.agent, laid.agent, index)),
    section(g, 'builds', builds(g)),
    section(g, 'guardrails', tiles(g.guardrails)),
    section(g, 'glossary', glossary(g)),
  ].join('\n')
  // End-to-End's client, as it is (read-only). Git may check it out with CRLF on Windows.
  const client = readFileSync(join(process.cwd(), 'lib/endToEnd/client.js'), 'utf8').replace(/\r\n/g, '\n')
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
<style>${agentsCss(themes)}${livelyCss()}</style>
</head>
<body>
${backdropHtml()}${logoSheet(used)}
<nav class="toc" aria-label="Sections">${g.sections.map((s) => `<a href="#${esc(s.id)}">${esc(s.chip)}</a>`).join('')}</nav>
<main class="page">
${hero(g, used)}
${body}
</main>
<footer class="foot"><span>${esc(g.footer.note)}</span><a href="/" target="_top">${esc(g.footer.by)}</a></footer>
<div id="node-panel" class="panel" popover role="dialog" aria-labelledby="panel-label"><span class="ptools" data-p="tools" hidden></span><span class="ptype" data-p="type"></span><h3 id="panel-label" data-p="label"></h3><p class="pwhat" data-p="what"></p><dl></dl><button type="button" class="panel-close" data-p="close" aria-label="Close details">×</button></div>
${toolTemplates(used)}
<script type="application/json" id="graph-nodes">${safeJson(index)}</script>
<script type="application/json" id="agent-builds">${safeJson(focus)}</script>
<script>${client}</script>
<script>${contourJs()}</script>
<script>${revealJs()}</script>
</body>
</html>
`
}
```

*Note:* the hero strip's order comes from `toolsUsed`, which keeps first appearance. The lists go in this order:
1. The hero tools: Claude, n8n, Supabase.
2. Every step's own tools: Cal.com (Offer a call), Telegram (Your yes).
3. Every pin's tool: Google Sheets (a docs pin), Gmail (an ask pin), Stripe (a trigger pin).

The render test pins that order.

- [ ] **Step 5: Write the generator** — `scripts/make-agents.ts`:

```ts
// Builds public/ai-agents.html from data/agents.ts (spec 2026-10-01-agents-page).
// Run after changing the page's data, layout, styles or focus script, or End-to-End's client: npm run agents-page
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderAgents } from '../lib/agents/render.ts'

const html = renderAgents()
writeFileSync(join(process.cwd(), 'public', 'ai-agents.html'), html)
console.log(`public/ai-agents.html: ${(html.length / 1024).toFixed(1)} KB`)
```

- [ ] **Step 6: Generate the page**

Run: `node scripts/make-agents.ts`
Expected: prints `public/ai-agents.html: <n> KB`, with n under 290.

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run tests/agents-render.test.ts tests/no-raw-colors.test.ts`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add lib/agents/styles.ts lib/agents/render.ts scripts/make-agents.ts public/ai-agents.html tests/agents-render.test.ts
git commit -m "feat: the agents page renders: two live diagrams with pins, eight sample builds, guardrails and a glossary

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Show its route, the shared client's hook, the screenshot and browser tests

**Files:**
- Create: `lib/agents/focus.js`, `scripts/shoot-agents.mjs`, `e2e/agents.spec.ts`, `public/shots/ai-agents.jpeg` (generated)
- Modify:
  - `lib/endToEnd/client.js:184-192` (the `launch` function)
  - `lib/agents/render.ts` (inline focus.js after the client)
  - `package.json` (scripts)
  - `tests/agents-render.test.ts` (one new test)
- Regenerate: `public/ai-agents.html`, `public/end-to-end.html`, `public/agentic-framework.html`

**Interfaces:**
- Consumes: the page contract from Task 3 (figure attributes, `.focus-bar`, `button.route-btn[data-build]`, `#agent-builds`).
- Produces:
  - On each figure: `data-only="i,j"` (read by the client) and `data-focus="<buildId>"` (read by CSS).
  - On each lit node, edge, edge label and pin: the class `.on-route`.
  - On the focus bar: the class `.on`.

- [ ] **Step 1: Write the failing browser test** — `e2e/agents.spec.ts`:

```ts
import { expect, test, type Locator, type Page } from '@playwright/test'

const PAGE = '/ai-agents.html'
const fig = (page: Page, id: 'rag' | 'agent') => page.locator(`figure[data-diagram="${id}"]`)
const opacity = (l: Locator) => l.evaluate((el) => Number(getComputedStyle(el).opacity))
const route = (page: Page, name: string) => page.getByRole('button', { name: `Show its route: ${name}` })

test('reads top to bottom: the header, six chips, six sections, eight builds and the glossary', async ({ page }) => {
  await page.goto(PAGE)
  await expect(page).toHaveTitle('AI agents and RAG chatbots · Justine Acosta')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('How my AI agents and RAG chatbots work')
  await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link')).toHaveCount(6)
  await expect(page.locator('main > section')).toHaveCount(6)
  await expect(page.getByRole('button', { name: /^Show its route: / })).toHaveCount(8)
  await expect(page.locator('#glossary dt')).toHaveCount(15)
})

test('loads and runs with no page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(PAGE)
  await page.locator('[data-node="search"]').click()
  await page.keyboard.press('Escape')
  await route(page, 'Inbox triage agent').click()
  await page.waitForTimeout(1500)
  expect(errors).toEqual([])
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

test('a step, a pin and a legend key each explain themselves; Escape closes and focus goes back', async ({ page }) => {
  await page.goto(`${PAGE}#rag`)
  for (const [sel, name, type] of [
    ['[data-node="search"]', 'Search', 'STEP'],
    ['[data-node="pin:docs:pdf"]', 'PDFs', 'SOURCE'],
    ['[data-node="key:rag:index"]', 'Index', 'LEGEND'],
  ] as const) {
    const btn = page.locator(sel)
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
    const panel = page.getByRole('dialog', { name })
    await expect(panel.locator('[data-p=type]')).toHaveText(type)
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(btn).toBeFocused()
  }
})

test('Show its route lights one build’s path, dims the rest, and Show all clears it', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Billing follow-up agent')
  await btn.click()
  const agent = fig(page, 'agent')
  await expect(agent).toHaveAttribute('data-focus', 'billing')
  await expect(fig(page, 'rag')).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  await expect(agent.locator('.focus-text')).toHaveText(/^Billing follow-up agent: Stripe: payment failed/)
  const showAll = agent.getByRole('button', { name: 'Show all' })
  await expect(showAll).toBeFocused()
  await expect(agent).toBeInViewport()
  await expect(agent.locator('[data-node="gate"]')).toHaveClass(/\bon-route\b/)
  await expect(agent.locator('[data-node="pin:trigger:stripe"]')).toHaveClass(/\bon-route\b/)
  const off = agent.locator('[data-node="pin:trigger:gmail"]')
  await expect(off).not.toHaveClass(/\bon-route\b/)
  await expect.poll(() => opacity(off)).toBeLessThan(0.5)
  await showAll.click()
  await expect(agent).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
  await expect(btn).toBeFocused()
  await expect.poll(() => opacity(off)).toBe(1)
})

test('pressing the same build again clears its route', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Inbox triage agent')
  await btn.click()
  await expect(fig(page, 'agent')).toHaveAttribute('data-focus', 'inbox')
  await btn.click()
  await expect(fig(page, 'agent')).not.toHaveAttribute('data-focus')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
})

test('works from the keyboard: Enter shows a route, Enter on Show all goes back to the build', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  const btn = route(page, 'Lead research agent')
  await btn.focus()
  await page.keyboard.press('Enter')
  const showAll = fig(page, 'agent').getByRole('button', { name: 'Show all' })
  await expect(showAll).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(btn).toBeFocused()
  await expect(fig(page, 'agent')).not.toHaveAttribute('data-focus')
})

test('the weekly report skips the gate: internal work needs no yes', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Weekly report agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('[data-node="gate"]')).not.toHaveClass(/\bon-route\b/)
  await expect(agent.locator('[data-node="act"]')).toHaveClass(/\bon-route\b/)
  await expect(agent.locator('.edge-label', { hasText: 'internal only' })).toHaveClass(/\bon-route\b/)
})

test('a RAG build lights the index its search reads; another build replaces it, in either diagram', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Help-desk RAG bot').click()
  const rag = fig(page, 'rag')
  await expect(rag.locator('.edge.index')).toHaveClass(/\bon-route\b/)
  await route(page, 'Document Q&A bot').click()
  await expect(rag).toHaveAttribute('data-focus', 'docqa')
  await expect(rag.locator('[data-node="pin:docs:pdf"]')).toHaveClass(/\bon-route\b/)
  await expect(rag.locator('[data-node="pin:docs:docs"]')).not.toHaveClass(/\bon-route\b/)
  await expect(route(page, 'Help-desk RAG bot')).toHaveAttribute('aria-pressed', 'false')
  await route(page, 'Inbox triage agent').click()
  await expect(rag).not.toHaveAttribute('data-focus')
  await expect(fig(page, 'agent')).toHaveAttribute('data-focus', 'inbox')
  await expect(route(page, 'Document Q&A bot')).toHaveAttribute('aria-pressed', 'false')
})

test('Escape closes the details panel first, then the route', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Help-desk RAG bot').click()
  const rag = fig(page, 'rag')
  await rag.locator('[data-node="answer"]').click()
  const panel = page.getByRole('dialog', { name: 'Claude answers' })
  await expect(panel).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(rag).toHaveAttribute('data-focus', 'helpdesk')
  await page.keyboard.press('Escape')
  await expect(rag).not.toHaveAttribute('data-focus')
  await expect(route(page, 'Help-desk RAG bot')).toBeFocused()
})

test('while a build is shown, balls run only its routes', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Weekly report agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('.run-ball').first()).toBeAttached({ timeout: 10_000 })
  for (let i = 0; i < 8; i++) {
    const routes = await agent.locator('.run-ball').evaluateAll((els) => els.map((e) => e.getAttribute('data-route')))
    expect(routes.every((r) => r === '3'), routes.join(',')).toBe(true)
    await page.waitForTimeout(250)
  }
})

test('under reduced motion there are no balls, and a route still lights and jumps into view', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' })
  const page = await ctx.newPage()
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Lead research agent').click()
  const agent = fig(page, 'agent')
  await expect(agent.locator('[data-node="pin:tool:web"]')).toHaveClass(/\bon-route\b/)
  await expect(agent).toBeInViewport()
  await page.waitForTimeout(2000)
  await expect(page.locator('.run-ball')).toHaveCount(0)
  await ctx.close()
})

test('print leaves out the route buttons and the caption bar', async ({ page }) => {
  await page.goto(`${PAGE}#builds`)
  await route(page, 'Inbox triage agent').click()
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.route-btn').first()).toBeHidden()
  await expect(fig(page, 'agent').locator('.focus-bar')).toBeHidden()
})

test('every step’s name and sub-line sit on one line', async ({ page }) => {
  await page.goto(PAGE)
  for (const el of await page.locator('.node-label, .node-sub').all()) {
    const lines = await el.evaluate((e) => {
      const r = document.createRange()
      r.selectNodeContents(e)
      return new Set([...r.getClientRects()].map((b) => Math.round(b.top))).size
    })
    expect(lines, (await el.textContent())!).toBe(1)
  }
})

test('pins are big enough to tap (24 px) and never overlap', async ({ page }) => {
  await page.goto(`${PAGE}#agent`)
  const boxes = []
  for (const pin of await page.locator('.pin').all()) {
    const b = (await pin.boundingBox())!
    expect(b.width).toBeGreaterThanOrEqual(24)
    expect(b.height).toBeGreaterThanOrEqual(24)
    boxes.push(b)
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const [a, b] = [boxes[i], boxes[j]]
      expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, `${i} × ${j}`).toBe(false)
    }
})

test('at phone width the page never scrolls sideways; both diagrams pan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  for (const id of ['rag', 'agent'] as const)
    expect(await fig(page, id).locator('.canvas-scroll').evaluate((el) => el.scrollWidth > el.clientWidth), id).toBe(true)
  for (const id of ['glance', 'builds', 'guardrails']) {
    const box = (await page.locator(`#${id}`).boundingBox())!
    expect(box.x + box.width, id).toBeLessThanOrEqual(390)
  }
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test e2e/agents.spec.ts --project=desktop`
Expected: the first four tests pass, since the page and its panel already work. Every Show its route test FAILS, because nothing sets `data-focus` yet. The print and phone tests may pass already.

- [ ] **Step 3: Add the shared client's hook** in `lib/endToEnd/client.js`. In `launch`, replace

```js
    if (r.balls.length >= MAX || !r.routes.length) return
    const i = Math.floor(Math.random() * r.routes.length)
```

with

```js
    if (r.balls.length >= MAX || !r.routes.length) return
    // A page may limit the balls to some routes (data-only="0,2"): the agents page's Show its route.
    const only = r.fig.dataset.only ? r.fig.dataset.only.split(',').map(Number) : null
    const pool = only ?? r.routes.map((_, k) => k)
    const i = pool[Math.floor(Math.random() * pool.length)]
```

- [ ] **Step 4: Write Show its route** — `lib/agents/focus.js`:

```js
// The agents page's Show its route (spec 2026-10-01-agents-page §4.3),
// inlined by lib/agents/render.ts after End-to-End's client. One build at a
// time: its diagram lights the build's steps, cables and pins, dims the rest,
// and sends balls down its routes only (data-only, read by the client). Plain
// browser JS, no libraries.
;(() => {
  const builds = JSON.parse(document.getElementById('agent-builds').textContent)
  const root = document.documentElement
  const reduced = () => root.dataset.a11yMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches
  const panel = document.getElementById('node-panel')
  let current = null

  const clear = (focusBack) => {
    if (!current) return
    const { fig, btn } = current
    current = null
    fig.removeAttribute('data-focus')
    fig.removeAttribute('data-only')
    for (const el of fig.querySelectorAll('.on-route')) el.classList.remove('on-route')
    const bar = fig.querySelector('.focus-bar')
    bar.classList.remove('on')
    bar.querySelector('.focus-text').textContent = ''
    bar.querySelector('.focus-clear').hidden = true
    btn.setAttribute('aria-pressed', 'false')
    if (focusBack) btn.focus({ preventScroll: true })
  }

  const show = (btn) => {
    const b = builds[btn.dataset.build]
    if (!b) return
    clear(false)
    const fig = document.querySelector(`figure[data-diagram="${b.diagram}"]`)
    fig.setAttribute('data-focus', btn.dataset.build)
    fig.setAttribute('data-only', b.routes.join(','))
    const mark = (sel) => {
      for (const el of fig.querySelectorAll(sel)) el.classList.add('on-route')
    }
    for (const n of b.nodes) mark(`.node[data-node="${CSS.escape(n)}"]`)
    for (const e of b.edges) mark(`[data-edge="${e}"]`)
    for (const p of b.pins) mark(`.pin[data-node="${CSS.escape(p)}"]`)
    // Balls already on other routes finish now, so only this build's routes run.
    for (const ball of fig.querySelectorAll('.run-ball'))
      if (!b.routes.includes(Number(ball.dataset.route))) for (const a of ball.getAnimations()) a.finish()
    const bar = fig.querySelector('.focus-bar')
    bar.classList.add('on')
    bar.querySelector('.focus-text').textContent = `${b.name}: ${b.caption}`
    const all = bar.querySelector('.focus-clear')
    all.hidden = false
    btn.setAttribute('aria-pressed', 'true')
    current = { fig, btn }
    fig.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' })
    all.focus({ preventScroll: true })
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-build]')
    if (btn) {
      if (current && current.btn === btn) clear(true)
      else show(btn)
      return
    }
    if (e.target.closest('.focus-clear')) clear(true)
  })

  // Escape closes the innermost thing first: the details panel (the page
  // client's), then a route, then (inside the site) the site's window. This
  // runs before the client's listener, which leaves a handled Escape alone.
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || !current || panel.matches(':popover-open')) return
      e.preventDefault()
      clear(true)
    },
    true,
  )
})()
```

- [ ] **Step 5: Inline it in the page.** In `lib/agents/render.ts`, read it beside the client:

```ts
  // Show its route. Git may check it out with CRLF on Windows.
  const focusJs = readFileSync(join(process.cwd(), 'lib/agents/focus.js'), 'utf8').replace(/\r\n/g, '\n')
```

Then put `<script>${focusJs}</script>` on the line straight after `<script>${client}</script>`.

Add this test to `tests/agents-render.test.ts`, inside `describe('renderAgents')`:

```ts
  it('runs Show its route straight after the client', () => {
    const scripts = [...doc.querySelectorAll('script:not([type])')].map((s) => s.textContent!)
    const at = scripts.findIndex((s) => s.includes("getElementById('agent-builds')"))
    expect(at).toBeGreaterThan(0)
    expect(scripts[at - 1]).toBe(readFileSync('lib/endToEnd/client.js', 'utf8').replace(/\r\n/g, '\n'))
  })
```

- [ ] **Step 6: Add the screenshot script** — `scripts/shoot-agents.mjs`:

```js
// Photographs public/ai-agents.html for the Projects fan on Home
// (data/projects.ts BUILDS). Part of: npm run agents-page
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const out = join(process.cwd(), 'public', 'shots')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch()
// 1280×800 (16:10), saved at 0.5×: 640×400. Light, the page's default; reduced motion keeps the contour and balls out.
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, colorScheme: 'light', reducedMotion: 'reduce' })
await page.goto(pathToFileURL(join(process.cwd(), 'public', 'ai-agents.html')).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: join(out, 'ai-agents.jpeg'), type: 'jpeg', quality: 82 })
await browser.close()
```

In `package.json` `scripts`, after `"af-page"`, add `"agents-page": "node scripts/make-agents.ts && node scripts/shoot-agents.mjs"`. Add a comma after the `af-page` line.

- [ ] **Step 7: Regenerate all three pages that inline the client, and shoot the new one**

Run: `node scripts/make-e2e.ts && node scripts/make-af.ts && npm run agents-page`
Expected: three `public/*.html: <n> KB` lines. `public/shots/ai-agents.jpeg` is written.

- [ ] **Step 8: Run the unit and browser tests**

Run: `npx vitest run tests/agents-render.test.ts tests/endToEnd-render.test.ts tests/agenticFramework-render.test.ts`
Expected: PASS. All three freshness tests are green.

Run: `npx playwright test e2e/agents.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts --project=desktop`
Expected: PASS. If "while a build is shown, balls run only its routes" sees a stray ball, check that `show()` finishes off-route balls *before* any new launch. Don't loosen the test.

- [ ] **Step 9: Commit**

```bash
git add lib/endToEnd/client.js lib/agents/focus.js lib/agents/render.ts scripts/shoot-agents.mjs package.json public/ai-agents.html public/end-to-end.html public/agentic-framework.html public/shots/ai-agents.jpeg e2e/agents.spec.ts tests/agents-render.test.ts
git commit -m "feat: Show its route lights one build's path and limits the balls to it; the shared client can be told which routes to run

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The board card, its window and the site wiring

**Files:**
- Create: `components/projects/AgentsPreview.tsx`
- Modify:
  - `data/projects.ts` (imports, types, the `agents` card, `live`/`internal`/`builtWith`, the BUILDS entry, the top comment)
  - `components/projects/Board.tsx:132-152` (the agents card)
  - `components/projects/AgentsView.tsx` (rewrite)
  - `components/projects/Window.tsx` (remove `WindowHero` and `WindowSection`)
  - `app/globals.css` (the preview's animation)
  - `scripts/brand-icons.mjs` (gmail, telegram, caldotcom)
  - `lib/seo.ts` (`STATIC_PAGES`)
  - `tests/projects.test.tsx`, `tests/seo.test.ts`, `e2e/projects.spec.ts`, `e2e/seo.spec.ts`
- Delete: `data/projectDocs.ts`
- Generate: `public/icons/brands/gmail.svg`, `telegram.svg`, `caldotcom.svg`

**Interfaces:**
- Consumes: `/ai-agents.html` and `/shots/ai-agents.jpeg` (Tasks 3–4); `brandIcon(slug)` and `type Brand` from `data/stack.ts`.
- Produces `projects.cards.agents` with this shape: `{ title, icon, cue, cta, body, page, frameTitle, counts: Chip[], logos: Brand[], preview: { question, search, answer, source, run: [string, string], approve, buttons: [string, string] } }`.

- [ ] **Step 1: Write the failing unit tests.** In `tests/projects.test.tsx`:
  - Remove the `import { agentsView } from '@/data/projectDocs'` line.
  - Remove the two `agentsView` lines from "keeps Kraft's roster…", and rename that test to `'keeps the reel and the sites'`.
  - Replace the test `'marks which systems are live and which are internal'` with:

```ts
  it('opens the AI agents page in its window, with a new-tab link', () => {
    window.history.replaceState(null, '', '/projects#ai-agents')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
    const frame = within(view).getByTitle('AI agents and RAG chatbots page')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/ai-agents.html')
    expect(within(view).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/ai-agents.html')
  })

  it('shows a real 16:10 screenshot of the AI agents page on Home', () => {
    const shot = BUILDS.find((b) => b.view === 'ai-agents')!.shot
    expect(shot).toBe('/shots/ai-agents.jpeg')
    expect(jpegSize(readFileSync(`public${shot}`))).toEqual({ width: 640, height: 400 })
  })
```

Add a new `describe` at the end of the file:

```ts
describe('the AI agents card', () => {
  const card = () => {
    render(<Board />)
    return screen.getByRole('link', { name: /^AI agents and RAG chatbots/ })
  }

  it('says what is inside, counted from the page’s own builds', async () => {
    const { agents } = await import('@/data/agents')
    const c = card()
    expect(c).toHaveAttribute('href', '#ai-agents')
    expect(within(c).getByText('Sample RAG chatbots and agents, and how each one works.')).toBeInTheDocument()
    const rag = agents.builds.filter((b) => b.kind === 'rag').length
    const agent = agents.builds.filter((b) => b.kind === 'agent').length
    expect(projects.cards.agents.counts.map((x) => x.name)).toEqual([`${rag} RAG chatbots`, `${agent} AI agents`])
    for (const x of projects.cards.agents.counts) expect(within(c).getByText(x.name)).toBeInTheDocument()
    expect(within(c).getByText('SEE HOW THEY WORK')).toBeInTheDocument()
  })

  it('shows the eight tool logos as decoration, and no live dots', () => {
    const c = card()
    const logos = [...c.querySelectorAll('img')].map((i) => i.getAttribute('src'))
    for (const slug of ['claude', 'n8n', 'supabase', 'gmail', 'googlesheets', 'telegram', 'stripe', 'caldotcom'])
      expect(logos.some((s) => s?.includes(`${slug}.svg`)), slug).toBe(true)
    for (const img of c.querySelectorAll('img')) expect(img).toHaveAttribute('alt', '')
    for (const slug of ['gmail', 'telegram', 'caldotcom']) expect(existsSync(`public/icons/brands/${slug}.svg`), slug).toBe(true)
    expect(c.querySelector('.size-1\\.5.rounded-full.bg-accent')).toBeNull()
  })

  it('plays a preview that screen readers skip and nothing in it can take focus', () => {
    const c = card()
    const p = c.querySelector('.agents-preview')!
    expect(p).toHaveAttribute('aria-hidden', 'true')
    expect(p.textContent).toContain('Can I switch plans mid-month?')
    expect(p.textContent).toContain('Billing FAQ §2')
    expect(p.textContent).toContain('Stripe · payment failed')
    expect(p.querySelector('a, button, input, [tabindex]')).toBeNull()
  })

  it('keeps no kape names', () => {
    expect(card().textContent).not.toMatch(/kape|brewedops/i)
  })
})
```

In `tests/seo.test.ts`, add `expect(urls).toContain(\`${SITE_URL}/ai-agents.html\`)` next to the `agentic-framework` line (line 46).

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/projects.test.tsx tests/seo.test.ts`
Expected: FAIL. `counts` is undefined, there is no iframe, the BUILDS shot is still a PLACEHOLDER, and the sitemap has no `/ai-agents.html`.

- [ ] **Step 3: Self-host the three new logos.** In `scripts/brand-icons.mjs`, add `gmail: 'EA4335', telegram: '26A5E4', caldotcom: 'A3AAB2',` to `BRANDS`, on the line after `github: 'A3AAB2', googlesheets: '34A853', hackerrank: '00EA64',`.

Run: `node scripts/brand-icons.mjs`
Expected: `wrote 41 brand icons to public/icons/brands`.

- [ ] **Step 4: Change the card's data** in `data/projects.ts`:
  - Imports:
    - Phosphor line: `BlueprintIcon, BrainIcon, BrowsersIcon, ChatCircleDotsIcon, FlowArrowIcon, GraphIcon, RobotIcon,`. BooksIcon, EyeIcon, FilmStripIcon, MagnifyingGlassIcon and SparkleIcon are dropped, if nothing else in the file uses them; check with `grep -n "BooksIcon\|EyeIcon\|FilmStripIcon\|MagnifyingGlassIcon\|SparkleIcon" data/projects.ts` after the edit.
    - Add `import type { Brand } from './stack'`.
  - Delete the `AgentCard` and `AgentGroup` types.
  - Replace the top comment's last sentence ("The AI agents roster lives in data/projectDocs.ts, …") with: `The AI agents card opens public/ai-agents.html (data/agents.ts).`
  - Delete the `builtWith`, `live` and `internal` keys from `projects`.
  - Replace `cards.agents` with:

```ts
    agents: {
      title: 'AI agents and RAG chatbots', icon: RobotIcon, cue: 'VIEW THE AGENTS', cta: 'SEE HOW THEY WORK',
      body: 'Sample RAG chatbots and agents, and how each one works.',
      page: '/ai-agents.html', frameTitle: 'AI agents and RAG chatbots page',
      /** Counted from data/agents.ts's builds (tests/projects.test.tsx checks they agree). */
      counts: [
        { name: '4 RAG chatbots', icon: ChatCircleDotsIcon },
        { name: '4 AI agents', icon: RobotIcon },
      ] satisfies Chip[],
      logos: [
        { name: 'Claude', slug: 'claude' }, { name: 'n8n', slug: 'n8n' }, { name: 'Supabase', slug: 'supabase' }, { name: 'Gmail', slug: 'gmail' },
        { name: 'Google Sheets', slug: 'googlesheets' }, { name: 'Telegram', slug: 'telegram' }, { name: 'Stripe', slug: 'stripe' }, { name: 'Cal.com', slug: 'caldotcom' },
      ] satisfies Brand[],
      /** The card's preview (components/projects/AgentsPreview.tsx): a RAG chat, then an agent run. */
      preview: {
        question: 'Can I switch plans mid-month?',
        search: 'Searching 5 passages · Supabase',
        answer: 'Yes. The change starts today and the difference is prorated on your next invoice.',
        source: 'Billing FAQ §2',
        run: ['Stripe · payment failed', 'Drafting a reminder'] as [string, string],
        approve: 'Approve?',
        buttons: ['Approve', 'Edit'] as [string, string],
      },
    },
```

  - In `BUILDS`, change the agents entry to `{ name: projects.cards.agents.title, view: 'ai-agents', shot: '/shots/ai-agents.jpeg' },`.

- [ ] **Step 5: Write the preview** — `components/projects/AgentsPreview.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { CheckIcon, LightningIcon, MagnifyingGlassIcon, PencilSimpleIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'

/**
 * The AI agents card's preview (spec 2026-10-01-agents-page §5.2): a small
 * RAG chat, then an agent run, in turn. The motion is CSS (app/globals.css,
 * "Agents card preview"). This only marks the preview when it is on screen, so
 * it plays there and nowhere else. At rest it shows the finished chat, which
 * is all that shows under reduced motion or the site's low performance
 * setting. Decorative: the card's link already says what is inside.
 */
export default function AgentsPreview() {
  const p = projects.cards.agents.preview
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-on', e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const chip = 'flex items-center gap-1.5 self-start rounded-full border border-b1 bg-chip px-2.5 py-1 font-mono text-[10px] tracking-[.04em] text-ink3'
  return (
    <div ref={box} aria-hidden className="agents-preview relative mt-1 h-[150px] overflow-hidden rounded-[14px] border border-b1 bg-s0 text-[12px] leading-snug">
      <div className="ap-chat absolute inset-3 flex flex-col gap-2">
        <span className="ap-q self-end rounded-[12px_12px_4px_12px] bg-accent px-3 py-1.5 text-on-accent">{p.question}</span>
        <span className={`ap-search ${chip}`}>
          <MagnifyingGlassIcon size={11} />
          {p.search}
        </span>
        <span className="ap-a max-w-[88%] self-start rounded-[12px_12px_12px_4px] border border-b1 bg-s1 px-3 py-1.5 text-ink2">
          {p.answer} <span className="ml-1 rounded-full bg-wash px-2 py-0.5 font-mono text-[9.5px] whitespace-nowrap text-accent">{p.source}</span>
        </span>
      </div>
      <div className="ap-run absolute inset-3 flex flex-col gap-2">
        <span className={`ap-step-1 ${chip}`}>
          <LightningIcon size={11} className="text-accent" />
          {p.run[0]}
        </span>
        <span className={`ap-step-2 ${chip}`}>
          <PencilSimpleIcon size={11} />
          {p.run[1]}
        </span>
        <span className="ap-approve flex items-center gap-2 self-start rounded-[12px] border border-b2 bg-s1 px-3 py-2 text-ink">
          {p.approve}
          <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] text-on-accent">
            <CheckIcon size={10} />
            {p.buttons[0]}
          </span>
          <span className="rounded-full border border-b1 px-2 py-0.5 text-[11px] text-ink2">{p.buttons[1]}</span>
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add the preview's motion** to `app/globals.css`, after the block of `.flow-ball` reduced-motion rules (lines 337–338):

```css
/* ---- Agents card preview (components/projects/AgentsPreview.tsx, spec 2026-10-01-agents-page §5.2) ---- */
/* At rest: the finished chat. On screen with motion allowed: the chat builds, then an agent run takes over, 12 s a turn. */
.agents-preview .ap-run{opacity:0}
.agents-preview :is(.ap-chat,.ap-q,.ap-search,.ap-a,.ap-run,.ap-step-1,.ap-step-2,.ap-approve){animation:12s ease-in-out infinite both paused}
.agents-preview[data-on] :is(.ap-chat,.ap-q,.ap-search,.ap-a,.ap-run,.ap-step-1,.ap-step-2,.ap-approve){animation-play-state:running}
.agents-preview .ap-chat{animation-name:apChat}
.agents-preview .ap-q{animation-name:apQ}
.agents-preview .ap-search{animation-name:apSearch}
.agents-preview .ap-a{animation-name:apAnswer}
.agents-preview .ap-run{animation-name:apRun}
.agents-preview .ap-step-1{animation-name:apStep1}
.agents-preview .ap-step-2{animation-name:apStep2}
.agents-preview .ap-approve{animation-name:apApprove}
@keyframes apChat{0%,44%{opacity:1}50%,94%{opacity:0}100%{opacity:1}}
@keyframes apQ{0%{opacity:0;transform:translateY(6px)}6%,100%{opacity:1;transform:none}}
@keyframes apSearch{0%,10%{opacity:0;transform:translateY(6px)}16%,100%{opacity:1;transform:none}}
@keyframes apAnswer{0%,22%{opacity:0;transform:translateY(6px)}28%,100%{opacity:1;transform:none}}
@keyframes apRun{0%,48%{opacity:0}54%,92%{opacity:1}98%,100%{opacity:0}}
@keyframes apStep1{0%,52%{opacity:0;transform:translateY(6px)}58%,100%{opacity:1;transform:none}}
@keyframes apStep2{0%,62%{opacity:0;transform:translateY(6px)}68%,100%{opacity:1;transform:none}}
@keyframes apApprove{0%,72%{opacity:0;transform:translateY(6px)}78%,100%{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.agents-preview *{animation:none !important}}
html[data-a11y-motion=true] .agents-preview *{animation:none !important}
:root[data-perf=low] .agents-preview *{animation:none !important}
```

- [ ] **Step 7: Put the preview, counts and logos on the card.** In `components/projects/Board.tsx`:
  - Add the imports `import Image from 'next/image'`, `import { brandIcon } from '@/data/stack'` and `import AgentsPreview from './AgentsPreview'`.
  - Replace the agents card's chip block (the `<div className="mt-auto flex flex-wrap gap-2 pt-3.5">…</div>`) with:

```tsx
            <AgentsPreview />
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3.5">
              {c.agents.counts.map((a) => (
                <span key={a.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-3 py-2 text-[12.5px] text-ink2">
                  <a.icon size={14} aria-hidden className="text-accent" />
                  {a.name}
                </span>
              ))}
              <span className="ml-1 flex flex-wrap items-center gap-2">
                {c.agents.logos.map((l) => (
                  <Image key={l.slug} src={brandIcon(l.slug)} alt="" width={16} height={16} className="block" />
                ))}
              </span>
            </div>
```

- [ ] **Step 8: The window shows the page.** Replace `components/projects/AgentsView.tsx` with:

```tsx
import { projects } from '@/data/projects'
import Window from './Window'

/**
 * AI agents and RAG chatbots (spec 2026-10-01-agents-page): the generated page
 * public/ai-agents.html in the card's window. The iframe is only there while
 * the window is open, so /projects never downloads the page up front. It is
 * same-origin and unsandboxed because we write the page ourselves, which lets
 * it copy the site's theme.
 */
export default function AgentsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = projects.cards.agents
  return (
    <Window open={open} onClose={onClose} title={c.title} href={c.page} flush>
      {open && <iframe src={c.page} title={c.frameTitle} className="absolute inset-0 size-full border-0 bg-bg" />}
    </Window>
  )
}
```

Then:
- Delete `data/projectDocs.ts`.
- In `components/projects/Window.tsx`, delete `WindowHero` and `WindowSection` with their comments. Delete any import only they used (`Chip`, `ReactNode` if the `Props` type no longer needs it; `Props` does use `ReactNode`, so keep that one).
- Run `grep -rn "projectDocs\|WindowHero\|WindowSection\|agentsView\|projects\.live\|projects\.internal\|projects\.builtWith" app components data lib tests e2e`. Expected: no output.

- [ ] **Step 9: Add the page to the sitemap.** In `lib/seo.ts`: `export const STATIC_PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html', '/ai-agents.html']`. In `e2e/seo.spec.ts` line 25, add `'/ai-agents.html'` to the list.

- [ ] **Step 10: Write the browser tests** in `e2e/projects.spec.ts`, at the end:

```ts
test('the AI agents card opens its page in the window; Escape clears a shown route first, then closes', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^AI agents and RAG chatbots/ }).click()
  const view = page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
  await expect(view.getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', '/ai-agents.html')
  const frame = page.frameLocator('iframe[title="AI agents and RAG chatbots page"]')
  const btn = frame.getByRole('button', { name: 'Show its route: Billing follow-up agent' })
  await btn.click()
  await expect(frame.locator('figure[data-diagram="agent"]')).toHaveAttribute('data-focus', 'billing')
  await page.keyboard.press('Escape')
  await expect(frame.locator('figure[data-diagram="agent"]')).not.toHaveAttribute('data-focus')
  await expect(view).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
})

test('the AI agents card’s preview plays only on screen, and holds still under reduced motion', async ({ browser }) => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const ctx = await browser.newContext({ reducedMotion, viewport: { width: 1280, height: 400 } })
    const page = await ctx.newPage()
    await page.goto('/projects')
    await hydrated(page)
    const q = page.locator('.agents-preview .ap-q')
    const state = () => q.evaluate((el) => ({ name: getComputedStyle(el).animationName, play: getComputedStyle(el).animationPlayState }))
    if (reducedMotion === 'reduce') {
      expect((await state()).name).toBe('none')
      await expect(q).toBeVisible()
    } else {
      expect((await state()).play).toBe('paused')
      await page.locator('.agents-preview').scrollIntoViewIfNeeded()
      await expect.poll(async () => (await state()).play).toBe('running')
    }
    await ctx.close()
  }
})
```

*Note:* the 400 px tall viewport keeps the agents card (in the second row of the board) off screen at load, so the first check really sees "paused". If the card is still in view at load, scroll the page to the top first with `page.locator('#main-content').evaluate((el) => el.scrollTo(0, 0))` and use a 300 px height. Don't drop the paused check.

- [ ] **Step 11: Run the tests**

Run: `npx vitest run tests/projects.test.tsx tests/seo.test.ts tests/commands.test.ts`
Expected: PASS.

Run: `npx playwright test e2e/projects.spec.ts e2e/palette.spec.ts e2e/seo.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 12: Commit**

```bash
git add -A data/projects.ts data/projectDocs.ts components/projects/AgentsPreview.tsx components/projects/Board.tsx components/projects/AgentsView.tsx components/projects/Window.tsx app/globals.css scripts/brand-icons.mjs public/icons/brands lib/seo.ts tests/projects.test.tsx tests/seo.test.ts e2e/projects.spec.ts e2e/seo.spec.ts
git commit -m "feat: the AI agents card previews a chat and an agent run, counts its sample builds, shows real logos, and opens the new page

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: No kape content anywhere, and the new page in the cross-page checks

**Files:**
- Modify:
  - `data/endToEnd.ts:68`
  - `tests/no-ghl.test.ts:6`
  - `e2e/lively.spec.ts:3`
- Create: `tests/no-kape.test.ts`
- Regenerate: `public/end-to-end.html`

**Interfaces:**
- Consumes: every `data/*.ts` module and every `public/*.html` page.

- [ ] **Step 1: Write the failing test** — `tests/no-kape.test.ts`:

```ts
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The AI agents card's old content came from the kape reference portfolio
 * (spec 2026-10-01-agents-page §5.3). None of it may reach a visitor. Code
 * comments that credit the reference are fine, so this reads what the site
 * shows: every string the data files export, and the generated pages.
 */
const BANNED = /kape|brewedops|\bken ai\b/i
const strings = (v: unknown, seen = new Set<unknown>()): string[] => {
  if (typeof v === 'string') return [v]
  if (!v || typeof v !== 'object' || seen.has(v)) return []
  seen.add(v)
  return Object.values(v).flatMap((x) => strings(x, seen))
}

describe('no kape content', () => {
  for (const file of readdirSync('data').filter((f) => f.endsWith('.ts'))) {
    it(`data/${file} exports none`, async () => {
      const mod = await import(`../data/${file.replace(/\.ts$/, '')}`)
      expect(strings(mod).filter((s) => BANNED.test(s))).toEqual([])
    })
  }

  for (const file of readdirSync('public').filter((f) => f.endsWith('.html'))) {
    it(`public/${file} shows none`, () => {
      expect(readFileSync(join('public', file), 'utf8')).not.toMatch(BANNED)
    })
  }
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/no-kape.test.ts`
Expected: FAIL on `data/endToEnd.ts` and `public/end-to-end.html`, both with “KapeSEO’s”. The kape chips already left `data/projects.ts` in Task 5.

- [ ] **Step 3: Rewrite the Writer line.** In `data/endToEnd.ts:68`, change the sentence to `'Writes long articles, like a 3,000-word blog post, and grades itself before handing over.'`.

Run: `node scripts/make-e2e.ts`
Expected: `public/end-to-end.html: <n> KB`.

- [ ] **Step 4: Add the new page to the cross-page checks.**
  - `tests/no-ghl.test.ts:6`: add `'public/ai-agents.html'` to `FILES`.
  - `e2e/lively.spec.ts:3`: `const PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html', '/ai-agents.html']`.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run tests/no-kape.test.ts tests/no-ghl.test.ts tests/endToEnd-data.test.ts tests/endToEnd-render.test.ts`
Expected: PASS.

Run: `npx playwright test e2e/lively.spec.ts e2e/end-to-end.spec.ts --project=desktop`
Expected: PASS. All five lively checks pass for `/ai-agents.html`: logos in the sheet, reveal and glow, nothing hidden under reduced motion or without JS, print, and high contrast with reduced motion switched on later. If the high-contrast check can't find `.k-trigger .node-card` and `.k-action .node-card`, check the page has both: Your documents is `k-trigger` and Split into chunks is `k-action`.

- [ ] **Step 6: Commit**

```bash
git add data/endToEnd.ts public/end-to-end.html tests/no-kape.test.ts tests/no-ghl.test.ts e2e/lively.spec.ts
git commit -m "fix: no kape content reaches a visitor; the agents page joins the cross-page checks

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Full verification and the final review

**Files:** none new. This task only runs and reviews; any fix it needs gets its own failing test first.

- [ ] **Step 1: Unit tests, lint and types**

Run: `npm test > .superpowers/unit.log 2>&1; tail -n 15 .superpowers/unit.log`
Expected: every file passes. The new files are agents-data, agents-layout, agents-render and no-kape.

Run: `npm run lint && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Every browser test, desktop and phone**

Run: `npm run e2e > .superpowers/e2e.log 2>&1; tail -n 20 .superpowers/e2e.log`
Expected: all pass on both projects.

- [ ] **Step 3: Look at it.** Shoot the page and the card in both themes, at 1440 and 390, and read the images:
  - Labels sit on one line.
  - Pins sit under their steps.
  - The over-the-top arcs and the internal-only dip don't cross text.
  - The preview fits its 150 px box at 390 px wide.

Fix anything wrong with a failing test first.

- [ ] **Step 4: Freshness**

Run: `node scripts/make-e2e.ts && node scripts/make-af.ts && node scripts/make-agents.ts && git status --short public`
Expected: no changes under `public/`.

- [ ] **Step 5: Final whole-branch review.** Use the executing skill's final review on the range `main..HEAD`, with this plan's Review Focus. Fix Critical and Important findings test-first, and run the full suites again after.

---

## Self-Review Notes

- **Spec coverage:**
  - §3.1–3.10 content → Task 1; render → Task 3.
  - §4.2 diagrams → Tasks 2–3.
  - §4.3 interactions → Task 4.
  - §4.4 accessibility → Tasks 3–5.
  - §5.1 page code → Tasks 1–4.
  - §5.2 card and window → Task 5.
  - §5.3 kape removal → Tasks 5–6.
  - §5.4 other pages → Tasks 4 and 6.
  - §6 testing → spread across every task.
- **Rulings already folded into the spec (2026-10-01):**
  - The hero shows the tools strip only, starting Claude · n8n · Supabase.
  - Pins are 24 px.
  - The board's logos are decorative.
  - Esc closes the innermost thing first.
  - The client hook is tested in the browser.
- **Type names used across tasks:**
  - `layoutDiagram`, `DiagramLayout`, `Route.id`, `LaidCable`, `GEOM`;
  - `renderAgents`, `agentsCss`, `BuildFocus`, `PAGE_PATH`;
  - `data-diagram`, `data-only`, `data-focus`, `.on-route`, `.focus-bar.on`, `.focus-text`, `.focus-clear`, `.route-btn[data-build]`, `#agent-builds`;
  - `projects.cards.agents.{counts, logos, preview, page, frameTitle}`.
