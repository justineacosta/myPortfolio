import { describe, expect, it } from 'vitest'
import { contourJs } from '@/lib/brand/render'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'
import { renderEndToEnd } from '@/lib/endToEnd/render'

describe('the pages’ contour script', () => {
  const js = contourJs()
  it('carries the site’s own shader and timing, safe inside <script>', () => {
    expect(js).toContain(`const CONTOUR = ${JSON.stringify({ frag: CONTOUR_FRAG, ...CONTOUR_TIMING }).replace(/</g, '\\u003c')}`)
  })
  it('keeps the site’s limits: fine pointer, motion allowed, not the low setting, WebGL with derivatives', () => {
    for (const s of ["'(pointer: coarse) and (hover: none)'", "'(prefers-reduced-motion: reduce)'", "root.dataset.a11yMotion !== 'true'", "'kraft-perf'", "!== 'low'", "getExtension('OES_standard_derivatives')"]) expect(js, s).toContain(s)
  })
  it('runs on each page before the reveal script', () => {
    const scripts = [...new DOMParser().parseFromString(renderEndToEnd(), 'text/html').querySelectorAll('script')].map((s) => s.textContent!)
    expect(scripts.at(-2)).toBe(js)
  })
})
