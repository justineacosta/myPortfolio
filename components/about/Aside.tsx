import Image from 'next/image'
import { MapPinIcon } from '@phosphor-icons/react/ssr'
import { ICON_TILE } from '@/components/ui/styles'
import { about } from '@/data/about'

/** The workstation GIF and its caption (KraftScreens.dc.html:430-436). */
export function Workstation() {
  const img = about.image
  return (
    <figure className="m-0 overflow-hidden rounded-[20px] border border-b1 bg-frame">
      <Image src={img.src} alt={img.alt} width={img.width} height={img.height} unoptimized className="block h-auto w-full" />
      <figcaption className="flex items-center gap-[9px] border-t border-b1 px-4 py-[13px]">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-[.1em] text-ink3">{img.caption}</span>
      </figcaption>
    </figure>
  )
}

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
