/**
 * From 1100px the document does not scroll: the shell panel (#main-content)
 * does. Below that the panel is ordinary flow and the window scrolls. Every
 * "go to top" goes through here so it works in both, and through Lenis when
 * Lenis owns the panel (hooks/useSmoothScroll.ts registers it).
 */
export const PANEL_ID = 'main-content'

export type LenisLike = {
  scrollTo(target: number | HTMLElement, opts?: { immediate?: boolean; force?: boolean; offset?: number }): void
}

let lenis: LenisLike | null = null

export function registerLenis(l: LenisLike | null) {
  lenis = l
}

export function getPanel(): HTMLElement | null {
  return document.getElementById(PANEL_ID)
}

export function scrollToTop({ smooth }: { smooth: boolean }) {
  if (lenis) {
    lenis.scrollTo(0, smooth ? undefined : { immediate: true, force: true })
  }
  const panel = getPanel()
  if (smooth) {
    panel?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  if (panel) {
    const prev = panel.style.scrollBehavior
    panel.style.scrollBehavior = 'auto'
    panel.scrollTop = 0
    panel.style.scrollBehavior = prev
  }
  window.scrollTo({ top: 0, behavior: 'instant' })
}

/** How far the page is scrolled, in whichever element scrolls (the panel on desktop, the window below). */
export function getScrollY(): number {
  return Math.max(getPanel()?.scrollTop ?? 0, window.scrollY)
}

/** Jumps, with no animation, to `y` in whichever element scrolls. The browser clamps a `y` past the end. */
export function scrollToY(y: number) {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  const panel = getPanel()
  if (panel) {
    const prev = panel.style.scrollBehavior
    panel.style.scrollBehavior = 'auto'
    panel.scrollTop = y
    panel.style.scrollBehavior = prev
  }
  window.scrollTo({ top: y, behavior: 'instant' })
}

/**
 * Brings the page section `id` into view in whichever element scrolls.
 * Returns false when there is no such section. Sub-views are dialogs and
 * handle their own hashes (hooks/useHashView.ts). A section's own
 * scroll-margin (scroll-mt) sets how much air lands above it; Lenis and the
 * browser both honour it, so there is no second offset here.
 */
export function scrollToSection(id: string, { smooth }: { smooth: boolean }): boolean {
  const el = id ? document.getElementById(id) : null
  if (!el || el.closest('dialog')) return false
  if (lenis) {
    lenis.scrollTo(el, smooth ? undefined : { immediate: true, force: true })
    return true
  }
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  return true
}
