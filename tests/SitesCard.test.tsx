import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import SitesCard from '@/components/projects/SitesCard'
import { projects } from '@/data/projects'
import { PEEK_DELAY_MS, SPIN_MS } from '@/lib/fan'
import { installMatchMedia } from '@/test/matchMedia'

const names = projects.sitesView.sites.map((s) => s.name)
const front = () => document.querySelector<HTMLElement>('[data-fan-tile][data-front]')?.dataset.site
const tag = () => document.querySelector<HTMLElement>('[data-fan-tag]')
const fan = () => document.querySelector<HTMLElement>('[data-fan]')!

/** An IntersectionObserver that reports the card on screen at once. */
class OnScreen {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {
    this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  disconnect() {}
}

const renderCard = (onOpen = vi.fn()) => {
  render(<SitesCard onOpen={onOpen} />)
  return onOpen
}

describe('SitesCard (the Funnels and sites card)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installMatchMedia()
    vi.stubGlobal('IntersectionObserver', OnScreen)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('is one link to the sites view, with every sample site in its fan and the third in front', () => {
    renderCard()
    expect(screen.getByRole('link', { name: /^Funnels and sites/ })).toHaveAttribute('href', '#sites')
    expect(document.querySelectorAll('[data-fan-tile]')).toHaveLength(8)
    expect(fan()).toHaveAttribute('aria-hidden', 'true')
    expect(front()).toBe(names[2])
  })

  it('turns one site every SPIN_MS while it is on screen, all eight taking the front', () => {
    renderCard()
    const seen = [front()]
    for (let i = 0; i < 7; i++) {
      act(() => vi.advanceTimersByTime(SPIN_MS))
      seen.push(front())
    }
    expect(seen[1]).toBe(names[3])
    expect(new Set(seen).size).toBe(8)
  })

  it('holds still while a mouse is over the fan, and turns again after it leaves', () => {
    renderCard()
    fireEvent.pointerEnter(fan(), { pointerType: 'mouse', clientX: 0 })
    act(() => vi.advanceTimersByTime(SPIN_MS * 3))
    expect(front()).toBe(names[2])
    fireEvent.pointerLeave(fan(), { pointerType: 'mouse' })
    act(() => vi.advanceTimersByTime(SPIN_MS))
    expect(front()).toBe(names[3])
  })

  it('holds still with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    act(() => vi.advanceTimersByTime(SPIN_MS * 3))
    expect(front()).toBe(names[2])
  })

  it('brings the tile under the pointer to the front and names it', () => {
    renderCard()
    expect(tag()).not.toHaveAttribute('data-on')
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: -200 })
    expect(front()).toBe(names[0])
    expect(tag()).toHaveAttribute('data-on')
    expect(tag()).toHaveTextContent(names[0])
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: 60 })
    expect(front()).toBe(names[3])
    expect(tag()).toHaveTextContent(names[3])
  })

  it('peeks down the front page once the pointer rests on it, and stops when it moves on', () => {
    renderCard()
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: 0 })
    const tile = () => document.querySelector('[data-fan-tile][data-front]')!
    expect(tile()).not.toHaveAttribute('data-peek')
    act(() => vi.advanceTimersByTime(PEEK_DELAY_MS))
    expect(tile()).toHaveAttribute('data-peek')
    expect(decodeURIComponent(tile().querySelector('img')!.getAttribute('src')!)).toContain('/samples/thumbs/tall/')
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: 60 })
    expect(tile()).not.toHaveAttribute('data-peek')
  })

  it('does not peek with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    renderCard()
    fireEvent.pointerMove(fan(), { pointerType: 'mouse', clientX: 0 })
    act(() => vi.advanceTimersByTime(PEEK_DELAY_MS * 2))
    expect(document.querySelector('[data-peek]')).toBeNull()
  })

  it('a finger swiping across the fan scrubs it, and that swipe does not open the view', () => {
    const onOpen = renderCard()
    fireEvent.pointerDown(fan(), { pointerType: 'touch', clientX: 0, pointerId: 5 })
    fireEvent.pointerMove(fan(), { pointerType: 'touch', clientX: -150, pointerId: 5 })
    expect(front()).toBe(names[0])
    expect(tag()).toHaveTextContent(names[0])
    fireEvent.pointerUp(fan(), { pointerType: 'touch', clientX: -150, pointerId: 5 })
    fireEvent.click(screen.getByRole('link', { name: /^Funnels and sites/ }))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('a swipe the browser sends no click for does not swallow a later click (a mouse, or Enter)', () => {
    const onOpen = renderCard()
    fireEvent.pointerDown(fan(), { pointerType: 'touch', clientX: 0, pointerId: 7 })
    fireEvent.pointerMove(fan(), { pointerType: 'touch', clientX: -150, pointerId: 7 })
    fireEvent.pointerUp(fan(), { pointerType: 'touch', clientX: -150, pointerId: 7 })
    // No click follows the swipe. A moment later the card is clicked another way:
    act(() => vi.advanceTimersByTime(2000))
    fireEvent.click(screen.getByRole('link', { name: /^Funnels and sites/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('a tap still opens the view', () => {
    const onOpen = renderCard()
    fireEvent.pointerDown(fan(), { pointerType: 'touch', clientX: 0, pointerId: 6 })
    fireEvent.pointerUp(fan(), { pointerType: 'touch', clientX: 2, pointerId: 6 })
    fireEvent.click(screen.getByRole('link', { name: /^Funnels and sites/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('keyboard focus on the card holds the spin and names the front site', () => {
    renderCard()
    act(() => screen.getByRole('link', { name: /^Funnels and sites/ }).focus())
    expect(tag()).toHaveAttribute('data-on')
    expect(tag()).toHaveTextContent(names[2])
    act(() => vi.advanceTimersByTime(SPIN_MS * 2))
    expect(front()).toBe(names[2])
  })
})
