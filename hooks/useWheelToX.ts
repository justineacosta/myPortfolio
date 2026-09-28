'use client'

import { useEffect, useRef } from 'react'
import { wheelToX } from '@/lib/wheel'

/**
 * Native, non-passive wheel listener (React's onWheel is passive, so it can't
 * preventDefault). stopPropagation keeps Lenis, which listens on the panel,
 * from also scrolling the page with the same wheel.
 */
export function useWheelToX<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const next = wheelToX({ dx: e.deltaX, dy: e.deltaY, left: el.scrollLeft, max: el.scrollWidth - el.clientWidth })
      if (next === null) return
      if (e.cancelable) e.preventDefault()
      e.stopPropagation()
      el.scrollTo({ left: next, behavior: 'smooth' })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  return ref
}
