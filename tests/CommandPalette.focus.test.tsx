import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { PaletteProvider, usePalette } from '@/components/shell/CommandPalette'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
}))

function Opener() {
  const { openPalette } = usePalette()
  return <button onClick={openPalette}>Jump to…</button>
}

describe('CommandPalette and sub-views', () => {
  it('hands focus back to its trigger before a picked view opens, so the view can return it there', async () => {
    window.history.replaceState(null, '', '/projects')
    const user = userEvent.setup()
    render(
      <NavigationProvider>
        <PaletteProvider>
          <Opener />
        </PaletteProvider>
      </NavigationProvider>,
    )
    let focusedWhenViewOpened: Element | null = null
    const onHash = () => {
      focusedWhenViewOpened = document.activeElement
    }
    window.addEventListener('hashchange', onHash)
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('automations{Enter}')
    window.removeEventListener('hashchange', onHash)
    expect(window.location.hash).toBe('#automations')
    expect(focusedWhenViewOpened).toBe(screen.getByText('Jump to…'))
  })
})
