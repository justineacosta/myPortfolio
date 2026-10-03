import type { Metadata } from 'next'
import { navForPath, visibleNav } from '@/data/nav'
import { profile } from '@/data/profile'
import { isPlaceholder } from './placeholder'
import { SHARE_ALT, SHARE_SIZE } from './share-meta'

export const SITE_NAME = `${profile.name} · ${profile.studio}`
export const OG_BASE = { siteName: profile.studio, type: 'website', locale: 'en_US' } as const

/** Every page search engines should know about: the switched-on ones. The thank-you page is left out on purpose. */
export const indexedPaths = () => visibleNav().map((n) => n.href)

/** Stand-alone pages in public/ that search engines should find too (spec 2026-09-30: the build plan). */
export const STATIC_PAGES = ['/build-plan.html', '/end-to-end.html', '/agentic-framework.html', '/ai-agents.html', '/automations.html']

/**
 * A route's metadata (spec §13): the title (Home carries the full site name),
 * its own description, and its canonical link. The share image comes from
 * app/opengraph-image.tsx and app/twitter-image.tsx; it is named here because
 * a page's own openGraph and twitter objects replace the root's, image and all.
 */
export function pageMetadata(href: string, description: string, label?: string): Metadata {
  const home = href === '/'
  const name = label ?? navForPath(href).label
  const full = home ? SITE_NAME : `${name} · ${profile.studio}`
  return {
    title: home ? { absolute: SITE_NAME } : name,
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
