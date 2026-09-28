import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import AccessMenu from '@/components/shell/AccessMenu'
import LegalLinks from '@/components/shell/LegalLinks'
import ThemeButton from '@/components/shell/ThemeButton'
import { profile } from '@/data/profile'

/**
 * The shell for the standalone pages (spec §9): the Kraft mark home, the
 * theme and access buttons, a document-scrolling page and the legal links.
 * It has no sidebar and no intro.
 */
export default function PlainShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#plain-main" className="skip-link">
        Skip to main content
      </a>
      <header className="mx-auto flex w-full max-w-[880px] items-center gap-2.5 px-4 py-5">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Image src="/assets/kraft-mark.svg" alt="" width={26} height={26} className="block rounded-lg border border-b1" />
          <span className="text-sm font-bold tracking-[.16em]">{profile.brand}</span>
        </Link>
        <div className="ml-auto flex gap-2">
          <ThemeButton />
          <AccessMenu />
        </div>
      </header>
      <main id="plain-main" data-plain-main data-a11y-scale tabIndex={-1} className="mx-auto w-full max-w-[880px] flex-1 px-4 pb-16 outline-none">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-[880px] flex-wrap items-center gap-x-4 gap-y-2 border-t border-b1 px-4 py-6">
        <span className="font-mono text-[9.5px] tracking-[.06em] text-ink4">{profile.copyright}</span>
        <LegalLinks className="ml-auto" />
      </footer>
    </div>
  )
}
