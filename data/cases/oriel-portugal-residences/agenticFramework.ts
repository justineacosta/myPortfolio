/**
 * Oriel’s Agentic framework case page (spec 2026-10-05 per-site pages): how
 * Justine would build Oriel’s site, its three flows, its bot and its two
 * agents with AI, with OR-01 taken through the loop. data/cases/index.ts
 * registers it; `npm run cases` renders it into
 * public/cases/oriel-portugal-residences/agentic-framework.html. Only type
 * imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

const framework: AgenticFramework = {
  title: 'Oriel · Agentic framework',
  description: 'How Justine Acosta would build Oriel’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the private viewing flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · ORIEL',
  heading: 'How I would build Oriel with AI',
  lede: 'The tools, the rules and the loop I would use to build Oriel’s site, its three flows, its Q&A bot and its two agents, one small branch at a time.',
  stance: 'I make the calls, the AI does the typing, and an architect approves what a buyer reads.',
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Oriel in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps Oriel’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build Oriel, and one that works inside its flows.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every word a buyer reads right.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'OR-01, from the form to live', blurb: 'Oriel’s private viewing flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason Oriel’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for Oriel (CLAUDE.md), the build plan, and test contacts, a test mailbox and a test architect in HubSpot, Gmail and Cal.com, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing is published or switched on until I approve it, and nothing Claude drafts reaches a buyer’s inbox without an architect’s yes.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a buyer', 'Approve every change before it goes live', 'Walk each branch with test contacts', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read Oriel’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding what Oriel promises a buyer, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. Oriel’s pages, the n8n workflow and the Make blueprint, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, and every prompt Claude will run inside a flow, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the flows. It qualifies a request, sorts an email, drafts a note and answers in the chat from Oriel’s documents. It never sends an email on its own.', note: 'Haiku to sort, Sonnet to write' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a buyer, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches Oriel’s live site, a switched-on flow or a buyer’s inbox unreviewed, and an architect approves what Claude writes to a buyer.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for the whole studio.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like OR-01’s At home path, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only Oriel’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test contacts. Codex reads the diff as a second opinion, and I read it in VS Code before I trust it.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test request through Oriel’s live form and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in Oriel’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { id: 'signal', label: 'Live signal', what: 'A ball is one branch going round the loop right now.' },
      { id: 'loop', label: 'Loop-back', what: 'A dashed cable. The work goes back to an earlier step.' },
      { id: 'gate', label: 'Approval gate', what: 'The loop stops here until I say yes.' },
      { id: 'pin', label: 'Rule pin', what: 'One of my four rules, applied at this step. Click a pin to read it.' },
    ],
  },
  example: {
    items: [
      { stage: 'Frame', text: 'Read the site’s one form: four questions, two places and the promise of a reply within one working day. Done means every request has an architect, a slot and that reply.' },
      { stage: 'Frame', text: 'Wrote OR-01’s spec and its five test rows before any node: a residence, Not sure yet, At home, a returning buyer and no free slot.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and Claude’s line for the architect, then the architect match, the Cal.com hold, the headset courier and the template confirmation.' },
      { stage: 'Check', text: 'Ran each row with test contacts and a test architect. The no free slot row failed: the flow guessed a slot weeks out. Then a fresh reviewer model read the n8n export and saw Cal.com sending its own email too.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: never guess a slot, so a full calendar stops the run and OR-H02 tells the studio, and Cal.com’s own emails stay off.' },
      { stage: 'Ship', text: 'I approved it, pointed the site’s form at the webhook, sent one test request through the live form and watched the confirmation land.' },
    ],
    link: { label: 'See Oriel’s end-to-end workflow', href: '/cases/oriel-portugal-residences/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, and every prompt Claude will run inside a flow, is read before it goes anywhere.' },
    { mark: '3', icon: 'TestTube', title: 'Test contacts first', text: 'Every branch is walked with test contacts, a test mailbox and a test architect before a real buyer meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live form', text: 'Tests passing is not the end. I send a test request through Oriel’s real form and follow it.' },
  ],
  closing: 'Done is a confirmed viewing, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside Oriel’s flows as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and for writing notes.'],
    ['Haiku', 'Claude’s quickest model, used to qualify a request and sort an email.'],
    ['n8n', 'The automation tool OR-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool the studio inbox runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Webhook', 'A web address the viewing form calls the moment it is sent, which starts OR-01.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like At home or Not sure yet, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test contact', 'A made-up buyer in HubSpot, so a branch can run without touching a real one.'],
    ['Diff', 'The exact lines a change adds and removes.'],
    ['Second opinion', 'A different model reading the work, to catch what the author missed.'],
    ['Approval gate', 'A point where the work stops until a person says yes.'],
    ['CLAUDE.md', 'The rules file Claude Code reads at the start of every session.'],
    ['Loop-back', 'A cable that sends the work back to an earlier step.'],
    ['Fold back', 'Turning a mistake into a rule or a test row, so it does not happen again.'],
    ['Fresh session', 'A new, empty AI chat, started clean for the next branch.'],
    ['Test first', 'Writing the test before the code, and watching it fail first.'],
    ['Reviewer model', 'A fresh AI model asked only to review finished work.'],
  ],
  footer: { note: 'A worked example. Oriel is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
