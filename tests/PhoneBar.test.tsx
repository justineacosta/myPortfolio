import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PaletteProvider } from '@/components/shell/CommandPalette'
import { NavigationProvider } from '@/components/shell/NavigationProvider'
import PhoneBar from '@/components/shell/PhoneBar'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/about',
}))

const renderBar = () =>
  render(
    <NavigationProvider>
      <PaletteProvider>
        <PhoneBar />
      </PaletteProvider>
    </NavigationProvider>,
  )

const bar = () => document.querySelector<HTMLElement>('[data-phone-bar]')!

/** Scrolls the window to `y` and lets the bar's frame run. */
function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: y })
    fireEvent.scroll(window)
    vi.runAllTimers()
  })
}

describe('PhoneBar', () => {
  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  })

  it("shows Kraft's phone identity with theme, access and search, on any page", async () => {
    const user = userEvent.setup()
    renderBar()
    expect(screen.getByText('Justine Acosta')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Certified' })).toBeInTheDocument()
    expect(screen.getByText(/@KRAFT · GMT\+8 ·/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Toggle dark and light mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accessibility options' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open command palette' }))
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument()
  })

  it('slides away as you scroll down and comes back as you scroll up', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout'] })
    renderBar()
    expect(bar()).not.toHaveAttribute('data-hidden')
    scrollTo(400)
    expect(bar()).toHaveAttribute('data-hidden')
    scrollTo(380)
    expect(bar()).not.toHaveAttribute('data-hidden')
  })

  it('stays while one of its buttons has focus', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'setTimeout'] })
    renderBar()
    act(() => screen.getByRole('button', { name: 'Open command palette' }).focus())
    scrollTo(600)
    expect(bar()).not.toHaveAttribute('data-hidden')
  })
})
