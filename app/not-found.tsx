import Notice from '@/components/plain/Notice'
import PlainShell from '@/components/plain/PlainShell'
import { legal } from '@/data/legal'

/** The styled 404 (spec §9), in the plain shell. Next.js marks it noindex and answers 404. */
export default function NotFound() {
  const n = legal.notFound
  return (
    <PlainShell>
      <Notice kicker={n.kicker} title={n.title} body={n.body} primary={{ href: '/', label: n.home }} secondary={{ href: '/contact', label: n.contact }} />
    </PlainShell>
  )
}
