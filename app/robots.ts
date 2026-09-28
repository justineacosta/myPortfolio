import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** The sample sites are stand-ins for client work, so crawlers stay out of them. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/samples/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
