/**
 * Range Physical Therapy’s Build plan case page (spec 2026-10-05 per-site
 * pages): the blueprint behind the three flows on its Automation page, RP-01 on
 * n8n, RP-02 on Make and RP-03 on Zapier, with the helpers, data, tests and
 * handover they need. Every table holds scheduling and billing fields only.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/range-physical-therapy/build-plan.html. Only type imports, so
 * Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The clinical rule, first in every flow’s watch-outs. */
const RULE = 'The clinical rule: clinical content never enters an automation, Claude, HubSpot or Airtable. This flow carries scheduling and billing data only, and clinical notes stay in Mara’s own notes system, which no flow reads or writes.'

const RP01: Workflow = {
  code: 'RP-01',
  title: 'Evaluation booking',
  platform: 'n8n',
  outcome: 'Every new evaluation is met with the intake and what-to-wear email within a minute, and Mara knows who is coming and when, so she can be in touch before the visit, as the site promises.',
  trigger: 'n8n’s Cal.com Trigger hears every new booking in Mara’s calendar; a Filter keeps the Initial evaluation.',
  exits: ['Intake sent, Mara told', 'Not an evaluation'],
  watch: [
    RULE,
    'Cal.com’s Initial evaluation page asks for a name, email, phone and date of birth, the last for superbills. Those are its only text questions: Additional notes is hidden and no other question is added. Cal.com has no date field, so date of birth is a short text answer, used only as a date of birth.',
    'Keep scheduling only has Include Other Input Fields off, so anything else Cal.com sends stops there. RP-01’s settings save no executions, successful, failed or manual, so n8n keeps no copy of a booking, even of a run that fails.',
    'Cal.com’s trigger fires for every event type. The Filter keeps the Initial evaluation and lets a follow-up or a free 15-minute call go quietly; those get Cal.com’s own confirmation.',
    'The intake email is a fixed template, so it sends on its own. It asks no health questions: Mara takes the history in person, at the start of the visit. Cal.com’s own confirmation for the evaluation is turned off, or replaced by it, so the patient reads one email.',
    'Save the patient is a Create or update matched on email, so a second booking from the same email updates the same row. There is no search, so nothing can come back empty and end the run.',
    'If a step fails, RP-H02 tells Mara which step failed. The run itself is not saved, so she finds the booking in her Cal.com calendar and sends the intake email herself.',
  ],
  nodes: [
    node('a1', 'trigger', 'Booking created', 'Cal.com Trigger', 'CalendarCheck', ['cal-com'], 'n8n · Cal.com Trigger', [['Events', 'Booking Created'], ['Hears', 'every event type in Mara’s calendar']], 'Someone books a time in Mara’s Cal.com calendar, from Schedule your evaluation, Reserve or another button, and the booking arrives here.'),
    node('a2', 'action', 'Evaluations only', 'Filter', 'GitBranch', ['n8n'], 'n8n · Filter', [['Keeps', 'event type is Initial evaluation'], ['Drops', 'a follow-up or a free call, quietly']], 'Keeps the booking only if it is an Initial evaluation. Anything else ends here, with nothing saved or sent.'),
    node('a3', 'action', 'Keep scheduling only', 'Edit Fields', 'ShieldCheck', ['n8n'], 'n8n · Edit Fields (Set)', [['Keeps', 'name, email, phone, date of birth, start time, booking ID, reschedule link'], ['Include Other Input Fields', 'Off, so nothing else goes on'], ['Email', 'trimmed and lowercased']], 'Keeps the scheduling fields and drops the rest of the booking, so nothing else reaches Airtable, Gmail or Telegram.'),
    node('a4', 'action', 'Save the patient', 'Airtable', 'Database', ['airtable'], 'n8n · Airtable › Create or update', [['Table', 'Patients'], ['Match on', 'Email'], ['Sets', 'Name, Phone, Date of birth, Evaluation at']], 'Adds the patient to Patients, or updates their row if this email has booked before, with the time of the evaluation.'),
    node('a5', 'action', 'Send the intake email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'RP · Gmail (n8n), signed in as hello@rangept.co'], ['Template', 'Before your evaluation'], ['Holds', 'the time and a link to move it, 1942 Pearl Street, Suite 200, parking on 19th Street, what to wear and bring, $215 paid at the end of the visit, HSA and FSA, a superbill after each visit, free changes up to 24 hours ahead'], ['Asks', 'nothing about health'], ['Written by', 'a fixed template, not Claude']], 'Emails the patient what to expect at the first visit, where to come, what to wear and bring, the price, and that Mara will be in touch before the visit.'),
    node('a6', 'helper', 'Tell Mara', 'RP-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'RP-H01 · Alert Mara'], ['Says', 'the name, phone and evaluation time'], ['Urgent', 'yes, if the visit is within 24 hours'], ['Wait for it', 'No']], 'Sends Mara the patient’s name, phone and evaluation time on Telegram, with sound if the visit is within a day.'),
    node('a7', 'end', 'Mara gets in touch', 'By hand', 'PencilSimple', [], 'Mara, by hand · not an n8n step', [['Who', 'Mara'], ['How', 'a call or a text, before the visit'], ['Anything clinical', 'into her notes system, never Airtable']], 'Mara calls or texts the patient herself before the visit. What they tell her goes into her own notes system.'),
  ],
  edges: [edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'), edge('a5', 'a6'), edge('a6', 'a7')],
}

const RP02: Workflow = {
  code: 'RP-02',
  title: 'Superbill per visit',
  platform: 'make',
  outcome: 'Every visit, paid by card or from a plan, has its superbill waiting in Range’s Gmail drafts within 15 minutes, every billing line filled in, so Mara only adds the codes from her notes and sends it.',
  trigger: 'Make’s Stripe module hears a visit paid at checkout. Airtable’s Watch Records, every 15 minutes, starts the second scenario for any visit row that is ready.',
  exits: ['Drafted, Mara adds the codes', 'No match, with Mara'],
  watch: [
    RULE,
    'No procedure code, diagnosis code, symptom or treatment note enters RP-02, Airtable or Stripe. Visits has no field for them, the Superbill template leaves two blank lines for them, and Make never opens a draft again once it is made.',
    'Mara adds the codes in the superbill itself: she reads them in her notes system, types them into the Gmail draft and sends it. No tool reads her notes system and no flow reads the sent superbill, so the codes reach the patient by her hand alone.',
    'The superbill goes out when Mara sends it, not when Make drafts it. Her Gmail Drafts folder is the queue of superbills waiting for codes.',
    'Make gives a scenario one trigger, so RP-02 is two scenarios in one folder: RP-02 · Superbill per visit · paid logs a Stripe payment as a visit, and RP-02 · Superbill per visit · draft watches Visits for any row that is ready, paid by card or from a plan. The Automation page draws them as one flow.',
    'Payment is taken at checkout, after the visit. Mara opens the visit’s Stripe Payment Link for the patient, by hand, Initial evaluation at $215 or Follow-up visit at $185, and they pay on Stripe’s page. No flow sends the link. The Six-visit plan link belongs to RP-03, and the filter after the trigger lets it go.',
    'Find the patient is Airtable’s Make an API call, not Search Records, so it always returns one bundle with a list, and the router reads the list’s length. A search that found no one would end the route and lose the payment.',
    'Stripe can send an event twice. Log the visit is an upsert merged on the Stripe payment, so a repeat updates the same row, and a visit already Drafted is never drafted again.',
    'A plan visit has no payment. Mara logs it on the plan in Visits, and Fee is a formula: $215, $185, or $170 for a plan visit.',
    'Every module that writes has an error route that posts the step and the error, never the visit, to /rp/failed, and ends in Break, so Make keeps the run to retry.',
  ],
  nodes: [
    node('b8', 'trigger', 'Plan visit logged', 'By Mara, in Airtable', 'PencilSimple', ['airtable'], 'Mara, by hand · not a Make step', [['Table', 'Visits'], ['Sets', 'Patient, Type = Follow-up, Date of service, Paid by = Plan, Plan'], ['Fee', '$170, from the formula']], 'At the end of a visit paid from a six-visit plan, Mara logs it on the plan, for whoever in the household she saw.'),
    node('b1', 'trigger', 'Visit paid', 'Stripe', 'CreditCard', ['stripe'], 'Make · Stripe › Watch Events', [['Scenario', 'RP-02 · Superbill per visit · paid'], ['Link handed over', 'by Mara, at the end of the visit'], ['Events', 'checkout.session.completed'], ['Filter after it', 'Payment link is Initial evaluation or Follow-up visit']], 'At the end of the visit Mara opens its Payment Link for the patient, who pays $215 or $185 on Stripe, and the first scenario starts with the payment.'),
    node('b2', 'action', 'Find the patient', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'GET /v0/{base}/Patients'], ['Formula', 'LOWER(Email) is the checkout’s email'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Looks the payment’s email up in Patients.'),
    node('b3', 'branch', 'On file?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['On file', 'the list has a record'], ['No match', 'the list is empty']], 'Sends a payment that matches a patient on to be logged, and one that matches no one to Mara.'),
    node('b4', 'action', 'Save the address', 'Airtable', 'Database', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Patients'], ['Record', 'the patient found'], ['Sets', 'Billing address, from the checkout']], 'Keeps the billing address Stripe took on the patient’s row, for the superbill.'),
    node('b5', 'action', 'Log the visit', 'Airtable API call', 'Table', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'PATCH /v0/{base}/Visits, performUpsert'], ['Merge on', 'Stripe payment'], ['Sets', 'Patient, Type, Date of service, Amount paid, Paid by = Card, Stripe payment']], 'Adds the visit to Visits, linked to the patient, or updates it if Stripe sent the payment twice.'),
    node('b6', 'action', 'Log it unmatched', 'Airtable API call', 'Table', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'PATCH /v0/{base}/Visits, performUpsert'], ['Merge on', 'Stripe payment'], ['Sets', 'Type, Date of service, Amount paid, Paid by = Card, Payer name, Payer email'], ['Patient', 'left empty, for Mara']], 'Adds the visit with no patient, and the payer’s name and email, so nothing is lost.'),
    node('b7', 'action', 'Ask Mara to match', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Mara’s own'], ['Says', 'a payment from an email on no patient’s row, the payer’s name, a link to the visit']], 'Asks Mara to link the visit to the patient she saw. Once she has, the visit is ready and the second scenario drafts its superbill.'),
    node('b9', 'wait', 'Visit ready', 'Airtable', 'HourglassMedium', ['airtable'], 'Make · Airtable › Watch Records', [['Scenario', 'RP-02 · Superbill per visit · draft'], ['Table', 'Visits'], ['Trigger field', 'Ready changed'], ['Formula', 'Ready is 1, and Superbill is empty'], ['Schedule', 'every 15 minutes']], 'Make checks Visits every quarter of an hour and picks up each visit that has a patient, a type, a date and how it was paid, and no superbill yet.'),
    node('b10', 'action', 'Draft the superbill', 'Gmail', 'Receipt', ['gmail'], 'Make · Gmail › Create a draft', [['Connection', 'RP · Gmail (Make), signed in as hello@rangept.co'], ['To', 'the patient’s email'], ['Template', 'Superbill'], ['Holds', 'Range Physical Therapy, PLLC, 1942 Pearl Street, Suite 200, Boulder, CO 80302; Dr. Mara Ellison, PT, DPT, OCS, CSCS, her NPI and the tax ID; the patient’s name, date of birth and address; the date of service, the visit, 60 minutes; the fee, the amount paid and how'], ['Code lines', 'Procedure codes and Diagnosis codes, both blank'], ['Written by', 'a fixed template, not Claude']], 'Writes the superbill as a draft in Range’s Gmail, addressed to the patient, with every billing line filled and the two code lines left blank.'),
    node('b11', 'action', 'Mark it drafted', 'Airtable', 'FlagCheckered', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Visits'], ['Sets', 'Superbill = Drafted, Drafted at']], 'Marks the visit Drafted, so it is never drafted twice.'),
    node('b12', 'end', 'Mara adds the codes', 'From her notes system', 'PencilSimple', [], 'Mara, by hand · not a Make step', [['Who', 'Mara'], ['Reads', 'the procedure and diagnosis codes, in her notes system'], ['Types them', 'into the draft, in Gmail'], ['Then', 'she sends it to the patient']], 'Mara opens the draft, adds the codes from her notes and sends the superbill herself. Make never sees it again.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'),
    edge('b3', 'b4', 'On file'), edge('b4', 'b5'), edge('b5', 'b9'),
    edge('b3', 'b6', 'No match'), edge('b6', 'b7'), edge('b7', 'b9'),
    edge('b8', 'b9'),
    edge('b9', 'b10'), edge('b10', 'b11'), edge('b11', 'b12'),
  ],
}

const RP03: Workflow = {
  code: 'RP-03',
  title: 'Six-visit plan',
  platform: 'zapier',
  outcome: 'Every plan opens the moment it is paid, with its expiry date in writing, and its holder is reminded when two visits remain and again three weeks before the four months are up.',
  trigger: 'Stripe’s Checkout Session Completed starts the first Zap; Schedule by Zapier starts the two reminder Zaps every morning, at 7 and 7:15 Mountain time.',
  exits: ['Plan open, Mara told', 'Reminded', 'Nothing due'],
  watch: [
    RULE,
    'Plans holds a buyer, dates, a count and two reminder dates, and no clinical field. The reminders say how many visits are left and until when, never whether more visits would help: that is a clinical question, for Mara on a call or at a visit.',
    'The patient buys the plan themselves, at the published $1,020, on Stripe’s own page. No flow refunds, extends or ends a plan early: any such change is Mara’s, made by hand in Stripe and on the plan’s row.',
    'A Zap has one trigger, so RP-03 is three Zaps: RP-03 · Six-visit plan · bought, · two left and · expiring. The Automation page draws the two morning Zaps one after the other, as they run, two left at 7 and expiring at 7:15, with the connector between them marked A separate Zap: neither waits for or depends on the other. A plan can get both on the same morning; each says something different.',
    'Visits left counts the plan visits Mara logs in Visits. A visit she has not logged yet is not counted, so a reminder can come late, never early.',
    'Expires is a formula, four months from Bought on, so the welcome, the reminders and the views always show the same date.',
    'The plan is shareable within a household. Mara logs a household member’s visit on the buyer’s plan, and its superbill names the person she saw.',
    'The welcome says every plan starts with an Initial evaluation, as the site does, so a plan bought first still begins there.',
    'Find Many Records stops the Zap when it finds nothing, so a morning with no plan due sends nothing.',
    'A failed step is caught by a Zapier Manager zap that posts it to /rp/failed.',
  ],
  nodes: [
    node('c1', 'trigger', 'Plan bought', 'Stripe', 'CreditCard', ['stripe'], 'Zapier · Stripe › Checkout Session Completed', [['Zap', 'RP-03 · Six-visit plan · bought'], ['Comes from', 'Start a plan, the Six-visit plan Payment Link, $1,020']], 'Someone pays for the six-visit plan on Stripe, and the first Zap starts with it.'),
    node('c2', 'action', 'Only the plan', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Payment link', 'is the Six-visit plan’s'], ['Otherwise', 'the Zap stops: a visit is RP-02’s']], 'Goes on only for the plan’s own Payment Link.'),
    node('c3', 'action', 'Find the buyer', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Record', [['Table', 'Patients'], ['Search formula', 'LOWER(Email) is the checkout’s email'], ['Nothing found', 'counted a success, so the plan still opens']], 'Looks the buyer up in Patients, so the plan can link to them.'),
    node('c4', 'action', 'Open the plan', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Create Record', [['Table', 'Plans'], ['Sets', 'Buyer, Buyer name, Buyer email, Bought on, Stripe payment'], ['Formulas', 'Expires, four months on; Visits left, from six; Status']], 'Adds the plan to Plans, with its expiry four months on and six visits left.'),
    node('c5', 'action', 'Send the plan welcome', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'RP · Gmail (Zapier), signed in as hello@rangept.co'], ['Template', 'Your six-visit plan'], ['Holds', 'six follow-ups at $170 each, the expiry date, shareable within a household, first pick of times, the booking link, free changes up to 24 hours ahead, every plan starts with an Initial evaluation'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer what the plan includes and the date it must be used by.'),
    node('c6', 'end', 'Tell Mara', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Mara’s own'], ['Says', 'the buyer, the expiry date, a link to the plan']], 'Tells Mara who bought a plan and when it expires. If the buyer was not on file, she links them by hand.'),
    node('c7', 'trigger', 'Each morning', 'Schedule', 'Clock', ['zapier'], 'Zapier · Schedule by Zapier › Every Day', [['Zap', 'RP-03 · Six-visit plan · two left'], ['Time', '7 am, Mountain time']], 'The second Zap wakes every morning at 7.'),
    node('c8', 'action', 'Find two-left plans', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Many Records (With Line Item Support)', [['Table', 'Plans'], ['View', 'Two visits left'], ['Returns', 'up to 100 plans, as line items'], ['Nothing found', 'the Zap stops']], 'Finds the Active plans with one or two visits left and no two-left reminder yet.'),
    node('c9', 'action', 'For each plan', 'Looping', 'ArrowsClockwise', ['zapier'], 'Zapier · Looping › Create loop from line items', [['Loops over', 'the plans found']], 'Runs the next two steps once for each plan.'),
    node('c10', 'action', 'Send the reminder', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'RP · Gmail (Zapier), signed in as hello@rangept.co'], ['Template', 'One or two visits left'], ['Holds', 'the visits left, the expiry date, the booking link'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer that one or two visits remain, the date they are good until and the link to book.'),
    node('c11', 'end', 'Note it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Plans'], ['Sets', 'Two-left sent = today']], 'Notes the reminder on the plan, so it goes once.'),
    node('c12', 'trigger', 'Each morning', 'Schedule', 'Clock', ['zapier'], 'Zapier · Schedule by Zapier › Every Day', [['Zap', 'RP-03 · Six-visit plan · expiring'], ['Time', '7:15 am, Mountain time']], 'The third Zap wakes every morning at 7:15.'),
    node('c13', 'action', 'Find expiring plans', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Many Records (With Line Item Support)', [['Table', 'Plans'], ['View', 'Expires in three weeks'], ['Returns', 'up to 100 plans, as line items'], ['Nothing found', 'the Zap stops']], 'Finds the Active plans that expire within 21 days, with visits left and no expiry reminder yet.'),
    node('c14', 'action', 'For each plan', 'Looping', 'ArrowsClockwise', ['zapier'], 'Zapier · Looping › Create loop from line items', [['Loops over', 'the plans found']], 'Runs the next two steps once for each plan.'),
    node('c15', 'action', 'Send the reminder', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'RP · Gmail (Zapier), signed in as hello@rangept.co'], ['Template', 'Three weeks to go'], ['Holds', 'the expiry date, the visits left, the booking link'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer the plan’s expiry date, three weeks away, with the visits left and the link to book.'),
    node('c16', 'end', 'Note it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Plans'], ['Sets', 'Expiry sent = today']], 'Notes the reminder on the plan, so it goes once.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'),
    edge('c7', 'c8'), edge('c8', 'c9'), edge('c9', 'c10'), edge('c10', 'c11'),
    edge('c12', 'c13'), edge('c13', 'c14'), edge('c14', 'c15'), edge('c15', 'c16'),
  ],
}

const H01: Workflow = {
  code: 'RP-H01',
  title: 'Alert Mara',
  platform: 'n8n',
  outcome: 'Every message n8n sends Mara reads the same way and lands in her Telegram chat.',
  trigger: 'Called by RP-01 and RP-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds a name, a phone, a time or a link, never anything clinical.',
    'A failure, or an evaluation within a day, arrives with sound; anything else arrives silently, so evenings stay quiet.',
    'RP-H02 is not set as RP-H01’s error workflow: a failure here would call RP-H02, which calls RP-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, urgent, link']], 'Another workflow hands over a message, and says whether it is urgent.'),
    node('h2', 'action', 'Add the link', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code and a link to the row or the run']], 'Puts the flow’s code and a link to the patient’s row or the failed run under the message.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Mara’s own'], ['Disable notification', 'on, unless urgent']], 'Posts it in Mara’s chat.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'RP-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed run, on any of the three platforms, is logged and reaches Mara with a link to it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A failed run’s row holds the platform, the flow, the step, the error and a link to the run, never the run’s data. RP-01 saves no executions, so its link only says which run failed; Make and Zapier keep theirs, which hold scheduling and billing data only.',
    'It never retries on its own. Mara, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers RP-01 only, not RP-H01: RP-H01 is how this workflow alerts Mara, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'RP-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'RP-01, as its error workflow']], 'Starts whenever RP-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /rp/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/rp/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, a Zapier Manager zap']], 'Starts when a Make error route or the Zapier Manager zap reports a failed step in RP-02 or RP-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, step, error, run link, time'], ['Include Other Input Fields', 'Off']], 'Puts both kinds of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert Mara', 'RP-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'RP-H01 · Alert Mara'], ['Urgent', 'yes']], 'Sends Mara an urgent Telegram message with a link to the failed run.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Range Physical Therapy · Build plan',
  description: 'A build plan for Range Physical Therapy, a cash-pay clinic on Pearl Street in Boulder: three flows on n8n, Make and Zapier that carry scheduling and billing data only, two helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'BUILD PLAN · RANGE PHYSICAL THERAPY',
  heading: 'Every booking, superbill and plan, planned before a single step is placed, and nothing clinical in any of them.',
  lede:
    'Three flows and two helpers for Range Physical Therapy, where Dr. Mara Ellison sees every patient one-on-one at 1942 Pearl Street, Suite 200, in Boulder. Evaluation bookings run on n8n, superbills on Make and the six-visit plan on Zapier. Cal.com holds the calendar, Stripe takes payment and Airtable holds patients, visits and plans, with scheduling and billing fields only. Clinical notes stay in Mara’s notes system, which no flow touches. Mara approves anything Claude drafts for a patient’s inbox, and these three flows use no Claude at all: every email is a fixed template. No refund or change to a plan happens without Mara.',
  meta: [
    ['Client', 'Range Physical Therapy, PLLC · Boulder, CO'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a patient’s story ends.',
    rail: [
      { heading: 'Why plan first', body: 'Range makes three promises a flow has to keep: Mara will be in touch before your visit, a superbill comes after each visit, and six plan visits are used within four months. One rule sits above them all: nothing clinical in any flow. This page pins all of it down before n8n, Make or Zapier is opened.' },
      { heading: 'The clinical rule', body: 'Clinical content never enters an automation, Claude, HubSpot or Airtable. The flows carry scheduling and billing data only. Clinical notes, and the codes on a superbill, stay with Mara and her notes system.' },
    ],
    outcome: 'Every evaluation booked gets its intake email and Mara knows of it, every visit’s superbill waits in Gmail with its billing lines filled for Mara to add the codes, and every six-visit plan opens when paid and reminds its holder twice, with nothing clinical in any flow.',
    trigger: 'Eight entry points: an Initial evaluation booked in Cal.com, a visit paid at checkout on Stripe, a visit row ready in Airtable, the plan paid on Stripe, a schedule each morning, RP-01 or RP-H02 calling RP-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Mara told', 'Superbill drafted', 'Plan open', 'Reminded'],
    outOfScope: [
      'Clinical notes, the written plan of care and anything a patient tells Mara: they stay in her notes system, which no flow reads or writes',
      'The procedure and diagnosis codes on a superbill, which Mara adds by hand',
      'Follow-up and free 15-minute call bookings, which get Cal.com’s own confirmation',
      'A cancellation inside 24 hours, the Clinic Q&A bot and the inbox, planned on the AI agents page',
      'Refunds and changes to a plan, which Mara makes by hand in Stripe',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, one clinician. When a run fails between two visits, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'RP-[number] · [Title]', examples: ['RP-01 · Evaluation booking', 'RP-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Scenarios and Zaps', pattern: 'RP-[number] · [Title] · [part]', examples: ['RP-02 · Superbill per visit · draft', 'RP-03 · Six-visit plan · expiring'], rule: 'A flow a platform has to split keeps one code, and the last word says which part.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Keep scheduling only', 'Draft the superbill', 'Open the plan'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/rp/[source]', examples: ['/rp/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'RP · [Service] ([platform])', examples: ['RP · Airtable (n8n)', 'RP · Gmail (Make)', 'RP · Stripe (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew.' },
      { name: 'Payment Links', pattern: '[What it pays for] · [price]', examples: ['Follow-up visit · $185', 'Six-visit plan · $1,020'], rule: 'The flows filter on each link’s ID; the name is what Mara sees in Stripe. Test and live links never share a name.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Patients', 'Visits', 'Plans'], rule: 'Flows read fields by name, never by position, and no table has a clinical field.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Three Airtable tables, scheduling and billing only, and two sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'Airtable holds what the flows need: patients, visits and plans. Cal.com holds the calendar, Stripe the payments, and Google Sheets only keeps logs. Mara’s notes system holds everything clinical, and no flow touches it.' },
      { heading: 'Scheduling and billing only', body: 'No table has a field for a reason for visit, a symptom, a diagnosis, a code or a note, and none is added later. The handover lists adding one as a break.' },
    ],
    tables: [
      { name: 'Patients', fields: ['Name', 'Email', 'Phone', 'Date of birth', 'Billing address', 'Evaluation at', 'Visits', 'Plans'], note: 'One row per patient, matched on email. Date of birth comes from the evaluation booking and Billing address from their first Stripe checkout, both for superbills.' },
      { name: 'Visits', fields: ['Patient', 'Type', 'Date of service', 'Paid by', 'Plan', 'Fee', 'Amount paid', 'Stripe payment', 'Payer name', 'Payer email', 'Ready', 'Ready changed', 'Superbill', 'Drafted at'], note: 'One row per visit. Type is Initial evaluation or Follow-up; Paid by is Card or Plan; Superbill is empty or Drafted. Fee is a formula: $215, $185, or $170 for a plan visit, which is also its Amount paid. Ready is a formula: patient, type, date and paid-by all filled. Ready changed is a Last modified time field that watches those four.' },
      { name: 'Plans', fields: ['Buyer', 'Buyer name', 'Buyer email', 'Bought on', 'Expires', 'Visits used', 'Visits left', 'Status', 'Stripe payment', 'Two-left sent', 'Expiry sent'], note: 'One row per plan. Expires is Bought on plus four months; Visits used counts its plan visits in Visits, and Visits left is six less that. Status is a formula: Active, Used up or Expired. The Two visits left and Expires in three weeks views feed the morning Zaps.' },
    ],
    stages: [
      ['Booked', 'An Initial evaluation is in Mara’s calendar, the intake email sent and Mara told.'],
      ['Paid', 'A visit is logged in Visits, paid by card or from a plan.'],
      ['Drafted', 'The superbill waits in Gmail, every billing line filled, for Mara’s codes.'],
    ],
    exitStages: [
      ['No match', 'A payment from an email on no patient’s row, waiting for Mara to link it.'],
      ['Used up', 'A plan with no visits left.'],
      ['Expired', 'A plan past its four months.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier, with no patient data'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: Cal.com’s trigger on n8n, a Stripe event and a table watch on Make, a Stripe checkout and a schedule on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['Schedule your evaluation, or Reserve', 'Cal.com Trigger, Booking Created', 'RP-01'],
      ['A visit paid at checkout', 'Stripe Watch Events', 'RP-02'],
      ['A visit row ready, or a plan visit logged', 'Watch Records, every 15 min', 'RP-02'],
      ['Start a plan, paid', 'Stripe Checkout Session Completed', 'RP-03'],
      ['Every morning, 7 and 7:15 am', 'Schedule, every day, two Zaps', 'RP-03'],
      ['RP-01 or RP-H02', 'Execute Sub-workflow', 'RP-H01'],
      ['An n8n run fails', 'Error Trigger', 'RP-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /rp/failed', 'RP-H02'],
    ],
  },
  workflows: [RP01, RP02, RP03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message Mara with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test patients, Stripe test cards and a test calendar before anything reaches a real patient.' },
      { heading: 'Test data', body: 'Test patients have made-up names and dates of birth, and no test row ever uses a symptom or a diagnosis. Where a check needs text that must not get through, it uses a marker like TEST-NOTE-01.' },
    ],
    rows: [
      { id: 't01', workflow: 'RP-01', branch: 'Evaluation booked', input: 'Test Patient A books an Initial evaluation for next Wednesday, 7:00 am, with a new email', expected: 'A Patients row with the name, email, phone, date of birth and time; the intake email sent; Mara told quietly' },
      { id: 't02', workflow: 'RP-01', branch: 'Within a day', input: 'Test Patient B books tomorrow’s 7:00 am opening', expected: 'The same, and Mara’s alert comes with sound' },
      { id: 't03', workflow: 'RP-01', branch: 'Not an evaluation', input: 'A free 15-minute call and a follow-up booked', expected: 'The Filter lets both go; no row, no intake email' },
      { id: 't04', workflow: 'RP-01', branch: 'Booked before', input: 'Test Patient A books again, the email in capitals with a trailing space', expected: 'One row, updated; a fresh intake email' },
      { id: 't05', workflow: 'RP-01', branch: 'Nothing clinical', input: 'Open the live Initial evaluation page; then send a test booking with an extra notes field holding TEST-NOTE-01', expected: 'The page asks only for a name, email, phone and date of birth, with no notes box; TEST-NOTE-01 is in no row, email or Telegram message, and n8n has saved no execution' },
      { id: 't06', workflow: 'RP-01', branch: 'A step fails', input: 'A test run with the Airtable token revoked', expected: 'RP-H02 logs the failed step and alerts Mara; n8n saves no copy of the run, so she finds the booking in Cal.com and sends the intake by hand' },
      { id: 't07', workflow: 'RP-02', branch: 'Follow-up, on file', input: 'Follow-up visit link, $185, Stripe test card 4242 4242 4242 4242, Test Patient A’s email', expected: 'A Visits row: Follow-up, Card, $185; within 15 minutes a superbill draft with every billing line and both code lines blank; Superbill = Drafted' },
      { id: 't08', workflow: 'RP-02', branch: 'Evaluation, on file', input: 'Initial evaluation link, $215, a test card, Test Patient B’s email', expected: 'Initial evaluation and $215 on the draft; the billing address saved on Test Patient B’s row' },
      { id: 't09', workflow: 'RP-02', branch: 'No match', input: 'The Follow-up visit link paid with an email on no patient’s row', expected: 'A Visits row with no patient, and Mara asked on Telegram; once she links Test Patient A, the next check drafts the superbill' },
      { id: 't10', workflow: 'RP-02', branch: 'Replayed event', input: 'Resend the paid event from Stripe', expected: 'Still one Visits row and one draft' },
      { id: 't11', workflow: 'RP-02', branch: 'Plan visit', input: 'Mara logs a follow-up for Test Patient A, Paid by Plan, on a test plan', expected: 'A draft at $170, paid from the six-visit plan; the plan’s Visits left down by one' },
      { id: 't12', workflow: 'RP-02', branch: 'The plan’s link', input: 'The Six-visit plan link paid with a test card', expected: 'The filter after the trigger lets it go; no visit, no draft' },
      { id: 't13', workflow: 'RP-02', branch: 'Codes stay out', input: 'Mara adds TEST-CODE-1 and TEST-CODE-2 to a test draft and sends it', expected: 'The codes are in the sent email only: not in Airtable, Stripe or Make’s run history' },
      { id: 't14', workflow: 'RP-03', branch: 'Plan bought', input: 'Start a plan, $1,020, a test card, Test Patient A’s email', expected: 'A Plans row: six visits left, Expires four months on, Active; the plan welcome sent; Mara told' },
      { id: 't15', workflow: 'RP-03', branch: 'Buyer not on file', input: 'The plan bought with a new email', expected: 'The plan still opens, Buyer empty; Mara links the buyer by hand' },
      { id: 't16', workflow: 'RP-03', branch: 'Not the plan', input: 'The Follow-up visit link paid', expected: 'The Filter stops the Zap; no plan' },
      { id: 't17', workflow: 'RP-03', branch: 'Two visits left', input: 'Mara logs a test plan’s fourth visit', expected: 'Next morning, one two-left reminder; Two-left sent set' },
      { id: 't18', workflow: 'RP-03', branch: 'Already reminded', input: 'The morning after t17', expected: 'No second reminder' },
      { id: 't19', workflow: 'RP-03', branch: 'Three weeks to go', input: 'A test plan with Bought on set so it expires in 20 days, three visits left', expected: 'Next morning, one expiry reminder with the date; Expiry sent set' },
      { id: 't20', workflow: 'RP-03', branch: 'Used up', input: 'A test plan with no visits left, expiring in 20 days', expected: 'Status Used up; no expiry reminder' },
      { id: 't21', workflow: 'RP-03', branch: 'Shared in a household', input: 'Mara logs Test Patient B’s visit on Test Patient A’s plan', expected: 'The superbill goes to Test Patient B, and the plan counts the visit' },
      { id: 't22', workflow: 'RP-03', branch: 'Nothing due', input: 'A morning with no plan in either view', expected: 'Both morning Zaps stop at the search; no email' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order a patient meets them: the booking, the first paid visit, then a plan.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Airtable tables, Patients, Visits and Plans, with scheduling and billing fields only, and the Two visits left and Expires in three weeks views', 'Add the connections on each platform: RP · Airtable, RP · Gmail, RP · Telegram, RP · Cal.com, RP · Stripe (test)', 'Create the Sheets tabs: Failed runs, Test matrix', 'Build RP-H01 in n8n, then RP-H02 with RP-01 (not RP-H01) as the covered error workflow'] },
      { name: '2 · Bookings on n8n', tasks: ['Set up the Initial evaluation event type in Cal.com, 60 minutes: name, email, phone and date of birth, Additional notes hidden, and its own confirmation turned off, or replaced by the intake email', 'Build RP-01 with Save failed, Save successful and Save manual executions all set to Do not save', 'Point Schedule your evaluation and Reserve at the Initial evaluation page', 'Run tests t01–t06'] },
      { name: '3 · Superbills on Make', tasks: ['Create the Initial evaluation ($215) and Follow-up visit ($185) Payment Links in Stripe test mode, taking the billing address, and show Mara how to open the right one for a patient at the end of a visit', 'Write the Superbill template with Mara: Range’s address, her credentials, NPI and tax ID, and two blank code lines', 'Build both RP-02 scenarios, paid and draft, in one Make folder, every writing module with an error route to /rp/failed', 'Run tests t07–t13 with test patients and Stripe test cards'] },
      { name: '4 · Plans on Zapier', tasks: ['Create the Six-visit plan Payment Link ($1,020) in test mode and point Start a plan at it', 'Build the three RP-03 Zaps: bought, two left and expiring', 'Add the Zapier Manager zap that posts failures to /rp/failed', 'Run tests t14–t22'] },
      { name: '5 · Test and hand over', tasks: ['Switch to RP · Stripe (live) and the live Payment Links', 'Check the clinical rule with Mara: every table, template, view and log holds scheduling and billing data only', 'Run the whole matrix again with Mara', 'Walk Mara through the handover page, and turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Range keeps.',
    rail: [{ heading: 'Written for Mara', body: 'One page, no jargon, for the person who sees every patient. It lives next to the flows.' }],
    does: [
      'Sends every new evaluation the intake and what-to-wear email within a minute, and tells Mara who is coming and when.',
      'Logs every paid visit and drafts its superbill in Gmail, every billing line filled, for Mara to add the codes and send.',
      'Asks Mara to match a payment from an email on no patient’s row.',
      'Drafts a plan visit’s superbill at $170 once Mara logs the visit on the plan.',
      'Opens every six-visit plan the moment it is paid, and sends the welcome with its expiry date.',
      'Reminds a plan’s buyer when two visits remain, and three weeks before the plan expires.',
    ],
    breaks: [
      'Renaming a field in Patients, Visits or Plans, or changing the Type, Paid by or Superbill choices.',
      'Adding a clinical field to any table, or another question to a Cal.com booking page: either would let clinical content into a flow.',
      'Changing a price in Stripe without changing the Fee formula and the templates.',
      'Replacing a Payment Link without updating the filters in RP-02 and RP-03.',
      'Editing the Two visits left or Expires in three weeks views.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach Mara on Telegram with a link to the run.',
    logs: 'Every failed run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message, holding the step and the error and never a patient’s data. Every visit keeps whether its superbill was drafted, and every plan its visits left and the reminders sent.',
  },
  footer: { note: 'A worked example. Range Physical Therapy is a fictional clinic, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
