import type { Metadata } from 'next'
import { legalLinks } from '@/data/legal'
import { NAV, navForPath } from '@/data/nav'

export const SITE_NAME = 'Justine Acosta · Kraft'
export const OG_BASE = { siteName: 'Kraft', type: 'website', locale: 'en_US' } as const

/** Every page search engines should know about. The thank-you page is left out on purpose. */
export const INDEXED_PATHS = [...NAV.map((n) => n.href), ...legalLinks.map((l) => l.href)]

/**
 * A route's metadata (spec §13): the title (Home carries the full site name),
 * its own description, and its canonical link. The share image comes from
 * app/opengraph-image.tsx and app/twitter-image.tsx; it is named here because
 * a page's own openGraph and twitter objects replace the root's, image and all.
 */
export function pageMetadata(href: string, description: string, label?: string): Metadata {
  const home = href === '/'
  const name = label ?? navForPath(href).label
  const full = home ? SITE_NAME : `${name} · Kraft`
  return {
    title: home ? { absolute: SITE_NAME } : name,
    description,
    alternates: { canonical: href },
    openGraph: { ...OG_BASE, title: full, description, url: href, images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title: full, description, images: ['/twitter-image'] },
  }
}
