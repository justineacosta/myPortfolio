import { describe, expect, it } from 'vitest'
import { parseCssColor, readContourColors } from '@/lib/color'

describe('parseCssColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseCssColor('#FF0000')).toEqual([1, 0, 0])
  })
  it('parses 3-digit hex and trims', () => {
    expect(parseCssColor('  #0f0 ')).toEqual([0, 1, 0])
  })
  it("parses Kraft's --amb channel triplet", () => {
    const rgb = parseCssColor('150,205,175')!
    expect(rgb[0]).toBeCloseTo(150 / 255)
    expect(rgb[2]).toBeCloseTo(175 / 255)
  })
  it('rejects anything else', () => {
    expect(parseCssColor('red')).toBeNull()
    expect(parseCssColor('')).toBeNull()
    expect(parseCssColor('rgba(1,2,3,.5)')).toBeNull()
  })
})

describe('readContourColors', () => {
  it('reads --bg and --amb through the given reader', () => {
    const vars: Record<string, string> = { '--bg': '#050505', '--amb': '19,74,48' }
    const c = readContourColors((n) => vars[n] ?? '')!
    expect(c.bg[0]).toBeCloseTo(5 / 255)
    expect(c.line[1]).toBeCloseTo(74 / 255)
  })
  it('returns null when a token is missing', () => {
    expect(readContourColors(() => '')).toBeNull()
  })
})
