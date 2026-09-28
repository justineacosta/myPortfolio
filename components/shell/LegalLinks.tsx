import Link from 'next/link'
import { legalLinks } from '@/data/legal'
import { shellCopy } from '@/data/nav'

/** Privacy and Terms, for the sidebar's foot, the end of a phone page, and the plain pages' footer. */
export default function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <nav aria-label={shellCopy.legalNav} className={`flex gap-3 font-mono text-[9.5px] tracking-[.06em] ${className}`}>
      {legalLinks.map((l) => (
        <Link key={l.href} href={l.href} className="text-ink3 transition-colors duration-250 hover:text-accent">
          {l.label}
        </Link>
      ))}
    </nav>
  )
}
