import type { MetadataRoute } from 'next'
import { notePath, visibleNotes } from '@/data/notes'
import { indexedPaths, STATIC_PAGES } from '@/lib/seo'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [...indexedPaths(), ...STATIC_PAGES, ...visibleNotes().map((n) => notePath(n.slug))].map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }))
}
