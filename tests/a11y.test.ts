import { describe, expect, it, vi } from 'vitest'
import { A11Y_EVENT, DEFAULT_PREFS, motionReduced, readPrefs, savePrefs } from '@/lib/a11y'
import { A11Y_KEY } from '@/lib/storage-keys'

describe('a11y prefs', () => {
  it('returns defaults when nothing is stored', () => {
    expect(readPrefs()).toEqual(DEFAULT_PREFS)
  })
  it('sanitises stored values', () => {
    localStorage.setItem(A11Y_KEY, JSON.stringify({ text: 'huge', contrast: 1, motion: 'yes' }))
    expect(readPrefs()).toEqual({ text: 'md', contrast: true, motion: true, links: false })
  })
  it('returns defaults on corrupt JSON', () => {
    localStorage.setItem(A11Y_KEY, '{nope')
    expect(readPrefs()).toEqual(DEFAULT_PREFS)
  })
  it('savePrefs applies, stores and announces', () => {
    const heard = vi.fn()
    window.addEventListener(A11Y_EVENT, heard)
    savePrefs({ text: 'lg', contrast: false, motion: true, links: true })
    expect(document.documentElement.dataset.a11yText).toBe('lg')
    expect(motionReduced()).toBe(true)
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!)).toMatchObject({ motion: true })
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(A11Y_EVENT, heard)
  })
  it('savePrefs still applies when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'QuotaExceededError')
    })
    expect(() => savePrefs({ ...DEFAULT_PREFS, contrast: true })).not.toThrow()
    expect(document.documentElement.dataset.a11yContrast).toBe('true')
    spy.mockRestore()
  })
})
