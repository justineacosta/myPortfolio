import type { Cable, Diagram } from '../../data/agents.ts'

/**
 * The diagrams’ grid, in px (spec 2026-10-01-agents-page §4.2): column and
 * row pitch, step size, side margin, the room under a step for its name, pin
 * size and gap, the bottom margin, and the room above row 0 (more when a
 * loop-back arcs over it).
 */
export const GEOM = { col: 168, row: 150, node: 56, padX: 64, label: 44, pin: 24, pinGap: 4, padB: 24, top: 32, topArcs: 120 } as const

type Pt = [number, number]
export type Placed = { x: number; y: number }
/** A cable as drawn: its SVG path, length, where its label sits, its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; start: Pt; end: Pt; pts: Pt[] }
/** One way through a diagram for a ball, timed like End-to-End’s routes (its client reads them). */
export type Route = { id: string; nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][] }
export type DiagramLayout = { nodes: Record<string, Placed>; pins: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

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
 * Places one diagram (spec §3.4–3.5, §4.2). Each step sits on the grid at
 * `at`. Its pins sit in one centred row under its name. Cables take one of four shapes:
 * - forward along a row: port to port;
 * - forward along a row with `under`: out under the step's name (or pins), dipping under the row;
 * - back along a row: an arc over the top, higher the further it reaches;
 * - straight down a column: from under the step's name into the top of the step below.
 * Anything else throws. Routes are the data's, measured along their cables.
 */
export function layoutDiagram(d: Diagram): DiagramLayout {
  const { col: C, row: R, node: N, padX, label, pin: P, pinGap, padB } = GEOM
  const { steps, cables: list, routes: defs } = d
  const ids = steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(steps.map((s) => [s.id, s]))
  for (const c of list) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)

  const back = (c: Cable) => byId.get(c.from)!.at[1] === byId.get(c.to)!.at[1] && byId.get(c.to)!.at[0] < byId.get(c.from)!.at[0]
  const top = list.some(back) ? GEOM.topArcs : GEOM.top
  const nodes: Record<string, Placed> = {}
  for (const s of steps) nodes[s.id] = { x: padX + s.at[0] * C, y: top + s.at[1] * R }
  const pins: Record<string, Placed> = {}
  for (const s of steps) {
    const row = s.pins ?? []
    const w = row.length * P + (row.length - 1) * pinGap
    row.forEach((p, i) => {
      pins[`${s.id}:${p.id}`] = { x: nodes[s.id].x + N / 2 - w / 2 + i * (P + pinGap), y: nodes[s.id].y + N + label + 2 }
    })
  }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  /** Just under a step's name, or under its pins when it has some. */
  const bottom = (id: string) => nodes[id].y + N + label - 4 + (byId.get(id)!.pins?.length ? P + 6 : 0)

  const cables: LaidCable[] = list.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    const span = t.at[0] - s.at[0]
    if (s.at[1] === t.at[1] && span > 0 && c.under) {
      const a: Pt = [cx(s.id), bottom(s.id)]
      const b: Pt = [cx(t.id), bottom(t.id)]
      const low = Math.max(a[1], b[1]) + 60
      return { ...c, ...curve(a, [a[0], low], [b[0], low], b) }
    }
    if (s.at[1] === t.at[1] && span > 0) {
      const a: Pt = [nodes[s.id].x + N, cy(s.id)]
      const b: Pt = [nodes[t.id].x, cy(t.id)]
      const dx = (b[0] - a[0]) / 2
      return { ...c, ...curve(a, [a[0] + dx, a[1]], [b[0] - dx, b[1]], b) }
    }
    if (s.at[1] === t.at[1] && span < 0) {
      const rise = 40 + 18 * -span
      const a: Pt = [cx(s.id), nodes[s.id].y]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      return { ...c, ...curve(a, [a[0], a[1] - rise], [b[0], b[1] - rise], b) }
    }
    if (span === 0 && t.at[1] > s.at[1]) {
      const a: Pt = [cx(s.id), bottom(s.id)]
      const b: Pt = [cx(t.id), nodes[t.id].y]
      const third = (b[1] - a[1]) / 3
      return { ...c, ...curve(a, [a[0], a[1] + third], [b[0], b[1] - third], b) }
    }
    throw new Error(`Cable ${c.from} → ${c.to} has no shape on this grid`)
  })

  const width = padX * 2 + Math.max(...steps.map((s) => s.at[0])) * C + N
  const height = Math.round(Math.max(...steps.map((s) => bottom(s.id)), ...cables.flatMap((c) => c.pts.map((p) => p[1] + 9))) + padB)

  // A ball starts at its first step's centre, runs along each cable and through each step's centre.
  const routes = defs.map((r): Route => {
    const hops = r.nodes.slice(1).map((to, i) => {
      const k = cables.findIndex((c) => c.kind !== 'index' && c.from === r.nodes[i] && c.to === to)
      if (k < 0) throw new Error(`Route ${r.id} has no cable ${r.nodes[i]} → ${to}`)
      return k
    })
    let pos: Pt = [cx(r.nodes[0]), cy(r.nodes[0])]
    let at = 0
    let run = `M${round(pos[0])} ${round(pos[1])}`
    const stops: [string, number][] = [[r.nodes[0], 0]]
    const spans: [number, number, number][] = []
    hops.forEach((k, i) => {
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
    return { id: r.id, nodes: r.nodes, run, length: round(at), stops, spans }
  })

  return { nodes, pins, cables, width, height, routes }
}
