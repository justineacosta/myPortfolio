'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ArrowsSplitIcon, WebhooksLogoIcon } from '@phosphor-icons/react/ssr'
import { automations, mainRoute, PLATFORMS, type Flow, type FlowNode } from '@/data/automations'
import { brandIcon } from '@/data/stack'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import type { ToolId } from '@/lib/brand/tools'

/** How long each flow shows before the next fades in. */
export const PEEK_MS = 4500

/** Each tool's logo in public/icons/brands/, for the chips. */
export const PEEK_SLUG: Partial<Record<ToolId, string>> = {
  n8n: 'n8n', claude: 'claude', telegram: 'telegram', gmail: 'gmail', hubspot: 'hubspot',
  'google-sheets': 'googlesheets', 'cal-com': 'caldotcom', airtable: 'airtable', make: 'make', zapier: 'zapier',
}

/** n8n's square nodes, Make's round modules, Zapier's numbered steps. */
const SHAPE = { n8n: 'rounded-[10px]', make: 'rounded-full', zapier: 'rounded-[10px]' } as const

function Chip({ node, flow, n }: { node: FlowNode; flow: Flow; n: number }) {
  const tool = node.tools[0]
  return (
    <span data-chip className={`relative grid size-[clamp(20px,12cqw,36px)] shrink-0 place-items-center bg-logo-chip shadow-(--logo-shadow) ${SHAPE[flow.platform]}`}>
      {tool ? (
        <Image src={brandIcon(PEEK_SLUG[tool]!)} alt="" width={18} height={18} className="block size-1/2" />
      ) : node.kind === 'branch' ? (
        <ArrowsSplitIcon className="size-1/2 text-logo-ink" />
      ) : (
        <WebhooksLogoIcon className="size-1/2 text-logo-ink" />
      )}
      {flow.platform === 'zapier' && (
        <span data-step className="absolute -top-1.5 -left-1.5 grid size-4 place-items-center rounded-full bg-accent font-mono text-[9px] text-on-accent">
          {n}
        </span>
      )}
    </span>
  )
}

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
      {flows.map((f, i) => {
        const route = mainRoute(f).map((id) => f.nodes.find((n) => n.id === id)!)
        return (
          <div key={f.code} data-flow={f.code} data-on={i === shown} className="absolute inset-0 flex flex-col justify-center gap-4 px-4 opacity-0 transition-opacity duration-700 data-[on=true]:opacity-100 motion-reduce:transition-none">
            <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
              <span className="uppercase">{f.site}</span> · {PLATFORMS[f.platform].name}
            </span>
            <div className="flex items-center">
              {route.map((n, k) => (
                <Fragment key={n.id}>
                  {k > 0 && (
                    <span className={`fp-wire relative min-w-0.5 flex-1 ${f.platform === 'make' ? 'border-t-2 border-dotted border-b2' : 'h-px bg-b2'}`}>
                      <span className="fp-pulse" style={{ animationDelay: `${k * 0.35}s` }} />
                    </span>
                  )}
                  <Chip node={n} flow={f} n={k + 1} />
                </Fragment>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
