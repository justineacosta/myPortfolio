/**
 * Ostler’s AI agents and RAG chatbots case page (spec 2026-10-05 per-site
 * pages): the Shop Q&A bot in its site chat, and the Chair gap and Rebooking
 * agents, drawn on the general page’s two diagrams. It tells the same story as
 * Ostler’s Automation and Build plan pages: the chair gap agent starts from the
 * row OS-01 marks Cancelled, and a member’s own visit is a Member’s cut or
 * Member’s tidy, which the rebooking agent skips. data/cases/index.ts registers
 * it; `npm run cases` renders it into public/cases/ostler-barbers/ai-agents.html.
 * Only type imports, so Node can run it directly.
 */
import type { Agents, Cable } from '../../agents.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

const BUSINESS = { name: 'Ostler', trade: 'barbershop' }

/** The person’s-yes rule, word for word as on Ostler’s other pages. */
const YES = 'The client’s barber approves anything Claude drafts for a client’s inbox before it is sent.'

const agents: Agents = {
  title: 'Ostler · AI agents and RAG chatbots',
  description: 'Ostler’s Shop Q&A bot and its two agents, Chair gap and Rebooking: two live diagrams, three sample builds and the guardrails that keep every note to a client with that client’s barber.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · OSTLER',
  heading: 'A bot that answers from the shop’s own pages, and two agents a barber signs off',
  lede: 'People ask Ostler the same things before they book: what a taper costs, how long a shave takes, what membership holds, whether the shelf posts. This is the chatbot that answers them from the shop’s own pages, the two agents that offer a freed chair and nudge a client towards their next cut, and the two patterns underneath all three. The bot never invents a price or a time, and no note reaches a client until their barber says yes.',
  sample: 'Sample builds for Ostler, a fictional barbershop in Fitzrovia used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: `Every build below is one of two patterns. ${YES} The chat answers live, only from the shop’s own pages.` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE SHOP Q&A BOT WORKS', title: 'Search the site first, then answer', blurb: 'Ostler’s pages are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A freed chair or the morning schedule starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Ostler', blurb: 'One bot for visitors, two agents for the barbers. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe on a shop where every price and every hour is a promise.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Shop Q&A bot searches the services, the barbers, the membership terms and the shelf first, then answers with the page it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Chair gap and Rebooking each take one freed hour or one past cut, gather what they need from Airtable and the barber’s Cal.com book, and draft one note.' },
    { mark: '3', icon: 'UserCheck', title: 'The barber’s yes', text: `${YES} Templated confirmations send on their own, and the bot answers live, in the site chat only.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Shop Q&A bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Ostler’s pages', sub: 'As the site says', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the services and prices, the barbers, the hours and the visit, the membership terms and the shelf, as the site states them. Nothing outside them counts.',
          pins: [
            { id: 'services', name: 'Services and prices', icon: 'Scissors', what: 'The six services with each price and length, from the £38 beard shape to the £118 Signature, Leo’s apprentice cuts at £34 on Tuesdays and Wednesdays, and cancel up to 24 hours ahead at no charge.' },
            { id: 'barbers', name: 'Barbers and visit', icon: 'MapPin', what: 'Tomas, Jonah, Arun and Leo and what each is known for; 6 Carrow Mews, three minutes from Goodge Street, step-free; the hours; and that walk-ins are seen when a chair is free, which is rarely after four.' },
            { id: 'membership', name: 'Membership', icon: 'IdentificationCard', what: '£95 a month, cancel any month: a standing appointment every three or four weeks, a beard shape or neck tidy between cuts, 10% off the shelf with refills at cost, and first refusal on Friday and Saturday evenings. Forty members per barber; chair one has a waiting list.' },
            { id: 'shelf', name: 'The shelf', icon: 'Package', what: 'Matte clay £24, Beard oil £28, Shave soap £26 and Hair tonic £30; free UK delivery over £50, or collect the same day; bring the empty back and the refill is half price.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'A service or a term', icon: 'Scissors', what: 'Each page is cut service by service and term by term, so a search returns just the part that matters, with its price and length together.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a price, the hours or the shelf changes on the site.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Ostler’s site, and n8n starts the run. The bot answers there and nowhere else: it sends no email and no message.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of the site. It remembers nothing after the window closes.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a price, a time or a figure the pages do not hold, and it cannot see any barber’s book.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure from a page?', sub: 'A page settles it', icon: 'Question', what: 'Did the passages hold the answer? A question about a particular free hour, an order already paid, a refund, leaving the membership or anything the pages do not say counts as no. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the page it came from, so the visitor can check it. A live answer from the shop’s own pages needs no one’s yes.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Book a chair', sub: 'Cal.com, per barber', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When someone wants to book, the bot opens Book a chair, the chooser of the four barbers’ own Cal.com pages, or the named barber’s page. Their free hours are on that page; the bot books nothing itself.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Call the shop', sub: '020 7946 0381', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off to a person: the bot says it can’t settle that from the site and gives the shop’s phone, 020 7946 0381, with the hours. It forwards nothing and emails no one.',
          pins: [
            { id: 'phone', name: 'Phone the shop', icon: 'Phone', what: '020 7946 0381, Mon–Fri 08:00–20:00, Sat 08:00–18:00, Sun 10:00–16:00. Whoever is in the front room answers.' },
            { id: 'chair', name: 'Book a chair', tool: 'cal-com', what: 'The chooser of the four barbers’ own Cal.com pages, where each barber’s free hours are shown, for someone who only wanted a time.' },
            { id: 'walkin', name: 'Walk in', icon: 'Door', what: 'The site’s own line: walk-ins are seen when a chair is free, which is rarely after four. The bot never promises a chair.' },
          ],
        },
      ],
      cables: [
        flow('docs', 'chunk'),
        flow('chunk', 'embed'),
        flow('embed', 'store'),
        { from: 'store', to: 'search', kind: 'index', label: 'the index it searches' },
        flow('ask', 'qembed'),
        flow('qembed', 'search'),
        flow('search', 'answer'),
        flow('answer', 'sure'),
        flow('sure', 'reply', 'yes'),
        flow('sure', 'handoff', 'no'),
        flow('reply', 'book', 'wants to book'),
      ],
      routes: [
        { id: 'prepare', nodes: ['docs', 'chunk', 'embed', 'store'] },
        { id: 'answered', nodes: [...ASK, 'reply'] },
        { id: 'handoff', nodes: [...ASK, 'handoff'] },
        { id: 'booked', nodes: [...ASK, 'reply', 'book'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one question going through right now.' },
        { id: 'index', label: 'Index', what: 'A dashed cable to the store the search reads.' },
        BRANCH,
        PIN,
      ],
    },
    agent: {
      id: 'agent',
      caption: 'An agent for one hour or one cut · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Freed chair or 09:00', sub: 'Bookings or schedule', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a booking OS-01 marks Cancelled in Bookings, for the Chair gap agent, or the 09:00 schedule each morning, for the Rebooking agent. n8n listens for both.',
          pins: [
            { id: 'freed', name: 'A freed chair', tool: 'airtable', what: 'A Bookings row OS-01 has just marked Cancelled, with its Freed on time: the barber, the day, the time and the service. Cal.com has already opened the hour again in that barber’s book.' },
            { id: 'morning', name: 'Each morning', icon: 'Clock', what: 'Every day at 09:00, London time, an hour Tomas sets, as he sets the three weeks. n8n finds the bookings from three weeks before marked Booked for a cut, the Ostler cut, Taper & fade, Long hair & scissor work, the Signature or the Apprentice cut, and starts one run for each.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, a freed hour to offer or a past cut to follow up, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read Bookings or Members in Airtable, or read the barber’s free times in Cal.com. Nothing is booked, moved or paid.',
          pins: [
            { id: 'bookings', name: 'Bookings', tool: 'airtable', what: 'The freed hour, a client’s past cut, and whether that client has booked again since. Read only: OS-01 writes this table.' },
            { id: 'members', name: 'Members', tool: 'airtable', what: 'A barber’s members marked Standing or Awaiting slot, the people on their Waiting list, and whether a client is a member at all. Read only. A member who leaves is marked Ended by hand each Monday, so for up to a week they may still be offered an hour.' },
            { id: 'slots', name: 'Free times', tool: 'cal-com', what: 'The barber’s free times for the next week, read through Cal.com’s API. No booking is made, moved or held.' },
            { id: 'byhand', name: 'By hand only', icon: 'HandPalm', what: 'Not a tool call: no build reaches a review site, The Ostler Letter, gift cards, the shop’s till or a refund in Stripe. People in the shop do those by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'To a client’s inbox?', sub: 'Or a log only', icon: 'ShieldCheck', what: 'Is a note on its way to a client’s inbox? Then it waits for the client’s barber. With nobody to offer the hour, or a client who has already booked again, the run ends with a log line.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'The barber’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'The client’s barber gets the draft in their own Telegram chat with the shop’s bot, set up for these approvals, with Approve and Change it. A change goes back to Claude, and nothing is sent until they tap Approve.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Approved notes only', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved note goes from the shop’s Gmail, one email to each client it names, and every run is logged in the Agent runs tab.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved note from the shop’s own address, word for word as the barber approved it. A client who replies reaches the shop’s inbox and a person.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: the time, the barber, the freed hour or the past cut, each tool call by name, and who said yes.' },
            { id: 'barber', name: 'The barber, by hand', icon: 'UserCircle', what: 'The barber answers any reply and, for a member who asks, books the hour in their own Cal.com book by hand. No build books anyone.' },
          ],
        },
      ],
      cables: [
        flow('trigger', 'plan'),
        flow('plan', 'tool'),
        flow('tool', 'check'),
        flow('check', 'needs', 'done'),
        flow('needs', 'gate', 'yes'),
        flow('gate', 'act', 'approved'),
        loop('check', 'plan', 'not done yet'),
        loop('gate', 'plan', 'change it'),
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, a log only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one freed hour or one past cut going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the client’s barber says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Shop Q&A bot', business: BUSINESS,
      line: 'Answers Ostler’s visitors in the site chat on services, prices, lengths, the barbers, the hours, membership terms and the shelf, points them to Book a chair, and hands anything else to the shop’s phone.',
      example: { ask: 'Can I get a cut with Tomas this evening?', answer: 'I can’t see Tomas’s book, so I can’t promise a time. Book with Tomas opens his Cal.com page with his free hours. The Ostler cut is £68 and takes 60 minutes. (Barbers, Services)' },
      tools: ['claude', 'n8n', 'supabase', 'cal-com'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:services', 'docs:barbers', 'docs:membership', 'docs:shelf', 'ask:chat', 'handoff:phone', 'handoff:chair', 'handoff:walkin'],
      caption: 'Ostler’s site chat → search the services, barbers, membership and shelf → Claude answers → reply with the page, or Book a chair; anything else gets the shop’s phone',
    },
    {
      id: 'gap', kind: 'agent', name: 'Chair gap agent', business: BUSINESS,
      line: 'When a cancellation frees an hour, it drafts an offer. On a Friday or Saturday evening, the barber holds the hour by hand as soon as the Front room’s ping arrives, and that barber’s members, Standing or Awaiting slot, get it first, as their first refusal; if no member has taken it two hours on, a second offer goes to the barber’s waiting list. At any other hour, the waiting list alone. The barber approves every offer, the second one too.',
      example: { ask: 'Bookings: Jonah’s Friday 18:00 Ostler cut is cancelled.', answer: 'Jonah holds the hour by hand; an offer of Friday at 18:00 to his members, reply to claim it, waits for Jonah’s yes in Telegram. At a Tuesday 11:20, it would go to his waiting list instead, with his booking link.' },
      tools: ['claude', 'n8n', 'airtable', 'cal-com', 'gmail', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:freed', 'tool:bookings', 'tool:members', 'tool:slots', 'tool:byhand', 'act:gmail', 'act:sheets', 'act:barber'],
      caption: 'A booking marked Cancelled → Claude reads the hour, the barber’s members or waiting list and their free times → a draft offer → the barber’s yes in Telegram → sent and logged',
    },
    {
      id: 'rebook', kind: 'agent', name: 'Rebooking agent', business: BUSINESS,
      line: 'Three weeks after a non-member’s cut, it drafts a “your next cut” note with their barber’s free times in the week ahead, so the next cut falls three or four weeks on, for the barber’s yes. It reads only bookings marked Booked for the Ostler cut, Taper & fade, Long hair & scissor work, the Signature or the Apprentice cut, so it skips shaves on their own, beard shapes and every Member’s cut and Member’s tidy, and anyone already booked again, and anyone in Members as Standing, Awaiting slot or Waiting list; a client marked Ended is no longer a member, and gets the note.',
      example: { ask: '09:00: a Taper & fade with Arun three weeks ago, and nothing booked since.', answer: 'A “your next cut” note with three of Arun’s free times next week and his booking link, waiting for Arun’s yes in Telegram.' },
      tools: ['claude', 'n8n', 'airtable', 'cal-com', 'gmail', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:morning', 'tool:bookings', 'tool:members', 'tool:slots', 'tool:byhand', 'act:gmail', 'act:sheets', 'act:barber'],
      caption: 'Ostler, 09:00 → Claude finds a non-member’s cut from three weeks ago and the barber’s free times → a draft note → the barber’s yes in Telegram → sent and logged, or a log only',
    },
  ],
  buildText: {
    sample: 'SAMPLE BUILD',
    kinds: { rag: 'RAG chatbot', agent: 'AI agent' },
    groups: { rag: 'RAG chatbots', agent: 'AI agents' },
    example: { rag: ['Asked', 'Answer'], agent: ['Trigger', 'Result'] },
    show: 'Show its route',
    showAll: 'Show all',
    tools: 'Tools',
  },
  guardrails: [
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from Ostler’s own pages', text: 'The bot answers from the passages it found and names the page. It never gives a price, a time or a figure the pages do not hold, and it cannot see any barber’s book: for a free hour it opens Book a chair, or Book with the barber, where Cal.com shows it. It books nothing, takes no payment and never emails.' },
    { mark: 'G2', icon: 'Phone', title: 'Anything else goes to the shop’s phone', text: 'A question the pages do not settle, an order already paid, a refund, leaving the membership or a complaint gets the shop’s phone, 020 7946 0381, with the hours. Every payment is made on Stripe’s own pages, and any refund is made by a person, by hand, in Stripe.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'The barber says yes to every note Claude drafts', text: `${YES} Every offer the Chair gap agent drafts and every note the Rebooking agent drafts stops in that barber’s Telegram, and each run is logged with their yes. Members, Standing or Awaiting slot, are offered a freed hour first only on Friday and Saturday evenings, as the site says; at any other hour the offer goes to the barber’s waiting list. On those evenings the barber holds the freed hour by hand, with a date override in their own Cal.com book, as soon as the Front room’s Telegram ping arrives, then books it by hand for the member who replies; only if the barber can’t hold it is it told first, not held, and the first to book on the page gets it. If no member has taken it two hours on, the barber lifts the hold as they approve the waiting list’s offer. A member who takes a freed hour uses their Member’s cut if one is due, and otherwise pays the list price at the counter: that is Tomas’s call. The two-hour wait before the waiting list’s offer, like the 17:00 line, is Tomas’s call; an hour freed less than two hours ahead gets the members’ offer only. Templated confirmations, reminders and order emails send on their own, and the bot answers live, in the site chat only.` },
    { mark: 'G4', icon: 'HandPalm', title: 'Reviews, the letter, gift cards and the till stay by hand', text: 'No build reaches a review site, The Ostler Letter’s mailing list, gift cards or the shop’s till, and none of them is claimed. People in the shop do those by hand. The agents read Airtable and the barbers’ free times in Cal.com, and book, move or hold nothing.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Ostler’s own pages first, then answer from what was found.'],
    ['Passage', 'One service, term or shelf item cut from a longer page, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing the visitor to a person, by the shop’s phone. The bot forwards nothing.'],
    ['Book a chair', 'The site’s chooser of the four barbers’ own Cal.com pages, where each barber’s free hours are shown.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a booking marked Cancelled, or the 09:00 schedule.'],
    ['Tool call', 'One action an agent asks for, like reading Members in Airtable or a barber’s free times in Cal.com.'],
    ['Free times', 'The open hours in a barber’s Cal.com book, read through Cal.com’s API and never changed by an agent.'],
    ['First refusal', 'On Friday and Saturday evenings, the barber holds a freed hour by hand and offers it to their members before the waiting list.'],
    ['Waiting list', 'The members marked Waiting list in Members: they joined a barber who already had forty, and are waiting for a standing slot.'],
    ['Member’s cut', 'A member’s own visit, booked by their barber with no price, as membership covers it; a Member’s tidy is the beard shape or neck tidy between cuts. The Rebooking agent skips both.'],
    ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, the barber, each tool call and who said yes.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft the barber sent back.'],
    ['Approval gate', `A point where the run stops until the barber says yes. ${YES}`],
    ['Claude', 'Anthropic’s AI model. It answers, plans and drafts in the bot and the two agents. None of the three flows uses it.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of passages the Shop Q&A bot searches.'],
    ['Airtable', 'Where Ostler keeps its bookings, members and shelf orders, written by the three flows.'],
    ['Cal.com', 'Where each barber keeps their own book, one account per barber.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Ostler is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
