'use client'

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'
import { clearHash, currentHash } from '@/lib/hash'

const subscribe = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/**
 * Which of `ids` the URL hash names (sub-views you can link to).
 * - A view opened by a hash change on this page closes with history.back(),
 *   so the Close button and Back agree.
 * - A view the page arrived with (a shared link, or ⌘K from another page)
 *   closes by dropping the hash in place, so closing never leaves the site.
 * The server snapshot is "no view", so the pre-rendered HTML has every view
 * closed; the client picks up the hash right after hydrating.
 */
export function useHashView<T extends string>(ids: readonly T[]): { view: T | null; close: () => void } {
  const hash = useSyncExternalStore(subscribe, currentHash, () => '')
  const view = (ids as readonly string[]).includes(hash) ? (hash as T) : null
  const inPage = useRef(false)

  useEffect(() => {
    const onHash = () => {
      inPage.current = true
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const close = useCallback(() => {
    if (inPage.current) {
      inPage.current = false
      window.history.back()
      return
    }
    clearHash()
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    inPage.current = false
  }, [])

  return { view, close }
}
