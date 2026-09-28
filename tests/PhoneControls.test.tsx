import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PhoneControls from '@/components/shell/PhoneControls'

const nav = vi.hoisted(() => ({ pathname: '/' }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => nav.pathname,
}))

const renderControls = () =>
  render(
    <NavigationProvider>
      <PaletteProvider>
        <PhoneControls />
      </PaletteProvider>
    </NavigationProvider>,
  )

describe('PhoneControls', () => {
  it('stays out of the way on Home, where the profile header carries them', () => {
    nav.pathname = '/'
    renderControls()
    expect(screen.queryByRole('button', { name: 'Open command palette' })).toBeNull()
  })

  it('floats theme and search on every other page', () => {
    nav.pathname = '/about'
    renderControls()
    expect(screen.getByRole('button', { name: 'Open command palette' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
  })
})
