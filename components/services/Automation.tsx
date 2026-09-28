'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'
import Frame from '@/components/ui/Frame'
import { FLOWS, type Flow, type FlowEdge } from '@/data/flows'
import { servicesPage } from '@/data/services'
import { edgePath, FLOW_H, FLOW_W, LIFT, stepLift, wrap, type Lifts } from '@/lib/flow'
import { prefersReducedMotion } from '@/lib/motion'

/** Node colours by kind (KraftScreens.dc.html:1218-1229): outcome, dead end, step. */
const KIND = {
  on: { tile: 'border-accent bg-wash text-accent', name: 'text-accent' },
  off: { tile: 'border-danger-b bg-s2 text-danger', name: 'text-danger' },
  step: { tile: 'border-b2 bg-s2 text-ink', name: 'text-ink' },
} as const

const NAV =
  'grid size-8 cursor-pointer place-items-center rounded-[10px] border border-b1 bg-s2 text-[15px] text-ink2 transition-colors duration-250 hover:border-accent hover:text-accent'

/**
 * Kraft's live automation (KraftScreens.dc.html:276-323, 997-1033): one of
 * ten flows on a fixed 1180×430 canvas. Its frame scrolls sideways when the
 * page is narrower, and the arrows step through the flows. The title is a
 * live region, so a change of flow is announced.
 */
export default function Automation() {
  const a = servicesPage.automation
  const [index, setIndex] = useState(0)
  const flow = FLOWS[index]
  return (
    <section id={a.id} aria-labelledby="automation-title" className="scroll-mt-[88px] shell:scroll-mt-6">
      <Frame
        lit={{ x: '50%', y: '-20%', size: '100% 120%', alpha: 0.6, stop: '60%' }}
        className="flex flex-col gap-4 p-[clamp(14px,1.8cqw,24px)]"
      >
        <div aria-live="polite" className="flex flex-col items-center gap-[7px] text-center">
          <span className="font-mono text-[10px] tracking-[.18em] text-accent">{a.kicker}</span>
          <h2 id="automation-title" className="text-[clamp(19px,2.4cqw,28px)] font-bold tracking-[-.03em]">
            {flow.title}
          </h2>
          <p className="max-w-[520px] text-[13px] leading-[1.55] text-ink3">{flow.blurb}</p>
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {flow.tags.map((t) => (
              <span key={t} className="rounded-[9px] border border-b1 bg-chip px-[11px] py-1.5 font-mono text-[10px] tracking-[.06em] text-ink2">
                {t}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-hidden rounded-[18px] border border-b1 bg-frame">
          <div className="flex flex-wrap items-center gap-[9px] border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span aria-hidden className="size-[9px] rounded-full bg-dot" />
            <span className="ml-1.5 font-mono text-[10px] tracking-[.1em] text-ink2">{flow.label}</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent">
              <span aria-hidden className="size-1.5 animate-pulse-dot rounded-full bg-accent" />
              {a.live}
            </span>
            <div className="ml-auto flex items-center gap-[7px]">
              <button type="button" onClick={() => setIndex((i) => wrap(i - 1, FLOWS.length))} aria-label={a.prev} className={NAV}>
                <CaretLeftIcon aria-hidden />
              </button>
              <span className="min-w-[34px] text-center font-mono text-[10px] tracking-[.1em] text-ink3">
                {index + 1} / {FLOWS.length}
              </span>
              <button type="button" onClick={() => setIndex((i) => wrap(i + 1, FLOWS.length))} aria-label={a.next} className={NAV}>
                <CaretRightIcon aria-hidden />
              </button>
            </div>
          </div>
          <div
            role="region"
            aria-label={a.canvasLabel}
            tabIndex={0}
            className="overflow-x-auto overflow-y-hidden bg-[radial-gradient(60%_100%_at_50%_0,var(--wash),transparent_70%)] px-[18px] py-5"
          >
            <FlowCanvas key={index} flow={flow} />
          </div>
        </div>
      </Frame>
    </section>
  )
}

/**
 * One flow. Hovering a node lifts it (CSS) and eases its edges, and the dots
 * riding them, up with it (Kraft's rAF lift, …:1006-1033). With reduced
 * motion the edges move at once.
 */
function FlowCanvas({ flow }: { flow: Flow }) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const balls = useRef<(HTMLSpanElement | null)[]>([])
  const cur = useRef<Lifts>({})
  const tgt = useRef<Lifts>({})
  const raf = useRef(0)
  const riders = flow.edges.filter((e) => e.ball)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const draw = () => {
    const at = (e: FlowEdge) => edgePath(e, cur.current[e.f] ?? 0, cur.current[e.t] ?? 0)
    flow.edges.forEach((e, i) => paths.current[i]?.setAttribute('d', at(e)))
    riders.forEach((e, i) => balls.current[i]?.style.setProperty('offset-path', `path('${at(e)}')`))
  }

  const frame = () => {
    raf.current = 0
    const next = stepLift(cur.current, tgt.current)
    cur.current = next.cur
    draw()
    if (next.moving) raf.current = requestAnimationFrame(frame)
  }

  const lift = (i: number, up: boolean) => {
    tgt.current[i] = up ? LIFT : 0
    if (prefersReducedMotion()) {
      cur.current = { ...tgt.current }
      draw()
    } else if (!raf.current) {
      raf.current = requestAnimationFrame(frame)
    }
  }

  return (
    <div
      className="relative bg-[radial-gradient(circle,var(--b1)_1px,transparent_1px)] bg-size-[26px_26px]"
      style={{ width: FLOW_W, height: FLOW_H }}
    >
      <svg viewBox={`0 0 ${FLOW_W} ${FLOW_H}`} width={FLOW_W} height={FLOW_H} aria-hidden className="pointer-events-none absolute top-0 left-0">
        {flow.edges.map((e, i) => (
          <path
            key={`${e.f}-${e.t}-${i}`}
            ref={(el) => {
              paths.current[i] = el
            }}
            d={edgePath(e)}
            className={e.k ? `flow-edge flow-edge--${e.k}` : 'flow-edge'}
          />
        ))}
      </svg>
      {riders.map((e, i) => {
        const [secs, delay, opacity = 1] = e.ball!
        return (
          <span
            key={`${e.f}-${e.t}-${i}`}
            ref={(el) => {
              balls.current[i] = el
            }}
            aria-hidden
            className="flow-ball"
            style={{ offsetPath: `path('${edgePath(e)}')`, animationDuration: `${secs}s`, animationDelay: `${delay}s`, opacity } as CSSProperties}
          />
        )
      })}
      <span
        aria-hidden
        className="absolute -translate-1/2 font-mono text-[9.5px] tracking-[.12em] whitespace-nowrap text-accent"
        style={{ left: flow.note.x, top: flow.note.y }}
      >
        {flow.note.text}
      </span>
      <ol className="contents">
        {flow.nodes.map((n, i) => {
          const k = KIND[n.kind ?? 'step']
          return (
            <li key={n.name} className="absolute flex w-[124px] -translate-x-1/2 flex-col items-center gap-[9px]" style={{ left: n.x, top: n.y - 28 }}>
              <span
                aria-hidden
                onMouseEnter={() => lift(i, true)}
                onMouseLeave={() => lift(i, false)}
                className={`grid size-14 place-items-center rounded-[17px] border text-2xl transition-[translate,scale,box-shadow,border-color] duration-320 ease-[cubic-bezier(.2,.7,.2,1)] hover:-translate-y-1.5 hover:scale-107 hover:border-accent hover:shadow-[0_16px_34px_-12px_var(--glow),0_0_0_5px_var(--wash)] ${k.tile}`}
              >
                <n.icon />
              </span>
              <span className={`text-center text-xs leading-[1.25] font-semibold ${k.name}`}>{n.name}</span>
              <span className="text-center font-mono text-[9px] tracking-[.05em] text-ink3">{n.sub}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
