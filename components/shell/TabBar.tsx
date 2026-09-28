'use client'

import { usePathname } from 'next/navigation'
import { isActivePath, MOBILE_NAV } from '@/data/nav'
import { ShellLink } from './NavigationProvider'

export default function TabBar() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 flex items-end justify-between gap-0.5 border-t border-b1 bg-nav px-3 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] shell:hidden"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-b from-transparent to-nav" />
      {MOBILE_NAV.map((item) => {
        const Icon = item.icon
        if (item.center) {
          return (
            <ShellLink key="center" href={item.href} aria-label="Start a project" className="group flex flex-1 flex-col items-center gap-1">
              <span
                aria-hidden
                className="grid size-[54px] -translate-y-3 place-items-center rounded-full bg-accent text-on-accent shadow-[0_12px_30px_-8px_var(--glow)] transition-transform duration-300 group-hover:-translate-y-[15px] group-hover:scale-[1.04]"
              >
                <Icon size={22} />
              </span>
              <span className="-translate-y-2.5 text-[10px] font-semibold text-accent">{item.label}</span>
            </ShellLink>
          )
        }
        const active = isActivePath(pathname, item.href)
        return (
          <ShellLink
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className="relative flex min-h-12 flex-1 flex-col items-center gap-1.5 py-[7px]"
          >
            {active && <span aria-hidden className="absolute inset-0 rounded-[14px] border border-wash-b bg-wash" />}
            <span aria-hidden className="relative grid size-[22px] place-items-center">
              <Icon size={18} className={active ? 'text-accent' : 'text-ink3'} />
            </span>
            <span className="relative text-[10px] font-medium text-ink2">{item.label}</span>
          </ShellLink>
        )
      })}
    </nav>
  )
}
