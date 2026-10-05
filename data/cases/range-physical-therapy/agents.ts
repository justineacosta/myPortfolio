/**
 * Range Physical Therapy’s AI agents and RAG chatbots case page (spec
 * 2026-10-05 per-site pages): the Clinic Q&A bot in its site chat, and the
 * Inbox triage and Reschedule agents, drawn on the general page’s two
 * diagrams. It tells the same story as Range’s Automation and Build plan
 * pages, under the same clinical rule: nothing clinical is stored, summarised
 * or forwarded by Claude or any flow. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/range-physical-therapy/ai-agents.html. Only type imports, so
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

const BUSINESS = { name: 'Range Physical Therapy', trade: 'cash-pay physical therapy clinic' }

const agents: Agents = {
  title: 'Range Physical Therapy · AI agents and RAG chatbots',
  description: 'Range Physical Therapy’s Clinic Q&A bot and its two agents, Inbox triage and Reschedule: two live diagrams, three sample builds and the guardrails that keep anything clinical with Dr. Mara Ellison.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · RANGE PHYSICAL THERAPY',
  heading: 'A bot that answers from the site, and two agents that keep clinical email with Mara',
  lede: 'People ask Range the same practical things before they book: what a visit costs, whether they need a referral, whether their HSA card works. This is the chatbot that answers them from Range’s own pages, the two agents that sort Mara’s inbox and fill a late cancellation, and the two patterns underneath all three. None of them gives clinical advice, and none of them keeps anything clinical.',
  sample: 'Sample builds for Range Physical Therapy, a fictional clinic used across this portfolio, not a client project.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one rule', blurb: 'Every build below is one of two patterns. Mara approves anything Claude drafts for a patient’s inbox; the chat answers live, only from the site’s own pages, and never clinically.' },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE CLINIC Q&A BOT WORKS', title: 'Search the site first, then answer', blurb: 'Range’s public pages are prepared once. Every question then searches them before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'An email or a late cancellation starts it. Claude plans, uses one tool at a time and checks the result until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Range', blurb: 'One bot for visitors, two agents for Mara. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what make a bot safe on a clinic’s site, where any question can turn clinical.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Clinic Q&A bot searches the pricing, the visit details and the FAQ’s practical answers first, then answers with the page it used.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Inbox triage and Reschedule each take one email or one cancelled visit, gather what they need, and finish the job for Mara.' },
    { mark: '3', icon: 'UserCheck', title: 'Mara’s yes', text: 'Mara approves anything Claude drafts for a patient’s inbox. Anything clinical reaches her untouched, and an emergency gets “call 911”.' },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Clinic Q&A bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'Range’s pages', sub: 'Public, non-clinical', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: the pricing, the visit details and the FAQ’s practical answers, as the site states them. The What we treat list, the patient stories and How many visits will I need? are left out.',
          pins: [
            { id: 'pricing', name: 'Pricing', icon: 'Tag', what: 'The initial evaluation at $215, a follow-up at $185, and the six-visit plan at $1,020, $170 a visit, used within four months. HSA and FSA cards at checkout, and a superbill after each visit.' },
            { id: 'visit', name: 'Visiting', icon: 'MapPin', what: '1942 Pearl Street, Suite 200, Boulder. Mon–Thu 7am–7pm, Fri 7am–3pm, Sat 8am–noon. Bike racks at the door and two-hour street parking on 19th Street.' },
            { id: 'faq', name: 'FAQ', icon: 'Question', what: 'The practical answers: referrals, insurance, HSA and FSA, superbills, how long a visit is, what to wear and bring, and cancellations. None that turns on a person’s condition.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split into passages', sub: 'A price or an answer', icon: 'Scissors', what: 'Each page is cut price by price and question by question, so a search returns just the part that matters.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, ready to search. Nothing a visitor types is ever added. This runs again whenever a price, the hours or the FAQ changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Range’s site. n8n starts the run and saves no execution, so no chat is kept once the window closes. Email and calls stay with Mara.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of Range’s site. It remembers nothing after the window closes.' },
          ],
        },
        { id: 'qembed', at: [1, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages. It is never stored.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with one rule: answer only from them. It never gives a price, a date or a figure the pages do not hold, and never a word of clinical advice.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'Sure, not clinical?', sub: 'A page settles it', icon: 'Question', what: 'Did the passages hold the answer? Any symptom, pain or question about treatment counts as no, and so does anything the pages do not say. An emergency is pointed to 911 before any call is offered. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat, with the page it came from, so the visitor can check it. The bot never sends email.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Book the evaluation', sub: 'Cal.com, 60 minutes', icon: 'CalendarCheck', tools: ['cal-com'], what: 'When someone wants to start, the bot opens Mara’s Cal.com Initial evaluation page in the chat, the same one Schedule your evaluation opens. The booking then runs RP-01 like any other.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Free call, or 911', sub: 'No advice given', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A hand-off, with no advice. An emergency gets the site’s words first: if you think you are having a medical emergency, call 911. Anything else clinical gets the free 15-minute call with Mara. The bot forwards nothing.',
          pins: [
            { id: 'emergency', name: 'Call 911', icon: 'Siren', what: 'Shown first, for anything that sounds like an emergency, in the site’s own words: if you think you are having a medical emergency, call 911.' },
            { id: 'call', name: 'Free 15-minute call', tool: 'cal-com', what: 'Mara’s Cal.com page for the free 15-minute call, opened in the chat. It asks nothing about health.' },
            { id: 'phone', name: 'Phone', icon: 'Phone', what: '(303) 555-0142, to call or text. As the site says, Mara answers email and texts herself.' },
            { id: 'gmail', name: 'Email Mara', tool: 'gmail', what: 'hello@rangept.co, for anyone who would rather write. The visitor writes it themselves: the bot never emails, and passes the chat to no one.' },
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
      caption: 'An agent for one email or visit · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Email or cancellation', sub: 'Gmail or Cal.com', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a new email to hello@rangept.co for Inbox triage, or a visit cancelled inside 24 hours for Reschedule. n8n listens for both, and saves no execution of either.',
          pins: [
            { id: 'email', name: 'New email', tool: 'gmail', what: 'Any email to hello@rangept.co, checked every minute. Attachments never reach Claude: an email with one is labelled For Mara unread.' },
            { id: 'cancel', name: 'Late cancellation', tool: 'cal-com', what: 'A visit cancelled from its Cal.com link with less than 24 hours to go. A change further ahead is free, and Cal.com’s own links handle it.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal, an email to sort or a cancelled visit to fill, then picks the single next step and the tool it needs. It keeps nothing from one run to the next.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One call at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude: label the email in Gmail, search the site’s passages, read Mara’s openings in Cal.com, or read a patient’s scheduling row in Airtable. Nothing reads her notes system.',
          pins: [
            { id: 'label', name: 'Gmail label', tool: 'gmail', what: 'Puts one label on the email: For Mara or Admin. It writes nothing else, anywhere.' },
            { id: 'facts', name: 'Site passages', tool: 'supabase', what: 'The same public, non-clinical passages the Clinic Q&A bot searches, so an admin reply states only what the site states.' },
            { id: 'openings', name: 'Openings', tool: 'cal-com', what: 'The cancelled visit, and Mara’s next openings, read through Cal.com’s API. No booking is made, moved or cancelled.' },
            { id: 'patients', name: 'Patients and Plans', tool: 'airtable', what: 'The patient’s name and email, and a plan’s visits left and expiry date. Scheduling and billing fields only.' },
            { id: 'notes', name: 'Notes system', icon: 'Notebook', what: 'Not a tool call: no tool reads or writes Mara’s clinic notes system. Everything clinical stays there, written by her hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back. If the job is not done yet, it goes back to plan the next step.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'To a patient?', sub: 'Or a label only', icon: 'ShieldCheck', what: 'Is a draft on its way to a patient’s inbox? Then it waits for Mara. An email labelled For Mara has no draft: the run ends with a ping and a log line.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'Mara’s yes', sub: 'Approve in Telegram', icon: 'UserCheck', tools: ['telegram'], what: 'Mara gets the draft in Telegram with Approve and Edit. An edit goes back to Claude, and nothing is sent until she taps Approve.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send and log', sub: 'Email, or a ping', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved reply goes to the patient by email; an email For Mara gets only a ping. Either way the run is logged without a word of the email, and anything clinical Mara handles herself.',
          pins: [
            { id: 'gmail', name: 'Gmail', tool: 'gmail', what: 'Sends the approved reply to the patient from hello@rangept.co.' },
            { id: 'ping', name: 'Ping to Mara', tool: 'telegram', what: 'Tells Mara an email is waiting For Mara, with no name, subject or words from it. She opens it in Gmail herself.' },
            { id: 'sheets', name: 'Google Sheets', tool: 'google-sheets', what: 'Logs the run in the Agent runs tab: the time, the label, each tool call by name and Mara’s yes. Never the email’s words.' },
            { id: 'notes', name: 'Notes system', icon: 'NotePencil', what: 'Mara, by hand: whatever she reads in an email For Mara that belongs in her notes, she writes there herself.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, a label only', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'internal', nodes: [...RUN, 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one email or one cancelled visit going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until Mara says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'qa', kind: 'rag', name: 'Clinic Q&A bot', business: BUSINESS,
      line: 'Answers Range’s visitors in the site chat on prices, referrals, HSA and FSA, superbills, cancellations and what to wear. Never clinical advice.',
      example: { ask: 'Can I use my HSA?', answer: 'Yes. Physical therapy is generally an eligible expense, and Range accepts HSA and FSA cards at checkout. (Pricing)' },
      tools: ['claude', 'n8n', 'supabase', 'cal-com', 'gmail'],
      routes: ['prepare', 'answered', 'handoff', 'booked'],
      pins: ['docs:pricing', 'docs:visit', 'docs:faq', 'ask:chat', 'handoff:emergency', 'handoff:call', 'handoff:phone', 'handoff:gmail'],
      caption: 'Range’s site chat → search the pricing, visit details and FAQ → Claude answers → reply with the page or book an evaluation; any symptom gets the free call, an emergency 911',
    },
    {
      id: 'triage', kind: 'agent', name: 'Inbox triage agent', business: BUSINESS,
      line: 'Sorts every email to hello@rangept.co. Anything clinical goes to Mara untouched; replies to admin email are drafted for her yes.',
      example: { ask: 'New email: “Do I get a superbill for plan visits?”', answer: 'Sorted Admin: a reply that a superbill comes after each visit, plan visits included, drafted from the site and waiting for Mara’s yes in Telegram.' },
      tools: ['claude', 'n8n', 'gmail', 'supabase', 'telegram', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed', 'internal'],
      pins: ['trigger:email', 'tool:label', 'tool:facts', 'tool:notes', 'act:gmail', 'act:ping', 'act:sheets', 'act:notes'],
      caption: 'A new email to hello@rangept.co → Claude picks one label → For Mara, untouched, with a ping; or an admin draft from the site → Mara’s yes in Telegram → send and log',
    },
    {
      id: 'reschedule', kind: 'agent', name: 'Reschedule agent', business: BUSINESS,
      line: 'When a visit is cancelled inside 24 hours, it offers Mara’s next openings and drafts the reply for her yes.',
      example: { ask: 'Cal.com: tomorrow’s 7:00 am follow-up is cancelled, 16 hours ahead.', answer: 'A reply offering Mara’s next three openings, each a link to book, waiting for her yes in Telegram. No booking moved, nothing charged.' },
      tools: ['claude', 'n8n', 'cal-com', 'airtable', 'telegram', 'gmail', 'google-sheets'],
      routes: ['straight', 'notdone', 'changed'],
      pins: ['trigger:cancel', 'tool:openings', 'tool:patients', 'tool:notes', 'act:gmail', 'act:sheets'],
      caption: 'A visit cancelled in Cal.com inside 24 hours → Claude reads the openings and the patient’s row → a draft reply → Mara’s yes in Telegram → send and log',
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
    { mark: 'G1', icon: 'Quotes', title: 'Answers only from Range’s public pages', text: 'The bot answers from the passages it found and names the page. It never gives a price, a date or a figure the pages do not hold. Its index holds the site’s public, non-clinical pages only. No source, no answer, except the 911 line, in the site footer’s own words.' },
    { mark: 'G2', icon: 'FirstAidKit', title: 'No clinical advice, ever', text: 'Any symptom, pain or question about treatment gets the free 15-minute call with Mara, and an emergency gets “call 911” first. No build gives advice of its own, and no reminder or reply says whether more visits would help.' },
    { mark: 'G3', icon: 'LockKey', title: 'Nothing clinical is kept', text: 'Claude reads a clinical email once, only to sort it, and it is labelled For Mara and left untouched. Nothing clinical is stored, summarised or forwarded by Claude, Airtable or any flow, and n8n saves no runs of these builds. Before Claude reads any real patient email, Range would need a signed business associate agreement with each vendor that handles it.' },
    { mark: 'G4', icon: 'ShieldCheck', title: 'Mara says yes to Claude’s drafts for a patient’s inbox', text: 'Every reply Inbox triage or Reschedule drafts stops for Mara in Telegram before it goes out, and each run is logged with her yes. The bot never emails. No agent charges, refunds or moves a booking.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Range’s own pages first, then answer from what was found.'],
    ['Passage', 'A price or a practical answer cut from a longer page, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Free 15-minute call', 'A short call with Mara, booked on Cal.com, where anything clinical is talked through with her.'],
    ['Hand-off', 'Passing the visitor to Mara, by the free call, the phone or their own email. The bot forwards nothing.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a new email to hello@rangept.co, or a visit cancelled inside 24 hours.'],
    ['Tool call', 'One action an agent asks for, like putting a label on an email or reading Mara’s openings.'],
    ['For Mara', 'The Gmail label for anything clinical, or anything Claude is unsure of. The email is left untouched for Mara to read.'],
    ['Admin', 'The Gmail label for a practical email, like a question about a superbill or a visit to move, which gets a drafted reply.'],
    ['Business associate agreement', 'A signed contract a clinic needs with each vendor that handles patient information, here Anthropic, Google and n8n’s host, before any real email is read.'],
    ['Notes system', 'Mara’s own clinic notes system, where everything clinical lives. No tool, flow or agent reads or writes it.'],
    ['Agent runs', 'The Google Sheets tab that logs each agent run: the time, the label, the tool calls and Mara’s yes, never an email’s words.'],
    ['Loop-back', 'A cable back to an earlier step: the agent tries again, or redoes a draft Mara sent back.'],
    ['Approval gate', 'A point where the run stops until Mara says yes.'],
    ['Claude', 'Anthropic’s AI model. It sorts, plans and drafts in these builds, and keeps nothing between runs.'],
    ['n8n', 'The workflow tool that runs each build: it listens for triggers, makes the tool calls and saves no executions.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of public passages the bot and Inbox triage search.'],
    ['Airtable', 'Where Range keeps its patients, visits and plans, with scheduling and billing fields only.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
