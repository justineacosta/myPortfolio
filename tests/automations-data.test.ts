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

  it('names every node once and every connector between real nodes', () => {
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
