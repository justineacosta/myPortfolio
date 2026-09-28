import { expect, it } from 'vitest'
import { render } from '@testing-library/react'
import WheelRow from '@/components/home/WheelRow'

it('is not a Tab stop of its own: the card link around it is', () => {
  const { container } = render(<WheelRow className="">x</WheelRow>)
  expect(container.firstElementChild).toHaveAttribute('tabindex', '-1')
})
