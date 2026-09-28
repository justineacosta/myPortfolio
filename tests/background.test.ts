import { describe, expect, it } from 'vitest'
import { shouldRunContour } from '@/lib/background'

const base = { reducedMotion: false, coarsePointer: false, tier: 'high' as const }

describe('shouldRunContour', () => {
  it('runs on a capable desktop', () => {
    expect(shouldRunContour(base)).toBe(true)
    expect(shouldRunContour({ ...base, tier: 'mid' })).toBe(true)
  })
  it('never runs for reduced motion, touch, or the low tier', () => {
    expect(shouldRunContour({ ...base, reducedMotion: true })).toBe(false)
    expect(shouldRunContour({ ...base, coarsePointer: true })).toBe(false)
    expect(shouldRunContour({ ...base, tier: 'low' })).toBe(false)
  })
})
