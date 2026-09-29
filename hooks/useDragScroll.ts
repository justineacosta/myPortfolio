'use client'

import { useEffect, useRef, type RefObject } from 'react'

/**
 * Lets a mouse drag a sideways strip, the way a finger already swipes it.
 * Touch and pen keep the browser's own scrolling. While a drag is on, the
 * element carries data-dragging, so CSS can pause scroll snapping and show
 * the grabbing cursor; letting go hands the strip back to snapping. Pass a
 * ref to share one element with another hook (useWheelToX).
 */
export function useDragScroll<T extends HTMLElement>(given?: RefObject<T | null>) {
  const own = useRef<T>(null)
  const ref = given ?? own
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let x: number | null = null
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      x = e.clientX
    }
    const onMove = (e: PointerEvent) => {
      if (x === null) return
      const dx = e.clientX - x
      x = e.clientX
      if (dx === 0) return
      if (!el.hasAttribute('data-dragging')) {
        el.setAttribute('data-dragging', '')
        window.getSelection()?.removeAllRanges()
      }
      el.scrollLeft -= dx
    }
    const onUp = () => {
      x = null
      el.removeAttribute('data-dragging')
    }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [ref])
  return ref
}
