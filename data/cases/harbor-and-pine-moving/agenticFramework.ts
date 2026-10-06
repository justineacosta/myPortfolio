/**
 * Harbor & Pine Moving Co.’s Agentic framework case page (spec 2026-10-05
 * per-site pages): how Justine would build the mover’s site, its three flows,
 * its Help-desk RAG bot and its two agents with AI, with HP-01, the moving
 * estimate flow, taken through the loop. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/harbor-and-pine-moving/agentic-framework.html. Only type
 * imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, as on Harbor & Pine’s other pages. */
const YES = 'A coordinator approves anything Claude drafts for a customer’s inbox before it is sent.'

const framework: AgenticFramework = {
  title: 'Harbor & Pine Moving Co. · Agentic framework',
  description: 'How Justine Acosta would build Harbor & Pine Moving Co.’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the moving estimate flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · HARBOR & PINE',
  heading: 'How I would build Harbor & Pine with AI',
  lede: 'The tools, the rules and the loop I would use to build the mover’s site, its three flows, its Help-desk RAG bot and its two agents, one small branch at a time, so that the same working day, the written range and “no automated pricing bots” mean exactly what the site says. Harbor & Pine is a fictional mover, and every figure here is illustrative.',
  stance: `I make the calls and the AI does the typing. ${YES} Claude drafts a range for the coordinators only, the move-day message sends on its own, and the Help-desk RAG bot answers live, in the site chat only, never with a price.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Harbor & Pine in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps every price a coordinator’s.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the mover’s system, and one that works inside its estimate flow, bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every promise on the mover’s site kept, from the same-day reply to the estimate that holds.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'HP-01, from Get a free quote to live', blurb: 'The mover’s estimate flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the mover’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the mover (CLAUDE.md), the build plan, a test rate card, test deals in HubSpot, test moves and certificate requests in Airtable, and Stripe test mode, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it. ${YES} The move-day message is a fixed template and sends on its own.` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a customer', 'Approve every change before it goes live', 'Walk each branch with test customers', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the mover’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding what a move costs, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The mover’s pages, the n8n workflow, the Make blueprint and a step list for the Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside the estimate flow, the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a figure that could reach a customer without a coordinator.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside HP-01, the bot and the two agents. It drafts a range for the coordinators only, answers customers from the pricing guide and FAQ, and drafts the reminders a coordinator approves.', note: 'Sonnet inside the flow, bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a customer, and who says yes before it does, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the mover’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the empty rate card, the unanswered request and the button that only opens a form.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like HP-01’s Edit path or HP-02’s Not set route, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only the mover’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test customers and a test rate card. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test request through the mover’s live form and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the mover’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: three short steps, Moving from, Moving to and Target moving date; “A coordinator reads every request and replies the same working day with a written range — or books a walkthrough”; “Same-day written reply, no automated pricing bots”; the estimate holds unless the inventory changes; no deposit to hold a date. Done means every request is a deal before anyone touches it, Claude’s range reaches the coordinators’ group only, and no customer hears a figure until a coordinator answers Approve, Edit or Walkthrough.' },
      { stage: 'Frame', text: 'Wrote HP-01’s spec and its nine test rows before any node: Approve, Edit, a walkthrough on site and by video, nothing without a yes, the button that only opens a form, a customer who asks again, an empty rate card, and a long-distance run.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and Tidy the request, Save the contact and Open the deal, the rate card and Rate card read?, Price the move, the Approve? gate with Limit Wait Time off, Which answer? and its three replies, then Record the deal, with HP-H01 and HP-H02 behind them.' },
      { stage: 'Check', text: 'Ran each row with test customers and a test rate card. The empty rate card row failed: Read the rate card returned nothing, the run ended there without a word, and the request sat at New request with no coordinator told. Then a fresh reviewer model read the n8n export and saw that Send the estimate filled its what-it-covers line from Claude’s draft, so a line Claude wrote could have reached a customer without a coordinator reading it.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every n8n search or read has Always Output Data on and an If after it that says what an empty result does; and no customer template takes a word Claude wrote, only the form’s answers and what a coordinator approved or wrote.' },
      { stage: 'Ship', text: 'I approved it, pointed the form’s third step at /hp/estimate, and sent one test request through the live site. I watched Claude’s draft land in the coordinators’ group marked for coordinators only, sent Approve as a test coordinator, and saw the estimate reach a test inbox in their name the same working day, with the deal at Estimate sent.' },
    ],
    link: { label: 'See Harbor & Pine Moving Co.’s end-to-end workflow', href: '/cases/harbor-and-pine-moving/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and template', text: 'Every change, every template and every prompt Claude will run inside the estimate flow, the bot and the agents is read before it goes anywhere, so no figure reaches a customer without a coordinator.' },
    { mark: '3', icon: 'TestTube', title: 'Test customers, never real ones', text: 'Every branch is walked with made-up test customers, a test rate card, test moves and Stripe test mode before a real customer meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I send a test request through the mover’s real quote form and follow it.' },
  ],
  closing: 'Done is a coordinator’s range in a customer’s inbox the same working day, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside the estimate flow, the bot and the agents as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the flow, the bot and the agents.'],
    ['n8n', 'The automation tool HP-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool the move-day message runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool certificates of insurance run in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'An address a tool posts to. The quote form’s third step posts every request to HP-01’s webhook.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an If can say what an empty result does.'],
    ['Limit Wait Time', 'An n8n setting on a gate. Off here, so the run waits with its data until a coordinator sends the form.'],
    ['Rate card', 'The coordinators’ own sheet of rates, kept by Marisol, which Claude reads to draft a range for them.'],
    ['Written range', 'A low and a high figure for a move, sent to a customer only by a coordinator.'],
    ['Stripe test mode', 'Stripe’s practice mode, where test invoices are paid and no money moves.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like an Edit or a walkthrough, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test customers', 'Made-up customers with made-up moves, so a branch can run without touching a real person.'],
    ['Diff', 'The exact lines a change adds and removes.'],
    ['Second opinion', 'A different model reading the work, to catch what the author missed.'],
    ['Approval gate', `A point where the work stops until a person says yes. ${YES}`],
    ['CLAUDE.md', 'The rules file Claude Code reads at the start of every session.'],
    ['Loop-back', 'A cable that sends the work back to an earlier step.'],
    ['Fold back', 'Turning a mistake into a rule or a test row, so it does not happen again.'],
    ['Fresh session', 'A new, empty AI chat, started clean for the next branch.'],
    ['Test first', 'Writing the test before the code, and watching it fail first.'],
    ['Reviewer model', 'A fresh AI model asked only to review finished work.'],
  ],
  footer: { note: 'A worked example. Harbor & Pine is a fictional mover, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
