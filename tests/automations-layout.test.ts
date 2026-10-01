import { describe, expect, it } from 'vitest'
import { automations } from '@/data/automations'
import { layout } from '@/lib/buildPlan/layout'
import { layoutFlow, SIDE, transpose } from '@/lib/automations/layout'

const pair = { nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ from: 'a', to: 'b' }] }

describe('transpose', () => {
  it('turns a left-to-right canvas top to bottom: x and y swap, in nodes, wires, labels and ball lines', () => {
    const l = layout(pair)
    const t = transpose(l)
    expect(l.edges[0].d).toBe('M104 56C154 56 154 56 204 56')
    expect(t.edges[0].d).toBe('M56 104C56 154 56 154 56 204')
    expect(t.nodes.a).toMatchObject({ x: 28, y: 48 })
    expect(t.nodes.b).toMatchObject({ x: 28, y: 204 })
    expect(t.edges[0].mid).toEqual([l.edges[0].mid[1], l.edges[0].mid[0]])
    expect(t.routes[0].run).toBe(l.routes[0].run.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, '$2 $1'))
    expect(t.routes[0].length).toBe(l.routes[0].length)
  })

  it('makes room beside the steps for their labels instead of under them', () => {
    const l = layout(pair)
    const t = transpose(l)
    expect(t.height).toBe(l.width)
    expect(t.width).toBe(l.height - 44 + SIDE)
  })
})

describe('layoutFlow', () => {
  it('stacks the Zap top to bottom and keeps n8n and Make left to right', () => {
    const [hp, , me, mw] = automations.flows.map(layoutFlow)
    const xs = Object.values(mw.nodes).map((p) => p.x)
    const ys = automations.flows[3].nodes.map((n) => mw.nodes[n.id].y)
    expect(new Set(xs).size).toBe(1)
    expect(ys).toEqual([...ys].sort((p, q) => p - q))
    expect(hp.width).toBeGreaterThan(hp.height)
    expect(me.width).toBeGreaterThan(me.height)
  })
})
