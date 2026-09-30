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
