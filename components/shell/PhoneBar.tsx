'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon, SealCheckIcon } from '@phosphor-icons/react/ssr'
import { profile } from '@/data/profile'
import { nextBarShown } from '@/lib/phoneBar'
import AccessMenu from './AccessMenu'
import { usePalette } from './CommandPalette'
import ManilaClock from './ManilaClock'
import ThemeButton from './ThemeButton'

/**
 * Below 1100px, where there is no sidebar, every page opens under the
 * sidebar's identity laid flat (Kraft Portfolio.dc.html:297-307, spec §7):
 * portrait, name, handle and clock, with theme, access and search. It slides
 * away as the page scrolls down and comes back as it scrolls up
 * (lib/phoneBar.ts), and stays while one of its buttons has focus.
 */
export default function PhoneBar() {
  const { openPalette } = usePalette()
  const ref = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const bar = ref.current
    if (!bar) return
    let shown = true
    let from = window.scrollY
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      const next = bar.contains(document.activeElement) || nextBarShown(shown, from, y, bar.offsetHeight)
      // `from` is where the scroll last turned: it follows the page while the bar keeps its state.
      if (next !== shown || (shown ? y < from : y > from)) from = y
      shown = next
      setHidden(!shown)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onFocus = () => {
      shown = true
      from = window.scrollY
      setHidden(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    bar.addEventListener('focusin', onFocus)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      bar.removeEventListener('focusin', onFocus)
    }
  }, [])

  return (
    <div
      ref={ref}
      data-phone-bar
      data-hidden={hidden || undefined}
      data-intro-hold
      className="fixed inset-x-0 top-0 z-30 flex items-center gap-[11px] border-b border-b1 bg-frame px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 transition-transform duration-300 ease-out data-hidden:-translate-y-full shell:hidden"
    >
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
