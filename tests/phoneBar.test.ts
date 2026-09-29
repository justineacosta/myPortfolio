import { describe, expect, it } from 'vitest'
import { BAR_NUDGE, nextBarShown } from '@/lib/phoneBar'

describe('nextBarShown: the phone bar hides on the way down and comes back on the way up', () => {
  const bar = 65

  it('always shows near the top of the page', () => {
    expect(nextBarShown(false, 200, 40, bar)).toBe(true)
    expect(nextBarShown(false, 10, 64, bar)).toBe(true)
  })

  it('hides once you scroll down past it', () => {
    expect(nextBarShown(true, 100, 100 + BAR_NUDGE + 1, bar)).toBe(false)
  })

  it('comes back as soon as you scroll up a little', () => {
    expect(nextBarShown(false, 900, 900 - BAR_NUDGE - 1, bar)).toBe(true)
  })

  it('ignores a nudge smaller than BAR_NUDGE either way', () => {
    expect(nextBarShown(true, 400, 400 + BAR_NUDGE - 1, bar)).toBe(true)
    expect(nextBarShown(false, 400, 400 - BAR_NUDGE + 1, bar)).toBe(false)
  })
})
