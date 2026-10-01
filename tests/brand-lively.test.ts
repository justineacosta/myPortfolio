import { describe, expect, it } from 'vitest'
import { KINDS, livelyCss } from '@/lib/brand/lively'
import { revealJs } from '@/lib/brand/render'
import { TOOLS } from '@/lib/brand/tools'
import { readTokens } from '@/lib/tokens'

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
const mix = (a: number[], b: number[], p: number) => a.map((v, i) => Math.round(v * p + b[i] * (1 - p)))

describe('livelyCss', () => {
  const css = livelyCss(['claude', 'telegram'])

  it('keeps every kind’s icon at 3:1 or more against its tinted card, in both themes', () => {
    for (const theme of ['dark', 'light'] as const) {
      const card = rgb(readTokens(theme).s2)
      for (const [kind, hex] of Object.entries(KINDS[theme])) expect(ratio(rgb(hex), mix(rgb(hex), card, 0.12)), `${theme} ${kind}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('defines the kind colours dark first, then for a light device, each theme attribute and print', () => {
    expect(css).toContain(`:root{--k-trigger:${KINDS.dark.trigger}`)
    expect(css).toContain(`@media (prefers-color-scheme: light){:root:not([data-theme=dark]){--k-trigger:${KINDS.light.trigger}`)
    expect(css).toContain(`:root[data-theme=light]{--k-trigger:${KINDS.light.trigger}`)
    expect(css).toContain(`:root[data-theme=dark]{--k-trigger:${KINDS.dark.trigger}`)
    expect(css).toMatch(new RegExp(`@media print\\{\\s*:root,:root\\[data-theme\\]\\{--k-trigger:${KINDS.light.trigger}`))
  })

  it('colours the hero glow from the two tools it is given', () => {
    expect(css).toContain(`--halo-a:${TOOLS.claude.brand}`)
    expect(css).toContain(`--halo-b:${TOOLS.telegram.brand}`)
  })

  it('turns the tints and the glow off in high contrast, and all motion off when motion is reduced', () => {
    expect(css).toContain(':root[data-a11y-contrast=true] .hero::before{display:none}')
    expect(css).toContain(':root[data-a11y-motion=true] [data-reveal]{opacity:1!important')
    expect(css).toContain(':root[data-a11y-motion=true] .hero::before{animation:none}')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\{[^}]*\.hero::before\{animation:none\}/)
    expect(css).toContain('@media (hover:hover) and (prefers-reduced-motion:no-preference)')
  })
})

describe('the reveal script', () => {
  const js = revealJs()
  it('stands down under reduced motion, the site’s motion setting, or without IntersectionObserver', () => {
    expect(js).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(js).toContain("root.dataset.a11yMotion === 'true'")
    expect(js).toContain("'IntersectionObserver' in window")
  })
  it('marks its targets and switches the page into reveal mode last', () => {
    expect(js).toContain("el.setAttribute('data-reveal', '')")
    expect(js.trim().split('\n').at(-2)).toContain("root.classList.add('reveal-on')")
  })
})
