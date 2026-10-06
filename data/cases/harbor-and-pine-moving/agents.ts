/**
 * Harbor & Pine Moving Co.’s AI agents and RAG chatbots case page (spec
 * 2026-10-05 per-site pages): the Help-desk RAG bot and the Billing follow-up
 * agent from the general AI agents page, taken deeper, and a Walkthrough prep
 * agent, drawn on the general page’s two diagrams. It tells the same story as
 * Harbor & Pine’s Automation and Build plan pages: the site promises “Same-day
 * written reply, no automated pricing bots”, so the bot never prices a move,
 * and a coordinator approves anything Claude drafts for a customer’s inbox.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/harbor-and-pine-moving/ai-agents.html. Only type imports, so
 * Node can run it directly.
 */
import type { Agents, Cable } from '../../agents.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

/** As on the general AI agents page. */
const BUSINESS = { name: 'Harbor & Pine Moving Co.', trade: 'moving company' }

/** The person’s-yes rule, as on Harbor & Pine’s other pages. */
const YES = 'A coordinator approves anything Claude drafts for a customer’s inbox before it is sent.'

/** The site’s own promise, word for word. */
const PROMISE = '“Same-day written reply, no automated pricing bots.”'

const agents: Agents = {
  title: 'Harbor & Pine Moving Co. · AI agents and RAG chatbots',
  description: 'Harbor & Pine Moving Co.’s Help-desk RAG bot and its two agents, Billing follow-up and Walkthrough prep: two live diagrams, three sample builds and the guardrails that keep every price and every customer email with a coordinator.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · HARBOR & PINE',
  heading: 'A help desk that never prices a move, and two agents a coordinator stands behind',
  lede: `People ask a mover the same things before they book: which towns, how long a long-distance run takes, whether a piano needs crating, how an estimate works. This is the chatbot that answers them in the site chat from Harbor & Pine’s pricing guide and FAQ, the agent that follows up an overdue invoice, the agent that readies a coordinator for a walkthrough, and the two patterns underneath all three. The site promises ${PROMISE} So the bot explains how an estimate works and never gives a figure, and no email reaches a customer until a coordinator says yes.`,
  sample: 'Sample builds for Harbor & Pine Moving Co., a fictional family-run mover on the Tidewater coast used across this portfolio, not a client project. Figures are illustrative.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: `Every build below is one of two patterns. ${YES} The chat answers live, from the pricing guide and FAQ, and never with a price.` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE HELP-DESK BOT WORKS', title: 'Search the guide first, then answer', blurb: 'Harbor & Pine’s pricing guide and FAQ are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'An overdue invoice or a booked walkthrough starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Harbor & Pine', blurb: 'One bot for customers, two agents for the coordinators. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe on a mover’s site that promises no automated pricing bots.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Help-desk RAG bot searches the pricing guide and FAQ first, then answers with the passage it used. It explains how an estimate works, and never gives a figure.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Billing follow-up and Walkthrough prep each take one overdue invoice or one booked walkthrough, gather what they need one tool at a time, and draft one thing.' },
    { mark: '3', icon: 'UserCheck', title: 'The coordinator’s yes', text: `${YES} The walkthrough brief goes to the coordinator only, the move-day message is a fixed template and sends on its own, and the bot answers live, in the site chat only.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Help-desk RAG bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Guide and FAQ', sub: 'Written from the site', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: Harbor & Pine’s pricing guide and its FAQ, both written from what the site says. Nothing outside them counts, and the coordinators’ rate card is never in them.',
          pins: [
            { id: 'guide', name: 'Pricing guide', icon: 'FileText', what: 'How a move is priced, in words and with no rates: a written range from the rooms, stairs, access, parking, distance and packing; flexible dates usually price lower; the estimate holds unless the inventory changes; paper, cartons and tape are in the quoted price; no fuel surcharge invented on the tailgate; no deposit to hold a date.' },
            { id: 'faq', name: 'FAQ', icon: 'Question', what: 'The answers the coordinators give most: the eight towns from Bellhaven to Cormorant Isle, the free on-site walkthrough within 20 miles of Bellhaven, long-distance runs on Tuesdays and Fridays with two to four days in transit, the six services, custom crating, ferry scheduling, certificates of insurance and the hours.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'One answer each', icon: 'Scissors', what: 'The guide is cut section by section and the FAQ answer by answer, so a search returns just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever Marisol or a coordinator changes the guide or the FAQ.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A customer asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Harbor & Pine’s site, and n8n starts the run. The bot answers there and nowhere else: it reads no inbox and sends no email.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of the site. It remembers nothing after the window closes, and it is not the quote form.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a price, a range, a date or a figure, and it cannot see any deal, move or invoice.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure from a passage?', sub: 'The guide settles it', icon: 'Question', what: 'Did the passages hold the answer? How an estimate works counts as yes; what a move will cost is answered with how the price is set, never a figure. A damage claim, a booked move, an invoice or anything the guide does not say counts as no.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the passage', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the passage it came from, so the customer can check it. A live answer from the guide and FAQ needs no one’s yes.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Start your estimate', sub: 'The quote form', icon: 'ClipboardText', what: 'When someone wants a price, the bot opens the three-step quote form, where a coordinator reads every request and replies the same working day with a written range, or books a walkthrough. It offers (555) 014-2200 too, and books nothing itself.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'A person takes it', sub: '(555) 014-2200', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off to a person: the bot says it can’t settle that from the guide and gives the office’s phone and email, with the hours. It forwards nothing and emails no one.',
          pins: [
            { id: 'phone', name: 'Phone the office', icon: 'Phone', what: '(555) 014-2200, Mon–Fri 7am–6pm and Sat 8am–2pm. A coordinator answers: no ticket numbers, no call centre.' },
            { id: 'email', name: 'Email a coordinator', icon: 'EnvelopeSimple', what: 'hello@harborandpine.example, which the coordinators read. The customer writes it themselves; the bot only gives the address.' },
            { id: 'claim', name: 'A damage claim', icon: 'ShieldWarning', what: 'Damage claims go to a person, always. The bot gives the phone and email and says a person handles every claim. It never says what is covered or what a claim is worth.' },
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
        flow('reply', 'book', 'wants a price'),
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
      caption: 'An agent for one invoice or one walkthrough · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Overdue or booked', sub: 'Stripe or Cal.com', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: Stripe telling n8n an invoice is 14 days past its due date, for the Billing follow-up agent, or a walkthrough booked in Cal.com, for the Walkthrough prep agent.',
          pins: [
            { id: 'stripe', name: 'An overdue invoice', tool: 'stripe', what: 'An invoice 14 days past its due date. Invoices are raised by hand in Stripe after the move, with the move named on them, so the agent can find its coordinator.' },
            { id: 'walkthrough', name: 'A walkthrough booked', tool: 'cal-com', what: 'A customer books a time on the On-site walkthrough or Video walkthrough page, from the link HP-01 sent when a coordinator chose Walkthrough.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, an overdue invoice to follow up or a walkthrough to prepare, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude, and every call reads: Stripe, Moves in Airtable, the deal in HubSpot, the booking in Cal.com, the guide and FAQ, or the Agent runs log. Nothing is changed, charged or booked.',
          pins: [
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'The invoice: the amount due, the due date, any payment made and its own Stripe payment page. Read only: no invoice is changed, voided or charged.' },
            { id: 'moves', name: 'Moves', tool: 'airtable', what: 'The move the invoice names: its date, its Status and its coordinator, a link to Team. Read only.' },
            { id: 'deal', name: 'The deal', tool: 'hubspot', what: 'The request in the Moves pipeline: moving from and to, the target moving date, the home or office size, the service and the coordinator who owns it. Read only.' },
            { id: 'booking', name: 'The booking', tool: 'cal-com', what: 'The walkthrough’s time, on site or by video, and anything the customer wrote in its notes, like a baby grand or a third-floor walk-up.' },
            { id: 'guide', name: 'Guide and FAQ', tool: 'supabase', what: 'The same passages the Help-desk bot answers from: the eight towns, the free walkthrough within 20 miles of Bellhaven, the ferry to Cormorant Isle, long-distance runs and specialty items.' },
            { id: 'sheets', name: 'Agent runs', tool: 'google-sheets', what: 'The log of earlier runs, read so an invoice already followed up is never reminded twice.' },
            { id: 'byhand', name: 'By hand only', icon: 'HandPalm', what: 'Not a tool call: no build reaches a review site, a ferry operator, the insurer, a building’s portal, a crane hire or a refund. The coordinators do those by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Customer’s inbox?', sub: 'Or the coordinator', icon: 'ShieldCheck', what: 'Is a draft on its way to a customer’s inbox? Then it waits for the move’s coordinator. A walkthrough brief, a paid invoice or one already followed up goes to the coordinator only, with no gate.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'The coordinator’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'The draft waits in the coordinators’ Telegram group, named for the move’s coordinator, with a button that opens an n8n form: Approve or Change it. Opening it records nothing; only the form’s submit does.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Approved or internal', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved reminder goes from hello@harborandpine.example in the coordinator’s name, a brief or a note goes to the coordinators’ group, and every run is logged in the Agent runs tab.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved reminder from hello@harborandpine.example, word for word as the coordinator approved it. A reply reaches the coordinators’ inbox and a person.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'Posts the walkthrough brief, or a note that an invoice needs a call, in the coordinators’ group for the coordinator it names. Never to a customer.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: the time, the invoice or the walkthrough, each tool call by name, and who said yes.' },
            { id: 'coordinator', name: 'The coordinator, by hand', icon: 'UserCircle', what: 'The coordinator answers any reply, calls a customer whose invoice is still open, and handles any refund or damage claim by hand. No build does.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, coordinator only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one invoice or one walkthrough going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the move’s coordinator says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'helpdesk', kind: 'rag', name: 'Help-desk RAG bot', business: BUSINESS,
      line: 'Answers Harbor & Pine Moving Co.’s customers from the pricing guide and FAQ; damage claims go to a person. It answers in the site chat only and never prices a move: it says how an estimate works, then offers the quote form or a call.',
      example: { ask: 'Do you move pianos, and what does it add?', answer: 'Yes: uprights and baby grands, with custom crating built in-house when an item needs it. I can’t price it here. Start your estimate and a coordinator replies the same working day with a written range, or books a walkthrough. (Pricing guide, Specialty items)' },
      tools: ['claude', 'supabase', 'n8n'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:guide', 'docs:faq', 'ask:chat', 'handoff:phone', 'handoff:email', 'handoff:claim'],
      caption: 'Harbor & Pine’s site chat → search the pricing guide and FAQ → Claude answers → reply with the source, or the quote form; a claim or anything else goes to a person',
    },
    {
      id: 'billing', kind: 'agent', name: 'Billing follow-up agent', business: BUSINESS,
      line: 'Spots Harbor & Pine Moving Co.’s overdue invoices in Stripe, drafts a polite reminder and logs it. The reminder waits for the move’s coordinator to say yes; an invoice paid since, or one already reminded, goes to the coordinator instead, with nothing drafted for the customer.',
      example: { ask: 'Stripe: office-move invoice HP-0142 is 14 days overdue.', answer: 'A friendly reminder with the invoice’s Stripe payment link, in the coordinator’s name, drafted and waiting for their yes in Telegram.' },
      tools: ['claude', 'n8n', 'stripe', 'airtable', 'gmail', 'google-sheets', 'telegram'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:stripe', 'tool:stripe', 'tool:moves', 'tool:sheets', 'tool:byhand', 'act:gmail', 'act:telegram', 'act:sheets', 'act:coordinator'],
      caption: 'Stripe: Harbor & Pine invoice 14 days overdue → Claude reads the invoice, the move and the log → reminder with payment link → the coordinator’s yes → send and log',
    },
    {
      id: 'prep', kind: 'agent', name: 'Walkthrough prep agent', business: BUSINESS,
      line: 'When a customer books a walkthrough, it reads the request, the booking’s notes and the service area, and writes the coordinator a short brief: what to count, the town and its distance rule, and any specialty item, ferry or long-distance run to plan for. It goes to the coordinator only, never to the customer, and holds no price.',
      example: { ask: 'Cal.com: an on-site walkthrough booked for a four-bedroom house in Fern Cove, with “baby grand” in the notes.', answer: 'A brief in the coordinators’ group for the deal’s coordinator: count rooms, stairs, access and parking; Fern Cove is one of the eight towns; the baby grand may need custom crating. No range.' },
      tools: ['claude', 'n8n', 'cal-com', 'hubspot', 'supabase', 'telegram', 'google-sheets'],
      routes: ['internal'],
      pins: ['trigger:walkthrough', 'tool:deal', 'tool:booking', 'tool:guide', 'tool:byhand', 'act:telegram', 'act:sheets'],
      caption: 'A walkthrough booked in Cal.com → Claude reads the deal, the booking and the guide → a brief for the coordinator only → posted and logged',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from the guide and FAQ', text: 'The bot answers from the passages it found and names them. It never gives a price, a range, a date or a figure, and the coordinators’ rate card is never in its store. It cannot see a deal, a move or an invoice, books nothing, takes no payment and never emails.' },
    { mark: 'G2', icon: 'HandPalm', title: 'No price from a bot', text: `The site promises ${PROMISE} Asked what a move costs, the bot says how an estimate is set and opens the quote form, where a coordinator replies the same working day with a written range, or books a walkthrough. A damage claim, a booked move, an invoice or anything the guide does not settle goes to a person, by phone or email.` },
    { mark: 'G3', icon: 'ShieldCheck', title: 'The coordinator says yes to every customer email', text: `${YES} Every reminder the Billing follow-up agent drafts stops in the coordinators’ Telegram group for the move’s coordinator, and each run is logged with their yes. It never changes an invoice, adds a fee or offers a discount. The walkthrough brief goes to the coordinator only and holds no range. The move-day message is a fixed template and sends on its own, and the bot answers live, in the site chat only.` },
    { mark: 'G4', icon: 'Truck', title: 'Ferries, reviews and claims stay by hand', text: 'No build reaches a ferry operator, a crane hire, the insurer, a building’s portal or a review site, and none is claimed. The coordinators book ferries, cranes and crating by hand, and a person handles every damage claim and refund.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Harbor & Pine’s own guide first, then answer from what was found.'],
    ['Pricing guide', 'How a move is priced, in words and with no rates, written from the site. The coordinators’ rate card is kept apart.'],
    ['FAQ', 'The answers the coordinators give most often, written from the site: towns, transit times, services and hours.'],
    ['Passage', 'One section of the guide or one FAQ answer, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing the customer to a person, by the office’s phone or email. The bot forwards nothing.'],
    ['Written range', 'A low and a high figure for a move, sent only by a coordinator, the same working day.'],
    ['Walkthrough', 'A coordinator counting rooms, stairs, access and parking, on site within 20 miles of Bellhaven or over video.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: an invoice 14 days overdue, or a walkthrough booked.'],
    ['Tool call', 'One action an agent asks for, like reading an invoice in Stripe or a deal in HubSpot.'],
    ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, each tool call and who said yes.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft the coordinator sent back.'],
    ['Approval gate', `A point where the run stops until the coordinator says yes. ${YES}`],
    ['Claude', 'Anthropic’s AI model. It answers, plans and drafts in the bot and the two agents, and drafts HP-01’s range for the coordinators only.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of passages from the guide and FAQ.'],
    ['Airtable', 'Where Harbor & Pine keeps its booked moves, its team and its certificate requests.'],
    ['HubSpot', 'Where every estimate request is a deal in the Moves pipeline, with its coordinator.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Harbor & Pine is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
