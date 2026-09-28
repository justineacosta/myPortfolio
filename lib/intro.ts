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
 *   Run       one progress value streams the cables, checks   runMs
 *             each node and mask-reveals the headline words
 *   Lock      the last node succeeds, status flips to done    lockMs
 *   Handoff   the canvas falls away, the headline flies onto  flyMs
 *             the real <h1> rect at scale 1
 */
export const INTRO = {
  igniteMs: 300,
  runMs: 1600,
  lockMs: 350,
  flyMs: 900,
  fontWaitMs: 1200,
  node: 40,
  canvasH: 96,
  nodeY: 34,
  canvasGap: 44,
  fallGap: 72,
} as const

export const EASE = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  camera: 'cubic-bezier(0.76, 0, 0.24, 1)',
} as const

export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Phones get the same sequence at two-thirds speed: a thumb is waiting. */
export const speedFor = (desktop: boolean) => (desktop ? 1 : 0.62)

/** Where the headline waits: scaled up to 86% of the viewport (max 2.6x), centred, lifted a little. */
export function restPose({ vw, vh, width, height }: { vw: number; vh: number; width: number; height: number }) {
  const scale = Math.min((vw * 0.86) / width, 2.6)
  return {
    scale,
    x: (vw - width * scale) / 2,
    y: (vh - height * scale) / 2 - Math.min(96, vh * 0.09),
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
 * permanent transitions are left on shell elements: the rail deals in row by
 * row from the left, everything else rises (the tab bar from further down).
 * fill:'backwards' keeps each piece hidden through its own delay.
 */
export function assemble() {
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
