import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import Testimonials from '@/components/testimonials/Testimonials'
import { isPlaceholder } from '@/lib/placeholder'

describe('Testimonials', () => {
  it('features the first client, and a tab switches the player and the quote', () => {
    render(<Testimonials />)
    const first = screen.getByRole('button', { name: 'Testimonial 01' })
    const second = screen.getByRole('button', { name: 'Testimonial 02' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Client testimonial 01')).toBeInTheDocument()
    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-pressed', 'true')
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Client testimonial 02')).toBeInTheDocument()
  })

  it('keeps play disabled until a real video exists', () => {
    render(<Testimonials />)
    expect(screen.getByRole('button', { name: 'Play testimonial' })).toBeDisabled()
    expect(screen.getByText('[0:00] · TAP TO PLAY')).toBeInTheDocument()
  })

  it('shows every client, and never an invented quote', () => {
    render(<Testimonials />)
    const cards = screen.getAllByRole('article')
    expect(cards).toHaveLength(3)
    for (const card of cards) expect(isPlaceholder(within(card).getByRole('heading').textContent ?? '')).toBe(true)
  })
})
