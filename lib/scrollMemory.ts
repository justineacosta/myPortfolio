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
 * page swap would otherwise clamp and overwrite it. The popstate listener is
 * installed once per page load, not per mount, so Back from a page outside the
 * site shell (Thank-you, the 404) still finds it. A popstate to an entry Next
 * doesn't own (no __NA state: a native #fragment such as the skip link) is
 * ignored, as Next ignores it, so nothing is left waiting for a commit.
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
  const onHide = () => {
    if (pending === null) saveScroll(entryKey(), getY())
  }
  // Scroll events don't bubble; a capturing listener hears the panel's too.
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('pagehide', onHide)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('pagehide', onHide)
  }
}

function onPop(e: PopStateEvent) {
  const nextOwns = !!(e.state as { __NA?: boolean } | null)?.__NA
  pending = nextOwns && window.location.pathname !== committedPath ? (savedScroll(entryKey()) ?? 0) : null
}

if (typeof window !== 'undefined') window.addEventListener('popstate', onPop)

/** The site shell is going away (a page like Thank-you has its own). Back into the shell then counts as a path change. */
export function leftShell() {
  committedPath = null
}

/** The page for `path` has committed. Returns the position to restore after Back or Forward, or null for a fresh navigation. */
export function committed(path: string): number | null {
  committedPath = path
  const y = pending
  pending = null
  return y
}

