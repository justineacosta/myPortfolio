import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import Testimonials from '@/components/testimonials/Testimonials'
import { CLIENTS } from '@/data/testimonials'

describe('Testimonials', () => {
  it('features the first client, with a tab per client', () => {
    render(<Testimonials />)
    const first = screen.getByRole('button', { name: 'Testimonial 01' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { name: /^Testimonial \d+$/ })).toHaveLength(CLIENTS.length)
    expect(screen.getByText('Client testimonial 01')).toBeInTheDocument()
  })

  it('keeps play disabled until a real video exists', () => {
    render(<Testimonials />)
    expect(screen.getByRole('button', { name: 'Play testimonial' })).toBeDisabled()
    expect(screen.getByText('[0:00] · TAP TO PLAY')).toBeInTheDocument()
  })

  it("shows Dominic's card with his role and tags", () => {
    render(<Testimonials />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(1)
    const card = within(cards[0])
    expect(card.getByRole('heading', { name: 'Dominic Dela Cruz' })).toBeInTheDocument()
    expect(card.getByText('Barangay Captain · Barangay San Fernando')).toBeInTheDocument()
    for (const tag of ['Next.js', 'Supabase', 'Document tracking']) expect(card.getByText(tag)).toBeInTheDocument()
  })
})
