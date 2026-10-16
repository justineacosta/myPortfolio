'use client'

import Link from 'next/link'
import { useState, type ComponentProps } from 'react'

/**
 * A next/link that prefetches on intent (pointer over it, or keyboard focus),
 * not on sight: every visible link prefetching on every page load was most of
 * the site's edge requests. Next's own pattern (docs: guides/prefetching,
 * "Hover-triggered prefetch"); a click with no intent shown fetches then.
 */
export default function IntentLink({ onPointerEnter, onFocus, ...rest }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false)
  return (
    <Link
      prefetch={intent ? null : false}
      {...rest}
      onPointerEnter={(e) => {
        onPointerEnter?.(e)
        setIntent(true)
      }}
      onFocus={(e) => {
        onFocus?.(e)
        setIntent(true)
      }}
    />
  )
}
