/**
 * Tidewell’s Automation case page (spec 2026-10-05 per-site pages): the three
 * flows behind its assessment form, its $400 repair rule and its monthly owner
 * statement. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/tidewell-vacation-rentals/automation.html. Only type imports,
 * so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/tidewell-vacation-rentals.html'

const automation: Automations = {
  title: 'Tidewell · Automation',
  description: 'The three flows behind Tidewell’s assessment form, its $400 repair rule and its monthly owner statement, on n8n, Make and Zapier: what runs, in what order, and where an owner or a manager steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · TIDEWELL',
  heading: 'What happens after an owner asks Tidewell for an assessment',
  lede: 'Tidewell’s site ends on one form, a property assessment, and makes owners two promises a flow has to keep: anything above $400 comes to them with photos and a quote, unless guest safety is involved, and one statement arrives each month by the tenth. These are the flows behind all three. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Tidewell, a fictional rental manager used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'TW-01',
      title: 'Property assessment',
      site: 'Tidewell',
      href: SITE,
      platform: 'n8n',
      outcome: 'Every assessment request in Tidewell’s three markets has a manager and a walkthrough on the calendar, and that manager has an outline of the projection before they arrive.',
      nodes: [
        node('tw-form', 'trigger', 'Assessment form', 'Webhook', 'WebhooksLogo', [], 'Catches the property assessment form the moment someone presses Get a property assessment.', ['Property address or town', 'Email'], 'The form asks two things and no more, so the flow has to work from an address and an email.'),
        node('tw-town', 'action', 'Find the market', 'Airtable', 'MapPin', ['airtable'], 'Matches the town in the address against the towns Tidewell serves, and reads its market: the coast, the city or the mountains.', ['Property address or town', 'The towns table'], 'Each market has its own managers, and the market decides who walks the house.'),
        node('tw-ours', 'branch', 'In our markets?', 'IF', 'ArrowsSplit', [], 'Sends an address in one of Tidewell’s towns on to a manager, and any other address to a person.', ['The town, if one was found'], 'An address outside the three markets still deserves an answer, but from a person, not a booking.'),
        node('tw-office', 'action', 'Pass to the office', 'HubSpot + Telegram', 'Buildings', ['hubspot', 'telegram'], 'Saves the owner in HubSpot with a task for the office, and messages the office on Telegram. A person writes back by hand.', ['Property address or town', 'Email'], 'Nobody is sent a booking for a house Tidewell cannot look after.'),
        node('tw-manager', 'action', 'Pick the manager', 'Airtable', 'IdentificationBadge', ['airtable'], 'Picks the manager in that market with the fewest homes, from those still under eighteen.', ['The market', 'The managers table'], 'Each manager looks after no more than eighteen homes, and the one who walks the house is the one who will run it.'),
        node('tw-book', 'action', 'Book the walkthrough', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Holds the first free hour in that manager’s calendar for a walkthrough at the property.', ['The manager', 'Property address or town', 'Email'], 'A held hour turns a request into a visit, and the owner can still move it with one click.'),
        node('tw-confirm', 'action', 'Confirm the visit', 'Gmail + HubSpot', 'EnvelopeSimple', ['gmail', 'hubspot'], 'Emails a fixed template with the date, the time, the manager’s name, what the hour covers and a link to move it. Saves the owner and the assessment in HubSpot.', ['Email', 'The held hour', 'The manager', 'Property address or town'], 'The owner hears back at once, and a templated confirmation needs no one’s yes.'),
        node('tw-outline', 'ai', 'Outline a projection', 'Claude', 'Sparkle', ['claude'], 'Claude reads the address and Tidewell’s own homes in that town, and drafts an outline of the twelve-month revenue projection: what to check on the walkthrough, which homes compare, and the gaps only the visit can fill.', ['Property address or town', 'The market', 'Tidewell’s homes in that town'], 'The manager writes the projection the owner reads. Claude only gives them a head start.'),
        node('tw-brief', 'action', 'Brief the manager', 'Telegram', 'ChatCircleText', ['telegram'], 'Messages the manager the visit, the address and Claude’s outline, which goes to them and no one else.', ['The held hour', 'Property address or town', 'Claude’s outline'], 'The manager arrives knowing the street, the homes nearby and what to look for.'),
      ],
      edges: [
        edge('tw-form', 'tw-town'),
        edge('tw-town', 'tw-ours'),
        edge('tw-ours', 'tw-manager', 'In a market'),
        edge('tw-ours', 'tw-office', 'Not found'),
        edge('tw-manager', 'tw-book'),
        edge('tw-book', 'tw-confirm'),
        edge('tw-confirm', 'tw-outline'),
        edge('tw-outline', 'tw-brief'),
      ],
    },
    {
      code: 'TW-02',
      title: 'Repair approval',
      site: 'Tidewell',
      href: SITE,
      platform: 'make',
      outcome: 'A repair of $400 or less is booked within 15 minutes of being logged, and anything above waits for the owner’s yes, with the photos and the quote in front of them, unless its manager has marked it for guest safety.',
      nodes: [
        node('tw-job', 'trigger', 'New repair job', 'Airtable', 'Wrench', ['airtable'], 'Starts when a manager or the crew logs a repair in the jobs table, with its photos, the quote and the amount. Only a manager’s form has the Guest safety box.', ['The home', 'What is wrong', 'Photos', 'The quote and its amount', 'Guest safety, if the manager ticked it'], 'Every job is already logged with photos and receipts, so the flow starts where the team works.'),
        node('tw-home', 'action', 'Find the home', 'Airtable', 'House', ['airtable'], 'Reads the home the job is for: its owner, the owner’s email and its manager.', ['The home', 'The homes table'], 'Who says yes to a repair is a fact about the home, not the job.'),
        node('tw-over', 'branch', 'Above $400?', 'Router', 'ArrowsSplit', [], 'Sends a repair of $400 or less straight to the crew, and one above $400 to the owner, unless the manager ticked Guest safety: that one is booked at once.', ['The quote amount', 'Guest safety'], 'Tidewell’s site says repairs above $400 need the owner’s approval unless guest safety is involved. Anything less is the team’s to fix.'),
        node('tw-ask', 'action', 'Ask the owner', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner a fixed template with the photos, the quote, the amount and two buttons: Approve and Decline. Each button opens a confirm page, not the answer itself.', ['The owner’s email', 'Photos', 'The quote and its amount'], 'The owner decides with everything in front of them, from their phone, wherever they live.'),
        node('tw-owner', 'approve', 'Owner approves?', 'Approve or Decline', 'UserCheck', ['gmail'], 'Waits for the owner to press Approve or Decline in the email, then Confirm on the page it opens. Only that Confirm counts, so a mail scanner opening the link answers nothing. Nothing is booked until they confirm.', ['The owner’s answer'], 'A repair above $400 is the owner’s money, so it waits for the owner’s yes.'),
        node('tw-book-job', 'action', 'Book the repair', 'Airtable + Telegram', 'CalendarCheck', ['airtable', 'telegram'], 'Marks the job Booked and sends it to the maintenance crew for that market on Telegram.', ['The job', 'The home'], 'A small fix is booked within 15 minutes of being logged, and an approved one the moment the owner says yes.'),
        node('tw-safe', 'action', 'Book it for safety', 'Airtable + Telegram', 'FirstAidKit', ['airtable', 'telegram'], 'Marks the job Booked and sends it to the maintenance crew for that market on Telegram at once, without waiting for the owner.', ['The job', 'The home', 'Guest safety'], 'The site’s own exception: a repair above $400 needs the owner’s approval unless guest safety is involved. The manager’s tick is the yes.'),
        node('tw-told', 'action', 'Tell the owner', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner a fixed template: the repair is already booked, for guest safety, with the photos, the quote and the amount.', ['The owner’s email', 'Photos', 'The quote and its amount'], 'Tidewell fixes what can be fixed that day and tells the owner what happened. A fixed template needs no one’s yes.'),
        node('tw-declined', 'action', 'Tell the manager', 'Telegram', 'ChatCircleText', ['telegram'], 'Marks the job Declined and messages the manager, who calls the owner to agree what happens next.', ['The job', 'The owner’s answer'], 'A no starts a conversation, and it belongs to the person who knows the owner.'),
      ],
      edges: [
        edge('tw-job', 'tw-home'),
        edge('tw-home', 'tw-over'),
        edge('tw-over', 'tw-book-job', '$400 or less'),
        edge('tw-over', 'tw-safe', 'Guest safety'),
        edge('tw-safe', 'tw-told'),
        edge('tw-over', 'tw-ask', 'Above $400'),
        edge('tw-ask', 'tw-owner'),
        edge('tw-owner', 'tw-book-job', 'Approve'),
        edge('tw-owner', 'tw-declined', 'Decline'),
      ],
    },
    {
      code: 'TW-03',
      title: 'Monthly statement',
      site: 'Tidewell',
      href: SITE,
      platform: 'zapier',
      outcome: 'Every owner has last month’s statement by the tenth, with a note their manager has read, and their payment the same day.',
      nodes: [
        node('tw-ninth', 'trigger', 'On the 9th', 'Schedule', 'CalendarBlank', ['zapier'], 'Starts on the morning of the 9th and takes every home still waiting for last month’s statement.', ['The date', 'Homes without last month’s statement'], 'Compiling on the 9th leaves the managers a day to read before the tenth.'),
        node('tw-compile', 'action', 'Compile the month', 'Airtable', 'Calculator', ['airtable'], 'For each home, adds up last month’s lines: booking revenue, the home’s management fee (22% on the sample statement), repairs, restocking and what is paid to the owner. Saves it as a draft statement.', ['The month’s statement lines', 'The home'], 'Every figure on the statement comes from a row someone can open, never from Claude.'),
        node('tw-note', 'ai', 'Draft the note', 'Claude', 'Sparkle', ['claude'], 'Claude drafts the manager’s note: what was fixed and when, what is coming up, and anything the owner will need to decide.', ['The draft statement', 'The month’s repairs'], 'The note is what owners read first, and a draft saves a manager writing eighteen from scratch.'),
        node('tw-approve', 'approve', 'Manager approves?', 'Review page', 'UserCheck', ['zapier'], 'Puts the statement and Claude’s note on a Zapier review page and emails the home’s manager its link. They approve the note or reject it to rewrite it. An unanswered review sends nothing.', ['The draft statement', 'Claude’s note'], 'Claude’s note is going to an owner’s inbox, so it waits for the manager’s yes.'),
        node('tw-rewrite', 'wait', 'Manager rewrites', 'Review page', 'PencilSimple', ['zapier'], 'Waits for the manager to write the note as it should read, on a second review page.', ['Claude’s note', 'The manager’s rewrite'], 'The words an owner reads are the manager’s own.'),
        node('tw-send', 'action', 'Send the statement', 'Gmail + Airtable', 'PaperPlaneTilt', ['gmail', 'airtable'], 'Emails the owner the statement, every line itemized, with the note and the payment date, and marks it Sent.', ['The statement', 'The approved note', 'The owner’s email'], 'One statement a month, delivered by the tenth.'),
        node('tw-payout', 'action', 'Ask for the payout', 'Telegram', 'Bank', ['telegram'], 'Tells the office on Telegram what to pay which owner today. A person makes the payment from Tidewell’s bank and marks the statement Paid.', ['What is paid to the owner', 'The statement'], 'Payment goes out the day the statement does, and money only moves by a person’s hand.'),
      ],
      edges: [
        edge('tw-ninth', 'tw-compile'),
        edge('tw-compile', 'tw-note'),
        edge('tw-note', 'tw-approve'),
        edge('tw-approve', 'tw-send', 'Approve'),
        edge('tw-approve', 'tw-rewrite', 'Rewrite'),
        edge('tw-rewrite', 'tw-send'),
        edge('tw-send', 'tw-payout'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
