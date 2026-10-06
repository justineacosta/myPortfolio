/**
 * Meridian Energy Infrastructure’s End-to-end case page (spec 2026-10-05
 * per-site pages): the developer’s whole system as one graph of ten lanes,
 * from a visitor’s question in the site chat and a survey request through
 * the wizard, through ME-01’s score, the Lead research agent and the energy
 * advisors, to a production fault and its 48-hour response, a monthly report
 * with the Report note agent’s note and the asset manager’s yes, and a failed
 * run reaching its team. No step tells a client to touch equipment, and no
 * step decides a payment. It tells the same story as Meridian Energy
 * Infrastructure’s Automation, Build plan and AI agents pages.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/meridian-energy-infrastructure/end-to-end.html. Only type
 * imports, so Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The electrical safety rule, as on Meridian Energy Infrastructure’s other pages. */
const SAFE = 'No flow, bot or agent tells a client to touch, reset, switch or isolate any equipment, and none reads SCADA or dispatches a technician: the operations centre logs every fault by hand, and the duty lead dispatches by phone. Every fault notice, and the bot’s fixed reply, says to leave the equipment as it is, and if there is fire, smoke or damaged equipment, or anyone is hurt, to keep clear and call 911, then the utility.'

/** The guarantee rule, as on Meridian Energy Infrastructure’s other pages. */
const MONEY = 'If the asset underperforms the model, Meridian writes the cheque: whether a payment is due, and how much, is the asset manager’s decision, made by hand. No flow, bot or agent works out, proposes or promises a saving for a site, a production figure or a payment, and no client email or note names a payment or an amount.'

/** The person’s-yes rule, as on Meridian Energy Infrastructure’s other pages. */
const YES = 'An energy advisor approves every first email Claude drafts for a prospect’s inbox, and the asset manager approves every report note before the report reaches a client.'

const LANES: Lane[] = [
  { id: 'A', name: 'Website sales bot', note: 'Site chat. Site figures only.' },
  { id: 'B', name: 'Firms asking', note: 'Request a Site Assessment.' },
  { id: 'C', name: 'Site survey (ME-01)', note: 'Make. Claude scores.' },
  { id: 'D', name: 'Lead research agent', note: 'n8n. An advisor says yes.' },
  { id: 'E', name: 'Energy advisors', note: 'People, by hand.' },
  { id: 'F', name: 'Production fault (ME-02)', note: 'n8n. The 911 line first.' },
  { id: 'G', name: 'Operations centre', note: 'People dispatch, by phone.' },
  { id: 'H', name: 'Report note agent', note: 'n8n. The manager says yes.' },
  { id: 'I', name: 'Production report (ME-03)', note: 'Zapier. The manager approves.' },
  { id: 'J', name: 'Failed runs (ME-H02)', note: 'n8n. The owning team hears.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'A visitor asks', 'In the site chat', 'ChatCircleText', 'Someone asks in the chat on the site. Its workflow keeps no chat, and it never asks for a name, an email or a bill.', ['n8n']),
  step('a2', 'A', [1, 0], 'decision', 'Equipment words?', 'A fixed n8n If', 'ShieldWarning', 'Before any search or Claude, a fixed n8n If checks the question for equipment words the operations centre keeps, like breaker, reset or smoke. A match gets a fixed reply.', ['n8n'], true),
  step('a3', 'A', [1, 1.5], 'end', 'Keep clear, call 911', 'Fixed reply', 'HandPalm', 'If you see fire, smoke or damaged equipment, or anyone is hurt, keep clear and call 911, then your utility. Don’t touch, reset or switch off any equipment. For anything else, call an energy advisor on (713) 555-0142.'),
  step('a4', 'A', [2, 0], 'step', 'Search the site', 'Top 5 passages', 'MagnifyingGlass', 'The question is searched in Supabase, which holds the site’s own pages and the figures they publish, from a Google Sheet. No prices: the site lists none.', ['supabase', 'google-sheets']),
  step('a5', 'A', [3, 0], 'ai', 'Claude answers', 'Published ranges only', 'Sparkle', 'Claude answers only from the five passages, naming the source, and quotes a figure only as the site publishes it. Never a saving, a production figure or a payment for this site.', ['claude']),
  step('a6', 'A', [4, 0], 'decision', 'On the page?', 'No site’s own number', 'Question', 'Claude’s own check, behind the fixed one: did a passage hold the answer, and does it stay with the site’s published figures? Yes only if both.'),
  step('a7', 'A', [5, 0], 'step', 'Reply with source', 'Names the page', 'ArrowBendUpLeft', 'The answer goes back in the chat with its source, like (Solutions guide). It answers live from the site’s pages, so it needs no one’s yes.'),
  step('a8', 'A', [4, 1.5], 'end', 'To an energy advisor', 'Phone or email', 'UserSwitch', 'Not on the site, or a number only the survey gives: a fixed reply points to an energy advisor, (713) 555-0142 or email, and ends with the 911-then-utility line.'),
  step('a9', 'A', [5, 1.5], 'step', 'Offer an assessment', 'Opens the wizard', 'CalendarCheck', 'The bot asks “Book a site assessment?” and opens the site’s own wizard. Cal.com belongs to ME-01’s Book the survey step; the bot books nothing, and never calls it free.'),

  step('b1', 'B', [0, 0], 'trigger', 'Requests a survey', 'The site’s wizard', 'Buildings', 'A facility or finance team answers the wizard’s four questions: the facility, the area and monthly spend, the location and the structure, then presses Book the site survey.'),

  step('c1', 'C', [0, 0], 'ai', 'Score the site', 'Claude, 1 to 10', 'Sparkle', 'Make catches the wizard. Claude scores the site on its area, spend and location against the 80,000 sq ft or 250 kW minimum, never reading the name or email.', ['make', 'claude'], true),
  step('c2', 'C', [1, 0], 'step', 'Log and tell', 'Sheet, then advisors', 'Table', 'The request goes on the pipeline sheet with its score, reason and Confirm by, and the energy advisors hear of it on Telegram, whatever the score.', ['google-sheets', 'telegram'], true),
  step('c3', 'C', [2, 0], 'decision', 'Strong fit?', 'Router, 7 or more', 'ArrowsSplit', 'A score of 7 or more goes to booking. A lower score, or no score, takes the Router’s fallback route to the guide.', ['make']),
  step('c4', 'C', [3, 0], 'step', 'Book the survey', 'Gmail + Cal.com', 'CalendarCheck', 'A fixed template emails the link to book a drone survey window on Cal.com, which waits for an advisor. It holds the reference, never the score.', ['gmail', 'cal-com'], true),
  step('c5', 'C', [2, 1.5], 'step', 'Send the guide', 'A fixed template', 'EnvelopeSimple', 'A fixed template emails a savings guide for the kind of facility, with no figure for the site, and says an energy advisor will be in touch within one business day.', ['gmail'], true),

  step('d1', 'D', [1, 0], 'trigger', 'Strong fit logged', 'Sheets Trigger', 'Lightning', 'A separate n8n workflow, not a step in ME-01, starts on a new Requests row with Route Strong fit, and reads ME-01’s score. It never scores again.', ['n8n', 'google-sheets'], true),
  step('d2', 'D', [2, 0], 'agent', 'Research the firm', 'Public pages only', 'Globe', 'The agent reads the firm’s own website and public pages, never anything about the person, and saves the research with its sources in Supabase, the CRM.', ['supabase']),
  step('d3', 'D', [3, 0], 'ai', 'Draft the email', 'No figure, no score', 'PencilSimple', 'Claude drafts the energy advisor’s first personal email. A fixed check turns any draft with a figure, a saving, a payment, the score or the word free into no draft.', ['claude']),
  step('d4', 'D', [4, 0], 'gate', 'Advisor’s yes', 'In Telegram', 'UserCheck', 'An approval gate: an advisor approves the draft in Telegram or sends it back; only an Approve submit sends. After a day unanswered, the advisors are told it still needs them, and nothing sends.', ['telegram']),
  step('d5', 'D', [5, 0], 'end', 'Send the email', 'Word for word', 'PaperPlaneTilt', 'The approved email goes from projects@meridianenergy.com, signed by the advisor who approved it, and Supabase records who approved it and when.', ['gmail'], true),

  step('e1', 'E', [3, 0], 'gate', 'Advisor confirms', 'One business day', 'UserCheck', 'An approval gate: an energy advisor confirms the window in Cal.com within one business day, as the wizard promises, and Cal.com sends its own confirmation.', ['cal-com']),
  step('e2', 'E', [4, 0], 'end', 'Drone survey', 'Then the proposal', 'FlagCheckered', 'Engineers survey the site. The modelled proposal, interconnection assessment and draft PPA pricing follow within twenty business days of the site visit, by people.'),
  step('e3', 'E', [2, 0], 'end', 'Advisor follows up', 'One business day', 'Phone', 'An energy advisor reads the answers and Claude’s reason, then calls or writes within one business day: a survey window after all, or why the site is not a fit yet.', ['google-sheets']),

  step('f1', 'F', [0, 0], 'trigger', 'Fault logged', 'By hand, in Airtable', 'Warning', 'The operations centre sees a production fault on its 24/7 SCADA and logs it by hand in Faults. n8n picks it up within a minute. No flow reads SCADA.', ['airtable', 'n8n'], true),
  step('f2', 'F', [1, 0], 'step', 'Open a ticket', 'Respond by: 48 hours', 'Table', 'A ticket opens, with Respond by 48 hours after the fault was detected: the contracted 48-hour response, which is a response, not a repair.', ['airtable'], true),
  step('f3', 'F', [2, 0], 'step', 'Tell the duty lead', 'Telegram, with sound', 'Bell', 'The operations group hears at once, day or night, with the asset, what was seen, Respond by and a link to the ticket.', ['telegram'], true),
  step('f4', 'F', [3, 0], 'decision', 'Contact on file?', 'Always Output Data', 'ArrowsSplit', 'The asset’s notice contact is looked up. A search that finds none still goes on, as no contact, so no fault goes unannounced.', ['n8n']),
  step('f5', 'F', [4, 0], 'step', 'Notify the client', 'The 911 line first', 'EnvelopeSimple', 'A fixed template opens with fire, smoke, damaged equipment or anyone hurt: keep clear, call 911, then the utility. Then the 48-hour response, and to touch nothing.', ['gmail'], true),
  step('f6', 'F', [3, 1.5], 'step', 'Ask for a call', 'ME-H01, urgent', 'Phone', 'No notice contact on file: the operations group is told at once, and the duty lead tells the client by phone and adds the contact to the asset.', ['telegram']),

  step('g1', 'G', [5, 0], 'step', 'Lead dispatches', 'By phone', 'UserCheck', 'The duty lead picks the field technician on call, calls them and sets the ticket Dispatched. No step picks, messages or sends a technician.', ['airtable']),
  step('g2', 'G', [6, 0], 'end', 'Response recorded', 'Within 48 hours?', 'FlagCheckered', 'The duty lead sets Responded at once a technician is working the fault. Every hour n8n warns the operations group once, 12 hours before Respond by.', ['airtable', 'n8n']),

  step('h1', 'H', [0, 0], 'trigger', 'Every 15 minutes', 'Reports to note', 'Clock', 'n8n lists the reports ME-03 has drafted, or an asset manager added by hand, with Status To check and no note yet. Nothing to note ends quietly.', ['n8n', 'airtable'], true),
  step('h2', 'H', [1, 0], 'ai', 'Draft the note', 'Claude, figures only', 'Sparkle', 'Claude writes a plain-language note from the report’s own figures: generation at the meter against the model. No cause it was not given, no payment, no amount.', ['claude']),
  step('h3', 'H', [2, 0], 'decision', 'Passes the check?', 'A fixed n8n Code', 'ShieldCheck', 'A fixed n8n Code node reads the draft: any figure not on the report, or any word about money or equipment, and it is not kept.', ['n8n'], true),
  step('h4', 'H', [3, 0], 'step', 'Write Note draft', 'On the report’s row', 'Database', 'The draft goes in Note draft on the report’s row. The agent never writes Note or Status, and never sends.', ['airtable']),
  step('h5', 'H', [2, 1.5], 'step', 'No draft', 'Written by hand', 'PencilSimple', 'A draft that fails the check, or that Claude could not write, leaves Note draft saying to write the note by hand.', ['airtable']),

  step('i1', 'I', [0, 0], 'trigger', 'On the 10th', 'Schedule by Zapier', 'CalendarCheck', 'At 7 a.m. Central the asset managers hear which months are not reconciled. From 8 a.m., hourly passes draft every reconciled month’s report.', ['zapier'], true),
  step('i2', 'I', [1, 0], 'step', 'Draft each report', 'Airtable formulas', 'Table', 'One report per asset per month: metered generation against the model, the difference and Below model, all Airtable formulas. Claude writes none of the figures.', ['airtable', 'zapier'], true),
  step('i3', 'I', [2, 0], 'step', 'Tell the manager', 'Telegram', 'PaperPlaneTilt', 'The asset’s asset manager hears a report is ready. A month below the model says so, and that any payment is theirs to decide.', ['telegram'], true),
  step('i4', 'I', [3, 0], 'gate', 'Manager approves', 'Note, then Approved', 'UserCheck', 'An approval gate: the asset manager reads the report, edits Note draft into Note, or writes it, and sets Approved. The Zaps never set Approved.', ['airtable']),
  step('i5', 'I', [4, 0], 'step', 'Send the report', 'Gmail, fixed', 'EnvelopeSimple', 'A fixed template emails the report and the approved note, never a payment or an amount, and the report is marked Sent, so a later edit never sends it twice.', ['gmail', 'airtable'], true),
  step('i6', 'I', [5, 0], 'end', 'Shortfall decision', 'By hand', 'Scales', 'The asset manager reviews a month below the model against the contract’s production guarantee and decides any payment, and how much, by hand.', ['airtable']),

  step('j1', 'J', [0, 0], 'trigger', 'A run fails', 'n8n, Make or Zapier', 'Warning', 'n8n’s Error Trigger hears a failed ME-02 run, and a webhook hears a failed Make step in ME-01, or a failed or halted ME-03 run from Zapier Manager.', ['n8n'], true),
  step('j2', 'J', [1, 0], 'step', 'Log the failed run', 'Google Sheets', 'Table', 'A row in the Failed runs tab with what each source gives: Make’s step and error, n8n’s step and run link, or Zapier’s zap and time. No visitor’s details.', ['google-sheets']),
  step('j3', 'J', [2, 0], 'end', 'Alert the team', 'Telegram, by flow', 'Bell', 'The owning team hears on Telegram, urgently for a failure, and nothing retries. The two agents are not covered: a failed agent run leaves no draft, and a person writes it.', ['telegram']),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['A', 'C', 'D', 'F', 'G', 'H', 'I', 'J'])
const SIDE = new Set(['a3', 'a8', 'a9', 'c5', 'f6', 'h5'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'a2'),
  flow('a2', 'a4', 'no'),
  flow('a2', 'a3', 'equipment'),
  ...chain('a4', 'a5', 'a6'),
  flow('a6', 'a7', 'yes'),
  flow('a6', 'a8', 'no'),
  flow('a7', 'a9', 'wants one'),
  flow('a9', 'b1', 'the wizard'),
  flow('b1', 'c1', 'Book the site survey'),
  ...chain('c1', 'c2', 'c3'),
  flow('c3', 'c4', 'Strong fit'),
  flow('c3', 'c5', 'Not yet'),
  flow('c2', 'd1', 'a Strong fit row'),
  flow('c4', 'e1', 'window booked'),
  flow('c5', 'e3'),
  ...chain('d1', 'd2', 'd3', 'd4'),
  flow('d4', 'd5', 'approved'),
  loop('d4', 'd3', 'change it'),
  flow('e1', 'e2'),
  ...chain('f1', 'f2', 'f3', 'f4'),
  flow('f4', 'f5', 'Found'),
  flow('f4', 'f6', 'None'),
  flow('f5', 'g1'),
  flow('f6', 'g1'),
  flow('g1', 'g2'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'h4', 'yes'),
  flow('h3', 'h5', 'no'),
  flow('h4', 'i4', 'Note draft'),
  flow('h5', 'i4', 'by hand'),
  ...chain('i1', 'i2', 'i3', 'i4'),
  flow('i4', 'i5', 'Approved'),
  flow('i5', 'i6', 'if below'),
  ...chain('j1', 'j2', 'j3'),
]

const endToEnd: EndToEnd = {
  title: 'Meridian Energy Infrastructure · End-to-end workflow',
  description: 'Meridian Energy Infrastructure’s whole system as one live graph: the Website sales bot, survey requests scored and in front of an energy advisor, the Lead research agent’s first email on an advisor’s yes, production faults with a 48-hour response and a person dispatching, monthly reports with the Report note agent’s note and the asset manager’s yes, and a failed run reaching its team.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · MERIDIAN ENERGY',
  heading: 'From a question in the site chat to a month of generation reported against the model',
  lede: 'Every trigger, flow, bot and agent behind Meridian Energy Infrastructure’s site, wired as one graph: a visitor’s question answered from the site’s own published figures; a survey request from the wizard scored, logged and in front of an energy advisor within minutes, and answered by a person within one business day; a strong-fit firm researched from its public pages and sent a first email an advisor approved; a production fault logged by the operations centre, ticketed, announced to the client with the contracted 48-hour response and dispatched by the duty lead; and each month, every asset’s report, measured at the meter and reconciled to utility settlement, with a note the asset manager approved.',
  stance: `${SAFE} ${MONEY} ${YES} That is every Lead research email, in Telegram, and every report note, in Airtable. The booking email, the savings guide, the fault notice and the report email are fixed templates; the report email sends only once the asset manager has approved the report. The bot answers live, without a yes, from the site’s pages only. In ME-01, ME-02 and ME-03 Claude only scores survey requests; the two agents run beside the flows, and the Lead research agent reads ME-01’s score rather than scoring again.`,
  caption: 'Meridian Energy Infrastructure, end to end · 10 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A question, a request, a fault or a report moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one question, request, fault or report moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again, like a first email an advisor sends back.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until an energy advisor or the asset manager says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a fixed check or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['Make', 'The automation tool survey requests run in, from the wizard to the booking email or the guide.'],
      ['n8n', 'The automation tool production faults, the bot, both agents and the failed-run log run in.'],
      ['Zapier', 'The automation tool monthly production reports run in.'],
      ['Claude', 'Anthropic’s AI model. It scores survey requests, answers in the bot, drafts the Lead research email and the report note.'],
      ['Airtable', 'Where Meridian keeps its assets, faults, tickets, production months and reports.'],
      ['Google Sheets', 'Where the pipeline sheet of survey requests, the bot’s published figures and the Failed runs tab are kept.'],
      ['Cal.com', 'Where a strong site books its drone survey window, for an energy advisor to confirm.'],
      ['Gmail', 'The mailbox that sends every booking email, guide, fault notice, report and approved first email.'],
      ['Telegram', 'The chat app where the advisors, the duty leads and the asset managers hear of their work, and advisors approve first emails.'],
      ['Supabase', 'The database that stores the bot’s passages and the CRM of strong-fit requests and their research.'],
      ['Wizard', 'The site’s four questions behind Request a Site Assessment, ending in Book the site survey.'],
      ['Strong fit', 'ME-01’s route for a site scoring 7 or more out of 10.'],
      ['Router', 'Make’s way of splitting a scenario; its fallback route takes a low score or no score.'],
      ['Energy advisor', 'The person who confirms every survey window, follows up every other request and approves every first email.'],
      ['Duty lead', 'The person in the operations centre who dispatches a technician by phone.'],
      ['Asset manager', 'The person accountable for an operating asset, who approves its report and decides any payment.'],
      ['SCADA', 'The operations centre’s 24/7 monitoring. People read it; no flow does.'],
      ['Respond by', 'The time on a ticket 48 hours after the fault was detected: the contracted response, not a repair.'],
      ['Note draft', 'The field where the Report note agent writes. The asset manager edits it into the note the client reads.'],
      ['Shortfall decision', 'The asset manager’s own call, by hand, on any payment for a month below the model.'],
      ['Template', 'A fixed message with blanks for the site, the asset or the month. No AI writes it.'],
      ['Failed runs', 'The Google Sheets tab that logs each failed or halted run from Make, n8n or Zapier.'],
      ['Approval gate', `A hard stop. ${YES}`],
      ['Agent', 'An AI with one job that reads what it needs, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Meridian Energy Infrastructure is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
