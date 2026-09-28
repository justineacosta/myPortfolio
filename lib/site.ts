/**
 * The site's public address, for canonical links, the sitemap and the share
 * image (spec §13). Set NEXT_PUBLIC_SITE_URL once the domain is final (see
 * .env.example). Until then, a Vercel build uses the project's production
 * domain. Server-only: it is read at build time.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  const set = env.NEXT_PUBLIC_SITE_URL?.trim()
  if (set) return set.replace(/\/+$/, '')
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel}`
  return 'http://localhost:3000'
}

export const SITE_URL = siteUrl()
