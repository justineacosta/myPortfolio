import { describe, expect, it } from 'vitest'
import { KINDS, livelyCss } from '@/lib/brand/lively'
import { themeHeadJs } from '@/lib/brand/render'
import { pageCss } from '@/lib/buildPlan/styles'
import { readContrast, readTokens } from '@/lib/tokens'

const themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }

describe('light by default', () => {
  const css = pageCss(themes)
  it('puts the light palette on bare :root and dark only under data-theme=dark, with no device block', () => {
    expect(css).toContain(`:root{--bg:${themes.light.bg};`)
    expect(css).toMatch(/:root\{[^}]*color-scheme:light/)
    expect(css).toContain(`:root[data-theme=dark]{--bg:${themes.dark.bg};`)
    expect(css).not.toContain('prefers-color-scheme')
  })

  it('turns up contrast for light unless the page is dark, and for dark only when it is', () => {
    expect(css).toContain(`:root[data-a11y-contrast=true]:not([data-theme=dark]){--ink2:${themes.contrast.light.ink2}`)
    expect(css).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${themes.contrast.dark.ink2}`)
  })

  it('gives the lively layer the same light-first blocks', () => {
    const lively = livelyCss()
    expect(lively).toContain(`:root{--k-trigger:${KINDS.light.trigger}`)
    expect(lively).toContain(`:root[data-theme=dark]{--k-trigger:${KINDS.dark.trigger}`)
    expect(lively).not.toContain('prefers-color-scheme')
  })
})

/** Runs the head script against stand-ins for the page, its frame parent and storage; returns the page's data attributes. */
function runAll(o: { framed?: boolean; host?: string; saved?: string | null; blocked?: boolean; perf?: string | null }) {
  const el = { dataset: {} as Record<string, string> }
  const win: { parent?: unknown } = {}
  win.parent = o.framed ? { document: { documentElement: { dataset: o.host === undefined ? {} : { theme: o.host } } } } : win
  const store = (key: string, value: string | null | undefined) => ({
    getItem: (k: string) => {
      if (o.blocked) throw new Error('blocked')
      return k === key ? (value ?? null) : null
    },
  })
  new Function('window', 'document', 'localStorage', 'sessionStorage', themeHeadJs())(win, { documentElement: el }, store('kraft-theme', o.saved), store('kraft-perf', o.perf))
  return el.dataset
}
const run = (o: Parameters<typeof runAll>[0]) => runAll(o).theme

describe('the head script', () => {
  it('opens a page on its own light, unless the visitor saved dark on the portfolio', () => {
    expect(run({})).toBe('light')
    expect(run({ saved: 'dark' })).toBe('dark')
    expect(run({ saved: 'light' })).toBe('light')
    expect(run({ blocked: true })).toBe('light')
  })

  it('inside the site’s dialog, starts in the site’s theme: dark unless the site says light', () => {
    expect(run({ framed: true, host: 'light' })).toBe('light')
    expect(run({ framed: true, host: 'dark' })).toBe('dark')
    expect(run({ framed: true })).toBe('dark')
    expect(run({ framed: true, host: 'light', saved: 'dark' })).toBe('light')
  })

  it('on its own, carries the site’s saved performance setting, so a slow device keeps the backdrop still', () => {
    expect(runAll({ perf: 'low' }).perf).toBe('low')
    expect(runAll({ perf: 'mid' }).perf).toBe('mid')
    expect(runAll({ perf: 'high' }).perf).toBeUndefined()
    expect(runAll({}).perf).toBeUndefined()
    expect(runAll({ perf: 'low', blocked: true }).perf).toBeUndefined()
    // Inside the dialog the page script copies the site's own attribute instead.
    expect(runAll({ framed: true, perf: 'low' }).perf).toBeUndefined()
  })
})
