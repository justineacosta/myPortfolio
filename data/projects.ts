import type { Brand } from './stack'

/**
 * The Projects board and its sub-views, verbatim from Kraft Projects
 * Board.dc.html. The Automations card opens public/automations.html
 * (data/automations.ts), and the AI agents card public/ai-agents.html
 * (data/agents.ts). This
 * module also feeds the ⌘K list on every page, so it stays small.
 */

/** Every sub-view the board opens. Each id is also its URL hash (/projects#build-plan). */
export const PROJECT_VIEWS = ['automations', 'build-plan', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const
export type ProjectView = (typeof PROJECT_VIEWS)[number]

/** A chip with a tool's logo: its text, and the logo's slug in public/icons/brands/. */
export type Chip = { name: string; logo: string }
/** A sample site: its page, a 3:4 thumbnail, and a tall shot (up to four screens) the Funnels card peeks through. */
export type Site = { name: string; file: string; src: string; thumb: string; tall: string }
/** A write-up card: it opens a generated page in the window, with its Home `shot`. */
type Writeup = { view: ProjectView; kicker: string; title: string; desc: string; logos: Brand[]; cue: string; page: string; frameTitle: string; shot: string }

/** A card's logos (components/projects/LogoStack.tsx), the tools its page names; the first leads, and is ⌘K's. */
const logos = (...names: [string, string][]): Brand[] => names.map(([name, slug]) => ({ name, slug }))


/**
 * The sample sites, in the carousel's order; the first is the fan's shot on
 * Home. Each is a standalone HTML page in public/samples/. To add one, drop
 * it there under a lowercase-hyphenated name, add a line here, then run
 * `npm run thumbs` to shoot its thumbnails.
 */
const SITES: Site[] = [
  ['Harbor & Pine Moving Co.', 'harbor-and-pine-moving.html'],
  ['Westmere', 'westmere-los-angeles.html'],
  ['Ironline Utility Infrastructure', 'ironline-utility-infrastructure.html'],
  ['Meridian Werks', 'meridian-werks.html'],
  ['Meridian Energy Infrastructure', 'meridian-energy-infrastructure.html'],
].map(([name, file]) => {
  const shot = file.replace(/\.html$/, '.jpeg')
  return { name, file, src: `/samples/${file}`, thumb: `/samples/thumbs/${shot}`, tall: `/samples/thumbs/tall/${shot}` }
})

const WRITEUPS: Writeup[] = [
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', logos: logos(['Claude', 'claude'], ['Cursor', 'cursor'], ['Codex', 'codex']), cue: 'READ THE FRAMEWORK', page: '/agentic-framework.html', frameTitle: 'Agentic Framework page', shot: '/shots/agentic-framework.jpeg' },
  { view: 'end-to-end', kicker: 'HOW I SHIP, END TO END', title: 'The End-to-End Workflow', desc: 'Every trigger, node, skill and agent wired as one live graph.', logos: logos(['n8n', 'n8n'], ['Telegram', 'telegram'], ['GitHub Actions', 'githubactions']), cue: 'READ THE WORKFLOW', page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', shot: '/shots/end-to-end.jpeg' },
]

export const projects = {
  title: ['Real builds you', 'can open.'] as const,
  lede: 'Everything here shipped. Open a card to read the problem, the system behind it, and what changed after.',
  nudge: 'CLICK A CARD TO OPEN IT',
  close: 'Close',
  openNewTab: 'Open in new tab',
  cards: {
    automations: {
      title: 'Automations', logos: logos(['n8n', 'n8n'], ['Make', 'make'], ['Zapier', 'zapier']), cue: 'VIEW THE FLOWS', cta: 'OPEN THE FLOWS',
      body: 'The flows behind my sample sites’ forms, on n8n, Make and Zapier.',
      page: '/automations.html', frameTitle: 'Automations flows page',
    },
    plan: {
      title: 'The build plan', logos: logos(['n8n', 'n8n'], ['Claude', 'claude'], ['Stripe', 'stripe']), cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'N8N BUILD PLAN', heading: 'The full automation blueprint.',
      steps: [
        { label: 'Webhook', logo: 'n8n' }, { label: 'Claude', logo: 'claude' },
        { label: 'Approve?', logo: 'telegram' }, { label: 'Stripe', logo: 'stripe' },
      ],
      page: '/build-plan.html', frameTitle: 'Trusted Mover build plan',
    },
    sites: {
      title: 'Funnels and sites', logos: logos(['Figma', 'figma'], ['React', 'react'], ['Tailwind CSS', 'tailwindcss']), cue: 'VIEW THE SITES', cta: 'SPIN THE CAROUSEL',
      body: 'Complete funnel builds and websites. Spin the reel.',
      fanHint: 'Site',
    },
    agents: {
      title: 'AI agents and RAG chatbots', logos: logos(['Claude', 'claude'], ['Supabase', 'supabase'], ['n8n', 'n8n']), cue: 'VIEW THE AGENTS', cta: 'SEE HOW THEY WORK',
      body: 'Sample RAG chatbots and agents, and how each one works.',
      page: '/ai-agents.html', frameTitle: 'AI agents and RAG chatbots page',
      /** Counted from data/agents.ts's builds (tests/projects.test.tsx checks they agree). */
      counts: [
        { name: '4 RAG chatbots', logo: 'supabase' },
        { name: '4 AI agents', logo: 'claude' },
      ] satisfies Chip[],
      /** The strip of every tool the page's builds use, along the card's foot. */
      tools: [
        { name: 'Claude', slug: 'claude' }, { name: 'n8n', slug: 'n8n' }, { name: 'Supabase', slug: 'supabase' }, { name: 'Gmail', slug: 'gmail' },
        { name: 'Google Sheets', slug: 'googlesheets' }, { name: 'Telegram', slug: 'telegram' }, { name: 'Stripe', slug: 'stripe' }, { name: 'Cal.com', slug: 'caldotcom' },
      ] satisfies Brand[],
      /** The card's preview (components/projects/AgentsPreview.tsx): the page's Harbor & Pine chat, then its billing agent's run. */
      preview: {
        question: 'Do you move pianos, and what does it add?',
        search: 'Searching 5 passages · Supabase',
        answer: 'Yes. Uprights add $150; baby grands need a walkthrough first.',
        source: 'Pricing guide §4',
        run: ['Stripe · invoice 14 days overdue', 'Drafting a reminder'] as [string, string],
        runLogo: 'stripe',
        approve: 'Approve?',
        buttons: ['Approve', 'Edit'] as [string, string],
      },
    },
  },
  writeups: WRITEUPS,
  sitesView: {
    label: 'Funnels and sites',
    kicker: 'FUNNELS AND SITES',
    hint: 'DRAG TO SPIN · CLICK A PAGE TO OPEN',
    listLabel: 'Sample sites',
    open: 'Open',
    siteKicker: 'SITE',
    sites: SITES,
    /** Kraft's site preview (Kraft Projects Board.dc.html:288-311). */
    preview: {
      label: 'preview',
      newTab: 'Open in new tab',
      close: 'Close preview',
      upload: 'Upload',
      uploadTail: 'to public/samples/ and this page opens live.',
      uploadNote: 'STANDALONE HTML · SAME FOLDER',
    },
  },
}

/** A build on the Projects page: its name, the sub-view it opens, and its screenshot (tall where it can scroll). */
export type Build = { name: string; view: ProjectView; shot: string; tall?: string }

/**
 * Every build on the Projects page, in its order, for the fan on Home's
 * Projects card. Funnels and sites shows a sample site; the rest show their
 * page (16:10).
 */
export const BUILDS: Build[] = [
  { name: projects.cards.automations.title, view: 'automations', shot: '/shots/automations.jpeg' },
  { name: projects.cards.plan.title, view: 'build-plan', shot: '/shots/build-plan.jpeg' },
  { name: projects.cards.sites.title, view: 'sites', shot: SITES[0].thumb, tall: SITES[0].tall },
  { name: projects.cards.agents.title, view: 'ai-agents', shot: '/shots/ai-agents.jpeg' },
  ...WRITEUPS.map((w) => ({ name: w.title, view: w.view, shot: w.shot })),
]
