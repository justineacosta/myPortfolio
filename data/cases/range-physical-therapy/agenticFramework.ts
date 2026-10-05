/**
 * Range Physical Therapy’s Agentic framework case page (spec 2026-10-05
 * per-site pages): how Justine would build Range’s site, its three flows, its
 * Clinic Q&A bot and its two agents with AI, under the clinical rule, with
 * RP-01 taken through the loop. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/range-physical-therapy/agentic-framework.html. Only type
 * imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

const framework: AgenticFramework = {
  title: 'Range Physical Therapy · Agentic framework',
  description: 'How Justine Acosta would build Range Physical Therapy’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the evaluation booking flow taken from spec to live and nothing clinical in any of it.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · RANGE PHYSICAL THERAPY',
  heading: 'How I would build Range Physical Therapy with AI',
  lede: 'The tools, the rules and the loop I would use to build Range’s site, its three flows, its Clinic Q&A bot and its two agents, one small branch at a time, under one rule above the rest: nothing clinical in any of them.',
  stance: 'I make the calls and the AI does the typing. Mara approves anything Claude drafts for a patient’s inbox and makes any refund or change to a plan herself, and the clinical rule holds everywhere: nothing clinical is stored, summarised or forwarded by Claude, Airtable or any flow.',
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Range in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps Range’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build Range, and one that works inside its bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every promise on Range’s site kept, and everything clinical with Mara.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'RP-01, from Schedule your evaluation to live', blurb: 'Range’s evaluation booking flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason Range’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for Range (CLAUDE.md) with the clinical rule at the top, the build plan, and test patients, Stripe test mode and a test calendar in Airtable, Stripe and Cal.com, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: 'Nothing is published or switched on until I approve it. Mara approves anything Claude drafts for a patient’s inbox, and makes any refund or change to a plan herself.' },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a patient', 'Approve every change before it goes live', 'Walk each branch with test patients', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read Range’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding what counts as clinical, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. Range’s pages, the n8n workflow, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, and every prompt Claude will run inside the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, and for anything clinical that could slip through.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the bot and the two agents. It answers visitors from the site, sorts the inbox and drafts replies for Mara. None of the three flows uses it, and it never gives clinical advice or sends on its own.', note: 'Sonnet inside the bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a patient, and what it must never carry, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: 'Agents draft. Nothing reaches Range’s live site or a switched-on flow unreviewed, Mara approves anything Claude drafts for a patient’s inbox, and no refund or change to a plan happens without her.', note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the rows that prove nothing clinical gets through.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like RP-02’s No match path, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only Range’s facts, the clinical rule and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test patients, Stripe test cards and markers like TEST-NOTE-01, never a symptom. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I book one test evaluation through Range’s live site and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in Range’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: there is no form, only Schedule your evaluation and Reserve, which open Mara’s Cal.com calendar, and a promise that Mara will be in touch before your visit. Done means every new evaluation gets the intake and what-to-wear email within a minute, Mara knows who is coming, and nothing clinical enters n8n, Airtable or Gmail.' },
      { stage: 'Frame', text: 'Wrote RP-01’s spec and its six test rows before any node: an evaluation booked, one within a day, a follow-up or a free call, the same email twice, a booking carrying TEST-NOTE-01, and a step that fails.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the Cal.com trigger and the filter, Keep scheduling only, the Patients row, the template intake email, then the alert to Mara through RP-H01.' },
      { stage: 'Check', text: 'Ran each row with test patients and a test calendar. The TEST-NOTE-01 row failed: Keep scheduling only still had Include Other Input Fields on, and the marker reached the Patients row. Then a fresh reviewer model read the n8n export and saw that n8n saved every execution, so each booking, marker and all, sat in n8n’s run history.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every Edit Fields step has Include Other Input Fields off, and a workflow that touches a booking or an email saves no executions, successful, failed or manual.' },
      { stage: 'Ship', text: 'I approved it, pointed Schedule your evaluation and Reserve at the Initial evaluation page, booked one test evaluation through the live site, and watched the intake email land and Mara’s alert reach Telegram, with no execution saved in n8n.' },
    ],
    link: { label: 'See Range Physical Therapy’s end-to-end workflow', href: '/cases/range-physical-therapy/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, and every prompt Claude will run inside the bot and the agents, is read before it goes anywhere.' },
    { mark: '3', icon: 'TestTube', title: 'Test patients, never symptoms', text: 'Every branch is walked with made-up test patients and Stripe test cards before a real patient meets it. No test row uses a symptom: a marker like TEST-NOTE-01 stands in.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I book a test evaluation through Range’s real Schedule your evaluation and follow it.' },
  ],
  closing: 'Done is a patient booked and greeted, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside Range’s bot and agents as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the bot and agents.'],
    ['Clinical rule', 'Nothing clinical is stored, summarised or forwarded by Claude, Airtable or any flow. It stays with Mara.'],
    ['n8n', 'The automation tool RP-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool the superbill runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool the six-visit plan runs in. Each Zap is built by hand from its step list.'],
    ['Edit Fields', 'The n8n step that keeps only the fields named in it.'],
    ['Include Other Input Fields', 'An Edit Fields setting. Left off, anything not named in the step stops there.'],
    ['Execution', 'n8n’s saved copy of a run. Range’s workflows save none, so no booking is kept in n8n.'],
    ['Stripe test mode', 'Stripe’s practice mode, where test cards pay and no money moves.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like No match or a booking that is not an evaluation, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test patient', 'A made-up patient with a made-up name and date of birth, so a branch can run without touching a real person.'],
    ['TEST-NOTE-01', 'A marker that stands in for clinical text in a test, so a test never uses a real symptom.'],
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
  footer: { note: 'A worked example. Range Physical Therapy is a fictional clinic, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
