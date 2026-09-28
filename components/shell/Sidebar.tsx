'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRightIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { isActivePath, NAV } from '@/data/nav'
import { profile } from '@/data/profile'
import { isPlaceholder } from '@/lib/placeholder'
import ManilaClock from './ManilaClock'
import MagnetLink from './MagnetLink'
import { ShellLink } from './NavigationProvider'
import ThemeButton from './ThemeButton'

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      aria-label="Profile and site navigation"
      data-intro-rail
      className="hidden w-(--rail) shrink-0 flex-col gap-[18px] overflow-y-auto border-r border-b1 bg-linear-to-b from-s1 to-bg px-4 pt-5 pb-4 shell:flex"
    >
      <div className="flex items-center gap-2.5">
        <Image src="/assets/kraft-mark.svg" alt="" width={26} height={26} className="block rounded-lg border border-b1" />
        <span className="text-sm font-bold tracking-[.16em]">{profile.brand}</span>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <div className="relative flex size-[120px] items-center justify-center">
          <div
            aria-hidden
            className="absolute -inset-4 rounded-full bg-[radial-gradient(circle_at_50%_32%,var(--washB),transparent_68%)]"
          />
          <Image
            src={profile.portrait.src}
            alt={profile.portrait.alt}
            width={114}
            height={114}
            priority
            className="relative size-[114px] rounded-full border border-b2 object-cover"
            style={{ objectPosition: profile.portrait.position }}
          />
        </div>
        <div className="flex items-center gap-[7px]">
          <span className="text-[16.5px] font-semibold tracking-[-.015em]">{profile.name}</span>
          <SealCheckIcon weight="fill" size={17} role="img" aria-label={profile.verifiedLabel} className="text-accent" />
        </div>
        <div className="text-center font-mono text-[10px] leading-[1.5] tracking-[.04em] text-ink3">
          {profile.handleLines[0]}
          <br />
          {profile.handleLines[1]}
        </div>
        <div className="mt-0.5 flex flex-wrap justify-center gap-2">
          {profile.socials.map((s) => {
            const Icon = s.icon
            const real = !isPlaceholder(s.href)
            return (
              <a
                key={s.label}
                href={real ? s.href : '#'}
                aria-label={s.label}
                {...(real ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="grid size-[38px] place-items-center rounded-[11px] border border-b1 bg-s2 text-ink2 transition-all duration-250 hover:-translate-y-0.5 hover:border-b2 hover:text-accent"
              >
                <Icon size={17} aria-hidden />
              </a>
            )
          })}
          <ThemeButton />
        </div>
      </div>

      <div className="h-px bg-b1" />

      <nav aria-label="Sections" className="flex flex-col gap-[3px]">
        {NAV.map((item, i) => {
          const active = isActivePath(pathname, item.href)
          const Icon = item.icon
          return (
            <ShellLink
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className="relative flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-[11px] text-left transition-colors duration-250 hover:bg-hover"
            >
              {active && (
                <>
                  <span aria-hidden className="absolute inset-0 rounded-xl border border-wash-b bg-linear-to-r from-wash to-transparent" />
                  <span aria-hidden className="absolute top-2.5 bottom-2.5 -left-4 w-[3px] rounded-r-[3px] bg-accent shadow-[0_0_14px_var(--glow)]" />
                </>
              )}
              <span aria-hidden className="relative grid size-[22px] place-items-center rounded-[7px] border border-b1 bg-s3">
                <Icon size={14} className={active ? 'text-accent' : 'text-ink3'} />
              </span>
              <span className="relative text-sm font-medium tracking-[-.01em] text-ink-soft">{item.label}</span>
              <span className="relative ml-auto font-mono text-[9.5px] text-ink3">{String(i + 1).padStart(2, '0')}</span>
            </ShellLink>
          )
        })}
      </nav>

      <div className="min-h-3 flex-1" />

      <div className="flex flex-col gap-[7px] rounded-[14px] border border-b1 bg-linear-to-b from-s2 to-s1 px-3.5 py-[13px]">
        <div className="flex items-center gap-2">
          <span aria-hidden className="size-[7px] animate-pulse-dot rounded-full bg-accent shadow-[0_0_10px_var(--accent)]" />
          <span className="text-[12.5px] font-medium">{profile.availability.label}</span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-[5px]">
          {profile.availability.regions.map((r) => (
            <span key={r} className="rounded-[7px] border border-wash-b bg-wash px-[7px] py-[3px] font-mono text-[9px] tracking-[.1em] text-accent">
              {r}
            </span>
          ))}
          <span className="self-center font-mono text-[9px] tracking-[.06em] text-ink3">TIMEZONES</span>
          <span className="font-mono text-[10px] tracking-[.06em] text-ink3">
            {profile.tzLabel} · <ManilaClock /> LOCAL
          </span>
        </div>
      </div>

      <MagnetLink
        href="/contact"
        className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-[13px] bg-accent p-[13px] text-[13.5px] font-semibold text-on-accent transition-[transform,box-shadow] duration-250 hover:shadow-[0_12px_32px_-12px_var(--glow)]"
      >
        Start a project <ArrowRightIcon size={16} aria-hidden />
      </MagnetLink>

      <span className="font-mono text-[9px] tracking-[.06em] text-ink4">{profile.copyright}</span>
    </aside>
  )
}
