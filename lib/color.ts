/** 0–1 channels, the form WebGL uniforms want. */
export type RGB = [number, number, number]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const TRIPLET = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/

/** Parses a token value: `#rgb`, `#rrggbb`, or Kraft's bare `r,g,b` (--amb). */
export function parseCssColor(value: string): RGB | null {
  const v = value.trim()
  const hex = HEX.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB
  }
  const t = TRIPLET.exec(v)
  if (t) return [t[1], t[2], t[3]].map((n) => Math.min(255, Number(n)) / 255) as RGB
  return null
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name)

/** The contour's ground is Kraft's --bg; its lines are Kraft's ambient green --amb. */
export function readContourColors(read: (name: string) => string = cssVar): { bg: RGB; line: RGB } | null {
  const bg = parseCssColor(read('--bg'))
  const line = parseCssColor(read('--amb'))
  return bg && line ? { bg, line } : null
}
