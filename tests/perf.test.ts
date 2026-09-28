import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyPerfTier,
  BAD_FRAME_MS,
  getPerfTier,
  isJanky,
  nextTier,
  PERF_TIER_EVENT,
  watchFrameHealth,
} from '@/lib/perf'
import { PERF_KEY } from '@/lib/storage-keys'

describe('perf tiers', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true })
  })

  it('steps down one tier at a time and bottoms out at low', () => {
    expect(nextTier('high')).toBe('mid')
    expect(nextTier('mid')).toBe('low')
    expect(nextTier('low')).toBe('low')
  })

  it('only calls a median above the budget janky', () => {
    expect(isJanky(BAD_FRAME_MS)).toBe(false)
    expect(isJanky(BAD_FRAME_MS + 0.1)).toBe(true)
  })

  it('reads high when nothing is set', () => {
    expect(getPerfTier()).toBe('high')
  })

  it('applies, remembers for the tab and announces a new tier once', () => {
    const heard = vi.fn()
    window.addEventListener(PERF_TIER_EVENT, heard)
    applyPerfTier('mid')
    applyPerfTier('mid')
    expect(document.documentElement.dataset.perf).toBe('mid')
    expect(sessionStorage.getItem(PERF_KEY)).toBe('mid')
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(PERF_TIER_EVENT, heard)
  })

  it('still applies when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => applyPerfTier('low')).not.toThrow()
    expect(getPerfTier()).toBe('low')
    spy.mockRestore()
  })

  it('does not watch under automation (Playwright renders WebGL in software)', async () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true })
    await expect(watchFrameHealth()).resolves.toBeUndefined()
    expect(getPerfTier()).toBe('high')
  })
})
