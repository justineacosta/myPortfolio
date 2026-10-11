# Site Chat Keyless Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The site chat answers without Claude by matching the visitor's latest question against a small topic table and quoting the site's own data with a link: always when no key is set, and when a Claude call fails before its first word.

**Architecture:** `lib/chat/fallback.ts` exports a pure `fallbackReply(question)` that scores 12 topics by trigger words (copy and triggers live in `data/chat.ts` under `chat.fallback`) and builds replies from `data/`. `POST /api/chat` streams that reply as its normal 200 text when there's no key, or when Claude fails before the first event. The layout always mounts the chat and passes `ai` to pick the privacy line.

**Tech Stack:** Next 16 route handler, React 19, TypeScript, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-12-chat-fallback-design.md` (builds on `docs/superpowers/specs/2026-10-11-site-chat-design.md`)

## Global Constraints

- Matching reads only the latest `user` message. Normalise it by lowercasing, replacing every non-letter/digit/space character with a space, and collapsing spaces. One-word triggers match whole words only; multi-word triggers match as a phrase on word boundaries.
- Topic order (also the tie-break order): Price, Start, After writing, Maintenance, Case studies, Process, Services, Build, Stack, Courses, About, Greeting.
- Every reply quotes `data/` values; nothing from `FAQS`, `SERVICES`, `PROCESS`, `TOOLS`, `CERTS`, `about` or `CASES` is retyped.
- Links use `[label](/path)`, and every path is in `KNOWN_PATHS` (`lib/chat/knowledge.ts`).
- The hand-off marker is the literal `[[contact]]` on its own last line. It is added when any buying trigger matches, and always on the no-match reply.
- The fallback adds no labels or badges to replies. Only the privacy footer differs without a key.
- A Claude failure after text has streamed still errors the stream (unchanged).
- No new packages. All fallback copy and trigger lists live in `data/chat.ts` under `chat.fallback`.
- Never stage or commit `data/about.ts`: it holds Justine's uncommitted edits. Stage files by name only. Note that `about.description` and `about.location.title` are read from that file, so tests must compare against the imported values, never literals.
- Comment style follows the repo: a short `/** … */` per export.

## Review Focus

1. **Common words in ordinary questions:** "start" in "startup" or "rate" in "accurate" must not trigger a topic. Pinned in Task 1 (whole-word tests).
2. **Two cases with the same trade** (Oriel and Westmere are both residential developers): when cases tie, the reply should list the tied businesses with `/projects`, not pick one arbitrarily. Pinned in Task 1.
3. **Punctuated tool names** ("Next.js", "Node.js", "GitHub Actions"): typed as "next.js" or "nextjs", the question should still reach Stack. Pinned in Task 1 (normalising tool names the same way as questions).
4. **Long or empty questions:** a question that is all punctuation (`"???"`) becomes empty after normalising, and should get the no-match reply rather than a crash. Pinned in Task 1.
5. **A key that's set but invalid** (a 401 before the first event): the visitor should get the fallback, not a 502. Pinned in Task 2 (the stub rejects on the first `next()`).

---

### Task 1: The fallback matcher

**Files:**
- Modify: `data/chat.ts` (add `fallback`)
- Create: `lib/chat/fallback.ts`
- Test: `tests/chat-fallback.test.ts`

**Interfaces:**
- Consumes: `FAQS` (`data/faqs.ts`), `SERVICES` and `PROCESS` (`data/services.ts`), `TOOLS` (`data/stack.ts`), `CERTS` (`data/credentials.ts`), `about` (`data/about.ts`), `CASES` (`data/cases/index.ts`), `casePath` (`data/cases/pages.ts`), `MARKER` (`lib/chat/reply.ts`), `KNOWN_PATHS` (tests only).
- Produces: `normalise(text: string): string` and `fallbackReply(question: string): string`, both exported from `lib/chat/fallback.ts`. `chat.fallback` has this shape:

```ts
fallback: {
  triggers: Record<'price' | 'start' | 'after' | 'maintain' | 'cases' | 'process' | 'services' | 'build' | 'stack' | 'courses' | 'about' | 'hello', string[]>
  buying: string[]
  caseWords: Record<string, string[]>   // keyed by CASES key
  caseStop: string[]
  intro: { services: string; process: string; stack: string; courses: string; cases: string; case: string }  // one short lead-in line each
  links: { contact: string; services: string; about: string; projects: string; case: string }  // link labels
  hello: string
  unknown: string
}
```

- [ ] **Step 1: Add `chat.fallback` to `data/chat.ts`.** Use these exact lists. Write each lead-in as one plain, first-person line about Justine, in the voice of the rest of the file.
  - **Triggers:**
    - `price: ['price', 'prices', 'pricing', 'cost', 'costs', 'charge', 'rate', 'rates', 'budget', 'quote', 'how much']`
    - `start: ['how fast', 'how soon', 'start', 'when can you', 'availability', 'available', 'timeline']`
    - `after: ['after i write', 'after i send', 'reply', 'respond', 'hear back', 'response time']`
    - `maintain: ['maintain', 'maintenance', 'support', 'after launch', 'handover', 'hand over']`
    - `cases: ['example', 'examples', 'client', 'clients', 'portfolio', 'case study', 'case studies', 'past work', 'like mine', 'similar', 'industry']`
    - `process: ['process', 'steps', 'how do you work', 'method', 'approach', 'kickoff']`
    - `services: ['service', 'services', 'offer', 'what do you do', 'ai agent', 'ai agents', 'rag', 'chatbot', 'chatbots', 'automation', 'automations', 'workflow', 'workflows', 'crm', 'cms', 'api', 'apis', 'integration', 'integrations', 'seo', 'website', 'websites', 'web app', 'app', 'apps', 'saas']`
    - `build: ['what do you build', 'build', 'make']`
    - `stack: ['stack', 'tools', 'tech', 'technology', 'technologies', 'framework', 'frameworks', 'language', 'languages']`
    - `courses: ['course', 'courses', 'certificate', 'certificates', 'certification', 'certifications', 'training']`
    - `about: ['who', 'about you', 'about justine', 'background', 'experience', 'where are you', 'based', 'manila', 'yourself']`
    - `hello: ['hi', 'hello', 'hey', 'thanks', 'thank you']`
  - **Buying:** `['price', 'pricing', 'cost', 'budget', 'quote', 'how much', 'project', 'hire', 'hiring', 'can you build', 'work with', 'proposal', 'call']`
  - **caseWords:**
    - `'ostler-barbers': ['barber', 'barbers', 'haircut', 'salon']`
    - `'riverdale-and-brooks': ['lawyer', 'lawyers', 'attorney', 'legal', 'law firm']`
    - `'altitude-personal-training': ['gym', 'trainer', 'fitness', 'coach']`
    - `'range-physical-therapy': ['physio', 'physiotherapy', 'therapist', 'clinic']`
    - `'harbor-and-pine-moving': ['movers', 'removals', 'relocation']`
    - `'tidewell-vacation-rentals': ['airbnb', 'holiday let', 'short term rental']`
    - `'meridian-energy-infrastructure': ['solar', 'energy', 'renewable']`
    - `'ironline-utility-infrastructure': ['utilities', 'linework']`
    - `'meridian-werks': ['mechanic', 'garage', 'car', 'auto']`
    - `'oriel-portugal-residences': ['portugal', 'real estate', 'property']`
    - `'westmere-los-angeles': ['los angeles', 'real estate', 'property']`
  - **caseStop:** `['company', 'practice', 'infrastructure', 'studio', 'manager', 'cash', 'small', 'commercial', 'developer']`
  - **Fixed copy:**
    - `hello: "Hi. Ask me what Justine builds, how a project starts, or what it costs."`
    - `unknown: "I can't answer that one here, but Justine can."`
- [ ] **Step 2: Write the failing tests** in `tests/chat-fallback.test.ts`, one `it` each:
  - **FAQ topics:**
    - `'How much do you charge?'` contains `FAQS[2].a` and `](/contact)`, and ends with `\n[[contact]]`.
    - `'How fast can you start?'` contains `FAQS[1].a` and does not contain `[[contact]]`.
    - `'What happens after I write?'` contains `FAQS[3].a`.
    - `'Do you maintain it after launch?'` contains `FAQS[4].a`.
  - **Process and services:**
    - `'What is your process?'` contains every `PROCESS[i].name` and links `/services`.
    - `'Do you do SEO?'` contains every `SERVICES[i].name` and `SERVICES[i].line`.
  - **Build:** `'What do you build?'` contains `FAQS[0].a`. (The phrase plus "build" scores 2 for Build, against 0 elsewhere.)
  - **Stack:**
    - `'What tech stack do you use?'` contains every `TOOLS[i].name` and links `/about`.
    - `'Do you use Next.js?'` and `'do you use nextjs'` both reach Stack. The first normalises to `next js`, matching the normalised name `next js`. The second needs the joined form, so also index each multi-word normalised tool name with its spaces removed.
  - **Courses:** `'Any certifications?'` contains every `CERTS[i].name`.
  - **About:** `'Who are you?'` contains `about.description` and `about.location.title`.
  - **Greeting:** `'hello'` equals `chat.fallback.hello`.
  - **Case studies:**
    - `'I run a barbershop'` contains Ostler's business name and every Ostler agents build `name`, and links `casePath('ostler-barbers', 'ai-agents.html')`.
    - `'Show me some examples'` contains every case's `business.name` and links `/projects`.
    - `'I am a residential developer'` (Oriel and Westmere tie) lists both names and links `/projects`.
  - **Whole words:** `'I have a startup'` does not contain `FAQS[1].a`, and `'accurate answers'` does not contain `FAQS[2].a`.
  - **Ties:** `'process and services'` (1 each) returns Process, the earlier topic.
  - **No match:**
    - `'What is the weather in Paris?'` equals `` `${chat.fallback.unknown}\n[[contact]]` ``.
    - `'???'` returns the same.
  - **Hand-off:** `'I have a project for you, what is your process?'` ends with `[[contact]]` and contains Process.
  - **Links are known:** for every question above, every `](path)` in the reply has `KNOWN_PATHS.has(path)`.
  - **normalise:** `normalise('Next.js — AI-Agents!')` equals `'next js ai agents'`.
- [ ] **Step 3: Run** `npx vitest run tests/chat-fallback.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 4: Implement `normalise` and `fallbackReply` in `lib/chat/fallback.ts`.**
  - **Matching:** a trigger matches when `` ` ${q} ` `` contains `` ` ${normalise(trigger)} ` ``. A topic's score is the number of its triggers that match.
  - **Stack:** its trigger list is the fixed list plus each `normalise(TOOLS[i].name)`, and the spaceless form when that differs.
  - **Case studies:**
    - Each case's words are the `normalise`d `business.name` and `business.trade` words of 4+ letters that aren't in `caseStop`, plus its `caseWords`.
    - The topic's score is the generic `cases` matches plus the highest single case's word matches.
    - The reply is case-specific only when exactly one case has that highest score and it is above 0. Otherwise it is the list of businesses, or the tied businesses when two or more tie above 0.
  - **Reply shape:** an optional lead-in line, the quoted items one per line (`- name: line`), a blank line, `[label](/path)`, then `\n[[contact]]` when a buying trigger matched.
  - FAQ topics have no lead-in. Greeting has no link. No match returns `` `${unknown}\n${MARKER}` ``.
- [ ] **Step 5: Run** the test file. Expected: PASS. Then run `npx vitest run` and `npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 6: Commit.**
```bash
git add data/chat.ts lib/chat/fallback.ts tests/chat-fallback.test.ts
git commit -m "feat(chat): a keyless fallback that answers from the FAQs and topics, quoting the site's own data"
```

### Task 2: The route uses the fallback

**Files:**
- Modify: `app/api/chat/route.ts`, `data/chat.ts` (remove `errors.unavailable`)
- Test: `tests/chat-route.test.ts`

**Interfaces:**
- Consumes: `fallbackReply(question: string): string` (Task 1).
- Produces: the new route contract. With no key, or when Claude fails before its first event, the route returns 200 `text/plain; charset=utf-8` with `fallbackReply(<last user message>)` as the body. 503 no longer exists. 429, 400 and the mid-stream error are unchanged.

- [ ] **Step 1: Update the tests** in `tests/chat-route.test.ts`:
  - **No key:** replace "is unavailable without a key" with "answers from the fallback without a key, and does not call the model". With `ANTHROPIC_API_KEY` unset and the question `'How much do you charge?'`, expect 200, the content type, a body equal to `fallbackReply('How much do you charge?')`, and the stream stub not called.
  - **Up-front failure:** change the 502 test to "answers from the fallback when the call fails before the first event". The stub's first `next()` rejects (simulating a 401 or an outage). Expect 200, a body equal to `fallbackReply(question)`, and `console.error` called once.
  - Keep the mid-stream failure test unchanged: the body still rejects.
- [ ] **Step 2: Run** `npx vitest run tests/chat-route.test.ts`. Expected: the two changed tests FAIL.
- [ ] **Step 3: Implement.**
  - Add a private `fallback(messages: ChatTurn[]): Response` that returns `new Response(fallbackReply(messages[messages.length - 1].content), { headers: { 'content-type': 'text/plain; charset=utf-8' } })`.
  - Use it in the no-key branch (drop its `console.error`; a missing key is now a normal mode) and in the catch before the first event (keep its `console.error`).
  - Update the header comment to describe both paths.
  - Remove `errors.unavailable` from `data/chat.ts`, and grep that nothing else uses it.
- [ ] **Step 4: Run** the route tests, then `npx vitest run` and `npx tsc --noEmit`. Expected: all pass.
- [ ] **Step 5: Commit.**
```bash
git add app/api/chat/route.ts data/chat.ts tests/chat-route.test.ts
git commit -m "feat(chat): the route answers from the fallback without a key, or when Claude fails before its first word"
```

### Task 3: The chat always shows, and the privacy line tells the truth

**Files:**
- Modify: `app/(site)/layout.tsx:49`, `components/chat/ChatRoot.tsx`, `components/chat/ChatPanel.tsx:185`, `data/chat.ts` (`privacy`), `.env.example` (the ANTHROPIC block), `playwright.config.ts` (`webServer.env`)
- Test: `tests/ChatPanel.test.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `ChatRoot({ ai, paths }: { ai: boolean; paths: string[] })`. The `enabled` prop is gone, and the component always renders.
  - `chat.privacy` becomes `{ ai: "Messages go to Anthropic to write the answer. This site doesn't keep them.", site: "This site doesn't keep your messages." }`.

- [ ] **Step 1: Update the tests** in `tests/ChatPanel.test.tsx`:
  - `renderChat(ai = true)` renders `<ChatRoot ai={ai} paths={PATHS} />`. Replace "renders nothing when chat is not enabled" with "renders the launcher without a key".
  - Add: with `ai` set, the open panel's footer shows `chat.privacy.ai`; with `ai={false}` it shows `chat.privacy.site`.
  - Update every `enabled` use (including the `rerender` calls).
- [ ] **Step 2: Run** `npx vitest run tests/ChatPanel.test.tsx`. Expected: the new and changed tests FAIL.
- [ ] **Step 3: Implement.**
  - `ChatRoot` drops `enabled` and its early return, takes `ai`, and passes it to `ChatPanel`, whose footer shows `chat.privacy[ai ? 'ai' : 'site']`.
  - The layout mounts `<ChatRoot ai={Boolean(process.env.ANTHROPIC_API_KEY)} paths={[...KNOWN_PATHS]} />`.
  - Update `ChatRoot`'s comment.
- [ ] **Step 4: Update `.env.example`.** Replace "Without it the chat button does not show." with: "Without it the chat still shows and answers from the site's FAQs and topics, at no cost." Keep the build-time and spend-limit lines.
- [ ] **Step 5: Remove `webServer.env` and its comment from `playwright.config.ts`.** The chat now renders without a key, and every browser test mocks `/api/chat`.
- [ ] **Step 6: Run** `npx vitest run`, `npx tsc --noEmit`, `npm run lint` and `npm run build`, then `npx playwright test e2e/chat.spec.ts e2e/phone.spec.ts`. Expected: all pass.
- [ ] **Step 7: Commit.**
```bash
git add "app/(site)/layout.tsx" components/chat/ChatRoot.tsx components/chat/ChatPanel.tsx data/chat.ts .env.example playwright.config.ts tests/ChatPanel.test.tsx
git commit -m "feat(chat): the chat shows without a key, and its privacy line says who reads the messages"
```
- [ ] **Step 8: Hand off the live check.** With no key in `.env.local`, start `npm run dev`, run `npm run chat-check`, and hand the printed answers to Justine (spec §9). This costs nothing.
