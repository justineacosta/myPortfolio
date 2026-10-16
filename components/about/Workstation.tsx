import LoopVideo from '@/components/ui/LoopVideo'
import { about } from '@/data/about'

/**
 * The workstation animation and its caption (KraftScreens.dc.html:430-436).
 * A looping video, not a GIF: about 30 KB instead of 378 KB, and it can be
 * stilled, so reduced motion gets its first frame (components/ui/LoopVideo.tsx).
 */
export default function Workstation() {
  const img = about.image
  return (
    <figure className="m-0 overflow-hidden rounded-[20px] border border-b1 bg-frame">
      <LoopVideo {...img} />
      <figcaption className="flex items-center gap-[9px] border-t border-b1 px-4 py-[13px]">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-[.1em] text-ink3">{img.caption}</span>
      </figcaption>
    </figure>
  )
}
