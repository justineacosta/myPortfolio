import type { ComponentProps } from 'react'
import type { MDXComponents } from 'mdx/types'
import { ShellLink } from '@/components/shell/NavigationProvider'
import { isHidden } from '@/data/nav'

/**
 * How the guides in content/notes render (spec 2026-10-13-notes): Markdown's
 * plain elements in Kraft's type and colour, the scale of the case study
 * view, so no typography plugin is needed. A link inside the site runs
 * through the shell's crossfade (or is plain text while its page is switched
 * off); one to another site opens in a new tab.
 */
const PROSE = 'text-[15px] leading-[1.65] text-ink2'
const LINK = 'text-ink underline decoration-b2 underline-offset-[3px] transition-colors hover:decoration-accent'

function A({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (href.startsWith('/') || href.startsWith('#')) {
    // A page switched off in data/nav.ts loses every link to it: the words stay, the link goes.
    if (isHidden(href)) return <>{children}</>
    return (
      <ShellLink href={href} className={LINK}>
        {children}
      </ShellLink>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK} {...rest}>
      {children}
    </a>
  )
}

export const components: MDXComponents = {
  h2: (p) => <h2 className="mt-4 text-[clamp(18px,1.8cqw,21px)] font-semibold tracking-[-.025em] text-ink" {...p} />,
  h3: (p) => <h3 className="mt-2 text-[16px] font-semibold tracking-[-.02em] text-ink" {...p} />,
  p: (p) => <p className={PROSE} {...p} />,
  ul: (p) => <ul className={`${PROSE} flex list-disc flex-col gap-1.5 pl-5 marker:text-accent`} {...p} />,
  ol: (p) => <ol className={`${PROSE} flex list-decimal flex-col gap-1.5 pl-5 marker:text-accent`} {...p} />,
  li: (p) => <li className="pl-1" {...p} />,
  strong: (p) => <strong className="font-semibold text-ink" {...p} />,
  blockquote: (p) => <blockquote className={`${PROSE} border-l-2 border-accent pl-4 italic`} {...p} />,
  a: A,
}

export function useMDXComponents(): MDXComponents {
  return components
}
