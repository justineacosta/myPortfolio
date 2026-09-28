'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { shouldRunContour } from '@/lib/background'
import { onMotionChange, prefersReducedMotion } from '@/lib/motion'
import { getPerfTier, PERF_TIER_EVENT, watchFrameHealth } from '@/lib/perf'

const ContourCanvas = dynamic(() => import('./ContourCanvas'), { ssr: false })

/**
 * Decides whether the WebGL contour runs (spec §5): only after `load`, at idle
 * time, on a fine pointer, with motion allowed and the perf tier above low.
 * Also starts the frame-health watcher that may step the tier down.
 */
export default function BackgroundGate() {
  const [on, setOn] = useState(false)
  const fail = useCallback(() => setOn(false), [])

  useEffect(() => {
    const allowed = () =>
      shouldRunContour({
        reducedMotion: prefersReducedMotion(),
        coarsePointer: window.matchMedia('(pointer: coarse) and (hover: none)').matches,
        tier: getPerfTier(),
      })

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    let idleId: number | undefined
    const start = () => {
      if (!allowed()) return
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setOn(allowed()), { timeout: 3000 })
      else idleId = window.setTimeout(() => setOn(allowed()), 1500)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    const recheck = () => setOn(allowed())
    window.addEventListener(PERF_TIER_EVENT, recheck)
    const offMotion = onMotionChange(recheck)
    void watchFrameHealth()

    return () => {
      window.removeEventListener('load', start)
      window.removeEventListener(PERF_TIER_EVENT, recheck)
      offMotion()
      if (idleId !== undefined) {
        const c = window as Window & { cancelIdleCallback?: (id: number) => void }
        if (c.cancelIdleCallback) c.cancelIdleCallback(idleId)
        else window.clearTimeout(idleId)
      }
    }
  }, [])

  return on ? <ContourCanvas onFail={fail} /> : null
}
