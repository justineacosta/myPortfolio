# Standalone pages: light by default, with the site's backdrop

**Date:** 2026-10-01
**Status:** Approved 2026-10-01 in chat
**Pages:** `/build-plan.html`, `/end-to-end.html`, `/agentic-framework.html`

## 1. Goal

- **Light by default:** the three standalone pages open in light mode unless the visitor chose dark on the portfolio.
- **The site's backdrop:** they get the portfolio's own background, the moving contour lines and the drifting green glow, so they feel like part of the site.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Default theme | Light unless the visitor chose dark. Opened on its own, a page follows the theme saved by the portfolio (`kraft-theme`); with no saved choice it is light, even on a dark-mode device. Inside the site's dialog it keeps matching the site, live. |
| Where the backdrop runs | Everywhere (on its own and inside the dialog), with the site's own limits |
| Title glow | The tool-coloured hero glow is replaced by the site's drifting green glow |

## 3. Theme

### 3.1 CSS is light first
- **Base palette:** `pageCss` (`lib/buildPlan/styles.ts`) puts the light tokens on bare `:root` with `color-scheme: light`, and the dark tokens under `:root[data-theme=dark]`. The `prefers-color-scheme` block is removed, so the device setting no longer decides.
- **High contrast:**
  - `contrast.light` applies under `:root[data-a11y-contrast=true]:not([data-theme=dark])`.
  - `contrast.dark` applies under `:root[data-a11y-contrast=true][data-theme=dark]`.
- **Print** stays light.
- **The lively layer** (`lib/brand/lively.ts`) flips the same way: light kind colours and logo variants on `:root`, dark ones under `:root[data-theme=dark]`, and no device block.

### 3.2 Choosing the theme before paint
- **Where it runs:** a small inline script in each page's `<head>` runs before the body draws.
- **On its own** (not inside a frame):
  - It sets `data-theme=dark` when `localStorage['kraft-theme'] === 'dark'`; otherwise it sets `data-theme=light`.
  - Storage errors fall back to light.
- **Inside a frame:** it starts in the site's theme (dark unless the site says light, the site's own rule), so there is no flash; the page script then mirrors it live, as it does today.
- **JavaScript off:** the page is light.

## 4. Backdrop

### 4.1 The glow
- **What:** exactly the site's `.page-glow`, one soft `--amb` orb with `filter: blur(26px)`, on the `kDrift` 28-second drift, fixed behind the page.
- **Token:** `--amb` joins the token keys `pageCss` emits.
- **Markup:** `<div class="page-glow" aria-hidden="true"><div></div></div>`, the first thing in `<body>`.
- **Holds still** under reduced motion, under the site's motion setting, and at the `low` performance setting.
- **Hidden** in print and in high contrast.
- **Replaces** the hero's `::before` glow; `HALO` and `--halo-*` are removed.

### 4.2 The contour
- **Shared shader:** the site's shader source (simplex noise, the contour fragment shader and its constants) moves to `lib/contour.ts`. `components/shell/ContourCanvas.tsx` imports it, with no visible change on the site.
- **On the pages:** a new `lib/brand/contour.js` draws it with plain WebGL 1, with the shader sources inlined by the renderer. It uses:
  - a full-screen triangle pair and its own vertex shader
  - `OES_standard_derivatives`, for the shader's `fwidth`
  - the same uniforms as the site: time, mouse, mouse pace, aspect, ground colour (`--bg`), line colour (`--amb`)
  - the same constants: 30 fps, 1× pixel density, drift and follow rates
  - colour easing to the new theme whenever `data-theme` changes
  - a pause while the tab is hidden
- **The site's limits:** it starts only after `load`, at idle time, and only if all of these hold:
  - a fine pointer (not `(pointer: coarse) and (hover: none)`)
  - motion allowed: no `prefers-reduced-motion: reduce`, and no `data-a11y-motion=true`
  - the performance setting is not `low`. Inside the dialog, `data-perf` is copied from the site with the other mirrored attributes; opened alone, the head script copies `sessionStorage['kraft-perf']` onto `data-perf`, as the site's boot script does, so the glow holds still too. The dialog's "Open in new tab" link uses `rel="opener"` (same origin), so the new tab inherits that setting.
  - WebGL 1 with `OES_standard_derivatives` is available. If not, or if the context is lost, the canvas is removed and the flat `--bg` carries the page.
- **Turning off mid-page:** if motion is turned off or the setting drops to `low` after it started, it stops and removes its canvas.
- **Layer:** `<canvas data-contour aria-hidden="true">`, fixed and full-window, behind the content. Hidden in print.

### 4.3 Layering
- **Order:** the contour and the glow sit behind the page's content. Content gets its own layer above them (`position: relative; z-index: 1` on the section bar, main and footer).
- **Surfaces:** cards, diagrams and the section bar keep their own surfaces, as on the site.

## 5. Code

| File | Change |
|---|---|
| `lib/contour.ts` | New: the shared shader sources and constants |
| `components/shell/ContourCanvas.tsx` | Imports the shader from `lib/contour.ts` |
| `lib/brand/contour.js` | New: the pages' plain-WebGL contour |
| `lib/brand/render.ts` | Adds the theme head script, the backdrop markup and the contour script (with the shader inlined) |
| `lib/buildPlan/styles.ts` | Light-first `pageCss`, `--amb` emitted |
| `lib/brand/lively.ts` | Light-first theme blocks; page glow in, hero glow out |
| `lib/buildPlan/client.js`, `lib/endToEnd/client.js` | Mirror `data-perf` from the site too |
| Three renderers | Add the head script, the backdrop and the contour script |
| `public/*.html`, `public/shots/*.jpeg` | Regenerated; screenshots taken in light |

## 6. Tests

**Unit:**
- `pageCss` is light on bare `:root` and dark only under `[data-theme=dark]`, with no `prefers-color-scheme` block; the high-contrast selectors are as in §3.1.
- The head script picks dark only for a saved `dark`, and inside a frame starts in the site's theme. It is checked with a stubbed `localStorage` and `window.parent`.
- The page sends the same shader source as `lib/contour.ts`, and `ContourCanvas` imports it.
- The page glow is present in the page; the CSS hides it in print and in high contrast, and holds it still when motion is off.

**Browser:**
- **Theme:**
  - A dark-mode device with no saved choice opens each page light.
  - A saved `kraft-theme=dark` opens it dark.
  - Inside the Projects dialog, the page matches the site in both themes.
- **Contour:**
  - On desktop with motion allowed, `canvas[data-contour]` appears after load.
  - It doesn't appear under reduced motion, with `data-a11y-motion=true`, with a coarse pointer, at `kraft-perf=low`, or with WebGL turned off.
- **Glow:** it drifts with motion, holds still under reduced motion, and is hidden in print.
- **Phone:** no sideways scroll at 390px.
- **Unchanged:** all existing page tests still pass. The "follows the device theme" tests are rewritten for the new default.

## 7. Out of scope
- **The site** itself is unchanged, apart from `ContourCanvas` importing the shared shader.
- **No frame-health watcher** on the pages. They use the site's saved performance setting rather than measuring their own.
