/**
 * Westmere’s AI agents and RAG chatbots case page (spec 2026-10-05 per-site
 * pages): the Document Q&A bot from the general AI agents page, taken deeper,
 * and two agents for the hosting agent, Viewing prep and Buyer follow-up,
 * drawn on the general page’s two diagrams. It tells the same story as
 * Westmere’s Automation and Build plan pages: the bot is internal and answers
 * the sales team only, the hosting agent approves anything Claude drafts for a
 * buyer’s inbox, and no bot or agent screens, scores, sorts or ranks a buyer.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/westmere-los-angeles/ai-agents.html. Only type imports, so
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
const BUSINESS = { name: 'Westmere', trade: 'residential developer' }

/** The person’s-yes rule, as on Westmere’s other pages. */
const YES = 'The hosting agent approves anything Claude drafts for a buyer’s inbox before it is sent.'

/** The fair-housing rule, as on Westmere’s other pages. */
const FAIR = 'Westmere is an Equal Housing Opportunity developer, DRE #02114471, so no bot or agent here screens, scores, sorts or ranks a buyer, and none uses a protected trait or a budget: Claude is instructed to ignore anything about who a buyer is, and nothing it writes has a place for it.'

const agents: Agents = {
  title: 'Westmere · AI agents and RAG chatbots',
  description: 'Westmere’s Document Q&A bot for the sales team and its two agents for the hosting agent, Viewing prep and Buyer follow-up: two live diagrams, three sample builds and the guardrails that keep every buyer treated the same.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · WESTMERE',
  heading: 'A contracts bot for the sales team, and two agents the hosting agent stands behind',
  lede: `A sale at Westmere runs on paper: purchase contracts, specifications, floor plans and a private viewing at the sales gallery, Tuesday to Saturday, by appointment only. This is the bot the sales team asks about a buyer’s contracts, the agent that readies the hosting agent for a viewing, the agent that drafts the follow-up afterwards, and the two patterns underneath all three. ${FAIR} The bot is internal: it answers the sales team, never a buyer. ${YES}`,
  sample: 'Sample builds for Westmere, a fictional Los Angeles residential developer used across this portfolio, not a client project. Figures are illustrative.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: `Every build below is one of two patterns. ${YES} The bot answers the sales team live, from the documents, and never a buyer.` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE DOCUMENT Q&A BOT WORKS', title: 'Search the documents first, then answer', blurb: 'The purchase contracts and residence documents are prepared once, with the parties left out. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A booked viewing or a viewing held starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Westmere', blurb: 'One bot for the sales team, two agents for the hosting agent. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what keep an Equal Housing Opportunity developer’s bot and agents fair to every buyer.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Document Q&A bot searches the purchase contracts and residence documents first, then answers the sales team with the page, or says it isn’t there. No legal or tax advice, and nothing about who a buyer is.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Viewing prep and Buyer follow-up each take one viewing, gather what they need one tool at a time, and draft one thing. Neither scores, sorts or ranks a buyer.' },
    { mark: '3', icon: 'UserCheck', title: 'The hosting agent’s yes', text: `${YES} The viewing brief goes to the hosting agent only, the brochure, the portfolio and the viewing confirmation are fixed templates and send on their own, and the bot never reaches a buyer, so it needs no yes.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Document Q&A bot · 3 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Contracts and specs', sub: 'Uploaded by the team', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the signed purchase contracts, filed by sale, and each residence’s documents. Nothing outside them counts, and no proof of funds is ever among them.',
          pins: [
            { id: 'contracts', name: 'Purchase contracts', icon: 'FilePdf', what: 'Each signed purchase agreement as a PDF, filed by the sale it belongs to, like The Orchard Residences, Residence 2. The sales director uploads it once escrow opens. It holds the terms: the deposit, the inspection period, the dates and the clauses.' },
            { id: 'residence', name: 'Residence documents', icon: 'FileText', what: 'For each of the five residences: the brochure, the floor plans and the specification, as Westmere issues them. The same public facts the site gives, in full.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split by page', sub: 'Parties left out', icon: 'Scissors', what: 'Each document is cut clause by clause, keeping its page and clause number. The parties’ names, addresses and signature pages are left out, so the store holds the terms, never who a buyer is.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, each tagged with its document, sale, page and clause. This runs again whenever the sales director uploads a document.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'The sales team asks', sub: 'In their own chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'A sales agent or the sales director asks in the team’s chat page, behind a sign-in, and n8n starts the run. Buyers never see it: it answers the sales team, sends no email and reaches no buyer.',
          pins: [
            { id: 'chat', name: 'Team chat', icon: 'ChatCircleDots', what: 'n8n’s hosted chat, behind a sign-in, for the sales team only. A question names the sale, like the Orchard sale, never a buyer. It remembers nothing after the window closes.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question, from the sale it names and that residence’s documents.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them, with the document, page and clause. It never invents a date, price or figure, gives no legal or tax advice, and answers nothing about who a buyer is.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'On the page?', sub: 'The documents decide', icon: 'Question', what: 'Did a passage hold the answer? A date, a deadline, a deposit term or a clause counts as yes. Anything the documents do not say, a legal or tax question, or a question about who a buyer is counts as no.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with the page', sub: 'Document and clause', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the team’s chat, with the document, page and clause, so the agent can open the contract and check. It reaches the sales team only, so it needs no one’s yes.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Says it isn’t there', sub: 'Or: ask the director', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'The bot says the answer isn’t in the documents, or that the question is not one it answers, and points to the sales director. It forwards nothing and emails no one.',
          pins: [
            { id: 'director', name: 'The sales director', icon: 'UserCircle', what: 'Anything the documents do not settle goes to the sales director, who holds every contract and decides what to tell a buyer.' },
            { id: 'advice', name: 'Legal or tax', icon: 'Scales', what: 'The bot gives no legal or tax advice. It says what the contract’s words are, with the page, and that what they mean for a buyer is a question for Westmere’s counsel or the buyer’s own advisers.' },
            { id: 'who', name: 'Who a buyer is', icon: 'ShieldWarning', what: 'Never answered. The store has no names, and the bot says it does not answer questions about who a buyer is: their family, origin, faith, age, health, means or anything else.' },
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
      ],
      routes: [
        { id: 'prepare', nodes: ['docs', 'chunk', 'embed', 'store'] },
        { id: 'answered', nodes: [...ASK, 'reply'] },
        { id: 'handoff', nodes: [...ASK, 'handoff'] },
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
      caption: 'An agent for one private viewing · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Booked or held', sub: 'Cal.com or the host', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a private viewing booked in Cal.com, for the Viewing prep agent, or the hosting agent marking a viewing held, for the Buyer follow-up agent.',
          pins: [
            { id: 'booked', name: 'A viewing booked', tool: 'cal-com', what: 'A second webhook on the Private viewing event, beside the one WM-02 uses, posts each new booking to n8n: the residence, the day and time, and the hosting agent Cal.com picked in turn. It fires on new bookings only: a moved viewing keeps its brief, and WM-02 tells the host the new day and time. A cancelled one leaves the brief in the host’s chat, and nothing more is sent.' },
            { id: 'held', name: 'A viewing held', icon: 'DoorOpen', what: 'Under the viewing brief in Telegram, a Viewing held button opens an n8n form: Held or Did not come, and an optional line on what the buyer asked about the residence. The link carries the viewing’s Cal.com booking ID and a signed token in hidden fields, and n8n’s Crypto node checks the token, so a stray or edited link starts nothing. Opening it records nothing; only the form’s submit starts a run, and Agent runs stops a second submit for the same viewing.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, a viewing to prepare or a viewing to follow up, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude, and every call reads: the booking, the residence’s public facts, the buyer’s enquiry, the residence documents, Team or the Agent runs log. Nothing is changed or booked. An empty result reaches Claude as not found, never as an error. No call asks for a budget, a proof of funds or anything about who a buyer is, and if a message mentions one, Claude is instructed to ignore it.',
          pins: [
            { id: 'booking', name: 'The booking', tool: 'cal-com', what: 'The viewing’s residence, day and time, and the hosting agent’s email. Read only.' },
            { id: 'residences', name: 'Residences', tool: 'airtable', what: 'The residence’s public facts as the site gives them, like The Orchard Residences: $12,750,000, 4 bedrooms and a study, 3,850 sq ft, completion 2027 Q2, 2 of 3 remaining. A residence missing from Residences gives no brief: the host’s chat and the sales team’s group hear it is missing. Read only.' },
            { id: 'enquiry', name: 'The enquiry', tool: 'hubspot', what: 'A HubSpot search by the booking’s email for two properties only: Enquiry message, the buyer’s words from their last enquiry as written, and Enquired on, its day. The search tolerates no match: a buyer who booked without enquiring may have no contact yet, since WM-02 saves it at the same moment. No contact, or an empty message, gives a facts-only brief. A message is always quoted with its day, so the brief shows when it is from an earlier enquiry. Claude takes from it only what it asks about the residence. Read only.' },
            { id: 'docs', name: 'Residence documents', tool: 'supabase', what: 'The same store the Document Q&A bot searches, filtered to the residence’s brochure, floor plans and specification. A metadata filter keeps every purchase contract out.' },
            { id: 'team', name: 'Team', tool: 'airtable', what: 'The hosting agent’s Telegram chat, found by their email. A host missing from Team gets no brief, and the sales team’s group hears instead.' },
            { id: 'sheets', name: 'Agent runs', tool: 'google-sheets', what: 'The log of earlier runs, read so a viewing never gets two follow-ups. An empty log means none sent yet.' },
            { id: 'byhand', name: 'By hand only', icon: 'HandPalm', what: 'Not a tool call: no build reaches a listing site, an escrow company or Kestrel Valuation Partners, and none reads or decides proof of funds. The sales team and the sales director do those by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Buyer’s inbox?', sub: 'Or the host only', icon: 'ShieldCheck', what: 'Is a draft on its way to a buyer’s inbox? Then it waits for the hosting agent. A viewing brief, a viewing the buyer did not come to, or one already followed up goes to the hosting agent only, with no gate.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'The host’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'The draft waits in the hosting agent’s own Telegram chat, with a button that opens an n8n form: Approve, or Change it with a note. Opening it records nothing; only the form’s submit does. n8n keeps the run while it waits.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Approved or internal', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved follow-up goes from private@westmere.la in the hosting agent’s name, a brief or a note goes to the hosting agent’s own chat, and every run is logged in the Agent runs tab.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved follow-up from private@westmere.la, word for word as the hosting agent approved it, with +1 310 555 0148, DRE #02114471 and Equal Housing Opportunity. A reply reaches the sales team and a person.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'Posts the viewing brief, or a note that nothing was drafted, in the hosting agent’s own chat. Never to a buyer.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: the time, the viewing, each tool call by name, and who said yes. Never a buyer’s details beyond the viewing.' },
            { id: 'host', name: 'The host, by hand', icon: 'UserCircle', what: 'The hosting agent answers any reply, calls a buyer if they choose, and passes any offer to the sales team. Proof of funds stays the sales director’s call. No build does any of it.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, the host only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one viewing going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the hosting agent says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'docqa', kind: 'rag', name: 'Document Q&A bot', business: BUSINESS,
      line: 'Westmere’s sales team asks about a buyer’s contracts; it answers with the page, or says it isn’t there. It is internal: it answers the sales team in their own chat from the purchase contracts and residence documents, never a buyer, and gives no legal or tax advice and nothing about who a buyer is.',
      example: { ask: 'When does the buyer’s deposit on the Orchard sale stop being refundable?', answer: 'When the 17-day inspection period ends. (Purchase agreement, page 7, §12.2)' },
      tools: ['claude', 'supabase', 'n8n'],
      routes: ['prepare', 'answered', 'handoff'],
      pins: ['docs:contracts', 'docs:residence', 'ask:chat', 'handoff:director', 'handoff:advice', 'handoff:who'],
      caption: 'Westmere’s team chat → search the purchase contracts and residence documents → Claude answers → reply with the page, or say it isn’t there',
    },
    {
      id: 'prep', kind: 'agent', name: 'Viewing prep agent', business: BUSINESS,
      line: 'When a private viewing is booked, it reads the booking, the residence’s public facts and the buyer’s enquiry, and writes the hosting agent a short brief: the facts to have ready and what the buyer asked about the residence. It goes to that agent only, never to the buyer, and it never scores, sorts or says anything about who the buyer is.',
      example: { ask: 'Cal.com: a Thursday private viewing booked for The Orchard Residences; the enquiry asked about the lap pool and completion.', answer: 'A brief in the hosting agent’s own Telegram: $12,750,000, 4 bedrooms and a study, 3,850 sq ft, completion 2027 Q2, 2 of 3 remaining; have the pool and deck plan and the specification ready. Nothing about the buyer but their questions.' },
      tools: ['claude', 'n8n', 'cal-com', 'airtable', 'hubspot', 'supabase', 'telegram', 'google-sheets'],
      routes: ['internal'],
      pins: ['trigger:booked', 'tool:booking', 'tool:residences', 'tool:enquiry', 'tool:docs', 'tool:team', 'tool:byhand', 'act:telegram', 'act:sheets'],
      caption: 'A private viewing booked in Cal.com → Claude reads the booking, the residence and the enquiry → a brief for the hosting agent only → posted and logged',
    },
    {
      id: 'followup', kind: 'agent', name: 'Buyer follow-up agent', business: BUSINESS,
      line: 'After a private viewing, when the hosting agent marks it held, it drafts a short follow-up in that agent’s name: thanks, answers from the residence’s public facts, and the ways to go on. The draft waits for the hosting agent’s yes. Every buyer who viewed gets the same kind of note: it never scores or sorts them, and never mentions a budget or the valuation figures.',
      example: { ask: 'Telegram: the hosting agent marks Thursday’s Orchard viewing held.', answer: 'A follow-up in the host’s name with the floor plans, completion 2027 Q2 and how to book a second viewing or request the full portfolio, drafted and waiting for their yes in Telegram.' },
      tools: ['claude', 'n8n', 'hubspot', 'airtable', 'supabase', 'gmail', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:held', 'tool:residences', 'tool:enquiry', 'tool:docs', 'tool:sheets', 'tool:byhand', 'act:gmail', 'act:telegram', 'act:sheets', 'act:host'],
      caption: 'Westmere viewing marked held → Claude reads the residence, the enquiry and the log → a follow-up in the host’s name → the hosting agent’s yes → send and log',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from the documents', text: 'The bot answers from the passages it found and names the document, page and clause. It never invents a date, price or figure, and gives no legal or tax advice. It is internal: it answers the sales team in their own chat, never a buyer, books nothing and never emails.' },
    { mark: 'G2', icon: 'Scales', title: 'Nothing about who a buyer is', text: `${FAIR} The store keeps the terms of a contract and leaves out the parties. The viewing brief carries only what the buyer asked about the residence, and every buyer who viewed gets the same kind of follow-up. A “qualified buyer” means proof of funds and nothing else, and only the sales director decides it, by hand, in WM-03. No agent reads it.` },
    { mark: 'G3', icon: 'ShieldCheck', title: 'The hosting agent says yes to every buyer email', text: `${YES} Every follow-up the Buyer follow-up agent drafts stops in the hosting agent’s own Telegram chat, and each run is logged with their yes. The viewing brief goes to the hosting agent only. The brochure, the portfolio and the viewing confirmation are fixed templates and send on their own, and the bot never reaches a buyer, so it needs no yes.` },
    { mark: 'G4', icon: 'Buildings', title: 'Listings, offers and escrow stay by hand', text: 'No build reaches a listing site, an escrow company or Kestrel Valuation Partners, and none is claimed. The sales team lists, takes offers and runs escrow by hand, and the valuation pack goes out only through WM-03, after the sales director confirms proof of funds.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Westmere’s own documents first, then answer from what was found.'],
    ['Purchase contract', 'A signed purchase agreement for one sale, filed by its residence. The bot reads its terms, never its parties.'],
    ['Residence documents', 'Each residence’s brochure, floor plans and specification, as Westmere issues them.'],
    ['Passage', 'One clause of a contract or one section of a document, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing a question to a person, here the sales director. The bot forwards nothing.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a private viewing booked in Cal.com, or the hosting agent marking one held.'],
    ['Tool call', 'One action an agent asks for, like reading a residence in Airtable or a contact in HubSpot.'],
    ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, each tool call and who said yes.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft the hosting agent sent back.'],
    ['Approval gate', `A point where the run stops until the hosting agent says yes. ${YES}`],
    ['Hosting agent', 'The sales agent Cal.com picks in turn to host a private viewing at the sales gallery.'],
    ['Listing agent', 'The sales agent who holds a residence, alerted when a buyer asks to view or talk.'],
    ['Sales director', 'The person who confirms proof of funds, keeps the documents and answers what the bot cannot.'],
    ['Proof of funds', 'The only thing that makes a buyer qualified. The sales director checks it by hand; no bot or agent reads it.'],
    ['Fair housing', 'The rule that no buyer is screened, sorted or scored on who they are, which Westmere follows as an Equal Housing Opportunity developer.'],
    ['Claude', 'Anthropic’s AI model. It answers in the bot, plans and drafts in the two agents, and reads WM-01’s enquiries.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of passages from the contracts and residence documents.'],
    ['Airtable', 'Where Westmere keeps its residences, its team, portfolio requests and documents.'],
    ['HubSpot', 'Where every buyer is a contact, with the residence they asked about and their next viewing.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Westmere is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
