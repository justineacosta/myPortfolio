'use client'

import type { ComponentProps } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { ShellLink } from './NavigationProvider'

/** Kraft's "magnet" hover on the sidebar CTA (Kraft Portfolio.dc.html:723-731). */
export default function MagnetLink(props: ComponentProps<typeof ShellLink>) {
  return (
    <ShellLink
      {...props}
      onMouseMove={(e) => {
        if (prefersReducedMotion()) return
        const el = e.currentTarget
        const b = el.getBoundingClientRect()
        const dx = ((e.clientX - (b.left + b.width / 2)) / b.width) * 9
        const dy = ((e.clientY - (b.top + b.height / 2)) / b.height) * 5 - 1
        el.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
      }}
    />
  )
}
