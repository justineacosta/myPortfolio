'use client'

import { usePathname } from 'next/navigation'
import { ArrowUpRightIcon } from '@phosphor-icons/react/ssr'
import { navForPath } from '@/data/nav'
import { ShellLink } from './NavigationProvider'

export default function TopBar({ onJump }: { onJump?: () => void }) {
  const pathname = usePathname()
  return (
    <div data-intro-hold className="sticky top-0 z-5 hidden items-center gap-3.5 bg-linear-to-b from-fade-a via-fade-b via-65% to-transparent py-4 backdrop-blur-[8px] shell:flex">
      <span className="font-mono text-[10.5px] tracking-[.14em] text-ink3">KRAFT / {navForPath(pathname).hint}</span>
      <div className="ml-auto flex items-center gap-2.5">
        {onJump && (
          <button
            type="button"
            onClick={onJump}
            className="flex min-h-10 cursor-pointer items-center gap-[9px] rounded-[11px] border border-b1 bg-s2 px-3 py-[9px] text-[12.5px] text-ink3 transition-all duration-250 hover:border-b2 hover:text-ink2"
          >
            Jump to… <kbd className="rounded-md bg-chip px-1.5 py-0.5 font-mono text-[10px] text-ink2">⌘K</kbd>
          </button>
        )}
        <ShellLink
          href="/contact"
          className="flex min-h-10 items-center gap-2 rounded-[11px] border border-b2 bg-wash px-[15px] py-[9px] text-[12.5px] font-medium text-accent transition-all duration-250 hover:border-accent hover:bg-accent hover:text-on-accent"
        >
          Get in touch <ArrowUpRightIcon size={15} aria-hidden />
        </ShellLink>
      </div>
    </div>
  )
}
