import type { Icon } from '@phosphor-icons/react'
import { GithubLogoIcon, LinkedinLogoIcon } from '@phosphor-icons/react/ssr'

/**
 * Identity shown in the shell. Text is Kraft's, verbatim. Gaps are
 * "PLACEHOLDER - …" strings (spec §10). Page copy lives in the other data files.
 */
export const profile = {
  name: 'Justine Acosta',
  brand: 'KRAFT',
  /** The studio name as written in prose, titles and structured data. */
  studio: 'Kraft',
  handleLines: ['@Kraft · FULL STACK DEV', 'AI AUTOMATION & WORKFLOWS'] as [string, string],
  phoneHandle: '@KRAFT',
  verifiedLabel: 'Certified',
  jobTitle: 'Full-stack developer and AI automation engineer',
  address: { locality: 'Manila', country: 'PH' },
  portrait: { src: '/assets/portrait.jpg', alt: 'Portrait of Justine Acosta', position: '57% 36%' },
  email: 'PLACEHOLDER - your contact email (the Kraft design used justine@kraft.dev)',
  timezone: 'Asia/Manila',
  tzLabel: 'GMT+8',
  availability: { label: 'Available for work', regions: ['US', 'EU', 'CA'] },
  socials: [
    { label: 'GitHub', href: 'https://github.com/justineacosta', icon: GithubLogoIcon },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/justinesam023', icon: LinkedinLogoIcon },
  ] satisfies { label: string; href: string; icon: Icon }[],
  copyright: '© 2026 KRAFT · JUSTINE ACOSTA',
}
