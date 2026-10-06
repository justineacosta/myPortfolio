/**
 * Meridian Energy Infrastructure’s Automation case page (spec 2026-10-05
 * per-site pages): the three flows behind its site surveys, its production
 * faults and its monthly production reports. ME-01 is the general Automations
 * page’s Site survey, on Make, kept with its code, title, trigger, steps and
 * outcome and given depth; ME-02 is on n8n and ME-03 on Zapier, in that order.
 * Two rules run through all three: no step tells a client to touch any
 * equipment, and emergencies go to 911 and the utility; and no step works out,
 * proposes or promises a payment under the production guarantee, which is the
 * asset manager’s decision. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/meridian-energy-infrastructure/automation.html.
 * Only type imports, so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/meridian-energy-infrastructure.html'
const NAME = 'Meridian Energy Infrastructure'

const automation: Automations = {
  title: 'Meridian Energy Infrastructure · Automation',
  description: 'The three flows behind Meridian Energy Infrastructure’s site surveys, production faults and monthly production reports, on Make, n8n and Zapier: what runs, in what order, and where a person steps in. No step tells a client to touch equipment, and no step decides a payment.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · MERIDIAN ENERGY',
  heading: 'What happens after a site survey request, a production fault or the end of the month at Meridian Energy Infrastructure',
  lede: 'Meridian Energy Infrastructure designs, finances, builds and operates commercial solar and battery storage from Houston, San Antonio and Baton Rouge: 184 projects and 312 MW in TX, LA, MS, AL and OK. Request a Site Assessment opens the site survey wizard, which promises that an energy advisor will confirm a drone survey window within one business day. Once an asset runs, the site promises a contracted 48-hour response on any production fault, monthly production reporting measured at the meter and reconciled to utility settlement, and a guarantee: if the asset underperforms the model, we write the cheque. These three flows keep those promises: site surveys on Make, production faults on n8n and production reports on Zapier. People make the calls. An energy advisor sees every survey request. The duty lead in the operations centre dispatches every technician, by phone; no flow dispatches anyone. The asset manager approves every report, and decides any payment under the guarantee by hand; no client email names a payment or an amount. No step tells a client to touch, reset or isolate any equipment, and an emergency goes to 911 and the utility. Claude only scores survey requests, and the score goes to the sheet and the advisors, never to the visitor; the Report note agent, planned on the AI agents page, drafts each report’s note for the asset manager. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Meridian Energy Infrastructure, a fictional commercial solar and storage developer used across this portfolio, not a client project. Times and figures are illustrative.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'ME-01',
      title: 'Site survey',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'Strong sites get a survey on the calendar; the rest get a useful guide instead of silence. An energy advisor sees every request at once: a strong site’s survey window is confirmed within one business day, as the wizard promises, and for the rest an advisor is in touch within one business day.',
      nodes: [
        node('me-form', 'trigger', 'Survey wizard', 'Webhook', 'WebhooksLogo', ['make'], 'Catches the four answers from the site survey wizard, and who sent them, the moment the visitor presses Book the site survey: the kind of facility, the usable roof or land area and the average monthly electricity spend, where the site is, and how they would prefer to own the asset, with their name, organisation and email and the reference the wizard showed them.', ['Kind of facility', 'Area and energy spend', 'Where the site is', 'How they want to own it', 'Name and email'], 'The wizard asks only what the score needs, and the reference lets the visitor and the advisor talk about the same request.'),
        node('me-score', 'ai', 'Score the site', 'Claude', 'Sparkle', ['claude'], 'Claude scores the site from 1 to 10 on its area, energy spend and location, against the company’s minimum site of 80,000 sq ft or 250 kW, and writes one line on why. It never reads the visitor’s name, organisation or email. The score only routes: it and the reason go to the sheet and the advisors, never to the visitor.', ['Kind of facility', 'Area and energy spend', 'Where the site is'], 'The same yardstick for every site, with a reason a person can check.'),
        node('me-log', 'action', 'Log the site', 'Google Sheets', 'Table', ['google-sheets'], 'Adds a row to the pipeline sheet: the answers, the score and the reason, the reference, when it arrived, and Confirm by, the next business day, which Make works out.', ['The four answers', 'The score and reason'], 'Every site is logged before the flow decides anything, with the day an advisor owes the visitor an answer.'),
        node('me-advisors', 'action', 'Tell the advisors', 'Telegram', 'Bell', ['telegram'], 'Messages the energy advisors’ group on Telegram: the facility, the area, the spend, the location and the ownership preferred, the score and Claude’s reason, Confirm by and a link to the row. When Claude gave no score, the message says so, and an advisor reads the answers themselves.', ['The four answers', 'The score and reason', 'Confirm by'], 'The wizard promises a person within one business day, so the advisors hear of every request before the visitor’s email goes, whatever the score.'),
        node('me-router', 'branch', 'Router', 'Strong fit?', 'ArrowsSplit', ['make'], 'Sends sites scoring 7 or more to booking, and the rest, or a site with no score, to the guide.', ['The score'], 'Make’s router keeps both paths visible on one canvas.'),
        node('me-book', 'action', 'Book the survey', 'Gmail + Cal.com', 'CalendarCheck', ['gmail', 'cal-com'], 'Emails a Cal.com link to book a site survey with an engineer, in a fixed template: pick a drone survey window, and an energy advisor confirms it within one business day. It holds the reference, never the score or the reason.', ['Name and email', 'The reference'], 'A strong site should be one click from a survey.'),
        node('me-guide', 'action', 'Send the savings guide', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a short guide to what the site could save, and when it is worth another look, in a fixed template picked by the kind of facility. It says an energy advisor will be in touch within one business day, and holds the reference, never the score or the reason.', ['Name and email', 'Kind of facility'], 'A weak fit today still leaves with something useful, and still hears from a person.'),
        node('me-confirm', 'approve', 'Advisor confirms', 'Cal.com', 'UserCheck', ['cal-com', 'google-sheets'], 'An energy advisor confirms the window the visitor booked in Cal.com, which then sends its own confirmation, and sets the row Survey confirmed. If no window is booked by Confirm by, the advisor calls or writes to offer one. Each business morning at 8:00 a.m. Central a second scenario lists the requests still due.', ['The booking', 'Confirm by'], 'A person confirms every survey window, as the wizard promises, and the score never books one on its own.'),
        node('me-follow', 'approve', 'Advisor follows up', 'By hand', 'Phone', ['google-sheets'], 'Within one business day an energy advisor reads the answers and Claude’s reason, and calls or writes from their own inbox: they may offer a survey window after all, or explain why the site is not a fit yet, such as being under the minimum. They set the row Followed up.', ['The four answers', 'The score and reason'], 'The score routes the email, but a person decides what this site deserves, and no visitor who asked for a survey is left with only a guide.'),
      ],
      edges: [
        edge('me-form', 'me-score'),
        edge('me-score', 'me-log'),
        edge('me-log', 'me-advisors'),
        edge('me-advisors', 'me-router'),
        edge('me-router', 'me-book', 'Strong fit'),
        edge('me-router', 'me-guide', 'Not yet'),
        edge('me-book', 'me-confirm'),
        edge('me-guide', 'me-follow'),
      ],
    },
    {
      code: 'ME-02',
      title: 'Production fault',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every production fault the operations centre logs opens a ticket within a minute, the duty lead hears at once, and the client gets a notice that Meridian Energy Infrastructure responds within 48 hours. A person dispatches the technician, and the flow warns the operations centre before the 48 hours run out.',
      nodes: [
        node('me-fault', 'trigger', 'Fault logged', 'Airtable', 'Lightning', ['airtable', 'n8n'], 'The operations centre watches every asset on its 24/7 SCADA. When it sees a production fault, a person logs it in Airtable’s Faults table: the asset, when it was detected and what they saw. n8n checks for new faults every minute. No flow reads SCADA.', ['The asset', 'Detected at', 'What they saw'], 'A person decides what is a fault and logs it, so every ticket starts from someone who has looked.'),
        node('me-ticket', 'action', 'Open a ticket', 'Airtable', 'Table', ['airtable'], 'Opens a ticket for the fault, Status Open. Respond by is 48 hours after it was detected.', ['The fault', 'Detected at'], 'The 48 hours are on the ticket from the first minute, where everyone can see them.'),
        node('me-lead', 'action', 'Tell the duty lead', 'Telegram', 'Bell', ['telegram'], 'Messages the operations group on Telegram, with sound: the asset, the site, what was seen, Respond by and a link to the ticket.', ['The ticket', 'Respond by'], 'The duty lead decides who goes, so they hear before anyone else.'),
        node('me-contact', 'action', 'Find the contact', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Looks up the asset’s notice contact, the email the client named for fault notices. If none is on file, the search still hands the ticket on, as no contact.', ['The asset'], 'A client hears from the right person at their company.'),
        node('me-found', 'branch', 'Contact on file?', 'IF', 'ArrowsSplit', ['n8n'], 'Sends a ticket with a notice contact to the notice, and one without to the duty lead.', ['Whether a contact was found'], 'No fault goes unannounced because a contact is missing.'),
        node('me-notice', 'action', 'Notify the client', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the notice contact a fixed template. It opens with the emergency line: if they see fire, smoke or damaged equipment, or anyone is hurt, they keep clear and call 911, then their utility. Then: a production fault was logged at their site, and under their contract Meridian Energy Infrastructure responds within 48 hours, by the time on the ticket. There is nothing they need to do: they should leave all equipment as it is and not touch, reset or isolate anything themselves.', ['The ticket', 'Respond by', 'The notice contact'], 'A templated notice sends on its own, and it promises what the contract promises: a response within 48 hours, not a repair.'),
        node('me-tell', 'action', 'Ask for a call', 'Telegram', 'Phone', ['telegram'], 'Tells the operations group the asset has no notice contact on file: the duty lead tells the client by phone, and adds the contact to the asset.', ['The ticket', 'The asset'], 'A client without a contact on file still hears, from a person.'),
        node('me-dispatch', 'approve', 'Lead dispatches', 'By phone', 'UserCheck', ['airtable'], 'The duty lead picks a field technician, calls them, and sets the ticket Dispatched, with who and when. No step picks or messages a technician.', ['The ticket', 'The technicians on call'], 'Sending someone to an energized asset is a person’s decision, made by phone.'),
        node('me-respond', 'wait', 'Response recorded', 'Airtable', 'Timer', ['airtable', 'n8n'], 'The duty lead sets Responded at once a technician is working the fault, and the ticket shows whether it was within 48 hours. Every hour n8n checks for any ticket still without a response 12 hours before Respond by, and warns the operations group once.', ['Responded at', 'Respond by'], 'The promise is a response within 48 hours, so the flow watches the clock, and a person has 12 hours left to keep it.'),
      ],
      edges: [
        edge('me-fault', 'me-ticket'),
        edge('me-ticket', 'me-lead'),
        edge('me-lead', 'me-contact'),
        edge('me-contact', 'me-found'),
        edge('me-found', 'me-notice', 'Found'),
        edge('me-found', 'me-tell', 'None'),
        edge('me-notice', 'me-dispatch'),
        edge('me-tell', 'me-dispatch'),
        edge('me-dispatch', 'me-respond'),
      ],
    },
    {
      code: 'ME-03',
      title: 'Production report',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Each month every client’s asset has a report of its generation, measured at the meter and reconciled to utility settlement, against the model, and it reaches the client only once the asset manager approves it. Any payment under the production guarantee is the asset manager’s decision, made by hand.',
      nodes: [
        node('me-month', 'trigger', 'Each month', 'Schedule by Zapier', 'CalendarCheck', ['zapier'], 'On the 10th of each month, once the operations centre has reconciled last month’s meter reads to utility settlement, Zapier starts the month’s reports. At 7:00 a.m. Central it tells the asset managers which assets are not reconciled yet; from 8:00 a.m., every hour that day, it drafts up to 100 reports, until every reconciled month has one.', ['Today’s date', 'Reconciled'], 'The reports start once the figures are final, and a month that is not ready is named, never skipped unseen.'),
        node('me-meter', 'action', 'Find metered months', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Finds the months that are reconciled and have no report yet, up to 100 at a time: the generation measured at the revenue-grade meter, and the model’s expected generation for that month. A month reconciled after the 10th is drafted by hand by its asset manager.', ['Production months', 'Reconciled'], 'Measured at the meter, not the nameplate: the report starts from what the meter and the utility agree on.'),
        node('me-each', 'action', 'One asset at a time', 'Looping by Zapier', 'Stack', ['zapier'], 'Takes the assets one at a time, so each client’s asset gets its own report.', ['The months found'], 'A client with two assets gets two reports, never one blended number.'),
        node('me-draft', 'action', 'Draft the report', 'Airtable', 'Table', ['airtable'], 'Writes the report on its own row in a fixed template: generation for the month, the model’s expected generation, the difference in percent and whether it came in below the model. Its Status is To check. Claude writes none of the figures.', ['Metered generation', 'The model'], 'The asset manager checks a finished report beside the month it came from.'),
        node('me-am', 'action', 'Tell the asset manager', 'Telegram', 'Bell', ['telegram'], 'Messages the asset’s asset manager on Telegram: a report is ready to check, the client, the asset, the month, generation against the model, and a link to the row. A month below the model says so, and that any payment is theirs to decide.', ['The report', 'Below the model'], 'The asset manager knows on the 10th which reports are waiting, and which months fell short.'),
        node('me-approve', 'approve', 'Manager approves', 'In Airtable', 'UserCheck', ['airtable'], 'The asset manager reads the report against the month, edits the plain-language note the Report note agent drafted, or writes it, and sets it Approved. Only the asset manager, and the Zap’s own account, can change its Status, and the Zap never sets Approved.', ['The report', 'The note'], 'No report reaches a client before the person accountable for the asset has read it.'),
        node('me-send', 'action', 'Send the report', 'Gmail', 'EnvelopeSimple', ['gmail'], 'A second Zap emails the approved report to the client’s report contact in a fixed template: generation measured at the meter and reconciled to utility settlement, against the model, and the note. A month below the model says the asset manager reviews it against the contract’s production guarantee. It never names a payment or an amount.', ['The approved report', 'The client’s email'], 'The client sees the month in one email, as the site promises, and nothing in it promises money.'),
        node('me-sent', 'action', 'Mark it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Marks the report Sent, with the date, so a later edit never sends it twice.', ['The report', 'Sent on'], 'The asset manager can see at a glance which clients have this month’s report.'),
        node('me-cheque', 'approve', 'Shortfall decision', 'By hand', 'Scales', ['airtable'], 'For a month below the model, the asset manager reviews it against the contract’s production guarantee and decides whether a payment is due, and how much. If the asset underperforms the model, Meridian Energy Infrastructure writes the cheque: a person decides it and a person writes it. No step works out, proposes or promises an amount.', ['The report', 'The contract'], 'The guarantee is Meridian Energy Infrastructure’s promise with its own balance sheet behind it, so a person, not a formula, decides every payment.'),
      ],
      edges: [
        edge('me-month', 'me-meter'),
        edge('me-meter', 'me-each'),
        edge('me-each', 'me-draft'),
        edge('me-draft', 'me-am'),
        edge('me-am', 'me-approve'),
        edge('me-approve', 'me-send'),
        edge('me-send', 'me-sent'),
        edge('me-sent', 'me-cheque', 'If below the model'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Meridian Energy Infrastructure is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
