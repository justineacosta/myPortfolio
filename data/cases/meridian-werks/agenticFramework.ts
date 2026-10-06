/**
 * Meridian Werks’ Agentic framework case page (spec 2026-10-05 per-site
 * pages): how Justine would build the workshop’s site, its three flows, its
 * Workshop Q&A bot and its two agents with AI, with MW-01, the service
 * booking flow, taken through the loop. The workshop’s rule is a rule of the
 * build itself: no flow, bot or agent diagnoses a car or quotes a price.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/meridian-werks/agentic-framework.html. Only type imports, so
 * Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, as on Meridian Werks’ other pages. */
const YES = 'Ilse Brandt, the workshop manager, approves anything Claude drafts for a customer’s inbox before it is sent.'

const framework: AgenticFramework = {
  title: 'Meridian Werks · Agentic framework',
  description: 'How Justine Acosta would build Meridian Werks’ site, flows, bot and agents with AI: the tools, the rules and the loop, with the service booking flow taken from spec to live, and no step that diagnoses a car or quotes a price.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · MERIDIAN WERKS',
  heading: 'How I would build Meridian Werks with AI',
  lede: 'The tools, the rules and the loop I would use to build the workshop’s site, its three flows, its Workshop Q&A bot and its two agents, one small branch at a time, so that “We confirm by phone within one working day”, “No work begins before the findings are documented and approved” and “Any variation is approved before it happens” mean exactly what the site says, and no step ever diagnoses a car or quotes a price. Meridian Werks is a fictional Rotterdam workshop, and every figure here is illustrative.',
  stance: `I make the calls and the AI does the typing. ${YES} No flow, bot or agent diagnoses a fault, guesses a cause or quotes a price: diagnosis is the workshop’s job, and Ilse prices every fixed estimate, in euros. A registration number stays on the job card.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Meridian Werks in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps every diagnosis and every price a person’s.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the workshop’s system, and one that works inside its health report flow, its bot and its agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep a workshop’s flows out of the diagnosis and the pricing, which belong to people.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'MW-01, from Book a service to live', blurb: 'The workshop’s service booking flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the workshop’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the workshop (CLAUDE.md) with the no-diagnosis rule at the top, the build plan, test owners, test cars with made-up registrations and a test fleet client, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it, and nothing goes live until Ilse and Anton sign off its promise rows. ${YES}` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises an owner', 'Approve every change before it goes live', 'Walk each branch with test owners and test cars', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the workshop’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts guessing what a knock means, or I start placing boilerplate steps by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The workshop’s pages, the n8n workflows, the Make blueprints and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside the health report flow, the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a field mapped into the wrong place or a prompt that could name a cause.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside MW-02, the bot and the two agents. It rewords the technician’s findings for Ilse to check, answers visitors from the workshop’s pages, drafts replies for Ilse’s yes and writes the Monday summary.', note: 'Sonnet inside the flow, bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises an owner, what it may read, who says yes and that it never diagnoses or prices, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the workshop’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the slot just taken, the Friday-evening booking and the answer link that is only opened.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like MW-01’s slot just taken or MW-02’s variation, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it may read and its test row from the build plan, then write the spec, the no-diagnosis rule first. Only the workshop’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the Zap’s steps, the n8n nodes, the Make route or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test owners and test cars. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I book one test service on the real site and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the workshop’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: Book a service is four short steps, the vehicle, the service, the date and the details, with the registration optional; “Describe the symptom rather than the repair. Diagnosis is our job”; and “We confirm by phone within one working day”, on +31 10 244 1180, Mon–Fri 07:30–18:00. The tempting build emails a confirmation the moment the form arrives, and has Claude read the symptom to suggest the right service. Both are wrong for this workshop: the confirmation is Ilse’s call, and the symptom is for a technician to diagnose.' },
      { stage: 'Frame', text: 'So MW-01 reads nothing in the symptom, and Claude writes none of it. The slot is held in Cal.com as a request that waits for Ilse, the job card keeps the registration and nothing else does, and the owner’s email is a receipt that says Ilse will call. Done means every booking is held, carded and receipted within a minute, and on Ilse’s list of calls by the end of the next working day. Then I wrote MW-01’s spec and its nine test rows, among them the slot just taken, a Friday-evening booking and an expired Cal.com key.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the Catch Hook, Hold the slot as Code by Zapier posting to Cal.com’s API, Word the receipt, Open a job card, Tell the workshop and Email the owner, then the calls-due Zap and its 07:30 list for Ilse, with the two Zapier Manager zaps behind them, posting to MW-H02.' },
      { stage: 'Check', text: 'Ran each row with test owners and test cars. The slot-just-taken row failed: Cal.com refused the second booking, Hold the slot errored and the Zap stopped, so there was no job card and no receipt, and the owner heard nothing. Then a fresh reviewer model read the Zap’s step list and saw that Hold the slot sent Cal.com the whole form as the booking’s notes, the registration included, so it sat in the workshop calendar. No row that checked only the card and the messages could show it.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first: Hold the slot now returns held yes or no and never errors on a taken slot, and the receipt’s line comes from a Formatter Lookup Table, so the Zap stays one straight line with no Paths. It sends Cal.com the slot, the name, the email, the make, the model and the service by name, and t01 now checks the booking for a registration. Two rules went into CLAUDE.md: a step that can be refused returns its answer instead of stopping the Zap; and no step sends the whole form, only named fields, never the registration outside the job card.' },
      { stage: 'Ship', text: 'I approved it, Ilse read the receipt and signed off the promise rows t01, t02 and t07, and I turned the book Zap on. I booked a test Mechanical Service on the workshop’s real site and watched the slot held as a request in Cal.com, the job card open, the workshop group hear it with no registration, the receipt reach the test inbox within a minute, and the booking on Ilse’s 07:30 list the next working morning.' },
    ],
    link: { label: 'See Meridian Werks’s end-to-end workflow', href: '/cases/meridian-werks/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, every template and every prompt Claude will run inside the health report flow, the bot and the agents is read before it goes anywhere, so nothing can name a cause, a part or a price.' },
    { mark: '3', icon: 'TestTube', title: 'Test owners, never real ones', text: 'Every branch is walked with made-up test owners, test cars with made-up registrations and a test fleet client before a real owner meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I press Book a service on the workshop’s real site, send the four steps, and follow them.' },
  ],
  closing: 'Done is an owner’s booking on Ilse’s list of calls within a minute of the form, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model inside the health report flow, the bot and the two agents once they ship. Claude Code is what builds them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the flow, the bot and the agents.'],
    ['Zapier', 'The automation tool MW-01 runs in. Each Zap is built by hand from its step list.'],
    ['Code by Zapier', 'A Zapier step that runs a few lines of JavaScript, here to post the booking to Cal.com’s API.'],
    ['Formatter Lookup Table', 'A Zapier step that picks a value by another, here the receipt’s line by whether the slot was held.'],
    ['Paths', 'Zapier’s branches. Paths never rejoin, so MW-01 uses none.'],
    ['n8n', 'The automation tool MW-02, the bot and the agents run in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool fleet reports run in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Cal.com', 'The workshop calendar, where a booking waits as a request until Ilse confirms it by phone.'],
    ['Job card', 'One row in Airtable per booking, and the only place a registration is kept.'],
    ['Receipt', 'The owner’s email after booking. It says Ilse will call; the call is the confirmation.'],
    ['Promise rows', 'The test rows that prove what the site promises, signed off by Ilse and Anton before go-live.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like the slot just taken, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test owners', 'Made-up owners with made-up cars and registrations, so a branch can run without touching a real one.'],
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
  footer: { note: 'A worked example. Meridian Werks is a fictional workshop, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
