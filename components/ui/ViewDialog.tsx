'use client'

import { useEffect, useRef, type ReactNode } from 'react'

type Props = { open: boolean; onClose: () => void; label: string; className?: string; children: ReactNode }

/**
 * Kraft's full-screen overlays (Kraft Projects Board.dc.html:132-313) on a
 * native modal <dialog>:
 * - The top layer escapes the page's rise-in transform, which is why Kraft
 *   needed syncOverlays().
 * - The browser supplies the focus trap and the inert background.
 * - `data-lenis-prevent` keeps the smooth scroller off the page behind.
 * Esc, backdrop clicks and clicks on anything marked `data-backdrop` all go
 * through onClose, so the owner (the URL hash) stays the one source of
 * truth. The content is in the pre-rendered HTML even while closed.
 */
export default function ViewDialog({ open, onClose, label, className = '', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  // What the owner wants. A `close` event while this is still true was the
  // browser's own doing (Esc), so the owner has to hear about it.
  const wanted = useRef(open)

  useEffect(() => {
    wanted.current = open
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      d.showModal()
      document.documentElement.setAttribute('data-dialog', '')
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  // A route change can unmount an open view; the page must not stay locked.
  useEffect(() => () => document.documentElement.removeAttribute('data-dialog'), [])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-lenis-prevent
      className={`view ${className}`}
      onClose={() => {
        document.documentElement.removeAttribute('data-dialog')
        const back = returnTo.current
        returnTo.current = null
        if (back && back.isConnected && back !== document.body) back.focus()
        if (wanted.current) onClose()
      }}
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target === e.currentTarget || target.dataset.backdrop !== undefined) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
