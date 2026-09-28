import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomeProfile from '@/components/home/HomeProfile'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import { NavigationProvider } from '@/components/shell/NavigationProvider'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}))

describe('HomeProfile', () => {
  it("shows Kraft's phone identity header with theme and search", async () => {
    const user = userEvent.setup()
    render(
      <NavigationProvider>
        <PaletteProvider>
          <HomeProfile />
        </PaletteProvider>
      </NavigationProvider>,
    )
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
    expect(screen.getByText(/@KRAFT · GMT\+8 ·/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open command palette' }))
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })
})
