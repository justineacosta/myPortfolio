import Image from 'next/image'
import { ImageIcon } from '@phosphor-icons/react/ssr'
import { isPlaceholder } from '@/lib/placeholder'

type Props = { src: string; hint: string; alt?: string; sizes?: string }

/**
 * A screenshot, or Kraft's empty image slot while `src` is a PLACEHOLDER
 * (image-slot.js): a dashed frame with an image glyph and the slot's hint.
 * Fills its positioned parent.
 */
export default function Shot({ src, hint, alt = '', sizes = '50vw' }: Props) {
  if (!isPlaceholder(src)) return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover object-top" />
  return (
    <span className="absolute inset-1.5 grid place-content-center justify-items-center gap-1.5 rounded-[9px] border border-dashed border-b2 p-2 text-center text-ink3">
      <ImageIcon size={20} aria-hidden />
      <span className="text-[11px] font-medium">{hint}</span>
    </span>
  )
}
