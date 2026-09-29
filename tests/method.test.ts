import { describe, expect, it } from 'vitest'
import { cardHalves, gateLook, METHOD, methodAt, methodFade, methodPlan } from '@/lib/method'

const { burstMs, aroundMs, lineMs } = METHOD
/** When gate `i`'s halves meet. */
const lockAt = (i: number) => burstMs + i * (aroundMs + lineMs) + aroundMs

describe('methodPlan', () => {
  it('bursts, then goes round each card and along the line to the next, ending on the last card', () => {
    const plan = methodPlan(3)
    expect(plan.map((s) => `${s.kind}${s.i}`)).toEqual(['burst0', 'around0', 'line0', 'around1', 'line1', 'around2'])
    expect(plan[0].start).toBe(0)
    plan.slice(1).forEach((s, k) => expect(s.start).toBe(plan[k].end))
    expect(plan.at(-1)!.end).toBe(burstMs + 3 * aroundMs + 2 * lineMs)
  })

  it('takes about 2.5s a card, slower round the cards than along the lines', () => {
    expect(aroundMs + lineMs).toBe(2500)
    expect(aroundMs).toBeGreaterThan(lineMs * 2)
  })
})

describe('methodAt', () => {
  const plan = methodPlan(5)

  it('starts with the burst on the first card', () => {
    expect(methodAt(0, plan)).toMatchObject({ locked: 0, tracing: 0, seg: { kind: 'burst', i: 0 }, f: 0 })
  })

  it('traces a card, locks it as its halves meet, then runs the line to the next', () => {
    expect(methodAt(burstMs + aroundMs / 2, plan)).toMatchObject({ locked: 0, tracing: 0, seg: { kind: 'around', i: 0 }, f: 0.5 })
    expect(methodAt(lockAt(0) + lineMs / 2, plan)).toMatchObject({ locked: 1, tracing: null, seg: { kind: 'line', i: 0 }, f: 0.5 })
    expect(methodAt(lockAt(1) - 1, plan)).toMatchObject({ locked: 1, tracing: 1 })
  })

  it('ends with every gate locked, and stays there', () => {
    expect(methodAt(lockAt(4), plan)).toMatchObject({ locked: 5, tracing: null, f: 1 })
    expect(methodAt(Infinity, plan)).toMatchObject({ locked: 5, tracing: null, f: 1 })
  })
})

describe('methodFade', () => {
  it('keeps a stroke lit until its segment ends, then fades it out over fadeMs', () => {
    expect(methodFade(900, 1000)).toBe(1)
    expect(methodFade(1000, 1000)).toBe(1)
    expect(methodFade(1000 + METHOD.fadeMs / 2, 1000)).toBe(0.5)
    expect(methodFade(1000 + METHOD.fadeMs, 1000)).toBe(0)
    expect(methodFade(Infinity, 1000)).toBe(0)
  })
})

describe('gateLook', () => {
  it('locks the gates the light has closed, lights the one it is going round, and leaves the rest waiting', () => {
    expect([0, 1, 2, 3, 4].map((i) => gateLook(i, 2, 2))).toEqual(['locked', 'locked', 'lit', 'waiting', 'waiting'])
    expect([0, 1, 2, 3, 4].map((i) => gateLook(i, 2, null))).toEqual(['locked', 'locked', 'waiting', 'waiting', 'waiting'])
    expect([0, 1, 2, 3, 4].map((i) => gateLook(i, 5, null))).toEqual(['locked', 'locked', 'locked', 'locked', 'locked'])
  })
})

/** The first point of a path and its last. */
const ends = (d: string) => {
  const nums = d.match(/-?[\d.]+/g)!.map(Number)
  return [nums.slice(0, 2), nums.slice(-2)]
}

describe('cardHalves', () => {
  it('goes from the left middle over the top and under the bottom to the right middle, along the border', () => {
    const { a, b } = cardHalves(200, 300, 20, 'x')
    expect(ends(a)).toEqual([
      [0.5, 150],
      [199.5, 150],
    ])
    expect(ends(b)).toEqual(ends(a))
    expect(a).toContain(' 20 0.5 L 180 0.5 ')
    expect(b).toContain(' 20 299.5 L 180 299.5 ')
  })

  it('on phones goes from the top middle round the left and the right to the bottom middle', () => {
    const { a, b } = cardHalves(320, 240, 20, 'y')
    expect(ends(a)).toEqual([
      [160, 0.5],
      [160, 239.5],
    ])
    expect(ends(b)).toEqual(ends(a))
    expect(a).toContain(' 0.5 20 L 0.5 220 ')
    expect(b).toContain(' 319.5 20 L 319.5 220 ')
  })
})
