import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { readTokens } from '@/lib/tokens'

/** WCAG 2 relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Every opaque surface small text sits on. */
const SURFACES = ['bg', 'frame', 's0', 's1', 's2', 's3', 'chip', 'hover', 'field']
/** The text tokens used for small type: AA asks 4.5:1. */
const TEXT = ['ink', 'ink2', 'ink3']

const css = () => readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')
/** The alert red for a theme: the light theme deepens the shared one. */
const danger = (theme: 'dark' | 'light') => {
  const pick = (re: RegExp) => css().match(re)?.[1]
  return theme === 'light' ? pick(/:root\[data-theme=light\]\{--danger:(#[0-9A-Fa-f]{6})/) : pick(/\n:root\{--danger:(#[0-9A-Fa-f]{6})/)
}

describe('text contrast (WCAG AA, 4.5:1)', () => {
  for (const theme of ['dark', 'light'] as const) {
    const t = readTokens(theme)
    for (const text of TEXT) {
      it(`${theme} --${text} on every surface`, () => {
        for (const s of SURFACES) expect(ratio(t[text], t[s]), `--${text} on --${s}`).toBeGreaterThanOrEqual(4.5)
      })
    }
    it(`${theme} --danger on every surface`, () => {
      const red = danger(theme)
      expect(red).toBeDefined()
      for (const s of SURFACES) expect(ratio(red!, t[s]), `--danger on --${s}`).toBeGreaterThanOrEqual(4.5)
    })
  }
})
