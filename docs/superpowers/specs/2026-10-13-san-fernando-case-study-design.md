# Barangay San Fernando case study: design

**Date:** 2026-10-13
**Status:** Design approved 2026-10-13 in chat; spec awaiting review
**Source:** the old portfolio (the myPortfolioV3 repo, `src/data/projects.ts`, slug `barangay-san-fernando-citizen-portal`). Content only: the Kraft UI stays as it is (see the port-content-not-design rule).

## 1. Goal

The Projects board shows one real client build next to the samples. Today every card on `/projects` is a sample, and the only real client, Barangay San Fernando, sits in the hidden Testimonials data. A banner card opens a short case study in the document window.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
| --- | --- |
| Where it lives | A card on the Projects board that opens a view in place, `/projects#san-fernando` |
| What it shows | Problem, what I built, features and the stack, ported verbatim from myPortfolioV3 |
| How it is built | A React view in Kraft's document `Window`, from a data file. No generator script, no iframe. |
| The card | A full-width banner, its own row above the board's two rows, marked REAL CLIENT |
| Lumen | Learns the case study, so it can say real client work has shipped and link to it |

## 3. Out of scope

- No screenshots and no link to the live site.
- No engineering deep-dive (RBAC, Turnstile, rate limits, tests, commit count).
- No quote or photo of Dominic Dela Cruz. Testimonials stays hidden and unchanged.
- Nothing from SanFernandoWeb's `proposal/` folder (quotations, agreement, valuation).
- No place in Home's Projects fan (`BUILDS`): the fan needs a screenshot, and there is none. Home is unchanged.
- The Projects title and lede stay as they are.

## 4. Content (`data/projects.ts`, `projects.caseStudy`)

Verbatim from myPortfolioV3 unless marked new. `PLACEHOLDER` strings are not allowed here: every field below has its final text.

| Field | Text |
| --- | --- |
| `view` | `'san-fernando'` (added to `PROJECT_VIEWS`, so it is also the hash) |
| `kicker` (new) | `REAL CLIENT · CITIZEN PORTAL` |
| `title` | `Barangay San Fernando - Government Citizen Portal` |
| `cardTitle` (new) | `Barangay San Fernando` |
| `tagline` | `A progressive community, a better tomorrow.` |
| `seal` | `/assets/testimonial-san-fernando-seal.png` (already in `public/`) with alt `Barangay San Fernando seal` |
| `body` (card) | V3's `description` first sentence: `A citizen-facing portal for a local barangay government, built to move routine transactions off the counter and online.` |
| `problemLabel` / `problem` | `The problem` / V3's `problem` |
| `solutionLabel` / `solution` | `What I built` / V3's `solution` |
| `featuresLabel` / `features` | `Features` / V3's five `features` |
| `stack` | `logos(...)` of V3's `tech`: Next.js, React, TypeScript, Tailwind CSS, Supabase, PostgreSQL, Resend, Cloudflare |
| `cue` / `cta` (new) | `READ THE CASE STUDY` (the board's pointer label and the card's call to action) |
| `contact` (new) | `Start a project` → `/contact`. Left out when Contact is hidden (`isHidden`). |

Resend's logo is missing from `public/icons/brands/`. It is added the way the others were: a `resend` line in `scripts/brand-icons.mjs`'s `BRANDS` (with the same neutral grey `nextdotjs` and `vercel` use, since Resend's mark is black), then `node scripts/brand-icons.mjs`.

## 5. Components

### 5.1 The banner card (`components/projects/CaseStudyCard.tsx`)

A real `#san-fernando` link with `openView` and `data-case={cue}`, like every board card, so it opens in place, in a new tab, from the keyboard, and shows the pointer label. It sits in its own row, first inside the board's `Frame`, at full width, and uses the board's `CARD`, `TITLE`, `BODY` and `CTA` styles. Layout: the seal at the left, then the kicker, card title and body, the stack as `LogoStack`, and the call to action. It is a single column on phones.

### 5.2 The view (`components/projects/CaseStudyView.tsx`)

`Window` without `flush` and without `href`, so the address field shows the title and the body scrolls. From top to bottom:

1. The seal, kicker, title and tagline.
2. The stack as name-and-logo chips (the `Chip` style the AI agents card uses).
3. `The problem`, then `What I built`, each a heading and a paragraph.
4. `Features` as a list.
5. `Start a project`, linking to `/contact` (§4).

`ProjectViews` mounts it closed, so its text is in the pre-rendered HTML.

### 5.3 Wiring

- **⌘K:** `lib/commands.ts` adds `view('san-fernando', cardTitle, stack)` first among the Projects views.
- **Lumen:** `lib/chat/pages.ts` lists the card in `/projects`'s summary and adds a `san-fernando` view entry with the title and card body. `lib/chat/prompt.ts` tells Lumen that this is Justine's real client work (a live government portal), as opposed to the samples, and links to `/projects#san-fernando`. `KNOWN_PATHS` needs no change, because reply links are checked on their path before the `#`, and `/projects` is already known. The keyless fallback (`lib/chat/local.ts`) is unchanged.
- **Analytics:** none needed. `Project opened { view: 'san-fernando' }` fires from `ProjectViews`.

## 6. Testing

- **Unit:** the view renders every ported string from `data/projects.ts` and the contact link; the card is a link to `#san-fernando` with its cue; the contact link is gone when Contact is hidden. Existing tests that count views, cards or ⌘K entries are updated to the new count.
- **e2e (desktop and phone):** the banner opens the view; Escape closes it and focus returns to the card; `/projects#san-fernando` opens it directly; ⌘K finds "Barangay San Fernando"; there are no console errors.
- `typecheck`, `lint`, `test` and `e2e` all pass.
