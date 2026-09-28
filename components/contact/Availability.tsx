import { LinkedinLogoIcon } from '@phosphor-icons/react/ssr'
import { contact } from '@/data/contact'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'

/** Availability and LinkedIn (KraftScreens.dc.html:540-549). A PLACEHOLDER profile link points at # and never opens a new tab. */
export default function Availability() {
  const linkedin = profile.socials.find((s) => s.label === 'LinkedIn')!
  const real = !isPlaceholder(linkedin.href)
  return (
    <div className="mt-auto flex flex-wrap items-center gap-3.5 pt-6">
      <div className="mr-auto flex items-center gap-[9px]">
        <span aria-hidden className="size-[7px] shrink-0 animate-pulse-dot rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[12.5px] text-ink2">
            {profile.availability.label} · {profile.tzLabel}
          </span>
          <span className="font-mono text-[9.5px] tracking-[.1em] text-ink3">
            {profile.availability.regions.join(' · ')} {contact.availability.hours}
          </span>
        </div>
      </div>
      <a
        href={real ? linkedin.href : '#'}
        {...(real ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        aria-label={contact.availability.linkedin}
        className="grid size-[46px] place-items-center rounded-full border border-b1 bg-s0 text-ink2 transition-[color,border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-b2 hover:text-accent"
      >
        <LinkedinLogoIcon size={19} aria-hidden />
      </a>
    </div>
  )
}
