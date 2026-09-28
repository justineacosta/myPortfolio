import { describe, expect, it } from 'vitest'
import { COMMANDS, filterCommands } from '@/lib/commands'

describe('filterCommands', () => {
  it('returns everything for an empty or blank query', () => {
    expect(filterCommands('')).toEqual(COMMANDS)
    expect(filterCommands('   ')).toEqual(COMMANDS)
  })
  it('matches labels case-insensitively', () => {
    expect(filterCommands('SERV').map((c) => c.href)).toEqual(['/services'])
  })
  it("matches Kraft's hints too", () => {
    expect(filterCommands('builds').map((c) => c.href)).toEqual(['/projects'])
  })
  it('returns nothing for no match', () => {
    expect(filterCommands('zzz')).toEqual([])
  })
})
