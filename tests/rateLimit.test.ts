import { describe, expect, it } from 'vitest'
import { rateLimit } from '@/lib/rateLimit'

describe('rateLimit', () => {
  it('lets `limit` hits through per key in a window, then refuses until it passes', () => {
    const hit = rateLimit({ limit: 2, windowMs: 1000 })
    expect([hit('a', 0), hit('a', 10), hit('a', 20)]).toEqual([true, true, false])
    // Another key has its own count.
    expect(hit('b', 20)).toBe(true)
    expect(hit('a', 1000)).toBe(true)
  })

  it('forgets keys whose window is over, so memory does not grow without end', () => {
    const hit = rateLimit({ limit: 1, windowMs: 1000 })
    for (let i = 0; i < 50; i++) hit(`ip${i}`, 0)
    hit('late', 5000)
    expect(hit.size()).toBe(1)
  })
})
