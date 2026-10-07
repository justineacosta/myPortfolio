import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The sample sites load their fonts in CORS mode, and the site preview frames
  // them sandboxed (an opaque origin): without this, every font is blocked.
  async headers() {
    return [{ source: '/samples/:path*', headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }] }]
  },
}

export default nextConfig
