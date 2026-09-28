import { describe, expect, it } from 'vitest'
import { wheelToX } from '@/lib/wheel'

describe('wheelToX (Kraft svcWheel, KraftScreens.dc.html:1080-1092)', () => {
  it('turns a vertical wheel into 1.1x sideways travel', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 0, max: 500 })).toBeCloseTo(110)
  })

  it('stops at the far end', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 480, max: 500 })).toBe(500)
  })

  it('hands the wheel back to the page at the far end', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 500, max: 500 })).toBeNull()
  })

  it('hands the wheel back to the page at the start when scrolling up', () => {
    expect(wheelToX({ dx: 0, dy: -100, left: 0, max: 500 })).toBeNull()
  })

  it('leaves sideways gestures to the browser', () => {
    expect(wheelToX({ dx: 120, dy: 20, left: 0, max: 500 })).toBeNull()
  })

  it('does nothing when the row does not overflow', () => {
    expect(wheelToX({ dx: 0, dy: 100, left: 0, max: 0 })).toBeNull()
  })
})
