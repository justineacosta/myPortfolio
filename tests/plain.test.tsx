import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import NotFound from '@/app/not-found'
import PlainLayout from '@/app/(plain)/layout'
import PrivacyPage from '@/app/(plain)/privacy/page'
import TermsPage from '@/app/(plain)/terms/page'
import ThankYouPage, { metadata as thankYouMeta } from '@/app/(plain)/thank-you/page'
import { legal } from '@/data/legal'

describe('plain pages', () => {
  it('the shell links home, carries the theme and access buttons, and the legal links', () => {
    render(
      <PlainLayout>
        <p>content</p>
      </PlainLayout>,
    )
    expect(screen.getByRole('link', { name: 'KRAFT' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accessibility options' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Legal' })
    expect(within(nav).getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/privacy', '/terms'])
  })

  it('Privacy and Terms are flagged for owner review, with every section', () => {
    render(<PrivacyPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(legal.review)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      ...legal.privacy.sections.map((s) => s.heading),
      legal.contactHeading,
    ])
    render(<TermsPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeInTheDocument()
  })

  it('the contact line shows the address without a mailto while it is a PLACEHOLDER', () => {
    render(<PrivacyPage />)
    expect(screen.queryByRole('link', { name: /PLACEHOLDER/ })).toBeNull()
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
})
