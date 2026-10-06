/**
 * Riverdale & Brooks’s Automation case page (spec 2026-10-05 per-site pages):
 * the three flows behind a consultation request, the monthly invoice for
 * hourly matters and a matter’s milestone notice. Nothing confidential enters
 * any of them: they carry names, contact details, the area of law and
 * scheduling or billing data only. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/riverdale-and-brooks/automation.html. Only type imports, so
 * Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/riverdale-and-brooks.html'
const NAME = 'Riverdale & Brooks'

const automation: Automations = {
  title: 'Riverdale & Brooks · Automation',
  description: 'The three flows behind Riverdale & Brooks’s consultation requests, its monthly invoices for hourly matters and its matter milestone notices, on n8n, Make and Zapier: what runs, in what order, and where Daniel A. Brooks and Ruth step in. They carry contact, area, scheduling and billing data only.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · RIVERDALE & BROOKS',
  heading: 'What happens after someone asks Riverdale & Brooks for a consultation',
  lede: 'The Riverdale & Brooks site has one form, Request a consultation: a full name, phone, email, the area of law and, if they like, a few sentences about their situation. It says sending it creates no attorney-client relationship, and asks people not to include confidential details yet. One rule sits above all three flows: nothing confidential enters them, or Claude, HubSpot or Airtable. They carry names, contact details, the area of law and scheduling or billing data only. The few sentences go to Daniel’s own inbox and nowhere else, the conflict check is done by hand, and what a matter is about stays with Daniel. Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out, and none of these flows uses Claude at all: every email is a fixed template. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Riverdale & Brooks, a fictional law practice used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'RB-01',
      title: 'Consultation request',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every consultation request is answered within a minute with the right fee and a link to book 30 minutes in the office or by video, Ruth knows who asked, and anything written about a situation reaches Daniel’s inbox alone.',
      nodes: [
        node('rb-form', 'trigger', 'Consultation request', 'Webhook', 'WebhooksLogo', ['n8n'], 'Catches Request a consultation the moment someone presses Send request: the full name, phone, email, What is this about? and, if they wrote any, the few sentences about their situation.', ['Full name', 'Phone', 'Email', 'What is this about?', 'A few sentences about your situation (optional)'], 'The form is the site’s one way in besides the phone. Sending it creates no attorney-client relationship, and the form asks people not to include confidential details yet, so the flow treats the few sentences as something only Daniel reads.'),
        node('rb-keep', 'action', 'Keep contact and area', 'Edit Fields', 'Funnel', ['n8n'], 'Keeps the name, phone, email and area, and drops the few sentences before any step stores or sends anything. Only two later steps reach back to the form for them: the check on whether they were written, and the email to Daniel.', ['The whole form'], 'Flows carry contact details and the area of law only. The few sentences stay behind, for the one step that sends them to Daniel.'),
        node('rb-save', 'action', 'Save the contact', 'Airtable', 'AddressBook', ['airtable'], 'Adds the person to Contacts, or updates their row if this email has asked before: the name, phone, email, the area they asked about and when.', ['Full name', 'Phone', 'Email', 'What is this about?'], 'One row per person, with contact and area fields only, saved before any email goes out, so a later failure never loses who asked.'),
        node('rb-said', 'branch', 'Situation written?', 'IF', 'ArrowsSplit', ['n8n'], 'Checks, without keeping them, whether the few sentences were filled in, reading them straight from the form step.', ['A few sentences about your situation (optional)'], 'The field is optional. When it is blank there is nothing for Daniel, and no empty email.'),
        node('rb-daniel', 'action', 'To Daniel’s inbox', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the few sentences, exactly as typed, with the name and area, to Daniel’s own address, daniel@riverdalebrooks.law, from that same account. It is the only step that sends them, and they never reach office@, where the inbox agent sorts mail.', ['Full name', 'What is this about?', 'A few sentences about your situation (optional)'], 'Whatever someone writes before a conflict check and a signed engagement letter goes to the attorney alone. Claude never reads it, no table keeps it, and n8n saves no copy of the run.'),
        node('rb-area', 'branch', 'Estate planning?', 'Switch', 'ArrowsSplit', ['n8n'], 'Sends an Estate planning & probate request to the free consultation reply, and every other area, Something else included, to the $150 reply.', ['What is this about?'], 'The site states the cost before booking: estate planning consultations are free, and for other matters the first thirty minutes cost $150, credited toward the fee.'),
        node('rb-free', 'action', 'Free consult reply', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template from office@riverdalebrooks.law: the first consultation is free, a link to book 30 minutes in the office or by video, 114 East Main Street and the free lot behind it, what to bring, that wills are still signed in person with witnesses, and that writing to the firm creates no attorney-client relationship, so please don’t send confidential details yet.', ['Full name', 'Email', 'The estate planning booking link'], 'A templated reply sends on its own and needs no one’s yes. It lands within a minute, well inside the one business day the site promises.'),
        node('rb-paid', 'action', '$150 consult reply', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the same template with the other price: the first thirty minutes cost $150, credited toward the fee if they hire the firm, and the link to book. It adds the site’s line that the firm doesn’t handle criminal defense or personal injury, and that a call to (540) 555-0148 gets a referral to colleagues it trusts.', ['Full name', 'Email', 'The consultation booking link'], 'The cost is in writing before anyone books, as the site promises, and someone whose need sits outside the six areas learns where to call.'),
        node('rb-ruth', 'action', 'Alert Ruth', 'Telegram', 'Bell', ['telegram'], 'Messages Ruth on Telegram the name, phone, area and which reply went out, and whether a note went to Daniel, never what it says.', ['Full name', 'Phone', 'What is this about?', 'The reply sent'], 'Ruth books the office and makes the follow-up call. She knows who asked without reading anything they wrote.'),
      ],
      edges: [
        edge('rb-form', 'rb-keep'),
        edge('rb-keep', 'rb-save'),
        edge('rb-save', 'rb-said'),
        edge('rb-said', 'rb-area', 'Left blank'),
        edge('rb-said', 'rb-daniel', 'Written'),
        edge('rb-daniel', 'rb-area'),
        edge('rb-area', 'rb-free', 'Estate planning'),
        edge('rb-area', 'rb-paid', 'Other areas'),
        edge('rb-free', 'rb-ruth'),
        edge('rb-paid', 'rb-ruth'),
      ],
    },
    {
      code: 'RB-02',
      title: 'Monthly invoice',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'On the 1st, every open hourly matter’s time is drafted into a Stripe invoice, itemized to the tenth of an hour, and none goes out until Daniel has checked it and pressed Send.',
      nodes: [
        node('rb-first', 'trigger', 'On the 1st', 'Make schedule', 'Clock', ['make'], 'On the 1st of each month at 7:00 am, Make starts the monthly invoice run.', ['The date'], 'The site promises hourly matters are billed monthly. One run on the 1st covers the month just ended.'),
        node('rb-matters', 'action', 'Find hourly matters', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Asks Airtable for every open hourly matter: engaged, billed hourly and not closed. Make an API call always returns one bundle with the list, even an empty one.', ['The Matters table'], 'Flat-fee work, wills, trusts, powers of attorney, most real estate closings and uncontested divorces, is never invoiced here.'),
        node('rb-entries', 'action', 'Gather time entries', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'For each matter, lists the time entries dated before the 1st and on no invoice yet: the date, the kind of work from a fixed list, and the hours, to the tenth of an hour.', ['The matter', 'The Time entries table'], 'Itemized to the tenth of an hour, as the site promises. The list also catches an entry logged late, from an earlier month.'),
        node('rb-ready', 'branch', 'Ready to bill?', 'Router', 'ArrowsSplit', ['make'], 'Routes on the list’s length: a matter with time logged and a Stripe customer goes on to be drafted, and one with time but no Stripe customer goes to Ruth. With no time logged, neither route passes and the matter ends there, with nothing drafted.', ['How many entries', 'The client’s Stripe customer'], 'A search that found nothing would end the route. A list has a length to route on, so no matter is dropped without a reason.'),
        node('rb-draft', 'action', 'Draft the invoice', 'Stripe API call', 'Receipt', ['stripe', 'airtable'], 'Creates the invoice in Stripe as a draft, one line per entry: the date, the kind of work, the hours and the amount at the matter’s hourly rate. The footer says it can be paid online or by check. Each entry is then marked with the invoice, so it is never billed twice.', ['The time entries', 'The hourly rate', 'The client’s Stripe customer'], 'A draft goes to no one. Stripe holds it until Daniel sends it.'),
        node('rb-ask', 'action', 'Ask Ruth', 'Telegram', 'Warning', ['telegram'], 'Tells Ruth on Telegram that a matter has time logged but its client has no Stripe customer yet. Once she adds the client in Stripe and the customer on their row, she runs the scenario once more, and the draft follows.', ['The matter', 'The hours logged'], 'An invoice needs a customer in Stripe, and guessing one would bill the wrong person.'),
        node('rb-tell', 'action', 'Tell Daniel', 'Gmail', 'EnvelopeSimple', ['gmail'], 'At 7:30, a second scenario lists every draft invoice waiting in Stripe and emails Daniel each one’s client, total and a link to it in Stripe’s dashboard. The link only opens the draft; it sends nothing.', ['The drafts in Stripe'], 'Daniel approves every invoice before it goes out, so he gets the whole list in one place, the morning they are drafted.'),
        node('rb-yes', 'approve', 'Daniel approves', 'In Stripe, by hand', 'UserCheck', ['stripe'], 'Daniel opens each draft, checks every line against his time, corrects or removes a line if he must, and presses Send invoice. Stripe then emails the invoice to the client. Until he does, nothing reaches the client.', ['The draft invoice'], 'The money rule: a monthly invoice goes out only after Daniel’s yes, and only his own click in Stripe gives it.'),
        node('rb-settled', 'wait', 'Paid', 'Online or by check', 'CreditCard', ['stripe'], 'The client pays online, on Stripe’s invoice page, or by check to the office. Ruth marks a check paid in Stripe by hand.', ['The sent invoice'], 'Both ways the site offers end in the same place: the invoice marked paid in Stripe.'),
      ],
      edges: [
        edge('rb-first', 'rb-matters'),
        edge('rb-matters', 'rb-entries'),
        edge('rb-entries', 'rb-ready'),
        edge('rb-ready', 'rb-draft', 'Time logged'),
        edge('rb-ready', 'rb-ask', 'No Stripe'),
        edge('rb-ask', 'rb-draft'),
        edge('rb-draft', 'rb-tell'),
        edge('rb-tell', 'rb-yes'),
        edge('rb-yes', 'rb-settled'),
      ],
    },
    {
      code: 'RB-03',
      title: 'Milestone notice',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Every time a client’s matter moves forward, the client hears where it stands from Daniel’s own address, as the template or with a line Daniel adds and sends himself.',
      nodes: [
        node('rb-stage', 'trigger', 'Stage moved', 'Airtable', 'Table', ['airtable'], 'Starts when Ruth moves a matter to another stage in Matters: one of the site’s six steps, from Consultation to Resolution.', ['The matter', 'Stage', 'The client’s name and email'], 'Ruth already keeps each matter’s stage. Moving it is the milestone, so the notice asks nothing more of her.'),
        node('rb-only', 'action', 'Clients only', 'Filter by Zapier', 'Funnel', ['zapier'], 'Goes on only when the matter has a signed engagement letter, the client has an email, and the stage has moved past the last one noticed.', ['Engagement signed on', 'Email', 'Step number', 'Last notice step'], 'An attorney-client relationship begins only after a conflict check and a signed engagement letter, so nobody gets a matter update before then. A stage moved back, or saved twice, sends nothing.'),
        node('rb-log', 'action', 'Log the notice', 'Airtable', 'ListChecks', ['airtable'], 'Notes on the matter the step reached, the date and which way the notice goes, Template or With Daniel, and unticks Daniel adds a line, before anything is sent.', ['The matter', 'Step number', 'Daniel adds a line'], 'Both ways need it, and Zapier paths never join again, so it comes before the paths. Noted first, the same stage can never send twice.'),
        node('rb-line', 'branch', 'Daniel adds a line?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Takes the Template only path, or, when Daniel adds a line was ticked on the matter, the Add a line path.', ['Daniel adds a line, as the stage moved'], 'Daniel may add a line to any notice. He ticks the box on the matter, or asks Ruth to, before the stage moves.'),
        node('rb-hold', 'action', 'Draft it for Daniel', 'Gmail', 'PencilSimple', ['gmail'], 'Writes the fixed template as a draft in Daniel’s Gmail, to the client, with a marked space for his line.', ['Name and email', 'Area', 'Stage'], 'What Daniel writes about a matter is his to send. The flow only puts the template in his drafts, so his line never passes through Zapier or Airtable.'),
        node('rb-nudge', 'action', 'Let Daniel know', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages Daniel on Telegram that a notice for the matter is waiting in his drafts.', ['The matter', 'Stage'], 'A draft nobody knows about never goes out.'),
        node('rb-out', 'action', 'Notice goes out', 'Gmail', 'EnvelopeSimple', ['gmail'], 'The client gets a fixed “where your matter stands” email from Daniel’s address: the area of law, the stage it has reached, what that step means and what comes next, in the site’s own words, and how to reach him. On Template only, Zapier sends it at once. On Add a line, Daniel sends his draft himself, once his line is in.', ['Name and email', 'Area', 'Stage'], 'A templated notice sends on its own, and Daniel’s own line goes out by his hand. Either way a reply reaches Daniel, not a shared inbox, as the site promises.'),
      ],
      edges: [
        edge('rb-stage', 'rb-only'),
        edge('rb-only', 'rb-log'),
        edge('rb-log', 'rb-line'),
        edge('rb-line', 'rb-out', 'Template only'),
        edge('rb-line', 'rb-hold', 'Add a line'),
        edge('rb-hold', 'rb-nudge'),
        edge('rb-nudge', 'rb-out'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
