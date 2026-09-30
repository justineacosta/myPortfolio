import { describe, expect, it } from 'vitest'
import { plan, type PlanEdge, type PlanNode } from '@/data/buildPlan'
import { GEOM, layout } from '@/lib/buildPlan/layout'

const n = (id: string): PlanNode => ({ id, kind: 'action', label: id, sub: '', icon: 'Stack', type: 'x', settings: [['a', 'b']], what: 'A test step.' })
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
