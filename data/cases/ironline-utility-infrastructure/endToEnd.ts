/**
 * Ironline Utility Infrastructure’s End-to-end case page (spec 2026-10-05
 * per-site pages): the contractor’s whole system as one graph of nine lanes,
 * from a bid emailed to bids@ and a storm call to the 24/7 line, through the
 * rota, the Bid triage agent and the superintendent’s response, to the crews’
 * Team knowledge bot, the near-miss bulletin the safety director approves,
 * the closeout the superintendent approves, and a failed run reaching the team
 * that owns it. No step gives a switching, clearance or energized-work
 * instruction. It tells the same story as Ironline’s Automation, Build plan
 * and AI agents pages. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/ironline-utility-infrastructure/end-to-end.html.
 * Only type imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The safety rule, as on Ironline’s other pages. */
const SAFE = 'Ironline is a safety trade, so no flow, bot or agent gives, drafts or changes a switching, clearance, outage or energized-work instruction, and none overrides the job brief: those come from the job brief, the superintendent and system operations, and every task starts with a documented job brief. Storm and emergency calls go to the 24/7 line, (614) 555-0199, answered by people, and no flow dispatches a crew.'

/** The person’s-yes rule, as on Ironline’s other pages. */
const YES = 'The safety director approves anything Claude drafts for company-wide distribution, within 48 hours of the report being filed.'

const LANES: Lane[] = [
  { id: 'A', name: 'The office', note: 'People, by hand.' },
  { id: 'B', name: 'Bids and storm calls', note: 'From owners and utilities.' },
  { id: 'C', name: 'Bid request (IL-01)', note: 'n8n. The rota assigns.' },
  { id: 'D', name: 'Bid triage agent', note: 'One superintendent. No reply.' },
  { id: 'E', name: 'Crews and superintendents', note: 'The job brief comes first.' },
  { id: 'F', name: 'Team knowledge bot', note: 'Crews only. SOPs only.' },
  { id: 'G', name: 'Near-miss review (IL-02)', note: 'Make. The director approves.' },
  { id: 'H', name: 'Closeout (IL-03)', note: 'Zapier. The super approves.' },
  { id: 'I', name: 'Failed runs (IL-H02)', note: 'n8n. The owning team hears.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [2, 0], 'trigger', 'Sets the rota', 'The bid desk, weekly', 'CalendarCheck', 'Each Friday the bid desk puts one superintendent on bid duty for the week ahead in the Bid duty rota, so a person has chosen who reviews that week’s bids.', ['airtable']),

  step('b1', 'B', [0, 0], 'trigger', 'Requests a bid', 'Email to bids@', 'EnvelopeSimple', 'An owner or a utility presses Request a bid and emails bids@ironlineutility.com: drawings, a scope letter or a two-line description of the problem.'),
  step('b2', 'B', [4, 0], 'trigger', 'Storm or emergency', 'Calls the 24/7 line', 'Phone', 'An owner or a utility calls (614) 555-0199 for storm or emergency response, answered 24/7/365.'),
  step('b3', 'B', [5, 0], 'end', 'A person answers', 'Decides, by hand', 'Headset', 'People answer the 24/7 line and decide what rolls: crews within six hours of a call. No flow, bot or agent reads, routes or dispatches it.'),

  step('c1', 'C', [0, 0], 'step', 'Find the thread', 'Gmail, then Airtable', 'MagnifyingGlass', 'n8n picks up each email from outside Ironline every minute and looks for a request already logged on its thread. Nothing reads it for urgency.', ['n8n', 'gmail'], true),
  step('c2', 'C', [1, 0], 'decision', 'New request?', 'Its thread decides', 'ArrowsSplit', 'An email on a new thread is a new request. One on a logged thread is a follow-up, so a reply never starts a second bid.', ['n8n']),
  step('c3', 'C', [1, 1.5], 'end', 'Add the follow-up', 'To its superintendent', 'Stack', 'The email is added to its request and passed to the request’s superintendent on Telegram, or to the bid desk while no one is assigned.', ['airtable', 'telegram']),
  step('c4', 'C', [2, 0], 'step', 'Log and assign', 'By the bid desk’s rota', 'UserCheck', 'A row in Bid requests, Respond by the end of the next business day, and the superintendent on bid duty assigned. An empty rota goes to the bid desk, who assign by hand.', ['airtable']),
  step('c5', 'C', [3, 0], 'step', 'Notify superintendent', 'Telegram', 'PaperPlaneTilt', 'The superintendent hears on Telegram with the sender, the subject, Respond by and links to the row and the thread in bids@, where any drawings are.', ['telegram']),
  step('c6', 'C', [4, 0], 'end', 'Acknowledge it', 'A fixed template', 'EnvelopeSimple', 'A fixed template replies on the thread: a superintendent, not a salesperson, will respond within one business day, and for storm or emergency, call (614) 555-0199.', ['gmail'], true),

  step('d1', 'D', [3, 0], 'trigger', 'Superintendent set', 'Airtable Trigger', 'Lightning', 'A separate n8n workflow, not a step in IL-01, starts once when a new request gets its superintendent, by the rota or by the bid desk.', ['n8n', 'airtable'], true),
  step('d2', 'D', [4, 0], 'agent', 'Read the request', 'One read at a time', 'ClipboardText', 'The agent reads the row, the email as written and the sender’s earlier requests. The drawings stay in bids@: it never opens them. An empty history reads as none on record.', ['airtable']),
  step('d3', 'D', [5, 0], 'ai', 'Summarise the email', 'Claude, no reply', 'Sparkle', 'Claude writes what the email says: the scope, the place and the dates as written, and whether drawings are attached. No reply, no price, nothing on an outage or a clearance.', ['claude']),
  step('d4', 'D', [6, 0], 'end', 'To the super only', 'Telegram', 'PaperPlaneTilt', 'The summary goes to the assigned superintendent’s own Telegram chat, with a link to the thread. Never to the sender, so it needs no one’s yes.', ['telegram']),

  step('e1', 'E', [1, 0], 'trigger', 'A crew asks', 'In Telegram', 'ChatCircleText', 'A crew member in the field asks Ironline’s Telegram bot a question about a field SOP or a unit of equipment.'),
  step('e2', 'E', [6, 0], 'end', 'Write the response', 'In one business day', 'PencilSimple', 'The superintendent reads the thread and the drawings in bids@, prices the bid and writes the response by hand, within one business day, then sets the row Responded.'),

  step('f1', 'F', [0, 0], 'trigger', 'SOPs loaded', 'Live-work parts out', 'Database', 'Each field SOP the safety director issues, and each night the equipment sheet, is split by section, embedded and stored in Supabase, with the switching, clearance and energized-work sections left out.', ['n8n', 'supabase'], true),
  step('f2', 'F', [1, 0], 'step', 'Search the SOPs', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the SOP sections and the equipment sheet’s rows, in Google Sheets.', ['supabase', 'google-sheets']),
  step('f3', 'F', [2, 0], 'ai', 'Claude answers', 'Only from the page', 'Sparkle', 'Claude answers only from the five passages, with the SOP and section or the sheet row. No invented figure or date, and never a switching, clearance or energized-work step.', ['claude']),
  step('f4', 'F', [3, 0], 'decision', 'On the page?', 'And not live work', 'Question', 'Did a passage hold the answer, and is the question clear of a live line, an outage, switching, clearance and energized work? Yes only if both.'),
  step('f5', 'F', [4, 0], 'end', 'Reply with source', 'SOP section or row', 'ArrowBendUpLeft', 'The answer goes back in Telegram with its source, like (Field SOP §3.1). It answers live from the SOPs, so it needs no one’s yes, and the job brief still comes first.', ['telegram']),
  step('f6', 'F', [4, 1.5], 'end', 'Stop and call', 'Your superintendent', 'UserSwitch', 'Anything about live work, or not in the SOPs: stop and call your superintendent. An emergency goes to (614) 555-0199. The bot forwards nothing.', ['telegram']),

  step('g1', 'G', [0, 0], 'trigger', 'Near-miss filed', 'On the report form', 'Warning', 'A crew member files a near-miss on the Airtable form: what happened, what stopped it, the lesson. Never who was at fault. Make picks it up within 15 minutes.', ['airtable', 'make'], true),
  step('g2', 'G', [1, 0], 'ai', 'Draft the bulletin', 'Near-miss agent', 'Sparkle', 'The Near-miss bulletin agent: one Make call to Claude, roles never names, no fault. A report touching switching or clearance gets Touches procedure Yes and an empty lesson.', ['claude']),
  step('g3', 'G', [2, 0], 'step', 'Save, tell director', 'Awaiting approval', 'Bell', 'The draft goes on the report’s row, Awaiting approval, and the safety director hears on Telegram, then again at 6 a.m. and 2 p.m. Eastern while it waits.', ['airtable', 'telegram']),
  step('g4', 'G', [3, 0], 'gate', 'Director approves', 'Within 48 hours', 'UserCheck', 'An approval gate: the safety director takes out any name, rewrites what they choose, writes any empty lesson and sets Approved. Nothing goes out before it.', ['airtable']),
  step('g5', 'G', [4, 0], 'step', 'Send company-wide', 'Email and crews', 'EnvelopeSimple', 'A fixed template emails the approved bulletin company-wide and posts it to the crews’ channel, ending with the fixed line on switching, clearance and energized work.', ['gmail', 'telegram'], true),
  step('g6', 'G', [5, 0], 'end', 'Mark it reviewed', 'Within 48 hours?', 'FlagCheckered', 'The report is set Sent, with the time and whether it went within 48 hours of filing, so the safety director can show the promise was kept.', ['airtable']),

  step('h1', 'H', [0, 0], 'trigger', 'Energization set', 'By the project lead', 'CalendarCheck', 'Switching is executed with operations, by people. Once the line is energized, the project lead sets the Energization date in Airtable, and Zapier starts the clock.', ['airtable', 'zapier'], true),
  step('h2', 'H', [1, 0], 'step', 'Clock and reminders', 'Lead and super', 'Clock', 'The lead hears the day closeout is due. On day eight, if the package has not gone, the lead and the superintendent are reminded; on the due day, the Projects group.', ['zapier', 'telegram'], true),
  step('h3', 'H', [2, 0], 'step', 'Package submitted', 'The closeout form', 'FileText', 'The project lead submits one PDF on the closeout form: the as-builts, the relay and continuity test reports and the closed punch list, as the crew made them.', ['airtable']),
  step('h4', 'H', [3, 0], 'gate', 'Superintendent checks', 'Human in the Loop', 'UserCheck', 'An approval gate: the superintendent gets an email link to a Zapier review page and approves or sends it back there. Opening the link records nothing.', ['zapier']),
  step('h5', 'H', [4, 0], 'decision', 'Approved?', 'Paths by Zapier', 'ArrowsSplit', 'The answer is written on the package’s row first, Approved or Sent back, then each path ends on its own.', ['zapier']),
  step('h6', 'H', [5, 0], 'end', 'Send the package', 'A fixed template', 'EnvelopeSimple', 'A fixed template emails the package to the owner’s closeout contact, copied to the superintendent and the lead, and sets Closeout sent on, which stops the clock.', ['gmail', 'airtable'], true),
  step('h7', 'H', [5, 1.5], 'end', 'Back to the lead', 'Fix and resubmit', 'XCircle', 'The lead hears on Telegram that the package was sent back. The superintendent says what to fix, nothing reaches the owner, and a new submission starts a new review.', ['telegram']),

  step('i1', 'I', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed IL-01 run, and a webhook hears a failed Make step in IL-02, or a failed or halted IL-03 run from Zapier Manager.', ['n8n'], true),
  step('i2', 'I', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab with what each source gives: n8n’s step and run link, Make’s step and error, or Zapier’s zap and time. Never a near-miss report’s text.', ['google-sheets']),
  step('i3', 'I', [2, 0], 'end', 'Alert the team', 'Telegram, by flow', 'Bell', 'The team that owns the flow hears on Telegram: the bid desk, the safety director or the Projects group. Nothing retries on its own.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'D', 'F', 'G', 'H', 'I'])
const SIDE = new Set(['c3', 'f6', 'h7'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('b1', 'c1'),
  flow('b2', 'b3'),
  flow('a1', 'c4', 'the week’s rota'),
  flow('c1', 'c2'),
  flow('c2', 'c4', 'New'),
  flow('c2', 'c3', 'Follow-up'),
  flow('c4', 'c5'),
  flow('c5', 'c6'),
  flow('c4', 'd1', 'assigned'),
  ...chain('d1', 'd2', 'd3', 'd4'),
  flow('d4', 'e2'),
  flow('e1', 'f2'),
  flow('f1', 'f2'),
  ...chain('f2', 'f3', 'f4'),
  flow('f4', 'f5', 'yes'),
  flow('f4', 'f6', 'no'),
  ...chain('g1', 'g2', 'g3', 'g4'),
  flow('g4', 'g5', 'approved'),
  flow('g5', 'g6'),
  flow('h1', 'h2'),
  flow('h2', 'h3', 'send Zap'),
  flow('h3', 'h4'),
  flow('h4', 'h5'),
  flow('h5', 'h6', 'Approved'),
  flow('h5', 'h7', 'Sent back'),
  loop('h5', 'h3', 'fixed, resubmitted'),
  ...chain('i1', 'i2', 'i3'),
]

const endToEnd: EndToEnd = {
  title: 'Ironline Utility Infrastructure · End-to-end workflow',
  description: 'Ironline Utility Infrastructure’s whole system as one live graph: bid requests assigned by the bid desk’s rota and summarised for the superintendent, storm calls answered by people, the crews’ Team knowledge bot, near-miss bulletins the safety director approves, closeouts the superintendent approves, and a failed run reaching the team that owns it.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · IRONLINE',
  heading: 'From Request a bid to a closeout the superintendent signed',
  lede: 'Every trigger, flow, bot and agent behind Ironline’s site, wired as one graph: a bid emailed to bids@, logged and assigned by the bid desk’s rota, summarised for the superintendent who answers it within one business day; a storm call answered by people; a crew member’s question answered from the field SOPs; a near-miss turned into a company bulletin within 48 hours; and a closeout package sent to the owner within ten business days of energization, once its superintendent approves.',
  stance: `${SAFE} ${YES} In IL-01, IL-02 and IL-03 Claude drafts only the near-miss bulletin, as the Near-miss bulletin agent; the Bid triage agent runs beside IL-01, not in it, and writes for one superintendent only. The bot answers crews live, without a yes, from the SOPs only and always with the source. The superintendent approves every closeout package before it reaches the owner, and nothing Claude writes reaches an owner’s inbox. The acknowledgement, the reminders and the closeout email are fixed templates and send on their own. No flow reaches a utility’s system operations: outages and switching are done by people.`,
  caption: 'Ironline, end to end · 9 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A bid, a question, a report or a package moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one bid, question, report or package moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until the safety director or the superintendent says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a clock or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool bid requests, the Bid triage agent, the bot and the failed-run log run in.'],
      ['Make', 'The automation tool near-miss reviews run in, with the Near-miss bulletin agent as its draft step.'],
      ['Zapier', 'The automation tool closeouts run in, with Human in the Loop and Paths.'],
      ['Claude', 'Anthropic’s AI model. It answers in the bot, summarises a bid for one superintendent, and drafts the near-miss bulletin.'],
      ['Airtable', 'Where Ironline keeps its bid requests, the Bid duty rota, its near-miss reports, its projects and closeout packages.'],
      ['Gmail', 'The bids@, safety@ and closeout@ mailboxes, which send every fixed template.'],
      ['Telegram', 'The chat app where superintendents hear of bids, crews ask the bot, the safety director hears of drafts, and a team hears of a failed run.'],
      ['Supabase', 'The database that stores the SOP passages and equipment rows the bot searches.'],
      ['Google Sheets', 'Where the equipment sheet and the Failed runs tab are kept.'],
      ['Template', 'A fixed message with blanks for the name, the project or the day. No AI writes it.'],
      ['Rota', 'The Bid duty table, where the bid desk puts one superintendent on bid duty each week.'],
      ['Superintendent', 'The person who reviews a bid and writes the response, runs the job, and approves its closeout. Never a salesperson.'],
      ['Safety director', 'The person who approves every near-miss bulletin before it goes company-wide.'],
      ['Project lead', 'The person who sets the Energization date and submits the closeout package.'],
      ['Job brief', 'The documented brief every task starts with. Switching, clearance and energized-work steps come from it.'],
      ['Switching', 'Taking a line out of service or putting it back, executed with system operations by people. No flow, bot or agent gives a step of it.'],
      ['Near-miss', 'Something that nearly went wrong in the field, filed on the report form with no names and no blame.'],
      ['Touches procedure', 'The flag Claude sets when a near-miss touches switching, clearance, an outage or energized work, so the safety director writes the lesson.'],
      ['Human in the Loop', 'Zapier’s approval step: the superintendent gets an email link to a review page, and only their choice there counts.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed or halted run from n8n, Make or Zapier.'],
      ['Approval gate', `A hard stop. ${YES} The superintendent approves every closeout package.`],
      ['Agent', 'An AI with one job that reads what it needs, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Ironline Utility Infrastructure is a fictional contractor, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
