/**
 * Geometry of kape's drum (reference/kapeportfolio/src/components/FunnelBarrel.tsx),
 * kept pure so it can be tested. It is a wide, short cylinder of 3:4 cards,
 * drawn through a contained fade band. The top ring is wider than the rest
 * (the tornado look).
 */
export const COLS = 16
export const RADIUS = 11
export const MIN_ROWS = 6

export type DrumLayout = {
  cols: number
  rows: number
  radius: number
  anglePer: number
  thetaLen: number
  cardH: number
  rowGap: number
  towerH: number
}

export function drumLayout(count: number): DrumLayout {
  const rows = Math.max(MIN_ROWS, Math.ceil(count / COLS))
  const anglePer = (Math.PI * 2) / COLS
  const thetaLen = anglePer * 0.9
  const cardH = thetaLen * RADIUS * (4 / 3)
  const rowGap = cardH * 1.04
  return { cols: COLS, rows, radius: RADIUS, anglePer, thetaLen, cardH, rowGap, towerH: rows * rowGap }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/**
 * Which site fills each slot. Every site appears once first. The repeats then
 * step by a stride coprime with the count, so they spread evenly and never
 * line up in a column.
 */
export function slotOrder(count: number, slots: number): number[] {
  if (count <= 0) return []
  let stride = Math.max(1, Math.round(count / 3))
  while (count > 1 && gcd(stride, count) !== 1) stride++
  return Array.from({ length: slots }, (_, k) => (k < count ? k : (k * stride) % count))
}

/** Wraps a card's height into the tower, so the vertical drift loops forever. */
export function wrapY(y: number, towerH: number): number {
  return ((((y + towerH / 2) % towerH) + towerH) % towerH) - towerH / 2
}

/**
 * How a card at `worldY` is drawn. It fades out beyond the visible band. The
 * cone taper runs from 0.6 at the bottom of the band to 1.1 at the top, which
 * widens the top ring.
 */
export function cardLook(worldY: number, rowGap: number): { opacity: number; taper: number } {
  const vis = rowGap * 0.7
  const fade = rowGap * 0.85
  const cone = Math.min(1, Math.max(0, (worldY + vis + fade) / (2 * (vis + fade))))
  return {
    opacity: Math.min(1, Math.max(0, (vis + fade - Math.abs(worldY)) / fade)),
    taper: 0.6 + 0.5 * cone,
  }
}
