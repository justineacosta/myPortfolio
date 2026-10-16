import { existsSync, statSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import LoopVideo from '@/components/ui/LoopVideo'
import AboutCard from '@/components/home/AboutCard'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { about } from '@/data/about'
import { home } from '@/data/home'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '../test/matchMedia'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }), usePathname: () => '/' }))

const clip = about.image

describe('LoopVideo', () => {
  let play: ReturnType<typeof vi.fn>
  beforeEach(() => {
    // jsdom has no media playback.
    play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.play = play as unknown as HTMLMediaElement['play']
    HTMLMediaElement.prototype.pause = vi.fn()
  })
  afterEach(() => vi.restoreAllMocks())

  it('plays a muted, looping, inline video, WebM first, with the still frame as its poster', () => {
    render(<LoopVideo {...clip} />)
    const video = screen.getByRole('img', { name: clip.alt })
    expect(video.tagName).toBe('VIDEO')
    expect(video).toHaveProperty('muted', true)
    expect(video).toHaveAttribute('loop')
    expect(video).toHaveAttribute('playsinline')
    expect(video).toHaveAttribute('poster', clip.still)
    expect([...video.querySelectorAll('source')].map((s) => [s.getAttribute('src'), s.getAttribute('type')])).toEqual([
      [clip.webm, 'video/webm'],
      [clip.mp4, 'video/mp4'],
    ])
    // Never autoplay: it starts only once the page knows motion is allowed.
    expect(video).not.toHaveAttribute('autoplay')
    expect(play).toHaveBeenCalled()
  })

  it('shows the still frame instead when the OS asks for reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<LoopVideo {...clip} />)
    const img = screen.getByRole('img', { name: clip.alt })
    expect(img.tagName).toBe('IMG')
    expect(img.getAttribute('src')).toContain(clip.still)
    expect(play).not.toHaveBeenCalled()
  })

  it('swaps to the still frame when the access menu turns motion off', () => {
    render(<LoopVideo {...clip} />)
    expect(screen.getByRole('img', { name: clip.alt }).tagName).toBe('VIDEO')
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(screen.getByRole('img', { name: clip.alt }).tagName).toBe('IMG')
  })

  it('ships every file it names, each far lighter than the GIF it replaced (378 KB)', () => {
    for (const url of [clip.webm, clip.mp4, clip.still]) {
      expect(existsSync(`public${url}`), url).toBe(true)
      expect(statSync(`public${url}`).size, url).toBeLessThan(120 * 1024)
    }
    expect(existsSync('public/assets/about-workstation.gif')).toBe(false)
  })

  it("is what Home's About card shows too, so motion off stills it there as well", () => {
    render(
      <NavigationProvider>
        <AboutCard />
      </NavigationProvider>,
    )
    expect(screen.getByRole('img', { name: home.cards.about.image.alt }).tagName).toBe('VIDEO')
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(screen.getByRole('img', { name: home.cards.about.image.alt }).tagName).toBe('IMG')
  })
})
