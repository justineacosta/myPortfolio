/**
 * Range Physical Therapy’s Automation case page (spec 2026-10-05 per-site
 * pages): the three flows behind a booked evaluation, a paid visit’s superbill
 * and the six-visit plan. Clinical content never enters any of them: they
 * carry scheduling and billing data only. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/range-physical-therapy/automation.html. Only type imports, so
 * Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/range-physical-therapy.html'

const automation: Automations = {
  title: 'Range Physical Therapy · Automation',
  description: 'The three flows behind Range Physical Therapy’s evaluation bookings, its superbill after each visit and its six-visit plan, on n8n, Make and Zapier: what runs, in what order, and where Dr. Mara Ellison steps in. They carry scheduling and billing data only.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · RANGE PHYSICAL THERAPY',
  heading: 'What happens after someone books an evaluation at Range',
  lede: 'Range’s site has no form. It has buttons: Schedule your evaluation and Reserve open Mara’s Cal.com calendar, and Start a plan opens Stripe. It also makes promises a flow has to keep: Mara will be in touch before your visit, a superbill comes after each visit, and the six-visit plan is used within four months. One rule sits above all three flows: clinical content never enters them, or Claude, HubSpot or Airtable. They carry scheduling and billing data only, and clinical notes stay in Mara’s own notes system. Mara approves anything Claude drafts for a patient’s inbox, and none of these flows uses Claude at all: every email is a fixed template. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Range Physical Therapy, a fictional clinic used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'RP-01',
      title: 'Evaluation booking',
      site: 'Range Physical Therapy',
      href: SITE,
      platform: 'n8n',
      outcome: 'Every new evaluation is met with the intake and what-to-wear email within a minute, and Mara knows who is coming and when, so she can be in touch before the visit, as the site promises.',
      nodes: [
        node('rp-book', 'trigger', 'Evaluation booked', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Starts when someone books an Initial evaluation in Mara’s Cal.com calendar, from Schedule your evaluation or Reserve on the site. A follow-up or a free 15-minute call is let go at once.', ['Name', 'Email', 'Phone', 'Date of birth', 'The time booked'], 'The site has no form. Booking is the first thing a new patient does, so the flow starts there, with what a calendar and a superbill need and nothing about why they are coming.'),
        node('rp-keep', 'action', 'Keep scheduling only', 'Edit Fields', 'Funnel', ['n8n'], 'Keeps the name, email, phone, date of birth and the time booked, and drops everything else in the booking before any step stores or sends it.', ['The whole Cal.com booking'], 'Clinical content never enters a flow. The booking page asks nothing clinical, and this step makes sure that, whatever Cal.com sends, only scheduling fields go on.'),
        node('rp-save', 'action', 'Save the patient', 'Airtable', 'AddressBook', ['airtable'], 'Adds the patient to Patients, or updates their row if this email has booked before, with the time of the evaluation.', ['Name', 'Email', 'Phone', 'Date of birth', 'The time booked'], 'One row per patient, holding scheduling and billing fields only, so the superbill and plan flows can find them later.'),
        node('rp-intake', 'action', 'Send the intake email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template: the time and a link to move it, 1942 Pearl Street, Suite 200, where to park, what to wear and bring, the $215 price, paid at the end of the visit, HSA and FSA cards, and that Mara will be in touch before the visit. It asks no health questions.', ['Name', 'Email', 'The time booked', 'The reschedule link'], 'A templated email sends on its own and needs no one’s yes. Mara takes each patient’s history in person, at the start of the visit, so the email has nothing clinical to ask.'),
        node('rp-tell', 'action', 'Tell Mara', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages Mara the patient’s name, phone and evaluation time on Telegram, with sound if the visit is within a day.', ['Name', 'Phone', 'The time booked'], 'The site promises Mara will be in touch before the visit, and she can only keep that if she knows it is booked.'),
        node('rp-touch', 'wait', 'Mara gets in touch', 'By phone or text', 'Phone', [], 'Mara calls or texts the patient herself before the visit. Anything clinical they tell her goes into her own notes system, never into Airtable or a flow.', ['Name', 'Phone', 'The time booked'], 'She answers email and texts herself. The flow only makes sure she knows who to call, and when.'),
      ],
      edges: [
        edge('rp-book', 'rp-keep'),
        edge('rp-keep', 'rp-save'),
        edge('rp-save', 'rp-intake'),
        edge('rp-intake', 'rp-tell'),
        edge('rp-tell', 'rp-touch'),
      ],
    },
    {
      code: 'RP-02',
      title: 'Superbill per visit',
      site: 'Range Physical Therapy',
      href: SITE,
      platform: 'make',
      outcome: 'Every visit, paid by card or from a plan, has its superbill waiting in Range’s Gmail drafts within 15 minutes, every billing line filled in, so Mara only adds the codes from her notes and sends it.',
      nodes: [
        node('rp-plan', 'trigger', 'Plan visit logged', 'By Mara, in Airtable', 'ListChecks', ['airtable'], 'At the end of a visit paid from a six-visit plan, Mara logs it on the plan in Visits: the patient, the date, a follow-up paid by plan, at $170.', ['The patient', 'The plan', 'The date of the visit'], 'A plan visit was paid for up front, so no payment marks it. Mara’s line is the visit, and it also counts the plan down for RP-03.'),
        node('rp-paid', 'trigger', 'Visit paid', 'Stripe', 'CreditCard', ['stripe'], 'At the end of the visit, Mara opens the visit’s Stripe Payment Link for the patient, by hand, and they pay on Stripe’s page: $215 for an initial evaluation or $185 for a follow-up, HSA and FSA cards included. The payment starts the flow.', ['Which visit: evaluation or follow-up', 'Amount paid', 'Name and email', 'Billing address', 'Date paid'], 'The site promises a superbill after each visit, and a paid visit is the moment one is due. Stripe knows the price and the date, and nothing clinical.'),
        node('rp-find', 'action', 'Find the patient', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Looks the payment’s email up in Patients.', ['Email', 'The Patients table'], 'The superbill names the patient and their date of birth, which live on their row.'),
        node('rp-match', 'branch', 'On file?', 'Router', 'ArrowsSplit', [], 'Sends a payment that matches a patient on to be logged, and one from an email on no patient’s row to Mara.', ['The patient, if one was found'], 'A card is sometimes paid with another email, and a superbill must name the person treated.'),
        node('rp-log', 'action', 'Log the visit', 'Airtable', 'Table', ['airtable'], 'Adds the visit to Visits: the patient, evaluation or follow-up, the date, the fee and the amount paid, paid by card. It keeps the billing address Stripe took on the patient’s row.', ['The patient', 'Which visit', 'Amount paid', 'Date paid', 'Billing address'], 'One row per visit, with no field for codes or notes, so a superbill can be built from billing data alone.'),
        node('rp-ask', 'action', 'Ask Mara to match it', 'Airtable + Telegram', 'Question', ['airtable', 'telegram'], 'Logs the visit without a patient and asks Mara on Telegram to link the right one. Once she has, the superbill follows.', ['The visit', 'The payer’s name and email'], 'Guessing would put one person’s visit on another person’s superbill. Mara knows who she saw.'),
        node('rp-draft', 'action', 'Draft the superbill', 'Gmail + Airtable', 'Receipt', ['gmail', 'airtable'], 'Writes the superbill as a Gmail draft to the patient from a fixed template: Range’s address, Mara’s credentials, NPI and tax ID, the patient’s name, date of birth and address, the date of service, the visit, the fee and the amount paid. The lines for procedure and diagnosis codes are left blank, and the visit is marked Drafted.', ['The visit', 'The patient’s name, email, date of birth and address'], 'The template fills every billing line, from billing data only. No flow knows the codes, so no flow can put them in.'),
        node('rp-codes', 'wait', 'Mara adds the codes', 'From her notes system', 'Notebook', [], 'Mara opens the draft, types the procedure and diagnosis codes from her own notes system into the superbill, and sends it to the patient herself.', ['Her notes system, which no flow reads', 'The superbill draft'], 'The codes say what was treated and why, so they are clinical. They go from Mara’s notes to the patient by her hand, and never pass through Make, Airtable or any other tool.'),
      ],
      edges: [
        edge('rp-paid', 'rp-find'),
        edge('rp-find', 'rp-match'),
        edge('rp-match', 'rp-log', 'On file'),
        edge('rp-match', 'rp-ask', 'No match'),
        edge('rp-log', 'rp-draft'),
        edge('rp-ask', 'rp-draft'),
        edge('rp-plan', 'rp-draft'),
        edge('rp-draft', 'rp-codes'),
      ],
    },
    {
      code: 'RP-03',
      title: 'Six-visit plan',
      site: 'Range Physical Therapy',
      href: SITE,
      platform: 'zapier',
      outcome: 'Every plan opens the moment it is paid, with its expiry date in writing, and its holder is reminded when one or two visits remain and again three weeks before the four months are up.',
      nodes: [
        node('rp-bought', 'trigger', 'Plan bought', 'Stripe', 'CreditCard', ['stripe'], 'Starts when someone pays $1,020 for the six-visit plan on Stripe, from Start a plan on the site.', ['Name and email', 'Amount paid', 'Date paid'], 'The patient buys the plan themselves, at the published price, on Stripe’s own page. That payment is the plan’s start.'),
        node('rp-open', 'action', 'Open the plan', 'Airtable', 'Ticket', ['airtable'], 'Adds the plan to Plans: the buyer, the date, six visits, and an expiry four months on. Visits left counts down as Mara logs plan visits.', ['Name and email', 'Date paid', 'The Patients table'], 'Everything the reminders need, the visits left and the expiry date, is worked out in this one row.'),
        node('rp-welcome', 'action', 'Send the plan welcome', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed welcome: six follow-up visits at $170 each, used by the expiry date, shareable with someone in their household, first pick of appointment times, the link to book a follow-up, free changes up to 24 hours ahead, and that every plan starts with an Initial evaluation.', ['Name and email', 'The expiry date', 'The follow-up booking link'], 'A templated welcome sends on its own, and puts the expiry date in writing on day one.'),
        node('rp-ptell', 'action', 'Tell Mara', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages Mara on Telegram who bought a plan, and when it expires.', ['Name', 'The expiry date'], 'Plan holders get first pick of appointment times, so Mara needs to know who they are.'),
        node('rp-morning', 'wait', 'Each morning', 'Schedule by Zapier', 'SunHorizon', ['zapier'], 'Every morning, two more Zaps, each on its own, look over the open plans: at 7 for plans down to two visits, and at 7:15 for plans three weeks from their expiry. Neither waits for the other.', ['The Plans table', 'Visits left', 'The expiry date'], 'Both reminders turn on slow things, a visit logged or a date drawing near, so a morning check is enough.'),
        node('rp-two', 'action', 'Two-left reminder', 'Its own Zap, at 7:00', 'Bell', ['gmail', 'airtable'], 'At 7, in its own Zap, emails each plan down to one or two visits a fixed reminder: how many visits are left, the date they are good until and the link to book. Notes it on the plan, so it goes once.', ['Name and email', 'Visits left', 'The expiry date', 'Reminders already sent'], 'The site sells six visits used within four months. This reminder gives time to book the last two visits, and recommends nothing: whether more visits would help is a conversation with Mara.'),
        node('rp-expiry', 'action', 'Expiry reminder', 'Its own Zap, at 7:15', 'CalendarX', ['gmail', 'airtable'], 'At 7:15, in a Zap of its own, emails each plan three weeks from its expiry, with visits left, a fixed reminder: the expiry date, the visits left and the link to book. Notes it on the plan, so it goes once.', ['Name and email', 'Visits left', 'The expiry date', 'Reminders already sent'], 'Three weeks is enough to fit in the visits left before the plan ends.'),
      ],
      edges: [
        edge('rp-bought', 'rp-open'),
        edge('rp-open', 'rp-welcome'),
        edge('rp-welcome', 'rp-ptell'),
        edge('rp-ptell', 'rp-morning'),
        edge('rp-morning', 'rp-two'),
        edge('rp-two', 'rp-expiry', 'A separate Zap'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
