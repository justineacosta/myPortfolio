/**
 * Altitude’s Agentic framework case page (spec 2026-10-05 per-site pages): how
 * Justine would build Altitude’s site, its three flows, its Program Q&A bot and
 * its two agents with AI, with AL-01 taken through the loop.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/altitude-personal-training/agentic-framework.html. Only type
 * imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

const framework: AgenticFramework = {
  title: 'Altitude · Agentic framework',
  description: 'How Justine Acosta would build Altitude’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the coaching application flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · ALTITUDE',
  heading: 'How I would build Altitude with AI',
  lede: 'The tools, the rules and the loop I would use to build Altitude’s site, its three flows, its Program Q&A bot and its two agents, one small branch at a time.',
  stance: 'I make the calls and the AI does the typing. Elias approves anything Claude drafts for a client’s inbox and writes every check-in reply himself, and no subscription starts until he marks the consult Starting.',
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Altitude in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps Altitude’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build Altitude, and one that works inside its flows.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every promise on Altitude’s site kept.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'AL-01, from Start coaching to live', blurb: 'Altitude’s coaching application flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason Altitude’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for Altitude (CLAUDE.md), the build plan, and test applicants, test clients, Stripe test mode and a test calendar in Airtable, Stripe and Cal.com, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing is published or switched on until I approve it. Elias approves anything Claude drafts for a client’s inbox, and no subscription starts until he marks the consult Starting.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises an applicant or a client', 'Approve every change before it goes live', 'Walk each branch with test applicants and clients', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read Altitude’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding when a client is charged, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. Altitude’s pages, the n8n workflow, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, and every prompt Claude will run inside a flow, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the bot, the agents and two of the three flows. It summarises an application or a check-in for Elias, answers visitors from the site and drafts the four-week reviews and end-of-block reports. AL-02 does not use it, and it never writes a check-in reply or sends an email on its own.', note: 'Sonnet in the bot, agents, AL-01 and AL-03' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a client, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches Altitude’s live site or a switched-on flow unreviewed, Elias approves anything Claude drafts for a client’s inbox, and no subscription starts before he marks the consult Starting.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like AL-02’s Expired path, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only Altitude’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test applicants, test clients and Stripe test cards. Codex reads the diff as a second opinion, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test application through Altitude’s live Start coaching and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in Altitude’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: there is no form, only Start coaching, which opens a five-minute application asking the goal, the schedule and what has been tried before. Done means every new applicant is offered the free consult within minutes, Elias has Claude’s summary, and a current client reaches Elias instead.' },
      { stage: 'Frame', text: 'Wrote AL-01’s spec and its six test rows before any node: a new applicant, a current client, the same email twice, an injury mentioned, a messy email and Claude failing.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and the tidied fields, the roster check, the client path to Elias, the saved row, the template consult offer with the Cal.com link, then Claude’s summary and Elias’s brief.' },
      { stage: 'Check', text: 'Ran each row with test applicants and a test client. The messy email row failed: a client’s email in capitals, with a trailing space, missed the roster, and the client got a consult offer. Then a fresh reviewer model read the n8n export and saw every new applicant would stall: the roster search finds nothing for a new email, and n8n ends the run quietly, so no one got a reply.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every email is trimmed and lowercased before it is matched, and every n8n search has Always Output Data on and says what an empty result does.' },
      { stage: 'Ship', text: 'I approved it, pointed the application behind Start coaching at the webhook, sent one test application through the live site, and watched the consult offer land and Claude’s summary reach Elias in Telegram.' },
    ],
    link: { label: 'See Altitude’s end-to-end workflow', href: '/cases/altitude-personal-training/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, and every prompt Claude will run inside a flow, is read before it goes anywhere.' },
    { mark: '3', icon: 'TestTube', title: 'Test clients first', text: 'Every branch is walked with test applicants, test clients and Stripe test cards before a real applicant or client meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I send a test application through Altitude’s real Start coaching and follow it.' },
  ],
  closing: 'Done is a consult offered, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside Altitude’s flows as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the bot, the agents, AL-01 and AL-03.'],
    ['n8n', 'The automation tool AL-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool starting a plan runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool the Sunday check-in runs in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'A web address the application behind Start coaching calls the moment it is sent, which starts AL-01.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an empty result is handled, not dropped.'],
    ['Stripe test mode', 'Stripe’s practice mode, where test cards start a subscription and no money moves.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like Expired or an applicant who is already a client, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test applicant', 'A made-up applicant, so a branch can run without touching a real person.'],
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
  footer: { note: 'A worked example. Altitude is a fictional coaching studio, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
