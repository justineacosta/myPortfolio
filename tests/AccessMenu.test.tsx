import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccessMenu from '@/components/shell/AccessMenu'
import { A11Y_KEY } from '@/lib/storage-keys'

const html = () => document.documentElement
const trigger = () => screen.getByRole('button', { name: 'Accessibility options' })
const panel = () => screen.getByRole('dialog', { name: 'Accessibility' })

async function openMenu() {
  const user = userEvent.setup()
  render(<AccessMenu />)
  await user.click(trigger())
  return user
}

describe('AccessMenu', () => {
  afterEach(() => vi.restoreAllMocks())

  it('opens a panel from its button and moves focus into it', async () => {
    await openMenu()
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(panel().contains(document.activeElement)).toBe(true)
  })

  it('larger text applies at once and is remembered', async () => {
    const user = await openMenu()
    await user.click(within(panel()).getByRole('button', { name: 'A+, Larger text' }))
    expect(html()).toHaveAttribute('data-a11y-text', 'lg')
    expect(within(panel()).getByRole('button', { name: 'A+, Larger text' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem(A11Y_KEY)!)).toMatchObject({ text: 'lg' })
  })

  it('each switch turns its effect on and off', async () => {
    const user = await openMenu()
    const SWITCHES = [
      ['Stronger contrast', 'data-a11y-contrast'],
      ['Motion off', 'data-a11y-motion'],
      ['Underlined links', 'data-a11y-links'],
    ] as const
    for (const [name, attr] of SWITCHES) {
      const sw = within(panel()).getByRole('button', { name: new RegExp(`^${name}`) })
      await user.click(sw)
      expect(html()).toHaveAttribute(attr, 'true')
      expect(sw).toHaveAttribute('aria-pressed', 'true')
      await user.click(sw)
      expect(html()).not.toHaveAttribute(attr)
    }
  })

  it('Reset puts everything back, and is off while nothing has changed', async () => {
    const user = await openMenu()
    const reset = within(panel()).getByRole('button', { name: 'Reset to default' })
    expect(reset).toBeDisabled()
    await user.click(within(panel()).getByRole('button', { name: /^Motion off/ }))
    expect(reset).toBeEnabled()
    await user.click(reset)
    expect(html()).not.toHaveAttribute('data-a11y-motion')
  })

  it('Escape closes it and gives focus back to the button', async () => {
    const user = await openMenu()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeNull()
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('a click anywhere else closes it', async () => {
    const user = await openMenu()
    await user.click(document.body)
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeNull()
  })

  it('stays open when only the height changes (a phone address bar showing or hiding), and closes when the width does', async () => {
    await openMenu()
    const resize = (width: number, height: number) => {
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })
      Object.defineProperty(window, 'innerHeight', { value: height, configurable: true })
      act(() => void window.dispatchEvent(new Event('resize')))
    }
    resize(window.innerWidth, window.innerHeight - 60)
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeInTheDocument()
    resize(window.innerWidth - 200, window.innerHeight)
    expect(screen.queryByRole('dialog', { name: 'Accessibility' })).toBeNull()
  })

  it('still works when storage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    const user = await openMenu()
    const sw = within(panel()).getByRole('button', { name: /^Stronger contrast/ })
    await user.click(sw)
    expect(html()).toHaveAttribute('data-a11y-contrast', 'true')
    expect(sw).toHaveAttribute('aria-pressed', 'true')
  })

  it('every copy of the menu shows the same state', async () => {
    const user = userEvent.setup()
    render(
      <>
        <AccessMenu />
        <AccessMenu size={40} />
      </>,
    )
    const [first, second] = screen.getAllByRole('button', { name: 'Accessibility options' })
    await user.click(first)
    await user.click(within(panel()).getByRole('button', { name: /^Motion off/ }))
    await user.keyboard('{Escape}')
    await user.click(second)
    expect(within(panel()).getByRole('button', { name: /^Motion off/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
