import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The AI agents card's old content came from the kape reference portfolio
 * (spec 2026-10-01-agents-page §5.3). None of it may reach a visitor. Code
 * comments that credit the reference are fine, so this reads what the site
 * shows: every string the data files export, and the generated pages.
 */
const BANNED = /kape|brewedops|\bken ai\b/i
const strings = (v: unknown, seen = new Set<unknown>()): string[] => {
  if (typeof v === 'string') return [v]
  if (!v || typeof v !== 'object' || seen.has(v)) return []
  seen.add(v)
  return Object.values(v).flatMap((x) => strings(x, seen))
}

describe('no kape content', () => {
  for (const file of readdirSync('data').filter((f) => f.endsWith('.ts'))) {
    it(`data/${file} exports none`, async () => {
      const mod = await import(`../data/${file.replace(/\.ts$/, '')}`)
      expect(strings(mod).filter((s) => BANNED.test(s))).toEqual([])
      // A cold import of a large data file can pass 5 s while the whole suite runs.
    }, 30_000)
  }

  for (const file of readdirSync('public').filter((f) => f.endsWith('.html'))) {
    it(`public/${file} shows none`, () => {
      expect(readFileSync(join('public', file), 'utf8')).not.toMatch(BANNED)
    })
  }
})
