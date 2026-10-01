# Light Default and Site Backdrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The three standalone pages open in light mode unless the visitor chose dark on the portfolio. They also get the portfolio's own backdrop: the moving contour lines and the drifting green glow.

**Architecture:**
- **Shared shader:** the site's contour shader moves to `lib/contour.ts`. The site's `ContourCanvas` and a new plain-WebGL page script, `lib/brand/contour.js`, both use it.
- **Glow:** the site's `.page-glow` rules are read from `app/globals.css` at build time into the lively layer, replacing the tool-coloured hero glow.
- **Theme:** `pageCss` and the lively layer become light-first. A tiny head script, `lib/brand/theme.js`, sets `data-theme` before paint: from the portfolio's saved choice, or from the site when the page is inside its dialog.

**Tech Stack:** Node 26 (`.ts` run directly), Vitest with jsdom, Playwright (desktop and phone projects), WebGL 1 (no three.js on the pages), inlined CSS and JS.

**Spec:** `docs/superpowers/specs/2026-10-01-light-backdrop-design.md`

## Global Constraints

- **No new dependencies.** The pages stay self-contained; the only external hosts remain `fonts.googleapis.com` and `fonts.gstatic.com`.
- **Theme:**
  - The light palette is on bare `:root`; dark applies only under `:root[data-theme=dark]`. There is no `prefers-color-scheme` block anywhere in the page CSS. Print is light.
  - Opened on its own, a page is dark only when `localStorage['kraft-theme'] === 'dark'`; otherwise light, and light again if storage fails.
  - Inside the site's dialog, it starts in the site's theme: dark unless the site says light, the site's own rule.
- **High contrast:**
  - `contrast.light` applies under `:root[data-a11y-contrast=true]:not([data-theme=dark])`.
  - `contrast.dark` applies under `:root[data-a11y-contrast=true][data-theme=dark]`.
- **Glow:** exactly the site's `.page-glow`, `.page-glow > *` and `@keyframes kDrift` rules, read from `app/globals.css`.
  - Still under reduced motion, `data-a11y-motion=true` and `data-perf=low`.
  - Hidden in print and in high contrast.
- **Contour limits:** it starts after `load`, at idle time, and only if all of these hold:
  - not `(pointer: coarse) and (hover: none)`
  - no `prefers-reduced-motion: reduce`, and no `data-a11y-motion=true`
  - the performance setting is not `low`: `data-perf` (copied from the site in the dialog), else `sessionStorage['kraft-perf']`
  - WebGL 1 with `OES_standard_derivatives`
- **Contour behaviour:** 30 fps, 1× pixel density, and the site's drift, follow, pace and theme-easing rates.
  - It stops and removes its canvas if a limit stops holding.
  - It is hidden in print.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Theme switched on the site while the dialog is open:** the page follows live (the existing mirror), and the contour eases its colours to the new `--bg` and `--amb` instead of keeping the old ones. No automated pixel check exists; read `contour.js`'s `MutationObserver` on `data-theme`.
2. **Window resized while the contour runs:** the canvas stays full-window and the aspect uniform updates. Task 4's code handles it; there is no dedicated test.
3. **A page opened inside the dialog while the site is dark:** no flash of light before the page script mirrors. Task 3's head-script unit test pins the start state; read the order of `<head>` scripts.
4. **The contour inside the dialog plus the site's own contour behind it:** both may run; the dialog's copy obeys the site's `data-perf`. Task 4 adds the mirror test.
5. **WebGL compile or link failure on an odd GPU:** the script must give up quietly, without leaving a black canvas behind. Task 4's code returns before inserting the canvas.

---

### Task 1: Share the site's contour shader

**Files:**
- Create: `lib/contour.ts`
- Modify: `components/shell/ContourCanvas.tsx` (lines 11–37 `noiseGLSL`, 44–86 `frag`, 88–92 the constants, line 140)
- Test: `tests/contour.test.ts`

**Interfaces:**
- Produces:
  - `CONTOUR_FRAG: string`, the fragment shader with no `precision` line
  - `CONTOUR_TIMING: { frameInterval: number; drift: number; follow: number; pace: number; theme: number }`

- [ ] **Step 1: Branch check.** Run `git branch --show-current`. Expected: `feat/light-backdrop`. The spec and this plan are uncommitted on it.

- [ ] **Step 2: Write the failing test**: `tests/contour.test.ts`

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'

describe('the shared contour shader', () => {
  it('is the site’s simplex contour with its six uniforms and hairline lines', () => {
    for (const u of ['uTime', 'uMouse', 'uMousePace', 'uAspect', 'uBg', 'uLine']) expect(CONTOUR_FRAG, u).toMatch(new RegExp(`uniform \\w+\\s+${u};`))
    expect(CONTOUR_FRAG).toContain('float snoise(vec3 v)')
    expect(CONTOUR_FRAG).toContain('fwidth(bands)')
    expect(CONTOUR_FRAG).toContain('gl_FragColor')
    expect(CONTOUR_FRAG).not.toContain('precision')
  })

  it('keeps the site’s timing: 30 fps, drift, follow, pace and theme easing', () => {
    expect(CONTOUR_TIMING).toEqual({ frameInterval: 1000 / 30, drift: 0.09, follow: 4, pace: 8, theme: 7 })
  })

  it('is the one the site draws with', () => {
    const src = readFileSync('components/shell/ContourCanvas.tsx', 'utf8')
    expect(src).toContain("import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'")
    expect(src).not.toContain('float snoise')
    expect(src).not.toContain('const FRAME_INTERVAL')
  })
})
```

- [ ] **Step 3: Run it.** Run `npx vitest run tests/contour.test.ts`. Expected: FAIL, because `@/lib/contour` can't be resolved.

- [ ] **Step 4: Move the shader.** Run this from the repo root. It moves `noiseGLSL` and `frag` out verbatim, without retyping them:

```bash
node -e "
const fs=require('fs');const f='components/shell/ContourCanvas.tsx';const s=fs.readFileSync(f,'utf8').replace(/\r\n/g,'\n');
const a=s.indexOf('// kape HeroCanvasV2');const v=s.indexOf('const vert = \`');const fr=s.indexOf('const frag = \`');const c=s.indexOf('const FRAME_INTERVAL');const e=s.indexOf('export default function ContourCanvas');
const head=s.slice(a,v);const vert=s.slice(v,fr);const frag=s.slice(fr,c).replace('const frag = \`','export const CONTOUR_FRAG = \`').trimEnd();
fs.writeFileSync('lib/contour.ts','/**\n * The portfolio\u2019s contour shader and timing, shared by the site (components/shell/ContourCanvas.tsx)\n * and the standalone pages (lib/brand/contour.js, spec 2026-10-01-light-backdrop \u00a74.2).\n * No imports, so Node can run it directly. Each renderer adds its own precision line.\n */\n'+head+frag+'\n\n/** Frame cap and easing rates (per second). */\nexport const CONTOUR_TIMING = { frameInterval: 1000 / 30, drift: 0.09, follow: 4, pace: 8, theme: 7 }\n');
const top=s.slice(0,a)+\"import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'\n\n\";
const consts='const { frameInterval: FRAME_INTERVAL, drift: DRIFT_PER_SECOND, follow: FOLLOW_PER_SECOND, pace: PACE_PER_SECOND, theme: THEME_PER_SECOND } = CONTOUR_TIMING\n\n';
fs.writeFileSync(f,(top+vert+consts+s.slice(e)).replace('fragmentShader: frag,','fragmentShader: CONTOUR_FRAG,'));
"
```

Then read the top of both files. `lib/contour.ts` holds the credit comment, `noiseGLSL`, `export const CONTOUR_FRAG` and `CONTOUR_TIMING`. `ContourCanvas.tsx` keeps its imports, then the new import, `vert`, the destructured constants and the component.

- [ ] **Step 5: Run the tests.** Run `npx vitest run tests/contour.test.ts && npx tsc --noEmit && npx eslint lib/contour.ts components/shell/ContourCanvas.tsx`. Expected: 3/3 pass, and tsc and eslint are clean.

- [ ] **Step 6: Check the site's contour still runs.** Run `npx playwright test e2e/background.spec.ts --project=desktop`. Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add lib/contour.ts components/shell/ContourCanvas.tsx tests/contour.test.ts docs/superpowers/specs/2026-10-01-light-backdrop-design.md docs/superpowers/plans/2026-10-01-light-backdrop.md
git commit -m "refactor: the contour shader and timing live in lib/contour.ts, shared with the standalone pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The site's drifting glow replaces the hero glow

**Files:**
- Modify: `lib/brand/lively.ts` (remove `HALO`, `--halo*`, `.hero{…}`, `.hero::before`, `@keyframes halo`; add the site glow and layering; `livelyCss()` takes no argument)
- Modify: `lib/buildPlan/styles.ts:9` (`KEYS` gains `'amb'`)
- Modify: `lib/brand/render.ts` (add `backdropHtml`)
- Modify: the three renderers (`livelyCss()` call; `${backdropHtml()}` right after `<body>`)
- Regenerate: `public/*.html`
- Test: `tests/brand-lively.test.ts`, the three render tests, `e2e/lively.spec.ts`

**Interfaces:**
- Produces:
  - `livelyCss(): string`
  - `backdropHtml(): string`, which returns `<div class="page-glow" aria-hidden="true"><div></div></div>`
  - `--amb` emitted by `pageCss` in both themes

- [ ] **Step 1: Update the unit tests.** In `tests/brand-lively.test.ts`:
  - Change the import to `import { KINDS, livelyCss } from '@/lib/brand/lively'`, and add `import { readFileSync } from 'node:fs'` and `import { pageCss } from '@/lib/buildPlan/styles'`.
  - Replace `const css = livelyCss(['claude', 'telegram'])` with `const css = livelyCss()`.
  - Delete the test `colours the hero glow from the two tools it is given`.
  - Delete the whole `describe('the hero glow in light mode', …)`.
  - In `turns the tints and the glow off…`, delete the three `.hero::before` lines.
  - Append:

```ts
describe('the site’s glow', () => {
  const css = livelyCss()
  const site = readFileSync('app/globals.css', 'utf8')
  const rule = (re: RegExp) => re.exec(site)![0]

  it('copies the site’s own glow rules, word for word', () => {
    for (const re of [/^\.page-glow\{.*\}$/m, /^\.page-glow > \*\{.*\}$/m, /^@keyframes kDrift\{.*\}$/m]) expect(css).toContain(rule(re))
  })

  it('holds it still when motion is off or the device is slow, and hides it in high contrast and print', () => {
    expect(css).toContain(':root[data-a11y-motion=true] .page-glow > *{animation:none}')
    expect(css).toContain(':root[data-perf=low] .page-glow > *{animation:none}')
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\{[^}]*\.page-glow > \*\{animation:none\}/)
    expect(css).toContain(':root[data-a11y-contrast=true] .page-glow{display:none}')
    expect(css).toMatch(/@media print\{[\s\S]*\.page-glow\{display:none\}/)
  })

  it('has replaced the tool-coloured hero glow, and lifts the content above the backdrop', () => {
    expect(css).not.toContain('hero::before')
    expect(css).not.toContain('--halo')
    expect(css).toContain('.page,.foot{position:relative;z-index:1}')
  })

  it('gets the site’s ambient green from the page tokens, in both themes', () => {
    const themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: { dark: {}, light: {} } }
    expect(pageCss(themes)).toContain(`--amb:${themes.dark.amb}`)
    expect(pageCss(themes)).toContain(`--amb:${themes.light.amb}`)
  })
})
```

In each render test, replace the hero-glow assertion with the backdrop:
- `tests/buildPlan-render.test.ts`: replace the two `--halo-a`/`--halo-b` lines.
- `tests/endToEnd-render.test.ts`: replace the `--halo-b` line.
- `tests/agenticFramework-render.test.ts`: replace the `--halo-b` line.

In each, use:

```ts
    expect(doc.body.firstElementChild!.outerHTML).toBe('<div class="page-glow" aria-hidden="true"><div></div></div>')
```

- [ ] **Step 2: Run the tests.** Run `npx vitest run tests/brand-lively.test.ts tests/buildPlan-render.test.ts tests/endToEnd-render.test.ts tests/agenticFramework-render.test.ts`. Expected: FAIL. The glow rules are missing, `--halo` is present, `--amb` is absent and there's no backdrop.

- [ ] **Step 3: Implement.** In `lib/buildPlan/styles.ts` line 9, add `'amb'` at the end of `KEYS`.

In `lib/brand/lively.ts`:
- Delete the `HALO` export and its comment.
- Add `import { readFileSync } from 'node:fs'` and `import { join } from 'node:path'`, and remove the now-unused `TOOLS`/`ToolId` import.
- `DARK` becomes `${kinds(KINDS.dark)};--logo-light:none;--logo-dark:inline`.
- `LIGHT` becomes `${kinds(KINDS.light)};--logo-light:inline;--logo-dark:none`.
- Add above the function:

```ts
/** The site's drifting green glow, read word for word from app/globals.css (spec 2026-10-01-light-backdrop §4.1). */
function siteGlow(): string {
  const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8').replace(/\r\n/g, '\n')
  return [/^\.page-glow\{.*\}$/m, /^\.page-glow > \*\{.*\}$/m, /^@keyframes kDrift\{.*\}$/m]
    .map((re) => {
      const m = re.exec(css)
      if (!m) throw new Error(`app/globals.css has no ${re}`)
      return m[0]
    })
    .join('\n')
}
```

- Change the signature to `export function livelyCss(): string`, and its doc comment's last sentence to "The site's drifting glow sits behind the page."
- The first line of the template becomes `:root{${DARK}}`. (Task 3 flips the theme blocks; keep the existing order for now.)
- Delete these lines: `.hero{position:relative;isolation:isolate}`, the `.hero::before{…}` line, `@keyframes halo{…}`, `${HC} .hero::before{display:none}` and `${STILL} .hero::before{animation:none}`.
- In the reduced-motion media line, replace `.hero::before{animation:none}` with `.page-glow > *{animation:none}`.
- In the print block, replace `.hero::before{display:none}` with `.page-glow{display:none}`.
- Insert after the `.gl-logo` line:

```
${siteGlow()}
:root[data-perf=low] .page-glow > *{animation:none}
${STILL} .page-glow > *{animation:none}
${HC} .page-glow{display:none}
.page,.foot{position:relative;z-index:1}
```

In `lib/brand/render.ts`, append:

```ts
/** The site's drifting glow, first in <body>, behind everything (spec 2026-10-01-light-backdrop §4.1). */
export const backdropHtml = () => '<div class="page-glow" aria-hidden="true"><div></div></div>'
```

In each renderer:
- Import `backdropHtml` from `../brand/render.ts`.
- Replace `livelyCss([...])` with `livelyCss()`.
- Replace `<body>\n${logoSheet(used)}` with `<body>\n${backdropHtml()}${logoSheet(used)}`.

- [ ] **Step 4: Regenerate and run the tests.** Run `for p in plan e2e af; do node scripts/make-$p.ts; done && npx vitest run tests/brand-lively.test.ts tests/buildPlan-render.test.ts tests/endToEnd-render.test.ts tests/agenticFramework-render.test.ts && npx tsc --noEmit`. Expected: all pass, freshness tests included.

- [ ] **Step 5: Update the browser tests.** In `e2e/lively.spec.ts`, replace `glowOf` with:

```ts
const glowOf = (page: import('@playwright/test').Page) =>
  page.locator('.page-glow').evaluate((el) => ({ display: getComputedStyle(el).display, animation: getComputedStyle(el.firstElementChild!).animationName }))
```

Then change `expect(await glowOf(page)).toEqual({ display: 'block', animation: 'halo' })` to `expect(await glowOf(page)).toEqual({ display: 'block', animation: 'kDrift' })`. The other `glowOf` uses (reduced motion gives `none`; print and high contrast give `display: none`) stay as they are.

Run `npx playwright test e2e/lively.spec.ts e2e/build-plan.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts --project=desktop`. Expected: all pass.

- [ ] **Step 6: Look.** Screenshot each page's top at 1280 in dark (set `data-theme=dark` by script) and in light. Check that the green glow drifts behind the hero like the site's, and that content sits above it.

- [ ] **Step 7: Commit**

```bash
git add lib public/*.html tests e2e/lively.spec.ts
git commit -m "feat: the site's drifting green glow replaces the tool-coloured hero glow on the standalone pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Light by default

**Files:**
- Create: `lib/brand/theme.js`
- Modify: `lib/buildPlan/styles.ts` (`pageCss` theme lines 19–24 and its doc comment)
- Modify: `lib/brand/lively.ts` (theme blocks, comment)
- Modify: `lib/brand/render.ts` (add `themeHeadJs`)
- Modify: the three renderers (`<script>${themeHeadJs()}</script>` as the first thing in `<head>` after the `viewport` meta)
- Modify tests:
  - `tests/buildPlan-render.test.ts:65-69`, `tests/endToEnd-render.test.ts:91`, `tests/agenticFramework-render.test.ts:119` (contrast selectors)
  - `tests/brand-lively.test.ts` (the "dark first" test)
  - `e2e/build-plan.spec.ts:81`, `e2e/end-to-end.spec.ts:127`, `e2e/agentic-framework.spec.ts:195`, `e2e/lively.spec.ts` (print and logos tests)
- Create test: `tests/brand-theme.test.ts`
- Docs: spec §3.2, the "Inside a frame" line

**Interfaces:**
- Produces: `themeHeadJs(): string`, the text of `lib/brand/theme.js`.

- [ ] **Step 1: Write the failing unit tests**: `tests/brand-theme.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { KINDS, livelyCss } from '@/lib/brand/lively'
import { themeHeadJs } from '@/lib/brand/render'
import { pageCss } from '@/lib/buildPlan/styles'
import { readContrast, readTokens } from '@/lib/tokens'

const themes = { dark: readTokens('dark'), light: readTokens('light'), contrast: readContrast() }

describe('light by default', () => {
  const css = pageCss(themes)
  it('puts the light palette on bare :root and dark only under data-theme=dark, with no device block', () => {
    expect(css).toContain(`:root{--bg:${themes.light.bg};`)
    expect(css).toMatch(/:root\{[^}]*color-scheme:light/)
    expect(css).toContain(`:root[data-theme=dark]{--bg:${themes.dark.bg};`)
    expect(css).not.toContain('prefers-color-scheme')
  })

  it('turns up contrast for light unless the page is dark, and for dark only when it is', () => {
    expect(css).toContain(`:root[data-a11y-contrast=true]:not([data-theme=dark]){--ink2:${themes.contrast.light.ink2}`)
    expect(css).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${themes.contrast.dark.ink2}`)
  })

  it('gives the lively layer the same light-first blocks', () => {
    const lively = livelyCss()
    expect(lively).toContain(`:root{--k-trigger:${KINDS.light.trigger}`)
    expect(lively).toContain(`:root[data-theme=dark]{--k-trigger:${KINDS.dark.trigger}`)
    expect(lively).not.toContain('prefers-color-scheme')
  })
})

/** Runs the head script against stand-ins for the page, its frame parent and storage. */
function run(o: { framed?: boolean; host?: string; saved?: string | null; blocked?: boolean }) {
  const el = { dataset: {} as Record<string, string> }
  const win: { parent?: unknown } = {}
  win.parent = o.framed ? { document: { documentElement: { dataset: o.host === undefined ? {} : { theme: o.host } } } } : win
  const localStorage = {
    getItem: (k: string) => {
      if (o.blocked) throw new Error('blocked')
      return k === 'kraft-theme' ? (o.saved ?? null) : null
    },
  }
  new Function('window', 'document', 'localStorage', themeHeadJs())(win, { documentElement: el }, localStorage)
  return el.dataset.theme
}

describe('the head script', () => {
  it('opens a page on its own light, unless the visitor saved dark on the portfolio', () => {
    expect(run({})).toBe('light')
    expect(run({ saved: 'dark' })).toBe('dark')
    expect(run({ saved: 'light' })).toBe('light')
    expect(run({ blocked: true })).toBe('light')
  })

  it('inside the site’s dialog, starts in the site’s theme: dark unless the site says light', () => {
    expect(run({ framed: true, host: 'light' })).toBe('light')
    expect(run({ framed: true, host: 'dark' })).toBe('dark')
    expect(run({ framed: true })).toBe('dark')
    expect(run({ framed: true, host: 'light', saved: 'dark' })).toBe('light')
  })
})
```

Add to each render test's first `describe`, using the file's `doc`:

```ts
  it('picks its theme in <head>, before the styles', () => {
    const first = doc.head.querySelector('script, style')!
    expect(first.tagName).toBe('SCRIPT')
    expect(first.textContent).toBe(themeHeadJs())
  })
```

with `import { themeHeadJs } from '@/lib/brand/render'` added to each file's imports.

Change the contrast assertions:
- In `tests/buildPlan-render.test.ts` lines 67–68:

```ts
    expect(html).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${c.dark.ink2};--ink3:${c.dark.ink3}`)
    expect(html).toContain(`:root[data-a11y-contrast=true]:not([data-theme=dark]){--ink2:${c.light.ink2};--ink3:${c.light.ink3}`)
```

- In `tests/endToEnd-render.test.ts:91` and `tests/agenticFramework-render.test.ts:119`:

```ts
    expect(html).toContain(`:root[data-a11y-contrast=true][data-theme=dark]{--ink2:${readContrast().dark.ink2}`)
```

In `tests/brand-lively.test.ts`, replace the test `defines the kind colours dark first, …` with:

```ts
  it('defines the kind colours light first, dark under data-theme=dark, and light again in print', () => {
    expect(css).toContain(`:root{--k-trigger:${KINDS.light.trigger}`)
    expect(css).toContain(`:root[data-theme=dark]{--k-trigger:${KINDS.dark.trigger}`)
    expect(css).toMatch(new RegExp(`@media print\\{\\s*:root,:root\\[data-theme\\]\\{--k-trigger:${KINDS.light.trigger}`))
  })
```

- [ ] **Step 2: Run them.** Run `npx vitest run tests/brand-theme.test.ts tests/brand-lively.test.ts tests/buildPlan-render.test.ts tests/endToEnd-render.test.ts tests/agenticFramework-render.test.ts`. Expected: FAIL. There's no `themeHeadJs`, and the CSS is still dark-first.

- [ ] **Step 3: Implement.** Create `lib/brand/theme.js`:

```js
// Light unless the visitor chose dark (spec 2026-10-01-light-backdrop §3.2). Runs first in <head>, before the
// page draws. On its own, the page reads the portfolio's saved choice. Inside the site's dialog it starts in
// the site's theme (dark unless the site says light, the site's own rule), which the page script then mirrors
// live, so there is no flash.
;(() => {
  let dark = false
  try {
    dark = window.parent !== window ? window.parent.document.documentElement.dataset.theme !== 'light' : localStorage.getItem('kraft-theme') === 'dark'
  } catch {
    dark = false
  }
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
})()
```

Append to `lib/brand/render.ts`:

```ts
/** The theme head script (spec 2026-10-01-light-backdrop §3.2), ready to inline first in <head>. */
export const themeHeadJs = () => readFileSync(join(process.cwd(), 'lib/brand/theme.js'), 'utf8').replace(/\r\n/g, '\n')
```

In `lib/buildPlan/styles.ts`, replace the doc comment and the first six template lines of `pageCss` with:

```ts
/**
 * The pages' base CSS (spec §4). Light first (spec 2026-10-01-light-backdrop
 * §3.1): lib/brand/theme.js sets data-theme before paint, from the portfolio's
 * saved choice or, inside its dialog, from the site; client.js then mirrors
 * the site live. Dark applies only under [data-theme=dark].
 */
export function pageCss({ dark, light, contrast }: Themes): string {
  return `
:root{${vars(light)};color-scheme:light;--sans:"Geist",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--mono:"Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
:root[data-theme=dark]{${vars(dark)};color-scheme:dark}
:root[data-a11y-contrast=true]:not([data-theme=dark]){${decls(contrast.light)}}
:root[data-a11y-contrast=true][data-theme=dark]{${decls(contrast.dark)}}
```

The rest of the template is unchanged.

In `lib/brand/lively.ts`, replace the four theme lines at the top of the template (`:root{${DARK}}`, the `@media (prefers-color-scheme: light)` line, `:root[data-theme=light]{${LIGHT}}` and `:root[data-theme=dark]{${DARK}}`) with:

```
:root{${LIGHT}}
:root[data-theme=dark]{${DARK}}
```

Also change the doc comment's theme sentence to "Its theme blocks mirror pageCss: light first, dark under [data-theme=dark], light in print."

In each renderer, insert right after `<meta name="viewport" content="width=device-width,initial-scale=1">`:

```
<script>${themeHeadJs()}</script>
```

and import `themeHeadJs`.

- [ ] **Step 4: Regenerate and run the tests.** Run `for p in plan e2e af; do node scripts/make-$p.ts; done && npx vitest run && npx tsc --noEmit`. Expected: the full unit suite passes.

- [ ] **Step 5: Rewrite the browser theme tests.** In `e2e/build-plan.spec.ts`, replace `on its own it follows the device theme` with:

```ts
test('on its own it opens light, even on a dark-mode device, unless dark was chosen on the portfolio', async ({ browser }) => {
  for (const [saved, bg] of [[null, 'rgb(242, 245, 241)'], ['dark', 'rgb(5, 5, 5)'], ['light', 'rgb(242, 245, 241)']] as const) {
    const ctx = await browser.newContext({ colorScheme: 'dark' })
    if (saved) await ctx.addInitScript((t) => localStorage.setItem('kraft-theme', t), saved)
    const page = await ctx.newPage()
    await page.goto(PAGE)
    await expect(page.locator('body'), String(saved)).toHaveCSS('background-color', bg)
    await ctx.close()
  }
})
```

In `e2e/end-to-end.spec.ts` and `e2e/agentic-framework.spec.ts`, replace `on its own it follows the device theme and links back to the portfolio` with the same test, named `on its own it opens light unless dark was chosen on the portfolio, and links back to it`. Add this line before `ctx.close()`:

```ts
    await expect(page.getByRole('link', { name: '← Justine Acosta · Portfolio' })).toBeVisible()
```

In `e2e/lively.spec.ts`:
- In `prints everything, without the glow, in the light logos`, add `await ctx.addInitScript(() => localStorage.setItem('kraft-theme', 'dark'))` right after the context is created, so the page starts dark and print must still use light logos.
- Replace `mono logos and Codex follow the theme` with:

```ts
test('mono logos and Codex follow the theme', async ({ browser }) => {
  for (const theme of ['light', 'dark'] as const) {
    const ctx = await browser.newContext()
    await ctx.addInitScript((t) => localStorage.setItem('kraft-theme', t), theme)
    const page = await ctx.newPage()
    await page.goto('/end-to-end.html')
    const body = await page.locator('body').evaluate((el) => getComputedStyle(el).backgroundColor)
    for (const mono of await page.locator('.tool-chip .logo.mono').all()) expect(await mono.evaluate((el) => getComputedStyle(el).color), theme).not.toBe(body)
    const codex = page.locator('.tool-chip').filter({ hasText: 'Codex' })
    await expect(codex.locator(theme === 'dark' ? '.logo-dark' : '.logo-light')).toBeVisible()
    await expect(codex.locator(theme === 'dark' ? '.logo-light' : '.logo-dark')).toBeHidden()
    await ctx.close()
  }
})
```

Run `npx playwright test e2e/build-plan.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts e2e/lively.spec.ts e2e/projects.spec.ts --project=desktop`. Expected: all pass. The projects dialog tests are unchanged: the site with no `data-theme` still gives a dark page.

- [ ] **Step 6: Update the spec.** In spec §3.2, change the "Inside a frame" bullet to: "**Inside a frame:** it starts in the site's theme (dark unless the site says light), so there is no flash; the page script then mirrors it live." Also change the unit-test line in §6 to: "The head script picks dark only for a saved `dark`, and inside a frame starts in the site's theme."

- [ ] **Step 7: Commit**

```bash
git add lib public/*.html tests e2e docs/superpowers/specs/2026-10-01-light-backdrop-design.md
git commit -m "feat: the standalone pages open light unless dark was chosen on the portfolio

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: The contour behind the pages

**Files:**
- Create: `lib/brand/contour.js`
- Modify: `lib/brand/render.ts` (add `contourJs`)
- Modify: `lib/brand/lively.ts` (canvas CSS and print rule)
- Modify: the three renderers (`<script>${contourJs()}</script>` between the client script and the reveal script)
- Modify: `lib/buildPlan/client.js:9`, `lib/endToEnd/client.js:10` (`MIRROR` gains `'data-perf'`)
- Test: `tests/brand-contour.test.ts`, `e2e/lively.spec.ts`, `e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `CONTOUR_FRAG`, `CONTOUR_TIMING` (Task 1).
- Produces: `contourJs(): string`, which is `const CONTOUR = {…}` followed by the text of `contour.js`. The script inserts `<canvas data-contour aria-hidden="true">` as the first child of `<body>`.

- [ ] **Step 1: Write the failing tests.** Create `tests/brand-contour.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { contourJs } from '@/lib/brand/render'
import { CONTOUR_FRAG, CONTOUR_TIMING } from '@/lib/contour'
import { renderEndToEnd } from '@/lib/endToEnd/render'

describe('the pages’ contour script', () => {
  const js = contourJs()
  it('carries the site’s own shader and timing, safe inside <script>', () => {
    expect(js).toContain(`const CONTOUR = ${JSON.stringify({ frag: CONTOUR_FRAG, ...CONTOUR_TIMING }).replace(/</g, '\\u003c')}`)
  })
  it('keeps the site’s limits: fine pointer, motion allowed, not the low setting, WebGL with derivatives', () => {
    for (const s of ["'(pointer: coarse) and (hover: none)'", "'(prefers-reduced-motion: reduce)'", "root.dataset.a11yMotion !== 'true'", "'kraft-perf'", "!== 'low'", "getExtension('OES_standard_derivatives')"]) expect(js, s).toContain(s)
  })
  it('runs on each page before the reveal script', () => {
    const scripts = [...new DOMParser().parseFromString(renderEndToEnd(), 'text/html').querySelectorAll('script')].map((s) => s.textContent!)
    expect(scripts.at(-2)).toBe(js)
  })
})
```

Append to `e2e/lively.spec.ts`:

```ts
const contour = (page: import('@playwright/test').Page) => page.locator('canvas[data-contour]')

for (const PAGE of PAGES) {
  test(`${PAGE}: the site’s contour runs behind the page on a desktop with motion allowed`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(PAGE)
    await expect(contour(page)).toBeAttached({ timeout: 10_000 })
    expect(await contour(page).evaluate((el) => { const s = getComputedStyle(el); return [s.position, s.zIndex, s.pointerEvents] })).toEqual(['fixed', '0', 'none'])
    expect(errors).toEqual([])
  })
}

test('no contour under reduced motion, on touch, at the low setting, or without WebGL', async ({ browser }) => {
  const cases: { name: string; ctx: Parameters<typeof browser.newContext>[0]; init?: () => void }[] = [
    { name: 'reduced motion', ctx: { reducedMotion: 'reduce' } },
    { name: 'touch', ctx: { hasTouch: true, isMobile: true } },
    { name: 'low', ctx: {}, init: () => sessionStorage.setItem('kraft-perf', 'low') },
    { name: 'no WebGL', ctx: {}, init: () => { (HTMLCanvasElement.prototype as unknown as { getContext: () => null }).getContext = () => null } },
  ]
  for (const c of cases) {
    const ctx = await browser.newContext(c.ctx)
    if (c.init) await ctx.addInitScript(c.init)
    const page = await ctx.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto('/end-to-end.html')
    await page.waitForTimeout(4000)
    await expect(contour(page), c.name).toHaveCount(0)
    expect(errors, c.name).toEqual([])
    await ctx.close()
  }
})

test('the contour stops and goes away when the site’s Reduce motion is switched on', async ({ page }) => {
  await page.goto('/agentic-framework.html')
  await expect(contour(page)).toBeAttached({ timeout: 10_000 })
  await page.evaluate(() => (document.documentElement.dataset.a11yMotion = 'true'))
  await expect(contour(page)).toHaveCount(0)
})

test('the contour is left out of print', async ({ page }) => {
  await page.goto('/build-plan.html')
  await expect(contour(page)).toBeAttached({ timeout: 10_000 })
  await page.emulateMedia({ media: 'print' })
  await expect(contour(page)).toBeHidden()
})
```

Append to `e2e/projects.spec.ts`:

```ts
test('a standalone page in its dialog copies the site’s performance setting', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const frame = page.frameLocator('iframe[title="Trusted Mover build plan"]')
  await expect(frame.getByRole('heading', { level: 1 })).toBeVisible()
  await page.evaluate(() => (document.documentElement.dataset.perf = 'low'))
  await expect.poll(() => frame.locator('html').getAttribute('data-perf')).toBe('low')
})
```

- [ ] **Step 2: Run them.** Run `npx vitest run tests/brand-contour.test.ts`. Expected: FAIL, because `contourJs` isn't exported. The browser tests are run in Step 5.

- [ ] **Step 3: Implement.** Create `lib/brand/contour.js`:

```js
// The portfolio's contour lines behind a standalone page (spec 2026-10-01-light-backdrop §4.2), drawn with
// plain WebGL 1 instead of three.js. CONTOUR (the site's shader and timing, lib/contour.ts) is declared just
// above by the renderer. Same limits as the site: after load, at idle, fine pointer, motion allowed, not the
// low performance setting. If anything is missing, the flat --bg carries the page. The browser pauses
// requestAnimationFrame in a hidden tab, so the contour rests there too.
;(() => {
  const root = document.documentElement
  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const coarse = matchMedia('(pointer: coarse) and (hover: none)')
  const perf = () => {
    if (root.dataset.perf) return root.dataset.perf
    try {
      return sessionStorage.getItem('kraft-perf')
    } catch {
      return null
    }
  }
  const allowed = () => !reduce.matches && root.dataset.a11yMotion !== 'true' && !coarse.matches && perf() !== 'low'
  /** A token (`#rrggbb`, or Kraft's bare `r,g,b` for --amb) as 0–1 channels. */
  const color = (name) => {
    const v = getComputedStyle(root).getPropertyValue(name).trim()
    const hex = /^#([0-9a-f]{6})$/i.exec(v)
    if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16) / 255)
    const t = v.split(',').map((n) => Number(n.trim()))
    return t.length === 3 && t.every((n) => Number.isFinite(n) && n >= 0) ? t.map((n) => Math.min(255, n) / 255) : null
  }

  let stop = null
  let ready = false
  const start = () => {
    if (stop || !ready || !allowed()) return
    const bg = color('--bg')
    const line = color('--amb')
    if (!bg || !line) return
    const canvas = document.createElement('canvas')
    canvas.setAttribute('data-contour', '')
    canvas.setAttribute('aria-hidden', 'true')
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false })
    if (!gl || !gl.getExtension('OES_standard_derivatives')) return
    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }
    const vs = compile(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}')
    const fs = compile(gl.FRAGMENT_SHADER, `#extension GL_OES_standard_derivatives : enable\nprecision highp float;\n${CONTOUR.frag}`)
    if (!vs || !fs) return
    const prog = gl.createProgram()
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const at = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(at)
    gl.vertexAttribPointer(at, 2, gl.FLOAT, false, 0, 0)
    const u = Object.fromEntries(['uTime', 'uMouse', 'uMousePace', 'uAspect', 'uBg', 'uLine'].map((n) => [n, gl.getUniformLocation(prog, n)]))

    // 1x pixel density, like the site.
    const size = () => {
      canvas.width = innerWidth
      canvas.height = innerHeight
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform1f(u.uAspect, innerWidth / innerHeight)
    }
    size()
    // The theme (or high contrast) changes the tokens; the colours ease to them on the contour's own clock.
    let target = { bg, line }
    const themeWatch = new MutationObserver(() => {
      const nb = color('--bg')
      const nl = color('--amb')
      if (nb && nl) target = { bg: nb, line: nl }
    })
    themeWatch.observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-a11y-contrast'] })
    const tgt = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e) => {
      tgt.x = (e.clientX / innerWidth) * 2 - 1
      tgt.y = -(e.clientY / innerHeight) * 2 + 1
    }
    addEventListener('mousemove', onMove)
    addEventListener('resize', size)

    let raf = 0
    let time = 0
    let last = performance.now() - CONTOUR.frameInterval
    let lastX = 0
    let lastY = 0
    let pace = 0
    const ease = (from, to, k) => from.forEach((v, i) => (from[i] = v + (to[i] - v) * k))
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      if (now - last < CONTOUR.frameInterval - 1) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      time += CONTOUR.drift * dt
      const follow = 1 - Math.exp(-CONTOUR.follow * dt)
      cur.x += (tgt.x - cur.x) * follow
      cur.y += (tgt.y - cur.y) * follow
      const speed = Math.min(1, Math.hypot((cur.x - lastX) / Math.max(dt, 0.001), (cur.y - lastY) / Math.max(dt, 0.001)) * 0.4)
      pace += (speed - pace) * (1 - Math.exp(-CONTOUR.pace * dt))
      lastX = cur.x
      lastY = cur.y
      const k = 1 - Math.exp(-CONTOUR.theme * dt)
      ease(bg, target.bg, k)
      ease(line, target.line, k)
      gl.uniform1f(u.uTime, time)
      gl.uniform2f(u.uMouse, cur.x, cur.y)
      gl.uniform1f(u.uMousePace, pace)
      gl.uniform3fv(u.uBg, bg)
      gl.uniform3fv(u.uLine, line)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    const halt = () => {
      cancelAnimationFrame(raf)
      themeWatch.disconnect()
      removeEventListener('mousemove', onMove)
      removeEventListener('resize', size)
      canvas.removeEventListener('webglcontextlost', lost)
      canvas.remove()
      const lose = gl.getExtension('WEBGL_lose_context')
      if (lose) lose.loseContext()
      stop = null
    }
    const lost = (e) => {
      e.preventDefault()
      halt()
    }
    canvas.addEventListener('webglcontextlost', lost)
    stop = halt
    document.body.prepend(canvas)
    raf = requestAnimationFrame(frame)
  }

  const recheck = () => {
    if (stop && !allowed()) stop()
    else start()
  }
  const begin = () => {
    const go = () => {
      ready = true
      start()
    }
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 })
    else setTimeout(go, 1500)
  }
  if (document.readyState === 'complete') begin()
  else addEventListener('load', begin, { once: true })
  reduce.addEventListener('change', recheck)
  coarse.addEventListener('change', recheck)
  new MutationObserver(recheck).observe(root, { attributes: true, attributeFilter: ['data-a11y-motion', 'data-perf'] })
})()
```

Append to `lib/brand/render.ts`, and add `import { CONTOUR_FRAG, CONTOUR_TIMING } from '../contour.ts'` to its imports:

```ts
/** The pages' contour (spec 2026-10-01-light-backdrop §4.2): the site's shader and timing, then the script. No "<" survives in the JSON. */
export const contourJs = () =>
  `const CONTOUR = ${JSON.stringify({ frag: CONTOUR_FRAG, ...CONTOUR_TIMING }).replace(/</g, '\\u003c')}\n${readFileSync(join(process.cwd(), 'lib/brand/contour.js'), 'utf8').replace(/\r\n/g, '\n')}`
```

In `lib/brand/lively.ts`:
- Insert after the `.page,.foot{…}` line:

```
canvas[data-contour]{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
```

- Add `canvas[data-contour]{display:none}` inside the `@media print{` block.

In each renderer, change `<script>${client}</script>\n<script>${revealJs()}</script>` to `<script>${client}</script>\n<script>${contourJs()}</script>\n<script>${revealJs()}</script>`, and import `contourJs`.

In `lib/buildPlan/client.js:9` and `lib/endToEnd/client.js:10`, set:

```js
  const MIRROR = ['data-a11y-motion', 'data-a11y-contrast', 'data-a11y-links', 'data-perf']
```

and in the comment above it, add "and its performance setting" after "access settings".

- [ ] **Step 4: Regenerate and run the unit tests.** Run `for p in plan e2e af; do node scripts/make-$p.ts; done && npx vitest run && npx tsc --noEmit && npx eslint lib`. Expected: all pass.

- [ ] **Step 5: Run the browser tests.** Run `npx playwright test e2e/lively.spec.ts e2e/projects.spec.ts e2e/build-plan.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts --project=desktop`. Expected: all pass, the new contour and perf-mirror tests included.

If the contour never attaches in headless Chromium, check whether WebGL is available there with `page.evaluate(() => !!document.createElement('canvas').getContext('webgl'))`, and debug with superpowers:systematic-debugging. Never weaken the test.

- [ ] **Step 6: Look.** Screenshot `/end-to-end.html` and `/agentic-framework.html` at 1280×800 in light and dark (saved theme). Wait about 3 seconds so the contour has started; use no `reducedMotion`. Check:
  - the contour lines show behind the page like the site's
  - cards and diagrams stay readable
  - the glow sits above the lines

- [ ] **Step 7: Commit**

```bash
git add lib public/*.html tests e2e
git commit -m "feat: the site's contour lines run behind the standalone pages, with the site's limits

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Screenshots and full verification

**Files:**
- Modify: `scripts/shoot-plan.mjs:12`, `scripts/shoot-e2e.mjs:12`, `scripts/shoot-af.mjs:12`
- Regenerate: `public/shots/*.jpeg`

- [ ] **Step 1: Shoot in light.** In all three scripts, change `colorScheme: 'dark'` to `colorScheme: 'light'`. In `shoot-plan.mjs`, also add `reducedMotion: 'reduce'`, so no contour or balls start mid-shot. Ledger that as a Ruling. Update each script's comment to say the shot shows the page's light default. Run `node scripts/shoot-plan.mjs && node scripts/shoot-e2e.mjs && node scripts/shoot-af.mjs` and open the three images. Expected: each is light, with the glow.

- [ ] **Step 2: Full verification.** Run each and read the output:
  - `npm test`: all pass
  - `npm run lint`: clean
  - `npm run typecheck`: clean
  - `npx playwright test --project=desktop e2e/build-plan.spec.ts e2e/end-to-end.spec.ts e2e/agentic-framework.spec.ts e2e/lively.spec.ts e2e/projects.spec.ts e2e/background.spec.ts e2e/home.spec.ts e2e/seo.spec.ts`: all pass
  - `npx playwright test --project=phone`: all pass

- [ ] **Step 3: Commit**

```bash
git add scripts public/shots
git commit -m "chore: Home screenshots show the standalone pages' light default

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
