/**
 * The n8n build plan behind The build plan card (spec
 * docs/superpowers/specs/2026-09-30-n8n-build-plan-design.md). A worked
 * example for Trusted Mover, a fictional moving company in Austin, TX.
 * scripts/make-plan.ts renders it into public/build-plan.html. No imports,
 * so Node can run it directly.
 */

export type IconName =
  | 'ArrowsClockwise' | 'ArrowsSplit' | 'Calculator' | 'CalendarCheck' | 'ChatCircleText' | 'Clock' | 'Copy'
  | 'CreditCard' | 'Database' | 'EnvelopeSimple' | 'FlagCheckered' | 'GitBranch' | 'HourglassMedium'
  | 'MagnifyingGlass' | 'Package' | 'PaperPlaneTilt' | 'PencilSimple' | 'Receipt' | 'ShieldCheck' | 'Sparkle'
  | 'Stack' | 'Star' | 'Table' | 'Timer' | 'Truck' | 'UserCheck' | 'Warning' | 'WebhooksLogo' | 'XCircle'

export type NodeKind = 'trigger' | 'action' | 'ai' | 'branch' | 'wait' | 'approve' | 'helper' | 'end'
/** A step: `what` says in plain words what happens there, first in its panel. */
export type PlanNode = { id: string; kind: NodeKind; label: string; sub: string; icon: IconName; type: string; settings: [string, string][]; what: string }
export type PlanEdge = { from: string; to: string; label?: string }
export type Workflow = {
  code: string
  title: string
  outcome: string
  trigger: string
  exits: string[]
  watch: string[]
  nodes: PlanNode[]
  edges: PlanEdge[]
}
export type Rail = { heading: string; body?: string; list?: string[] }
export type TestRow = { id: string; workflow: string; branch: string; input: string; expected: string }
export type Phase = { name: string; tasks: string[] }
type Head = { title: string; blurb: string; rail: Rail[] }
export type Plan = {
  title: string
  description: string
  kicker: string
  heading: string
  lede: string
  meta: [string, string][]
  start: Head & { outcome: string; trigger: string; exits: string[]; outOfScope: string[] }
  naming: Head & { rules: { name: string; pattern: string; examples: string[]; rule: string }[] }
  data: Head & { tables: { name: string; fields: string[]; note: string }[]; stages: [string, string][]; exitStages: [string, string][]; sheets: [string, string][] }
  triggers: Head & { rows: [string, string, string][] }
  workflows: Workflow[]
  helpers: Head & { list: Workflow[] }
  tests: Head & { rows: TestRow[] }
  build: Head & { phases: Phase[] }
  handover: Head & { does: string[]; breaks: string[]; call: string; logs: string }
  footer: { note: string; by: string }
  /** The link back to the portfolio, shown when the plan is opened on its own. */
  home: string
}

/** What each node kind means, for the legend and the screen-reader step lists. */
export const KIND_LABELS: Record<NodeKind, string> = {
  trigger: 'Starts it',
  action: 'Step',
  ai: 'Claude',
  branch: 'Decides',
  wait: 'Waits',
  approve: 'Person approves',
  helper: 'Helper',
  end: 'Ends',
}

/** What each kind of step means, for the diagram key's panel. */
export const KIND_NOTES: Record<NodeKind, string> = {
  trigger: 'Where a workflow starts: a form, a payment, a schedule or a message.',
  action: 'A single thing the workflow does, like saving a record or sending an email.',
  ai: 'A step where Claude reads or writes text. It never sends anything on its own.',
  branch: 'A decision point. The workflow takes a different path depending on the answer.',
  wait: 'A pause, until a set time or until something happens, like a reply or a payment.',
  approve: 'A person has to say yes before the workflow can go on.',
  helper: 'Hands off to a small shared workflow, like sending the team an alert.',
  end: 'The last step on this path.',
}

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

const TM01: Workflow = {
  code: 'TM-01',
  title: 'Quote request → Qualified lead',
  outcome: 'Every quote becomes a job, or one clear question, within 5 minutes.',
  trigger: 'The quote form on the site posts to /tm/quote.',
  exits: ['Merged into an open job', 'Waiting on one answer', 'Survey link sent'],
  watch: [
    'Claude returns JSON only. The parser rejects anything else, and TM-H01 catches it.',
    'Duplicates are matched on email or phone, never on name.',
    'The question never links to a form.',
  ],
  nodes: [
    node('n1', 'trigger', 'Quote form', 'POST /tm/quote', 'WebhooksLogo', 'Webhook', [['Method', 'POST'], ['Path', '/tm/quote'], ['Respond', 'At once, 202']], 'Someone fills in the quote form on the Trusted Mover site, and their details arrive here the moment they press send.'),
    node('n2', 'action', 'Normalize fields', 'Edit Fields', 'PencilSimple', 'Edit Fields (Set)', [['Keeps', 'name, email, phone, dates, addresses, notes'], ['Phone', 'to E.164']], 'Tidies what they typed: trims stray spaces, keeps only the fields that matter and puts the phone number in one standard format.'),
    node('n3', 'action', 'Find contact', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Operation', 'Get many rows'], ['Table', 'contacts'], ['Match', 'email or phone']], 'Looks the person up in the customer list by email or phone, to see whether they have asked before.'),
    node('n4', 'branch', 'Duplicate in 24 h?', 'If', 'GitBranch', 'If', [['Condition', 'an open job was created under 24 h ago']], 'Checks whether this person already sent a quote request in the last day.'),
    node('n5', 'end', 'Merge into open job', 'Supabase', 'Copy', 'Supabase', [['Operation', 'Update row'], ['Table', 'jobs'], ['Adds', 'the new notes to the open job']], 'If they did, the new message is added to their existing job instead of starting a second one.'),
    node('n6', 'ai', 'Extract move details', 'Claude', 'Sparkle', 'Anthropic Chat Model + Structured Output Parser', [['Model', 'Claude Haiku 4.5'], ['Returns', 'size, move_date, from_zip, to_zip, stairs, specialty[], missing[]'], ['Temperature', '0']], 'Claude reads the request and pulls out the move size, the date, both addresses, stairs and any special items, plus anything that is missing.'),
    node('n7', 'branch', 'Anything missing?', 'If', 'GitBranch', 'If', [['Condition', 'missing[] is not empty']], 'Checks whether Claude found everything needed to price the move.'),
    node('n8', 'ai', 'Draft one question', 'Claude', 'Sparkle', 'Anthropic Chat Model', [['Model', 'Claude Haiku 4.5'], ['Rule', 'One question, under 40 words, no form links']], 'If something is missing, Claude writes one short, friendly question asking for it.'),
    node('n9', 'action', 'Ask the client', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Operation', 'Reply'], ['Thread', 'Stays on the quote thread']], 'Sends that question by email, as a reply in the same conversation.'),
    node('n10', 'end', 'Stage 0 · needs info', 'Supabase', 'FlagCheckered', 'Supabase', [['Sets', 'stage = 0, needs_info = true']], 'Marks the job as waiting for the client’s answer, so nobody chases it twice.'),
    node('n11', 'action', 'Create job', 'Supabase', 'Database', 'Supabase', [['Operation', 'Upsert contact, insert job'], ['Stage', '0 New lead']], 'Saves the person and a new job in the database, at the first stage: New lead.'),
    node('n12', 'action', 'Log the quote', 'Google Sheets', 'Table', 'Google Sheets', [['Operation', 'Append row'], ['Tab', 'Quote log']], 'Adds a row to the Quote log sheet, so the owner can see every request in one place.'),
    node('n13', 'helper', 'Notify ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops'], ['Wait for it', 'No']], 'Sends the team a short Telegram message that a new lead came in.'),
    node('n14', 'end', 'Send survey link', 'Gmail', 'CalendarCheck', 'Gmail', [['Link', 'Cal.com video or in-home survey'], ['Sends', 'Inside business hours']], 'Emails the client a link to book a video or in-home survey, sent only during business hours.'),
  ],
  edges: [
    edge('n1', 'n2'), edge('n2', 'n3'), edge('n3', 'n4'),
    edge('n4', 'n6', 'no'), edge('n4', 'n5', 'yes'),
    edge('n6', 'n7'),
    edge('n7', 'n11', 'no'), edge('n7', 'n8', 'yes'),
    edge('n8', 'n9'), edge('n9', 'n10'),
    edge('n11', 'n12'), edge('n12', 'n13'), edge('n13', 'n14'),
  ],
}

const TM02: Workflow = {
  code: 'TM-02',
  title: 'Survey → Estimate sent',
  outcome: 'Every survey ends with an approved estimate and a deposit link, the same day.',
  trigger: 'Cal.com posts BOOKING_CREATED to /tm/survey.',
  exits: ['Estimate sent', 'Sent back to the owner', 'No-show, rebook link sent'],
  watch: [
    'Nothing reaches the client until the owner approves.',
    'Rate card changes apply to new estimates only.',
    'Reminders respect business hours in Central time.',
  ],
  nodes: [
    node('a1', 'trigger', 'Survey booked', 'Cal.com', 'CalendarCheck', 'Webhook (Cal.com)', [['Event', 'BOOKING_CREATED'], ['Path', '/tm/survey']], 'The client books their survey in Cal.com, and the booking arrives here.'),
    node('a2', 'action', 'Stage 1', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 1, survey_at']], 'Moves the job to Survey booked and saves the survey time.'),
    node('a3', 'helper', 'Business hours', 'TM-H03', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H03 · Business-hours gate'], ['Window', '08:00–19:00 CT, Mon–Sat']], 'Makes any message wait until business hours, so nobody is contacted at night.'),
    node('a4', 'wait', 'Until 24 h before', 'Wait', 'Timer', 'Wait', [['Resume', 'At a set time'], ['Time', 'survey_at minus 24 h']], 'Pauses the workflow until one day before the survey.'),
    node('a5', 'action', 'Reminder', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the time, what to have ready, a reschedule link']], 'Emails the client a reminder: the time, what to have ready, and a link to reschedule.'),
    node('a6', 'wait', 'Until the survey ends', 'Wait', 'HourglassMedium', 'Wait', [['Resume', 'On webhook call'], ['Timeout', 'survey_at plus 3 h']], 'Waits for the estimator to finish the survey and send in the inventory.'),
    node('a7', 'branch', 'Survey done?', 'If', 'GitBranch', 'If', [['Condition', 'the inventory form arrived before the timeout']], 'Checks whether the inventory arrived in time, or the client didn’t show up.'),
    node('a8', 'end', 'Rebook link', 'Gmail', 'CalendarCheck', 'Gmail', [['Sends', 'One rebook link, once']], 'If the client missed it, they get one email with a link to book again.'),
    node('a9', 'action', 'Price from rate card', 'Google Sheets', 'Calculator', 'Google Sheets + Code', [['Tab', 'Rate card'], ['Formula', 'crew × hours × rate + truck + materials'], ['Rounds', 'to the nearest $25']], 'Works out the price from the rate card: crew size, hours, truck and packing materials.'),
    node('a10', 'ai', 'Draft estimate', 'Claude', 'Sparkle', 'Anthropic Chat Model', [['Model', 'Claude Sonnet 4.6'], ['Input', 'inventory, price lines, move date'], ['Tone', 'Plain, no upsell']], 'Claude writes the estimate email in plain words, listing what is included and the price.'),
    node('a11', 'approve', 'Owner approves', 'Wait on form', 'UserCheck', 'Wait (on form submit)', [['Sends', 'the draft with Approve and Edit to the owner'], ['Timeout', '24 h, then a reminder']], 'The owner gets the draft and chooses Approve or Edit. Nothing reaches the client before that.'),
    node('a12', 'branch', 'Approved?', 'If', 'GitBranch', 'If', [['Condition', 'decision = approve']], 'Checks what the owner decided.'),
    node('a13', 'end', 'Back to owner', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Sends', 'the edit note'], ['Job', 'stays at stage 1']], 'If the owner wants changes, their note comes back to them on Telegram and the client hears nothing yet.'),
    node('a14', 'action', 'Deposit link', 'Stripe', 'CreditCard', 'Stripe (HTTP Request)', [['Creates', 'a Checkout Session'], ['Amount', '20% of the estimate'], ['Metadata', 'job_id']], 'Creates a secure Stripe payment link for a 20% deposit.'),
    node('a15', 'end', 'Send estimate', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Then', 'stage = 2 Estimate sent']], 'Emails the approved estimate with the deposit link, and moves the job to Estimate sent.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'), edge('a5', 'a6'), edge('a6', 'a7'),
    edge('a7', 'a9', 'yes'), edge('a7', 'a8', 'no'),
    edge('a9', 'a10'), edge('a10', 'a11'), edge('a11', 'a12'),
    edge('a12', 'a14', 'yes'), edge('a12', 'a13', 'no'),
    edge('a14', 'a15'),
  ],
}

const TM03: Workflow = {
  code: 'TM-03',
  title: 'Deposit paid → Move booked',
  outcome: 'A paid deposit books the move, and an unpaid estimate never sits forgotten.',
  trigger: 'Stripe checkout.session.completed, plus an hourly sweep.',
  exits: ['Booked', 'Nudged', 'Lost after two nudges'],
  watch: [
    'Unsigned Stripe calls are rejected.',
    'Stripe can send an event twice. The job is booked once.',
    'Nudges stop the moment a deposit lands.',
  ],
  nodes: [
    node('b1', 'trigger', 'Deposit paid', 'Stripe', 'CreditCard', 'Webhook (Stripe)', [['Event', 'checkout.session.completed'], ['Path', '/tm/stripe']], 'Stripe reports that a client has paid their deposit.'),
    node('b2', 'action', 'Verify signature', 'Code', 'ShieldCheck', 'Code', [['Checks', 'Stripe-Signature against the signing secret'], ['Rejects', 'anything unsigned, with 400']], 'Confirms the message really came from Stripe before anything else happens.'),
    node('b3', 'action', 'Find job', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Match', 'metadata.job_id'], ['Skips', 'jobs already at stage 3']], 'Finds the job this payment belongs to, and skips it if it is already booked.'),
    node('b4', 'action', 'Stage 3 · Booked', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 3, deposit_paid_at']], 'Marks the job as Booked and records when the deposit was paid.'),
    node('b5', 'action', 'Add to crew schedule', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Crew schedule'], ['Row', 'date, size, from, to, crew (blank)']], 'Adds the move to the Crew schedule sheet, ready for a crew to be assigned.'),
    node('b6', 'action', 'Confirmation', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the date, arrival window, prep checklist']], 'Emails the client their move date, arrival window and a checklist to get ready.'),
    node('b7', 'helper', 'Notify ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops']], 'Lets the team know on Telegram that a move was booked.'),
    node('s1', 'trigger', 'Every hour', 'Schedule', 'Clock', 'Schedule Trigger', [['Interval', 'Every hour']], 'Every hour, a second check runs on its own.'),
    node('s2', 'action', 'Unpaid estimates', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Filter', 'stage = 2, sent over 72 h ago']], 'Finds estimates sent more than three days ago that still have no deposit.'),
    node('s3', 'branch', 'Nudges sent?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', '0, 1, 2']], 'Checks how many reminders each of those clients has already had.'),
    node('s4', 'end', 'Nudge 1', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Sets', 'nudges_sent = 1']], 'None yet: sends a first friendly reminder.'),
    node('s5', 'end', 'Nudge 2', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Sets', 'nudges_sent = 2']], 'One already: sends a second and final reminder.'),
    node('s6', 'end', 'Stage · Lost', 'Supabase', 'XCircle', 'Supabase', [['Sets', 'stage = Lost']], 'Two already: marks the job as Lost, so it stops taking up attention.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'), edge('b5', 'b6'), edge('b6', 'b7'),
    edge('s1', 's2'), edge('s2', 's3'),
    edge('s3', 's4', '0'), edge('s3', 's5', '1'), edge('s3', 's6', '2'),
  ],
}

const TM04: Workflow = {
  code: 'TM-04',
  title: 'Move week → Crew dispatched',
  outcome: 'Every move has a crew, and a client who knows when they arrive.',
  trigger: 'Schedule, every day at 07:00 Central.',
  exits: ['Packing guide sent', 'Crew confirmed', 'Ops alerted', 'Arrival window sent'],
  watch: [
    'A missing crew two days out is the one alert that must not be missed.',
    'Dates are compared in Central time, not UTC.',
  ],
  nodes: [
    node('c1', 'trigger', 'Every day, 07:00', 'Schedule', 'Clock', 'Schedule Trigger', [['Cron', '0 7 * * *'], ['Timezone', 'America/Chicago']], 'Every morning at 7:00, this workflow starts on its own.'),
    node('c2', 'action', 'Upcoming moves', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Filter', 'stage 3–4, move_date in 1, 2 or 7 days']], 'Finds every booked move happening in 7, 2 or 1 days.'),
    node('c3', 'branch', 'Days out?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', '7, 2, 1']], 'Sends each move down the right path, depending on how many days are left.'),
    node('c4', 'action', 'Stage 4 · Move week', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 4']], 'A week out: moves the job to Move week.'),
    node('c5', 'end', 'Packing guide', 'Gmail', 'Package', 'Gmail', [['Sends', 'packing tips and what the crew brings']], 'Emails the client packing tips and what the crew will bring.'),
    node('c6', 'branch', 'Crew assigned?', 'If', 'GitBranch', 'If', [['Reads', 'the crew column of the Crew schedule']], 'Two days out: checks the Crew schedule for an assigned crew.'),
    node('c7', 'end', 'Crew confirmation', 'Gmail', 'Truck', 'Gmail', [['To', 'the crew lead and the client']], 'If there is a crew, the crew lead and the client both get a confirmation.'),
    node('c8', 'helper', 'Alert ops', 'TM-H02', 'Warning', 'Execute Workflow', [['Workflow', 'TM-H02 · Notify ops'], ['Priority', 'urgent']], 'If there is no crew yet, the team gets an urgent Telegram alert.'),
    node('c9', 'end', 'Arrival window', 'Gmail', 'Clock', 'Gmail', [['Window', 'from the crew schedule, e.g. 8–10 am']], 'The day before: emails the client the crew’s arrival window.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'),
    edge('c3', 'c4', '7'), edge('c4', 'c5'),
    edge('c3', 'c6', '2'), edge('c6', 'c7', 'yes'), edge('c6', 'c8', 'no'),
    edge('c3', 'c9', '1'),
  ],
}

const TM05: Workflow = {
  code: 'TM-05',
  title: 'Move done → Paid + reviewed',
  outcome: 'Every finished move is paid, and every reply lands with the right person.',
  trigger: 'The crew sets status to Done on the Crew schedule sheet.',
  exits: ['Closed with a review link', 'Claim open', 'Owner follow-up'],
  watch: [
    'A damage mention always goes to a person, never to an auto-reply.',
    'The review link is only sent after the invoice is paid.',
  ],
  nodes: [
    node('d1', 'trigger', 'Crew marks done', 'Google Sheets', 'Table', 'Google Sheets Trigger', [['Event', 'Row updated'], ['Column', 'status = Done']], 'The crew marks the move as Done on the Crew schedule sheet.'),
    node('d2', 'action', 'Stage 5 · Moved', 'Supabase', 'Database', 'Supabase', [['Sets', 'stage = 5']], 'Moves the job to Moved.'),
    node('d3', 'action', 'Final invoice', 'Stripe', 'Receipt', 'Stripe', [['Amount', 'estimate minus deposit, plus any extra hours'], ['Due', 'on receipt']], 'Sends the final invoice through Stripe: the balance after the deposit, plus any extra hours.'),
    node('d4', 'wait', 'Until paid', 'Wait', 'HourglassMedium', 'Wait (on webhook)', [['Resumes on', 'invoice.paid'], ['Timeout', '7 days, then TM-H02']], 'Waits until the invoice is paid, and alerts the team if it is still unpaid after a week.'),
    node('d5', 'wait', '1 day', 'Wait', 'Timer', 'Wait', [['Amount', '1 day']], 'Waits one more day before asking for feedback.'),
    node('d6', 'action', 'Feedback question', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Asks', '“How did the move go?”, one line']], 'Emails the client one simple question: how did the move go?'),
    node('d7', 'wait', 'Until reply', 'Wait', 'ChatCircleText', 'Wait (on webhook)', [['Resumes on', 'a Gmail reply'], ['Timeout', '5 days, then close']], 'Waits for their reply, for up to five days.'),
    node('d8', 'ai', 'Sort the reply', 'Claude', 'Sparkle', 'Text Classifier', [['Model', 'Claude Haiku 4.5'], ['Classes', 'damage, complaint, praise']], 'Claude reads the reply and decides whether it is praise, a complaint or a damage report.'),
    node('d9', 'branch', 'Kind?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', 'praise, damage, complaint']], 'Sends the reply down the right path.'),
    node('d10', 'action', 'Review link', 'Gmail', 'Star', 'Gmail', [['Link', 'the Google review page']], 'Happy clients get a link to leave a Google review.'),
    node('d11', 'end', 'Stage 6 · Closed', 'Supabase', 'FlagCheckered', 'Supabase', [['Sets', 'stage = 6']], 'Moves the job to Closed: paid, reviewed and done.'),
    node('d12', 'action', 'Open a claim', 'Supabase', 'Warning', 'Supabase', [['Writes', 'events: type = claim'], ['Holds', 'the job at stage 5 until resolved']], 'A damage report opens a claim on the job, so it stays open until it is sorted.'),
    node('d13', 'helper', 'Alert ops', 'TM-H02', 'Stack', 'Execute Workflow', [['Priority', 'urgent']], 'The team gets an urgent Telegram alert about the claim.'),
    node('d14', 'end', 'Task for the owner', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Sends', 'the reply and a link to the job']], 'A complaint goes straight to the owner on Telegram, to follow up personally.'),
  ],
  edges: [
    edge('d1', 'd2'), edge('d2', 'd3'), edge('d3', 'd4'), edge('d4', 'd5'), edge('d5', 'd6'), edge('d6', 'd7'), edge('d7', 'd8'), edge('d8', 'd9'),
    edge('d9', 'd10', 'praise'), edge('d10', 'd11'),
    edge('d9', 'd12', 'damage'), edge('d12', 'd13'),
    edge('d9', 'd14', 'complaint'),
  ],
}

const TM06: Workflow = {
  code: 'TM-06',
  title: 'Cancel or reschedule',
  outcome: 'Changes are handled the same day, with refunds that follow the policy exactly.',
  trigger: 'The reschedule form posts to /tm/change.',
  exits: ['New date confirmed', 'Three dates offered', 'Cancelled and refunded'],
  watch: [
    'The refund amount comes from the Code node, never from Claude.',
    'A $0 refund skips Stripe but still confirms.',
  ],
  nodes: [
    node('e1', 'trigger', 'Change request', 'POST /tm/change', 'WebhooksLogo', 'Webhook', [['From', 'the reschedule form on the site'], ['Carries', 'job_id, type, new date']], 'The client asks to move or cancel their booking with the form on the site.'),
    node('e2', 'action', 'Find job', 'Supabase', 'MagnifyingGlass', 'Supabase', [['Match', 'job_id']], 'Finds the job the request is about.'),
    node('e3', 'branch', 'Type?', 'Switch', 'ArrowsSplit', 'Switch', [['Routes', 'reschedule, cancel']], 'Checks whether they want a new date or to cancel.'),
    node('e4', 'action', 'Check crew calendar', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Crew schedule']], 'Looks at the Crew schedule for the new date.'),
    node('e5', 'branch', 'Slot free?', 'If', 'GitBranch', 'If', [['Condition', 'a crew is free on the new date']], 'Checks whether a crew is free that day.'),
    node('e6', 'end', 'Move the date', 'Supabase + Sheets', 'ArrowsClockwise', 'Supabase + Google Sheets', [['Updates', 'move_date and the schedule row'], ['Sends', 'a confirmation']], 'If one is, the move date and the schedule are updated and the client gets a confirmation.'),
    node('e7', 'end', 'Offer 3 dates', 'Gmail', 'CalendarCheck', 'Gmail', [['Offers', 'the next three free dates']], 'If not, the client is offered the next three free dates.'),
    node('e8', 'action', 'Refund by policy', 'Code', 'Calculator', 'Code', [['14 days or more', '100% of the deposit'], ['7–13 days', '50%'], ['Under 7 days', 'deposit kept']], 'Works out the refund from the notice given: all of the deposit at 14 days or more, half at 7 to 13, none under 7.'),
    node('e9', 'action', 'Stripe refund', 'Stripe', 'CreditCard', 'Stripe', [['Operation', 'Create refund'], ['Skips', 'when the amount is $0']], 'Sends the refund through Stripe, or skips this when there is nothing to refund.'),
    node('e10', 'action', 'Stage · Cancelled', 'Supabase', 'XCircle', 'Supabase', [['Sets', 'stage = Cancelled'], ['Also', 'clears the crew schedule row']], 'Marks the job as Cancelled and frees the crew’s slot.'),
    node('e11', 'end', 'Confirm', 'Gmail', 'EnvelopeSimple', 'Gmail', [['Includes', 'the refund amount, if any']], 'Emails the client a confirmation, with the refund amount if there is one.'),
  ],
  edges: [
    edge('e1', 'e2'), edge('e2', 'e3'),
    edge('e3', 'e4', 'reschedule'), edge('e4', 'e5'), edge('e5', 'e6', 'yes'), edge('e5', 'e7', 'no'),
    edge('e3', 'e8', 'cancel'), edge('e8', 'e9'), edge('e9', 'e10'), edge('e10', 'e11'),
  ],
}

const H01: Workflow = {
  code: 'TM-H01',
  title: 'Error handler',
  outcome: 'Every failure is logged and reaches ops with a link to the run.',
  trigger: 'n8n’s Error Trigger, set as the error workflow on every TM workflow.',
  exits: ['Logged and sent'],
  watch: ['It never retries on its own. A person decides.'],
  nodes: [
    node('h1', 'trigger', 'Any failure', 'Error Trigger', 'Warning', 'Error Trigger', [['Covers', 'every TM workflow (Settings → Error workflow)']], 'Starts whenever any Trusted Mover workflow fails.'),
    node('h2', 'action', 'Log it', 'Google Sheets', 'Table', 'Google Sheets', [['Tab', 'Errors'], ['Row', 'workflow, node, message, execution URL']], 'Writes the failure to the Errors sheet: which workflow, which step and what went wrong.'),
    node('h3', 'end', 'Tell ops', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Includes', 'the execution link']], 'Sends the team a Telegram message with a link to the failed run.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'TM-H02',
  title: 'Notify ops',
  outcome: 'One place formats every ops message.',
  trigger: 'Called by another workflow.',
  exits: ['Message sent'],
  watch: ['Urgent messages are pinned in the group.'],
  nodes: [
    node('g1', 'trigger', 'Called by a workflow', 'Execute Workflow Trigger', 'Stack', 'Execute Workflow Trigger', [['Inputs', 'text, priority, job_id']], 'Another workflow hands over a message for the team.'),
    node('g2', 'action', 'Format', 'Edit Fields', 'PencilSimple', 'Edit Fields (Set)', [['Adds', 'the job link and the stage']], 'Adds the job link and its current stage to the message.'),
    node('g3', 'end', 'Send', 'Telegram', 'PaperPlaneTilt', 'Telegram', [['Chat', 'the ops group'], ['Urgent', 'pinned, with sound']], 'Posts it in the team’s Telegram group. Urgent ones are pinned.'),
  ],
  edges: [edge('g1', 'g2'), edge('g2', 'g3')],
}

const H03: Workflow = {
  code: 'TM-H03',
  title: 'Business-hours gate',
  outcome: 'Nobody gets a message at 2 am.',
  trigger: 'Called by another workflow before any client message.',
  exits: ['Resumes inside business hours'],
  watch: ['Business hours are 08:00–19:00 Central, Monday to Saturday.'],
  nodes: [
    node('k1', 'trigger', 'Called by a workflow', 'Execute Workflow Trigger', 'Stack', 'Execute Workflow Trigger', [['Inputs', 'the time a message wants to go out']], 'Another workflow asks when it is allowed to message a client.'),
    node('k2', 'action', 'Next allowed time', 'Code', 'Clock', 'Code', [['Window', '08:00–19:00 CT, Mon–Sat']], 'Works out the next time inside business hours: 8 am to 7 pm Central, Monday to Saturday.'),
    node('k3', 'wait', 'Wait until then', 'Wait', 'Timer', 'Wait', [['Resume', 'At a set time']], 'Holds the message until then.'),
  ],
  edges: [edge('k1', 'k2'), edge('k2', 'k3')],
}

export const plan: Plan = {
  title: 'Trusted Mover build plan',
  description: 'An n8n build plan for a moving company: six workflows, three helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'N8N BUILD PLAN · TRUSTED MOVER',
  heading: 'Every quote, booking and move, planned before a single node is placed.',
  lede:
    'Six n8n workflows and three helpers for Trusted Mover, a moving company in Austin, TX. Claude reads and drafts, Supabase holds the jobs, Google Sheets holds the schedule, Stripe takes the money, and a person approves anything a client sees.',
  meta: [
    ['Client', 'Trusted Mover · Austin, TX'],
    ['Platform', 'n8n'],
    ['Workflows', '6 + 3 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a job ends.',
    rail: [{ heading: 'Why plan first', body: 'A workflow built without a named outcome grows until nobody can say what it is for. This page is written before n8n is opened.' }],
    outcome: 'Every quote is answered within 5 minutes, and nothing a client sees goes out without a person saying yes.',
    trigger: 'Eight entry points: a web form, Cal.com, Stripe, two schedules, a sheet edit, a change form and n8n’s own error trigger.',
    exits: ['Closed', 'Lost', 'Cancelled', 'Claim open'],
    outOfScope: ['Payroll', 'Truck GPS', 'Accounting exports'],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary for workflows, nodes, links, keys and fields.',
    rail: [
      { heading: 'Why it matters', body: 'Six workflows today, thirty next year. Names are how the owner finds the one that broke.' },
      { heading: 'Rule of thumb', body: 'If an execution log does not read like a sentence, rename the nodes.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'TM-[number] · [Trigger] → [Outcome]', examples: ['TM-01 · Quote request → Qualified lead', 'TM-H02 · Notify ops'], rule: 'The number is the build order. Helpers get an H.' },
      { name: 'Nodes', pattern: '[Verb] [object]', examples: ['Find contact', 'Draft estimate', 'Log the quote'], rule: 'Default names like “HTTP Request1” never survive a build.' },
      { name: 'Webhook paths', pattern: '/tm/[source]', examples: ['/tm/quote', '/tm/change', '/tm/stripe'], rule: 'One path per source, all lowercase.' },
      { name: 'Credentials', pattern: 'TM · [Service] ([mode])', examples: ['TM · Stripe (live)', 'TM · Stripe (test)'], rule: 'Test and live keys never share a name.' },
      { name: 'Supabase fields', pattern: 'snake_case, _at for times, _usd for money', examples: ['deposit_paid_at', 'estimate_usd'], rule: 'The suffix tells you the unit.' },
      { name: 'Sheets tabs', pattern: 'Title Case, one job per tab', examples: ['Crew schedule', 'Rate card'], rule: 'Workflows read columns by header name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Three tables, seven stages and five sheet tabs.',
    rail: [{ heading: 'Source of truth', body: 'Supabase holds jobs and contacts. Sheets hold what people edit by hand: the rates and the crew schedule.' }],
    tables: [
      { name: 'contacts', fields: ['id', 'name', 'email', 'phone', 'created_at'], note: 'One row per person, matched on email or phone.' },
      { name: 'jobs', fields: ['id', 'contact_id', 'stage', 'move_date', 'size', 'from_zip', 'to_zip', 'estimate_usd', 'deposit_paid_at', 'crew', 'nudges_sent', 'source'], note: 'One row per move.' },
      { name: 'events', fields: ['job_id', 'type', 'payload', 'at'], note: 'Every workflow writes one, so the next run knows what already happened.' },
    ],
    stages: [
      ['0 New lead', 'A quote request came in and is being qualified.'],
      ['1 Survey booked', 'The client booked a video or in-home survey.'],
      ['2 Estimate sent', 'The approved estimate and the deposit link are with the client.'],
      ['3 Booked', 'The deposit is paid and the move is on the calendar.'],
      ['4 Move week', 'The move is less than a week away. Reminders and crew checks are running.'],
      ['5 Moved', 'The crew has finished. The final invoice and the feedback question are on their way.'],
      ['6 Closed', 'Paid, reviewed and done.'],
    ],
    exitStages: [
      ['Lost', 'No deposit after two reminders.'],
      ['Cancelled', 'The client cancelled. Any refund followed the policy.'],
    ],
    sheets: [
      ['Quote log', 'Every request, as it arrived'],
      ['Rate card', 'Hourly rates, truck fees and materials'],
      ['Crew schedule', 'One row per booked move. The crew edits it.'],
      ['Test matrix', 'The test rows below, with results'],
      ['Errors', 'One row per failed run'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Every entry point is a webhook, a schedule or a sheet edit. Nothing polls an inbox.' }],
    rows: [
      ['Quote form on the site', 'Webhook /tm/quote', 'TM-01'],
      ['Cal.com', 'BOOKING_CREATED', 'TM-02'],
      ['Stripe', 'checkout.session.completed', 'TM-03'],
      ['Schedule', 'Every hour', 'TM-03'],
      ['Schedule', 'Every day, 07:00 CT', 'TM-04'],
      ['Crew schedule sheet', 'Row status → Done', 'TM-05'],
      ['Reschedule form', 'Webhook /tm/change', 'TM-06'],
      ['Any failure', 'Error Trigger', 'TM-H01'],
    ],
  },
  workflows: [TM01, TM02, TM03, TM04, TM05, TM06],
  helpers: {
    title: 'Helpers',
    blurb: 'Three small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts, errors and quiet hours are written once and called from every workflow.' }],
    list: [H01, H02, H03],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [{ heading: 'How to test', body: 'Each row is one branch, walked with a test contact and Stripe test cards before handover.' }],
    rows: [
      { id: 't01', workflow: 'TM-01', branch: 'New quote', input: 'A fresh email with every field filled', expected: 'Job at stage 0, a Quote log row, survey link sent' },
      { id: 't02', workflow: 'TM-01', branch: 'Duplicate', input: 'The same email again within 24 h', expected: 'Notes merged into the open job, no second job' },
      { id: 't03', workflow: 'TM-01', branch: 'Missing detail', input: 'No move date', expected: 'One question sent, stage 0 needs info' },
      { id: 't04', workflow: 'TM-01', branch: 'Bad JSON from Claude', input: 'Force a parser error', expected: 'TM-H01 logs it and pings Telegram' },
      { id: 't05', workflow: 'TM-02', branch: 'Reminder', input: 'Survey booked for Tuesday 10:00', expected: 'Reminder arrives Monday 10:00 CT' },
      { id: 't06', workflow: 'TM-02', branch: 'No-show', input: 'No inventory form within 3 h', expected: 'One rebook link sent' },
      { id: 't07', workflow: 'TM-02', branch: 'Owner approves', input: 'Approve the draft', expected: 'Estimate and 20% deposit link sent, stage 2' },
      { id: 't08', workflow: 'TM-02', branch: 'Owner edits', input: 'Send it back with a note', expected: 'Note on Telegram, nothing sent to the client' },
      { id: 't09', workflow: 'TM-03', branch: 'Deposit paid', input: 'Stripe test card 4242 4242 4242 4242', expected: 'Stage 3, a crew schedule row, confirmation sent' },
      { id: 't10', workflow: 'TM-03', branch: 'Replayed event', input: 'Resend the same Stripe event', expected: 'Still one booking and one email' },
      { id: 't11', workflow: 'TM-03', branch: 'Unsigned call', input: 'POST without Stripe-Signature', expected: 'Rejected with 400, nothing changes' },
      { id: 't12', workflow: 'TM-03', branch: 'Unpaid for 72 h', input: 'An estimate sent 73 h ago', expected: 'Nudge 1, then nudge 2, then Lost' },
      { id: 't13', workflow: 'TM-04', branch: 'Seven days out', input: 'Move date is today + 7', expected: 'Stage 4, packing guide sent' },
      { id: 't14', workflow: 'TM-04', branch: 'No crew', input: 'Move in 2 days, crew blank', expected: 'Urgent Telegram alert' },
      { id: 't15', workflow: 'TM-04', branch: 'Day before', input: 'Move date is tomorrow', expected: 'Arrival window email' },
      { id: 't16', workflow: 'TM-05', branch: 'Paid and happy', input: 'Pay the invoice, reply “Great crew”', expected: 'Review link sent, stage 6' },
      { id: 't17', workflow: 'TM-05', branch: 'Damage', input: 'Reply “They scratched the table”', expected: 'Claim event and urgent alert, no review link' },
      { id: 't18', workflow: 'TM-06', branch: 'Reschedule, slot free', input: 'A new date with a free crew', expected: 'Date moved, schedule updated, confirmation sent' },
      { id: 't19', workflow: 'TM-06', branch: 'Cancel 10 days out', input: 'Cancel a move 10 days away', expected: 'Half the deposit refunded, stage Cancelled' },
      { id: 't20', workflow: 'TM-06', branch: 'Cancel 3 days out', input: 'Cancel a move 3 days away', expected: 'No refund, still confirmed' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then the workflows that take money, then the ones that run on their own.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Supabase tables: contacts, jobs, events', 'Add the credentials: TM · Supabase, TM · Stripe (test), TM · Gmail, TM · Telegram, TM · Anthropic', 'Create the Sheets tabs: Quote log, Rate card, Crew schedule, Test matrix, Errors', 'Build TM-H01, TM-H02 and TM-H03, and set TM-H01 as the error workflow'] },
      { name: '2 · Intake', tasks: ['Build TM-01 and point the site’s quote form at /tm/quote', 'Build TM-02 with the Cal.com webhook and the approval form', 'Run tests t01–t08'] },
      { name: '3 · Money', tasks: ['Build TM-03 with the Stripe webhook and the hourly sweep', 'Build TM-05 with the invoice and the feedback steps', 'Run tests t09–t12, t16 and t17'] },
      { name: '4 · Operations', tasks: ['Build TM-04', 'Build TM-06 with the refund policy', 'Run tests t13–t15 and t18–t20'] },
      { name: '5 · Test and hand over', tasks: ['Switch Stripe to live keys', 'Run the whole matrix again with a real card and a real refund', 'Walk the owner through the handover page', 'Turn every workflow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What the owner keeps.',
    rail: [{ heading: 'Written for the owner', body: 'One page, no jargon. It lives next to the workflows.' }],
    does: [
      'Answers every quote within 5 minutes, or asks one question.',
      'Books surveys and drafts estimates for you to approve.',
      'Takes deposits, fills the crew calendar and chases unpaid estimates.',
      'Reminds clients and crews before every move.',
      'Invoices, asks for feedback and sends damage reports to you.',
    ],
    breaks: [
      'Renaming or moving a column in the Crew schedule sheet.',
      'An expired or rotated Stripe key.',
      'Changing the Cal.com event type or its questions.',
      'Turning a workflow off without turning off its schedule.',
    ],
    call: 'Justine Acosta, who built it. Errors already reach the ops Telegram group with a link to the run.',
    logs: 'Every failure is a row in the Errors tab and a Telegram message. Every job change is a row in the Supabase events table.',
  },
  footer: { note: 'A worked example. Trusted Mover is a fictional client.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}
