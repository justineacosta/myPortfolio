import { describe, expect, it } from 'vitest'
import { cardLook, drumLayout, slotOrder, wrapY } from '@/lib/drum'

describe('drum geometry', () => {
  it("keeps kape's wide, short drum: 16 columns, at least 6 rows, 3:4 cards", () => {
    const L = drumLayout(8)
    expect(L.cols).toBe(16)
    expect(L.rows).toBe(6)
    expect(L.cardH / (L.thetaLen * L.radius)).toBeCloseTo(4 / 3)
    expect(L.towerH).toBeCloseTo(L.rows * L.rowGap)
  })

  it('shows every site once before repeating, then spreads the repeats evenly', () => {
    const order = slotOrder(8, 96)
    expect(order.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    const counts = order.reduce<number[]>((c, i) => ((c[i] = (c[i] ?? 0) + 1), c), [])
    expect(counts).toEqual(Array(8).fill(12))
  })

  it('never repeats a site in the slot beside it', () => {
    const order = slotOrder(8, 96)
    expect(order.every((v, k) => k === 0 || v !== order[k - 1])).toBe(true)
  })

  it('wraps a card that drifts off one end back in at the other', () => {
    expect(wrapY(51, 100)).toBeCloseTo(-49)
    expect(wrapY(-51, 100)).toBeCloseTo(49)
    expect(wrapY(10, 100)).toBeCloseTo(10)
  })

  it('fades cards out beyond the band and widens the top ring', () => {
    const gap = 2
    expect(cardLook(0, gap).opacity).toBe(1)
    expect(cardLook(10, gap).opacity).toBe(0)
    expect(cardLook(1.4, gap).taper).toBeGreaterThan(cardLook(-1.4, gap).taper)
  })

  it('has nothing to lay out without sites', () => {
    expect(slotOrder(0, 96)).toEqual([])
  })
})
