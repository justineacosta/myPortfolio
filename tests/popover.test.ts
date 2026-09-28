import { describe, expect, it } from 'vitest'
import { placePanel } from '@/lib/popover'

const button = (left: number, top: number) => ({ left, top, bottom: top + 38 })
const panel = { width: 300, height: 400 }
const view = { width: 1000, height: 800 }

describe('placePanel', () => {
  it('opens under the button, lined up with its left edge', () => {
    expect(placePanel(button(100, 50), panel, view)).toEqual({ top: 98, left: 100 })
  })
  it('opens above the button when there is no room below', () => {
    expect(placePanel(button(100, 700), panel, view)).toEqual({ top: 290, left: 100 })
  })
  it('never runs off either side of the screen', () => {
    expect(placePanel(button(900, 50), panel, view).left).toBe(684)
    expect(placePanel(button(2, 50), panel, view).left).toBe(16)
  })
  it('when it fits neither way, takes the side with more room below and scrolls inside', () => {
    expect(placePanel(button(100, 300), { width: 300, height: 600 }, view)).toEqual({ top: 348, left: 100, maxHeight: 436 })
  })
  it('when it fits neither way, takes the side with more room above and scrolls inside', () => {
    expect(placePanel(button(100, 500), { width: 300, height: 600 }, view)).toEqual({ top: 16, left: 100, maxHeight: 474 })
  })
  it('never covers its button', () => {
    for (const top of [100, 300, 420, 500, 700]) {
      const b = button(100, top)
      const p = placePanel(b, { width: 300, height: 600 }, view)
      const bottom = p.top + (p.maxHeight ?? 600)
      expect(bottom <= b.top || p.top >= b.bottom, `button at ${top}`).toBe(true)
    }
  })
})
