import { motionReduced } from './a11y'

/** One answer for "should this move?": the OS setting or the a11y switch. */
export function prefersReducedMotion(): boolean {
  let os = false
  try {
    os = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    os = false
  }
  return os || motionReduced()
}
