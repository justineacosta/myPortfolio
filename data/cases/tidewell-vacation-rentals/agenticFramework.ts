/**
 * Tidewell’s Agentic framework case page (spec 2026-10-05 per-site pages): how
 * Justine would build Tidewell’s site, its three flows, its Guest help bot and
 * its two agents with AI, with TW-01 taken through the loop.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/tidewell-vacation-rentals/agentic-framework.html. Only type
 * imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

const framework: AgenticFramework = {
  title: 'Tidewell · Agentic framework',
  description: 'How Justine Acosta would build Tidewell’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the property assessment flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · TIDEWELL',
  heading: 'How I would build Tidewell with AI',
  lede: 'The tools, the rules and the loop I would use to build Tidewell’s site, its three flows, its Guest help bot and its two agents, one small branch at a time.',
  stance: 'I make the calls and the AI does the typing. Owners approve repairs above $400, and a manager approves every rate change and anything Claude drafts for an owner or a guest.',
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Tidewell in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps Tidewell’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build Tidewell, and one that works inside its flows.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every figure an owner reads right.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'TW-01, from the form to live', blurb: 'Tidewell’s property assessment flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason Tidewell’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for Tidewell (CLAUDE.md), the build plan, and test owners, test homes and a test manager’s calendar in HubSpot, Airtable and Cal.com, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing is published or switched on until I approve it, and a manager approves anything Claude drafts for an owner or a guest.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises an owner', 'Approve every change before it goes live', 'Walk each branch with test owners and homes', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read Tidewell’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding where Tidewell’s $400 line sits, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. Tidewell’s pages, the n8n workflow, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, and every prompt Claude will run inside a flow, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the flows. It outlines a projection, drafts a statement note, answers guests from the guides and proposes a rate. It never sends an email on its own.', note: 'Sonnet inside every flow' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises an owner, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches Tidewell’s live site or a switched-on flow unreviewed, and a manager approves anything Claude drafts for an owner or a guest.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three markets.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like TW-02’s Above $400 path, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only Tidewell’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test owners and test homes. Codex reads the diff as a second opinion, and I read it in VS Code before I trust it.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test address through Tidewell’s live form and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in Tidewell’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site’s one form: an address or town and an email, nothing else. Done means every request in the three markets has a manager under eighteen homes, an hour held and a confirmation, and every other address reaches the office.' },
      { stage: 'Frame', text: 'Wrote TW-01’s spec and its six test rows before any node: a coast address, a mountain address, an address outside the markets, a town with no homes, no free hour and every manager full.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and the tidied fields, then the town and its market, the office path, the manager, the Cal.com hold, the template confirmation and Claude’s outline for the manager.' },
      { stage: 'Check', text: 'Ran each row with test owners and a test manager’s calendar. The Savannah row failed: the town search found nothing, and n8n ended the run quietly, so the office never heard. Then a fresh reviewer model read the n8n export and saw the booking would fail: Cal.com needs a name, and the form asks none.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every n8n search has Always Output Data on and says what an empty result does, and a booking with no name reads Owner and the town.' },
      { stage: 'Ship', text: 'I approved it, pointed the site’s form at the webhook, sent one test address through the live form, and watched the confirmation land and the manager’s brief arrive in Telegram.' },
    ],
    link: { label: 'See Tidewell’s end-to-end workflow', href: '/cases/tidewell-vacation-rentals/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, and every prompt Claude will run inside a flow, is read before it goes anywhere.' },
    { mark: '3', icon: 'TestTube', title: 'Test owners first', text: 'Every branch is walked with test owners, test homes and a test manager before a real owner or guest meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live form', text: 'Tests passing is not the end. I send a test address through Tidewell’s real form and follow it.' },
  ],
  closing: 'Done is a booked walkthrough, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside Tidewell’s flows as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside every flow.'],
    ['n8n', 'The automation tool TW-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool repair approval runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool the monthly statement runs in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'A web address the assessment form calls the moment it is sent, which starts TW-01.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an empty result is handled, not dropped.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like Above $400 or an address outside the markets, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test owner', 'A made-up owner in HubSpot, so a branch can run without touching a real one.'],
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
  footer: { note: 'A worked example. Tidewell is a fictional rental manager, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
