import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import SiteDrum from '@/components/projects/SiteDrum'
import { projects } from '@/data/projects'
import { applyPerfTier } from '@/lib/perf'

/**
 * A stand-in for three's WebGLRenderer that keeps the browser's one rule this
 * test is about: once a canvas's context has been force-lost, that canvas can
 * never host a renderer again (getContext hands back the same, lost context).
 */
const { FakeRenderer, live } = vi.hoisted(() => {
  const lostCanvases = new WeakSet<HTMLCanvasElement>()
  const live: { domElement: HTMLCanvasElement; antialias?: boolean; pixelRatio?: number }[] = []
  class FakeRenderer {
    domElement: HTMLCanvasElement
    capabilities = { getMaxAnisotropy: () => 1 }
    outputColorSpace = ''
    antialias?: boolean
    pixelRatio?: number
    constructor({ canvas, antialias }: { canvas?: HTMLCanvasElement; antialias?: boolean } = {}) {
      this.antialias = antialias
      const el = canvas ?? document.createElement('canvas')
      if (lostCanvases.has(el)) throw new TypeError("Cannot read properties of null (reading 'precision')")
      this.domElement = el
      live.push(this)
    }
    setPixelRatio(r: number) {
      this.pixelRatio = r
    }
    setSize() {}
    render() {}
    dispose() {}
    forceContextLoss() {
      lostCanvases.add(this.domElement)
      live.splice(live.indexOf(this), 1)
    }
  }
  return { FakeRenderer, live }
})

vi.mock('three', async (orig) => ({ ...(await orig<typeof import('three')>()), WebGLRenderer: FakeRenderer }))

class Observer {
  observe() {}
  disconnect() {}
}

describe('SiteDrum', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', Observer)
    vi.stubGlobal('IntersectionObserver', Observer)
    live.length = 0
  })
  afterEach(() => vi.unstubAllGlobals())

  it("survives React's dev double run: each run draws on a canvas whose context is alive", () => {
    const onFail = vi.fn()
    const { container } = render(
      <StrictMode>
        <SiteDrum sites={projects.sitesView.sites} onOpen={() => {}} onFail={onFail} />
      </StrictMode>,
    )
    expect(onFail).not.toHaveBeenCalled()
    // One renderer is running, and its canvas is the one on the page.
    expect(live).toHaveLength(1)
    const canvases = container.querySelectorAll('canvas')
    expect(canvases).toHaveLength(1)
    expect(canvases[0]).toBe(live[0].domElement)
    expect(canvases[0]).toHaveAttribute('aria-hidden', 'true')
  })

  it('uses no deprecated three.js API (the console stays quiet)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<SiteDrum sites={projects.sitesView.sites} onOpen={() => {}} onFail={() => {}} />)
    const deprecations = warn.mock.calls.map((c) => c.join(' ')).filter((m) => /deprecated/i.test(m))
    expect(deprecations).toEqual([])
    warn.mockRestore()
  })

  it('runs lighter at the low perf tier: no antialiasing, 1x pixels', () => {
    vi.stubGlobal('devicePixelRatio', 2)
    applyPerfTier('low')
    render(<SiteDrum sites={projects.sitesView.sites} onOpen={() => {}} onFail={() => {}} />)
    expect(live[0]).toMatchObject({ antialias: false, pixelRatio: 1 })
    applyPerfTier('high')
  })

  it('runs at full quality otherwise', () => {
    vi.stubGlobal('devicePixelRatio', 2)
    render(<SiteDrum sites={projects.sitesView.sites} onOpen={() => {}} onFail={() => {}} />)
    expect(live[0]).toMatchObject({ antialias: true, pixelRatio: 2 })
  })

  it('takes its canvas away with it when it unmounts', () => {
    const { container, unmount } = render(<SiteDrum sites={projects.sitesView.sites} onOpen={() => {}} onFail={() => {}} />)
    expect(container.querySelectorAll('canvas')).toHaveLength(1)
    unmount()
    expect(live).toHaveLength(0)
  })
})
