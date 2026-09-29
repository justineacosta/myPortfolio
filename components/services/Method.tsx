'use client'

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import Frame from '@/components/ui/Frame'
import { TAG } from '@/components/ui/styles'
import { METHOD_MS, PROCESS, servicesPage } from '@/data/services'
import { useDragScroll } from '@/hooks/useDragScroll'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useWheelToX } from '@/hooks/useWheelToX'

/**
 * The Kraft Method (KraftScreens.dc.html:217-241, 989-995, 1112-1125): five
 * gates, one lit at a time, advancing every METHOD_MS while the frame is on
 * screen; the lit gate's rail fills over that time. With reduced motion (the
 * OS setting or the access menu, followed live) the first gate stays lit and
 * still, its rail full. A header row names the five steps; under it they sit
 * in one row from the sidebar breakpoint, and below that in a strip you
 * swipe, drag, wheel or arrow-key sideways. The strip never moves on its own.
 */
export default function Method() {
  const m = servicesPage.method
  const [step, setStep] = useState(0)
  const still = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const strip = useDragScroll(useWheelToX<HTMLOListElement>())

  useEffect(() => {
    if (still) return
    let timer: number | undefined
    const start = () => {
      if (timer === undefined) timer = window.setInterval(() => setStep((s) => (s + 1) % PROCESS.length), METHOD_MS)
    }
    const stop = () => {
      window.clearInterval(timer)
      timer = undefined
    }
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      start()
      return stop
    }
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    io.observe(el)
    return () => {
      io.disconnect()
      stop()
    }
  }, [still])

  return (
    <section
      id={m.id}
      ref={ref}
      aria-label={m.label}
      className="scroll-mt-[88px] shell:scroll-mt-6"
      style={{ '--method-ms': `${METHOD_MS}ms` } as CSSProperties}
    >
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="flex flex-col gap-[clamp(14px,1.6cqw,20px)] p-[clamp(14px,1.6cqw,22px)]">
        <header className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3 border-b border-b1 px-1 pb-[clamp(14px,1.6cqw,20px)]">
          <div className="flex flex-col gap-[9px]">
            <span className="font-mono text-[10px] tracking-[.16em] text-accent">{m.kicker}</span>
            <h2 className="text-[clamp(18px,2cqw,26px)] leading-[1.2] font-semibold tracking-[-.025em]">
              {PROCESS.map((st, i) => (
                <Fragment key={st.n}>
                  {i > 0 && ' '}
                  {st.name}
                  {i < PROCESS.length - 1 && (
                    <>
                      {' '}
                      <span className="text-[.7em] text-ink4">·</span>
                    </>
                  )}
                </Fragment>
              ))}
            </h2>
          </div>
          <p className="max-w-[440px] text-[13px] leading-[1.55] text-ink3">{m.body}</p>
        </header>
        <ol
          ref={strip}
          data-wheel-x
          tabIndex={0}
          aria-label={m.stepsLabel}
          className="flex gap-[clamp(11px,1.3cqw,16px)] rounded-[20px] max-shell:-mb-7 max-shell:cursor-grab max-shell:snap-x max-shell:snap-mandatory max-shell:overflow-x-auto max-shell:overscroll-x-contain max-shell:pb-7 max-shell:[scrollbar-width:none] data-dragging:cursor-grabbing data-dragging:snap-none data-dragging:select-none shell:grid shell:grid-cols-5 max-shell:[&::-webkit-scrollbar]:hidden"
        >
          {PROCESS.map((st, i) => (
            <li
              key={st.n}
              data-on={i === (still ? 0 : step) || undefined}
              className="method-step relative flex min-w-0 flex-col gap-2.5 overflow-hidden rounded-[20px] p-5 max-shell:flex-[0_0_clamp(220px,84%,300px)] max-shell:snap-start"
            >
              <span aria-hidden className="method-rail">
                <span className="method-fill" />
              </span>
              <span aria-hidden className="method-num">
                {st.n}
              </span>
              <span aria-hidden className="method-icon">
                <st.icon size={18} />
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
            </li>
          ))}
        </ol>
      </Frame>
    </section>
  )
}
