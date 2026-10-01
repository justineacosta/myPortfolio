import { expect, it } from 'vitest'
import { findPlaceholders } from '../scripts/placeholders'

it('lists every content gap still marked PLACEHOLDER, with its file and line', () => {
  const hits = findPlaceholders()
  expect(hits.some((h) => h.file === 'data/profile.ts' && h.text.startsWith('PLACEHOLDER - your contact email'))).toBe(true)
  // The sample sites are real pages now, so none of them is a gap.
  expect(hits.some((h) => h.file.startsWith('public/samples/'))).toBe(false)
  expect(hits.every((h) => h.text.startsWith('PLACEHOLDER') && h.line > 0)).toBe(true)
})
