import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  boxHalves,
  cablePath,
  claimIntro,
  easeInOutCubic,
  easeInOutSine,
  holdIntro,
  INTRO,
  introRequested,
  loaderLayout,
  nodeCentres,
  releaseHead,
  releasePage,
  runPlan,
  speedFor,
  whenFontsReady,
} from '@/lib/intro'

const html = () => document.documentElement

describe('intro geometry', () => {
  // Kraft's loader (Kraft Portfolio.dc.html:107-160): the logo, the headline and
  // the steps stacked on the left, centred as a group, steps spread across.
  const desk = loaderLayout({ vw: 1440, vh: 900, width: 590, height: 127, fontSize: 62 })

  it("sets the headline on the left gutter at Kraft's size", () => {
    expect(desk.gutter).toBe(72)
    expect(desk.x).toBe(72)
    expect(desk.scale * 62).toBeCloseTo(96, 5)
  })

  it('never lets the headline grow past 96px or run off the screen', () => {
    expect(loaderLayout({ vw: 2400, vh: 1200, width: 590, height: 127, fontSize: 62 }).scale * 62).toBeCloseTo(96, 5)
    const phone = loaderLayout({ vw: 390, vh: 844, width: 330, height: 62, fontSize: 30 })
    expect(phone.gutter).toBe(20)
    expect(phone.x + 330 * phone.scale).toBeLessThanOrEqual(390 - 20 + 1e-9)
  })

  it("keeps wide screens to Kraft's 1560px measure", () => {
    expect(loaderLayout({ vw: 2560, vh: 1200, width: 590, height: 127, fontSize: 62 }).gutter).toBe(500)
  })

  it("spreads the steps across the screen, gutter to gutter, at Kraft's 56px nodes", () => {
    expect(desk.canvasScale * 40).toBeCloseTo(56, 5)
    expect(desk.canvasWidth * desk.canvasScale).toBeCloseTo(1440 - 2 * 72, 5)
  })

  it('stacks logo, headline and steps one gap apart, centred as a group', () => {
    const gap = Math.min(56, Math.max(26, 900 * 0.054))
    expect(desk.titleY).toBeCloseTo(desk.logoY + 26 + gap, 5)
    const nodeTop = desk.canvasY + 14 * desk.canvasScale
    expect(nodeTop).toBeCloseTo(desk.titleY + 127 * desk.scale + gap, 5)
    const bottom = desk.canvasY + 96 * desk.canvasScale
    expect(desk.logoY).toBeCloseTo(900 - bottom, 5)
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
    expect(easeInOutSine(0)).toBeCloseTo(0, 10)
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10)
    expect(easeInOutSine(1)).toBeCloseTo(1, 10)
  })
})

describe('the run: a light that splits around each box and joins again', () => {
  const plan = runPlan(4)

  it('bursts from the first icon, then goes around each box and along each line in turn', () => {
    expect(plan.map((s) => `${s.kind}${s.i}`)).toEqual([
      'burst0', 'around0', 'line0', 'around1', 'line1', 'around2', 'line2', 'around3',
    ])
  })

  it('fills the whole run with no gaps, from 0 to 1', () => {
    expect(plan[0].start).toBe(0)
    expect(plan.at(-1)!.end).toBeCloseTo(1, 10)
    plan.slice(1).forEach((s, k) => expect(s.start).toBeCloseTo(plan[k].end, 10))
  })

  it('takes about 3.5s on desktop, slowing at the boxes so the split and the meeting show', () => {
    expect(INTRO.runMs).toBe(3500)
    const ms = (s: (typeof plan)[number]) => (s.end - s.start) * INTRO.runMs
    const around = plan.filter((s) => s.kind === 'around')
    const lines = plan.filter((s) => s.kind === 'line')
    around.forEach((s) => expect(ms(s)).toBeCloseTo(INTRO.aroundMs, 5))
    expect(ms(plan[0])).toBeCloseTo(INTRO.burstMs, 5)
    lines.forEach((s) => expect(ms(s)).toBeCloseTo((3500 - INTRO.burstMs - 4 * INTRO.aroundMs) / 3, 5))
    // A box's half-perimeter (~62 units) is far shorter than a line, yet it gets comparable time.
    expect(INTRO.aroundMs).toBeGreaterThan(0.8 * ms(lines[0]))
  })
})

describe('boxHalves: the two ways round a box, left middle to right middle', () => {
  it('traces a square box along its border line, top half then bottom half', () => {
    const { top, bottom } = boxHalves(100, 34, 12, 12)
    // 40-unit card, 1.5 border: the border line runs 19.25 out from the centre.
    expect(top).toBe('M 80.75 34 L 80.75 26 A 11.25 11.25 0 0 1 92 14.75 L 108 14.75 A 11.25 11.25 0 0 1 119.25 26 L 119.25 34')
    expect(bottom).toBe('M 80.75 34 L 80.75 42 A 11.25 11.25 0 0 0 92 53.25 L 108 53.25 A 11.25 11.25 0 0 0 119.25 42 L 119.25 34')
  })

  it("follows the trigger's round left side", () => {
    const { top } = boxHalves(20, 34, 20, 12)
    expect(top).toBe('M 0.75 34 L 0.75 34 A 19.25 19.25 0 0 1 20 14.75 L 28 14.75 A 11.25 11.25 0 0 1 39.25 26 L 39.25 34')
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

  it('fades the sidebar panel in, deals the rail in row by row, then raises each held piece after its delay', () => {
    document.body.innerHTML =
      '<aside data-intro-rail><div></div><div></div></aside><p data-intro-hold data-intro-delay="60"></p><nav data-intro-hold="bar"></nav>'
    holdIntro()
    releasePage()
    expect(html().hasAttribute('data-intro')).toBe(false)
    const calls = animate.mock.calls as [Keyframe[], KeyframeAnimationOptions][]
    expect(calls.map(([, o]) => o.delay)).toEqual([0, 40, 90, 60, 0])
    expect(calls[0][0]).toEqual([{ opacity: 0 }, { opacity: 1 }])
    expect(calls[1][0][0].transform).toBe('translateX(-16px)')
    expect(calls[3][0][0].transform).toBe('translateY(14px)')
    expect(calls[4][0][0].transform).toBe('translateY(24px)')
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
