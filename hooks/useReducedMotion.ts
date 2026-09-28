'use client'

import { useSyncExternalStore } from 'react'
import { A11Y_EVENT } from '@/lib/a11y'
import { prefersReducedMotion } from '@/lib/motion'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  window.addEventListener(A11Y_EVENT, onChange)
  let mq: MediaQueryList | null = null
  try {
    mq = window.matchMedia(QUERY)
    mq.addEventListener('change', onChange)
  } catch {
    mq = null
  }
  return () => {
    window.removeEventListener(A11Y_EVENT, onChange)
    mq?.removeEventListener('change', onChange)
  }
}

/**
 * The live answer to "should this move?" (spec §11). It follows the OS
 * setting and the access menu's motion switch as either changes. The server
 * render assumes motion; the client corrects it straight after hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
