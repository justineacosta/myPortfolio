/**
 * Meridian Werks’ End-to-end case page (spec 2026-10-05 per-site pages): the
 * workshop’s whole system as one graph of ten lanes, from a booking on the
 * site, through Ilse’s confirming call, the diagnosis, the health report and
 * the owner’s yes, to the approved work and any variation sent back for a new
 * yes, with the Workshop Q&A bot, the Inbox triage agent, the fleet reports,
 * the Weekly report agent and a failed run reaching Ilse. No step diagnoses a
 * car or quotes a price. It tells the same story as Meridian Werks’
 * Automation, Build plan and AI agents pages. data/cases/index.ts registers
 * it; `npm run cases` renders it into
 * public/cases/meridian-werks/end-to-end.html. Only type imports, so Node can
 * run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The workshop’s rule, as on Meridian Werks’ other pages. */
const RULE = 'No flow, bot or agent diagnoses a fault, guesses a cause, says whether a car is safe to drive or quotes a price: the technicians diagnose on the lift and the bench, and Ilse prices every fixed estimate after diagnostics, in euros. As the site says: “Describe the symptom rather than the repair. Diagnosis is our job.”'

/** The person’s-yes rule, as on Meridian Werks’ other pages. */
const YES = 'Ilse Brandt, the workshop manager, approves anything Claude drafts for a customer’s inbox before it is sent.'

const LANES: Lane[] = [
  { id: 'A', name: 'Car owners', note: 'They book on the site.' },
  { id: 'B', name: 'Service booking (MW-01)', note: 'Zapier. A receipt only.' },
  { id: 'C', name: 'The workshop', note: 'People, by hand.' },
  { id: 'D', name: 'Health report (MW-02)', note: 'n8n. The owner says yes.' },
  { id: 'E', name: 'The work', note: 'Only what was approved.' },
  { id: 'F', name: 'Workshop Q&A bot', note: 'Site chat. Pages only.' },
  { id: 'G', name: 'Inbox triage agent', note: 'n8n. Ilse says yes.' },
  { id: 'H', name: 'Fleet report (MW-03)', note: 'Make. Ilse checks.' },
  { id: 'I', name: 'Weekly report agent', note: 'n8n. Internal, no yes.' },
  { id: 'J', name: 'Failed runs (MW-H02)', note: 'n8n. Ilse hears.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Books a service', 'Four short steps', 'Car', 'An owner sends the site’s four steps: the vehicle, the service, the date and the details, where they describe the symptom rather than the repair. The registration is optional.'),

  step('b1', 'B', [0, 0], 'step', 'Hold the slot', 'Cal.com, a request', 'CalendarCheck', 'Zapier books the chosen slot in Cal.com as a request, waiting for Ilse to confirm it. A slot another owner took a moment earlier is not held, and the card says so.', ['cal-com', 'zapier'], true),
  step('b2', 'B', [1, 0], 'step', 'Open a job card', 'Airtable', 'Table', 'The job card holds the vehicle, the service, the symptom and the slot. It is the only place the registration is kept.', ['airtable'], true),
  step('b3', 'B', [2, 0], 'step', 'Tell the workshop', 'Telegram group', 'PaperPlaneTilt', 'The workshop group hears the job number, the make and model, the service, the symptom and the slot. Never the registration or the owner’s details.', ['telegram'], true),
  step('b4', 'B', [3, 0], 'step', 'Email the owner', 'A fixed template', 'EnvelopeSimple', 'A receipt, not a confirmation: the request is in, whether the slot is held, and that Ilse will call to confirm within one working day.', ['gmail'], true),

  step('c1', 'C', [3, 0], 'gate', 'Ilse calls the owner', 'Within a working day', 'Phone', 'An approval gate: Ilse calls, talks through the symptom, agrees the date and confirms it in Cal.com. The site confirms by phone, so no email does it for her.', ['cal-com', 'airtable']),
  step('c2', 'C', [4, 0], 'step', 'Diagnose the car', 'Lift and bench', 'Wrench', 'The technician records each finding in their own words, with photographs and a priority, then sets the job card to Diagnostics done.', ['airtable']),

  step('d1', 'D', [0, 0], 'ai', 'Draft the summary', 'Claude, no diagnosis', 'Sparkle', 'n8n sees Diagnostics done within a minute. Claude rewords the technician’s findings in plain language, adding no finding, cause, price or date, and never reads the registration.', ['n8n', 'claude'], true),
  step('d2', 'D', [1, 0], 'gate', 'Workshop checks', 'Anton, then Ilse', 'UserCheck', 'An approval gate: Anton signs off a pre-purchase inspection, a performance refinement or a calibration first. Ilse prices each finding in euros, checks Claude’s words and sends, or calls instead.', ['telegram']),
  step('d3', 'D', [2, 0], 'step', 'Send health report', 'Gmail, with photos', 'EnvelopeSimple', 'The owner gets the findings, the photographs and the fixed estimate: needed now, upcoming and optional. A pre-purchase inspection’s report asks for no answer and ends here.', ['gmail'], true),
  step('d4', 'D', [3, 0], 'gate', 'Owner approves', 'On the answer form', 'UserCheck', 'An approval gate: the email’s button opens a form, and only its submit records an answer. n8n keeps the run waiting for up to seven days.', ['n8n']),
  step('d5', 'D', [4, 0], 'decision', 'Owner’s answer', 'Switch', 'ArrowsSplit', 'Needed now only, needed now and upcoming, or everything listed releases that work. Not now, call me first or no answer in seven days goes to Ilse.', ['n8n']),
  step('d6', 'D', [5, 0], 'end', 'Ask Ilse to call', 'Nothing begins', 'Phone', 'Ilse calls the owner and records their answer. On a phone yes she sets the job Approved by hand. Nothing begins without a yes.', ['telegram']),

  step('e1', 'E', [4, 0], 'step', 'Release the work', 'Approved items only', 'Database', 'The job is set Approved, with the items approved and their total in euros, and the workshop group hears what to start. Never the registration.', ['airtable', 'telegram'], true),
  step('e2', 'E', [5, 0], 'step', 'Do the work', 'What was approved', 'Wrench', 'The technician does only the approved work. Anything found beyond the estimate is stopped, recorded as a new finding with photographs, and set Variation found.'),
  step('e3', 'E', [6, 0], 'end', 'Road test, hand over', 'Against the complaint', 'FlagCheckered', 'Every car is road-tested against the original complaint, and the findings, part numbers and torque values go on its file. Anton signs off a finished calibration by hand.'),

  step('f1', 'F', [0, 0], 'trigger', 'A visitor asks', 'In the site chat', 'ChatCircleText', 'Someone asks in the chat on the site. n8n saves no run of it, and it never asks for a registration.', ['n8n']),
  step('f2', 'F', [1, 0], 'decision', 'Symptom words?', 'A fixed n8n If', 'ShieldWarning', 'Before any search or Claude, a fixed n8n If checks the question for symptom words Ilse keeps, like knock, leak or warning light. A match gets a fixed reply.', ['n8n'], true),
  step('f3', 'F', [2, 1.5], 'end', 'Book it, or call', 'Fixed reply', 'HandPalm', 'A fixed reply: “Describe the symptom rather than the repair. Diagnosis is our job.” Then the booking form, or +31 10 244 1180, Mon–Fri 07:30–18:00.'),
  step('f4', 'F', [2, 0], 'step', 'Search the pages', 'Top 5 passages', 'MagnifyingGlass', 'The question is searched in Supabase, which holds the workshop’s public pages: the services, the marques, the visiting details and how booking works. No prices: the site lists none.', ['supabase']),
  step('f5', 'F', [3, 0], 'ai', 'Claude answers', 'Only from the page', 'Sparkle', 'Claude answers only from the five passages, naming the page. No invented price, date or figure, no cause and no word on whether a car is safe to drive.', ['claude']),
  step('f6', 'F', [4, 0], 'decision', 'On the page?', 'And no symptom', 'Question', 'Claude’s own check, behind the fixed one: did a passage hold the answer, and is the question clear of a symptom and a price? Yes only if both.'),
  step('f7', 'F', [5, 0], 'step', 'Reply with source', 'Names the page', 'ArrowBendUpLeft', 'The answer goes back in the chat with its page, like (Vehicles). It answers live from the workshop’s pages, so it needs no one’s yes.'),
  step('f8', 'F', [5, 1.5], 'end', 'To a person', 'Phone or email', 'UserSwitch', 'Not in the pages: the bot hands the chat to a person, by phone in opening hours or by email to workshop@meridianwerks.nl. It forwards nothing itself.'),
  step('f9', 'F', [6, 0], 'end', 'Open the booking', 'Book a service', 'CalendarCheck', 'A visitor who wants to book gets the site’s own four steps in the chat. The booking then runs MW-01, and Ilse confirms it by phone.'),

  step('g1', 'G', [0, 0], 'trigger', 'New email', 'workshop@ inbox', 'EnvelopeSimple', 'n8n’s Gmail Trigger picks up each new email every minute, skipping the workshop’s own mail. Attachments never reach Claude.', ['gmail', 'n8n'], true),
  step('g2', 'G', [1, 0], 'ai', 'Claude sorts it', 'One Gmail label', 'Tag', 'Claude labels the email Booking, Reschedule, Urgent or For Ilse. An owner’s answer to a health report is For Ilse: only the form or a call records a yes.', ['claude', 'gmail']),
  step('g3', 'G', [2, 0], 'decision', 'Booking or move?', 'Or urgent, or other', 'ArrowsSplit', 'A booking or a reschedule gets a draft. Urgent, like a breakdown or whether a car is safe to drive, and anything For Ilse get none.'),
  step('g4', 'G', [3, 1.5], 'end', 'To Ilse at once', 'Telegram, a link only', 'Bell', 'Ilse hears on Telegram, with sound for Urgent, and a link to the thread, never the email’s words. She calls or replies herself.', ['telegram']),
  step('g5', 'G', [3, 0], 'agent', 'Read open times', 'Cal.com, read only', 'CalendarCheck', 'For a reschedule, the agent reads the sender’s booking and the next open times in Cal.com. It makes, moves, holds and cancels nothing.', ['cal-com']),
  step('g6', 'G', [4, 0], 'ai', 'Draft the reply', 'No cause, no price', 'PencilSimple', 'Claude drafts the reply: three open times, or the four steps for a booking, and that Ilse confirms by phone within one working day. No diagnosis, no price, no registration.', ['claude']),
  step('g7', 'G', [5, 0], 'gate', 'Ilse’s yes', 'In Telegram', 'UserCheck', 'An approval gate: Ilse opens the draft’s form in Telegram and approves it or sends it back with a note. Opening the form records nothing.', ['telegram']),
  step('g8', 'G', [6, 0], 'end', 'Reply in the thread', 'Moves no booking', 'PaperPlaneTilt', 'The approved reply goes in the email’s thread, word for word. The booking stays as it is until Ilse calls and moves it in Cal.com herself.', ['gmail'], true),

  step('h1', 'H', [0, 0], 'trigger', 'On the 1st', '06:00, each month', 'CalendarCheck', 'At 06:00 on the 1st, Make starts the fleet reports for the month just ended, one per fleet client with an active contract.', ['make'], true),
  step('h2', 'H', [1, 0], 'step', 'Gather the month', 'Airtable API calls', 'Table', 'For each client, last month’s jobs from the job cards: the work, the days off the road and the cost in euros. No visits reads as Jobs 0.', ['airtable'], true),
  step('h3', 'H', [2, 0], 'step', 'Draft, tell Ilse', 'A fixed template', 'Database', 'The report is written To check, each vehicle named by fleet number and model, never registration, and Ilse hears on Telegram. Claude writes none of it.', ['airtable', 'telegram'], true),
  step('h4', 'H', [3, 0], 'gate', 'Ilse checks', 'In Airtable', 'UserCheck', 'An approval gate: Ilse reads the report beside the job cards, corrects what needs it and sets it Checked. The flow never sets Checked.', ['airtable']),
  step('h5', 'H', [4, 0], 'step', 'Send the report', 'Gmail, fixed', 'EnvelopeSimple', 'Within a quarter of an hour, the checked report goes to the client’s reporting address in a fixed template, from workshop@meridianwerks.nl.', ['gmail'], true),
  step('h6', 'H', [5, 0], 'end', 'Mark it sent', 'Never twice', 'FlagCheckered', 'The report is marked Sent, with the time, so a later edit never sends it again.', ['airtable']),

  step('i1', 'I', [0, 0], 'trigger', 'Monday, 8 am', 'Schedule', 'Clock', 'Every Monday at 08:00, Rotterdam time, n8n starts the Weekly report agent.', ['n8n'], true),
  step('i2', 'I', [1, 0], 'agent', 'Read the week', 'Stripe and Jobs', 'ClipboardText', 'The agent reads last week’s Stripe payments against the week before, summed in euros by n8n, and the Jobs table: jobs at each stage, and those waiting on parts.', ['stripe', 'airtable']),
  step('i3', 'I', [2, 0], 'ai', 'Write the summary', 'From those figures', 'Sparkle', 'Claude writes a short summary from those figures only: no figure of its own, no customer’s name and no registration.', ['claude']),
  step('i4', 'I', [3, 0], 'end', 'Email the summary', 'The workshop’s owner', 'EnvelopeSimple', 'The summary goes to the workshop’s owner by email. It is internal, so it needs no yes.', ['gmail']),

  step('j1', 'J', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed MW-02 run, and a webhook hears a failed Make step in MW-03, or a failed or halted MW-01 run from Zapier Manager.', ['n8n'], true),
  step('j2', 'J', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab with what each source gives: n8n’s step and run link, Make’s step and error, or Zapier’s zap and time. Never a registration.', ['google-sheets']),
  step('j3', 'J', [2, 0], 'end', 'Alert Ilse', 'Telegram', 'Bell', 'Ilse hears on Telegram, urgently for a failure. Nothing retries on its own, and she calls Justine when a flow needs fixing.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'])
const SIDE = new Set(['f3', 'f8', 'g4'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  ...chain('b1', 'b2', 'b3', 'b4'),
  flow('b4', 'c1', 'Ilse calls'),
  flow('c1', 'c2', 'car in'),
  flow('c2', 'd1', 'Diagnostics done'),
  ...chain('d1', 'd2', 'd3', 'd4', 'd5'),
  flow('d5', 'e1', 'Approved'),
  flow('d5', 'd6', 'Not yet'),
  ...chain('e1', 'e2', 'e3'),
  loop('e2', 'd1', 'variation: a new yes'),
  flow('f1', 'f2'),
  flow('f2', 'f4', 'no'),
  flow('f2', 'f3', 'symptom'),
  ...chain('f4', 'f5', 'f6'),
  flow('f6', 'f7', 'yes'),
  flow('f6', 'f8', 'no'),
  flow('f7', 'f9', 'book'),
  ...chain('g1', 'g2', 'g3'),
  flow('g3', 'g5', 'draft'),
  flow('g3', 'g4', 'no draft'),
  ...chain('g5', 'g6', 'g7'),
  flow('g7', 'g8', 'approved'),
  loop('g7', 'g6', 'change it'),
  ...chain('h1', 'h2', 'h3', 'h4'),
  flow('h4', 'h5', 'Checked'),
  flow('h5', 'h6'),
  ...chain('i1', 'i2', 'i3', 'i4'),
  ...chain('j1', 'j2', 'j3'),
]

const endToEnd: EndToEnd = {
  title: 'Meridian Werks · End-to-end workflow',
  description: 'Meridian Werks’ whole system as one live graph: bookings held and confirmed by Ilse’s call, health reports Ilse checks and the owner approves, variations sent back for a new yes, the Workshop Q&A bot, the Inbox triage agent, fleet reports, the Monday summary, and a failed run reaching Ilse.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · MERIDIAN WERKS',
  heading: 'From Book a service to a car road-tested against the original complaint',
  lede: 'Every trigger, flow, bot and agent behind Meridian Werks’ site, wired as one graph: a booking held, carded and receipted, then confirmed by Ilse’s call within one working day; a diagnosis turned into a health report the owner approves before any work begins; a variation sent back for a new yes before it happens; a visitor’s question answered from the workshop’s own pages; an email sorted and answered with Ilse’s yes; a fleet report Ilse checks on the 1st; and the owner’s Monday summary.',
  stance: `${RULE} ${YES} That is the health report’s summary, at her check, and every Inbox triage reply, in Telegram. Anton Vosloo signs off every calibration and every pre-purchase inspection. The car owner’s yes starts the work, and any variation needs a new one. The booking receipt, the workshop messages and the fleet report email are fixed templates; the fleet report sends only once Ilse has checked it. The bot answers live, without a yes, from the workshop’s pages only, and the Monday summary is internal. In MW-01, MW-02 and MW-03 Claude drafts only the health report’s summary; the two agents run beside the flows. A registration stays on the job card, and amounts are in euros.`,
  caption: 'Meridian Werks, end to end · 10 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A booking, a report, a question or an email moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one booking, report, question or email moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again, like a variation going back for a new yes.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until Ilse, Anton or the car’s owner says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a fixed check or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['Zapier', 'The automation tool bookings run in, from the site’s form to the receipt.'],
      ['n8n', 'The automation tool health reports, the bot, both agents and the failed-run log run in.'],
      ['Make', 'The automation tool fleet reports run in.'],
      ['Claude', 'Anthropic’s AI model. It drafts the health report’s summary, answers in the bot, sorts and drafts in Inbox triage, and writes the Monday summary.'],
      ['Airtable', 'Where Meridian Werks keeps its job cards, findings, reports and fleet reports.'],
      ['Cal.com', 'The workshop calendar, where a booking waits as a request until Ilse confirms it by phone.'],
      ['Gmail', 'The workshop@meridianwerks.nl mailbox, which sends every receipt, report and approved reply.'],
      ['Telegram', 'The chat app where the workshop hears of bookings, Anton and Ilse check reports, and Ilse approves drafts.'],
      ['Supabase', 'The database that stores the passages from the workshop’s pages the bot searches.'],
      ['Stripe', 'Where the workshop takes payment for its invoices, which Ilse raises by hand.'],
      ['Google Sheets', 'Where the Failed runs tab is kept.'],
      ['Job card', 'One row in Airtable per booking, the only place a registration is kept.'],
      ['Receipt', 'The owner’s email after booking. It says the request is in; Ilse’s call is the confirmation.'],
      ['Health report', 'The findings, photographs and fixed estimate an owner gets after diagnostics, before any work.'],
      ['Fixed estimate', 'The price of each finding, set by Ilse in euros and split into needed now, upcoming and optional.'],
      ['Variation', 'Work found beyond the approved estimate. It stops until the owner’s new yes.'],
      ['Pre-purchase inspection', 'An inspection before buying a car, signed off by Anton. Its report asks for no answer.'],
      ['Symptom words', 'The fixed list Ilse keeps. A chat question with one gets the booking form, never Claude.'],
      ['Urgent', 'The label for a breakdown or a question whether a car is safe to drive. Ilse hears at once.'],
      ['For Ilse', 'The label for an email that is not a booking or a reschedule, left untouched for Ilse.'],
      ['Template', 'A fixed message with blanks for the job, the slot or the month. No AI writes it.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed or halted run from n8n, Make or Zapier.'],
      ['Approval gate', `A hard stop. ${YES} The car’s owner approves the work, and Ilse checks every fleet report.`],
      ['Agent', 'An AI with one job that reads what it needs, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Meridian Werks is a fictional workshop, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
