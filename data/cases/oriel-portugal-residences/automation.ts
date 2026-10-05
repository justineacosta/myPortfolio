/**
 * Oriel’s Automation case page (spec 2026-10-05 per-site pages): the three
 * flows behind its viewing form, its studio inbox and its model revisions.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/oriel-portugal-residences/automation.html. Only type imports,
 * so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/oriel-portugal-residences.html'

const automation: Automations = {
  title: 'Oriel · Automation',
  description: 'The three flows behind Oriel’s viewing form, studio inbox and model revisions, on n8n, Make and Zapier: what runs, in what order, and where an architect steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · ORIEL',
  heading: 'What happens after someone asks Oriel for a viewing',
  lede: 'Oriel’s site ends on one form, a private viewing, and one address, the studio’s inbox. These are the flows behind both, and the one that keeps buyers told when a residence’s model changes. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Oriel, a fictional developer used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'OR-01',
      title: 'Private viewing',
      site: 'Oriel',
      href: SITE,
      platform: 'n8n',
      outcome: 'Every viewing request has an architect, a ninety-minute slot and a confirmation within one working day, and a home viewing has its headset on the way.',
      nodes: [
        node('or-form', 'trigger', 'Viewing form', 'Webhook', 'WebhooksLogo', [], 'Catches the private viewing form the moment someone presses Request a viewing.', ['Name', 'Email', 'Which residence?', 'Where?'], 'The form asks four things and no more, so the flow has to work from exactly those four.'),
        node('or-qualify', 'ai', 'Qualify the request', 'Claude', 'Sparkle', ['claude'], 'Claude checks the request against HubSpot: a new buyer, someone who has walked a model before, or an owner coming back. It writes one line for the architect on who is coming and what they asked to see.', ['Name', 'Email', 'Which residence?', 'Their HubSpot history'], 'A returning buyer is never greeted as a stranger, and the architect knows who they are walking with.'),
        node('or-which', 'branch', 'Which residence?', 'IF', 'ArrowsSplit', [], 'Sends a request that names a residence one way, and Not sure yet the other.', ['Which residence?'], 'An architect from the project walks every viewing, so the residence decides who goes.'),
        node('or-architect', 'action', 'Match the architect', 'Airtable', 'IdentificationBadge', ['airtable'], 'Looks up the project architect for Pinhal, Lioz, Socalco or Eucalipto in the projects table.', ['Which residence?', 'The projects table'], 'The person who drew the residence answers questions about it best.'),
        node('or-duty', 'action', 'Architect on duty', 'Airtable', 'UsersThree', ['airtable'], 'Picks the architect on studio duty that week, who can open all four models.', ['The studio duty rota'], 'Someone still choosing needs an architect who can walk them through every residence, not just one.'),
        node('or-book', 'action', 'Hold a viewing', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Holds the first free ninety-minute slot in that architect’s calendar, at the studio or at the buyer’s home.', ['The architect', 'Where?'], 'A held slot turns a request into a date, and the buyer can still move it with one click.'),
        node('or-where', 'branch', 'Where?', 'IF', 'ArrowsSplit', [], 'Sends a studio viewing straight to the confirmation, and a home viewing to the headset first.', ['Where?'], 'Only a home viewing needs anything carried to it.'),
        node('or-headset', 'action', 'Send the headset', 'Courier', 'VirtualReality', [], 'Books the courier to bring a headset, with the residence’s model loaded, the day before the viewing and to collect it the day after. The courier asks the buyer for the address.', ['The held slot', 'Which residence?', 'Name and email'], 'A home viewing only works if the headset arrives ready to walk.'),
        node('or-confirm', 'action', 'Confirm the viewing', 'Gmail + HubSpot', 'EnvelopeSimple', ['gmail', 'hubspot'], 'Emails the date, the time, the architect’s name and either the studio at Rua de São Bento 318 or the headset delivery, with a link to move it. Logs the viewing on the buyer’s HubSpot contact.', ['Name and email', 'The held slot', 'The architect', 'Where?'], 'The site promises a reply within one working day; this is that reply, and the record the later follow-up reads.'),
      ],
      edges: [
        edge('or-form', 'or-qualify'),
        edge('or-qualify', 'or-which'),
        edge('or-which', 'or-architect', 'A residence'),
        edge('or-which', 'or-duty', 'Not sure yet'),
        edge('or-architect', 'or-book'),
        edge('or-duty', 'or-book'),
        edge('or-book', 'or-where'),
        edge('or-where', 'or-confirm', 'At the studio'),
        edge('or-where', 'or-headset', 'At home'),
        edge('or-headset', 'or-confirm'),
      ],
    },
    {
      code: 'OR-02',
      title: 'Studio inbox',
      site: 'Oriel',
      href: SITE,
      platform: 'make',
      outcome: 'Every email to studio@oriel.pt reaches the person who should answer it, and every buyer lands in HubSpot.',
      nodes: [
        node('or-mail', 'trigger', 'Mail to the studio', 'Gmail', 'Tray', ['gmail'], 'Watches studio@oriel.pt and picks up each new email as it arrives.', ['The sender', 'The subject', 'The message'], 'Contact the studio is a plain email link on the site, so the inbox is where those messages land.'),
        node('or-sort', 'ai', 'Sort the email', 'Claude', 'Sparkle', ['claude'], 'Claude reads the email and names its kind: a buyer, an owner after handover, the press, a supplier or a job applicant. It adds a one-line summary and the residence, if one is named.', ['The sender', 'The subject', 'The message'], 'One read decides where the email goes, so nobody spends the morning triaging.'),
        node('or-router', 'branch', 'Router', 'Which kind?', 'ArrowsSplit', [], 'Sends each email down the route for its kind, and anything Claude cannot place to a person.', ['Claude’s kind'], 'Make’s router keeps all six routes on one canvas, so a missing one is easy to spot.'),
        node('or-buyer', 'action', 'Log the buyer', 'HubSpot', 'Handshake', ['hubspot'], 'Adds or updates the buyer’s contact in HubSpot, linked to the residence, with the summary as a note and a task for sales.', ['The sender', 'Claude’s summary', 'The residence'], 'Buyers who write instead of using the form still end up on the same board.'),
        node('or-owner', 'action', 'Open a care request', 'Airtable', 'House', ['airtable'], 'Finds the owner’s home in the handover table and opens a care request for its project team.', ['The sender', 'Claude’s summary', 'The handover table'], 'The team answers from the model, which shows what sits behind every wall.'),
        node('or-press', 'action', 'Pass to the founders', 'Telegram', 'Newspaper', ['telegram'], 'Messages Inês and Tomás with the outlet, the question and any deadline.', ['The sender', 'Claude’s summary'], 'Press questions have deadlines, and the founders answer them.'),
        node('or-supplier', 'action', 'Forward to site team', 'Gmail', 'Truck', ['gmail'], 'Forwards the email to the site team for the residence it names.', ['The message', 'The residence'], 'Deliveries and quotes go to the people on site, not to sales.'),
        node('or-applicant', 'action', 'Add to hiring', 'Airtable', 'Briefcase', ['airtable'], 'Adds the applicant, their role and their attachments to the hiring table.', ['The sender', 'The message', 'Attachments'], 'Every applicant is on one list, so no letter sits unread in the inbox.'),
        node('or-unsure', 'action', 'Flag for a person', 'Gmail', 'Question', ['gmail'], 'Labels the email Check and leaves it in the inbox.', ['The message'], 'A guess sends mail to the wrong person; a label keeps it in front of someone.'),
      ],
      edges: [
        edge('or-mail', 'or-sort'),
        edge('or-sort', 'or-router'),
        edge('or-router', 'or-buyer', 'Buyer'),
        edge('or-router', 'or-owner', 'Owner'),
        edge('or-router', 'or-press', 'Press'),
        edge('or-router', 'or-supplier', 'Supplier'),
        edge('or-router', 'or-applicant', 'Applicant'),
        edge('or-router', 'or-unsure', 'Not sure'),
      ],
    },
    {
      code: 'OR-03',
      title: 'Model revision notice',
      site: 'Oriel',
      href: SITE,
      platform: 'zapier',
      outcome: 'Everyone who walked a residence hears, in plain words, what changed in its model, and only after its architect has read the note.',
      nodes: [
        node('or-revision', 'trigger', 'New model revision', 'Airtable', 'Cube', ['airtable'], 'Starts the Zap when a new revision row is added for a residence’s model.', ['The residence', 'The revision number', 'The change log'], 'The revisions table is where the studio already records each change to a model.'),
        node('or-walkers', 'action', 'Find who walked it', 'HubSpot', 'UsersThree', ['hubspot'], 'Finds every contact with a viewing of that residence logged in HubSpot.', ['The residence', 'Viewings in HubSpot'], 'The people who walked the model are the ones whose picture of it is now out of date.'),
        node('or-note', 'ai', 'Write the note', 'Claude', 'Sparkle', ['claude'], 'Claude turns the change log into a short, plain note: which rooms changed, what changed in them, and what it means for living there.', ['The change log', 'The residence'], 'A change log is written for builders; a buyer needs the same facts in their own words.'),
        node('or-approve', 'approve', 'Architect approves?', 'Telegram', 'UserCheck', ['telegram'], 'Sends the project architect the note and the change log, with Approve and Rewrite buttons. A change still being settled is simply left unapproved.', ['Claude’s note', 'The change log'], 'Nothing about a residence reaches a buyer until the architect who drew it agrees.'),
        node('or-rewrite', 'wait', 'Architect rewrites', 'Telegram reply', 'PencilSimple', ['telegram'], 'Waits for the architect to reply with the note as it should read.', ['The architect’s reply'], 'The architect corrects the note in the same chat, without opening another tool.'),
        node('or-send', 'action', 'Send to each buyer', 'Gmail', 'PaperPlaneTilt', ['gmail'], 'Emails each person the note by name, with a link to book another walk.', ['The approved note', 'Who walked it'], 'Buyers hear about a change from Oriel before they notice it on site.'),
        node('or-log', 'action', 'Log on each contact', 'HubSpot', 'ClipboardText', ['hubspot'], 'Adds the note and the revision number to each contact’s timeline.', ['The approved note', 'The revision number', 'Who walked it'], 'Whoever speaks to the buyer next knows what they have been told.'),
      ],
      edges: [
        edge('or-revision', 'or-walkers'),
        edge('or-walkers', 'or-note'),
        edge('or-note', 'or-approve'),
        edge('or-approve', 'or-send', 'Approve'),
        edge('or-approve', 'or-rewrite', 'Rewrite'),
        edge('or-rewrite', 'or-send'),
        edge('or-send', 'or-log'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
