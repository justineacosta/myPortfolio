/**
 * The Kraft Method's run (components/services/Method.tsx), the loader's split
 * light (lib/intro.ts runPlan) at reading pace: the first icon bursts, then
 * the light splits round each card, its halves meet on the far side and lock
 * the card, and one dot runs the line to the next; each border and line fades
 * once the light is past it. The run plays once; when it is over every gate
 * stays locked.
 */

export type GateLook = 'lit' | 'locked' | 'waiting'
export type MethodSegment = { kind: 'burst' | 'around' | 'line'; i: number; start: number; end: number }

/**
 * Each card takes aroundMs + lineMs (2.5s, time to read it), slow round the
 * card and quick along the line. A border or line the light has finished
 * fades out over fadeMs: the light passes, it does not stay.
 */
export const METHOD = { burstMs: 350, aroundMs: 1900, lineMs: 600, fadeMs: 500, border: 1 }

/** How lit a stroke whose segment ends at `end` is at `ms`: full until then, fading out over fadeMs. */
export const methodFade = (ms: number, end: number) => Math.min(1, Math.max(0, 1 - (ms - end) / METHOD.fadeMs))

/** The run's timeline, in ms, for `gates` cards: the burst, then round each card and along the line to the next. */
export function methodPlan(gates: number): MethodSegment[] {
  const parts: Omit<MethodSegment, 'start' | 'end'>[] = [{ kind: 'burst', i: 0 }]
  for (let i = 0; i < gates; i++) {
    parts.push({ kind: 'around', i })
    if (i < gates - 1) parts.push({ kind: 'line', i })
  }
  let t = 0
  return parts.map((p) => {
    const start = t
    t += p.kind === 'burst' ? METHOD.burstMs : p.kind === 'around' ? METHOD.aroundMs : METHOD.lineMs
    return { ...p, start, end: t }
  })
}

/**
 * Where the run stands after `ms`: the segment it is on and how far through
 * (`f`), how many gates are locked, and the card the light is going round
 * (the first one through the burst; none on a line or once it is over).
 */
export function methodAt(ms: number, plan: MethodSegment[]) {
  const last = plan[plan.length - 1]
  const seg = ms >= last.end ? last : plan.find((s) => ms < s.end)!
  const f = Math.min(1, Math.max(0, (ms - seg.start) / (seg.end - seg.start)))
  const locked = plan.filter((s) => s.kind === 'around' && s.end <= ms).length
  const tracing = seg.kind === 'line' || ms >= last.end ? null : seg.i
  return { seg, f, locked, tracing }
}

/** How gate `i` looks: locked once its halves have met, lit while the light goes round it, else waiting. */
export function gateLook(i: number, locked: number, tracing: number | null): GateLook {
  if (i < locked) return 'locked'
  return i === tracing ? 'lit' : 'waiting'
}

/**
 * The two ways round a `w`×`h` card with corner radius `r`, along the middle
 * of its border, in the card's own coordinates. Across ('x', a row of cards):
 * from the left middle over the top (`a`) and under the bottom (`b`) to the
 * right middle. Down ('y', a stack): from the top middle round the left (`a`)
 * and the right (`b`) to the bottom middle.
 */
export function cardHalves(w: number, h: number, r: number, axis: 'x' | 'y') {
  const n = METHOD.border / 2
  const rr = r - n
  const [x0, x1, y0, y1] = [n, w - n, n, h - n]
  const arc = (sweep: 0 | 1, x: number, y: number) => `A ${rr} ${rr} 0 0 ${sweep} ${x} ${y}`
  if (axis === 'x') {
    const my = h / 2
    return {
      a: [`M ${x0} ${my}`, `L ${x0} ${y0 + rr}`, arc(1, x0 + rr, y0), `L ${x1 - rr} ${y0}`, arc(1, x1, y0 + rr), `L ${x1} ${my}`].join(' '),
      b: [`M ${x0} ${my}`, `L ${x0} ${y1 - rr}`, arc(0, x0 + rr, y1), `L ${x1 - rr} ${y1}`, arc(0, x1, y1 - rr), `L ${x1} ${my}`].join(' '),
    }
  }
  const mx = w / 2
  return {
    a: [`M ${mx} ${y0}`, `L ${x0 + rr} ${y0}`, arc(0, x0, y0 + rr), `L ${x0} ${y1 - rr}`, arc(0, x0 + rr, y1), `L ${mx} ${y1}`].join(' '),
    b: [`M ${mx} ${y0}`, `L ${x1 - rr} ${y0}`, arc(1, x1, y0 + rr), `L ${x1} ${y1 - rr}`, arc(1, x1 - rr, y1), `L ${mx} ${y1}`].join(' '),
  }
}
