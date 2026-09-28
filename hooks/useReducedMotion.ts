'use client'

import { useSyncExternalStore } from 'react'
import { onMotionChange, prefersReducedMotion } from '@/lib/motion'

/**
 * The live answer to "should this move?" (spec §11). It follows the OS
 * setting and the access menu's motion switch as either changes. The server
 * render assumes motion; the client corrects it straight after hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(onMotionChange, prefersReducedMotion, () => false)
}
