import type { Brand } from './stack'

/** Kraft's About screen, verbatim (KraftScreens.dc.html:393-461; roles at :644-653). */
export type Role = { n: string; name: string; line: string; logos: Brand[] }

const b = (name: string, slug: string): Brand => ({ name, slug })

export const ROLES: Role[] = [
  { n: '01', name: 'Full Stack Developer', line: 'Interface to database, one pair of hands.', logos: [b('React', 'react'), b('TypeScript', 'typescript'), b('Node.js', 'nodedotjs'), b('PostgreSQL', 'postgresql')] },
  { n: '02', name: 'AI Automation Engineer', line: 'Agents and workflows wired to real systems.', logos: [b('n8n', 'n8n'), b('Zapier', 'zapier'), b('Claude', 'claude'), b('Google Sheets', 'googlesheets')] },
  { n: '03', name: 'AI Web Dev', line: 'AI does the typing; the architecture stays mine.', logos: [b('Next.js', 'nextdotjs'), b('Tailwind', 'tailwindcss'), b('Cloudflare', 'cloudflare'), b('GitHub', 'github')] },
  { n: '04', name: 'Systems Builder', line: 'CRM, dashboards and the plumbing between them.', logos: [b('Supabase', 'supabase'), b('Airtable', 'airtable'), b('Figma', 'figma'), b('Notion', 'notion')] },
]

export const about = {
  title: ["Hi, I'm Justine."] as const,
  lede: "I'm a full-stack developer and AI automation engineer in Manila. I build the systems that keep working when nobody is watching them.",
  /** The meta description: search results and link previews, not the page. */
  description: "I'm Justine Acosta, a full-stack developer and AI automation engineer in Manila. I build software, AI agents and workflows that keep working after the demo.",
  intro: {
    heading: 'I care about the parts nobody demos.',
    aside: 'The retry. The log line. The empty state.',
    lead: 'Kraft is just how I work',
    body: ': I build the app, the AI and the automations around it, and I stay accountable for all of it. AI helps me move fast; the decisions stay mine.',
    story: "I've shipped enough projects alone to know the hard part starts after launch. That's the part I build for.",
  },
  /** A looping video, encoded from assets/about-workstation.gif by scripts/workstation-video.mjs. */
  image: {
    webm: '/assets/about-workstation.webm',
    mp4: '/assets/about-workstation.mp4',
    still: '/assets/about-workstation-still.webp',
    alt: 'Animated pixel-art illustration of a late-night developer workstation',
    width: 1920,
    height: 1080,
    caption: 'THE WORKSTATION · ALWAYS ON',
  },
  certified: 'COURSES',
  location: { title: 'Based in Manila, Philippines', detail: 'GMT+8 · US / EU / CA OVERLAP' },
}
