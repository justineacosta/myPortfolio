import { describe, expect, it } from 'vitest'
import { KNOWLEDGE, KNOWN_PATHS, buildKnowledge, textOf } from '@/lib/chat/knowledge'
import { SERVICES } from '@/data/services'
import { FAQS } from '@/data/faqs'
import { profile } from '@/data/profile'
import { CERTS } from '@/data/credentials'
import { CASES } from '@/data/cases'
import { casePath } from '@/data/cases/pages'

describe('the chat knowledge block', () => {
  it('builds the same string every time', () => {
    expect(buildKnowledge()).toBe(buildKnowledge())
  })

  it("carries the site's own copy", () => {
    const block = buildKnowledge()
    expect(block).toContain(SERVICES[0].name)
    expect(block).toContain(FAQS[0].a)
    expect(block).toContain(profile.name)
    expect(block).toContain(CERTS[0].name)
  })

  it('has a digest of every case, by its first agents build', () => {
    const block = buildKnowledge()
    for (const [key, set] of Object.entries(CASES)) {
      const name = set.agents?.builds[0]?.business.name
      expect(name, key).toBeTruthy()
      expect(block, key).toContain(name!)
    }
  })

  it('fits the budget', () => {
    expect(KNOWLEDGE.length).toBeLessThanOrEqual(160_000)
  })

  it('keeps words and drops icons, logos, addresses and ids', () => {
    expect(textOf({ icon: () => null, logos: [{ name: 'X', slug: 'x' }], email: 'a@b.c', line: 'Kept' })).toEqual(['Kept'])
  })

  it('keeps leaf numbers, drops numbers under a skipped key, and collapses neighbouring repeats', () => {
    expect(textOf({ n: 3, id: 7, rows: [' a ', 'a', '', 'b', 'a'] })).toEqual(['3', 'a', 'b', 'a'])
  })

  it('lists the paths a section is headed with', () => {
    for (const path of ['/services', '/projects', '/about', '/contact']) expect(KNOWN_PATHS.has(path), path).toBe(true)
    for (const key of Object.keys(CASES)) expect(KNOWN_PATHS.has(casePath(key, 'ai-agents.html')), key).toBe(true)
  })
})
