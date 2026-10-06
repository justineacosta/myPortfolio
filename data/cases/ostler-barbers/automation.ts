/**
 * Ostler’s Automation case page (spec 2026-10-05 per-site pages): the three
 * flows behind a chair booked in Cal.com, a new membership paid on Stripe and
 * a shelf order paid on Stripe. The site has no form, so every flow starts
 * from a booking or a payment. data/cases/index.ts registers it;
 * `npm run cases` renders it into public/cases/ostler-barbers/automation.html.
 * Only type imports, so Node can run it directly.
 */
import type { Automations, FlowEdge, FlowKind, FlowNode } from '../../automations.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: FlowKind, label: string, sub: string, icon: string, tools: ToolId[], what: string, reads: string[], why: string): FlowNode => ({ id, kind, label, sub, icon, tools, what, reads, why })
const edge = (from: string, to: string, label?: string): FlowEdge => (label ? { from, to, label } : { from, to })

const SITE = '/samples/ostler-barbers.html'
const NAME = 'Ostler'

const automation: Automations = {
  title: 'Ostler · Automation',
  description: 'The three flows behind Ostler’s chair bookings, its £95 membership and its shelf orders, on n8n, Make and Zapier: what runs, in what order, and where a barber or someone in the shop steps in.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AUTOMATION · OSTLER',
  heading: 'What happens after someone books a chair at Ostler',
  lede: 'Ostler’s site has no form. Its calls to action are buttons: Book a chair and Book with Tomas, Jonah or Arun open that barber’s own Cal.com page, and Become a member and Add to bag end on Stripe’s own checkout pages. So these flows start from a Cal.com booking or a Stripe payment. Each barber keeps their own book: every barber has a Cal.com account of their own, with one event type for each service they offer, so a booking lands in that barber’s book and carries their name into the flow. Leo, the apprentice, has his own page too, for chair four on Tuesdays and Wednesdays. Every email in these three flows is a fixed template that sends on its own, and none of them uses Claude. A barber approves any note Claude drafts for a client’s inbox before it is sent, as the AI agents page shows. Money is paid on Stripe’s own pages, and any refund is made by a person, by hand, in Stripe. Pick a flow, then open any step to see what it does, what it reads and why it is there.',
  sample: 'Sample flows for Ostler, a fictional barbershop in Fitzrovia used across this portfolio, not a client project.',
  tabsLabel: 'Flows',
  seeSite: 'See the site',
  panel: { reads: 'What it reads', why: 'Why it’s here', close: 'Close details' },
  flows: [
    {
      code: 'OS-01',
      title: 'Chair booking',
      site: NAME,
      href: SITE,
      platform: 'n8n',
      outcome: 'Every booking gets a confirmation at once and a reminder the day before, both saying it can be cancelled up to 24 hours ahead at no charge, and every cancellation frees the chair and tells the shop.',
      nodes: [
        node('os-cal', 'trigger', 'Cal.com booking', 'Webhook', 'CalendarCheck', ['cal-com', 'n8n'], 'Catches every booking made, moved or cancelled in any barber’s Cal.com book: the barber whose book it is, the service, the time, and the client’s name and email.', ['The barber’s book', 'The service', 'The time', 'Name and email'], 'Each barber’s Cal.com account sends its bookings to the same n8n address, and each booking names its barber, so one flow serves four books without mixing them up.'),
        node('os-kind', 'branch', 'Booked or cancelled?', 'Switch', 'ArrowsSplit', ['n8n'], 'Sends a new booking to be saved and confirmed, a moved one to retire its old time first, and a cancellation to free the chair.', ['What happened in Cal.com'], 'Cal.com tells the flow which of the three it was, so each takes its own path.'),
        node('os-save', 'action', 'Save the booking', 'Airtable', 'Table', ['airtable'], 'Adds the booking to Bookings, marked Booked: the barber, the service and its price, the time, and the client’s name and email.', ['The barber’s book', 'The service', 'The time', 'Name and email'], 'The day-before reminder works from this table, so it is written before any email goes out.'),
        node('os-confirm', 'action', 'Confirm the chair', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed template from the shop: the barber, the service, its price and length, the day and time, 6 Carrow Mews, three minutes from Goodge Street, and the site’s own line, cancel up to 24 hours ahead at no charge, with the booking’s Cal.com link to cancel or move it.', ['Name and email', 'The barber', 'The service', 'The time'], 'A templated confirmation sends on its own and needs no one’s yes. Cal.com sends its own calendar invite as well.'),
        node('os-remind', 'wait', 'Day-before reminder', 'Each day, 07:00', 'Bell', ['n8n', 'gmail'], 'Every morning at 07:00, London time, a second trigger in the same workflow finds tomorrow’s bookings still marked Booked and emails each a fixed reminder: the barber, the time, the address, and that it can still be cancelled at no charge until 24 hours before. If none is booked for tomorrow, the run ends there and sends nothing.', ['Bookings marked Booked for tomorrow'], 'The shop opens at 08:00 at the earliest, so a reminder sent at 07:00 the day before always arrives more than 24 hours ahead, while the free cancellation still stands.'),
        node('os-old', 'action', 'Retire the old time', 'Airtable', 'CalendarX', ['airtable'], 'When a booking is moved, finds the booking it replaces in Bookings and marks it Moved, then saves the new time as a booking of its own.', ['The booking it replaces'], 'A moved booking never gets a reminder for the time it left behind.'),
        node('os-find', 'action', 'Find the booking', 'Airtable', 'MagnifyingGlass', ['airtable'], 'Looks the cancelled booking up in Bookings. If it is not there, because it was booked before the flow went live, the flow still goes on, from what Cal.com sent.', ['The cancelled booking'], 'A search that finds nothing must not end the run quietly: the shop still needs to know the chair is free.'),
        node('os-free', 'action', 'Free the chair', 'Airtable', 'Armchair', ['airtable'], 'Marks the booking Cancelled, with when it was freed. Cal.com has already opened the hour again in the barber’s book. The flow charges nothing, whenever the cancellation comes.', ['The booking'], 'A cancelled booking gets no reminder, and the freed hour is where the chair gap agent, on the AI agents page, starts its offer to members.'),
        node('os-tell', 'action', 'Tell the front room', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages the shop’s Front room group on Telegram: whose chair is free, and when.', ['The barber', 'The time'], 'The barber and the shop see a gap the moment it opens, while there is still time to fill it.'),
      ],
      edges: [
        edge('os-cal', 'os-kind'),
        edge('os-kind', 'os-save', 'Booked'),
        edge('os-kind', 'os-old', 'Moved'),
        edge('os-kind', 'os-find', 'Cancelled'),
        edge('os-old', 'os-save'),
        edge('os-save', 'os-confirm'),
        edge('os-confirm', 'os-remind', 'The day before'),
        edge('os-find', 'os-free'),
        edge('os-free', 'os-tell'),
      ],
    },
    {
      code: 'OS-02',
      title: 'New membership',
      site: NAME,
      href: SITE,
      platform: 'make',
      outcome: 'Every new member is checked against their barber’s cap of forty: with room, they are welcomed and the barber sets their standing slot by hand; with none, they join that barber’s waiting list and are told so.',
      nodes: [
        node('os-join', 'trigger', 'New membership', 'Stripe', 'CreditCard', ['stripe', 'make'], 'Starts when someone pays for the £95 membership on Stripe’s own checkout page and a new subscription begins. Become a member offers one Stripe Payment Link per barber, and each link marks its subscription with that barber’s name.', ['The new subscription', 'The barber, from its link', 'Name and email'], 'Membership is a standing appointment with one barber, and the cap of forty is per barber, so the barber has to come with the payment.'),
        node('os-count', 'action', 'Count their members', 'Airtable API call', 'ListNumbers', ['airtable'], 'Asks Airtable for that barber’s members who hold, or are waiting to be given, a standing slot. Make an API call always returns one bundle with the list, even an empty one.', ['The barber', 'The Members table'], 'A search that found no members would end the route. A list has a length to count, even when it is zero.'),
        node('os-member', 'action', 'Save the member', 'Airtable', 'Table', ['airtable'], 'Adds the member to Members: the name, email, barber and Stripe subscription, marked Awaiting slot when the barber has fewer than forty, or Waiting list when they have forty.', ['Name and email', 'The barber', 'How many members they have'], 'Saved before any email goes out, so a later failure never loses a member who has paid.'),
        node('os-room', 'branch', 'Room under forty?', 'Router', 'ArrowsSplit', ['make'], 'Takes the Room route for a member marked Awaiting slot, and the Full route for one on the Waiting list.', ['The member’s status'], 'The site caps membership at forty per barber, and chair one already has a waiting list.'),
        node('os-welcome', 'action', 'Welcome template', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed welcome: £95 a month, cancel any month, what membership holds, and that their barber will be in touch to agree the standing hour.', ['Name and email', 'The barber'], 'A templated welcome sends on its own. The hour itself is the barber’s to set.'),
        node('os-ask', 'action', 'Ask for the slot', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Messages the Front room group on Telegram: a new member for this barber, with their name and email, waiting for a standing slot.', ['Name and email', 'The barber'], 'The barber hears the day someone joins, so the member is not left waiting for their first hour.'),
        node('os-slot', 'approve', 'Barber sets the slot', 'By hand', 'UserCheck', ['cal-com', 'airtable'], 'The barber agrees the standing hour with the member, every three or four weeks, holds it in their own Cal.com book, and marks the member Standing in Members, all by hand.', ['The member', 'The barber’s book'], 'The barber confirms the standing slot by hand: only they know which hour in their book can be held for good.'),
        node('os-wait', 'action', 'Waiting-list template', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed note: their barber has forty members, they are on that barber’s waiting list, and someone from the shop will be in touch about their membership.', ['Name and email', 'The barber'], 'The site says the cap is forty, so the member hears at once, in writing, that there is no slot yet.'),
        node('os-flag', 'action', 'Flag the wait', 'Telegram', 'Warning', ['telegram'], 'Messages the Front room group: a new member is on this barber’s waiting list and has paid, so someone should call them. Any refund, or ending the subscription, is done by a person in Stripe, by hand.', ['Name and email', 'The barber'], 'A member waiting for a slot has still paid, and what happens to that payment is a person’s call, never a flow’s.'),
      ],
      edges: [
        edge('os-join', 'os-count'),
        edge('os-count', 'os-member'),
        edge('os-member', 'os-room'),
        edge('os-room', 'os-welcome', 'Room'),
        edge('os-room', 'os-wait', 'Full'),
        edge('os-welcome', 'os-ask'),
        edge('os-ask', 'os-slot'),
        edge('os-wait', 'os-flag'),
      ],
    },
    {
      code: 'OS-03',
      title: 'Shelf order',
      site: NAME,
      href: SITE,
      platform: 'zapier',
      outcome: 'Every shelf order paid on Stripe lands on the pick list with a templated order email, delivery is free over £50, and a same-day collection alerts the shop at once.',
      nodes: [
        node('os-paid', 'trigger', 'Shelf checkout', 'Stripe', 'CreditCard', ['stripe', 'zapier'], 'Starts when someone pays for their bag on Stripe’s own checkout page: what is in it, the total, and whether they chose UK delivery or to collect it the same day.', ['What is in the bag', 'The total', 'Delivery or collection', 'Name, email and address'], 'The bag on the site hands over to Stripe to take the money, so the flow starts once it is paid.'),
        node('os-shelf', 'action', 'Shelf orders only', 'Filter by Zapier', 'Funnel', ['zapier'], 'Goes on only for a checkout that came from the bag, not a membership, and only when it is paid.', ['Where the checkout came from', 'Payment status'], 'Memberships are paid through Stripe checkouts too, and they belong to the membership flow.'),
        node('os-pick', 'action', 'Add to the pick list', 'Airtable', 'Package', ['airtable'], 'Adds the order to Orders, marked To pick: the items, the total, the delivery charge, delivery or collection, and the name, email and address.', ['What is in the bag', 'The total', 'Delivery or collection', 'Name, email and address'], 'The To pick view is the shop’s pick list, and the order is on it before any email goes out.'),
        node('os-email', 'action', 'Order email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Emails a fixed order template: what they bought and the total, with one line for how it reaches them. Free UK delivery for an order over £50, UK delivery at the rate they paid for a smaller one, or ready to collect from 6 Carrow Mews the same day.', ['Name and email', 'What is in the bag', 'The total', 'Delivery or collection'], 'A templated order email sends on its own, and it goes before the paths, so both ways get it once.'),
        node('os-way', 'branch', 'Collect or post?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Takes the Collect today path for a collection, and the UK delivery path for a parcel.', ['Delivery or collection'], 'Only a same-day collection needs the shop to act at once.'),
        node('os-alert', 'action', 'Alert the front room', 'Telegram', 'Bell', ['telegram'], 'Messages the Front room group on Telegram: a bag to collect today, with the name and the items.', ['Name', 'What is in the bag'], 'The site promises collection the same day, so the shop hears in time to set it aside.'),
        node('os-hand', 'action', 'Picked by hand', 'By hand', 'Package', ['airtable'], 'Someone in the shop works the To pick view. A collection goes into a bag behind the counter, marked Ready, then Collected when it goes. A parcel is packed and posted, and marked Posted.', ['The order', 'The address, for a parcel'], 'No flow picks, packs or posts. This is not a Zapier step, and the Zap’s two paths never join: each ends in the Zap, and the people in the shop work one list, which keeps every order in view until it has been handed over or sent.'),
      ],
      edges: [
        edge('os-paid', 'os-shelf'),
        edge('os-shelf', 'os-pick'),
        edge('os-pick', 'os-email'),
        edge('os-email', 'os-way'),
        edge('os-way', 'os-hand', 'UK delivery'),
        edge('os-way', 'os-alert', 'Collect today'),
        edge('os-alert', 'os-hand'),
      ],
    },
  ],
  footer: { note: 'Sample flows, drawn the way I build them. Ostler is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default automation
