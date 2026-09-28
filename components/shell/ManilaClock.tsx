'use client'

import { useSyncExternalStore } from 'react'
import { profile } from '@/data/profile'

const fmt = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: profile.timezone,
})

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 20_000)
  return () => window.clearInterval(id)
}

/** Kraft's live GMT+8 clock (Kraft Portfolio.dc.html:657-661). */
export default function ManilaClock() {
  const time = useSyncExternalStore(subscribe, () => fmt.format(new Date()), () => '--:--')
  return <time suppressHydrationWarning>{time}</time>
}
