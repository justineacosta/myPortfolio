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
    expect(g.heading).toBe('How I build AI agents and RAG chatbots')
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
        // Every route ends at an end, except preparing the documents, which ends once they are stored.
        if (r.id === 'prepare') expect(r.nodes.at(-1)).toBe('store')
        else expect(kind.get(r.nodes.at(-1)!), r.id).toBe('end')
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
