import type { Icon } from '@phosphor-icons/react'
import { CodeIcon, LightningIcon, RocketLaunchIcon, TreeStructureIcon } from '@phosphor-icons/react/ssr'

/**
 * Home copy, verbatim from KraftScreens.dc.html:47-200. The intro steps and
 * status lines are Kraft's loader (Kraft Portfolio.dc.html:389-394, 733).
 * The stats row is spec §8; its first two values are PLACEHOLDERs.
 */
export type Stat = { value: string; short?: string; unit: string; label: string }
export type IntroStep = { label: string; icon: Icon }

const stats: Stat[] = [
  { value: 'PLACEHOLDER - years building', short: '[X]', unit: 'yrs', label: 'building' },
  { value: 'PLACEHOLDER - builds shipped', short: '[N]', unit: 'builds', label: 'shipped' },
  { value: 'GMT+8', unit: '', label: 'US hours' },
]

const steps: IntroStep[] = [
  { label: 'Brief comes in', icon: LightningIcon },
  { label: 'Architect', icon: TreeStructureIcon },
  { label: 'Build & test', icon: CodeIcon },
  { label: 'Shipped', icon: RocketLaunchIcon },
]

export const home = {
  headline: ['Software that keeps', 'its promises.'] as const,
  lede: 'Full-stack development, AI automation and workflow systems — built to keep running long after launch day.',
  primary: { label: 'Start a project', href: '/contact' },
  secondary: { label: 'See the work', href: '/projects' },
  stats,
  tools: { kicker: 'DAILY DRIVERS', title: 'Tools I work with' },
  cards: {
    projects: {
      title: 'Projects',
      meta: '06 BUILDS',
      body: 'Apps, workflows and internal tools built to remove one specific problem. Open a card to walk through the work.',
      href: '/projects',
      arc: [1, 2, 3, 4, 5].map((n) => ({
        src: `PLACEHOLDER - project screenshot ${n} (16:10)`,
        label: `Project ${n} · 16:10`,
      })),
    },
    about: {
      title: 'About',
      body: 'How I work, and what I refuse to ship.',
      href: '/about',
      image: {
        src: '/assets/about-workstation.gif',
        alt: 'Animated pixel-art illustration of a developer workstation',
        width: 1920,
        height: 1080,
      },
    },
    stack: {
      title: 'Stack',
      body: "The tools I build on daily, and the ones I'm still testing.",
      inUse: 'IN USE',
      experimental: 'EXPERIMENTAL',
    },
    services: { title: 'Services', hint: 'SCROLL FOR ALL SIX', href: '/services' },
    testimonials: { title: 'Testimonials', meta: 'AWAITING REAL QUOTES', href: '/testimonials' },
    credentials: { title: 'Credentials', body: 'AWS Cloud Practitioner. HackerRank Software Engineer.' },
  },
  intro: {
    steps,
    running: 'EXECUTING WORKFLOW…',
    done: 'WORKFLOW EXECUTED SUCCESSFULLY',
    skip: 'Skip',
  },
}
