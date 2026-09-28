import { A11Y_EVENT, motionReduced } from './a11y'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** One answer for "should this move?": the OS setting or the a11y switch. */
export function prefersReducedMotion(): boolean {
  let os = false
  try {
    os = window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    os = false
  }
  return os || motionReduced()
}

/** Calls `cb` whenever that answer may have changed: the access menu's switch, or the OS setting. Returns the unsubscribe. */
export function onMotionChange(cb: () => void): () => void {
  window.addEventListener(A11Y_EVENT, cb)
  let mq: MediaQueryList | null = null
  try {
    mq = window.matchMedia(REDUCED_MOTION_QUERY)
    mq.addEventListener('change', cb)
  } catch {
    mq = null
  }
  return () => {
    window.removeEventListener(A11Y_EVENT, cb)
    mq?.removeEventListener('change', cb)
  }
}
