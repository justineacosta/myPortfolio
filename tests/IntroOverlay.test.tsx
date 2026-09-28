import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import IntroOverlay from '@/components/shell/IntroOverlay'
import { INTRO_MAX_MS } from '@/lib/intro'

// The run waits for the webfont forever: only the watchdog can end it.
vi.mock('@/lib/intro', async (orig) => ({
  ...(await orig<typeof import('@/lib/intro')>()),
  whenFontsReady: () => new Promise<void>(() => {}),
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('IntroOverlay', () => {
  afterEach(() => vi.useRealTimers())

  it('hands the page back if the run never finishes', () => {
    vi.useFakeTimers()
    const root = document.documentElement
    root.setAttribute('data-intro', '')
    root.setAttribute('data-intro-head', '')
    render(<IntroOverlay />)
    expect(root).toHaveAttribute('data-intro-live')
    act(() => vi.advanceTimersByTime(INTRO_MAX_MS))
    expect(root).not.toHaveAttribute('data-intro')
    expect(root).not.toHaveAttribute('data-intro-head')
  })
})
