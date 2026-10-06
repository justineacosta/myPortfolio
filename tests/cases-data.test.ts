import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { agenticFramework } from '@/data/agenticFramework'
import { agents } from '@/data/agents'
import { automations } from '@/data/automations'
import { plan } from '@/data/buildPlan'
import { CASES, withSite } from '@/data/cases'
import { CASE_PAGES, CASE_SITES, casePath, type CasePageId } from '@/data/cases/pages'
import { endToEnd } from '@/data/endToEnd'
import { projects } from '@/data/projects'
import { findPlaceholders } from '@/scripts/placeholders'
import { checkAgents, checkAutomation, checkCopy, checkEndToEnd, checkFramework, checkPlan, checkSite, keyOf, prefixOf, SITE_PREFIX, type SiteInfo } from './helpers/caseChecks'

const SITES: SiteInfo[] = projects.sitesView.sites
const siteOf = (key: string) => SITES.find((s) => s.file === `${key}.html`)!
const cases = Object.entries(CASES)

describe('the case registry', () => {
  it('lists exactly the sites in CASES, and pages.ts never imports content', () => {
    expect([...CASE_SITES].sort()).toEqual(Object.keys(CASES).sort())
  })

  it('gives every case all five pages', () => {
    for (const [key, set] of cases) for (const page of ['automation', 'plan', 'framework', 'endToEnd', 'agents'] as const) expect(set[page], `${key}: ${page}`).toBeDefined()
  })

  it('keeps pages.ts free of runtime imports, so it stays light for the client bundle', () => {
    // SitePreview imports pages.ts, so it must not pull in index.ts, any content or any other runtime module.
    const src = readFileSync('data/cases/pages.ts', 'utf8')
    const imports = src.match(/^\s*import\b.*$/gm) ?? []
    for (const line of imports) expect(line, 'only type imports').toMatch(/^\s*import type\b/)
    expect(src).not.toMatch(/\bimport\s*\(/)
    expect(src).not.toMatch(/\brequire\s*\(/)
    // A runtime re-export (export { … } from, export * from) pulls its module in as surely as an import does.
    const reexports = src.match(/^\s*export\s+(?:type\s+)?(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\b/gm) ?? []
    for (const line of reexports) expect(line, 'only type re-exports').toMatch(/^\s*export type\b/)
  })

  it('gives every sample site a two-letter code prefix', () => {
    for (const s of SITES) expect(prefixOf(s), s.file).toMatch(/^[A-Z]{2}$/)
    expect(Object.keys(SITE_PREFIX).sort()).toEqual(SITES.map(keyOf).sort())
    expect(new Set(Object.values(SITE_PREFIX)).size, 'prefixes are unique').toBe(SITES.length)
  })

  it('keys every case by a real sample site', () => {
    for (const [key] of cases) expect(SITES.map((s) => s.file), key).toContain(`${key}.html`)
  })

  it('has no PLACEHOLDER in data/cases', () => {
    expect(findPlaceholders().filter((h) => h.file.startsWith('data/cases/'))).toEqual([])
  })
})

describe('the Automation case pages', () => {
  it('follow the per-site rules', () => {
    for (const [key, set] of cases) if (set.automation) checkAutomation(set.automation, siteOf(key))
  })
})

describe('the Build plan case pages', () => {
  it('follow the per-site rules, and match the Automation page', () => {
    for (const [key, set] of cases)
      if (set.plan) {
        expect(set.automation, `${key}: a plan needs its automation page`).toBeDefined()
        checkPlan(set.plan, set.automation!, siteOf(key))
      }
  })
})

describe('the AI agents case pages', () => {
  it('follow the per-site rules', () => {
    for (const [key, set] of cases) if (set.agents) checkAgents(set.agents, siteOf(key))
  })
})

describe('the End-to-end case pages', () => {
  it('follow the per-site rules', () => {
    for (const [, set] of cases) if (set.endToEnd) checkEndToEnd(set.endToEnd)
  })
})

describe('the Agentic framework case pages', () => {
  it('follow the per-site rules', () => {
    for (const [key, set] of cases) if (set.framework) checkFramework(set.framework, key)
  })
})

describe('every case page', () => {
  it('carries its site link, names the site, and keeps to the copy rules', () => {
    const file = (id: CasePageId) => CASE_PAGES.find((p) => p.id === id)!.file
    for (const [key, set] of cases) {
      const site = siteOf(key)
      if (set.automation) checkCopy(set.automation, site, file('automation'))
      if (set.plan) checkCopy(set.plan, site, file('build-plan'))
      if (set.framework) checkCopy(set.framework, site, file('agentic-framework'))
      if (set.endToEnd) checkCopy(set.endToEnd, site, file('end-to-end'))
      if (set.agents) checkCopy(set.agents, site, file('ai-agents'))
    }
  })
})

describe('every case site', () => {
  it('is labelled a sample, names no other site, scopes the person’s yes, keeps its trade’s rules and uses each tool on two pages', () => {
    for (const [key, set] of cases) checkSite(set, siteOf(key), SITES)
  })
})

// CASES is empty until a site's content lands, so the loops above would pass on anything.
// These build a small valid case from the general pages, then break it one way at a time.
describe('the checks can fail', () => {
  const site: SiteInfo = siteOf('oriel-portugal-residences')
  const clone = <T>(v: T): T => structuredClone(v)

  const goodAutomation = () => {
    const [n8n, , make, zapier] = clone(automations.flows)
    const flows = [n8n, make, zapier].map((f, i) => ({ ...f, code: `OR-0${i + 1}`, href: site.src }))
    return { ...clone(automations), title: 'Automations · Oriel', flows }
  }

  const goodPlan = () => {
    const a = goodAutomation()
    const p = clone(plan)
    const was = p.workflows.slice(0, 3).map((w) => w.code)
    const workflows = p.workflows.slice(0, 3).map((w, i) => ({ ...w, code: a.flows[i].code, platform: a.flows[i].platform, title: a.flows[i].title }))
    const helpers = p.helpers.list.map((h, i) => ({ ...h, code: `OR-H0${i + 1}` }))
    const rows = p.tests.rows.filter((r) => was.includes(r.workflow)).map((r) => ({ ...r, workflow: a.flows[was.indexOf(r.workflow)].code }))
    return { ...p, title: 'Build plan · Oriel', workflows, helpers: { ...p.helpers, list: helpers }, tests: { ...p.tests, rows } }
  }

  const goodAgents = () => {
    const g = clone(agents)
    const builds = [g.builds.find((b) => b.kind === 'rag')!, ...g.builds.filter((b) => b.kind === 'agent').slice(0, 2)].map((b) => ({ ...b, business: { ...b.business, name: site.name } }))
    return { ...g, title: 'AI agents · Oriel', builds }
  }

  const goodFramework = () => ({ ...clone(agenticFramework), title: 'Agentic framework · Oriel', example: { ...clone(agenticFramework.example), link: { label: 'See it', href: casePath(keyOf(site), 'end-to-end.html') } } })
  const goodEndToEnd = () => ({ ...clone(endToEnd), title: 'End-to-end · Oriel' })
  const withLink = <T extends object>(page: T, id: CasePageId) => withSite(page, keyOf(site), id)

  it('Automation: passes a valid page, and fails on a missing node, a fourth flow, the wrong site or the wrong platform', () => {
    expect(() => checkAutomation(goodAutomation(), site)).not.toThrow()
    const dangling = goodAutomation()
    dangling.flows[0].edges.push({ from: dangling.flows[0].nodes[0].id, to: 'nowhere' })
    expect(() => checkAutomation(dangling, site)).toThrow()
    const fourth = goodAutomation()
    fourth.flows.push({ ...clone(fourth.flows[0]), code: 'OR-04' })
    expect(() => checkAutomation(fourth, site)).toThrow()
    const away = goodAutomation()
    away.flows[1].href = '/samples/other.html'
    expect(() => checkAutomation(away, site)).toThrow()
    const platform = goodAutomation()
    platform.flows[1].platform = 'zapier'
    expect(() => checkAutomation(platform, site)).toThrow()
    const prefix = goodAutomation()
    prefix.flows.forEach((f, i) => (f.code = `TW-0${i + 1}`))
    expect(() => checkAutomation(prefix, site)).toThrow()
    const bare = goodAutomation()
    bare.flows[0].nodes[0].reads = []
    expect(() => checkAutomation(bare, site)).toThrow()
  })

  it('Build plan: passes a valid page, and fails on a missing node, another code or platform, or four phases', () => {
    const a = goodAutomation()
    expect(() => checkPlan(goodPlan(), a, site)).not.toThrow()
    const dangling = goodPlan()
    dangling.workflows[0].edges.push({ from: dangling.workflows[0].nodes[0].id, to: 'nowhere' })
    expect(() => checkPlan(dangling, a, site)).toThrow()
    const code = goodPlan()
    code.helpers.list[0].code = 'TM-H01'
    expect(() => checkPlan(code, a, site)).toThrow()
    const platform = goodPlan()
    platform.workflows[0].platform = 'zapier'
    expect(() => checkPlan(platform, a, site)).toThrow()
    const phases = goodPlan()
    phases.build.phases.pop()
    expect(() => checkPlan(phases, a, site)).toThrow()
    const untested = goodPlan()
    untested.tests.rows = untested.tests.rows.filter((r) => r.workflow !== 'OR-01')
    expect(() => checkPlan(untested, a, site)).toThrow()
  })

  it('AI agents: passes a valid page, and fails on a fourth build, a missing route, no Claude or another business', () => {
    expect(() => checkAgents(goodAgents(), site)).not.toThrow()
    const fourth = goodAgents()
    fourth.builds.push(clone(fourth.builds[1]))
    expect(() => checkAgents(fourth, site)).toThrow()
    const route = goodAgents()
    route.builds[0].routes.push('nowhere')
    expect(() => checkAgents(route, site)).toThrow()
    const claude = goodAgents()
    claude.builds[2].tools = claude.builds[2].tools.filter((t) => t !== 'claude')
    expect(() => checkAgents(claude, site)).toThrow()
    const other = goodAgents()
    other.builds[1].business.name = 'Westmere'
    expect(() => checkAgents(other, site)).toThrow()
    const cable = goodAgents()
    cable.diagrams.agent.cables.push({ from: 'trigger', to: 'act', kind: 'flow' })
    expect(() => checkAgents(cable, site)).toThrow()
  })

  it('End-to-end: passes a valid page, and fails on a missing step, a circle, a shared spot or lanes out of order', () => {
    expect(() => checkEndToEnd(goodEndToEnd())).not.toThrow()
    const dangling = goodEndToEnd()
    dangling.cables.push({ from: dangling.steps[0].id, to: 'nowhere', kind: 'flow' })
    expect(() => checkEndToEnd(dangling)).toThrow()
    const circle = goodEndToEnd()
    const [first] = circle.cables.filter((c) => c.kind === 'flow')
    circle.cables.push({ from: first.to, to: first.from, kind: 'flow' })
    expect(() => checkEndToEnd(circle)).toThrow()
    const spot = goodEndToEnd()
    spot.steps[1] = { ...spot.steps[1], lane: spot.steps[0].lane, at: spot.steps[0].at }
    expect(() => checkEndToEnd(spot)).toThrow()
    const lanes = goodEndToEnd()
    lanes.lanes.reverse()
    expect(() => checkEndToEnd(lanes)).toThrow()
    const triggerless = goodEndToEnd()
    triggerless.steps = triggerless.steps.map((s) => (s.kind === 'trigger' ? { ...s, kind: 'step' as const } : s))
    expect(() => checkEndToEnd(triggerless)).toThrow()
  })

  it('Agentic framework: passes a valid page, and fails on a missing step, a circle, a doubled rule, the general link or a stray term', () => {
    const key = keyOf(site)
    expect(() => checkFramework(goodFramework(), key)).not.toThrow()
    const dangling = goodFramework()
    dangling.loop.cables.push({ from: 'task', to: 'nowhere', kind: 'flow' })
    expect(() => checkFramework(dangling, key)).toThrow()
    const circle = goodFramework()
    circle.loop.cables.push({ from: 'live', to: 'task', kind: 'flow' })
    expect(() => checkFramework(circle, key)).toThrow()
    const rule = goodFramework()
    rule.loop.steps.find((s) => s.id === 'build')!.rule = 'R1'
    expect(() => checkFramework(rule, key)).toThrow()
    const link = goodFramework()
    link.example.link.href = '/end-to-end.html'
    expect(() => checkFramework(link, key)).toThrow()
    const term = goodFramework()
    term.glossary.push(['Zzyzx', 'A word nothing else uses.'])
    expect(() => checkFramework(term, key)).toThrow()
    const sections = goodFramework()
    sections.sections.pop()
    expect(() => checkFramework(sections, key)).toThrow()
  })

  it('every page: passes a valid page, and fails on a missing link, a straight apostrophe, Cursor, an unknown tool or a long label', () => {
    const page = () => withLink(goodAutomation(), 'automation')
    expect(() => checkCopy(page(), site, 'automation.html')).not.toThrow()
    expect(() => checkCopy(goodAutomation(), site)).toThrow()
    expect(() => checkCopy(page(), site, 'build-plan.html')).toThrow()
    const titled = page()
    titled.title = 'Automations'
    expect(() => checkCopy(titled, site)).toThrow()
    const apostrophe = page()
    apostrophe.lede = "Don't use a straight apostrophe."
    expect(() => checkCopy(apostrophe, site)).toThrow()
    const quote = page()
    quote.lede = 'A "straight" quote.'
    expect(() => checkCopy(quote, site)).toThrow()
    const editor = page()
    editor.lede = 'Built in Cursor.'
    expect(() => checkCopy(editor, site)).toThrow()
    const tool = page()
    tool.flows[0].nodes[0].tools = ['notion' as never]
    expect(() => checkCopy(tool, site)).toThrow()
    const long = page()
    long.flows[0].nodes[0].label = 'A label that runs past twenty-two characters'
    expect(() => checkCopy(long, site)).toThrow()
  })

  it('every page: reads the framework’s tool cards as cards, and still fails on an unknown tool in one', () => {
    const page = () => withLink(goodFramework(), 'agentic-framework')
    expect(() => checkCopy(page(), site, 'agentic-framework.html')).not.toThrow()
    const card = page()
    card.tools[0].tool = 'notion' as never
    expect(() => checkCopy(card, site)).toThrow()
  })

  it('Build plan: fails when a workflow’s title drifts from its flow’s', () => {
    const renamed = goodPlan()
    renamed.workflows[0].title = 'Something else'
    expect(() => checkPlan(renamed, goodAutomation(), site)).toThrow(/title/)
  })

  it('a site: passes a real one, and fails on a missing sample note, another site’s name, an over-broad yes, a broken trade rule or a one-page tool', () => {
    const real = () => structuredClone(CASES['range-physical-therapy'])
    const range = siteOf('range-physical-therapy')
    expect(() => checkSite(real(), range, SITES)).not.toThrow()

    const unlabelled = real()
    unlabelled.automation = JSON.parse(JSON.stringify(unlabelled.automation).replace(/fictional/gi, 'real'))
    expect(() => checkSite(unlabelled, range, SITES)).toThrow(/fictional/)

    const leak = real()
    leak.agents!.lede += ' Like Altitude, two doors down.'
    expect(() => checkSite(leak, range, SITES)).toThrow(/Altitude/)

    const wide = real()
    wide.framework!.stance = 'Mara approves anything for a patient.'
    expect(() => checkSite(wide, range, SITES)).toThrow(/wider/)
    const reads = real()
    reads.endToEnd!.stance = 'Mara checks what a patient reads.'
    expect(() => checkSite(reads, range, SITES)).toThrow(/wider/)

    const no911 = real()
    no911.agents = JSON.parse(JSON.stringify(no911.agents).replace(/911/g, 'the clinic'))
    expect(() => checkSite(no911, range, SITES)).toThrow(/911/)

    const stored = real()
    stored.plan!.data.tables[0].fields.push('Symptoms')
    expect(() => checkSite(stored, range, SITES)).toThrow(/Symptoms/)

    const lonely = real()
    lonely.automation!.flows[0].nodes[0].tools = ['hubspot']
    const others = [lonely.plan, lonely.agents, lonely.endToEnd].map((p) => JSON.stringify(p))
    if (others.every((t) => !t.includes('"hubspot"'))) expect(() => checkSite(lonely, range, SITES)).toThrow(/hubspot/)
    else throw new Error('the fixture needs a tool no other Range page uses')
  })

  it('withSite fills the site from the carousel and the page path from CASE_PAGES, and refuses an unknown site', () => {
    const page = withLink({ title: 'x' }, 'ai-agents')
    expect(page.site).toEqual({ name: 'Oriel', href: '/samples/oriel-portugal-residences.html', page: '/cases/oriel-portugal-residences/ai-agents.html' })
    expect(() => withSite({ title: 'x' }, 'no-such-site', 'automation')).toThrow(/no-such-site/)
  })
})
