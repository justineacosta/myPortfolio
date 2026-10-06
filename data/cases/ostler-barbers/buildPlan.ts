/**
 * Ostler’s Build plan case page (spec 2026-10-05 per-site pages): the
 * blueprint behind the three flows on its Automation page, OS-01 on n8n,
 * OS-02 on Make and OS-03 on Zapier, with the helpers, data, tests and
 * handover they need. The site has no form: bookings come from each barber’s
 * own Cal.com book, and memberships and shelf orders are paid on Stripe’s own
 * pages. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/ostler-barbers/build-plan.html. Only type imports, so Node can
 * run it directly.
 */
import type { IconName, NodeKind, Plan, PlanEdge, PlanNode, Workflow } from '../../buildPlan.ts'
import type { ToolId } from '../../../lib/brand/tools.ts'

const node = (id: string, kind: NodeKind, label: string, sub: string, icon: IconName, tools: ToolId[], type: string, settings: [string, string][], what: string): PlanNode =>
  ({ id, kind, label, sub, icon, type, settings, what, tools })
const edge = (from: string, to: string, label?: string): PlanEdge => (label ? { from, to, label } : { from, to })

/** The money rule, in every flow’s watch-outs. */
const MONEY = 'The money rule: every payment is made by the customer on Stripe’s own pages, and no flow takes, changes or returns money. Any refund is a person’s job, done by hand in Stripe.'

const OS01: Workflow = {
  code: 'OS-01',
  title: 'Chair booking',
  platform: 'n8n',
  outcome: 'Every booking gets a confirmation at once, and a reminder the morning before when it was booked before that morning’s 07:00 run, both saying it can be cancelled up to 24 hours ahead at no charge; every cancellation frees the chair and tells the shop.',
  trigger: 'n8n’s Webhook hears every booking made, moved or cancelled in any barber’s Cal.com book; a Schedule Trigger in the same workflow starts the reminders each morning at 07:00, London time.',
  exits: ['Confirmed, reminder to come', 'Moved, old time retired', 'Cancelled, front room told', 'Reminded, or none due'],
  watch: [
    MONEY,
    'The site has no form. Each barber keeps their own book: Tomas, Jonah, Arun and Leo each have a Cal.com account of their own, with one event type per service they offer, named for them, like Tomas · Ostler cut. Book with Tomas opens Tomas’s page, so a booking lands in his book and nobody else’s. Each account has the same webhook, set once in Settings › Developer › Webhooks, and every booking names the barber whose book it came from.',
    'Book a chair opens a short chooser on the site: the four barbers, each linking to their own Cal.com page. Leo’s link sits there and in the site’s line on apprentice cuts, under the services and the barbers. His page offers the apprentice cut only, £34, at chair four, with his Cal.com availability set to Tuesdays and Wednesdays. The site gives no length for it, so its length is Tomas’s to set.',
    'Both emails are fixed templates, so they send on their own. Each repeats the site’s line, cancel up to 24 hours ahead at no charge, with the booking’s own Cal.com link to cancel or move it. The site states no fee for a later cancellation, so the templates state none, and the flow charges nothing at any time.',
    'The reminder run is at 07:00 and the shop opens at 08:00 at the earliest, so every reminder arrives more than 24 hours before its booking, while the free cancellation still stands, and says until when. A booking made after that morning’s run, for the next day or the same day, gets no reminder: its confirmation, minutes old, already holds the time.',
    'In n8n, a search that finds nothing ends the run quietly. All three searches have Always Output Data on, and an If after each says what an empty result does: a moved booking with no old row is still saved, a cancellation with no row still reaches the front room, from what Cal.com sent, and a morning with nothing due ends at Nothing tomorrow.',
    'Save the booking is a Create or update matched on the booking’s uid, so a booking Cal.com sends twice is one row. A moved booking arrives under a new uid, so its old row is marked Moved first and never reminded.',
    'Cal.com opens a cancelled hour in the barber’s book again on its own; the flow only marks the row Cancelled with Freed on. The chair gap agent, on the AI agents page, starts from that row.',
    'Membership already pays for a member’s cut and their beard shape or neck tidy between cuts, so the barber books those on two hidden event types of their own, Member’s cut and Member’s tidy, in the member’s name. They arrive like any booking and get the same confirmation and reminder, but Keep the booking leaves their Price empty, and the confirmation says Covered by your membership instead of a price. Price only ever means the site’s list price.',
    'The workflow’s timezone is Europe/London. Its error workflow is OS-H02, and Save the booking retries three times before the run fails there.',
  ],
  nodes: [
    node('a1', 'trigger', 'Cal.com booking', 'Webhook', 'WebhooksLogo', ['n8n', 'cal-com'], 'n8n · Webhook', [['Path', '/os/booking/ and a long random token, known only to the barbers’ Cal.com accounts'], ['Method', 'POST'], ['Respond', 'Immediately'], ['Sent by', 'each barber’s Cal.com account, for Booking Created, Booking Rescheduled and Booking Cancelled']], 'A booking is made, moved or cancelled in a barber’s Cal.com book, and Cal.com posts it here.'),
    node('a2', 'action', 'Keep the booking', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Keeps', 'what happened, the booking’s uid, the barber whose book it is, the event type, the start in London time, its length, the client’s name and email, and on a move the uid it replaces'], ['Price', 'from a fixed list: the six services as the site prices them, and Leo’s apprentice cut at £34; empty for a Member’s cut or Member’s tidy, which membership covers'], ['Email', 'trimmed and lowercased']], 'Keeps what the flow needs from Cal.com, and adds the service’s list price, or none for a member’s visit.'),
    node('a3', 'branch', 'What happened?', 'Switch', 'ArrowsSplit', ['n8n'], 'n8n · Switch', [['Booked', 'Booking Created'], ['Moved', 'Booking Rescheduled'], ['Cancelled', 'Booking Cancelled']], 'Sends each booking down the path for what happened to it.'),
    node('a4', 'action', 'Find the old time', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Bookings'], ['Filter by formula', 'Booking uid is the one this booking replaces'], ['Always Output Data', 'On, so an old time that was never saved goes on as not found']], 'Looks up the booking the move replaces.'),
    node('a5', 'branch', 'Old time found?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Found', 'the search returned a record ID'], ['Not found', 'it returned an empty item']], 'Retires the old row if there is one, and goes straight on to save the new time if not.'),
    node('a6', 'action', 'Retire the old time', 'Airtable', 'XCircle', ['airtable'], 'n8n · Airtable › Update record', [['Table', 'Bookings'], ['Record', 'the one found'], ['Sets', 'Status = Moved']], 'Marks the old time Moved, so it is never reminded.'),
    node('a7', 'action', 'Save the booking', 'Airtable', 'Database', ['airtable'], 'n8n · Airtable › Create or update', [['Table', 'Bookings'], ['Match on', 'Booking uid'], ['Sets', 'Barber, Service, Price, Starts, Length, Client, Email, Status = Booked'], ['Retry on fail', 'On, 3 tries']], 'Adds the booking to Bookings, marked Booked, before any email goes out.'),
    node('a8', 'end', 'Confirm the chair', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'OS · Gmail (n8n), the shop’s own address'], ['Template', 'Your chair at Ostler'], ['Holds', 'the barber, the service, its price, or Covered by your membership for a member’s visit, its length, the day and time, 6 Carrow Mews, London W1T 4QS, three minutes from Goodge Street, step-free, the shop’s phone, 020 7946 0381, and cancel up to 24 hours ahead at no charge, with the booking’s Cal.com link'], ['Written by', 'a fixed template, not Claude']], 'Emails the client their confirmation.'),
    node('a9', 'action', 'Find the booking', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Bookings'], ['Filter by formula', 'Booking uid is the cancelled one'], ['Always Output Data', 'On, so a booking made before the flow went live still reaches the front room']], 'Looks up the cancelled booking.'),
    node('a10', 'branch', 'In Bookings?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Found', 'the search returned a record ID'], ['Not found', 'it returned an empty item']], 'Frees the row if there is one, and tells the front room either way.'),
    node('a11', 'action', 'Free the chair', 'Airtable', 'Database', ['airtable'], 'n8n · Airtable › Update record', [['Table', 'Bookings'], ['Record', 'the one found'], ['Sets', 'Status = Cancelled, Freed on = now']], 'Marks the booking Cancelled, with when the chair was freed.'),
    node('a12', 'helper', 'Tell the front room', 'OS-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'OS-H01 · Alert the shop'], ['Chat', 'Front room'], ['Says', 'whose chair is free, the day and time, the service, and Not in Bookings when the row was not found'], ['Wait for it', 'No']], 'Tells the shop’s Front room group whose chair is free, and when.'),
    node('a13', 'trigger', 'Each morning', 'Schedule Trigger', 'Clock', ['n8n'], 'n8n · Schedule Trigger', [['Runs', 'every day at 07:00'], ['Timezone', 'Europe/London, from the workflow’s settings']], 'Every morning, an hour before the shop opens at the earliest, the reminder run starts.'),
    node('a14', 'action', 'Tomorrow’s bookings', 'Airtable', 'MagnifyingGlass', ['airtable'], 'n8n · Airtable › Search records', [['Table', 'Bookings'], ['Filter by formula', 'Status is Booked, Day is tomorrow, Reminded on is empty'], ['Always Output Data', 'On, so an empty morning goes on to the If, not out of the run unseen']], 'Finds every booking for tomorrow that is still Booked and not yet reminded.'),
    node('a15', 'branch', 'Any to remind?', 'If', 'GitBranch', ['n8n'], 'n8n · If', [['Yes', 'the item has a record ID'], ['No', 'the empty item from an empty search']], 'Sends each booking found on to its reminder, and an empty morning to its end.'),
    node('a16', 'action', 'Send the reminder', 'Gmail', 'EnvelopeSimple', ['gmail'], 'n8n · Gmail › Send message', [['Connection', 'OS · Gmail (n8n), the shop’s own address'], ['Template', 'Tomorrow at Ostler'], ['Holds', 'the barber, the service, the time, the address, and that it can still be cancelled at no charge until 24 hours before, with the booking’s Cal.com link'], ['Written by', 'a fixed template, not Claude']], 'Emails the client their reminder.'),
    node('a17', 'end', 'Mark reminded', 'Airtable', 'FlagCheckered', ['airtable'], 'n8n · Airtable › Update record', [['Table', 'Bookings'], ['Sets', 'Reminded on = today']], 'Notes the reminder on the booking, so a second run never sends it twice.'),
    node('a18', 'end', 'Nothing tomorrow', 'No Operation', 'FlagCheckered', ['n8n'], 'n8n · No Operation, do nothing', [['Means', 'no booking is due a reminder; the run ends as a success']], 'Ends a morning with no reminders to send.'),
  ],
  edges: [
    edge('a1', 'a2'), edge('a2', 'a3'),
    edge('a3', 'a7', 'Booked'), edge('a3', 'a4', 'Moved'), edge('a3', 'a9', 'Cancelled'),
    edge('a4', 'a5'), edge('a5', 'a6', 'Found'), edge('a5', 'a7', 'Not found'), edge('a6', 'a7'),
    edge('a7', 'a8'),
    edge('a9', 'a10'), edge('a10', 'a11', 'Found'), edge('a10', 'a12', 'Not found'), edge('a11', 'a12'),
    edge('a13', 'a14'), edge('a14', 'a15'), edge('a15', 'a16', 'Yes'), edge('a15', 'a18', 'No'), edge('a16', 'a17'),
  ],
}

const OS02: Workflow = {
  code: 'OS-02',
  title: 'New membership',
  platform: 'make',
  outcome: 'Every new member is checked against their barber’s cap of forty: with room, they are welcomed and the barber sets their standing slot by hand; with none, they join that barber’s waiting list and are told so.',
  trigger: 'Make’s Stripe Watch Events hears customer.subscription.created, from one of the barbers’ membership Payment Links.',
  exits: ['Welcomed, barber sets the slot', 'On the waiting list, shop told'],
  watch: [
    MONEY,
    'Become a member leads to one Stripe Payment Link per barber, £95 a month. Each link carries the barber’s name in its subscription metadata, set when the link is made, so the subscription says whose cap it counts against.',
    'The barber confirms the standing slot by hand: they agree the hour with the member, book it in their own Cal.com page in the member’s name, every three or four weeks, and mark the member Standing. No flow picks an hour.',
    'Count their members is a Make an API call module, not a search, so it returns one bundle with a list, even an empty one, and the cap is read from the list’s length. A search that found no members would end the route, and a barber’s first member would never be saved.',
    'The count takes Awaiting slot and Standing only. Waiting list and Ended do not hold a slot, so they never count toward the forty.',
    'The scenario has Sequential processing on, so two members joining the same barber at the same moment are counted one after the other, and only one can take the fortieth place.',
    'Save the member runs before either email, so a member who has paid is never lost to a failed send.',
    'A member on the waiting list has still paid. The flow never refunds, pauses or ends a subscription: someone in the shop calls them, and any refund or ending is done by a person in Stripe, by hand.',
    'No flow watches for a member leaving. A member cancels any month through Stripe’s customer portal or by asking the shop; each Monday someone checks Stripe’s subscriptions, marks the member Ended, frees the hour in the barber’s book and offers the slot to the first on that barber’s waiting list, all by hand.',
    'The other benefits, a beard shape between cuts and 10% off the shelf with refills at cost, are given in the shop by hand. First refusal on Friday and Saturday evenings is the chair gap agent’s, on the AI agents page.',
    'Every module that writes has an error route that posts the step and the error to /os/failed and ends in Break, so Make keeps the run to retry.',
  ],
  nodes: [
    node('b1', 'trigger', 'New membership', 'Stripe', 'CreditCard', ['stripe'], 'Make · Stripe › Watch Events', [['Scenario', 'OS-02 · New membership'], ['Events', 'customer.subscription.created'], ['Sequential processing', 'On']], 'A member pays on a barber’s Payment Link, and Stripe reports the new subscription.'),
    node('b2', 'action', 'Get the member', 'Stripe API call', 'MagnifyingGlass', ['stripe'], 'Make · Stripe › Make an API call', [['Call', 'GET /v1/customers/{customer}'], ['Returns', 'the name and email given at checkout']], 'Reads the member’s name and email from their Stripe customer.'),
    node('b3', 'action', 'Count their members', 'Airtable API call', 'Calculator', ['airtable'], 'Make · Airtable › Make an API call', [['Call', 'GET /v0/{base}/Members'], ['Formula', 'Barber is the subscription’s barber, Status is Awaiting slot or Standing'], ['Returns', 'one bundle with a list of records, even an empty one']], 'Lists the barber’s members who hold, or are waiting to be given, a standing slot.'),
    node('b4', 'action', 'Save the member', 'Airtable', 'Database', ['airtable'], 'Make · Airtable › Create a record', [['Table', 'Members'], ['Sets', 'Member, Email, Barber, Stripe subscription, Joined on'], ['Status', 'Awaiting slot when the list has fewer than 40 records, otherwise Waiting list']], 'Adds the member to Members, with a status set by the count.'),
    node('b5', 'branch', 'Room under forty?', 'Router', 'ArrowsSplit', ['make'], 'Make · Router', [['Room', 'Status is Awaiting slot'], ['Full', 'Status is Waiting list']], 'Routes on the status just saved.'),
    node('b6', 'action', 'Welcome template', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'OS · Gmail (Make), the shop’s own address'], ['Template', 'Welcome to the house'], ['Holds', '£95 a month, cancel any month; a cut every three or four weeks at a time that stays yours; a beard shape or neck tidy between cuts; 10% off the shelf and refills at cost; first refusal on Friday and Saturday evenings; your barber will be in touch to agree the hour'], ['Written by', 'a fixed template, not Claude']], 'Emails the new member a fixed welcome.'),
    node('b7', 'action', 'Ask for the slot', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Front room'], ['Says', 'the barber, the new member’s name and email, and that a standing slot is waiting to be set']], 'Tells the shop a member is waiting for their standing hour.'),
    node('b8', 'approve', 'Barber sets the slot', 'By hand', 'UserCheck', ['cal-com', 'airtable'], 'The barber, by hand · not a Make step', [['Who', 'the member’s barber'], ['Agrees', 'the standing hour, every three or four weeks'], ['Then', 'books it in their own Cal.com page in the member’s name, and sets Status = Standing and Standing hour in Members']], 'The barber confirms the standing slot with the member and holds it in their book.'),
    node('b9', 'action', 'Waiting-list template', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Make · Gmail › Send an email', [['Connection', 'OS · Gmail (Make), the shop’s own address'], ['Template', 'On the waiting list'], ['Holds', 'your barber has forty members, the site’s cap; you are on their waiting list; someone from the shop will be in touch about your membership'], ['Written by', 'a fixed template, not Claude']], 'Emails the member that they are on their barber’s waiting list.'),
    node('b10', 'end', 'Flag the wait', 'Telegram', 'Warning', ['telegram'], 'Make · Telegram Bot › Send a text message or a reply', [['Chat', 'Front room'], ['Says', 'the barber, the member’s name and email, that they are on the waiting list and have paid, and to call them']], 'Tells the shop to call the member about their payment. Any refund is made by hand in Stripe.'),
  ],
  edges: [
    edge('b1', 'b2'), edge('b2', 'b3'), edge('b3', 'b4'), edge('b4', 'b5'),
    edge('b5', 'b6', 'Room'), edge('b6', 'b7'), edge('b7', 'b8'),
    edge('b5', 'b9', 'Full'), edge('b9', 'b10'),
  ],
}

const OS03: Workflow = {
  code: 'OS-03',
  title: 'Shelf order',
  platform: 'zapier',
  outcome: 'Every shelf order paid on Stripe lands on the pick list with a templated order email, delivery is free over £50, and a same-day collection alerts the shop at once.',
  trigger: 'Zapier’s Stripe Checkout Session Completed hears every paid checkout; a Filter keeps the ones from the bag.',
  exits: ['Collection, shop alerted', 'Delivery, on the pick list', 'Not a shelf order'],
  watch: [
    MONEY,
    'The bag on the site makes the Stripe Checkout Session: one line per item at the shelf’s prices, and metadata naming it a shelf order, with the items and the Fulfilment, UK delivery or Collect today. The rule is on the items’ subtotal: the site says free UK delivery over £50, so a bag whose items come to more than £50 gets the shipping rate Free UK delivery, and a bag of exactly £50 or less pays UK delivery at the rate the shop sets in Stripe. The site states no figure for that rate, so this page names none.',
    'A collection asks for no address and pays no delivery, whatever the bag comes to. The bag offers Collect today only until an hour before closing, 19:00 Monday to Friday, 17:00 on Saturday and 15:00 on Sunday, so someone has time to pick the bag and the same-day promise can always be kept. After the cut-off it offers UK delivery only.',
    'Zapier paths never join again, so the steps both ways need, the pick list and the order email, come before the paths, and no Sub-Zap is needed. A Zap has one trigger, and this one has only Stripe’s.',
    'Nothing here waits on anyone’s yes, so there is no Human in the Loop step: the order email is a fixed template and sends on its own.',
    'Refills are not online. Bring the empty back and the refill is half price: that happens at the shop’s counter, and a person rings it up by hand. Members’ 10% off and refills at cost are given the same way; the online bag has no member price.',
    'Gift cards, The Ostler Letter and reviews are in no flow, and no tool here reaches a review site or the letter’s mailing list.',
    'A failed step is caught by a Zapier Manager zap that posts it to /os/failed.',
  ],
  nodes: [
    node('c1', 'trigger', 'Shelf checkout', 'Stripe', 'CreditCard', ['stripe'], 'Zapier · Stripe › Checkout Session Completed', [['Zap', 'OS-03 · Shelf order'], ['Comes from', 'Add to bag, then checkout on Stripe’s own page']], 'Someone pays for their bag on Stripe, and the Zap starts with the checkout.'),
    node('c2', 'action', 'Shelf orders only', 'Filter by Zapier', 'GitBranch', ['zapier'], 'Zapier · Filter by Zapier › Only continue if', [['Metadata source', 'exactly matches shelf'], ['Payment status', 'exactly matches paid']], 'Goes on only for a paid checkout from the bag, never a membership.'),
    node('c3', 'action', 'Add to the pick list', 'Airtable', 'Package', ['airtable'], 'Zapier · Airtable › Create Record', [['Table', 'Orders'], ['Sets', 'Order, Name, Email, Items, Subtotal, Delivery charge, Total, Fulfilment, Address, Paid at'], ['Status', 'To pick']], 'Adds the order to Orders, where the To pick view is the shop’s pick list.'),
    node('c4', 'action', 'How it reaches them', 'Formatter', 'PencilSimple', ['zapier'], 'Zapier · Formatter by Zapier › Utilities › Lookup Table', [['Looks up', 'Fulfilment, the same field the paths read'], ['UK delivery', 'On its way by UK delivery'], ['Collect today', 'Ready to collect from 6 Carrow Mews today'], ['Fallback', 'We will be in touch about how your order reaches you']], 'Picks the one line the order email uses for how the order reaches them, from the same field that picks the path.'),
    node('c5', 'action', 'Order email', 'Gmail', 'EnvelopeSimple', ['gmail'], 'Zapier · Gmail › Send Email', [['Connection', 'OS · Gmail (Zapier), the shop’s own address'], ['Template', 'Your order from the shelf'], ['Holds', 'the items, the subtotal, the delivery charge, £0.00 for a collection or when the items come to more than £50, the total, the line from the lookup, and the shop’s phone'], ['Written by', 'a fixed template, not Claude']], 'Emails the customer their order.'),
    node('c6', 'branch', 'Collect or post?', 'Paths by Zapier', 'ArrowsSplit', ['zapier'], 'Zapier · Paths by Zapier', [['UK delivery', 'Fulfilment is UK delivery'], ['Collect today', 'Fulfilment is Collect today']], 'Leaves a parcel on the pick list alone, and sends a collection to the front room.'),
    node('c7', 'action', 'Alert the front room', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'Zapier · Telegram Bot › Send Message', [['Chat', 'Front room'], ['Says', 'a bag to collect today, the name and the items']], 'Tells the shop a bag is coming to be collected today.'),
    node('c8', 'end', 'Set it aside', 'By hand', 'Package', ['airtable'], 'Someone in the shop, by hand · not a Zapier step', [['Who', 'whoever is in the front room'], ['Does', 'picks the items, puts the bag behind the counter'], ['Sets', 'Status = Ready, then Collected when it goes']], 'A person sets the bag aside and hands it over.'),
    node('c9', 'end', 'Packed and posted', 'By hand', 'Truck', ['airtable'], 'Someone in the shop, by hand · not a Zapier step', [['Works from', 'the To pick view'], ['Does', 'picks, packs and posts the order'], ['Sets', 'Status = Posted']], 'A person packs and posts the parcel, and marks it Posted.'),
  ],
  edges: [
    edge('c1', 'c2'), edge('c2', 'c3'), edge('c3', 'c4'), edge('c4', 'c5'), edge('c5', 'c6'),
    edge('c6', 'c9', 'UK delivery'),
    edge('c6', 'c7', 'Collect today'), edge('c7', 'c8'),
  ],
}

const H01: Workflow = {
  code: 'OS-H01',
  title: 'Alert the shop',
  platform: 'n8n',
  outcome: 'Every message n8n sends the shop reads the same way and lands in the right Telegram chat.',
  trigger: 'Called by OS-01 when a chair is freed, and by OS-H02.',
  exits: ['Message sent'],
  watch: [
    'A message holds a barber, a time, a name or a link, and never a payment detail.',
    'Two chats: the Front room group, which every barber is in, for freed chairs; and Tomas’s own, for failures, with sound.',
    'OS-H02 is not set as OS-H01’s error workflow: a failure here would call OS-H02, which calls OS-H01 again, without end. If this workflow fails, n8n’s own instance-level error email is the only alert.',
  ],
  nodes: [
    node('h1', 'trigger', 'Called by a workflow', 'Sub-workflow trigger', 'Stack', ['n8n'], 'n8n · When Executed by Another Workflow', [['Inputs', 'text, chat, urgent, link']], 'Another workflow hands over a message, the chat it is for and whether it is urgent.'),
    node('h2', 'action', 'Add the code', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Adds', 'the flow code, and a link to the booking’s row or the failed run, when there is one']], 'Puts the flow’s code under the message, with a link when there is one.'),
    node('h3', 'end', 'Send on Telegram', 'Telegram', 'PaperPlaneTilt', ['telegram'], 'n8n · Telegram › Send message', [['Chat', 'Front room, or Tomas’s own'], ['Disable notification', 'on after 20:00, unless urgent']], 'Posts it in the chat it was meant for.'),
  ],
  edges: [edge('h1', 'h2'), edge('h2', 'h3')],
}

const H02: Workflow = {
  code: 'OS-H02',
  title: 'Log a failed run',
  platform: 'n8n',
  outcome: 'Every failed run, on any of the three platforms, is logged and reaches Tomas with a link to it.',
  trigger: 'n8n’s Error Trigger, plus a webhook that Make and Zapier post to.',
  exits: ['Logged and sent'],
  watch: [
    'A failed run’s row holds the platform, the flow, the step, the error and a link to the run, never the client’s details.',
    'It never retries on its own. Tomas, or Justine, decides.',
    'The webhook checks a shared secret, so nothing else can write to the log.',
    'Covers OS-01 only, not OS-H01: OS-H01 is how this workflow alerts Tomas, so making it this workflow’s error workflow too would let the two call each other without end.',
  ],
  nodes: [
    node('f1', 'trigger', 'OS-01 fails', 'Error Trigger', 'Warning', ['n8n'], 'n8n · Error Trigger', [['Covers', 'OS-01, as its error workflow'], ['Gives', 'the workflow, the failed step and a link to the execution']], 'Starts whenever OS-01 fails in n8n.'),
    node('f2', 'trigger', 'Make or Zapier fails', 'POST /os/failed', 'WebhooksLogo', ['n8n'], 'n8n · Webhook', [['Path', '/os/failed'], ['Auth', 'Header auth, a shared secret'], ['Sent by', 'Make error routes, a Zapier Manager zap']], 'Starts when a Make error route or the Zapier Manager zap reports a failed step in OS-02 or OS-03.'),
    node('f3', 'action', 'Shape the row', 'Edit Fields', 'PencilSimple', ['n8n'], 'n8n · Edit Fields (Set)', [['Row', 'platform, flow, step, error, time, run link'], ['Include Other Input Fields', 'Off']], 'Puts both kinds of failure into one shape, and keeps nothing else.'),
    node('f4', 'action', 'Log the failed run', 'Google Sheets', 'Table', ['google-sheets'], 'n8n · Google Sheets › Append row', [['Tab', 'Failed runs']], 'Adds the failure as a row in the Failed runs tab.'),
    node('f5', 'helper', 'Alert Tomas', 'OS-H01', 'Stack', ['n8n'], 'n8n · Execute Sub-workflow', [['Workflow', 'OS-H01 · Alert the shop'], ['Chat', 'Tomas’s own'], ['Urgent', 'yes']], 'Sends Tomas an urgent Telegram message: the flow, the failed step and a link to the run.'),
  ],
  edges: [edge('f1', 'f3'), edge('f2', 'f3'), edge('f3', 'f4'), edge('f4', 'f5')],
}

const plan: Plan = {
  title: 'Ostler · Build plan',
  description: 'A build plan for Ostler, a four-chair barbershop at 6 Carrow Mews in Fitzrovia, London: three flows on n8n, Make and Zapier for chair bookings, memberships and shelf orders, two helpers, a test matrix and a handover, planned before anything is built.',
  kicker: 'BUILD PLAN · OSTLER',
  heading: 'Every chair, member and order, planned before a single step is placed.',
  lede:
    'Three flows and two helpers for Ostler, the barbershop Tomas Reyne founded at 6 Carrow Mews, London W1T 4QS, with Jonah Vell, Arun Mehta and Leo Hartley, the apprentice. Chair bookings run on n8n, memberships on Make and shelf orders on Zapier. The site has no form: each barber’s own Cal.com book takes the bookings, Stripe’s own pages take every payment, and Airtable holds bookings, members and orders. Every email in these flows is a fixed template that sends on its own, and none of them uses Claude. A barber approves any note Claude drafts for a client’s inbox before it is sent, as the AI agents page plans. No flow takes, changes or returns money: any refund is a person’s job, done by hand in Stripe.',
  meta: [
    ['Client', 'Ostler Barbers Ltd · Fitzrovia, London W1'],
    ['Platforms', 'n8n, Make and Zapier'],
    ['Workflows', '3 + 2 helpers'],
    ['Prepared by', 'Justine Acosta'],
  ],
  start: {
    title: 'Before anything is built',
    blurb: 'The outcome, the entry points and every way a booking, a membership or an order ends.',
    rail: [
      { heading: 'Why plan first', body: 'Ostler makes three promises a flow has to keep: cancel up to 24 hours ahead at no charge, no more than forty members per barber, and free UK delivery over £50 or collection the same day. Each barber keeps their own book, so every booking has to stay with its barber. This page pins all of it down before n8n, Make or Zapier is opened.' },
      { heading: 'The money rule', body: 'Memberships and shelf orders are paid by the customer on Stripe’s own pages, and bookings take no payment online. No flow takes, changes or returns money. Any refund is a person’s job, done by hand in Stripe.' },
    ],
    outcome: 'Every booking is confirmed at once and, when booked before that morning’s 07:00 run, reminded the morning before, with the 24-hour free cancellation in both, and every cancellation frees the chair; every new member is held to their barber’s cap of forty, with the standing slot set by the barber by hand; and every shelf order reaches the pick list with a templated email, the shop alerted for a collection.',
    trigger: 'Seven entry points: a booking made, moved or cancelled in a barber’s Cal.com book, 07:00 each morning, a new Stripe subscription, a paid Stripe checkout, OS-01 or OS-H02 calling OS-H01, n8n’s own Error Trigger and a webhook that Make and Zapier report failures to.',
    exits: ['Confirmed and reminded', 'Chair freed, front room told', 'Member welcomed or waiting', 'Order picked, posted or collected'],
    outOfScope: [
      'Agreeing a member’s standing hour, which the barber does by hand, and a member leaving, which someone in the shop handles by hand each Monday',
      'Any refund, pause or ending of a subscription or an order, which a person makes by hand in Stripe',
      'Refills, bring the empty back for half price, and members’ 10% off and refills at cost, rung up at the counter by hand',
      'Walk-ins, which are seen when a chair is free, and phone bookings, which the barber enters in their own Cal.com book',
      'Gift cards, The Ostler Letter, the careers page and reviews: no flow touches them, and no tool here reaches a review site or the letter’s mailing list',
      'The Shop Q&A bot, which answers live in the site’s chat only, the chair gap agent and the rebooking agent, planned on the AI agents page',
    ],
  },
  naming: {
    title: 'Naming convention',
    blurb: 'One vocabulary across n8n, Make and Zapier.',
    rail: [
      { heading: 'Why it matters', body: 'Three platforms, four chairs and no office. When a run fails between two cuts, its name has to say which flow it was, wherever it ran.' },
      { heading: 'Rule of thumb', body: 'If a run log does not read like a sentence, rename the steps.' },
    ],
    rules: [
      { name: 'Workflows', pattern: 'OS-[number] · [Title]', examples: ['OS-01 · Chair booking', 'OS-H02 · Log a failed run'], rule: 'The same codes on every platform. The number is the build order; helpers get an H.' },
      { name: 'Steps', pattern: '[Verb] [object]', examples: ['Save the booking', 'Count their members', 'Add to the pick list'], rule: 'Default names like “HTTP Request1” or “Router 2” never survive a build.' },
      { name: 'Webhook paths', pattern: '/os/[source]', examples: ['/os/booking/…', '/os/failed'], rule: 'One path per source, all lowercase. The booking path ends in a long random token.' },
      { name: 'Connections', pattern: 'OS · [Service] ([platform])', examples: ['OS · Airtable (n8n)', 'OS · Gmail (Make)', 'OS · Stripe (Zapier)'], rule: 'Each platform holds its own connection, and the name says which one to renew.' },
      { name: 'Cal.com event types', pattern: '[Barber] · [Service]', examples: ['Tomas · Ostler cut', 'Arun · Hot-towel shave', 'Leo · Apprentice cut'], rule: 'One per service each barber offers, in that barber’s own account, so a booking always names its barber.' },
      { name: 'Payment Links', pattern: 'Membership · [Barber]', examples: ['Membership · Tomas', 'Membership · Jonah'], rule: 'One per barber, each carrying the barber’s name in its subscription metadata.' },
      { name: 'Airtable tables', pattern: 'Title case, one thing per table', examples: ['Bookings', 'Members', 'Orders'], rule: 'Flows read fields by name, never by position.' },
    ],
  },
  data: {
    title: 'Where the data lives',
    blurb: 'Three Airtable tables, and two sheet tabs.',
    rail: [
      { heading: 'Source of truth', body: 'Each barber’s Cal.com book is the truth for their hours, and Stripe for every payment. Airtable keeps what the flows need from both: bookings, members and orders. Google Sheets only keeps logs.' },
      { heading: 'One set of values', body: 'Barber, Service, Status and Fulfilment take the same values in every flow, table and template below.' },
    ],
    tables: [
      { name: 'Bookings', fields: ['Booking uid', 'Barber', 'Service', 'Price', 'Starts', 'Day', 'Length', 'Client', 'Email', 'Status', 'Reminded on', 'Freed on'], note: 'One row per booking, matched on Cal.com’s uid. Barber is Tomas Reyne, Jonah Vell, Arun Mehta or Leo Hartley. Service is the Ostler cut, Taper & fade, Long hair & scissor work, Hot-towel shave, Beard shape, Signature, the Apprentice cut, or a Member’s cut or Member’s tidy. Price is the site’s list price, and empty for a Member’s cut or Member’s tidy. Day is a formula: the date of Starts in London time. Status is Booked, Moved or Cancelled.' },
      { name: 'Members', fields: ['Member', 'Email', 'Barber', 'Stripe subscription', 'Joined on', 'Status', 'Standing hour'], note: 'One row per member. Status is Awaiting slot, Standing, Waiting list or Ended; only Awaiting slot and Standing count toward a barber’s forty. Standing hour is set by the barber by hand, like Thursday 18:00, every four weeks. The current members are loaded before the flow goes live, so the count is right from its first run.' },
      { name: 'Orders', fields: ['Order', 'Name', 'Email', 'Items', 'Subtotal', 'Delivery charge', 'Total', 'Fulfilment', 'Address', 'Status', 'Paid at'], note: 'One row per shelf order, keyed by its Stripe checkout. Fulfilment is UK delivery or Collect today. Status is To pick, Ready, Collected or Posted. Address is empty for a collection. The To pick view is the pick list.' },
    ],
    stages: [
      ['Booked', 'A booking saved and confirmed, its reminder still to come.'],
      ['Reminded on', 'Not a Status: the date in the Reminded on field, set on a Booked booking when its reminder goes out the morning before.'],
      ['Awaiting slot', 'A member under the cap, welcomed, waiting for their barber to set the hour.'],
      ['Standing', 'A member with a standing hour in their barber’s book.'],
      ['To pick', 'A paid shelf order on the pick list.'],
      ['Ready', 'A collection set aside behind the counter.'],
    ],
    exitStages: [
      ['Moved', 'A booking whose time was moved; the new time is a booking of its own.'],
      ['Cancelled', 'A booking cancelled, its chair freed and the front room told.'],
      ['Waiting list', 'A member whose barber has forty, told so and called by the shop.'],
      ['Ended', 'A member who has left, marked by hand.'],
      ['Collected', 'A bag handed over at the shop.'],
      ['Posted', 'A parcel packed and posted.'],
    ],
    sheets: [
      ['Failed runs', 'One row per failed run, from n8n, Make or Zapier, with no client details'],
      ['Test matrix', 'The test rows below, with results'],
    ],
  },
  triggers: {
    title: 'What starts each workflow',
    blurb: 'Every entry point, and the workflow it runs.',
    rail: [{ heading: 'How it wires up', body: 'Each flow starts where its platform is strongest: a webhook and a schedule on n8n, a Stripe event on Make, a Stripe checkout on Zapier. Failures from all three end in one sheet.' }],
    rows: [
      ['A booking made, moved or cancelled in a barber’s Cal.com book', 'Webhook POST /os/booking/…', 'OS-01'],
      ['Every morning, 07:00 London time', 'Schedule Trigger', 'OS-01'],
      ['Become a member, paid on a barber’s Payment Link', 'Stripe customer.subscription.created', 'OS-02'],
      ['Add to bag, paid at checkout', 'Stripe Checkout Session Completed', 'OS-03'],
      ['OS-01 or OS-H02', 'Execute Sub-workflow', 'OS-H01'],
      ['An OS-01 run fails', 'Error Trigger', 'OS-H02'],
      ['A Make or Zapier run fails', 'Webhook POST /os/failed', 'OS-H02'],
    ],
  },
  workflows: [OS01, OS02, OS03],
  helpers: {
    title: 'Helpers',
    blurb: 'Two small workflows the others call.',
    rail: [{ heading: 'Why helpers', body: 'Alerts and failures are written once, in n8n, and all three platforms report failures to them. Make and Zapier message the front room with their own Telegram modules.' }],
    list: [H01, H02],
  },
  tests: {
    title: 'Test matrix',
    blurb: 'One row per branch. Tick each one as it passes.',
    rail: [
      { heading: 'How to test', body: 'Each row is one branch, walked with test bookings in each barber’s Cal.com book, Stripe test mode and test cards before anything reaches a real client.' },
      { heading: 'Test data', body: 'Test clients have made-up names. Prices are the site’s; the UK delivery rate in test mode is illustrative.' },
    ],
    rows: [
      { id: 't01', workflow: 'OS-01', branch: 'Booked', input: 'Test Client A books Jonah · Taper & fade for Thursday at 11:20', expected: 'A Bookings row, Booked, Jonah Vell, £58; the confirmation names Jonah, 45 minutes, 6 Carrow Mews and cancel up to 24 hours ahead at no charge' },
      { id: 't02', workflow: 'OS-01', branch: 'Leo’s chair', input: 'Test Client B books Leo · Apprentice cut on a Tuesday, from the Book a chair chooser', expected: 'A row for Leo Hartley at £34; the confirmation names Leo, at the length Tomas set; his page offers no other day' },
      { id: 't03', workflow: 'OS-01', branch: 'A member’s visit', input: 'Jonah books Jonah · Member’s cut in Test Member C’s name', expected: 'A row with Price empty; the confirmation says Covered by your membership and names no price' },
      { id: 't04', workflow: 'OS-01', branch: 'Moved, old time found', input: 'Test Client A moves t01’s booking to Friday at 09:00', expected: 'The old row Moved; a new row Booked for Friday; a fresh confirmation; no reminder for Thursday' },
      { id: 't05', workflow: 'OS-01', branch: 'Moved, old time not found', input: 'A test booking made with the flow off is moved with it on', expected: 'The search returns an empty item; the new time is saved and confirmed' },
      { id: 't06', workflow: 'OS-01', branch: 'Cancelled, found', input: 'Test Client B cancels t02’s booking two days ahead', expected: 'The row Cancelled with Freed on; the Front room group told whose chair is free and when; nothing charged' },
      { id: 't07', workflow: 'OS-01', branch: 'Cancelled late', input: 'A test booking for tomorrow at 10:00 is cancelled today at 15:00, inside 24 hours', expected: 'The same as t06: the chair freed, the front room told, nothing charged and no fee in any email' },
      { id: 't08', workflow: 'OS-01', branch: 'Cancelled, not found', input: 'A test booking made with the flow off is cancelled with it on', expected: 'The search returns an empty item; the front room is still told, marked Not in Bookings' },
      { id: 't09', workflow: 'OS-01', branch: 'Reminder due', input: 'A test booking for tomorrow at 08:00, then the 07:00 run', expected: 'One reminder, 25 hours ahead, saying it can be cancelled at no charge until 08:00 today; Reminded on set; a second run sends nothing' },
      { id: 't10', workflow: 'OS-01', branch: 'Booked after the run', input: 'A test booking made at 09:00 today for tomorrow at 10:00', expected: 'The confirmation only; tomorrow’s 07:00 run looks a day further on, so no reminder is sent' },
      { id: 't11', workflow: 'OS-01', branch: 'Nothing tomorrow', input: 'The 07:00 run with no booking tomorrow, and with one cancelled', expected: 'The run ends at Nothing tomorrow; no email' },
      { id: 't12', workflow: 'OS-01', branch: 'A step fails', input: 'A test booking with the Gmail connection in n8n revoked', expected: 'The booking is saved; OS-H02 logs the failed step and alerts Tomas with a link to the run' },
      { id: 't13', workflow: 'OS-02', branch: 'Room', input: 'Test Member C pays on Membership · Jonah, with Jonah at 12 members', expected: 'A Members row, Awaiting slot; the welcome sent; the front room asked; nothing more until Jonah sets the slot and marks Standing' },
      { id: 't14', workflow: 'OS-02', branch: 'Full', input: 'Test Member D pays on Membership · Tomas, with Tomas at 40', expected: 'A row, Waiting list; the waiting-list email; the front room flagged to call; no refund, pause or ending by the flow' },
      { id: 't15', workflow: 'OS-02', branch: 'The fortieth place', input: 'Two test members pay on Membership · Arun within a second, with Arun at 39', expected: 'One Awaiting slot, one Waiting list, in the order Stripe sent them' },
      { id: 't16', workflow: 'OS-02', branch: 'Who counts', input: 'A barber with 38 Standing, 3 Waiting list and 5 Ended; a test member joins', expected: 'Counted as 38; Awaiting slot' },
      { id: 't17', workflow: 'OS-02', branch: 'First member', input: 'A test barber with no members at all; a test member joins', expected: 'The API call returns an empty list; counted as 0; Awaiting slot' },
      { id: 't18', workflow: 'OS-02', branch: 'A step fails', input: 'A test run with the Airtable connection in Make revoked', expected: 'The error route posts to /os/failed; a row in Failed runs and an urgent alert to Tomas; Make keeps the run to retry' },
      { id: 't19', workflow: 'OS-03', branch: 'Delivery, over £50', input: 'A test bag of Beard oil and Hair tonic, £58, for UK delivery, paid with test card 4242 4242 4242 4242', expected: 'An Orders row, To pick, Delivery charge £0.00; the email says on its way by UK delivery, delivery £0.00; no Telegram message' },
      { id: 't20', workflow: 'OS-03', branch: 'Delivery, exactly £50', input: 'A test bag of Matte clay and Shave soap, £50 exactly, for UK delivery', expected: 'Not more than £50, so the UK delivery rate is charged at checkout; the row and the email show that charge' },
      { id: 't21', workflow: 'OS-03', branch: 'Delivery, under £50', input: 'A test bag of Matte clay, £24, for UK delivery', expected: 'The UK delivery rate charged at checkout; the email shows the charge' },
      { id: 't22', workflow: 'OS-03', branch: 'Collect today', input: 'A test bag of Shave soap, £26, to collect, paid at 14:00', expected: 'A row with no address, Delivery charge £0.00; the email says ready to collect from 6 Carrow Mews today; the Front room group alerted' },
      { id: 't23', workflow: 'OS-03', branch: 'Collect, over £50', input: 'A test bag of Hair tonic and Beard oil, £58, to collect, paid at 11:00', expected: 'Delivery charge £0.00 and the collection line, not the delivery line; the Front room group alerted' },
      { id: 't24', workflow: 'OS-03', branch: 'After the cut-off', input: 'Open the bag at 19:30 on a Wednesday', expected: 'The bag offers UK delivery only; Collect today returns when the shop opens the next morning' },
      { id: 't25', workflow: 'OS-03', branch: 'Not a shelf order', input: 'A test membership paid on Membership · Jonah', expected: 'The Filter stops the Zap; no order, no email' },
      { id: 't26', workflow: 'OS-03', branch: 'Refunded by hand', input: 'Tomas refunds t22’s order in Stripe test mode', expected: 'The refund is his click alone; no flow runs' },
      { id: 't27', workflow: 'OS-03', branch: 'A step fails', input: 'A test order with the Gmail connection in Zapier revoked', expected: 'The order is on the pick list; the Zapier Manager zap posts to /os/failed, and Tomas sends the order email by hand' },
    ],
  },
  build: {
    title: 'Build order',
    blurb: 'Five phases, in the order they are built.',
    rail: [{ heading: 'Order', body: 'Foundation first, then one platform at a time, in the order of their codes: bookings on n8n, memberships on Make, then the shelf on Zapier.' }],
    phases: [
      { name: '1 · Foundation', tasks: ['Create the Airtable tables, Bookings, Members and Orders, with their views', 'Add the connections on each platform: OS · Airtable, OS · Gmail, OS · Telegram, OS · Stripe (test)', 'Add the shop’s Telegram bot to the Front room group and to Tomas’s own chat', 'Create the Sheets tabs: Failed runs, Test matrix', 'Build OS-H01 in n8n, then OS-H02 with OS-01 (not OS-H01) as the covered error workflow'] },
      { name: '2 · Bookings on n8n', tasks: ['Set up each barber’s Cal.com event types, one per service, at the site’s lengths, plus their hidden Member’s cut and Member’s tidy, and Leo’s apprentice cut on Tuesdays and Wednesdays, at the length Tomas sets', 'Point each Book with button at its barber’s page, and Book a chair at a chooser of all four, Leo’s included', 'Write the confirmation and reminder templates with Tomas, both with the 24-hour line', 'Build OS-01 in Europe/London time, then add its webhook in each barber’s Cal.com account', 'Run tests t01–t12'] },
      { name: '3 · Memberships on Make', tasks: ['Make one £95 monthly Payment Link per barber, each with the barber’s name in its subscription metadata, and turn on Stripe’s customer portal for cancelling', 'Confirm with Tomas whether Leo takes members, and set Members’ Barber choices to match: Tomas Reyne, Jonah Vell and Arun Mehta, with Leo Hartley only if he does', 'Load the current members into Members, with their status', 'Write the welcome and waiting-list templates with Tomas', 'Build OS-02 with Sequential processing on and an error route to /os/failed on every writing module', 'Run tests t13–t18 in Stripe test mode'] },
      { name: '4 · The shelf on Zapier', tasks: ['Have the bag make its Stripe Checkout Session with the shelf metadata, Free UK delivery when the items come to more than £50, and Collect today until an hour before closing', 'Write the order template and the lookup’s lines', 'Build OS-03, then the Zapier Manager zap that posts failures to /os/failed', 'Run tests t19–t27'] },
      { name: '5 · Test and hand over', tasks: ['Switch to OS · Stripe (live)', 'Run the whole matrix again', 'Walk Tomas and the barbers through the handover page, and the Monday check of ended memberships', 'Turn every flow on'] },
    ],
  },
  handover: {
    title: 'Handover',
    blurb: 'What Ostler keeps.',
    rail: [{ heading: 'Written for Tomas and the barbers', body: 'One page, no jargon, for the people at the chairs. It lives next to the flows.' }],
    does: [
      'Confirms every booking at once, and reminds it the morning before when it was booked before that morning’s 07:00 run, with the 24-hour free cancellation in both.',
      'Keeps each booking with its barber, from their own Cal.com book.',
      'Marks every cancellation and tells the Front room group whose chair is free.',
      'Holds every barber to forty members, welcomes a new member or puts them on the waiting list, and tells the shop either way.',
      'Puts every paid shelf order on the pick list with its order email, and alerts the front room for a collection.',
    ],
    breaks: [
      'Renaming a field in Bookings, Members or Orders, or changing the Barber, Service, Status or Fulfilment choices.',
      'A new barber or service without its own Cal.com event type, webhook, price on the fixed list and Payment Link.',
      'Changing a price on the site but not in OS-01’s list, or the 24-hour line in one template but not the other.',
      'Turning off Always Output Data on an OS-01 search, or Sequential processing on OS-02.',
      'Changing the bag’s checkout metadata or its shipping rate names.',
      'A connection expiring on one platform but not the others.',
    ],
    call: 'Justine Acosta, who built it. Failures already reach Tomas on Telegram, with a link to the run.',
    logs: 'Every failed run, from any of the three platforms, is a row in the Failed runs tab and a Telegram message, holding the step and the error and never a client’s details. Every booking keeps its status and reminder, every member their status, and every order its own.',
  },
  footer: { note: 'A worked example. Ostler is a fictional barbershop, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
  home: 'Justine Acosta · Portfolio',
}

export default plan
