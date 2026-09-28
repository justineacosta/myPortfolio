import type { Icon } from '@phosphor-icons/react'
import {
  BlueprintIcon, BooksIcon, BrainIcon, BrowsersIcon, EyeIcon, FilmStripIcon, FlowArrowIcon, GraphIcon, LifebuoyIcon, MagnifyingGlassIcon, RobotIcon, SparkleIcon,
} from '@phosphor-icons/react/ssr'

/**
 * The Projects board and its sub-views, verbatim from Kraft Projects
 * Board.dc.html. Screens Kraft left as empty image slots are PLACEHOLDERs.
 * The write-ups and the systems roster live in data/projectDocs.ts, so only
 * /projects downloads them (this module also feeds the ⌘K list on every page).
 */

/** Every sub-view the board opens. Each id is also its URL hash (/projects#build-plan). */
export const PROJECT_VIEWS = ['reel', 'build-plan', 'support-desk', 'agentic-framework', 'end-to-end', 'sites', 'ai-agents'] as const
export type ProjectView = (typeof PROJECT_VIEWS)[number]
export const DOC_VIEWS = ['build-plan', 'support-desk', 'agentic-framework', 'end-to-end'] as const
export type DocView = (typeof DOC_VIEWS)[number]

export type Chip = { name: string; icon: Icon }
export type DocCard = { step: string; icon: Icon; title: string; desc: string; meta: string }
export type Doc = { kicker: string; title: string; lede: string; stack: Chip[]; sections: { name: string; blurb: string; cards: DocCard[] }[] }
export type AgentCard = { title: string; icon: Icon; live: boolean; icons: Icon[]; desc: string; meta: string; tags: string[] }
export type AgentGroup = { name: string; blurb: string; cards: AgentCard[] }
export type Screenshot = { src: string; label: string }
export type Site = { name: string; file: string; shot: string }
type Writeup = { view: DocView; kicker: string; title: string; desc: string; icon: Icon; cue: string }

const REEL: Screenshot[] = [
  '01 - Support | New Ticket',
  'Workflows list',
  '02 - Post-Purchase Delivery',
  'Global workflow settings',
  'Execution logs',
].map((label) => ({ label, src: `PLACEHOLDER - GoHighLevel workflow screenshot: ${label} (16:10)` }))

const SITES: Site[] = [
  ['Apex Build Co.', 'sample-auto-repair-performance-tuning.html'],
  ['Blade Studio', 'sample-brand-studio.html'],
  ['Below Ground', 'sample-utility-contractor.html'],
  ['Baptiste', 'sample-law-firm.html'],
  ['One Hour Therapy', 'sample-therapy-clinic.html'],
  ['Trusted Mover', 'sample-moving-company.html'],
  ['Payline', 'sample-fintech-funnel.html'],
  ['Solar Field', 'sample-solar-installer.html'],
].map(([name, file]) => ({ name, file, shot: `PLACEHOLDER - ${name} site screenshot (3:4)` }))

const WRITEUPS: Writeup[] = [
  { view: 'support-desk', kicker: 'GOHIGHLEVEL BLUEPRINT', title: 'Support Ticketing System', desc: 'A full support desk inside GoHighLevel. One pipeline, five stages, four branded emails.', icon: LifebuoyIcon, cue: 'READ THE WRITE-UP' },
  { view: 'agentic-framework', kicker: 'HOW I BUILD WITH AI', title: 'The Agentic Framework', desc: 'The tools, the rules and the loop I use to ship apps with AI.', icon: BrainIcon, cue: 'READ THE FRAMEWORK' },
  { view: 'end-to-end', kicker: 'HOW I SHIP, END TO END', title: 'The End-to-End Workflow', desc: 'Every trigger, node, skill and agent wired as one live graph.', icon: GraphIcon, cue: 'READ THE WORKFLOW' },
]

export const projects = {
  title: ['Real builds you', 'can open.'] as const,
  lede: 'Everything here shipped. Open a card to read the problem, the system behind it, and what changed after.',
  nudge: 'CLICK A CARD TO OPEN IT',
  close: 'Close',
  builtWith: 'BUILT WITH',
  live: 'LIVE',
  internal: 'INTERNAL',
  cards: {
    reel: {
      title: 'Automations', icon: FlowArrowIcon, cue: 'VIEW THE REEL', cta: 'OPEN THE REEL',
      body: 'Real screens from the GoHighLevel workflows I build.',
      peek: ['PLACEHOLDER - workflow screen behind (Automations card)', 'PLACEHOLDER - workflow screen in front (Automations card)'],
      peekHint: 'Workflow screen',
    },
    plan: {
      title: 'The build plan', icon: BlueprintIcon, cue: 'VIEW THE PLAN',
      body: 'A real automation plan, before a workflow is clicked together.',
      kicker: 'GOHIGHLEVEL BUILD PLAN', heading: 'The full automation blueprint.',
      steps: ['Trigger', 'Wait', 'Score?', 'Convert'],
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
  sitesView: { label: 'Funnels and sites', kicker: 'FUNNELS AND SITES', slotHint: 'Drop a site screenshot', sites: SITES },
}
