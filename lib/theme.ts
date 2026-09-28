import { prefersReducedMotion } from './motion'
import { THEME_KEY } from './storage-keys'

/**
 * Two themes on one token set: `data-theme` on <html> is the only switch.
 * Kraft's :root is the dark palette; [data-theme=light] overrides it.
 * The first value is written by lib/boot.ts before paint.
 *
 * ContourCanvas listens for THEME_EVENT and eases its colours on its own clock.
 */
export type Theme = 'light' | 'dark'
export type SweepOrigin = { x: number; y: number }

export const THEME_EVENT = 'themechange'

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked: the theme just does not persist */
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }))
}

type WithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/**
 * kape's theme switch: the new palette grows as a hard-edged circle out of the
 * control that asked for it (View Transitions API, 1.2s, CSS in globals.css).
 * No API, or reduced motion → instant switch.
 */
export function setTheme(theme: Theme, origin?: SweepOrigin) {
  const doc = document as WithViewTransition
  const root = document.documentElement
  if (!doc.startViewTransition || prefersReducedMotion() || getTheme() === theme) {
    applyTheme(theme)
    return
  }
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  root.style.setProperty('--sweep-x', `${x}px`)
  root.style.setProperty('--sweep-y', `${y}px`)
  root.style.setProperty('--sweep-r', `${r}px`)
  root.dataset.themeSweep = 'on'
  doc
    .startViewTransition(() => applyTheme(theme))
    .finished.finally(() => {
      delete root.dataset.themeSweep
    })
}

/** Pass the toggle's element so the sweep starts under it. */
export function toggleTheme(from?: Element | null): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  const r = from?.getBoundingClientRect()
  setTheme(next, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)
  return next
}
