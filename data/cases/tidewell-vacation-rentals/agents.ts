/**
 * Tidewell’s AI agents and RAG chatbots case page (spec 2026-10-05 per-site
 * pages): the Guest help bot in its site chat, and the Rate watch and Review
 * reply agents, drawn on the general page’s two diagrams. It tells the same
 * story as Tidewell’s Automation and Build plan pages. data/cases/index.ts
 * registers it; `npm run cases` renders it into
 * public/cases/tidewell-vacation-rentals/ai-agents.html. Only type imports,
 * so Node can run it directly.
 */
import type { Agents, Cable } from '../../agents.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

const BUSINESS = { name: 'Tidewell', trade: 'vacation rental manager' }

const agents: Agents = {
  title: 'Tidewell · AI agents and RAG chatbots',
  description: 'Tidewell’s Guest help bot and its two agents, Rate watch and Review reply: two live diagrams, three sample builds and the guardrails they follow.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · TIDEWELL',
  heading: 'A bot that answers guests from the guides, and two agents a manager signs off',
  lede: 'Tidewell’s guests ask the same things at every hour: the check-in, the house rules, where to eat. This is the chatbot that answers them from Tidewell’s own guides, the two agents that watch nearby rates and answer low reviews, and the two patterns underneath all three.',
  sample: 'Sample builds for Tidewell, a fictional rental manager used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns. A manager approves every rate change and every reply to a review; the chat answers live, only from the guides.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE GUEST HELP BOT WORKS', title: 'Search the guides first, then answer', blurb: 'Tidewell’s guides are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A morning or a review starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Tidewell', blurb: 'One bot for guests, two agents for the managers. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe to put in front of a family locked out at midnight.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Guest help bot searches the check-in guide, the house rules and the local guide first, then answers with the guide it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Rate watch and Review reply each take one home, gather what they need from Airtable and nearby rates, and finish the job.' },
    { mark: '3', icon: 'UserCheck', title: 'The manager’s yes', text: 'The home’s manager approves every rate change and every reply to a review. Lockouts and anything urgent go to the on-call person.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Guest help bot · 3 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Tidewell’s guides', sub: 'Three guides', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the check-in guide, each home’s house rules and the local guide. Nothing outside them counts.',
          pins: [
            { id: 'checkin', name: 'Check-in guide', icon: 'Key', what: 'How arrival works: the door code that arrives the morning you travel, parking, check-in and check-out times.' },
            { id: 'rules', name: 'House rules', icon: 'ListChecks', what: 'One set per home: pets, guests, noise, the pool and the hot tub.' },
            { id: 'local', name: 'Local guide', icon: 'MapTrifold', what: 'Where Tidewell’s staff eat, swim and take visiting family, market by market.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'A rule or a step', icon: 'Scissors', what: 'Each guide is cut rule by rule and step by step, and each passage is tagged with its home where it has one, so a search returns just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a guide or a home’s rules change.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A guest asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'A guest asks in Guest help on Tidewell’s site and names the home. n8n starts the run. Email and phone calls stay with people.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The Guest help chat on every page of Tidewell’s site.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning, from the guides and from the guest’s own home’s rules.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a door code, a price or a date the guides do not hold.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure and not urgent?', sub: 'A guide settles it', icon: 'Question', what: 'Did the passages hold the answer, and can a guide settle it? A lockout, a leak, no power or anything urgent counts as no, and so does anything the guides do not say. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the guide', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the guide it came from, so the guest can check it. The bot never sends email.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Hand to on call', sub: 'With the chat so far', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off: the bot asks for a phone number, and the whole chat goes to the on-call person. A real person replies in under ten minutes, day or night.',
          pins: [
            { id: 'telegram', name: 'On-call chat', tool: 'telegram', what: 'The chat lands in the on-call person’s Telegram, pinned with sound when it is urgent.' },
            { id: 'phone', name: 'Phone', icon: 'Phone', what: 'The on-call person calls or texts the guest back. Anything that needs an email is written by a person, never the bot.' },
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
      caption: 'An agent for a home · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'A morning or a review', sub: 'Schedule or review', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: the morning schedule for Rate watch, or a low review a manager pastes into the Review reply chat in Telegram. n8n listens for both.',
          pins: [
            { id: 'clock', name: 'Schedule', icon: 'Clock', what: 'Every morning at 7, once for each home.' },
            { id: 'review', name: 'Low review', icon: 'Star', what: 'A review of three stars or fewer that a manager saw on a listing and pasted into the Review reply chat in Telegram.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the home and the goal, a rate to check or a review to answer, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read the home in Airtable, read the nearby rates, or send the crew a pre-filled repair job.',
          pins: [
            { id: 'airtable', name: 'Airtable', tool: 'airtable', what: 'Reads the home: its nightly rate, occupancy, bedrooms, manager and recent jobs.' },
            { id: 'web', name: 'Nearby rates', icon: 'Globe', what: 'Reads comparable nearby homes’ rates for the weekends ahead, from a feed Tidewell supplies or a sheet the team fills from the listing sites by hand.' },
            { id: 'crew', name: 'Crew chat', tool: 'telegram', what: 'Sends the market’s crew the Jobs form, pre-filled with the home and the issue. They add photos and a quote, and TW-02 takes it from there.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Guest or money?', sub: 'Or a log only', icon: 'ShieldCheck', what: 'Does the result reach a guest or change a rate? Then it waits for the manager. A morning when nothing nearby moved ends with a log line, and needs no yes.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Manager’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'The home’s manager gets the proposed rate or the draft reply in Telegram with Approve and Edit. Nothing is logged as approved or posted until they tap Approve; an edit goes back to Claude.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Act and log', sub: 'Log, then by hand', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'The run is logged in the Agent runs tab. The manager then sets an approved rate on the listings, or posts an approved reply under the review, by hand.',
          pins: [
            { id: 'rate', name: 'Approved rate', icon: 'CurrencyDollar', what: 'Logged as a proposal with who approved it. The manager sets it on the listings by hand, and the nightly rate in Airtable stays the baseline.' },
            { id: 'review', name: 'Review reply', icon: 'ChatText', what: 'The manager posts the approved reply under the review on the listing site by hand, word for word.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: what came in, each tool call, and who said yes.' },
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
        { id: 'signal', label: 'Live signal', what: 'A ball is one home’s job going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the home’s manager says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'guest', kind: 'rag', name: 'Guest help bot', business: BUSINESS,
      line: 'Answers Tidewell’s guests in the site chat from the check-in guide, the house rules and the local guide.',
      example: { ask: 'Is it okay if we bring our dog?', answer: 'Not at The Marsh House: its house rules allow no pets. (House rules, The Marsh House)' },
      tools: ['claude', 'n8n', 'supabase', 'telegram'],
      routes: ['prepare', 'answered', 'handoff'],
      pins: ['docs:checkin', 'docs:rules', 'docs:local', 'ask:chat', 'handoff:telegram', 'handoff:phone'],
      caption: 'Tidewell’s Guest help chat → search the check-in guide, house rules and local guide → Claude answers → reply with the guide, or the on-call person',
    },
    {
      id: 'rates', kind: 'agent', name: 'Rate watch agent', business: BUSINESS,
      line: 'Each morning it sets Tidewell’s rates against nearby homes, and proposes a new one for the manager’s yes.',
      example: { ask: '7 am: three homes near The Marsh House drop next weekend’s rate by $60.', answer: 'A proposed $682 a night for that weekend, down from $742, waiting for Ruth’s yes in Telegram.' },
      tools: ['claude', 'n8n', 'airtable', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:clock', 'tool:airtable', 'tool:web', 'act:rate', 'act:sheets'],
      caption: 'Tidewell, 7 am → Claude reads the home in Airtable and nearby rates → a proposed rate → the manager’s yes in Telegram → logged, then set live by hand',
    },
    {
      id: 'reviews', kind: 'agent', name: 'Review reply agent', business: BUSINESS,
      line: 'Drafts Tidewell’s reply to a low review for the manager’s yes, and sends the crew a pre-filled repair job.',
      example: { ask: 'A three-star review, pasted into Telegram: “Coffee maker didn’t work.”', answer: 'A pre-filled repair job for the coffee maker sent to the crew, and a reply naming the fix, waiting for the manager’s yes.' },
      tools: ['claude', 'n8n', 'airtable', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed'],
      pins: ['trigger:review', 'tool:airtable', 'tool:crew', 'act:review', 'act:sheets'],
      caption: 'A low review pasted into Telegram → Claude reads the home and its jobs → a pre-filled job for the crew and a draft reply → the manager’s yes → logged, then posted by hand',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from Tidewell’s guides', text: 'The bot answers from the passages it found and names the guide. It never gives a door code, a price or a date the guides do not hold. No source, no answer.' },
    { mark: 'G2', icon: 'Siren', title: 'Lockouts and anything urgent go to a person', text: 'A lockout, a leak or no power goes straight to the on-call person in Telegram, who calls the guest back in under ten minutes. The bot does not try.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'Rates and replies wait for the manager’s yes', text: 'Every rate Rate watch proposes moves an owner’s money, and every reply Review reply drafts goes to a guest, so both stop for the home’s manager in Telegram, who then sets the rate or posts the reply by hand. The bot never emails.' },
    { mark: 'G4', icon: 'Notebook', title: 'Every run is logged', text: 'Each agent run, tool call and approval lands in the Agent runs tab, with who said yes. Each chat is kept in n8n’s own run history.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Tidewell’s own guides first, then answer from what was found.'],
    ['Check-in guide', 'How arrival works at a Tidewell home, from the door code to check-out.'],
    ['House rules', 'One set per home: pets, guests, noise, the pool and the hot tub.'],
    ['Local guide', 'Where Tidewell’s staff eat, swim and take visiting family, in each market.'],
    ['Passage', 'A rule or a step cut from a longer guide, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing the chat to a person, with everything said so far.'],
    ['On-call person', 'The member of Tidewell’s team who answers urgent guest messages that night.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: the morning schedule, or a low review pasted into Telegram.'],
    ['Tool call', 'One action an agent asks for, like reading a home in Airtable or sending the crew a job.'],
    ['Jobs form', 'The Airtable form a repair is logged on, with photos and a quote, which starts TW-02.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft the manager sent back.'],
    ['Approval gate', 'A point where the run stops until the home’s manager says yes.'],
    ['Claude', 'Anthropic’s AI model. It plans, reads and writes in every build here.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store the Guest help bot searches.'],
    ['Airtable', 'Where Tidewell keeps its homes, their baseline rates and occupancy, and every repair job.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
