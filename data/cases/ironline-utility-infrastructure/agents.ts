/**
 * Ironline Utility Infrastructure’s AI agents and RAG chatbots case page (spec
 * 2026-10-05 per-site pages): the Team knowledge bot from the general AI
 * agents page, taken deeper, and two agents drawn on the general page’s two
 * diagrams: Bid triage, which summarises a bid request for the superintendent
 * reviewing it, and Near-miss bulletin, the full build behind IL-02’s Draft
 * the bulletin step. Ironline is a safety trade: no bot or agent here gives a
 * switching, clearance or energized-work instruction. It tells the same story
 * as Ironline’s Automation and Build plan pages. data/cases/index.ts registers
 * it; `npm run cases` renders it into
 * public/cases/ironline-utility-infrastructure/ai-agents.html. Only type
 * imports, so Node can run it directly.
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
const BUSINESS = { name: 'Ironline Utility Infrastructure', trade: 'utility contractor' }

/** The safety rule, as on Ironline’s other pages. */
const SAFE = 'Ironline is a safety trade, so no bot or agent here gives a switching, clearance, outage or energized-work instruction, and none overrides the job brief: those come from the job brief, the superintendent and system operations. The bot quotes the issued SOP with its section and never writes a step of its own, and the job brief comes first. Anything about a live line or an outage gets one answer: stop and call your superintendent. Emergencies go to the 24/7 line, (614) 555-0199, answered by people, after 911 if anyone is hurt or there is fire.'

/** The person’s-yes rule, as on Ironline’s other pages. */
const YES = 'The safety director approves anything Claude drafts for company-wide distribution, within 48 hours of the report being filed.'

const agents: Agents = {
  title: 'Ironline Utility Infrastructure · AI agents and RAG chatbots',
  description: 'Ironline Utility Infrastructure’s Team knowledge bot for its crews and its two agents, Bid triage and Near-miss bulletin: two live diagrams, three sample builds and the guardrails that keep every switching, clearance and energized-work step with the job brief and the superintendent.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · IRONLINE',
  heading: 'A field bot for the crews, and two agents that never tell anyone how to switch',
  lede: `Ironline’s crews build transmission, distribution, substation and underground work across seven states, and every task starts with a documented job brief. This is the bot crews ask in Telegram, the agent that summarises a bid request for the superintendent reviewing it, the agent behind IL-02’s near-miss bulletin, and the two patterns underneath all three. ${SAFE} ${YES} The bot answers crews live, without a yes, from the field SOPs and the equipment sheet only, always with the source. The Bid triage agent is not a step in IL-01: it runs on its own beside it and writes for one superintendent, so in Ironline’s three flows Claude still drafts only the near-miss bulletin.`,
  sample: 'Sample builds for Ironline Utility Infrastructure, a fictional Ohio utility contractor used across this portfolio, not a client project. Figures are illustrative.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, one safety rule', blurb: `Every build below is one of two patterns, and none gives a switching, clearance or energized-work step. ${YES}` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE TEAM KNOWLEDGE BOT WORKS', title: 'Search the SOPs first, then answer', blurb: 'The field SOPs and the equipment sheet are prepared once, with the switching, clearance and energized-work sections left out. Every question then meets a fixed check for live-work words, and only then searches the SOPs before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'An assigned bid request or a filed near-miss starts it. Claude works from what the run hands it, one read at a time, until the job is done. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Ironline', blurb: 'One bot for the crews, one agent for the superintendents and one for the safety director. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what keep a utility contractor’s bot and agents out of the switching, clearance and energized-work steps that belong to people.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Team knowledge bot searches the field SOPs and the equipment sheet first, then answers a crew member in Telegram with the section or the row, or says to stop and call. It never gives a switching, clearance or energized-work step.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Bid triage summarises what a bid email says for the superintendent assigned to it. Near-miss bulletin drafts IL-02’s company bulletin. Neither prices a bid, plans an outage or sends anything outside Ironline.' },
    { mark: '3', icon: 'UserCheck', title: 'The safety director’s yes', text: `${YES} The bid summary goes to one superintendent, inside Ironline, and the bot answers crews live from the SOPs, so neither needs a yes.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Team knowledge bot · 4 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'SOPs and kit sheet', sub: 'Issued by the office', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: Ironline’s field SOPs, as the safety director issues them, and the equipment sheet. Nothing outside them counts. No job brief, switching order or clearance is ever among them.',
          pins: [
            { id: 'sops', name: 'Field SOPs', icon: 'FilePdf', what: 'Each field SOP as a PDF, with its section numbers and the forms it names, like Field SOP §3.1 and form LM-2 for a missing locate mark. The safety director uploads a SOP whenever one is reissued. The sections on switching, clearance and energized work are left out of the store, so the bot can never quote one.' },
            { id: 'sheets', name: 'Equipment sheet', tool: 'google-sheets', what: 'The yards’ Google Sheet of Ironline’s owned fleet, one row per unit: digger derricks, buckets from 55′ to 100′, puller/tensioners, HDD rigs and track hoes, each with its hub yard, its next inspection and the SOP section for its pre-use check. Re-read each night. A row is a fact to quote, never a say-so that a unit is fit to use.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split by section', sub: 'Live-work parts out', icon: 'Scissors', what: 'Each SOP is cut section by section, keeping its number and the forms it names, and each sheet row becomes one passage. Any section on switching, clearance or energized work is dropped before it is stored.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, each tagged with its SOP and section, or its sheet row. This runs again whenever a SOP is reissued, and each night for the equipment sheet.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A crew member asks', sub: 'In Telegram', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'A crew member messages Ironline’s Telegram bot from the field, and n8n starts the run. It is chat only: it sends no email, reaches no owner and calls no one.',
          pins: [
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'A direct chat with Ironline’s bot, the same bot that posts the near-miss bulletins. n8n checks the person is a member of the Ironline crews channel before it answers, so only Ironline’s people get an answer. It remembers nothing between questions.' },
          ],
        },
        { id: 'guard', at: [1, 1], kind: 'branch', label: 'Live-work words?', sub: 'A fixed n8n If', icon: 'ShieldWarning', tools: ['n8n'], what: 'Before any search and before Claude, an n8n If checks the question against a fixed list of words the safety director keeps: live line, energized, outage, switching, clearance and the like. A match goes straight to a fixed stop-and-call reply, so Claude never sees it. The rule does not depend on the model. It is a word list, not a read for an emergency: emergencies always go to the 24/7 line.' },
        { id: 'stop', at: [1, 2], kind: 'end', label: 'Stop, call the super', sub: 'Fixed reply', icon: 'HandPalm', what: 'A fixed reply, never Claude’s: “Stop. Live work comes only from your job brief and your superintendent. Call your superintendent. If anyone is hurt or there is fire, call 911, then (614) 555-0199.” It forwards nothing and alerts no one.' },
        { id: 'qembed', at: [2, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five SOP sections or sheet rows closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with three rules: answer only from them, with the SOP and section or the sheet row; never invent a figure, date or price; and never give a switching, clearance or energized-work step, or anything that overrides the job brief.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'On the page?', sub: 'And not live work', icon: 'Question', what: 'Claude’s own check, behind the fixed one: did a passage hold the answer, and is the question clear of a live line, an outage, switching, clearance and energized work? Yes only if both. Anything the SOPs do not say, or anything about live work, counts as no.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'SOP section or row', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in Telegram with its source, like (Field SOP §3.1), so the crew member can open the SOP and check. It answers live, from the SOPs only, so it needs no one’s yes. The job brief still comes first.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'Stop and call', sub: 'Your superintendent', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'The bot says the answer isn’t in the SOPs, or that the question is about live work, and tells the crew member to stop and call their superintendent. The reply is fixed text, and every Stop-and-call reply ends: “If anyone is hurt or there is fire, call 911, then (614) 555-0199.” It forwards nothing, calls no one and alerts no one.',
          pins: [
            { id: 'super', name: 'The superintendent', icon: 'UserCircle', what: 'Anything about a live line, an outage, switching, clearance or energized work gets one answer: stop and call your superintendent. Those steps come from the job brief, the superintendent and system operations, never from the bot.' },
            { id: 'emergency', name: 'The 24/7 line', icon: 'Phone', what: 'Every fixed reply ends: “If anyone is hurt or there is fire, call 911, then (614) 555-0199.” (614) 555-0199 is the 24/7 line, answered 24/7/365 by people. The bot gives the numbers and nothing else: it reads no message for an emergency, dispatches no one and promises no crew or time.' },
            { id: 'office', name: 'Not in the SOPs', icon: 'Question', what: 'A question the SOPs and the sheet do not answer gets “That isn’t in the SOPs. Call your superintendent or the office. If anyone is hurt or there is fire, call 911, then (614) 555-0199.” The bot never guesses.' },
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
        flow('guard', 'stop', 'live work'),
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
        { id: 'stopped', nodes: ['ask', 'guard', 'stop'] },
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
      caption: 'An agent for one bid or one near-miss · 2 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Assigned or filed', sub: 'Airtable', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a new bid request getting its superintendent, for the Bid triage agent, or a near-miss report filed, for the Near-miss bulletin agent.',
          pins: [
            { id: 'assigned', name: 'A bid assigned', tool: 'airtable', what: 'n8n’s Airtable Trigger watches Bid requests on Superintendent changed, a Last modified time field on Superintendent, every minute. It starts once when IL-01 assigns a new request by the rota, or the bid desk assigns one by hand, and again only if the bid desk reassigns it. It is a separate workflow: IL-01 runs the same without it.' },
            { id: 'filed', name: 'A near-miss filed', tool: 'make', what: 'IL-02 · Near-miss review · draft, Make’s Airtable Watch Records on Near-miss reports every 15 minutes. It is IL-02’s own trigger: the Near-miss bulletin agent is that scenario’s Draft the bulletin step, built in full, not a second drafter.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal and picks the next read. For Bid triage that is the request, then the sender’s earlier requests. For Near-miss bulletin the plan is fixed: Make hands Claude the report’s fields in one call, with nothing to choose.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One read at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'Every call reads, and nothing is changed, priced or booked. An empty result reaches Claude as none found, never as an error. Neither agent searches the SOPs, opens a drawing or reaches a utility’s systems.',
          pins: [
            { id: 'request', name: 'The request', tool: 'airtable', what: 'The Bid requests row: the subject, the sender, the email as written, any follow-ups, Received at, Respond by, the link to the thread in bids@, and the superintendent’s Telegram chat ID, from Team. The row holds no attachments, and the drawings stay in bids@: the agent sees only what the email’s words say about them, never opens them, and never says what they show.' },
            { id: 'earlier', name: 'Earlier requests', tool: 'airtable', what: 'A search of Bid requests by the sender’s email for their earlier requests and each one’s Status. An empty result reaches Claude as none on record, and the summary says so.' },
            { id: 'report', name: 'The report', tool: 'airtable', what: 'What happened, What stopped it, The lesson, the discipline and the state, which Make maps into the one Anthropic call. Never Filed by or the job number: Claude never sees who filed the report.' },
            { id: 'byhand', name: 'Never a tool', icon: 'HandPalm', what: 'Not a tool call: no build reads a job brief, a switching order or a clearance, and none reaches a utility’s system operations, SCADA, outage requests or dispatch. The Near-miss bulletin agent has no SOP search at all. People do all of it, by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back and goes back to plan the next read until it has what it needs. For the bulletin, Make’s Parse JSON checks the answer: one it cannot read becomes an empty draft with Touches procedure Yes, for the safety director to write.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Company-wide?', sub: 'Or one super only', icon: 'ShieldCheck', what: 'Is the draft meant for the whole company? Then it waits for the safety director. A bid summary goes to the assigned superintendent only, inside Ironline, with no gate.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'The director’s yes', sub: 'Approved in Airtable', icon: 'UserCheck', tools: ['airtable'], what: 'The draft and Touches procedure are written on the report’s row, Awaiting approval, and the safety director hears on Telegram. They take out any name, rewrite what they choose, write any lesson left empty and set Approved. Only they can; the agent never does.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Post or send', sub: 'Internal or approved', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'A bid summary goes to the superintendent’s own Telegram chat. An approved bulletin goes company-wide through IL-02’s send scenario, a fixed template. Neither agent sends anything outside Ironline.',
          pins: [
            { id: 'telegram', name: 'Telegram', tool: 'telegram', what: 'Posts the bid summary in the assigned superintendent’s own chat, with a link to the thread in bids@ and a fixed last line: storm or emergency, the sender has been told to call (614) 555-0199. Never to the sender.' },
            { id: 'send', name: 'IL-02 sends it', icon: 'Megaphone', what: 'After Approved, IL-02 · Near-miss review · send emails the bulletin company-wide and posts it to the crews’ channel, as the safety director approved it, ending with the fixed line on switching, clearance and energized work. The agent itself never sends.' },
            { id: 'super', name: 'The super, by hand', icon: 'UserCircle', what: 'The superintendent reads the thread and the drawings in bids@, prices the bid, writes the response within one business day and plans any outage with system operations. No build does any of it.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no, one super only', under: true },
      ],
      routes: [
        { id: 'bulletin', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'triage', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one bid or one near-miss going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until the safety director says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'team', kind: 'rag', name: 'Team knowledge bot', business: BUSINESS,
      line: 'Ironline Utility Infrastructure’s crews ask in Telegram; it answers from the field SOPs and equipment sheet. Every answer carries its source, the SOP section or the sheet row, and it never invents a figure or a date. It never gives a switching, clearance or energized-work step and never overrides the job brief: a fixed n8n check sends any question with a live-work word to stop and call the superintendent before Claude sees it, and every such reply ends with (614) 555-0199.',
      example: { ask: 'A locate mark is missing at the dig site. What do I do?', answer: 'Stop, fill in form LM-2 and call the office before you dig. (Field SOP §3.1)' },
      tools: ['claude', 'supabase', 'n8n', 'telegram', 'google-sheets'],
      routes: ['prepare', 'answered', 'handoff', 'stopped'],
      pins: ['docs:sops', 'docs:sheets', 'ask:telegram', 'handoff:super', 'handoff:emergency', 'handoff:office'],
      caption: 'Ironline crew in Telegram → search the field SOPs and kit sheet → Claude answers → reply with the source, or stop and call',
    },
    {
      id: 'triage', kind: 'agent', name: 'Bid triage agent', business: BUSINESS,
      line: 'When a new bid request gets its superintendent, it reads the request as logged and writes that superintendent a short summary of what the email says: the scope, the place and the dates as the sender wrote them, what the email says about drawings, and any earlier requests from the sender, with a link to the thread in bids@. It is internal and separate from IL-01. It never opens the drawings, drafts a reply, prices a bid, or comments on an outage or a clearance. If a run fails, only the summary is lost: on the rota path IL-01’s Notify superintendent has already sent the thread link; after a bid-desk assignment the bid desk has told them, and the row links the thread. IL-H02 does not cover this agent.',
      example: { ask: 'IL-01 assigns a new request: “138 kV rebuild, about 12 miles, bids due in three weeks. Drawings attached.”', answer: 'A summary in the superintendent’s own Telegram: a 138 kV rebuild of about 12 miles, bids due in three weeks; the email says drawings are attached, so open the thread in bids@ for them; no earlier requests. A link to the thread, and no reply drafted.' },
      tools: ['claude', 'n8n', 'airtable', 'telegram'],
      routes: ['triage'],
      pins: ['trigger:assigned', 'tool:request', 'tool:earlier', 'tool:byhand', 'act:telegram', 'act:super'],
      caption: 'A bid request assigned in Airtable → Claude reads the request and the sender’s history → a summary for one superintendent → posted in Telegram',
    },
    {
      id: 'bulletin', kind: 'agent', name: 'Near-miss bulletin agent', business: BUSINESS,
      line: 'The full build behind IL-02’s Draft the bulletin step, not a second drafter. Make hands Claude What happened, What stopped it, The lesson, the discipline and the state in one call, and Claude returns a headline, what happened and the lesson, in roles, never names, with no fault. When the report touches switching, clearance, an outage or energized work, it sets Touches procedure and leaves that lesson for the safety director. It writes to the report’s row and never sends.',
      example: { ask: 'A near-miss filed, Distribution, Ohio: a tag line slipped while setting a crossarm, and the spotter called stop.', answer: 'A draft on the report’s row: a headline, what happened with a lineman and a spotter, and the crew’s lesson; Touches procedure No; Awaiting approval, and the safety director told on Telegram.' },
      tools: ['claude', 'make', 'airtable', 'telegram'],
      routes: ['bulletin'],
      pins: ['trigger:filed', 'tool:report', 'tool:byhand', 'act:send'],
      caption: 'Ironline near-miss filed → Make hands Claude the report → a draft on the row → the safety director’s yes → IL-02 sends it',
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
    { mark: 'G1', icon: 'ShieldWarning', title: 'Never a switching, clearance or live-work step', text: `${SAFE} The store leaves those SOP sections out, the bot answers anything about them with stop and call, and every bulletin ends with the same fixed line: switching, clearance and energized-work steps come only from your job brief, your superintendent and system operations.` },
    { mark: 'G2', icon: 'Quotes', title: 'Answers only from the SOPs, with the source', text: 'The bot answers from the passages it found and names the SOP and section, or the sheet row. It never invents a figure, date or price, and never says a unit is fit to use. It is chat only: it sends no email, calls no one, and a question it cannot answer goes to a person, the superintendent or the office.' },
    { mark: 'G3', icon: 'UserCheck', title: 'The safety director says yes', text: `${YES} The Near-miss bulletin agent writes to the report’s row and never sends; IL-02 sends only after Approved, which only the safety director can set. The bid summary goes to one superintendent inside Ironline, and the bot answers crews live from the SOPs, so neither needs a yes. Nothing Claude writes reaches an owner’s inbox.` },
    { mark: 'G4', icon: 'Lightning', title: 'Outages and storms stay with people', text: 'No build reaches a utility’s system operations, SCADA, an outage request or dispatch radio, and none is claimed. Storm and emergency calls go to (614) 555-0199, answered by people, who decide what rolls; crews roll within six hours of a call by a person’s decision. No bot or agent reads a message for an emergency or dispatches a crew. The bot’s live-work check is a fixed word list that routes a question to the stop reply; it is not a read for an emergency, and emergencies always go to the 24/7 line.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search Ironline’s own SOPs first, then answer from what was found.'],
    ['Field SOP', 'One of Ironline’s standard operating procedures for crews, with numbered sections and the forms they name.'],
    ['Equipment sheet', 'The Google Sheet of Ironline’s owned fleet, one row per unit, with its yard and its next inspection.'],
    ['Passage', 'One SOP section or one sheet row, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Hand-off', 'Passing a question to a person, here the superintendent or the office. The bot forwards nothing.'],
    ['Job brief', 'The documented brief every Ironline task starts with. Switching, clearance and energized-work steps come from it, never from a bot.'],
    ['Switching', 'Opening and closing a line’s devices to take it out of service or put it back, done with system operations. No bot or agent gives a step of it.'],
    ['Clearance', 'The confirmed permission to work on a line taken out of service. People request and confirm it, by hand.'],
    ['Energized work', 'Work on a line that is still live, under its own procedure and a second qualified observer. Never a bot’s answer.'],
    ['System operations', 'The utility’s control room, which walks every outage and switching sequence with the superintendent.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a bid request assigned, or a near-miss filed.'],
    ['Tool call', 'One action an agent asks for, like reading a bid request’s row in Airtable.'],
    ['Loop-back', 'A cable back to an earlier step: the agent reads again until it has what it needs.'],
    ['Approval gate', `A point where the run stops until the safety director says yes. ${YES}`],
    ['Touches procedure', 'The flag Claude sets when a near-miss touches switching, clearance, an outage or energized work. The safety director then writes the lesson.'],
    ['Superintendent', 'The person who runs a job and reviews a bid, never a salesperson. They write every response and approve every closeout.'],
    ['Safety director', 'The person who approves every near-miss bulletin and issues the field SOPs.'],
    ['Claude', 'Anthropic’s AI model. It answers in the bot, summarises a bid in Bid triage, and drafts the near-miss bulletin.'],
    ['n8n', 'The workflow tool that runs the bot and the Bid triage agent, and IL-01.'],
    ['Make', 'The workflow tool IL-02 runs on, with the Near-miss bulletin agent as its Draft the bulletin step.'],
    ['Supabase', 'A hosted Postgres database, used here as the store of passages from the SOPs and the equipment sheet.'],
    ['Airtable', 'Where Ironline keeps its bid requests, its rota, its team, its near-miss reports and its projects.'],
    ['Telegram', 'The chat app crews ask the bot in, superintendents read bid summaries in, and the safety director hears of each draft in.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Ironline Utility Infrastructure is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
