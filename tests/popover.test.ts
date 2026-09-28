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
  it('stays on screen when there is room neither above nor below', () => {
    expect(placePanel(button(100, 300), panel, { width: 1000, height: 500 }).top).toBe(16)
  })
})
