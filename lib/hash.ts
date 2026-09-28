/**
 * URL-hash helpers for sub-views and sections (⌘K deep links, shared links).
 * A hash is pushed with history.pushState, which Next's App Router patches to
 * carry its own state, and announced with a hashchange event, so the browser
 * never makes its own jump to an element with that id.
 */
export function splitHref(href: string): { path: string; hash: string } {
  const i = href.indexOf('#')
  return i < 0 ? { path: href, hash: '' } : { path: href.slice(0, i), hash: href.slice(i + 1) }
}

export function currentHash(): string {
  const raw = window.location.hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Makes `hash` the URL's hash (a new history entry unless it already is) and tells listeners. */
export function pushHash(hash: string) {
  const oldURL = window.location.href
  if (currentHash() !== hash) window.history.pushState(null, '', `#${hash}`)
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: window.location.href }))
}

/**
 * Drops the hash in place, with no new history entry. The state is fresh
 * (null), as in pushHash, so Next's patched replaceState copies its own state
 * in and updates its own record of the URL. Passing Next's state back would
 * mark the call as Next's own, and Next's URL would keep the old hash.
 */
export function clearHash() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
