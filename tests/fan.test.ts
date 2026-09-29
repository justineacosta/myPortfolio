import { describe, expect, it } from 'vitest'
import { FAN_SLOTS, FRONT, nearestSlot, POSES, slotOf } from '@/lib/fan'

describe('slotOf (where each site sits as the fan turns)', () => {
  it('puts the first five sites on the arc, in order, before it turns', () => {
    expect([0, 1, 2, 3, 4].map((s) => slotOf(s, 0, 8))).toEqual([0, 1, 2, 3, 4])
    expect(slotOf(5, 0, 8)).toBe('right')
    expect(slotOf(7, 0, 8)).toBe('left')
  })

  it('moves every site one slot left per turn: the leftmost leaves, the next waiting one enters on the right', () => {
    expect([1, 2, 3, 4, 5].map((s) => slotOf(s, 1, 8))).toEqual([0, 1, 2, 3, 4])
    expect(slotOf(0, 1, 8)).toBe('left')
    expect(slotOf(6, 1, 8)).toBe('right')
  })

  it('gives every site a turn at the front over one lap', () => {
    const fronts = Array.from({ length: 8 }, (_, turn) => [...Array(8).keys()].find((s) => slotOf(s, turn, 8) === FRONT))
    expect(new Set(fronts).size).toBe(8)
  })
})

describe('nearestSlot (which tile a pointer is over)', () => {
  it('picks the arc slot closest to the pointer, left to right', () => {
    expect(POSES).toHaveLength(FAN_SLOTS)
    expect(nearestSlot(-200)).toBe(0)
    expect(nearestSlot(-60)).toBe(1)
    expect(nearestSlot(4)).toBe(FRONT)
    expect(nearestSlot(60)).toBe(3)
    expect(nearestSlot(500)).toBe(4)
  })

  it('follows the fan when it is spread', () => {
    // 90px: unspread it is nearer slot 4 (112) than slot 3 (58); spread 1.2
    // they sit at 134.4 and 69.6, so it is nearer slot 3.
    expect(nearestSlot(90, 1)).toBe(4)
    expect(nearestSlot(90, 1.2)).toBe(3)
  })
})
