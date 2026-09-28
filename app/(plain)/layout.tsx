import type { ReactNode } from 'react'
import PlainShell from '@/components/plain/PlainShell'

/** Standalone pages: no sidebar, no intro, document scroll (spec §4, §9). */
export default function PlainLayout({ children }: { children: ReactNode }) {
  return <PlainShell>{children}</PlainShell>
}
