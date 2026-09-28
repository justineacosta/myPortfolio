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
