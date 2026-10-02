# Site Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A floating "Kraft's assistant" chat on every `(site)` page. It answers from the site's own data, takes visitors to pages, and emails Justine leads and call requests with the transcript. It logs every conversation to Supabase.

**Architecture:**
- **Engine:** `lib/assistant/` is a small engine: limits, events, knowledge, prompt, tools, the Claude adapter (with a fake), the turn loop, and logging. A site config (`site.ts`) puts them together.
- **Route:** `app/api/chat/route.ts` checks the request, runs one turn, and streams newline-JSON events. It logs the turn with `after()`.
- **Client:** a client provider holds the conversation (in `sessionStorage`). A launcher and panel are mounted once in the `(site)` layout, and only when `enabled()` is true.

**Tech Stack:**
- Next.js 16, React 19 and Tailwind v4.
- `@anthropic-ai/sdk`, using the model `claude-haiku-4-5`.
- Supabase over its REST API (`fetch`, no SDK) and Resend (existing).
- Vitest with jsdom, and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-02-assistant-design.md`. Read it before starting, because every section number below (§n) refers to it.

## Global Constraints

- Work on branch `feat/assistant` (it already exists, with the spec committed). Commit only there; push, PR and merge only when the user says so.
- Before touching Next code, read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md). For this plan that means `01-app/01-getting-started/15-route-handlers.md`, `01-app/03-api-reference/04-functions/after.md` and `01-app/03-api-reference/03-file-conventions/02-route-segment-config/maxDuration.md`.
- House style: no semicolons, single quotes, long lines, and a short doc comment on each export. Never run prettier. Copy uses curly apostrophes (’).
- No raw hex colours (`tests/no-raw-colors.test.ts`); use tokens like `bg-s1`, `border-b1`, `text-ink`, `text-accent` and `shadow-(--tile-shadow)`. Nothing may mention kape (`tests/no-kape.test.ts`).
- Model `claude-haiku-4-5` (no date suffix). `max_tokens: 600`. No `thinking` parameter.
- Limits (§7.2): 20 messages per IP per 10 minutes · 1,000 characters per message · 30 visitor turns per conversation · history ≤ 40,000 characters · 3 tool rounds per turn · `maxDuration = 30`.
- Retention: 90 days. Nothing stores IP addresses or user agents.
- `ASSISTANT_FAKE=1` means: the fake Claude, no emails sent (mail is logged with `console.info`), and no Supabase writes.
- The Anthropic SDK refuses to run under jsdom. Every test that imports `lib/assistant/claude.ts` or the route starts with `// @vitest-environment node`, and the SDK client is built lazily, only in the real (non-fake) path.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Copy, verbatim.** These strings live in `data/assistant.ts` and Task 1 creates them:
  - Launcher, panel and greeting:

    ```
    launcher: 'Ask Kraft’s assistant'
    title: 'Kraft’s assistant'
    badge: 'AI'
    greeting: 'Hi, I’m Kraft’s assistant, an AI. Ask about Justine’s work, or leave a message for Justine.'
    chips: ['What do you build?', 'Show me your projects', 'I have a project in mind']
    notice: 'Chats are recorded to improve answers'
    privacy: 'Privacy'
    ```
  - Input and controls:

    ```
    inputLabel: 'Your message'
    placeholder: 'Ask about Justine’s work'
    send: 'Send'
    stop: 'Stop'
    newChat: 'New chat'
    close: 'Close chat'
    retry: 'Retry'
    ```
  - In-chat notices:

    ```
    going: 'Taking you to'
    unfinished: 'Reply cut off.'
    leadOk: 'Sent. Justine will reply by email within one business day.'
    leadFailed: 'That didn’t send. Please use the Contact page.'
    contact: { label: 'Contact page', href: '/contact' }
    ```
  - Errors (`errors.*`):

    ```
    rate: 'Let’s keep it short. For more, use the Contact page.'
    long: 'That message is too long. Keep it under 1,000 characters.'
    turns: 'This chat is at its limit. Start a new chat, or use the Contact page.'
    bad: 'That request didn’t look right. Try again.'
    failed: 'I can’t answer right now. Try again, or use the Contact page.'
    off: 'The assistant is off right now.'
    ```
- **The Privacy section, verbatim.** Insert it after "What is collected" in `data/legal.ts`:
  - heading: `The site assistant`
  - body: `The chat assistant on this site is an AI (Claude, by Anthropic). Your messages are sent to Anthropic to write each reply. Every conversation is stored for 90 days so answers can be improved, then deleted. No IP address is stored. Your name and email are kept only if you choose to leave them in the chat.`

## Review Focus

1. **A visitor presses Enter twice, or taps a chip, while a reply is still streaming.** Expect one request: input, Send and chips are disabled while streaming. Pinned in Task 8 (unit: a second Enter during a stream makes no second `fetch`).
2. **The network drops mid-reply.** Expect the partial text to stay, marked "Reply cut off.", with Retry re-sending the last question and not duplicating it. Pinned in Task 7 (unit: a stream that ends without `done`).
3. **`sessionStorage` throws** (private mode, blocked storage). Expect the chat to work, just without surviving a reload. Pinned in Task 7 (unit: stubbed storage that throws on `getItem`/`setItem`).
4. **Claude asks to navigate to a switched-off page** (`/showcase` while `hidden: true`) or to a made-up URL. Expect a refusal, with no `navigate` event. Pinned in Task 3 (unit: hide Showcase in `NAV`, then `navigate` `/showcase` is an error).
5. **The second turn of a conversation tries to insert its conversation row again.** Supabase answers 409 on a plain insert. Expect the upsert to ignore duplicates and the turn's messages to be stored. Pinned in Task 5 (unit: `Prefer: resolution=ignore-duplicates` and `on_conflict=id` on the conversations POST).

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `data/assistant.ts` | All visitor-facing copy | 1 |
| `lib/assistant/config.ts` | `MODEL`, `MAX_TOKENS`, `isFake()`, `enabled()` | 1 |
| `lib/assistant/limits.ts` | Limits, `checkChat`, `trimHistory` | 1 |
| `lib/assistant/events.ts` | `AssistantEvent`, `encodeEvent`, `readEvents` | 1 |
| `lib/assistant/knowledge.ts` | `Knowledge`, `buildKnowledge`, `siteKnowledge` | 2 |
| `lib/assistant/prompt.ts` | `PERSONA`, `systemBlocks` | 2 |
| `lib/resend.ts` | `sendEmail` (moved out of the contact route) | 3 |
| `lib/emails.ts` (modify) | `notifyEmail` gains transcript + call tag | 3 |
| `lib/assistant/mail.ts` | `Mailer`, `resendMailer`, `fakeMailer` | 3 |
| `lib/assistant/tools.ts` | `ToolRunner`, `TurnContext`, `leadLedger`, `siteTools` | 3 |
| `lib/assistant/claude.ts` | `StreamTurn`, `streamTurn` (real or fake) | 4 |
| `lib/assistant/fake.ts` | `fakeStreamTurn` scripted replies | 4 |
| `lib/assistant/turn.ts` | `runTurn` tool loop | 4 |
| `lib/assistant/site.ts` | `AssistantConfig`, `siteAssistant` | 4 |
| `lib/assistant/log.ts` | `logTurn` to Supabase REST | 5 |
| `supabase/migrations/0001_assistant.sql` | Tables, RLS, retention job | 5 |
| `app/api/chat/route.ts` | POST handler | 6 |
| `lib/assistant/client.ts` | `sendChat` (browser side of the stream) | 7 |
| `components/assistant/AssistantProvider.tsx` | Conversation state and storage | 7 |
| `components/assistant/AssistantLauncher.tsx`, `AssistantPanel.tsx`, `AssistantRoot.tsx`, `Assistant.tsx` | UI and the server gate | 8 |
| `app/(site)/layout.tsx` (modify) | Mount `<Assistant />` | 8 |
| `data/legal.ts`, `.env.example`, `playwright.config.ts`, `e2e/assistant.spec.ts`, `e2e/phone.spec.ts` | Privacy copy, setup, browser tests | 9 |

---

### Task 1: Copy, config, limits and stream events

**Files:**
- Create: `data/assistant.ts`, `lib/assistant/config.ts`, `lib/assistant/limits.ts`, `lib/assistant/events.ts`
- Test: `tests/assistant-limits.test.ts`, `tests/assistant-events.test.ts`, `tests/assistant-config.test.ts`

**Interfaces:**
- Produces:
  - `assistant` (the copy object from Global Constraints) from `data/assistant.ts`
  - `MODEL = 'claude-haiku-4-5'`, `MAX_TOKENS = 600`, `isFake(env = process.env): boolean`, `enabled(env = process.env): boolean` from `config.ts`
  - `LIMITS = { rate: { limit: 20, windowMs: 600_000 }, messageChars: 1000, turns: 30, historyChars: 40_000, toolRounds: 3 }`
  - `type ChatMessage = { role: 'user' | 'assistant'; content: string }`
  - `type ChatRequest = { conversationId: string; page: string; messages: ChatMessage[] }`
  - `checkChat(body: unknown): { ok: true; req: ChatRequest } | { ok: false; error: string }`
  - `trimHistory(messages: ChatMessage[]): ChatMessage[]`
  - `type AssistantEvent = { type: 'text'; delta: string } | { type: 'navigate'; href: string; label: string } | { type: 'lead'; ok: boolean } | { type: 'error'; error: string } | { type: 'done' }`
  - `encodeEvent(e: AssistantEvent): string` (JSON plus `\n`)
  - `readEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<AssistantEvent>`

- [ ] **Step 1: Write the failing tests**

`tests/assistant-config.test.ts`:
- `enabled({})` → `false`
- `enabled({ ANTHROPIC_API_KEY: 'sk' })` → `true`
- `enabled({ ASSISTANT_FAKE: '1' })` → `true`
- `isFake({ ASSISTANT_FAKE: '0' })` → `false`

`tests/assistant-limits.test.ts`, where `ID = '2f1e6c1a-8d2b-4c3e-9f00-1a2b3c4d5e6f'` and `ok = { conversationId: ID, page: '/', messages: [{ role: 'user', content: 'Hi' }] }`:
- `checkChat(ok)` → `{ ok: true, req: ok }`
- Each of these returns `{ ok: false, error: assistant.errors.bad }`:
  - a non-object;
  - `conversationId: 'x'`;
  - `page: 'https://evil.test'`;
  - a `page` longer than 200 characters;
  - `messages: []`;
  - a role of `'system'`;
  - a role of `'tool'`;
  - non-string content;
  - an array content (`[{ type: 'tool_result' }]`);
  - a last message from `assistant`.
- A user message of 1,001 characters → `assistant.errors.long` (1,000 passes).
- 31 user messages (alternating with assistant) → `assistant.errors.turns` (30 pass).
- `trimHistory` with 60 messages of 1,000 characters → total ≤ 40,000 characters, the last message is kept, and the first message has `role: 'user'`.

`tests/assistant-events.test.ts`:
- `encodeEvent({ type: 'done' })` → `'{"type":"done"}\n'`.
- `readEvents` over a `ReadableStream` that splits one line across two chunks yields the events in order.
- A blank line is skipped.
- A malformed line yields nothing for that line.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-config.test.ts tests/assistant-limits.test.ts tests/assistant-events.test.ts`
Expected: FAIL, because the modules aren't found.

- [ ] **Step 3: Implement the four files**

`checkChat` builds a fresh `ChatRequest` from the checked fields only; it never passes the body through. `conversationId` must match `/^[0-9a-f-]{36}$/i`. `page` must start with `/` and be ≤ 200 characters. `trimHistory` drops from the oldest end until the total is ≤ `historyChars`, then drops a leading assistant message. `readEvents` uses a `TextDecoder` with `{ stream: true }`, splits on `\n` and keeps the remainder.

- [ ] **Step 4: Run the tests to verify they pass**

Run: the same command. Expected: PASS. Also run `npx vitest run tests/no-kape.test.ts tests/no-raw-colors.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add data/assistant.ts lib/assistant/config.ts lib/assistant/limits.ts lib/assistant/events.ts tests/assistant-*.test.ts
git commit -m "feat: the assistant's copy, limits, request check and stream events"
```

---

### Task 2: Knowledge and prompt

**Files:**
- Create: `lib/assistant/knowledge.ts`, `lib/assistant/prompt.ts`
- Test: `tests/assistant-knowledge.test.ts`

**Interfaces:**
- Consumes: `commands()` from `lib/commands.ts`, `isHidden` and `NAV` from `data/nav.ts`, plus the data files.
- Produces:
  - `interface Knowledge { text(): string }`
  - `buildKnowledge(): string`, which is uncached and reads `isHidden` at call time.
  - `siteKnowledge: Knowledge`, which builds once per server instance.
  - `PERSONA: string`
  - `systemBlocks(k: Knowledge): Anthropic.TextBlockParam[]`. This returns one block: `PERSONA + '\n\n' + k.text()`, with `cache_control: { type: 'ephemeral' }`.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-knowledge.test.ts`:
- **Content:**
  - every `SERVICES[i].name` appears;
  - every `PROCESS[i].name` appears;
  - every `FAQS[i].q` appears;
  - every `projects.writeups[i].title` appears;
  - `projects.cards.agents.title` appears;
  - every `ROLES[i].name` appears;
  - `profile.name` appears;
  - `about.location.title` appears.
- **Placeholders:** the output does not contain `PLACEHOLDER`, and does not contain `profile.email`.
- **Links:** every `/…` link in the output (match `/\]\((\/[^)]*)\)/g`) is an `href` in `commands()`.
- **Hidden pages:** with `NAV.find(n => n.href === '/showcase')!.hidden = true` and the same for `/testimonials`, the output contains neither `showcase.title` text nor any `CLIENTS` name, and no `/showcase` link.
- **Budget:** `buildKnowledge().length / 4 < 30_000` (estimated tokens) and `> 4_096 * 4` (so Haiku 4.5 caches it).
- **Prompt:** `systemBlocks(siteKnowledge)` has length 1, ends with `buildKnowledge()`, carries `cache_control: { type: 'ephemeral' }`, and `PERSONA` contains `Kraft’s assistant`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-knowledge.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

`buildKnowledge` writes Markdown sections in the order given in §4. Each section has a `## Heading` and a `Page: [Label](href)` line using hrefs from `commands()`. A `clean()` helper drops any string starting with `PLACEHOLDER`. The Showcase and Testimonials data are included only when their pages are not hidden. `PERSONA` is §5's rules as plain prose, in second person, in the order §5 lists them. Install the SDK types now: `npm install @anthropic-ai/sdk` (only the type `Anthropic.TextBlockParam` is used here).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-knowledge.test.ts`. Expected: PASS. If the minimum-size assertion fails, add the agents' and automations' sample builds (their `name`, `business` and `caption` lines) until it passes.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/knowledge.ts lib/assistant/prompt.ts tests/assistant-knowledge.test.ts package.json package-lock.json
git commit -m "feat: the assistant's knowledge, built from the site's data, and its persona"
```

---

### Task 3: Lead email, mailer and tools

**Files:**
- Create: `lib/resend.ts`, `lib/assistant/mail.ts`, `lib/assistant/tools.ts`
- Modify: `app/api/contact/route.ts` (import `sendEmail` from `lib/resend.ts`, delete its local `send`), `lib/emails.ts` (`notifyEmail`)
- Test: `tests/assistant-tools.test.ts`, `tests/emails.test.ts` (add cases)

**Interfaces:**
- Consumes: `checkLead` and `Lead` from `lib/contact.ts`, `confirmEmail` and `notifyEmail` from `lib/emails.ts`, `commands()`.
- Produces:
  - `sendEmail(key: string, mail: Email & { from: string; to: string; replyTo: string }): Promise<void>`
  - `notifyEmail(lead: Lead, at: Date, extra?: { transcript?: string; call?: boolean }): Email`
  - `type Mailer = (lead: Lead, opts: { call: boolean; transcript: string }) => Promise<void>`. It throws on failure.
  - `resendMailer(env = process.env): Mailer` and `fakeMailer: Mailer`
  - `type TurnContext = { conversationId: string; transcript: string; mailer: Mailer; ledger: LeadLedger }`
  - `type ToolOutcome = { result: string; isError: boolean; event?: AssistantEvent; lead?: boolean }`
  - `type ToolRunner = { def: Anthropic.Tool; run(input: unknown, ctx: TurnContext): Promise<ToolOutcome> }`
  - `type LeadLedger = { has(id: string): boolean; add(id: string): void }`
  - `leadLedger(max = 1000): LeadLedger`. This is an in-memory set that drops its oldest IDs past `max`.
  - `siteTools(): ToolRunner[]`. It returns `navigate`, `submit_lead` and `request_call`, in that fixed order (the order matters for prompt caching).

- [ ] **Step 1: Write the failing tests**

`tests/emails.test.ts` additions:
- `notifyEmail(lead, at, { call: true, transcript: 'Visitor: hi' })`:
  - the subject is `Call request from Ana Reyes`;
  - the text contains `Transcript:` and `Visitor: hi`;
  - the HTML contains the transcript escaped (`<b>` becomes `&lt;b&gt;`).
- Without `extra`, the output is unchanged (the existing tests still pass).

`tests/assistant-tools.test.ts`, where `ctx` has a `vi.fn()` mailer and a fresh `leadLedger()`:
- **`navigate`:**
  - `{ href: '/projects', label: 'Projects' }` → `isError: false`, and the event is `{ type: 'navigate', href: '/projects', label: 'Projects' }`.
  - `{ href: '/nope' }` → `isError: true`, the result lists the valid hrefs, and there's no event.
  - With Showcase hidden in `NAV`, `/showcase` → `isError: true`.
  - Its `def.input_schema.properties.href.enum` equals `commands().map(c => c.href)`.
- **`submit_lead`:**
  - A good lead → the mailer is called with `{ call: false, transcript: ctx.transcript }`, the event is `{ type: 'lead', ok: true }`, and `lead: true`.
  - A missing `lastName` → `isError: true`, the result is `contact.errors.lastName`, and the mailer is not called.
  - The same `conversationId` a second time → `isError: true`, the result contains `already sent`, and the mailer is not called again.
  - The mailer rejects → `isError: true`, the event is `{ type: 'lead', ok: false }`, and the ledger does not record the conversation (a retry is allowed).
- **`request_call`:** the mailer is called with `call: true`.
- **Bad input:** non-object input (for example `'x'`) to any tool → `isError: true`. It doesn't throw.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-tools.test.ts tests/emails.test.ts`. Expected: FAIL on the new cases.

- [ ] **Step 3: Implement**

- **`sendEmail`:** move the contact route's `send` as is into `lib/resend.ts`.
- **`resendMailer`:** reads `RESEND_API_KEY`, `CONTACT_FROM` and `CONTACT_TO`, and throws if any is missing. It sends `notifyEmail(lead, new Date(), opts)` to `CONTACT_TO` with Reply-To the visitor. It then sends `confirmEmail` to the visitor, whose failure is only logged, as in the contact route.
- **`fakeMailer`:** logs `console.info('Assistant (fake): lead not sent', lead.email)`.
- **Lead tools:** these build a `FormData` from the input and call `checkLead`. The returned error is the first field's message, in `FIELDS` order.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-tools.test.ts tests/emails.test.ts tests/contact-route.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/resend.ts lib/assistant/mail.ts lib/assistant/tools.ts lib/emails.ts app/api/contact/route.ts tests/assistant-tools.test.ts tests/emails.test.ts
git commit -m "feat: the assistant's tools: navigate, leads and call requests, emailed with the transcript"
```

---

### Task 4: Claude adapter, fake Claude and the turn loop

**Files:**
- Create: `lib/assistant/claude.ts`, `lib/assistant/fake.ts`, `lib/assistant/turn.ts`, `lib/assistant/site.ts`
- Test: `tests/assistant-turn.test.ts` (`// @vitest-environment node`)

**Interfaces:**
- Consumes: `systemBlocks`, `Knowledge`, `ToolRunner`, `TurnContext`, `AssistantEvent`, `ChatMessage`, `LIMITS`, `MODEL`, `MAX_TOKENS`, `isFake`.
- Produces:
  - `type TurnRequest = { system: Anthropic.TextBlockParam[]; tools: Anthropic.Tool[]; messages: Anthropic.MessageParam[]; signal?: AbortSignal }`
  - `type StreamTurn = (req: TurnRequest, onText: (delta: string) => void) => Promise<Anthropic.Message>`
  - `streamTurn: StreamTurn`. It picks `fakeStreamTurn` when `isFake()`; otherwise it builds `new Anthropic()` once, calls `client.messages.stream({ model: MODEL, max_tokens: MAX_TOKENS, system, tools, messages }, { signal })`, sends text with `stream.on('text', onText)` and returns `await stream.finalMessage()`.
  - `fakeStreamTurn: StreamTurn`
  - `type AssistantConfig = { knowledge: Knowledge; tools: ToolRunner[] }`
  - `siteAssistant(): AssistantConfig`
  - `type TurnRecord = { text: string; tools: { name: string; input: unknown; result: string; isError: boolean }[]; usage: { input: number; output: number }; leadSent: boolean }`
  - `runTurn(opts: { config: AssistantConfig; history: ChatMessage[]; ctx: TurnContext; emit: (e: AssistantEvent) => void; stream?: StreamTurn; signal?: AbortSignal }): Promise<TurnRecord>`

**The fake's script** (match on the latest user text, case-insensitive). When the last message is a `tool_result`, it answers that tool's follow-up instead.

| Trigger | First call | After `tool_result` |
|---|---|---|
| `/fail/` | throws `new Error('fake failure')` | — |
| `/show me\|take me/` | `tool_use` `navigate` `{ href: '/projects', label: 'Projects' }` | text `Here are Justine’s projects.` |
| contains an email (`EMAIL_RE`) | `tool_use` `submit_lead`: word 1 → `firstName`, word 2 → `lastName`, the email, and the remaining words → `message` | text `Thanks, it’s sent. Justine will reply by email.` |
| `/in mind/` | text `Happy to pass it on. What’s your first and last name, your email, and what you need?` | — |
| anything else | text `Justine builds full-stack apps, AI agents and automations. See [Services](/services).`, sent through `onText` in 3 chunks | — |

Fake messages are built as `Anthropic.Message` with `stop_reason` `'tool_use'` or `'end_turn'` and `usage: { input_tokens: 10, output_tokens: 5 }`. Cast through a small `message()` helper.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-turn.test.ts`. These use `fakeStreamTurn` as `stream`, `siteAssistant()`, a `vi.fn()` mailer and a fresh ledger, and collect `emit`ted events.
- **Plain text:** the events are three `text` deltas joining to the fake answer. `record.text` equals it, `record.usage` is `{ input: 10, output: 5 }`, and there's no `done` (the route sends `done`).
- **Navigate:** `Show me your projects` → the events include `{ type: 'navigate', href: '/projects', label: 'Projects' }`, then the text `Here are Justine’s projects.`. `record.tools[0].name` is `'navigate'` and `usage.input` is 20 (two calls).
- **Lead:** `Ana Reyes ana@example.com Our intake is manual` → the mailer is called once and the events include `{ type: 'lead', ok: true }`. `record.leadSent` is `true`.
- **Tool-round cap:** a custom `stream` that always returns `tool_use` `navigate` → exactly `LIMITS.toolRounds + 1` calls, then `runTurn` resolves (no infinite loop).
- **`max_tokens` with `tool_use`:** a custom `stream` returning `stop_reason: 'max_tokens'` with a `tool_use` block → the tool is not run.
- **Errors:** the `fail` trigger → `runTurn` rejects.
- **Request shape:** a custom `stream` spy receives `system` equal to `systemBlocks(config.knowledge)`, tool defs in the order `navigate, submit_lead, request_call`, and `messages` equal to the history (as `MessageParam`s).

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-turn.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement**

`runTurn` is the manual loop from the claude-api skill's "Streaming Manual Loop", without `eager_input_streaming` (our tool inputs are tiny). Each round:
- calls `stream` and adds up `usage`;
- appends the assistant `content`;
- stops on `end_turn`, `refusal`, `max_tokens`, or when there are no `tool_use` blocks;
- otherwise runs every `tool_use` through its `ToolRunner` (an unknown name gives an `is_error` result), emits each outcome's `event`, and appends all `tool_result` blocks in one user message.

Text deltas are emitted as `{ type: 'text', delta }` and gathered into `record.text`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-turn.test.ts`. Expected: PASS. Then run `npm run typecheck`. Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/claude.ts lib/assistant/fake.ts lib/assistant/turn.ts lib/assistant/site.ts tests/assistant-turn.test.ts
git commit -m "feat: the assistant's turn loop over Claude, with a scripted fake for tests"
```

---

### Task 5: Conversation logging and the database

**Files:**
- Create: `lib/assistant/log.ts`, `supabase/migrations/0001_assistant.sql`
- Test: `tests/assistant-log.test.ts`

**Interfaces:**
- Consumes: `TurnRecord`, `isFake`.
- Produces: `logTurn(entry: { conversationId: string; page: string; userText: string; record: TurnRecord }, env = process.env): Promise<void>`. It never throws.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-log.test.ts`. These stub `fetch` and use env `SUPABASE_URL=https://db.test` and `SUPABASE_SERVICE_ROLE_KEY=srk`.
- **Conversation row:** the first call is `POST https://db.test/rest/v1/conversations?on_conflict=id`. Its headers include `apikey: srk`, `Authorization: Bearer srk` and `Prefer: resolution=ignore-duplicates`. Its body is `{ id, first_page: '/' }`.
- **Message rows:** the second call is `POST …/rest/v1/messages`, whose body is an array:
  1. the user row (`role: 'user'`, `content: userText`);
  2. one `role: 'tool'` row per tool (`tool_name`, `tool_input`, `content` = result);
  3. the assistant row (`content: record.text`, `input_tokens`, `output_tokens`).
- **Lead flag:** when `record.leadSent` is true, a third call is `PATCH …/rest/v1/conversations?id=eq.<id>` with `{ lead_captured: true }`.
- **No env:** no `fetch`, and one `console.warn`.
- **Fake mode** (`ASSISTANT_FAKE=1`): no `fetch` and no warning.
- **Failures:** `fetch` rejecting, or answering 500 → it resolves, and logs `console.error`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-log.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement `log.ts` and write the migration**

The migration holds:
- the two tables exactly as in §7.4;
- `create index on messages (conversation_id, created_at)`;
- `alter table … enable row level security` on both tables, with no policies;
- `create extension if not exists pg_cron`;
- `select cron.schedule('assistant-retention', '15 3 * * *', $$delete from conversations where started_at < now() - interval '90 days'$$)`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-log.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/log.ts supabase/migrations/0001_assistant.sql tests/assistant-log.test.ts
git commit -m "feat: the assistant logs each turn to Supabase, kept 90 days"
```

---

### Task 6: The chat route

**Files:**
- Create: `app/api/chat/route.ts`
- Test: `tests/assistant-route.test.ts` (`// @vitest-environment node`)

**Interfaces:**
- Consumes:
  - `enabled`, `isFake`, `checkChat`, `trimHistory`, `LIMITS` and `encodeEvent`;
  - `runTurn` and `siteAssistant`;
  - `resendMailer`, `fakeMailer` and `leadLedger`;
  - `logTurn` and `rateLimit`;
  - `assistant`, and `after` from `next/server`.
- Produces: `export const maxDuration = 30` and `export async function POST(req: Request): Promise<Response>`.

- [ ] **Step 1: Write the failing tests**

`tests/assistant-route.test.ts`:
- **Setup:**
  - `vi.mock('next/server', async (orig) => ({ ...(await orig()), after: (fn: () => unknown) => { pending.push(fn) } }))`, then run `pending` by hand.
  - Env: `ASSISTANT_FAKE=1`.
  - A per-test IP helper, as in `tests/contact-route.test.ts`.
  - Read the body with `readEvents`.
- **Text:** `Hi` → 200, `content-type` `application/x-ndjson`, the text events, then `{ type: 'done' }` last.
- **Navigate:** `Show me your projects` → a `navigate` event before `done`.
- **Lead:** with `ASSISTANT_FAKE=1` → a `lead` `ok: true` event, `console.info` called, and no `fetch` to Resend.
- **Failure:** `fail` → `{ type: 'error', error: assistant.errors.failed }` then `done`, status 200.
- **Off:** with no `ANTHROPIC_API_KEY` and no `ASSISTANT_FAKE` → 503, `{ error: assistant.errors.off }`.
- **Rate limit:** the 21st request from one IP → 429, `{ error: assistant.errors.rate }`.
- **Bad requests:** a bad body → 400 `{ error: assistant.errors.bad }`; 1,001 characters → 400 `{ error: assistant.errors.long }`.
- **Logging:** after `await Promise.all(pending.map(f => f()))`, `logTurn` (spied via `vi.mock('@/lib/assistant/log')`) was called once with the `conversationId`, `page`, user text and a record. When `logTurn` rejects, the response is unchanged.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/assistant-route.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement the route**

Read the three Next docs named in Global Constraints first. The handler works like this:
1. Check, in order: enabled → rate limit (IP as in the contact route) → JSON → `checkChat`.
2. Build a `ReadableStream`. Its `start` runs `runTurn`:
   - `history` is `trimHistory(req.messages)`.
   - `ctx.transcript` is the history as `Visitor: …` / `Assistant: …` lines.
   - `mailer` is `isFake() ? fakeMailer : resendMailer()`.
   - `ledger` is a module-level `leadLedger()`.
   - `signal` is `req.signal`.
3. A rejection becomes an `error` event and is logged with `console.error`. Always end with `done`, then close.
4. Keep the turn's promise. In `after`, await it and call `logTurn` when it resolved.
5. Respond with `new Response(stream, { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store' } })`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/assistant-route.test.ts`. Expected: PASS. Then run `npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts tests/assistant-route.test.ts
git commit -m "feat: POST /api/chat streams the assistant's turn as newline JSON"
```

---

### Task 7: Client stream and conversation state

**Files:**
- Create: `lib/assistant/client.ts`, `components/assistant/AssistantProvider.tsx`
- Test: `tests/AssistantProvider.test.tsx`

**Interfaces:**
- Consumes: `readEvents`, `AssistantEvent`, `ChatMessage`, `assistant`, and `useShellNav` from `components/shell/NavigationProvider`.
- Produces:
  - `sendChat(body: ChatRequest, signal: AbortSignal): AsyncGenerator<AssistantEvent>`. A non-OK response yields `{ type: 'error', error: body.error ?? assistant.errors.failed }`. A network failure yields `errors.failed`.
  - `type Entry = { id: string; kind: 'user' | 'assistant'; text: string; unfinished?: boolean } | { id: string; kind: 'navigate'; href: string; label: string } | { id: string; kind: 'lead'; ok: boolean } | { id: string; kind: 'error'; text: string }`
  - `AssistantProvider({ children })`
  - `useAssistant(): { open: boolean; setOpen(v: boolean): void; entries: Entry[]; streaming: boolean; send(text: string): void; stop(): void; retry(): void; reset(): void }`
  - `STORAGE_KEY = 'kraft-assistant'` (`sessionStorage`, `{ conversationId, entries }`)

- [ ] **Step 1: Write the failing tests**

`tests/AssistantProvider.test.tsx`. Mock `next/navigation` as `tests/CommandPalette.test.tsx` does, and wrap in `NavigationProvider`. Stub `fetch` to return a `Response` whose body is a `ReadableStream` of encoded events.
- **Send:** `send('Hi')` posts `{ conversationId: <uuid>, page: '/', messages: [{ role: 'user', content: 'Hi' }] }`. Text deltas build one assistant entry. `streaming` is true until `done`.
- **History:** a second `send` includes the earlier user and assistant texts, but not the navigate, lead or error entries.
- **Navigate:** a `navigate` event adds a navigate entry and calls the shell's `go('/projects')` (spy on the mocked router's `push`).
- **Lead:** a `lead` event adds a lead entry.
- **Cut-off stream** (ends without `done`): the assistant entry has `unfinished: true`, and `streaming` is false. `retry()` removes that entry and re-sends the same messages: the last user message is not duplicated.
- **Errors:** a 429 with `{ error: assistant.errors.rate }` → an error entry with that text.
- **Stop:** `stop()` aborts the fetch's signal, and the partial entry is `unfinished`.
- **Reload:** remounting the provider restores `entries` and `conversationId` from `sessionStorage`. `reset()` clears both and makes a new ID.
- **Storage failure:** `sessionStorage.getItem`/`setItem` stubbed to throw → `send` still works and nothing throws.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/AssistantProvider.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement**

- **IDs:** use `crypto.randomUUID()`.
- **Page:** the `page` field comes from `usePathname()`.
- **Storage:** wrap every storage access in try/catch. Write on each entries change.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/AssistantProvider.test.tsx`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/assistant/client.ts components/assistant/AssistantProvider.tsx tests/AssistantProvider.test.tsx
git commit -m "feat: the assistant's conversation state, kept for the tab and across pages"
```

---

### Task 8: Launcher, panel and mounting

**Files:**
- Create: `components/assistant/AssistantLauncher.tsx`, `AssistantPanel.tsx`, `AssistantRoot.tsx` (client: provider + launcher + panel), `Assistant.tsx` (server gate)
- Modify: `app/(site)/layout.tsx` (render `<Assistant />` after `<FloatingAccess />`)
- Test: `tests/AssistantPanel.test.tsx`

**Interfaces:**
- Consumes: `useAssistant`, `enabled`, `assistant`.
- Produces: `export default function Assistant()`, which returns `enabled() ? <AssistantRoot /> : null`.

Layout details (§8):
- **Launcher:** a `button` with `aria-label={assistant.launcher}`, `aria-expanded` and `aria-controls` set to the panel's ID, and a Phosphor `ChatCircleDotsIcon`.
  - Classes: `fixed right-5 z-30 size-10 rounded-xl bg-s1 border border-b1 shadow-(--tile-shadow)`.
  - Phones: `bottom-[calc(96px+env(safe-area-inset-bottom))]`. Desktop: `shell:bottom-[72px]`, which puts it directly above `FloatingAccess` at `bottom-5`.
- **Panel:** `role="dialog"`, `aria-modal="false"`, and `aria-labelledby` its `h2` ("Kraft’s assistant", with the "AI" badge).
  - Phones: `fixed inset-0 z-40`. Desktop: `shell:inset-auto shell:right-5 shell:bottom-[124px] shell:w-[380px] shell:h-[560px] shell:rounded-2xl`.
  - It carries `data-a11y-scale`.
- **First view:** the greeting, then the chips, then the notice line with a Privacy link.
- **Controls:** a labelled `textarea` (`maxLength={1000}`). Enter sends and Shift+Enter adds a new line. While `streaming`, the input, Send and chips are disabled, and Stop shows instead of Send. New chat and Close sit in the header.
- **Entries:**
  - an `unfinished` entry shows `assistant.unfinished` and a Retry button;
  - a navigate entry shows `${assistant.going} ${label}…`;
  - a lead entry shows `leadOk` or `leadFailed`, with the Contact link;
  - an error entry shows its text, with the Contact link.
- **Links:** Markdown links `[text](/path)` inside an assistant message render as anchors that call the shell's `go`. Nothing else is parsed as Markdown.
- **Live region:** a visually hidden `<p aria-live="polite">` holds the last finished reply's text, set once when streaming ends.
- **Escape:** Esc in the panel closes it and focuses the launcher.

- [ ] **Step 1: Write the failing tests**

`tests/AssistantPanel.test.tsx`. Render `AssistantRoot` inside `NavigationProvider`, with `next/navigation` mocked and `fetch` stubbed as in Task 7.
- **Opening:** the launcher, named `Ask Kraft’s assistant`, opens a dialog named `Kraft’s assistant`. The greeting and the three chips are visible, and the Privacy link `href` is `/privacy`.
- **Chips:** clicking `What do you build?` posts that text.
- **Double send:** pressing Enter twice while a stream is pending → `fetch` is called once, and the textarea is disabled.
- **New line:** Shift+Enter does not send.
- **Escape:** Esc closes the dialog and focuses the launcher.
- **Navigate entry:** it renders `Taking you to Projects…`.
- **Links:** `[Services](/services)` in a reply renders a link named `Services`, and clicking it calls the router's `push` with `/services`.
- **Gate:** `Assistant()` returns `null` with `ANTHROPIC_API_KEY` and `ASSISTANT_FAKE` unset (`vi.stubEnv`), and an element when `ASSISTANT_FAKE=1`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/AssistantPanel.test.tsx`. Expected: FAIL.

- [ ] **Step 3: Implement the four components and mount `<Assistant />` in the layout**

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run`. Expected: the whole unit suite passes, including `tests/FloatingAccess.test.tsx`, `tests/hide-pages.test.tsx` and `tests/no-raw-colors.test.ts`. Then run `npm run lint && npm run typecheck`.

- [ ] **Step 5: Commit**

```bash
git add components/assistant app/(site)/layout.tsx tests/AssistantPanel.test.tsx
git commit -m "feat: the assistant's launcher and panel, on every page when a key is set"
```

---

### Task 9: Privacy copy, setup notes and browser tests

**Files:**
- Modify: `data/legal.ts` (the section from Global Constraints), `.env.example`, `playwright.config.ts` (`webServer.env: { ASSISTANT_FAKE: '1' }`), `e2e/phone.spec.ts`
- Create: `e2e/assistant.spec.ts`

**`.env.example` additions** (comment style as the file already uses):
- `ANTHROPIC_API_KEY=`, with "Unset: the assistant is off and its button is hidden. Adding it takes a redeploy."
- `SUPABASE_URL=` and `SUPABASE_SERVICE_ROLE_KEY=`, with "Server-only. Unset: chats work and are not logged. Run supabase/migrations/0001_assistant.sql once in the Supabase SQL editor (enable pg_cron first under Database → Extensions)."
- `# ASSISTANT_FAKE=1`, with "Tests only: scripted replies, no emails, no logging. Never set in production."

- [ ] **Step 1: Write the browser tests**

`e2e/assistant.spec.ts` (desktop). Use `hydrated(page)` after each `goto`.
- **Placement:** the launcher is visible on `/`, and its bounding box sits above the accessibility button's (`[data-floating-access]`), with no overlap.
- **Chips:** opening shows the greeting. Clicking `What do you build?` streams in text containing `full-stack apps`.
- **Navigate:** sending `Show me your projects` → the URL becomes `/projects`, the dialog is still open, and the chat still holds the first exchange.
- **Lead:** sending `I have a project in mind` → the fake asks for details. Sending `Ana Reyes ana@example.com Our intake is manual` → `Sent. Justine will reply by email within one business day.` is visible.
- **Reload:** after a reload, reopening the launcher shows the earlier messages. New chat clears them.
- **Escape:** Esc closes the panel and the launcher is focused.

`e2e/phone.spec.ts` addition:
- **Phone layout:** the launcher's bottom edge is above the tab bar's top edge. When open, the dialog's box matches the viewport (390×844), with no horizontal page scroll (`scrollWidth <= innerWidth`).

The privacy test: `/privacy` shows the heading `The site assistant`.

- [ ] **Step 2: Make the copy and config changes**

- [ ] **Step 3: Run the full suites**

Run: `npx vitest run && npm run lint && npm run typecheck && npm run e2e`.
Expected: all PASS. If existing e2e tests now collide with the launcher (for example a test that clicks near the bottom-right, or counts dialogs or buttons), fix the test's selector to be specific. Don't move the launcher.

- [ ] **Step 4: Commit**

```bash
git add data/legal.ts .env.example playwright.config.ts e2e/assistant.spec.ts e2e/phone.spec.ts
git commit -m "feat: privacy copy and setup notes for the assistant, with browser tests"
```

- [ ] **Step 5: Hand back for the manual check**

Report the §10.4 checklist to the user, to run once they have an Anthropic key and a Supabase project:
- **Accuracy:** five facts checked against the pages.
- **Off topic:** an unrelated question is politely declined.
- **Prompt injection:** an attempt is treated as the visitor's own words.
- **Lead:** it arrives with the transcript.
- **Logging:** a row appears in Supabase.
