import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Testimonials from '@/components/testimonials/Testimonials'
import { CARDS, CLIENTS, SAMPLES } from '@/data/testimonials'

describe('Testimonials', () => {
  it('picks the first client, with a tab per client and no featured quote', () => {
    render(<Testimonials />)
    expect(screen.queryByText('FEATURED')).not.toBeInTheDocument()
    const first = screen.getByRole('button', { name: 'Testimonial 01' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { name: /^Testimonial \d+$/ })).toHaveLength(CLIENTS.length)
    expect(screen.getByText('Client testimonial 01')).toBeInTheDocument()
  })

  it("shows Dominic's portrait as the poster until his video exists", () => {
    const { container } = render(<Testimonials />)
    expect(container.querySelector('img')?.getAttribute('src')).toContain('testimonial-dela-cruz.jpg')
    expect(screen.queryByText('Drop the testimonial video poster')).not.toBeInTheDocument()
  })

  it('drops the play button and the length over a photo, and names the client instead', () => {
    const { container } = render(<Testimonials />)
    expect(screen.queryByRole('button', { name: 'Play testimonial' })).not.toBeInTheDocument()
    expect(screen.queryByText(/TAP TO PLAY/)).not.toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Dominic Dela Cruz')
  })

  it("shows the client's short card first: logo, organisation, my role, one line, tags", () => {
    render(<Testimonials />)
    const card = within(screen.getAllByRole('article')[0])
    expect(card.getByRole('heading', { name: 'Barangay San Fernando' })).toBeInTheDocument()
    expect(card.getByRole('img', { name: 'Barangay San Fernando logo' })).toBeInTheDocument()
    expect(card.getByText('FULL STACK DEVELOPER')).toBeInTheDocument()
    expect(card.getByText(/^I built their citizen portal/)).toBeInTheDocument()
    for (const tag of ['Next.js', 'Supabase', 'Document tracking']) expect(card.getByText(tag)).toBeInTheDocument()
  })

  it('shows four cards a page, and the pager walks through every client, then every sample', () => {
    render(<Testimonials />)
    const pager = screen.getByRole('navigation', { name: 'Testimonial pages' })
    const pages = Math.ceil(CARDS.length / 4)
    expect(within(pager).getAllByRole('button', { name: /^Page \d+$/ })).toHaveLength(pages)
    expect(within(pager).getByRole('button', { name: 'Previous page' })).toBeDisabled()
    const seen: string[] = []
    for (let p = 0; p < pages; p++) {
      if (p > 0) fireEvent.click(within(pager).getByRole('button', { name: 'Next page' }))
      expect(within(pager).getByRole('button', { name: `Page ${p + 1}` })).toHaveAttribute('aria-current', 'page')
      const cards = screen.getAllByRole('article')
      expect(cards.length).toBe(Math.min(4, CARDS.length - p * 4))
      seen.push(...cards.map((c) => within(c).getByRole('heading').textContent ?? ''))
    }
    expect(within(pager).getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(seen).toEqual(CARDS.map((c) => c.org))
  })

  it('marks every sample SAMPLE SYSTEM and numbers it after the clients', () => {
    render(<Testimonials />)
    fireEvent.click(screen.getByRole('button', { name: 'Page 3' }))
    const last = SAMPLES.at(-1)!
    const card = within(screen.getAllByRole('article').at(-1)!)
    expect(card.getByRole('heading', { name: last.org })).toBeInTheDocument()
    expect(card.getByText('SAMPLE SYSTEM')).toBeInTheDocument()
    expect(card.getByText(String(CLIENTS.length + SAMPLES.length).padStart(2, '0'))).toBeInTheDocument()
    expect(SAMPLES.every((s) => s.work === 'SAMPLE SYSTEM')).toBe(true)
  })

  it('has a logo file for every card', () => {
    for (const c of CARDS) expect(existsSync(`public${c.logo}`)).toBe(true)
  })
})
