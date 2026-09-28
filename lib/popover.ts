const GAP = 10
const EDGE = 16

/**
 * Where a small panel opens from its button. It sits under the button, lined
 * up with its left edge. It goes above when there isn't room below, and it
 * never runs off screen.
 */
export function placePanel(
  button: Pick<DOMRect, 'left' | 'top' | 'bottom'>,
  panel: { width: number; height: number },
  view: { width: number; height: number },
): { top: number; left: number } {
  const left = Math.max(EDGE, Math.min(button.left, view.width - panel.width - EDGE))
  const below = button.bottom + GAP
  const top = below + panel.height <= view.height - EDGE ? below : Math.max(EDGE, button.top - GAP - panel.height)
  return { top, left }
}
