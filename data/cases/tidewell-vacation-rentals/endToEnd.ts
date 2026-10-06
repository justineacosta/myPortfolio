/**
 * Tidewell’s End-to-end case page (spec 2026-10-05 per-site pages): Tidewell’s
 * whole system as one graph of ten lanes, from an owner’s assessment request
 * and a guest’s question to the statement and the payout. It tells the same
 * story as Tidewell’s Automation, Build plan and AI agents pages.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/tidewell-vacation-rentals/end-to-end.html. Only type imports,
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
  { id: 'A', name: 'Owners and guests', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'Two ways in.' },
  { id: 'C', name: 'Assessment (TW-01)', note: 'n8n. A template confirms.' },
  { id: 'D', name: 'Repair approval (TW-02)', note: 'Make. The owner says yes.' },
  { id: 'E', name: 'Monthly statement (TW-03)', note: 'Zapier. A manager approves.' },
  { id: 'F', name: 'Guest help bot', note: 'Answers from the guides.' },
  { id: 'G', name: 'Rate watch agent', note: 'Waits for a yes.' },
  { id: 'H', name: 'Review reply agent', note: 'Waits for a yes.' },
  { id: 'I', name: 'The manager', note: 'Eighteen homes at most.' },
  { id: 'J', name: 'Payout', note: 'People, by hand.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'An owner asks', 'For an assessment', 'House', 'An owner fills in the one form on Tidewell’s site, a property address or town and an email, and presses Get a property assessment.'),
  step('a2', 'A', [1, 0], 'trigger', 'A guest asks', 'Day or night', 'ChatCircleText', 'A guest opens Guest help on the site with a question, like whether they can bring the dog, often from the car on the way.'),

  step('b1', 'B', [0, 0], 'step', 'Assessment form', 'Two fields', 'Browser', 'The form sends the address and the email to an n8n webhook the moment it is sent. It asks nothing else, so the flow works from those two.', ['n8n']),
  step('b2', 'B', [1, 0], 'step', 'Guest help chat', 'On every page', 'ChatCircleDots', 'The chat behind Guest help on every page. It answers live from Tidewell’s guides, and it never sends an email.'),

  step('c1', 'C', [0, 0], 'step', 'Find the market', 'Towns, in Airtable', 'MapPin', 'The webhook starts n8n. It looks for one of Tidewell’s eleven towns in the address, or a name one also goes by, like Wild Dunes, and reads its market: the coast, the city or the mountains.', ['airtable']),
  step('c2', 'C', [1, 0], 'decision', 'In our markets?', 'Eleven towns', 'ArrowsSplit', 'An address in one of the three markets goes on to a manager. Any other address goes to the office.'),
  step('c3', 'C', [2, 0], 'step', 'Pick the manager', 'Fewest homes', 'IdentificationBadge', 'The manager in that market with the fewest homes, from those still under eighteen. The one who walks the house is the one who will run it.', ['airtable']),
  step('c4', 'C', [3, 0], 'step', 'Book the walkthrough', 'First free hour', 'CalendarCheck', 'Holds the first free hour in that manager’s Cal.com calendar, from two working days out, at the property. The owner can move it.', ['cal-com']),
  step('c5', 'C', [4, 0], 'step', 'Confirm the visit', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude, emails the date, time and manager from Gmail, and the owner and the assessment are saved in HubSpot. It sends on its own.', ['gmail', 'hubspot'], true),
  step('c6', 'C', [5, 0], 'ai', 'Outline a projection', 'For the manager only', 'Sparkle', 'Claude drafts an outline of the twelve-month projection from Tidewell’s homes in that town, and the manager gets it in Telegram. No owner sees it.', ['claude', 'telegram']),
  step('c7', 'C', [2, 1], 'end', 'Pass to the office', 'A HubSpot task', 'Buildings', 'An address outside the three markets is saved in HubSpot with a task, and the office is told on Telegram. A person writes back by hand.', ['hubspot', 'telegram']),

  step('d1', 'D', [0, 1], 'trigger', 'A repair is logged', 'Jobs, every 15 min', 'Wrench', 'A manager or the crew logs a repair on the Jobs form in Airtable, with photos and a quote. Make picks it up within a quarter of an hour, on its own.', ['make', 'airtable'], true),
  step('d2', 'D', [1, 1], 'decision', 'Over $400?', 'The quote', 'ArrowsSplit', 'Tidewell’s rule for owners: “Repairs above $400 need your approval unless guest safety is involved.” Anything less is the team’s to fix.'),
  step('d3', 'D', [2, 2], 'step', 'Ask the owner', 'Photos and the quote', 'EnvelopeSimple', 'A fixed template emails the owner the photos, the quote and the amount, with two buttons: Approve and Decline. No words from Claude.', ['gmail']),
  step('d4', 'D', [3, 2], 'gate', 'Owner’s yes', 'Approve or Decline', 'UserCheck', 'The owner’s money, so the owner’s yes. Each button opens a confirm page, and only Confirm there counts, so a mail scanner opening the link answers nothing. An email left unanswered books nothing.', ['make']),
  step('d5', 'D', [5, 1], 'step', 'Book the repair', 'To the crew', 'CalendarCheck', 'The job is marked Booked and sent to the maintenance crew for that market on Telegram.', ['airtable', 'telegram']),
  step('d6', 'D', [4, 2], 'end', 'The manager calls', 'The owner declined', 'Phone', 'The job is marked Declined and the manager is told on Telegram. They call the owner to agree what happens next.', ['telegram']),
  step('d7', 'D', [2, 0], 'end', 'Booked for safety', 'Owner emailed', 'FirstAidKit', 'Above $400, but the manager ticked Guest safety on the Jobs form, and that tick is the yes the site allows. The job is booked and sent to the crew at once, and a fixed template emails the owner that it is already booked, for guest safety.', ['airtable', 'gmail']),

  step('e1', 'E', [0, 0], 'trigger', 'On the 9th', 'Schedule by Zapier', 'CalendarBlank', 'Zapier wakes on the morning of the 9th and takes every home still waiting for last month’s statement.', ['zapier'], true),
  step('e2', 'E', [1, 0], 'step', 'Compile the month', 'Every figure, Airtable', 'Calculator', 'Bookings, the home’s management fee (22% on the sample statement), repairs and restocking, added up from rows in Airtable. Every figure comes from a row, never from Claude.', ['airtable']),
  step('e3', 'E', [2, 0], 'ai', 'Draft the note', 'Claude, under 90 words', 'Sparkle', 'Claude drafts the manager’s note: what was fixed and when, what is coming up, and anything the owner will need to decide.', ['claude']),
  step('e4', 'E', [3, 0], 'gate', 'Manager’s yes', 'Zapier review page', 'UserCheck', 'Zapier emails the home’s manager a link to its review page, with the statement and the note. They approve it or reject it to rewrite. No answer, nothing sent.', ['zapier']),
  step('e5', 'E', [4, 0.5], 'step', 'Manager rewrites', 'In their own words', 'PencilSimple', 'The manager writes the note as it should read, on a second review page. Only their words go out.', ['zapier']),
  step('e6', 'E', [5, 0], 'step', 'Send the statement', 'By the tenth', 'PaperPlaneTilt', 'The owner gets the statement, every line itemized, with the approved note and the payment date, and it is marked Sent.', ['gmail', 'airtable']),

  step('f1', 'F', [0, 0], 'step', 'Search the guides', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the check-in guide, the house rules and the local guide.', ['supabase']),
  step('f2', 'F', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a door code, a price or a date the guides lack.', ['claude']),
  step('f3', 'F', [2, 0], 'decision', 'Sure and not urgent?', 'A guide settles it', 'Question', 'Did a guide hold the answer? A lockout, a leak or anything urgent counts as no, and so does anything the guides do not say. The bot never guesses.'),
  step('f4', 'F', [3, 0], 'end', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes straight back in the chat with the guide it came from. A live answer from Tidewell’s own guides needs no yes.'),
  step('f5', 'F', [3, 1], 'end', 'Hand to on call', 'Pinned in Telegram', 'UserSwitch', 'The whole chat goes to the on-call person in Telegram, pinned with sound. A real person calls or writes back, usually in under ten minutes. Email stays with people.', ['telegram']),

  step('g1', 'G', [0, 0], 'trigger', 'Every morning', '7 am, on a schedule', 'Clock', 'At 7 am n8n starts the agent once for each home. A schedule runs it, not anyone remembering.', ['n8n'], true),
  step('g2', 'G', [1, 0], 'agent', 'Compare nearby rates', 'Airtable and listings', 'Wrench', 'One tool call at a time: the home’s nightly rate and occupancy from Airtable, then nearby homes’ rates, from a feed Tidewell supplies or a sheet the team fills from the listing sites.', ['airtable']),
  step('g3', 'G', [2, 0], 'ai', 'Propose a rate', 'With its reasons', 'Sparkle', 'When nearby homes drop their rates, Claude proposes a new one for that weekend, with the homes it compared. A quiet morning proposes nothing.', ['claude']),
  step('g4', 'G', [3, 0], 'gate', 'Manager’s yes', 'Approve in Telegram', 'UserCheck', 'A rate moves an owner’s money, so it waits for the home’s manager in Telegram with Approve and Edit. Nothing changes until they tap Approve.', ['telegram']),
  step('g5', 'G', [4, 0], 'end', 'Log the new rate', 'Set live by hand', 'CurrencyDollar', 'The approved rate is logged in Google Sheets as a proposal with the manager’s yes, and the manager sets it on the listings. The nightly rate in Airtable stays the baseline.', ['google-sheets']),

  step('h1', 'H', [0, 0], 'trigger', 'A low review', 'Three stars or fewer', 'Star', 'A manager who sees a review of three stars or fewer on a listing pastes it into the Review reply chat in Telegram. One says the coffee maker didn’t work.', ['telegram']),
  step('h2', 'H', [1, 0], 'agent', 'Read the stay', 'Review, home, jobs', 'ClipboardText', 'Claude reads the review with the home, its manager and its recent jobs in Airtable, one tool call at a time.', ['airtable']),
  step('h3', 'H', [2, 0], 'agent', 'Open a repair job', 'Jobs form, pre-filled', 'Wrench', 'When the review names something broken, the crew gets the Jobs form in Telegram, pre-filled with the home and the issue. Their photos and quote start TW-02.', ['telegram']),
  step('h4', 'H', [3, 0], 'ai', 'Draft the reply', 'Names the fix', 'PencilSimple', 'Claude drafts a short public reply that thanks the guest and names what is being fixed, from the review and the job only.', ['claude']),
  step('h5', 'H', [4, 0], 'gate', 'Manager’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the reply answers a guest in public, so it waits in Telegram with Approve and Edit. Nothing is posted until the manager taps Approve.', ['telegram']),
  step('h6', 'H', [5, 0], 'end', 'Post the reply', 'The manager, by hand', 'ChatText', 'The manager posts the approved reply under the review on the listing site by hand, word for word, and the run is logged in Google Sheets.', ['google-sheets']),

  step('i1', 'I', [0, 0], 'step', 'Walk the property', 'An hour, on site', 'Footprints', 'The manager walks the house with Claude’s outline in hand, and goes through the current listing and its returns with the owner.'),
  step('i2', 'I', [1, 0], 'step', 'Write the projection', 'Their own, in writing', 'NotePencil', 'The manager writes the twelve-month revenue projection and sends it themselves. The assessment moves to Projection sent in HubSpot.', ['hubspot']),
  step('i3', 'I', [2, 0], 'step', 'The owner signs', 'Stage 4, Signed', 'Signature', 'The owner signs, the assessment moves to Signed in HubSpot, and the house moves on to Prepare. An owner who decides against it for now moves to Not now.', ['hubspot']),
  step('i4', 'I', [3, 0], 'step', 'Prepare and launch', 'About four weeks', 'RocketLaunch', 'Deep clean, safety audit, smart lock and styling, then photographs, and the listings go live on Airbnb, Vrbo and Tidewell’s direct site.'),
  step('i5', 'I', [4, 0], 'step', 'Guests stay', 'Checked before each', 'Bed', 'Guests get the door code the morning they travel, to a house checked against a photo checklist. Most leave a good review; some do not.'),

  step('j1', 'J', [0, 0], 'step', 'Ask for the payout', 'The office, Telegram', 'ChatCircleText', 'The moment a statement is sent, the office is told on Telegram what to pay that owner today.', ['telegram']),
  step('j2', 'J', [1, 0], 'step', 'Pay the owner', 'By a person’s hand', 'Bank', 'A person in the office pays the owner from Tidewell’s bank the same day. Money only moves by a person’s hand.'),
  step('j3', 'J', [2, 0], 'end', 'Marked Paid', 'In Airtable', 'CheckCircle', 'The office marks the statement Paid in Airtable. One statement a month, by the tenth, with the payout the same day.', ['airtable']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'D', 'E', 'G', 'H', 'I', 'J'])
const SIDE = new Set(['c7', 'd6', 'd7'])
/** A step whose number is not its column: Book the repair sits a column right, to keep the cables clear. */
const NUMBER: Record<string, number> = { d5: 5 }

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('b1', 'c1'),
  flow('b2', 'f1'),
  ...chain('c1', 'c2'),
  flow('c2', 'c3', 'yes'),
  flow('c2', 'c7', 'no'),
  ...chain('c3', 'c4', 'c5', 'c6'),
  flow('c6', 'i1'),
  ...chain('d1', 'd2'),
  flow('d2', 'd5', '$400 or less'),
  flow('d2', 'd3', 'over $400'),
  flow('d2', 'd7', 'safety'),
  flow('d3', 'd4'),
  flow('d4', 'd5', 'approve'),
  flow('d4', 'd6', 'decline'),
  flow('d5', 'e2', 'added with its receipt'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  flow('e4', 'e6', 'approve'),
  flow('e4', 'e5', 'rewrite'),
  flow('e5', 'e6'),
  flow('e6', 'j1'),
  ...chain('f1', 'f2', 'f3'),
  flow('f3', 'f4', 'yes'),
  flow('f3', 'f5', 'no'),
  ...chain('g1', 'g2', 'g3', 'g4'),
  flow('g4', 'g5', 'approved'),
  loop('g4', 'g3', 'change it'),
  ...chain('h1', 'h2', 'h3', 'h4', 'h5'),
  flow('h3', 'd1'),
  flow('h5', 'h6', 'approved'),
  loop('h5', 'h4', 'change it'),
  ...chain('i1', 'i2', 'i3', 'i4', 'i5'),
  flow('i5', 'h1'),
  ...chain('j1', 'j2', 'j3'),
]

const endToEnd: EndToEnd = {
  title: 'Tidewell · End-to-end workflow',
  description: 'Tidewell’s whole system as one live graph: the assessment form, repair approval, the monthly statement, the Guest help bot and the two agents, from an owner’s first request to the payout.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · TIDEWELL',
  heading: 'From an owner’s first request to the payout',
  lede: 'Every trigger, flow, bot and agent behind Tidewell’s site, wired as one graph: an owner’s assessment, the walkthrough, guests and their questions, repairs, rates and reviews, and the statement that arrives by the tenth with payment the same day.',
  stance: 'Owners approve every repair above $400 unless guest safety is involved, and a manager approves every rate change, every reply to a review and anything Claude drafts for an owner’s inbox.',
  caption: 'Tidewell, end to end · 10 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => (NUMBERED.has(s.lane) && !SIDE.has(s.id) ? { ...s, n: NUMBER[s.id] ?? s.at[0] + 1 } : s)),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'An owner, a guest, a job or a statement moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one request, question, repair or statement moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until the owner or the home’s manager says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the assessment flow, the Guest help bot and both agents run in.'],
      ['Make', 'The automation tool repair approval runs in, with a router that sends each job one of two ways.'],
      ['Zapier', 'The automation tool the monthly statement runs in, with a review page for the manager.'],
      ['Webhook', 'A web address the assessment form calls the moment it is sent, which starts TW-01.'],
      ['Claude', 'Anthropic’s AI model. It outlines, drafts, answers and proposes here, and never sends an email on its own.'],
      ['HubSpot', 'The CRM where Tidewell keeps every owner who asks for an assessment, and each assessment’s stage.'],
      ['Airtable', 'Where Tidewell keeps its towns, managers, homes, repair jobs and statements.'],
      ['Cal.com', 'The booking tool that holds each manager’s calendar and the hour for each walkthrough.'],
      ['Gmail', 'The mailbox confirmations, repair requests and statements are sent from.'],
      ['Telegram', 'The chat app where managers get briefs and approve drafts, the crew gets jobs, and the office hears what to pay.'],
      ['Supabase', 'The database that stores the passages the Guest help bot searches.'],
      ['Market', 'One of Tidewell’s three areas, the coast, the city or the mountains, each with its own managers.'],
      ['Template', 'A fixed message with blanks for the date, time and manager. No AI writes it, so it may send alone.'],
      ['Walkthrough', 'The hour a manager spends at the property before writing the projection.'],
      ['Projection', 'The written twelve-month revenue projection the manager sends after the walkthrough.'],
      ['Jobs form', 'The Airtable form a repair is logged on, with photos and a quote, which starts TW-02.'],
      ['Guest safety', 'A box only a manager’s Jobs form has. Ticked on a repair above $400, it is the yes, and the owner is told the repair is already booked.'],
      ['Confirm page', 'The page an owner’s Approve or Decline button opens. Only its Confirm button records the answer, so a mail scanner opening the link changes nothing.'],
      ['Management fee', 'Tidewell’s share of booking revenue, 20–25% depending on the home and market, and 22% on the sample statement. Shown on every statement.'],
      ['Review page', 'A page Zapier hosts where the manager approves a note or rejects it to rewrite.'],
      ['Approval gate', 'A hard stop. No repair above $400 (unless a manager ticks Guest safety), rate change, reply to a review or draft for an owner’s inbox goes on until the right person says yes.'],
      ['Check-in guide', 'How arrival works at a Tidewell home, from the door code to check-out.'],
      ['House rules', 'One set per home, like whether a dog may come.'],
      ['Local guide', 'Where Tidewell’s staff eat, swim and take visiting family.'],
      ['Passage', 'A rule or a step cut from a longer guide, as the search returns it.'],
      ['Embed', 'Turn a piece of text into numbers that capture its meaning, so similar ideas can be found.'],
      ['On-call person', 'The member of the team who answers urgent guest messages that night.'],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
      ['Payout', 'What a statement says is paid to the owner, sent by a person the day the statement goes out.'],
    ],
  },
  footer: { note: 'A worked example. Tidewell is a fictional rental manager, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
