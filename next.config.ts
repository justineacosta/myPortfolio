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
      // The sample sites load their fonts in CORS mode, and the site preview frames
      // them sandboxed (an opaque origin): without this, every font is blocked.
      { source: '/samples/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] },
    ]
  },
}

// No remark or rehype plugins: under Turbopack they must be serialisable, and none are needed.
const withMDX = createMDX({})

export default withMDX(nextConfig)
