'use client'

import { useSyncExternalStore } from 'react'
import { shouldRunContour } from '@/lib/background'
import { onMotionChange, prefersReducedMotion } from '@/lib/motion'
import { getPerfTier, PERF_TIER_EVENT } from '@/lib/perf'

const COARSE = '(pointer: coarse) and (hover: none)'

function allowed(): boolean {
  let coarse = false
  try {
    coarse = window.matchMedia(COARSE).matches
  } catch {
    coarse = false
  }
  return shouldRunContour({ reducedMotion: prefersReducedMotion(), coarsePointer: coarse, tier: getPerfTier() })
}

function subscribe(onChange: () => void) {
  const offMotion = onMotionChange(onChange)
  window.addEventListener(PERF_TIER_EVENT, onChange)
  return () => {
    offMotion()
    window.removeEventListener(PERF_TIER_EVENT, onChange)
  }
}

/**
 * Spec §5's gate for anything WebGL (the contour uses the same rule):
 * never on touch, never with reduced motion or the access menu's "motion
 * off", never at the low perf tier. Live to the OS setting, the access menu
 * and the perf tier, and `false` on the server, so the
 * pre-rendered page always has the plain version.
 */
export function useWebGLAllowed(): boolean {
  return useSyncExternalStore(subscribe, allowed, () => false)
}
