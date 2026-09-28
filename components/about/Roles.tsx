import Image from 'next/image'
import { CARD } from '@/components/ui/styles'
import { ROLES } from '@/data/about'
import { brandIcon } from '@/data/stack'

/** Kraft's logo fan per role (KraftScreens.dc.html:1164-1181): stacked at rest, fanned while the row is hovered. */
const POSE = [
  'z-10 group-hover/role:[transform:translateY(-6px)_rotate(-10.5deg)_scale(1.08)]',
  'z-9 -ml-[13px] delay-45 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(-3.5deg)_scale(1.08)]',
  'z-8 -ml-[13px] delay-90 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(3.5deg)_scale(1.08)]',
  'z-7 -ml-[13px] delay-135 group-hover/role:ml-1 group-hover/role:[transform:translateY(-6px)_rotate(10.5deg)_scale(1.08)]',
]

/** The four hats (KraftScreens.dc.html:409-424). */
export default function Roles() {
  return (
    <ul className={`${CARD} flex flex-col overflow-hidden`}>
      {ROLES.map((r) => (
        <li
          key={r.n}
          className="group/role flex items-center gap-[18px] border-b border-b1 px-[18px] py-3.5 transition-colors duration-300 last:border-b-0 hover:bg-hover"
        >
          <div aria-hidden className="flex shrink-0 items-center py-1">
            {r.logos.map((l, i) => (
              <span
                key={l.slug}
                className={`relative grid size-[31px] shrink-0 place-items-center rounded-[10px] bg-logo-chip shadow-(--logo-shadow) transition-[transform,margin-left] duration-380 ease-[cubic-bezier(.2,.8,.2,1)] ${POSE[i]}`}
              >
                <Image src={brandIcon(l.slug)} alt="" width={16} height={16} className="block" />
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-[3px]">
            <h3 className="text-[clamp(14px,1.7cqw,17px)] font-semibold tracking-[-.015em]">{r.name}</h3>
            <span className="text-xs text-ink3">{r.line}</span>
          </div>
          <span className="ml-auto shrink-0 font-mono text-xs text-ink3 transition-colors duration-300 group-hover/role:text-accent">{r.n}</span>
        </li>
      ))}
    </ul>
  )
}
