# The site assistant without an API key: design

**Date:** 2026-10-02
**Status:** Design approved 2026-10-02 in chat; written spec awaiting review
**Builds on:** `docs/superpowers/specs/2026-10-02-assistant-design.md` (the assistant spec). This spec changes that one where they disagree: §2's "No API key → the launcher is not rendered", and §3.3, are replaced.
**Why:** Justine wants the chat to work even when no `ANTHROPIC_API_KEY` is set. Without a key, it answers from the site's own content, with no AI and no cost. With a key, the same engine steps in when Claude fails.

## 1. Goal

The launcher shows on every page whether or not a key is set.
- **No key:** every reply comes from a built-in site-content engine (the **quick** engine). Its replies quote the site's own text and link to the right page. It takes visitors to pages, and it offers an inline lead form for hiring, pricing, project and call questions.
- **Key set:** Claude answers as before. When a Claude call fails, the quick engine answers that turn instead of an error.
- **When the key is added later:** Claude takes over automatically, after a redeploy.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
|---|---|
| No-key behaviour | Answer from site content, without AI |
| When the quick engine replies | Always when there is no key, and as a fallback when a Claude call fails |
| Labelling | The badge reads "Quick answers" instead of "AI", plus the line "Answers come straight from this site." A fallback reply carries the line under its bubble. |
| Leads without AI | An inline form card in the chat |
| Where matching runs | Approach A: on the server, inside `/api/chat`, as keyword scoring plus intent rules, with no new packages |

## 3. Architecture

### 3.1 Files

| Path | Job |
|---|---|
| `lib/assistant/source.ts` (new) | The shared rules both engines use: `clean()` for placeholders, page gating by `commands()`, and `ref()` links. `knowledge.ts` is refactored to use it; its output does not change. |
| `lib/assistant/passages.ts` (new) | `buildPassages(): Passage[]`, built from the same data as the knowledge document |
| `lib/assistant/search.ts` (new) | `searchPassages(query, passages)`: keyword scoring |
| `lib/assistant/quick.ts` (new) | `quickTurn()`: the quick engine (§4) |
| `lib/assistant/ledger.ts` (new) | The once-per-conversation lead record, a single shared instance (moved out of the chat route) |
| `app/api/chat/lead/route.ts` (new) | POST for the form card (§5.3) |
| `app/api/chat/route.ts` | Always answers. Picks the engine; falls back on a Claude failure (§3.2). |
| `lib/assistant/config.ts` | `enabled()` is removed. New `mode(env): 'ai' \| 'quick'`: `'ai'` with a key or `ASSISTANT_FAKE=1`, else `'quick'`. |
| `lib/assistant/events.ts` | Two new events: `{ type: 'source'; engine: 'site' }` and `{ type: 'form' }` |
| `lib/assistant/turn.ts`, `log.ts` | `TurnRecord` gains `engine: 'claude' \| 'site'`; the log writes it |
| `lib/assistant/fake.ts` | The `fail` trigger still throws, which now exercises the fallback |
| `components/assistant/Assistant.tsx` | Always renders `AssistantRoot` and passes `mode()` |
| `components/assistant/AssistantProvider.tsx` | Handles `source` and `form`; sends the form; new entry kinds (§5) |
| `components/assistant/AssistantPanel.tsx` | Badge, greeting and note by mode; the fallback note; the form card |
| `data/assistant.ts` | New copy (§6) |
| `data/legal.ts` | The Privacy paragraph (§6) |
| `supabase/migrations/0001_assistant.sql` | `messages.engine` column (edited in place, because the migration has never been run) |

`Passage = { id: string; title: string; text: string; href: string; label: string }`. `href` and `label` come from `commands()`.

### 3.2 One turn

1. The request checks are unchanged: rate limit, `checkChat` and the limits. The 503 "off" refusal is removed, and `assistant.errors.off` is deleted.
2. **`mode() === 'quick'`:** `quickTurn` answers.
3. **`mode() === 'ai'`:** `runTurn` answers, as today. If it rejects, and the visitor did not abort:
   - the route emits `{ type: 'source', engine: 'site' }`;
   - then it runs `quickTurn` for the same history;
   - the logged record is the quick one (`engine: 'site'`), with Claude's error in the server log.
4. If `quickTurn` itself throws, the route emits today's `error` event (`assistant.errors.failed`). Every path ends with `done`.

### 3.3 The launcher

`Assistant.tsx` always renders `AssistantRoot mode={mode()}`. Because the `(site)` layout is static, the mode is fixed at build time, as the key check is today, so adding a key takes a redeploy.

## 4. The quick engine

`quickTurn({ history, emit, ctx }): Promise<TurnRecord>` reads only the visitor's last message. It checks these rules in order, and the first match wins. Its text goes out as one `text` event.

1. **Greeting or thanks.** The whole message is a greeting or a thanks (hi, hello, hey, thanks, thank you, ok, cool). It answers `quick.hello`.
2. **Navigate.** The message has a go-intent (`take me to`, `show me`, `open`, `go to`, `bring me to`) and names an entry of `commands()`, by its label or one of these aliases:
   - `work`, `portfolio` → `/projects`
   - `hire`, `contact`, `message` → `/contact`
   - `prices`, `services`, `offers` → `/services`
   - `about`, `bio` → `/about`
   - `home` → `/`

   A label matches when every word of it, ignoring "the" and letter case, appears in the message, and the longest matching label wins (so "show me the build plan" opens The build plan, not Projects). Only aliases whose target is in `commands()` count. It answers `${quick.going} ${label}.` and emits `navigate`.
3. **Lead.** The message has a lead-intent: hire, work with, work together, quote, estimate, project in mind, call, meet, meeting, book, get in touch, contact Justine, email Justine.
   - If search finds a strong passage, it answers that passage (rule 4's format) first, then `quick.leadAsk`, then emits `form`.
   - Otherwise it answers `quick.leadAsk`, then emits `form`.
4. **Search.** It answers the best passage at or above the threshold:

   ```
   **<passage.title>**
   <passage.text, cut to ≤ 400 characters at a sentence end>
   <quick.more> [<label>](<href>)
   ```

   It adds `<quick.also> [<label>](<href>)` for the second-best passage when that passage scores at least 60% of the best one and sits on a different page.
5. **No match.** It answers `quick.none` and emits `form`.

Rules that apply throughout:
- **No form card twice in a row:** it emits no `form` when the conversation's previous assistant turn already showed one. The client tells the server through `formShown` (§5.2).
- **No form card after a lead:** it emits no `form` once a lead was sent in this conversation (the ledger).
- **Only site text:** every word is either site text from a passage or a fixed line from `data/assistant.ts`.

### 4.1 Passages

There is one passage each for:
- every FAQ;
- every service;
- the method intro, and every Kraft Method step;
- the live-automation section;
- each Projects card, each write-up, each sample site group, and each agent and automation sample build;
- About (intro and story, location, each role);
- the stack.

Showcase and testimonial passages exist only while their pages are on. Every string goes through the shared `clean()`, and every passage needs a `commands()` link.

### 4.2 Search

- **Words:** lowercase the text, split it into words, and drop common words (a short fixed list). Trim the endings `-ing`, `-ed`, `-es`, `-s` (only when the remaining word is 3 characters or longer).
- **Synonyms:** expand the query with a small fixed map:
  - price ↔ cost, charge, rate, budget;
  - hire ↔ work with;
  - start ↔ begin, available;
  - build ↔ make, develop;
  - chatbot ↔ bot, chat, RAG;
  - automation ↔ workflow, n8n, zapier, make;
  - maintain ↔ support, maintenance;
  - where ↔ based, location.
- **Scoring:** BM25 over each passage's title and text, with title terms counted ×2.
- **Threshold:** `MIN_SCORE`, tuned so every question in §7's list lands correctly and the off-topic ones fall below it.
- **Determinism:** the same input always gives the same result.

## 5. Leads without AI

### 5.1 The form card

- **When it appears:** a `form` event adds a `{ kind: 'form'; id; state: 'open' | 'sent' | 'failed' }` entry.
- **Fields:**
  - `quick.form.firstName`, `quick.form.lastName` and `quick.form.email`, as inputs;
  - `quick.form.message`, as a textarea;
  - `quick.form.call`, as a checkbox;
  - and a `quick.form.send` button.
- **Sending:** the card posts to `/api/chat/lead`.
- **Field errors:** they show under each field, with the field marked `aria-invalid` and the first bad field focused.
- **After sending:**
  - Success: the card's entry becomes `state: 'sent'` and renders the existing `leadOk` card.
  - Failure, or the limit was hit: it becomes `failed` and renders the existing `leadFailed` card with the Contact link.
- **Persistence:** the card's state is saved in `sessionStorage` with the chat.
- **Announcements:** the outcome is announced through the existing live region.
- **Keyboard:** the card is fully usable from the keyboard.

### 5.2 Request history

The client still sends only user and assistant text as history (form entries are never sent). Requests to `/api/chat` gain `formShown: boolean`: true when the last non-user entry is a `form` entry. `checkChat` accepts it and defaults it to false.

### 5.3 `POST /api/chat/lead`

- **Request:** `{ conversationId, page, firstName, lastName, email, message, call: boolean, messages }`, where `messages` is the transcript history and passes the same `checkChat` rules. A history ending on an assistant message is allowed for this route.
- **Checks, in order:**
  1. the chat rate limit (`LIMITS.rate`);
  2. the body shape;
  3. `checkLead` → 400 `{ errors: { field: sentence } }`;
  4. the shared ledger → 409 `{ error: quick.form.already }`;
  5. `leadAllowed(ip)` → 429 `{ error: assistant.errors.rate }`;
  6. the mailer: `resendMailer`, or `fakeMailer` under `ASSISTANT_FAKE` → 502 `{ error: assistant.leadFailed }` if it fails.
- **On success:** 200 `{ ok: true }`, the ledger records the conversation, and `after()` logs a turn with `engine: 'site'`, a `lead_form` tool row, `leadSent: true` and `text: ''`.
- **Email:** the same `notifyEmail` as chat leads, with the transcript label and the assistant footer. A call request is tagged as one.

## 6. Copy (verbatim, in `data/assistant.ts` unless noted)

- `badgeQuick`: `Quick answers`
- `greetingQuick`: `Hi, I’m Kraft’s assistant. Ask about Justine’s work, or leave a message for Justine.`
- `quick.note`: `Answers come straight from this site.`
- `quick.hello`: `Hi! Ask about Justine’s services, projects or process, or leave a message.`
- `quick.going`: `Taking you to`
- `quick.more`: `More on`
- `quick.also`: `Also:`
- `quick.leadAsk`: `Want Justine to reply? Leave your details:`
- `quick.none`: `I couldn’t find that on the site. Try asking about services, projects or how Justine works, or leave Justine a message.`
- `quick.form`:
  - `title: 'Leave Justine a message'`
  - `firstName: 'First name'`
  - `lastName: 'Last name'`
  - `email: 'Email'`
  - `message: 'What do you need?'`
  - `call: 'Request a call'`
  - `send: 'Send'`
  - `sending: 'Sending'`
  - `already: 'Your message is already with Justine.'`

**In `data/legal.ts`.** The "The site assistant" section body becomes:

> The chat assistant on this site answers in one of two ways. When an AI is switched on, your messages are sent to Anthropic (Claude) to write each reply; otherwise replies come straight from this site’s pages. Every conversation is stored for 90 days so answers can be improved, then deleted. No IP address is stored. Your name and email are kept only if you choose to leave them in the chat.

The `'ai'` mode keeps today's `badge` (`AI`) and `greeting`.

## 7. Testing

- **Passages:** every FAQ, service and Kraft Method step has a passage. Hidden pages and `PLACEHOLDER` strings are excluded. Every `href` is in `commands()`.
- **Search, the must-land list.** Each question must have its best passage on the named page or FAQ:
  - `what do you charge` → FAQ "How much do you charge?"
  - `how fast can you start` → FAQ "How fast can you start?"
  - `do you maintain what you build` → FAQ "Do you maintain what you build?"
  - `what happens after I send a message` → FAQ "What happens after I write?"
  - `what do you build` → FAQ "What do you actually build?"
  - `do you use n8n` → service "Automation & Workflows"
  - `can you build a RAG chatbot` → service "AI Agents & RAG"
  - `I need a CRM` → service "CRM, CMS & Internal Tools"
  - `do you build websites` → service "Full-Stack Web & SaaS"
  - `can you connect my APIs` → service "APIs & Integrations"
  - `where are you based` → About location
  - `what is the Kraft method` → the method passage
  - `what tools do you use` → the stack
  - `tell me about your agentic framework` → the Agentic Framework write-up (Projects)

  And these must score below `MIN_SCORE`: `what's the weather today`, `tell me a joke`, `who won the game`.
- **Rules:** each rule fires on its examples, in order; there is no form card twice in a row and none after a lead; the 400-character cut ends at a sentence end.
- **Route:**
  - no key → quick reply, with no 503;
  - key plus a failing Claude → `source` then a quick reply, logged as `engine: 'site'`;
  - quick engine throws → `error` then `done`;
  - `formShown` is passed through.
- **Lead route:** 200 and the email; field errors; the ledger 409; the shared limit 429; 502; fake mode sends nothing; the log row.
- **Panel:**
  - the quick badge, greeting and note when `mode="quick"`;
  - the AI badge and greeting when `mode="ai"`;
  - the fallback note after a `source` event;
  - the form card: errors, send, failed, keyboard, kept across a reload, announced.
- **Gate:** `Assistant()` renders `AssistantRoot` with `mode="quick"` when no key and no fake is set.
- **Browser (fake build):**
  - `fail what do you charge` shows a reply with the fallback note and the pricing FAQ text;
  - `fail I want to hire Justine` shows the form card;
  - filling it in and sending shows the `leadOk` card.

## 8. Out of scope

Fuzzy or typo-tolerant matching, embeddings, multi-turn understanding in the quick engine, a ⌘K entry for the assistant, and quick-engine answers from pages outside `commands()`.
