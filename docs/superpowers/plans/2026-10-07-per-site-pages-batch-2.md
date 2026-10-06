# Per-site case pages: batch 2 implementation plan (Riverdale & Brooks, Ostler)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the five case pages for Riverdale & Brooks and Ostler, following the approved template, so each one opens from its preview window's tab row.

**Architecture:**
- No new tooling.
- Each site gets five typed content files in `data/cases/<key>/`.
- Register them in `data/cases/index.ts` and list each key in `CASE_SITES` in `data/cases/pages.ts`.
- `npm run cases` renders the pages. `tests/cases-data.test.ts` checks each page, and since #49 it also checks across a site's pages (`checkSite`).

**Spec:** `docs/superpowers/specs/2026-10-05-per-site-pages-design.md`.

**Models:** use Tidewell's and Range PT's files in `data/cases/` (batch 1, reviewed) for depth, tone and every field.

## Global Constraints

**Branch.** Work on `feat/cases-batch-2`, based on `feat/case-checks` (PR #49). The PR targets `feat/case-checks`.

**Keys and codes.**

| Site | Key | Code |
|---|---|---|
| Riverdale & Brooks | `riverdale-and-brooks` | `RB` |
| Ostler | `ostler-barbers` | `OS` |

**Facts.** Before writing, run `npm run site-facts -- <key>.html` and read every FAQ answer.

**Structure, per site:**
- 3 flows: `-01` on n8n, `-02` on Make, `-03` on Zapier. Each flow has 5–9 steps and a unique title of 22 characters or fewer.
- 1 RAG bot and 2 agents.
- Build plan workflows match the flows one to one, with the same titles. Helpers are numbered `<P>-H01…`.

**Tools.** No tools outside `lib/brand/tools.ts`, and no renderer changes. A tool must appear on at least two of a site's working pages (`checkSite`).

**Copy.**
- Use curly quotes only.
- Keep labels and sub-lines to 22 characters or fewer.
- Never write "Cursor" or GoHighLevel.
- Each title names its business.
- Every page says the business is fictional and that its figures are illustrative.
- Never name another sample site.

**The person's-yes rule, in scope (Lesson 9).**
- The named person approves anything Claude drafts for a customer's inbox, plus any money the site says needs their yes.
- A templated confirmation sends on its own.
- The bot answers live, in the site chat only.

**Unchanged pages.** The five general pages and the other four sites' pages stay byte-identical.

**Commits.** End every commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Lessons (all thirteen apply; reviewers check every one)

1. **n8n:** a search that finds nothing ends the run quietly. Turn Always Output Data on, and say what an empty result does.
2. **Make:** a search that returns zero bundles ends its route. Use the app's "Make an API call" module, which always returns one bundle with a list, and route on the list's length.
3. **Zapier:**
   - Paths cannot rejoin, so put shared tail steps in a Sub-Zap.
   - One Zap has one trigger.
   - Human in the Loop notifies by email, the reviewer answers on a Zapier review page, and its outcomes are Approved or Rejected.
   - No step can link to a review page before that page exists.
4. **Modules:** name only modules and settings that exist. Don't invent capabilities.
5. **Helpers:** an alert helper must not be covered by the error workflow that calls it.
6. **Vocabulary:** each field uses one set of values across every flow and table.
7. **Agreement:** every page agrees with the Automation page. A Build plan may split a step, but may not change its outcome or branches.
8. **The bot:** it answers in the chat only, and email is a hand-off to a person. It never invents a price, date or figure.
9. **The person's-yes rule** is stated exactly in scope everywhere: stance, rules, guardrails and glossary.
10. **No claimed integrations:** never claim an integration with a channel no tool reaches, such as a client portal, a booking app's internals or a review site. A person does that step, by hand.
11. **Emailed approval links** open a confirm page. Only the POST from that page records the answer.
12. **FAQ answers:** read every one, including fee ranges, exceptions and terms.
13. **Claude:** say Claude runs "inside every flow" only when it is true.

## Review Focus

1. **Riverdale & Brooks is a law firm, the second sensitive trade.**
   - The bot never gives legal advice. `checkSite` requires the words "legal advice" on its AI agents page.
   - Nothing the site asks people to hold back ("Please don't include confidential details yet") is stored, summarised or sent through Claude, HubSpot, Airtable or any automation. Flows carry only name, contact details, area of law and scheduling or billing data.
   - The optional "A few sentences about your situation" text goes only to Daniel's inbox. Claude never reads it, and no table keeps it.
   - The conflict-of-interest check is done by hand, by Daniel or Ruth. It is never automated.
   - Messages from an existing client, a court or opposing counsel reach Daniel untouched.
   - Add `bannedFields` for this key to `SENSITIVE` in `tests/helpers/caseChecks.ts`, banning `situation|confidential|privileged|case notes|facts`, with a self-test.
   - Add one page note, in the guardrails and glossary, in the same spirit as Range's business associate agreement line: "Before any client’s matter goes into these tools, the firm would confirm each vendor’s confidentiality terms and the client’s informed consent, as the profession’s ethics guidance on AI expects."
2. **Money.**
   - Riverdale's monthly invoices for hourly matters need Daniel's yes before they go out.
   - Ostler's memberships and shelf orders are paid by the customer through Stripe's own pages. Any refund is done by hand.
3. **Currency.** Riverdale prices are in dollars. Ostler prices are in pounds, the address is in London, and the copy uses British spelling where the site does (e.g. "colour").

---

## Site facts and pinned decisions

### Riverdale & Brooks (`riverdale-and-brooks`, `RB`)

**The firm**
- A small law practice at 114 East Main Street, Laurel Ford, Virginia 22843, two blocks from the Ashby County Courthouse.
- Founded in 1979 by Margaret Riverdale. The principal attorney is Daniel A. Brooks, who joined in 2010 and has led the practice since her retirement in 2019. Ruth is the office manager.
- Contact: (540) 555-0148, office@riverdalebrooks.law.
- Hours: Mon–Thu 8:30–5:30, Fri 8:30–3:00, evenings by appointment.
- Replies within one business day.
- Meetings are in the office or by video. Home visits are by arrangement.

**Practice areas**
- Six areas:
  - Estate planning & probate
  - Real estate
  - Family law
  - Business & agriculture
  - Civil disputes
  - Mediation
- No criminal defense or personal injury. Callers who need those are referred to trusted colleagues.

**Fees**
- Consultation: estate planning consultations are free. Other matters cost $150 for the first thirty minutes, credited toward the fee if the client hires the firm. The firm states the cost before booking.
- Flat fees cover wills, trusts, powers of attorney, most real estate closings and uncontested divorces.
- Hourly matters are billed monthly, itemized to the tenth of an hour, and are payable online or by check.

**How a matter runs**
- Six steps: Consultation (30 minutes), Listen, Assess (a written summary), Strategy (an engagement letter), Representation (an update from Daniel at every milestone), Resolution.
- An attorney-client relationship begins only after a conflict check and a signed engagement letter.

**On the site**
- A client portal (encrypted) and three PDF guides.
- The one form, "Request a consultation", asks for:
  - Full name, Phone and Email
  - "What is this about?", with the six areas plus "Something else"
  - "A few sentences about your situation (optional)"
- The button is "Send request". The form says: "Sending this form does not create an attorney-client relationship. Please don’t include confidential details yet."

**Pinned flows**

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `RB-01` | n8n | Consultation request: save the contact and area only. Send the situation text to Daniel's inbox alone. Send a templated reply within one business day with the right consultation fee (free for estate planning, otherwise $150 credited) and the Cal.com link for a 30-minute meeting, office or video. Alert Ruth. | The form |
| `RB-02` | Make | Monthly invoice: on the 1st, compile each hourly matter's time entries, itemized to the tenth of an hour, into a Stripe invoice draft. Daniel approves before it is sent. The invoice is payable online or by check. | A schedule, on the 1st |
| `RB-03` | Zapier | Matter milestone notice: when Ruth moves a matter's stage, send a templated "where your matter stands" email. Daniel may add a line. | A matter's stage changes in Airtable |

**AI**
- **Practice Q&A bot.** It answers in the chat on practice areas, fees, consultation cost, what to bring, video meetings and hours. It never gives legal advice and asks people not to share confidential details. Criminal and personal injury questions get a referral by phone. It can book a consultation.
- **Inbox triage agent.** It sorts office@ mail. Existing clients, courts and opposing counsel go to Daniel untouched, unread by Claude beyond the sorting. For a new enquiry or admin email it drafts a reply, which Ruth approves.
- **Consultation prep agent.** Before a consultation, it gathers the area's checklist from the site's own guides and the booking details for Daniel. The prep goes to Daniel only.

### Ostler (`ostler-barbers`, `OS`)

**The shop**
- A four-chair barbershop at 6 Carrow Mews, London W1T 4QS, three minutes from Goodge Street. Phone 020 7946 0381.
- Hours: Mon–Fri 08:00–20:00, Sat 08:00–18:00, Sun 10:00–16:00.
- Walk-ins are seen when a chair is free, which is rarely after four.
- Rated 4.9 from 1,186 reviews.

**Barbers**
- Tomas Reyne: founder and master barber.
- Jonah Vell: senior barber.
- Arun Mehta: head of shave.
- Leo Hartley: apprentice. He cuts at chair four on Tuesdays and Wednesdays for £34.
- Each barber keeps their own book.

**Services (price, time)**
- Ostler cut: £68, 60 min
- Taper & fade: £58, 45 min
- Long hair & scissor work: £84, 75 min
- Hot-towel shave: £54, 45 min
- Beard shape: £38, 30 min
- Signature: £118, 105 min

Cancel up to 24 hours ahead at no charge.

**Membership**
- £95 a month, cancel any month.
- A standing appointment with the same barber every three or four weeks, a beard shape between cuts, 10% off the shelf with refills at cost, and first refusal on Friday and Saturday evenings.
- Capped at forty members per barber. Chair one has a waiting list.

**The shelf**
- Matte clay £24, Beard oil £28, Shave soap £26, Hair tonic £30.
- Free UK delivery over £50, or collect the same day.
- Bring the empty back and the refill is half price.

**Also on the site:** gift cards, a quarterly letter ("The Ostler Letter") and a careers page. There is no form; the calls to action are buttons: "Book a chair", "Book with <barber>", "Add to bag", "Become a member", "Subscribe".

**Pinned flows**

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `OS-01` | n8n | Chair booking: a booking with a barber gets a templated confirmation and a reminder the day before, both stating the 24-hour free cancellation. A cancellation frees the chair. | A Cal.com booking or cancellation |
| `OS-02` | Make | Membership: a new Stripe subscription checks the barber's cap of forty. If there is room, the barber confirms the standing slot by hand. If not, the member joins that barber's waiting list and is told so in a template. | A new Stripe subscription |
| `OS-03` | Zapier | Shelf order: a Stripe checkout for the shelf becomes a pick list. Delivery is free over £50, and a same-day collection alerts the shop. The order email is templated. | A Stripe checkout (shelf) |

**AI**
- **Shop Q&A bot.** It answers in the chat on services, prices, durations, barbers, hours, membership terms and the shelf. It points to "Book a chair" and hands off to the shop's phone.
- **Chair gap agent.** When a cancellation frees a slot, it drafts an offer to members with first refusal, then to the barber's waiting list. The barber approves the offer.
- **Rebooking agent.** Three or four weeks after a non-member's cut, it drafts a "your next cut" note with their barber's next free times. The barber approves it.

---

## Tasks

Each content task follows the batch 1 steps:
1. Write the file as `export default` with type-only imports.
2. Register it with `withSite`.
3. Run `npx vitest run tests/cases-data.test.ts`.
4. Run `npm run cases`, then `npx vitest run tests/make-cases.test.ts`.
5. Check it visually in both themes with no console errors, and save screenshots to the session scratchpad.
6. Commit.

A site's first registered page also adds its key to `CASE_SITES`. The "all five pages" test may fail between a site's two tasks.

### Task 1: Riverdale & Brooks · Automation and Build plan
**Files:** create `data/cases/riverdale-and-brooks/automation.ts` and `buildPlan.ts`. Modify `data/cases/index.ts`, `data/cases/pages.ts` and `tests/helpers/caseChecks.ts`. In `caseChecks.ts`, add Riverdale's `bannedFields` to `SENSITIVE`, with a self-test in `tests/cases-data.test.ts`.
- The flows are as in the Riverdale table.
- Data tables hold contact, area, scheduling and billing fields only.
- The legal rule appears in every flow's watch-outs.
- Run at least 2 test rows per workflow, covering every branch, and plan 5 build phases.

### Task 2: Riverdale & Brooks · AI agents, End-to-end and Framework
**Files:** create `agents.ts`, `endToEnd.ts` and `agenticFramework.ts` in the same folder. Modify `data/cases/index.ts`.
- Build the bot and two agents as pinned.
- The guardrails include "never gives legal advice" and the confidentiality note.
- The Framework's worked example takes RB-01 through the loop. `example.link` points at Riverdale's end-to-end page.

### Task 3: Ostler · Automation and Build plan
As Task 1, for Ostler (`ostler-barbers`), without the `caseChecks.ts` change. Prices are in pounds.

### Task 4: Ostler · AI agents, End-to-end and Framework
As Task 2, for Ostler. The Framework's example takes OS-01 through the loop.

### Task 5: Verify, final review, open the batch PR
1. Run `npm test`, `npx tsc --noEmit`, `npx eslint .` and `npm run e2e`.
2. Run `npm run cases`, then check `git status` is clean.
3. Walk all six tabs for each new site and take a screenshot of each page.
4. Run a final whole-branch review and one fix wave.
5. The controller pushes the branch and opens the PR into `feat/case-checks`.
