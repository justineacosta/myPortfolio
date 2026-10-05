/**
 * The Agentic Framework page's content (spec 2026-10-01-agentic-framework):
 * how Justine builds with AI, drafted from the card. The tools and rules are
 * the card's own words. public/agentic-framework.html is generated from it:
 * npm run af-page
 */
import type { SiteLink } from '../lib/brand/render.ts'
import type { ToolId } from '../lib/brand/tools.ts'

export type SectionId = 'glance' | 'jobs' | 'tools' | 'rules' | 'loop' | 'example' | 'habits' | 'glossary'
export type Section = { id: SectionId; chip: string; kicker: string; title: string; blurb: string }
export type RuleId = 'R1' | 'R2' | 'R3' | 'R4'
export type StepKind = 'start' | 'step' | 'gate' | 'end'
/** A step on the loop. `at` is its [column, row]. `rule` pins one of the four rules to it. */
export type LoopStep = { id: string; at: [number, number]; kind: StepKind; label: string; sub: string; icon: string; what: string; rule?: RuleId; tools?: ToolId[] }
export type Cable = { from: string; to: string; kind: 'flow' | 'loop'; label?: string }
export type LegendKey = { id: 'cable' | 'signal' | 'loop' | 'gate' | 'pin'; label: string; what: string }
/** A tile in a row: its mark (a number or a rule id), a Phosphor icon name, a title, a line, and an optional note. */
export type Card = { mark: string; icon: string; title: string; text: string; note?: string; tool?: ToolId }
export type Rule = Card & { mark: RuleId }
export type Stage = 'Frame' | 'Build' | 'Check' | 'Fold back' | 'Ship'
export type AgenticFramework = {
  /** Set on a per-site copy: where its site lives and its own path. */
  site?: SiteLink
  title: string
  description: string
  home: string
  kicker: string
  heading: string
  lede: string
  stance: string
  sections: Section[]
  stages: Card[]
  jobs: { columns: { title: string; items: string[] }[]; line: string }
  tools: Card[]
  rules: Rule[]
  loop: { caption: string; steps: LoopStep[]; cables: Cable[]; legend: LegendKey[] }
  example: { items: { stage: Stage; text: string }[]; link: { label: string; href: string } }
  habits: Card[]
  closing: string
  glossary: [string, string][]
  footer: { note: string; by: string }
}

/** What the click panel calls each kind of step. */
export const KIND_TYPES: Record<StepKind, string> = { start: 'START', step: 'STEP', gate: 'APPROVAL GATE', end: 'END' }

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

export const agenticFramework: AgenticFramework = {
  title: 'Agentic Framework · Justine Acosta',
  description: 'How Justine Acosta builds with AI: the tools, the rules and the loop, with one real feature taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'HOW I BUILD WITH AI',
  heading: 'The Agentic Framework',
  lede: 'The tools, the rules, and the loop I use to ship apps with AI instead of chatting with it.',
  stance: 'I make the calls. The AI does the typing.',
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps the loop honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Three tools, one job each', blurb: 'Each one has a job. I do not use three where one will do.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'Non-negotiable, and they are what keep the output usable.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated until the criteria pass. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A REAL EXAMPLE', title: 'One real feature, from reference to live', blurb: 'The End-to-End Workflow page, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the loop works.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file (CLAUDE.md), my notes and the three tools, wired before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One small piece per run, repeated until the criteria pass.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing reaches a repo, a client or a send button until I approve it.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what done means', 'Approve every write', 'Take over when precision beats speed', 'Turn mistakes into rules'] },
      { title: 'The AI', items: ['Read the files that matter', 'Write the code and the tests', 'Run it and grade itself against the criteria', 'Report back with the diff'] },
    ],
    line: 'When the AI starts deciding scope, or I start typing boilerplate, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. Long tasks, real files, subagents for anything that can run in parallel.', note: 'Opus for planning, Sonnet for volume' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read what was written and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reviewing a diff catches what the author missed.', note: 'Review pass, not a build pass' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot describe done in a paragraph, the agent will not find it in a thousand tokens.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches a client account, a repo, or a send button unreviewed.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'Small units of work', text: 'One task, one context. A fresh session beats a long one every time.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The model grades itself', text: 'Acceptance criteria go in with the task, and the output is checked against them before I look.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A task', sub: 'One small piece', icon: 'ClipboardText', what: 'One small piece of work, small enough that I can describe done in a paragraph. Anything bigger gets split first.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the constraints and the files that matter, then write the spec with its acceptance criteria. Opus helps plan, and nothing else goes into the context.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds from the spec, test-first, with subagents for parts that can run at once. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'It runs, it grades itself against the criteria, and Codex reads the diff as a second opinion. I read it in VS Code before I trust it.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing reaches a repo, a client or a send button until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Live on the URL', icon: 'RocketLaunch', what: 'Shipped means live: I open the real URL and use it. Then the next small piece starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in CLAUDE.md or a new test, so the next run does not repeat it.' },
    ],
    cables: [
      flow('task', 'frame'),
      flow('frame', 'build'),
      flow('build', 'check'),
      flow('check', 'gate', 'passes'),
      flow('gate', 'live', 'approved'),
      loop('check', 'fold', 'fails'),
      loop('fold', 'frame', 'becomes a rule'),
      loop('gate', 'build', 'send back'),
    ],
    legend: [
      { id: 'cable', label: 'Cable', what: 'Work moving from one step to the next.' },
      { id: 'signal', label: 'Live signal', what: 'A ball is one task going round the loop right now.' },
      { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step.' },
      { id: 'gate', label: 'Approval gate', what: 'The loop stops here until I say yes.' },
      { id: 'pin', label: 'Rule pin', what: 'One of my four rules, applied at this step. Click a pin to read it.' },
    ],
  },
  example: {
    items: [
      { stage: 'Frame', text: 'Studied a reference page for its shape only, then answered the design questions one at a time.' },
      { stage: 'Frame', text: 'Wrote the spec and ticked every line of it before any code. Then a six-task plan, with the code for each task.' },
      { stage: 'Build', text: 'Built each task test-first: write the test, watch it fail, make it pass.' },
      { stage: 'Check', text: '511 unit tests and 194 browser tests green. Then a fresh reviewer model read the whole branch and found four bugs.' },
      { stage: 'Fold back', text: 'Each bug got a test that failed first, then the fix. Two lessons became permanent tests: labels fit on one line, and the drag test waits for the page to settle.' },
      { stage: 'Ship', text: 'I checked it, said “push, PR, merge”, the checks passed, and it went live.' },
    ],
    link: { label: 'See it: The End-to-End Workflow →', href: '/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per task', text: 'A long chat drifts. I close it and start clean with the spec.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff', text: 'I read what was written before it goes anywhere. No exceptions for small changes.' },
    { mark: '3', icon: 'HandPalm', title: 'No new asks mid-run', text: 'A new idea waits for the next loop, so the current one can finish.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the real URL', text: 'Tests passing is not the end. I open the live page and use it.' },
  ],
  closing: 'Done is a URL, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Acceptance criteria', 'The checks the work must pass to count as done.'],
    ['Subagent', 'A helper AI the main one hands a side task to, so parts run at once.'],
    ['Diff', 'The exact lines a change adds and removes.'],
    ['Second opinion', 'A different model reading the work, to catch what the author missed.'],
    ['Approval gate', 'A point where the work stops until a person says yes.'],
    ['CLAUDE.md', 'The rules file Claude Code reads at the start of every session.'],
    ['Loop-back', 'A cable that sends the work back to an earlier step.'],
    ['Fold back', 'Turning a mistake into a rule or a test, so it does not happen again.'],
    ['Fresh session', 'A new, empty AI chat, started clean for the next task.'],
    ['Test-first', 'Writing the test before the code, and watching it fail first.'],
    ['Reviewer model', 'A fresh AI model asked only to review finished work.'],
  ],
  footer: { note: 'The loop as I run it today.', by: 'Built by Justine Acosta' },
}
