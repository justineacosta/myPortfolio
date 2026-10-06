/**
 * Ironline Utility Infrastructure’s Automation case page (spec 2026-10-05
 * per-site pages): the three flows behind its bid inbox, its near-miss reports
 * and its closeouts. Ironline has no flow on the general Automations page, so
 * all three are new, on n8n, Make and Zapier in that order. Ironline is a
 * safety trade: no step, and no Claude step, gives, drafts or changes a
 * switching, clearance, outage or energized-work instruction, and no flow
 * dispatches a crew. data/cases/index.ts registers it; `npm run cases` renders
 * it into public/cases/ironline-utility-infrastructure/automation.html. Only
 * type imports, so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/ironline-utility-infrastructure.html'
const NAME = 'Ironline Utility Infrastructure'

const automation: Automations = {
  title: 'Ironline Utility Infrastructure · Automation',
  description: 'The three flows behind Ironline Utility Infrastructure’s bid requests, near-miss reviews and closeouts, on n8n, Make and Zapier: what runs, in what order, and where a person steps in. No step gives a switching, clearance or energized-work instruction.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · IRONLINE',
  heading: 'What happens after a bid request, a near-miss report or an energization at Ironline',
  lede: 'Ironline’s site has no form. Request a bid opens an email to bids@ironlineutility.com, for drawings, a scope letter or a two-line description of the problem, and Call the bid desk dials (614) 555-0142, Mon–Fri, 6a–6p ET. The site promises that a superintendent, not a salesperson, reviews every inquiry and responds within one business day, that every near-miss is reviewed company-wide within 48 hours, and that as-builts and closeout are turned over within ten business days of energization. These three flows keep those promises: bid requests on n8n, near-miss reviews on Make and closeouts on Zapier. Ironline is a safety trade, so one rule runs through all three. No step, and no Claude step, gives, drafts or changes a switching, clearance, outage or energized-work instruction: those come from the job brief, the superintendent and system operations. Storm and emergency calls go to the 24/7 line, (614) 555-0199, answered by people, and no flow dispatches a crew; crews roll within six hours of a call by a person’s decision. Claude works in one flow only, the near-miss review, where it drafts a bulletin the safety director approves. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Ironline Utility Infrastructure, a fictional Ohio utility contractor used across this portfolio, not a client project. Times and figures are illustrative.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'IL-01',
      title: 'Bid request',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every bid request to bids@ is logged and in a superintendent’s hands within minutes, and the sender hears at once that a superintendent will respond within one business day.',
      nodes: [
        node('il-mail', 'trigger', 'Email to bids@', 'Gmail Trigger', 'EnvelopeSimple', ['gmail', 'n8n'], 'Request a bid opens an email to bids@ironlineutility.com. n8n checks the inbox every minute and picks up each new email from outside Ironline: drawings, a scope letter or a two-line description, as the sender wrote it. Each email then runs through the rest of the flow on its own.', ['Sender and subject', 'The email as written', 'Attachment names', 'The thread'], 'The site asks for a bid by email, so the inbox is where every request starts.'),
        node('il-thread', 'action', 'Find the thread', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Looks in Airtable’s Bid requests for a request already logged on this email’s thread. If none is found, the search still hands the email on, as a new request.', ['The thread'], 'A sender who adds drawings to their first email is the same request, not a second one.'),
        node('il-new', 'branch', 'New request?', 'IF', 'ArrowsSplit', ['n8n'], 'Sends a thread with no request yet to be logged, and an email on a logged thread to its request as a follow-up.', ['Whether the thread was found'], 'Only a new request is logged, assigned and acknowledged, so a reply never starts a second bid.'),
        node('il-follow', 'action', 'Add the follow-up', 'Airtable + Telegram', 'Stack', ['airtable', 'telegram'], 'Adds the email to its request and passes it to the request’s superintendent on Telegram, or to the bid desk while no one is assigned.', ['The email as written', 'The request', 'Its superintendent'], 'The superintendent reviewing the bid sees every new drawing as it arrives.'),
        node('il-log', 'action', 'Log the request', 'Airtable', 'Table', ['airtable'], 'Adds a row to Bid requests: the sender, the subject, the email as written, the attachment names, a link to the thread and when it arrived. Respond by is the end of the next business day, and a check at 6 a.m. each business morning tells the bid desk of any request still open on its day.', ['Sender and subject', 'The email as written', 'Attachment names', 'The thread'], 'Every request is on record before anything else happens, with the day it is due.'),
        node('il-rota', 'action', 'Assign by the rota', 'Airtable', 'UserCheck', ['airtable'], 'Assigns the superintendent on bid duty this week, from the Bid duty rota the bid desk keeps. If the rota has no one this week, the bid desk group is told at once and assigns one by hand. Anyone on the bid desk can reassign a request on its row.', ['This week’s rota'], 'A stated rule, not a reading of the email, picks the superintendent, and a person can always change it.'),
        node('il-notify', 'action', 'Notify superintendent', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages the assigned superintendent on Telegram with the sender, the subject, the attachment names, the Respond by day and a link to the row.', ['The request', 'Respond by', 'The superintendent'], 'The superintendent, not a salesperson, reviews the request and writes the response themselves.'),
        node('il-ack', 'action', 'Acknowledge the email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Replies on the sender’s thread from bids@ with a fixed template: the request is in, a superintendent, not a salesperson, will review it and respond within one business day, and for storm or emergency response, call (614) 555-0199, answered 24/7.', ['Sender and subject', 'The thread'], 'A templated acknowledgement sends on its own. It goes last, so the superintendent already knows, and it points any emergency to the people on the 24/7 line.'),
      ],
      edges: [
        edge('il-mail', 'il-thread'),
        edge('il-thread', 'il-new'),
        edge('il-new', 'il-log', 'New'),
        edge('il-new', 'il-follow', 'Follow-up'),
        edge('il-log', 'il-rota'),
        edge('il-rota', 'il-notify'),
        edge('il-notify', 'il-ack'),
      ],
    },
    {
      code: 'IL-02',
      title: 'Near-miss review',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'Every near-miss filed becomes a draft bulletin within minutes, and goes company-wide within 48 hours once the safety director approves it, with no names and no blame.',
      nodes: [
        node('il-filed', 'trigger', 'Near-miss filed', 'Airtable form', 'Warning', ['airtable', 'make'], 'A crew member files a near-miss on Ironline’s report form, in Airtable. It asks what happened, what stopped it being worse and the lesson, never who was at fault. Make checks for new reports every 15 minutes.', ['What happened', 'What stopped it', 'The lesson', 'Discipline and state'], 'A short form on a phone, so a near-miss is filed the day it happens.'),
        node('il-draft', 'ai', 'Draft the bulletin', 'Claude', 'Sparkle', ['claude'], 'Claude drafts the company bulletin from the report: a headline, what happened and the crew’s lesson, written with roles, never names. It never reads who filed the report. When a report touches switching, clearance, an outage or energized work, Claude flags it and leaves the lesson for the safety director to write.', ['What happened', 'What stopped it', 'The lesson', 'Discipline and state'], 'The safety director edits a draft instead of starting from a blank page, so the 48 hours go on review, not typing.'),
        node('il-save', 'action', 'Save the draft', 'Airtable', 'Database', ['airtable'], 'Writes the draft and the flag on the report’s row and sets it Awaiting approval. Review due is 48 hours from when it was filed.', ['Claude’s draft', 'The flag'], 'The report and its draft sit side by side, where the safety director reviews them.'),
        node('il-director', 'action', 'Tell the director', 'Telegram', 'Bell', ['telegram'], 'Messages the safety director on Telegram: a near-miss is filed, its discipline, whether it touches procedure, when its review is due and a link to the row. At 6 a.m. and 2 p.m. Eastern, every day, Make reminds them of any report still awaiting approval.', ['The report', 'Review due', 'The flag'], 'The 48 hours start when the report is filed, so the safety director hears at once.'),
        node('il-approve', 'approve', 'Director approves', 'In Airtable', 'UserCheck', ['airtable'], 'The safety director reads the report and the draft, takes out any name, rewrites what they choose, writes any lesson Claude left empty, and sets the report Approved. Only the safety director can.', ['The report', 'Claude’s draft'], 'No bulletin goes company-wide without the safety director’s yes, and any change to a procedure is theirs, made through the job brief and system operations, never through a draft.'),
        node('il-send', 'action', 'Send company-wide', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the approved bulletin to the company-wide list in a fixed template, ending with a fixed line: switching, clearance and energized-work steps come only from your job brief, your superintendent and system operations.', ['The approved bulletin'], 'Every near-miss is reviewed company-wide, as the site promises, by everyone in the office and the field.'),
        node('il-crews', 'action', 'Post to the crews', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Posts the same bulletin in the crews’ Telegram channel, with the same fixed line.', ['The approved bulletin'], 'Crews in the field read Telegram before they read email.'),
        node('il-reviewed', 'action', 'Mark it reviewed', 'Airtable', 'FlagCheckered', ['airtable'], 'Marks the report Sent, with the time, and whether it went within 48 hours of filing.', ['The report', 'Sent at'], 'The safety director can show that every near-miss was reviewed company-wide within 48 hours.'),
      ],
      edges: [
        edge('il-filed', 'il-draft'),
        edge('il-draft', 'il-save'),
        edge('il-save', 'il-director'),
        edge('il-director', 'il-approve'),
        edge('il-approve', 'il-send'),
        edge('il-send', 'il-crews'),
        edge('il-crews', 'il-reviewed'),
      ],
    },
    {
      code: 'IL-03',
      title: 'Closeout',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Every energized project has its closeout clock running from the day the date is set, the project lead is reminded before it runs out, and the owner gets the package within ten business days, after the superintendent approves it.',
      nodes: [
        node('il-energized', 'trigger', 'Energization date set', 'Airtable', 'CalendarCheck', ['airtable', 'zapier'], 'The project lead sets the Energization date on the project’s row in Airtable, once the line is energized. Closeout due is ten business days later.', ['The project', 'Energization date', 'Closeout due'], 'The ten business days start at energization, so the clock starts from the same date.'),
        node('il-lead', 'action', 'Tell the project lead', 'Telegram', 'Bell', ['telegram'], 'Messages the project lead on Telegram: the project, the energization date, the day closeout is due and a link to the closeout form.', ['The project', 'Closeout due', 'The project lead'], 'The project lead knows the deadline from the first day, not the last.'),
        node('il-clock', 'wait', 'Wait to day eight', 'Delay by Zapier', 'Clock', ['zapier'], 'Waits until eight business days after energization, then checks the project again.', ['Energization date', 'Closeout due'], 'Two business days is enough time to finish a package that is nearly ready.'),
        node('il-remind', 'action', 'Remind if still open', 'Telegram', 'Warning', ['telegram'], 'If the package has not gone, reminds the project lead that closeout is due in two business days. On the day it is due, if it still has not gone, the Projects group is told.', ['Closeout sent on', 'Closeout due'], 'Nobody is reminded of a closeout already delivered, and none slips past its day unseen.'),
        node('il-package', 'wait', 'Package submitted', 'Airtable form', 'FileText', ['airtable'], 'The project lead submits the closeout package on Ironline’s closeout form: one PDF with the as-builts, the relay and continuity test reports and the closed punch list, as the crew made them.', ['The project', 'The package'], 'The package is attached once, to one row, so the superintendent and the owner see the same file.'),
        node('il-super', 'approve', 'Superintendent checks', 'Human in the Loop', 'UserCheck', ['zapier'], 'Emails the project’s superintendent a link to a Zapier review page with the package. They approve it or send it back there. Opening the link records nothing; only their choice on the page does.', ['The package', 'The superintendent’s answer'], 'Nothing reaches the owner until the superintendent who ran the job says the package is complete.'),
        node('il-answer', 'branch', 'Approved?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Writes the answer on the package’s row, Approved or Sent back, then sends an approved package to the owner and a sent-back one back to the project lead.', ['The superintendent’s answer'], 'The answer is on record either way, and the two paths never meet again.'),
        node('il-deliver', 'action', 'Send the package', 'Gmail + Airtable', 'EnvelopeSimple', ['gmail', 'airtable'], 'Emails the package to the owner’s closeout contact in a fixed template, copied to the superintendent and the project lead, and sets Closeout sent on.', ['The package', 'The owner’s contact', 'The superintendent'], 'A templated email with a package a person has released sends on its own.'),
        node('il-back', 'action', 'Tell the lead', 'Telegram', 'XCircle', ['telegram'], 'Tells the project lead the superintendent sent the package back. The superintendent says what to fix, in person or by phone, and the lead submits it again, which starts a new review; only a new approval sends it.', ['The package', 'The project lead'], 'A sent-back package is fixed and resubmitted, never sent as it was.'),
      ],
      edges: [
        edge('il-energized', 'il-lead'),
        edge('il-lead', 'il-clock'),
        edge('il-clock', 'il-remind'),
        edge('il-remind', 'il-package', 'A separate Zap'),
        edge('il-package', 'il-super'),
        edge('il-super', 'il-answer'),
        edge('il-answer', 'il-deliver', 'Approved'),
        edge('il-answer', 'il-back', 'Sent back'),
        edge('il-back', 'il-deliver', 'after a new approval'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Ironline Utility Infrastructure is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
