/**
 * The workflow intro (spec §8): kape's engine (IntroOverlay.tsx) with Kraft's
 * loader steps and tokens. The pure parts live here so they can be tested
 * without a layout engine; components/shell/IntroOverlay.tsx drives the DOM.
 *
 * Lifecycle attributes on <html>. lib/boot.ts sets the first two before first
 * paint on a full load of "/":
 *   data-intro       holds the page: [data-intro-hold] and [data-intro-rail] > *
 *   data-intro-head  holds the Home <h1> ([data-intro-target]) until the flying
 *                    copy has landed on it; the overlay is shown while it is set
 *   data-intro-live  the overlay has claimed the run, so the boot failsafe
 *                    leaves it alone
 *
 *   Ignition  nodes and cables draw in                        igniteMs
 *   Run       a light bursts from the first icon, splits      runMs
 *             around each box and joins again, then runs
 *             the next cable (runPlan); each box is checked
 *             as its halves meet; the words reveal on the way
 *   Lock      the last node succeeds, status flips to done    lockMs
 *   Handoff   the canvas falls away, the headline flies onto  flyMs
 *             the real <h1> rect at scale 1
 */
export const INTRO = {
  igniteMs: 300,
  runMs: 3500,
  /** The first icon's glow swelling out to its border. */
  burstMs: 300,
  /** The two halves of the light going round one box. Slower than the cables, so the split and the meeting show. */
  aroundMs: 450,
  lockMs: 350,
  flyMs: 900,
  fontWaitMs: 1200,
  node: 40,
  /** A node card's border width, and its corner radius (the trigger's left side is round: 20). */
  border: 1.5,
  radius: 12,
  canvasH: 96,
  nodeY: 34,
  /** How far the steps drop as they fall away at the handoff, in px. */
  fallPx: 40,
  /** Kraft's 26px mark (Kraft Portfolio.dc.html:123). */
  logo: 26,
  /** The steps' scale: Kraft's 56px nodes from the 40-unit design canvas. */
  canvasScale: 1.4,
} as const

/**
 * The most the whole run may take once the overlay claims it: the font wait
 * plus the desktop sequence (6.25s), with room to spare. Past this the page is
 * handed back, whatever went wrong.
 */
export const INTRO_MAX_MS = 9000

export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  camera: 'cubic-bezier(0.76, 0, 0.24, 1)',
} as const

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeInOutSine = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2

export type RunSegment = { kind: 'burst' | 'around' | 'line'; i: number; start: number; end: number }

/**
 * The run's timeline over 0..1 for `count` nodes: the first icon bursts, then
 * the light goes round box 0, along cable 0, round box 1, and so on to the
 * last box. Bursts and boxes get fixed times (INTRO.burstMs, aroundMs); the
 * cables share what is left of INTRO.runMs.
 */
export function runPlan(count: number): RunSegment[] {
  const lineMs = (INTRO.runMs - INTRO.burstMs - count * INTRO.aroundMs) / Math.max(1, count - 1)
  const parts: Omit<RunSegment, 'start' | 'end'>[] = [{ kind: 'burst', i: 0 }]
  for (let i = 0; i < count; i++) {
    parts.push({ kind: 'around', i })
    if (i < count - 1) parts.push({ kind: 'line', i })
  }
  const msOf = (k: RunSegment['kind']) => (k === 'burst' ? INTRO.burstMs : k === 'around' ? INTRO.aroundMs : lineMs)
  let t = 0
  return parts.map((p) => {
    const start = t / INTRO.runMs
    t += msOf(p.kind)
    return { ...p, start, end: t / INTRO.runMs }
  })
}

/**
 * The two ways round a node card centred on (cx, cy), along the middle of its
 * border: from the left middle over the top, and under the bottom, both to the
 * right middle. `left` and `right` are the corner radii on each side.
 */
export function boxHalves(cx: number, cy: number, left: number, right: number) {
  const inset = INTRO.border / 2
  const h = INTRO.node / 2 - inset
  const rl = left - inset
  const rr = right - inset
  const [x0, x1] = [cx - h, cx + h]
  const half = (dir: 1 | -1, sweep: 0 | 1) => {
    const edge = cy + dir * h
    return [
      `M ${x0} ${cy}`,
      `L ${x0} ${edge - dir * rl}`,
      `A ${rl} ${rl} 0 0 ${sweep} ${x0 + rl} ${edge}`,
      `L ${x1 - rr} ${edge}`,
      `A ${rr} ${rr} 0 0 ${sweep} ${x1} ${edge - dir * rr}`,
      `L ${x1} ${cy}`,
    ].join(' ')
  }
  return { top: half(-1, 1), bottom: half(1, 0) }
}

/** Phones run the same sequence in 62% of the desktop time: a thumb is waiting. */
export const speedFor = (desktop: boolean) => (desktop ? 1 : 0.62)

type Screen = { vw: number; vh: number; width: number; height: number; fontSize: number }

const clamp = (min: number, v: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Kraft's loader layout (Kraft Portfolio.dc.html:107-160): the logo, the
 * headline and the steps stacked on the left gutter, one gap apart and centred
 * as a group, the steps spread gutter to gutter. `width`, `height` and
 * `fontSize` are the real Home <h1>'s, so `scale` takes it to Kraft's size
 * (clamp(30px, 7.6vw, 96px)) without letting it run off the screen.
 */
export function loaderLayout({ vw, vh, width, height, fontSize }: Screen) {
  const gutter = Math.max(clamp(20, vw * 0.05, 96), (vw - 1560) / 2)
  const scale = Math.min(clamp(30, vw * 0.076, 96) / fontSize, (vw - 2 * gutter) / width)
  const gap = clamp(26, vh * 0.054, 56)
  const cs = INTRO.canvasScale
  const nodeTop = INTRO.nodeY - INTRO.node / 2
  const group = INTRO.logo + gap + height * scale + gap + (INTRO.canvasH - nodeTop) * cs
  const logoY = (vh - group) / 2
  const titleY = logoY + INTRO.logo + gap
  return {
    gutter,
    scale,
    x: gutter,
    logoY,
    titleY,
    canvasScale: cs,
    canvasWidth: (vw - 2 * gutter) / cs,
    canvasY: titleY + height * scale + gap - nodeTop * cs,
  }
}

/** Node centres across the canvas, first and last flush with its edges. */
export function nodeCentres(width: number, count: number, node: number): number[] {
  if (count < 2) return [width / 2]
  return Array.from({ length: count }, (_, i) => node / 2 + (i * (width - node)) / (count - 1))
}

/** The gentle n8n-style bezier between two ports on the same row. */
export function cablePath(x1: number, x2: number, y: number): string {
  const c = (x2 - x1) * 0.5
  return `M ${x1} ${y} C ${x1 + c} ${y}, ${x2 - c} ${y}, ${x2} ${y}`
}

/** Nothing moves until the webfont is in (a reflow mid-flight breaks the landing), but never wait longer than Kraft did. */
export function whenFontsReady(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const ready = document.fonts?.ready
    if (!ready) return resolve()
    const t = window.setTimeout(resolve, timeoutMs)
    const done = () => {
      window.clearTimeout(t)
      resolve()
    }
    ready.then(done, done)
  })
}

const root = () => document.documentElement

export const introRequested = () => root().hasAttribute('data-intro')

export function holdIntro() {
  root().setAttribute('data-intro', '')
  root().setAttribute('data-intro-head', '')
}

export function claimIntro() {
  root().setAttribute('data-intro-live', '')
}

let skipper: (() => void) | null = null

/** The running intro's skip, for keys other than its own Esc (⌘K). */
export function registerIntroSkip(fn: (() => void) | null) {
  skipper = fn
}

export const introLive = () => root().hasAttribute('data-intro-live')

export function skipIntro() {
  skipper?.()
}

export function releaseHead() {
  root().removeAttribute('data-intro-head')
  root().removeAttribute('data-intro-live')
}

/** Hand the page back. `animate` deals it in; false just shows it (teardown). */
export function releasePage(animate = true) {
  if (!introRequested()) return
  if (animate) assemble()
  root().removeAttribute('data-intro')
}

/**
 * kape's assembly (boot.css:230-290) as one-shot Web Animations, so no
 * permanent transitions are left on shell elements: the sidebar panel fades
 * in, its rows deal in one by one from the left, everything else rises (the
 * tab bar from further down).
 * fill:'backwards' keeps each piece hidden through its own delay.
 */
export function assemble() {
  // The sidebar's own panel is hidden too (globals.css), so it fades in under its rows.
  document.querySelectorAll<HTMLElement>('[data-intro-rail]').forEach((el) => {
    el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 0, easing: EASE.out, fill: 'backwards' })
  })
  document.querySelectorAll<HTMLElement>('[data-intro-rail] > *').forEach((el, i) => {
    el.animate?.([{ opacity: 0, transform: 'translateX(-16px)' }, { opacity: 1, transform: 'none' }], {
      duration: 700,
      delay: 40 + i * 50,
      easing: EASE.out,
      fill: 'backwards',
    })
  })
  document.querySelectorAll<HTMLElement>('[data-intro-hold]').forEach((el) => {
    const rise = el.dataset.introHold === 'bar' ? 24 : 14
    el.animate?.([{ opacity: 0, transform: `translateY(${rise}px)` }, { opacity: 1, transform: 'none' }], {
      duration: 760,
      delay: Number(el.dataset.introDelay ?? 0) || 0,
      easing: EASE.out,
      fill: 'backwards',
    })
  })
}
