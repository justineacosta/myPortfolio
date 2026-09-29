import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { useDragScroll } from '@/hooks/useDragScroll'

function Strip() {
  const ref = useDragScroll<HTMLDivElement>()
  return <div ref={ref} data-testid="strip" />
}

const setup = () => {
  const { getByTestId } = render(<Strip />)
  const el = getByTestId('strip')
  el.scrollLeft = 100
  return el
}

describe('useDragScroll', () => {
  it('scrolls sideways as a mouse drags, the opposite way to the pointer', () => {
    const el = setup()
    fireEvent.pointerDown(el, { pointerType: 'mouse', button: 0, clientX: 300, pointerId: 1 })
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 240, pointerId: 1 })
    expect(el.scrollLeft).toBe(160)
    expect(el).toHaveAttribute('data-dragging')
    fireEvent.pointerUp(window, { pointerType: 'mouse', clientX: 240, pointerId: 1 })
    expect(el).not.toHaveAttribute('data-dragging')
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 100, pointerId: 1 })
    expect(el.scrollLeft).toBe(160)
  })

  it("leaves touch to the browser's own swipe", () => {
    const el = setup()
    fireEvent.pointerDown(el, { pointerType: 'touch', button: 0, clientX: 300, pointerId: 2 })
    fireEvent.pointerMove(window, { pointerType: 'touch', clientX: 200, pointerId: 2 })
    expect(el.scrollLeft).toBe(100)
    expect(el).not.toHaveAttribute('data-dragging')
  })

  it('ignores a right-click', () => {
    const el = setup()
    fireEvent.pointerDown(el, { pointerType: 'mouse', button: 2, clientX: 300, pointerId: 3 })
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 200, pointerId: 3 })
    expect(el.scrollLeft).toBe(100)
  })
})
