import {
  ArrowsClockwiseIcon, ArticleIcon, BooksIcon, BrowsersIcon, ChartBarIcon, ChatCircleIcon, CodeIcon, CoffeeIcon, CursorIcon, DatabaseIcon, FileJsIcon, FileTextIcon, FilmStripIcon, FlowArrowIcon, HashIcon, LightningIcon, ListChecksIcon, MagnifyingGlassIcon, MicrophoneIcon, PackageIcon, PaperPlaneTiltIcon, PhoneCallIcon, PuzzlePieceIcon, ScissorsIcon, ShieldCheckIcon, ShippingContainerIcon, SparkleIcon, TargetIcon, TerminalWindowIcon, TimerIcon, UsersThreeIcon, WaveformIcon,
} from '@phosphor-icons/react/ssr'
import type { AgentGroup, Chip, Doc, DocView } from './projects'

/**
 * The Projects sub-views' long copy, verbatim from Kraft Projects
 * Board.dc.html:336-509, 634-655. Kept apart from data/projects.ts so the
 * shell (⌘K) never pulls it into other pages.
 */
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
      { title: 'BrewedOps OS roster', icon: UsersThreeIcon, live: false, icons: [SparkleIcon, TerminalWindowIcon], desc: 'Ten specialists, one job each, from n8n audits to client deliverables. Every write is approval-gated.', meta: 'Claude Code subagents · Opus and Sonnet', tags: ['Claude', 'Claude Code'] },
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

export const DOCS: Record<DocView, Doc> = {
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
    stack: [{ name: 'n8n', icon: FlowArrowIcon }, { name: 'Claude Code', icon: TerminalWindowIcon }, { name: 'Node.js', icon: FileJsIcon }, { name: 'Telegram', icon: PaperPlaneTiltIcon }],
    sections: [
      {
        name: 'Triggers', blurb: 'Where work enters the graph.',
        cards: [
          { step: 'IN', icon: LightningIcon, title: 'Client-side events', desc: 'Form fills, stage changes, inbound messages and booked calls, caught by n8n webhooks.', meta: 'n8n webhooks' },
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

export const agentsView = {
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
}
