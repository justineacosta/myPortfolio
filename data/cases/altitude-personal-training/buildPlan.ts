/**
 * Altitude’s Build plan case page (spec 2026-10-05 per-site pages): the
 * blueprint behind the three flows on its Automation page, AL-01 on n8n, AL-02
 * on Make and AL-03 on Zapier, with the helpers, data, tests and handover they
 * need. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/altitude-personal-training/build-plan.html. Only type imports,
 * so Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

const AL01: Workflow = {
  code: 'AL-01',
  title: 'Coaching application',
  platform: 'n8n',
  outcome: 'Every new applicant is offered the free 20-minute consult within minutes, well inside the two working days the site promises, and Elias has read a summary of their goal before the call.',
  trigger: 'The application behind Start coaching posts to /al/apply.',
  exits: ['Consult offered, Elias briefed', 'A client, with Elias'],
  watch: [
    'The application asks what the site says it asks: your goal, your schedule and what you have tried before. Its only other field is the email the reply goes to.',
    'Book a consult and Book a call with Elias skip the application and open Elias’s Cal.com consult page, so AL-01 never runs for them. If that person starts, Elias adds their row to Applications by hand.',
    'The reply is a fixed template, so it sends without waiting for anyone, well inside the two working days the site promises. Claude’s summary only ever reaches Elias.',
    'In n8n, a search that finds nothing ends the run quietly. Check the roster has Always Output Data on, so an email on no client’s row goes on as New instead of stopping.',
    'Applicants are matched on email, never on name. A second application from the same email updates the same row.',
    'Claude gives no training or injury advice. An injury in the answers is flagged for the consult, where Elias asks about it in person.',
    'If Claude fails, the person already has their reply. The run stops with an error, and AL-H02 tells Elias, who reads the answers himself.',
  ],
  nodes: [
    node('a1', 'trigger', 'Application', 'POST /al/apply', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Method', 'POST'], ['Path', '/al/apply'], ['Respond', 'At once, 202']], 'Someone sends the application that Start coaching opens, and their answers arrive here the moment they do.'),
    node('a2', 'action', 'Tidy the fields', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Keeps', 'goal, schedule, tried_before, email'], ['Email', 'trimmed and lowercased'], ['Answers', 'trimmed, kept as written']], 'Trims what they wrote, lowercases the email and keeps only the four fields the application has.'),
    node('a3', 'action', 'Check the roster', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Clients'], ['Filter by formula', 'Email matches, and Status is Active or Paused'], ['Limit', '1'], ['Always Output Data', 'On, so an email on no client’s row goes on as New']], 'Looks for a current client with this email. Finding none is the usual case, and the flow still goes on.'),
    node('a4', 'branch', 'Already a client?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Condition', 'the client’s record ID is not empty']], 'Checks whether the email belongs to someone Elias already coaches.'),
    node('a5', 'helper', 'Pass to Elias', 'AL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'AL-H01 · Alert Elias'], ['Says', 'a client applied again, with their answers'], ['Wait for it', 'No']], 'Sends Elias the client’s answers on Telegram. He writes back himself; no row is saved and no email goes out.'),
    node('a6', 'action', 'Save the application', 'Airtable', 'Database', ['airtable'], 'n8n · Airtable › Create or update', [['Table', 'Applications'], ['Match on', 'Email'], ['Sets', 'Goal, Schedule, Tried before, Status = Applied, Applied at']], 'Saves the answers in Applications, or updates the row if this email has applied before, and marks it Applied.'),
    node('a7', 'action', 'Offer the consult', 'Gmail', 'EnvelopeSimple', ['gmail', 'cal-com'], 'n8n · Gmail › Send message', [['From', 'hello@altitude.coach'], ['Template', 'Consult offer'], ['Includes', 'what the 20 minutes cover, nothing to sign yet, the booking link'], ['Link', 'Elias’s Consult event in Cal.com, 20 min, email filled in'], ['Written by', 'a fixed template, not Claude']], 'Emails the applicant what the free consult covers, that there is nothing to sign until they have met their coach, and a link to book it.'),
    node('a8', 'ai', 'Summarise the goal', 'Claude', 'Sparkle', ['claude'], 'n8n · Basic LLM Chain + Anthropic Chat Model', [['Model', 'Claude Sonnet 4.6'], ['Input', 'goal, schedule, tried before'], ['Returns', 'the goal in a line, what the schedule allows, what was tried, questions for the call'], ['Rule', 'no advice; an injury is flagged for the consult'], ['Goes to', 'Elias only']], 'Claude writes Elias a short summary of the application and the questions worth asking on the call.'),
    node('a9', 'action', 'Note the summary', 'Airtable', 'PencilSimple', ['airtable'], 'n8n · Airtable › Update record', [['Table', 'Applications'], ['Record', 'the row saved above'], ['Sets', 'Summary']], 'Saves Claude’s summary on the application, where Elias finds it after the consult too.'),
    node('a10', 'helper', 'Brief Elias', 'AL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'AL-H01 · Alert Elias'], ['Says', 'the summary, the answers, a link to the row'], ['Wait for it', 'No']], 'Sends Elias the summary and the answers on Telegram.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'),
    edge('a4', 'a6', 'New'), edge('a4', 'a5', 'A client'),
    edge('a6', 'a7'), edge('a7', 'a8'), edge('a8', 'a9'), edge('a9', 'a10'),
  ],
}

const AL02: Workflow = {
  code: 'AL-02',
  title: 'Start a plan',
  platform: 'make',
  outcome: 'Once Elias marks a consult Starting, the client starts the plan they chose on Stripe, has the 60-minute assessment held and a welcome in their inbox, and nothing is charged before Elias’s yes.',
  trigger: 'Make’s Airtable module watches Applications every 15 minutes for a row Elias has set to Starting. Stripe’s paid or expired checkout starts its second scenario.',
  exits: ['Started, assessment held', 'Started, Elias books the hour', 'Link expired, with Elias', 'Waiting on the client'],
  watch: [
    'Nothing is charged before Elias marks the consult Starting. That is his yes, and the client then starts the subscription on Stripe’s own page, with their own card.',
    'Make gives a scenario one trigger, so AL-02 is two scenarios in one folder: AL-02 · Start a plan · link ends when the payment link is emailed, and Stripe’s event starts AL-02 · Start a plan · paid. The diagram draws them as one flow, and the application’s Status joins them.',
    'Watch Records needs a Created or Last modified time field, so Applications has Status or plan changed, a Last modified time field that watches Status and Plan. Its formula takes only rows at Starting with a plan chosen. If Elias sets Starting before he picks the plan, the row waits in the Starting, no plan view, and picking the plan changes the field again, so the next check takes it.',
    'A Stripe Checkout link lasts 24 hours. An unpaid one sends checkout.session.expired, the row goes to Link expired, and Elias follows up. Setting it back to Starting sends a fresh link.',
    'Stripe can send an event twice. Find the application is a Get a record by the ID the checkout carries, not a search, so it always returns one bundle, and both routes require Awaiting payment. A repeat matches neither route and stops: one client, one booking.',
    'Stripe bills monthly from the day the client pays. The 12-week first block and the 14 days’ notice after it are terms in the emails, not Stripe settings, and any pause or cancel is done by Elias in Stripe by hand.',
    'The payment email and both welcomes are fixed templates, with no words from Claude.',
    'Cal.com’s own confirmation email for the assessment event types is turned off, or replaced by the welcome, so the client has one email to read.',
    'Every module that writes has an error route that posts to /al/failed and ends in Break, so Make keeps the run to retry.',
  ],
  nodes: [
    node('b1', 'trigger', 'Marked Starting', 'Airtable', 'Table', ['airtable'], 'Make · Airtable › Watch Records', [['Table', 'Applications'], ['Trigger field', 'Status or plan changed'], ['Formula', 'Status is Starting, and Plan is not empty'], ['Schedule', 'every 15 minutes']], 'Make checks Applications every quarter of an hour and picks up each row Elias has set to Starting since, with the plan the person chose.'),
    node('b2', 'action', 'Find the plan', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Get a record', [['Table', 'Plans'], ['Record ID', 'the application’s Plan link'], ['Returns', 'monthly price, Stripe price, assessment place, Cal.com event']], 'Reads the plan: $229, $449 or $760 a month, its Stripe price, and whether the assessment is in the studio or over video.'),
    node('b3', 'action', 'Create the checkout', 'Stripe', 'CreditCard', ['stripe'], 'Make · Stripe › Make an API call', [['Call', 'POST /v1/checkout/sessions'], ['Mode', 'subscription'], ['Price', 'the plan’s Stripe price, quantity 1'], ['Customer email', 'from the application'], ['Reference', 'the application’s record ID']], 'Creates a Stripe Checkout page for the plan’s monthly subscription. The link lasts 24 hours.'),
    node('b4', 'action', 'Await payment', 'Airtable', 'HourglassMedium', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Applications'], ['Sets', 'Status = Awaiting payment, Checkout ID']], 'Marks the application Awaiting payment, with the checkout it is waiting on.'),
    node('b5', 'action', 'Send the payment link', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['From', 'hello@altitude.coach'], ['Template', 'Your plan'], ['Holds', 'the plan, its monthly price, the 12-week first block, 14 days’ notice after it, the link'], ['Written by', 'a fixed template, not Claude']], 'Emails the person their plan, its monthly price and its terms, with the link to start it on Stripe.'),
    node('b6', 'wait', 'Client pays', 'Stripe', 'HourglassMedium', ['stripe'], 'Make · Stripe › Watch Events', [['Scenario', 'AL-02 · Start a plan · paid'], ['Events', 'checkout.session.completed, checkout.session.expired']], 'Stripe reports the checkout paid, or expired unpaid after 24 hours, and the second scenario starts with it.'),
    node('b7', 'action', 'Find the application', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Get a record', [['Table', 'Applications'], ['Record ID', 'the checkout’s reference'], ['Returns', 'one bundle: status, email, plan']], 'Reads the application the checkout belongs to, by its record ID.'),
    node('b8', 'branch', 'Paid in time?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Paid', 'checkout.session.completed, and Status = Awaiting payment'], ['Expired', 'checkout.session.expired, and Status = Awaiting payment'], ['Anything else', 'matches neither route, and stops']], 'Sends a paid checkout on to the client’s start, and an expired one to Elias. A repeated event matches neither.'),
    node('b9', 'action', 'Mark it lapsed', 'Airtable', 'XCircle', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Applications'], ['Sets', 'Status = Link expired']], 'Marks the application Link expired.'),
    node('b10', 'end', 'Tell Elias it lapsed', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Elias’s own'], ['Says', 'the link lapsed unpaid, with a link to the row']], 'Tells Elias the link lapsed. He follows up, and sets the row back to Starting if they still want to begin.'),
    node('b11', 'action', 'Open the client', 'Airtable', 'Database', ['airtable'], 'Make · Airtable › Create a record', [['Table', 'Clients'], ['Sets', 'Name, Email, Plan, Stripe customer, Stripe subscription, Status = Active'], ['Name', 'as given at Stripe Checkout']], 'Adds the person to Clients, Active, with their plan and Stripe subscription.'),
    node('b12', 'action', 'Mark it started', 'Airtable', 'FlagCheckered', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Applications'], ['Sets', 'Status = Started, Client']], 'Marks the application Started and links it to the client’s row.'),
    node('b13', 'action', 'Find free hours', 'Cal.com API', 'Clock', ['cal-com'], 'Make · HTTP › Make a request', [['Calls', 'the Cal.com API, GET free slots'], ['Event type', 'the plan’s Assessment, 60 min'], ['From', 'two days out, for a week']], 'Asks Cal.com for Elias’s free hours for the plan’s assessment, starting two days out.'),
    node('b14', 'branch', 'Any hour free?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['A free hour', 'the slot list is not empty'], ['None free', 'the slot list is empty']], 'Checks whether Cal.com found at least one free hour.'),
    node('b15', 'action', 'Book the assessment', 'Cal.com API', 'CalendarCheck', ['cal-com'], 'Make · HTTP › Make a request', [['Calls', 'the Cal.com API, POST a booking'], ['Books', 'the first free hour'], ['Where', '2045 Pearl Street, or a video link'], ['Cal.com’s emails', 'turned off, or replaced by the welcome']], 'Books the first free hour in Elias’s calendar for the assessment, at the studio or over video.'),
    node('b16', 'action', 'Send the welcome', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['From', 'hello@altitude.coach'], ['Template', 'Welcome'], ['Holds', 'the assessment time, a link to move it, what to bring, the check-in form link, day 7'], ['Written by', 'a fixed template, not Claude']], 'Emails the client the assessment time and a link to move it, what to bring, their check-in form link and what happens on day 7.'),
    node('b17', 'end', 'Tell Elias', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Elias’s own'], ['Says', 'who started, the plan, the assessment time'], ['Then', 'Elias sets them up in the coaching app by hand, and enters Block start']], 'Tells Elias who has started and when the assessment is, so he sets the client up in the coaching app by hand and enters their Block start.'),
    node('b18', 'action', 'Send the welcome', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['From', 'hello@altitude.coach'], ['Template', 'Welcome, time to follow'], ['Holds', 'what to bring, the check-in form link, that Elias will send a time'], ['Written by', 'a fixed template, not Claude']], 'Emails the client the same welcome, saying Elias will send the assessment time himself.'),
    node('b19', 'end', 'Ask Elias to book', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Elias’s own'], ['Says', 'no free hour for the assessment, book it by hand'], ['Then', 'Elias sets them up in the app, and enters Block start']], 'Tells Elias there was no free hour, so he books the assessment by hand and sets the client up in the app.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'), edge('b5', 'b6'), edge('b6', 'b7'), edge('b7', 'b8'),
    edge('b8', 'b11', 'Paid'), edge('b8', 'b9', 'Expired'),
    edge('b9', 'b10'),
    edge('b11', 'b12'), edge('b12', 'b13'), edge('b13', 'b14'),
    edge('b14', 'b15', 'A free hour'), edge('b15', 'b16'), edge('b16', 'b17'),
    edge('b14', 'b18', 'None free'), edge('b18', 'b19'),
  ],
}

const AL03: Workflow = {
  code: 'AL-03',
  title: 'Sunday check-in',
  platform: 'zapier',
  outcome: 'Every Sunday check-in reaches Elias with a summary beside it, so he can write each reply himself by Monday, and anyone who has not checked in by Sunday night gets a nudge.',
  trigger: 'Airtable’s New Record on Check-ins starts one Zap; Schedule by Zapier, every Sunday at 9 pm Mountain time, starts the other.',
  exits: ['Summarised, Elias replies', 'Nudged', 'Everyone checked in'],
  watch: [
    'Elias writes every reply himself. Claude’s summary goes to him alone and never becomes the reply, so there is no approval step: nothing Claude writes is on its way to a client.',
    'No flow reads or writes the coaching app. The check-in arrives on an Airtable form whose link is in the client’s welcome email, and Elias types his reply in the app himself, then marks the check-in Replied.',
    'A Zap has one trigger, so AL-03 is two Zaps: AL-03 · Sunday check-in · received and AL-03 · Sunday check-in · missed. The Automation page draws them as one trigger with two ways out, Check-in sent and None by Sunday, one for each Zap; there is no decision step. A check-in sent after a nudge is a new run of the received Zap, drawn there as Sent after the nudge. Nothing waits for it.',
    'Each client’s form link is pre-filled with their own row, and hides it, so a check-in always lands on the right client.',
    'Read the past weeks counts nothing found as a success, so a first check-in is still summarised, with nothing to compare.',
    'Claude gives no training, nutrition or injury advice. Pain or an injury in the answers is flagged first in the summary, for Elias.',
    'The nudge is a fixed template that asks for the check-in and nothing else, so it sends on its own.',
    'A client before their block start, or Paused, is never nudged: the Check-in missing view leaves them out.',
    'A failed step is caught by a Zapier Manager zap that posts it to /al/failed.',
  ],
  nodes: [
    node('c1', 'trigger', 'Check-in sent', 'Airtable', 'Table', ['airtable'], 'Zapier · Airtable › New Record', [['Zap', 'AL-03 · Sunday check-in · received'], ['Table', 'Check-ins'], ['Comes from', 'the client’s check-in form']], 'A client sends their Sunday check-in, and the Zap starts with it: sleep, steps, bodyweight trend and how training felt.'),
    node('c2', 'action', 'Find the client', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Record', [['Table', 'Clients'], ['Search formula', 'RECORD_ID() = the check-in’s Client link'], ['Returns', 'name, plan, block start']], 'Reads the client the check-in belongs to: their plan and when their block started.'),
    node('c3', 'action', 'Read the past weeks', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Many Records (With Line Item Support)', [['Table', 'Check-ins'], ['Match', 'this client, the four weeks before'], ['Nothing found', 'counted a success, so a first check-in goes on']], 'Finds the client’s last four check-ins, so this week can be read against them.'),
    node('c4', 'ai', 'Summarise it', 'Claude', 'Sparkle', ['claude'], 'Zapier · Anthropic (Claude) › Send message', [['Model', 'Claude Sonnet 4.6'], ['Input', 'this check-in, the past weeks, the plan, the week of the block'], ['Returns', 'what moved, what to ask, pain or injury flagged first'], ['Rule', 'under 120 words, for Elias only, no advice, never a reply']], 'Claude writes Elias a short summary of the check-in against the weeks before.'),
    node('c5', 'action', 'Save the summary', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Check-ins'], ['Sets', 'Summary, Status = Summarised']], 'Saves the summary on the check-in and marks it Summarised.'),
    node('c6', 'action', 'Send it to Elias', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Elias’s own'], ['Holds', 'the client, the week, the summary, a link to the answers']], 'Sends Elias the summary on Telegram, with a link to the full check-in.'),
    node('c7', 'wait', 'Elias writes the reply', 'By hand, by Monday', 'PencilSimple', [], 'Elias, by hand · not a Zapier step', [['Who', 'Elias'], ['Where', 'the coaching app'], ['By', 'Monday'], ['Then', 'he sets the check-in to Replied']], 'Elias reads the check-in, writes the reply himself in the coaching app by Monday, and marks the check-in Replied.'),
    node('c8', 'trigger', 'Sunday night', 'Schedule', 'Clock', ['zapier'], 'Zapier · Schedule by Zapier › Every Week', [['Zap', 'AL-03 · Sunday check-in · missed'], ['Day', 'Sunday'], ['Time', '9 pm, Mountain time']], 'The second Zap wakes at 9 pm every Sunday.'),
    node('c9', 'action', 'Find missed check-ins', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Many Records (With Line Item Support)', [['Table', 'Clients'], ['View', 'Check-in missing'], ['Returns', 'up to 100 clients, as line items'], ['Nothing found', 'the Zap stops: everyone checked in']], 'Finds the active clients, past their block start, with no check-in this week.'),
    node('c10', 'action', 'For each client', 'Looping', 'ArrowsClockwise', ['zapier'], 'Zapier · Looping › Create loop from line items', [['Loops over', 'the clients found']], 'Runs the next two steps once for each client.'),
    node('c11', 'action', 'Send a nudge', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['From', 'hello@altitude.coach'], ['Template', 'Check-in nudge'], ['Holds', 'their first name and their check-in form link'], ['Written by', 'a fixed template, not Claude']], 'Emails the client a short nudge with their check-in form link.'),
    node('c12', 'end', 'Note the nudge', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Clients'], ['Sets', 'Last nudged = now']], 'Notes the nudge on the client’s row, where Elias sees who missed the week.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'), edge('c6', 'c7'),
    edge('c8', 'c9'), edge('c9', 'c10'), edge('c10', 'c11'), edge('c11', 'c12'),
  ],
}

const H01: Workflow = {
  code: 'AL-H01',
  title: 'Alert Elias',
  platform: 'n8n',
  outcome: 'Every message n8n sends Elias reads the same way and lands in his Telegram chat.',
  trigger: 'Called by AL-01 and AL-H02.',
  exits: ['Message sent'],
  watch: [
    'A failure arrives with sound; a new application arrives silently, so evenings stay quiet.',
    'AL-H02 is not set as AL-H01’s error workflow: a failure here would call AL-H02, which calls AL-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, urgent, link']], 'Another workflow hands over a message, and says whether it is urgent.'),
    node('h2', 'action', 'Add the link', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code and a link to the row or the run']], 'Puts the flow’s code and a link to the application or the failed run under the message.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Elias’s own'], ['Disable notification', 'on, unless urgent']], 'Posts it in Elias’s chat.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'AL-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed run, on any of the three platforms, is logged and reaches Elias with a link to it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'It never retries on its own. Elias, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers AL-01 only, not AL-H01: AL-H01 is how this workflow alerts Elias, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'AL-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'AL-01, as its error workflow']], 'Starts whenever AL-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /al/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/al/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, a Zapier Manager zap']], 'Starts when a Make error route or the Zapier Manager zap reports a failed step in AL-02 or AL-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, step, message, run link, time']], 'Puts both kinds of failure into one shape: which platform, which flow, which step and what went wrong.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert Elias', 'AL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'AL-H01 · Alert Elias'], ['Urgent', 'yes']], 'Sends Elias an urgent Telegram message with a link to the failed run.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Altitude · Build plan',
  description: 'A build plan for Altitude, a personal training studio on Pearl Street in Boulder that also coaches online: three flows on n8n, Make and Zapier, two helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'BUILD PLAN · ALTITUDE',
  heading: 'Every application, start and check-in, planned before a single step is placed.',
  lede:
    'Three flows and two helpers for Altitude, where Elias Varga coaches around 40 clients in Boulder and online. The application runs on n8n, starting a plan on Make and the Sunday check-in on Zapier. Airtable holds the applications, plans, clients and check-ins, Stripe takes the monthly subscription and Claude summarises for Elias. Elias approves anything Claude drafts for a client’s inbox, and no subscription starts until he marks the consult Starting.',
  meta: [
    ['Client', 'Altitude Coaching LLC · Boulder, CO'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a client’s story ends.',
    rail: [{ heading: 'Why plan first', body: 'Two of Altitude’s promises are about time, a reply within two working days and every check-in answered by Monday, and one is about money: nothing to sign until you have met your coach. This page pins all three down before n8n, Make or Zapier is opened.' }],
    outcome: 'Every applicant is offered the free consult and Elias is briefed, every plan starts only after Elias marks the consult Starting, and every Sunday check-in reaches Elias with a summary, with a nudge for anyone who missed it.',
    trigger: 'Eight entry points: the application behind Start coaching, a consult marked Starting in Airtable, a Stripe checkout paid or expired, a check-in form, a schedule on Sunday night, AL-01 or AL-H02 calling AL-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Started', 'Not now', 'Link expired', 'Check-in answered'],
    outOfScope: ['The coaching app: sessions, messages and Elias’s replies live there, and no flow reads or writes it', 'Book a consult, which opens Elias’s Cal.com page directly', 'Pausing or cancelling a plan, which Elias does in Stripe by hand', 'The Program Q&A bot, form review and block review, planned on the AI agents page'],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, one coach. When a run fails on a Sunday night, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'AL-[number] · [Title]', examples: ['AL-01 · Coaching application', 'AL-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Scenarios and Zaps', pattern: 'AL-[number] · [Title] · [part]', examples: ['AL-02 · Start a plan · paid', 'AL-03 · Sunday check-in · missed'], rule: 'A flow a platform has to split keeps one code, and the last word says which part.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Check the roster', 'Create the checkout', 'Send a nudge'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/al/[source]', examples: ['/al/apply', '/al/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'AL · [Service] ([platform])', examples: ['AL · Airtable (n8n)', 'AL · Airtable (Make)', 'AL · Gmail (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew.' },
      { name: 'Stripe keys', pattern: 'AL · Stripe ([mode])', examples: ['AL · Stripe (test)', 'AL · Stripe (live)'], rule: 'Test and live keys never share a name, and going live is the last task.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Applications', 'Plans', 'Check-ins'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Four Airtable tables, four stages and two sheet tabs.',
    rail: [{ heading: 'Source of truth', body: 'Airtable holds what Elias edits: applications, plans, clients and check-ins. Stripe holds the subscriptions, Cal.com the calendar, and Google Sheets only keeps logs. The coaching app holds the training itself, and no flow touches it.' }],
    tables: [
      { name: 'Applications', fields: ['Email', 'Goal', 'Schedule', 'Tried before', 'Summary', 'Plan', 'Status', 'Status or plan changed', 'Applied at', 'Checkout ID', 'Client'], note: 'One row per person who applies, matched on email. Status is Applied, Starting, Awaiting payment, Started, Link expired or Not now. Elias sets Starting or Not now after the consult. Status or plan changed is a Last modified time field that watches Status and Plan.' },
      { name: 'Plans', fields: ['Plan', 'Monthly price', 'Stripe price', 'Assessment', 'Cal.com event'], note: 'Three rows: Online at $229, Hybrid at $449 and Studio at $760 a month. Assessment is Video for Online, and Studio for Hybrid and Studio.' },
      { name: 'Clients', fields: ['Name', 'Email', 'Plan', 'Stripe customer', 'Stripe subscription', 'Status', 'Block start', 'Check-in form', 'Last check-in', 'Checked in this week', 'Last nudged'], note: 'One row per client, around 40. Status is Active, Paused or Ended. Elias sets Block start when he loads the first block in the app. Check-in form is a formula: the form’s link, pre-filled with this client. The Check-in missing view lists Active clients past their block start with no check-in this week.' },
      { name: 'Check-ins', fields: ['Client', 'Week', 'Sleep', 'Steps', 'Bodyweight trend', 'How training felt', 'Summary', 'Status', 'Submitted at'], note: 'One row per check-in, from the form. Status is Received, Summarised or Replied; Received is the form’s default, and Elias sets Replied.' },
    ],
    stages: [
      ['Applied', 'The application is in, and the free consult has been offered.'],
      ['Starting', 'Elias has met them and marked the consult Starting, with the plan they chose.'],
      ['Awaiting payment', 'The Stripe link is out, for 24 hours.'],
      ['Started', 'Paid: the client is on the roster and their assessment is held or on its way.'],
    ],
    exitStages: [
      ['Not now', 'Elias and the person agreed on the call that it is not the time, or not the fit.'],
      ['Link expired', 'The link lapsed unpaid, and Elias follows up.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook on n8n, a table watch and a Stripe event on Make, a form and a schedule on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['Start coaching, the application', 'Webhook POST /al/apply', 'AL-01'],
      ['A consult marked Starting', 'Watch Records, every 15 min', 'AL-02'],
      ['A Stripe checkout paid or expired', 'Stripe Watch Events', 'AL-02'],
      ['A check-in form sent', 'Airtable New Record', 'AL-03'],
      ['Sunday, 9 pm Mountain time', 'Schedule, every week', 'AL-03'],
      ['AL-01 or AL-H02', 'Execute Sub-workflow', 'AL-H01'],
      ['An n8n run fails', 'Error Trigger', 'AL-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /al/failed', 'AL-H02'],
    ],
  },
  workflows: [AL01, AL02, AL03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message Elias with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [{ heading: 'How to test', body: 'Each row is one branch, walked with test applicants, Stripe test cards and a test calendar before anything reaches a real client.' }],
    rows: [
      { id: 't01', workflow: 'AL-01', branch: 'New', input: 'Goal: deadlift with confidence. Schedule: three mornings a week. Tried: classes on and off. A new email', expected: 'A row at Applied, the consult offer with the Cal.com link, and Elias gets Claude’s summary' },
      { id: 't02', workflow: 'AL-01', branch: 'A client', input: 'The email of an Active test client', expected: 'Elias gets the answers on Telegram; no row, no email' },
      { id: 't03', workflow: 'AL-01', branch: 'Applied before', input: 'The same new email, sent twice', expected: 'One row, updated; a consult offer each time' },
      { id: 't04', workflow: 'AL-01', branch: 'An injury mentioned', input: 'Tried: running, until a knee injury last year', expected: 'The summary flags the knee for the consult and gives no advice; the email does not mention it' },
      { id: 't05', workflow: 'AL-01', branch: 'Messy email', input: 'The client’s email in capitals, with a trailing space', expected: 'Matched as the client; Elias gets the answers' },
      { id: 't06', workflow: 'AL-01', branch: 'Claude fails', input: 'A test run with the Anthropic key revoked', expected: 'The applicant still has their reply; AL-H02 logs it and alerts Elias' },
      { id: 't07', workflow: 'AL-02', branch: 'Paid, Online', input: 'Online marked Starting; Stripe test card 4242 4242 4242 4242', expected: 'A $229 monthly subscription; client Active, assessment held over video, welcome sent, Elias told' },
      { id: 't08', workflow: 'AL-02', branch: 'Paid, Studio', input: 'Studio marked Starting, paid with a test card', expected: 'A $760 monthly subscription; the assessment is held at 2045 Pearl Street' },
      { id: 't09', workflow: 'AL-02', branch: 'Expired', input: 'Expire the test checkout through the Stripe API', expected: 'Link expired, Elias told; no client, no booking' },
      { id: 't10', workflow: 'AL-02', branch: 'Replayed event', input: 'Resend the paid event from Stripe', expected: 'Matches neither route; still one client and one booking' },
      { id: 't11', workflow: 'AL-02', branch: 'None free', input: 'Elias’s test calendar fully blocked for the week', expected: 'The time-to-follow welcome, and Elias asked to book by hand' },
      { id: 't12', workflow: 'AL-02', branch: 'No plan chosen', input: 'Set a row to Starting with Plan empty, then pick Online a minute later', expected: 'Nothing runs while Plan is empty, and the row shows in the Starting, no plan view; once Online is picked, the next check sends the link' },
      { id: 't13', workflow: 'AL-02', branch: 'Starting again', input: 'Set a Link expired row back to Starting', expected: 'A fresh link, and the row Awaiting payment' },
      { id: 't14', workflow: 'AL-03', branch: 'Check-in sent', input: 'A test client’s check-in: 7 h sleep, 8,000 steps, bodyweight down, training felt good', expected: 'A summary saved, Status Summarised, Elias told; nothing sent to the client' },
      { id: 't15', workflow: 'AL-03', branch: 'First check-in', input: 'A client with no check-ins before', expected: 'Still summarised, with nothing to compare' },
      { id: 't16', workflow: 'AL-03', branch: 'Pain mentioned', input: 'Training felt: left shoulder sore on the press', expected: 'The summary flags the shoulder first and gives no advice' },
      { id: 't17', workflow: 'AL-03', branch: 'Missed', input: 'An Active test client past their block start with no check-in by 9 pm Sunday', expected: 'One nudge with their form link; Last nudged set' },
      { id: 't18', workflow: 'AL-03', branch: 'Everyone checked in', input: 'Every test client checked in this week', expected: 'Nothing found; the Zap stops, no email' },
      { id: 't19', workflow: 'AL-03', branch: 'Not yet started', input: 'A new client whose block starts next week', expected: 'No nudge' },
      { id: 't20', workflow: 'AL-03', branch: 'Paused', input: 'A Paused test client with no check-in', expected: 'No nudge' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order a client meets them: the application, the start, then the first Sunday.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Airtable tables: Applications, Plans, Clients, Check-ins, with the Check-in missing and Starting, no plan views', 'Add the connections on each platform: AL · Airtable, AL · Gmail, AL · Anthropic, AL · Telegram, AL · Stripe (test)', 'Create the Sheets tabs: Failed runs, Test matrix', 'Build AL-H01 in n8n, then AL-H02 with AL-01 (not AL-H01) as the covered error workflow'] },
      { name: '2 · Applications on n8n', tasks: ['Set up Elias’s Consult event type in Cal.com, 20 minutes', 'Build AL-01 and point the application behind Start coaching at /al/apply', 'Run tests t01–t06'] },
      { name: '3 · Starts on Make', tasks: ['Create the three monthly prices in Stripe test mode, and fill Plans with them', 'Set up the Assessment event types in Cal.com, studio and video, 60 minutes, with their own confirmation emails turned off, or replaced by the welcome', 'Build both AL-02 scenarios, the link and the paid, in one Make folder', 'Give every module that writes an error route to /al/failed', 'Run tests t07–t13 with test applicants and Stripe test cards'] },
      { name: '4 · Check-ins on Zapier', tasks: ['Build the check-in form on Check-ins, and the pre-filled Check-in form formula on Clients', 'Build both AL-03 Zaps, received and missed', 'Add the Zapier Manager zap that posts failures to /al/failed', 'Run tests t14–t20 with test clients'] },
      { name: '5 · Test and hand over', tasks: ['Switch AL-02 to AL · Stripe (live) and its live prices', 'Run the whole matrix again with Elias', 'Walk Elias through the handover page', 'Turn every flow on before a Sunday'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Altitude keeps.',
    rail: [{ heading: 'Written for Elias', body: 'One page, no jargon, for the person who reads every check-in. It lives next to the flows.' }],
    does: [
      'Offers every new applicant the free 20-minute consult within minutes, and gives Elias a summary of their goal.',
      'Sends a current client’s application straight to Elias.',
      'Starts a plan only after Elias marks the consult Starting: the payment link first, then, once paid, the client’s row, the assessment and the welcome.',
      'Tells Elias when a payment link lapses, and when a new client needs setting up in the app, with a reminder to enter their Block start, which the Sunday nudge reads.',
      'Puts a summary beside every Sunday check-in for Elias, who writes each reply himself.',
      'Nudges every active client who has not checked in by Sunday night.',
    ],
    breaks: [
      'Renaming a field in Applications, Plans, Clients or Check-ins.',
      'Changing the Status choices in Applications, which AL-02 watches.',
      'Changing a price in Stripe without changing the Stripe price in Plans.',
      'Editing the check-in form’s questions, or the Check-in missing view.',
      'Changing the Consult or Assessment event types in Cal.com.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach Elias on Telegram with a link to the run.',
    logs: 'Every failed run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message. Every application keeps its status in Airtable, every client their Stripe subscription, and every check-in its summary and whether it was answered.',
  },
  footer: { note: 'A worked example. Altitude is a fictional coaching studio, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
