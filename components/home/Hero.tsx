import { Fragment } from 'react'
import { ArrowRightIcon } from '@phosphor-icons/react/ssr'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { home } from '@/data/home'
import { isHidden, navForPath } from '@/data/nav'

/**
 * Kraft's Home header (KraftScreens.dc.html:49-58). The <h1> is the intro's
 * landing target: it shrink-wraps its longest line (w-fit) so the flying copy
 * can match its measure, and none of its ancestors are held back by the intro,
 * because a fading parent would show through at the swap.
 */
export default function Hero() {
  return (
    <header className="max-w-[940px] pt-[clamp(4px,1.2cqw,16px)]">
      <p data-intro-hold className="mb-3.5 font-mono text-[10.5px] tracking-[.18em] text-accent">
        {navForPath('/').eyebrow}
      </p>
      <h1
        data-intro-target
        className="w-fit max-w-full text-[clamp(30px,5.4cqw,62px)] leading-[1.02] font-bold tracking-[-.035em]"
      >
        {home.headline.map((line, i) => (
          <Fragment key={line}>
            {i > 0 && ' '}
            <span className="block">{line}</span>
          </Fragment>
        ))}
      </h1>
      <p
        data-intro-hold
        data-intro-delay="60"
        className="mt-4 max-w-[882px] text-[clamp(13.5px,1.5cqw,18px)] leading-[1.55] text-ink2"
      >
        {home.lede}
      </p>
      <div data-intro-hold data-intro-delay="100" className="mt-[22px] flex flex-wrap gap-2.5">
        {!isHidden(home.primary.href) && (
          <ShellLink
            href={home.primary.href}
            className="flex min-h-[46px] items-center gap-2 rounded-[13px] bg-accent px-5 py-3 text-sm font-semibold text-on-accent transition-[translate,scale,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_var(--glow)] active:scale-[.988]"
          >
            {home.primary.label} <ArrowRightIcon size={16} aria-hidden />
          </ShellLink>
        )}
        {!isHidden(home.secondary.href) && (
          <ShellLink
            href={home.secondary.href}
            className="flex min-h-[46px] items-center gap-2 rounded-[13px] border border-b2 px-5 py-3 text-sm font-medium text-ink transition-[translate,scale,background-color] duration-300 hover:-translate-y-0.5 hover:bg-hover active:scale-[.988]"
          >
            {home.secondary.label}
          </ShellLink>
        )}
      </div>
    </header>
  )
}
