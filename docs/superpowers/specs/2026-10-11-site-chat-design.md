# Site chat: design

**Date:** 2026-10-11
**Status:** Design approved 2026-10-11 in chat; spec awaiting review
**History:** A first site assistant shipped in PR #41 (2026-10-02) and was removed in `e7cad7b` (2026-10-03). Justine removed it for four reasons: cost and API-key worries, too much code (~5,000 lines), answers that weren't good enough, and a feel that was gimmicky. This design is a much smaller rebuild that has to clear the same bar. The floating button and a Haiku model were reconsidered in light of that history and kept on purpose.

## 1. Goal

A small "ask about my work" chat on every page that turns visitors into leads. It answers questions about services, process, past builds and Justine's background from the site's own content, and when a visitor sounds interested it hands them to the existing contact form with their questions already filled in.

Success is more good enquiries through the contact form, not chat volume.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
| --- | --- |
| Purpose | Lead generation: answer, then hand off to the contact form |
| Provider and model | Anthropic, `claude-haiku-5-5` |
| Grounding | All chosen content in one cached system prompt. No vector store, no tools, no keyword search. |
| Knowledge | Services, process and FAQs; projects and case studies; about, stack and courses. Not testimonials or availability. |
| Off-topic | One friendly line steering back to Justine's work, with a suggested question |
| Placement | A floating button above the accessibility button (above the tab bar on phones) |
| Hand-off | A "Send Justine a message" button that opens `/contact` with the visitor's questions prefilled |
| Abuse and cost | A per-IP rate limit, a 10-turn conversation cap, and a monthly spend cap set in the Anthropic console |

## 3. Out of scope

Each of these was part of the first assistant and stays out:

- No database or chat logging (no Supabase).
- No keyless "quick answers" fallback. Without a key the button doesn't render.
- No lead form inside the chat. Leads go through the existing contact form and `/api/contact`.
- No tools, retrieval or a test-only "fake mode" in production code.
- No new page (there is no privacy page). The privacy note lives in the panel (§6).

## 4. Knowledge

`lib/chat/knowledge.ts` builds one plain-text block when the module loads. The block is deterministic (same input, same bytes), so the prompt cache keeps hitting.

- **In full:** `data/services.ts` (offers and process), `faqs.ts`, `home.ts`, `projects.ts`, `about.ts`, `stack.ts`, `credentials.ts`, `profile.ts`. Together these are about 27 KB of source, roughly 7k tokens.
- **As a digest:** `data/cases/` is 1.5 MB (about 380k tokens), far too much to send. For each case, the block carries the business name, its trade, and the names of its agents, RAG bot and automations, each with a one-line purpose, taken from `data/cases/index.ts` (`CASES`) and `data/showcase.ts`.
- **Sources:** each section is headed with the site path a visitor can open (for example `/services`, or a case page path), so answers can link to it.
- **Size cap:** a unit test fails if the block grows past 40k tokens, estimated as characters ÷ 4. This keeps Haiku under its 100k-token price step with room to spare.

If the Next bundler can't import `data/cases/index.ts` into a route, the digest moves to a generated file instead (`npm run chat-knowledge` writes `lib/chat/caseDigest.ts`), with a test that fails when the file is stale. The plan settles this in its first task.

## 5. Server

### 5.1 Prompt (`lib/chat/prompt.ts`)

The system prompt is two blocks: the fixed rules, then the knowledge block, which carries `cache_control: { type: 'ephemeral' }`. The rules:

- Answer only from the knowledge. If the answer isn't there, say so and suggest asking Justine. Never invent clients, prices, dates or results.
- Pricing follows the FAQ: it depends on the build, a discovery call comes first, then a written proposal.
- Off-topic: one friendly line saying it only covers Justine's work, plus a suggested question.
- Two to four sentences, plain text, first person as the site's assistant (not as Justine), with at most one link to a site path.
- When the visitor shows buying interest (a project, a budget, a timeline, "can you build…"), end the reply with the hand-off marker `[[contact]]` on its own line.

### 5.2 Route (`app/api/chat/route.ts`)

`POST /api/chat` with `{ messages: { role: 'user' | 'assistant'; content: string }[] }`.

1. Rate limit: `lib/rateLimit` with a chat-only budget of 20 messages per IP per hour, kept on `globalThis` as `lib/leadLimit.ts` does. Over the limit: 429.
2. Validation: 1–19 entries, alternating, starting and ending on `user` (so at most 10 visitor turns), each a non-empty string. Visitor messages max 500 characters; assistant messages max 2,000 (the browser sends them back, so they are capped like any input). Otherwise: 400.
3. No `ANTHROPIC_API_KEY`: 503.
4. Call `client.messages.stream` with `model: 'claude-haiku-5-5'` and `max_tokens: 400`. The SDK client is built once with a 20-second timeout and `maxRetries: 0`.
5. The response streams plain text (`text/plain; charset=utf-8`). The client strips `[[contact]]` from the shown text and uses it to show the hand-off button.
6. A failure mid-stream ends the stream. The client shows the error line (§6).

In development the route logs `usage.cache_read_input_tokens` and `cache_creation_input_tokens` once per reply, so cache hits can be checked.

Every refusal is `{ error: sentence }`, as in `/api/contact`. The sentences live in `data/chat.ts`.

### 5.3 Dependency and environment

- Adds `@anthropic-ai/sdk`.
- `.env.example` gets `ANTHROPIC_API_KEY` (server-only), with a note to set a monthly spend limit for the key's workspace in the Anthropic console.
- Whether the key is set reaches the client as a boolean the site layout passes down, never the key itself.

## 6. The panel

Components live in `components/chat/`, and all text in `data/chat.ts`.

- **Launcher:** the same tile as the accessibility button (`border-b1 bg-s1`, `--tile-shadow`, size 40). On desktop it sits directly above the accessibility button; on phones it sits above the tab bar, clear of the safe area. It uses one chat icon, no badge, and never opens by itself. `aria-expanded` and `aria-controls` point at the panel.
- **Panel:**
  - About 360×480 on desktop, anchored above the launcher. A bottom sheet on phones.
  - It opens with one greeting line and three suggested questions (buttons that send the question).
  - Replies stream into the conversation, which is announced politely to screen readers (`aria-live="polite"`).
  - A site path in a reply renders as a link that navigates with `useShellNav().go`.
  - Esc closes the panel unless another overlay has focus. Focus moves to the input on open and returns to the launcher on close. Motion follows reduced-motion settings.
- **State:** the conversation lives in `sessionStorage` under a key in `lib/storage-keys.ts`, so it survives page changes in the tab and nothing else. Every read and write is wrapped in try/catch, and the panel works without storage.
- **Hand-off:**
  - When a reply ends in `[[contact]]`, a "Send Justine a message" button shows under it.
  - Clicking it writes the visitor's own messages (not the assistant's), joined and trimmed to the contact form's `MAX_MESSAGE`, to a second `sessionStorage` key, then navigates to `/contact`.
  - `ContactForm` reads that key once on mount into the message field, then deletes it. The visitor can edit before sending.
- **Turn cap:** after the 10th visitor message, the input is replaced by one line ("Justine can take it from here") and the hand-off button.
- **Errors:** a 429, 503 or failed stream shows one plain sentence from `data/chat.ts` plus the hand-off button, so the visitor always has a way forward.
- **Privacy note:** one line in the panel footer saying messages go to Anthropic to write the answer and the site doesn't keep them.

## 7. Testing

### 7.1 Unit (Vitest)

- Knowledge: deterministic across two builds; includes a known line from each in-full source and every case's business name; under the 40k-token cap.
- Prompt: the rules block names the hand-off marker and the off-topic rule; only the knowledge block carries `cache_control`.
- Route, with the SDK stubbed: 400 on bad input (empty, wrong order, ending on `assistant`, too long, more than 19 entries), 429 over the limit, 503 without a key, a streamed body on success.
- Hand-off: the summary holds only visitor messages and is trimmed to `MAX_MESSAGE`. `ContactForm` prefills from the key and deletes it.
- Panel: suggested questions send, `[[contact]]` is stripped and shows the button, the turn cap replaces the input, errors show the sentence and button.

### 7.2 Browser (Playwright)

`/api/chat` is mocked with `page.route`; no real calls.

- Desktop: the launcher sits above the accessibility button. Open, ask, see the streamed reply, follow the hand-off, and find the contact form prefilled.
- Esc closes and focus returns to the launcher.
- Phone: the bottom sheet sits clear of the tab bar.
- With no key (the layout flag off), the launcher doesn't render.

### 7.3 Answer-quality check

`npm run chat-check` sends about 15 visitor-style questions to the real model and prints each answer for Justine to read: what he builds, a business like mine, pricing, how a project starts, his stack and courses, two off-topic questions, and three questions that invite a made-up claim (a client he hasn't had, a guaranteed result, a fixed price). It needs `ANTHROPIC_API_KEY`, costs about a cent per run, and is not part of CI.

## 8. Rollout

One PR from the `feat/site-chat` branch (this spec is its first commit). Before merge: unit and browser tests pass, `npm run chat-check` answers are read and accepted by Justine, and the spend limit is set in the Anthropic console. Then `ANTHROPIC_API_KEY` is added on Vercel.
