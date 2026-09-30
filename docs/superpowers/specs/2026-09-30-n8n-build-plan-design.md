# The n8n build plan: design

**Date:** 2026-09-30
**Status:** Approved 2026-09-30 through the tickable review (every item ticked, no notes)
**Reference:** portfolio.brewedops.cloud/sample-automation-plan.html. It was used for the idea only: a long, sectioned automation blueprint. No copy, layout, scenario, diagram style or code is taken from it.

## 1. Goal

When someone clicks **The build plan** on /projects, they should see a real, detailed automation plan: the thinking done before anything is built in n8n. The plan is a self-contained HTML page. It shows inside the existing dialog and can also be opened on its own.

The work also removes every mention of GoHighLevel from the site, because Justine doesn't work with GoHighLevel.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Client | **Trusted Mover**, the fictional moving company from the sample site in Austin, TX (Central time, USD) |
| Platform | **n8n**, with Claude, Google Sheets, Supabase (as the CRM) and Stripe |
| Scale | 6 workflows (TM-01 to TM-06) and 3 helpers |
| Sections | Before anything is built · Naming · Data model · Trigger map · Workflows · Test matrix · Build order · Handover |
| Disclosure | Small footer note: "A worked example. Trusted Mover is a fictional client." |
| Look | Kraft tokens (Geist, green accent), dark and light, following the site's theme inside the dialog and the device setting on its own |
| Diagrams | An n8n-style node canvas, left to right, with curved connectors |
| Interactions | Sticky nav with scroll-spy · click a node to see its settings · live-run dot · tickable test matrix |
| Phones | Each diagram canvas scrolls sideways, with a swipe hint |
| Authoring | **Generated** from typed data by a script into one self-contained file |
| URL | `/build-plan.html` |
| Also | The board card switches to n8n · Home's fan gets a real screenshot · the page is added to the sitemap · printing gives a clean document |
| GoHighLevel | Support Ticketing write-up deleted · Workflow Creator card deleted · other mentions reworded to n8n |

Two small assumptions for Justine to confirm while reviewing:
- Client emails go through **Gmail**.
- Ops alerts go to **Telegram**, which matches Hermes and the Reel worker.

## 3. Content

### 3.1 Hero
- Kicker: `N8N BUILD PLAN · TRUSTED MOVER`
- Title: a one-line promise, something like "Every quote, booking and move, planned before a single node is placed."
- Lede: 2–3 sentences covering the scope, the tools, and the fact that a person approves anything a client sees.
- Meta row: Client · Platform · Workflows (6 + 3 helpers) · Build time (about 11 h) · Prepared by Justine Acosta.
- A legend of node kinds (see §4.2).

### 3.2 Before anything is built
This section carries over the site's current "Before anything is clicked" idea, applied to the whole system.
- **Outcome:** every quote request is answered within 5 minutes, and nothing a client sees goes out without a person's yes.
- **Trigger:** the list of entry points, summarised; the detail is in §3.5.
- **Exits:** every way a job leaves: Closed, Lost, Cancelled, or Claim open.
- **Out of scope:** payroll, truck GPS and accounting exports.

### 3.3 Naming convention
Each pattern is shown in a code panel with examples, plus a one-line rule.
- **Workflows:** `TM-01 · Quote request → Qualified lead`. Helpers are named `TM-H01 · Error handler`.
- **Nodes:** verb + object, such as "Find contact" or "Draft estimate". Default names like "HTTP Request1" are never kept.
- **Webhook paths:** `/tm/quote`, `/tm/change`, `/tm/approve`.
- **Credentials:** `TM · Stripe (live)`, `TM · Stripe (test)`.
- **Supabase:** snake_case, with `_at` for timestamps and `_usd` for money.
- **Sheets tabs:** Title Case, one purpose per tab.
- **Rule of thumb:** if a workflow's list of executions doesn't read like a sentence, rename its nodes.

### 3.4 Data model
- **Supabase tables:**
  - `contacts` (id, name, email, phone, created_at)
  - `jobs` (id, contact_id, stage, move_date, size, from_zip, to_zip, estimate_usd, deposit_paid_at, crew, nudges_sent, source)
  - `events` (job_id, type, payload, at). Every workflow writes one event, so the next run knows what already happened.
- **Stages** (`jobs.stage`), drawn as a small stage strip:
  `0 New lead → 1 Survey booked → 2 Estimate sent → 3 Booked → 4 Move week → 5 Moved → 6 Closed`
  Two side exits: `Lost` and `Cancelled`.
- **Sheets tabs:** Quote log, Rate card, Crew schedule, Test matrix, Errors.

### 3.5 Trigger map
Each entry point is drawn going to the workflow it fires:

| Source | Event | Workflow |
|---|---|---|
| Quote form on the site | Webhook `/tm/quote` | TM-01 |
| Cal.com | BOOKING_CREATED | TM-02 |
| Stripe | checkout.session.completed | TM-03 |
| Schedule | hourly | TM-03 (deposit sweep) |
| Schedule | daily 07:00 CT | TM-04 |
| Crew schedule sheet | row status → Done | TM-05 |
| Reschedule form | Webhook `/tm/change` | TM-06 |
| Any failure | Error Trigger | TM-H01 |

### 3.6 Workflows
Every workflow gets its own section, containing:
- a header card with **Outcome · Trigger · Exits**;
- the node canvas;
- a "Watch for" list of 2–4 items;
- for the main nodes, a settings panel (node type plus 2–4 key settings).

In the node lists below, `→` means "next step" and `?` marks a branching node.

- **TM-01 · Quote request → Qualified lead:** Webhook · Quote form → Normalize fields → Find contact → *Duplicate in 24 h?*
  - yes → merge into the open job, then end.
  - no → **Claude · Extract move details** (size, date, from, to, stairs, specialty items, missing fields) → *Anything missing?*
    - yes → Claude drafts one question → send it → stage 0 "needs info".
    - no → Upsert contact + create job → Append to the Quote log → TM-H02 notify → send the survey booking link.
- **TM-02 · Survey → Estimate sent:** Cal.com booking → stage 1 → TM-H03 business-hours gate → wait until 24 h before → reminder → wait until the survey ends → estimator's inventory form → Rate card lookup (crew × hours × rate + truck + materials) → **Claude · Draft estimate** → **Wait for approval** (a person) → *Approved?*
  - no → back to the owner with a note.
  - yes → Stripe Checkout (20% deposit) → send the estimate → stage 2.
  - A no-show sends a rebook link.
- **TM-03 · Deposit paid → Move booked:** Stripe webhook → verify the signature → find the job by `metadata.job_id` → stage 3 → append a row to the Crew schedule → send the confirmation and prep checklist → TM-H02.
  - A second lane holds the hourly sweep: stage 2 older than 72 h → *Nudges sent?* 0 → nudge 1 · 1 → nudge 2 · 2 → stage Lost.
- **TM-04 · Move week → Crew dispatched:** daily 07:00 → jobs 7/2/1 days out → *Days out?*
  - 7 → stage 4 + packing guide.
  - 2 → *Crew assigned?* no → TM-H02 urgent alert · yes → crew confirmation.
  - 1 → arrival window email.
- **TM-05 · Move done → Paid + reviewed:** crew sheet row Done → stage 5 → Stripe invoice for the balance → wait for `invoice.paid` → wait 1 day → one-question feedback email → wait for the reply → **Claude · Classify reply** → *Kind?*
  - damage → Claim row + TM-H02 urgent alert.
  - complaint → task for the owner.
  - praise → Google review link.
  - Then stage 6 Closed.
- **TM-06 · Cancel or reschedule:** Webhook `/tm/change` → find the job → *Type?*
  - reschedule → check the Crew schedule → *Slot free?* yes → move the date and confirm · no → offer 3 dates.
  - cancel → notice-period policy (≥14 days: 100% · 7–13 days: 50% · under 7 days: deposit kept) → Stripe refund → stage Cancelled → free the crew slot → confirm.
- **Helpers:**
  - TM-H01 Error handler: Error Trigger → Errors tab → Telegram message with the execution link.
  - TM-H02 Notify ops: Execute Workflow Trigger → format → Telegram.
  - TM-H03 Business-hours gate: the next allowed send time (08:00–19:00 CT, Monday to Saturday) → Wait until.

### 3.7 Test matrix
About 20 rows, one for each branch above. The columns are ID, Workflow, Branch, Test input, Expected, and a tick box. Ticks are saved in the visitor's browser (localStorage, wrapped in try/catch) and can be cleared with a Reset button.

### 3.8 Build order
Five phases, each a checklist with a time estimate:

| Phase | Covers | Time |
|---|---|---|
| 1 · Foundation | Supabase schema, credentials, Sheets tabs, H01–H03 | 2 h |
| 2 · Intake | TM-01, TM-02 | 3 h |
| 3 · Money | TM-03, TM-05 | 2.5 h |
| 4 · Operations | TM-04, TM-06 | 2 h |
| 5 · Test and hand over | Test matrix, handover | 1.5 h |

Total: about 11 h.

### 3.9 Handover
A one-page summary written for the client:
- **What it does:** 5 lines.
- **What breaks it:** renamed sheet columns, an expired Stripe key, changes to Cal.com event types.
- **Who to call.**
- **Where the logs are.**

Footer: the disclosure note and "Built by Justine Acosta".

## 4. Visual design

### 4.1 Page
- **Tokens:** Kraft's tokens are read from `app/globals.css` when the page is generated, so they can't drift. A test checks this.
- **Fonts:** Geist and Geist Mono from Google Fonts, with system fallbacks.
- **Layout:**
  - one reading column, about 1100 px wide;
  - each section has a numbered kicker, a heading and a one-line blurb;
  - a narrow side rail holds the "why" notes on wide screens and moves above the content on narrow ones.
- **Theme:**
  - Inside the dialog (same origin), the page copies the parent page's `data-theme` and `data-a11y-*` attributes and follows their changes, using a MutationObserver.
  - Opened on its own, it follows `prefers-color-scheme` and `prefers-reduced-motion`.

### 4.2 Node canvas
- **Node:** a 56 px rounded card with an icon, and the label and a secondary line below it, like n8n. Ports are dots on the left and right edges. Connectors are cubic curves; a branch's label (yes/no, 7/2/1…) sits on its connector.
- **Node kinds**, each with a distinct treatment and listed in the legend:

  | Kind | Look |
  |---|---|
  | Trigger | Rounded left edge (the n8n trigger shape) |
  | Action | Plain card |
  | AI · Claude | Accent outline with a sparkle icon |
  | Branch | IF/Switch icon, with labelled outputs |
  | Wait | Dashed outline with a timer icon |
  | Person approves | Accent fill |
  | Helper call | Card with a stacked-page icon |
  | End / exit | Muted chip |

- **Layout** is calculated, not placed by hand:
  - column = the node's longest-path depth from the trigger;
  - rows come from branch order, so the first output stays on the main line and later outputs drop below it.
  - Tests check that no nodes overlap and that every connector joins two existing ports.
- **Icons:** Phosphor icons rendered to inline SVG when the page is generated. The icons are MIT licensed, and the page still has no dependency at runtime.
- **Accessibility:** each canvas is a `<figure>` with a caption. Its steps are also given as an ordered list that screen readers and printing use.

### 4.3 Interactions
All interactions use vanilla JS inlined in the page, with no libraries.
- **Sticky nav:** section links, with the current one highlighted by an IntersectionObserver. It scrolls sideways on phones.
- **Node settings:** every node is a `<button>`. Clicking it opens a small panel with the node type and its key settings. Esc or clicking outside closes it, and focus goes back to the node.
- **Live run:** a dot travels along each canvas's main path using CSS `offset-path`, only while the canvas is on screen. It is turned off under reduced motion (from the site or the device).
- **Test matrix:** tick boxes remembered in localStorage.
- **Print:** always light, no nav or animation, each canvas kept on one page, and links printed with their addresses.

## 5. Site integration

### 5.1 Showing the page
New `components/projects/PlanView.tsx`:
- It uses the same window chrome as `Window` (traffic lights, the address field showing `/build-plan.html`, an Open-in-new-tab button, Close).
- The body is an `<iframe src="/build-plan.html" title="The build plan">`.
- The iframe is same origin and not sandboxed, because we write this file ourselves. That is what lets the theme copying in §4.1 work.
- The dialog is still labelled "The build plan" and still opens from `#build-plan`, the board card and ⌘K.

### 5.2 Data changes
- `data/projects.ts`:
  - `DOC_VIEWS` drops `build-plan` and `support-desk`, and `PROJECT_VIEWS` drops `support-desk`.
  - The board card's kicker becomes `N8N BUILD PLAN`, and its steps become `['Webhook', 'Claude', 'Approve?', 'Stripe']`.
  - The Support Ticketing write-up is removed from `WRITEUPS`.
  - The reel captions say "n8n workflow screenshot".
  - `BUILDS` gets the real screenshot for The build plan.
- `data/projectDocs.ts`:
  - `DOCS['build-plan']` and `DOCS['support-desk']` are deleted.
  - End-to-End is reworded: its stack chip becomes n8n, and the triggers card reads "caught by n8n webhooks".
  - The roster line becomes "from n8n audits to client deliverables".
  - The Workflow Creator card is deleted, along with any icon imports nothing else uses.
- `lib/commands.ts`: ⌘K loses the Support Ticketing entry.
- **Sitemap:** `/build-plan.html` is added through `lib/seo.ts`. The page has its own `<title>`, meta description and canonical URL.

### 5.3 Generation
- `data/buildPlan.ts` holds the typed content, and uses relative imports only so Node can run it.
- `lib/buildPlan/layout.ts` is a pure function that calculates the canvas layout.
- `lib/buildPlan/render.ts` is a pure function that builds the HTML string, with CSS and JS inlined. Everything is escaped.
- `scripts/make-plan.ts` writes `public/build-plan.html`, run with `npm run plan`.
  - Node 26 runs TypeScript directly, the same way `placeholders.ts` does.
  - The screenshot is taken by extending `make-thumbs.mjs`, or with a small add-on.
- The generated file is committed, and a test fails if it's out of date with its source.
- Size budget: under 300 KB.

## 6. Testing

**Unit tests (Vitest):**
- **Content:** 6 workflows plus 3 helpers. IDs are unique and every node an edge points to exists. Every branching node has labelled outputs, and every test-matrix row points to a real branch. The word "GoHighLevel" appears nowhere.
- **Layout:** no nodes overlap, nodes sit in columns by depth, and the main path stays on row 0.
- **Render:**
  - The sections appear in order, with the hero and the disclosure note.
  - Tokens match `readTokens`.
  - Nodes are buttons, and each canvas has a figure, a caption and the step list.
  - Visitor-facing strings are escaped.
  - The generated file matches `render()`.
- **Updated tests:**
  - `projects.test.tsx`: the build-plan section test is replaced, and the support-desk tests and hashes are removed.
  - `commands.test.ts`: the ⌘K list.
  - `seo` and sitemap tests: the new path.
  - A new site-wide test: no "GoHighLevel" or "GHL" anywhere in `data/`.

**E2E (Playwright, desktop and phone):**
- The card opens the dialog with the iframe loaded, and Open in new tab points to `/build-plan.html`.
- Switching the site's theme changes the iframe's theme.
- A node's settings panel opens and closes with Esc.
- A test-matrix tick survives a reload.
- On a phone, the canvas scrolls sideways and the page doesn't.
- `#support-desk` no longer opens anything.
- The e2e tests for `projects`, `palette` and `phone` are updated.

## 7. Out of scope
- A real n8n export (JSON) of these workflows.
- A theme toggle inside the standalone page.
- Other sample plans. The URL leaves room for them later.
