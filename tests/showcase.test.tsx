import { describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import ShowcasePage from '@/app/(site)/showcase/page'
import Cta from '@/components/showcase/Cta'
import Facts from '@/components/showcase/Facts'
import Flagship from '@/components/showcase/Flagship'
import { mainRoute } from '@/data/automations'
import { BUSINESSES, FACTS, showcase } from '@/data/showcase'
import { DEFAULT_PREFS, savePrefs } from '@/lib/a11y'
import { installMatchMedia } from '@/test/matchMedia'

const selected = () => screen.getByRole('tab', { selected: true }).textContent
const clock = () => document.querySelector<HTMLElement>('.flag-bar[data-on]')
const shot = () => document.querySelector<HTMLElement>('.flag-shot')!
const strip = () => document.querySelector<HTMLElement>('.flag-strip')!
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
  it('opens with the crumb, its heading, the sample note, the first business and the facts, and no placeholder', () => {
    render(<ShowcasePage />)
    expect(screen.getByText('SHOWCASE / FLAGSHIP')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: showcase.title.join(' ') })).toBeInTheDocument()
    expect(screen.getByText(showcase.sample)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Harbor & Pine Moving Co.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: showcase.facts.title })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/PLACEHOLDER|Client Name/)
  })
})

describe('Facts', () => {
  it('lists each fact as its number and label, under its heading', () => {
    render(<Facts />)
    const section = screen.getByRole('region', { name: showcase.facts.title })
    expect(within(section).getAllByRole('listitem').map((li) => li.textContent)).toEqual(FACTS.map((f) => `${f.n}${f.label}`))
  })
})

describe('Flagship', () => {
  it('has a tab per business, Harbor & Pine first', () => {
    render(<Flagship />)
    expect(screen.getByRole('tablist', { name: 'Sample builds' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(BUSINESSES.map((b) => b.short))
    expect(selected()).toBe('Harbor & Pine')
  })

  it('shows the business in its panel: trade, name, line, what was built and the site button, all in new tabs', () => {
    render(<Flagship />)
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'flag-tab-hp-01')
    expect(within(panel).getByText('SAMPLE BUILD · MOVING COMPANY')).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { level: 2, name: 'Harbor & Pine Moving Co.' })).toBeInTheDocument()
    expect(within(panel).getByText(BUSINESSES[0].line)).toBeInTheDocument()
    expect(within(panel).getByRole('heading', { level: 3, name: 'What I built' })).toBeInTheDocument()
    const links = within(panel).getAllByRole('link')
    expect(links.map((a) => [a.textContent!.trim(), a.getAttribute('href')])).toEqual([
      ...BUSINESSES[0].built.map((l) => [l.label, l.href]),
      ['Open the site', '/samples/harbor-and-pine-moving.html'],
    ])
    for (const a of links) expect(a).toHaveAttribute('target', '_blank')
  })

  it('shows the business’s site shot under its address, its flow strip and its outcome', () => {
    render(<Flagship />)
    const b = BUSINESSES[0]
    expect(screen.getByText(b.src)).toBeInTheDocument()
    expect(decodeURIComponent(shot().querySelector('img')!.getAttribute('src')!)).toContain(b.tall)
    expect(strip().querySelectorAll('[data-chip]')).toHaveLength(mainRoute(b.flow).length)
    expect(document.getElementById('flag-caption')).toHaveTextContent(b.flow.outcome)
  })

  it('moves to the next business when its clock runs out, and wraps', () => {
    render(<Flagship />)
    runOut(clock()!)
    expect(selected()).toBe('Westmere')
    expect(screen.getByRole('heading', { level: 2, name: 'Westmere' })).toBeInTheDocument()
    for (let i = 0; i < 3; i++) runOut(clock()!)
    expect(selected()).toBe('Harbor & Pine')
  })

  it('switches businesses by click and by the arrow, Home and End keys', () => {
    render(<Flagship />)
    fireEvent.click(screen.getByRole('tab', { name: 'Meridian Energy' }))
    expect(selected()).toBe('Meridian Energy')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Energy' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Meridian Werks')
    expect(screen.getByRole('tab', { name: 'Meridian Werks' })).toHaveFocus()
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Werks' }), { key: 'ArrowRight' })
    expect(selected()).toBe('Harbor & Pine')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Harbor & Pine' }), { key: 'End' })
    expect(selected()).toBe('Meridian Werks')
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Meridian Werks' }), { key: 'Home' })
    expect(selected()).toBe('Harbor & Pine')
  })

  it('runs the clock, the shot’s scroll and the strip’s pulse together, and holds all three under the pointer', () => {
    render(<Flagship />)
    const root = document.querySelector('[data-flagship]')!
    for (const el of [clock()!, shot(), strip()]) expect(el).toHaveAttribute('data-run')
    fireEvent.mouseEnter(root)
    for (const el of [clock()!, shot(), strip()]) expect(el).not.toHaveAttribute('data-run')
    fireEvent.mouseLeave(root)
    expect(clock()).toHaveAttribute('data-run')
  })

  it('holds while a “What I built” link has focus, so the panel does not swap under the keyboard', () => {
    render(<Flagship />)
    const link = within(screen.getByRole('tabpanel')).getAllByRole('link')[1]
    fireEvent.focusIn(link)
    expect(clock()).not.toHaveAttribute('data-run')
    fireEvent.focusOut(link, { relatedTarget: document.body })
    expect(clock()).toHaveAttribute('data-run')
  })

  it('never advances with reduced motion: the bar is full and the shot holds at the top', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    render(<Flagship />)
    expect(clock()).toBeNull()
    expect(document.querySelectorAll('.flag-bar[data-full]')).toHaveLength(1)
    expect(shot()).toHaveAttribute('data-still')
    expect(shot()).not.toHaveAttribute('data-run')
  })

  it('stops the moment motion is switched off', () => {
    render(<Flagship />)
    act(() => savePrefs({ ...DEFAULT_PREFS, motion: true }))
    expect(clock()).toBeNull()
    expect(shot()).toHaveAttribute('data-still')
  })
})

describe('Flagship CTA', () => {
  it('opens the site in a new tab', () => {
    render(<Cta label="Open the site" href="/samples/meridian-werks.html" />)
    const link = screen.getByRole('link', { name: 'Open the site' })
    expect(link).toHaveAttribute('href', '/samples/meridian-werks.html')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
