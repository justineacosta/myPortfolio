'use client'

import { Analytics } from '@vercel/analytics/next'
import { beforeSend } from '@/lib/analytics'

/** Vercel Web Analytics with lib/analytics.ts's filter, which the server layout can't hand over as a prop. */
export default function SiteAnalytics() {
  return <Analytics beforeSend={beforeSend} />
}
