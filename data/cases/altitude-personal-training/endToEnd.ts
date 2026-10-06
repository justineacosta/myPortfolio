/**
 * Altitude’s End-to-end case page (spec 2026-10-05 per-site pages): Altitude’s
 * whole system as one graph of ten lanes, from an application and a visitor’s
 * question to the consult, the first block, the Sunday check-in, form reviews
 * and the next block. It tells the same story as Altitude’s Automation, Build
 * plan and AI agents pages. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/altitude-personal-training/end-to-end.html.
 * Only type imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

const LANES: Lane[] = [
  { id: 'A', name: 'Applicants and visitors', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'Buttons, no form.' },
  { id: 'C', name: 'Application (AL-01)', note: 'n8n. A template replies.' },
  { id: 'D', name: 'Program Q&A bot', note: 'Answers from the site.' },
  { id: 'E', name: 'The consult', note: 'Elias says yes, or not now.' },
  { id: 'F', name: 'Start a plan (AL-02)', note: 'Make. Charged after his yes.' },
  { id: 'G', name: 'The first week', note: 'Elias, by hand.' },
  { id: 'H', name: 'Sunday check-in (AL-03)', note: 'Zapier. Elias writes back.' },
  { id: 'I', name: 'Form review prep agent', note: 'For Elias only.' },
  { id: 'J', name: 'Block review agent', note: 'Waits for Elias’s yes.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Someone applies', 'Start coaching', 'UserPlus', 'Someone presses Start coaching and spends five minutes on the application: their goal, their schedule and what they have tried before.'),
  step('a2', 'A', [1, 0], 'trigger', 'A visitor asks', 'Day or night', 'ChatCircleText', 'A visitor opens the chat on Altitude’s site with a question, like what Hybrid includes or what happens after they apply.'),

  step('b1', 'B', [0, 0], 'step', 'The application', 'Five minutes', 'Browser', 'The application asks the goal, the schedule, what has been tried and an email, and posts them to an n8n webhook the moment it is sent.', ['n8n']),
  step('b2', 'B', [1, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat on every page of Altitude’s site. It answers live from the programs, pricing and FAQ, and it never sends an email.'),

  step('c1', 'C', [0, 0], 'step', 'Check the roster', 'Clients, in Airtable', 'AddressBook', 'The webhook starts n8n. It looks the email up among Altitude’s current clients, and finding none goes on as new.', ['airtable']),
  step('c2', 'C', [1, 0], 'decision', 'A current client?', 'Matched on email', 'ArrowsSplit', 'An email on a current client’s row goes to Elias. Anyone new goes on to the consult.'),
  step('c3', 'C', [2, 0], 'step', 'Save application', 'Applied, Airtable', 'Table', 'The answers are saved in Applications, one row per email, and marked Applied.', ['airtable']),
  step('c4', 'C', [3, 0], 'step', 'Offer the consult', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude, emails what the free 20-minute consult covers and a link to book it in Elias’s Cal.com calendar. It sends on its own.', ['gmail', 'cal-com'], true),
  step('c5', 'C', [4, 0], 'ai', 'Summarise the goal', 'For Elias only', 'Sparkle', 'Claude summarises the answers for Elias on Telegram, with questions for the call. An injury is flagged for the consult, with no advice.', ['claude', 'telegram']),
  step('c6', 'C', [2, 1], 'end', 'Pass to Elias', 'A client applied', 'ChatCircleText', 'A current client’s answers go to Elias on Telegram. No row and no email: he writes back himself.', ['telegram']),

  step('d1', 'D', [0, 0], 'step', 'Search the pages', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against Altitude’s programs, pricing and formats, and the FAQ.', ['supabase']),
  step('d2', 'D', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a price or a date the pages do not hold.', ['claude']),
  step('d3', 'D', [2, 0], 'decision', 'Sure, and no injury?', 'A page settles it', 'Question', 'Did a page hold the answer? Any injury, pain or medical question counts as no, even “What if I have an injury?”, and so does anything the pages do not say.'),
  step('d4', 'D', [3, 0], 'end', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes back in the chat with its page, and a live answer needs no yes. If they want to start, the bot opens the same Cal.com consult page.'),
  step('d5', 'D', [3, 1], 'step', 'Book the consult', 'No advice given', 'CalendarCheck', 'No advice: the bot opens Elias’s Cal.com consult page, or takes an email for Elias. A consult booked here skips the application, so Elias adds the row by hand if they start.', ['cal-com', 'telegram']),

  step('e1', 'E', [0, 0], 'step', 'The consult', 'Free, 20 minutes', 'Phone', 'A short call about fit, format and price, on days 2–3. Elias has read Claude’s summary, and an injury is talked through here, in person.'),
  step('e2', 'E', [1, 0], 'gate', 'Elias’s yes', 'Marks it Starting', 'UserCheck', 'Nothing is charged until Elias marks the consult Starting in Airtable, with the plan: Online, Hybrid or Studio. A consult booked without applying gets its row by hand first.', ['airtable']),

  step('f1', 'F', [0, 0], 'trigger', 'Marked Starting', 'Every 15 minutes', 'Table', 'Make checks Applications every quarter of an hour and picks up each row Elias has set to Starting, with its plan.', ['make', 'airtable'], true),
  step('f2', 'F', [1, 0], 'step', 'Send the payment link', 'Stripe, a template', 'CreditCard', 'A Stripe Checkout for $229, $449 or $760 a month, emailed in a fixed template with the 12-week first block and 14 days’ notice after it.', ['stripe', 'gmail']),
  step('f3', 'F', [2, 0], 'decision', 'Paid in 24 hours?', 'Stripe Checkout', 'ArrowsSplit', 'The client starts the subscription on Stripe’s own page, with their own card. A link left unpaid for 24 hours expires.', ['stripe']),
  step('f4', 'F', [3, 0], 'step', 'Open the client', 'Active, in Airtable', 'IdentificationCard', 'The person joins Clients with their plan and Stripe subscription, marked Active, and the application is marked Started.', ['airtable']),
  step('f5', 'F', [4, 0], 'step', 'Book the assessment', '60 min, Cal.com', 'CalendarCheck', 'The first free hour in Elias’s calendar, at 2045 Pearl Street or over video as the plan sets. With no hour free, Elias books it by hand.', ['cal-com']),
  step('f6', 'F', [5, 0], 'step', 'Send the welcome', 'A fixed template', 'EnvelopeSimple', 'A fixed welcome with the assessment time, what to bring and the client’s check-in form link. Elias is told on Telegram who has started.', ['gmail', 'telegram'], true),
  step('f7', 'F', [3, 1], 'end', 'Tell Elias it lapsed', 'Link expired', 'Bell', 'The application is marked Link expired and Elias is told. He follows up, and sets it back to Starting to send a fresh link.', ['airtable', 'telegram']),

  step('g1', 'G', [0, 0], 'step', 'The assessment', '60 minutes', 'Barbell', 'A movement screen and baseline numbers, in the studio or over video, on days 4–5.'),
  step('g2', 'G', [1, 0], 'step', 'Write the first block', 'In the app, by hand', 'NotePencil', 'Elias writes the first block’s program into the coaching app himself and enters the Block start in Airtable. No flow reads or writes the app.', ['airtable']),
  step('g3', 'G', [2, 0], 'step', 'A coached week', 'Sessions in the app', 'CalendarBlank', 'From day 7 the client trains from the app, films a working set for form review, and checks in on Sunday.'),

  step('h1', 'H', [0, 0], 'trigger', 'Check-in, or Sunday', 'Two Zaps', 'ClipboardText', 'A check-in on the client’s Airtable form starts one Zap. 9 pm Mountain time on Sunday starts the other, for anyone with none.', ['zapier', 'airtable'], true),
  step('h2', 'H', [1, 1], 'end', 'Send a nudge', 'None by Sunday', 'HandWaving', 'An active client with no check-in by Sunday night gets a short fixed nudge with their form link. A check-in sent after it is read like any other.', ['gmail', 'airtable']),
  step('h3', 'H', [1, 0], 'step', 'Read the past weeks', 'Last four, Airtable', 'ClockCounterClockwise', 'The client’s plan, their week of the block and their last four check-ins, so each number is read next to last week’s.', ['airtable']),
  step('h4', 'H', [2, 0], 'ai', 'Summarise it', 'For Elias only', 'Sparkle', 'Claude writes Elias a short summary, with any pain or injury flagged first and no advice. It goes to him on Telegram and never becomes the reply.', ['claude', 'telegram']),
  step('h5', 'H', [3, 0], 'end', 'Elias replies', 'By Monday, by hand', 'PencilSimple', 'Elias reads the check-in and writes the reply himself in the coaching app by Monday, then marks it Replied in Airtable.', ['airtable']),

  step('i1', 'I', [0, 0], 'trigger', 'A form video', 'Elias forwards it', 'VideoCamera', 'A client uploads a working set in the app. Elias forwards its link to the Form review chat in Telegram, with the lift and the target load.', ['telegram']),
  step('i2', 'I', [1, 0], 'agent', 'Gather the notes', 'One call at a time', 'Wrench', 'The client’s plan and week of the block, their last check-ins and past form notes on this lift, each read from Airtable in turn.', ['airtable']),
  step('i3', 'I', [2, 0], 'ai', 'Write the prep', 'Claude, for Elias', 'Sparkle', 'Claude sets the target load beside the last notes and what the client said about the lift, with any pain flagged first. It does not watch the video.', ['claude']),
  step('i4', 'I', [3, 0], 'step', 'Prep to Elias', 'In Telegram, no yes', 'PaperPlaneTilt', 'The prep goes to Elias in Telegram beside the video link and is saved as a Form notes row. It reaches no client, so it needs no yes.', ['telegram', 'airtable']),
  step('i5', 'I', [4, 0], 'end', 'Elias reviews', 'Within 24 hours', 'Eye', 'Elias watches the set and writes the feedback himself in the app within 24 hours, then adds a line to the Form notes row.'),

  step('j1', 'J', [0, 0], 'trigger', 'Every 4 weeks', 'From Block start', 'Clock', 'Each morning n8n finds the clients at a four-week mark that day, counted from their Block start: weeks 4 and 8 for a four-week review, week 12 for the end-of-block report. A schedule runs it, not anyone remembering.', ['n8n'], true),
  step('j2', 'J', [1, 0], 'agent', 'Read four weeks', 'Check-ins and notes', 'ClipboardText', 'One tool call at a time: the client’s plan and goal, the last four weeks’ check-ins and their summaries, and their form notes, all from Airtable.', ['airtable']),
  step('j3', 'J', [2, 0], 'ai', 'Draft the review', 'Or the block report', 'PencilSimple', 'Claude drafts the four-week review and the program changes, or at week 12 the short end-of-block report. Re-test numbers live in the app, so Elias types them into the report in his Edit.', ['claude']),
  step('j4', 'J', [3, 0], 'gate', 'Elias’s yes', 'Approve in Telegram', 'UserCheck', 'The review is for a client’s inbox, so it waits in Telegram with Approve and Edit. Elias adds a report’s re-test numbers by Edit, and nothing is sent until he taps Approve.', ['telegram']),
  step('j5', 'J', [4, 0], 'step', 'Send the review', 'Once approved', 'PaperPlaneTilt', 'The approved review goes to the client from hello@altitude.coach, and the run is logged in the Agent runs tab.', ['gmail', 'google-sheets']),
  step('j6', 'J', [5, 0], 'end', 'Update the program', 'In the app, by hand', 'NotePencil', 'Elias writes the program changes into the coaching app himself, from the approved review. The program is updated every 4 weeks.'),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'E', 'F', 'G', 'H', 'I', 'J'])
const SIDE = new Set(['c6', 'f7', 'h2'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  ...chain('c1', 'c2'),
  flow('c2', 'c6', 'yes'),
  flow('c2', 'c3', 'no'),
  ...chain('c3', 'c4', 'c5'),
  flow('c5', 'e1'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'yes'),
  flow('d3', 'd5', 'no'),
  flow('d5', 'e1'),
  flow('e1', 'e2'),
  flow('e2', 'f1', 'Starting'),
  ...chain('f1', 'f2', 'f3'),
  flow('f3', 'f4', 'yes'),
  flow('f3', 'f7', 'no'),
  ...chain('f4', 'f5', 'f6'),
  flow('f6', 'g1'),
  ...chain('g1', 'g2', 'g3'),
  flow('g3', 'h1'),
  flow('g3', 'i1', 'films a set'),
  flow('h1', 'h3', 'sent'),
  flow('h1', 'h2'),
  ...chain('h3', 'h4', 'h5'),
  ...chain('i1', 'i2', 'i3', 'i4', 'i5'),
  ...chain('j1', 'j2', 'j3', 'j4'),
  flow('j4', 'j5', 'approved'),
  loop('j4', 'j3', 'change it'),
  flow('j5', 'j6'),
]

const endToEnd: EndToEnd = {
  title: 'Altitude · End-to-end workflow',
  description: 'Altitude’s whole system as one live graph: the application, the Program Q&A bot, the consult, starting a plan, the Sunday check-in and the two agents, from Start coaching to the next block.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · ALTITUDE',
  heading: 'From Start coaching to the next block',
  lede: 'Every trigger, flow, bot and agent behind Altitude’s site, wired as one graph: an application and a visitor’s questions, the free consult, a plan started only on Elias’s yes, the first week, the Sunday check-in, form reviews and the review at the end of every 4 weeks.',
  stance: 'Elias approves anything Claude drafts for a client’s inbox and writes every check-in reply himself, and no subscription starts until he marks the consult Starting.',
  caption: 'Altitude, end to end · 10 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => (NUMBERED.has(s.lane) && !SIDE.has(s.id) ? { ...s, n: s.at[0] + 1 } : s)),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'An applicant, a question, a client or a check-in moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one application, question, check-in or review moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until Elias says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the application flow and both agents run in.'],
      ['Make', 'The automation tool starting a plan runs in: it watches for a consult marked Starting.'],
      ['Zapier', 'The automation tool the Sunday check-in runs in, as two Zaps.'],
      ['Webhook', 'A web address the application calls the moment it is sent, which starts AL-01.'],
      ['Claude', 'Anthropic’s AI model. It summarises, answers, prepares and drafts here, and never writes a check-in reply.'],
      ['Airtable', 'Where Altitude keeps its applications, plans, clients, check-ins and form notes.'],
      ['Stripe', 'Where each client starts their monthly subscription, on Stripe’s own page.'],
      ['Cal.com', 'The booking tool that holds Elias’s calendar, the consult and the assessment.'],
      ['Gmail', 'The mailbox the templates, approved reviews and end-of-block reports are sent from.'],
      ['Telegram', 'The chat app where Elias gets summaries and preps, forwards form videos and approves drafts.'],
      ['Supabase', 'The database that stores the passages the Program Q&A bot searches.'],
      ['Passage', 'A program, a plan or a question cut from a longer page, as the search returns it.'],
      ['Template', 'A fixed message with blanks for the name, plan and times. No AI writes it, so it may send alone.'],
      ['Consult', 'The free 20-minute call with Elias about fit, format and price.'],
      ['Starting', 'The status Elias sets after the consult, with the plan chosen. It is his yes for the payment link.'],
      ['Payment link', 'A Stripe Checkout page for the plan’s monthly subscription. It lasts 24 hours.'],
      ['Assessment', 'The 60-minute movement screen and baseline numbers, in the studio or over video.'],
      ['Coaching app', 'Where sessions, form videos and Elias’s replies live. No flow reads or writes it.'],
      ['Block start', 'The day Elias loads a client’s first program in the app, entered in Airtable. Blocks run 12 weeks, and each four-week review counts from it.'],
      ['Four-week review', 'The deeper look at the numbers every four weeks, with the program changes that follow.'],
      ['End-of-block report', 'The short report at the end of each 12-week block, with the re-test numbers Elias adds.'],
      ['Check-in', 'The Sunday form: sleep, steps, bodyweight trend and how training felt.'],
      ['Form notes', 'An Airtable table of each form review prep, with the line Elias adds after each review.'],
      ['Re-test', 'The numbers taken again each block. They live in the app, so Elias adds them himself.'],
      ['Agent runs', 'The Google Sheets tab where every agent run, tool call and yes is logged.'],
      ['Approval gate', 'A hard stop. No subscription starts and no four-week review or end-of-block report is sent until Elias says yes.'],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Altitude is a fictional coaching studio, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
