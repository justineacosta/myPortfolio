import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ViewDialog from '@/components/ui/ViewDialog'

const onClose = vi.fn()
const ui = (open: boolean) => (
  <>
    <button type="button">Open it</button>
    <ViewDialog open={open} onClose={onClose} label="The build plan">
      <p>Inside</p>
      <div data-backdrop>Empty stage</div>
    </ViewDialog>
  </>
)
const dialog = () => document.querySelector('dialog')!

describe('ViewDialog', () => {
  beforeEach(() => onClose.mockReset())

  it('keeps its content in the page while closed, so it is pre-rendered', () => {
    render(ui(false))
    expect(dialog()).not.toHaveAttribute('open')
    expect(dialog()).toHaveTextContent('Inside')
  })

  it('opens modally, names itself, keeps Lenis out and locks the page', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    expect(dialog()).toHaveAttribute('open')
    expect(dialog()).toHaveAttribute('aria-label', 'The build plan')
    expect(dialog()).toHaveAttribute('data-lenis-prevent')
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('closing from its owner unlocks the page and returns focus, without calling onClose', () => {
    const { rerender } = render(ui(false))
    screen.getByRole('button', { name: 'Open it' }).focus()
    rerender(ui(true))
    rerender(ui(false))
    expect(dialog()).not.toHaveAttribute('open')
    expect(document.documentElement).not.toHaveAttribute('data-dialog')
    expect(screen.getByRole('button', { name: 'Open it' })).toHaveFocus()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('reports a close the browser made itself (Escape)', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    dialog().close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on the backdrop or an empty stage, not on a click inside', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    fireEvent.click(screen.getByText('Inside'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(dialog())
    fireEvent.click(screen.getByText('Empty stage'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('never leaves the page locked when it unmounts while open', () => {
    const { rerender, unmount } = render(ui(false))
    rerender(ui(true))
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-dialog')
  })
})
