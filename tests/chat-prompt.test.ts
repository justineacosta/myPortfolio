import { describe, expect, it } from 'vitest'
import { KNOWN_PATHS, SYSTEM_PROMPT, systemBlocks } from '@/lib/chat/prompt'
import { SAMPLE_PROJECTS } from '@/lib/chat/samples'
import { CASE_SITES } from '@/data/cases/pages'
import { NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { assistantFacts } from '@/data/assistantFacts'
import { FAQS } from '@/data/faqs'
import { SERVICES } from '@/data/services'

describe("Lumen's system prompt", () => {
  it('names San Fernando as real client work, links its case study, and still calls the samples fictional', () => {
    expect(SYSTEM_PROMPT).toContain('# Real client work')
    expect(SYSTEM_PROMPT).toContain(projects.caseStudy.title)
    expect(SYSTEM_PROMPT).toContain('/projects#san-fernando')
    expect(SYSTEM_PROMPT).toContain('They are samples, never clients.')
  })

  it('is one cached block, built once with nothing per request in it', () => {
    const blocks = systemBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0]).toEqual({ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } })
    expect(systemBlocks()[0].text).toBe(blocks[0].text)
    expect(SYSTEM_PROMPT).not.toMatch(/\b20\d\d-\d\d-\d\d\b/)
  })

  it("carries the site's facts: services, FAQs, the working-with facts and every sample", () => {
    for (const s of SERVICES) expect(SYSTEM_PROMPT).toContain(s.name)
    for (const f of FAQS) expect(SYSTEM_PROMPT).toContain(f.a)
    expect(SYSTEM_PROMPT).toContain(assistantFacts.billing)
    expect(SYSTEM_PROMPT).toContain(assistantFacts.availability)
    for (const p of SAMPLE_PROJECTS) expect(SYSTEM_PROMPT).toContain(`\`${p.key}\``)
  })

  it('lists exactly the sample slugs a card may name, one per case', () => {
    expect(SAMPLE_PROJECTS.map((p) => p.key).sort()).toEqual([...CASE_SITES].sort())
    expect(SAMPLE_PROJECTS.every((p) => p.trade && p.builds.length && p.flows.length)).toBe(true)
  })

  it('covers the questions that need care, and its examples only name cards that exist', () => {
    for (const s of ['Have you built anything like that?', "Did you build [a named company's product]?", 'Guarantees', 'Follow-ups', 'How does a project start?']) expect(SYSTEM_PROMPT).toContain(s)
    const slugs = new Set(SAMPLE_PROJECTS.map((p) => p.key))
    for (const [, slug] of SYSTEM_PROMPT.matchAll(/\[\[project:([a-z0-9-]+)\]\]/g)) expect(slugs.has(slug), slug).toBe(true)
  })

  it('never gives Lumen an email address, and calls the samples fictional', () => {
    expect(SYSTEM_PROMPT).not.toContain(profile.email)
    expect(SYSTEM_PROMPT).not.toMatch(/[\w.+-]+@[\w-]+\.\w+/)
    expect(SYSTEM_PROMPT).toContain('They are samples, never clients')
  })
})

describe('the paths a reply may link to', () => {
  // Built once at load, from the pages data/nav.ts ships switched on (the test setup switches them all on afterwards).
  it('are nav pages, the standalone pages, and each sample’s case study and site', () => {
    for (const path of ['/', '/projects', '/services', '/about', '/contact']) expect(KNOWN_PATHS.has(path), path).toBe(true)
    for (const path of KNOWN_PATHS) if (!path.endsWith('.html')) expect(NAV.some((n) => n.href === path), path).toBe(true)
    for (const p of SAMPLE_PROJECTS) {
      expect(KNOWN_PATHS.has(p.href)).toBe(true)
      expect(KNOWN_PATHS.has(p.site)).toBe(true)
    }
    expect(KNOWN_PATHS.has('/ai-agents.html')).toBe(true)
  })
})
