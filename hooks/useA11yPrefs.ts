'use client'

import { useSyncExternalStore } from 'react'
import { A11Y_EVENT, currentPrefs, DEFAULT_PREFS, type A11yPrefs } from '@/lib/a11y'

let last: A11yPrefs = DEFAULT_PREFS
const same = (a: A11yPrefs, b: A11yPrefs) => a.text === b.text && a.contrast === b.contrast && a.motion === b.motion && a.links === b.links

// The same object until something changes, as useSyncExternalStore requires.
function snapshot(): A11yPrefs {
  const now = currentPrefs()
  if (!same(now, last)) last = now
  return last
}

function subscribe(onChange: () => void) {
  window.addEventListener(A11Y_EVENT, onChange)
  return () => window.removeEventListener(A11Y_EVENT, onChange)
}

/** The access switches as they are applied now; every copy of the menu shows the same. Defaults on the server. */
export function useA11yPrefs(): A11yPrefs {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULT_PREFS)
}
