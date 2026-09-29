/** How far a scroll must travel, from where it last turned, before the phone bar hides or comes back. */
export const BAR_NUDGE = 6

/**
 * Whether the phone bar (components/shell/PhoneBar.tsx) shows after a scroll
 * from `from` to `y`: always near the top (within `barH`), hidden once the page
 * moves down, back as soon as it moves up. A move under BAR_NUDGE changes nothing.
 */
export function nextBarShown(shown: boolean, from: number, y: number, barH: number): boolean {
  if (y <= barH) return true
  if (y - from > BAR_NUDGE) return false
  if (from - y > BAR_NUDGE) return true
  return shown
}
