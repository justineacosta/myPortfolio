import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import Method from '@/components/services/Method'
import Offers from '@/components/services/Offers'
import { METHOD_MS, PROCESS } from '@/data/services'
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

  it('is the #method section ⌘K lands on', () => {
    render(<Method />)
    const section = document.getElementById('method')!
    expect(within(section).getByRole('heading', { level: 2 })).toHaveTextContent('Kickoff · Research Architect · Form · Transform')
    expect(section).toHaveClass('scroll-mt-[88px]')
  })
})

describe('Offers', () => {
  it("lists Kraft's six offers with logos, number, badge, bullets and tags", () => {
    render(<Offers />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(6)
    const first = within(cards[0])
    expect(first.getByRole('heading', { level: 3 })).toHaveTextContent('Full-Stack Web & SaaS')
    expect(first.getByText('01 / 06')).toBeInTheDocument()
    expect(first.getByText('BUILT TO LAST')).toBeInTheDocument()
    expect(first.getByRole('img', { name: 'PostgreSQL' })).toBeInTheDocument()
    expect(first.getAllByRole('listitem')).toHaveLength(3)
    expect(screen.getByRole('heading', { level: 2, name: 'What I can do for you' })).toBeInTheDocument()
  })
})
