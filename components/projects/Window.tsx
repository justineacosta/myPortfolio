import type { ReactNode } from 'react'
import { XIcon } from '@phosphor-icons/react/ssr'
import ViewDialog from '@/components/ui/ViewDialog'
import { projects, type Chip } from '@/data/projects'

type Props = { open: boolean; onClose: () => void; title: string; children: ReactNode }

/**
 * Kraft's document window (Kraft Projects Board.dc.html:190-238): traffic
 * lights, the title in an address field, Close, and a scrolling body. The
 * browser focuses Close when it opens.
 */
export default function Window({ open, onClose, title, children }: Props) {
  return (
    <ViewDialog open={open} onClose={onClose} label={title} className="view--window">
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-b2 bg-bg shadow-(--window-shadow)">
        <div className="flex items-center gap-2.5 border-b border-b1 bg-s0 px-3.5 py-2.5">
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-r" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-y" />
          <span aria-hidden className="size-[11px] shrink-0 rounded-full bg-mac-g" />
          <span className="mx-2 min-w-0 flex-1 truncate rounded-[7px] border border-b1 bg-s1 px-3 py-1.5 text-[12.5px] text-ink2">
            {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={projects.close}
            className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-[11px] border border-b1 bg-s1 text-ink transition-colors duration-200 hover:bg-hover"
          >
            <XIcon size={17} aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-[30px] overflow-y-auto overscroll-contain p-[clamp(16px,2.2vw,30px)]">
          {children}
        </div>
      </div>
    </ViewDialog>
  )
}

/** The window's opening panel: kicker, the lede as its heading, and what it was built with. */
export function WindowHero({ kicker, lede, stack }: { kicker: string; lede: string; stack: Chip[] }) {
  return (
    <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-b1 bg-[radial-gradient(120%_140%_at_8%_-20%,rgba(var(--amb),.5),rgba(var(--amb),0)_60%),linear-gradient(180deg,var(--s1),var(--s2))] p-[clamp(18px,2vw,28px)]">
      <div className="flex min-w-[min(260px,100%)] flex-[1_1_360px] flex-col gap-2.5">
        <span className="font-mono text-[10.5px] tracking-[.18em] text-accent">{kicker}</span>
        <h2 className="text-[clamp(19px,2.2vw,27px)] leading-[1.24] font-semibold tracking-[-.03em]">{lede}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-[9px]">
        <span className="mr-1 font-mono text-[10px] tracking-[.16em] text-ink3">{projects.builtWith}</span>
        {stack.map((b) => (
          <span key={b.name} className="flex items-center gap-2 rounded-full border border-b1 bg-s0 px-[15px] py-[9px] text-[13.5px] font-medium">
            <b.icon size={15} aria-hidden className="text-accent" />
            {b.name}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A titled group of cards inside a window. */
export function WindowSection({ name, blurb, children }: { name: string; blurb: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h3 className="text-[17px] font-semibold tracking-[-.02em]">{name}</h3>
        <span className="text-[13px] text-ink3">{blurb}</span>
      </div>
      <div className="flex flex-wrap gap-3.5">{children}</div>
    </section>
  )
}
