import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearHash, currentHash, pushHash, splitHref } from '@/lib/hash'
import { registerLenis, scrollToSection, SECTION_OFFSET } from '@/lib/scroller'

describe('splitHref', () => {
  it('splits a path from its hash', () => {
    expect(splitHref('/projects#build-plan')).toEqual({ path: '/projects', hash: 'build-plan' })
  })
  it('leaves a plain path alone', () => {
    expect(splitHref('/about')).toEqual({ path: '/about', hash: '' })
  })
})

describe('pushHash / clearHash', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects?x=1'))

  it('adds one history entry, announces it, and never duplicates the entry', () => {
    const heard = vi.fn()
    window.addEventListener('hashchange', heard)
    const before = window.history.length
    pushHash('reel')
    expect(currentHash()).toBe('reel')
    expect(window.history.length).toBe(before + 1)
    pushHash('reel')
    expect(window.history.length).toBe(before + 1)
    expect(heard).toHaveBeenCalledTimes(2)
    window.removeEventListener('hashchange', heard)
  })

  it('clears the hash in place, keeping the path and the query', () => {
    pushHash('reel')
    const len = window.history.length
    clearHash()
    expect(window.location.pathname + window.location.search + window.location.hash).toBe('/projects?x=1')
    expect(window.history.length).toBe(len)
  })
})

describe('scrollToSection', () => {
  it('brings a section into view, and ignores missing ids and anything inside a dialog', () => {
    document.body.innerHTML = '<section id="faqs"></section><dialog><div id="inside"></div></dialog>'
    const spy = vi.spyOn(document.getElementById('faqs')!, 'scrollIntoView')
    expect(scrollToSection('faqs', { smooth: true })).toBe(true)
    expect(spy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
    expect(scrollToSection('nope', { smooth: true })).toBe(false)
    expect(scrollToSection('inside', { smooth: true })).toBe(false)
    expect(scrollToSection('', { smooth: true })).toBe(false)
  })

  it('goes through Lenis when Lenis owns the panel, clearing the sticky top bar', () => {
    document.body.innerHTML = '<section id="method"></section>'
    const lenis = { scrollTo: vi.fn() }
    registerLenis(lenis)
    scrollToSection('method', { smooth: false })
    expect(lenis.scrollTo).toHaveBeenCalledWith(document.getElementById('method'), {
      immediate: true,
      force: true,
      offset: -SECTION_OFFSET,
    })
    registerLenis(null)
  })
})
