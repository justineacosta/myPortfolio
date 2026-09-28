'use client'

import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react'
import Frame from '@/components/ui/Frame'
import { CARD, TAG } from '@/components/ui/styles'
import { METHOD_MS, PROCESS, servicesPage } from '@/data/services'
import { useReducedMotion } from '@/hooks/useReducedMotion'

/**
 * The Kraft Method (KraftScreens.dc.html:217-241, 989-995, 1112-1125): five
 * gates, one lit at a time, advancing every METHOD_MS while the frame is on
 * screen. With reduced motion (the OS setting or the access menu, followed
 * live) the first gate stays lit and still.
 */
export default function Method() {
  const m = servicesPage.method
  const [step, setStep] = useState(0)
  const still = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

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
      className="scroll-mt-[88px]"
      style={{ '--method-ms': `${METHOD_MS}ms` } as CSSProperties}
    >
      <Frame lit={{ x: '12%', alpha: 0.55, stop: '58%' }} className="flex flex-wrap gap-[clamp(11px,1.3cqw,18px)] p-[clamp(11px,1.3cqw,18px)]">
        <div className={`${CARD} flex min-w-[220px] flex-[1_1_240px] flex-col gap-[9px] p-5`}>
          <span className="font-mono text-[10px] tracking-[.16em] text-accent">{m.kicker}</span>
          <h2 className="text-[clamp(18px,2cqw,24px)] leading-[1.2] font-semibold tracking-[-.025em]">
            {m.title.map((line, i) => (
              <Fragment key={line}>
                {i > 0 && ' '}
                <span className="block">{line}</span>
              </Fragment>
            ))}
          </h2>
          <p className="text-[13px] leading-[1.55] text-ink3">{m.body}</p>
        </div>
        {PROCESS.map((st, i) => (
          <div
            key={st.n}
            data-on={i === (still ? 0 : step) || undefined}
            className="method-step relative flex min-w-[215px] flex-[1_1_230px] flex-col gap-2.5 overflow-hidden rounded-[20px] p-5"
          >
            <span aria-hidden className="method-rail" />
            <span aria-hidden className="method-spark" />
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
            <div className="mt-auto flex flex-wrap gap-1.5">
              {st.items.map((it) => (
                <span key={it} className={TAG}>
                  {it}
                </span>
              ))}
            </div>
          </div>
        ))}
      </Frame>
    </section>
  )
}
