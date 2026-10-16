import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NavigationProvider, SWAP_MS, useShellNav } from '@/components/shell/NavigationProvider'

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: '/services' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, prefetch: vi.fn() }),
  usePathname: () => nav.pathname,
}))

const setup = () => renderHook(() => useShellNav(), { wrapper: NavigationProvider })

const section = (id: string) => {
  const el = document.createElement('section')
  el.id = id
  document.body.appendChild(el)
  return el
}

describe('NavigationProvider with hash links', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nav.push.mockReset()
    nav.pathname = '/services'
    window.history.replaceState(null, '', '/services')
    document.body.innerHTML = ''
  })
  afterEach(() => vi.useRealTimers())

  it('a section on the current page: no fade, no navigation, the hash is announced', () => {
    const heard = vi.fn()
    window.addEventListener('hashchange', heard)
    const { result } = setup()
    act(() => result.current.go('/services#method'))
    expect(result.current.swapping).toBe(false)
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('#method')
    expect(heard).toHaveBeenCalledTimes(1)
    window.removeEventListener('hashchange', heard)
  })

  it('scrolls a section on the current page into view', () => {
    const spy = vi.spyOn(section('method'), 'scrollIntoView')
    const { result } = setup()
    act(() => result.current.go('/services#method'))
    expect(spy).toHaveBeenCalled()
  })

  it('a section on another page: fades, then pushes the full link', () => {
    const { result } = setup()
    act(() => result.current.go('/contact#faqs'))
    expect(result.current.swapping).toBe(true)
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledWith('/contact#faqs', { scroll: false })
  })

  it('lands on the section once the other page commits', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/contact#faqs'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    const spy = vi.spyOn(section('faqs'), 'scrollIntoView')
    window.history.replaceState(null, '', '/contact#faqs')
    nav.pathname = '/contact'
    rerender()
    expect(spy).toHaveBeenCalled()
  })

  it('a hash link still lets a later click win while its page loads', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/contact#faqs'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    act(() => result.current.go('/about'))
    nav.pathname = '/contact' // the hash link's page commits late
    rerender()
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenLastCalledWith('/about', { scroll: false })
  })
})
