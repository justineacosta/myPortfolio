import type { Icon } from '@phosphor-icons/react'
import {
  BlueprintIcon, BooksIcon, BrainIcon, BrowsersIcon, EyeIcon, FilmStripIcon, FlowArrowIcon, GraphIcon, MagnifyingGlassIcon, RobotIcon, SparkleIcon,
} from '@phosphor-icons/react/ssr'

/**
 * The Projects board and its sub-views, verbatim from Kraft Projects
 * Board.dc.html. Screens Kraft left as empty image slots are PLACEHOLDERs.
 * The write-ups and the systems roster live in data/projectDocs.ts, so only
 * /projects downloads them (this module also feeds the ⌘K list on every page).
 */

/** Every sub-view the board opens. Each id is also its URL hash (/projects#build-plan). */
export const PROJECT_VIEWS = ['reel', 'build-plan', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const
export type ProjectView = (typeof PROJECT_VIEWS)[number]

export type Chip = { name: string; icon: Icon }
export type AgentCard = { title: string; icon: Icon; live: boolean; icons: Icon[]; desc: string; meta: string; tags: string[] }
export type AgentGroup = { name: string; blurb: string; cards: AgentCard[] }
export type Screenshot = { src: string; label: string }
/** A sample site: its page, a 3:4 thumbnail, and a tall shot (up to four screens) the Funnels card peeks through. */
export type Site = { name: string; file: string; src: string; thumb: string; tall: string }
/** A write-up card: it opens a generated page in the window, with its Home `shot`. */
type Writeup = { view: ProjectView; kicker: string; title: string; desc: string; icon: Icon; cue: string; page: string; frameTitle: string; shot: string }

const REEL: Screenshot[] = [
  'TM-01 · Quote request',
  'Workflows list',
  'TM-02 · Survey → Estimate',
  'Workflow settings',
  'Executions',
].map((label) => ({ label, src: `PLACEHOLDER - n8n workflow screenshot: ${label} (16:10)` }))

/**
 * Kraft's sample sites, in its order. Every page is a PLACEHOLDER written by
 * scripts/make-sites.mjs. Replace a page in public/samples/, then run
 * `npm run thumbs` to re-shoot its thumbnail.
 */
const SITES: Site[] = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html'],
  ['Blade Studio', 'sample-brand-studio.html'],
  ['Below Ground', 'sample-utility-contractor.html'],
  ['Baptiste', 'sample-law-firm.html'],
  ['One Hour Therapy', 'sample-therapy-clinic.html'],
  ['Trusted Mover', 'sample-moving-company.html'],
  ['Payline', 'sample-fintech-funnel.html'],
  ['Solar Field', 'sample-solar-installer.html'],
].map(([name, file]) => {
  const shot = file.replace(/\.html$/, '.jpeg')
  return { name, file, src: `/samples/${file}`, thumb: `/samples/thumbs/${shot}`, tall: `/samples/thumbs/tall/${shot}` }
})

const WRITEUPS: Writeup[] = [
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', icon: BrainIcon, cue: 'READ THE FRAMEWORK', page: '/agentic-framework.html', frameTitle: 'Agentic Framework page', shot: '/shots/agentic-framework.jpeg' },
  { view: 'end-to-end', kicker: 'HOW I SHIP, END TO END', title: 'The End-to-End Workflow', desc: 'Every trigger, node, skill and agent wired as one live graph.', icon: GraphIcon, cue: 'READ THE WORKFLOW', page: '/end-to-end.html', frameTitle: 'End-to-End Workflow graph', shot: '/shots/end-to-end.jpeg' },
]

export const projects = {
  title: ['Real builds you', 'can open.'] as const,
  lede: 'Everything here shipped. Open a card to read the problem, the system behind it, and what changed after.',
  nudge: 'CLICK A CARD TO OPEN IT',
  close: 'Close',
  openNewTab: 'Open in new tab',
  builtWith: 'BUILT WITH',
  live: 'LIVE',
  internal: 'INTERNAL',
  cards: {
    reel: {
      title: 'Automations', icon: FlowArrowIcon, cue: 'VIEW THE REEL', cta: 'OPEN THE REEL',
      body: 'Real screens from the n8n workflows I build.',
      peek: ['PLACEHOLDER - workflow screen behind (Automations card)', 'PLACEHOLDER - workflow screen in front (Automations card)'],
      peekHint: 'Workflow screen',
    },
    plan: {
      title: 'The build plan', icon: BlueprintIcon, cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'N8N BUILD PLAN', heading: 'The full automation blueprint.',
      steps: ['Webhook', 'Claude', 'Approve?', 'Stripe'],
      page: '/build-plan.html', frameTitle: 'Trusted Mover build plan',
    },
    sites: {
      title: 'Funnels and sites', icon: BrowsersIcon, cue: 'VIEW THE SITES', cta: 'SPIN THE CAROUSEL',
      body: 'Complete funnel builds and websites. Spin the reel.',
      fanHint: 'Site',
    },
    agents: {
      title: 'AI agents and RAG chatbots', icon: RobotIcon, cue: 'VIEW THE AGENTS', cta: 'SEE EVERY SYSTEM',
      body: 'Retrieval chatbots and task agents wired to real data.',
      chips: [
        { name: 'KapeSEO', icon: MagnifyingGlassIcon },
        { name: 'KAPE Reel worker', icon: FilmStripIcon },
        { name: 'Kape AI knowledge search', icon: BooksIcon },
        { name: 'KapeAI', icon: SparkleIcon },
        { name: 'Watcher', icon: EyeIcon },
      ] satisfies Chip[],
    },
  },
  writeups: WRITEUPS,
  reel: {
    label: 'Workflow screens', kicker: 'AUTOMATIONS · WORKFLOW REEL', hint: 'HOVER TO PAUSE',
    pause: 'PAUSE', play: 'PLAY', pauseLabel: 'Pause the reel', playLabel: 'Play the reel',
    /** Kraft's default reel pace (the board's marqueeSeconds prop). */
    seconds: 20,
    slotHint: 'Drop a workflow screenshot · 16:10',
    shots: REEL,
  },
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
 * Projects card. Funnels and sites shows a sample site; the rest are
 * PLACEHOLDERs until each has a screenshot (16:10).
 */
export const BUILDS: Build[] = [
  { name: projects.cards.reel.title, view: 'reel', shot: 'PLACEHOLDER - Automations screenshot (16:10)' },
  { name: projects.cards.plan.title, view: 'build-plan', shot: '/shots/build-plan.jpeg' },
  { name: projects.cards.sites.title, view: 'sites', shot: SITES[0].thumb, tall: SITES[0].tall },
  { name: projects.cards.agents.title, view: 'ai-agents', shot: 'PLACEHOLDER - AI agents screenshot (16:10)' },
  ...WRITEUPS.map((w) => ({ name: w.title, view: w.view, shot: w.shot })),
]
