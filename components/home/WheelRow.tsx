'use client'

import type { ReactNode } from 'react'
import { useWheelToX } from '@/hooks/useWheelToX'

/** A sideways row that a vertical wheel scrolls, until it reaches its end. */
export default function WheelRow({ className, children }: { className: string; children: ReactNode }) {
  const ref = useWheelToX<HTMLDivElement>()
  return (
    <div ref={ref} data-wheel-x className={className}>
      {children}
    </div>
  )
}
