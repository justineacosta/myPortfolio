import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NotFound from '@/app/not-found'
import PlainLayout from '@/app/(plain)/layout'
import ThankYouPage, { metadata as thankYouMeta } from '@/app/(plain)/thank-you/page'
import { legal } from '@/data/legal'
import { shellCopy } from '@/data/nav'

describe('plain pages', () => {
  it('the shell links home and carries the theme and access buttons, with no legal links', () => {
    render(
      <PlainLayout>
        <p>content</p>
      </PlainLayout>,
    )
    expect(screen.getByRole('link', { name: 'KRAFT' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accessibility options' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Legal' })).toBeNull()
  })

  it('takes its skip link from data/', () => {
    render(
      <PlainLayout>
        <p>content</p>
      </PlainLayout>,
    )
    expect(screen.getByRole('link', { name: shellCopy.skipLink })).toHaveAttribute('href', '#plain-main')
  })

  it('Thank-you is a calm card with two ways on, and is kept out of search', () => {
    render(<ThankYouPage />)
    expect(screen.getByRole('heading', { level: 1, name: legal.thankYou.title })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '/projects')
    expect(thankYouMeta.robots).toEqual({ index: false, follow: true })
  })

  it('the 404 says so and offers Home and Contact', () => {
    render(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to home/ })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Get in touch' })).toHaveAttribute('href', '/contact')
  })

  it.each([
    ['Thank-you', () => <ThankYouPage />],
    ['404', () => <NotFound />],
  ])('%s shows the drawn portrait beside its message', (_, page) => {
    render(page())
    const art = screen.getByRole('img', { name: 'Drawing of Justine raising a bottle in a café' })
    expect(art.getAttribute('src')).toContain('portrait-drawn.jpg')
    // Text first in reading order, so the message is read before the picture.
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1.compareDocumentPosition(art) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
