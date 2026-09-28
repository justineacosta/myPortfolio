import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia, setMediaMatch } from '@/test/matchMedia'

describe('useReducedMotion', () => {
  it('follows the OS setting', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    expect(renderHook(() => useReducedMotion()).result.current).toBe(true)
  })

  it('follows the access menu switch as it changes', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(result.current).toBe(true)
    act(() => savePrefs(DEFAULT_PREFS))
    expect(result.current).toBe(false)
  })

  it('follows the OS setting as it changes', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', true))
    expect(result.current).toBe(true)
    act(() => setMediaMatch('(prefers-reduced-motion: reduce)', false))
    expect(result.current).toBe(false)
  })
})
