import { describe, expect, it, vi } from 'vitest'
import { getTheme, setTheme, THEME_EVENT, toggleTheme } from '@/lib/theme'
import { THEME_KEY } from '@/lib/storage-keys'
import { installMatchMedia } from '@/test/matchMedia'

type VTDoc = { startViewTransition?: unknown }

describe('theme', () => {
  it('reads dark when no theme attribute is set (Kraft :root is dark)', () => {
    expect(getTheme()).toBe('dark')
  })

  it('switches instantly without View Transitions, stores and announces', () => {
    const heard = vi.fn()
    window.addEventListener(THEME_EVENT, heard)
    setTheme('light')
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
    expect(heard).toHaveBeenCalledOnce()
    window.removeEventListener(THEME_EVENT, heard)
  })

  it('uses the circular sweep from the origin when View Transitions exist', async () => {
    const doc = document as unknown as VTDoc
    let finish!: () => void
    doc.startViewTransition = vi.fn((cb: () => void) => {
      cb()
      return { finished: new Promise<void>((r) => (finish = r)) }
    })
    setTheme('light', { x: 10, y: 20 })
    const root = document.documentElement
    expect(doc.startViewTransition).toHaveBeenCalledOnce()
    expect(root.style.getPropertyValue('--sweep-x')).toBe('10px')
    expect(root.dataset.themeSweep).toBe('on')
    finish()
    await new Promise((r) => setTimeout(r, 0))
    expect(root.dataset.themeSweep).toBeUndefined()
    delete doc.startViewTransition
  })

  it('skips the sweep for reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const doc = document as unknown as VTDoc
    doc.startViewTransition = vi.fn()
    setTheme('light', { x: 0, y: 0 })
    expect(doc.startViewTransition).not.toHaveBeenCalled()
    expect(getTheme()).toBe('light')
    delete doc.startViewTransition
  })

  it('toggleTheme flips and returns the new theme', () => {
    document.documentElement.dataset.theme = 'light'
    expect(toggleTheme()).toBe('dark')
    expect(getTheme()).toBe('dark')
  })

  it('still switches when storage throws', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(() => setTheme('light')).not.toThrow()
    expect(getTheme()).toBe('light')
    spy.mockRestore()
  })
})
