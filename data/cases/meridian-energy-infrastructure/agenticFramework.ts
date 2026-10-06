/**
 * Meridian Energy Infrastructure’s Agentic framework case page (spec
 * 2026-10-05 per-site pages): how Justine would build the developer’s site,
 * its three flows, its Website sales bot and its two agents with AI, with
 * ME-01, the site survey flow, taken through the loop. The electrical safety
 * rule and the guarantee rule are rules of the build itself: no flow, bot or
 * agent tells a client to touch equipment, and none decides a payment.
 * data/cases/index.ts registers it; `npm run cases` renders it into
 * public/cases/meridian-energy-infrastructure/agentic-framework.html. Only
 * type imports, so Node can run it directly.
 */
import type { AgenticFramework, Cable } from '../../agenticFramework.ts'

const flow = (from: string, to: string, label?: string): Cable => ({ from, to, kind: 'flow', ...(label ? { label } : {}) })
const loop = (from: string, to: string, label: string): Cable => ({ from, to, kind: 'loop', label })

/** The person’s-yes rule, as on Meridian Energy Infrastructure’s other pages. */
const YES = 'An energy advisor approves every first email Claude drafts for a prospect’s inbox, and the asset manager approves every report note before the report reaches a client.'

const framework: AgenticFramework = {
  title: 'Meridian Energy Infrastructure · Agentic framework',
  description: 'How Justine Acosta would build Meridian Energy Infrastructure’s site, flows, bot and agents with AI: the tools, the rules and the loop, with the site survey flow taken from spec to live, no step that tells a client to touch equipment and no step that decides a payment.',
  home: 'Justine Acosta · Portfolio',
  kicker: 'AGENTIC FRAMEWORK · MERIDIAN ENERGY',
  heading: 'How I would build Meridian Energy Infrastructure with AI',
  lede: 'The tools, the rules and the loop I would use to build the developer’s site, its three flows, its Website sales bot and its two agents, one small branch at a time, so that “An energy advisor will confirm a drone survey window within one business day”, “a contracted 48-hour response on any production fault” and “If the asset underperforms the model, we write the cheque” mean exactly what the site says. No step ever tells a client to touch equipment, and no step decides a payment. Meridian Energy Infrastructure is a fictional commercial solar and storage developer, and every figure here is illustrative.',
  stance: `I make the calls and the AI does the typing. ${YES} No flow, bot or agent tells a client to touch, reset or isolate equipment: emergencies go to 911 and the utility, and the duty lead dispatches every technician by phone. No step works out, proposes or promises a payment under the production guarantee: the asset manager decides it, by hand.`,
  sections: [
    { id: 'glance', chip: 'At a glance', kicker: 'AT A GLANCE', title: 'Set up once, then loop, then ship', blurb: 'The whole framework for Meridian Energy Infrastructure in three lines.' },
    { id: 'jobs', chip: 'Two jobs', kicker: 'TWO JOBS', title: 'Who does what', blurb: 'The split that keeps every equipment step, every site’s number and every payment a person’s.' },
    { id: 'tools', chip: 'Tools', kicker: 'THE TOOLS', title: 'Four tools, one job each', blurb: 'Three to build the developer’s system, and one that works inside its scoring step, its bot and its agents.' },
    { id: 'rules', chip: 'Rules', kicker: 'THE RULES', title: 'Four rules I do not break', blurb: 'They are what keep an energy developer’s flows away from its equipment and its cheques, which belong to people.' },
    { id: 'loop', chip: 'The loop', kicker: 'THE LOOP', title: 'Frame, build, check, fold back', blurb: 'Four steps, repeated for every branch until its test row passes. Click any step or pin.' },
    { id: 'example', chip: 'Example', kicker: 'A WORKED EXAMPLE', title: 'ME-01, from Book the site survey to live', blurb: 'The developer’s site survey flow, taken through the loop.' },
    { id: 'habits', chip: 'Habits', kicker: 'HABITS', title: 'What I do every time', blurb: 'Small, boring, and the reason the developer’s flows keep working.' },
    { id: 'glossary', chip: 'Glossary', kicker: 'PLAIN ENGLISH', title: 'Every term on this page, in one line', blurb: 'Plain English for the technical words above.' },
  ],
  stages: [
    { mark: '1', icon: 'Wrench', title: 'Set up once', text: 'A rules file for the developer (CLAUDE.md) with the electrical safety rule and the guarantee rule at the top, the build plan, test visitors, test assets and test months with made-up figures, before the first task.' },
    { mark: '2', icon: 'ArrowsClockwise', title: 'Build in small loops', text: 'Frame, build, check, fold back. One branch of one flow, or one section of the site, per run, until its test row passes.' },
    { mark: '3', icon: 'RocketLaunch', title: 'Ship on a yes', text: `Nothing is published or switched on until I approve it, and nothing goes live until the duty leads and the asset managers sign off the safety and money rows. ${YES}` },
  ],
  jobs: {
    columns: [
      { title: 'Me', items: ['Decide what each flow promises a client', 'Approve every change before it goes live', 'Walk each branch with test visitors and test assets', 'Turn every mistake into a rule'] },
      { title: 'The AI', items: ['Read the developer’s facts and the files that matter', 'Write the page, the flow and its tests', 'Run each test row and grade itself', 'Report back with the diff and the run log'] },
    ],
    line: 'When the AI starts estimating what a visitor’s roof would save, or I start placing boilerplate steps by hand, the loop is broken.',
  },
  tools: [
    { mark: '01', icon: 'TerminalWindow', tool: 'claude-code', title: 'Claude Code', text: 'The builder. The developer’s pages, the Make blueprints, the n8n workflows and a step list for each Zapier Zap, drafted from the build plan with a test for each branch.', note: 'Opus to plan, Sonnet to build' },
    { mark: '02', icon: 'FileCode', tool: 'vs-code', title: 'VS Code', text: 'The editor. Where I read every diff, every template and every prompt Claude will run inside ME-01’s scoring step, the bot and the agents, and take over when precision beats speed.', note: 'Human in the loop' },
    { mark: '03', icon: 'Code', tool: 'codex', title: 'Codex', text: 'The second opinion. A fresh model reads each diff and each flow export for what the author missed, like a field mapped into the wrong place or a template that could name a payment.', note: 'Review pass, not a build pass' },
    { mark: '04', icon: 'Sparkle', tool: 'claude', title: 'Claude', text: 'The model inside ME-01, the bot and the two agents. It scores each survey request for the advisors, answers visitors from the site’s published figures, drafts a first email for an advisor’s yes and drafts each report’s note for the asset manager.', note: 'Sonnet inside the flow, bot and agents' },
  ],
  rules: [
    { mark: 'R1', icon: 'FileText', title: 'Write the spec first', text: 'If I cannot say in a paragraph what a flow promises a client, what it may read, who says yes, and that it never touches equipment or a payment, the agent will not find it in a thousand tokens. The build plan is that paragraph.', note: 'Spec before prompt' },
    { mark: 'R2', icon: 'ShieldCheck', title: 'Every write is approval-gated', text: `Agents draft. Nothing reaches the developer’s live site or a switched-on flow unreviewed. ${YES}`, note: 'No autonomous writes' },
    { mark: 'R3', icon: 'Scissors', title: 'One branch at a time', text: 'One branch, one test row, one context. A fresh session per branch beats one long session for all three flows.', note: 'Reset early, reset often' },
    { mark: 'R4', icon: 'ListChecks', title: 'The test row grades it', text: 'Each branch goes in with its row from the build plan’s test matrix, and is run against it before I look, including the request with no score, the organisation that tries to instruct Claude and the morning with nothing due.', note: 'Self-review built in' },
  ],
  loop: {
    caption: 'The loop · 3 ways round',
    steps: [
      { id: 'task', at: [0, 0], kind: 'start', label: 'A branch', sub: 'One test row', icon: 'ClipboardText', what: 'One branch of one flow, like ME-01’s request with no score or ME-03’s month below the model, small enough to describe done in a paragraph and prove with one test row.' },
      { id: 'frame', at: [1, 0], kind: 'step', label: 'Frame', sub: 'Claude Code · Opus', icon: 'Target', tools: ['claude-code'], rule: 'R1', what: 'I set the outcome, the fields it may read and its test row from the build plan, then write the spec, the safety and guarantee rules first. Only the developer’s facts and the files that matter go in.' },
      { id: 'build', at: [2, 0], kind: 'step', label: 'Build', sub: 'Claude Code · Sonnet', icon: 'Lightning', tools: ['claude-code'], rule: 'R3', what: 'Claude Code builds that one branch, test first: the Make route, the n8n nodes, the Zap’s steps or the page section. I do not add requirements mid-run.' },
      { id: 'check', at: [3, 0], kind: 'step', label: 'Check', sub: 'Codex · VS Code', icon: 'MagnifyingGlass', tools: ['codex', 'vs-code'], rule: 'R4', what: 'The branch runs against its test row with test visitors and test assets. Codex reads the diff, and I read it in VS Code.' },
      { id: 'gate', at: [4, 0], kind: 'gate', label: 'Approval', sub: 'Me', icon: 'UserCheck', rule: 'R2', what: 'Nothing is published or switched on until I say yes. If something is off, it goes back to Build with a note.' },
      { id: 'live', at: [5, 0], kind: 'end', label: 'Shipped', sub: 'Switched on', icon: 'RocketLaunch', what: 'Shipped means on: I request one test site assessment on the real site and follow the run to the end. Then the next branch starts.' },
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
      { stage: 'Frame', text: 'Read the site: Request a Site Assessment opens a wizard of four questions, the kind of facility, the area and monthly spend, the location and the structure, then a preliminary model and Book the site survey, whose confirmation says “An energy advisor will confirm a drone survey window within one business day.” The minimum site is 80,000 sq ft or 250 kW, and the survey promises “a measured number, not a sales estimate.” The tempting build has Claude write the visitor’s email, with its score and a savings estimate, and books any high score straight into the calendar. Both are wrong for this developer: the number comes from the survey, and a person confirms the window.' },
      { stage: 'Frame', text: 'So in ME-01 Claude only scores, from the area, the spend and the location, and the score only routes: it goes to the pipeline sheet and the energy advisors, never to the visitor. Both emails are fixed templates that never call the assessment free or quote a figure, and Cal.com’s Drone site survey event waits for an advisor to confirm. Done means every request is logged, scored and in front of the advisors within minutes, and answered by a person within one business day. Then I wrote ME-01’s spec and its ten test rows, among them a request with no score, an organisation that tries to instruct Claude and a morning with nothing due.' },
      { stage: 'Build', text: 'Built one branch per session, test first: the custom webhook, Score the site and Read the score with their error routes, Log the site with its Confirm by, Tell the advisors, the Router with Not yet as its fallback route, the booking email and the five savings guides, then the due scenario, with its Make an API call on the Due tab.' },
      { stage: 'Check', text: 'Ran each row with test visitors. The Nothing due row failed: on a morning with nothing due, the advisors still got a reminder with one empty line, because the Due tab’s FILTER showed #N/A, which the API returned as a row. Then a fresh reviewer model read the scenario’s blueprint and saw that Score the site was mapped the whole webhook bundle, so Claude received the name, the organisation and the email after all. No row that checked only the score could show it.' },
      { stage: 'Fold back', text: 'Each fix went in behind a check that failed first: the Due tab’s FILTER now sits inside IFERROR with an empty result, so a quiet morning leaves the tab empty and the filter stops on the length of its values; and Score the site maps only the facility, the area, the spend and the location, with t06 now checking Claude’s input. Two rules went into CLAUDE.md: a sheet a scenario reads is empty when there is nothing, never an error value; and a Claude step gets named fields, never the whole bundle.' },
      { stage: 'Ship', text: 'I approved it, the energy advisors read Claude’s scoring instructions and the two templates, t10 was signed off in the safety and guarantee review, and I turned both scenarios on. I pressed Request a Site Assessment on the developer’s real site with a test warehouse, and watched the row land with its score, the advisors’ group hear of it, the booking email reach the test inbox with the reference and no score, and Cal.com hold the window for an advisor to confirm.' },
    ],
    link: { label: 'See Meridian Energy Infrastructure’s end-to-end workflow', href: '/cases/meridian-energy-infrastructure/end-to-end.html' },
  },
  habits: [
    { mark: '1', icon: 'Broom', title: 'Fresh session per branch', text: 'A long chat drifts. Each branch starts clean, with its spec and its test row.' },
    { mark: '2', icon: 'Eye', title: 'Read every diff and prompt', text: 'Every change, every template and every prompt Claude will run inside ME-01, the bot and the agents is read before it goes anywhere, so nothing can tell a client to touch equipment or name a payment.' },
    { mark: '3', icon: 'TestTube', title: 'Test visitors, never real ones', text: 'Every branch is walked with made-up test visitors, test assets and test months before a real firm or client meets it.' },
    { mark: '4', icon: 'Globe', title: 'Check it on the live site', text: 'Tests passing is not the end. I press Request a Site Assessment on the developer’s real site, answer the four questions, and follow them.' },
  ],
  closing: 'Done is a survey request in front of an energy advisor within minutes of Book the site survey, not a diff.',
  glossary: [
    ['Claude Code', 'Anthropic’s AI coding tool. It works in the terminal, on real files.'],
    ['VS Code', 'Visual Studio Code, the code editor where I read what was written and edit by hand.'],
    ['Codex', 'OpenAI’s coding agent, used here to review work it did not write.'],
    ['Claude', 'Anthropic’s AI model inside ME-01’s scoring step, the bot and the two agents once they ship. Claude Code is what builds them.'],
    ['Opus', 'Claude’s most capable model, used for planning.'],
    ['Sonnet', 'Claude’s faster model, used for most of the building and inside the flow, the bot and the agents.'],
    ['Make', 'The automation tool ME-01 runs in. A scenario can be imported as a blueprint.'],
    ['Blueprint', 'A Make scenario saved as a file, so it can be drafted, read and imported.'],
    ['Router', 'Make’s way of splitting a scenario into routes. Its fallback route takes whatever no other route does.'],
    ['Fallback route', 'The Router’s route for a score below 7, or no score at all: the savings guide.'],
    ['Make an API call', 'A Make module that calls the Google Sheets API directly, here to read the Due tab.'],
    ['Webhook', 'The address the wizard posts its answers to, which starts the scenario.'],
    ['n8n', 'The automation tool ME-02, the bot and the agents run in. A workflow can be written as a file and imported.'],
    ['Zapier', 'The automation tool ME-03 runs in. Each Zap is built by hand from its step list.'],
    ['Cal.com', 'Where a strong site books its drone survey window, for an energy advisor to confirm.'],
    ['Wizard', 'The site’s four questions behind Request a Site Assessment.'],
    ['Due tab', 'A tab of the pipeline sheet listing the requests still owed an advisor’s answer.'],
    ['Safety and money rows', 'The test rows that prove no template tells a client to touch equipment or names a payment, signed off before go-live.'],
    ['Spec', 'A short written description of what done looks like, agreed before any code.'],
    ['Context', 'Everything the AI can see while it works. Less is better.'],
    ['Branch', 'One path through a flow, like the request with no score, built and tested on its own.'],
    ['Test row', 'One line of the test matrix: an input, the branch it takes and what must happen.'],
    ['Test matrix', 'Every test row for every flow, in the build plan, ticked as each one passes.'],
    ['Test visitors', 'Made-up visitors with made-up sites, so a branch can run without touching a real one.'],
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
  footer: { note: 'A worked example. Meridian Energy Infrastructure is a fictional developer, not a client project, and figures are illustrative.', by: 'Built by Justine Acosta' },
}

export default framework
