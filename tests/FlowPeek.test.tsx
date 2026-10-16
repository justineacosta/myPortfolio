import { existsSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import FlowPeek, { PEEK_MS, PEEK_SLUG } from '@/components/projects/FlowPeek'
import { automations, mainRoute } from '@/data/automations'
import { installMatchMedia } from '@/test/matchMedia'

const on = () => document.querySelector('[data-on="true"]')!
const inCard = () =>
  render(
    <a href="#automations">
      <FlowPeek />
    </a>,
  )

describe('FlowPeek', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('is decoration only: hidden from screen readers, every logo without alt text', () => {
    inCard()
    const root = document.querySelector('[data-flow-peek]')!
    expect(root).toHaveAttribute('aria-hidden', 'true')
    for (const logo of root.querySelectorAll('[data-brand]')) expect(logo).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws each flow’s main route as chips, under its site and platform', () => {
    inCard()
    for (const f of automations.flows) {
      const el = document.querySelector(`[data-flow="${f.code}"]`)!
      expect(el.querySelectorAll('[data-chip]')).toHaveLength(mainRoute(f).length)
    }
    expect(on().textContent).toContain('Harbor & Pine · n8n')
  })

  it('numbers the Zap’s chips, and only the Zap’s', () => {
    inCard()
    expect([...document.querySelectorAll('[data-flow="MW-01"] [data-step]')].map((s) => s.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(document.querySelectorAll('[data-step]')).toHaveLength(5)
  })

  it('moves to the next flow every 4.5 seconds, and back round to the first', () => {
    inCard()
    const seen = [on().getAttribute('data-flow')]
    for (let i = 0; i < 4; i++) {
      act(() => vi.advanceTimersByTime(PEEK_MS))
      seen.push(on().getAttribute('data-flow'))
    }
    expect(seen).toEqual(['HP-01', 'WM-01', 'ME-01', 'MW-01', 'HP-01'])
  })

  it('holds the flow on show while the pointer is on the card', () => {
    inCard()
    const card = document.querySelector('a')!
    fireEvent.pointerEnter(card)
    act(() => vi.advanceTimersByTime(PEEK_MS * 3))
    expect(on().getAttribute('data-flow')).toBe('HP-01')
    fireEvent.pointerLeave(card)
    act(() => vi.advanceTimersByTime(PEEK_MS))
    expect(on().getAttribute('data-flow')).toBe('WM-01')
  })

  it('holds still on Harbor & Pine with reduced motion, with no pulse running', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    inCard()
    act(() => vi.advanceTimersByTime(PEEK_MS * 3))
    expect(on().getAttribute('data-flow')).toBe('HP-01')
    expect(document.querySelector('[data-flow-peek]')).not.toHaveAttribute('data-seen')
  })

  it('draws the webhook and branch icons in the cream chip’s own ink, so they read in the dark theme too', () => {
    inCard()
    const icons = [...document.querySelectorAll('[data-chip] > svg:not([data-brand])')]
    expect(icons.length).toBeGreaterThan(0)
    for (const svg of icons) expect(svg.getAttribute('class')).toContain('text-logo-ink')
  })

  it('has a logo file for every tool a chip shows', () => {
    const tools = automations.flows.flatMap((f) => f.nodes.map((n) => n.tools[0]).filter(Boolean))
    for (const t of tools) expect(existsSync(`public/icons/brands/${PEEK_SLUG[t!]}.svg`), t).toBe(true)
  })
})
