/**
 * Kraft's svcWheel (KraftScreens.dc.html:1080-1092): a mostly-vertical wheel
 * over a sideways row moves the row by 1.1x the delta. Returns the next
 * scrollLeft, or null when the page should have the wheel instead: sideways
 * gestures, rows that don't overflow, and a row already at the end it is
 * being pushed towards, within 1px (so the row never traps the page, even
 * where scrollLeft is fractional: Firefox, zoom).
 */
export function wheelToX({ dx, dy, left, max }: { dx: number; dy: number; left: number; max: number }): number | null {
  if (Math.abs(dy) <= Math.abs(dx) || max <= 0) return null
  const next = Math.max(0, Math.min(max, left + dy * 1.1))
  return Math.abs(next - left) < 1 ? null : next
}
