import type { Icon } from '@phosphor-icons/react'
import {
  BriefcaseIcon,
  ChatCircleDotsIcon,
  FlagIcon,
  FolderOpenIcon,
  HouseIcon,
  PaperPlaneTiltIcon,
  QuotesIcon,
  StackIcon,
  UserCircleIcon,
  UserIcon,
} from '@phosphor-icons/react/ssr'

export type NavItem = { href: string; label: string; hint: string; eyebrow: string; icon: Icon }
export type MobileNavItem = { href: string; label: string; icon: Icon; center?: boolean }

/** Sidebar order and numbering (spec §7). Hints are Kraft's crumbs. */
export const NAV: NavItem[] = [
  { href: '/', label: 'Home', hint: 'OVERVIEW', eyebrow: 'HOME / OVERVIEW', icon: HouseIcon },
  { href: '/projects', label: 'Projects', hint: 'BUILDS', eyebrow: 'PROJECTS / BUILDS', icon: FolderOpenIcon },
  { href: '/showcase', label: 'Showcase', hint: 'FLAGSHIP', eyebrow: 'SHOWCASE / FLAGSHIP', icon: FlagIcon },
  { href: '/services', label: 'Services', hint: 'OFFERS', eyebrow: 'SERVICES / OFFERS', icon: StackIcon },
  { href: '/testimonials', label: 'Testimonials', hint: 'CLIENTS', eyebrow: 'TESTIMONIALS / CLIENTS', icon: QuotesIcon },
  { href: '/about', label: 'About', hint: 'PROFILE', eyebrow: 'ABOUT / PROFILE', icon: UserCircleIcon },
  { href: '/contact', label: 'FAQs / Contact', hint: 'INQUIRY', eyebrow: 'FAQS / CONTACT', icon: ChatCircleDotsIcon },
]

/** Kraft's phone nav. Showcase and Testimonials are reached from Home and ⌘K. */
export const MOBILE_NAV: MobileNavItem[] = [
  { href: '/', label: 'Home', icon: HouseIcon },
  { href: '/projects', label: 'Work', icon: BriefcaseIcon },
  { href: '/contact', label: 'Start', icon: PaperPlaneTiltIcon, center: true },
  { href: '/services', label: 'Services', icon: StackIcon },
  { href: '/about', label: 'About', icon: UserIcon },
]

export function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function navForPath(pathname: string): NavItem {
  return NAV.find((n) => isActivePath(pathname, n.href)) ?? NAV[0]
}

/** Shell copy that isn't a nav item: the skip link and the legal links' landmark name. */
export const shellCopy = { skipLink: 'Skip to main content', legalNav: 'Legal' }
