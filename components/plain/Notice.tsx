import Link from 'next/link'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'

type Way = { href: string; label: string }
type Props = { kicker: string; title: string; body: string; primary: Way; secondary: Way }

/** A short standalone message (Thank-you, 404): kicker, heading, one line, and two ways on. */
export default function Notice({ kicker, title, body, primary, secondary }: Props) {
  return (
    <section className="flex min-h-[60dvh] flex-col items-start justify-center gap-4 pt-6">
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
        <Link
          href={secondary.href}
          className="flex min-h-12 items-center rounded-[13px] border border-b2 bg-s2 px-[22px] py-[13px] text-sm font-medium text-ink transition-colors duration-250 hover:border-accent"
        >
          {secondary.label}
        </Link>
      </div>
    </section>
  )
}
