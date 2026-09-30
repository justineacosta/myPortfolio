# The End-to-End Workflow page: design

**Date:** 2026-09-30
**Status:** Approved 2026-10-01 through the tickable review (every item ticked, no notes)
**Reference:** brewedops.cloud/workflow. It was used for the idea only: one tall graph of stacked, lettered lanes, cables that cross between lanes, loop-backs, marks for gates and machine-enforced steps, a line legend and a plain-English glossary. No wording, agent names, lanes, branding, layout values or code are taken from it. Its GoHighLevel lanes are left out.

## 1. Goal

When someone clicks **The End-to-End Workflow** card on /projects, they see how Justine really ships work: every trigger, lane, agent and loop drawn as one live graph, where balls travel from a trigger to a delivered, written-back result. The card has promised "one live graph" all along, and this page delivers it.

The page is generated into one self-contained HTML file. It shows inside the card's existing dialog and can also be opened on its own.

**The build plan is not changed.** No file under `lib/buildPlan/`, `data/buildPlan.ts`, `scripts/make-plan.ts`, `scripts/shoot-plan.mjs`, `components/projects/PlanView.tsx`, `public/build-plan.html` or `public/shots/build-plan.jpeg` is edited. The new page may import build plan code as it is (read-only).

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Content | Justine's own workflow, drafted from what the site already says (the End-to-End card, the Agentic Framework card, the AI agents list and Hermes). Justine corrects anything untrue. |
| Layout | One tall live graph: 11 lanes stacked in one frame, with cables and loop-backs between lanes |
| Lanes | Triggers · Knowledge and memory · Frame the task · Build loop · Check and repeat · Debug and fix · Agents and skills · n8n automation · Approval and delivery · Git and deploy · Write-back and reset |
| Agents | Shown by job, with no names: 10 specialists |
| Extras | Click a step for details · line legend · plain-English glossary · numbered steps inside lanes |
| Look | The build plan's Kraft look, following the site's dark, light and high-contrast settings |
| Delivery | Generated from typed data at `/end-to-end.html`, shown in the End-to-End card's dialog through an iframe with "Open in new tab", replacing the card's step cards. A Home fan screenshot, a sitemap entry and a clean print. |
| Code | Its own files. Build plan code is imported read-only where it fits (§5.1). |

## 3. Content

### 3.1 Hero
- Kicker: `HOW I SHIP, END TO END`
- Title: `The End-to-End Workflow`
- Lede: "Every trigger, node, skill and agent wired as one live graph, from a form fill to a delivered asset."
- Stance line: "Nothing leaves the graph without a human yes."
- A home link back to the portfolio (`target="_top"`), as on the build plan.
- The legend (§3.4).

### 3.2 Lanes and steps

Steps are numbered inside a lane where order matters. ⛔ marks an approval gate. ⚙ marks a step a machine enforces (a schedule, a check that runs, a log), not a habit Justine follows. Every step has a label, a short sub-line, an icon and a one-sentence plain-language description (`what`) for the click panel.

| Lane | Steps (in order) |
|---|---|
| **A · Triggers**: where work enters | Client event (n8n webhook) · Message to Hermes (Telegram) · Schedule ⚙ (skips the model when nothing changed) · Read the intent |
| **B · Knowledge and memory**: checked before building | 1 Project rules · 2 My notes (Hermes reads them) · 3 Knowledge base (1,277 chunks) · 4 Past work |
| **C · Frame the task**: spec before prompt | 1 Outcome · 2 Constraints · 3 Files that matter · 4 Acceptance criteria · 5 Spec |
| **D · Build loop**: one small piece at a time | 1 Pick one small piece · 2 Claude Code builds · 3 Subagents in parallel · 4 Cursor takes over |
| **E · Check and repeat**: nothing ships until it passes | 1 Run it ⚙ · 2 Grade against the criteria · 3 Codex second opinion · 4 Pass? |
| **F · Debug and fix**: find the cause, never patch blind | 1 Bug or failure · 2 Rank the causes · 3 Test to confirm · 4 Fix and re-check |
| **G · Agents and skills**: one job each | Router · 10 jobs (Researcher · Auditor · Builder · Writer · Reel maker · Reviewer · Deliverables · Monitor · Data tidy · Memory keeper) · Self-check |
| **H · n8n automation**: predictable, logged, reversible | 1 Webhook in · 2 Wait · 3 Branch · 4 Action · 5 Log ⚙ |
| **I · Approval and delivery**: a person says yes | 1 Approval gate ⛔ · 2 Deliver with the handover doc |
| **J · Git and deploy**: ship, then prove it's live | 1 Commit · 2 Push · 3 Deploy · 4 Verify live ⚙ |
| **K · Write-back and reset**: the next run starts smarter | 1 Write back to the contact record · 2 Save progress ⚙ · 3 Fold back · 4 Fresh session |

Four details are Justine's to confirm while reviewing:
- The knowledge sources in B.
- The ten job names in G.
- The deploy target in J: Vercel for sites, Docker on the VPS for Hermes and workers.
- The rollback on a failed live check in J.

### 3.3 Cables

Each lane's steps are joined left to right by flow cables. The table lists the cables that leave a lane or turn back.

| From | To | Kind | Label |
|---|---|---|---|
| Client event | H1 Webhook in | flow | |
| Message to Hermes, Schedule | Read the intent | flow | |
| Read the intent | B1 Project rules | flow | build work |
| Read the intent | G Router | flow | a skill job |
| B4 Past work | C1 Outcome | flow | |
| C5 Spec | D1 Pick one small piece | flow | |
| D4 Cursor takes over | E1 Run it | flow | |
| E4 Pass? | D2 Claude Code builds | loop-back | fails |
| E4 Pass? | F1 Bug or failure | flow | breaks |
| E4 Pass? | I1 Approval gate | flow | passes |
| F4 Fix and re-check | E1 Run it | loop-back | re-check |
| G Router | each of the 10 jobs | flow | |
| each of the 10 jobs | G Self-check | flow | |
| G Self-check | I1 Approval gate | flow | |
| H3 Branch | I1 Approval gate | flow | needs a yes |
| H3 Branch | H4 Action | flow | routine |
| H5 Log | K1 Write back | flow | |
| I1 Approval gate | I2 Deliver | flow | approved |
| I1 Approval gate | D2 Claude Code builds | loop-back | send back with a note |
| I2 Deliver | J1 Commit | flow | code |
| I2 Deliver | K1 Write back | flow | |
| J4 Verify live | K2 Save progress | flow | |
| J4 Verify live | J3 Deploy | loop-back | fails: roll back and redeploy |
| K3 Fold back | C1 Outcome | loop-back | becomes a rule |

Fresh session (K4) is the end of the line.

### 3.4 Legend
Each legend item is a button that opens the click panel with a one-line meaning:
- **Cable:** work flowing from one step to the next.
- **Live signal:** a ball is a piece of work moving through the graph right now.
- **Loop-back:** a dashed cable. The work goes back to an earlier step.
- **Approval gate ⛔:** the graph stops here until a person says yes.
- **Runs on its own ⚙:** a machine enforces this step, not a habit.

### 3.5 Plain-English glossary
Two columns (one on phones). Each term gets one line, and every term must appear somewhere on the graph:
- n8n, Webhook, Hermes, Telegram.
- Knowledge base, Spec, Acceptance criteria.
- Claude Code, Subagent, Cursor, Codex.
- Skill, Agent, Router.
- Approval gate, Handover doc, Write-back.
- Commit, Deploy, Rollback.
- Fold back, Fresh session.

### 3.6 Footer
"Built by Justine Acosta", with a link back to the portfolio. There is no booking button and no fictional-client note, because this workflow is real.

## 4. Visual design

### 4.1 Page
- **Tokens:** the same as the build plan: Geist and Geist Mono, Kraft colours from `lib/tokens.ts`, dark first, light, and high contrast. It mirrors the site's `data-theme`, `data-a11y-motion`, `data-a11y-contrast` and `data-a11y-links` inside the dialog, and follows the device theme on its own.
- **Lane chips:** a sticky row of A–K chips under the hero. Scroll-spy highlights the lane on screen, and clicking a chip scrolls to it. Inside the dialog, hash links use `replaceState`, so no history entries are added.
- **Order:** hero → legend → graph → glossary → footer.
- **No raw colours** in `lib/**`, as on the build plan.

### 4.2 The graph
- **Frame:** one frame with a dotted background and no border, the same as the build plan's diagrams since PR #29.
- **Lanes:**
  - Each lane is a band with a soft tint from the tokens, alternating between two tints.
  - The lane's label sits at the top left: the letter, the name and the one-line note.
  - While the graph pans sideways, the label stays pinned to the left edge.
- **Steps:** the build plan's n8n-style step cards (56 px, icon, label and sub-line below), placed on a grid of columns and rows inside each lane.
  - Positions are set in the data, so the layout is exact and testable.
  - Number badges sit at the top left of a card.
  - A gate gets an accent outline and a lock badge. A machine-enforced step gets a ⚙ badge.
- **Width:**
  - Every lane is at most 7 columns wide. Only lane G uses all 7: the Router, the 10 jobs in two rows of five, then Self-check.
  - Every other lane is at most 6 columns wide, so the graph is about 1,190 px wide in all.
  - *This changes the agreed design, which said 6 columns; the 10 jobs don't fit in 6.*
- **Cables:**
  - **Within a lane:** curved Bézier cables.
  - **Between next-door lanes:** cables leave the bottom of a card, curve through the gap between the two lanes, and enter the top of the next card.
  - **Skipping lanes:** loop-backs and long cables (for example K3 → C1 or E4 → I1) run in side channels along the graph's left and right edges, so they never cross a step card.
  - **Styles:** solid for flow, dashed accent for loop-backs. Short labels sit on the cable.

### 4.3 Interactions
- **Click a step** (or a legend item) to open the build plan's click panel.
  - The panel shows the step's type (for example "Trigger", "Agent job" or "Approval gate") and label, then its `what`.
  - It sits below or above the step, follows the step on scroll and resize, and closes when the step leaves the screen, on Esc, on the close button, or when the step is clicked again.
  - The step carries `aria-expanded`.
- **Balls:**
  - A spawner launches balls at random 0.7–2 s intervals, at most 5 on the graph at once.
  - Each ball takes one random route from a trigger to an end.
  - Routes include at most one loop-back, taken once and then carrying on, so no ball ever loops forever.
  - Steps and cables light up as a ball passes.
  - Balls play only while the graph is on screen, and never under reduced motion.
- **Scrolling:**
  - The graph scrolls sideways where it doesn't fit, with no scrollbars.
  - Faded edges show there is more. The mouse can drag to pan, and a drag never counts as a click. ‹ › buttons step through the graph.
- **Inside the dialog:** Esc closes the dialog, as on the build plan.
- **Print:** balls, buttons and chips are hidden. The graph and glossary print cleanly, and each lane keeps its tint.

### 4.4 Accessibility
- Steps are buttons with an accessible name (label plus sub-line).
- Each lane also has a screen-reader-only ordered list of its steps and the cables that leave it, so the graph reads as text.
- Focus rings follow the site's tokens.

## 5. Site integration

### 5.1 Code
- **New files:**
  - `data/endToEnd.ts`: types and content for lanes, steps (`id`, `lane`, `at: [col, row]`, `kind`, `label`, `sub`, `icon`, `type`, `what`, `gate?`, `enforced?`, `n?`), cables (`from`, `to`, `kind: 'flow' | 'loop'`, `label?`), legend, glossary, hero and footer.
  - `lib/endToEnd/layout.ts`:
    - Lane geometry from the grid, and cable paths (within a lane, the gap, side channels).
    - Ball routes as measured paths with `stops` and `spans`, in the same shape as the build plan's routes so the lighting logic carries over.
  - `lib/endToEnd/icons.ts`: its own icon helper, because the build plan's is typed to the build plan's icon names.
  - `lib/endToEnd/styles.ts`: CSS for lanes, chips, badges, side channels and the glossary.
  - `lib/endToEnd/render.ts`: `renderEndToEnd()` → a full HTML string. `PAGE_PATH = '/end-to-end.html'`.
  - `lib/endToEnd/client.js`: its own client, adapted from the build plan's (theme mirror, embedded Esc and hash, scroll-spy, panel, balls, scrollers, drag). It can't import the build plan's client as it is, because that file always runs the test matrix.
- **Imported read-only from the build plan:** `esc` from `lib/buildPlan/render.ts`, plus `pageCss` and `Themes` from `lib/buildPlan/styles.ts` as the base look.
- **Scripts:**
  - `scripts/make-e2e.ts` writes `public/end-to-end.html`.
  - `scripts/shoot-e2e.mjs` shoots `public/shots/end-to-end.jpeg` (640×400).
  - `package.json` gets `"e2e-page": "node scripts/make-e2e.ts && node scripts/shoot-e2e.mjs"`. `npm run plan` stays as it is.

### 5.2 Showing the page
- **New view:** `components/projects/EndToEndView.tsx`, a copy of PlanView's pattern: `Window` with `href` and `flush`, and an iframe only while the dialog is open. `PlanView.tsx` is not touched.
- **`data/projects.ts`:**
  - `DOC_VIEWS` becomes `['agentic-framework']`.
  - The End-to-End writeup gains `page: '/end-to-end.html'` and `frameTitle: 'End-to-End Workflow graph'`. Its card on the board stays as it looks now: kicker, title, text and "READ THE WORKFLOW".
  - `BUILDS` uses `/shots/end-to-end.jpeg` for the End-to-End entry.
- **`data/projectDocs.ts`:** the `'end-to-end'` doc is removed. The Agentic Framework doc stays.
- **`components/projects/ProjectViews.tsx`:** mounts `EndToEndView` for `end-to-end`.
- **`lib/seo.ts`:** `STATIC_PAGES` adds `/end-to-end.html`.
- **Head:** a canonical URL, og and twitter tags, and Google Fonts, as on the build plan.

## 6. Testing
- **Build plan safety:**
  - `git diff main -- lib/buildPlan data/buildPlan.ts scripts/make-plan.ts scripts/shoot-plan.mjs components/projects/PlanView.tsx public/build-plan.html` is empty.
  - The build plan's own freshness test stays green.
- **Data (`tests/endToEnd-data.test.ts`):**
  - Step ids are unique, and every cable joins real steps.
  - Every step has a `what` of 20–220 characters. There are 11 lanes, A–K, in order.
  - No two steps in a lane share a cell. Lane G is at most 7 columns wide and every other lane at most 6.
  - Every glossary term appears on the graph. There are no straight quotes in the copy, and there is no mention of GHL or GoHighLevel.
- **Layout (`tests/endToEnd-layout.test.ts`):**
  - Cards don't overlap. Cables between next-door lanes stay in the gap.
  - Cables that skip lanes run in the side channels.
  - Every route starts at a trigger and ends at an end step, and uses at most one loop-back.
  - Every step is reachable by at least one route.
- **Render (`tests/endToEnd-render.test.ts`):**
  - Ids and text are escaped (an injected `<b>` stays text).
  - There is one step button per step, a legend with 5 buttons, 11 lane chips and a glossary.
  - The panel JSON is made safe for a script tag.
  - A freshness test: `public/end-to-end.html` equals `renderEndToEnd()`.
- **Site:** the tests in `tests/projects.test.tsx`, `tests/seo.test.ts` and `tests/no-ghl.test.ts` are updated.
- **Browser (`e2e/end-to-end.spec.ts`, desktop and phone):**
  - The card opens the dialog with the iframe, and "Open in new tab" points at `/end-to-end.html`.
  - The theme mirrors, and Esc closes the dialog.
  - Clicking a step opens the panel with its `what`. Lane chips follow the scroll.
  - Balls run and light up steps. Under reduced motion there are no balls.
  - On phones the graph pans sideways, and the lane label stays pinned.
  - Print media hides the balls.

## 7. Out of scope
- Any change to the build plan page or its code.
- The Agentic Framework card, which keeps its current write-up.
- Real agent names, and any live data.
