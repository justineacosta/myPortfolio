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
    expect(screen.getByText('Available for work')).toBeInTheDocument()
  })

  it('points placeholder social links at # and never opens a new tab for them', () => {
    renderSidebar()
    const gh = screen.getByRole('link', { name: 'GitHub' })
    expect(gh).toHaveAttribute('href', '#')
    expect(gh).not.toHaveAttribute('target')
  })

  it('links Start a project to Contact', () => {
    renderSidebar()
    expect(screen.getByRole('link', { name: /Start a project/ })).toHaveAttribute('href', '/contact')
  })
})
