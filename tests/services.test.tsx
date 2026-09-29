import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import { PROCESS } from '@/data/services'
import { METHOD } from '@/lib/method'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const gates = () => [...document.querySelectorAll<HTMLElement>('[data-gate]')]
const looks = () => gates().map((g) => g.dataset.state)
const hovered = () => gates().map((g) => g.hasAttribute('data-hover'))
const card = (name: string) => gates().find((g) => g.querySelector('h3')?.textContent === name)!
const { burstMs, aroundMs, lineMs } = METHOD
/** When gate `i`'s halves meet, plus a frame or two. */
const lockAt = (i: number) => burstMs + i * (aroundMs + lineMs) + aroundMs + 48
const LOCKED = ['locked', 'locked', 'locked', 'locked', 'locked']

describe('Method', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout', 'setInterval'] }))
  afterEach(() => vi.useRealTimers())

  it("goes round Kraft's five gates once, in order, locking each as its halves meet", () => {
    render(<Method />)
    expect(PROCESS.map((s) => s.name)).toEqual(['Kickoff', 'Research', 'Architect', 'Form', 'Transform'])
    act(() => vi.advanceTimersByTime(32))
    expect(looks()).toEqual(['lit', 'waiting', 'waiting', 'waiting', 'waiting'])
    act(() => vi.advanceTimersByTime(lockAt(0)))
    // On the line to the next card: nothing is being traced.
    expect(looks()).toEqual(['locked', 'waiting', 'waiting', 'waiting', 'waiting'])
    act(() => vi.advanceTimersByTime(lineMs))
    expect(looks()).toEqual(['locked', 'lit', 'waiting', 'waiting', 'waiting'])
    act(() => vi.advanceTimersByTime(lockAt(4)))
    expect(looks()).toEqual(LOCKED)
    act(() => vi.advanceTimersByTime(10_000))
    expect(looks()).toEqual(LOCKED)
  })

  it('puts no check badge on any gate', () => {
    render(<Method />)
    expect(document.querySelector('#method .method-check')).toBeNull()
  })

  it("fades each card's lit border once its halves meet, and each line once the dot is across", () => {
    render(<Method />)
    const fade = (sel: string, i: number) => [...document.querySelectorAll<SVGPathElement>(sel)][i].style.opacity
    act(() => vi.advanceTimersByTime(burstMs + aroundMs / 2))
    expect([fade('.method-ring', 0), fade('.method-ring', 1)]).toEqual(['1', '1'])
    act(() => vi.advanceTimersByTime(aroundMs / 2 + METHOD.fadeMs + 48))
    expect([fade('.method-ring', 0), fade('.method-ring', 1)]).toEqual(['0', '0'])
    expect(fade('.method-line', 0)).toBe('1')
    act(() => vi.advanceTimersByTime(lineMs + aroundMs / 2))
    expect(fade('.method-line', 0)).toBe('0')
    expect(fade('.method-ring', 2)).toBe('1')
  })

  it('draws the run on one layer over the cards: two halves round each card, a line between each pair', () => {
    render(<Method />)
    const wire = document.querySelector('#method svg.method-wire')!
    expect(wire).toHaveAttribute('aria-hidden', 'true')
    expect(wire.querySelectorAll('.method-ring')).toHaveLength(10)
    expect(wire.querySelectorAll('.method-line')).toHaveLength(4)
  })

  it('lights the card under the pointer and holds the light where it is, then carries on', () => {
    render(<Method />)
    act(() => vi.advanceTimersByTime(burstMs + aroundMs / 2))
    fireEvent.mouseEnter(card('Architect'))
    expect(hovered()).toEqual([false, false, true, false, false])
    act(() => vi.advanceTimersByTime(10_000))
    expect(looks()).toEqual(['lit', 'waiting', 'waiting', 'waiting', 'waiting'])
    fireEvent.mouseLeave(card('Architect'))
    expect(hovered()).toEqual([false, false, false, false, false])
    act(() => vi.advanceTimersByTime(aroundMs / 2 + 64))
    expect(looks()).toEqual(['locked', 'waiting', 'waiting', 'waiting', 'waiting'])
  })

  it('lights a card that takes keyboard focus, and holds the run while it has it', () => {
    render(<Method />)
    act(() => card('Form').focus())
    expect(hovered()).toEqual([false, false, false, true, false])
    act(() => vi.advanceTimersByTime(lockAt(0)))
    expect(looks()[0]).toBe('lit')
    act(() => card('Form').blur())
    expect(hovered()).toEqual([false, false, false, false, false])
    act(() => vi.advanceTimersByTime(lockAt(0)))
    expect(looks()[0]).toBe('locked')
  })

  it('shows all five gates done, and still, with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Method />)
    expect(looks()).toEqual(LOCKED)
  })

  it('ends the run the moment motion is switched off, and keeps it ended after', () => {
    render(<Method />)
    act(() => vi.advanceTimersByTime(lockAt(0) + lineMs))
    expect(looks()).toEqual(['locked', 'lit', 'waiting', 'waiting', 'waiting'])
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(looks()).toEqual(LOCKED)
    act(() => savePrefs(DEFAULT_PREFS))
    act(() => vi.advanceTimersByTime(lockAt(0)))
    expect(looks()).toEqual(LOCKED)
  })

  it('waits for the section to come into view before it starts, and holds while it is off screen', () => {
    let seen: (entries: { isIntersecting: boolean }[]) => void = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: typeof seen) {
          seen = cb
        }
        observe() {}
        disconnect() {}
      },
    )
    render(<Method />)
    act(() => vi.advanceTimersByTime(lockAt(2)))
    expect(looks()).toEqual(['lit', 'waiting', 'waiting', 'waiting', 'waiting'])
    act(() => seen([{ isIntersecting: true }]))
    act(() => vi.advanceTimersByTime(lockAt(0) + lineMs))
    expect(looks()).toEqual(['locked', 'lit', 'waiting', 'waiting', 'waiting'])
    act(() => seen([{ isIntersecting: false }]))
    act(() => vi.advanceTimersByTime(lockAt(3)))
    expect(looks()).toEqual(['locked', 'lit', 'waiting', 'waiting', 'waiting'])
    vi.unstubAllGlobals()
  })

  it('is the #method section ⌘K lands on', () => {
    render(<Method />)
    const section = document.getElementById('method')!
    expect(section).toHaveClass('scroll-mt-[88px]')
  })

  it('shows only the kicker and the description in the header; the heading of step names is for screen readers', () => {
    render(<Method />)
    const header = document.querySelector('#method header') as HTMLElement
    const heading = within(header).getByRole('heading', { level: 2, name: 'Kickoff · Research · Architect · Form · Transform' })
    expect(heading).toHaveClass('sr-only')
    expect(header.querySelector('[data-letter]')).toBeNull()
    // The description sits just under the kicker, in one column.
    const kicker = within(header).getByText('THE KRAFT METHOD')
    const body = within(header).getByText(/^Five steps, always in that order\./)
    expect(header).toHaveClass('flex-col')
    expect([...header.children].filter((el) => !el.matches('.sr-only'))).toEqual([kicker, body])
    expect(body).toHaveTextContent('Every letter is a gate — nothing moves forward')
  })

  it('puts the five steps in one labelled list, each card reachable by keyboard', () => {
    render(<Method />)
    const list = screen.getByRole('list', { name: 'The five steps' })
    const items = within(list).getAllByRole('listitem')
    expect(items.map((li) => li.querySelector('h3')?.textContent)).toEqual(PROCESS.map((s) => s.name))
    items.forEach((li) => expect(li).toHaveAttribute('tabindex', '0'))
  })
})

describe('Offers', () => {
  it('lists the five offers with logos, number, badge, bullets and tags', () => {
    render(<Offers />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(5)
    const first = within(cards[0])
    expect(first.getByRole('heading', { level: 3 })).toHaveTextContent('Full-Stack Web & SaaS')
    expect(first.getByText('01 / 05')).toBeInTheDocument()
    expect(first.getByText('BUILT TO LAST')).toBeInTheDocument()
    expect(first.getByRole('img', { name: 'PostgreSQL' })).toBeInTheDocument()
    expect(first.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 2, name: 'What I can do for you' })).toBeInTheDocument()
  })
})
