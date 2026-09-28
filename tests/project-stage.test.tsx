import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import ProjectViews from '@/components/projects/ProjectViews'

describe('Projects stage views', () => {
  beforeEach(() => window.history.replaceState(null, '', '/projects'))

  it("loops the reel with a hidden copy, at Kraft's pace", () => {
    window.history.replaceState(null, '', '/projects#reel')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Workflow screens' })
    const figures = view.querySelectorAll('figure')
    expect(figures).toHaveLength(10)
    expect(view.querySelectorAll('figure[aria-hidden="true"]')).toHaveLength(5)
    expect(within(figures[0] as HTMLElement).getByText('01 - Support | New Ticket')).toBeInTheDocument()
    expect((view.querySelector('.reel-row') as HTMLElement).style.getPropertyValue('--marq')).toBe('20s')
  })

  it('closes when the empty stage around the reel is clicked', () => {
    window.history.replaceState(null, '', '/projects#reel')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Workflow screens' })
    const stage = view.querySelector('.reel') as HTMLElement
    fireEvent.pointerDown(stage)
    fireEvent.click(stage)
    expect(window.location.hash).toBe('')
    expect(view).not.toHaveAttribute('open')
  })

  it('lists the eight sample sites by name', () => {
    window.history.replaceState(null, '', '/projects#sites')
    render(<ProjectViews />)
    const view = screen.getByRole('dialog', { name: 'Funnels and sites' })
    expect(within(view).getAllByRole('listitem')).toHaveLength(8)
    expect([...view.querySelectorAll('li > span.font-mono')].map((s) => s.textContent)).toEqual([
      'Apex Build Co.', 'Blade Studio', 'Below Ground', 'Baptiste', 'One Hour Therapy', 'Trusted Mover', 'Payline', 'Solar Field',
    ])
  })
})
