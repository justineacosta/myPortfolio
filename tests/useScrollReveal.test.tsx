import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { installMatchMedia } from '@/test/matchMedia'

type Cb = (entries: { isIntersecting: boolean; target: Element }[]) => void
let fire: Cb = () => {}
class FakeIO {
  constructor(cb: Cb) {
    fire = cb
  }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

function Harness() {
  useScrollReveal('/')
  return <p data-reveal>hello</p>
}

describe('useScrollReveal', () => {
  afterEach(() => {
    delete (window as { IntersectionObserver?: unknown }).IntersectionObserver
  })

  it('reveals an element once it intersects', () => {
    ;(window as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIO
    const { container } = render(<Harness />)
    const el = container.querySelector('[data-reveal]')!
    expect(el).not.toHaveClass('is-revealed')
    fire([{ isIntersecting: true, target: el }])
    expect(el).toHaveClass('is-revealed')
  })

  it('reveals everything immediately for reduced motion', () => {
    ;(window as { IntersectionObserver?: unknown }).IntersectionObserver = FakeIO
    installMatchMedia({ '(prefers-reduced-motion: reduce)': true })
    const { container } = render(<Harness />)
    expect(container.querySelector('[data-reveal]')).toHaveClass('is-revealed')
  })

  it('reveals everything when IntersectionObserver is missing', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('[data-reveal]')).toHaveClass('is-revealed')
  })
})
