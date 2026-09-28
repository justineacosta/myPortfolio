import { describe, expect, it, vi } from 'vitest'
import { bootScript } from '@/lib/boot'
import { A11Y_KEY, PERF_KEY, THEME_KEY } from '@/lib/storage-keys'
import { installMatchMedia } from '@/test/matchMedia'

const run = () => new Function(bootScript)()
const html = () => document.documentElement

describe('bootScript', () => {
  it('marks JS as available', () => {
    run()
    expect(html().hasAttribute('data-js')).toBe(true)
  })

  it('uses the stored theme over the device setting', () => {
    installMatchMedia({ '(prefers-color-scheme: light)': true })
    localStorage.setItem(THEME_KEY, 'dark')
    run()
    expect(html().dataset.theme).toBe('dark')
  })

  it('follows the device when nothing valid is stored', () => {
    installMatchMedia({ '(prefers-color-scheme: light)': true })
    localStorage.setItem(THEME_KEY, 'purple')
    run()
    expect(html().dataset.theme).toBe('light')
  })

  it('defaults to dark when the device has no light preference', () => {
    run()
    expect(html().dataset.theme).toBe('dark')
  })

  it('restores a downgraded perf tier for this tab', () => {
    sessionStorage.setItem(PERF_KEY, 'low')
    run()
    expect(html().dataset.perf).toBe('low')
  })

  it('ignores an unknown perf tier', () => {
    sessionStorage.setItem(PERF_KEY, 'turbo')
    run()
    expect(html().dataset.perf).toBeUndefined()
  })

  it('restores accessibility switches', () => {
    localStorage.setItem(A11Y_KEY, JSON.stringify({ text: 'xl', contrast: true, motion: true, links: false }))
    run()
    expect(html().dataset.a11yText).toBe('xl')
    expect(html().dataset.a11yContrast).toBe('true')
    expect(html().dataset.a11yMotion).toBe('true')
    expect(html().dataset.a11yLinks).toBeUndefined()
  })

  it('survives storage that throws and still sets a theme', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(run).not.toThrow()
    expect(html().dataset.theme).toBe('dark')
    spy.mockRestore()
  })
})
