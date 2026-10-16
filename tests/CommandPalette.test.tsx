import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import { PaletteProvider, usePalette } from '@/components/shell/CommandPalette'
import { registerIntroSkip } from '@/lib/intro'

const nav = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, prefetch: vi.fn() }),
  usePathname: () => '/',
}))

function Opener() {
  const { openPalette } = usePalette()
  return <button onClick={openPalette}>Jump to…</button>
}

const setup = () =>
  render(
    <NavigationProvider>
      <PaletteProvider>
        <Opener />
      </PaletteProvider>
    </NavigationProvider>,
  )
const dialog = () => screen.queryByRole('dialog', { name: 'Command palette' })

describe('CommandPalette', () => {
  beforeEach(() => nav.push.mockReset())

  it('Ctrl+K during the Home intro ends the intro, then opens', async () => {
    const user = userEvent.setup()
    const skip = vi.fn(() => document.documentElement.removeAttribute('data-intro-live'))
    registerIntroSkip(skip)
    document.documentElement.setAttribute('data-intro-live', '')
    setup()
    await user.keyboard('{Control>}k{/Control}')
    expect(skip).toHaveBeenCalledOnce()
    expect(dialog()).toBeInTheDocument()
    registerIntroSkip(null)
  })

  it('Ctrl+K with no intro running never touches it', async () => {
    const user = userEvent.setup()
    const skip = vi.fn()
    registerIntroSkip(skip)
    setup()
    await user.keyboard('{Control>}k{/Control}')
    await user.keyboard('{Control>}k{/Control}')
    expect(skip).not.toHaveBeenCalled()
    expect(dialog()).toBeNull()
    registerIntroSkip(null)
  })

  it('announces "No matches" as a status, outside the listbox', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz')
    const listbox = screen.getByRole('listbox')
    expect(Array.from(listbox.children).every((c) => c.getAttribute('role') === 'option')).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('No matches')
  })

  it('shows a Projects entry with its card’s lead logo, and a page with its icon', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('agentic')
    const option = screen.getByRole('option', { name: /The Agentic Framework/ })
    expect(option.querySelector('[data-brand]')).toHaveAttribute('data-brand', 'claude')
    expect(option.querySelector('[data-brand]')).toHaveAttribute('aria-hidden', 'true')
    await user.clear(screen.getByRole('combobox'))
    await user.keyboard('services')
    const page = screen.getAllByRole('option')[0]
    expect(page.querySelector('[data-brand]')).toBeNull()
    expect(page.querySelector('svg')).not.toBeNull()
  })

  it('Ctrl+K opens and Ctrl+K again closes', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Jump to a section' })).toHaveFocus()
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeNull()
  })

  it('Meta+K opens too', async () => {
    const user = userEvent.setup()
    setup()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(dialog()).toBeInTheDocument()
  })

  it('Enter jumps to the first hit', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('serv{Enter}')
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/services', { scroll: false }))
    expect(dialog()).toBeNull()
  })

  it('ArrowDown moves the selection', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('{ArrowDown}{Enter}')
    await waitFor(() => expect(nav.push).toHaveBeenCalledWith('/projects', { scroll: false }))
  })

  it('Enter with no matches does nothing and keeps the palette open', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz{Enter}')
    expect(dialog()).toBeInTheDocument()
    expect(screen.getByText('No matches')).toBeInTheDocument()
    expect(nav.push).not.toHaveBeenCalled()
  })

  it('Escape closes and returns focus to the opener', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('{Escape}')
    expect(dialog()).toBeNull()
    await waitFor(() => expect(screen.getByText('Jump to…')).toHaveFocus())
  })

  it('Escape still closes after clicking empty space inside the card', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz')
    await user.click(screen.getByText('No matches'))
    await user.keyboard('{Escape}')
    expect(dialog()).toBeNull()
  })

  it('keeps Tab inside the dialog after clicking empty space inside the card', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    await user.keyboard('zzz')
    await user.click(screen.getByText('No matches'))
    await user.tab()
    expect(dialog()!.contains(document.activeElement)).toBe(true)
  })

  it('traps Tab inside the dialog', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Jump to…'))
    for (let i = 0; i < 12; i++) await user.tab()
    expect(dialog()!.contains(document.activeElement)).toBe(true)
  })

  it('stays shut while a sub-view is open (the modal owns the screen)', async () => {
    const user = userEvent.setup()
    setup()
    document.documentElement.setAttribute('data-dialog', '')
    await user.keyboard('{Control>}k{/Control}')
    expect(dialog()).toBeNull()
  })
})
