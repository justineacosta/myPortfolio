import type { Flow } from '../../data/automations.ts'
import { GEOM, layout, type Layout } from '../buildPlan/layout.ts'

/** Room beside a Zap's steps for their labels, in px. */
export const SIDE = 240

/** Every "x y" pair in a path, swapped. The Build plan's paths are M, L and C commands of space-separated pairs. */
const swap = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, '$2 $1')

/**
 * The Build plan's left-to-right canvas, turned to read top to bottom (plan
 * §0.3, Zapier). Wires leave a step at its foot and enter the next at its
 * head; lengths are unchanged, so the balls keep their timing. The labels sit
 * beside the steps, so the room left under the last row moves to the right.
 */
export function transpose(l: Layout, side = SIDE): Layout {
  return {
    ...l,
    nodes: Object.fromEntries(Object.entries(l.nodes).map(([id, p]) => [id, { ...p, x: p.y, y: p.x }])),
    edges: l.edges.map((e) => ({ ...e, d: swap(e.d), mid: [e.mid[1], e.mid[0]] })),
    width: l.height - GEOM.label + side,
    height: l.width,
    run: swap(l.run),
    routes: l.routes.map((r) => ({ ...r, run: swap(r.run) })),
  }
}

/** A flow's canvas: Zapier top to bottom, n8n and Make left to right. */
export const layoutFlow = (f: Flow): Layout => (f.platform === 'zapier' ? transpose(layout(f)) : layout(f))
