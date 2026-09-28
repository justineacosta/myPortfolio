'use client'

import type { ReactNode } from 'react'
import { useWheelToX } from '@/hooks/useWheelToX'

/**
 * A sideways row that a vertical wheel scrolls, until it reaches its end. It
 * sits inside the Services card's link, so it is not a Tab stop of its own.
 */
export default function WheelRow({ className, children }: { className: string; children: ReactNode }) {
  const ref = useWheelToX<HTMLDivElement>()
  return (
    <div ref={ref} data-wheel-x tabIndex={-1} className={className}>
      {children}
    </div>
  )
}
