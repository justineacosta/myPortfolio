'use client'

import Image from 'next/image'
import { MagnifyingGlassIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { usePalette } from '@/components/shell/CommandPalette'
import AccessMenu from '@/components/shell/AccessMenu'
import ManilaClock from '@/components/shell/ManilaClock'
import ThemeButton from '@/components/shell/ThemeButton'
import { profile } from '@/data/profile'

/** Home on a phone opens with the sidebar's identity laid flat (Kraft Portfolio.dc.html:297-307, spec §7). */
export default function HomeProfile() {
  const { openPalette } = usePalette()
  return (
    <div data-home-profile data-intro-hold className="flex items-center gap-[11px] border-b border-b1 pb-3 shell:hidden">
      <Image
        src={profile.portrait.src}
        alt={profile.portrait.alt}
        width={40}
        height={40}
        className="size-10 rounded-full border border-b2 object-cover"
        style={{ objectPosition: profile.portrait.position }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[14.5px] font-semibold">{profile.name}</span>
          <SealCheckIcon weight="fill" size={15} role="img" aria-label={profile.verifiedLabel} className="text-accent" />
        </div>
        <span className="truncate font-mono text-[9px] tracking-[.05em] text-ink3">
          {profile.phoneHandle} · {profile.tzLabel} · <ManilaClock />
        </span>
      </div>
      <ThemeButton size={40} className="ml-auto" />
      <AccessMenu size={40} />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl border border-b1 bg-s2 text-ink2"
      >
        <MagnifyingGlassIcon size={15} aria-hidden />
      </button>
    </div>
  )
}
