import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { ShellLink } from '@/components/shell/NavigationProvider'

type Props = {
  title: string
  icon: Icon
  meta?: string
  href?: string
  className?: string
  headClassName?: string
  children: ReactNode
}

const CARD = 'flex flex-col rounded-[20px] border border-b1 bg-linear-to-b from-s2 to-s1 text-left text-ink'
const LIFT =
  'transition-[translate,scale,border-color,box-shadow] duration-400 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-[3px] hover:border-b2 hover:shadow-[0_24px_60px_-28px_var(--washB)] active:scale-[.988]'

/**
 * Kraft's Home card (KraftScreens.dc.html:78-83): icon tile, title, mono meta.
 * With `href` the whole card is one link, as Kraft's cards are buttons.
 */
export default function HomeCard({ title, icon: Icon, meta, href, className = '', headClassName = '', children }: Props) {
  const head = (
    <div className={`flex flex-wrap items-center gap-[11px] ${headClassName}`}>
      <span aria-hidden className="grid size-[34px] shrink-0 place-items-center rounded-[10px] border border-wash-b bg-wash">
        <Icon size={18} className="text-accent" />
      </span>
      <h2 className="text-[19px] font-semibold tracking-[-.02em]">{title}</h2>
      {meta && <span className="ml-auto font-mono text-[10px] text-ink3">{meta}</span>}
    </div>
  )
  if (!href) {
    return (
      <div className={`${CARD} ${className}`}>
        {head}
        {children}
      </div>
    )
  }
  return (
    <ShellLink href={href} className={`${CARD} ${LIFT} ${className}`}>
      {head}
      {children}
    </ShellLink>
  )
}
