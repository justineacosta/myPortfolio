/**
 * Meridian Werks’ AI agents and RAG chatbots case page (spec 2026-10-05
 * per-site pages): the Workshop Q&A bot in its site chat, new, and the two
 * agents the general AI agents page builds for Meridian Werks, taken deeper:
 * Inbox triage, which sorts booking and reschedule emails and drafts replies
 * for Ilse’s yes, and Weekly report, the owner’s Monday summary. No bot or
 * agent here diagnoses a fault, guesses a cause, says whether a car is safe
 * to drive or quotes a price. It tells the same story as Meridian Werks’
 * Automation and Build plan pages. data/cases/index.ts registers it;
 * `npm run cases` renders it into public/cases/meridian-werks/ai-agents.html.
 * Only type imports, so Node can run it directly.
 */
import type { Agents, Cable } from '../../agents.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'guard', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

/** As on the general AI agents page. */
const BUSINESS = { name: 'Meridian Werks', trade: 'automotive workshop' }

/** The workshop’s rule, as on Meridian Werks’ other pages. */
const RULE = 'No bot or agent here diagnoses a fault, guesses a cause, says whether a car is safe to drive or quotes a price. The technicians diagnose on the lift and the bench, and Ilse prices every fixed estimate after diagnostics, in euros. The site puts it plainly: “Describe the symptom rather than the repair. Diagnosis is our job.”'

/** The person’s-yes rule, as on Meridian Werks’ other pages. */
const YES = 'Ilse Brandt, the workshop manager, approves anything Claude drafts for a customer’s inbox before it is sent.'

const agents: Agents = {
  title: 'Meridian Werks · AI agents and RAG chatbots',
  description: 'Meridian Werks’ Workshop Q&A bot and its two agents, Inbox triage and Weekly report: two live diagrams, three sample builds and the guardrails that keep every diagnosis with the technicians and every price with Ilse.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · MERIDIAN WERKS',
  heading: 'A bot that answers from the workshop’s pages, and two agents that never diagnose a car',
  lede: `Owners ask Meridian Werks the same things before they book: which marques it works on, when it is open, how booking works. This is the bot that answers them in the site chat from the workshop’s own pages, the agent that sorts the workshop’s inbox and drafts replies for Ilse, the agent that writes the Monday summary, and the two patterns underneath all three. ${RULE} ${YES} The bot answers live, without a yes, from the workshop’s pages only and always with the source. Neither agent is a step in MW-01, MW-02 or MW-03: they run beside the flows, and in the flows Claude still drafts only the health report’s summary.`,
  sample: 'Sample builds for Meridian Werks, a fictional Rotterdam workshop used across this portfolio, not a client project. Times, prices and figures are illustrative.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: `Every build below is one of two patterns, and none diagnoses a car or quotes a price. ${YES}` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE WORKSHOP Q&A BOT WORKS', title: 'Search the pages first, then answer', blurb: 'The workshop’s public pages are prepared once. Every question then meets a fixed check for symptom words, and only then searches the pages before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A new email or Monday morning starts it. Claude plans, reads one thing at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Meridian Werks', blurb: 'One bot for owners on the site, one agent for Ilse’s inbox and one for the Monday summary. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what keep a workshop’s bot and agents out of the diagnosis and the pricing, which belong to people.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Workshop Q&A bot searches the services, the marques, the visiting details and how booking works, then answers in the site chat with the page it used. A symptom gets the booking form, never a diagnosis.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Inbox triage sorts booking and reschedule emails and drafts replies for Ilse; urgent ones go straight to her. Weekly report writes the founder a Monday summary from Stripe and the Jobs table.' },
    { mark: '3', icon: 'UserCheck', title: 'Ilse’s yes', text: `${YES} The Monday summary stays inside the workshop, and the bot answers live from the site, so neither needs a yes.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Workshop Q&A bot · 5 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'The workshop’s pages', sub: 'Public, no prices', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: Meridian Werks’ own public pages, as the site states them. The site lists no prices, so the store holds none. No job card, health report, estimate or registration is ever among them.',
          pins: [
            { id: 'services', name: 'Services', icon: 'Wrench', what: 'The eight services as the site lists them, from Diagnostics & Electrical to Fleet & Commercial Service, with what each covers, and the three-stage Refinement Programme with its typical weeks per stage. No price, because the site gives none.' },
            { id: 'marques', name: 'Vehicles', icon: 'Car', what: 'The marques the workshop specialises in: European, German as its core specialism, Japanese, Performance, Luxury and Commercial, with the models named under each, like the 911, the M3 / M4 and the Sprinter.' },
            { id: 'visit', name: 'Visit', icon: 'MapPin', what: 'Loodsweg 14, Unit B, 3089 JS Rotterdam: reception at the second roller door, parking inside the gate. Mon–Fri 07:30–18:00, Sat 09:00–14:00, Sunday closed. +31 10 244 1180 and workshop@meridianwerks.nl.' },
            { id: 'booking', name: 'Booking', icon: 'CalendarCheck', what: 'How booking works: four short steps, the vehicle, the service, the date and the details, with the registration optional, and “We confirm by phone within one working day.” Also the four-stage process, that a fixed estimate comes after diagnostics and no work begins before it is approved, and the 24-month parts and labour warranty.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'Service by service', icon: 'Scissors', what: 'Each page is cut service by service and answer by answer, so a search returns just the part that matters, with the page it came from.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, each tagged with its page. Nothing a visitor types is ever added. This runs again whenever a page changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Meridian Werks’ site, and n8n starts the run. It is chat only: it sends no email, books nothing and calls no one.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of the site, started by n8n’s Chat Trigger. It remembers nothing between questions, and the workflow’s Save failed production executions and Save successful production executions are both set to Do not save, so no chat is kept. It never asks for a registration, a name or a phone number, and if a visitor types a registration, it is not repeated or stored.' },
          ],
        },
        { id: 'guard', at: [1, 1], kind: 'branch', label: 'Symptom words?', sub: 'A fixed n8n If', icon: 'ShieldWarning', tools: ['n8n'], what: 'Before any search and before Claude, an n8n If checks the question against a fixed list of words Ilse keeps: noise, knock, leak, smoke, smell, warning light, won’t start, safe to drive, what’s wrong, how much and the like. A match goes straight to a fixed reply, so Claude never sees it. It is a word list, not a judgement about a car.' },
        { id: 'stop', at: [1, 2], kind: 'end', label: 'Book it, or call', sub: 'Fixed reply', icon: 'HandPalm', what: 'A fixed reply, never Claude’s. A price or a safe-to-drive question leads with +31 10 244 1180, Mon–Fri 07:30–18:00, and that a fixed estimate comes only after diagnostics. A symptom leads with the site’s own words: “Describe the symptom rather than the repair. Diagnosis is our job,” then the Book a service form, where the symptom goes in the details. No cause, no price, and no word on whether a car is safe to drive.' },
        { id: 'qembed', at: [2, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages. It is never stored.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with four rules: answer only from them, naming the page; never give a price, a date or a figure they do not hold; never diagnose a fault, guess a cause or say whether a car is safe to drive; and never ask for a registration.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'On the page?', sub: 'And no symptom', icon: 'Question', what: 'Claude’s own check, behind the fixed one: did a passage hold the answer, and is the question clear of a symptom, a fault, a price and whether a car is safe to drive? Yes only if both. Anything the pages do not say counts as no. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat with the page it came from, like (Vehicles) or (Visit), so the visitor can check it. It answers live, from the workshop’s pages only, so it needs no one’s yes.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Open the booking', sub: 'Book a service', icon: 'CalendarCheck', what: 'When the visitor wants to book, the bot opens the site’s own Book a service form in the chat: the same four steps. The booking then runs MW-01 like any other, and Ilse confirms it by phone within one working day.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'To a person', sub: 'Phone, email or book', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'The bot says the answer isn’t in the workshop’s pages, or that a symptom or a price is for the workshop to judge, and points the visitor to a person: the phone, Mon–Fri 07:30–18:00, or email, where a person replies. A symptom also gets the booking form. The bot forwards nothing and alerts no one.',
          pins: [
            { id: 'phone', name: 'Phone', icon: 'Phone', what: '+31 10 244 1180, Mon–Fri 07:30–18:00, as the site says: “Book a service, or call and talk it through first. Either is fine.”' },
            { id: 'gmail', name: 'Email the workshop', tool: 'gmail', what: 'workshop@meridianwerks.nl, for anyone who would rather write. The visitor writes it themselves: the bot never emails. Inbox triage leaves a question like this For Ilse, with no draft, and a person replies.' },
            { id: 'form', name: 'Book a service', icon: 'CalendarCheck', what: 'For a symptom: the site’s four-step booking, where the owner describes it in the details. The technicians diagnose it on the lift and the bench, and Ilse sends the fixed estimate before any work.' },
          ],
        },
      ],
      cables: [
        flow('docs', 'chunk'),
        flow('chunk', 'embed'),
        flow('embed', 'store'),
        { from: 'store', to: 'search', kind: 'index', label: 'the index it searches' },
        flow('ask', 'guard'),
        flow('guard', 'qembed', 'no'),
        flow('guard', 'stop', 'symptom'),
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
        { id: 'stopped', nodes: ['ask', 'guard', 'stop'] },
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
      caption: 'An agent for one email or one week · 5 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Email or Monday', sub: 'Gmail or a schedule', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a new email to workshop@meridianwerks.nl, for the Inbox triage agent, or Monday at 08:00, for the Weekly report agent. n8n runs both, separately from the three flows. Neither run is covered by MW-H02, which logs only the flows: a failure here shows as an email left unlabelled, or a missing Monday summary, and Ilse notices by its absence.',
          pins: [
            { id: 'email', name: 'New email', tool: 'gmail', what: 'n8n’s Gmail Trigger checks workshop@meridianwerks.nl every minute and hands on each new email, skipping the workshop’s own mail and the flows’ receipts and reports. Attachments never reach Claude.' },
            { id: 'monday', name: 'Monday, 8 am', icon: 'Clock', what: 'n8n’s Schedule Trigger, every Monday at 08:00, Rotterdam time, for the Weekly report agent.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, an email to sort and answer or a week to sum up, and picks the single next step. For Inbox triage it sorts the email first: Booking, Reschedule, Urgent or For Ilse. It keeps nothing from one run to the next.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude. Every call reads, except the one Gmail label: nothing is booked, moved, priced or changed on a job card. An empty result reaches Claude as none found, never as an error.',
          pins: [
            { id: 'label', name: 'Gmail label', tool: 'gmail', what: 'Puts one label on the email: Booking, Reschedule, Urgent or For Ilse. It writes nothing else, anywhere.' },
            { id: 'times', name: 'Open times', tool: 'cal-com', what: 'The sender’s booking, found by their email, and the next open times on the Workshop visit event type, read through Cal.com’s API: the same calendar MW-01 holds slots in. Read only: no booking is made, moved, held or cancelled.' },
            { id: 'stripe', name: 'Stripe', tool: 'stripe', what: 'Last week’s and the week before’s successful payments, which n8n sums into two totals in euros before Claude sees them. Read only, and never a customer’s name or card.' },
            { id: 'jobs', name: 'Jobs table', tool: 'airtable', what: 'The jobs sheet: the Airtable Jobs table the flows keep. n8n’s Airtable Search sets Output Fields to only Stage, Make, Model, Job number and Waiting on parts, so what comes back never holds the registration or an owner’s details; it counts the jobs at each Stage and lists those ticked Waiting on parts by job number, make and model.' },
            { id: 'byhand', name: 'Never a tool', icon: 'HandPalm', what: 'Not a tool call: no build reads a finding, diagnoses a fault, writes a price, moves a booking or changes a job card. The technicians diagnose on the lift and the bench, and Ilse prices and reschedules by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step. A draft it cannot write without a cause, a price or a registration becomes no draft, and the email goes For Ilse.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'A customer’s inbox?', sub: 'Or kept in-house', icon: 'ShieldCheck', what: 'Is a draft on its way to a customer’s inbox? Then it waits for Ilse. An email sorted Urgent or For Ilse has no draft and goes to her at once, and the Monday summary goes to the founder, inside Meridian Werks, with no gate.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Ilse’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'Ilse gets the draft in her own Telegram chat with a button that opens an n8n form: Approve, or Change it with a note. Opening it records nothing; only the form’s submit does. n8n keeps the run waiting at the gate, with its data, for up to a day; then it tells Ilse the email still needs her, and sends nothing. A Change it goes back to Claude.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send or tell', sub: 'Approved or internal', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved reply goes in the email’s own thread, an urgent email or one For Ilse reaches her in Telegram, and the Monday summary goes to the founder by email. n8n keeps each run’s execution, as it keeps every run’s data.',
          pins: [
            { id: 'gmail', name: 'Reply in the thread', tool: 'gmail', what: 'Sends the approved reply in the email’s own thread from workshop@meridianwerks.nl, word for word as Ilse approved it. An answer to it comes back to the inbox, and Inbox triage leaves it For Ilse, with no new draft.' },
            { id: 'ping', name: 'Tell Ilse', tool: 'telegram', what: 'Tells Ilse an email is waiting for her: with sound for Urgent, quietly for For Ilse. It holds a link to the thread, never the email’s words, so no registration reaches the chat.' },
            { id: 'report', name: 'The Monday email', tool: 'gmail', what: 'Emails the summary to the founder from workshop@meridianwerks.nl: revenue in euros against the week before, the jobs at each stage, and those waiting on parts. It is internal, so it needs no yes.' },
            { id: 'ilse', name: 'Ilse, by hand', icon: 'UserCircle', what: 'Ilse calls back about every urgent email and answers everything For Ilse. When an owner picks a new time, Ilse will call to confirm it, with her own approval message as the reminder, and moves the booking in Cal.com herself. No build does.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, Ilse or internal', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'person', nodes: [...RUN, 'needs', 'act'] },
        { id: 'internal', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one email or one week going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until Ilse says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Workshop Q&A bot', business: BUSINESS,
      line: 'Answers Meridian Werks’ visitors in the site chat on the eight services, the marques, the hours, the address and how booking works, from the workshop’s own pages and always with the source. It never diagnoses a fault, guesses a cause, says whether a car is safe to drive or quotes a price: a fixed n8n check sends any symptom to the site’s own words, “Describe the symptom rather than the repair. Diagnosis is our job.”, with the booking form or +31 10 244 1180, Mon–Fri 07:30–18:00, before Claude sees it. It never asks for a registration, and anything its pages do not hold goes to a person.',
      example: { ask: 'Do you work on a Porsche 911, and are you open on Saturdays?', answer: 'Yes. Porsche is part of the workshop’s German core specialism, and the 911 is listed under Performance. On Saturdays the workshop is open 09:00–14:00. (Vehicles; Visit)' },
      tools: ['claude', 'supabase', 'n8n', 'gmail'],
      routes: ['prepare', 'answered', 'handoff', 'stopped', 'booked'],
      pins: ['docs:services', 'docs:marques', 'docs:visit', 'docs:booking', 'ask:chat', 'handoff:phone', 'handoff:gmail', 'handoff:form'],
      caption: 'Meridian Werks’ site chat → a fixed check for symptom words → search the workshop’s pages → Claude answers with the page, or opens the booking; a symptom gets the booking form or the phone, never a diagnosis',
    },
    {
      id: 'inbox', kind: 'agent', name: 'Inbox triage agent', business: BUSINESS,
      line: 'Sorts Meridian Werks’ booking and reschedule emails and drafts replies; urgent ones go to a person. Every draft waits for Ilse’s yes in Telegram before it is sent. A reschedule reply offers open Cal.com times but moves nothing: the booking stays as it is until Ilse calls to confirm the new time; her approval message in Telegram is her own reminder to make that call. A booking reply points to the site’s four steps. No reply diagnoses, guesses a cause or quotes a price. Urgent means a breakdown, a car stranded or a question whether a car is safe to drive: it goes to Ilse at once, with no draft. Anything else, an owner’s answer to a health report included, goes For Ilse untouched, as only the answer form or a call with Ilse records a yes.',
      example: { ask: 'New email: “Can I move Thursday’s brake service to next week?”', answer: 'A reply with three open Cal.com times, drafted and waiting for your yes: Ilse’s, in Telegram. It moves nothing: Thursday stays booked until Ilse calls to confirm the new time.' },
      tools: ['claude', 'n8n', 'gmail', 'cal-com', 'telegram'],
      routes: ['straight', 'notdone', 'changed', 'person'],
      pins: ['trigger:email', 'tool:label', 'tool:times', 'tool:byhand', 'act:gmail', 'act:ping', 'act:ilse'],
      caption: 'New email to Meridian Werks → Claude sorts and drafts → Gmail and Cal.com, read only → Ilse’s yes in Telegram → reply in the thread; urgent ones straight to Ilse',
    },
    {
      id: 'report', kind: 'agent', name: 'Weekly report agent', business: BUSINESS,
      line: 'Every Monday it turns Meridian Werks’ Stripe revenue and jobs sheet into a summary for the owner. The jobs sheet is the Airtable Jobs table the flows keep, and the owner here is the workshop’s founder, Anton Vosloo. n8n sums the payments in euros and counts the jobs before Claude sees them, and Claude writes only from those figures: no figure of its own, no customer’s name and no registration. It goes to the founder alone, so it needs no yes.',
      example: { ask: 'Monday, 8 am.', answer: '“Revenue up 12% on last week; 3 jobs waiting on parts.” Emailed to the owner.' },
      tools: ['claude', 'n8n', 'stripe', 'airtable', 'gmail'],
      routes: ['internal'],
      pins: ['trigger:monday', 'tool:stripe', 'tool:jobs', 'tool:byhand', 'act:report'],
      caption: 'Meridian Werks, Monday 8 am → Claude pulls Stripe and the jobs sheet → writes the summary → internal, no yes needed → send',
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
    { mark: 'G1', icon: 'Wrench', title: 'Never a diagnosis, a cause or a price', text: `${RULE} The bot sends a question with a symptom word to the booking form or the phone before Claude sees it, and Inbox triage sends an email about a breakdown, or about whether a car is safe to drive, to Ilse with no draft. An estimate comes only after diagnostics: a fixed estimate in euros, priced by Ilse.` },
    { mark: 'G2', icon: 'Quotes', title: 'Answers only from the workshop’s pages', text: 'The bot answers from the passages it found and names the page. It never gives a price, a date or a figure the pages do not hold, and the pages hold no price. It is chat only: it sends no email and books nothing, and a question its pages do not settle goes to a person, by phone, Mon–Fri 07:30–18:00, or by email.' },
    { mark: 'G3', icon: 'UserCheck', title: 'Ilse says yes to every customer email', text: `${YES} Every reply Inbox triage drafts stops in her Telegram chat, and a reschedule reply moves no booking: Ilse will call to confirm the new time herself, with her approval message as the reminder. The Monday summary goes to the founder, inside Meridian Werks, and the bot answers live from the site, so neither needs a yes. No agent sets a job Approved: only the car’s owner says yes to work, and to any variation, on the answer form or by phone to Ilse.` },
    { mark: 'G4', icon: 'LockKey', title: 'A registration stays on the job card', text: 'A registration number is personal data. The bot never asks for one, no agent reads the Registration field, and no Telegram message, summary or reply carries one: Ilse’s messages link to the thread instead of quoting it. n8n keeps each agent run, as it keeps every run’s data; the bot’s own workflow has Save failed production executions and Save successful production executions both set to Do not save. Amounts are in euros.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search the workshop’s own pages first, then answer from what was found.'],
    ['Passage', 'One service, one answer or one visiting detail cut from a page, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Symptom words', 'The fixed list Ilse keeps, like knock, leak or warning light. A question with one gets the booking form, never Claude.'],
    ['Hand-off', 'Pointing the visitor to a person, by phone, Mon–Fri 07:30–18:00, or by email. The bot forwards nothing.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a new email to workshop@meridianwerks.nl, or Monday at 08:00.'],
    ['Tool call', 'One action an agent asks for, like reading the open times in Cal.com or putting a label on an email.'],
    ['Urgent', 'The label for a breakdown, a car stranded or a question whether a car is safe to drive. Ilse hears at once, and nothing is drafted.'],
    ['For Ilse', 'The label for anything that is not a booking or a reschedule, left untouched for Ilse to answer.'],
    ['Jobs table', 'The Airtable table of job cards the flows keep. The general page calls it the jobs sheet.'],
    ['Loop-back', 'A cable back to an earlier step: the agent reads again, or redoes a draft Ilse sent back.'],
    ['Approval gate', `A point where the run stops until Ilse says yes. ${YES}`],
    ['Founder', 'Anton Vosloo, the workshop’s founder, who gets the Monday summary and signs off every calibration and pre-purchase inspection. Not the owner of a car.'],
    ['Claude', 'Anthropic’s AI model. It answers in the bot, sorts and drafts in Inbox triage, and writes the Monday summary.'],
    ['n8n', 'The workflow tool that runs the bot and both agents: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of passages from the workshop’s pages.'],
    ['Cal.com', 'The workshop calendar, where MW-01 holds each slot as a request until Ilse confirms it by phone.'],
    ['Stripe', 'Where the workshop takes payment for its invoices, which Ilse raises by hand.'],
    ['Airtable', 'Where Meridian Werks keeps its job cards, findings, reports and fleet clients.'],
    ['Telegram', 'The chat app where Ilse approves drafts and hears of an urgent email.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Meridian Werks is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
