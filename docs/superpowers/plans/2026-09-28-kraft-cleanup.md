# Kraft deferred-items cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close every deferred item still open from PRs #1–#4, and remove the desktop top bar.

**Architecture:** Every change is to code that already exists. There are four new modules, each small and pure:
- `lib/scrollMemory.ts`: Back/Forward scroll positions.
- `lib/webgl.ts`: releasing a renderer.
- `lib/share-meta.ts`: the share image's size and alt text, with no `next/og` import.
- `components/showcase/Cta.tsx`: the Flagship's call to action.

Everything else is a targeted edit, each with a test that fails first.

**Tech Stack:**
- Next.js 16.3 App Router, React 19.3, TypeScript 5.9 (strict).
- Tailwind 4.3 with Kraft tokens only.
- Three.js 0.186, Lenis 1.x.
- Vitest 5 with jsdom; Playwright (desktop 1440×900, phone 390×844).

**Spec:** `docs/superpowers/specs/2026-09-28-kraft-cleanup-design.md`

## Global Constraints

- Colours come only from Kraft tokens. `tests/no-raw-colors.test.ts` scans `app`, `components`, `data`, `hooks` and `lib`.
- Components don't hard-code copy. New visible or announced text goes in `data/`.
- Icons come from `@phosphor-icons/react/ssr`.
- Browser storage is always wrapped in try/catch, and the page must work without it.
- Motion always respects `prefersReducedMotion()` (the OS setting or the access menu's "Motion off").
- Never follow `reference/Kraft_Portfolio_Design_System/HANDOFF.md`.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Commands:
  - `npm test`: Vitest, all unit tests.
  - `npx vitest run <file>`: one unit file.
  - `npx playwright test <file> --project=desktop`: one e2e file. It builds first, so it's slow.
  - `npm run typecheck`, `npm run lint`.

## Review Focus

1. **Closing a Projects view with Back** (a hash-only history step) must not trigger a scroll restore or a jump. Pinned in Task 10 (`scrollMemory`, hash-only pop).
2. **⌘K when the intro has already ended**, or on another page, toggles the palette as before and never calls the intro's skip. Pinned in Task 6 (palette unit test).
3. **Turning on OS reduced motion while the sites view shows the drum** swaps it for the grid at once. Pinned in Task 8 (`sites.test.tsx`).
4. **Blocked `sessionStorage`** while scroll positions are saved: nothing throws, and Back still restores within the page load. Pinned in Task 10.
5. **The Showcase meta description** never shows PLACEHOLDER text. Pinned in Task 5 (`ledeOr`).

---

### Task 1: Remove the desktop top bar (spec A1)

**Files:**
- Delete: `components/shell/TopBar.tsx`, `components/shell/ShellTopBar.tsx`
- Modify: `app/(site)/layout.tsx:10,37,40`, `lib/scroller.ts:42-43`
- Test: `e2e/shell.spec.ts`, `e2e/palette.spec.ts`, `tests/hash.test.ts`

**Interfaces:**
- Produces: `SECTION_OFFSET = 24` in `lib/scroller.ts`, the same name as before.

- [ ] **Step 1: Write the failing e2e tests.** In `e2e/shell.spec.ts`:
  - Delete the test `'Get in touch goes to contact'`.
  - Add the two tests below. Add `import { hydrated } from './helpers'` at the top if it's missing. `sidebarNav` is already defined in this file; if it isn't, copy its definition from `e2e/intro.spec.ts:4-5`.

```ts
test('desktop has no top bar: no crumb, no Jump to button', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await expect(page.getByRole('button', { name: /Jump to/ })).toHaveCount(0)
  await expect(page.getByText(/^KRAFT \/ /)).toHaveCount(0)
})

test('a ⌘K section lands near the top of the panel', async ({ page }) => {
  await page.goto('/services')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('kraft method')
  await page.keyboard.press('Enter')
  const gap = () =>
    page.evaluate(() => {
      const s = document.getElementById('method')!.getBoundingClientRect().top
      return s - document.getElementById('main-content')!.getBoundingClientRect().top
    })
  await expect.poll(gap, { timeout: 5_000 }).toBeLessThan(48)
  expect(await gap()).toBeGreaterThanOrEqual(0)
})
```

In `e2e/palette.spec.ts`, replace the test `'Jump to button opens it; Escape closes and returns focus'` with:

```ts
test('Ctrl+K from a focused link; Escape closes and returns focus to it', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const link = page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('link', { name: /^Home/ })
  await link.focus()
  await page.keyboard.press('Control+k')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Command palette' })).toBeHidden()
  await expect(link).toBeFocused()
})
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx playwright test e2e/shell.spec.ts e2e/palette.spec.ts --project=desktop`
  - Expected: FAIL on "desktop has no top bar" (the "Jump to" count is 1) and on "a ⌘K section lands near the top" (the gap is about 88). The palette test passes.

- [ ] **Step 3: Remove the bar.**
  - Delete `components/shell/TopBar.tsx` and `components/shell/ShellTopBar.tsx`.
  - In `app/(site)/layout.tsx`:
    - Remove the `ShellTopBar` import and `<ShellTopBar />`.
    - Change the `<main>` class `shell:pt-0` to `shell:pt-(--deskpad)`.
  - In `lib/scroller.ts`:

```ts
/** A little air above a section when it lands, so its heading isn't flush with the edge. */
export const SECTION_OFFSET = 24
```

  - In `tests/hash.test.ts`, rename `'goes through Lenis when Lenis owns the panel, clearing the sticky top bar'` to `'goes through Lenis when Lenis owns the panel, leaving a little air above'`. The body doesn't change.

- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: `npx playwright test e2e/shell.spec.ts e2e/palette.spec.ts --project=desktop && npx vitest run tests/hash.test.ts && npm run typecheck`
  - Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add -A app/\(site\)/layout.tsx components/shell lib/scroller.ts tests/hash.test.ts e2e/shell.spec.ts e2e/palette.spec.ts
git commit -m "feat: remove the desktop top bar; ⌘K stays on the keyboard and sections land with a little air"
```

---

### Task 2: Windows keep their margin; the access panel never covers its button (spec A2, A3)

**Files:**
- Modify: `app/globals.css:251`, `lib/popover.ts`, `components/shell/AccessMenu.tsx:35-45,94`
- Test: `tests/popover.test.ts`, `e2e/projects.spec.ts`, `e2e/access.spec.ts`

**Interfaces:**
- Produces: `placePanel(button, panel, view): { top: number; left: number; maxHeight?: number }`

- [ ] **Step 1: Write the failing unit tests.** In `tests/popover.test.ts`, replace the test `'stays on screen when there is room neither above nor below'` with:

```ts
  it('when it fits neither way, takes the side with more room below and scrolls inside', () => {
    expect(placePanel(button(100, 300), { width: 300, height: 600 }, view)).toEqual({ top: 348, left: 100, maxHeight: 436 })
  })
  it('when it fits neither way, takes the side with more room above and scrolls inside', () => {
    expect(placePanel(button(100, 500), { width: 300, height: 600 }, view)).toEqual({ top: 16, left: 100, maxHeight: 474 })
  })
  it('never covers its button', () => {
    for (const top of [100, 300, 420, 500, 700]) {
      const b = button(100, top)
      const p = placePanel(b, { width: 300, height: 600 }, view)
      const bottom = p.top + (p.maxHeight ?? 600)
      expect(bottom <= b.top || p.top >= b.bottom, `button at ${top}`).toBe(true)
    }
  })
```

- [ ] **Step 2: Write the failing e2e tests.** In `e2e/projects.spec.ts`:

```ts
test('a write-up window keeps its margin', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  const pad = await view.evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))
  expect(pad).toBeGreaterThan(0)
})
```

In `e2e/access.spec.ts`:

```ts
test('at the largest text on a short window, the panel never covers its button', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 560 })
  await page.goto('/about')
  await hydrated(page)
  await sidebarMenu(page).click()
  await page.getByRole('dialog', { name: 'Accessibility' }).getByRole('button', { name: 'A++, Largest text' }).click()
  await page.keyboard.press('Escape')
  await sidebarMenu(page).click()
  const panel = page.getByRole('dialog', { name: 'Accessibility' })
  await expect(panel).toBeVisible()
  const b = (await sidebarMenu(page).boundingBox())!
  const p = (await panel.boundingBox())!
  const overlaps = p.x < b.x + b.width && b.x < p.x + p.width && p.y < b.y + b.height && b.y < p.y + p.height
  expect(overlaps).toBe(false)
})
```

- [ ] **Step 3: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/popover.test.ts`
  - Expected: FAIL. `maxHeight` is missing, and the panel's top is 16.
  - Run: `npx playwright test e2e/projects.spec.ts e2e/access.spec.ts --project=desktop -g "margin|covers"`
  - Expected: FAIL. The padding is 0, and the panel overlaps the button.

- [ ] **Step 4: Implement.** In `app/globals.css`, line 251 becomes:

```css
dialog.view--window{padding:clamp(10px,2.4vw,34px)}
```

(`dialog.view{padding:0}` has the same specificity and comes earlier, so this rule now wins.)

`lib/popover.ts`:

```ts
const GAP = 10
const EDGE = 16

/**
 * Where a small panel opens from its button. It sits under the button, lined
 * up with its left edge, or above it when there isn't room below. When it fits
 * neither way (the largest text on a short window), it takes the side with
 * more room and scrolls inside (`maxHeight`), so it never covers its button.
 */
export function placePanel(
  button: Pick<DOMRect, 'left' | 'top' | 'bottom'>,
  panel: { width: number; height: number },
  view: { width: number; height: number },
): { top: number; left: number; maxHeight?: number } {
  const left = Math.max(EDGE, Math.min(button.left, view.width - panel.width - EDGE))
  const below = button.bottom + GAP
  const roomBelow = view.height - EDGE - below
  const roomAbove = button.top - GAP - EDGE
  if (panel.height <= roomBelow) return { top: below, left }
  if (panel.height <= roomAbove) return { top: button.top - GAP - panel.height, left }
  if (roomBelow >= roomAbove) return { top: below, left, maxHeight: roomBelow }
  return { top: EDGE, left, maxHeight: roomAbove }
}
```

In `components/shell/AccessMenu.tsx`, the layout effect becomes:

```ts
    const { top, left, maxHeight } = placePanel(button.current.getBoundingClientRect(), el.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    })
    el.style.top = `${top}px`
    el.style.left = `${left}px`
    el.style.maxHeight = maxHeight === undefined ? '' : `${maxHeight}px`
```

Also add `overflow-y-auto` to the panel `<div>`'s className (after `flex-col`).

- [ ] **Step 5: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/popover.test.ts tests/AccessMenu.test.tsx && npx playwright test e2e/projects.spec.ts e2e/access.spec.ts --project=desktop`
  - Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add app/globals.css lib/popover.ts components/shell/AccessMenu.tsx tests/popover.test.ts e2e/projects.spec.ts e2e/access.spec.ts
git commit -m "fix: windows keep their margin, and the access panel takes the roomier side and scrolls instead of covering its button"
```

---

### Task 3: "No matches" is a status, not part of the list (spec A4)

**Files:**
- Modify: `components/shell/CommandPalette.tsx:183-205`
- Test: `tests/CommandPalette.test.tsx`

- [ ] **Step 1: Write the failing test** in `tests/CommandPalette.test.tsx`, inside `describe('CommandPalette')`:

```ts
  it('announces "No matches" as a status, outside the listbox', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz')
    const listbox = screen.getByRole('listbox')
    expect(Array.from(listbox.children).every((c) => c.getAttribute('role') === 'option')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('No matches')
  })
```

- [ ] **Step 2: Run it and watch it fail.**
  - Run: `npx vitest run tests/CommandPalette.test.tsx`
  - Expected: FAIL. The listbox holds a `<p>`, and there is no `status`.

- [ ] **Step 3: Implement.** Replace the results block in `PaletteDialog` with:

```tsx
        <div data-scroll className="max-h-[46vh] overflow-y-auto p-2">
          <div id="palette-results" role="listbox" aria-label="Sections">
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
          <p role="status" className={hits.length === 0 ? 'px-[13px] py-3 text-sm text-ink3' : 'sr-only'}>
            {hits.length === 0 ? 'No matches' : ''}
          </p>
        </div>
```

The status stays mounted, so a screen reader announces the text when it appears.

- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/CommandPalette.test.tsx tests/CommandPalette.focus.test.tsx`
  - Expected: PASS, including the older "No matches" click and Tab tests.

- [ ] **Step 5: Commit.**

```bash
git add components/shell/CommandPalette.tsx tests/CommandPalette.test.tsx
git commit -m "fix: the palette announces No matches as a status, outside its listbox"
```

---

### Task 4: A bold share headline, and per-page share images with size and alt (spec A5, D5)

**Files:**
- Create: `assets/fonts/Geist-Bold.ttf`, `assets/fonts/OFL.txt`, `lib/share-meta.ts`, `lib/share-font.ts`
- Modify: `lib/share-image.tsx`, `lib/seo.ts:25-26`, `app/opengraph-image.tsx:1`, `app/twitter-image.tsx:1`
- Test: `tests/seo.test.ts`

**Interfaces:**
- Produces:
  - `SHARE_SIZE` and `SHARE_ALT` from `lib/share-meta.ts`.
  - `shareFonts(): { name: 'Geist Bold'; data: Buffer; weight: 700; style: 'normal' }[]` from `lib/share-font.ts` (no `next/og` import, so unit tests can load it).

- [ ] **Step 1: Fetch the font, static Bold, as TrueType.**

```bash
mkdir -p assets/fonts
URL=$(curl -sL "https://fonts.googleapis.com/css2?family=Geist:wght@700" | grep -o 'https://[^)]*\.ttf' | head -1)
curl -sL -o assets/fonts/Geist-Bold.ttf "$URL"
node -e "const b=require('fs').readFileSync('assets/fonts/Geist-Bold.ttf');console.log(b.length, b.readUInt32BE(0).toString(16), b.includes(Buffer.from('fvar')))"
```

- Expected: a size over 30000, magic `10000`, and `false`, meaning a static font with no `fvar` table.
- If it prints `true` (a variable font) or the magic is wrong, take the static TTF from Vercel's release instead: `gh release download --repo vercel/geist-font --pattern '*.zip' -D "$TMP"`, then unzip and copy the static `Geist-Bold.ttf`.

Then the licence:

```bash
curl -sL -o assets/fonts/OFL.txt "$(gh api repos/vercel/geist-font/license --jq .download_url)"
head -3 assets/fonts/OFL.txt
```

Expected: the SIL Open Font License header.

- [ ] **Step 2: Write the failing tests** in `tests/seo.test.ts`.
  - Add the imports:

```ts
import { SHARE_ALT, SHARE_SIZE } from '@/lib/share-meta'
import { shareFonts } from '@/lib/share-font'
```

  - Change the `openGraph` and `twitter` expectations in `"names a page after its nav label…"` to:

```ts
    const image = { width: SHARE_SIZE.width, height: SHARE_SIZE.height, alt: SHARE_ALT }
    expect(m.openGraph).toMatchObject({ title: 'Projects · Kraft', url: '/projects', siteName: 'Kraft', images: [{ url: '/opengraph-image', ...image }] })
    expect(m.twitter).toMatchObject({ images: [{ url: '/twitter-image', ...image }] })
```

  - Add:

```ts
describe('share image', () => {
  it('draws the headline in Geist Bold, loaded from the repo', () => {
    const [font] = shareFonts()
    expect(font).toMatchObject({ name: 'Geist Bold', weight: 700, style: 'normal' })
    expect(font.data.readUInt32BE(0)).toBe(0x00010000)
    expect(font.data.length).toBeGreaterThan(30_000)
  })
})
```

- [ ] **Step 3: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/seo.test.ts`
  - Expected: FAIL. `lib/share-meta` can't be resolved.

- [ ] **Step 4: Implement.** Create `lib/share-meta.ts`:

```ts
import { home } from '@/data/home'
import { profile } from '@/data/profile'

/** The share image's size and alt text (spec §13), kept apart from next/og so page metadata can name them. */
export const SHARE_SIZE = { width: 1200, height: 630 }
export const SHARE_ALT = `${profile.name} · Kraft: ${home.headline.join(' ')}`
```

Create `lib/share-font.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Geist Bold (assets/fonts, OFL) for the share headline. next/og's built-in Geist is regular weight only. */
export function shareFonts() {
  return [
    { name: 'Geist Bold', data: readFileSync(join(process.cwd(), 'assets/fonts/Geist-Bold.ttf')), weight: 700 as const, style: 'normal' as const },
  ]
}
```

In `lib/share-image.tsx`:
- Remove the two constants.
- Add the imports:

```ts
import { shareFonts } from './share-font'
import { SHARE_SIZE } from './share-meta'
```

- Give the headline `<div>` `fontFamily: 'Geist Bold'`, next to its `fontWeight: 700`.
- Pass the fonts: `new ImageResponse(<…/>, { ...SHARE_SIZE, fonts: shareFonts() })`.

In `app/opengraph-image.tsx` and `app/twitter-image.tsx`, change the import to:

```ts
import { SHARE_ALT, SHARE_SIZE } from '@/lib/share-meta'
import { shareImage } from '@/lib/share-image'
```

In `lib/seo.ts`:
- Add `import { SHARE_ALT, SHARE_SIZE } from './share-meta'`.
- Change the two image lines to:

```ts
    openGraph: { ...OG_BASE, title: full, description, url: href, images: [{ url: '/opengraph-image', ...SHARE_SIZE, alt: SHARE_ALT }] },
    twitter: { card: 'summary_large_image', title: full, description, images: [{ url: '/twitter-image', ...SHARE_SIZE, alt: SHARE_ALT }] },
```

- [ ] **Step 5: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/seo.test.ts && npm run typecheck && npx playwright test e2e/seo.spec.ts --project=desktop`
  - Expected: PASS.
  - Also open `test-results` or the `npm run shots` output for `/opengraph-image`: the headline must be visibly bold.

- [ ] **Step 6: Commit.**

```bash
git add assets/fonts lib/share-meta.ts lib/share-font.ts lib/share-image.tsx lib/seo.ts app/opengraph-image.tsx app/twitter-image.tsx tests/seo.test.ts
git commit -m "fix: the share headline is Geist Bold, and every page's share image keeps its size and alt"
```

---

### Task 5: Showcase CTA and description (spec A6, A7)

**Files:**
- Create: `components/showcase/Cta.tsx`
- Modify: `components/showcase/Flagship.tsx:40,58-64`, `data/showcase.ts` (`flagship.cta`), `lib/seo.ts`, `app/(site)/showcase/page.tsx:8`
- Test: `tests/showcase.test.tsx`, `tests/seo.test.ts`

**Interfaces:**
- Produces:
  - `Cta({ label, href, soon }: { label: string; href: string; soon: string })`.
  - `ledeOr(lede: string, fallback: string): string` in `lib/seo.ts`.

- [ ] **Step 1: Write the failing tests.** In `tests/showcase.test.tsx`, add the import `import Cta from '@/components/showcase/Cta'` and:

```tsx
describe('Flagship CTA', () => {
  it('is not a link while its URL is a placeholder, and says so to screen readers', () => {
    render(<Cta label="Open product" href="PLACEHOLDER - product URL" soon="Link coming soon" />)
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText(/Link coming soon/)).toBeInTheDocument()
  })
  it('opens the real product in a new tab', () => {
    render(<Cta label="Open product" href="https://example.com" soon="Link coming soon" />)
    const link = screen.getByRole('link', { name: 'Open product' })
    expect(link).toHaveAttribute('href', 'https://example.com')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
```

In `tests/seo.test.ts`, add `ledeOr` to the `@/lib/seo` import, and:

```ts
describe('ledeOr', () => {
  it('uses the lede once it is real', () => {
    expect(ledeOr('A real line.', 'Heading')).toBe('A real line.')
  })
  it('never lets a PLACEHOLDER reach search results', () => {
    expect(ledeOr('PLACEHOLDER - one line', 'Heading')).toBe('Heading')
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/showcase.test.tsx tests/seo.test.ts`
  - Expected: FAIL. `Cta` can't be resolved, and `ledeOr` isn't a function.

- [ ] **Step 3: Implement.** Create `components/showcase/Cta.tsx`:

```tsx
import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr'
import { isPlaceholder } from '@/lib/placeholder'

const LOOK = 'mt-1 flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent'

/**
 * The Flagship's call to action. Until its URL is real it keeps the button's
 * look but is not a link, so it can never jump to the top of the page, and it
 * tells screen readers the link is still to come.
 */
export default function Cta({ label, href, soon }: { label: string; href: string; soon: string }) {
  if (isPlaceholder(href)) {
    return (
      <span className={`${LOOK} cursor-default`}>
        {label} <ArrowSquareOutIcon size={16} aria-hidden />
        <span className="sr-only">, {soon}</span>
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${LOOK} transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]`}
    >
      {label} <ArrowSquareOutIcon size={16} aria-hidden />
    </a>
  )
}
```

In `data/showcase.ts`, `flagship.cta` becomes:

```ts
    cta: { label: 'Open product', href: 'PLACEHOLDER - product URL', soon: 'Link coming soon' },
```

In `components/showcase/Flagship.tsx`:
- Delete line 40 (`const cta = …`).
- Replace the `<a …>…</a>` CTA with `<Cta label={f.cta.label} href={f.cta.href} soon={f.cta.soon} />`.
- Add `import Cta from './Cta'`.
- Remove the now-unused `ArrowSquareOutIcon` and `isPlaceholder` imports.

In `lib/seo.ts`, add `import { isPlaceholder } from './placeholder'` and:

```ts
/** A page's meta description: its lede, or `fallback` while the lede is still a PLACEHOLDER. */
export function ledeOr(lede: string, fallback: string): string {
  return isPlaceholder(lede) ? fallback : lede
}
```

In `app/(site)/showcase/page.tsx`, line 8 becomes:

```ts
export const metadata = pageMetadata('/showcase', ledeOr(showcase.lede, showcase.title.join(' ')))
```

(Add `ledeOr` to its `@/lib/seo` import.)

- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/showcase.test.tsx tests/seo.test.ts && npm run typecheck && npm run lint`
  - Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add components/showcase data/showcase.ts lib/seo.ts app/\(site\)/showcase/page.tsx tests/showcase.test.tsx tests/seo.test.ts
git commit -m "fix: the Showcase CTA isn't a dead link while its URL is a placeholder, and the page is described by its lede once real"
```

---

### Task 6: Intro hardening (spec B1–B6)

**Files:**
- Modify:
  - `lib/intro.ts` (add `INTRO_MAX_MS`, `registerIntroSkip`, `introLive`, `skipIntro`; fix the `speedFor` comment)
  - `components/shell/IntroOverlay.tsx:56,112,231-254,293-302`
  - `components/shell/CommandPalette.tsx:46-56`
  - `app/globals.css:191-192`
  - `components/home/WheelRow.tsx:10`
  - `e2e/helpers.ts`, `e2e/intro.spec.ts`
- Create: `tests/IntroOverlay.test.tsx`, `tests/WheelRow.test.tsx`
- Test: `tests/CommandPalette.test.tsx`

**Interfaces:**
- Produces, from `lib/intro.ts`:
  - `INTRO_MAX_MS: number` (8000);
  - `registerIntroSkip(fn: (() => void) | null): void`;
  - `introLive(): boolean`;
  - `skipIntro(): void`.

- [ ] **Step 1: Write the failing unit tests.** Create `tests/IntroOverlay.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import IntroOverlay from '@/components/shell/IntroOverlay'
import { INTRO_MAX_MS } from '@/lib/intro'

// The run waits for the webfont forever: only the watchdog can end it.
vi.mock('@/lib/intro', async (orig) => ({
  ...(await orig<typeof import('@/lib/intro')>()),
  whenFontsReady: () => new Promise<void>(() => {}),
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('IntroOverlay', () => {
  afterEach(() => vi.useRealTimers())

  it('hands the page back if the run never finishes', () => {
    vi.useFakeTimers()
    const root = document.documentElement
    root.setAttribute('data-intro', '')
    root.setAttribute('data-intro-head', '')
    render(<IntroOverlay />)
    expect(root).toHaveAttribute('data-intro-live')
    act(() => vi.advanceTimersByTime(INTRO_MAX_MS))
    expect(root).not.toHaveAttribute('data-intro')
    expect(root).not.toHaveAttribute('data-intro-head')
  })
})
```

Create `tests/WheelRow.test.tsx`:

```tsx
import { expect, it } from 'vitest'
import { render } from '@testing-library/react'
import WheelRow from '@/components/home/WheelRow'

it('is not a Tab stop of its own: the card link around it is', () => {
  const { container } = render(<WheelRow className="">x</WheelRow>)
  expect(container.firstElementChild).toHaveAttribute('tabindex', '-1')
})
```

In `tests/CommandPalette.test.tsx`, add `import { registerIntroSkip } from '@/lib/intro'` and:

```ts
  it('Ctrl+K during the Home intro ends the intro, then opens', async () => {
    const user = userEvent.setup()
    const skip = vi.fn(() => document.documentElement.removeAttribute('data-intro-live'))
    registerIntroSkip(skip)
    document.documentElement.setAttribute('data-intro-live', '')
    setup()
    await user.keyboard('{Control>}k{/Control}')
    expect(skip).toHaveBeenCalledOnce()
    expect(dialog()).toBeInTheDocument()
    registerIntroSkip(null)
  })

  it('Ctrl+K with no intro running never touches it', async () => {
    const user = userEvent.setup()
    const skip = vi.fn()
    registerIntroSkip(skip)
    setup()
    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('{Control>}k{/Control}')
    expect(skip).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
    registerIntroSkip(null)
  })
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/IntroOverlay.test.tsx tests/WheelRow.test.tsx tests/CommandPalette.test.tsx`
  - Expected: FAIL. The page stays held (`data-intro` is still present), `tabindex` is missing, and `registerIntroSkip` isn't exported.

- [ ] **Step 3: Implement `lib/intro.ts`.**
  - Replace the `speedFor` comment with: `/** Phones run the same sequence in 62% of the desktop time: a thumb is waiting. */`
  - Add after `INTRO`:

```ts
/**
 * The most the whole run may take once the overlay claims it: the font wait
 * plus the desktop sequence (4.35s), with room to spare. Past this the page is
 * handed back, whatever went wrong.
 */
export const INTRO_MAX_MS = 8000
```

  - Add after `claimIntro`:

```ts
let skipper: (() => void) | null = null

/** The running intro's skip, for keys other than its own Esc (⌘K). */
export function registerIntroSkip(fn: (() => void) | null) {
  skipper = fn
}

export const introLive = () => root().hasAttribute('data-intro-live')

export function skipIntro() {
  skipper?.()
}
```

- [ ] **Step 4: Implement `IntroOverlay.tsx`.**
  - Import `INTRO_MAX_MS` and `registerIntroSkip`.
  - After `skipRef.current = skip`, add:

```ts
    registerIntroSkip(skip)
    // Whatever goes wrong inside the run, the page comes back.
    timers.push(window.setTimeout(skip, INTRO_MAX_MS))
```

  - Change the run promise to `new Promise<void>((resolve, reject) => {`, and wrap the body of `step` in `try { … } catch (err) { reject(err) }`. The existing `run().catch(skip)` then ends the intro at once when a frame throws.
    - This path is not unit-tested: jsdom can't reach the run stage (it has no `Element.animate` and no `getTotalLength`).
    - The watchdog test covers the same risk, and the final reviewer checks this path.
  - In the cleanup, add `registerIntroSkip(null)` next to `skipRef.current = () => {}`.

- [ ] **Step 5: Implement the rest.** In `components/shell/CommandPalette.tsx`:
  - Add `import { introLive, skipIntro } from '@/lib/intro'`.
  - In `onKey`, after the `data-dialog` check:

```ts
        // ⌘K during the Home intro: end it (as Esc would), then open on the real page.
        if (!open && introLive()) skipIntro()
```

In `app/globals.css`, lines 191–192 become:

```css
html[data-intro] [data-intro-hold],
html[data-intro] [data-intro-rail] > *{opacity:0;visibility:hidden}
```

(Hidden pieces leave the focus order, hit-testing and the accessibility tree. Layout is unchanged, so the headline landing still measures true.)

In `components/home/WheelRow.tsx`, the `<div>` gets `tabIndex={-1}`. Update its comment:

```tsx
/**
 * A sideways row that a vertical wheel scrolls, until it reaches its end. It
 * sits inside the Services card's link, so it is not a Tab stop of its own.
 */
```

- [ ] **Step 6: Run the unit tests and watch them pass.**
  - Run: `npx vitest run tests/IntroOverlay.test.tsx tests/WheelRow.test.tsx tests/CommandPalette.test.tsx tests/intro.test.ts`
  - Expected: PASS.

- [ ] **Step 7: Write the e2e tests.** In `e2e/helpers.ts`, add:

```ts
/** The headline's lines, read by where each word sits: the flying copy (shown for a moment, unpainted) and the real <h1>. */
export function headlineLines(page: Page) {
  return page.evaluate(() => {
    const byRow = (items: { top: number; text: string }[]) => {
      const rows = new Map<number, string[]>()
      for (const it of items) {
        const k = Math.round(it.top)
        rows.set(k, [...(rows.get(k) ?? []), it.text])
      }
      return [...rows.keys()].sort((a, b) => a - b).map((k) => rows.get(k)!.join(' '))
    }
    const overlay = document.querySelector<HTMLElement>('[data-intro-overlay]')!
    overlay.style.display = 'block'
    overlay.style.visibility = 'hidden'
    const flying = byRow(
      [...overlay.querySelectorAll<HTMLElement>('.intro-title .intro-word')].map((w) => ({
        top: w.getBoundingClientRect().top,
        text: (w.textContent ?? '').trim(),
      })),
    )
    overlay.style.display = ''
    overlay.style.visibility = ''
    const h1 = document.querySelector<HTMLElement>('[data-intro-target]')!
    const words: { top: number; text: string }[] = []
    const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
        const r = document.createRange()
        r.setStart(n, m.index!)
        r.setEnd(n, m.index! + m[0].length)
        words.push({ top: r.getBoundingClientRect().top, text: m[0] })
      }
    }
    return { flying, real: byRow(words) }
  })
}
```

In `e2e/intro.spec.ts`:
- Import `headlineLines`.
- Add to `'the flying headline lands exactly on the Home h1'`:

```ts
  const lines = await headlineLines(page)
  expect(lines.real.length).toBeGreaterThanOrEqual(2)
  expect(lines.flying).toEqual(lines.real)
```

Replace `'navigating away during the intro hands the page back'` with:

```ts
test('navigating away during the intro hands the page back', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  // The sidebar is hidden while the intro plays, so leave the way Back would: through the router.
  await page.evaluate(() => (window as unknown as { next: { router: { push(h: string): void } } }).next.router.push('/about'))
  await expect(page).toHaveURL(/\/about$/)
  await expect(page.locator('html')).not.toHaveAttribute('data-intro')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.locator('[data-panel-content]')).toHaveCSS('opacity', '1')
  await expect(page.locator('[data-intro-rail] > *').first()).toHaveCSS('opacity', '1')
})
```

Add:

```ts
test('while it plays, the hidden page can be neither clicked nor tabbed to', async ({ page }) => {
  await page.goto('/')
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await expect(skip).toBeVisible()
  const hitsLink = await page.evaluate(() => {
    const link = document.querySelector<HTMLElement>('[data-intro-rail] a[href]')!
    const b = link.getBoundingClientRect()
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    return !!hit && link.contains(hit)
  })
  expect(hitsLink).toBe(false)
  await skip.focus()
  await page.keyboard.press('Tab')
  const inHeld = await page.evaluate(() => !!document.activeElement?.closest('[data-intro-hold], [data-intro-rail] > *'))
  expect(inHeld).toBe(false)
})

test('Ctrl+K ends it and opens the palette', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-intro-live')
  await page.keyboard.press('Control+k')
  await expect(page.locator('html')).not.toHaveAttribute('data-intro-head')
  await expect(page.getByRole('combobox', { name: 'Jump to a section' })).toBeFocused()
})
```

- [ ] **Step 8: Run the e2e tests.**
  - Run: `npx playwright test e2e/intro.spec.ts e2e/home.spec.ts --project=desktop && npx playwright test --project=phone`
  - Expected: PASS.
  - To prove the tests bite, temporarily revert the CSS line from Step 5 and rerun `intro.spec.ts`: "can be neither clicked nor tabbed to" must FAIL. Then restore the line.
  - If the `headlineLines` check fails, the landing really does break lines differently. Fix it in `IntroOverlay` (the title width) rather than loosening the test.

- [ ] **Step 9: Commit.**

```bash
git add lib/intro.ts components/shell/IntroOverlay.tsx components/shell/CommandPalette.tsx app/globals.css components/home/WheelRow.tsx tests/IntroOverlay.test.tsx tests/WheelRow.test.tsx tests/CommandPalette.test.tsx e2e/helpers.ts e2e/intro.spec.ts
git commit -m "fix: the intro can't strand the page, ⌘K ends it, hidden pieces can't be reached, and the Services row isn't a Tab stop"
```

---

### Task 7: Motion follows the OS setting live everywhere (spec C1)

**Files:**
- Modify:
  - `test/matchMedia.ts` (live listeners, plus `setMediaMatch`) and `vitest.setup.ts` (reset after each test)
  - `lib/motion.ts` (add `REDUCED_MOTION_QUERY`, `onMotionChange`)
  - `hooks/useReducedMotion.ts`, `hooks/useWebGLAllowed.ts`
  - `components/shell/BackgroundGate.tsx:36-45`
  - `hooks/useSmoothScroll.ts:53-60`
- Test: `tests/useWebGLAllowed.test.tsx`, `tests/useReducedMotion.test.tsx`, `tests/useSmoothScroll.test.tsx`, `tests/sites.test.tsx`, `e2e/background.spec.ts`

**Interfaces:**
- Produces:
  - `onMotionChange(cb: () => void): () => void` and `REDUCED_MOTION_QUERY` from `lib/motion.ts`.
  - `setMediaMatch(query: string, value: boolean): void` from `test/matchMedia.ts`.

- [ ] **Step 1: Make the test double live.** Replace `test/matchMedia.ts`:

```ts
type Listener = (e: { matches: boolean; media: string }) => void

let state: Record<string, boolean> = {}
const listeners = new Map<string, Set<Listener>>()

/**
 * jsdom has no matchMedia. Every query answers `false` unless listed in
 * `matches`, e.g. installMatchMedia({ '(prefers-reduced-motion: reduce)': true }).
 * `matches` is live, as in a browser, and setMediaMatch() flips one query and
 * tells its listeners, as the OS would.
 */
export function installMatchMedia(matches: Record<string, boolean> = {}) {
  state = { ...matches }
  listeners.clear()
  window.matchMedia = ((query: string) => ({
    get matches() {
      return !!state[query]
    },
    media: query,
    onchange: null,
    addEventListener(_type: string, l: Listener) {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(l)
    },
    removeEventListener(_type: string, l: Listener) {
      listeners.get(query)?.delete(l)
    },
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

export function setMediaMatch(query: string, value: boolean) {
  state[query] = value
  listeners.get(query)?.forEach((l) => l({ matches: value, media: query }))
}
```

In `vitest.setup.ts`, inside the existing `afterEach`, add `installMatchMedia()` right after `cleanup()`, so a query flipped in one test never leaks into the next.

Run `npm test`. Expected: every existing test still passes. If one relied on a leaked query, give it its own `installMatchMedia(...)`.

- [ ] **Step 2: Write the failing tests.** In `tests/useWebGLAllowed.test.tsx`, import `setMediaMatch` and add:

```ts
  it('says no the moment the OS turns on reduced motion, and yes when it goes off', () => {
    const { result } = renderHook(() => useWebGLAllowed())
    expect(result.current).toBe(true)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    expect(result.current).toBe(false)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', false))
    expect(result.current).toBe(true)
  })
```

In `tests/useReducedMotion.test.tsx`, add the same shape for `useReducedMotion` (expecting `false` → `true` → `false`).

In `tests/useSmoothScroll.test.tsx`:
- Hoist `destroy: vi.fn()` next to `ctor`.
- Make the mock's `destroy()` call `lenis.destroy()`.
- Reset both mocks in `beforeEach`.
- Add:

```ts
  it('tears Lenis down the moment the OS turns on reduced motion', async () => {
    installMatchMedia({ [SHELL_MIN_QUERY]: true })
    render(<Harness overflow="auto" />)
    await waitFor(() => expect(lenis.ctor).toHaveBeenCalledOnce())
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    await waitFor(() => expect(lenis.destroy).toHaveBeenCalled())
  })
```

(Import `act` from `@testing-library/react` and `setMediaMatch` from `@/test/matchMedia`.)

In `tests/sites.test.tsx`, in `describe('Funnels and sites: the drum')`, add (import `setMediaMatch`):

```ts
  it('swaps the drum for the grid the moment the OS turns on reduced motion', async () => {
    const view = openSites()
    await within(view).findByTestId('drum')
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    expect(within(view).queryByTestId('drum')).toBeNull()
    expect(within(view).getByRole('list', { name: 'Sample sites' })).toBeInTheDocument()
  })
```

In `e2e/background.spec.ts`:

```ts
test('desktop: turning on reduced motion mid-visit stops the contour', async ({ page }) => {
  await page.goto('/about')
  await expect(page.locator('[data-contour] canvas')).toHaveCount(1, { timeout: 10_000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-contour] canvas')).toHaveCount(0)
})
```

- [ ] **Step 3: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/useWebGLAllowed.test.tsx tests/useReducedMotion.test.tsx tests/useSmoothScroll.test.tsx tests/sites.test.tsx`
  - Expected: FAIL for `useWebGLAllowed`, `useSmoothScroll` and sites. `useReducedMotion` already listens, so its new test passes. It's kept as the guard for the refactor in Step 4.
  - Run: `npx playwright test e2e/background.spec.ts --project=desktop`
  - Expected: FAIL (the count stays 1).

- [ ] **Step 4: Implement.** `lib/motion.ts`:

```ts
import { A11Y_EVENT, motionReduced } from './a11y'

export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/** One answer for "should this move?": the OS setting or the a11y switch. */
export function prefersReducedMotion(): boolean {
  let os = false
  try {
    os = window.matchMedia(REDUCED_MOTION_QUERY).matches
  } catch {
    os = false
  }
  return os || motionReduced()
}

/** Calls `cb` whenever that answer may have changed: the access menu's switch, or the OS setting. Returns the unsubscribe. */
export function onMotionChange(cb: () => void): () => void {
  window.addEventListener(A11Y_EVENT, cb)
  let mq: MediaQueryList | null = null
  try {
    mq = window.matchMedia(REDUCED_MOTION_QUERY)
    mq.addEventListener('change', cb)
  } catch {
    mq = null
  }
  return () => {
    window.removeEventListener(A11Y_EVENT, cb)
    mq?.removeEventListener('change', cb)
  }
}
```

`hooks/useReducedMotion.ts`:
- Delete `QUERY` and `subscribe`, and the `A11Y_EVENT` import.
- Use `useSyncExternalStore(onMotionChange, prefersReducedMotion, () => false)`, importing both from `@/lib/motion`.

`hooks/useWebGLAllowed.ts`: `subscribe` becomes:

```ts
function subscribe(onChange: () => void) {
  const offMotion = onMotionChange(onChange)
  window.addEventListener(PERF_TIER_EVENT, onChange)
  return () => {
    offMotion()
    window.removeEventListener(PERF_TIER_EVENT, onChange)
  }
}
```

(Drop the `A11Y_EVENT` import. Update the doc comment: "Live to the OS setting, the access menu and the perf tier.")

`components/shell/BackgroundGate.tsx`:
- Replace `window.addEventListener(A11Y_EVENT, recheck)` with `const offMotion = onMotionChange(recheck)`.
- Replace its removal with `offMotion()`.
- Import `onMotionChange` from `@/lib/motion` and drop `A11Y_EVENT`.

`hooks/useSmoothScroll.ts`:
- Replace `window.addEventListener(A11Y_EVENT, onChange)` with `const offMotion = onMotionChange(onChange)`.
- Replace its removal with `offMotion()`.
- Swap the import the same way. The doc comment's "or the a11y motion switch" becomes "or the motion setting (OS or access menu)".

- [ ] **Step 5: Run the tests and watch them pass.**
  - Run: `npm test && npm run typecheck && npx playwright test e2e/background.spec.ts e2e/scroll.spec.ts --project=desktop`
  - Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add test/matchMedia.ts vitest.setup.ts lib/motion.ts hooks/useReducedMotion.ts hooks/useWebGLAllowed.ts components/shell/BackgroundGate.tsx hooks/useSmoothScroll.ts tests e2e/background.spec.ts
git commit -m "fix: the contour, smooth scroll and drum follow the OS reduced-motion setting live"
```

---

### Task 8: The drum pauses under the preview; WebGL contexts are released (spec C2, C3)

**Files:**
- Create: `lib/webgl.ts`, `tests/webgl.test.ts`
- Modify: `components/projects/SiteDrum.tsx:8,26-38,233-237,269-274,290-306`, `components/projects/SitesView.tsx:41`, `components/shell/ContourCanvas.tsx:219`
- Test: `tests/sites.test.tsx`

**Interfaces:**
- Produces:
  - `releaseRenderer(r: { dispose(): void; forceContextLoss(): void }): void`.
  - `SiteDrum` prop `paused?: boolean`.

- [ ] **Step 1: Write the failing tests.** Create `tests/webgl.test.ts`:

```ts
import { expect, it } from 'vitest'
import { releaseRenderer } from '@/lib/webgl'

it('frees GPU resources while the context is alive, then drops the context', () => {
  const calls: string[] = []
  releaseRenderer({ dispose: () => calls.push('dispose'), forceContextLoss: () => calls.push('lose') })
  expect(calls).toEqual(['dispose', 'lose'])
})
```

In `tests/sites.test.tsx`:
- Change the mock's props type to include `paused?: boolean`.
- Render `<div data-testid="drum" data-paused={String(!!paused)}>`.
- Add:

```ts
  it('pauses the drum while a preview covers it, and resumes when it closes', async () => {
    const view = openSites()
    fireEvent.click(await within(view).findByText('drum pick'))
    expect(within(view).getByTestId('drum')).toHaveAttribute('data-paused', 'true')
    const preview = screen.getByRole('dialog', { name: 'Apex Build Co. preview' })
    fireEvent.click(within(preview).getByRole('button', { name: projects.sitesView.preview.close }))
    expect(within(view).getByTestId('drum')).toHaveAttribute('data-paused', 'false')
  })
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/webgl.test.ts tests/sites.test.tsx`
  - Expected: FAIL. `lib/webgl` can't be resolved, and `data-paused` is `"false"` while the preview is open.

- [ ] **Step 3: Implement.** Create `lib/webgl.ts`:

```ts
/**
 * Frees a three.js renderer now, not whenever the browser gets round to it:
 * GPU resources go while the context is alive, then the context itself.
 * Browsers cap live WebGL contexts, so an old one lingering can cost the next.
 */
export function releaseRenderer(r: { dispose(): void; forceContextLoss(): void }) {
  r.dispose()
  r.forceContextLoss()
}
```

In `components/shell/ContourCanvas.tsx` and `components/projects/SiteDrum.tsx`, replace `renderer.dispose()` in the cleanup with `releaseRenderer(renderer)`, importing it from `@/lib/webgl`. In both, the `webglcontextlost` listener is removed earlier in the same cleanup, so the forced loss never reaches `onFail`.

In `components/projects/SiteDrum.tsx`:
- `type Props = { sites: Site[]; onOpen: (site: Site) => void; onFail: () => void; paused?: boolean }`
- The signature becomes `SiteDrum({ sites, onOpen, onFail, paused = false }: Props)`.
- After the callback refs:

```ts
  // A preview stacked on top hides the drum: stop drawing it, and pick up where it was when it shows again.
  const pausedRef = useRef(paused)
  const kickRef = useRef<() => void>(() => {})
  useEffect(() => {
    pausedRef.current = paused
    if (!paused) kickRef.current()
  }, [paused])
```

- In `frame`, change the guard to `if (document.hidden || !onScreen || pausedRef.current) {`.
- After `kick` is defined, add `kickRef.current = kick`.
- In the cleanup, add `kickRef.current = () => {}`.
- Update the doc comment's last sentence: "The rendering stops while the view is off screen, the tab is hidden, or a preview covers it."

In `components/projects/SitesView.tsx`, pass `paused={site !== null}` to `<SiteDrum …>`.

- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/webgl.test.ts tests/sites.test.tsx && npm run typecheck && npx playwright test e2e/projects.spec.ts e2e/background.spec.ts --project=desktop`
  - Expected: PASS. The drum e2e still spins, opens a page, and Escape closes only the preview.

- [ ] **Step 5: Commit.**

```bash
git add lib/webgl.ts tests/webgl.test.ts components/projects/SiteDrum.tsx components/projects/SitesView.tsx components/shell/ContourCanvas.tsx tests/sites.test.tsx
git commit -m "fix: the drum stops drawing under the preview, and both WebGL canvases release their context on unmount"
```

---

### Task 9: Board cards and closing a view go through Next's history (spec D2, D3)

**Files:**
- Modify: `components/projects/Board.tsx` (the 7 `<a href="#…">` cards), `lib/hash.ts:28-31`
- Test: `tests/projects.test.tsx`, `tests/hash.test.ts`, `e2e/projects.spec.ts`

- [ ] **Step 1: Write the failing unit tests.** In `tests/hash.test.ts`, inside `describe('pushHash / clearHash')`:

```ts
  it("clears with a fresh state, so Next's patched replaceState updates its own URL too", () => {
    window.history.replaceState({ __NA: true }, '', '/projects#reel')
    const spy = vi.spyOn(window.history, 'replaceState')
    clearHash()
    expect(spy).toHaveBeenCalledWith(null, '', '/projects')
    spy.mockRestore()
  })
```

In `tests/projects.test.tsx`, inside `describe('Board')` (import `vi` from vitest):

```ts
  it('a plain click opens the view through history.pushState, so Next can find the entry again', () => {
    window.history.replaceState(null, '', '/projects')
    const spy = vi.spyOn(window.history, 'pushState')
    render(<Board />)
    fireEvent.click(screen.getByRole('link', { name: /^The build plan/ }))
    expect(spy).toHaveBeenCalledWith(null, '', '#build-plan')
    spy.mockRestore()
  })

  it('a modified click is left to the browser (new tab, new window)', () => {
    const spy = vi.spyOn(window.history, 'pushState')
    render(<Board />)
    fireEvent.click(screen.getByRole('link', { name: /^The build plan/ }), { ctrlKey: true })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
```

- [ ] **Step 2: Write the failing e2e test** in `e2e/projects.spec.ts`:

```ts
const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('Back from another page into Projects shows Projects, not the other page', async ({ page }) => {
  await page.goto('/projects')
  await hydrated(page)
  await page.getByRole('link', { name: /^The build plan/ }).click()
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(view).toBeHidden()
  await sidebarNav(page).getByRole('link', { name: /^About/ }).click()
  await expect(page).toHaveURL(/\/about$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/projects$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Real builds you can open.')
})

test('after closing a view, a router refresh never brings its hash back', async ({ page }) => {
  await page.goto('/projects#build-plan')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'The build plan' })
  await view.getByRole('button', { name: 'Close' }).click()
  await page.evaluate(() => (window as unknown as { next: { router: { refresh(): void } } }).next.router.refresh())
  await page.waitForLoadState('networkidle')
  await expect(page).toHaveURL(/\/projects$/)
  await expect(view).toBeHidden()
})
```

- [ ] **Step 3: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/hash.test.ts tests/projects.test.tsx`
  - Expected: FAIL. `replaceState` got `{ __NA: true }`, and `pushState` was never called.
  - Run: `npx playwright test e2e/projects.spec.ts --project=desktop -g "Back from another page|router refresh"`
  - Expected: "Back from another page" FAILS (the heading is still About's). If "router refresh" passes before the fix, keep it as a regression guard; the unit test is the RED for D3.

- [ ] **Step 4: Implement.** `lib/hash.ts`:

```ts
/**
 * Drops the hash in place, with no new history entry. The state is fresh
 * (null), as in pushHash, so Next's patched replaceState copies its own state
 * in and updates its own record of the URL. Passing Next's state back would
 * mark the call as Next's own, and Next's URL would keep the old hash.
 */
export function clearHash() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}
```

In `components/projects/Board.tsx`:
- Add `import { pushHash } from '@/lib/hash'`. Add `type MouseEvent` to the React import.
- Add above `export default`:

```ts
/**
 * A card is a real #view link, so it can open in a new tab. A plain click goes
 * through pushHash, the history.pushState that Next patches, so the entry
 * carries Next's state and Back from another page lands on Projects again.
 */
function openView(e: MouseEvent<HTMLAnchorElement>) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  pushHash(e.currentTarget.hash.slice(1))
}
```

- Add `onClick={openView}` to each of the seven card `<a>` elements (reel, build plan, the write-ups map, sites, agents).
- Update the component's doc comment: "…and Back closes it. A plain click goes through Next's history (openView)."

- [ ] **Step 5: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/hash.test.ts tests/projects.test.tsx tests/useHashView.test.tsx && npx playwright test e2e/projects.spec.ts e2e/palette.spec.ts --project=desktop`
  - Expected: PASS, including the older "a board card opens its write-up, and Back closes it" and "Escape closes a view and focus returns to its card".

- [ ] **Step 6: Commit.**

```bash
git add lib/hash.ts components/projects/Board.tsx tests/hash.test.ts tests/projects.test.tsx e2e/projects.spec.ts
git commit -m "fix: board cards and closing a view go through Next's history, so Back from another page lands on Projects and no stale hash lingers"
```

---

### Task 10: Back/Forward return to each entry's scroll position; Lenis check (spec D1, C4)

**Files:**
- Create: `lib/scrollMemory.ts`, `tests/scrollMemory.test.ts`, `e2e/history.spec.ts`
- Modify: `lib/storage-keys.ts` (add `SCROLL_KEY`), `lib/scroller.ts` (add `getScrollY`, `scrollToY`), `components/shell/NavigationProvider.tsx:95-102`
- Test: `e2e/scroll.spec.ts`

**Interfaces:**
- Produces:
  - From `lib/scroller.ts`: `getScrollY(): number` and `scrollToY(y: number): void`.
  - From `lib/scrollMemory.ts`:
    - `entryKey(): string`;
    - `saveScroll(key: string, y: number): void`;
    - `savedScroll(key: string): number | null`;
    - `watchScroll(getY: () => number): () => void`;
    - `committed(path: string): number | null`.

- [ ] **Step 1: Write the failing unit tests.** Create `tests/scrollMemory.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Mod = typeof import('@/lib/scrollMemory')
let m: Mod

beforeEach(async () => {
  vi.resetModules()
  sessionStorage.clear()
  window.history.replaceState(null, '', '/about')
  m = await import('@/lib/scrollMemory')
})
afterEach(() => vi.restoreAllMocks())

const pop = (url: string) => {
  window.history.replaceState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

describe('entryKey', () => {
  it('uses the Navigation API entry key where there is one', () => {
    ;(window as unknown as { navigation?: unknown }).navigation = { currentEntry: { key: 'k1' } }
    expect(m.entryKey()).toBe('k1')
    delete (window as unknown as { navigation?: unknown }).navigation
  })
  it('falls back to the path and query', () => {
    window.history.replaceState(null, '', '/about?x=1#reel')
    expect(m.entryKey()).toBe('/about?x=1')
  })
})

describe('Back and Forward', () => {
  it('restores the position saved for the entry it lands on, once', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/about')
    m.saveScroll(m.entryKey(), 640)
    window.history.replaceState(null, '', '/services')
    m.committed('/services')
    pop('/about')
    expect(m.committed('/about')).toBe(640)
    expect(m.committed('/about')).toBeNull()
    stop()
  })

  it('a fresh navigation restores nothing', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/about')
    window.history.replaceState(null, '', '/services')
    expect(m.committed('/services')).toBeNull()
    stop()
  })

  it('a hash-only step (closing a view with Back) restores nothing', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/projects')
    m.saveScroll('/projects', 300)
    pop('/projects')
    expect(m.committed('/projects')).toBeNull()
    stop()
  })

  it('scrolling while the new page swaps in never overwrites the position it will restore', async () => {
    let y = 640
    const stop = m.watchScroll(() => y)
    m.committed('/about')
    m.saveScroll('/about', 640)
    window.history.replaceState(null, '', '/services')
    m.committed('/services')
    pop('/about')
    y = 120 // the shorter page clamps the scroller
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect(m.committed('/about')).toBe(640)
    stop()
  })

  it('keeps working in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => m.saveScroll('/about', 200)).not.toThrow()
    expect(m.savedScroll('/about')).toBe(200)
  })
})
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/scrollMemory.test.ts`
  - Expected: FAIL. `@/lib/scrollMemory` can't be resolved.

- [ ] **Step 3: Implement.** In `lib/storage-keys.ts`, add:

```ts
export const SCROLL_KEY = 'kraft-scroll'
```

In `lib/scroller.ts`, add:

```ts
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
```

Create `lib/scrollMemory.ts`:

```ts
import { SCROLL_KEY } from './storage-keys'

/**
 * Back and Forward return each history entry to where it was scrolled
 * (spec D1). A new navigation still starts at the top (NavigationProvider).
 *
 * An entry is keyed by the Navigation API's entry key where there is one, and
 * by its path and query where not. Positions live in memory, mirrored to
 * sessionStorage so a reload keeps them; blocked storage just means memory.
 * A popstate that changes the path marks its saved position as the one to
 * restore, and scrolling is not recorded until that page has committed: the
 * page swap would otherwise clamp and overwrite it.
 */
const LIMIT = 50
let memory: Record<string, number> = {}
let loaded = false
let committedPath: string | null = null
let pending: number | null = null

function load() {
  if (loaded) return
  loaded = true
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY)
    if (raw) memory = { ...JSON.parse(raw), ...memory }
  } catch {
    // Blocked or corrupt storage: memory only.
  }
}

export function entryKey(): string {
  const nav = (window as Window & { navigation?: { currentEntry?: { key?: string } | null } }).navigation
  return nav?.currentEntry?.key || window.location.pathname + window.location.search
}

export function saveScroll(key: string, y: number) {
  load()
  delete memory[key] // re-insert, so the newest entries survive the cap
  memory[key] = Math.max(0, Math.round(y))
  const keys = Object.keys(memory)
  if (keys.length > LIMIT) delete memory[keys[0]]
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(memory))
  } catch {
    // Memory still has it.
  }
}

export function savedScroll(key: string): number | null {
  load()
  return key in memory ? memory[key] : null
}

/** Records the position of whichever entry is current as the page scrolls. Returns the stop function. */
export function watchScroll(getY: () => number): () => void {
  let raf = 0
  const record = () => {
    raf = 0
    if (pending === null) saveScroll(entryKey(), getY())
  }
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(record)
  }
  const onPop = () => {
    if (window.location.pathname !== committedPath) pending = savedScroll(entryKey()) ?? 0
  }
  const onHide = () => {
    if (pending === null) saveScroll(entryKey(), getY())
  }
  // Scroll events don't bubble; a capturing listener hears the panel's too.
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('popstate', onPop)
  window.addEventListener('pagehide', onHide)
  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('pagehide', onHide)
  }
}

/** The page for `path` has committed. Returns the position to restore after Back or Forward, or null for a fresh navigation. */
export function committed(path: string): number | null {
  committedPath = path
  const y = pending
  pending = null
  return y
}
```

In `components/shell/NavigationProvider.tsx`:
- Import `committed, watchScroll` from `@/lib/scrollMemory`, and `getScrollY, scrollToY` from `@/lib/scroller`.
- Add, before the pathname effect: `useEffect(() => watchScroll(getScrollY), [])`
- In the pathname effect, replace the last three lines (`scrollToTop…`, the comment, `scrollToSection…`) with:

```ts
    // Back or Forward: where that entry was. Anything else: the top, or a ⌘K section.
    const restore = committed(pathname)
    if (restore !== null) {
      scrollToY(restore)
      return
    }
    scrollToTop({ smooth: false })
    // A ⌘K section on another page lands on the section, not the top.
    scrollToSection(currentHash(), { smooth: false })
```

- Update the provider's top doc comment: "…the scroll resets while nothing is visible (or, after Back/Forward, returns to where that entry was: lib/scrollMemory.ts)…"

- [ ] **Step 4: Run the unit tests and watch them pass.**
  - Run: `npx vitest run tests/scrollMemory.test.ts tests/NavigationProvider.test.tsx tests/NavigationProvider.hash.test.tsx`
  - Expected: PASS.

- [ ] **Step 5: Write the e2e tests.** Create `e2e/history.spec.ts`:

```ts
import { expect, test } from '@playwright/test'
import { hydrated } from './helpers'

const sidebarNav = (page: import('@playwright/test').Page) =>
  page.getByRole('complementary', { name: 'Profile and site navigation' }).getByRole('navigation', { name: 'Sections' })

test('Back and Forward return each page to where it was scrolled', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  const panel = page.locator('#main-content')
  const y = () => panel.evaluate((el) => el.scrollTop)
  const settled = async () => {
    await expect
      .poll(async () => {
        const a = await y()
        await page.waitForTimeout(150)
        return (await y()) - a
      })
      .toBe(0)
    return y()
  }
  await page.mouse.move(900, 450)
  await expect
    .poll(async () => {
      await page.mouse.wheel(0, 400)
      return y()
    })
    .toBeGreaterThan(500)
  const aboutY = await settled()

  await sidebarNav(page).getByRole('link', { name: /^Services/ }).click()
  await expect(page).toHaveURL(/\/services$/)
  await expect.poll(y).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/about$/)
  await expect.poll(async () => Math.abs((await y()) - aboutY)).toBeLessThan(3)

  await page.goForward()
  await expect(page).toHaveURL(/\/services$/)
  await expect.poll(y).toBe(0)
})
```

In `e2e/scroll.spec.ts` (spec C4), add `hydrated` to the helpers import, and:

```ts
test('after moving from one page to a longer one, the wheel reaches the very bottom', async ({ page }) => {
  await page.goto('/testimonials')
  await hydrated(page)
  await page
    .getByRole('complementary', { name: 'Profile and site navigation' })
    .getByRole('navigation', { name: 'Sections' })
    .getByRole('link', { name: /^Projects/ })
    .click()
  await expect(page).toHaveURL(/\/projects$/)
  const panel = page.locator('#main-content')
  await page.mouse.move(900, 450)
  await expect
    .poll(
      async () => {
        await page.mouse.wheel(0, 2000)
        return panel.evaluate((el) => el.scrollHeight - el.clientHeight - el.scrollTop)
      },
      { timeout: 10_000 },
    )
    .toBeLessThan(2)
})
```

- [ ] **Step 6: Run the e2e tests.**
  - Run: `npx playwright test e2e/history.spec.ts e2e/scroll.spec.ts e2e/shell.spec.ts e2e/palette.spec.ts --project=desktop && npx playwright test --project=phone`
  - Expected: PASS.
  - To prove the history test bites, stash the NavigationProvider change (`git stash push components/shell/NavigationProvider.tsx`) and rerun `history.spec.ts`: it must FAIL at the goBack check. Then `git stash pop`.
  - If the Lenis check FAILS, Lenis did not re-measure. Register a `resize()` on the Lenis handle in `lib/scroller.ts` and call it at the start of the pathname effect. Record that as a ruling.

- [ ] **Step 7: Commit.**

```bash
git add lib/storage-keys.ts lib/scroller.ts lib/scrollMemory.ts components/shell/NavigationProvider.tsx tests/scrollMemory.test.ts e2e/history.spec.ts e2e/scroll.spec.ts
git commit -m "feat: Back and Forward return each page to where it was scrolled; confirm Lenis re-measures after a route change"
```

---

### Task 11: A stacked view's focus fallback is the view underneath (spec D4)

**Files:**
- Modify: `components/ui/ViewDialog.tsx:65-73`
- Test: `tests/ViewDialog.test.tsx`

- [ ] **Step 1: Write the failing test** in `tests/ViewDialog.test.tsx`:

```tsx
  it('with nothing to go back to, a stacked view hands focus to the view under it, not the page behind', () => {
    const ui = (top: boolean) => (
      <main id="main-content" tabIndex={-1}>
        <ViewDialog open onClose={onClose} label="Sites">
          <button type="button">Under</button>
        </ViewDialog>
        <ViewDialog open={top} onClose={onClose} label="Preview">
          <p>Top</p>
        </ViewDialog>
      </main>
    )
    const { rerender } = render(ui(false))
    ;(document.activeElement as HTMLElement | null)?.blur()
    rerender(ui(true))
    rerender(ui(false))
    expect(screen.getByRole('button', { name: 'Under' })).toHaveFocus()
  })
```

- [ ] **Step 2: Run it and watch it fail.**
  - Run: `npx vitest run tests/ViewDialog.test.tsx`
  - Expected: FAIL. `<main>` has focus.

- [ ] **Step 3: Implement.** In `components/ui/ViewDialog.tsx`, add below `isBackdrop`:

```ts
const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Nothing to return focus to (a ⌘K pick made with nothing focused). The view
 * still open underneath gets it, if there is one; the page behind it is inert.
 * Otherwise the page itself does.
 */
function focusFallback() {
  const under = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog.view[open]')).pop()
  const target = under ? (under.querySelector<HTMLElement>(FOCUSABLE) ?? under) : document.getElementById(PANEL_ID)
  target?.focus({ preventScroll: true })
}
```

In `onClose`, replace the comment and the `else` line with:

```ts
        if (back && back.isConnected && back !== document.body) back.focus()
        else focusFallback()
```

- [ ] **Step 4: Run the tests and watch them pass.**
  - Run: `npx vitest run tests/ViewDialog.test.tsx tests/sites.test.tsx tests/CommandPalette.focus.test.tsx`
  - Expected: PASS, including `'with nothing focused to go back to, returns focus to the page, not the body'`.

- [ ] **Step 5: Commit.**

```bash
git add components/ui/ViewDialog.tsx tests/ViewDialog.test.tsx
git commit -m "fix: with nothing to return to, a closing stacked view hands focus to the view under it"
```

---

### Task 12: Copy into `data/`; the Node version (spec D6, D7)

This is a refactor, so there is no new behaviour to go RED on. The existing tests must stay green, and one new test pins that the copy comes from `data/`.

**Files:**
- Modify:
  - `data/nav.ts` (add `shellCopy`), `data/profile.ts` (add `studio`), `data/showcase.ts` (`Row.state` ids, plus `mockStates`)
  - `app/(site)/layout.tsx:24-26`, `components/plain/PlainShell.tsx:17-19`, `components/shell/LegalLinks.tsx:7`
  - `lib/jsonld.ts:15`, `lib/seo.ts:5-6,20`, `lib/share-meta.ts`, `app/layout.tsx:17`
  - `components/showcase/Mock.tsx:13,222`
  - `package.json` (`engines.node`)
- Test: `tests/plain.test.tsx`, `tests/showcase.test.tsx`

**Interfaces:**
- Produces:
  - `shellCopy = { skipLink: string; legalNav: string }` from `data/nav.ts`;
  - `profile.studio = 'Kraft'`;
  - `showcase.mockStates: Record<'applied' | 'saved' | 'new', string>`.

- [ ] **Step 1: Write the pinning tests.** In `tests/plain.test.tsx`, add `import { shellCopy } from '@/data/nav'` and a test that renders `PlainShell` (as the file already does) and checks:

```ts
    expect(screen.getByRole('link', { name: shellCopy.skipLink })).toHaveAttribute('href', '#plain-main')
    expect(screen.getByRole('navigation', { name: shellCopy.legalNav })).toBeInTheDocument()
```

In `tests/showcase.test.tsx`, add a test that renders `<Mock tab={TABS.find((t) => t.id === 'listings')!} />` (import `Mock` from `@/components/showcase/Mock`) and checks:

```ts
    expect(screen.getAllByText(showcase.mockStates.applied).length).toBeGreaterThan(0)
```

- [ ] **Step 2: Run the tests and watch them fail.**
  - Run: `npx vitest run tests/plain.test.tsx tests/showcase.test.tsx`
  - Expected: FAIL. `shellCopy` and `mockStates` are undefined.

- [ ] **Step 3: Implement.** `data/nav.ts`, appended:

```ts
/** Shell copy that isn't a nav item: the skip link and the legal links' landmark name. */
export const shellCopy = { skipLink: 'Skip to main content', legalNav: 'Legal' }
```

Use it in:
- `app/(site)/layout.tsx`: `{shellCopy.skipLink}`;
- `components/plain/PlainShell.tsx`: the same;
- `components/shell/LegalLinks.tsx`: `aria-label={shellCopy.legalNav}`.

In `data/profile.ts`, add `studio: 'Kraft',` after `brand`. Then:
- `lib/jsonld.ts`: `worksFor: { '@type': 'Organization', name: profile.studio }`.
- `lib/seo.ts`: `SITE_NAME = \`${profile.name} · ${profile.studio}\``, `OG_BASE = { siteName: profile.studio, … }`, and `` `${name} · ${profile.studio}` ``. Import `profile`.
- `app/layout.tsx`: `template: \`%s · ${profile.studio}\``. Import `profile` if it isn't already.
- `lib/share-meta.ts`: `` `${profile.name} · ${profile.studio}: …` ``.

In `data/showcase.ts`:
- The `Row` type becomes `state: 'applied' | 'saved' | 'new'`.
- The six rows change `'Applied'` → `'applied'`, `'Saved'` → `'saved'` and `'New'` → `'new'`.
- Add to `showcase`:

```ts
  /** The listing rows' status pills in the product mock. */
  mockStates: { applied: 'Applied', saved: 'Saved', new: 'New' },
```

In `components/showcase/Mock.tsx`:
- `const STATE = { applied: 'bg-wash text-accent', saved: 'bg-chip text-ink3', new: 'bg-accent text-on-accent' } as const`
- The pill's text becomes `{showcase.mockStates[r.state]}`. Import `showcase` if it isn't already.

In `package.json`, set `"node": ">=22.18.0"`. `npm run placeholders` runs a `.ts` file natively, which needs 22.18 or newer.

- [ ] **Step 4: Run the whole suite.**
  - Run: `npm test && npm run typecheck && npm run lint && npm run placeholders | tail -1`
  - Expected: PASS. The seo tests still see `'Projects · Kraft'` and `siteName: 'Kraft'`. The placeholders script prints its total.

- [ ] **Step 5: Commit.**

```bash
git add data app components lib package.json tests/plain.test.tsx tests/showcase.test.tsx
git commit -m "chore: the last hard-coded copy moves into data/, and engines asks for the Node the placeholder script needs"
```

---

### Task 13: Largest-text coverage on every page, at 1440px and 320px (spec D8)

**Files:**
- Create: `e2e/largest-text.spec.ts`

- [ ] **Step 1: Write the tests.**

```ts
import { expect, test } from '@playwright/test'
import { settleIntro } from './helpers'

const ROUTES = ['/', '/projects', '/showcase', '/services', '/testimonials', '/about', '/contact', '/privacy', '/terms', '/thank-you', '/no-such-page']

// The boot script applies the saved choice before first paint, as for a returning visitor.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('kraft-a11y', JSON.stringify({ text: 'xl' }))
    } catch {
      // Storage blocked: the test below then fails on data-a11y-text, loudly.
    }
  })
})

for (const width of [1440, 320]) {
  test(`largest text at ${width}px: every page fits and shows its heading`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const r of ROUTES) {
      await page.goto(r)
      await settleIntro(page)
      await expect(page.locator('html'), r).toHaveAttribute('data-a11y-text', 'xl')
      await expect(page.getByRole('heading', { level: 1 }), r).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, r).toBeLessThanOrEqual(0)
    }
  })
}
```

- [ ] **Step 2: Run the tests.**
  - Run: `npx playwright test e2e/largest-text.spec.ts --project=desktop`
  - Expected: PASS.
  - If a route overflows, find the widest element with `page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth).map(e => e.className).slice(0, 5))`. Fix it in that component with `min-w-0`, `flex-wrap` or `break-words`, and record the fix as a ruling. Don't loosen the test.

- [ ] **Step 3: Commit.**

```bash
git add e2e/largest-text.spec.ts
git commit -m "test: the largest text on every page, the 404 included, at 1440px and 320px"
```

---

### Task 14: Full verification and the screenshot pass

- [ ] **Step 1: Everything.**
  - Run: `npm run typecheck && npm run lint && npm test && npm run e2e`
  - Expected: all green. Record the counts; they were 281 unit and 84 e2e before this plan.

- [ ] **Step 2: Screenshots.**
  - Run: `npm run shots`.
  - Check each item in both themes:
    - desktop pages: no top bar, and the content starts below a `--deskpad` margin;
    - the build-plan and preview windows have their margin;
    - `/opengraph-image` shows a bold headline.
  - Also, by hand at A++ on a 560px-tall window, the access panel sits beside or below its button and scrolls.

- [ ] **Step 3: Commit any screenshot-baseline updates the shots script writes (if it tracks any), then hand over to the final review.**
