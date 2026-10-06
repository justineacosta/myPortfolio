/**
 * Westmere’s End-to-end case page (spec 2026-10-05 per-site pages): the
 * developer’s whole system as one graph of eleven lanes, from a buyer’s
 * enquiry, a private viewing and a portfolio request to the listing agent’s
 * call, the hosting agent’s brief and follow-up, the sales director’s proof of
 * funds, the contract the sales team asks the Document Q&A bot about, and a
 * failed run reaching the sales team. It tells the same story as Westmere’s
 * Automation, Build plan and AI agents pages. data/cases/index.ts registers
 * it; `npm run cases` renders it into
 * public/cases/westmere-los-angeles/end-to-end.html. Only type imports, so
 * Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The person’s-yes rule, as on Westmere’s other pages. */
const YES = 'The hosting agent approves anything Claude drafts for a buyer’s inbox before it is sent.'

const LANES: Lane[] = [
  { id: 'A', name: 'Buyers', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'Four buttons, no form.' },
  { id: 'C', name: 'Residence enquiry (WM-01)', note: 'n8n. A fixed rule routes.' },
  { id: 'D', name: 'Private viewing (WM-02)', note: 'Make. The host hears first.' },
  { id: 'E', name: 'Viewing prep agent', note: 'For the hosting agent only.' },
  { id: 'F', name: 'The sales agents', note: 'People, by hand.' },
  { id: 'G', name: 'Buyer follow-up agent', note: 'Waits for the host’s yes.' },
  { id: 'H', name: 'Full portfolio (WM-03)', note: 'Zapier. The director decides.' },
  { id: 'I', name: 'The sales team', note: 'Offers and escrow, by hand.' },
  { id: 'J', name: 'Document Q&A bot', note: 'Internal. The team only.' },
  { id: 'K', name: 'Failed runs (WM-H02)', note: 'n8n. The sales team hears.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Enquires', 'On a residence’s page', 'ChatCircleText', 'A buyer presses Enquire on this residence on one of the five residences. Download the brochure, beside it, only downloads the PDF and starts nothing.'),
  step('a2', 'A', [1, 0], 'trigger', 'Books a viewing', 'Book a private viewing', 'CalendarPlus', 'A buyer presses Book a private viewing and picks a time, Tuesday to Saturday, by appointment only, at the sales gallery.'),
  step('a3', 'A', [2, 0], 'trigger', 'Wants the portfolio', 'All 14 developments', 'Books', 'A buyer presses Request the full portfolio, to see all fourteen developments.'),

  step('b1', 'B', [0, 0], 'step', 'Enquiry panel', 'Name, email, message', 'ClipboardText', 'A short panel: a name, an email, an optional phone and a message, with the residence filled in from the page. It posts to n8n.'),
  step('b2', 'B', [1, 0], 'step', 'Booking page', 'Cal.com, Tue–Sat', 'CalendarCheck', 'Westmere’s Cal.com Private viewing page: Tuesday to Saturday only, at 9200 Sunset Blvd, Suite 40. It asks for a name, an email, a phone and the residence, nothing else.', ['cal-com']),
  step('b3', 'B', [2, 0], 'step', 'Portfolio panel', 'Name, email, a note', 'ClipboardText', 'A panel like the enquiry’s: a name, an email, an optional phone and a note. It posts to a Zapier Catch Hook.'),

  step('c1', 'C', [0, 0], 'step', 'Save the contact', 'Webhook, then HubSpot', 'UserPlus', 'n8n catches the panel and saves the buyer in HubSpot with the residence and their message before anything is decided. A residence missing from Residences goes to the sales team at once.', ['n8n', 'hubspot'], true),
  step('c2', 'C', [1, 0], 'ai', 'Read the enquiry', 'Claude, three answers', 'Sparkle', 'Claude reads the message and the residence only, never the name, email or phone, for three things the buyer stated: asked to view, asked to talk, and any timeline. Never a budget.', ['claude']),
  step('c3', 'C', [2, 0], 'decision', 'Ready to view?', 'A fixed IF rule', 'ArrowsSplit', 'A fixed rule on Claude’s three answers, not Claude, decides: asked to view or talk, or a timeline within twelve months, goes to an agent. It decides only how fast an agent calls.', ['n8n']),
  step('c4', 'C', [3, 0], 'step', 'Alert the agent', 'The listing agent', 'Bell', 'The residence’s listing agent gets a Telegram message with the buyer’s name, the residence and their message as written, within minutes, and calls or writes to them by hand.', ['telegram']),
  step('c5', 'C', [3, 1.5], 'step', 'New releases list', 'HubSpot', 'ListChecks', 'Everyone else joins the New releases list, which hears about new residences as they launch. An agent can still call anyone on it.', ['hubspot']),
  step('c6', 'C', [4, 0], 'step', 'Send the brochure', 'A fixed template', 'EnvelopeSimple', 'Every buyer gets the same brochure and floor plans from private@westmere.la, whichever path they took, with DRE #02114471 and Equal Housing Opportunity. Claude writes none of it.', ['gmail'], true),
  step('c7', 'C', [5, 0], 'end', 'Note the route', 'HubSpot', 'FlagCheckered', 'The contact notes With an agent or On the list and the day the brochure went, so the sales director can check the rule treats every buyer the same.', ['hubspot']),

  step('d1', 'D', [1, 0], 'trigger', 'Viewing booked', 'Cal.com to Make', 'CalendarCheck', 'Cal.com picks the hosting agent in turn and tells Make whenever a viewing is booked, moved or cancelled. A Router sends each one way.', ['cal-com', 'make'], true),
  step('d2', 'D', [2, 0], 'step', 'Save the viewing', 'HubSpot API call', 'Database', 'A booked or moved viewing’s day and time and its hosting agent go on the buyer’s contact, matched on email, so the enquiry and the viewing sit on one contact.', ['hubspot']),
  step('d3', 'D', [3, 0], 'step', 'Tell the host', 'Telegram, or the team', 'PaperPlaneTilt', 'Make finds the host in Team and messages them on Telegram. A host missing from Team, or a message that fails, reaches the sales team instead, so a person tells them.', ['airtable', 'telegram']),
  step('d4', 'D', [4, 0], 'end', 'Confirm the viewing', 'A fixed template', 'EnvelopeSimple', 'The Router’s last route sends Westmere’s confirmation: the day and time, the gallery, the host’s name and +1 310 555 0148. It goes after the host is told, so the host knows even if it fails.', ['gmail'], true),
  step('d5', 'D', [2, 1.5], 'end', 'Clear the viewing', 'HubSpot API call', 'XCircle', 'A cancelled viewing’s day and time are cleared on the contact. Cal.com tells the hosting agent itself.', ['hubspot']),

  step('e1', 'E', [2, 0], 'trigger', 'Viewing booked', 'Cal.com to n8n', 'CalendarPlus', 'A second Cal.com webhook on the Private viewing event starts one run in n8n for each new booking. A moved viewing keeps its brief; WM-02 tells the host the new time.', ['cal-com', 'n8n'], true),
  step('e2', 'E', [3, 0], 'agent', 'Read the facts', 'Residence, enquiry', 'ClipboardText', 'One tool call at a time: the booking, the residence’s facts, the enquiry message and its day, if the buyer has a contact yet, and the residence’s documents. No contact or no message gives a facts-only brief.', ['hubspot', 'supabase']),
  step('e3', 'E', [4, 0], 'ai', 'Write the brief', 'Claude, no scoring', 'PencilSimple', 'Claude writes a short brief: the residence’s facts to have ready and what the buyer asked about it. Nothing about who the buyer is, and no rating of the buyer.', ['claude']),
  step('e4', 'E', [5, 0], 'end', 'To the host only', 'Telegram, then logged', 'PaperPlaneTilt', 'The brief goes to the hosting agent’s own Telegram chat, never to the buyer, and the run is logged in Agent runs.', ['telegram', 'google-sheets']),

  step('f2', 'F', [5, 0], 'step', 'Host the viewing', 'At the sales gallery', 'DoorOpen', 'The hosting agent meets the buyer at 9200 Sunset Blvd, Suite 40, with the brief in hand, and shows the residence’s plans and specification.'),
  step('f3', 'F', [6, 0], 'step', 'Mark it held', 'A form, from Telegram', 'CheckSquare', 'Under the brief, Viewing held opens an n8n form: Held or Did not come, and a line on what the buyer asked about the residence. Its link carries a signed token for that viewing, and only the submit counts.'),

  step('g1', 'G', [1, 0], 'trigger', 'Viewing held', 'The host’s form', 'Lightning', 'The hosting agent’s form starts one run in n8n for the viewing.', ['n8n']),
  step('g2', 'G', [2, 0], 'agent', 'Read the viewing', 'Residence, enquiry', 'ClipboardText', 'One tool call at a time: the residence’s public facts, the enquiry on the contact, the residence’s documents, and Agent runs, so no viewing gets two follow-ups.', ['hubspot', 'google-sheets']),
  step('g3', 'G', [3, 0], 'decision', 'Held, none sent yet?', 'And the buyer came', 'Question', 'Was the viewing held, with no follow-up logged yet? A buyer who did not come, or one already followed up, gets nothing drafted.'),
  step('g4', 'G', [4, 0], 'ai', 'Draft the follow-up', 'Claude, in host’s name', 'PencilSimple', 'Claude drafts a short note in the hosting agent’s name: thanks, answers from the residence’s public facts, and how to book a second viewing or request the full portfolio. No budget, no valuation figures.', ['claude']),
  step('g5', 'G', [5, 0], 'gate', 'The host’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the draft waits in the hosting agent’s own Telegram chat, with an n8n form, Approve or Change it. Nothing is sent until they approve.', ['telegram']),
  step('g6', 'G', [6, 0], 'end', 'Send the follow-up', 'Gmail, then logged', 'PaperPlaneTilt', 'Gmail sends it from private@westmere.la in the hosting agent’s name, and the run is logged in Agent runs with their yes. A reply reaches a person.', ['gmail', 'google-sheets']),
  step('g7', 'G', [4, 1.5], 'end', 'Tell the host', 'Nothing drafted', 'Bell', 'The hosting agent hears that nothing was drafted, and why. They write to the buyer personally if they choose. The run is logged in Agent runs.', ['telegram', 'google-sheets']),

  step('h1', 'H', [1, 0], 'step', 'Log the request', 'HubSpot and Airtable', 'Table', 'Zapier saves the buyer in HubSpot and logs the request in Portfolio requests, with Proof of funds set to Awaiting.', ['hubspot', 'airtable'], true),
  step('h2', 'H', [2, 0], 'step', 'Send the portfolio', 'A fixed template', 'EnvelopeSimple', 'The buyer gets the full portfolio of fourteen developments at once, and the sales team’s Telegram group hears of the request.', ['gmail', 'telegram'], true),
  step('h3', 'H', [3, 0], 'gate', 'Proof of funds?', 'Human in the Loop', 'UserCheck', 'An approval gate: the sales director, once they have seen the buyer’s proof of funds themselves, approves or rejects on a Zapier review page. Opening the link records nothing.', ['zapier']),
  step('h4', 'H', [4, 0], 'decision', 'Confirmed only', 'Recorded, filtered', 'Funnel', 'Confirmed or Not confirmed is written on the request first, with who checked and when, then a Filter lets only Confirmed go on.', ['airtable', 'zapier']),
  step('h5', 'H', [5, 0], 'step', 'Send the pack', 'Gmail, from Documents', 'FileText', 'Kestrel Valuation Partners’ valuation pack goes to the buyer as issued, in the sales director’s name. A missing pack stops the run before any email, and the sales team hears.', ['gmail', 'airtable'], true),
  step('h6', 'H', [5, 1.5], 'end', 'Nothing sent', 'The director writes', 'XCircle', 'Not confirmed sends nothing: no buyer gets an automated no. The sales director writes to them personally.'),
  step('h7', 'H', [6, 0], 'end', 'Mark it sent', 'Airtable', 'FlagCheckered', 'Pack sent on is set on the request, so the sales director sees at a glance who has the pack and who is still waiting.', ['airtable']),

  step('i1', 'I', [0, 0], 'step', 'Offer and contract', 'By hand, with counsel', 'Handshake', 'A buyer makes an offer. The sales team and Westmere’s counsel write the purchase agreement and open escrow by hand. No tool reaches an escrow company.'),
  step('i2', 'I', [1, 0], 'step', 'File the contract', 'Signed PDF, by sale', 'FilePdf', 'The sales director uploads the signed contract, filed by its sale, like The Orchard Residences, Residence 2.'),
  step('i3', 'I', [3, 0], 'trigger', 'A team question', 'From a sales agent', 'ChatCircleText', 'A sales agent asks about a sale in the team’s own chat, behind a sign-in: a deadline, a deposit term or a clause.'),

  step('j1', 'J', [2, 0], 'step', 'Prepare the store', 'Parties left out', 'Database', 'Each document is split clause by clause with its page, the parties’ names, addresses and signature pages left out, then embedded and stored in Supabase.', ['n8n', 'supabase'], true),
  step('j2', 'J', [3, 0], 'step', 'Search the documents', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the sale it names and that residence’s documents.', ['supabase']),
  step('j3', 'J', [4, 0], 'ai', 'Claude answers', 'Only from the page', 'Sparkle', 'Claude answers only from the five passages, with the document, page and clause. No legal or tax advice, no invented date or figure, and nothing about who a buyer is.', ['claude']),
  step('j4', 'J', [5, 0], 'decision', 'On the page?', 'The documents decide', 'Question', 'Did a passage hold the answer? A legal or tax question, a question about who a buyer is, or anything the documents do not say counts as no.'),
  step('j5', 'J', [6, 0], 'end', 'Reply with the page', 'To the team only', 'ArrowBendUpLeft', 'The answer goes back in the team’s chat with its page and clause. It never reaches a buyer, so it needs no one’s yes.'),
  step('j6', 'J', [6, 1.5], 'end', 'Says it isn’t there', 'Or: ask the director', 'UserSwitch', 'The bot says the answer isn’t in the documents, or isn’t one it gives, and points to the sales director. It forwards nothing.'),

  step('k1', 'K', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed WM-01 run, and a webhook hears a failed Make step in WM-02, or a failed or halted WM-03 run from Zapier Manager.', ['n8n'], true),
  step('k2', 'K', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab with what each source gives: n8n’s step and run link, Make’s step, error and viewing time, or Zapier’s zap and time. Never a buyer’s details.', ['google-sheets']),
  step('k3', 'K', [2, 0], 'end', 'Alert the sales team', 'Their Telegram group', 'Bell', 'The sales team hears on Telegram: a failure urgently, a halted run as an ordinary alert. Nothing retries on its own: the sales director decides, or calls Justine.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'D', 'E', 'G', 'H', 'J', 'K'])
const SIDE = new Set(['c5', 'd5', 'g7', 'h6', 'j6'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('a3', 'b3'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  flow('b2', 'e1', 'a second webhook'),
  flow('b3', 'h1'),
  ...chain('c1', 'c2', 'c3'),
  flow('c3', 'c4', 'Yes'),
  flow('c3', 'c5', 'Not yet'),
  flow('c4', 'c6'),
  flow('c5', 'c6'),
  flow('c6', 'c7'),
  flow('d1', 'd2', 'Booked'),
  flow('d1', 'd5', 'Cancelled'),
  flow('d2', 'd3'),
  flow('d3', 'd4', 'Then'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  flow('e4', 'f2'),
  flow('f2', 'f3'),
  flow('f3', 'g1', 'held'),
  ...chain('g1', 'g2', 'g3'),
  flow('g3', 'g4', 'yes'),
  flow('g3', 'g7', 'no'),
  flow('g4', 'g5'),
  flow('g5', 'g6', 'approved'),
  loop('g5', 'g4', 'change it'),
  ...chain('h1', 'h2', 'h3', 'h4'),
  flow('h4', 'h5', 'Confirmed'),
  flow('h4', 'h6', 'Not confirmed'),
  flow('h5', 'h7'),
  flow('h7', 'i1', 'an offer'),
  flow('i1', 'i2'),
  flow('i2', 'j1'),
  flow('i3', 'j2'),
  flow('j1', 'j2'),
  ...chain('j2', 'j3', 'j4'),
  flow('j4', 'j5', 'yes'),
  flow('j4', 'j6', 'no'),
  ...chain('k1', 'k2', 'k3'),
]

const endToEnd: EndToEnd = {
  title: 'Westmere · End-to-end workflow',
  description: 'Westmere’s whole system as one live graph: residence enquiries routed by what a buyer asked, private viewings with the host told first, the viewing brief and follow-up, the valuation pack after proof of funds, the Document Q&A bot and a failed run reaching the sales team.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · WESTMERE',
  heading: 'From Enquire on this residence to a signed contract',
  lede: 'Every trigger, flow, bot and agent behind Westmere’s site, wired as one graph: an enquiry read for what the buyer asked, the listing agent’s call within minutes, a private viewing booked Tuesday to Saturday, the hosting agent’s brief and follow-up, the full portfolio and the valuation pack after proof of funds, and the contract the sales team asks the Document Q&A bot about.',
  stance: `${YES} Westmere is an Equal Housing Opportunity developer, DRE #02114471, so no flow, bot or agent screens, scores, sorts or ranks a buyer, and none uses a protected trait or a budget: Claude is instructed to ignore anything about who a buyer is, and nothing it writes has a place for it. In WM-01 Claude sees only the message and the residence, and a fixed rule routes the result. A “qualified buyer” means proof of funds and nothing else, and only the sales director decides it, by hand. The brochure, the portfolio and the viewing confirmation are fixed templates and send on their own, and the Document Q&A bot answers the sales team only, never a buyer. Listing sites, offers and escrow are done by hand: no tool here reaches them.`,
  caption: 'Westmere, end to end · 11 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'An enquiry, a viewing, a request, a contract or a question moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one enquiry, viewing, request or question moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until the hosting agent or the sales director says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a webhook or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool residence enquiries, the bot, both agents and the failed-run log run in.'],
      ['Make', 'The automation tool private viewings run in, with a Router that runs its routes one after another.'],
      ['Zapier', 'The automation tool portfolio requests run in, with Human in the Loop and a Filter.'],
      ['Webhook', 'A web address another tool posts to: the enquiry panel to WM-01, Cal.com to Make and to the Viewing prep agent, and failed runs to WM-H02.'],
      ['Claude', 'Anthropic’s AI model. It reads WM-01’s enquiries for three answers, and answers, plans and drafts in the bot and the two agents.'],
      ['HubSpot', 'Where every buyer is a contact, with the residence they asked about, their enquiry and their next viewing.'],
      ['Cal.com', 'Where buyers book a private viewing, Tuesday to Saturday, and which picks the hosting agent in turn.'],
      ['Airtable', 'Where Westmere keeps its residences, its team, portfolio requests and documents.'],
      ['Gmail', 'The private@westmere.la mailbox, which sends every template and every follow-up the hosting agent approved.'],
      ['Telegram', 'The chat app where agents hear of enquiries and viewings, read briefs, approve drafts, and the sales team hears of a failed run.'],
      ['Supabase', 'The database that stores the passages the Document Q&A bot and both agents search.'],
      ['Google Sheets', 'Where the Failed runs and Agent runs tabs are kept.'],
      ['Template', 'A fixed message with blanks for the name, the residence, the day or the host. No AI writes it.'],
      ['Listing agent', 'The sales agent who holds a residence, alerted when a buyer asks to view or talk.'],
      ['Hosting agent', 'The sales agent Cal.com picks in turn to host a private viewing at the sales gallery.'],
      ['Sales director', 'The person who confirms proof of funds and files every contract.'],
      ['Proof of funds', 'The only thing that makes a buyer qualified, checked by the sales director by hand and never stored.'],
      ['Human in the Loop', 'Zapier’s approval step: the sales director gets an email link to a review page, and only their choice there counts.'],
      ['Agent runs', 'The Google Sheets tab that logs each agent run, with the hosting agent’s yes.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed run from n8n, Make or Zapier, with no buyer’s details.'],
      ['Approval gate', `A hard stop. ${YES}`],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Westmere is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
