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
  portrait: {
    src: '/assets/portrait.jpg', alt: 'Portrait of Justine Acosta', position: '57% 36%',
    /** The same moment, drawn: the avatar's hover (a tap on phones) and the Thank-you and 404 pages. */
    drawn: {
      src: '/assets/portrait-drawn.jpg', alt: 'Drawing of Justine raising a bottle in a café', position: '56% 37%',
      width: 843, height: 1264, swap: 'Show the drawn portrait',
    },
  },
  email: 'justine.psalm0923@gmail.com',
  timezone: 'Asia/Manila',
  tzLabel: 'GMT+8',
  availability: { label: 'Available for work', regions: ['US', 'EU', 'CA'] },
  socials: [
    { label: 'GitHub', href: 'https://github.com/justineacosta', icon: GithubLogoIcon },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/justinesam023', icon: LinkedinLogoIcon },
  ] satisfies { label: string; href: string; icon: Icon }[],
  copyright: '© 2026 KRAFT · JUSTINE ACOSTA',
}
