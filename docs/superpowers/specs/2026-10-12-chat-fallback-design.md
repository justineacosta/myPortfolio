# Site chat keyless fallback: design

**Date:** 2026-10-12
**Status:** Design approved 2026-10-12 in chat; spec awaiting review
**Builds on:** `docs/superpowers/specs/2026-10-11-site-chat-design.md` (the site chat spec). This spec changes that one where they disagree. It replaces §3's "No keyless 'quick answers' fallback. Without a key the button doesn't render", and §5.2 step 3's 503.
**History:** The first assistant's keyword-search "quick answers" (`lib/assistant/quick.ts`, `search.ts`, `passages.ts`, removed in `e7cad7b`) are not coming back. This fallback is a small topic table that quotes the site's own data.

## 1. Goal

The chat answers whether or not Claude is available.

- **No key:** every reply comes from the fallback.
- **Key set:** Claude answers as now. When a Claude call fails before its first word, the fallback answers that turn instead of an error.

Fallback replies are short, accurate quotes of the site's own data with a link. A question the fallback can't place gets an honest "ask Justine" and the hand-off button.

## 2. Decisions (all chosen by Justine)

| Topic | Decision |
| --- | --- |
| When the fallback answers | Always when there is no key, and when a Claude call fails |
| What a reply is made of | The matched FAQ or topic, quoted from `data/`, plus a link. No match gives an honest line plus the hand-off. |
| Labelling | None. Fallback replies look like any other reply. Only the privacy footer changes without a key, because "Messages go to Anthropic" would be untrue. |
| Where matching runs | On the server, inside `/api/chat`, as a hand-written topic table with trigger words. No new packages. |

## 3. Out of scope

- No keyword search over all site text, no passages, no scoring of site prose.
- No labels, badges or notes marking fallback replies.
- No fallback for a Claude failure after the first word has streamed (§5).
- No change to the browser tests, the hand-off, the limits or the panel's layout.

## 4. The fallback (`lib/chat/fallback.ts`)

`fallbackReply(question: string): string` is pure and server-only (it imports `data/`).

### 4.1 Matching

1. **Normalise the question:** lowercase it, replace every character that is not a letter, digit or space with a space, and collapse spaces.
2. **Score each topic:** count the topic's triggers found in the normalised question. A one-word trigger must match a whole word. A multi-word trigger must match as a phrase on word boundaries.
3. **Pick a topic:** the highest score wins, and ties go to the topic listed earlier in §4.2. A score of 0 means no match (§4.4).

Only the latest visitor message is read; earlier turns are ignored.

### 4.2 Topics, in tie-break order

Each reply is built from the named data, never retyped. The connecting words and every trigger list live in `data/chat.ts` under `chat.fallback`.

| # | Topic | Triggers (starting set; the plan fixes the exact lists) | Reply | Link |
| --- | --- | --- | --- | --- |
| 1 | Price | price, cost, charge, rate, budget, quote, how much | `FAQS[2].a` | `/contact` |
| 2 | Start | how fast, start, when can you, availability, timeline | `FAQS[1].a` | `/contact` |
| 3 | After writing | after i write, reply, respond, hear back | `FAQS[3].a` | `/contact` |
| 4 | Maintenance | maintain, maintenance, support, after launch, handover | `FAQS[4].a` | `/contact` |
| 5 | Case studies | example, client, portfolio, case, past work, like mine, plus each case's words (§4.3) | §4.3 | the case page, or `/projects` |
| 6 | Process | process, steps, how do you work, method | `PROCESS`: each step's `name` and `line` | `/services` |
| 7 | Services | service, offer, what do you do, ai agent, rag, chatbot, automation, workflow, crm, api, integration, seo, website, app | `SERVICES`: each `name` and `line` | `/services` |
| 8 | Build | what do you build, build, make | `FAQS[0].a` | `/services` |
| 9 | Stack | stack, tools, tech, technology, framework, language, plus each `TOOLS` name, lowercased | the `TOOLS` names | `/about` |
| 10 | Courses | course, certificate, certification, training, learn | the `CERTS` names | `/about` |
| 11 | About | who are you, who is justine, about you, background, experience, where are you based | a line saying it is the site's assistant, then `about.description` and `about.location.title` | `/about` |
| 12 | Greeting | hi, hello, hey, thanks, thank you | `chat.fallback.hello` (one fixed line) | none |

Links use the same `[label](/path)` form as Claude's replies, so the panel's link rules apply unchanged. Every path is in `KNOWN_PATHS`.

### 4.3 Case studies

For each entry in `CASES`, its trigger words are:
- the words of `business.name` and `business.trade` that are four or more letters long and not in a short stop list (for example "company", "practice", "infrastructure");
- any synonyms listed for that case in `chat.fallback.caseWords`, for example `ostler-barbers: ['barber', 'haircut']`, `riverdale-and-brooks: ['lawyer', 'attorney', 'legal']` and `altitude-personal-training: ['gym', 'trainer', 'fitness']`.

The answer depends on what matched:
- **One case's words matched:** the reply says this is the closest sample system on the site (the businesses are samples, never clients), names the business and its trade, lists only its agents' names and its automation flows' titles so it stays under the 2,000-character history limit, and links to `casePath(key, 'ai-agents.html')`.
- **Only the generic triggers matched** ("example", "clients"…): the reply lists every business as "name (trade)" and links to `/projects`.

### 4.4 Hand-off and no match

- The **buying-interest** triggers, in `chat.fallback.buying`, include: price, cost, budget, quote, project, hire, can you build, work with, proposal, call. If any is present, the reply ends with `[[contact]]` on its own line, whichever topic won.
- **No match:** `chat.fallback.unknown` ("I can't answer that one here, but Justine can."), always followed by `[[contact]]`.

## 5. The route

The order is unchanged: rate limit, then size cap, then validation. After that:

1. **No `ANTHROPIC_API_KEY`:** stream `fallbackReply(last user message)` as a normal 200 `text/plain; charset=utf-8` reply. Claude is not called. The 503 `chat.errors.unavailable` response and its copy are removed.
2. **Key set:** call Claude as now.
   - If the call fails before the first event (the place that returns 502 today), log the error with `console.error`, as now, and stream the fallback reply as a 200.
   - If Claude fails after text has streamed, behaviour is unchanged: the stream errors, and the panel shows the error sentence plus the hand-off.

## 6. Panel and layout

- `app/(site)/layout.tsx` stops gating the chat on the key: `ChatRoot` always renders. It passes `ai={Boolean(process.env.ANTHROPIC_API_KEY)}`, read at build time like `enabled` today, and the `enabled` prop is removed.
- The privacy footer reads `chat.privacy.ai` ("Messages go to Anthropic to write the answer. This site doesn't keep them.") when `ai` is true, and `chat.privacy.site` ("This site doesn't keep your messages.") when it is false.
- Nothing else in the panel changes.

## 7. Docs

- `.env.example`: without the key, the chat answers from the site's FAQs and topics and costs nothing. The note "without it the chat button doesn't show" is replaced.
- The Global Constraints line "Without a key the button doesn't render" no longer applies.

## 8. Testing

### 8.1 Unit (Vitest)

- **`fallbackReply`, per topic:** a question for each of the 12 topics returns that topic's reply, and the reply contains the exact data text (for example, a price question contains `FAQS[2].a`).
- **Matching rules:**
  - Whole-word matching: "startup" does not trigger Start.
  - Ties go to the earlier topic.
  - Only the latest message counts.
- **Case studies:** "I run a barbershop" returns Ostler's reply with its case link. "Show me examples" returns the list of businesses with `/projects`.
- **Hand-off:** a buying-interest question ends with `[[contact]]`, and a plain question does not. The no-match reply always ends with it.
- **Links:** every link in every topic's reply is in `KNOWN_PATHS`.
- **Route:**
  - With no key: 200 with the fallback text, and the Claude stub is not called.
  - Claude throwing before the first event: 200 with the fallback text, and the error is logged.
  - Claude failing mid-stream: the body still rejects.
- **Panel:** the chat renders with `ai={false}`, and the privacy line follows `ai`.

### 8.2 Browser and live checks

The browser tests are unchanged, because they mock `/api/chat`. `npm run chat-check` run with no key prints the fallback answers for Justine to read, at no cost.

## 9. Rollout

One PR from `feat/chat-fallback`. Before merge: unit tests pass, and Justine reads `npm run chat-check` with no key. After deploy, the launcher shows on the live site even without a key.
