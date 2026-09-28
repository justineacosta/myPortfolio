'use client'

import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/ssr'
import AccessMenu from './AccessMenu'
import { usePalette } from './CommandPalette'
import ThemeButton from './ThemeButton'

/** Theme, accessibility and ⌘K on phones, floating top-right, except on Home, whose profile header carries them (spec §7). */
export default function PhoneControls() {
  const { openPalette } = usePalette()
  const pathname = usePathname()
  if (pathname === '/') return null
  return (
    <div className="fixed top-[max(12px,env(safe-area-inset-top))] right-3.5 z-30 flex gap-2 shell:hidden">
      <ThemeButton size={40} />
      <AccessMenu size={40} />
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command palette"
        className="grid size-10 cursor-pointer place-items-center rounded-xl border border-b1 bg-s2 text-ink2"
      >
        <MagnifyingGlassIcon size={15} aria-hidden />
      </button>
    </div>
  )
}
