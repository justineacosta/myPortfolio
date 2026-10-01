# Livelier standalone pages: design

**Date:** 2026-10-01
**Status:** Approved 2026-10-01 in chat
**Pages:** `/build-plan.html`, `/end-to-end.html`, `/agentic-framework.html`

## 1. Goal

The three standalone pages read well but look monochrome: every icon is a grey Phosphor outline. This change makes them feel lively and specific to Justine's real stack. It adds:

- the real, full-colour logo of each tool the pages name
- soft colours for each kind of step
- a little motion
- a coloured glow behind each title

All three pages share one logo set and one style layer, so they still look like a family.

Nothing about the content changes. Only these things are added or replaced:
- logos
- colours
- motion
- the Agentic page's "Built with" chips, which become the new logo strip (§4.3)

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Scope | All three pages |
| Lively means | Brand logos in colour · colour-coded step kinds · gentle motion · hero glow and a logo strip |
| Logo source | Full-colour official logos, committed to the repo as SVG files with a credits file. No new dependencies. |
| On step cards | A round logo badge on the card's corner. The action icon stays. |
| Kind colours | Soft tints. The site's green accent stays the star (approval gates, live signal). |
| Motion | Scroll-in reveal · hover lift · badge pulse when a ball passes · slow drifting hero glow |
| More logos | Step details panel · Agentic tool tiles · glossary terms that are tools · Home screenshots re-shot |
| n8n's own nodes | On the build plan every node gets a badge. Nodes that call another service show that service; all others show n8n. |

## 3. Logos

### 3.1 The files

Each logo lives in `lib/brand/logos/<id>.svg`, and `lib/brand/logos/CREDITS.md` lists each file's source and licence.

| Id | Tool | Source (CC0) | Kind |
|---|---|---|---|
| `n8n` | n8n | gilbarbara/logos `n8n-icon` | colour |
| `supabase` | Supabase | gilbarbara/logos `supabase-icon` | colour |
| `gmail` | Gmail | gilbarbara/logos `google-gmail` | colour |
| `google-sheets` | Google Sheets | Simple Icons `googlesheets`, #34A853 | colour |
| `telegram` | Telegram | gilbarbara/logos `telegram` | colour |
| `stripe` | Stripe | Simple Icons `stripe` (the S mark), #635BFF | colour |
| `claude` | Claude | gilbarbara/logos `claude-icon` | colour |
| `cal-com` | Cal.com | Simple Icons `caldotcom`: its “Cal” letters in white on a #292929 rounded square, so it reads at badge size | colour |
| `claude-code` | Claude Code | gilbarbara/logos `claude-code` | colour |
| `vs-code` | VS Code | gilbarbara/logos `visual-studio-code` | colour |
| `codex` | Codex | gilbarbara/logos `codex`, and `codex-dark` for dark themes | colour, two files |
| `github` | GitHub | gilbarbara/logos `github-icon` | mono |
| `vercel` | Vercel | gilbarbara/logos `vercel-icon` | mono |

- **Only tools the pages actually use are added.** For example, Docker is named only inside a description, not on any step, so it isn't added.
- **Mono logos take the page's text colour,** so they are black on light pages and white on dark ones.
- **Codex** shows `codex-dark` wherever the page is dark.

### 3.2 The registry: `lib/brand/tools.ts`

`TOOLS: Record<ToolId, { name: string; brand: string; mono?: true; dark?: string }>`

- `name` is the tool's display name.
- `brand` is the brand colour as a hex value, used for the glow and the badge pulse.
- `ToolId` is the union of the ids in §3.1.
- The data files import only the type (`import type`), so Node can still run them directly.

### 3.3 One copy per page

- **Shared sheet:** each page draws every logo it uses once, as a `<symbol id="logo-<id>">` in one hidden SVG at the top of `<body>`. Every badge, chip, tile, panel and glossary logo points to it with `<use href="#logo-<id>">`.
- **Unique ids:** ids inside a logo, such as Gmail's gradients, are prefixed with `lg-<id>-` (which can never match a `logo-<id>` symbol id) so they can't collide with each other or with the page.

## 4. Where logos appear

### 4.1 Step badges

**Data:** steps gain `tools?: ToolId[]`, with at most two tools.

**Badge:**
- A 20px round badge on the card's **top-right** corner, with the logo inside on a surface-coloured disc.
- A second tool's badge overlaps the first by 8px, like stacked avatars.
- The top-right corner is free on all three pages. Step numbers and rule pins sit top-left; the lock and gear badges sit bottom-right.

**Which steps get one:**
- **On End-to-End and Agentic, a step gets a tool only when its label or sub-line names that tool.** A test checks this.
- **On the build plan, every node gets exactly one or two badges:** the services its sub-line names (Supabase, Gmail, Google Sheets, Telegram, Stripe, Claude, Cal.com), or n8n when it names none. "Supabase + Sheets" gets both.

| Page | Step | Tools |
|---|---|---|
| End-to-End | A1 Message to Hermes (Telegram) | telegram |
| | A3 Client event (n8n webhook) | n8n |
| | D2 Claude Code builds | claude-code |
| | D4 VS Code takes over | vs-code |
| | E3 Codex second opinion | codex |
| | H1 Webhook in (n8n) | n8n |
| | J2 Push (to GitHub) | github |
| | J3 Deploy (Vercel and my VPS) | vercel |
| | G2 Auditor (n8n audits) | n8n |
| Agentic | Frame (Claude Code · Opus) | claude-code |
| | Build (Claude Code · Sonnet) | claude-code |
| | Check (Codex · VS Code) | codex, vs-code |

### 4.2 Details panel

- **Panel header:** when a step has tools, the header shows each tool's logo and name before the type, for example "[logo] Supabase · ACTION". When the type doesn't fit beside them, it moves to the next line. Neither runs under the close button.
- **Index data:** the node index gains `tools?: ToolId[]`.
- **Templates:** the page carries one `<template id="tool-<id>">` per tool it uses, holding a logo and the tool's name. The page script copies these into the panel; no HTML is built from JSON.
- **Scripts touched:** `lib/buildPlan/client.js` and `lib/endToEnd/client.js` each get this small addition. The Agentic page reuses the End-to-End script, so it gets it too.

### 4.3 Hero logo strip

- **What:** under each page's lede, "Tools on this page" shows a chip, with logo and name, for each tool the page uses, in the order they first appear in the data. The visible label names the list (`aria-labelledby`), so screen readers hear it once.
- **Agentic page:** the strip replaces the "Built with" chips, and `stack` is removed from its data.

### 4.4 Tiles and glossary

- **Agentic tool tiles:** the three tiles (Claude Code, VS Code, Codex) show the tool's logo instead of the Phosphor icon. Tiles gain `tool?: ToolId`.
- **Glossary:** a term whose text is exactly a tool's name gets a small logo before it. This applies on End-to-End and Agentic; the build plan has no glossary.

## 5. Colour

### 5.1 Kind tints

All three pages already share the same look names, so one palette covers them. Each tinted kind gets a colour token in the light and dark themes:
- **Fill:** about 12% of the kind colour over the card surface.
- **Border:** about 45%.
- **Icon:** the full kind colour.

| Look | Used for | Tint |
|---|---|---|
| `k-trigger` | triggers, the loop's start | amber |
| `k-ai` | AI steps, agents | violet (was the green accent) |
| `k-branch` | decisions, If/Switch | blue |
| `k-helper` | helper workflows | teal |
| `k-action`, `k-wait` | ordinary steps, waits | neutral (unchanged) |
| `k-approve` | approval gates | the site's green accent (unchanged) |
| `k-end` | ends | grey (unchanged) |

- **Contrast:**
  - Each icon colour reaches at least 3:1 against its tinted fill in both themes.
  - Step names and sub-lines keep the plain text colours.
  - A test checks the contrast.
- **High-contrast mode:** the tints are switched off and the cards look as they do today. The logos stay.
- **Legends:** each page's legend uses the same tints, so the key matches the diagram.

### 5.2 Hero glow

A soft two-colour radial glow sits behind each page's title, using two of that page's own tool colours:

| Page | Glow colours |
|---|---|
| Build plan | n8n pink + Supabase green |
| End-to-End | Claude orange + Telegram blue |
| Agentic | Claude orange + VS Code blue |

- **Strength:** 22% in dark themes, 4% in light ones.
- **Text:** it sits behind the text. In light themes, even at its brightest point, it keeps the quietest hero text (ink3) within 5% of its contrast. Any tint behind dark text lowers contrast a little, so 5% is the agreed limit. Dark themes keep at least 4.5:1.
- **Print and high-contrast:** it's switched off.

### 5.3 Print

- **Colours:** logos, tints and badges print in colour (`print-color-adjust: exact`).
- **Left out:** the glow, motion and the hover shadows.

## 6. Motion

All motion is switched off under `prefers-reduced-motion: reduce`, and none of it hides content anywhere it can't be undone.

- **Scroll-in reveal:**
  - Sections, tiles, chips, the timeline and the glossary fade and rise 12px into place once, as they enter the view. A shared script, `lib/brand/reveal.js`, is inlined into each page.
  - Content is hidden only after that script has run and confirmed motion is allowed, so the page is complete with no JavaScript, under reduced motion, and in print.
  - Anything already on screen at load shows at once, so the screenshots and the top of the page never flash.
  - The diagrams themselves don't animate in, so the ball paths and the pan positions are untouched.
- **Hover lift:**
  - Tiles, chips and step cards rise 2px and gain a soft shadow, only on devices with a real mouse (`hover: hover`).
  - A drag still pans the diagram and never opens a step.
- **Badge pulse:** while a ball lights a step (the existing `.lit` class), its badges glow in the tool's brand colour. This is CSS only, so the ball code is unchanged.
- **Glow drift:** the hero glow drifts slowly, on a 20-second cycle that runs back and forth.

## 7. Code

| File | Change |
|---|---|
| `lib/brand/logos/*.svg`, `CREDITS.md` | New: 14 logo files and their credits |
| `lib/brand/tools.ts` | New: `ToolId` and `TOOLS` |
| `lib/brand/render.ts` | New: the logo sheet, badges, chips, the hero strip, panel templates, glossary logos, and `toolsUsed()` |
| `lib/brand/lively.ts` | New: `livelyCss(themes)`, which covers kind tokens and tints, badges, the strip, the glow, reveal, hover, pulse and print. Each page adds it after its own CSS. |
| `lib/brand/reveal.js` | New: the scroll-in reveal |
| `data/buildPlan.ts`, `data/endToEnd.ts`, `data/agenticFramework.ts` | Gain `tools` on steps, `tool` on Agentic's tool tiles; Agentic loses `stack` |
| `lib/buildPlan/render.ts`, `lib/endToEnd/render.ts`, `lib/agenticFramework/render.ts` | Add the sheet, badges, strip, templates, glossary logos and `livelyCss` |
| `lib/buildPlan/client.js`, `lib/endToEnd/client.js` | The panel shows a step's tools |
| `public/*.html`, `public/shots/*.jpeg` | Regenerated with `npm run plan`, `npm run e2e-page` and `npm run af-page` |

**Size:** each page grows by no more than 40 KB.

## 8. Tests

**Unit (Vitest):**
- **Registry and credits:** every `ToolId` has a logo file and a credits line; names are unique; no logo file is unused.
- **Badges match the text:** on End-to-End and Agentic, every step's tools are named in its label or sub-line. On the build plan, every node has one or two tools, and the tool is n8n exactly when the sub-line names no other service.
- **One copy per page:** each page's sheet holds each tool it uses exactly once, and no other. All ids in the sheet are unique and prefixed.
- **Strip:** the hero strip lists exactly the tools the page uses, in order of first appearance.
- **Contrast:** each kind's icon colour reaches at least 3:1 against its tinted fill in light and dark.
- **Freshness:** the existing tests still show each generated page matches its renderer.

**Browser (Playwright):**
- **Logos visible in both themes:** in light and in dark, each mono logo's colour differs from the page background.
- **Panel:** clicking a badged step shows the tool's logo and name in the panel. Clicking an unbadged step shows none.
- **Reveal:**
  - With motion on, a section below the fold is revealed after scrolling to it.
  - With reduced motion, and in print, every section is visible at load.
  - With JavaScript off, nothing is hidden.
- **Print and high contrast:** no glow; logos and tints keep their colours. In high-contrast mode the tints are off.
- **Phone:** no sideways scroll at 390px on all three pages, and the strip wraps.
- **Unchanged:** all existing page tests still pass. That covers balls, panels, pins, panning, chips and print.

## 9. Out of scope

- **Content and layout:** no changes to wording, sections or diagram layouts.
- **Docker:** not added, because it's named on no step.
- **Pages outside the three:** no logos on the Projects cards or dialogs; only their screenshots are re-shot.
