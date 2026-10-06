/**
 * Harbor & Pine Moving Co.’s End-to-end case page (spec 2026-10-05 per-site
 * pages): the mover’s whole system as one graph of eleven lanes, from an
 * estimate request and a visitor’s question to the coordinator’s range, the
 * walkthrough brief, the booked move, the day-before message, the invoice
 * reminder, a building’s certificate of insurance and a failed run reaching the
 * coordinators. It tells the same story as Harbor & Pine’s Automation, Build
 * plan and AI agents pages. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/harbor-and-pine-moving/end-to-end.html. Only
 * type imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The person’s-yes rule, as on Harbor & Pine’s other pages. */
const YES = 'A coordinator approves anything Claude drafts for a customer’s inbox before it is sent.'

const LANES: Lane[] = [
  { id: 'A', name: 'Customers', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'A quote form and a chat.' },
  { id: 'C', name: 'Help-desk RAG bot', note: 'Answers live, never a price.' },
  { id: 'D', name: 'Moving estimate (HP-01)', note: 'n8n. A coordinator says yes.' },
  { id: 'E', name: 'Walkthrough prep agent', note: 'For the coordinator only.' },
  { id: 'F', name: 'The coordinators', note: 'People, by hand.' },
  { id: 'G', name: 'Move day (HP-02)', note: 'Make. A template sends.' },
  { id: 'H', name: 'On the move', note: 'The crew, by hand.' },
  { id: 'I', name: 'Billing follow-up agent', note: 'Waits for the coordinator’s yes.' },
  { id: 'J', name: 'Insurance certificate (HP-03)', note: 'Zapier. The coordinator checks it.' },
  { id: 'K', name: 'Failed runs (HP-H02)', note: 'n8n. The coordinators hear.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'A visitor asks', 'In the site chat', 'ChatCircleText', 'A visitor opens the chat on Harbor & Pine’s site with a practical question, like which towns are covered or whether a piano needs crating.'),
  step('a2', 'A', [1, 0], 'trigger', 'Asks for an estimate', 'Get a free quote', 'Truck', 'Someone presses Get a free quote and fills in the three short steps: where they are moving from and to and the target moving date, the size and service, then their name, email and phone.'),

  step('b1', 'B', [0, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat on every page of the site. It answers live from the pricing guide and FAQ, never gives a price and never sends an email.'),
  step('b2', 'B', [1, 0], 'step', 'Quote form', 'Three short steps', 'ClipboardText', 'Moving from, Moving to and Target moving date, then the home or office size and the service, then contact details. Its third step posts the whole request to HP-01.'),

  step('c1', 'C', [0, 0], 'step', 'Search the guide', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the pricing guide and FAQ, which hold how a move is priced in words, and no rates.', ['supabase']),
  step('c2', 'C', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a price or a range, and never invents a date or a figure.', ['claude']),
  step('c3', 'C', [2, 0], 'decision', 'Sure from a passage?', 'The guide settles it', 'Question', 'Did a passage hold the answer? How an estimate works counts as yes. A damage claim, a booked move, an invoice or anything the guide does not say counts as no.'),
  step('c4', 'C', [3, 0], 'step', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes back in the chat with its passage. A live answer needs no one’s yes, and the bot never sends an email.'),
  step('c5', 'C', [4, 0], 'end', 'Start your estimate', 'The quote form', 'ClipboardText', 'Asked for a price, the bot says how an estimate is set and opens the quote form, or offers (555) 014-2200. A coordinator, not a bot, writes the range.'),
  step('c6', 'C', [3, 1], 'end', 'A person takes it', '(555) 014-2200', 'Phone', 'The bot gives the office’s phone and hello@harborandpine.example, with the hours. Damage claims always go to a person, and the bot forwards nothing.'),

  step('d1', 'D', [1, 0], 'step', 'Open the deal', 'Webhook, then HubSpot', 'Handshake', 'n8n catches the form’s third step, saves the contact and opens a deal in the Moves pipeline at New request, before Claude or anyone else touches it.', ['n8n', 'hubspot'], true),
  step('d2', 'D', [2, 0], 'ai', 'Price the move', 'Claude, a draft range', 'Sparkle', 'Claude drafts a low and a high figure from the rate card, with a line on why and flags: a specialty item, the ferry, beyond 20 miles, a long-distance run. For coordinators only.', ['claude', 'google-sheets']),
  step('d3', 'D', [3, 0], 'gate', 'Approve?', 'Coordinators’ group', 'UserCheck', 'An approval gate: the request and Claude’s draft wait in the coordinators’ Telegram group. Its button opens an n8n form, Approve, Edit or Walkthrough, and only the form’s submit moves on.', ['telegram']),
  step('d4', 'D', [4, 0], 'step', 'Send the estimate', 'Gmail, a template', 'EnvelopeSimple', 'The range the coordinator approved, or their own on Edit, emailed in their name the same working day: it holds unless the inventory changes, and no deposit holds a date.', ['gmail']),
  step('d5', 'D', [4, 1.5], 'step', 'Invite a walkthrough', 'Gmail and Cal.com', 'CalendarCheck', 'On Walkthrough, a fixed template in the coordinator’s name with a Cal.com link: on site, free within 20 miles of Bellhaven, or by video. It holds no range.', ['gmail', 'cal-com']),
  step('d6', 'D', [5, 0], 'end', 'Record the deal', 'HubSpot, then Telegram', 'FlagCheckered', 'The deal moves to Estimate sent or Walkthrough, owned by the coordinator who answered, and the group hears who took it.', ['hubspot', 'telegram']),

  step('e1', 'E', [2, 0], 'trigger', 'Walkthrough booked', 'Cal.com', 'CalendarPlus', 'n8n hears a booking on the On-site walkthrough or Video walkthrough page in Cal.com, with its time and the customer’s notes. One run for each.', ['cal-com', 'n8n'], true),
  step('e2', 'E', [3, 0], 'agent', 'Read the request', 'Deal, booking, guide', 'ClipboardText', 'Finds the deal by the booker’s email, the latest open one at Walkthrough, and asks the coordinator if there are two; then reads the booking’s notes and the guide on the town, ferry and specialty items.', ['hubspot', 'supabase']),
  step('e3', 'E', [4, 0], 'ai', 'Write the brief', 'Claude, no price', 'PencilSimple', 'Claude writes a short brief: what to count, the town and the 20-mile line, and any piano, ferry, crane or long-distance run to plan for. It holds no range and no figure.', ['claude']),
  step('e4', 'E', [5, 0], 'end', 'To the coordinator', 'Telegram, then logged', 'PaperPlaneTilt', 'The brief is posted in the coordinators’ group for the deal’s coordinator, never to the customer, and the run is logged in Agent runs.', ['telegram', 'google-sheets']),

  step('f1', 'F', [5, 0], 'step', 'Walk the move', 'With a lead mover', 'Footprints', 'The coordinator and a lead mover count rooms, stairs, access and parking, on site or over video, then the coordinator writes the estimate by hand and sends it the same day.'),
  step('f2', 'F', [6, 0], 'step', 'Book the move', 'HubSpot and Airtable', 'CalendarCheck', 'The customer says yes: the deal goes to Booked and the move into Moves by hand, with its crew and lead mover. No deposit holds a date; ferries, cranes and crating are planned by hand.', ['hubspot', 'airtable']),

  step('g1', 'G', [1, 0], 'trigger', 'Each day, 1 pm', 'Make schedule', 'Clock', 'Every day at 1:00 pm, Make starts the move-day run. The coordinators complete Monday’s moves before they close on Saturday.', ['make'], true),
  step('g2', 'G', [2, 0], 'step', 'Find tomorrow’s moves', 'Airtable API call', 'MagnifyingGlass', 'Make an API call lists tomorrow’s booked moves with no message yet, and always returns one list. An empty list tells the coordinators it is a quiet day.', ['airtable']),
  step('g3', 'G', [3, 0], 'decision', 'Crew set?', 'Router', 'ArrowsSplit', 'Is the crew arrival time, the lead mover and the customer’s email all filled in? The message is only worth sending with them.', ['make']),
  step('g4', 'G', [4, 0], 'step', 'Mark it sent', 'Moves, Airtable', 'ListChecks', 'Day-before sent is written on the move before the email goes, so a re-run never sends it twice.', ['airtable']),
  step('g5', 'G', [5, 0], 'step', 'Move-day message', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude: the crew’s arrival time, the lead mover’s name and number, the coordinator, and the transit window for a long-distance move. It sends on its own.', ['gmail'], true),
  step('g6', 'G', [4, 1.5], 'end', 'Ask the coordinator', 'Telegram', 'Warning', 'The move’s coordinator hears what is missing. Once they fill it in, they press Run once in Make, and only that move is messaged.', ['telegram']),

  step('h1', 'H', [5, 0], 'step', 'Load and deliver', 'The crew, by hand', 'Package', 'The lead mover and crew wrap, load, drive and set the home back up, then walk the inventory with the customer. Nothing is subcontracted.'),
  step('h2', 'H', [6, 0], 'end', 'Raise the invoice', 'Stripe, by hand', 'Receipt', 'After the move, the coordinator raises the invoice by hand in Stripe, with the move named on it, and the customer pays on Stripe’s own page.', ['stripe']),

  step('i1', 'I', [1, 0], 'trigger', 'Invoice overdue', '14 days, Stripe', 'Lightning', 'A Stripe automation sends invoice.overdue to an n8n webhook 14 days after an invoice’s due date. One run for each invoice.', ['stripe', 'n8n'], true),
  step('i2', 'I', [2, 0], 'agent', 'Read the invoice', 'Stripe, Moves, the log', 'ClipboardText', 'One tool call at a time: the amount due and payments in Stripe, the move it names and its coordinator in Moves, and any reminder already logged in Agent runs.', ['stripe', 'airtable']),
  step('i3', 'I', [3, 0], 'decision', 'Still owed?', 'And not yet reminded', 'Question', 'Is it still unpaid, with no reminder logged yet? Paid since, or already reminded once, and nothing is drafted for the customer.'),
  step('i4', 'I', [4, 0], 'ai', 'Draft the reminder', 'Claude, polite', 'PencilSimple', 'Claude drafts a short, polite reminder in the coordinator’s name: the invoice, the amount, the due date and its Stripe payment link. No fee and no discount.', ['claude']),
  step('i5', 'I', [5, 0], 'gate', 'The coordinator’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the draft waits in the coordinators’ group for the move’s coordinator, with an n8n form: Approve or Change it, and Coordinator. Nothing is sent until they approve.', ['telegram']),
  step('i6', 'I', [6, 0], 'end', 'Send the reminder', 'Gmail, then logged', 'PaperPlaneTilt', 'Gmail sends it from hello@harborandpine.example, and the run is logged in Agent runs with the coordinator’s yes. A reply reaches a person.', ['gmail', 'google-sheets']),
  step('i7', 'I', [4, 1.5], 'end', 'Tell the coordinator', 'Telegram, a log only', 'Bell', 'The coordinators hear the invoice is paid, already reminded or names no move, and a person calls if they choose. The run is logged in Agent runs.', ['telegram', 'google-sheets']),

  step('j1', 'J', [0, 0], 'trigger', 'A building asks', 'By email or phone', 'Buildings', 'A building’s management asks the move’s coordinator for a certificate of insurance before the move, with the holder and wording it needs.'),
  step('j2', 'J', [1, 0], 'step', 'Log the request', 'COI requests, by hand', 'Table', 'The coordinator gets the certificate from the insurer, attaches it to a row in COI requests and ticks Ready to check. No flow reaches the insurer.', ['airtable']),
  step('j3', 'J', [2, 0], 'step', 'Complete and ahead', 'Filter by Zapier', 'Funnel', 'Zapier starts on the tick and goes on only for a complete request, still Logged, whose move is still to come.', ['zapier'], true),
  step('j4', 'J', [3, 0], 'gate', 'Coordinator checks', 'Human in the Loop', 'UserCheck', 'An approval gate: the coordinator is emailed a link to a Zapier review page and approves or rejects the certificate there. Opening the link records nothing.', ['zapier']),
  step('j5', 'J', [4, 0], 'decision', 'Approved only', 'Logged, then filtered', 'Funnel', 'Approved or Rejected is written on the request first, then a Filter lets only an approved certificate go on.', ['airtable', 'zapier']),
  step('j6', 'J', [5, 0], 'end', 'Send to the building', 'Gmail, then Sent', 'EnvelopeSimple', 'A fixed template emails building management the checked certificate, copied to the coordinator, and the request is marked Sent.', ['gmail', 'airtable'], true),
  step('j7', 'J', [5, 1.5], 'end', 'Nothing sent', 'Rejected', 'XCircle', 'A rejected certificate never reaches the building. The coordinator asks the insurer again and logs the corrected one as a new request.'),

  step('k1', 'K', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed HP-01 run, and a webhook hears a failed Make or Zapier step in HP-02 or HP-03.', ['n8n'], true),
  step('k2', 'K', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab: the platform, the flow, the step, the error and a link to the run, never a customer’s details.', ['google-sheets']),
  step('k3', 'K', [2, 0], 'end', 'Alert the coordinators', 'Their Telegram group', 'Bell', 'The coordinators get an urgent Telegram message with a link to the run. Nothing retries on its own: they decide, or call Justine.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'])
const SIDE = new Set(['d5', 'g6', 'i7', 'j7'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  ...chain('c1', 'c2', 'c3'),
  flow('c3', 'c4', 'yes'),
  flow('c3', 'c6', 'no'),
  flow('c4', 'c5', 'wants a price'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'Approve or Edit'),
  flow('d3', 'd5', 'Walkthrough'),
  flow('d4', 'd6'),
  flow('d5', 'd6'),
  flow('d5', 'e1', 'booked'),
  flow('d6', 'f2', 'the customer says yes'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  flow('e4', 'f1'),
  flow('f1', 'f2'),
  flow('f2', 'g1', 'the day before'),
  ...chain('g1', 'g2', 'g3'),
  flow('g3', 'g4', 'Crew set'),
  flow('g3', 'g6', 'Not set'),
  flow('g4', 'g5'),
  flow('g5', 'h1'),
  flow('h1', 'h2'),
  flow('h2', 'i1', '14 days past due'),
  ...chain('i1', 'i2', 'i3'),
  flow('i3', 'i4', 'yes'),
  flow('i3', 'i7', 'no'),
  flow('i4', 'i5'),
  flow('i5', 'i6', 'approved'),
  loop('i5', 'i4', 'change it'),
  ...chain('j1', 'j2', 'j3', 'j4', 'j5'),
  flow('j5', 'j6', 'Approved'),
  flow('j5', 'j7', 'Rejected'),
  ...chain('k1', 'k2', 'k3'),
]

const endToEnd: EndToEnd = {
  title: 'Harbor & Pine Moving Co. · End-to-end workflow',
  description: 'Harbor & Pine Moving Co.’s whole system as one live graph: the Help-desk RAG bot, estimate requests a coordinator answers, the walkthrough brief, the day-before move message, the invoice reminder, certificates of insurance and a failed run reaching the coordinators.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · HARBOR & PINE',
  heading: 'From Get a free quote to the last box',
  lede: 'Every trigger, flow, bot and agent behind Harbor & Pine’s site, wired as one graph: a question answered from the pricing guide, an estimate request priced by a coordinator the same working day, a walkthrough prepared, a move booked by hand, the day-before message, the crew on the day, the invoice and its reminder, and a building’s certificate of insurance.',
  stance: `${YES} The site promises “Same-day written reply, no automated pricing bots”, so Claude’s range goes to the coordinators only, and the Help-desk RAG bot answers live, in the site chat only, never with a price. The move-day message is a fixed template and sends on its own, and a certificate reaches a building only after its coordinator checks it. Invoices are raised by hand, and a person handles every refund and damage claim. Ferries, cranes, crating and reviews are done by hand: no tool here reaches them.`,
  caption: 'Harbor & Pine, end to end · 11 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A question, a request, a move, an invoice or a certificate moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one question, request, move, invoice or certificate moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until a coordinator says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool estimate requests, the bot, both agents and the failed-run log run in.'],
      ['Make', 'The automation tool the move-day message runs in, with a Router that sends each move one of two ways.'],
      ['Zapier', 'The automation tool certificates of insurance run in, with a Filter and Human in the Loop.'],
      ['Webhook', 'A web address another tool posts to: the quote form to HP-01, Stripe’s invoice.overdue to the Billing follow-up agent, and failed Make and Zapier steps to HP-H02.'],
      ['Claude', 'Anthropic’s AI model. It drafts HP-01’s range for the coordinators only, and answers, plans and drafts in the bot and the two agents.'],
      ['HubSpot', 'Where every estimate request is a deal in the Moves pipeline, owned by the coordinator who answered.'],
      ['Cal.com', 'Where customers book an on-site or video walkthrough with a coordinator.'],
      ['Airtable', 'Where Harbor & Pine keeps booked moves, the team and certificate requests.'],
      ['Stripe', 'Where the coordinator raises each invoice by hand after the move, and where the customer pays it.'],
      ['Gmail', 'The office mailbox, hello@harborandpine.example, which sends every template and every reminder a coordinator approved.'],
      ['Telegram', 'The chat app where the coordinators’ group sees each request, approves drafts, reads walkthrough briefs and hears of a failed run.'],
      ['Supabase', 'The database that stores the passages the Help-desk RAG bot and the Walkthrough prep agent search.'],
      ['Google Sheets', 'Where the rate card, the Failed runs tab and the Agent runs tab are kept.'],
      ['Rate card', 'The coordinators’ own sheet of crew, truck, mileage, packing and specialty rates, kept by Marisol. Only HP-01 reads it.'],
      ['Template', 'A fixed message with blanks for the name, the coordinator, the time or the range a coordinator approved. No AI writes it.'],
      ['Passage', 'One section of the pricing guide or one FAQ answer, as the search returns it.'],
      ['Walkthrough', 'A coordinator counting rooms, stairs, access and parking, on site within 20 miles of Bellhaven or over video.'],
      ['Lead mover', 'The person who walks the house before anything is lifted and leads the crew on the day. The customer has their number.'],
      ['Human in the Loop', 'Zapier’s approval step: the coordinator gets an email link to a review page, and only their choice there counts.'],
      ['Agent runs', 'The Google Sheets tab that logs each agent run, with the coordinator’s yes.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed run from n8n, Make or Zapier, with no customer’s details.'],
      ['Approval gate', `A hard stop. ${YES}`],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Harbor & Pine is a fictional mover, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
