'use client'

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import Image from 'next/image'
import { ArrowsClockwiseIcon } from '@phosphor-icons/react/ssr'
import { projects } from '@/data/projects'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import {
  FRONT,
  nearestSlot,
  OFF,
  PEEK_DELAY_MS,
  POSES,
  slotOf,
  SPIN_MS,
  SPREAD,
  SWIPE_CLICK_MS,
  TAP_SLOP_PX,
  TILT_DEG,
  TOUCH_HOLD_MS,
} from '@/lib/fan'
import { BODY, CARD, CTA, TILE, TITLE } from './styles'

type Props = { onOpen: (e: MouseEvent<HTMLAnchorElement>) => void }

/**
 * The Funnels and sites card: a link to the sites view whose fan of sample
 * sites turns one step every SPIN_MS while it is on screen, so every site
 * takes the front. A mouse over the fan spreads and tilts it and brings the
 * tile under the pointer forward, names it, and, once the pointer rests,
 * scrolls down its page. A finger swiping across the fan scrubs it the same
 * way (a tap still opens the view). Keyboard focus holds the fan and names
 * the front site. With reduced motion it neither turns, tilts nor scrolls.
 * The fan is a picture; the link's name is the card's text.
 */
export default function SitesCard({ onOpen }: Props) {
  const c = projects.cards.sites
  const sites = projects.sitesView.sites
  const still = useReducedMotion()
  const card = useRef<HTMLAnchorElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [turn, setTurn] = useState(0)
  /** The arc slot a pointer or finger has brought forward. */
  const [focus, setFocus] = useState<number | null>(null)
  /** A mouse is over the fan, or a finger is on it (or just left it). */
  const [held, setHeld] = useState(false)
  const [keyboard, setKeyboard] = useState(false)
  const [peek, setPeek] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [shown, setShown] = useState(true)
  const touch = useRef<{ x0: number; moved: boolean } | null>(null)
  const swallowClick = useRef(false)
  const peekTimer = useRef<number | undefined>(undefined)
  const holdTimer = useRef<number | undefined>(undefined)
  const swallowTimer = useRef<number | undefined>(undefined)

  // Only turn while the card is on screen and the tab is visible.
  useEffect(() => {
    const el = card.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    const onVis = () => setShown(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const spinning = !still && onScreen && shown && !held && !keyboard
  useEffect(() => {
    if (!spinning) return
    const t = window.setInterval(() => setTurn((n) => n + 1), SPIN_MS)
    return () => window.clearInterval(t)
  }, [spinning])

  useEffect(
    () => () => {
      window.clearTimeout(peekTimer.current)
      window.clearTimeout(holdTimer.current)
      window.clearTimeout(swallowTimer.current)
    },
    [],
  )

  /** Brings slot `s` forward, and (for a mouse, with motion on) peeks down its page after a rest. */
  const bring = (s: number, withPeek: boolean) => {
    if (s === focus) return
    setFocus(s)
    setPeek(false)
    window.clearTimeout(peekTimer.current)
    if (withPeek && !still) peekTimer.current = window.setTimeout(() => setPeek(true), PEEK_DELAY_MS)
  }

  const tilt = (x: number, y: number) => {
    stage.current?.style.setProperty('--tx', `${(-y * TILT_DEG.x).toFixed(2)}deg`)
    stage.current?.style.setProperty('--ty', `${(x * TILT_DEG.y).toFixed(2)}deg`)
  }

  /** Where a pointer is across the fan: its offset from the centre in px, and -1..1 each way. */
  const locate = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const dx = e.clientX - (box.left + box.width / 2)
    const dy = e.clientY - (box.top + box.height / 2)
    return { dx, nx: box.width ? (2 * dx) / box.width : 0, ny: box.height ? (2 * dy) / box.height : 0 }
  }

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const at = locate(e)
    if (e.pointerType === 'touch') {
      const t = touch.current
      if (!t) return
      if (Math.abs(e.clientX - t.x0) > TAP_SLOP_PX) t.moved = true
      if (t.moved) bring(nearestSlot(at.dx, SPREAD), false)
      return
    }
    setHeld(true)
    bring(nearestSlot(at.dx, SPREAD), true)
    if (!still) tilt(at.nx, at.ny)
  }

  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    setHeld(false)
    setFocus(null)
    setPeek(false)
    window.clearTimeout(peekTimer.current)
    tilt(0, 0)
  }

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return
    window.clearTimeout(holdTimer.current)
    touch.current = { x0: e.clientX, moved: false }
    setHeld(true)
  }

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch' || !touch.current) return
    // A swipe is not a tap: the click a browser may send straight after it does
    // not open the view. Browsers often send none, so the flag only lasts a moment.
    swallowClick.current = touch.current.moved
    window.clearTimeout(swallowTimer.current)
    if (touch.current.moved) swallowTimer.current = window.setTimeout(() => (swallowClick.current = false), SWIPE_CLICK_MS)
    touch.current = null
    holdTimer.current = window.setTimeout(() => {
      setHeld(false)
      setFocus(null)
    }, TOUCH_HOLD_MS)
  }

  const front = focus ?? FRONT
  const named = focus !== null ? focus : keyboard ? FRONT : null
  const namedSite = named === null ? undefined : sites.find((_, i) => slotOf(i, turn, sites.length) === named)

  return (
    <a
      ref={card}
      href="#sites"
      onClick={(e) => {
        if (swallowClick.current) {
          swallowClick.current = false
          e.preventDefault()
          return
        }
        onOpen(e)
      }}
      onFocus={() => setKeyboard(true)}
      onBlur={() => setKeyboard(false)}
      data-case={c.cue}
      className={`${CARD} min-w-[min(260px,100%)] flex-[2_1_320px]`}
    >
      <span aria-hidden className={TILE}>
        <c.icon size={20} className="text-accent" />
      </span>
      <h2 className={TITLE}>{c.title}</h2>
      <p className={BODY}>{c.body}</p>
      <span className={CTA}>
        {c.cta} <ArrowsClockwiseIcon size={13} aria-hidden />
      </span>
      <div
        data-fan
        aria-hidden
        onPointerEnter={onMove}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onPointerDown={onDown}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="site-fan relative mt-2.5 h-[clamp(150px,16cqw,200px)] touch-pan-y overflow-hidden"
      >
        <span data-fan-tag data-on={namedSite ? '' : undefined} className="fan-tag">
          <span className="size-1.5 rounded-full bg-accent" />
          {namedSite?.name}
        </span>
        <div ref={stage} data-spread={held || undefined} style={{ '--spread': held ? SPREAD : 1 } as CSSProperties} className="fan-stage">
          {sites.map((site, i) => {
            const slot = slotOf(i, turn, sites.length)
            const onArc = typeof slot === 'number'
            const pose = onArc ? POSES[slot] : OFF[slot]
            const isFront = slot === front
            const style = {
              '--x': pose.x,
              '--y': pose.y,
              '--r': pose.r,
              '--d': onArc ? 2 - Math.abs(slot - FRONT) : 0,
              zIndex: isFront ? 20 : onArc ? 10 - Math.abs(slot - front) : 0,
            } as CSSProperties
            return (
              <div
                key={site.file}
                data-fan-tile
                data-site={site.name}
                data-front={isFront || undefined}
                data-off={!onArc || undefined}
                data-peek={(isFront && peek) || undefined}
                style={style}
                className="fan-tile"
              >
                <Image src={site.tall} alt="" width={432} height={1540} sizes="130px" draggable={false} className="fan-page" />
              </div>
            )
          })}
        </div>
      </div>
    </a>
  )
}
