import { expect, it } from 'vitest'
import { findPlaceholders } from '../scripts/placeholders'

it('lists every content gap still marked PLACEHOLDER, with its file and line', () => {
  const hits = findPlaceholders()
  expect(hits.some((h) => h.file === 'data/profile.ts' && h.text.startsWith('PLACEHOLDER - your contact email'))).toBe(true)
  expect(hits.some((h) => h.file.startsWith('public/samples/'))).toBe(true)
  expect(hits.every((h) => h.text.startsWith('PLACEHOLDER') && h.line > 0)).toBe(true)
})
