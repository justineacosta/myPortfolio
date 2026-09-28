const GAP = 10
const EDGE = 16

/**
 * Where a small panel opens from its button. It sits under the button, lined
 * up with its left edge, or above it when there isn't room below. When it fits
 * neither way (the largest text on a short window), it takes the side with
 * more room and scrolls inside (`maxHeight`), so it never covers its button.
 */
export function placePanel(
  button: Pick<DOMRect, 'left' | 'top' | 'bottom'>,
  panel: { width: number; height: number },
  view: { width: number; height: number },
): { top: number; left: number; maxHeight?: number } {
  const left = Math.max(EDGE, Math.min(button.left, view.width - panel.width - EDGE))
  const below = button.bottom + GAP
  const roomBelow = view.height - EDGE - below
  const roomAbove = button.top - GAP - EDGE
  if (panel.height <= roomBelow) return { top: below, left }
  if (panel.height <= roomAbove) return { top: button.top - GAP - panel.height, left }
  if (roomBelow >= roomAbove) return { top: below, left, maxHeight: roomBelow }
  return { top: EDGE, left, maxHeight: roomAbove }
}
