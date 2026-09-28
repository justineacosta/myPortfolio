'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { currentHash, pushHash, splitHref } from '@/lib/hash'
import { scrollToSection, scrollToTop } from '@/lib/scroller'

/**
 * Kraft's screen change (Kraft Portfolio.dc.html:676-694): the outgoing page
 * dims for SWAP_MS, the route commits, the scroll resets while nothing is
 * visible, and the incoming page rises in (app/(site)/template.tsx).
 *
 * `swapping` is derived, not stored: it is true only while a pending
 * navigation was started FROM the current pathname. Any route change (ours,
 * back/forward, a plain link) ends it, so the page can never stay invisible.
 */
export const SWAP_MS = 160

type Pending = { href: string; from: string } | null
type ShellNav = { go: (href: string) => void; swapping: boolean }

const Ctx = createContext<ShellNav | null>(null)

export function useShellNav(): ShellNav {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useShellNav must be used inside <NavigationProvider>')
  return ctx
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, setPending] = useState<Pending>(null)
  const timer = useRef<number | undefined>(undefined)
  // The href we last handed to the router, until its route commits.
  const pushed = useRef<string | null>(null)
  // The path this provider last committed. Its first render is not a route
  // change, so the mount effect must not cancel a click that React delivered
  // between the hydration commit and that effect.
  const shown = useRef(pathname)

  // Any committed route change settles the fade. Without this, Back to the
  // page a navigation started from would match `pending.from` again and leave
  // the panel transparent.
  const [seenPath, setSeenPath] = useState(pathname)
  if (pathname !== seenPath) {
    setSeenPath(pathname)
    setPending(null)
  }

  const go = useCallback(
    (href: string) => {
      window.clearTimeout(timer.current)
      const { path, hash } = splitHref(href)
      if (path === pathname) {
        // No route change is coming, so there is nothing to fade out for:
        // a hash names a section (scrolled to below) or a sub-view (it opens).
        setPending(null)
        if (hash) pushHash(hash)
        else scrollToTop({ smooth: true })
        return
      }
      // `pushed` holds the path: usePathname() never includes the hash.
      if (prefersReducedMotion()) {
        setPending(null)
        pushed.current = path
        router.push(href, { scroll: false })
        return
      }
      setPending({ href, from: pathname })
      timer.current = window.setTimeout(() => {
        pushed.current = path
        router.push(href, { scroll: false })
      }, SWAP_MS)
    },
    [pathname, router],
  )

  // The new page is committed: drop any fade still waiting to navigate (the
  // visitor went elsewhere, e.g. Back mid-fade), and reset scroll while the
  // page is still transparent. Our own earlier push landing late is not
  // "elsewhere": a click made while it loaded must still win.
  useEffect(() => {
    if (pathname !== shown.current && pathname !== pushed.current) window.clearTimeout(timer.current)
    shown.current = pathname
    pushed.current = null
    scrollToTop({ smooth: false })
    // A ⌘K section on another page lands on the section, not the top.
    scrollToSection(currentHash(), { smooth: false })
  }, [pathname])

  // A section hash on this page (⌘K, or Back/Forward between sections).
  useEffect(() => {
    const onHash = () => scrollToSection(currentHash(), { smooth: !prefersReducedMotion() })
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const swapping = pending !== null && pending.from === pathname
  const value = useMemo(() => ({ go, swapping }), [go, swapping])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** A next/link whose plain left-clicks run through Kraft's crossfade. */
export function ShellLink({ href, onClick, ...rest }: ComponentProps<typeof Link> & { href: string }) {
  const { go } = useShellNav()
  return (
    <Link
      href={href}
      {...rest}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        go(href)
      }}
    />
  )
}
