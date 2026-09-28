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
