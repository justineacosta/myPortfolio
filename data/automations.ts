/**
 * The flows behind the Automations card (docs/superpowers/plans/2026-10-01-automations-flows.md §0):
 * what runs after someone sends the form on four of the sample sites in
 * public/samples/. scripts/make-automations.ts renders it into
 * public/automations.html, and components/projects/FlowPeek.tsx draws each
 * flow's main route on the card. Only type imports, so Node can run it directly.
 */
import type { SiteLink } from '../lib/brand/render.ts'
import type { ToolId } from '../lib/brand/tools.ts'

export type Platform = 'n8n' | 'make' | 'zapier'
export type FlowKind = 'trigger' | 'ai' | 'branch' | 'approve' | 'wait' | 'action'
/** A step: `what` it does, what it `reads` from the form or earlier steps, and `why` it is there. `icon` is a Phosphor name without "Icon". */
export type FlowNode = { id: string; kind: FlowKind; label: string; sub: string; icon: string; tools: ToolId[]; what: string; reads: string[]; why: string }
export type FlowEdge = { from: string; to: string; label?: string }
export type Flow = { code: string; title: string; site: string; href: string; platform: Platform; outcome: string; nodes: FlowNode[]; edges: FlowEdge[] }
export type Automations = {
  /** Set on a per-site copy: where its site lives and its own path. */
  site?: SiteLink
  title: string
  description: string
  /** The link back to the portfolio, shown when the page is opened on its own. */
  home: string
  kicker: string
  heading: string
  lede: string
  sample: string
  tabsLabel: string
  seeSite: string
  panel: { reads: string; why: string; close: string }
  flows: Flow[]
  footer: { note: string; by: string }
}

/** Each platform's name and logo, for the tabs, the card and the hero strip. */
export const PLATFORMS: Record<Platform, { name: string; tool: ToolId }> = {
  n8n: { name: 'n8n', tool: 'n8n' },
  make: { name: 'Make', tool: 'make' },
  zapier: { name: 'Zapier', tool: 'zapier' },
}

/** What each kind of step means, for the panel's kind line and the screen-reader step lists. */
export const KIND_LABELS: Record<FlowKind, string> = {
  trigger: 'Starts it',
  ai: 'Claude',
  branch: 'Decides',
  approve: 'A person approves',
  wait: 'Waits for a reply',
  action: 'Step',
}

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

/** A flow's main route: from its start, always the first way out, to an end. The card draws this one. */
export function mainRoute(f: Flow): string[] {
  const entered = new Set(f.edges.map((e) => e.to))
  const route = [f.nodes.find((n) => !entered.has(n.id))!.id]
  for (let next = f.edges.find((e) => e.from === route[0]); next; next = f.edges.find((e) => e.from === route[route.length - 1])) route.push(next.to)
  return route
}

export const automations: Automations = {
  title: 'Automations · Justine Acosta',
  description: 'The flows behind four sample sites’ forms, on n8n, Make and Zapier: what runs, in what order, and where a person steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATIONS · FOUR LIVE FLOWS',
  heading: 'What happens after someone hits send',
  lede: 'Each sample site ends on a form. These are the flows behind four of them. Pick a site, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for the fictional businesses used across this portfolio, not client projects.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'HP-01',
      title: 'Moving estimate',
      site: 'Harbor & Pine',
      href: '/samples/harbor-and-pine-moving.html',
      platform: 'n8n',
      outcome: 'Every estimate request gets a priced reply the same day, and nothing goes out until a coordinator says yes.',
      nodes: [
        node('hp-form', 'trigger', 'Estimate form', 'Webhook', 'WebhooksLogo', [], 'Catches the estimate form the moment someone sends it.', ['Moving from', 'Moving to', 'Target moving date', 'Home or office size', 'Service', 'Name, email and phone'], 'One webhook per form means one place to look when a request goes missing.'),
        node('hp-price', 'ai', 'Price the move', 'Claude', 'Sparkle', ['claude'], 'Claude drafts a price from the size of the home, the distance and the service, using the company’s rate card.', ['Home or office size', 'Moving from and to', 'Service', 'The rate card'], 'A first draft in seconds, so the coordinator checks a number instead of building one.'),
        node('hp-approve', 'approve', 'Approve?', 'Telegram', 'UserCheck', ['telegram'], 'Sends the coordinator the request and Claude’s price, with Approve and Edit buttons.', ['Claude’s price', 'The request'], 'No price reaches a customer without a person agreeing to it.'),
        node('hp-adjust', 'wait', 'Coordinator adjusts', 'Telegram reply', 'PencilSimple', ['telegram'], 'Waits for the coordinator to reply with the corrected price.', ['The coordinator’s reply'], 'Edits happen in the same chat, so nobody opens another tool.'),
        node('hp-send', 'action', 'Send the estimate', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the customer their estimate, with what it covers and how to book.', ['The approved price', 'Name and email', 'Target moving date'], 'The customer hears back while they are still comparing movers.'),
        node('hp-deal', 'action', 'Record the deal', 'HubSpot', 'Handshake', ['hubspot'], 'Creates the deal in HubSpot with the price, the date and the contact.', ['The approved price', 'Name, email and phone', 'Target moving date'], 'Every estimate is on the sales board, so none is forgotten.'),
      ],
      edges: [edge('hp-form', 'hp-price'), edge('hp-price', 'hp-approve'), edge('hp-approve', 'hp-send', 'Approve'), edge('hp-approve', 'hp-adjust', 'Edit'), edge('hp-adjust', 'hp-send'), edge('hp-send', 'hp-deal')],
    },
    {
      code: 'WM-01',
      title: 'Residence enquiry',
      site: 'Westmere',
      href: '/samples/westmere-los-angeles.html',
      platform: 'n8n',
      outcome: 'Serious buyers reach an agent within minutes; everyone else still gets the brochure and stays on the list.',
      nodes: [
        node('wm-form', 'trigger', 'Enquiry form', 'Webhook', 'WebhooksLogo', [], 'Catches an enquiry sent from a residence’s page.', ['The residence', 'Name and email', 'Their message'], 'Each enquiry carries the residence it came from, so the agent knows which home it is about.'),
        node('wm-qualify', 'ai', 'Qualify the buyer', 'Claude', 'Sparkle', ['claude'], 'Claude reads the message and judges whether they are ready to view: a budget, a timeline or a request to visit.', ['Their message', 'The residence'], 'Agents spend their time on the people ready to see a home.'),
        node('wm-ready', 'branch', 'Ready to view?', 'IF', 'ArrowsSplit', [], 'Sends ready buyers one way and everyone else the other.', ['Claude’s judgement'], 'Two clear paths, so no enquiry falls between them.'),
        node('wm-contact', 'action', 'Add the contact', 'HubSpot', 'UserPlus', ['hubspot'], 'Adds the buyer to HubSpot, linked to the residence.', ['Name and email', 'The residence'], 'The agent opens one record with everything in it.'),
        node('wm-alert', 'action', 'Alert the agent', 'Telegram', 'Bell', ['telegram'], 'Messages the listing agent with the buyer and what they asked.', ['Name', 'Their message', 'The residence'], 'A ready buyer hears from a person within minutes, not days.'),
        node('wm-nurture', 'action', 'Nurture list', 'HubSpot', 'ListChecks', ['hubspot'], 'Adds the enquiry to a slower list that hears about new residences as they launch.', ['Name and email', 'The residence'], 'Not ready today often means ready in six months.'),
        node('wm-brochure', 'action', 'Send the brochure', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the residence’s brochure and floor plans.', ['Name and email', 'The residence'], 'Everyone who asks gets something useful straight away.'),
      ],
      edges: [edge('wm-form', 'wm-qualify'), edge('wm-qualify', 'wm-ready'), edge('wm-ready', 'wm-contact', 'Yes'), edge('wm-contact', 'wm-alert'), edge('wm-alert', 'wm-brochure'), edge('wm-ready', 'wm-nurture', 'Not yet'), edge('wm-nurture', 'wm-brochure')],
    },
    {
      code: 'ME-01',
      title: 'Site survey',
      site: 'Meridian Energy',
      href: '/samples/meridian-energy-infrastructure.html',
      platform: 'make',
      outcome: 'Strong sites get a survey on the calendar; the rest get a useful guide instead of silence.',
      nodes: [
        node('me-form', 'trigger', 'Survey wizard', 'Webhook', 'WebhooksLogo', [], 'Catches the four answers from the site survey wizard, and who sent them.', ['Kind of facility', 'Area and energy spend', 'Where the site is', 'How they want to own it', 'Name and email'], 'The wizard asks only what the score needs.'),
        node('me-score', 'ai', 'Score the site', 'Claude', 'Sparkle', ['claude'], 'Claude scores the site from 1 to 10 on its area, energy spend and location, and writes one line on why.', ['Kind of facility', 'Area and energy spend', 'Where the site is'], 'The same yardstick for every site, with a reason a person can check.'),
        node('me-log', 'action', 'Log the site', 'Google Sheets', 'Table', ['google-sheets'], 'Adds a row to the pipeline sheet: the answers, the score and the reason.', ['The four answers', 'The score and reason'], 'Every site is logged before the flow decides anything.'),
        node('me-router', 'branch', 'Router', 'Strong fit?', 'ArrowsSplit', [], 'Sends sites scoring 7 or more to booking, and the rest to the guide.', ['The score'], 'Make’s router keeps both paths visible on one canvas.'),
        node('me-book', 'action', 'Book the survey', 'Gmail + Cal.com', 'CalendarCheck', ['gmail', 'cal-com'], 'Emails a Cal.com link to book a site survey with an engineer.', ['Name and email', 'The score and reason'], 'A strong site should be one click from a survey.'),
        node('me-guide', 'action', 'Send the savings guide', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a short guide to what the site could save, and when it is worth another look.', ['Name and email', 'Kind of facility'], 'A weak fit today still leaves with something useful.'),
      ],
      edges: [edge('me-form', 'me-score'), edge('me-score', 'me-log'), edge('me-log', 'me-router'), edge('me-router', 'me-book', 'Strong fit'), edge('me-router', 'me-guide', 'Not yet')],
    },
    {
      code: 'MW-01',
      title: 'Service booking',
      site: 'Meridian Werks',
      href: '/samples/meridian-werks.html',
      platform: 'zapier',
      outcome: 'The slot is held, the job card is open and the workshop knows before the owner closes the page.',
      nodes: [
        node('mw-form', 'trigger', 'Booking form', 'Webhooks by Zapier', 'WebhooksLogo', ['zapier'], 'Catches the booking: the vehicle, what it needs, the slot and the owner’s details.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'Zapier’s webhook trigger starts the Zap the moment the form is sent.'),
        node('mw-slot', 'action', 'Hold the slot', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Books the chosen slot on the workshop calendar.', ['Chosen slot', 'The vehicle'], 'Two owners can never get the same slot.'),
        node('mw-card', 'action', 'Open a job card', 'Airtable', 'Table', ['airtable'], 'Creates the job card: the vehicle, the work asked for, the slot and the owner.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'The technicians work from the card, not from an email.'),
        node('mw-workshop', 'action', 'Tell the workshop', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Posts the new booking to the workshop’s group chat.', ['The job card'], 'The team sees tomorrow’s work as it is booked.'),
        node('mw-confirm', 'action', 'Confirm with the owner', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner the slot, the address and what to bring.', ['Chosen slot', 'Owner’s details'], 'A clear confirmation stops the “is this booked?” call.'),
      ],
      edges: [edge('mw-form', 'mw-slot'), edge('mw-slot', 'mw-card'), edge('mw-card', 'mw-workshop'), edge('mw-workshop', 'mw-confirm')],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them.', by: 'Built by Justine Acosta' },
}
