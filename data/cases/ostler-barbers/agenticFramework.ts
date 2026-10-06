/**
 * Ostler’s Agentic framework case page (spec 2026-10-05 per-site pages): how
 * Justine would build the shop’s site, its three flows, its Shop Q&A bot and
 * its two agents with AI, with OS-01, the chair booking flow, taken through the
 * loop. data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/ostler-barbers/agentic-framework.html. Only type imports, so
 * Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, word for word as on Ostler’s other pages. */
const YES = 'The client’s barber approves anything Claude drafts for a client’s inbox before it is sent.'

const framework: AgenticFramework = {
  title: 'Ostler · Agentic framework',
  description: 'How Justine Acosta would build Ostler’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the chair booking flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · OSTLER',
  heading: 'How I would build Ostler with AI',
  lede: 'The tools, the rules and the loop I would use to build the shop’s site, its three flows, its Shop Q&A bot and its two agents, one small branch at a time, so that every price, every hour and the 24-hour free cancellation say exactly what the site says.',
  stance: `I make the calls and the AI does the typing. ${YES} A templated confirmation sends on its own, and the Shop Q&A bot answers live, in the site chat only.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Ostler in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps the shop’s flows honest.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the shop’s system, and one that works inside its bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every promise on the shop’s site kept, from the 24-hour line to the cap of forty.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'OS-01, from Book a chair to live', blurb: 'The shop’s chair booking flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the shop’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the shop (CLAUDE.md), the build plan, and test bookings in a test Cal.com book for each barber, test members and orders in Airtable, and Stripe test mode, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it. ${YES} A templated confirmation sends on its own.` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a client', 'Approve every change before it goes live', 'Walk each branch with test bookings', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the shop’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts deciding what a cut costs or when a barber is free, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The shop’s pages, the n8n workflow, the Make blueprint and a step list for the Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a price, a time or a promise that drifts from the site.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside the bot and the two agents. It answers visitors from the shop’s pages, and drafts the freed-hour offers and next-cut notes each barber approves. None of the three flows uses it.', note: 'Sonnet inside the bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a client, and which barber’s book it touches, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the shop’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the late cancellation, the member’s visit and the empty search.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like OS-01’s Cancelled path or OS-02’s Full route, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it reads and its test row from the build plan, then write the spec. Only the shop’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test bookings in each barber’s Cal.com book and Stripe test cards. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I book one test chair through the shop’s live site and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the shop’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: no form, just Book a chair and Book with Tomas, Jonah or Arun; each barber keeps their own book; Leo cuts at chair four on Tuesdays and Wednesdays for £34; and cancel up to 24 hours ahead at no charge. Done means every booking is confirmed within a minute, naming its barber, reminded at 07:00 the morning before while the free cancellation stands, and every cancellation frees the chair and tells the Front room group.' },
      { stage: 'Frame', text: 'Wrote OS-01’s spec and its twelve test rows before any node: a booking, Leo’s chair, a member’s visit, a move with and without its old row, a cancellation found, late and not found, a reminder due, a booking made after the run, a morning with nothing due, and a step that fails.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and Keep the booking, the What happened? switch, the Booked path to Confirm the chair, the Moved path, the Cancelled path to the Front room, then the 07:00 reminder run, with OS-H01 and OS-H02 behind them.' },
      { stage: 'Check', text: 'Ran each row with test bookings in each barber’s Cal.com book. The Cancelled, not found row failed: Find the booking returned nothing, the run ended there without a word, and the Front room group never heard the chair was free. Then a fresh reviewer model read the n8n export and saw that Confirm the chair printed a pound sign and an empty price for a Member’s cut, where the confirmation should say Covered by your membership.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every n8n search has Always Output Data on and an If after it that says what an empty result does; and Price only ever means the site’s list price, empty for a Member’s cut or Member’s tidy, so every template that prints it has the membership line.' },
      { stage: 'Ship', text: 'I approved it, added the webhook to each barber’s Cal.com account, booked one test chair with each barber through the live site, Leo on a Tuesday, and watched each confirmation land. I cancelled one and saw the Front room group told, then watched the next 07:00 run remind the rest.' },
    ],
    link: { label: 'See Ostler’s end-to-end workflow', href: '/cases/ostler-barbers/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and template', text: 'Every change, every template and every prompt Claude will run inside the bot and the agents is read before it goes anywhere, so no price or time drifts from the site.' },
    { mark: '3', icon: 'TestTube', title: 'Test bookings, never real clients', text: 'Every branch is walked with made-up test clients, test bookings in each barber’s book and Stripe test cards before a real client meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I book a test chair through the shop’s real Book a chair and follow it.' },
  ],
  closing: 'Done is a chair confirmed with the right barber, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model, which works inside the shop’s bot and agents as well as building them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the bot and agents.'],
    ['n8n', 'The automation tool OS-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool new memberships run in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool shelf orders run in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'An address a tool posts to. Each barber’s Cal.com account posts every booking to OS-01’s webhook.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an If can say what an empty result does.'],
    ['Member’s cut', 'A member’s own visit, booked by their barber with no price, as membership covers it, like a Member’s tidy between cuts.'],
    ['Front room', 'The shop’s Telegram group, which hears whose chair is free.'],
    ['Stripe test mode', 'Stripe’s practice mode, where test cards pay and no money moves.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like a cancellation or a move, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test bookings', 'Made-up bookings for made-up clients in each barber’s Cal.com book, so a branch can run without touching a real person.'],
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
  footer: { note: 'A worked example. Ostler is a fictional barbershop, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
