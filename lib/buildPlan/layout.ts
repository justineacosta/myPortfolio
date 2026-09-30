import type { PlanEdge, PlanNode } from '../../data/buildPlan.ts'

/** The canvas grid, in px: column and row pitch, node size, stage padding, and room for a label under the last row. */
export const GEOM = { col: 156, row: 116, node: 56, padX: 48, padY: 28, label: 44 } as const

export type Placed = { col: number; row: number; x: number; y: number }
export type LaidEdge = PlanEdge & { d: string; mid: [number, number] }
export type Layout = { nodes: Record<string, Placed>; edges: LaidEdge[]; width: number; height: number; main: string[]; run: string }

/**
 * Places an n8n-style canvas, left to right (spec §4.2). A node's column is
 * its longest path from a start. Its first way out stays on its row, and
 * every other branch opens a new row below everything placed so far, so two
 * nodes can never share a spot. `main` follows the first way out from the
 * first start; `run` is that path as one SVG line for the live-run dot.
 */
export function layout({ nodes, edges }: { nodes: PlanNode[]; edges: PlanEdge[] }): Layout {
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
    return { ...e, d: `M${x1} ${y1}C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`, mid: [(x1 + x2) / 2, (y1 + y2) / 2] }
  })

  const main = [roots[0]]
  for (let next = outs(roots[0])[0]; next; next = outs(next.to)[0]) main.push(next.to)
  let run = `M${placed[main[0]].x + N / 2} ${cy(main[0])}`
  for (let i = 1; i < main.length; i++) {
    const e = laid.find((x) => x.from === main[i - 1] && x.to === main[i])!
    run += `L${placed[main[i - 1]].x + N} ${cy(main[i - 1])}${e.d.replace(/^M[^C]*/, '')}`
  }
  const end = main[main.length - 1]
  run += `L${placed[end].x + N / 2} ${cy(end)}`

  const maxCol = Math.max(...ids.map((id) => col.get(id)!))
  return {
    nodes: placed,
    edges: laid,
    width: padX * 2 + maxCol * C + N,
    height: padY * 2 + last * R + N + label,
    main,
    run,
  }
}
