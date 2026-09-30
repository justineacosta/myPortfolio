import type { Cable, EndToEnd, LaneId } from '../../data/endToEnd.ts'

/**
 * The graph's grid, in px (spec §4.2): column and row pitch, step size, lane
 * padding, the side channels (and the track spacing inside them), a lane's
 * label strip, the room under a step for its name, the gap between lanes (and
 * the slot spacing inside it), and the margin above the first lane.
 */
export const GEOM = { col: 148, row: 116, node: 56, padX: 48, channel: 56, track: 8, head: 56, label: 44, padB: 16, gap: 56, slot: 6, top: 24 } as const
/** Balls pick from at most this many routes, so the page stays small. */
export const MAX_ROUTES = 24

type Pt = [number, number]
export type Box = { x: number; y: number; w: number; h: number }
export type Placed = { x: number; y: number; lane: LaneId }
/** A cable as drawn: its SVG path, length, where its label sits (and which way it reads from there), its ends, and points along it. */
export type LaidCable = Cable & { d: string; len: number; mid: Pt; align: 'center' | 'start' | 'end'; start: Pt; end: Pt; pts: Pt[] }
/** One way through the graph for a ball, timed like the build plan's routes. */
export type Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][]; loops: number }
export type GraphLayout = { lanes: Record<LaneId, Box>; nodes: Record<string, Placed>; cables: LaidCable[]; width: number; height: number; routes: Route[] }

const round = (n: number) => Math.round(n * 10) / 10
const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01

function bezier(p: Pt[], t: number): Pt {
  const u = 1 - t
  return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]) as Pt
}

/** Draws a cable as an SVG path, measuring it and keeping points along it as it goes. */
class Pen {
  d: string
  len = 0
  pts: Pt[]
  at: Pt
  constructor(p: Pt) {
    this.d = `M${round(p[0])} ${round(p[1])}`
    this.pts = [p]
    this.at = p
  }
  line(p: Pt) {
    const l = Math.hypot(p[0] - this.at[0], p[1] - this.at[1])
    const n = Math.max(1, Math.ceil(l / 4))
    for (let i = 1; i <= n; i++) this.pts.push([this.at[0] + ((p[0] - this.at[0]) * i) / n, this.at[1] + ((p[1] - this.at[1]) * i) / n])
    this.d += `L${round(p[0])} ${round(p[1])}`
    this.len += l
    this.at = p
    return this
  }
  curve(c1: Pt, c2: Pt, p: Pt) {
    const q = [this.at, c1, c2, p]
    let prev = this.at
    for (let i = 1; i <= 32; i++) {
      const next = bezier(q, i / 32)
      this.len += Math.hypot(next[0] - prev[0], next[1] - prev[1])
      this.pts.push(next)
      prev = next
    }
    this.d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p[0])} ${round(p[1])}`
    this.at = p
    return this
  }
  /** Straight runs through an axis-aligned list of corners, each corner rounded. */
  through(points: Pt[], r = 10) {
    const pts = points.filter((p, i) => !same(p, i === 0 ? this.at : points[i - 1]))
    pts.forEach((p, i) => {
      const next = pts[i + 1]
      const a = this.at
      const inLen = Math.hypot(p[0] - a[0], p[1] - a[1])
      const outLen = next ? Math.hypot(next[0] - p[0], next[1] - p[1]) : 0
      const k = Math.min(r, inLen / 2, outLen / 2)
      if (!next || k < 0.5) {
        this.line(p)
        return
      }
      const before: Pt = [p[0] - ((p[0] - a[0]) / inLen) * k, p[1] - ((p[1] - a[1]) / inLen) * k]
      const after: Pt = [p[0] + ((next[0] - p[0]) / outLen) * k, p[1] + ((next[1] - p[1]) / outLen) * k]
      this.line(before).curve(p, p, after)
    })
    return this
  }
}

/**
 * Places the graph (spec §4.2). Lanes stack top to bottom, and each step sits
 * on its lane's grid at `at`. Cables are drawn one of five ways:
 * - next column (or same row): port to port;
 * - further along a lane across rows: along a bus above the first row or below the last;
 * - back along the same lane: an arc over the steps;
 * - down to the next lane: under the step, along the gap, down into the step;
 * - anywhere else: along the gaps and a side channel (left going up, right going down).
 * Routes: every way from a trigger to the end that takes at most one
 * loop-back, trimmed to MAX_ROUTES that between them pass every step and cable.
 */
export function layoutGraph(g: EndToEnd): GraphLayout {
  const { col: C, row: R, node: N, padX, channel: CH, track, head, label, padB, gap, slot, top } = GEOM
  const ids = g.steps.map((s) => s.id)
  if (new Set(ids).size !== ids.length) throw new Error('Two steps share an id')
  const byId = new Map(g.steps.map((s) => [s.id, s]))
  for (const c of g.cables) if (!byId.has(c.from) || !byId.has(c.to)) throw new Error(`Cable ${c.from} → ${c.to} names a missing step`)
  const laneIndex = new Map(g.lanes.map((l, i) => [l.id, i]))

  const width = CH * 2 + padX * 2 + Math.max(...g.steps.map((s) => s.at[0])) * C + N
  const lanes = {} as Record<LaneId, Box>
  const rows = new Map<LaneId, number>()
  let y = top
  for (const lane of g.lanes) {
    const last = Math.max(0, ...g.steps.filter((s) => s.lane === lane.id).map((s) => s.at[1]))
    rows.set(lane.id, last)
    const h = head + last * R + N + label + padB
    lanes[lane.id] = { x: CH, y, w: width - CH * 2, h }
    y += h + gap
  }
  const height = y

  const nodes: Record<string, Placed> = {}
  for (const s of g.steps) nodes[s.id] = { x: CH + padX + s.at[0] * C, y: lanes[s.lane].y + head + s.at[1] * R, lane: s.lane }
  const cx = (id: string) => nodes[id].x + N / 2
  const cy = (id: string) => nodes[id].y + N / 2
  const under = (id: string) => nodes[id].y + N + label - 4

  // Each cable crossing a gap gets its own height in it; each side-channel cable its own track.
  const used = new Map<LaneId, number>()
  const OFFSETS = [0, -1, 1, -2, 2, -3, 3]
  const gapBelow = (lane: LaneId) => {
    const k = used.get(lane) ?? 0
    used.set(lane, k + 1)
    return lanes[lane].y + lanes[lane].h + gap / 2 + OFFSETS[k % OFFSETS.length] * slot
  }
  const tracks = { left: 0, right: 0 }

  const cables: LaidCable[] = g.cables.map((c) => {
    const s = byId.get(c.from)!
    const t = byId.get(c.to)!
    const si = laneIndex.get(s.lane)!
    const ti = laneIndex.get(t.lane)!
    let pen: Pen
    let a: Pt
    let b: Pt
    let mid: Pt
    let align: LaidCable['align'] = 'center'
    if (si === ti && t.at[0] > s.at[0] && (t.at[0] - s.at[0] === 1 || t.at[1] === s.at[1])) {
      a = [nodes[s.id].x + N, cy(s.id)]
      b = [nodes[t.id].x, cy(t.id)]
      const dx = Math.max(28, (b[0] - a[0]) / 2)
      pen = new Pen(a).curve([a[0] + dx, a[1]], [b[0] - dx, b[1]], b)
      mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
    } else if (si === ti && t.at[0] > s.at[0]) {
      const middle = rows.get(s.lane)! / 2
      const far = Math.abs(s.at[1] - middle) >= Math.abs(t.at[1] - middle) ? s : t
      const topBus = far.at[1] < middle
      const busY = topBus ? lanes[s.lane].y + head - 18 : lanes[s.lane].y + head + rows.get(s.lane)! * R + N + label + 8
      const end = (id: string) => [cx(id), topBus ? nodes[id].y : under(id)] as Pt
      a = s === far ? end(s.id) : [nodes[s.id].x + N, cy(s.id)]
      b = t === far ? end(t.id) : [nodes[t.id].x, cy(t.id)]
      const via: Pt[] = []
      if (s !== far) via.push([a[0] + 20, a[1]])
      via.push([s === far ? a[0] : a[0] + 20, busY], [t === far ? b[0] : b[0] - 20, busY])
      if (t !== far) via.push([b[0] - 20, b[1]])
      pen = new Pen(a).through([...via, b])
      mid = [(a[0] + b[0]) / 2, busY]
    } else if (si === ti) {
      a = [cx(s.id), nodes[s.id].y]
      b = [cx(t.id), nodes[t.id].y]
      pen = new Pen(a).curve([a[0], a[1] - 40], [b[0], b[1] - 40], b)
      mid = [(a[0] + b[0]) / 2, a[1] - 30]
    } else if (ti === si + 1) {
      a = [cx(s.id), under(s.id)]
      b = [cx(t.id), nodes[t.id].y]
      const gy = gapBelow(s.lane)
      pen = new Pen(a).through([[a[0], gy], [b[0], gy], b])
      mid = [(a[0] + b[0]) / 2, gy]
    } else {
      const side = ti < si ? 'left' : 'right'
      const k = tracks[side]++
      const x = side === 'left' ? 8 + k * track : width - 8 - k * track
      a = [cx(s.id), under(s.id)]
      b = [cx(t.id), nodes[t.id].y]
      const g1 = gapBelow(s.lane)
      const g2 = gapBelow(g.lanes[ti - 1].id)
      pen = new Pen(a).through([[a[0], g1], [x, g1], [x, g2], [b[0], g2], b])
      mid = side === 'left' ? [x + 12, g1] : [x - 12, g1]
      align = side === 'left' ? 'start' : 'end'
    }
    return { ...c, d: pen.d, len: round(pen.len), mid, align, start: a, end: b, pts: pen.pts }
  })

  const outs = new Map<string, number[]>()
  cables.forEach((c, k) => outs.set(c.from, [...(outs.get(c.from) ?? []), k]))
  type Found = { nodes: string[]; hops: number[]; loops: number }
  const found: Found[] = []
  const walk = (path: string[], hops: number[], loops: number) => {
    if (found.length >= 5000) return
    const out = outs.get(path[path.length - 1]) ?? []
    if (!out.length) {
      found.push({ nodes: path, hops, loops })
      return
    }
    for (const k of out) {
      const isLoop = cables[k].kind === 'loop'
      if (isLoop && loops >= 1) continue
      walk([...path, cables[k].to], [...hops, k], loops + (isLoop ? 1 : 0))
    }
  }
  for (const s of g.steps) if (!g.cables.some((c) => c.to === s.id)) walk([s.id], [], 0)

  // Fewest routes that pass every step and cable, then an even spread of the rest.
  const need = new Set([...ids, ...cables.map((_, k) => `#${k}`)])
  const keys = (r: Found) => [...r.nodes, ...r.hops.map((k) => `#${k}`)]
  const chosen: Found[] = []
  while (need.size && chosen.length < MAX_ROUTES) {
    let best: Found | null = null
    let gain = 0
    for (const r of found) {
      if (chosen.includes(r)) continue
      const n = new Set(keys(r).filter((k) => need.has(k))).size
      if (n > gain) {
        best = r
        gain = n
      }
    }
    if (!best) break
    chosen.push(best)
    for (const k of keys(best)) need.delete(k)
  }
  const stride = Math.max(1, Math.floor(found.length / MAX_ROUTES))
  for (let i = 0; i < found.length && chosen.length < MAX_ROUTES; i += stride) if (!chosen.includes(found[i])) chosen.push(found[i])

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
      run += `L${round(c.start[0])} ${round(c.start[1])}${c.d.replace(/^M[^LC]*/, '')}`
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

  return { lanes, nodes, cables, width, height, routes: chosen.map(measure) }
}
