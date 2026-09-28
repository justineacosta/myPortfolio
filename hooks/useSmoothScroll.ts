'use client'

import { useEffect } from 'react'
import { SHELL_MIN_QUERY } from '@/lib/breakpoints'
import { onMotionChange, prefersReducedMotion } from '@/lib/motion'
import { getPanel, registerLenis } from '@/lib/scroller'

const TOUCH = '(pointer: coarse) and (hover: none)'

/**
 * kape's Lenis feel (0.9s, steep exponential ease) on the shell panel. Only
 * when the panel is the scroller (≥1100px), the pointer is fine, and motion
 * is allowed. Phones and narrow windows keep native scroll. Rebuilt or torn
 * down when the breakpoint or the motion setting (OS or access menu) changes, so a resize
 * never leaves a dead scroller behind.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const desktop = window.matchMedia(SHELL_MIN_QUERY)
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
      // Belt and braces: Lenis swallows wheel events, so only take over a panel
      // that really is the scroller in the layout CSS is showing.
      if (getComputedStyle(panel).overflowY !== 'auto') return
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
    const offMotion = onMotionChange(onChange)
    return () => {
      seq++
      desktop.removeEventListener('change', onChange)
      offMotion()
      teardown()
    }
  }, [])
}
