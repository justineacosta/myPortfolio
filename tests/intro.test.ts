import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cablePath,
  claimIntro,
  easeInOutCubic,
  holdIntro,
  introRequested,
  nodeCentres,
  releaseHead,
  releasePage,
  restPose,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'

const html = () => document.documentElement

describe('intro geometry', () => {
  it('centres the scaled headline a little above the middle', () => {
    const p = restPose({ vw: 1440, vh: 900, width: 590, height: 127 })
    expect(p.scale).toBeCloseTo(2.099, 3)
    expect(p.x).toBeCloseTo(100.8, 1)
    expect(p.y).toBeCloseTo((900 - 127 * p.scale) / 2 - 81, 5)
  })

  it('never scales the headline past 2.6', () => {
    expect(restPose({ vw: 1440, vh: 900, width: 200, height: 60 }).scale).toBe(2.6)
  })

  it('spreads node centres edge to edge', () => {
    expect(nodeCentres(400, 4, 40)).toEqual([20, 140, 260, 380])
  })

  it('draws cables as flat beziers', () => {
    expect(cablePath(40, 120, 34)).toBe('M 40 34 C 80 34, 80 34, 120 34')
  })

  it('runs at two-thirds speed without the desktop shell', () => {
    expect(speedFor(true)).toBe(1)
    expect(speedFor(false)).toBe(0.62)
  })

  it('eases in and out symmetrically', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(0.5)).toBe(0.5)
    expect(easeInOutCubic(1)).toBe(1)
  })
})

describe('whenFontsReady', () => {
  afterEach(() => {
    vi.useRealTimers()
    delete (document as { fonts?: unknown }).fonts
  })

  it('resolves at once without a font API', async () => {
    await expect(whenFontsReady(1200)).resolves.toBeUndefined()
  })

  it('stops waiting for a stuck webfont after the timeout', async () => {
    vi.useFakeTimers()
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: new Promise(() => {}) } })
    let done = false
    void whenFontsReady(1200).then(() => {
      done = true
    })
    await vi.advanceTimersByTimeAsync(1199)
    expect(done).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(done).toBe(true)
  })
})

describe('intro hold and release', () => {
  let animate: ReturnType<typeof vi.fn>
  beforeEach(() => {
    animate = vi.fn()
    HTMLElement.prototype.animate = animate as unknown as HTMLElement['animate']
  })
  afterEach(() => {
    delete (HTMLElement.prototype as { animate?: unknown }).animate
    document.body.innerHTML = ''
  })

  it('reads the boot flag', () => {
    expect(introRequested()).toBe(false)
    holdIntro()
    expect(introRequested()).toBe(true)
  })

  it('deals the rail in row by row, then raises each held piece after its delay', () => {
    document.body.innerHTML =
      '<aside data-intro-rail><div></div><div></div></aside><p data-intro-hold data-intro-delay="60"></p><nav data-intro-hold="bar"></nav>'
    holdIntro()
    releasePage()
    expect(html().hasAttribute('data-intro')).toBe(false)
    const calls = animate.mock.calls as [Keyframe[], KeyframeAnimationOptions][]
    expect(calls.map(([, o]) => o.delay)).toEqual([40, 90, 60, 0])
    expect(calls[0][0][0].transform).toBe('translateX(-16px)')
    expect(calls[2][0][0].transform).toBe('translateY(14px)')
    expect(calls[3][0][0].transform).toBe('translateY(24px)')
    expect(calls.every(([, o]) => o.fill === 'backwards')).toBe(true)
  })

  it('can release without animating', () => {
    document.body.innerHTML = '<p data-intro-hold></p>'
    holdIntro()
    releasePage(false)
    expect(html().hasAttribute('data-intro')).toBe(false)
    expect(animate).not.toHaveBeenCalled()
  })

  it('does nothing when the page is not held', () => {
    document.body.innerHTML = '<p data-intro-hold></p>'
    releasePage()
    expect(animate).not.toHaveBeenCalled()
  })

  it('drops the headline hold and the claim together', () => {
    holdIntro()
    claimIntro()
    releaseHead()
    expect(html().hasAttribute('data-intro-head')).toBe(false)
    expect(html().hasAttribute('data-intro-live')).toBe(false)
    expect(html().hasAttribute('data-intro')).toBe(true)
  })
})
