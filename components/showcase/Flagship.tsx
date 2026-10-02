'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import Image from 'next/image'
import { ArrowUpRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react/ssr'
import FlowStrip, { PEEK_SLUG } from '@/components/projects/FlowStrip'
import { PLATFORMS } from '@/data/automations'
import { BUSINESSES, showcase, TALL } from '@/data/showcase'
import { brandIcon } from '@/data/stack'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import Cta from './Cta'

/**
 * The four sample businesses (data/showcase.ts). The copy column is the tab
 * panel; beside it a browser window scrolls down the business's site while
 * its flow runs underneath.
 *
 * The auto-advance clock is the active progress bar's CSS animation
 * (globals.css .flag-bar). When it ends, the next tab opens. Holding it is
 * just pausing that animation, and the shot's scroll and the strip's pulse
 * pause with it: under the pointer, while anything here has focus, while the
 * block is off screen. With reduced motion there is no clock at all and the
 * shot holds at the top. Switching tabs remounts the bars, so the clock restarts.
 */
export default function Flagship() {
  const f = showcase.flagship
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [inView, setInView] = useState(true)
  const [paused, setPaused] = useState(false)
  const still = useReducedMotion()
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // On a phone the tab bar scrolls, so keep the open tab in it. Only the bar
  // scrolls: scrollIntoView would also move the page while the bar is off screen.
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const tab = tabs.current[active]
    if (list.current && tab) list.current.scrollTo?.({ left: tab.offsetLeft - 5, behavior: still ? 'auto' : 'smooth' })
  }, [active, still])

  const running = !still && !paused && !hover && !focus && inView
  const b = BUSINESSES[active]
  const n = BUSINESSES.length
  const tabId = (code: string) => `flag-tab-${code.toLowerCase()}`

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const next =
      e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1
    if (next < 0) return
    e.preventDefault()
    setActive(next)
    tabs.current[next]?.focus()
  }

  return (
    <div
      ref={root}
      data-flagship
      className="grid gap-x-[clamp(24px,4cqw,64px)] gap-y-7 shell:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] shell:items-center"
      style={{ '--flag-ms': `${f.ms}ms` } as CSSProperties}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocus(false)
      }}
    >
      <div key={b.code} id="flag-panel" role="tabpanel" aria-labelledby={tabId(b.code)} className="flex animate-rise flex-col items-start gap-4">
        <span className="font-mono text-[10px] tracking-[.16em] text-accent">
          {f.eyebrow} · {b.trade.toUpperCase()}
        </span>
        <h2 className="text-[clamp(26px,3.4cqw,44px)] leading-[1.05] font-bold tracking-[-.03em] text-balance">{b.name}</h2>
        <p className="max-w-[46ch] text-[14px] leading-[1.6] text-ink2">{b.line}</p>
        <div className="flex flex-col gap-2.5">
          <h3 className="font-mono text-[10px] tracking-[.16em] text-ink3 uppercase">{f.built}</h3>
          <ul className="flex flex-col gap-1.5">
            {b.built.map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink underline decoration-b2 underline-offset-4 transition-colors hover:decoration-accent">
                  {l.label} <ArrowUpRightIcon size={13} aria-hidden className="text-ink3" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Cta label={f.open} href={b.src} />
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div aria-hidden className="overflow-hidden rounded-[14px] border border-b2 bg-s0 shadow-(--shot-shadow)">
          <div className="flex items-center gap-2 border-b border-b1 bg-s0 px-3.5 py-2.5">
            <span className="size-[11px] shrink-0 rounded-full bg-mac-r" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-y" />
            <span className="size-[11px] shrink-0 rounded-full bg-mac-g" />
            <span className="ml-3 truncate rounded-full border border-b1 bg-s1 px-3.5 py-[5px] font-mono text-[11.5px] text-accent">{b.src}</span>
          </div>
          <div className="@container relative aspect-[16/10] overflow-hidden bg-bg">
            {/* Re-keyed per tab, so the scroll starts again at the top. */}
            <div key={b.code} className="flag-shot" data-run={running || undefined} data-still={still || undefined}>
              <Image src={b.tall} alt="" width={TALL.width} height={TALL.height} sizes="(min-width: 1100px) 640px, 100vw" loading="eager" className="block h-auto w-full" />
            </div>
          </div>
        </div>

        <div key={`strip-${b.code}`} aria-hidden className="flag-strip @container flex flex-col gap-3 rounded-[14px] border border-b1 bg-s0 px-4 py-3.5" data-run={running || undefined}>
          <span className="font-mono text-[10px] tracking-[.14em] text-ink3">
            <span className="uppercase">{b.flow.title}</span> · {PLATFORMS[b.platform].name}
          </span>
          <FlowStrip flow={b.flow} />
        </div>

        <div ref={list} role="tablist" aria-label={f.tabsLabel} className="relative flex max-w-full gap-1.5 self-start overflow-x-auto rounded-[14px] border border-b1 bg-s1 p-[5px]">
          {BUSINESSES.map((x, i) => {
            const on = i === active
            return (
              <button
                key={x.code}
                ref={(el) => {
                  tabs.current[i] = el
                }}
                type="button"
                role="tab"
                id={tabId(x.code)}
                aria-selected={on}
                aria-controls="flag-panel"
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-200 ${on ? 'bg-accent text-on-accent' : 'text-ink3 hover:bg-hover hover:text-ink'}`}
              >
                <Image src={brandIcon(PEEK_SLUG[PLATFORMS[x.platform].tool]!)} alt="" width={15} height={15} className="size-[15px] rounded-[3px] bg-logo-chip p-px" />
                {x.short}
              </button>
            )
          })}
        </div>
        <p key={`cap-${b.code}`} id="flag-caption" className="min-h-[3.1em] max-w-[60ch] animate-rise text-[14px] leading-[1.55] text-ink2">
          {b.flow.outcome}
        </p>
        <div className="flex items-center gap-3">
          <div key={active} aria-hidden className="flex flex-1 gap-1.5">
            {BUSINESSES.map((x, i) =>
              i === active && !still ? (
                <span key={x.code} className="flag-bar" data-on data-run={running || undefined} onAnimationEnd={() => setActive((a) => (a + 1) % n)} />
              ) : (
                <span key={x.code} className="flag-bar" data-full={(still && i === active) || undefined} />
              ),
            )}
          </div>
          {!still && (
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? f.playLabel : f.pauseLabel}
              className="flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-b1 bg-s2 px-3.5 text-[12.5px] font-medium text-ink2 transition-colors duration-250 hover:border-b2 hover:text-ink"
            >
              {paused ? <PlayIcon size={14} weight="fill" aria-hidden className="text-accent" /> : <PauseIcon size={14} weight="fill" aria-hidden className="text-accent" />}
              {paused ? f.play : f.pause}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
