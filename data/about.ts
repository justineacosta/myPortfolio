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
  lede: 'I build the systems that keep working when nobody is watching them.',
  intro: {
    heading: 'I care about the parts nobody demos.',
    aside: 'The retry. The log line. The empty state.',
    lead: 'Kraft is how I work',
    body: ' — full-stack development, AI automation and workflow engineering under one roof. I use AI heavily to move faster, and I keep the architecture, the decisions and the accountability firmly human.',
    story:
      'I started by building software from the ground up, taking on projects where I had to own both the code and the outcome. I got tired of fragile systems, repetitive manual work, and polished demos that fell apart in production—so now I build reliable software, AI automations, and workflows designed for what happens after the demo.',
  },
  image: {
    src: '/assets/about-workstation.gif',
    still: '/assets/about-workstation-still.webp',
    alt: 'Animated pixel-art illustration of a late-night developer workstation',
    width: 1920,
    height: 1080,
    caption: 'THE WORKSTATION · ALWAYS ON',
  },
  certified: 'BADGES',
  location: { title: 'Based in Manila, Philippines', detail: 'GMT+8 · US / EU / CA OVERLAP' },
}
