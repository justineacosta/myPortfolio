import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useWebGLAllowed } from '@/hooks/useWebGLAllowed'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { applyPerfTier } from '@/lib/perf'
import { installMatchMedia, setMediaMatch } from '@/test/matchMedia'

describe('useWebGLAllowed', () => {
  it('allows WebGL on a fine pointer, with motion, at a healthy tier', () => {
    expect(renderHook(() => useWebGLAllowed()).result.current).toBe(true)
  })

  it('says no on touch screens', () => {
    installMatchMedia({ '(pointer: coarse) and (hover: none)': true })
    expect(renderHook(() => useWebGLAllowed()).result.current).toBe(false)
  })

  it('says no the moment motion is switched off or the tier drops to low', () => {
    const { result } = renderHook(() => useWebGLAllowed())
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(result.current).toBe(false)
    act(() => savePrefs(DEFAULT_PREFS))
    expect(result.current).toBe(true)
    act(() => applyPerfTier('low'))
    expect(result.current).toBe(false)
  })

  it('says no the moment the OS turns on reduced motion, and yes when it goes off', () => {
    const { result } = renderHook(() => useWebGLAllowed())
    expect(result.current).toBe(true)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    expect(result.current).toBe(false)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', false))
    expect(result.current).toBe(true)
  })
})
