import { Fragment } from 'react'
import { navForPath } from '@/data/nav'

type Props = { href: string; title: readonly string[]; lede: string; ledeClassName?: string; className?: string }

/**
 * Kraft's page header (KraftScreens.dc.html:211-215): the page's crumb as
 * the eyebrow, the <h1> broken where Kraft breaks it, and the lede. The lines
 * are block spans joined by a space, so the heading reads as one sentence.
 */
export default function PageHeader({
  href,
  title,
  lede,
  ledeClassName = 'max-w-[580px]',
  className = 'max-w-[960px]',
}: Props) {
  return (
    <header className={`pt-[clamp(4px,1.2cqw,16px)] ${className}`}>
      <p className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">{navForPath(href).eyebrow}</p>
      <h1 className="text-[clamp(28px,4.6cqw,54px)] leading-[1.03] font-bold tracking-[-.035em]">
        {title.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && ' '}
            <span className="block">{line}</span>
          </Fragment>
        ))}
      </h1>
      <p className={`mt-4 text-[clamp(13.5px,1.4cqw,17px)] leading-[1.55] text-ink2 ${ledeClassName}`}>{lede}</p>
    </header>
  )
}
