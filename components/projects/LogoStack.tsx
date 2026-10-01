import Image from 'next/image'
import type { Brand } from '@/data/stack'
import { brandIcon } from '@/data/stack'

/**
 * A board card's tools, as Kraft's logo stack (components/home/ServicesCard.tsx):
 * cream chips overlapped at rest, fanned while the card (group/card) is hovered,
 * and still under reduced motion. Decorative: the card's link names it.
 */
const SIZE = {
  lg: { chip: 'size-[34px] rounded-[11px]', logo: 19, overlap: '-ml-[7px]' },
  sm: { chip: 'size-[27px] rounded-[9px]', logo: 15, overlap: '-ml-[6px]' },
}
const POSE = [
  'z-3 motion-safe:group-hover/card:[transform:translateY(-3px)_rotate(-8deg)]',
  'z-2 delay-45 motion-safe:group-hover/card:ml-[3px] motion-safe:group-hover/card:[transform:translateY(-3px)]',
  'z-1 delay-90 motion-safe:group-hover/card:ml-[3px] motion-safe:group-hover/card:[transform:translateY(-3px)_rotate(8deg)]',
]

export default function LogoStack({ logos, size = 'lg' }: { logos: Brand[]; size?: keyof typeof SIZE }) {
  const s = SIZE[size]
  return (
    <span data-logo-stack aria-hidden className="flex shrink-0 items-center self-start py-[3px]">
      {logos.map((l, i) => (
        <span
          key={l.slug}
          className={`relative grid shrink-0 place-items-center bg-logo-chip shadow-(--logo-shadow) transition-[transform,margin-left] duration-380 ease-[cubic-bezier(.2,.8,.2,1)] ${s.chip} ${i ? s.overlap : ''} ${POSE[Math.min(i, POSE.length - 1)]}`}
        >
          <Image src={brandIcon(l.slug)} alt="" width={s.logo} height={s.logo} className="block" />
        </span>
      ))}
    </span>
  )
}
