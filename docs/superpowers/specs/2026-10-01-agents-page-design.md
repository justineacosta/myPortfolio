# The AI agents and RAG chatbots page: design

**Date:** 2026-10-01
**Status:** Approved 2026-10-01 in chat
**Why:** The card's content came from the kape reference portfolio (KapeAI, KapeSEO, KAPE Reel worker, Kape AI knowledge search, BrewedOps OS roster, Ken AI Bot, Hermes). None of it is Justine's. It is replaced by labelled sample builds on Justine's stack, and the card gains a page that shows how they work, like the other three write-up cards.

## 1. Goal

When someone clicks **AI agents and RAG chatbots** on /projects, they see how a RAG chatbot and an AI agent actually run: two live diagrams, eight sample builds, and the guardrails every build follows. A build's "Show its route" button lights its own path through the diagram.

The page is generated into one self-contained HTML file at `/ai-agents.html`. It shows inside the card's window and can also be opened on its own.

The board card gets its own preview (a small chat and agent run), real tool logos and honest chips.

**The build plan page is not changed.** No file under `lib/buildPlan/`, nor `data/buildPlan.ts`, `scripts/make-plan.ts`, `scripts/shoot-plan.mjs`, `public/build-plan.html` or its screenshot, is edited. The new page imports some of that code read-only. End-to-End and the Agentic Framework change only as §5.3 says.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| What the card should do better | Show how they work · look lively on the board · real logos · fix the content · tailored to Justine, with no kape content |
| Content | Labelled sample builds on Justine's stack. Every one is marked **SAMPLE BUILD**: an example of what Justine builds, not a client project. |
| Lineup | Eight: four RAG chatbots (Help-desk RAG bot, Team knowledge bot, Website sales bot, Document Q&A bot) and four AI agents (Inbox triage agent, Billing follow-up agent, Lead research agent, Weekly report agent) |
| Approach | A. One standalone page with two diagrams, and per-build route lighting |
| Sections | At a glance · How a RAG chatbot works · How an agent works · Eight sample builds · Guardrails · Glossary |
| Board card | A mini chat and agent-run preview, two count chips, a row of tool logos, no live dots |
| Window | Shows the page, like the Agentic Framework card. The React window and its data are deleted. |
| Tools | Only logos the pages already have. Unbranded steps (website chat, PDFs, embeddings model, web page, form, schedule) use plain icons. |

## 3. Content

All copy uses curly quotes and apostrophes. Step labels and sub-lines are 22 characters or fewer, so they fit on one line.

### 3.1 Hero
- Kicker: `AI AGENTS AND RAG CHATBOTS`
- Title: `How my AI agents and RAG chatbots work`
- Lede: "Eight sample builds on one stack, and the two patterns underneath every one of them."
- Sample note (small, with an info icon): "These are sample builds: examples of what I build, not client projects."
- Tool chips: Claude · n8n · Supabase.
- A home link back to the portfolio (`target="_top"`), hidden inside the window, as on the other pages.
- The "Tools on this page" strip, as on the other pages.

### 3.2 Section chips
A sticky row under the hero: **At a glance · RAG chatbots · Agents · The builds · Guardrails · Glossary**. Scroll-spy and click behaviour are the same as the other pages.

### 3.3 At a glance
| Tile | Line |
|---|---|
| **RAG chatbots** | They search your documents first, then answer from what they found, with the source. |
| **AI agents** | They take a goal, pick their own tools and finish the job, checking as they go. |
| **Your yes** | Anything that reaches a customer or moves money waits for your approval. |

### 3.4 Diagram 1: How a RAG chatbot works (`rag`)
Blurb: "Documents are prepared once. Every question then searches them before Claude says a word. Click any step."

| Id | At | Kind | Label | Sub-line | Tool | Pins |
|---|---|---|---|---|---|---|
| `docs` | 0,0 | start | Your documents | Docs, PDFs, Sheets | | `docs` Docs (icon) · `pdf` PDFs (icon) · `sheets` Google Sheets (logo) |
| `chunk` | 1,0 | step | Split into chunks | A few paragraphs each | | |
| `embed` | 2,0 | step | Embed | Embeddings model | | |
| `store` | 3,0 | step | Store | Supabase pgvector | supabase | |
| `ask` | 0,1 | start | A question | Chat, Telegram, Gmail | | `chat` Website chat (icon) · `telegram` Telegram (logo) · `gmail` Gmail (logo) |
| `qembed` | 1,1 | step | Embed the question | Same model | | |
| `search` | 3,1 | step | Search | Top 5 passages | supabase | |
| `answer` | 4,1 | step | Claude answers | From the passages | claude | |
| `sure` | 5,1 | branch | Sure? | A source was found | | |
| `reply` | 6,1 | end | Reply with source | Cites the passage | | |
| `book` | 7,1 | end | Offer a call | Cal.com | cal-com | |
| `handoff` | 5,2 | end | Hand to a person | With the chat so far | | |

Each step also has a `what`: one plain sentence (20–220 characters, ending with a full stop) for the details panel.

Cables:

| From | To | Kind | Label |
|---|---|---|---|
| docs | chunk | flow | |
| chunk | embed | flow | |
| embed | store | flow | |
| store | search | index (dashed) | the index it searches |
| ask | qembed | flow | |
| qembed | search | flow | |
| search | answer | flow | |
| answer | sure | flow | |
| sure | reply | flow | yes |
| sure | handoff | flow | no |
| reply | book | flow | ready to buy |

Ball routes:
1. Prepare: docs → chunk → embed → store.
2. Answered: ask → qembed → search → answer → sure → reply.
3. Handed off: ask → qembed → search → answer → sure → handoff.
4. Booked: ask → qembed → search → answer → sure → reply → book.

### 3.5 Diagram 2: How an agent works (`agent`)
Blurb: "A trigger starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step."

| Id | At | Kind | Label | Sub-line | Tool | Pins |
|---|---|---|---|---|---|---|
| `trigger` | 0,0 | start | Something happens | Event or schedule | | `gmail` Gmail (logo) · `stripe` Stripe (logo) · `form` Form (icon) · `clock` Schedule (icon) |
| `plan` | 1,0 | step | Claude plans | Picks the next step | claude | |
| `tool` | 2,0 | step | Use a tool | One call at a time | | `gmail` Gmail · `stripe` Stripe · `supabase` Supabase · `sheets` Google Sheets · `cal` Cal.com (logos) · `web` Web page (icon) |
| `check` | 3,0 | branch | Check the result | Done yet? | | |
| `needs` | 4,0 | branch | Needs your yes? | Customers or money | | |
| `gate` | 5,0 | gate | Your yes | Approve in Telegram | telegram | |
| `act` | 6,0 | end | Act and log | Send, then log it | | `gmail` Gmail · `sheets` Google Sheets (logos) |

Cables:

| From | To | Kind | Label |
|---|---|---|---|
| trigger | plan | flow | |
| plan | tool | flow | |
| tool | check | flow | |
| check | needs | flow | done |
| needs | gate | flow | yes |
| gate | act | flow | approved |
| check | plan | loop-back (over the top, low arc) | not done yet |
| gate | plan | loop-back (over the top, high arc) | change it |
| needs | act | flow (under the row) | internal only |

Ball routes:
1. Straight through, approved: trigger → plan → tool → check → needs → gate → act.
2. Not done yet once: … check → plan → tool → check → needs → gate → act.
3. Changed once: … gate → plan → tool → check → needs → gate → act.
4. Internal only: trigger → plan → tool → check → needs → act.

### 3.6 Legend (under each diagram)
Each item is a button that opens the details panel with one line:
- **Cable:** work moving from one step to the next.
- **Live signal:** a ball is one question or job going through right now.
- **Loop-back:** a dashed cable back to an earlier step. (Agent diagram only.)
- **Index:** a dashed cable to the store the search reads. (RAG diagram only.)
- **Branch:** a yes-or-no decision; the cable labels say which way.
- **Approval gate:** the run stops here until you say yes. (Agent diagram only.)
- **Pin:** a source, channel or tool this step can use.

### 3.7 Eight sample builds
Two rows of four: RAG chatbots, then AI agents. Each card has the **SAMPLE BUILD** label, its kind, its name, a one-line job, the logos of its tools, and a **Show its route** button.

| Id | Kind | Name | Line | Tools | Diagram | Lit routes | Lit pins | Caption |
|---|---|---|---|---|---|---|---|---|
| `helpdesk` | RAG chatbot | Help-desk RAG bot | Answers customers from your help docs and past tickets, and hands off when it isn’t sure. | claude, supabase, n8n, gmail | rag | 1, 2, 3 | docs:docs, ask:chat, ask:gmail | Website chat or Gmail → search the help docs → Claude answers → reply with the source, or hand to a person |
| `team` | RAG chatbot | Team knowledge bot | Staff ask in Telegram how something is done; it answers from the SOPs and price sheets. | claude, supabase, n8n, telegram, google-sheets | rag | 1, 2, 3 | docs:docs, docs:sheets, ask:telegram | Telegram → search the SOPs and price sheets → Claude answers → reply with the source, or hand to a person |
| `sales` | RAG chatbot | Website sales bot | Answers product and pricing questions from the real price list, then offers a call. | claude, supabase, n8n, cal-com | rag | 1, 2, 4 | docs:docs, docs:sheets, ask:chat | Website chat → search the price list and service pages → Claude answers → reply, then offer a Cal.com call |
| `docqa` | RAG chatbot | Document Q&A bot | Ask about your contracts or manuals; it answers with the page it used, or says it isn’t there. | claude, supabase, n8n | rag | 1, 2, 3 | docs:pdf, ask:chat | Website chat → search the uploaded PDFs → Claude answers → reply with the page, or say it isn’t there |
| `inbox` | AI agent | Inbox triage agent | Reads every new email, sorts it, drafts the reply and offers meeting times. Sends only on your yes. | claude, n8n, gmail, cal-com, telegram | agent | 1, 2, 3 | trigger:gmail, tool:gmail, tool:cal, act:gmail, act:sheets | New email → Claude sorts and drafts → Gmail and Cal.com → your yes in Telegram → send and log |
| `billing` | AI agent | Billing follow-up agent | Watches Stripe for failed or overdue payments, picks the next step, writes the email and logs it. | claude, n8n, stripe, gmail, google-sheets, telegram | agent | 1, 2, 3 | trigger:stripe, tool:stripe, act:gmail, act:sheets | Stripe: payment failed → Claude picks the next step → reminder or retry link → your yes in Telegram → send and log |
| `leads` | AI agent | Lead research agent | Reads a new lead’s website, scores the fit, saves it to the CRM and drafts a first email for your yes. | claude, n8n, supabase, telegram | agent | 1, 2, 3 | trigger:form, tool:web, tool:supabase, act:gmail, act:sheets | New form lead → Claude reads their site → score saved in Supabase → your yes on the first email → send and log |
| `report` | AI agent | Weekly report agent | Every Monday it pulls Stripe revenue and the pipeline sheet, spots what changed and emails a summary. | claude, n8n, stripe, google-sheets, gmail | agent | 4 | trigger:clock, tool:stripe, tool:sheets, act:gmail, act:sheets | Monday 8 am → Claude pulls Stripe and the pipeline sheet → writes the summary → internal, so no yes needed → send and log |

A build lights the steps and cables on its routes, plus its pins. Steps that carry a `Tool` (§3.4–3.5) light with them.

### 3.8 Guardrails
- **Answers only from the sources:** “A RAG bot answers from the passages it found and shows which ones. No source, no answer.”
- **“I don’t know” beats a guess:** “When the search comes back thin, it says so and hands the chat to a person.”
- **Customers and money wait for your yes:** “Anything that reaches a customer or moves money stops for your approval in Telegram.”
- **Every run is logged:** “Each question, tool call and decision lands in a log you can read later.”

### 3.9 Plain-English glossary
Two columns (one on phones). One line per term. Every term must appear somewhere else on the page:
RAG, Chunk, Embedding, Vector search, pgvector, Passage, Hand-off, Agent, Trigger, Tool call, Loop-back, Approval gate, Claude, n8n, Supabase.

### 3.10 Footer
"Built by Justine Acosta", with a link back to the portfolio (`target="_top"`).

## 4. Visual design and behaviour

### 4.1 Page
- The same look and shared layers as the other three pages: Kraft tokens, light by default (dark only when chosen on the portfolio), the site's contour and glow behind it, the lively layer (kind tints, logo badges, hover lift, reveal), the logo sheet, high contrast, and print.
- One centred read column. Tiles and build cards use a grid that stacks to one column on phones. Only the diagrams may be wider than the column, each inside its own frame.
- No raw colours in `lib/**`, as on the other pages.

### 4.2 Diagrams
- The same frame, 56 px step cards, labels, cables, legend and pan behaviour as the Agentic Framework loop.
- A **branch** step has a diamond badge. The **gate** has the accent outline and lock badge.
- **Pins** are small 22 px round badges in one row directly under a step's label: a logo for a branded tool, an icon otherwise. Each is a button that opens the details panel with its name and one line.
- Pins never overlap a card, a label, a cable label or another pin (tested).

### 4.3 Interactions
- **Click** a step, a pin or a legend item to open the same details panel as the other pages.
- **Balls:** the same rules as the other pages: one at a time at random intervals, at most five per diagram, lighting what they pass, only while on screen, never under reduced motion.
- **Show its route:**
  - It scrolls to the build's diagram (instantly under reduced motion) and sets that diagram's focus to the build.
  - The build's steps, cables and pins light. Everything else in that diagram dims.
  - Balls run only the build's routes.
  - A caption bar above the diagram shows the build's name and caption, with a **Show all** button. The caption is a polite live region.
  - Focus moves to **Show all**. **Show all** clears the focus and returns keyboard focus to the build's button.
  - Showing another build replaces the focus. A build in the other diagram clears this one first.
  - **Esc** clears a focus first. With no focus set, Esc does what it does today: it closes the details panel, then the window.
  - The button has `aria-pressed` while its build is shown.
- **Phones:** diagrams pan inside their frames with faded edges, drag and ‹ › buttons. The page never scrolls sideways.

### 4.4 Accessibility
- Steps, pins, legend items and route buttons are buttons with accessible names.
- Each diagram has a screen-reader-only ordered list of its steps and where each leads.
- The two count chips and the logo row on the board card are real text and images with alt text. The animated preview is `aria-hidden`.

## 5. Site integration

### 5.1 The page's code
- **New files:**
  - `data/agents.ts`: types and content for §3 (hero, chips, tiles, the two diagrams with steps, pins, cables and routes, legend, builds, guardrails, glossary, footer).
  - `lib/agents/layout.ts`: step positions from the grid, the cable shapes (flow along a row, down to a row below, over-the-top loop-back arcs, the under-the-row bypass, the dashed index), pin positions, and measured ball routes in the same `Route` shape as the other pages.
  - `lib/agents/styles.ts` and `lib/agents/render.ts` (`renderAgents()` → a full HTML string, `PAGE_PATH = '/ai-agents.html'`).
  - `lib/agents/focus.js`: the Show its route behaviour (§4.3).
- **Imported read-only:** `esc` from `lib/buildPlan/render.ts`; `pageCss` and `Themes` from `lib/buildPlan/styles.ts`; `iconSvg` from `lib/endToEnd/icons.ts`; the brand layer from `lib/brand/`.
- **The shared client:** the page inlines `lib/endToEnd/client.js`, as the Agentic Framework does. It gains one opt-in hook: when a diagram's figure has `data-only="0,2"`, balls take only those routes. A figure without it behaves exactly as today.
- **Scripts:** `scripts/make-agents.ts` writes `public/ai-agents.html`. `scripts/shoot-agents.mjs` shoots `public/shots/ai-agents.jpeg` (light, reduced motion). `package.json` gets `"agents-page": "node scripts/make-agents.ts && node scripts/shoot-agents.mjs"`.

### 5.2 The board card and window
- **`data/projects.ts`, `cards.agents`:**
  - body: "Sample RAG chatbots and agents, and how each one works."
  - cta: `SEE HOW THEY WORK`; cue stays `VIEW THE AGENTS`.
  - `chips` is replaced by `counts`: **4 RAG chatbots** (chat icon) and **4 AI agents** (robot icon), and `logos`: Claude, n8n, Supabase, Gmail, Google Sheets, Telegram, Stripe, Cal.com.
  - `page: '/ai-agents.html'` and `frameTitle: 'AI agents and RAG chatbots page'`.
  - The preview's script (below).
- **Board logos** use the site's self-hosted brand icons (`brandIcon(slug)`). `scripts/brand-icons.mjs` gains `gmail` (`EA4335`), `telegram` (`26A5E4`) and `caldotcom` (`A3AAB2`, mono like the site's other mono marks).
- **The preview** (`components/projects/AgentsPreview.tsx`) fills the space between the body and the chips:
  - Chat scene: the customer asks “Can I switch plans mid-month?” → a status chip “Searching 5 passages · Supabase” → the bot answers “Yes. The change starts today and the difference is prorated on your next invoice.” with a source chip “Billing FAQ §2”.
  - Agent scene: “Stripe · payment failed” → “Drafting a reminder” → an “Approve?” chip with Approve and Edit buttons (drawn, not interactive).
  - It plays its two scenes in turn, about 6 s each, only while the card is on screen.
  - Under reduced motion (the device setting or the site's), or with the site's perf tier at `low`, it shows the finished chat scene, still.
  - It is `aria-hidden`, and nothing in it is focusable.
  - It lives in the card's data, so its strings are checked like the rest.
- **`Board.tsx`:** the agents card renders the preview, the two count chips and the logo row. There are no live dots.
- **The window:** `components/projects/AgentsView.tsx` becomes the Agentic Framework pattern: `Window` with `href` and `flush`, and an iframe of `/ai-agents.html` only while open. Its title stays "AI agents and RAG chatbots".
- **Deleted:** `data/projectDocs.ts` (all of it: `agentsView` and `GROUPS` were its only content), the `AgentGroup` and `AgentCard` types in `data/projects.ts` (nothing else uses them), and the comment there that points at projectDocs.
- **Home:** the builds list's agents entry gets `shot: '/shots/ai-agents.jpeg'`.
- **`lib/seo.ts`:** `STATIC_PAGES` adds `/ai-agents.html`.
- **⌘K:** `/projects#ai-agents` keeps working.

### 5.3 Removing the kape content
- Every kape-derived name leaves the site's content: KapeAI, KapeSEO, KAPE Reel worker, Kape AI knowledge search, BrewedOps OS roster, Ken AI Bot, Voice Call Tester, Copy Website, Save-progress watcher.
- End-to-End's Writer line, “Writes long articles, like KapeSEO’s 3,000-word posts, and grades itself before handing over.”, becomes “Writes long articles, like a 3,000-word blog post, and grades itself before handing over.” `public/end-to-end.html` is regenerated.
- Code comments that credit the kape reference stay: they are attributions, not content.
- *Out of scope, flagged for Justine:* End-to-End also names Hermes and a reel worker, which came from the same reference. They stay until Justine decides.

### 5.4 Other pages
- End-to-End and the Agentic Framework inline the shared client, so both are regenerated after the `data-only` hook lands. Their freshness tests and browser tests stay green. Nothing else of theirs changes.

## 6. Testing
- **Data (`tests/agents-data.test.ts`):**
  - Ids are unique per diagram, cables join real steps, every pin and tool is real, and labels and sub-lines are 22 characters or fewer.
  - Every `what` is 20–220 characters and ends with a full stop.
  - Every route runs from a start to an end along real cables.
  - There are eight builds, four of each kind, and each has the sample label.
  - Each build's routes and pins exist in its diagram, and each of its tools is a known `ToolId`.
  - Every glossary term appears elsewhere on the page. There are no straight quotes.
- **No kape (`tests/no-kape.test.ts`):** every string value exported from `data/*.ts` (walked recursively, functions skipped) and every file in `public/*.html` is free of `kape`, `brewedops` and `Ken AI`, case-insensitively.
- **Layout (`tests/agents-layout.test.ts`):** cards and pins don't overlap each other or any label; every cable label sits inside the frame; each diagram's routes together pass every step and cable.
- **Render (`tests/agents-render.test.ts`):** the head script, backdrop and logo sheet are there; text and ids are escaped; the six section chips point at real sections; there are eight build cards with route buttons, and each diagram has one button per step and pin; home and footer links go to the top window; a size guard; and freshness: `public/ai-agents.html` equals `renderAgents()`.
- **Shared client:** a unit test shows `data-only` limits the routes picked, and that without it all routes stay possible.
- **Site:** `tests/projects.test.tsx` covers the card's counts, logos, no live dots and the hidden preview. `tests/seo.test.ts` is updated. The card opens the iframe.
- **Browser (`e2e/agents.spec.ts`, desktop and phone):**
  - The page loads with no errors. It opens light, and dark when dark is saved.
  - A step, a pin and a legend item open the panel.
  - Show its route lights the build's steps, dims the rest, shows the caption, sets `aria-pressed` and moves focus to Show all. Show all and Esc clear it.
  - Balls run only the build's routes while it is shown.
  - Under reduced motion there are no balls and the board preview is still.
  - At phone width the page never scrolls sideways and the diagrams pan.
- **`e2e/projects.spec.ts`:** the card opens the window with the iframe, and "Open in new tab" points at `/ai-agents.html`.
- **Before the PR:** full unit and e2e runs, lint and type check, fresh screenshots, and one final review of the whole branch.

## 7. Out of scope
- Live chatbots or agents on the page: the diagrams are illustrations, not working bots.
- New logo files: no new tool gets a logo on the pages.
- Hermes and the reel worker on the End-to-End page (§5.3).
- Any change to the build plan page.
