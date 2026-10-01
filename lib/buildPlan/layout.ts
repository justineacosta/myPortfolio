import type { PlanEdge } from '../../data/buildPlan.ts'

/** The canvas grid, in px: column and row pitch, node size, stage padding, and room for a label under the last row. */
export const GEOM = { col: 156, row: 116, node: 56, padX: 48, padY: 28, label: 44 } as const

export type Placed = { col: number; row: number; x: number; y: number }
export type LaidEdge = PlanEdge & { d: string; mid: [number, number]; len: number }
/**
 * One way through a workflow, from a start to an end, as the run balls see it:
 * the line a ball follows, its length in px, how far along each step's centre
 * is (`stops`), and where along the line each connector begins and ends
 * (`spans`: [edge index, from, to]).
 */
export type Route = { nodes: string[]; run: string; length: number; stops: [string, number][]; spans: [number, number, number][] }
export type Layout = { nodes: Record<string, Placed>; edges: LaidEdge[]; width: number; height: number; main: string[]; run: string; routes: Route[] }

const round = (n: number) => Math.round(n * 10) / 10

/** A cubic Bézier's length, walked in 32 straight steps: close enough to time a ball by. */
function curveLength(p: number[][]): number {
  const at = (t: number) => {
    const u = 1 - t
    return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k])
  }
  let len = 0
  let prev = at(0)
  for (let i = 1; i <= 32; i++) {
    const next = at(i / 32)
    len += Math.hypot(next[0] - prev[0], next[1] - prev[1])
    prev = next
  }
  return len
}

/**
 * Places an n8n-style canvas, left to right (spec §4.2). A node's column is
 * its longest path from a start. Its first way out stays on its row, and
 * every other branch opens a new row below everything placed so far, so two
 * nodes can never share a spot. `routes` lists every way from a start to an
 * end, the main one (always the first way out) first; `main` and `run` are
 * that main route's steps and line.
 */
export function layout({ nodes, edges }: { nodes: { id: string }[]; edges: PlanEdge[] }): Layout {
  const ids = nodes.map((n) => n.id)
  const known = new Set(ids)
  if (known.size !== ids.length) throw new Error('Two nodes share an id')
  for (const e of edges) if (!known.has(e.from) || !known.has(e.to)) throw new Error(`Connector ${e.from} → ${e.to} names a missing node`)
  const outs = (id: string) => edges.filter((e) => e.from === id)

  const indeg = new Map(ids.map((id) => [id, 0]))
  for (const e of edges) indeg.set(e.to, indeg.get(e.to)! + 1)
  const roots = ids.filter((id) => indeg.get(id) === 0)

  const col = new Map(ids.map((id) => [id, 0]))
  const left = new Map(indeg)
  const queue = [...roots]
  let done = 0
  while (queue.length) {
    const id = queue.shift()!
    done++
    for (const e of outs(id)) {
      col.set(e.to, Math.max(col.get(e.to)!, col.get(id)! + 1))
      left.set(e.to, left.get(e.to)! - 1)
      if (left.get(e.to) === 0) queue.push(e.to)
    }
  }
  if (done !== ids.length || roots.length === 0) throw new Error('The flow has a loop')

  const row = new Map<string, number>()
  let last = -1
  const visit = (id: string, r: number) => {
    row.set(id, r)
    outs(id).forEach((e, i) => {
      if (!row.has(e.to)) visit(e.to, i === 0 ? r : ++last)
    })
  }
  for (const r of roots) visit(r, ++last)

  const { col: C, row: R, node: N, padX, padY, label } = GEOM
  const placed: Record<string, Placed> = {}
  for (const id of ids) {
    const c = col.get(id)!
    const r = row.get(id)!
    placed[id] = { col: c, row: r, x: padX + c * C, y: padY + r * R }
  }
  const cy = (id: string) => placed[id].y + N / 2

  const laid: LaidEdge[] = edges.map((e) => {
    const x1 = placed[e.from].x + N
    const y1 = cy(e.from)
    const x2 = placed[e.to].x
    const y2 = cy(e.to)
    const dx = Math.max(28, (x2 - x1) / 2)
    const len = curveLength([[x1, y1], [x1 + dx, y1], [x2 - dx, y2], [x2, y2]])
    return { ...e, d: `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2], len }
  })

  // A route's line starts at its first step's centre, crosses each step
  // through its ports, and stops at its last step's centre.
  const measure = (path: string[]): Route => {
    let run = `M${placed[path[0]].x + N / 2} ${cy(path[0])}`
    let at = N / 2
    const stops: [string, number][] = [[path[0], 0]]
    const spans: [number, number, number][] = []
    for (let i = 1; i < path.length; i++) {
      const k = laid.findIndex((x) => x.from === path[i - 1] && x.to === path[i])
      run += `L${placed[path[i - 1]].x + N} ${cy(path[i - 1])}${laid[k].d.replace(/^M[^C]*/, '')}`
      spans.push([k, round(at), round(at + laid[k].len)])
      at += laid[k].len
      stops.push([path[i], round(at + N / 2)])
      at += N
    }
    const end = path[path.length - 1]
    run += `L${placed[end].x + N / 2} ${cy(end)}`
    return { nodes: path, run, length: round(path.length === 1 ? 0 : at - N / 2), stops, spans }
  }
  const routes: Route[] = []
  const walk = (path: string[]) => {
    const out = outs(path[path.length - 1])
    if (!out.length) routes.push(measure(path))
    for (const e of out) walk([...path, e.to])
  }
  for (const r of roots) walk([r])
  const main = routes[0].nodes
  const run = routes[0].run

  const maxCol = Math.max(...ids.map((id) => col.get(id)!))
  return {
    nodes: placed,
    edges: laid,
    width: padX * 2 + maxCol * C + N,
    height: padY * 2 + last * R + N + label,
    main,
    run,
    routes,
  }
}
