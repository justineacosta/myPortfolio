import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'

describe('the shared contour shader', () => {
  it('is the site’s simplex contour with its six uniforms and hairline lines', () => {
    for (const u of ['uTime', 'uMouse', 'uMousePace', 'uAspect', 'uBg', 'uLine']) expect(CONTOUR_FRAG, u).toMatch(new RegExp(`uniform \\w+\\s+${u};`))
    expect(CONTOUR_FRAG).toContain('float snoise(vec3 v)')
    expect(CONTOUR_FRAG).toContain('fwidth(bands)')
    expect(CONTOUR_FRAG).toContain('gl_FragColor')
    expect(CONTOUR_FRAG).not.toContain('precision')
  })

  it('keeps the site’s timing: 30 fps, drift, follow, pace and theme easing', () => {
    expect(CONTOUR_TIMING).toEqual({ frameInterval: 1000 / 30, drift: 0.09, follow: 4, pace: 8, theme: 7 })
  })

  it('is the one the site draws with', () => {
    const src = readFileSync('components/shell/ContourCanvas.tsx', 'utf8')
    expect(src).toContain("import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'")
    expect(src).not.toContain('float snoise')
    expect(src).not.toContain('const FRAME_INTERVAL')
  })
})
