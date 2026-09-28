# Kraft Portfolio: Design Spec

- **Date:** 2026-09-28
- **Owner:** Justine Acosta
- **Status:** Approved in brainstorming; awaiting spec review

## 1. Goal

Turn the Claude Design export in `reference/Kraft_Portfolio_Design_System/` into a live portfolio site. The look and copy come from Kraft. The structure follows the reference project `kapeportfolio/`, and a chosen set of kape's features is ported in and restyled to Kraft.

**Audience:** freelance clients first. Visitors should end up contacting Justine or starting a project. The site must also work as a résumé for employers.

**Success means:**
- Every page matches Kraft's design (tokens, type, spacing, copy) in both themes, at desktop and phone sizes.
- The kape features listed below work, and they use only Kraft's colours.
- Every page is pre-rendered HTML with its own metadata, so search engines and link previews see real content.
- The site stays smooth on slow machines (the performance auto-downgrade) and fully usable with reduced motion.
- Content can be edited in `data/` without touching components.

**Out of scope:** `reference/Kraft_Portfolio_Design_System/HANDOFF.md` is not followed. The project also includes no CMS, no analytics, no form backend (the form is switchable later), and no blog.

## 2. Sources

| Source | Role |
|---|---|
| `reference/Kraft_Portfolio_Design_System/Kraft Portfolio (standalone).html` | Visual reference render, used for side-by-side comparison |
| `reference/Kraft_Portfolio_Design_System/Kraft Portfolio.dc.html` | Shell, tokens (`:root` dark at line 50, `[data-theme=light]` at line 51), sidebar, top bar, mobile nav, ⌘K, theme button |
| `reference/Kraft_Portfolio_Design_System/KraftScreens.dc.html` | Home, Services, Testimonials, About, Contact/FAQ screens and copy |
| `reference/Kraft_Portfolio_Design_System/Kraft Projects Board.dc.html` | Projects board and its sub-views |
| `reference/Kraft_Portfolio_Design_System/assets/`, `uploads/` | Logo, portrait, workstation GIF, workflow screenshots |
| `reference/kapeportfolio/src/` | Structure reference and source of the ported features (§6) |

All reference material lives in `reference/` (gitignored) since Phase 1 Task 1.

Ignored: `support.js` (design-tool runtime), `_ds/safeguard-design-system-*` (an unrelated brand), `HANDOFF.md`.

## 3. Stack and hosting

- **Next.js** (current stable, App Router), **TypeScript** (strict), **React 19**.
- **Tailwind CSS** for layout and spacing. **Colours come only from Kraft's CSS variables**, mapped into Tailwind's theme (`bg-bg`, `bg-s1`, `text-ink`, `text-ink3`, `border-b1`, `text-accent`, …). No hex values outside the token file, and no Tailwind palette colours.
- **Fonts:** Geist and Geist Mono (weights as in Kraft), self-hosted via `next/font`.
- **Icons:** Phosphor (`@phosphor-icons/react`), using the same glyphs Kraft names (`ph-house`, `ph-folder-open`, …).
- **Animation libraries:** Three.js (contour background and funnel drum) and Lenis (smooth scroll), carried over from kape. GSAP only if a ported piece still needs it after porting.
- **Hosting:** Vercel. The GitHub repo is connected, pushes to `main` deploy production, and PRs get preview URLs.

## 4. Repository layout

```
myPortfolio/
├─ app/
│  ├─ layout.tsx            root: fonts, pre-paint theme script, default metadata
│  ├─ globals.css           Tailwind, Kraft tokens (both themes), base, keyframes
│  ├─ (site)/               routes that share the shell
│  │  ├─ layout.tsx         intro, contour bg, sidebar, panel, tab bar, ⌘K, access menu
│  │  ├─ page.tsx           Home
│  │  ├─ projects/  showcase/  services/  testimonials/  about/  contact/
│  ├─ (plain)/              no sidebar, document scroll
│  │  ├─ layout.tsx
│  │  ├─ privacy/  terms/  thank-you/
│  ├─ not-found.tsx
│  ├─ sitemap.ts  robots.ts  opengraph-image.*
├─ components/  shell/  home/  projects/  showcase/  services/  about/  contact/  ui/
├─ data/        profile  projects  services  testimonials  faqs  funnels  stack  flagship  credentials
├─ lib/         theme  perf  a11y  contact
├─ hooks/       useLenis  useScrollReveal  useIsPhone
├─ public/      assets/  icons/  funnels/  samples/
└─ reference/   Kraft folder, kape folder, Kraft zip   (in .gitignore, never built)
```

`reference/` is excluded from git, from TypeScript (`tsconfig` `exclude`), from Tailwind's content scan and from lint.

## 5. Rendering model

- `(site)/layout.tsx` stays mounted across route changes, so the intro, contour background and sidebar persist while only the panel content swaps.
- Every route is statically generated. Components are Server Components by default. Client Components are used only for interactive parts: the intro, contour canvas, funnel drum, preview modal, ⌘K, theme button, Flagship carousel, FAQ accordion, contact form, access menu, tab bar active state and scroll hooks.
- Three.js is dynamically imported after the `load` event, at idle time. It is never loaded on coarse-pointer or touch devices, with reduced motion, with the access menu's "motion off", or when the performance tier is `low`.

## 6. Kape features carried over

Every carried-over feature uses Kraft tokens only (both themes). Kape's navy, orange, cream and blue do not appear anywhere.

| Feature | kape source | Notes |
|---|---|---|
| Workflow intro and headline flight | `components/IntroOverlay.tsx`, `styles/boot.css` | See §8 |
| Contour background | `components/HeroCanvasV2.tsx` | Base is `--bg`; lines are tinted from `--amb`; eases on `themechange` |
| Performance auto-downgrade | `lib/perf.ts`, `styles/perf.css` | `high` → `mid` (no backdrop blur) → `low` (no shader, flat `--bg`); stored per tab |
| Smooth scrolling | `hooks/useLenis.ts` | Targets the panel on desktop and the document on phones |
| Scroll reveals | `hooks/useScrollReveal.ts` | `[data-reveal]` rises in once |
| Theme transition | `lib/theme.ts` (View Transitions circular sweep from the button, about 1.2s) | Uses **Kraft's** theme button and icon (`ph-moon-stars` in light, `ph-sun` in dark). Kraft's radial bloom and kape's morphing glyph are not used. Instant switch without View Transitions or with reduced motion |
| Flagship showcase | `components/Flagship.tsx`, `ShowcaseGrid.tsx` | Body of `/showcase`; the mock uses Kraft's accent |
| 3D funnel drum | `components/FunnelBarrel.tsx` | Replaces Kraft's flat carousel in Projects → Funnels and sites |
| Live preview modal | `components/FunnelModal.tsx` | Opened from the drum; iframes same-origin pages |
| Accessibility menu | `components/AccessMenu.tsx`, `lib/a11y.ts`, `styles/a11y.css` | Larger text, stronger contrast, motion off, underlined links; stored in `localStorage` |
| Phone app layout | `components/TabBar.tsx`, `HomeMobile.tsx` | Styled with Kraft's mobile nav (§7) |
| Contact without a backend | `lib/contact.ts` | Opens the mail client; `NEXT_PUBLIC_CONTACT_ENDPOINT` switches it to a JSON POST |

Not carried over: cursor ring, tools marquee, Home bento, Autopilot, AI Stack tree/grid, screenshot marquee.

## 7. Shell and navigation

**Theme**
- Tokens are copied exactly from Kraft: dark in `:root`, light in `[data-theme=light]`.
- For first-time visitors, the default follows `prefers-color-scheme`. An explicit choice is stored in `localStorage` (`kraft-theme`) and wins from then on.
- An inline pre-paint script sets `data-theme` before first paint, so there is no flash.

**Desktop (≥ 1100px)**
- The page is pinned to the viewport and only the panel scrolls.
- **Sidebar** width follows Kraft's `--rail` scale: 284px, then 272px at ≤1700px, 256px at ≤1500px and 240px at ≤1320px. Top to bottom:
  - Kraft mark and wordmark.
  - Portrait with Kraft's halo.
  - "Justine Acosta" with the verified badge.
  - Handle and role lines.
  - Social buttons.
  - Theme button.
  - Availability badge.
  - Numbered nav:
    `01 Home · 02 Projects · 03 Showcase · 04 Services · 05 Testimonials · 06 About · 07 FAQs / Contact`.
    Each item shows its Kraft hint (OVERVIEW, BUILDS, OFFERS, CLIENTS, PROFILE, INQUIRY); Showcase uses FLAGSHIP.
- **Top bar** in the panel: breadcrumb `KRAFT / <HINT>`, a **Jump to… ⌘K** button and a **Get in touch →** button.
- **Page change:** 160ms fade-out, then the route commits and the panel's scroll resets while it is invisible (`scroll-behavior:auto` for that one assignment), then a 540ms rise-in.

**Phone (< 1100px)**
- No sidebar and no fixed panel; the document scrolls.
- Home shows a profile header (portrait, name, verified badge, handle, theme button).
- Kraft's bottom nav: Home · Work (`/projects`) · **Start** (raised accent circle → `/contact`) · Services · About. Showcase and Testimonials are reached from Home cards, ⌘K and in-page links.
- The theme button floats top-right on every page except Home.

**⌘K palette**
- Opens with Ctrl/⌘+K and with the top-bar button.
- Filters pages and key sections as you type. Enter goes to the first hit, arrow keys move between hits, Esc closes.
- Traps focus while open and returns it to the trigger on close.

## 8. Home, intro and background

**Intro (every full load of `/`)**
- Plays on each full page load or refresh of `/`. It does not play on client-side navigation back to Home, when landing on any other route, with reduced motion, or with the access menu's "motion off".
- Uses kape's engine and timing, about 3.2s:
  - **Ignition:** nodes and cables draw in.
  - **Run:** a pulse streams through the cables, each node gets its check, and the headline words mask-reveal on the same progress.
  - **Lock:** the last node succeeds and the status flips to done.
  - **Handoff:** the canvas falls away and the headline flies onto the Home `<h1>` rect.
- Nodes are Kraft's loader steps with their icons: `ph-lightning` Brief comes in → `ph-tree-structure` Architect → `ph-code` Build & test → `ph-rocket-launch` Shipped.
- Headline: "Software that keeps / its promises." The flying copy and the Home `<h1>` share identical typography (`letter-spacing:-.035em`, `line-height:1.02`), so the landing is exact.
- Colours: nodes `--s1` on `--b1`, cables `--b2`, pulse and checks `--accent`, text `--ink`.
- Anything above the fold on Home is held back until the handoff, so nothing shows through the intro.
- The flight is measured after fonts are ready.

**Contour background:** kape's shader behind every `(site)` route, on Kraft's `--bg` with contour lines from `--amb`. It reacts to cursor velocity, pauses when the tab is hidden, and is governed by the performance tier. If WebGL fails, the flat `--bg` shows.

**Home content (Kraft, in order)**
1. `HOME / OVERVIEW` eyebrow, the headline, and the lede "Full-stack development, AI automation and workflow systems — built to keep running long after launch day."
2. Buttons: **Start a project →** (`/contact`) and **See the work** (`/projects`).
3. Stats: `[X] yrs` building, `[N] builds` shipped, `GMT+8` US hours. The first two are PLACEHOLDERs.
4. "Daily drivers / Tools I work with" row.
5. Six section cards, each linking to its page: Projects (06 builds), About, Stack (In use / Experimental), Services, Testimonials, Credentials.

## 9. Pages

All copy comes from Kraft unless marked PLACEHOLDER. Each page opens with Kraft's eyebrow, `<h1>` and lede pattern, sized from its container.

- **Projects** (`PROJECTS / BUILDS`): a board of cards, each opening its sub-view:
  - Automations reel: GoHighLevel workflow screenshots; pauses on hover.
  - Build plan: the GoHighLevel automation blueprint.
  - Funnels and sites: the 3D drum and the preview modal; pages in `public/funnels/` and `public/samples/` are PLACEHOLDERs.
  - AI agents and RAG chatbots.
- **Showcase** (`SHOWCASE / FLAGSHIP`): the Flagship build. It has a 5-tab product mock that auto-advances every 6s (pausing on hover, when off-screen and with reduced motion), copy, a button, and a feedback marquee. The product content is PLACEHOLDER.
- **Services** (`SERVICES / OFFERS`):
  - The Kraft Method: Kickoff · Research · Architect · Form · Transform, each a gate.
  - "What I can do for you": six offers.
  - The live automation flow.
- **Testimonials** (`TESTIMONIALS / CLIENTS`): the video testimonial player and featured quotes. The quotes are PLACEHOLDER.
- **About** (`ABOUT / PROFILE`): "Hi, I'm Justine.", the workstation GIF, "I care about the parts nobody demos.", Certified (AWS Cloud Practitioner, HackerRank Software Engineer) and "Based in Manila · GMT+8 · US / EU / CA overlap".
- **FAQs / Contact** (`FAQS / CONTACT`):
  - Form: first name, last name, email and "What are you running into?", with inline validation.
  - FAQ accordion ("Quick answers").
  - Availability badge.
  - On submit, the form shows Kraft's inline **"Message queued."** card with **Send another**. The body copy is rewritten to be truthful for the mail-client flow, e.g. "Your email app should have opened with the message ready. Hit send there, and I'll reply within one business day."
- **Thank-you:** a standalone confirmation page for external links (bookings, ads). The form does not redirect to it.
- **Privacy / Terms:** standalone pages with PLACEHOLDER legal text, flagged for owner review.
- **404:** a styled not-found page linking to Home and Contact.

## 10. Content and data

- `data/profile.ts` holds name, handle, role, portrait, verified label, **email (PLACEHOLDER)**, location, stats, socials, headline and lede.
- Page data lives in the other `data/*.ts` files. Components render data and never hard-code copy.
- Every gap is a string starting `PLACEHOLDER -` that says what goes there. A lint or test step lists the remaining placeholders.

## 11. Accessibility and motion

- A skip link, landmarks, one `<h1>` per page, visible focus rings, and `aria-current` on the active nav item.
- Every animation has a reduced-motion path. The access menu's "motion off" takes the same path.
- Modals and ⌘K: focus trap, Esc to close, focus returned to the trigger, and background scroll locked.
- The drum has a visually hidden button list so every page can be reached by keyboard and screen reader.
- Text colour contrast follows Kraft's `--ink*` tokens; the "stronger contrast" switch raises it.

## 12. Error handling

- **WebGL unavailable or context lost:** unmount the canvas and show flat `--bg`.
- **Mail client doesn't open:** the form shows the address with a copy button.
- **Endpoint mode error:** show the server's `{ error }` sentence and keep the form contents.
- **Preview iframe fails:** the modal shows an "Open in new tab" link.
- **`localStorage` or `sessionStorage` throws:** the feature just doesn't persist.

## 13. SEO

- Per-route `metadata` (title, description, canonical).
- Open Graph and Twitter share image.
- `sitemap.xml`, `robots.txt`.
- Favicon from `kraft-mark.svg`.
- `Person` JSON-LD on Home.

## 14. Verification (each phase)

- `tsc --noEmit`, lint and `next build` pass.
- Playwright screenshots of every built route at 1440×900 and 390×844 in both themes, reviewed side by side against `Kraft Portfolio (standalone).html`.
- Keyboard-only pass: sidebar, ⌘K, drum, modal, FAQ, form, access menu.
- Reduced-motion pass: intro skipped, shader off, marquees still.

## 15. Build phases

Each phase ends with a working, deployable site.

1. **Foundation:**
   - Scaffold, move references into `reference/`, set up `.gitignore`.
   - Tokens, Tailwind mapping, fonts, pre-paint theme script, theme transition.
   - Shell (sidebar, panel, top bar, page crossfade), contour background, performance tiers, ⌘K, phone tab bar, placeholder route pages.
2. **Home and intro:** the Home page, the workflow intro and the headline flight.
3. **Main pages:** Projects (board, reel, build plan, AI agents), Services, Testimonials, About, Contact/FAQ.
4. **Showcase features and extras:**
   - Funnel drum, preview modal and the Flagship `/showcase`.
   - Thank-you, Privacy, Terms and 404 pages.
   - Access menu, SEO files and phone polish.
   - Vercel hookup.
