import type { Icon } from '@phosphor-icons/react'
import {
  ArrowsClockwiseIcon,
  BrowsersIcon,
  DeviceMobileIcon,
  FlagPennantIcon,
  KanbanIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PenNibIcon,
  PlugsConnectedIcon,
  RobotIcon,
  TreeStructureIcon,
} from '@phosphor-icons/react/ssr'
import type { Brand } from './stack'

/** Kraft's six offers, verbatim (KraftScreens.dc.html:585-592). */
export type Service = {
  n: string
  name: string
  icon: Icon
  line: string
  badge: string
  bullets: string[]
  tags: string[]
  logos: Brand[]
}

export const SERVICES: Service[] = [
  {
    n: '01', name: 'Full-Stack Web & SaaS', icon: BrowsersIcon, line: 'Product surfaces people use every day.', badge: 'BUILT TO LAST',
    bullets: ['Design through deploy', 'Accessible, responsive, fast', 'You own the codebase'], tags: ['React', 'TypeScript', 'Postgres'],
    logos: [{ name: 'React', slug: 'react' }, { name: 'TypeScript', slug: 'typescript' }, { name: 'PostgreSQL', slug: 'postgresql' }],
  },
  {
    n: '02', name: 'AI Agents & RAG', icon: RobotIcon, line: 'Models wired to your real data.', badge: 'GROUNDED',
    bullets: ['Retrieval over your content', 'Guardrails and evaluations', 'Cost and latency budgets'], tags: ['LLM APIs', 'RAG', 'Vectors'],
    logos: [{ name: 'Hugging Face', slug: 'huggingface' }, { name: 'Anthropic', slug: 'anthropic' }, { name: 'Supabase', slug: 'supabase' }],
  },
  {
    n: '03', name: 'Automation & Workflows', icon: LightningIcon, line: 'The manual steps, removed.', badge: 'RUNS ITSELF',
    bullets: ['Process mapped before build', 'Retries and alerts included', 'Documented handover'], tags: ['n8n', 'Webhooks', 'Queues'],
    logos: [{ name: 'n8n', slug: 'n8n' }, { name: 'Zapier', slug: 'zapier' }, { name: 'Make', slug: 'make' }],
  },
  {
    n: '04', name: 'CRM, CMS & Internal Tools', icon: KanbanIcon, line: 'The admin your team stops dreading.', badge: 'TEAM READY',
    bullets: ['Roles and permissions', 'Bulk actions, audit trail', 'Fits your pipeline'], tags: ['Dashboards', 'Auth', 'Reporting'],
    logos: [{ name: 'HubSpot', slug: 'hubspot' }, { name: 'Airtable', slug: 'airtable' }, { name: 'Notion', slug: 'notion' }],
  },
  {
    n: '05', name: 'APIs & Integrations', icon: PlugsConnectedIcon, line: 'Systems that finally talk.', badge: 'TYPED',
    bullets: ['Versioned contracts', 'Idempotent by default', 'Monitoring from day one'], tags: ['REST', 'Webhooks', 'SDKs'],
    logos: [{ name: 'Postman', slug: 'postman' }, { name: 'GraphQL', slug: 'graphql' }, { name: 'Stripe', slug: 'stripe' }],
  },
  {
    n: '06', name: 'Mobile Apps & Extensions', icon: DeviceMobileIcon, line: 'Small tools that fix real friction.', badge: 'SHIPS FAST',
    bullets: ['One job, done properly', 'Store-ready builds', 'Weeks, not quarters'], tags: ['React Native', 'Chrome', 'TS'],
    logos: [{ name: 'React Native', slug: 'react' }, { name: 'Expo', slug: 'expo' }, { name: 'Chrome', slug: 'googlechrome' }],
  },
]

/** Services page copy, verbatim (KraftScreens.dc.html:209-324). The labels name the sections in ⌘K. */
export const servicesPage = {
  title: ['Apps, agents and the', 'automation between them.'] as const,
  lede: 'What I build, how it works, and what you get at the end of it.',
  method: {
    id: 'method',
    label: 'The Kraft Method',
    kicker: 'THE KRAFT METHOD',
    title: ['Kickoff · Research', 'Architect · Form · Transform'] as const,
    body: 'Five steps, always in that order. Every letter is a gate — nothing moves forward until the one before it is answered.',
  },
  offers: { id: 'offers', label: 'What I can do for you', title: 'What I can do for you', aside: 'Pick one, or stack a few.' },
  automation: {
    id: 'automation',
    label: 'Live automation',
    kicker: 'LIVE AUTOMATION',
    live: 'LIVE',
    prev: 'Previous automation',
    next: 'Next automation',
    canvasLabel: 'Flow canvas. Scroll sideways to see all of it.',
  },
}

/** How long each gate of the Kraft Method stays lit (KraftScreens.dc.html:620). */
export const METHOD_MS = 1700

export type Step = { n: string; key: string; name: string; icon: Icon; line: string; items: string[] }

/** The Kraft Method, verbatim (KraftScreens.dc.html:622-628). */
export const PROCESS: Step[] = [
  { n: 'K', key: '01', name: 'Kickoff', icon: FlagPennantIcon, line: 'Understand your goals, requirements, constraints and what success actually looks like.', items: ['Goals', 'Constraints', 'Success criteria'] },
  { n: 'R', key: '02', name: 'Research', icon: MagnifyingGlassIcon, line: 'Investigate the users, the existing systems, the technical options and the risks.', items: ['Users', 'Systems', 'Risks'] },
  { n: 'A', key: '03', name: 'Architect', icon: TreeStructureIcon, line: 'Design the architecture, data models, workflows, integrations and technical foundation.', items: ['Data model', 'Workflows', 'Integrations'] },
  { n: 'F', key: '04', name: 'Form', icon: PenNibIcon, line: 'Design and build the product — UI/UX, features, APIs and core functionality.', items: ['UI/UX', 'Features', 'APIs'] },
  { n: 'T', key: '05', name: 'Transform', icon: ArrowsClockwiseIcon, line: 'Test, refine, optimize, deploy, automate and keep improving it.', items: ['Test', 'Deploy', 'Improve'] },
]
