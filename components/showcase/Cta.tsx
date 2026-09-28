import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr'
import { isPlaceholder } from '@/lib/placeholder'

const LOOK = 'mt-1 flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent'

/**
 * The Flagship's call to action. Until its URL is real it keeps the button's
 * look but is not a link, so it can never jump to the top of the page, and it
 * tells screen readers the link is still to come.
 */
export default function Cta({ label, href, soon }: { label: string; href: string; soon: string }) {
  if (isPlaceholder(href)) {
    return (
      <span className={`${LOOK} cursor-default`}>
        {label} <ArrowSquareOutIcon size={16} aria-hidden />
        <span className="sr-only">, {soon}</span>
      </span>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${LOOK} transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]`}
    >
      {label} <ArrowSquareOutIcon size={16} aria-hidden />
    </a>
  )
}
