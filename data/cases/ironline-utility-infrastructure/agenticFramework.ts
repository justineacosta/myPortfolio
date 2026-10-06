/**
 * Ironline Utility Infrastructure’s Agentic framework case page (spec
 * 2026-10-05 per-site pages): how Justine would build the contractor’s site,
 * its three flows, its Team knowledge bot and its two agents with AI, with
 * IL-01, the bid request flow, taken through the loop. The safety rule is a
 * rule of the build itself: no flow, bot or agent gives a switching, clearance
 * or energized-work instruction. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/ironline-utility-infrastructure/agentic-framework.html. Only
 * type imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, as on Ironline’s other pages. */
const YES = 'The safety director approves anything Claude drafts for company-wide distribution, within 48 hours of the report being filed.'

const framework: AgenticFramework = {
  title: 'Ironline Utility Infrastructure · Agentic framework',
  description: 'How Justine Acosta would build Ironline Utility Infrastructure’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the bid request flow taken from spec to live, and no step that tells a crew how to switch.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · IRONLINE',
  heading: 'How I would build Ironline with AI',
  lede: 'The tools, the rules and the loop I would use to build the contractor’s site, its three flows, its Team knowledge bot and its two agents, one small branch at a time, so that “a superintendent, not a salesperson”, “within one business day”, “within 48 hours” and “within ten business days of energization” mean exactly what the site says, and no step ever touches a switching, clearance or energized-work instruction. Ironline Utility Infrastructure is a fictional contractor, and every figure here is illustrative.',
  stance: `I make the calls and the AI does the typing. ${YES} Switching, clearance and energized-work steps come only from the job brief, the superintendent and system operations, and no flow, bot or agent gives, drafts or changes one.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Ironline in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps every safety call a person’s.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the contractor’s system, and one that works inside its near-miss flow, bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep a utility contractor’s flows out of the switching, clearance and energized-work steps that belong to people.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'IL-01, from Request a bid to live', blurb: 'The contractor’s bid request flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the contractor’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the contractor (CLAUDE.md) with the safety rule at the top, the build plan, test senders, test crew members, test near-miss reports and a test project, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it, and nothing goes live until the safety director signs off its safety rows. ${YES}` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises an owner or a crew', 'Approve every change before it goes live', 'Walk each branch with test senders and test crews', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the contractor’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts writing how a crew should switch, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The contractor’s pages, the n8n workflows, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside the near-miss flow, the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a date worked out in the wrong timezone or a prompt that could write a switching step.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside IL-02, the bot and the two agents. It drafts the near-miss bulletin the safety director approves, answers crews from the field SOPs, and summarises a bid for one superintendent.', note: 'Sonnet inside the flow, bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises an owner or a crew, what it may read, who says yes and which safety steps it must never touch, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the contractor’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the emergency emailed to bids@, the empty rota and the review link that is only opened.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like IL-01’s None path or IL-03’s Sent back path, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it may read and its test row from the build plan, then write the spec, safety rule first. Only the contractor’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test senders, test crews and a test project. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test email to bids@ from outside Ironline and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the contractor’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: there is no form, so Request a bid opens an email to bids@ironlineutility.com for drawings, a scope letter or a two-line description; “A superintendent — not a salesperson — reviews every inquiry and responds within one business day”; the bid desk is (614) 555-0142, Mon–Fri, 6a–6p ET, and the 24/7 line (614) 555-0199. The tempting build has Claude read each email for urgency and page someone on a storm. That is the wrong job for a machine at a utility contractor: storm and emergency calls go to the 24/7 line, where people decide what rolls.' },
      { stage: 'Frame', text: 'So IL-01 reads nothing for urgency and Claude writes none of it. Every email is logged and assigned the same way, and the fixed acknowledgement ends with the 24/7 line. Nor does a reading of the email pick the superintendent: the bid desk sets the Bid duty rota each week, and the flow only applies their choice. Done means every request is logged, in a superintendent’s hands and acknowledged within minutes, with Respond by the end of the next business day. Then I wrote IL-01’s spec and its eleven test rows, among them an emergency by email, an empty rota, two emails in one poll and Ironline’s own mail.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the Gmail Trigger and its search that skips Ironline’s own mail, Find the thread and New request?, Add the follow-up and Pass it on, Log the request, Find who’s on duty and On the rota?, Notify superintendent and Acknowledge the email, then the 6 a.m. due-today check, with IL-H01 and IL-H02 behind them.' },
      { stage: 'Check', text: 'Ran each row with test senders. The two-in-one-poll row failed: both emails arrived in one poll, Find the thread found neither, and Always Output Data handed on one empty item for the whole batch, so one row was logged and one email was lost. Then a fresh reviewer model read the n8n export and saw that Find who’s on duty worked out this week’s Monday in UTC. An email on a Sunday evening, Eastern, would go to the next week’s superintendent, not the one the bid desk put on duty. No daytime test row could show it.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first: IL-01 became two parts, inbox and one email, with Execute Sub-workflow set to Run once for each item, and every date moved to the workflow’s timezone. Two rules went into CLAUDE.md: a search after a trigger that can hand on several items runs in a sub-workflow called once for each item, with Always Output Data on and an If that says what an empty result does; and every date and week in an Ironline flow is worked out in America/New_York.' },
      { stage: 'Ship', text: 'I approved it, the bid desk read the acknowledgement, the safety director signed off the emergency-by-email row, and I turned the inbox part on. I sent one test email to bids@ from outside Ironline asking for a bid on 40 distribution poles, watched the row appear, the test superintendent on the rota hear on Telegram, and the acknowledgement with (614) 555-0199 reach the test inbox within minutes.' },
    ],
    link: { label: 'See Ironline Utility Infrastructure’s end-to-end workflow', href: '/cases/ironline-utility-infrastructure/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, every template and every prompt Claude will run inside the near-miss flow, the bot and the agents is read before it goes anywhere, so nothing can write a switching, clearance or energized-work step.' },
    { mark: '3', icon: 'TestTube', title: 'Test senders, never real ones', text: 'Every branch is walked with made-up test senders, test crew members, test near-miss reports and a test project before a real owner or crew meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I press Request a bid on the contractor’s real site, send the email, and follow it.' },
  ],
  closing: 'Done is a superintendent holding a bid request within minutes of the email, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model inside the near-miss flow, the bot and the two agents once they ship. Claude Code is what builds them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the flow, the bot and the agents.'],
    ['n8n', 'The automation tool IL-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool near-miss reviews run in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool closeouts run in. Each Zap is built by hand from its step list.'],
    ['Gmail Trigger', 'The n8n node that checks the bids@ inbox every minute and hands on each new email.'],
    ['Execute Sub-workflow', 'An n8n node that hands items to another workflow; set to Run once for each item, it hands them on one at a time.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an If can say what an empty result does.'],
    ['Rota', 'The Bid duty table, where the bid desk puts one superintendent on bid duty each week.'],
    ['Job brief', 'The documented brief every Ironline task starts with, where switching, clearance and energized-work steps come from.'],
    ['Safety director', 'The person who approves every near-miss bulletin and signs off the safety test rows.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like None or Sent back, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test senders', 'Made-up senders with made-up names, so a branch can run without touching a real owner.'],
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
  footer: { note: 'A worked example. Ironline Utility Infrastructure is a fictional contractor, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
