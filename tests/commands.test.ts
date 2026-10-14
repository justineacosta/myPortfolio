import { describe, expect, it, vi } from 'vitest'
import { NOTES } from '@/data/notes'
import { NAV } from '@/data/nav'
import { PROJECT_VIEWS, projects } from '@/data/projects'
import { COMMANDS, commands, filterCommands, SECTIONS } from '@/lib/commands'
import { splitHref } from '@/lib/hash'

describe('filterCommands', () => {
  it('still returns every entry for an empty query once a guide is published', () => {
    const was = NOTES[0].draft
    NOTES[0].draft = false
    try {
      expect(filterCommands('')).toEqual(commands())
      expect(commands().map((c) => c.href)).toContain(`/notes/${NOTES[0].slug}`)
    } finally {
      NOTES[0].draft = was
    }
  })
  it('lists each visible guide in ⌘K while Notes is on, and none while it is off', () => {
    vi.stubEnv('NODE_ENV', 'development')
    try {
      const n = NOTES[0]
      expect(commands().find((c) => c.href === `/notes/${n.slug}`)).toMatchObject({ label: n.title })
      expect(filterCommands(n.title.slice(0, 12)).map((c) => c.href)).toContain(`/notes/${n.slug}`)
      const item = NAV.find((x) => x.href === '/notes')!
      item.hidden = true
      try {
        expect(commands().some((c) => c.href.startsWith('/notes'))).toBe(false)
      } finally {
        item.hidden = false
      }
    } finally {
      vi.unstubAllEnvs()
    }
  })

  it('finds the San Fernando case study, led by its first logo', () => {
    const hit = COMMANDS.find((c) => c.href === '/projects#san-fernando')!
    expect(hit).toMatchObject({ label: 'Barangay San Fernando', logo: 'nextdotjs' })
    expect(filterCommands('san fernando').map((c) => c.href)).toContain('/projects#san-fernando')
  })
  it('returns everything for an empty or blank query', () => {
    expect(filterCommands('')).toEqual(commands())
    expect(filterCommands('   ')).toEqual(commands())
  })
  it('matches labels case-insensitively', () => {
    expect(filterCommands('SERV').map((c) => c.href)).toEqual(['/services'])
  })
  it("matches Kraft's hints too", () => {
    expect(filterCommands('builds')[0].href).toBe('/projects')
  })
  it('returns nothing for no match', () => {
    expect(filterCommands('zzz')).toEqual([])
  })
})

describe('SECTIONS', () => {
  it('follow the pages, each a hash link on its page', () => {
    expect(COMMANDS.slice(0, NAV.length).map((c) => c.href)).toEqual(NAV.map((n) => n.href))
    expect(SECTIONS.map((s) => s.href)).toEqual([
      '/projects#san-fernando', '/projects#automations', '/projects#build-plan', '/projects#agentic-framework',
      '/projects#end-to-end', '/projects#sites', '/projects#ai-agents',
      '/services#method', '/services#automation', '/contact#faqs',
    ])
    expect(new Set(COMMANDS.map((c) => c.id)).size).toBe(COMMANDS.length)
  })

  it('point every Projects entry at a real sub-view', () => {
    for (const s of SECTIONS.filter((c) => c.href.startsWith('/projects#'))) {
      expect(PROJECT_VIEWS).toContain(splitHref(s.href).hash)
    }
  })

  it('show each Projects entry with its card’s lead logo; the rest keep an icon', () => {
    const c = projects.cards
    const lead = [projects.caseStudy.stack, ...[c.automations, c.plan, ...projects.writeups, c.sites, c.agents].map((x) => x.logos)].map((l) => l[0].slug)
    const views = SECTIONS.filter((s) => s.href.startsWith('/projects#'))
    expect(views.map((s) => s.logo)).toEqual(lead)
    for (const s of COMMANDS.filter((x) => !x.href.startsWith('/projects#'))) expect(s.icon, s.id).toBeDefined()
  })

  it('find a sub-view by name', () => {
    expect(filterCommands('agentic').map((c) => c.href)).toEqual(['/projects#agentic-framework'])
    expect(filterCommands('quick answers').map((c) => c.href)).toEqual(['/contact#faqs'])
  })
})
