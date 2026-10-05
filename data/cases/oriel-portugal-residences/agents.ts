/**
 * Oriel’s AI agents and RAG chatbots case page (spec 2026-10-05 per-site
 * pages): the Residence Q&A bot in its site chat, and the two
 * agents around every private viewing, drawn on the general page’s two
 * diagrams. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/oriel-portugal-residences/ai-agents.html. Only type imports,
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

const agents: Agents = {
  title: 'Oriel · AI agents and RAG chatbots',
  description: 'Oriel’s Residence Q&A bot and the two agents around every private viewing: two live diagrams, three sample builds and the guardrails they follow.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · ORIEL',
  heading: 'A bot that answers from the sheets, and two agents around every viewing',
  lede: 'Oriel’s buyers ask about rooms, light and handover long before they walk a model. This is the chatbot that answers them from Oriel’s own documents, the two agents that prepare and follow up each private viewing, and the two patterns underneath all three.',
  sample: 'Sample builds for Oriel, a fictional developer used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns. Nothing an agent drafts for a buyer’s inbox goes out without an architect’s yes; the chat answers only from the sheets.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE Q&A BOT WORKS', title: 'Search the sheets first, then answer', blurb: 'Oriel’s documents are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A viewing starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Oriel', blurb: 'One bot for the questions before a viewing, two agents for the viewing itself. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe to put in front of someone choosing a home.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Q&A bot searches Oriel’s residence sheets and notes first, then answers with the sheet it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'They take one viewing, gather what they need from HubSpot, Airtable and the sheets, and finish the job.' },
    { mark: '3', icon: 'UserCheck', title: 'The architect’s yes', text: 'Anything an agent drafts for a buyer’s inbox waits for the project architect. The chat answers only from the sheets.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Residence Q&A bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Oriel’s documents', sub: 'Sheets, notes, FAQs', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: each residence’s sheet, the model revision notes, the journal and the studio FAQs. Nothing outside them counts.',
          pins: [
            { id: 'sheets', name: 'Residence sheets', icon: 'FilePdf', what: 'One per residence: rooms, sizes, aspect, sun hours, materials and status.' },
            { id: 'revisions', name: 'Revision notes', icon: 'FileText', what: 'The approved note for each model revision: what changed, in plain words.' },
            { id: 'journal', name: 'Journal', icon: 'Newspaper', what: 'The studio’s journal entries on materials, process and neighbourhoods.' },
            { id: 'faqs', name: 'Studio FAQs', icon: 'Question', what: 'How viewings, the headset, the models and handover work.' },
            { id: 'airtable', name: 'Airtable', tool: 'airtable', what: 'Holds the sheets, and the notes from the revisions table OR-03 uses; a new row runs this again.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'A room or a change', icon: 'Scissors', what: 'Each sheet is cut room by room and each note change by change, so a search can return just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a sheet or a note changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A buyer asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Oriel’s site. n8n starts the run. Email to the studio stays with the inbox flow and the people who answer it.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of Oriel’s site.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. Oriel publishes no prices, so it never gives one.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure?', sub: 'The sheet says so', icon: 'Question', what: 'Did the passages hold the answer? A price, or a date the residence sheet does not give, counts as no. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the sheet', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the sheet or note it came from, so the buyer can check it. The bot never sends email.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Book a viewing', sub: 'Cal.com', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When someone wants to walk the residence, the bot asks the form’s four questions and submits the viewing form with them, so the viewing flow books an architect on Cal.com.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Hand to the studio', sub: 'With the chat so far', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off: the bot asks for an email, then the whole chat goes to HubSpot as a task for the studio. A person replies within one working day.',
          pins: [
            { id: 'hubspot', name: 'HubSpot', tool: 'hubspot', what: 'The chat lands as a task for the studio, on the contact.' },
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'A person at the studio, not the bot, replies from studio@oriel.pt.' },
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
        flow('reply', 'book', 'wants to walk it'),
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
      caption: 'An agent around a viewing · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Around a viewing', sub: 'Day before, or after', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'A viewing starts the run: the evening before it, or the moment its architect logs how it went. n8n listens for both.',
          pins: [
            { id: 'clock', name: 'Schedule', icon: 'Clock', what: 'Every evening at 6 pm, once for each viewing booked for the next day.' },
            { id: 'hubspot', name: 'HubSpot', tool: 'hubspot', what: 'The architect logs a viewing’s notes on the buyer’s contact.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the viewing and the goal, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read the booking, the buyer’s HubSpot history, the residence’s project, its sheet or the buyer’s chat.',
          pins: [
            { id: 'cal', name: 'Cal.com', tool: 'cal-com', what: 'Reads the viewing’s time, its architect and where it happens.' },
            { id: 'hubspot', name: 'HubSpot', tool: 'hubspot', what: 'Reads the buyer’s request, past viewings and notes.' },
            { id: 'airtable', name: 'Airtable', tool: 'airtable', what: 'Reads the residence’s project and its latest model revision.' },
            { id: 'sheet', name: 'Residence sheet', icon: 'FilePdf', what: 'Reads the rooms, sizes, aspect and sun hours of the residence.' },
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'Reads what the buyer asked the Q&A bot, when the visitor is already a contact.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'To a buyer?', sub: 'Or just the studio', icon: 'ShieldCheck', what: 'Is the result going to a buyer? Then it waits for the architect. A brief for the architect’s own eyes goes straight on.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Architect’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'The project architect gets the draft in Telegram with Approve and Edit. Nothing is sent until they tap Approve; an edit goes back to Claude.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Email or Telegram', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved follow-up goes to the buyer by email; a brief goes to the architect in Telegram. Either way the run is logged on the buyer’s HubSpot contact.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved follow-up to the buyer.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'Sends the brief to the architect walking the viewing.' },
            { id: 'hubspot', name: 'HubSpot', tool: 'hubspot', what: 'Logs the run on the buyer’s contact timeline.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, studio only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one viewing’s job going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the architect says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Residence Q&A bot', business: { name: 'Oriel', trade: 'residential developer' },
      line: 'Answers Oriel’s buyers from the residence sheets, revision notes, journal and FAQs, then books a viewing.',
      example: { ask: 'How much winter sun does Residence 3B’s living room get?', answer: 'Direct sun from 09:25 to 16:55 on 21 December. (Residence 3B sheet, Living & dining)' },
      tools: ['claude', 'n8n', 'supabase', 'airtable', 'gmail', 'cal-com', 'hubspot'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:sheets', 'docs:revisions', 'docs:journal', 'docs:faqs', 'docs:airtable', 'ask:chat', 'handoff:hubspot', 'handoff:gmail'],
      caption: 'Oriel’s site chat → search the sheets, notes and FAQs → Claude answers → reply with the source, book a viewing or hand off',
    },
    {
      id: 'brief', kind: 'agent', name: 'Viewing brief agent', business: { name: 'Oriel', trade: 'residential developer' },
      line: 'The evening before each viewing, it gives Oriel’s walking architect a short brief on the buyer.',
      example: { ask: '6 pm: a Lioz viewing tomorrow at 10:00, at the studio, for a buyer who walked Pinhal.', answer: 'A brief in Telegram: back after Pinhal, asked the bot about 3B’s winter sun. Start in the living room.' },
      tools: ['claude', 'n8n', 'cal-com', 'hubspot', 'telegram'],
      routes: ['internal'],
      pins: ['trigger:clock', 'tool:cal', 'tool:hubspot', 'tool:sheet', 'tool:chat', 'act:telegram', 'act:hubspot'],
      caption: 'Oriel, 6 pm → Claude reads Cal.com, HubSpot, the sheet and any chat → a brief for the architect in Telegram, no yes needed',
    },
    {
      id: 'followup', kind: 'agent', name: 'Buyer follow-up agent', business: { name: 'Oriel', trade: 'residential developer' },
      line: 'After a viewing, it drafts Oriel’s follow-up, naming the rooms and questions raised, for the architect’s yes.',
      example: { ask: 'Architect’s note on a 3B viewing: asked about the terraces and the bedroom light.', answer: 'A follow-up: 34 m² of terraces, morning sun in the main bedroom. Waiting for the architect’s yes.' },
      tools: ['claude', 'n8n', 'hubspot', 'airtable', 'telegram', 'gmail'],
      routes: ['straight', 'notdone', 'changed'],
      pins: ['trigger:hubspot', 'tool:hubspot', 'tool:airtable', 'tool:sheet', 'act:gmail', 'act:hubspot'],
      caption: 'Viewing notes in HubSpot → Claude drafts from them and the sheet → the architect’s yes in Telegram → email the buyer and log it',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from Oriel’s documents', text: 'The bot answers from the passages it found and names the sheet or note. No source, no answer: the chat goes to the studio.' },
    { mark: 'G2', icon: 'Prohibit', title: 'Never quotes a price or a date not in the residence sheet', text: 'Oriel publishes no prices, so the bot never gives one. A date the sheet does not give goes to the studio too.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'Anything to a buyer waits for an architect’s yes', text: 'Every follow-up an agent drafts stops for the architect in Telegram before it goes out. The bot never emails; in the chat, the sheets are the limit.' },
    { mark: 'G4', icon: 'Notebook', title: 'Every run is logged', text: 'Each question, tool call and send lands in a run log, and on the buyer’s HubSpot contact when the visitor is already a contact.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Oriel’s own documents first, then answer from what was found.'],
    ['Residence sheet', 'One document per residence: its rooms, sizes, aspect, sun hours, materials and status.'],
    ['Revision note', 'The plain account of what changed when a residence’s model gets a new revision.'],
    ['Passage', 'A room or a change cut from a longer document, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing the chat to the studio, with everything said so far.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: the evening before a viewing, or the architect’s notes after it.'],
    ['Tool call', 'One action an agent asks for, like reading a buyer’s HubSpot history or a residence sheet.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft the architect sent back.'],
    ['Approval gate', 'A point where the run stops until the project architect says yes.'],
    ['Claude', 'Anthropic’s AI model. It plans, reads and writes in every build here.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store the Q&A bot searches.'],
    ['HubSpot', 'The CRM where Oriel keeps every buyer, their viewings and what they have been told.'],
    ['Airtable', 'Where Oriel keeps its projects, its residence sheets and the revisions table OR-03 watches.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
