import type { Metadata } from 'next'
import { navForPath, visibleNav } from '@/data/nav'
import { profile } from '@/data/profile'
import { isPlaceholder } from './placeholder'
import { SHARE_ALT, SHARE_SIZE } from './share-meta'

export const OG_BASE = { siteName: profile.studio, type: 'website', locale: 'en_US' } as const

/** Home's title in search results: the name people search for and what the work is. */
export const HOME_TITLE = `${profile.name} · Full-stack & AI Automation Developer`

/** The template after every other page's title, so each one carries the name too. */
export const TITLE_TEMPLATE = `%s · ${profile.name}`

/**
 * Each page's title in search results, in the words people search with
 * (under 60 characters once TITLE_TEMPLATE adds the name). A page left out
 * falls back to its nav label.
 */
const SEARCH_TITLES: Record<string, string> = {
  '/projects': 'Web, AI Agent & Automation Projects',
  '/services': 'Web Apps, AI Agents & n8n Automation',
  '/about': 'About · Full-stack Developer in Manila',
  '/contact': 'Contact & FAQs · Start a Project',
  '/notes': 'Guides to AI Agents & Automation',
}

/** Every page search engines should know about: the switched-on ones. The thank-you page is left out on purpose. */
export const indexedPaths = () => visibleNav().map((n) => n.href)

/** Stand-alone pages in public/ that search engines should find too (spec 2026-09-30: the build plan). */
export const STATIC_PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html', '/ai-agents.html', '/automations.html']

/**
 * A route's metadata (spec §13): the title (Home's is HOME_TITLE, the rest
 * their search title or `label`), its own description, and its canonical link. The share image comes from
 * app/opengraph-image.tsx and app/twitter-image.tsx; it is named here because
 * a page's own openGraph and twitter objects replace the root's, image and all.
 */
export function pageMetadata(href: string, description: string, label?: string): Metadata {
  const home = href === '/'
  const name = label ?? SEARCH_TITLES[href] ?? navForPath(href).label
  const full = home ? HOME_TITLE : TITLE_TEMPLATE.replace('%s', name)
  return {
    title: home ? { absolute: HOME_TITLE } : name,
    description,
    alternates: { canonical: href },
    openGraph: { ...OG_BASE, title: full, description, url: href, images: [{ url: '/opengraph-image', ...SHARE_SIZE, alt: SHARE_ALT }] },
    twitter: { card: 'summary_large_image', title: full, description, images: [{ url: '/twitter-image', ...SHARE_SIZE, alt: SHARE_ALT }] },
  }
}

/** A page's meta description: its lede, or `fallback` while the lede is still a PLACEHOLDER. */
export function ledeOr(lede: string, fallback: string): string {
  return isPlaceholder(lede) ? fallback : lede
}
