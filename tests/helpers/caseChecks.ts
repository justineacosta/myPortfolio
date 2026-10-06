/**
 * The content rules for a per-site case page (spec 2026-10-05 per-site pages),
 * generalised from the data tests of the five general pages. Each check throws
 * with a message that names what is wrong. tests/cases-data.test.ts runs them
 * over every case, and proves on small fixtures that each one can fail.
 */
import { expect } from 'vitest'
import type { AgenticFramework } from '@/data/agenticFramework'
import type { Agents } from '@/data/agents'
import type { Automations } from '@/data/automations'
import type { Plan, Workflow } from '@/data/buildPlan'
import { casePath } from '@/data/cases/pages'
import type { EndToEnd } from '@/data/endToEnd'
import { TOOLS, type ToolId } from '@/lib/brand/tools'

/** A sample site, as `projects.sitesView.sites` lists it. */
export type SiteInfo = { name: string; file: string; src: string }

/** A site's folder key: its file name without .html. */
export const keyOf = (site: SiteInfo) => site.file.replace(/\.html$/, '')

/** Each sample site's code prefix, from the spec's table: its flows are <PREFIX>-01..03 and its build plan helpers <PREFIX>-H01... A test invariant, so it lives here and not in the data. */
export const SITE_PREFIX: Record<string, string> = {
  'oriel-portugal-residences': 'OR',
  'tidewell-vacation-rentals': 'TW',
  'altitude-personal-training': 'AL',
  'range-physical-therapy': 'RP',
  'riverdale-and-brooks': 'RB',
  'ostler-barbers': 'OS',
  'harbor-and-pine-moving': 'HP',
  'westmere-los-angeles': 'WM',
  'ironline-utility-infrastructure': 'IL',
  'meridian-werks': 'MW',
  'meridian-energy-infrastructure': 'ME',
}

/** A site's code prefix: exactly two letters, from the table. */
export function prefixOf(site: SiteInfo): string {
  const p = SITE_PREFIX[keyOf(site)]
  expect(p, `${keyOf(site)} has a code prefix in SITE_PREFIX`).toBeDefined()
  expect(p, 'a prefix is exactly two letters').toMatch(/^[A-Z]{2}$/)
  return p
}

/** Kahn's algorithm: the flow cables, without the loop-backs, never go round in a circle. */
function expectAcyclic(ids: string[], cables: { from: string; to: string; kind: string }[], what: string) {
  const flow = cables.filter((c) => c.kind === 'flow')
  const left = new Map(ids.map((id) => [id, flow.filter((c) => c.to === id).length]))
  const queue = ids.filter((id) => left.get(id) === 0)
  let seen = 0
  while (queue.length) {
    const id = queue.shift()!
    seen++
    for (const c of flow.filter((c) => c.from === id)) {
      left.set(c.to, left.get(c.to)! - 1)
      if (left.get(c.to) === 0) queue.push(c.to)
    }
  }
  expect(seen, `${what}: flow cables go round in a circle`).toBe(ids.length)
}

function expectCablesJoinSteps(ids: string[], cables: { from: string; to: string }[], what: string) {
  for (const c of cables) expect(ids.includes(c.from) && ids.includes(c.to), `${what}: ${c.from} → ${c.to}`).toBe(true)
}

function expectOneStepPerSpot(steps: { at: [number, number] }[], what: string) {
  const spots = steps.map((s) => s.at.join(','))
  expect(new Set(spots).size, `${what}: two steps in one spot`).toBe(spots.length)
}

export function checkAutomation(page: Automations, site: SiteInfo) {
  const { flows } = page
  expect(flows, 'three flows').toHaveLength(3)
  expect(flows.map((f) => f.platform)).toEqual(['n8n', 'make', 'zapier'])
  const p = prefixOf(site)
  expect(flows.map((f) => f.code)).toEqual([`${p}-01`, `${p}-02`, `${p}-03`])
  for (const f of flows) expect(f.href, f.code).toBe(site.src)
  // On a site's own page the tabs show flow titles, so each must be unique and fit a tab.
  const titles = flows.map((f) => f.title)
  expect(new Set(titles).size, 'flow titles are unique').toBe(titles.length)
  for (const t of titles) expect(t.length, `flow title “${t}” ≤ 22`).toBeLessThanOrEqual(22)
  // Each flow has 5–9 steps (spec §6.1).
  for (const f of flows) {
    expect(f.nodes.length, `${f.code} has at least 5 nodes`).toBeGreaterThanOrEqual(5)
    expect(f.nodes.length, `${f.code} has at most 9 nodes`).toBeLessThanOrEqual(9)
  }

  const ids = flows.flatMap((f) => f.nodes.map((n) => n.id))
  expect(new Set(ids).size, 'node ids are unique across the page').toBe(ids.length)
  for (const f of flows) {
    const own = new Set(f.nodes.map((n) => n.id))
    for (const e of f.edges) {
      expect(own.has(e.from), `${f.code} ${e.from}`).toBe(true)
      expect(own.has(e.to), `${f.code} ${e.to}`).toBe(true)
    }
    for (const n of f.nodes) {
      expect(n.what, `${n.id} what`).toBeTruthy()
      expect(n.why, `${n.id} why`).toBeTruthy()
      expect(n.reads.length, `${n.id} reads`).toBeGreaterThan(0)
      expect(n.tools.length, `${n.id} tools`).toBeLessThanOrEqual(2)
      const out = f.edges.filter((e) => e.from === n.id)
      if (out.length > 1) for (const e of out) expect(e.label, `${f.code} ${e.from} → ${e.to}`).toBeTruthy()
    }
  }
}

export function checkPlan(page: Plan, automation: Automations, site: SiteInfo) {
  const p = prefixOf(site)
  expect(page.workflows.map((w) => w.code)).toEqual(automation.flows.map((f) => f.code))
  expect(page.workflows.map((w) => w.platform)).toEqual(automation.flows.map((f) => f.platform))
  expect(page.workflows.map((w) => w.title), 'each workflow keeps its flow’s title').toEqual(automation.flows.map((f) => f.title))
  for (const h of page.helpers.list) expect(h.code, 'helper code').toMatch(new RegExp(`^${p}-H\\d\\d$`))

  const all: Workflow[] = [...page.workflows, ...page.helpers.list]
  for (const w of all) {
    const ids = w.nodes.map((n) => n.id)
    expect(new Set(ids).size, `${w.code} ids are unique`).toBe(ids.length)
    for (const e of w.edges) {
      expect(ids, `${w.code} ${e.from}`).toContain(e.from)
      expect(ids, `${w.code} ${e.to}`).toContain(e.to)
    }
    const entered = new Set(w.edges.map((e) => e.to))
    for (const n of w.nodes) {
      const out = w.edges.filter((e) => e.from === n.id)
      if (n.kind === 'branch') {
        expect(out.length, `${w.code} ${n.id} ways out`).toBeGreaterThanOrEqual(2)
        expect(out.every((e) => e.label), `${w.code} ${n.id} labels`).toBe(true)
      } else {
        expect(out.length, `${w.code} ${n.id} ways out`).toBeLessThanOrEqual(1)
        expect(out.some((e) => e.label), `${w.code} ${n.id} label`).toBe(false)
      }
      expect(n.kind === 'trigger', `${w.code} ${n.id}: a step starts a flow only if it is a trigger`).toBe(!entered.has(n.id))
      expect(n.type, `${w.code} ${n.id} type`).not.toBe('')
      expect(n.settings.length, `${w.code} ${n.id} settings`).toBeGreaterThan(0)
    }
  }

  const rows = page.tests.rows.map((r) => r.id)
  expect(new Set(rows).size, 'test ids are unique').toBe(rows.length)
  for (const w of page.workflows) expect(page.tests.rows.filter((r) => r.workflow === w.code).length, `${w.code} tests`).toBeGreaterThanOrEqual(2)
  for (const r of page.tests.rows) expect(page.workflows.map((w) => w.code), r.id).toContain(r.workflow)
  expect(page.build.phases, 'five build phases').toHaveLength(5)
}

export function checkAgents(page: Agents, site: SiteInfo) {
  expect(page.builds.map((b) => b.kind)).toEqual(['rag', 'agent', 'agent'])
  for (const b of page.builds) {
    const d = page.diagrams[b.kind]
    for (const r of b.routes) expect(d.routes.some((x) => x.id === r), `${b.id}: ${r}`).toBe(true)
    for (const pin of b.pins) {
      const [step, id] = pin.split(':')
      expect(d.steps.find((s) => s.id === step)?.pins?.some((x) => x.id === id), `${b.id}: ${pin}`).toBe(true)
    }
    expect(b.tools, `${b.id} uses Claude`).toContain('claude')
    expect(b.business.name, b.id).toBe(site.name)
  }
  for (const d of Object.values(page.diagrams)) {
    const { steps, cables, routes } = d
    const kind = new Map(steps.map((s) => [s.id, s.kind]))
    for (const r of routes) {
      expect(kind.get(r.nodes[0]), `${r.id} starts at a start`).toBe('start')
      for (let i = 1; i < r.nodes.length; i++)
        expect(cables.some((c) => c.kind !== 'index' && c.from === r.nodes[i - 1] && c.to === r.nodes[i]), `${r.id}: ${r.nodes[i - 1]} → ${r.nodes[i]}`).toBe(true)
    }
    expect(new Set(routes.flatMap((r) => r.nodes)), `${d.id}: the routes pass every step`).toEqual(new Set(steps.map((s) => s.id)))
    for (const c of cables.filter((c) => c.kind !== 'index'))
      expect(routes.some((r) => r.nodes.some((n, i) => n === c.from && r.nodes[i + 1] === c.to)), `${d.id}: no route passes ${c.from} → ${c.to}`).toBe(true)
  }
}

export function checkEndToEnd(page: EndToEnd) {
  const n = page.lanes.length
  expect(n, 'between one and eleven lanes').toBeGreaterThanOrEqual(1)
  expect(n).toBeLessThanOrEqual(11)
  expect(page.lanes.map((l) => l.id), 'lanes run from A in order').toEqual('ABCDEFGHIJK'.slice(0, n).split(''))
  const ids = page.steps.map((s) => s.id)
  expect(new Set(ids).size, 'step ids are unique').toBe(ids.length)
  for (const lane of page.lanes) {
    const steps = page.steps.filter((s) => s.lane === lane.id)
    expectOneStepPerSpot(steps, `lane ${lane.id}`)
    for (const s of steps) expect(s.at[0], `${s.id} sits within seven columns`).toBeLessThanOrEqual(6)
  }
  for (const s of page.steps) expect(page.lanes.some((l) => l.id === s.lane), `${s.id} is in a real lane`).toBe(true)
  expectCablesJoinSteps(ids, page.cables, 'end-to-end')
  expectAcyclic(ids, page.cables, 'end-to-end')
  expect(page.steps.some((s) => s.kind === 'trigger'), 'a trigger').toBe(true)
  expect(page.steps.some((s) => s.kind === 'end'), 'an end').toBe(true)
}

export function checkFramework(page: AgenticFramework, key: string) {
  expect(page.sections.map((s) => s.id)).toEqual(['glance', 'jobs', 'tools', 'rules', 'loop', 'example', 'habits', 'glossary'])
  const { steps, cables } = page.loop
  const ids = steps.map((s) => s.id)
  expect(new Set(ids).size, 'loop step ids are unique').toBe(ids.length)
  expectOneStepPerSpot(steps, 'loop')
  expectCablesJoinSteps(ids, cables, 'loop')
  expectAcyclic(ids, cables, 'loop')
  const rules = steps.flatMap((s) => (s.rule ? [s.rule] : []))
  expect(new Set(rules).size, 'each rule is pinned at most once').toBe(rules.length)
  for (const r of rules) expect(['R1', 'R2', 'R3', 'R4'], r).toContain(r)
  expect(page.example.link.href).toBe(casePath(key, 'end-to-end.html'))
  const elsewhere = JSON.stringify({ ...page, glossary: [] }).toLowerCase()
  for (const [term] of page.glossary) expect(elsewhere, `glossary term “${term}” is used elsewhere`).toContain(term.toLowerCase())
}

/** Every value and every object in v, however deep. */
function* walk(v: unknown): Generator<unknown> {
  yield v
  if (Array.isArray(v)) for (const x of v) yield* walk(x)
  else if (v && typeof v === 'object') for (const x of Object.values(v)) yield* walk(x)
}

/** The rules every case page shares: its site link, its title, short step lines, the copy rules and known tools. `file` is the page's own file, when known. */
export function checkCopy(page: { site?: { name: string; href: string; page: string }; title: string }, site: SiteInfo, file?: string) {
  const key = keyOf(site)
  expect(page.site, 'site is set by withSite').toBeDefined()
  expect(page.site!.name).toBe(site.name)
  expect(page.site!.href).toBe(site.src)
  if (file) expect(page.site!.page).toBe(casePath(key, file))
  else expect(page.site!.page).toMatch(new RegExp(`^/cases/${key}/[a-z-]+\\.html$`))
  expect(page.title, 'the title names the site').toContain(site.name)

  for (const v of walk(page)) {
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    if (typeof o.label === 'string' && typeof o.sub === 'string') {
      expect(o.label.length, o.label).toBeLessThanOrEqual(22)
      expect(o.sub.length, `${o.label}: ${o.sub}`).toBeLessThanOrEqual(22)
    }
    // A list of tool ids. The framework's `tools` is a list of cards instead; each card's `tool` is checked on its own below.
    if (Array.isArray(o.tools)) for (const t of o.tools) if (typeof t !== 'object') expect(TOOLS[t as ToolId], `tool ${String(t)}`).toBeTruthy()
    if (typeof o.tool === 'string') expect(TOOLS[o.tool as ToolId], `tool ${o.tool}`).toBeTruthy()
  }

  const text = JSON.stringify(page)
  expect(text, 'curly quotes only').not.toContain("'")
  expect(text, 'curly quotes only').not.toContain('\\"')
  expect(text, 'the editor is VS Code').not.toMatch(/cursor/i)
  expect(text).not.toMatch(/gohighlevel|highlevel|\bghl\b/i)
}

/** A site's five pages, as CASES holds them. */
export type CaseSetInfo = { automation?: Automations; plan?: Plan; framework?: AgenticFramework; endToEnd?: EndToEnd; agents?: Agents }

/**
 * What a site's trade needs on its pages (spec §6, sensitive trades). `require`
 * is text a page must carry; `bannedFields` is a pattern no Build plan table
 * field may match, so nothing it names is ever stored.
 */
export const SENSITIVE: Record<string, { require: { page: keyof CaseSetInfo; text: RegExp; why: string }[]; bannedFields?: RegExp }> = {
  'range-physical-therapy': {
    require: [{ page: 'agents', text: /\b911\b/, why: 'the bot points an emergency to 911' }],
    bannedFields: /symptom|diagnos|injur|condition|treatment/i,
  },
  'riverdale-and-brooks': {
    require: [{ page: 'agents', text: /legal advice/i, why: 'the bot never gives legal advice' }],
  },
}

/** The person’s-yes rule stated wider than the pages build it: a live chat bot answers without a yes (Lesson 9). */
export const OVERBROAD_YES = [
  /\b(?:anything|everything) (?:for|to|that reaches) (?:a|an|the) (?:client|guest|patient|buyer|owner)\b(?![’']s inbox)/i,
  /\b(?:anything|what) (?:a|an|the) (?:client|guest|patient|buyer|owner) reads\b/i,
]

/** Every tool id a page names: lists of ids, a step’s or card’s `tool`, and the hero’s tools. */
function toolsOf(page: object): Set<string> {
  const found = new Set<string>()
  for (const v of walk(page)) {
    if (!v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    for (const list of [o.tools, o.heroTools]) if (Array.isArray(list)) for (const t of list) if (typeof t === 'string') found.add(t)
    if (typeof o.tool === 'string') found.add(o.tool)
  }
  return found
}

/**
 * The rules that span a site’s pages: each is labelled a sample, no other
 * site’s name leaks in, the person’s yes is never stated wider than built, the
 * trade’s own rules hold, and a tool is never used on just one working page
 * (the framework’s build tools aside).
 */
export function checkSite(set: CaseSetInfo, site: SiteInfo, sites: SiteInfo[]) {
  const key = keyOf(site)
  const pages = Object.entries(set).filter(([, p]) => p) as [keyof CaseSetInfo, object][]
  for (const [name, page] of pages) {
    const text = JSON.stringify(page)
    expect(text, `${key} ${name}: says the business is fictional`).toMatch(/fictional/i)
    expect(text, `${key} ${name}: marks its figures illustrative`).toMatch(/illustrative/i)
    for (const other of sites) if (other.name !== site.name) expect(text, `${key} ${name}: names another site, ${other.name}`).not.toContain(other.name)
    for (const re of OVERBROAD_YES) expect(text, `${key} ${name}: states the person’s yes wider than built`).not.toMatch(re)
  }

  const rules = SENSITIVE[key]
  for (const r of rules?.require ?? []) {
    const page = set[r.page]
    expect(page, `${key}: ${r.page} exists for its trade rule`).toBeDefined()
    expect(JSON.stringify(page), `${key} ${r.page}: ${r.why}`).toMatch(r.text)
  }
  if (rules?.bannedFields && set.plan)
    for (const t of set.plan.data.tables) for (const f of t.fields) expect(f, `${key}: table ${t.name} stores ${f}`).not.toMatch(rules.bannedFields)

  const working = (['automation', 'plan', 'agents', 'endToEnd'] as const).filter((n) => set[n]).map((n) => toolsOf(set[n]!))
  if (working.length === 4) {
    const all = new Set(working.flatMap((s) => [...s]))
    for (const t of all) expect(working.filter((s) => s.has(t)).length, `${key}: tool ${t} appears on only one working page`).toBeGreaterThanOrEqual(2)
  }
}
