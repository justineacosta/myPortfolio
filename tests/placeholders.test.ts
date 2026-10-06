import { expect, it } from 'vitest'
import { findPlaceholders } from '../scripts/placeholders'

// It reads every content file, a set that grows with each case site; under the full suite’s load that can outrun the default five seconds.
it('lists every content gap still marked PLACEHOLDER, with its file and line', { timeout: 30_000 }, () => {
  const hits = findPlaceholders()
  expect(hits.some((h) => h.file === 'data/testimonials.ts' && h.text.startsWith('PLACEHOLDER - client name'))).toBe(true)
  // The sample sites are real pages now, so none of them is a gap.
  expect(hits.some((h) => h.file.startsWith('public/samples/'))).toBe(false)
  expect(hits.every((h) => h.text.startsWith('PLACEHOLDER') && h.line > 0)).toBe(true)
})
