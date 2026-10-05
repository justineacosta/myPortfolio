# Per-site case pages: batch 1 implementation plan (Tidewell, Altitude, Range Physical Therapy)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the five case pages for Tidewell, Altitude and Range Physical Therapy, following Oriel's approved template, so each one opens from its preview window's tab row.

**Architecture:** No new tooling. Each site gets five typed content files in `data/cases/<key>/`, registered in `data/cases/index.ts` and listed in `CASE_SITES` in `data/cases/pages.ts`. `npm run cases` renders them, and `tests/cases-data.test.ts` checks them.

**Tech Stack:** TypeScript content files run directly by Node, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-05-per-site-pages-design.md`. The pilot plan (`docs/superpowers/plans/2026-10-05-per-site-pages-pilot.md`) defines the template. Oriel's files in `data/cases/oriel-portugal-residences/` are the approved model for depth, tone and every field.

## Global Constraints

- Branch `feat/cases-batch-1`, based on `feat/per-site-pages` (PR #47). The PR targets `feat/per-site-pages`.
- Keys and code prefixes:

  | Key | Prefix |
  |---|---|
  | `tidewell-vacation-rentals` | `TW` |
  | `altitude-personal-training` | `AL` |
  | `range-physical-therapy` | `RP` |

- Each site has 3 flows: `-01` on n8n, `-02` on Make, `-03` on Zapier, each with 5–9 steps and a unique title of 22 characters or fewer. Each also has 1 RAG bot and 2 agents. Build Plan workflows match the flows one to one, and helpers are `<P>-H01…`.
- No tools outside `lib/brand/tools.ts`. No new renderer or tooling code; if a page seems to need one, stop and report it.
- Copy rules:
  - curly quotes and apostrophes only
  - labels and sub-lines of 22 characters or fewer
  - never "Cursor"
  - never GoHighLevel, HighLevel or GHL
  - each title names the business
  - the sample note names it as a fictional business, not a client project
  - figures are marked illustrative
- **The person's-yes rule, in the spec's scope:**
  - Anything Claude drafts for a customer's inbox waits for a named person's yes.
  - A templated confirmation sends on its own.
  - A RAG bot answers live in the site chat only, from the site's own documents and with a source.
  - Email always stays with a person.
- The five general pages and Oriel's pages stay byte-identical.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Lessons from Oriel (bake these in; reviews caught each one)

1. **n8n:** a search that finds nothing ends the run quietly. Turn Always Output Data on and say what an empty result does.
2. **Make:** a search that returns zero bundles ends its route. Use the app's "Make an API call" module, which always returns one bundle with a list, and route on the list's length.
3. **Zapier:**
   - Paths cannot rejoin, so use a Sub-Zap helper for shared tail steps.
   - Human in the Loop sends no Telegram or chat message itself. It notifies by email, the reviewer answers on a Zapier review page, and the outcomes are Approved or Rejected.
   - A step cannot link to a review page before Human in the Loop creates it.
4. **Platform modules:** name only modules and settings that exist, and don't invent capabilities.
5. **Helpers:** a helper used for alerts must not be covered by the error workflow that calls it, or the two loop.
6. **Field values:** keep one vocabulary for a field across every flow and every data table.
7. **Agreement between pages:** every page must agree with the Automation page. Build Plan steps may split a step but not change its outcome or branches.
8. **The bot:** the RAG bot is chat-only; email is a hand-off to a person. Its live answers never invent a price, date or figure that isn't in the site's documents.

## Review Focus

1. **Sensitive trade (Range PT).**
   - No clinical advice anywhere.
   - No symptoms, diagnoses or treatment notes pass through Claude, HubSpot, Airtable or any automation. Clinical notes stay in the clinic's notes system, shown as a plain icon with no tool.
   - Anything clinical goes to Dr. Ellison untouched.
   - The bot points emergencies to 911.
   - Every Range PT check tests for these.
2. **Money moves (Tidewell owner payouts and repairs over $400, Altitude subscriptions, Range PT plans):** each needs the right person's yes, or a clearly stated rule from the site (e.g. "anything above $400 comes to you with photos and a quote").
3. **Facts:**
   - Prices, hours, names, fees and promises must match each site exactly.
   - Altitude and Range PT are both on Pearl Street in Boulder, so don't let their details cross over.
4. **Altitude has no form on the site;** it uses buttons such as "Start coaching" and "Book a consult". Name these as the triggers and don't invent fields beyond what the copy says the application asks: goal, schedule and what you have tried before.
5. **Within a site:** tools must be the same across all five pages. A tool that appears on one page and none of the others needs a reason.

---

## Site facts and pinned decisions

### Tidewell (`tidewell-vacation-rentals`, `TW`)

- **Business and people:** vacation rental management on the Charleston coast and in the Blue Ridge, founded in 2014 by Ruth Calloway (former hotel front of house) and Marcus Bell (maintenance crews).
- **Size:** 140 homes in 3 markets:
  - the coast, 84 homes: Isle of Palms, Sullivan's, Folly, Kiawah
  - the city, 31 homes: Charleston, Mount Pleasant
  - the mountains, 25 homes: Highlands, Cashiers, Sapphire

  At most 18 homes per manager, 46 staff, 2 offices.
- **Contact:** (843) 555-0142, owners@tidewell.example.
- **Owner promises:**
  - Repairs above $400 come to the owner with photos and a quote.
  - Owners block their own weeks in the portal at no cost.
  - One statement a month, delivered by the tenth, with payment the same day.
  - The management fee is 22%, on an illustrative statement.
- **Guests:**
  - A real person replies in under 10 minutes, day or night.
  - The door code arrives the morning of travel.
  - A photo checklist is completed before every arrival.
  - There is a local guide and a check-in guide.
- **Onboarding, about four weeks:** Assess (week 1: walkthrough plus a written twelve-month revenue projection), Prepare, Launch (Airbnb, Vrbo, direct site), Operate, Optimize (every quarter).
- **The one form:** "Request a property assessment", with an address and an email, and the button "Get a property assessment".
- **Other calls to action:** Book a stay, Owner portal login, Guest help, Check-in guide.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `TW-01` | n8n | Property assessment request: find the market from the address, assign the local manager, book the walkthrough, send a templated confirmation; Claude drafts the projection outline for the manager only | The assessment form |
| `TW-02` | Make | Repair approval: a logged job above $400 goes to the owner with photos and a quote and waits for their yes; at $400 or less it is booked straight away | A new maintenance job in Airtable |
| `TW-03` | Zapier | Monthly owner statement: compile the month on the 9th; Claude drafts the manager's note; the manager approves; the statement goes out by the tenth | A schedule, on the 9th |

AI agents:
- **Bot:** a Guest help bot that answers in the site chat from the check-in guide, the house rules and the local guide (e.g. "Can we bring our dog?" gets the house rule), and hands lockouts or anything urgent to the on-call person.
- **Agent:** a Rate watch agent that notices nearby homes dropping their rates and proposes a new rate. The manager approves it, because it moves money.
- **Agent:** a Review reply agent that drafts a reply to a low review and opens a maintenance job (e.g. the coffee maker). The manager approves the reply.

### Altitude (`altitude-personal-training`, `AL`)

- **Business and people:** personal training and coaching in Boulder (Pearl Street studio, opened 2022) and online worldwide. The coach is Elias Varga, CSCS, coaching since 2017, with about 40 clients and reads every check-in himself.
- **Six programs:** Foundations, Strength, Muscle, Recomposition, Performance, Mountain and endurance.
- **Prices:** Online $229, Hybrid $449, Studio $760 a month. The first block is 12 weeks, then month to month. Pause or cancel with 14 days' notice after the first block. A consult is free and takes 20 minutes.
- **Starting takes a week:**
  - Apply: 5 minutes, covering your goal, your schedule and what you have tried before
  - Consult: 20 minutes, days 2–3
  - Assess: 60 minutes, days 4–5
  - Begin: day 7

  The site promises "We reply within two working days".
- **The coached week:**
  - The check-in is on Sunday, and Elias replies by Monday.
  - Form review comes back within 24 hours.
  - The program is updated every 4 weeks, with a re-test each block.
- **No form on the site.** The calls to action are "Start coaching", "Book a consult", "Book a call with Elias", "Start online", "Start hybrid" and "Book the studio".

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `AL-01` | n8n | Coaching application: save it, Claude summarises the goal for Elias only, offer the free 20-minute consult on Cal.com, templated reply within two working days | Start coaching (the application) |
| `AL-02` | Make | Start a plan: after the consult, the chosen plan (Online, Hybrid or Studio) starts a Stripe subscription, books the 60-minute assessment and sends the templated welcome | Elias marks the consult “Starting” |
| `AL-03` | Zapier | Sunday check-in: Claude summarises the check-in for Elias, who writes the reply himself by Monday; a missed check-in gets a templated nudge | A check-in form submitted, or none by Sunday night |

AI agents:
- **Bot:** a Program Q&A bot that answers in the site chat on programs, prices, formats and the FAQ. It never gives injury advice, hands "What if I have an injury?" to a consult with Elias, and books the consult.
- **Agent:** a Form review prep agent that gathers the video, past notes and target loads so Elias can review within 24 hours. It goes to Elias only.
- **Agent:** a Block review agent that drafts the end-of-block summary and the next block's outline every 4 weeks. Elias approves it before the client sees it.

### Range Physical Therapy (`range-physical-therapy`, `RP`)

- **Business and people:** cash-pay physical therapy at 1942 Pearl Street, Suite 200, Boulder, CO 80302. The clinician is Dr. Mara Ellison, PT, DPT, OCS, CSCS. She practised in Denver orthopaedic clinics and opened Range in 2021.
- **Hours:** Mon–Thu 7am–7pm, Fri 7am–3pm, Sat 8am–noon.
- **Contact:** (303) 555-0142, hello@rangept.co.
- **Prices:** initial evaluation $215 for 60 minutes, follow-up $185 for 60 minutes, and a six-visit plan of $1,020 ($170 each, used within four months, shareable within a household). HSA and FSA are accepted, and a superbill comes after each visit.
- **Policies:**
  - Rescheduling or cancelling up to 24 hours ahead is free.
  - No referral is needed in Colorado.
  - Every visit is 60 minutes, one-on-one with the same clinician.
  - There is a free 15-minute call.
  - "Mara will be in touch before your visit."
  - She answers email and texts herself.
  - In an emergency, call 911.
- **No form on the site.** The calls to action are "Schedule your evaluation", "Free 15-minute call", "Reserve" (next opening), "Book a follow-up", "Start a plan" and "Book a call".
- **Rule for this trade:** clinical content never enters an automation, Claude, HubSpot or Airtable. Flows carry only scheduling and billing data, and clinical notes stay in the clinic's notes system, shown as a plain icon.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `RP-01` | n8n | Evaluation booking: a booked evaluation sends the templated intake and what-to-wear email and alerts Mara, who gets in touch before the visit | Cal.com booking (Initial evaluation) |
| `RP-02` | Make | Superbill after each visit: a paid visit produces its superbill and emails it to the patient, using billing data only | A Stripe payment for a visit |
| `RP-03` | Zapier | Six-visit plan: a purchase opens the plan; reminders go out when 2 visits remain and 3 weeks before the four-month expiry | A Stripe payment for the six-visit plan |

AI agents:
- **Bot:** a Clinic Q&A bot that answers in the site chat on prices, referrals, HSA and FSA, superbills, cancellations and what to wear. It never gives clinical advice: any symptom gets the free 15-minute call, and an emergency gets 911.
- **Agent:** an Inbox triage agent that sorts hello@rangept.co. It passes anything clinical to Mara untouched and unread by Claude beyond the sorting. For admin email, it drafts replies that Mara approves.
- **Agent:** a Reschedule agent that handles a cancellation inside the 24-hour policy, offers the next openings and drafts the reply. Mara approves it.

---

## Tasks

Each content task follows the pilot's shared steps:
1. Write the file as `export default` of the page's type, with type-only imports.
2. Register it with `withSite(content, key, '<page id>')`.
3. Run `npx vitest run tests/cases-data.test.ts`.
4. Run `npm run cases`, then `npx vitest run tests/make-cases.test.ts`.
5. Visually check both themes with no console errors, and screenshot it to the session scratchpad.
6. Commit.

A site's first registered page also adds its key to `CASE_SITES` in `data/cases/pages.ts`, in carousel order.

### Task 1: Tidewell · Automation and Build plan
**Files:** create `data/cases/tidewell-vacation-rentals/automation.ts` and `buildPlan.ts`; modify `data/cases/index.ts` and `data/cases/pages.ts`.
- The flows are as in the Tidewell table.
- In the Build plan, the repair-approval and statement-approval steps follow Lessons 2–3.
- The Build plan has at least 2 test rows per workflow covering every branch, and 5 build phases.

### Task 2: Tidewell · AI agents, End-to-end and Framework
**Files:** create `agents.ts`, `endToEnd.ts` and `agenticFramework.ts` in the same folder; modify `data/cases/index.ts`.
- The bot and the two agents are as in the Tidewell bullets.
- End-to-end lanes run from Owner and Guest to the site, TW-01/02/03, the bot, both agents, the manager, and payout; up to 11 lanes.
- The Framework's worked example takes TW-01 through the loop, and `example.link` points at Tidewell's end-to-end page.

### Task 3: Altitude · Automation and Build plan
As Task 1, for Altitude (`altitude-personal-training`). AL-02's Stripe subscription waits for Elias marking the consult “Starting”, which is the person's yes for money.

### Task 4: Altitude · AI agents, End-to-end and Framework
As Task 2, for Altitude. The Framework's example takes AL-01 through the loop.

### Task 5: Range Physical Therapy · Automation and Build plan
As Task 1, for Range PT (`range-physical-therapy`).
- Add the clinical rule to every flow's watch-outs.
- Data tables hold scheduling and billing fields only.

### Task 6: Range Physical Therapy · AI agents, End-to-end and Framework
As Task 2, for Range PT.
- The clinical rule holds in every guardrail.
- The 911 line is on the bot.
- The Framework's example takes RP-01 through the loop.

### Task 7: Verify and open the batch PR
1. Run `npm test`, `npx tsc --noEmit`, `npx eslint .` and `npm run e2e`. The known failure is `access.spec.ts:33`, and `services.spec.ts` is flaky under load.
2. Run `npm run cases`. `git status` must show nothing to commit.
3. Open each new site's preview from the carousel and step through all six tabs.
4. Take a screenshot per page.
5. The controller pushes and opens the PR into `feat/per-site-pages` after the final review.
