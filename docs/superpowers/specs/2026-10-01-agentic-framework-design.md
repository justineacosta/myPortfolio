# The Agentic Framework page: design

**Date:** 2026-10-01
**Status:** Approved 2026-10-01 in chat
**Change, 2026-10-01:** Justine’s editor is VS Code, not Cursor. Cursor is replaced by VS Code everywhere it is named as the editor: on this page (chip, tool card 02, Check’s sub-line, glossary), on the End-to-End page (step D4 “VS Code takes over” and its glossary entry) and in the AI agents dialog’s “Built with” chips.
**Reference:** brewedops.cloud/framework. It was used for the idea only: a long read page in sections, an at-a-glance overview, a "two jobs" split, one animated strip that follows a feature through the loop, and a closing line. No wording, names, branding, layout values, setup steps or code are taken from it. Its setup guide (code blocks, Copy buttons) is left out.

## 1. Goal

When someone clicks **The Agentic Framework** card on /projects, they see how Justine builds with AI: the tools, the rules, the loop that ties them together (drawn live), and one real feature taken through it from spec to live URL.

The page is generated into one self-contained HTML file. It shows inside the card's existing dialog and can also be opened on its own.

**The other two pages are not changed.** No file under `lib/buildPlan/`, `lib/endToEnd/`, `data/buildPlan.ts`, `data/endToEnd.ts`, `scripts/make-plan.ts`, `scripts/shoot-plan.mjs`, `scripts/make-e2e.ts`, `scripts/shoot-e2e.mjs`, `components/projects/PlanView.tsx`, `components/projects/EndToEndView.tsx`, `public/build-plan.html`, `public/end-to-end.html` or their screenshots is edited. The new page may import their code as it is (read-only).

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Content | Drafted from the card as it is today, in my words. Justine corrects anything untrue. |
| Shape | A read page in sections, with one live loop diagram |
| Sections | At a glance · Two jobs · The tools · The rules · The loop · One feature, start to finish · Habits and a closing line · Glossary |
| Setup guide | None. It is a portfolio read, not a tutorial: no code blocks, no Copy buttons |
| Worked example | The End-to-End page, from reference to live |
| Loop | Steps with the tool on each, rules pinned where they apply, loop-backs for a failed check and a sent-back approval |
| Extras | Click a step or pin for details · section chips · line legend · plain-English glossary |
| Look | The site's Kraft look, following its dark, light and high-contrast settings |
| Delivery | Generated from typed data at `/agentic-framework.html`, shown in the card's dialog through an iframe with "Open in new tab", replacing the card's current sections. A Home screenshot, a sitemap entry and a clean print. |
| Code | Its own small engine. Build plan and End-to-End code imported read-only where it fits (§5.1). |

## 3. Content

All copy uses curly quotes. Step labels and sub-lines are 22 characters or fewer, so they fit on one line.

### 3.1 Hero
- Kicker: `HOW I BUILD WITH AI`
- Title: `The Agentic Framework`
- Lede (the card's): "The tools, the rules, and the loop I use to ship apps with AI instead of chatting with it."
- Stance line: "I make the calls. The AI does the typing."
- Tool chips: Claude Code · Cursor · Codex.
- A home link back to the portfolio (`target="_top"`), hidden inside the dialog.

### 3.2 Section chips
A sticky row under the hero: **At a glance · Two jobs · Tools · Rules · The loop · Example · Habits · Glossary**. Scroll-spy marks the section on screen. Clicking a chip scrolls to it. Inside the dialog, hash links use `replaceState`.

### 3.3 At a glance: three stages
| Stage | Line |
|---|---|
| **1 · Set up once** | A rules file (CLAUDE.md), my notes and the three tools, wired before the first task. |
| **2 · Build in small loops** | Frame, build, check, fold back. One small piece per run, repeated until the criteria pass. |
| **3 · Ship on a yes** | Nothing reaches a repo, a client or a send button until I approve it. |

### 3.4 Two jobs, never mixed
| Me | The AI |
|---|---|
| Decide what done means | Read the files that matter |
| Approve every write | Write the code and the tests |
| Take over when precision beats speed | Run it and grade itself against the criteria |
| Turn mistakes into rules | Report back with the diff |

Closing line under the two columns: "When the AI starts deciding scope, or I start typing boilerplate, the loop is broken."

### 3.5 The tools
The card's three, as it has them now:
- **01 · Claude Code:** "The builder. Long tasks, real files, subagents for anything that can run in parallel." *Opus for planning, Sonnet for volume.*
- **02 · Cursor:** "The editor. Where I read what was written and take over when precision beats speed." *Human in the loop.*
- **03 · Codex:** "The second opinion. A fresh model reviewing a diff catches what the author missed." *Review pass, not a build pass.*

### 3.6 The rules
The card's four, as it has them now:
- **R1 · Write the spec first:** "If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens."
- **R2 · Every write is approval-gated:** "Agents draft. Nothing reaches a client account, a repo, or a send button unreviewed."
- **R3 · Small units of work:** "One task, one context. A fresh session beats a long one every time."
- **R4 · The model grades itself:** "Acceptance criteria go in with the task, and the output is checked against them before I look."

### 3.7 The loop (live)
The steps. Each has a label, a sub-line (its tool), an icon and a one-sentence `what` for the click panel.

| Id | Step | Sub-line | Kind | Pinned rule |
|---|---|---|---|---|
| `task` | A task | One small piece | start | |
| `frame` | Frame | Claude Code · Opus | step | R1 |
| `build` | Build | Claude Code · Sonnet | step | R3 |
| `check` | Check | Codex · Cursor | step | R4 |
| `gate` | Approval | Me | gate ⛔ | R2 |
| `live` | Shipped | Live on the URL | end | |
| `fold` | Fold back | Into CLAUDE.md | step | |

The cables:

| From | To | Kind | Label |
|---|---|---|---|
| task | frame | flow | |
| frame | build | flow | |
| build | check | flow | |
| check | gate | flow | passes |
| gate | live | flow | approved |
| check | fold | loop-back | fails |
| fold | frame | loop-back | becomes a rule |
| gate | build | loop-back | send back |

**Rule pins** are small R1–R4 badges on the cards. Each is its own button: clicking it opens the panel with the rule's name and line from §3.6.

**Routes** (for the balls) run from `task` to `live`, using at most one loop-back each:
1. Straight through: task → frame → build → check → gate → live.
2. A failed check: … check → fold → frame → build → check → gate → live.
3. Sent back: … gate → build → check → gate → live.

### 3.8 Legend
Each item is a button that opens the click panel with a one-line meaning:
- **Cable:** work moving from one step to the next.
- **Live signal:** a ball is one task going round the loop right now.
- **Loop-back:** a dashed cable. The work goes back to an earlier step.
- **Approval gate ⛔:** the loop stops here until I say yes.
- **Rule pin:** one of my four rules, applied at this step.

### 3.9 One feature, start to finish: the End-to-End page
A numbered timeline. Each item has a coloured tag naming its loop step.

1. **Frame:** "Studied a reference page for its shape only, then answered the design questions one at a time."
2. **Frame:** "Wrote the spec and ticked every line of it before any code. Then a six-task plan, with the code for each task."
3. **Build:** "Built each task test-first: write the test, watch it fail, make it pass."
4. **Check:** "511 unit tests and 194 browser tests green. Then a fresh reviewer model read the whole branch and found four bugs."
5. **Fold back:** "Each bug got a test that failed first, then the fix. Two lessons became permanent tests: labels fit on one line, and the drag test waits for the page to settle."
6. **Ship:** "I checked it, said "push, PR, merge", the checks passed, and it went live."

A last line links to the page itself: "See it: The End-to-End Workflow →" (`/end-to-end.html`, `target="_top"`).

*Note: the reviewer in item 4 was a fresh Claude model, not Codex, so the page says "a fresh reviewer model".*

### 3.10 Habits and a closing line
Four habits:
- **Fresh session per task:** "A long chat drifts. I close it and start clean with the spec."
- **Read every diff:** "I read what was written before it goes anywhere. No exceptions for small changes."
- **No new asks mid-run:** "A new idea waits for the next loop, so the current one can finish."
- **Check it on the real URL:** "Tests passing is not the end. I open the live page and use it."

Closing line, large: **"Done is a URL, not a diff."**

### 3.11 Plain-English glossary
Two columns (one on phones). One line per term, and every term must appear somewhere else on the page:
- Claude Code, Cursor, Codex, Opus, Sonnet.
- Spec, Context, Acceptance criteria, Subagent.
- Diff, Second opinion, Approval gate.
- CLAUDE.md, Loop-back, Fold back, Fresh session.
- Test-first, Reviewer model.

### 3.12 Footer
"Built by Justine Acosta", with a link back to the portfolio (`target="_top"`).

## 4. Visual design

### 4.1 Page
- **Tokens:** the same as the other two pages: Geist and Geist Mono, Kraft colours from `lib/tokens.ts`, dark first, light, and high contrast. It mirrors the site's `data-theme`, `data-a11y-motion`, `data-a11y-contrast` and `data-a11y-links` inside the dialog, and follows the device theme on its own.
- **Layout:** one centred read column. Card rows (stages, two jobs, tools, rules, habits) use a grid that stacks to one column on phones. Only the loop may be wider than the column, inside its own frame.
- **Order:** hero → chips → at a glance → two jobs → tools → rules → loop (with legend) → example → habits and closing line → glossary → footer.
- **No raw colours** in `lib/**`, as on the other pages.

### 4.2 The loop
- **Frame:** a dotted background, no border, the same as the other pages' diagrams.
- **Placement** (hand-placed in the data as `at: [col, row]`):
  - Row 0, left to right: task, frame, build, check, gate, live.
  - Row 1: fold, under the gap between frame and check.
- **Step cards:** the same 56 px n8n-style cards, with the label and sub-line below. The gate gets an accent outline and a lock badge. Rule pins sit at the card's top right.
- **Cables:**
  - Flow cables run straight along row 0.
  - The "fails" and "becomes a rule" loop-backs curve down to fold and back up to frame.
  - The "send back" loop-back arcs over the top of row 0.
  - Solid for flow, dashed accent for loop-backs. Short labels sit on the cable.
- **Timeline tags** use one colour per loop step (Frame, Build, Check, Fold back, Ship), taken from the tokens.

### 4.3 Interactions
- **Click** a step, a rule pin or a legend item to open the same click panel as the other pages: type, label and `what`. It closes on Esc, the close button, a second click, or when its step leaves the screen. Focus goes back to the button.
- **Balls:**
  - One leaves at a time, at random 0.7–2 s intervals, at most 5 on the loop at once.
  - Each takes one of the three routes at random, at one steady speed.
  - Steps and cables light up as a ball passes.
  - Balls play only while the loop is on screen, and never under reduced motion.
- **Scrolling:** where the loop doesn't fit (phones), it pans inside its frame with no scrollbars. It has faded edges, mouse drag (a drag never counts as a click) and ‹ › buttons. The page itself never scrolls sideways.
- **Inside the dialog:** Esc closes the dialog, as on the other pages.
- **Print:** balls, buttons and chips are hidden. Tints and the gate fill are kept.

### 4.4 Accessibility
- Steps and pins are buttons with accessible names (label plus sub-line, or the rule's name).
- The loop has a screen-reader-only ordered list of its steps and where each one leads, so it reads as text.
- The timeline is a real ordered list. Focus rings follow the site's tokens.

## 5. Site integration

### 5.1 Code
- **New files:**
  - `data/agenticFramework.ts`: types and content for the hero, chips, stages, two jobs, tools, rules, loop steps (`id`, `at`, `kind`, `label`, `sub`, `icon`, `what`, `rule?`), cables (`from`, `to`, `kind: 'flow' | 'loop'`, `label?`), legend, timeline, habits, closing line, glossary and footer.
  - `lib/agenticFramework/layout.ts`: card positions from the grid, the three cable shapes, and ball routes as measured paths with `stops` and `spans` (the same shape as the other pages, so the lighting logic carries over).
  - `lib/agenticFramework/icons.ts`, `styles.ts`, `render.ts` (`renderAgenticFramework()` → a full HTML string, `PAGE_PATH = '/agentic-framework.html'`) and `client.js`, adapted from End-to-End's client.
- **Imported read-only:** `esc` from `lib/buildPlan/render.ts`, plus `pageCss` and `Themes` from `lib/buildPlan/styles.ts`.
- **Scripts:**
  - `scripts/make-af.ts` writes `public/agentic-framework.html`.
  - `scripts/shoot-af.mjs` shoots `public/shots/agentic-framework.jpeg`.
  - `package.json` gets `"af-page": "node scripts/make-af.ts && node scripts/shoot-af.mjs"`.

### 5.2 Showing the page
- **New view:** `components/projects/AgenticFrameworkView.tsx`, the same pattern as EndToEndView: `Window` with `href` and `flush`, and an iframe only while the dialog is open.
- **`data/projects.ts`:**
  - The Agentic Framework writeup gains `page: '/agentic-framework.html'`, `frameTitle: 'Agentic Framework page'` and `shot: '/shots/agentic-framework.jpeg'`. Its card on the board stays as it looks now.
  - `DOC_VIEWS`, `DocView`, `Doc` and `DocCard` are removed, because nothing uses them any more.
- **`data/projectDocs.ts`:** `DOCS` is removed, with any icon imports only it used. `agentsView` stays.
- **`components/projects/DocView.tsx`:** deleted.
- **`components/projects/ProjectViews.tsx`:** mounts `AgenticFrameworkView` for `agentic-framework`, in place of the DocView loop.
- **`lib/seo.ts`:** `STATIC_PAGES` adds `/agentic-framework.html`.
- **⌘K:** `/projects#agentic-framework` keeps working, so `tests/commands.test.ts` is unchanged.
- **Head:** a canonical URL, og and twitter tags, and Google Fonts, as on the other pages.

## 6. Testing
- **Other pages are safe:** `git diff main --` over every file listed in §1 is empty, and both pages' freshness tests stay green.
- **Data (`tests/agenticFramework-data.test.ts`):**
  - Ids are unique, cables join real steps, and the only start is `task` and the only end is `live`.
  - Without the loop-backs, the cables never form a circle. There is exactly one gate.
  - Pins name R1–R4, each once, on real steps.
  - Every `what` is 20–220 characters and ends with a full stop. Labels and sub-lines are 22 characters or fewer.
  - Every glossary term appears elsewhere on the page. There are no straight quotes, and there is no mention of GHL or GoHighLevel.
- **Layout (`tests/agenticFramework-layout.test.ts`):**
  - Cards don't overlap, and every cable label sits inside the frame.
  - There are exactly three routes, all from `task` to `live`, each with at most one loop-back. Together they pass every step and every cable.
- **Render (`tests/agenticFramework-render.test.ts`):**
  - Ids and text are escaped (an injected `<b>` stays text), and the panel JSON is safe inside a script tag.
  - There are 8 section chips, each pointing at a real section, one button per step, 4 pin buttons, 5 legend buttons, 6 timeline items, 4 habits and the glossary.
  - Home and footer links go to the top window.
  - A freshness test: `public/agentic-framework.html` equals `renderAgenticFramework()`.
- **Site:** the tests in `tests/projects.test.tsx`, `tests/seo.test.ts` and `tests/no-ghl.test.ts` are updated, and `e2e/projects.spec.ts` covers the card.
- **Browser (`e2e/agentic-framework.spec.ts`):**
  - The page loads with no errors. Chips mark the section on screen.
  - A step and a pin open the panel. Esc closes it and focus goes back.
  - Balls leave one at a time, at most five, light what they pass, and move at a steady speed. Under reduced motion there are no balls.
  - At phone width the page never scrolls sideways and the loop pans.
  - Print hides balls and chips and keeps the tints. The device theme is followed.
  - The card opens the dialog with the iframe, and "Open in new tab" points at `/agentic-framework.html`.

## 7. Out of scope
- Any change to the build plan or End-to-End pages, or their code.
- A setup guide, starter files or Copy buttons.
- Live data.
