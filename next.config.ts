import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The guides in content/notes are .mdx (docs/superpowers/specs/2026-10-13-notes-design.md).
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  async headers() {
    return [
      // Every page may be framed only by the site itself (the project views, the site preview and
      // Lumen's frame), never by another site. X-Frame-Options covers browsers without frame-ancestors.
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // public/ files default to max-age=0, so every reload re-asks the CDN for each logo, image
      // and font, and Vercel counts each 304 as an edge request. Their names aren't hashed, so a
      // replaced file can show stale for up to a week; rename it to bust the cache sooner.
      {
        source: '/:dir(icons|assets|shots|cases|samples)/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
      },
      // Pages (the sample sites, the case pages) keep the default, so an edit shows on the next load.
      { source: '/:file(.*\\.html)', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      // The sample sites load their fonts in CORS mode, and the site preview frames
      // them sandboxed (an opaque origin): without this, every font is blocked.
      { source: '/samples/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
    ]
  },
}

// No remark or rehype plugins: under Turbopack they must be serialisable, and none are needed.
const withMDX = createMDX({})

export default withMDX(nextConfig)
