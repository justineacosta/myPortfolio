import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Faqs from '@/components/contact/Faqs'
import { FAQS } from '@/data/faqs'

describe('Faqs', () => {
  it("opens Kraft's first answer, and one at a time after that", () => {
    render(<Faqs />)
    const [q1, q2] = screen.getAllByRole('button')
    expect(q1).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(FAQS[0].a)).toBeVisible()
    fireEvent.click(q2)
    expect(q2).toHaveAttribute('aria-expanded', 'true')
    expect(q1).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById(q2.getAttribute('aria-controls')!)).toHaveTextContent(FAQS[1].a)
    fireEvent.click(q2)
    expect(q2).toHaveAttribute('aria-expanded', 'false')
  })
})
