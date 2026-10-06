/**
 * Riverdale & Brooks’s End-to-end case page (spec 2026-10-05 per-site pages):
 * the firm’s whole system as one graph of nine lanes, from a consultation
 * request, a visitor’s question, an email and a booking to the consultation,
 * the engagement, the monthly invoice and each milestone notice. It tells the
 * same story as the firm’s Automation, Build plan and AI agents pages, and
 * nothing confidential enters any automated step. data/cases/index.ts
 * registers it; `npm run cases` renders it into
 * public/cases/riverdale-and-brooks/end-to-end.html. Only type imports, so
 * Node can run it directly.
 */
import type { Cable, EndToEnd, Lane, LaneId, Step, StepKind } from '../../endToEnd.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, tools: ToolId[] = [], enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(tools.length ? { tools } : {}), ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

/** The page note on vendors, word for word as on the Build plan and AI agents pages. */
const VENDORS = 'Before any client’s matter goes into these tools, the firm would confirm each vendor’s confidentiality terms and the client’s informed consent, as the profession’s ethics guidance on AI expects.'

const LANES: Lane[] = [
  { id: 'A', name: 'Visitors and clients', note: 'Where every story starts.' },
  { id: 'B', name: 'Website', note: 'One form, a chat, a calendar.' },
  { id: 'C', name: 'Consultation request (RB-01)', note: 'n8n. Templates reply.' },
  { id: 'D', name: 'Practice Q&A bot', note: 'Never legal advice.' },
  { id: 'E', name: 'Inbox triage agent', note: 'Waits for Ruth’s yes.' },
  { id: 'F', name: 'Consultation prep agent', note: 'For Daniel alone.' },
  { id: 'G', name: 'The consultation', note: 'Daniel and Ruth, by hand.' },
  { id: 'H', name: 'Monthly invoice (RB-02)', note: 'Make. Daniel sends it.' },
  { id: 'I', name: 'Milestone notice (RB-03)', note: 'Zapier. From Daniel.' },
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Someone asks to meet', 'Request a consultation', 'UserPlus', 'Someone fills in Request a consultation: a name, phone, email, the area and, if they like, a few sentences about their situation, then presses Send request.'),
  step('a2', 'A', [1, 0], 'trigger', 'A visitor asks', 'Day or night', 'ChatCircleText', 'A visitor opens the chat on the firm’s site with a practical question, like what a first consultation costs or whether they can meet by video.'),
  step('a4', 'A', [2, 0], 'trigger', 'Someone books', 'From a link or the bot', 'CalendarPlus', 'Someone requests a 30-minute consultation from the link in a reply, or from the bot, in the office or by video. It is a request until Ruth confirms it.'),
  step('a3', 'A', [3, 0], 'trigger', 'Someone emails', 'office@', 'EnvelopeSimple', 'Someone writes to office@riverdalebrooks.law: a new enquiry, a practical question, or mail from a client, a court or opposing counsel, meant for Daniel.'),

  step('b1', 'B', [0, 0], 'step', 'The one form', 'Request a consultation', 'Note', 'It says sending it creates no attorney-client relationship, and asks people not to include confidential details yet. Send request posts it to n8n.'),
  step('b2', 'B', [1, 0], 'step', 'Site chat', 'On every page', 'ChatCircleDots', 'The chat on every page of the site. It answers live from the site’s public pages, keeps no transcript and never sends an email.'),
  step('b3', 'B', [2, 0], 'step', 'The calendar', 'Cal.com, 30 minutes', 'CalendarCheck', 'Two Cal.com event types, Estate planning consultation and Consultation, ask only for a name and email, with Requires confirmation on: a booking is a request until Ruth confirms it, and only then does Cal.com send its confirmation.', ['cal-com']),

  step('c1', 'C', [0, 0], 'step', 'Keep and save contact', 'Edit Fields, Airtable', 'Funnel', 'Keeps the name, phone, email and area, drops the few sentences before anything is stored, and saves the person to Contacts. n8n saves no execution.', ['n8n', 'airtable'], true),
  step('c2', 'C', [1, 0], 'decision', 'Situation written?', 'IF, keeps nothing', 'ArrowsSplit', 'Checks, without keeping them, whether the few sentences were filled in. When they are blank there is nothing for Daniel.', ['n8n']),
  step('c3', 'C', [2, 1], 'step', 'To Daniel’s inbox', 'His own Gmail', 'EnvelopeSimple', 'Emails the few sentences, exactly as typed, from Daniel’s own address to his own inbox. They pass through n8n and Gmail only to reach it, and never reach office@ or Claude.', ['gmail']),
  step('c4', 'C', [3, 0], 'decision', 'Estate planning?', 'Switch', 'ArrowsSplit', 'Estate planning & probate gets the free reply; every other area, Something else included, gets the $150 reply.', ['n8n']),
  step('c5', 'C', [4, 0], 'step', 'Free consult reply', 'A fixed template', 'EnvelopeSimple', 'A fixed template, not Claude: the estate planning consultation is free, the link to request a time, which Ruth confirms within one business day, what to bring, and please don’t send confidential details yet.', ['gmail'], true),
  step('c6', 'C', [4, 1], 'step', '$150 consult reply', 'A fixed template', 'EnvelopeSimple', 'The same template with the other price: $150 for the first thirty minutes, credited if they hire the firm, and the call for a referral on criminal or injury work.', ['gmail'], true),
  step('c7', 'C', [5, 0], 'end', 'Alert Ruth', 'Telegram, RB-H01', 'Bell', 'Ruth gets the name, phone, area and which reply went out, and whether a note went to Daniel, never what it says. She follows up within one business day.', ['telegram']),

  step('d1', 'D', [0, 0], 'step', 'Search the pages', 'Top 5 passages', 'MagnifyingGlass', 'The question is embedded and searched in Supabase against the site’s public pages and guides: the practice areas, the fees, the FAQ and the visiting details.', ['supabase']),
  step('d2', 'D', [1, 0], 'ai', 'Claude answers', 'Only from passages', 'Sparkle', 'Claude gets the question and the five passages, with one rule: answer only from them. It never gives a price or a date the pages do not hold, and never legal advice.', ['claude']),
  step('d3', 'D', [2, 0], 'decision', 'Sure, not advice?', 'A page settles it', 'Question', 'Did a page hold the answer? Any question about someone’s own situation, rights or next step counts as no, and so does anything the pages do not say.'),
  step('d4', 'D', [3, 0], 'step', 'Reply with a source', 'Live, in the chat', 'ArrowBendUpLeft', 'The answer goes back in the chat with its page. A live answer needs no one’s yes, and the bot never sends an email.'),
  step('d5', 'D', [4, 0], 'end', 'Book a consultation', 'The matching fee', 'CalendarCheck', 'The bot opens the Cal.com page that matches the fee: free for estate planning, $150 credited for any other area. A booking there is a request until Ruth confirms it.', ['cal-com']),
  step('d6', 'D', [3, 1], 'decision', 'Criminal or injury?', 'Not handled here', 'Question', 'The firm handles no criminal defense or personal injury, so the bot checks for those before offering a consultation. It gives no advice either way.'),
  step('d7', 'D', [4, 1], 'end', 'Call for a referral', '(540) 555-0148', 'Phone', 'In the site’s own words: call anyway, and the firm will refer you to colleagues it trusts. The bot forwards nothing.'),
  step('d8', 'D', [4, 2], 'end', 'Book or call Daniel', 'No legal advice', 'UserSwitch', 'The bot says it can’t give legal advice, asks for no details, and offers a consultation, the phone or the office’s email to write themselves.', ['cal-com']),

  step('e1', 'E', [0, 0], 'trigger', 'A new email', 'office@, each minute', 'EnvelopeSimple', 'n8n checks office@, never daniel@, every minute. It looks the sender up in Contacts and Court domains first: an existing client, a row with a matter, a court on the list, or an attachment goes For Daniel before Claude sees it.', ['n8n', 'airtable'], true),
  step('e2', 'E', [1, 0], 'ai', 'Claude sorts it', 'One label, no notes', 'Sparkle', 'Within one run Claude sees the sender, subject and text, to choose For Daniel, New enquiry or Admin and, for those two, to draft the reply. It keeps no copy, summary or note.', ['claude']),
  step('e3', 'E', [2, 0], 'decision', 'Which label?', 'One of three', 'ArrowsSplit', 'Opposing counsel, a court not on the list, confidential details or anything unsure is For Daniel. Opposing counsel can’t be routed before Claude without storing who the parties are, so Claude reads that mail only to sort it, and keeps nothing. Someone asking to meet is New enquiry; a practical question is Admin.'),
  step('e4', 'E', [3, 1], 'end', 'For Daniel, untouched', 'A Gmail label only', 'Tag', 'The email gets the For Daniel label and nothing else: no draft, summary, copy or log of its words. Daniel gets a ping with no name in it, and reads it himself.', ['gmail', 'telegram']),
  step('e5', 'E', [3, 0], 'agent', 'Draft the reply', 'Site facts', 'PencilSimple', 'Claude drafts a reply from the site’s passages, one tool call at a time: the right fee and booking link for a New enquiry, or the site’s answer for Admin.', ['supabase', 'claude']),
  step('e6', 'E', [4, 0], 'gate', 'Ruth’s yes', 'Approve in Telegram', 'UserCheck', 'An approval gate: the reply is for someone’s inbox, so it waits in Telegram with Approve and Change it. The message holds only the drafted reply, never the sender’s words. n8n keeps the run, email included, only while it waits, and none once it ends. Nothing is sent until Ruth taps Approve.', ['telegram']),
  step('e7', 'E', [5, 0], 'end', 'Send the reply', 'From office@', 'PaperPlaneTilt', 'The approved reply goes from office@, never Daniel’s address, and the run is logged in Agent runs: its time, label and Ruth’s yes, never the email’s words.', ['gmail', 'google-sheets']),

  step('f1', 'F', [0, 0], 'trigger', 'A booking confirmed', 'Cal.com Trigger', 'CalendarPlus', 'n8n hears a consultation Ruth has confirmed: its Cal.com Trigger listens for Booking Created, which Cal.com sends for these event types only once she confirms. It saves no execution. A booking holds a name, an email, a time and office or video.', ['n8n', 'cal-com'], true),
  step('f2', 'F', [1, 0], 'agent', 'Read the booking', 'Cal.com and Airtable', 'Wrench', 'One tool call at a time: the booking in Cal.com, then the area on the person’s Contacts row, with Always Output Data on. With no row, the event type sets the area, or the general checklist.', ['cal-com', 'airtable']),
  step('f3', 'F', [2, 0], 'agent', 'Find the checklist', 'The site’s guides', 'Books', 'Searches the site’s passages for the area: what to bring, the matching guide, and that wills are signed in person with witnesses.', ['supabase']),
  step('f4', 'F', [3, 0], 'ai', 'Claude writes the prep', 'For Daniel only', 'Sparkle', 'A short prep: the time, office or video, the area, the fee and the checklist, with the line conflict check: clear, as Ruth confirmed the booking only after it. It never reads the few sentences.', ['claude']),
  step('f5', 'F', [4, 0], 'end', 'To Daniel, alone', 'His Telegram chat', 'PaperPlaneTilt', 'The prep goes to Daniel’s own Telegram chat and nowhere else, and the run is logged in Agent runs by time and booking only.', ['telegram', 'google-sheets']),

  step('g2', 'G', [0, 0], 'decision', 'Conflict check', 'By hand', 'ListChecks', 'Before she confirms the time, Ruth checks by hand that the firm acts for no one on the other side, calling for the other party’s name if she needs it. It is never a flow: no tool reads the conflict list or keeps a party’s name. Once it is clear she confirms the booking, and the prep agent starts.'),
  step('g1', 'G', [1, 0], 'step', 'The consultation', 'Office or video', 'Handshake', 'Once the check is clear, Daniel meets them for thirty minutes. Whatever they wrote is in his own inbox; whatever they tell him stays with him, and they decide whether to go ahead.'),
  step('g3', 'G', [2, 0], 'step', 'Engagement letter', 'Signed, by hand', 'Signature', 'The plan and the fee go into an engagement letter they both sign. Only then does an attorney-client relationship begin. Someone who decides not to go ahead is sent nothing more.'),
  step('g6', 'G', [1, 1], 'end', 'Request declined', 'Nothing more sent', 'XCircle', 'A conflict ends here: Ruth declines the request in Cal.com, with no reason that names anyone. No consultation, no relationship, and no flow sends them anything more.'),
  step('g4', 'G', [3, 0], 'step', 'Ruth opens the matter', 'Matters, Airtable', 'FolderPlus', 'Ruth opens the matter in Airtable by hand: the client, the area, flat or hourly, and Engagement signed on. No field holds what it is about.', ['airtable']),
  step('g5', 'G', [4, 0], 'step', 'Daniel logs time', 'Time entries, Airtable', 'Timer', 'On an hourly matter, Daniel logs each piece of work: the date, a kind of work from a fixed list and the hours, to the tenth. No free text.', ['airtable']),

  step('h1', 'H', [0, 0], 'trigger', 'On the 1st', 'Make, at 7:00', 'Clock', 'Make starts the monthly invoice run on the 1st of each month, as the site promises: hourly matters are billed monthly.', ['make'], true),
  step('h2', 'H', [1, 0], 'step', 'Gather the time', 'Airtable API calls', 'MagnifyingGlass', 'Finds every open hourly matter, then each one’s time entries on no invoice yet, with calls that always return a list, even an empty one.', ['airtable']),
  step('h3', 'H', [2, 0], 'decision', 'Ready to bill?', 'Router', 'ArrowsSplit', 'Time logged and a Stripe customer goes on to be drafted; time with no Stripe customer goes to Ruth. With no time logged, nothing is drafted.'),
  step('h4', 'H', [3, 0], 'step', 'Draft the invoice', 'A draft', 'Receipt', 'A Stripe draft, one line per entry: the date, the kind of work, the hours and the amount. Auto-advance is off, so it goes to no one on its own.', ['stripe'], true),
  step('h5', 'H', [3, 1], 'end', 'Ask Ruth', 'Telegram', 'Warning', 'Ruth is asked to add the client in Stripe. She does, runs the draft scenario once more, and the draft follows.', ['telegram']),
  step('h6', 'H', [4, 0], 'gate', 'Daniel’s yes', 'In Stripe, by hand', 'UserCheck', 'At 7:30 Daniel gets one email listing the drafts. He checks each against his time and presses Send invoice in Stripe. Nothing reaches a client before he does.', ['gmail', 'stripe']),
  step('h7', 'H', [5, 0], 'end', 'Paid', 'Online or by check', 'CreditCard', 'The client pays on Stripe’s invoice page, or by check to the office, which Ruth marks paid in Stripe by hand.', ['stripe']),

  step('i1', 'I', [0, 0], 'trigger', 'Stage moved', 'Airtable, by Ruth', 'Table', 'Ruth moves a matter to the next of the site’s six steps, from Consultation to Resolution, and the Zap starts.', ['zapier', 'airtable'], true),
  step('i2', 'I', [1, 0], 'step', 'Clients only', 'Filter by Zapier', 'Funnel', 'Goes on only for a signed engagement letter, a client email, and a stage past the last one noticed. A stage moved back sends nothing.', ['zapier']),
  step('i3', 'I', [2, 0], 'step', 'Log the notice', 'Matters, Airtable', 'ListChecks', 'Notes the step reached, the date and which way the notice goes, before anything is sent, so the same stage never sends twice.', ['airtable']),
  step('i4', 'I', [3, 0], 'decision', 'Daniel adds a line?', 'Zapier Paths', 'ArrowsSplit', 'Template only, or, when Daniel adds a line was ticked on the matter, the notice waits in Daniel’s drafts for his line.'),
  step('i5', 'I', [4, 1], 'step', 'Draft it for Daniel', 'Gmail, then Telegram', 'PencilSimple', 'The template goes into Daniel’s Gmail drafts with a space for his line, and Telegram tells him it is waiting. His line never passes through Zapier.', ['gmail', 'telegram']),
  step('i6', 'I', [5, 0], 'end', 'Notice goes out', 'From daniel@', 'EnvelopeSimple', 'A fixed “where your matter stands” email from Daniel’s address, sent by Zapier, or by Daniel himself once his line is in. A reply reaches him, not office@.', ['gmail'], true),
  step('i7', 'I', [5, 1], 'end', 'Ruth reminded', 'Each Monday, a Zap', 'Bell', 'A separate Zap lists for Ruth every notice that has waited in Daniel’s drafts for more than a week. She marks each Sent by Daniel by hand.', ['zapier', 'telegram'], true),
]

/** Lanes whose steps read in order, one per column, carry numbers; a branch’s side exit does not. */
const NUMBERED = new Set<LaneId>(['C', 'E', 'F', 'G', 'H', 'I'])
const SIDE = new Set(['c3', 'c6', 'e4', 'g6', 'h5', 'i5', 'i7'])

// Order matters for the layout: cables that share a gap take its slots in turn, and side-channel cables take tracks from the outside in.
const CABLES: Cable[] = [
  flow('a1', 'b1'),
  flow('a2', 'b2'),
  flow('a4', 'b3'),
  flow('a3', 'e1'),
  flow('b1', 'c1'),
  flow('b2', 'd1'),
  flow('b3', 'g2'),
  flow('c1', 'c2'),
  flow('c2', 'c4', 'no'),
  flow('c2', 'c3', 'yes'),
  flow('c3', 'c4'),
  flow('c4', 'c5', 'yes'),
  flow('c4', 'c6', 'no'),
  flow('c5', 'c7'),
  flow('c6', 'c7'),
  ...chain('d1', 'd2', 'd3'),
  flow('d3', 'd4', 'yes'),
  flow('d3', 'd6', 'no'),
  flow('d4', 'd5', 'wants to meet'),
  flow('d6', 'd7', 'yes'),
  flow('d6', 'd8', 'no'),
  ...chain('e1', 'e2', 'e3'),
  flow('e3', 'e5', 'New or Admin'),
  flow('e3', 'e4', 'For Daniel'),
  flow('e5', 'e6'),
  flow('e6', 'e7', 'approved'),
  loop('e6', 'e5', 'change it'),
  ...chain('f1', 'f2', 'f3', 'f4', 'f5'),
  flow('g2', 'g1', 'clear'),
  flow('g2', 'g6', 'no'),
  flow('g2', 'f1', 'confirmed'),
  flow('g1', 'g3'),
  flow('g3', 'g4'),
  flow('g4', 'g5'),
  flow('g4', 'i1'),
  flow('g5', 'h1'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'h4', 'Time logged'),
  flow('h3', 'h5', 'No Stripe'),
  flow('h4', 'h6'),
  flow('h6', 'h7', 'sent'),
  ...chain('i1', 'i2', 'i3', 'i4'),
  flow('i4', 'i6', 'Template only'),
  flow('i4', 'i5', 'Add a line'),
  flow('i5', 'i6', 'by hand'),
  flow('i5', 'i7', 'a week waiting'),
]

const endToEnd: EndToEnd = {
  title: 'Riverdale & Brooks · End-to-end workflow',
  description: 'Riverdale & Brooks’s whole system as one live graph: the consultation request, the Practice Q&A bot, the inbox, the consultation prep, the engagement, the monthly invoice and each milestone notice, with nothing confidential in any automated step.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'END TO END · RIVERDALE & BROOKS',
  heading: 'From Send request to “where your matter stands”',
  lede: 'Every trigger, flow, bot and agent behind the firm’s site, wired as one graph: a consultation request and a visitor’s questions, the office inbox, the conflict check done by hand before each consultation is confirmed, the prep for it, the engagement letter, the monthly invoice and the notice at every milestone. Mail from a client, a court or opposing counsel reaches Daniel untouched.',
  stance: 'Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out. Templated replies and notices send on their own, and the bot answers live, in the site chat only. Nothing confidential is stored in Claude, Airtable, Telegram or any flow: the few sentences from the form pass through n8n and Gmail only to reach Daniel’s inbox, and the conflict check is done by hand.',
  caption: 'Riverdale & Brooks, end to end · 9 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => {
    if (!NUMBERED.has(s.lane) || SIDE.has(s.id)) return s
    const before = STEPS.filter((o) => o.lane === s.lane && !SIDE.has(o.id) && o.at[0] < s.at[0]).length
    return { ...s, n: before + 1 }
  }),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'A request, a question, an email or a matter moving from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is one request, question, email or matter moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until Ruth or Daniel says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine runs this step, like a trigger, a schedule or a fixed template. It never depends on someone remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the consultation request and both agents run in. It keeps a run only while it waits for Ruth’s yes, and none once it ends.'],
      ['Make', 'The automation tool the monthly invoice runs in: it gathers the time and drafts each invoice in Stripe.'],
      ['Zapier', 'The automation tool the milestone notice runs in, as a notice Zap and a Monday reminder Zap.'],
      ['Execution', 'n8n’s copy of a run. RB-01 and the prep agent save none. An inbox run is held only while it waits for Ruth’s yes, and none is kept once it ends.'],
      ['Claude', 'Anthropic’s AI model. It answers, sorts and drafts here, and drafts the New enquiry and Admin replies for Ruth’s yes. It never writes the fixed consultation replies, an invoice or a notice.'],
      ['Airtable', 'Where the firm keeps contacts, matters and time entries, with contact, area, scheduling and billing fields only.'],
      ['Stripe', 'Where each invoice is drafted, sent by Daniel and paid online, or marked paid by Ruth for a check.'],
      ['Cal.com', 'The booking tool that holds the two 30-minute consultation types, in the office or by video.'],
      ['Gmail', 'The firm’s two mailboxes: office@, where templates and approved replies come from, and Daniel’s own.'],
      ['office@', 'The firm’s shared mailbox, office@riverdalebrooks.law, the only one the inbox triage agent sorts.'],
      ['Telegram', 'The chat app where Ruth and Daniel get alerts, pings and the prep, and Ruth approves drafts.'],
      ['Supabase', 'The database that stores the public passages the Practice Q&A bot and both agents search.'],
      ['Passage', 'A fee or a practical answer cut from one of the firm’s pages or guides, as the search returns it.'],
      ['Template', 'A fixed message with blanks for the name, area and fee. No AI writes it, so it may send alone.'],
      ['Edit Fields', 'The n8n step that keeps the contact details and the area of a request and drops the few sentences.'],
      ['Few sentences', 'The optional box on the form. They pass through n8n and Gmail only to reach Daniel’s inbox, and no table, log or Claude keeps them.'],
      ['Legal advice', 'Advice on someone’s own situation. Daniel gives it to his clients; the bot and the agents never do.'],
      ['Conflict check', 'Making sure the firm acts for no one on the other side. Ruth runs it by hand before she confirms a consultation, never a flow.'],
      ['Booking request', 'A Cal.com booking with Requires confirmation on: it waits for Ruth to confirm it, after the conflict check.'],
      ['Engagement letter', 'The letter, signed by both, that sets the plan and the fee. Only then does an attorney-client relationship begin.'],
      ['For Daniel', 'The Gmail label for mail from a client, a court or opposing counsel, an attachment, or anything confidential or unsure. It is left untouched, with no draft.'],
      ['New enquiry', 'The Gmail label for someone asking to meet, who gets a reply with the right fee and a link to request a time.'],
      ['Admin', 'The Gmail label for a practical question, like parking or the hours, which gets a reply drafted from the site.'],
      ['Court domains', 'An Airtable list of the courts’ public email domains. n8n sends their mail For Daniel before Claude sees it. No client data.'],
      ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, whether an email or a booking started it, each tool call, and any label or yes, never an email’s words.'],
      ['Confidentiality terms', `A vendor’s written terms on how it keeps what it is given. ${VENDORS}`],
      ['Approval gate', 'A hard stop. Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out.'],
      ['Agent', 'An AI with one job that picks its own tools, one call at a time, until the job is done.'],
    ],
  },
  footer: { note: 'A worked example. Riverdale & Brooks is a fictional law practice, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default endToEnd
