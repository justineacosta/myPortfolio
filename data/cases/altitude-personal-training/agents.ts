/**
 * Altitude’s AI agents and RAG chatbots case page (spec 2026-10-05 per-site
 * pages): the Program Q&A bot in its site chat, and the Form review prep and
 * Block review agents, drawn on the general page’s two diagrams. It tells the
 * same story as Altitude’s Automation and Build plan pages.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/altitude-personal-training/ai-agents.html. Only type imports,
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

const BUSINESS = { name: 'Altitude', trade: 'personal training studio' }

const agents: Agents = {
  title: 'Altitude · AI agents and RAG chatbots',
  description: 'Altitude’s Program Q&A bot and its two agents, Form review prep and Block review: two live diagrams, three sample builds and the guardrails they follow.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · ALTITUDE',
  heading: 'A bot that answers from the site, and two agents that work for Elias',
  lede: 'People ask Altitude the same things before they apply: what each program is for, what Hybrid includes, what happens after they apply. This is the chatbot that answers them from Altitude’s own pages, the two agents that prepare Elias’s form reviews and draft each block review, and the two patterns underneath all three.',
  sample: 'Sample builds for Altitude, a fictional coaching studio used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns. Elias approves anything Claude drafts for a client’s inbox; the chat answers live, only from the site’s pages.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE PROGRAM Q&A BOT WORKS', title: 'Search the site first, then answer', blurb: 'Altitude’s pages are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A form video or the end of a four-week block starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Altitude', blurb: 'One bot for visitors, two agents for Elias. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe to put in front of someone asking about a sore knee.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Program Q&A bot searches the programs, the pricing and formats and the FAQ first, then answers with the page it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Form review prep and Block review each take one client, gather what they need from Airtable and what Elias forwards, and finish the job for him.' },
    { mark: '3', icon: 'UserCheck', title: 'Elias’s yes', text: 'Elias approves anything Claude drafts for a client’s inbox and writes every check-in reply himself. Injuries go to a consult with him.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Program Q&A bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Altitude’s pages', sub: 'Three sources', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the six programs, the pricing and formats, and the FAQ, as the site states them. Nothing outside them counts.',
          pins: [
            { id: 'programs', name: 'Programs', icon: 'Barbell', what: 'The six programs, Foundations to Mountain and endurance: who each is for, how long it runs and what it builds.' },
            { id: 'pricing', name: 'Pricing and formats', icon: 'Tag', what: 'Online at $229, Hybrid at $449 and Studio at $760 a month, what each includes, the 12-week first block and 14 days’ notice after it.' },
            { id: 'faq', name: 'FAQ', icon: 'Question', what: 'The site’s questions and answers, from who coaching is for to what happens after you apply.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'A program or a plan', icon: 'Scissors', what: 'Each page is cut program by program, plan by plan and question by question, so a search returns just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. This runs again whenever a program, a price or the FAQ changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Altitude’s site. n8n starts the run. Email and calls stay with Elias.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of Altitude’s site.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a price, a date or a figure the pages do not hold.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure, and no injury?', sub: 'A page settles it', icon: 'Question', what: 'Did the passages hold the answer? Any injury, pain or medical question counts as no, even the FAQ’s “What if I have an injury?”, and so does anything the pages do not say. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the page it came from, so the visitor can check it. The bot never sends email.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Book the consult', sub: 'Cal.com, 20 minutes', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When someone wants to start, the bot opens Elias’s Cal.com consult page in the chat, the same one Book a consult opens. No application is sent, so if they start, Elias adds their row to Applications by hand.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Hand to Elias', sub: 'A consult, or a note', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off, with no advice: the bot offers the free 20-minute consult with Elias, where an injury is talked through in person. Anyone who would rather write leaves an email, and the chat goes to Elias. A consult booked here skips the application, so Elias adds the row by hand if they start.',
          pins: [
            { id: 'consult', name: 'The consult', tool: 'cal-com', what: 'Elias’s Cal.com consult page, opened in the chat, so the visitor books the free 20 minutes with him.' },
            { id: 'telegram', name: 'Elias’s chat', tool: 'telegram', what: 'The whole chat, with the email they left, lands in Elias’s Telegram.' },
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Elias writes back himself from hello@altitude.coach, within the two working days the site promises. The bot never emails.' },
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
        flow('reply', 'book', 'wants to start'),
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
      caption: 'An agent for one client · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'A video or 4 weeks', sub: 'Telegram or schedule', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a form video Elias forwards for Form review prep, or the end of a client’s four weeks for Block review. n8n listens for both.',
          pins: [
            { id: 'video', name: 'Form video', icon: 'VideoCamera', what: 'A client uploads a working set in the coaching app. Elias forwards its link to the Form review chat in Telegram, with the lift and the target load.' },
            { id: 'clock', name: 'Schedule', icon: 'Clock', what: 'Every morning at 6, for each client whose four weeks end that day, counted from the Block start Elias entered.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the client and the goal, a form review to prepare or a four-week block to review, then picks the single next step and the tool it needs.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: read the client, their check-ins or their form notes in Airtable. Nothing reads the coaching app.',
          pins: [
            { id: 'clients', name: 'Clients', tool: 'airtable', what: 'Reads the client’s plan, their Block start and the goal from their application.' },
            { id: 'checkins', name: 'Check-ins', tool: 'airtable', what: 'Reads their recent check-ins and Claude’s summaries: sleep, steps, bodyweight trend and how training felt.' },
            { id: 'notes', name: 'Form notes', tool: 'airtable', what: 'Reads past preps for each lift, with the line Elias adds after every review.' },
            { id: 'app', name: 'Coaching app', icon: 'DeviceMobile', what: 'Not a tool call: no tool reads the app. Elias forwards the video link and the target load, and types re-test numbers into his Edit of a block review.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'To a client?', sub: 'Or Elias only', icon: 'ShieldCheck', what: 'Is the draft on its way to a client’s inbox? Then it waits for Elias. A form review prep is for his eyes only, and goes straight on.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Elias’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'Elias gets the draft in Telegram with Approve and Edit. He adds a block’s re-test numbers by Edit, and an edit goes back to Claude. Nothing is sent until he taps Approve.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Email or Telegram', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved block review goes to the client by email; a prep goes to Elias in Telegram. Either way the run is logged, and what happens in the app Elias does by hand.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved block review to the client from hello@altitude.coach.' },
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'Sends the prep to Elias beside the video link. It reaches no client, so it needs no yes.' },
            { id: 'notes', name: 'Form notes', tool: 'airtable', what: 'Saves each prep as a Form notes row, where Elias adds a line once he has reviewed the set.' },
            { id: 'app', name: 'Coaching app', icon: 'NotePencil', what: 'Elias writes the form feedback, and the next four-week block from the approved outline, into the app himself.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: what came in, each tool call, and Elias’s yes when there was one.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, Elias only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one client’s job going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until Elias says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Program Q&A bot', business: BUSINESS,
      line: 'Answers Altitude’s visitors in the site chat on programs, prices, formats and the FAQ, and books the free consult.',
      example: { ask: 'What does Hybrid include?', answer: 'Hybrid is $449 a month: everything in Online, two 60-minute studio sessions a month, re-testing in the studio each block and priority replies. (Pricing)' },
      tools: ['claude', 'n8n', 'supabase', 'cal-com', 'telegram', 'gmail'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:programs', 'docs:pricing', 'docs:faq', 'ask:chat', 'handoff:consult', 'handoff:telegram', 'handoff:gmail'],
      caption: 'Altitude’s site chat → search the programs, pricing and FAQ → Claude answers → reply with the page, book the consult, or a consult with Elias for an injury',
    },
    {
      id: 'form', kind: 'agent', name: 'Form review prep agent', business: BUSINESS,
      line: 'When Elias forwards a client’s form video, it gathers their past notes and target load so he can review within 24 hours.',
      example: { ask: 'Elias forwards a back squat video: 4×5 at 72.5 kg, week 7, block 2.', answer: 'A prep beside the link in Telegram: last week’s note says the final set moved fast at 72.5 kg, and Sunday’s check-in names no pain. For Elias only.' },
      tools: ['claude', 'n8n', 'airtable', 'telegram', 'google-sheets'],
      routes: ['internal'],
      pins: ['trigger:video', 'tool:clients', 'tool:checkins', 'tool:notes', 'tool:app', 'act:telegram', 'act:notes', 'act:sheets'],
      caption: 'A form video Elias forwards in Telegram → Claude reads the client, check-ins and form notes in Airtable → a prep for Elias in Telegram, no yes needed',
    },
    {
      id: 'block', kind: 'agent', name: 'Block review agent', business: BUSINESS,
      line: 'Every 4 weeks it drafts Altitude’s end-of-block summary and the next four-week block’s outline, for Elias’s yes before the client sees it.',
      example: { ask: '6 am: a Strength client’s four weeks end today, with four check-ins and three form notes.', answer: 'An end-of-block summary and the next four-week block’s outline, waiting in Telegram for Elias to add the re-test numbers by Edit and approve.' },
      tools: ['claude', 'n8n', 'airtable', 'telegram', 'gmail', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed'],
      pins: ['trigger:clock', 'tool:clients', 'tool:checkins', 'tool:notes', 'tool:app', 'act:gmail', 'act:app', 'act:sheets'],
      caption: 'Altitude, 6 am → Claude reads the block’s check-ins and form notes → a summary and an outline → Elias’s yes in Telegram → email the client and log it',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from Altitude’s pages', text: 'The bot answers from the passages it found and names the page. It never gives a price, a date or a figure the programs, pricing or FAQ do not hold. No source, no answer.' },
    { mark: 'G2', icon: 'FirstAidKit', title: 'No injury advice, ever', text: 'An injury, pain or a medical question goes to a consult with Elias, which the bot offers and can book. Both agents flag pain for Elias first, with no advice of their own.' },
    { mark: 'G3', icon: 'ShieldCheck', title: 'Elias says yes to Claude’s drafts for a client’s inbox', text: 'Every block review stops for Elias in Telegram before it goes out, and he writes every check-in reply himself. A form review prep is for his eyes only. The bot never emails.' },
    { mark: 'G4', icon: 'Notebook', title: 'Every run is logged', text: 'Each agent run, tool call and approval lands in the Agent runs tab, with Elias’s yes when there was one. Each chat is kept in n8n’s own run history.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Altitude’s own pages first, then answer from what was found.'],
    ['Programs', 'Altitude’s six programs, from Foundations to Mountain and endurance, each written and adjusted by Elias.'],
    ['Formats', 'The three ways to train: Online, Hybrid and Studio, each with its own monthly price.'],
    ['Passage', 'A program, a plan or a question cut from a longer page, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Consult', 'The free 20-minute call with Elias about fit, format and price, booked on Cal.com.'],
    ['Hand-off', 'Passing the visitor to Elias, by a consult or with the chat so far.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a form video Elias forwards, or the end of a client’s four weeks.'],
    ['Tool call', 'One action an agent asks for, like reading a client’s check-ins in Airtable.'],
    ['Block start', 'The day Elias loads a client’s first program in the app, entered in Airtable. Each four-week block counts from it.'],
    ['Form notes', 'An Airtable table of each form review prep, with the line Elias adds after he reviews the set.'],
    ['Coaching app', 'Where clients’ sessions, form videos and Elias’s replies live. No tool reads or writes it.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft Elias sent back.'],
    ['Approval gate', 'A point where the run stops until Elias says yes.'],
    ['Claude', 'Anthropic’s AI model. It plans, reads and writes in every build here.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store the Program Q&A bot searches.'],
    ['Airtable', 'Where Altitude keeps its applications, plans, clients, check-ins and form notes.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
