/**
 * Altitude’s Automation case page (spec 2026-10-05 per-site pages): the three
 * flows behind its Start coaching button, a consult Elias marks Starting and
 * the Sunday check-in. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/altitude-personal-training/automation.html.
 * Only type imports, so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/altitude-personal-training.html'

const automation: Automations = {
  title: 'Altitude · Automation',
  description: 'The three flows behind Altitude’s Start coaching button, a consult Elias marks Starting and the Sunday check-in, on n8n, Make and Zapier: what runs, in what order, and where Elias steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · ALTITUDE',
  heading: 'What happens after someone presses Start coaching',
  lede: 'Altitude’s site has no contact form. It has buttons: Start coaching opens a five-minute application, and Book a consult opens Elias’s calendar. It also makes promises a flow has to keep: a reply within two working days, nothing to sign until you have met your coach, and every Sunday check-in answered by Monday, by Elias himself. These are the flows behind all three. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Altitude, a fictional coaching studio used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'AL-01',
      title: 'Coaching application',
      site: 'Altitude',
      href: SITE,
      platform: 'n8n',
      outcome: 'Every new applicant is offered the free 20-minute consult within minutes, well inside the two working days the site promises, and Elias has read a summary of their goal before the call.',
      nodes: [
        node('al-apply', 'trigger', 'Application', 'Webhook', 'WebhooksLogo', [], 'Catches the application the moment someone sends it. Start coaching opens it.', ['Your goal', 'Your schedule', 'What you have tried before', 'Email'], 'The application asks the three things the site names, and an email to reply to. The flow works from those and nothing more.'),
        node('al-roster', 'action', 'Check the roster', 'Airtable', 'AddressBook', ['airtable'], 'Looks the email up among Altitude’s current clients.', ['Email', 'The Clients table'], 'A client who presses Start coaching again is already coached by Elias, and should hear from him, not get a consult offer.'),
        node('al-client', 'branch', 'Already a client?', 'IF', 'ArrowsSplit', [], 'Sends a current client to Elias, and anyone new on to the consult.', ['The client, if one was found'], 'Two kinds of people press the same button, and they need different answers.'),
        node('al-elias', 'action', 'Pass to Elias', 'Telegram', 'ChatCircleText', ['telegram'], 'Messages Elias the client’s answers on Telegram. He writes back to them himself.', ['Your goal', 'Your schedule', 'What you have tried before', 'Email'], 'A client changing their goal is a coaching conversation, and that is Elias’s.'),
        node('al-save', 'action', 'Save the application', 'Airtable', 'Table', ['airtable'], 'Saves the answers in Applications, or updates the row if this email has applied before, and marks it Applied.', ['Your goal', 'Your schedule', 'What you have tried before', 'Email'], 'One row per person, so applying twice never makes two rows.'),
        node('al-offer', 'action', 'Offer the consult', 'Gmail + Cal.com', 'EnvelopeSimple', ['gmail', 'cal-com'], 'Emails a fixed template: thanks, what the free 20-minute consult covers (fit, format and price), and a link to book it in Elias’s Cal.com calendar.', ['Email', 'The consult link'], 'The site promises a reply within two working days. A templated reply keeps that promise in minutes, and needs no one’s yes.'),
        node('al-summary', 'ai', 'Summarise the goal', 'Claude', 'Sparkle', ['claude'], 'Claude reads the three answers and writes Elias a short summary: the goal in a line, what the schedule allows, what has been tried, and what to ask on the call. An injury in the answers is flagged for the consult, with no advice.', ['Your goal', 'Your schedule', 'What you have tried before'], 'Elias reads every application himself. The summary only means he arrives at the consult ready.'),
        node('al-brief', 'action', 'Brief Elias', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Sends Elias the summary and the answers on Telegram. Claude’s summary goes to him and no one else.', ['Claude’s summary', 'The application'], 'Elias sees every new application the day it arrives, often before the person has booked.'),
      ],
      edges: [
        edge('al-apply', 'al-roster'),
        edge('al-roster', 'al-client'),
        edge('al-client', 'al-save', 'New'),
        edge('al-client', 'al-elias', 'A client'),
        edge('al-save', 'al-offer'),
        edge('al-offer', 'al-summary'),
        edge('al-summary', 'al-brief'),
      ],
    },
    {
      code: 'AL-02',
      title: 'Start a plan',
      site: 'Altitude',
      href: SITE,
      platform: 'make',
      outcome: 'Once Elias marks a consult Starting, the client starts the plan they chose on Stripe, has the 60-minute assessment held and a welcome in their inbox, and nothing is charged before Elias’s yes.',
      nodes: [
        node('al-starting', 'trigger', 'Marked Starting', 'Airtable', 'UserCheck', ['airtable'], 'Starts when Elias, after the consult, sets the application to Starting and picks the plan the person chose: Online, Hybrid or Studio.', ['Status', 'Plan', 'Email'], 'Nothing is charged until Elias has met the person and they have agreed a plan. Marking it Starting is his yes.'),
        node('al-plan', 'action', 'Find the plan', 'Airtable', 'Tag', ['airtable'], 'Reads the plan’s monthly price and where its assessment happens: Online at $229 a month, assessed over video; Hybrid at $449 and Studio at $760, assessed in the studio.', ['Plan', 'The Plans table'], 'Prices live in one table, so the flow never holds a price of its own.'),
        node('al-link', 'action', 'Send the payment link', 'Stripe + Gmail', 'CreditCard', ['stripe', 'gmail'], 'Creates a Stripe Checkout for the plan’s monthly subscription and emails it in a fixed template, with the price, the 12-week first block and the 14 days’ notice to pause or cancel after it.', ['Plan and its price', 'Email'], 'The client starts the subscription with their own card, on Stripe’s page, after Elias’s yes.'),
        node('al-pay', 'wait', 'Client pays', 'Stripe Checkout', 'HourglassMedium', ['stripe'], 'Waits for Stripe to report the checkout paid, or expired after 24 hours unpaid.', ['The Stripe checkout'], 'Nothing is booked for someone who has not started their plan.'),
        node('al-open', 'action', 'Open the client', 'Airtable', 'IdentificationCard', ['airtable'], 'Adds the person to Clients with their plan and Stripe subscription, marked Active, and marks the application Started.', ['The application', 'The name given at checkout', 'The Stripe subscription'], 'From here the client is on Elias’s roster, and every later flow reads them from one row.'),
        node('al-book', 'action', 'Book the assessment', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Holds the first free hour in Elias’s calendar for the 60-minute assessment, in the studio or over video as the plan sets.', ['The plan', 'The name given at checkout', 'Email'], 'The site promises a start inside a week: the assessment on days 4–5, the first session on day 7.'),
        node('al-welcome', 'action', 'Send the welcome', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed welcome: the assessment time and a link to move it, what to bring, the client’s own check-in form link, and what happens on day 7.', ['The held hour', 'The plan', 'The check-in form link', 'Email'], 'A templated welcome sends on its own, and the client knows the next three steps.'),
        node('al-tell', 'action', 'Tell Elias', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Tells Elias on Telegram who has started, on which plan, and when the assessment is. He sets the client up in the coaching app by hand.', ['The client', 'The held hour'], 'No flow touches the coaching app, so loading the first block is Elias’s job, and he knows exactly when it is due.'),
        node('al-lapsed', 'action', 'Tell Elias it lapsed', 'Airtable + Telegram', 'Bell', ['airtable', 'telegram'], 'Marks the application Link expired and tells Elias, who follows up and sets it back to Starting to send a fresh link.', ['The application'], 'An unpaid link is a person who may still want to start, and the next word is Elias’s.'),
      ],
      edges: [
        edge('al-starting', 'al-plan'),
        edge('al-plan', 'al-link'),
        edge('al-link', 'al-pay'),
        edge('al-pay', 'al-open', 'Paid'),
        edge('al-pay', 'al-lapsed', 'Expired'),
        edge('al-open', 'al-book'),
        edge('al-book', 'al-welcome'),
        edge('al-welcome', 'al-tell'),
      ],
    },
    {
      code: 'AL-03',
      title: 'Sunday check-in',
      site: 'Altitude',
      href: SITE,
      platform: 'zapier',
      outcome: 'Every Sunday check-in reaches Elias with a summary beside it, so he can write each reply himself by Monday, and anyone who has not checked in by Sunday night gets a nudge.',
      nodes: [
        node('al-checkin', 'trigger', 'Check-in, or Sunday', 'Airtable or Schedule', 'ClipboardText', ['airtable', 'zapier'], 'Starts in one of two ways: a client sends their Sunday check-in on the form linked in their welcome email, or 9 pm Mountain time on Sunday comes with none from them.', ['Sleep', 'Steps', 'Bodyweight trend', 'How training felt', 'The day and time'], 'No flow reads the coaching app, so the check-in comes in on a form Altitude sends, asking the four things the site says it asks.'),
        node('al-sent', 'branch', 'Sent by Sunday night?', 'Which Zap starts', 'ArrowsSplit', ['zapier'], 'Sends a check-in on to be summarised for Elias, and Sunday night with none to a nudge.', ['The check-in, if one was sent'], 'A check-in and a missing one need different things: one needs reading, the other needs asking for.'),
        node('al-missing', 'action', 'Find missed check-ins', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Finds the active clients, past their block start, with no check-in this week.', ['The Clients table'], 'Nobody should drift for a fortnight without someone noticing. That is part of what the coaching is for.'),
        node('al-nudge', 'action', 'Send a nudge', 'Gmail + Airtable', 'HandWaving', ['gmail', 'airtable'], 'Emails each one a short fixed nudge with their check-in form link, and notes it on their row, where Elias sees who missed the week.', ['Email', 'Their check-in form link'], 'A templated nudge sends on its own. It asks for the check-in and says nothing else.'),
        node('al-late', 'wait', 'Client checks in late', 'Same form', 'ClockCountdown', ['airtable'], 'Waits for the nudged client to send their check-in. When they do, it goes on like any other.', ['Their check-in'], 'A late check-in still gets read by Elias and answered.'),
        node('al-history', 'action', 'Read the past weeks', 'Airtable', 'ClockCounterClockwise', ['airtable'], 'Reads the client’s plan, their week in the block and their last four check-ins.', ['The client', 'The Check-ins table'], 'A number means more next to last week’s.'),
        node('al-sum', 'ai', 'Summarise it', 'Claude', 'Sparkle', ['claude'], 'Claude writes Elias a short summary: what moved since last week, what is worth a question, and any pain or injury flagged first, with no advice.', ['This check-in', 'The past weeks', 'The plan and the week of the block'], 'Elias reads every check-in himself. The summary only points him at what changed, and it never becomes the reply.'),
        node('al-send', 'action', 'Send it to Elias', 'Airtable + Telegram', 'PaperPlaneTilt', ['airtable', 'telegram'], 'Saves the summary on the check-in and sends it to Elias on Telegram with a link to the full answers. It goes to him and no one else.', ['Claude’s summary', 'The check-in'], 'Elias has every check-in and its summary in one place on Sunday evening.'),
        node('al-reply', 'wait', 'Elias writes the reply', 'By hand, by Monday', 'PencilSimple', [], 'Elias reads the check-in, writes the reply himself in the coaching app by Monday, and marks the check-in Replied.', ['The check-in', 'Claude’s summary'], 'Every reply is in Elias’s own words. Nothing Claude writes reaches a client.'),
      ],
      edges: [
        edge('al-checkin', 'al-sent'),
        edge('al-sent', 'al-history', 'Sent'),
        edge('al-sent', 'al-missing', 'None by Sunday'),
        edge('al-missing', 'al-nudge'),
        edge('al-nudge', 'al-late'),
        edge('al-late', 'al-history'),
        edge('al-history', 'al-sum'),
        edge('al-sum', 'al-send'),
        edge('al-send', 'al-reply'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
