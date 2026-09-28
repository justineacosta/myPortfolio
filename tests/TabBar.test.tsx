import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import TabBar from '@/components/shell/TabBar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/services',
}))

describe('TabBar', () => {
  it("renders Kraft's five slots with Start as the raised Contact action", () => {
    render(
      <NavigationProvider>
        <TabBar />
      </NavigationProvider>,
    )
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('rises back in after the intro', () => {
    render(
      <NavigationProvider>
        <TabBar />
      </NavigationProvider>,
    )
    expect(screen.getByRole('navigation', { name: 'Sections' })).toHaveAttribute('data-intro-hold', 'bar')
  })
})
