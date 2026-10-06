/**
 * Range Physical Therapy’s End-to-end case page (spec 2026-10-05 per-site
 * pages): Range’s whole system as one graph of nine lanes, from a booked
 * evaluation, a visitor’s question and an email to the visit, the superbill,
 * the six-visit plan and a late cancellation. It tells the same story as
 * Range’s Automation, Build plan and AI agents pages, and nothing clinical
 * enters any automated step. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/range-physical-therapy/end-to-end.html. Only
 * type imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

const LANES: Lane[] = [
  { id: 'A', name: 'Patients and visitors', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'Buttons, no form.' },
  { id: 'C', name: 'Evaluation (RP-01)', note: 'n8n. A template replies.' },
  { id: 'D', name: 'Clinic Q&A bot', note: 'Answers from the site.' },
  { id: 'E', name: 'The visit', note: 'Mara, by hand.' },
  { id: 'F', name: 'Superbill (RP-02)', note: 'Make. Mara adds the codes.' },
  { id: 'G', name: 'Six-visit plan (RP-03)', note: 'Zapier. Templates remind.' },
  { id: 'H', name: 'Inbox triage agent', note: 'Clinical email, untouched.' },
  { id: 'I', name: 'Reschedule agent', note: 'Waits for Mara’s yes.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Someone books', 'Schedule, or Reserve', 'UserPlus', 'Someone presses Schedule your evaluation or Reserve and books an Initial evaluation in Mara’s calendar. Booking takes about two minutes.'),
  step('a2', 'A', [1, 0], 'trigger', 'A visitor asks', 'Day or night', 'ChatCircleText', 'A visitor opens the chat on Range’s site with a practical question, like whether they need a referral or can use their HSA card.'),
  step('a4', 'A', [2, 0], 'trigger', 'Someone buys a plan', 'Six visits, $1,020', 'Ticket', 'A patient who wants six follow-ups presses Start a plan on the site, usually after the evaluation, since every plan starts with one.'),
  step('a3', 'A', [3, 0], 'trigger', 'Someone emails', 'hello@rangept.co', 'EnvelopeSimple', 'A patient or a visitor writes to hello@rangept.co: a superbill question, a visit to move, or something clinical, meant for Mara.'),

  step('b1', 'B', [0, 0], 'step', 'Mara’s calendar', 'Cal.com, 60 minutes', 'CalendarCheck', 'The Initial evaluation page asks for a name, an email, a phone and a date of birth, and nothing about health. Cal.com tells n8n the moment it is booked.', ['cal-com']),
  step('b3', 'B', [2, 0], 'step', 'Start a plan', 'Stripe’s own page', 'CreditCard', 'The Start a plan button opens Stripe’s page for the six-visit plan at $1,020, where the patient pays with their own card.', ['stripe']),
  step('b2', 'B', [1, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat on every page of Range’s site. It answers live from the site’s public pages, keeps no transcript and never sends an email.'),

  step('c1', 'C', [0, 0], 'decision', 'An evaluation?', 'Cal.com Trigger', 'ArrowsSplit', 'n8n hears every booking in Mara’s calendar and keeps the Initial evaluation. It saves no execution, so n8n keeps no copy of any booking.', ['n8n', 'cal-com'], true),
  step('c2', 'C', [1, 0], 'step', 'Keep scheduling only', 'Edit Fields', 'Funnel', 'Keeps the name, email, phone, date of birth and time, and drops everything else in the booking before any step stores or sends it.', ['n8n']),
  step('c3', 'C', [2, 0], 'step', 'Save the patient', 'Patients, Airtable', 'AddressBook', 'Adds the patient to Patients, or updates their row if this email has booked before. Scheduling and billing fields only.', ['airtable']),
  step('c4', 'C', [3, 0], 'step', 'Send the intake email', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude: the time, 1942 Pearl Street, Suite 200, parking, what to wear and bring, and $215 paid after the visit. It asks nothing about health.', ['gmail'], true),
  step('c5', 'C', [4, 0], 'step', 'Tell Mara', 'Telegram', 'PaperPlaneTilt', 'Mara gets the patient’s name, phone and evaluation time on Telegram, with sound if the visit is within a day.', ['telegram']),
  step('c6', 'C', [5, 0], 'step', 'Mara gets in touch', 'By phone or text', 'Phone', 'Mara calls or texts the patient herself before the visit, as the site promises. Anything clinical they tell her goes into her notes system.'),
  step('c7', 'C', [1, 1], 'end', 'Let go quietly', 'Cal.com confirms it', 'CheckCircle', 'A follow-up or a free 15-minute call ends here, with nothing saved or sent by n8n. Cal.com’s own confirmation covers it.'),

  step('d1', 'D', [0, 0], 'step', 'Search the pages', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against Range’s public, non-clinical pages: the pricing, the visit details and the FAQ’s practical answers.', ['supabase']),
  step('d2', 'D', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a price or a date the pages do not hold, or clinical advice.', ['claude']),
  step('d3', 'D', [2, 0], 'decision', 'Sure, not clinical?', 'A page settles it', 'Question', 'Did a page hold the answer? Any symptom, pain or question about treatment counts as no, and so does anything the pages do not say. The bot never guesses.'),
  step('d4', 'D', [3, 0], 'end', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes back in the chat with its page, and a live answer needs no yes. If they want to start, the bot opens the same Cal.com evaluation page.'),
  step('d7', 'D', [3, 1], 'decision', 'An emergency?', 'Before any call', 'Siren', 'Before any call is offered, the bot checks for an emergency, so 911 comes first. It gives no advice either way.'),
  step('d5', 'D', [4, 2], 'end', 'Free 15-minute call', 'Anything clinical', 'PhoneCall', 'No advice: the bot offers the free 15-minute call with Mara on Cal.com, or her phone and email to reach her themselves. It forwards nothing.', ['cal-com']),
  step('d6', 'D', [4, 1], 'end', 'Call 911', 'The site’s own words', 'Phone', 'In the site’s own words: if you think you are having a medical emergency, call 911. Shown before any call is offered, with no advice.'),

  step('e1', 'E', [0, 0], 'step', 'Each visit', '60 min, one-on-one', 'HandHeart', 'Sixty minutes, one-on-one with Mara: an evaluation first, then follow-ups. She takes the history in person, at the start of the first visit.'),
  step('e2', 'E', [1, 0], 'step', 'Notes, by hand', 'Her notes system', 'Notebook', 'Mara writes her notes, the plan of care and the codes in her own clinic notes system. No flow, agent or Claude reads or writes it.'),
  step('e3', 'E', [2, 0], 'decision', 'From a plan?', 'How it is paid', 'ArrowsSplit', 'A follow-up can be paid from a six-visit plan. An evaluation, or any visit without a plan, is paid by card at the end of the visit.'),
  step('e4', 'E', [4, 0], 'step', 'Hand over the link', 'Stripe, by hand', 'CreditCard', 'At the end of the visit Mara opens its Stripe Payment Link for the patient: $215 or $185, HSA and FSA cards accepted. No flow sends it.', ['stripe']),
  step('e5', 'E', [3, 1], 'step', 'Log the plan visit', 'Visits, Airtable', 'ListChecks', 'Mara logs a plan visit on the plan in Airtable, for whoever in the household she saw. It counts the plan down and starts the superbill.', ['airtable']),

  step('f1', 'F', [0, 0], 'trigger', 'Visit paid', 'Stripe Checkout', 'CreditCard', 'Make hears the payment the moment the patient pays on Stripe’s page. Stripe knows the price and the date, and nothing clinical.', ['make', 'stripe'], true),
  step('f2', 'F', [1, 0], 'step', 'Find the patient', 'Airtable API call', 'MagnifyingGlass', 'Looks the payment’s email up in Patients, with a call that always returns a list, even an empty one.', ['airtable']),
  step('f3', 'F', [2, 0], 'decision', 'On file?', 'Matched on email', 'ArrowsSplit', 'A payment that matches a patient goes on to be logged. One from an email on no patient’s row goes to Mara.'),
  step('f4', 'F', [3, 0], 'step', 'Log the visit', 'Visits, Airtable', 'Table', 'The visit is logged in Visits: the patient, evaluation or follow-up, the date, the fee and the amount paid. There is no field for codes or notes.', ['airtable']),
  step('f5', 'F', [4, 0], 'step', 'Draft the superbill', 'A fixed template', 'Receipt', 'Within 15 minutes, a Gmail draft to the patient: every billing line filled from billing data, the procedure and diagnosis code lines left blank. No Claude.', ['gmail'], true),
  step('f6', 'F', [3, 1], 'step', 'Ask Mara to match', 'Telegram', 'Question', 'The visit is logged without a patient, and Mara is asked on Telegram to link the one she saw. Then the superbill follows.', ['airtable', 'telegram']),
  step('f7', 'F', [5, 0], 'end', 'Mara adds the codes', 'From her notes', 'PencilSimple', 'Mara types the codes from her notes system into the draft and sends the superbill herself. No flow ever sees the codes.'),

  step('g1', 'G', [0, 0], 'trigger', 'Plan bought', 'Start a plan, $1,020', 'Ticket', 'The patient pays $1,020 for six follow-ups on Stripe’s own page, from Start a plan. The payment starts the first Zap.', ['zapier', 'stripe'], true),
  step('g2', 'G', [1, 0], 'step', 'Open the plan', 'Plans, in Airtable', 'Table', 'Adds the plan to Plans: six visits, an expiry four months on, and visits left counting down as Mara logs plan visits.', ['airtable']),
  step('g3', 'G', [2, 0], 'step', 'Send the welcome', 'A fixed template', 'EnvelopeSimple', 'A fixed welcome: six follow-ups at $170 each, the expiry date, shareable within a household, and the link to book. Mara is told on Telegram.', ['gmail', 'telegram'], true),
  step('g4', 'G', [3, 0], 'trigger', 'Each morning', '7:00 and 7:15', 'Clock', 'Two more Zaps, each on its own, look over the open plans every morning: at 7 for one or two visits left, at 7:15 for three weeks to expiry.', ['zapier'], true),
  step('g5', 'G', [4, 0], 'end', 'Two-left reminder', 'One or two left', 'Bell', 'A fixed reminder: the visits left, the date they are good until and the link to book. It goes once, and never says whether more visits would help.', ['gmail', 'airtable']),
  step('g6', 'G', [4, 1], 'end', 'Expiry reminder', 'Three weeks to go', 'CalendarX', 'A fixed reminder three weeks before the four months are up, with the visits left and the link to book. It goes once.', ['gmail', 'airtable']),

  step('h1', 'H', [0, 0], 'trigger', 'A new email', 'Checked every minute', 'EnvelopeSimple', 'n8n checks hello@rangept.co every minute and saves no execution. An email with an attachment is labelled For Mara before Claude sees it.', ['n8n', 'gmail'], true),
  step('h2', 'H', [1, 0], 'ai', 'Claude sorts it', 'One label, no notes', 'Sparkle', 'Claude reads the email once, only to choose For Mara or Admin, and returns the label alone.', ['claude']),
  step('h3', 'H', [2, 0], 'decision', 'Which label?', 'One of two', 'ArrowsSplit', 'Anything clinical, or anything Claude is unsure of, is For Mara. Anything practical, like a superbill question or a visit to move, is Admin.'),
  step('h4', 'H', [3, 1], 'end', 'For Mara, untouched', 'A Gmail label only', 'Tag', 'The email gets the For Mara label and nothing else: no draft, summary, copy or log of its words. Mara gets a ping with no name in it, and reads it herself.', ['gmail', 'telegram']),
  step('h5', 'H', [3, 0], 'agent', 'Draft the reply', 'Site facts', 'PencilSimple', 'For an Admin email, Claude drafts a reply from the same public passages the bot searches, one tool call at a time. It states only what the site states.', ['supabase', 'claude']),
  step('h6', 'H', [4, 0], 'gate', 'Mara’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the reply is for a patient’s inbox, so it waits in Telegram with Approve and Edit. Nothing is sent until Mara taps Approve.', ['telegram']),
  step('h7', 'H', [5, 0], 'end', 'Send the reply', 'Once approved', 'PaperPlaneTilt', 'The approved reply goes from hello@rangept.co, and the run is logged in Agent runs: its time, label and Mara’s yes, never the email’s words.', ['gmail', 'google-sheets']),

  step('i1', 'I', [0, 0], 'trigger', 'A late cancellation', 'Under 24 hours', 'CalendarX', 'n8n hears a visit cancelled from its Cal.com link with less than 24 hours to go. A change further ahead is free, and needs no one.', ['n8n', 'cal-com'], true),
  step('i2', 'I', [1, 0], 'agent', 'Read the visit', 'Cal.com and Airtable', 'Wrench', 'One tool call at a time: the visit and Mara’s next openings in Cal.com, then the patient’s name and any plan in Airtable. Nothing clinical.', ['cal-com', 'airtable']),
  step('i3', 'I', [2, 0], 'ai', 'Draft the reply', 'Next three openings', 'Sparkle', 'Claude drafts a short reply offering Mara’s next three openings, each a link to book, and quotes the site’s policy: “Cancellations with less notice are charged half the visit fee.” It asks no reason and moves no booking.', ['claude']),
  step('i4', 'I', [3, 0], 'gate', 'Mara’s yes', 'Approve in Telegram', 'UserCheck', 'The reply is for a patient’s inbox, so it waits in Telegram with Approve and Edit. Charging or waiving the half-visit fee is Mara’s decision, made by hand in Stripe. No agent charges.', ['telegram']),
  step('i5', 'I', [4, 0], 'end', 'Send the reply', 'Once approved', 'PaperPlaneTilt', 'The approved reply goes from hello@rangept.co and the run is logged. The patient picks a time from the link, and the booking runs like any other.', ['gmail', 'google-sheets']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'E', 'F', 'G', 'H', 'I'])
const SIDE = new Set(['c7', 'e5', 'f6', 'g6', 'h4'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('a4', 'b3'),
  flow('b3', 'g1'),
  flow('a3', 'h1'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  flow('c1', 'c2', 'yes'),
  flow('c1', 'c7', 'no'),
  ...chain('c2', 'c3', 'c4', 'c5', 'c6'),
  flow('c6', 'e1'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'yes'),
  flow('d3', 'd7', 'no'),
  flow('d7', 'd6', 'yes'),
  flow('d7', 'd5', 'no'),
  ...chain('e1', 'e2', 'e3'),
  flow('e3', 'e4', 'no'),
  flow('e3', 'e5', 'yes'),
  flow('e4', 'f1'),
  flow('e5', 'f5'),
  ...chain('f1', 'f2', 'f3'),
  flow('f3', 'f4', 'yes'),
  flow('f3', 'f6', 'no'),
  flow('f4', 'f5'),
  flow('f6', 'f5'),
  flow('f5', 'f7'),
  ...chain('g1', 'g2', 'g3', 'g4'),
  flow('g4', 'g5', '7:00'),
  flow('g4', 'g6', '7:15'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'h5', 'Admin'),
  flow('h3', 'h4', 'For Mara'),
  flow('h5', 'h6'),
  flow('h6', 'h7', 'approved'),
  loop('h6', 'h5', 'change it'),
  ...chain('i1', 'i2', 'i3', 'i4'),
  flow('i4', 'i5', 'approved'),
  loop('i4', 'i3', 'change it'),
]

const endToEnd: EndToEnd = {
  title: 'Range Physical Therapy · End-to-end workflow',
  description: 'Range Physical Therapy’s whole system as one live graph: evaluation booking, the Clinic Q&A bot, the visit, the superbill, the six-visit plan and the two agents, with nothing clinical in any automated step.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · RANGE PHYSICAL THERAPY',
  heading: 'From Schedule your evaluation to the last plan visit',
  lede: 'Every trigger, flow, bot and agent behind Range’s site, wired as one graph: a booked evaluation and a visitor’s questions, the visit itself, the superbill after it, the six-visit plan and its reminders, and the inbox, sorted so anything clinical reaches Mara untouched.',
  stance: 'Mara approves anything Claude drafts for a patient’s inbox, and makes any refund or change to a plan herself. Nothing clinical is stored, summarised or forwarded by Claude, Airtable or any flow.',
  caption: 'Range Physical Therapy, end to end · 9 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A booking, a question, a visit or an email moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one booking, question, visit or email moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until Mara says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the evaluation flow and both agents run in. It saves no executions of any of them.'],
      ['Make', 'The automation tool the superbill runs in: it hears a paid visit and drafts the superbill.'],
      ['Zapier', 'The automation tool the six-visit plan runs in, as three Zaps.'],
      ['Execution', 'n8n’s saved copy of a run. Range’s n8n workflows save none, so no booking or email is kept there.'],
      ['Claude', 'Anthropic’s AI model. It answers, sorts and drafts here, and never writes a superbill, a reminder or the intake email.'],
      ['Airtable', 'Where Range keeps its patients, visits and plans, with scheduling and billing fields only.'],
      ['Stripe', 'Where a patient pays for a visit or a plan, on Stripe’s own page.'],
      ['Payment Link', 'A Stripe page for one price. Mara opens a visit’s link for the patient at the end of the visit.'],
      ['Cal.com', 'The booking tool that holds Mara’s calendar, the evaluation, follow-ups and the free call.'],
      ['Gmail', 'Range’s mailbox at hello@rangept.co, where templates, superbill drafts and approved replies come from.'],
      ['Telegram', 'The chat app where Mara gets alerts and pings, and approves drafts.'],
      ['Supabase', 'The database that stores the public passages the Clinic Q&A bot searches.'],
      ['Passage', 'A price or a practical answer cut from one of Range’s pages, as the search returns it.'],
      ['Template', 'A fixed message with blanks for the name, time and price. No AI writes it, so it may send alone.'],
      ['Edit Fields', 'The n8n step that keeps the scheduling fields of a booking and drops everything else.'],
      ['Superbill', 'The receipt a patient sends for out-of-network benefits. Mara adds its codes from her notes and sends it herself.'],
      ['Six-visit plan', 'Six follow-ups for $1,020, $170 each, used within four months and shareable within a household.'],
      ['Notes system', 'Mara’s own clinic notes system, where everything clinical lives. No flow, agent or Claude reads or writes it.'],
      ['Free 15-minute call', 'A short call with Mara, booked on Cal.com, where anything clinical is talked through with her.'],
      ['For Mara', 'The Gmail label for anything clinical or unsure. The email is left untouched for Mara to read.'],
      ['Admin', 'The Gmail label for a practical email, like a visit to move, which gets a reply drafted from the site’s facts.'],
      ['Business associate agreement', 'A signed contract with a vendor that handles patient information. Before any real patient’s details go into these tools, Range would need a signed business associate agreement with each vendor that handles them, and would replace any vendor that won’t sign one.'],
      ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, the label and Mara’s yes, never an email’s words.'],
      ['Approval gate', 'A hard stop. No reply Claude drafts reaches a patient until Mara says yes.'],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Range Physical Therapy is a fictional clinic, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
