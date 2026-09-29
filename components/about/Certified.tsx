import { SealCheckIcon } from '@phosphor-icons/react/ssr'
import CertBadge from '@/components/ui/CertBadge'
import { ICON_TILE } from '@/components/ui/styles'
import { about } from '@/data/about'
import { CERTS } from '@/data/credentials'

/**
 * Kraft's certification chips (KraftScreens.dc.html:437-448, 1151-1163), each
 * a small badge.svg medal (CertBadge) that lifts and tilts, with its full name
 * in a tooltip. Each chip takes
 * keyboard focus, so the tooltip is reachable without a mouse.
 */
export default function Certified() {
  return (
    <div className="flex min-w-[min(190px,100%)] flex-[1_1_210px] flex-wrap items-center gap-3.5 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-[17px] py-[15px]">
      <span aria-hidden className={ICON_TILE}>
        <SealCheckIcon size={18} />
      </span>
      <span className="shrink-0 font-mono text-[9.5px] tracking-[.14em] text-ink3">{about.certified}</span>
      <ul className="ml-auto flex items-center gap-3 pb-3">
        {CERTS.map((c) => (
          <li key={c.name}>
            <span
              role="img"
              tabIndex={0}
              aria-label={c.name}
              className="group/cert cert-turn relative block cursor-default rounded-full transition-transform duration-400 ease-[cubic-bezier(.2,.8,.2,1)] hover:[--cert-tilt:-5deg] hover:[transform:translateY(-7px)_rotate(-5deg)_scale(1.1)] focus-visible:[--cert-tilt:-5deg] focus-visible:[transform:translateY(-7px)_rotate(-5deg)_scale(1.1)]"
            >
              <CertBadge icon={c.icon} size={40} />
              <span
                aria-hidden
                className="pointer-events-none absolute right-0 bottom-[calc(100%+9px)] z-20 w-max max-w-[190px] translate-y-1.5 rounded-[9px] border border-b2 bg-s0 px-[11px] py-[7px] text-right font-mono text-[9.5px] leading-normal tracking-[.08em] text-ink opacity-0 shadow-(--tip-shadow) transition-[opacity,translate] duration-250 group-hover/cert:translate-y-0 group-hover/cert:opacity-100 group-focus-visible/cert:translate-y-0 group-focus-visible/cert:opacity-100"
              >
                {c.label}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
