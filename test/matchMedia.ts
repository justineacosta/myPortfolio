/**
 * jsdom has no matchMedia. Every query answers `false` unless listed in
 * `matches`, e.g. installMatchMedia({ '(prefers-reduced-motion: reduce)': true }).
 */
export function installMatchMedia(matches: Record<string, boolean> = {}) {
  window.matchMedia = ((query: string) => ({
    matches: !!matches[query],
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
