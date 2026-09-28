import { MapPinIcon } from '@phosphor-icons/react/ssr'
import { ICON_TILE } from '@/components/ui/styles'
import { about } from '@/data/about'

/** Where Justine works from (KraftScreens.dc.html:449-455). */
export function Location() {
  return (
    <div className="flex min-w-[190px] flex-[1_1_210px] items-center gap-3 rounded-[18px] border border-b1 bg-linear-to-b from-s2 to-s1 px-[17px] py-[15px]">
      <span aria-hidden className={ICON_TILE}>
        <MapPinIcon size={18} />
      </span>
      <div className="flex flex-col gap-[3px]">
        <span className="text-[13px] font-semibold">{about.location.title}</span>
        <span className="font-mono text-[9.5px] tracking-[.06em] text-ink3">{about.location.detail}</span>
      </div>
    </div>
  )
}
