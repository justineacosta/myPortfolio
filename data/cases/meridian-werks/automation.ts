/**
 * Meridian Werks’ Automation case page (spec 2026-10-05 per-site pages): the
 * three flows behind its bookings, its health reports and its fleet reports.
 * MW-01 is the general Automations page’s Service booking, on Zapier, kept
 * with its code, title, trigger, steps and outcome and given depth; MW-02 is
 * on n8n and MW-03 on Make, in that order. Rotterdam: amounts are in euros, a
 * registration number stays on the job card, and no step diagnoses a car.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/meridian-werks/automation.html. Only type imports, so Node can
 * run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/meridian-werks.html'
const NAME = 'Meridian Werks'

const automation: Automations = {
  title: 'Meridian Werks · Automation',
  description: 'The three flows behind Meridian Werks’ service bookings, health reports and fleet reports, on Zapier, n8n and Make: what runs, in what order, and where a person steps in. No work begins before the owner says yes.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · MERIDIAN WERKS',
  heading: 'What happens after a booking, a diagnosis or the end of the month at Meridian Werks',
  lede: 'Meridian Werks is an independent workshop at Loodsweg 14, Rotterdam, since 2012. Its site takes a booking in four short steps: the vehicle, the service, the date and the details, and it asks the owner to describe the symptom rather than the repair, because diagnosis is the workshop’s job. It promises to confirm by phone within one working day, that no work begins before the findings are documented and approved, and that any variation is approved before it happens. These three flows keep those promises: bookings on Zapier, health reports on n8n and fleet reports on Make. A person stays in each one. Ilse Brandt, the workshop manager, calls every owner to confirm a booking, prices every estimate and checks every report before it goes. Anton Vosloo signs off every calibration and every pre-purchase inspection. The owner’s own yes starts the work, and a variation needs a new one. In these flows Claude drafts only the plain-language summary in a health report, rewording what the technician recorded and never diagnosing, and Ilse checks it before it reaches the owner’s inbox. Amounts are in euros, and a registration number stays on the job card: it never goes into a group chat or an email subject. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Meridian Werks, a fictional Rotterdam workshop used across this portfolio, not a client project. Times, prices and figures are illustrative.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'MW-01',
      title: 'Service booking',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'The slot is held, the job card is open and the workshop knows before the owner closes the page. The owner has a receipt at once, and Ilse confirms the booking by phone within one working day.',
      nodes: [
        node('mw-form', 'trigger', 'Booking form', 'Webhooks by Zapier', 'WebhooksLogo', ['zapier'], 'Catches the booking from the site’s four steps: the vehicle (make, model, year, the registration if the owner gave it, mileage in km, and its use: Private, Performance / track, Collection or Fleet / commercial), the service, the date and slot, and the details: the symptom in the owner’s words, with their name, email and phone.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'Zapier’s webhook trigger starts the Zap the moment the form is sent.'),
        node('mw-slot', 'action', 'Hold the slot', 'Cal.com', 'CalendarCheck', ['cal-com'], 'Books the chosen slot on the workshop calendar in Cal.com as a request, which waits for Ilse to confirm it after her call. If another owner took the slot a moment earlier, nothing is held, and the job card and the owner’s email say so.', ['Chosen slot', 'The vehicle'], 'Two owners can never get the same slot.'),
        node('mw-card', 'action', 'Open a job card', 'Airtable', 'Table', ['airtable'], 'Creates the job card: the vehicle, the work asked for, the slot, whether it is held, and the owner. The registration, when given, is kept here, and no message, subject, report or log carries it. Call by is the end of the next working day.', ['The vehicle', 'What it needs', 'Chosen slot', 'Owner’s details'], 'The technicians work from the card, not from an email, and the registration stays on the job record.'),
        node('mw-workshop', 'action', 'Tell the workshop', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Posts the new booking to the workshop’s group chat: the job number, the make, model and year, the service, the symptom, the slot and whether it is held, and a link to the card. Never the registration or the owner’s contact details.', ['The job card'], 'The team sees tomorrow’s work as it is booked, and personal details stay on the card.'),
        node('mw-receipt', 'action', 'Email the owner', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner a receipt in a fixed template: the request is in, the slot they asked for is held (or was just taken), the address and what to bring, and that Ilse will call to confirm within one working day. The email is a receipt, not the confirmation: the call is. Its subject never holds the registration.', ['Chosen slot', 'Owner’s details', 'Whether it is held'], 'A clear receipt stops the “is this booked?” call, and says when the real confirmation comes.'),
        node('mw-call', 'approve', 'Ilse calls the owner', 'By phone', 'Phone', ['cal-com', 'airtable'], 'Ilse calls the owner within one working day, as the site promises, talks through the symptom and agrees the date. She confirms the booking in Cal.com, or books the time they agreed, and sets the card Confirmed. Each working morning at 07:30 a second Zap sends her the calls due that day.', ['The job card', 'Call by'], 'The site confirms by phone, so a person confirms every booking, and no email does it for her.'),
      ],
      edges: [
        edge('mw-form', 'mw-slot'),
        edge('mw-slot', 'mw-card'),
        edge('mw-card', 'mw-workshop'),
        edge('mw-workshop', 'mw-receipt'),
        edge('mw-receipt', 'mw-call'),
      ],
    },
    {
      code: 'MW-02',
      title: 'Health report',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every diagnosed car’s findings, photographs and fixed estimate reach the owner as a health report Ilse has checked, and work starts only on the owner’s yes. Any variation goes back to the owner for a new yes before it happens.',
      nodes: [
        node('mw-done', 'trigger', 'Diagnostics done', 'Airtable', 'Wrench', ['airtable', 'n8n'], 'The technician who diagnosed the car records each finding on the job card in Airtable, in their own words, with photographs and a priority: needed now, upcoming or optional. Then they set the card to Diagnostics done. n8n checks for it every minute.', ['The findings', 'Photographs', 'Priorities'], 'The report starts from what the technician measured and wrote down, never from a guess.'),
        node('mw-sum', 'ai', 'Draft the summary', 'Claude', 'Sparkle', ['claude'], 'Claude rewords the findings the technician recorded into plain language. It never diagnoses: it adds no finding, cause, price or date, and it never reads the registration or the owner’s details. Its draft goes to Ilse, and nothing it writes reaches the owner’s inbox until she has checked it.', ['The findings', 'Make and model'], 'An owner reads plain words more easily than a technician’s shorthand, and Ilse edits a draft instead of starting from nothing.'),
        node('mw-check', 'approve', 'Workshop checks', 'Telegram forms', 'UserCheck', ['telegram', 'airtable'], 'Ilse prices each finding into the fixed estimate, in euros, and checks Claude’s words against the technician’s, changing what she chooses. For a pre-purchase inspection, a performance refinement, or a finding that is calibration work, Anton signs off first; his sign-off on the finished calibration, after the work, is by hand. Only Ilse’s Send on her form moves the report on. She can choose to call instead: then nothing is emailed, and, as at Ask Ilse to call, she calls the owner and records their answer on the report.', ['The findings', 'Claude’s draft', 'The estimate', 'Ilse’s choice: send or call'], 'Nothing Claude drafts reaches the owner’s inbox without Ilse’s yes, and Anton still signs off every calibration and pre-purchase inspection.'),
        node('mw-report', 'action', 'Send health report', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the owner the health report: the findings in plain words, the photographs, and the fixed estimate split into needed now, upcoming and optional, in euros, with one button that opens the answer form. The subject names the make and model, never the registration. A pre-purchase inspection’s report goes with no answer form: the buyer does not own the car yet, so there is no work to approve, and MW-02 ends there with the job Done.', ['The report as checked', 'Photographs', 'The estimate'], 'Documented findings, photographs, priorities and a transparent estimate, as the site promises, before any work.'),
        node('mw-owner', 'approve', 'Owner approves', 'Answer form', 'UserCheck', ['n8n'], 'The button opens a form page. The owner picks needed now only, needed now and upcoming, everything listed, not now, or call me first, and sends it. Opening the link records nothing; only sending the form does. n8n keeps the run waiting at this step for up to seven days.', ['The owner’s answer'], 'No work begins before the findings are documented and approved, and the yes is the owner’s.'),
        node('mw-answer', 'branch', 'Owner’s answer', 'Switch', 'ArrowsSplit', ['n8n'], 'Records the answer on the report, then sends an approval on to the workshop, and anything else, or no answer in seven days, to Ilse.', ['The owner’s answer'], 'Only a yes releases work; every other answer reaches a person.'),
        node('mw-work', 'action', 'Release the work', 'Airtable', 'Wrench', ['airtable', 'telegram'], 'Sets the job Approved, with the items approved and their total in euros, and tells the workshop group: the job number, the make and model and what is approved. Never the registration.', ['The owner’s answer', 'The estimate'], 'The technician starts only on what the owner said yes to.'),
        node('mw-ilse', 'action', 'Ask Ilse to call', 'Telegram', 'Phone', ['telegram'], 'Tells Ilse the owner chose not now or call me first, or did not answer within seven days: she calls the owner and records their answer on the report by hand. When Ilse chooses at her check to call instead, the report is not emailed, and she does the same. On a phone yes she sets the job Approved, records when, and tells the workshop group. After a variation she sets the job back to Approved whatever the answer, as the approved work goes on, so the next variation can start the loop again. Nothing begins without a yes.', ['The owner’s answer', 'The report'], 'An owner who wants to talk it through hears from a person, not from another email.'),
        node('mw-var', 'trigger', 'Variation found', 'Airtable', 'Warning', ['airtable'], 'During the work, a technician finds something beyond the approved estimate. They stop that part of the work, record it as a new finding with photographs, and set the job to Variation found. It runs through MW-02 again: Claude’s summary, the workshop’s check, a report headed as a variation, and a new yes from the owner. Only then does that work go ahead. Once the owner has answered, the job is back at Approved, set by Release the work or by Ilse after her call, so a later variation starts the loop again.', ['The new finding', 'Photographs'], 'Any variation is approved before it happens, as the site promises, so it needs the owner’s new yes, not the old one.'),
      ],
      edges: [
        edge('mw-done', 'mw-sum'),
        edge('mw-sum', 'mw-check'),
        edge('mw-check', 'mw-report'),
        edge('mw-report', 'mw-owner'),
        edge('mw-owner', 'mw-answer'),
        edge('mw-answer', 'mw-work', 'Approved'),
        edge('mw-answer', 'mw-ilse', 'Not yet'),
        edge('mw-var', 'mw-sum', 'Back for a new yes'),
      ],
    },
    {
      code: 'MW-03',
      title: 'Fleet report',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'On the 1st of each month every fleet client’s report of last month’s jobs, days off the road, uptime and costs is drafted for Ilse, and each one goes to the client only after she has checked it.',
      nodes: [
        node('mw-first', 'trigger', 'On the 1st', 'Schedule', 'CalendarCheck', ['make'], 'At 06:00 on the 1st of each month, Rotterdam time, Make starts the fleet reports for the month just ended.', ['Today’s date'], 'Fleet contracts come with monthly reporting, so the reports start the day the month closes.'),
        node('mw-clients', 'action', 'Find fleet clients', 'Airtable API call', 'MagnifyingGlass', ['airtable'], 'Asks Airtable for every fleet client with an active contract, as one list. An empty list ends the run, with nothing to report.', ['Fleet clients'], 'Each client with a contract gets a report, and only they do.'),
        node('mw-month', 'action', 'Gather the month', 'Airtable API call', 'Table', ['airtable'], 'For each client in turn, asks for last month’s jobs on their vehicles: the work done, the days off the road and the cost in euros. A month with no visits is an empty list, and the report says so.', ['The client', 'Last month’s jobs'], 'The figures come from the job cards the workshop already keeps, not from anyone’s memory.'),
        node('mw-draft', 'action', 'Draft the report', 'Airtable', 'Database', ['airtable'], 'Writes the report on its own row in a fixed template: the number of jobs, days off the road, uptime and costs, then one line per job, naming each vehicle by the client’s own fleet number and its model, never by registration. Its Status is To check. Claude writes none of it.', ['Last month’s jobs', 'Vehicles on contract'], 'Ilse checks a finished draft beside the job cards it came from.'),
        node('mw-tell', 'action', 'Tell Ilse', 'Telegram', 'Bell', ['telegram'], 'Messages Ilse on Telegram: a fleet report is ready to check, for which client and month, with a link to its row.', ['The report'], 'Ilse knows on the 1st which reports are waiting for her.'),
        node('mw-checks', 'approve', 'Ilse checks', 'In Airtable', 'UserCheck', ['airtable'], 'Ilse reads each report against the job cards, corrects anything that needs it, adds a note if she likes, and sets it Checked. Only Ilse, and the flow’s own account, can change its Status, and the flow never sets Checked.', ['The report', 'The job cards'], 'No fleet report reaches a client before Ilse has checked it, as she does every report.'),
        node('mw-send', 'action', 'Send the report', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails the checked report to the client’s reporting address in a fixed template, from workshop@meridianwerks.nl. The subject names Meridian Werks, the month and the client, never a registration.', ['The checked report', 'The client’s email'], 'The client gets the month in one email, as their contract promises.'),
        node('mw-sent', 'action', 'Mark it sent', 'Airtable', 'FlagCheckered', ['airtable'], 'Marks the report Sent, with the time, so a later edit never sends it twice.', ['The report', 'Sent at'], 'Ilse can see at a glance which clients have this month’s report.'),
      ],
      edges: [
        edge('mw-first', 'mw-clients'),
        edge('mw-clients', 'mw-month'),
        edge('mw-month', 'mw-draft'),
        edge('mw-draft', 'mw-tell'),
        edge('mw-tell', 'mw-checks'),
        edge('mw-checks', 'mw-send'),
        edge('mw-send', 'mw-sent'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Meridian Werks is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
