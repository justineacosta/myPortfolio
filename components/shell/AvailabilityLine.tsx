import { contact } from '@/data/contact'
import { profile } from '@/data/profile'

/** The pulsing dot, availability and timezone, then the regions covered (KraftScreens.dc.html:540-546). Contact and the sidebar share it. */
export default function AvailabilityLine({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-[9px] ${className}`}>
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
  )
}
