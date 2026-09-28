'use client'

import { useEffect } from 'react'
import { A11Y_EVENT } from '@/lib/a11y'
import { prefersReducedMotion } from '@/lib/motion'
import { getPanel, registerLenis } from '@/lib/scroller'

const DESKTOP = '(min-width: 1100px)'
const TOUCH = '(pointer: coarse) and (hover: none)'

/**
 * kape's Lenis feel (0.9s, steep exponential ease) on the shell panel. Only
 * when the panel is the scroller (≥1100px), the pointer is fine, and motion
 * is allowed. Phones and narrow windows keep native scroll. Rebuilt or torn
 * down when the breakpoint or the a11y motion switch changes, so a resize
 * never leaves a dead scroller behind.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP)
    let lenis: import('lenis').default | null = null
    let seq = 0

    const teardown = () => {
      lenis?.destroy()
      lenis = null
      registerLenis(null)
    }

    const sync = async () => {
      const run = ++seq
      teardown()
      if (!desktop.matches || prefersReducedMotion() || window.matchMedia(TOUCH).matches) return
      const panel = getPanel()
      const content = panel?.firstElementChild
      if (!panel || !(content instanceof HTMLElement)) return
      const { default: Lenis } = await import('lenis')
      if (run !== seq) return
      lenis = new Lenis({
        wrapper: panel,
        content,
        autoRaf: true,
        duration: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
        smoothWheel: true,
      })
      registerLenis(lenis)
    }

    void sync()
    const onChange = () => void sync()
    desktop.addEventListener('change', onChange)
    window.addEventListener(A11Y_EVENT, onChange)
    return () => {
      seq++
      desktop.removeEventListener('change', onChange)
      window.removeEventListener(A11Y_EVENT, onChange)
      teardown()
    }
  }, [])
}
