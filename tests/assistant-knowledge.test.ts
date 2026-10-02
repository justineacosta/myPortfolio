import { describe, expect, it } from 'vitest'
import { about, ROLES } from '@/data/about'
import { FACTS } from '@/data/assistantFacts'
import { FAQS } from '@/data/faqs'
import { NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { projects } from '@/data/projects'
import { PROCESS, SERVICES } from '@/data/services'
import { showcase } from '@/data/showcase'
import { CLIENTS } from '@/data/testimonials'
import { commands } from '@/lib/commands'
import { buildKnowledge, siteKnowledge } from '@/lib/assistant/knowledge'
import { PERSONA, systemBlocks } from '@/lib/assistant/prompt'

const hide = (href: string) => {
  NAV.find((n) => n.href === href)!.hidden = true
}

describe('buildKnowledge', () => {
  it('names the services, method steps, FAQs, write-ups, roles and the person', () => {
    const k = buildKnowledge()
    for (const s of SERVICES) expect(k).toContain(s.name)
    for (const p of PROCESS) expect(k).toContain(p.name)
    for (const f of FAQS) expect(k).toContain(f.q)
    for (const w of projects.writeups) expect(k).toContain(w.title)
    expect(k).toContain(projects.cards.agents.title)
    for (const r of ROLES) expect(k).toContain(r.name)
    expect(k).toContain(profile.name)
    expect(k).toContain(about.location.title)
  })

  it('carries the facts beyond the site: career, education, background, working with Justine and beliefs', () => {
    const k = buildKnowledge()
    for (const job of FACTS.career) expect(k).toContain(job.role)
    expect(k).toContain(FACTS.education.school)
    expect(k).toContain('English and Filipino')
    expect(k).toContain(FACTS.working.billing)
    expect(k).toContain(FACTS.working.ownership)
    for (const b of FACTS.beliefs) expect(k).toContain(b)
    // His email and old site never reach the assistant.
    expect(k).not.toMatch(/@gmail\.com|vercel\.app/)
  })

  it('leaves out placeholders and the contact email', () => {
    const k = buildKnowledge()
    expect(k).not.toContain('PLACEHOLDER')
    expect(k).not.toContain(profile.email)
  })

  it('links only to pages and sections that commands() lists', () => {
    const k = buildKnowledge()
    const hrefs = new Set(commands().map((c) => c.href))
    const links = [...k.matchAll(/\]\((\/[^)]*)\)/g)].map((m) => m[1])
    expect(links.length).toBeGreaterThan(0)
    for (const l of links) expect(hrefs).toContain(l)
  })

  it('leaves out the pages that are switched off, and links to them', () => {
    hide('/showcase')
    hide('/testimonials')
    const k = buildKnowledge()
    for (const line of showcase.title) expect(k).not.toContain(line)
    for (const c of CLIENTS) expect(k).not.toContain(c.name)
    expect(k).not.toContain('/showcase')
    expect(k).not.toContain('/testimonials')
  })

  it('includes the showcase page when it is switched on', () => {
    const k = buildKnowledge()
    for (const line of showcase.title) expect(k).toContain(line)
    expect(k).toContain('](/showcase)')
  })

  it('stays under 30k tokens and over the 4,096-token minimum Haiku 4.5 caches', () => {
    const n = buildKnowledge().length
    expect(n / 4).toBeLessThan(30_000)
    expect(n).toBeGreaterThan(4_096 * 4)
  })

  it('is built once for siteKnowledge', () => {
    expect(siteKnowledge.text()).toBe(buildKnowledge())
    expect(siteKnowledge.text()).toBe(siteKnowledge.text())
  })
})

describe('systemBlocks', () => {
  it('is one cached block: the persona, then the knowledge', () => {
    const blocks = systemBlocks(PERSONA, siteKnowledge)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('text')
    expect(blocks[0].text.startsWith(PERSONA)).toBe(true)
    expect(blocks[0].text.endsWith(buildKnowledge())).toBe(true)
    expect(blocks[0].cache_control).toEqual({ type: 'ephemeral' })
  })

  it('names the assistant and refers to Justine by name, then he/him', () => {
    expect(PERSONA).toContain('Kraft’s assistant')
    expect(PERSONA).toContain('Justine Acosta')
    expect(PERSONA).toContain('he/him')
    expect(PERSONA).not.toContain('Never use pronouns')
  })
})
