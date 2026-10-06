/**
 * Riverdale & Brooks’s Build plan case page (spec 2026-10-05 per-site pages):
 * the blueprint behind the three flows on its Automation page, RB-01 on n8n,
 * RB-02 on Make and RB-03 on Zapier, with the helpers, data, tests and
 * handover they need. Every table holds contact, area, scheduling and billing
 * fields only. data/cases/index.ts registers it; `npm run cases` renders it
 * into public/cases/riverdale-and-brooks/build-plan.html. Only type imports,
 * so Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The legal rule, first in every flow’s watch-outs. */
const RULE = 'The legal rule: the form asks people to leave confidential details out, and nothing confidential is stored in an automation, Claude, HubSpot or Airtable. This flow carries names, contact details, the area of law and scheduling or billing data only. The optional few sentences from the form pass through n8n and Gmail only to reach Daniel’s inbox, and are saved nowhere else. The conflict check is done by hand, and what a matter is about stays with Daniel.'

/** The page note on vendors, as on the AI agents page. */
const VENDORS = 'Before any client’s matter goes into these tools, the firm would confirm each vendor’s confidentiality terms and the client’s informed consent, as the profession’s ethics guidance on AI expects.'

const RB01: Workflow = {
  code: 'RB-01',
  title: 'Consultation request',
  platform: 'n8n',
  outcome: 'Every consultation request is answered within a minute with the right fee and a link to book 30 minutes in the office or by video, Ruth knows who asked, and anything written about a situation reaches Daniel’s inbox alone.',
  trigger: 'n8n’s Webhook catches Request a consultation the moment someone presses Send request.',
  exits: ['Free reply sent, Ruth told', '$150 reply sent, Ruth told'],
  watch: [
    RULE,
    'Two steps read the few sentences, and only two: Situation written?, which checks whether they are blank, and To Daniel’s inbox, which sends them. Both take them straight from the Webhook step by expression. Keep contact and area has Include Other Input Fields off, so no step after it is handed them.',
    'RB-01’s settings save no executions, successful, failed or manual, so n8n keeps no copy of a request or its few sentences, even of a run that fails.',
    'To Daniel’s inbox sends from and to daniel@riverdalebrooks.law on its own Gmail connection, RB · Gmail Daniel (n8n), which no other step uses. The step uses only Send message, and no step reads Daniel’s mail. Like any Gmail connection in n8n, it authorises access that could read the mailbox, which is why it belongs to Daniel alone, is connected by him and is never shared. The few sentences never reach office@, where the inbox agent sorts mail, and no step summarises them: Daniel reads them as they were typed.',
    'Save the contact is a Create or update matched on email, so a second request from the same email updates the same row. There is no search, so nothing can come back empty and end the run quietly.',
    'Contacts is saved before any email goes out. If the save still fails after three tries, its error output hands the name, phone, email and area, never the few sentences, to RB-H01, so Ruth can add the row by hand, and the run goes on to the reply. If a later step fails, RB-H02 tells Ruth which one, and she answers the newest row in Contacts by hand. If To Daniel’s inbox itself fails, the few sentences go with the run, by design, and Daniel hears them at the consultation instead.',
    'Both replies are fixed templates, so they send on their own. They state the cost before booking, as the site promises, and repeat its line: writing to the firm creates no attorney-client relationship, so please don’t send confidential details yet.',
    'The two Cal.com event types, Estate planning consultation and Consultation, are 30 minutes, in the office or by video, and ask only for a name and email. Additional notes is hidden, so nothing about a situation enters Cal.com either. Cal.com sends its own booking confirmation.',
    'The conflict check is in no flow. Daniel or Ruth runs it by hand, before any engagement letter.',
  ],
  nodes: [
    node('a1', 'trigger', 'Consultation request', 'Webhook', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/rb/consultation'], ['Method', 'POST'], ['Respond', 'Immediately']], 'Someone presses Send request on Request a consultation, and the form arrives here: full name, phone, email, the area and, if written, the few sentences.'),
    node('a2', 'action', 'Keep contact and area', 'Edit Fields', 'ShieldCheck', ['n8n'], 'n8n · Edit Fields (Set)', [['Keeps', 'full name, phone, email, area asked about'], ['Include Other Input Fields', 'Off, so the few sentences go no further'], ['Email', 'trimmed and lowercased']], 'Keeps the contact details and the area, and leaves the few sentences behind, so they reach no table, reply or alert.'),
    node('a3', 'action', 'Save the contact', 'Airtable', 'Database', ['airtable'], 'n8n · Airtable › Create or update', [['Table', 'Contacts'], ['Match on', 'Email'], ['Sets', 'Name, Phone, Area asked about, Requested at'], ['Retry on fail', 'On, 3 tries'], ['On error', 'Continue (using error output): RB-H01 tells Ruth, urgently, the name, phone, email and area, never the few sentences, then the run goes on to the reply']], 'Adds the person to Contacts, or updates their row if this email has asked before.'),
    node('a4', 'branch', 'Situation written?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Condition', 'the few sentences, from the Webhook step, are not empty'], ['Keeps', 'nothing; it only checks']], 'Sends a request with a few sentences on to Daniel, and one left blank straight to the reply.'),
    node('a5', 'action', 'To Daniel’s inbox', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'RB · Gmail Daniel (n8n), signed in as daniel@riverdalebrooks.law'], ['To', 'daniel@riverdalebrooks.law, alone'], ['Subject', 'Consultation request, with the name and area'], ['Body', 'the few sentences, exactly as typed'], ['Written by', 'the person who sent the form; no Claude, no summary']], 'Emails the few sentences to Daniel’s own inbox. It is the only step that sends them.'),
    node('a6', 'branch', 'Estate planning?', 'Switch', 'ArrowsSplit', ['n8n'], 'n8n · Switch', [['Estate planning', 'Area asked about is Estate planning & probate'], ['Other areas', 'any other area, Something else included, as the fallback output']], 'Picks the reply with the right consultation fee.'),
    node('a7', 'action', 'Free consult reply', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'RB · Gmail (n8n), signed in as office@riverdalebrooks.law'], ['Template', 'Your free consultation'], ['Holds', 'your estate planning consultation is free; the Estate planning consultation link, 30 minutes, office or video; 114 East Main Street and the free lot behind it, entrance on Mill Street; what to bring and the Preparing for your first meeting checklist; wills signed in person with witnesses; no attorney-client relationship yet, so please don’t send confidential details'], ['Written by', 'a fixed template, not Claude']], 'Emails the person that their estate planning consultation is free, with the link to book it.'),
    node('a8', 'action', '$150 consult reply', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'RB · Gmail (n8n), signed in as office@riverdalebrooks.law'], ['Template', 'Your consultation'], ['Holds', '$150 for the first thirty minutes, credited toward the fee if they hire the firm; the Consultation link, 30 minutes, office or video; the same address, checklist and line on confidential details; no criminal defense or personal injury, and a call to (540) 555-0148 for a referral'], ['Written by', 'a fixed template, not Claude']], 'Emails the person the $150 cost, credited if they go ahead, with the link to book.'),
    node('a9', 'helper', 'Alert Ruth', 'RB-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'RB-H01 · Alert Ruth'], ['Says', 'the name, phone, area, the reply sent, and whether a note went to Daniel'], ['Wait for it', 'No']], 'Sends Ruth the request on Telegram, without a word of the few sentences.'),
    node('a10', 'end', 'Ruth follows up', 'By hand', 'PencilSimple', [], 'Ruth, by hand · not an n8n step', [['Who', 'Ruth'], ['When', 'within one business day'], ['Calls', 'a Something else request, or anyone who has not booked']], 'Ruth calls when a request needs it, for instance one that may need a referral. A booking arrives in Cal.com on its own.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'),
    edge('a4', 'a6', 'Left blank'), edge('a4', 'a5', 'Written'), edge('a5', 'a6'),
    edge('a6', 'a7', 'Estate planning'), edge('a6', 'a8', 'Other areas'),
    edge('a7', 'a9'), edge('a8', 'a9'), edge('a9', 'a10'),
  ],
}

const RB02: Workflow = {
  code: 'RB-02',
  title: 'Monthly invoice',
  platform: 'make',
  outcome: 'On the 1st, every open hourly matter’s time is drafted into a Stripe invoice, itemized to the tenth of an hour, and none goes out until Daniel has checked it and pressed Send.',
  trigger: 'Make’s scheduler starts the draft scenario on the 1st of each month at 7:00 am Eastern, and the tell scenario at 7:30.',
  exits: ['Drafted, Daniel approves', 'No Stripe customer, with Ruth', 'No time, nothing drafted'],
  watch: [
    RULE,
    'Time entries holds a date, a kind of work from a fixed list and the hours, with no free-text field. The invoice lines carry the same and an amount, so nothing about what a matter is about reaches Make, Airtable or Stripe.',
    'Daniel approves every invoice. Make only creates drafts, with Auto-advance off, so Stripe never finalizes or sends one on its own. Daniel opens each in Stripe, checks it and presses Send invoice; no flow sends an invoice.',
    'The email to Daniel links each draft in Stripe’s dashboard. Opening a link records nothing: the only yes is Daniel’s own click on Send invoice, on Stripe’s page.',
    'Make gives a scenario one trigger, so RB-02 is two scenarios in one folder: RB-02 · Monthly invoice · draft and RB-02 · Monthly invoice · tell, half an hour apart. The Automation page draws them as one flow.',
    'Find hourly matters, Gather time entries and Find the drafts are Make an API call modules, not searches, so each returns one bundle with a list, even an empty one, and the router reads the list’s length. A search that found nothing would end the route and drop the matter without a word.',
    'With no open hourly matter, the iterator has nothing to loop over and the run ends; the 7:30 email then says no invoice is waiting. A matter with no time logged passes neither route and ends there: there is nothing to bill.',
    'Each entry is marked with its invoice as its line is added, so a second run, after Ruth adds a customer or after Make retries, never bills an entry twice.',
    'Flat-fee matters never appear: Find hourly matters asks for Billing = Hourly only. Litigation and contested matters are billed hourly, with Daniel’s written estimate up front, given by hand.',
    'Online payment is on Stripe’s own invoice page. A check comes to 114 East Main Street, and Ruth marks the invoice paid in Stripe by hand. No flow refunds or voids an invoice: that is Daniel’s, in Stripe.',
    'Every module that writes has an error route that posts the step and the error, never the entries, to /rb/failed, and ends in Break, so Make keeps the run to retry.',
  ],
  nodes: [
    node('b1', 'trigger', 'On the 1st', 'Schedule', 'Clock', ['make'], 'Make · Scenario schedule', [['Scenario', 'RB-02 · Monthly invoice · draft'], ['Runs', 'Days of the month: 1, at 7:00 am Eastern']], 'On the 1st of each month, the first scenario wakes.'),
    node('b2', 'action', 'Find hourly matters', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'GET /v0/{base}/Matters'], ['Formula', 'Billing is Hourly, Engagement signed on is set, Closed on is empty'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Lists every open hourly matter.'),
    node('b3', 'action', 'For each matter', 'Iterator', 'ArrowsClockwise', ['make'], 'Make · Flow Control › Iterator', [['Loops over', 'the matters found'], ['An empty list', 'no bundles, so the run ends']], 'Runs the steps after it once for each matter.'),
    node('b4', 'action', 'Gather time entries', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'GET /v0/{base}/Time entries'], ['Formula', 'Matter is this one, Date is before the 1st, Invoice is empty'], ['Returns', 'one bundle with a list, even an empty one']], 'Lists the matter’s time entries that are on no invoice yet.'),
    node('b5', 'branch', 'Ready to bill?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Time logged', 'the list has an entry, and the client has a Stripe customer'], ['No Stripe', 'the list has an entry, and the client has no Stripe customer'], ['No time', 'the list is empty: neither route passes, and the matter ends']], 'Routes on the list’s length and the client’s Stripe customer.'),
    node('b6', 'action', 'Draft the invoice', 'Stripe API call', 'Receipt', ['stripe'], 'Make · Stripe › Make an API call', [['Call', 'POST /v1/invoices'], ['Customer', 'the client’s Stripe customer'], ['Collection', 'send_invoice, due in 30 days'], ['Auto-advance', 'Off, so it stays a draft'], ['Footer', 'Pay online, or by check to Riverdale & Brooks, PLLC, 114 East Main Street, Laurel Ford, Virginia 22843'], ['Metadata', 'the matter’s record ID']], 'Creates an empty draft invoice for the client in Stripe.'),
    node('b7', 'action', 'For each entry', 'Iterator', 'ArrowsClockwise', ['make'], 'Make · Flow Control › Iterator', [['Loops over', 'the time entries found']], 'Runs the next two steps once for each entry.'),
    node('b8', 'action', 'Add the line', 'Stripe API call', 'Receipt', ['stripe'], 'Make · Stripe › Make an API call', [['Call', 'POST /v1/invoiceitems'], ['Invoice', 'the draft just made'], ['Description', 'the date, the kind of work and the hours, like Oct 3 · Drafting · 1.2 h'], ['Amount', 'the hours times the matter’s hourly rate, in cents']], 'Adds the entry to the draft as one itemized line.'),
    node('b9', 'end', 'Mark it billed', 'Airtable', 'FlagCheckered', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Time entries'], ['Sets', 'Invoice = the Stripe invoice ID']], 'Marks the entry with its invoice, so it is never billed twice.'),
    node('b10', 'end', 'Ask Ruth', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Ruth’s own'], ['Says', 'the matter, its hours, and that its client has no Stripe customer']], 'Asks Ruth to add the client in Stripe and the customer on their row, then run the draft scenario once more. Entries already billed are skipped, so only this matter is drafted.'),
    node('b11', 'trigger', 'Half past seven', 'Schedule', 'Clock', ['make'], 'Make · Scenario schedule', [['Scenario', 'RB-02 · Monthly invoice · tell'], ['Runs', 'Days of the month: 1, at 7:30 am Eastern']], 'Half an hour later, the second scenario wakes.'),
    node('b12', 'action', 'Find the drafts', 'Stripe API call', 'MagnifyingGlass', ['stripe'], 'Make · Stripe › Make an API call', [['Call', 'GET /v1/invoices, status draft'], ['Returns', 'one bundle with a list, even an empty one']], 'Lists every draft invoice in Stripe, this month’s and any Daniel has not sent yet.'),
    node('b13', 'action', 'Tell Daniel', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'RB · Gmail (Make), signed in as office@riverdalebrooks.law'], ['To', 'daniel@riverdalebrooks.law'], ['Lists', 'each draft’s client, total and a link to it in Stripe’s dashboard, or that none is waiting'], ['Written by', 'a fixed template, not Claude']], 'Emails Daniel the drafts waiting for his yes.'),
    node('b14', 'approve', 'Daniel approves', 'In Stripe, by hand', 'UserCheck', ['stripe'], 'Daniel, by hand · not a Make step', [['Who', 'Daniel'], ['Checks', 'each line against his time; corrects or removes one if he must'], ['Then', 'Send invoice, in Stripe’s dashboard'], ['Stripe', 'finalizes it and emails the client']], 'Daniel checks each draft and sends it from Stripe. Nothing reaches a client before he does.'),
    node('b15', 'end', 'Paid', 'Online or by check', 'CreditCard', ['stripe'], 'The client, then Ruth for a check · not a Make step', [['Online', 'on Stripe’s invoice page'], ['By check', 'Ruth marks it paid in Stripe, by hand']], 'The client pays online or by check, and the invoice is marked paid in Stripe either way.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'),
    edge('b5', 'b6', 'Time logged'), edge('b6', 'b7'), edge('b7', 'b8'), edge('b8', 'b9'),
    edge('b5', 'b10', 'No Stripe'),
    edge('b11', 'b12'), edge('b12', 'b13'), edge('b13', 'b14'), edge('b14', 'b15'),
  ],
}

const RB03: Workflow = {
  code: 'RB-03',
  title: 'Milestone notice',
  platform: 'zapier',
  outcome: 'Every time a client’s matter moves forward, the client hears where it stands from Daniel’s own address, as the template or with a line Daniel adds and sends himself.',
  trigger: 'Zapier’s Airtable New or Updated Record hears Stage changed on a matter, a field that changes only when Stage does; Schedule by Zapier starts the reminder Zap each Monday.',
  exits: ['Template sent', 'With Daniel for his line', 'Not a client yet', 'Ruth reminded'],
  watch: [
    RULE,
    'The notice is a fixed template for each stage: the area of law, the stage, what that step means and what comes next, in the site’s own words. It names nothing about the matter itself. Anything more is Daniel’s line, which he types into his draft in Gmail and sends himself, so it never passes through Zapier or Airtable.',
    'Daniel’s line is added by hand in Gmail, not on a Human in the Loop page: a line typed into Zapier would sit in its task history.',
    'Zapier paths never join again, so the one step both ways need, Log the notice, comes before the paths, and nothing has to rejoin. The paths read Daniel adds a line from the trigger, as it was when the stage moved, so unticking it first changes nothing.',
    'Log the notice runs before anything is sent, so a stage is noticed once even if a step after it fails. A failed send reaches Ruth through RB-H02, and she sends that notice by hand.',
    'A Zap has one trigger, so RB-03 is two Zaps: RB-03 · Milestone notice · notice and · reminder. The Automation page draws the Monday reminder after the notice, with the connector marked A separate Zap.',
    'Clients only goes on only with Engagement signed on set: an attorney-client relationship begins only after the conflict check and a signed engagement letter, and before then nobody gets a matter update. Step number must also be past Last notice step, so a stage moved back, or saved twice, sends nothing. Last notice step is empty until a matter’s first notice, and the filter’s OR group lets an empty one through.',
    'The notices go from daniel@riverdalebrooks.law, so a client’s reply reaches Daniel untouched, never office@, where the inbox agent sorts mail. The Zap uses only Send Email and Create Draft, and no step reads Daniel’s mail. Zapier’s Gmail connection authorises access that could read the mailbox, which is why it belongs to Daniel alone, is connected by him and is never shared.',
    'No flow can see whether Daniel has sent a draft. Each Monday the reminder Zap lists for Ruth every matter With Daniel for more than a week, and once Daniel has sent it she sets Last notice to Sent by Daniel by hand. Find Many Records stops the Zap when it finds nothing, so a quiet week sends nothing.',
    'No flow reaches the client portal. Ruth updates its case updates by hand when she moves the stage.',
    'A failed step is caught by a Zapier Manager zap that posts it to /rb/failed.',
  ],
  nodes: [
    node('c1', 'trigger', 'Stage moved', 'Airtable', 'Table', ['airtable'], 'Zapier · Airtable › New or Updated Record', [['Zap', 'RB-03 · Milestone notice · notice'], ['Table', 'Matters'], ['Last modified field', 'Stage changed, which watches Stage only']], 'Ruth moves a matter to another stage, and the Zap starts with the matter.'),
    node('c2', 'action', 'Clients only', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Engagement signed on', 'exists'], ['Client email', 'exists'], ['Step number', 'greater than Last notice step, or Last notice step does not exist (an OR group)']], 'Goes on only for an engaged client whose matter has moved forward, or has had no notice yet.'),
    node('c3', 'action', 'Log the notice', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Matters'], ['Sets', 'Last notice step = Step number, Last notice on = today, Last notice = Template or With Daniel, Daniel adds a line = unticked']], 'Notes the notice on the matter before anything is sent, so the same stage never sends twice.'),
    node('c4', 'branch', 'Daniel adds a line?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Zapier · Paths by Zapier', [['Template only', 'Daniel adds a line, from the trigger, is unticked'], ['Add a line', 'Daniel adds a line, from the trigger, is ticked']], 'Sends the notice as it is, or to Daniel’s drafts for his line.'),
    node('c5', 'end', 'Send the notice', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'RB · Gmail Daniel (Zapier), signed in as daniel@riverdalebrooks.law'], ['To', 'the client’s email'], ['Template', 'Where your matter stands, one for each stage'], ['Holds', 'the area, the stage, what the step means, what comes next, how to reach Daniel'], ['Written by', 'a fixed template, not Claude']], 'Emails the client where their matter stands, from Daniel’s address.'),
    node('c6', 'action', 'Draft it for Daniel', 'Gmail', 'PencilSimple', ['gmail'], 'Zapier · Gmail › Create Draft', [['Connection', 'RB · Gmail Daniel (Zapier), signed in as daniel@riverdalebrooks.law'], ['To', 'the client’s email'], ['Template', 'Where your matter stands, with a marked space for Daniel’s line'], ['Written by', 'a fixed template, not Claude']], 'Puts the same notice in Daniel’s drafts, with room for his line.'),
    node('c7', 'action', 'Let Daniel know', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Daniel’s own'], ['Says', 'the matter and the stage, and that a notice waits in his drafts']], 'Tells Daniel a notice is waiting for his line.'),
    node('c8', 'end', 'Daniel sends it', 'In Gmail, by hand', 'PencilSimple', [], 'Daniel, by hand · not a Zapier step', [['Who', 'Daniel'], ['Where', 'the draft, in his Gmail'], ['Then', 'he adds his line and sends it himself']], 'Daniel writes his line into the draft and sends it. No flow sees it.'),
    node('c9', 'trigger', 'Each Monday', 'Schedule', 'Clock', ['zapier'], 'Zapier · Schedule by Zapier › Every Week', [['Zap', 'RB-03 · Milestone notice · reminder'], ['When', 'Monday, 8:30 am Eastern']], 'The reminder Zap wakes each Monday as the office opens.'),
    node('c10', 'action', 'Find waiting notices', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Many Records (With Line Item Support)', [['Table', 'Matters'], ['View', 'With Daniel a week'], ['Nothing found', 'the Zap stops']], 'Finds every matter whose Last notice is With Daniel and whose Last notice on is more than seven days ago.'),
    node('c11', 'end', 'Remind Ruth', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Ruth’s own'], ['Says', 'one line per matter: the matter, the stage and the date of the draft']], 'Sends Ruth one message listing them, so she can ask Daniel and mark each Sent by Daniel once it has gone.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'),
    edge('c4', 'c5', 'Template only'),
    edge('c4', 'c6', 'Add a line'), edge('c6', 'c7'), edge('c7', 'c8'),
    edge('c9', 'c10'), edge('c10', 'c11'),
  ],
}

const H01: Workflow = {
  code: 'RB-H01',
  title: 'Alert Ruth',
  platform: 'n8n',
  outcome: 'Every message n8n sends Ruth reads the same way and lands in her Telegram chat.',
  trigger: 'Called by RB-01, after a reply or a failed save, and by RB-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds a name, a phone, an area, a reply sent or a link, never the few sentences and nothing about a matter.',
    'A failure arrives with sound; a new request arrives silently in the evening and with sound in office hours, Mon–Thu 8:30–5:30 and Fri 8:30–3:00.',
    'RB-H02 is not set as RB-H01’s error workflow: a failure here would call RB-H02, which calls RB-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, urgent, link']], 'Another workflow hands over a message, and says whether it is urgent.'),
    node('h2', 'action', 'Add the link', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code, and a link to the contact’s row or a failed Make or Zapier run, when there is one']], 'Puts the flow’s code under the message, with a link to the contact’s row or a failed Make or Zapier run when there is one. An RB-01 failure has no run to link to.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Ruth’s own'], ['Disable notification', 'on, unless urgent or in office hours']], 'Posts it in Ruth’s chat.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'RB-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed run, on any of the three platforms, is logged and reaches Ruth: a Make or Zapier failure with a link to its run, an RB-01 failure with the workflow and the failed step.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A failed run’s row holds the platform, the flow, the step and the error, never the run’s data. A Make or Zapier failure also carries a link to its run; those histories hold contact, area and billing data only. RB-01 saves no executions, so there is no run to link to: its row and alert name the workflow and the failed step only.',
    'It never retries on its own. Ruth, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers RB-01 only, not RB-H01: RB-H01 is how this workflow alerts Ruth, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'RB-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'RB-01, as its error workflow'], ['Gives', 'the workflow and the failed step; no run link, as RB-01 saves no runs']], 'Starts whenever RB-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /rb/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/rb/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, a Zapier Manager zap']], 'Starts when a Make error route or the Zapier Manager zap reports a failed step in RB-02 or RB-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, step, error, time, and a run link for Make or Zapier'], ['Include Other Input Fields', 'Off']], 'Puts both kinds of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert Ruth', 'RB-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'RB-H01 · Alert Ruth'], ['Urgent', 'yes']], 'Sends Ruth an urgent Telegram message: the workflow and the failed step, with a link to the run when it was on Make or Zapier.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Riverdale & Brooks · Build plan',
  description: 'A build plan for Riverdale & Brooks, a small law practice on East Main Street in Laurel Ford, Virginia: three flows on n8n, Make and Zapier that carry contact, area, scheduling and billing data only, two helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'BUILD PLAN · RIVERDALE & BROOKS',
  heading: 'Every request, invoice and notice, planned before a single step is placed, and nothing confidential in any of them.',
  lede:
    'Three flows and two helpers for Riverdale & Brooks, the practice Daniel A. Brooks leads at 114 East Main Street in Laurel Ford, Virginia, with Ruth as office manager. Consultation requests run on n8n, monthly invoices on Make and matter milestone notices on Zapier. Cal.com holds the consultation calendar, Stripe holds the invoices and Airtable holds contacts, matters and time, with contact, area, scheduling and billing fields only. The few sentences someone may write on the form pass through n8n and Gmail only to reach Daniel’s inbox, and are saved nowhere; the conflict check is done by hand. Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out, and these three flows use no Claude at all: every email is a fixed template.',
  meta: [
    ['Client', 'Riverdale & Brooks, PLLC · Laurel Ford, VA'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a request, an invoice or a notice ends.',
    rail: [
      { heading: 'Why plan first', body: 'Riverdale & Brooks makes three promises a flow has to keep: a reply within one business day, hourly matters billed monthly and itemized to the tenth of an hour, and an update from Daniel at every milestone. One rule sits above them all: nothing confidential in any flow. This page pins all of it down before n8n, Make or Zapier is opened.' },
      { heading: 'The legal rule', body: 'The form asks people to leave confidential details out, and nothing confidential is stored in an automation, Claude, HubSpot or Airtable. The flows carry names, contact details, the area of law and scheduling or billing data only. The optional few sentences pass through n8n and Gmail only to reach Daniel’s inbox, and are saved nowhere else. The conflict check is done by hand, and messages from a client reach Daniel untouched.' },
      { heading: 'Confidentiality terms', body: VENDORS },
    ],
    outcome: 'Every consultation request gets the right fee and a booking link within a minute and Ruth knows of it, every open hourly matter’s month is drafted into a Stripe invoice that goes out only on Daniel’s yes, and every client hears where their matter stands when it moves, with nothing confidential in any flow.',
    trigger: 'Eight entry points: Send request on the consultation form, the 1st of each month at 7:00 and at 7:30, a matter’s stage moved in Airtable, Monday morning, RB-01 or RB-H02 calling RB-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Reply sent, Ruth told', 'Invoice sent on Daniel’s yes', 'Notice sent or with Daniel'],
    outOfScope: [
      'The few sentences from the form beyond Daniel’s inbox: no table, template, log or Claude ever holds them',
      'The conflict-of-interest check, which Daniel or Ruth runs by hand before any engagement letter',
      'Opening a matter and the engagement letter, which Ruth and Daniel handle by hand',
      'The client portal, its documents and its case updates, which Ruth keeps by hand; no flow reaches it',
      'The booking itself, which Cal.com confirms on its own, and collecting the $150 consultation fee, which no flow touches',
      'Flat fees, which Daniel bills by hand, and any refund or void, which Daniel makes in Stripe',
      'The Practice Q&A bot, the inbox triage agent and the consultation prep agent, planned on the AI agents page',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, one attorney and one office manager. When a run fails between two consultations, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'RB-[number] · [Title]', examples: ['RB-01 · Consultation request', 'RB-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Scenarios and Zaps', pattern: 'RB-[number] · [Title] · [part]', examples: ['RB-02 · Monthly invoice · draft', 'RB-02 · Monthly invoice · tell'], rule: 'A flow a platform has to split keeps one code, and the last word says which part.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Keep contact and area', 'Draft the invoice', 'Send the notice'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/rb/[source]', examples: ['/rb/consultation', '/rb/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'RB · [Service] ([platform])', examples: ['RB · Airtable (n8n)', 'RB · Gmail Daniel (n8n)', 'RB · Stripe (Make)'], rule: 'Each platform holds its own connection, and the name says which one to renew. Daniel’s own mailbox has connections of its own, named for him, connected by him and never shared. The flows use them only to send and draft, though Gmail’s access could read the mailbox.' },
      { name: 'Cal.com event types', pattern: '[What it is] · 30 min', examples: ['Estate planning consultation · 30 min', 'Consultation · 30 min'], rule: 'Each reply links the one that matches its fee.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Contacts', 'Matters', 'Time entries'], rule: 'Flows read fields by name, never by position, and no table has a field for what a matter is about.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Three Airtable tables, contact, area, scheduling and billing only, and two sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'Airtable holds what the flows need: contacts, matters and time. Cal.com holds the calendar, Stripe the invoices, and Google Sheets only keeps logs. What a matter is about stays with Daniel, in his own files, and no flow touches them.' },
      { heading: 'Contact, area, scheduling and billing only', body: 'No table has a field for the few sentences from the form, a description of a matter, a party, a note or a document, and none is added later. The handover lists adding one as a break.' },
    ],
    tables: [
      { name: 'Contacts', fields: ['Name', 'Email', 'Phone', 'Area asked about', 'Consultation fee', 'Requested at', 'Stripe customer', 'Matters'], note: 'One row per person who asks, matched on email. Area asked about takes the form’s seven choices: Estate planning & probate, Real estate, Family law, Business & agriculture, Civil dispute, Mediation, Something else. Consultation fee is a formula: Free for Estate planning & probate, $150, credited for any other. Stripe customer is the client’s ID in Stripe, which Ruth adds by hand for an hourly client.' },
      { name: 'Matters', fields: ['Matter', 'Client', 'Area', 'Billing', 'Hourly rate', 'Stage', 'Step number', 'Stage changed', 'Engagement signed on', 'Daniel adds a line', 'Last notice step', 'Last notice', 'Last notice on', 'Closed on', 'Time entries'], note: 'One row per matter, opened by Ruth by hand after the consultation, when someone goes ahead. Matter is a formula: the client’s name and the area. Area takes the six practice areas, as the form names them. Billing is Flat or Hourly. Stage is one of the site’s six steps, Consultation, Listen, Assess, Strategy, Representation or Resolution, and Step number is its place, 1 to 6. Stage changed is a Last modified time field that watches Stage only. Engagement signed on is set by Ruth, by hand, once the conflict check is clear and the letter signed. Last notice step is empty until the first notice. Last notice is Template, With Daniel or Sent by Daniel, the last set by Ruth by hand once Daniel has sent his draft. The With Daniel a week view feeds the Monday reminder.' },
      { name: 'Time entries', fields: ['Matter', 'Date', 'Activity', 'Hours', 'Amount', 'Invoice'], note: 'One row per entry, logged by Daniel. Activity is one of a fixed list, Meeting, Call, Drafting, Review, Research, Court or Travel, and there is no free-text field. Hours is to one decimal place, the tenth of an hour. Amount is a formula: Hours times the matter’s Hourly rate. Invoice is the Stripe invoice ID, set when the entry is billed.' },
    ],
    stages: [
      ['Requested', 'A consultation request saved in Contacts with its area, the reply sent and Ruth told.'],
      ['Engaged', 'A matter Ruth opened by hand, with a signed engagement letter after the conflict check.'],
      ['Noticed', 'A stage move sent to the client, or waiting in Daniel’s drafts for his line.'],
      ['Drafted', 'A month’s time in a Stripe draft, waiting for Daniel’s yes.'],
    ],
    exitStages: [
      ['No Stripe', 'An hourly matter with time logged and no Stripe customer, waiting for Ruth.'],
      ['Paid', 'An invoice paid online, or by check and marked paid by Ruth.'],
      ['Closed', 'A matter with Closed on set, no longer billed.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier, with no client data'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook on n8n, a monthly schedule on Make, an Airtable record on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['Send request, on Request a consultation', 'Webhook POST /rb/consultation', 'RB-01'],
      ['The 1st of each month, 7:00 am', 'Make schedule, draft scenario', 'RB-02'],
      ['The 1st of each month, 7:30 am', 'Make schedule, tell scenario', 'RB-02'],
      ['Ruth moves a matter’s stage', 'Airtable New or Updated Record', 'RB-03'],
      ['Every Monday, 8:30 am', 'Schedule by Zapier, reminder Zap', 'RB-03'],
      ['RB-01 or RB-H02', 'Execute Sub-workflow', 'RB-H01'],
      ['An n8n run fails', 'Error Trigger', 'RB-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /rb/failed', 'RB-H02'],
    ],
  },
  workflows: [RB01, RB02, RB03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message Ruth and Daniel with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test contacts, test matters, Stripe test mode and a test calendar before anything reaches a real client.' },
      { heading: 'Test data', body: 'Test contacts have made-up names, and no test row ever describes a real or made-up legal problem. Where a check needs text that must not get through, it uses a marker like TEST-SITUATION-01. The $250 hourly rate is illustrative.' },
    ],
    rows: [
      { id: 't01', workflow: 'RB-01', branch: 'Estate planning, written', input: 'Test Client A asks about Estate planning & probate and types TEST-SITUATION-01 in the few sentences', expected: 'A Contacts row with Free; the free reply sent with the estate planning link; TEST-SITUATION-01 in Daniel’s inbox; Ruth told, a note to Daniel: yes' },
      { id: 't02', workflow: 'RB-01', branch: 'Other area, left blank', input: 'Test Client B asks about Real estate and leaves the few sentences blank', expected: 'The $150 reply, credited, with the Consultation link; no email to Daniel; Ruth told, a note to Daniel: no' },
      { id: 't03', workflow: 'RB-01', branch: 'Something else', input: 'Test Client C picks Something else', expected: 'The $150 reply, with the line on criminal defense and personal injury; Ruth’s alert names Something else, so she calls' },
      { id: 't04', workflow: 'RB-01', branch: 'Asked before', input: 'Test Client A asks again, the email in capitals with a trailing space', expected: 'One row, updated; a fresh reply' },
      { id: 't05', workflow: 'RB-01', branch: 'The few sentences stay put', input: 'After t01, search for TEST-SITUATION-01 everywhere', expected: 'Only in Daniel’s inbox and his sent mail: not in Airtable, Telegram, either reply, office@, Cal.com or the Failed runs tab, and n8n has saved no execution' },
      { id: 't06', workflow: 'RB-01', branch: 'A step fails', input: 'A test run with the office@ Gmail connection revoked', expected: 'The contact is saved; RB-H02 logs the failed step and alerts Ruth; n8n saves no copy of the run, so she answers the newest row by hand' },
      { id: 't07', workflow: 'RB-01', branch: 'Cal.com asks nothing more', input: 'Open both live booking pages', expected: 'Each asks only for a name and email, office or video, with no notes box' },
      { id: 't08', workflow: 'RB-02', branch: 'Time logged', input: 'A test hourly matter at $250 an hour with three entries last month: 1.2, 0.5 and 2.0 hours', expected: 'One Stripe draft with three lines, 3.7 hours and $925.00, the check address in the footer; each entry’s Invoice set' },
      { id: 't09', workflow: 'RB-02', branch: 'No time', input: 'A test hourly matter with no entries last month', expected: 'No draft for it, and nothing else sent' },
      { id: 't10', workflow: 'RB-02', branch: 'No Stripe', input: 'A test hourly matter with time whose client has no Stripe customer', expected: 'Ruth asked on Telegram; once she adds the customer and runs the draft scenario, one draft, and t08’s matter is not drafted again' },
      { id: 't11', workflow: 'RB-02', branch: 'Flat fee', input: 'A test flat-fee matter with time entries', expected: 'Never found; no draft' },
      { id: 't12', workflow: 'RB-02', branch: 'Daniel’s list', input: 'The 7:30 scenario, after t08', expected: 'One email to Daniel listing the draft with its client, total and dashboard link; opening the link changes nothing in Stripe' },
      { id: 't13', workflow: 'RB-02', branch: 'Nothing waiting', input: 'The 7:30 scenario with no drafts in Stripe', expected: 'One email saying no invoice is waiting' },
      { id: 't14', workflow: 'RB-02', branch: 'Daniel approves', input: 'Daniel sends t08’s draft from Stripe; the client pays with test card 4242 4242 4242 4242', expected: 'Stripe emails the invoice only after his click; it is marked paid' },
      { id: 't15', workflow: 'RB-02', branch: 'Paid by check', input: 'Ruth marks a sent test invoice paid outside Stripe', expected: 'The invoice shows paid; no flow runs' },
      { id: 't16', workflow: 'RB-03', branch: 'Template only', input: 'Ruth moves an engaged test matter from Strategy to Representation', expected: 'Last notice step 5, Last notice Template; the notice sent from Daniel’s address' },
      { id: 't17', workflow: 'RB-03', branch: 'Add a line', input: 'Daniel ticks Daniel adds a line, and Ruth moves the matter to Resolution', expected: 'Last notice With Daniel and the box unticked; a draft in Daniel’s Gmail and a Telegram message; nothing sent until Daniel sends it' },
      { id: 't18', workflow: 'RB-03', branch: 'Daniel’s line stays put', input: 'Daniel types TEST-LINE-01 into t17’s draft and sends it', expected: 'TEST-LINE-01 only in the sent email: not in Airtable or Zapier’s task history' },
      { id: 't19', workflow: 'RB-03', branch: 'Not a client yet', input: 'Ruth moves a test matter with no Engagement signed on from Listen to Assess', expected: 'The Filter stops the Zap; no email' },
      { id: 't20', workflow: 'RB-03', branch: 'Moved back or saved twice', input: 'Ruth moves t16’s matter back to Strategy, then on to Representation again', expected: 'No notice either time' },
      { id: 't21', workflow: 'RB-03', branch: 'A step fails', input: 'A test run with the Airtable connection in Zapier revoked', expected: 'Nothing sent; the Zapier Manager zap posts it to /rb/failed, a row in Failed runs and an urgent alert to Ruth, who sends that notice by hand' },
      { id: 't22', workflow: 'RB-03', branch: 'First notice', input: 'Ruth opens a test matter with Last notice step empty, sets Engagement signed on and moves it to Strategy', expected: 'The Filter lets it through; the notice sent; Last notice step 4' },
      { id: 't23', workflow: 'RB-03', branch: 'Monday reminder', input: 'A test matter With Daniel since eight days ago, and a Monday with none waiting', expected: 'One Telegram message to Ruth naming the matter; the next quiet Monday, the Zap stops at the search and sends nothing' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order of their codes: the request on n8n, the monthly invoice on Make, then the milestone notices on Zapier.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Airtable tables, Contacts, Matters and Time entries, with contact, area, scheduling and billing fields only', 'Add the connections on each platform: RB · Airtable, RB · Gmail for office@, RB · Gmail Daniel, connected by Daniel himself and used only by the steps that send or draft from his address, RB · Telegram, RB · Stripe (test)', 'Create the Sheets tabs: Failed runs, Test matrix', 'Build RB-H01 in n8n, then RB-H02 with RB-01 (not RB-H01) as the covered error workflow'] },
      { name: '2 · Requests on n8n', tasks: ['Set up the Estate planning consultation and Consultation event types in Cal.com, 30 minutes, office or video, a name and email only, Additional notes hidden', 'Write both reply templates with Daniel and Ruth', 'Build RB-01 with Save failed, Save successful and Save manual executions all set to Do not save, and point Send request at /rb/consultation', 'Run tests t01–t07'] },
      { name: '3 · Invoices on Make', tasks: ['Set Stripe’s invoice footer and the check address in test mode, and add the test clients as customers', 'Build both RB-02 scenarios, draft and tell, in one Make folder, every writing module with an error route to /rb/failed', 'Show Daniel how to check and send a draft, and Ruth how to mark a check paid', 'Run tests t08–t15 in Stripe test mode'] },
      { name: '4 · Notices on Zapier', tasks: ['Write the six Where your matter stands templates with Daniel, one for each stage, in the site’s own words', 'Build RB-03’s notice Zap, with Log the notice before its two paths, then its Monday reminder Zap and the With Daniel a week view', 'Add the Zapier Manager zap that posts failures to /rb/failed', 'Run tests t16–t23 with test matters'] },
      { name: '5 · Test and hand over', tasks: ['Switch to RB · Stripe (live)', 'Check the legal rule with Daniel: every table, template, view and log holds contact, area, scheduling and billing data only, and the few sentences reach his inbox alone', 'Confirm each vendor’s confidentiality terms before any client’s matter goes in', 'Run the whole matrix again, walk Daniel and Ruth through the handover page, and turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Riverdale & Brooks keeps.',
    rail: [{ heading: 'Written for Daniel and Ruth', body: 'One page, no jargon, for the attorney and the office manager. It lives next to the flows.' }],
    does: [
      'Answers every consultation request within a minute with the right fee and a booking link, and tells Ruth who asked.',
      'Sends the few sentences someone writes on the form to Daniel’s inbox, and nowhere else.',
      'Drafts every open hourly matter’s month into a Stripe invoice on the 1st, itemized to the tenth of an hour, and lists the drafts for Daniel.',
      'Asks Ruth to add a Stripe customer when an hourly client has none.',
      'Tells an engaged client where their matter stands each time it moves forward, or puts the notice in Daniel’s drafts for his line.',
      'Lists for Ruth each Monday every notice that has waited in Daniel’s drafts for more than a week.',
    ],
    breaks: [
      'Renaming a field in Contacts, Matters or Time entries, or changing the Area, Stage, Billing, Activity or Last notice choices, or the With Daniel a week view.',
      'Adding a field for the few sentences, a description of a matter or a note to any table, or a notes question to a Cal.com booking page: any of them would let something confidential into a flow.',
      'Turning on n8n’s saved executions for RB-01.',
      'Switching on Auto-advance for invoices in Stripe: drafts would be sent without Daniel’s yes.',
      'Pointing a flow’s email at office@ instead of Daniel’s own address.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach Ruth on Telegram: a Make or Zapier failure with a link to its run, an RB-01 failure with the workflow and the step that failed.',
    logs: 'Every failed run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message, holding the step and the error and never a client’s data. Every time entry keeps its invoice, and every matter its last notice.',
  },
  footer: { note: 'A worked example. Riverdale & Brooks is a fictional law practice, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
