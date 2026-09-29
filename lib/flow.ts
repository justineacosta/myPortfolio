import type { FlowEdge } from '@/data/flows'

/**
 * Kraft's canvas (KraftScreens.dc.html:301), trimmed from 1180 to 1110 wide so
 * the nodes (centres 100-1010, 124px wide: 38-1072) sit in its middle. It is
 * centred in its frame, and scrolled sideways when the frame is narrower.
 */
export const FLOW_W = 1110
export const FLOW_H = 430
/** A node's width on the canvas (its label column). */
export const NODE_W = 124
/** Where the nodes of every flow lie across the canvas. */
export const FLOW_SPAN = { left: 38, right: 1072 }

/**
 * Where a frame `client` px wide (with `pad` px of padding each side) should
 * open its scroll so the nodes sit centred: only when the nodes fit but the
 * whole canvas does not. Otherwise null: a frame that fits the canvas centres
 * it with margins, and one too narrow for the nodes starts at the first node.
 */
export function centreScroll(client: number, pad: number): number | null {
  const scrollW = FLOW_W + pad * 2
  if (client >= scrollW || client < FLOW_SPAN.right - FLOW_SPAN.left) return null
  const x = Math.round(pad + (FLOW_SPAN.left + FLOW_SPAN.right) / 2 - client / 2)
  return Math.min(Math.max(x, 0), scrollW - client)
}
/** How far a hovered node rises, in px; its edges rise with it (…:1006-1009). */
export const LIFT = -6

/** Kraft's edgeD (…:968-972): a line, or a cubic when the edge has control points; `a` and `b` raise its two ends. */
export function edgePath(e: FlowEdge, a = 0, b = 0): string {
  const [fx, fy] = e.from
  const [tx, ty] = e.to
  if (e.c) return `M${fx},${fy + a} C${e.c[0]},${e.c[1]} ${e.c[2]},${e.c[3]} ${tx},${ty + b}`
  return `M${fx},${fy + a} L${tx},${ty + b}`
}

export type Lifts = Record<number, number>

/** One frame of Kraft's lift easing (…:1011-1020): 26% of the remaining way, snapping within 0.08px. */
export function stepLift(cur: Lifts, tgt: Lifts): { cur: Lifts; moving: boolean } {
  const next: Lifts = { ...cur }
  let moving = false
  for (const key of Object.keys(tgt)) {
    const i = Number(key)
    const t = tgt[i]
    const v = (cur[i] ?? 0) + (t - (cur[i] ?? 0)) * 0.26
    next[i] = Math.abs(t - v) < 0.08 ? t : v
    if (next[i] !== t) moving = true
  }
  return { cur: next, moving }
}

/** `i` modulo `n`, so stepping back from the first flow lands on the last. */
export const wrap = (i: number, n: number) => ((i % n) + n) % n
