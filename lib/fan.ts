/**
 * The Funnels and sites card's fan (Kraft Projects Board.dc.html:110-114):
 * five tiles on an arc, index 2 in front, turning one step at a time through
 * every sample site.
 */
export type Pose = { x: number; y: number; r: number }

/** Kraft's arc, left to right: offset from the centre (px), drop (px), tilt (deg). */
export const POSES: Pose[] = [
  { x: -112, y: 26, r: -26 },
  { x: -58, y: 7, r: -13 },
  { x: 0, y: 0, r: 0 },
  { x: 58, y: 7, r: 13 },
  { x: 112, y: 26, r: 26 },
]
export const FAN_SLOTS = POSES.length
export const FRONT = 2
/** Just off each end of the arc: where a site goes as it leaves, and waits before it enters. */
export const OFF: Record<'left' | 'right', Pose> = {
  left: { x: -160, y: 50, r: -38 },
  right: { x: 160, y: 50, r: 38 },
}
/** How long each site holds the front before the fan turns (ms). */
export const SPIN_MS = 3000

/**
 * Where `site` sits after the fan has turned `turn` steps through `total`
 * sites: an arc slot 0-4, 'left' if it has just left, or 'right' while it
 * waits to come in. Each turn moves every site one slot to the left.
 */
export function slotOf(site: number, turn: number, total: number): number | 'left' | 'right' {
  const k = (((site - turn) % total) + total) % total
  if (k < FAN_SLOTS) return k
  return k === total - 1 ? 'left' : 'right'
}

/** The arc slot closest to a pointer `dx` px from the fan's centre, with the fan spread by `spread`. */
export function nearestSlot(dx: number, spread = 1): number {
  let best = 0
  POSES.forEach((p, i) => {
    if (Math.abs(p.x * spread - dx) < Math.abs(POSES[best].x * spread - dx)) best = i
  })
  return best
}

/** How long the pointer rests on the front tile before its page starts scrolling (ms). */
export const PEEK_DELAY_MS = 500
/** How far the fan opens out while a pointer is over it. */
export const SPREAD = 1.14
/** How long a scrubbed site stays in front after the finger lifts (ms). */
export const TOUCH_HOLD_MS = 1200
/** A finger that moves further than this is scrubbing, not tapping (px). */
export const TAP_SLOP_PX = 8
/** How far the fan tilts toward the pointer at its edges (deg). */
export const TILT_DEG = { x: 4, y: 6 }
/** How soon after a swipe a click still counts as the swipe's own, and is ignored (ms). */
export const SWIPE_CLICK_MS = 400
