'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { showcase, TABS } from '@/data/showcase'
import Cta from './Cta'
import Mock from './Mock'

/**
 * The Flagship build (kape Flagship.tsx, spec §9). The copy and CTA sit
 * beside a browser window holding the product mock, with five tabs below.
 *
 * The auto-advance clock is the active progress bar's CSS animation
 * (globals.css .flag-bar). When it ends, the next tab opens. Holding it is
 * just pausing that animation: under the pointer, while anything here has
 * focus, while the block is off screen. With reduced motion there is no
 * clock at all. Switching tabs remounts the bars, so the clock restarts.
 */
export default function Flagship() {
  const f = showcase.flagship
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [inView, setInView] = useState(true)
  const still = useReducedMotion()
  const column = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = column.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = !still && !hover && !focus && inView
  const tab = TABS[active]

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = TABS.length
    const next =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div className="grid gap-x-[clamp(24px,4cqw,64px)] gap-y-7 shell:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] shell:items-center">
      <div className="flex flex-col items-start gap-4">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">{f.eyebrow}</span>
        <h2 className="text-[clamp(26px,3.4cqw,44px)] leading-[1.05] font-bold tracking-[-.03em]">{f.name}</h2>
        <p className="max-w-[46ch] text-[14px] leading-[1.6] text-ink2">{f.desc}</p>
        <Cta label={f.cta.label} href={f.cta.href} soon={f.cta.soon} />
      </div>

      <div
        ref={column}
        className="flex min-w-0 flex-col gap-4"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setFocus(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
        }}
      >
        <div aria-hidden className="overflow-hidden rounded-[14px] border border-b2 bg-s0 shadow-(--shot-shadow)">
          <div className="flex items-center gap-2 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="ml-3 truncate rounded-full border border-b1 bg-s1 px-3.5 py-[5px] font-mono text-[11.5px]">
              <span className="text-ink2">{f.host}</span>
              <span className="text-accent">{tab.path}</span>
            </span>
          </div>
          <div className="@container relative aspect-[16/10] overflow-hidden bg-bg">
            {/* Re-keyed per tab: the stage remounts and its pieces rise in again. */}
            <div key={tab.id} className="size-full text-[clamp(5.5px,1.92cqw,15px)]">
              <Mock tab={tab} />
            </div>
          </div>
        </div>

        <div role="tablist" aria-label={f.tabsLabel} className="flex max-w-full gap-1.5 self-start overflow-x-auto rounded-[14px] border border-b1 bg-s1 p-[5px]">
          {TABS.map((t, i) => {
            const on = i === active
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={`flag-tab-${t.id}`}
                aria-selected={on}
                aria-controls="flag-caption"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${on ? 'bg-accent text-on-accent' : 'text-ink3 hover:bg-hover hover:text-ink'}`}
              >
                <t.icon size={15} aria-hidden />
                {t.label}
              </button>
            )
          })}
        </div>
        <p
          key={tab.id}
          id="flag-caption"
          role="tabpanel"
          aria-labelledby={`flag-tab-${tab.id}`}
          className="min-h-[4.65em] max-w-[60ch] animate-rise text-[14px] leading-[1.55] text-ink2"
        >
          {tab.caption}
        </p>
        <div key={active} aria-hidden className="flex gap-1.5" style={{ '--flag-ms': `${f.ms}ms` } as CSSProperties}>
          {TABS.map((t, i) =>
            i === active && !still ? (
              <span key={t.id} className="flag-bar" data-on data-run={running || undefined} onAnimationEnd={() => setActive((a) => (a + 1) % TABS.length)} />
            ) : (
              <span key={t.id} className="flag-bar" data-full={(still && i === active) || undefined} />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
