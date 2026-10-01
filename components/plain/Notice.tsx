import Image from 'next/image'
import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'

type Way = { href: string; label: string }
type Art = { src: string; alt: string; width: number; height: number }
type Props = { kicker: string; title: string; body: string; primary: Way; secondary?: Way; art?: Art }

/**
 * A short standalone message (Thank-you, 404): kicker, heading, one line, and
 * one or two ways on. An `art` picture sits beside it, or above it on a phone;
 * the message comes first in reading order.
 */
export default function Notice({ kicker, title, body, primary, secondary, art }: Props) {
  return (
    <section className="flex min-h-[60dvh] flex-col-reverse items-start justify-center gap-7 pt-6 md:flex-row md:items-center md:justify-between md:gap-12">
      <div className="flex min-w-0 flex-col items-start gap-4">
        <p className="font-mono text-[10.5px] tracking-[.18em] text-accent">{kicker}</p>
        <h1 className="text-[clamp(32px,7vw,64px)] leading-[1.02] font-bold tracking-[-.035em]">{title}</h1>
        <p className="max-w-[52ch] text-[clamp(14px,1.6vw,17px)] leading-[1.6] text-ink2">{body}</p>
        <div className="mt-2 flex flex-wrap gap-2.5">
          <Link
            href={primary.href}
            className="flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]"
          >
            {primary.label} <ArrowRightIcon size={16} aria-hidden />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className="flex min-h-12 items-center rounded-[13px] border border-b2 bg-s2 px-[22px] py-[13px] text-sm font-medium text-ink transition-colors duration-250 hover:border-accent"
            >
              {secondary.label}
            </Link>
          )}
        </div>
      </div>
      {art && (
        <Image
          src={art.src}
          alt={art.alt}
          width={art.width}
          height={art.height}
          sizes="(min-width: 768px) 320px, 200px"
          className="h-auto w-[min(200px,55vw)] shrink-0 rounded-[22px] border border-b2 shadow-[0_28px_64px_-30px_var(--washB)] md:w-[clamp(220px,26vw,320px)]"
        />
      )}
    </section>
  )
}
