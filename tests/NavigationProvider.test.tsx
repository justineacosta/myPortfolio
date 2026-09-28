import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { NavigationProvider, SWAP_MS, useShellNav } from '@/components/shell/NavigationProvider'
import { installMatchMedia } from '@/test/matchMedia'

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: '/' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}))

const setup = () => renderHook(() => useShellNav(), { wrapper: NavigationProvider })

describe('NavigationProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    nav.push.mockReset()
    nav.pathname = '/'
  })
  afterEach(() => vi.useRealTimers())

  it('fades out for SWAP_MS, then pushes without Next scroll handling', () => {
    const { result } = setup()
    act(() => result.current.go('/projects'))
    expect(result.current.swapping).toBe(true)
    expect(nav.push).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledWith('/projects', { scroll: false })
  })

  it('stops swapping once the route has changed', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/projects'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    nav.pathname = '/projects'
    rerender()
    expect(result.current.swapping).toBe(false)
  })

  it('lets the last of two rapid clicks win', () => {
    const { result } = setup()
    act(() => result.current.go('/projects'))
    act(() => vi.advanceTimersByTime(80))
    act(() => result.current.go('/about'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).toHaveBeenCalledTimes(1)
    expect(nav.push).toHaveBeenCalledWith('/about', { scroll: false })
  })

  it('does not navigate when the current page is clicked', () => {
    const { result } = setup()
    act(() => result.current.go('/'))
    act(() => vi.advanceTimersByTime(SWAP_MS))
    expect(nav.push).not.toHaveBeenCalled()
    expect(result.current.swapping).toBe(false)
  })

  it('navigates immediately for reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { result } = setup()
    act(() => result.current.go('/about'))
    expect(nav.push).toHaveBeenCalledWith('/about', { scroll: false })
    expect(result.current.swapping).toBe(false)
  })

  it('never stays invisible after a back/forward navigation elsewhere', () => {
    const { result, rerender } = setup()
    act(() => result.current.go('/projects'))
    nav.pathname = '/services' // user pressed back/forward mid-fade
    rerender()
    expect(result.current.swapping).toBe(false)
  })
})
