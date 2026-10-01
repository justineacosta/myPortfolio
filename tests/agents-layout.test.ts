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
