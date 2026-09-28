import type { Icon } from '@phosphor-icons/react'
import {
  BrowsersIcon,
  DeviceMobileIcon,
  KanbanIcon,
  LightningIcon,
  PlugsConnectedIcon,
  RobotIcon,
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
