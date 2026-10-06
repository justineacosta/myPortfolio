/**
 * Riverdale & Brooks’s AI agents and RAG chatbots case page (spec 2026-10-05
 * per-site pages): the Practice Q&A bot in its site chat, and the Inbox triage
 * and Consultation prep agents, drawn on the general page’s two diagrams. It
 * tells the same story as Riverdale & Brooks’s Automation and Build plan pages,
 * under the same legal rule: nothing confidential is stored, summarised or
 * forwarded by Claude or any flow, and the bot never gives legal advice.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/riverdale-and-brooks/ai-agents.html. Only type imports, so Node
 * can run it directly.
 */
import type { Agents, Cable } from '../../agents.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const ASK = ['ask', 'qembed', 'search', 'answer', 'sure']
const RUN = ['trigger', 'plan', 'tool', 'check']

const CABLE = { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' } as const
const BRANCH = { id: 'branch', label: 'Branch', what: 'A yes-or-no decision. The cable labels say which way.' } as const
const PIN = { id: 'pin', label: 'Pin', what: 'A source, channel or tool this step can use. Click one to read it.' } as const

const BUSINESS = { name: 'Riverdale & Brooks', trade: 'small law practice' }

/** The page note on vendors, word for word as on the Build plan. */
const VENDORS = 'Before any client’s matter goes into these tools, the firm would confirm each vendor’s confidentiality terms and the client’s informed consent, as the profession’s ethics guidance on AI expects.'

const agents: Agents = {
  title: 'Riverdale & Brooks · AI agents and RAG chatbots',
  description: 'Riverdale & Brooks’s Practice Q&A bot and its two agents, Inbox triage and Consultation prep: two live diagrams, three sample builds and the guardrails that keep legal advice and anything confidential with Daniel A. Brooks.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · RIVERDALE & BROOKS',
  heading: 'A bot that answers from the site, and two agents that keep anything confidential with Daniel',
  lede: 'People ask Riverdale & Brooks the same practical things before they book: what a first consultation costs, whether they can meet by video, what to bring. This is the chatbot that answers them from the firm’s own pages, the two agents that sort the office inbox and prepare Daniel for each consultation, and the two patterns underneath all three. None of them gives legal advice, and none of them keeps anything confidential.',
  sample: 'Sample builds for Riverdale & Brooks, a fictional law practice used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns. Ruth approves any reply Claude drafts before it reaches anyone’s inbox; the chat answers live, only from the site’s own pages, and never gives legal advice.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE PRACTICE Q&A BOT WORKS', title: 'Search the site first, then answer', blurb: 'The firm’s public pages and guides are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'An email or a booked consultation starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Riverdale & Brooks', blurb: 'One bot for visitors, one agent for Ruth and one for Daniel. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe on a law firm’s site, where any question can turn into a request for advice.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Practice Q&A bot searches the practice areas, the fees, the FAQ and the visiting details first, then answers with the page it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Inbox triage and Consultation prep each take one email or one booked consultation, gather what they need, and finish the job for Ruth or Daniel.' },
    { mark: '3', icon: 'UserCheck', title: 'Ruth’s yes', text: 'Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out. Mail from a client, a court or opposing counsel reaches Daniel untouched.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Practice Q&A bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'The firm’s pages', sub: 'Public, no matters', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the practice areas, the fees, the FAQ, the hours and visiting details, and the three guides, as the site states them. Client stories and the client portal are left out.',
          pins: [
            { id: 'areas', name: 'Practice areas', icon: 'Scales', what: 'The six areas and what each covers, and the site’s line that the firm handles no criminal defense or personal injury.' },
            { id: 'fees', name: 'Fees', icon: 'Tag', what: 'Estate planning consultations free; other matters $150 for thirty minutes, credited. Which work has a flat fee, and which is hourly.' },
            { id: 'faq', name: 'FAQ and visiting', icon: 'Question', what: 'The five FAQ answers, from the first consultation’s cost to whether contacting the firm makes someone a client, plus the hours, 114 East Main Street, parking, step-free access, video meetings and home visits.' },
            { id: 'guides', name: 'Three guides', icon: 'FilePdf', what: 'Preparing for your first meeting, Probate in Virginia and Buying rural land, linked by name, never applied to a situation.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'An answer or a fee', icon: 'Scissors', what: 'Each page is cut answer by answer and fee by fee, so a search returns just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. Nothing a visitor types is ever added. This runs again whenever a fee, the hours or a guide changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on the firm’s site. It opens with the site’s line: please don’t include confidential details yet. Details typed anyway are not repeated or used, and no chat is kept.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of the site. It remembers nothing after the window closes, and never sends an email.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages. It is never stored.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a price, a date or a figure the pages do not hold, and never legal advice.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure, not advice?', sub: 'A page settles it', icon: 'Question', what: 'Did the passages hold the answer? Any question about someone’s own situation, rights or next step counts as no, and so does anything the pages do not say. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the page it came from, so the visitor can check it. The bot never sends email.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Book a consultation', sub: 'Cal.com, 30 minutes', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When someone wants to meet, the bot opens the Cal.com page that matches the fee: free for estate planning, $150 credited for any other area, in the office or by video. A booking there is a request until Ruth confirms it, after a conflict check by hand.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Book, call or write', sub: 'No legal advice', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off, with no legal advice: the bot says it can’t advise on a situation and asks for no details, then offers a consultation or a call. Criminal defense or personal injury gets the phone, for a referral.',
          pins: [
            { id: 'consult', name: 'Book a consultation', tool: 'cal-com', what: 'The Cal.com page that matches the fee, opened in the chat. It asks only for a name and email, and the time stays a request until Ruth confirms it.' },
            { id: 'phone', name: 'Phone', icon: 'Phone', what: '(540) 555-0148, Mon–Thu 8:30–5:30 and Fri 8:30–3:00. Daniel or Ruth replies within one business day.' },
            { id: 'referral', name: 'Referral by phone', icon: 'Handshake', what: 'The firm handles no criminal defense or personal injury. The bot says so and gives the number, and the firm refers callers.' },
            { id: 'gmail', name: 'Email the office', tool: 'gmail', what: 'office@riverdalebrooks.law, for anyone who would rather write. The visitor writes it themselves: the bot never emails.' },
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
        flow('reply', 'book', 'wants to meet'),
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
      caption: 'An agent for one email or booking · 5 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Email or booking', sub: 'Gmail or Cal.com', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a new email to office@riverdalebrooks.law for Inbox triage, or a consultation Ruth has confirmed in Cal.com for Consultation prep. n8n listens for both, keeps a run only while it waits for Ruth’s yes, and none once it ends.',
          pins: [
            { id: 'email', name: 'New email', tool: 'gmail', what: 'Any email to office@, never daniel@. n8n first looks the sender up in Contacts and Court domains, with Always Output Data on, so no row means neither. An existing client, a row with a matter, a court on the list, or an email with an attachment is labelled For Daniel unread.' },
            { id: 'booking', name: 'New booking', tool: 'cal-com', what: 'A consultation Ruth has confirmed on either Cal.com event type. Both require confirmation, so Cal.com sends Booking Created only once she confirms, after the conflict check by hand. It holds the type, time, office or video, name and email. Nothing more is asked, so there is nothing about a situation to read.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, an email to sort or a consultation to prepare, then picks the single next step and the tool it needs. It keeps nothing from one run to the next.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: label the email in Gmail, look a sender or an area up in Airtable, search the site’s passages, or read the booking in Cal.com. Nothing reads daniel@.',
          pins: [
            { id: 'label', name: 'Gmail label', tool: 'gmail', what: 'Puts one label on the email in office@: For Daniel, New enquiry or Admin. It writes nothing else, anywhere.' },
            { id: 'clients', name: 'Contacts', tool: 'airtable', what: 'Whether a sender is an existing client, meaning a Contacts row with a matter, checked by n8n before Claude sees an email, and the area a booked person asked about. Contact and area fields only, so no situation to read. Beside it, Court domains lists the courts’ public email domains, and holds no client data.' },
            { id: 'facts', name: 'Site passages', tool: 'supabase', what: 'The passages the Practice Q&A bot searches, guides included, so a reply or a prep says only what the site says.' },
            { id: 'booking', name: 'The booking', tool: 'cal-com', what: 'The booked consultation, read through Cal.com’s API. No booking is made, moved or cancelled.' },
            { id: 'byhand', name: 'By hand only', icon: 'HandPalm', what: 'Not a tool call: nothing reaches daniel@, the client portal, a court or the conflict list. Daniel and Ruth work those by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'To someone’s inbox?', sub: 'Or Daniel only', icon: 'ShieldCheck', what: 'Is a reply on its way to the sender’s inbox? Then it waits for Ruth. An email For Daniel has no draft, and a prep goes to Daniel alone: the run ends with a ping or the prep, and a log line.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Ruth’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'Ruth gets the draft in Telegram with Approve and Change it. The message holds only the drafted reply, never the sender’s words, and n8n keeps the run only while it waits. A change goes back to Claude with her note, and nothing is sent until she taps Approve.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'A reply, ping or prep', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved reply goes to the sender from office@; an email For Daniel gets only a ping, and a prep goes to Daniel alone. Every run is logged without a word of any email.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved reply from office@riverdalebrooks.law, never from Daniel’s own address.' },
            { id: 'ping', name: 'Ping to Daniel', tool: 'telegram', what: 'Tells Daniel an email waits For Daniel, with no name, subject or words from it. He opens it in office@ himself.' },
            { id: 'prep', name: 'Prep for Daniel', tool: 'telegram', what: 'The prep, in Daniel’s own Telegram chat: the time, office or video, the area, the fee, the checklist and conflict check: clear.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: the time, whether an email or a booking started it, each tool call by name, and any label or yes. Never an email’s words.' },
            { id: 'daniel', name: 'Daniel, by hand', icon: 'UserCircle', what: 'Daniel answers mail For Daniel himself. Ruth runs the conflict check by hand before she confirms any consultation, and he or Ruth again before any engagement letter.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, Daniel only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'needs', 'act'] },
        { id: 'gathered', nodes: [...RUN, 'plan', 'tool', 'check', 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one email or one booked consultation going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until Ruth says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Practice Q&A bot', business: BUSINESS,
      line: 'Answers Riverdale & Brooks’s visitors in the site chat on practice areas, fees, what a consultation costs, what to bring, video meetings, hours, and whether contacting the firm makes them a client. Never legal advice.',
      example: { ask: 'How much is a will?', answer: 'Wills have a flat fee, but the site doesn’t list the amount. The firm explains the cost in writing before any work begins, and an estate planning consultation is free. (Fees)' },
      tools: ['claude', 'n8n', 'supabase', 'cal-com', 'gmail'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:areas', 'docs:fees', 'docs:faq', 'docs:guides', 'ask:chat', 'handoff:consult', 'handoff:phone', 'handoff:referral', 'handoff:gmail'],
      caption: 'Riverdale & Brooks’s site chat → search the areas, fees and FAQ → Claude answers → reply with the page or book; a question about a situation gets a consultation, never legal advice',
    },
    {
      id: 'triage', kind: 'agent', name: 'Inbox triage agent', business: BUSINESS,
      line: 'Sorts every email to office@, never daniel@. A client, a court or opposing counsel goes to Daniel untouched; Ruth approves every reply it drafts.',
      example: { ask: 'New email: “Is there parking near your office?”', answer: 'Sorted Admin: a reply that there is a free lot behind the building, entrance on Mill Street, drafted from the site and waiting for Ruth’s yes in Telegram.' },
      tools: ['claude', 'n8n', 'gmail', 'airtable', 'supabase', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:email', 'tool:label', 'tool:clients', 'tool:facts', 'tool:byhand', 'act:gmail', 'act:ping', 'act:sheets', 'act:daniel'],
      caption: 'A new email to office@ → a client’s or a known court’s email goes For Daniel at once; Claude picks one label → For Daniel, untouched, with a ping; or a draft from the site → Ruth’s yes → send and log',
    },
    {
      id: 'prep', kind: 'agent', name: 'Consultation prep agent', business: BUSINESS,
      line: 'When Ruth confirms a consultation, after the conflict check, puts the booking and the area’s checklist from the site’s guides in front of Daniel, and no one else.',
      example: { ask: 'Cal.com: Ruth confirms an estate planning consultation, Thursday at 10:00, by video.', answer: 'A prep in Daniel’s Telegram: free, by video, Estate planning & probate from the Contacts row, conflict check: clear, what to bring from the site’s checklist, the probate guide, and that wills are signed in person. It never reads the few sentences.' },
      tools: ['claude', 'n8n', 'cal-com', 'airtable', 'supabase', 'telegram', 'google-sheets'],
      routes: ['internal', 'gathered'],
      pins: ['trigger:booking', 'tool:booking', 'tool:clients', 'tool:facts', 'tool:byhand', 'act:prep', 'act:sheets'],
      caption: 'A consultation Ruth confirms in Cal.com → Claude reads the booking, the area on Contacts and the site’s guides → a prep for Daniel alone → log',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from the firm’s public pages', text: 'The bot answers from the passages it found and names the page. It never gives a price, a date or a figure the pages do not hold: the site lists no flat-fee amounts, so neither does the bot. Its index holds the site’s public pages and guides only, and nothing a visitor types.' },
    { mark: 'G2', icon: 'Scales', title: 'No legal advice, ever', text: 'The bot never gives legal advice, and says so. Any question about someone’s own situation gets a consultation or a call with Daniel, and the bot asks people not to share confidential details in the chat. If someone types them anyway, the bot does not repeat or act on them: it says it can’t advise and offers a consultation or a call, and the chat is kept nowhere. Criminal defense or personal injury gets the phone number, for a referral to colleagues the firm trusts.' },
    { mark: 'G3', icon: 'LockKey', title: 'Nothing confidential is kept', text: `An existing client’s email, meaning a Contacts row with a matter, mail from a court on the Court domains list, or one with an attachment, goes For Daniel before Claude sees it. Of any other office@ email, within one run Claude sees the sender, subject and text, to sort it and, for a New enquiry or Admin email, to draft the reply. It keeps no copy, summary or note, the log holds none of the words, and n8n keeps a run only while it waits for Ruth’s yes, and none once it ends. Ruth’s Telegram message holds only the drafted reply, never the sender’s words. Opposing counsel can’t be routed before Claude without storing who the parties are, so Claude reads that mail only to sort it For Daniel, untouched, with no draft, and keeps nothing; so does mail from a court not on the list, or with confidential details anyway. No build reads the form’s few sentences or reaches daniel@, the client portal, a court or the conflict list; the conflict check is done by hand. ${VENDORS}` },
    { mark: 'G4', icon: 'ShieldCheck', title: 'Ruth says yes to every reply Claude drafts', text: 'Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out. Every reply Inbox triage drafts stops for Ruth in Telegram, and each run is logged with her yes. A templated reply from the consultation flow sends on its own, the bot answers live in the site chat only and never emails, and a prep goes to Daniel alone. No build sends from Daniel’s address.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search the firm’s own pages first, then answer from what was found.'],
    ['Passage', 'A fee or a practical answer cut from a longer page, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Legal advice', 'Advice on someone’s own situation, rights or next step. Daniel gives it to his clients; no bot or agent ever does.'],
    ['Hand-off', 'Passing the visitor to a person, by a consultation, the phone or their own email. The bot forwards nothing.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a new email to office@, or a consultation Ruth confirms in Cal.com.'],
    ['Tool call', 'One action an agent asks for, like putting a label on an email or reading a booking.'],
    ['For Daniel', 'The Gmail label for mail from a client, a court or opposing counsel, any email with an attachment or confidential details, and anything Claude is unsure of. The email is left untouched for Daniel, with no draft.'],
    ['New enquiry', 'The Gmail label for someone asking about a consultation, which gets a reply drafted from the site’s fees and booking links.'],
    ['Admin', 'The Gmail label for a practical email, like a question about parking or the hours, which gets a drafted reply.'],
    ['Prep', 'The note the Consultation prep agent sends Daniel before a consultation: the booking, the area and the checklist. Nobody else gets it.'],
    ['Confidentiality terms', `A vendor’s written terms on how it keeps what it is given. ${VENDORS}`],
    ['Few sentences', 'The optional box on the form, “A few sentences about your situation”. They pass through n8n and Gmail only to reach Daniel’s inbox, and no bot or agent reads them.'],
    ['Court domains', 'An Airtable list of the courts’ public email domains. n8n sends their mail For Daniel before Claude sees it. No client data.'],
    ['Conflict check', 'Making sure the firm acts for no one on the other side. Ruth runs it by hand before she confirms a consultation; no tool reads the conflict list or keeps a party’s name.'],
    ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, whether an email or a booking started it, each tool call, and any label or yes, never an email’s words.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft Ruth sent back.'],
    ['Approval gate', 'A point where the run stops until Ruth says yes. Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out.'],
    ['Claude', 'Anthropic’s AI model. It answers, sorts, plans and drafts in these builds, and keeps nothing between runs.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers and makes the tool calls. It keeps a run only while it waits for Ruth’s yes, and none once it ends.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of public passages the bot and both agents search.'],
    ['Airtable', 'Where the firm keeps contacts, matters and time, with contact, area, scheduling and billing fields only.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
