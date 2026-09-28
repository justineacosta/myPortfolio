# Kraft Portfolio — Phase 3: Main Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Projects, Services, Testimonials, About and FAQs/Contact placeholders with Kraft's real pages. That covers the Projects board and its sub-views, the Kraft Method, the six offers and the live automation flow, the testimonial player, the About profile, and a working contact form with FAQs. ⌘K gains the key sections.

**Architecture:**
- Pages are Server Components that render copy from `data/*.ts`. Client Components are used only where something moves or responds.
- The Projects sub-views (reel, four write-ups, AI agents, sites) are native modal `<dialog>`s. They are mounted closed, so their content is pre-rendered. The URL hash picks which one is open (`/projects#build-plan`), so ⌘K and shared links can open one directly.
- `go()` in the navigation provider learns hash links:
  - For a hash on the current page, it announces the hash instead of fading out for a route change that never comes.
  - For a section hash, it scrolls to the section.
- The contact form ports kape's `lib/contact.ts`: it opens the mail client, or POSTs JSON when `NEXT_PUBLIC_CONTACT_ENDPOINT` is set.

**Tech Stack:** Next.js 16.3 App Router, React 19.3, TypeScript 5.9, Tailwind 4.3 (Kraft tokens only), Phosphor (`@phosphor-icons/react/ssr`), `simple-icons` 16.33 (dev, build-time only), Vitest 5 + Testing Library + user-event, Playwright 1.63.

**Spec:** `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md` (§6 contact, §7 ⌘K sections, §9 pages, §10 content, §11 accessibility, §12 error handling)

**Branch:** `feat/kraft-phase3-pages` (already created from `main` at 8512267).

## Decisions made with the owner (2026-09-28)

- **Sub-views are dialogs with deep links.** They use Kraft's overlays on native `<dialog>`, pre-rendered, and each opens from its URL hash.
- **Contact email stays a PLACEHOLDER** (`profile.email`). The form works end to end; the PLACEHOLDER shows until the owner fills it in.
- **"Funnels and sites" opens a plain site list in Phase 3.** It is a grid of the eight sample sites. Phase 4 adds the drum and the live preview on top.

## Global Constraints

- **Colours:** use only Kraft tokens. Raw hex/rgb values are allowed only in `app/globals.css`, and `tests/no-raw-colors.test.ts` enforces this over `app components data hooks lib`. `rgba(var(--amb),…)` inside a Tailwind arbitrary value is fine, because it is not a raw colour. Brand colours live only inside `public/icons/brands/*.svg`.
- **Copy:** Kraft copy is verbatim (`KraftScreens.dc.html`, `Kraft Projects Board.dc.html`). Every gap is a string that starts with `PLACEHOLDER - ` (`lib/placeholder.ts`, `isPlaceholder`). There are two deliberate rewrites:
  - The Message-queued body is made truthful for the mail-client flow (spec §9).
  - The contact validation messages are new.
- **Components render data:** page copy lives in `data/*.ts`, never in components.
- **Icons:** import Phosphor from `@phosphor-icons/react/ssr` using the `…Icon` names. Every name used below was checked against the installed package.
- **Server Components by default.** Use `'use client'` only for the interactive parts.
- **Motion:** every animation has a reduced-motion path, via the OS setting or `html[data-a11y-motion=true]` (`prefersReducedMotion()` in `lib/motion.ts`).
- **One `<h1>` per page**, landmarks, visible focus rings. Dialogs trap focus, close on Esc, return focus, and lock the page behind them (spec §11).
- **Lint** includes the React Compiler rules (`eslint-config-next` 16). Never read or write `ref.current` during render, and never call `setState` synchronously in an effect body.
- `reference/Kraft_Portfolio_Design_System/HANDOFF.md` is **not** followed.
- **Verify with:** `npm test`, `npm run typecheck`, `npm run lint`, `npm run e2e`. Unit tests use `npx vitest run <file>`. E2e uses `npx playwright test <file>`; the build is included, so it takes about 2 minutes.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A hash link to the page you are already on** (⌘K "The build plan" while on `/projects`, or "The Kraft Method" while on `/services`). The panel must not fade out and wait for a route change that never comes. The view opens, or the section scrolls into view. Tests: Task 2 `a section on the current page: no fade, no navigation, the hash is announced`; Task 9 e2e `⌘K on the same page opens the view and the page stays visible`.
2. **Closing a view that arrived with the page** (a shared link, or ⌘K from another page). Close and Esc must keep the visitor on `/projects` by dropping the hash in place. A view opened from the board closes with Back. Tests: Task 2 `closes a shared-link view in place, without leaving the page`; Task 3 e2e `a shared link opens the view; Close stays on the page` and `a board card opens its write-up, and Back closes it`.
3. **Wheel, touch and ⌘K while a view is open.** The page behind must not scroll (Lenis on desktop, the document on phones), and ⌘K must not open a palette behind the modal. Tests: Task 1 `stays shut while a sub-view is open`; Task 3 e2e `the page behind an open view does not scroll`; Task 9 `phone: an open view fills the screen and holds the page still`.
4. **Phone width with wide content** (the 1180px automation canvas, the reel, long PLACEHOLDER strings). Nothing may widen the page; wide pieces scroll inside their own box. Test: Task 9 `phone: no page scrolls sideways`.
5. **Contact failures:**
   - Empty or invalid fields focus the first bad field.
   - A refusing endpoint keeps the typed message and shows the server's sentence.
   - After a mail-client send, the address and a Copy button are always offered, in case no mail app opened.

   Tests: Task 8 `names each missing field and focuses the first one`, `keeps what was typed when the endpoint refuses, and shows why`, `queues the message in the mail app and offers the address as a fallback`.

---

## File Map

| File | Responsibility |
|---|---|
| `app/globals.css` | + Phase 3 fixed-colour tokens, `.frame`, dialog CSS, reel, method, flow CSS and keyframes |
| `vitest.setup.ts` | + `<dialog>` `showModal`/`close` and `scrollIntoView` for jsdom |
| `components/ui/styles.ts` | Shared class strings: `CARD`, `TAG`, `BADGE`, `ICON_TILE` |
| `components/ui/PageHeader.tsx` | Eyebrow (the page's crumb), `<h1>` with Kraft's line breaks, lede |
| `components/ui/Frame.tsx` | Kraft's lit page frame |
| `components/ui/Shot.tsx` | A screenshot, or Kraft's empty image slot while the src is a PLACEHOLDER |
| `components/ui/ViewDialog.tsx` | Native modal dialog: focus, Esc, backdrop, page lock, focus return |
| `components/shell/CommandPalette.tsx` | ⌘K ignored while a view is open |
| `lib/hash.ts` | `splitHref`, `currentHash`, `pushHash`, `clearHash` |
| `lib/scroller.ts` | + `scrollToSection`, `SECTION_OFFSET`; `LenisLike.scrollTo` accepts an element |
| `components/shell/NavigationProvider.tsx` | `go()` understands `#hash` links; lands on sections |
| `hooks/useHashView.ts` | Which sub-view the hash names, and how to close it |
| `data/projects.ts` | Board copy, the four write-ups, the systems roster, reel shots, sample sites |
| `components/projects/Board.tsx` | The board of cards and the cursor cue (client) |
| `components/projects/Window.tsx` | Kraft's document window and its hero |
| `components/projects/DocView.tsx`, `AgentsView.tsx` | The write-up and systems windows |
| `components/projects/StageBar.tsx`, `ReelView.tsx`, `SitesView.tsx` | The dark-stage views |
| `components/projects/ProjectViews.tsx` | Mounts every view; the hash picks the open one (client) |
| `data/services.ts` | + `servicesPage`, `PROCESS`, `METHOD_MS` |
| `data/flows.ts` | Kraft's ten live automation flows |
| `lib/flow.ts` | Edge geometry, lift easing, index wrap |
| `components/services/Method.tsx` | The Kraft Method (client) |
| `components/services/Offers.tsx` | "What I can do for you" |
| `components/services/Automation.tsx` | Live automation flow (client) |
| `data/testimonials.ts` | + `video` per client, `testimonialsPage` |
| `components/testimonials/Testimonials.tsx` | Player, tabs, featured quote, client cards (client) |
| `data/about.ts` | About copy and the four roles |
| `components/about/Intro.tsx`, `Roles.tsx`, `Certified.tsx`, `Aside.tsx` | About page parts |
| `scripts/brand-icons.mjs`, `public/icons/brands/googlesheets.svg` | + Google Sheets logo for the roles |
| `data/contact.ts`, `data/faqs.ts` | Contact copy, validation messages, Kraft's five FAQs |
| `lib/contact.ts` | Check, sanitise, mailto, endpoint POST (kape port) |
| `components/contact/ContactForm.tsx` | Form, inline validation, sent card (client) |
| `components/contact/Faqs.tsx` | Accordion (client) |
| `components/contact/Availability.tsx` | Availability and LinkedIn |
| `lib/commands.ts` | + `SECTIONS` for ⌘K |
| `app/(site)/{projects,services,testimonials,about,contact}/page.tsx` | The pages |
| `e2e/projects.spec.ts`, `e2e/services.spec.ts`, `e2e/contact.spec.ts` | New e2e |
| `e2e/shell.spec.ts`, `e2e/palette.spec.ts`, `e2e/phone.spec.ts`, `e2e/screenshots.spec.ts` | Updated e2e |

---

### Task 1: Page kit, Phase 3 tokens and the view dialog

**Files:**
- Create: `components/ui/styles.ts`, `components/ui/PageHeader.tsx`, `components/ui/Frame.tsx`, `components/ui/Shot.tsx`, `components/ui/ViewDialog.tsx`
- Modify: `app/globals.css`, `vitest.setup.ts`, `components/shell/CommandPalette.tsx`
- Test: `tests/ui-kit.test.tsx`, `tests/ViewDialog.test.tsx`, `tests/CommandPalette.test.tsx`

**Interfaces:**
- Consumes: `navForPath(pathname).eyebrow` (`data/nav.ts`), `isPlaceholder` (`lib/placeholder.ts`)
- Produces:
  - `CARD`, `TAG`, `BADGE`, `ICON_TILE`: `string` class lists (`components/ui/styles.ts`)
  - `PageHeader({ href: string; title: readonly string[]; lede: string; ledeClassName?: string; className?: string })`
  - `type Lit = { x: string; y?: string; size?: string; alpha: number; stop: string; from?: 's1' | 's2' }`; `Frame({ lit: Lit; className?: string; children })`
  - `Shot({ src: string; hint: string; alt?: string; sizes?: string })`: fills its positioned parent
  - `ViewDialog({ open: boolean; onClose: () => void; label: string; className?: string; children })`:
    - Clicks on the dialog itself, or on any element carrying `data-backdrop`, call `onClose`.
    - While open, `<html>` carries `data-dialog`.
  - Tailwind colours: `danger`, `danger-b`, `mac-r`, `mac-y`, `mac-g`, `veil-ink`, `veil-chip`, `veil-chip-hover`, `veil-line`, `veil-deep`, `poster-fade`
  - Shadow vars: `--window-shadow`, `--shot-shadow`, `--peek-shadow`, `--tile-shadow`, `--tip-shadow`, `--cert-shadow`, `--chip-shadow`
  - CSS classes:
    - `.frame`
    - `dialog.view` with `.view--window` or `.view--stage`
    - `html[data-dialog]`

- [ ] **Step 1: Write the failing tests**

Create `tests/ui-kit.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import Shot from '@/components/ui/Shot'

describe('PageHeader', () => {
  it("shows the page's crumb, Kraft's two-line heading as one sentence, and the lede", () => {
    render(<PageHeader href="/projects" title={['Real builds you', 'can open.']} lede="Everything here shipped." />)
    expect(screen.getByText('PROJECTS / BUILDS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Real builds you can open.' })).toBeInTheDocument()
    expect(screen.getByText('Everything here shipped.')).toBeInTheDocument()
  })
})

describe('Frame', () => {
  it('lights the frame from the given edge, defaulting to the top and the s1 surface', () => {
    const { container } = render(
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="p-4">
        <span>inside</span>
      </Frame>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el).toHaveClass('frame', 'p-4')
    expect(el.style.getPropertyValue('--lit-x')).toBe('12%')
    expect(el.style.getPropertyValue('--lit-y')).toBe('-10%')
    expect(el.style.getPropertyValue('--lit-size')).toBe('110% 100%')
    expect(el.style.getPropertyValue('--lit-from')).toBe('var(--s1)')
  })
})

describe('Shot', () => {
  it("shows Kraft's empty slot while the screenshot is a PLACEHOLDER", () => {
    render(
      <div className="relative">
        <Shot src="PLACEHOLDER - workflow screenshot" hint="Drop a workflow screenshot · 16:10" />
      </div>,
    )
    expect(screen.getByText('Drop a workflow screenshot · 16:10')).toBeInTheDocument()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows the image once there is one', () => {
    render(
      <div className="relative">
        <Shot src="/assets/portrait.jpg" hint="unused" alt="A real screenshot" />
      </div>,
    )
    expect(screen.getByRole('img', { name: 'A real screenshot' })).toBeInTheDocument()
  })
})
```

Create `tests/ViewDialog.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ViewDialog from '@/components/ui/ViewDialog'

const onClose = vi.fn()
const ui = (open: boolean) => (
  <>
    <button type="button">Open it</button>
    <ViewDialog open={open} onClose={onClose} label="The build plan">
      <p>Inside</p>
      <div data-backdrop>Empty stage</div>
    </ViewDialog>
  </>
)
const dialog = () => document.querySelector('dialog')!

describe('ViewDialog', () => {
  beforeEach(() => onClose.mockReset())

  it('keeps its content in the page while closed, so it is pre-rendered', () => {
    render(ui(false))
    expect(dialog()).not.toHaveAttribute('open')
    expect(dialog()).toHaveTextContent('Inside')
  })

  it('opens modally, names itself, keeps Lenis out and locks the page', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    expect(dialog()).toHaveAttribute('open')
    expect(dialog()).toHaveAttribute('aria-label', 'The build plan')
    expect(dialog()).toHaveAttribute('data-lenis-prevent')
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('closing from its owner unlocks the page and returns focus, without calling onClose', () => {
    const { rerender } = render(ui(false))
    screen.getByRole('button', { name: 'Open it' }).focus()
    rerender(ui(true))
    rerender(ui(false))
    expect(dialog()).not.toHaveAttribute('open')
    expect(document.documentElement).not.toHaveAttribute('data-dialog')
    expect(screen.getByRole('button', { name: 'Open it' })).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reports a close the browser made itself (Escape)', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    dialog().close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on the backdrop or an empty stage, not on a click inside', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    fireEvent.click(screen.getByText('Inside'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(dialog())
    fireEvent.click(screen.getByText('Empty stage'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('never leaves the page locked when it unmounts while open', () => {
    const { rerender, unmount } = render(ui(false))
    rerender(ui(true))
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-dialog')
  })
})
```

Append to the `describe('CommandPalette', …)` block in `tests/CommandPalette.test.tsx` (it already imports `userEvent`, `render`, `screen`; `setup` and `dialog` are defined at the top of the file):

```tsx
  it('stays shut while a sub-view is open (the modal owns the screen)', async () => {
    const user = userEvent.setup()
    setup()
    document.documentElement.setAttribute('data-dialog', '')
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeNull()
  })
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/ui-kit.test.tsx tests/ViewDialog.test.tsx tests/CommandPalette.test.tsx`
Expected: FAIL. The new modules don't exist yet ("Failed to resolve import '@/components/ui/Frame'" and similar), and the new palette test fails because the palette opens.

- [ ] **Step 3: Teach jsdom the dialog methods**

In `vitest.setup.ts`, after the `Element.prototype.scrollTo` line, add:

```ts
Element.prototype.scrollIntoView = function () {} as typeof Element.prototype.scrollIntoView

// jsdom has <dialog> and its `open` attribute, but not showModal()/close().
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.setAttribute('open', '')
}
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  if (!this.hasAttribute('open')) return
  this.removeAttribute('open')
  this.dispatchEvent(new Event('close'))
}
```

- [ ] **Step 4: Add the Phase 3 tokens and CSS**

In `app/globals.css`, inside `@theme inline { … }`, after `--color-logo-chip: var(--logo-chip);`, add:

```css
  --color-danger: var(--danger);
  --color-danger-b: var(--danger-b);
  --color-mac-r: var(--mac-r);
  --color-mac-y: var(--mac-y);
  --color-mac-g: var(--mac-g);
  --color-veil-ink: var(--veil-ink);
  --color-veil-chip: var(--veil-chip);
  --color-veil-chip-hover: var(--veil-chip-hover);
  --color-veil-line: var(--veil-line);
  --color-veil-deep: var(--veil-deep);
  --color-poster-fade: var(--poster-fade);
```

Append to the end of `app/globals.css`:

```css
/* ---- Pages (Phase 3) ----
   Fixed colours Kraft uses on both themes: the alert red of dead-end flow
   nodes (KraftScreens.dc.html:1223-1225), the window traffic lights and the
   dark stage behind the reel and site views (Kraft Projects Board.dc.html:
   137-139, 243-247, 279), and the fade under the testimonial poster
   (KraftScreens.dc.html:339). */
:root{--danger:#C9614F;--danger-b:rgba(201,97,79,.45);--mac-r:#ED6A5E;--mac-y:#F4BF4F;--mac-g:#61C554;--veil-ink:#F1F5F2;--veil-chip:rgba(255,255,255,.08);--veil-chip-hover:rgba(255,255,255,.18);--veil-line:rgba(255,255,255,.16);--veil-deep:rgba(6,10,8,.88);--poster-fade:rgba(5,5,5,.82);--window-shadow:0 50px 120px -60px rgba(0,0,0,.95);--shot-shadow:0 40px 90px -50px rgba(0,0,0,.9);--peek-shadow:0 20px 50px -24px rgba(0,0,0,.35);--tile-shadow:0 14px 32px -20px rgba(0,0,0,.4);--tip-shadow:0 12px 30px -12px rgba(0,0,0,.6);--cert-shadow:0 3px 12px -4px rgba(0,0,0,.5);--chip-shadow:0 1px 3px rgba(0,0,0,.18)}

/* Kraft's page frame, lit by the ambient green from one edge
   (KraftScreens.dc.html:217, 276, 335, 401, 472). components/ui/Frame.tsx sets the --lit-* values. */
.frame{background:radial-gradient(var(--lit-size) at var(--lit-x) var(--lit-y),rgba(var(--amb),var(--lit)),rgba(var(--amb),0) var(--lit-stop)),linear-gradient(180deg,var(--lit-from),var(--bg))}

/* Sub-views (components/ui/ViewDialog.tsx): a native modal <dialog> filling
   the viewport. It lives in the top layer, so the page's rise-in transform
   and swap fade never reach it. ::backdrop does not reliably inherit custom
   properties, so its colours are literal. */
html[data-dialog]{overflow:hidden}
dialog.view{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:transparent;color:var(--ink);overflow:hidden}
dialog.view[open]{display:flex;flex-direction:column;animation:pbFade .28s ease both}
dialog.view::backdrop{background:rgba(6,10,8,.78)}
.view--window{padding:clamp(10px,2.4vw,34px)}
.view--stage::backdrop{background:rgba(6,10,8,.74);backdrop-filter:blur(3px)}
@keyframes pbFade{from{opacity:0}to{opacity:1}}
```

- [ ] **Step 5: Write the page kit**

Create `components/ui/styles.ts`:

```ts
/** Kraft's recurring surfaces (KraftScreens.dc.html), shared so every page draws them the same way. */
export const CARD = 'rounded-[20px] border border-b1 bg-linear-to-b from-s2 to-s1'
export const TAG = 'rounded-lg border border-b1 bg-chip px-[9px] py-[5px] font-mono text-[10px] text-ink2'
export const BADGE = 'rounded-lg border border-wash-b bg-wash px-2.5 py-[5px] font-mono text-[9.5px] tracking-[.12em] text-accent'
export const ICON_TILE = 'grid size-[34px] shrink-0 place-items-center rounded-[11px] border border-wash-b bg-wash text-accent'
```

Create `components/ui/PageHeader.tsx`:

```tsx
import { Fragment } from 'react'
import { navForPath } from '@/data/nav'

type Props = { href: string; title: readonly string[]; lede: string; ledeClassName?: string; className?: string }

/**
 * Kraft's page header (KraftScreens.dc.html:211-215): the page's crumb as
 * the eyebrow, the <h1> broken where Kraft breaks it, and the lede. The lines
 * are block spans joined by a space, so the heading reads as one sentence.
 */
export default function PageHeader({
  href,
  title,
  lede,
  ledeClassName = 'max-w-[580px]',
  className = 'max-w-[960px]',
}: Props) {
  return (
    <header className={`pt-[clamp(4px,1.2cqw,16px)] ${className}`}>
      <p className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">{navForPath(href).eyebrow}</p>
      <h1 className="text-[clamp(28px,4.6cqw,54px)] leading-[1.03] font-bold tracking-[-.035em]">
        {title.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && ' '}
            <span className="block">{line}</span>
          </Fragment>
        ))}
      </h1>
      <p className={`mt-4 text-[clamp(13.5px,1.4cqw,17px)] leading-[1.55] text-ink2 ${ledeClassName}`}>{lede}</p>
    </header>
  )
}
```

Create `components/ui/Frame.tsx`:

```tsx
import type { CSSProperties, ReactNode } from 'react'

/** Where Kraft lights a page frame from: the radial's centre, size, strength and fade stop. */
export type Lit = { x: string; y?: string; size?: string; alpha: number; stop: string; from?: 's1' | 's2' }

type Props = { lit: Lit; className?: string; children: ReactNode }

/**
 * Kraft's page frame (KraftScreens.dc.html:217, 276, 335, 401, 472; Kraft
 * Projects Board.dc.html:43): a rounded panel lit by the ambient green.
 * Layout and padding come from `className`, since every page lays it out
 * differently.
 */
export default function Frame({ lit, className = '', children }: Props) {
  const style = {
    '--lit-x': lit.x,
    '--lit-y': lit.y ?? '-10%',
    '--lit-size': lit.size ?? '110% 100%',
    '--lit': lit.alpha,
    '--lit-stop': lit.stop,
    '--lit-from': `var(--${lit.from ?? 's1'})`,
  } as CSSProperties
  return (
    <div className={`frame rounded-[26px] border border-b1 ${className}`} style={style}>
      {children}
    </div>
  )
}
```

Create `components/ui/Shot.tsx`:

```tsx
import Image from 'next/image'
import { ImageIcon } from '@phosphor-icons/react/ssr'
import { isPlaceholder } from '@/lib/placeholder'

type Props = { src: string; hint: string; alt?: string; sizes?: string }

/**
 * A screenshot, or Kraft's empty image slot while `src` is a PLACEHOLDER
 * (image-slot.js): a dashed frame with an image glyph and the slot's hint.
 * Fills its positioned parent.
 */
export default function Shot({ src, hint, alt = '', sizes = '50vw' }: Props) {
  if (!isPlaceholder(src)) return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
  return (
    <span className="absolute inset-1.5 grid place-content-center justify-items-center gap-1.5 rounded-[9px] border border-dashed border-b2 p-2 text-center text-ink3">
      <ImageIcon size={20} aria-hidden />
      <span className="text-[11px] font-medium">{hint}</span>
    </span>
  )
}
```

Create `components/ui/ViewDialog.tsx`:

```tsx
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
```

- [ ] **Step 6: Keep ⌘K shut while a view is open**

In `components/shell/CommandPalette.tsx`, in the `onKey` handler of `PaletteProvider`, change:

```ts
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) closePalette()
        else openPalette()
      }
```

to:

```ts
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        // A sub-view (components/ui/ViewDialog.tsx) owns the screen and makes
        // the rest inert: a palette opened now would sit, unusable, behind it.
        if (document.documentElement.hasAttribute('data-dialog')) return
        if (open) closePalette()
        else openPalette()
      }
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/ui-kit.test.tsx tests/ViewDialog.test.tsx tests/CommandPalette.test.tsx tests/no-raw-colors.test.ts`
Expected: PASS (4 files).

- [ ] **Step 8: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add app/globals.css vitest.setup.ts components/ui components/shell/CommandPalette.tsx tests/ui-kit.test.tsx tests/ViewDialog.test.tsx tests/CommandPalette.test.tsx
git commit -m "feat: page kit (header, frame, shot), Phase 3 tokens and the native view dialog

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Hash links: sections and sub-views you can link to

**Files:**
- Create: `lib/hash.ts`, `hooks/useHashView.ts`
- Modify: `lib/scroller.ts`, `components/shell/NavigationProvider.tsx`
- Test: `tests/hash.test.ts`, `tests/useHashView.test.tsx`, `tests/NavigationProvider.hash.test.tsx`

**Interfaces:**
- Consumes: `registerLenis`, `scrollToTop` (`lib/scroller.ts`), `prefersReducedMotion` (`lib/motion.ts`)
- Produces:
  - `splitHref(href: string): { path: string; hash: string }`
  - `currentHash(): string`: without the `#`, decoded
  - `pushHash(hash: string): void`: a new history entry (unless it is already the hash) plus a `hashchange` event
  - `clearHash(): void`: drops the hash in place and keeps Next's history state
  - `SECTION_OFFSET = 88`
  - `scrollToSection(id: string, opts: { smooth: boolean }): boolean`: false when there is no such element, or it sits inside a `<dialog>`
  - `useHashView<T extends string>(ids: readonly T[]): { view: T | null; close: () => void }`
  - `go(href)` accepts `/path#hash`:
    - Same path: `pushHash`, with no fade and no push.
    - Another path: the normal fade, then `router.push(href, { scroll: false })`, then it lands on the section.

- [ ] **Step 1: Write the failing tests**

Create `tests/hash.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHash, currentHash, pushHash, splitHref } from '@/lib/hash'
import { registerLenis, scrollToSection, SECTION_OFFSET } from '@/lib/scroller'

describe('splitHref', () => {
  it('splits a path from its hash', () => {
    expect(splitHref('/projects#build-plan')).toEqual({ path: '/projects', hash: 'build-plan' })
  })
  it('leaves a plain path alone', () => {
    expect(splitHref('/about')).toEqual({ path: '/about', hash: '' })
  })
})

describe('pushHash / clearHash', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects?x=1'))

  it('adds one history entry, announces it, and never duplicates the entry', () => {
    const heard = vi.fn()
    window.addEventListener('hashchange', heard)
    const before = window.history.length
    pushHash('reel')
    expect(currentHash()).toBe('reel')
    expect(window.history.length).toBe(before + 1)
    pushHash('reel')
    expect(window.history.length).toBe(before + 1)
    expect(heard).toHaveBeenCalledTimes(2)
    window.removeEventListener('hashchange', heard)
  })

  it('clears the hash in place, keeping the path and the query', () => {
    pushHash('reel')
    const len = window.history.length
    clearHash()
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/projects?x=1')
    expect(window.history.length).toBe(len)
  })
})

describe('scrollToSection', () => {
  it('brings a section into view, and ignores missing ids and anything inside a dialog', () => {
    document.body.innerHTML = '<section id="faqs"></section><dialog><div id="inside"></div></dialog>'
    const spy = vi.spyOn(document.getElementById('faqs')!, 'scrollIntoView')
    expect(scrollToSection('faqs', { smooth: true })).toBe(true)
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(scrollToSection('nope', { smooth: true })).toBe(false)
    expect(scrollToSection('inside', { smooth: true })).toBe(false)
    expect(scrollToSection('', { smooth: true })).toBe(false)
  })

  it('goes through Lenis when Lenis owns the panel, clearing the sticky top bar', () => {
    document.body.innerHTML = '<section id="method"></section>'
    const lenis = { scrollTo: vi.fn() }
    registerLenis(lenis)
    scrollToSection('method', { smooth: false })
    expect(lenis.scrollTo).toHaveBeenCalledWith(document.getElementById('method'), {
      immediate: true,
      force: true,
      offset: -SECTION_OFFSET,
    })
    registerLenis(null)
  })
})
```

Create `tests/useHashView.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useHashView } from '@/hooks/useHashView'
import { pushHash } from '@/lib/hash'

const IDS = ['reel', 'build-plan'] as const

describe('useHashView', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))
  afterEach(() => vi.restoreAllMocks())

  it('opens the view a shared link names', () => {
    window.history.replaceState(null, '', '/projects#build-plan')
    const { result } = renderHook(() => useHashView(IDS))
    expect(result.current.view).toBe('build-plan')
  })

  it('ignores hashes that are not its views', () => {
    window.history.replaceState(null, '', '/projects#faqs')
    const { result } = renderHook(() => useHashView(IDS))
    expect(result.current.view).toBeNull()
  })

  it('closes a shared-link view in place, without leaving the page', () => {
    window.history.replaceState(null, '', '/projects#reel')
    const back = vi.spyOn(window.history, 'back')
    const { result } = renderHook(() => useHashView(IDS))
    act(() => result.current.close())
    expect(back).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
    expect(result.current.view).toBeNull()
  })

  it('opens on an in-page hash change and closes with Back', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { result } = renderHook(() => useHashView(IDS))
    act(() => pushHash('reel'))
    expect(result.current.view).toBe('reel')
    act(() => result.current.close())
    expect(back).toHaveBeenCalledTimes(1)
  })

  it('follows Back and Forward', () => {
    const { result } = renderHook(() => useHashView(IDS))
    act(() => pushHash('reel'))
    act(() => {
      window.history.replaceState(null, '', '/projects')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.view).toBeNull()
  })
})
```

Create `tests/NavigationProvider.hash.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NavigationProvider, SWAP_MS, useShellNav } from '@/components/shell/NavigationProvider'

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: '/services' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}))

const setup = () => renderHook(() => useShellNav(), { wrapper: NavigationProvider })

const section = (id: string) => {
  const el = document.createElement('section')
  el.id = id
  document.body.appendChild(el)
  return el
}

describe('NavigationProvider with hash links', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nav.push.mockReset()
    nav.pathname = '/services'
    window.history.replaceState(null, '', '/services')
    document.body.innerHTML = ''
  })
  afterEach(() => vi.useRealTimers())

  it('a section on the current page: no fade, no navigation, the hash is announced', () => {
    const heard = vi.fn()
    window.addEventListener('hashchange', heard)
    const { result } = setup()
    act(() => result.current.go('/services#method'))
    expect(result.current.swapping).toBe(false)
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#method')
    expect(heard).toHaveBeenCalledTimes(1)
    window.removeEventListener('hashchange', heard)
  })

  it('scrolls a section on the current page into view', () => {
    const spy = vi.spyOn(section('method'), 'scrollIntoView')
    const { result } = setup()
    act(() => result.current.go('/services#method'))
    expect(spy).toHaveBeenCalled()
  })

  it('a section on another page: fades, then pushes the full link', () => {
    const { result } = setup()
    act(() => result.current.go('/contact#faqs'))
    expect(result.current.swapping).toBe(true)
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledWith('/contact#faqs', { scroll: false })
  })

  it('lands on the section once the other page commits', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/contact#faqs'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    const spy = vi.spyOn(section('faqs'), 'scrollIntoView')
    window.history.replaceState(null, '', '/contact#faqs')
    nav.pathname = '/contact'
    rerender()
    expect(spy).toHaveBeenCalled()
  })

  it('a hash link still lets a later click win while its page loads', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/contact#faqs'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    act(() => result.current.go('/about'))
    nav.pathname = '/contact' // the hash link's page commits late
    rerender()
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenLastCalledWith('/about', { scroll: false })
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/hash.test.ts tests/useHashView.test.tsx tests/NavigationProvider.hash.test.tsx`
Expected: FAIL. `lib/hash` and `hooks/useHashView` fail to resolve, and `scrollToSection` is not exported.

- [ ] **Step 3: Write `lib/hash.ts`**

```ts
/**
 * URL-hash helpers for sub-views and sections (⌘K deep links, shared links).
 * A hash is pushed with history.pushState, which Next's App Router patches to
 * carry its own state, and announced with a hashchange event, so the browser
 * never makes its own jump to an element with that id.
 */
export function splitHref(href: string): { path: string; hash: string } {
  const i = href.indexOf('#')
  return i < 0 ? { path: href, hash: '' } : { path: href.slice(0, i), hash: href.slice(i + 1) }
}

export function currentHash(): string {
  const raw = window.location.hash.slice(1)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Makes `hash` the URL's hash (a new history entry unless it already is) and tells listeners. */
export function pushHash(hash: string) {
  const oldURL = window.location.href
  if (currentHash() !== hash) window.history.pushState(null, '', `#${hash}`)
  window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: window.location.href }))
}

/** Drops the hash in place: no new history entry, and Next's state is kept. */
export function clearHash() {
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
}
```

- [ ] **Step 4: Add `scrollToSection` to `lib/scroller.ts`**

Replace the `LenisLike` type with:

```ts
export type LenisLike = {
  scrollTo(target: number | HTMLElement, opts?: { immediate?: boolean; force?: boolean; offset?: number }): void
}
```

Append:

```ts
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
```

Sections that ⌘K targets carry `scroll-mt-[88px]`, so the `scrollIntoView` path clears the top bar too.

- [ ] **Step 5: Teach `go()` hash links**

In `components/shell/NavigationProvider.tsx`:

Replace the imports of `scrollToTop`:

```ts
import { currentHash, pushHash, splitHref } from '@/lib/hash'
import { scrollToSection, scrollToTop } from '@/lib/scroller'
```

Replace the `go` callback with:

```ts
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
```

`pushed` holds the path, not the full href, because `usePathname()` never includes the hash. Keeping the path is what keeps the "a later click wins" guard working for hash links.

Replace the pathname effect with:

```ts
  useEffect(() => {
    if (pathname !== pushed.current) window.clearTimeout(timer.current)
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
```

- [ ] **Step 6: Write `hooks/useHashView.ts`**

```ts
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
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run tests/hash.test.ts tests/useHashView.test.tsx tests/NavigationProvider.hash.test.tsx tests/NavigationProvider.test.tsx`
Expected: PASS (4 files). The existing NavigationProvider tests still pass.

- [ ] **Step 8: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add lib/hash.ts lib/scroller.ts hooks/useHashView.ts components/shell/NavigationProvider.tsx tests/hash.test.ts tests/useHashView.test.tsx tests/NavigationProvider.hash.test.tsx
git commit -m "feat: hash links: go() opens same-page sections and sub-views, lands on sections of other pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Projects — data, the board, and the write-up and systems windows

**Files:**
- Create: `data/projects.ts`, `components/projects/Board.tsx`, `components/projects/Window.tsx`, `components/projects/DocView.tsx`, `components/projects/AgentsView.tsx`, `components/projects/ProjectViews.tsx`, `e2e/projects.spec.ts`
- Modify: `app/(site)/projects/page.tsx`, `app/globals.css`, `e2e/shell.spec.ts:23`
- Test: `tests/projects.test.tsx`

**Interfaces:**
- Consumes:
  - `PageHeader`, `Frame`, `Shot`, `ViewDialog` (Task 1)
  - `useHashView` (Task 2)
  - `prefersReducedMotion`
- Produces:
  - `PROJECT_VIEWS = ['reel','build-plan','support-desk','agentic-framework','end-to-end','sites','ai-agents'] as const`, with `type ProjectView`
  - `DOC_VIEWS = ['build-plan','support-desk','agentic-framework','end-to-end'] as const`, with `type DocView`
  - Types: `Chip`, `DocCard`, `Doc`, `AgentCard`, `AgentGroup`, `Screenshot = { src: string; label: string }`, `Site = { name: string; file: string; shot: string }`
  - `projects` (see code): `.cards.{reel,plan,sites,agents}`, `.writeups`, `.reel`, `.sitesView`, `.agentsView`, `.docs: Record<DocView, Doc>`, `.close`, `.builtWith`, `.live`, `.internal`
  - `Window({ open, onClose, title, children })`, `WindowHero({ kicker, lede, stack })` and `WindowSection({ name, blurb, children })`
  - `ProjectViews()`: Task 4 adds `ReelView` and `SitesView` to it
  - Board card links: `href="#<view>"` and `data-case="<cue>"`

- [ ] **Step 1: Write the failing test**

Create `tests/projects.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import { DOC_VIEWS, PROJECT_VIEWS, projects } from '@/data/projects'
import { installMatchMedia } from '@/test/matchMedia'

describe('Projects data', () => {
  it('names every sub-view once, and every write-up opens a document', () => {
    expect(new Set(PROJECT_VIEWS).size).toBe(PROJECT_VIEWS.length)
    expect(Object.keys(projects.docs).sort()).toEqual([...DOC_VIEWS].sort())
    expect(projects.writeups.every((w) => (DOC_VIEWS as readonly string[]).includes(w.view))).toBe(true)
  })

  it("keeps Kraft's roster, the build plan's sections, the reel and the sites", () => {
    expect(projects.agentsView.groups.map((g) => g.name)).toEqual(['KapeAI', 'AI Agents', 'RAG Chatbots', 'Chatbots', 'Hermes'])
    expect(projects.docs['build-plan'].sections.map((s) => s.name)).toEqual([
      'Before anything is clicked', 'The flow', 'What ships with it',
    ])
    expect(projects.reel.shots.map((s) => s.label)).toEqual([
      '01 - Support | New Ticket', 'Workflows list', '02 - Post-Purchase Delivery', 'Global workflow settings', 'Execution logs',
    ])
    expect(projects.sitesView.sites).toHaveLength(8)
  })
})

describe('Board', () => {
  it('links every card to its sub-view by hash, in board order', () => {
    render(<Board />)
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      '#reel', '#build-plan', '#support-desk', '#agentic-framework', '#end-to-end', '#sites', '#ai-agents',
    ])
    expect(screen.getByText('CLICK A CARD TO OPEN IT')).toBeInTheDocument()
  })

  it('names the card under the pointer in the cursor cue', () => {
    render(<Board />)
    fireEvent.pointerMove(screen.getByRole('link', { name: /^The build plan/ }), { clientX: 40, clientY: 40 })
    expect(screen.getByText('VIEW THE PLAN')).toBeInTheDocument()
  })

  it('shows no cue with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Board />)
    fireEvent.pointerMove(screen.getByRole('link', { name: /^The build plan/ }), { clientX: 40, clientY: 40 })
    expect(screen.queryByText('VIEW THE PLAN')).toBeNull()
  })
})

describe('ProjectViews', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))

  it('pre-renders every view, closed', () => {
    render(<ProjectViews />)
    const dialogs = document.querySelectorAll('dialog')
    expect(dialogs).toHaveLength(DOC_VIEWS.length + 1)
    dialogs.forEach((d) => expect(d).not.toHaveAttribute('open'))
    expect(document.body).toHaveTextContent('Name the outcome')
  })

  it('opens the write-up a shared link names, and Close drops the hash', () => {
    window.history.replaceState(null, '', '/projects#support-desk')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Support Ticketing System' })
    expect(view).toHaveAttribute('open')
    fireEvent.click(within(view).getByRole('button', { name: 'Close' }))
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })

  it('marks which systems are live and which are internal', () => {
    window.history.replaceState(null, '', '/projects#ai-agents')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
    expect(within(view).getAllByText('LIVE')).toHaveLength(8)
    expect(within(view).getAllByText('INTERNAL')).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/projects.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/projects/Board'".

- [ ] **Step 3: Write `data/projects.ts`**

The copy is verbatim from `Kraft Projects Board.dc.html:37-130, 317-509, 634-698`. Kraft's empty image slots become PLACEHOLDERs.

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsClockwiseIcon, ArticleIcon, BellSimpleIcon, BlueprintIcon, BooksIcon, BrainIcon, BrowsersIcon, ChartBarIcon,
  ChatCircleIcon, CheckCircleIcon, ClockCountdownIcon, CodeIcon, CoffeeIcon, CursorIcon, DatabaseIcon, EnvelopeSimpleIcon,
  EyeIcon, FileJsIcon, FileTextIcon, FilmStripIcon, FlowArrowIcon, GitBranchIcon, GraphIcon, HandshakeIcon, HashIcon,
  HourglassMediumIcon, LifebuoyIcon, LightningIcon, ListChecksIcon, MagnifyingGlassIcon, MicrophoneIcon, NoteIcon,
  PackageIcon, PaperPlaneTiltIcon, PhoneCallIcon, PuzzlePieceIcon, RobotIcon, ScissorsIcon, SealCheckIcon,
  ShieldCheckIcon, ShippingContainerIcon, SignOutIcon, SparkleIcon, TargetIcon, TerminalWindowIcon, TextboxIcon,
  TimerIcon, TrayIcon, TrendUpIcon, UserCircleIcon, UserFocusIcon, UsersThreeIcon, WaveformIcon, WrenchIcon,
} from '@phosphor-icons/react/ssr'

/**
 * The Projects board and its sub-views, verbatim from Kraft Projects
 * Board.dc.html. Screens Kraft left as empty image slots are PLACEHOLDERs.
 */

/** Every sub-view the board opens. Each id is also its URL hash (/projects#build-plan). */
export const PROJECT_VIEWS = ['reel', 'build-plan', 'support-desk', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const
export type ProjectView = (typeof PROJECT_VIEWS)[number]
export const DOC_VIEWS = ['build-plan', 'support-desk', 'agentic-framework', 'end-to-end'] as const
export type DocView = (typeof DOC_VIEWS)[number]

export type Chip = { name: string; icon: Icon }
export type DocCard = { step: string; icon: Icon; title: string; desc: string; meta: string }
export type Doc = { kicker: string; title: string; lede: string; stack: Chip[]; sections: { name: string; blurb: string; cards: DocCard[] }[] }
export type AgentCard = { title: string; icon: Icon; live: boolean; icons: Icon[]; desc: string; meta: string; tags: string[] }
export type AgentGroup = { name: string; blurb: string; cards: AgentCard[] }
export type Screenshot = { src: string; label: string }
export type Site = { name: string; file: string; shot: string }
type Writeup = { view: DocView; kicker: string; title: string; desc: string; icon: Icon; cue: string }

const REEL: Screenshot[] = [
  '01 - Support | New Ticket',
  'Workflows list',
  '02 - Post-Purchase Delivery',
  'Global workflow settings',
  'Execution logs',
].map((label) => ({ label, src: `PLACEHOLDER - GoHighLevel workflow screenshot: ${label} (16:10)` }))

const SITES: Site[] = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html'],
  ['Blade Studio', 'sample-brand-studio.html'],
  ['Below Ground', 'sample-utility-contractor.html'],
  ['Baptiste', 'sample-law-firm.html'],
  ['One Hour Therapy', 'sample-therapy-clinic.html'],
  ['Trusted Mover', 'sample-moving-company.html'],
  ['Payline', 'sample-fintech-funnel.html'],
  ['Solar Field', 'sample-solar-installer.html'],
].map(([name, file]) => ({ name, file, shot: `PLACEHOLDER - ${name} site screenshot (3:4)` }))

const GROUPS: AgentGroup[] = [
  {
    name: 'KapeAI', blurb: 'Answers how to do anything in the workspace, in English or Tagalog.',
    cards: [
      { title: 'KapeAI', icon: CoffeeIcon, live: true, icons: [SparkleIcon], desc: 'Answers how to do anything in the workspace, in English or Tagalog.', meta: 'Claude Haiku 4.5 · cached knowledge, no retrieval step', tags: ['Claude'] },
    ],
  },
  {
    name: 'AI Agents', blurb: 'They pick their own tools and finish the job. Not chat windows.',
    cards: [
      { title: 'KapeSEO', icon: ArticleIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'A keyword in, a 3,000-word article out. It grades itself before handing over.', meta: 'Claude Code skill + subagent · multi-tenant', tags: ['Claude', 'Claude Code'] },
      { title: 'KAPE Reel worker', icon: FilmStripIcon, live: false, icons: [FileJsIcon, WaveformIcon, MicrophoneIcon, PaperPlaneTiltIcon], desc: 'One Telegram message. It scripts, voices, captions, renders, and returns for approval.', meta: 'Node worker · ElevenLabs, Whisper, Remotion', tags: ['Node.js', 'ElevenLabs', 'OpenAI Whisper', 'Telegram'] },
      { title: 'BrewedOps OS roster', icon: UsersThreeIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'Ten specialists, one job each, from GHL audits to client deliverables. Every write is approval-gated.', meta: 'Claude Code subagents · Opus and Sonnet', tags: ['Claude', 'Claude Code'] },
    ],
  },
  {
    name: 'RAG Chatbots', blurb: 'They search real documents first, then answer from what they found.',
    cards: [
      { title: 'Ken AI Bot', icon: ChatCircleIcon, live: true, icons: [SparkleIcon, DatabaseIcon, HashIcon], desc: 'Searches a client team library and live sales figures. Refuses to guess.', meta: 'Claude Sonnet 5 · pgvector similarity search, 5 tools', tags: ['Claude', 'Postgres + pgvector', 'Slack'] },
      { title: 'Kape AI knowledge search', icon: MagnifyingGlassIcon, live: true, icons: [SparkleIcon, BooksIcon], desc: 'Pulls the five best passages from my 1,277-chunk knowledge base, then answers.', meta: 'SQLite FTS5 keyword ranking · Claude Haiku 4.5', tags: ['Claude', 'SQLite FTS5'] },
    ],
  },
  {
    name: 'Chatbots', blurb: 'Shipped inside BrewedOps.com. Each does one job well.',
    cards: [
      { title: 'Workflow Creator', icon: FlowArrowIcon, live: true, icons: [SparkleIcon, TrendUpIcon], desc: 'Describe a GoHighLevel workflow in plain English, get the diagram back.', meta: 'Claude Sonnet 4.6', tags: ['Claude', 'GoHighLevel'] },
      { title: 'Voice Call Tester', icon: PhoneCallIcon, live: true, icons: [SparkleIcon, WaveformIcon], desc: 'Hold a real spoken call with your voice agent before a customer does.', meta: 'Claude Sonnet 4.6 · ElevenLabs speech', tags: ['Claude', 'ElevenLabs'] },
      { title: 'Copy Website', icon: BrowsersIcon, live: true, icons: [SparkleIcon], desc: 'Point it at a page, get an editable rebuild streamed back.', meta: 'Claude Sonnet 4.6 · streaming', tags: ['Claude'] },
    ],
  },
  {
    name: 'Hermes', blurb: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.',
    cards: [
      { title: 'Hermes', icon: ChartBarIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon, ShippingContainerIcon], desc: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.', meta: 'Nous hermes-agent, deployed and extended by me · Docker on my VPS', tags: ['Nous Hermes', 'Telegram', 'Docker'] },
      { title: 'Save-progress watcher', icon: TimerIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon], desc: 'Pings me every fifteen minutes, but only when there is real work to save.', meta: 'Scheduled job · skips the model when nothing changed', tags: ['Nous Hermes', 'Telegram'] },
    ],
  },
]

const DOCS: Record<DocView, Doc> = {
  'build-plan': {
    kicker: 'GOHIGHLEVEL BUILD PLAN',
    title: 'The build plan',
    lede: 'A real automation plan, written out before a single workflow is clicked together.',
    stack: [{ name: 'GoHighLevel', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Notion', icon: NoteIcon }],
    sections: [
      {
        name: 'Before anything is clicked', blurb: 'The part most builds skip.',
        cards: [
          { step: '01', icon: TargetIcon, title: 'Name the outcome', desc: 'One sentence the client agrees with: what should be true after this runs.', meta: 'One outcome per workflow' },
          { step: '02', icon: LightningIcon, title: 'Pin the trigger', desc: 'Exactly what fires it, and every condition that must be false for it not to fire.', meta: 'Trigger + guard conditions' },
          { step: '03', icon: SignOutIcon, title: 'List the exits', desc: 'Every way a contact leaves the flow: converted, disqualified, replied, timed out.', meta: 'No silent dead ends' },
        ],
      },
      {
        name: 'The flow', blurb: 'Four node classes, in order. Everything else is a variation.',
        cards: [
          { step: 'TRIGGER', icon: LightningIcon, title: 'Entry', desc: 'Form, stage change, tag, inbound message, or a scheduled sweep of a smart list.', meta: 'Re-entry off by default' },
          { step: 'WAIT', icon: TimerIcon, title: 'Timing', desc: 'Waits are business hours aware. Nobody gets a 2am SMS because a form fired late.', meta: 'Window: 08:00–19:00 local' },
          { step: 'SCORE?', icon: GitBranchIcon, title: 'Branch', desc: 'One condition per branch, read top to bottom. If it needs three ANDs, it needs its own workflow.', meta: 'Max 3 branches per node' },
          { step: 'CONVERT', icon: CheckCircleIcon, title: 'Action', desc: 'Move the opportunity, send the branded email, notify the owner, write back the result.', meta: 'Every action logged' },
        ],
      },
      {
        name: 'What ships with it', blurb: 'The plan is not done when the workflow runs.',
        cards: [
          { step: '01', icon: TextboxIcon, title: 'Naming convention', desc: 'Numbered prefixes so the workflow list reads as an order of operations, not an inbox.', meta: '01 - Support | New Ticket' },
          { step: '02', icon: ListChecksIcon, title: 'Test matrix', desc: 'Each branch walked with a real test contact before handover, results pasted into the doc.', meta: 'Pass/fail per branch' },
          { step: '03', icon: HandshakeIcon, title: 'Handover doc', desc: 'One page: what it does, what breaks it, who to call. Written for the client, not for me.', meta: 'Delivered with every build' },
        ],
      },
    ],
  },
  'support-desk': {
    kicker: 'GOHIGHLEVEL BLUEPRINT',
    title: 'Support Ticketing System',
    lede: 'A full support desk inside GoHighLevel. One pipeline, five stages, four branded emails.',
    stack: [{ name: 'GoHighLevel', icon: LifebuoyIcon }, { name: 'Email builder', icon: EnvelopeSimpleIcon }, { name: 'Workflows', icon: FlowArrowIcon }],
    sections: [
      {
        name: 'The pipeline', blurb: 'Five stages, and a ticket can only move forward one at a time.',
        cards: [
          { step: '01', icon: TrayIcon, title: 'New', desc: 'Every inbound form, email, or chat lands here with a generated ticket ID.', meta: 'Auto-assigned on create' },
          { step: '02', icon: UserFocusIcon, title: 'Assigned', desc: 'Round-robin to the on-duty owner, with a first-response timer started.', meta: 'First response target: 2h' },
          { step: '03', icon: WrenchIcon, title: 'In progress', desc: 'Owner is working it. Client replies bump the ticket back to the top of the list.', meta: 'Reply detection on inbound' },
          { step: '04', icon: HourglassMediumIcon, title: 'Waiting on client', desc: 'Two nudges, then it auto-closes with a reopen link that puts it back in New.', meta: 'Nudge at 48h and 96h' },
          { step: '05', icon: CheckCircleIcon, title: 'Resolved', desc: 'Closing email goes out, a satisfaction question is attached, the timer stops.', meta: 'CSAT captured at close' },
        ],
      },
      {
        name: 'The four emails', blurb: 'Branded, plain-spoken, and each one tied to a stage change.',
        cards: [
          { step: 'E1', icon: EnvelopeSimpleIcon, title: 'Ticket received', desc: 'Confirms the ID, restates the problem in the client’s own words, sets the response window.', meta: 'Fires on: New' },
          { step: 'E2', icon: UserCircleIcon, title: 'Owner assigned', desc: 'Names a human and how to reach them. No "your ticket is important to us".', meta: 'Fires on: Assigned' },
          { step: 'E3', icon: BellSimpleIcon, title: 'We need you', desc: 'One clear question, one reply-to. Sent at most twice per ticket.', meta: 'Fires on: Waiting on client' },
          { step: 'E4', icon: SealCheckIcon, title: 'Resolved', desc: 'What was done, what changed, and the link that reopens it if it was not fixed.', meta: 'Fires on: Resolved' },
        ],
      },
      {
        name: 'What changed after', blurb: 'Measured against the four weeks before launch.',
        cards: [
          { step: 'RESULT', icon: ClockCountdownIcon, title: 'First response, not first reply', desc: 'The timer starts on create, so a ticket cannot sit unowned over a weekend.', meta: 'Same-day response became the floor' },
          { step: 'RESULT', icon: MagnifyingGlassIcon, title: 'Nothing gets lost', desc: 'Three inboxes collapsed into one pipeline with one ID per issue.', meta: 'One ticket, one thread' },
        ],
      },
    ],
  },
  'agentic-framework': {
    kicker: 'HOW I BUILD WITH AI',
    title: 'The Agentic Framework',
    lede: 'The tools, the rules, and the loop I use to ship apps with AI instead of chatting with it.',
    stack: [{ name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Codex', icon: CodeIcon }, { name: 'Cursor', icon: CursorIcon }],
    sections: [
      {
        name: 'The tools', blurb: 'Each one has a job. I do not use three where one will do.',
        cards: [
          { step: '01', icon: TerminalWindowIcon, title: 'Claude Code', desc: 'The builder. Long tasks, real files, subagents for anything that can run in parallel.', meta: 'Opus for planning, Sonnet for volume' },
          { step: '02', icon: CursorIcon, title: 'Cursor', desc: 'The editor. Where I read what was written and take over when precision beats speed.', meta: 'Human in the loop' },
          { step: '03', icon: CodeIcon, title: 'Codex', desc: 'The second opinion. A fresh model reviewing a diff catches what the author missed.', meta: 'Review pass, not a build pass' },
        ],
      },
      {
        name: 'The rules', blurb: 'Non-negotiable, and they are what keep the output usable.',
        cards: [
          { step: 'R1', icon: FileTextIcon, title: 'Write the spec first', desc: 'If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.', meta: 'Spec before prompt' },
          { step: 'R2', icon: ShieldCheckIcon, title: 'Every write is approval-gated', desc: 'Agents draft. Nothing reaches a client account, a repo, or a send button unreviewed.', meta: 'No autonomous writes' },
          { step: 'R3', icon: ScissorsIcon, title: 'Small units of work', desc: 'One task, one context. A fresh session beats a long one every time.', meta: 'Reset early, reset often' },
          { step: 'R4', icon: ListChecksIcon, title: 'The model grades itself', desc: 'Acceptance criteria go in with the task, and the output is checked against them before I look.', meta: 'Self-review built in' },
        ],
      },
      {
        name: 'The loop', blurb: 'Four steps, repeated until the criteria pass.',
        cards: [
          { step: '01', icon: TargetIcon, title: 'Frame', desc: 'Outcome, constraints, and the files that matter. Nothing else in context.', meta: 'Context is a budget' },
          { step: '02', icon: LightningIcon, title: 'Build', desc: 'Agent works. I do not interrupt mid-task to add requirements.', meta: 'One brief per run' },
          { step: '03', icon: MagnifyingGlassIcon, title: 'Check', desc: 'Run it, read it, and hand the diff to a second model before I trust it.', meta: 'Two-model review' },
          { step: '04', icon: ArrowsClockwiseIcon, title: 'Fold back', desc: 'Whatever went wrong becomes a rule, so the next run does not repeat it.', meta: 'The framework grows' },
        ],
      },
    ],
  },
  'end-to-end': {
    kicker: 'HOW I SHIP, END TO END',
    title: 'The End-to-End Workflow',
    lede: 'Every trigger, node, skill, and agent wired as one live graph — from a form fill to a delivered asset.',
    stack: [{ name: 'GoHighLevel', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Node.js', icon: FileJsIcon }, { name: 'Telegram', icon: PaperPlaneTiltIcon }],
    sections: [
      {
        name: 'Triggers', blurb: 'Where work enters the graph.',
        cards: [
          { step: 'IN', icon: LightningIcon, title: 'Client-side events', desc: 'Form fills, pipeline moves, inbound messages, and booked calls inside GoHighLevel.', meta: 'GoHighLevel workflows' },
          { step: 'IN', icon: PaperPlaneTiltIcon, title: 'A message to me', desc: 'One Telegram line is enough to start a build, a reel, or an audit.', meta: 'Hermes on my VPS' },
          { step: 'IN', icon: TimerIcon, title: 'Schedules', desc: 'Sweeps that check for work rather than waiting to be told there is some.', meta: 'Skips the model when nothing changed' },
        ],
      },
      {
        name: 'Nodes and skills', blurb: 'The middle of the graph, where the actual work happens.',
        cards: [
          { step: '01', icon: FlowArrowIcon, title: 'Automation nodes', desc: 'Waits, branches, and actions inside the client account. Deterministic, logged, reversible.', meta: 'No model in the hot path' },
          { step: '02', icon: PuzzlePieceIcon, title: 'Skills', desc: 'Reusable procedures an agent can load: audit a sub-account, draft an article, cut a reel.', meta: 'Versioned, multi-tenant' },
          { step: '03', icon: UsersThreeIcon, title: 'Agents', desc: 'Ten specialists with one job each. They pick their own tools and finish the task.', meta: 'Claude Code subagents' },
        ],
      },
      {
        name: 'Out', blurb: 'Nothing leaves the graph without a human yes.',
        cards: [
          { step: 'OUT', icon: ShieldCheckIcon, title: 'Approval gate', desc: 'The deliverable comes back for review before it reaches a client, a repo, or a send button.', meta: 'Approve or send back with a note' },
          { step: 'OUT', icon: PackageIcon, title: 'Delivery', desc: 'Article, reel, workflow, or report — handed over with the doc that explains it.', meta: 'Same handover doc every time' },
          { step: 'OUT', icon: ChartBarIcon, title: 'Write-back', desc: 'The result lands back on the contact record, so the next run knows what already happened.', meta: 'One source of truth' },
        ],
      },
    ],
  },
}

const WRITEUPS: Writeup[] = [
  { view: 'support-desk', kicker: 'GOHIGHLEVEL BLUEPRINT', title: 'Support Ticketing System', desc: 'A full support desk inside GoHighLevel. One pipeline, five stages, four branded emails.', icon: LifebuoyIcon, cue: 'READ THE WRITE-UP' },
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', icon: BrainIcon, cue: 'READ THE FRAMEWORK' },
  { view: 'end-to-end', kicker: 'HOW I SHIP, END TO END', title: 'The End-to-End Workflow', desc: 'Every trigger, node, skill and agent wired as one live graph.', icon: GraphIcon, cue: 'READ THE WORKFLOW' },
]

export const projects = {
  title: ['Real builds you', 'can open.'] as const,
  lede: 'Everything here shipped. Open a card to read the problem, the system behind it, and what changed after.',
  nudge: 'CLICK A CARD TO OPEN IT',
  close: 'Close',
  builtWith: 'BUILT WITH',
  live: 'LIVE',
  internal: 'INTERNAL',
  cards: {
    reel: {
      title: 'Automations', icon: FlowArrowIcon, cue: 'VIEW THE REEL', cta: 'OPEN THE REEL',
      body: 'Real screens from the GoHighLevel workflows I build.',
      peek: ['PLACEHOLDER - workflow screen behind (Automations card)', 'PLACEHOLDER - workflow screen in front (Automations card)'],
      peekHint: 'Workflow screen',
    },
    plan: {
      title: 'The build plan', icon: BlueprintIcon, cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'GOHIGHLEVEL BUILD PLAN', heading: 'The full automation blueprint.',
      steps: ['Trigger', 'Wait', 'Score?', 'Convert'],
    },
    sites: {
      title: 'Funnels and sites', icon: BrowsersIcon, cue: 'VIEW THE SITES', cta: 'SPIN THE CAROUSEL',
      body: 'Complete funnel builds and websites. Spin the reel.',
      fanHint: 'Site',
    },
    agents: {
      title: 'AI agents and RAG chatbots', icon: RobotIcon, cue: 'VIEW THE AGENTS', cta: 'SEE EVERY SYSTEM',
      body: 'Retrieval chatbots and task agents wired to real data.',
      chips: [
        { name: 'KapeSEO', icon: MagnifyingGlassIcon },
        { name: 'KAPE Reel worker', icon: FilmStripIcon },
        { name: 'Kape AI knowledge search', icon: BooksIcon },
        { name: 'KapeAI', icon: SparkleIcon },
        { name: 'Watcher', icon: EyeIcon },
      ] satisfies Chip[],
    },
  },
  writeups: WRITEUPS,
  reel: {
    label: 'Workflow screens', kicker: 'AUTOMATIONS · WORKFLOW REEL', hint: 'HOVER TO PAUSE',
    /** Kraft's default reel pace (the board's marqueeSeconds prop). */
    seconds: 20,
    slotHint: 'Drop a workflow screenshot · 16:10',
    shots: REEL,
  },
  sitesView: { label: 'Funnels and sites', kicker: 'FUNNELS AND SITES', slotHint: 'Drop a site screenshot', sites: SITES },
  agentsView: {
    title: 'AI agents and RAG chatbots',
    kicker: 'AI AGENTS AND RAG CHATBOTS',
    lede: 'I design, build, and run every system below. Most are in daily use.',
    builtWith: [
      { name: 'Claude Code', icon: TerminalWindowIcon },
      { name: 'Codex', icon: CodeIcon },
      { name: 'Cursor', icon: CursorIcon },
      { name: 'Hermes', icon: ShieldCheckIcon },
    ] satisfies Chip[],
    groups: GROUPS,
  },
  docs: DOCS,
}
```

- [ ] **Step 4: Write the windows**

Create `components/projects/Window.tsx`:

```tsx
import type { ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Chip } from '@/data/projects'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode }

/**
 * Kraft's document window (Kraft Projects Board.dc.html:190-238): traffic
 * lights, the title in an address field, Close, and a scrolling body. The
 * browser focuses Close when it opens.
 */
export default function Window({ open, onClose, title, children }: Props) {
  return (
    <ViewDialog open={open} onClose={onClose} label={title} className="view--window">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
        <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
          <span className="mx-2 min-w-0 flex-1 truncate rounded-[7px] border border-b1 bg-s1 px-3 py-1.5 text-[12.5px] text-ink2">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={projects.close}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover"
          >
            <XIcon size={17} aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[30px] overflow-y-auto overscroll-contain p-[clamp(16px,2.2vw,30px)]">
          {children}
        </div>
      </div>
    </ViewDialog>
  )
}

/** The window's opening panel: kicker, the lede as its heading, and what it was built with. */
export function WindowHero({ kicker, lede, stack }: { kicker: string; lede: string; stack: Chip[] }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-b1 bg-[radial-gradient(120%_140%_at_8%_-20%,rgba(var(--amb),.5),rgba(var(--amb),0)_60%),linear-gradient(180deg,var(--s1),var(--s2))] p-[clamp(18px,2vw,28px)]">
      <div className="flex min-w-[260px] flex-[1_1_360px] flex-col gap-2.5">
        <span className="font-mono text-[10.5px] tracking-[.18em] text-accent">{kicker}</span>
        <h2 className="text-[clamp(19px,2.2vw,27px)] leading-[1.24] font-semibold tracking-[-.03em]">{lede}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-[9px]">
        <span className="mr-1 font-mono text-[10px] tracking-[.16em] text-ink3">{projects.builtWith}</span>
        {stack.map((b) => (
          <span key={b.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-[15px] py-[9px] text-[13.5px] font-medium">
            <b.icon size={15} aria-hidden className="text-accent" />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A titled group of cards inside a window. */
export function WindowSection({ name, blurb, children }: { name: string; blurb: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h3 className="text-[17px] font-semibold tracking-[-.02em]">{name}</h3>
        <span className="text-[13px] text-ink3">{blurb}</span>
      </div>
      <div className="flex flex-wrap gap-3.5">{children}</div>
    </section>
  )
}
```

Create `components/projects/DocView.tsx`:

```tsx
import type { Doc } from '@/data/projects'
import Window, { WindowHero, WindowSection } from './Window'

/** One write-up (Kraft Projects Board.dc.html:190-238; DOCS at :375-509). */
export default function DocView({ doc, open, onClose }: { doc: Doc; open: boolean; onClose: () => void }) {
  return (
    <Window open={open} onClose={onClose} title={doc.title}>
      <WindowHero kicker={doc.kicker} lede={doc.lede} stack={doc.stack} />
      {doc.sections.map((s) => (
        <WindowSection key={s.name} name={s.name} blurb={s.blurb}>
          {s.cards.map((c) => (
            <article key={c.title} className="flex min-w-[240px] flex-[1_1_280px] flex-col gap-[9px] rounded-2xl border border-b1 bg-linear-to-b from-s1 to-s2 p-4">
              <div className="flex items-center gap-2.5">
                <span aria-hidden className="grid size-[34px] place-items-center rounded-[10px] border border-b1 bg-chip">
                  <c.icon size={17} className="text-accent" />
                </span>
                <span className="ml-auto font-mono text-[9.5px] tracking-[.14em] text-ink3">{c.step}</span>
              </div>
              <h4 className="text-[15px] font-semibold tracking-[-.02em]">{c.title}</h4>
              <p className="text-[13px] leading-normal text-ink2">{c.desc}</p>
              <span className="mt-auto pt-1.5 font-mono text-[11px] leading-[1.45] text-ink3">{c.meta}</span>
            </article>
          ))}
        </WindowSection>
      ))}
    </Window>
  )
}
```

Create `components/projects/AgentsView.tsx`:

```tsx
import { projects } from '@/data/projects'
import Window, { WindowHero, WindowSection } from './Window'

/** Every AI system, grouped, with its live or internal status (Kraft Projects Board.dc.html:132-188; GROUPS at :336-373). */
export default function AgentsView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const a = projects.agentsView
  return (
    <Window open={open} onClose={onClose} title={a.title}>
      <WindowHero kicker={a.kicker} lede={a.lede} stack={a.builtWith} />
      {a.groups.map((g) => (
        <WindowSection key={g.name} name={g.name} blurb={g.blurb}>
          {g.cards.map((c) => (
            <article key={c.title} className="flex min-w-[240px] flex-[0_1_280px] flex-col gap-[9px] rounded-2xl border border-b1 bg-linear-to-b from-s1 to-s2 p-4">
              <div className="flex items-center gap-2">
                {c.icons.map((Tool, i) => (
                  <span key={`${c.title}-${i}`} aria-hidden className="grid size-[34px] place-items-center rounded-[10px] border border-b1 bg-chip">
                    <Tool size={17} className="text-accent" />
                  </span>
                ))}
                <span
                  className={`ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-[5px] font-mono text-[9.5px] tracking-[.1em] ${c.live ? 'bg-wash text-accent' : 'bg-chip text-ink3'}`}
                >
                  <span aria-hidden className={`size-1.5 rounded-full ${c.live ? 'bg-accent' : 'bg-ink3'}`} />
                  {c.live ? projects.live : projects.internal}
                </span>
              </div>
              <h4 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-.02em]">
                <c.icon size={16} aria-hidden className="text-accent" />
                {c.title}
              </h4>
              <p className="text-[13px] leading-normal text-ink2">{c.desc}</p>
              <span className="text-xs leading-[1.45] text-ink3">{c.meta}</span>
              <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
                {c.tags.map((t) => (
                  <span key={t} className="rounded-full border border-b1 bg-chip px-[9px] py-1 text-[11.5px] text-ink2">
                    {t}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </WindowSection>
      ))}
    </Window>
  )
}
```

Create `components/projects/ProjectViews.tsx`:

```tsx
'use client'

import { useHashView } from '@/hooks/useHashView'
import { DOC_VIEWS, PROJECT_VIEWS, projects } from '@/data/projects'
import AgentsView from './AgentsView'
import DocView from './DocView'

/**
 * Every sub-view of the board, mounted closed so its content is in the
 * pre-rendered HTML. The URL hash picks the open one (/projects#build-plan).
 */
export default function ProjectViews() {
  const { view, close } = useHashView(PROJECT_VIEWS)
  return (
    <>
      {DOC_VIEWS.map((id) => (
        <DocView key={id} doc={projects.docs[id]} open={view === id} onClose={close} />
      ))}
      <AgentsView open={view === 'ai-agents'} onClose={close} />
    </>
  )
}
```

- [ ] **Step 5: Write the board**

Append to `app/globals.css`:

```css
/* Projects board (Kraft Projects Board.dc.html:44-46): the "click a card" pill bobs on the frame's top edge. */
@keyframes pbNudge{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
```

In `app/globals.css`, inside `@theme { … }`, after the `--animate-marquee` line, add:

```css
  --animate-nudge: pbNudge 3.2s ease-in-out infinite;
```

Create `components/projects/Board.tsx`:

```tsx
'use client'

import { useRef, useState, type PointerEvent } from 'react'
import { ArrowUpRightIcon, ArrowsClockwiseIcon, HandPointingIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import Shot from '@/components/ui/Shot'
import { projects } from '@/data/projects'
import { prefersReducedMotion } from '@/lib/motion'

const CARD =
  'relative flex flex-col gap-2.5 overflow-hidden rounded-[20px] border border-b1 bg-linear-to-b from-s1 to-s2 p-5 text-left text-ink transition-[translate,scale,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:from-s2 hover:to-hover hover:shadow-[0_28px_64px_-30px_var(--washB)] active:scale-[.988]'
const TILE = 'grid size-[38px] place-items-center rounded-xl border border-b1 bg-chip'
const TITLE = 'text-[clamp(17px,2cqw,22px)] font-semibold tracking-[-.025em]'
const BODY = 'text-[13px] leading-[1.55] text-ink3'
const CTA = 'flex items-center gap-[7px] font-mono text-[10px] tracking-[.12em] text-accent'
const GAP = 'gap-[clamp(11px,1.3cqw,18px)]'

/** Kraft's fan of site tiles on the Funnels card (Kraft Projects Board.dc.html:110-114); index 2 is the front tile. */
const FAN = [
  'translateX(-50%) translateX(-112px) translateY(26px) rotate(-26deg)',
  'translateX(-50%) translateX(-58px) translateY(7px) rotate(-13deg)',
  'translateX(-50%) rotate(0deg)',
  'translateX(-50%) translateX(58px) translateY(7px) rotate(13deg)',
  'translateX(-50%) translateX(112px) translateY(26px) rotate(26deg)',
]

/**
 * The Projects board (Kraft Projects Board.dc.html:43-130). Every card is a
 * link to its sub-view's hash, so it opens in place, can be opened in a new
 * tab, and Back closes it. One label follows the pointer and names the
 * action of the card under it (data-case). There is none on touch or with
 * reduced motion.
 */
export default function Board() {
  const c = projects.cards
  const cue = useRef<HTMLDivElement>(null)
  const [label, setLabel] = useState('')

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || prefersReducedMotion()) return
    const box = e.currentTarget.getBoundingClientRect()
    const hit = (e.target as Element).closest<HTMLElement>('[data-case]')
    setLabel(hit?.dataset.case ?? '')
    cue.current?.style.setProperty(
      'transform',
      `translate3d(${e.clientX - box.left + 16}px,${e.clientY - box.top + 16}px,0)`,
    )
  }

  return (
    <div className="relative" onPointerMove={track} onPointerLeave={() => setLabel('')}>
      <Frame lit={{ x: '18%', alpha: 0.4, stop: '58%', from: 's2' }} className={`relative flex flex-col ${GAP} p-[clamp(11px,1.3cqw,18px)]`}>
        <div className="absolute top-0 left-1/2 z-2 -translate-x-1/2 -translate-y-1/2">
          <span className="flex animate-nudge items-center gap-2 rounded-full border border-b1 bg-s1 px-3.5 py-2 font-mono text-[10.5px] tracking-[.14em] whitespace-nowrap text-ink2 shadow-[0_8px_24px_-16px_var(--washB)]">
            <HandPointingIcon size={14} aria-hidden className="text-accent" />
            {projects.nudge}
          </span>
        </div>

        <div className={`flex flex-wrap ${GAP}`}>
          <a href="#reel" data-case={c.reel.cue} className={`${CARD} min-w-[270px] flex-[3_1_420px]`}>
            <span aria-hidden className={TILE}>
              <c.reel.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.reel.title}</h2>
            <p className={`${BODY} max-w-[340px]`}>{c.reel.body}</p>
            <span className={CTA}>
              {c.reel.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
            <div aria-hidden className="relative mt-1.5 -mr-5 -mb-5 h-[clamp(150px,17cqw,220px)]">
              <div className="absolute top-[-10px] left-[18%] h-[64%] w-[78%] overflow-hidden rounded-t-xl border border-b-0 border-b1 bg-s0 opacity-50">
                <Shot src={c.reel.peek[0]} hint={c.reel.peekHint} />
              </div>
              <div className="absolute top-9 right-[-8px] bottom-[-14px] left-[30%] overflow-hidden rounded-xl border border-b2 bg-s0 shadow-(--peek-shadow)">
                <Shot src={c.reel.peek[1]} hint={c.reel.peekHint} />
              </div>
            </div>
          </a>

          <a href="#build-plan" data-case={c.plan.cue} className={`${CARD} min-w-[250px] flex-[2_1_300px]`}>
            <span aria-hidden className={TILE}>
              <c.plan.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.plan.title}</h2>
            <p className={BODY}>{c.plan.body}</p>
            <div className="mt-auto flex flex-col gap-3 rounded-[14px] border border-b1 bg-s0 p-4">
              <span className="font-mono text-[9.5px] tracking-[.14em] text-ink3">{c.plan.kicker}</span>
              <span className="text-[15px] font-semibold tracking-[-.02em]">{c.plan.heading}</span>
              <div className="flex flex-wrap gap-1.5">
                {c.plan.steps.map((s, i) => (
                  <span
                    key={s}
                    className={`rounded-lg border px-2.5 py-[5px] text-[11.5px] font-medium ${i === c.plan.steps.length - 1 ? 'border-accent bg-accent text-on-accent' : 'border-b1 bg-s1 text-ink2'}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div aria-hidden className="flex flex-col gap-[7px]">
                <span className="h-[5px] rounded-full bg-hover" />
                <span className="h-[5px] w-[72%] rounded-full bg-hover" />
              </div>
            </div>
          </a>

          <div className="flex min-w-[250px] flex-[2_1_300px] flex-col gap-[clamp(8px,1cqw,12px)]">
            {projects.writeups.map((w) => (
              <a
                key={w.view}
                href={`#${w.view}`}
                data-case={w.cue}
                className="flex flex-1 items-start gap-3 rounded-[18px] border border-b1 bg-linear-to-b from-s1 to-s2 p-4 text-left text-ink transition-[translate,border-color,box-shadow] duration-350 hover:-translate-y-0.5 hover:border-b2 hover:from-s2 hover:to-hover hover:shadow-[0_22px_50px_-32px_var(--washB)]"
              >
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-b1 bg-chip">
                  <w.icon size={17} className="text-accent" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-mono text-[9px] tracking-[.14em] text-accent">{w.kicker}</span>
                  <h2 className="text-[14.5px] font-semibold tracking-[-.02em]">{w.title}</h2>
                  <p className="text-xs leading-normal text-ink3">{w.desc}</p>
                </div>
                <span aria-hidden className="ml-auto grid size-7 shrink-0 place-items-center rounded-[9px] border border-b1 text-ink3">
                  <ArrowUpRightIcon size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>

        <div className={`flex flex-wrap ${GAP}`}>
          <a href="#sites" data-case={c.sites.cue} className={`${CARD} min-w-[260px] flex-[2_1_320px]`}>
            <span aria-hidden className={TILE}>
              <c.sites.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.sites.title}</h2>
            <p className={BODY}>{c.sites.body}</p>
            <span className={CTA}>
              {c.sites.cta} <ArrowsClockwiseIcon size={13} aria-hidden />
            </span>
            <div aria-hidden className="relative mt-2.5 h-[clamp(150px,16cqw,200px)] overflow-hidden">
              {FAN.map((transform, i) => (
                <div
                  key={transform}
                  style={{ transform }}
                  className={`absolute left-1/2 aspect-[3/4] h-[84%] origin-bottom overflow-hidden rounded-[11px] border bg-s0 ${i === 2 ? 'bottom-4 border-b2 shadow-(--peek-shadow)' : 'bottom-1 border-b1 shadow-(--tile-shadow)'}`}
                >
                  <Shot src={projects.sitesView.sites[i].shot} hint={c.sites.fanHint} />
                </div>
              ))}
            </div>
          </a>

          <a href="#ai-agents" data-case={c.agents.cue} className={`${CARD} min-w-[270px] flex-[3_1_380px]`}>
            <span aria-hidden className={TILE}>
              <c.agents.icon size={20} className="text-accent" />
            </span>
            <h2 className={TITLE}>{c.agents.title}</h2>
            <p className={`${BODY} max-w-[420px]`}>{c.agents.body}</p>
            <div className="mt-auto flex flex-wrap gap-2 pt-3.5">
              {c.agents.chips.map((a) => (
                <span key={a.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-3 py-2 text-[12.5px] text-ink2">
                  <a.icon size={14} aria-hidden className="text-ink3" />
                  {a.name}
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                </span>
              ))}
            </div>
            <span className={CTA}>
              {c.agents.cta} <ArrowUpRightIcon size={13} aria-hidden />
            </span>
          </a>
        </div>
      </Frame>

      <div
        ref={cue}
        aria-hidden
        className={`pointer-events-none absolute top-0 left-0 z-30 transition-[transform,opacity] duration-100 ease-linear ${label ? 'opacity-100' : 'opacity-0'}`}
      >
        {label && (
          <span className="flex items-center gap-[7px] rounded-full bg-accent px-3 py-[7px] font-mono text-[10px] tracking-[.12em] whitespace-nowrap text-on-accent shadow-[0_14px_34px_-16px_var(--glow)]">
            <ArrowUpRightIcon size={12} />
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: The Projects page**

Replace `app/(site)/projects/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Board from '@/components/projects/Board'
import ProjectViews from '@/components/projects/ProjectViews'
import PageHeader from '@/components/ui/PageHeader'
import { projects } from '@/data/projects'

export const metadata: Metadata = { title: 'Projects' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(16px,2cqw,28px)]">
      <PageHeader href="/projects" title={projects.title} lede={projects.lede} className="max-w-[1100px]" ledeClassName="max-w-[810px]" />
      <Board />
      <ProjectViews />
    </section>
  )
}
```

- [ ] **Step 7: Run the unit test to verify it passes**

Run: `npx vitest run tests/projects.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 8: Write the e2e and update the shell test**

In `e2e/shell.spec.ts`, the sidebar test asserts the placeholder heading. Change:

```ts
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
```

to:

```ts
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
```

Create `e2e/projects.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('a board card opens its write-up, and Back closes it', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^The build plan/ })
  await card.click()
  await expect(page).toHaveURL(/\/projects#build-plan$/)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await expect(view.getByRole('button', { name: 'Close' })).toBeFocused()
  await page.goBack()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(card).toBeFocused()
})

test('a shared link opens the view; Close stays on the page', async ({ page }) => {
  await page.goto('/projects#support-desk')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Support Ticketing System' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
})

test('Escape closes a view and focus returns to its card', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^AI agents and RAG chatbots/ })
  await card.focus()
  await page.keyboard.press('Enter')
  const view = page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })
  await expect(view).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(card).toBeFocused()
})

test('the page behind an open view does not scroll', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  const panel = page.locator('#main-content')
  await page.getByRole('link', { name: /^AI agents and RAG chatbots/ }).click()
  await expect(page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })).toBeVisible()
  const before = await panel.evaluate((el) => el.scrollTop)
  await page.mouse.move(720, 450)
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600)
  await page.waitForTimeout(400)
  expect(await panel.evaluate((el) => el.scrollTop)).toBe(before)
})

test('the cursor cue names the card under the pointer', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).hover()
  await expect(page.getByText('VIEW THE PLAN', { exact: true })).toBeVisible()
})
```

- [ ] **Step 9: Run the e2e**

Run: `npx playwright test e2e/projects.spec.ts e2e/shell.spec.ts --project=desktop`
Expected: PASS.

- [ ] **Step 10: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add data/projects.ts components/projects "app/(site)/projects/page.tsx" app/globals.css tests/projects.test.tsx e2e/projects.spec.ts e2e/shell.spec.ts
git commit -m "feat: Projects board with the build plan, write-ups and systems windows, each linkable by hash

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Projects — the workflow reel and the sites view

**Files:**
- Create: `components/projects/StageBar.tsx`, `components/projects/ReelView.tsx`, `components/projects/SitesView.tsx`
- Modify: `components/projects/ProjectViews.tsx`, `app/globals.css`, `tests/projects.test.tsx`, `e2e/projects.spec.ts`
- Test: `tests/project-stage.test.tsx`

**Interfaces:**
- Consumes: `ViewDialog` (clicks on `data-backdrop` close it), `Shot`, and `projects.reel` / `projects.sitesView` (Task 3)
- Produces:
  - `.reel` (the stage) and `.reel-row` (the marching row, reading `--marq`)
  - `StageBar({ kicker, hint?, onClose })`

- [ ] **Step 1: Write the failing test**

Create `tests/project-stage.test.tsx`:

```tsx
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'

describe('Projects stage views', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))

  it("loops the reel with a hidden copy, at Kraft's pace", () => {
    window.history.replaceState(null, '', '/projects#reel')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Workflow screens' })
    const figures = view.querySelectorAll('figure')
    expect(figures).toHaveLength(10)
    expect(view.querySelectorAll('figure[aria-hidden="true"]')).toHaveLength(5)
    expect(within(figures[0] as HTMLElement).getByText('01 - Support | New Ticket')).toBeInTheDocument()
    expect((view.querySelector('.reel-row') as HTMLElement).style.getPropertyValue('--marq')).toBe('20s')
  })

  it('closes when the empty stage around the reel is clicked', () => {
    window.history.replaceState(null, '', '/projects#reel')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Workflow screens' })
    fireEvent.click(view.querySelector('.reel') as HTMLElement)
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })

  it('lists the eight sample sites by name', () => {
    window.history.replaceState(null, '', '/projects#sites')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Funnels and sites' })
    expect(within(view).getAllByRole('listitem')).toHaveLength(8)
    expect([...view.querySelectorAll('li > span.font-mono')].map((s) => s.textContent)).toEqual([
      'Apex Build Co.', 'Blade Studio', 'Below Ground', 'Baptiste', 'One Hour Therapy', 'Trusted Mover', 'Payline', 'Solar Field',
    ])
  })
})
```

In `tests/projects.test.tsx`, the pre-render test counts Task 3's dialogs. Change:

```tsx
    expect(dialogs).toHaveLength(DOC_VIEWS.length + 1)
```

to:

```tsx
    expect(dialogs).toHaveLength(PROJECT_VIEWS.length)
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/project-stage.test.tsx tests/projects.test.tsx`
Expected: FAIL. No dialog is named "Workflow screens", and the dialog count is 5, not 7.

- [ ] **Step 3: Add the reel CSS**

Append to `app/globals.css`:

```css
/* Kraft's workflow reel (Kraft Projects Board.dc.html:250): the doubled row
   marches left; hovering or focusing it pauses it. With reduced motion it
   stands still and the stage scrolls by hand. */
.reel-row{animation:kMarquee var(--marq,20s) linear infinite}
.reel-row:hover,.reel-row:focus-within{animation-play-state:paused}
@media (prefers-reduced-motion:reduce){.reel{overflow-x:auto}.reel-row{animation:none}}
html[data-a11y-motion=true] .reel{overflow-x:auto}
html[data-a11y-motion=true] .reel-row{animation:none}
```

- [ ] **Step 4: Write the stage views**

Create `components/projects/StageBar.tsx`:

```tsx
import { XIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'

/** The strip across the top of a dark-stage view (Kraft Projects Board.dc.html:244-248, 270-273). */
export default function StageBar({ kicker, hint, onClose }: { kicker: string; hint?: string; onClose: () => void }) {
  return (
    <div className="relative flex items-center gap-3 px-5 py-4 text-veil-ink">
      <span className="font-mono text-[10.5px] tracking-[.16em] opacity-70">{kicker}</span>
      {hint && <span className="font-mono text-[10.5px] tracking-[.16em] opacity-45 max-shell:hidden">{hint}</span>}
      <button
        type="button"
        onClick={onClose}
        aria-label={projects.close}
        className="ml-auto grid size-11 cursor-pointer place-items-center rounded-xl border border-veil-line bg-veil-chip text-veil-ink transition-colors duration-200 hover:bg-veil-chip-hover"
      >
        <XIcon size={18} aria-hidden />
      </button>
    </div>
  )
}
```

Create `components/projects/ReelView.tsx`:

```tsx
import type { CSSProperties } from 'react'
import Shot from '@/components/ui/Shot'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects } from '@/data/projects'
import StageBar from './StageBar'

/**
 * Kraft's workflow reel (Kraft Projects Board.dc.html:241-265): screenshots
 * marching past on a dimmed stage. The row is drawn twice for a seamless
 * loop, and the copy is hidden from assistive tech. A click on the empty
 * stage closes it, as Kraft's scrim did.
 */
export default function ReelView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const r = projects.reel
  const loop = [...r.shots, ...r.shots]
  return (
    <ViewDialog open={open} onClose={onClose} label={r.label} className="view--stage">
      <StageBar kicker={r.kicker} hint={r.hint} onClose={onClose} />
      <div data-backdrop className="reel relative flex min-h-0 flex-1 items-center overflow-hidden">
        <div data-backdrop className="reel-row flex h-full w-max items-center gap-7 px-3.5" style={{ '--marq': `${r.seconds}s` } as CSSProperties}>
          {loop.map((s, i) => (
            <figure
              key={`${s.label}-${i}`}
              aria-hidden={i >= r.shots.length || undefined}
              className="m-0 flex h-[min(72%,580px)] w-[min(72vw,860px)] shrink-0 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--shot-shadow)"
            >
              <figcaption className="flex items-center gap-[7px] border-b border-b1 bg-s0 px-3.5 py-2.5">
                <span aria-hidden className="size-2.5 rounded-full bg-mac-r" />
                <span aria-hidden className="size-2.5 rounded-full bg-mac-y" />
                <span aria-hidden className="size-2.5 rounded-full bg-mac-g" />
                <span className="ml-2.5 font-mono text-[10.5px] text-ink3">{s.label}</span>
              </figcaption>
              <div className="relative min-h-0 flex-1 bg-s1">
                <Shot src={s.src} hint={r.slotHint} alt={s.label} sizes="72vw" />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </ViewDialog>
  )
}
```

Create `components/projects/SitesView.tsx`:

```tsx
import Shot from '@/components/ui/Shot'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects } from '@/data/projects'
import StageBar from './StageBar'

/**
 * Funnels and sites. Phase 4 puts Kraft's spinning drum and the live preview
 * here. Until then the sites sit in a plain grid, the same list the drum
 * keeps for keyboard and screen-reader users (spec §11).
 */
export default function SitesView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = projects.sitesView
  return (
    <ViewDialog open={open} onClose={onClose} label={s.label} className="view--stage">
      <StageBar kicker={s.kicker} onClose={onClose} />
      <div data-backdrop className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
        <ul data-backdrop className="mx-auto grid max-w-[1100px] grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-4">
          {s.sites.map((site) => (
            <li key={site.file} className="relative aspect-[3/4] overflow-hidden rounded-[14px] border border-b2 bg-s1 shadow-(--shot-shadow)">
              <Shot src={site.shot} hint={s.slotHint} alt={site.name} sizes="200px" />
              <span className="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-veil-deep px-[11px] py-[9px] font-mono text-[10px] tracking-[.1em] text-veil-ink">
                {site.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ViewDialog>
  )
}
```

In `components/projects/ProjectViews.tsx`, import the two views:

```tsx
import ReelView from './ReelView'
import SitesView from './SitesView'
```

Render them after `<AgentsView … />`:

```tsx
      <ReelView open={view === 'reel'} onClose={close} />
      <SitesView open={view === 'sites'} onClose={close} />
```

- [ ] **Step 5: Run the unit tests to verify they pass**

Run: `npx vitest run tests/project-stage.test.tsx tests/projects.test.tsx`
Expected: PASS.

- [ ] **Step 6: Add the e2e**

Append to `e2e/projects.spec.ts`:

```ts
test('the reel marches, and pauses under the pointer', async ({ page }) => {
  await page.goto('/projects#reel')
  await hydrated(page)
  await expect(page.getByRole('dialog', { name: 'Workflow screens' })).toBeVisible()
  const row = page.locator('.reel-row')
  expect(await row.evaluate((el) => el.getAnimations()[0]?.playState)).toBe('running')
  await page.locator('.reel-row figure').first().hover()
  await expect.poll(() => row.evaluate((el) => el.getAnimations()[0]?.playState)).toBe('paused')
})

test('the sites view lists every sample site', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^Funnels and sites/ }).click()
  await expect(page.getByRole('dialog', { name: 'Funnels and sites' }).getByRole('listitem')).toHaveCount(8)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the reel stands still and scrolls by hand', async ({ page }) => {
    await page.goto('/projects#reel')
    await hydrated(page)
    await expect(page.getByRole('dialog', { name: 'Workflow screens' })).toBeVisible()
    await expect(page.locator('.reel')).toHaveCSS('overflow-x', 'auto')
    expect(await page.locator('.reel-row').evaluate((el) => el.getAnimations().length)).toBe(0)
  })
})
```

- [ ] **Step 7: Run the e2e**

Run: `npx playwright test e2e/projects.spec.ts --project=desktop`
Expected: PASS (8 tests).

- [ ] **Step 8: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add components/projects app/globals.css tests/project-stage.test.tsx tests/projects.test.tsx e2e/projects.spec.ts
git commit -m "feat: workflow reel (marches, pauses on hover, still with reduced motion) and the sample sites view

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Services — the Kraft Method and the six offers

**Files:**
- Create: `components/services/Method.tsx`, `components/services/Offers.tsx`, `e2e/services.spec.ts`
- Modify: `data/services.ts`, `app/(site)/services/page.tsx`, `app/globals.css`
- Test: `tests/services.test.tsx`

**Interfaces:**
- Consumes:
  - `SERVICES`, `brandIcon`
  - `PageHeader`, `Frame`, `CARD`, `TAG`, `BADGE`, `ICON_TILE` (Task 1)
  - `prefersReducedMotion`
- Produces:
  - `servicesPage`: `{ title, lede, method: { id: 'method', label, kicker, title, body }, offers: { id: 'offers', label, title, aside }, automation: { id: 'automation', label, kicker, live, prev, next } }`
  - `type Step = { n; key; name; icon: Icon; line; items: string[] }`, `PROCESS: Step[]`, `METHOD_MS = 1700`
  - Section ids `#method` and `#offers`, carrying `scroll-mt-[88px]`
  - `.method-step[data-on]` (the lit gate)

- [ ] **Step 1: Write the failing test**

Create `tests/services.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import { METHOD_MS, PROCESS } from '@/data/services'
import { installMatchMedia } from '@/test/matchMedia'

const lit = () => document.querySelector('.method-step[data-on] h3')?.textContent

describe('Method', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("walks Kraft's five gates one at a time, in order, and wraps", () => {
    render(<Method />)
    expect(PROCESS.map((s) => s.name)).toEqual(['Kickoff', 'Research', 'Architect', 'Form', 'Transform'])
    expect(lit()).toBe('Kickoff')
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Research')
    act(() => vi.advanceTimersByTime(METHOD_MS * 4))
    expect(lit()).toBe('Kickoff')
    expect(document.querySelectorAll('.method-step[data-on]')).toHaveLength(1)
  })

  it('holds the first gate with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Method />)
    act(() => vi.advanceTimersByTime(METHOD_MS * 3))
    expect(lit()).toBe('Kickoff')
  })

  it('is the #method section ⌘K lands on', () => {
    render(<Method />)
    const section = document.getElementById('method')!
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent('Kickoff · Research Architect · Form · Transform')
    expect(section).toHaveClass('scroll-mt-[88px]')
  })
})

describe('Offers', () => {
  it("lists Kraft's six offers with logos, number, badge, bullets and tags", () => {
    render(<Offers />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(6)
    const first = within(cards[0])
    expect(first.getByRole('heading', { level: 3 })).toHaveTextContent('Full-Stack Web & SaaS')
    expect(first.getByText('01 / 06')).toBeInTheDocument()
    expect(first.getByText('BUILT TO LAST')).toBeInTheDocument()
    expect(first.getByRole('img', { name: 'PostgreSQL' })).toBeInTheDocument()
    expect(first.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 2, name: 'What I can do for you' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/services.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/services/Method'".

- [ ] **Step 3: Add the Services page data**

Append to `data/services.ts` (keep `SERVICES` as it is). Add these Phosphor imports to the existing import list: `ArrowsClockwiseIcon`, `FlagPennantIcon`, `MagnifyingGlassIcon`, `PenNibIcon`, `TreeStructureIcon`.

```ts
/** Services page copy, verbatim (KraftScreens.dc.html:209-324). The labels name the sections in ⌘K. */
export const servicesPage = {
  title: ['Apps, agents and the', 'automation between them.'] as const,
  lede: 'What I build, how it works, and what you get at the end of it.',
  method: {
    id: 'method',
    label: 'The Kraft Method',
    kicker: 'THE KRAFT METHOD',
    title: ['Kickoff · Research', 'Architect · Form · Transform'] as const,
    body: 'Five steps, always in that order. Every letter is a gate — nothing moves forward until the one before it is answered.',
  },
  offers: { id: 'offers', label: 'What I can do for you', title: 'What I can do for you', aside: 'Pick one, or stack a few.' },
  automation: {
    id: 'automation',
    label: 'Live automation',
    kicker: 'LIVE AUTOMATION',
    live: 'LIVE',
    prev: 'Previous automation',
    next: 'Next automation',
  },
}

/** How long each gate of the Kraft Method stays lit (KraftScreens.dc.html:620). */
export const METHOD_MS = 1700

export type Step = { n: string; key: string; name: string; icon: Icon; line: string; items: string[] }

/** The Kraft Method, verbatim (KraftScreens.dc.html:622-628). */
export const PROCESS: Step[] = [
  { n: 'K', key: '01', name: 'Kickoff', icon: FlagPennantIcon, line: 'Understand your goals, requirements, constraints and what success actually looks like.', items: ['Goals', 'Constraints', 'Success criteria'] },
  { n: 'R', key: '02', name: 'Research', icon: MagnifyingGlassIcon, line: 'Investigate the users, the existing systems, the technical options and the risks.', items: ['Users', 'Systems', 'Risks'] },
  { n: 'A', key: '03', name: 'Architect', icon: TreeStructureIcon, line: 'Design the architecture, data models, workflows, integrations and technical foundation.', items: ['Data model', 'Workflows', 'Integrations'] },
  { n: 'F', key: '04', name: 'Form', icon: PenNibIcon, line: 'Design and build the product — UI/UX, features, APIs and core functionality.', items: ['UI/UX', 'Features', 'APIs'] },
  { n: 'T', key: '05', name: 'Transform', icon: ArrowsClockwiseIcon, line: 'Test, refine, optimize, deploy, automate and keep improving it.', items: ['Test', 'Deploy', 'Improve'] },
]
```

- [ ] **Step 4: Add the Method CSS**

Append to `app/globals.css`:

```css
/* The Kraft Method (KraftScreens.dc.html:223-240, 1112-1125): the lit gate
   gets the accent frame, a popped icon, a brighter letter, and a spark that
   runs its dotted top rail for as long as it stays lit. */
@keyframes kPop{0%{transform:scale(.86)}58%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes kRail{0%{left:-3px;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:calc(100% - 3px);opacity:0}}
.method-step{background:linear-gradient(180deg,var(--s2),var(--s1));border:1px solid var(--b1);transition:background .5s ease,border-color .5s ease,box-shadow .5s ease}
.method-step[data-on]{background:linear-gradient(180deg,var(--wash),var(--s1));border-color:var(--accent);box-shadow:0 22px 52px -30px var(--glow)}
.method-rail{position:absolute;left:0;right:0;top:0;height:2px;background:repeating-linear-gradient(90deg,var(--b2) 0 3px,transparent 3px 9px)}
.method-spark{position:absolute;top:-2px;left:-3px;width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 12px var(--glow);opacity:0}
.method-step[data-on] .method-spark{animation:kRail var(--method-ms,1.7s) linear both}
.method-num{position:absolute;top:8px;right:14px;font-size:54px;font-weight:800;letter-spacing:-.05em;line-height:1;color:var(--wash);transition:color .5s ease}
.method-step[data-on] .method-num{color:var(--washB)}
.method-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:11px;background:var(--wash);border:1px solid var(--washB);color:var(--accent);transition:background .4s ease,border-color .4s ease,color .4s ease}
.method-step[data-on] .method-icon{background:var(--accent);border-color:var(--accent);color:var(--onAccent);animation:kPop .5s cubic-bezier(.2,.8,.2,1) both}
```

- [ ] **Step 5: Write the Method and the offers**

Create `components/services/Method.tsx`:

```tsx
'use client'

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import Frame from '@/components/ui/Frame'
import { CARD, TAG } from '@/components/ui/styles'
import { METHOD_MS, PROCESS, servicesPage } from '@/data/services'
import { prefersReducedMotion } from '@/lib/motion'

/**
 * The Kraft Method (KraftScreens.dc.html:217-241, 989-995, 1112-1125): five
 * gates, one lit at a time, advancing every METHOD_MS while the frame is on
 * screen. With reduced motion the first gate stays lit and still.
 */
export default function Method() {
  const m = servicesPage.method
  const [step, setStep] = useState(0)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    let timer: number | undefined
    const start = () => {
      if (timer === undefined) timer = window.setInterval(() => setStep((s) => (s + 1) % PROCESS.length), METHOD_MS)
    }
    const stop = () => {
      window.clearInterval(timer)
      timer = undefined
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [])

  return (
    <section
      id={m.id}
      ref={ref}
      aria-label={m.label}
      className="scroll-mt-[88px]"
      style={{ '--method-ms': `${METHOD_MS}ms` } as CSSProperties}
    >
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${CARD} flex min-w-[220px] flex-[1_1_240px] flex-col gap-[9px] p-5`}>
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{m.kicker}</span>
          <h2 className="text-[clamp(18px,2cqw,24px)] leading-[1.2] font-semibold tracking-[-.025em]">
            {m.title.map((line, i) => (
              <Fragment key={line}>
                {i > 0 && ' '}
                <span className="block">{line}</span>
              </Fragment>
            ))}
          </h2>
          <p className="text-[13px] leading-[1.55] text-ink3">{m.body}</p>
        </div>
        {PROCESS.map((st, i) => (
          <div
            key={st.n}
            data-on={i === step || undefined}
            className="method-step relative flex min-w-[215px] flex-[1_1_230px] flex-col gap-2.5 overflow-hidden rounded-[20px] p-5"
          >
            <span aria-hidden className="method-rail" />
            <span aria-hidden className="method-spark" />
            <span aria-hidden className="method-num">
              {st.n}
            </span>
            <span aria-hidden className="method-icon">
              <st.icon size={18} />
            </span>
            <div className="relative flex items-baseline gap-2">
              <h3 className="text-[17px] font-semibold tracking-[-.02em]">{st.name}</h3>
              <span className="font-mono text-[9.5px] tracking-[.12em] text-ink3">{st.key}</span>
            </div>
            <p className="relative text-[12.5px] leading-[1.55] text-ink3">{st.line}</p>
            <div className="mt-auto flex flex-wrap gap-1.5">
              {st.items.map((it) => (
                <span key={it} className={TAG}>
                  {it}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Frame>
    </section>
  )
}
```

Create `components/services/Offers.tsx`:

```tsx
import Image from 'next/image'
import { BADGE, CARD, TAG } from '@/components/ui/styles'
import { SERVICES, servicesPage } from '@/data/services'
import { brandIcon } from '@/data/stack'

/** "What I can do for you" (KraftScreens.dc.html:243-274): Kraft's six offers. */
export default function Offers() {
  const o = servicesPage.offers
  const total = String(SERVICES.length).padStart(2, '0')
  return (
    <section id={o.id} aria-labelledby="offers-title" className="flex scroll-mt-[88px] flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <div className="flex flex-wrap items-baseline gap-3 pt-1.5">
        <h2 id="offers-title" className="text-[clamp(18px,2.2cqw,26px)] font-semibold tracking-[-.025em]">
          {o.title}
        </h2>
        <span className="text-[13px] text-ink3">{o.aside}</span>
      </div>
      <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)]">
        {SERVICES.map((s) => (
          <article
            key={s.n}
            className={`${CARD} flex min-w-[245px] flex-[1_1_300px] flex-col gap-3 p-5 transition-[translate,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:shadow-[0_24px_60px_-30px_var(--washB)]`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex gap-[5px] rounded-[13px] border border-b1 bg-chip p-[5px]">
                {s.logos.map((l, li) => (
                  <span key={`${l.slug}-${li}`} className="grid size-[30px] place-items-center rounded-[9px] bg-logo-chip shadow-(--chip-shadow)">
                    <Image src={brandIcon(l.slug)} alt={l.name} width={17} height={17} className="block size-[17px] object-contain" />
                  </span>
                ))}
              </div>
              <span className="ml-auto font-mono text-[9.5px] tracking-[.1em] text-ink3">
                {s.n} / {total}
              </span>
            </div>
            <h3 className="text-[17.5px] font-semibold tracking-[-.02em]">{s.name}</h3>
            <p className="text-[13px] leading-normal text-ink3">{s.line}</p>
            <span className={`self-start ${BADGE}`}>{s.badge}</span>
            <ul className="mt-0.5 flex flex-col gap-2">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-start gap-[9px]">
                  <span aria-hidden className="mt-[5px] size-[5px] shrink-0 rounded-full bg-accent opacity-70" />
                  <span className="text-[12.5px] leading-[1.45] text-ink2">{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-1.5 border-t border-b1 pt-1.5">
              {s.tags.map((t) => (
                <span key={t} className={`mt-1 ${TAG}`}>
                  {t}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: The Services page**

Replace `app/(site)/services/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import PageHeader from '@/components/ui/PageHeader'
import { servicesPage } from '@/data/services'

export const metadata: Metadata = { title: 'Services' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/services" title={servicesPage.title} lede={servicesPage.lede} />
      <Method />
      <Offers />
    </section>
  )
}
```

- [ ] **Step 7: Run the unit test to verify it passes**

Run: `npx vitest run tests/services.test.tsx tests/home-data.test.ts`
Expected: PASS.

- [ ] **Step 8: Add the e2e**

Create `e2e/services.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('the Kraft Method walks its five gates', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  const lit = page.locator('.method-step[data-on] h3')
  await expect(lit).toHaveText('Kickoff')
  await expect(lit).toHaveText('Research', { timeout: 3000 })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('the Method holds its first gate', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await page.waitForTimeout(2200)
    await expect(page.locator('.method-step[data-on] h3')).toHaveText('Kickoff')
  })
})
```

Run: `npx playwright test e2e/services.spec.ts --project=desktop`
Expected: PASS (2 tests).

- [ ] **Step 9: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add data/services.ts components/services "app/(site)/services/page.tsx" app/globals.css tests/services.test.tsx e2e/services.spec.ts
git commit -m "feat: Services page: the Kraft Method (auto-advancing gates) and the six offers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Services — the live automation flow

**Files:**
- Create: `data/flows.ts`, `lib/flow.ts`, `components/services/Automation.tsx`
- Modify: `app/(site)/services/page.tsx`, `app/globals.css`, `e2e/services.spec.ts`
- Test: `tests/flow.test.ts`, `tests/Automation.test.tsx`

**Interfaces:**
- Consumes: `servicesPage.automation` (Task 5), `Frame`, `prefersReducedMotion`
- Produces:
  - `type FlowNode = { x; y; icon: Icon; name; sub; kind?: 'on' | 'off' }`
  - `type FlowEdge = { f; t; from: [x, y]; to: [x, y]; c?: [x1, y1, x2, y2]; k?: 'dash' | 'dot'; ball?: [secs, delay, opacity?] }`
  - `type Flow = { label; title; blurb; tags; note: { x; y; text }; nodes; edges }`, `FLOWS: Flow[]` (10)
  - `FLOW_W = 1180`, `FLOW_H = 430`, `LIFT = -6`, `edgePath(e, a?, b?): string`, `type Lifts = Record<number, number>`, `stepLift(cur, tgt): { cur: Lifts; moving: boolean }`, `wrap(i, n): number`
  - Section id `#automation`, with the title at `#automation-title`
  - CSS classes `.flow-edge`, `.flow-edge--dash`, `.flow-edge--dot`, `.flow-ball`

- [ ] **Step 1: Write the failing tests**

Create `tests/flow.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { FLOWS, type FlowEdge } from '@/data/flows'
import { edgePath, stepLift, wrap, type Lifts } from '@/lib/flow'

const straight: FlowEdge = { f: 0, t: 1, from: [130, 96], to: [248, 96] }
const curve: FlowEdge = { f: 2, t: 4, from: [456, 132], to: [812, 132], c: [520, 214, 740, 214], k: 'dash' }

describe('edgePath (Kraft edgeD)', () => {
  it("draws Kraft's straight and curved edges", () => {
    expect(edgePath(straight)).toBe('M130,96 L248,96')
    expect(edgePath(curve)).toBe('M456,132 C520,214 740,214 812,132')
  })

  it("raises each end by its node's lift", () => {
    expect(edgePath(straight, -6, 0)).toBe('M130,90 L248,96')
    expect(edgePath(curve, 0, -6)).toBe('M456,132 C520,214 740,214 812,126')
  })
})

describe('stepLift', () => {
  it('eases 26% of the way per frame, then snaps', () => {
    const one = stepLift({}, { 3: -6 })
    expect(one.cur[3]).toBeCloseTo(-1.56)
    expect(one.moving).toBe(true)
    let s: { cur: Lifts; moving: boolean } = { cur: {}, moving: true }
    let frames = 0
    while (s.moving && frames < 100) {
      s = stepLift(s.cur, { 3: -6 })
      frames++
    }
    expect(s.cur[3]).toBe(-6)
    expect(frames).toBeLessThan(30)
  })
})

describe('wrap', () => {
  it('wraps flow indexes both ways', () => {
    expect(wrap(-1, 10)).toBe(9)
    expect(wrap(10, 10)).toBe(0)
  })
})

describe('FLOWS', () => {
  it("has Kraft's ten flows, every edge joining two real nodes", () => {
    expect(FLOWS).toHaveLength(10)
    expect(FLOWS[0].label).toBe('LEAD → BOOKED CALL')
    for (const f of FLOWS) {
      for (const e of f.edges) {
        expect(f.nodes[e.f], `${f.label} edge from ${e.f}`).toBeDefined()
        expect(f.nodes[e.t], `${f.label} edge to ${e.t}`).toBeDefined()
      }
      expect(new Set(f.nodes.map((n) => n.name)).size).toBe(f.nodes.length)
    }
  })
})
```

Create `tests/Automation.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Automation from '@/components/services/Automation'
import { installMatchMedia } from '@/test/matchMedia'

describe('Automation', () => {
  it('opens on the first of ten flows, its nodes read as a list', () => {
    render(<Automation />)
    expect(screen.getByRole('heading', { level: 2, name: 'One form. The rest runs itself.' })).toBeInTheDocument()
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(11)
    expect(document.getElementById('automation')).toHaveClass('scroll-mt-[88px]')
  })

  it('steps both ways and wraps', () => {
    render(<Automation />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous automation' }))
    expect(screen.getByText('10 / 10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Monday reporting, already written.')
    fireEvent.click(screen.getByRole('button', { name: 'Next automation' }))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
  })

  it('bends the edges of a hovered node (at once with reduced motion)', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { container } = render(<Automation />)
    const first = container.querySelectorAll('path')[0]
    expect(first).toHaveAttribute('d', 'M130,96 L248,96')
    const tile = screen.getByText('Submit Form').previousElementSibling as HTMLElement
    fireEvent.mouseEnter(tile)
    expect(first).toHaveAttribute('d', 'M130,90 L248,96')
    fireEvent.mouseLeave(tile)
    expect(first).toHaveAttribute('d', 'M130,96 L248,96')
  })

  it('marks dead ends in the alert colour and outcomes in the accent', () => {
    render(<Automation />)
    expect(screen.getByText('Lost')).toHaveClass('text-danger')
    expect(screen.getByText('Won')).toHaveClass('text-accent')
    expect(screen.getByText('Booking Email')).toHaveClass('text-ink')
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/flow.test.ts tests/Automation.test.tsx`
Expected: FAIL with "Failed to resolve import '@/data/flows'".

- [ ] **Step 3: Write `data/flows.ts`**

Kraft repeats the same five "spine" edges across the top row of every flow (`KraftScreens.dc.html:686-690`, and again in each flow). They are shared here as `SPINE`. Everything else is verbatim.

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  ArchiveIcon, ArrowUUpLeftIcon, ArrowsClockwiseIcon, BellRingingIcon, CalendarCheckIcon, ChartLineUpIcon,
  ChatTeardropTextIcon, CheckCircleIcon, CheckSquareIcon, ClockIcon, CodeIcon, CreditCardIcon, DeviceMobileIcon,
  EnvelopeSimpleIcon, EyeIcon, FileTextIcon, FlagPennantIcon, FunnelIcon, GaugeIcon, GlobeIcon, HandCoinsIcon,
  HeartIcon, HourglassMediumIcon, ImageIcon, LifebuoyIcon, LightningIcon, LinkIcon, MagnifyingGlassIcon, MoonIcon,
  NewspaperIcon, NotePencilIcon, PackageIcon, PenNibIcon, PhoneIcon, PhoneSlashIcon, PlugsConnectedIcon, QuotesIcon,
  ReceiptIcon, RobotIcon, ScalesIcon, SealCheckIcon, ShoppingCartIcon, SnowflakeIcon, SortAscendingIcon,
  SquaresFourIcon, StarIcon, TagIcon, ThumbsDownIcon, ThumbsUpIcon, TicketIcon, TrophyIcon, UserCheckIcon,
  UserFocusIcon, UserSwitchIcon, VideoCameraIcon, WarningCircleIcon, WrenchIcon, XCircleIcon,
} from '@phosphor-icons/react/ssr'

/**
 * Kraft's live automation flows, verbatim (KraftScreens.dc.html:663-960).
 * Coordinates are on the 1180×430 canvas (lib/flow.ts). A node's `kind`
 * marks an outcome ('on', accent) or a dead end ('off', the alert red).
 */
export type FlowNode = { x: number; y: number; icon: Icon; name: string; sub: string; kind?: 'on' | 'off' }
export type FlowEdge = {
  f: number
  t: number
  from: [number, number]
  to: [number, number]
  /** Cubic control points; without them the edge is a straight line. */
  c?: [number, number, number, number]
  k?: 'dash' | 'dot'
  /** A travelling dot: seconds per trip, start delay in seconds, opacity. */
  ball?: [number, number, number?]
}
export type Flow = {
  label: string
  title: string
  blurb: string
  tags: string[]
  note: { x: number; y: number; text: string }
  nodes: FlowNode[]
  edges: FlowEdge[]
}

type N = [number, number, Icon, string, string, ('on' | 'off')?]
const nodes = (list: N[]): FlowNode[] => list.map(([x, y, icon, name, sub, kind]) => ({ x, y, icon, name, sub, kind }))

/** The top row's five hand-offs, identical in every Kraft flow. */
const SPINE: FlowEdge[] = [
  { f: 0, t: 1, from: [130, 96], to: [248, 96], ball: [2.4, 0] },
  { f: 1, t: 2, from: [308, 96], to: [426, 96], ball: [2.4, 0.4] },
  { f: 2, t: 3, from: [486, 96], to: [604, 96], ball: [2.4, 0.8] },
  { f: 3, t: 4, from: [662, 96], to: [780, 96], ball: [2.4, 1.2] },
  { f: 4, t: 5, from: [842, 96], to: [982, 96], ball: [2.4, 1.6] },
]

export const FLOWS: Flow[] = [
  {
    label: 'LEAD → BOOKED CALL',
    title: 'One form. The rest runs itself.',
    blurb: 'Someone fills a form. The system qualifies them, books the call, sends the reminders and sorts what happens after it.',
    tags: ['CRM', 'Email & SMS', 'AI qualifier'],
    note: { x: 634, y: 218, text: 'BOOKING RESCHEDULED' },
    nodes: nodes([
      [100, 96, LightningIcon, 'Submit Form', 'New lead trigger', 'on'],
      [278, 96, EnvelopeSimpleIcon, 'Booking Email', 'Send booking link'],
      [456, 96, CalendarCheckIcon, 'Client Booked', 'Slot confirmed'],
      [634, 96, ClockIcon, '24hr Reminder', 'Pre-appt email'],
      [812, 96, BellRingingIcon, '1hr Reminder', 'Pre-appt email'],
      [1010, 96, VideoCameraIcon, 'Discovery Call', 'Qualify the lead', 'on'],
      [250, 336, FileTextIcon, 'Proposal Sent', 'Scope + price'],
      [420, 336, TrophyIcon, 'Won', 'Deal closed', 'on'],
      [700, 336, HourglassMediumIcon, 'Maybe / Later', 'Not ready yet'],
      [860, 336, HeartIcon, 'Nurture', 'Long-term drip'],
      [1010, 336, XCircleIcon, 'Lost', 'Closed out', 'off'],
    ]),
    edges: [
      ...SPINE,
      { f: 2, t: 4, from: [456, 132], to: [812, 132], c: [520, 214, 740, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 5, t: 6, from: [1002, 134], to: [262, 302], c: [820, 252, 520, 246], k: 'dot', ball: [4, 2.2, 0.55] },
      { f: 5, t: 8, from: [1004, 136], to: [706, 302], c: [910, 232, 800, 252], k: 'dot', ball: [3.6, 2.6, 0.55] },
      { f: 5, t: 10, from: [1010, 130], to: [1010, 302], k: 'dot' },
      { f: 6, t: 7, from: [278, 336], to: [392, 336], ball: [2.4, 3] },
      { f: 8, t: 9, from: [728, 336], to: [832, 336], ball: [2.4, 3.2] },
    ],
  },
  {
    label: 'SUPPORT TICKET TRIAGE',
    title: 'Every ticket answered in seconds.',
    blurb: 'A ticket lands, gets read and ranked, acknowledged instantly, then routed to whoever can actually close it.',
    tags: ['Helpdesk', 'AI triage', 'SLA rules'],
    note: { x: 911, y: 222, text: 'REOPENED' },
    nodes: nodes([
      [100, 96, TicketIcon, 'New ticket', 'Email or form', 'on'],
      [278, 96, RobotIcon, 'AI triage', 'Intent + urgency'],
      [456, 96, SortAscendingIcon, 'Priority set', 'SLA applied'],
      [634, 96, ChatTeardropTextIcon, 'Auto-reply', 'Ack in seconds'],
      [812, 96, UserSwitchIcon, 'Agent assigned', 'Right queue'],
      [1010, 96, CheckCircleIcon, 'Resolved', 'Closed out', 'on'],
      [456, 336, WarningCircleIcon, 'Escalated', 'Breach risk', 'off'],
      [700, 336, WrenchIcon, 'Engineer', 'Root cause'],
      [1010, 336, StarIcon, 'CSAT sent', 'Feedback loop', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
  {
    label: 'ONBOARDING → DELIVERY',
    title: 'From signature to handover.',
    blurb: 'The contract closes and the project starts itself: kickoff booked, workspace provisioned, milestones shipped for review.',
    tags: ['Contracts', 'Workspace', 'Milestones'],
    note: { x: 723, y: 222, text: 'REVISION LOOP' },
    nodes: nodes([
      [100, 96, FileTextIcon, 'Contract signed', 'Deal closed', 'on'],
      [278, 96, FlagPennantIcon, 'Kickoff booked', 'Calendar hold'],
      [456, 96, SquaresFourIcon, 'Workspace set up', 'Repo + access'],
      [634, 96, CodeIcon, 'Milestone build', 'Preview shipped'],
      [812, 96, EyeIcon, 'Client review', 'Feedback logged'],
      [1010, 96, PackageIcon, 'Handover', 'Docs + access', 'on'],
      [634, 336, ArrowsClockwiseIcon, 'Change request', 'Scope shift'],
      [812, 336, NotePencilIcon, 'Re-scoped', 'Quoted again'],
      [1010, 336, LifebuoyIcon, 'Retainer', 'Ongoing support', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 4, t: 3, from: [812, 132], to: [634, 132], c: [760, 214, 690, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 4, t: 6, from: [806, 134], to: [640, 302], c: [780, 240, 700, 250], k: 'dot', ball: [3, 2.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.8] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 3, 0.55] },
    ],
  },
  {
    label: 'CONTENT → SEO PUBLISH',
    title: 'Drafts that publish themselves.',
    blurb: 'A brief goes in, keywords come back, the draft gets written and checked, then it ships with links and tracking already in place.',
    tags: ['CMS', 'Keyword data', 'AI drafting'],
    note: { x: 911, y: 222, text: 'SENT BACK FOR REWORK' },
    nodes: nodes([
      [100, 96, NotePencilIcon, 'Brief queued', 'Topic + intent', 'on'],
      [278, 96, MagnifyingGlassIcon, 'Keyword pass', 'Volume + gaps'],
      [456, 96, PenNibIcon, 'Draft written', 'Outline to copy'],
      [634, 96, CheckSquareIcon, 'Fact-checked', 'Sources attached'],
      [812, 96, ImageIcon, 'Assets built', 'Images + meta'],
      [1010, 96, GlobeIcon, 'Published', 'Live on site', 'on'],
      [456, 336, ArrowUUpLeftIcon, 'Rework', 'Editor notes', 'off'],
      [700, 336, LinkIcon, 'Internal links', 'Cluster wired'],
      [1010, 336, ChartLineUpIcon, 'Indexed', 'Ranking tracked', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
  {
    label: 'INVOICE → PAID → RECONCILED',
    title: 'Money chased without you asking.',
    blurb: 'The invoice goes out, reminders escalate on their own, and the payment lands reconciled against the right job.',
    tags: ['Payments', 'Dunning', 'Bookkeeping'],
    note: { x: 723, y: 222, text: 'PAYMENT FAILED · RETRY' },
    nodes: nodes([
      [100, 96, ReceiptIcon, 'Invoice sent', 'Job closed', 'on'],
      [278, 96, EyeIcon, 'Viewed', 'Open tracked'],
      [456, 96, ClockIcon, 'Due soon', 'T-3 days'],
      [634, 96, CreditCardIcon, 'Payment link', 'Card or transfer'],
      [812, 96, CheckCircleIcon, 'Paid', 'Funds cleared'],
      [1010, 96, ScalesIcon, 'Reconciled', 'Books updated', 'on'],
      [634, 336, WarningCircleIcon, 'Overdue', 'Past terms', 'off'],
      [812, 336, BellRingingIcon, 'Dunning', 'Escalating notes'],
      [1010, 336, HandCoinsIcon, 'Recovered', 'Settled late', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 4, t: 3, from: [812, 132], to: [634, 132], c: [760, 214, 690, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'REVIEW → TESTIMONIAL',
    title: 'Proof collected while it is warm.',
    blurb: 'The moment a project lands, the ask goes out, the good ones become testimonials, and the rough ones reach you first.',
    tags: ['Review ask', 'Approval', 'Website'],
    note: { x: 911, y: 222, text: 'NUDGED ONCE MORE' },
    nodes: nodes([
      [100, 96, PackageIcon, 'Project closed', 'Handover done', 'on'],
      [278, 96, StarIcon, 'Review asked', 'One-tap rating'],
      [456, 96, ThumbsUpIcon, 'Rating in', '4–5 stars'],
      [634, 96, QuotesIcon, 'Quote drafted', 'Edited for them'],
      [812, 96, SealCheckIcon, 'Client approved', 'Signed off'],
      [1010, 96, GlobeIcon, 'Published', 'Live on site', 'on'],
      [456, 336, ThumbsDownIcon, 'Low rating', 'Held private', 'off'],
      [700, 336, PhoneIcon, 'Recovery call', 'You hear it first'],
      [1010, 336, WrenchIcon, 'Made right', 'Then asked again', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 2, t: 1, from: [456, 132], to: [278, 132], c: [404, 214, 334, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 7, t: 8, from: [728, 336], to: [982, 336], ball: [3, 2.8] },
    ],
  },
  {
    label: 'LEAD SCORING → DAILY DIGEST',
    title: 'One email, ranked by who matters.',
    blurb: 'Every lead gets enriched and scored overnight, then arrives as a single ordered digest at 7am instead of forty notifications.',
    tags: ['Enrichment', 'Scoring', 'Digest'],
    note: { x: 911, y: 222, text: 'RE-SCORED ON ACTIVITY' },
    nodes: nodes([
      [100, 96, UserFocusIcon, 'Lead enriched', 'Company + role', 'on'],
      [278, 96, GaugeIcon, 'Scored', 'Fit + intent'],
      [456, 96, SortAscendingIcon, 'Tiered', 'A / B / C'],
      [634, 96, UserSwitchIcon, 'Routed', 'Owner assigned'],
      [812, 96, NewspaperIcon, 'Digest built', 'Ranked list'],
      [1010, 96, EnvelopeSimpleIcon, 'Inbox 7am', 'One email', 'on'],
      [456, 336, SnowflakeIcon, 'Cold', 'Below threshold', 'off'],
      [700, 336, HeartIcon, 'Nurture', 'Slow drip'],
      [1010, 336, ArrowsClockwiseIcon, 'Re-scored', 'Back in the queue', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 7, t: 8, from: [728, 336], to: [982, 336], ball: [3, 2.8] },
    ],
  },
  {
    label: 'ABANDONED CHECKOUT → RECOVERY',
    title: 'The cart that comes back on its own.',
    blurb: 'Someone leaves mid-checkout. The sequence waits, reminds, offers a reason to finish, and stops the second they pay.',
    tags: ['Checkout', 'Email & SMS', 'Offers'],
    note: { x: 723, y: 222, text: 'STOPPED · ALREADY PAID' },
    nodes: nodes([
      [100, 96, ShoppingCartIcon, 'Cart left', 'Checkout exit', 'on'],
      [278, 96, HourglassMediumIcon, 'Wait 1 hour', 'Cooling off'],
      [456, 96, EnvelopeSimpleIcon, 'Reminder email', 'Cart restored'],
      [634, 96, DeviceMobileIcon, 'SMS nudge', 'Next morning'],
      [812, 96, TagIcon, 'Reason to finish', 'Time-boxed offer'],
      [1010, 96, CheckCircleIcon, 'Recovered', 'Order placed', 'on'],
      [634, 336, MoonIcon, 'No response', 'Sequence ends', 'off'],
      [812, 336, HeartIcon, 'Win-back list', 'Monthly touch'],
      [1010, 336, XCircleIcon, 'Unsubscribed', 'Removed', 'off'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 3, from: [1010, 132], to: [634, 132], c: [900, 214, 760, 214], k: 'dash', ball: [3.6, 2, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'MISSED CALL → TEXT BACK',
    title: 'No call goes unanswered.',
    blurb: 'A call rings out and the text goes before they reach the next search result — answered, qualified and booked without you dialling back.',
    tags: ['Telephony', 'SMS', 'Booking'],
    note: { x: 723, y: 222, text: 'CALLED BACK INSTEAD' },
    nodes: nodes([
      [100, 96, PhoneSlashIcon, 'Missed call', 'Rang out', 'on'],
      [278, 96, DeviceMobileIcon, 'Text sent', 'Under 30 s'],
      [456, 96, ChatTeardropTextIcon, 'They reply', 'Thread open'],
      [634, 96, RobotIcon, 'AI qualifies', 'Need + timing'],
      [812, 96, CalendarCheckIcon, 'Slot offered', 'Live calendar'],
      [1010, 96, VideoCameraIcon, 'Call booked', 'On the sheet', 'on'],
      [634, 336, MoonIcon, 'No reply', 'Two nudges out', 'off'],
      [812, 336, HeartIcon, 'Nurture list', 'Monthly touch'],
      [1010, 336, UserCheckIcon, 'Owner alerted', 'Human takes over', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 3, from: [1010, 132], to: [634, 132], c: [900, 214, 760, 214], k: 'dash', ball: [3.6, 2, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'OPS DATA → WEEKLY REPORT',
    title: 'Monday reporting, already written.',
    blurb: 'Numbers are pulled from every system overnight, checked against last week, then land as one short report with the anomalies flagged.',
    tags: ['Warehouse', 'Checks', 'Reporting'],
    note: { x: 911, y: 222, text: 'RE-RUN AFTER FIX' },
    nodes: nodes([
      [100, 96, PlugsConnectedIcon, 'Sources pulled', 'CRM · billing · site', 'on'],
      [278, 96, FunnelIcon, 'Cleaned', 'Dedupe + map'],
      [456, 96, MagnifyingGlassIcon, 'Checks run', 'Gaps and spikes'],
      [634, 96, ChartLineUpIcon, 'Metrics built', 'Week over week'],
      [812, 96, NotePencilIcon, 'Summary drafted', 'Plain language'],
      [1010, 96, NewspaperIcon, 'Report out', 'Monday 7am', 'on'],
      [456, 336, WarningCircleIcon, 'Check failed', 'Source stale', 'off'],
      [700, 336, WrenchIcon, 'Owner pinged', 'Fix requested'],
      [1010, 336, ArchiveIcon, 'Archived', 'Trend history', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
]
```

- [ ] **Step 4: Write `lib/flow.ts`**

```ts
import type { FlowEdge } from '@/data/flows'

/** Kraft's canvas (KraftScreens.dc.html:301): fixed 1180×430, scrolled sideways when the frame is narrower. */
export const FLOW_W = 1180
export const FLOW_H = 430
/** How far a hovered node rises, in px; its edges rise with it (…:1006-1009). */
export const LIFT = -6

/** Kraft's edgeD (…:968-972): a line, or a cubic when the edge has control points; `a` and `b` raise its two ends. */
export function edgePath(e: FlowEdge, a = 0, b = 0): string {
  const [fx, fy] = e.from
  const [tx, ty] = e.to
  if (e.c) return `M${fx},${fy + a} C${e.c[0]},${e.c[1]} ${e.c[2]},${e.c[3]} ${tx},${ty + b}`
  return `M${fx},${fy + a} L${tx},${ty + b}`
}

export type Lifts = Record<number, number>

/** One frame of Kraft's lift easing (…:1011-1020): 26% of the remaining way, snapping within 0.08px. */
export function stepLift(cur: Lifts, tgt: Lifts): { cur: Lifts; moving: boolean } {
  const next: Lifts = { ...cur }
  let moving = false
  for (const key of Object.keys(tgt)) {
    const i = Number(key)
    const t = tgt[i]
    const v = (cur[i] ?? 0) + (t - (cur[i] ?? 0)) * 0.26
    next[i] = Math.abs(t - v) < 0.08 ? t : v
    if (next[i] !== t) moving = true
  }
  return { cur: next, moving }
}

/** `i` modulo `n`, so stepping back from the first flow lands on the last. */
export const wrap = (i: number, n: number) => ((i % n) + n) % n
```

- [ ] **Step 5: Add the flow CSS**

Append to `app/globals.css`:

```css
/* Live automation (KraftScreens.dc.html:300-320, 962-966): the three edge
   styles and the dots that travel along them. The dots stop, and hide, for
   reduced motion. */
.flow-edge{fill:none;stroke:var(--washB);stroke-width:1.5;stroke-linecap:round}
.flow-edge--dash{stroke:var(--accent);stroke-dasharray:7 6;opacity:.85}
.flow-edge--dot{stroke:var(--ink3);stroke-width:1.3;stroke-dasharray:2 7;opacity:.75}
@keyframes kTravel{from{offset-distance:0%}to{offset-distance:100%}}
.flow-ball{position:absolute;left:0;top:0;width:8px;height:8px;border-radius:50%;background:var(--accent);offset-anchor:50% 50%;offset-rotate:0deg;animation-name:kTravel;animation-timing-function:linear;animation-iteration-count:infinite}
@media (prefers-reduced-motion:reduce){.flow-ball{display:none}}
html[data-a11y-motion=true] .flow-ball{display:none}
```

- [ ] **Step 6: Write the automation component**

Create `components/services/Automation.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import { FLOWS, type Flow, type FlowEdge } from '@/data/flows'
import { servicesPage } from '@/data/services'
import { edgePath, FLOW_H, FLOW_W, LIFT, stepLift, wrap, type Lifts } from '@/lib/flow'
import { prefersReducedMotion } from '@/lib/motion'

/** Node colours by kind (KraftScreens.dc.html:1218-1229): outcome, dead end, step. */
const KIND = {
  on: { tile: 'border-accent bg-wash text-accent', name: 'text-accent' },
  off: { tile: 'border-danger-b bg-s2 text-danger', name: 'text-danger' },
  step: { tile: 'border-b2 bg-s2 text-ink', name: 'text-ink' },
} as const

const NAV =
  'grid size-8 cursor-pointer place-items-center rounded-[10px] border border-b1 bg-s2 text-[15px] text-ink2 transition-colors duration-250 hover:border-accent hover:text-accent'

/**
 * Kraft's live automation (KraftScreens.dc.html:276-323, 997-1033): one of
 * ten flows on a fixed 1180×430 canvas. Its frame scrolls sideways when the
 * page is narrower, and the arrows step through the flows. The title is a
 * live region, so a change of flow is announced.
 */
export default function Automation() {
  const a = servicesPage.automation
  const [index, setIndex] = useState(0)
  const flow = FLOWS[index]
  return (
    <section id={a.id} aria-labelledby="automation-title" className="scroll-mt-[88px]">
      <Frame
        lit={{ x: '50%', y: '-20%', size: '100% 120%', alpha: 0.6, stop: '60%' }}
        className="flex flex-col gap-4 p-[clamp(14px,1.8cqw,24px)]"
      >
        <div aria-live="polite" className="flex flex-col items-center gap-[7px] text-center">
          <span className="font-mono text-[10px] tracking-[.18em] text-accent">{a.kicker}</span>
          <h2 id="automation-title" className="text-[clamp(19px,2.4cqw,28px)] font-bold tracking-[-.03em]">
            {flow.title}
          </h2>
          <p className="max-w-[520px] text-[13px] leading-[1.55] text-ink3">{flow.blurb}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {flow.tags.map((t) => (
              <span key={t} className="rounded-[9px] border border-b1 bg-chip px-[11px] py-1.5 font-mono text-[10px] tracking-[.06em] text-ink2">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-b1 bg-frame">
          <div className="flex flex-wrap items-center gap-[9px] border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span className="ml-1.5 font-mono text-[10px] tracking-[.1em] text-ink2">{flow.label}</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent">
              <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
              {a.live}
            </span>
            <div className="ml-auto flex items-center gap-[7px]">
              <button type="button" onClick={() => setIndex((i) => wrap(i - 1, FLOWS.length))} aria-label={a.prev} className={NAV}>
                <CaretLeftIcon aria-hidden />
              </button>
              <span className="min-w-[34px] text-center font-mono text-[10px] tracking-[.1em] text-ink3">
                {index + 1} / {FLOWS.length}
              </span>
              <button type="button" onClick={() => setIndex((i) => wrap(i + 1, FLOWS.length))} aria-label={a.next} className={NAV}>
                <CaretRightIcon aria-hidden />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto overflow-y-hidden bg-[radial-gradient(60%_100%_at_50%_0,var(--wash),transparent_70%)] px-[18px] py-5">
            <FlowCanvas key={index} flow={flow} />
          </div>
        </div>
      </Frame>
    </section>
  )
}

/**
 * One flow. Hovering a node lifts it (CSS) and eases its edges, and the dots
 * riding them, up with it (Kraft's rAF lift, …:1006-1033). With reduced
 * motion the edges move at once.
 */
function FlowCanvas({ flow }: { flow: Flow }) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const balls = useRef<(HTMLSpanElement | null)[]>([])
  const cur = useRef<Lifts>({})
  const tgt = useRef<Lifts>({})
  const raf = useRef(0)
  const riders = flow.edges.filter((e) => e.ball)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const draw = () => {
    const at = (e: FlowEdge) => edgePath(e, cur.current[e.f] ?? 0, cur.current[e.t] ?? 0)
    flow.edges.forEach((e, i) => paths.current[i]?.setAttribute('d', at(e)))
    riders.forEach((e, i) => balls.current[i]?.style.setProperty('offset-path', `path('${at(e)}')`))
  }

  const frame = () => {
    raf.current = 0
    const next = stepLift(cur.current, tgt.current)
    cur.current = next.cur
    draw()
    if (next.moving) raf.current = requestAnimationFrame(frame)
  }

  const lift = (i: number, up: boolean) => {
    tgt.current[i] = up ? LIFT : 0
    if (prefersReducedMotion()) {
      cur.current = { ...tgt.current }
      draw()
    } else if (!raf.current) {
      raf.current = requestAnimationFrame(frame)
    }
  }

  return (
    <div
      className="relative bg-[radial-gradient(circle,var(--b1)_1px,transparent_1px)] bg-size-[26px_26px]"
      style={{ width: FLOW_W, height: FLOW_H }}
    >
      <svg viewBox={`0 0 ${FLOW_W} ${FLOW_H}`} width={FLOW_W} height={FLOW_H} aria-hidden className="pointer-events-none absolute top-0 left-0">
        {flow.edges.map((e, i) => (
          <path
            key={`${e.f}-${e.t}-${i}`}
            ref={(el) => {
              paths.current[i] = el
            }}
            d={edgePath(e)}
            className={e.k ? `flow-edge flow-edge--${e.k}` : 'flow-edge'}
          />
        ))}
      </svg>
      {riders.map((e, i) => {
        const [secs, delay, opacity = 1] = e.ball!
        return (
          <span
            key={`${e.f}-${e.t}-${i}`}
            ref={(el) => {
              balls.current[i] = el
            }}
            aria-hidden
            className="flow-ball"
            style={{ offsetPath: `path('${edgePath(e)}')`, animationDuration: `${secs}s`, animationDelay: `${delay}s`, opacity } as CSSProperties}
          />
        )
      })}
      <span
        aria-hidden
        className="absolute -translate-1/2 font-mono text-[9.5px] tracking-[.12em] whitespace-nowrap text-accent"
        style={{ left: flow.note.x, top: flow.note.y }}
      >
        {flow.note.text}
      </span>
      <ol className="contents">
        {flow.nodes.map((n, i) => {
          const k = KIND[n.kind ?? 'step']
          return (
            <li key={n.name} className="absolute flex w-[124px] -translate-x-1/2 flex-col items-center gap-[9px]" style={{ left: n.x, top: n.y - 28 }}>
              <span
                aria-hidden
                onMouseEnter={() => lift(i, true)}
                onMouseLeave={() => lift(i, false)}
                className={`grid size-14 place-items-center rounded-[17px] border text-2xl transition-[translate,scale,box-shadow,border-color] duration-320 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1.5 hover:scale-107 hover:border-accent hover:shadow-[0_16px_34px_-12px_var(--glow),0_0_0_5px_var(--wash)] ${k.tile}`}
              >
                <n.icon />
              </span>
              <span className={`text-center text-xs leading-[1.25] font-semibold ${k.name}`}>{n.name}</span>
              <span className="text-center font-mono text-[9px] tracking-[.05em] text-ink3">{n.sub}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
```

- [ ] **Step 7: Add it to the page**

In `app/(site)/services/page.tsx`, add `import Automation from '@/components/services/Automation'` and render `<Automation />` after `<Offers />`.

- [ ] **Step 8: Run the unit tests to verify they pass**

Run: `npx vitest run tests/flow.test.ts tests/Automation.test.tsx tests/no-raw-colors.test.ts`
Expected: PASS.

- [ ] **Step 9: Add the e2e**

Append to `e2e/services.spec.ts`, above the `test.describe('reduced motion'` block:

```ts
test('live automation: the arrows change the flow, and its dots travel', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.getByRole('button', { name: 'Next automation' }).click()
  await expect(page.locator('#automation-title')).toHaveText('Every ticket answered in seconds.')
  expect(await page.locator('.flow-ball').first().evaluate((el) => el.getAnimations().length)).toBe(1)
})
```

Inside the `test.describe('reduced motion', …)` block, add:

```ts
  test('no travelling dots', async ({ page }) => {
    await page.goto('/services')
    await hydrated(page)
    await expect(page.locator('.flow-ball').first()).toBeHidden()
  })
```

Run: `npx playwright test e2e/services.spec.ts --project=desktop`
Expected: PASS (4 tests).

- [ ] **Step 10: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add data/flows.ts lib/flow.ts components/services/Automation.tsx "app/(site)/services/page.tsx" app/globals.css tests/flow.test.ts tests/Automation.test.tsx e2e/services.spec.ts
git commit -m "feat: live automation flow with Kraft's flows, travelling dots and hover-lifted edges

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Testimonials and About

**Files:**
- Create: `components/testimonials/Testimonials.tsx`, `data/about.ts`, `components/about/Intro.tsx`, `components/about/Roles.tsx`, `components/about/Certified.tsx`, `components/about/Aside.tsx`, `public/icons/brands/googlesheets.svg` (generated)
- Modify: `data/testimonials.ts`, `scripts/brand-icons.mjs`, `app/(site)/testimonials/page.tsx`, `app/(site)/about/page.tsx`
- Test: `tests/testimonials.test.tsx`, `tests/about.test.tsx`

**Interfaces:**
- Consumes:
  - `CLIENTS`, `CERTS`, `brandIcon`, `isPlaceholder`
  - `PageHeader`, `Frame`, `Shot`, `CARD`, `TAG`, `ICON_TILE` (Task 1)
- Produces:
  - `Client.video: { src: string; poster: string; duration: string }` (all PLACEHOLDER)
  - `testimonialsPage`
  - `type Role = { n; name; line; logos: Brand[] }`, `ROLES: Role[]`, `about`

- [ ] **Step 1: Write the failing tests**

Create `tests/testimonials.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Testimonials from '@/components/testimonials/Testimonials'
import { isPlaceholder } from '@/lib/placeholder'

describe('Testimonials', () => {
  it('features the first client, and a tab switches the player and the quote', () => {
    render(<Testimonials />)
    const first = screen.getByRole('button', { name: 'Testimonial 01' })
    const second = screen.getByRole('button', { name: 'Testimonial 02' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Client testimonial 01')).toBeInTheDocument()
    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Client testimonial 02')).toBeInTheDocument()
  })

  it('keeps play disabled until a real video exists', () => {
    render(<Testimonials />)
    expect(screen.getByRole('button', { name: 'Play testimonial' })).toBeDisabled()
    expect(screen.getByText('[0:00] · TAP TO PLAY')).toBeInTheDocument()
  })

  it('shows every client, and never an invented quote', () => {
    render(<Testimonials />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(3)
    for (const card of cards) expect(isPlaceholder(within(card).getByRole('heading').textContent ?? '')).toBe(true)
  })
})
```

Create `tests/about.test.tsx`:

```tsx
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from '@/app/(site)/about/page'
import { about, ROLES } from '@/data/about'
import { brandIcon } from '@/data/stack'

describe('About', () => {
  it("is Kraft's About: the greeting, the parts nobody demos, and four roles", () => {
    render(<AboutPage />)
    expect(screen.getByRole('heading', { level: 1, name: "Hi, I'm Justine." })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /^I care about the parts nobody demos\./ })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Full Stack Developer', 'AI Automation Engineer', 'AI Web Dev', 'Systems Builder',
    ])
  })

  it('names both certifications, and each can take keyboard focus to show its tooltip', () => {
    render(<AboutPage />)
    for (const name of ['AWS Cloud Practitioner Essentials', 'HackerRank Software Engineer']) {
      expect(screen.getByRole('img', { name })).toHaveAttribute('tabindex', '0')
    }
  })

  it('shows the workstation and where Justine is based', () => {
    render(<AboutPage />)
    expect(screen.getByRole('img', { name: about.image.alt })).toBeInTheDocument()
    expect(screen.getByText('Based in Manila, Philippines')).toBeInTheDocument()
    expect(screen.getByText('GMT+8 · US / EU / CA OVERLAP')).toBeInTheDocument()
  })

  it('has a self-hosted logo for every role', () => {
    const missing = ROLES.flatMap((r) => r.logos).filter((l) => !existsSync(`public${brandIcon(l.slug)}`))
    expect(missing).toEqual([])
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/testimonials.test.tsx tests/about.test.tsx`
Expected: FAIL with "Failed to resolve import '@/components/testimonials/Testimonials'" and "Failed to resolve import '@/data/about'".

- [ ] **Step 3: Add the Google Sheets logo**

In `scripts/brand-icons.mjs`, add `googlesheets: '34A853',` after `github: 'A3AAB2',`. It is the brand colour Kraft used (`KraftScreens.dc.html:648`).

Run: `node scripts/brand-icons.mjs`
Expected: `wrote 38 brand icons to public\icons\brands` (or with `/` separators), and `public/icons/brands/googlesheets.svg` now exists.

- [ ] **Step 4: Testimonials data and component**

Replace `data/testimonials.ts`:

```ts
/**
 * Kraft ships no real quotes (KraftScreens.dc.html:614-618, "Nothing on this
 * page is fabricated"). Every field stays a PLACEHOLDER until a real client
 * says it. The same goes for the video, the poster and its length.
 */
export type Client = {
  n: string
  name: string
  role: string
  tag: string
  quote: string
  tags: string[]
  video: { src: string; poster: string; duration: string }
}

export const CLIENTS: Client[] = ['01', '02', '03'].map((n) => ({
  n,
  name: 'PLACEHOLDER - client name',
  role: 'PLACEHOLDER - role · company',
  tag: 'PLACEHOLDER - scope',
  quote: 'PLACEHOLDER - a real client quote. Nothing on this page is fabricated.',
  tags: ['PLACEHOLDER - tag', 'PLACEHOLDER - tag', 'PLACEHOLDER - tag'],
  video: {
    src: `PLACEHOLDER - testimonial video ${n} (a /public path or URL)`,
    poster: `PLACEHOLDER - testimonial video ${n} poster (4:5)`,
    duration: 'PLACEHOLDER - length, e.g. 1:24',
  },
}))

/** Testimonials page copy, verbatim (KraftScreens.dc.html:327-392). */
export const testimonialsPage = {
  title: ['The people who', 'kept me on.'] as const,
  lede: 'Hear it from them, then read what I actually hold in each account. Every quote below is a placeholder until you drop the real one in.',
  featured: 'FEATURED',
  play: 'Play testimonial',
  posterHint: 'Drop the testimonial video poster',
  caption: 'Client testimonial',
  noLength: '[0:00]',
  tapToPlay: 'TAP TO PLAY',
  tab: 'Testimonial',
}
```

Create `components/testimonials/Testimonials.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { PlayIcon, QuotesIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import Shot from '@/components/ui/Shot'
import { CARD, TAG } from '@/components/ui/styles'
import { CLIENTS, testimonialsPage as t } from '@/data/testimonials'
import { isPlaceholder } from '@/lib/placeholder'

/**
 * Kraft's testimonials (KraftScreens.dc.html:335-390). On the left, a video
 * player with a tab per client. On the right, the picked client's quote
 * featured above every client's card. Until a video exists, the player shows
 * Kraft's empty poster slot with its play button disabled. The caption sits
 * on a dark fade, so it uses the stage ink in both themes.
 */
export default function Testimonials() {
  const [pick, setPick] = useState(0)
  const c = CLIENTS[pick]
  const hasVideo = !isPlaceholder(c.video.src)
  const length = isPlaceholder(c.video.duration) ? t.noLength : c.video.duration
  return (
    <Frame lit={{ x: '78%', alpha: 0.55, stop: '56%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
      <div className="flex min-w-[250px] flex-[1_1_320px] flex-col gap-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[20px] border border-b1 bg-s0">
          {hasVideo ? (
            <video
              key={c.video.src}
              src={c.video.src}
              poster={isPlaceholder(c.video.poster) ? undefined : c.video.poster}
              controls
              playsInline
              preload="none"
              aria-label={`${t.caption} ${c.n}`}
              className="absolute inset-0 size-full object-cover"
            />
          ) : (
            <>
              <Shot src={c.video.poster} hint={t.posterHint} />
              <div aria-hidden className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-45% to-poster-fade" />
              <button
                type="button"
                disabled
                aria-label={t.play}
                className="absolute top-1/2 left-1/2 grid size-[66px] -translate-1/2 cursor-not-allowed place-items-center rounded-full bg-accent text-2xl text-on-accent shadow-[0_16px_40px_-12px_var(--glow)]"
              >
                <PlayIcon weight="fill" aria-hidden />
              </button>
              <div className="pointer-events-none absolute inset-x-[18px] bottom-4 flex flex-col gap-1 text-veil-ink">
                <span className="text-[15px] font-semibold">
                  {t.caption} {c.n}
                </span>
                <span className="font-mono text-[9.5px] tracking-[.1em] opacity-80">
                  {length} · {t.tapToPlay}
                </span>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {CLIENTS.map((cl, i) => (
            <button
              key={cl.n}
              type="button"
              aria-pressed={i === pick}
              onClick={() => setPick(i)}
              className={`min-h-11 flex-[1_1_110px] cursor-pointer rounded-xl border px-3 py-2.5 text-xs font-medium text-ink-soft transition-colors duration-250 ${i === pick ? 'border-wash-b bg-wash' : 'border-b1 bg-s0 hover:border-b2'}`}
            >
              {t.tab} {cl.n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-w-[260px] flex-[2_1_420px] flex-col gap-[clamp(11px,1.3cqw,16px)]">
        <div className={`${CARD} flex flex-col gap-3.5 p-[clamp(16px,1.8cqw,24px)]`}>
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{t.featured}</span>
          <p className="text-[clamp(15px,1.8cqw,21px)] leading-[1.45] tracking-[-.015em]">{c.quote}</p>
          <div className="flex flex-wrap items-center gap-3 border-t border-b1 pt-3">
            <span aria-hidden className="grid size-[38px] place-items-center rounded-xl border border-b1 bg-s3 font-mono text-[10px] text-ink3">
              {c.n}
            </span>
            <div className="flex flex-col gap-[3px]">
              <span className="text-sm font-semibold">{c.name}</span>
              <span className="font-mono text-[9.5px] tracking-[.06em] text-ink3">{c.role}</span>
            </div>
            <span className="ml-auto rounded-[9px] border border-wash-b bg-wash px-2.5 py-1.5 font-mono text-[9.5px] text-accent">{c.tag}</span>
          </div>
        </div>
        {CLIENTS.map((cl) => (
          <article
            key={cl.n}
            className="relative flex flex-wrap items-start gap-3.5 overflow-hidden rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 p-[18px] transition-[border-color,translate] duration-350 hover:-translate-y-0.5 hover:border-b2"
          >
            <span aria-hidden className="absolute right-4 -bottom-2 text-[58px] leading-none font-extrabold tracking-[-.05em] text-wash">
              {cl.n}
            </span>
            <span aria-hidden className="grid size-[38px] shrink-0 place-items-center rounded-xl border border-b1 bg-s3">
              <QuotesIcon weight="fill" size={17} className="text-accent opacity-85" />
            </span>
            <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-2">
              <div className="flex flex-wrap items-center gap-[9px]">
                <h2 className="text-[15px] font-semibold">{cl.name}</h2>
                <span className="rounded-lg border border-wash-b bg-wash px-[9px] py-1 font-mono text-[9px] tracking-[.1em] text-accent">{cl.role}</span>
              </div>
              <p className="relative text-[13px] leading-[1.55] text-ink3">{cl.quote}</p>
              <div className="flex flex-wrap gap-1.5">
                {cl.tags.map((tag, i) => (
                  <span key={`${cl.n}-${i}`} className={TAG}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Frame>
  )
}
```

Replace `app/(site)/testimonials/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Testimonials from '@/components/testimonials/Testimonials'
import PageHeader from '@/components/ui/PageHeader'
import { testimonialsPage } from '@/data/testimonials'

export const metadata: Metadata = { title: 'Testimonials' }

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/testimonials" title={testimonialsPage.title} lede={testimonialsPage.lede} ledeClassName="max-w-[820px]" />
      <Testimonials />
    </section>
  )
}
```

- [ ] **Step 5: About data and components**

Create `data/about.ts`:

```ts
import type { Brand } from './stack'

/** Kraft's About screen, verbatim (KraftScreens.dc.html:393-461; roles at :644-653). */
export type Role = { n: string; name: string; line: string; logos: Brand[] }

const b = (name: string, slug: string): Brand => ({ name, slug })

export const ROLES: Role[] = [
  { n: '01', name: 'Full Stack Developer', line: 'Interface to database, one pair of hands.', logos: [b('React', 'react'), b('TypeScript', 'typescript'), b('Node.js', 'nodedotjs'), b('PostgreSQL', 'postgresql')] },
  { n: '02', name: 'AI Automation Engineer', line: 'Agents and workflows wired to real systems.', logos: [b('n8n', 'n8n'), b('Zapier', 'zapier'), b('Claude', 'claude'), b('Google Sheets', 'googlesheets')] },
  { n: '03', name: 'AI Web Dev', line: 'AI does the typing; the architecture stays mine.', logos: [b('Next.js', 'nextdotjs'), b('Tailwind', 'tailwindcss'), b('Cloudflare', 'cloudflare'), b('GitHub', 'github')] },
  { n: '04', name: 'Systems Builder', line: 'CRM, dashboards and the plumbing between them.', logos: [b('Supabase', 'supabase'), b('Airtable', 'airtable'), b('Figma', 'figma'), b('Notion', 'notion')] },
]

export const about = {
  title: ["Hi, I'm Justine."] as const,
  lede: 'I build the systems that keep working when nobody is watching them.',
  intro: {
    heading: 'I care about the parts nobody demos.',
    aside: 'The retry. The log line. The empty state.',
    lead: 'Kraft is how I work',
    body: ' — full-stack development, AI automation and workflow engineering under one roof. I use AI heavily to move faster, and I keep the architecture, the decisions and the accountability firmly human.',
    story:
      'I started by building software from the ground up, taking on projects where I had to own both the code and the outcome. I got tired of fragile systems, repetitive manual work, and polished demos that fell apart in production—so now I build reliable software, AI automations, and workflows designed for what happens after the demo.',
  },
  image: {
    src: '/assets/about-workstation.gif',
    alt: 'Animated pixel-art illustration of a late-night developer workstation',
    width: 1920,
    height: 1080,
    caption: 'THE WORKSTATION · ALWAYS ON',
  },
  certified: 'CERTIFIED',
  location: { title: 'Based in Manila, Philippines', detail: 'GMT+8 · US / EU / CA OVERLAP' },
}
```

Create `components/about/Intro.tsx`:

```tsx
import { CARD } from '@/components/ui/styles'
import { about } from '@/data/about'

/** "I care about the parts nobody demos." (KraftScreens.dc.html:403-407) */
export default function Intro() {
  const i = about.intro
  return (
    <div className={`${CARD} flex flex-col gap-3.5 p-[clamp(16px,1.8cqw,24px)]`}>
      <h2 className="text-[clamp(18px,2.4cqw,28px)] leading-[1.25] font-bold tracking-[-.03em]">
        {i.heading} <span className="text-ink3">{i.aside}</span>
      </h2>
      <p className="text-[13.5px] leading-[1.6] text-ink2">
        <strong className="font-semibold text-ink">{i.lead}</strong>
        {i.body}
      </p>
      <p className="text-[13.5px] leading-[1.6] text-ink3">{i.story}</p>
    </div>
  )
}
```

Create `components/about/Roles.tsx`:

```tsx
import Image from 'next/image'
import { CARD } from '@/components/ui/styles'
import { ROLES } from '@/data/about'
import { brandIcon } from '@/data/stack'

/** Kraft's logo fan per role (KraftScreens.dc.html:1164-1181): stacked at rest, fanned while the row is hovered. */
const POSE = [
  'z-10 group-hover/role:[transform:translateY(-6px)_rotate(-10.5deg)_scale(1.08)]',
  'z-9 -ml-[13px] delay-45 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(-3.5deg)_scale(1.08)]',
  'z-8 -ml-[13px] delay-90 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(3.5deg)_scale(1.08)]',
  'z-7 -ml-[13px] delay-135 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(10.5deg)_scale(1.08)]',
]

/** The four hats (KraftScreens.dc.html:409-424). */
export default function Roles() {
  return (
    <ul className={`${CARD} flex flex-col overflow-hidden`}>
      {ROLES.map((r) => (
        <li
          key={r.n}
          className="group/role flex items-center gap-[18px] border-b border-b1 px-[18px] py-3.5 transition-colors duration-300 last:border-b-0 hover:bg-hover"
        >
          <div aria-hidden className="flex shrink-0 items-center py-1">
            {r.logos.map((l, i) => (
              <span
                key={l.slug}
                className={`relative grid size-[31px] shrink-0 place-items-center rounded-[10px] bg-logo-chip shadow-(--logo-shadow) transition-[transform,margin-left] duration-380 ease-[cubic-bezier(.2,.8,.2,1)] ${POSE[i]}`}
              >
                <Image src={brandIcon(l.slug)} alt="" width={16} height={16} className="block" />
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <h3 className="text-[clamp(14px,1.7cqw,17px)] font-semibold tracking-[-.015em]">{r.name}</h3>
            <span className="text-xs text-ink3">{r.line}</span>
          </div>
          <span className="ml-auto shrink-0 font-mono text-xs text-ink3 transition-colors duration-300 group-hover/role:text-accent">{r.n}</span>
        </li>
      ))}
    </ul>
  )
}
```

Create `components/about/Certified.tsx`:

```tsx
import Image from 'next/image'
import { SealCheckIcon } from '@phosphor-icons/react/ssr'
import { ICON_TILE } from '@/components/ui/styles'
import { about } from '@/data/about'
import { CERTS } from '@/data/credentials'

/**
 * Kraft's certification chips (KraftScreens.dc.html:437-448, 1151-1163): a
 * logo that lifts and tilts, with its full name in a tooltip. Each chip takes
 * keyboard focus, so the tooltip is reachable without a mouse.
 */
export default function Certified() {
  return (
    <div className="flex min-w-[190px] flex-[1_1_210px] items-center gap-3.5 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-[17px] py-[15px]">
      <span aria-hidden className={ICON_TILE}>
        <SealCheckIcon size={18} />
      </span>
      <span className="shrink-0 font-mono text-[9.5px] tracking-[.14em] text-ink3">{about.certified}</span>
      <ul className="ml-auto flex items-center gap-2.5">
        {CERTS.map((c) => (
          <li key={c.name}>
            <span
              role="img"
              tabIndex={0}
              aria-label={c.name}
              className="group/cert relative grid size-11 cursor-default place-items-center rounded-[13px] bg-logo-chip shadow-(--cert-shadow) transition-transform duration-400 ease-[cubic-bezier(.2,.8,.2,1)] hover:[transform:translateY(-7px)_rotate(-5deg)_scale(1.1)] focus-visible:[transform:translateY(-7px)_rotate(-5deg)_scale(1.1)]"
            >
              <Image src={c.icon} alt="" width={26} height={26} className="block size-[26px] object-contain" />
              <span
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-[calc(100%+9px)] z-20 w-max max-w-[190px] translate-y-1.5 rounded-[9px] border border-b2 bg-s0 px-[11px] py-[7px] text-right font-mono text-[9.5px] leading-normal tracking-[.08em] text-ink opacity-0 shadow-(--tip-shadow) transition-[opacity,translate] duration-250 group-hover/cert:translate-y-0 group-hover/cert:opacity-100 group-focus-visible/cert:translate-y-0 group-focus-visible/cert:opacity-100"
              >
                {c.label}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

Create `components/about/Aside.tsx`:

```tsx
import Image from 'next/image'
import { MapPinIcon } from '@phosphor-icons/react/ssr'
import { ICON_TILE } from '@/components/ui/styles'
import { about } from '@/data/about'

/** The workstation GIF and its caption (KraftScreens.dc.html:430-436). */
export function Workstation() {
  const img = about.image
  return (
    <figure className="m-0 overflow-hidden rounded-[20px] border border-b1 bg-frame">
      <Image src={img.src} alt={img.alt} width={img.width} height={img.height} unoptimized className="block h-auto w-full" />
      <figcaption className="flex items-center gap-[9px] border-t border-b1 px-4 py-[13px]">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-[.1em] text-ink3">{img.caption}</span>
      </figcaption>
    </figure>
  )
}

/** Where Justine works from (KraftScreens.dc.html:449-455). */
export function Location() {
  return (
    <div className="flex min-w-[190px] flex-[1_1_210px] items-center gap-3 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-[17px] py-[15px]">
      <span aria-hidden className={ICON_TILE}>
        <MapPinIcon size={18} />
      </span>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[13px] font-semibold">{about.location.title}</span>
        <span className="font-mono text-[9.5px] tracking-[.06em] text-ink3">{about.location.detail}</span>
      </div>
    </div>
  )
}
```

Replace `app/(site)/about/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Location, Workstation } from '@/components/about/Aside'
import Certified from '@/components/about/Certified'
import Intro from '@/components/about/Intro'
import Roles from '@/components/about/Roles'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { about } from '@/data/about'

export const metadata: Metadata = { title: 'About' }

const COLUMN = 'flex flex-col gap-[clamp(11px,1.3cqw,16px)]'

export default function Page() {
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/about" title={about.title} lede={about.lede} ledeClassName="max-w-[560px]" />
      <Frame lit={{ x: '82%', alpha: 0.6, stop: '58%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${COLUMN} min-w-[260px] flex-[1_1_360px]`}>
          <Intro />
          <Roles />
        </div>
        <div className={`${COLUMN} min-w-[250px] flex-[1_1_300px]`}>
          <Workstation />
          <div className="flex flex-wrap gap-[clamp(11px,1.3cqw,16px)]">
            <Certified />
            <Location />
          </div>
        </div>
      </Frame>
    </section>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/testimonials.test.tsx tests/about.test.tsx tests/home-data.test.ts tests/Bento.test.tsx`
Expected: PASS. The Home tests still pass, because `CLIENTS` only gained a field.

- [ ] **Step 7: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add data/testimonials.ts data/about.ts components/testimonials components/about scripts/brand-icons.mjs public/icons/brands/googlesheets.svg "app/(site)/testimonials/page.tsx" "app/(site)/about/page.tsx" tests/testimonials.test.tsx tests/about.test.tsx
git commit -m "feat: Testimonials (player, tabs, featured quote) and About (roles, workstation, certifications)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: FAQs / Contact — the form, the FAQs and the mail-client flow

**Files:**
- Create: `data/contact.ts`, `data/faqs.ts`, `lib/contact.ts`, `components/contact/ContactForm.tsx`, `components/contact/Faqs.tsx`, `components/contact/Availability.tsx`, `e2e/contact.spec.ts`
- Modify: `app/(site)/contact/page.tsx`
- Test: `tests/contact-lib.test.ts`, `tests/ContactForm.test.tsx`, `tests/Faqs.test.tsx`

**Interfaces:**
- Consumes:
  - `profile.email` (PLACEHOLDER), `profile.availability`, `profile.tzLabel`, `profile.socials`
  - `PageHeader`, `Frame`, `CARD` (Task 1)
- Produces:
  - `contact`: `.title`, `.lede`, `.fields`, `.errors`, `.submit`, `.sending`, `.note`, `.sent`, `.faqs = { id: 'faqs', label: 'Quick answers', … }`, `.availability`
  - `FAQS: { q: string; a: string }[]`
  - `ENDPOINT`, `MAX_NAME = 80`, `MAX_EMAIL = 254`, `MAX_MESSAGE = 5000`, `sanitize`, `EMAIL_RE`
  - `type Lead`, `type Field`, `FIELDS`, `checkLead(data: FormData)`, which returns `{ lead: Lead; errors: null } | { lead: null; errors: Partial<Record<Field, string>> }`
  - `mailtoHref(lead, to?)`, `SubmitError`, `type Via = 'webhook' | 'mailto'`, `submitLead(lead, { endpoint?, open? }): Promise<Via>`
  - `ContactForm({ endpoint?, open? })`: the props exist for tests; the page passes none
  - Section id `#faqs`

- [ ] **Step 1: Write the failing tests**

Create `tests/contact-lib.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { contact } from '@/data/contact'
import { checkLead, mailtoHref, MAX_MESSAGE, submitLead } from '@/lib/contact'

const GOOD = { firstName: 'Ana', lastName: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.' }
const form = (fields: Record<string, string>) => {
  const d = new FormData()
  for (const [k, v] of Object.entries(fields)) d.set(k, v)
  return d
}

describe('checkLead', () => {
  it('accepts a complete message', () => {
    const r = checkLead(form(GOOD))
    expect(r.errors).toBeNull()
    expect(r.lead).toMatchObject(GOOD)
  })

  it('names every missing field', () => {
    expect(checkLead(form({})).errors).toEqual({
      firstName: contact.errors.firstName,
      lastName: contact.errors.lastName,
      email: contact.errors.email,
      message: contact.errors.message,
    })
  })

  it('rejects an email that does not look like one', () => {
    expect(checkLead(form({ ...GOOD, email: 'ana@' })).errors).toEqual({ email: contact.errors.emailFormat })
  })

  it('strips control and zero-width characters, keeping newlines in the message', () => {
    const r = checkLead(form({ ...GOOD, firstName: 'A​na\u0007', message: 'line one\nline two\u0000' }))
    expect(r.lead?.firstName).toBe('Ana')
    expect(r.lead?.message).toBe('line one\nline two')
  })

  it('caps an overlong message', () => {
    expect(checkLead(form({ ...GOOD, message: 'x'.repeat(6000) })).lead?.message).toHaveLength(MAX_MESSAGE)
  })
})

describe('mailtoHref', () => {
  it('encodes every value, so a message cannot add mail headers or parameters', () => {
    const href = mailtoHref({ ...GOOD, website: '', firstName: 'Ana\r\nBcc: x@y.z', message: 'a&cc=b' }, 'me@kraft.dev')
    expect(href.startsWith('mailto:me%40kraft.dev?subject=')).toBe(true)
    expect(href).not.toMatch(/[\r\n]/)
    expect(href).not.toContain('&cc=')
  })
})

describe('submitLead', () => {
  afterEach(() => vi.unstubAllGlobals())
  const lead = { ...GOOD, website: '' }

  it('opens the mail client when no endpoint is set', async () => {
    const open = vi.fn()
    await expect(submitLead(lead, { endpoint: '', open })).resolves.toBe('mailto')
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/))
  })

  it('posts the lead as JSON to the endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    await expect(submitLead(lead, { endpoint: 'https://hooks.example/lead' })).resolves.toBe('webhook')
    expect(fetch).toHaveBeenCalledWith(
      'https://hooks.example/lead',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(lead) }),
    )
  })

  it("shows the server's own sentence when it refuses", async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Try again in a minute.' }), { status: 429 })))
    await expect(submitLead(lead, { endpoint: 'https://x.example' })).rejects.toThrow('Try again in a minute.')
  })

  it('falls back to the status when the server gives no sentence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })))
    await expect(submitLead(lead, { endpoint: 'https://x.example' })).rejects.toThrow('The server answered 500.')
  })
})
```

Create `tests/ContactForm.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import ContactForm from '@/components/contact/ContactForm'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'

const GOOD = { first: 'Ana', last: 'Reyes', email: 'ana@example.com', message: 'Our intake is manual.' }
const f = contact.fields
const submit = () => screen.getByRole('button', { name: new RegExp(contact.submit) })

async function fill(user: UserEvent) {
  await user.type(screen.getByLabelText(f.firstName.label), GOOD.first)
  await user.type(screen.getByLabelText(f.lastName.label), GOOD.last)
  await user.type(screen.getByLabelText(f.email.label), GOOD.email)
  await user.type(screen.getByLabelText(f.message.label), GOOD.message)
}

describe('ContactForm', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('names each missing field and focuses the first one', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await user.click(submit())
    const first = screen.getByLabelText(f.firstName.label)
    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(first).toHaveAccessibleDescription(contact.errors.firstName)
    expect(first).toHaveFocus()
    expect(screen.getByLabelText(f.email.label)).toHaveAccessibleDescription(contact.errors.email)
  })

  it('clears an error as soon as the field is fixed', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await user.click(submit())
    await user.type(screen.getByLabelText(f.firstName.label), 'Ana')
    expect(screen.getByLabelText(f.firstName.label)).not.toHaveAttribute('aria-invalid')
    expect(screen.getByLabelText(f.lastName.label)).toHaveAttribute('aria-invalid', 'true')
  })

  it('queues the message in the mail app and offers the address as a fallback', async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    render(<ContactForm open={open} />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('heading', { name: contact.sent.title })).toHaveFocus()
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^mailto:/))
    expect(screen.getByText(contact.sent.mailto)).toBeInTheDocument()
    expect(screen.getByText(profile.email)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: contact.sent.copy })).toBeInTheDocument()
  })

  it('keeps what was typed when the endpoint refuses, and shows why', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Inbox is full.' }), { status: 503 })))
    const user = userEvent.setup()
    render(<ContactForm endpoint="https://hooks.example/lead" />)
    await fill(user)
    await user.click(submit())
    expect(await screen.findByRole('alert')).toHaveTextContent('Inbox is full.')
    expect(screen.getByLabelText(f.firstName.label)).toHaveValue(GOOD.first)
    expect(screen.getByLabelText(f.message.label)).toHaveValue(GOOD.message)
  })

  it('Send another brings back an empty form, ready to type', async () => {
    const user = userEvent.setup()
    render(<ContactForm open={vi.fn()} />)
    await fill(user)
    await user.click(submit())
    await user.click(await screen.findByRole('button', { name: contact.sent.again }))
    const first = screen.getByLabelText(f.firstName.label)
    expect(first).toHaveValue('')
    expect(first).toHaveFocus()
  })
})
```

Create `tests/Faqs.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Faqs from '@/components/contact/Faqs'
import { FAQS } from '@/data/faqs'

describe('Faqs', () => {
  it("opens Kraft's first answer, and one at a time after that", () => {
    render(<Faqs />)
    const [q1, q2] = screen.getAllByRole('button')
    expect(q1).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(FAQS[0].a)).toBeVisible()
    fireEvent.click(q2)
    expect(q2).toHaveAttribute('aria-expanded', 'true')
    expect(q1).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(q2.getAttribute('aria-controls')!)).toHaveTextContent(FAQS[1].a)
    fireEvent.click(q2)
    expect(q2).toHaveAttribute('aria-expanded', 'false')
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/contact-lib.test.ts tests/ContactForm.test.tsx tests/Faqs.test.tsx`
Expected: FAIL with "Failed to resolve import '@/data/contact'".

- [ ] **Step 3: Contact copy and FAQs**

Create `data/faqs.ts`:

```ts
/** Kraft's five questions, verbatim (KraftScreens.dc.html:655-661). */
export const FAQS: { q: string; a: string }[] = [
  { q: 'What do you actually build?', a: 'I design and build intelligent digital systems that help businesses scale. From AI agents and automation with n8n, Zapier, and Make to CRM systems, funnels, custom websites, internal tools, and APIs, I connect the technology that powers modern operations.' },
  { q: 'How fast can you start?', a: 'Same week for small fixes. Larger builds get a kickoff call within 48 hours. I work Manila time and overlap most CA, US and EU schedules.' },
  { q: 'How much do you charge?', a: 'Depends on the build. We hop on a discovery call so I can see the actual problem, then I send a written proposal with scope and price. No padded estimates.' },
  { q: 'What happens after I write?', a: 'I read it the same day and reply within one business day. You get a plan if I can automate it, or a straight no if I cannot.' },
  { q: 'Do you maintain what you build?', a: 'Optionally. Every handover includes documentation and full access, so maintenance is a choice rather than a dependency.' },
]
```

Create `data/contact.ts`:

```ts
/**
 * FAQs / Contact copy, verbatim from KraftScreens.dc.html:464-554, except
 * two new pieces:
 * - The validation messages.
 * - The Message-queued body, rewritten to be true for the mail-client flow
 *   (spec §9), plus its "nothing opened?" fallback (spec §12).
 */
export const contact = {
  title: ["Tell me what you're", 'building.'] as const,
  lede: "Describe the bottleneck. If it can be automated or built, you get a plan back. If it can't, I'll say so.",
  fields: {
    firstName: { label: 'FIRST NAME', placeholder: 'Justine' },
    lastName: { label: 'LAST NAME', placeholder: 'Acosta' },
    email: { label: 'EMAIL', placeholder: 'you@yourbusiness.com' },
    message: { label: 'WHAT ARE YOU RUNNING INTO?', placeholder: 'Where does the work pile up? What are you running it on today?' },
  },
  errors: {
    firstName: 'Add your first name.',
    lastName: 'Add your last name.',
    email: 'Add an email I can reply to.',
    emailFormat: 'That email doesn’t look right.',
    message: 'Tell me what you’re running into.',
    failed: 'That did not go through. Email me directly instead.',
  },
  submit: 'Send it',
  sending: 'Sending',
  note: 'One business day. No newsletter, no drip.',
  sent: {
    title: 'Message queued.',
    mailto: "Your email app should have opened with the message ready. Hit send there, and I'll reply within one business day.",
    webhook: "It's in my inbox. I'll reply within one business day.",
    fallback: 'Nothing opened? Write to',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Select it to copy',
    again: 'Send another',
  },
  faqs: {
    id: 'faqs',
    label: 'Quick answers',
    kicker: 'FAQS',
    title: 'Quick answers.',
    aside: 'Still have one? Write it in the form.',
  },
  availability: { hours: 'HOURS COVERED', linkedin: 'Connect on LinkedIn' },
}
```

- [ ] **Step 4: Write `lib/contact.ts`**

```ts
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'

/**
 * Contact without a backend (spec §6, §12), ported from kape's lib/contact.ts.
 * By default a valid message opens the visitor's mail client, addressed to
 * profile.email. Set NEXT_PUBLIC_CONTACT_ENDPOINT to a URL that accepts a
 * JSON POST of `Lead`, and it is sent there instead. A non-2xx answer with
 * { "error": "…" } shows that sentence to the visitor.
 */
export const ENDPOINT: string = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT ?? ''

export const MAX_NAME = 80
export const MAX_EMAIL = 254
export const MAX_MESSAGE = 5000

// Built from \u escapes so the source stays pure ASCII. Control characters
// always go; the message keeps tab, LF and CR. Zero-width and bidi marks go too.
const CTRL_NO_NL = new RegExp('[\\u0000-\\u001F\\u007F]', 'g')
const CTRL_KEEP_NL = new RegExp('[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]', 'g')
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200F\\u202A-\\u202E\\u2060\\uFEFF]', 'g')

export function sanitize(input: string, allowNewlines = false): string {
  return input.replace(allowNewlines ? CTRL_KEEP_NL : CTRL_NO_NL, '').replace(ZERO_WIDTH, '')
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type Lead = {
  firstName: string
  lastName: string
  email: string
  message: string
  /** Honeypot. Empty for a person; a backend should drop anything else. */
  website: string
}
export type Field = 'firstName' | 'lastName' | 'email' | 'message'
export const FIELDS: Field[] = ['firstName', 'lastName', 'email', 'message']
export type Errors = Partial<Record<Field, string>>

/** Reads, trims, caps and sanitises the form, and names every field that needs fixing. */
export function checkLead(data: FormData): { lead: Lead; errors: null } | { lead: null; errors: Errors } {
  const read = (k: string) => String(data.get(k) ?? '').trim()
  const lead: Lead = {
    firstName: sanitize(read('firstName')).slice(0, MAX_NAME),
    lastName: sanitize(read('lastName')).slice(0, MAX_NAME),
    email: sanitize(read('email')).slice(0, MAX_EMAIL),
    message: sanitize(read('message'), true).slice(0, MAX_MESSAGE),
    website: String(data.get('website') ?? ''),
  }
  const e = contact.errors
  const errors: Errors = {}
  if (!lead.firstName) errors.firstName = e.firstName
  if (!lead.lastName) errors.lastName = e.lastName
  if (!lead.email) errors.email = e.email
  else if (!EMAIL_RE.test(lead.email)) errors.email = e.emailFormat
  if (!lead.message) errors.message = e.message
  return Object.keys(errors).length ? { lead: null, errors } : { lead, errors: null }
}

/** The mail-client link. Every value is encoded, which blocks header injection (CR/LF) and parameter smuggling (& or ?). */
export function mailtoHref(lead: Lead, to: string = profile.email): string {
  const subject = `Project inquiry from ${lead.firstName} ${lead.lastName}`
  const body = [`Name: ${lead.firstName} ${lead.lastName}`, `Email: ${lead.email}`, '', lead.message].join('\n')
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export class SubmitError extends Error {}
export type Via = 'webhook' | 'mailto'

type Options = { endpoint?: string; open?: (url: string) => void }

export async function submitLead(
  lead: Lead,
  {
    endpoint = ENDPOINT,
    open = (url) => {
      window.location.href = url
    },
  }: Options = {},
): Promise<Via> {
  if (endpoint) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: unknown } | null
      const said = typeof body?.error === 'string' && body.error ? body.error : ''
      throw new SubmitError(said || `The server answered ${res.status}.`)
    }
    return 'webhook'
  }
  open(mailtoHref(lead))
  return 'mailto'
}
```

- [ ] **Step 5: Write the form, the FAQs and the availability row**

Create `components/contact/ContactForm.tsx`:

```tsx
'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRightIcon, CheckCircleIcon, CopyIcon, WarningCircleIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import {
  checkLead, FIELDS, MAX_EMAIL, MAX_MESSAGE, MAX_NAME, SubmitError, submitLead,
  type Errors, type Field, type Via,
} from '@/lib/contact'

type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'error'; note: string } | { kind: 'sent'; via: Via }
type Props = { endpoint?: string; open?: (url: string) => void }

const LABEL = 'font-mono text-[9.5px] tracking-[.14em] text-ink3'
const INPUT =
  'min-h-[46px] rounded-xl border border-b1 bg-field px-3.5 py-3 text-sm outline-none transition-[border-color,box-shadow] duration-250 focus:border-b2 focus:shadow-[0_0_0_3px_var(--wash)] aria-[invalid=true]:border-danger-b'

/**
 * Kraft's contact form (KraftScreens.dc.html:474-519) wired through
 * lib/contact.ts:
 * - Checked on submit. After that, re-checked as the visitor types, so
 *   each error clears the moment its field is fixed.
 * - The first bad field takes focus.
 * - A refused send keeps everything typed and shows the server's reason.
 */
export default function ContactForm({ endpoint, open }: Props) {
  const f = contact.fields
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [errors, setErrors] = useState<Errors>({})
  const form = useRef<HTMLFormElement>(null)
  const checked = useRef(false)
  const again = useRef(false)

  useEffect(() => {
    if (status.kind !== 'idle' || !again.current) return
    again.current = false
    form.current?.querySelector<HTMLInputElement>('input[name="firstName"]')?.focus()
  }, [status])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    checked.current = true
    const result = checkLead(new FormData(el))
    if (!result.lead) {
      setErrors(result.errors)
      const first = FIELDS.find((k) => result.errors[k])
      el.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
      return
    }
    setErrors({})
    setStatus({ kind: 'sending' })
    try {
      setStatus({ kind: 'sent', via: await submitLead(result.lead, { endpoint, open }) })
    } catch (err) {
      setStatus({ kind: 'error', note: err instanceof SubmitError ? err.message : contact.errors.failed })
    }
  }

  const recheck = () => {
    if (!checked.current || !form.current) return
    setErrors(checkLead(new FormData(form.current)).errors ?? {})
  }

  if (status.kind === 'sent') {
    return (
      <Sent
        via={status.via}
        onAgain={() => {
          checked.current = false
          again.current = true
          setStatus({ kind: 'idle' })
        }}
      />
    )
  }

  const described = (k: Field) => (errors[k] ? { 'aria-invalid': true, 'aria-describedby': `contact-${k}-error` } : {})
  const error = (k: Field) =>
    errors[k] && (
      <p id={`contact-${k}-error`} className="flex items-center gap-1.5 text-xs text-ink2">
        <WarningCircleIcon size={14} aria-hidden className="shrink-0 text-danger" />
        {errors[k]}
      </p>
    )

  return (
    <form ref={form} onSubmit={onSubmit} onChange={recheck} noValidate className="relative flex flex-col gap-3.5">
      {/* Honeypot: hidden from people and assistive tech; a bot that fills every field trips it. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
      <div className="flex flex-wrap gap-3.5">
        <div className="flex min-w-[150px] flex-[1_1_180px] flex-col gap-[7px]">
          <label htmlFor="contact-firstName" className={LABEL}>{f.firstName.label}</label>
          <input id="contact-firstName" name="firstName" type="text" autoComplete="given-name" maxLength={MAX_NAME} placeholder={f.firstName.placeholder} className={INPUT} {...described('firstName')} />
          {error('firstName')}
        </div>
        <div className="flex min-w-[150px] flex-[1_1_180px] flex-col gap-[7px]">
          <label htmlFor="contact-lastName" className={LABEL}>{f.lastName.label}</label>
          <input id="contact-lastName" name="lastName" type="text" autoComplete="family-name" maxLength={MAX_NAME} placeholder={f.lastName.placeholder} className={INPUT} {...described('lastName')} />
          {error('lastName')}
        </div>
      </div>
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="contact-email" className={LABEL}>{f.email.label}</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={MAX_EMAIL} placeholder={f.email.placeholder} className={INPUT} {...described('email')} />
        {error('email')}
      </div>
      <div className="flex flex-col gap-[7px]">
        <label htmlFor="contact-message" className={LABEL}>{f.message.label}</label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={MAX_MESSAGE}
          placeholder={f.message.placeholder}
          className={`${INPUT} min-h-[180px] resize-y leading-[1.55] shell:min-h-[337px]`}
          {...described('message')}
        />
        {error('message')}
      </div>
      <div className="flex flex-wrap items-center gap-3.5 pt-1">
        <button
          type="submit"
          disabled={status.kind === 'sending'}
          className="flex min-h-12 cursor-pointer items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)] disabled:cursor-wait disabled:opacity-70"
        >
          {status.kind === 'sending' ? contact.sending : contact.submit} <ArrowRightIcon size={16} aria-hidden />
        </button>
        {status.kind === 'error' ? (
          <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-ink2">
            <WarningCircleIcon size={16} aria-hidden className="shrink-0 text-danger" />
            {status.note}
          </p>
        ) : (
          <span className="text-[12.5px] text-ink3">{contact.note}</span>
        )}
      </div>
    </form>
  )
}

/** Kraft's "Message queued." card (KraftScreens.dc.html:475-482), truthful for how the message left. */
function Sent({ via, onAgain }: { via: Via; onAgain: () => void }) {
  const s = contact.sent
  const heading = useRef<HTMLHeadingElement>(null)
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')

  useEffect(() => {
    heading.current?.focus()
  }, [])

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopy('done')
    } catch {
      setCopy('failed')
    }
  }

  return (
    <div role="status" className="flex min-h-80 animate-rise flex-col items-start justify-center gap-3.5">
      <span aria-hidden className="grid size-[54px] place-items-center rounded-full border border-wash-b bg-wash text-[26px] text-accent">
        <CheckCircleIcon />
      </span>
      <h2 ref={heading} tabIndex={-1} className="text-[22px] font-bold tracking-[-.03em] outline-none">
        {s.title}
      </h2>
      <p className="max-w-[340px] text-[13.5px] leading-[1.55] text-ink3">{via === 'mailto' ? s.mailto : s.webhook}</p>
      {via === 'mailto' && (
        <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink3">
          {s.fallback} <span className="font-mono break-all text-ink2 select-all">{profile.email}</span>
          <button
            type="button"
            onClick={copyAddress}
            className="flex min-h-9 cursor-pointer items-center gap-1.5 rounded-[10px] border border-b1 px-2.5 py-1.5 text-xs text-ink2 transition-colors duration-250 hover:border-b2"
          >
            <CopyIcon size={14} aria-hidden />
            {copy === 'done' ? s.copied : copy === 'failed' ? s.copyFailed : s.copy}
          </button>
        </p>
      )}
      <button
        type="button"
        onClick={onAgain}
        className="min-h-11 cursor-pointer rounded-xl border border-b2 bg-transparent px-[18px] py-[11px] text-[13px] font-medium text-ink transition-colors duration-300 hover:bg-hover"
      >
        {s.again}
      </button>
    </div>
  )
}
```

Create `components/contact/Faqs.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react/ssr'
import { FAQS } from '@/data/faqs'

/** Kraft's FAQ accordion (KraftScreens.dc.html:525-538, 1202-1207): the first answer open, one at a time. */
export default function Faqs() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <ul className="mt-3.5 flex flex-col">
      {FAQS.map((item, i) => {
        const on = open === i
        const n = String(i + 1).padStart(2, '0')
        const Caret = on ? CaretUpIcon : CaretDownIcon
        return (
          <li key={item.q} className="border-b border-b1">
            <h3>
              <button
                type="button"
                aria-expanded={on}
                aria-controls={`faq-${n}`}
                onClick={() => setOpen(on ? null : i)}
                className="flex min-h-[52px] w-full cursor-pointer items-start gap-3.5 border-0 bg-transparent px-0.5 py-[15px] text-left"
              >
                <span aria-hidden className="shrink-0 font-mono text-[10.5px] leading-[1.45] text-accent">{n}</span>
                <span className="text-[13.5px] leading-[1.35] font-semibold text-ink-soft">{item.q}</span>
                <Caret aria-hidden className={`ml-auto shrink-0 text-[15px] transition-colors duration-250 ${on ? 'text-accent' : 'text-ink3'}`} />
              </button>
            </h3>
            <div id={`faq-${n}`} hidden={!on} className="mr-1.5 mb-4 ml-[38px] animate-rise text-[12.5px] leading-[1.65] whitespace-pre-line text-ink3">
              <p>{item.a}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
```

Create `components/contact/Availability.tsx`:

```tsx
import { LinkedinLogoIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'

/** Availability and LinkedIn (KraftScreens.dc.html:540-549). A PLACEHOLDER profile link points at # and never opens a new tab. */
export default function Availability() {
  const linkedin = profile.socials.find((s) => s.label === 'LinkedIn')!
  const real = !isPlaceholder(linkedin.href)
  return (
    <div className="mt-auto flex flex-wrap items-center gap-3.5 pt-6">
      <div className="mr-auto flex items-center gap-[9px]">
        <span aria-hidden className="size-[7px] shrink-0 animate-pulse-dot rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] text-ink2">
            {profile.availability.label} · {profile.tzLabel}
          </span>
          <span className="font-mono text-[9.5px] tracking-[.1em] text-ink3">
            {profile.availability.regions.join(' · ')} {contact.availability.hours}
          </span>
        </div>
      </div>
      <a
        href={real ? linkedin.href : '#'}
        {...(real ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-label={contact.availability.linkedin}
        className="grid size-[46px] place-items-center rounded-full border border-b1 bg-s0 text-ink2 transition-[color,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-b2 hover:text-accent"
      >
        <LinkedinLogoIcon size={19} aria-hidden />
      </a>
    </div>
  )
}
```

Replace `app/(site)/contact/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Availability from '@/components/contact/Availability'
import ContactForm from '@/components/contact/ContactForm'
import Faqs from '@/components/contact/Faqs'
import Frame from '@/components/ui/Frame'
import PageHeader from '@/components/ui/PageHeader'
import { CARD } from '@/components/ui/styles'
import { contact } from '@/data/contact'

export const metadata: Metadata = { title: 'FAQs / Contact' }

export default function Page() {
  const q = contact.faqs
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)]">
      <PageHeader href="/contact" title={contact.title} lede={contact.lede} ledeClassName="max-w-[560px]" />
      <Frame lit={{ x: '72%', alpha: 0.6, stop: '56%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${CARD} min-w-[260px] flex-[2_1_380px] p-[clamp(16px,1.8cqw,24px)]`}>
          <ContactForm />
        </div>
        <section
          id={q.id}
          aria-labelledby="faqs-title"
          className={`${CARD} flex min-w-[250px] flex-[1_1_320px] scroll-mt-[88px] flex-col gap-1.5 p-[clamp(16px,1.8cqw,22px)]`}
        >
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{q.kicker}</span>
          <h2 id="faqs-title" className="text-[clamp(17px,2cqw,23px)] leading-[1.25] font-semibold tracking-[-.025em]">
            {q.title} <span className="block text-ink3">{q.aside}</span>
          </h2>
          <Faqs />
          <Availability />
        </section>
      </Frame>
    </section>
  )
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/contact-lib.test.ts tests/ContactForm.test.tsx tests/Faqs.test.tsx tests/no-raw-colors.test.ts`
Expected: PASS.

- [ ] **Step 7: Add the e2e**

Create `e2e/contact.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

test('an empty send names the fields; a full one queues the message', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/contact')
  await hydrated(page)
  await page.getByRole('button', { name: /Send it/ }).click()
  await expect(page.getByLabel('FIRST NAME')).toBeFocused()
  await expect(page.getByText('Add your first name.')).toBeVisible()
  await page.getByLabel('FIRST NAME').fill('Ana')
  await page.getByLabel('LAST NAME').fill('Reyes')
  await page.getByLabel('EMAIL').fill('ana@example.com')
  await page.getByLabel('WHAT ARE YOU RUNNING INTO?').fill('Our intake is manual.')
  await page.getByRole('button', { name: /Send it/ }).click()
  await expect(page.getByRole('heading', { name: 'Message queued.' })).toBeVisible()
  await page.getByRole('button', { name: 'Send another' }).click()
  await expect(page.getByLabel('FIRST NAME')).toHaveValue('')
  expect(errors).toEqual([])
})

test('the FAQs open one at a time from the keyboard', async ({ page }) => {
  await page.goto('/contact')
  await hydrated(page)
  const second = page.getByRole('button', { name: /How fast can you start\?/ })
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(second).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('button', { name: /What do you actually build\?/ })).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByText(/^Same week for small fixes\./)).toBeVisible()
})
```

Run: `npx playwright test e2e/contact.spec.ts --project=desktop`
Expected: PASS (2 tests).

- [ ] **Step 8: Typecheck, lint, full suite, commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all clean and green.

```bash
git add data/contact.ts data/faqs.ts lib/contact.ts components/contact "app/(site)/contact/page.tsx" tests/contact-lib.test.ts tests/ContactForm.test.tsx tests/Faqs.test.tsx e2e/contact.spec.ts
git commit -m "feat: FAQs / Contact: validated form over mail client or endpoint, FAQ accordion, availability

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: ⌘K sections, phone checks and the Phase 3 visual pass

**Files:**
- Modify: `lib/commands.ts`, `tests/commands.test.ts`, `e2e/palette.spec.ts`, `e2e/phone.spec.ts`, `e2e/screenshots.spec.ts`
- Tune (after the screenshot review): any Phase 3 component or `app/globals.css`

**Interfaces:**
- Consumes:
  - `NAV`
  - `projects` and `PROJECT_VIEWS` (Task 3)
  - `servicesPage` (Task 5)
  - `contact.faqs` (Task 8)
  - `splitHref` (Task 2)
- Produces: `SECTIONS: Command[]`, with `COMMANDS = [...pages, ...SECTIONS]`

- [ ] **Step 1: Write the failing test**

In `tests/commands.test.ts`:

1. Replace the imports with:

```ts
import { describe, expect, it } from 'vitest'
import { NAV } from '@/data/nav'
import { PROJECT_VIEWS } from '@/data/projects'
import { COMMANDS, filterCommands, SECTIONS } from '@/lib/commands'
import { splitHref } from '@/lib/hash'
```

2. The hint test now finds the page and its sections, so change it to assert only that the page comes first:

```ts
  it("matches Kraft's hints too", () => {
    expect(filterCommands('builds')[0].href).toBe('/projects')
  })
```

3. Append:

```ts
describe('SECTIONS', () => {
  it('follow the pages, each a hash link on its page', () => {
    expect(COMMANDS.slice(0, NAV.length).map((c) => c.href)).toEqual(NAV.map((n) => n.href))
    expect(SECTIONS.map((s) => s.href)).toEqual([
      '/projects#reel', '/projects#build-plan', '/projects#support-desk', '/projects#agentic-framework',
      '/projects#end-to-end', '/projects#sites', '/projects#ai-agents',
      '/services#method', '/services#automation', '/contact#faqs',
    ])
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length)
  })

  it('point every Projects entry at a real sub-view', () => {
    for (const s of SECTIONS.filter((c) => c.href.startsWith('/projects#'))) {
      expect(PROJECT_VIEWS).toContain(splitHref(s.href).hash)
    }
  })

  it('find a sub-view by name', () => {
    expect(filterCommands('agentic').map((c) => c.href)).toEqual(['/projects#agentic-framework'])
    expect(filterCommands('quick answers').map((c) => c.href)).toEqual(['/contact#faqs'])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/commands.test.ts`
Expected: FAIL with "SECTIONS is not exported" (or undefined).

- [ ] **Step 3: Add the sections**

Replace `lib/commands.ts`:

```ts
import type { Icon } from '@phosphor-icons/react'
import { ChatCircleDotsIcon, LightningIcon, TreeStructureIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { NAV } from '@/data/nav'
import { projects, type ProjectView } from '@/data/projects'
import { servicesPage } from '@/data/services'

/** ⌘K entries (spec §7): every page, then the key sections. */
export type Command = { id: string; label: string; hint: string; href: string; icon: Icon }

const PAGES: Command[] = NAV.map((n) => ({ id: n.href, label: n.label, hint: n.hint, href: n.href, icon: n.icon }))

const hintOf = (href: string) => NAV.find((n) => n.href === href)!.hint
const view = (id: ProjectView, label: string, icon: Icon): Command => ({
  id,
  label,
  hint: hintOf('/projects'),
  href: `/projects#${id}`,
  icon,
})
const c = projects.cards

/** The board's sub-views open in place (hooks/useHashView.ts); the rest scroll into view (lib/scroller.ts). */
export const SECTIONS: Command[] = [
  view('reel', c.reel.title, c.reel.icon),
  view('build-plan', projects.docs['build-plan'].title, c.plan.icon),
  ...projects.writeups.map((w) => view(w.view, w.title, w.icon)),
  view('sites', c.sites.title, c.sites.icon),
  view('ai-agents', c.agents.title, c.agents.icon),
  { id: servicesPage.method.id, label: servicesPage.method.label, hint: hintOf('/services'), href: `/services#${servicesPage.method.id}`, icon: TreeStructureIcon },
  { id: servicesPage.automation.id, label: servicesPage.automation.label, hint: hintOf('/services'), href: `/services#${servicesPage.automation.id}`, icon: LightningIcon },
  { id: contact.faqs.id, label: contact.faqs.label, hint: hintOf('/contact'), href: `/contact#${contact.faqs.id}`, icon: ChatCircleDotsIcon },
]

export const COMMANDS: Command[] = [...PAGES, ...SECTIONS]

/** Kraft's filter (Kraft Portfolio.dc.html:705-706): label or hint contains the query. */
export function filterCommands(query: string, list: Command[] = COMMANDS): Command[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.hint.toLowerCase().includes(q))
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npx vitest run tests/commands.test.ts tests/CommandPalette.test.tsx`
Expected: PASS.

- [ ] **Step 5: The ⌘K and phone e2e**

Append to `e2e/palette.spec.ts`:

```ts
test('⌘K opens a Projects sub-view from another page, and Close stays on Projects', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('build plan')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects#build-plan$/)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await expect(page).toHaveURL(/\/projects$/)
})

test('⌘K on the same page opens the view and the page stays visible', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('agents')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'AI agents and RAG chatbots' })).toBeVisible()
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('⌘K lands on a section, on this page and on another', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('live automation')
  await page.keyboard.press('Enter')
  await expect(page.locator('#automation')).toBeInViewport()
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')

  await page.keyboard.press('Control+k')
  await page.keyboard.type('quick answers')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/contact#faqs$/)
  await expect(page.locator('#faqs')).toBeInViewport()
})
```

In `e2e/phone.spec.ts`, change the helpers import to `import { headlineLanding, hydrated, settleIntro } from './helpers'` and append:

```ts
test('phone: no page scrolls sideways', async ({ page }) => {
  for (const r of ['/projects', '/services', '/testimonials', '/about', '/contact']) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow, r).toBeLessThanOrEqual(0)
  }
})

test('phone: an open view fills the screen and holds the page still', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).tap()
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  expect((await view.boundingBox())!.width).toBe(390)
  const y = await page.evaluate(() => window.scrollY)
  await page.mouse.move(195, 500)
  for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 700)
  await page.waitForTimeout(300)
  expect(await page.evaluate(() => window.scrollY)).toBe(y)
})
```

Run: `npx playwright test e2e/palette.spec.ts e2e/phone.spec.ts`
Expected: PASS on both projects (desktop runs palette; phone runs phone).

- [ ] **Step 6: Capture Kraft's own pages for the side-by-side**

In `e2e/screenshots.spec.ts`, replace the body of `test('capture the Kraft standalone reference', …)` with:

```ts
    // Kraft's sidebar labels (Kraft Portfolio.dc.html:366-373). The phone
    // reference is the Home screen only: Kraft's phone nav names pages differently.
    const SCREENS: [string, string | null][] = [
      ['home', null], ['projects', 'Projects'], ['services', 'Services'],
      ['testimonials', 'Testimonials'], ['about', 'About'], ['contact', 'FAQs / Contact'],
    ]
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.addInitScript((t) => localStorage.setItem('kraft-theme', t), theme)
        await page.goto(STANDALONE)
        await page.waitForTimeout(7000) // Kraft's loader and headline flight
        for (const [slug, label] of SCREENS) {
          if (label) {
            if (size.name === 'phone') continue
            await page.getByText(label, { exact: true }).first().click()
            await page.waitForTimeout(900)
          }
          await page.screenshot({ path: `test-results/shots/kraft-${slug}-${theme}-${size.name}.png` })
        }
      }
    }
```

- [ ] **Step 7: Screenshot pass and visual tuning**

Run: `npm run shots`
Expected: `test-results/shots/` holds `app-<route>-<theme>-<size>.png` for all 7 routes, plus `kraft-<screen>-<theme>-desktop.png` and `kraft-home-<theme>-phone.png`.

Open each Phase 3 pair (`app-projects-dark-desktop.png` against `kraft-projects-dark-desktop.png`, and so on for services, testimonials, about, contact, in both themes), plus the phone shots. Check:
- tokens and colours;
- type sizes and weights;
- the frame's lit corner;
- card gaps and radii;
- where the lines break in each `<h1>`.

Fix only real differences. Name each fix in the commit body. If a phone shot shows anything wider than the screen, the `phone: no page scrolls sideways` test must also be failing; fix the cause, not the test.

Then run the manual passes the spec requires (§14):
- **Keyboard only** (desktop):
  - Tab through the Projects board, and Enter a card.
  - Tab inside the view (focus stays in it), then Esc (focus returns to the card).
  - Services: prev and next.
  - Contact: every field, the FAQs, Send.
  - The About cert chips show their tooltip on focus.
- **Reduced motion** (DevTools → Rendering → prefers-reduced-motion: reduce):
  - The Method holds its first gate.
  - The reel is still, and scrolls by hand.
  - There are no flow dots.
  - There is no cursor cue.

```bash
git add -A e2e components app lib data tests
git commit -m "test: Phase 3 screenshot pass, ⌘K sections and phone checks; visual tuning

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

(If the review found nothing to tune, the commit carries only the test changes. Name the tuning in the body when there is some.)

- [ ] **Step 8: Full verification**

Run: `npm run typecheck && npm run lint && npm test && npm run e2e && npm run build`
Expected:
- The typecheck and lint are clean.
- Every unit test passes.
- Every e2e passes on the desktop and phone projects.
- `next build` lists `/projects`, `/services`, `/testimonials`, `/about` and `/contact` as static (○).
