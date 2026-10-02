'use client'

import { useEffect, useRef, useState } from 'react'
import FlowStrip from '@/components/projects/FlowStrip'
import { automations, PLATFORMS } from '@/data/automations'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export { PEEK_SLUG } from '@/components/projects/FlowStrip'

/** How long each flow shows before the next fades in. */
export const PEEK_MS = 4500

/**
 * The Automations card's canvas (plan 2026-10-01-automations-flows §0.4):
 * each flow's main route as a row of logo chips, fading to the next flow
 * every 4.5 s while a pulse runs along the wires (app/globals.css, "Automations
 * card canvas"). It holds while the pointer is on the card, while it is off
 * screen and while the tab is hidden; under reduced motion it stays on the
 * first flow. Decorative: the card's link already says what is inside.
 */
export default function FlowPeek() {
  const flows = automations.flows
  const still = useReducedMotion()
  const [at, setAt] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = box.current
    if (!el || still) return
    let seen = true
    let held = false
    const card = el.closest('a') ?? el
    const hold = () => (held = true)
    const free = () => (held = false)
    card.addEventListener('pointerenter', hold)
    card.addEventListener('pointerleave', free)
    let io: IntersectionObserver | undefined
    if (typeof IntersectionObserver === 'undefined') el.setAttribute('data-seen', '')
    else {
      io = new IntersectionObserver(([e]) => {
        seen = e.isIntersecting
        el.toggleAttribute('data-seen', seen)
      })
      io.observe(el)
    }
    const timer = window.setInterval(() => {
      if (seen && !held && !document.hidden) setAt((i) => (i + 1) % flows.length)
    }, PEEK_MS)
    return () => {
      window.clearInterval(timer)
      io?.disconnect()
      el.removeAttribute('data-seen')
      card.removeEventListener('pointerenter', hold)
      card.removeEventListener('pointerleave', free)
    }
  }, [still, flows.length])
  const shown = still ? 0 : at
  return (
    <div ref={box} aria-hidden data-flow-peek className="flow-peek @container relative mt-1.5 h-[clamp(130px,15cqw,180px)] overflow-hidden rounded-[14px] border border-b1 bg-s0">
      {flows.map((f, i) => (
        <div key={f.code} data-flow={f.code} data-on={i === shown} className="absolute inset-0 flex flex-col justify-center gap-4 px-4 opacity-0 transition-opacity duration-700 data-[on=true]:opacity-100 motion-reduce:transition-none">
          <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
            <span className="uppercase">{f.site}</span> · {PLATFORMS[f.platform].name}
          </span>
          <FlowStrip flow={f} />
        </div>
      ))}
    </div>
  )
}
