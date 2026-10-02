import { describe, expect, it, vi } from 'vitest'

describe('state shared across separately bundled routes', () => {
  it('gives the same lead ledger to a second import of the module', async () => {
    vi.resetModules()
    const first = (await import('@/lib/assistant/ledger')).conversationLeads
    vi.resetModules()
    const second = (await import('@/lib/assistant/ledger')).conversationLeads
    expect(second).toBe(first)
    first.add('ledger-singleton-check')
    expect(second.has('ledger-singleton-check')).toBe(true)
  })

  it('counts a second import of the lead limiter against the same budget', async () => {
    vi.resetModules()
    const first = (await import('@/lib/leadLimit')).leadAllowed
    vi.resetModules()
    const second = (await import('@/lib/leadLimit')).leadAllowed
    expect(Array.from({ length: 3 }, () => first('198.51.100.50'))).toEqual([true, true, true])
    expect([second('198.51.100.50'), second('198.51.100.50'), second('198.51.100.50')]).toEqual([true, true, false])
  })
})
