import Image from 'next/image'
import { ArrowRightIcon, StackIcon } from '@phosphor-icons/react/ssr'
import { home } from '@/data/home'
import { SERVICES } from '@/data/services'
import { brandIcon } from '@/data/stack'
import HomeCard from './HomeCard'
import WheelRow from './WheelRow'

/** Kraft's logo stack (KraftScreens.dc.html:1082-1093): overlapped at rest, fanned when its service is hovered. */
const LOGO_POSE = [
  'z-9 group-hover/svc:[transform:translateY(-5px)_rotate(-8deg)_scale(1.1)]',
  'z-8 -ml-[11px] delay-45 group-hover/svc:ml-[3px] group-hover/svc:[transform:translateY(-5px)_rotate(0deg)_scale(1.1)]',
  'z-7 -ml-[11px] delay-90 group-hover/svc:ml-[3px] group-hover/svc:[transform:translateY(-5px)_rotate(8deg)_scale(1.1)]',
]

export default function ServicesCard() {
  const c = home.cards.services
  const total = String(SERVICES.length).padStart(2, '0')
  return (
    <HomeCard title={c.title} icon={StackIcon} meta={total} href={c.href} className="min-w-[240px] flex-[1_1_290px] gap-3 p-5">
      <div className="flex items-center gap-2 font-mono text-[9.5px] tracking-[.14em] text-ink3">
        {c.hint} <ArrowRightIcon size={12} aria-hidden className="text-accent" />
      </div>
      <WheelRow className="-mx-1 flex snap-x snap-proximity gap-2.5 overflow-x-auto overscroll-x-contain scroll-smooth scroll-px-1 px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SERVICES.map((s) => (
          <div
            key={s.n}
            className="group/svc flex flex-[0_0_176px] snap-start flex-col gap-[9px] rounded-[15px] border border-b1 bg-s0 p-[13px] transition-colors duration-300 hover:border-b2 hover:bg-hover"
          >
            <div className="flex items-center gap-2">
              <div aria-hidden className="flex shrink-0 items-center py-[3px]">
                {s.logos.map((l, li) => (
                  <span
                    key={`${l.slug}-${li}`}
                    className={`relative grid size-[27px] shrink-0 place-items-center rounded-[9px] bg-logo-chip shadow-(--logo-shadow) transition-[transform,margin-left] duration-380 ease-[cubic-bezier(.2,.8,.2,1)] ${LOGO_POSE[li]}`}
                  >
                    <Image src={brandIcon(l.slug)} alt="" width={15} height={15} className="block" />
                  </span>
                ))}
              </div>
              <span className="ml-auto font-mono text-[9.5px] text-ink3">
                {s.n} / {total}
              </span>
            </div>
            <span className="text-[12.5px] leading-[1.3] font-semibold tracking-[-.01em] text-ink-soft">{s.name}</span>
            <span className="text-[11px] leading-[1.45] text-ink3">{s.line}</span>
            <span className="mt-auto self-start rounded-[7px] border border-wash-b bg-wash px-2 py-1 font-mono text-[8.5px] tracking-[.1em] text-accent">
              {s.badge}
            </span>
          </div>
        ))}
      </WheelRow>
    </HomeCard>
  )
}
