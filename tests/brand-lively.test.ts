import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { KINDS, livelyCss } from '@/lib/brand/lively'
import { revealJs } from '@/lib/brand/render'
import { pageCss } from '@/lib/buildPlan/styles'
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
  const css = livelyCss()

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

  it('turns the tints and the glow off in high contrast, and all motion off when motion is reduced', () => {
    expect(css).toContain(':root[data-a11y-motion=true] [data-reveal]{opacity:1!important')
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

describe('the site’s glow', () => {
  const css = livelyCss()
  const site = readFileSync('app/globals.css', 'utf8')
  const rule = (re: RegExp) => re.exec(site)![0]

  it('copies the site’s own glow rules, word for word', () => {
    for (const re of [/^\.page-glow\{.*\}$/m, /^\.page-glow > \*\{.*\}$/m, /^@keyframes kDrift\{.*\}$/m]) expect(css).toContain(rule(re))
  })

  it('holds it still when motion is off or the device is slow, and hides it in high contrast and print', () => {
    expect(css).toContain(':root[data-a11y-motion=true] .page-glow > *{animation:none}')
    expect(css).toContain(':root[data-perf=low] .page-glow > *{animation:none}')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\{[^}]*\.page-glow > \*\{animation:none\}/)
    expect(css).toContain(':root[data-a11y-contrast=true] .page-glow{display:none}')
    expect(css).toMatch(/@media print\{[\s\S]*\.page-glow\{display:none\}/)
  })

  it('has replaced the tool-coloured hero glow, and lifts the content above the backdrop', () => {
    expect(css).not.toContain('hero::before')
    expect(css).not.toContain('--halo')
    expect(css).toContain('.page,.foot{position:relative;z-index:1}')
  })

  it('gets the site’s ambient green from the page tokens, in both themes', () => {
    const themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: { dark: {}, light: {} } }
    expect(pageCss(themes)).toContain(`--amb:${themes.dark.amb}`)
    expect(pageCss(themes)).toContain(`--amb:${themes.light.amb}`)
  })
})
