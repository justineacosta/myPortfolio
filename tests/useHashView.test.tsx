import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useHashView } from '@/hooks/useHashView'
import { pushHash } from '@/lib/hash'

const IDS = ['reel', 'build-plan'] as const

describe('useHashView', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))
  afterEach(() => vi.restoreAllMocks())

  it('opens the view a shared link names', () => {
    window.history.replaceState(null, '', '/projects#build-plan')
    const { result } = renderHook(() => useHashView(IDS))
    expect(result.current.view).toBe('build-plan')
  })

  it('ignores hashes that are not its views', () => {
    window.history.replaceState(null, '', '/projects#faqs')
    const { result } = renderHook(() => useHashView(IDS))
    expect(result.current.view).toBeNull()
  })

  it('closes a shared-link view in place, without leaving the page', () => {
    window.history.replaceState(null, '', '/projects#reel')
    const back = vi.spyOn(window.history, 'back')
    const { result } = renderHook(() => useHashView(IDS))
    act(() => result.current.close())
    expect(back).not.toHaveBeenCalled()
    expect(window.location.hash).toBe('')
    expect(result.current.view).toBeNull()
  })

  it('opens on an in-page hash change and closes with Back', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { result } = renderHook(() => useHashView(IDS))
    act(() => pushHash('reel'))
    expect(result.current.view).toBe('reel')
    act(() => result.current.close())
    expect(back).toHaveBeenCalledTimes(1)
  })

  it('follows Back and Forward', () => {
    const { result } = renderHook(() => useHashView(IDS))
    act(() => pushHash('reel'))
    act(() => {
      window.history.replaceState(null, '', '/projects')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.view).toBeNull()
  })
})
