# Kraft Portfolio — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js app with Kraft's tokens, both themes, the persistent desktop shell (sidebar, top bar, panel, page crossfade), the phone tab bar, ⌘K palette, smooth scroll, scroll reveals, performance tiers and kape's contour background. Every route is a placeholder page at the end of this phase.

**Architecture:** Next.js App Router. A `(site)` route group has one layout that stays mounted across navigations and owns the shell. Colours are Kraft's CSS custom properties, mapped into Tailwind v4 through `@theme inline`, and Tailwind's own palette is removed. Client components are used only where the browser is needed. An inline boot script applies theme, perf tier and a11y switches before first paint.

**Tech Stack:** Next.js 16.3 · React 19.3 · TypeScript 5.9 · Tailwind CSS 4.3 · @phosphor-icons/react 2.1 · three 0.186 · lenis 1.3 · Vitest 5 + Testing Library + jsdom · Playwright 1.63

**Spec:** `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md` (read §3–§8, §11–§12, §14–§15 before starting)

**Later phases:** Phase 2 (Home and intro), Phase 3 (main pages) and Phase 4 (Showcase features, extras, deploy) each get their own plan after this one lands, because they consume interfaces this phase creates.

## Global Constraints

- Node ≥ 20.9 (Next 16 requirement). Pinned versions are listed in Task 1; do not upgrade during the phase.
- **Colours come only from Kraft tokens** in `app/globals.css`. No hex, `rgb(`/`rgba(` literals with numbers anywhere else in `app/ components/ data/ hooks/ lib/` (enforced by `tests/no-raw-colors.test.ts`). `rgba(var(--amb),…)` is allowed.
- Tailwind's default colour palette is removed (`--color-*: initial`). Use only the mapped token colours (`bg-bg`, `text-ink3`, `border-b1`, `text-accent`, …).
- Token values are copied **byte-for-byte** from `reference/Kraft_Portfolio_Design_System/Kraft Portfolio.dc.html` lines 50–51. Never round, rename or "improve" a value, px size, radius, easing or duration taken from Kraft.
- Fonts: Geist and Geist Mono. Icons: Phosphor, imported from `@phosphor-icons/react/ssr`, using the `…Icon` export names.
- Desktop shell from **1100px** (`shell:` variant, `68.75rem`); phone layout below it.
- Copy: Kraft's text is used verbatim. Missing content is a string starting `PLACEHOLDER - ` that says what goes there.
- Motion: every animation has a reduced-motion path. "Reduced" means `prefers-reduced-motion: reduce` **or** the a11y switch `html[data-a11y-motion="true"]` (`prefersReducedMotion()` in `lib/motion.ts`).
- Storage keys: `kraft-theme` (localStorage), `kraft-perf` (sessionStorage), `kraft-a11y` (localStorage). Every storage access is inside `try/catch`.
- `reference/` is never imported, built, linted, type-checked or committed.
- `HANDOFF.md` in the reference folder is **not** followed.
- No emoji in UI.
- Commits end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Storage blocked** (private mode, site data disabled): the page must load, follow the device theme, and the theme button must still switch themes without an uncaught error. Tests: Task 2 (boot script), Task 3 (theme lib + e2e), Task 9 (perf tier).
2. **Returning visitor whose saved theme differs from the OS setting:** the first paint must already be the saved theme, with no flash of the other one. Test: Task 2 e2e (`data-theme` at `DOMContentLoaded`).
3. **Rapid nav clicks within the 160ms fade, or clicking the page you're on:** the last click wins, content never stays invisible, and the current page scrolls to the top without navigating. Tests: Task 4 unit, Task 5 e2e.
4. **Window resized across 1100px while open:** layout switches between sidebar and tab bar, and scrolling keeps working. Lenis is torn down below 1100px and rebuilt above it. Tests: Task 7 e2e, Task 8 e2e.
5. **⌘K edge cases:** Ctrl/⌘+K while open closes it, Enter with zero matches does nothing, and focus returns to whatever opened it. Tests: Task 6 unit and e2e.

---

## File map (created in this phase)

```
.gitignore  package.json  tsconfig.json  next.config.ts  postcss.config.mjs
eslint.config.mjs  vitest.config.mts  vitest.setup.ts  playwright.config.ts
reference/                      (moved here, gitignored)
public/assets/kraft-mark.svg  public/assets/portrait.jpg
app/layout.tsx                  root html/body, fonts, boot script, default metadata
app/globals.css                 Tailwind, Kraft tokens, base, keyframes, perf/a11y/reveal/sweep rules
app/(site)/layout.tsx           the shell
app/(site)/template.tsx         per-navigation rise-in wrapper
app/(site)/page.tsx + projects/ showcase/ services/ testimonials/ about/ contact/ page.tsx
components/shell/NavigationProvider.tsx   go(), swapping, ShellLink
components/shell/Sidebar.tsx  TopBar.tsx  PanelContent.tsx  TabBar.tsx  PhoneControls.tsx
components/shell/CommandPalette.tsx       PaletteProvider, usePalette, dialog
components/shell/ThemeButton.tsx  ManilaClock.tsx  MagnetLink.tsx
components/shell/SmoothScroll.tsx  BackgroundGate.tsx  ContourCanvas.tsx
components/ui/PagePlaceholder.tsx
data/nav.ts  data/profile.ts
lib/storage-keys.ts  lib/boot.ts  lib/theme.ts  lib/motion.ts  lib/a11y.ts  lib/perf.ts
lib/scroller.ts  lib/commands.ts  lib/color.ts  lib/background.ts  lib/placeholder.ts
hooks/useScrollReveal.ts  hooks/useSmoothScroll.ts
test/matchMedia.ts
tests/*.test.ts(x)              unit tests (Vitest)
e2e/*.spec.ts                   browser tests (Playwright)
```

---

### Task 1: Scaffold the project, tooling and reference move

**Files:**
- Create: `.gitignore`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.mts`, `vitest.setup.ts`, `playwright.config.ts`, `test/matchMedia.ts`, `lib/placeholder.ts`, `app/layout.tsx`, `app/globals.css`, `app/(site)/page.tsx`
- Test: `tests/placeholder.test.ts`, `e2e/smoke.spec.ts`
- Modify: `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md` (§2 source paths)

**Interfaces:**
- Produces: `isPlaceholder(value: string): boolean`; `installMatchMedia(matches?: Record<string, boolean>): void` (test helper); npm scripts `dev build start lint typecheck test e2e shots`.

- [ ] **Step 1: Move the reference material out of the way**

Run in Git Bash at the repo root:

```bash
mkdir -p reference
mv "Kraft_Portfolio_Design_System" "kapeportfolio" "Kraft Portfolio Design System.zip" reference/
ls reference
```

Expected: `Kraft Portfolio Design System.zip  Kraft_Portfolio_Design_System  kapeportfolio`

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# deps / build
node_modules/
.next/
out/
next-env.d.ts
*.tsbuildinfo

# tests
test-results/
playwright-report/
coverage/

# env
.env*.local

# design references (kept on disk only)
reference/

# os / editor
.DS_Store
Thumbs.db
```

- [ ] **Step 3: Write `package.json` and install pinned dependencies**

```json
{
  "name": "kraft-portfolio",
  "private": true,
  "version": "0.1.0",
  "engines": { "node": ">=20.9.0" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "e2e": "playwright test --grep-invert @shots",
    "shots": "playwright test --grep @shots --project=desktop"
  }
}
```

```bash
npm i next@16.3.6 react@19.3.0 react-dom@19.3.0 @phosphor-icons/react@2.1.10 three@0.186.1 lenis@1.3.26
npm i -D typescript@5.9.3 @types/node@22 @types/react@19 @types/react-dom@19 @types/three@0.186.0 \
  tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 eslint@9 eslint-config-next@16.3.6 \
  vitest@5.0.2 @vitejs/plugin-react@6.1.1 jsdom@30.1.1 @testing-library/react@16.3.3 \
  @testing-library/jest-dom@7.0.1 @testing-library/user-event@14 @playwright/test@1.63.0
npx playwright install chromium
```

Expected: installs finish without `ERESOLVE` errors. If npm reports an ERESOLVE peer conflict, stop and report it rather than using `--force`.

Confirm the Phosphor `…Icon` names exist:

```bash
grep -c "export declare const HouseIcon\|HouseIcon" node_modules/@phosphor-icons/react/dist/ssr/index.d.ts
```

Expected: a number ≥ 1. If it prints 0, use the un-suffixed names (`House`, …) everywhere this plan says `…Icon`, and note that in the commit message.

- [ ] **Step 4: Write the config files**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.mts", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules", "reference"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
}

export default nextConfig
```

`postcss.config.mjs`:

```js
export default {
  plugins: { '@tailwindcss/postcss': {} },
}
```

`eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'reference/**',
    'test-results/**',
    'playwright-report/**',
  ]),
])
```

`vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
```

`test/matchMedia.ts`:

```ts
/**
 * jsdom has no matchMedia. Every query answers `false` unless listed in
 * `matches`, e.g. installMatchMedia({ '(prefers-reduced-motion: reduce)': true }).
 */
export function installMatchMedia(matches: Record<string, boolean> = {}) {
  window.matchMedia = ((query: string) => ({
    matches: !!matches[query],
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}
```

`vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { installMatchMedia } from './test/matchMedia'

// jsdom does not implement scrolling; the shell resets scroll on every route.
window.scrollTo = (() => {}) as typeof window.scrollTo
Element.prototype.scrollTo = function () {} as typeof Element.prototype.scrollTo

installMatchMedia()

afterEach(() => {
  cleanup()
  const root = document.documentElement
  for (const name of Array.from(root.attributes).map((a) => a.name)) {
    if (name.startsWith('data-')) root.removeAttribute(name)
  }
  root.removeAttribute('style')
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* a test may have stubbed storage to throw */
  }
  installMatchMedia()
})
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3100', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
      testIgnore: /phone\.spec\.ts/,
    },
    {
      name: 'phone',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
      testMatch: /phone\.spec\.ts/,
    },
  ],
})
```

- [ ] **Step 5: Write the failing unit test**

`tests/placeholder.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isPlaceholder } from '@/lib/placeholder'

describe('isPlaceholder', () => {
  it('flags strings that start with the PLACEHOLDER marker', () => {
    expect(isPlaceholder('PLACEHOLDER - GitHub profile URL')).toBe(true)
  })
  it('passes real content through', () => {
    expect(isPlaceholder('https://github.com/justine')).toBe(false)
    expect(isPlaceholder('')).toBe(false)
  })
})
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test`
Expected: FAIL, `Failed to resolve import "@/lib/placeholder"`.

- [ ] **Step 7: Implement `lib/placeholder.ts`**

```ts
/** Content gaps are strings that start with this marker (spec §10). */
export const PLACEHOLDER_PREFIX = 'PLACEHOLDER - '

export function isPlaceholder(value: string): boolean {
  return value.startsWith('PLACEHOLDER')
}
```

- [ ] **Step 8: Minimal app so `next build` has something to build**

`app/globals.css` (Task 2 replaces this):

```css
@import "tailwindcss";
@source not "../reference";
```

`app/layout.tsx` (Task 2 replaces this):

```tsx
import type { ReactNode } from 'react'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`app/(site)/page.tsx` (Task 5 replaces this):

```tsx
export default function HomePage() {
  return <h1>Kraft</h1>
}
```

`e2e/smoke.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('home responds and renders a heading', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
```

- [ ] **Step 9: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: unit PASS (2 tests), no type or lint errors, e2e `1 passed` (desktop project).

- [ ] **Step 10: Update spec source paths**

In `docs/superpowers/specs/2026-09-28-kraft-portfolio-design.md` §2, change every `Kraft_Portfolio_Design_System/` path to `reference/Kraft_Portfolio_Design_System/` and `kapeportfolio/src/` to `reference/kapeportfolio/src/`. Add one line under the table: `All reference material lives in reference/ (gitignored) since Phase 1 Task 1.`

- [ ] **Step 11: Commit**

```bash
git add .gitignore package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs vitest.config.mts vitest.setup.ts playwright.config.ts test lib tests e2e app docs
git commit -m "chore: scaffold Next.js app, tooling and test harness" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Kraft tokens, fonts and the pre-paint boot script

**Files:**
- Create: `lib/storage-keys.ts`, `lib/boot.ts`
- Replace: `app/globals.css`, `app/layout.tsx`
- Test: `tests/boot.test.ts`, `tests/no-raw-colors.test.ts`, `e2e/theme.spec.ts`

**Interfaces:**
- Produces: `THEME_KEY = 'kraft-theme'`, `PERF_KEY = 'kraft-perf'`, `A11Y_KEY = 'kraft-a11y'`; `bootScript: string`. `<html>` carries `data-js`, `data-theme="dark"|"light"`, and optionally `data-perf`, `data-a11y-text|contrast|motion|links`.
- Produces Tailwind utilities: colours `bg|text|border|from|to-{bg,frame,chrome,nav,s0,s1,s2,s3,chip,hover,field,dot,b1,b2,ink,ink-soft,ink2,ink3,ink4,accent,on-accent,wash,wash-b,glow,fade-a,fade-b,scrim}`; variants `shell:` (≥1100px), `dark:`, `light:`; animations `animate-screen-in`, `animate-pulse-dot`, `animate-rise`; fonts `font-sans` (Geist), `font-mono` (Geist Mono). CSS vars `--rail`, `--deskpad`.

- [ ] **Step 1: Write the failing boot-script tests**

`tests/boot.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { bootScript } from '@/lib/boot'
import { A11Y_KEY, PERF_KEY, THEME_KEY } from '@/lib/storage-keys'
import { installMatchMedia } from '@/test/matchMedia'

const run = () => new Function(bootScript)()
const html = () => document.documentElement

describe('bootScript', () => {
  it('marks JS as available', () => {
    run()
    expect(html().hasAttribute('data-js')).toBe(true)
  })

  it('uses the stored theme over the device setting', () => {
    installMatchMedia({ '(prefers-color-scheme: light)': true })
    localStorage.setItem(THEME_KEY, 'dark')
    run()
    expect(html().dataset.theme).toBe('dark')
  })

  it('follows the device when nothing valid is stored', () => {
    installMatchMedia({ '(prefers-color-scheme: light)': true })
    localStorage.setItem(THEME_KEY, 'purple')
    run()
    expect(html().dataset.theme).toBe('light')
  })

  it('defaults to dark when the device has no light preference', () => {
    run()
    expect(html().dataset.theme).toBe('dark')
  })

  it('restores a downgraded perf tier for this tab', () => {
    sessionStorage.setItem(PERF_KEY, 'low')
    run()
    expect(html().dataset.perf).toBe('low')
  })

  it('ignores an unknown perf tier', () => {
    sessionStorage.setItem(PERF_KEY, 'turbo')
    run()
    expect(html().dataset.perf).toBeUndefined()
  })

  it('restores accessibility switches', () => {
    localStorage.setItem(A11Y_KEY, JSON.stringify({ text: 'xl', contrast: true, motion: true, links: false }))
    run()
    expect(html().dataset.a11yText).toBe('xl')
    expect(html().dataset.a11yContrast).toBe('true')
    expect(html().dataset.a11yMotion).toBe('true')
    expect(html().dataset.a11yLinks).toBeUndefined()
  })

  it('survives storage that throws and still sets a theme', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(run).not.toThrow()
    expect(html().dataset.theme).toBe('dark')
    spy.mockRestore()
  })
})
```

`tests/no-raw-colors.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

const ROOTS = ['app', 'components', 'data', 'hooks', 'lib']
const ALLOWED = new Set(['app/globals.css'])
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g

function walk(dir: string): string[] {
  let out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out = out.concat(walk(p))
    else if (/\.(tsx?|css)$/.test(name)) out.push(p.replaceAll('\\', '/'))
  }
  return out
}

it('uses colours only through Kraft tokens (spec §3)', () => {
  const files = ROOTS.flatMap((r) => {
    try {
      return walk(r)
    } catch {
      return []
    }
  })
  const offenders = files
    .filter((f) => !ALLOWED.has(f))
    .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(RAW_COLOR)].map((m) => `${f}: ${m[0]}`))
  expect(offenders).toEqual([])
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: `boot.test.ts` FAILS (cannot resolve `@/lib/boot`). `no-raw-colors` PASSES.

- [ ] **Step 3: Implement `lib/storage-keys.ts` and `lib/boot.ts`**

```ts
// lib/storage-keys.ts
/** One place for every storage key, so the boot script and the libs agree. */
export const THEME_KEY = 'kraft-theme'
export const PERF_KEY = 'kraft-perf'
export const A11Y_KEY = 'kraft-a11y'
```

```ts
// lib/boot.ts
import { A11Y_KEY, PERF_KEY, THEME_KEY } from './storage-keys'

/**
 * Runs inline in <head> before first paint, so the page is never drawn in the
 * wrong theme, a downgraded visitor never sees the expensive layers flash, and
 * a11y switches apply from the first frame. Plain ES5, no imports.
 *
 * Theme rule (spec §7): a stored explicit choice wins, otherwise follow the
 * device. Kraft's :root is the dark palette, so dark is the fallback.
 */
export const bootScript = `(function(){var d=document.documentElement;d.setAttribute('data-js','');var t=null;try{t=localStorage.getItem(${JSON.stringify(THEME_KEY)})}catch(e){}var light=false;try{light=!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)}catch(e){}d.setAttribute('data-theme',t==='light'||t==='dark'?t:(light?'light':'dark'));try{var p=sessionStorage.getItem(${JSON.stringify(PERF_KEY)});if(p==='mid'||p==='low')d.setAttribute('data-perf',p)}catch(e){}try{var a=JSON.parse(localStorage.getItem(${JSON.stringify(A11Y_KEY)})||'null');if(a){if(a.text==='lg'||a.text==='xl')d.setAttribute('data-a11y-text',a.text);if(a.contrast)d.setAttribute('data-a11y-contrast','true');if(a.motion)d.setAttribute('data-a11y-motion','true');if(a.links)d.setAttribute('data-a11y-links','true')}}catch(e){}})();`
```

- [ ] **Step 4: Run to verify the unit tests pass**

Run: `npm test`
Expected: PASS (all boot tests, no-raw-colors, placeholder).

- [ ] **Step 5: Replace `app/globals.css` with the token layer**

The two token lines below are `reference/Kraft_Portfolio_Design_System/Kraft Portfolio.dc.html` lines 50 and 51, byte-for-byte. After writing the file, diff them against the source (`sed -n 50,51p` on the reference file) and fix any difference.

```css
@import "tailwindcss";
@source not "../reference";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
@custom-variant light (&:where([data-theme=light], [data-theme=light] *));

/* ---- Kraft tokens: copied byte-for-byte from Kraft Portfolio.dc.html:50-51 ---- */
:root{color-scheme:dark;--bg:#050505;--frame:#060607;--chrome:#0B0D0E;--nav:#080909;--s0:#0C0E10;--s1:#0A0B0D;--s2:#0F1113;--s3:#15181A;--chip:#141719;--hover:#101315;--field:#0A0C0D;--dot:#2A2F31;--b1:rgba(215,255,224,.075);--b2:rgba(215,255,224,.17);--ink:#F1F5F2;--inkSoft:#E7EDE9;--ink2:#C2CBC5;--ink3:#7C8781;--ink4:#5C655F;--accent:#D7FFE0;--onAccent:#041008;--wash:rgba(215,255,224,.1);--washB:rgba(215,255,224,.2);--glow:rgba(215,255,224,.55);--fadeA:rgba(6,6,7,.96);--fadeB:rgba(6,6,7,.72);--scrim:rgba(3,3,3,.74);--amb:19,74,48}
[data-theme=light]{color-scheme:light;--bg:#F2F5F1;--frame:#FFFFFF;--chrome:#ECF0EA;--nav:#FFFFFF;--s0:#F7F9F5;--s1:#FFFFFF;--s2:#FBFCF9;--s3:#EFF3EC;--chip:#EDF2EB;--hover:#E7EEE6;--field:#FFFFFF;--dot:#C9D2C8;--b1:rgba(11,46,30,.11);--b2:rgba(11,46,30,.22);--ink:#0B1310;--inkSoft:#121A16;--ink2:#3B4742;--ink3:#69756F;--ink4:#8A938E;--accent:#0E6B44;--onAccent:#F3FFF8;--wash:rgba(14,107,68,.09);--washB:rgba(14,107,68,.22);--glow:rgba(14,107,68,.3);--fadeA:rgba(255,255,255,.96);--fadeB:rgba(255,255,255,.7);--scrim:rgba(18,32,26,.45);--amb:150,205,175}

/* ---- Kraft shell sizing (Kraft Portfolio.dc.html:79-82, only the vars the live site uses) ---- */
:root{--rail:284px;--deskpad:34px}
@media (max-width:1700px){:root{--rail:272px}}
@media (max-width:1500px){:root{--rail:256px;--deskpad:28px}}
@media (max-width:1320px){:root{--rail:240px;--deskpad:22px}}

@theme {
  --color-*: initial;
  --breakpoint-shell: 68.75rem; /* 1100px */
  --animate-screen-in: kScreenA .54s cubic-bezier(.22,.7,.2,1) both;
  --animate-pulse-dot: kPulse 2.6s ease-in-out infinite;
  --animate-rise: kRise .22s ease both;
}

@theme inline {
  --color-transparent: transparent;
  --color-current: currentColor;
  --color-bg: var(--bg);
  --color-frame: var(--frame);
  --color-chrome: var(--chrome);
  --color-nav: var(--nav);
  --color-s0: var(--s0);
  --color-s1: var(--s1);
  --color-s2: var(--s2);
  --color-s3: var(--s3);
  --color-chip: var(--chip);
  --color-hover: var(--hover);
  --color-field: var(--field);
  --color-dot: var(--dot);
  --color-b1: var(--b1);
  --color-b2: var(--b2);
  --color-ink: var(--ink);
  --color-ink-soft: var(--inkSoft);
  --color-ink2: var(--ink2);
  --color-ink3: var(--ink3);
  --color-ink4: var(--ink4);
  --color-accent: var(--accent);
  --color-on-accent: var(--onAccent);
  --color-wash: var(--wash);
  --color-wash-b: var(--washB);
  --color-glow: var(--glow);
  --color-fade-a: var(--fadeA);
  --color-fade-b: var(--fadeB);
  --color-scrim: var(--scrim);
  --font-sans: var(--font-geist), system-ui, 'Helvetica Neue', sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}

/* ---- Kraft base (Kraft Portfolio.dc.html:52-66). Kraft's global
   `a:hover{color:#fff}` is intentionally dropped: it makes links vanish in the
   light theme; each component sets its own hover colour. ---- */
@layer base {
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg)}
  body{font-family:var(--font-sans);color:var(--ink);-webkit-font-smoothing:antialiased;text-wrap:pretty}
  button,input,textarea,select{font:inherit;color:inherit}
  h1,h2,h3,h4,p{margin:0}
  a{color:var(--accent);text-decoration:none}
  ::selection{background:rgba(120,128,124,.22);color:inherit}
  *:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  ::-webkit-scrollbar{width:9px;height:9px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:var(--s3);border-radius:9px;border:2px solid var(--s1)}
  html{scroll-behavior:smooth}
  [data-scroll]{scroll-behavior:smooth;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  button,a{transition:background-color .24s ease,border-color .24s ease,color .24s ease,box-shadow .24s ease,transform .24s cubic-bezier(.2,.7,.2,1)}
}

/* ---- Kraft keyframes (Kraft Portfolio.dc.html:70-78), verbatim ---- */
@keyframes kPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.75)}}
@keyframes kLineIn{from{opacity:0;transform:translateY(.2em)}to{opacity:1;transform:none}}
@keyframes kNodePop{0%{transform:scale(.82)}60%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes kSpark{0%{transform:translate(-50%,-50%) scale(.6);opacity:.9}100%{transform:translate(-50%,-50%) scale(2.6);opacity:0}}
@keyframes kBadgeIn{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
@keyframes kRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes kScreenA{from{opacity:0;transform:translateY(16px) scale(.994)}to{opacity:1;transform:none}}
@keyframes kScreenB{from{opacity:0;transform:translateY(16px) scale(.994)}to{opacity:1;transform:none}}
@keyframes kDrift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(3%,-4%,0) scale(1.08)}}

/* ---- Reduced motion: OS setting (Kraft :87) and the a11y switch ---- */
@media (prefers-reduced-motion:reduce){*{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}}
html[data-a11y-motion=true] *{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}

/* ---- Skip link ---- */
.skip-link{position:fixed;left:12px;top:-64px;z-index:100;padding:10px 14px;border-radius:10px;background:var(--accent);color:var(--onAccent);font-weight:600;transition:top .2s}
.skip-link:focus{top:12px}
```

- [ ] **Step 6: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Geist, Geist_Mono } from 'next/font/google'
import { bootScript } from '@/lib/boot'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: { default: 'Justine Acosta · Kraft', template: '%s · Kraft' },
  description:
    'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="bg-bg font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Write the first-paint e2e test**

`e2e/theme.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test.describe('theme on first paint', () => {
  test('a saved theme wins over the OS setting before any React code runs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.addInitScript(() => {
      localStorage.setItem('kraft-theme', 'light')
      document.addEventListener('DOMContentLoaded', () => {
        ;(window as unknown as { __themeAtDCL?: string }).__themeAtDCL = document.documentElement.dataset.theme
      })
    })
    await page.goto('/')
    const atDcl = await page.evaluate(() => (window as unknown as { __themeAtDCL?: string }).__themeAtDCL)
    expect(atDcl).toBe('light')
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`first visit follows the device (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme })
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-theme', scheme)
    })
  }

  test('body paints the Kraft background token', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe('rgb(242, 245, 241)') // --bg light #F2F5F1
  })
})
```

- [ ] **Step 8: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS. If `next build` fails fetching Google Fonts, there's no network: retry with a connection. Don't swap fonts.

- [ ] **Step 9: Commit**

```bash
git add app lib tests e2e
git commit -m "feat: Kraft tokens, Tailwind mapping, fonts and pre-paint boot script" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Theme switching (kape's sweep, Kraft's button) and motion helpers

**Files:**
- Create: `lib/a11y.ts`, `lib/motion.ts`, `lib/theme.ts`, `components/shell/ThemeButton.tsx`
- Modify: `app/globals.css` (append the sweep CSS)
- Test: `tests/theme.test.ts`, `tests/a11y.test.ts`, `tests/ThemeButton.test.tsx`, `e2e/theme.spec.ts` (append)

**Interfaces:**
- Consumes: `THEME_KEY`, `A11Y_KEY` (Task 2).
- Produces:
  - `lib/a11y.ts`: `type TextSize = 'md'|'lg'|'xl'`, `type A11yPrefs = { text: TextSize; contrast: boolean; motion: boolean; links: boolean }`, `DEFAULT_PREFS`, `A11Y_EVENT = 'a11ychange'`, `readPrefs(): A11yPrefs`, `applyPrefs(p)`, `savePrefs(p)`, `motionReduced(): boolean`.
  - `lib/motion.ts`: `prefersReducedMotion(): boolean`.
  - `lib/theme.ts`: `type Theme = 'light'|'dark'`, `THEME_EVENT = 'themechange'`, `getTheme(): Theme`, `setTheme(theme: Theme, origin?: SweepOrigin): void`, `toggleTheme(from?: Element | null): Theme`, `type SweepOrigin = { x: number; y: number }`.
  - `<ThemeButton size?: 38 | 40 className?: string />`: Kraft's button; shows `SunIcon` in dark and `MoonStarsIcon` in light, purely via CSS.

- [ ] **Step 1: Write the failing tests**

`tests/a11y.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { A11Y_EVENT, DEFAULT_PREFS, motionReduced, readPrefs, savePrefs } from '@/lib/a11y'
import { A11Y_KEY } from '@/lib/storage-keys'

describe('a11y prefs', () => {
  it('returns defaults when nothing is stored', () => {
    expect(readPrefs()).toEqual(DEFAULT_PREFS)
  })
  it('sanitises stored values', () => {
    localStorage.setItem(A11Y_KEY, JSON.stringify({ text: 'huge', contrast: 1, motion: 'yes' }))
    expect(readPrefs()).toEqual({ text: 'md', contrast: true, motion: true, links: false })
  })
  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem(A11Y_KEY, '{nope')
    expect(readPrefs()).toEqual(DEFAULT_PREFS)
  })
  it('savePrefs applies, stores and announces', () => {
    const heard = vi.fn()
    window.addEventListener(A11Y_EVENT, heard)
    savePrefs({ text: 'lg', contrast: false, motion: true, links: true })
    expect(document.documentElement.dataset.a11yText).toBe('lg')
    expect(motionReduced()).toBe(true)
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!)).toMatchObject({ motion: true })
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(A11Y_EVENT, heard)
  })
  it('savePrefs still applies when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'QuotaExceededError')
    })
    expect(() => savePrefs({ ...DEFAULT_PREFS, contrast: true })).not.toThrow()
    expect(document.documentElement.dataset.a11yContrast).toBe('true')
    spy.mockRestore()
  })
})
```

`tests/theme.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { getTheme, setTheme, THEME_EVENT, toggleTheme } from '@/lib/theme'
import { THEME_KEY } from '@/lib/storage-keys'
import { installMatchMedia } from '@/test/matchMedia'

type VTDoc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }

describe('theme', () => {
  it('reads dark when no theme attribute is set (Kraft :root is dark)', () => {
    expect(getTheme()).toBe('dark')
  })

  it('switches instantly without View Transitions, stores and announces', () => {
    const heard = vi.fn()
    window.addEventListener(THEME_EVENT, heard)
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(THEME_EVENT, heard)
  })

  it('uses the circular sweep from the origin when View Transitions exist', async () => {
    const doc = document as VTDoc
    let finish!: () => void
    doc.startViewTransition = vi.fn((cb: () => void) => {
      cb()
      return { finished: new Promise<void>((r) => (finish = r)) }
    })
    setTheme('light', { x: 10, y: 20 })
    const root = document.documentElement
    expect(doc.startViewTransition).toHaveBeenCalledOnce()
    expect(root.style.getPropertyValue('--sweep-x')).toBe('10px')
    expect(root.dataset.themeSweep).toBe('on')
    finish()
    await new Promise((r) => setTimeout(r, 0))
    expect(root.dataset.themeSweep).toBeUndefined()
    delete doc.startViewTransition
  })

  it('skips the sweep for reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const doc = document as VTDoc
    doc.startViewTransition = vi.fn()
    setTheme('light', { x: 0, y: 0 })
    expect(doc.startViewTransition).not.toHaveBeenCalled()
    expect(getTheme()).toBe('light')
    delete doc.startViewTransition
  })

  it('toggleTheme flips and returns the new theme', () => {
    document.documentElement.dataset.theme = 'light'
    expect(toggleTheme()).toBe('dark')
    expect(getTheme()).toBe('dark')
  })

  it('still switches when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => setTheme('light')).not.toThrow()
    expect(getTheme()).toBe('light')
    spy.mockRestore()
  })
})
```

`tests/ThemeButton.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeButton from '@/components/shell/ThemeButton'

describe('ThemeButton', () => {
  it('is labelled like Kraft and toggles the theme', async () => {
    document.documentElement.dataset.theme = 'dark'
    render(<ThemeButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Toggle dark and light mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/a11y`, `@/lib/theme`, `@/components/shell/ThemeButton`).

- [ ] **Step 3: Implement `lib/a11y.ts`** (port of `reference/kapeportfolio/src/lib/a11y.ts` with Kraft's key; the boot script replaces `restorePrefs`)

```ts
import { A11Y_KEY } from './storage-keys'

/**
 * Accessibility switches (spec §6, §11). Each lands on <html> as a
 * data-a11y-* attribute, is remembered in localStorage, and is re-applied
 * before first paint by lib/boot.ts. The AccessMenu UI arrives in Phase 4.
 */
export type TextSize = 'md' | 'lg' | 'xl'
export type A11yPrefs = { text: TextSize; contrast: boolean; motion: boolean; links: boolean }

export const A11Y_EVENT = 'a11ychange'
export const DEFAULT_PREFS: A11yPrefs = { text: 'md', contrast: false, motion: false, links: false }

export function readPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(A11Y_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<A11yPrefs>
    return {
      text: p.text === 'lg' || p.text === 'xl' ? p.text : 'md',
      contrast: !!p.contrast,
      motion: !!p.motion,
      links: !!p.links,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

export function applyPrefs(p: A11yPrefs) {
  const d = document.documentElement.dataset
  if (p.text === 'md') delete d.a11yText
  else d.a11yText = p.text
  if (p.contrast) d.a11yContrast = 'true'
  else delete d.a11yContrast
  if (p.motion) d.a11yMotion = 'true'
  else delete d.a11yMotion
  if (p.links) d.a11yLinks = 'true'
  else delete d.a11yLinks
}

export function savePrefs(p: A11yPrefs) {
  applyPrefs(p)
  try {
    localStorage.setItem(A11Y_KEY, JSON.stringify(p))
  } catch {
    /* storage blocked: the choice lasts for this page */
  }
  window.dispatchEvent(new CustomEvent<A11yPrefs>(A11Y_EVENT, { detail: p }))
}

export function motionReduced(): boolean {
  return document.documentElement.dataset.a11yMotion === 'true'
}
```

- [ ] **Step 4: Implement `lib/motion.ts`**

```ts
import { motionReduced } from './a11y'

/** One answer for "should this move?": the OS setting or the a11y switch. */
export function prefersReducedMotion(): boolean {
  let os = false
  try {
    os = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    os = false
  }
  return os || motionReduced()
}
```

- [ ] **Step 5: Implement `lib/theme.ts`** (kape's sweep from `reference/kapeportfolio/src/lib/theme.ts`, Kraft key, Kraft default)

```ts
import { prefersReducedMotion } from './motion'
import { THEME_KEY } from './storage-keys'

/**
 * Two themes on one token set: `data-theme` on <html> is the only switch.
 * Kraft's :root is the dark palette; [data-theme=light] overrides it.
 * The first value is written by lib/boot.ts before paint.
 *
 * ContourCanvas listens for THEME_EVENT and eases its colours on its own clock.
 */
export type Theme = 'light' | 'dark'
export type SweepOrigin = { x: number; y: number }

export const THEME_EVENT = 'themechange'

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    /* storage blocked: the theme just does not persist */
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }))
}

type WithViewTransition = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

/**
 * kape's theme switch: the new palette grows as a hard-edged circle out of the
 * control that asked for it (View Transitions API, 1.2s, CSS in globals.css).
 * No API, or reduced motion → instant switch.
 */
export function setTheme(theme: Theme, origin?: SweepOrigin) {
  const doc = document as WithViewTransition
  const root = document.documentElement
  if (!doc.startViewTransition || prefersReducedMotion() || getTheme() === theme) {
    applyTheme(theme)
    return
  }
  const x = origin?.x ?? window.innerWidth / 2
  const y = origin?.y ?? window.innerHeight / 2
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  root.style.setProperty('--sweep-x', `${x}px`)
  root.style.setProperty('--sweep-y', `${y}px`)
  root.style.setProperty('--sweep-r', `${r}px`)
  root.dataset.themeSweep = 'on'
  doc
    .startViewTransition(() => applyTheme(theme))
    .finished.finally(() => {
      delete root.dataset.themeSweep
    })
}

/** Pass the toggle's element so the sweep starts under it. */
export function toggleTheme(from?: Element | null): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  const r = from?.getBoundingClientRect()
  setTheme(next, r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)
  return next
}
```

- [ ] **Step 6: Implement `components/shell/ThemeButton.tsx`** (Kraft markup `Kraft Portfolio.dc.html:223` and `:306`)

```tsx
'use client'

import { MoonStarsIcon, SunIcon } from '@phosphor-icons/react/ssr'
import { toggleTheme } from '@/lib/theme'

/**
 * Kraft's theme button. The icon is chosen by CSS from <html data-theme>
 * (sun in dark, moon-stars in light), so it is right on the first paint and
 * needs no state or hydration guard.
 */
export default function ThemeButton({ size = 38, className = '' }: { size?: 38 | 40; className?: string }) {
  const box = size === 40 ? 'size-10 rounded-xl' : 'size-[38px] rounded-[11px]'
  const icon = size === 40 ? 16 : 17
  return (
    <button
      type="button"
      aria-label="Toggle dark and light mode"
      onClick={(e) => toggleTheme(e.currentTarget)}
      className={`grid shrink-0 cursor-pointer place-items-center border border-wash-b bg-wash text-accent transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_var(--glow)] ${box} ${className}`}
    >
      <SunIcon size={icon} aria-hidden className="light:hidden" />
      <MoonStarsIcon size={icon} aria-hidden className="hidden light:block" />
    </button>
  )
}
```

- [ ] **Step 7: Append kape's sweep CSS to `app/globals.css`** (from `reference/kapeportfolio/src/styles/global.css:504-521`)

```css
/* ---- Theme sweep (kape lib/theme.ts): the new palette is a circle that
   grows from the toggle; default cross-fades are off so the edge stays hard. ---- */
::view-transition-old(root),
::view-transition-new(root){animation:none;mix-blend-mode:normal}
html[data-theme-sweep]::view-transition-new(root){animation:theme-sweep 1200ms cubic-bezier(.55,0,.15,1) both}
@keyframes theme-sweep{
  from{clip-path:circle(0px at var(--sweep-x,50%) var(--sweep-y,50%))}
  to{clip-path:circle(var(--sweep-r,150vmax) at var(--sweep-x,50%) var(--sweep-y,50%))}
}
```

- [ ] **Step 8: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 9: Append the e2e toggle tests to `e2e/theme.spec.ts`**

The button only appears in the shell from Task 5, so these tests use a temporary harness. Replace `app/(site)/page.tsx` for now with:

```tsx
import ThemeButton from '@/components/shell/ThemeButton'

export default function HomePage() {
  return (
    <>
      <h1>Kraft</h1>
      <ThemeButton />
    </>
  )
}
```

Append:

```ts
test.describe('theme button', () => {
  test('toggles, persists and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    expect(await page.evaluate(() => localStorage.getItem('kraft-theme'))).toBe('light')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('works when storage is blocked', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(errors).toEqual([])
  })
})
```

- [ ] **Step 10: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
git add app components lib tests e2e
git commit -m "feat: theme switching with kape sweep and Kraft theme button" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Navigation data, scroller and the shell navigation provider

**Files:**
- Create: `data/nav.ts`, `lib/scroller.ts`, `components/shell/NavigationProvider.tsx`
- Test: `tests/nav.test.ts`, `tests/NavigationProvider.test.tsx`

**Interfaces:**
- Consumes: `prefersReducedMotion()` (Task 3).
- Produces:
  - `data/nav.ts`: `type NavItem = { href: string; label: string; hint: string; eyebrow: string; icon: Icon }`, `NAV: NavItem[]` (7 items, spec §7 order), `type MobileNavItem = { href: string; label: string; icon: Icon; center?: boolean }`, `MOBILE_NAV: MobileNavItem[]` (5 items), `isActivePath(pathname: string, href: string): boolean`, `navForPath(pathname: string): NavItem`.
  - `lib/scroller.ts`: `PANEL_ID = 'main-content'`, `getPanel(): HTMLElement | null`, `registerLenis(l: LenisLike | null): void`, `scrollToTop(opts: { smooth: boolean }): void`, `type LenisLike = { scrollTo(target: number, opts?: { immediate?: boolean; force?: boolean }): void }`.
  - `NavigationProvider`: `SWAP_MS = 160`, `useShellNav(): { go(href: string): void; swapping: boolean }`, `<ShellLink href …LinkProps>` (a `next/link` that routes plain left-clicks through `go`).

- [ ] **Step 1: Write the failing tests**

`tests/nav.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { isActivePath, MOBILE_NAV, NAV, navForPath } from '@/data/nav'

describe('nav data', () => {
  it('lists the seven sections in spec order', () => {
    expect(NAV.map((n) => n.label)).toEqual([
      'Home', 'Projects', 'Showcase', 'Services', 'Testimonials', 'About', 'FAQs / Contact',
    ])
    expect(NAV.map((n) => n.hint)).toEqual([
      'OVERVIEW', 'BUILDS', 'FLAGSHIP', 'OFFERS', 'CLIENTS', 'PROFILE', 'INQUIRY',
    ])
  })

  it("has Kraft's five phone slots with Start in the middle", () => {
    expect(MOBILE_NAV.map((m) => m.label)).toEqual(['Home', 'Work', 'Start', 'Services', 'About'])
    expect(MOBILE_NAV[2]).toMatchObject({ href: '/contact', center: true })
  })

  it('matches Home only exactly and sections by prefix', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/projects', '/')).toBe(false)
    expect(isActivePath('/projects', '/projects')).toBe(true)
    expect(isActivePath('/projects/funnels', '/projects')).toBe(true)
    expect(isActivePath('/projectsx', '/projects')).toBe(false)
  })

  it('finds the nav item for a path, falling back to Home', () => {
    expect(navForPath('/services').hint).toBe('OFFERS')
    expect(navForPath('/nowhere').hint).toBe('OVERVIEW')
  })
})
```

`tests/NavigationProvider.test.tsx`:

```tsx
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NavigationProvider, SWAP_MS, useShellNav } from '@/components/shell/NavigationProvider'
import { installMatchMedia } from '@/test/matchMedia'

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: '/' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}))

const setup = () => renderHook(() => useShellNav(), { wrapper: NavigationProvider })

describe('NavigationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nav.push.mockReset()
    nav.pathname = '/'
  })
  afterEach(() => vi.useRealTimers())

  it('fades out for SWAP_MS, then pushes without Next scroll handling', () => {
    const { result } = setup()
    act(() => result.current.go('/projects'))
    expect(result.current.swapping).toBe(true)
    expect(nav.push).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledWith('/projects', { scroll: false })
  })

  it('stops swapping once the route has changed', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/projects'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    nav.pathname = '/projects'
    rerender()
    expect(result.current.swapping).toBe(false)
  })

  it('lets the last of two rapid clicks win', () => {
    const { result } = setup()
    act(() => result.current.go('/projects'))
    act(() => vi.advanceTimersByTime(80))
    act(() => result.current.go('/about'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(nav.push).toHaveBeenCalledWith('/about', { scroll: false })
  })

  it('does not navigate when the current page is clicked', () => {
    const { result } = setup()
    act(() => result.current.go('/'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).not.toHaveBeenCalled()
    expect(result.current.swapping).toBe(false)
  })

  it('navigates immediately for reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { result } = setup()
    act(() => result.current.go('/about'))
    expect(nav.push).toHaveBeenCalledWith('/about', { scroll: false })
    expect(result.current.swapping).toBe(false)
  })

  it('never stays invisible after a back/forward navigation elsewhere', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/projects'))
    nav.pathname = '/services' // user pressed back/forward mid-fade
    rerender()
    expect(result.current.swapping).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/data/nav` and `@/components/shell/NavigationProvider`).

- [ ] **Step 3: Implement `data/nav.ts`** (Kraft `SCREENS`/`MOBILE`, `Kraft Portfolio.dc.html:366-386`, plus Showcase)

```ts
import type { Icon } from '@phosphor-icons/react'
import {
  BriefcaseIcon,
  ChatCircleDotsIcon,
  FlagIcon,
  FolderOpenIcon,
  HouseIcon,
  PaperPlaneTiltIcon,
  QuotesIcon,
  StackIcon,
  UserCircleIcon,
  UserIcon,
} from '@phosphor-icons/react/ssr'

export type NavItem = { href: string; label: string; hint: string; eyebrow: string; icon: Icon }
export type MobileNavItem = { href: string; label: string; icon: Icon; center?: boolean }

/** Sidebar order and numbering (spec §7). Hints are Kraft's crumbs. */
export const NAV: NavItem[] = [
  { href: '/', label: 'Home', hint: 'OVERVIEW', eyebrow: 'HOME / OVERVIEW', icon: HouseIcon },
  { href: '/projects', label: 'Projects', hint: 'BUILDS', eyebrow: 'PROJECTS / BUILDS', icon: FolderOpenIcon },
  { href: '/showcase', label: 'Showcase', hint: 'FLAGSHIP', eyebrow: 'SHOWCASE / FLAGSHIP', icon: FlagIcon },
  { href: '/services', label: 'Services', hint: 'OFFERS', eyebrow: 'SERVICES / OFFERS', icon: StackIcon },
  { href: '/testimonials', label: 'Testimonials', hint: 'CLIENTS', eyebrow: 'TESTIMONIALS / CLIENTS', icon: QuotesIcon },
  { href: '/about', label: 'About', hint: 'PROFILE', eyebrow: 'ABOUT / PROFILE', icon: UserCircleIcon },
  { href: '/contact', label: 'FAQs / Contact', hint: 'INQUIRY', eyebrow: 'FAQS / CONTACT', icon: ChatCircleDotsIcon },
]

/** Kraft's phone nav. Showcase and Testimonials are reached from Home and ⌘K. */
export const MOBILE_NAV: MobileNavItem[] = [
  { href: '/', label: 'Home', icon: HouseIcon },
  { href: '/projects', label: 'Work', icon: BriefcaseIcon },
  { href: '/contact', label: 'Start', icon: PaperPlaneTiltIcon, center: true },
  { href: '/services', label: 'Services', icon: StackIcon },
  { href: '/about', label: 'About', icon: UserIcon },
]

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function navForPath(pathname: string): NavItem {
  return NAV.find((n) => isActivePath(pathname, n.href)) ?? NAV[0]
}
```

- [ ] **Step 4: Implement `lib/scroller.ts`**

```ts
/**
 * From 1100px the document does not scroll: the shell panel (#main-content)
 * does. Below that the panel is ordinary flow and the window scrolls. Every
 * "go to top" goes through here so it works in both, and through Lenis when
 * Lenis owns the panel (hooks/useSmoothScroll.ts registers it).
 */
export const PANEL_ID = 'main-content'

export type LenisLike = { scrollTo(target: number, opts?: { immediate?: boolean; force?: boolean }): void }

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
```

- [ ] **Step 5: Implement `components/shell/NavigationProvider.tsx`**

```tsx
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
import { scrollToTop } from '@/lib/scroller'

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

  const go = useCallback(
    (href: string) => {
      window.clearTimeout(timer.current)
      if (href === pathname) {
        setPending(null)
        scrollToTop({ smooth: true })
        return
      }
      if (prefersReducedMotion()) {
        setPending(null)
        router.push(href, { scroll: false })
        return
      }
      setPending({ href, from: pathname })
      timer.current = window.setTimeout(() => router.push(href, { scroll: false }), SWAP_MS)
    },
    [pathname, router],
  )

  // The new page is committed: reset scroll while it is still transparent.
  useEffect(() => {
    scrollToTop({ smooth: false })
  }, [pathname])

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
```

- [ ] **Step 6: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Typecheck, lint and commit**

Run: `npm run typecheck && npm run lint`
Expected: clean.

```bash
git add data lib components tests
git commit -m "feat: nav data, scroller and Kraft crossfade navigation provider" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The desktop shell (sidebar, top bar, panel, placeholder routes)

**Files:**
- Create: `data/profile.ts`, `components/shell/ManilaClock.tsx`, `components/shell/MagnetLink.tsx`, `components/shell/Sidebar.tsx`, `components/shell/TopBar.tsx`, `components/shell/PanelContent.tsx`, `components/ui/PagePlaceholder.tsx`, `app/(site)/layout.tsx`, `app/(site)/template.tsx`, `app/(site)/{projects,showcase,services,testimonials,about,contact}/page.tsx`, `public/assets/kraft-mark.svg`, `public/assets/portrait.jpg`
- Replace: `app/(site)/page.tsx`
- Test: `tests/Sidebar.test.tsx`, `e2e/shell.spec.ts`

**Interfaces:**
- Consumes: `NAV`, `isActivePath`, `navForPath` (Task 4); `ShellLink`, `useShellNav`, `NavigationProvider` (Task 4); `PANEL_ID` (Task 4); `ThemeButton` (Task 3); `isPlaceholder` (Task 1).
- Produces:
  - `data/profile.ts`: `profile` with `name`, `brand`, `handleLines: [string, string]`, `verifiedLabel`, `portrait: { src; alt; position }`, `email`, `timezone`, `tzLabel`, `availability: { label; regions: string[] }`, `socials: { label; href; icon: Icon }[]`, `copyright`.
  - `<PagePlaceholder href phase />`.
  - `[data-panel-content]` on the panel's fading wrapper; `#main-content` is the scroll panel; `main > div` wraps TopBar + content (the Lenis content element, Task 8).
  - Layout slots later tasks fill in: `{/* Task 6: wrap everything below in <PaletteProvider> */}`, `{/* Task 7: phone */}`, `{/* Task 8: scroll */}`, `{/* Task 10: background */}`.

- [ ] **Step 1: Copy the assets**

```bash
mkdir -p public/assets
cp "reference/Kraft_Portfolio_Design_System/assets/kraft-mark.svg" "reference/Kraft_Portfolio_Design_System/assets/portrait.jpg" public/assets/
```

- [ ] **Step 2: Write the failing sidebar test**

`tests/Sidebar.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import Sidebar from '@/components/shell/Sidebar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/projects',
}))

const renderSidebar = () =>
  render(
    <NavigationProvider>
      <Sidebar />
    </NavigationProvider>,
  )

describe('Sidebar', () => {
  it('numbers the seven sections 01-07 and marks the current one', () => {
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(7)
    expect(links.map((l) => l.textContent)).toEqual([
      'Home01', 'Projects02', 'Showcase03', 'Services04', 'Testimonials05', 'About06', 'FAQs / Contact07',
    ])
    expect(links[1]).toHaveAttribute('aria-current', 'page')
    expect(links[0]).not.toHaveAttribute('aria-current')
  })

  it("shows Kraft's identity block", () => {
    renderSidebar()
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
    expect(screen.getByText('Available for work')).toBeInTheDocument()
  })

  it('points placeholder social links at # and never opens a new tab for them', () => {
    renderSidebar()
    const gh = screen.getByRole('link', { name: 'GitHub' })
    expect(gh).toHaveAttribute('href', '#')
    expect(gh).not.toHaveAttribute('target')
  })

  it('links Start a project to Contact', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /Start a project/ })).toHaveAttribute('href', '/contact')
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/components/shell/Sidebar`).

- [ ] **Step 4: Implement `data/profile.ts`**

```ts
import type { Icon } from '@phosphor-icons/react'
import { DiscordLogoIcon, GithubLogoIcon, LinkedinLogoIcon, XLogoIcon } from '@phosphor-icons/react/ssr'

/**
 * Identity shown in the shell. Text is Kraft's, verbatim. Gaps are
 * "PLACEHOLDER - …" strings (spec §10). Page copy lives in the other data files.
 */
export const profile = {
  name: 'Justine Acosta',
  brand: 'KRAFT',
  handleLines: ['@Kraft · FULL STACK DEV', 'AI AUTOMATION & WORKFLOWS'] as [string, string],
  verifiedLabel: 'Certified',
  portrait: { src: '/assets/portrait.jpg', alt: 'Portrait of Justine Acosta', position: '57% 36%' },
  email: 'PLACEHOLDER - your contact email (the Kraft design used justine@kraft.dev)',
  timezone: 'Asia/Manila',
  tzLabel: 'GMT+8',
  availability: { label: 'Available for work', regions: ['US', 'EU', 'CA'] },
  socials: [
    { label: 'GitHub', href: 'PLACEHOLDER - GitHub profile URL', icon: GithubLogoIcon },
    { label: 'LinkedIn', href: 'PLACEHOLDER - LinkedIn profile URL', icon: LinkedinLogoIcon },
    { label: 'X', href: 'PLACEHOLDER - X profile URL', icon: XLogoIcon },
    { label: 'Discord', href: 'PLACEHOLDER - Discord invite or profile URL', icon: DiscordLogoIcon },
  ] satisfies { label: string; href: string; icon: Icon }[],
  copyright: '© 2026 KRAFT · JUSTINE ACOSTA',
}
```

- [ ] **Step 5: Implement the small shell pieces**

`components/shell/ManilaClock.tsx`:

```tsx
'use client'

import { useSyncExternalStore } from 'react'
import { profile } from '@/data/profile'

const fmt = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: profile.timezone,
})

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 20_000)
  return () => window.clearInterval(id)
}

/** Kraft's live GMT+8 clock (Kraft Portfolio.dc.html:657-661). */
export default function ManilaClock() {
  const time = useSyncExternalStore(subscribe, () => fmt.format(new Date()), () => '--:--')
  return <time suppressHydrationWarning>{time}</time>
}
```

`components/shell/MagnetLink.tsx`:

```tsx
'use client'

import type { ComponentProps } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { ShellLink } from './NavigationProvider'

/** Kraft's "magnet" hover on the sidebar CTA (Kraft Portfolio.dc.html:723-731). */
export default function MagnetLink(props: ComponentProps<typeof ShellLink>) {
  return (
    <ShellLink
      {...props}
      onMouseMove={(e) => {
        if (prefersReducedMotion()) return
        const el = e.currentTarget
        const b = el.getBoundingClientRect()
        const dx = ((e.clientX - (b.left + b.width / 2)) / b.width) * 9
        const dy = ((e.clientY - (b.top + b.height / 2)) / b.height) * 5 - 1
        el.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
      }}
    />
  )
}
```

- [ ] **Step 6: Implement `components/shell/Sidebar.tsx`** (Kraft `Kraft Portfolio.dc.html:202-264`, fake-frame chrome removed)

```tsx
'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { isActivePath, NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'
import ManilaClock from './ManilaClock'
import MagnetLink from './MagnetLink'
import { ShellLink } from './NavigationProvider'
import ThemeButton from './ThemeButton'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Profile and site navigation"
      className="hidden w-(--rail) shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-b1 bg-linear-to-b from-s1 to-bg px-4 pt-5 pb-4 shell:flex"
    >
      <div className="flex items-center gap-2.5">
        <Image src="/assets/kraft-mark.svg" alt="" width={26} height={26} className="block rounded-lg border border-b1" />
        <span className="text-sm font-bold tracking-[.16em]">{profile.brand}</span>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <div className="relative flex size-[120px] items-center justify-center">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-full bg-[radial-gradient(circle_at_50%_32%,var(--washB),transparent_68%)]"
          />
          <Image
            src={profile.portrait.src}
            alt={profile.portrait.alt}
            width={114}
            height={114}
            priority
            className="relative size-[114px] rounded-full border border-b2 object-cover"
            style={{ objectPosition: profile.portrait.position }}
          />
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="text-[16.5px] font-semibold tracking-[-.015em]">{profile.name}</span>
          <SealCheckIcon weight="fill" size={17} role="img" aria-label={profile.verifiedLabel} className="text-accent" />
        </div>
        <div className="text-center font-mono text-[10px] leading-[1.5] tracking-[.04em] text-ink3">
          {profile.handleLines[0]}
          <br />
          {profile.handleLines[1]}
        </div>
        <div className="mt-0.5 flex flex-wrap justify-center gap-2">
          {profile.socials.map((s) => {
            const Icon = s.icon
            const real = !isPlaceholder(s.href)
            return (
              <a
                key={s.label}
                href={real ? s.href : '#'}
                aria-label={s.label}
                {...(real ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="grid size-[38px] place-items-center rounded-[11px] border border-b1 bg-s2 text-ink2 transition-all duration-250 hover:-translate-y-0.5 hover:border-b2 hover:text-accent"
              >
                <Icon size={17} aria-hidden />
              </a>
            )
          })}
          <ThemeButton />
        </div>
      </div>

      <div className="h-px bg-b1" />

      <nav aria-label="Sections" className="flex flex-col gap-[3px]">
        {NAV.map((item, i) => {
          const active = isActivePath(pathname, item.href)
          const Icon = item.icon
          return (
            <ShellLink
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-[11px] text-left transition-colors duration-250 hover:bg-hover"
            >
              {active && (
                <>
                  <span aria-hidden className="absolute inset-0 rounded-xl border border-wash-b bg-linear-to-r from-wash to-transparent" />
                  <span aria-hidden className="absolute top-2.5 bottom-2.5 -left-4 w-[3px] rounded-r-[3px] bg-accent shadow-[0_0_14px_var(--glow)]" />
                </>
              )}
              <span aria-hidden className="relative grid size-[22px] place-items-center rounded-[7px] border border-b1 bg-s3">
                <Icon size={14} className={active ? 'text-accent' : 'text-ink3'} />
              </span>
              <span className="relative text-sm font-medium tracking-[-.01em] text-ink-soft">{item.label}</span>
              <span className="relative ml-auto font-mono text-[9.5px] text-ink3">{String(i + 1).padStart(2, '0')}</span>
            </ShellLink>
          )
        })}
      </nav>

      <div className="min-h-3 flex-1" />

      <div className="flex flex-col gap-[7px] rounded-[14px] border border-b1 bg-linear-to-b from-s2 to-s1 px-3.5 py-[13px]">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-[7px] animate-pulse-dot rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          <span className="text-[12.5px] font-medium">{profile.availability.label}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-[5px]">
          {profile.availability.regions.map((r) => (
            <span key={r} className="rounded-[7px] border border-wash-b bg-wash px-[7px] py-[3px] font-mono text-[9px] tracking-[.1em] text-accent">
              {r}
            </span>
          ))}
          <span className="self-center font-mono text-[9px] tracking-[.06em] text-ink3">TIMEZONES</span>
          <span className="font-mono text-[10px] tracking-[.06em] text-ink3">
            {profile.tzLabel} · <ManilaClock /> LOCAL
          </span>
        </div>
      </div>

      <MagnetLink
        href="/contact"
        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[13px] bg-accent p-[13px] text-[13.5px] font-semibold text-on-accent transition-[transform,box-shadow] duration-250 hover:shadow-[0_12px_32px_-12px_var(--glow)]"
      >
        Start a project <ArrowRightIcon size={16} aria-hidden />
      </MagnetLink>

      <span className="font-mono text-[9px] tracking-[.06em] text-ink4">{profile.copyright}</span>
    </aside>
  )
}
```

- [ ] **Step 7: Implement `TopBar`, `PanelContent`, `PagePlaceholder`**

`components/shell/TopBar.tsx` (Kraft `:267-273`; the Jump-to button is wired in Task 6):

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import { navForPath } from '@/data/nav'
import { ShellLink } from './NavigationProvider'

export default function TopBar({ onJump }: { onJump?: () => void }) {
  const pathname = usePathname()
  return (
    <div className="sticky top-0 z-5 hidden items-center gap-3.5 bg-linear-to-b from-fade-a via-fade-b via-65% to-transparent py-4 backdrop-blur-[8px] shell:flex">
      <span className="font-mono text-[10.5px] tracking-[.14em] text-ink3">KRAFT / {navForPath(pathname).hint}</span>
      <div className="ml-auto flex items-center gap-2.5">
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            className="flex min-h-10 cursor-pointer items-center gap-[9px] rounded-[11px] border border-b1 bg-s2 px-3 py-[9px] text-[12.5px] text-ink3 transition-all duration-250 hover:border-b2 hover:text-ink2"
          >
            Jump to… <kbd className="rounded-md bg-chip px-1.5 py-0.5 font-mono text-[10px] text-ink2">⌘K</kbd>
          </button>
        )}
        <ShellLink
          href="/contact"
          className="flex min-h-10 items-center gap-2 rounded-[11px] border border-b2 bg-wash px-[15px] py-[9px] text-[12.5px] font-medium text-accent transition-all duration-250 hover:border-accent hover:bg-accent hover:text-on-accent"
        >
          Get in touch <ArrowUpRightIcon size={15} aria-hidden />
        </ShellLink>
      </div>
    </div>
  )
}
```

`components/shell/PanelContent.tsx`:

```tsx
'use client'

import type { ReactNode } from 'react'
import { useShellNav } from './NavigationProvider'

/** The part of the panel that dims out during Kraft's 160ms swap. It is also the
    container that page layouts size from (`@container`, Kraft's cqw units). */
export default function PanelContent({ children }: { children: ReactNode }) {
  const { swapping } = useShellNav()
  return (
    <div
      data-panel-content
      className={`@container transition-opacity duration-160 ease-linear ${swapping ? 'opacity-0' : 'opacity-100'}`}
    >
      {children}
    </div>
  )
}
```

`components/ui/PagePlaceholder.tsx`:

```tsx
import { navForPath } from '@/data/nav'

/** Phase 1 stand-in for a page; each phase replaces its own routes. */
export default function PagePlaceholder({ href, phase }: { href: string; phase: number }) {
  const item = navForPath(href)
  return (
    <section className="flex flex-col gap-[clamp(14px,1.6cqw,20px)] pt-2">
      <p className="font-mono text-[10.5px] tracking-[.14em] text-accent">{item.eyebrow}</p>
      <h1 className="text-[clamp(28px,4.6cqw,54px)] leading-[1.03] font-bold tracking-[-.035em]">{item.label}</h1>
      <p data-reveal className="max-w-[60ch] text-ink2">{`PLACEHOLDER - this page is built in Phase ${phase}.`}</p>
    </section>
  )
}
```

- [ ] **Step 8: Implement the `(site)` layout, template and routes**

`app/(site)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PanelContent from '@/components/shell/PanelContent'
import Sidebar from '@/components/shell/Sidebar'
import TopBar from '@/components/shell/TopBar'
import { PANEL_ID } from '@/lib/scroller'

/**
 * The shell (spec §5, §7). This layout stays mounted across navigations, so the
 * sidebar, background and intro persist while only the panel content swaps.
 * ≥1100px: fixed viewport, the panel scrolls. Below: document scroll.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      {/* Task 6: wrap everything below in <PaletteProvider> */}
      <a href={`#${PANEL_ID}`} className="skip-link">
        Skip to main content
      </a>
      {/* Task 10: background */}
      {/* Task 8: scroll */}
      <div className="relative z-1 shell:flex shell:h-dvh shell:overflow-hidden">
        <Sidebar />
        <main
          id={PANEL_ID}
          tabIndex={-1}
          data-scroll
          className="min-w-0 flex-1 px-4 pt-16 pb-[120px] outline-none shell:overflow-x-hidden shell:overflow-y-auto shell:px-(--deskpad) shell:pt-0 shell:pb-[72px]"
        >
          <div>
            <TopBar />
            <PanelContent>{children}</PanelContent>
          </div>
        </main>
      </div>
      {/* Task 7: phone */}
    </NavigationProvider>
  )
}
```

`app/(site)/template.tsx`:

```tsx
import type { ReactNode } from 'react'

/** Remounts on every navigation, so Kraft's 540ms rise-in (kScreenA) replays. */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-screen-in">{children}</div>
}
```

`app/(site)/page.tsx`:

```tsx
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export default function HomePage() {
  return <PagePlaceholder href="/" phase={2} />
}
```

Create the six section routes. Each file is identical apart from the three values in this table:

| File | `title` | `href` | `phase` |
|---|---|---|---|
| `app/(site)/projects/page.tsx` | `'Projects'` | `'/projects'` | `3` |
| `app/(site)/showcase/page.tsx` | `'Showcase'` | `'/showcase'` | `4` |
| `app/(site)/services/page.tsx` | `'Services'` | `'/services'` | `3` |
| `app/(site)/testimonials/page.tsx` | `'Testimonials'` | `'/testimonials'` | `3` |
| `app/(site)/about/page.tsx` | `'About'` | `'/about'` | `3` |
| `app/(site)/contact/page.tsx` | `'FAQs / Contact'` | `'/contact'` | `3` |

Template (shown for Projects):

```tsx
import type { Metadata } from 'next'
import PagePlaceholder from '@/components/ui/PagePlaceholder'

export const metadata: Metadata = { title: 'Projects' }

export default function Page() {
  return <PagePlaceholder href="/projects" phase={3} />
}
```

- [ ] **Step 9: Run unit tests**

Run: `npm test`
Expected: PASS (Sidebar tests included). The theme e2e from Task 3 now finds the ThemeButton in the sidebar, so the temporary harness is gone.

- [ ] **Step 10: Write the shell e2e tests**

`e2e/shell.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact']
const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('every shell route renders without console or page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  for (const r of ROUTES) {
    await page.goto(r)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
  expect(errors).toEqual([])
})

test('sidebar navigation swaps the panel and updates crumb and active item', async ({ page }) => {
  await page.goto('/')
  await sidebarNav(page).getByRole('link', { name: /^Projects/ }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
  await expect(page.getByText('KRAFT / BUILDS')).toBeVisible()
  await expect(sidebarNav(page).getByRole('link', { name: /^Projects/ })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('navigation resets the panel scroll to the top', async ({ page }) => {
  await page.goto('/')
  const panel = page.locator('#main-content')
  await panel.evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.firstElementChild!.appendChild(spacer)
    el.scrollTop = 1200
  })
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBe(0)
})

test('two rapid clicks: the last one wins and the content is visible', async ({ page }) => {
  await page.goto('/')
  await sidebarNav(page).getByRole('link', { name: /^Projects/ }).click()
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test('clicking the current page stays put', async ({ page }) => {
  await page.goto('/services')
  await sidebarNav(page).getByRole('link', { name: /^Services/ }).click()
  await expect(page).toHaveURL(/\/services$/)
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('navigates without the fade', async ({ page }) => {
    await page.goto('/')
    await sidebarNav(page).getByRole('link', { name: /^Contact|^FAQs/ }).click()
    await expect(page).toHaveURL(/\/contact$/)
  })
})

test('Get in touch goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Get in touch' }).click()
  await expect(page).toHaveURL(/\/contact$/)
})
```

- [ ] **Step 11: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS.

- [ ] **Step 12: Commit**

```bash
git add app components data public tests e2e
git commit -m "feat: Kraft desktop shell with sidebar, top bar and crossfading panel" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: ⌘K command palette

**Files:**
- Create: `lib/commands.ts`, `components/shell/CommandPalette.tsx`, `components/shell/ShellTopBar.tsx`
- Modify: `app/(site)/layout.tsx` (wrap in `PaletteProvider`; render `ShellTopBar`), `app/globals.css` (palette shadow token)
- Test: `tests/commands.test.ts`, `tests/CommandPalette.test.tsx`, `e2e/palette.spec.ts`

**Interfaces:**
- Consumes: `NAV` (Task 4), `useShellNav` (Task 4), `TopBar` (Task 5).
- Produces: `type Command = { id: string; label: string; hint: string; href: string; icon: Icon }`, `COMMANDS: Command[]`, `filterCommands(query: string, list?: Command[]): Command[]`; `PaletteProvider`, `usePalette(): { open: boolean; openPalette(): void; closePalette(): void }`.

- [ ] **Step 1: Write the failing tests**

`tests/commands.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { COMMANDS, filterCommands } from '@/lib/commands'

describe('filterCommands', () => {
  it('returns everything for an empty or blank query', () => {
    expect(filterCommands('')).toEqual(COMMANDS)
    expect(filterCommands('   ')).toEqual(COMMANDS)
  })
  it('matches labels case-insensitively', () => {
    expect(filterCommands('SERV').map((c) => c.href)).toEqual(['/services'])
  })
  it("matches Kraft's hints too", () => {
    expect(filterCommands('builds').map((c) => c.href)).toEqual(['/projects'])
  })
  it('returns nothing for no match', () => {
    expect(filterCommands('zzz')).toEqual([])
  })
})
```

`tests/CommandPalette.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { PaletteProvider, usePalette } from '@/components/shell/CommandPalette'

const nav = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => '/',
}))

function Opener() {
  const { openPalette } = usePalette()
  return <button onClick={openPalette}>Jump to…</button>
}

const setup = () =>
  render(
    <NavigationProvider>
      <PaletteProvider>
        <Opener />
      </PaletteProvider>
    </NavigationProvider>,
  )
const dialog = () => screen.queryByRole('dialog', { name: 'Command palette' })

describe('CommandPalette', () => {
  beforeEach(() => nav.push.mockReset())

  it('Ctrl+K opens and Ctrl+K again closes', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Jump to a section' })).toHaveFocus()
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeNull()
  })

  it('Meta+K opens too', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(dialog()).toBeInTheDocument()
  })

  it('Enter jumps to the first hit', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('serv{Enter}')
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/services', { scroll: false }))
    expect(dialog()).toBeNull()
  })

  it('ArrowDown moves the selection', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/projects', { scroll: false }))
  })

  it('Enter with no matches does nothing and keeps the palette open', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz{Enter}')
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByText('No matches')).toBeInTheDocument()
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('Escape closes and returns focus to the opener', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('{Escape}')
    expect(dialog()).toBeNull()
    await waitFor(() => expect(screen.getByText('Jump to…')).toHaveFocus())
  })

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    for (let i = 0; i < 12; i++) await user.tab()
    expect(dialog()!.contains(document.activeElement)).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/commands` and `@/components/shell/CommandPalette`).

- [ ] **Step 3: Implement `lib/commands.ts`**

```ts
import type { Icon } from '@phosphor-icons/react'
import { NAV } from '@/data/nav'

/** ⌘K entries. Phase 1: pages. Later phases append key sections. */
export type Command = { id: string; label: string; hint: string; href: string; icon: Icon }

export const COMMANDS: Command[] = NAV.map((n) => ({
  id: n.href,
  label: n.label,
  hint: n.hint,
  href: n.href,
  icon: n.icon,
}))

/** Kraft's filter (Kraft Portfolio.dc.html:705-706): label or hint contains the query. */
export function filterCommands(query: string, list: Command[] = COMMANDS): Command[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter((c) => c.label.toLowerCase().includes(q) || c.hint.toLowerCase().includes(q))
}
```

- [ ] **Step 4: Implement `components/shell/CommandPalette.tsx`** (Kraft markup `Kraft Portfolio.dc.html:343-362`)

```tsx
'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import { filterCommands, type Command } from '@/lib/commands'
import { useShellNav } from './NavigationProvider'

type PaletteCtx = { open: boolean; openPalette: () => void; closePalette: () => void }
const Ctx = createContext<PaletteCtx | null>(null)

export function usePalette(): PaletteCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('usePalette must be used inside <PaletteProvider>')
  return ctx
}

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  const openPalette = useCallback(() => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setOpen(true)
  }, [])

  const closePalette = useCallback(() => {
    setOpen(false)
    requestAnimationFrame(() => returnFocus.current?.focus())
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.isComposing) return
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) closePalette()
        else openPalette()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, openPalette, closePalette])

  const value = useMemo(() => ({ open, openPalette, closePalette }), [open, openPalette, closePalette])
  return (
    <Ctx.Provider value={value}>
      {children}
      {open && <PaletteDialog onClose={closePalette} />}
    </Ctx.Provider>
  )
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const { go } = useShellNav()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const hits = filterCommands(query)
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const choose = (c: Command) => {
    onClose()
    go(c.href)
  }

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!hits.length) return
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((a) => (a + step + hits.length) % hits.length)
    } else if (e.key === 'Enter' && e.target === inputRef.current) {
      e.preventDefault()
      const hit = hits[active]
      if (hit) choose(hit)
    } else if (e.key === 'Tab') {
      const focusables = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>('input, button:not([tabindex="-1"])') ?? [],
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      ref={dialogRef}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      className="fixed inset-0 z-40 flex animate-rise items-start justify-center bg-scrim px-[18px] pt-[12vh] pb-[18px] backdrop-blur-[6px]"
    >
      <div className="w-full max-w-[520px] overflow-hidden rounded-[18px] border border-b2 bg-linear-to-b from-s2 to-s1 shadow-(--palette-shadow)">
        <div className="flex items-center gap-2.5 border-b border-b1 px-[17px] py-[15px]">
          <MagnifyingGlassIcon size={16} aria-hidden className="text-accent" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={hits[active] ? `palette-${hits[active].id}` : undefined}
            aria-label="Jump to a section"
            placeholder="Jump to a section…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            className="min-h-8 flex-1 border-0 bg-transparent text-[15px] text-ink outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-[7px] border border-b1 bg-chip px-[9px] py-1.5 font-mono text-[9.5px] tracking-[.08em] text-ink3"
          >
            ESC
          </button>
        </div>
        <div id="palette-results" role="listbox" data-scroll className="max-h-[46vh] overflow-y-auto p-2">
          {hits.length === 0 && <p className="px-[13px] py-3 text-sm text-ink3">No matches</p>}
          {hits.map((c, i) => {
            const Icon = c.icon
            return (
              <button
                key={c.id}
                id={`palette-${c.id}`}
                type="button"
                role="option"
                aria-selected={i === active}
                tabIndex={-1}
                onClick={() => choose(c)}
                onMouseMove={() => setActive(i)}
                className={`flex min-h-[46px] w-full cursor-pointer items-center gap-3 rounded-xl border-0 px-[13px] py-3 text-left transition-colors duration-200 ${i === active ? 'bg-hover' : 'bg-transparent'}`}
              >
                <Icon size={16} aria-hidden className="text-accent" />
                <span className="text-sm font-medium text-ink">{c.label}</span>
                <span className="ml-auto font-mono text-[9.5px] text-ink3">{c.hint}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

Note: result buttons have `tabIndex={-1}` (the listbox is driven by arrows from the input). So the Tab trap cycles between the input and the ESC button, which is the intended focus order.

Append Kraft's palette shadow (`Kraft Portfolio.dc.html:345`, exact value) to `app/globals.css`, so the component stays free of raw colours:

```css
/* ---- Kraft palette card shadow (Kraft Portfolio.dc.html:345) ---- */
:root{--palette-shadow:0 40px 90px -30px rgba(0,0,0,.9)}
```

- [ ] **Step 5: Wire the palette into the shell**

`components/shell/ShellTopBar.tsx`:

```tsx
'use client'

import { usePalette } from './CommandPalette'
import TopBar from './TopBar'

export default function ShellTopBar() {
  const { openPalette } = usePalette()
  return <TopBar onJump={openPalette} />
}
```

In `app/(site)/layout.tsx`:
- Import `{ PaletteProvider }` from `@/components/shell/CommandPalette` and `ShellTopBar` from `@/components/shell/ShellTopBar`.
- Replace `{/* Task 6: wrap everything below in <PaletteProvider> */}` by opening `<PaletteProvider>` there, and close `</PaletteProvider>` just before `</NavigationProvider>`.
- Replace `<TopBar />` with `<ShellTopBar />` and remove the unused `TopBar` import.

- [ ] **Step 6: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Write the palette e2e test**

`e2e/palette.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('Ctrl+K, type, Enter navigates', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  await page.keyboard.type('testi')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/testimonials$/)
  await expect(dialog).toBeHidden()
})

test('Jump to button opens it; Escape closes and returns focus', async ({ page }) => {
  await page.goto('/')
  const jump = page.getByRole('button', { name: /Jump to/ })
  await jump.click()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
  await expect(jump).toBeFocused()
})

test('clicking the scrim closes it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+k')
  await page.mouse.click(10, 10)
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
})
```

- [ ] **Step 8: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add app components lib tests e2e
git commit -m "feat: Kraft command palette with keyboard and focus handling" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Phone layout (tab bar and floating controls)

**Files:**
- Create: `components/shell/TabBar.tsx`, `components/shell/PhoneControls.tsx`
- Modify: `app/(site)/layout.tsx` (replace `{/* Task 7: phone */}`)
- Test: `tests/TabBar.test.tsx`, `e2e/phone.spec.ts`, `e2e/shell.spec.ts` (append the resize test)

**Interfaces:**
- Consumes: `MOBILE_NAV`, `isActivePath` (Task 4); `ShellLink` (Task 4); `ThemeButton` (Task 3); `usePalette` (Task 6).
- Produces: `<TabBar />`, `<PhoneControls />`. Both render only below 1100px (`shell:hidden`). PhoneControls shows on **every** page in Phase 1; Phase 2 hides it on Home when Home's profile header lands.

- [ ] **Step 1: Write the failing test**

`tests/TabBar.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import TabBar from '@/components/shell/TabBar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/services',
}))

describe('TabBar', () => {
  it("renders Kraft's five slots with Start as the raised Contact action", () => {
    render(
      <NavigationProvider>
        <TabBar />
      </NavigationProvider>,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/components/shell/TabBar`).

- [ ] **Step 3: Implement `components/shell/TabBar.tsx`** (Kraft `Kraft Portfolio.dc.html:318-337`)

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { isActivePath, MOBILE_NAV } from '@/data/nav'
import { ShellLink } from './NavigationProvider'

export default function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-between gap-0.5 border-t border-b1 bg-nav px-3 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] shell:hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-b from-transparent to-nav" />
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon
        if (item.center) {
          return (
            <ShellLink key="center" href={item.href} aria-label="Start a project" className="group flex flex-1 flex-col items-center gap-1">
              <span
                aria-hidden
                className="grid size-[54px] -translate-y-3 place-items-center rounded-full bg-accent text-on-accent shadow-[0_12px_30px_-8px_var(--glow)] transition-transform duration-300 group-hover:-translate-y-[15px] group-hover:scale-[1.04]"
              >
                <Icon size={22} />
              </span>
              <span className="-translate-y-2.5 text-[10px] font-semibold text-accent">{item.label}</span>
            </ShellLink>
          )
        }
        const active = isActivePath(pathname, item.href)
        return (
          <ShellLink
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="relative flex min-h-12 flex-1 flex-col items-center gap-1.5 py-[7px]"
          >
            {active && <span aria-hidden className="absolute inset-0 rounded-[14px] border border-wash-b bg-wash" />}
            <span aria-hidden className="relative grid size-[22px] place-items-center">
              <Icon size={18} className={active ? 'text-accent' : 'text-ink3'} />
            </span>
            <span className="relative text-[10px] font-medium text-ink2">{item.label}</span>
          </ShellLink>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 4: Implement `components/shell/PhoneControls.tsx`** (Kraft phone header buttons `:306-307`)

```tsx
'use client'

import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import { usePalette } from './CommandPalette'
import ThemeButton from './ThemeButton'

/** Theme and ⌘K on phones, floating top-right (spec §7). */
export default function PhoneControls() {
  const { openPalette } = usePalette()
  return (
    <div className="fixed top-[max(12px,env(safe-area-inset-top))] right-3.5 z-30 flex gap-2 shell:hidden">
      <ThemeButton size={40} />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        className="grid size-10 cursor-pointer place-items-center rounded-xl border border-b1 bg-s2 text-ink2"
      >
        <MagnifyingGlassIcon size={15} aria-hidden />
      </button>
    </div>
  )
}
```

In `app/(site)/layout.tsx`, import both and replace `{/* Task 7: phone */}` with:

```tsx
<TabBar />
<PhoneControls />
```

- [ ] **Step 5: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Write the phone e2e test and the resize test**

`e2e/phone.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('phone: tab bar replaces the sidebar', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('complementary', { name: 'Profile and site navigation' })).toBeHidden()
  const tabs = page.getByRole('navigation', { name: 'Sections' })
  await expect(tabs).toBeVisible()
  await expect(tabs.getByRole('link')).toHaveCount(5)
})

test('phone: Start goes to contact', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Start a project' }).tap()
  await expect(page).toHaveURL(/\/contact$/)
})

test('phone: floating theme and search controls work', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/about')
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).tap()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Open command palette' }).tap()
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
})

test('phone: the document scrolls (no inner panel)', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-panel-content]').evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.appendChild(spacer)
  })
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  const panelScrolls = await page
    .locator('#main-content')
    .evaluate((el) => getComputedStyle(el).overflowY === 'auto')
  expect(panelScrolls).toBe(false)
})
```

Append to `e2e/shell.spec.ts`:

```ts
test('resizing across 1100px switches layouts and keeps scrolling working', async ({ page }) => {
  await page.goto('/')
  const sidebar = page.getByRole('complementary', { name: 'Profile and site navigation' })
  await expect(sidebar).toBeVisible()
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(sidebar).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Sections' })).toBeVisible()
  await page.locator('[data-panel-content]').evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.appendChild(spacer)
  })
  await page.mouse.move(450, 450)
  await page.mouse.wheel(0, 800)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(sidebar).toBeVisible()
})
```

- [ ] **Step 7: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS in both the `desktop` and `phone` projects.

- [ ] **Step 8: Commit**

```bash
git add app components tests e2e
git commit -m "feat: Kraft phone tab bar and floating controls" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Smooth scrolling (Lenis) and scroll reveals

**Files:**
- Create: `hooks/useSmoothScroll.ts`, `hooks/useScrollReveal.ts`, `components/shell/SmoothScroll.tsx`
- Modify: `app/layout.tsx` (import `lenis/dist/lenis.css`), `app/globals.css` (reveal rules), `components/shell/PanelContent.tsx` (call `useScrollReveal`), `app/(site)/layout.tsx` (replace `{/* Task 8: scroll */}`)
- Test: `tests/useScrollReveal.test.tsx`, `e2e/scroll.spec.ts`

**Interfaces:**
- Consumes: `PANEL_ID`, `getPanel`, `registerLenis` (Task 4); `prefersReducedMotion` (Task 3); `A11Y_EVENT` (Task 3).
- Produces: `useSmoothScroll(): void`, which mounts Lenis on the panel only when the viewport is ≥1100px, the pointer is fine, and motion is allowed, and rebuilds or tears it down on breakpoint and a11y changes. `useScrollReveal(key: string): void` adds `.is-revealed` to `[data-reveal]` elements once they're visible, re-scanning when `key` (the pathname) changes. `<SmoothScroll />` is a render-nothing host for the hook.

- [ ] **Step 1: Write the failing reveal test**

`tests/useScrollReveal.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { installMatchMedia } from '@/test/matchMedia'

type Cb = (entries: { isIntersecting: boolean; target: Element }[]) => void
let fire: Cb = () => {}
class FakeIO {
  constructor(cb: Cb) {
    fire = cb
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

function Harness() {
  useScrollReveal('/')
  return <p data-reveal>hello</p>
}

describe('useScrollReveal', () => {
  afterEach(() => {
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver
  })

  it('reveals an element once it intersects', () => {
    ;(window as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIO
    const { container } = render(<Harness />)
    const el = container.querySelector('[data-reveal]')!
    expect(el).not.toHaveClass('is-revealed')
    fire([{ isIntersecting: true, target: el }])
    expect(el).toHaveClass('is-revealed')
  })

  it('reveals everything immediately for reduced motion', () => {
    ;(window as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIO
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { container } = render(<Harness />)
    expect(container.querySelector('[data-reveal]')).toHaveClass('is-revealed')
  })

  it('reveals everything when IntersectionObserver is missing', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('[data-reveal]')).toHaveClass('is-revealed')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/hooks/useScrollReveal`).

- [ ] **Step 3: Implement `hooks/useScrollReveal.ts`** (port of kape `hooks/useScrollReveal.ts`, rooted in the panel)

```ts
'use client'

import { useEffect } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { getPanel } from '@/lib/scroller'

/**
 * Adds `.is-revealed` to each [data-reveal] element the first time it enters
 * view, and never hides it again. The observer's root is the panel when the
 * panel is the scroller (≥1100px), otherwise the viewport. `key` re-scans
 * after a route change brings in new elements.
 */
export function useScrollReveal(key: string) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)'))
    if (!els.length) return
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-revealed'))
      return
    }
    const panel = getPanel()
    const root = panel && getComputedStyle(panel).overflowY === 'auto' ? panel : null
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-revealed')
          io.unobserve(entry.target)
        }
      },
      { root, threshold: 0, rootMargin: '0px 0px -80px 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [key])
}
```

In `components/shell/PanelContent.tsx`, add `import { usePathname } from 'next/navigation'` and `import { useScrollReveal } from '@/hooks/useScrollReveal'`. Then, inside the component before `return`:

```tsx
const pathname = usePathname()
useScrollReveal(pathname)
```

Append to `app/globals.css`:

```css
/* ---- Scroll reveal (kape). Hidden only when JS runs, so the pre-rendered HTML
   is always readable; revealed state uses transform:none (no stacking context). ---- */
html[data-js] [data-reveal]{opacity:0;transform:translateY(14px);transition:opacity .6s cubic-bezier(.22,.7,.2,1),transform .6s cubic-bezier(.22,.7,.2,1)}
html[data-js] [data-reveal].is-revealed{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){html[data-js] [data-reveal]{opacity:1;transform:none}}
html[data-a11y-motion=true] [data-reveal]{opacity:1 !important;transform:none !important}
```

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implement `hooks/useSmoothScroll.ts` and `components/shell/SmoothScroll.tsx`** (adapted from kape `hooks/useLenis.ts`, without GSAP)

```ts
// hooks/useSmoothScroll.ts
'use client'

import { useEffect } from 'react'
import { A11Y_EVENT } from '@/lib/a11y'
import { prefersReducedMotion } from '@/lib/motion'
import { getPanel, registerLenis } from '@/lib/scroller'

const DESKTOP = '(min-width: 1100px)'
const TOUCH = '(pointer: coarse) and (hover: none)'

/**
 * kape's Lenis feel (0.9s, steep exponential ease) on the shell panel. Only
 * when the panel is the scroller (≥1100px), the pointer is fine, and motion
 * is allowed. Phones and narrow windows keep native scroll. Rebuilt or torn
 * down when the breakpoint or the a11y motion switch changes, so a resize
 * never leaves a dead scroller behind.
 */
export function useSmoothScroll() {
  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP)
    let lenis: import('lenis').default | null = null
    let seq = 0

    const teardown = () => {
      lenis?.destroy()
      lenis = null
      registerLenis(null)
    }

    const sync = async () => {
      const run = ++seq
      teardown()
      if (!desktop.matches || prefersReducedMotion() || window.matchMedia(TOUCH).matches) return
      const panel = getPanel()
      const content = panel?.firstElementChild
      if (!panel || !(content instanceof HTMLElement)) return
      const { default: Lenis } = await import('lenis')
      if (run !== seq) return
      lenis = new Lenis({
        wrapper: panel,
        content,
        autoRaf: true,
        duration: 0.9,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -12 * t)),
        smoothWheel: true,
      })
      registerLenis(lenis)
    }

    void sync()
    const onChange = () => void sync()
    desktop.addEventListener('change', onChange)
    window.addEventListener(A11Y_EVENT, onChange)
    return () => {
      seq++
      desktop.removeEventListener('change', onChange)
      window.removeEventListener(A11Y_EVENT, onChange)
      teardown()
    }
  }, [])
}
```

```tsx
// components/shell/SmoothScroll.tsx
'use client'

import { useSmoothScroll } from '@/hooks/useSmoothScroll'

export default function SmoothScroll() {
  useSmoothScroll()
  return null
}
```

In `app/layout.tsx` add `import 'lenis/dist/lenis.css'` **above** `import './globals.css'`. In `app/(site)/layout.tsx` import `SmoothScroll` and replace `{/* Task 8: scroll */}` with `<SmoothScroll />`.

- [ ] **Step 6: Write the scroll e2e test**

`e2e/scroll.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('Lenis drives the panel on desktop and the wheel scrolls it', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.lenis')).toHaveCount(1)
  const panel = page.locator('#main-content')
  await panel.evaluate((el) => {
    const spacer = document.createElement('div')
    spacer.style.height = '3000px'
    el.firstElementChild!.appendChild(spacer)
  })
  await page.mouse.move(900, 450)
  await page.mouse.wheel(0, 900)
  await expect.poll(() => panel.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})

test('Lenis is torn down below 1100px', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.lenis')).toHaveCount(1)
  await page.setViewportSize({ width: 900, height: 900 })
  await expect(page.locator('.lenis')).toHaveCount(0)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('no Lenis and reveals are visible immediately', async ({ page }) => {
    await page.goto('/projects')
    await expect(page.locator('.lenis')).toHaveCount(0)
    await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1')
  })
})

test('placeholder reveal becomes visible', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('[data-reveal]').first()).toHaveClass(/is-revealed/)
})
```

- [ ] **Step 7: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS. If the Task 5 "navigation resets the panel scroll" test now fails because Lenis holds a stale position, check that `scrollToTop` calls `lenis.scrollTo(0, { immediate: true, force: true })`. It does if Task 4 was followed. Don't loosen the test.

- [ ] **Step 8: Commit**

```bash
git add app components hooks tests e2e
git commit -m "feat: Lenis smooth scrolling on the panel and scroll reveals" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Performance tiers

**Files:**
- Create: `lib/perf.ts`
- Modify: `app/globals.css` (perf rules)
- Test: `tests/perf.test.ts`

**Interfaces:**
- Consumes: `PERF_KEY` (Task 2), `prefersReducedMotion` (Task 3).
- Produces: `type PerfTier = 'high'|'mid'|'low'`, `PERF_TIER_EVENT = 'perftierchange'`, `BAD_FRAME_MS = 22`, `getPerfTier(): PerfTier`, `applyPerfTier(tier: PerfTier): void`, `nextTier(t: PerfTier): PerfTier`, `isJanky(medianMs: number): boolean`, `watchFrameHealth(): Promise<void>`. `settled()` waits for `html[data-intro]` to clear (Phase 2 sets it) and for `[data-contour] canvas` (Task 10).

- [ ] **Step 1: Write the failing tests**

`tests/perf.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyPerfTier,
  BAD_FRAME_MS,
  getPerfTier,
  isJanky,
  nextTier,
  PERF_TIER_EVENT,
  watchFrameHealth,
} from '@/lib/perf'
import { PERF_KEY } from '@/lib/storage-keys'

describe('perf tiers', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
  })

  it('steps down one tier at a time and bottoms out at low', () => {
    expect(nextTier('high')).toBe('mid')
    expect(nextTier('mid')).toBe('low')
    expect(nextTier('low')).toBe('low')
  })

  it('only calls a median above the budget janky', () => {
    expect(isJanky(BAD_FRAME_MS)).toBe(false)
    expect(isJanky(BAD_FRAME_MS + 0.1)).toBe(true)
  })

  it('reads high when nothing is set', () => {
    expect(getPerfTier()).toBe('high')
  })

  it('applies, remembers for the tab and announces a new tier once', () => {
    const heard = vi.fn()
    window.addEventListener(PERF_TIER_EVENT, heard)
    applyPerfTier('mid')
    applyPerfTier('mid')
    expect(document.documentElement.dataset.perf).toBe('mid')
    expect(sessionStorage.getItem(PERF_KEY)).toBe('mid')
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(PERF_TIER_EVENT, heard)
  })

  it('still applies when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => applyPerfTier('low')).not.toThrow()
    expect(getPerfTier()).toBe('low')
    spy.mockRestore()
  })

  it('does not watch under automation (Playwright renders WebGL in software)', async () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    await expect(watchFrameHealth()).resolves.toBeUndefined()
    expect(getPerfTier()).toBe('high')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/perf`).

- [ ] **Step 3: Implement `lib/perf.ts`** (port of `reference/kapeportfolio/src/lib/perf.ts`)

```ts
import { prefersReducedMotion } from './motion'
import { PERF_KEY } from './storage-keys'

/**
 * Runtime performance gate (kape lib/perf.ts). Rather than guess at hardware,
 * the page measures itself once the expensive layers are running and steps the
 * design down until it holds frame:
 *
 *   high  everything on, as designed
 *   mid   backdrop-filter off (app/globals.css perf rules)
 *   low   the contour unmounts too; the flat Kraft --bg carries the page
 *
 * The verdict lands on <html data-perf> and is remembered for the tab in
 * sessionStorage (re-applied before paint by lib/boot.ts).
 */
export type PerfTier = 'high' | 'mid' | 'low'

export const PERF_TIER_EVENT = 'perftierchange'

/** Sustained median frame time above this means the device cannot hold ~45fps. */
export const BAD_FRAME_MS = 22
const SAMPLE_MS = 1500
/** Frames slower than this are a tab switch or a route change, not jank. */
const OUTLIER_MS = 100
/** Fewer usable samples than this and the window is inconclusive. */
const MIN_SAMPLES = 20
/** A janky device produces few frames, so a window may run this long to collect MIN_SAMPLES. */
const MAX_SAMPLE_MS = 5000
const MAX_CHECKS = 6

function read(): PerfTier | null {
  try {
    const v = sessionStorage.getItem(PERF_KEY)
    return v === 'mid' || v === 'low' ? v : null
  } catch {
    return null
  }
}

export function getPerfTier(): PerfTier {
  const v = document.documentElement.dataset.perf
  return v === 'mid' || v === 'low' ? v : 'high'
}

export function applyPerfTier(tier: PerfTier) {
  if (tier === getPerfTier()) return
  document.documentElement.dataset.perf = tier
  try {
    sessionStorage.setItem(PERF_KEY, tier)
  } catch {
    /* storage blocked: the tier still applies to this page */
  }
  window.dispatchEvent(new CustomEvent<PerfTier>(PERF_TIER_EVENT, { detail: tier }))
}

export function nextTier(t: PerfTier): PerfTier {
  return t === 'high' ? 'mid' : 'low'
}

export function isJanky(medianMs: number): boolean {
  return medianMs > BAD_FRAME_MS
}

/** Median frame time over one window, or null if the window was inconclusive. */
function measure(): Promise<number | null> {
  return new Promise((resolve) => {
    const deltas: number[] = []
    let last = performance.now()
    const end = last + SAMPLE_MS
    const hardEnd = last + MAX_SAMPLE_MS
    const tick = (now: number) => {
      const dt = now - last
      last = now
      if (document.visibilityState === 'hidden') return resolve(null)
      if (dt < OUTLIER_MS) deltas.push(dt)
      const enough = now >= end && deltas.length >= MIN_SAMPLES
      if (!enough && now < hardEnd) return void requestAnimationFrame(tick)
      if (deltas.length < MIN_SAMPLES) return resolve(null)
      deltas.sort((a, b) => a - b)
      resolve(deltas[deltas.length >> 1])
    }
    requestAnimationFrame(tick)
  })
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Resolves once the page is running its expensive version: the intro has
 * released (Phase 2 sets html[data-intro] while it plays) and the contour
 * canvas has mounted, or after 10s for pages that never get one.
 */
function settled(): Promise<void> {
  return new Promise((resolve) => {
    const ready = () =>
      !document.documentElement.hasAttribute('data-intro') &&
      (!!document.querySelector('[data-contour] canvas') || getPerfTier() === 'low')
    const done = () => {
      window.clearInterval(id)
      window.clearTimeout(bail)
      setTimeout(resolve, 800)
    }
    const id = window.setInterval(() => {
      if (ready()) done()
    }, 200)
    const bail = window.setTimeout(done, 10_000)
    if (ready()) done()
  })
}

/**
 * Watches for a while and steps the tier down whenever a window comes back
 * janky. It judges a median over a full window, so one hitch never downgrades
 * anyone.
 */
export async function watchFrameHealth() {
  // Automated browsers render WebGL in software and would always downgrade;
  // the tier logic itself is covered by tests/perf.test.ts.
  if (navigator.webdriver) return
  if (prefersReducedMotion()) return
  if (read() === 'low') return

  await settled()

  for (let check = 0; check < MAX_CHECKS; check++) {
    if (getPerfTier() === 'low') return
    const median = await measure()
    if (median === null) {
      await wait(1200)
      continue
    }
    if (!isJanky(median)) {
      await wait(2500)
      continue
    }
    applyPerfTier(nextTier(getPerfTier()))
    await wait(600)
  }
}
```

- [ ] **Step 4: Append the perf rules to `app/globals.css`** (from kape `styles/perf.css`)

```css
/* ---- Perf tiers (lib/perf.ts). They only ever turn things OFF. ---- */
:root[data-perf=mid] *,:root[data-perf=low] *,
:root[data-perf=mid] *::before,:root[data-perf=low] *::before,
:root[data-perf=mid] *::after,:root[data-perf=low] *::after{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}
:root[data-perf=low] [data-contour]{display:none}
```

- [ ] **Step 5: Run every check**

Run: `npm test && npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib app tests
git commit -m "feat: runtime performance tiers ported from kape" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Contour background in Kraft colours

**Files:**
- Create: `lib/color.ts`, `lib/background.ts`, `components/shell/ContourCanvas.tsx`, `components/shell/BackgroundGate.tsx`
- Modify: `app/(site)/layout.tsx` (replace `{/* Task 10: background */}`)
- Test: `tests/color.test.ts`, `tests/background.test.ts`, `e2e/background.spec.ts`

**Interfaces:**
- Consumes: `THEME_EVENT` (Task 3), `prefersReducedMotion` (Task 3), `A11Y_EVENT` (Task 3), `getPerfTier`, `PERF_TIER_EVENT`, `watchFrameHealth` (Task 9).
- Produces: `type RGB = [number, number, number]` (0–1), `parseCssColor(value: string): RGB | null`, `readContourColors(read?: (name: string) => string): { bg: RGB; line: RGB } | null`; `type ContourEnv = { reducedMotion: boolean; coarsePointer: boolean; tier: PerfTier }`, `shouldRunContour(env: ContourEnv): boolean`; `<ContourCanvas onFail={() => void} />` renders `<div data-contour>`; `<BackgroundGate />`.

- [ ] **Step 1: Write the failing tests**

`tests/color.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { parseCssColor, readContourColors } from '@/lib/color'

describe('parseCssColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseCssColor('#FF0000')).toEqual([1, 0, 0])
  })
  it('parses 3-digit hex and trims', () => {
    expect(parseCssColor('  #0f0 ')).toEqual([0, 1, 0])
  })
  it("parses Kraft's --amb channel triplet", () => {
    const rgb = parseCssColor('150,205,175')!
    expect(rgb[0]).toBeCloseTo(150 / 255)
    expect(rgb[2]).toBeCloseTo(175 / 255)
  })
  it('rejects anything else', () => {
    expect(parseCssColor('red')).toBeNull()
    expect(parseCssColor('')).toBeNull()
    expect(parseCssColor('rgba(1,2,3,.5)')).toBeNull()
  })
})

describe('readContourColors', () => {
  it('reads --bg and --amb through the given reader', () => {
    const vars: Record<string, string> = { '--bg': '#050505', '--amb': '19,74,48' }
    const c = readContourColors((n) => vars[n] ?? '')!
    expect(c.bg[0]).toBeCloseTo(5 / 255)
    expect(c.line[1]).toBeCloseTo(74 / 255)
  })
  it('returns null when a token is missing', () => {
    expect(readContourColors(() => '')).toBeNull()
  })
})
```

`tests/background.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { shouldRunContour } from '@/lib/background'

const base = { reducedMotion: false, coarsePointer: false, tier: 'high' as const }

describe('shouldRunContour', () => {
  it('runs on a capable desktop', () => {
    expect(shouldRunContour(base)).toBe(true)
    expect(shouldRunContour({ ...base, tier: 'mid' })).toBe(true)
  })
  it('never runs for reduced motion, touch, or the low tier', () => {
    expect(shouldRunContour({ ...base, reducedMotion: true })).toBe(false)
    expect(shouldRunContour({ ...base, coarsePointer: true })).toBe(false)
    expect(shouldRunContour({ ...base, tier: 'low' })).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL (cannot resolve `@/lib/color` and `@/lib/background`).

- [ ] **Step 3: Implement `lib/color.ts` and `lib/background.ts`**

```ts
// lib/color.ts
/** 0–1 channels, the form WebGL uniforms want. */
export type RGB = [number, number, number]

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
const TRIPLET = /^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/

/** Parses a token value: `#rgb`, `#rrggbb`, or Kraft's bare `r,g,b` (--amb). */
export function parseCssColor(value: string): RGB | null {
  const v = value.trim()
  const hex = HEX.exec(v)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB
  }
  const t = TRIPLET.exec(v)
  if (t) return [t[1], t[2], t[3]].map((n) => Math.min(255, Number(n)) / 255) as RGB
  return null
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name)

/** The contour's ground is Kraft's --bg; its lines are Kraft's ambient green --amb. */
export function readContourColors(read: (name: string) => string = cssVar): { bg: RGB; line: RGB } | null {
  const bg = parseCssColor(read('--bg'))
  const line = parseCssColor(read('--amb'))
  return bg && line ? { bg, line } : null
}
```

```ts
// lib/background.ts
import type { PerfTier } from './perf'

export type ContourEnv = { reducedMotion: boolean; coarsePointer: boolean; tier: PerfTier }

/** Spec §5/§8: never on touch, never with reduced motion, never at the low tier. */
export function shouldRunContour(env: ContourEnv): boolean {
  return !env.reducedMotion && !env.coarsePointer && env.tier !== 'low'
}
```

- [ ] **Step 4: Run unit tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Implement `components/shell/ContourCanvas.tsx`** (port of `reference/kapeportfolio/src/components/HeroCanvasV2.tsx`)

`noiseGLSL` and `vert` are kape's, verbatim. What changed from kape: the colours come from Kraft tokens through `uBg`/`uLine` and ease on `themechange`; there's no `uDarkMix` and no internal touch/reduced checks (the gate decides); renderer creation and context loss call `onFail`.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { readContourColors, type RGB } from '@/lib/color'
import { THEME_EVENT } from '@/lib/theme'

// kape HeroCanvasV2: two-layer simplex contour field (technique credit: landonorris.com by OFF+BRAND;
// simplex noise by Ashima Arts / Ian McEwan, MIT).
const noiseGLSL = `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`

const vert = `
  varying vec2 vUv;
  void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }
`

const frag = `
  uniform float uTime;
  uniform vec2  uMouse;
  uniform float uMousePace;
  uniform float uAspect;
  uniform vec3  uBg;    // Kraft --bg
  uniform vec3  uLine;  // Kraft --amb
  varying vec2 vUv;
  ${noiseGLSL}

  const float SCALE             = 0.72;
  const float NOISE_DETAIL      = 3.0;
  const float DISTORT_SCALE     = 0.55;
  const float DISTORT_INTENSITY = 0.50;
  const float HAIRLINE_PIXELS   = 1.5;
  const float CURSOR_SCALE      = 1.5;
  const float CURSOR_INTENSITY  = 0.05;
  const float LINE_ALPHA        = 0.55; // tuned in Task 11 against both themes
  const vec2  ANISOTROPY        = vec2(1.0, 1.0);

  void main(){
    vec2 uv = vUv;
    uv.x *= uAspect;
    vec2 mouse = uMouse * 0.5 + 0.5;
    mouse.x *= uAspect;
    float cursor = 1.0 - distance(mouse, uv) * CURSOR_SCALE;
    cursor *= uMousePace;
    cursor = clamp(cursor, 0.0, 1.0);

    float noiseDistort = 0.5 + snoise(vec3(uv * DISTORT_SCALE, uTime * 0.1)) * 0.5;
    vec2 warpedUv = (uv + cursor * CURSOR_INTENSITY + noiseDistort * DISTORT_INTENSITY) * SCALE * ANISOTROPY;
    float n = snoise(vec3(warpedUv, uTime));
    float bands = (n * 0.5 + 0.5) * NOISE_DETAIL;

    float contour = fract(bands);
    float dist    = abs(contour - 0.5);
    float w       = fwidth(bands) * HAIRLINE_PIXELS * 0.5;
    float line    = 1.0 - smoothstep(0.0, w, dist);

    vec3 lineCol = uLine + cursor * 0.04;
    gl_FragColor = vec4(mix(uBg, lineCol, line * LINE_ALPHA), 1.0);
  }
`

const FRAME_INTERVAL = 1000 / 30
const DRIFT_PER_SECOND = 0.09
const FOLLOW_PER_SECOND = 4.0
const PACE_PER_SECOND = 8.0
const THEME_PER_SECOND = 7.0

export default function ContourCanvas({ onFail }: { onFail: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    const colors = readContourColors()
    if (!el || !colors) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false })
    } catch {
      onFail()
      return
    }
    const onLost = (e: Event) => {
      e.preventDefault()
      onFail()
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0))
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10)
    cam.position.z = 1

    const bg = new THREE.Vector3(...colors.bg)
    const line = new THREE.Vector3(...colors.line)
    const targetBg = bg.clone()
    const targetLine = line.clone()
    renderer.setClearColor(new THREE.Color(...colors.bg), 1)

    const onTheme = () => {
      const next = readContourColors()
      if (!next) return
      targetBg.set(...(next.bg as RGB))
      targetLine.set(...(next.line as RGB))
    }
    window.addEventListener(THEME_EVENT, onTheme)

    const mouse = new THREE.Vector2(0, 0)
    const geo = new THREE.PlaneGeometry(2, 2)
    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: mouse },
        uMousePace: { value: 0 },
        uAspect: { value: window.innerWidth / window.innerHeight },
        uBg: { value: bg },
        uLine: { value: line },
      },
    })
    scene.add(new THREE.Mesh(geo, mat))

    const tgt = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    const onMove = (e: MouseEvent) => {
      tgt.x = (e.clientX / window.innerWidth) * 2 - 1
      tgt.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight)
      mat.uniforms.uAspect.value = window.innerWidth / window.innerHeight
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    let visible = document.visibilityState !== 'hidden'
    const onVisibility = () => {
      const next = document.visibilityState !== 'hidden'
      if (next && !visible) {
        visible = true
        lastTs = performance.now()
        raf = requestAnimationFrame(loop)
      } else visible = next
    }
    document.addEventListener('visibilitychange', onVisibility)

    let time = 0
    let lastTs = performance.now()
    let lastCurX = 0
    let lastCurY = 0
    let pace = 0

    function loop(now: number = performance.now()) {
      if (!visible) return
      raf = requestAnimationFrame(loop)
      if (now - lastTs < FRAME_INTERVAL - 1) return
      const dt = Math.min(0.05, (now - lastTs) / 1000)
      lastTs = now
      time += DRIFT_PER_SECOND * dt

      const followK = 1 - Math.exp(-FOLLOW_PER_SECOND * dt)
      cur.x += (tgt.x - cur.x) * followK
      cur.y += (tgt.y - cur.y) * followK
      mouse.set(cur.x, cur.y)
      const dx = (cur.x - lastCurX) / Math.max(dt, 0.001)
      const dy = (cur.y - lastCurY) / Math.max(dt, 0.001)
      const velRaw = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 0.4)
      pace += (velRaw - pace) * (1 - Math.exp(-PACE_PER_SECOND * dt))
      lastCurX = cur.x
      lastCurY = cur.y

      const themeK = 1 - Math.exp(-THEME_PER_SECOND * dt)
      bg.lerp(targetBg, themeK)
      line.lerp(targetLine, themeK)

      mat.uniforms.uTime.value = time
      mat.uniforms.uMousePace.value = pace
      renderer.render(scene, cam)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      window.removeEventListener(THEME_EVENT, onTheme)
      renderer.domElement.removeEventListener('webglcontextlost', onLost)
      renderer.dispose()
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement)
      geo.dispose()
      mat.dispose()
    }
  }, [onFail])

  return <div ref={ref} data-contour aria-hidden className="pointer-events-none fixed inset-0 z-0" />
}
```

- [ ] **Step 6: Implement `components/shell/BackgroundGate.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useState } from 'react'
import { shouldRunContour } from '@/lib/background'
import { A11Y_EVENT } from '@/lib/a11y'
import { prefersReducedMotion } from '@/lib/motion'
import { getPerfTier, PERF_TIER_EVENT, watchFrameHealth } from '@/lib/perf'

const ContourCanvas = dynamic(() => import('./ContourCanvas'), { ssr: false })

/**
 * Decides whether the WebGL contour runs (spec §5): only after `load`, at idle
 * time, on a fine pointer, with motion allowed and the perf tier above low.
 * Also starts the frame-health watcher that may step the tier down.
 */
export default function BackgroundGate() {
  const [on, setOn] = useState(false)
  const fail = useCallback(() => setOn(false), [])

  useEffect(() => {
    const allowed = () =>
      shouldRunContour({
        reducedMotion: prefersReducedMotion(),
        coarsePointer: window.matchMedia('(pointer: coarse) and (hover: none)').matches,
        tier: getPerfTier(),
      })

    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    let idleId: number | undefined
    const start = () => {
      if (!allowed()) return
      if (w.requestIdleCallback) idleId = w.requestIdleCallback(() => setOn(allowed()), { timeout: 3000 })
      else idleId = window.setTimeout(() => setOn(allowed()), 1500)
    }
    if (document.readyState === 'complete') start()
    else window.addEventListener('load', start, { once: true })

    const recheck = () => setOn(allowed())
    window.addEventListener(PERF_TIER_EVENT, recheck)
    window.addEventListener(A11Y_EVENT, recheck)
    void watchFrameHealth()

    return () => {
      window.removeEventListener('load', start)
      window.removeEventListener(PERF_TIER_EVENT, recheck)
      window.removeEventListener(A11Y_EVENT, recheck)
      if (idleId !== undefined) {
        const c = window as Window & { cancelIdleCallback?: (id: number) => void }
        if (c.cancelIdleCallback) c.cancelIdleCallback(idleId)
        else window.clearTimeout(idleId)
      }
    }
  }, [])

  return on ? <ContourCanvas onFail={fail} /> : null
}
```

In `app/(site)/layout.tsx`, import `BackgroundGate` and replace `{/* Task 10: background */}` with `<BackgroundGate />`.

- [ ] **Step 7: Write the background e2e test**

`e2e/background.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('desktop: the contour canvas mounts after load', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
})

test('desktop: switching theme keeps the canvas running', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
  await page.getByRole('button', { name: 'Toggle dark and light mode' }).first().click()
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('no contour at all', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(4000)
    await expect(page.locator('[data-contour]')).toHaveCount(0)
  })
})

test('a restored low tier keeps the contour off', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('kraft-perf', 'low'))
  await page.goto('/')
  await page.waitForTimeout(4000)
  await expect(page.locator('[data-contour]')).toHaveCount(0)
})
```

Append to `e2e/phone.spec.ts`:

```ts
test('phone: no contour on touch devices', async ({ page }) => {
  await page.goto('/')
  await page.waitForTimeout(4000)
  await expect(page.locator('[data-contour]')).toHaveCount(0)
})
```

- [ ] **Step 8: Run every check**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS. If `desktop: the contour canvas mounts` fails because headless Chromium has no WebGL, run `npx playwright test e2e/background.spec.ts --headed` to confirm it works with a GPU. Report the headless result as a finding rather than weakening the test.

- [ ] **Step 9: Commit**

```bash
git add app components lib tests e2e
git commit -m "feat: kape contour background in Kraft colours behind a performance gate" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Phase 1 verification and screenshot pass

**Files:**
- Create: `e2e/screenshots.spec.ts`
- Modify (only if the visual review calls for it): `components/shell/ContourCanvas.tsx` (`LINE_ALPHA` only)

**Interfaces:**
- Consumes: everything above.
- Produces: screenshots in `test-results/shots/` (gitignored) for the owner's review.

- [ ] **Step 1: Write the screenshot spec (tagged `@shots`, not part of `npm run e2e`)**

`e2e/screenshots.spec.ts`:

```ts
import { test } from '@playwright/test'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact']
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
]
const THEMES = ['dark', 'light'] as const
const STANDALONE = pathToFileURL(
  path.resolve('reference/Kraft_Portfolio_Design_System/Kraft Portfolio (standalone).html'),
).href

test.describe('@shots', () => {
  test.setTimeout(240_000)

  test('capture every route in both themes at both sizes', async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.emulateMedia({ colorScheme: theme })
        for (const r of ROUTES) {
          await page.goto(r)
          await page.waitForTimeout(2500)
          const slug = r === '/' ? 'home' : r.slice(1)
          await page.screenshot({ path: `test-results/shots/app-${slug}-${theme}-${size.name}.png` })
        }
      }
    }
  })

  test('capture the Kraft standalone reference', async ({ page }) => {
    for (const size of SIZES) {
      await page.setViewportSize({ width: size.width, height: size.height })
      for (const theme of THEMES) {
        await page.addInitScript((t) => localStorage.setItem('kraft-theme', t), theme)
        await page.goto(STANDALONE)
        await page.waitForTimeout(7000) // Kraft's loader and headline flight
        await page.screenshot({ path: `test-results/shots/kraft-${theme}-${size.name}.png` })
      }
    }
  })
})
```

- [ ] **Step 2: Run the full gate**

Run: `npm test && npm run typecheck && npm run lint && npm run e2e`
Expected: all PASS. Record the pass/fail counts for the report.

- [ ] **Step 3: Capture the screenshots**

Run: `npm run shots`
Expected: `test-results/shots/` contains 28 `app-*` and 4 `kraft-*` PNGs.

- [ ] **Step 4: Review against Kraft**

Open `app-home-{dark,light}-desktop.png` next to `kraft-{dark,light}-desktop.png`. For the **sidebar and top bar only**, list every difference in spacing, size, colour, radius, weight or copy, then fix the app to match Kraft (never the reverse). Expected, non-bug differences: Kraft's page sits inside a fake browser frame and a phone mock-up, and page bodies are Phase 1 placeholders.

Check the contour in both themes. If the lines are invisible or overpowering, adjust **only** `LINE_ALPHA` in `ContourCanvas.tsx`, in steps of 0.05. If the two themes need different values, report that instead of branching the shader.

- [ ] **Step 5: Keyboard and reduced-motion pass (manual, `npm run dev`)**

- **Keyboard only:** Tab from the page top reaches the skip link, then the sidebar socials, theme button, nav, Start a project, Jump to and Get in touch. ⌘K/Ctrl+K works from anywhere. Focus rings are visible in both themes.
- **With the OS reduced-motion setting on:** there's no page fade and no contour, reveals are visible, and theme switching is instant.

Note any failure as a bug and fix it before continuing.

- [ ] **Step 6: Final commit**

```bash
git add e2e components
git commit -m "test: Phase 1 screenshot pass and visual tuning" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 7: Report**

Summarise for the owner: the test counts, the screenshot folder, the differences found and fixed, the final `LINE_ALPHA`, and anything deferred. Don't push. Ask whether to push the branch.
