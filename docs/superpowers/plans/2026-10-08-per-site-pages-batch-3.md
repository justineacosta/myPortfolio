# Per-site case pages: batch 3 implementation plan (Harbor & Pine, Westmere, Ironline, Meridian Werks, Meridian Energy)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write the five case pages for the last five sample sites, so all eleven sites open their pages from the preview window's tab row.

**Architecture:** No new tooling, apart from one small check change (Task 0). Each site gets five typed content files in `data/cases/<key>/`, registered in `data/cases/index.ts` and listed in `CASE_SITES`. `npm run cases` renders them. `tests/cases-data.test.ts` checks every page and checks across each site's pages.

**Spec:** `docs/superpowers/specs/2026-10-05-per-site-pages-design.md`. Models: the eight sites already in `data/cases/`, reviewed. The newest are Riverdale & Brooks and Ostler.

**These four businesses already appear on the general pages.** Harbor & Pine, Westmere, Meridian Werks and Meridian Energy have flows on the general Automations page (`data/automations.ts`: HP-01, WM-01, ME-01, MW-01). They also have builds on the general AI agents page (`data/agents.ts`), as does Ironline. Each site's case pages reuse those as their anchor: the same code, title, trigger and platform for the flow, and the same bot or agent, written in more depth. That way a visitor who compares the general page with a site's own pages sees one story.

## Global Constraints

- **Branch:** `feat/cases-batch-3`, based on `feat/cases-batch-2` (PR #50). The PR targets `feat/cases-batch-2`.
- **Keys and code prefixes:**

  | Key | Prefix |
  |---|---|
  | `harbor-and-pine-moving` | `HP` |
  | `westmere-los-angeles` | `WM` |
  | `ironline-utility-infrastructure` | `IL` |
  | `meridian-werks` | `MW` |
  | `meridian-energy-infrastructure` | `ME` |

- **Facts first:** run `npm run site-facts -- <key>.html` before writing.
- **Flows per site:** 3 flows, one each on n8n, Make and Zapier. Each flow has 5–9 steps and a unique title of 22 characters or fewer.
  - The general page's flow keeps its code and platform. ME-01 is Make, MW-01 is Zapier, and HP-01 and WM-01 are n8n.
  - The other two codes take the remaining platforms in order (see Task 0).
- **AI per site:** 1 RAG bot and 2 agents. Build plan workflows match the flows one to one, with the same titles. Helpers are `<P>-H01…`.
- **Tools:** only from `lib/brand/tools.ts`, and each tool on at least two of a site's working pages.
- **No renderer changes.**
- **Copy:**
  - curly quotes only
  - labels and sub-lines of 22 characters or fewer
  - never "Cursor" or GoHighLevel
  - titles name the business
  - every page says "fictional" and "illustrative"
  - never name another sample site
- **The two Meridian sites:** always use the full name ("Meridian Werks", "Meridian Energy Infrastructure"). Ironline's site names a client called "Meridian Power". Ironline's pages should not name clients at all.
- **Person's-yes rule, in scope (Lesson 9):** the named person approves anything Claude drafts for a customer's inbox, plus any money the site says needs a yes. A templated message sends on its own. The bot answers live without a yes. Name only tools the business uses.
- **Untouched files:** the general pages and the other six sites' pages stay byte-identical.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Lessons (all apply; reviewers check every one)

1. **n8n:** Always Output Data on searches, and say what an empty result does.
2. **Make:** use the app's "Make an API call" and route on the list's length.
3. **Zapier:**
   - Paths never rejoin; put shared steps before the Paths or in a Sub-Zap.
   - One trigger per Zap.
   - Human in the Loop notifies by email and records Approved or Rejected.
   - Use a Formatter Lookup Table for any value that depends on a condition.
4. **Modules:** name only real modules and settings. State retention precisely (n8n keeps a run while it waits at a gate). Don't claim a connection is send-only.
5. **Helpers:** an alert helper is never covered by the error workflow that calls it.
6. **Vocabulary:** one vocabulary per field.
7. **Page agreement:** every page agrees with the Automation page. A re-run is a labelled arc, not a continuing edge.
8. **The bot:**
   - chat only
   - never invents a price, date or figure
   - email is a hand-off to a person
9. **The person's-yes rule** is stated in scope everywhere.
10. **No third-party integrations claimed:** listing sites, review sites, SCADA, dispatch radio, clinic or court systems. A person does those steps, by hand.
11. **Emailed approval links** open a confirm page. Only its POST records the answer.
12. **Every FAQ answer is read.** Deliver promise words as the site means them ("same working day", "within one business day", "within six hours").
13. **Never say Claude runs "inside every flow"** unless it does.

## Review Focus

1. **Ironline is a safety trade.**
   - Its bot and agents never give switching, clearance, energized-work or other safety-critical instructions. Those come from the job brief, the superintendent and system operations.
   - Emergencies go to the 24/7 line, (614) 555-0199.
   - Task 0 adds a `SENSITIVE` entry, and its agents page must say it never gives switching or safety instructions.
2. **Westmere sells housing in the US.** Nothing screens, sorts or scores a buyer on anything a fair-housing rule protects. "Qualified buyer" means proof of funds and nothing else, and a person decides it.
3. **Meridian Werks is in Rotterdam (NL, EU).**
   - Prices and money are in euros.
   - A registration number is personal data, so keep it to the job record.
   - The bot never diagnoses a fault remotely, in the site's words: "Describe the symptom rather than the repair. Diagnosis is our job."
4. **Harbor & Pine's site promises "Same-day written reply, no automated pricing bots".** Claude may draft a range for the coordinator only. No price reaches a customer without the coordinator, as on the general page's HP-01.
5. **Money:**
   - Harbor & Pine's invoices (the general Billing follow-up agent drafts reminders, and the coordinator approves them)
   - Meridian Werks: any work beyond the approved estimate needs the owner's yes ("Any variation is approved before it happens")
   - Meridian Energy's production guarantee ("If the asset underperforms the model, we write the cheque"): any payment is a person's decision

---

## Site facts and pinned decisions

### Harbor & Pine Moving Co. (`HP`)

- **The business:** a family-run mover on the Tidewater coast since 2009, founded by Marisol Vega.
  - Address: 418 Cannery Row, Bellhaven, Tidewater 04581.
  - Contact: (555) 014-2200, hello@harborandpine.example.
  - Hours: Mon–Fri 7am–6pm, Sat 8am–2pm.
- **Promises:**
  - The quote form has three steps: Moving from, Moving to, Target moving date.
  - "A coordinator reads every request and replies the same working day with a written range — or books a walkthrough."
  - "Same-day written reply, no automated pricing bots."
  - The estimate holds unless the inventory changes.
  - No deposit is needed to hold a date.
  - A named coordinator and a lead mover; nothing is subcontracted.
  - Free on-site walkthrough within 20 miles of Bellhaven.
- **Long distance:** runs leave Tuesdays and Fridays, with 2–4 days in transit.
- **Service towns:** Bellhaven, Lantern Bay, Marrow Point, Saltbrook, Fern Cove, Windward Hill, Ashby Landing, Cormorant Isle.
- **Specialty work:** certificates of insurance filed with building management, ferry scheduling and custom crating.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `HP-01` | n8n | Moving estimate, from the general page. Claude drafts a written range for the coordinator only. Nothing reaches the customer until the coordinator approves. Reply the same working day, or book a walkthrough. | The quote form |
| `HP-02` | Make | Move day: the day before the move, a templated message with the crew time and the lead mover's name and number. | A schedule, for each move booked for tomorrow |
| `HP-03` | Zapier | Certificate of insurance: a building's request for a COI gets the certificate sent to building management, after the coordinator checks it. | A COI request logged in Airtable |

- **Bot:** the help-desk RAG bot from the general page. It answers customers in the site chat from the pricing guide and FAQ. Damage claims go to a person.
- **Agents:**
  - The Billing follow-up agent from the general page. It drafts a reminder for an overdue Stripe invoice, and the coordinator approves it.
  - A Walkthrough prep agent. It prepares the coordinator for a walkthrough from the request, the service area and any specialty items. It goes to the coordinator only.

### Westmere, Los Angeles (`WM`)

- **The business:** a residential developer since 2009, with 14 developments and 480 residences.
  - Sales gallery: 9200 Sunset Blvd, Suite 40, West Hollywood CA 90069.
  - Contact: +1 310 555 0148, private@westmere.la.
  - DRE #02114471, Equal Housing Opportunity.
- **Viewings:** private viewings Tuesday to Saturday, by appointment only.
- **Calls to action** (no form): Book a private viewing, Request the full portfolio, Enquire on this residence, Download the brochure.
- **Residences:**
  - The Orchard Residences: Trousdale Estates, $12,750,000, 4 bedrooms, 3,850 sq ft, completion 2027 Q2, 2 of 3 remaining.
  - Casa Verde: $8,400,000.
  - Skyline Residences: from $2,150,000, 48 residences, 2028.
  - The Monument.
  - The Estate, Malibu.
- **Valuation figures** are by Kestrel Valuation Partners, "available in full to qualified buyers".

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `WM-01` | n8n | Residence enquiry, from the general page. Serious buyers reach an agent within minutes. Everyone else gets the brochure and stays on the list. | Enquire on this residence |
| `WM-02` | Make | Private viewing: a request books a Tuesday–Saturday appointment at the sales gallery and sends a templated confirmation. | Book a private viewing |
| `WM-03` | Zapier | Full portfolio: the request goes to the sales team. The valuation pack is sent only after a person confirms proof of funds. | Request the full portfolio |

- **Bot:** the Document Q&A bot from the general page. The sales team asks it about a buyer's contracts, and it answers with the page or says the answer isn't there. It is internal.
- **Agents:**
  - A Viewing prep agent, for the agent who hosts the viewing. It works from public residence facts and the enquiry only.
  - A Buyer follow-up agent. It drafts after a viewing, and the hosting agent approves.
- **Fair housing:** neither agent scores or sorts buyers.

### Ironline Utility Infrastructure (`IL`)

- **The business:** a self-perform electrical utility contractor since 1978, employee-owned, IBEW-signatory, with 340 people working across seven states.
  - HQ: 2400 Corrugated Way, Columbus OH 43219.
  - Bid desk: (614) 555-0142, Mon–Fri 6a–6p ET.
  - Emergency: (614) 555-0199, answered 24/7/365.
  - Estimating: bids@ironlineutility.com.
- **Promises:**
  - A superintendent, not a salesperson, reviews every inquiry and responds within one business day.
  - Storm crews roll within six hours of a call.
  - Every near-miss is reviewed company-wide within 48 hours.
  - Closeout and as-builts are delivered within ten business days of energization.
  - Every task starts with a documented job brief.
- **Calls to action:** Request a bid (drawings, a scope letter, or a two-line description), Call the bid desk.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `IL-01` | n8n | Bid request: log the request, assign a superintendent, and send a templated acknowledgement saying they will respond within one business day. | Email to bids@ |
| `IL-02` | Make | Near-miss review: a filed report becomes a draft company bulletin for the safety director to approve within 48 hours. | A near-miss report form |
| `IL-03` | Zapier | Closeout: from energization, track the ten business days, remind the project lead, and send the closeout package after the superintendent approves. | Energization date set in Airtable |

- **Bot:** the Team knowledge bot from the general page. Crews ask in Telegram, and it answers from the field SOPs and the equipment sheet. It never gives switching, clearance or energized-work instructions; those come from the job brief and the superintendent. Emergencies go to the 24/7 line.
- **Agents:**
  - A Bid triage agent. It summarises a scope letter and drawings list for the superintendent, internal only.
  - A Near-miss bulletin agent. It drafts the company-wide lesson, and the safety director approves.

### Meridian Werks (`MW`)

- **The business:** an independent workshop at Loodsweg 14, Unit B, 3089 JS Rotterdam, since 2012.
  - Contact: +31 10 244 1180, workshop@meridianwerks.nl.
  - Hours: Mon–Fri 07:30–18:00, Sat 09:00–14:00, Sunday closed.
- **People:** Anton Vosloo (founder and master technician, signs off every calibration and pre-purchase inspection), Ilse Brandt (workshop manager: scheduling and estimates), Marc Deledda and Joris Smeets.
- **Booking:** a four-step booking with vehicle (make, model, year, registration optional, mileage, use), service, date and details. "We confirm by phone within one working day."
- **Process:** Consultation → Diagnostics → Recommendation (photos, priorities, a fixed estimate) → Execution.
- **Promises:** "No work begins before the findings are documented and approved." "Any variation is approved before it happens."
- **Other details:** a 24-month parts and labour warranty, and fleet contracts with monthly reporting.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `MW-01` | Zapier | Service booking, from the general page: the slot is held, the job card opened and the workshop told. | The booking form |
| `MW-02` | n8n | Health report: the findings, photographs and fixed estimate (needed now, upcoming, optional) go to the owner. Work starts only on the owner's approval. | A technician marks diagnostics done |
| `MW-03` | Make | Fleet report: each fleet client's monthly report of jobs, uptime and costs, which Ilse checks before it is sent. | A schedule, on the 1st |

- **Bot:** a Workshop Q&A bot, new. It answers in the site chat on services, marques, hours and booking. It never diagnoses a fault; it points to booking.
- **Agents:**
  - The Inbox triage agent from the general page. It sorts booking and reschedule emails and drafts replies. Urgent ones go to a person. Ilse approves.
  - The Weekly report agent from the general page. It is the owner's Monday summary.

### Meridian Energy Infrastructure (`ME`)

- **The business:** a commercial solar and storage developer. HQ in Houston TX; offices in San Antonio TX and Baton Rouge LA. It serves TX, LA, MS, AL and OK.
- **Scale:** 184 projects, 312 MW.
- **Promises:**
  - A contracted 48-hour response on any production fault.
  - "If the asset underperforms the model, we write the cheque."
  - A 25-year operations obligation.
- **Process:** Site Survey and Production Modelling (2 weeks) → Financial Structuring (3 weeks) → Engineering and Permitting (8–12 weeks) → Procurement (6–10 weeks) → Construction and Commissioning (10–16 weeks) → Operations (25 years).
- **Calls to action:** Request a site assessment, Talk to an energy advisor.

| Code | Platform | Flow | Trigger |
|---|---|---|---|
| `ME-01` | Make | Site survey, from the general page. Strong sites get a survey on the calendar. The rest get a useful guide instead of silence. | The site survey wizard |
| `ME-02` | n8n | Production fault: a fault logged by the operations team opens a ticket. A person dispatches a technician, and the client gets a templated notice of the 48-hour response. | A fault logged in Airtable by the operations centre |
| `ME-03` | Zapier | Monthly production report: generation against the model for each client. Any shortfall payment is the asset manager's decision, made by hand. | A schedule, monthly |

- **Bot:** the Website sales bot from the general page. It answers visitors' cost and fit questions, then offers a site assessment.
- **Agents:**
  - The Lead research agent from the general page. It scores a firm's fit and drafts a reply, which an energy advisor approves.
  - A Report note agent. It drafts the plain-language note on each monthly report, and the asset manager approves it.
- **Electrical safety:** nothing tells a client to touch equipment. Emergencies go to 911 and the utility.

---

## Tasks

**Every content task follows the batch 1 and 2 steps:**
1. Write the page as `export default`, using type imports only.
2. Wrap it with `withSite` and register it.
3. Run `npx vitest run tests/cases-data.test.ts`.
4. Run `npm run cases`, then `npx vitest run tests/make-cases.test.ts`.
5. Do a visual check in both themes: no console errors, and screenshots saved to the scratchpad.
6. Commit.

A site's first registered page also adds its key to `CASE_SITES`. The five-pages test may fail between a site's two tasks.

### Task 0: Allow the general page's platform order, and add Ironline's safety rule
**Files:** `tests/helpers/caseChecks.ts`, `tests/cases-data.test.ts`.
- **Platform order.** `checkAutomation` requires `-01` n8n, `-02` Make, `-03` Zapier. Change it to require one flow on each platform, codes `<P>-01..03` in order, and the platforms in this order:
  - n8n, Make, Zapier, unless the site keeps a general page's flow;
  - ME is Make, n8n, Zapier;
  - MW is Zapier, n8n, Make.

  Add a small `PLATFORM_ORDER` override map for `meridian-energy-infrastructure` and `meridian-werks`, and a self-test.
- **Ironline.** Add a `SENSITIVE` entry for `ironline-utility-infrastructure`. It requires `/switching/i` on its agents page, for the "never gives switching or safety instructions" line. Add a self-test.

### Tasks 1–10: two tasks per site, in this order
1. Harbor & Pine: Automation and Build plan
2. Harbor & Pine: AI agents, End-to-end and Framework
3. Westmere: Automation and Build plan
4. Westmere: AI agents, End-to-end and Framework
5. Ironline: Automation and Build plan
6. Ironline: AI agents, End-to-end and Framework
7. Meridian Werks: Automation and Build plan
8. Meridian Werks: AI agents, End-to-end and Framework
9. Meridian Energy: Automation and Build plan
10. Meridian Energy: AI agents, End-to-end and Framework

**What each task covers:**
- **Flows:** as pinned. Every anchored flow keeps the general page's code, title, trigger and outcome, and adds depth.
- **Build plan:** at least 2 test rows per workflow, covering every branch, and 5 build phases.
- **Framework:** its worked example takes `<P>-01` through the loop. `example.link` is `{ label: 'See <name>’s end-to-end workflow', href: '/cases/<key>/end-to-end.html' }`.
- **Reused general-page builds:** keep their name, trade and line consistent with `data/agents.ts`.

### Task 11: Verify, final review, open the batch PR
1. Run `npm test`, tsc, eslint and `npm run e2e`. Run `npm run cases`, and confirm the git status is clean.
2. Walk all six tabs for each of the five sites and take screenshots.
3. Run the final whole-branch review and one fix wave.
4. The controller pushes and opens the PR into `feat/cases-batch-2`.
