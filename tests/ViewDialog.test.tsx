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
/** A real click: the press and the release on the same element. */
const press = (el: Element) => {
  fireEvent.pointerDown(el)
  fireEvent.click(el)
}
/** Two views. B comes first in the tree, so its effect runs before A's (a hash handover from A to B). */
const pair = (a: boolean, b: boolean) => (
  <>
    <ViewDialog open={b} onClose={() => {}} label="B">
      <p>B</p>
    </ViewDialog>
    <ViewDialog open={a} onClose={() => {}} label="A">
      <p>A</p>
    </ViewDialog>
  </>
)

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
    press(screen.getByText('Inside'))
    expect(onClose).not.toHaveBeenCalled()
    press(dialog())
    press(screen.getByText('Empty stage'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('does not close when a press inside ends on the backdrop (drag-selecting text)', () => {
    const { rerender } = render(ui(false))
    rerender(ui(true))
    fireEvent.pointerDown(screen.getByText('Inside'))
    fireEvent.click(dialog())
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps the page locked when one view hands over straight to another', () => {
    const { rerender } = render(pair(true, false))
    rerender(pair(false, true))
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('keeps the page locked when a view stacked on another closes', () => {
    const { rerender } = render(pair(true, false))
    rerender(pair(true, true))
    rerender(pair(true, false))
    expect(document.documentElement).toHaveAttribute('data-dialog')
  })

  it('with nothing focused to go back to, returns focus to the page, not the body', () => {
    const page = (open: boolean) => (
      <main id="main-content" tabIndex={-1}>
        <ViewDialog open={open} onClose={onClose} label="A view">
          <p>Inside</p>
        </ViewDialog>
      </main>
    )
    const { rerender } = render(page(false))
    ;(document.activeElement as HTMLElement | null)?.blur()
    rerender(page(true))
    rerender(page(false))
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('never leaves the page locked when it unmounts while open', () => {
    const { rerender, unmount } = render(ui(false))
    rerender(ui(true))
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-dialog')
  })
})
