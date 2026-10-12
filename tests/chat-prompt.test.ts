import { describe, expect, it, vi } from 'vitest'
import { guidesSection, KNOWN_PATHS, SYSTEM_PROMPT, systemBlocks } from '@/lib/chat/prompt'
import { pageFor } from '@/lib/chat/pages'
import { NOTES } from '@/data/notes'
import { SAMPLE_PROJECTS } from '@/lib/chat/samples'
import { CASE_SITES } from '@/data/cases/pages'
import { NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { assistantFacts } from '@/data/assistantFacts'
import { FAQS } from '@/data/faqs'
import { SERVICES } from '@/data/services'

describe("Lumen's system prompt", () => {
  it('lists the visible guides for Lumen, and says nothing of them when there are none', () => {
    expect(guidesSection([])).toBe('')
    const n = NOTES[0]
    const section = guidesSection([n])
    expect(section).toContain('# Guides (/notes)')
    expect(section).toContain(n.title)
    expect(section).toContain(n.summary)
    expect(section).toContain(`(/notes/${n.slug})`)
  })

  it('lets a reply link each visible guide, built fresh with drafts showing', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    try {
      // A fresh data/nav ships /notes switched off; vitest.setup.ts only switched the old copy on.
      const nav = await import('@/data/nav')
      for (const item of nav.NAV) item.hidden = false
      const fresh = await import('@/lib/chat/prompt')
      for (const n of NOTES) expect(fresh.KNOWN_PATHS.has(`/notes/${n.slug}`), n.slug).toBe(true)
      expect(fresh.SYSTEM_PROMPT).toContain('# Guides (/notes)')
    } finally {
      vi.unstubAllEnvs()
      vi.resetModules()
    }
  })

  it('knows what the Notes page is for', () => {
    expect(pageFor('/notes')?.about).toMatch(/guides/i)
  })

  it('no longer says everything here is a sample, and routes "case study" to San Fernando too', () => {
    expect(SYSTEM_PROMPT).not.toContain("What you'll find here are sample systems for fictional businesses")
    expect(SYSTEM_PROMPT).toMatch(/"case study":.*\/projects#san-fernando/)
  })

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

/** A reply may link a nav page, or a guide on /notes. */
const isLinkable = (path: string, nav: { href: string }[], notes: { slug: string }[]) =>
  nav.some((n) => n.href === path) || notes.some((n) => `/notes/${n.slug}` === path)

describe('the paths a reply may link to', () => {
  it('keeps its rule once Notes ships switched on with a published guide', async () => {
    vi.resetModules()
    try {
      const nav = await import('@/data/nav')
      nav.NAV.find((n) => n.href === '/notes')!.hidden = false
      const notes = await import('@/data/notes')
      notes.NOTES[0].draft = false
      const fresh = await import('@/lib/chat/prompt')
      expect(fresh.KNOWN_PATHS.has(`/notes/${notes.NOTES[0].slug}`)).toBe(true)
      for (const path of fresh.KNOWN_PATHS) if (!path.endsWith('.html')) expect(isLinkable(path, nav.NAV, notes.NOTES), path).toBe(true)
    } finally {
      vi.resetModules()
    }
  })
  // Built once at load, from the pages data/nav.ts ships switched on (the test setup switches them all on afterwards).
  it('are nav pages, the standalone pages, and each sample’s case study and site', () => {
    for (const path of ['/', '/projects', '/services', '/about', '/contact']) expect(KNOWN_PATHS.has(path), path).toBe(true)
    for (const path of KNOWN_PATHS) if (!path.endsWith('.html')) expect(isLinkable(path, NAV, NOTES), path).toBe(true)
    for (const p of SAMPLE_PROJECTS) {
      expect(KNOWN_PATHS.has(p.href)).toBe(true)
      expect(KNOWN_PATHS.has(p.site)).toBe(true)
    }
    expect(KNOWN_PATHS.has('/ai-agents.html')).toBe(true)
  })
})
