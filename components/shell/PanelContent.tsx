'use client'

import type { ReactNode } from 'react'
import { useShellNav } from './NavigationProvider'

/** The part of the panel that dims out during Kraft's 160ms swap. It is also the
    container that page layouts size from (`@container`, Kraft's cqw units). */
export default function PanelContent({ children }: { children: ReactNode }) {
  const { swapping } = useShellNav()
  return (
    <div
      data-panel-content
      className={`@container transition-opacity duration-160 ease-linear ${swapping ? 'opacity-0' : 'opacity-100'}`}
    >
      {children}
    </div>
  )
}
