import type { Icon } from '@phosphor-icons/react'
import {
  ArchiveIcon, ArrowUUpLeftIcon, ArrowsClockwiseIcon, BellRingingIcon, CalendarCheckIcon, ChartLineUpIcon,
  ChatTeardropTextIcon, CheckCircleIcon, CheckSquareIcon, ClockIcon, CodeIcon, CreditCardIcon, DeviceMobileIcon,
  EnvelopeSimpleIcon, EyeIcon, FileTextIcon, FlagPennantIcon, FunnelIcon, GaugeIcon, GlobeIcon, HandCoinsIcon,
  HeartIcon, HourglassMediumIcon, ImageIcon, LifebuoyIcon, LightningIcon, LinkIcon, MagnifyingGlassIcon, MoonIcon,
  NewspaperIcon, NotePencilIcon, PackageIcon, PenNibIcon, PhoneIcon, PhoneSlashIcon, PlugsConnectedIcon, QuotesIcon,
  ReceiptIcon, RobotIcon, ScalesIcon, SealCheckIcon, ShoppingCartIcon, SnowflakeIcon, SortAscendingIcon,
  SquaresFourIcon, StarIcon, TagIcon, ThumbsDownIcon, ThumbsUpIcon, TicketIcon, TrophyIcon, UserCheckIcon,
  UserFocusIcon, UserSwitchIcon, VideoCameraIcon, WarningCircleIcon, WrenchIcon, XCircleIcon,
} from '@phosphor-icons/react/ssr'

/**
 * Kraft's live automation flows, verbatim (KraftScreens.dc.html:663-960).
 * Coordinates are on the 1180×430 canvas (lib/flow.ts). A node's `kind`
 * marks an outcome ('on', accent) or a dead end ('off', the alert red).
 */
export type FlowNode = { x: number; y: number; icon: Icon; name: string; sub: string; kind?: 'on' | 'off' }
export type FlowEdge = {
  f: number
  t: number
  from: [number, number]
  to: [number, number]
  /** Cubic control points; without them the edge is a straight line. */
  c?: [number, number, number, number]
  k?: 'dash' | 'dot'
  /** A travelling dot: seconds per trip, start delay in seconds, opacity. */
  ball?: [number, number, number?]
}
export type Flow = {
  label: string
  title: string
  blurb: string
  tags: string[]
  note: { x: number; y: number; text: string }
  nodes: FlowNode[]
  edges: FlowEdge[]
}

type N = [number, number, Icon, string, string, ('on' | 'off')?]
const nodes = (list: N[]): FlowNode[] => list.map(([x, y, icon, name, sub, kind]) => ({ x, y, icon, name, sub, kind }))

/** The top row's five hand-offs, identical in every Kraft flow. */
const SPINE: FlowEdge[] = [
  { f: 0, t: 1, from: [130, 96], to: [248, 96], ball: [2.4, 0] },
  { f: 1, t: 2, from: [308, 96], to: [426, 96], ball: [2.4, 0.4] },
  { f: 2, t: 3, from: [486, 96], to: [604, 96], ball: [2.4, 0.8] },
  { f: 3, t: 4, from: [662, 96], to: [780, 96], ball: [2.4, 1.2] },
  { f: 4, t: 5, from: [842, 96], to: [982, 96], ball: [2.4, 1.6] },
]

export const FLOWS: Flow[] = [
  {
    label: 'LEAD → BOOKED CALL',
    title: 'One form. The rest runs itself.',
    blurb: 'Someone fills a form. The system qualifies them, books the call, sends the reminders and sorts what happens after it.',
    tags: ['CRM', 'Email & SMS', 'AI qualifier'],
    note: { x: 634, y: 218, text: 'BOOKING RESCHEDULED' },
    nodes: nodes([
      [100, 96, LightningIcon, 'Submit Form', 'New lead trigger', 'on'],
      [278, 96, EnvelopeSimpleIcon, 'Booking Email', 'Send booking link'],
      [456, 96, CalendarCheckIcon, 'Client Booked', 'Slot confirmed'],
      [634, 96, ClockIcon, '24hr Reminder', 'Pre-appt email'],
      [812, 96, BellRingingIcon, '1hr Reminder', 'Pre-appt email'],
      [1010, 96, VideoCameraIcon, 'Discovery Call', 'Qualify the lead', 'on'],
      [250, 336, FileTextIcon, 'Proposal Sent', 'Scope + price'],
      [420, 336, TrophyIcon, 'Won', 'Deal closed', 'on'],
      [700, 336, HourglassMediumIcon, 'Maybe / Later', 'Not ready yet'],
      [860, 336, HeartIcon, 'Nurture', 'Long-term drip'],
      [1010, 336, XCircleIcon, 'Lost', 'Closed out', 'off'],
    ]),
    edges: [
      ...SPINE,
      { f: 2, t: 4, from: [456, 132], to: [812, 132], c: [520, 214, 740, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 5, t: 6, from: [1002, 134], to: [262, 302], c: [820, 252, 520, 246], k: 'dot', ball: [4, 2.2, 0.55] },
      { f: 5, t: 8, from: [1004, 136], to: [706, 302], c: [910, 232, 800, 252], k: 'dot', ball: [3.6, 2.6, 0.55] },
      { f: 5, t: 10, from: [1010, 130], to: [1010, 302], k: 'dot' },
      { f: 6, t: 7, from: [278, 336], to: [392, 336], ball: [2.4, 3] },
      { f: 8, t: 9, from: [728, 336], to: [832, 336], ball: [2.4, 3.2] },
    ],
  },
  {
    label: 'SUPPORT TICKET TRIAGE',
    title: 'Every ticket answered in seconds.',
    blurb: 'A ticket lands, gets read and ranked, acknowledged instantly, then routed to whoever can actually close it.',
    tags: ['Helpdesk', 'AI triage', 'SLA rules'],
    note: { x: 911, y: 222, text: 'REOPENED' },
    nodes: nodes([
      [100, 96, TicketIcon, 'New ticket', 'Email or form', 'on'],
      [278, 96, RobotIcon, 'AI triage', 'Intent + urgency'],
      [456, 96, SortAscendingIcon, 'Priority set', 'SLA applied'],
      [634, 96, ChatTeardropTextIcon, 'Auto-reply', 'Ack in seconds'],
      [812, 96, UserSwitchIcon, 'Agent assigned', 'Right queue'],
      [1010, 96, CheckCircleIcon, 'Resolved', 'Closed out', 'on'],
      [456, 336, WarningCircleIcon, 'Escalated', 'Breach risk', 'off'],
      [700, 336, WrenchIcon, 'Engineer', 'Root cause'],
      [1010, 336, StarIcon, 'CSAT sent', 'Feedback loop', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
  {
    label: 'ONBOARDING → DELIVERY',
    title: 'From signature to handover.',
    blurb: 'The contract closes and the project starts itself: kickoff booked, workspace provisioned, milestones shipped for review.',
    tags: ['Contracts', 'Workspace', 'Milestones'],
    note: { x: 723, y: 222, text: 'REVISION LOOP' },
    nodes: nodes([
      [100, 96, FileTextIcon, 'Contract signed', 'Deal closed', 'on'],
      [278, 96, FlagPennantIcon, 'Kickoff booked', 'Calendar hold'],
      [456, 96, SquaresFourIcon, 'Workspace set up', 'Repo + access'],
      [634, 96, CodeIcon, 'Milestone build', 'Preview shipped'],
      [812, 96, EyeIcon, 'Client review', 'Feedback logged'],
      [1010, 96, PackageIcon, 'Handover', 'Docs + access', 'on'],
      [634, 336, ArrowsClockwiseIcon, 'Change request', 'Scope shift'],
      [812, 336, NotePencilIcon, 'Re-scoped', 'Quoted again'],
      [1010, 336, LifebuoyIcon, 'Retainer', 'Ongoing support', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 4, t: 3, from: [812, 132], to: [634, 132], c: [760, 214, 690, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 4, t: 6, from: [806, 134], to: [640, 302], c: [780, 240, 700, 250], k: 'dot', ball: [3, 2.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.8] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 3, 0.55] },
    ],
  },
  {
    label: 'CONTENT → SEO PUBLISH',
    title: 'Drafts that publish themselves.',
    blurb: 'A brief goes in, keywords come back, the draft gets written and checked, then it ships with links and tracking already in place.',
    tags: ['CMS', 'Keyword data', 'AI drafting'],
    note: { x: 911, y: 222, text: 'SENT BACK FOR REWORK' },
    nodes: nodes([
      [100, 96, NotePencilIcon, 'Brief queued', 'Topic + intent', 'on'],
      [278, 96, MagnifyingGlassIcon, 'Keyword pass', 'Volume + gaps'],
      [456, 96, PenNibIcon, 'Draft written', 'Outline to copy'],
      [634, 96, CheckSquareIcon, 'Fact-checked', 'Sources attached'],
      [812, 96, ImageIcon, 'Assets built', 'Images + meta'],
      [1010, 96, GlobeIcon, 'Published', 'Live on site', 'on'],
      [456, 336, ArrowUUpLeftIcon, 'Rework', 'Editor notes', 'off'],
      [700, 336, LinkIcon, 'Internal links', 'Cluster wired'],
      [1010, 336, ChartLineUpIcon, 'Indexed', 'Ranking tracked', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
  {
    label: 'INVOICE → PAID → RECONCILED',
    title: 'Money chased without you asking.',
    blurb: 'The invoice goes out, reminders escalate on their own, and the payment lands reconciled against the right job.',
    tags: ['Payments', 'Dunning', 'Bookkeeping'],
    note: { x: 723, y: 222, text: 'PAYMENT FAILED · RETRY' },
    nodes: nodes([
      [100, 96, ReceiptIcon, 'Invoice sent', 'Job closed', 'on'],
      [278, 96, EyeIcon, 'Viewed', 'Open tracked'],
      [456, 96, ClockIcon, 'Due soon', 'T-3 days'],
      [634, 96, CreditCardIcon, 'Payment link', 'Card or transfer'],
      [812, 96, CheckCircleIcon, 'Paid', 'Funds cleared'],
      [1010, 96, ScalesIcon, 'Reconciled', 'Books updated', 'on'],
      [634, 336, WarningCircleIcon, 'Overdue', 'Past terms', 'off'],
      [812, 336, BellRingingIcon, 'Dunning', 'Escalating notes'],
      [1010, 336, HandCoinsIcon, 'Recovered', 'Settled late', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 4, t: 3, from: [812, 132], to: [634, 132], c: [760, 214, 690, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'REVIEW → TESTIMONIAL',
    title: 'Proof collected while it is warm.',
    blurb: 'The moment a project lands, the ask goes out, the good ones become testimonials, and the rough ones reach you first.',
    tags: ['Review ask', 'Approval', 'Website'],
    note: { x: 911, y: 222, text: 'NUDGED ONCE MORE' },
    nodes: nodes([
      [100, 96, PackageIcon, 'Project closed', 'Handover done', 'on'],
      [278, 96, StarIcon, 'Review asked', 'One-tap rating'],
      [456, 96, ThumbsUpIcon, 'Rating in', '4–5 stars'],
      [634, 96, QuotesIcon, 'Quote drafted', 'Edited for them'],
      [812, 96, SealCheckIcon, 'Client approved', 'Signed off'],
      [1010, 96, GlobeIcon, 'Published', 'Live on site', 'on'],
      [456, 336, ThumbsDownIcon, 'Low rating', 'Held private', 'off'],
      [700, 336, PhoneIcon, 'Recovery call', 'You hear it first'],
      [1010, 336, WrenchIcon, 'Made right', 'Then asked again', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 2, t: 1, from: [456, 132], to: [278, 132], c: [404, 214, 334, 214], k: 'dash', ball: [3.2, 1.8, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 7, t: 8, from: [728, 336], to: [982, 336], ball: [3, 2.8] },
    ],
  },
  {
    label: 'LEAD SCORING → DAILY DIGEST',
    title: 'One email, ranked by who matters.',
    blurb: 'Every lead gets enriched and scored overnight, then arrives as a single ordered digest at 7am instead of forty notifications.',
    tags: ['Enrichment', 'Scoring', 'Digest'],
    note: { x: 911, y: 222, text: 'RE-SCORED ON ACTIVITY' },
    nodes: nodes([
      [100, 96, UserFocusIcon, 'Lead enriched', 'Company + role', 'on'],
      [278, 96, GaugeIcon, 'Scored', 'Fit + intent'],
      [456, 96, SortAscendingIcon, 'Tiered', 'A / B / C'],
      [634, 96, UserSwitchIcon, 'Routed', 'Owner assigned'],
      [812, 96, NewspaperIcon, 'Digest built', 'Ranked list'],
      [1010, 96, EnvelopeSimpleIcon, 'Inbox 7am', 'One email', 'on'],
      [456, 336, SnowflakeIcon, 'Cold', 'Below threshold', 'off'],
      [700, 336, HeartIcon, 'Nurture', 'Slow drip'],
      [1010, 336, ArrowsClockwiseIcon, 'Re-scored', 'Back in the queue', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 7, t: 8, from: [728, 336], to: [982, 336], ball: [3, 2.8] },
    ],
  },
  {
    label: 'ABANDONED CHECKOUT → RECOVERY',
    title: 'The cart that comes back on its own.',
    blurb: 'Someone leaves mid-checkout. The sequence waits, reminds, offers a reason to finish, and stops the second they pay.',
    tags: ['Checkout', 'Email & SMS', 'Offers'],
    note: { x: 723, y: 222, text: 'STOPPED · ALREADY PAID' },
    nodes: nodes([
      [100, 96, ShoppingCartIcon, 'Cart left', 'Checkout exit', 'on'],
      [278, 96, HourglassMediumIcon, 'Wait 1 hour', 'Cooling off'],
      [456, 96, EnvelopeSimpleIcon, 'Reminder email', 'Cart restored'],
      [634, 96, DeviceMobileIcon, 'SMS nudge', 'Next morning'],
      [812, 96, TagIcon, 'Reason to finish', 'Time-boxed offer'],
      [1010, 96, CheckCircleIcon, 'Recovered', 'Order placed', 'on'],
      [634, 336, MoonIcon, 'No response', 'Sequence ends', 'off'],
      [812, 336, HeartIcon, 'Win-back list', 'Monthly touch'],
      [1010, 336, XCircleIcon, 'Unsubscribed', 'Removed', 'off'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 3, from: [1010, 132], to: [634, 132], c: [900, 214, 760, 214], k: 'dash', ball: [3.6, 2, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'MISSED CALL → TEXT BACK',
    title: 'No call goes unanswered.',
    blurb: 'A call rings out and the text goes before they reach the next search result — answered, qualified and booked without you dialling back.',
    tags: ['Telephony', 'SMS', 'Booking'],
    note: { x: 723, y: 222, text: 'CALLED BACK INSTEAD' },
    nodes: nodes([
      [100, 96, PhoneSlashIcon, 'Missed call', 'Rang out', 'on'],
      [278, 96, DeviceMobileIcon, 'Text sent', 'Under 30 s'],
      [456, 96, ChatTeardropTextIcon, 'They reply', 'Thread open'],
      [634, 96, RobotIcon, 'AI qualifies', 'Need + timing'],
      [812, 96, CalendarCheckIcon, 'Slot offered', 'Live calendar'],
      [1010, 96, VideoCameraIcon, 'Call booked', 'On the sheet', 'on'],
      [634, 336, MoonIcon, 'No reply', 'Two nudges out', 'off'],
      [812, 336, HeartIcon, 'Nurture list', 'Monthly touch'],
      [1010, 336, UserCheckIcon, 'Owner alerted', 'Human takes over', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 3, from: [1010, 132], to: [634, 132], c: [900, 214, 760, 214], k: 'dash', ball: [3.6, 2, 0.8] },
      { f: 3, t: 6, from: [634, 130], to: [634, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [662, 336], to: [784, 336], ball: [2.4, 2.6] },
      { f: 7, t: 8, from: [840, 336], to: [982, 336], ball: [2.6, 3] },
    ],
  },
  {
    label: 'OPS DATA → WEEKLY REPORT',
    title: 'Monday reporting, already written.',
    blurb: 'Numbers are pulled from every system overnight, checked against last week, then land as one short report with the anomalies flagged.',
    tags: ['Warehouse', 'Checks', 'Reporting'],
    note: { x: 911, y: 222, text: 'RE-RUN AFTER FIX' },
    nodes: nodes([
      [100, 96, PlugsConnectedIcon, 'Sources pulled', 'CRM · billing · site', 'on'],
      [278, 96, FunnelIcon, 'Cleaned', 'Dedupe + map'],
      [456, 96, MagnifyingGlassIcon, 'Checks run', 'Gaps and spikes'],
      [634, 96, ChartLineUpIcon, 'Metrics built', 'Week over week'],
      [812, 96, NotePencilIcon, 'Summary drafted', 'Plain language'],
      [1010, 96, NewspaperIcon, 'Report out', 'Monday 7am', 'on'],
      [456, 336, WarningCircleIcon, 'Check failed', 'Source stale', 'off'],
      [700, 336, WrenchIcon, 'Owner pinged', 'Fix requested'],
      [1010, 336, ArchiveIcon, 'Archived', 'Trend history', 'on'],
    ]),
    edges: [
      ...SPINE,
      { f: 5, t: 4, from: [1010, 132], to: [812, 132], c: [960, 214, 860, 214], k: 'dash', ball: [3.4, 2, 0.8] },
      { f: 2, t: 6, from: [456, 130], to: [456, 302], k: 'dot', ball: [2.8, 1.4, 0.55] },
      { f: 6, t: 7, from: [484, 336], to: [672, 336], ball: [2.6, 2.4] },
      { f: 5, t: 8, from: [1010, 130], to: [1010, 302], k: 'dot', ball: [2.6, 2.8, 0.55] },
    ],
  },
]
