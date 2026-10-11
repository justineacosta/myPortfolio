import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    '.superpowers/**',
    'test-results/**',
    'playwright-report/**',
    // The sample sites' own scripts, unpacked by scripts/unbundle-samples.mjs: third-party and minified.
    'public/samples/**',
  ]),
])
