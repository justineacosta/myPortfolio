import { describe, expect, it } from 'vitest'
import { FLOWS, type FlowEdge } from '@/data/flows'
import { edgePath, stepLift, wrap, type Lifts } from '@/lib/flow'

const straight: FlowEdge = { f: 0, t: 1, from: [130, 96], to: [248, 96] }
const curve: FlowEdge = { f: 2, t: 4, from: [456, 132], to: [812, 132], c: [520, 214, 740, 214], k: 'dash' }

describe('edgePath (Kraft edgeD)', () => {
  it("draws Kraft's straight and curved edges", () => {
    expect(edgePath(straight)).toBe('M130,96 L248,96')
    expect(edgePath(curve)).toBe('M456,132 C520,214 740,214 812,132')
  })

  it("raises each end by its node's lift", () => {
    expect(edgePath(straight, -6, 0)).toBe('M130,90 L248,96')
    expect(edgePath(curve, 0, -6)).toBe('M456,132 C520,214 740,214 812,126')
  })
})

describe('stepLift', () => {
  it('eases 26% of the way per frame, then snaps', () => {
    const one = stepLift({}, { 3: -6 })
    expect(one.cur[3]).toBeCloseTo(-1.56)
    expect(one.moving).toBe(true)
    let s: { cur: Lifts; moving: boolean } = { cur: {}, moving: true }
    let frames = 0
    while (s.moving && frames < 100) {
      s = stepLift(s.cur, { 3: -6 })
      frames++
    }
    expect(s.cur[3]).toBe(-6)
    expect(frames).toBeLessThan(30)
  })
})

describe('wrap', () => {
  it('wraps flow indexes both ways', () => {
    expect(wrap(-1, 10)).toBe(9)
    expect(wrap(10, 10)).toBe(0)
  })
})

describe('FLOWS', () => {
  it("has Kraft's ten flows, every edge joining two real nodes", () => {
    expect(FLOWS).toHaveLength(10)
    expect(FLOWS[0].label).toBe('LEAD → BOOKED CALL')
    for (const f of FLOWS) {
      for (const e of f.edges) {
        expect(f.nodes[e.f], `${f.label} edge from ${e.f}`).toBeDefined()
        expect(f.nodes[e.t], `${f.label} edge to ${e.t}`).toBeDefined()
      }
      expect(new Set(f.nodes.map((n) => n.name)).size).toBe(f.nodes.length)
    }
  })
})
