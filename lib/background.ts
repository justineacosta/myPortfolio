import type { PerfTier } from './perf'

export type ContourEnv = { reducedMotion: boolean; coarsePointer: boolean; tier: PerfTier }

/** Spec §5/§8: never on touch, never with reduced motion, never at the low tier. */
export function shouldRunContour(env: ContourEnv): boolean {
  return !env.reducedMotion && !env.coarsePointer && env.tier !== 'low'
}
