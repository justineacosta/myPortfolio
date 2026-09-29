import type { Page } from '@playwright/test'

/**
 * Resolves once React has hydrated `selector` (default: the panel). `goto`
 * resolves at the load event, which can come before hydration; a click before
 * then is a plain full-page navigation and a shortcut has no listener yet.
 */
export async function hydrated(page: Page, selector = '#main-content') {
  await page.waitForFunction(
    (s) => {
      const el = document.querySelector(s)
      return !!el && Object.keys(el).some((k) => k.startsWith('__reactProps$'))
    },
    selector,
  )
}

/**
 * For tests that must catch the intro while it plays: goto's default waits for
 * the load event, which on a busy machine can land after the whole ~3.7s run.
 */
export const INTRO_LOAD = { waitUntil: 'domcontentloaded' } as const

/** Resolves once the intro has handed the page back (at once when there was no intro). */
export async function settleIntro(page: Page) {
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-intro-head'), null, { timeout: 12_000 })
}

/** How far the flying headline's resting pose is from the real <h1>. */
export function headlineLanding(page: Page) {
  return page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('.intro-title')!
    const h1 = document.querySelector<HTMLElement>('[data-intro-target]')!
    // The overlay is display:none once it lands, and Chrome resolves a boxless
    // element's computed transform to `none`; the committed inline pose is the landing.
    const m = new DOMMatrix(title.style.transform)
    const b = h1.getBoundingClientRect()
    return {
      dx: Math.abs(m.e - b.left),
      dy: Math.abs(m.f - b.top),
      scale: m.a,
      sameSize: getComputedStyle(title).fontSize === getComputedStyle(h1).fontSize,
    }
  })
}

/** The headline's lines, read by where each word sits: the flying copy (shown for a moment, unpainted) and the real <h1>. */
export function headlineLines(page: Page) {
  return page.evaluate(() => {
    const byRow = (items: { top: number; text: string }[]) => {
      const rows = new Map<number, string[]>()
      for (const it of items) {
        const k = Math.round(it.top)
        rows.set(k, [...(rows.get(k) ?? []), it.text])
      }
      return [...rows.keys()].sort((a, b) => a - b).map((k) => rows.get(k)!.join(' '))
    }
    const overlay = document.querySelector<HTMLElement>('[data-intro-overlay]')!
    overlay.style.display = 'block'
    overlay.style.visibility = 'hidden'
    const flying = byRow(
      [...overlay.querySelectorAll<HTMLElement>('.intro-title .intro-word')].map((w) => ({
        top: w.getBoundingClientRect().top,
        text: (w.textContent ?? '').trim(),
      })),
    )
    overlay.style.display = ''
    overlay.style.visibility = ''
    const h1 = document.querySelector<HTMLElement>('[data-intro-target]')!
    const words: { top: number; text: string }[] = []
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
        const r = document.createRange()
        r.setStart(n, m.index!)
        r.setEnd(n, m.index! + m[0].length)
        words.push({ top: r.getBoundingClientRect().top, text: m[0] })
      }
    }
    return { flying, real: byRow(words) }
  })
}

/**
 * Where the intro's pieces sit on screen mid-run: Kraft's loader layout (lib/intro.ts
 * loaderLayout). Steps are placed from layout, not their boxes: a node's pop-in
 * springs past full size for a moment.
 */
export async function loaderGeometry(page: Page) {
  // Past ignition, once the first node has succeeded, every piece is in place.
  await page.waitForSelector('.intro-node.is-done')
  return page.evaluate(() => {
    const el = (s: string) => document.querySelector<HTMLElement>(s)!
    const px = (e: HTMLElement, prop: 'width' | 'fontSize') => parseFloat(getComputedStyle(e)[prop])
    const canvas = new DOMMatrix(getComputedStyle(el('.intro-canvas')).transform)
    const title = el('.intro-title')
    const titleAt = new DOMMatrix(getComputedStyle(title).transform)
    const onScreen = (n: HTMLElement) => canvas.e + n.offsetLeft * canvas.a
    const nodes = [...document.querySelectorAll<HTMLElement>('.intro-node')]
    const labels = [...document.querySelectorAll<HTMLElement>('.intro-label')].map((l) => {
      const centre = onScreen(l.parentElement!) + (l.parentElement!.offsetWidth / 2) * canvas.a
      const half = (l.offsetWidth / 2) * canvas.a
      return { left: centre - half, right: centre + half }
    })
    const brand = el('.intro-brand').getBoundingClientRect()
    return {
      vw: window.innerWidth,
      brand: { left: brand.left, bottom: brand.bottom, text: el('.intro-brand').textContent },
      title: { left: titleAt.e, top: titleAt.f, bottom: titleAt.f + title.offsetHeight * titleAt.a },
      font: px(title, 'fontSize') * titleAt.a,
      firstNode: { left: onScreen(nodes[0]), top: canvas.f + nodes[0].offsetTop * canvas.a },
      lastNode: { left: onScreen(nodes[nodes.length - 1]) },
      labels,
      nodeSize: px(el('.intro-node-card'), 'width') * canvas.a,
      dotSize: px(el('.intro-status-dot'), 'width') * canvas.a,
    }
  })
}

/** Where the light is, frame by frame: the canvas names its segment (data-at, e.g. "around1"). */
export type RunFrame = {
  at: string
  t: number
  dot: number
  sparks: { x: number; y: number; opacity: number }[]
  ring: { top: number; bottom: number }[]
  done: boolean[]
  burst: number
  centreY: number[]
}

/**
 * Watches the run every frame until `until` holds for a frame, and returns that
 * frame. Ring values are how much of each half is drawn, 0..1.
 */
export async function catchRun(page: Page, until: string) {
  const handle = await page.waitForFunction(
    (src) => {
      const canvas = document.querySelector<HTMLElement>('.intro-canvas')
      if (!canvas?.dataset.at) return false
      const drawn = (p: SVGPathElement | null) => {
        if (!p) return 0
        const len = Number(p.dataset.len)
        return 1 - parseFloat(p.style.strokeDashoffset || String(len)) / len
      }
      const nodes = [...document.querySelectorAll<HTMLElement>('.intro-node')]
      const frame = {
        at: canvas.dataset.at,
        t: performance.now(),
        dot: parseFloat(getComputedStyle(document.querySelector('.intro-dot-core')!).opacity),
        sparks: [...document.querySelectorAll<HTMLElement>('.intro-spark')].map((s) => {
          const b = s.getBoundingClientRect()
          return { x: b.left + b.width / 2, y: b.top + b.height / 2, opacity: parseFloat(getComputedStyle(s).opacity) }
        }),
        ring: nodes.map((_, i) => ({
          top: drawn(document.querySelector(`.intro-ring[data-node="${i}"][data-half="top"]`)),
          bottom: drawn(document.querySelector(`.intro-ring[data-node="${i}"][data-half="bottom"]`)),
        })),
        done: nodes.map((n) => n.classList.contains('is-done')),
        burst: parseFloat(getComputedStyle(document.querySelector('.intro-burst')!).opacity),
        centreY: nodes.map((n) => {
          const b = n.querySelector('.intro-node-card')!.getBoundingClientRect()
          return b.top + b.height / 2
        }),
      }
      return new Function('f', `return (${src})(f)`)(frame) ? frame : false
    },
    until,
    { polling: 'raf', timeout: 15_000 },
  )
  return (await handle.jsonValue()) as RunFrame
}
