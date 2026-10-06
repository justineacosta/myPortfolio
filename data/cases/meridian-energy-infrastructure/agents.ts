/**
 * Meridian Energy Infrastructure’s AI agents and RAG chatbots case page (spec
 * 2026-10-05 per-site pages): the Website sales bot and the Lead research
 * agent the general AI agents page builds for Meridian Energy Infrastructure,
 * taken deeper, and a new Report note agent, which drafts the plain-language
 * note on each ME-03 report for the asset manager. The Lead research agent
 * reads ME-01’s score and never scores again. No bot or agent here tells
 * anyone to touch equipment, models a site’s savings or states a payment. It
 * tells the same story as Meridian Energy Infrastructure’s Automation and
 * Build plan pages. data/cases/index.ts registers it; `npm run cases` renders
 * it into public/cases/meridian-energy-infrastructure/ai-agents.html. Only
 * type imports, so Node can run it directly.
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
const BUSINESS = { name: 'Meridian Energy Infrastructure', trade: 'commercial solar' }

/** The electrical safety rule, as on Meridian Energy Infrastructure’s other pages. */
const SAFE = 'No bot or agent here tells anyone to touch, reset, switch or isolate any equipment, or gives an electrical step of any kind: the operations centre and the field technicians do that work, and the duty lead dispatches every technician by phone. Anything about a fault, a site’s equipment or an emergency gets one fixed answer: leave the equipment as it is, and if there is fire, smoke or damaged equipment, or anyone is hurt, keep clear and call 911, then your utility.'

/** The guarantee rule, as on Meridian Energy Infrastructure’s other pages. */
const MONEY = 'No bot or agent works out, proposes or promises a saving for a visitor’s own site, a production figure or a payment. The bot quotes only the ranges the site publishes, with the source. The Report note agent never states, works out or promises a shortfall payment or an amount: if the asset underperforms the model, Meridian Energy Infrastructure writes the cheque, and whether a payment is due, and how much, is the asset manager’s decision, made by hand.'

/** The bot’s fixed reply to an equipment word, in ME-02’s notice order: the emergency line first. The same words on the End-to-end page. */
const STOP = 'If you see fire, smoke or damaged equipment, or anyone is hurt, keep clear and call 911, then your utility. Don’t touch, reset or switch off any equipment. For anything else, call an energy advisor on (713) 555-0142.'

/** The person’s-yes rule, as on Meridian Energy Infrastructure’s other pages. */
const YES = 'An energy advisor approves every first email Claude drafts for a prospect’s inbox, and the asset manager approves every report note before the report reaches a client.'

const agents: Agents = {
  title: 'Meridian Energy Infrastructure · AI agents and RAG chatbots',
  description: 'Meridian Energy Infrastructure’s Website sales bot and its two agents, Lead research and Report note: two live diagrams, three sample builds and the guardrails that keep every equipment step with the operations centre, every site’s number with the survey and every payment with the asset manager.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AI AGENTS AND RAG CHATBOTS · MERIDIAN ENERGY',
  heading: 'A bot that quotes only the site’s own figures, and two agents that never write the cheque',
  lede: `Facility and finance teams ask Meridian Energy Infrastructure the same things before they request a site assessment: what solar could save, how big a site has to be, how the 25 years are structured. This is the bot that answers them in the site chat from the company’s own published figures, the agent that researches each strong-fit request for an energy advisor, the agent that drafts the note on each monthly production report, and the two patterns underneath all three. ${SAFE} ${MONEY} ${YES} The bot answers live, without a yes, from the site’s pages only and always with the source. Neither agent is a step in ME-01, ME-02 or ME-03: the Lead research agent reads ME-01’s score and runs beside it, and the Report note agent writes to the report’s row beside ME-03, so in the three flows Claude still only scores survey requests.`,
  sample: 'Sample builds for Meridian Energy Infrastructure, a fictional commercial solar and storage developer used across this portfolio, not a client project. Times and figures are illustrative.',
  heroTools: ['claude', 'n8n', 'supabase'],
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Two patterns, two rules', blurb: `Every build below is one of two patterns. None tells anyone to touch equipment, and none puts a number on a site or a payment. ${YES}` },
    { id: 'rag', chip: 'RAG chatbots', kicker: 'HOW THE WEBSITE SALES BOT WORKS', title: 'Search the site first, then answer', blurb: 'The site’s own pages and the figures they publish are prepared once. Every question then meets a fixed check for equipment words, and only then searches the pages before Claude says a word. Click any step.' },
    { id: 'agent', chip: 'Agents', kicker: 'HOW AN AGENT WORKS', title: 'Plan, use a tool, check, repeat', blurb: 'A strong-fit request or a drafted report starts it. Claude reads one thing at a time, a fixed check reads the draft, and a person says yes. Click any step.' },
    { id: 'builds', chip: 'The builds', kicker: 'THREE SAMPLE BUILDS', title: 'Three builds for Meridian Energy Infrastructure', blurb: 'One bot for visitors on the site, one agent for the energy advisors and one for the asset managers. Show any one’s route on its diagram.' },
    { id: 'guardrails', chip: 'Guardrails', kicker: 'GUARDRAILS', title: 'Four rules every build follows', blurb: 'They are what keep a solar developer’s bot and agents away from its equipment, its measured numbers and its cheques, which belong to people.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  glance: [
    { mark: '1', icon: 'Books', title: 'RAG chatbots', text: 'The Website sales bot searches the site’s own pages and published figures, then answers in the site chat with the source, and offers a site assessment. It never puts a number on a visitor’s own site.' },
    { mark: '2', icon: 'Robot', title: 'AI agents', text: 'Lead research reads ME-01’s score, researches the firm from public pages and drafts an energy advisor’s first email. Report note drafts the plain-language note on each monthly report. Neither touches a payment.' },
    { mark: '3', icon: 'UserCheck', title: 'A person’s yes', text: `${YES} The bot answers live from the site, so it needs no yes.` },
  ],
  diagrams: {
    rag: {
      id: 'rag',
      caption: 'The Website sales bot · 5 ways through',
      steps: [
        {
          id: 'docs', at: [0, 0], kind: 'start', label: 'The site’s pages', sub: 'Published figures', icon: 'Files', pinType: 'SOURCE',
          what: 'What the bot may answer from: Meridian Energy Infrastructure’s own public pages, and the figures they publish, as the site states them. No proposal, production model, contract, report or client’s figure is ever among them, and the site lists no prices, so the store holds none.',
          pins: [
            { id: 'docs', name: 'Solutions guide', icon: 'FileText', what: 'The site’s Why Solar, Solutions and Process pages, as written: the six solutions with their ranges, like Rooftop Solar from 250 kW to 12 MW; the six process stages and their weeks; what a site survey is, drone LIDAR or geotechnical borings, a structural review and a 25-year production model in PVsyst; and the contracted 48-hour response and the production guarantee, in the site’s own words.' },
            { id: 'sheets', name: 'Published figures', tool: 'google-sheets', what: 'A Google Sheet with one row per figure the site publishes, with its page and section: 18 – 27% below blended retail rate under a power purchase agreement, fixed or escalator-locked for 25 years, 4 – 19 hours islanded supply, $2.10 – $3.40 per sq ft of roof, which the site prints as long-term asset value, not a price, a minimum site of 80,000 sq ft or 250 kW, and the five markets, TX, LA, MS, AL and OK. A row is a published range to quote, never a number for a visitor’s site.' },
          ],
        },
        { id: 'chunk', at: [1, 0], kind: 'step', label: 'Split by section', sub: 'Figure by figure', icon: 'Scissors', what: 'Each page is cut section by section, and each sheet row becomes one passage, so a search returns just the part that matters, with the page and section it came from.' },
        { id: 'embed', at: [2, 0], kind: 'step', label: 'Embed', sub: 'Embeddings model', icon: 'Binary', what: 'An embeddings model turns each passage into a list of numbers that captures its meaning, so similar ideas sit close together.' },
        { id: 'store', at: [3, 0], kind: 'step', label: 'Store', sub: 'Supabase pgvector', icon: 'Database', tools: ['supabase'], what: 'The passages and their numbers are saved in Supabase with pgvector, each tagged with its page and section, or its sheet row. Nothing a visitor types is ever added. This runs again whenever a page or the sheet changes.' },
        {
          id: 'ask', at: [0, 1], kind: 'start', label: 'A visitor asks', sub: 'In the site chat', icon: 'ChatCircleText', pinType: 'CHANNEL',
          what: 'Someone asks in the chat on Meridian Energy Infrastructure’s site, and n8n starts the run. It is chat only: it sends no email, books nothing and calls no one.',
          pins: [
            { id: 'chat', name: 'Site chat', icon: 'ChatCircleDots', what: 'The chat window on every page of the site, started by n8n’s Chat Trigger. It remembers nothing between questions, and the workflow’s Save failed production executions and Save successful production executions are both set to Do not save, so no chat is kept. It never asks for a name, an email, a phone number or a utility bill.' },
          ],
        },
        { id: 'guard', at: [1, 1], kind: 'branch', label: 'Equipment words?', sub: 'A fixed n8n If', icon: 'ShieldWarning', tools: ['n8n'], what: 'Before any search and before Claude, an n8n If checks the question against a fixed list of words the operations centre keeps: fault, outage, tripped, breaker, reset, switch off, isolate, disconnect, spark, shock, smoke, fire, damaged, hurt, emergency and the like. A match goes straight to a fixed reply, so Claude never sees it. It is a word list, not a read for an emergency.' },
        { id: 'stop', at: [1, 2], kind: 'end', label: 'Keep clear, call 911', sub: 'Fixed reply', icon: 'HandPalm', what: `A fixed reply, never Claude’s, with the emergency line first, as in ME-02’s fault notice: “${STOP}” It forwards nothing and alerts no one.` },
        { id: 'qembed', at: [2, 1], kind: 'step', label: 'Embed the question', sub: 'Same model', icon: 'Binary', what: 'The question goes through the same embeddings model, so it can be compared with the stored passages. It is never stored.' },
        { id: 'search', at: [3, 1], kind: 'step', label: 'Search', sub: 'Top 5 passages', icon: 'MagnifyingGlass', tools: ['supabase'], what: 'A vector search in Supabase finds the five passages closest in meaning to the question.' },
        { id: 'answer', at: [4, 1], kind: 'step', label: 'Claude answers', sub: 'From the passages', icon: 'Sparkle', tools: ['claude'], what: 'Claude gets the question and those five passages, with four rules: answer only from them, naming the source; quote a figure only as the site publishes it, as a range, never worked out for the visitor’s own site; never promise a saving, a production figure, a price, a date or a payment; and never give an electrical or equipment step.' },
        { id: 'sure', at: [5, 1], kind: 'branch', label: 'On the page?', sub: 'No site’s own number', icon: 'Question', what: 'Claude’s own check, behind the fixed one: did a passage hold the answer, and does the answer stay with the figures the site publishes, never a number for the visitor’s own site? Yes only if both. Anything the pages do not say counts as no. The bot never guesses.' },
        { id: 'reply', at: [6, 1], kind: 'end', label: 'Reply with source', sub: 'Names the page', icon: 'ArrowBendUpLeft', what: 'The answer goes straight back in the chat with its source, like (Solutions guide), so the visitor can check it on the site. It answers live, from the site’s pages only, so it needs no one’s yes.' },
        { id: 'book', at: [7, 1], kind: 'end', label: 'Offer an assessment', sub: 'The site’s wizard', icon: 'CalendarCheck', tools: ['cal-com'], what: 'The bot asks “Book a site assessment?” and, on a yes, opens the site’s own wizard, the same path as Request a Site Assessment and ME-01: the four questions, then Book the site survey. ME-01 scores it and an energy advisor hears at once. Cal.com belongs to ME-01’s Book the survey step, which emails a strong site the link to book its drone survey window, for an advisor to confirm within one business day. The bot itself books nothing, opens no calendar, and never calls the assessment free.' },
        {
          id: 'handoff', at: [5, 2], kind: 'end', label: 'To an energy advisor', sub: 'Phone or email', icon: 'UserSwitch', pinType: 'HANDOFF',
          what: 'A fixed reply when no passage holds the answer, or when the answer would need a number for this site, which comes from the survey: “That isn’t something the site answers. Please talk to an energy advisor on (713) 555-0142, or at projects@meridianenergy.com. If you see fire, smoke or damaged equipment, or anyone is hurt, keep clear and call 911, then your utility.” It points the visitor to a person, as the site’s Talk to an Energy Advisor does, and forwards nothing and alerts no one.',
          pins: [
            { id: 'advisor', name: 'Talk to an advisor', icon: 'Phone', what: '(713) 555-0142, the direct line the site gives, answered by people. The bot gives the number and the site’s Talk to an Energy Advisor, and calls no one itself.' },
            { id: 'gmail', name: 'Email an advisor', tool: 'gmail', what: 'projects@meridianenergy.com, for anyone who would rather write. The visitor writes it themselves: the bot never emails, and a person replies.' },
            { id: 'site', name: 'A number for your site', icon: 'Calculator', what: 'What a visitor’s own site would save, produce or earn is the survey’s job, not the bot’s: the site promises “a measured number, not a sales estimate.” The bot offers the site assessment and an energy advisor instead of a guess.' },
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
        flow('guard', 'stop', 'equipment'),
        flow('qembed', 'search'),
        flow('search', 'answer'),
        flow('answer', 'sure'),
        flow('sure', 'reply', 'yes'),
        flow('sure', 'handoff', 'no'),
        flow('reply', 'book', 'wants one'),
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
      caption: 'An agent for one request or one report · 4 ways round',
      steps: [
        {
          id: 'trigger', at: [0, 0], kind: 'start', label: 'Strong fit or report', sub: 'Sheets or Airtable', icon: 'Lightning', pinType: 'TRIGGER',
          what: 'Two things start a run: a survey request ME-01 has logged as Strong fit, for the Lead research agent, or a monthly report ME-03 has drafted, for the Report note agent. n8n runs both, separately from the three flows. Neither is covered by ME-H02, which logs only the flows: a failed run leaves no draft, and a person writes the email or the note, as they would without the agent.',
          pins: [
            { id: 'form', name: 'A strong-fit request', tool: 'google-sheets', what: 'n8n’s Google Sheets Trigger watches the Requests tab of the Pipeline spreadsheet for a row added, every minute, and an If goes on only when Route is Strong fit: a score of 7 or more from ME-01. A request with no score is Not yet, so the agent never runs on it. It is a separate workflow: ME-01 runs the same without it.' },
            { id: 'reports', name: 'A report drafted', tool: 'airtable', what: 'Every 15 minutes, n8n’s Airtable Search lists the Reports rows with Status To check, Note draft empty and Note empty, with Always Output Data on, so a quarter-hour with nothing to note ends quietly. A report ME-03 drafts on the 10th, or one an asset manager adds by hand, is noted once. If a run fails before it writes anything, Note draft stays empty and the next quarter-hour tries again; the asset manager, already told by ME-03 that the report is waiting, sees the empty Note draft and writes the note by hand.' },
          ],
        },
        { id: 'plan', at: [1, 0], kind: 'step', label: 'Claude plans', sub: 'Picks the next step', icon: 'Brain', tools: ['claude'], what: 'Claude reads the goal and picks the next read. For Lead research that is the request’s row, then the firm’s own website. For Report note the plan is fixed: n8n hands Claude the report’s figures in one call, with nothing to choose. It keeps nothing from one run to the next.' },
        {
          id: 'tool', at: [2, 0], kind: 'step', label: 'Use a tool', sub: 'One read at a time', icon: 'Wrench', pinType: 'TOOL',
          what: 'n8n makes one tool call for Claude. Every call reads, except the one save to Supabase: nothing is scored, priced, booked or changed on a request or a report. An empty result reaches Claude as none found, never as an error.',
          pins: [
            { id: 'row', name: 'The Requests row', tool: 'google-sheets', what: 'The request as ME-01 logged it: the facility, the area, the monthly spend, the location and the structure, the organisation, and the score and Claude’s reason. The agent takes the score as it is and never scores again: the 8 in “Fit 8 of 10” is ME-01’s.' },
            { id: 'web', name: 'Public web pages', icon: 'Globe', what: 'The firm’s own website, at the domain of the email the requester gave, and its public pages: what the firm does and where it operates. Only the organisation, never the person: no social profile, nothing behind a login, and nothing about the requester beyond what they typed in the wizard. A free mail domain means no website, and the research says so.' },
            { id: 'supabase', name: 'Supabase', tool: 'supabase', what: 'The CRM, a Supabase table with one row per strong-fit request: the reference, the organisation, the name and email the requester gave, the score and reason as ME-01 gave them, the public research with a link to each source, and later the draft, who approved it and when it was sent.' },
            { id: 'report', name: 'The report’s row', tool: 'airtable', what: 'The report’s own fields: Asset, Month, Metered kWh, Modelled kWh, Difference and Below model, all lookups and formulas from Production months, measured at the revenue-grade meter and reconciled to utility settlement. Never the contract, the client’s email or Guarantee review.' },
            { id: 'byhand', name: 'Never a tool', icon: 'HandPalm', what: 'Not a tool call: no build scores a site again, models its savings, reads SCADA or a meter, sets a Guarantee review, works out a payment, dispatches a technician or tells anyone to touch equipment. People do all of it, by hand.' },
          ],
        },
        { id: 'check', at: [3, 0], kind: 'branch', label: 'Check the result', sub: 'Done yet?', icon: 'ListChecks', what: 'Claude looks at what came back and goes back to plan the next read until it has what it needs. Then it writes: a short research brief and the advisor’s first email, or the report’s note, from the report’s figures only.' },
        { id: 'needs', at: [4, 0], kind: 'branch', label: 'Passes the check?', sub: 'A fixed n8n Code', icon: 'ShieldCheck', what: 'A fixed n8n Code node reads every draft, behind Claude. A first email may hold no figure, saving, price, score or the word free; a note may hold no figure that is not on its report. Neither may name a payment, an amount, the cheque or a step on equipment. A draft that fails, or one Claude could not write, becomes no draft, for a person to write.' },
        { id: 'gate', at: [5, 0], kind: 'gate', label: 'A person’s yes', sub: 'Advisor or manager', icon: 'UserCheck', tools: ['telegram', 'airtable'], what: 'Two different gates. Lead research: the first email waits in the energy advisors’ Telegram group, with a button that opens an n8n form: Approve, or Change it with a note. Opening it records nothing; only the form’s submit does. n8n keeps the run waiting, with its data, for up to a day, and an If on the form’s answer sends only on Approve. At the one-day limit the advisors are told the email still needs them, and nothing sends. Report note: no n8n wait and no time limit. The note sits on the report’s row as Note draft until the asset manager edits it into Note and sets the report Approved in Airtable.' },
        {
          id: 'act', at: [6, 0], kind: 'end', label: 'Send or hand on', sub: 'Released by the yes', icon: 'PaperPlaneTilt', pinType: 'OUTPUT',
          what: 'An approved first email goes to the requester, word for word; one left unanswered for a day sends nothing. A note is written to the row first, and goes out inside ME-03’s report email. A draft that failed the check reaches no one: the advisors are told there is no draft, or Note draft says to write the note by hand.',
          pins: [
            { id: 'gmail', name: 'The first email', tool: 'gmail', what: 'Sends the approved email from projects@meridianenergy.com, signed with the name of the advisor who approved it, word for word as approved, with Append n8n Attribution off. Supabase records who approved it and when it went. A reply comes back to the advisors, and a person answers it.' },
            { id: 'note', name: 'Note draft', tool: 'airtable', what: 'Writes the draft to Note draft on the report’s row first, before any yes, or “No draft: write the note by hand.” The asset manager’s Approved is what releases it: they edit it into Note and set the report Approved, and ME-03’s send Zap emails it. The agent never writes Note or Status and never sends.' },
            { id: 'cheque', name: 'Any payment', icon: 'Scales', what: 'For a month below the model, the asset manager reviews it against the contract’s production guarantee and decides, by hand, whether a payment is due and how much. No agent states, works out or promises an amount, and the note never mentions one.' },
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
        { from: 'needs', to: 'act', kind: 'flow', label: 'no: no draft', under: true },
      ],
      routes: [
        { id: 'straight', nodes: [...RUN, 'needs', 'gate', 'act'] },
        { id: 'notdone', nodes: [...RUN, 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'changed', nodes: [...RUN, 'needs', 'gate', 'plan', 'tool', 'check', 'needs', 'gate', 'act'] },
        { id: 'nodraft', nodes: [...RUN, 'needs', 'act'] },
      ],
      legend: [
        CABLE,
        { id: 'signal', label: 'Live signal', what: 'A ball is one request or one report going through right now.' },
        { id: 'loop', label: 'Loop-back', what: 'A dashed cable back to an earlier step.' },
        BRANCH,
        { id: 'gate', label: 'Approval gate', what: 'The run stops here until an energy advisor or the asset manager says yes.' },
        PIN,
      ],
    },
  },
  builds: [
    {
      id: 'sales', kind: 'rag', name: 'Website sales bot', business: BUSINESS,
      line: `Answers Meridian Energy Infrastructure visitors’ cost and fit questions, then offers a site assessment. It answers from the site’s own pages and the figures they publish, always with the source, and quotes a figure only as the site publishes it: it never works out a saving or a production figure for a visitor’s own site, and never promises a payment. A fixed n8n check sends any question about a fault, equipment or an emergency to a fixed reply before Claude sees it: “${STOP}” The assessment it offers is the site’s own wizard, the path ME-01 runs, and it never calls it free. Anything the site does not say goes to an energy advisor.`,
      example: { ask: 'What would rooftop solar save on our distribution warehouse?', answer: 'Typically 18 – 27% below blended retail rate under a power purchase agreement (Solutions guide). Book a site assessment?' },
      tools: ['claude', 'supabase', 'n8n', 'cal-com'],
      routes: ['prepare', 'answered', 'handoff', 'stopped', 'booked'],
      pins: ['docs:docs', 'docs:sheets', 'ask:chat', 'handoff:advisor', 'handoff:gmail', 'handoff:site'],
      caption: 'Meridian Energy’s site chat → a fixed check for equipment words → search the solution pages and published figures → Claude answers with the source → offer a site assessment through the wizard, or an energy advisor',
    },
    {
      id: 'leads', kind: 'agent', name: 'Lead research agent', business: BUSINESS,
      line: 'Reads each firm asking Meridian Energy Infrastructure for an assessment, scores the fit, drafts a reply. The fit score is ME-01’s own: when ME-01 logs a request as Strong fit, a separate n8n workflow reads that row’s 1–10 score and reason, and never scores again. It reads only public pages about the firm, never about the person, and saves that research, with its sources, in Supabase, the CRM, holding nothing about the requester beyond what they gave in the wizard. Then Claude drafts the energy advisor’s first personal email: no figure for the site, no saving, no payment, and never the score or the word free. An energy advisor approves it in Telegram before it sends. ME-01’s own emails stay fixed templates, so in ME-01 Claude only scores.',
      example: { ask: 'New assessment request from a 300,000 sq ft cold-storage site.', answer: 'Fit 8 of 10, saved to the CRM, first email drafted for your yes. The 8 is ME-01’s score, read from the Requests row; the yes is an energy advisor’s, in Telegram.' },
      tools: ['claude', 'n8n', 'supabase', 'telegram'],
      routes: ['straight', 'notdone', 'changed', 'nodraft'],
      pins: ['trigger:form', 'tool:row', 'tool:web', 'tool:supabase', 'tool:byhand', 'act:gmail'],
      caption: 'Meridian Energy assessment request → ME-01’s score from the Requests row → Claude reads the firm’s public site → research saved in Supabase → an advisor’s yes on the first email → send',
    },
    {
      id: 'note', kind: 'agent', name: 'Report note agent', business: BUSINESS,
      line: 'Drafts the plain-language note on each monthly production report ME-03 drafts, for the asset manager to approve. It writes only from the report’s own figures, generation measured at the meter and reconciled to utility settlement, against the model, and adds no cause it was not given. It never states, works out or promises a shortfall payment or an amount: any payment is the asset manager’s decision, made by hand. A fixed check turns a draft with a figure not on the report, or a word about money or equipment, into no draft, and a report whose Note draft is still empty when the asset manager opens it is one they write by hand. It writes Note draft on the report’s row and never sends: the asset manager edits it into Note and sets Approved, and ME-03 sends the report.',
      example: { ask: 'ME-03 drafts an asset’s May report: 360,000 kWh metered against 400,000 modelled.', answer: 'In Note draft: “Generation in May was 360,000 kWh, measured at the meter and reconciled to utility settlement, 10% below the model’s 400,000 kWh.” No cause, no payment, no amount. The asset manager edits it and approves.' },
      tools: ['claude', 'n8n', 'airtable'],
      routes: ['straight', 'nodraft'],
      pins: ['trigger:reports', 'tool:report', 'tool:byhand', 'act:note', 'act:cheque'],
      caption: 'Meridian Energy report drafted by ME-03 → Claude writes the note from the report’s figures → a fixed check → Note draft on the row → the asset manager’s yes → ME-03 sends it',
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
    { mark: 'G1', icon: 'ShieldWarning', title: 'Never an equipment step', text: `${SAFE} The bot sends any question with an equipment word to that fixed reply before Claude sees it, and the fixed check on every agent draft turns one that names a step on equipment into no draft. No build reads SCADA, a meter or a fault, or dispatches anyone.` },
    { mark: 'G2', icon: 'Scales', title: 'Published ranges, never a promise', text: `${MONEY} The bot’s example answer is the site’s own range, with its source, and a number for a visitor’s own site comes from the survey: “a measured number, not a sales estimate.” Reports has no field for an amount, and the note agent never reads Guarantee review.` },
    { mark: 'G3', icon: 'UserCheck', title: 'A person says yes', text: `${YES} The first email waits in the energy advisors’ Telegram group, and only the form’s submit records a yes. The note waits on the report’s row, and only the asset manager can set a report Approved. The bot answers live from the site’s pages, so it needs no yes: it is chat only, sends no email and books nothing, and a question the site does not answer goes to an energy advisor.` },
    { mark: 'G4', icon: 'LockKey', title: 'The firm’s public facts only', text: 'The Lead research agent reads only public pages about the organisation, never about the person, and keeps nothing about the requester beyond the name, organisation and email they gave in the wizard. The agent never scores a site: it reads ME-01’s score from the row. The bot keeps no chat, and asks for no name, email or bill.' },
  ],
  glossary: [
    ['RAG', 'Retrieval-augmented generation: search the site’s own pages first, then answer from what was found.'],
    ['Solutions guide', 'The site’s Why Solar, Solutions and Process pages, as the bot cites them.'],
    ['Published figures', 'The ranges the site publishes, like 18 – 27% below blended retail rate, one row each in a Google Sheet.'],
    ['Passage', 'One section of a page or one sheet row, as the search returns it and the answer cites it.'],
    ['Embedding', 'A list of numbers that captures what a piece of text means, so similar ideas sit close together.'],
    ['Vector search', 'Finding the stored passages whose embeddings sit closest to the question’s.'],
    ['pgvector', 'A Postgres add-on that stores embeddings and runs vector search, here inside Supabase.'],
    ['Equipment words', 'The fixed list the operations centre keeps, like breaker, reset or smoke. A question with one gets the fixed reply, never Claude.'],
    ['Hand-off', 'Pointing the visitor to an energy advisor, by phone or by email. The bot forwards nothing.'],
    ['Site assessment', 'The site survey the wizard books: drone LIDAR or borings, a structural review and a 25-year production model.'],
    ['Agent', 'An AI that takes a goal, picks its own tools and works step by step until the job is done.'],
    ['Trigger', 'The event that starts a run: a strong-fit request logged, or a report drafted.'],
    ['Tool call', 'One action an agent asks for, like reading the firm’s website or saving the research in Supabase.'],
    ['Fit score', 'ME-01’s 1–10 score for a site, with one line on why. The Lead research agent reads it and never scores again.'],
    ['CRM', 'The Supabase table of strong-fit requests, their research and their first emails.'],
    ['Note draft', 'The field on a report’s row where the Report note agent writes. The asset manager edits it into Note.'],
    ['Fixed check', 'An n8n Code node that reads every draft for figures, money words and equipment words, behind Claude.'],
    ['Loop-back', 'A cable back to an earlier step: the agent reads again, or redrafts an email the advisor sent back.'],
    ['Approval gate', `A point where the run stops until a person says yes. ${YES}`],
    ['Production guarantee', 'The site’s promise: if the asset underperforms the model, Meridian Energy Infrastructure writes the cheque. The asset manager decides any payment.'],
    ['Energy advisor', 'The person who answers survey requests, confirms survey windows and approves every first email.'],
    ['Asset manager', 'The person accountable for an operating asset, who approves its monthly report and decides any payment.'],
    ['Claude', 'Anthropic’s AI model. It answers in the bot, researches and drafts in Lead research, and drafts the report note.'],
    ['n8n', 'The workflow tool that runs the bot and both agents: it listens for triggers and makes the tool calls.'],
    ['Supabase', 'A hosted Postgres database: the bot’s store of passages, and the CRM the Lead research agent saves to.'],
    ['Cal.com', 'Where a strong site books its drone survey window through ME-01, for an energy advisor to confirm.'],
    ['Airtable', 'Where Meridian Energy Infrastructure keeps its assets, faults, tickets, production months and reports.'],
    ['Telegram', 'The chat app where the energy advisors approve first emails.'],
  ],
  footer: { note: 'Sample builds, drawn the way I build them. Meridian Energy Infrastructure is fictional, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default agents
