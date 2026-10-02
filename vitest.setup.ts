import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { NAV } from './data/nav'
import { installMatchMedia } from './test/matchMedia'

// Every test starts with every page switched on, whatever data/nav.ts ships:
// a page's own tests test the page, and tests/hide-pages.test.tsx switches
// pages off itself.
beforeEach(() => {
  for (const n of NAV) n.hidden = false
})

// Tests marked `// @vitest-environment node` have no DOM, so the DOM setup is skipped for them.
const hasDom = typeof window !== 'undefined'

if (hasDom) {
  // jsdom does not implement scrolling; the shell resets scroll on every route.
  window.scrollTo = (() => {}) as typeof window.scrollTo
  Element.prototype.scrollTo = function () {} as typeof Element.prototype.scrollTo
  Element.prototype.scrollIntoView = function () {} as typeof Element.prototype.scrollIntoView

  // jsdom has <dialog> and its `open` attribute, but not showModal()/close().
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }

  installMatchMedia()
}

afterEach(() => {
  if (!hasDom) return
  cleanup()
  // A query flipped in one test must never leak into the next.
  installMatchMedia()
  const root = document.documentElement
  for (const name of Array.from(root.attributes).map((a) => a.name)) {
    if (name.startsWith('data-')) root.removeAttribute(name)
  }
  root.removeAttribute('style')
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* a test may have stubbed storage to throw */
  }
  installMatchMedia()
})
