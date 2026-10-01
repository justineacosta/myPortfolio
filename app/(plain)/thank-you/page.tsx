import type { Metadata } from 'next'
import Notice from '@/components/plain/Notice'
import { legal } from '@/data/legal'
import { isHidden } from '@/data/nav'
import { profile } from '@/data/profile'

/** For bookings and ads to land on, so it stays out of search. The contact form does not redirect here (spec §9). */
export const metadata: Metadata = { title: 'Thank you', robots: { index: false, follow: true } }

export default function Page() {
  const t = legal.thankYou
  return <Notice kicker={t.kicker} title={t.title} body={t.body} primary={{ href: '/', label: t.home }} secondary={isHidden('/projects') ? undefined : { href: '/projects', label: t.work }} art={profile.portrait.drawn} />
}
