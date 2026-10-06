/**
 * Harbor & Pine Moving Co.’s Build plan case page (spec 2026-10-05 per-site
 * pages): the blueprint behind the three flows on its Automation page, HP-01
 * on n8n, HP-02 on Make and HP-03 on Zapier, with the helpers, data, tests and
 * handover they need. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/harbor-and-pine-moving/build-plan.html. Only
 * type imports, so Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The site’s pricing promise, first in the estimate flow’s watch-outs and on the start rail. */
const PRICING = 'The pricing rule: the site promises “Same-day written reply, no automated pricing bots.” Claude drafts a written range for the coordinators only. It is posted in their Telegram group headed Claude’s draft, for coordinators only, and no customer ever gets a range from Claude: a coordinator approves it, writes their own, or books a walkthrough, and only then does the customer hear back.'

/** Who says yes, as on the Automation page. */
const YES = 'A coordinator approves any range Claude drafts before it reaches a customer’s inbox, and checks every certificate of insurance before it reaches a building. The move-day message is a fixed template and sends on its own.'

const HP01: Workflow = {
  code: 'HP-01',
  title: 'Moving estimate',
  platform: 'n8n',
  outcome: 'Every estimate request gets a priced reply the same working day, or a walkthrough when the move needs a set of eyes, and nothing goes out until a coordinator says yes.',
  trigger: 'n8n’s Webhook catches the estimate form when someone sends its third step.',
  exits: ['Range sent, deal at Estimate sent', 'Walkthrough invited', 'No rate card, with the coordinators'],
  watch: [
    PRICING,
    'A coordinator reads every request and replies the same working day, as the site says. A request sent in office hours, Mon–Fri 7am–6pm or Sat 8am–2pm, is answered that day; one sent after hours or on a Sunday waits in the group for the next working morning. Until it is answered, its deal sits at New request on the HubSpot board, and the coordinators check that column before they close each day.',
    'Approve? is n8n’s Telegram Send message and wait for response, with a Custom Form. Limit Wait Time is off, so n8n keeps the run, waiting at the gate with its data, until a coordinator sends the form. The button in the message only opens the form: a link preview or a stray tap records nothing, and only the form’s submit moves the run on. Coordinator adjusts works the same way.',
    'Read the rate card has Always Output Data on, so an empty or missing Rate card tab still hands an item on instead of ending the run quietly. Rate card read? then sends it to No rate card, which stops the run with an error; HP-H02 tells the coordinators, who answer that request by hand from its deal.',
    'Save the contact is a Create or update matched on email, so a second request from the same person updates one contact and opens a second deal on it. There is no search, so nothing can come back empty there.',
    'Save the contact and Open the deal retry three times. If either still fails, the run fails and HP-H02 alerts the coordinators with a link to it: HP-01 keeps its executions, which hold contact and move details only, so the coordinator reads the request there and answers it by hand.',
    'Price the move reads only the form’s answers and the rate card, the coordinators’ own sheet of crew, truck, mileage, packing and specialty rates, kept by Marisol. Its range is only as good as that sheet, which is why a coordinator reads every one.',
    'Both emails are fixed templates sent from hello@harborandpine.example in the coordinator’s name, so a reply reaches the coordinators’ shared inbox. Send the estimate fills in the range a coordinator approved or wrote, and its what-it-covers line comes from the form, or from the coordinator’s own line when they edited it. Claude’s line on why and its flags stay in the group. Invite a walkthrough holds no range at all.',
    'The On-site walkthrough and Video walkthrough event types in Cal.com are the coordinators’ own. A coordinator picks On site only within 20 miles of Bellhaven, where the walkthrough is free, as the site says, and By video further out. After a walkthrough the coordinator writes the written estimate by hand, from what they counted.',
    'If Send the estimate or Invite a walkthrough fails, HP-H02 alerts the coordinators with a link to the run; the coordinator sends that reply by hand from Gmail and moves the deal themselves.',
  ],
  nodes: [
    node('a1', 'trigger', 'Estimate form', 'Webhook', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/hp/estimate'], ['Method', 'POST'], ['Respond', 'Immediately']], 'Someone sends the estimate form’s third step, and the three steps arrive together: moving from and to, the target moving date, the home or office size, the service, and the name, email and phone.'),
    node('a2', 'action', 'Tidy the request', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Email', 'trimmed and lowercased'], ['Phone', 'digits only'], ['Keeps', 'every answer from the form']], 'Puts the email and phone into one shape, so a second request finds the same contact.'),
    node('a3', 'action', 'Save the contact', 'HubSpot', 'Database', ['hubspot'], 'n8n · HubSpot › Create or update contact', [['Connection', 'HP · HubSpot (n8n)'], ['Match on', 'Email'], ['Sets', 'First name, Last name, Phone'], ['Retry on fail', 'On, 3 tries']], 'Adds the person to HubSpot, or updates them if this email has asked before.'),
    node('a4', 'action', 'Open the deal', 'HubSpot', 'FlagCheckered', ['hubspot'], 'n8n · HubSpot › Create deal', [['Pipeline', 'Moves'], ['Stage', 'New request'], ['Sets', 'Moving from, Moving to, Target moving date, Home or office size, Service'], ['Associated with', 'the contact'], ['Retry on fail', 'On, 3 tries']], 'Opens the request as a deal on the sales board, before Claude or anyone else touches it.'),
    node('a5', 'action', 'Read the rate card', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Get rows', [['Tab', 'Rate card'], ['Always Output Data', 'On, so an empty tab goes on to the check instead of ending the run quietly']], 'Reads the coordinators’ rate card, one item per rate.'),
    node('a6', 'action', 'Gather the rates', 'Aggregate', 'Stack', ['n8n'], 'n8n · Aggregate', [['Aggregate', 'All Item Data (Into a Single List)'], ['Put output in field', 'rates']], 'Gathers the rates into one item, so Claude runs once with the whole card.'),
    node('a7', 'branch', 'Rate card read?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Rates found', 'the first rate in the list has a Rate that is not empty'], ['Empty', 'otherwise']], 'Sends the request on to Claude only when the rate card was read.'),
    node('a8', 'end', 'No rate card', 'Stop and Error', 'XCircle', ['n8n'], 'n8n · Stop and Error', [['Error message', 'The rate card is empty or could not be read'], ['Then', 'HP-H02 logs it and alerts the coordinators, with a link to this run']], 'Fails the run loudly, so a request is never priced from nothing and never dropped in silence.'),
    node('a9', 'ai', 'Price the move', 'Claude', 'Sparkle', ['claude'], 'n8n · Basic LLM Chain + Anthropic Chat Model', [['Connection', 'HP · Anthropic (n8n)'], ['Model', 'Claude Sonnet 4.6'], ['Temperature', '0'], ['Reads', 'the form’s answers, from Tidy the request, and the rates'], ['Returns', 'JSON: low, high, why, flags'], ['Flags', 'a specialty item, the ferry to Cormorant Isle, beyond 20 miles of Bellhaven, long distance (runs leave Tuesdays and Fridays)'], ['Goes to', 'the coordinators only']], 'Claude drafts a written range, a low and a high figure, with a line on why and anything that may need a set of eyes.'),
    node('a10', 'approve', 'Approve?', 'Telegram', 'UserCheck', ['telegram'], 'n8n · Telegram › Send message and wait for response', [['Connection', 'HP · Telegram (n8n)'], ['Chat', 'Coordinators, the group'], ['Message', 'the request, then Claude’s range, line and flags, headed Claude’s draft, for coordinators only'], ['Response Type', 'Custom Form'], ['Form', 'Answer: Approve, Edit or Walkthrough; Coordinator: who is taking it; Walkthrough: On site or By video'], ['Limit Wait Time', 'Off: n8n keeps the run waiting until the form is sent']], 'Posts the request and Claude’s draft in the coordinators’ group with one button that opens the form. The run waits here, and only the form’s submit moves it on.'),
    node('a11', 'branch', 'Which answer?', 'Switch', 'ArrowsSplit', ['n8n'], 'n8n · Switch', [['Approve', 'Answer is Approve'], ['Edit', 'Answer is Edit'], ['Walkthrough', 'Answer is Walkthrough']], 'Picks the reply from the coordinator’s answer.'),
    node('a12', 'wait', 'Coordinator adjusts', 'Telegram', 'PencilSimple', ['telegram'], 'n8n · Telegram › Send message and wait for response', [['Chat', 'Coordinators, the group'], ['Message', 'the coordinator’s name, and Write the range as it should read'], ['Response Type', 'Custom Form'], ['Form', 'Low, High, and What it covers, one line'], ['Limit Wait Time', 'Off']], 'Asks the coordinator for the range they stand behind, and waits for it.'),
    node('a13', 'action', 'Send the estimate', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'HP · Gmail (n8n), signed in as hello@harborandpine.example'], ['To', 'the customer'], ['Template', 'Your written estimate range'], ['Holds', 'the range the coordinator approved or wrote; what it covers; the coordinator’s name and (555) 014-2200; the estimate holds unless the inventory changes; no deposit to hold a date; how to book'], ['Written by', 'a fixed template; the range is the coordinator’s, approved from Claude’s draft or their own']], 'Emails the customer the written range, in the coordinator’s name.'),
    node('a14', 'action', 'Invite a walkthrough', 'Gmail + Cal.com', 'CalendarCheck', ['gmail', 'cal-com'], 'n8n · Gmail › Send message', [['Connection', 'HP · Gmail (n8n), signed in as hello@harborandpine.example'], ['Template', 'Let’s walk the move first'], ['Link', 'the On-site walkthrough or Video walkthrough page in Cal.com, from the form’s Walkthrough answer'], ['Holds', 'why a walkthrough helps, that on site is free within 20 miles of Bellhaven, the coordinator’s name and (555) 014-2200'], ['Written by', 'a fixed template, not Claude']], 'Emails the customer a link to pick a walkthrough time, on site or over video.'),
    node('a15', 'action', 'Record the deal', 'HubSpot', 'FlagCheckered', ['hubspot'], 'n8n · HubSpot › Update deal', [['Deal', 'the one Open the deal made'], ['Stage', 'Estimate sent, or Walkthrough'], ['Sets', 'Range low, Range high, Walkthrough, Deal owner = the coordinator who answered']], 'Moves the deal on, with the range and its named coordinator.'),
    node('a16', 'helper', 'Tell the team', 'HP-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'HP-H01 · Alert the coordinators'], ['Says', 'who took it, what went out, and a link to the deal'], ['Wait for it', 'No']], 'Tells the coordinators’ group the request is answered, and by whom.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'), edge('a5', 'a6'), edge('a6', 'a7'),
    edge('a7', 'a9', 'Rates found'), edge('a7', 'a8', 'Empty'),
    edge('a9', 'a10'), edge('a10', 'a11'),
    edge('a11', 'a13', 'Approve'), edge('a11', 'a12', 'Edit'), edge('a11', 'a14', 'Walkthrough'),
    edge('a12', 'a13'), edge('a13', 'a15'), edge('a14', 'a15'), edge('a15', 'a16'),
  ],
}

const HP02: Workflow = {
  code: 'HP-02',
  title: 'Move day',
  platform: 'make',
  outcome: 'The day before every booked move, the customer gets a fixed message with the crew’s arrival time and the lead mover’s name and number, and a move with no crew set yet goes to its coordinator instead.',
  trigger: 'Make’s scheduler starts HP-02 · Move day every day at 1:00 pm, Bellhaven time.',
  exits: ['Message sent', 'With the coordinator', 'Quiet day'],
  watch: [
    'The move-day message is a fixed template, so it sends on its own and needs no one’s yes. It holds the crew’s arrival time, the lead mover’s name and number and the coordinator’s name, and nothing priced: no range or total.',
    'Find tomorrow’s moves is a Make an API call module, not a search, so it returns one bundle with the list even when it is empty, and Any moves? routes on the list’s length. An empty list goes to Quiet day, so the coordinators see that the run happened and found nothing.',
    'Mark it sent writes Day-before sent before the email goes, and the formula skips any move with it set, so a re-run never sends the same move twice.',
    'A move missing its crew at 1:00 pm, or booked for tomorrow after the run, is the coordinator’s: once the row is complete, they press Run once in Make, and only moves still without a message are found. The Automation page draws that as the arc after a re-run.',
    'The office is closed on Sundays, so the coordinators complete Monday’s moves, crew time and lead mover included, before they close at 2:00 pm on Saturday. Sunday’s run then finds them complete and has nothing to ask.',
    'Lead mover is a link to Team, and Lead mover phone is a lookup from it, so changing the lead mover changes the number in the same edit.',
    'Long distance is ticked by the coordinator at booking, with the Transit window agreed then. Runs leave Bellhaven on Tuesdays and Fridays with two to four days in transit, as the site says. The template adds the window only when Long distance is ticked, with Make’s if function.',
    'Every module that writes or sends has an error route that posts the step and the error, never the customer’s details, to /hp/failed, and ends in Break, with incomplete executions stored, so Make keeps the run to retry. If the email still fails, the coordinator sends that message by hand.',
    'No flow books a crew, a ferry or a crane. The coordinators plan those by hand before the date.',
  ],
  nodes: [
    node('b1', 'trigger', 'Each day, 1 pm', 'Schedule', 'Clock', ['make'], 'Make · Scenario schedule', [['Scenario', 'HP-02 · Move day'], ['Runs', 'Every day, at 1:00 pm Bellhaven time']], 'Each day at 1:00 pm the scenario wakes.'),
    node('b2', 'action', 'Find tomorrow’s moves', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Connection', 'HP · Airtable (Make)'], ['Call', 'GET /v0/{base}/Moves'], ['Formula', 'Move date is tomorrow, Status is Booked, Day-before sent is empty'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Lists every booked move for tomorrow that has had no message yet.'),
    node('b3', 'branch', 'Any moves?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Moves', 'the list’s length is 1 or more'], ['None', 'the list’s length is 0']], 'Routes on the list’s length.'),
    node('b4', 'end', 'Quiet day', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Coordinators, the group'], ['Says', 'no move tomorrow, so no message went out']], 'Tells the coordinators the run found no move for tomorrow.'),
    node('b5', 'action', 'For each move', 'Iterator', 'ArrowsClockwise', ['make'], 'Make · Flow Control › Iterator', [['Loops over', 'the moves found']], 'Runs the steps after it once for each move.'),
    node('b6', 'branch', 'Crew set?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Crew set', 'Crew arrival, Lead mover and Email are all filled'], ['Not set', 'any of them is empty']], 'Sends a complete move on to be messaged, and one missing anything to its coordinator.'),
    node('b7', 'action', 'Mark it sent', 'Airtable', 'Database', ['airtable'], 'Make · Airtable › Update a record', [['Table', 'Moves'], ['Sets', 'Day-before sent = now']], 'Notes the message on the move before it goes, so it never goes twice.'),
    node('b8', 'end', 'Move-day message', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'HP · Gmail (Make), signed in as hello@harborandpine.example'], ['To', 'the customer’s email, from Moves'], ['Template', 'Tomorrow’s move'], ['Holds', 'the crew’s arrival time; the lead mover’s name and number; the coordinator’s name and (555) 014-2200; parking and a lift booked; the transit window, for a long-distance move'], ['Written by', 'a fixed template, not Claude']], 'Emails the customer what to expect tomorrow, and who to call.'),
    node('b9', 'end', 'Ask the coordinator', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Coordinators, the group'], ['Says', 'the move, its coordinator, and what is missing: crew arrival, lead mover or email']], 'Asks the move’s coordinator to fill in what is missing and run the scenario once more.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'),
    edge('b3', 'b5', 'Moves'), edge('b3', 'b4', 'None'),
    edge('b5', 'b6'),
    edge('b6', 'b7', 'Crew set'), edge('b6', 'b9', 'Not set'),
    edge('b7', 'b8'),
  ],
}

const HP03: Workflow = {
  code: 'HP-03',
  title: 'Insurance certificate',
  platform: 'zapier',
  outcome: 'Every building that asks for a certificate of insurance gets it from Harbor & Pine before the move, and only after the move’s coordinator has checked it against what the building asked for.',
  trigger: 'Zapier’s Airtable New or Updated Record hears Ready changed on a COI request, a field that changes only when Ready to check does.',
  exits: ['Sent to the building', 'Rejected, nothing sent', 'Incomplete or past, nothing sent'],
  watch: [
    'The certificate itself comes from Harbor & Pine’s insurer. A coordinator asks for it by email or phone, with the holder and wording the building gave, and attaches it to the row by hand. No flow reaches the insurer or a building’s own system: if a building wants the certificate in a portal, the coordinator uploads it there by hand.',
    'The Zap starts on Ready changed, a Last modified time field that watches Ready to check only, so a row caught half-filled never starts it. Complete and ahead then checks the row really is complete, still Logged, and that its move is still to come.',
    'Human in the Loop notifies the coordinator by email, with the link to its Zapier review page, and records Approved or Rejected. Opening the link, or a mail scanner opening it, records nothing: only the coordinator’s choice on the page does. With no answer, the Zap goes no further and nothing is sent.',
    'Name the answer and Log the answer come before Approved only, so a rejection is written on the row too. Name the answer is a Formatter Lookup Table: Status only ever holds Approved or Rejected, and anything else counts as Rejected. Approved only reads the same result, so nothing reaches a building unless the coordinator approved it. There are no paths, so nothing ever has to rejoin.',
    'A Zap has one trigger. A rejected certificate needs no message: the coordinator who rejected it asks the insurer for a corrected one, logs it again as a new request, and that starts the Zap afresh; the rejected row stays as it was. The Waiting view in COI requests lists every request still Logged or Rejected.',
    'The email goes from hello@harborandpine.example and copies the coordinator, so a building manager’s reply reaches the coordinators’ inbox. It is a fixed template, and the certificate is attached exactly as the insurer issued it.',
    'Move date, Coordinator and Coordinator email are lookups through the row’s Move, so the Zap reads them straight from the request: Zapier’s Airtable trigger hands over a linked Move only as a record ID. Coordinator email is a lookup of Moves’ own Coordinator email, itself a lookup from Team.',
    'A failed step is caught by a Zapier Manager zap on New Zap Error, which posts the zap, the time and the error’s message to /hp/failed, and the coordinators get an urgent alert. A halted run is caught by a second Zapier Manager zap, on New Halted Task, with the zap and the time, as an ordinary alert. A Zap has one trigger, so errors and halts each have their own Zapier Manager zap. If the email fails after the answer is logged, the request stays Approved and not Sent, and the coordinator sends it by hand.',
  ],
  nodes: [
    node('c1', 'trigger', 'COI request logged', 'Airtable', 'Table', ['airtable'], 'Zapier · Airtable › New or Updated Record', [['Zap', 'HP-03 · Insurance certificate'], ['Table', 'COI requests'], ['Last modified field', 'Ready changed, which watches Ready to check only']], 'A coordinator ticks Ready to check on a logged request, and the Zap starts with the row.'),
    node('c2', 'action', 'Complete and ahead', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Ready to check', 'is true'], ['Certificate', 'exists'], ['Manager email', 'exists'], ['Status', 'exactly matches Logged'], ['Move date', '(Date/time) after today, the lookup through Move']], 'Goes on only for a complete request, still Logged, whose move is still to come.'),
    node('c3', 'approve', 'Coordinator checks', 'Human in the Loop', 'UserCheck', ['zapier'], 'Zapier · Human in the Loop › Request approval', [['Reviewer', 'the move’s coordinator: Coordinator email, the lookup through Move'], ['Shows', 'the certificate beside the holder and wording the building asked for, on a Zapier review page'], ['Notifies', 'the coordinator by email, with the link'], ['Choices', 'Approved or Rejected'], ['No answer', 'nothing is sent']], 'Emails the coordinator the review page’s link. They check the certificate against what the building asked for, and approve or reject it there.'),
    node('c4', 'action', 'Name the answer', 'Formatter', 'PencilSimple', ['zapier'], 'Zapier · Formatter by Zapier › Utilities › Lookup Table', [['Looks up', 'Human in the Loop’s result'], ['Approved', 'Approved'], ['Fallback', 'Rejected']], 'Turns the result into the word Status takes, which Approved only reads too.'),
    node('c5', 'action', 'Log the answer', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'COI requests'], ['Sets', 'Status = the lookup’s result, Approved or Rejected; Checked by = the coordinator; Checked on = today']], 'Notes the answer on the request before anything is sent.'),
    node('c6', 'action', 'Approved only', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['The lookup’s result', 'exactly matches Approved']], 'Goes on only with the coordinator’s approval. A rejected certificate stops here, and nothing is sent.'),
    node('c7', 'action', 'Send to the building', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'HP · Gmail (Zapier), signed in as hello@harborandpine.example'], ['To', 'the manager’s email'], ['Cc', 'Coordinator email, the lookup through Move'], ['Attachments', 'the certificate, from the row'], ['Template', 'Certificate of insurance for your building'], ['Holds', 'the move date and the coordinator’s name, from the Move date and Coordinator lookups; the address and unit; (555) 014-2200'], ['Written by', 'a fixed template, not Claude']], 'Emails building management the checked certificate.'),
    node('c8', 'end', 'Mark it filed', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'COI requests'], ['Sets', 'Status = Sent, Sent on = today']], 'Marks the request Sent, so the coordinator sees the building has it.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'),
    edge('c6', 'c7'), edge('c7', 'c8'),
  ],
}

const H01: Workflow = {
  code: 'HP-H01',
  title: 'Alert the coordinators',
  platform: 'n8n',
  outcome: 'Every message n8n sends the coordinators reads the same way and lands in their Telegram group.',
  trigger: 'Called by HP-01, once a request is answered, and by HP-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds a name, a town, the coordinator, what went out and a link, never a range Claude drafted that no one has approved.',
    'A failure arrives with sound; anything else arrives with sound in office hours, Mon–Fri 7am–6pm and Sat 8am–2pm, and silently otherwise.',
    'HP-H02 is not set as HP-H01’s error workflow: a failure here would call HP-H02, which calls HP-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, urgent, link']], 'Another workflow hands over a message, and says whether it is urgent.'),
    node('h2', 'action', 'Add the link', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code, and a link to the deal or the failed run, when there is one']], 'Puts the flow’s code under the message, with a link to the deal or the failed run.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Coordinators, the group'], ['Disable notification', 'on, unless urgent or in office hours']], 'Posts it in the coordinators’ group.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'HP-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed or halted run, on any of the three platforms, is logged and reaches the coordinators with what its platform gives about it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A row holds the platform, the flow, the time and what its source gives, never the customer’s details. An n8n failure gives the failed step and a link to the run. A Make error route gives the step and the error. A Zapier Manager zap gives the zap and the time, and for an error its message, with no step or run link. The run itself holds the customer’s details, on its own platform.',
    'A failure is urgent: it arrives with sound. A halted Zapier run is an ordinary alert, sent as HP-H01 sends anything else.',
    'It never retries on its own. A coordinator, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'It is the error workflow for HP-01 and for the two n8n agents, Billing follow-up and Walkthrough prep, so a failed agent run reaches the coordinators too. It does not cover HP-H01: HP-H01 is how this workflow alerts the coordinators, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'An n8n run fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'HP-01 and the Billing follow-up and Walkthrough prep agents, as their error workflow'], ['Gives', 'the workflow, the failed step and a link to the run']], 'Starts whenever HP-01 or one of the two agents fails in n8n, No rate card included.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /hp/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/hp/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, and two Zapier Manager zaps, on New Zap Error and New Halted Task'], ['Carries', 'Make: the step and the error; Zapier: the zap, the time, and an error’s message; and failed or halted']], 'Starts when a Make error route reports a failed step in HP-02, or a Zapier Manager zap reports a failed or halted run of HP-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, time, failed or halted, then what the source gives: step, error, zap, run link; a field the source does not give stays empty'], ['Include Other Input Fields', 'Off']], 'Puts every kind of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert the coordinators', 'HP-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'HP-H01 · Alert the coordinators'], ['Urgent', 'yes for a failure, no for a halted run']], 'Sends the coordinators a Telegram message with the row’s fields: urgent for a failure, ordinary for a halt.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Harbor & Pine Moving Co. · Build plan',
  description: 'A build plan for Harbor & Pine Moving Co., a family-run mover on the Tidewater coast: three flows on n8n, Make and Zapier, two helpers, a test matrix and a handover, planned before anything is built, with every customer reply a coordinator’s.',
  kicker: 'BUILD PLAN · HARBOR & PINE',
  heading: 'Every estimate, move day and certificate, planned before a single step is placed, and no range sent without a coordinator.',
  lede:
    'Three flows and two helpers for Harbor & Pine Moving Co., the family-run mover Marisol Vega started in 2009 at 418 Cannery Row, Bellhaven. Estimate requests run on n8n, the day-before move message on Make and certificates of insurance on Zapier. HubSpot holds the contacts and the Moves pipeline, Airtable holds booked moves, the team and certificate requests, Cal.com holds the walkthroughs, and Google Sheets holds the rate card and the logs. The site promises a same-day written reply and no automated pricing bots, so Claude drafts a written range for the coordinators only, and a coordinator approves any range Claude drafts before it reaches a customer’s inbox. The move-day message is a fixed template and sends on its own, and every certificate is checked by the move’s coordinator before a building sees it.',
  meta: [
    ['Client', 'Harbor & Pine Moving Co. · Bellhaven'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a request, a move or a certificate ends.',
    rail: [
      { heading: 'Why plan first', body: 'Harbor & Pine makes promises a flow has to keep: a written range the same working day, or a walkthrough; a named coordinator and a lead mover’s number for the whole run; and certificates filed with building management. One sits above the rest: no automated pricing bots. This page pins all of it down before n8n, Make or Zapier is opened.' },
      { heading: 'The pricing rule', body: PRICING },
      { heading: 'Who says yes', body: YES },
    ],
    outcome: 'Every estimate request gets a coordinator’s written range or a walkthrough the same working day, every booked move gets its day-before message with the crew time and the lead mover’s number, and every building that asks gets a certificate a coordinator has checked.',
    trigger: 'Six entry points: the estimate form’s third step, each day at 1:00 pm, Ready to check ticked on a COI request, HP-01 or HP-H02 calling HP-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Range sent or walkthrough invited', 'Move-day message sent', 'Certificate sent to the building'],
    outOfScope: [
      'Pricing a move without a coordinator: no step sends a range a coordinator has not approved or written',
      'The written estimate after a walkthrough, which the coordinator writes by hand from what they counted',
      'Booking a move: the coordinator moves the deal to Booked and adds the move to Moves by hand, and no deposit is taken to hold a date',
      'Crew rosters, ferry scheduling, crane and hoist coordination and custom crating, which the coordinators plan by hand',
      'Asking the insurer for a certificate, and any building’s own portal, which a coordinator handles by hand',
      'Invoices, raised by hand in Stripe after the move, and damage claims, which a person handles',
      'The Help-desk RAG bot, the Billing follow-up agent and the Walkthrough prep agent, planned on the AI agents page',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms and a handful of coordinators. When a run fails on a Saturday morning, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'HP-[number] · [Title]', examples: ['HP-01 · Moving estimate', 'HP-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Price the move', 'Mark it sent', 'Send to the building'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/hp/[source]', examples: ['/hp/estimate', '/hp/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'HP · [Service] ([platform])', examples: ['HP · HubSpot (n8n)', 'HP · Gmail (Make)', 'HP · Airtable (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew. Every Gmail connection is signed in as hello@harborandpine.example and connected by Marisol.' },
      { name: 'HubSpot stages', pattern: 'One word or two, in the Moves pipeline', examples: ['New request', 'Estimate sent', 'Walkthrough', 'Booked', 'Lost'], rule: 'The flows set the first three; Booked and Lost are set by hand.' },
      { name: 'Cal.com event types', pattern: '[Where] walkthrough', examples: ['On-site walkthrough', 'Video walkthrough'], rule: 'The walkthrough email links the one the coordinator picked.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Moves', 'Team', 'COI requests'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'HubSpot for the sales board, three Airtable tables for the work, and four sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'HubSpot holds who asked and every estimate, as deals in the Moves pipeline. Airtable holds the work once a move is booked: the moves, the team and certificate requests. Google Sheets holds the rate card and the logs.' },
      { heading: 'One vocabulary per field', body: 'Every choice field takes one fixed list, and the flows, the templates and this page use the same words for it.' },
    ],
    tables: [
      { name: 'Contacts (HubSpot)', fields: ['First name', 'Last name', 'Email', 'Phone', 'Deals'], note: 'One per person who asks, matched on email.' },
      { name: 'Deals (HubSpot)', fields: ['Deal name', 'Contact', 'Moving from', 'Moving to', 'Target moving date', 'Home or office size', 'Service', 'Stage', 'Range low', 'Range high', 'Walkthrough', 'Deal owner'], note: 'One per estimate request, in the Moves pipeline. Service takes the site’s six: Residential moving, Office and commercial relocation, Long-distance and interstate, Packing and materials, Storage and staging, Specialty and fragile items, and a request may pick more than one. Stage is New request, Estimate sent, Walkthrough, Booked or Lost. Walkthrough is On site or By video. Deal owner is the coordinator who answered, the one named to the customer.' },
      { name: 'Moves', fields: ['Move', 'HubSpot deal', 'Customer', 'Email', 'Phone', 'Move date', 'From', 'To', 'Coordinator', 'Coordinator email', 'Crew arrival', 'Lead mover', 'Lead mover phone', 'Long distance', 'Transit window', 'Status', 'Day-before sent'], note: 'One row per booked move, added by the coordinator by hand when the deal is Booked. Coordinator and Lead mover link to Team, and Coordinator email and Lead mover phone are lookups from them. Status is Booked, Moved or Cancelled. Transit window is set only for a long-distance move. Day-before sent is set by HP-02.' },
      { name: 'Team', fields: ['Name', 'Email', 'Phone', 'Role'], note: 'Everyone on the payroll the flows name. Role is Coordinator, Lead mover or Mover.' },
      { name: 'COI requests', fields: ['Move', 'Move date', 'Coordinator', 'Coordinator email', 'Building', 'Address and unit', 'Manager email', 'Certificate holder', 'Wording asked for', 'Certificate', 'Ready to check', 'Ready changed', 'Status', 'Checked by', 'Checked on', 'Sent on'], note: 'One row per building’s request, logged by a coordinator by hand with the insurer’s certificate attached. Move links to Moves, and Move date, Coordinator and Coordinator email are lookups through it, so HP-03 reads them from the row; Coordinator email is a lookup of Moves’ own lookup from Team. Ready changed is a Last modified time field that watches Ready to check only. Status is Logged, Approved, Rejected or Sent. The Waiting view lists every request still Logged or Rejected.' },
    ],
    stages: [
      ['Requested', 'A deal at New request, waiting for a coordinator.'],
      ['Answered', 'A deal at Estimate sent with the coordinator’s range, or at Walkthrough.'],
      ['Booked', 'A deal set to Booked by hand, and its move added to Moves.'],
      ['Messaged', 'A move whose day-before message went out.'],
      ['Filed', 'A certificate checked and sent to the building.'],
    ],
    exitStages: [
      ['Lost', 'A deal the customer did not go ahead with, set by hand.'],
      ['Cancelled', 'A move called off, never messaged.'],
      ['Rejected', 'A certificate the coordinator turned back, logged again once corrected.'],
    ],
    sheets: [
      ['Rate card', 'The coordinators’ crew, truck, mileage, packing and specialty rates, kept by Marisol and read by HP-01'],
      ['Failed runs', 'One row per failed or halted run, from n8n, Make or Zapier, with no customer details'],
      ['Test matrix', 'The test rows below, with results'],
      ['Agent runs', 'One row per run of the Billing follow-up or Walkthrough prep agent: the time, each tool call and who said yes, planned on the AI agents page'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook on n8n, a daily schedule on Make, an Airtable record on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['The estimate form’s third step', 'Webhook POST /hp/estimate', 'HP-01'],
      ['Each day, 1:00 pm', 'Make schedule', 'HP-02'],
      ['Ready to check ticked on a COI request', 'Airtable New or Updated Record', 'HP-03'],
      ['HP-01 or HP-H02', 'Execute Sub-workflow', 'HP-H01'],
      ['An n8n run fails', 'Error Trigger', 'HP-H02'],
      ['A Make or Zapier run fails or halts', 'Webhook POST /hp/failed', 'HP-H02'],
    ],
  },
  workflows: [HP01, HP02, HP03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message the coordinators with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test contacts, a test rate card, test moves and a test building manager’s address before anything reaches a real customer or building.' },
      { heading: 'Test data', body: 'Test customers have made-up names, and every range comes from the test rate card. Times and ranges in these rows are illustrative.' },
    ],
    rows: [
      { id: 't01', workflow: 'HP-01', branch: 'Approve', input: 'Test Customer A: a two-bedroom apartment, Residential moving, Saltbrook to Bellhaven, three weeks out; a coordinator sends Approve', expected: 'A contact and a deal at New request; Claude’s range in the group, headed for coordinators only; then the estimate email with that range in the coordinator’s name; the deal at Estimate sent, owned by them; the group told' },
      { id: 't02', workflow: 'HP-01', branch: 'Edit', input: 'Test Customer B; the coordinator sends Edit, then a new range and a line on what it covers', expected: 'The email holds the coordinator’s range and line, not Claude’s; Range low and Range high match them' },
      { id: 't03', workflow: 'HP-01', branch: 'Walkthrough, on site', input: 'Test Customer C: a four-bedroom house with a baby grand, Fern Cove to Windward Hill; Walkthrough, On site', expected: 'Claude flags the specialty item; the email links the On-site walkthrough page and holds no range; the deal at Walkthrough' },
      { id: 't04', workflow: 'HP-01', branch: 'Walkthrough, by video', input: 'Test Customer D, moving from Cormorant Isle; Walkthrough, By video', expected: 'Claude flags the ferry; the email links the Video walkthrough page and holds no range' },
      { id: 't05', workflow: 'HP-01', branch: 'Nothing without a yes', input: 'Test Customer E’s request is left unanswered for three hours', expected: 'No email to the customer; the run still waiting in n8n; the deal still at New request' },
      { id: 't06', workflow: 'HP-01', branch: 'The button opens a form', input: 'Open t05’s button link in a browser and close it without sending; paste it in another chat so Telegram previews it', expected: 'Nothing recorded; the run still waiting until the form is sent' },
      { id: 't07', workflow: 'HP-01', branch: 'Asked before', input: 'Test Customer A asks again, the email in capitals with a trailing space', expected: 'One contact, with a second deal on it' },
      { id: 't08', workflow: 'HP-01', branch: 'No rate card', input: 'A test run with the Rate card tab emptied', expected: 'No message from Approve?; the run stops at No rate card; a row in Failed runs and an urgent alert with a link to the run' },
      { id: 't09', workflow: 'HP-01', branch: 'Long distance', input: 'Test Customer F: an office, Long-distance and interstate, Bellhaven to Columbus', expected: 'Claude’s flags note the Tuesday and Friday runs, in the group only; the customer hears nothing until the coordinator answers' },
      { id: 't10', workflow: 'HP-02', branch: 'Crew set', input: 'A test move tomorrow with crew arrival 8:00 am, a lead mover and an email', expected: 'Day-before sent set, then one email with 8:00 am, the lead mover’s name and number, and the coordinator’s name' },
      { id: 't11', workflow: 'HP-02', branch: 'Not set', input: 'A second test move tomorrow with no lead mover; the coordinator sets one and runs the scenario once more', expected: 'The coordinators asked on Telegram, no email at first; after the re-run, one email for it and none again for t10’s move' },
      { id: 't12', workflow: 'HP-02', branch: 'Quiet day', input: 'A day with no move booked for tomorrow', expected: 'One Quiet day message; no email' },
      { id: 't13', workflow: 'HP-02', branch: 'Cancelled', input: 'A test move tomorrow marked Cancelled', expected: 'Never found; no email' },
      { id: 't14', workflow: 'HP-02', branch: 'Long distance', input: 'A test long-distance move tomorrow, with a transit window of Thursday to Saturday', expected: 'The email adds the transit window; t10’s local move has no such line' },
      { id: 't15', workflow: 'HP-02', branch: 'Email fails', input: 'A test run with the Gmail connection in Make revoked', expected: 'Day-before sent set; the error route posts to /hp/failed, a row in Failed runs and an urgent alert; Make keeps the run to retry' },
      { id: 't16', workflow: 'HP-03', branch: 'Approved', input: 'A test request for a Lantern Bay building, the certificate attached, Ready to check ticked; the coordinator approves on the review page', expected: 'Status Approved, then Sent; one email to the test manager’s address with the certificate attached, copied to the coordinator' },
      { id: 't17', workflow: 'HP-03', branch: 'Rejected', input: 'A test request whose certificate names the wrong holder; the coordinator rejects it', expected: 'Status Rejected; Approved only stops the Zap; no email to the building' },
      { id: 't18', workflow: 'HP-03', branch: 'Incomplete or past', input: 'A test request ticked Ready with no certificate, and another whose move date has passed', expected: 'The Filter stops both; nothing sent' },
      { id: 't19', workflow: 'HP-03', branch: 'Link only opened', input: 'Open t16’s review link from the email and close it without choosing', expected: 'Nothing recorded; nothing sent' },
      { id: 't20', workflow: 'HP-03', branch: 'Logged again', input: 'After t17, the coordinator logs a corrected certificate as a new request and approves it', expected: 'The Zap starts afresh; the building gets the corrected one; t17’s row stays Rejected' },
      { id: 't21', workflow: 'HP-03', branch: 'A step fails', input: 'A test run with the Gmail connection in Zapier revoked', expected: 'Status Approved, not Sent; the New Zap Error zap posts the zap, the time and the error’s message to /hp/failed, a row in Failed runs with no step or run link, and an urgent alert' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order of their codes: estimates on n8n, the move-day message on Make, then certificates on Zapier.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Set up the Moves pipeline and its deal properties in HubSpot', 'Create the Airtable tables Moves, Team and COI requests', 'Create the Sheets tabs: Rate card, Failed runs, Test matrix, Agent runs', 'Add the connections on each platform: HP · HubSpot, HP · Gmail for hello@, HP · Telegram, HP · Airtable, HP · Anthropic', 'Build HP-H01 in n8n, then HP-H02 with HP-01 (not HP-H01) as the covered error workflow'] },
      { name: '2 · Estimates on n8n', tasks: ['Fill the Rate card with Marisol', 'Set up the On-site walkthrough and Video walkthrough event types in Cal.com', 'Write both email templates with the coordinators', 'Build HP-01 with Limit Wait Time off on both Telegram gates, and point the form’s third step at /hp/estimate', 'Run tests t01–t09'] },
      { name: '3 · Move day on Make', tasks: ['Build HP-02, every writing or sending module with an error route to /hp/failed', 'Write the Tomorrow’s move template with the coordinators', 'Show the coordinators how Run once picks up a move they have just completed', 'Run tests t10–t15 with test moves'] },
      { name: '4 · Certificates on Zapier', tasks: ['Add the Move date, Coordinator and Coordinator email lookups, Ready to check and the Ready changed field to COI requests', 'Build HP-03 with Name the answer and Log the answer before Approved only, and the Waiting view', 'Add the two Zapier Manager zaps, New Zap Error and New Halted Task, that post to /hp/failed', 'Run tests t16–t21 with a test manager’s address'] },
      { name: '5 · Test and hand over', tasks: ['Check the pricing rule with Marisol: no step sends a range a coordinator has not approved or written', 'Run the whole matrix again', 'Walk Marisol and the coordinators through the handover page, and turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Harbor & Pine keeps.',
    rail: [{ heading: 'Written for Marisol and the coordinators', body: 'One page, no jargon, for the people who answer every request. It lives next to the flows.' }],
    does: [
      'Opens every estimate request as a deal, has Claude draft a range for the coordinators, and waits for a coordinator’s Approve, Edit or Walkthrough.',
      'Sends the customer the coordinator’s written range, or a link to book a walkthrough, in the coordinator’s name.',
      'Emails every customer the day before their move with the crew time and the lead mover’s name and number.',
      'Asks a move’s coordinator when tomorrow’s crew is not set, and says so when no move is booked.',
      'Sends a building its certificate of insurance once the move’s coordinator has checked it.',
    ],
    breaks: [
      'Renaming a field in Moves, Team or COI requests, a deal property or a pipeline stage, or changing the Service, Stage, Status or Role choices.',
      'Turning on Limit Wait Time on either Telegram gate without a plan for a request nobody answers.',
      'Changing the Rate card’s columns: Claude reads them by name.',
      'Adding a step that sends Claude’s range without the coordinator’s answer.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach the coordinators on Telegram, with what each platform gives: the step and a link to the run from n8n, the step and the error from Make, the zap and the time from Zapier.',
    logs: 'Every failed or halted run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message. Every deal keeps its range and its coordinator, every move its day-before message and every certificate request who checked it.',
  },
  footer: { note: 'A worked example. Harbor & Pine is a fictional mover, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
