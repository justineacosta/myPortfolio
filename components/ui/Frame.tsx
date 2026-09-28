import type { CSSProperties, ReactNode } from 'react'

/** Where Kraft lights a page frame from: the radial's centre, size, strength and fade stop. */
export type Lit = { x: string; y?: string; size?: string; alpha: number; stop: string; from?: 's1' | 's2' }

type Props = { lit: Lit; className?: string; children: ReactNode }

/**
 * Kraft's page frame (KraftScreens.dc.html:217, 276, 335, 401, 472; Kraft
 * Projects Board.dc.html:43): a rounded panel lit by the ambient green.
 * Layout and padding come from `className`, since every page lays it out
 * differently.
 */
export default function Frame({ lit, className = '', children }: Props) {
  const style = {
    '--lit-x': lit.x,
    '--lit-y': lit.y ?? '-10%',
    '--lit-size': lit.size ?? '110% 100%',
    '--lit': lit.alpha,
    '--lit-stop': lit.stop,
    '--lit-from': `var(--${lit.from ?? 's1'})`,
  } as CSSProperties
  return (
    <div className={`frame rounded-[26px] border border-b1 ${className}`} style={style}>
      {children}
    </div>
  )
}
