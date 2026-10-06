/**
 * Westmere’s Build plan case page (spec 2026-10-05 per-site pages): the
 * blueprint behind the three flows on its Automation page, WM-01 on n8n, WM-02
 * on Make and WM-03 on Zapier, with the helpers, data, tests and handover they
 * need. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/westmere-los-angeles/build-plan.html. Only type imports, so
 * Node can run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The fair-housing rule, first in the enquiry flow’s watch-outs and on the start rail. */
const FAIR = 'The fair-housing rule: Westmere is an Equal Housing Opportunity developer, DRE #02114471, and no step screens, sorts or scores a buyer on who they are. In WM-01 Claude reads only the message and the residence, never the name, email or phone, and pulls out three things the buyer stated: whether they asked to view, whether they asked to talk, and any timeline. Its output has no field for anything else, and a fixed IF rule, not Claude, routes on those three. The route decides only how fast an agent calls: every buyer gets the same brochure, and anyone can book a viewing. A “qualified buyer” means proof of funds and nothing else, and only the sales director decides it, by hand, in WM-03.'

/** Who says yes, as on the Automation page. */
const YES = 'The sales director confirms proof of funds before any valuation pack goes out. The brochure, the portfolio and the viewing confirmation are fixed templates and send on their own. In these flows Claude drafts nothing for a buyer’s inbox; the hosting agent approves anything Claude drafts for a buyer’s inbox, which only the Buyer follow-up agent does, planned on the AI agents page.'

const WM01: Workflow = {
  code: 'WM-01',
  title: 'Residence enquiry',
  platform: 'n8n',
  outcome: 'Serious buyers reach an agent within minutes; everyone else still gets the brochure and stays on the list.',
  trigger: 'n8n’s Webhook catches the panel that Enquire on this residence opens, when the buyer sends it.',
  exits: ['With an agent, brochure sent', 'On the list, brochure sent', 'Residence not found, with the sales team'],
  watch: [
    FAIR,
    'Read the enquiry is n8n’s Information Extractor, with three attributes and no others: Asked to view, Asked to talk and Timeline. Its instructions tell it to ignore anything about who the buyer is, their family, origin, faith, age, health or any other trait a fair-housing law protects, and it has nowhere to put one. It never weighs a budget or the buyer’s means: that is proof of funds, a person’s call in WM-03.',
    'Ready to view? is Yes when Asked to view or Asked to talk is true, or Timeline is Within 3 months or 3–12 months. A message in any language is read the same way, and an empty message is Not said on all three, so it goes to the list with the brochure.',
    'Find the residence has Always Output Data on, so a residence missing from Residences still hands an empty item on instead of ending the run quietly. Residence found? then sends it to WM-H01, which tells the sales team at once with a link to the contact, and a person sends the brochure by hand.',
    'Save the contact is a Create or update matched on email, so a second enquiry from the same person updates one contact. There is no search there, so nothing can come back empty.',
    'Alert the agent messages the listing agent’s own Telegram chat, from the Team table. Each agent starts Westmere’s bot once, so it can write to them. The message holds the buyer’s name, the residence and their message as they wrote it, never Claude’s three answers alone, so the agent reads the words, not a label.',
    'Send the brochure is a fixed template from private@westmere.la, the same for both paths, with the sales gallery at 9200 Sunset Blvd, Suite 40, West Hollywood CA 90069, +1 310 555 0148, DRE #02114471 and Equal Housing Opportunity. Claude writes none of it.',
    'Save the contact, Read the enquiry and Send the brochure retry three times. If one still fails, the run fails and WM-H02 alerts the sales team with a link to it: WM-01 keeps its executions, so a person reads the enquiry there and answers it by hand.',
    'Download the brochure starts no flow: it downloads the PDF from the page and asks for nothing, so nothing is recorded.',
  ],
  nodes: [
    node('a1', 'trigger', 'Enquiry form', 'Webhook', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/wm/enquiry'], ['Method', 'POST'], ['Respond', 'Immediately'], ['Sent by', 'the panel Enquire on this residence opens']], 'A buyer sends the enquiry panel: a name, an email, an optional phone and a message, with the residence from the page.'),
    node('a2', 'action', 'Tidy the enquiry', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Email', 'trimmed and lowercased'], ['Phone', 'digits only'], ['Keeps', 'Residence, Name, Email, Phone, Message']], 'Puts the email and phone into one shape, so a second enquiry finds the same contact.'),
    node('a3', 'action', 'Save the contact', 'HubSpot', 'Database', ['hubspot'], 'n8n · HubSpot › Create or update contact', [['Connection', 'WM · HubSpot (n8n)'], ['Match on', 'Email'], ['Sets', 'First name, Last name, Phone, Residence of interest, Enquiry source = Enquire on this residence, Enquiry message = their message as written, Enquired on = today'], ['Retry on fail', 'On, 3 tries']], 'Adds the buyer to HubSpot, or updates them if this email has asked before.'),
    node('a4', 'action', 'Find the residence', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search', [['Connection', 'WM · Airtable (n8n)'], ['Table', 'Residences'], ['Filter By Formula', '{Slug} = the residence from the panel'], ['Limit', '1'], ['Always Output Data', 'On, so a missing residence goes on to the check instead of ending the run quietly']], 'Looks up the residence for its listing agent, their Telegram chat and its brochure.'),
    node('a5', 'branch', 'Residence found?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Found', 'Brochure and Agent chat ID are both not empty'], ['Not found', 'otherwise']], 'Goes on only when the residence has its brochure and its listing agent.'),
    node('a6', 'helper', 'Tell the sales team', 'WM-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'WM-H01 · Alert the sales team'], ['Urgent', 'yes'], ['Says', 'an enquiry for a residence not in Residences, with a link to the contact']], 'Tells the sales team at once, so a person sends the brochure and answers by hand.'),
    node('a7', 'ai', 'Read the enquiry', 'Claude', 'Sparkle', ['claude'], 'n8n · Information Extractor + Anthropic Chat Model', [['Connection', 'WM · Anthropic (n8n)'], ['Model', 'Claude Sonnet 4.6'], ['Temperature', '0'], ['Reads', 'the message and the residence only, never the name, email or phone'], ['Attributes', 'Asked to view: true or false; Asked to talk: true or false; Timeline: Within 3 months, 3–12 months, Later or Not said'], ['Never', 'weighs a budget, or notes anything about who the buyer is'], ['Retry on fail', 'On, 3 tries']], 'Claude pulls three things the buyer stated out of their message, and nothing else.'),
    node('a8', 'branch', 'Ready to view?', 'IF', 'ArrowsSplit', ['n8n'], 'n8n · If', [['Combine', 'OR'], ['Yes', 'Asked to view is true, or Asked to talk is true, or Timeline is Within 3 months or 3–12 months'], ['Not yet', 'otherwise']], 'Routes on the three answers by a fixed rule, the same for every buyer.'),
    node('a9', 'action', 'Alert the agent', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Connection', 'WM · Telegram (n8n)'], ['Chat ID', 'the listing agent’s, from Residences'], ['Says', 'the buyer’s name, the residence, their message as written, and a link to the contact']], 'Messages the listing agent within minutes of the enquiry.'),
    node('a10', 'action', 'Add to New releases', 'HubSpot', 'Stack', ['hubspot'], 'n8n · HubSpot › Contact List › Add', [['List', 'New releases, a static list'], ['By', 'Email']], 'Puts the buyer on the list that hears about new residences as they launch.'),
    node('a11', 'action', 'Send the brochure', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'WM · Gmail (n8n), signed in as private@westmere.la'], ['Template', 'Your brochure for [the residence]'], ['Attachments', 'the brochure and floor plans, from Residences'], ['Holds', 'the residence, the sales gallery’s address, Tuesday to Saturday by appointment, +1 310 555 0148, DRE #02114471, Equal Housing Opportunity'], ['Written by', 'a fixed template, not Claude'], ['Retry on fail', 'On, 3 tries']], 'Emails the same brochure, whichever path the enquiry took.'),
    node('a12', 'end', 'Note the route', 'HubSpot', 'FlagCheckered', ['hubspot'], 'n8n · HubSpot › Create or update contact', [['Match on', 'Email'], ['Sets', 'Enquiry route = With an agent or On the list; Brochure sent = today']], 'Notes which path the enquiry took, so the sales director can check the rule.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'), edge('a3', 'a4'), edge('a4', 'a5'),
    edge('a5', 'a7', 'Found'), edge('a5', 'a6', 'Not found'),
    edge('a7', 'a8'),
    edge('a8', 'a9', 'Yes'), edge('a8', 'a10', 'Not yet'),
    edge('a9', 'a11'), edge('a10', 'a11'), edge('a11', 'a12'),
  ],
}

const WM02: Workflow = {
  code: 'WM-02',
  title: 'Private viewing',
  platform: 'make',
  outcome: 'Every private viewing booked on the site is held Tuesday to Saturday at the sales gallery, known to its hosting agent the moment it is booked, and then confirmed to the buyer in Westmere’s own words.',
  trigger: 'Cal.com’s webhook on the Private viewing event posts to Make’s custom webhook when a viewing is booked, moved or cancelled.',
  exits: ['Host told, then confirmed', 'Sales team told, then confirmed', 'Cancelled, viewing cleared'],
  watch: [
    'Private viewings are held Tuesday to Saturday, by appointment only, as the site says. The Private viewing event’s availability has Tuesday to Saturday only, so Cal.com never offers a Sunday or a Monday, and its location is the sales gallery, 9200 Sunset Blvd, Suite 40, West Hollywood CA 90069.',
    'The event is round robin across the sales agents, so Cal.com picks the hosting agent in turn, never by who the buyer is. The booking page asks for a name, an email, a phone and the residence, and nothing else.',
    'The confirmation is a fixed template, so it sends on its own and needs no one’s yes. Cal.com sends its own booking email too; Westmere’s adds what Cal.com’s cannot hold: the hosting agent by name, the gallery, and the number to call.',
    'Save the viewing is a HubSpot Make an API call to the batch upsert endpoint, matched on email, so a buyer who enquired first keeps one contact with both. It is not a search, so nothing can come back empty there.',
    'Find the host is an Airtable Make an API call, not a search module, so it returns one bundle with the list even when it is empty, and Host found? routes on the list’s length. An empty list goes to the sales team, so an agent missing from Team is caught.',
    'The host is told before the buyer’s confirmation, so a viewing is never confirmed to a buyer while its host is in the dark. Make’s Router runs its routes one after another, in their set order, and no route rejoins another: Found tells the host, None tells the sales team, and the last route, Then, has no filter and sends the confirmation. If Gmail then fails, the host already knows.',
    'A moved viewing arrives as Booking rescheduled and takes the booked route again: the contact gets the new day and time, and the buyer a new confirmation. A cancelled one only clears the day and time; Cal.com tells the hosting agent itself.',
    'Every module that writes or sends has an error route that posts the step, the error and the viewing’s day and time, never the buyer’s name or details, to /wm/failed, so the sales team knows which viewing it was. Save the viewing, Clear the viewing and Confirm the viewing end in Break, so Make keeps the run to retry; if the confirmation email still fails, the hosting agent, already told, writes to the buyer by hand. Tell the host and Tell the sales team end in Ignore, so only that route stops: the Router still runs Then and the buyer is confirmed, and the failed-run alert sends the sales team to tell the host by hand.',
  ],
  nodes: [
    node('b1', 'trigger', 'Viewing booked', 'Cal.com webhook', 'CalendarCheck', ['cal-com', 'make'], 'Make · Webhooks › Custom webhook', [['Scenario', 'WM-02 · Private viewing'], ['Sent by', 'Cal.com’s webhook on the Private viewing event'], ['Events', 'Booking created, Booking rescheduled, Booking cancelled']], 'Cal.com posts the booking: the buyer, the residence, the day and time, and the hosting agent.'),
    node('b2', 'branch', 'Booked or cancelled?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Booked or moved', 'the event is BOOKING_CREATED or BOOKING_RESCHEDULED'], ['Cancelled', 'the event is BOOKING_CANCELLED']], 'Sends a booked or moved viewing on to be confirmed, and a cancelled one to be cleared.'),
    node('b3', 'action', 'Save the viewing', 'HubSpot API call', 'Database', ['hubspot'], 'Make · HubSpot CRM › Make an API call', [['Connection', 'WM · HubSpot (Make)'], ['Call', 'POST /crm/v3/objects/contacts/batch/upsert'], ['Match on', 'Email'], ['Sets', 'First name, Last name, Phone, Residence of interest, Enquiry source = Book a private viewing, Next viewing, Hosting agent']], 'Adds or updates the buyer with the viewing’s day and time and the hosting agent.'),
    node('b4', 'end', 'Confirm the viewing', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'WM · Gmail (Make), signed in as private@westmere.la'], ['Template', 'Your private viewing'], ['Holds', 'the day and time; the residence; the sales gallery, 9200 Sunset Blvd, Suite 40, West Hollywood CA 90069; the hosting agent’s name; +1 310 555 0148 to change it; DRE #02114471, Equal Housing Opportunity'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer Westmere’s own confirmation.'),
    node('b5', 'action', 'Find the host', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Make · Airtable › Make an API call', [['Connection', 'WM · Airtable (Make)'], ['Call', 'GET /v0/{base}/Team'], ['Formula', 'Email is the hosting agent’s email'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Looks up the hosting agent’s Telegram chat in Team.'),
    node('b6', 'branch', 'Host found?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Route order', 'Found, None, then Then; Make runs them one after another'], ['Found', 'the list’s length is 1 or more; Team holds one row per email, and if two ever match, the first is used'], ['None', 'the list’s length is 0'], ['Then', 'no filter, run last: Confirm the viewing']], 'Routes on the list’s length, then confirms the viewing once the host or the sales team is told.'),
    node('b7', 'end', 'Tell the host', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Connection', 'WM · Telegram (Make)'], ['Chat ID', 'the hosting agent’s, from Team'], ['Says', 'the buyer’s name, the residence, the day and time, and whether it was booked or moved']], 'Messages the hosting agent directly.'),
    node('b8', 'end', 'Tell the sales team', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Sales team, the group'], ['Says', 'a viewing booked with a host missing from Team: the host’s email, the day and time']], 'Asks the sales team to add the agent to Team and tell them.'),
    node('b9', 'end', 'Clear the viewing', 'HubSpot API call', 'XCircle', ['hubspot'], 'Make · HubSpot CRM › Make an API call', [['Call', 'POST /crm/v3/objects/contacts/batch/upsert'], ['Match on', 'Email'], ['Sets', 'Next viewing and Hosting agent cleared']], 'Clears the cancelled viewing from the buyer’s contact.'),
  ],
  edges: [
    edge('b1', 'b2'),
    edge('b2', 'b3', 'Booked or moved'), edge('b2', 'b9', 'Cancelled'),
    edge('b3', 'b5'), edge('b5', 'b6'),
    edge('b6', 'b7', 'Found'), edge('b6', 'b8', 'None'), edge('b6', 'b4', 'Then'),
  ],
}

const WM03: Workflow = {
  code: 'WM-03',
  title: 'Full portfolio',
  platform: 'zapier',
  outcome: 'Every request gets the full portfolio of fourteen developments straight away and reaches the sales team, and Kestrel Valuation Partners’ valuation pack goes out only after the sales director confirms proof of funds.',
  trigger: 'Webhooks by Zapier’s Catch Hook receives the panel that Request the full portfolio opens, when the buyer sends it.',
  exits: ['Pack sent', 'Not confirmed, nothing sent', 'No answer, nothing sent'],
  watch: [
    'Proof of funds is the only thing that makes a buyer qualified, and the sales director decides it, the same way for every buyer. The buyer sends it to the director, by email or in person; it never enters a flow, a table or HubSpot. The review page and the row hold only Confirmed or Not confirmed, who checked and when, never an amount or a document.',
    'Human in the Loop notifies the sales director by email, with the link to its Zapier review page, and records Approved or Rejected. Opening the link, or a mail scanner opening it, records nothing: only the director’s choice on the page does. With no answer, the Zap goes no further and nothing is sent; the request stays Awaiting in the Waiting view.',
    'Name the answer and Record the answer come before Confirmed only, so a Not confirmed is written on the row too. Name the answer is a Formatter Lookup Table: Approved becomes Confirmed, and anything else becomes Not confirmed. Confirmed only reads the same result. There are no paths, so nothing ever has to rejoin.',
    'Not confirmed sends nothing: no buyer gets an automated no. The sales director writes to them personally.',
    'A Zap has one trigger. If the request has timed out before the director has the proof, they send the pack by hand from Gmail and set Proof of funds and Pack sent on the row themselves.',
    'The portfolio email links the full portfolio, which is as public as the brochure, so it sends on its own. The valuation pack is attached exactly as Kestrel Valuation Partners issued it, from the Documents table, and its figures are Kestrel’s, never retyped.',
    'Get the pack is a Find Record with success when nothing is found turned off, so a missing pack stops the run before any email goes. Zapier marks that run halted, and a second Zapier Manager zap, on New Halted Task, posts it to /wm/failed: a row in Failed runs and an alert to the sales team. New Halted Task checks on a schedule, so the alert comes a few minutes later, and its row names the zap and the time, as Zapier Manager gives them, with no step or run link. The row stays Confirmed with no Pack sent date, and the director sends the pack by hand.',
    'A failed step is caught by a Zapier Manager zap, on New Zap Error, that posts it to /wm/failed. A Zap has one trigger, so errors and halts each have their own Zapier Manager zap. If the pack email fails after the answer is recorded, the request stays Confirmed and not sent, and the director sends it by hand.',
  ],
  nodes: [
    node('c1', 'trigger', 'Portfolio requested', 'Webhooks by Zapier', 'WebhooksLogo', ['zapier'], 'Zapier · Webhooks by Zapier › Catch Hook', [['Zap', 'WM-03 · Full portfolio'], ['Sent by', 'the panel Request the full portfolio opens'], ['Gives', 'Name, Email, Phone, Note']], 'A buyer sends the portfolio panel, and the Zap starts with it.'),
    node('c2', 'action', 'Save the contact', 'HubSpot', 'Database', ['hubspot'], 'Zapier · HubSpot › Create or Update Contact', [['Connection', 'WM · HubSpot (Zapier)'], ['Match on', 'Email'], ['Sets', 'First name, Last name, Phone, Enquiry source = Request the full portfolio']], 'Adds or updates the buyer in HubSpot.'),
    node('c3', 'action', 'Log the request', 'Airtable', 'Table', ['airtable'], 'Zapier · Airtable › Create Record', [['Connection', 'WM · Airtable (Zapier)'], ['Table', 'Portfolio requests'], ['Sets', 'Name, Email, Phone, Note, Requested on = today, Proof of funds = Awaiting']], 'Logs the request, so the director’s answer has a row to land on.'),
    node('c4', 'action', 'Send the portfolio', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'WM · Gmail (Zapier), signed in as private@westmere.la'], ['Template', 'The full Westmere portfolio'], ['Holds', 'a link to the full portfolio of fourteen developments; that the valuation figures are prepared by Kestrel Valuation Partners and available in full to qualified buyers; that the sales director will write; DRE #02114471, Equal Housing Opportunity'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer the full portfolio.'),
    node('c5', 'action', 'Tell the sales team', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram › Send Message', [['Connection', 'WM · Telegram (Zapier)'], ['Chat', 'Sales team, the group'], ['Says', 'the name, the note and a link to the row']], 'Puts the request in front of the sales team.'),
    node('c6', 'approve', 'Proof of funds?', 'Human in the Loop', 'UserCheck', ['zapier'], 'Zapier · Human in the Loop › Request approval', [['Reviewer', 'the sales director'], ['Shows', 'the name, the email and the day it was requested, on a Zapier review page'], ['Notifies', 'the sales director by email, with the link'], ['Choices', 'Approved or Rejected'], ['No answer', 'nothing is sent']], 'Emails the sales director the review page’s link. Once they have seen the buyer’s proof of funds themselves, they approve or reject it there.'),
    node('c7', 'action', 'Name the answer', 'Formatter', 'PencilSimple', ['zapier'], 'Zapier · Formatter by Zapier › Utilities › Lookup Table', [['Looks up', 'Human in the Loop’s result'], ['Approved', 'Confirmed'], ['Fallback', 'Not confirmed']], 'Turns the result into the word Proof of funds takes, which Confirmed only reads too.'),
    node('c8', 'action', 'Record the answer', 'Airtable', 'Database', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Portfolio requests'], ['Sets', 'Proof of funds = the lookup’s result, Confirmed or Not confirmed; Checked by = the sales director; Checked on = today']], 'Notes the answer on the request before anything is sent.'),
    node('c9', 'action', 'Confirmed only', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['The lookup’s result', 'exactly matches Confirmed']], 'Goes on only with the director’s yes. Not confirmed stops here, and nothing is sent.'),
    node('c10', 'action', 'Get the pack', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Zapier · Airtable › Find Record', [['Table', 'Documents'], ['Search field', 'Document'], ['Value', 'Kestrel valuation pack'], ['Success when nothing is found', 'Off, so a missing pack stops the run before any email'], ['If missing', 'the run is halted, and the New Halted Task zap posts it to /wm/failed']], 'Fetches the current valuation pack.'),
    node('c11', 'action', 'Send the pack', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'WM · Gmail (Zapier), signed in as private@westmere.la'], ['To', 'the buyer'], ['Cc', 'the sales director'], ['Attachments', 'the pack, from Documents'], ['Template', 'Your Kestrel valuation pack'], ['Holds', 'that the figures are prepared by Kestrel Valuation Partners; the sales director’s name and +1 310 555 0148; DRE #02114471, Equal Housing Opportunity'], ['Written by', 'a fixed template, not Claude']], 'Emails the buyer the valuation pack, in the sales director’s name.'),
    node('c12', 'end', 'Mark it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Zapier · Airtable › Update Record', [['Table', 'Portfolio requests'], ['Sets', 'Pack sent on = today']], 'Marks the request sent, so the director sees who has the pack.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'),
    edge('c6', 'c7'), edge('c7', 'c8'), edge('c8', 'c9'), edge('c9', 'c10'), edge('c10', 'c11'), edge('c11', 'c12'),
  ],
}

const H01: Workflow = {
  code: 'WM-H01',
  title: 'Alert the sales team',
  platform: 'n8n',
  outcome: 'Every message n8n sends the sales team reads the same way and lands in their Telegram group.',
  trigger: 'Called by WM-01, when a residence is not found, and by WM-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds a name, the residence, what happened and a link, never anything about who the buyer is beyond their name, and never a proof-of-funds answer.',
    'A failure arrives with sound; anything else arrives with sound Tuesday to Saturday, when the gallery holds viewings, and silently otherwise.',
    'WM-H02 is not set as WM-H01’s error workflow: a failure here would call WM-H02, which calls WM-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, urgent, link']], 'Another workflow hands over a message, and says whether it is urgent.'),
    node('h2', 'action', 'Add the link', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code, and a link to the contact or the failed run, when there is one']], 'Puts the flow’s code under the message, with a link to the contact or the failed run.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Sales team, the group'], ['Disable notification', 'on, unless urgent or Tuesday to Saturday']], 'Posts it in the sales team’s group.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'WM-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed or halted run, on any of the three platforms, is logged and reaches the sales team with what its platform gives about it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A row holds the platform, the flow, the time and what its source gives, never the buyer’s details. An n8n failure gives the failed step and a link to the run. A Make error route gives the step, the error and, from WM-02, the viewing’s day and time. A Zapier Manager zap gives the zap and the time, and for an error its message, with no step or run link. The run itself holds the buyer’s details, on its own platform.',
    'A failure is urgent: it arrives with sound. A halted Zapier run is an ordinary alert, sent as WM-H01 sends anything else.',
    'It never retries on its own. The sales director, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers WM-01 only, not WM-H01: WM-H01 is how this workflow alerts the sales team, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'WM-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'WM-01, as its error workflow'], ['Gives', 'the workflow, the failed step and a link to the run']], 'Starts whenever WM-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /wm/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/wm/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, and two Zapier Manager zaps, on New Zap Error and New Halted Task'], ['Carries', 'Make: the step, the error and the viewing’s day and time; Zapier: the zap, the time, and an error’s message; and failed or halted']], 'Starts when a Make error route reports a failed step in WM-02, or a Zapier Manager zap reports a failed or halted run of WM-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, time, failed or halted, then what the source gives: step, error, viewing day and time, zap, run link; a field the source does not give stays empty'], ['Include Other Input Fields', 'Off']], 'Puts every kind of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert the sales team', 'WM-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'WM-H01 · Alert the sales team'], ['Urgent', 'yes for a failure, no for a halted run']], 'Sends the sales team a Telegram message with the row’s fields: urgent for a failure, ordinary for a halt.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Westmere · Build plan',
  description: 'A build plan for Westmere, a Los Angeles residential developer: three flows on n8n, Make and Zapier, two helpers, a test matrix and a handover, planned before anything is built, with no buyer ever screened, sorted or scored on who they are.',
  kicker: 'BUILD PLAN · WESTMERE',
  heading: 'Every enquiry, viewing and portfolio request, planned before a single step is placed, and every buyer read by what they asked.',
  lede:
    'Three flows and two helpers for Westmere, the Los Angeles developer behind fourteen developments and 480 residences since 2009, with its sales gallery at 9200 Sunset Blvd, Suite 40, West Hollywood. Residence enquiries run on n8n, private viewings on Make and full-portfolio requests on Zapier. HubSpot holds the buyers and the New releases list, Airtable holds the residences, the team, portfolio requests and documents, Cal.com holds the viewings, and Google Sheets holds the logs. The site has no form, so each button opens a short panel or a booking page, and Download the brochure starts no flow at all. Westmere is an Equal Housing Opportunity developer, DRE #02114471: Claude reads only what a buyer asked, never who they are, and the sales director alone confirms proof of funds before Kestrel Valuation Partners’ valuation pack goes out. The brochure, the portfolio and the viewing confirmation are fixed templates and send on their own.',
  meta: [
    ['Client', 'Westmere · Los Angeles'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way an enquiry, a viewing or a request ends.',
    rail: [
      { heading: 'Why plan first', body: 'Westmere sells homes priced, for example, from $2,150,000 at Skyline Residences, and every buyer must be treated the same. A flow that sorts enquiries has to sort them on what the buyer asked and nothing else, and a valuation pack marked for qualified buyers has to wait for a person. This page pins that down before n8n, Make or Zapier is opened.' },
      { heading: 'The fair-housing rule', body: FAIR },
      { heading: 'Who says yes', body: YES },
    ],
    outcome: 'Every buyer who asks to view or talk reaches an agent within minutes and every enquiry gets the brochure, every private viewing is confirmed with its hosting agent, and every portfolio request gets the portfolio, with the valuation pack only after the sales director confirms proof of funds.',
    trigger: 'Six entry points: the panel Enquire on this residence opens, a private viewing booked, moved or cancelled in Cal.com, the panel Request the full portfolio opens, WM-01 or WM-H02 calling WM-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['With an agent or on the list, brochure sent', 'Viewing confirmed or cleared', 'Valuation pack sent, or nothing sent'],
    outOfScope: [
      'Deciding whether a buyer is qualified: proof of funds is the sales director’s call, by hand, and no step reads, scores or stores it',
      'Screening, sorting or scoring a buyer on anything a fair-housing rule protects: no step does, and no table has a field for it',
      'Offers, purchase agreements and escrow, which the sales team handles by hand',
      'The valuation itself, which Kestrel Valuation Partners prepares; the flows only send their pack as issued',
      'Listing a residence anywhere but Westmere’s own site: no flow reaches a listing site, and the sales team does that by hand',
      'The Document Q&A bot, the Viewing prep agent and the Buyer follow-up agent, planned on the AI agents page',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms and a sales team that works Tuesday to Saturday at the gallery. When a run fails on a viewing day, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'WM-[number] · [Title]', examples: ['WM-01 · Residence enquiry', 'WM-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Read the enquiry', 'Find the host', 'Send the pack'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/wm/[source]', examples: ['/wm/enquiry', '/wm/failed'], rule: 'One path per source, all lowercase.' },
      { name: 'Connections', pattern: 'WM · [Service] ([platform])', examples: ['WM · HubSpot (n8n)', 'WM · Gmail (Make)', 'WM · Airtable (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew. Every Gmail connection is signed in as private@westmere.la and connected by the sales director.' },
      { name: 'HubSpot properties', pattern: 'Plain words, one fixed list each', examples: ['Residence of interest', 'Enquiry source', 'Enquiry route'], rule: 'Enquiry source names the button: Enquire on this residence, Book a private viewing or Request the full portfolio. Enquiry route is With an agent or On the list.' },
      { name: 'Cal.com event types', pattern: 'What the buyer books', examples: ['Private viewing'], rule: 'One event type, round robin across the sales agents, Tuesday to Saturday at the sales gallery.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Residences', 'Team', 'Portfolio requests', 'Documents'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'HubSpot for the buyers, four Airtable tables for the work, and three sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'HubSpot holds who asked, the residence they asked about and their next viewing. Airtable holds the residences, the team, portfolio requests and the documents the flows send. Google Sheets holds the logs.' },
      { heading: 'One vocabulary per field', body: 'Every choice field takes one fixed list, and the flows, the templates and this page use the same words for it.' },
      { heading: 'Nothing about who a buyer is', body: 'No table has a field for a buyer’s family, origin, faith, age, health or any other trait a fair-housing law protects, or for a budget. Proof of funds lives only in Portfolio requests, as Confirmed or Not confirmed, never as an amount or a document.' },
    ],
    tables: [
      { name: 'Contacts (HubSpot)', fields: ['First name', 'Last name', 'Email', 'Phone', 'Residence of interest', 'Enquiry source', 'Enquiry message', 'Enquired on', 'Enquiry route', 'Brochure sent', 'Next viewing', 'Hosting agent'], note: 'One per buyer, matched on email. Residence of interest takes the five on the site: The Orchard Residences, Casa Verde, Skyline Residences, The Monument and The Estate, Malibu. Enquiry source is the button the buyer used last: Enquire on this residence, Book a private viewing or Request the full portfolio. Enquiry message is the buyer’s last enquiry, as they wrote it, and Enquired on its day; WM-01 sets both. Of the automated steps, only the Viewing prep and Buyer follow-up agents read them, and Claude takes from the message only what it asks about the residence; the sales team can also see them on the contact in HubSpot. Enquiry route is With an agent or On the list. The New releases list is a static HubSpot list of contacts.' },
      { name: 'Residences', fields: ['Residence', 'Slug', 'Area', 'Price', 'Bedrooms', 'Interior', 'Completion', 'Availability', 'Listing agent', 'Agent chat ID', 'Brochure'], note: 'One row per residence, the public facts as the site gives them: The Orchard Residences, Trousdale Estates, Beverly Hills, $12,750,000, 4 bedrooms and a study, 3,850 sq ft, completion 2027 Q2, 2 of 3 remaining; Casa Verde, Mandeville Canyon, Brentwood, $8,400,000; Skyline Residences, Bunker Hill, Downtown, from $2,150,000, 48 residences, 2028; The Monument, Century City; The Estate, Point Dume, Malibu. Listing agent links to Team, and Agent chat ID is a lookup.' },
      { name: 'Team', fields: ['Name', 'Email', 'Phone', 'Role', 'Telegram chat ID'], note: 'Everyone the flows name, one row per email. Role is Sales director or Sales agent. Each agent starts Westmere’s Telegram bot once, so the flows can message them.' },
      { name: 'Portfolio requests', fields: ['Name', 'Email', 'Phone', 'Note', 'Requested on', 'Proof of funds', 'Checked by', 'Checked on', 'Pack sent on'], note: 'One row per request, added by WM-03. Proof of funds is Awaiting, Confirmed or Not confirmed, and only the sales director’s answer sets it. The Waiting view lists every request still Awaiting, or Confirmed with no Pack sent on date.' },
      { name: 'Documents', fields: ['Document', 'File', 'Updated on', 'Kept by'], note: 'The files the flows attach that are not per residence. Document is Kestrel valuation pack, kept current by the sales director as Kestrel Valuation Partners issues it.' },
    ],
    stages: [
      ['Enquired', 'A buyer saved in HubSpot from a residence’s enquiry panel.'],
      ['With an agent', 'An enquiry that asked to view or talk, or gave a timeline within twelve months, sent to its listing agent.'],
      ['On the list', 'An enquiry on the New releases list, with the brochure.'],
      ['Viewing booked', 'A contact with a Next viewing and a hosting agent.'],
      ['Pack sent', 'A portfolio request the sales director confirmed, with the valuation pack sent.'],
    ],
    exitStages: [
      ['Cancelled', 'A viewing called off, its day and time cleared.'],
      ['Not confirmed', 'A request the sales director did not confirm; nothing sent, and the director writes personally.'],
      ['Unsubscribed', 'A buyer who left the New releases list from an email’s link.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier, with no buyer details'],
      ['Test matrix', 'The test rows below, with results'],
      ['Agent runs', 'One row per run of the Viewing prep or Buyer follow-up agent: the time, each tool call and who said yes, planned on the AI agents page'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [
      { heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook on n8n, Cal.com’s webhook into a Make scenario, a Catch Hook on Zapier. Failures from all three end in one sheet.' },
      { heading: 'The fourth button', body: 'Download the brochure starts nothing. It downloads the PDF from the page and asks for nothing, so no buyer is recorded for reading a brochure.' },
    ],
    rows: [
      ['The panel Enquire on this residence opens', 'Webhook POST /wm/enquiry', 'WM-01'],
      ['A private viewing booked, moved or cancelled', 'Cal.com webhook to a Make custom webhook', 'WM-02'],
      ['The panel Request the full portfolio opens', 'Webhooks by Zapier Catch Hook', 'WM-03'],
      ['WM-01 or WM-H02', 'Execute Sub-workflow', 'WM-H01'],
      ['An n8n run fails', 'Error Trigger', 'WM-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /wm/failed', 'WM-H02'],
    ],
  },
  workflows: [WM01, WM02, WM03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message the sales team with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test buyers, a test residence, test viewings and a test valuation pack before anything reaches a real buyer.' },
      { heading: 'Fair-housing rows', body: 'Rows t05 to t07, t21 and t24 prove the route and the viewing brief rest on what a buyer asked, never on who they are. The sales director signs them off before go-live.' },
      { heading: 'Test data', body: 'Test buyers have made-up names. Times and dates in these rows are illustrative.' },
    ],
    rows: [
      { id: 't01', workflow: 'WM-01', branch: 'Yes, asked to view', input: 'Test Buyer A, The Orchard Residences: “Could we see it one afternoon next week?”', expected: 'A contact with Residence of interest set; Asked to view true; the listing agent messaged on Telegram within minutes with the message as written; the brochure email; Enquiry route With an agent' },
      { id: 't02', workflow: 'WM-01', branch: 'Yes, a timeline', input: 'Test Buyer B, Casa Verde: “We hope to buy in Brentwood this spring.”', expected: 'Timeline Within 3 months or 3–12 months; the agent messaged; the brochure email' },
      { id: 't03', workflow: 'WM-01', branch: 'Not yet', input: 'Test Buyer C, Skyline Residences: “Lovely building, just keeping an eye on it.”', expected: 'No agent message; on the New releases list; the brochure email; Enquiry route On the list' },
      { id: 't04', workflow: 'WM-01', branch: 'Empty message', input: 'Test Buyer D sends the panel with no message', expected: 'Not said on all three; on the list; the brochure email' },
      { id: 't05', workflow: 'WM-01', branch: 'Same words, other names', input: 'The t03 message sent twice more, from two test buyers with names from different backgrounds', expected: 'The same three answers and the same route each time; the run shows Claude’s input held no name, email or phone' },
      { id: 't06', workflow: 'WM-01', branch: 'Another language', input: 'The t01 message written in Spanish', expected: 'Asked to view true, as for t01; the agent messaged; the brochure email' },
      { id: 't07', workflow: 'WM-01', branch: 'Who they are', input: 'The t03 message with a line about the buyer’s children and their faith added', expected: 'The same route as t03; Claude’s output holds the three answers only, with nothing about family or faith' },
      { id: 't08', workflow: 'WM-01', branch: 'Residence not found', input: 'A test enquiry from a residence slug missing from Residences', expected: 'The contact saved; an urgent message in the sales team’s group with a link to it; no brochure email from the flow' },
      { id: 't09', workflow: 'WM-01', branch: 'Asked before', input: 'Test Buyer A enquires again, the email in capitals with a trailing space', expected: 'One contact, updated' },
      { id: 't10', workflow: 'WM-01', branch: 'Claude fails', input: 'A test run with the Anthropic connection revoked', expected: 'The contact saved; after three tries the run fails; a row in Failed runs and an urgent alert with a link to the run' },
      { id: 't11', workflow: 'WM-02', branch: 'Booked, host found', input: 'Test Buyer A books a Thursday private viewing for The Orchard Residences', expected: 'Next viewing and Hosting agent on the contact; the host messaged on Telegram first; then one confirmation with the day and time, the gallery address, the host’s name and +1 310 555 0148' },
      { id: 't12', workflow: 'WM-02', branch: 'Sunday or Monday', input: 'Open the booking page and look for a Sunday or a Monday', expected: 'No time offered on either day; nothing runs' },
      { id: 't13', workflow: 'WM-02', branch: 'Moved', input: 'Test Buyer A moves t11’s viewing to Saturday', expected: 'Next viewing updated; the host messaged; then a new confirmation with Saturday' },
      { id: 't14', workflow: 'WM-02', branch: 'Cancelled', input: 'Test Buyer A cancels the viewing', expected: 'Next viewing and Hosting agent cleared; no email from Make' },
      { id: 't15', workflow: 'WM-02', branch: 'Host not in Team', input: 'A test viewing whose host has no row in Team', expected: 'The sales team asked on Telegram to add the agent; then the confirmation still sent' },
      { id: 't16', workflow: 'WM-02', branch: 'Email fails', input: 'A test run with the Gmail connection in Make revoked', expected: 'The contact saved; the host already messaged on Telegram; the error route posts to /wm/failed; a row in Failed runs with the step, the error and the viewing’s day and time, and an urgent alert; Make keeps the run to retry' },
      { id: 't23', workflow: 'WM-02', branch: 'Host message fails', input: 'A test viewing with the Telegram connection in Make revoked', expected: 'Tell the host’s error route posts to /wm/failed; a row in Failed runs and an urgent alert with the step, the error and the viewing’s day and time, never the buyer’s name; the Router still runs Then and the confirmation is sent; a person tells the host' },
      { id: 't24', workflow: 'WM-02', branch: 'Brief: who they are', input: 'Test Buyer C, whose Enquiry message asks about the pool and mentions their children and their faith, books a viewing; the Viewing prep agent runs beside WM-02', expected: 'The brief holds the residence’s facts and the question about the pool, quoted with its day, and nothing about family or faith; a buyer with no contact yet gets a facts-only brief' },
      { id: 't17', workflow: 'WM-03', branch: 'Confirmed', input: 'Test Buyer E requests the portfolio; the sales director approves on the review page', expected: 'The portfolio email and a message in the group at once; Proof of funds Confirmed with who and when; the pack emailed, copied to the director; Pack sent on set' },
      { id: 't18', workflow: 'WM-03', branch: 'Not confirmed', input: 'Test Buyer F requests the portfolio; the director rejects', expected: 'The portfolio email; Proof of funds Not confirmed; Confirmed only stops the Zap; no pack and no email saying no' },
      { id: 't19', workflow: 'WM-03', branch: 'Link only opened', input: 'Open t17’s review link from the email and close it without choosing', expected: 'Nothing recorded; still Awaiting; no pack' },
      { id: 't20', workflow: 'WM-03', branch: 'Pack missing', input: 'A test run with the Documents row renamed; the director approves', expected: 'Confirmed on the row; the run halts at Get the pack; no email; the New Halted Task zap posts it to /wm/failed, a few minutes later, a row in Failed runs with the zap and the time, and an alert to the sales team; the request in the Waiting view' },
      { id: 't21', workflow: 'WM-03', branch: 'The same review', input: 'Two test requests from buyers with names from different backgrounds', expected: 'The same portfolio email and the same review page, showing only the name, the email and the day; no field for anything else' },
      { id: 't22', workflow: 'WM-03', branch: 'A step fails', input: 'A test run with the Gmail connection in Zapier revoked, after the director approves', expected: 'Proof of funds Confirmed, no Pack sent on date; the New Zap Error zap posts it to /wm/failed; a row in Failed runs with the zap, the time and the error’s message, and an urgent alert' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order of their codes: enquiries on n8n, viewings on Make, then portfolio requests on Zapier. The fair-housing review comes last, before anything is turned on.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Add the contact properties and the New releases list in HubSpot', 'Create the Airtable tables Residences, Team, Portfolio requests and Documents', 'Create the Sheets tabs: Failed runs, Test matrix, Agent runs', 'Add the connections on each platform: WM · HubSpot, WM · Gmail for private@, WM · Telegram, WM · Airtable, WM · Anthropic', 'Build WM-H01 in n8n, then WM-H02 with WM-01 (not WM-H01) as the covered error workflow'] },
      { name: '2 · Enquiries on n8n', tasks: ['Fill Residences with the five residences, their facts as the site gives them, their listing agents and their brochures', 'Have each agent start the Telegram bot, and add their chat IDs to Team', 'Write the brochure template with the DRE number and Equal Housing Opportunity', 'Build WM-01 with only three attributes on Read the enquiry, and point the enquiry panel at /wm/enquiry', 'Run tests t01–t10'] },
      { name: '3 · Viewings on Make', tasks: ['Set up the Private viewing event type in Cal.com: round robin, Tuesday to Saturday, at the sales gallery', 'Point its webhook at the WM-02 custom webhook for booked, moved and cancelled', 'Build WM-02, every writing or sending module with an error route to /wm/failed', 'Write the Your private viewing template', 'Run tests t11–t16, t23 and t24'] },
      { name: '4 · Portfolio on Zapier', tasks: ['Add the Kestrel valuation pack to Documents', 'Build WM-03 with Name the answer and Record the answer before Confirmed only, and the Waiting view', 'Point the portfolio panel at the Catch Hook, and add the two Zapier Manager zaps, New Zap Error and New Halted Task, that post to /wm/failed', 'Run tests t17–t22'] },
      { name: '5 · Test and hand over', tasks: ['Review fair housing with the sales director: read Read the enquiry’s instructions and attributes, check no table has a field about who a buyer is, and sign off t05–t07, t21 and t24', 'Run the whole matrix again', 'Walk the sales director and the agents through the handover page, and turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Westmere keeps.',
    rail: [{ heading: 'Written for the sales director and the agents', body: 'One page, no jargon, for the people who meet every buyer. It lives next to the flows.' }],
    does: [
      'Saves every residence enquiry, has Claude read what the buyer asked, and sends the listing agent anyone who asked to view or talk or gave a timeline within twelve months.',
      'Sends every enquirer the same brochure, and puts everyone else on the New releases list.',
      'Tells the hosting agent of every private viewing the moment it is booked, then confirms it to the buyer in Westmere’s own words, with the host’s name.',
      'Sends every portfolio request the full portfolio, tells the sales team, and holds the valuation pack until the sales director confirms proof of funds.',
    ],
    breaks: [
      'Adding an attribute to Read the enquiry, or a field to any table, that holds anything about who a buyer is.',
      'Changing Ready to view? to read anything but Claude’s three answers.',
      'Renaming a field in Residences, Team, Portfolio requests or Documents, a HubSpot property, or changing the Residence of interest, Enquiry route or Proof of funds choices.',
      'Adding a step that sends the valuation pack without the sales director’s answer.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach the sales team on Telegram, with what each platform gives: the step and a link to the run from n8n, the step and the error from Make, the zap from Zapier.',
    logs: 'Every failed or halted run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message. Every contact keeps its enquiry route and its next viewing, and every portfolio request who checked it and when the pack went.',
  },
  footer: { note: 'A worked example. Westmere is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
