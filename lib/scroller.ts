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

/** Clears the sticky desktop top bar (components/shell/TopBar.tsx, about 72px) when a section lands. */
export const SECTION_OFFSET = 88

/**
 * Brings the page section `id` into view in whichever element scrolls.
 * Returns false when there is no such section. Sub-views are dialogs and
 * handle their own hashes (hooks/useHashView.ts).
 */
export function scrollToSection(id: string, { smooth }: { smooth: boolean }): boolean {
  const el = id ? document.getElementById(id) : null
  if (!el || el.closest('dialog')) return false
  if (lenis) {
    lenis.scrollTo(el, smooth ? { offset: -SECTION_OFFSET } : { immediate: true, force: true, offset: -SECTION_OFFSET })
    return true
  }
  el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' })
  return true
}
