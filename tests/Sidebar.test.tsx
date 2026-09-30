import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import Sidebar from '@/components/shell/Sidebar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/projects',
}))

const renderSidebar = () =>
  render(
    <NavigationProvider>
      <Sidebar />
    </NavigationProvider>,
  )

describe('Sidebar', () => {
  it('numbers the seven sections 01-07 and marks the current one', () => {
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(7)
    expect(links.map((l) => l.textContent)).toEqual([
      'Home01', 'Projects02', 'Showcase03', 'Services04', 'Testimonials05', 'About06', 'FAQs / Contact07',
    ])
    expect(links[1]).toHaveAttribute('aria-current', 'page')
    expect(links[0]).not.toHaveAttribute('aria-current')
  })

  it("shows Kraft's identity block", () => {
    renderSidebar()
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
  })

  it("shows availability the way Contact does: the timezone, then the regions and hours covered", () => {
    renderSidebar()
    expect(screen.getByText('Available for work · GMT+8')).toBeInTheDocument()
    expect(screen.getByText('US · EU · CA HOURS COVERED')).toBeInTheDocument()
    expect(screen.queryByText('TIMEZONES')).not.toBeInTheDocument()
  })

  it('links GitHub and LinkedIn only, beside the theme button, and leaves accessibility to the floating button', () => {
    renderSidebar()
    const aside = screen.getByRole('complementary', { name: 'Profile and site navigation' })
    expect(within(aside).queryByRole('link', { name: 'X' })).not.toBeInTheDocument()
    expect(within(aside).queryByRole('link', { name: 'Discord' })).not.toBeInTheDocument()
    expect(within(aside).getByRole('link', { name: 'GitHub' })).toBeInTheDocument()
    expect(within(aside).getByRole('link', { name: 'LinkedIn' })).toBeInTheDocument()
    expect(within(aside).queryByRole('button', { name: 'Accessibility options' })).not.toBeInTheDocument()
  })

  it('opens the real social links in a new tab, safely', () => {
    renderSidebar()
    const gh = screen.getByRole('link', { name: 'GitHub' })
    expect(gh).toHaveAttribute('href', 'https://github.com/justineacosta')
    expect(gh).toHaveAttribute('target', '_blank')
    expect(gh).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('is dealt back in row by row after the intro', () => {
    renderSidebar()
    expect(screen.getByRole('complementary', { name: 'Profile and site navigation' })).toHaveAttribute('data-intro-rail')
  })

  it('links Start a project to Contact', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /Start a project/ })).toHaveAttribute('href', '/contact')
  })
})
