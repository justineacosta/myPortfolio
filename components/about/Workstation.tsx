'use client'

import { getImageProps } from 'next/image'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { about } from '@/data/about'

/**
 * The workstation GIF and its caption (KraftScreens.dc.html:430-436). A GIF
 * can't be paused, so reduced motion gets its first frame instead. The
 * <source> covers the OS setting from the first paint; the access menu's
 * switch swaps the <img> once the page is live.
 */
export default function Workstation() {
  const img = about.image
  const still = useReducedMotion()
  const common = { alt: img.alt, width: img.width, height: img.height, unoptimized: true }
  const { props: gif } = getImageProps({ ...common, src: img.src })
  const { props: frame } = getImageProps({ ...common, src: img.still })
  return (
    <figure className="m-0 overflow-hidden rounded-[20px] border border-b1 bg-frame">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet={frame.src} />
        <img {...(still ? frame : gif)} alt={img.alt} className="block h-auto w-full" />
      </picture>
      <figcaption className="flex items-center gap-[9px] border-t border-b1 px-4 py-[13px]">
        <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
        <span className="font-mono text-[10px] tracking-[.1em] text-ink3">{img.caption}</span>
      </figcaption>
    </figure>
  )
}
