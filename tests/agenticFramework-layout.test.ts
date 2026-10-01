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
