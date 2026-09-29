'use client'

import { useEffect, useRef, useState } from 'react'
import Frame from '@/components/ui/Frame'
import { TAG } from '@/components/ui/styles'
import { PROCESS, servicesPage } from '@/data/services'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { easeInOutCubic, easeInOutSine } from '@/lib/intro'
import { cardHalves, gateLook, METHOD, methodAt, methodFade, methodPlan } from '@/lib/method'

const GATES = PROCESS.length
const PLAN = methodPlan(GATES)
const RADIUS = 20
const SVG_NS = 'http://www.w3.org/2000/svg'

type Stroke = { path: SVGPathElement; len: number }

/** A path on the wire layer, dashed to its own length so its dashoffset draws it in. */
function stroke(svg: SVGSVGElement, d: string, cls: string, at?: { x: number; y: number }): Stroke {
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', d)
  path.setAttribute('class', cls)
  if (at) path.setAttribute('transform', `translate(${at.x} ${at.y})`)
  svg.append(path)
  const len = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0
  path.style.strokeDasharray = `${len}`
  path.style.strokeDashoffset = `${len}`
  return { path, len }
}

/**
 * The Kraft Method (KraftScreens.dc.html:217-241, 989-995, 1112-1125): five
 * gates, answered in order, run like the loader's steps (lib/method.ts). The
 * first time the section is on screen the first icon bursts, the light splits
 * round the card, over the top and under the bottom, and where its halves
 * meet the card locks and its icon fills. Then one dot runs the line across
 * the gap to the next card. The light passes: each traced border and line
 * fades once it is behind it, and a locked card keeps only its filled icon.
 * Below the sidebar breakpoint the cards stack, and the light runs down
 * instead: it splits at each card's top middle and meets at its bottom.
 * The clock only runs while the section is on screen and no card is under
 * the pointer or focus; that card lights, and the light carries on from the
 * same spot when it is let go. With reduced motion (the OS setting or the
 * access menu, followed live) the run is over: every gate is locked.
 * The header shows the kicker and the description; the five step names head
 * the section for screen readers.
 */
export default function Method() {
  const m = servicesPage.method
  const still = useReducedMotion()
  const [run, setRun] = useState({ locked: 0, tracing: 0 as number | null })
  const [focus, setFocus] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const elapsed = useRef(0)
  const held = useRef(false)
  const wake = useRef<() => void>(() => {})
  const at = still ? { locked: GATES, tracing: null } : run

  useEffect(() => {
    held.current = focus !== null
    if (!held.current) wake.current()
  }, [focus])

  useEffect(() => {
    const section = ref.current
    const stage = stageRef.current
    const svg = stage?.querySelector<SVGSVGElement>('.method-wire')
    if (!section || !stage || !svg) return
    // Motion switched off ends the run for good.
    if (still) elapsed.current = Infinity
    const gates = Array.from(stage.querySelectorAll<HTMLElement>('[data-gate]'))
    const sparks = Array.from(stage.querySelectorAll<HTMLElement>('.method-spark'))
    const dot = stage.querySelector<HTMLElement>('.method-dot')!
    const burst = stage.querySelector<HTMLElement>('.method-burst')!
    let rings: { at: { x: number; y: number }; halves: Stroke[] }[] = []
    let lines: Stroke[] = []

    // The wire, from where the cards sit now: a row across, or a stack down.
    const lay = () => {
      // Measured to the fraction of a pixel (offsets round, and a 1px border shows it),
      // then out of any zoom the access menu's text size puts on the page.
      const s = stage.getBoundingClientRect()
      const k = stage.offsetWidth ? s.width / stage.offsetWidth : 1
      const boxes = gates.map((g) => {
        const r = g.querySelector<HTMLElement>('.method-step')!.getBoundingClientRect()
        return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k }
      })
      const axis = boxes.length > 1 && boxes[1].y > boxes[0].y ? 'y' : 'x'
      svg.setAttribute('width', String(stage.offsetWidth))
      svg.setAttribute('height', String(stage.offsetHeight))
      svg.replaceChildren()
      lines = boxes.slice(1).map((b, k) => {
        const a = boxes[k]
        const d =
          axis === 'x'
            ? `M ${a.x + a.w} ${a.y + a.h / 2} L ${b.x} ${b.y + b.h / 2}`
            : `M ${a.x + a.w / 2} ${a.y + a.h} L ${b.x + b.w / 2} ${b.y}`
        // A grey track under the line the dot draws in.
        const track = document.createElementNS(SVG_NS, 'path')
        track.setAttribute('d', d)
        track.setAttribute('class', 'method-track')
        svg.append(track)
        return stroke(svg, d, 'method-line')
      })
      rings = boxes.map((b) => {
        const h = cardHalves(b.w, b.h, RADIUS, axis)
        return { at: b, halves: [stroke(svg, h.a, 'method-ring', b), stroke(svg, h.b, 'method-ring', b)] }
      })
    }

    const show = (el: HTMLElement, on: boolean) => (el.style.opacity = on ? '1' : '0')
    const place = (el: HTMLElement, s: Stroke, e: number, off = { x: 0, y: 0 }) => {
      if (!s.len) return
      const pt = s.path.getPointAtLength(s.len * e)
      el.style.transform = `translate3d(${off.x + pt.x}px, ${off.y + pt.y}px, 0)`
    }
    const draw = (s: Stroke, e: number) => (s.path.style.strokeDashoffset = `${s.len * (1 - e)}`)

    // Every stroke from the clock alone, so a pause, a resize or motion switched off all land in place.
    let shown = ''
    const paint = () => {
      const ms = elapsed.current
      const now = methodAt(ms, PLAN)
      for (const s of PLAN) {
        const done = ms >= s.end ? 1 : ms <= s.start ? 0 : -1
        const lit = String(methodFade(ms, s.end))
        const drawn = (h: Stroke, e: number) => {
          draw(h, e)
          h.path.style.opacity = lit
        }
        if (s.kind === 'around') rings[s.i]?.halves.forEach((h) => drawn(h, done >= 0 ? done : easeInOutSine(now.f)))
        if (s.kind === 'line' && lines[s.i]) drawn(lines[s.i], done >= 0 ? done : easeInOutCubic(now.f))
      }
      const b = PLAN[0]
      const fade = Math.max(0, 1 - (ms - b.end) / 500)
      burst.style.opacity = String(now.seg.kind === 'burst' ? now.f : fade)
      burst.style.transform = `scale(${now.seg.kind === 'burst' ? 0.2 + 0.8 * now.f : 1})`
      const around = now.seg.kind === 'around' && now.tracing !== null
      sparks.forEach((el, k) => {
        show(el, around)
        if (around) place(el, rings[now.seg.i].halves[k], easeInOutSine(now.f), rings[now.seg.i].at)
      })
      show(dot, now.seg.kind === 'line')
      if (now.seg.kind === 'line') place(dot, lines[now.seg.i], easeInOutCubic(now.f))
      const key = `${now.locked}:${now.tracing}`
      if (key !== shown) {
        shown = key
        setRun({ locked: now.locked, tracing: now.tracing })
      }
    }

    lay()
    paint()
    const ro =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(() => {
            lay()
            paint()
          })
    ro?.observe(stage)
    if (still) return () => ro?.disconnect()

    // The clock runs on past the last card until its border has faded.
    const end = PLAN[PLAN.length - 1].end + METHOD.fadeMs
    let seen = typeof IntersectionObserver === 'undefined'
    let raf = 0
    let last: number | undefined
    const frame = (now: number) => {
      raf = 0
      if (!seen || held.current) return (last = undefined)
      // A frame after a long gap (a hidden tab) moves the run on by one frame, not the gap.
      if (last !== undefined) elapsed.current += Math.min(now - last, 100)
      last = now
      paint()
      if (elapsed.current < end) raf = requestAnimationFrame(frame)
    }
    wake.current = () => {
      if (!raf && elapsed.current < end) raf = requestAnimationFrame(frame)
    }
    const io = seen
      ? undefined
      : new IntersectionObserver(
          ([entry]) => {
            seen = entry.isIntersecting
            if (seen) wake.current()
          },
          { rootMargin: '0px 0px -20% 0px' },
        )
    io?.observe(section)
    wake.current()
    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      wake.current = () => {}
      io?.disconnect()
      ro?.disconnect()
    }
  }, [still])

  return (
    <section id={m.id} ref={ref} aria-label={m.label} className="scroll-mt-[88px] shell:scroll-mt-6">
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="flex flex-col gap-[clamp(14px,1.6cqw,20px)] p-[clamp(14px,1.6cqw,22px)]">
        <header className="flex flex-col gap-[9px] border-b border-b1 px-1 pb-[clamp(14px,1.6cqw,20px)]">
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{m.kicker}</span>
          <h2 className="sr-only">{PROCESS.map((st) => st.name).join(' · ')}</h2>
          <p className="max-w-[560px] text-[13px] leading-[1.55] text-ink3">{m.body}</p>
        </header>
        <div ref={stageRef} className="relative">
          <ol aria-label={m.stepsLabel} className="flex flex-col gap-7 shell:grid shell:grid-cols-5 shell:gap-6">
            {PROCESS.map((st, i) => (
              <li
                key={st.n}
                data-gate
                data-state={gateLook(i, at.locked, at.tracing)}
                data-hover={focus === i || undefined}
                tabIndex={0}
                onMouseEnter={() => setFocus(i)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(i)}
                onBlur={() => setFocus(null)}
                className="method-gate relative min-w-0 rounded-[20px]"
              >
                <div className="method-step relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[20px] p-5">
                  <span aria-hidden className="method-num">
                    {st.n}
                  </span>
                  <span aria-hidden className="method-icon">
                    {i === 0 && <span className="method-burst" />}
                    <st.icon size={18} className="relative" />
                  </span>
                  <div className="relative flex items-baseline gap-2">
                    <h3 className="text-[17px] font-semibold tracking-[-.02em]">{st.name}</h3>
                    <span className="font-mono text-[9.5px] tracking-[.12em] text-ink3">{st.key}</span>
                  </div>
                  <p className="relative text-[12.5px] leading-[1.55] text-ink3">{st.line}</p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                    {st.items.map((it) => (
                      <span key={it} className={TAG}>
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <svg aria-hidden="true" className="method-wire" />
          <i aria-hidden className="method-spark" />
          <i aria-hidden className="method-spark" />
          <i aria-hidden className="method-dot" />
        </div>
      </Frame>
    </section>
  )
}
