import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Hero from '@/components/home/Hero'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

const renderHero = () =>
  render(
    <NavigationProvider>
      <Hero />
    </NavigationProvider>,
  )

describe('Hero', () => {
  it("renders Kraft's headline as the intro's landing target", () => {
    renderHero()
    const h1 = screen.getByRole('heading', { level: 1, name: 'Software that keeps its promises.' })
    expect(h1).toHaveAttribute('data-intro-target')
    expect(h1.closest('[data-intro-hold]')).toBeNull()
  })

  it('shows the eyebrow and lede, held back for the intro', () => {
    renderHero()
    expect(screen.getByText('HOME / OVERVIEW')).toHaveAttribute('data-intro-hold')
    expect(screen.getByText(/^Full-stack development, AI automation/)).toHaveAttribute('data-intro-hold')
  })

  it('links the two actions to Contact and Projects', () => {
    renderHero()
    expect(screen.getByRole('link', { name: 'Start a project' })).toHaveAttribute('href', '/contact')
    expect(screen.getByRole('link', { name: 'See the work' })).toHaveAttribute('href', '/projects')
  })

  it('shows short stand-ins for placeholder stats and the real timezone', () => {
    renderHero()
    const list = screen.getByRole('list')
    expect(list).toHaveTextContent('[X]yrs')
    expect(list).toHaveTextContent('[N]builds')
    expect(list).toHaveTextContent('GMT+8')
    expect(list).toHaveTextContent('US hours')
  })
})
