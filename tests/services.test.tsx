import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import { METHOD_MS, PROCESS } from '@/data/services'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const lit = () => document.querySelector('.method-step[data-on] h3')?.textContent

describe('Method', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("walks Kraft's five gates one at a time, in order, and wraps", () => {
    render(<Method />)
    expect(PROCESS.map((s) => s.name)).toEqual(['Kickoff', 'Research', 'Architect', 'Form', 'Transform'])
    expect(lit()).toBe('Kickoff')
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Research')
    act(() => vi.advanceTimersByTime(METHOD_MS * 4))
    expect(lit()).toBe('Kickoff')
    expect(document.querySelectorAll('.method-step[data-on]')).toHaveLength(1)
  })

  it('holds the first gate with reduced motion', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Method />)
    act(() => vi.advanceTimersByTime(METHOD_MS * 3))
    expect(lit()).toBe('Kickoff')
  })

  it('stops on the first gate the moment motion is switched off, and carries on after', () => {
    render(<Method />)
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Research')
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(lit()).toBe('Kickoff')
    act(() => vi.advanceTimersByTime(METHOD_MS * 2))
    expect(lit()).toBe('Kickoff')
    act(() => savePrefs(DEFAULT_PREFS))
    act(() => vi.advanceTimersByTime(METHOD_MS))
    expect(lit()).toBe('Architect')
  })

  it('is the #method section ⌘K lands on', () => {
    render(<Method />)
    const section = document.getElementById('method')!
    expect(section).toHaveClass('scroll-mt-[88px]')
  })

  it('heads the section with one title made of the five step names, and the description beside it', () => {
    render(<Method />)
    const header = document.querySelector('#method header')!
    // Each dot is held to the word before it (a no-break space), so a line never starts with one.
    expect(within(header as HTMLElement).getByRole('heading', { level: 2 }).textContent).toBe(
      'Kickoff · Research · Architect · Form · Transform',
    )
    expect(within(header as HTMLElement).getByText(/^Five steps, always in that order\./)).toBeInTheDocument()
  })

  it('puts the five steps in one labelled list that takes keyboard focus, so arrow keys can scroll it', () => {
    render(<Method />)
    const list = screen.getByRole('list', { name: 'The five steps' })
    expect(list).toHaveAttribute('tabindex', '0')
    expect(within(list).getAllByRole('listitem').map((li) => li.querySelector('h3')?.textContent)).toEqual(PROCESS.map((s) => s.name))
    expect(list).toHaveAttribute('data-wheel-x')
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
