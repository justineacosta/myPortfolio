'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { PANEL_ID } from '@/lib/scroller'

type Props = { open: boolean; onClose: () => void; label: string; className?: string; children: ReactNode }

/**
 * The page stays locked while any view is open. Views can hand over to each
 * other (a hash edit, Back and Forward), and the site preview stacks on the
 * sites view. A closing view's `close` event can arrive after the next view
 * has opened.
 */
function unlockIfLast() {
  if (!document.querySelector('dialog.view[open]')) document.documentElement.removeAttribute('data-dialog')
}

const isBackdrop = (target: EventTarget | null, dialog: HTMLElement) =>
  target === dialog || (target instanceof HTMLElement && target.dataset.backdrop !== undefined)

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Nothing to return focus to (a ⌘K pick made with nothing focused). The view
 * still open underneath gets it, if there is one; the page behind it is inert.
 * Otherwise the page itself does.
 */
function focusFallback() {
  const under = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog.view[open]')).pop()
  const target = under
    ? (under.querySelector<HTMLElement>('[data-autofocus]') ?? under.querySelector<HTMLElement>(FOCUSABLE) ?? under)
    : document.getElementById(PANEL_ID)
  target?.focus({ preventScroll: true })
}

/**
 * Kraft's full-screen overlays (Kraft Projects Board.dc.html:132-313) on a
 * native modal <dialog>:
 * - The top layer escapes the page's rise-in transform, which is why Kraft
 *   needed syncOverlays().
 * - The browser supplies the focus trap and the inert background.
 * - `data-lenis-prevent` keeps the smooth scroller off the page behind.
 * Esc, and a press-and-release on the backdrop or on anything marked
 * `data-backdrop`, all go through onClose. So the owner (the URL hash, or
 * the sites view's state) stays the one source of truth. The content is in
 * the pre-rendered HTML even while closed.
 */
export default function ViewDialog({ open, onClose, label, className = '', children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnTo = useRef<HTMLElement | null>(null)
  // What the owner wants. A `close` event while this is still true was the
  // browser's own doing (Esc), so the owner has to hear about it.
  const wanted = useRef(open)
  // A click closes only when the press started on the backdrop too. Then
  // drag-selecting text and letting go outside it never closes the view.
  const pressedBackdrop = useRef(false)

  useEffect(() => {
    wanted.current = open
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      d.showModal()
      // The browser focuses the first focusable element; a view can name a better one.
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
      document.documentElement.setAttribute('data-dialog', '')
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  // A route change can unmount an open view; the page must not stay locked.
  useEffect(() => () => unlockIfLast(), [])

  return (
    <dialog
      ref={ref}
      aria-label={label}
      data-lenis-prevent
      className={`view ${className}`}
      onClose={() => {
        unlockIfLast()
        const back = returnTo.current
        returnTo.current = null
        if (back && back.isConnected && back !== document.body) back.focus()
        else focusFallback()
        if (wanted.current) onClose()
      }}
      onPointerDown={(e) => {
        pressedBackdrop.current = isBackdrop(e.target, e.currentTarget)
      }}
      onClick={(e) => {
        const pressed = pressedBackdrop.current
        pressedBackdrop.current = false
        if (pressed && isBackdrop(e.target, e.currentTarget)) onClose()
      }}
    >
      {children}
    </dialog>
  )
}
