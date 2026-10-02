import { ArrowSquareOutIcon } from '@phosphor-icons/react/ssr'

/** The Showcase's main button: opens the business's sample site in a new tab. */
export default function Cta({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 flex min-h-12 items-center gap-2 rounded-[13px] bg-accent px-[22px] py-[13px] text-sm font-semibold text-on-accent transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-14px_var(--glow)]"
    >
      {label} <ArrowSquareOutIcon size={16} aria-hidden />
    </a>
  )
}
