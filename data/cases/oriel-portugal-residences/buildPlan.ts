/**
 * Oriel’s Build plan case page (spec 2026-10-05 per-site pages): the blueprint
 * behind the three flows on its Automation page, OR-01 on n8n, OR-02 on Make
 * and OR-03 on Zapier, with the helpers, data, tests and handover they need.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/oriel-portugal-residences/build-plan.html. Only type imports,
 * so Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

const OR01: Workflow = {
  code: 'OR-01',
  title: 'Private viewing',
  platform: 'n8n',
  outcome: 'Every viewing request has an architect, a ninety-minute slot and a confirmation within one working day, and a home viewing has its headset on the way.',
  trigger: 'The private viewing form on the site posts to /or/viewing.',
  exits: ['Viewing confirmed at the studio', 'Viewing confirmed, headset on its way', 'Stopped, no free slot'],
  watch: [
    'The confirmation is a fixed template, so it goes out without waiting for a person. Claude’s line only ever reaches the architect.',
    'The form asks no time, so the flow holds the first free slot from the next working day, and the buyer can move it.',
    'Cal.com’s own confirmation email is turned off for the viewing event types, so the buyer gets one email, Oriel’s.',
    'With no free slot, the flow stops with an error instead of guessing. OR-H02 tells the studio, who reply by hand within the working day.',
    'Buyers are matched on email, never on name.',
    'The courier, not the form, asks a home buyer for their address.',
  ],
  nodes: [
    node('a1', 'trigger', 'Viewing form', 'POST /or/viewing', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Method', 'POST'], ['Path', '/or/viewing'], ['Respond', 'At once, 202']], 'Someone presses Request a viewing on the Oriel site, and their four answers arrive here the moment they do.'),
    node('a2', 'action', 'Tidy the fields', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Keeps', 'name, email, residence, where'], ['Email', 'trimmed and lowercased'], ['Residence', 'one of the five form answers']], 'Trims what they typed, lowercases the email and keeps only the four fields the form asks for.'),
    node('a3', 'action', 'Find the buyer', 'HubSpot', 'MagnifyingGlass', ['hubspot'], 'n8n · HubSpot › Search contacts', [['Match', 'email'], ['Returns', 'past viewings, owner flag, notes']], 'Looks the person up in HubSpot by email, to see whether they have walked a model before or already own an Oriel home.'),
    node('a4', 'ai', 'Qualify the request', 'Claude', 'Sparkle', ['claude'], 'n8n · Basic LLM Chain + Anthropic Chat Model', [['Model', 'Claude Haiku 4.5'], ['Returns', 'kind (buyer or owner), returning (yes or no), one_line'], ['Temperature', '0'], ['Goes to', 'the architect only']], 'Claude reads the request and the HubSpot history, says whether the person is a buyer or an owner and whether they have walked a model before, and writes one line for the architect.'),
    node('a5', 'branch', 'Which residence?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Condition', 'residence is not “Not sure yet”']], 'Checks whether the request names Pinhal, Lioz, Socalco or Eucalipto, or says Not sure yet.'),
    node('a6', 'action', 'Match the architect', 'Airtable', 'UserCheck', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Projects'], ['Match', 'Residence'], ['Returns', 'Project architect, Cal.com user']], 'Finds the architect who drew the residence they asked about, in the Projects table.'),
    node('a7', 'action', 'Architect on duty', 'Airtable', 'Table', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Duty rota'], ['Match', 'this week'], ['Returns', 'Architect, Cal.com user']], 'Finds the architect on studio duty this week, who can open all four models for someone still choosing.'),
    node('a8', 'action', 'Find free slots', 'Cal.com API', 'Clock', ['cal-com'], 'n8n · HTTP Request', [['Calls', 'the Cal.com API, GET free slots'], ['Event type', 'Studio viewing or Home viewing, 90 min'], ['From', 'the next working day']], 'Asks Cal.com for the architect’s free ninety-minute slots, starting from the next working day.'),
    node('a9', 'branch', 'Any slot free?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Condition', 'the slot list is not empty']], 'Checks whether Cal.com found at least one free slot for that architect.'),
    node('a10', 'end', 'Stop with an error', 'Stop and Error', 'XCircle', ['n8n'], 'n8n · Stop and Error', [['Message', 'No free viewing slot for this architect'], ['Then', 'OR-H02 logs it and alerts the studio']], 'If there is none, the run stops with an error, so OR-H02 logs it and the studio replies to the buyer by hand.'),
    node('a11', 'action', 'Hold a viewing', 'Cal.com API', 'CalendarCheck', ['cal-com'], 'n8n · HTTP Request', [['Calls', 'the Cal.com API, POST a booking'], ['Books', 'the first free slot'], ['Cal.com’s emails', 'turned off for these event types']], 'Books the first free slot in that architect’s calendar, as a studio viewing or a home viewing.'),
    node('a12', 'branch', 'Where?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Condition', 'where = “At home, with our headset”']], 'Checks whether the viewing is at the studio in Lisbon or at the buyer’s home.'),
    node('a13', 'action', 'Send the headset', 'Courier API', 'Truck', ['n8n'], 'n8n · HTTP Request', [['Books', 'delivery the day before, collection the day after'], ['Headset', 'loaded with the residence’s model'], ['Address', 'the courier asks the buyer']], 'Books the courier to bring a headset with the model loaded the day before the viewing, and to collect it the day after.'),
    node('a14', 'action', 'Confirm the viewing', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Template', 'Studio viewing or Home viewing'], ['Includes', 'date, time, architect, place or delivery, a link to move it'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer the date, the time, the architect’s name and the studio address or the headset delivery, with a link to move it.'),
    node('a15', 'action', 'Save the buyer', 'HubSpot', 'Database', ['hubspot'], 'n8n · HubSpot › Create or update contact', [['Match', 'email'], ['Sets', 'oriel_kind (buyer or owner), oriel_residence']], 'Adds the person to HubSpot, or updates them if they were already there, so there is only ever one contact per buyer.'),
    node('a16', 'action', 'Open the viewing', 'HubSpot', 'FlagCheckered', ['hubspot'], 'n8n · HubSpot › Create deal', [['Pipeline', 'Viewings'], ['Stage', '1 Viewing'], ['Holds', 'residence, where, time, architect, courier ref, Claude’s line']], 'Opens a viewing in the Viewings pipeline, linked to the buyer, with the time, the architect and Claude’s line.'),
    node('a17', 'helper', 'Tell the studio', 'OR-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'OR-H01 · Alert the studio'], ['Wait for it', 'No']], 'Sends the studio a short Telegram message: who is coming, to walk which residence, with whom and when.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'),
    edge('a5', 'a6', 'A residence'), edge('a5', 'a7', 'Not sure yet'),
    edge('a6', 'a8'), edge('a7', 'a8'), edge('a8', 'a9'),
    edge('a9', 'a11', 'A slot'), edge('a9', 'a10', 'None free'),
    edge('a11', 'a12'),
    edge('a12', 'a14', 'At the studio'), edge('a12', 'a13', 'At home'),
    edge('a13', 'a14'), edge('a14', 'a15'), edge('a15', 'a16'), edge('a16', 'a17'),
  ],
}

const OR02: Workflow = {
  code: 'OR-02',
  title: 'Studio inbox',
  platform: 'make',
  outcome: 'Every email to studio@oriel.pt reaches the person who should answer it, and every buyer lands in HubSpot.',
  trigger: 'Make’s Gmail module checks studio@oriel.pt every 15 minutes.',
  exits: ['Buyer in HubSpot, task for sales', 'Care request opened', 'Founders told', 'Forwarded to a site team', 'Added to hiring', 'Labelled Check'],
  watch: [
    'Nothing here writes back to the sender. Every reply is a person’s.',
    'If Claude’s answer cannot be read, the error route resumes with Not sure, so the email is flagged, never lost.',
    'Every module that writes has an error route that posts to /or/failed and ends in Break, so Make keeps the run to retry.',
    'Not sure is the router’s fallback route, so an email that matches no filter still lands with a person.',
    'A search with no match returns nothing to branch on in Make, so an unmatched owner or an unnamed residence is checked for and flagged, never silently dropped.',
  ],
  nodes: [
    node('b1', 'trigger', 'Mail to the studio', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Watch emails', [['Mailbox', 'studio@oriel.pt, Inbox'], ['Schedule', 'every 15 minutes'], ['Skips', 'mail sent from oriel.pt']], 'Make checks the studio inbox every quarter of an hour and picks up each new email that came from outside Oriel.'),
    node('b2', 'ai', 'Sort the email', 'Claude', 'Sparkle', ['claude'], 'Make · Anthropic Claude › Create a prompt', [['Model', 'Claude Haiku 4.5'], ['Returns', 'JSON: kind, summary, residence'], ['Kinds', 'buyer, owner, press, supplier, applicant, unsure']], 'Claude reads the email and names its kind, writes a one-line summary and picks out the residence, if the email names one.'),
    node('b3', 'action', 'Read the answer', 'JSON', 'ShieldCheck', ['make'], 'Make · JSON › Parse JSON', [['Structure', 'kind, summary, residence'], ['On error', 'Resume with kind = unsure']], 'Turns Claude’s answer into fields Make can route on. An answer that cannot be read becomes Not sure.'),
    node('b4', 'branch', 'Router', 'Which kind?', 'ArrowsSplit', ['make'], 'Make · Router', [['Routes', 'six, one filter each on kind'], ['Fallback', 'Not sure']], 'Sends the email down the route for its kind, and anything that matches no route to a person.'),
    node('b5', 'action', 'Log the buyer', 'HubSpot', 'Database', ['hubspot'], 'Make · HubSpot CRM › Create or update a contact', [['Match', 'email'], ['Sets', 'oriel_kind = buyer, oriel_residence']], 'Adds the buyer to HubSpot, or updates them, with the residence they wrote about.'),
    node('b6', 'action', 'Open a request', 'HubSpot', 'FlagCheckered', ['hubspot'], 'Make · HubSpot CRM › Create a deal', [['Pipeline', 'Viewings'], ['Stage', '0 Request'], ['Holds', 'Claude’s summary, the residence']], 'Opens a request in the Viewings pipeline, so a buyer who wrote is on the same board as one who used the form.'),
    node('b7', 'end', 'Task for sales', 'HubSpot', 'CalendarCheck', ['hubspot'], 'Make · HubSpot CRM › Create an engagement', [['Type', 'Task'], ['Due', 'the next working day'], ['Links', 'the email in Gmail']], 'Gives sales a task to answer the buyer and offer a viewing, due the next working day.'),
    node('b8', 'action', 'Find the home', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Search records', [['Table', 'Handover'], ['Match', 'Owner email']], 'Finds the owner’s home in the Handover table from the address they wrote from.'),
    node('b9', 'branch', 'Home found?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Routes', 'Found, Not found'], ['On', 'whether the search returned a home']], 'Checks whether the Handover table has a home for that address. A search with no match returns nothing to branch on, so this step checks for it directly.'),
    node('b10', 'end', 'Open a care request', 'Airtable', 'Table', ['airtable'], 'Make · Airtable › Create a record', [['Table', 'Care requests'], ['Links', 'the home'], ['Holds', 'Claude’s summary, the email']], 'Opens a care request for the home’s project team, who answer it from the model of what sits behind every wall.'),
    node('b11', 'end', 'Pass to the founders', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Inês and Tomás'], ['Includes', 'outlet, question, any deadline']], 'Messages Inês and Tomás on Telegram with the outlet, the question and any deadline.'),
    node('b12', 'action', 'Find the site team', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Search records', [['Table', 'Projects'], ['Match', 'Residence']], 'Looks up the site team email for the residence the supplier named, in the Projects table.'),
    node('b13', 'branch', 'Residence named?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Routes', 'Named, Not named'], ['On', 'whether Claude found a residence and the search matched it']], 'Checks whether the email named a residence Claude could read, and the Projects table has a site team for it.'),
    node('b14', 'end', 'Forward to site team', 'Gmail', 'Truck', ['gmail'], 'Make · Gmail › Send an email', [['To', 'the site team from Projects'], ['Keeps', 'the attachments']], 'Forwards the delivery note or quote to the site team of the residence it names, with its attachments.'),
    node('b15', 'end', 'Add to hiring', 'Airtable', 'Table', ['airtable'], 'Make · Airtable › Create a record', [['Table', 'Hiring'], ['Holds', 'name, email, role, attachments']], 'Adds the applicant, the role they wrote about and their attachments to the Hiring table.'),
    node('b16', 'end', 'Flag for a person', 'Gmail', 'Warning', ['gmail'], 'Make · Gmail › Modify email labels', [['Adds', 'the label Check'], ['Leaves', 'the email unread in the inbox']], 'Labels the email Check and leaves it unread in the inbox: for a kind Claude could not place, an owner whose home was not found, or a supplier who named no residence.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'),
    edge('b4', 'b5', 'Buyer'), edge('b5', 'b6'), edge('b6', 'b7'),
    edge('b4', 'b8', 'Owner'), edge('b8', 'b9'),
    edge('b9', 'b10', 'Found'), edge('b9', 'b16', 'Not found'),
    edge('b4', 'b11', 'Press'),
    edge('b4', 'b12', 'Supplier'), edge('b12', 'b13'),
    edge('b13', 'b14', 'Named'), edge('b13', 'b16', 'Not named'),
    edge('b4', 'b15', 'Applicant'),
    edge('b4', 'b16', 'Not sure'),
  ],
}

const OR03: Workflow = {
  code: 'OR-03',
  title: 'Model revision notice',
  platform: 'zapier',
  outcome: 'Everyone who walked a residence hears, in plain words, what changed in its model, and only after its architect has read the note.',
  trigger: 'Zapier sees a new record in the Revisions table in Airtable.',
  exits: ['Sent as Claude wrote it', 'Sent as the architect rewrote it', 'Nobody to tell', 'Waiting on the architect'],
  watch: [
    'No revision note reaches a buyer before the project architect answers. An unanswered request sends nothing.',
    'Human in the Loop sends no Telegram message itself: reviewers answer on a Zapier-hosted review page, so a Telegram Bot step tells the architect it is waiting, with a link to it.',
    'Human in the Loop’s own choices are Approved or Rejected; Rejected is read as Rewrite, so the branch still reads Approve or Rewrite, as on the Automation page.',
    'Zapier paths never join again, so both paths call the same Sub-Zap, OR-H03, and the send is built once.',
    'The note never promises a date or a price.',
    'A failed step is caught by a Zapier Manager zap that posts it to OR-H02.',
  ],
  nodes: [
    node('c1', 'trigger', 'New model revision', 'Airtable', 'ArrowsClockwise', ['airtable'], 'Zapier · Airtable › New record', [['Base', 'Oriel studio'], ['Table', 'Revisions'], ['Carries', 'residence, revision, change log, rooms']], 'The studio adds a revision row for a residence’s model in Airtable, and the Zap starts.'),
    node('c2', 'action', 'Find who walked it', 'HubSpot', 'MagnifyingGlass', ['hubspot'], 'Zapier · HubSpot › API request (beta)', [['Searches', 'Viewings deals for this residence with a walked date'], ['Returns', 'each buyer’s name and email, as line items']], 'Finds every buyer with a walked viewing of that residence in HubSpot, whatever stage they are at now.'),
    node('c3', 'action', 'Stop if nobody', 'Filter', 'ShieldCheck', ['zapier'], 'Zapier · Filter', [['Only continues if', 'at least one buyer was found']], 'Stops the Zap quietly if nobody has walked the residence yet, so the architect is not asked for nothing.'),
    node('c4', 'ai', 'Write the note', 'Claude', 'Sparkle', ['claude'], 'Zapier · Anthropic (Claude) › Send message', [['Model', 'Claude Sonnet 4.6'], ['Input', 'the change log, the rooms, the residence'], ['Rule', 'under 120 words, rooms by name, no dates or prices']], 'Claude turns the change log into a short, plain note: which rooms changed, what changed in them and what it means for living there.'),
    node('c5', 'action', 'Tell the architect', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'the project architect, from Projects'], ['Includes', 'the note, the change log, a link to the review page']], 'Messages the project architect on Telegram that a note is waiting for them, with a link to read and decide on it.'),
    node('c6', 'approve', 'Ask the architect', 'Human in the Loop', 'UserCheck', ['zapier'], 'Zapier · Human in the Loop › Request approval', [['Reviewer', 'the project architect, from Projects'], ['Shows', 'the note and the change log, on a Zapier review page'], ['Choices', 'Approved or Rejected'], ['No answer', 'nothing is sent']], 'Opens a Zapier review page with the note and the change log, where the architect approves it or rejects it to rewrite. A change still being settled is simply left unanswered.'),
    node('c7', 'branch', 'Architect approves?', 'Paths', 'ArrowsSplit', ['zapier'], 'Zapier · Paths', [['Path A', 'Approved'], ['Path B', 'Rejected, read as Rewrite']], 'Checks which of the two the architect chose.'),
    node('c8', 'action', 'Tell the architect', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'the project architect'], ['Includes', 'why it was sent back, a link to the review page']], 'Messages the architect again on Telegram that their note is wanted, with a link to the review page to write it.'),
    node('c9', 'wait', 'Architect rewrites', 'Collect data', 'PencilSimple', ['zapier'], 'Zapier · Human in the Loop › Collect data', [['Field', 'the note as it should read'], ['Starts with', 'Claude’s note, on the review page']], 'Waits for the architect to write the note as it should read on the review page, starting from Claude’s draft.'),
    node('c10', 'helper', 'Send to each buyer', 'OR-H03', 'Stack', ['zapier'], 'Zapier · Sub-Zap › Call a Sub-Zap', [['Sub-Zap', 'OR-H03 · Send a revision note'], ['Passes', 'Claude’s note, the buyers, the revision']], 'Hands Claude’s approved note and the list of buyers to OR-H03, which emails each of them and logs it.'),
    node('c11', 'helper', 'Send the rewrite', 'OR-H03', 'Stack', ['zapier'], 'Zapier · Sub-Zap › Call a Sub-Zap', [['Sub-Zap', 'OR-H03 · Send a revision note'], ['Passes', 'the architect’s note, the buyers, the revision']], 'Hands the architect’s own note and the list of buyers to OR-H03. Claude’s draft goes nowhere.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'), edge('c6', 'c7'),
    edge('c7', 'c10', 'Approve'), edge('c7', 'c8', 'Rewrite'),
    edge('c8', 'c9'), edge('c9', 'c11'),
  ],
}

const H01: Workflow = {
  code: 'OR-H01',
  title: 'Alert the studio',
  platform: 'n8n',
  outcome: 'Every message to the studio reads the same way and lands in one Telegram chat.',
  trigger: 'Called by OR-01 and OR-H02.',
  exits: ['Message sent'],
  watch: [
    'Urgent alerts are pinned in the chat, with sound.',
    'OR-H02 is not set as OR-H01’s error workflow: a failure here would otherwise call OR-H02, which calls OR-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, priority, link']], 'Another workflow hands over a message for the studio.'),
    node('h2', 'action', 'Format the alert', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code and a link to the record or run']], 'Puts the flow’s code and a link to the viewing or the failed run under the message.'),
    node('h3', 'end', 'Send to the studio', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'the Oriel studio group'], ['Urgent', 'pinned, with sound']], 'Posts it in the studio’s Telegram group. Urgent ones are pinned.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'OR-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed run, on any of the three platforms, is logged and reaches the studio with a link to it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'It never retries on its own. A person decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers OR-01 only, not OR-H01: OR-H01 is how this workflow alerts the studio, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'OR-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'OR-01, as its error workflow']], 'Starts whenever OR-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /or/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/or/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, a Zapier Manager zap']], 'Starts when a Make error route or the Zapier Manager zap reports a failed step in OR-02 or OR-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, step, message, run link, time']], 'Puts both kinds of failure into the same shape: which platform, which flow, which step and what went wrong.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert the studio', 'OR-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'OR-H01 · Alert the studio'], ['Priority', 'urgent']], 'Sends the studio an urgent Telegram message with a link to the failed run.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const H03: Workflow = {
  code: 'OR-H03',
  title: 'Send a revision note',
  platform: 'zapier',
  outcome: 'One place sends a revision note and logs it, whichever path approved it.',
  trigger: 'Called by OR-03, from either path.',
  exits: ['Sent and logged for each buyer'],
  watch: ['Each buyer gets their own email, by name, never one email to all.'],
  nodes: [
    node('g1', 'trigger', 'Called by OR-03', 'Start a Sub-Zap', 'Stack', ['zapier'], 'Zapier · Sub-Zap › Start a Sub-Zap', [['Inputs', 'note, buyers, residence, revision']], 'OR-03 hands over the approved note and the buyers who walked the residence.'),
    node('g2', 'action', 'For each buyer', 'Looping', 'ArrowsClockwise', ['zapier'], 'Zapier · Looping › Create loop from line items', [['Loops over', 'the buyers’ names and emails']], 'Runs the next two steps once for every buyer on the list.'),
    node('g3', 'action', 'Send the note', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send email', [['From', 'studio@oriel.pt'], ['Greets', 'each buyer by name'], ['Adds', 'a link to book another walk']], 'Emails the buyer the note by name, from the studio, with a link to book another walk.'),
    node('g4', 'end', 'Log on the contact', 'HubSpot', 'Database', ['hubspot'], 'Zapier · HubSpot › Create engagement', [['Type', 'Note'], ['Holds', 'the note and the revision number']], 'Adds the note and the revision number to the buyer’s HubSpot timeline, so whoever speaks to them next knows.'),
  ],
  edges: [edge('g1', 'g2'), edge('g2', 'g3'), edge('g3', 'g4')],
}

const plan: Plan = {
  title: 'Oriel · Build plan',
  description: 'A build plan for Oriel, a Lisbon developer: three flows on n8n, Make and Zapier, three helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'BUILD PLAN · ORIEL',
  heading: 'Every viewing, email and model change, planned before a single step is placed.',
  lede:
    'Three flows and three helpers for Oriel, a developer in Lisbon that builds every residence twice: first as a walkable model, then in stone. The viewing runs on n8n, the studio inbox on Make and the revision notice on Zapier. HubSpot holds the buyers, Airtable holds what the studio edits, Claude reads and drafts, and an architect approves anything Claude drafts for a buyer’s inbox.',
  meta: [
    ['Client', 'Oriel Residential · Lisbon'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 3 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a buyer’s story ends.',
    rail: [{ heading: 'Why plan first', body: 'Three platforms make it easy to lose track of which flow does what. This page names the outcome of each one before n8n, Make or Zapier is opened.' }],
    outcome: 'Every viewing request is confirmed within one working day with an architect and a slot, every email to the studio reaches the person who should answer it, and an architect approves anything Claude drafts for a buyer’s inbox.',
    trigger: 'Five entry points: the viewing form, the studio inbox, a new revision in Airtable, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Reserved', 'Not now', 'Care request with the team', 'Flagged for a person'],
    outOfScope: ['Reservations, contracts and deposits', 'The models themselves and the headsets’ setup', 'Construction and site scheduling', 'The Residence Q&A bot and the agents, planned on their own page'],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, one studio. When a run fails, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'OR-[number] · [Title]', examples: ['OR-01 · Private viewing', 'OR-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Match the architect', 'Hold a viewing', 'Log the buyer'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/or/[source]', examples: ['/or/viewing', '/or/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'OR · [Service] ([platform])', examples: ['OR · HubSpot (n8n)', 'OR · HubSpot (Make)', 'OR · Gmail (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew.' },
      { name: 'HubSpot properties', pattern: 'oriel_[noun], snake_case, _at for times', examples: ['oriel_residence', 'oriel_walked_at'], rule: 'One prefix keeps Oriel’s own fields apart from HubSpot’s.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Projects', 'Duty rota', 'Revisions'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Two HubSpot records, six Airtable tables, five stages and two sheet tabs.',
    rail: [{ heading: 'Source of truth', body: 'HubSpot holds buyers and their viewings. Airtable holds what the studio edits by hand: projects, the duty rota, revisions and handovers. Google Sheets only keeps logs.' }],
    tables: [
      { name: 'buyers', fields: ['email', 'firstname', 'lastname', 'oriel_kind', 'oriel_residence'], note: 'HubSpot contacts, one per person, matched on email. Kind is buyer or owner.' },
      { name: 'viewings', fields: ['dealname', 'dealstage', 'oriel_residence', 'oriel_where', 'oriel_viewing_at', 'oriel_architect', 'oriel_courier_ref', 'oriel_walked_at'], note: 'HubSpot deals in the Viewings pipeline, one per viewing, linked to the buyer.' },
      { name: 'Projects', fields: ['Residence', 'Place', 'Project architect', 'Cal.com user', 'Site team email'], note: 'Airtable, one row per residence: Pinhal, Lioz, Socalco and Eucalipto.' },
      { name: 'Duty rota', fields: ['Week', 'Architect', 'Cal.com user'], note: 'Who walks the Not sure yet viewings each week.' },
      { name: 'Revisions', fields: ['Residence', 'Revision', 'Change log', 'Rooms', 'Logged by'], note: 'One row per change to a model. A new row starts OR-03.' },
      { name: 'Handover', fields: ['Home', 'Residence', 'Owner email', 'Handed over'], note: 'One row per home handed over, so an owner’s email finds their home.' },
      { name: 'Care requests', fields: ['Home', 'Summary', 'Email', 'Opened', 'Status'], note: 'What owners ask after handover, answered by the project team.' },
      { name: 'Hiring', fields: ['Name', 'Email', 'Role', 'Attachments'], note: 'Every application to the studio, in one list.' },
    ],
    stages: [
      ['0 Request', 'A buyer wrote to the studio, and sales is offering them a viewing.'],
      ['1 Viewing', 'A ninety-minute slot is held with an architect, and the confirmation has gone out.'],
      ['2 Walked', 'The buyer has walked the model with the architect, who sets this and the walked date afterwards.'],
      ['3 Reserved', 'The buyer has reserved a residence. Sales sets this by hand.'],
    ],
    exitStages: [['Not now', 'The buyer has stepped back for now. They still hear about changes to any residence they walked.']],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook on n8n, a mailbox watch on Make, a new Airtable record on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['Private viewing form', 'Webhook POST /or/viewing', 'OR-01'],
      ['studio@oriel.pt', 'Gmail › Watch emails, every 15 min', 'OR-02'],
      ['Revisions table in Airtable', 'New record', 'OR-03'],
      ['OR-01 or OR-H02', 'Execute Sub-workflow', 'OR-H01'],
      ['An n8n run fails', 'Error Trigger', 'OR-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /or/failed', 'OR-H02'],
      ['OR-03, either path', 'Call a Sub-Zap', 'OR-H03'],
    ],
  },
  workflows: [OR01, OR02, OR03],
  helpers: {
    title: 'Helpers',
    blurb: 'Three small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report to them. OR-H03 exists because Zapier paths never join again.' }],
    list: [H01, H02, H03],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [{ heading: 'How to test', body: 'Each row is one branch, walked with test contacts, a test mailbox and a test residence in Airtable before anything reaches a real buyer.' }],
    rows: [
      { id: 't01', workflow: 'OR-01', branch: 'A residence, at the studio', input: 'Lioz, At the studio in Lisbon, a new email', expected: 'Lioz’s architect holds 90 min, studio confirmation sent, a viewing at stage 1' },
      { id: 't02', workflow: 'OR-01', branch: 'Not sure yet', input: 'Not sure yet, At the studio in Lisbon', expected: 'The duty architect is booked and named in the confirmation' },
      { id: 't03', workflow: 'OR-01', branch: 'At home', input: 'Pinhal, At home, with our headset', expected: 'Courier booked for the day before and after; the confirmation names the delivery' },
      { id: 't04', workflow: 'OR-01', branch: 'Returning buyer', input: 'An email already in HubSpot with a walked viewing', expected: 'Claude’s line says returning; still one contact, a second viewing' },
      { id: 't05', workflow: 'OR-01', branch: 'No free slot', input: 'A test architect whose calendar is fully blocked', expected: 'OR-H02 logs it and alerts the studio; nothing reaches the buyer' },
      { id: 't06', workflow: 'OR-02', branch: 'Buyer', input: 'A question about Residence 3B in Lioz', expected: 'Contact in HubSpot, a request at stage 0 for Lioz, a task for sales' },
      { id: 't07', workflow: 'OR-02', branch: 'Owner, home found', input: 'A Eucalipto owner asks about a damp wall', expected: 'A care request linked to their home' },
      { id: 't08', workflow: 'OR-02', branch: 'Owner, no match', input: 'An owner email not in the Handover table', expected: 'Labelled Check; no care request opened' },
      { id: 't09', workflow: 'OR-02', branch: 'Press', input: 'A magazine asks for an interview by Friday', expected: 'Telegram to Inês and Tomás, with the deadline' },
      { id: 't10', workflow: 'OR-02', branch: 'Supplier, residence named', input: 'A stone supplier sends a quote for Socalco', expected: 'Forwarded to the Socalco site team, attachment kept' },
      { id: 't11', workflow: 'OR-02', branch: 'Supplier, no residence', input: 'A supplier quote that names no residence', expected: 'Labelled Check; nothing forwarded' },
      { id: 't12', workflow: 'OR-02', branch: 'Applicant', input: 'A letter and a CV for an architect role', expected: 'A row in Hiring with the attachments' },
      { id: 't13', workflow: 'OR-02', branch: 'Not sure', input: 'A one-line email: “Call me”', expected: 'Labelled Check and left unread; nothing else happens' },
      { id: 't14', workflow: 'OR-02', branch: 'Unreadable answer', input: 'Force Claude’s answer to be broken JSON', expected: 'Treated as Not sure and labelled Check' },
      { id: 't15', workflow: 'OR-03', branch: 'Approve', input: 'A Lioz revision: the 3B kitchen wall moves 40 cm', expected: 'Each person who walked Lioz gets the note by name, logged on their contact' },
      { id: 't16', workflow: 'OR-03', branch: 'Rewrite', input: 'The same, and the architect rejects it and rewrites the note', expected: 'Only the architect’s note is sent; Claude’s draft goes nowhere' },
      { id: 't17', workflow: 'OR-03', branch: 'No answer', input: 'Leave the review page unanswered', expected: 'Nothing is sent to anyone' },
      { id: 't18', workflow: 'OR-03', branch: 'Nobody walked it', input: 'A revision for a test residence with no viewings', expected: 'The Zap stops at the filter; the architect is not asked' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order a buyer meets them: the viewing, the inbox, then the revisions.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Viewings pipeline, its stages and the oriel_ properties in HubSpot', 'Create the Airtable tables: Projects, Duty rota, Revisions, Handover, Care requests, Hiring', 'Add the connections on each platform: OR · HubSpot, OR · Gmail, OR · Airtable, OR · Anthropic, OR · Telegram', 'Create the Sheets tabs: Failed runs, Test matrix', 'Build OR-H01 in n8n, then OR-H02 with OR-01 (not OR-H01) as the covered error workflow'] },
      { name: '2 · Viewings on n8n', tasks: ['Set up each architect’s Studio viewing and Home viewing event types in Cal.com, with their own confirmation email turned off', 'Agree the booking details for the headset courier', 'Build OR-01 and point the site’s viewing form at /or/viewing', 'Run tests t01–t05'] },
      { name: '3 · Inbox on Make', tasks: ['Build OR-02 with its router, six kind routes and the two lookup branches, on a test mailbox', 'Give every module that writes an error route to /or/failed', 'Run tests t06–t14'] },
      { name: '4 · Revisions on Zapier', tasks: ['Build OR-H03 as a Sub-Zap, then OR-03 with its Telegram notices and two paths', 'Add the Zapier Manager zap that posts failures to /or/failed', 'Run tests t15–t18 with a test residence and test contacts'] },
      { name: '5 · Test and hand over', tasks: ['Point OR-02 at studio@oriel.pt', 'Run the whole matrix again with the real architects and a real headset delivery', 'Walk Inês, Tomás and the architects through the handover page', 'Turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What the studio keeps.',
    rail: [{ heading: 'Written for the studio', body: 'One page, no jargon, for Inês, Tomás and the architects. It lives next to the flows.' }],
    does: [
      'Confirms every viewing request within one working day, with an architect and a ninety-minute slot.',
      'Books the headset courier for every home viewing.',
      'Sorts every email to studio@oriel.pt and hands it to the person who answers it.',
      'Puts every buyer in HubSpot, whether they used the form or wrote.',
      'Drafts a plain note when a model changes, and sends it only after the architect approves.',
    ],
    breaks: [
      'Renaming a field in the Projects or Revisions table in Airtable.',
      'Adding a residence without its architect and Cal.com user in Projects.',
      'Changing the viewing form’s questions or answers on the site.',
      'Changing an architect’s Cal.com event types.',
      'Renaming the Viewings pipeline or its stages in HubSpot.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach the studio’s Telegram group with a link to the run.',
    logs: 'Every failed run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message. Every viewing and every buyer email is on the buyer’s HubSpot timeline.',
  },
  footer: { note: 'A worked example. Oriel is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
