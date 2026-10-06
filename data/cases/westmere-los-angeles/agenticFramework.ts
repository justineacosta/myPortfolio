/**
 * Westmere’s Agentic framework case page (spec 2026-10-05 per-site pages):
 * how Justine would build the developer’s site, its three flows, its Document
 * Q&A bot and its two agents with AI, with WM-01, the residence enquiry flow,
 * taken through the loop, including the fair-housing redesign of “Qualify the
 * buyer” into “Read the enquiry”. data/cases/index.ts registers it;
 * `npm run cases` renders it into
 * public/cases/westmere-los-angeles/agentic-framework.html. Only type imports,
 * so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, as on Westmere’s other pages. */
const YES = 'The hosting agent approves anything Claude drafts for a buyer’s inbox before it is sent.'

const framework: AgenticFramework = {
  title: 'Westmere · Agentic framework',
  description: 'How Justine Acosta would build Westmere’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the residence enquiry flow taken from spec to live.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · WESTMERE',
  heading: 'How I would build Westmere with AI',
  lede: 'The tools, the rules and the loop I would use to build the developer’s site, its three flows, its Document Q&A bot and its two agents, one small branch at a time, so that fair housing, “by appointment only” and “available in full to qualified buyers” mean exactly what the site says. Westmere is a fictional developer, and every figure here is illustrative.',
  stance: `I make the calls and the AI does the typing. ${YES} The sales director alone confirms proof of funds, and no flow, bot or agent screens, scores, sorts or ranks a buyer.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Westmere in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps every judgement about a buyer a person’s.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the developer’s system, and one that works inside its enquiry flow, bot and agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep every buyer treated the same, from the first enquiry to the valuation pack.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'WM-01, from Enquire on this residence to live', blurb: 'The developer’s enquiry flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the developer’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the developer (CLAUDE.md), the build plan, test buyers and a test residence, test viewings in Cal.com and a test valuation pack, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it, and nothing touching how a buyer is routed until the sales director signs off its fair-housing rows. ${YES}` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a buyer', 'Approve every change before it goes live', 'Walk each branch with test buyers', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the developer’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts judging who a buyer is, or I start placing boilerplate nodes by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The developer’s pages, the n8n workflow, the Make blueprint and a step list for the Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside the enquiry flow, the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a field that lets a step see who a buyer is.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside WM-01, the bot and the two agents. It reads an enquiry for three answers, answers the sales team from the contracts, and drafts the follow-ups the hosting agent approves.', note: 'Sonnet inside the flow, bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a buyer, what it may read and who says yes before it does, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the developer’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the residence that is not found, the same words under other names and the review link that is only opened.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like WM-01’s Not yet path or WM-02’s None route, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it may read and its test row from the build plan, then write the spec. Only the developer’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the n8n nodes, the Make route, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test buyers and a test residence. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I send one test enquiry through the developer’s live site and follow the run to the end. Then the next branch starts.' },
      { id: 'fold', at: [2, 1], kind: 'step', label: 'Fold back', sub: 'Into CLAUDE.md', icon: 'ArrowsClockwise', what: 'Whatever went wrong becomes a rule in the developer’s CLAUDE.md or a new test row, so the next branch does not repeat it.' },
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
      { stage: 'Frame', text: 'Read the site: Enquire on this residence on each residence’s page; “Private viewings are held Tuesday to Saturday, by appointment only”; valuation figures “available in full to qualified buyers”; Equal Housing Opportunity, DRE #02114471. My first sketch of this flow had a step called Qualify the buyer, which judged a budget, a timeline or a request to visit. Under fair housing that is the wrong job for a machine: a qualified buyer means proof of funds, and a person decides it.' },
      { stage: 'Frame', text: 'So Qualify the buyer became Read the enquiry: Claude’s Information Extractor pulls out three things the buyer stated, asked to view, asked to talk and a timeline, from the message and the residence only, never a budget and never the name. A fixed IF rule routes on those three, and both paths get the same brochure. Done means serious buyers reach the listing agent within minutes and everyone else stays on the list. Then I wrote WM-01’s spec and its ten test rows, three of them for fair housing: the same words under other names, the same message in Spanish, and lines about family or faith added.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the webhook and Tidy the enquiry, Save the contact, Find the residence and Residence found?, Read the enquiry with its three attributes and no others, Ready to view? and its two paths, then Send the brochure and Note the route, with WM-H01 and WM-H02 behind them.' },
      { stage: 'Check', text: 'Ran each row with test buyers and a test residence. The residence-not-found row failed: the Airtable search returned nothing, the run ended there without a word, and the buyer was saved with no brochure and no one told. Then a fresh reviewer model read the n8n export and saw that Read the enquiry took the whole item from Save the contact, so the buyer’s name and email reached Claude. The route would have been the same, but the rule says Claude never sees who is asking, and the same-words row could not prove it.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first. Two rules went into CLAUDE.md: every n8n search has Always Output Data on and an If after it that says what an empty result does; and Claude’s input in any Westmere flow is built field by field from the message and the residence, never passed through whole.' },
      { stage: 'Ship', text: 'I approved it, the sales director signed off the fair-housing rows, and I pointed the enquiry panel at /wm/enquiry. I sent one test enquiry through the live site asking to view The Orchard Residences, watched the message reach a test listing agent’s Telegram within minutes, the brochure reach a test inbox, and the contact show With an agent.' },
    ],
    link: { label: 'See Westmere’s end-to-end workflow', href: '/cases/westmere-los-angeles/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, every template and every prompt Claude will run inside the enquiry flow, the bot and the agents is read before it goes anywhere, so nothing reads who a buyer is.' },
    { mark: '3', icon: 'TestTube', title: 'Test buyers, never real ones', text: 'Every branch is walked with made-up test buyers, a test residence, test viewings and a test valuation pack before a real buyer meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I send a test enquiry through the developer’s real residence page and follow it.' },
  ],
  closing: 'Done is a buyer who asked to view hearing from a person within minutes, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model inside the enquiry flow, the bot and the two agents once they ship. Claude Code is what builds them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the flow, the bot and the agents.'],
    ['n8n', 'The automation tool WM-01 runs in. A workflow can be written as a file and imported.'],
    ['Make', 'The automation tool private viewings run in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Zapier', 'The automation tool portfolio requests run in. Each Zap is built by hand from its step list.'],
    ['Webhook', 'An address a tool posts to. The enquiry panel posts every enquiry to WM-01’s webhook.'],
    ['Information Extractor', 'An n8n node that has Claude fill a fixed set of fields from text, and nothing else.'],
    ['Always Output Data', 'An n8n setting that lets a search that finds nothing go on, so an If can say what an empty result does.'],
    ['Fair housing', 'The rule that no buyer is screened, sorted or scored on who they are. Westmere is an Equal Housing Opportunity developer.'],
    ['Proof of funds', 'The only thing that makes a buyer qualified, and the sales director’s call, by hand.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like Not yet or None, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test buyers', 'Made-up buyers with made-up names, so a branch can run without touching a real person.'],
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
  footer: { note: 'A worked example. Westmere is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
