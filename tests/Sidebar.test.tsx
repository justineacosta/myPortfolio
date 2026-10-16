import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import Sidebar from '@/components/shell/Sidebar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
}))

const renderSidebar = () =>
  render(
    <NavigationProvider>
      <Sidebar />
    </NavigationProvider>,
  )

describe('Sidebar', () => {
  it('numbers the eight sections 01-08 and marks the current one', () => {
    renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Sections' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(8)
    expect(links.map((l) => l.textContent)).toEqual([
      'Home01', 'Projects02', 'Showcase03', 'Services04', 'Notes05', 'Testimonials06', 'About07', 'FAQs / Contact08',
    ])
    expect(links[1]).toHaveAttribute('aria-current', 'page')
    expect(links[0]).not.toHaveAttribute('aria-current')
  })

  it("shows Kraft's identity block", () => {
    renderSidebar()
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
  })

  it('hides the drawn portrait behind the photo, as decoration, for a hover to reveal', () => {
    renderSidebar()
    const photo = screen.getByRole('img', { name: 'Portrait of Justine Acosta' })
    const drawn = document.querySelector('[data-portrait-drawn]')!
    expect(drawn.getAttribute('src')).toContain('portrait-drawn.jpg')
    expect(drawn).toHaveAttribute('alt', '')
    expect(drawn.className).toMatch(/opacity-0/)
    expect(drawn.className).toMatch(/group-hover\/avatar:opacity-100/)
    expect(photo.closest('.group\\/avatar')).toBe(drawn.closest('.group\\/avatar'))
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
