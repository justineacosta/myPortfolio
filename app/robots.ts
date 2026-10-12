import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** The sample sites and their case pages are stand-ins for client work, so crawlers stay out of them, and of /lumen, the chat those pages frame. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/samples/', '/cases/', '/lumen'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
