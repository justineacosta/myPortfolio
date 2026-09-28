import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsClockwiseIcon, ArticleIcon, BellSimpleIcon, BlueprintIcon, BooksIcon, BrainIcon, BrowsersIcon, ChartBarIcon,
  ChatCircleIcon, CheckCircleIcon, ClockCountdownIcon, CodeIcon, CoffeeIcon, CursorIcon, DatabaseIcon, EnvelopeSimpleIcon,
  EyeIcon, FileJsIcon, FileTextIcon, FilmStripIcon, FlowArrowIcon, GitBranchIcon, GraphIcon, HandshakeIcon, HashIcon,
  HourglassMediumIcon, LifebuoyIcon, LightningIcon, ListChecksIcon, MagnifyingGlassIcon, MicrophoneIcon, NoteIcon,
  PackageIcon, PaperPlaneTiltIcon, PhoneCallIcon, PuzzlePieceIcon, RobotIcon, ScissorsIcon, SealCheckIcon,
  ShieldCheckIcon, ShippingContainerIcon, SignOutIcon, SparkleIcon, TargetIcon, TerminalWindowIcon, TextboxIcon,
  TimerIcon, TrayIcon, TrendUpIcon, UserCircleIcon, UserFocusIcon, UsersThreeIcon, WaveformIcon, WrenchIcon,
} from '@phosphor-icons/react/ssr'

/**
 * The Projects board and its sub-views, verbatim from Kraft Projects
 * Board.dc.html. Screens Kraft left as empty image slots are PLACEHOLDERs.
 */

/** Every sub-view the board opens. Each id is also its URL hash (/projects#build-plan). */
export const PROJECT_VIEWS = ['reel', 'build-plan', 'support-desk', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const
export type ProjectView = (typeof PROJECT_VIEWS)[number]
export const DOC_VIEWS = ['build-plan', 'support-desk', 'agentic-framework', 'end-to-end'] as const
export type DocView = (typeof DOC_VIEWS)[number]

export type Chip = { name: string; icon: Icon }
export type DocCard = { step: string; icon: Icon; title: string; desc: string; meta: string }
export type Doc = { kicker: string; title: string; lede: string; stack: Chip[]; sections: { name: string; blurb: string; cards: DocCard[] }[] }
export type AgentCard = { title: string; icon: Icon; live: boolean; icons: Icon[]; desc: string; meta: string; tags: string[] }
export type AgentGroup = { name: string; blurb: string; cards: AgentCard[] }
export type Screenshot = { src: string; label: string }
export type Site = { name: string; file: string; shot: string }
type Writeup = { view: DocView; kicker: string; title: string; desc: string; icon: Icon; cue: string }

const REEL: Screenshot[] = [
  '01 - Support | New Ticket',
  'Workflows list',
  '02 - Post-Purchase Delivery',
  'Global workflow settings',
  'Execution logs',
].map((label) => ({ label, src: `PLACEHOLDER - GoHighLevel workflow screenshot: ${label} (16:10)` }))

const SITES: Site[] = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html'],
  ['Blade Studio', 'sample-brand-studio.html'],
  ['Below Ground', 'sample-utility-contractor.html'],
  ['Baptiste', 'sample-law-firm.html'],
  ['One Hour Therapy', 'sample-therapy-clinic.html'],
  ['Trusted Mover', 'sample-moving-company.html'],
  ['Payline', 'sample-fintech-funnel.html'],
  ['Solar Field', 'sample-solar-installer.html'],
].map(([name, file]) => ({ name, file, shot: `PLACEHOLDER - ${name} site screenshot (3:4)` }))

const GROUPS: AgentGroup[] = [
  {
    name: 'KapeAI', blurb: 'Answers how to do anything in the workspace, in English or Tagalog.',
    cards: [
      { title: 'KapeAI', icon: CoffeeIcon, live: true, icons: [SparkleIcon], desc: 'Answers how to do anything in the workspace, in English or Tagalog.', meta: 'Claude Haiku 4.5 · cached knowledge, no retrieval step', tags: ['Claude'] },
    ],
  },
  {
    name: 'AI Agents', blurb: 'They pick their own tools and finish the job. Not chat windows.',
    cards: [
      { title: 'KapeSEO', icon: ArticleIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'A keyword in, a 3,000-word article out. It grades itself before handing over.', meta: 'Claude Code skill + subagent · multi-tenant', tags: ['Claude', 'Claude Code'] },
      { title: 'KAPE Reel worker', icon: FilmStripIcon, live: false, icons: [FileJsIcon, WaveformIcon, MicrophoneIcon, PaperPlaneTiltIcon], desc: 'One Telegram message. It scripts, voices, captions, renders, and returns for approval.', meta: 'Node worker · ElevenLabs, Whisper, Remotion', tags: ['Node.js', 'ElevenLabs', 'OpenAI Whisper', 'Telegram'] },
      { title: 'BrewedOps OS roster', icon: UsersThreeIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'Ten specialists, one job each, from GHL audits to client deliverables. Every write is approval-gated.', meta: 'Claude Code subagents · Opus and Sonnet', tags: ['Claude', 'Claude Code'] },
    ],
  },
  {
    name: 'RAG Chatbots', blurb: 'They search real documents first, then answer from what they found.',
    cards: [
      { title: 'Ken AI Bot', icon: ChatCircleIcon, live: true, icons: [SparkleIcon, DatabaseIcon, HashIcon], desc: 'Searches a client team library and live sales figures. Refuses to guess.', meta: 'Claude Sonnet 5 · pgvector similarity search, 5 tools', tags: ['Claude', 'Postgres + pgvector', 'Slack'] },
      { title: 'Kape AI knowledge search', icon: MagnifyingGlassIcon, live: true, icons: [SparkleIcon, BooksIcon], desc: 'Pulls the five best passages from my 1,277-chunk knowledge base, then answers.', meta: 'SQLite FTS5 keyword ranking · Claude Haiku 4.5', tags: ['Claude', 'SQLite FTS5'] },
    ],
  },
  {
    name: 'Chatbots', blurb: 'Shipped inside BrewedOps.com. Each does one job well.',
    cards: [
      { title: 'Workflow Creator', icon: FlowArrowIcon, live: true, icons: [SparkleIcon, TrendUpIcon], desc: 'Describe a GoHighLevel workflow in plain English, get the diagram back.', meta: 'Claude Sonnet 4.6', tags: ['Claude', 'GoHighLevel'] },
      { title: 'Voice Call Tester', icon: PhoneCallIcon, live: true, icons: [SparkleIcon, WaveformIcon], desc: 'Hold a real spoken call with your voice agent before a customer does.', meta: 'Claude Sonnet 4.6 · ElevenLabs speech', tags: ['Claude', 'ElevenLabs'] },
      { title: 'Copy Website', icon: BrowsersIcon, live: true, icons: [SparkleIcon], desc: 'Point it at a page, get an editable rebuild streamed back.', meta: 'Claude Sonnet 4.6 · streaming', tags: ['Claude'] },
    ],
  },
  {
    name: 'Hermes', blurb: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.',
    cards: [
      { title: 'Hermes', icon: ChartBarIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon, ShippingContainerIcon], desc: 'My own agent on a server, reachable from Telegram. Remembers, reads my notes, runs jobs unasked.', meta: 'Nous hermes-agent, deployed and extended by me · Docker on my VPS', tags: ['Nous Hermes', 'Telegram', 'Docker'] },
      { title: 'Save-progress watcher', icon: TimerIcon, live: true, icons: [ShieldCheckIcon, PaperPlaneTiltIcon], desc: 'Pings me every fifteen minutes, but only when there is real work to save.', meta: 'Scheduled job · skips the model when nothing changed', tags: ['Nous Hermes', 'Telegram'] },
    ],
  },
]

const DOCS: Record<DocView, Doc> = {
  'build-plan': {
    kicker: 'GOHIGHLEVEL BUILD PLAN',
    title: 'The build plan',
    lede: 'A real automation plan, written out before a single workflow is clicked together.',
    stack: [{ name: 'GoHighLevel', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Notion', icon: NoteIcon }],
    sections: [
      {
        name: 'Before anything is clicked', blurb: 'The part most builds skip.',
        cards: [
          { step: '01', icon: TargetIcon, title: 'Name the outcome', desc: 'One sentence the client agrees with: what should be true after this runs.', meta: 'One outcome per workflow' },
          { step: '02', icon: LightningIcon, title: 'Pin the trigger', desc: 'Exactly what fires it, and every condition that must be false for it not to fire.', meta: 'Trigger + guard conditions' },
          { step: '03', icon: SignOutIcon, title: 'List the exits', desc: 'Every way a contact leaves the flow: converted, disqualified, replied, timed out.', meta: 'No silent dead ends' },
        ],
      },
      {
        name: 'The flow', blurb: 'Four node classes, in order. Everything else is a variation.',
        cards: [
          { step: 'TRIGGER', icon: LightningIcon, title: 'Entry', desc: 'Form, stage change, tag, inbound message, or a scheduled sweep of a smart list.', meta: 'Re-entry off by default' },
          { step: 'WAIT', icon: TimerIcon, title: 'Timing', desc: 'Waits are business hours aware. Nobody gets a 2am SMS because a form fired late.', meta: 'Window: 08:00–19:00 local' },
          { step: 'SCORE?', icon: GitBranchIcon, title: 'Branch', desc: 'One condition per branch, read top to bottom. If it needs three ANDs, it needs its own workflow.', meta: 'Max 3 branches per node' },
          { step: 'CONVERT', icon: CheckCircleIcon, title: 'Action', desc: 'Move the opportunity, send the branded email, notify the owner, write back the result.', meta: 'Every action logged' },
        ],
      },
      {
        name: 'What ships with it', blurb: 'The plan is not done when the workflow runs.',
        cards: [
          { step: '01', icon: TextboxIcon, title: 'Naming convention', desc: 'Numbered prefixes so the workflow list reads as an order of operations, not an inbox.', meta: '01 - Support | New Ticket' },
          { step: '02', icon: ListChecksIcon, title: 'Test matrix', desc: 'Each branch walked with a real test contact before handover, results pasted into the doc.', meta: 'Pass/fail per branch' },
          { step: '03', icon: HandshakeIcon, title: 'Handover doc', desc: 'One page: what it does, what breaks it, who to call. Written for the client, not for me.', meta: 'Delivered with every build' },
        ],
      },
    ],
  },
  'support-desk': {
    kicker: 'GOHIGHLEVEL BLUEPRINT',
    title: 'Support Ticketing System',
    lede: 'A full support desk inside GoHighLevel. One pipeline, five stages, four branded emails.',
    stack: [{ name: 'GoHighLevel', icon: LifebuoyIcon }, { name: 'Email builder', icon: EnvelopeSimpleIcon }, { name: 'Workflows', icon: FlowArrowIcon }],
    sections: [
      {
        name: 'The pipeline', blurb: 'Five stages, and a ticket can only move forward one at a time.',
        cards: [
          { step: '01', icon: TrayIcon, title: 'New', desc: 'Every inbound form, email, or chat lands here with a generated ticket ID.', meta: 'Auto-assigned on create' },
          { step: '02', icon: UserFocusIcon, title: 'Assigned', desc: 'Round-robin to the on-duty owner, with a first-response timer started.', meta: 'First response target: 2h' },
          { step: '03', icon: WrenchIcon, title: 'In progress', desc: 'Owner is working it. Client replies bump the ticket back to the top of the list.', meta: 'Reply detection on inbound' },
          { step: '04', icon: HourglassMediumIcon, title: 'Waiting on client', desc: 'Two nudges, then it auto-closes with a reopen link that puts it back in New.', meta: 'Nudge at 48h and 96h' },
          { step: '05', icon: CheckCircleIcon, title: 'Resolved', desc: 'Closing email goes out, a satisfaction question is attached, the timer stops.', meta: 'CSAT captured at close' },
        ],
      },
      {
        name: 'The four emails', blurb: 'Branded, plain-spoken, and each one tied to a stage change.',
        cards: [
          { step: 'E1', icon: EnvelopeSimpleIcon, title: 'Ticket received', desc: 'Confirms the ID, restates the problem in the client’s own words, sets the response window.', meta: 'Fires on: New' },
          { step: 'E2', icon: UserCircleIcon, title: 'Owner assigned', desc: 'Names a human and how to reach them. No "your ticket is important to us".', meta: 'Fires on: Assigned' },
          { step: 'E3', icon: BellSimpleIcon, title: 'We need you', desc: 'One clear question, one reply-to. Sent at most twice per ticket.', meta: 'Fires on: Waiting on client' },
          { step: 'E4', icon: SealCheckIcon, title: 'Resolved', desc: 'What was done, what changed, and the link that reopens it if it was not fixed.', meta: 'Fires on: Resolved' },
        ],
      },
      {
        name: 'What changed after', blurb: 'Measured against the four weeks before launch.',
        cards: [
          { step: 'RESULT', icon: ClockCountdownIcon, title: 'First response, not first reply', desc: 'The timer starts on create, so a ticket cannot sit unowned over a weekend.', meta: 'Same-day response became the floor' },
          { step: 'RESULT', icon: MagnifyingGlassIcon, title: 'Nothing gets lost', desc: 'Three inboxes collapsed into one pipeline with one ID per issue.', meta: 'One ticket, one thread' },
        ],
      },
    ],
  },
  'agentic-framework': {
    kicker: 'HOW I BUILD WITH AI',
    title: 'The Agentic Framework',
    lede: 'The tools, the rules, and the loop I use to ship apps with AI instead of chatting with it.',
    stack: [{ name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Codex', icon: CodeIcon }, { name: 'Cursor', icon: CursorIcon }],
    sections: [
      {
        name: 'The tools', blurb: 'Each one has a job. I do not use three where one will do.',
        cards: [
          { step: '01', icon: TerminalWindowIcon, title: 'Claude Code', desc: 'The builder. Long tasks, real files, subagents for anything that can run in parallel.', meta: 'Opus for planning, Sonnet for volume' },
          { step: '02', icon: CursorIcon, title: 'Cursor', desc: 'The editor. Where I read what was written and take over when precision beats speed.', meta: 'Human in the loop' },
          { step: '03', icon: CodeIcon, title: 'Codex', desc: 'The second opinion. A fresh model reviewing a diff catches what the author missed.', meta: 'Review pass, not a build pass' },
        ],
      },
      {
        name: 'The rules', blurb: 'Non-negotiable, and they are what keep the output usable.',
        cards: [
          { step: 'R1', icon: FileTextIcon, title: 'Write the spec first', desc: 'If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.', meta: 'Spec before prompt' },
          { step: 'R2', icon: ShieldCheckIcon, title: 'Every write is approval-gated', desc: 'Agents draft. Nothing reaches a client account, a repo, or a send button unreviewed.', meta: 'No autonomous writes' },
          { step: 'R3', icon: ScissorsIcon, title: 'Small units of work', desc: 'One task, one context. A fresh session beats a long one every time.', meta: 'Reset early, reset often' },
          { step: 'R4', icon: ListChecksIcon, title: 'The model grades itself', desc: 'Acceptance criteria go in with the task, and the output is checked against them before I look.', meta: 'Self-review built in' },
        ],
      },
      {
        name: 'The loop', blurb: 'Four steps, repeated until the criteria pass.',
        cards: [
          { step: '01', icon: TargetIcon, title: 'Frame', desc: 'Outcome, constraints, and the files that matter. Nothing else in context.', meta: 'Context is a budget' },
          { step: '02', icon: LightningIcon, title: 'Build', desc: 'Agent works. I do not interrupt mid-task to add requirements.', meta: 'One brief per run' },
          { step: '03', icon: MagnifyingGlassIcon, title: 'Check', desc: 'Run it, read it, and hand the diff to a second model before I trust it.', meta: 'Two-model review' },
          { step: '04', icon: ArrowsClockwiseIcon, title: 'Fold back', desc: 'Whatever went wrong becomes a rule, so the next run does not repeat it.', meta: 'The framework grows' },
        ],
      },
    ],
  },
  'end-to-end': {
    kicker: 'HOW I SHIP, END TO END',
    title: 'The End-to-End Workflow',
    lede: 'Every trigger, node, skill, and agent wired as one live graph — from a form fill to a delivered asset.',
    stack: [{ name: 'GoHighLevel', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Node.js', icon: FileJsIcon }, { name: 'Telegram', icon: PaperPlaneTiltIcon }],
    sections: [
      {
        name: 'Triggers', blurb: 'Where work enters the graph.',
        cards: [
          { step: 'IN', icon: LightningIcon, title: 'Client-side events', desc: 'Form fills, pipeline moves, inbound messages, and booked calls inside GoHighLevel.', meta: 'GoHighLevel workflows' },
          { step: 'IN', icon: PaperPlaneTiltIcon, title: 'A message to me', desc: 'One Telegram line is enough to start a build, a reel, or an audit.', meta: 'Hermes on my VPS' },
          { step: 'IN', icon: TimerIcon, title: 'Schedules', desc: 'Sweeps that check for work rather than waiting to be told there is some.', meta: 'Skips the model when nothing changed' },
        ],
      },
      {
        name: 'Nodes and skills', blurb: 'The middle of the graph, where the actual work happens.',
        cards: [
          { step: '01', icon: FlowArrowIcon, title: 'Automation nodes', desc: 'Waits, branches, and actions inside the client account. Deterministic, logged, reversible.', meta: 'No model in the hot path' },
          { step: '02', icon: PuzzlePieceIcon, title: 'Skills', desc: 'Reusable procedures an agent can load: audit a sub-account, draft an article, cut a reel.', meta: 'Versioned, multi-tenant' },
          { step: '03', icon: UsersThreeIcon, title: 'Agents', desc: 'Ten specialists with one job each. They pick their own tools and finish the task.', meta: 'Claude Code subagents' },
        ],
      },
      {
        name: 'Out', blurb: 'Nothing leaves the graph without a human yes.',
        cards: [
          { step: 'OUT', icon: ShieldCheckIcon, title: 'Approval gate', desc: 'The deliverable comes back for review before it reaches a client, a repo, or a send button.', meta: 'Approve or send back with a note' },
          { step: 'OUT', icon: PackageIcon, title: 'Delivery', desc: 'Article, reel, workflow, or report — handed over with the doc that explains it.', meta: 'Same handover doc every time' },
          { step: 'OUT', icon: ChartBarIcon, title: 'Write-back', desc: 'The result lands back on the contact record, so the next run knows what already happened.', meta: 'One source of truth' },
        ],
      },
    ],
  },
}

const WRITEUPS: Writeup[] = [
  { view: 'support-desk', kicker: 'GOHIGHLEVEL BLUEPRINT', title: 'Support Ticketing System', desc: 'A full support desk inside GoHighLevel. One pipeline, five stages, four branded emails.', icon: LifebuoyIcon, cue: 'READ THE WRITE-UP' },
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', icon: BrainIcon, cue: 'READ THE FRAMEWORK' },
  { view: 'end-to-end', kicker: 'HOW I SHIP, END TO END', title: 'The End-to-End Workflow', desc: 'Every trigger, node, skill and agent wired as one live graph.', icon: GraphIcon, cue: 'READ THE WORKFLOW' },
]

export const projects = {
  title: ['Real builds you', 'can open.'] as const,
  lede: 'Everything here shipped. Open a card to read the problem, the system behind it, and what changed after.',
  nudge: 'CLICK A CARD TO OPEN IT',
  close: 'Close',
  builtWith: 'BUILT WITH',
  live: 'LIVE',
  internal: 'INTERNAL',
  cards: {
    reel: {
      title: 'Automations', icon: FlowArrowIcon, cue: 'VIEW THE REEL', cta: 'OPEN THE REEL',
      body: 'Real screens from the GoHighLevel workflows I build.',
      peek: ['PLACEHOLDER - workflow screen behind (Automations card)', 'PLACEHOLDER - workflow screen in front (Automations card)'],
      peekHint: 'Workflow screen',
    },
    plan: {
      title: 'The build plan', icon: BlueprintIcon, cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'GOHIGHLEVEL BUILD PLAN', heading: 'The full automation blueprint.',
      steps: ['Trigger', 'Wait', 'Score?', 'Convert'],
    },
    sites: {
      title: 'Funnels and sites', icon: BrowsersIcon, cue: 'VIEW THE SITES', cta: 'SPIN THE CAROUSEL',
      body: 'Complete funnel builds and websites. Spin the reel.',
      fanHint: 'Site',
    },
    agents: {
      title: 'AI agents and RAG chatbots', icon: RobotIcon, cue: 'VIEW THE AGENTS', cta: 'SEE EVERY SYSTEM',
      body: 'Retrieval chatbots and task agents wired to real data.',
      chips: [
        { name: 'KapeSEO', icon: MagnifyingGlassIcon },
        { name: 'KAPE Reel worker', icon: FilmStripIcon },
        { name: 'Kape AI knowledge search', icon: BooksIcon },
        { name: 'KapeAI', icon: SparkleIcon },
        { name: 'Watcher', icon: EyeIcon },
      ] satisfies Chip[],
    },
  },
  writeups: WRITEUPS,
  reel: {
    label: 'Workflow screens', kicker: 'AUTOMATIONS · WORKFLOW REEL', hint: 'HOVER TO PAUSE',
    /** Kraft's default reel pace (the board's marqueeSeconds prop). */
    seconds: 20,
    slotHint: 'Drop a workflow screenshot · 16:10',
    shots: REEL,
  },
  sitesView: { label: 'Funnels and sites', kicker: 'FUNNELS AND SITES', slotHint: 'Drop a site screenshot', sites: SITES },
  agentsView: {
    title: 'AI agents and RAG chatbots',
    kicker: 'AI AGENTS AND RAG CHATBOTS',
    lede: 'I design, build, and run every system below. Most are in daily use.',
    builtWith: [
      { name: 'Claude Code', icon: TerminalWindowIcon },
      { name: 'Codex', icon: CodeIcon },
      { name: 'Cursor', icon: CursorIcon },
      { name: 'Hermes', icon: ShieldCheckIcon },
    ] satisfies Chip[],
    groups: GROUPS,
  },
  docs: DOCS,
}
