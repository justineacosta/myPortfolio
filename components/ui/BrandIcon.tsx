import { brandSprite } from '@/data/stack'

type Props = { slug: string; size: number; alt?: string; className?: string }

/**
 * A tool's logo, drawn from the one sprite scripts/brand-icons.mjs writes
 * (public/icons/brands.svg), so a page with twenty logos makes one request.
 * Decorative unless given an `alt`. Focus traps must look for `a[href]`, not
 * `[href]`, or they will count the <use> as a tab stop.
 */
export default function BrandIcon({ slug, size, alt = '', className }: Props) {
  const label = alt ? ({ role: 'img', 'aria-label': alt } as const) : ({ 'aria-hidden': true } as const)
  return (
    <svg data-brand={slug} width={size} height={size} className={className} {...label}>
      <use href={brandSprite(slug)} />
    </svg>
  )
}
