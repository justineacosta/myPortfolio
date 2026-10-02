# Site Assistant Without a Key: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The chat works without `ANTHROPIC_API_KEY`. A site-content "quick" engine answers from the site's own text, takes visitors to pages and offers an inline lead form. With a key, the same engine answers whenever a Claude call fails.

**Architecture:**
- **Engine:** new `lib/assistant/{source,passages,search,quick,ledger}.ts` form the quick engine. Passages are built from the same data and rules as Claude's knowledge document.
- **Chat route:** `/api/chat` picks the engine by `mode()` and falls back from a failed Claude turn by sending a `source` event.
- **Lead route:** a new `/api/chat/lead` takes the form card.
- **Browser:** the provider and panel learn the `source` and `form` events, a "Quick answers" mode, and the form card.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, Vitest with jsdom, Playwright. No new packages.

**Spec:**
- `docs/superpowers/specs/2026-10-02-assistant-keyless-design.md` (§ numbers below refer to it).
- It builds on `docs/superpowers/specs/2026-10-02-assistant-design.md`. Read both.

## Global Constraints

- **Branch:** `feat/assistant`, which already holds PR #41. Commit only there. Push only when the user says so.
- **Next.js:** before touching Next code, read the relevant guide in `node_modules/next/dist/docs/` (per AGENTS.md). For route handlers that means `01-app/01-getting-started/15-route-handlers.md` and `01-app/03-api-reference/04-functions/after.md`.
- **House style:**
  - no semicolons, single quotes, long lines, a short doc comment on each export;
  - never run prettier;
  - curly apostrophes (’) in copy;
  - all visitor copy in `data/assistant.ts`;
  - no raw hex colours (`tests/no-raw-colors.test.ts`).
- **Copy, verbatim (§6),** in `data/assistant.ts`:
  - top-level `badgeQuick: 'Quick answers'`;
  - top-level `greetingQuick: 'Hi, I’m Kraft’s assistant. Ask about Justine’s work, or leave a message for Justine.'`;
  - a `quick` object holding:
    - `note: 'Answers come straight from this site.'`
    - `hello: 'Hi! Ask about Justine’s services, projects or process, or leave a message.'`
    - `going: 'Taking you to'`
    - `more: 'More on'`
    - `also: 'Also:'`
    - `leadAsk: 'Want Justine to reply? Leave your details:'`
    - `none: 'I couldn’t find that on the site. Try asking about services, projects or how Justine works, or leave Justine a message.'`
    - `form: { title: 'Leave Justine a message', firstName: 'First name', lastName: 'Last name', email: 'Email', message: 'What do you need?', call: 'Request a call', send: 'Send', sending: 'Sending', already: 'Your message is already with Justine.' }`
  - Delete `errors.off`.
- **Privacy body (§6), verbatim,** for the "The site assistant" section in `data/legal.ts`: `The chat assistant on this site answers in one of two ways. When an AI is switched on, your messages are sent to Anthropic (Claude) to write each reply; otherwise replies come straight from this site’s pages. Every conversation is stored for 90 days so answers can be improved, then deleted. No IP address is stored. Your name and email are kept only if you choose to leave them in the chat.`
- **Modes:** `mode()` is `'ai'` when `ANTHROPIC_API_KEY` is set or `ASSISTANT_FAKE=1`, else `'quick'`. `ASSISTANT_FAKE=1` still means: no email, no Supabase writes.
- **Quick-answer format (§4 rule 4):** `**<title>**\n<text ≤ 400 chars, cut at a sentence end>\n<quick.more> [<label>](<href>)`, plus `\n<quick.also> [<label>](<href>)` when the runner-up scores ≥ 60% of the best and sits on a different page.
- **Tests that import route or Claude code** start with `// @vitest-environment node`.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Claude fails after it has already streamed some text.** Expect the half-written Claude bubble to disappear, one quick reply bubble with the note to take its place, and no Retry button. Pinned in Task 5 (provider test: text deltas, then `source`, then text).
2. **The visitor double-clicks Send on the form card.** Expect one POST, with the button disabled and reading `Sending` while it waits. Pinned in Task 6 (panel test).
3. **A passage with no sentence end within 400 characters.** Expect a cut at a word boundary ending in `…`, never mid-word. Pinned in Task 2 (quick test).
4. **The same question in another case, with extra punctuation** (`WHAT DO YOU CHARGE???`). Expect it to land where `what do you charge` lands. Pinned in Task 1 (search test).
5. **A form card restored from `sessionStorage` while still open, after a reload.** Expect its fields to render empty and still send. Pinned in Task 6 (panel test).

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `lib/assistant/source.ts` | `clean`, `siteLinks` shared by knowledge and passages | 1 |
| `lib/assistant/knowledge.ts` (modify) | Uses `source.ts`; output unchanged | 1 |
| `lib/assistant/passages.ts` | `Passage`, `buildPassages`, `sitePassages` | 1 |
| `lib/assistant/search.ts` | `MIN_SCORE`, `searchPassages` | 1 |
| `data/assistant.ts` (modify) | New copy; `errors.off` removed | 2 |
| `lib/assistant/events.ts` (modify) | `source` and `form` events | 2 |
| `lib/assistant/quick.ts` | `quickTurn` | 2 |
| `lib/assistant/turn.ts` (modify) | `TurnRecord.engine` | 2 |
| `lib/assistant/config.ts` (modify) | `mode()` replaces `enabled()` | 3 |
| `lib/assistant/limits.ts` (modify) | `checkMessages`, `formShown` | 3 |
| `lib/assistant/ledger.ts` | Shared lead ledger instance | 3 |
| `lib/assistant/log.ts`, `supabase/migrations/0001_assistant.sql` (modify) | `engine` column; empty rows skipped | 3 |
| `app/api/chat/route.ts` (modify) | Engine choice and fallback | 3 |
| `app/api/chat/lead/route.ts` | Form card POST | 4 |
| `lib/assistant/client.ts`, `components/assistant/AssistantProvider.tsx` (modify) | `source`/`form` events, `sendLead`, `submitForm`, `formShown` | 5 |
| `components/assistant/LeadFormCard.tsx` | The form card | 6 |
| `components/assistant/{AssistantPanel,AssistantRoot,Assistant}.tsx` (modify) | Mode badge, greeting, note, fallback note, card | 6 |
| `data/legal.ts`, `.env.example`, `e2e/assistant.spec.ts` (modify) | Privacy text, setup notes, browser tests | 7 |

---

### Task 1: Shared source rules, passages and search

**Files:**
- Create: `lib/assistant/source.ts`, `lib/assistant/passages.ts`, `lib/assistant/search.ts`
- Modify: `lib/assistant/knowledge.ts`
- Test: `tests/assistant-passages.test.ts`, `tests/assistant-search.test.ts` (new); `tests/assistant-knowledge.test.ts` must pass unchanged

**Interfaces:**
- Consumes: `commands()` from `lib/commands.ts`, `isPlaceholder` from `lib/placeholder`, the data files `knowledge.ts` already imports.
- Produces:
  - `clean(s: string | undefined): string`
  - `siteLinks(): { page(href: string): Command | undefined; ref(href: string): string }`. Here `ref` returns `[Label](href)`, or `''` when the page is off. It is read at call time.
  - `type Passage = { id: string; title: string; text: string; href: string; label: string }`
  - `buildPassages(): Passage[]` (uncached), and `sitePassages(): Passage[]` (built once per server instance)
  - `MIN_SCORE: number`
  - `searchPassages(query: string, passages: Passage[]): { passage: Passage; score: number }[]`. It returns results sorted by score (highest first), keeps only those ≥ `MIN_SCORE`, and is deterministic.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-passages.test.ts`:
- **Coverage:** every `FAQS[i].q` is some passage's `title`, every `SERVICES[i].name` is a title, and every `PROCESS[i].name` appears in a title.
- **Clean:** no passage text contains `PLACEHOLDER` or `profile.email`.
- **Links:** every passage's `href` is in `commands().map(c => c.href)`, and its `label` equals that command's label.
- **Hidden pages:** with Showcase and Testimonials set to `hidden = true` in `NAV`, no passage has `href` `/showcase` or `/testimonials`.
- **IDs:** passage `id`s are unique.

`tests/assistant-search.test.ts`, with `const p = buildPassages()` and `const top = (q: string) => searchPassages(q, p)[0]?.passage`:
- **The must-land list from spec §7,** written as a table-driven `it.each`:
  - `top('what do you charge')!.title` is `'How much do you charge?'`;
  - `top('how fast can you start')!.title` is `'How fast can you start?'`;
  - `top('do you maintain what you build')!.title` is `'Do you maintain what you build?'`;
  - `top('what happens after I send a message')!.title` is `'What happens after I write?'`;
  - `top('what do you build')!.title` is `'What do you actually build?'`;
  - `top('do you use n8n')!.title` is `'Automation & Workflows'`;
  - `top('can you build a RAG chatbot')!.title` is `'AI Agents & RAG'`;
  - `top('I need a CRM')!.title` is `'CRM, CMS & Internal Tools'`;
  - `top('do you build websites')!.title` is `'Full-Stack Web & SaaS'`;
  - `top('can you connect my APIs')!.title` is `'APIs & Integrations'`;
  - `top('where are you based')!.href` is `'/about'`, with a title that names the location;
  - `top('what is the Kraft method')!.href` is `'/services#method'`;
  - `top('what tools do you use')` is the stack passage (assert its `id` is `'stack'`);
  - `top('tell me about your agentic framework')!.title` is `'The Agentic Framework'`.
- **Off-topic:** `searchPassages(q, p)` is `[]` for `what's the weather today`, `tell me a joke` and `who won the game`.
- **Review Focus #4:** `top('WHAT DO YOU CHARGE???')` equals `top('what do you charge')`.
- **Determinism:** the same query twice gives a `toEqual` result.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-passages.test.ts tests/assistant-search.test.ts`. Expected: FAIL, because the modules are missing.

- [ ] **Step 3: Implement**

- **`source.ts`:** move `clean` and the `ref`/`section` gating out of `knowledge.ts`, then have `knowledge.ts` import them. Run `npx vitest run tests/assistant-knowledge.test.ts`, which must still PASS.
- **`passages.ts`:** one passage per item in spec §4.1. Give each a stable `id` (`faq-<n>`, `service-<n>`, `method`, `step-<n>`, `automation`, `card-<key>`, `writeup-<view>`, `sites`, `build-<id>`, `about-intro`, `about-location`, `role-<n>`, `stack`, plus the showcase and testimonial ids). The about-location passage's title is `about.location.title` (for example "Based in Manila, Philippines").
- **`search.ts`:** spec §4.2.
  - BM25 with `k1 = 1.2` and `b = 0.75`, where each document is the title tokens twice plus the text tokens.
  - The stop list and the synonym map are module constants.
  - If the must-land list needs a synonym or stop word that §4.2 doesn't list, add it and name it in your report (for example write ↔ send, message).
  - Set `MIN_SCORE` to the lowest value that keeps all three off-topic queries empty while every must-land query still lands.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-passages.test.ts tests/assistant-search.test.ts tests/assistant-knowledge.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/source.ts lib/assistant/passages.ts lib/assistant/search.ts lib/assistant/knowledge.ts tests/assistant-passages.test.ts tests/assistant-search.test.ts
git commit -m "feat: site passages and keyword search for the assistant's quick answers"
```

---

### Task 2: The quick engine

**Files:**
- Create: `lib/assistant/quick.ts`
- Modify: `data/assistant.ts` (the copy in Global Constraints; keep `errors.off` for now, because Task 3 removes it), `lib/assistant/events.ts`, `lib/assistant/turn.ts`
- Test: `tests/assistant-quick.test.ts`, plus `tests/assistant-events.test.ts` (two new round-trip cases) and `tests/assistant-turn.test.ts` (`engine: 'claude'`)

**Interfaces:**
- Consumes: `sitePassages`, `searchPassages`, `Passage` (Task 1); `commands()`; `ChatMessage`; `AssistantEvent`.
- Produces:
  - `AssistantEvent` gains `{ type: 'source'; engine: 'site' }` and `{ type: 'form' }`.
  - `TurnRecord` gains `engine: 'claude' | 'site'`. `runTurn` sets `'claude'`.
  - `quickTurn(opts: { history: ChatMessage[]; formShown: boolean; leadSent: boolean; emit: (e: AssistantEvent) => void; passages?: Passage[] }): TurnRecord`. It is synchronous and emits one `text` event, plus any `navigate` and `form` events. It never emits `done`. It returns `{ text, tools: [], usage: { input: 0, output: 0 }, leadSent: false, engine: 'site' }`. A `navigate` adds a tool row `{ name: 'navigate', input: { href }, result: label, isError: false }`.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-quick.test.ts`. `run(text, opts?)` calls `quickTurn` with `history: [{ role: 'user', content: text }]`, `formShown: false` and `leadSent: false`, and collects the events.
- **Greeting:** `run('hi')` and `run('Thanks!')` → one text event equal to `assistant.quick.hello`, with no `form`.
- **Navigate:**
  - `run('Show me your projects')` → text `Taking you to Projects.` and `{ type: 'navigate', href: '/projects', label: 'Projects' }`.
  - `run('take me to the build plan')` → navigate `href` `'/projects#build-plan'`, so the longest label wins.
  - `run('show me your work')` → `/projects` (alias).
  - With Projects hidden in `NAV`, `run('show me your work')` emits no navigate.
- **Lead:**
  - `run('I have a project in mind')` → text ends with `assistant.quick.leadAsk`, then `{ type: 'form' }`.
  - `run('how much would it cost to hire you')` → the text starts with `**How much do you charge?**` and contains `leadAsk`, then `form`.
- **Search:** `run('do you use n8n')` → the text starts with `**Automation & Workflows**` and contains `More on [Services](/services)`.
- **No match:** `run('tell me a joke')` → text equals `assistant.quick.none`, then `form`.
- **No repeat card:** with `formShown: true`, `run('tell me a joke')` emits no `form`. With `leadSent: true`, `run('I have a project in mind')` emits no `form`.
- **Review Focus #3:** with `passages: [{ id: 'x', title: 'Long', text: 'word '.repeat(200), href: '/', label: 'Home' }]`, `run('word')` → the body line is at most 401 characters and ends with `…`, with no partial word before it.
- **Sentence cut:** a 600-character passage made of sentences is cut after the last `.` before character 400.
- **Record:** `record.engine` is `'site'` and `record.text` equals the emitted text.

`tests/assistant-events.test.ts`: `encodeEvent` → `readEvents` round-trips `{ type: 'source', engine: 'site' }` and `{ type: 'form' }`.

`tests/assistant-turn.test.ts`: the plain-text turn's record has `engine: 'claude'`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-quick.test.ts tests/assistant-events.test.ts tests/assistant-turn.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement `quickTurn`, the copy and the event and record changes**

Rules are checked in spec §4's order. Intents are matched as whole words or phrases on the lowercased message with punctuation stripped. The navigate aliases are exactly those in spec §4 rule 2.

- [ ] **Step 4: Run the tests to verify they pass**

Run: the same command, then `npm run typecheck`. Expected: PASS and clean.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/quick.ts lib/assistant/events.ts lib/assistant/turn.ts data/assistant.ts tests/assistant-quick.test.ts tests/assistant-events.test.ts tests/assistant-turn.test.ts
git commit -m "feat: the assistant's quick engine answers from the site's own text"
```

---

### Task 3: The chat route chooses the engine and falls back

**Files:**
- Create: `lib/assistant/ledger.ts`
- Modify:
  - `lib/assistant/config.ts`
  - `lib/assistant/limits.ts`
  - `lib/assistant/log.ts`
  - `supabase/migrations/0001_assistant.sql`
  - `app/api/chat/route.ts`
  - `data/assistant.ts` (delete `errors.off`)
- Test: `tests/assistant-config.test.ts`, `tests/assistant-limits.test.ts`, `tests/assistant-log.test.ts`, `tests/assistant-route.test.ts`

**Interfaces:**
- Consumes: `quickTurn`, `TurnRecord.engine`, the `source` event (Task 2); `runTurn`; `leadLedger` from `mail.ts`.
- Produces:
  - `mode(env = process.env): 'ai' | 'quick'`. `enabled` is removed.
  - `checkMessages(raw: unknown, endOnUser: boolean): { ok: true; messages: ChatMessage[] } | { ok: false; error: string }`. It holds today's message checks, and `checkChat` uses it with `endOnUser: true`.
  - `ChatRequest` gains `formShown: boolean` (a non-boolean or missing value → `false`).
  - `conversationLeads: LeadLedger`, the one shared instance, exported from `ledger.ts`.
  - `logTurn` writes `engine: record.engine` on tool and assistant rows, and skips any row whose `content` is `''`.

- [ ] **Step 1: Write the failing tests**

- `tests/assistant-config.test.ts`: `mode({})` is `'quick'`, `mode({ ANTHROPIC_API_KEY: 'sk' })` is `'ai'`, and `mode({ ASSISTANT_FAKE: '1' })` is `'ai'`. Delete the `enabled` cases.
- `tests/assistant-limits.test.ts`:
  - `checkChat({ ...ok, formShown: true }).req.formShown` is `true`; missing it gives `false`; `formShown: 'yes'` gives `false`.
  - `checkMessages([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }], false).ok` is `true`.
  - `checkMessages` of the same with `true` → `ok: false`.
- `tests/assistant-log.test.ts`:
  - The messages POST body's assistant and tool rows carry `engine: 'site'` for a site record.
  - With `userText: ''` and `record.text: ''`, the body holds only the tool rows.
- `tests/assistant-route.test.ts` (the fake env stays the default; per-test `vi.stubEnv` overrides):
  - **No key, no fake:** `ASSISTANT_FAKE` and `ANTHROPIC_API_KEY` unset, `Hi` → 200, text equal to `assistant.quick.hello`, then `done`. The 503 test is deleted.
  - **Fallback:** under fake, `fail what do you charge` → events contain `{ type: 'source', engine: 'site' }`, then text starting `**How much do you charge?**`, then `done`, and no `error` event. `logTurn` gets `record.engine === 'site'`.
  - **Visitor aborted:** when the visitor aborted (`req.signal` aborted before the stream), no fallback runs and no `source` event is sent.
  - **Both fail:** with `quickTurn` mocked to throw and the `fail` trigger → `error` (`errors.failed`), then `done`.
  - **`formShown`:** `formShown: true` with no key and `tell me a joke` → no `form` event.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-config.test.ts tests/assistant-limits.test.ts tests/assistant-log.test.ts tests/assistant-route.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

- **Route** (spec §3.2):
  - `mode() === 'quick'` → `quickTurn`.
  - Otherwise `runTurn`. On rejection with `!req.signal.aborted`: log the Claude error with `console.error`, emit `source`, run `quickTurn`.
  - `leadSent` comes from `conversationLeads.has(conversationId)`.
  - `runTurn`'s lead tools use `conversationLeads` (delete the route-local `leadLedger()`).
- **Migration:** in `0001_assistant.sql`, add `engine text check (engine in ('claude', 'site'))` to `messages`.
- **Copy:** delete `errors.off` from `data/assistant.ts`, and grep for leftovers.

- [ ] **Step 4: Run the tests to verify they pass**

Run: the same command, then `npx vitest run` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/config.ts lib/assistant/limits.ts lib/assistant/ledger.ts lib/assistant/log.ts supabase/migrations/0001_assistant.sql app/api/chat/route.ts data/assistant.ts tests/assistant-config.test.ts tests/assistant-limits.test.ts tests/assistant-log.test.ts tests/assistant-route.test.ts
git commit -m "feat: the chat answers without a key, and falls back to quick answers when Claude fails"
```

---

### Task 4: The lead form route

**Files:**
- Create: `app/api/chat/lead/route.ts`
- Test: `tests/assistant-lead-route.test.ts` (`// @vitest-environment node`)

**Interfaces:**
- Consumes: `checkMessages`, `LIMITS`, `conversationLeads` (Task 3); `checkLead`, `FIELDS` from `lib/contact.ts`; `clientIp`, `leadAllowed` from `lib/leadLimit.ts`; `resendMailer`, `fakeMailer`; `isFake`; `logTurn`; `rateLimit`; `after` from `next/server`.
- Produces: `POST(req: Request): Promise<Response>` with the statuses in spec §5.3. Request body: `{ conversationId, page, firstName, lastName, email, message, call: boolean, messages }`.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-lead-route.test.ts`. Mock `next/server`'s `after` as `tests/assistant-route.test.ts` does, mock `@/lib/assistant/log`, use `ASSISTANT_FAKE=1`, and give each request its own IP and conversation ID unless the test says otherwise.
- **Success:** a good body → 200 `{ ok: true }`. `console.info` (`fakeMailer`) is called once. `logTurn` gets `record` with `engine: 'site'`, `leadSent: true`, `text: ''`, `tools[0].name: 'lead_form'`, `tools[0].input: { call: false }`, and `userText: ''`.
- **Missing field:** missing `lastName` → 400 `{ errors: { lastName: contact.errors.lastName } }`.
- **Second lead:** the same `conversationId` again → 409 `{ error: assistant.quick.form.already }`.
- **Email limit:** a 6th lead from one IP (5 different conversations first) → 429 `{ error: assistant.errors.rate }`.
- **Mailer fails:** under a real mailer with `fetch` stubbed to return 500 (`ASSISTANT_FAKE` unset, Resend env set) → 502 `{ error: assistant.leadFailed }`, and the ledger does not record it (a retry gets 200 once `fetch` succeeds).
- **Call request:** `call: true` → the notify email's subject starts with `Call request from` (real mailer, `fetch` stubbed).
- **Bad request:** a bad `conversationId` → 400 `{ error: assistant.errors.bad }`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-lead-route.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement the route**

Checks run in spec §5.3's order. The transcript is built exactly as `app/api/chat/route.ts` builds it. On success, add to the ledger only after the mailer resolves.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-lead-route.test.ts tests/contact-route.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/lead/route.ts tests/assistant-lead-route.test.ts
git commit -m "feat: POST /api/chat/lead sends the chat's form card"
```

---

### Task 5: The browser side: source, form and sending the card

**Files:**
- Modify: `lib/assistant/client.ts`, `components/assistant/AssistantProvider.tsx`
- Test: `tests/AssistantProvider.test.tsx`

**Interfaces:**
- Consumes: the `source` and `form` events (Task 2); the `/api/chat/lead` statuses (Task 4).
- Produces:
  - `Entry` gains `{ id: string; kind: 'form'; state: 'open' | 'sent' | 'failed' }`, and the assistant entry gains `quick?: boolean`. `isEntry` accepts both.
  - `type LeadFields = { firstName: string; lastName: string; email: string; message: string; call: boolean }`
  - `sendLead(body: LeadFields & { conversationId: string; page: string; messages: ChatMessage[] }): Promise<{ ok: true } | { ok: false; errors?: Partial<Record<'firstName' | 'lastName' | 'email' | 'message', string>>; error?: string }>`, in `client.ts`. A network failure gives `{ ok: false, error: assistant.leadFailed }`.
  - The context gains `submitForm(id: string, fields: LeadFields): Promise<{ ok: true } | { ok: false; errors?: …; error?: string }>`.
    - It returns field errors without changing the entry.
    - On 200 it sets the entry to `sent`.
    - On 409, 429, 502 or a network error it sets the entry to `failed`.
  - Requests to `/api/chat` carry `formShown`: true when the last entry that isn't a user entry is a `form` entry.

- [ ] **Step 1: Write the failing tests** (add to `tests/AssistantProvider.test.tsx`)

- **Review Focus #1:** the stream sends text `Half`, then `{ type: 'source', engine: 'site' }`, then text `**How much…`, then `done`. The entries end with exactly one assistant entry, holding `**How much…` with `quick: true`. No entry holds `Half`, and none is `unfinished`.
- **Form event:** a `form` event adds `{ kind: 'form', state: 'open' }`. The next `send` posts `formShown: true`, and a later one after another reply posts `formShown: false`.
- **Send success:** `submitForm(id, fields)` with fetch 200 posts to `/api/chat/lead` with the fields, `conversationId`, `page` and the history. The entry becomes `sent`.
- **Field errors:** 400 `{ errors: { email: '…' } }` resolves `{ ok: false, errors: { email: '…' } }`, and the entry stays `open`.
- **Failure:** 502 → the entry becomes `failed`.
- **Reload:** a reload restores form entries with their state.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/AssistantProvider.test.tsx`. Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

On a `source` event:
- remove the open assistant entry, if any;
- set `current = null`;
- mark the next assistant entry the turn opens as `quick: true`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/AssistantProvider.test.tsx`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/client.ts components/assistant/AssistantProvider.tsx tests/AssistantProvider.test.tsx
git commit -m "feat: the assistant's browser side handles quick replies and the form card"
```

---

### Task 6: The panel: mode, note and form card

**Files:**
- Create: `components/assistant/LeadFormCard.tsx`
- Modify:
  - `components/assistant/AssistantPanel.tsx`;
  - `components/assistant/AssistantRoot.tsx` (`mode` prop, passed to the panel);
  - `components/assistant/Assistant.tsx` (always renders `<AssistantRoot mode={mode()} />`).
- Test: `tests/AssistantPanel.test.tsx`

**Interfaces:**
- Consumes: `mode()` (Task 3); `Entry`, `submitForm`, `LeadFields` (Task 5); the copy (Task 2).
- Produces:
  - `AssistantRoot({ mode }: { mode: 'ai' | 'quick' })` and `AssistantPanel({ launcherRef, mode })`.
  - `LeadFormCard({ entry }: { entry: Extract<Entry, { kind: 'form' }> })`. It renders the open form; `sent` renders the existing `leadOk` card and `failed` the existing `leadFailed` card with the Contact link.

- [ ] **Step 1: Write the failing tests** (add to `tests/AssistantPanel.test.tsx`)

- **Quick mode:** `mode="quick"` → the dialog shows `assistant.badgeQuick`, `assistant.greetingQuick` and `assistant.quick.note`, and doesn't show `assistant.badge` or `assistant.greeting`.
- **AI mode:** `mode="ai"` → today's badge and greeting, and no note in the first view.
- **Fallback note:** an assistant entry with `quick: true` shows `assistant.quick.note` under its bubble when `mode="ai"`.
- **Form card fields:** a `form` event renders a group named `assistant.quick.form.title`, with labelled fields First name, Last name, Email, What do you need? and a Request a call checkbox.
- **Field errors:** submitting with a 400 `{ errors: { email: contact.errors.emailFormat } }` shows that text under Email, sets `aria-invalid="true"` on it and focuses it.
- **Review Focus #2:** two quick clicks on Send → `fetch` is called once for `/api/chat/lead`, and the button reads `Sending` and is disabled while pending.
- **Sent:** a 200 shows `assistant.leadOk` and announces it in the live region.
- **Review Focus #5:** with sessionStorage pre-filled with `{ conversationId, entries: [user, assistant, { kind: 'form', state: 'open' }] }`, mounting shows the card with empty fields, and sending works.
- **Gate:** `Assistant()` with no key and no fake renders the root with `mode="quick"` (the launcher is present; opening it shows `badgeQuick`).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/AssistantPanel.test.tsx`. Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

Use the site's existing tokens and the panel's existing field and button styles. The card is a `fieldset` with a `legend`, or a `role="group"` with `aria-labelledby`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run`, then `npm run typecheck && npm run lint`. Expected: the whole suite passes, including `tests/no-raw-colors.test.ts`, and everything is clean.

- [ ] **Step 5: Commit**

```bash
git add components/assistant tests/AssistantPanel.test.tsx
git commit -m "feat: the panel shows quick answers and the lead form card"
```

---

### Task 7: Privacy text, setup notes and browser tests

**Files:**
- Modify: `data/legal.ts` (the body in Global Constraints), `.env.example`, `e2e/assistant.spec.ts`

**`.env.example`:** change the `ANTHROPIC_API_KEY` comment to: "Unset: the chat answers from this site's own pages (Quick answers). Set: Claude answers, and quick answers step in if Claude fails. Changing it takes a redeploy."

- [ ] **Step 1: Write the browser tests** (in `e2e/assistant.spec.ts`; the build uses `ASSISTANT_FAKE=1`, so the mode is `'ai'`)

- **Fallback:** sending `fail what do you charge` shows a reply containing `Depends on the build` with `Answers come straight from this site.` under it.
- **Form card:**
  - sending `fail I want to hire Justine` shows the group `Leave Justine a message`;
  - filling in `Ana`, `Reyes`, `ana@example.com` and `Our intake is manual` and pressing Send shows `Sent. Justine will reply by email within one business day.`
- **Privacy:** the "The site assistant" section's text contains `otherwise replies come straight from this site’s pages`.

- [ ] **Step 2: Make the copy and config changes**

- [ ] **Step 3: Run the suites**

Run: `npx vitest run && npm run lint && npm run typecheck && npx playwright test e2e/assistant.spec.ts e2e/plain.spec.ts --project=desktop && npx playwright test e2e/phone.spec.ts --project=phone`. Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add data/legal.ts .env.example e2e/assistant.spec.ts
git commit -m "feat: privacy text and setup notes for quick answers, with browser tests"
```
