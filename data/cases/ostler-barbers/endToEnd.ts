/**
 * Ostler’s End-to-end case page (spec 2026-10-05 per-site pages): the shop’s
 * whole system as one graph of ten lanes, from a chair booked in a barber’s
 * own Cal.com book, a visitor’s question, a new member and a shelf order to
 * the hour in the chair, the freed-hour offer, the next-cut note and a failed
 * run reaching Tomas. It tells the same story as Ostler’s Automation, Build
 * plan and AI agents pages. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/ostler-barbers/end-to-end.html. Only type
 * imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The person’s-yes rule, word for word as on Ostler’s other pages. */
const YES = 'The client’s barber approves anything Claude drafts for a client’s inbox before it is sent.'

const LANES: Lane[] = [
  { id: 'A', name: 'Clients and visitors', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'No form: buttons and a chat.' },
  { id: 'C', name: 'Chair booking (OS-01)', note: 'n8n. Templates confirm.' },
  { id: 'D', name: 'Shop Q&A bot', note: 'Answers live, in the chat.' },
  { id: 'E', name: 'New membership (OS-02)', note: 'Make. The barber sets the slot.' },
  { id: 'F', name: 'Shelf order (OS-03)', note: 'Zapier. Picked by hand.' },
  { id: 'G', name: 'Chair gap agent', note: 'Waits for the barber’s yes.' },
  { id: 'H', name: 'Rebooking agent', note: 'Waits for the barber’s yes.' },
  { id: 'I', name: 'In the shop', note: 'People, by hand.' },
  { id: 'J', name: 'Failed runs (OS-H02)', note: 'n8n. Tomas hears.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Someone books', 'Book a chair', 'CalendarPlus', 'Someone presses Book a chair, or Book with Tomas, Jonah or Arun, and picks a service and an hour on that barber’s own Cal.com page.'),
  step('a2', 'A', [1, 0], 'trigger', 'A visitor asks', 'Day or night', 'ChatCircleText', 'A visitor opens the chat on Ostler’s site with a practical question, like what a taper costs or whether the shelf posts.'),
  step('a3', 'A', [2, 0], 'trigger', 'Someone joins', 'Become a member', 'UserPlus', 'Someone presses Become a member, picks a barber and pays £95 a month on that barber’s own Stripe Payment Link.'),
  step('a4', 'A', [3, 0], 'trigger', 'Someone shops', 'Add to bag', 'ShoppingBag', 'Someone adds Matte clay, Beard oil, Shave soap or Hair tonic to the bag and pays on Stripe’s own checkout page.'),

  step('b1', 'B', [0, 0], 'step', 'Barbers’ own books', 'Cal.com, per barber', 'CalendarCheck', 'Each barber keeps their own book: a Cal.com account each, one event type per service. Leo’s page offers the £34 apprentice cut, on Tuesdays and Wednesdays.', ['cal-com']),
  step('b2', 'B', [1, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat on every page of the site. It answers live from the shop’s own pages, and never sends an email.'),
  step('b3', 'B', [2, 0], 'step', 'Payment Links', 'Stripe, per barber', 'CreditCard', 'One £95 monthly Stripe Payment Link per barber, each marking its subscription with that barber’s name, so the cap of forty counts for the right chair.', ['stripe']),
  step('b4', 'B', [3, 0], 'step', 'The bag', 'Stripe checkout', 'Basket', 'The bag hands over to Stripe’s checkout: free UK delivery when the items come to more than £50, and Collect today until an hour before closing.', ['stripe']),

  step('c1', 'C', [0, 0], 'step', 'Hear the booking', 'Webhook', 'WebhooksLogo', 'n8n hears every booking made, moved or cancelled in any barber’s Cal.com book: the barber, the service, the time, and the client’s name and email.', ['n8n', 'cal-com'], true),
  step('c2', 'C', [1, 0], 'decision', 'What happened?', 'Switch', 'ArrowsSplit', 'Booked or Moved goes on to be saved as Booked; a move first marks its old time Moved, so it is never reminded, and saves the new time as a booking of its own. Cancelled frees the chair.', ['n8n']),
  step('c3', 'C', [2, 0], 'step', 'Save the booking', 'Bookings, Airtable', 'Database', 'Saved in Bookings, marked Booked, with the service’s list price. A Member’s cut or Member’s tidy, booked by the barber, has no price: membership covers it.', ['airtable']),
  step('c4', 'C', [3, 0], 'step', 'Confirm the chair', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude: the barber, the service, its price or Covered by your membership, the time, 6 Carrow Mews, and cancel up to 24 hours ahead at no charge.', ['gmail'], true),
  step('c5', 'C', [4, 0], 'step', 'Day-before reminder', 'Each day, 07:00', 'Bell', 'At 07:00 a fixed reminder goes to each booking for tomorrow still marked Booked, more than 24 hours ahead, while the free cancellation stands.', ['n8n', 'gmail'], true),
  step('c6', 'C', [2, 1.5], 'step', 'Free the chair', 'Cancelled, Airtable', 'Armchair', 'The booking is marked Cancelled, with Freed on. Cal.com has already opened the hour again in the barber’s book, and nothing is charged, whenever it comes.', ['airtable']),
  step('c7', 'C', [3, 1.5], 'end', 'Tell the front room', 'Telegram', 'PaperPlaneTilt', 'The Front room group on Telegram hears whose chair is free, and when, while there is still time to fill it.', ['telegram']),

  step('d1', 'D', [0, 0], 'step', 'Search the pages', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the shop’s own pages: the services and prices, the barbers, the visit, membership and the shelf.', ['supabase']),
  step('d2', 'D', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a price, a time or a figure the pages do not hold.', ['claude']),
  step('d3', 'D', [2, 0], 'decision', 'Sure from a page?', 'A page settles it', 'Question', 'Did a page hold the answer? A particular free hour, a paid order, a refund, leaving the membership or anything the pages do not say counts as no.'),
  step('d4', 'D', [3, 0], 'step', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes back in the chat with its page. A live answer needs no one’s yes, and the bot never sends an email.'),
  step('d5', 'D', [4, 0], 'end', 'Book a chair', 'The barber’s page', 'CalendarCheck', 'The bot opens Book a chair, or the named barber’s Cal.com page, where their free hours are. It books nothing itself.', ['cal-com']),
  step('d6', 'D', [3, 1], 'end', 'Call the shop', '020 7946 0381', 'Phone', 'The bot gives the shop’s phone, 020 7946 0381, with the hours. A person in the front room answers, and the bot forwards nothing.'),

  step('e1', 'E', [0, 0], 'trigger', 'New membership', 'Stripe', 'CreditCard', 'Make hears a new £95 subscription from a barber’s Payment Link, with the barber’s name and the member’s name and email.', ['stripe', 'make'], true),
  step('e2', 'E', [1, 0], 'step', 'Count their members', 'Airtable API call', 'Calculator', 'Make an API call lists that barber’s members marked Awaiting slot or Standing, and always returns one list, even an empty one, so a first member counts from 0.', ['airtable']),
  step('e3', 'E', [2, 0], 'decision', 'Room under forty?', 'Router', 'ArrowsSplit', 'The member is saved in Members, Awaiting slot under forty or Waiting list at forty, and the Router takes the Room or the Full route.', ['make']),
  step('e4', 'E', [3, 0], 'step', 'Welcome template', 'Gmail, then Telegram', 'EnvelopeSimple', 'A fixed welcome: £95 a month, cancel any month, and that their barber will be in touch. The Front room group hears a slot is waiting to be set.', ['gmail', 'telegram'], true),
  step('e5', 'E', [4, 0], 'step', 'Barber sets the slot', 'By hand', 'UserCheck', 'The barber agrees the standing hour, every three or four weeks, books it in their own Cal.com book as a Member’s cut and marks the member Standing, all by hand.', ['cal-com', 'airtable']),
  step('e6', 'E', [3, 1.5], 'end', 'On the waiting list', 'Template, shop told', 'Hourglass', 'A fixed note says the barber has forty and they are on the waiting list, and the shop is told to call them. Any refund is made by a person, by hand, in Stripe.', ['gmail', 'telegram']),

  step('f1', 'F', [0, 0], 'trigger', 'Shelf checkout', 'Stripe', 'CreditCard', 'Zapier hears a paid Stripe checkout, and its Filter keeps only those from the bag, never a membership.', ['stripe', 'zapier'], true),
  step('f2', 'F', [1, 0], 'step', 'Add to the pick list', 'Orders, Airtable', 'Package', 'The order is saved in Orders, marked To pick: the items, the delivery charge, the total, and UK delivery or Collect today.', ['airtable']),
  step('f3', 'F', [2, 0], 'step', 'Order email', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude: what they bought, the total, and on its way by UK delivery, free over £50, or ready to collect from 6 Carrow Mews today.', ['gmail'], true),
  step('f4', 'F', [3, 0], 'decision', 'Collect or post?', 'Paths by Zapier', 'ArrowsSplit', 'Only a same-day collection needs the shop to act at once. A parcel waits on the pick list.', ['zapier']),
  step('f5', 'F', [4, 1.5], 'step', 'Alert the front room', 'Telegram', 'Bell', 'The Front room group hears a bag is coming to be collected today, with the name and the items.', ['telegram']),
  step('f6', 'F', [5, 0], 'end', 'Picked by hand', 'The To pick view', 'Package', 'Not a Zapier step: someone in the shop sets a collection aside behind the counter, then marks it Collected, or packs and posts a parcel, then marks it Posted.', ['airtable']),

  step('g1', 'G', [0, 0], 'trigger', 'A chair is freed', 'Bookings, Cancelled', 'Armchair', 'n8n hears a Bookings row OS-01 has just marked Cancelled: the barber, the day, the time and the service. One run for each freed hour.', ['n8n', 'airtable'], true),
  step('g2', 'G', [1, 0], 'decision', 'Fri or Sat evening?', 'From 17:00', 'ArrowsSplit', 'Members’ first refusal is on Friday and Saturday evenings, here an hour from 17:00, the line Tomas sets. Any other hour goes to the barber’s waiting list alone.'),
  step('g3', 'G', [2, 1.5], 'agent', 'Members first', 'Members, Airtable', 'UsersThree', 'The barber has held the hour by hand, with a Cal.com date override, since the Front room’s ping. Reads that barber’s members, Standing or Awaiting slot. With none, or if no member has booked it two hours after their offer, a wait Tomas sets, a second run turns to the waiting list. It checks Bookings, not Cal.com, since the held hour never shows as free.', ['airtable', 'cal-com']),
  step('g4', 'G', [3, 0], 'agent', 'The waiting list', 'Waiting list, Airtable', 'Hourglass', 'Reads the people on that barber’s Waiting list, who joined when the barber had forty. With nobody on it, nothing is drafted, the run is logged and the hour stays open.', ['airtable']),
  step('g5', 'G', [4, 0], 'ai', 'Draft the offer', 'Claude, one note', 'PencilSimple', 'Claude drafts the offer: the barber, the day and the hour, with reply to claim it for a held hour, or a link to the barber’s Cal.com page. The members’ offer and any second one to the waiting list are drafted apart.', ['claude']),
  step('g6', 'G', [5, 0], 'gate', 'The barber’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: every offer, the second one to the waiting list too, waits in the barber’s Telegram with Approve and Change it. Nothing is sent until they tap Approve.', ['telegram']),
  step('g7', 'G', [6, 0], 'end', 'Send the offer', 'Gmail, then logged', 'PaperPlaneTilt', 'Gmail sends it, one email each, and the run is logged in Agent runs. A held hour goes to the member who replies, booked by the barber by hand; otherwise the first to book on the barber’s page gets it. A member who takes a freed hour uses their Member’s cut if one is due, and otherwise pays the list price at the counter: that is Tomas’s call.', ['gmail', 'google-sheets']),

  step('h1', 'H', [0, 0], 'trigger', 'Each morning', '09:00, on a schedule', 'Clock', 'At 09:00, London time, an hour Tomas sets, n8n finds each booking from three weeks before marked Booked for a cut, the Ostler cut, Taper & fade, Long hair & scissor work, the Signature or the Apprentice cut, so never a shave on its own, a beard shape or a member’s visit, and starts one run for each.', ['n8n'], true),
  step('h2', 'H', [1, 0], 'agent', 'Read the cut', 'Bookings, Airtable', 'ClipboardText', 'One tool call at a time: the cut in Bookings, the client’s email, and any booking they have made since, then whether that email is in Members.', ['airtable']),
  step('h3', 'H', [2, 0], 'decision', 'Booked again?', 'Or a member', 'Question', 'Has the client booked again, or are they in Members as Standing, Awaiting slot or Waiting list? Then there is nothing to send. A client marked Ended is no longer a member, and goes on.'),
  step('h4', 'H', [3, 0], 'ai', 'Draft the note', 'Free times, Claude', 'PencilSimple', 'Claude reads the barber’s free times for the week ahead in Cal.com and drafts a short “your next cut” note with three of them and the barber’s booking link.', ['cal-com', 'claude']),
  step('h5', 'H', [4, 0], 'gate', 'The barber’s yes', 'Approve in Telegram', 'UserCheck', 'The note is for a client’s inbox, so it waits for the client’s barber in Telegram with Approve and Change it. Nothing is sent until they tap Approve.', ['telegram']),
  step('h6', 'H', [5, 0], 'end', 'Send the note', 'Gmail, then logged', 'PaperPlaneTilt', 'Gmail sends the approved note from the shop’s address, and the run is logged in Agent runs with the barber’s yes. A reply reaches a person in the shop.', ['gmail', 'google-sheets']),
  step('h7', 'H', [3, 1.5], 'end', 'Nothing to send', 'A log only', 'CheckCircle', 'A client who has booked again, or a member, gets no note. The run ends with a line in Agent runs.', ['google-sheets']),

  step('i1', 'I', [0, 0], 'step', 'In the chair', 'The hour, on time', 'Scissors', 'The client sits with their barber: ten minutes at the mirror, the work, a hot towel. For a member, it is their standing hour, booked as a Member’s cut.'),
  step('i2', 'I', [1, 0], 'end', 'Paid at the counter', 'The till, by hand', 'CashRegister', 'A cut is paid at the counter, by hand. Refills, gift cards, reviews and The Ostler Letter are by hand too: no tool here reaches the till, a review site or the letter.'),

  step('j1', 'J', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed OS-01 run, and a webhook hears a failed Make or Zapier step in OS-02 or OS-03.', ['n8n'], true),
  step('j2', 'J', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab: the platform, the flow, the step, the error and a link to the run, never a client’s details.', ['google-sheets']),
  step('j3', 'J', [2, 0], 'end', 'Alert Tomas', 'His own Telegram', 'Bell', 'Tomas gets an urgent Telegram message with a link to the run. Nothing retries on its own: he decides, or calls Justine.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'E', 'F', 'G', 'H', 'I', 'J'])
const SIDE = new Set(['c6', 'c7', 'e6', 'f5', 'g3', 'h7'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('a3', 'b3'),
  flow('a4', 'b4'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  flow('b3', 'e1'),
  flow('b4', 'f1'),
  flow('c1', 'c2'),
  flow('c2', 'c3', 'Booked'),
  flow('c2', 'c6', 'Cancelled'),
  flow('c3', 'c4'),
  flow('c4', 'c5'),
  flow('c6', 'c7'),
  flow('c6', 'g1'),
  flow('c5', 'i1'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'yes'),
  flow('d3', 'd6', 'no'),
  flow('d4', 'd5', 'wants to book'),
  ...chain('e1', 'e2', 'e3'),
  flow('e3', 'e4', 'Room'),
  flow('e3', 'e6', 'Full'),
  flow('e4', 'e5'),
  flow('e5', 'c1', 'a Member’s cut'),
  ...chain('f1', 'f2', 'f3', 'f4'),
  flow('f4', 'f6', 'UK delivery'),
  flow('f4', 'f5', 'Collect today'),
  flow('f5', 'f6'),
  flow('g1', 'g2'),
  flow('g2', 'g4', 'no'),
  flow('g2', 'g3', 'yes'),
  flow('g3', 'g4', 'none, or 2h on'),
  flow('g3', 'g5', 'members'),
  flow('g4', 'g5'),
  flow('g5', 'g6'),
  flow('g6', 'g7', 'approved'),
  loop('g6', 'g5', 'change it'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'h4', 'no'),
  flow('h3', 'h7', 'yes'),
  flow('h4', 'h5'),
  flow('h5', 'h6', 'approved'),
  loop('h5', 'h4', 'change it'),
  flow('i1', 'i2'),
  flow('i1', 'h1', 'three weeks on'),
  ...chain('j1', 'j2', 'j3'),
]

const endToEnd: EndToEnd = {
  title: 'Ostler · End-to-end workflow',
  description: 'Ostler’s whole system as one live graph: chair bookings in each barber’s own book, the Shop Q&A bot, the chair gap and rebooking agents, new memberships, shelf orders, the hour in the chair and a failed run reaching Tomas.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · OSTLER',
  heading: 'From Book a chair to the next cut',
  lede: 'Every trigger, flow, bot and agent behind Ostler’s site, wired as one graph: a chair booked in a barber’s own book, confirmed and reminded, a freed hour offered on, a visitor’s questions, a new member held to their barber’s forty, a shelf order picked by hand, the hour in the chair and the note that suggests the next one.',
  stance: `${YES} Templated confirmations, reminders, welcomes and order emails send on their own, and the Shop Q&A bot answers live, in the site chat only. Every payment is made on Stripe’s own pages, and any refund is made by a person, by hand. Reviews, The Ostler Letter, gift cards and the till are done by hand: no tool here reaches them.`,
  caption: 'Ostler, end to end · 10 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A booking, a question, a member, an order or a freed hour moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one booking, question, member or order moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until the client’s barber says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool chair bookings, the Shop Q&A bot, both agents and the failed-run log run in.'],
      ['Make', 'The automation tool new memberships run in, with a Router that sends each member one of two ways.'],
      ['Zapier', 'The automation tool shelf orders run in, with Paths for a collection and a parcel.'],
      ['Webhook', 'A web address Cal.com calls the moment a booking is made, moved or cancelled, which starts OS-01.'],
      ['Claude', 'Anthropic’s AI model. It answers, plans and drafts in the bot and the two agents. None of the three flows uses it.'],
      ['Cal.com', 'The booking tool where each barber keeps their own book, one account and one event type per service.'],
      ['Stripe', 'Where members pay on a Payment Link and the bag is paid at checkout. Any refund is made there by hand.'],
      ['Payment Link', 'A Stripe page for one barber’s £95 membership, which marks the subscription with that barber’s name.'],
      ['Airtable', 'Where Ostler keeps Bookings, Members and Orders, written by the three flows and read by the agents.'],
      ['Gmail', 'The shop’s own mailbox, which sends every template and every note a barber has approved.'],
      ['Telegram', 'The chat app where the Front room group hears freed chairs and collections, barbers approve drafts, and Tomas hears of a failed run.'],
      ['Front room', 'The shop’s Telegram group, which every barber is in, for freed chairs, new members and same-day collections.'],
      ['Supabase', 'The database that stores the passages the Shop Q&A bot searches.'],
      ['Google Sheets', 'Where the Failed runs and Agent runs tabs are kept, one row per failure or agent run.'],
      ['Template', 'A fixed message with blanks for the name, barber, time and price. No AI writes it, so it may send alone.'],
      ['Passage', 'One service, term or shelf item cut from the shop’s pages, as the search returns it.'],
      ['Member’s cut', 'A member’s own visit, booked by their barber with no price, as membership covers it, like a Member’s tidy between cuts.'],
      ['Standing', 'A member with a standing hour in their barber’s book, every three or four weeks.'],
      ['Waiting list', 'The members who joined a barber who already had forty, and have no standing slot yet. They are offered a freed hour at any time but a Friday or Saturday evening, and on those evenings after the members.'],
      ['First refusal', 'On Friday and Saturday evenings, the barber holds a freed hour by hand and offers it to their members before the waiting list.'],
      ['Free times', 'The open hours in a barber’s Cal.com book, read by the agents and never changed by them.'],
      ['To pick', 'The Orders view the shop works as its pick list, until an order is Collected or Posted.'],
      ['Collect today', 'Picking a shelf order up from 6 Carrow Mews the same day, offered until an hour before closing.'],
      ['Agent runs', 'The Google Sheets tab that logs each agent run, with the barber’s yes.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed run from n8n, Make or Zapier, with no client’s details.'],
      ['Approval gate', `A hard stop. ${YES}`],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Ostler is a fictional barbershop, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
