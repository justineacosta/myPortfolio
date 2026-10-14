# San Fernando Case Study Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A full-width REAL CLIENT banner on the Projects board that opens a short Barangay San Fernando case study in Kraft's document window, at `/projects#san-fernando`.

**Architecture:** The text lives in `data/projects.ts` as `projects.caseStudy`. A new `CaseStudyView` renders it inside the existing `Window`, `ProjectViews` mounts it like every other view, and a new `CaseStudyCard` is the board's first row. ⌘K and Lumen read the same data.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-san-fernando-case-study-design.md`

## Global Constraints

- The problem and solution are ported verbatim from myPortfolioV3 (`E:/GitHub/myPortfolioV3/src/data/projects.ts`, slug `barangay-san-fernando-citizen-portal`). The six features are the spec's §4 list, verbatim. Don't copy any UI from either site.
- `sanfernandoweb/` is reference only. Never stage anything from it.
- No screenshots, no live-site link, no engineering deep-dive, no Dominic quote, nothing from SanFernandoWeb's `proposal/`.
- `BUILDS` (Home's fan) and the Projects `title`/`lede` stay unchanged.
- The view id is exactly `'san-fernando'`.
- No new dependencies.

## Review Focus

1. **Contact switched off** (`hidden: true` on `/contact` in `NAV`): the view must not link to a 404. Tested in Task 2.
2. **Phone width (390px):** the banner stacks to one column with no sideways scroll. Tested in Task 5's phone e2e.
3. **Opened from a shared link** (`/projects#san-fernando` loaded cold): the view opens, and Close leaves `/projects`. Tested in Task 5.
4. **The card's logo stack:** `LogoStack` draws every logo it gets, and eight overlapping chips would overflow. The card passes only the first three. Tested in Task 3.
5. **Lumen keeps samples and the client apart:** the prompt must still call the samples fictional, and must name San Fernando as the real client. Tested in Task 4.

---

### Task 0: Ignore the local `sanfernandoweb/` copy

**Files:**
- Modify: `.gitignore`, `tsconfig.json` (`exclude`), `eslint.config.mjs` (`globalIgnores`)

- [ ] **Step 1: Add the entries**, each with a one-line comment like `ce67e1b`'s: `sanfernandoweb/` in `.gitignore`, `"sanfernandoweb"` in `exclude`, and `'sanfernandoweb/**'` in `globalIgnores`.
- [ ] **Step 2: Verify.** Run `git status --short --ignored sanfernandoweb`. Expected: only `!! sanfernandoweb/`, with nothing untracked. Then run `npm run typecheck && npm run lint`, which should pass without reading the folder.
- [ ] **Step 3: Commit** `chore: ignore the local sanfernandoweb copy in git, tsc and eslint`

---

### Task 1: The case study's data and Resend's logo

**Files:**
- Modify: `data/projects.ts` (add a `CASE_STUDY` const near `WRITEUPS`, and expose it as `projects.caseStudy`)
- Modify: `scripts/brand-icons.mjs` (`BRANDS`: add `resend: 'A3AAB2'`)
- Create: `public/icons/brands/resend.svg` (by running the script)
- Test: `tests/projects.test.tsx`

**Interfaces:**
- Produces: `projects.caseStudy` with this shape (all strings):
  `{ view: 'san-fernando'; kicker; title; cardTitle; tagline; seal: { src; alt }; body; problemLabel; problem; solutionLabel; solution; featuresLabel; features: string[]; stack: Brand[]; cue; contact: { label; href } }`

- [ ] **Step 1: Write the failing test** in `describe('Projects data')`:

```tsx
it('carries the San Fernando case study: V3’s problem and solution, the real site’s six features, every logo on disk', () => {
  const s = projects.caseStudy
  expect(s).toMatchObject({
    view: 'san-fernando',
    kicker: 'REAL CLIENT · CITIZEN PORTAL',
    title: 'Barangay San Fernando - Government Citizen Portal',
    cardTitle: 'Barangay San Fernando',
    tagline: 'A progressive community, a better tomorrow.',
    seal: { src: '/assets/testimonial-san-fernando-seal.png', alt: 'Barangay San Fernando seal' },
    body: 'A citizen-facing portal for a local barangay government, built to move routine transactions off the counter and online.',
    problemLabel: 'The problem', solutionLabel: 'What I built', featuresLabel: 'Features',
    cue: 'READ THE CASE STUDY',
    contact: { label: 'Start a project', href: '/contact' },
  })
  expect(s.problem).toMatch(/^Every routine barangay transaction/)
  expect(s.solution).toMatch(/^A citizen-facing portal that moves those transactions online\./)
  expect(s.features).toEqual([
    'Four request flows residents file online: applications, appointments, complaints and assistance.',
    'Tracking by reference number and surname, with a timeline of every step, and a way to reply when staff need more information.',
    'Email receipts and outcome notices at every step, from submission to resolution.',
    'News, notices, an events calendar, the officials directory, and a transparency section with legislative and disclosure documents.',
    'A staff portal with five ticket queues, and a draft-to-published workflow for every kind of content.',
    'Role-based staff access, an audit log of every change, and bot and rate-limit protection on every public form.',
  ])
  expect(s.stack.map((b) => b.name)).toEqual(['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'Resend', 'Cloudflare'])
  for (const b of s.stack) expect(existsSync(`public/icons/brands/${b.slug}.svg`), b.slug).toBe(true)
  expect(existsSync(`public${s.seal.src}`)).toBe(true)
})
```

- [ ] **Step 2: Run it and check that it fails**

Run: `npx vitest run tests/projects.test.tsx -t "San Fernando"`
Expected: FAIL, because `projects.caseStudy` is undefined.

- [ ] **Step 3: Add `resend: 'A3AAB2'` to `BRANDS` and run `node scripts/brand-icons.mjs`.** Expected: `public/icons/brands/resend.svg` exists, and no other icon file changes (`git status` shows only the new file).

- [ ] **Step 4: Add `CASE_STUDY`.** Copy `problem` and `solution` exactly from V3, including the em dashes. `features` is the six strings in the test above. Write `stack` with the file's `logos(...)` helper, using slugs `nextdotjs, react, typescript, tailwindcss, supabase, postgresql, resend, cloudflare`. Give it a doc comment naming its source, the way the file's other consts do. Expose it as `caseStudy: CASE_STUDY` in `projects`.

- [ ] **Step 5: Run the test and check that it passes**

Run: `npx vitest run tests/projects.test.tsx`
Expected: PASS (the whole file).

- [ ] **Step 6: Commit** `feat(projects): the San Fernando case study's content, and Resend's logo`

---

### Task 2: The view in the document window

**Files:**
- Create: `components/projects/CaseStudyView.tsx`
- Modify: `data/projects.ts` (`PROJECT_VIEWS`: put `'san-fernando'` first)
- Modify: `components/projects/ProjectViews.tsx` (mount `<CaseStudyView open={view === 'san-fernando'} onClose={close} />`)
- Modify: `lib/chat/pages.ts` (`VIEWS`: add `'san-fernando': { title: caseStudy.title, body: caseStudy.body }`)
- Test: `tests/projects.test.tsx`

**Interfaces:**
- Consumes: `projects.caseStudy` (Task 1), and `Window` (`{ open, onClose, title, children }`, used without `href` or `flush`)
- Produces: `export default function CaseStudyView({ open, onClose }: { open: boolean; onClose: () => void })`

- [ ] **Step 1: Write the failing tests** in `describe('ProjectViews')`:

```tsx
it('opens the San Fernando case study from its hash, with every ported line and a way to start a project', () => {
  window.history.replaceState(null, '', '/projects#san-fernando')
  render(<ProjectViews />)
  const s = projects.caseStudy
  const view = screen.getByRole('dialog', { name: s.title })
  for (const text of [s.kicker, s.tagline, s.problem, s.solution, ...s.features, ...s.stack.map((b) => b.name)]) {
    expect(view).toHaveTextContent(text)
  }
  expect(within(view).getByRole('heading', { name: s.problemLabel })).toBeInTheDocument()
  expect(within(view).getByRole('img', { name: s.seal.alt })).toBeInTheDocument()
  expect(within(view).getByRole('link', { name: s.contact.label })).toHaveAttribute('href', '/contact')
})

it('drops the case study’s contact link while Contact is switched off', () => {
  const item = NAV.find((n) => n.href === '/contact')!
  item.hidden = true
  try {
    window.history.replaceState(null, '', '/projects#san-fernando')
    render(<ProjectViews />)
    expect(screen.queryByRole('link', { name: projects.caseStudy.contact.label })).toBeNull()
  } finally {
    item.hidden = false
  }
})
```

(Import `NAV` from `@/data/nav`. The existing `pre-renders every view, closed` test needs no change, because it counts `PROJECT_VIEWS.length + 1`.)

- [ ] **Step 2: Run them and check that they fail**

Run: `npx vitest run tests/projects.test.tsx -t "case study"`
Expected: FAIL, with no dialog named after the title.

- [ ] **Step 3: Implement `CaseStudyView`** in the order from the spec (§5.2): the seal (`next/image`, 56px), kicker, `h2` title, tagline; then the stack as chips (`next/image` logo plus name, the same pill classes as the AI agents card's counts in `Board.tsx`); then `h3` + `p` for the problem and the solution; then `h3` + `ul` for the features; then the contact link, rendered only when `!isHidden(s.contact.href)`, styled with the board's `CTA`. Use `TITLE`/`BODY` from `./styles`.

- [ ] **Step 4: Add `'san-fernando'` to `PROJECT_VIEWS`, mount the view, and add the `VIEWS` entry in `lib/chat/pages.ts`.**

- [ ] **Step 5: Run the tests and check that they pass**

Run: `npx vitest run tests/projects.test.tsx tests/commands.test.ts tests/chat-embed.test.tsx && npm run typecheck`
Expected: PASS. (`commands.test.ts`'s "point every Projects entry at a real sub-view" still holds.)

- [ ] **Step 6: Commit** `feat(projects): the San Fernando case study opens in the document window`

---

### Task 3: The banner card

**Files:**
- Create: `components/projects/CaseStudyCard.tsx`
- Modify: `components/projects/Board.tsx` (export `openView`, and render `<CaseStudyCard onOpen={openView} />` as the first child inside the `Frame`, before the two `flex-wrap` rows; it inherits the frame's `GAP`)
- Test: `tests/projects.test.tsx`

**Interfaces:**
- Consumes: `projects.caseStudy`, `LogoStack` (`{ logos: Brand[]; size? }`), and `CARD`/`TITLE`/`BODY`/`CTA` from `./styles`
- Produces: `export default function CaseStudyCard({ onOpen }: { onOpen: (e: MouseEvent<HTMLAnchorElement>) => void })`. This is the same prop shape as `SitesCard`.

- [ ] **Step 1: Write the failing test** in the Board `describe`:

```tsx
it('leads the board with the San Fernando banner, a link to its view with three logos and its cue', () => {
  render(<Board />)
  const s = projects.caseStudy
  const card = screen.getByRole('link', { name: new RegExp(`^${s.kicker}`) })
  expect(card).toHaveAttribute('href', '#san-fernando')
  expect(card).toHaveAttribute('data-case', s.cue)
  expect(card).toHaveTextContent(s.cardTitle)
  expect(card).toHaveTextContent(s.body)
  expect(card.querySelectorAll('[data-logo-stack] img')).toHaveLength(3)
  // First on the board, ahead of every other card.
  expect(screen.getAllByRole('link')[0]).toBe(card)
})
```

- [ ] **Step 2: Run it and check that it fails**

Run: `npx vitest run tests/projects.test.tsx -t "banner"`
Expected: FAIL, with no link matching the kicker.

- [ ] **Step 3: Implement `CaseStudyCard`:** an `<a href="#san-fernando" onClick={onOpen} data-case={s.cue}>` with `CARD` plus `w-full`. Inside, a row (`flex-col` below `sm`, `sm:flex-row`) holds the seal (decorative `alt=""`, since the link already names the card), then a column with the kicker (accent mono, like the write-ups' kicker), `h2` `cardTitle` in `TITLE`, and `p` body in `BODY`. Then `LogoStack logos={s.stack.slice(0, 3)}`, and `CTA` with `s.cue` and `ArrowUpRightIcon`. The kicker comes first in the DOM, so the link's accessible name starts with it.

- [ ] **Step 4: Run the tests and check that they pass**

Run: `npx vitest run tests/projects.test.tsx tests/hide-pages.test.tsx`
Expected: PASS. The existing "gives every board card at least three brand logos" test still passes, and `openView` behaves the same.

- [ ] **Step 5: Commit** `feat(projects): a REAL CLIENT banner leads the board`

---

### Task 4: ⌘K and Lumen

**Files:**
- Modify: `lib/commands.ts` (`SECTIONS`: `view('san-fernando', projects.caseStudy.cardTitle, projects.caseStudy.stack)` first)
- Modify: `lib/chat/pages.ts` (`BASE['/projects']`: put the case study's `cardTitle` first in the card list)
- Modify: `lib/chat/prompt.ts` (a new `# Real client work` section, placed before `# What's on the Projects page`)
- Test: `tests/commands.test.ts`, `tests/chat-prompt.test.ts`

**Interfaces:**
- Consumes: `projects.caseStudy` (Task 1); the `'san-fernando'` view (Task 2)

- [ ] **Step 1: Write the failing tests**

```ts
// tests/commands.test.ts
it('finds the San Fernando case study, led by its first logo', () => {
  const hit = commands.find((c) => c.href === '/projects#san-fernando')!
  expect(hit).toMatchObject({ label: 'Barangay San Fernando', logo: 'nextdotjs' })
  expect(filterCommands('san fernando').map((c) => c.href)).toContain('/projects#san-fernando')
})

// tests/chat-prompt.test.ts
it('names San Fernando as real client work, links its case study, and still calls the samples fictional', () => {
  expect(SYSTEM).toContain('# Real client work')
  expect(SYSTEM).toContain(projects.caseStudy.title)
  expect(SYSTEM).toContain('/projects#san-fernando')
  expect(SYSTEM).toContain('They are samples, never clients.')
})
```

(Use the names each file already imports. If `filterCommands` or `SYSTEM` are named differently there, use the file's own export and don't add a new one.)

- [ ] **Step 2: Run them and check that they fail**

Run: `npx vitest run tests/commands.test.ts tests/chat-prompt.test.ts`
Expected: FAIL in the two new tests only.

- [ ] **Step 3: Implement.** The prompt section reads, using values from `projects.caseStudy`:

```
# Real client work
${first}'s real, shipped client work, as opposed to the fictional samples below:
- **${s.title}** ([case study](/projects#${s.view})): ${s.body} ${s.solution}
Built with ${s.stack.map((b) => b.name).join(', ')}.
```

- [ ] **Step 4: Run them and check that they pass**

Run: `npx vitest run tests/commands.test.ts tests/chat-prompt.test.ts tests/chat-local.test.ts tests/CommandPalette.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit** `feat(chat,palette): ⌘K and Lumen know the San Fernando case study`

---

### Task 5: Browser tests and full verification

**Files:**
- Modify: `e2e/projects.spec.ts`, `e2e/palette.spec.ts`

- [ ] **Step 1: Write the e2e tests**

```ts
// e2e/projects.spec.ts
test('the San Fernando banner opens its case study; Escape closes it and focus returns', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto('/projects')
  await hydrated(page)
  const card = page.getByRole('link', { name: /^REAL CLIENT/ })
  const box = (await card.boundingBox())!
  expect(box.width).toBeLessThanOrEqual(page.viewportSize()!.width)
  await card.click()
  await expect(page).toHaveURL(/\/projects#san-fernando$/)
  const view = page.getByRole('dialog', { name: 'Barangay San Fernando - Government Citizen Portal' })
  await expect(view.getByRole('heading', { name: 'The problem' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(view).toBeHidden()
  await expect(card).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
})

test('a shared San Fernando link opens the case study; Close stays on Projects', async ({ page }) => {
  await page.goto('/projects#san-fernando')
  await hydrated(page)
  const view = page.getByRole('dialog', { name: 'Barangay San Fernando - Government Citizen Portal' })
  await expect(view).toBeVisible()
  await view.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(/\/projects$/)
})

// e2e/palette.spec.ts
test('⌘K finds the San Fernando case study from another page', async ({ page }) => {
  await page.goto('/about')
  await hydrated(page)
  await page.keyboard.press('Control+k')
  await page.keyboard.type('san fernando')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects#san-fernando$/)
  await expect(page.getByRole('dialog', { name: 'Barangay San Fernando - Government Citizen Portal' })).toBeVisible()
})
```

- [ ] **Step 2: Run them**

Run: `npx playwright test e2e/projects.spec.ts e2e/palette.spec.ts`
Expected: PASS on both the desktop and phone projects.

- [ ] **Step 3: Full verification**

Run: `npm run typecheck && npm run lint && npm test && npm run e2e`
Expected: everything passes. If a test times out under load, rerun it with `npx playwright test --last-failed --workers=2` before treating it as a real failure.

- [ ] **Step 4: Look at it.** Open `/projects` at 1400px and at 390px, in light and dark themes, and check that the banner and the open view match the board's look.

- [ ] **Step 5: Commit** `test(projects): the San Fernando case study in the browser`
