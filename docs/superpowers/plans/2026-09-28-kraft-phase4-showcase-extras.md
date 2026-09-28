# Kraft Portfolio Phase 4: Showcase Features and Extras Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the site. Phase 4 adds:
- The 3D funnel drum and the live site preview.
- The Flagship `/showcase` page.
- The Thank-you, Privacy, Terms and 404 pages.
- The accessibility menu.
- The SEO files and the Vercel wiring.
- Fixes for the deferred Phase 3 minors.

**Architecture:**
- **Sites view.** The Projects "Funnels and sites" view keeps its native `<dialog>`.
  - Inside it, a lazily loaded Three.js drum (`SiteDrum`) replaces the grid wherever WebGL is allowed. `hooks/useWebGLAllowed.ts` uses the same gate as the contour background.
  - Everywhere else (the server render, phones, reduced motion, the low perf tier, WebGL failure) the grid stays. The grid now opens the same preview.
  - The preview (`SitePreview`) is a second `ViewDialog` stacked on the first.
- **Showcase.** `/showcase` is kape's Flagship rebuilt in Kraft tokens: an em-scaled product mock, tabs driven by a CSS progress clock, and a pausable feedback marquee.
- **Access menu.** It is one client component. It sits beside every theme button (sidebar, phone controls, Home profile and the plain header). Its panel is portalled to `<body>`, and its switches write `data-a11y-*` attributes through the existing `lib/a11y.ts`.
- **Plain pages.** The Thank-you, Privacy and Terms pages live in a `(plain)` route group with a small document-scroll shell. The 404 page reuses that shell.
- **SEO.** Metadata goes through `lib/seo.ts`. The site address comes from `lib/site.ts`, and the share image reads Kraft's tokens out of `app/globals.css`.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.9 (strict), Tailwind CSS 4.3 (Kraft tokens only), Three.js 0.186, `@phosphor-icons/react/ssr`, Vitest 5 + jsdom + Testing Library, Playwright 1.63 (desktop 1440×900 and phone 390×844 projects).

**Spec:** `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md`. Phase 4 is §15.4. It also covers §6 (the drum, preview, Flagship and access menu), §9 (Showcase, Thank-you, Privacy, Terms, 404), §11, §12 and §13. `reference/Kraft_Portfolio_Design_System/HANDOFF.md` is never followed.

**Owner decisions (2026-09-28, via AskUserQuestion):**
- **Drum pages:** Kraft's 8 site names. A script generates a neutral placeholder page and a thumbnail for each.
- **Access menu:** beside the theme button (sidebar, phone controls, Home profile header).
- **Thank-you:** a calm Kraft card with no redirect or confetti.
- **Deferred Phase 3 minors to fix now:** all four groups: dialog behaviour, motion controls, the phone and keyboard gaps, and the contact error address.

## Global Constraints

- Colours come only from Kraft's CSS variables. `tests/no-raw-colors.test.ts` scans `app`, `components`, `data`, `hooks` and `lib` for `#hex` and `rgb(`/`rgba(` followed by a digit. Only `app/globals.css` may contain them. `scripts/` and `public/` are not scanned.
- Tailwind colour names are the token names: `bg-bg`, `bg-frame`, `bg-s0`…`bg-s3`, `bg-chip`, `bg-hover`, `border-b1`, `border-b2`, `text-ink`, `text-ink-soft`, `text-ink2`…`text-ink4`, `text-accent`, `text-on-accent`, `bg-wash`, `border-wash-b`, `text-danger`, `bg-mac-r|y|g`, `text-veil-ink`, `bg-veil-chip`, `bg-veil-chip-hover`, `border-veil-line`, `to-veil-deep`. Tailwind's own palette is switched off (`--color-*: initial`).
- The desktop breakpoint is the `shell:` variant (≥1100px). `max-shell:` means below it.
- Icons come from `@phosphor-icons/react/ssr` (`HouseIcon`, `XIcon`, …).
- Page copy lives in `data/*.ts`. Components never hard-code copy. Each gap is a string starting `PLACEHOLDER - ` (spec §10).
- Every route is statically generated. Components are Server Components unless they need state, effects or events.
- Three.js loads only by dynamic import. It never loads on a coarse pointer, with reduced motion, with the access menu's "motion off", or at the `low` perf tier (spec §5).
- Every animation has a reduced-motion path. The access menu's motion switch (`html[data-a11y-motion=true]`) takes the same path as the OS setting (spec §11).
- Modals trap focus, close on Esc, return focus to the trigger and lock the page behind them (spec §11). Views use `components/ui/ViewDialog.tsx`.
- Storage can throw. Then the feature simply doesn't persist (spec §12).
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task: `npx tsc --noEmit`, `npm run lint` and `npm test` pass.

## Review Focus

The five failure modes the spec implies that are most likely to bite a visitor, and where each is pinned:

1. **WebGL fails or the context is lost while the drum is showing.** The visitor should get the plain grid back, still able to open every site. Pinned by the Task 6 test "falls back to the grid when WebGL fails".
2. **A sample page file is missing or renamed.** The preview should say where the file goes and still offer "Open in new tab", instead of showing a 404 inside the window. Pinned by the Task 5 test "says where the file goes when the page is missing".
3. **Storage is blocked (private mode, a strict browser).** The access menu's switches should still apply and show as on for this page. Pinned by the Task 8 test "still works when storage is blocked".
4. **The largest text size on a narrow phone.** Zoomed content should never make the page scroll sideways. Pinned by the Task 8 e2e "phone: the largest text never scrolls sideways".
5. **Stacked views.** With the preview over the sites view, closing the preview returns to the sites view with the page still locked. Leaving the sites view (Back) closes both. Esc closes only the top one. Pinned by the Task 1 ViewDialog tests, the Task 5 tests, and the Task 6 e2e "Escape closes only the preview".

---

## File Map

| File | Task | Responsibility |
|---|---|---|
| `components/ui/ViewDialog.tsx` | 1 | Keeps the page locked while any view is open; drag-select guard; returns focus to the page |
| `components/shell/CommandPalette.tsx` | 1 | Returns focus to the trigger before a picked view opens |
| `hooks/useReducedMotion.ts` | 2 | Live "should this move?" (OS setting plus the access switch) |
| `components/services/Method.tsx` | 2 | Follows reduced motion live |
| `components/about/Workstation.tsx`, `components/about/Aside.tsx` | 2 | Workstation GIF with a still frame for reduced motion |
| `scripts/gif-still.mjs`, `public/assets/about-workstation-still.webp` | 2 | Writes the GIF's first frame |
| `components/projects/ReelView.tsx`, `components/projects/StageBar.tsx` | 2 | Reel pause and play button |
| `components/projects/Board.tsx` | 3 | Cards fit a 320px screen |
| `components/services/Automation.tsx` | 3 | Keyboard-scrollable flow canvas |
| `components/contact/ContactForm.tsx` | 3 | Address shown when sending fails |
| `scripts/make-sites.mjs`, `scripts/make-thumbs.mjs`, `public/samples/**` | 4 | Placeholder sample sites and their thumbnails |
| `data/projects.ts` | 4, 5 | Site data (`src`, `thumb`); sites-view and preview copy |
| `hooks/useWebGLAllowed.ts` | 5 | The contour's WebGL gate, as a live hook |
| `components/projects/SiteGrid.tsx` | 5 | Grid of site buttons (server render, phones, fallback) |
| `components/projects/SitePreview.tsx` | 5 | Browser-window preview dialog |
| `components/projects/SitesView.tsx` | 5, 6 | Chooses the drum or the grid; owns the open preview |
| `lib/drum.ts` | 6 | Pure drum geometry |
| `components/projects/SiteDrum.tsx` | 6 | Three.js drum plus a hidden-until-focused button list |
| `data/showcase.ts` | 7 | Showcase copy, tabs and mock content |
| `components/showcase/Flagship.tsx`, `Mock.tsx`, `Feedback.tsx` | 7 | Flagship block, product mock, feedback marquee |
| `app/(site)/showcase/page.tsx` | 7 | The real Showcase page |
| `lib/a11y.ts` (`currentPrefs`), `hooks/useA11yPrefs.ts`, `lib/popover.ts` | 8 | Applied prefs as live state; panel placement |
| `data/access.ts`, `components/shell/AccessMenu.tsx` | 8 | The accessibility menu |
| `data/legal.ts`, `components/shell/LegalLinks.tsx`, `components/plain/*` | 9 | Legal copy and plain-page shell |
| `app/(plain)/**`, `app/not-found.tsx` | 9 | Privacy, Terms, Thank-you and 404 |
| `lib/site.ts`, `lib/seo.ts`, `lib/tokens.ts`, `lib/jsonld.ts`, `lib/share-image.tsx` | 10 | SEO building blocks |
| `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `app/icon.svg`, `app/sitemap.ts`, `app/robots.ts` | 10 | SEO files |
| `scripts/placeholders.ts` | 10 | Lists the remaining PLACEHOLDERs (spec §10) |
| `.env.example`, `e2e/screenshots.spec.ts` | 11 | Deploy settings; screenshot pass |

Branch: `git checkout -b feat/kraft-phase4-showcase-extras` from `main` (d14027a) before Task 1.

---

### Task 1: Dialog and focus fixes

Three deferred Phase 3 minors live in `ViewDialog`, and one lives in the palette:
1. **Lost lock.** When the hash moves from one view straight to another, the old dialog's `close` event fires after the new one's `showModal()`, and it removes `html[data-dialog]`. The stacked preview in Task 5 would hit the same bug.
2. **Drag-select closes a view.** A press inside the view that ends on the backdrop fires `click` on the dialog.
3. **Focus lost after ⌘K.** The palette's focus restore runs in `requestAnimationFrame`, after the view has already recorded `<body>` as the element to return to.

**Files:**
- Modify: `components/ui/ViewDialog.tsx`
- Modify: `components/shell/CommandPalette.tsx:36-39`
- Modify: `tests/ViewDialog.test.tsx`
- Modify: `tests/project-stage.test.tsx` (the backdrop click now needs a press)
- Create: `tests/CommandPalette.focus.test.tsx`

**Interfaces:**
- Consumes: `PANEL_ID` from `lib/scroller.ts` (`'main-content'`).
- Produces: the `ViewDialog` props are unchanged: `{ open, onClose, label, className?, children }`. Behaviour guarantees later tasks rely on:
  - `html[data-dialog]` stays while any `dialog.view[open]` exists.
  - A backdrop close needs the press and the release both on the dialog itself or a `[data-backdrop]` element.
  - With nothing valid to return to, focus goes to `#main-content`.

- [ ] **Step 1: Write the failing tests**

In `tests/ViewDialog.test.tsx`, replace the test `'closes on the backdrop or an empty stage, not on a click inside'`, then add the four new tests before the final `})`:

```tsx
  it('closes on the backdrop or an empty stage, not on a click inside', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    press(screen.getByText('Inside'))
    expect(onClose).not.toHaveBeenCalled()
    press(dialog())
    press(screen.getByText('Empty stage'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when a press inside ends on the backdrop (drag-selecting text)', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    fireEvent.pointerDown(screen.getByText('Inside'))
    fireEvent.click(dialog())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps the page locked when one view hands over straight to another', () => {
    const { rerender } = render(pair(true, false))
    rerender(pair(false, true))
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('keeps the page locked when a view stacked on another closes', () => {
    const { rerender } = render(pair(true, false))
    rerender(pair(true, true))
    rerender(pair(true, false))
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('with nothing focused to go back to, returns focus to the page, not the body', () => {
    const page = (open: boolean) => (
      <main id="main-content" tabIndex={-1}>
        <ViewDialog open={open} onClose={onClose} label="A view">
          <p>Inside</p>
        </ViewDialog>
      </main>
    )
    const { rerender } = render(page(false))
    ;(document.activeElement as HTMLElement | null)?.blur()
    rerender(page(true))
    rerender(page(false))
    expect(screen.getByRole('main')).toHaveFocus()
  })
```

Add these helpers under the existing `const dialog = …` line:

```tsx
/** A real click: the press and the release on the same element. */
const press = (el: Element) => {
  fireEvent.pointerDown(el)
  fireEvent.click(el)
}
/** Two views. B comes first in the tree, so its effect runs before A's (a hash handover from A to B). */
const pair = (a: boolean, b: boolean) => (
  <>
    <ViewDialog open={b} onClose={() => {}} label="B">
      <p>B</p>
    </ViewDialog>
    <ViewDialog open={a} onClose={() => {}} label="A">
      <p>A</p>
    </ViewDialog>
  </>
)
```

In `tests/project-stage.test.tsx`, in `'closes when the empty stage around the reel is clicked'`, replace `fireEvent.click(view.querySelector('.reel') as HTMLElement)` with:

```tsx
    const stage = view.querySelector('.reel') as HTMLElement
    fireEvent.pointerDown(stage)
    fireEvent.click(stage)
```

Create `tests/CommandPalette.focus.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { PaletteProvider, usePalette } from '@/components/shell/CommandPalette'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/projects',
}))

function Opener() {
  const { openPalette } = usePalette()
  return <button onClick={openPalette}>Jump to…</button>
}

describe('CommandPalette and sub-views', () => {
  it('hands focus back to its trigger before a picked view opens, so the view can return it there', async () => {
    window.history.replaceState(null, '', '/projects')
    const user = userEvent.setup()
    render(
      <NavigationProvider>
        <PaletteProvider>
          <Opener />
        </PaletteProvider>
      </NavigationProvider>,
    )
    let focusedWhenViewOpened: Element | null = null
    const onHash = () => {
      focusedWhenViewOpened = document.activeElement
    }
    window.addEventListener('hashchange', onHash)
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('automations{Enter}')
    window.removeEventListener('hashchange', onHash)
    expect(window.location.hash).toBe('#reel')
    expect(focusedWhenViewOpened).toBe(screen.getByText('Jump to…'))
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/ViewDialog.test.tsx tests/CommandPalette.focus.test.tsx`
Expected: FAIL on four tests:
- "does not close when a press inside ends on the backdrop" (onClose called once).
- Both "keeps the page locked" tests (missing `data-dialog`).
- "returns focus to the page" (body keeps focus).

The palette test fails too: `focusedWhenViewOpened` is the combobox input.

- [ ] **Step 3: Implement**

Replace `components/ui/ViewDialog.tsx` with:

```tsx
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
        // Nothing to go back to (a ⌘K pick made with nothing focused): the page itself.
        if (back && back.isConnected && back !== document.body) back.focus()
        else document.getElementById(PANEL_ID)?.focus({ preventScroll: true })
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
```

In `components/shell/CommandPalette.tsx`, replace `closePalette`:

```tsx
  const closePalette = useCallback(() => {
    setOpen(false)
    // Now, as well as after the unmount. A pick that opens a sub-view records
    // the focused element as the one to return to, so the trigger must
    // already hold focus by then.
    returnFocus.current?.focus()
    requestAnimationFrame(() => returnFocus.current?.focus())
  }, [])
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/ViewDialog.test.tsx tests/CommandPalette.focus.test.tsx tests/CommandPalette.test.tsx tests/project-stage.test.tsx tests/projects.test.tsx`
Expected: PASS, all files.

- [ ] **Step 5: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass.

```bash
git add components/ui/ViewDialog.tsx components/shell/CommandPalette.tsx tests/ViewDialog.test.tsx tests/project-stage.test.tsx tests/CommandPalette.focus.test.tsx
git commit -m "fix: views keep the page locked across handovers, ignore drag-selects, and return focus after ⌘K

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Motion controls

Three deferred minors:
- The Method read reduced motion only once, at mount.
- The workstation GIF has no reduced-motion path; CSS can't stop a GIF.
- The reel can't be paused from the keyboard or on touch (WCAG 2.2.2).

This task also produces the live `useReducedMotion` hook that Tasks 5–7 use.

**Files:**
- Create: `hooks/useReducedMotion.ts`
- Modify: `components/services/Method.tsx`
- Create: `components/about/Workstation.tsx`
- Modify: `components/about/Aside.tsx` (remove `Workstation`), `app/(site)/about/page.tsx` (import it)
- Modify: `data/about.ts` (`image.still`)
- Create: `scripts/gif-still.mjs`, `public/assets/about-workstation-still.webp` (generated)
- Modify: `components/projects/StageBar.tsx`, `components/projects/ReelView.tsx`, `data/projects.ts` (reel pause copy), `app/globals.css` (reel pause rules)
- Test: `tests/useReducedMotion.test.tsx`, `tests/services.test.tsx`, `tests/about.test.tsx`, `tests/project-stage.test.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion()` (`lib/motion.ts`); `A11Y_EVENT`, `savePrefs`, `DEFAULT_PREFS` (`lib/a11y.ts`).
- Produces:
  - `useReducedMotion(): boolean` (live, `false` on the server) from `hooks/useReducedMotion.ts`.
  - `StageBar` now accepts `children?: ReactNode`, rendered before its close button.
  - `about.image.still: string`.

- [ ] **Step 1: Write the failing tests**

Create `tests/useReducedMotion.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

describe('useReducedMotion', () => {
  it('follows the OS setting', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('follows the access menu switch as it changes', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(result.current).toBe(true)
    act(() => savePrefs(DEFAULT_PREFS))
    expect(result.current).toBe(false)
  })
})
```

In `tests/services.test.tsx`, add the imports `import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'`. Then add inside `describe('Method')`:

```tsx
  it('stops on the first gate the moment motion is switched off, and carries on after', () => {
    render(<Method />)
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Research')
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(lit()).toBe('Kickoff')
    act(() => vi.advanceTimersByTime(METHOD_MS * 2))
    expect(lit()).toBe('Kickoff')
    act(() => savePrefs(DEFAULT_PREFS))
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Architect')
  })
```

In `tests/about.test.tsx`:
- Change the vitest import to `import { describe, expect, it } from 'vitest'` (unchanged) and the testing-library import to `import { act, render, screen } from '@testing-library/react'`.
- Add `import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'`.
- Add the two tests below:

```tsx
  it('swaps the workstation GIF for a still frame when motion is off', () => {
    render(<AboutPage />)
    const img = screen.getByRole('img', { name: about.image.alt })
    expect(img.getAttribute('src')).toContain('about-workstation.gif')
    expect(document.querySelector('source[media="(prefers-reduced-motion: reduce)"]')?.getAttribute('srcset')).toContain(
      'about-workstation-still.webp',
    )
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(img.getAttribute('src')).toContain('about-workstation-still.webp')
  })

  it('ships the still frame', () => {
    expect(existsSync(`public${about.image.still}`)).toBe(true)
  })
```

In `tests/project-stage.test.tsx`, add inside the `describe`:

```tsx
  it('pauses and plays from a button, for keyboard and touch', () => {
    window.history.replaceState(null, '', '/projects#reel')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Workflow screens' })
    fireEvent.click(within(view).getByRole('button', { name: 'Pause the reel' }))
    expect(view.querySelector('.reel-row')).toHaveAttribute('data-paused')
    fireEvent.click(within(view).getByRole('button', { name: 'Play the reel' }))
    expect(view.querySelector('.reel-row')).not.toHaveAttribute('data-paused')
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/useReducedMotion.test.tsx tests/services.test.tsx tests/about.test.tsx tests/project-stage.test.tsx`
Expected: FAIL.
- `useReducedMotion.test.tsx` can't resolve `@/hooks/useReducedMotion`.
- The new Method test sees `Research` after the switch.
- `about.image.still` is undefined.
- No "Pause the reel" button exists.

- [ ] **Step 3: Implement the hook and the Method**

Create `hooks/useReducedMotion.ts`:

```ts
'use client'

import { useSyncExternalStore } from 'react'
import { A11Y_EVENT } from '@/lib/a11y'
import { prefersReducedMotion } from '@/lib/motion'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void) {
  window.addEventListener(A11Y_EVENT, onChange)
  let mq: MediaQueryList | null = null
  try {
    mq = window.matchMedia(QUERY)
    mq.addEventListener('change', onChange)
  } catch {
    mq = null
  }
  return () => {
    window.removeEventListener(A11Y_EVENT, onChange)
    mq?.removeEventListener('change', onChange)
  }
}

/**
 * The live answer to "should this move?" (spec §11). It follows the OS
 * setting and the access menu's motion switch as either changes. The server
 * render assumes motion; the client corrects it straight after hydration.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false)
}
```

In `components/services/Method.tsx`:
- Replace `import { prefersReducedMotion } from '@/lib/motion'` with `import { useReducedMotion } from '@/hooks/useReducedMotion'`.
- Change the doc comment's last sentence to: `With reduced motion (the OS setting or the access menu, followed live) the first gate stays lit and still.`
- Replace the effect's opening lines and dependency list as below. The body between them is unchanged.

```tsx
  const [step, setStep] = useState(0)
  const still = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (still) return
    let timer: number | undefined
```

```tsx
  }, [still])
```

In the JSX, change `data-on={i === step || undefined}` to `data-on={i === (still ? 0 : step) || undefined}`.

- [ ] **Step 4: Generate the still frame and build the Workstation**

Create `scripts/gif-still.mjs`:

```js
// Writes the first frame of the workstation GIF as a still image, for
// reduced motion (spec §11): CSS can't stop a GIF. Re-run if the GIF changes.
// Run: node scripts/gif-still.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const SRC = 'public/assets/about-workstation.gif'
const OUT = 'public/assets/about-workstation-still.webp'

const browser = await chromium.launch()
const page = await browser.newPage()
const dataUrl = await page.evaluate(async (src) => {
  const img = new Image()
  img.src = src
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  // An animated image not in the document draws its first frame.
  c.getContext('2d').drawImage(img, 0, 0)
  return c.toDataURL('image/webp', 0.86)
}, `data:image/gif;base64,${readFileSync(SRC).toString('base64')}`)
writeFileSync(OUT, Buffer.from(dataUrl.split(',')[1], 'base64'))
await browser.close()
console.log(`wrote ${OUT}`)
```

Run: `node scripts/gif-still.mjs`
Expected: `wrote public/assets/about-workstation-still.webp`. Open the file to confirm it shows the workstation scene, not a blank frame.

In `data/about.ts`, add `still: '/assets/about-workstation-still.webp',` to `image`, after `src`.

Create `components/about/Workstation.tsx`:

```tsx
'use client'

import { getImageProps } from 'next/image'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { about } from '@/data/about'

/**
 * The workstation GIF and its caption (KraftScreens.dc.html:430-436). A GIF
 * can't be paused, so reduced motion gets its first frame instead. The
 * <source> covers the OS setting from the first paint; the access menu's
 * switch swaps the <img> once the page is live.
 */
export default function Workstation() {
  const img = about.image
  const still = useReducedMotion()
  const common = { alt: img.alt, width: img.width, height: img.height, unoptimized: true }
  const { props: gif } = getImageProps({ ...common, src: img.src })
  const { props: frame } = getImageProps({ ...common, src: img.still })
  return (
    <figure className="m-0 overflow-hidden rounded-[20px] border border-b1 bg-frame">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={frame.src} />
        <img {...(still ? frame : gif)} alt={img.alt} className="block h-auto w-full" />
      </picture>
      <figcaption className="flex items-center gap-[9px] border-t border-b1 px-4 py-[13px]">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-[.1em] text-ink3">{img.caption}</span>
      </figcaption>
    </figure>
  )
}
```

In `components/about/Aside.tsx`:
- Delete the `Workstation` function and its doc comment.
- Delete the now-unused `import Image from 'next/image'`.

In `app/(site)/about/page.tsx`, replace `import { Location, Workstation } from '@/components/about/Aside'` with:

```tsx
import { Location } from '@/components/about/Aside'
import Workstation from '@/components/about/Workstation'
```

- [ ] **Step 5: Add the reel's pause button**

In `data/projects.ts`, add to `reel` after `hint`:

```ts
    pause: 'PAUSE', play: 'PLAY', pauseLabel: 'Pause the reel', playLabel: 'Play the reel',
```

Replace `components/projects/StageBar.tsx` with:

```tsx
import type { ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'

type Props = { kicker: string; hint?: string; onClose: () => void; children?: ReactNode }

/** The strip across the top of a dark-stage view (Kraft Projects Board.dc.html:244-248, 270-273). `children` are extra controls beside Close. */
export default function StageBar({ kicker, hint, onClose, children }: Props) {
  return (
    <div className="relative flex items-center gap-3 px-5 py-4 text-veil-ink">
      <span className="font-mono text-[10.5px] tracking-[.16em] opacity-70">{kicker}</span>
      {hint && <span className="font-mono text-[10.5px] tracking-[.16em] opacity-45 max-shell:hidden">{hint}</span>}
      <div className="ml-auto flex items-center gap-2">
        {children}
        <button
          type="button"
          onClick={onClose}
          aria-label={projects.close}
          className="grid size-11 cursor-pointer place-items-center rounded-xl border border-veil-line bg-veil-chip text-veil-ink transition-colors duration-200 hover:bg-veil-chip-hover"
        >
          <XIcon size={18} aria-hidden />
        </button>
      </div>
    </div>
  )
}
```

In `components/projects/ReelView.tsx`:
- Add `import { useState, type CSSProperties } from 'react'` in place of the `CSSProperties` type import.
- Add `import { PauseIcon, PlayIcon } from '@phosphor-icons/react/ssr'`.
- Add to the doc comment: `A button pauses it too, for keyboard and touch (WCAG 2.2.2).`
- Change the body:

```tsx
export default function ReelView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const r = projects.reel
  const [paused, setPaused] = useState(false)
  const loop = [...r.shots, ...r.shots]
  return (
    <ViewDialog open={open} onClose={onClose} label={r.label} className="view--stage">
      <StageBar kicker={r.kicker} hint={r.hint} onClose={onClose}>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? r.playLabel : r.pauseLabel}
          className="reel-pause flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-veil-line bg-veil-chip px-3.5 font-mono text-[10.5px] tracking-[.14em] text-veil-ink transition-colors duration-200 hover:bg-veil-chip-hover"
        >
          {paused ? <PlayIcon size={14} weight="fill" aria-hidden /> : <PauseIcon size={14} weight="fill" aria-hidden />}
          {paused ? r.play : r.pause}
        </button>
      </StageBar>
      <div data-backdrop className="reel relative flex min-h-0 flex-1 items-center overflow-hidden">
        <div
          data-backdrop
          data-paused={paused || undefined}
          className="reel-row flex h-full w-max items-center gap-7 px-3.5"
          style={{ '--marq': `${r.seconds}s` } as CSSProperties}
        >
```

The `figure` loop and the closing tags below it are unchanged.

In `app/globals.css`, in the reel block, replace the line `.reel-row:hover,.reel-row:focus-within{animation-play-state:paused}` and the three reduced-motion lines after it with:

```css
.reel-row:hover,.reel-row:focus-within,.reel-row[data-paused]{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.reel{overflow-x:auto}.reel-row{animation:none}.reel-pause{display:none}}
html[data-a11y-motion=true] .reel{overflow-x:auto}
html[data-a11y-motion=true] .reel-row{animation:none}
html[data-a11y-motion=true] .reel-pause{display:none}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/useReducedMotion.test.tsx tests/services.test.tsx tests/about.test.tsx tests/project-stage.test.tsx`
Expected: PASS.

- [ ] **Step 7: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`
Expected: all pass.

```bash
git add hooks/useReducedMotion.ts components/services/Method.tsx components/about data/about.ts "app/(site)/about/page.tsx" scripts/gif-still.mjs public/assets/about-workstation-still.webp components/projects/StageBar.tsx components/projects/ReelView.tsx data/projects.ts app/globals.css tests/useReducedMotion.test.tsx tests/services.test.tsx tests/about.test.tsx tests/project-stage.test.tsx
git commit -m "fix: live reduced motion for the Method, a still workstation frame, and a reel pause button

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Phone and keyboard gaps, contact address

Three deferred minors:
- **Board overflow at 320px.** Two cards have `min-w-[270px]`, which at 320px is 6px wider than the frame leaves room for (measured: `#reel` and `#ai-agents` end at 298px, the others at 292px).
- **Flow canvas.** It scrolls sideways but can't be reached by keyboard.
- **Endpoint error.** A server error shows no email address.

**Files:**
- Modify: `components/projects/Board.tsx:61,153` (the two `min-w-[270px]`)
- Modify: `components/services/Automation.tsx` (the `overflow-x-auto` wrapper), `data/services.ts` (`automation.canvasLabel`)
- Modify: `components/contact/ContactForm.tsx` (error branch), `data/contact.ts` (`errors.direct`)
- Test: `tests/Automation.test.tsx`, `tests/ContactForm.test.tsx`, `e2e/phone.spec.ts`

**Interfaces:**
- Consumes: `profile.email` (`data/profile.ts`).
- Produces: `servicesPage.automation.canvasLabel: string`; `contact.errors.direct: string`.

- [ ] **Step 1: Write the failing tests**

In `tests/Automation.test.tsx`:
- Add `import { servicesPage } from '@/data/services'` if missing.
- Add inside the `describe`:

```tsx
  it('lets the keyboard scroll the flow canvas sideways', () => {
    render(<Automation />)
    expect(screen.getByRole('region', { name: servicesPage.automation.canvasLabel })).toHaveAttribute('tabindex', '0')
  })
```

In `tests/ContactForm.test.tsx`, add:

```tsx
  it('offers the address to write to when sending fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Inbox is full.' }), { status: 503 })))
    const user = userEvent.setup()
    render(<ContactForm endpoint="https://hooks.example/lead" />)
    await fill(user)
    await user.click(submit())
    await screen.findByRole('alert')
    expect(screen.getByText(contact.errors.direct, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
  })
```

In `e2e/phone.spec.ts`, add after `'phone: no page scrolls sideways'`:

```ts
test('phone: at 320px every Projects card fits its frame and nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 })
  for (const r of ['/projects', '/services', '/testimonials', '/about', '/contact']) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
  await page.goto('/projects')
  const rights = await page.locator('main a[href^="#"]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().right)))
  expect(new Set(rights).size, `card right edges: ${rights.join(', ')}`).toBe(1)
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/Automation.test.tsx tests/ContactForm.test.tsx`
Expected: FAIL. There is no region named by `canvasLabel`, and `contact.errors.direct` is undefined.

Run: `npx playwright test e2e/phone.spec.ts --project=phone -g "320px"`
Expected: FAIL with `card right edges: 298, 292, 292, 292, 292, 292, 298`.

- [ ] **Step 3: Implement**

In `components/projects/Board.tsx`, change both occurrences of `min-w-[270px]` to `min-w-[min(270px,100%)]`.

In `data/services.ts`, add to `automation` (next to `prev`/`next`):

```ts
    canvasLabel: 'Flow canvas. Scroll sideways to see all of it.',
```

In `components/services/Automation.tsx`, change the canvas wrapper `<div className="overflow-x-auto overflow-y-hidden bg-[radial-gradient(60%_100%_at_50%_0,var(--wash),transparent_70%)] px-[18px] py-5">` to:

```tsx
          <div
            role="region"
            aria-label={a.canvasLabel}
            tabIndex={0}
            className="overflow-x-auto overflow-y-hidden bg-[radial-gradient(60%_100%_at_50%_0,var(--wash),transparent_70%)] px-[18px] py-5"
          >
```

In `data/contact.ts`, add to `errors` after `failed`:

```ts
    direct: 'Or write to',
```

In `components/contact/ContactForm.tsx`, replace the error branch of the status line:

```tsx
        {status.kind === 'error' ? (
          <div className="flex flex-col gap-1">
            <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-ink2">
              <WarningCircleIcon size={16} aria-hidden className="shrink-0 text-danger" />
              {status.note}
            </p>
            <p className="text-[12.5px] text-ink3">
              {contact.errors.direct} <span className="font-mono break-all text-ink2 select-all">{profile.email}</span>
            </p>
          </div>
        ) : (
```

`profile` is already imported for the Sent card. If it isn't, add `import { profile } from '@/data/profile'`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/Automation.test.tsx tests/ContactForm.test.tsx`
Expected: PASS.

Run: `npx playwright test e2e/phone.spec.ts --project=phone`
Expected: PASS, including the new 320px test.

- [ ] **Step 5: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add components/projects/Board.tsx components/services/Automation.tsx data/services.ts components/contact/ContactForm.tsx data/contact.ts tests/Automation.test.tsx tests/ContactForm.test.tsx e2e/phone.spec.ts
git commit -m "fix: Projects cards fit 320px, the flow canvas scrolls by keyboard, a failed send shows the address

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Sample sites and their thumbnails

The drum and the grid need real files:
- a self-contained page for each of Kraft's 8 site names in `public/samples/`, which the preview loads;
- a 3:4 thumbnail of each in `public/samples/thumbs/`, used as the drum's textures and the grid's images.

Kraft's export has no sample pages, so a script writes neutral PLACEHOLDER pages, and a second script photographs them.

**Files:**
- Create: `scripts/make-sites.mjs`, `scripts/make-thumbs.mjs`
- Create (generated): `public/samples/sample-*.html` (8), `public/samples/thumbs/sample-*.jpeg` (8)
- Modify: `data/projects.ts` (`Site` type and `SITES`), `components/projects/SitesView.tsx` (one line), `package.json` (scripts)
- Test: `tests/projects.test.tsx`

**Interfaces:**
- Produces: `export type Site = { name: string; file: string; src: string; thumb: string }` in `data/projects.ts`. `src` is `/samples/<file>` and `thumb` is `/samples/thumbs/<file stem>.jpeg`. `projects.sitesView.sites: Site[]` keeps Kraft's order.

- [ ] **Step 1: Write the failing test**

In `tests/projects.test.tsx`:
- Add `import { existsSync } from 'node:fs'` at the top.
- Add inside `describe('Projects data')`:

```tsx
  it('has a page and a thumbnail on disk for every sample site', () => {
    for (const s of projects.sitesView.sites) {
      expect(s.src).toBe(`/samples/${s.file}`)
      expect(s.thumb).toBe(`/samples/thumbs/${s.file.replace(/\.html$/, '.jpeg')}`)
      expect(existsSync(`public${s.src}`), s.src).toBe(true)
      expect(existsSync(`public${s.thumb}`), s.thumb).toBe(true)
    }
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/projects.test.tsx`
Expected: FAIL, because `s.src` is undefined.

- [ ] **Step 3: Write the two scripts**

Create `scripts/make-sites.mjs`:

```js
// Writes a stand-in page for each sample site on the Projects drum into
// public/samples/. Each page is self-contained HTML (no requests), so the
// preview can load it. When you have a real site, replace its file (keep the
// name, or change it in SITES in data/projects.ts too), then `npm run thumbs`.
// Run: npm run sites   (writes the pages, then the thumbnails)
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/** Keep in step with SITES in data/projects.ts (tests/projects.test.tsx checks every file exists). */
const SITES = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html', 'Auto repair and performance tuning'],
  ['Blade Studio', 'sample-brand-studio.html', 'Brand studio'],
  ['Below Ground', 'sample-utility-contractor.html', 'Utility contractor'],
  ['Baptiste', 'sample-law-firm.html', 'Law firm'],
  ['One Hour Therapy', 'sample-therapy-clinic.html', 'Therapy clinic'],
  ['Trusted Mover', 'sample-moving-company.html', 'Moving company'],
  ['Payline', 'sample-fintech-funnel.html', 'Fintech funnel'],
  ['Solar Field', 'sample-solar-installer.html', 'Solar installer'],
]

// The client's own colours, not Kraft's: these stand in for other businesses' sites.
const PALETTES = [
  { bg: '#111316', surface: '#1B1F24', ink: '#F4F5F7', muted: '#9AA3AE', accent: '#F2542D' },
  { bg: '#F6F1EA', surface: '#FFFFFF', ink: '#1D1A17', muted: '#7A6F66', accent: '#B4532A' },
  { bg: '#FFF8E7', surface: '#FFFFFF', ink: '#1F2A1F', muted: '#6B7565', accent: '#C98A00' },
  { bg: '#0F1A2B', surface: '#172538', ink: '#EEF2F7', muted: '#93A3B8', accent: '#C9A86A' },
  { bg: '#F1F5F3', surface: '#FFFFFF', ink: '#1B2B27', muted: '#6A7C77', accent: '#3C8D7A' },
  { bg: '#FFFFFF', surface: '#F2F5FA', ink: '#0E1B33', muted: '#667085', accent: '#1F6FEB' },
  { bg: '#0B0B12', surface: '#161625', ink: '#F5F5FF', muted: '#A3A3C2', accent: '#7C5CFF' },
  { bg: '#FFFBF2', surface: '#FFFFFF', ink: '#1A1A10', muted: '#77735E', accent: '#E08A00' },
]

const css = (p) => `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:${p.bg};color:${p.ink};line-height:1.5}
a{color:inherit;text-decoration:none}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px}
nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0}
.logo{font-weight:800;letter-spacing:-.02em;font-size:18px}
.logo b{color:${p.accent}}
.links{display:flex;gap:28px;font-size:14px;color:${p.muted}}
.btn{display:inline-block;background:${p.accent};color:${p.bg};font-weight:700;font-size:15px;padding:14px 26px;border-radius:999px}
.btn--ghost{background:transparent;color:${p.ink};border:1px solid ${p.muted}66}
.tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${p.accent};margin-bottom:18px}
h1{font-size:clamp(40px,6vw,72px);line-height:1.02;letter-spacing:-.035em;font-weight:800;max-width:14ch}
p.lede{font-size:18px;color:${p.muted};max-width:46ch;margin:22px 0 32px}
.hero{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;padding:56px 0 80px}
.shot{aspect-ratio:4/5;border-radius:24px;background:repeating-linear-gradient(135deg,${p.surface} 0 14px,${p.bg} 14px 28px);border:1px solid ${p.muted}33;display:grid;place-items:center;text-align:center;padding:24px;color:${p.muted};font-size:14px}
.shot strong{display:block;color:${p.ink};font-size:16px;margin-bottom:6px}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:24px 0 80px}
.card{background:${p.surface};border:1px solid ${p.muted}22;border-radius:20px;padding:28px}
.card .n{font-size:13px;font-weight:700;color:${p.accent};margin-bottom:26px}
.card h3{font-size:20px;margin-bottom:8px}
.card p{color:${p.muted};font-size:15px}
.band{background:${p.surface};border-radius:28px;padding:56px;display:grid;grid-template-columns:1fr auto;gap:32px;align-items:center;margin-bottom:80px}
.quote{font-size:24px;line-height:1.35;max-width:40ch}
.who{margin-top:16px;color:${p.muted};font-size:14px}
footer{border-top:1px solid ${p.muted}33;padding:28px 0 40px;color:${p.muted};font-size:13px;display:flex;justify-content:space-between}
@media (max-width:760px){.hero,.band{grid-template-columns:1fr}.row{grid-template-columns:1fr}.links{display:none}}
`

const page = (name, file, kind, p) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>${name}</title><style>${css(p)}</style></head>
<body><div class="wrap">
<nav><span class="logo">${name}<b>.</b></span>
<span class="links"><a href="#">Services</a><a href="#">About</a><a href="#">Contact</a></span>
<a class="btn" href="#">PLACEHOLDER CTA</a></nav>
<section class="hero"><div>
<span class="tag">PLACEHOLDER - ${kind}</span>
<h1>${name}</h1>
<p class="lede">PLACEHOLDER - swap this page for the real ${name} site. One line on who it was for and what it had to do.</p>
<a class="btn" href="#">PLACEHOLDER CTA</a> <a class="btn btn--ghost" href="#">Secondary</a>
</div><div class="shot"><div><strong>PLACEHOLDER IMAGE</strong>The site's hero photo or product shot</div></div></section>
<div class="row">${[1, 2, 3]
  .map((i) => `<div class="card"><div class="n">0${i}</div><h3>PLACEHOLDER</h3><p>A benefit, a step, or a feature from the real site.</p></div>`)
  .join('')}</div>
<div class="band"><div><p class="quote">"PLACEHOLDER - a short testimonial from the client this site was built for."</p>
<p class="who">PLACEHOLDER NAME, ${name}</p></div><a class="btn" href="#">PLACEHOLDER</a></div>
<footer><span>&copy; ${name}</span><span>Replace this file: public/samples/${file}</span></footer>
</div></body></html>
`

const dir = join(process.cwd(), 'public', 'samples')
mkdirSync(join(dir, 'thumbs'), { recursive: true })
SITES.forEach(([name, file, kind], i) => writeFileSync(join(dir, file), page(name, file, kind, PALETTES[i % PALETTES.length])))
console.log(`wrote ${SITES.length} sample pages to public/samples/`)
```

Create `scripts/make-thumbs.mjs`:

```js
// Photographs every page in public/samples/ as a 3:4 thumbnail: the drum's
// textures and the grid's images on Projects → Funnels and sites.
// Run after changing a sample page: npm run thumbs
import { mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from '@playwright/test'

const dir = join(process.cwd(), 'public', 'samples')
mkdirSync(join(dir, 'thumbs'), { recursive: true })
const browser = await chromium.launch()
// Laid out at 1080×1440, saved at 0.6×: sharp on the drum, light to download.
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 0.6 })
const files = readdirSync(dir).filter((f) => f.endsWith('.html'))
for (const f of files) {
  await page.goto(pathToFileURL(join(dir, f)).href)
  await page.screenshot({ path: join(dir, 'thumbs', f.replace(/\.html$/, '.jpeg')), type: 'jpeg', quality: 82 })
}
await browser.close()
console.log(`wrote ${files.length} thumbnails to public/samples/thumbs/`)
```

In `package.json` `scripts`, add after `"shots"`:

```json
    "sites": "node scripts/make-sites.mjs && node scripts/make-thumbs.mjs",
    "thumbs": "node scripts/make-thumbs.mjs"
```

Run: `npm run sites`
Expected: `wrote 8 sample pages to public/samples/`, then `wrote 8 thumbnails to public/samples/thumbs/`. Open two thumbnails to confirm each shows its site's name in the hero.

- [ ] **Step 4: Change the site data**

In `data/projects.ts`, replace the `Site` type and `SITES`:

```ts
export type Site = { name: string; file: string; src: string; thumb: string }
```

```ts
/**
 * Kraft's sample sites, in its order. Every page is a PLACEHOLDER written by
 * scripts/make-sites.mjs. Replace a page in public/samples/, then run
 * `npm run thumbs` to re-shoot its thumbnail.
 */
const SITES: Site[] = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html'],
  ['Blade Studio', 'sample-brand-studio.html'],
  ['Below Ground', 'sample-utility-contractor.html'],
  ['Baptiste', 'sample-law-firm.html'],
  ['One Hour Therapy', 'sample-therapy-clinic.html'],
  ['Trusted Mover', 'sample-moving-company.html'],
  ['Payline', 'sample-fintech-funnel.html'],
  ['Solar Field', 'sample-solar-installer.html'],
].map(([name, file]) => ({ name, file, src: `/samples/${file}`, thumb: `/samples/thumbs/${file.replace(/\.html$/, '.jpeg')}` }))
```

In `components/projects/SitesView.tsx`, change `src={site.shot}` to `src={site.thumb}`. `Shot` shows the image because the path is no longer a PLACEHOLDER. Task 5 rewrites this file.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/projects.test.tsx tests/project-stage.test.tsx`
Expected: PASS.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add scripts/make-sites.mjs scripts/make-thumbs.mjs public/samples package.json data/projects.ts components/projects/SitesView.tsx tests/projects.test.tsx
git commit -m "feat: placeholder pages and thumbnails for Kraft's eight sample sites

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The site grid and the live preview

The sites view becomes interactive. Each site is a button that opens Kraft's site preview: a browser window stacked on the sites view that loads the real page (Kraft Projects Board.dc.html:288-311, kape FunnelModal.tsx). The grid is what the server renders, and what phones and any visitor without the drum get. `useWebGLAllowed` is added here so Task 6 can switch on the drum.

**Files:**
- Create: `hooks/useWebGLAllowed.ts`, `components/projects/SiteGrid.tsx`, `components/projects/SitePreview.tsx`
- Rewrite: `components/projects/SitesView.tsx`
- Modify: `data/projects.ts` (`sitesView` copy)
- Test: create `tests/useWebGLAllowed.test.tsx` and `tests/sites.test.tsx`. Modify `tests/project-stage.test.tsx` (delete `'lists the eight sample sites by name'`) and `tests/projects.test.tsx` (dialog count). Modify `e2e/phone.spec.ts`.

**Interfaces:**
- Consumes:
  - `ViewDialog` (Task 1 behaviour: the stacked lock and the backdrop press rule).
  - `Site` (Task 4).
  - `shouldRunContour(env)` (`lib/background.ts`), `getPerfTier()` and `PERF_TIER_EVENT` (`lib/perf.ts`), `A11Y_EVENT` (`lib/a11y.ts`), `prefersReducedMotion()` (`lib/motion.ts`).
- Produces:
  - `useWebGLAllowed(): boolean`. It is live, `false` on the server.
  - `SiteGrid({ sites: Site[]; onOpen: (site: Site) => void })`.
  - `SitePreview({ site: Site | null; onClose: () => void })`.
  - `projects.sitesView` shape: `{ label, kicker, hint, listLabel, open, siteKicker, sites, preview: { label, newTab, close, upload, uploadTail, uploadNote } }`.

- [ ] **Step 1: Write the failing tests**

Create `tests/useWebGLAllowed.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWebGLAllowed } from '@/hooks/useWebGLAllowed'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { applyPerfTier } from '@/lib/perf'
import { installMatchMedia } from '@/test/matchMedia'

describe('useWebGLAllowed', () => {
  it('allows WebGL on a fine pointer, with motion, at a healthy tier', () => {
    expect(renderHook(() => useWebGLAllowed()).result.current).toBe(true)
  })

  it('says no on touch screens', () => {
    installMatchMedia({ '(pointer: coarse) and (hover: none)': true })
    expect(renderHook(() => useWebGLAllowed()).result.current).toBe(false)
  })

  it('says no the moment motion is switched off or the tier drops to low', () => {
    const { result } = renderHook(() => useWebGLAllowed())
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(result.current).toBe(false)
    act(() => savePrefs(DEFAULT_PREFS))
    expect(result.current).toBe(true)
    act(() => applyPerfTier('low'))
    expect(result.current).toBe(false)
  })
})
```

Create `tests/sites.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'
import { projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

const TOUCH = { '(pointer: coarse) and (hover: none)': true }
const sites = projects.sitesView.sites
const answer = (status: number) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })))

function openSites() {
  window.history.replaceState(null, '', '/projects#sites')
  render(<ProjectViews />)
  return screen.getByRole('dialog', { name: 'Funnels and sites' })
}

describe('Funnels and sites: the grid and the preview', () => {
  beforeEach(() => {
    installMatchMedia(TOUCH)
    answer(200)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('lists every sample site as a button, in order', () => {
    const view = openSites()
    const list = within(view).getByRole('list', { name: 'Sample sites' })
    expect(within(list).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(sites.map((s) => `Open ${s.name}`))
  })

  it('opens a site in the preview window, with the page and a new-tab link', async () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Apex Build Co.' }))
    const preview = screen.getByRole('dialog', { name: 'Apex Build Co. preview' })
    expect(preview).toHaveAttribute('open')
    expect(within(preview).getByTitle('Apex Build Co.')).toHaveAttribute('src', sites[0].src)
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toHaveAttribute('href', sites[0].src)
    await act(async () => {})
    expect(within(preview).getByTitle('Apex Build Co.')).toBeInTheDocument()
  })

  it('closing the preview goes back to the sites, with the page still locked', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Blade Studio' }))
    const preview = screen.getByRole('dialog', { name: 'Blade Studio preview' })
    fireEvent.click(within(preview).getByRole('button', { name: 'Close preview' }))
    expect(preview).not.toHaveAttribute('open')
    expect(view).toHaveAttribute('open')
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('says where the file goes when the page is missing', async () => {
    answer(404)
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Payline' }))
    const preview = screen.getByRole('dialog', { name: 'Payline preview' })
    expect(await within(preview).findByText(sites[6].file)).toBeInTheDocument()
    expect(within(preview).queryByTitle('Payline')).toBeNull()
    expect(within(preview).getByRole('link', { name: 'Open in new tab' })).toBeInTheDocument()
  })

  it('leaving the sites view closes the preview on it too', () => {
    const view = openSites()
    fireEvent.click(within(view).getByRole('button', { name: 'Open Baptiste' }))
    act(() => {
      window.history.replaceState(null, '', '/projects')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(view).not.toHaveAttribute('open')
    expect(screen.getByRole('dialog', { name: 'Baptiste preview', hidden: true })).not.toHaveAttribute('open')
  })
})
```

In `tests/project-stage.test.tsx`, delete the test `'lists the eight sample sites by name'`; `tests/sites.test.tsx` replaces it.

In `tests/projects.test.tsx`, in `'pre-renders every view, closed'`, change the count line to:

```tsx
    // Every sub-view, plus the site preview that stacks on the sites view.
    expect(dialogs).toHaveLength(PROJECT_VIEWS.length + 1)
```

In `e2e/phone.spec.ts`, add:

```ts
test('phone: the sites are a grid, and a tap previews the page', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  await expect(view.locator('canvas')).toHaveCount(0)
  await view.getByRole('button', { name: 'Open Apex Build Co.' }).tap()
  const preview = page.getByRole('dialog', { name: 'Apex Build Co. preview' })
  await expect(preview).toBeVisible()
  await expect(page.frameLocator('iframe[title="Apex Build Co."]').getByRole('heading', { level: 1, name: 'Apex Build Co.' })).toBeVisible()
  await preview.getByRole('button', { name: 'Close preview' }).tap()
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/useWebGLAllowed.test.tsx tests/sites.test.tsx tests/projects.test.tsx`
Expected: FAIL.
- `@/hooks/useWebGLAllowed` doesn't resolve.
- There is no list named "Sample sites".
- The dialog count is 7, not 8.

- [ ] **Step 3: Implement the hook**

Create `hooks/useWebGLAllowed.ts`:

```ts
'use client'

import { useSyncExternalStore } from 'react'
import { A11Y_EVENT } from '@/lib/a11y'
import { shouldRunContour } from '@/lib/background'
import { prefersReducedMotion } from '@/lib/motion'
import { getPerfTier, PERF_TIER_EVENT } from '@/lib/perf'

const COARSE = '(pointer: coarse) and (hover: none)'

function allowed(): boolean {
  let coarse = false
  try {
    coarse = window.matchMedia(COARSE).matches
  } catch {
    coarse = false
  }
  return shouldRunContour({ reducedMotion: prefersReducedMotion(), coarsePointer: coarse, tier: getPerfTier() })
}

function subscribe(onChange: () => void) {
  window.addEventListener(A11Y_EVENT, onChange)
  window.addEventListener(PERF_TIER_EVENT, onChange)
  return () => {
    window.removeEventListener(A11Y_EVENT, onChange)
    window.removeEventListener(PERF_TIER_EVENT, onChange)
  }
}

/**
 * Spec §5's gate for anything WebGL (the contour uses the same rule):
 * never on touch, never with reduced motion or the access menu's "motion
 * off", never at the low perf tier. Live, and `false` on the server, so the
 * pre-rendered page always has the plain version.
 */
export function useWebGLAllowed(): boolean {
  return useSyncExternalStore(subscribe, allowed, () => false)
}
```

- [ ] **Step 4: Implement the copy, the grid, the preview and the view**

In `data/projects.ts`, replace the `sitesView` line with:

```ts
  sitesView: {
    label: 'Funnels and sites',
    kicker: 'FUNNELS AND SITES',
    hint: 'DRAG TO SPIN · CLICK A PAGE TO OPEN',
    listLabel: 'Sample sites',
    open: 'Open',
    siteKicker: 'SITE',
    sites: SITES,
    /** Kraft's site preview (Kraft Projects Board.dc.html:288-311). */
    preview: {
      label: 'preview',
      newTab: 'Open in new tab',
      close: 'Close preview',
      upload: 'Upload',
      uploadTail: 'to public/samples/ and this page opens live.',
      uploadNote: 'STANDALONE HTML · SAME FOLDER',
    },
  },
```

Create `components/projects/SiteGrid.tsx`:

```tsx
import Image from 'next/image'
import { projects, type Site } from '@/data/projects'

/**
 * The sample sites as a grid of buttons. It is what the server renders and
 * what touch screens, reduced motion, the low perf tier and a failed drum
 * get (spec §5). Each button opens the site's preview.
 */
export default function SiteGrid({ sites, onOpen }: { sites: Site[]; onOpen: (site: Site) => void }) {
  const s = projects.sitesView
  return (
    <div data-backdrop className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
      <ul
        data-backdrop
        aria-label={s.listLabel}
        className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4"
      >
        {sites.map((site) => (
          <li key={site.file}>
            <button
              type="button"
              onClick={() => onOpen(site)}
              aria-label={`${s.open} ${site.name}`}
              className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[14px] border border-b2 bg-s1 p-0 shadow-(--shot-shadow) transition-colors duration-250 hover:border-accent"
            >
              <Image src={site.thumb} alt="" fill sizes="(max-width: 700px) 45vw, 200px" className="object-cover object-top" />
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-veil-deep px-[11px] py-[9px] text-left font-mono text-[10px] tracking-[.1em] text-veil-ink"
              >
                {site.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Create `components/projects/SitePreview.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ArrowSquareOutIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'

type Check = { src: string; ok: boolean }

const CHROME_BUTTON =
  'grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover'

/**
 * Kraft's site preview (Kraft Projects Board.dc.html:288-311, kape
 * FunnelModal.tsx). A browser window stacks on the sites view and loads the
 * real page, so a visitor never leaves. The page is checked first: if it is
 * missing, the window says where the file goes, and "Open in new tab" is
 * always there (spec §12). It is closed by Close, Esc, or leaving the sites view.
 */
export default function SitePreview({ site, onClose }: { site: Site | null; onClose: () => void }) {
  const p = projects.sitesView.preview
  // The last site shown, so the window keeps its content while it closes.
  const [shown, setShown] = useState(site)
  if (site && site !== shown) setShown(site)
  const [check, setCheck] = useState<Check | null>(null)

  useEffect(() => {
    if (!site) return
    let live = true
    fetch(site.src, { method: 'HEAD' })
      .then((r) => live && setCheck({ src: site.src, ok: r.ok }))
      .catch(() => live && setCheck({ src: site.src, ok: false }))
    return () => {
      live = false
    }
  }, [site])

  const missing = !!site && check?.src === site.src && !check.ok
  return (
    <ViewDialog open={!!site} onClose={onClose} label={shown ? `${shown.name} ${p.label}` : p.label} className="view--window">
      {shown && (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
          <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="mx-2 min-w-0 flex-1 truncate rounded-full border border-b1 bg-s1 px-3 py-[7px] font-mono text-[11.5px] text-ink2">
              {window.location.host}
              {shown.src}
            </span>
            <a href={shown.src} target="_blank" rel="noopener" aria-label={p.newTab} className={CHROME_BUTTON}>
              <ArrowSquareOutIcon size={17} aria-hidden />
            </a>
            <button type="button" onClick={onClose} aria-label={p.close} className={CHROME_BUTTON}>
              <XIcon size={17} aria-hidden />
            </button>
          </div>
          <div className="relative flex-1 bg-s1">
            {site && !missing && <iframe src={site.src} title={site.name} className="absolute inset-0 size-full border-0" />}
            {missing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center text-ink2">
                <UploadSimpleIcon size={26} aria-hidden />
                <p className="text-sm">
                  {p.upload} <strong className="text-ink">{shown.file}</strong> {p.uploadTail}
                </p>
                <span className="font-mono text-[10.5px] tracking-[.12em] opacity-60">{p.uploadNote}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </ViewDialog>
  )
}
```

Replace `components/projects/SitesView.tsx`:

```tsx
'use client'

import { useState } from 'react'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Site } from '@/data/projects'
import SiteGrid from './SiteGrid'
import SitePreview from './SitePreview'
import StageBar from './StageBar'

/**
 * Funnels and sites (Kraft Projects Board.dc.html:267-286). The sites sit on
 * a dark stage, and each one opens the live preview stacked on top.
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  const [site, setSite] = useState<Site | null>(null)
  // Leaving the view (Close, Esc, Back) closes the preview on it too.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setSite(null)
  }
  return (
    <>
      <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
        <StageBar kicker={s.kicker} onClose={onClose} />
        <SiteGrid sites={s.sites} onOpen={setSite} />
      </ViewDialog>
      <SitePreview site={site} onClose={() => setSite(null)} />
    </>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/useWebGLAllowed.test.tsx tests/sites.test.tsx tests/projects.test.tsx tests/project-stage.test.tsx`
Expected: PASS.

Run: `npx playwright test e2e/phone.spec.ts --project=phone -g "sites"`
Expected: PASS.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add hooks/useWebGLAllowed.ts components/projects/SiteGrid.tsx components/projects/SitePreview.tsx components/projects/SitesView.tsx data/projects.ts tests/useWebGLAllowed.test.tsx tests/sites.test.tsx tests/project-stage.test.tsx tests/projects.test.tsx e2e/phone.spec.ts
git commit -m "feat: every sample site opens Kraft's live preview, stacked on the sites view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: The 3D funnel drum

This ports kape's `FunnelBarrel.tsx` (`reference/kapeportfolio/src/components/FunnelBarrel.tsx`) as `SiteDrum`. It replaces the grid inside the sites view wherever `useWebGLAllowed()` is true:
- The pure geometry moves to `lib/drum.ts`, so it can be tested.
- Kape's tag colours are dropped. The hover label and hint use Kraft's stage tokens.
- The drum is `React.lazy`-loaded when the view first opens. Three.js never reaches the `/projects` bundle.
- Its button list is invisible until it holds keyboard focus (spec §11).
- Any WebGL failure (creation or context loss) calls `onFail`, and the grid returns.

**Files:**
- Create: `lib/drum.ts`, `components/projects/SiteDrum.tsx`
- Modify: `components/projects/SitesView.tsx`
- Test: `tests/drum.test.ts`, `tests/sites.test.tsx` (add), `e2e/projects.spec.ts` (add)

**Interfaces:**
- Consumes: `useWebGLAllowed()` (Task 5), `Site` (Task 4), and `projects.sitesView.{hint, listLabel, open, siteKicker}` (Task 5).
- Produces:
  - `drumLayout(count): DrumLayout`, `slotOrder(count, slots): number[]`, `wrapY(y, towerH): number` and `cardLook(worldY, rowGap): { opacity, taper }` from `lib/drum.ts`.
  - `SiteDrum({ sites, onOpen, onFail })` as the default export.

- [ ] **Step 1: Write the failing tests**

Create `tests/drum.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { cardLook, drumLayout, slotOrder, wrapY } from '@/lib/drum'

describe('drum geometry', () => {
  it("keeps kape's wide, short drum: 16 columns, at least 6 rows, 3:4 cards", () => {
    const L = drumLayout(8)
    expect(L.cols).toBe(16)
    expect(L.rows).toBe(6)
    expect(L.cardH / (L.thetaLen * L.radius)).toBeCloseTo(4 / 3)
    expect(L.towerH).toBeCloseTo(L.rows * L.rowGap)
  })

  it('shows every site once before repeating, then spreads the repeats evenly', () => {
    const order = slotOrder(8, 96)
    expect(order.slice(0, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    const counts = order.reduce<number[]>((c, i) => ((c[i] = (c[i] ?? 0) + 1), c), [])
    expect(counts).toEqual(Array(8).fill(12))
  })

  it('never repeats a site in the slot beside it', () => {
    const order = slotOrder(8, 96)
    expect(order.every((v, k) => k === 0 || v !== order[k - 1])).toBe(true)
  })

  it('wraps a card that drifts off one end back in at the other', () => {
    expect(wrapY(51, 100)).toBeCloseTo(-49)
    expect(wrapY(-51, 100)).toBeCloseTo(49)
    expect(wrapY(10, 100)).toBeCloseTo(10)
  })

  it('fades cards out beyond the band and widens the top ring', () => {
    const gap = 2
    expect(cardLook(0, gap).opacity).toBe(1)
    expect(cardLook(10, gap).opacity).toBe(0)
    expect(cardLook(1.4, gap).taper).toBeGreaterThan(cardLook(-1.4, gap).taper)
  })

  it('has nothing to lay out without sites', () => {
    expect(slotOrder(0, 96)).toEqual([])
  })
})
```

In `tests/sites.test.tsx`, add the mock below the imports (Vitest hoists it). Then add a second `describe`:

```tsx
vi.mock('@/components/projects/SiteDrum', () => ({
  default: ({ sites: list, onOpen, onFail }: { sites: typeof sites; onOpen: (s: (typeof sites)[number]) => void; onFail: () => void }) => (
    <div data-testid="drum">
      <button type="button" onClick={() => onOpen(list[0])}>
        drum pick
      </button>
      <button type="button" onClick={onFail}>
        drum fail
      </button>
    </div>
  ),
}))
```

```tsx
describe('Funnels and sites: the drum', () => {
  beforeEach(() => answer(200))
  afterEach(() => vi.unstubAllGlobals())

  it('spins up the drum where WebGL is allowed, and a pick opens the preview', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum pick'))
    expect(screen.getByRole('dialog', { name: 'Apex Build Co. preview' })).toHaveAttribute('open')
    expect(within(view).queryByRole('list', { name: 'Sample sites' })).toBeNull()
  })

  it('falls back to the grid when WebGL fails', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum fail'))
    expect(within(view).getByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
    expect(within(view).queryByTestId('drum')).toBeNull()
  })

  it('never loads the drum with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const view = openSites()
    expect(within(view).queryByTestId('drum')).toBeNull()
    expect(within(view).getByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
  })

  it('keeps the grid in the page while the view is closed', () => {
    window.history.replaceState(null, '', '/projects')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Funnels and sites', hidden: true })
    expect(within(view).getByRole('list', { name: 'Sample sites', hidden: true })).toBeInTheDocument()
  })
})
```

In `e2e/projects.spec.ts`, add:

```ts
test('the sites view spins the 3D drum; its keyboard list opens a page, and Escape closes only the preview', async ({ page }) => {
  await page.goto('/projects#sites')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Funnels and sites' })
  await expect(view.locator('canvas')).toBeVisible()
  const list = view.getByRole('list', { name: 'Sample sites' })
  await expect(list.getByRole('button')).toHaveCount(8)
  await expect(list).toHaveCSS('opacity', '0')
  await page.keyboard.press('Tab')
  const first = list.getByRole('button', { name: 'Open Apex Build Co.' })
  await expect(first).toBeFocused()
  await expect(list).toHaveCSS('opacity', '1')
  await page.keyboard.press('Enter')
  const preview = page.getByRole('dialog', { name: 'Apex Build Co. preview' })
  await expect(preview).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(preview).toBeHidden()
  await expect(view).toBeVisible()
  await expect(first).toBeFocused()
})
```

Inside the existing `test.describe('reduced motion')` in the same file, add:

```ts
  test('the sites stay a grid', async ({ page }) => {
    await page.goto('/projects#sites')
    await hydrated(page)
    const view = page.getByRole('dialog', { name: 'Funnels and sites' })
    await expect(view.getByRole('button', { name: 'Open Apex Build Co.' })).toBeVisible()
    await expect(view.locator('canvas')).toHaveCount(0)
  })
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/drum.test.ts tests/sites.test.tsx`
Expected: FAIL.
- `@/lib/drum` doesn't resolve.
- The drum `describe` can't find "drum pick", because the grid is always shown.

- [ ] **Step 3: Implement the geometry**

Create `lib/drum.ts`:

```ts
/**
 * Geometry of kape's drum (reference/kapeportfolio/src/components/FunnelBarrel.tsx),
 * kept pure so it can be tested. It is a wide, short cylinder of 3:4 cards,
 * drawn through a contained fade band. The top ring is wider than the rest
 * (the tornado look).
 */
export const COLS = 16
export const RADIUS = 11
export const MIN_ROWS = 6

export type DrumLayout = {
  cols: number
  rows: number
  radius: number
  anglePer: number
  thetaLen: number
  cardH: number
  rowGap: number
  towerH: number
}

export function drumLayout(count: number): DrumLayout {
  const rows = Math.max(MIN_ROWS, Math.ceil(count / COLS))
  const anglePer = (Math.PI * 2) / COLS
  const thetaLen = anglePer * 0.9
  const cardH = thetaLen * RADIUS * (4 / 3)
  const rowGap = cardH * 1.04
  return { cols: COLS, rows, radius: RADIUS, anglePer, thetaLen, cardH, rowGap, towerH: rows * rowGap }
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/**
 * Which site fills each slot. Every site appears once first. The repeats then
 * step by a stride coprime with the count, so they spread evenly and never
 * line up in a column.
 */
export function slotOrder(count: number, slots: number): number[] {
  if (count <= 0) return []
  let stride = Math.max(1, Math.round(count / 3))
  while (count > 1 && gcd(stride, count) !== 1) stride++
  return Array.from({ length: slots }, (_, k) => (k < count ? k : (k * stride) % count))
}

/** Wraps a card's height into the tower, so the vertical drift loops forever. */
export function wrapY(y: number, towerH: number): number {
  return ((((y + towerH / 2) % towerH) + towerH) % towerH) - towerH / 2
}

/**
 * How a card at `worldY` is drawn. It fades out beyond the visible band. The
 * cone taper runs from 0.6 at the bottom of the band to 1.1 at the top, which
 * widens the top ring.
 */
export function cardLook(worldY: number, rowGap: number): { opacity: number; taper: number } {
  const vis = rowGap * 0.7
  const fade = rowGap * 0.85
  const cone = Math.min(1, Math.max(0, (worldY + vis + fade) / (2 * (vis + fade))))
  return {
    opacity: Math.min(1, Math.max(0, (vis + fade - Math.abs(worldY)) / fade)),
    taper: 0.6 + 0.5 * cone,
  }
}
```

Run: `npx vitest run tests/drum.test.ts`
Expected: PASS.

- [ ] **Step 4: Implement the drum**

Create `components/projects/SiteDrum.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { projects, type Site } from '@/data/projects'
import { cardLook, drumLayout, slotOrder, wrapY } from '@/lib/drum'

type Props = { sites: Site[]; onOpen: (site: Site) => void; onFail: () => void }
type Card = { site: Site; baseY: number; baseAngle: number; hot: number; dim: number }

/**
 * The 3D funnel drum (kape FunnelBarrel.tsx, spec §6). The sample sites'
 * thumbnails cover a slowly spinning, drifting drum:
 * - drag it to spin and scrub;
 * - hover a page to name it;
 * - click one to open its preview.
 * It loads only when the sites view opens and WebGL is allowed
 * (hooks/useWebGLAllowed.ts). If WebGL fails to start, or loses its context,
 * `onFail` hands the view back to the grid. The rendering stops while the
 * view is off screen or the tab is hidden.
 *
 * The canvas is hidden from assistive tech. The site list below it carries
 * the same pages as real buttons (spec §11). It is invisible until one of its
 * buttons holds keyboard focus.
 */
export default function SiteDrum({ sites, onOpen, onFail }: Props) {
  const s = projects.sitesView
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLSpanElement>(null)
  // The latest callbacks, without re-running the scene effect on each render.
  const onOpenRef = useRef(onOpen)
  const onFailRef = useRef(onFail)
  useEffect(() => {
    onOpenRef.current = onOpen
    onFailRef.current = onFail
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const label = labelRef.current
    const name = nameRef.current
    if (!canvas || !wrap || !label || !name || sites.length === 0) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch {
      onFailRef.current()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    camera.position.set(0, 4.2, 31) // back and above: the drum sits low, its rim an ellipse
    camera.lookAt(0, 0.5, 0)

    const L = drumLayout(sites.length)
    const loader = new THREE.TextureLoader()
    const textures = new Map<string, THREE.Texture>()
    const mats: THREE.MeshBasicMaterial[] = []
    const texture = (url: string) => {
      const known = textures.get(url)
      if (known) return known
      const t = loader.load(url, undefined, undefined, () => {
        // A thumbnail that won't load becomes a dim, flat card instead of a broken texture.
        for (const m of mats) {
          if (m.map !== t) continue
          m.map = null
          m.userData.base = 0.22
          m.needsUpdate = true
        }
      })
      t.colorSpace = THREE.SRGBColorSpace
      t.minFilter = THREE.LinearFilter // the thumbnails aren't powers of two: no mipmaps
      t.anisotropy = renderer.capabilities.getMaxAnisotropy()
      textures.set(url, t)
      return t
    }

    // Rounded corners as an alpha mask: a white card on black.
    const mask = document.createElement('canvas')
    mask.width = 300
    mask.height = 400
    const ctx = mask.getContext('2d')
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 300, 400)
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.roundRect(0, 0, 300, 400, 30)
      ctx.fill()
    }
    const roundTex = new THREE.CanvasTexture(mask)
    roundTex.minFilter = THREE.LinearFilter

    // One curved card shape; each card only gets a rotation.
    const geo = new THREE.CylinderGeometry(L.radius, L.radius, L.cardH, 24, 1, true, -L.thetaLen / 2, L.thetaLen)
    const group = new THREE.Group() // spins
    const tilt = new THREE.Group() // frames the drum
    tilt.add(group)
    tilt.rotation.z = -0.04
    tilt.rotation.x = 0.16 // tipped so the top rim reads as an ellipse
    tilt.position.set(0, -1, 0)
    scene.add(tilt)

    const cards: THREE.Mesh[] = []
    slotOrder(sites.length, L.rows * L.cols).forEach((siteIndex, slot) => {
      const r = Math.floor(slot / L.cols)
      const c = slot % L.cols
      const mat = new THREE.MeshBasicMaterial({ side: THREE.FrontSide, transparent: true, alphaMap: roundTex })
      mat.userData.base = 1
      mats.push(mat)
      mat.map = texture(sites[siteIndex].thumb)
      const mesh = new THREE.Mesh(geo, mat)
      const baseAngle = c * L.anglePer + (r % 2 ? L.anglePer * 0.5 : 0) // brick offset
      mesh.rotation.y = baseAngle
      mesh.position.y = r * L.rowGap - L.towerH / 2 + L.rowGap / 2
      mesh.userData = { site: sites[siteIndex], baseY: mesh.position.y, baseAngle, hot: 0, dim: 1 } satisfies Card
      group.add(mesh)
      cards.push(mesh)
    })

    // ---- interaction ----
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2(-2, -2)
    const pick = () => {
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster
        .intersectObjects(cards, false)
        .find((h) => ((h.object as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity > 0.08)
      return (hit?.object as THREE.Mesh | undefined) ?? null
    }

    let hovered: THREE.Mesh | null = null
    let scrollTarget = 0
    let scrollCurrent = 0
    let spinAngle = 0
    let spinTarget = 0
    let dragSpin = 0
    let inside = false
    let dragging = false
    let downX = 0
    let downY = 0
    let lastX = 0
    let lastY = 0
    let moved = 0

    const aim = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      label.style.left = `${e.clientX - rect.left}px`
      label.style.top = `${e.clientY - rect.top}px`
    }
    const setHovered = (m: THREE.Mesh | null) => {
      if (m === hovered) return
      hovered = m
      if (m) name.textContent = (m.userData as Card).site.name
      label.classList.toggle('is-on', !!m)
      canvas.style.cursor = m ? 'pointer' : 'grab'
    }
    const onMove = (e: PointerEvent) => {
      aim(e)
      spinTarget = pointer.x * 0.22
      if (!dragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      dragSpin += dx * 0.006
      scrollTarget += dy * 0.01
      moved += Math.abs(dx) + Math.abs(dy)
      lastX = e.clientX
      lastY = e.clientY
    }
    const onEnter = () => {
      inside = true
    }
    const onLeave = () => {
      inside = false
      pointer.set(-2, -2)
      setHovered(null)
    }
    const onDown = (e: PointerEvent) => {
      dragging = true
      downX = lastX = e.clientX
      downY = lastY = e.clientY
      moved = 0
      aim(e)
      canvas.setPointerCapture?.(e.pointerId)
    }
    const onUp = (e: PointerEvent) => {
      const tap = moved < 6 && Math.abs(e.clientX - downX) < 6 && Math.abs(e.clientY - downY) < 6
      dragging = false
      canvas.releasePointerCapture?.(e.pointerId)
      if (!tap) return
      aim(e)
      const hit = pick()
      if (hit) onOpenRef.current((hit.userData as Card).site)
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      onFailRef.current()
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerenter', onEnter)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('webglcontextlost', onLost)

    const resize = () => {
      const w = Math.max(1, wrap.clientWidth)
      const h = Math.max(1, wrap.clientHeight)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    resize()

    // ---- the loop: sleeps while off screen or hidden, woken by kick() ----
    const clock = new THREE.Clock()
    let raf = 0
    let running = false
    let onScreen = true
    const frame = () => {
      if (document.hidden || !onScreen) {
        running = false
        return
      }
      raf = requestAnimationFrame(frame)
      const dt = Math.min(clock.getDelta(), 0.05)

      spinAngle += (inside ? 0.04 : 0.16) * dt // idle spin, slower under the pointer
      group.rotation.y = spinAngle + dragSpin + spinTarget * 0.4
      if (!inside) scrollTarget += 0.35 * dt // slow vertical drift
      scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(1, dt * 5)
      for (const m of cards) {
        const y = wrapY((m.userData as Card).baseY + scrollCurrent, L.towerH)
        if (m === hovered && Math.abs(y - m.position.y) > L.rowGap * 1.5) setHovered(null) // it wrapped away
        m.position.y = y
      }
      if (inside && !dragging) setHovered(pick())

      for (const m of cards) {
        const card = m.userData as Card
        const hot = m === hovered
        card.hot += ((hot ? 1 : 0) - card.hot) * Math.min(1, dt * 10)
        card.dim += ((!hovered || hot ? 1 : 0.4) - card.dim) * Math.min(1, dt * 8)
        const worldY = tilt.position.y + m.position.y
        const look = cardLook(worldY, L.rowGap)
        const pop = 1 + card.hot * 0.06
        m.rotation.y = card.baseAngle + worldY * 0.05 // a slight helix, from height, so it holds as cards wrap
        m.scale.set(look.taper * pop, pop, look.taper * pop)
        const mat = m.material as THREE.MeshBasicMaterial
        mat.opacity = look.opacity
        m.visible = look.opacity > 0.01
        mat.color.setScalar(mat.userData.base * card.dim)
      }
      renderer.render(scene, camera)
    }
    const kick = () => {
      if (running) return
      running = true
      clock.getDelta() // drop the time spent asleep
      raf = requestAnimationFrame(frame)
    }
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true
        if (onScreen) kick()
      },
      { threshold: 0.01 },
    )
    io.observe(wrap)
    const onVisible = () => {
      if (!document.hidden && onScreen) kick()
    }
    document.addEventListener('visibilitychange', onVisible)
    canvas.style.cursor = 'grab'
    kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerenter', onEnter)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('webglcontextlost', onLost)
      geo.dispose()
      roundTex.dispose()
      mats.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      renderer.dispose()
    }
  }, [sites])

  return (
    <div ref={wrapRef} className="relative min-h-0 flex-1 overflow-hidden">
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full touch-none" />
      <div
        ref={labelRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 flex -translate-x-1/2 translate-y-5 flex-col gap-0.5 rounded-[11px] border border-veil-line bg-veil-deep px-3 py-2 text-veil-ink opacity-0 transition-opacity duration-200 [&.is-on]:opacity-100"
      >
        <span className="font-mono text-[9.5px] tracking-[.14em] opacity-60">{s.siteKicker}</span>
        <span ref={nameRef} className="text-[13px] font-semibold whitespace-nowrap" />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-[18px] left-1/2 -translate-x-1/2 font-mono text-[10.5px] tracking-[.16em] whitespace-nowrap text-veil-ink opacity-55"
      >
        {s.hint}
      </span>
      <ul
        aria-label={s.listLabel}
        className="pointer-events-none absolute inset-x-5 bottom-12 flex flex-wrap justify-center gap-2 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
      >
        {sites.map((site) => (
          <li key={site.file}>
            <button
              type="button"
              onClick={() => onOpen(site)}
              aria-label={`${s.open} ${site.name}`}
              className="cursor-pointer rounded-[10px] border border-veil-line bg-veil-deep px-3 py-2 font-mono text-[10.5px] tracking-[.1em] text-veil-ink"
            >
              {site.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 5: Switch the view to the drum**

In `components/projects/SitesView.tsx`:
- Change the React import to `import { lazy, Suspense, useState } from 'react'`.
- Add `import { useWebGLAllowed } from '@/hooks/useWebGLAllowed'`.
- Add below the imports:

```tsx
// Three.js stays out of the page's bundle until the drum is first shown (spec §5).
const SiteDrum = lazy(() => import('./SiteDrum'))
```

Replace the doc comment's second sentence with: `Wherever WebGL is allowed, the sites cover kape's spinning 3D drum. Everywhere else, and if WebGL fails, they sit in a grid. Each one opens the live preview stacked on top.` Then change the body:

```tsx
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  const allowed = useWebGLAllowed()
  const [failed, setFailed] = useState(false)
  const [site, setSite] = useState<Site | null>(null)
  // Leaving the view (Close, Esc, Back) closes the preview on it too.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) setSite(null)
  }
  // Only while open: the pre-rendered page and a closed view keep the grid.
  const drum = open && allowed && !failed
  return (
    <>
      <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
        <StageBar kicker={s.kicker} onClose={onClose} />
        {drum ? (
          <Suspense fallback={<div className="min-h-0 flex-1" />}>
            <SiteDrum sites={s.sites} onOpen={setSite} onFail={() => setFailed(true)} />
          </Suspense>
        ) : (
          <SiteGrid sites={s.sites} onOpen={setSite} />
        )}
      </ViewDialog>
      <SitePreview site={site} onClose={() => setSite(null)} />
    </>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/drum.test.ts tests/sites.test.tsx tests/projects.test.tsx`
Expected: PASS. The grid tests still pass (touch is set there), and the drum tests pass through the mock.

Run: `npx playwright test e2e/projects.spec.ts --project=desktop`
Expected: PASS, including the drum test and the reduced-motion grid test. `'the sites view lists every sample site'` still passes, because the drum's list has 8 items.

- [ ] **Step 7: Look at it**

Run: `npm run build && npx next start -p 3100`. Open `http://localhost:3100/projects#sites` in a desktop browser, and check:
1. The drum spins and drifts.
2. Hovering names a site.
3. Dragging spins and scrubs.
4. A click opens the preview.
5. It looks right in both themes.

Stop the server.

- [ ] **Step 8: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add lib/drum.ts components/projects/SiteDrum.tsx components/projects/SitesView.tsx tests/drum.test.ts tests/sites.test.tsx e2e/projects.spec.ts
git commit -m "feat: kape's 3D funnel drum for the sample sites, loaded only where WebGL is allowed

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: The Showcase page

`/showcase` is kape's Flagship (`reference/kapeportfolio/src/components/Flagship.tsx`) rebuilt in Kraft's tokens (spec §6, §9). Kraft has no Showcase screen, so the page takes Kraft's page pattern: the crumb eyebrow, the `<h1>`, the lede, then a lit `Frame`. It holds:
- **Flagship.** The copy, the CTA, and a 5-tab product mock in a browser window. The mock is drawn in `em` inside a container-sized stage, so it shrinks like a screenshot.
  - The tabs auto-advance every 6s. The clock is the active progress bar's CSS animation, and its `animationend` opens the next tab.
  - It holds under the pointer, while anything in it has focus, while it is off screen, and with reduced motion.
- **Feedback.** A marquee of quotes with a Pause/Play button. With reduced motion it stands still and scrolls by hand.

The product, its screens' content and the quotes are PLACEHOLDERs. The mock uses Kraft's accent, not kape's blue (spec §6).

**Files:**
- Create: `data/showcase.ts`, `components/showcase/Flagship.tsx`, `components/showcase/Mock.tsx`, `components/showcase/Feedback.tsx`
- Rewrite: `app/(site)/showcase/page.tsx`
- Delete: `components/ui/PagePlaceholder.tsx` (its last user goes)
- Modify: `app/globals.css` (showcase block), `e2e/scroll.spec.ts` (re-home the reveal tests, per the Phase 3 ruling)
- Test: `tests/showcase.test.tsx`, `e2e/showcase.spec.ts`

**Interfaces:**
- Consumes: `useReducedMotion()` (Task 2), `PageHeader`, `Frame`, `isPlaceholder()`.
- Produces:
  - From `data/showcase.ts`: `showcase`, `TABS: ShowcaseTab[]`, `MOCK`, `FEEDBACK: Quote[]`.
  - The components `Flagship`, `Mock({ tab })` and `Feedback`.
  - CSS classes: `.mock-rise`, `.flag-bar[data-on|data-run|data-full]`, `.feedback[data-paused]`, `.feedback-toggle`.

- [ ] **Step 1: Write the failing tests**

Create `tests/showcase.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ShowcasePage from '@/app/(site)/showcase/page'
import Feedback from '@/components/showcase/Feedback'
import Flagship from '@/components/showcase/Flagship'
import { FEEDBACK, showcase, TABS } from '@/data/showcase'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const selected = () => screen.getByRole('tab', { selected: true }).textContent
const clock = () => document.querySelector<HTMLElement>('.flag-bar[data-on]')

describe('Showcase page', () => {
  it('opens with the SHOWCASE / FLAGSHIP crumb, its heading, the flagship and the feedback', () => {
    render(<ShowcasePage />)
    expect(screen.getByText('SHOWCASE / FLAGSHIP')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: showcase.title.join(' ') })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.flagship.name })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.feedback.title })).toBeInTheDocument()
  })
})

describe('Flagship', () => {
  it('has five product screens, the first one showing', () => {
    render(<Flagship />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(TABS.map((t) => t.label))
    expect(selected()).toBe('Home')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(TABS[0].caption)
  })

  it('moves to the next screen when its clock runs out, and wraps', () => {
    render(<Flagship />)
    fireEvent.animationEnd(clock()!)
    expect(selected()).toBe('Board')
    for (let i = 0; i < 4; i++) fireEvent.animationEnd(clock()!)
    expect(selected()).toBe('Home')
  })

  it('switches screens by click and by the arrow, Home and End keys', () => {
    render(<Flagship />)
    fireEvent.click(screen.getByRole('tab', { name: 'Features' }))
    expect(selected()).toBe('Features')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Features' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Search')
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Search' }), { key: 'Home' })
    expect(selected()).toBe('Home')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Home' }), { key: 'End' })
    expect(selected()).toBe('Search')
  })

  it('holds its clock under the pointer', () => {
    render(<Flagship />)
    expect(clock()).toHaveAttribute('data-run')
    fireEvent.mouseEnter(screen.getByRole('tablist').parentElement!)
    expect(clock()).not.toHaveAttribute('data-run')
    fireEvent.mouseLeave(screen.getByRole('tablist').parentElement!)
    expect(clock()).toHaveAttribute('data-run')
  })

  it('never advances with reduced motion, and marks the screen it holds', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Flagship />)
    expect(clock()).toBeNull()
    expect(document.querySelectorAll('.flag-bar[data-full]')).toHaveLength(1)
  })

  it('stops the moment motion is switched off', () => {
    render(<Flagship />)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(clock()).toBeNull()
  })
})

describe('Feedback', () => {
  it('reads each quote once, with its rating', () => {
    render(<Feedback />)
    expect(screen.getAllByRole('figure')).toHaveLength(FEEDBACK.length)
    expect(screen.getAllByRole('img', { name: '5 out of 5 stars' })).toHaveLength(FEEDBACK.filter((q) => q.rating === 5).length)
  })

  it('pauses and plays from its button', () => {
    render(<Feedback />)
    const reel = screen.getByRole('region', { name: showcase.feedback.reelLabel })
    fireEvent.click(screen.getByRole('button', { name: showcase.feedback.pauseLabel }))
    expect(reel).toHaveAttribute('data-paused')
    fireEvent.click(screen.getByRole('button', { name: showcase.feedback.playLabel }))
    expect(reel).not.toHaveAttribute('data-paused')
  })
})
```

Create `e2e/showcase.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the flagship moves to the next screen on its own, and holds under the pointer', async ({ page }) => {
  await page.goto('/showcase')
  await hydrated(page)
  const tabs = page.getByRole('tablist', { name: 'Product screens' })
  await expect(tabs.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
  await expect(tabs.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true', { timeout: 9000 })
  await tabs.hover()
  await page.waitForTimeout(7000)
  await expect(tabs.getByRole('tab', { name: 'Board' })).toHaveAttribute('aria-selected', 'true')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('the flagship holds its first screen and the quotes stand still', async ({ page }) => {
    await page.goto('/showcase')
    await hydrated(page)
    await page.waitForTimeout(7000)
    await expect(page.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: 'Pause the scrolling quotes' })).toBeHidden()
    const track = page.locator('.feedback .animate-marquee')
    expect(await track.evaluate((el) => el.getAnimations().length)).toBe(0)
  })
})
```

In `e2e/scroll.spec.ts`:
- Change the comment above `page.goto('/showcase')` in the reduced-motion test to `// /showcase opens with a revealed frame (the Flagship).`
- Rename the last test to `'a reveal becomes visible once in view'`. Its body is unchanged.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/showcase.test.tsx`
Expected: FAIL, because `@/components/showcase/Feedback` doesn't resolve.

- [ ] **Step 3: Write the data**

Create `data/showcase.ts`:

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsOutSimpleIcon, BookOpenIcon, BriefcaseIcon, ChatCircleDotsIcon, ClosedCaptioningIcon, FileArrowUpIcon, FilePdfIcon, HouseIcon,
  ImageSquareIcon, KanbanIcon, LightningIcon, MagicWandIcon, MagnifyingGlassIcon, MapPinLineIcon, MicrophoneIcon, QrCodeIcon,
  ScissorsIcon, SparkleIcon, SquaresFourIcon, TextAaIcon, ToolboxIcon, UsersThreeIcon,
} from '@phosphor-icons/react/ssr'

/**
 * /showcase: kape's Flagship (reference/kapeportfolio/src/components/Flagship.tsx)
 * in Kraft's tokens (spec §6, §9). The product is a PLACEHOLDER, and so is
 * what its mock shows. Replace the mock with your product's real screens so
 * the preview is honest. The mock is decorative (aria-hidden): the captions
 * carry the meaning.
 */
export type MockScreen = 'home' | 'board' | 'listings' | 'features' | 'search'
export type MockNav = 'home' | 'board' | 'community' | 'listings' | 'features' | 'docs' | 'learn' | 'premium'
export type ShowcaseTab = { id: MockScreen; label: string; path: string; nav: MockNav; icon: Icon; caption: string }
export type Quote = { name: string; context: string; date: string; rating: number; quote: string }
type NavRow = { id: MockNav; label: string; icon: Icon; sub?: boolean; pro?: boolean }
type Task = { title: string; tag: string; mine?: boolean }
type Tile = { name: string; note: string; icon: Icon; pro?: boolean }
type Row = { source: string; tone: 0 | 1 | 2; title: string; meta: string; state: 'Applied' | 'Saved' | 'New' }
type Result = { name: string; place: string; rating: string; reviews: string; score: number; tag: string }

export const showcase = {
  title: ['Your flagship product,', 'and the people using it.'] as const,
  lede: 'PLACEHOLDER - one line on what this product is and why a visitor should look at it.',
  flagship: {
    eyebrow: 'FLAGSHIP BUILD',
    name: 'PLACEHOLDER - product name',
    desc: 'PLACEHOLDER - two to four sentences on your flagship product: who it is for, the main things it does, and one detail on how you built or run it (stack, hosting, how many people use it).',
    cta: { label: 'Open product', href: 'PLACEHOLDER - product URL' },
    /** Shown in the mock's address bar; decorative. */
    host: 'yourproduct.com',
    tabsLabel: 'Product screens',
    /** How long each screen shows before the next (kape's AUTO_ADVANCE_MS). */
    ms: 6000,
  },
  feedback: {
    kicker: 'WHAT PEOPLE SAY ABOUT IT',
    title: 'PLACEHOLDER - a heading for what your users say',
    pause: 'Pause',
    play: 'Play',
    pauseLabel: 'Pause the scrolling quotes',
    playLabel: 'Play the scrolling quotes',
    stars: 'out of 5 stars',
    /** Names the scrolling strip itself (the section is named by its heading). */
    reelLabel: 'What people say, scrolling',
    /** Seconds for one full pass of the quotes. */
    seconds: 60,
  },
}

export const TABS: ShowcaseTab[] = [
  { id: 'home', label: 'Home', path: '/home', nav: 'home', icon: HouseIcon, caption: 'PLACEHOLDER - one or two sentences on the first screen people land on in your product, and what it tells them at a glance.' },
  { id: 'board', label: 'Board', path: '/board', nav: 'board', icon: KanbanIcon, caption: 'PLACEHOLDER - one or two sentences on your product’s main workspace (a board, editor or dashboard) and what people do there every day.' },
  { id: 'listings', label: 'Listings', path: '/listings', nav: 'listings', icon: BriefcaseIcon, caption: 'PLACEHOLDER - one or two sentences on a list or feed your product pulls together, where the data comes from and what it saves the user.' },
  { id: 'features', label: 'Features', path: '/features', nav: 'features', icon: ToolboxIcon, caption: 'PLACEHOLDER - one or two sentences on the set of features or tools inside your product, how many there are and which plan they are on.' },
  { id: 'search', label: 'Search', path: '/search', nav: 'board', icon: MapPinLineIcon, caption: 'PLACEHOLDER - one or two sentences on a search or finder feature: what goes in, what comes out and why the results are useful.' },
]

const task = (title: string, mine = false): Task => ({ title, tag: 'Tag', mine })
const NAV: NavRow[] = [
  { id: 'home', label: 'Home', icon: HouseIcon },
  { id: 'board', label: 'Board', icon: SquaresFourIcon, sub: true },
  { id: 'community', label: 'Community', icon: UsersThreeIcon, sub: true },
  { id: 'listings', label: 'Listings', icon: MagnifyingGlassIcon, sub: true },
  { id: 'features', label: 'Features', icon: ToolboxIcon, sub: true },
  { id: 'docs', label: 'Docs', icon: BookOpenIcon, sub: true },
  { id: 'learn', label: 'Learn', icon: LightningIcon, sub: true },
  { id: 'premium', label: 'Premium', icon: SparkleIcon, pro: true },
]
const TILES: Tile[] = [
  { name: 'Feature one', note: 'Short description', icon: FileArrowUpIcon },
  { name: 'Feature two', note: 'Short description', icon: ImageSquareIcon },
  { name: 'Feature three', note: 'Short description', icon: FilePdfIcon },
  { name: 'Feature four', note: 'Short description', icon: TextAaIcon },
  { name: 'Feature five', note: 'Short description', icon: QrCodeIcon },
  { name: 'Feature six', note: 'Short description', icon: ScissorsIcon },
  { name: 'Feature seven', note: 'Short description', icon: ArrowsOutSimpleIcon },
  { name: 'Feature eight', note: 'Short description', icon: MicrophoneIcon },
  { name: 'Feature nine', note: 'Short description', icon: ClosedCaptioningIcon, pro: true },
  { name: 'Feature ten', note: 'Short description', icon: MagicWandIcon },
]
const ROWS: Row[] = [
  { source: 'Src A', tone: 0, title: 'PLACEHOLDER listing one', meta: 'Detail · posted 2h ago', state: 'Applied' },
  { source: 'Src B', tone: 1, title: 'PLACEHOLDER listing two', meta: 'Detail · posted 5h ago', state: 'Saved' },
  { source: 'Src C', tone: 2, title: 'PLACEHOLDER listing three', meta: 'Detail · posted 6h ago', state: 'New' },
  { source: 'Src A', tone: 0, title: 'PLACEHOLDER listing four', meta: 'Detail · posted 9h ago', state: 'Saved' },
  { source: 'Src B', tone: 1, title: 'PLACEHOLDER listing five', meta: 'Detail · posted 1d ago', state: 'New' },
]
const RESULTS: Result[] = [
  { name: 'PLACEHOLDER result one', place: 'Location', rating: '4.8', reviews: '212', score: 91, tag: 'Tag' },
  { name: 'PLACEHOLDER result two', place: 'Location', rating: '4.6', reviews: '148', score: 84, tag: 'Tag' },
  { name: 'PLACEHOLDER result three', place: 'Location', rating: '4.4', reviews: '96', score: 72, tag: 'Tag' },
  { name: 'PLACEHOLDER result four', place: 'Location', rating: '4.9', reviews: '61', score: 65, tag: 'Tag' },
  { name: 'PLACEHOLDER result five', place: 'Location', rating: '4.2', reviews: '44', score: 58, tag: 'Tag' },
]

/** What the product mock shows, screen by screen (kape's mock data, renamed to neutral stand-ins). */
export const MOCK = {
  product: ['Product', 'Name'] as const,
  nav: NAV,
  footLink: { label: 'Feedback', icon: ChatCircleDotsIcon },
  chrome: { search: 'Search…', kbd: 'Ctrl K', status: 'All systems normal' },
  home: {
    head: { kicker: 'Monday, January 5', title: 'Good morning, User.', sub: 'PLACEHOLDER status line.' },
    today: 'Today',
    viewAll: 'View all',
    status: 'PLACEHOLDER - the main status message your dashboard shows.',
    goTo: 'Go to',
    links: ['Board', 'Features', 'Search', 'Settings'],
    news: 'What’s new',
    newUpdate: 'New update',
    updates: [
      { date: 'Jan 5', year: '2026', ago: '2 days ago', kind: 'New', title: 'PLACEHOLDER - newest update title', text: 'PLACEHOLDER - a real changelog entry: what shipped and why it matters to the people using it.' },
      { date: 'Jan 3', year: '2026', ago: '4 days ago', kind: 'Improved', title: 'PLACEHOLDER - earlier update title', text: 'PLACEHOLDER - an improvement to an existing feature and what changed for the user.' },
      { date: 'Jan 1', year: '2026', ago: '6 days ago', kind: 'New', title: 'PLACEHOLDER - older update title', text: 'PLACEHOLDER - another shipped feature, in one or two plain sentences.' },
    ] as { date: string; year: string; ago: string; kind: 'New' | 'Improved'; title: string; text: string }[],
  },
  board: {
    head: { kicker: 'Monday, January 5', title: 'PLACEHOLDER board heading.', sub: 'PLACEHOLDER - one line on what this board holds.' },
    add: 'Add task',
    columns: [
      { name: 'To do', tasks: [task('PLACEHOLDER task one', true), task('PLACEHOLDER task two'), task('PLACEHOLDER task three', true)] },
      { name: 'In progress', tasks: [task('PLACEHOLDER task four'), task('PLACEHOLDER task five', true), task('PLACEHOLDER task six')] },
      { name: 'Review', tasks: [task('PLACEHOLDER task seven'), task('PLACEHOLDER task eight'), task('PLACEHOLDER task nine', true)] },
      { name: 'Done', tasks: [task('PLACEHOLDER task ten', true), task('PLACEHOLDER task eleven'), task('PLACEHOLDER task twelve')] },
    ],
  },
  listings: {
    head: { kicker: 'Listings', title: 'PLACEHOLDER listings heading.', sub: 'PLACEHOLDER - one line on where these listings come from.' },
    filters: ['All sources', 'Source A', 'Source B', 'Source C'],
    rows: ROWS,
    foot: 'Showing 5 of 100 · Synced 3 minutes ago',
  },
  features: {
    head: { kicker: 'Features', title: 'PLACEHOLDER features heading.', sub: 'PLACEHOLDER - one line on what the features have in common.' },
    filters: ['All 10', 'Group A', 'Group B', 'Group C', 'Group D'],
    tiles: TILES,
    pro: 'Pro',
  },
  search: {
    fields: [
      { label: 'Category', value: 'PLACEHOLDER' },
      { label: 'Location', value: 'PLACEHOLDER' },
    ],
    go: 'Search',
    meta: '30 results found · 19 with a detail · 7 with another detail',
    results: RESULTS,
    foot: 'PLACEHOLDER - one line explaining how the score is worked out.',
  },
}

/** Use real quotes only, kept word for word, with the person's permission. */
const quote = (date: string, rating: number, q: string): Quote => ({ name: 'Client Name', context: 'PLACEHOLDER', date, rating, quote: q })
export const FEEDBACK: Quote[] = [
  quote('Jan 5, 2026', 5, 'PLACEHOLDER - a real quote from someone who used your product, word for word, two to four sentences on what it did for them.'),
  quote('Jan 4, 2026', 5, 'PLACEHOLDER - a real quote about a specific feature or result, with a number if they gave one.'),
  quote('Jan 3, 2026', 5, 'PLACEHOLDER - a short real quote, one sentence is fine.'),
  quote('Jan 2, 2026', 5, 'PLACEHOLDER - a real quote about working with you or the support you gave, not just the product.'),
  quote('Jan 1, 2026', 4, 'PLACEHOLDER - a one-line quote.'),
  quote('Dec 31, 2025', 5, 'PLACEHOLDER - a real quote from a community member or early user, two sentences.'),
]
```

- [ ] **Step 4: Write the mock**

Create `components/showcase/Mock.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'
import { CaretRightIcon, CheckCircleIcon, CrownIcon, MagnifyingGlassIcon, MapPinLineIcon, PlusIcon, SparkleIcon, StarIcon } from '@phosphor-icons/react/ssr'
import { MOCK, type ShowcaseTab } from '@/data/showcase'

/** Stagger order for the rise-in (globals.css .mock-rise). */
const rise = (i: number) => ({ '--i': i }) as CSSProperties
const PANEL = 'rounded-[.7em] border border-b1 bg-s1'
const LABEL = 'text-[.62em] font-extrabold tracking-[.14em] text-ink3 uppercase'
const PILL = 'rounded-full border px-[.7em] py-[.35em] text-[.7em] font-bold whitespace-nowrap'
const FILTER = `${PILL} border-b1 bg-s1 text-ink3`
const FILTER_ON = `${PILL} border-accent bg-accent text-on-accent`
const TONES = ['bg-wash text-accent', 'bg-chip text-ink2', 'bg-s3 text-ink'] as const
const STATE = { Applied: 'bg-wash text-accent', Saved: 'bg-chip text-ink3', New: 'bg-accent text-on-accent' } as const

/**
 * The Flagship's product mock (kape Flagship.tsx), in Kraft's tokens. Every
 * size is in em, so the whole app scales from the one font size its stage
 * sets. It is decorative: its parent is aria-hidden.
 */
export default function Mock({ tab }: { tab: ShowcaseTab }) {
  return (
    <div className="grid h-full grid-cols-[12.6em_minmax(0,1fr)] overflow-hidden bg-bg text-ink">
      <Sidebar tab={tab} />
      <div className="flex min-w-0 flex-col overflow-hidden">
        <div className="mock-rise flex min-w-0 items-center gap-[.6em] border-b border-b1 bg-s1 px-[1em] py-[.7em]" style={rise(1)}>
          <span className="text-[.92em] font-extrabold tracking-[-.01em] whitespace-nowrap">{tab.label}</span>
          <div className="ml-auto flex min-w-0 items-center gap-[.4em]">
            <span className="flex w-[9.6em] min-w-0 items-center gap-[.45em] overflow-hidden rounded-[.55em] border border-b1 py-[.4em] pr-[.5em] pl-[.65em] text-[.74em] font-medium whitespace-nowrap text-ink4">
              <MagnifyingGlassIcon weight="bold" size="1em" />
              <span>{MOCK.chrome.search}</span>
              <span className="ml-auto rounded-[.3em] bg-chip px-[.4em] py-[.12em] text-[.82em] font-bold text-ink3">{MOCK.chrome.kbd}</span>
            </span>
            <span className="flex items-center gap-[.35em] rounded-full border border-b1 px-[.6em] py-[.3em] text-[.7em] font-bold whitespace-nowrap">
              <span className="size-[.4em] rounded-full bg-accent" />
              {MOCK.chrome.status}
            </span>
            <span className="size-[1.6em] shrink-0 rounded-full bg-linear-to-b from-accent to-s3" />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[.85em] overflow-hidden bg-bg px-[1.5em] py-[1.1em] *:shrink-0">
          {tab.id === 'home' && <HomeScreen />}
          {tab.id === 'board' && <BoardScreen />}
          {tab.id === 'listings' && <ListingsScreen />}
          {tab.id === 'features' && <FeaturesScreen />}
          {tab.id === 'search' && <SearchScreen />}
        </div>
      </div>
    </div>
  )
}

function Sidebar({ tab }: { tab: ShowcaseTab }) {
  const Foot = MOCK.footLink.icon
  return (
    <aside className="mock-rise flex min-w-0 flex-col gap-[.85em] border-r border-b1 bg-s1 px-[.7em] pt-[.95em] pb-[.8em]" style={rise(0)}>
      <div className="flex items-center gap-[.5em] px-[.25em]">
        <span className="grid size-[1.75em] shrink-0 place-items-center rounded-[.55em] bg-accent text-on-accent">
          <SparkleIcon weight="fill" size="1.05em" />
        </span>
        <span className="text-[1.02em] font-extrabold tracking-[-.02em] whitespace-nowrap">
          {MOCK.product[0]}
          <span className="text-accent">{MOCK.product[1]}</span>
        </span>
      </div>
      <div className="flex flex-col gap-[.12em]">
        {MOCK.nav.map((n) => {
          const on = n.id === tab.nav
          return (
            <span
              key={n.id}
              className={`flex min-w-0 items-center gap-[.6em] rounded-[.55em] px-[.6em] py-[.52em] text-[.8em] whitespace-nowrap ${on ? 'bg-wash font-bold text-accent' : 'font-semibold text-ink'}`}
            >
              <n.icon weight={on ? 'fill' : 'regular'} size="1em" className={`shrink-0 ${on ? 'text-accent' : 'text-ink3'}`} />
              <span className="truncate">{n.label}</span>
              {n.pro ? (
                <CrownIcon weight="fill" size=".85em" className="ml-auto text-accent" />
              ) : n.sub ? (
                <CaretRightIcon weight="bold" size=".7em" className="ml-auto text-ink4" />
              ) : null}
            </span>
          )
        })}
      </div>
      <span className="mt-auto flex items-center gap-[.6em] border-t border-b1 px-[.6em] pt-[.8em] text-[.76em] font-semibold whitespace-nowrap">
        <Foot size="1em" className="text-ink3" />
        {MOCK.footLink.label}
      </span>
    </aside>
  )
}

function PageHead({ kicker, title, sub }: { kicker: string; title: string; sub: string }) {
  return (
    <div className="mock-rise flex flex-col gap-[.15em]" style={rise(2)}>
      <span className="text-[.7em] font-bold text-ink3">{kicker}</span>
      <span className="text-[1.55em] leading-[1.1] font-extrabold tracking-[-.03em]">{title}</span>
      <span className="text-[.78em] font-medium text-ink3">{sub}</span>
    </div>
  )
}

function Filters({ items, at }: { items: string[]; at: number }) {
  return (
    <div className="mock-rise flex flex-wrap gap-[.4em]" style={rise(at)}>
      {items.map((f, i) => (
        <span key={f} className={i === 0 ? FILTER_ON : FILTER}>
          {f}
        </span>
      ))}
    </div>
  )
}

function Foot({ children, at }: { children: ReactNode; at: number }) {
  return (
    <span className="mock-rise text-[.68em] leading-[1.5] font-medium text-ink4" style={rise(at)}>
      {children}
    </span>
  )
}

function HomeScreen() {
  const h = MOCK.home
  return (
    <>
      <PageHead {...h.head} />
      <div className={`mock-rise overflow-hidden ${PANEL}`} style={rise(3)}>
        <div className="flex items-center px-[.95em] pt-[.75em] pb-[.45em]">
          <span className={LABEL}>{h.today}</span>
          <span className="ml-auto text-[.76em] font-bold">{h.viewAll}</span>
        </div>
        <div className="flex items-center gap-[.5em] px-[.95em] pt-[.35em] pb-[.85em] text-[.8em] font-medium text-ink3">
          <CheckCircleIcon weight="fill" size="1.15em" className="shrink-0 text-accent" />
          <span>{h.status}</span>
        </div>
        <div className="flex items-center gap-[.9em] border-t border-b1 px-[.95em] py-[.6em]">
          <span className={LABEL}>{h.goTo}</span>
          {h.links.map((l) => (
            <span key={l} className="text-[.76em] font-bold whitespace-nowrap">
              {l}
            </span>
          ))}
        </div>
      </div>
      <div className="mock-rise mt-[.35em] flex items-center gap-[.6em]" style={rise(4)}>
        <span className="text-[1.15em] font-extrabold tracking-[-.02em]">{h.news}</span>
        <span className="ml-auto flex items-center gap-[.3em] rounded-[.5em] border border-b1 bg-s1 px-[.7em] py-[.4em] text-[.74em] font-bold whitespace-nowrap">
          <PlusIcon weight="bold" size=".9em" />
          {h.newUpdate}
        </span>
      </div>
      {h.updates.map((u, i) => (
        <div key={u.title} className="mock-rise grid grid-cols-[5.2em_minmax(0,1fr)] gap-[1em] border-t border-b1 pt-[.75em]" style={rise(i + 5)}>
          <div className="flex flex-col leading-[1.25]">
            <span className="text-[.85em] font-extrabold">{u.date}</span>
            <span className="text-[.7em] font-semibold text-ink3">{u.year}</span>
            <span className="mt-[.15em] text-[.7em] font-bold text-accent">{u.ago}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-[.15em]">
            <span className={`text-[.6em] font-extrabold tracking-[.12em] uppercase ${u.kind === 'New' ? 'text-accent' : 'text-ink2'}`}>{u.kind}</span>
            <span className="text-[.92em] font-extrabold tracking-[-.015em]">{u.title}</span>
            <span className="text-[.76em] leading-[1.55] font-medium text-ink3">{u.text}</span>
          </div>
        </div>
      ))}
    </>
  )
}

function BoardScreen() {
  const b = MOCK.board
  return (
    <>
      <PageHead {...b.head} />
      <div className="grid grid-cols-4 gap-[.7em]">
        {b.columns.map((col, i) => (
          <div key={col.name} className={`mock-rise flex min-w-0 flex-col gap-[.5em] px-[.6em] py-[.7em] ${PANEL}`} style={rise(i + 3)}>
            <div className="flex items-center gap-[.4em]">
              <span className="truncate text-[.66em] font-extrabold tracking-[.1em] text-ink3 uppercase">{col.name}</span>
              <span className="ml-auto grid min-w-[1.35em] place-items-center rounded-[.35em] bg-chip px-[.35em] py-[.1em] text-[.62em] font-extrabold text-ink3">
                {col.tasks.length}
              </span>
            </div>
            {col.tasks.map((t) => (
              <div key={t.title} className="flex flex-col gap-[.45em] rounded-[.5em] border border-b1 bg-s2 px-[.6em] py-[.55em]">
                <span className="text-[.74em] leading-[1.35] font-bold">{t.title}</span>
                <span className="flex items-center gap-[.4em]">
                  <span className="rounded-[.3em] bg-chip px-[.45em] py-[.15em] text-[.58em] font-extrabold tracking-[.08em] text-ink3 uppercase">{t.tag}</span>
                  <span className={`ml-auto size-[.7em] rounded-full ${t.mine ? 'bg-accent' : 'bg-s3'}`} />
                </span>
              </div>
            ))}
            <span className="flex items-center gap-[.3em] text-[.68em] font-bold text-ink4">
              <PlusIcon weight="bold" size=".9em" />
              {b.add}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function ListingsScreen() {
  const l = MOCK.listings
  return (
    <>
      <PageHead {...l.head} />
      <Filters items={l.filters} at={3} />
      <div className="flex flex-col gap-[.45em]">
        {l.rows.map((r, i) => (
          <div
            key={r.title}
            className={`mock-rise grid grid-cols-[5.2em_minmax(0,1fr)_5em_1em] items-center gap-[.7em] px-[.75em] py-[.6em] ${PANEL}`}
            style={rise(i + 4)}
          >
            <span className={`grid place-items-center rounded-[.35em] px-[.4em] py-[.22em] text-[.6em] font-extrabold tracking-[.06em] uppercase ${TONES[r.tone]}`}>{r.source}</span>
            <span className="flex min-w-0 flex-col gap-[.1em]">
              <span className="truncate text-[.78em] font-extrabold">{r.title}</span>
              <span className="truncate text-[.66em] font-medium text-ink3">{r.meta}</span>
            </span>
            <span className={`grid place-items-center rounded-full px-[.4em] py-[.22em] text-[.6em] font-extrabold tracking-[.06em] uppercase ${STATE[r.state]}`}>{r.state}</span>
            <CaretRightIcon weight="bold" size=".85em" className="text-ink4" />
          </div>
        ))}
      </div>
      <Foot at={9}>{l.foot}</Foot>
    </>
  )
}

function FeaturesScreen() {
  const f = MOCK.features
  return (
    <>
      <PageHead {...f.head} />
      <Filters items={f.filters} at={3} />
      <div className="grid grid-cols-5 gap-[.6em]">
        {f.tiles.map((t, i) => (
          <div key={t.name} className={`mock-rise relative flex min-w-0 flex-col gap-[.25em] px-[.65em] pt-[.7em] pb-[.8em] ${PANEL}`} style={rise(i + 4)}>
            <span className="mb-[.3em] grid size-[1.75em] place-items-center rounded-[.5em] bg-wash text-accent">
              <t.icon weight="fill" size="1em" />
            </span>
            <span className="text-[.74em] leading-[1.3] font-extrabold">{t.name}</span>
            <span className="text-[.66em] leading-[1.35] font-medium text-ink3">{t.note}</span>
            {t.pro && (
              <span className="absolute top-[.5em] right-[.5em] rounded-full bg-accent px-[.4em] py-[.12em] text-[.55em] font-extrabold tracking-[.1em] text-on-accent uppercase">
                {f.pro}
              </span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

function SearchScreen() {
  const s = MOCK.search
  return (
    <>
      <div className="mock-rise grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-stretch gap-[.6em]" style={rise(2)}>
        {s.fields.map((f) => (
          <span key={f.label} className={`flex min-w-0 flex-col gap-[.1em] rounded-[.55em] px-[.7em] py-[.5em] ${PANEL}`}>
            <span className="text-[.58em] font-extrabold tracking-[.12em] text-ink4 uppercase">{f.label}</span>
            <span className="truncate text-[.8em] font-bold">{f.value}</span>
          </span>
        ))}
        <span className="flex items-center gap-[.35em] rounded-[.55em] bg-accent px-[1em] text-[.78em] font-extrabold whitespace-nowrap text-on-accent">
          <MapPinLineIcon weight="fill" size=".95em" />
          {s.go}
        </span>
      </div>
      <span className="mock-rise text-[.7em] font-semibold text-ink3" style={rise(3)}>
        {s.meta}
      </span>
      <div className="flex flex-col gap-[.45em]">
        {s.results.map((r, i) => (
          <div
            key={r.name}
            className={`mock-rise grid grid-cols-[minmax(0,1fr)_5.2em_7.5em_6em] items-center gap-[.7em] px-[.75em] py-[.55em] ${PANEL}`}
            style={rise(i + 4)}
          >
            <span className="flex min-w-0 flex-col gap-[.1em]">
              <span className="truncate text-[.78em] font-extrabold">{r.name}</span>
              <span className="truncate text-[.66em] font-medium text-ink3">{r.place}</span>
            </span>
            <span className="flex items-center gap-[.25em] text-[.74em] font-extrabold whitespace-nowrap">
              <StarIcon weight="fill" size=".85em" className="text-accent" />
              {r.rating}
              <span className="font-medium text-ink3">({r.reviews})</span>
            </span>
            <span className="flex items-center gap-[.5em]">
              <span className="h-[.32em] flex-1 overflow-hidden rounded-full bg-chip">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${r.score}%` }} />
              </span>
              <span className="min-w-[1.4em] text-right text-[.72em] font-extrabold">{r.score}</span>
            </span>
            <span className="grid place-items-center rounded-full bg-chip px-[.45em] py-[.22em] text-[.58em] font-extrabold tracking-[.06em] text-ink3 uppercase">{r.tag}</span>
          </div>
        ))}
      </div>
      <Foot at={9}>{s.foot}</Foot>
    </>
  )
}
```

- [ ] **Step 5: Write the Flagship and the Feedback**

Create `components/showcase/Flagship.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { showcase, TABS } from '@/data/showcase'
import { isPlaceholder } from '@/lib/placeholder'
import Mock from './Mock'

/**
 * The Flagship build (kape Flagship.tsx, spec §9). The copy and CTA sit
 * beside a browser window holding the product mock, with five tabs below.
 *
 * The auto-advance clock is the active progress bar's CSS animation
 * (globals.css .flag-bar). When it ends, the next tab opens. Holding it is
 * just pausing that animation: under the pointer, while anything here has
 * focus, while the block is off screen. With reduced motion there is no
 * clock at all. Switching tabs remounts the bars, so the clock restarts.
 */
export default function Flagship() {
  const f = showcase.flagship
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [inView, setInView] = useState(true)
  const still = useReducedMotion()
  const column = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = column.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = !still && !hover && !focus && inView
  const tab = TABS[active]
  const cta = isPlaceholder(f.cta.href) ? '#' : f.cta.href

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TABS.length
    const next =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="grid gap-x-[clamp(24px,4cqw,64px)] gap-y-7 shell:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] shell:items-center">
      <div className="flex flex-col items-start gap-4">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">{f.eyebrow}</span>
        <h2 className="text-[clamp(26px,3.4cqw,44px)] leading-[1.05] font-bold tracking-[-.03em]">{f.name}</h2>
        <p className="max-w-[46ch] text-[14px] leading-[1.6] text-ink2">{f.desc}</p>
        <a
          href={cta}
          {...(cta === '#' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
          className="mt-1 flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]"
        >
          {f.cta.label} <ArrowSquareOutIcon size={16} aria-hidden />
        </a>
      </div>

      <div
        ref={column}
        className="flex min-w-0 flex-col gap-4"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
        }}
      >
        <div aria-hidden className="overflow-hidden rounded-[14px] border border-b2 bg-s0 shadow-(--shot-shadow)">
          <div className="flex items-center gap-2 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="ml-3 truncate rounded-full border border-b1 bg-s1 px-3.5 py-[5px] font-mono text-[11.5px]">
              <span className="text-ink2">{f.host}</span>
              <span className="text-accent">{tab.path}</span>
            </span>
          </div>
          <div className="@container relative aspect-[16/10] overflow-hidden bg-bg">
            {/* Re-keyed per tab: the stage remounts and its pieces rise in again. */}
            <div key={tab.id} className="size-full text-[clamp(5.5px,1.92cqw,15px)]">
              <Mock tab={tab} />
            </div>
          </div>
        </div>

        <div role="tablist" aria-label={f.tabsLabel} className="flex max-w-full gap-1.5 self-start overflow-x-auto rounded-[14px] border border-b1 bg-s1 p-[5px]">
          {TABS.map((t, i) => {
            const on = i === active
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`flag-tab-${t.id}`}
                aria-selected={on}
                aria-controls="flag-caption"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${on ? 'bg-accent text-on-accent' : 'text-ink3 hover:bg-hover hover:text-ink'}`}
              >
                <t.icon size={15} aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
        <p
          key={tab.id}
          id="flag-caption"
          role="tabpanel"
          aria-labelledby={`flag-tab-${tab.id}`}
          className="min-h-[4.65em] max-w-[60ch] animate-rise text-[14px] leading-[1.55] text-ink2"
        >
          {tab.caption}
        </p>
        <div key={active} aria-hidden className="flex gap-1.5" style={{ '--flag-ms': `${f.ms}ms` } as CSSProperties}>
          {TABS.map((t, i) =>
            i === active && !still ? (
              <span key={t.id} className="flag-bar" data-on data-run={running || undefined} onAnimationEnd={() => setActive((a) => (a + 1) % TABS.length)} />
            ) : (
              <span key={t.id} className="flag-bar" data-full={(still && i === active) || undefined} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
```

Create `components/showcase/Feedback.tsx`:

```tsx
'use client'

import { useState, type CSSProperties } from 'react'
import { PauseIcon, PlayIcon, QuotesIcon, StarIcon } from '@phosphor-icons/react/ssr'
import { FEEDBACK, showcase } from '@/data/showcase'

/**
 * What people say about the flagship (kape Flagship.tsx feedback marquee).
 * The quotes drift past, drawn twice for a seamless loop; the second copy is
 * hidden from assistive tech. They pause under the pointer, while focused,
 * and with the button (WCAG 2.2.2). With reduced motion they stand still and
 * scroll by hand (globals.css .feedback).
 */
export default function Feedback() {
  const fb = showcase.feedback
  const [paused, setPaused] = useState(false)
  return (
    <section aria-labelledby="feedback-title" className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{fb.kicker}</span>
          <h2 id="feedback-title" className="text-[clamp(20px,2.6cqw,32px)] leading-[1.1] font-bold tracking-[-.025em]">
            {fb.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? fb.playLabel : fb.pauseLabel}
          className="feedback-toggle flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-b1 bg-s2 px-3.5 text-[12.5px] font-medium text-ink2 transition-colors duration-250 hover:border-b2 hover:text-ink"
        >
          {paused ? <PlayIcon size={14} weight="fill" aria-hidden className="text-accent" /> : <PauseIcon size={14} weight="fill" aria-hidden className="text-accent" />}
          {paused ? fb.play : fb.pause}
        </button>
      </header>
      <div
        role="region"
        aria-label={fb.reelLabel}
        tabIndex={0}
        data-paused={paused || undefined}
        className="feedback edge-fade overflow-hidden py-2"
        style={{ '--fade': '6%' } as CSSProperties}
      >
        <ul className="flex w-max animate-marquee gap-5" style={{ '--marq': `${fb.seconds}s` } as CSSProperties}>
          {[0, 1].map((copy) =>
            FEEDBACK.map((q, i) => (
              <li key={`${copy}-${i}`} aria-hidden={copy === 1 || undefined} className="shrink-0">
                <figure className="relative m-0 flex h-full w-[clamp(260px,24vw,340px)] flex-col gap-3.5 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-6 pt-7 pb-6">
                  <QuotesIcon weight="fill" size={26} aria-hidden className="absolute top-4 right-5 text-wash-b" />
                  <div role="img" aria-label={`${q.rating} ${fb.stars}`} className="flex gap-0.5 text-accent">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <StarIcon key={n} size={14} weight={n < q.rating ? 'fill' : 'regular'} aria-hidden />
                    ))}
                  </div>
                  <blockquote className="m-0 text-[14px] leading-[1.6] text-ink2">{q.quote}</blockquote>
                  <figcaption className="mt-auto flex flex-col gap-0.5">
                    <span className="text-[13.5px] font-semibold">{q.name}</span>
                    <span className="font-mono text-[10px] tracking-[.06em] text-ink3">
                      {q.context} · {q.date}
                    </span>
                  </figcaption>
                </figure>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Write the page, the styles, and remove the placeholder**

Replace `app/(site)/showcase/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Feedback from '@/components/showcase/Feedback'
import Flagship from '@/components/showcase/Flagship'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { showcase } from '@/data/showcase'

export const metadata: Metadata = { title: 'Showcase' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/showcase" title={showcase.title} lede={showcase.lede} />
      <div data-reveal>
        <Frame lit={{ x: '30%', alpha: 0.6, stop: '58%' }} className="flex flex-col gap-[clamp(28px,4cqw,56px)] p-[clamp(14px,2cqw,28px)]">
          <Flagship />
          <Feedback />
        </Frame>
      </div>
    </section>
  )
}
```

Delete `components/ui/PagePlaceholder.tsx`:

```bash
git rm components/ui/PagePlaceholder.tsx
```

In `app/globals.css`, append at the end:

```css
/* ---- Showcase (kape Flagship.tsx, Kraft tokens) ----
   The product mock's pieces rise in, in reading order (--i), each time its
   stage remounts. The active progress bar is the auto-advance clock: its
   fill runs for --flag-ms while [data-run] is set, and its end opens the
   next tab (components/showcase/Flagship.tsx). With reduced motion there is
   no clock; the held tab's bar is simply full. */
.mock-rise{animation:kRise .42s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(var(--i,0) * 38ms)}
.flag-bar{position:relative;flex:1 1 0;height:2px;border-radius:2px;background:var(--b1);overflow:hidden}
.flag-bar[data-on]::after,.flag-bar[data-full]::after{content:'';position:absolute;inset:0;background:var(--accent);transform-origin:left center}
.flag-bar[data-on]::after{animation:flagFill var(--flag-ms,6s) linear both;animation-play-state:paused}
.flag-bar[data-on][data-run]::after{animation-play-state:running}
@keyframes flagFill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* The quotes: held under the pointer, on focus and by their button; with
   reduced motion they stand still and scroll by hand. */
.feedback:hover .animate-marquee,.feedback:focus-within .animate-marquee,.feedback:focus .animate-marquee,.feedback[data-paused] .animate-marquee{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.feedback{overflow-x:auto}.feedback .animate-marquee{animation:none}.feedback-toggle{display:none}}
html[data-a11y-motion=true] .feedback{overflow-x:auto}
html[data-a11y-motion=true] .feedback .animate-marquee{animation:none}
html[data-a11y-motion=true] .feedback-toggle{display:none}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/showcase.test.tsx tests/no-raw-colors.test.ts`
Expected: PASS.

Run: `npx playwright test e2e/showcase.spec.ts e2e/scroll.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 8: Look at it**

Build and start (`npm run build && npx next start -p 3100`). Check `/showcase` at 1440×900 and 390×844 in both themes:
1. The mock reads as a small app at both sizes, with no wrapping text in the sidebar.
2. The tabs advance every 6s and hold under the pointer.
3. The quotes drift and pause.

Stop the server.

- [ ] **Step 9: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add data/showcase.ts components/showcase "app/(site)/showcase/page.tsx" app/globals.css tests/showcase.test.tsx e2e/showcase.spec.ts e2e/scroll.spec.ts
git commit -m "feat: the Showcase page: kape's Flagship mock, tabs and quotes in Kraft tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: The accessibility menu

The menu ports kape's `AccessMenu.tsx` (spec §6, §11). It sits beside every theme button: the sidebar's social row, the phone's floating controls and the Home profile header. Task 9 adds it to the plain pages' header.
- **Controls.** Text size (A / A+ / A++), stronger contrast, motion off and underlined links. Each applies at once through the existing `savePrefs`, which writes `html[data-a11y-*]`, stores the choice and dispatches `a11ychange`.
- **State.** The shown state is read from the applied attributes (`currentPrefs()`), not from storage. So every copy of the menu agrees, and blocked storage still shows the truth.
- **Panel.** It is portalled to `<body>` so the sidebar's scroll box can't clip it. It sits under its button, or above it when there's no room.
- **Effects.** New `globals.css` rules for text size (a zoom on what the sidebar and panel contain), contrast (raised `--ink2`–`--ink4` and hairlines in both themes) and underlined links. Motion off already works.

**Files:**
- Modify: `lib/a11y.ts` (add `currentPrefs`)
- Create: `hooks/useA11yPrefs.ts`, `lib/popover.ts`, `data/access.ts`, `components/shell/AccessMenu.tsx`
- Modify: `components/shell/Sidebar.tsx`, `components/shell/PhoneControls.tsx`, `components/home/HomeProfile.tsx`, `app/(site)/layout.tsx` (`data-a11y-scale`), `app/globals.css`
- Test: `tests/a11y.test.ts` (add), `tests/popover.test.ts`, `tests/AccessMenu.test.tsx`, `e2e/access.spec.ts`, `e2e/phone.spec.ts`

**Interfaces:**
- Consumes: `savePrefs`, `DEFAULT_PREFS`, `A11Y_EVENT`, `A11yPrefs`, `TextSize` (`lib/a11y.ts`).
- Produces:
  - `currentPrefs(): A11yPrefs` in `lib/a11y.ts`.
  - `useA11yPrefs(): A11yPrefs`.
  - `placePanel(button: Pick<DOMRect, 'left' | 'top' | 'bottom'>, panel: { width: number; height: number }, view: { width: number; height: number }): { top: number; left: number }`.
  - `AccessMenu({ size?: 38 | 40; className?: string })` as the default export.
  - The `[data-a11y-scale]` attribute: the children of any element carrying it grow with the text size.

- [ ] **Step 1: Write the failing tests**

In `tests/a11y.test.ts`, add `currentPrefs` to the import, then add:

```ts
  it('currentPrefs reads what is applied, even when nothing could be stored', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    savePrefs({ text: 'xl', contrast: true, motion: false, links: true })
    expect(currentPrefs()).toEqual({ text: 'xl', contrast: true, motion: false, links: true })
    spy.mockRestore()
  })
```

Create `tests/popover.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { placePanel } from '@/lib/popover'

const button = (left: number, top: number) => ({ left, top, bottom: top + 38 })
const panel = { width: 300, height: 400 }
const view = { width: 1000, height: 800 }

describe('placePanel', () => {
  it('opens under the button, lined up with its left edge', () => {
    expect(placePanel(button(100, 50), panel, view)).toEqual({ top: 98, left: 100 })
  })
  it('opens above the button when there is no room below', () => {
    expect(placePanel(button(100, 700), panel, view)).toEqual({ top: 290, left: 100 })
  })
  it('never runs off either side of the screen', () => {
    expect(placePanel(button(900, 50), panel, view).left).toBe(684)
    expect(placePanel(button(2, 50), panel, view).left).toBe(16)
  })
  it('stays on screen when there is room neither above nor below', () => {
    expect(placePanel(button(100, 300), panel, { width: 1000, height: 500 }).top).toBe(16)
  })
})
```

Create `tests/AccessMenu.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccessMenu from '@/components/shell/AccessMenu'
import { A11Y_KEY } from '@/lib/storage-keys'

const html = () => document.documentElement
const trigger = () => screen.getByRole('button', { name: 'Accessibility options' })
const panel = () => screen.getByRole('dialog', { name: 'Accessibility' })

async function openMenu() {
  const user = userEvent.setup()
  render(<AccessMenu />)
  await user.click(trigger())
  return user
}

describe('AccessMenu', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens a panel from its button and moves focus into it', async () => {
    await openMenu()
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(panel().contains(document.activeElement)).toBe(true)
  })

  it('larger text applies at once and is remembered', async () => {
    const user = await openMenu()
    await user.click(within(panel()).getByRole('button', { name: 'Larger text' }))
    expect(html()).toHaveAttribute('data-a11y-text', 'lg')
    expect(within(panel()).getByRole('button', { name: 'Larger text' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!)).toMatchObject({ text: 'lg' })
  })

  it('each switch turns its effect on and off', async () => {
    const user = await openMenu()
    const SWITCHES = [
      ['Stronger contrast', 'data-a11y-contrast'],
      ['Motion off', 'data-a11y-motion'],
      ['Underlined links', 'data-a11y-links'],
    ] as const
    for (const [name, attr] of SWITCHES) {
      const sw = within(panel()).getByRole('button', { name: new RegExp(`^${name}`) })
      await user.click(sw)
      expect(html()).toHaveAttribute(attr, 'true')
      expect(sw).toHaveAttribute('aria-pressed', 'true')
      await user.click(sw)
      expect(html()).not.toHaveAttribute(attr)
    }
  })

  it('Reset puts everything back, and is off while nothing has changed', async () => {
    const user = await openMenu()
    const reset = within(panel()).getByRole('button', { name: 'Reset to default' })
    expect(reset).toBeDisabled()
    await user.click(within(panel()).getByRole('button', { name: /^Motion off/ }))
    expect(reset).toBeEnabled()
    await user.click(reset)
    expect(html()).not.toHaveAttribute('data-a11y-motion')
  })

  it('Escape closes it and gives focus back to the button', async () => {
    const user = await openMenu()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeNull()
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('a click anywhere else closes it', async () => {
    const user = await openMenu()
    await user.click(document.body)
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeNull()
  })

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const user = await openMenu()
    const sw = within(panel()).getByRole('button', { name: /^Stronger contrast/ })
    await user.click(sw)
    expect(html()).toHaveAttribute('data-a11y-contrast', 'true')
    expect(sw).toHaveAttribute('aria-pressed', 'true')
  })

  it('every copy of the menu shows the same state', async () => {
    const user = userEvent.setup()
    render(
      <>
        <AccessMenu />
        <AccessMenu size={40} />
      </>,
    )
    const [first, second] = screen.getAllByRole('button', { name: 'Accessibility options' })
    await user.click(first)
    await user.click(within(panel()).getByRole('button', { name: /^Motion off/ }))
    await user.keyboard('{Escape}')
    await user.click(second)
    expect(within(panel()).getByRole('button', { name: /^Motion off/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
```

Create `e2e/access.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

const sidebarMenu = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('button', { name: 'Accessibility options' })

test('motion off from the sidebar menu sticks across pages and skips the intro', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: /^Motion off/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-a11y-motion', 'true')
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-a11y-motion', 'true')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
})

test('stronger contrast brightens the muted text; underlined links underline', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const ink3 = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink3').trim())
  const before = await ink3()
  await sidebarMenu(page).click()
  const panel = page.getByRole('dialog', { name: 'Accessibility' })
  await panel.getByRole('button', { name: /^Stronger contrast/ }).click()
  expect(await ink3()).not.toBe(before)
  await panel.getByRole('button', { name: /^Underlined links/ }).click()
  await expect(page.locator('#main-content a').first()).toHaveCSS('text-decoration-line', 'underline')
})

test('larger text grows the page and the sidebar', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'Largest text' }).click()
  await expect(page.locator('#main-content > div')).toHaveCSS('zoom', '1.25')
  await expect(page.locator('aside[data-a11y-scale] > *').first()).toHaveCSS('zoom', '1.25')
})
```

In `e2e/phone.spec.ts`:
- In `'phone: Home opens with the profile header instead of floating controls'`, add the line `await expect(page.getByRole('button', { name: 'Accessibility options' })).toHaveCount(1)`.
- Add:

```ts
test('phone: the largest text never scrolls sideways', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page.getByRole('button', { name: 'Accessibility options' }).tap()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'Largest text' }).tap()
  for (const r of ['/', '/projects', '/services', '/about', '/contact']) {
    await page.goto(r)
    await settleIntro(page)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/a11y.test.ts tests/popover.test.ts tests/AccessMenu.test.tsx`
Expected: FAIL, because `currentPrefs`, `@/lib/popover` and `@/components/shell/AccessMenu` don't exist.

- [ ] **Step 3: Implement the building blocks**

In `lib/a11y.ts`:
- Change the header comment's last sentence to `The AccessMenu (components/shell/AccessMenu.tsx) is their UI.`
- Add at the end:

```ts
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
```

Create `hooks/useA11yPrefs.ts`:

```ts
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
```

Create `lib/popover.ts`:

```ts
const GAP = 10
const EDGE = 16

/**
 * Where a small panel opens from its button. It sits under the button, lined
 * up with its left edge. It goes above when there isn't room below, and it
 * never runs off screen.
 */
export function placePanel(
  button: Pick<DOMRect, 'left' | 'top' | 'bottom'>,
  panel: { width: number; height: number },
  view: { width: number; height: number },
): { top: number; left: number } {
  const left = Math.max(EDGE, Math.min(button.left, view.width - panel.width - EDGE))
  const below = button.bottom + GAP
  const top = below + panel.height <= view.height - EDGE ? below : Math.max(EDGE, button.top - GAP - panel.height)
  return { top, left }
}
```

Create `data/access.ts`:

```ts
import type { TextSize } from '@/lib/a11y'

/** The accessibility menu (kape AccessMenu.tsx, spec §6): the four switches the spec names. */
export const access = {
  button: 'Accessibility options',
  title: 'Accessibility',
  close: 'Close accessibility options',
  textSize: 'TEXT SIZE',
  sizes: [
    { value: 'md', label: 'A', hint: 'Default text size' },
    { value: 'lg', label: 'A+', hint: 'Larger text' },
    { value: 'xl', label: 'A++', hint: 'Largest text' },
  ] satisfies { value: TextSize; label: string; hint: string }[],
  switches: [
    { key: 'contrast', label: 'Stronger contrast', desc: 'Brighter text, clearer edges' },
    { key: 'motion', label: 'Motion off', desc: 'No intro, drifting or auto-play' },
    { key: 'links', label: 'Underlined links', desc: 'Every link gets a line' },
  ] satisfies { key: 'contrast' | 'motion' | 'links'; label: string; desc: string }[],
  reset: 'Reset to default',
}
```

- [ ] **Step 4: Implement the menu**

Create `components/shell/AccessMenu.tsx`:

```tsx
'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowCounterClockwiseIcon, PersonArmsSpreadIcon, XIcon } from '@phosphor-icons/react/ssr'
import { access } from '@/data/access'
import { useA11yPrefs } from '@/hooks/useA11yPrefs'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { placePanel } from '@/lib/popover'

const SIZE_TEXT = ['text-sm', 'text-base', 'text-lg'] as const

/**
 * The accessibility menu (kape AccessMenu.tsx, spec §6, §11), beside Kraft's
 * theme button. One button opens a small panel: text size, stronger
 * contrast, motion off and underlined links. Each switch applies at once and
 * is remembered, and lib/boot.ts re-applies it before the first paint. The
 * panel is portalled to <body> so no scroll box clips it. Escape, the close
 * button, a click elsewhere or a resize closes it. A dot on the button shows
 * that something is switched on.
 */
export default function AccessMenu({ size = 38, className = '' }: { size?: 38 | 40; className?: string }) {
  const [open, setOpen] = useState(false)
  const prefs = useA11yPrefs()
  const button = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()

  const close = useCallback((refocus: boolean) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }, [])

  // Place the panel before it paints, then hand it focus.
  useLayoutEffect(() => {
    const el = panel.current
    if (!open || !el || !button.current) return
    const { top, left } = placePanel(button.current.getBoundingClientRect(), el.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    el.style.top = `${top}px`
    el.style.left = `${left}px`
    el.querySelector<HTMLElement>('button')?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      close(true)
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (panel.current?.contains(t) || button.current?.contains(t)) return
      close(false)
    }
    const onResize = () => close(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open, close])

  const changed = prefs.text !== 'md' || prefs.contrast || prefs.motion || prefs.links
  const box = size === 40 ? 'size-10 rounded-xl' : 'size-[38px] rounded-[11px]'

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={access.button}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
        className={`relative grid shrink-0 cursor-pointer place-items-center border border-b1 bg-s2 text-ink2 transition-all duration-250 hover:-translate-y-0.5 hover:border-b2 hover:text-accent ${box} ${className}`}
      >
        <PersonArmsSpreadIcon size={size === 40 ? 16 : 17} weight="fill" aria-hidden />
        {changed && <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-accent" />}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-label={access.title}
            className="fixed top-0 left-0 z-50 flex w-[min(300px,calc(100vw-32px))] animate-rise flex-col gap-3 rounded-[18px] border border-b2 bg-linear-to-b from-s2 to-s1 p-3.5 text-left text-ink shadow-(--palette-shadow)"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold tracking-[-.01em]">{access.title}</span>
              <button
                type="button"
                onClick={() => close(true)}
                aria-label={access.close}
                className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-b1 bg-chip text-ink3 hover:text-ink"
              >
                <XIcon size={15} aria-hidden />
              </button>
            </div>
            <div role="group" aria-labelledby={`${id}-size`}>
              <span id={`${id}-size`} className="mb-1.5 block font-mono text-[10px] tracking-[.14em] text-ink3">
                {access.textSize}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {access.sizes.map((s, i) => {
                  const on = prefs.text === s.value
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={on}
                      aria-label={s.hint}
                      onClick={() => savePrefs({ ...prefs, text: s.value })}
                      className={`h-10 cursor-pointer rounded-[10px] border font-bold ${SIZE_TEXT[i]} ${on ? 'border-accent bg-accent text-on-accent' : 'border-b1 bg-s2 text-ink hover:border-b2'}`}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <ul className="flex flex-col gap-1">
              {access.switches.map((s) => {
                const on = prefs[s.key]
                return (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => savePrefs({ ...prefs, [s.key]: !on })}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-[11px] px-2.5 py-[9px] text-left hover:bg-hover"
                    >
                      <span className="flex flex-col gap-px">
                        <span className="text-[13.5px] font-medium">{s.label}</span>
                        <span className="text-xs text-ink3">{s.desc}</span>
                      </span>
                      <span aria-hidden className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-s3'}`}>
                        <span className={`absolute top-[3px] left-[3px] size-4 rounded-full transition-transform ${on ? 'translate-x-4 bg-on-accent' : 'bg-ink3'}`} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              onClick={() => savePrefs(DEFAULT_PREFS)}
              disabled={!changed}
              className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border border-b1 bg-chip text-[12.5px] font-medium text-ink2 hover:border-b2 disabled:cursor-default disabled:opacity-40"
            >
              <ArrowCounterClockwiseIcon size={14} aria-hidden />
              {access.reset}
            </button>
          </div>,
          document.body,
        )}
    </>
  )
}
```

- [ ] **Step 5: Place it, and add the effects**

`components/shell/Sidebar.tsx`:
- Add `import AccessMenu from './AccessMenu'`.
- Add `data-a11y-scale` to the `<aside>`.
- After `<ThemeButton />` in the social row, add `<AccessMenu />`. Kraft's own row holds six buttons (four socials, copy email, theme), so it wraps the same way.

`components/shell/PhoneControls.tsx`:
- Add `import AccessMenu from './AccessMenu'`.
- After `<ThemeButton size={40} />`, add `<AccessMenu size={40} />`.
- Update the doc comment: `Theme, accessibility and ⌘K on phones, …`.

`components/home/HomeProfile.tsx`:
- Add `import AccessMenu from '@/components/shell/AccessMenu'`.
- After `<ThemeButton size={40} className="ml-auto" />`, add `<AccessMenu size={40} />`.

`app/(site)/layout.tsx`: add `data-a11y-scale` to `<main>`.

In `app/globals.css`, after the reduced-motion lines near the top (after `html[data-a11y-motion=true] *{…}`), add:

```css
/* ---- Access menu effects (spec §6, §11; lib/a11y.ts). Larger text zooms
   what the sidebar and the panel CONTAIN ([data-a11y-scale] > *), not the
   fixed-height boxes, so both still scroll when the content outgrows them.
   Stronger contrast lifts the muted inks and the hairlines in each theme. ---- */
:root[data-a11y-text=lg] [data-a11y-scale] > *{zoom:1.12}
:root[data-a11y-text=xl] [data-a11y-scale] > *{zoom:1.25}
:root[data-a11y-contrast=true]{--ink2:#DCE3DE;--ink3:#B4BEB8;--ink4:#939D97;--b1:rgba(215,255,224,.18);--b2:rgba(215,255,224,.34)}
:root[data-a11y-contrast=true][data-theme=light]{--ink2:#1E2824;--ink3:#38433E;--ink4:#56615B;--b1:rgba(11,46,30,.24);--b2:rgba(11,46,30,.42)}
:root[data-a11y-links=true] :is(#main-content,[data-plain-main]) a{text-decoration:underline;text-underline-offset:.18em}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/a11y.test.ts tests/popover.test.ts tests/AccessMenu.test.tsx tests/Sidebar.test.tsx tests/PhoneControls.test.tsx tests/HomeProfile.test.tsx`
Expected: PASS. If a Sidebar, PhoneControls or HomeProfile test counts buttons, raise its count by one and ledger it as a ruling: one more button, by the owner's placement decision.

Run: `npx playwright test e2e/access.spec.ts --project=desktop && npx playwright test e2e/phone.spec.ts --project=phone`
Expected: PASS.

- [ ] **Step 7: Look at it**

Build, start, and open the menu in the sidebar, on a phone-sized `/about` and on the phone Home header, in both themes. Check that:
1. The panel sits under its button and stays on screen.
2. Stronger contrast is visibly stronger.
3. Largest text leaves nothing cut off in the sidebar.

- [ ] **Step 8: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add lib/a11y.ts hooks/useA11yPrefs.ts lib/popover.ts data/access.ts components/shell/AccessMenu.tsx components/shell/Sidebar.tsx components/shell/PhoneControls.tsx components/home/HomeProfile.tsx "app/(site)/layout.tsx" app/globals.css tests/a11y.test.ts tests/popover.test.ts tests/AccessMenu.test.tsx e2e/access.spec.ts e2e/phone.spec.ts
git commit -m "feat: the accessibility menu beside every theme button: text size, contrast, motion, links

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Thank-you, Privacy, Terms and 404

These are standalone pages (spec §9). They live in a `(plain)` route group with a small shell: the Kraft mark linking home, the theme button and access menu, a document-scrolling `<main>`, and a footer with the legal links. The shell has no sidebar and no intro. The root `app/not-found.tsx` reuses the same shell.
- **Privacy and Terms** carry PLACEHOLDER legal text with a visible note flagging it for owner review.
- **Thank-you** is the calm Kraft card the owner chose: no redirect, no confetti. It is `noindex`, since it serves bookings and ads, not search.
- **Legal links** also appear in the site's own shell: the sidebar footer on desktop, and the end of the page on phones.

**Files:**
- Create: `data/legal.ts`, `components/shell/LegalLinks.tsx`, `components/plain/PlainShell.tsx`, `components/plain/LegalDoc.tsx`, `components/plain/Notice.tsx`
- Create: `app/(plain)/layout.tsx`, `app/(plain)/privacy/page.tsx`, `app/(plain)/terms/page.tsx`, `app/(plain)/thank-you/page.tsx`, `app/not-found.tsx`
- Modify: `components/shell/Sidebar.tsx` (footer), `app/(site)/layout.tsx` (phone legal links)
- Test: `tests/plain.test.tsx`, `e2e/plain.spec.ts`

**Interfaces:**
- Consumes: `AccessMenu` (Task 8), `ThemeButton`, `profile`, `isPlaceholder()`.
- Produces:
  - From `data/legal.ts`: `legal` and `legalLinks: { href: string; label: string }[]`, plus `type LegalDocData`.
  - `PlainShell({ children })`.
  - Pages at `/privacy`, `/terms` and `/thank-you`, and the 404.
  - `[data-plain-main]` on the plain `<main>`, which Task 8's link rule already targets.

- [ ] **Step 1: Write the failing tests**

Create `tests/plain.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import NotFound from '@/app/not-found'
import PlainLayout from '@/app/(plain)/layout'
import PrivacyPage from '@/app/(plain)/privacy/page'
import TermsPage from '@/app/(plain)/terms/page'
import ThankYouPage, { metadata as thankYouMeta } from '@/app/(plain)/thank-you/page'
import { legal } from '@/data/legal'

describe('plain pages', () => {
  it('the shell links home, carries the theme and access buttons, and the legal links', () => {
    render(
      <PlainLayout>
        <p>content</p>
      </PlainLayout>,
    )
    expect(screen.getByRole('link', { name: 'KRAFT' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accessibility options' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/privacy', '/terms'])
  })

  it('Privacy and Terms are flagged for owner review, with every section', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(legal.review)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      ...legal.privacy.sections.map((s) => s.heading),
      legal.contactHeading,
    ])
    render(<TermsPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument()
  })

  it('the contact line shows the address without a mailto while it is a PLACEHOLDER', () => {
    render(<PrivacyPage />)
    expect(screen.queryByRole('link', { name: /PLACEHOLDER/ })).toBeNull()
  })

  it('Thank-you is a calm card with two ways on, and is kept out of search', () => {
    render(<ThankYouPage />)
    expect(screen.getByRole('heading', { level: 1, name: legal.thankYou.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '/projects')
    expect(thankYouMeta.robots).toEqual({ index: false, follow: true })
  })

  it('the 404 says so and offers Home and Contact', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/contact')
  })
})
```

Create `e2e/plain.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('Privacy stands alone: no sidebar, the document scrolls, the theme still toggles', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('an unknown address gets the styled 404 with a way home', async ({ page }) => {
  const res = await page.goto('/no-such-page')
  expect(res?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeVisible()
  await page.getByRole('link', { name: /Back to home/ }).click()
  await expect(page).toHaveURL(/\/$/)
})

test('the thank-you page is not indexed', async ({ page }) => {
  await page.goto('/thank-you')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('the site shell links to Privacy and Terms', async ({ page }) => {
  await page.goto('/about')
  const legal = page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Legal' })
  await legal.getByRole('link', { name: 'Terms' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible()
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/plain.test.tsx`
Expected: FAIL, because `@/app/not-found` doesn't resolve.

- [ ] **Step 3: Write the data and the pieces**

Create `data/legal.ts`:

```ts
/**
 * The standalone pages (spec §9). The legal text is a PLACEHOLDER: it has to
 * describe this site and what it collects, so the owner (or a lawyer) writes
 * it before launch. The pages flag that in plain sight.
 */
export type LegalDocData = { kicker: string; title: string; description: string; updated: string; sections: { heading: string; body: string }[] }

export const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
]

const updated = 'Last updated: PLACEHOLDER date'

export const legal = {
  review: 'PLACEHOLDER - legal text for the owner (or a lawyer) to write and review before launch.',
  contactHeading: 'Contact',
  contact: 'Questions about this page:',
  privacy: {
    kicker: 'LEGAL / PRIVACY',
    title: 'Privacy Policy',
    description: 'How this site handles what you send through it.',
    updated,
    sections: [
      { heading: 'Who this covers', body: 'PLACEHOLDER - who runs this site and which sites this policy applies to.' },
      { heading: 'What is collected', body: 'PLACEHOLDER - what the contact form collects, and whether any analytics run.' },
      { heading: 'How it is used', body: 'PLACEHOLDER - what you do with that data, and who else sees it.' },
      { heading: 'How long it is kept', body: 'PLACEHOLDER - retention periods, and how to ask for deletion.' },
    ],
  } satisfies LegalDocData,
  terms: {
    kicker: 'LEGAL / TERMS',
    title: 'Terms of Use',
    description: 'The terms for using this site.',
    updated,
    sections: [
      { heading: 'Using this site', body: 'PLACEHOLDER - what visitors may and may not do with this site and its content.' },
      { heading: 'Work and proposals', body: 'PLACEHOLDER - that project work runs under its own written agreement, not these terms.' },
      { heading: 'Intellectual property', body: 'PLACEHOLDER - who owns the site, the case studies and the sample work shown.' },
      { heading: 'Liability', body: 'PLACEHOLDER - the limits of liability for using this site.' },
    ],
  } satisfies LegalDocData,
  thankYou: {
    kicker: 'MESSAGE RECEIVED',
    title: 'Got it. Talk soon.',
    body: "Thanks for reaching out. I'll reply within one business day with next steps. Check your inbox, and your spam folder just in case.",
    home: 'Back to home',
    work: 'See the work',
  },
  notFound: {
    kicker: '404',
    title: 'Page not found.',
    body: "That address doesn't exist. If you followed a link that should work, let me know and I'll look into it.",
    home: 'Back to home',
    contact: 'Get in touch',
  },
}
```

Create `components/shell/LegalLinks.tsx`:

```tsx
import Link from 'next/link'
import { legalLinks } from '@/data/legal'

/** Privacy and Terms, for the sidebar's foot, the end of a phone page, and the plain pages' footer. */
export default function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={`flex gap-3 font-mono text-[9.5px] tracking-[.06em] ${className}`}>
      {legalLinks.map((l) => (
        <Link key={l.href} href={l.href} className="text-ink3 transition-colors duration-250 hover:text-accent">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
```

Create `components/plain/PlainShell.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import AccessMenu from '@/components/shell/AccessMenu'
import LegalLinks from '@/components/shell/LegalLinks'
import ThemeButton from '@/components/shell/ThemeButton'
import { profile } from '@/data/profile'

/**
 * The shell for the standalone pages (spec §9): the Kraft mark home, the
 * theme and access buttons, a document-scrolling page and the legal links.
 * It has no sidebar and no intro.
 */
export default function PlainShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#plain-main" className="skip-link">
        Skip to main content
      </a>
      <header className="mx-auto flex w-full max-w-[880px] items-center gap-2.5 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Image src="/assets/kraft-mark.svg" alt="" width={26} height={26} className="block rounded-lg border border-b1" />
          <span className="text-sm font-bold tracking-[.16em]">{profile.brand}</span>
        </Link>
        <div className="ml-auto flex gap-2">
          <ThemeButton />
          <AccessMenu />
        </div>
      </header>
      <main id="plain-main" data-plain-main data-a11y-scale tabIndex={-1} className="mx-auto w-full max-w-[880px] flex-1 px-4 pb-16 outline-none">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-[880px] flex-wrap items-center gap-x-4 gap-y-2 border-t border-b1 px-4 py-6">
        <span className="font-mono text-[9.5px] tracking-[.06em] text-ink4">{profile.copyright}</span>
        <LegalLinks className="ml-auto" />
      </footer>
    </div>
  )
}
```

Create `components/plain/LegalDoc.tsx`:

```tsx
import { legal, type LegalDocData } from '@/data/legal'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'

/** A legal page: kicker, title, date, the owner-review flag, then its sections and a contact line. */
export default function LegalDoc({ doc }: { doc: LegalDocData }) {
  const email = profile.email
  return (
    <article className="flex flex-col gap-7 pt-6">
      <header>
        <p className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">{doc.kicker}</p>
        <h1 className="text-[clamp(30px,6vw,48px)] leading-[1.05] font-bold tracking-[-.035em]">{doc.title}</h1>
        <p className="mt-3 font-mono text-[10.5px] tracking-[.08em] text-ink3">{doc.updated}</p>
      </header>
      <p role="note" className="rounded-[14px] border border-wash-b bg-wash px-4 py-3 text-[13px] leading-[1.55] text-ink2">
        {legal.review}
      </p>
      {doc.sections.map((s) => (
        <section key={s.heading} className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold tracking-[-.02em]">{s.heading}</h2>
          <p className="max-w-[68ch] text-[14.5px] leading-[1.65] text-ink2">{s.body}</p>
        </section>
      ))}
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-[-.02em]">{legal.contactHeading}</h2>
        <p className="text-[14.5px] leading-[1.65] text-ink2">
          {legal.contact}{' '}
          {isPlaceholder(email) ? <span className="font-mono text-[13px]">{email}</span> : <a href={`mailto:${email}`}>{email}</a>}
        </p>
      </section>
    </article>
  )
}
```

Create `components/plain/Notice.tsx`:

```tsx
import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'

type Way = { href: string; label: string }
type Props = { kicker: string; title: string; body: string; primary: Way; secondary: Way }

/** A short standalone message (Thank-you, 404): kicker, heading, one line, and two ways on. */
export default function Notice({ kicker, title, body, primary, secondary }: Props) {
  return (
    <section className="flex min-h-[60dvh] flex-col items-start justify-center gap-4 pt-6">
      <p className="font-mono text-[10.5px] tracking-[.18em] text-accent">{kicker}</p>
      <h1 className="text-[clamp(32px,7vw,64px)] leading-[1.02] font-bold tracking-[-.035em]">{title}</h1>
      <p className="max-w-[52ch] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-ink2">{body}</p>
      <div className="mt-2 flex flex-wrap gap-2.5">
        <Link
          href={primary.href}
          className="flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]"
        >
          {primary.label} <ArrowRightIcon size={16} aria-hidden />
        </Link>
        <Link
          href={secondary.href}
          className="flex min-h-12 items-center rounded-[13px] border border-b2 bg-s2 px-[22px] py-[13px] text-sm font-medium text-ink transition-colors duration-250 hover:border-accent"
        >
          {secondary.label}
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Write the routes**

Create `app/(plain)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import PlainShell from '@/components/plain/PlainShell'

/** Standalone pages: no sidebar, no intro, document scroll (spec §4, §9). */
export default function PlainLayout({ children }: { children: ReactNode }) {
  return <PlainShell>{children}</PlainShell>
}
```

Create `app/(plain)/privacy/page.tsx`:

```tsx
import type { Metadata } from 'next'
import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'

export const metadata: Metadata = { title: legal.privacy.title, description: legal.privacy.description }

export default function Page() {
  return <LegalDoc doc={legal.privacy} />
}
```

Create `app/(plain)/terms/page.tsx`:

```tsx
import type { Metadata } from 'next'
import LegalDoc from '@/components/plain/LegalDoc'
import { legal } from '@/data/legal'

export const metadata: Metadata = { title: legal.terms.title, description: legal.terms.description }

export default function Page() {
  return <LegalDoc doc={legal.terms} />
}
```

Create `app/(plain)/thank-you/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Notice from '@/components/plain/Notice'
import { legal } from '@/data/legal'

/** For bookings and ads to land on, so it stays out of search. The contact form does not redirect here (spec §9). */
export const metadata: Metadata = { title: 'Thank you', robots: { index: false, follow: true } }

export default function Page() {
  const t = legal.thankYou
  return <Notice kicker={t.kicker} title={t.title} body={t.body} primary={{ href: '/', label: t.home }} secondary={{ href: '/projects', label: t.work }} />
}
```

Create `app/not-found.tsx`:

```tsx
import Notice from '@/components/plain/Notice'
import PlainShell from '@/components/plain/PlainShell'
import { legal } from '@/data/legal'

/** The styled 404 (spec §9), in the plain shell. Next.js marks it noindex and answers 404. */
export default function NotFound() {
  const n = legal.notFound
  return (
    <PlainShell>
      <Notice kicker={n.kicker} title={n.title} body={n.body} primary={{ href: '/', label: n.home }} secondary={{ href: '/contact', label: n.contact }} />
    </PlainShell>
  )
}
```

In `components/shell/Sidebar.tsx`:
- Add `import LegalLinks from './LegalLinks'`.
- Replace the final `<span className="font-mono text-[9px] tracking-[.06em] text-ink4">{profile.copyright}</span>` with:

```tsx
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-mono text-[9px] tracking-[.06em] text-ink4">{profile.copyright}</span>
        <LegalLinks />
      </div>
```

In `app/(site)/layout.tsx`:
- Add `import LegalLinks from '@/components/shell/LegalLinks'`.
- Inside `<main>`'s child `<div>`, after `<PanelContent>{children}</PanelContent>`, add:

```tsx
            <LegalLinks className="mt-10 justify-center shell:hidden" />
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/plain.test.tsx tests/Sidebar.test.tsx`
Expected: PASS.

Run: `npx playwright test e2e/plain.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add data/legal.ts components/shell/LegalLinks.tsx components/plain "app/(plain)" app/not-found.tsx components/shell/Sidebar.tsx "app/(site)/layout.tsx" tests/plain.test.tsx e2e/plain.spec.ts
git commit -m "feat: Thank-you, Privacy, Terms and a styled 404 on a plain shell

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: SEO, share image and placeholder list

Spec §13 and §10:
- **Per-route metadata.** Each route gets a title, a description taken from its own lede, and a canonical link.
- **Share image.** An Open Graph and Twitter image, drawn from Kraft's dark tokens. Those are read out of `app/globals.css`, so no hex leaves the token file.
- **Crawling.** `sitemap.xml` and `robots.txt`.
- **Favicon.** The Kraft mark.
- **Structured data.** `Person` JSON-LD on Home.
- **Site address.** Canonical links and the sitemap use `NEXT_PUBLIC_SITE_URL` when set, otherwise Vercel's production domain (`VERCEL_PROJECT_PRODUCTION_URL`, set by Vercel at build time).
- **Placeholder list.** `npm run placeholders` prints every remaining PLACEHOLDER with its file and line.

**Files:**
- Create: `lib/site.ts`, `lib/seo.ts`, `lib/tokens.ts`, `lib/jsonld.ts`, `lib/share-image.tsx`
- Create: `app/opengraph-image.tsx`, `app/twitter-image.tsx`, `app/icon.svg`, `app/sitemap.ts`, `app/robots.ts`
- Create: `scripts/placeholders.ts`
- Modify: `app/layout.tsx`, `app/(site)/page.tsx` and each `(site)` page's `metadata`, both legal pages' `metadata`, `data/profile.ts` (`jobTitle`, `address`), `package.json`, `e2e/home.spec.ts` (the favicon exclusion goes)
- Test: `tests/seo.test.ts`, `tests/placeholders.test.ts`, `e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `NAV`, `navForPath` (`data/nav.ts`); `legalLinks` (Task 9); each page's data module.
- Produces:
  - `siteUrl(env?)` and `SITE_URL` from `lib/site.ts`.
  - `SITE_NAME`, `INDEXED_PATHS`, `OG_BASE` and `pageMetadata(href, description, label?)` from `lib/seo.ts`.
  - `readTokens(theme, css?)` from `lib/tokens.ts`.
  - `personJsonLd(url?)` and `jsonLd(data)` from `lib/jsonld.ts`.
  - `findPlaceholders(root?)` from `scripts/placeholders.ts`.

- [ ] **Step 1: Write the failing tests**

Create `tests/seo.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import robots from '@/app/robots'
import sitemap from '@/app/sitemap'
import { jsonLd, personJsonLd } from '@/lib/jsonld'
import { INDEXED_PATHS, pageMetadata, SITE_NAME } from '@/lib/seo'
import { SITE_URL, siteUrl } from '@/lib/site'
import { readTokens } from '@/lib/tokens'

describe('siteUrl', () => {
  it('prefers NEXT_PUBLIC_SITE_URL, without a trailing slash', () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: 'https://kraft.dev/' })).toBe('https://kraft.dev')
  })
  it("falls back to Vercel's production domain", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'my-portfolio.vercel.app' })).toBe('https://my-portfolio.vercel.app')
  })
  it('is localhost in development', () => {
    expect(siteUrl({})).toBe('http://localhost:3000')
  })
})

describe('pageMetadata', () => {
  it("names a page after its nav label, with its own description and canonical link", () => {
    const m = pageMetadata('/projects', 'Everything here shipped.')
    expect(m.title).toBe('Projects')
    expect(m.description).toBe('Everything here shipped.')
    expect(m.alternates?.canonical).toBe('/projects')
    expect(m.openGraph).toMatchObject({ title: 'Projects · Kraft', url: '/projects', siteName: 'Kraft' })
  })
  it('gives Home the full site name', () => {
    expect(pageMetadata('/', 'x').title).toEqual({ absolute: SITE_NAME })
  })
  it('takes an explicit label for pages outside the nav', () => {
    expect(pageMetadata('/privacy', 'x', 'Privacy Policy').title).toBe('Privacy Policy')
  })
})

describe('sitemap and robots', () => {
  it('lists every public page once, and leaves the thank-you page out', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toEqual(INDEXED_PATHS.map((p) => `${SITE_URL}${p === '/' ? '' : p}`))
    expect(urls.some((u) => u.includes('thank-you'))).toBe(false)
  })
  it('points crawlers at the sitemap and keeps them out of the sample sites', () => {
    const r = robots()
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: ['/samples/'] })
  })
})

describe('Person JSON-LD', () => {
  it('describes Justine, and leaves out anything still a PLACEHOLDER', () => {
    const p = personJsonLd('https://kraft.dev')
    expect(p).toMatchObject({ '@type': 'Person', name: 'Justine Acosta', url: 'https://kraft.dev', image: 'https://kraft.dev/assets/portrait.jpg' })
    expect(p).not.toHaveProperty('email')
    expect(p.sameAs).toEqual([])
  })
  it('cannot break out of its script tag', () => {
    expect(jsonLd({ a: '</script><script>' })).not.toContain('</script>')
  })
})

describe('readTokens', () => {
  it("reads Kraft's colours for each theme from the token file", () => {
    expect(readTokens('dark')).toMatchObject({ bg: '#050505', ink: '#F1F5F2', accent: '#D7FFE0', amb: '19,74,48' })
    expect(readTokens('light')).toMatchObject({ bg: '#F2F5F1', accent: '#0E6B44' })
  })
  it('says so when the token file has no such block', () => {
    expect(() => readTokens('dark', 'body{}')).toThrow(/dark/)
  })
})
```

Create `tests/placeholders.test.ts`:

```ts
import { expect, it } from 'vitest'
import { findPlaceholders } from '../scripts/placeholders'

it('lists every content gap still marked PLACEHOLDER, with its file and line', () => {
  const hits = findPlaceholders()
  expect(hits.some((h) => h.file === 'data/profile.ts' && h.text.startsWith('PLACEHOLDER - your contact email'))).toBe(true)
  expect(hits.some((h) => h.file.startsWith('public/samples/'))).toBe(true)
  expect(hits.every((h) => h.text.startsWith('PLACEHOLDER') && h.line > 0)).toBe(true)
})
```

Create `e2e/seo.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const PAGES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms']

test('every page has its own title, description, canonical link and share image', async ({ page }) => {
  const titles = new Set<string>()
  for (const p of PAGES) {
    await page.goto(p)
    titles.add(await page.title())
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(new URL(canonical!).pathname, p).toBe(p)
    await expect(page.locator('meta[name="description"]'), p).toHaveAttribute('content', /\S/)
    await expect(page.locator('meta[property="og:image"]'), p).toHaveCount(1)
    await expect(page.locator('meta[name="twitter:image"]'), p).toHaveCount(1)
  }
  expect(titles.size).toBe(PAGES.length)
})

test('the share image, sitemap, robots file and favicon are served', async ({ request, page }) => {
  const og = await request.get('/opengraph-image')
  expect(og.status()).toBe(200)
  expect(og.headers()['content-type']).toContain('image/png')
  const sitemap = await (await request.get('/sitemap.xml')).text()
  for (const p of ['/projects', '/showcase', '/privacy']) expect(sitemap).toContain(p)
  expect(sitemap).not.toContain('thank-you')
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap:')
  await page.goto('/')
  const icon = await page.locator('link[rel="icon"]').first().getAttribute('href')
  expect((await request.get(icon!)).status()).toBe(200)
})

test('Home describes Justine as a Person', async ({ page }) => {
  await page.goto('/')
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)
  expect(data).toMatchObject({ '@type': 'Person', name: 'Justine Acosta' })
})
```

In `e2e/home.spec.ts`, in `'every Home logo and image loads from this site'`:
- Delete the favicon comment line.
- Change the condition to `if (r.status() >= 400) bad.push(\`${r.status()} ${r.url()}\`)`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/seo.test.ts tests/placeholders.test.ts`
Expected: FAIL, because `@/app/robots` and `../scripts/placeholders` don't resolve.

- [ ] **Step 3: Implement the building blocks**

Create `lib/site.ts`:

```ts
/**
 * The site's public address, for canonical links, the sitemap and the share
 * image (spec §13). Set NEXT_PUBLIC_SITE_URL once the domain is final (see
 * .env.example). Until then, a Vercel build uses the project's production
 * domain. Server-only: it is read at build time.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const set = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (set) return set.replace(/\/+$/, '')
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

export const SITE_URL = siteUrl()
```

Create `lib/seo.ts`:

```ts
import type { Metadata } from 'next'
import { legalLinks } from '@/data/legal'
import { NAV, navForPath } from '@/data/nav'

export const SITE_NAME = 'Justine Acosta · Kraft'
export const OG_BASE = { siteName: 'Kraft', type: 'website', locale: 'en_US' } as const

/** Every page search engines should know about. The thank-you page is left out on purpose. */
export const INDEXED_PATHS = [...NAV.map((n) => n.href), ...legalLinks.map((l) => l.href)]

/**
 * A route's metadata (spec §13): the title (Home carries the full site name),
 * its own description, and its canonical link. The share image comes from
 * app/opengraph-image.tsx and app/twitter-image.tsx.
 */
export function pageMetadata(href: string, description: string, label?: string): Metadata {
  const home = href === '/'
  const name = label ?? navForPath(href).label
  const full = home ? SITE_NAME : `${name} · Kraft`
  return {
    title: home ? { absolute: SITE_NAME } : name,
    description,
    alternates: { canonical: href },
    openGraph: { ...OG_BASE, title: full, description, url: href },
    twitter: { card: 'summary_large_image', title: full, description },
  }
}
```

Create `lib/tokens.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const BLOCKS = {
  dark: /(?:^|\n):root\{color-scheme:dark;([^}]*)\}/,
  light: /\n\[data-theme=light\]\{([^}]*)\}/,
}

/**
 * Kraft's colour tokens for one theme, read from app/globals.css. Used where
 * CSS variables can't reach (the share image), so no colour is copied out of
 * the token file (spec §3). Build-time only.
 */
export function readTokens(theme: 'dark' | 'light', css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')): Record<string, string> {
  const m = css.match(BLOCKS[theme])
  if (!m) throw new Error(`No ${theme} token block in app/globals.css`)
  return Object.fromEntries(
    m[1]
      .split(';')
      .filter(Boolean)
      .map((decl) => {
        const i = decl.indexOf(':')
        return [decl.slice(0, i).trim().replace(/^--/, ''), decl.slice(i + 1).trim()]
      }),
  )
}
```

In `data/profile.ts`, add after `verifiedLabel`:

```ts
  jobTitle: 'Full-stack developer and AI automation engineer',
  address: { locality: 'Manila', country: 'PH' },
```

Create `lib/jsonld.ts`:

```ts
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'
import { SITE_URL } from '@/lib/site'

/** Home's Person JSON-LD (spec §13). Anything still a PLACEHOLDER is left out, so search engines never see one. */
export function personJsonLd(url = SITE_URL) {
  const real = (v: string) => !isPlaceholder(v)
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url,
    image: `${url}${profile.portrait.src}`,
    jobTitle: profile.jobTitle,
    worksFor: { '@type': 'Organization', name: 'Kraft' },
    address: { '@type': 'PostalAddress', addressLocality: profile.address.locality, addressCountry: profile.address.country },
    ...(real(profile.email) ? { email: `mailto:${profile.email}` } : {}),
    sameAs: profile.socials.map((s) => s.href).filter(real),
  }
}

/** JSON for a <script> tag: a `<` inside a string can't close the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
```

Create `lib/share-image.tsx`:

```tsx
import { ImageResponse } from 'next/og'
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { readTokens } from './tokens'

export const SHARE_SIZE = { width: 1200, height: 630 }
export const SHARE_ALT = `${profile.name} · Kraft: ${home.headline.join(' ')}`

/** The share image (spec §13): Home's headline on Kraft's dark palette, lit by the ambient green like the page frames. */
export function shareImage() {
  const t = readTokens('dark')
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          color: t.ink,
          backgroundColor: t.bg,
          backgroundImage: `radial-gradient(900px 520px at 78% -10%, rgba(${t.amb},.55), rgba(${t.amb},0) 60%)`,
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 6, color: t.accent }}>{`${profile.brand} · ${profile.name.toUpperCase()}`}</div>
        <div style={{ display: 'flex', flexDirection: 'column', fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 1.02 }}>
          <span>{home.headline[0]}</span>
          <span style={{ color: t.accent }}>{home.headline[1]}</span>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: t.ink2, maxWidth: 900 }}>{home.lede}</div>
      </div>
    ),
    SHARE_SIZE,
  )
}
```

Create `app/opengraph-image.tsx`:

```tsx
import { SHARE_ALT, SHARE_SIZE, shareImage } from '@/lib/share-image'

export const alt = SHARE_ALT
export const size = SHARE_SIZE
export const contentType = 'image/png'

export default function Image() {
  return shareImage()
}
```

Create `app/twitter-image.tsx`:

```tsx
import { SHARE_ALT, SHARE_SIZE, shareImage } from '@/lib/share-image'

export const alt = SHARE_ALT
export const size = SHARE_SIZE
export const contentType = 'image/png'

export default function Image() {
  return shareImage()
}
```

Create the favicon: `cp public/assets/kraft-mark.svg app/icon.svg`.

Create `app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next'
import { INDEXED_PATHS } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
```

Create `app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** The sample sites are stand-ins for client work, so crawlers stay out of them. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/samples/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

Create `scripts/placeholders.ts`:

```ts
// Lists every content gap still marked PLACEHOLDER (spec §10): the data files
// and the sample pages. Run: npm run placeholders
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

export type Hit = { file: string; line: number; text: string }

const ROOTS = ['data', 'public/samples']
const FILES = /\.(ts|tsx|html)$/
const MARK = /PLACEHOLDER[^'"`<]*/

export function findPlaceholders(root = process.cwd()): Hit[] {
  const hits: Hit[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (FILES.test(name)) {
        readFileSync(path, 'utf8')
          .split(/\r?\n/)
          .forEach((line, i) => {
            const m = line.match(MARK)
            if (m) hits.push({ file: relative(root, path).split(sep).join('/'), line: i + 1, text: m[0].trim() })
          })
      }
    }
  }
  for (const r of ROOTS) {
    try {
      walk(join(root, r))
    } catch {
      // a root that doesn't exist yet has no gaps
    }
  }
  return hits
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const hits = findPlaceholders()
  for (const h of hits) console.log(`${h.file}:${h.line}  ${h.text}`)
  console.log(`\n${hits.length} placeholders left`)
}
```

In `package.json` `scripts`, add `"placeholders": "node scripts/placeholders.ts"`. Node 22.18+ runs TypeScript directly; this machine has Node 26.

- [ ] **Step 4: Wire the metadata**

In `app/layout.tsx`, replace the `metadata` export and add the imports:

```tsx
import { home } from '@/data/home'
import { profile } from '@/data/profile'
import { OG_BASE, SITE_NAME } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: '%s · Kraft' },
  description: home.lede,
  applicationName: 'Kraft',
  authors: [{ name: profile.name }],
  openGraph: { ...OG_BASE, title: SITE_NAME, description: home.lede },
  twitter: { card: 'summary_large_image' },
}
```

Replace each page's `export const metadata: Metadata = { title: '…' }` line as follows. Add `import { pageMetadata } from '@/lib/seo'`, and drop the now-unused `Metadata` import.

| File | New line |
|---|---|
| `app/(site)/projects/page.tsx` | `export const metadata = pageMetadata('/projects', projects.lede)` |
| `app/(site)/showcase/page.tsx` | `export const metadata = pageMetadata('/showcase', showcase.title.join(' '))` |
| `app/(site)/services/page.tsx` | `export const metadata = pageMetadata('/services', servicesPage.lede)` |
| `app/(site)/testimonials/page.tsx` | `export const metadata = pageMetadata('/testimonials', testimonialsPage.lede)` |
| `app/(site)/about/page.tsx` | `export const metadata = pageMetadata('/about', about.lede)` |
| `app/(site)/contact/page.tsx` | `export const metadata = pageMetadata('/contact', contact.lede)` |
| `app/(plain)/privacy/page.tsx` | `export const metadata = pageMetadata('/privacy', legal.privacy.description, legal.privacy.title)` |
| `app/(plain)/terms/page.tsx` | `export const metadata = pageMetadata('/terms', legal.terms.description, legal.terms.title)` |

In `app/(site)/page.tsx`, add Home's metadata and its JSON-LD:

```tsx
import Bento from '@/components/home/Bento'
import Hero from '@/components/home/Hero'
import HomeProfile from '@/components/home/HomeProfile'
import { home } from '@/data/home'
import { jsonLd, personJsonLd } from '@/lib/jsonld'
import { pageMetadata } from '@/lib/seo'

export const metadata = pageMetadata('/', home.lede)

export default function HomePage() {
  return (
    <div className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personJsonLd()) }} />
      <HomeProfile />
      <Hero />
      <Bento />
    </div>
  )
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run tests/seo.test.ts tests/placeholders.test.ts tests/no-raw-colors.test.ts`
Expected: PASS.

Run: `npm run placeholders`
Expected: a list of `file:line  PLACEHOLDER - …` lines ending in `N placeholders left`.

Run: `npx playwright test e2e/seo.spec.ts e2e/home.spec.ts --project=desktop`
Expected: PASS. If `og:image` or `twitter:image` is missing on a page, that page's own `openGraph` or `twitter` object replaced the root's image. Fix it with `images: ['/opengraph-image']` in `pageMetadata`'s `openGraph`, and `images: ['/twitter-image']` in its `twitter`. Ledger the ruling.

- [ ] **Step 6: Run the whole suite, then commit**

Run: `npm test && npx tsc --noEmit && npm run lint`

```bash
git add lib/site.ts lib/seo.ts lib/tokens.ts lib/jsonld.ts lib/share-image.tsx app/opengraph-image.tsx app/twitter-image.tsx app/icon.svg app/sitemap.ts app/robots.ts app/layout.tsx "app/(site)" "app/(plain)" data/profile.ts scripts/placeholders.ts package.json tests/seo.test.ts tests/placeholders.test.ts e2e/seo.spec.ts e2e/home.spec.ts
git commit -m "feat: per-page metadata, share image, sitemap, robots, favicon, Person JSON-LD and a placeholder list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Deploy settings and the verification pass

This task makes the Vercel settings explicit, extends the screenshot pass to the new routes and views, and runs spec §14's verification over the whole branch. Vercel already builds `main` to production and PRs to previews. The site needs no configuration beyond two optional environment variables, which `.env.example` documents.

**Files:**
- Create: `.env.example`
- Modify: `e2e/screenshots.spec.ts`

- [ ] **Step 1: Document the environment**

Create `.env.example`:

```bash
# Copy to .env.local for local runs. On Vercel, set these under Project → Settings → Environment Variables.

# The site's public address, used by canonical links, the sitemap and the share image.
# Unset on Vercel, the project's production domain is used.
NEXT_PUBLIC_SITE_URL=

# Optional. When set, the contact form POSTs JSON here instead of opening the visitor's mail app.
NEXT_PUBLIC_CONTACT_ENDPOINT=
```

- [ ] **Step 2: Extend the screenshot pass**

In `e2e/screenshots.spec.ts`:
- Change `ROUTES` to include the plain pages and the 404:

```ts
const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms', '/thank-you', '/not-a-page']
```

- Inside the first test, after the `for (const r of ROUTES)` loop and still inside the theme loop, capture the sites view and a site preview:

```ts
        await page.goto('/projects#sites')
        await page.waitForTimeout(2500) // the drum loads its thumbnails
        await page.screenshot({ path: `test-results/shots/app-sites-${theme}-${size.name}.png` })
        await page.getByRole('button', { name: 'Open Apex Build Co.' }).dispatchEvent('click')
        await page.waitForTimeout(1200)
        await page.screenshot({ path: `test-results/shots/app-preview-${theme}-${size.name}.png` })
```

- [ ] **Step 3: Run the full verification (spec §14)**

Run each command and read its output:
1. `npx tsc --noEmit`. Expected: no output.
2. `npm run lint`. Expected: no problems.
3. `npm test`. Expected: every file passes.
4. `npm run build`. Expected: every route is listed as static (`○`), including `/privacy`, `/terms`, `/thank-you`, `/sitemap.xml`, `/robots.txt`, `/opengraph-image`, `/twitter-image` and `/icon.svg`.
5. `npm run e2e`. Expected: all desktop and phone tests pass.
6. `npm run shots`. Expected: it writes `test-results/shots/app-*.png` for every route and view, in both themes and at both sizes.

- [ ] **Step 4: Review the screenshots and do the manual passes**

- **Screenshots.** Open each new screenshot (showcase, sites, preview, privacy, terms, thank-you, 404) next to the Kraft references (`test-results/shots/kraft-*.png`). Kraft's tokens, type and spacing should carry over. The drum, the preview and the plain pages must match Kraft's dark-stage and card language. Fix and commit anything that doesn't; each fix gets a test if it is behaviour.
- **Keyboard only** (spec §14): sidebar → ⌘K → Projects → the sites view → Tab into the drum's list → Enter → Esc → the access menu (every switch) → the Showcase tabs (arrows) → the FAQ → the form. Focus must stay visible throughout and always come back to where it was.
- **Reduced motion** (OS setting, then the access menu's switch): the intro is skipped, the shader is off, the drum becomes the grid, the reel, quotes and flagship stand still, and the workstation is a still frame.

- [ ] **Step 5: Commit**

```bash
git add .env.example e2e/screenshots.spec.ts
git commit -m "chore: document deploy settings, and screenshot the new pages and views

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

After this task, the executor runs the final whole-branch review. Pushing the branch opens a Vercel preview. On the preview URL, check `/robots.txt`, `/sitemap.xml`, `/opengraph-image` and `/projects#sites` before merging.

---

## Self-review notes

- **Spec coverage:** every Phase 4 item has a task.
  - §6 drum → Task 6. Preview → Task 5. Flagship → Task 7. Access menu → Task 8.
  - §9 Showcase → Task 7. Thank-you, Privacy, Terms, 404 → Task 9.
  - §10 placeholder list → Task 10. §11 → Tasks 1, 2, 6 and 8. §12 (preview failure, WebGL loss, storage) → Tasks 5, 6 and 8. §13 → Task 10. §14 → Task 11.
  - §15.4 "phone polish" → Tasks 3, 5 and 8. "Vercel hookup" → Tasks 10 and 11.
- **Deferred Phase 3 minors** fixed here: 7, 8 and 11 in Task 1; 9, 12 and 13a (the Method) in Task 2; 10, 13b (the flow scroller) and 4 (the address) in Task 3. Two remain deferred, since they weren't among the owner's picks: the native fragment links' null history state, and `clearHash` keeping Next's state.
- **The Phase 3 ruling** that moved the reveal tests to `/showcase` is honoured in Task 7: the Flagship frame carries `data-reveal`.
