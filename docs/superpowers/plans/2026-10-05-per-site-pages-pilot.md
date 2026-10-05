# Per-site case pages: pilot implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tooling for per-site case pages, a tab row in the site preview window, and Oriel's five pages (Automation, Build plan, Framework, End-to-end, AI agents).

**Architecture:** Each site's five pages are typed content files in `data/cases/<site>/`, using today's page types. `scripts/make-cases.ts` feeds them through the five existing `render*()` functions into `public/cases/<site>/*.html`. A light registry (`data/cases/pages.ts`) tells the client-side `SitePreview` which sites have pages, without bundling their content.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before touching app code), React 19, TypeScript run directly by Node (type stripping, `.ts` import extensions), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-per-site-pages-design.md`

## Global Constraints

- Branch `feat/per-site-pages` (already exists, based on `feat/six-new-sample-sites` / PR #46).
- The five general pages must not change: `public/automations.html`, `build-plan.html`, `agentic-framework.html`, `end-to-end.html` and `ai-agents.html` regenerate byte-identical (ignoring `\r`).
- No edits to `public/samples/*.html` and no new tools: tool ids only from `lib/brand/tools.ts` (`n8n supabase gmail google-sheets telegram stripe claude cal-com claude-code vs-code codex github vercel hubspot airtable make zapier`).
- Copy: curly quotes and apostrophes only (no `'` or `\"` in any content string), never “Cursor” (the editor is VS Code), never GoHighLevel/HighLevel/GHL, step labels and sub-lines ≤ 22 characters.
- Oriel's code prefix is `OR`: flows `OR-01` (n8n), `OR-02` (Make), `OR-03` (Zapier); Build Plan helpers `OR-H01…`.
- Oriel's folder and key is `oriel-portugal-residences`. Its site link is `/samples/oriel-portugal-residences.html` and its pages are `/cases/oriel-portugal-residences/<file>`.
- Every page carries a sample note naming Oriel as a fictional business, not a client project, and marks figures illustrative.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Client bundle size.** `SitePreview` is a client component. It must import only `data/cases/pages.ts`, never `data/cases/index.ts`, or every site's content ships to every visitor. Task 3 adds a test that `pages.ts` has no import of `index.ts` or any content file, and that `CASE_SITES` equals `Object.keys(CASES)`.
2. **Theme and settings inside the window.** Case pages only follow the portfolio's theme, contrast and performance settings when their iframe has no `sandbox` (the page's `client.js` reads `window.parent.document`). The sample site's iframe must keep its sandbox. Task 8 asserts both.
3. **Canonical URL.** Today each renderer hard-codes `PAGE_PATH`. A case page must point its `<link rel="canonical">` at its own path, not `/automations.html`. Task 1 asserts it.
4. **Stale generated pages.** Someone edits `data/cases/...` and forgets `npm run cases`. Task 3 adds a test that re-renders every case page and compares it to the committed file.
5. **Switching sites while a tab is open.** Opening Oriel, picking AI agents, closing, then opening Westmere (no cases) must show Westmere's site with no tab row, and reopening Oriel must start on Site. Task 8 tests both.

---

## Oriel facts (from the rendered site; all content must agree with these)

- **Oriel Residential, Lda.**, Lisbon, est. 2018, founded by Inês Valadares and Tomás Reis. Studio at Rua de São Bento 318, 1250-221 Lisboa, Mon–Sat by appointment. studio@oriel.pt, +351 21 000 0000. Tagline “First in model. Then in stone.”
- **Idea:** every residence is built twice, first as a walkable digital twin (from architects’ drawings, the structural model and a laser survey of the site), then in stone. Survey → Model → Walk → Decide. The model is kept after handover as the owners’ record of what sits behind every wall.
- **Residences:** Pinhal (Comporta, 6 courtyard houses 180–240 m², handover from spring 2027, under construction); Lioz (Lisbon, Estrela, 24 apartments + 2 penthouses, layouts 74/118/133/196 m², construction from March 2027, model open; Residence 3B is three bedrooms, level 3, 133 m² + 34 m² terraces); Socalco (Porto, Foz do Douro, 9 homes 160–290 m², completion 2028, planning approved); Eucalipto (Sintra, 3 houses 260–310 m², completed 2025, visits by appointment).
- **The one form (“Private viewing”, `#viewing`):** Name, Email, Which residence? (Pinhal / Lioz / Socalco / Eucalipto / Not sure yet), Where? (At the studio in Lisbon / At home, with our headset), button “Request a viewing”. Promise: “We reply within one working day.” A viewing takes about ninety minutes; an architect from the project walks with you.
- **Other calls to action:** “Schedule a private viewing”, “Book a guided walkthrough”, “Walk <residence> →”, “Contact the studio →” (email), Journal (“All entries →”), Careers.
- Figures are illustrative; the company and developments are fictional.

### Oriel decisions (pinned by this plan)

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `OR-01` | n8n | Private viewing request: qualify, match an architect, book, confirm within one working day; a home viewing also books the headset delivery | The viewing form |
| `OR-02` | Make | Studio inbox: Claude sorts mail to studio@oriel.pt (buyer, owner after handover, press, supplier, job applicant) and routes it; buyers go to HubSpot | A new email to studio@oriel.pt |
| `OR-03` | Zapier | Model revision notice: when a residence’s model gets a new revision, everyone who walked that residence gets a plain note of what changed, after the project architect approves it | A new revision row in Airtable |

AI agents: 1 RAG chatbot, **Residence Q&A bot** (answers from residence sheets, model revision notes, journal and studio FAQs; hands off to a viewing booking or the studio), then 2 agents: **Viewing brief agent** (before each viewing, prepares the walking architect a brief from the request, HubSpot history and the residence’s rooms) and **Buyer follow-up agent** (after a viewing, drafts a follow-up that names the rooms and questions raised; waits for the architect’s yes).

---

### Task 1: Site link and canonical path in all five renderers

**Files:**
- Modify: `lib/brand/render.ts` (add `SiteLink`, `siteBack`)
- Modify: `data/automations.ts`, `data/buildPlan.ts`, `data/agenticFramework.ts`, `data/endToEnd.ts`, `data/agents.ts` (types only: optional `site`)
- Modify: the `hero()` and the canonical line in `lib/automations/render.ts`, `lib/buildPlan/render.ts`, `lib/agenticFramework/render.ts`, `lib/endToEnd/render.ts`, `lib/agents/render.ts`
- Modify: `lib/buildPlan/styles.ts` (`.home` rules also cover `.site-home`)
- Test: `tests/case-render.test.ts`

**Interfaces:**
- Produces: `export type SiteLink = { name: string; href: string; page: string }` and `export function siteBack(s: SiteLink | undefined): string` in `lib/brand/render.ts`. Each of the types `Automations`, `Plan`, `AgenticFramework`, `EndToEnd` and `Agents` gains `site?: SiteLink`. `page` is the case page's own path, e.g. `/cases/oriel-portugal-residences/automation.html`.

- [ ] **Step 1: Write the failing tests** in `tests/case-render.test.ts`. A table of the five `[name, render, data, PAGE_PATH, publicFile]` rows; for each:
  - `it('<name>: without a site, renders the committed general page byte for byte')`: `expect(render()).toBe(readFileSync('public/<file>', 'utf8').replace(/\r/g, ''))`.
  - `it('<name>: with a site, links back to it and points canonical at its own page')`: render `{ ...data, site: { name: 'Oriel', href: '/samples/oriel-portugal-residences.html', page: '/cases/oriel-portugal-residences/x.html' } }`, parse with `DOMParser`, and expect:
    - `a.site-home` has text `← Oriel site`, `href` the sample page and `target="_top"`
    - `a.home` is still present
    - `link[rel=canonical]` `href` is `/cases/oriel-portugal-residences/x.html`
  - `it('<name>: escapes the site name')`: with `name: 'A & <B>'`, the raw HTML contains `A &amp; &lt;B&gt;`.
- [ ] **Step 2: Run** `npx vitest run tests/case-render.test.ts`. Expected: the “with a site” and “escapes” cases FAIL, and the byte-for-byte cases PASS (if they fail, regenerate nothing and investigate before going on).
- [ ] **Step 3: Implement.**
  - `siteBack(undefined)` returns `''`. Otherwise it returns `<a class="home site-home" href="<href>" target="_top">← <name> site</a>`, escaped with a local escape function (do not import `esc` from `lib/buildPlan/render.ts`; that would be circular).
  - Each `hero()` puts `${siteBack(g.site)}` right after its existing `.home` link.
  - Each canonical line uses `${g.site?.page ?? PAGE_PATH}`.
  - Because `.site-home` also has the `home` class, the existing `:root[data-embedded] .home{display:none}` hides it inside windows. Add only spacing if the two links sit side by side, inside the existing `.hero` flex.
- [ ] **Step 4: Run** `npx vitest run tests/case-render.test.ts tests/*-render.test.ts` and `npx tsc --noEmit`. Expected: all PASS.
- [ ] **Step 5: Commit** `feat: case pages can link back to their site and name their own canonical page`.

### Task 2: A platform per Build Plan workflow

**Files:**
- Modify: `data/buildPlan.ts` (`Workflow` gains `platform?: Platform`, type-imported from `./automations.ts`)
- Modify: `lib/buildPlan/render.ts` (`workflowSection`, `canvas` figcaption), `lib/buildPlan/styles.ts`
- Test: `tests/case-render.test.ts`

**Interfaces:**
- Consumes: `Platform` and `PLATFORMS` from `data/automations.ts`, and `logo(id: ToolId, size: number)` from `lib/brand/render.ts`.
- Produces: `Workflow.platform?: 'n8n' | 'make' | 'zapier'`.

- [ ] **Step 1: Write the failing tests.**
  - `it('plan: a workflow with a platform shows its logo and name on its section and canvas')`: render the plan with `workflows[0]` given `platform: 'make'`. Expect that section's `.shead` and the canvas `figcaption` each contain `.platform` with text `Make` and an `svg`.
  - `it('plan: a workflow without a platform shows none')`: `public/build-plan.html` has no `.platform` element. This is already covered byte for byte, but assert it explicitly.
- [ ] **Step 2: Run** `npx vitest run tests/case-render.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `workflowSection` and `canvas` add `<span class="platform">${logo(PLATFORMS[p].tool, 14)}${PLATFORMS[p].name}</span>` when `w.platform` is set. Nothing changes when it is unset. Add a `.platform` style in `lib/buildPlan/styles.ts`: an inline-flex chip in `--ink2`, the same size as `.kicker`.
- [ ] **Step 4: Run** `npx vitest run tests/case-render.test.ts tests/buildPlan-render.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: a build plan workflow can name its platform`.

### Task 3: Case registry, build script, content checks and robots

**Files:**
- Create: `data/cases/pages.ts` (light, client-safe)
- Create: `data/cases/index.ts` (heavy: content, Node and tests only)
- Create: `scripts/make-cases.ts`; Modify: `package.json` (`"cases": "node scripts/make-cases.ts"`)
- Modify: `app/robots.ts`, `tests/seo.test.ts`
- Create: `tests/cases-data.test.ts`, `tests/make-cases.test.ts`

**Interfaces:**
- Produces, in `data/cases/pages.ts`:
  - `export type CasePageId = 'automation' | 'build-plan' | 'agentic-framework' | 'end-to-end' | 'ai-agents'`
  - `export const CASE_PAGES: { id: CasePageId; label: string; file: string }[]`, in this order: Automation `automation.html` · Build plan `build-plan.html` · Framework `agentic-framework.html` · End-to-end `end-to-end.html` · AI agents `ai-agents.html`
  - `export const CASE_SITES: string[]` (folder keys; `[]` until Task 8)
  - `export const casePath = (key: string, file: string) => \`/cases/${key}/${file}\``
  - `export function casePagesFor(siteFile: string): { id: CasePageId; label: string; src: string }[]`, which returns `[]` when the site's key (its file name without `.html`) is not in `CASE_SITES`
- Produces, in `data/cases/index.ts`:
  - `export type CaseSet = { automation?: Automations; plan?: Plan; framework?: AgenticFramework; endToEnd?: EndToEnd; agents?: Agents }`
  - `export const CASES: Record<string, CaseSet>`, `{}` for now
  - `export function withSite<T extends object>(content: T, key: string, page: CasePageId): T & { site: SiteLink }`, which fills `site` from `data/projects.ts` `projects.sitesView.sites` (by `file === key + '.html'`) and `casePath`
- Produces: `export function renderCases(cases: Record<string, CaseSet> = CASES): { path: string; html: string }[]` in `lib/cases/render.ts`. It is pure. `scripts/make-cases.ts` stays a few lines like `make-plan.ts`: it calls it and writes the files.

- [ ] **Step 1: Write the failing tests.**
  - `tests/seo.test.ts`: change the expectation to `disallow: ['/samples/', '/cases/']`.
  - `tests/make-cases.test.ts`: `it('writes every page each case has, and the committed files are up to date')`. For each `{ path, html }` of `renderCases()`, expect `readFileSync('public' + path, 'utf8').replace(/\r/g, '')` to equal `html`. Also `it('maps CASE_PAGES ids to the five renderers')`: render a one-site fake `CASES` built from the general data and check the five paths.
  - `tests/cases-data.test.ts`:
    - `it('lists exactly the sites in CASES, and pages.ts never imports content')`: `CASE_SITES` sorted equals `Object.keys(CASES)` sorted, and the source of `data/cases/pages.ts` does not match `/from '\.\/(index|[a-z-]+\/)/`.
    - `it('keys every case by a real sample site')`: each key + `.html` is a `file` in the sites list.
    - One `describe` per page type that loops over `Object.entries(CASES)` and checks whichever pages are present, using the checks the general data tests make, generalised:
      - **automation:** 3 flows; platforms `['n8n','make','zapier']`; codes `<P>-01..03`; `href` is the site's `src`; node ids unique across the page; edges join real nodes; every node has `what`, `reads` (≥1) and `why`; at most 2 tools per node; every branch's ways out are labelled.
      - **plan:** workflow codes equal the automation flow codes, with the same platform each; helper codes match `<P>-H\d\d`; the edge, branch and trigger rules from `tests/buildPlan-data.test.ts` (`gives every decision…`, `starts every flow at a trigger…`, `names a node type and at least one setting…`); at least 2 test rows per workflow, ids unique; 5 build phases.
      - **agents:** builds are 1 `rag` then 2 `agent`; every build's routes and pins exist on its diagram; routes start at a `start` step and run along real non-index cables; each diagram's routes pass every step and every non-index cable; Claude is in every build's tools; `business.name` is the site's name.
      - **endToEnd:** 1–11 lanes with ids from `A` in order; steps sit in real lanes, one per spot, `at[0] ≤ 6`; cables join real steps; flow cables are acyclic (Kahn's algorithm, as in `tests/endToEnd-data.test.ts`); at least one `trigger` and one `end`.
      - **framework:** the 8 sections in the general page's order; loop ids unique and one per spot; cables join real steps; flow cables acyclic; each rule `R1..R4` pinned at most once; `example.link.href` is that site's `end-to-end.html` case path; every glossary term appears elsewhere on the page.
      - **every page:** `site` is set by `withSite`; `title` contains the site's name; step labels and sub-lines ≤ 22 characters; the copy rules from Global Constraints, checked on `JSON.stringify(page)`; tools are valid `ToolId`s.
    - `it('has no PLACEHOLDER in data/cases')`: `findPlaceholders()` has no hit under `data/cases/`.
- [ ] **Step 2: Run** `npx vitest run tests/cases-data.test.ts tests/make-cases.test.ts tests/seo.test.ts`. Expected: FAIL (modules missing, robots).
- [ ] **Step 3: Implement** `pages.ts`, `index.ts`, `lib/cases/render.ts` and `scripts/make-cases.ts`:
  - `renderCases()` maps `automation→renderAutomations`, `plan→renderPlan`, `framework→renderAgenticFramework`, `endToEnd→renderEndToEnd` and `agents→renderAgents`, with paths from `casePath`.
  - The script `mkdirSync`s each folder, writes the files and logs `public/cases/<key>/<file>: <KB> KB` per file.
  - Add `'/cases/'` to the `disallow` list in `app/robots.ts`.
- [ ] **Step 4: Run** the same tests, then `npm run cases` (it writes nothing yet) and `npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: a registry, build command and content checks for per-site case pages`.

### Tasks 4–7: Oriel's content, one page per task

Each task follows the same steps:
1. Write the content file (`export default` of the page's type, type-only imports, house style).
2. Register it in `CASES['oriel-portugal-residences']` via `withSite(content, key, '<id>')`.
3. Run `npx vitest run tests/cases-data.test.ts`. The new page's checks must PASS.
4. Run `npm run cases`, then `npx vitest run tests/make-cases.test.ts`. Expected: PASS.
5. Open the generated file in a browser (`npm run dev`, then `/cases/oriel-portugal-residences/<file>`) and check it renders with no console errors in both themes.
6. Commit `feat(oriel): the <page> case page`.

Use the **Oriel facts** and **Oriel decisions** above. Use the matching general file in `data/` as the model for depth, tone and every field's meaning. Rewrite all of it for Oriel; never copy Trusted Mover, Harbor & Pine or Justine's own build content.

### Task 4: Oriel · Automation

**Files:** Create `data/cases/oriel-portugal-residences/automation.ts` (`Automations`). Modify `data/cases/index.ts`. Generated: `public/cases/oriel-portugal-residences/automation.html`.

- `title: 'Oriel · Automation'`, kicker `AUTOMATION · ORIEL`, and a heading and lede about what happens after someone asks Oriel for a viewing or writes to the studio.
- The `OR-01/02/03` flows exactly as in the decisions table, each 5–9 nodes.
  - `OR-01` reads the form fields by their real names (Name, Email, Which residence?, Where?). It branches on Where? (studio or home headset) and on “Not sure yet”. It ends with a confirmation inside one working day.
  - `OR-02` has a Claude classify step and a labelled branch per kind of mail.
  - `OR-03` has a person-approves step (the project architect) before anything reaches a buyer.
- `sample`: “Sample flows for Oriel, a fictional developer used across this portfolio, not a client project.”

### Task 5: Oriel · Build plan

**Files:** Create `data/cases/oriel-portugal-residences/buildPlan.ts` (`Plan`). Modify `data/cases/index.ts`. Generated: `build-plan.html`.

- `title: 'Oriel · Build plan'`, kicker `BUILD PLAN · ORIEL`.
- `workflows` are `OR-01` (`platform: 'n8n'`), `OR-02` (`'make'`) and `OR-03` (`'zapier'`), with the same titles and outcomes as Task 4, in more depth.
  - Node `type`s use each platform's module names, e.g. `n8n · Webhook`, `Make · Gmail › Watch emails`, `Zapier · Airtable › New record`.
  - Every node has at least 1 setting.
- Helpers `OR-H01` (alert the studio on Telegram) and `OR-H02` (log a failed run to Google Sheets), plus more if the flows need them.
- Every section (start, naming, data, triggers, tests, build, handover) is written for Oriel:
  - Data tables include viewings and buyers.
  - Job stages run from request to viewing, walked, reserved or not now.
  - At least 2 test rows per workflow, covering each branch.
  - 5 build phases, with no durations.
- The footer says the client is fictional.

### Task 6: Oriel · AI agents & RAG bots

**Files:** Create `data/cases/oriel-portugal-residences/agents.ts` (`Agents`). Modify `data/cases/index.ts`. Generated: `ai-agents.html`.

- `title: 'Oriel · AI agents and RAG chatbots'`.
- Builds: the three from the decisions paragraph, each with a worked example:
  - Asked/Answer for the bot, e.g. the winter sun in Residence 3B’s living room (09:25–16:55)
  - Trigger/Result for each agent
- Both diagrams are rewritten for Oriel's sources and channels:
  - Sources: residence sheets, model revision notes, journal, studio FAQs (as `docs`/`pdf` icon pins), and Airtable and HubSpot (as logos).
  - Channels: the site chat and email.
- Guardrails include “never quotes a price or a date not in the residence sheet” and “anything to a buyer waits for an architect’s yes”.

### Task 7: Oriel · End-to-end and Framework

Two files that link to each other, so one task. Commit them together.

**Files:** Create `data/cases/oriel-portugal-residences/endToEnd.ts` (`EndToEnd`) and `agenticFramework.ts` (`AgenticFramework`). Modify `data/cases/index.ts`. Generated: `end-to-end.html`, `agentic-framework.html`.

- **End-to-end:** `title: 'Oriel · End-to-end workflow'`. Oriel's whole system as one graph, with these lanes in order:
  - A Visitor
  - B Website
  - C Viewing request (`OR-01`)
  - D Studio inbox (`OR-02`)
  - E Model revisions (`OR-03`)
  - F Residence Q&A bot
  - G Viewing brief agent
  - H The viewing
  - I Buyer follow-up agent
  - J Reservation
  - K Owner record (the model kept after handover)

  The graph starts at the triggers (form, email, revision, chat question), has approval gates where a person must say yes, and has loop-backs (e.g. “not now” back to follow-up). The glossary only uses terms that appear on the graph.
- **Framework:** `title: 'Oriel · Agentic framework'`. The same 8 sections, rewritten as how Justine would build Oriel's site and automations with AI:
  - Jobs and tools may differ from the general page.
  - There are 4 rules (`R1–R4`), each pinned where it applies on the loop.
  - The worked example takes `OR-01` through the loop.
  - `example.link` is `{ label: 'See Oriel’s end-to-end workflow', href: '/cases/oriel-portugal-residences/end-to-end.html' }`.

### Task 8: The tab row in the site preview

**Files:**
- Modify: `components/projects/SitePreview.tsx`
- Modify: `data/projects.ts` (`sitesView.preview`: `siteTab: 'Site'`, `tabsLabel: 'Pages for this site'`)
- Modify: `data/cases/pages.ts` (`CASE_SITES = ['oriel-portugal-residences']`)
- Modify: `data/cases/index.ts` (add a completeness check: every `CASES` entry has all five pages, as a test below)
- Test: `tests/sites.test.tsx`, `tests/cases-data.test.ts`, `e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `casePagesFor(site.file)` from `data/cases/pages.ts` only.

- [ ] **Step 1: Write the failing tests.**
  - `tests/cases-data.test.ts`, `it('gives every case all five pages')`: every `CASES` value has `automation`, `plan`, `framework`, `endToEnd` and `agents`.
  - `tests/sites.test.tsx`:
    - `it('shows a tab row only for a site with case pages')`: opening Oriel shows a `tablist` named `Pages for this site` with tabs `Site, Automation, Build plan, Framework, End-to-end, AI agents`, and `Site` is selected. Opening Westmere shows no `tablist`.
    - `it('a tab swaps the page, the address bar and the new-tab link')`: clicking `Automation` sets the iframe `src` and the `Open in new tab` `href` to `/cases/oriel-portugal-residences/automation.html`, and the address text ends with that path.
    - `it('keeps the site sandboxed and loads case pages unsandboxed')`: on Site, the iframe's `sandbox` contains `allow-scripts` and not `allow-same-origin`. On Automation, the iframe has no `sandbox` attribute.
    - `it('says where a missing case page goes')`: with `answer(404)`, clicking `AI agents` shows the text `ai-agents.html` and no iframe.
    - `it('starts on Site every time, and a site without cases shows no tabs after one with them')`: open Oriel, pick AI agents, close, open Westmere (no tablist, its `src`), close, open Oriel again (`Site` selected).
    - `it('moves between tabs with the arrow keys')`: ArrowRight from `Site` focuses and selects `Automation`, and ArrowLeft from `Site` wraps to `AI agents`.
  - `e2e/projects.spec.ts`, `test('Oriel’s preview steps through its five case pages')`:
    - Open `/projects#sites` and open Oriel from the keyboard list.
    - For each tab, select it and expect the frame's `h1` to contain the page's heading.
    - Collect `console` errors and `pageerror`s throughout, and expect none.
    - Esc from a case tab closes the preview only.
- [ ] **Step 2: Run** `npx vitest run tests/sites.test.tsx tests/cases-data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - State: `tab: 'site' | CasePageId`, reset to `'site'` whenever `site` changes (use the same “store the last value and compare during render” pattern the component already uses for `shown`).
  - `src`: the selected tab's `src`, or `shown.src` for Site. The HEAD check, the address text, the new-tab link and the missing message all use `src`, and the missing message shows that page's file name.
  - Tab row: a `role="tablist"` row of buttons (`role="tab"`, `aria-selected`, roving `tabIndex`, ArrowLeft/ArrowRight wrapping, Home/End), placed between the title bar and the frame.
    - Style it with the chrome tokens already in the file (`border-b1`, `bg-s0`, `text-ink2`, `text-ink` for the selected tab).
    - Use `overflow-x-auto whitespace-nowrap` so it scrolls sideways on phones.
  - Iframes:
    - On Site, keep the existing iframe.
    - On a case tab, use `<iframe src title={\`${shown.name} · ${label}\`} className="absolute inset-0 size-full border-0 bg-bg" />` with no `sandbox`.
    - Key each iframe by `src` so a swap reloads it.
- [ ] **Step 4: Run** `npx vitest run`, `npx tsc --noEmit`, `npx eslint .`, then `npx playwright test e2e/projects.spec.ts --grep-invert @shots`. Expected: all PASS.
- [ ] **Step 5: Check by hand at phone width (390 px):** the tab row scrolls sideways, the page itself never scrolls sideways, and both themes look right.
- [ ] **Step 6: Commit** `feat: the site preview opens a site’s five case pages from a tab row`.

### Task 9: Verify, screenshot, open the pilot PR

- [ ] **Step 1:** `npm test`, `npx tsc --noEmit`, `npx eslint .` and `npm run e2e`. Everything passes, except the known `e2e/access.spec.ts:33` failure, which also fails on `main`. Say so in the PR.
- [ ] **Step 2:** `npm run cases`, then `git status`. Expected: nothing changed (the generated pages are committed and current).
- [ ] **Step 3:** Screenshot each of Oriel's five pages, standalone at 1280 px in dark theme, into `test-results/shots/cases/oriel-*.png` (Playwright, as `scripts/shoot-plan.mjs` does; do not commit them).
- [ ] **Step 4:** Push `feat/per-site-pages` and open a PR into `main` (or into `feat/six-new-sample-sites` if #46 is still open; say which in the body). The body has:
  - a summary, the test results, the five screenshots, and how to review: open Oriel from Funnels and sites and step through the tabs
  - a note that the other ten sites follow in batches once the pilot's voice and depth are approved
  - the Claude Code attribution line
