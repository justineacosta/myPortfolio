import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { installMatchMedia } from './test/matchMedia'

// jsdom does not implement scrolling; the shell resets scroll on every route.
window.scrollTo = (() => {}) as typeof window.scrollTo
Element.prototype.scrollTo = function () {} as typeof Element.prototype.scrollTo

installMatchMedia()

afterEach(() => {
  cleanup()
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
