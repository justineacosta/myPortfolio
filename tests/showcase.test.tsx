import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ShowcasePage from '@/app/(site)/showcase/page'
import Feedback from '@/components/showcase/Feedback'
import Flagship from '@/components/showcase/Flagship'
import { FEEDBACK, showcase, TABS } from '@/data/showcase'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const selected = () => screen.getByRole('tab', { selected: true }).textContent
const clock = () => document.querySelector<HTMLElement>('.flag-bar[data-on]')
/**
 * The clock's fill runs out. jsdom has no AnimationEvent, so React listens
 * for the prefixed name there; a browser uses the plain one. React hears
 * exactly one of the two.
 */
const runOut = (el: HTMLElement) =>
  act(() => {
    el.dispatchEvent(new Event('animationend', { bubbles: true }))
    el.dispatchEvent(new Event('webkitAnimationEnd', { bubbles: true }))
  })

describe('Showcase page', () => {
  it('opens with the SHOWCASE / FLAGSHIP crumb, its heading, the flagship and the feedback', () => {
    render(<ShowcasePage />)
    expect(screen.getByText('SHOWCASE / FLAGSHIP')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: showcase.title.join(' ') })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.flagship.name })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.feedback.title })).toBeInTheDocument()
  })
})

describe('Flagship', () => {
  it('has five product screens, the first one showing', () => {
    render(<Flagship />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(TABS.map((t) => t.label))
    expect(selected()).toBe('Home')
    expect(screen.getByRole('tabpanel')).toHaveTextContent(TABS[0].caption)
  })

  it('moves to the next screen when its clock runs out, and wraps', () => {
    render(<Flagship />)
    runOut(clock()!)
    expect(selected()).toBe('Board')
    for (let i = 0; i < 4; i++) runOut(clock()!)
    expect(selected()).toBe('Home')
  })

  it('switches screens by click and by the arrow, Home and End keys', () => {
    render(<Flagship />)
    fireEvent.click(screen.getByRole('tab', { name: 'Features' }))
    expect(selected()).toBe('Features')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Features' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Search')
    expect(screen.getByRole('tab', { name: 'Search' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Search' }), { key: 'Home' })
    expect(selected()).toBe('Home')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Home' }), { key: 'End' })
    expect(selected()).toBe('Search')
  })

  it('holds its clock under the pointer', () => {
    render(<Flagship />)
    expect(clock()).toHaveAttribute('data-run')
    fireEvent.mouseEnter(screen.getByRole('tablist').parentElement!)
    expect(clock()).not.toHaveAttribute('data-run')
    fireEvent.mouseLeave(screen.getByRole('tablist').parentElement!)
    expect(clock()).toHaveAttribute('data-run')
  })

  it('never advances with reduced motion, and marks the screen it holds', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Flagship />)
    expect(clock()).toBeNull()
    expect(document.querySelectorAll('.flag-bar[data-full]')).toHaveLength(1)
  })

  it('stops the moment motion is switched off', () => {
    render(<Flagship />)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(clock()).toBeNull()
  })
})

describe('Feedback', () => {
  it('reads each quote once, with its rating', () => {
    render(<Feedback />)
    expect(screen.getAllByRole('figure')).toHaveLength(FEEDBACK.length)
    expect(screen.getAllByRole('img', { name: '5 out of 5 stars' })).toHaveLength(FEEDBACK.filter((q) => q.rating === 5).length)
  })

  it('pauses and plays from its button', () => {
    render(<Feedback />)
    const reel = screen.getByRole('region', { name: showcase.feedback.reelLabel })
    fireEvent.click(screen.getByRole('button', { name: showcase.feedback.pauseLabel }))
    expect(reel).toHaveAttribute('data-paused')
    fireEvent.click(screen.getByRole('button', { name: showcase.feedback.playLabel }))
    expect(reel).not.toHaveAttribute('data-paused')
  })
})
