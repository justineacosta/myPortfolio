import type { AgenticFramework, Cable } from '../../data/agenticFramework.ts'

/**
 * The loop's grid, in px (spec §4.2): column and row pitch, step size, side
 * margin, the room above row 0 for the send-back arc, the room under a step
 * for its name, and the bottom margin.
 */
export const GEOM = { col: 168, row: 150, node: 56, padX: 64, top: 96, label: 44, padB: 24 } as const

type Pt = [number, number]
export type Placed = { x: number; y: number }
/** A cable as drawn: its SVG path, length, where its label sits, its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; start: Pt; end: Pt; pts: Pt[] }
/** One way round the loop for a ball, timed like End-to-End's routes (its client reads them). */
export type Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][]; loops: number }
export type LoopLayout = { nodes: Record<string, Placed>; pins: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

const round = (n: number) => Math.round(n * 10) / 10

/** One cubic Bézier from a to b: its path, its length, points along it, and its halfway point. */
function curve(a: Pt, c1: Pt, c2: Pt, b: Pt) {
  const at = (t: number): Pt => {
    const u = 1 - t
    return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]) as Pt
  }
  const pts: Pt[] = [a]
  let len = 0
  for (let i = 1; i <= 48; i++) {
    const p = at(i / 48)
    len += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1])
    pts.push(p)
  }
  const d = `M${round(a[0])} ${round(a[1])}C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(b[0])} ${round(b[1])}`
  return { d, len: round(len), pts, mid: at(0.5), start: a, end: b }
}

/**
 * Places the loop (spec §4.2). Each step sits on the grid at `at`; a pinned
 * rule sits at its card's top left. Cables are drawn one of four ways:
 * - along a row, left to right: port to port;
 * - back along a row: an arc over the top;
 * - down a row: out under the step's name, into the lower step's right side;
 * - up a row: out of the step's left side, up into the step from under its name.
 * Routes: every way from the start to the end that takes at most one
 * loop-back, where a run of dashed cables (fails, then becomes a rule) is one.
 */
export function layoutLoop(loop: AgenticFramework['loop']): LoopLayout {
  const { col: C, row: R, node: N, padX, top, label, padB } = GEOM
  const { steps, cables: list } = loop
  const ids = steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const c of list) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)

  const width = padX * 2 + Math.max(...steps.map((s) => s.at[0])) * C + N
  const height = top + Math.max(...steps.map((s) => s.at[1])) * R + N + label + padB
  const nodes: Record<string, Placed> = {}
  for (const s of steps) nodes[s.id] = { x: padX + s.at[0] * C, y: top + s.at[1] * R }
  const pins: Record<string, Placed> = {}
  for (const s of steps) if (s.rule) pins[s.id] = { x: nodes[s.id].x - 10, y: nodes[s.id].y - 10 }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  const under = (id: string) => nodes[id].y + N + label - 4

  const cables: LaidCable[] = list.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    if (s.at[1] === t.at[1] && t.at[0] > s.at[0]) {
      const a: Pt = [nodes[s.id].x + N, cy(s.id)]
      const b: Pt = [nodes[t.id].x, cy(t.id)]
      const dx = (b[0] - a[0]) / 2
      return { ...c, ...curve(a, [a[0] + dx, a[1]], [b[0] - dx, b[1]], b) }
    }
    if (s.at[1] === t.at[1]) {
      const a: Pt = [cx(s.id), nodes[s.id].y]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      return { ...c, ...curve(a, [a[0], a[1] - 70], [b[0], b[1] - 70], b) }
    }
    if (t.at[1] > s.at[1]) {
      const a: Pt = [cx(s.id), under(s.id)]
      const b: Pt = [nodes[t.id].x + N, cy(t.id)]
      return { ...c, ...curve(a, [a[0], b[1]], [a[0], b[1]], b) }
    }
    const a: Pt = [nodes[s.id].x, cy(s.id)]
    const b: Pt = [cx(t.id), under(t.id)]
    return { ...c, ...curve(a, [b[0], a[1]], [b[0], a[1]], b) }
  })

  const outs = new Map<string, number[]>()
  cables.forEach((c, k) => outs.set(c.from, [...(outs.get(c.from) ?? []), k]))
  type Found = { nodes: string[]; hops: number[]; loops: number }
  const found: Found[] = []
  const walk = (path: string[], hops: number[], loops: number) => {
    if (path.length > 64) return
    const out = outs.get(path[path.length - 1]) ?? []
    if (!out.length) {
      found.push({ nodes: path, hops, loops })
      return
    }
    for (const k of out) {
      const prev = hops.length ? cables[hops[hops.length - 1]] : null
      const starts = cables[k].kind === 'loop' && prev?.kind !== 'loop'
      if (starts && loops >= 1) continue
      walk([...path, cables[k].to], [...hops, k], loops + (starts ? 1 : 0))
    }
  }
  for (const s of steps) if (!list.some((c) => c.to === s.id)) walk([s.id], [], 0)

  // A ball starts at its first step's centre, runs along each cable and through each step's centre.
  const measure = (r: Found): Route => {
    let pos: Pt = [cx(r.nodes[0]), cy(r.nodes[0])]
    let at = 0
    let run = `M${round(pos[0])} ${round(pos[1])}`
    const stops: [string, number][] = [[r.nodes[0], 0]]
    const spans: [number, number, number][] = []
    r.hops.forEach((k, i) => {
      const c = cables[k]
      at += Math.hypot(c.start[0] - pos[0], c.start[1] - pos[1])
      run += `L${round(c.start[0])} ${round(c.start[1])}${c.d.replace(/^M[^C]*/, '')}`
      spans.push([k, round(at), round(at + c.len)])
      at += c.len
      const next: Pt = [cx(r.nodes[i + 1]), cy(r.nodes[i + 1])]
      at += Math.hypot(next[0] - c.end[0], next[1] - c.end[1])
      run += `L${round(next[0])} ${round(next[1])}`
      stops.push([r.nodes[i + 1], round(at)])
      pos = next
    })
    return { nodes: r.nodes, run, length: round(at), stops, spans, loops: r.loops }
  }

  return { nodes, pins, cables, width, height, routes: found.map(measure) }
}
