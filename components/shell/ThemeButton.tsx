'use client'

import { MoonStarsIcon, SunIcon } from '@phosphor-icons/react/ssr'
import { toggleTheme } from '@/lib/theme'

/**
 * Kraft's theme button. The icon is chosen by CSS from <html data-theme>
 * (sun in dark, moon-stars in light), so it is right on the first paint and
 * needs no state or hydration guard.
 */
export default function ThemeButton({ size = 38, className = '' }: { size?: 38 | 40; className?: string }) {
  const box = size === 40 ? 'size-10 rounded-xl' : 'size-[38px] rounded-[11px]'
  const icon = size === 40 ? 16 : 17
  return (
    <button
      type="button"
      aria-label="Toggle dark and light mode"
      onClick={(e) => toggleTheme(e.currentTarget)}
      className={`grid shrink-0 cursor-pointer place-items-center border border-wash-b bg-wash text-accent transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-12px_var(--glow)] ${box} ${className}`}
    >
      <SunIcon size={icon} aria-hidden className="light:hidden" />
      <MoonStarsIcon size={icon} aria-hidden className="hidden light:block" />
    </button>
  )
}
