import { notFound } from 'next/navigation'
import { isHidden } from '@/data/nav'

/** A page calls this first: switched off in data/nav.ts, it answers with the 404. */
export function notFoundIfHidden(href: string) {
  if (isHidden(href)) notFound()
}
