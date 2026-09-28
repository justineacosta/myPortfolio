# Kraft portfolio: deferred-items cleanup

**Date:** 2026-09-28
**Base:** `main` at 936e460 (Phases 1–4 merged)
**Branch:** `fix/kraft-deferred-cleanup`

## Purpose

PRs #1–#4 each ended with a list of deferred minor items. This pass closes every item that is still open, and makes one design change the owner asked for: the desktop top bar goes. Nothing new is added beyond that. Success means:
- every item below is fixed, and each fix has a test that failed first (or a documented check where a test can't reach it);
- the full unit suite, the e2e suite, typecheck, lint and `next build` are green.

## Owner decisions (2026-09-28)

1. **The desktop top bar is removed.** That is the crumb ("KRAFT / 01 HOME"), "Jump to… ⌘K" and "Get in touch".
   - The Ctrl/⌘+K shortcut and the phone search buttons stay.
   - The sidebar's "Start a project" still reaches Contact.
2. **⌘K during the Home intro** ends the intro, exactly as Esc does, then opens the palette. The owner confirmed this at spec review.
3. **Back/Forward** returns to the scroll position of that history entry. A new navigation (a link, the sidebar, ⌘K) still starts at the top, or at its section.
4. **The Showcase CTA**, while its URL is a PLACEHOLDER, looks the same but is not a link. It says "Link coming soon" to screen readers. It becomes a real link when `data/showcase.ts` gets a URL.
5. **The share image headline** uses Geist Bold, from an OFL `.ttf` committed to the repo. No network is needed at build time.

## A. Shell and visible fixes

**A1. Remove the desktop top bar.**
- Delete `components/shell/TopBar.tsx` and `ShellTopBar.tsx`, and their use in `app/(site)/layout.tsx`.
- The panel's top padding matches its side padding, so the page doesn't start flush against the window edge.
- `lib/scroller.ts`: `SECTION_OFFSET` no longer clears a 72px bar. It becomes a small breathing margin, the same on desktop and phone.
- Tests:
  - Drop the e2e tests "Get in touch goes to contact" and "Jump to button opens it". The palette's keyboard e2e keeps covering ⌘K.
  - Add an e2e check that desktop has no top bar, and that a ⌘K section jump lands the section near the top of the panel.

**A2. Windows are no longer full-bleed.**
- `dialog.view{padding:0}` (0,1,1) beats `.view--window{padding:…}` (0,1,0).
- Raise the window rule to `dialog.view--window`, so the preview and write-up windows get their margin back.
- Test: an e2e check that an open write-up window has non-zero padding.

**A3. The access panel never covers its own button.**
- `placePanel` currently falls back to `top: EDGE` when the panel fits neither below nor above, which lands it on top of the button.
- New rule: pick the side with more room, and return a `maxHeight` for that room. The panel scrolls inside (`overflow-y:auto`).
- Tests:
  - Unit tests for `placePanel`: tall panel with more room below, tall panel with more room above, and a normal fit that stays unchanged.
  - An e2e check at A++ on a short desktop viewport that the panel's rect doesn't intersect the button's.

**A4. "No matches" is announced correctly.** In the palette, "No matches" moves out of the `listbox`, into a `role="status"` line beside it. Test: a unit test that the listbox has no non-option children and the status text is present.

**A5. The share-image headline is bold.**
- Commit `assets/fonts/Geist-Bold.ttf`, with the OFL licence beside it.
- `lib/share-image.tsx` reads it and passes it to `ImageResponse` as `fonts: [{ name: 'Geist', weight: 700 }]`. The whole image uses `fontFamily: 'Geist'`.
- Test: a unit test that `shareImage()` is built with a 700-weight Geist font. The screenshot pass checks it by eye.

**A6. Showcase CTA.** Decision 4. While `isPlaceholder(f.cta.href)`, render a `<span>` with the button's look, plus visually hidden "Link coming soon". Otherwise render the real `<a target="_blank">`. Test: unit tests for both states.

**A7. The `/showcase` description** uses the page's lede, not its heading. While the lede is still a PLACEHOLDER it falls back to the heading, so a placeholder never reaches search results (`ledeOr` in `lib/seo.ts`). Test: unit tests for both cases.

## B. Intro hardening

**B1. A time limit on the running intro.**
- Once the overlay claims the run, a watchdog of `INTRO_MAX_MS` (in `lib/intro.ts`) calls `skip()` if the page is still held when it fires. Its value is the longest phone sequence plus a margin.
- The body of the rAF `step` also runs inside `try/catch → skip`, so an error in a frame can't strand the page.
- Test: a unit test with fake timers: the watchdog releases the page. The throwing-frame path isn't reachable in jsdom (it has no `Element.animate` and no `getTotalLength`), so the watchdog test covers that risk and the final review checks the path.

**B2. ⌘K during the intro.** Decision 2. When the intro is live, the palette's key handler calls the intro's skip, then opens the palette. A small `lib/intro.ts` hook shares the skip, so the palette doesn't import the overlay. Test: an e2e check that ⌘K during the intro ends it and the palette's input has focus.

**B3. Hidden pieces are not focusable or clickable.** The held rules in `globals.css` also set `visibility:hidden` while held. That takes them out of focus order, hit-testing and the accessibility tree, with no JS and no change to layout. Test: an e2e check that during the intro, Tab from the skip button doesn't reach the sidebar, and `elementFromPoint` on a held link isn't that link.

**B4. The Services row is no longer a Tab stop.** On Home, the sideways Services row (`WheelRow`) gets `tabIndex={-1}`. The card's link is the Tab stop. Test: a unit test.

**B5. `speedFor` comment.** It says "two-thirds speed", but the value is 0.62. Reword the comment to match the value.

**B6. Stronger intro e2e.**
- `headlineLanding` also checks that the flying copy breaks into the same lines as the real `<h1>` (same line count, and each line's text).
- "Navigate away mid-intro" first checks `html[data-intro-live]`, so it proves the intro was running.

## C. Motion and WebGL

**C1. OS reduced-motion changes are followed live everywhere.**
- `lib/motion.ts` gains `onMotionChange(cb)`. It fires on the a11y event and on the `(prefers-reduced-motion: reduce)` media-query change.
- It is used by:
  - `BackgroundGate` (the contour stops or starts);
  - `useSmoothScroll` (Lenis is torn down or rebuilt);
  - `useWebGLAllowed` (the drum gate);
  - `useReducedMotion`, which keeps its behaviour and moves to the shared helper.
- Tests: unit tests that flipping the mocked media query updates `useWebGLAllowed` and `useReducedMotion`. An e2e check that `emulateMedia({ reducedMotion })` mid-page removes the contour canvas.

**C2. The drum pauses under the preview.** `SiteDrum` takes `paused`. While it's true, the render loop stops (no rAF is scheduled), and it resumes when it goes false. `SitesView` passes `paused={!!preview}`. Test: a unit test in the style of the existing drum tests, checking the loop stops scheduling frames while paused.

**C3. WebGL contexts are released.** Both `ContourCanvas` and `SiteDrum` release their renderer through `lib/webgl.ts` `releaseRenderer()`: `dispose()` first, while the context can still free GPU resources, then `forceContextLoss()`. Test: a unit test of the order.

**C4. Lenis after a route change.** Lenis 1.x watches its wrapper and content with a ResizeObserver (`autoResize: true`, the default), so this is expected to be fixed already. Test: an e2e check going from a short page to a long one on desktop, then scrolling to the bottom and landing on the footer. If it fails, call `lenis.resize()` in the pathname effect.

## D. Routing, focus, metadata, tooling and tests

**D1. Back/Forward scroll.** Decision 3.
- A new module `lib/scrollMemory.ts` does three things:
  - It keys each history entry by `navigation.currentEntry.key` where the Navigation API exists, and by the full URL where it doesn't.
  - It saves the scroller's position against that key: on `pagehide`, before each navigation, and on a light scroll listener.
  - It marks a `popstate` as "restore".
- `NavigationProvider`'s pathname effect restores the saved position for that key when the change came from Back/Forward. For every other navigation it keeps today's top-or-section behaviour.
- The store lives in `sessionStorage`, in a try/catch, falling back to memory.
- Tests:
  - Unit tests for `scrollMemory`: the key choice, save and restore, and blocked storage.
  - An e2e check: scroll `/about` down, go to `/services`, press Back, and `/about` returns to its position; then Forward, and `/services` is at its saved position.

**D2. Forward into a sub-view from another page.**
- Board cards stay real `#view` links, so open-in-new-tab still works.
- A plain left-click (no modifier keys, button 0) is handled with `preventDefault()` plus `pushHash()`. So the history entry is made through Next's patched `pushState` and carries Next's state.
- Test: an e2e check: open a card, go to another page, press Back twice and Forward twice, and the view is open on `/projects` with the other page gone.

**D3. No stale hash in Next's state.** `clearHash()` passes `null` as the state, the same way `pushHash` does. Next's patched `replaceState` then updates its own URL, rather than treating the call as one of its own. Test: a unit test that `clearHash` calls `replaceState` with `null`, and an e2e check that after closing a view, `router.refresh()` doesn't reopen it.

**D4. Focus fallback.** When a view closes with nothing to return focus to, focus goes to the top-most other open `dialog.view`, and only then to `#main-content`. Test: a unit test with the preview stacked on the sites view, where closing the preview with no return target focuses the sites view.

**D5. Per-page share images keep their size and alt.**
- `SHARE_SIZE` and `SHARE_ALT` move to a plain module (`lib/share-meta.ts`) with no `next/og` import.
- `pageMetadata` names the images as `{ url, width, height, alt }`.
- Test: update the SEO unit test.

**D6. Copy moves into `data/`:**
- the skip link (`PlainShell.tsx`);
- the "Legal" nav label (`LegalLinks.tsx`);
- `'Kraft'` in `lib/jsonld.ts` (use `profile.brand`);
- the `Mock.tsx` `STATE` labels.

Test: the existing component tests still pass, reading from `data/`.

**D7. Node version.** Change `package.json` `engines.node` from `>=20.9.0` to `>=22.18.0`, which is what `npm run placeholders` needs to run `.ts` natively.

**D8. Largest-text e2e coverage.**
- At A++, visit every route: `/`, `/projects`, `/showcase`, `/services`, `/testimonials`, `/about`, `/contact`, `/privacy`, `/terms`, `/thank-you`, and a 404.
- Run it at desktop 1440px and phone 320px.
- Assert there is no horizontal page overflow, and that the main heading is visible.

## Out of scope

- Real content (the 141 PLACEHOLDERs from `npm run placeholders`).
- The access panel's focus trap. It was ruled intentional in Phase 4, because it is a non-modal popover.
- Any new feature.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run e2e` and `next build`.
- The screenshot pass (`npm run shots`), checking the shell without the top bar, the windows' margins, the share image and the A++ panel.
- A fresh whole-branch review at the end, as in earlier phases.
