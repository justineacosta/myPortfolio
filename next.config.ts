import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The guides in content/notes are .mdx (docs/superpowers/specs/2026-10-13-notes-design.md).
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  // The sample sites load their fonts in CORS mode, and the site preview frames
  // them sandboxed (an opaque origin): without this, every font is blocked.
  async headers() {
    return [{ source: '/samples/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] }]
  },
}

// No remark or rehype plugins: under Turbopack they must be serialisable, and none are needed.
const withMDX = createMDX({})

export default withMDX(nextConfig)
