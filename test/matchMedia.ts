type Listener = (e: { matches: boolean; media: string }) => void

let state: Record<string, boolean> = {}
const listeners = new Map<string, Set<Listener>>()

/**
 * jsdom has no matchMedia. Every query answers `false` unless listed in
 * `matches`, e.g. installMatchMedia({ '(prefers-reduced-motion: reduce)': true }).
 * `matches` is live, as in a browser, and setMediaMatch() flips one query and
 * tells its listeners, as the OS would.
 */
export function installMatchMedia(matches: Record<string, boolean> = {}) {
  state = { ...matches }
  listeners.clear()
  window.matchMedia = ((query: string) => ({
    get matches() {
      return !!state[query]
    },
    media: query,
    onchange: null,
    addEventListener(_type: string, l: Listener) {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(l)
    },
    removeEventListener(_type: string, l: Listener) {
      listeners.get(query)?.delete(l)
    },
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

export function setMediaMatch(query: string, value: boolean) {
  state[query] = value
  listeners.get(query)?.forEach((l) => l({ matches: value, media: query }))
}
