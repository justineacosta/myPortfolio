/**
 * Harbor & Pine Moving Co.’s Automation case page (spec 2026-10-05 per-site
 * pages): the three flows behind an estimate request, the day-before move
 * message and a building’s request for a certificate of insurance. HP-01 is the
 * general Automations page’s Moving estimate, kept and taken deeper: Claude
 * drafts a written range for the coordinators only, and nothing reaches the
 * customer until a coordinator says yes. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/harbor-and-pine-moving/automation.html. Only type imports, so
 * Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/harbor-and-pine-moving.html'
const NAME = 'Harbor & Pine Moving Co.'

const automation: Automations = {
  title: 'Harbor & Pine Moving Co. · Automation',
  description: 'The three flows behind Harbor & Pine Moving Co.’s estimate requests, its day-before move messages and its certificates of insurance, on n8n, Make and Zapier: what runs, in what order, and where a coordinator steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · HARBOR & PINE',
  heading: 'What happens after someone asks Harbor & Pine for an estimate',
  lede: 'Harbor & Pine’s estimate form takes three short steps: where they are moving from and to, and the target moving date, then the size of the home or office and the service, then a name, email and phone. On the sample site the form is a demonstration and sends nothing; these flows are the build behind it once it is live. The site makes one promise above the rest: “Same-day written reply, no automated pricing bots.” So Claude drafts a written range for the coordinators only, never for the customer, and a coordinator reads every request and replies the same working day with that range, their own, or a walkthrough. Nothing reaches a customer’s inbox until a coordinator says yes. The day-before move message is a fixed template and sends on its own, and a certificate of insurance goes to building management only after the move’s coordinator has checked it. Claude works in the estimate flow alone; the other two use none. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Harbor & Pine Moving Co., a fictional family-run mover on the Tidewater coast used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'HP-01',
      title: 'Moving estimate',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every estimate request gets a priced reply the same working day, or a walkthrough when the move needs a set of eyes, and nothing goes out until a coordinator says yes.',
      nodes: [
        node('hp-form', 'trigger', 'Estimate form', 'Webhook', 'WebhooksLogo', ['n8n'], 'Catches the estimate form the moment someone sends its third step. The three short steps gather where they are moving from and to and the target moving date, then the size of the home or office and the service, then their name, email and phone.', ['Moving from', 'Moving to', 'Target moving date', 'Home or office size', 'Service', 'Name, email and phone'], 'One webhook for the form means one place to look when a request goes missing.'),
        node('hp-open', 'action', 'Open the deal', 'HubSpot', 'Handshake', ['hubspot'], 'Adds the person to HubSpot, or updates them if this email has asked before, and opens a deal in the Moves pipeline at New request, with every answer from the form.', ['Name, email and phone', 'Moving from and to', 'Target moving date', 'Home or office size', 'Service'], 'The request is on the sales board before Claude or anyone else touches it, so a later failure never loses who asked.'),
        node('hp-price', 'ai', 'Price the move', 'Claude', 'Sparkle', ['claude', 'google-sheets'], 'Claude drafts a written range, a low and a high figure, from the size of the home, the distance and the service, using the company’s rate card. It adds a line on why, and flags what may need a set of eyes: a specialty item, a ferry to Cormorant Isle, a move beyond 20 miles of Bellhaven, or a long-distance run, which leaves on a Tuesday or a Friday.', ['Home or office size', 'Moving from and to', 'Service', 'Target moving date', 'The rate card'], 'A first draft in seconds, so the coordinator checks a number instead of building one. It is written for the coordinators only: no customer ever gets a range from Claude.'),
        node('hp-approve', 'approve', 'Approve?', 'Telegram', 'UserCheck', ['telegram'], 'Sends the coordinators’ Telegram group the request and Claude’s draft range, marked for coordinators only, with one button. It opens a short n8n form: Approve, Edit or Walkthrough, and which coordinator is taking it. The run waits there, and only the form’s submit moves it on.', ['Claude’s range and its line on why', 'The request'], 'No price reaches a customer without a person agreeing to it. That is the site’s promise of no automated pricing bots, kept by a coordinator’s yes.'),
        node('hp-adjust', 'wait', 'Coordinator adjusts', 'Telegram', 'PencilSimple', ['telegram'], 'On Edit, sends the coordinator a second message whose button opens a form for the range as it should read and a line on what it covers, and waits for it.', ['The coordinator’s range'], 'Edits start from the same chat, so the coordinator writes the number they stand behind without opening another tool.'),
        node('hp-send', 'action', 'Send the estimate', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the customer the written range the coordinator approved or wrote, from hello@harborandpine.example and in the coordinator’s name: what it covers, that the estimate holds unless the inventory changes, that no deposit is needed to hold a date, and how to book.', ['The approved range', 'Name and email', 'Target moving date', 'The coordinator'], 'The customer hears back the same working day, while they are still comparing movers, from the person they will deal with through moving day.'),
        node('hp-walk', 'action', 'Invite a walkthrough', 'Gmail + Cal.com', 'CalendarCheck', ['gmail', 'cal-com'], 'On Walkthrough, emails the customer a fixed template in the coordinator’s name with a Cal.com link to pick a time: the free on-site walkthrough within 20 miles of Bellhaven, or one over video, whichever the coordinator chose.', ['Name and email', 'The coordinator', 'On site or by video'], 'Some moves need a set of eyes before anyone puts a number on them, as the site says, and the walkthrough is the reply that day.'),
        node('hp-deal', 'action', 'Record the deal', 'HubSpot', 'Handshake', ['hubspot'], 'Moves the deal to Estimate sent with the range, or to Walkthrough, and makes the coordinator who answered its owner.', ['The approved range', 'The coordinator’s answer', 'The coordinator'], 'Every estimate is on the sales board with a named coordinator, so none is forgotten.'),
        node('hp-tell', 'action', 'Tell the team', 'Telegram', 'Bell', ['telegram'], 'Posts in the coordinators’ group who took the request and what went out, with a link to the deal.', ['The coordinator', 'The reply sent'], 'The group saw the request arrive, so it also sees it answered, and nobody picks it up twice.'),
      ],
      edges: [
        edge('hp-form', 'hp-open'),
        edge('hp-open', 'hp-price'),
        edge('hp-price', 'hp-approve'),
        edge('hp-approve', 'hp-send', 'Approve'),
        edge('hp-approve', 'hp-adjust', 'Edit'),
        edge('hp-approve', 'hp-walk', 'Walkthrough'),
        edge('hp-adjust', 'hp-send'),
        edge('hp-send', 'hp-deal'),
        edge('hp-walk', 'hp-deal'),
        edge('hp-deal', 'hp-tell'),
      ],
    },
    {
      code: 'HP-02',
      title: 'Move day',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'The day before every booked move, the customer gets a fixed message with the crew’s arrival time and the lead mover’s name and number, and a move with no crew set yet goes to its coordinator instead.',
      nodes: [
        node('hp-day', 'trigger', 'Each day, 1 pm', 'Make schedule', 'Clock', ['make'], 'Every day at 1:00 pm, Make starts the move-day run. On weekdays and Saturdays the office is open then; it is closed on Sundays, so the coordinators complete Monday’s moves before they close on Saturday.', ['The date'], 'One run a day covers every move booked for tomorrow, early enough for a coordinator to fix anything missing.'),
        node('hp-find', 'action', 'Find tomorrow’s moves', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Asks Airtable for every move booked for tomorrow that has had no day-before message yet. Make an API call always returns one bundle with the list, even an empty one.', ['The Moves table'], 'A cancelled move, or one already messaged, is never found, so nobody gets a message twice.'),
        node('hp-any', 'branch', 'Any moves?', 'Router', 'ArrowsSplit', ['make'], 'Routes on the list’s length: one move or more goes on, one move at a time, and an empty list goes to the quiet-day note.', ['How many moves'], 'A search that found nothing would end the run without a word. A list has a length to route on, so a quiet day is confirmed, not assumed.'),
        node('hp-quiet', 'action', 'Quiet day', 'Telegram', 'Bell', ['telegram'], 'Tells the coordinators’ group there is no move tomorrow, so no message went out.', ['The date'], 'If a move was booked for tomorrow and this says none, the coordinators know at once that something is wrong.'),
        node('hp-crew', 'branch', 'Crew set?', 'Router', 'ArrowsSplit', ['make'], 'Sends a move with its crew arrival time, its lead mover and the customer’s email on to be messaged, and one missing any of them to its coordinator.', ['Crew arrival', 'Lead mover', 'Email'], 'The message is only worth sending with the time and the lead mover in it.'),
        node('hp-mark', 'action', 'Mark it sent', 'Airtable', 'ListChecks', ['airtable'], 'Notes on the move that its day-before message is going out, before it is sent.', ['The move'], 'Noted first, a re-run or a retry can never send the same move twice.'),
        node('hp-msg', 'action', 'Move-day message', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template: the crew’s arrival time, the lead mover’s name and number, the coordinator’s name and (555) 014-2200, and what helps on the day, like parking and a lift booked. For a long-distance move it adds the transit window agreed at booking.', ['Name and email', 'Crew arrival', 'Lead mover and their number', 'The coordinator', 'Transit window'], 'A templated message sends on its own and needs no one’s yes. The customer has the lead mover’s number for the whole run, as the site promises.'),
        node('hp-ask', 'action', 'Ask the coordinator', 'Telegram', 'Warning', ['telegram'], 'Tells the move’s coordinator in the group that tomorrow’s move has no crew time, no lead mover or no email yet. Once they fill it in, they run the scenario once more, and only that move is messaged.', ['The move', 'What is missing'], 'Guessing a crew time would be worse than no message, and the coordinator is the one who knows.'),
      ],
      edges: [
        edge('hp-day', 'hp-find'),
        edge('hp-find', 'hp-any'),
        edge('hp-any', 'hp-crew', 'Moves'),
        edge('hp-any', 'hp-quiet', 'None'),
        edge('hp-crew', 'hp-mark', 'Crew set'),
        edge('hp-crew', 'hp-ask', 'Not set'),
        edge('hp-ask', 'hp-mark', 'after a re-run'),
        edge('hp-mark', 'hp-msg'),
      ],
    },
    {
      code: 'HP-03',
      title: 'Insurance certificate',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Every building that asks for a certificate of insurance gets it from Harbor & Pine before the move, and only after the move’s coordinator has checked it against what the building asked for.',
      nodes: [
        node('hp-coi', 'trigger', 'COI request logged', 'Airtable', 'Table', ['airtable', 'zapier'], 'Starts when a coordinator has logged a building’s request in COI requests, attached the certificate and ticked Ready to check: the building, the manager’s email, the certificate holder and wording it asked for, and the move.', ['The building', 'The manager’s email', 'What the building asked for', 'The certificate', 'The move'], 'Buildings ask by email or by phone, and the certificate comes from the insurer. A coordinator logs both by hand and ticks the box when the row is complete, so the Zap never starts from half a row.'),
        node('hp-ahead', 'action', 'Complete and ahead', 'Filter by Zapier', 'Funnel', ['zapier'], 'Goes on only when the request has its certificate and the manager’s email, is still Logged, and its move date is still to come.', ['The certificate', 'The manager’s email', 'Status', 'Move date'], 'A building needs the certificate before the move, not after it, and a request already answered is never sent again.'),
        node('hp-check', 'approve', 'Coordinator checks', 'Human in the Loop', 'UserCheck', ['zapier'], 'Emails the move’s coordinator a link to a Zapier review page with the certificate beside what the building asked for. They approve it or reject it there. Opening the link records nothing; only their choice on the page does.', ['The certificate', 'What the building asked for'], 'A certificate with the wrong holder or the wrong wording gets turned away at the loading dock, so a person checks it before the building sees it.'),
        node('hp-log', 'action', 'Log the answer', 'Airtable', 'ListChecks', ['airtable'], 'Writes Approved or Rejected on the request, with who checked it and when.', ['The coordinator’s answer'], 'Written before anything is sent, so a rejection is on the row too, and the coordinators can see which buildings are still waiting.'),
        node('hp-only', 'action', 'Approved only', 'Filter by Zapier', 'Funnel', ['zapier'], 'Goes on only when the coordinator approved the certificate. A rejected one stops here: nothing is sent, and the coordinator asks the insurer for a corrected certificate and logs it again as a new request.', ['The coordinator’s answer'], 'Only an approved certificate reaches the building. A rejection needs no message: the coordinator who rejected it is the one who fixes it.'),
        node('hp-file', 'action', 'Send to the building', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails building management a fixed template from hello@harborandpine.example with the certificate attached: the move date, the address and unit, and the coordinator’s name and (555) 014-2200, copied to the coordinator.', ['The manager’s email', 'The certificate', 'The move'], 'A templated email with a checked certificate sends on its own once the coordinator has approved it.'),
        node('hp-filed', 'action', 'Mark it filed', 'Airtable', 'FileText', ['airtable'], 'Sets the request to Sent, with the date.', ['The request'], 'The move’s coordinator can see at a glance that the building has its certificate.'),
      ],
      edges: [
        edge('hp-coi', 'hp-ahead'),
        edge('hp-ahead', 'hp-check'),
        edge('hp-check', 'hp-log'),
        edge('hp-log', 'hp-only'),
        edge('hp-only', 'hp-file'),
        edge('hp-file', 'hp-filed'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Harbor & Pine is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
