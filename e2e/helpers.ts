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
