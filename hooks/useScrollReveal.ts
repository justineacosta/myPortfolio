'use client'

import { useEffect } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { getPanel } from '@/lib/scroller'

/**
 * Adds `.is-revealed` to each [data-reveal] element the first time it enters
 * view, and never hides it again. The observer's root is the panel when the
 * panel is the scroller (≥1100px), otherwise the viewport. `key` re-scans
 * after a route change brings in new elements.
 */
export function useScrollReveal(key: string) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)'))
    if (!els.length) return
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-revealed'))
      return
    }
    const panel = getPanel()
    const root = panel && getComputedStyle(panel).overflowY === 'auto' ? panel : null
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        }
      },
      { root, threshold: 0, rootMargin: '0px 0px -80px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
}
