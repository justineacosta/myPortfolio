/**
 * Oriel’s End-to-end case page (spec 2026-10-05 per-site pages): Oriel’s whole
 * system as one graph of eleven lanes, from a visitor’s first question to the
 * model the owners keep after handover. It tells the same story as Oriel’s
 * Automation, Build plan and AI agents pages. data/cases/index.ts registers
 * it; `npm run cases` renders it into
 * public/cases/oriel-portugal-residences/end-to-end.html. Only type imports,
 * so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

const LANES: Lane[] = [
  { id: 'A', name: 'Visitor', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'Three ways in.' },
  { id: 'C', name: 'Viewing request (OR-01)', note: 'n8n. A template confirms.' },
  { id: 'D', name: 'Studio inbox (OR-02)', note: 'Make. People reply.' },
  { id: 'E', name: 'Model revisions (OR-03)', note: 'Zapier. An architect approves.' },
  { id: 'F', name: 'Residence Q&A bot', note: 'Answers from the sheets.' },
  { id: 'G', name: 'Viewing brief agent', note: 'For the architect only.' },
  { id: 'H', name: 'The viewing', note: 'Ninety minutes, walked.' },
  { id: 'I', name: 'Buyer follow-up agent', note: 'Waits for a yes.' },
  { id: 'J', name: 'Reservation', note: 'People, by hand.' },
  { id: 'K', name: 'Owner record', note: 'The model, kept.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Requests a viewing', 'Private viewing form', 'CalendarPlus', 'Someone answers the one form on Oriel’s site: name, email, which residence and where, then presses Request a viewing.'),
  step('a2', 'A', [1, 0], 'trigger', 'Writes to the studio', 'Contact the studio', 'EnvelopeSimple', 'Someone presses Contact the studio and writes an email: a buyer, an owner after handover, the press, a supplier or someone asking for a job.'),
  step('a3', 'A', [2, 0], 'trigger', 'Asks a question', 'In the site chat', 'ChatCircleText', 'Someone asks about a residence in the chat, like how much winter sun a living room gets, long before they walk its model.'),

  step('b1', 'B', [0, 0], 'step', 'Viewing form', 'Four questions', 'Browser', 'The form at #viewing sends its four answers to n8n the moment it is sent. The page promises a reply within one working day.', ['n8n']),
  step('b2', 'B', [1, 0], 'step', 'Studio email link', 'studio@oriel.pt', 'At', 'A plain email link, so the message lands in the studio’s Gmail inbox and nowhere else.', ['gmail']),
  step('b3', 'B', [2, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat window on every page of the site. It answers live, and it never sends an email.'),

  step('c1', 'C', [0, 0], 'ai', 'Qualify the request', 'Claude reads HubSpot', 'Sparkle', 'The form’s webhook starts n8n. Claude checks HubSpot for a past viewing or an owner, and writes one line for the architect only.', ['claude', 'hubspot']),
  step('c2', 'C', [1, 0], 'step', 'Match the architect', 'Or the one on duty', 'IdentificationBadge', 'The project architect for the residence named, from Airtable. Not sure yet goes to the architect on duty that week, who can open all four models.', ['airtable']),
  step('c3', 'C', [2, 0], 'step', 'Hold a viewing', 'First free 90 min', 'CalendarCheck', 'Holds the first free ninety-minute slot in that architect’s Cal.com calendar, from the next working day. The buyer can move it.', ['cal-com']),
  step('c4', 'C', [3, 0], 'decision', 'Where?', 'Which place?', 'ArrowsSplit', 'Sends a studio viewing straight to the confirmation, and a home viewing to the headset first.'),
  step('c5', 'C', [4, 0.5], 'step', 'Send the headset', 'Courier, day before', 'VirtualReality', 'A courier brings a headset with the model loaded the day before the viewing, and collects it the day after.'),
  step('c6', 'C', [5, 0], 'step', 'Confirm the viewing', 'Within a working day', 'EnvelopeSimple', 'A fixed template, not Claude, emails the date, time, architect and place, and the viewing is logged in HubSpot. It sends on its own.', ['gmail', 'hubspot'], true),

  step('d1', 'D', [0, 1.5], 'step', 'Watch the inbox', 'Make, every 15 min', 'Tray', 'Make checks studio@oriel.pt in Gmail every quarter of an hour, on its own, and picks up each new email from outside Oriel.', ['make', 'gmail'], true),
  step('d2', 'D', [1, 1.5], 'ai', 'Sort the email', 'Claude names its kind', 'Sparkle', 'Claude reads the email, names its kind, writes a one-line summary and picks out the residence, if one is named.', ['claude']),
  step('d3', 'D', [2, 1.5], 'decision', 'Router', 'Which kind?', 'ArrowsSplit', 'Make’s router sends each email down the route for its kind. Anything that fits no route goes to a person.'),
  step('d4', 'D', [3, 0], 'end', 'Log the buyer', 'HubSpot, sales task', 'Handshake', 'The buyer goes into HubSpot with a request, and sales gets a task to answer and offer a viewing by the next working day.', ['hubspot']),
  step('d5', 'D', [3, 1], 'end', 'Pass it on', 'Press, site, hiring', 'ShareFat', 'Press goes to Inês and Tomás on Telegram, a supplier to the residence’s site team, and an application to the Hiring table.', ['telegram', 'airtable']),
  step('d6', 'D', [3, 2], 'end', 'Flag for a person', 'Claude is not sure', 'Question', 'Anything Claude cannot place is labelled Check and left unread, so a person decides. Nothing here writes back to the sender.', ['gmail']),
  step('d7', 'D', [3, 3], 'step', 'Open a care request', 'An owner writes', 'House', 'An owner after handover gets a care request in Airtable, linked to their home, for its project team.', ['airtable']),

  step('e1', 'E', [0, 0], 'trigger', 'New model revision', 'Airtable row', 'Cube', 'The studio adds a row to the Revisions table when a residence’s model changes, and the Zap starts.', ['airtable']),
  step('e2', 'E', [1, 0], 'step', 'Find who walked it', 'Viewings in HubSpot', 'UsersThree', 'Finds everyone with a walked viewing of that residence in HubSpot, including buyers who said not now.', ['hubspot']),
  step('e3', 'E', [2, 0], 'ai', 'Write the note', 'Claude, plain words', 'Sparkle', 'Claude turns the change log into a short note: which rooms changed, what changed and what it means for living there.', ['claude']),
  step('e4', 'E', [3, 0], 'gate', 'Approved?', 'Architect, review page', 'UserCheck', 'A Telegram message tells the project architect a note waits on Zapier’s review page, which sends its own link. They approve the note or reject it to rewrite. No answer, nothing sent.', ['zapier', 'telegram']),
  step('e5', 'E', [4, 0.5], 'step', 'Architect rewrites', 'In their own words', 'PencilSimple', 'The architect writes the note as it should read, starting from Claude’s draft. Only their words go out.', ['zapier']),
  step('e6', 'E', [5, 0], 'step', 'Send to each buyer', 'By name, from studio', 'PaperPlaneTilt', 'Each person who walked it gets the approved note by name from studio@oriel.pt, and it is logged on their HubSpot contact.', ['gmail', 'hubspot']),

  step('f1', 'F', [0, 0], 'step', 'Search the documents', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the residence sheets, revision notes, journal and studio FAQs.', ['supabase']),
  step('f2', 'F', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. Oriel publishes no prices, so it never gives one.', ['claude']),
  step('f3', 'F', [2, 0], 'decision', 'Sure?', 'The sheet says so', 'Question', 'Did the passages hold the answer? A price, or a date the sheet does not give, counts as no. The bot never guesses.'),
  step('f4', 'F', [3, 0], 'step', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes straight back in the chat with the sheet or note it came from, so the buyer can check it. A live answer cannot wait for a yes.'),
  step('f5', 'F', [4, 0], 'step', 'Book a viewing', 'Submits the form', 'CalendarCheck', 'When someone wants to walk it, the bot asks the form’s four questions and submits the viewing form, so OR-01 books it.'),
  step('f6', 'F', [3, 1], 'end', 'Hand to the studio', 'A HubSpot task', 'UserSwitch', 'The bot asks for an email and the whole chat goes to HubSpot as a task. A person replies within one working day.', ['hubspot']),
  step('f7', 'F', [5, 1], 'end', 'Index the new note', 'The bot reads it next', 'Database', 'The approved revision note is split, embedded and stored in Supabase, so the bot answers from the model’s latest revision.', ['supabase']),

  step('g1', 'G', [0, 0], 'step', 'Evening before', '6 pm, on a schedule', 'Clock', 'At 6 pm n8n starts the agent once for each viewing booked for the next day. A schedule runs it, not anyone remembering.', ['n8n'], true),
  step('g2', 'G', [1, 0], 'agent', 'Gather the facts', 'Cal.com and HubSpot', 'Wrench', 'One tool call at a time: the booking, the buyer’s HubSpot history, the residence’s rooms and anything they asked the bot.', ['cal-com', 'hubspot']),
  step('g3', 'G', [2, 0], 'ai', 'Write the brief', 'Who, why, which rooms', 'Sparkle', 'Claude writes the walking architect a short brief: who is coming, what they asked and which rooms to start in.', ['claude']),
  step('g4', 'G', [3, 0], 'step', 'Brief to the architect', 'In Telegram', 'PaperPlaneTilt', 'The brief goes to the architect only, in Telegram, and is logged on the buyer’s contact. It never reaches a buyer, so it needs no yes.', ['telegram']),

  step('h1', 'H', [0, 0], 'step', 'Walk the model', '90 min, an architect', 'VirtualReality', 'The buyer walks the residence’s model for about ninety minutes, at the studio or at home with the headset, with an architect from the project.'),
  step('h2', 'H', [1, 0], 'step', 'Notes in HubSpot', 'Rooms and questions', 'Notebook', 'Afterwards the architect logs the rooms they walked and the questions raised, and moves the viewing to Walked.', ['hubspot']),

  step('i1', 'I', [0, 0], 'agent', 'Read the viewing', 'Notes and history', 'ClipboardText', 'The architect’s notes start the agent. Claude reads them with the buyer’s HubSpot history and anything said before.', ['hubspot']),
  step('i2', 'I', [1, 0], 'agent', 'Check the rooms', 'Sheet and revisions', 'Ruler', 'It checks each room and question raised against the residence sheet and the model’s latest revision in Airtable.', ['airtable']),
  step('i3', 'I', [2, 0], 'ai', 'Draft the follow-up', 'Rooms and questions', 'PencilSimple', 'Claude drafts a follow-up that names the rooms they walked and answers the questions they raised, from the sheet only.', ['claude']),
  step('i4', 'I', [3, 0], 'gate', 'Architect’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the draft waits in Telegram with Approve and Edit. Nothing is sent until the architect taps Approve.', ['telegram']),
  step('i5', 'I', [4, 0], 'step', 'Email the buyer', 'From the studio', 'EnvelopeSimple', 'The approved follow-up goes from studio@oriel.pt and is logged on the buyer’s HubSpot contact.', ['gmail', 'hubspot']),

  step('j1', 'J', [0, 0], 'decision', 'Ready to reserve?', 'The buyer’s answer', 'Signpost', 'The buyer answers the follow-up. Reserving goes to sales. Not now goes back to follow-up later, and they still hear about every revision.'),
  step('j2', 'J', [1, 0], 'step', 'Reserve a residence', 'Sales, by hand', 'Signature', 'Sales takes the reservation, the contract and the deposit by hand, outside the flows, and moves the viewing to Reserved.', ['hubspot']),
  step('j3', 'J', [2, 0], 'step', 'Built in stone', 'Following the model', 'Buildings', 'The residence is built as the model shows. Every change on the way is a new revision, so everyone who walked it hears.'),
  step('j4', 'J', [3, 0], 'step', 'Handover', 'Keys and the model', 'Key', 'The owners get their keys and the model of their home, with every approved revision in it.'),

  step('k1', 'K', [0, 0], 'step', 'The owners’ model', 'Kept after handover', 'Cube', 'The walkable model stays with the owners as their record of what sits behind every wall: pipes, cables and structure.'),
  step('k2', 'K', [1, 0], 'step', 'Team opens the model', 'For a care request', 'Wrench', 'When an owner writes, the project team opens the model to see what sits behind the wall before anyone visits.'),
  step('k3', 'K', [2, 0], 'end', 'A person replies', 'From the model', 'ChatCircleText', 'A person from the project team answers the owner, with what the model shows. Nothing here is drafted by AI.'),
]

/** Lanes whose steps read in order, one per column, carry numbers. */
const NUMBERED = new Set<LaneId>(['C', 'E', 'G', 'H', 'I', 'J', 'K'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('a3', 'b3'),
  flow('b1', 'c1'),
  flow('b3', 'f1'),
  flow('b2', 'd1'),
  ...chain('c1', 'c2', 'c3', 'c4'),
  flow('c4', 'c6', 'at the studio'),
  flow('c4', 'c5', 'at home'),
  flow('c5', 'c6'),
  flow('c6', 'g1'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'buyer'),
  flow('d3', 'd5'),
  flow('d3', 'd6'),
  flow('d3', 'd7', 'owner'),
  flow('d7', 'k2'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  flow('e4', 'e6', 'approve'),
  flow('e4', 'e5', 'rewrite'),
  flow('e5', 'e6'),
  flow('e6', 'f7'),
  ...chain('f1', 'f2', 'f3'),
  flow('f3', 'f4', 'yes'),
  flow('f3', 'f6', 'no'),
  flow('f4', 'f5', 'to walk it'),
  flow('f5', 'c1'),
  ...chain('g1', 'g2', 'g3', 'g4'),
  flow('g4', 'h1'),
  flow('h1', 'h2'),
  flow('h2', 'i1'),
  ...chain('i1', 'i2', 'i3', 'i4'),
  flow('i4', 'i5', 'approved'),
  loop('i4', 'i3', 'change it'),
  flow('i5', 'j1'),
  flow('j1', 'j2', 'reserves'),
  loop('j1', 'i1', 'not now'),
  ...chain('j2', 'j3', 'j4'),
  flow('j4', 'k1'),
  ...chain('k1', 'k2', 'k3'),
]

const endToEnd: EndToEnd = {
  title: 'Oriel · End-to-end workflow',
  description: 'Oriel’s whole system as one live graph: the viewing form, the studio inbox, model revisions, the Q&A bot and the two viewing agents, from a first question to the owners’ model.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · ORIEL',
  heading: 'From a first question to the owners’ model',
  lede: 'Every trigger, flow, bot and agent behind Oriel’s site, wired as one graph: a buyer’s first question, the viewing, the follow-up, the reservation and the model the owners keep.',
  stance: 'An architect approves anything Claude drafts for a buyer’s inbox.',
  caption: 'Oriel, end to end · 11 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => (NUMBERED.has(s.lane) ? { ...s, n: s.at[0] + 1 } : s)),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A buyer, an email or a change moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one request, email, question or revision moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until the project architect says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the viewing flow and both agents run in: triggers, branches and actions, wired as nodes.'],
      ['Make', 'The automation tool the studio inbox runs in, with a router that sends each email down its own route.'],
      ['Zapier', 'The automation tool the revision notice runs in, with a review page for the architect.'],
      ['Webhook', 'A web address the form calls the moment it is sent, which starts the viewing flow.'],
      ['Claude', 'Anthropic’s AI model. It qualifies, sorts, drafts and answers here, and never sends an email on its own.'],
      ['HubSpot', 'The CRM where Oriel keeps every buyer, their viewings and what they have been told.'],
      ['Airtable', 'Where the studio keeps its projects, the duty rota, the revisions and the care requests.'],
      ['Cal.com', 'The booking tool that holds each architect’s calendar and the ninety-minute viewing slots.'],
      ['Gmail', 'The studio’s mailbox, studio@oriel.pt, that confirmations, notes and follow-ups are sent from.'],
      ['Telegram', 'The chat app where architects get briefs and approve drafts, and the founders hear from the press.'],
      ['Supabase', 'The database that stores the passages the Q&A bot searches.'],
      ['Template', 'A fixed message with blanks for the date, time and place. No AI writes it, so it may send alone.'],
      ['Architect on duty', 'The architect who walks the Not sure yet viewings that week, and can open all four models.'],
      ['Headset', 'The virtual reality headset a courier brings for a home viewing, with the model loaded.'],
      ['Router', 'The step in Make that sends each email down the route for its kind.'],
      ['Care request', 'What an owner asks after handover, opened for the project team in Airtable.'],
      ['Model revision', 'A recorded change to a residence’s model, one row in the Revisions table.'],
      ['Review page', 'A page Zapier hosts where the architect approves a note or rejects it to rewrite.'],
      ['Approval gate', 'A hard stop. Nothing AI-written reaches a buyer’s inbox until the architect says yes.'],
      ['Residence sheet', 'One document per residence: rooms, sizes, aspect, sun hours, materials and status.'],
      ['Embed', 'Turn a piece of text into numbers that capture its meaning, so similar ideas can be found.'],
      ['Passage', 'A room or a change cut from a longer document, as the search returns it.'],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
      ['Handover', 'The day the owners get their keys, and the model of their home with them.'],
      ['Owners’ model', 'The walkable model kept after handover: the record of what sits behind every wall.'],
    ],
  },
  footer: { note: 'A worked example. Oriel is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
