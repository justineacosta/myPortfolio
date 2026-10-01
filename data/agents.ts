/**
 * The AI agents and RAG chatbots page’s content (spec 2026-10-01-agents-page):
 * two diagrams and eight labelled sample builds on Justine’s stack. They are
 * examples of what Justine builds, not client projects.
 * public/ai-agents.html is generated from it: npm run agents-page
 */
import type { ToolId } from '../lib/brand/tools.ts'

export type SectionId = 'glance' | 'rag' | 'agent' | 'builds' | 'guardrails' | 'glossary'
export type Section = { id: SectionId; chip: string; kicker: string; title: string; blurb: string }
export type DiagramId = 'rag' | 'agent'
export type StepKind = 'start' | 'step' | 'branch' | 'gate' | 'end'
/** A source, channel or tool a step can use: a logo (`tool`) or a Phosphor icon name (`icon`). */
export type Pin = { id: string; name: string; what: string; tool?: ToolId; icon?: string }
/** A step on a diagram. `at` is its [column, row]. `pinType` names its pins in the details panel. */
export type Step = { id: string; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; tools?: ToolId[]; pins?: Pin[]; pinType?: string }
/** `index` is the dashed link from the store to the search. `under` sends a forward cable under the row. */
export type Cable = { from: string; to: string; kind: 'flow' | 'loop' | 'index'; label?: string; under?: true }
/** One way through a diagram for the balls, step by step. */
export type RouteDef = { id: string; nodes: string[] }
export type LegendId = 'cable' | 'signal' | 'loop' | 'index' | 'branch' | 'gate' | 'pin'
export type LegendKey = { id: LegendId; label: string; what: string }
export type Diagram = { id: DiagramId; caption: string; steps: Step[]; cables: Cable[]; routes: RouteDef[]; legend: LegendKey[] }
/** A sample build. `routes` are its diagram’s route ids; `pins` are "step:pin". */
export type Build = { id: string; kind: DiagramId; name: string; line: string; tools: ToolId[]; routes: string[]; pins: string[]; caption: string }
export type Tile = { mark: string; icon: string; title: string; text: string }
export type Agents = {
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  sample: string
  heroTools: ToolId[]
  sections: Section[]
  glance: Tile[]
  diagrams: Record<DiagramId, Diagram>
  builds: Build[]
  buildText: { sample: string; kinds: Record<DiagramId, string>; groups: Record<DiagramId, string>; show: string; showAll: string; tools: string }
  guardrails: Tile[]
  glossary: [string, string][]
  footer: { note: string; by: string }
}

/** What the details panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = { start: 'START', step: 'STEP', branch: 'DECISION', gate: 'APPROVAL GATE', end: 'END' }

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

export const agents: Agents = {
  title: 'AI agents and RAG chatbots · Justine Acosta',
  description: 'How Justine Acosta’s AI agents and RAG chatbots work: two live diagrams, eight sample builds and the guardrails they follow.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS',
  heading: 'How I build AI agents and RAG chatbots',
  lede: 'Eight sample builds on one stack, and the two patterns underneath every one of them.',
  sample: 'These are sample builds: examples of what I build, not client projects.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns, and both stop for your yes.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW A RAG CHATBOT WORKS', title: 'Search first, then answer', blurb: 'Documents are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A trigger starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'EIGHT SAMPLE BUILDS', title: 'Eight sample builds', blurb: 'Examples of what I build on this stack. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe to put in front of customers.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'They search your documents first, then answer from what they found, with the source.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'They take a goal, pick their own tools and finish the job, checking as they go.' },
    { mark: '3', icon: 'UserCheck', title: 'Your yes', text: 'Anything that reaches a customer or moves money waits for your approval.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'A RAG chatbot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Your documents', sub: 'Docs, PDFs, Sheets', icon: 'Files', pinType: 'SOURCE',
          what: 'The material the bot is allowed to answer from: help docs, PDFs and Google Sheets. Nothing outside it counts.',
          pins: [
            { id: 'docs', name: 'Docs', icon: 'FileText', what: 'Help articles, SOPs and service pages, as written.' },
            { id: 'pdf', name: 'PDFs', icon: 'FilePdf', what: 'Contracts, manuals and other uploaded files.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Price lists and tables, read row by row.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into chunks', sub: 'A few paragraphs each', icon: 'Scissors', what: 'Long documents are cut into passages of a few paragraphs, so a search can return just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a document changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A question', sub: 'Chat, Telegram, Gmail', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks a question in the website chat, in Telegram or by email. n8n picks it up and starts the run.',
          pins: [
            { id: 'chat', name: 'Website chat', icon: 'ChatCircleDots', what: 'A chat bubble on the website.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'A Telegram bot your team can message.' },
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Questions that arrive by email.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from what is in them.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure?', sub: 'A source was found', icon: 'Question', what: 'Did the passages actually hold the answer? If not, the bot does not guess.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Cites the passage', icon: 'ArrowBendUpLeft', what: 'The answer goes back where the question came from, with the passage it came from, so anyone can check it.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Offer a call', sub: 'Cal.com', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When the visitor is ready to buy, the bot offers open times from Cal.com instead of a form.' },
        { id: 'handoff', at: [5, 2], kind: 'end', label: 'Hand to a person', sub: 'With the chat so far', icon: 'UserSwitch', what: 'A hand-off: a person takes over with the whole chat so far, so the customer never has to repeat themselves.' },
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
        flow('reply', 'book', 'ready to buy'),
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
      caption: 'An agent · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Something happens', sub: 'Event or schedule', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Something starts the run: a new email, a Stripe payment event, a form, or a schedule like Monday at 8 am. n8n listens for it.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'A new email lands in the inbox.' },
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'A payment fails or an invoice goes overdue.' },
            { id: 'form', name: 'Form', icon: 'ClipboardText', what: 'A new lead fills in a form on the website.' },
            { id: 'clock', name: 'Schedule', icon: 'Clock', what: 'A set time, like every Monday at 8 am.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads what happened and the goal, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read or draft an email, look up Stripe, save to Supabase, update a sheet, check Cal.com or read a web page.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Reads the thread and drafts a reply.' },
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'Looks up the customer, invoice and payment history.' },
            { id: 'supabase', name: 'Supabase', tool: 'supabase', what: 'Reads and saves records, like a lead in the CRM.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Reads a sheet, like the sales pipeline.' },
            { id: 'cal', name: 'Cal.com', tool: 'cal-com', what: 'Finds open meeting times.' },
            { id: 'web', name: 'Web page', icon: 'Globe', what: 'Reads a public web page, like a lead’s website.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Needs your yes?', sub: 'Customers or money', icon: 'ShieldCheck', what: 'Does the result reach a customer or move money? If yes, it waits for you. Internal work, like a report to yourself, goes straight on.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Your yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'You get the draft in Telegram with Approve and Edit. Nothing is sent until you tap Approve; an edit goes back to Claude.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Act and log', sub: 'Send, then log it', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'The approved email goes out, and the run is written to Google Sheets: what came in, each tool call, and what was sent.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved email.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run, one row per job.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'internal only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one job going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until you say yes.' },
        PIN,
      ],
    },
  },
  builds: [
    { id: 'helpdesk', kind: 'rag', name: 'Help-desk RAG bot', line: 'Answers customers from your help docs and past tickets, and hands off when it isn’t sure.', tools: ['claude', 'supabase', 'n8n', 'gmail'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:docs', 'ask:chat', 'ask:gmail'], caption: 'Website chat or Gmail → search the help docs → Claude answers → reply with the source, or hand to a person' },
    { id: 'team', kind: 'rag', name: 'Team knowledge bot', line: 'Staff ask in Telegram how something is done; it answers from the SOPs and price sheets.', tools: ['claude', 'supabase', 'n8n', 'telegram', 'google-sheets'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:docs', 'docs:sheets', 'ask:telegram'], caption: 'Telegram → search the SOPs and price sheets → Claude answers → reply with the source, or hand to a person' },
    { id: 'sales', kind: 'rag', name: 'Website sales bot', line: 'Answers product and pricing questions from the real price list, then offers a call.', tools: ['claude', 'supabase', 'n8n', 'cal-com'], routes: ['prepare', 'answered', 'booked'], pins: ['docs:docs', 'docs:sheets', 'ask:chat'], caption: 'Website chat → search the price list and service pages → Claude answers → reply, then offer a Cal.com call' },
    { id: 'docqa', kind: 'rag', name: 'Document Q&A bot', line: 'Ask about your contracts or manuals; it answers with the page it used, or says it isn’t there.', tools: ['claude', 'supabase', 'n8n'], routes: ['prepare', 'answered', 'handoff'], pins: ['docs:pdf', 'ask:chat'], caption: 'Website chat → search the uploaded PDFs → Claude answers → reply with the page, or say it isn’t there' },
    { id: 'inbox', kind: 'agent', name: 'Inbox triage agent', line: 'Reads every new email, sorts it, drafts the reply and offers meeting times. Sends only on your yes.', tools: ['claude', 'n8n', 'gmail', 'cal-com', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:gmail', 'tool:gmail', 'tool:cal', 'act:gmail', 'act:sheets'], caption: 'New email → Claude sorts and drafts → Gmail and Cal.com → your yes in Telegram → send and log' },
    { id: 'billing', kind: 'agent', name: 'Billing follow-up agent', line: 'Watches Stripe for failed or overdue payments, picks the next step, writes the email and logs it.', tools: ['claude', 'n8n', 'stripe', 'gmail', 'google-sheets', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:stripe', 'tool:stripe', 'act:gmail', 'act:sheets'], caption: 'Stripe: payment failed → Claude picks the next step → reminder or retry link → your yes in Telegram → send and log' },
    { id: 'leads', kind: 'agent', name: 'Lead research agent', line: 'Reads a new lead’s website, scores the fit, saves it to the CRM and drafts a first email for your yes.', tools: ['claude', 'n8n', 'supabase', 'telegram'], routes: ['straight', 'notdone', 'changed'], pins: ['trigger:form', 'tool:web', 'tool:supabase', 'act:gmail', 'act:sheets'], caption: 'New form lead → Claude reads their site → score saved in Supabase → your yes on the first email → send and log' },
    { id: 'report', kind: 'agent', name: 'Weekly report agent', line: 'Every Monday it pulls Stripe revenue and the pipeline sheet, spots what changed and emails a summary.', tools: ['claude', 'n8n', 'stripe', 'google-sheets', 'gmail'], routes: ['internal'], pins: ['trigger:clock', 'tool:stripe', 'tool:sheets', 'act:gmail', 'act:sheets'], caption: 'Monday 8 am → Claude pulls Stripe and the pipeline sheet → writes the summary → internal, so no yes needed → send and log' },
  ],
  buildText: {
    sample: 'SAMPLE BUILD',
    kinds: { rag: 'RAG chatbot', agent: 'AI agent' },
    groups: { rag: 'RAG chatbots', agent: 'AI agents' },
    show: 'Show its route',
    showAll: 'Show all',
    tools: 'Tools',
  },
  guardrails: [
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from the sources', text: 'A RAG bot answers from the passages it found and shows which ones. No source, no answer.' },
    { mark: 'G2', icon: 'HandPalm', title: '“I don’t know” beats a guess', text: 'When the search comes back thin, it says so and hands the chat to a person.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'Customers and money wait for your yes', text: 'Anything that reaches a customer or moves money stops for your approval in Telegram.' },
    { mark: 'G4', icon: 'Notebook', title: 'Every run is logged', text: 'Each question, tool call and decision lands in a log you can read later.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search your own documents first, then answer from what was found.'],
    ['Chunk', 'A passage of a few paragraphs cut from a longer document, so a search can return just that part.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Passage', 'One chunk, as the search returns it and the answer cites it.'],
    ['Hand-off', 'Passing the chat to a person, with everything said so far.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: an email, a payment, a form or a set time.'],
    ['Tool call', 'One action an agent asks for, like drafting an email or reading a sheet.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft you sent back.'],
    ['Approval gate', 'A point where the run stops until a person says yes.'],
    ['Claude', 'Anthropic’s AI model. It plans, reads and writes in every build here.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here for the document store and the CRM.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them.', by: 'Built by Justine Acosta' },
}
