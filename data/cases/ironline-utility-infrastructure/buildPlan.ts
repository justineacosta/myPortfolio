/**
 * Ironline Utility Infrastructure’s Build plan case page (spec 2026-10-05
 * per-site pages): the blueprint behind the three flows on its Automation
 * page, IL-01 on n8n, IL-02 on Make and IL-03 on Zapier, with the helpers,
 * data, tests and handover they need. The safety rule comes first in every
 * flow’s watch-outs. data/cases/index.ts registers it; `npm run cases` renders
 * it into public/cases/ironline-utility-infrastructure/build-plan.html. Only
 * type imports, so Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The safety rule, first in every flow’s watch-outs and on the start rail. */
const SAFE = 'The safety rule: no step in these flows, and no Claude step, gives, drafts or changes a switching, clearance, outage or energized-work instruction. Those come from the job brief, the superintendent and system operations, and every task starts with a documented job brief. Storm and emergency calls go to the 24/7 line, (614) 555-0199, answered by people. No flow reads a message for an emergency and no flow dispatches a crew: crews roll within six hours of a call, by a person’s decision.'

/** Who says yes, as on the Automation page. */
const YES = 'The safety director approves every near-miss bulletin before it goes company-wide, and the project’s superintendent approves every closeout package before it reaches the owner. The bid acknowledgement, the reminders and the closeout email are fixed templates and send on their own. Claude drafts only the near-miss bulletin, which stays inside Ironline, and nothing Claude writes reaches an owner’s inbox. A bid goes to the superintendent on the Bid duty rota, a rule the bid desk keeps, and anyone on the bid desk can reassign it.'

const IL01: Workflow = {
  code: 'IL-01',
  title: 'Bid request',
  platform: 'n8n',
  outcome: 'Every bid request to bids@ is logged and in a superintendent’s hands within minutes, and the sender hears at once that a superintendent will respond within one business day.',
  trigger: 'n8n’s Gmail Trigger checks bids@ironlineutility.com every minute for mail from outside Ironline; a Schedule Trigger runs the due-today check at 6 a.m. each business morning.',
  exits: ['Assigned by the rota, acknowledged', 'No one on the rota, bid desk told, acknowledged', 'Follow-up passed on', 'Due today, bid desk told'],
  watch: [
    SAFE,
    'In IL-01 that means the acknowledgement, a fixed template, ends with the 24/7 line. Nothing in IL-01 reads an email for urgency, so a storm or emergency sent to bids@ is logged and assigned like any request, and the sender is told to call (614) 555-0199, where people answer around the clock. No step promises a crew or a time.',
    'A superintendent, not a salesperson, reviews every inquiry and responds within one business day, as the site says. The rule that picks the superintendent is the Bid duty rota: whoever is on bid duty that week, set by the bid desk each Friday. It never reads the email to choose, and anyone on the bid desk can reassign a request on its row.',
    'n8n hands a poll’s emails on together, and a search’s Always Output Data speaks for the whole batch, not for each email. So IL-01 is two parts: IL-01 · Bid request · inbox holds the two triggers and hands each email on its own, with Execute Sub-workflow set to Run once for each item, to IL-01 · Bid request · one email. Every search there sees one email, so an empty result means that email. The Automation page draws the two parts as one flow.',
    'Find the thread has Always Output Data on, so an email on a thread with no request hands an empty item to New request?, which logs it as new. Only a new thread is logged, assigned and acknowledged, so a reply, or an auto-reply, never starts a second bid or a loop of acknowledgements.',
    'Find who’s on duty has Always Output Data on, so a week with no one on the rota hands an empty item to On the rota?, which sends it to IL-H01: the bid desk group is told at once, with a link to the row, and assigns a superintendent by hand. The acknowledgement still goes.',
    'Respond by is an Airtable formula: the end of the next business day after the email arrived, Monday to Friday, Eastern, skipping the holidays the bid desk lists in it. The superintendent writes the response themselves, from the thread in bids@, and sets Status to Responded. Each business morning at 6 a.m. Eastern, Find bids due today has Always Output Data on: every request still New or Assigned on its Respond by day reaches the bid desk group, and an empty result goes to Nothing due.',
    'The acknowledgement is a reply on the sender’s thread from bids@, a fixed template with Append n8n Attribution off. It names no price, no date and no crew. Claude writes none of IL-01.',
    'The trigger’s search skips mail from ironlineutility.com, so the acknowledgement and the superintendent’s own response from bids@ never start a run. The drawings stay in bids@: the row keeps their names and a link to the thread, and the superintendents have delegate access to the inbox.',
    'Log the request, Notify superintendent and Acknowledge the email retry three times. If one still fails, the run fails and IL-H02 alerts the bid desk with the step and a link to the run. Both parts of IL-01 keep their failed executions, so a person reads the email there, or in bids@, and finishes by hand.',
  ],
  nodes: [
    node('a1', 'trigger', 'Email to bids@', 'Gmail Trigger', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail Trigger', [['Workflow', 'IL-01 · Bid request · inbox'], ['Connection', 'IL · Gmail (n8n), signed in as bids@ironlineutility.com'], ['Poll Times', 'Every Minute'], ['Event', 'Message Received'], ['Label Names', 'INBOX'], ['Search', '-from:ironlineutility.com, so Ironline’s own mail never starts a run'], ['Simplify', 'Off, so the attachment names come too'], ['Download Attachments', 'Off: the drawings stay in bids@']], 'Request a bid opens an email to bids@. Every minute n8n picks up each new email from outside Ironline: drawings, a scope letter or a two-line description.'),
    node('a2', 'action', 'One email at a time', 'Execute Sub-workflow', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'IL-01 · Bid request · one email, which starts with When Executed by Another Workflow'], ['Mode', 'Run once for each item'], ['Wait for Sub-Workflow Completion', 'Off'], ['Hands over', 'one email: sender, subject, body, attachment names, message ID, thread ID, received at']], 'Hands each email from the poll to the rest of IL-01 on its own, so every search after it answers for one email.'),
    node('a3', 'action', 'Find the thread', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search', [['Connection', 'IL · Airtable (n8n)'], ['Table', 'Bid requests'], ['Filter By Formula', '{Thread ID} is the email’s thread ID'], ['Limit', '1'], ['Always Output Data', 'On, so an email on a new thread goes on to the check as an empty item']], 'Looks for a request already logged on this email’s thread.'),
    node('a4', 'branch', 'New request?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['New', 'the found row’s ID is empty'], ['Follow-up', 'otherwise']], 'Sends a new thread to be logged, and an email on a logged thread to its request.'),
    node('a5', 'action', 'Add the follow-up', 'Airtable', 'Copy', ['airtable'], 'n8n · Airtable › Update', [['Record', 'the request found'], ['Sets', 'Follow-ups = the old text plus this email’s sender, time and text, as written; Last email at = now'], ['Keeps', 'the superintendent and Respond by as they were']], 'Adds the email to its request, so the bid holds every message in its thread.'),
    node('a6', 'end', 'Pass it on', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Connection', 'IL · Telegram (n8n)'], ['Chat ID', 'the request’s Superintendent chat ID, or the bid desk group while no one is assigned'], ['Says', 'a follow-up on the subject, from the sender, its attachment names and a link to the row']], 'Passes the follow-up to the superintendent reviewing the bid.'),
    node('a7', 'action', 'Log the request', 'Airtable', 'Table', ['airtable'], 'n8n · Airtable › Create', [['Table', 'Bid requests'], ['Sets', 'Sender name, Sender email, Subject, Email = as written, Attachment names, Thread ID, Gmail link, Received at, Status = New'], ['Respond by', 'a formula on the table: the end of the next business day'], ['Retry on fail', 'On, 3 tries']], 'Adds the request as a row, with the day it is due.'),
    node('a8', 'action', 'Find who’s on duty', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search', [['Table', 'Bid duty'], ['Filter By Formula', '{Week of} is this week’s Monday'], ['Limit', '1'], ['Always Output Data', 'On, so an empty rota goes on to the check']], 'Looks up the superintendent on bid duty this week.'),
    node('a9', 'branch', 'On the rota?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Found', 'Superintendent chat ID is not empty'], ['None', 'otherwise']], 'Goes on to assign when the rota names someone this week, and to the bid desk when it does not.'),
    node('a10', 'action', 'Assign by the rota', 'Airtable', 'UserCheck', ['airtable'], 'n8n · Airtable › Update', [['Record', 'the request just logged'], ['Sets', 'Superintendent = the one on duty; Assigned by = Rota; Status = Assigned']], 'Puts the superintendent on bid duty on the request.'),
    node('a11', 'action', 'Notify superintendent', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat ID', 'the superintendent’s, from Bid duty'], ['Says', 'the sender, the subject, the attachment names, Respond by and a link to the row'], ['Retry on fail', 'On, 3 tries']], 'Messages the superintendent who will review the request and write the response.'),
    node('a12', 'helper', 'Ask the bid desk', 'IL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'IL-H01 · Alert a team'], ['Team', 'Bid desk'], ['Urgent', 'yes'], ['Says', 'a bid request with no one on the rota this week, and a link to the row']], 'Tells the bid desk group at once, so a person assigns a superintendent by hand.'),
    node('a13', 'end', 'Acknowledge the email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Reply to a message', [['Connection', 'IL · Gmail (n8n), signed in as bids@ironlineutility.com'], ['Message ID', 'the email’s'], ['Template', 'We have your bid request'], ['Holds', 'that a superintendent, not a salesperson, will review the request and respond within one business day; the bid desk, (614) 555-0142, Mon–Fri, 6a–6p ET; for storm or emergency response, (614) 555-0199, answered 24/7/365'], ['Append n8n Attribution', 'Off'], ['Written by', 'a fixed template, not Claude'], ['Retry on fail', 'On, 3 tries']], 'Replies on the sender’s thread, whichever way the superintendent was assigned.'),
    node('a14', 'trigger', 'Each business morning', 'Schedule Trigger', 'Clock', ['n8n'], 'n8n · Schedule Trigger', [['Workflow', 'IL-01 · Bid request · inbox'], ['Cron', '0 6 * * 1-5: 6:00 a.m., Monday to Friday'], ['Timezone', 'America/New_York, in the workflow’s settings']], 'At 6 a.m. each business morning, the due-today check starts.'),
    node('a15', 'action', 'Find bids due today', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search', [['Table', 'Bid requests'], ['Filter By Formula', 'Status is New or Assigned, and Respond by is today or earlier'], ['Always Output Data', 'On, so a morning with nothing due still reaches the check']], 'Looks for every request still open on the day it is due.'),
    node('a16', 'branch', 'Any due?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Due', 'the row’s ID is not empty'], ['None', 'otherwise']], 'Sends each request due today to the bid desk, and an empty result to Nothing due.'),
    node('a17', 'helper', 'Tell the bid desk', 'IL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'IL-H01 · Alert a team'], ['Team', 'Bid desk'], ['Urgent', 'no'], ['Says', 'one message per request: the sender, the subject, the superintendent, Respond by and a link']], 'Tells the bid desk which requests are due today and still open.'),
    node('a18', 'end', 'Nothing due', 'No Operation', 'FlagCheckered', ['n8n'], 'n8n · No Operation, do nothing', [['Does', 'nothing: no request is due today']], 'Ends a morning with nothing due, without a message.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'),
    edge('a4', 'a7', 'New'), edge('a4', 'a5', 'Follow-up'),
    edge('a5', 'a6'),
    edge('a7', 'a8'), edge('a8', 'a9'),
    edge('a9', 'a10', 'Found'), edge('a9', 'a12', 'None'),
    edge('a10', 'a11'), edge('a11', 'a13'), edge('a12', 'a13'),
    edge('a14', 'a15'), edge('a15', 'a16'),
    edge('a16', 'a17', 'Due'), edge('a16', 'a18', 'None'),
  ],
}

const IL02: Workflow = {
  code: 'IL-02',
  title: 'Near-miss review',
  platform: 'make',
  outcome: 'Every near-miss filed becomes a draft bulletin within minutes, and goes company-wide within 48 hours once the safety director approves it, with no names and no blame.',
  trigger: 'Make’s Airtable Watch Records picks up each report filed on the near-miss form, every 15 minutes. A schedule at 6 a.m. and 2 p.m. Eastern starts the reminder, and a second Watch Records picks up each bulletin the safety director approves.',
  exits: ['Sent company-wide, within 48 hours', 'Sent company-wide, after 48 hours', 'Awaiting approval, reminded'],
  watch: [
    SAFE,
    'In IL-02 that means Claude never writes a switching, clearance, outage or energized-work step. When a report touches one, Claude sets Touches procedure to Yes and leaves the lesson empty: the safety director writes it, and any change to a procedure goes through the job brief, the superintendents and system operations, never through a bulletin. Every bulletin ends with the same fixed line: switching, clearance and energized-work steps come only from your job brief, your superintendent and system operations.',
    'The report form asks what happened, what stopped it being worse and the lesson. It never asks who was at fault, and Near-miss reports has no field for it. Filed by is optional, for the safety director’s questions only: Claude never reads it, and it never reaches a bulletin.',
    'Claude reads What happened, What stopped it, The lesson, the discipline and the state, never Filed by or the job number. Its instructions say to write roles, never names (a lineman, the foreman, a crew), and to state what happened without fault. The safety director checks the draft for any name before approving.',
    'Only the safety director approves, by setting Status to Approved on the report’s row; Airtable’s field editing permissions let no one else change Status. They may rewrite the draft entirely. Nothing goes out before Approved.',
    'Make gives a scenario one trigger, so IL-02 is three scenarios in one folder: IL-02 · Near-miss review · draft, · remind and · send. The Automation page draws them as one flow.',
    'Review due is an Airtable formula, 48 hours after Filed at, so the promise is measured from the moment a report is filed. Find reviews waiting is an Airtable Make an API call, not a search module, so it always returns one bundle with the list, even an empty one. The filter before Remind the director routes on the list’s length: one or more sends one message listing every report still waiting, and an empty list stops there, with nothing to remind.',
    'Bulletin approved watches Status changing, with the formula Status is Approved and Sent at is empty. Mark it reviewed sets Status to Sent, so a later edit to the row never sends a bulletin twice.',
    'Draft the bulletin and Read the draft have error routes that post the step and the error, never the report’s text, to /il/failed, then resume with an empty draft and Touches procedure Yes: the report still reaches the safety director, who writes the bulletin by hand. Every module that writes or sends has an error route that posts the step and the error to /il/failed and ends in Break, with incomplete executions stored, so Make keeps the run to retry.',
  ],
  nodes: [
    node('b1', 'trigger', 'Near-miss filed', 'Airtable form', 'Warning', ['airtable', 'make'], 'Make · Airtable › Watch Records', [['Scenario', 'IL-02 · Near-miss review · draft'], ['Table', 'Near-miss reports, filled from its form'], ['Trigger field', 'Filed at, a Created time field'], ['Schedule', 'every 15 minutes'], ['The form asks', 'when and where, the job number, the discipline, what happened, what stopped it being worse, the lesson, and Filed by, optional'], ['Never asks', 'who was at fault']], 'A crew member files a near-miss on the form, and Make picks it up within a quarter of an hour.'),
    node('b2', 'ai', 'Draft the bulletin', 'Claude', 'Sparkle', ['claude'], 'Make · Anthropic Claude › Create a prompt', [['Connection', 'IL · Anthropic (Make)'], ['Model', 'Claude Sonnet 4.6'], ['Temperature', '0'], ['Reads', 'What happened, What stopped it, The lesson, Discipline and State; never Filed by or the job number'], ['Returns', 'JSON: headline, what happened, lesson, touches procedure (true or false)'], ['Rules', 'roles, never names; no fault; never a switching, clearance, outage or energized-work step; when the report touches one, touches procedure is true and lesson is empty'], ['On error', 'posts the step and the error to /il/failed, then resumes with an empty draft and touches procedure true']], 'Claude drafts the bulletin from what the crew wrote, with roles in place of names.'),
    node('b3', 'action', 'Read the draft', 'JSON', 'ShieldCheck', ['make'], 'Make · JSON › Parse JSON', [['Structure', 'headline, what happened, lesson, touches procedure'], ['On error', 'posts to /il/failed, then resumes with an empty draft and touches procedure true']], 'Turns Claude’s answer into fields. An answer that cannot be read becomes an empty draft, flagged, for the safety director to write.'),
    node('b4', 'action', 'Save the draft', 'Airtable', 'Database', ['airtable'], 'Make · Airtable › Update a record', [['Connection', 'IL · Airtable (Make)'], ['Table', 'Near-miss reports'], ['Record', 'the one filed'], ['Sets', 'Headline, Bulletin draft, Lesson draft, Touches procedure = Yes or No, Status = Awaiting approval'], ['Review due', 'a formula on the table: Filed at plus 48 hours']], 'Writes the draft beside the report, ready for the safety director.'),
    node('b5', 'action', 'Tell the director', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Connection', 'IL · Telegram (Make)'], ['Chat ID', 'the safety director’s own'], ['Says', 'a near-miss filed, its discipline and state, Touches procedure, Review due and a link to the row; never Filed by']], 'Tells the safety director the moment a draft is ready.'),
    node('b6', 'trigger', 'Twice a day', 'Schedule', 'Clock', ['make'], 'Make · Scenario schedule', [['Scenario', 'IL-02 · Near-miss review · remind'], ['Runs', 'every day, at 6:00 a.m. and 2:00 p.m. Eastern']], 'Twice a day, every day, the reminder scenario wakes.'),
    node('b7', 'action', 'Find reviews waiting', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'GET /v0/{base}/Near-miss reports'], ['Formula', 'Status is Awaiting approval'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Asks for every report still waiting for the safety director’s yes.'),
    node('b8', 'action', 'Remind the director', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Filter before it', 'the list’s length is 1 or more; an empty list stops here, with nothing to remind'], ['Chat ID', 'the safety director’s own'], ['Says', 'one line per report still waiting: its headline, Review due and a link']], 'Reminds the safety director of every review still open, and when each is due.'),
    node('b9', 'approve', 'Director approves', 'In Airtable', 'UserCheck', ['airtable'], 'The safety director, by hand · not a Make step', [['Who', 'the safety director, the only person Status lets approve'], ['Reads', 'the report and Claude’s draft, side by side'], ['Edits', 'takes out any name, rewrites what they choose, and writes the lesson when Touches procedure is Yes'], ['Then', 'sets Status = Approved']], 'The safety director reads, edits and approves the bulletin. Nothing goes out without it.'),
    node('b10', 'wait', 'Bulletin approved', 'Airtable', 'HourglassMedium', ['airtable'], 'Make · Airtable › Watch Records', [['Scenario', 'IL-02 · Near-miss review · send'], ['Table', 'Near-miss reports'], ['Trigger field', 'Status changed, a Last modified time field on Status'], ['Formula', 'Status is Approved, and Sent at is empty'], ['Schedule', 'every 15 minutes']], 'Make picks up each bulletin the safety director has approved, within a quarter of an hour.'),
    node('b11', 'action', 'Send company-wide', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'IL · Gmail (Make), signed in as safety@ironlineutility.com'], ['To', 'the company-wide list'], ['Template', 'Near-miss review: [the headline]'], ['Holds', 'the headline, what happened and the lesson as approved; the fixed line on switching, clearance and energized work; storm or emergency, (614) 555-0199'], ['Never holds', 'a name, or who was at fault']], 'Emails the approved bulletin to everyone at Ironline.'),
    node('b12', 'action', 'Post to the crews', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Ironline crews, the channel'], ['Says', 'the same bulletin and the same fixed line']], 'Posts the bulletin where the crews read first.'),
    node('b13', 'end', 'Mark it reviewed', 'Airtable', 'FlagCheckered', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Near-miss reports'], ['Sets', 'Status = Sent; Sent at = now'], ['Within 48 hours', 'a formula: Sent at is no more than 48 hours after Filed at']], 'Marks the report reviewed company-wide, and whether it made the 48 hours.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'), edge('b5', 'b9'),
    edge('b6', 'b7'), edge('b7', 'b8'), edge('b8', 'b9'),
    edge('b9', 'b10'), edge('b10', 'b11'), edge('b11', 'b12'), edge('b12', 'b13'),
  ],
}

const IL03: Workflow = {
  code: 'IL-03',
  title: 'Closeout',
  platform: 'zapier',
  outcome: 'Every energized project has its closeout clock running from the day the date is set, the project lead is reminded before it runs out, and the owner gets the package within ten business days, after the superintendent approves it.',
  trigger: 'Airtable’s New or Updated Record starts the clock Zap when a project’s Energization date is set; Airtable’s New Record starts the send Zap when the project lead submits the closeout package.',
  exits: ['Package sent, approved', 'Sent back to the project lead', 'Reminded, then due-day alert', 'No answer, nothing sent'],
  watch: [
    SAFE,
    'In IL-03 that means the flow starts after energization and never touches it. Switching is executed with operations by people, and the project lead sets the Energization date only once the line is energized. The package holds the as-builts and test reports as the crew made them, and no step writes in it.',
    'As-builts and closeout are turned over within ten business days of energization, as the site says. Closeout due is an Airtable formula, WORKDAY(Energization date, 10), skipping the holidays the office lists in it; Reminder on is the same formula with 8.',
    'A Zap has one trigger, so IL-03 is two Zaps: IL-03 · Closeout · clock and IL-03 · Closeout · send. The Automation page draws them as one flow. Paths never rejoin: Name the answer and Record the answer come before them, and each path ends on its own.',
    'Delay Until waits at most a month, and ten business days never reach it. Each wait is followed by a fresh Check the project and a filter: the clock goes on only while Closeout sent on is empty and the Energization date still matches the one it started with. A corrected date starts its own clock, and the old one stops at its next check, so the lead is reminded once.',
    'Human in the Loop notifies the superintendent by email, with the link to its Zapier review page, and records Approved or Rejected. Opening the link, or a mail scanner opening it, records nothing: only the superintendent’s choice on the page does. With no answer, the send Zap goes no further and nothing is sent; the clock still alerts the Projects group on the due day.',
    'Name the answer is a Formatter Lookup Table: Approved stays Approved, and anything else becomes Sent back. A sent-back package is never sent: the lead fixes it and submits it again, and each submission is a new row, so it starts its own review.',
    'The package is one PDF, under Gmail’s 25 MB limit, as the closeout form asks. The closeout email is a fixed template, and it sends only after the superintendent’s Approved.',
    'Check the project is a Find Record with success when nothing is found turned off, so a project deleted mid-clock halts the run. Zapier marks it halted, and a Zapier Manager zap on New Halted Task posts it to /il/failed a few minutes later, with the zap and the time, as Zapier Manager gives them. A failed step, like the email, is caught by a second Zapier Manager zap, on New Zap Error, with the zap, the time and the error’s message. If the email fails, Closeout sent on stays empty, and the lead sends the package by hand once the row shows Approved.',
  ],
  nodes: [
    node('c1', 'trigger', 'Energization date set', 'Airtable', 'CalendarCheck', ['airtable'], 'Zapier · Airtable › New or Updated Record', [['Zap', 'IL-03 · Closeout · clock'], ['Connection', 'IL · Airtable (Zapier)'], ['Table', 'Projects'], ['Last modified time field', 'Energization changed, watching Energization date only']], 'The project lead sets the Energization date once the line is energized, and the clock Zap starts.'),
    node('c2', 'action', 'Date set only', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Energization date', 'exists']], 'Goes on only when a date was set, not cleared.'),
    node('c3', 'action', 'Tell the project lead', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Connection', 'IL · Telegram (Zapier)'], ['Chat', 'the project lead’s, from Projects'], ['Says', 'the project, the energization date, Closeout due and a link to the closeout form']], 'Tells the project lead the day closeout is due.'),
    node('c4', 'wait', 'Wait to day eight', 'Delay by Zapier', 'Timer', ['zapier'], 'Zapier · Delay by Zapier › Delay Until', [['Until', 'Reminder on, at 7:00 a.m. Eastern'], ['Reminder on', 'a formula: eight business days after energization'], ['Longest wait', 'one month']], 'Waits until two business days before closeout is due.'),
    node('c5', 'action', 'Check the project', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Record', [['Table', 'Projects'], ['Search Formula', 'RECORD_ID() is the trigger’s record'], ['Success when nothing is found', 'Off, so a deleted project halts the run'], ['Reads', 'Energization date and Closeout sent on, as they are now']], 'Reads the project again, as it is today.'),
    node('c6', 'action', 'Still open, same date', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Closeout sent on', 'does not exist'], ['Energization date', 'exactly matches the trigger’s']], 'Goes on only if the package has not gone and the date has not changed.'),
    node('c7', 'action', 'Remind the lead', 'Telegram', 'Warning', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'the project lead’s'], ['Says', 'closeout is due in two business days, the day, and a link to the closeout form']], 'Reminds the project lead while there is still time.'),
    node('c8', 'wait', 'Wait to the due day', 'Delay by Zapier', 'Timer', ['zapier'], 'Zapier · Delay by Zapier › Delay Until', [['Until', 'Closeout due, at 7:00 a.m. Eastern']], 'Waits until the morning closeout is due.'),
    node('c9', 'action', 'Check it again', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Record', [['Table', 'Projects'], ['Search Formula', 'RECORD_ID() is the trigger’s record'], ['Success when nothing is found', 'Off']], 'Reads the project again on the due day.'),
    node('c10', 'action', 'Still open on the day', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Closeout sent on', 'does not exist'], ['Energization date', 'exactly matches the trigger’s']], 'Goes on only if the package has still not gone.'),
    node('c11', 'end', 'Tell Projects group', 'Telegram', 'Warning', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Projects, the group of superintendents and project leads'], ['Says', 'closeout due today and not sent: the project, the project lead, the superintendent and a link']], 'Tells the superintendents and project leads that a closeout is due today and has not gone.'),
    node('d1', 'trigger', 'Package submitted', 'Airtable form', 'Package', ['airtable'], 'Zapier · Airtable › New Record', [['Zap', 'IL-03 · Closeout · send'], ['Table', 'Closeout packages, filled from the closeout form'], ['Filled by', 'the project lead'], ['Holds', 'the project; the package, one PDF under 25 MB with the as-builts, the relay and continuity test reports and the closed punch list; submitted by and on']], 'The project lead submits the package, and the send Zap starts.'),
    node('d2', 'approve', 'Superintendent checks', 'Human in the Loop', 'UserCheck', ['zapier'], 'Zapier · Human in the Loop › Request approval', [['Reviewer', 'the project’s superintendent, from Projects'], ['Shows', 'the project, the energization date, Closeout due and the package, on a Zapier review page'], ['Notifies', 'the superintendent by email, with the link'], ['Choices', 'Approved or Rejected'], ['No answer', 'nothing is sent']], 'Emails the superintendent the review page’s link. They check the package and approve it or send it back there.'),
    node('d3', 'action', 'Name the answer', 'Formatter', 'PencilSimple', ['zapier'], 'Zapier · Formatter by Zapier › Utilities › Lookup Table', [['Looks up', 'Human in the Loop’s result'], ['Approved', 'Approved'], ['Fallback', 'Sent back']], 'Turns the result into the word Superintendent review takes, which the Paths read too.'),
    node('d4', 'action', 'Record the answer', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Closeout packages'], ['Sets', 'Superintendent review = the lookup’s result, Approved or Sent back; Reviewed on = today']], 'Notes the answer on the package before anything is sent.'),
    node('d5', 'branch', 'Approved?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Zapier · Paths by Zapier', [['Approved', 'the lookup’s result is Approved'], ['Sent back', 'the lookup’s result is Sent back'], ['Rejoin', 'never; each path ends on its own']], 'Sends an approved package to the owner, and a sent-back one to the project lead.'),
    node('d6', 'action', 'Send the package', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'IL · Gmail (Zapier), signed in as closeout@ironlineutility.com'], ['To', 'the owner’s closeout contact, from Projects'], ['Cc', 'the superintendent and the project lead'], ['Attachments', 'the package, from Closeout packages'], ['Template', 'Closeout package: [the project]'], ['Holds', 'the project, the energization date, what the package holds, the superintendent’s name and the bid desk, (614) 555-0142'], ['Written by', 'a fixed template, not Claude']], 'Emails the owner the closeout package, in the superintendent’s name.'),
    node('d7', 'end', 'Mark it delivered', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Projects'], ['Record', 'the project, from the package’s link'], ['Sets', 'Closeout sent on = today']], 'Marks the closeout delivered, which stops the clock.'),
    node('d8', 'end', 'Tell the lead', 'Telegram', 'XCircle', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'the project lead’s'], ['Says', 'the superintendent sent the package back; they will say what to fix; submit it again on the form']], 'Tells the project lead to fix the package and submit it again.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'),
    edge('c6', 'c7'), edge('c7', 'c8'), edge('c8', 'c9'), edge('c9', 'c10'), edge('c10', 'c11'),
    edge('d1', 'd2'), edge('d2', 'd3'), edge('d3', 'd4'), edge('d4', 'd5'),
    edge('d5', 'd6', 'Approved'), edge('d5', 'd8', 'Sent back'),
    edge('d6', 'd7'),
  ],
}

const H01: Workflow = {
  code: 'IL-H01',
  title: 'Alert a team',
  platform: 'n8n',
  outcome: 'Every message n8n sends a team reads the same way and lands in the right chat.',
  trigger: 'Called by IL-01, when no one is on the rota and for bids due today, and by IL-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds the flow code, what happened and a link, never a near-miss report’s text or who filed it.',
    'Team picks the chat: Bid desk is the bid desk group, Safety is the safety director’s own chat, and Projects is the group of superintendents and project leads.',
    'A failure arrives with sound; anything else arrives with sound Monday to Friday, 6a–6p ET, the bid desk’s hours, and silently otherwise.',
    'IL-H02 is not set as IL-H01’s error workflow: a failure here would call IL-H02, which calls IL-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, team, urgent, link']], 'Another workflow hands over a message, the team it is for, and whether it is urgent.'),
    node('h2', 'action', 'Pick the chat', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Chat', 'Bid desk: the bid desk group; Safety: the safety director; Projects: the Projects group'], ['Adds', 'the flow code, and a link to the row or the failed run, when there is one']], 'Picks the team’s chat and puts the flow’s code and link under the message.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat ID', 'the one picked'], ['Disable Notification', 'on, unless urgent or Monday to Friday, 6a–6p ET']], 'Posts it in the team’s chat.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'IL-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed or halted run, on any of the three platforms, is logged and reaches the team that owns the flow with what its platform gives about it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A row holds the platform, the flow, the time and what its source gives, never a near-miss report’s text or who filed it. An n8n failure gives the failed step and a link to the run. A Make error route gives the step and the error. A Zapier Manager zap gives the zap and the time, and for an error its message, with no step or run link. The run itself holds the details, on its own platform.',
    'A failure is urgent: it arrives with sound. A halted Zapier run is an ordinary alert, sent as IL-H01 sends anything else.',
    'The alert goes to the team that owns the flow: IL-01 to the bid desk, IL-02 to the safety director, IL-03 to the Projects group.',
    'It never retries on its own. The team that owns the flow, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers both parts of IL-01 only, not IL-H01: IL-H01 is how this workflow alerts a team, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'IL-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'both parts of IL-01, as their error workflow'], ['Gives', 'the workflow, the failed step and a link to the run']], 'Starts whenever either part of IL-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /il/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/il/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, and two Zapier Manager zaps, on New Zap Error and New Halted Task'], ['Carries', 'Make: the step and the error; Zapier: the zap, the time, and an error’s message; and failed or halted']], 'Starts when a Make error route reports a failed step in IL-02, or a Zapier Manager zap reports a failed or halted run of IL-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, time, failed or halted, then what the source gives: step, error, zap, run link; a field the source does not give stays empty'], ['Team', 'Bid desk for IL-01, Safety for IL-02, Projects for IL-03'], ['Include Other Input Fields', 'Off']], 'Puts every kind of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert the team', 'IL-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'IL-H01 · Alert a team'], ['Team', 'the one that owns the flow'], ['Urgent', 'yes for a failure, no for a halted run']], 'Sends the team a Telegram message with the row’s fields: urgent for a failure, ordinary for a halt.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Ironline Utility Infrastructure · Build plan',
  description: 'A build plan for Ironline Utility Infrastructure, a self-perform electrical utility contractor in Columbus, Ohio: three flows on n8n, Make and Zapier, two helpers, a test matrix and a handover, planned before anything is built, with no step ever giving a switching, clearance or energized-work instruction.',
  kicker: 'BUILD PLAN · IRONLINE',
  heading: 'Every bid request, near-miss and closeout, planned before a single step is placed, and not one step that tells a crew how to switch.',
  lede:
    'Three flows and two helpers for Ironline Utility Infrastructure, the employee-owned, IBEW-signatory contractor at 2400 Corrugated Way, Columbus, with 340 people building transmission, distribution, substation and underground work across seven states since 1978. Bid requests to bids@ironlineutility.com run on n8n, near-miss reviews on Make and closeouts on Zapier. Airtable holds the bid requests, the rota, the team, the near-miss reports, the projects and the closeout packages, Telegram carries every alert, and Google Sheets holds the logs. The site promises that a superintendent, not a salesperson, responds within one business day, that every near-miss is reviewed company-wide within 48 hours, and that closeout is delivered within ten business days of energization; each flow keeps one of those promises. No step, and no Claude step, gives, drafts or changes a switching, clearance, outage or energized-work instruction, and no flow dispatches a crew: storm and emergency calls go to (614) 555-0199, answered 24/7 by people.',
  meta: [
    ['Client', 'Ironline Utility Infrastructure · Columbus, OH'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a request, a report or a closeout ends.',
    rail: [
      { heading: 'Why plan first', body: 'Ironline is a safety trade. Its crews work energized lines, and their switching and clearance steps come from a documented job brief, a superintendent and system operations, never from a message a flow sent. This page pins down, before n8n, Make or Zapier is opened, that no step crosses that line, and that every promise on the site has a step that keeps it.' },
      { heading: 'The safety rule', body: SAFE },
      { heading: 'Who says yes', body: YES },
    ],
    outcome: 'Every bid request is logged, assigned to a superintendent and acknowledged within minutes, every near-miss reaches the company as an approved bulletin within 48 hours, and every energized project’s closeout reaches the owner within ten business days, approved by its superintendent.',
    trigger: 'Ten entry points: an email to bids@, a business-morning check, a near-miss report filed, a twice-daily reminder, a bulletin approved, an energization date set, a closeout package submitted, IL-01 or IL-H02 calling IL-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Assigned and acknowledged', 'Reviewed company-wide', 'Closeout sent, or sent back to the lead'],
    outOfScope: [
      'Switching, clearance, outage and energized-work instructions: they come from the job brief, the superintendent and system operations, and no flow or Claude step gives, drafts or changes one',
      'Storm and emergency response: the 24/7 line, (614) 555-0199, answered by people; no flow dispatches a crew, and crews roll within six hours of a call by a person’s decision',
      'Outage requests and anything filed with a utility’s system operations, which people do by hand; no flow reaches a utility’s systems',
      'Pricing a bid, and the response itself, which the superintendent writes',
      'Changing a procedure after a near-miss: the safety director’s call, made through the job brief and system operations',
      'The Team knowledge bot and the two agents, Bid triage and Near-miss bulletin, planned on the AI agents page',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, three teams, and alerts that arrive at 6 a.m. When a run fails, its name has to say which flow and which part it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'IL-[number] · [Title]', examples: ['IL-01 · Bid request', 'IL-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Parts', pattern: 'IL-[number] · [Title] · [part]', examples: ['IL-01 · Bid request · one email', 'IL-02 · Near-miss review · send', 'IL-03 · Closeout · clock'], rule: 'A flow one workflow, scenario or Zap cannot hold is split into parts in one folder. The Automation page draws them as one flow.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Find the thread', 'Draft the bulletin', 'Send the package'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/il/[source]', examples: ['/il/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'IL · [Service] ([platform])', examples: ['IL · Gmail (n8n)', 'IL · Anthropic (Make)', 'IL · Airtable (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew. Gmail is signed in as bids@ on n8n, safety@ on Make and closeout@ on Zapier.' },
      { name: 'Choice fields', pattern: 'Plain words, one fixed list each', examples: ['New, Assigned, Responded, Not a bid', 'Filed, Awaiting approval, Approved, Sent', 'Awaiting, Approved, Sent back'], rule: 'Status on Bid requests, Status on Near-miss reports, and Superintendent review on Closeout packages, in that order. The flows, the templates and this page use the same words.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Bid requests', 'Near-miss reports', 'Closeout packages'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Six Airtable tables for the work, and two sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'Airtable holds the bid requests and the rota, the team, the near-miss reports, the projects and their closeout packages. The drawings stay in bids@. Google Sheets holds the logs.' },
      { heading: 'One vocabulary per field', body: 'Every choice field takes one fixed list, and the flows, the templates and this page use the same words for it.' },
      { heading: 'No fault, no names', body: 'Near-miss reports has no field for who was at fault. Filed by is optional and read by the safety director alone; no step and no bulletin uses it.' },
    ],
    tables: [
      { name: 'Bid requests', fields: ['Sender name', 'Sender email', 'Subject', 'Email', 'Attachment names', 'Thread ID', 'Gmail link', 'Received at', 'Respond by', 'Superintendent', 'Assigned by', 'Status', 'Follow-ups', 'Last email at'], note: 'One row per thread to bids@, added by IL-01. Email is the first email as written, and Follow-ups the later ones. Respond by is a formula, the end of the next business day. Assigned by is Rota or Bid desk. Status is New, Assigned, Responded or Not a bid; the superintendent sets Responded, or Not a bid for mail that was not a bid request.' },
      { name: 'Bid duty', fields: ['Week of', 'Superintendent', 'Superintendent chat ID'], note: 'One row per week, set by the bid desk each Friday. Week of is that week’s Monday, Superintendent links to Team, and the chat ID is a lookup.' },
      { name: 'Team', fields: ['Name', 'Email', 'Role', 'Telegram chat ID'], note: 'Everyone the flows name, one row per email. Role is Superintendent, Project lead, Bid desk or Safety director. Each starts Ironline’s Telegram bot once, so the flows can message them.' },
      { name: 'Near-miss reports', fields: ['Filed at', 'Job number', 'Discipline', 'State', 'What happened', 'What stopped it', 'The lesson', 'Filed by', 'Headline', 'Bulletin draft', 'Lesson draft', 'Touches procedure', 'Review due', 'Status', 'Sent at', 'Within 48 hours'], note: 'One row per report, filled from the near-miss form. Discipline is Transmission, Distribution, Substation, Underground, Storm response or Grid modernization; State is one of the seven Ironline works in. Filed by is optional. Claude writes Headline, Bulletin draft, Lesson draft and Touches procedure, Yes or No. Review due is Filed at plus 48 hours, and Within 48 hours a formula. Status is Filed, Awaiting approval, Approved or Sent, and only the safety director may set Approved.' },
      { name: 'Projects', fields: ['Project', 'Job number', 'Discipline', 'State', 'Superintendent', 'Project lead', 'Owner closeout contact', 'Energization date', 'Energization changed', 'Closeout due', 'Reminder on', 'Closeout sent on'], note: 'One row per job. Owner closeout contact is the email the owner names for closeout. Energization changed is a Last modified time field on Energization date. Closeout due is WORKDAY(Energization date, 10) and Reminder on WORKDAY(Energization date, 8), both skipping the holidays the office lists.' },
      { name: 'Closeout packages', fields: ['Project', 'Package', 'Submitted by', 'Submitted on', 'Superintendent review', 'Reviewed on'], note: 'One row per submission, from the closeout form. Package is one PDF under 25 MB. Superintendent review is Awaiting, Approved or Sent back, set only from the superintendent’s answer.' },
    ],
    stages: [
      ['Bid logged', 'A request from bids@ on its own row, Status New.'],
      ['Assigned', 'A superintendent on the request, from the rota or the bid desk.'],
      ['Responded', 'The superintendent has written to the sender.'],
      ['Awaiting approval', 'A near-miss with Claude’s draft, waiting for the safety director.'],
      ['Reviewed company-wide', 'An approved bulletin emailed to the company and posted to the crews.'],
      ['Closeout delivered', 'A package the superintendent approved, sent to the owner.'],
    ],
    exitStages: [
      ['Not a bid', 'An email to bids@ that was not a bid request, closed by the superintendent or the bid desk.'],
      ['Sent back', 'A closeout package the superintendent returned; the lead submits a new one.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed or halted run, from n8n, Make or Zapier, with no near-miss text and no names'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [
      { heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a Gmail Trigger on n8n, Airtable’s Watch Records into Make scenarios, Airtable triggers on Zapier. Failures from all three end in one sheet.' },
      { heading: 'The two phone numbers', body: 'Call the bid desk dials (614) 555-0142, and the 24/7 line is (614) 555-0199. People answer both, and no flow starts from a call.' },
    ],
    rows: [
      ['An email to bids@ from outside Ironline', 'Gmail Trigger, every minute', 'IL-01'],
      ['6 a.m. Eastern, Monday to Friday', 'Schedule Trigger', 'IL-01'],
      ['A near-miss report filed on its form', 'Airtable Watch Records, every 15 minutes', 'IL-02'],
      ['6 a.m. and 2 p.m. Eastern, every day', 'Scenario schedule', 'IL-02'],
      ['A bulletin set to Approved', 'Airtable Watch Records, every 15 minutes', 'IL-02'],
      ['A project’s Energization date set', 'Airtable New or Updated Record', 'IL-03'],
      ['A closeout package submitted on its form', 'Airtable New Record', 'IL-03'],
      ['IL-01 or IL-H02', 'Execute Sub-workflow', 'IL-H01'],
      ['An n8n run fails', 'Error Trigger', 'IL-H02'],
      ['A Make or Zapier run fails or halts', 'Webhook POST /il/failed', 'IL-H02'],
    ],
  },
  workflows: [IL01, IL02, IL03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message people with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test senders, test reports and a test project before anything reaches a real owner or crew.' },
      { heading: 'Safety rows', body: 'Rows t07 and t13 to t15 prove that no step gives a switching, clearance or energized-work instruction, that emergencies go to the 24/7 line, and that no name or blame reaches a bulletin. The safety director signs them off before go-live.' },
      { heading: 'Test data', body: 'Test senders and test crew members have made-up names. Times and dates in these rows are illustrative.' },
    ],
    rows: [
      { id: 't01', workflow: 'IL-01', branch: 'New, on the rota', input: 'Test Sender A emails bids@ a scope letter and a drawings list: “138 kV rebuild, about 12 miles, bids due in three weeks.”', expected: 'A row in Bid requests, Status Assigned, Assigned by Rota; the superintendent on duty messaged on Telegram; then one acknowledgement on the thread with the one-business-day line and (614) 555-0199; Respond by the end of the next business day' },
      { id: 't02', workflow: 'IL-01', branch: 'Two-line description', input: 'Test Sender B, no attachments: “We need 40 distribution poles replaced. Can you bid it?”', expected: 'The same as t01, with Attachment names empty' },
      { id: 't03', workflow: 'IL-01', branch: 'No one on the rota', input: 'A test email in a week with no Bid duty row', expected: 'The row with Status New; an urgent message in the bid desk group with a link to it; the acknowledgement still sent' },
      { id: 't04', workflow: 'IL-01', branch: 'Follow-up', input: 'Test Sender A replies on t01’s thread with a revised drawing', expected: 'No new row; the email added to Follow-ups; the superintendent messaged; no second acknowledgement' },
      { id: 't05', workflow: 'IL-01', branch: 'Follow-up, unassigned', input: 'A reply on t03’s thread before the bid desk assigns anyone', expected: 'The follow-up added; the message goes to the bid desk group' },
      { id: 't06', workflow: 'IL-01', branch: 'Two in one poll', input: 'Test Senders C and D email bids@ within the same minute', expected: 'Two rows, each assigned once and acknowledged once' },
      { id: 't07', workflow: 'IL-01', branch: 'Emergency by email', input: 'Test Sender E: “Our feeder is down after the storm, send crews now.”', expected: 'Logged and assigned like any request; the acknowledgement points to (614) 555-0199, answered 24/7 by people; no step reads the email for urgency, promises a crew or a time, or dispatches anyone' },
      { id: 't08', workflow: 'IL-01', branch: 'Ironline’s own mail', input: 'The superintendent replies to t01 from bids@', expected: 'No run starts' },
      { id: 't09', workflow: 'IL-01', branch: 'Due today', input: 'The 6 a.m. check runs with t03’s request still New on its Respond by day', expected: 'A message in the bid desk group with the sender, the subject, Respond by and a link' },
      { id: 't10', workflow: 'IL-01', branch: 'Nothing due', input: 'The 6 a.m. check runs with every request Responded', expected: 'The run ends at Nothing due; no message' },
      { id: 't11', workflow: 'IL-01', branch: 'Email fails', input: 'A test email with the Gmail connection in n8n revoked before the reply', expected: 'The row logged and the superintendent messaged; after three tries the run fails; a row in Failed runs with the step and a link to the run; an urgent alert in the bid desk group' },
      { id: 't12', workflow: 'IL-02', branch: 'Approved in time', input: 'A test report, Distribution, Ohio: “A tag line slipped while setting a crossarm; the spotter called stop before the load swung. Lesson: check the tag line before every pick.”', expected: 'A draft with a headline, roles only; Touches procedure No; Awaiting approval; the safety director messaged; once approved, the bulletin emailed to the company list and posted to the crews, both with the fixed line; Status Sent; Within 48 hours yes' },
      { id: 't13', workflow: 'IL-02', branch: 'Touches procedure', input: 'A test report about a crew that began work before a clearance was confirmed', expected: 'Touches procedure Yes; Lesson draft empty; no switching, clearance or energized-work step anywhere in the draft; the director writes the lesson; the bulletin carries the fixed line' },
      { id: 't14', workflow: 'IL-02', branch: 'Names in the report', input: 'The t12 report with the lineman and the foreman named, and Filed by set to Test Lineman F', expected: 'The draft says a lineman and the foreman; the run shows Claude’s input held no Filed by; the sent bulletin names no one' },
      { id: 't15', workflow: 'IL-02', branch: 'Blame in the report', input: 'A test report that says it was one named crew member’s fault', expected: 'The draft states what happened, with no name and no fault' },
      { id: 't16', workflow: 'IL-02', branch: 'Reminded', input: 'A report left Awaiting approval past 2 p.m.', expected: 'One Telegram message to the safety director listing it with Review due; another at 6 a.m. while it waits' },
      { id: 't17', workflow: 'IL-02', branch: 'Nothing waiting', input: 'The 6 a.m. reminder runs with no report Awaiting approval', expected: 'The filter stops the run; no message' },
      { id: 't18', workflow: 'IL-02', branch: 'Edited after sending', input: 'The safety director edits t12’s row after it was sent', expected: 'Nothing sent again: the formula needs Sent at empty' },
      { id: 't19', workflow: 'IL-02', branch: 'Claude fails', input: 'A test report with the Anthropic connection in Make revoked', expected: 'The error route posts the step and the error to /il/failed; a row in Failed runs and an urgent alert to the safety director; the report saved with an empty draft and Touches procedure Yes; the director writes the bulletin' },
      { id: 't20', workflow: 'IL-02', branch: 'Over 48 hours', input: 'A test report approved 50 hours after it was filed', expected: 'The bulletin sent; Within 48 hours no; the reminders show it waiting until then' },
      { id: 't21', workflow: 'IL-03', branch: 'Approved, on time', input: 'A test project energized on a Monday; the package submitted on day five; the superintendent approves', expected: 'The lead told at once with Closeout due; the package emailed to the test owner contact with the PDF, copied to the superintendent and the lead; Closeout sent on set; at day eight no reminder' },
      { id: 't22', workflow: 'IL-03', branch: 'Reminded, then due', input: 'A test project with no package by day eight, nor by the due day', expected: 'A reminder to the lead on day eight; on the due day an alert in the Projects group' },
      { id: 't23', workflow: 'IL-03', branch: 'Date corrected', input: 'The lead corrects the Energization date a day after setting it', expected: 'A new clock from the new date; the first clock stops at its day-eight filter; one reminder only' },
      { id: 't24', workflow: 'IL-03', branch: 'Date cleared', input: 'The lead clears the Energization date', expected: 'Date set only stops the Zap; no message' },
      { id: 't25', workflow: 'IL-03', branch: 'Sent back', input: 'The superintendent rejects a test package, then the lead submits a new one', expected: 'Superintendent review Sent back; the lead told on Telegram; nothing to the owner; the new submission starts its own review' },
      { id: 't26', workflow: 'IL-03', branch: 'Link only opened', input: 'Open the review link from the email and close it without choosing', expected: 'Nothing recorded; still Awaiting; nothing sent; the due-day alert still comes' },
      { id: 't27', workflow: 'IL-03', branch: 'Project deleted', input: 'A test project deleted before day eight', expected: 'Check the project halts the run; the New Halted Task zap posts it to /il/failed a few minutes later; a row in Failed runs with the zap and the time; an ordinary alert in the Projects group' },
      { id: 't28', workflow: 'IL-03', branch: 'Email fails', input: 'An approved test package with the Gmail connection in Zapier revoked', expected: 'Superintendent review Approved; Closeout sent on empty; the New Zap Error zap posts to /il/failed; a row with the zap, the time and the error’s message, and an urgent alert in the Projects group' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order of their codes: bids on n8n, near-misses on Make, then closeouts on Zapier. The safety review comes last, before anything is turned on.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Airtable tables Bid requests, Bid duty, Team, Near-miss reports, Projects and Closeout packages', 'Create the Sheets tabs Failed runs and Test matrix', 'Add the connections on each platform: IL · Gmail, IL · Airtable, IL · Telegram, IL · Anthropic', 'Create the Telegram bid desk and Projects groups and the Ironline crews channel, and have everyone in Team start the bot', 'Build IL-H01 in n8n, then IL-H02 with both parts of IL-01 (not IL-H01) as the covered error workflows'] },
      { name: '2 · Bids on n8n', tasks: ['Fill Team and the first weeks of the Bid duty rota', 'Add the Respond by formula with the bid desk’s holidays', 'Write the We have your bid request template, with both phone numbers', 'Build IL-01’s two parts, inbox and one email', 'Run tests t01–t11'] },
      { name: '3 · Near-misses on Make', tasks: ['Build the near-miss form with no field for fault, and set Status so only the safety director can change it', 'Write Claude’s instructions and the bulletin template with the fixed line, and have the safety director read both', 'Build the three scenarios, draft, remind and send, every writing or sending module with an error route to /il/failed', 'Run tests t12–t20'] },
      { name: '4 · Closeouts on Zapier', tasks: ['Add Closeout due and Reminder on to Projects, and build the closeout form', 'Build the clock and send Zaps, with Name the answer and Record the answer before the Paths', 'Add the two Zapier Manager zaps, New Zap Error and New Halted Task, that post to /il/failed', 'Run tests t21–t28'] },
      { name: '5 · Safety review and hand over', tasks: ['Review safety with the safety director: read every template and Claude’s instructions, check that no step gives, drafts or changes a switching, clearance, outage or energized-work instruction, and sign off t07 and t13–t15', 'Run the whole matrix again', 'Walk the bid desk, the safety director, the superintendents and the project leads through the handover page, and turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Ironline keeps.',
    rail: [{ heading: 'Written for the bid desk, the safety director and the superintendents', body: 'One page, no jargon, for the people who answer bids, review near-misses and close out jobs. It lives next to the flows.' }],
    does: [
      'Logs every email to bids@, gives it to the superintendent on bid duty, and acknowledges it with the one-business-day promise and the 24/7 line.',
      'Tells the bid desk each business morning which requests are due that day and still open.',
      'Turns every near-miss report into a draft bulletin with no names, reminds the safety director until it is approved, then sends it company-wide.',
      'Starts a closeout clock at energization, reminds the project lead, and sends the package to the owner once the superintendent approves it.',
    ],
    breaks: [
      'Adding a step, a template line or a Claude instruction that tells anyone how to switch, clear, take an outage or work a line energized.',
      'Adding a field to Near-miss reports for who was at fault, or letting Claude read Filed by.',
      'Giving anyone but the safety director permission to set a report Approved.',
      'Renaming a field in any of the six tables, or changing the Status or Superintendent review choices.',
      'Letting the Bid duty rota run out of weeks, which sends every request to the bid desk by hand.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach the team that owns the flow on Telegram, with what each platform gives: the step and a link to the run from n8n, the step and the error from Make, the zap and the time from Zapier.',
    logs: 'Every failed or halted run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message. Every bid request keeps who it was assigned to and when it is due, every near-miss when it was filed and sent, and every closeout package who reviewed it and when.',
  },
  footer: { note: 'A worked example. Ironline Utility Infrastructure is a fictional contractor, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
