import { SCROLL_KEY } from './storage-keys'

/**
 * Back and Forward return each history entry to where it was scrolled
 * (spec D1). A new navigation still starts at the top (NavigationProvider).
 *
 * An entry is keyed by the Navigation API's entry key where there is one, and
 * by its path and query where not. Positions live in memory, mirrored to
 * sessionStorage so a reload keeps them; blocked storage just means memory.
 * A popstate that changes the path marks its saved position as the one to
 * restore, and scrolling is not recorded until that page has committed: the
 * page swap would otherwise clamp and overwrite it.
 */
const LIMIT = 50
let memory: Record<string, number> = {}
let loaded = false
let committedPath: string | null = null
let pending: number | null = null

function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY)
    if (raw) memory = { ...JSON.parse(raw), ...memory }
  } catch {
    // Blocked or corrupt storage: memory only.
  }
}

export function entryKey(): string {
  const nav = (window as Window & { navigation?: { currentEntry?: { key?: string } | null } }).navigation
  return nav?.currentEntry?.key || window.location.pathname + window.location.search
}

export function saveScroll(key: string, y: number) {
  load()
  delete memory[key] // re-insert, so the newest entries survive the cap
  memory[key] = Math.max(0, Math.round(y))
  const keys = Object.keys(memory)
  if (keys.length > LIMIT) delete memory[keys[0]]
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(memory))
  } catch {
    // Memory still has it.
  }
}

export function savedScroll(key: string): number | null {
  load()
  return key in memory ? memory[key] : null
}

/** Records the position of whichever entry is current as the page scrolls. Returns the stop function. */
export function watchScroll(getY: () => number): () => void {
  let raf = 0
  const record = () => {
    raf = 0
    if (pending === null) saveScroll(entryKey(), getY())
  }
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(record)
  }
  const onPop = () => {
    if (window.location.pathname !== committedPath) pending = savedScroll(entryKey()) ?? 0
  }
  const onHide = () => {
    if (pending === null) saveScroll(entryKey(), getY())
  }
  // Scroll events don't bubble; a capturing listener hears the panel's too.
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('popstate', onPop)
  window.addEventListener('pagehide', onHide)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('pagehide', onHide)
  }
}

/** The page for `path` has committed. Returns the position to restore after Back or Forward, or null for a fresh navigation. */
export function committed(path: string): number | null {
  committedPath = path
  const y = pending
  pending = null
  return y
}
