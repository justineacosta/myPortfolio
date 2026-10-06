/**
 * Westmere’s Automation case page (spec 2026-10-05 per-site pages): the three
 * flows behind its calls to action, a residence enquiry, a private viewing and
 * a request for the full portfolio. WM-01 is the general Automations page’s
 * Residence enquiry, kept and taken deeper: Claude reads only what the buyer
 * asked, never who they are, and an IF routes on that alone. The valuation
 * pack waits for a person to confirm proof of funds. data/cases/index.ts
 * registers it; `npm run cases` renders it into
 * public/cases/westmere-los-angeles/automation.html. Only type imports, so
 * Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

/** The licence line as the site prints it. Built from parts so the raw-colour check never reads the number as a hex colour. */
const DRE = `DRE #${'02114471'}`

const SITE = '/samples/westmere-los-angeles.html'
const NAME = 'Westmere'

const automation: Automations = {
  title: 'Westmere · Automation',
  description: 'The three flows behind Westmere’s residence enquiries, private viewings and full-portfolio requests, on n8n, Make and Zapier: what runs, in what order, and where a person steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · WESTMERE',
  heading: 'What happens after a buyer asks Westmere about a residence',
  lede: 'Westmere’s site has no form. It ends on four buttons: Enquire on this residence, Book a private viewing, Request the full portfolio and Download the brochure. On the sample site they are a demonstration and send nothing; these flows are the build behind them once it is live. Enquire on this residence opens a short panel for a name, an email, an optional phone and a message, with the residence filled in from the page, and sends it to n8n. Book a private viewing opens Westmere’s Cal.com booking page, which offers Tuesday to Saturday only, by appointment, at the sales gallery, 9200 Sunset Blvd, Suite 40, and Cal.com tells Make. Request the full portfolio opens a panel like the enquiry’s and sends it to Zapier. Download the brochure starts no flow: it downloads the PDF at once and asks for nothing. Westmere is an Equal Housing Opportunity developer, ' + DRE + ', so no step screens, sorts or scores a buyer on who they are. Claude works in the enquiry flow alone, and there it reads only what the buyer asked. A “qualified buyer” means proof of funds and nothing else, and only the sales director decides it, by hand. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Westmere, a fictional Los Angeles residential developer used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'WM-01',
      title: 'Residence enquiry',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Serious buyers reach an agent within minutes; everyone else still gets the brochure and stays on the list.',
      nodes: [
        node('wm-form', 'trigger', 'Enquiry form', 'Webhook', 'WebhooksLogo', ['n8n'], 'Catches an enquiry sent from a residence’s page. Enquire on this residence opens a short panel, a name, an email, an optional phone and a message, and the residence comes from the page it was opened on.', ['The residence', 'Name and email', 'Phone, if given', 'Their message'], 'Each enquiry carries the residence it came from, so the agent knows which home it is about.'),
        node('wm-contact', 'action', 'Add the contact', 'HubSpot', 'UserPlus', ['hubspot'], 'Adds the buyer to HubSpot, or updates them if this email has asked before, with the residence they asked about.', ['Name and email', 'Phone, if given', 'The residence'], 'Saved before anything is decided, so a later failure never loses who asked.'),
        node('wm-find', 'action', 'Find the residence', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Looks up the residence in Westmere’s Residences table for its listing agent and its brochure. If the residence is not there, the sales team is told at once and a person sends the brochure by hand.', ['The residence'], 'The listing agent and the brochure live in one row per residence, so a new release needs no change to the flow.'),
        node('wm-qualify', 'ai', 'Read the enquiry', 'Claude', 'Sparkle', ['claude'], 'Claude reads the message, and only the message and the residence, for three things the buyer stated: whether they asked to view, whether they asked to talk to someone, and any timeline they gave. It never sees their name, email or phone, never weighs a budget, and has no field for anything about who they are.', ['Their message', 'The residence'], 'Agents spend their time on the people asking to see a home, and the call rests only on what the buyer wrote, never on who they are.'),
        node('wm-ready', 'branch', 'Ready to view?', 'IF', 'ArrowsSplit', ['n8n'], 'Sends the enquiry to an agent when the buyer asked to view, asked to talk, or gave a timeline within twelve months, and everyone else to the list. A fixed rule on Claude’s three answers decides, not Claude.', ['Asked to view', 'Asked to talk', 'Timeline'], 'Two clear paths, so no enquiry falls between them, and neither one shuts anyone out: both get the brochure, and anyone can book a viewing.'),
        node('wm-alert', 'action', 'Alert the agent', 'Telegram', 'Bell', ['telegram'], 'Messages the residence’s listing agent on Telegram with the buyer’s name, the residence and their message as they wrote it.', ['Name', 'Their message', 'The residence', 'The listing agent'], 'A buyer who asked to view hears from a person within minutes, not days.'),
        node('wm-nurture', 'action', 'Nurture list', 'HubSpot', 'ListChecks', ['hubspot'], 'Adds the buyer to the New releases list in HubSpot, which hears about new residences as they launch. Every email from it carries an unsubscribe link.', ['Name and email', 'The residence'], 'Not ready today often means ready in six months, and an agent can still call anyone on the list.'),
        node('wm-brochure', 'action', 'Send the brochure', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the residence’s brochure and floor plans from private@westmere.la, a fixed template with the sales gallery’s address, +1 310 555 0148, ' + DRE + ' and Equal Housing Opportunity.', ['Name and email', 'The residence', 'The brochure'], 'Everyone who asks gets the same brochure straight away, whichever path they took.'),
        node('wm-note', 'action', 'Note the route', 'HubSpot', 'Database', ['hubspot'], 'Notes on the contact which path the enquiry took, With an agent or On the list, and the day the brochure went.', ['The path taken', 'The brochure sent'], 'The sales director can see every enquiry’s path, and check that the rule treats every buyer the same.'),
      ],
      edges: [
        edge('wm-form', 'wm-contact'),
        edge('wm-contact', 'wm-find'),
        edge('wm-find', 'wm-qualify'),
        edge('wm-qualify', 'wm-ready'),
        edge('wm-ready', 'wm-alert', 'Yes'),
        edge('wm-ready', 'wm-nurture', 'Not yet'),
        edge('wm-alert', 'wm-brochure'),
        edge('wm-nurture', 'wm-brochure'),
        edge('wm-brochure', 'wm-note'),
      ],
    },
    {
      code: 'WM-02',
      title: 'Private viewing',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'Every private viewing booked on the site is held Tuesday to Saturday at the sales gallery, confirmed to the buyer in Westmere’s own words, and known to its hosting agent the moment it is booked.',
      nodes: [
        node('wm-booked', 'trigger', 'Viewing booked', 'Cal.com webhook', 'CalendarCheck', ['cal-com', 'make'], 'Book a private viewing opens Westmere’s Cal.com page for a Private viewing. It offers times Tuesday to Saturday only, by appointment, at the sales gallery, and asks for a name, an email, a phone and which residence. Cal.com picks the hosting agent in turn and tells Make whenever a viewing is booked, moved or cancelled.', ['Name, email and phone', 'The residence', 'Day and time', 'The hosting agent'], 'Cal.com holds the calendar, so two buyers can never book the same hour, and no viewing lands on a Sunday or a Monday.'),
        node('wm-which', 'branch', 'Booked or cancelled?', 'Router', 'ArrowsSplit', ['make'], 'Sends a viewing that was booked or moved one way, and a cancelled one the other.', ['What happened'], 'A moved viewing needs a new confirmation; a cancelled one needs the record cleared.'),
        node('wm-save', 'action', 'Save the viewing', 'HubSpot API call', 'UserPlus', ['hubspot'], 'Adds or updates the buyer in HubSpot by email, with the residence, the viewing’s day and time and the hosting agent.', ['Name, email and phone', 'The residence', 'Day and time', 'The hosting agent'], 'One contact holds the enquiry and the viewing, so the agent who hosts sees both.'),
        node('wm-confirm', 'action', 'Confirm the viewing', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template from private@westmere.la: the day and time, 9200 Sunset Blvd, Suite 40, West Hollywood, the hosting agent’s name, and +1 310 555 0148 for a change.', ['Name and email', 'Day and time', 'The residence', 'The hosting agent'], 'A templated confirmation sends on its own and needs no one’s yes. It names the person who will meet them.'),
        node('wm-host', 'action', 'Find the host', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Asks Airtable’s Team table for the hosting agent by their email. Make an API call always returns one bundle with the list, even an empty one.', ['The hosting agent’s email'], 'The host is told directly, and an agent missing from Team is caught, not lost.'),
        node('wm-hostset', 'branch', 'Host found?', 'Router', 'ArrowsSplit', ['make'], 'Routes on the list’s length: one agent found goes to the host’s own chat, and an empty list goes to the sales team.', ['How many found'], 'A search that found nothing would end the run without a word. A list has a length to route on.'),
        node('wm-tellhost', 'action', 'Tell the host', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages the hosting agent on Telegram with the buyer’s name, the residence and the day and time.', ['Name', 'The residence', 'Day and time'], 'The agent who will open the gallery door knows the moment the viewing is booked.'),
        node('wm-tellteam', 'action', 'Tell the sales team', 'Telegram', 'Warning', ['telegram'], 'Tells the sales team’s group that a viewing is booked with a host who is not in Team, so a person adds them and tells the host.', ['The viewing', 'The hosting agent’s email'], 'No viewing is left without someone knowing who will host it.'),
        node('wm-clear', 'action', 'Clear the viewing', 'HubSpot API call', 'XCircle', ['hubspot'], 'Clears the viewing’s day and time on the buyer’s contact. Cal.com tells the hosting agent itself.', ['Email', 'What happened'], 'A cancelled viewing never shows as booked.'),
      ],
      edges: [
        edge('wm-booked', 'wm-which'),
        edge('wm-which', 'wm-save', 'Booked or moved'),
        edge('wm-which', 'wm-clear', 'Cancelled'),
        edge('wm-save', 'wm-confirm'),
        edge('wm-confirm', 'wm-host'),
        edge('wm-host', 'wm-hostset'),
        edge('wm-hostset', 'wm-tellhost', 'Found'),
        edge('wm-hostset', 'wm-tellteam', 'None'),
      ],
    },
    {
      code: 'WM-03',
      title: 'Full portfolio',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Every request gets the full portfolio of fourteen developments straight away and reaches the sales team, and Kestrel Valuation Partners’ valuation pack goes out only after the sales director confirms proof of funds.',
      nodes: [
        node('wm-request', 'trigger', 'Portfolio requested', 'Webhooks by Zapier', 'WebhooksLogo', ['zapier'], 'Request the full portfolio opens a short panel, a name, an email, an optional phone and a note, and sends it to Zapier.', ['Name and email', 'Phone, if given', 'Their note'], 'Zapier’s webhook trigger starts the Zap the moment the panel is sent.'),
        node('wm-log', 'action', 'Save and log', 'HubSpot + Airtable', 'Table', ['hubspot', 'airtable'], 'Adds or updates the buyer in HubSpot, and logs the request in Airtable’s Portfolio requests with Proof of funds set to Awaiting.', ['Name and email', 'Phone, if given', 'Their note'], 'The request is on record before anything is sent, and the sales director’s answer has a row to land on.'),
        node('wm-portfolio', 'action', 'Send the portfolio', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template from private@westmere.la with a link to the full portfolio of fourteen developments, as public as the brochure. It says the valuation figures are prepared by Kestrel Valuation Partners and available in full to qualified buyers, and that the sales director will write.', ['Name and email'], 'The portfolio is public, so it sends on its own; the valuation pack is not, so it waits.'),
        node('wm-team', 'action', 'Tell the sales team', 'Telegram', 'Bell', ['telegram'], 'Posts the request in the sales team’s Telegram group: the name, the note and a link to the row.', ['Name', 'Their note', 'The request'], 'The request goes to the sales team, as the site means it: a person writes to the buyer.'),
        node('wm-pof', 'approve', 'Proof of funds?', 'Human in the Loop', 'UserCheck', ['zapier'], 'Emails the sales director a link to a Zapier review page. Once they have seen the buyer’s proof of funds themselves, they approve or reject it there. Opening the link records nothing; only their choice on the page does.', ['The request', 'The sales director’s answer'], 'A qualified buyer means proof of funds and nothing else, and a person decides it. No step reads, scores or stores the proof itself.'),
        node('wm-answer', 'action', 'Record the answer', 'Formatter + Airtable', 'ListChecks', ['zapier', 'airtable'], 'Turns the answer into Confirmed or Not confirmed and writes it on the request, with who checked and when.', ['The sales director’s answer'], 'Written before anything is sent, so a Not confirmed is on the row too.'),
        node('wm-only', 'action', 'Confirmed only', 'Filter by Zapier', 'Funnel', ['zapier'], 'Goes on only when the sales director confirmed proof of funds. Otherwise it stops: nothing is sent, and the director writes to the buyer personally.', ['Proof of funds'], 'Only a person’s yes releases the valuation pack, and no buyer ever gets an automated no.'),
        node('wm-pack', 'action', 'Send the pack', 'Gmail + Airtable', 'FileText', ['gmail', 'airtable'], 'Fetches the current valuation pack from Airtable and emails it in the sales director’s name, a fixed template with the pack attached as Kestrel Valuation Partners issued it.', ['Name and email', 'The valuation pack', 'The sales director'], 'A templated email with a pack a person has released sends on its own.'),
        node('wm-sent', 'action', 'Mark it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Sets the day the pack went on the request.', ['The request'], 'The sales director can see at a glance who has the pack and who is still waiting.'),
      ],
      edges: [
        edge('wm-request', 'wm-log'),
        edge('wm-log', 'wm-portfolio'),
        edge('wm-portfolio', 'wm-team'),
        edge('wm-team', 'wm-pof'),
        edge('wm-pof', 'wm-answer'),
        edge('wm-answer', 'wm-only'),
        edge('wm-only', 'wm-pack'),
        edge('wm-pack', 'wm-sent'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Westmere is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
