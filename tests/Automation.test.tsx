import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Automation from '@/components/services/Automation'
import { installMatchMedia } from '@/test/matchMedia'

describe('Automation', () => {
  it('opens on the first of ten flows, its nodes read as a list', () => {
    render(<Automation />)
    expect(screen.getByRole('heading', { level: 2, name: 'One form. The rest runs itself.' })).toBeInTheDocument()
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(11)
    expect(document.getElementById('automation')).toHaveClass('scroll-mt-[88px]')
  })

  it('steps both ways and wraps', () => {
    render(<Automation />)
    fireEvent.click(screen.getByRole('button', { name: 'Previous automation' }))
    expect(screen.getByText('10 / 10')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Monday reporting, already written.')
    fireEvent.click(screen.getByRole('button', { name: 'Next automation' }))
    expect(screen.getByText('1 / 10')).toBeInTheDocument()
  })

  it('bends the edges of a hovered node (at once with reduced motion)', () => {
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { container } = render(<Automation />)
    const first = container.querySelectorAll('path.flow-edge')[0]
    expect(first).toHaveAttribute('d', 'M130,96 L248,96')
    const tile = screen.getByText('Submit Form').previousElementSibling as HTMLElement
    fireEvent.mouseEnter(tile)
    expect(first).toHaveAttribute('d', 'M130,90 L248,96')
    fireEvent.mouseLeave(tile)
    expect(first).toHaveAttribute('d', 'M130,96 L248,96')
  })

  it('marks dead ends in the alert colour and outcomes in the accent', () => {
    render(<Automation />)
    expect(screen.getByText('Lost')).toHaveClass('text-danger')
    expect(screen.getByText('Won')).toHaveClass('text-accent')
    expect(screen.getByText('Booking Email')).toHaveClass('text-ink')
  })
})
