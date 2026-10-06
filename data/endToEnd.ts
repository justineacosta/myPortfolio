/**
 * The End-to-End Workflow page's content (spec 2026-09-30-end-to-end-workflow):
 * how Justine ships, drawn as one graph of eleven lanes. Written from what the
 * site already says (the End-to-End and Agentic Framework cards, the AI agents
 * list and Hermes). public/end-to-end.html is generated from it: npm run e2e-page
 */
import type { SiteLink } from '../lib/brand/render.ts'
import type { ToolId } from '../lib/brand/tools.ts'

export type LaneId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K'
export type StepKind = 'trigger' | 'step' | 'ai' | 'decision' | 'gate' | 'agent' | 'end'
export type Lane = { id: LaneId; name: string; note: string }
/** A step on the graph. `at` is its [column, row] inside its lane (a half row sits between two rows). `n` numbers it inside its lane. */
export type Step = { id: string; lane: LaneId; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; n?: number; enforced?: true; tools?: ToolId[] }
export type Cable = { from: string; to: string; kind: 'flow' | 'loop'; label?: string }
export type LegendKey = { id: 'cable' | 'signal' | 'loop' | 'gate' | 'auto'; label: string; what: string }
export type EndToEnd = {
  /** Set on a per-site copy: where its site lives and its own path. */
  site?: SiteLink
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  stance: string
  caption: string
  lanes: Lane[]
  steps: Step[]
  cables: Cable[]
  legend: LegendKey[]
  glossary: { title: string; blurb: string; terms: [string, string][] }
  footer: { note: string; by: string }
}

/** What the click panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = {
  trigger: 'TRIGGER',
  step: 'STEP',
  ai: 'AI STEP',
  decision: 'DECISION',
  gate: 'APPROVAL GATE',
  agent: 'AGENT JOB',
  end: 'END',
}

const step = (id: string, lane: LaneId, at: [number, number], kind: StepKind, label: string, sub: string, icon: string, what: string, enforced = false): Step =>
  ({ id, lane, at, kind, label, sub, icon, what, ...(enforced ? { enforced: true as const } : {}) })
const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })
const chain = (...ids: string[]) => ids.slice(1).map((to, i) => flow(ids[i], to))

const LANES: Lane[] = [
  { id: 'A', name: 'Triggers', note: 'Where work enters.' },
  { id: 'B', name: 'Knowledge and memory', note: 'Checked before anything is built.' },
  { id: 'C', name: 'Frame the task', note: 'Spec before prompt.' },
  { id: 'D', name: 'Build loop', note: 'One small piece at a time.' },
  { id: 'E', name: 'Check and repeat', note: 'Nothing ships until it passes.' },
  { id: 'F', name: 'Debug and fix', note: 'Find the cause. Never patch blind.' },
  { id: 'G', name: 'Agents and skills', note: 'One job each.' },
  { id: 'H', name: 'n8n automation', note: 'Predictable, logged, reversible.' },
  { id: 'I', name: 'Approval and delivery', note: 'A person says yes.' },
  { id: 'J', name: 'Git and deploy', note: 'Ship, then prove it’s live.' },
  { id: 'K', name: 'Write-back and reset', note: 'The next run starts smarter.' },
]

const JOBS: [string, string, string, string][] = [
  ['Researcher', 'finds sources', 'MagnifyingGlass', 'Gathers sources and facts for a task and reports what it found, with where each fact came from.'],
  ['Auditor', 'n8n audits', 'ClipboardText', 'Reviews an n8n setup and lists what is broken, risky or missing, ranked by impact.'],
  ['Builder', 'workflows', 'FlowArrow', 'Builds n8n workflows from an approved plan, one node at a time.'],
  ['Writer', 'articles', 'Article', 'Writes long articles, like a 3,000-word blog post, and grades itself before handing over.'],
  ['Reel maker', 'scripts to renders', 'FilmStrip', 'The reel worker: scripts, voices, captions and renders a short video from one message.'],
  ['Reviewer', 'second pair of eyes', 'Eye', 'Checks another agent’s work against its brief before it moves on.'],
  ['Deliverables', 'client-ready files', 'Package', 'Turns finished work into client-ready files and the handover doc.'],
  ['Monitor', 'watches live systems', 'Pulse', 'Watches live automations and flags anything that stops or slows down.'],
  ['Data tidy', 'clean records', 'Broom', 'Finds duplicate, stale or badly formatted records and proposes fixes.'],
  ['Memory keeper', 'saves what was learned', 'Brain', 'Saves decisions and lessons into notes, so the next session starts with them.'],
]

const STEPS: Step[] = [
  step('a1', 'A', [0, 0], 'trigger', 'Message to Hermes', 'Telegram', 'PaperPlaneTilt', 'I send Hermes one line on Telegram, and that is enough to start a build, a reel or an audit.'),
  step('a2', 'A', [0, 1], 'trigger', 'Schedule', 'sweeps on a timer', 'Timer', 'A timed sweep checks for work on its own, and skips the model entirely when nothing has changed.', true),
  step('a3', 'A', [0, 2], 'trigger', 'Client event', 'n8n webhook', 'Lightning', 'A form fill, a stage change, an inbound message or a booked call in a client account, caught by an n8n webhook.'),
  step('a4', 'A', [1, 0.5], 'decision', 'Read the intent', 'routes the work', 'Signpost', 'Works out what kind of work this is. Build work goes to knowledge and framing first; a skill job goes straight to the right agent.'),

  step('b1', 'B', [0, 0], 'step', 'Project rules', 'CLAUDE.md', 'FileText', 'The project’s own rules file: its conventions, its commands and what never to do. It loads at the start of every session.'),
  step('b2', 'B', [1, 0], 'step', 'My notes', 'Hermes reads them', 'Notebook', 'My notes on clients, decisions and how things were done, which Hermes can read and search.'),
  step('b3', 'B', [2, 0], 'step', 'Knowledge base', '1,277 chunks', 'Books', 'My knowledge base, searched by keyword ranking. The five best passages come back before any answer is written.'),
  step('b4', 'B', [3, 0], 'step', 'Past work', 'what shipped before', 'ClockCounterClockwise', 'Earlier builds for the same kind of job, so a solved problem is reused instead of solved again.'),

  step('c1', 'C', [0, 0], 'step', 'Outcome', 'what done looks like', 'Target', 'One paragraph describing what done looks like. If it cannot be written, the task is not ready to build.'),
  step('c2', 'C', [1, 0], 'step', 'Constraints', 'limits and no-gos', 'Prohibit', 'The limits: budget, tools, deadlines and anything that must not change.'),
  step('c3', 'C', [2, 0], 'step', 'Files that matter', 'context is a budget', 'Files', 'Only the files the task needs go into context. Everything else stays out, so the model stays sharp.'),
  step('c4', 'C', [3, 0], 'step', 'Acceptance criteria', 'how it gets graded', 'ListChecks', 'The checks the result must pass, written before any work starts, so the output can be graded against them.'),
  step('c5', 'C', [4, 0], 'step', 'Spec', 'one brief per run', 'Scroll', 'Everything above in one written brief. The agent works from it and is not interrupted with new requirements mid-task.'),

  step('d1', 'D', [0, 0], 'step', 'Pick one small piece', 'one task, one context', 'PuzzlePiece', 'Takes the next small piece from the spec. After a piece passes its checks, the next one starts here.'),
  step('d2', 'D', [1, 0], 'ai', 'Claude Code builds', 'the builder', 'TerminalWindow', 'Claude Code writes the real files for this piece: planning on Opus, volume on Sonnet.'),
  step('d3', 'D', [2, 0], 'ai', 'Subagents in parallel', 'parts run at once', 'UsersThree', 'Parts that don’t depend on each other are handed to subagents, which work on them at the same time.'),
  step('d4', 'D', [3, 0], 'step', 'VS Code takes over', 'precision over speed', 'FileCode', 'I read what was written in VS Code and take over by hand wherever precision matters more than speed.'),

  step('e1', 'E', [0, 0], 'step', 'Run it', 'tests and a real run', 'Play', 'The tests and the app itself actually run. A result that has not run does not count.', true),
  step('e2', 'E', [1, 0], 'ai', 'Grade the result', 'against the criteria', 'ListChecks', 'The output is checked against the acceptance criteria from the spec before I look at it.'),
  step('e3', 'E', [2, 0], 'ai', 'Codex second opinion', 'a fresh model reviews', 'Code', 'A different model reads the diff. A fresh reviewer catches what the author missed.'),
  step('e4', 'E', [3, 0], 'decision', 'Pass?', 'three ways out', 'CheckCircle', 'Three ways out: a miss goes back to be rebuilt, a real failure goes to debugging, and a pass goes to the approval gate.'),

  step('f1', 'F', [0, 0], 'step', 'Bug or failure', 'reproduce it first', 'Bug', 'Something broke. First it is made to happen again on purpose, so the fix can be proven.'),
  step('f2', 'F', [1, 0], 'step', 'Rank the causes', 'likeliest first', 'ListNumbers', 'The possible causes are listed and ranked by how likely they are, before anything is changed.'),
  step('f3', 'F', [2, 0], 'step', 'Test to confirm', 'prove the cause', 'Flask', 'A small test confirms which cause is real. Guesses don’t get fixed.'),
  step('f4', 'F', [3, 0], 'step', 'Fix and re-check', 'back through Check', 'Wrench', 'The fix goes in with a test that failed before it and passes after, then the work runs through Check again.'),

  step('g0', 'G', [0, 0.5], 'decision', 'Router', 'picks the specialist', 'ArrowsSplit', 'Reads the job and hands it to the one specialist whose job it is.'),
  ...JOBS.map(([label, sub, icon, what], i) => step(`g${i + 1}`, 'G', [(i % 5) + 1, i < 5 ? 0 : 1], 'agent', label, sub, icon, what)),
  step('g11', 'G', [6, 0.5], 'step', 'Self-check', 'graded before the gate', 'SealCheck', 'Every agent’s output is checked against its own brief before it reaches the approval gate.'),

  step('h1', 'H', [0, 0], 'trigger', 'Webhook in', 'n8n', 'WebhooksLogo', 'The client event arrives in n8n through a webhook, with the details it needs.'),
  step('h2', 'H', [1, 0], 'step', 'Wait', 'until the right time', 'Hourglass', 'Holds the run until the right moment, like business hours or a reply.'),
  step('h3', 'H', [2, 0], 'decision', 'Branch', 'needs a yes?', 'GitFork', 'Decides whether a person must approve this. Routine work carries on; anything a client would see goes to the gate.'),
  step('h4', 'H', [3, 0], 'step', 'Action', 'does the work', 'Gear', 'Does the routine work: updates a record, sends an internal note or moves a stage. No model in the hot path.'),
  step('h5', 'H', [4, 0], 'step', 'Log', 'every run recorded', 'Notepad', 'Every run is recorded, so anything can be traced and reversed.', true),

  step('i1', 'I', [0, 0], 'gate', 'Approval gate', 'approve or send back', 'ShieldCheck', 'The work stops here until I say yes. I approve it, or send it back with a note.'),
  step('i2', 'I', [1, 0], 'step', 'Deliver', 'with the handover doc', 'Handshake', 'The article, reel, workflow or report is handed over with the same handover doc every time.'),

  step('j1', 'J', [0, 0], 'step', 'Commit', 'small, clear commits', 'GitCommit', 'The change is saved in small commits that each say what they do.'),
  step('j2', 'J', [1, 0], 'step', 'Push', 'to GitHub', 'CloudArrowUp', 'The commits go up to GitHub.'),
  step('j3', 'J', [2, 0], 'step', 'Deploy', 'Vercel and my VPS', 'Rocket', 'Sites deploy on Vercel. Hermes and the workers run in Docker on my VPS.'),
  step('j4', 'J', [3, 0], 'decision', 'Verify live', 'on the real URL', 'Globe', 'The live site or service is checked for real. If it fails, the last good version goes back up and it deploys again.', true),

  step('k1', 'K', [0, 0], 'step', 'Write back', 'to the contact record', 'AddressBook', 'The result lands on the contact record, so the next run knows what already happened.'),
  step('k2', 'K', [1, 0], 'step', 'Save progress', 'watcher every 15 min', 'FloppyDisk', 'Progress is saved. A watcher pings me every fifteen minutes, but only when there is real work to save.', true),
  step('k3', 'K', [2, 0], 'step', 'Fold back', 'mistakes become rules', 'ArrowBendUpLeft', 'Whatever went wrong becomes a written rule, so the next run does not repeat it.'),
  step('k4', 'K', [3, 0], 'end', 'Fresh session', 'reset early and often', 'Sparkle', 'The next task starts in a clean session. A fresh session beats a long one every time.'),
]

/** Lanes whose steps read in order carry numbers (spec §3.2). */
const NUMBERED = new Set<LaneId>(['B', 'C', 'D', 'E', 'F', 'H', 'I', 'J', 'K'])

const CABLES: Cable[] = [
  flow('a1', 'a4'),
  flow('a2', 'a4'),
  flow('a3', 'h1'),
  flow('a4', 'b1', 'build work'),
  flow('a4', 'g0', 'a skill job'),
  ...chain('b1', 'b2', 'b3', 'b4'),
  flow('b4', 'c1'),
  ...chain('c1', 'c2', 'c3', 'c4', 'c5'),
  flow('c5', 'd1'),
  ...chain('d1', 'd2', 'd3', 'd4'),
  flow('d4', 'e1'),
  ...chain('e1', 'e2', 'e3', 'e4'),
  loop('e4', 'd2', 'fails'),
  flow('e4', 'f1', 'breaks'),
  flow('e4', 'i1', 'passes'),
  ...chain('f1', 'f2', 'f3', 'f4'),
  loop('f4', 'e1', 're-check'),
  ...JOBS.map((_, i) => flow('g0', `g${i + 1}`)),
  ...JOBS.map((_, i) => flow(`g${i + 1}`, 'g11')),
  flow('g11', 'i1'),
  ...chain('h1', 'h2', 'h3'),
  flow('h3', 'i1', 'needs a yes'),
  flow('h3', 'h4', 'routine'),
  flow('h4', 'h5'),
  flow('h5', 'k1'),
  flow('i1', 'i2', 'approved'),
  loop('i1', 'd2', 'send back with a note'),
  flow('i2', 'j1', 'code'),
  flow('i2', 'k1'),
  ...chain('j1', 'j2', 'j3', 'j4'),
  flow('j4', 'k2'),
  loop('j4', 'j3', 'fails: roll back and redeploy'),
  ...chain('k1', 'k2', 'k3', 'k4'),
  loop('k3', 'c1', 'becomes a rule'),
]

/** The tools each step names in its label or sub-line (spec 2026-10-01-lively-pages §4.1). */
const TOOLS_ON: Record<string, ToolId[]> = {
  a1: ['telegram'], a3: ['n8n'], d2: ['claude-code'], d4: ['vs-code'], e3: ['codex'], g2: ['n8n'], h1: ['n8n'], j2: ['github'], j3: ['vercel'],
}

export const endToEnd: EndToEnd = {
  title: 'End-to-End Workflow · Justine Acosta',
  description: 'How Justine Acosta ships work: every trigger, lane, agent and loop drawn as one live graph, from a form fill to a delivered asset.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'HOW I SHIP, END TO END',
  heading: 'The End-to-End Workflow',
  lede: 'Every trigger, node, skill and agent wired as one live graph, from a form fill to a delivered asset.',
  stance: 'Nothing leaves the graph without a human yes.',
  caption: 'The end-to-end flow · 11 lanes',
  lanes: LANES,
  steps: STEPS.map((s) => ({ ...s, ...(NUMBERED.has(s.lane) ? { n: s.at[0] + 1 } : {}), ...(TOOLS_ON[s.id] ? { tools: TOOLS_ON[s.id] } : {}) })),
  cables: CABLES,
  legend: [
    { id: 'cable', label: 'Cable', what: 'Work flowing from one step to the next.' },
    { id: 'signal', label: 'Live signal', what: 'A ball is a piece of work moving through the graph right now.' },
    { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step and comes through again.' },
    { id: 'gate', label: 'Approval gate', what: 'The graph stops here until a person says yes.' },
    { id: 'auto', label: 'Runs on its own', what: 'A machine enforces this step, like a schedule, a test run or a log. It never depends on remembering.' },
  ],
  glossary: {
    title: 'Every term on the map, in one line.',
    blurb: 'Plain English for the technical words above.',
    terms: [
      ['n8n', 'The automation tool the client workflows run in: triggers, waits, branches and actions, wired as nodes.'],
      ['Webhook', 'A web address another system calls the moment something happens, which starts a workflow.'],
      ['Hermes', 'My own AI agent on a server, reachable from Telegram. It remembers, reads my notes and runs jobs unasked.'],
      ['Telegram', 'The chat app I use to message Hermes and to get alerts.'],
      ['Knowledge base', 'My searchable library of notes and documents, split into 1,277 short passages.'],
      ['Spec', 'A short written brief: the outcome, the limits, the files and the checks, agreed before building.'],
      ['Acceptance criteria', 'The checks a result must pass to count as done, written before the work starts.'],
      ['Claude Code', 'The AI coding tool that builds: it reads and writes real files and runs commands.'],
      ['Subagent', 'A helper Claude Code starts for one part of a task, so several parts are worked on at once.'],
      ['VS Code', 'Visual Studio Code, the code editor I use to read what was written and take over by hand.'],
      ['Codex', 'A second AI model that reviews the work. A fresh reviewer catches what the author missed.'],
      ['Skill', 'A reusable procedure an agent loads for one kind of job, like drafting an article or cutting a reel.'],
      ['Agent', 'An AI assistant with one job. It picks its own tools and finishes the task.'],
      ['Router', 'The step that reads a job and hands it to the right specialist.'],
      ['Approval gate', 'A hard stop. Nothing reaches a client, a repo or a send button until I approve it.'],
      ['Handover doc', 'The same short document with every delivery: what it does, what breaks it and who to call.'],
      ['Write back', 'Putting the result onto the client’s contact record, so the next run knows what already happened.'],
      ['Commit', 'A saved, labelled snapshot of code changes.'],
      ['Deploy', 'Putting the new version live: Vercel for sites, Docker on my VPS for Hermes and the workers.'],
      ['Roll back', 'Putting the last good version back up when a live check fails.'],
      ['VPS', 'A private server I rent, where Hermes and my workers run.'],
      ['Fold back', 'Turning a mistake into a written rule, so it does not happen twice.'],
      ['Fresh session', 'Starting the next task in a clean AI session instead of a long, cluttered one.'],
    ],
  },
  footer: { note: 'Drawn from how I work today.', by: 'Built by Justine Acosta' },
}
