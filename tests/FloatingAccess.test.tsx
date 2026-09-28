import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FloatingAccess from '@/components/shell/FloatingAccess'

describe('FloatingAccess', () => {
  it('floats the accessibility button in the bottom-right corner, on desktop only', () => {
    render(<FloatingAccess />)
    const button = screen.getByRole('button', { name: 'Accessibility options' })
    const float = button.closest('[data-floating-access]')!
    expect(float).toHaveClass('fixed', 'right-5', 'bottom-5', 'hidden', 'shell:block')
  })
})
