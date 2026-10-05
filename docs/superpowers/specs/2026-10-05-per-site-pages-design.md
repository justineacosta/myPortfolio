# Per-site case pages: design

**Date:** 2026-10-05
**Status:** Design approved 2026-10-05 in chat; spec awaiting review
**Builds on:** PR #46 (six new sample sites, 11 in all)
**Change, 2026-10-05 (planning):** the registry is split in two so the preview window never bundles page content. `data/cases/pages.ts` (client-safe) holds `CASE_PAGES`, `CASE_SITES` and `casePagesFor()`. `data/cases/index.ts` (Node and tests only) holds `CASES`. Each renderer's canonical link uses the case page's own path (`site.page`), and `SiteLink` carries `{ name, href, page }`.

## 1. Goal

Every sample site in the Funnels and sites carousel gets its own full set of the five write-up pages: **Automation**, **Build Plan**, **Agentic Framework**, **End-to-End Workflow** and **AI agents & RAG bots**. Each page is written for that business, so a visitor sees the website and the whole system behind it.

A visitor reaches them from the site's preview window. When a site opens from the carousel, a row of tabs under the window's title bar switches between the site and its five pages.

That makes 55 new pages (11 sites × 5). They are delivered as a pilot (tooling plus Oriel's five pages), then the other ten sites in batches.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| Deliverable | A full set of five pages per site: 55 pages |
| Entry point | The site's preview window only, as a tab row |
| Depth | Every page fully rewritten for its business, Agentic Framework and End-to-End included. Tools, rules and lanes may differ by site. |
| The five general pages | Kept exactly as they are. The Projects cards still open them. |
| Automation page size | 3 flows per site, one each on n8n, Make and Zapier |
| AI agents page size | 1 RAG chatbot + 2 agents per site |
| Build Plan scope | All 3 of the site's flows, each planned on its own platform (n8n nodes, Make modules, Zapier steps). The kicker reads `BUILD PLAN`, not `N8N BUILD PLAN`. |
| How pages are built | Typed content per site, fed through the existing five renderers by one command |
| Rollout | Pilot: tooling, tab row and Oriel's five pages in one PR. Then the remaining ten sites in PRs of 2–3 sites each. |
| Preview layout | A tab row under the title bar (not a side rail) |

## 3. Out of scope

- No change to the five general pages' content, their `data/*.ts` files, `make-*` scripts, generated HTML or screenshots. Regenerating them must produce byte-identical output (§8).
- No change to the sample site HTML files in `public/samples/`.
- No new tool logos. Tools come only from `lib/brand/tools.ts`. Unbranded steps (a site form, a calendar, a PDF) use Phosphor icons, as today.
- No links to the case pages from the Projects cards, Home or the sitemap.

## 4. Files and build

### 4.1 Content

```text
data/cases/
  index.ts                      the sites that have case pages, and their five files
  oriel-portugal-residences/
    automation.ts               export default: Automations   (data/automations.ts)
    buildPlan.ts                export default: Plan          (data/buildPlan.ts)
    agenticFramework.ts         export default: AgenticFramework
    endToEnd.ts                 export default: EndToEnd
    agents.ts                   export default: Agents
  tidewell-vacation-rentals/
  ...
```

- A site's folder name is its sample file name without `.html` (`oriel-portugal-residences.html` → `oriel-portugal-residences`). That is the join key to `data/projects.ts` SITES.
- Each file uses only type imports, like the current data files, so Node runs it directly.
- `data/cases/index.ts` exports `CASES: Record<string, CaseSet>`, keyed by folder name. A site with no entry has no case pages and no tab row. That lets the pilot ship with Oriel alone.
- It also exports `CASE_PAGES`, the five pages in tab order, each with an `id`, a tab label and a file name:

| id | Tab label | File |
|---|---|---|
| `automation` | Automation | `automation.html` |
| `build-plan` | Build plan | `build-plan.html` |
| `agentic-framework` | Framework | `agentic-framework.html` |
| `end-to-end` | End-to-end | `end-to-end.html` |
| `ai-agents` | AI agents | `ai-agents.html` |

### 4.2 Output

`npm run cases` runs `scripts/make-cases.ts`. For every entry in `CASES` it calls the five existing renderers (`renderAutomations`, `renderPlan`, `renderAgenticFramework`, `renderEndToEnd`, `renderAgents`) with that site's content. It writes:

```text
public/cases/<site>/automation.html
public/cases/<site>/build-plan.html
public/cases/<site>/agentic-framework.html
public/cases/<site>/end-to-end.html
public/cases/<site>/ai-agents.html
```

It prints each file's size, as the `make-*` scripts do. The generated HTML is committed, like the general pages.

`app/robots.ts` adds `/cases/` to `disallow`, next to `/samples/`.

### 4.3 Renderer changes (the only ones)

1. **Back to the site.** Each of the five content types gains an optional `site?: { name: string; href: string }`. When it is set, the hero shows a second link next to the portfolio link: `← <name> site`, pointing at the sample page (`target="_top"`). Like the portfolio link, it is hidden when the page is inside a window. When it is absent (the general pages), the hero is unchanged.
2. **Platform per workflow in the Build Plan.** `Workflow` gains an optional `platform?: Platform` (`'n8n' | 'make' | 'zapier'`, from `data/automations.ts`). When set, the workflow heading shows that platform's logo and name. Node `type` strings carry the platform's own module names (e.g. `Make · Webhooks › Custom webhook`, `Zapier · Gmail › Send Email`). The renderer already treats `type` as free text. Unset (Trusted Mover) renders as today.

Page titles, kickers and footers are content, so each site's files set them (e.g. title `Oriel · Automation`).

## 5. The preview window

`components/projects/SitePreview.tsx` changes only for sites that have an entry in `CASES`:

- A tab row sits under the title bar: **Site · Automation · Build plan · Framework · End-to-end · AI agents**. It is a `role="tablist"` with arrow-key movement, and **Site** is selected when the window opens.
- Picking a tab swaps the window's page in place. The address bar and **Open in new tab** follow the selected tab.
- The sample site keeps its sandboxed iframe (`allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox`, no same-origin). Case pages are first-party and load like the general write-up windows (`AutomationsView.tsx` etc.): no sandbox, so they follow the portfolio's theme and performance settings.
- The existing missing-page check (a HEAD request before loading) runs for each tab's page. A missing case page shows the same "file goes here" message with its path.
- Esc and Close still close the whole window, whichever tab is open. Reopening a site starts on **Site**.
- On narrow screens the tab row scrolls sideways and never wraps. There is no page-level horizontal scroll.
- Sites without case pages look exactly as they do today.

All copy stays in data: the **Site** tab label and the tab row's accessible name go in `data/projects.ts` under `sitesView.preview`, and the five page labels come from `CASE_PAGES`.

## 6. Content rules (every site, every page)

- **Grounded in the site.** Forms, buttons, services, prices, places and names come from the site's own HTML. Nothing contradicts what the site says.
- **Labelled as samples.** The existing sample note appears, worded for the business, e.g. "Sample flows for Oriel, a fictional business used across this portfolio, not a client project." Figures are marked illustrative, as the sites already do.
- **House style**, the same as the general pages: curly quotes and apostrophes, plain words, step labels and sub-lines of 22 characters or fewer.
- **Codes** use a two-letter site prefix: Oriel `OR`, Tidewell `TW`, Altitude `AL`, Range Physical Therapy `RP`, Riverdale & Brooks `RB`, Ostler `OS`, Harbor & Pine `HP`, Westmere `WM`, Ironline `IL`, Meridian Werks `MW`, Meridian Energy `ME`. Flows are `OR-01…03`. Build Plan helpers are `OR-H01…`.
- **Sensitive trades.** Range Physical Therapy never gives clinical advice; anything clinical or urgent is handed to a person. Riverdale & Brooks never gives legal advice; it books a consultation or routes to an attorney. The rule from the general agents page still holds: anything that reaches a customer or moves money waits for a person's yes.

### 6.1 Per page

| Page | Content for each site |
|---|---|
| **Automation** | 3 flows from the site's real forms and calls to action: `-01` on n8n, `-02` on Make, `-03` on Zapier. Each has 5–9 steps with `what`, `reads` and `why`, as on the general page. `seeSite` links to the site. |
| **Build Plan** | All 3 flows as workflows, codes and platforms matching the Automation page one to one. Each workflow has its own nodes with settings, branches, exits and watch-outs. The plan also has the general page's other sections, written for the business: start, naming, data, triggers, helpers, tests (at least 2 per workflow, covering each branch) and build phases. |
| **Agentic Framework** | How Justine would build this site and its automations with AI. Stages, jobs, tools, rules, the loop, a worked example taken from this site's build, habits and glossary are all written for the project. Tools and rules may differ from the general page where the business calls for it. |
| **End-to-End Workflow** | The business's whole system as one graph, from visitor to site, form, automation, agent, the team and follow-up. Up to 11 lanes (A–K), with lane names, steps and the glossary written for the business. |
| **AI agents & RAG bots** | The two diagrams (`rag`, `agent`) with captions, pins and sources written for the business. Three builds: 1 RAG chatbot answering from the site's content and 2 back-office agents, each with a worked example (Asked/Answer, Trigger/Result) and routes through its diagram. At a glance, guardrails and glossary written for the business. |

## 7. Rollout

1. **Pilot PR:** the content types' optional fields, both renderer changes, `data/cases/index.ts`, `scripts/make-cases.ts`, the `robots.ts` line, the preview tab row, the tests, and Oriel's five pages. The PR includes a screenshot of each of the five pages so Justine can review the voice and depth.
2. **Adjust:** fold Justine's notes on the pilot into this spec (a dated change line at the top) and into Oriel's pages.
3. **Batches:** the remaining ten sites in PRs of 2–3 sites each, in carousel order: Tidewell, Altitude, Range Physical Therapy · Riverdale & Brooks, Ostler · Harbor & Pine, Westmere · Ironline, Meridian Werks, Meridian Energy. A batch PR contains only `data/cases/<site>/`, the index entries and the generated pages.

The branch starts from PR #46 (`feat/six-new-sample-sites`). If #46 merges first, it is rebased onto `main`.

## 8. Testing

- **Content (`tests/cases-data.test.ts`)**, run over every entry in `CASES`:
  - The folder name matches a site in `data/projects.ts` SITES, and `site.href` is that site's `src`.
  - Each site has exactly 3 Automation flows on n8n, Make and Zapier, in that order, and exactly 1 RAG build and 2 agent builds.
  - Each Build Plan workflow's code and platform match the Automation flow with the same code. The workflow codes are exactly the flow codes.
  - Codes use the site's prefix (§6).
  - Inside each page: node and step ids are unique, every edge or cable joins real steps, agent routes and pins exist in their diagram (as `tests/agents-data.test.ts` checks), and every tool id is in `lib/brand/tools.ts`.
  - Every page's title, heading or lede names the business.
  - Step labels and sub-lines are 22 characters or fewer.
  - No `PLACEHOLDER` mark in `data/cases/`. `scripts/placeholders.ts` already scans `data/`, and the test asserts it finds nothing there.
- **Renderers:** with `site` set, the hero has the `← <name> site` link to the sample page; without it, the hero is unchanged. A Build Plan workflow with `platform` shows that logo. Regenerating the five general pages gives byte-identical files.
- **Build (`tests/make-cases.test.ts`):** every `CASES` entry has all five files in `public/cases/<site>/`, and they are up to date with their content (rendering again changes nothing).
- **Preview (`tests/sites.test.tsx`):**
  - The tab row shows only for sites in `CASES`.
  - Picking a tab changes the window's page, the address bar and the new-tab link.
  - Case pages load unsandboxed, and the site stays sandboxed.
  - A missing case page shows its path.
  - Reopening starts on Site.
- **E2E (`e2e/projects.spec.ts`):** open Oriel from the carousel and step through all six tabs by keyboard, checking each page's heading shows inside the window and there are no console errors. A site without cases shows no tab row. Esc from a case tab closes the window.
- **Robots:** `tests/seo.test.ts` expects `disallow: ['/samples/', '/cases/']`.
