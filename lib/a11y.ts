import { A11Y_KEY } from './storage-keys'

/**
 * Accessibility switches (spec §6, §11). Each lands on <html> as a
 * data-a11y-* attribute, is remembered in localStorage, and is re-applied
 * before first paint by lib/boot.ts. The AccessMenu (components/shell/AccessMenu.tsx) is their UI.
 */
export type TextSize = 'md' | 'lg' | 'xl'
export type A11yPrefs = { text: TextSize; contrast: boolean; motion: boolean; links: boolean }

export const A11Y_EVENT = 'a11ychange'
export const DEFAULT_PREFS: A11yPrefs = { text: 'md', contrast: false, motion: false, links: false }

export function readPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(A11Y_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<A11yPrefs>
    return {
      text: p.text === 'lg' || p.text === 'xl' ? p.text : 'md',
      contrast: !!p.contrast,
      motion: !!p.motion,
      links: !!p.links,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function applyPrefs(p: A11yPrefs) {
  const d = document.documentElement.dataset
  if (p.text === 'md') delete d.a11yText
  else d.a11yText = p.text
  if (p.contrast) d.a11yContrast = 'true'
  else delete d.a11yContrast
  if (p.motion) d.a11yMotion = 'true'
  else delete d.a11yMotion
  if (p.links) d.a11yLinks = 'true'
  else delete d.a11yLinks
}

export function savePrefs(p: A11yPrefs) {
  applyPrefs(p)
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: the choice lasts for this page */
  }
  window.dispatchEvent(new CustomEvent<A11yPrefs>(A11Y_EVENT, { detail: p }))
}

export function motionReduced(): boolean {
  return document.documentElement.dataset.a11yMotion === 'true'
}

/** What is applied right now (the <html> attributes). It stays true even when storage is blocked. */
export function currentPrefs(): A11yPrefs {
  const d = document.documentElement.dataset
  return {
    text: d.a11yText === 'lg' || d.a11yText === 'xl' ? d.a11yText : 'md',
    contrast: d.a11yContrast === 'true',
    motion: d.a11yMotion === 'true',
    links: d.a11yLinks === 'true',
  }
}
