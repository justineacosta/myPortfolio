/**
 * Riverdale & Brooks’s Agentic framework case page (spec 2026-10-05 per-site
 * pages): how Justine would build the firm’s site, its three flows, its
 * Practice Q&A bot and its two agents with AI, under the legal rule, with RB-01
 * taken through the loop. data/cases/index.ts registers it; `npm run cases`
 * renders it into public/cases/riverdale-and-brooks/agentic-framework.html.
 * Only type imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, word for word as on the firm’s other pages. */
const YES = 'Ruth approves any reply Claude drafts before it reaches anyone’s inbox, Daniel approves every monthly invoice before it goes out.'

const framework: AgenticFramework = {
  title: 'Riverdale & Brooks · Agentic framework',
  description: 'How Justine Acosta would build Riverdale & Brooks’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the consultation request flow taken from spec to live and nothing confidential in any of it.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · RIVERDALE & BROOKS',
  heading: 'How I would build Riverdale & Brooks with AI',
  lede: 'The tools, the rules and the loop I would use to build the firm’s site, its three flows, its Practice Q&A bot and its two agents, one small branch at a time, under one rule above the rest: nothing confidential in any of them, and no legal advice from any of them.',
  stance: `I make the calls and the AI does the typing. ${YES} The legal rule holds everywhere: nothing confidential is stored in Claude, Airtable, Telegram or any flow, and the conflict check is done by hand.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Riverdale & Brooks in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps the firm’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the firm’s system, and one that works inside its bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every promise on the firm’s site kept, and everything confidential with Daniel.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'RB-01, from Send request to live', blurb: 'The firm’s consultation request flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the firm’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the firm (CLAUDE.md) with the legal rule at the top, the build plan, and test contacts, test matters, Stripe test mode and a test calendar in Airtable, Stripe and Cal.com, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it. ${YES} A templated reply or notice sends on its own.` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a client', 'Approve every change before it goes live', 'Walk each branch with test contacts', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the firm’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding what counts as confidential or as legal advice, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The firm’s pages, the n8n workflow, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, and every prompt Claude will run inside the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, and for any path by which something confidential could slip through.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the bot and the two agents. It answers visitors from the site, sorts office@, drafts replies for Ruth and preps Daniel for each consultation. None of the three flows uses it, and it never gives legal advice.', note: 'Sonnet inside the bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a client, and what it must never carry, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the firm’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the rows that prove nothing confidential gets through.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like RB-02’s No Stripe route, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only the firm’s facts, the legal rule and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test contacts, Stripe test cards and markers like TEST-SITUATION-01, never a real problem. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test request through the firm’s live site and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the firm’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: one form, Request a consultation, with an optional box for a few sentences about a situation and the line “Please don’t include confidential details yet”, a reply promised within one business day, and a consultation that is free for estate planning and otherwise $150 for thirty minutes, credited. Done means every request gets the right fee and a link to request a time within a minute, Ruth knows who asked, and the few sentences reach Daniel’s inbox alone and are saved nowhere.' },
      { stage: 'Frame', text: 'Wrote RB-01’s spec and its eight test rows before any node: estate planning with the box filled, another area left blank, Something else, the same email twice, a sweep for TEST-SITUATION-01 in every store, a step that fails, the Cal.com pages asking nothing more, and a booking held as a request until Ruth confirms it.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and Keep contact and area, the Contacts row, Situation written? and the email to Daniel on his own connection, the Estate planning? switch and its two template replies, then the alert to Ruth through RB-H01.' },
      { stage: 'Check', text: 'Ran each row with test contacts and a test calendar. The TEST-SITUATION-01 sweep failed: Alert Ruth read the form from the Webhook step rather than from Keep contact and area, and the marker reached Ruth’s Telegram. Then a fresh reviewer model read the n8n export and saw that To Daniel’s inbox used the office@ connection, so a copy of the few sentences sat in the sent mail of office@, the shared mailbox, instead of only in Daniel’s own.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: only Situation written? and To Daniel’s inbox may read the few sentences, and every other step reads from Keep contact and area; and the few sentences travel only on Daniel’s own Gmail connection, from and to daniel@, which no other step uses.' },
      { stage: 'Ship', text: 'I approved it, pointed Send request at /rb/consultation, sent one test request carrying TEST-SITUATION-01 through the live site, and watched the free reply land, Ruth’s alert reach Telegram without the marker, and the marker reach Daniel’s inbox alone, with no execution saved in n8n.' },
    ],
    link: { label: 'See Riverdale & Brooks’s end-to-end workflow', href: '/cases/riverdale-and-brooks/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, and every prompt Claude will run inside the bot and the agents, is read before it goes anywhere, so none of them can drift into legal advice.' },
    { mark: '3', icon: 'TestTube', title: 'Test contacts, never real problems', text: 'Every branch is walked with made-up test contacts, test matters and Stripe test cards before a real client meets it. No test row describes a legal problem: a marker like TEST-SITUATION-01 stands in.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I send a test request through the firm’s real Request a consultation form and follow it.' },
  ],
  closing: 'Done is a request answered with the right fee, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside the firm’s bot and agents as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the bot and agents.'],
    ['Legal rule', 'Nothing confidential is stored in Claude, Airtable, Telegram or any flow, and the conflict check is done by hand. What a matter is about stays with Daniel.'],
    ['Legal advice', 'Advice on someone’s own situation. Daniel gives it to his clients; no bot or agent ever does.'],
    ['Conflict check', 'Making sure the firm acts for no one on the other side. Daniel or Ruth runs it by hand, never a flow.'],
    ['Few sentences', 'The optional box on the form. They pass through n8n and Gmail only to reach Daniel’s inbox, and are saved nowhere.'],
    ['n8n', 'The automation tool RB-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool the monthly invoice runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool the milestone notice runs in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'An address a form posts to. Send request posts to RB-01’s webhook, /rb/consultation.'],
    ['Connection', 'A sign-in a platform holds for one account. Daniel’s Gmail connections are his alone, and only the steps that send or draft from his address use them.'],
    ['Execution', 'n8n’s saved copy of a run. RB-01 saves none, so no request is kept in n8n.'],
    ['Stripe test mode', 'Stripe’s practice mode, where test cards pay and no money moves.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like No Stripe or a request left blank, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test contacts', 'Made-up people with made-up names and emails, so a branch can run without touching a real person.'],
    ['TEST-SITUATION-01', 'A marker that stands in for the few sentences in a test, so a test never describes a real or made-up legal problem.'],
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
  footer: { note: 'A worked example. Riverdale & Brooks is a fictional law practice, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
