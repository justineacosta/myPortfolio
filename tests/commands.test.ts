import { describe, expect, it } from 'vitest'
import { NAV } from '@/data/nav'
import { PROJECT_VIEWS } from '@/data/projects'
import { COMMANDS, filterCommands, SECTIONS } from '@/lib/commands'
import { splitHref } from '@/lib/hash'

describe('filterCommands', () => {
  it('returns everything for an empty or blank query', () => {
    expect(filterCommands('')).toEqual(COMMANDS)
    expect(filterCommands('   ')).toEqual(COMMANDS)
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
      '/projects#reel', '/projects#build-plan', '/projects#agentic-framework',
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

  it('find a sub-view by name', () => {
    expect(filterCommands('agentic').map((c) => c.href)).toEqual(['/projects#agentic-framework'])
    expect(filterCommands('quick answers').map((c) => c.href)).toEqual(['/contact#faqs'])
  })
})
