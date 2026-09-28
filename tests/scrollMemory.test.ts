import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Mod = typeof import('@/lib/scrollMemory')
let m: Mod

beforeEach(async () => {
  vi.resetModules()
  sessionStorage.clear()
  window.history.replaceState(null, '', '/about')
  m = await import('@/lib/scrollMemory')
})
afterEach(() => vi.restoreAllMocks())

// Next's own entries carry __NA; Next ignores a popstate to any other entry.
const pop = (url: string, state: unknown = { __NA: true }) => {
  window.history.replaceState(state, '', url)
  window.dispatchEvent(new PopStateEvent('popstate', { state }))
}

describe('entryKey', () => {
  it('uses the Navigation API entry key where there is one', () => {
    ;(window as unknown as { navigation?: unknown }).navigation = { currentEntry: { key: 'k1' } }
    expect(m.entryKey()).toBe('k1')
    delete (window as unknown as { navigation?: unknown }).navigation
  })
  it('falls back to the path and query', () => {
    window.history.replaceState(null, '', '/about?x=1#reel')
    expect(m.entryKey()).toBe('/about?x=1')
  })
})

describe('Back and Forward', () => {
  it('restores the position saved for the entry it lands on, once', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/about')
    m.saveScroll(m.entryKey(), 640)
    window.history.replaceState(null, '', '/services')
    m.committed('/services')
    pop('/about')
    expect(m.committed('/about')).toBe(640)
    expect(m.committed('/about')).toBeNull()
    stop()
  })

  it('a fresh navigation restores nothing', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/about')
    window.history.replaceState(null, '', '/services')
    expect(m.committed('/services')).toBeNull()
    stop()
  })

  it('a hash-only step (closing a view with Back) restores nothing', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/projects')
    m.saveScroll('/projects', 300)
    pop('/projects')
    expect(m.committed('/projects')).toBeNull()
    stop()
  })

  it('scrolling while the new page swaps in never overwrites the position it will restore', async () => {
    let y = 640
    const stop = m.watchScroll(() => y)
    m.committed('/about')
    m.saveScroll('/about', 640)
    window.history.replaceState(null, '', '/services')
    m.committed('/services')
    pop('/about')
    y = 120 // the shorter page clamps the scroller
    window.dispatchEvent(new Event('scroll'))
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    expect(m.committed('/about')).toBe(640)
    stop()
  })

  it("ignores a popstate to an entry Next doesn't own (a native #fragment, e.g. the skip link)", () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/services')
    m.saveScroll('/about', 640)
    pop('/about', null)
    expect(m.committed('/services')).toBeNull()
    stop()
  })

  it('restores after Back from a page outside the site shell (Privacy, Terms)', () => {
    const stop = m.watchScroll(() => 0)
    m.committed('/services')
    m.saveScroll('/services', 800)
    stop()
    m.leftShell() // the (site) provider unmounts on the way to /privacy
    window.history.replaceState({ __NA: true }, '', '/privacy')
    pop('/services')
    expect(m.committed('/services')).toBe(800)
  })

  it('keeps working in memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => m.saveScroll('/about', 200)).not.toThrow()
    expect(m.savedScroll('/about')).toBe(200)
  })
})
